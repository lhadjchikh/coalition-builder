package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestDnsModuleValidation(t *testing.T) {
	t.Parallel()

	// Test case 1: DNS module with valid inputs
	t.Run("ValidInputs", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/dns",
			Vars: map[string]interface{}{
				"route53_zone_id": "Z123456789ABCDEF",
				"domain_name":     "example.com",
				"alb_dns_name":    "test-alb-123456789.us-east-1.elb.amazonaws.com",
				"alb_zone_id":     "Z35SXDOTRQ7X7K",
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

	// Test case 2: DNS module with missing route53_zone_id
	t.Run("MissingZoneId", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/dns",
			Vars: map[string]interface{}{
				"domain_name":  "example.com",
				"alb_dns_name": "test-alb-123456789.us-east-1.elb.amazonaws.com",
				"alb_zone_id":  "Z35SXDOTRQ7X7K",
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
		assert.Error(t, err, "Expected validation to fail with missing route53_zone_id")
	})

	// Test case 3: DNS module with invalid domain name format
	t.Run("InvalidDomainName", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/dns",
			Vars: map[string]interface{}{
				"route53_zone_id": "Z123456789ABCDEF",
				"domain_name":     "invalid..domain",
				"alb_dns_name":    "test-alb-123456789.us-east-1.elb.amazonaws.com",
				"alb_zone_id":     "Z35SXDOTRQ7X7K",
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

func TestDnsModuleOutputs(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../modules/dns",
		Vars: map[string]interface{}{
			"route53_zone_id": "Z123456789ABCDEF",
			"domain_name":     "test-example.com",
			"alb_dns_name":    "test-alb-123456789.us-east-1.elb.amazonaws.com",
			"alb_zone_id":     "Z35SXDOTRQ7X7K",
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

	// Run terraform init and plan to check outputs are defined in plan
	terraform.Init(t, terraformOptions)
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Check that outputs are defined in the plan output
	assert.Contains(t, planOutput, "website_url", "website_url output should be defined")
	assert.Contains(t, planOutput, "dns_record_name", "dns_record_name output should be defined")
}
