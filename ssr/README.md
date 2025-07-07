# Coalition Builder SSR

[![Frontend Tests](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml/badge.svg)](https://github.com/lhadjchikh/coalition-builder/actions/workflows/test_frontend.yml)
[![TypeScript Coverage](https://codecov.io/gh/lhadjchikh/coalition-builder/branch/main/graph/badge.svg?flag=javascript&token=VGUU4R6NR3)](https://codecov.io/gh/lhadjchikh/coalition-builder)
[![Next.js 15](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)

This is the Next.js Server-Side Rendering (SSR) component for Coalition Builder. It provides SEO-optimized, server-rendered pages using React components from the frontend.

## 📚 Documentation

**For complete documentation, visit: [lhadjchikh.github.io/coalition-builder](https://lhadjchikh.github.io/coalition-builder/)**

Quick links:

- [Installation Guide](https://lhadjchikh.github.io/coalition-builder/installation/)
- [Development Guide](https://lhadjchikh.github.io/coalition-builder/development/)
- [Frontend API Reference](https://lhadjchikh.github.io/coalition-builder/frontend-api/)

## Technology Stack

- **Next.js 15**: React framework with SSR capabilities
- **React 19**: UI library (shared with frontend)
- **TypeScript**: Type-safe JavaScript
- **styled-components**: CSS-in-JS styling (shared with frontend)
- **Docker**: Containerized deployment
- **npm**: Package management

## Project Structure

```
ssr/
├── src/
│   ├── components/           # Shared React components (symlinked from frontend)
│   ├── pages/               # Next.js pages and routing
│   ├── styles/              # Global styles and themes
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── Dockerfile              # Container configuration
```

## Quick Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The SSR server will be available at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Key Features

- **Server-Side Rendering**: Pre-renders pages for better SEO and performance
- **Component Sharing**: Reuses React components from the frontend via symlinks
- **API Integration**: Fetches data from Django backend during server-side rendering
- **Static Generation**: Supports both SSR and static site generation
- **Docker Ready**: Containerized for deployment in AWS ECS

## Environment Variables

Key environment variables:

- `NEXT_PUBLIC_API_URL`: Frontend API URL (public, client-side)
- `API_URL`: Server-side API URL for SSR data fetching
- `NODE_ENV`: Environment mode (development/production)

For complete environment variable reference, see the [Configuration Guide](https://lhadjchikh.github.io/coalition-builder/configuration/).

## Development Notes

### Component Sharing

The SSR application shares React components with the frontend through symbolic links:

```bash
# Components are symlinked from frontend/src/components
ln -sf ../../frontend/src/components src/components
```

This ensures consistency between SSR and SPA modes while avoiding code duplication.

### API Integration

- **Server-side**: Uses `API_URL` for data fetching during rendering
- **Client-side**: Uses `NEXT_PUBLIC_API_URL` for hydration and client interactions
- **Fallback**: Gracefully degrades to client-side rendering if server-side data fetching fails
