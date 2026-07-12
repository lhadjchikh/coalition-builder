package modules

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestStorageStaticFilesServedFromS3 is a plan-only test (no AWS resources are
// created) that guards how the CloudFront distribution routes /static/*.
//
// Lambda's collectstatic writes static files to the S3 assets bucket under
// static/, and STATIC_URL points at the CloudFront domain, so /static/* must be
// served from the module's single S3 origin. During the Lambda migration the
// old ECS/ALB custom origin that previously served /static/* was removed. This
// test fails if a future change repoints /static/* away from the S3 origin or
// reintroduces a second (custom) origin.
//
// target_origin_id interpolates the bucket id (random_id suffix), so it is
// unknown at plan time and cannot be asserted as a literal. Instead we assert
// the structural invariants: a single S3 origin, and /static/* targeting the
// same origin as the default behavior.
func TestStorageStaticFilesServedFromS3(t *testing.T) {
	terraformOptions := &terraform.Options{
		TerraformDir:    "../fixtures/storage_cloudfront",
		TerraformBinary: "terraform",
		NoColor:         true,
		PlanFilePath:    filepath.Join(t.TempDir(), "tfplan"),
	}

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)
	distribution := cloudFrontDistribution(t, planStruct)

	// The distribution must expose exactly one origin, and it must be an S3
	// origin (s3_origin_config), not the removed ALB/custom origin.
	origins := blockList(distribution["origin"])
	require.Len(t, origins, 1, "distribution should expose a single S3 origin")
	origin := block(t, origins[0])
	assert.NotEmpty(t, blockList(origin["s3_origin_config"]),
		"the sole origin must be an S3 origin")
	assert.Empty(t, blockList(origin["custom_origin_config"]),
		"the distribution must not reintroduce a custom (ALB) origin")

	// The dedicated /static/* behavior must exist and route to the same origin
	// as the default behavior, i.e. the single S3 origin above.
	defaultBehaviors := blockList(distribution["default_cache_behavior"])
	require.Len(t, defaultBehaviors, 1, "distribution should have a default cache behavior")
	defaultBehavior := block(t, defaultBehaviors[0])
	staticBehavior := staticCacheBehavior(t, distribution)
	assert.Equal(t,
		defaultBehavior["target_origin_id"], staticBehavior["target_origin_id"],
		"/static/* must target the same S3 origin as the default cache behavior")
}

// cloudFrontDistribution returns the planned attribute values of the storage
// module's CloudFront distribution.
func cloudFrontDistribution(
	t *testing.T,
	plan *terraform.PlanStruct,
) map[string]interface{} {
	for addr, resource := range plan.ResourcePlannedValuesMap {
		if resource != nil &&
			strings.Contains(addr, "aws_cloudfront_distribution.static_assets") {
			return resource.AttributeValues
		}
	}
	require.FailNow(t, "aws_cloudfront_distribution.static_assets not found in plan")
	return nil
}

// staticCacheBehavior returns the ordered_cache_behavior serving /static/*.
func staticCacheBehavior(
	t *testing.T,
	distribution map[string]interface{},
) map[string]interface{} {
	for _, raw := range blockList(distribution["ordered_cache_behavior"]) {
		behavior := block(t, raw)
		if behavior["path_pattern"] == "/static/*" {
			return behavior
		}
	}
	require.FailNow(t, "no /static/* ordered_cache_behavior found in the distribution")
	return nil
}

// blockList coerces a planned nested block attribute into a slice, treating an
// absent or empty block as an empty list.
func blockList(value interface{}) []interface{} {
	list, ok := value.([]interface{})
	if !ok {
		return nil
	}
	return list
}

// block coerces a single planned nested block into a map.
func block(t *testing.T, value interface{}) map[string]interface{} {
	attrs, ok := value.(map[string]interface{})
	require.Truef(t, ok, "expected a nested block map, got %T", value)
	return attrs
}
