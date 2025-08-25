# Serverless Storage Module - S3 buckets for Lambda/serverless deployments
# Creates environment-specific S3 buckets for static assets and uploads

locals {
  environments = ["dev", "staging", "production"]
  
  # Map environment names to bucket names as expected by zappa_settings.json
  bucket_names = {
    dev        = "coalition-dev-assets"
    staging    = "coalition-staging-assets"
    production = "coalition-production-assets"
  }
}

# Create S3 buckets for each environment
resource "aws_s3_bucket" "environment_assets" {
  for_each = local.bucket_names
  
  bucket        = each.value
  force_destroy = var.force_destroy_non_production || each.key == "dev"

  tags = {
    Name        = each.value
    Environment = each.key
    Purpose     = "Static assets for ${each.key} environment"
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

# Bucket versioning (enabled for staging and production)
resource "aws_s3_bucket_versioning" "environment_assets" {
  for_each = local.bucket_names
  
  bucket = aws_s3_bucket.environment_assets[each.key].id
  
  versioning_configuration {
    status = each.key == "production" || each.key == "staging" ? "Enabled" : "Suspended"
  }
}

# Public access block - more restrictive for production
resource "aws_s3_bucket_public_access_block" "environment_assets" {
  for_each = local.bucket_names
  
  bucket = aws_s3_bucket.environment_assets[each.key].id

  # Production should be more restrictive
  block_public_acls       = each.key == "production"
  block_public_policy     = false
  ignore_public_acls      = each.key == "production"
  restrict_public_buckets = false
}

# CORS configuration for each bucket
resource "aws_s3_bucket_cors_configuration" "environment_assets" {
  for_each = local.bucket_names
  
  bucket = aws_s3_bucket.environment_assets[each.key].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "HEAD"]
    allowed_origins = each.key == "production" ? var.production_cors_origins : ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle rules for cost optimization (non-production)
resource "aws_s3_bucket_lifecycle_configuration" "environment_assets" {
  for_each = var.enable_lifecycle_rules ? { for k, v in local.bucket_names : k => v if k != "production" } : {}
  
  bucket = aws_s3_bucket.environment_assets[each.key].id

  rule {
    id     = "cleanup-old-files"
    status = "Enabled"

    # Delete incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    # Transition to cheaper storage after 30 days (dev/staging only)
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Delete old files after 90 days in dev, 180 days in staging
    expiration {
      days = each.key == "dev" ? 90 : 180
    }

    # Clean up old versions
    noncurrent_version_expiration {
      noncurrent_days = each.key == "dev" ? 7 : 30
    }
  }
}

# Bucket policies for public read access
resource "aws_s3_bucket_policy" "environment_assets" {
  for_each = local.bucket_names
  
  bucket = aws_s3_bucket.environment_assets[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.environment_assets[each.key].arn}/*"
        Condition = each.key == "production" ? {
          IpAddress = {
            "aws:SourceIp" = var.production_ip_whitelist
          }
        } : null
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.environment_assets]
}

# CloudFront distributions for production and staging (optional)
resource "aws_cloudfront_distribution" "cdn" {
  for_each = var.enable_cloudfront ? { for k, v in local.bucket_names : k => v if k != "dev" } : {}

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for ${each.key} static assets"
  default_root_object = "index.html"
  price_class         = each.key == "production" ? "PriceClass_All" : "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.environment_assets[each.key].bucket_regional_domain_name
    origin_id   = "S3-${each.value}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.cdn[each.key].cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${each.value}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = each.key == "production" ? 86400 : 3600
    max_ttl                = each.key == "production" ? 31536000 : 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = each.key
    Purpose     = "CDN for ${each.key} static assets"
  }
}

# CloudFront OAI for secure S3 access
resource "aws_cloudfront_origin_access_identity" "cdn" {
  for_each = var.enable_cloudfront ? { for k, v in local.bucket_names : k => v if k != "dev" } : {}
  
  comment = "OAI for ${each.key} environment CDN"
}

# IAM policy for Lambda to access buckets
resource "aws_iam_policy" "lambda_s3_access" {
  for_each = local.bucket_names
  
  name        = "${each.value}-lambda-access"
  description = "Allow Lambda functions to access ${each.key} S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.environment_assets[each.key].arn,
          "${aws_s3_bucket.environment_assets[each.key].arn}/*"
        ]
      }
    ]
  })
}