# SES Module - Email Service Configuration

# SES Domain Identity
resource "aws_ses_domain_identity" "main" {
  count  = var.verify_domain ? 1 : 0
  domain = var.domain_name
}

# SES Domain Verification Record (for Route53)
resource "aws_route53_record" "ses_verification" {
  count   = var.verify_domain && var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.main[0].verification_token]
}

# Wait for domain verification
resource "aws_ses_domain_identity_verification" "main" {
  count      = var.verify_domain && var.route53_zone_id != "" ? 1 : 0
  domain     = aws_ses_domain_identity.main[0].id
  depends_on = [aws_route53_record.ses_verification]
}

# SES DKIM tokens for better deliverability
resource "aws_ses_domain_dkim" "main" {
  count  = var.verify_domain ? 1 : 0
  domain = aws_ses_domain_identity.main[0].domain
}

# DKIM verification records in Route53
resource "aws_route53_record" "dkim" {
  count   = var.verify_domain && var.route53_zone_id != "" ? 3 : 0
  zone_id = var.route53_zone_id
  name    = "${element(aws_ses_domain_dkim.main[0].dkim_tokens, count.index)}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = "600"
  records = ["${element(aws_ses_domain_dkim.main[0].dkim_tokens, count.index)}.dkim.amazonses.com"]
}

# SPF record for domain
resource "aws_route53_record" "spf" {
  count   = var.verify_domain && var.route53_zone_id != "" && var.create_spf_record ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC record for domain
resource "aws_route53_record" "dmarc" {
  count   = var.verify_domain && var.route53_zone_id != "" && var.create_dmarc_record ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = "600"
  records = ["v=DMARC1; p=quarantine; rua=mailto:${var.dmarc_email}"]
}

# Email identity for fallback (if not using domain verification)
resource "aws_ses_email_identity" "main" {
  count = var.verify_email ? 1 : 0
  email = var.from_email
}

# IAM user for SMTP credentials
resource "aws_iam_user" "ses_smtp" {
  name = "${var.prefix}-ses-smtp-user"
  path = "/ses/"

  tags = {
    Name = "${var.prefix}-ses-smtp-user"
  }
}

# IAM access key for SMTP user
resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}

# IAM policy for SES sending
resource "aws_iam_user_policy" "ses_smtp" {
  name = "${var.prefix}-ses-smtp-policy"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = var.verify_domain ? ["*@${var.domain_name}", var.from_email] : [var.from_email]
          }
        }
      }
    ]
  })
}

# Calculate SES SMTP password using external data source
data "external" "smtp_password" {
  program = ["python3", "${path.module}/scripts/calculate_ses_password.py"]

  query = {
    secret_key = aws_iam_access_key.ses_smtp.secret
    region     = var.aws_region
  }
}

# Convert IAM credentials to SES SMTP password
locals {
  # For SMTP username, use the access key ID directly
  smtp_username = aws_iam_access_key.ses_smtp.id

  # The calculated SMTP password
  smtp_password = data.external.smtp_password.result.password
}

# Store SMTP credentials in Secrets Manager
resource "aws_secretsmanager_secret" "ses_smtp" {
  name                    = "${var.prefix}/ses-smtp-credentials"
  description             = "SES SMTP credentials for ${var.prefix}"
  recovery_window_in_days = var.secret_recovery_days

  tags = {
    Name = "${var.prefix}-ses-smtp-credentials"
  }
}


# Configuration set for tracking
resource "aws_ses_configuration_set" "main" {
  name = "${var.prefix}-config-set"
}

# Enable reputation tracking
resource "aws_ses_configuration_set" "main_reputation" {
  name = aws_ses_configuration_set.main.name

  reputation_tracking_enabled = true
}

# Event destination for bounce/complaint notifications
resource "aws_ses_event_destination" "sns" {
  count                  = var.enable_notifications ? 1 : 0
  name                   = "${var.prefix}-sns-destination"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true

  sns_destination {
    topic_arn = aws_sns_topic.ses_notifications[0].arn
  }

  matching_types = ["bounce", "complaint", "delivery", "reject"]
}

# SNS topic for SES notifications
resource "aws_sns_topic" "ses_notifications" {
  count = var.enable_notifications ? 1 : 0
  name  = "${var.prefix}-ses-notifications"

  tags = {
    Name = "${var.prefix}-ses-notifications"
  }
}

# SNS topic subscription for email notifications
resource "aws_sns_topic_subscription" "ses_email" {
  count     = var.enable_notifications && var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.ses_notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# Store credentials in Secrets Manager with calculated SMTP password
resource "aws_secretsmanager_secret_version" "ses_smtp" {
  secret_id = aws_secretsmanager_secret.ses_smtp.id
  secret_string = jsonencode({
    EMAIL_HOST          = "email-smtp.${var.aws_region}.amazonaws.com"
    EMAIL_PORT          = "587"
    EMAIL_USE_TLS       = "True"
    EMAIL_HOST_USER     = local.smtp_username
    EMAIL_HOST_PASSWORD = local.smtp_password # Automatically calculated!
    DEFAULT_FROM_EMAIL  = var.from_email
    # Also store raw IAM credentials if needed for SDK
    AWS_ACCESS_KEY_ID     = aws_iam_access_key.ses_smtp.id
    AWS_SECRET_ACCESS_KEY = aws_iam_access_key.ses_smtp.secret
  })
}