# Zappa creates the API Gateway REST API outside Terraform, so Terraform used to
# take its id as a hand-copied input. That input drifted: the repository-level
# value pointed at an API that no longer existed. These tests pin the discovery
# behaviour that replaced it — the id is looked up from the Zappa naming
# convention, and the lookup stays opt-in so a first apply can precede the first
# Zappa deployment.

mock_provider "aws" {}

variables {
  prefix       = "example"
  aws_region   = "us-east-1"
  project_name = "coalition"
  stage_name   = "prod"
}

run "api_gateway_is_not_discovered_by_default" {
  command = plan

  assert {
    condition     = length(data.aws_api_gateway_rest_api.zappa) == 0
    error_message = "Discovery must be opt-in so Terraform can bootstrap an environment before Zappa has deployed its API Gateway."
  }

  assert {
    condition     = output.api_gateway_id == ""
    error_message = "With discovery disabled the module must report an empty id so callers can skip API Gateway wiring."
  }
}

run "discovery_uses_the_zappa_naming_convention" {
  command = plan

  variables {
    discover_api_gateway = true
  }

  assert {
    condition     = data.aws_api_gateway_rest_api.zappa[0].name == "coalition-prod"
    error_message = "The REST API must be looked up as {project_name}-{stage_name}, which is how Zappa names it."
  }
}

run "discovery_matches_zappa_name_normalization" {
  command = plan

  variables {
    discover_api_gateway = true
    project_name         = "My_App"
    stage_name           = "my_stage"
  }

  assert {
    condition     = data.aws_api_gateway_rest_api.zappa[0].name == "my-app-my-stage"
    error_message = "Discovery must normalize project and stage names exactly as Zappa does before looking up the REST API."
  }
}

run "discovery_follows_the_stage" {
  command = plan

  variables {
    discover_api_gateway = true
    stage_name           = "dev"
  }

  assert {
    condition     = data.aws_api_gateway_rest_api.zappa[0].name == "coalition-dev"
    error_message = "Each stage has its own Zappa-created REST API, so the lookup must follow stage_name."
  }
}

run "discovered_id_is_published_to_callers" {
  command = plan

  variables {
    discover_api_gateway = true
  }

  override_data {
    target = data.aws_api_gateway_rest_api.zappa[0]
    values = {
      id = "uk2du4bcdh"
    }
  }

  assert {
    condition     = output.api_gateway_id == "uk2du4bcdh"
    error_message = "The module must publish the discovered id so environments never hold a second copy of it."
  }
}

run "discovery_requires_the_names_it_looks_up" {
  command = plan

  variables {
    discover_api_gateway = true
    project_name         = ""
  }

  expect_failures = [var.project_name]
}
