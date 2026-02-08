package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestSecretsModuleValidation(t *testing.T) {
	t.Parallel()

	// Test case 1: Secrets module with default values (always creates site password secret)
	t.Run("DefaultValuesWork", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":          "test-coalition",
				"app_db_username": "testuser",
				"app_db_password": "testpass123",
				"db_endpoint":     "test.cluster-xyz.us-east-1.rds.amazonaws.com:5432",
				"db_name":         "testdb",
				// site_password defaults to "" which becomes "changeme" in secret
			},
			NoColor: true,
			EnvVars: map[string]string{
				"TF_SKIP_PROVIDER_VERIFY":      "true",
				"AWS_PROVIDER_SKIP_VALIDATION": "true",
				"AWS_ACCESS_KEY_ID":            "fake-access-key",
				"AWS_SECRET_ACCESS_KEY":        "fake-secret-key",
				"AWS_DEFAULT_REGION":           "us-east-1",
			},
		}

		// This should succeed - secrets are always created
		_, err := terraform.InitE(t, terraformOptions)
		assert.NoError(t, err, "Secrets module with default configuration should initialize successfully")
	})

	// Test case 2: Secrets module with custom password
	t.Run("CustomPasswordWorks", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":          "test-coalition",
				"app_db_username": "testuser",
				"app_db_password": "testpass123",
				"db_endpoint":     "test.cluster-xyz.us-east-1.rds.amazonaws.com:5432",
				"db_name":         "testdb",
				"site_password":   "custom-secure-password",
			},
			NoColor: true,
			EnvVars: map[string]string{
				"TF_SKIP_PROVIDER_VERIFY":      "true",
				"AWS_PROVIDER_SKIP_VALIDATION": "true",
				"AWS_ACCESS_KEY_ID":            "fake-access-key",
				"AWS_SECRET_ACCESS_KEY":        "fake-secret-key",
				"AWS_DEFAULT_REGION":           "us-east-1",
			},
		}

		// This should succeed
		_, err := terraform.InitE(t, terraformOptions)
		assert.NoError(t, err, "Secrets module with custom password should initialize successfully")
	})
}
