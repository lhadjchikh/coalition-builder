# Site Password Protection

Coalition Builder contains optional password-protection middleware for local and deployed runtimes. The current deployment workflows do not configure it automatically.

## Overview

The repository contains these authentication layers:

- **Next.js proxy**: HTTP Basic Authentication for frontend routes
- **nginx proxy**: Optional local reverse proxy with HTTP Basic Authentication
- **Django middleware**: Session-based password protection for backend routes

## Production Management

### Current Automation Boundary

The infrastructure workflow does not enable or update application-level password protection. It reads the selected GitHub Environment's `SITE_PASSWORD` secret as a Terraform variable and stores it in SSM Parameter Store and Secrets Manager, but it does not add `SITE_PASSWORD_ENABLED`, `SITE_USERNAME`, or `SITE_PASSWORD` to Lambda or Vercel.

Both applications default password protection to disabled when their runtime variables are absent. Do not set these values only through the Lambda or Vercel consoles: the next application deployment can replace console-managed configuration.

Before relying on this control in a deployed environment, wire the variables into the deployment pipelines and redeploy:

- Lambda: add `SITE_PASSWORD_ENABLED` and `SITE_PASSWORD` to `backend/scripts/configure_zappa.py` and pass them from `deploy_lambda.yml`.
- Vercel: pass `SITE_PASSWORD_ENABLED`, `SITE_USERNAME`, and `SITE_PASSWORD` from protected GitHub configuration in `deploy_frontend.yml`.

Until both paths are implemented and verified, treat deployed password protection as unsupported.

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

- **Frontend routes**: The Next.js proxy can protect routes after its variables are wired into the Vercel deployment.
- **Backend routes**: Django lockdown can protect routes after its variables are wired into the Lambda deployment.
- **Current deployment state**: Neither workflow supplies those variables, so protection is disabled.

## Deployment Inputs

No repository or environment secret currently enables protection by itself. When deployment support is implemented, use protected configuration with these meanings:

| Name                    | Runtime           | Description                                   |
| ----------------------- | ----------------- | --------------------------------------------- |
| `SITE_PASSWORD_ENABLED` | Lambda and Vercel | Enable protection (`true`, `1`, or `yes`)     |
| `SITE_USERNAME`         | Vercel            | HTTP Basic Auth username; defaults to `admin` |
| `SITE_PASSWORD`         | Lambda and Vercel | Password; required when protection is enabled |

## Security Features

- **AWS storage**: Terraform stores `SITE_PASSWORD` in SSM Parameter Store and Secrets Manager.
- **Local environment variables**: Enable and configure protection during development.
- **Separate application layers**: Frontend and backend protection must be configured and verified independently.
