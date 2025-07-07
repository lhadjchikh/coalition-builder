# Docker Deployment Guide

This guide covers containerized deployment of Coalition Builder using Docker and Docker Compose.

## Overview

Coalition Builder is designed for containerized deployment with Docker. The application consists of multiple services that can be orchestrated using Docker Compose for development or deployed individually in production environments.

## Docker Architecture

### Service Components

```
docker compose.yml
├── backend (Django API)
├── frontend (React - development only)
├── ssr (Next.js - optional)
├── db (PostgreSQL + PostGIS)
└── nginx (reverse proxy - production)
```

## Quick Start

### Prerequisites

- Docker Engine 20.0+
- Docker Compose 2.0+
- 4GB+ available RAM
- 10GB+ available disk space

### Development Environment

```bash
# Clone repository
git clone https://github.com/lhadjchikh/coalition-builder.git
cd coalition-builder

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Services will be available at:

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000 (if built)
- **SSR**: http://localhost:3001 (if enabled)
- **Database**: localhost:5432

## Docker Compose Configuration

### Main Compose File

```yaml
version: "3.8"

services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: coalition
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/coalition
      - DEBUG=True
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend
    volumes:
      - ./backend:/app
      - static_volume:/app/static
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "healthcheck.py"]
      interval: 30s
      timeout: 10s
      retries: 3

  ssr:
    build:
      context: ./ssr
      dockerfile: Dockerfile
    environment:
      - API_URL=http://backend:8000
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
      - PORT=3000
    ports:
      - "3001:3000"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  static_volume:
```

### Production Compose Override

```yaml
# docker compose.prod.yml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - static_volume:/var/www/static
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - ssr

  backend:
    environment:
      - DEBUG=False
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    volumes: [] # Remove development volume mounts

  ssr:
    environment:
      - NODE_ENV=production
      - API_URL=http://backend:8000
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Remove init script volume for production
```

## Individual Service Containers

### Backend (Django) Container

```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VENV_IN_PROJECT=1
ENV POETRY_CACHE_DIR=/opt/poetry

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gdal-bin \
        libgdal-dev \
        libgeos-dev \
        libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Create and set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-dev

# Copy application code
COPY . .

# Create static files directory
RUN mkdir -p /app/static

# Collect static files
RUN poetry run python manage.py collectstatic --noinput

# Create healthcheck script
COPY healthcheck.py /app/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python healthcheck.py

# Run application
CMD ["poetry", "run", "gunicorn", "--bind", "0.0.0.0:8000", "coalition.wsgi:application"]
```

### SSR (Next.js) Container

```dockerfile
# ssr/Dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dependencies stage
FROM base AS deps
RUN npm ci --only=production

# Builder stage
FROM base AS builder
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create healthcheck script
COPY healthcheck.js /app/

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js

CMD ["node", "server.js"]
```

### Database Container

Uses the official PostGIS image with initialization script:

```bash
#!/bin/bash
# init-db.sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder CASCADE;
EOSQL

echo "PostGIS extensions installed successfully."
```

## Health Checks

### Backend Health Check

```python
# backend/healthcheck.py
#!/usr/bin/env python
import os
import sys
import requests

def check_health():
    try:
        response = requests.get('http://localhost:8000/health/', timeout=5)
        if response.status_code == 200:
            print("Backend health check passed")
            sys.exit(0)
        else:
            print(f"Backend health check failed: HTTP {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Backend health check error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_health()
```

### SSR Health Check

```javascript
// ssr/healthcheck.js
const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/health",
  method: "GET",
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log("SSR health check passed");
    process.exit(0);
  } else {
    console.log(`SSR health check failed: HTTP ${res.statusCode}`);
    process.exit(1);
  }
});

req.on("error", (err) => {
  console.log(`SSR health check error: ${err.message}`);
  process.exit(1);
});

req.on("timeout", () => {
  console.log("SSR health check timeout");
  req.destroy();
  process.exit(1);
});

req.end();
```

## Environment Configuration

### Development Environment

```bash
# .env.development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coalition
DEBUG=True
SECRET_KEY=development-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,backend
ORGANIZATION_NAME=Coalition Builder Development
ORG_TAGLINE=Building advocacy partnerships
CONTACT_EMAIL=dev@coalitionbuilder.org

# Frontend/SSR
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
PORT=3000
NODE_ENV=development
```

### Production Environment

```bash
# .env.production
DATABASE_URL=postgresql://user:password@db-host:5432/coalition
DEBUG=False
SECRET_KEY=your-secure-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ORGANIZATION_NAME=Your Organization
ORG_TAGLINE=Your mission statement
CONTACT_EMAIL=info@yourdomain.com

# SSR Production
API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Nginx Configuration

### Development Nginx

```nginx
# nginx.dev.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream ssr {
        server ssr:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # API requests
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Admin interface
        location /admin/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Static files
        location /static/ {
            alias /var/www/static/;
        }

        # SSR application
        location / {
            proxy_pass http://ssr;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### Production Nginx

```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    upstream backend {
        server backend:8000;
    }

    upstream ssr {
        server ssr:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API requests with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Admin interface with stricter rate limiting
        location /admin/ {
            limit_req zone=admin burst=10 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files with caching
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SSR application
        location / {
            proxy_pass http://ssr;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Operations

### Starting Services

```bash
# Development
docker compose up -d

# Production
docker compose -f docker compose.yml -f docker compose.prod.yml up -d

# Specific service
docker compose up -d backend

# With build
docker compose up --build -d
```

### Monitoring

```bash
# View logs
docker compose logs -f [service]

# Service status
docker compose ps

# Resource usage
docker stats

# Health status
docker compose exec backend python healthcheck.py
docker compose exec ssr node healthcheck.js
```

### Database Operations

```bash
# Database shell
docker compose exec db psql -U postgres -d coalition

# Run migrations
docker compose exec backend poetry run python manage.py migrate

# Create superuser
docker compose exec backend poetry run python manage.py createsuperuser

# Load test data
docker compose exec backend poetry run python scripts/create_test_data.py

# Database backup
docker compose exec db pg_dump -U postgres coalition > backup.sql

# Database restore
docker compose exec -T db psql -U postgres coalition < backup.sql
```

### Scaling Services

```bash
# Scale SSR service
docker compose up -d --scale ssr=3

# Scale backend service
docker compose up -d --scale backend=2
```

## Troubleshooting

### Common Issues

**Services not starting:**

```bash
# Check logs for errors
docker compose logs backend

# Rebuild containers
docker compose build --no-cache

# Reset volumes
docker compose down -v
docker compose up -d
```

**Database connection issues:**

```bash
# Check database health
docker compose exec db pg_isready -U postgres

# Verify network connectivity
docker compose exec backend ping db

# Check environment variables
docker compose exec backend env | grep DATABASE
```

**Permission issues:**

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Reset Docker permissions
docker compose down
sudo rm -rf volumes/
docker compose up -d
```

**Performance issues:**

```bash
# Monitor resource usage
docker stats

# Check container health
docker compose ps

# View detailed container info
docker inspect <container_id>
```

For more detailed troubleshooting, see the [main deployment troubleshooting guide](../deployment.md#troubleshooting).
