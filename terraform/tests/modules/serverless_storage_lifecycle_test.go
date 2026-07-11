package modules

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestServerlessStorageLifecycleKeepsCurrentObjects is a plan-only test (no AWS
// resources are created) that guards the non-production lifecycle rule against
// the regression that permanently deleted 59 media objects: a rule that expired
// or transitioned current objects.
//
// The dev/staging assets bucket must retain current media in S3 Standard. Only
// incomplete multipart uploads and noncurrent versions are cleaned up. This test
// fails if a future change reintroduces an `expiration` or `transition` block on
// the `cleanup-old-files` rule, which is exactly the change that caused the
// incident (versioning is Suspended for non-production, so expiries are
// unrecoverable).
func TestServerlessStorageLifecycleKeepsCurrentObjects(t *testing.T) {
	terraformOptions := &terraform.Options{
		TerraformDir:    "../fixtures/serverless_storage_lifecycle",
		TerraformBinary: "terraform",
		NoColor:         true,
		PlanFilePath:    filepath.Join(t.TempDir(), "tfplan"),
	}

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)
	rule := cleanupOldFilesRule(t, planStruct)

	// The regression that deleted current media: an expiration or a Standard-IA
	// transition on current objects. Neither block may be present.
	assert.Empty(t, blockList(rule["expiration"]),
		"the lifecycle rule must not expire current objects")
	assert.Empty(t, blockList(rule["transition"]),
		"the lifecycle rule must not transition current objects out of S3 Standard")

	// The retained cleanup that never touches current objects must remain.
	assert.NotEmpty(t, blockList(rule["abort_incomplete_multipart_upload"]),
		"incomplete multipart uploads must still be cleaned up")
	assert.NotEmpty(t, blockList(rule["noncurrent_version_expiration"]),
		"noncurrent versions must still be cleaned up")
}

// cleanupOldFilesRule returns the planned `cleanup-old-files` rule block of the
// serverless-storage module's lifecycle configuration.
func cleanupOldFilesRule(
	t *testing.T,
	plan *terraform.PlanStruct,
) map[string]interface{} {
	for addr, resource := range plan.ResourcePlannedValuesMap {
		if resource == nil ||
			!strings.Contains(addr, "aws_s3_bucket_lifecycle_configuration.assets") {
			continue
		}
		for _, raw := range blockList(resource.AttributeValues["rule"]) {
			rule := block(t, raw)
			if rule["id"] == "cleanup-old-files" {
				return rule
			}
		}
	}
	require.FailNow(t,
		"cleanup-old-files rule not found in the planned lifecycle configuration")
	return nil
}
