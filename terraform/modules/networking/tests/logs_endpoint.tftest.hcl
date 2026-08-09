# Lambda function logs are delivered by the Lambda service from outside this
# VPC, so the CloudWatch Logs interface endpoint is not needed to see them.
# Verified against prod by applying a deny-all endpoint policy and confirming
# both an invocation marker and a live request still reached CloudWatch. At
# ~$7.44/mo per endpoint it is the single largest avoidable line item, so the
# default must stay opt-out-able and environments must be free to drop it.

mock_provider "aws" {}

variables {
  prefix                 = "example"
  aws_region             = "us-east-1"
  create_vpc             = true
  vpc_cidr               = "10.1.0.0/16"
  create_public_subnets  = true
  create_private_subnets = true
  create_db_subnets      = true
  create_vpc_endpoints   = true
}

run "logs_endpoint_is_present_by_default" {
  command = plan

  assert {
    condition     = contains(keys(aws_vpc_endpoint.interface), "logs")
    error_message = "The default must not silently remove an endpoint from existing environments."
  }
}

run "logs_endpoint_can_be_dropped" {
  command = plan

  variables {
    enable_logs_endpoint = false
  }

  assert {
    condition     = !contains(keys(aws_vpc_endpoint.interface), "logs")
    error_message = "enable_logs_endpoint=false must remove the CloudWatch Logs interface endpoint."
  }
}

run "dropping_logs_leaves_the_endpoints_lambda_actually_needs" {
  command = plan

  variables {
    enable_logs_endpoint = false
    enable_ses_endpoint  = true
  }

  assert {
    condition = alltrue([
      for name in ["secretsmanager", "geo_places", "ses"] :
      contains(keys(aws_vpc_endpoint.interface), name)
    ])
    error_message = "Secrets Manager, Location and SES are reached over their endpoints and must survive dropping the Logs endpoint."
  }

  assert {
    condition     = length(keys(aws_vpc_endpoint.interface)) == 3
    error_message = "Exactly three interface endpoints should remain; each extra one bills hourly."
  }
}
