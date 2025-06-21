# SSR Development Guide

This guide covers Next.js Server-Side Rendering (SSR) development for Coalition Builder, including setup, configuration, and deployment.

## Overview

The SSR component provides server-side rendering capabilities for improved SEO and performance. It's an optional component that fetches data from the Django backend API and renders pages on the server before sending them to the client.

## Architecture

This implementation uses Next.js App Router for server-side rendering with the following key aspects:

- **App Router**: Uses Next.js 14's App Router architecture for modern routing
- **API Integration**: Fetches data from the Django backend API
- **Docker Ready**: Optimized for containerized deployment
- **Health Monitoring**: Includes health check and metrics endpoints
- **TypeScript**: Full TypeScript support for type safety

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and enhanced development experience
- **React 18** - UI library with server-side rendering support
- **Axios** - HTTP client for API communication
- **Docker** - Containerization for deployment

## Project Structure

```
ssr/
├── app/                          # Next.js App Router directory
│   ├── components/               # Shared UI components
│   │   ├── ContentBlock.tsx      # Content block renderer
│   │   ├── HeroSection.tsx       # Hero section component
│   │   └── SocialLinks.tsx       # Social media links
│   ├── health/                   # Health check endpoint
│   │   └── route.ts              # Health API implementation
│   ├── metrics/                  # Metrics endpoint
│   │   └── route.ts              # Metrics API implementation
│   ├── page.tsx                  # Main landing page
│   ├── layout.tsx                # Root layout with metadata
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   ├── api.ts                    # API client for backend communication
│   └── metrics.ts                # Metrics collection utilities
├── scripts/                      # Development and deployment scripts
│   ├── setup-integration-test.sh # Setup script for integration tests
│   └── run-integration-test.sh   # Runner script for integration tests
├── tests/                        # Test files
│   ├── test-ssr-integration.js   # Comprehensive integration tests
│   ├── test-ssr-integration-simple.js # Simple integration tests
│   └── utils.js                  # Test utility functions
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared type definitions
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Container configuration
└── package.json                  # Dependencies and scripts
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Django backend API running (for data fetching)
- Docker (optional, for containerized development)

### Installation

```bash
cd ssr
npm install
```

### Environment Variables

Create a `.env.local` file in the ssr directory:

```bash
# Backend API URL (server-side only)
API_URL=http://localhost:8000

# Public API URL (client-side accessible)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Server configuration
PORT=3000
NODE_ENV=development

# Optional: Debug settings
DEBUG=true
```

### Development Server

```bash
# Run development server with hot reloading
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking
npm run type-check
```

The SSR application will be available at `http://localhost:3000`.

## Core Components

### Main Page Component

The main page fetches and renders homepage data:

```typescript
// app/page.tsx
import { Metadata } from 'next';
import { apiClient } from '../lib/api';
import { HeroSection } from './components/HeroSection';
import { ContentBlock } from './components/ContentBlock';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await apiClient.getHomepage();
    return {
      title: homepage.organization_name,
      description: homepage.tagline,
    };
  } catch {
    return {
      title: "Coalition Builder",
      description: "Building strong advocacy partnerships",
    };
  }
}

export default async function HomePage() {
  let homepage: HomePage | null = null;

  try {
    homepage = await apiClient.getHomepage();
  } catch (error) {
    console.error("Failed to fetch homepage:", error);
    // Use fallback content
    homepage = {
      organization_name: process.env.ORGANIZATION_NAME || "Coalition Builder",
      tagline: process.env.TAGLINE || "Building strong advocacy partnerships",
      // ... other fallback fields
    };
  }

  const visibleBlocks = homepage.content_blocks
    ?.filter((block) => block.is_visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <main>
      <HeroSection homepage={homepage} />

      <section>
        <h2>{homepage.about_section_title}</h2>
        <div dangerouslySetInnerHTML={{
          __html: homepage.about_section_content || ''
        }} />
      </section>

      {visibleBlocks.map(block => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </main>
  );
}
```

### API Client

Server-side API client for fetching data:

```typescript
// lib/api.ts
import axios from "axios";
import { Campaign, HomePage } from "../types";

const API_BASE_URL = process.env.API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

export const apiClient = {
  getHomepage: async (): Promise<HomePage> => {
    const response = await apiClient.get("/api/homepage/");
    return response.data;
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await apiClient.get("/api/campaigns/");
    return response.data;
  },

  getCampaign: async (slug: string): Promise<Campaign> => {
    const response = await apiClient.get(`/api/campaigns/${slug}/`);
    return response.data;
  },
};

// Error handling wrapper
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error("API call failed:", error);
    return fallback;
  }
};
```

### Content Block Renderer

Flexible component for rendering different content block types:

```typescript
// app/components/ContentBlock.tsx
import React from 'react';
import { ContentBlock as ContentBlockType } from '../../types';

interface ContentBlockProps {
  block: ContentBlockType;
}

export const ContentBlock: React.FC<ContentBlockProps> = ({ block }) => {
  if (!block.is_visible) return null;

  const baseClasses = `content-block ${block.css_classes || ''}`;
  const style = block.background_color
    ? { backgroundColor: block.background_color }
    : undefined;

  switch (block.block_type) {
    case 'text':
      return (
        <section className={baseClasses} style={style}>
          {block.title && <h2>{block.title}</h2>}
          <div dangerouslySetInnerHTML={{ __html: block.content }} />
        </section>
      );

    case 'image':
      return (
        <section className={baseClasses} style={style}>
          {block.title && <h2>{block.title}</h2>}
          <img
            src={block.image_url}
            alt={block.image_alt_text || block.title || ''}
          />
          {block.content && (
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          )}
        </section>
      );

    case 'text_image':
      return (
        <section className={`${baseClasses} flex gap-6`} style={style}>
          <div className="flex-1">
            {block.title && <h2>{block.title}</h2>}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
          {block.image_url && (
            <div className="flex-1">
              <img
                src={block.image_url}
                alt={block.image_alt_text || block.title || ''}
              />
            </div>
          )}
        </section>
      );

    case 'quote':
      return (
        <blockquote className={`${baseClasses} quote-block`} style={style}>
          {block.title && <h2>{block.title}</h2>}
          <div dangerouslySetInnerHTML={{ __html: block.content }} />
        </blockquote>
      );

    case 'stats':
    case 'custom_html':
    default:
      return (
        <section className={baseClasses} style={style}>
          {block.title && <h2>{block.title}</h2>}
          <div dangerouslySetInnerHTML={{ __html: block.content }} />
        </section>
      );
  }
};
```

## Health and Monitoring

### Health Check Endpoint

```typescript
// app/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "ssr",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Optional: Check backend API connectivity
    if (process.env.API_URL) {
      try {
        const apiResponse = await fetch(`${process.env.API_URL}/api/health/`);
        healthData.backend_status = apiResponse.ok
          ? "connected"
          : "disconnected";
      } catch {
        healthData.backend_status = "disconnected";
      }
    }

    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
```

### Metrics Endpoint

```typescript
// app/metrics/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.env.npm_package_version || "1.0.0",
    node_version: process.version,
    platform: process.platform,
  };

  return NextResponse.json(metrics);
}
```

## Testing

### Test Structure

The SSR component includes comprehensive testing:

- **Simple Integration Tests**: Basic functionality verification
- **Comprehensive Integration Tests**: Full application flow testing
- **API Integration Tests**: Backend connectivity verification

### Running Tests

```bash
# Run comprehensive integration test
npm test

# Run simple integration test
npm run test:simple

# Run tests for CI environment
npm run test:ci
```

### Direct Test Execution

```bash
# Run simple integration test
node tests/test-ssr-integration-simple.js

# Run comprehensive integration test
node tests/test-ssr-integration.js
```

### Test Scripts

Helper scripts for test setup and execution:

```bash
# Set up integration tests (creates necessary files and installs dependencies)
./scripts/setup-integration-test.sh

# Run a full integration test with Docker Compose
./scripts/run-integration-test.sh
```

### Sample Integration Test

```javascript
// tests/test-ssr-integration.js
const { execSync } = require("child_process");
const { testServerResponse, testHealthEndpoint } = require("./utils");

async function runTests() {
  console.log("🧪 Running SSR Integration Tests...");

  try {
    // Test main page rendering
    console.log("📄 Testing main page...");
    await testServerResponse("http://localhost:3000", {
      expectStatus: 200,
      expectContent: ["Coalition Builder", "html"],
    });

    // Test health endpoint
    console.log("🏥 Testing health endpoint...");
    await testHealthEndpoint("http://localhost:3000/health");

    // Test metrics endpoint
    console.log("📊 Testing metrics endpoint...");
    await testServerResponse("http://localhost:3000/metrics", {
      expectStatus: 200,
      expectContentType: "application/json",
    });

    console.log("✅ All SSR integration tests passed!");
  } catch (error) {
    console.error("❌ SSR integration tests failed:", error.message);
    process.exit(1);
  }
}

runTests();
```

## Docker Configuration

### Dockerfile

Multi-stage build for production optimization:

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Usage

```bash
# Build the Docker image
docker build -t coalition-ssr .

# Run the container
docker run -p 3000:3000 -e API_URL=http://api:8000 coalition-ssr

# Run with environment file
docker run -p 3000:3000 --env-file .env coalition-ssr
```

## Deployment

### AWS ECS Deployment

The SSR application is deployed to AWS ECS alongside the Django backend:

- **Container Orchestration**: ECS Fargate for serverless container execution
- **Load Balancing**: Application Load Balancer routes traffic between services
- **Service Discovery**: Both containers run within the same task definition
- **Health Checks**: ALB performs health checks on the `/health` endpoint

### Environment Configuration

Production environment variables:

```bash
# Production API URLs
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Server configuration
PORT=3000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional: Custom domain
DOMAIN=yourdomain.com
```

### Deployment Pipeline

The GitHub Actions workflow automatically:

1. Builds the Next.js application
2. Creates optimized Docker images
3. Pushes images to Amazon ECR
4. Updates ECS service with new image
5. Performs health checks to verify deployment

## Troubleshooting

### Common Issues

**SSR Build Failures:**

- Check TypeScript errors with `npm run type-check`
- Verify all dependencies are compatible with Next.js 14
- Ensure environment variables are properly set

**API Connection Issues:**

- Verify backend API is accessible from the SSR container
- Check network configuration in Docker/ECS
- Ensure `API_URL` environment variable is correct

**Performance Issues:**

- Monitor bundle size with `npm run analyze`
- Check for unnecessary re-renders in React components
- Optimize images and static assets

**Docker Issues:**

- Verify Dockerfile syntax and build steps
- Check container logs with `docker logs <container-id>`
- Ensure port mapping is correct

For more detailed troubleshooting, see the [main troubleshooting guide](../admin/troubleshooting.md).
