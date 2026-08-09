# Email failures are contained at the call site so a submission is never lost,
# which means nothing surfaces them to a human unless an alarm does. These
# tests pin that the alarm exists and fires on the first failure.

mock_provider "aws" {}
mock_provider "awscc" {}
mock_provider "random" {}

variables {
  prefix      = "example"
  vpc_id      = "vpc-12345678"
  alert_email = "ops@example.org"
}

run "no_alarm_without_a_log_group" {
  command = plan

  assert {
    condition     = length(aws_cloudwatch_log_metric_filter.email_delivery_failure) == 0
    error_message = "The metric filter must be opt-in for environments that have no application log group."
  }

  assert {
    condition     = length(aws_cloudwatch_metric_alarm.email_delivery_failure) == 0
    error_message = "The alarm must be opt-in for environments that have no application log group."
  }
}

run "alarm_watches_the_application_log_group" {
  command = plan

  variables {
    application_log_group_name = "/aws/lambda/example-prod"
  }

  assert {
    condition     = aws_cloudwatch_log_metric_filter.email_delivery_failure[0].log_group_name == "/aws/lambda/example-prod"
    error_message = "The metric filter must read the application log group."
  }

  assert {
    condition     = can(regex("EMAIL_DELIVERY_FAILED", aws_cloudwatch_log_metric_filter.email_delivery_failure[0].pattern))
    error_message = "The filter must match the marker the email service logs; see coalition/endorsements/email_service.py."
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.email_delivery_failure[0].threshold == 0
    error_message = "A single undelivered verification email is already a user-visible outage."
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.email_delivery_failure[0].comparison_operator == "GreaterThanThreshold"
    error_message = "The alarm must fire when failures exceed zero."
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.email_delivery_failure[0].treat_missing_data == "notBreaching"
    error_message = "No log events must read as healthy, not as insufficient data."
  }

  assert {
    condition     = length(aws_cloudwatch_metric_alarm.email_delivery_failure[0].alarm_actions) > 0
    error_message = "The alarm must notify somebody; an alarm with no action is not louder than a log line."
  }
}
