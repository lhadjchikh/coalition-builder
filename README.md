# Coalition Builder

[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://lhadjchikh.github.io/coalition-builder/)
[![Full Stack Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_fullstack.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_fullstack.yml)
[![Code Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)

A comprehensive platform for organizing and managing policy advocacy campaigns, bringing together stakeholders, legislators, and advocates to drive meaningful policy change.

| Language       | Test Status                                                                                                                                                                                             | Code Coverage                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Python**     | [![Backend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml)    | [![Python Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=python&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)         |
| **TypeScript** | [![Frontend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml) | [![TypeScript Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=javascript&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder) |
| **HCL**        | [![IaC Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_terraform.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_terraform.yml)    | N/A                                                                                                                                                                                           |

## 📈 How Organizations Use Coalition Builder

> **Note**: The Mermaid diagrams below are best viewed on GitHub or in the [online documentation](https://lhadjchikh.github.io/coalition-builder/).

### Campaign Lifecycle & Advocacy Workflow

```mermaid
%%{init: {'theme':'basic'}}%%
flowchart TD
    A[🎯 Create Campaign] --> B[👥 Build Coalition]
    B --> C[✅ Collect Endorsements]
    C --> D[📊 Track Progress]
    D --> E[🏛️ Engage Legislators]
    E --> F[📢 Drive Policy Change]
```

Coalition Builder guides your organization through the complete advocacy process:

- **Create Campaign**: Launch policy initiatives around federal or state legislation
- **Build Coalition**: Recruit diverse stakeholders (businesses, nonprofits, citizens, government officials)
- **Collect Endorsements**: Secure verified support with built-in spam protection
- **Track Progress**: Analyze geographic distribution and engagement metrics
- **Engage Legislators**: Target representatives using congressional district data
- **Drive Policy Change**: Export supporter data and coordinate strategic advocacy

### Core Components & Relationships

```mermaid
%%{init: {'theme':'basic'}}%%
flowchart TD
    Stakeholders[👥 Stakeholders<br/>Businesses, Nonprofits, Citizens, Government]
    Regions[🗺️ Regions<br/>States, Districts, Counties]
    Legislators[🏛️ Legislators<br/>Federal, State]

    subgraph Core["🎯 Core Platform"]
        Campaigns[📋 Policy Campaigns]
        Endorsements[📝 Verified Endorsements]
    end

    Legislation[📜 Legislation<br/>Federal Bills, State Bills]

    Stakeholders --> Endorsements
    Campaigns --> Endorsements
    Campaigns --> Legislation
    Regions --> Stakeholders
    Regions --> Legislators
    Regions --> Legislation
    Legislators --> Legislation
```

**Coalition Builder manages**:

- **Diverse stakeholder categories** across sectors and organizational types
- **Multi-level campaigns** linking federal and state legislation
- **Verified endorsements** with geographic and legislative targeting
- **Geographic intelligence** for strategic advocacy and outreach

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
- **SSR**: Next.js 15 (optional)
- **Infrastructure**: AWS + Terraform
- **Testing**: Comprehensive test coverage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/development.md#contributing) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://lhadjchikh.github.io/coalition-builder/)
- 🐛 [Issue Tracker](https://github.com/lhadjchikh/coalition-builder/issues)
- 💬 [Discussions](https://github.com/lhadjchikh/coalition-builder/discussions)

---

Built with ❤️ to empower advocacy organizations and drive policy change.
