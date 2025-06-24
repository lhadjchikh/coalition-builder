#!/bin/bash
set -e

# Script to push Redis image to ECR
# Usage: ./push-redis-to-ecr.sh <repository_name> <repository_url> <aws_region> <redis_version>

REPOSITORY_NAME="$1"
REPOSITORY_URL="$2"
AWS_REGION="$3"
REDIS_VERSION="$4"

if [ -z "$REPOSITORY_NAME" ] || [ -z "$REPOSITORY_URL" ] || [ -z "$AWS_REGION" ] || [ -z "$REDIS_VERSION" ]; then
  echo "Usage: $0 <repository_name> <repository_url> <aws_region> <redis_version>"
  exit 1
fi

echo "Checking if Redis image ${REDIS_VERSION} already exists in ECR..."

# Check if image already exists to avoid unnecessary pushes
if aws ecr describe-images --repository-name "${REPOSITORY_NAME}" --image-ids imageTag="${REDIS_VERSION}" --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "Redis image ${REDIS_VERSION} already exists in ECR, skipping push"
  exit 0
fi

echo "Pushing Redis image to ECR..."

# Login to ECR
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${REPOSITORY_URL}"

# Pull Redis image from Docker Hub
docker pull "redis:${REDIS_VERSION}"

# Tag for ECR
docker tag "redis:${REDIS_VERSION}" "${REPOSITORY_URL}:${REDIS_VERSION}"

# Push to ECR
docker push "${REPOSITORY_URL}:${REDIS_VERSION}"

echo "Successfully pushed Redis image to ECR"
