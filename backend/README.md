# Coalition Builder Backend

[![Backend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_backend.yml)
[![Python Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=python&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![Django 5.2](https://img.shields.io/badge/django-5.2-green.svg)](https://docs.djangoproject.com/en/5.2/)

This is the Django backend for Coalition Builder. It provides a REST API and admin interface for managing
policy campaigns, stakeholders, endorsements, legislators, and dynamic homepage content.

## 📚 Documentation

**For complete documentation, visit: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

Quick links:

- [Installation Guide](https://lhadjchikh.github.io/coalition-builder/installation/)
- [Development Guide](https://lhadjchikh.github.io/coalition-builder/development/)
- [API Reference](https://lhadjchikh.github.io/coalition-builder/api/)

## Technology Stack

- **Python 3.13**: Core programming language
- **Django 5.2**: Web framework
- **Django Ninja**: API framework (FastAPI-inspired)
- **django-storages**: S3-based file storage for media uploads
- **GeoDjango**: For geographic data handling
- **PostGIS**: Spatial database extension for PostgreSQL
- **GDAL**: Geospatial Data Abstraction Library
- **Pillow**: Image processing library for uploaded files
- **Poetry**: Dependency management

## Project Structure

The backend is organized into several Django apps:

- **core**: Homepage content management and project configuration
- **campaigns**: Policy campaigns and related bills
- **stakeholders**: Organizations and individuals who can endorse campaigns
- **endorsements**: Relationships between stakeholders and campaigns
- **legislators**: Representatives and senators
- **regions**: Geographic regions (states, counties, etc.)
- **api**: Django Ninja API endpoints and schemas

```
backend/
├── coalition/                 # Main package
│   ├── api/                   # API endpoints and schemas
│   ├── campaigns/             # Campaign models and views
│   ├── core/                  # Homepage models, settings, and configuration
│   ├── endorsements/          # Endorsement models and views
│   ├── legislators/           # Legislator models and views
│   ├── regions/               # Region models and views
│   └── stakeholders/          # Stakeholder models and views
├── scripts/                   # Utility scripts for development
├── sample_data/               # Sample fixtures for testing
├── manage.py                  # Django management script
├── pyproject.toml             # Poetry dependencies and tool configuration
└── poetry.lock                # Locked dependencies
```
