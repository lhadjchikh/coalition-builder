# ECS Cluster for geodata imports (used occasionally)
resource "aws_ecs_cluster" "geodata_import" {
  name = "${var.prefix}-geodata-import"

  setting {
    name  = "containerInsights"
    value = "disabled" # Disable to save costs
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.prefix}-geodata-import"
      Purpose = "Geographic data imports"
    }
  )
}

# Task Definition for geodata imports
resource "aws_ecs_task_definition" "geodata_import" {
  family                   = "${var.prefix}-geodata-import"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "2048" # 2 vCPU for shapefile processing
  memory                   = "4096" # 4GB RAM for GDAL operations
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "geodata-import"
    image = "${var.ecr_repository_url}:latest"

    environment = [
      { name = "USE_GEODJANGO", value = "true" },
      { name = "DJANGO_SETTINGS_MODULE", value = "coalition.core.settings" },
      { name = "IS_ECS_GEODATA_IMPORT", value = "true" }
    ]

    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = var.database_secret_arn
      },
      {
        name      = "SECRET_KEY"
        valueFrom = var.django_secret_key_arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.geodata_import.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "geodata"
      }
    }

    # Command will be overridden at runtime
    command = ["python", "manage.py", "import_tiger_data", "--help"]
  }])

  tags = var.tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "geodata_import" {
  name              = "/ecs/geodata-import"
  retention_in_days = 7 # Short retention to save costs

  tags = var.tags
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution" {
  name = "${var.prefix}-geodata-import-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  name = "${var.prefix}-geodata-import-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach policies to execution role
resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy for accessing secrets
resource "aws_iam_role_policy" "ecs_secrets_policy" {
  name = "${var.prefix}-geodata-import-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.database_secret_arn,
          var.django_secret_key_arn
        ]
      }
    ]
  })
}

# Policy for S3 access (downloading shapefiles)
resource "aws_iam_role_policy" "ecs_s3_policy" {
  name = "${var.prefix}-geodata-import-s3"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::census-tiger-*",
          "arn:aws:s3:::census-tiger-*/*",
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}