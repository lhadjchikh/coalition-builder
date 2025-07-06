output "static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "static_assets_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.arn
}

output "static_assets_bucket_domain_name" {
  description = "Domain name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket_domain_name
}

output "static_assets_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket_regional_domain_name
}

output "static_assets_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.hosted_zone_id
}

output "static_assets_upload_policy_arn" {
  description = "ARN of the IAM policy for uploading to the static assets bucket"
  value       = aws_iam_policy.static_assets_upload.arn
}

output "cloudfront_origin_access_identity_path" {
  description = "CloudFront origin access identity path"
  value       = aws_cloudfront_origin_access_identity.static_assets.cloudfront_access_identity_path
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for static assets"
  value       = aws_cloudfront_distribution.static_assets.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution for static assets"
  value       = aws_cloudfront_distribution.static_assets.arn
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution for static assets"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution for static assets"
  value       = aws_cloudfront_distribution.static_assets.hosted_zone_id
}