# Forking and Customization Guide

Coalition Builder is designed to be reusable by other advocacy organizations. This guide covers how to fork the project and customize it for your organization's specific needs.

## Overview

Coalition Builder can be easily customized for different advocacy groups through:

- **Environment variables** for basic configuration
- **Branding customization** for visual identity
- **Content management** through the Django admin interface
- **Code modifications** for advanced customization

## Forking the Repository

### Initial Setup

1. **Fork the repository** on GitHub to your organization's account

2. **Clone your fork and set up environment**:

   ```bash
   git clone https://github.com/your-org/coalition-builder.git
   cd coalition-builder
   cp .env.example .env
   ```

3. **Update organization-specific values in `.env`**:

   ```bash
   # Organization Information
   ORG_NAME="Your Organization Name"
   ORG_TAGLINE="Your mission statement"
   CONTACT_EMAIL="info@yourorg.org"

   # Database
   DB_NAME="your_db_name"

   # Domain settings (for production deployment)
   DOMAIN_NAME="yourdomain.org"
   TF_VAR_domain_name="yourdomain.org"
   TF_VAR_route53_zone_id="your-zone-id"
   TF_VAR_acm_certificate_arn="your-cert-arn"
   ```

4. **Start development or deploy**:

   ```bash
   # For local development
   docker-compose up

   # For cloud deployment
   # Follow terraform/README.md for cloud deployment
   ```

With these variables customized, the app will display your organization name and use your infrastructure settings.

## Configuration Options

### Environment Variables

The application supports extensive customization through environment variables. See the complete [Environment Variables Reference](../reference/environment.md) for all options.

**Essential Organization Configuration:**

| Variable            | Description                       | Example                                  |
| ------------------- | --------------------------------- | ---------------------------------------- |
| `ORGANIZATION_NAME` | Your organization's full name     | `"Environmental Defense Coalition"`      |
| `ORG_TAGLINE`       | Brief mission statement or slogan | `"Protecting our planet through policy"` |
| `CONTACT_EMAIL`     | Primary contact email             | `"info@environmentaldefense.org"`        |

**Database Configuration:**

| Variable       | Description                  | Example                                 |
| -------------- | ---------------------------- | --------------------------------------- |
| `DB_NAME`      | Name of your database        | `"environmental_coalition"`             |
| `DATABASE_URL` | Full database connection URL | `"postgresql://user:pass@host:5432/db"` |

**Deployment Configuration:**

| Variable      | Description                | Example                      |
| ------------- | -------------------------- | ---------------------------- |
| `DOMAIN_NAME` | Your organization's domain | `"environmentaldefense.org"` |
| `AWS_REGION`  | Preferred AWS region       | `"us-east-1"`                |
| `ENVIRONMENT` | Deployment environment     | `"production"`               |

### Frontend Customization

**React Application Branding:**

```bash
# Frontend environment variables
REACT_APP_ORG_NAME="Your Organization"
REACT_APP_TAGLINE="Your mission statement"
REACT_APP_PRIMARY_COLOR="#your-color"
REACT_APP_LOGO_URL="https://yoursite.com/logo.png"

# Analytics (optional)
REACT_APP_GA_TRACKING_ID="GA_MEASUREMENT_ID"
REACT_APP_HOTJAR_ID="1234567"
```

**Next.js SSR Configuration (if using SSR):**

```bash
# SSR-specific variables
API_URL="http://backend:8000"
NEXT_PUBLIC_API_URL="https://yourdomain.org/api"
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

## Content Management

Once deployed, you can customize all content through the Django admin interface without code changes:

### Accessing the Admin Interface

1. **Create a superuser account**:

   ```bash
   # Local development
   docker-compose exec backend poetry run python manage.py createsuperuser

   # Production deployment
   python manage.py createsuperuser
   ```

2. **Access the admin interface**:
   - Local: `http://localhost:8000/admin/`
   - Production: `https://yourdomain.org/admin/`

### Homepage Configuration

In the Django admin, navigate to **"Homepage Configurations"** to customize:

- **Organization Information**: Name, tagline, contact details
- **Hero Section**: Title, subtitle, background image
- **About Section**: Your organization's story and mission
- **Call-to-Action**: Encourage visitor engagement
- **Social Media**: Links to your organization's social profiles
- **Content Blocks**: Flexible content sections with rich text, images, and custom styling

### Campaign Management

Add your organization's specific campaigns:

- **Policy Campaigns**: Create campaigns specific to your advocacy focus
- **Campaign Details**: Rich text descriptions, status tracking, SEO-friendly URLs
- **Campaign Categories**: Organize campaigns by issue area

### Stakeholder Management

Manage your coalition members:

- **Stakeholder Types**: Farmers, businesses, nonprofits, individuals, etc.
- **Geographic Data**: Track stakeholder locations with PostGIS integration
- **Contact Information**: Email, phone, addresses for outreach
- **Public Profiles**: Control which stakeholders are publicly visible

### Endorsement Tracking

Track campaign support:

- **Campaign Endorsements**: Link stakeholders to campaigns they support
- **Endorsement Statements**: Optional public statements of support
- **Visibility Controls**: Manage which endorsements are publicly displayed

## Visual Customization

### Branding Configuration

Create a `branding.json` file for advanced visual customization:

```json
{
  "organization_name": "Your Organization",
  "primary_color": "#2e7d32",
  "secondary_color": "#1b5e20",
  "logo_url": "https://yoursite.com/logo.png",
  "favicon_url": "https://yoursite.com/favicon.ico",
  "hero_background": "https://yoursite.com/hero-bg.jpg",
  "social_media": {
    "facebook": "https://facebook.com/yourorg",
    "twitter": "https://twitter.com/yourorg",
    "instagram": "https://instagram.com/yourorg",
    "linkedin": "https://linkedin.com/company/yourorg"
  },
  "default_messaging": {
    "hero_title": "Join Our Movement",
    "cta_text": "Get Involved Today",
    "contact_prompt": "Ready to make a difference?"
  }
}
```

### Custom Styling

For advanced visual customization, you can modify:

- **CSS Variables**: Define custom colors, fonts, and spacing
- **Component Styling**: Customize React components with CSS modules or styled-components
- **Theme Configuration**: Update Material-UI theme for consistent styling

## Advanced Customization

### Code Modifications

For organizations with specific technical requirements:

**Backend Customization:**

- **Custom Models**: Add organization-specific data models
- **API Endpoints**: Create custom API endpoints for unique features
- **Admin Interface**: Customize Django admin for your workflow
- **Integrations**: Connect to external systems (CRM, email platforms, etc.)

**Frontend Customization:**

- **Custom Components**: Build organization-specific UI components
- **Page Layouts**: Modify page structures and navigation
- **Interactive Features**: Add custom forms, maps, or visualizations
- **Third-party Integrations**: Connect to analytics, chat, or marketing tools

### Database Schema Extensions

Add custom fields to existing models:

```python
# Custom stakeholder fields
class StakeholderProfile(models.Model):
    stakeholder = models.OneToOneField(Stakeholder, on_delete=models.CASCADE)
    membership_level = models.CharField(max_length=50)
    join_date = models.DateField()
    custom_tags = models.JSONField(default=list)

# Custom campaign fields
class CampaignExtended(models.Model):
    campaign = models.OneToOneField(PolicyCampaign, on_delete=models.CASCADE)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    target_date = models.DateField()
    success_metrics = models.JSONField(default=dict)
```

## Deployment Customization

### Infrastructure Configuration

Customize your AWS deployment through Terraform variables:

```bash
# terraform/terraform.tfvars
project_name = "your-organization"
environment = "production"
domain_name = "yourdomain.org"
aws_region = "us-east-1"

# Custom resource sizing
backend_cpu = 512
backend_memory = 1024
ssr_cpu = 256
ssr_memory = 512

# Database configuration
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_backup_retention_period = 7

# Monitoring and alerts
alert_email = "admin@yourdomain.org"
budget_limit = 100
```

### Custom Domain Setup

1. **Register your domain** and configure DNS
2. **Request SSL certificate** through AWS Certificate Manager
3. **Update Route53** configuration in Terraform
4. **Configure environment variables** with your domain

### Scaling Configuration

For larger organizations, customize resource allocation:

```yaml
# docker-compose.prod.yml additions
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G

  ssr:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 1G
```

## Maintenance and Updates

### Keeping Your Fork Updated

1. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/original-org/coalition-builder.git
   ```

2. **Fetch and merge updates**:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

3. **Handle conflicts** and test thoroughly before deploying

### Backup and Migration

**Database Backups:**

```bash
# Create backup
pg_dump coalition > backup.sql

# Restore backup
psql coalition < backup.sql
```

**Configuration Backups:**

- Export Django admin configurations
- Save environment variable configurations
- Document custom code changes

### Version Management

- **Tag releases** for your organization's deployments
- **Maintain release notes** for your customizations
- **Test updates** in staging environment before production

## Support and Community

### Getting Help

1. **Documentation**: Check this guide and other documentation
2. **GitHub Issues**: Search existing issues or create new ones
3. **Community**: Connect with other organizations using Coalition Builder

### Contributing Back

Consider contributing improvements back to the main project:

- **Bug fixes** that benefit all users
- **Feature enhancements** with broad applicability
- **Documentation improvements**
- **Testing additions**

### Sharing Your Customizations

Help other organizations by sharing:

- **Configuration examples** for common use cases
- **Custom components** that could be useful to others
- **Integration guides** for popular third-party services
- **Deployment scripts** and automation tools

## Security Considerations

### Protecting Sensitive Data

- **Never commit secrets** to your fork
- **Use environment variables** for all configuration
- **Implement proper access controls** for admin interface
- **Regular security updates** and dependency management

### Production Security

- **SSL/TLS encryption** for all traffic
- **Regular security audits** of custom code
- **Backup and disaster recovery** planning
- **Monitoring and alerting** for security events

## Success Stories

Learn from other organizations that have successfully customized Coalition Builder:

- **Environmental Groups**: Focus on climate and conservation campaigns
- **Agricultural Advocacy**: Farmer and rural community organizing
- **Business Coalitions**: Industry-specific policy advocacy
- **Nonprofit Networks**: Multi-organization campaign coordination

Each organization has found unique ways to leverage Coalition Builder's flexibility while maintaining the core functionality that makes advocacy campaigns effective.

---

**Ready to customize Coalition Builder for your organization?** Start with the basic configuration steps above, then gradually add more advanced customizations as your needs evolve.
