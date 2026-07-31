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

	productionRetention := regexp.MustCompile(
		`(?s)module "lambda_ecr".*?image_retention_count\s*=\s*50`,
	)
	assert.Regexp(t, productionRetention, string(productionSource))
}
