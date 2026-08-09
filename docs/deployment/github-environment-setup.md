# GitHub Environment Setup for AWS SES

This guide explains how to configure GitHub environment variables for AWS SES email configuration in your deployment workflow.

## Adding SES Variables to GitHub

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Environments**
3. Select your `prod` environment (or create one if it doesn't exist)

### 2. Add Environment Variables

Add the following **Environment variables** (not secrets):

#### Infrastructure Variables

| Variable Name            | Example Value            | Description                                              |
| ------------------------ | ------------------------ | -------------------------------------------------------- |
| `SES_FROM_EMAIL`         | `noreply@yourdomain.com` | Domain sender identity provisioned by Terraform          |
| `SES_NOTIFICATION_EMAIL` | `admin@yourdomain.com`   | Recipient for SES bounce, complaint, and delivery events |

#### Lambda Application Variables

| Variable Name               | Example Value                         | Description                                                |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `DEFAULT_FROM_EMAIL`        | `noreply@yourdomain.com`              | Sender used by Django; required for production deployments |
| `SITE_URL`                  | `https://yourdomain.com`              | Base URL for verification links; required for production   |
| `ADMIN_NOTIFICATION_EMAILS` | `admin1@domain.com,admin2@domain.com` | Comma-separated admin notification recipients              |
| `SES_CONFIGURATION_SET`     | `your-prefix-config-set`              | SES configuration set for delivery and bounce events       |

`API_URL` is derived from the environment's `PRODUCTION_API_URL` or `DEVELOPMENT_API_URL` variable.

### 3. How to Add Variables

1. In your environment settings, scroll to **Environment variables**
2. Click **Add variable**
3. Enter the name and value for each variable
4. Click **Add variable** to save

### Example Configuration

```yaml
# These will be used in the workflow as:
SES_FROM_EMAIL: noreply@example.com
SES_NOTIFICATION_EMAIL: admin@example.com
DEFAULT_FROM_EMAIL: noreply@example.com
SITE_URL: https://example.com
ADMIN_NOTIFICATION_EMAILS: admin1@example.com,admin2@example.com
SES_CONFIGURATION_SET: coalition-config-set
```

## How It Works

The `deploy_infra.yml` workflow:

1. Passes `SES_FROM_EMAIL` and `SES_NOTIFICATION_EMAIL` to Terraform.
2. Verifies the SES domain and configures DKIM, SPF, DMARC, notifications, and scoped sender-role permissions.
3. Provisions the production SES API VPC endpoint and delivery-failure alarm.

The `deploy_lambda.yml` workflow separately validates and bakes the application variables into the Lambda configuration. Lambda authenticates to the SES API with its execution role; it does not receive static SMTP credentials.

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

For domain verification, ensure:

- Your domain uses Route53 for DNS
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
   - Grant the Lambda execution role SES send permission
   - Create the production SES API VPC endpoint and monitoring resources

2. **You need to**:
   - Request production access in AWS SES console (one-time)
   - Confirm SNS email subscription for notifications
   - Deploy Lambda after the infrastructure is ready

## Verification

After deployment, verify the setup:

1. **Check AWS Console**:

   - SES → Verified identities → Your domain should be verified
   - VPC → Endpoints → the production `email` interface endpoint should be available
   - SES → Account dashboard → production access should be enabled

2. **Check Lambda and CloudWatch**:

   - Lambda configuration contains `DEFAULT_FROM_EMAIL`, `SITE_URL`, and the optional notification variables
   - Successful sends appear in SES metrics
   - Delivery failures increment the `EmailDeliveryFailures` metric and alarm

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
- Verify `DEFAULT_FROM_EMAIL` matches the authorized SES domain
- Confirm the SES API endpoint resolves to a private address from Lambda
- Check Lambda logs for `EMAIL_DELIVERY_FAILED`
- Verify the execution role is included in the SES module's `sender_role_names`

## Cost

The SES API interface endpoint adds an hourly VPC endpoint charge even at zero traffic. Message pricing depends on the account's SES plan, and free usage depends on account credit or legacy eligibility. Check the [current SES pricing](https://aws.amazon.com/ses/pricing/) and the [measured infrastructure cost analysis](aws.md#cost-analysis).
