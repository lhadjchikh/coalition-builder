package modules

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestZappaModule(t *testing.T) {
	t.Parallel()

	// Generate unique names for this test
	uniqueID := random.UniqueId()
	prefix := fmt.Sprintf("test-zappa-%s", strings.ToLower(uniqueID))

	// AWS configuration for validation
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"),
	)
	require.NoError(t, err)

	s3Client := s3.NewFromConfig(cfg)
	iamClient := iam.NewFromConfig(cfg)

	defer func() {
		// Cleanup: Delete S3 bucket if it exists
		bucketName := fmt.Sprintf("%s-zappa-deployments", prefix)

		// List and delete all objects in bucket
		listInput := &s3.ListObjectsV2Input{Bucket: aws.String(bucketName)}
		result, err := s3Client.ListObjectsV2(ctx, listInput)
		if err == nil {
			for _, obj := range result.Contents {
				_, _ = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
					Bucket: aws.String(bucketName),
					Key:    obj.Key,
				})
			}
		}

		// Delete bucket
		_, _ = s3Client.DeleteBucket(ctx, &s3.DeleteBucketInput{
			Bucket: aws.String(bucketName),
		})
	}()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../../modules/zappa",
		Vars: map[string]interface{}{
			"prefix":     prefix,
			"aws_region": "us-east-1",
			"vpc_id":     "vpc-12345678", // Mock VPC ID for testing
			"database_subnet_cidrs": []string{
				"10.0.3.0/24",
				"10.0.4.0/24",
			},
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
		// Test S3 bucket output
		bucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")
		expectedBucketName := fmt.Sprintf("%s-zappa-deployments", prefix)
		assert.Equal(t, expectedBucketName, bucketName)

		bucketArn := terraform.Output(t, terraformOptions, "s3_bucket_arn")
		expectedBucketArn := fmt.Sprintf("arn:aws:s3:::%s", expectedBucketName)
		assert.Equal(t, expectedBucketArn, bucketArn)

		// Test security group output
		securityGroupID := terraform.Output(t, terraformOptions, "lambda_security_group_id")
		assert.NotEmpty(t, securityGroupID)
		assert.True(t, strings.HasPrefix(securityGroupID, "sg-"))

		// Test IAM role outputs
		roleArn := terraform.Output(t, terraformOptions, "zappa_deployment_role_arn")
		roleName := terraform.Output(t, terraformOptions, "zappa_deployment_role_name")

		assert.NotEmpty(t, roleArn)
		assert.NotEmpty(t, roleName)
		assert.True(t, strings.Contains(roleArn, roleName))
	})

	// Validate S3 bucket configuration
	t.Run("ValidateS3Bucket", func(t *testing.T) {
		bucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")

		// Check bucket exists and is accessible
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err, "S3 bucket should exist and be accessible")

		// Check versioning is enabled
		versioningResult, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", *versioningResult.Status)

		// Check public access is blocked
		publicAccessResult, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)

		// Check server-side encryption
		encryptionResult, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, encryptionResult.ServerSideEncryptionConfiguration.Rules)

		rule := encryptionResult.ServerSideEncryptionConfiguration.Rules[0]
		assert.Equal(t, "AES256", *rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)

		// Check lifecycle configuration exists
		lifecycleResult, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, lifecycleResult.Rules)

		// Find the delete-old-deployments rule
		var deleteRule *s3.LifecycleRule
		for _, rule := range lifecycleResult.Rules {
			if *rule.ID == "delete-old-deployments" {
				deleteRule = rule
				break
			}
		}
		require.NotNil(t, deleteRule, "Should have delete-old-deployments lifecycle rule")
		assert.Equal(t, "Enabled", *deleteRule.Status)
		assert.Equal(t, int64(30), *deleteRule.NoncurrentVersionExpiration.NoncurrentDays)
	})

	// Validate IAM role permissions
	t.Run("ValidateIAMRole", func(t *testing.T) {
		roleName := terraform.Output(t, terraformOptions, "zappa_deployment_role_name")

		// Check role exists
		getRoleResult, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.Contains(t, *getRoleResult.Role.AssumeRolePolicyDocument, "lambda.amazonaws.com")

		// Check attached policies
		listPoliciesResult, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, listPoliciesResult.AttachedPolicies)

		// Find our custom policy
		var zappaPolicy *iam.AttachedPolicy
		for _, policy := range listPoliciesResult.AttachedPolicies {
			if strings.Contains(*policy.PolicyName, "zappa-deployment") {
				zappaPolicy = policy
				break
			}
		}
		require.NotNil(t, zappaPolicy, "Should have zappa-deployment policy attached")

		// Verify policy permissions
		getPolicyResult, err := iamClient.GetPolicy(ctx, &iam.GetPolicyInput{
			PolicyArn: zappaPolicy.PolicyArn,
		})
		require.NoError(t, err)

		getPolicyVersionResult, err := iamClient.GetPolicyVersion(ctx, &iam.GetPolicyVersionInput{
			PolicyArn: zappaPolicy.PolicyArn,
			VersionId: getPolicyResult.Policy.DefaultVersionId,
		})
		require.NoError(t, err)

		policyDocument := *getPolicyVersionResult.PolicyVersion.Document
		assert.Contains(t, policyDocument, "lambda:CreateFunction")
		assert.Contains(t, policyDocument, "lambda:UpdateFunctionCode")
		assert.Contains(t, policyDocument, "s3:PutObject")
		assert.Contains(t, policyDocument, "apigateway:")
	})

	// Test resource tagging
	t.Run("ValidateResourceTags", func(t *testing.T) {
		bucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")

		// Check S3 bucket tags
		tagResult, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
			Bucket: aws.String(bucketName),
		})
		require.NoError(t, err)

		// Verify expected tags
		tags := make(map[string]string)
		for _, tag := range tagResult.TagSet {
			tags[*tag.Key] = *tag.Value
		}

		assert.Equal(t, "test", tags["Environment"])
		assert.Equal(t, "terratest", tags["Purpose"])
		assert.Equal(t, bucketName, tags["Name"])
		assert.Equal(t, "Zappa Lambda deployment packages", tags["Purpose"])
	})
}

func TestZappaModuleValidation(t *testing.T) {
	t.Parallel()

	// Test validation errors
	t.Run("RequiredVariables", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/zappa",
			Vars:         map[string]interface{}{
				// Missing required variables
			},
		}

		// This should fail validation
		out, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, out, "prefix")
		assert.Contains(t, out, "aws_region")
		assert.Contains(t, out, "vpc_id")
	})

	t.Run("ValidateVariableTypes", func(t *testing.T) {
		terraformOptions := &terraform.Options{
			TerraformDir: "../../modules/zappa",
			Vars: map[string]interface{}{
				"prefix":                "test",
				"aws_region":            "us-east-1",
				"vpc_id":                "vpc-12345678",
				"database_subnet_cidrs": "not-a-list", // Should be a list
			},
		}

		out, err := terraform.InitAndPlanE(t, terraformOptions)
		assert.Error(t, err)
		assert.Contains(t, out, "database_subnet_cidrs")
	})
}
