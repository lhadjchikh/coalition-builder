# Coalition Builder

[![Backend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml)
[![Frontend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml)
[![Full Stack Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_fullstack.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_fullstack.yml)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://lhadjchikh.github.io/coalition-builder/)

A comprehensive platform for organizing and managing policy advocacy campaigns, bringing together stakeholders, legislators, and advocates to drive meaningful policy change.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/lhadjchikh/coalition-builder.git
cd coalition-builder

# Start with Docker (recommended)
docker-compose up -d

# Create test data
docker-compose exec backend python scripts/create_test_data.py

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Admin: http://localhost:8000/admin
```

## 📚 Documentation

**Complete documentation is available at: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

### Quick Links

- [📖 Getting Started](docs/getting-started.md) - Installation and setup
- [🔧 Development Setup](docs/development/setup.md) - Local development environment
- [🎯 Content Management](docs/user-guides/content-management.md) - Managing homepage content
- [📡 API Reference](docs/api/index.md) - Complete API documentation
- [🚀 AWS Deployment](docs/deployment/aws.md) - Production deployment guide

## 🌟 Features

### Core Functionality

- **Dynamic Homepage Management** - Database-driven content with flexible blocks
- **Campaign Management** - Create and track policy advocacy campaigns
- **Stakeholder Management** - Organize supporters and endorsers with detailed profiles
- **Legislator Tracking** - Monitor representatives and their positions
- **Content Management** - Easy-to-use Django admin interface
- **API Integration** - RESTful API for custom integrations
- **SEO Optimized** - Server-side rendering with Next.js
- **Production Ready** - Secure AWS deployment with Terraform

### Endorsement System

- **🔐 Email Verification** - Secure token-based email verification for all endorsements
- **👨‍💼 Admin Review** - Comprehensive moderation workflow with bulk actions
- **🛡️ Spam Prevention** - Multi-layer protection including rate limiting and content analysis
- **📊 Data Export** - CSV/JSON export capabilities with filtering options
- **📧 Automated Notifications** - Email workflows for verification, approval, and admin alerts
- **🧪 Quality Assurance** - 71 comprehensive tests covering all functionality

## 🏗️ Architecture

- **Backend**: Django 5.2 + PostgreSQL + PostGIS
- **Frontend**: React 19 + TypeScript
- **SSR**: Next.js 14 (optional)
- **Infrastructure**: AWS + Terraform
- **Testing**: Comprehensive test coverage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing/guide.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://lhadjchikh.github.io/coalition-builder/)
- 🐛 [Issue Tracker](https://github.com/lhadjchikh/coalition-builder/issues)
- 💬 [Discussions](https://github.com/lhadjchikh/coalition-builder/discussions)

---

Built with ❤️ to empower advocacy organizations and drive policy change.
