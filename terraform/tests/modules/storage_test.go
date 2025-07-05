package modules

import (
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestStorageModule(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../../modules/storage")

	testVars := map[string]interface{}{
		"prefix":                 testConfig.Prefix,
		"force_destroy":          true, // Allow cleanup in tests
		"cors_allowed_origins":   []string{"https://example.com", "https://test.com"},
		"enable_versioning":      true,
		"enable_lifecycle_rules": true,
	}

	terraformOptions := testConfig.GetModuleTerraformOptions("../../../modules/storage", testVars)

	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate bucket outputs
	bucketName := terraform.Output(t, terraformOptions, "static_assets_bucket_name")
	bucketArn := terraform.Output(t, terraformOptions, "static_assets_bucket_arn")
	bucketDomain := terraform.Output(t, terraformOptions, "static_assets_bucket_domain_name")
	uploadPolicyArn := terraform.Output(t, terraformOptions, "static_assets_upload_policy_arn")

	// Validate outputs exist and have expected format
	assert.NotEmpty(t, bucketName)
	assert.NotEmpty(t, bucketArn)
	assert.NotEmpty(t, bucketDomain)
	assert.NotEmpty(t, uploadPolicyArn)

	// Validate bucket name format
	assert.Contains(t, bucketName, testConfig.Prefix)
	assert.Contains(t, bucketName, "static-assets")

	// Validate ARN format
	assert.Contains(t, bucketArn, "arn:aws:s3:::")
	assert.Contains(t, bucketArn, bucketName)

	// Validate IAM policy ARN format
	assert.Contains(t, uploadPolicyArn, "arn:aws:iam::")
	assert.Contains(t, uploadPolicyArn, "policy/")
	assert.Contains(t, uploadPolicyArn, testConfig.Prefix)
}

func TestStorageModuleWithDefaultCORS(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../../modules/storage")

	testVars := map[string]interface{}{
		"prefix":                 testConfig.Prefix,
		"force_destroy":          true,
		"cors_allowed_origins":   []string{"*"}, // Test with wildcard
		"enable_versioning":      false,
		"enable_lifecycle_rules": false,
	}

	terraformOptions := testConfig.GetModuleTerraformOptions("../../../modules/storage", testVars)

	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate basic outputs exist
	bucketName := terraform.Output(t, terraformOptions, "static_assets_bucket_name")
	bucketArn := terraform.Output(t, terraformOptions, "static_assets_bucket_arn")

	assert.NotEmpty(t, bucketName)
	assert.NotEmpty(t, bucketArn)
}

func TestStorageModuleMinimalConfig(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../../modules/storage")

	// Test with minimal configuration
	testVars := map[string]interface{}{
		"prefix":        testConfig.Prefix,
		"force_destroy": true, // Required for test cleanup
	}

	terraformOptions := testConfig.GetModuleTerraformOptions("../../../modules/storage", testVars)

	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate all required outputs exist even with minimal config
	outputs := []string{
		"static_assets_bucket_name",
		"static_assets_bucket_arn",
		"static_assets_bucket_domain_name",
		"static_assets_bucket_regional_domain_name",
		"static_assets_bucket_hosted_zone_id",
		"static_assets_upload_policy_arn",
		"cloudfront_origin_access_identity_path",
	}

	for _, output := range outputs {
		value := terraform.Output(t, terraformOptions, output)
		assert.NotEmpty(t, value, "Output %s should not be empty", output)
	}
}
