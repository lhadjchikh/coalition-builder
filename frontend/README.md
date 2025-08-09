# Coalition Builder Frontend

[![Frontend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml)
[![TypeScript Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=javascript&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)
[![Next.js 15](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)

This is the Next.js frontend application for Coalition Builder, providing server-side rendering (SSR) for optimal SEO and performance.

## 📚 Documentation

**For complete documentation, visit: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

Quick links:

- [Installation Guide](https://lhadjchikh.github.io/coalition-builder/installation/)
- [Development Guide](https://lhadjchikh.github.io/coalition-builder/development/)
- [Frontend API Reference](https://lhadjchikh.github.io/coalition-builder/frontend-api/)

## Technology Stack

- **Next.js 15**: React framework with SSR capabilities
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **styled-components**: CSS-in-JS styling
- **Docker**: Containerized deployment
- **npm**: Package management

## Project Structure

```
frontend/
├── app/                     # Next.js App Router pages
├── components/              # React components
├── contexts/                # React contexts
├── hooks/                   # Custom React hooks
├── services/                # API clients and services
├── styles/                  # Global styles and themes
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── public/                  # Static assets
├── tests/                   # Test files
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── Dockerfile               # Container configuration
```

## Key Features

- **Server-Side Rendering**: Pre-renders pages for better SEO and performance
- **API Integration**: Fetches data from Django backend during server-side rendering
- **Static Generation**: Supports both SSR and static site generation
- **TypeScript**: Full type safety across the application
- **Docker Ready**: Containerized for deployment in AWS ECS
