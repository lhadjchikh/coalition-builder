package modules

import (
	"testing"

	"terraform-tests/common"
)

// TestBastionModuleValidation runs validation-only tests that don't require AWS credentials
func TestBastionModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "bastion")
}
