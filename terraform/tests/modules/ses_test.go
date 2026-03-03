package modules

import (
	"testing"

	"terraform-tests/common"

	"github.com/gruntwork-io/terratest/modules/terraform"
)

func TestSESModuleStructure(t *testing.T) {
	common.ValidateModuleStructure(t, "ses")
}

func TestSESModuleValidatesWithCreateRoute53Records(t *testing.T) {
	if !testing.Short() {
		t.Skip("Skipping validation-only test in full mode")
	}

	testConfig := common.NewTestConfig("../../modules/ses")

	terraformOptions := &terraform.Options{
		TerraformDir:    testConfig.TerraformDir,
		TerraformBinary: "terraform",
	}

	common.InitTerraformForPlanOnly(t, terraformOptions)

	// terraform validate checks syntax and type correctness.
	// It will fail if the module references an undefined variable.
	terraform.RunTerraformCommand(t, terraformOptions, "validate")
}
