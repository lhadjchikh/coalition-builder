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
ses_from_email         = "noreply@yourdomain.com"
ses_verify_domain      = true
ses_notification_email = "admin@yourdomain.com"  # For bounce notifications
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

The application uses a custom `SafeSMTPBackend` that:

- Attempts to send via SMTP (SES)
- Falls back to console output if SMTP fails
- Has shorter timeouts to prevent hanging
- Logs all email activity for debugging

Location: `backend/coalition/core/email_backend.py`

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

2. **"Connection timeout"**
   - ECS task cannot reach SES endpoint
   - Solution: Ensure ECS is in public subnet with internet access

3. **"Invalid credentials"**
   - SMTP credentials are incorrect
   - Solution: Regenerate SMTP credentials in SES console

4. **"Rate exceeded"**
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
