package modules

import (
	"path/filepath"
	"strings"
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestSESModuleStructure(t *testing.T) {
	common.ValidateModuleStructure(t, "ses")
}

func TestSESModulePlanCreatesExpectedResources(t *testing.T) {
	if !testing.Short() {
		t.Skip("Skipping validation-only test in full mode")
	}

	testConfig := common.NewTestConfig("../../modules/ses")

	terraformOptions := testConfig.GetTerraformOptionsForPlanOnly(map[string]interface{}{
		"prefix":                 testConfig.Prefix,
		"aws_region":             testConfig.AWSRegion,
		"domain_name":            "test.example.com",
		"from_email":             "noreply@test.example.com",
		"verify_domain":          true,
		"create_route53_records": false,
		"enable_notifications":   true,
		"notification_email":     "alerts@test.example.com",
		"dmarc_email":            "dmarc@test.example.com",
	})
	terraformOptions.TerraformDir = testConfig.TerraformDir
	terraformOptions.PlanFilePath = filepath.Join(testConfig.TerraformDir, "tfplan")

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

	// Verify resource counts - the plan should create resources, not be empty
	assert.Greater(t, len(planStruct.ResourcePlannedValuesMap), 0, "Plan should create resources")

	// Verify key SES resources are in the plan
	expectedResourceTypes := map[string]bool{
		"aws_ses_configuration_set": false,
		"aws_iam_user":              false,
		"aws_iam_access_key":        false,
		"aws_secretsmanager_secret": false,
	}

	for addr, resource := range planStruct.ResourcePlannedValuesMap {
		if resource == nil {
			continue
		}
		for resType := range expectedResourceTypes {
			if strings.Contains(addr, resType) {
				expectedResourceTypes[resType] = true
			}
		}
	}

	for resType, found := range expectedResourceTypes {
		assert.True(t, found, "Expected resource type %s in plan", resType)
	}
}

func TestSESModulePlanWithDomainVerification(t *testing.T) {
	if !testing.Short() {
		t.Skip("Skipping validation-only test in full mode")
	}

	testConfig := common.NewTestConfig("../../modules/ses")

	terraformOptions := testConfig.GetTerraformOptionsForPlanOnly(map[string]interface{}{
		"prefix":                 testConfig.Prefix,
		"aws_region":             testConfig.AWSRegion,
		"domain_name":            "test.example.com",
		"from_email":             "noreply@test.example.com",
		"verify_domain":          true,
		"create_route53_records": false,
		"enable_notifications":   false,
		"dmarc_email":            "",
	})
	terraformOptions.TerraformDir = testConfig.TerraformDir
	terraformOptions.PlanFilePath = filepath.Join(testConfig.TerraformDir, "tfplan")

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

	// With verify_domain=true, should include domain identity and DKIM resources
	hasDomainIdentity := false
	hasDKIM := false

	for addr := range planStruct.ResourcePlannedValuesMap {
		if strings.Contains(addr, "aws_ses_domain_identity") {
			hasDomainIdentity = true
		}
		if strings.Contains(addr, "aws_ses_domain_dkim") {
			hasDKIM = true
		}
	}

	assert.True(t, hasDomainIdentity, "Plan with verify_domain=true should include SES domain identity")
	assert.True(t, hasDKIM, "Plan with verify_domain=true should include DKIM configuration")
}

func TestSESModulePlanWithNotificationsDisabled(t *testing.T) {
	if !testing.Short() {
		t.Skip("Skipping validation-only test in full mode")
	}

	testConfig := common.NewTestConfig("../../modules/ses")

	terraformOptions := testConfig.GetTerraformOptionsForPlanOnly(map[string]interface{}{
		"prefix":                 testConfig.Prefix,
		"aws_region":             testConfig.AWSRegion,
		"domain_name":            "test.example.com",
		"from_email":             "noreply@test.example.com",
		"verify_domain":          false,
		"verify_email":           true,
		"create_route53_records": false,
		"enable_notifications":   false,
		"dmarc_email":            "",
	})
	terraformOptions.TerraformDir = testConfig.TerraformDir
	terraformOptions.PlanFilePath = filepath.Join(testConfig.TerraformDir, "tfplan")

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

	// With enable_notifications=false, should NOT include SNS topic
	hasSNSTopic := false

	for addr := range planStruct.ResourcePlannedValuesMap {
		if strings.Contains(addr, "aws_sns_topic") {
			hasSNSTopic = true
		}
	}

	assert.False(t, hasSNSTopic, "Plan with enable_notifications=false should not include SNS topic")
}
