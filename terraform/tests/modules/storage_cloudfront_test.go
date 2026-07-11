package modules

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestStorageStaticFilesServedFromS3 is a plan-only test (no AWS resources are
// created) that guards how the CloudFront distribution routes /static/*.
//
// Lambda's collectstatic writes static files to the S3 assets bucket under
// static/, and STATIC_URL points at the CloudFront domain. The /static/*
// behavior must therefore target the S3 origin. It previously targeted a
// "Django-Static" origin backed by the old ECS/ALB WhiteNoise service, which
// was removed during the Lambda migration, leaving admin CSS/JS unreachable.
func TestStorageStaticFilesServedFromS3(t *testing.T) {
	terraformOptions := &terraform.Options{
		TerraformDir:    "../fixtures/storage_cloudfront",
		TerraformBinary: "terraform",
		NoColor:         true,
	}

	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// The CloudFront distribution and its /static/* behavior still exist.
	assert.Contains(t, planOutput, "aws_cloudfront_distribution.static_assets",
		"storage module should still create the CloudFront distribution")
	assert.Contains(t, planOutput, "/static/*",
		"distribution should keep a dedicated /static/* cache behavior")

	// The dead ECS/ALB origin must be gone so /static/* resolves to the S3
	// bucket where collectstatic uploads admin assets.
	assert.NotContains(t, planOutput, "Django-Static",
		"/static/* must route to the S3 origin, not the removed ECS/ALB origin")
}
