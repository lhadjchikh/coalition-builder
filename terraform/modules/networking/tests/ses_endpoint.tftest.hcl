# Lambda runs in private subnets with no NAT and no default route, so the only
# way it can reach SES is through an interface VPC endpoint. These tests pin
# that the endpoint is created on demand and stays opt-in, because each
# interface endpoint carries a standing hourly cost per environment.

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

run "ses_endpoint_is_absent_by_default" {
  command = plan

  assert {
    condition     = !contains(keys(aws_vpc_endpoint.interface), "ses")
    error_message = "The SES interface endpoint must be opt-in so other environments do not pay for it."
  }
}

run "ses_endpoint_is_created_when_enabled" {
  command = plan

  variables {
    enable_ses_endpoint = true
  }

  assert {
    condition     = contains(keys(aws_vpc_endpoint.interface), "ses")
    error_message = "enable_ses_endpoint must create an interface endpoint for SES."
  }

  assert {
    condition     = aws_vpc_endpoint.interface["ses"].service_name == "com.amazonaws.us-east-1.email"
    error_message = "The endpoint must target the SES API service (com.amazonaws.<region>.email), which private DNS maps onto email.<region>.amazonaws.com."
  }

  assert {
    condition     = aws_vpc_endpoint.interface["ses"].private_dns_enabled
    error_message = "Private DNS must be enabled so boto3's default SES endpoint resolves to the VPC endpoint without an endpoint_url override."
  }
}

run "existing_endpoints_are_unaffected_by_the_ses_flag" {
  command = plan

  variables {
    enable_ses_endpoint = true
  }

  assert {
    condition = alltrue([
      for name in ["secretsmanager", "logs", "geo_places"] :
      contains(keys(aws_vpc_endpoint.interface), name)
    ])
    error_message = "Enabling the SES endpoint must not disturb the existing interface endpoints."
  }
}
