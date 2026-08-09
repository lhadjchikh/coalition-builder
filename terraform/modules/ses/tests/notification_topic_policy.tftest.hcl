# SES configuration-set events are published after a send is accepted. Without
# an SNS resource policy, delivery, bounce, complaint, and reject events vanish
# even though the application reports a successful send.

mock_provider "aws" {
  override_resource {
    target = aws_sns_topic.ses_notifications
    values = {
      arn = "arn:aws:sns:us-east-1:123456789012:example-ses-notifications"
    }
  }

  override_data {
    target = data.aws_caller_identity.current
    values = {
      account_id = "123456789012"
    }
  }
}

variables {
  prefix               = "example"
  aws_region           = "us-east-1"
  domain_name          = "example.org"
  from_email           = "admin@example.org"
  verify_domain        = true
  enable_notifications = true
}

run "notification_topic_allows_only_this_ses_configuration_set" {
  command = apply

  assert {
    condition     = length(aws_sns_topic_policy.ses_notifications) == 1
    error_message = "SES notifications need an SNS topic policy or event publishing silently fails."
  }

  assert {
    condition     = jsondecode(aws_sns_topic_policy.ses_notifications[0].policy).Statement[0].Principal.Service == "ses.amazonaws.com"
    error_message = "The topic policy must authorize the SES service principal."
  }

  assert {
    condition     = jsondecode(aws_sns_topic_policy.ses_notifications[0].policy).Statement[0].Action == "sns:Publish"
    error_message = "SES only needs permission to publish notifications."
  }

  assert {
    condition     = jsondecode(aws_sns_topic_policy.ses_notifications[0].policy).Statement[0].Condition.StringEquals["AWS:SourceAccount"] == data.aws_caller_identity.current.account_id
    error_message = "The SES publish grant must be scoped to the current AWS account."
  }

  assert {
    condition     = can(regex("configuration-set/example-config-set$", jsondecode(aws_sns_topic_policy.ses_notifications[0].policy).Statement[0].Condition.StringEquals["AWS:SourceArn"]))
    error_message = "The SES publish grant must be scoped to this module's configuration set."
  }
}

run "no_notification_topic_policy_when_notifications_are_disabled" {
  command = plan

  variables {
    enable_notifications = false
  }

  assert {
    condition     = length(aws_sns_topic_policy.ses_notifications) == 0
    error_message = "Disabling notifications must not leave a topic policy behind."
  }
}
