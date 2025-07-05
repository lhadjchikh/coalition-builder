package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestLoadbalancerModuleValidation(t *testing.T) {
	t.Parallel()

	// Test case 1: Loadbalancer module with valid inputs
	t.Run("ValidInputs", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/loadbalancer",
			Vars: map[string]interface{}{
				"prefix":                "test-coalition",
				"vpc_id":                "vpc-12345678",
				"public_subnet_ids":     []string{"subnet-12345678", "subnet-87654321"},
				"alb_security_group_id": "sg-12345678",
				"alb_logs_bucket":       "test-alb-logs-bucket",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
				"waf_web_acl_arn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/" +
					"test-web-acl/12345678-1234-1234-1234-123456789012",
				"health_check_path_api": "/health/",
				"health_check_path_ssr": "/health",
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

		// Run terraform init and validate
		terraform.Init(t, terraformOptions)
		terraform.Validate(t, terraformOptions)
	})

	// Test case 2: Loadbalancer module with minimal inputs (using defaults)
	t.Run("MinimalInputsWithDefaults", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/loadbalancer",
			Vars: map[string]interface{}{
				"vpc_id":                "vpc-12345678",
				"public_subnet_ids":     []string{"subnet-12345678", "subnet-87654321"},
				"alb_security_group_id": "sg-12345678",
				"alb_logs_bucket":       "test-alb-logs-bucket",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
				"waf_web_acl_arn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/" +
					"test-web-acl/12345678-1234-1234-1234-123456789012",
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

		// Run terraform init and validate
		terraform.Init(t, terraformOptions)
		terraform.Validate(t, terraformOptions)
	})

	// Test case 3: Loadbalancer module with missing required variable
	t.Run("MissingVpcId", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/loadbalancer",
			Vars: map[string]interface{}{
				"public_subnet_ids":     []string{"subnet-12345678", "subnet-87654321"},
				"alb_security_group_id": "sg-12345678",
				"alb_logs_bucket":       "test-alb-logs-bucket",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
				"waf_web_acl_arn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/" +
					"test-web-acl/12345678-1234-1234-1234-123456789012",
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

		// Run terraform init
		terraform.Init(t, terraformOptions)

		// Validate should fail due to missing required variable
		_, err := terraform.ValidateE(t, terraformOptions)
		assert.Error(t, err, "Expected validation to fail with missing vpc_id")
	})

	// Test case 4: Loadbalancer module with empty subnet list
	t.Run("EmptySubnetList", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/loadbalancer",
			Vars: map[string]interface{}{
				"vpc_id":                "vpc-12345678",
				"public_subnet_ids":     []string{},
				"alb_security_group_id": "sg-12345678",
				"alb_logs_bucket":       "test-alb-logs-bucket",
				"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
				"waf_web_acl_arn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/" +
					"test-web-acl/12345678-1234-1234-1234-123456789012",
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

		// Run terraform init and validate
		terraform.Init(t, terraformOptions)
		terraform.Validate(t, terraformOptions)
	})
}

func TestLoadbalancerModuleOutputs(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../modules/loadbalancer",
		Vars: map[string]interface{}{
			"prefix":                "test-coalition",
			"vpc_id":                "vpc-12345678",
			"public_subnet_ids":     []string{"subnet-12345678", "subnet-87654321"},
			"alb_security_group_id": "sg-12345678",
			"alb_logs_bucket":       "test-alb-logs-bucket",
			"acm_certificate_arn":   "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
			"waf_web_acl_arn": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/" +
				"test-web-acl/12345678-1234-1234-1234-123456789012",
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

	// Run terraform init and plan to check outputs
	terraform.Init(t, terraformOptions)
	planStruct := terraform.InitAndPlan(t, terraformOptions)

	// Check that outputs are defined
	assert.Contains(t, planStruct, "alb_dns_name", "alb_dns_name output should be defined")
	assert.Contains(t, planStruct, "alb_zone_id", "alb_zone_id output should be defined")
	assert.Contains(t, planStruct, "api_target_group_arn", "api_target_group_arn output should be defined")
	assert.Contains(t, planStruct, "ssr_target_group_arn", "ssr_target_group_arn output should be defined")
	assert.Contains(t, planStruct, "http_listener_arn", "http_listener_arn output should be defined")
	assert.Contains(t, planStruct, "https_listener_arn", "https_listener_arn output should be defined")
}
