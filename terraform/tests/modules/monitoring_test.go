package modules

import (
	"context"
	"testing"

	"terraform-tests/common"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/budgets"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestMonitoringModuleValidation runs validation-only tests that don't require AWS credentials
func TestMonitoringModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "monitoring")
}

func TestMonitoringModuleCreatesSNSTopics(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/monitoring")
	testVars := common.GetMonitoringTestVars()

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/monitoring", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate SNS topics exist
	budgetTopicArn := terraform.Output(t, terraformOptions, "budget_alerts_sns_topic_arn")
	anomalyTopicArn := terraform.Output(t, terraformOptions, "cost_anomaly_sns_topic_arn")

	assert.NotEmpty(t, budgetTopicArn)
	assert.NotEmpty(t, anomalyTopicArn)

	// Create AWS client
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(testConfig.AWSRegion))
	assert.NoError(t, err)

	snsClient := sns.NewFromConfig(cfg)

	// Verify budget alerts topic exists
	budgetInput := &sns.GetTopicAttributesInput{
		TopicArn: aws.String(budgetTopicArn),
	}
	budgetResult, err := snsClient.GetTopicAttributes(context.TODO(), budgetInput)
	assert.NoError(t, err)
	assert.NotNil(t, budgetResult.Attributes)

	// Verify cost anomaly topic exists
	anomalyInput := &sns.GetTopicAttributesInput{
		TopicArn: aws.String(anomalyTopicArn),
	}
	anomalyResult, err := snsClient.GetTopicAttributes(context.TODO(), anomalyInput)
	assert.NoError(t, err)
	assert.NotNil(t, anomalyResult.Attributes)
}

func TestMonitoringModuleCreatesBudget(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/monitoring")
	testVars := common.GetMonitoringTestVars()

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/monitoring", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Create AWS client
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(testConfig.AWSRegion))
	assert.NoError(t, err)

	budgetsClient := budgets.NewFromConfig(cfg)

	// List budgets to verify our budget exists
	input := &budgets.DescribeBudgetsInput{
		AccountId: aws.String(testConfig.AccountID),
	}

	result, err := budgetsClient.DescribeBudgets(context.TODO(), input)
	assert.NoError(t, err)

	// Find our test budget
	budgetFound := false
	expectedBudgetName := testConfig.Prefix + "-monthly-budget"

	for _, budget := range result.Budgets {
		if budget.BudgetName == nil || *budget.BudgetName != expectedBudgetName {
			continue
		}
		budgetFound = true
		assert.Equal(t, "100", *budget.BudgetLimit.Amount)
		assert.Equal(t, "USD", *budget.BudgetLimit.Unit)
		assert.Equal(t, "MONTHLY", string(budget.TimeUnit))
		break
	}

	assert.True(t, budgetFound, "Budget should be created with correct name")
}

func TestMonitoringModuleCreatesCostAnomalyDetection(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/monitoring")
	testVars := common.GetMonitoringTestVars()

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/monitoring", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate cost anomaly detection outputs
	monitorArn := terraform.Output(t, terraformOptions, "cost_anomaly_monitor_arn")
	subscriptionArn := terraform.Output(t, terraformOptions, "cost_anomaly_subscription_arn")

	assert.NotEmpty(t, monitorArn)
	assert.NotEmpty(t, subscriptionArn)

	// Verify ARNs have correct format
	assert.Contains(t, monitorArn, "arn:aws:ce:")
	assert.Contains(t, subscriptionArn, "arn:aws:ce:")
}

func TestMonitoringModuleCreatesS3Bucket(t *testing.T) {
	common.SkipIfShortTest(t)

	testConfig := common.NewTestConfig("../../modules/monitoring")
	testVars := common.GetMonitoringTestVars()

	terraformOptions := testConfig.GetModuleTerraformOptions("../../modules/monitoring", testVars)
	defer common.CleanupResources(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	// Validate ALB logs bucket
	bucketName := terraform.Output(t, terraformOptions, "alb_logs_bucket")
	assert.NotEmpty(t, bucketName)
	assert.Contains(t, bucketName, testConfig.Prefix)
	assert.Contains(t, bucketName, "alb-logs")
}
