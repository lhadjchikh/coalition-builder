# Development Guide

This guide covers the development workflow, testing, and contributing to Coalition Builder.

## Development Workflow

### Quick Setup

For most developers, the [Installation guide](installation.md) provides everything needed. For detailed development environment setup including automated tooling installation, see the [Development Setup guide](development/setup.md).

### Code Style

- Python: Black formatting, Ruff linting
- TypeScript/React: Prettier formatting, ESLint
- Git: Conventional commit messages

### Running Tests

```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm test

# All tests
./scripts/test-all.sh
```

### Code Quality

```bash
# Run all linters
./scripts/lint.py
```

## Project Structure

```
coalition-builder/
├── backend/           # Django API
│   ├── coalition/     # Main app
│   ├── docs/         # Sphinx API docs
│   └── scripts/      # Backend scripts
├── frontend/         # React frontend
├── ssr/             # Next.js SSR
├── terraform/       # Infrastructure
└── docs/           # Main documentation
```

## Key Technologies

- **Backend**: Django 5.0, Django Ninja, PostGIS
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with PostGIS extension
- **Infrastructure**: AWS, Terraform
- **Documentation**: Sphinx, TypeDoc, MkDocs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

### Code Guidelines

- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code patterns

## API Development

The API is automatically documented from code. When adding new endpoints:

1. Use proper type hints
2. Add docstrings to views and models
3. Update API tests
4. Regenerate documentation

## Component Development

For React components:

1. Use TypeScript interfaces
2. Add JSDoc comments
3. Write component tests
4. Export types for reuse
