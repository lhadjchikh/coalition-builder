# Email Configuration with AWS SES

## Overview

The Coalition Builder uses AWS Simple Email Service (SES) for sending transactional emails like endorsement verifications and admin notifications. Since the ECS tasks run in public subnets with internet access, we can use SES via SMTP.

## Automated Setup with Terraform

The Terraform configuration includes an SES module that automates most of the setup:

1. **Domain Verification** - Automatically verifies your domain if you provide a Route53 zone ID
2. **DKIM Setup** - Configures DKIM for better deliverability
3. **SPF & DMARC Records** - Sets up email authentication records
4. **SMTP Credentials** - Creates IAM user and stores credentials in Secrets Manager
5. **Monitoring** - Sets up SNS notifications for bounces and complaints

### Enable SES in Terraform

Add these variables to your `terraform.tfvars`:

```hcl
# Email configuration
ses_from_email            = "noreply@yourdomain.com"
ses_verify_domain         = true
ses_notification_email    = "admin@yourdomain.com"  # For bounce notifications

# Application email settings
contact_email             = "info@yourdomain.com"  # Organization contact email
admin_notification_emails = "admin1@yourdomain.com,admin2@yourdomain.com"  # Comma-separated admin emails
organization_name         = "Your Organization Name"
```

The module will:

- Verify your domain automatically if you're using Route53
- Create all necessary DNS records (DKIM, SPF, DMARC)
- Generate SMTP credentials with IAM user
- **Automatically calculate the SMTP password** from the IAM secret
- Store complete credentials in AWS Secrets Manager
- Configure the ECS task to use them automatically

## AWS SES Setup

### 1. Verify Your Domain or Email Address

Before you can send emails with SES, you need to verify either:

- Your entire domain (recommended for production)
- Individual email addresses (quick for testing)

#### Verify a Domain (Recommended)

```bash
# In AWS Console -> SES -> Verified identities -> Create identity
# Choose "Domain" and enter your domain name
# Add the provided DNS records to your domain's DNS settings
```

#### Verify an Email Address (For Testing)

```bash
aws ses verify-email-identity --email-address your-email@example.com
# Check your email and click the verification link
```

### 2. Move Out of Sandbox (For Production)

By default, SES is in sandbox mode where you can only send to verified emails.

To request production access:

1. Go to AWS Console → SES → Account dashboard
2. Click "Request production access"
3. Fill out the form explaining your use case
4. Wait for approval (usually 24 hours)

### 3. Create SMTP Credentials (Manual Method)

If not using Terraform automation:

```bash
# In AWS Console -> SES -> SMTP settings -> Create SMTP credentials
# This creates an IAM user with SES permissions
# Save the SMTP username and password securely
```

The SMTP password is automatically calculated by Terraform using the included Python script.

### 4. Configure Environment Variables

Add these to your `.env` file or AWS Secrets Manager:

```bash
# For SES SMTP (us-east-1 region)
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<Your SES SMTP Username>
EMAIL_HOST_PASSWORD=<Your SES SMTP Password>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Application settings
CONTACT_EMAIL=info@yourdomain.com
ADMIN_NOTIFICATION_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
ORGANIZATION_NAME=Your Organization Name
```

For other regions, replace `us-east-1` with your region:

- US East (N. Virginia): email-smtp.us-east-1.amazonaws.com
- US West (Oregon): email-smtp.us-west-2.amazonaws.com
- EU (Ireland): email-smtp.eu-west-1.amazonaws.com

### 5. Store Credentials in AWS Secrets Manager

For production, store the SMTP credentials in Secrets Manager:

```bash
# Create a secret for email configuration
aws secretsmanager create-secret \
  --name coalition/email-config \
  --description "Email configuration for Coalition Builder" \
  --secret-string '{
    "EMAIL_HOST": "email-smtp.us-east-1.amazonaws.com",
    "EMAIL_PORT": "587",
    "EMAIL_USE_TLS": "True",
    "EMAIL_HOST_USER": "your-ses-smtp-username",
    "EMAIL_HOST_PASSWORD": "your-ses-smtp-password",
    "DEFAULT_FROM_EMAIL": "noreply@yourdomain.com"
  }'
```

### 6. Update ECS Task Definition

The ECS task definition needs to pull these secrets. Add to your task definition:

```json
"secrets": [
  {
    "name": "EMAIL_HOST",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:coalition/email-config:EMAIL_HOST::"
  },
  {
    "name": "EMAIL_HOST_USER",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:coalition/email-config:EMAIL_HOST_USER::"
  },
  {
    "name": "EMAIL_HOST_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:coalition/email-config:EMAIL_HOST_PASSWORD::"
  },
  {
    "name": "DEFAULT_FROM_EMAIL",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:coalition/email-config:DEFAULT_FROM_EMAIL::"
  }
]
```

## Email Backend

Which backend Django uses is decided in `backend/coalition/core/settings.py` and depends on where the app runs:

| Environment          | Backend                                        | Transport                   |
| -------------------- | ---------------------------------------------- | --------------------------- |
| `DEBUG=True` (local) | Django's console backend                       | Printed to stdout           |
| Lambda (`IS_LAMBDA`) | `coalition.core.ses_backend.SESEmailBackend`   | SES API over a VPC endpoint |
| Other deployments    | `coalition.core.email_backend.SafeSMTPBackend` | SES SMTP on port 587        |

Set `EMAIL_BACKEND` explicitly to override the choice.

**Neither production backend falls back to the console.** A failure that is logged instead of raised looks exactly like a delivered email to every caller, so an outage stays invisible while users wait for verification links that were never sent. Both backends raise instead, and `SafeSMTPBackend` also raises `ImproperlyConfigured` when `EMAIL_HOST` or `EMAIL_PORT` is missing rather than quietly discarding mail. The console fallback exists only under `DEBUG`.

### Sending from Lambda

Lambda runs in private subnets with no NAT gateway and no `0.0.0.0/0` route, so `email-smtp.<region>.amazonaws.com:587` is unreachable — connections simply hang. Two things make delivery work:

- An interface VPC endpoint for `com.amazonaws.<region>.email` (enabled with `enable_ses_endpoint` in the networking module). Its private DNS maps `email.<region>.amazonaws.com` onto the endpoint, so the AWS SDK needs no `endpoint_url` override.
- `ses:SendEmail` / `ses:SendRawEmail` granted to the Lambda execution role via the SES module's `sender_role_names`, scoped to the verified domain. This replaces static SMTP credentials entirely — there are no access keys to rotate or leak.

Location: `backend/coalition/core/ses_backend.py`

### Required deployment settings

Django's defaults for these are local-development values, and a deploy that misses them sends mail that is technically delivered but useless — verification links pointing at `http://localhost:3000`. Prod deploys refuse to proceed without the first two (`backend/scripts/configure_zappa.py`):

| GitHub environment variable | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `SITE_URL`                  | Base URL for verification links (**required for prod**)          |
| `DEFAULT_FROM_EMAIL`        | Sender address; must pass the SES policy (**required for prod**) |
| `API_URL`                   | Base URL for admin links in notification emails                  |
| `ADMIN_NOTIFICATION_EMAILS` | Comma-separated recipients for new-endorsement notices           |
| `SES_CONFIGURATION_SET`     | SES configuration set recording bounces and deliveries           |

### Failure handling and alerting

`EndorsementEmailService` sends inside `transaction.atomic()`, so it deliberately converts transport failures into `False` plus a logged error rather than letting them propagate — an exception there would roll back the endorsement the user just submitted and turn a mail outage into silent data loss.

Because the failure is contained, an alarm is what makes it visible. The service logs the marker `EMAIL_DELIVERY_FAILED`, which a CloudWatch metric filter turns into the `EmailDeliveryFailures` metric behind the `<prefix>-email-delivery-failure` alarm (see `terraform/modules/monitoring/main.tf`). The alarm fires on the first failure and notifies the `<prefix>-email-delivery-alerts` SNS topic. Changing the marker string means updating the metric filter too.

## Testing Email Configuration

### 1. Test in Development

```bash
# Emails will be logged to console in DEBUG mode
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test Subject', 'Test message', 'from@example.com', ['to@example.com'])
```

### 2. Test in Production

```bash
# SSH into bastion or ECS task
# Check environment variables are set
env | grep EMAIL

# Test sending
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test Subject', 'Test message', None, ['verified@example.com'])
```

### 3. Monitor SES

- Check AWS Console → SES → Sending statistics
- Set up SNS notifications for bounces and complaints
- Monitor CloudWatch metrics for send rate

## Troubleshooting

### Common Issues

1. **"Email address is not verified"**
   - You're in sandbox mode and trying to send to unverified address
   - Solution: Verify the recipient or request production access

2. **"Connection timeout" or a request that hangs until the Lambda times out**
   - The task cannot reach the SES endpoint. On Lambda this means the SES interface VPC endpoint is missing: the private subnets have no NAT and no default route, so the connection never completes rather than failing fast.
   - Solution: set `enable_ses_endpoint = true` for the environment. Confirm with `socket.gethostbyname("email.<region>.amazonaws.com")` from inside the function — it must return a private VPC address, not a public one.
   - For non-Lambda deployments, ensure the task has internet egress.

3. **"Invalid credentials"**
   - SMTP credentials are incorrect
   - Solution: Regenerate SMTP credentials in SES console. On Lambda this error should not occur at all — it authenticates with the execution role, so check `sender_role_names` and the `ses:FromAddress` condition instead.

4. **"Email address is not verified" for ordinary users**
   - The account is still in the SES sandbox, which only permits verified recipients. Sending to your own verified domain succeeds while every real endorser is rejected, so this can look like a partial outage.
   - Solution: request production access (see "Move Out of Sandbox" above), then confirm with `aws sesv2 get-account --query ProductionAccessEnabled`.

5. **"Rate exceeded"**
   - Sending too many emails too quickly
   - Solution: Implement rate limiting or request higher SES limits

### Debug Mode

To see detailed email logs:

```python
# In settings.py
LOGGING = {
    'loggers': {
        'django.core.mail': {
            'level': 'DEBUG',
        },
        'coalition.core.email_backend': {
            'level': 'DEBUG',
        },
    }
}
```

## Cost Optimization

- **First 62,000 emails/month from EC2/ECS**: Free
- **Additional emails**: $0.10 per 1,000 emails
- **Data transfer**: $0.12 per GB of attachments

For low-traffic sites, you'll likely stay within the free tier.

## Security Best Practices

1. **Never commit SMTP credentials** to version control
2. **Use IAM roles** for ECS tasks instead of access keys when possible
3. **Enable DKIM signing** for better deliverability
4. **Set up SPF records** in your DNS
5. **Monitor for bounces and complaints** to maintain sender reputation
6. **Use dedicated IPs** only for high-volume sending (>100k/month)

## Alternative: Using SES API Directly

If you prefer using the SES API instead of SMTP, you can use boto3:

```python
# In settings.py
EMAIL_BACKEND = 'django_ses.SESBackend'  # requires django-ses package

# Or create custom backend using boto3
import boto3
ses_client = boto3.client('ses', region_name='us-east-1')
ses_client.send_email(
    Source='noreply@example.com',
    Destination={'ToAddresses': ['recipient@example.com']},
    Message={
        'Subject': {'Data': 'Test'},
        'Body': {'Text': {'Data': 'Test message'}}
    }
)
```

The SMTP approach is simpler and doesn't require additional dependencies.
