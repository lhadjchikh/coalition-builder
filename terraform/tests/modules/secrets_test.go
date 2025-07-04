package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"

	"terraform-tests/common"
)

func TestSecretsModuleBasicValidation(t *testing.T) {
	t.Parallel()

	testConfig := common.NewTestConfig("../../modules/secrets")

	// Test case 1: Default configuration (site password secret always created)
	t.Run("DefaultConfigurationWorks", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":          testConfig.Prefix,
				"app_db_username": "test_user",
				"app_db_password": "test_password",
				"db_endpoint":     "test.endpoint.amazonaws.com:5432",
				"db_name":         "test_db",
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
		assert.NoError(t, err, "Default secrets configuration should initialize successfully")
	})

	// Test case 2: Custom site password
	t.Run("CustomSitePasswordWorks", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":          testConfig.Prefix,
				"app_db_username": "test_user",
				"app_db_password": "test_password",
				"db_endpoint":     "test.endpoint.amazonaws.com:5432",
				"db_name":         "test_db",
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

		// This should succeed with custom password
		_, err := terraform.InitE(t, terraformOptions)
		assert.NoError(t, err, "Custom site password configuration should initialize successfully")
	})

	// Test case 3: Empty password (should use fallback)
	t.Run("EmptyPasswordUsesFallback", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":          testConfig.Prefix,
				"app_db_username": "test_user",
				"app_db_password": "test_password",
				"db_endpoint":     "test.endpoint.amazonaws.com:5432",
				"db_name":         "test_db",
				"site_password":   "", // Explicitly empty, should use "changeme" fallback
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

		// This should succeed - empty password uses "changeme" fallback
		_, err := terraform.InitE(t, terraformOptions)
		assert.NoError(t, err, "Empty password should use fallback and initialize successfully")
	})
}
