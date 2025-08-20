output "place_index_name" {
  description = "Name of the AWS Location place index for geocoding"
  value       = aws_location_place_index.geocoding.index_name
}

output "place_index_arn" {
  description = "ARN of the AWS Location place index"
  value       = aws_location_place_index.geocoding.index_arn
}

output "location_policy_arn" {
  description = "ARN of the IAM policy for Location Service access"
  value       = aws_iam_policy.location_access.arn
}