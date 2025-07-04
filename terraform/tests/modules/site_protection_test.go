package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"

	"terraform-tests/common"
)

func TestSitePasswordProtectionVariables(t *testing.T) {
	t.Parallel()

	// Test case 1: Password protection disabled (default)
	t.Run("PasswordProtectionDisabledByDefault", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../",
			Vars: map[string]interface{}{
				"route53_zone_id":     "Z1234567890ABC",
				"domain_name":         "test.example.com",
				"acm_certificate_arn": "arn:aws:acm:us-east-1:123456789012:certificate/test",
				"alert_email":         "test@example.com",
				"db_password":         "test-db-password",
				"app_db_password":     "test-app-password",
			},
			NoColor: true,
		}

		// This should succeed without setting site_password
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 2: Password protection enabled without password should fail
	t.Run("PasswordProtectionEnabledWithoutPasswordFails", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../",
			Vars: map[string]interface{}{
				"route53_zone_id":       "Z1234567890ABC",
				"domain_name":           "test.example.com",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/test",
				"alert_email":           "test@example.com",
				"db_password":           "test-db-password",
				"app_db_password":       "test-app-password",
				"site_password_enabled": true,
				// Intentionally not setting site_password
			},
			NoColor: true,
		}

		// This should fail validation
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "site_password must be provided when site_password_enabled is true")
	})

	// Test case 3: Password protection enabled with password should succeed
	t.Run("PasswordProtectionEnabledWithPasswordSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../",
			Vars: map[string]interface{}{
				"route53_zone_id":       "Z1234567890ABC",
				"domain_name":           "test.example.com",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/test",
				"alert_email":           "test@example.com",
				"db_password":           "test-db-password",
				"app_db_password":       "test-app-password",
				"site_password_enabled": true,
				"site_password":         "secure-test-password",
			},
			NoColor: true,
		}

		// This should succeed
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 4: Empty password with protection enabled should fail
	t.Run("EmptyPasswordWithProtectionEnabledFails", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../",
			Vars: map[string]interface{}{
				"route53_zone_id":       "Z1234567890ABC",
				"domain_name":           "test.example.com",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/test",
				"alert_email":           "test@example.com",
				"db_password":           "test-db-password",
				"app_db_password":       "test-app-password",
				"site_password_enabled": true,
				"site_password":         "", // Empty password
			},
			NoColor: true,
		}

		// This should fail validation
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "site_password must be provided when site_password_enabled is true")
	})
}

func TestComputeModulePasswordVariables(t *testing.T) {
	t.Parallel()

	testConfig := common.NewTestConfig("../../modules/compute")

	// Test case 1: Password protection enabled with secret ARN should succeed
	t.Run("PasswordProtectionEnabledWithSecretSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/compute",
			Vars: map[string]interface{}{
				"prefix":                    testConfig.Prefix,
				"aws_region":                testConfig.AWSRegion,
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
			},
			NoColor: true,
		}

		// This should succeed
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 2: Password protection disabled should succeed (default case)
	t.Run("PasswordProtectionDisabledSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/compute",
			Vars: map[string]interface{}{
				"prefix":                    testConfig.Prefix,
				"aws_region":                testConfig.AWSRegion,
				"private_subnet_ids":        []string{"subnet-12345", "subnet-67890"},
				"public_subnet_id":          "subnet-public",
				"app_security_group_id":     "sg-app",
				"bastion_security_group_id": "sg-bastion",
				"api_target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:" +
					"targetgroup/test/1234567890123456",
				"db_url_secret_arn":     "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-db",
				"secret_key_secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-key",
				"secrets_kms_key_arn":   "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
				"site_password_enabled": false,
				// site_password_secret_arn defaults to empty when disabled
			},
			NoColor: true,
		}

		// This should succeed
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})

	// Test case 3: Password protection enabled but no secret ARN provided (graceful handling)
	t.Run("PasswordProtectionEnabledWithoutSecretSucceeds", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/compute",
			Vars: map[string]interface{}{
				"prefix":                    testConfig.Prefix,
				"aws_region":                testConfig.AWSRegion,
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
				"site_password_secret_arn": "", // Empty secret ARN - should work gracefully
			},
			NoColor: true,
		}

		// This should succeed - compute module handles empty secret ARN gracefully
		_, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.NoError(t, err)
	})
}
