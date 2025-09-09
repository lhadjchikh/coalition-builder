# GitHub Environment Setup for AWS SES

This guide explains how to configure GitHub environment variables for AWS SES email configuration in your deployment workflow.

## Adding SES Variables to GitHub

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Environments**
3. Select your `prod` environment (or create one if it doesn't exist)

### 2. Add Environment Variables

Add the following **Environment variables** (not secrets):

#### Email Configuration Variables

| Variable Name               | Example Value                         | Description                                   |
| --------------------------- | ------------------------------------- | --------------------------------------------- |
| `SES_FROM_EMAIL`            | `noreply@yourdomain.com`              | Default sender email address                  |
| `SES_VERIFY_DOMAIN`         | `true`                                | Whether to verify entire domain               |
| `SES_NOTIFICATION_EMAIL`    | `admin@yourdomain.com`                | Email for bounce/complaint notifications      |
| `CONTACT_EMAIL`             | `info@yourdomain.com`                 | Organization contact email                    |
| `ADMIN_NOTIFICATION_EMAILS` | `admin1@domain.com,admin2@domain.com` | Comma-separated admin emails for endorsements |
| `ORGANIZATION_NAME`         | `Your Organization Name`              | Organization name for email templates         |

### 3. How to Add Variables

1. In your environment settings, scroll to **Environment variables**
2. Click **Add variable**
3. Enter the name and value for each variable
4. Click **Add variable** to save

### Example Configuration

```yaml
# These will be used in the workflow as:
SES_FROM_EMAIL: noreply@example.com
SES_VERIFY_DOMAIN: true
SES_NOTIFICATION_EMAIL: admin@example.com
CONTACT_EMAIL: info@example.com
ADMIN_NOTIFICATION_EMAILS: admin1@example.com,admin2@example.com
ORGANIZATION_NAME: Coalition for Climate Action
```

## How It Works

The `deploy_infra.yml` workflow automatically:

1. **Reads these variables** from your GitHub environment
2. **Passes them to Terraform** as `TF_VAR_ses_*` environment variables
3. **Terraform uses them** to configure AWS SES:
   - Creates IAM user with SES permissions
   - Verifies your domain (if using Route53)
   - Sets up DKIM, SPF, and DMARC records
   - Generates SMTP credentials
   - Stores everything in AWS Secrets Manager
   - Configures ECS to use the credentials

## Important Notes

### Admin Notification Emails

The `ADMIN_NOTIFICATION_EMAILS` variable is crucial for:

- Receiving notifications when new endorsements are submitted
- Getting alerts about endorsements requiring moderation
- System notifications about potential spam or issues

Make sure to:

- Use verified email addresses
- Separate multiple emails with commas (no spaces)
- Monitor these inboxes regularly

### Domain Verification

If `SES_VERIFY_DOMAIN` is `true`, ensure:

- Your domain uses Route53 for DNS
- The `TF_VAR_ROUTE53_ZONE_ID` variable is set correctly
- The domain matches your `TF_VAR_DOMAIN_NAME`

### Email Address Format

- Use a subdomain for no-reply addresses: `noreply@yourdomain.com`
- Use a monitored address for notifications: `admin@yourdomain.com`
- Ensure the domain matches your application domain

### First Deployment

On first deployment with SES:

1. **Terraform will**:

   - Create all SES resources
   - Verify your domain automatically (if using Route53)
   - Generate and store SMTP credentials

2. **You need to**:
   - Request production access in AWS SES console (one-time)
   - Confirm SNS email subscription for notifications

## Verification

After deployment, verify the setup:

1. **Check AWS Console**:

   - SES → Verified identities → Your domain should be verified
   - Secrets Manager → `your-prefix/ses-smtp-credentials` should exist

2. **Check ECS Logs**:

   - Email sending attempts will be logged
   - Successful sends show in SES statistics

3. **Test Email Sending**:
   - Trigger an endorsement verification email
   - Check CloudWatch logs for any errors

## Troubleshooting

### Variable Not Found

If Terraform can't find the variables:

- Ensure they're added to the correct environment
- Check the variable names match exactly
- Re-run the workflow after adding variables

### Domain Not Verifying

If domain verification fails:

- Check Route53 zone ID is correct
- Wait up to 72 hours for DNS propagation
- Manually check DNS records in Route53

### Emails Not Sending

If emails aren't being sent:

- Check you've moved out of SES sandbox
- Verify the from address if still in sandbox
- Check ECS task logs for errors
- Ensure Secrets Manager permissions are correct

## Cost

With these settings, your email costs will be:

- **First 62,000 emails/month**: Free (from ECS)
- **Additional emails**: $0.10 per 1,000 emails
- **Typical monthly cost**: $0 for low-traffic sites
