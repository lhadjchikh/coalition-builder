package integration

import (
	"fmt"
	"os"
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestMainConfiguration(t *testing.T) {
	// Skip this test if not in CI (requires S3 backend)
	if os.Getenv("CI") == "" && os.Getenv("AWS_ACCOUNT_ID") == "" {
		t.Skip("Skipping integration test - requires CI environment or AWS_ACCOUNT_ID with S3 backend")
	}

	testConfig := common.SetupIntegrationTest(t)
	testVars := common.GetIntegrationTestVars()

	// Configure for deployment
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s.example.com", testConfig.UniqueID)
	testVars["alert_email"] = "test@example.com"
	testVars["db_password"] = "SuperSecurePassword123!"
	testVars["app_db_password"] = "AppPassword123!"
	testVars["bastion_key_name"] = "test-key"
	testVars["create_new_key_pair"] = false

	terraformOptions := testConfig.GetTerraformOptions(testVars)

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Validate all expected outputs are defined
	expectedOutputs := []string{
		"vpc_id", "public_subnet_ids", "private_subnet_ids", "database_endpoint",
		"database_name", "bastion_public_ip",
		"static_assets_bucket_name", "static_assets_bucket_arn",
		"cloudfront_distribution_domain_name", "cloudfront_distribution_id",
		"zappa_deployment_role_name", "zappa_s3_bucket",
	}

	for _, output := range expectedOutputs {
		assert.Contains(t, planOutput, output, "Plan should define %s output", output)
	}

	// Validate key resources are created
	expectedResources := []string{
		"module.networking.aws_vpc.main", "module.networking.aws_subnet.public",
		"module.networking.aws_subnet.private", "module.networking.aws_subnet.private_db",
		"module.database.aws_db_instance.postgres",
		"module.bastion.aws_instance.bastion",
		"module.zappa.aws_s3_bucket.zappa_deployments",
		"module.zappa.aws_security_group.lambda",
		"module.storage.aws_s3_bucket.static_assets",
		"module.storage.aws_cloudfront_distribution.static_assets",
		"module.storage.aws_cloudfront_origin_access_identity.static_assets",
	}

	for _, resource := range expectedResources {
		assert.Contains(t, planOutput, resource, "Plan should create %s resource", resource)
	}

	// Verify the plan completes successfully
	assert.Contains(t, planOutput, "Plan:", "Plan should complete successfully")
	assert.NotContains(t, planOutput, "Error:", "Plan should not contain errors")
}

func TestMainConfigurationValidation(t *testing.T) {
	// Skip this test if not in CI (requires S3 backend)
	if os.Getenv("CI") == "" && os.Getenv("AWS_ACCOUNT_ID") == "" {
		t.Skip("Skipping integration test - requires CI environment or AWS_ACCOUNT_ID with S3 backend")
	}

	testConfig := common.SetupIntegrationTest(t)

	testVars := common.GetIntegrationTestVars()
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s-complete.example.com", testConfig.UniqueID)
	testVars["alert_email"] = "test@example.com"
	testVars["db_password"] = "SuperSecurePassword123!"
	testVars["app_db_password"] = "AppPassword123!"
	testVars["bastion_key_name"] = "test-key"
	testVars["create_new_key_pair"] = false

	terraformOptions := testConfig.GetTerraformOptions(testVars)

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Should succeed and contain main components
	assert.Contains(t, planOutput, "module.networking.aws_vpc.main", "Plan should create VPC")
	assert.Contains(t, planOutput, "module.database.aws_db_instance.postgres", "Plan should create database")
	assert.Contains(t, planOutput, "module.bastion.aws_instance.bastion", "Plan should create bastion host")
	assert.Contains(t, planOutput, "module.zappa.aws_s3_bucket.zappa_deployments", "Plan should create Zappa S3 bucket")
}

func TestMainConfigurationCORS(t *testing.T) {
	// Skip this test if not in CI (requires S3 backend for subtests)
	if os.Getenv("CI") == "" {
		t.Skip("Skipping CORS subtests - requires CI environment with S3 backend")
	}

	// Test default CORS configuration
	t.Run("DefaultCORS", func(t *testing.T) {
		testConfig := common.SetupIntegrationTest(t)

		testVars := common.GetIntegrationTestVars()
		domainName := fmt.Sprintf("%s-cors.example.com", testConfig.UniqueID)
		testVars["domain_name"] = domainName
		testVars["route53_zone_id"] = "Z123456789ABCDEF"
		testVars["alert_email"] = "test@example.com"
		testVars["db_password"] = "SuperSecurePassword123!"
		testVars["app_db_password"] = "AppPassword123!"
		testVars["bastion_key_name"] = "test-key"
		testVars["create_new_key_pair"] = false

		terraformOptions := testConfig.GetTerraformOptions(testVars)

		terraform.Init(t, terraformOptions)
		planOutput := terraform.Plan(t, terraformOptions)

		assert.Contains(t, planOutput, "module.storage.aws_s3_bucket_cors_configuration", "Plan should configure CORS")
		assert.Contains(t, planOutput, domainName, "Plan should reference domain in CORS config")
	})

	// Test explicit CORS configuration
	t.Run("ExplicitCORS", func(t *testing.T) {
		testConfig := common.SetupIntegrationTest(t)

		testVars := common.GetIntegrationTestVars()
		testVars["domain_name"] = fmt.Sprintf("%s-explicit.example.com", testConfig.UniqueID)
		testVars["static_assets_cors_origins"] = []string{"https://custom1.example.com", "https://custom2.example.com"}
		testVars["route53_zone_id"] = "Z123456789ABCDEF"
		testVars["alert_email"] = "test@example.com"
		testVars["db_password"] = "SuperSecurePassword123!"
		testVars["app_db_password"] = "AppPassword123!"
		testVars["bastion_key_name"] = "test-key"
		testVars["create_new_key_pair"] = false

		terraformOptions := testConfig.GetTerraformOptions(testVars)

		terraform.Init(t, terraformOptions)
		planOutput := terraform.Plan(t, terraformOptions)

		assert.Contains(t, planOutput, "custom1.example.com", "Plan should include custom CORS origin")
		assert.Contains(t, planOutput, "custom2.example.com", "Plan should include custom CORS origin")
	})
}
