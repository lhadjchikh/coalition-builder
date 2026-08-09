package modules

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const databaseProvisioningScript = "../../modules/database/scripts/provision_environment_databases.sh"

func readRepositoryFile(t *testing.T, path string) string {
	t.Helper()

	contents, err := os.ReadFile(path)
	require.NoError(t, err)

	return string(contents)
}

func configuredDatabaseNames(t *testing.T) map[string]string {
	t.Helper()

	sharedVariables := readRepositoryFile(t, "../../environments/shared/variables.tf")
	defaultMapMatch := regexp.MustCompile(
		`(?s)variable "environment_database_names"\s*\{.*?default\s*=\s*\{(.*?)\n\s*\}`,
	).FindStringSubmatch(sharedVariables)
	require.Len(t, defaultMapMatch, 2, "shared must define the database-name authority")

	nameMatches := regexp.MustCompile(`(?m)^\s*([a-z]+)\s*=\s*"([^"]+)"`).FindAllStringSubmatch(defaultMapMatch[1], -1)
	databaseNames := make(map[string]string, len(nameMatches))
	for _, nameMatch := range nameMatches {
		databaseNames[nameMatch[1]] = nameMatch[2]
	}

	return databaseNames
}

// #316 Definition of Done: authoritative, discriminating environment database names.
func TestEnvironmentDatabasesUseSharedAuthoritativeNames(t *testing.T) {
	t.Parallel()

	databaseNames := configuredDatabaseNames(t)
	require.Contains(t, databaseNames, "dev")
	require.Contains(t, databaseNames, "prod")
	assert.NotEqual(t, databaseNames["dev"], databaseNames["prod"])

	sharedMain := readRepositoryFile(t, "../../environments/shared/main.tf")
	sharedOutputs := readRepositoryFile(t, "../../environments/shared/outputs.tf")
	assert.Contains(t, sharedMain, `db_name                    = var.environment_database_names["prod"]`)
	assert.Contains(t, sharedOutputs, "value       = var.environment_database_names")

	for _, environment := range []string{"dev", "prod"} {
		environmentMain := readRepositoryFile(t, "../../environments/"+environment+"/main.tf")
		environmentVariables := readRepositoryFile(t, "../../environments/"+environment+"/variables.tf")

		assert.Contains(
			t,
			environmentMain,
			`db_name         = data.terraform_remote_state.shared.outputs.environment_database_names["`+environment+`"]`,
		)
		assert.NotContains(t, environmentVariables, `variable "db_name"`)
	}
}

// #316 Definition of Done: every dev Terraform apply requires an explicit rollout gate.
func TestDevelopmentTerraformRequiresDatabaseIsolationReadiness(t *testing.T) {
	t.Parallel()

	devVariables := readRepositoryFile(t, "../../environments/dev/variables.tf")
	devOutputs := readRepositoryFile(t, "../../environments/dev/outputs.tf")
	assert.Contains(t, devVariables, `variable "database_isolation_ready"`)
	assert.Regexp(t, `condition\s*=\s*var\.database_isolation_ready`, devVariables)
	assert.Regexp(t, `value\s*=\s*var\.database_isolation_ready`, devOutputs)
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
func TestDatabaseProvisioningIsIdempotentAndNonDestructive(t *testing.T) {
	t.Parallel()

	temporaryDirectory := t.TempDir()
	capturePrefix := filepath.Join(temporaryDirectory, "psql")
	fakePsqlPath := filepath.Join(temporaryDirectory, "psql")
	fakePsql := "#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' \"$@\" >\"${PSQL_CAPTURE}.args\"\n"
	require.NoError(t, os.WriteFile(fakePsqlPath, []byte(fakePsql), 0o700))

	command := provisioningCommand(t)
	command.Env = append(
		os.Environ(),
		"PGPASSWORD=master-password",
		"PSQL_BIN="+fakePsqlPath,
		"PSQL_CAPTURE="+capturePrefix,
	)
	output, err := command.CombinedOutput()
	require.NoError(t, err, string(output))

	psqlArguments := readRepositoryFile(t, capturePrefix+".args")
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
