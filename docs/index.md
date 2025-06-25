# Coalition Builder

A modern platform for organizing and managing policy advocacy campaigns with stakeholder engagement tracking, endorsement collection, and geographic intelligence.

## Overview

Coalition Builder enables organizations to:

- **Build Coalitions**: Manage advocacy campaigns and stakeholder engagement
- **Collect Endorsements**: Streamlined collection with verification and moderation
- **Manage Content**: Dynamic homepage with customizable content blocks
- **Geographic Intelligence**: PostGIS integration for address geocoding and district assignment

## Architecture

- **Backend**: Django API with PostgreSQL/PostGIS
- **Frontend**: React with TypeScript
- **SSR**: Next.js for SEO optimization
- **Infrastructure**: Terraform-managed AWS deployment

## Getting Started

1. **[Installation](installation.md)** - Quick setup for development
2. **[Configuration](configuration.md)** - Environment variables and settings
3. **[Development](development.md)** - Development workflow and contributing
4. **[Deployment](deployment.md)** - Production deployment options

## Documentation

- **[API Reference](api/)** - Auto-generated from Django models and views
- **[Frontend Components](frontend-api/)** - Auto-generated from React components
- **[Environment Variables](reference/environment.md)** - Complete configuration reference
- **[CLI Reference](reference/cli.md)** - Command-line tools and Django management commands

## Support

- Issues and feature requests: [GitHub Issues](https://github.com/lhadjchikh/coalition-builder/issues)
- Development questions: See [Development Guide](development.md)
- Deployment help: See [Deployment Guide](deployment.md)
