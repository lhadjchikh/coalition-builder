# Contributing Guide

This guide covers how to contribute to the Coalition Builder project, including development workflows, testing, and customization for other organizations.

## Getting Started

Coalition Builder is designed to be reusable by other advocacy groups. Whether you're contributing to the main project or forking for your own organization, this guide will help you get started.

### Repository Structure

This repository contains multiple components:

- `backend/` – Django REST API using Poetry
- `frontend/` – React + TypeScript client
- `ssr/` – optional Next.js app for server side rendering
- `terraform/` – IaC definitions

## Development Workflow

### Prerequisites

Before contributing, ensure you have the development environment set up properly. See the [Development Setup Guide](../development/setup.md) for detailed instructions.

### Testing

Run tests for each part when relevant:

```bash
# Backend tests
cd backend && poetry run python manage.py test

# Frontend unit/integration tests
cd frontend && npm run test:ci

# SSR integration tests (requires backend running)
cd ssr && npm run test:ci
```

The SSR tests expect the backend API running at `http://localhost:8000`. Use `docker-compose up -d` or run the Django server manually if you need to execute them locally.

### Code Quality

Before submitting any changes, ensure your code passes all quality checks:

- **Python**: format with Black and lint with Ruff – `poetry run black .` and `poetry run ruff check .`
- **JavaScript/TypeScript**: run ESLint and Prettier – `npm run lint` and `npm run format`
- **Terraform**: run `terraform fmt -write=true -recursive` and `tflint` if available
- **Shell scripts**: use `shellcheck` if installed

A convenience command is available:

```bash
cd backend && poetry run lint
```

This script runs formatting and linting across Python, frontend files, Terraform, and shell scripts.

### Contributing Guidelines

- Follow existing project structure when adding new modules or components.
- Update or add tests along with code changes.
- Ensure linters and tests pass before opening a pull request.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## Forking for Your Organization

Coalition Builder can be customized for other advocacy groups. Follow these steps after forking:

### Initial Setup

1. **Clone your fork and set up environment**:

   ```bash
   git clone https://github.com/your-org/coalition-builder.git
   cd coalition-builder
   cp .env.example .env
   ```

2. **Update organization-specific values in `.env`**:

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

3. **Edit branding configuration** (optional):
   Edit `branding.json` if you want to change logos or default text:

   ```json
   {
     "organization_name": "Your Organization",
     "primary_color": "#your-color",
     "logo_url": "https://yoursite.com/logo.png"
   }
   ```

4. **Start development or deploy**:

   ```bash
   # For local development
   docker-compose up

   # For cloud deployment
   # Follow terraform/README.md for cloud deployment
   ```

With these variables customized, the app will display your organization name and use your infrastructure settings.

### Customization Options

#### Environment Variables

The application supports extensive customization through environment variables:

**Organization Configuration:**

- `ORGANIZATION_NAME`: Your organization's full name
- `ORG_TAGLINE`: Brief mission statement or slogan
- `CONTACT_EMAIL`: Primary contact email

**Database Configuration:**

- `DB_NAME`: Name of your database
- `DATABASE_URL`: Full database connection URL

**Deployment Configuration:**

- `DOMAIN_NAME`: Your organization's domain
- `AWS_REGION`: Preferred AWS region for deployment
- `ENVIRONMENT`: Deployment environment (development, staging, production)

#### Branding Customization

The `branding.json` file allows you to customize:

- Organization name and tagline
- Color scheme and theme
- Logo and favicon URLs
- Social media links
- Default content and messaging

#### Content Management

Once deployed, you can customize all content through the Django admin interface:

1. Access the admin at `https://yourdomain.org/admin/`
2. Configure your homepage in "Homepage Configurations"
3. Add your organization's specific campaigns, stakeholders, and content
4. Customize content blocks for your specific messaging

See the [Content Management Guide](../user-guides/content-management.md) for detailed instructions.

## Contributing to the Main Project

### Reporting Issues

When reporting bugs or requesting features:

1. Check existing issues to avoid duplicates
2. Provide clear reproduction steps for bugs
3. Include relevant system information (OS, Python version, etc.)
4. Use appropriate issue labels

### Pull Request Process

1. **Fork the repository** and create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code quality guidelines above

3. **Add or update tests** for your changes:

   - Backend changes: Add Django tests
   - Frontend changes: Add React component tests
   - API changes: Update API documentation

4. **Update documentation** if needed:

   - Update relevant markdown files
   - Add examples for new features
   - Update the API documentation if endpoints change

5. **Run the full test suite**:

   ```bash
   python scripts/lint.py  # Code quality checks
   cd backend && poetry run python manage.py test  # Backend tests
   cd frontend && npm run test:ci  # Frontend tests
   ```

6. **Commit your changes** using conventional commit format:

   ```bash
   git commit -m "feat: add new homepage content block type"
   git commit -m "fix: resolve database connection timeout issue"
   git commit -m "docs: update API documentation for new endpoints"
   ```

7. **Push to your fork** and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review Process

- All pull requests require at least one review
- Automated checks must pass (linting, tests, build)
- Reviewers will check for code quality, security, and adherence to project standards
- Address feedback promptly and update your PR as needed

## Development Tips

### Working with the Django Backend

- Use Django's built-in admin interface for data management
- Follow Django best practices for models, views, and URL patterns
- Use Django Ninja for API endpoints (similar to FastAPI)
- Write tests for all new models and API endpoints

### Working with the React Frontend

- Use TypeScript for all new components
- Follow React hooks patterns and functional components
- Add proper error handling and loading states
- Include accessibility attributes and proper semantic HTML

### Working with Next.js SSR

- The SSR component is optional but improves SEO
- Use Next.js App Router patterns
- Implement proper error handling for API failures
- Test both server-side and client-side rendering

### Infrastructure and Deployment

- All infrastructure is defined in Terraform
- Use AWS services with proper security configurations
- Implement monitoring and alerting for production deployments
- Follow least-privilege principles for IAM roles

## Getting Help

### Documentation

- [Development Setup](../development/setup.md) - Environment configuration
- [API Reference](../api/index.md) - Complete API documentation
- [Deployment Guide](../deployment/aws.md) - Production deployment
- [Troubleshooting](../admin/troubleshooting.md) - Common issues and solutions

### Support Channels

1. **GitHub Issues**: For bugs, feature requests, and technical questions
2. **Documentation**: Check the comprehensive guides above
3. **Code Comments**: Review inline documentation in the codebase
4. **Community**: Connect with other organizations using Coalition Builder

## Security Considerations

When contributing to Coalition Builder:

- Never commit secrets, API keys, or passwords
- Use environment variables for all configuration
- Follow secure coding practices for web applications
- Report security vulnerabilities privately through GitHub's security advisory system
- Test security-related changes thoroughly

## License and Contribution Agreement

By contributing to Coalition Builder, you agree that your contributions will be licensed under the same license as the project. Ensure you have the right to contribute any code you submit.

## Recognition

Contributors are recognized in several ways:

- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to participate in project governance discussions

Thank you for contributing to Coalition Builder and helping advocacy organizations build effective campaigns!
