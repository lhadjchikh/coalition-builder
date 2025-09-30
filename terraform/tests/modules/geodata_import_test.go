package modules

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGeodataImportModule(t *testing.T) {
	t.Parallel()

	// Generate unique names for this test
	uniqueID := random.UniqueId()
	prefix := fmt.Sprintf("test-geodata-%s", strings.ToLower(uniqueID))

	// AWS configuration for validation
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"),
	)
	require.NoError(t, err)

	ecsClient := ecs.NewFromConfig(cfg)
	iamClient := iam.NewFromConfig(cfg)
	logsClient := cloudwatchlogs.NewFromConfig(cfg)

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../../modules/geodata-import",
		Vars: map[string]interface{}{
			"prefix":                prefix,
			"aws_region":            "us-east-1",
			"ecr_repository_url":    "123456789.dkr.ecr.us-east-1.amazonaws.com/test-repo",
			"database_secret_arn":   "arn:aws:secretsmanager:us-east-1:123456789:secret:test-db-secret",
			"django_secret_key_arn": "arn:aws:secretsmanager:us-east-1:123456789:secret:test-django-secret",
			"s3_bucket_arn":         "arn:aws:s3:::test-bucket",
			"tags": map[string]string{
				"Environment": "test",
				"Purpose":     "terratest",
			},
		},
		RetryableTerraformErrors: map[string]string{
			"RequestError: send request failed": "Temporary AWS API error",
		},
		MaxRetries:         3,
		TimeBetweenRetries: 10 * time.Second,
	})

	// Clean up resources with "terraform destroy" at the end of the test
	defer terraform.Destroy(t, terraformOptions)

	// Run "terraform init" and "terraform apply"
	terraform.InitAndApply(t, terraformOptions)

	// Validate outputs
	t.Run("ValidateOutputs", func(t *testing.T) {
		// Test cluster outputs
		clusterName := terraform.Output(t, terraformOptions, "cluster_name")
		expectedClusterName := fmt.Sprintf("%s-geodata-import", prefix)
		assert.Equal(t, expectedClusterName, clusterName)

		clusterArn := terraform.Output(t, terraformOptions, "cluster_arn")
		assert.NotEmpty(t, clusterArn)
		assert.Contains(t, clusterArn, clusterName)

		// Test task definition outputs
		taskDefArn := terraform.Output(t, terraformOptions, "task_definition_arn")
		taskDefFamily := terraform.Output(t, terraformOptions, "task_definition_family")

		assert.NotEmpty(t, taskDefArn)
		assert.Equal(t, expectedClusterName, taskDefFamily)
		assert.Contains(t, taskDefArn, taskDefFamily)

		// Test IAM role outputs
		executionRoleArn := terraform.Output(t, terraformOptions, "execution_role_arn")
		taskRoleArn := terraform.Output(t, terraformOptions, "task_role_arn")

		assert.NotEmpty(t, executionRoleArn)
		assert.NotEmpty(t, taskRoleArn)
		assert.NotEqual(t, executionRoleArn, taskRoleArn)

		// Test log group output
		logGroupName := terraform.Output(t, terraformOptions, "log_group_name")
		assert.Equal(t, "/ecs/geodata-import", logGroupName)
	})

	// Validate ECS cluster
	t.Run("ValidateECSCluster", func(t *testing.T) {
		clusterName := terraform.Output(t, terraformOptions, "cluster_name")

		// Check cluster exists
		describeResult, err := ecsClient.DescribeClusters(ctx, &ecs.DescribeClustersInput{
			Clusters: []string{clusterName},
		})
		require.NoError(t, err)
		require.Len(t, describeResult.Clusters, 1)

		cluster := describeResult.Clusters[0]
		assert.Equal(t, clusterName, *cluster.ClusterName)
		assert.Equal(t, "ACTIVE", *cluster.Status)

		// Check containerInsights setting
		for _, setting := range cluster.Settings {
			if setting.Name == "containerInsights" {
				assert.Equal(t, "disabled", setting.Value, "Container Insights should be disabled for cost optimization")
			}
		}

		// Verify cluster tags
		listTagsResult, err := ecsClient.ListTagsForResource(ctx, &ecs.ListTagsForResourceInput{
			ResourceArn: cluster.ClusterArn,
		})
		require.NoError(t, err)

		tags := make(map[string]string)
		for _, tag := range listTagsResult.Tags {
			tags[*tag.Key] = *tag.Value
		}

		assert.Equal(t, "test", tags["Environment"])
		assert.Equal(t, "terratest", tags["Purpose"])
		assert.Contains(t, tags["Name"], "geodata-import")
	})

	// Validate task definition
	t.Run("ValidateTaskDefinition", func(t *testing.T) {
		taskDefArn := terraform.Output(t, terraformOptions, "task_definition_arn")

		// Describe task definition
		describeResult, err := ecsClient.DescribeTaskDefinition(ctx, &ecs.DescribeTaskDefinitionInput{
			TaskDefinition: aws.String(taskDefArn),
		})
		require.NoError(t, err)

		taskDef := describeResult.TaskDefinition

		// Check basic properties
		assert.Equal(t, "FARGATE", string(taskDef.RequiresCompatibilities[0]))
		assert.Equal(t, "awsvpc", string(taskDef.NetworkMode))
		assert.Equal(t, "2048", *taskDef.Cpu)    // 2 vCPU
		assert.Equal(t, "4096", *taskDef.Memory) // 4GB RAM

		// Check container definition
		require.Len(t, taskDef.ContainerDefinitions, 1)
		container := taskDef.ContainerDefinitions[0]

		assert.Equal(t, "geodata-import", *container.Name)
		assert.Contains(t, *container.Image, "test-repo")

		// Check environment variables
		envVars := make(map[string]string)
		for _, env := range container.Environment {
			envVars[*env.Name] = *env.Value
		}

		assert.Equal(t, "true", envVars["USE_GEODJANGO"])
		assert.Equal(t, "coalition.core.settings", envVars["DJANGO_SETTINGS_MODULE"])
		assert.Equal(t, "true", envVars["IS_ECS_GEODATA_IMPORT"])

		// Check secrets
		require.Len(t, container.Secrets, 2)
		secretNames := make(map[string]string)
		for _, secret := range container.Secrets {
			secretNames[*secret.Name] = *secret.ValueFrom
		}

		assert.Contains(t, secretNames["DATABASE_URL"], "test-db-secret")
		assert.Contains(t, secretNames["SECRET_KEY"], "test-django-secret")

		// Check log configuration
		require.NotNil(t, container.LogConfiguration)
		assert.Equal(t, "awslogs", string(container.LogConfiguration.LogDriver))

		logOptions := container.LogConfiguration.Options
		assert.Equal(t, "/ecs/geodata-import", logOptions["awslogs-group"])
		assert.Equal(t, "us-east-1", logOptions["awslogs-region"])
		assert.Equal(t, "geodata", logOptions["awslogs-stream-prefix"])

		// Check default command (should be help command)
		require.Len(t, container.Command, 4)
		assert.Equal(t, "python", container.Command[0])
		assert.Equal(t, "manage.py", container.Command[1])
		assert.Equal(t, "import_tiger_data", container.Command[2])
		assert.Equal(t, "--help", container.Command[3])
	})

	// Validate CloudWatch log group
	t.Run("ValidateLogGroup", func(t *testing.T) {
		logGroupName := terraform.Output(t, terraformOptions, "log_group_name")

		// Check log group exists
		describeResult, err := logsClient.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(logGroupName),
		})
		require.NoError(t, err)
		require.Len(t, describeResult.LogGroups, 1)

		logGroup := describeResult.LogGroups[0]
		assert.Equal(t, logGroupName, *logGroup.LogGroupName)
		assert.Equal(t, int64(7), *logGroup.RetentionInDays) // 7 days for cost optimization

		// Check log group tags
		listTagsResult, err := logsClient.ListTagsForResource(ctx, &cloudwatchlogs.ListTagsForResourceInput{
			ResourceArn: logGroup.Arn,
		})
		require.NoError(t, err)

		assert.Equal(t, "test", listTagsResult.Tags["Environment"])
		assert.Equal(t, "terratest", listTagsResult.Tags["Purpose"])
	})

	// Validate IAM roles and permissions
	t.Run("ValidateIAMRoles", func(t *testing.T) {
		executionRoleArn := terraform.Output(t, terraformOptions, "execution_role_arn")
		taskRoleArn := terraform.Output(t, terraformOptions, "task_role_arn")

		// Extract role names from ARNs
		executionRoleName := strings.Split(executionRoleArn, "/")[1]
		taskRoleName := strings.Split(taskRoleArn, "/")[1]

		// Check execution role
		execRoleResult, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(executionRoleName),
		})
		require.NoError(t, err)
		assert.Contains(t, *execRoleResult.Role.AssumeRolePolicyDocument, "ecs-tasks.amazonaws.com")

		// Check execution role has ECS task execution policy
		execPoliciesResult, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(executionRoleName),
		})
		require.NoError(t, err)

		hasECSPolicy := false
		for _, policy := range execPoliciesResult.AttachedPolicies {
			if *policy.PolicyArn == "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" {
				hasECSPolicy = true
				break
			}
		}
		assert.True(t, hasECSPolicy, "Execution role should have ECS task execution policy")

		// Check task role
		taskRoleResult, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(taskRoleName),
		})
		require.NoError(t, err)
		assert.Contains(t, *taskRoleResult.Role.AssumeRolePolicyDocument, "ecs-tasks.amazonaws.com")

		// Check inline policies exist
		execInlinePoliciesResult, err := iamClient.ListRolePolicies(ctx, &iam.ListRolePoliciesInput{
			RoleName: aws.String(executionRoleName),
		})
		require.NoError(t, err)

		hasSecretsPolicy := false
		for _, policyName := range execInlinePoliciesResult.PolicyNames {
			if strings.Contains(policyName, "secrets") {
				hasSecretsPolicy = true
				break
			}
		}
		assert.True(t, hasSecretsPolicy, "Execution role should have secrets policy")

		taskInlinePoliciesResult, err := iamClient.ListRolePolicies(ctx, &iam.ListRolePoliciesInput{
			RoleName: aws.String(taskRoleName),
		})
		require.NoError(t, err)

		hasS3Policy := false
		for _, policyName := range taskInlinePoliciesResult.PolicyNames {
			if strings.Contains(policyName, "s3") {
				hasS3Policy = true
				break
			}
		}
		assert.True(t, hasS3Policy, "Task role should have S3 policy")
	})
}

func TestGeodataImportModuleValidation(t *testing.T) {
	t.Parallel()

	// Test validation errors
	t.Run("RequiredVariables", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/geodata-import",
			Vars: map[string]interface{}{
				// Missing required variables
				"prefix": "test",
			},
		}

		// This should fail validation
		out, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, out, "ecr_repository_url")
		assert.Contains(t, out, "database_secret_arn")
		assert.Contains(t, out, "django_secret_key_arn")
	})

	t.Run("ValidateSecretArns", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/geodata-import",
			Vars: map[string]interface{}{
				"prefix":                "test",
				"aws_region":            "us-east-1",
				"ecr_repository_url":    "valid-repo-url",
				"database_secret_arn":   "invalid-arn", // Should be valid ARN format
				"django_secret_key_arn": "arn:aws:secretsmanager:us-east-1:123456789:secret:valid",
				"s3_bucket_arn":         "arn:aws:s3:::valid-bucket",
			},
		}

		out, err := terraform.InitAndPlanE(t, terraformOptions)
		// Note: Terraform doesn't validate ARN format at plan time,
		// but we could add validation rules to the module
		if err != nil {
			t.Logf("Plan output: %s", out)
		}
	})
}

// Helper function to test ECS task can be run (integration test)
func TestGeodataImportTaskExecution(t *testing.T) {
	// This test requires actual AWS infrastructure and should be run separately
	// or as part of integration tests
	t.Skip("Integration test - requires deployed infrastructure")

	// Example of how to test task execution:
	// 1. Deploy the module
	// 2. Run an ECS task with the task definition
	// 3. Monitor task completion
	// 4. Verify logs contain expected output
	// 5. Clean up
}
