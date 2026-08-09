mock_provider "aws" {}

mock_provider "external" {
  override_data {
    target = data.external.smtp_password
    values = {
      result = {
        value = "mock-smtp-password"
      }
    }
  }
}

variables {
  prefix               = "example"
  aws_region           = "us-east-1"
  domain_name          = "example.org"
  from_email           = "admin@example.org"
  verify_domain        = true
  enable_notifications = false
}

# #310: SMTP credentials remain available by default for non-Lambda deployments.
run "smtp_credentials_are_created_by_default" {
  command = apply

  assert {
    condition = alltrue([
      length(aws_iam_user.ses_smtp) == 1,
      length(aws_iam_access_key.ses_smtp) == 1,
      length(aws_iam_user_policy.ses_smtp) == 1,
      length(data.external.smtp_password) == 1,
      length(aws_secretsmanager_secret.ses_smtp) == 1,
      length(aws_secretsmanager_secret_version.ses_smtp) == 1,
    ])
    error_message = "SMTP credentials must remain enabled by default for existing module callers."
  }

  assert {
    condition = alltrue([
      contains(
        jsondecode(aws_iam_user_policy.ses_smtp[0].policy).Statement[0].Condition.StringLike["ses:FromAddress"],
        "*@example.org"
      ),
      !can(jsondecode(aws_iam_user_policy.ses_smtp[0].policy).Statement[0].Condition.StringEquals),
    ])
    error_message = "The SMTP user policy must use StringLike so its domain wildcard matches real sender addresses."
  }

  assert {
    condition = alltrue([
      !contains(keys(jsondecode(aws_secretsmanager_secret_version.ses_smtp[0].secret_string)), "AWS_ACCESS_KEY_ID"),
      !contains(keys(jsondecode(aws_secretsmanager_secret_version.ses_smtp[0].secret_string)), "AWS_SECRET_ACCESS_KEY"),
    ])
    error_message = "The SMTP secret must not expose raw IAM access key credentials."
  }
}

# #310: Lambda deployments can disable every long-lived SMTP credential resource.
run "smtp_credentials_can_be_disabled" {
  command = plan

  variables {
    create_smtp_credentials = false
  }

  assert {
    condition = alltrue([
      length(aws_iam_user.ses_smtp) == 0,
      length(aws_iam_access_key.ses_smtp) == 0,
      length(aws_iam_user_policy.ses_smtp) == 0,
      length(data.external.smtp_password) == 0,
      length(aws_secretsmanager_secret.ses_smtp) == 0,
      length(aws_secretsmanager_secret_version.ses_smtp) == 0,
    ])
    error_message = "Disabling SMTP credentials must remove the IAM user, access key, policy, password lookup, secret, and secret version."
  }

  assert {
    condition = alltrue([
      output.ses_smtp_secret_arn == null,
      output.ses_smtp_secret_name == null,
      output.ses_smtp_username == null,
    ])
    error_message = "SMTP credential outputs must be null when credential creation is disabled."
  }
}
