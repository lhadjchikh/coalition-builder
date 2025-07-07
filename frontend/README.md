# Coalition Builder Frontend

[![Frontend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml)
[![TypeScript Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=javascript&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue.svg)](https://www.typescriptlang.org/)

This is the React frontend for Coalition Builder. It provides a user interface for managing
policy campaigns, submitting endorsements, and viewing campaign supporters.

## 📚 Documentation

**For complete documentation, visit: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

Quick links:

- [Installation Guide](https://lhadjchikh.github.io/coalition-builder/installation/)
- [Development Guide](https://lhadjchikh.github.io/coalition-builder/development/)
- [Frontend API Reference](https://lhadjchikh.github.io/coalition-builder/frontend-api/)

## Technology Stack

- **React 19**: UI library
- **TypeScript 5.7**: Type-safe JavaScript
- **styled-components**: CSS-in-JS styling
- **React Router**: Client-side routing
- **Webpack**: Module bundler
- **Jest & React Testing Library**: Testing framework
- **npm**: Package management

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   ├── services/          # API integration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── tests/            # Test suites
│   └── index.tsx         # Application entry point
├── public/               # Static assets
├── build/               # Production build output
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Quick Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (no watch)
npm run test:ci
```

### Build for Production

```bash
npm run build
```

## Code Quality

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Environment Variables

Key environment variables:

- `REACT_APP_API_URL`: Backend API URL (defaults to `/api`)
- `REACT_APP_SITE_PASSWORD`: Optional site-wide password protection

For complete environment variable reference, see the [Configuration Guide](https://lhadjchikh.github.io/coalition-builder/configuration/).
