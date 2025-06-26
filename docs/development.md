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

### Shared Component Architecture

Coalition Builder uses a shared component architecture where:

- **Components**: All React components live in `/frontend/src/components/`
- **Types**: Shared TypeScript interfaces are in `/frontend/src/types/`
- **SSR Integration**: Next.js imports components from `/frontend` using `@frontend` aliases
- **Testing**: Unit tests are in `/frontend/src/components/__tests__/`

### Guidelines for React Components

1. **Create components in `/frontend/src/components/`** - they'll be used by both SPA and SSR
2. **Use TypeScript interfaces** from `/frontend/src/types/`
3. **Add JSDoc comments** for better documentation
4. **Write Jest unit tests** in `__tests__/` subdirectories
5. **Export types for reuse** across both frontend and SSR
6. **Handle errors gracefully** with fallback UI and user-friendly messages

### Error Handling Pattern

When creating components that fetch data:

```typescript
// Use Promise.allSettled for parallel API calls
const [dataResult, otherResult] = await Promise.allSettled([
  API.getData(),
  API.getOtherData(),
]);

// Handle each result separately
if (dataResult.status === "fulfilled") {
  setData(dataResult.value);
} else {
  setError("Failed to load data");
  // Show fallback UI, don't expose raw errors
}
```
