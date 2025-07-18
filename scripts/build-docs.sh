#!/bin/bash
# Build script for generating all documentation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_info "Building Coalition Builder documentation..."
log_info "Project root: $PROJECT_ROOT"

# Clean previous builds
log_info "Cleaning previous documentation builds..."
rm -rf "$PROJECT_ROOT/docs/api"
rm -rf "$PROJECT_ROOT/docs/frontend-api"
rm -rf "$PROJECT_ROOT/backend/docs/_build"

# Build Django API documentation with Sphinx using Docker
log_info "Building Django API documentation..."
cd "$PROJECT_ROOT"

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
  log_error "Docker is required to build Django API documentation (for GDAL support)"
  exit 1
fi

# Detect Docker Compose command (V1 vs V2)
if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose --help >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
else
  log_error "Docker Compose is required to build Django API documentation"
  exit 1
fi

# Build documentation using Docker to ensure GDAL is available
log_info "Using Docker to build Sphinx documentation with GDAL support..."
if $DOCKER_COMPOSE run --rm api sh -c "
  cd /app/backend &&
  poetry install --with docs &&
  poetry run sphinx-build -b html docs docs/_build/html
"; then
  log_success "Django API documentation built successfully"

  # Copy to docs directory for GitHub Pages
  mkdir -p "$PROJECT_ROOT/docs/api"
  cp -r backend/docs/_build/html/* "$PROJECT_ROOT/docs/api/"
  log_success "Django API docs copied to docs/api/"
else
  log_error "Failed to build Django API documentation"
  exit 1
fi

# Build React component documentation with TypeDoc
log_info "Building React component documentation..."
cd "$PROJECT_ROOT/frontend"

# Build TypeDoc documentation
if npm run docs; then
  log_success "React component documentation built successfully"
  log_success "React docs available at docs/frontend-api/"
else
  log_warning "TypeDoc build failed or no TypeScript files found"
fi

# Build main documentation with MkDocs
log_info "Building main documentation with MkDocs..."
cd "$PROJECT_ROOT"

if command -v mkdocs >/dev/null 2>&1; then
  if mkdocs build; then
    log_success "MkDocs documentation built successfully"
  else
    log_error "Failed to build MkDocs documentation"
    exit 1
  fi
else
  log_warning "MkDocs not found, skipping main documentation build"
  log_info "Install MkDocs with: pip install mkdocs mkdocs-material"
fi

log_success "Documentation build complete!"
log_info "Generated documentation:"
log_info "  - Django API: docs/api/"
log_info "  - React Components: docs/frontend-api/"
log_info "  - Main docs: site/"
