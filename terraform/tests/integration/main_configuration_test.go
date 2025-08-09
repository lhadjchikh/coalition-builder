package integration

import (
	"fmt"
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestMainConfiguration(t *testing.T) {

	testConfig := common.SetupIntegrationTest(t)
	testVars := common.GetIntegrationTestVars()

	// Configure for deployment
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s.example.com", testConfig.UniqueID)
	testVars["acm_certificate_arn"] = fmt.Sprintf("arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
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
		"database_name", "ecs_cluster_name", "load_balancer_dns",
		"api_ecr_repository_url", "ssr_ecr_repository_url", "static_assets_bucket_name", "static_assets_bucket_arn",
		"cloudfront_distribution_domain_name", "cloudfront_distribution_id",
	}

	for _, output := range expectedOutputs {
		assert.Contains(t, planOutput, output, "Plan should define %s output", output)
	}

	// Validate key resources are created
	expectedResources := []string{
		"module.networking.aws_vpc.main", "module.networking.aws_subnet.public",
		"module.networking.aws_subnet.private", "module.networking.aws_subnet.private_db",
		"module.database.aws_db_instance.postgres", "module.compute.aws_ecs_cluster.main",
		"module.loadbalancer.aws_lb.main", "module.compute.aws_ecr_repository.api",
		"module.compute.aws_ecr_repository.ssr", "module.storage.aws_s3_bucket.static_assets",
		"module.storage.aws_cloudfront_distribution.static_assets",
		"module.storage.aws_cloudfront_origin_access_identity.static_assets",
	}

	for _, resource := range expectedResources {
		assert.Contains(t, planOutput, resource, "Plan should create %s resource", resource)
	}

	// Validate both API and SSR target groups exist
	assert.Contains(t, planOutput, "module.loadbalancer.aws_lb_target_group.api", "Plan should create API target group")
	assert.Contains(t, planOutput, "module.loadbalancer.aws_lb_target_group.ssr", "Plan should create SSR target group")

	// Verify the plan completes successfully
	assert.Contains(t, planOutput, "Plan:", "Plan should complete successfully")
	assert.NotContains(t, planOutput, "Error:", "Plan should not contain errors")
}

func TestMainConfigurationValidation(t *testing.T) {

	testConfig := common.SetupIntegrationTest(t)

	testVars := common.GetIntegrationTestVars()
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s-complete.example.com", testConfig.UniqueID)
	testVars["acm_certificate_arn"] = fmt.Sprintf(
		"arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
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
	assert.Contains(t, planOutput, "module.compute.aws_ecs_cluster.main", "Plan should create ECS cluster")
}

func TestMainConfigurationCORS(t *testing.T) {

	// Test default CORS configuration
	t.Run("DefaultCORS", func(t *testing.T) {
		testConfig := common.SetupIntegrationTest(t)

		testVars := common.GetIntegrationTestVars()
		domainName := fmt.Sprintf("%s-cors.example.com", testConfig.UniqueID)
		testVars["domain_name"] = domainName
		testVars["route53_zone_id"] = "Z123456789ABCDEF"
		testVars["acm_certificate_arn"] = fmt.Sprintf(
			"arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
		testVars["alert_email"] = "test@example.com"
		testVars["db_password"] = "SuperSecurePassword123!"
		testVars["app_db_password"] = "AppPassword123!"
		testVars["bastion_key_name"] = "test-key"
		testVars["create_new_key_pair"] = false
		// Don't set static_assets_cors_origins - should default to domain_name

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
		testVars["acm_certificate_arn"] = fmt.Sprintf(
			"arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
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
