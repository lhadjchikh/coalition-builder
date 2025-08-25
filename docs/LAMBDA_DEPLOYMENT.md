# Lambda Deployment Configuration

## GitHub Environment Variables

The Lambda deployment workflows use GitHub environment variables for configuration. These should be set up for each environment (dev, staging, production).

### Required Secrets

Set these as **repository secrets** or **environment secrets**:

- `AWS_ACCESS_KEY_ID`: AWS access key for deployments
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `ECS_SUBNET_IDS`: Comma-separated subnet IDs for ECS tasks
- `ECS_SECURITY_GROUP`: Security group ID for ECS tasks

### Environment Variables

Set these as **environment variables** (not secrets) for each environment:

#### Development Environment

- `DOMAIN_NAME`: `api-dev.yourdomain.com` (optional)
- `CERTIFICATE_ARN`: ACM certificate ARN for the domain (optional)

#### Staging Environment

- `DOMAIN_NAME`: `api-staging.yourdomain.com` (optional)
- `CERTIFICATE_ARN`: ACM certificate ARN for the domain (optional)

#### Production Environment

- `DOMAIN_NAME`: `api.yourdomain.com` (optional)
- `CERTIFICATE_ARN`: ACM certificate ARN for the domain (optional)

## Setting Up Variables in GitHub

1. Go to your repository Settings
2. Navigate to Environments
3. Create or select an environment (dev, staging, production)
4. Add the environment variables:
   - Click "Add environment variable"
   - Enter the name (e.g., `DOMAIN_NAME`)
   - Enter the value (e.g., `api.yourdomain.com`)
   - Save

## Certificate Setup

Before configuring custom domains, you need to:

1. **Request an ACM certificate** in us-east-1 region:

   ```bash
   aws acm request-certificate \
     --domain-name api.yourdomain.com \
     --validation-method DNS \
     --subject-alternative-names api-dev.yourdomain.com api-staging.yourdomain.com \
     --region us-east-1
   ```

2. **Validate the certificate** by adding the DNS records provided by ACM

3. **Get the certificate ARN**:

   ```bash
   aws acm list-certificates --region us-east-1
   ```

4. **Add the certificate ARN** to the GitHub environment variables

## Deployment Workflow

The deployment workflow automatically:

1. Builds and pushes Docker image to ECR
2. Updates Zappa settings with the ECR image URI
3. Configures custom domain (if DOMAIN_NAME and CERTIFICATE_ARN are set)
4. Deploys or updates the Lambda function
5. Certifies the custom domain with API Gateway
6. Runs health checks

## Manual Domain Configuration

If you need to manually configure a domain after deployment:

```bash
# Update zappa_settings.json with domain and certificate
cd backend
poetry run zappa certify production --yes
```

## DNS Configuration

After deployment with a custom domain:

1. Get the API Gateway domain name:

   ```bash
   poetry run zappa status production | grep "Domain"
   ```

2. Create a CNAME record in your DNS:
   - Name: `api` (or `api-dev`, `api-staging`)
   - Type: CNAME
   - Value: The API Gateway domain (e.g., `d123456.execute-api.us-east-1.amazonaws.com`)

## Cost Optimization

The configuration includes several cost-saving measures:

- **Development**: No keep-warm, smaller memory allocation (512MB)
- **Staging**: Keep-warm every 10 minutes, medium memory (512MB)
- **Production**: Keep-warm every 4 minutes, larger memory (1024MB)

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/coalition-{environment}`
- **X-Ray Tracing**: Enabled for production
- **API Gateway Metrics**: Available in CloudWatch

## Troubleshooting

### Domain Not Working

- Verify certificate is validated in ACM
- Check DNS propagation (can take up to 48 hours)
- Ensure certificate covers the exact domain name
- Run `zappa certify {env} --yes` to reconfigure

### Lambda Timeout

- Check CloudWatch logs: `zappa tail {env}`
- Increase timeout in zappa_settings.json
- Optimize database queries

### Cold Start Issues

- Enable keep_warm for production
- Increase memory allocation
- Use provisioned concurrency for critical endpoints
