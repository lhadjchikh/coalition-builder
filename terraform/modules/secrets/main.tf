terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Secrets Management Module

# KMS key for Secrets Manager
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.prefix}-secrets-kms-key"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# Database URL Secret
resource "aws_secretsmanager_secret" "db_url" {
  name        = "${var.prefix}/database-url"
  description = "PostgreSQL database connection URL for the application"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = {
    Name = "${var.prefix}-db-url"
  }
}

# Django Secret Key Secret
resource "aws_secretsmanager_secret" "secret_key" {
  name        = "${var.prefix}/secret-key"
  description = "Django secret key for the application"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = {
    Name = "${var.prefix}-secret-key"
  }
}

# Secret versions - use lifecycle to avoid storing sensitive data in state
resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "{\"url\":\"postgis://${var.app_db_username}@${var.db_endpoint}/${var.db_name}\"}"

  lifecycle {
    ignore_changes = [
      secret_string
    ]
  }
}

resource "aws_secretsmanager_secret_version" "secret_key" {
  secret_id     = aws_secretsmanager_secret.secret_key.id
  secret_string = "{\"key\":\"dummy-value-to-be-changed\"}"

  lifecycle {
    ignore_changes = [
      secret_string
    ]
  }
}