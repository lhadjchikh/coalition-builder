# Lambda authenticates to the SES API with its execution role, so the module
# must be able to grant sending rights to a role instead of handing out the
# static IAM access keys the SMTP path depends on.

mock_provider "aws" {}

variables {
  prefix        = "example"
  aws_region    = "us-east-1"
  domain_name   = "example.org"
  from_email    = "admin@example.org"
  verify_domain = true
}

run "no_role_policy_without_sender_roles" {
  command = plan

  assert {
    condition     = length(aws_iam_policy.ses_send) == 0
    error_message = "The role-based send policy must only exist when a sender role is configured."
  }

  assert {
    condition     = length(aws_iam_role_policy_attachment.ses_send) == 0
    error_message = "No attachment should be created when no sender role is configured."
  }
}

run "role_policy_grants_scoped_sending" {
  command = plan

  variables {
    sender_role_names = ["example-zappa-deployment"]
  }

  assert {
    condition = alltrue([
      for action in ["ses:SendEmail", "ses:SendRawEmail"] :
      contains(jsondecode(aws_iam_policy.ses_send[0].policy).Statement[0].Action, action)
    ])
    error_message = "The role must be allowed to send both structured and raw messages."
  }

  assert {
    condition = contains(
      jsondecode(aws_iam_policy.ses_send[0].policy).Statement[0].Condition.StringLike["ses:FromAddress"],
      "*@example.org"
    )
    error_message = "Sending must be scoped to the verified domain with StringLike; StringEquals treats '*' as a literal and silently matches nothing."
  }

  assert {
    condition     = !can(jsondecode(aws_iam_policy.ses_send[0].policy).Statement[0].Condition.StringEquals)
    error_message = "A StringEquals condition on ses:FromAddress cannot express the wildcard and must not be used here."
  }

  assert {
    condition     = length(aws_iam_role_policy_attachment.ses_send) == 1
    error_message = "The send policy must be attached to each configured sender role."
  }
}

run "role_policy_attaches_to_every_sender_role" {
  command = plan

  variables {
    sender_role_names = ["example-zappa-deployment", "example-worker"]
  }

  assert {
    condition     = length(aws_iam_role_policy_attachment.ses_send) == 2
    error_message = "Every configured sender role must receive the send policy."
  }
}
