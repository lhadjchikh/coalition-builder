package modules

import (
	"testing"

	"terraform-tests/common"
)

// TestLoadbalancerModuleValidation runs validation-only tests that don't require AWS credentials
func TestLoadbalancerModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "loadbalancer")
}
