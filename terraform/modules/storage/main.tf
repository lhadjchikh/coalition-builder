# Storage Module - S3 bucket for static assets

# Random suffix for S3 bucket to ensure global uniqueness
resource "random_id" "assets_bucket_suffix" {
  byte_length = 4
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket        = "${var.prefix}-static-assets-${random_id.assets_bucket_suffix.hex}"
  force_destroy = var.force_destroy

  tags = {
    Name        = "${var.prefix}-static-assets"
    Environment = var.prefix
    Purpose     = "Static assets storage"
  }
}

# Bucket ACL - Allow public read access
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket ownership controls
resource "aws_s3_bucket_ownership_controls" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Bucket ACL
resource "aws_s3_bucket_acl" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  acl    = "public-read"

  depends_on = [
    aws_s3_bucket_ownership_controls.static_assets,
    aws_s3_bucket_public_access_block.static_assets
  ]
}

# CORS Configuration for browser uploads
resource "aws_s3_bucket_cors_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Versioning (optional, can be useful for recovery)
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle rules for cost optimization (optional)
resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  count  = var.enable_lifecycle_rules ? 1 : 0
  bucket = aws_s3_bucket.static_assets.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }
  }
}

# Bucket Policy for public read access
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_assets]
}

# CloudFront Origin Access Identity (for future CDN integration)
resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "OAI for ${var.prefix} static assets"
}

# IAM Policy for application uploads
resource "aws_iam_policy" "static_assets_upload" {
  name        = "${var.prefix}-static-assets-upload"
  description = "Policy for uploading static assets to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.static_assets.arn
      }
    ]
  })
}