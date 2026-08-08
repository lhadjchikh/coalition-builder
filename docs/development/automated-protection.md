# Site Password Protection

Coalition Builder provides automated password protection through environment variables and infrastructure deployment.

## Overview

The system protects your site using multiple authentication layers:

- **Next.js Middleware**: HTTP Basic Authentication in SSR container
- **nginx Proxy**: Optional reverse proxy with HTTP Basic Authentication
- **Django Middleware**: Session-based authentication for API endpoints

## Production Management

### Current Automation Boundary

The infrastructure workflow does not enable or update application-level password protection. It reads the selected GitHub Environment's `SITE_PASSWORD` secret as a Terraform variable and stores it in SSM Parameter Store and Secrets Manager, but it does not add `SITE_PASSWORD_ENABLED`, `SITE_USERNAME`, or `SITE_PASSWORD` to Lambda or Vercel.

Both applications default password protection to disabled when those runtime variables are absent. Configure all three variables directly in each application runtime and redeploy before relying on this control; a Terraform deployment alone is insufficient.

### Infrastructure Integration

The `deploy_infra.yml` workflow automatically:

1. Reads `SITE_PASSWORD` from the selected GitHub Environment
2. Passes it to Terraform as `TF_VAR_site_password`
3. Stores it in SSM Parameter Store and AWS Secrets Manager

It does not update Lambda or Vercel environment variables.

## Development Environment

Set environment variables in your `.env` file:

```bash
# Enable password protection
SITE_PASSWORD_ENABLED=true
SITE_USERNAME=admin
SITE_PASSWORD=your-secure-password
```

Restart containers to apply changes:

```bash
docker compose up -d
```

## Access Methods

### Development

- **Direct SSR**: `http://localhost:3000` (Next.js middleware)
- **nginx Proxy**: `http://localhost:80` (HTTP Basic Auth)
- **Direct API**: `http://localhost:8000` (Django middleware)

### Production

- **Frontend Routes**: Protected by Next.js middleware
- **API Routes**: Protected by Django middleware
- **ALB Routing**: Automatically routes to protected containers

## Repository Secrets

| Secret                  | Required | Description                           |
| ----------------------- | -------- | ------------------------------------- |
| `SITE_PASSWORD_ENABLED` | Yes      | Enable protection (`true` or `false`) |
| `SITE_USERNAME`         | No\*     | HTTP Basic Auth username              |
| `SITE_PASSWORD`         | No\*     | Site access password                  |

\*Required when `SITE_PASSWORD_ENABLED` is `true`

## Security Features

- **AWS Secrets Manager**: Production passwords stored securely
- **Environment Variables**: Development configuration
- **Multiple Layers**: Different protection methods for different access patterns
- **Automatic Updates**: Changes deploy with infrastructure updates
