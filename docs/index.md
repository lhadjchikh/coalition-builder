# Coalition Builder Documentation

Coalition Builder is a comprehensive platform for organizing and managing policy advocacy campaigns, bringing together stakeholders, legislators, and advocates to drive meaningful policy change.

## 🚀 Quick Start

- [Getting Started](getting-started.md) - Installation and initial setup
- [Development Setup](development/setup.md) - Local development environment
- [API Reference](api/index.md) - Complete API documentation

## 👥 User Guides

Learn how to use Coalition Builder effectively:

- [Content Management](user-guides/content-management.md) - Managing homepage content via Django admin
- [API Usage](user-guides/api-usage.md) - How to use the Coalition Builder API
- [Homepage Management](user-guides/homepage.md) - Creating and customizing your organization's homepage

## 💻 Development

Comprehensive guides for developers:

- [Setup](development/setup.md) - Development environment configuration
- [Backend Development](development/backend.md) - Django API development
- [Frontend Development](development/frontend.md) - React TypeScript frontend
- [SSR Development](development/ssr.md) - Next.js server-side rendering
- [Testing Guide](development/testing.md) - Comprehensive testing strategies

## 🏗️ Architecture

Understanding the system design:

- [System Overview](architecture/overview.md) - High-level architecture and components
- [API Design](architecture/api.md) - REST API patterns and best practices
- [Database Design](architecture/database.md) - PostgreSQL + PostGIS data architecture

## 🚀 Deployment

Production deployment guides:

- [AWS Deployment](deployment/aws.md) - Deploy to AWS with Terraform
- [Docker Deployment](deployment/docker.md) - Containerized deployment guide
- [Health Monitoring](deployment/health.md) - Health checks and monitoring

## 🔧 Administration

Administrative guides and troubleshooting:

- [Troubleshooting](admin/troubleshooting.md) - Common issues and solutions

## 🤝 Contributing

Help improve Coalition Builder:

- [Contributing Guide](contributing/guide.md) - How to contribute to the project

## 🔧 Customization

Adapt Coalition Builder for your organization:

- [Forking Guide](customization/forking.md) - Fork and customize for your organization

## 📚 Reference

Complete reference documentation:

- [API Reference](api/index.md) - Complete API documentation
- [Environment Variables](reference/environment.md) - Configuration reference
- [CLI Reference](reference/cli.md) - Command-line tools and scripts
- [Changelog](reference/changelog.md) - Version history and updates

---

## 🌟 Features

Coalition Builder provides a comprehensive set of tools for advocacy organizations:

### **Campaign Management**

- Create and manage policy campaigns with rich content
- Track campaign status and progress
- SEO-friendly URLs and metadata
- Public campaign visibility controls

### **Stakeholder Engagement**

- Manage diverse stakeholder types (farmers, businesses, nonprofits, individuals)
- Geographic tracking with PostGIS integration
- Contact information and bio management
- Public/private stakeholder profiles

### **Endorsement System**

- Collect and display campaign endorsements
- Optional endorsement statements
- Public endorsement visibility
- Automated endorsement counting

### **Content Management**

- Database-driven homepage content
- Flexible content blocks with ordering
- Rich text editing with HTML support
- Social media integration
- Customizable branding and messaging

### **Technical Excellence**

- Modern React TypeScript frontend
- Django REST API with type-safe endpoints
- Optional Next.js SSR for improved SEO
- PostgreSQL with PostGIS for spatial data
- Comprehensive test coverage
- Production-ready AWS deployment

## 🛠️ Technology Stack

### Backend

- **Django 5.2** - Web framework with admin interface
- **Django Ninja** - FastAPI-inspired API framework
- **PostgreSQL 16** - Database with PostGIS extension
- **Poetry** - Dependency management
- **Docker** - Containerization

### Frontend

- **React 19** - UI library with TypeScript
- **Next.js 14** - Optional SSR framework
- **Material-UI** - Component library
- **Axios** - HTTP client

### Infrastructure

- **AWS ECS** - Container orchestration
- **Terraform** - Infrastructure as code
- **GitHub Actions** - CI/CD pipeline
- **Docker Compose** - Local development

## 🏃 Getting Started

### For Users

1. Start with the [Getting Started](getting-started.md) guide
2. Learn [Content Management](user-guides/content-management.md) for day-to-day usage
3. Explore [Homepage Management](user-guides/homepage.md) for customization

### For Developers

1. Set up your [Development Environment](development/setup.md)
2. Understand the [System Architecture](architecture/overview.md)
3. Follow [Backend Development](development/backend.md) and [Frontend Development](development/frontend.md) guides
4. Review the [Testing Guide](development/testing.md) for quality assurance

### For Deployment

1. Review [Docker Deployment](deployment/docker.md) for containerized deployment
2. Follow [AWS Deployment](deployment/aws.md) for production infrastructure
3. Set up [Health Monitoring](deployment/health.md) for operational excellence

## 🆘 Support

### Getting Help

- **Troubleshooting**: Check our [troubleshooting guide](admin/troubleshooting.md)
- **API Questions**: Review the [API reference](api/index.md) and [usage guide](user-guides/api-usage.md)
- **Development Issues**: See [development guides](development/setup.md) and [CLI reference](reference/cli.md)
- **Configuration**: Check [environment variables](reference/environment.md) reference

### Community

- **Issues**: Report bugs and request features on GitHub
- **Contributing**: Read our [contributing guide](contributing/guide.md)
- **Customization**: See our [forking guide](customization/forking.md) for organization-specific setups
- **Updates**: Follow the [changelog](reference/changelog.md) for latest changes

## 📄 License

Coalition Builder is open source software designed to empower advocacy organizations. See the project repository for license details.

---

**Ready to build your coalition?** Start with our [Getting Started](getting-started.md) guide and join the movement for effective advocacy through technology.
