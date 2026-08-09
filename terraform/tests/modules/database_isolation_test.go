package modules

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const databaseProvisioningScript = "../../modules/database/scripts/provision_environment_databases.sh"

type databaseNameConfiguration struct {
	RDSInitialDatabase   string            `json:"rds_initial_database"`
	EnvironmentDatabases map[string]string `json:"environment_databases"`
}

func readRepositoryFile(t *testing.T, path string) string {
	t.Helper()

	contents, err := os.ReadFile(path)
	require.NoError(t, err)

	return string(contents)
}

func configuredDatabaseNameConfiguration(t *testing.T) databaseNameConfiguration {
	t.Helper()

	databaseNamesJSON := readRepositoryFile(t, "../../modules/database-names/environment_database_names.json")
	var databaseNames databaseNameConfiguration
	require.NoError(t, json.Unmarshal([]byte(databaseNamesJSON), &databaseNames))

	return databaseNames
}

func configuredDatabaseNames(t *testing.T) map[string]string {
	t.Helper()

	return configuredDatabaseNameConfiguration(t).EnvironmentDatabases
}

// #316 Definition of Done: authoritative, discriminating environment database names.
func TestEnvironmentDatabasesUseSharedAuthoritativeNames(t *testing.T) {
	t.Parallel()

	databaseNames := configuredDatabaseNames(t)
	require.Contains(t, databaseNames, "dev")
	require.Contains(t, databaseNames, "prod")
	assert.Equal(t, "coalition_dev", databaseNames["dev"])
	assert.Equal(t, "coalition_prod", databaseNames["prod"])
	assert.Equal(
		t,
		"coalition",
		configuredDatabaseNameConfiguration(t).RDSInitialDatabase,
	)

	sharedMain := readRepositoryFile(t, "../../environments/shared/main.tf")
	databaseNamesModule := readRepositoryFile(t, "../../modules/database-names/main.tf")
	databaseModule := readRepositoryFile(t, "../../modules/database/main.tf")
	databaseSetupScript := readRepositoryFile(t, "../../modules/database/scripts/db_setup.sh")
	sharedOutputs := readRepositoryFile(t, "../../environments/shared/outputs.tf")
	assert.Contains(t, sharedMain, `module "database_names"`)
	assert.Contains(t, databaseNamesModule, `jsondecode(file("${path.module}/environment_database_names.json"))`)
	assert.Contains(t, sharedMain, `db_name                    = module.database_names.rds_initial_database_name`)
	assert.NotContains(t, sharedMain, `db_name                    = module.database_names.environment_database_names["prod"]`)
	assert.Contains(t, databaseModule, `host     = aws_db_instance.postgres.address`)
	assert.Contains(t, databaseModule, `port     = aws_db_instance.postgres.port`)
	assert.Contains(t, databaseModule, `dbname = "postgres"`)
	assert.Contains(t, databaseSetupScript, `"dbname": "postgres"`)
	assert.Contains(t, sharedOutputs, "value       = module.database_names.environment_database_names")

	for _, environment := range []string{"dev", "prod"} {
		environmentMain := readRepositoryFile(t, "../../environments/"+environment+"/main.tf")
		environmentVariables := readRepositoryFile(t, "../../environments/"+environment+"/variables.tf")

		assert.Contains(t, environmentMain, `module "database_names"`)
		assert.Contains(
			t,
			environmentMain,
			`db_name         = module.database_names.environment_database_names["`+environment+`"]`,
		)
		assert.NotContains(t, environmentMain, "shared.outputs.environment_database_names")
		assert.NotContains(t, environmentVariables, `variable "db_name"`)
	}
}

// #316 Definition of Done: readiness gates deployment without disabling targeted cost controls.
func TestDevelopmentTerraformReadinessIsExternalToTheStack(t *testing.T) {
	t.Parallel()

	devVariables := readRepositoryFile(t, "../../environments/dev/variables.tf")
	devOutputs := readRepositoryFile(t, "../../environments/dev/outputs.tf")
	assert.NotContains(t, devVariables, `variable "database_isolation_ready"`)
	assert.NotContains(t, devOutputs, `output "database_isolation_ready"`)
}

// #316 Definition of Done: remove the unused parallel SSM database URL path.
func TestEnvironmentStacksHaveOneRuntimeSecretPath(t *testing.T) {
	t.Parallel()

	for _, environment := range []string{"dev", "prod"} {
		environmentMain := readRepositoryFile(t, "../../environments/"+environment+"/main.tf")

		assert.NotContains(t, environmentMain, `module "ssm"`)
		assert.NotContains(t, environmentMain, "module.ssm")
	}

	_, err := os.Stat("../../modules/ssm")
	assert.ErrorIs(t, err, os.ErrNotExist)
}

// #316 Definition of Done: runtime secrets identify their owning environment.
func TestDatabaseSecretsAreEnvironmentScoped(t *testing.T) {
	t.Parallel()

	secretsMain := readRepositoryFile(t, "../../modules/secrets/main.tf")
	secretsVariables := readRepositoryFile(t, "../../modules/secrets/variables.tf")

	assert.Contains(t, secretsVariables, `variable "environment"`)
	assert.Regexp(t, `Environment\s*=\s*var\.environment`, secretsMain)
	assert.Regexp(t, `DatabaseName\s*=\s*var\.db_name`, secretsMain)
	assert.Contains(
		t,
		secretsMain,
		`url      = "postgis://${var.app_db_username}:${var.app_db_password}@${var.db_endpoint}/${var.db_name}"`,
	)
	assert.Regexp(t, `dbname\s*=\s*var\.db_name`, secretsMain)
}

func provisioningCommand(t *testing.T, extraArguments ...string) *exec.Cmd {
	t.Helper()

	arguments := []string{
		"--endpoint", "database.internal:5432",
		"--master-user", "database_admin",
		"--prod-database", "existing_production",
		"--dev-database", "new_development",
		"--prod-user", "production_app",
		"--dev-user", "development_app",
	}
	arguments = append(arguments, extraArguments...)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	t.Cleanup(cancel)

	return exec.CommandContext(ctx, databaseProvisioningScript, arguments...)
}

// #316 Definition of Done: provision missing databases and least-privilege grants safely.
func TestDatabaseProvisioningUsesNonDestructiveSQL(t *testing.T) {
	t.Parallel()

	command := provisioningCommand(t)
	command.Env = append(
		os.Environ(),
		"PGPASSWORD=master-password",
		"PSQL_BIN=/bin/echo",
	)
	output, err := command.CombinedOutput()
	require.NoError(t, err, string(output))

	psqlArguments := string(output)
	provisioningSQL := readRepositoryFile(t, "../../modules/database/scripts/provision_environment_databases.sql")
	assert.Contains(t, psqlArguments, "new_development")
	assert.Contains(t, psqlArguments, "existing_production")
	assert.Contains(t, psqlArguments, "provision_environment_databases.sql")
	assert.Contains(t, provisioningSQL, "WHERE NOT EXISTS")
	assert.Contains(t, provisioningSQL, "GRANT CONNECT ON DATABASE")
	assert.Contains(t, provisioningSQL, "REVOKE CONNECT ON DATABASE")
	assert.Contains(t, provisioningSQL, "CREATE EXTENSION IF NOT EXISTS postgis")
	assert.NotContains(t, strings.ToUpper(provisioningSQL), "DROP DATABASE")
}

func TestDatabaseProvisioningGuardsFailThroughSQL(t *testing.T) {
	t.Parallel()

	provisioningSQL := readRepositoryFile(t, "../../modules/database/scripts/provision_environment_databases.sql")
	assert.NotContains(t, provisioningSQL, `\quit`)
	for _, privilegedRoleGuard := range []string{
		"rolsuper",
		"rolcreatedb",
		"rolcreaterole",
		"pg_has_role(application_role.rolname, 'rds_superuser', 'member')",
		"Application roles must not inherit from each other",
	} {
		assert.Contains(t, provisioningSQL, privilegedRoleGuard)
	}
	assert.Equal(t, 2, strings.Count(provisioningSQL, "pg_has_role(%L, %L, 'member')"))

	privilegeGuardPosition := strings.Index(provisioningSQL, "rolsuper")
	databaseCreationPosition := strings.Index(provisioningSQL, "CREATE DATABASE")
	assert.GreaterOrEqual(t, privilegeGuardPosition, 0)
	assert.Greater(t, databaseCreationPosition, privilegeGuardPosition)
}

func TestDatabaseProvisioningHelpExitsSuccessfully(t *testing.T) {
	t.Parallel()

	command := exec.Command(databaseProvisioningScript, "--help")
	output, err := command.CombinedOutput()
	require.NoError(t, err, string(output))
	assert.Contains(t, string(output), "Usage:")
	assert.Contains(t, string(output), "--maintenance-database NAME")
}

func TestDatabaseProvisioningRejectsUnknownOptions(t *testing.T) {
	t.Parallel()

	command := exec.Command(databaseProvisioningScript, "--unknown")
	output, err := command.CombinedOutput()
	require.Error(t, err)
	assert.Contains(t, string(output), "unknown option: --unknown")
}

// #316 Definition of Done: prevent database-name or role collisions at the boundary.
func TestDatabaseProvisioningRejectsEnvironmentCollisions(t *testing.T) {
	t.Parallel()

	for _, collision := range [][]string{
		{"--dev-database", "existing_production"},
		{"--dev-user", "production_app"},
	} {
		command := provisioningCommand(t, collision...)
		command.Env = append(os.Environ(), "PGPASSWORD=master-password")

		output, err := command.CombinedOutput()
		require.Error(t, err)
		assert.Contains(t, string(output), "must be distinct")
	}
}

// #316 Definition of Done: document rollout, verification, and rollback controls.
func TestDatabaseIsolationRunbookCoversSafeRollout(t *testing.T) {
	t.Parallel()

	runbook := readRepositoryFile(t, "../../../docs/deployment/database-isolation.md")
	for _, databaseName := range configuredDatabaseNames(t) {
		assert.Contains(t, runbook, databaseName)
	}
	for _, requiredGuidance := range []string{
		"## Authoritative isolation model",
		"## Rollout",
		"### Back up production",
		"### Provision the development database",
		"### Verify isolation",
		"## Rollback",
		"provision_environment_databases.sh",
		"Do not point development back at production",
	} {
		assert.Contains(t, runbook, requiredGuidance)
	}
}
