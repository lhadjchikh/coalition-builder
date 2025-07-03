# Development Guide

This guide covers the development workflow, testing, and contributing to Coalition Builder.

## Development Workflow

### Quick Setup

For most developers, the [Installation guide](installation.md) provides everything needed. For detailed development environment setup including automated tooling installation, see the [Development Setup guide](development/setup.md).

### Docker Compose Configurations

Coalition Builder uses two Docker Compose configurations:

#### Production Configuration (`docker-compose.yml`)

- **Purpose**: Production deployments and CI/CD pipelines
- **Features**: Optimized builds, production environment variables, no volume mounts
- **Usage**: `docker compose up -d`

#### Development Configuration (`docker-compose.dev.yml`)

- **Purpose**: Local development with live code reload
- **Features**: Volume mounts for instant code changes, development build targets, debug mode
- **Usage**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`

**Key Differences:**

- **Build Targets**: Production uses full builds, development uses `target: deps` for faster rebuilds
- **Volume Mounts**: Development mounts source code for live reload
- **Environment Variables**: `DEBUG=True` and `NODE_ENV=development` in dev mode
- **Commands**: Development uses `npm run dev` and `runserver`, production uses optimized startup commands

### Code Style

- Python: Black formatting, Ruff linting
- TypeScript/React: Prettier formatting, ESLint
- Git: Conventional commit messages

### Site Password Protection

Coalition Builder includes a password protection system to secure your site during development and testing phases.

#### Quick Start

Enable password protection (password required):

```bash
./scripts/enable-password-protection.sh admin your-secure-password
```

Disable password protection:

```bash
./scripts/disable-password-protection.sh
```

#### Custom Password Protection

Enable with custom username and password:

```bash
./scripts/enable-password-protection.sh myuser my-secure-password-2024
```

**Security Note:** For security reasons, you must provide a password - no defaults are used.

#### How It Works

The password protection system uses two layers:

**Development (Docker Compose)**

- nginx basic authentication for the entire site
- Protects all content at the web server level
- Uses `.htpasswd` file for credential storage

**Production (AWS/ECS)**

- Django middleware for session-based authentication
- Custom login page with clean UI
- Maintains authentication state across requests

#### Environment Variables

- `SITE_PASSWORD_ENABLED`: Set to `true` to enable protection
- `SITE_PASSWORD`: The password for site access (required when enabled)
- `NGINX_CONFIG`: Switches nginx config between protected/unprotected

#### Excluded Paths

These paths remain accessible even when password protection is enabled:

- `/health/` - Django health checks
- `/health` - Next.js health checks
- `/admin/` - Django admin (has its own authentication)
- `/site-login/` - Password protection login endpoint

#### Production Deployment

For production environments, set these Terraform variables:

```hcl
site_password_enabled = true
site_password = "your-secure-password"
```

The middleware will automatically handle authentication without affecting performance or functionality.

### Running Tests

For comprehensive testing information, see the [Testing Guide](development/testing.md).

Quick commands:

```bash
# Backend tests (local)
cd backend && poetry run pytest

# Backend tests (Docker - recommended)
docker compose run --rm api poetry run pytest

# Frontend tests
cd frontend && npm test

# Shell script tests
cd scripts/tests && ./run_all_tests.sh

# Terraform tests
cd terraform/tests && go test ./...
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
│   ├── docs/          # Sphinx API docs
│   └── scripts/       # Backend scripts
├── frontend/          # React frontend
├── ssr/               # Next.js SSR
├── terraform/         # Infrastructure
└── docs/              # Main documentation
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

## Data Models

Key models include:

- **Bill**: Tracks federal and state legislative bills with chamber-specific formatting
- **Legislator**: Manages federal and state legislators with appropriate validation
- **PolicyCampaign**: Organizes advocacy campaigns with endorsement support
- **Stakeholder**: Stores supporter information with geographic data
- **Endorsement**: Handles campaign endorsements with verification workflow
- **Theme**: Manages visual branding and customization settings

## Theme System Development

Coalition Builder includes a comprehensive theme system for visual customization:

### Architecture

- **Backend**: Django model with color validation and CSS generation
- **Frontend**: Styled-components with theme provider for React components
- **SSR**: Full theme support in Next.js server-side rendering
- **API**: REST endpoints for programmatic theme management

### Key Components

#### Backend (`/backend/coalition/core/`)

- `models.py`: Theme model with hex color validation
- `theme_service.py`: CSS variable generation service
- `/api/themes.py`: Theme management API endpoints

#### Frontend (`/frontend/src/`)

- `contexts/ThemeContext.tsx`: React context for theme data
- `contexts/StyledThemeProvider.tsx`: Styled-components theme provider
- `styles/theme.ts`: Theme type definitions and utilities
- `components/styled/`: Reusable styled components library

#### Shared (`/shared/`)

- `utils/theme.ts`: Common theme utilities for both frontend and SSR
- `components/`: Shared components with theme support

### Development Guidelines

#### Adding Styled Components

```typescript
import styled from "styled-components";

const MyComponent = styled.div<{ variant?: "primary" | "secondary" }>`
  background-color: ${(props) =>
    props.variant === "secondary"
      ? props.theme.colors.secondary
      : props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  padding: ${(props) => props.theme.spacing[4]};
  border-radius: ${(props) => props.theme.radii.md};
`;
```

#### Using Theme Context

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, loading } = useTheme();

  if (loading) return <div>Loading theme...</div>;

  return (
    <div style={{ color: theme?.primary_color }}>
      Themed content
    </div>
  );
};
```

#### API Integration

```typescript
// Fetch active theme
const response = await fetch("/api/theme/active/");
const theme = await response.json();

// Update theme
const updatedTheme = await fetch(`/api/theme/${id}/`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(themeData),
});
```

### Testing Themes

#### Backend Tests

- Model validation (hex colors, required fields)
- CSS generation functionality
- API endpoint responses

#### Frontend Tests

- Theme provider functionality
- Component rendering with different themes
- API integration tests

#### Integration Tests

- End-to-end theme switching
- SSR theme rendering
- CSS variable generation

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
