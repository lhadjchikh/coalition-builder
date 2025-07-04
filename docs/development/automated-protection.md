# Automated Password Protection

Coalition Builder includes a GitHub workflow that updates site password protection settings via environment variables.

## Quick Start

### Manual Control via GitHub Actions

1. Go to **Actions** → **Update Site Protection Settings**
2. Click **Run workflow**
3. Fill in the options:
   - **Enable protection**: `true` or `false`
   - **Username**: Username for HTTP Basic Auth
   - **Password**: Password for HTTP Basic Auth (required if enabling)
   - **Environment**: `development` or `production`
4. Run the workflow

The workflow will update the `.env` file and commit the changes.

## How It Works

### Development Environment

When targeting the development environment, the workflow:

1. Updates the `.env` file with the new settings
2. Commits and pushes the changes
3. You then pull the changes and restart Docker containers

Example `.env` changes:
```bash
# Site password protection
SITE_PASSWORD_ENABLED=true
SITE_USERNAME=admin
SITE_PASSWORD=your-secure-password
```

### Production Environment

For production, the workflow provides instructions for Terraform deployment:

```bash
export TF_VAR_site_password_enabled=true
export TF_VAR_site_password="your-secure-password"
terraform apply
```

## Workflow Inputs

| Input | Required | Description | Options |
|-------|----------|-------------|---------|
| `enabled` | Yes | Enable protection | `true`, `false` |
| `username` | No | Auth username | Default: `admin` |
| `password` | No* | Auth password | *Required if enabling |
| `environment` | Yes | Target environment | `development`, `production` |

## Usage Examples

### Enable Protection

```yaml
enabled: true
username: admin
password: secure-dev-password-2024
environment: development
```

### Disable Protection

```yaml
enabled: false
environment: development
```

## Security Considerations

- **Passwords in Workflow**: Be cautious when entering passwords in the workflow UI
- **Use Secrets**: For automated runs, consider using repository secrets
- **Production Safety**: Production changes require manual Terraform deployment

## Next Steps After Workflow

### Development
1. Pull the latest changes: `git pull`
2. Restart containers: `docker compose up -d`
3. Test the protection

### Production
1. Set the Terraform variables as shown
2. Run `terraform apply`
3. Verify the deployment