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
# For production/CI
docker compose up -d

# For local development with live code reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Create test data
docker compose exec api python scripts/create_test_data.py

# Access the application
# Frontend: http://localhost:3000 (SSR)
# Frontend SPA: http://localhost:8000 (Django serves React)
# API: http://localhost:8000/api/
# Admin: http://localhost:8000/admin/
```

## 📚 Documentation

**Complete documentation is available at: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

### Quick Links

- [📖 Installation Guide](https://lhadjchikh.github.io/coalition-builder/installation/) - Quick setup for development
- [🔧 Configuration](https://lhadjchikh.github.io/coalition-builder/configuration/) - Environment variables and settings
- [💻 Development Guide](https://lhadjchikh.github.io/coalition-builder/development/) - Development workflow
- [📡 API Reference](https://lhadjchikh.github.io/coalition-builder/api/) - Auto-generated API documentation
- [🚀 Deployment Guide](https://lhadjchikh.github.io/coalition-builder/deployment/) - Production deployment options

## 🌟 Features

### Core Functionality

- **Dynamic Homepage Management** - Database-driven content with flexible blocks
- **Campaign Management** - Create and track policy advocacy campaigns at federal and state levels
- **Multi-Level Bill Tracking** - Support for both federal (H.R./S.) and state legislative bills
- **Stakeholder Management** - Organize supporters and endorsers with detailed profiles
- **Legislator Tracking** - Monitor federal and state representatives and their positions
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
