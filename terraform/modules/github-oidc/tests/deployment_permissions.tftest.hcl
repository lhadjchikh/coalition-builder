mock_provider "aws" {
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
      arn        = "arn:aws:iam::123456789012:user/test"
      user_id    = "test"
    }
  }
}

variables {
  environment                   = "prod"
  create_oidc_provider          = false
  existing_oidc_provider_arn    = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  github_subjects               = ["repo:example/project:environment:prod"]
  enable_terraform_policy       = false
  enable_infrastructure_policy  = true
  resource_prefix               = "example"
  additional_s3_bucket_prefixes = ["legacy", "archive"]
}

run "deployment_permissions_are_allowed" {
  command = plan

  assert {
    condition = length([
      for statement in jsondecode(aws_iam_role_policy.infrastructure[0].policy).Statement : statement
      if statement.Sid == "CloudFormationStacks" && alltrue([
        for action in [
          "cloudformation:CreateStack",
          "cloudformation:DeleteStack",
          "cloudformation:DescribeStackResource",
          "cloudformation:DescribeStacks",
          "cloudformation:ListStackResources",
          "cloudformation:UpdateStack",
        ] : contains(statement.Action, action)
      ]) && alltrue([for resource in statement.Resource : resource != "*"])
    ]) == 1
    error_message = "The GitHub Actions role must allow the CloudFormation operations Zappa uses to manage its API stack."
  }

  assert {
    condition = length([
      for statement in jsondecode(aws_iam_role_policy.infrastructure[0].policy).Statement : statement
      if statement.Sid == "IAMReadOnly" && contains(statement.Action, "iam:SimulatePrincipalPolicy")
    ]) == 1
    error_message = "The GitHub Actions role must be able to verify the Lambda execution role before deployment."
  }

  assert {
    condition = length([
      for statement in jsondecode(aws_iam_role_policy.infrastructure[0].policy).Statement : statement
      if statement.Sid == "IAMReadOnly" && contains(statement.Action, "iam:ListGroupsForUser")
    ]) == 1
    error_message = "The GitHub Actions role must be able to inspect IAM user groups before Terraform deletes a user."
  }

  assert {
    condition = length([
      for statement in jsondecode(aws_iam_role_policy.infrastructure[0].policy).Statement : statement
      if statement.Sid == "S3Mutate" && statement.Effect == "Allow" && alltrue([
        contains(statement.Action, "s3:PutLifecycleConfiguration"),
        contains(statement.Resource, "arn:aws:s3:::legacy-*"),
        contains(statement.Resource, "arn:aws:s3:::legacy-*/*"),
        contains(statement.Resource, "arn:aws:s3:::archive-*"),
        contains(statement.Resource, "arn:aws:s3:::archive-*/*"),
      ])
    ]) == 1
    error_message = "The GitHub Actions role must manage lifecycle rules for every configured application bucket prefix."
  }
}
