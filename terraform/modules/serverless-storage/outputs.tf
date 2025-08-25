output "bucket_suffix" {
  description = "The random suffix used for all buckets (if enabled)"
  value       = var.use_random_suffix && length(random_id.bucket_suffix) > 0 ? random_id.bucket_suffix[0].hex : "none"
}

output "bucket_names" {
  description = "Map of environment to bucket names"
  value = {
    for env, bucket in aws_s3_bucket.environment_assets : env => bucket.id
  }
}

output "bucket_arns" {
  description = "Map of environment to bucket ARNs"
  value = {
    for env, bucket in aws_s3_bucket.environment_assets : env => bucket.arn
  }
}

output "bucket_regional_domains" {
  description = "Map of environment to bucket regional domain names"
  value = {
    for env, bucket in aws_s3_bucket.environment_assets : env => bucket.bucket_regional_domain_name
  }
}

output "cloudfront_domains" {
  description = "Map of environment to CloudFront distribution domains (if enabled)"
  value = {
    for env, dist in aws_cloudfront_distribution.cdn : env => dist.domain_name
  }
}

output "lambda_s3_policy_arns" {
  description = "Map of environment to IAM policy ARNs for Lambda S3 access"
  value = {
    for env, policy in aws_iam_policy.lambda_s3_access : env => policy.arn
  }
}

output "configuration_summary" {
  description = "Summary of S3 bucket configuration for each environment"
  value = {
    for env, bucket in aws_s3_bucket.environment_assets : env => {
      bucket_name = bucket.id
      versioning  = aws_s3_bucket_versioning.environment_assets[env].versioning_configuration[0].status
      lifecycle   = try(aws_s3_bucket_lifecycle_configuration.environment_assets[env].rule[0].status, "Disabled")
      cloudfront  = try(aws_cloudfront_distribution.cdn[env].domain_name, "Not enabled")
    }
  }
}