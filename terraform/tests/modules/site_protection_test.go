package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestSitePasswordVariableValidation(t *testing.T) {
	t.Parallel()

	// Test case 1: Default values should work (secrets always created)
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
		_, err := terraform.InitAndValidateE(t, terraformOptions)
		assert.NoError(t, err, "Default configuration should validate successfully")
	})

	// Test case 2: Custom password should work
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
		_, err := terraform.InitAndValidateE(t, terraformOptions)
		assert.NoError(t, err, "Custom password configuration should validate successfully")
	})
}

func TestComputeModuleSecretsIntegration(t *testing.T) {
	t.Parallel()

	// Test case 1: Compute module with all required secrets
	t.Run("ComputeModuleWithAllSecrets", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/compute",
			Vars: map[string]interface{}{
				"prefix":                    "test-coalition",
				"aws_region":                "us-east-1",
				"private_subnet_ids":        []string{"subnet-12345", "subnet-67890"},
				"public_subnet_id":          "subnet-public",
				"app_security_group_id":     "sg-app",
				"bastion_security_group_id": "sg-bastion",
				"api_target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:" +
					"targetgroup/test/1234567890123456",
				"db_url_secret_arn":        "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-db",
				"secret_key_secret_arn":    "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-key",
				"secrets_kms_key_arn":      "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
				"site_password_enabled":    true,
				"site_password_secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-site-password",
				"site_username":            "admin",
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

		// This should validate successfully
		_, err := terraform.InitAndValidateE(t, terraformOptions)
		assert.NoError(t, err, "Compute module with all secrets should validate successfully")
	})

	// Test case 2: Compute module with password protection disabled
	t.Run("ComputeModulePasswordDisabled", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/compute",
			Vars: map[string]interface{}{
				"prefix":                    "test-coalition",
				"aws_region":                "us-east-1",
				"private_subnet_ids":        []string{"subnet-12345", "subnet-67890"},
				"public_subnet_id":          "subnet-public",
				"app_security_group_id":     "sg-app",
				"bastion_security_group_id": "sg-bastion",
				"api_target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:" +
					"targetgroup/test/1234567890123456",
				"db_url_secret_arn":     "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-db",
				"secret_key_secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-key",
				"secrets_kms_key_arn":   "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
				"site_password_enabled": false, // Password protection disabled
				// Still required - secret always exists
				"site_password_secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-site-password",
				"site_username":            "admin",
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

		// This should validate successfully - secret ARN is still required even when protection is disabled
		_, err := terraform.InitAndValidateE(t, terraformOptions)
		assert.NoError(t, err, "Compute module with password protection disabled should validate successfully")
	})
}
