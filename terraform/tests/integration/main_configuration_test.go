package integration

import (
	"fmt"
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestMainConfigurationWithoutSSR(t *testing.T) {

	testConfig := common.SetupIntegrationTest(t)
	testVars := common.GetIntegrationTestVars()

	// Configure for deployment without SSR
	testVars["enable_ssr"] = false
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s.example.com", testConfig.UniqueID)
	testVars["acm_certificate_arn"] = fmt.Sprintf("arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
	testVars["alert_email"] = "test@example.com"
	testVars["db_password"] = "SuperSecurePassword123!"
	testVars["app_db_password"] = "AppPassword123!"
	testVars["bastion_key_name"] = "test-key"
	testVars["create_new_key_pair"] = false

	terraformOptions := testConfig.GetTerraformOptions(testVars)

	// Run terraform init and plan - validate configuration works
	terraform.Init(t, terraformOptions)

	t.Logf("Starting terraform plan")
	planOutput := terraform.Plan(t, terraformOptions)
	t.Logf("Terraform plan completed successfully")

	// Validate all expected outputs are defined
	expectedOutputs := []string{
		"vpc_id", "public_subnet_ids", "private_subnet_ids", "private_db_subnet_ids",
		"db_instance_id", "db_instance_endpoint", "ecs_cluster_name", "alb_dns_name",
		"api_ecr_repository_url", "static_assets_bucket_name", "static_assets_bucket_arn",
	}

	for _, output := range expectedOutputs {
		assert.Contains(t, planOutput, output, "Plan should define %s output", output)
	}

	// Validate key resources are created
	expectedResources := []string{
		"aws_vpc.main", "aws_subnet.public", "aws_subnet.private", "aws_subnet.private_db",
		"aws_db_instance.main", "aws_ecs_cluster.main", "aws_lb.main",
		"aws_ecr_repository.api", "aws_s3_bucket.static_assets",
	}

	for _, resource := range expectedResources {
		assert.Contains(t, planOutput, resource, "Plan should create %s resource", resource)
	}

	// Validate SSR is disabled
	assert.Contains(t, planOutput, "enable_ssr = false", "Plan should disable SSR")
	// When SSR is disabled, SSR ECR repo should not be created
	assert.NotContains(t, planOutput, "aws_ecr_repository.ssr", "Plan should not create SSR ECR when disabled")
}

func TestMainConfigurationWithSSR(t *testing.T) {

	testConfig := common.SetupIntegrationTest(t)
	testVars := common.GetIntegrationTestVars()

	// Configure for deployment with SSR enabled
	testVars["enable_ssr"] = true
	testVars["route53_zone_id"] = "Z123456789ABCDEF"
	testVars["domain_name"] = fmt.Sprintf("%s-ssr.example.com", testConfig.UniqueID)
	testVars["acm_certificate_arn"] = fmt.Sprintf("arn:aws:acm:us-east-1:123456789012:certificate/%s", testConfig.UniqueID)
	testVars["alert_email"] = "test@example.com"
	testVars["db_password"] = "SuperSecurePassword123!"
	testVars["app_db_password"] = "AppPassword123!"
	testVars["bastion_key_name"] = "test-key"
	testVars["create_new_key_pair"] = false

	terraformOptions := testConfig.GetTerraformOptions(testVars)

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Validate SSR-specific outputs and resources
	assert.Contains(t, planOutput, "enable_ssr = true", "Plan should enable SSR")
	assert.Contains(t, planOutput, "ssr_ecr_repository_url", "Plan should define SSR ECR output")
	assert.Contains(t, planOutput, "aws_ecr_repository.ssr", "Plan should create SSR ECR when enabled")

	// Validate both API and SSR target groups exist
	assert.Contains(t, planOutput, "aws_lb_target_group.api", "Plan should create API target group")
	assert.Contains(t, planOutput, "aws_lb_target_group.ssr", "Plan should create SSR target group")
}

func TestMainConfigurationValidation(t *testing.T) {

	// Test missing required variables
	t.Run("MissingRequiredVariables", func(t *testing.T) {
		testConfig := common.SetupIntegrationTest(t)

		// Only provide minimal variables - should fail
		testVars := map[string]interface{}{
			"domain_name": "incomplete.example.com",
		}

		terraformOptions := testConfig.GetTerraformOptions(testVars)

		terraform.Init(t, terraformOptions)
		_, err := terraform.PlanE(t, terraformOptions)
		assert.Error(t, err, "Plan should fail with missing required variables")
	})

	// Test with all required variables
	t.Run("CompleteConfiguration", func(t *testing.T) {
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
		assert.Contains(t, planOutput, "aws_vpc.main", "Plan should create VPC")
		assert.Contains(t, planOutput, "aws_db_instance.main", "Plan should create database")
		assert.Contains(t, planOutput, "aws_ecs_cluster.main", "Plan should create ECS cluster")
	})
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

		assert.Contains(t, planOutput, "aws_s3_bucket_cors_configuration", "Plan should configure CORS")
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
