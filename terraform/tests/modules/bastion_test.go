package modules

import (
	"os"
	"regexp"
	"testing"

	"terraform-tests/common"

	"github.com/stretchr/testify/assert"
)

// TestBastionModuleValidation runs validation-only tests that don't require AWS credentials
func TestBastionModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "bastion")
}

func TestBastionAMIRefreshDoesNotReplaceExistingInstance(t *testing.T) {
	moduleSource, err := os.ReadFile("../../modules/bastion/main.tf")
	assert.NoError(t, err)

	amiLifecycleGuard := regexp.MustCompile(
		`(?s)resource "aws_instance" "bastion".*?lifecycle \{.*?ignore_changes\s*=\s*\[ami\]`,
	)
	assert.Regexp(t, amiLifecycleGuard, string(moduleSource))
}
