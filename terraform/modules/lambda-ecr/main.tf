# ECR repositories for Lambda deployment with Docker

resource "aws_ecr_repository" "geolambda" {
  name                 = "geolambda"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.tags,
    {
      Name    = "geolambda"
      Purpose = "Base image with GDAL/GEOS/PROJ for Lambda"
    }
  )
}

resource "aws_ecr_repository" "lambda" {
  name                 = "coalition-${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.tags,
    {
      Name        = "coalition-${var.environment}"
      Purpose     = "Lambda application image"
      Environment = var.environment
    }
  )
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "lambda" {
  repository = aws_ecr_repository.lambda.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
