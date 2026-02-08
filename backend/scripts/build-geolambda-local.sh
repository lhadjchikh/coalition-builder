#!/bin/bash

# Build geolambda Docker image locally for testing
# This script doesn't push to ECR - it's just for local testing

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in the backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.." || exit 1

log_info "Building geolambda base image locally..."
log_warn "This will take 20-30 minutes for the first build"
log_info "Docker context: $(pwd)"

# Build the base image for local platform
docker build \
  -f docker/geolambda/Dockerfile \
  -t geolambda:3.10.3 \
  -t geolambda:latest \
  .

log_info "✅ Geolambda base image built successfully"
log_info "Image tags: geolambda:3.10.3, geolambda:latest"
log_info ""
log_info "To verify the build, run:"
log_info "  docker run --rm geolambda:3.10.3 python -c 'from osgeo import gdal; print(gdal.__version__)'"
