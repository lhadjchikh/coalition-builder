package modules

import (
	"testing"

	"terraform-tests/common"
)

// TestDnsModuleValidation runs validation-only tests that don't require AWS credentials
func TestDnsModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "dns")
}
