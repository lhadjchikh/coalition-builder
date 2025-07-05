package modules

import (
	"testing"

	"terraform-tests/common"
)

// TestDNSModuleValidation runs validation-only tests that don't require AWS credentials
func TestDNSModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "dns")
}
