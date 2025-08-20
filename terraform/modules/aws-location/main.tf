# AWS Location Service for internal geocoding

# Create a place index for geocoding
resource "aws_location_place_index" "geocoding" {
  index_name  = "${var.prefix}-geocoding-index"
  data_source = var.location_data_source # Configurable data source (default: Esri for US coverage)
  # Note: pricing_plan removed as it's deprecated - AWS now uses pay-per-request by default

  tags = {
    Name        = "${var.prefix}-geocoding-index"
    Environment = var.environment
  }
}


# IAM policy for ECS tasks to use AWS Location Service
resource "aws_iam_policy" "location_access" {
  name_prefix = "${var.prefix}-location-access-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "geo:SearchPlaceIndexForText",
          "geo:SearchPlaceIndexForPosition",
          "geo:SearchPlaceIndexForSuggestions",
          "geo:GetPlace"
        ]
        Resource = aws_location_place_index.geocoding.index_arn
      }
    ]
  })
}

# NOTE: The policy attachment is handled in the compute module to avoid circular dependency
# The compute module will attach this policy to the ECS task role