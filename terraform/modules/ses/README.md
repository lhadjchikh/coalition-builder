# SES Module

This module configures AWS Simple Email Service (SES) for sending transactional emails from the Coalition Builder application.

## Features

- **Automatic Domain Verification** - Verifies your domain with Route53 integration
- **DKIM Configuration** - Sets up DKIM records for email authentication
- **SPF & DMARC Records** - Configures email authentication records
- **Optional SMTP Credentials** - Generates credentials for non-role-based deployments when enabled
- **Password Calculation** - Calculates the SES SMTP password from the IAM secret when credentials are enabled
- **Secrets Management** - Stores only SMTP connection fields in AWS Secrets Manager
- **Monitoring** - SNS notifications for bounces and complaints

## Usage

```hcl
module "ses" {
  source = "./modules/ses"

  prefix               = var.prefix
  aws_region           = var.aws_region
  domain_name          = var.domain_name
  from_email           = "noreply@yourdomain.com"
  create_smtp_credentials = true
  verify_domain        = true
  route53_zone_id      = var.route53_zone_id
  notification_email   = "admin@yourdomain.com"
  enable_notifications = true
}
```

## Variables

| Name                      | Description                                      | Type           | Default | Required |
| ------------------------- | ------------------------------------------------ | -------------- | ------- | -------- |
| `prefix`                  | Prefix for resource names                        | `string`       | -       | yes      |
| `aws_region`              | AWS region                                       | `string`       | -       | yes      |
| `domain_name`             | Domain name for sending emails                   | `string`       | -       | yes      |
| `from_email`              | Default from email address                       | `string`       | -       | yes      |
| `create_smtp_credentials` | Whether to create long-lived SMTP credentials    | `bool`         | `true`  | no       |
| `verify_domain`           | Whether to verify the entire domain              | `bool`         | `true`  | no       |
| `verify_email`            | Whether to verify individual email (fallback)    | `bool`         | `false` | no       |
| `route53_zone_id`         | Route53 zone ID for automatic DNS verification   | `string`       | `""`    | no       |
| `create_spf_record`       | Whether to create SPF record                     | `bool`         | `true`  | no       |
| `create_dmarc_record`     | Whether to create DMARC record                   | `bool`         | `true`  | no       |
| `dmarc_email`             | Email for DMARC reports                          | `string`       | `""`    | no       |
| `enable_notifications`    | Enable SNS notifications for SES events          | `bool`         | `true`  | no       |
| `notification_email`      | Email for receiving SES notifications            | `string`       | `""`    | no       |
| `sender_role_names`       | IAM roles granted role-based SES API send access | `list(string)` | `[]`    | no       |

## Outputs

| Name                   | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `ses_smtp_secret_arn`  | ARN of the optional Secrets Manager SMTP secret  |
| `ses_smtp_secret_name` | Name of the optional Secrets Manager SMTP secret |
| `ses_domain_identity`  | The verified SES domain identity                 |
| `ses_smtp_username`    | Optional SMTP username (sensitive)               |
| `smtp_endpoint`        | SES SMTP endpoint                                |
| `smtp_port`            | SES SMTP port (587)                              |

## How It Works

1. **Domain Verification**: If `route53_zone_id` is provided, the module automatically creates verification records
2. **DKIM Setup**: Creates three CNAME records for DKIM signing
3. **Role Authorization**: Grants configured `sender_role_names` permission to send through the SES API
4. **Optional IAM User Creation**: When `create_smtp_credentials` is true, creates an IAM user with SES sending permissions
5. **Optional Password Calculation**: Uses a Python script to calculate the SMTP password from the IAM secret key
6. **Optional Secret Storage**: Stores the SMTP connection fields in AWS Secrets Manager

## SMTP Password Calculation

AWS SES requires a specific algorithm to convert IAM credentials to SMTP passwords:

```python
# The module automatically runs this calculation
signature = hmac.new(
    ('AWS4' + secret_access_key).encode('utf-8'),
    msg='SendRawEmail'.encode('utf-8'),
    digestmod=hashlib.sha256
).digest()
smtp_password = base64.b64encode(b'\x04' + signature).decode('utf-8')
```

When `create_smtp_credentials` is enabled, this is handled automatically by the `calculate_ses_password.py` script.

## Manual Steps Required

1. **Request Production Access**:
   - New SES accounts start in sandbox mode
   - Request production access in AWS Console → SES → Account dashboard
   - Takes ~24 hours for approval

2. **Verify SNS Subscription**:
   - If notifications are enabled, confirm the SNS email subscription

## Example terraform.tfvars

```hcl
# Email configuration
ses_from_email         = "noreply@example.com"
ses_verify_domain      = true
ses_notification_email = "admin@example.com"
```

## Cost

- **Email Sending**: First 62,000 emails/month free from EC2/ECS
- **Additional Emails**: $0.10 per 1,000 emails
- **Secrets Manager**: ~$0.40/month per secret
- **SNS Notifications**: Minimal cost for email notifications

## Troubleshooting

### Domain Not Verifying

- Ensure Route53 zone ID is correct
- Check DNS propagation (can take up to 72 hours)
- Verify records manually in Route53 console

### SMTP Authentication Failing

- Check Secrets Manager for correct credentials
- Ensure ECS task role has permission to read secrets
- Verify you're using the correct AWS region endpoint

### Emails Not Sending

- Check if you're still in SES sandbox mode
- Verify recipient addresses if in sandbox
- Check CloudWatch logs for error messages
- Monitor SES sending statistics in AWS Console
