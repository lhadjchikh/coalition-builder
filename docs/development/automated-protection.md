# Site Password Protection

Coalition Builder provides automated password protection through environment variables and infrastructure deployment.

## Overview

The system protects your site using multiple authentication layers:

- **Next.js Middleware**: HTTP Basic Authentication in SSR container
- **nginx Proxy**: Optional reverse proxy with HTTP Basic Authentication
- **Django Middleware**: Session-based authentication for API endpoints

## Production Management

### GitHub Secrets Setup

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `SITE_PASSWORD_ENABLED`: `true` or `false`
   - `SITE_USERNAME`: Username for HTTP Basic Auth
   - `SITE_PASSWORD`: Secure password for site access
3. Push changes to the `terraform/` directory to trigger deployment

### Infrastructure Integration

The `deploy_infra.yml` workflow automatically:

1. Reads secrets from GitHub repository
2. Passes variables to Terraform configuration
3. Updates ECS containers with new environment variables
4. Stores passwords securely in AWS Secrets Manager

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
