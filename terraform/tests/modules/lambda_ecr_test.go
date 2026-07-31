package modules

import (
	"os"
	"regexp"
	"testing"

	"terraform-tests/common"

	"github.com/stretchr/testify/assert"
)

func TestLambdaECRModuleValidation(t *testing.T) {
	common.ValidateModuleStructure(t, "lambda-ecr")
}

func TestProductionRetainsFiftyRollbackImages(t *testing.T) {
	productionSource, err := os.ReadFile("../../environments/prod/main.tf")
	assert.NoError(t, err)
	moduleSource, err := os.ReadFile("../../modules/lambda-ecr/main.tf")
	assert.NoError(t, err)

	productionRetention := regexp.MustCompile(
		`(?s)module "lambda_ecr".*?image_retention_count\s*=\s*50`,
	)
	activeRetentionInput := regexp.MustCompile(
		`(?s)resource "aws_ecr_lifecycle_policy" "lambda".*?countNumber\s*=\s*var\.image_retention_count`,
	)
	assert.Regexp(t, productionRetention, string(productionSource))
	assert.Regexp(t, activeRetentionInput, string(moduleSource))
}
