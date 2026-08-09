# Shared RDS database isolation

This runbook controls the one-time rollout and ongoing verification of development and production database isolation on the shared RDS PostgreSQL instance.

## Authoritative isolation model

`terraform/modules/database-names/environment_database_names.json` is the single source of truth for logical database names. The database-names module loads that map for the shared, `dev`, and `prod` stacks, while shared state exports it for operational commands. Direct module consumption lets application-account plans remain valid before the new shared-state output has been applied.

| Environment | Database        | Compatibility decision                                                                                                |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `prod`      | `coalition`     | Preserve the existing RDS primary database and all production data. Renaming or replacing it is outside this rollout. |
| `dev`       | `coalition_dev` | Create an empty logical database on the same RDS instance. Development migrations and writes occur only here.         |

Each environment uses a distinct PostgreSQL login role. `PUBLIC` connectivity is revoked on both databases, the production role is denied development access, and the development role is denied production access. The provisioning script applies these grants idempotently.

Secrets Manager is the only active runtime configuration path. Each AWS application account owns a `coalition/database-url` secret tagged with its environment; Terraform builds both its `url` and `dbname` from the shared database-name map. SSM database URL parameters are retired. Lambda resolves the secret URL and does not accept a separate `DATABASE_NAME` override.

The stable secret name intentionally preserves each existing ARN. The deployment validator checks the ARN account, the `Environment` tag, the expected database from the authoritative map, valid JSON, and agreement between the URL path and `dbname` before Zappa configuration or database migrations run.

## Rollout

Do not enable development deployment until the backup, role, database, and verification steps below are complete. The dev Terraform workflow enforces this with the `DATABASE_ISOLATION_READY` GitHub Environment variable.

### Prepare account contexts

Use named AWS CLI profiles for each account so every cross-account command has an explicit credential context. Replace these example profile names with locally configured profiles, then confirm the production and development account IDs before continuing.

```bash
export SHARED_AWS_PROFILE=coalition-shared
export PROD_AWS_PROFILE=coalition-prod
export DEV_AWS_PROFILE=coalition-dev

PROD_AWS_ACCOUNT_ID="$(AWS_PROFILE="${PROD_AWS_PROFILE}" aws sts get-caller-identity --query Account --output text)"
DEV_AWS_ACCOUNT_ID="$(AWS_PROFILE="${DEV_AWS_PROFILE}" aws sts get-caller-identity --query Account --output text)"
export PROD_AWS_ACCOUNT_ID DEV_AWS_ACCOUNT_ID
```

### Back up production

Create a manual snapshot before applying any Terraform or changing roles, grants, or secrets. Replace the identifier if the Terraform `prefix` is not `coalition`.

```bash
snapshot_id="coalition-before-db-isolation-$(date -u +%Y%m%d%H%M%S)"
AWS_PROFILE="${SHARED_AWS_PROFILE}" aws rds create-db-snapshot \
  --db-instance-identifier coalition-db \
  --db-snapshot-identifier "${snapshot_id}" \
  --cli-connect-timeout 5 \
  --cli-read-timeout 30
AWS_PROFILE="${SHARED_AWS_PROFILE}" aws rds wait db-snapshot-completed \
  --db-snapshot-identifier "${snapshot_id}" \
  --cli-connect-timeout 5 \
  --cli-read-timeout 30
```

Record the snapshot identifier and confirm its status is `available`. Do not continue from a failed or incomplete snapshot.

After the snapshot is available, apply only the shared stack so the authoritative map is available in remote state. This changes the RDS module input from the old `db_name` variable to the production entry with the same value, so the plan must show no RDS replacement.

```bash
AWS_PROFILE="${SHARED_AWS_PROFILE}" terraform -chdir=terraform/environments/shared plan
AWS_PROFILE="${SHARED_AWS_PROFILE}" terraform -chdir=terraform/environments/shared apply
AWS_PROFILE="${SHARED_AWS_PROFILE}" terraform -chdir=terraform/environments/shared output -json environment_database_names
```

### Provision the development database

Connect through the shared-account bastion or an SSH tunnel; the RDS instance is private. Obtain the names from shared state instead of typing copies.

```bash
database_names="$(AWS_PROFILE="${SHARED_AWS_PROFILE}" terraform -chdir=terraform/environments/shared output -json environment_database_names)"
prod_database="$(jq -r .prod <<<"${database_names}")"
dev_database="$(jq -r .dev <<<"${database_names}")"
rds_endpoint="$(AWS_PROFILE="${SHARED_AWS_PROFILE}" terraform -chdir=terraform/environments/shared output -raw database_endpoint)"
```

Ensure the existing production login and a distinct development login exist. The role names and passwords must match `APP_DB_USERNAME` and `APP_DB_PASSWORD` in their respective `prod` and `dev` GitHub Environments. Create or rotate the development password interactively with `psql`'s `\password` command so it does not enter shell history. Do not rotate the production password as part of this rollout.

GitHub does not reveal stored secret values. Enter the three known login names explicitly for the provisioning command:

```bash
read -rp "RDS master username: " DB_USERNAME
read -rp "Production application username: " PROD_APP_DB_USERNAME
read -rp "Development application username: " DEV_APP_DB_USERNAME
export DB_USERNAME PROD_APP_DB_USERNAME DEV_APP_DB_USERNAME
```

Run the idempotent provisioning script from a host that can reach RDS. It requires existing roles, refuses missing production data, creates only the missing development database, enables PostGIS there, and applies cross-environment denials before matching grants.

```bash
read -rsp "RDS master password: " PGPASSWORD
export PGPASSWORD
terraform/modules/database/scripts/provision_environment_databases.sh \
  --endpoint "${rds_endpoint}" \
  --master-user "${DB_USERNAME}" \
  --prod-database "${prod_database}" \
  --dev-database "${dev_database}" \
  --prod-user "${PROD_APP_DB_USERNAME}" \
  --dev-user "${DEV_APP_DB_USERNAME}"
unset PGPASSWORD
```

Rerun the command once. The second run must succeed without recreating either database or altering production data.

### Apply application-account Terraform

Set the dev gate only after provisioning succeeds, then apply `prod` and `dev`. The production plan must retain `coalition`; the development secret version must change to `coalition_dev`; and the plans must remove the unused SSM parameters and read-policy attachments.

```bash
gh variable set DATABASE_ISOLATION_READY --env dev --body true
gh workflow run deploy_infra.yml --ref main -f environment=prod
gh workflow run deploy_infra.yml --ref main -f environment=dev
```

The `database_secret_arn` outputs should match the existing `DATABASE_SECRET_ARN` values because the secret names are stable. If an environment was configured with a different ARN, correct it before deploying Lambda.

```bash
prod_secret_arn="$(AWS_PROFILE="${PROD_AWS_PROFILE}" terraform -chdir=terraform/environments/prod output -raw database_secret_arn)"
dev_secret_arn="$(AWS_PROFILE="${DEV_AWS_PROFILE}" terraform -chdir=terraform/environments/dev output -raw database_secret_arn)"
gh secret set DATABASE_SECRET_ARN --env prod --body "${prod_secret_arn}"
gh secret set DATABASE_SECRET_ARN --env dev --body "${dev_secret_arn}"
```

Deploy production and development separately. The deployment-time validator must pass before migrations begin.

```bash
gh workflow run deploy_lambda.yml --ref main -f environment=prod
gh workflow run deploy_lambda.yml --ref main -f environment=dev
```

### Verify isolation

For each account, describe the database secret and confirm the account, `Environment` tag, `dbname`, and URL path without printing the password or full URL. The `backend/scripts/validate_database_secret.py` command performs these checks with bounded AWS request timeouts and is the same validator used by deployment workflows.

```bash
AWS_PROFILE="${PROD_AWS_PROFILE}" poetry -C backend run python scripts/validate_database_secret.py \
  --secret-arn "${prod_secret_arn}" \
  --expected-account-id "${PROD_AWS_ACCOUNT_ID}" \
  --expected-environment prod \
  --expected-database-name "${prod_database}"
AWS_PROFILE="${DEV_AWS_PROFILE}" poetry -C backend run python scripts/validate_database_secret.py \
  --secret-arn "${dev_secret_arn}" \
  --expected-account-id "${DEV_AWS_ACCOUNT_ID}" \
  --expected-environment dev \
  --expected-database-name "${dev_database}"
```

Verify database permissions through the bastion: each matching role must connect to its own database, the development role must receive `permission denied for database coalition` when targeting production, and the production role must receive `permission denied for database coalition_dev` when targeting development.

Verify both Lambda configurations expose the selected environment's secret ARN as `DATABASE_URL`:

```bash
deployed_prod_secret_arn="$(AWS_PROFILE="${PROD_AWS_PROFILE}" aws lambda get-function-configuration \
  --function-name coalition-prod \
  --query 'Environment.Variables.DATABASE_URL' \
  --output text \
  --cli-connect-timeout 5 \
  --cli-read-timeout 30)"
deployed_dev_secret_arn="$(AWS_PROFILE="${DEV_AWS_PROFILE}" aws lambda get-function-configuration \
  --function-name coalition-dev \
  --query 'Environment.Variables.DATABASE_URL' \
  --output text \
  --cli-connect-timeout 5 \
  --cli-read-timeout 30)"
[[ "${deployed_prod_secret_arn}" == "${prod_secret_arn}" ]]
[[ "${deployed_dev_secret_arn}" == "${dev_secret_arn}" ]]
```

`DATABASE_NAME` was a packaged Zappa setting rather than a Lambda API environment variable, so querying `Environment.Variables.DATABASE_NAME` cannot verify its removal. Run the focused configuration tests instead; they verify that generated runtime stages omit the override and that Django uses the database encoded in the resolved secret URL.

```bash
(
  cd backend
  poetry run pytest \
    scripts/tests/test_configure_zappa.py::TestDatabaseIsolation \
    coalition/core/tests/test_lambda_settings.py::LambdaStorageSettingsTest::test_database_name_comes_from_resolved_secret_url \
    --no-cov
)
```

Finally, check each API health endpoint and confirm migrations exist independently in both databases.

## Rollback

If provisioning or dev verification fails, set `DATABASE_ISOLATION_READY=false`, leave the existing production Lambda running, and do not deploy development. Correct the new role or database and rerun the idempotent provisioning and verification steps.

Do not point development back at production after any development migration or write. Application-code rollback must retain the isolated secret URL and database grants; use the Lambda management workflow to roll back code only.

If production validation fails before deployment, correct its unchanged secret ARN or restore the `Environment=prod` tag, then rerun validation. The existing production Lambda remains active because the workflow stops before updating it.

If a production data incident occurs, stop both deployment workflows and follow the RDS snapshot restore procedure to a new instance. Never overwrite the current instance directly. Validate the restored instance and explicitly cut production over after review; development remains on `coalition_dev` and must not be used as a production restore source.

Recreating the retired SSM parameters is not a database rollback. They were not consumed by Lambda and must remain outside the runtime configuration path.
