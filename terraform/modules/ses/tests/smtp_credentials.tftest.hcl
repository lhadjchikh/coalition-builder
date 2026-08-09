mock_provider "aws" {
  override_resource {
    target = aws_iam_access_key.ses_smtp
    values = {
      id = "AKIAEXAMPLE"
    }
  }
}

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
    condition = jsondecode(aws_secretsmanager_secret_version.ses_smtp[0].secret_string) == {
      DEFAULT_FROM_EMAIL  = "admin@example.org"
      EMAIL_HOST          = "email-smtp.us-east-1.amazonaws.com"
      EMAIL_HOST_PASSWORD = "mock-smtp-password"
      EMAIL_HOST_USER     = "AKIAEXAMPLE"
      EMAIL_PORT          = "587"
      EMAIL_USE_TLS       = "True"
    }
    error_message = "The SMTP secret must contain exactly the connection fields required by non-Lambda deployments."
  }
}

# #310: Lambda deployments can disable every long-lived SMTP credential resource.
run "smtp_credentials_can_be_disabled" {
  command = plan

  variables {
    create_smtp_credentials = false
    sender_role_names       = ["example-zappa-deployment"]
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

  assert {
    condition = alltrue([
      length(aws_iam_policy.ses_send) == 1,
      length(aws_iam_role_policy_attachment.ses_send) == 1,
    ])
    error_message = "Disabling SMTP credentials must preserve role-based SES sending for Lambda."
  }
}
