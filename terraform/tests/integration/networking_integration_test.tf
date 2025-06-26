# Networking Module Integration Test
# Verifies private app route table has no default route and VPC endpoints work correctly

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Create the networking module for integration testing
module "networking_integration_test" {
  source = "../../modules/networking"

  prefix     = "test-networking-integration"
  aws_region = "us-east-1"

  create_vpc             = true
  vpc_cidr               = "10.0.0.0/16"
  create_public_subnets  = true
  create_private_subnets = true
  create_db_subnets      = true
  create_vpc_endpoints   = true
}

# Data source to get route table details for assertion
data "aws_route_table" "private_app_test" {
  route_table_id = module.networking_integration_test.private_app_route_table_id

  depends_on = [module.networking_integration_test]
}

# Check to assert that no default route exists
locals {
  default_routes = [
    for route in data.aws_route_table.private_app_test.routes : route
    if route.destination_cidr_block == "0.0.0.0/0"
  ]

  has_default_route = length(local.default_routes) > 0
}

# This check will cause terraform plan/apply to fail if a default route exists
resource "null_resource" "assert_no_default_route" {
  count = local.has_default_route ? 1 : 0

  # This will cause an error if count > 0, which happens when has_default_route is true
  provisioner "local-exec" {
    command = "echo 'ERROR: Private app route table should not have a default route (0.0.0.0/0)' && exit 1"
  }
}

# Output for verification
output "test_results" {
  value = {
    private_app_route_table_id = module.networking_integration_test.private_app_route_table_id
    total_routes               = length(data.aws_route_table.private_app_test.routes)
    has_default_route          = local.has_default_route
    default_routes_count       = length(local.default_routes)
    vpc_endpoints_created      = module.networking_integration_test.s3_endpoint_id != null
  }
}

# Assert that VPC endpoints are created
resource "null_resource" "assert_vpc_endpoints_created" {
  count = module.networking_integration_test.s3_endpoint_id == null ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: VPC endpoints should be created for private subnet connectivity' && exit 1"
  }
}