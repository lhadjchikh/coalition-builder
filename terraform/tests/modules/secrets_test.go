package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"

	"terraform-tests/common"
)

func TestSecretsModulePasswordValidation(t *testing.T) {
	t.Parallel()

	testConfig := common.NewTestConfig("../../modules/secrets")

	// Test case 1: Password protection disabled should succeed
	t.Run("PasswordProtectionDisabledSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":                 testConfig.Prefix,
				"app_db_username":        "test_user",
				"app_db_password":        "test_password",
				"db_endpoint":            "test.endpoint.amazonaws.com:5432",
				"db_name":                "test_db",
				"site_password_enabled":  false,
				"site_password":          "", // Empty password is OK when disabled
			},
			NoColor: true,
		}

		// This should succeed
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 2: Password protection enabled with password should succeed
	t.Run("PasswordProtectionEnabledWithPasswordSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":                 testConfig.Prefix,
				"app_db_username":        "test_user",
				"app_db_password":        "test_password",
				"db_endpoint":            "test.endpoint.amazonaws.com:5432",
				"db_name":                "test_db",
				"site_password_enabled":  true,
				"site_password":          "secure-test-password",
			},
			NoColor: true,
		}

		// This should succeed
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 3: Password protection enabled without password should fail
	t.Run("PasswordProtectionEnabledWithoutPasswordFails", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":                 testConfig.Prefix,
				"app_db_username":        "test_user",
				"app_db_password":        "test_password",
				"db_endpoint":            "test.endpoint.amazonaws.com:5432",
				"db_name":                "test_db",
				"site_password_enabled":  true,
				// Intentionally not setting site_password
			},
			NoColor: true,
		}

		// This should fail validation
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "site_password must be provided when site_password_enabled is true")
	})

	// Test case 4: Empty password with protection enabled should fail
	t.Run("EmptyPasswordWithProtectionEnabledFails", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/secrets",
			Vars: map[string]interface{}{
				"prefix":                 testConfig.Prefix,
				"app_db_username":        "test_user",
				"app_db_password":        "test_password",
				"db_endpoint":            "test.endpoint.amazonaws.com:5432",
				"db_name":                "test_db",
				"site_password_enabled":  true,
				"site_password":          "", // Empty password
			},
			NoColor: true,
		}

		// This should fail validation
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "site_password must be provided when site_password_enabled is true")
	})
}