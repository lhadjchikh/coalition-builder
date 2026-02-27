# Security Module

# Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "${var.prefix}-db-sg"
  description = "Allow PostgreSQL inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.lambda_security_group_id]
    description     = "PostgreSQL from Lambda security group"
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
    description     = "PostgreSQL from bastion host"
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [var.lambda_security_group_id]
    description     = "Allow return traffic to the Lambda security group"
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.bastion_sg.id]
    description     = "Allow return traffic to the bastion host"
  }

  tags = {
    Name = "${var.prefix}-db-sg"
  }
}

# Bastion Host Security Group
resource "aws_security_group" "bastion_sg" {
  name        = "${var.prefix}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_bastion_cidrs
    description = "SSH access from allowed IPs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.prefix}-bastion-sg"
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.prefix}-waf"
  description = "WAF for Coalition Builder application"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.prefix}-waf"
  }
}
