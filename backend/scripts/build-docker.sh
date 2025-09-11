#!/bin/bash

# Build and push Docker images for Lambda deployment
# This script handles both the geolambda base image and environment-specific app images

set -e # Exit on error

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
# AWS_ACCOUNT must be set as environment variable (removed hardcoded default)
AWS_ACCOUNT=${AWS_ACCOUNT}
ECR_REGISTRY="${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"

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
cd "$(dirname "$0")/.." || exit 1

# Function to build and push the geolambda base image
build_geolambda() {
  log_info "Building geolambda base image with GDAL/GEOS/PROJ..."
  log_warn "This will take 20-30 minutes for the first build"

  # Create ECR repository if it doesn't exist
  aws ecr describe-repositories --repository-names geolambda --region "${AWS_REGION}" 2>/dev/null ||
    aws ecr create-repository --repository-name geolambda --region "${AWS_REGION}"

  # Build the base image
  docker build \
    -f docker/geolambda/Dockerfile \
    -t geolambda:3.10.3 \
    --platform linux/amd64 \
    .

  # Tag for ECR
  docker tag geolambda:3.10.3 "${ECR_REGISTRY}/geolambda:3.10.3"
  docker tag geolambda:3.10.3 "${ECR_REGISTRY}/geolambda:latest"

  # Push to ECR
  log_info "Pushing geolambda base image to ECR..."
  aws ecr get-login-password --region "${AWS_REGION}" |
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"

  docker push "${ECR_REGISTRY}/geolambda:3.10.3"
  docker push "${ECR_REGISTRY}/geolambda:latest"

  log_info "Geolambda base image built and pushed successfully"
}

# Function to build and push environment-specific application images
build_app() {
  local ENV=${1:-dev}
  log_info "Building application image for ${ENV} environment..."

  # Validate environment
  if [[ ! "$ENV" =~ ^(dev|staging|production|prod)$ ]]; then
    log_error "Invalid environment: $ENV. Must be dev, staging, or production"
    exit 1
  fi

  # Normalize production/prod
  if [ "$ENV" = "production" ]; then
    ENV="prod"
  fi

  # Create ECR repository if it doesn't exist
  aws ecr describe-repositories --repository-names "coalition-${ENV}" --region "${AWS_REGION}" 2>/dev/null ||
    aws ecr create-repository --repository-name "coalition-${ENV}" --region "${AWS_REGION}"

  # Check if geolambda base image exists locally
  if ! docker images | grep -q "geolambda.*3.10.3"; then
    log_warn "Geolambda base image not found locally, pulling from ECR..."
    aws ecr get-login-password --region "${AWS_REGION}" |
      docker login --username AWS --password-stdin "${ECR_REGISTRY}"
    docker pull "${ECR_REGISTRY}/geolambda:3.10.3"
    docker tag "${ECR_REGISTRY}/geolambda:3.10.3" geolambda:3.10.3
  fi

  # Build the application image
  docker build \
    -f docker/app/Dockerfile.lambda \
    -t "coalition-${ENV}:latest" \
    --platform linux/amd64 \
    --build-arg ENV="${ENV}" \
    .

  # Tag for ECR
  docker tag "coalition-${ENV}:latest" "${ECR_REGISTRY}/coalition-${ENV}:latest"

  # Also tag with timestamp for versioning
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  docker tag "coalition-${ENV}:latest" "${ECR_REGISTRY}/coalition-${ENV}:${TIMESTAMP}"

  # Push to ECR
  log_info "Pushing application image to ECR..."
  aws ecr get-login-password --region "${AWS_REGION}" |
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"

  docker push "${ECR_REGISTRY}/coalition-${ENV}:latest"
  docker push "${ECR_REGISTRY}/coalition-${ENV}:${TIMESTAMP}"

  log_info "Application image for ${ENV} built and pushed successfully"
  log_info "Image URI: ${ECR_REGISTRY}/coalition-${ENV}:latest"
}

# Function to list available images in ECR
list_images() {
  log_info "Listing available images in ECR..."

  # List geolambda images
  echo -e "\n${GREEN}Geolambda base images:${NC}"
  aws ecr describe-images --repository-name geolambda --region "${AWS_REGION}" \
    --query 'imageDetails[*].[imageTags[0],imagePushedAt]' \
    --output table 2>/dev/null || echo "  No geolambda images found"

  # List environment images
  for env in dev staging prod; do
    echo -e "\n${GREEN}Coalition-${env} images:${NC}"
    aws ecr describe-images --repository-name "coalition-${env}" --region "${AWS_REGION}" \
      --query 'imageDetails[*].[imageTags[0],imagePushedAt]' \
      --output table 2>/dev/null || echo "  No ${env} images found"
  done
}

# Function to clean up old images
cleanup_old_images() {
  local KEEP_COUNT=${1:-3}
  log_info "Cleaning up old images (keeping latest ${KEEP_COUNT} per repository)..."

  for repo in geolambda coalition-dev coalition-staging coalition-prod; do
    # Get image digests to delete (keep latest N)
    DIGESTS=$(aws ecr describe-images --repository-name "${repo}" --region "${AWS_REGION}" \
      --query "imageDetails[?imagePushedAt] | sort_by(@, &imagePushedAt) | [0:-${KEEP_COUNT}].[imageDigest]" \
      --output text 2>/dev/null)

    if [ -n "$DIGESTS" ]; then
      log_warn "Deleting old images from ${repo}..."
      for digest in $DIGESTS; do
        aws ecr batch-delete-image --repository-name "${repo}" --region "${AWS_REGION}" \
          --image-ids imageDigest="${digest}" >/dev/null
      done
    fi
  done

  log_info "Cleanup complete"
}

# Main execution
case "${1}" in
  geolambda)
    build_geolambda
    ;;
  dev | staging | production | prod)
    build_app "$1"
    ;;
  all)
    build_geolambda
    build_app dev
    build_app staging
    build_app prod
    ;;
  list)
    list_images
    ;;
  cleanup)
    cleanup_old_images "${2:-3}"
    ;;
  *)
    echo "Usage: $0 {geolambda|dev|staging|production|all|list|cleanup [keep_count]}"
    echo ""
    echo "Commands:"
    echo "  geolambda    - Build and push the geolambda base image (run once)"
    echo "  dev          - Build and push development environment image"
    echo "  staging      - Build and push staging environment image"
    echo "  production   - Build and push production environment image"
    echo "  all          - Build all images (base + all environments)"
    echo "  list         - List all images in ECR"
    echo "  cleanup N    - Remove old images, keeping latest N (default: 3)"
    echo ""
    echo "Examples:"
    echo "  $0 geolambda        # Build base image (first time only)"
    echo "  $0 dev              # Build dev environment"
    echo "  $0 production       # Build production environment"
    echo "  $0 list             # Show all ECR images"
    echo "  $0 cleanup 5        # Keep only 5 latest images per repo"
    exit 1
    ;;
esac
