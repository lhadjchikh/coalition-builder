# Plan-only fixture for the serverless-storage module's lifecycle rule.
#
# The AWS provider skips credential/account validation so `terraform plan`
# can run in CI unit tests and locally without real AWS access. No resources
# are ever applied from this fixture; tests assert on planned configuration.

terraform {
  required_version = ">= 1.12.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.99.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}

module "serverless_storage" {
  source = "../../../modules/serverless-storage"

  environment            = "dev"
  enable_lifecycle_rules = true
  use_random_suffix      = false
  force_destroy          = true
}
