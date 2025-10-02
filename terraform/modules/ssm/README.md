# SSM Parameter Store Module (Hybrid Approach)

This module manages simple application secrets using AWS Systems Manager Parameter Store, with environment-specific database URLs for dev/staging/prod isolation.

## Architecture: One RDS, Three Databases

- **Single RDS Instance**: One RDS instance hosting multiple databases
- **Three Databases**: `coalition_dev`, `coalition_staging`, `coalition_prod`
- **Environment Isolation**: Each environment gets its own database and SSM parameter
- **Shared Credentials**: Same username/password across environments (configurable)

## Hybrid Secrets Management Strategy

| Secret Type                           | Storage Solution    | Use Case                                           |
| ------------------------------------- | ------------------- | -------------------------------------------------- |
| Database URLs (per env)               | SSM Parameter Store | Environment-specific connection strings            |
| Simple strings (secret key, password) | SSM Parameter Store | Single values that don't need JSON path extraction |
| Complex JSON objects (SES SMTP)       | Secrets Manager     | Multiple related values accessed via JSON paths    |

## Resources Created

- **SSM Parameters**:
  - Database URLs (one per environment):
    - `/coalition-builder/dev/database-url`
    - `/coalition-builder/staging/database-url`
    - `/coalition-builder/prod/database-url`
  - Django secret key: `/coalition-builder/secret-key`
  - Site password: `/coalition-builder/site-password`
- **IAM Policy**: Read access for ECS tasks

## Why This Hybrid Approach?

### Use SSM Parameter Store When

- Storing simple string values
- No need for JSON path extraction in ECS
- Want to save costs (FREE)

### Keep Secrets Manager When

- Storing complex JSON objects
- Need JSON path extraction (e.g., `${arn}:EMAIL_HOST::`)
- Need automatic rotation capabilities
- Have multiple related values in one secret

## Usage

```hcl
module "ssm" {
  source = "./modules/ssm"

  prefix            = "coalition-builder"
  db_endpoint       = module.database.db_instance_endpoint
  db_name_prefix    = "coalition"  # Creates coalition_dev, coalition_staging, coalition_prod
  app_db_username   = var.app_db_username
  app_db_password   = var.app_db_password
  django_secret_key = var.django_secret_key
  site_password     = var.site_password
  environments      = ["dev", "staging", "prod"]

  tags = local.common_tags
}

# In compute module, use production by default
module "compute" {
  source = "./modules/compute"

  db_url_parameter_arn      = module.ssm.production_db_url_arn  # Uses prod database
  secret_key_parameter_arn  = module.ssm.secret_key_parameter_arn
  site_password_parameter_arn = module.ssm.site_password_parameter_arn
  # ...
}
```

## Integration with ECS

In the compute module, reference parameters directly without JSON paths:

```hcl
# For SSM parameters (simple values)
secrets = [
  {
    name      = "SECRET_KEY"
    valueFrom = module.ssm.secret_key_parameter_arn
  },
  {
    name      = "DATABASE_URL"
    valueFrom = module.ssm.db_url_parameter_arn
  },
  {
    name      = "SITE_PASSWORD"
    valueFrom = module.ssm.site_password_parameter_arn
  }
]

# For Secrets Manager (complex JSON)
secrets = [
  {
    name      = "EMAIL_HOST"
    valueFrom = "${module.ses.smtp_secret_arn}:EMAIL_HOST::"
  },
  {
    name      = "EMAIL_PORT"
    valueFrom = "${module.ses.smtp_secret_arn}:EMAIL_PORT::"
  }
]
```

## Security Considerations

- **Encryption**: All parameters use SecureString with AWS-managed KMS
- **Access Control**: IAM policy restricts access to specific parameters
- **Audit**: CloudTrail logs all parameter access

## Outputs

| Name                          | Description                       |
| ----------------------------- | --------------------------------- |
| `db_url_parameter_arn`        | ARN for DATABASE_URL parameter    |
| `secret_key_parameter_arn`    | ARN for SECRET_KEY parameter      |
| `site_password_parameter_arn` | ARN for SITE_PASSWORD parameter   |
| `ssm_read_policy_arn`         | IAM policy for reading parameters |
| `parameter_names`             | Map of parameter names            |
