# Security Module

data "aws_vpc" "current" {
  id = var.vpc_id
}

# Application Security Group
resource "aws_security_group" "app_sg" {
  name        = "${var.prefix}-sg"
  description = "Allow inbound traffic for Coalition Builder application"
  vpc_id      = var.vpc_id

  # All rules are managed as separate resources to avoid circular dependencies

  tags = {
    Name = "${var.prefix}-app-sg"
  }
}

# ALB Security Group
resource "aws_security_group" "alb_sg" {
  name        = "${var.prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  # Ingress rules that don't reference other security groups
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  # Egress rules are managed as separate resources to avoid circular dependencies

  tags = {
    Name = "${var.prefix}-alb-sg"
  }
}

# Add cross-references separately to avoid circular dependencies

# Null resource to manage security group rule dependencies
resource "null_resource" "security_group_rules_dependency" {
  triggers = {
    alb_sg_id = aws_security_group.alb_sg.id
    app_sg_id = aws_security_group.app_sg.id
  }
}

# Allow ALB to send traffic to api containers (egress from ALB)
resource "aws_vpc_security_group_egress_rule" "alb_to_api" {
  security_group_id            = aws_security_group.alb_sg.id
  referenced_security_group_id = aws_security_group.app_sg.id
  from_port                    = 8000
  to_port                      = 8000
  ip_protocol                  = "tcp"
  description                  = "ALB to application containers on port 8000"

  tags = {
    Name = "${var.prefix}-alb-to-api-8000"
    Type = "egress"
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_security_group.alb_sg,
    aws_security_group.app_sg,
    null_resource.security_group_rules_dependency
  ]
}

# Allow ALB to send traffic to app containers (egress from ALB)
resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb_sg.id
  referenced_security_group_id = aws_security_group.app_sg.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
  description                  = "ALB to SSR container on port 3000"

  tags = {
    Name = "${var.prefix}-alb-to-app-3000"
    Type = "egress"
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_security_group.alb_sg,
    aws_security_group.app_sg,
    null_resource.security_group_rules_dependency
  ]
}

# Allow api containers to receive traffic from ALB (ingress to api)
resource "aws_vpc_security_group_ingress_rule" "api_from_alb" {
  security_group_id            = aws_security_group.app_sg.id
  referenced_security_group_id = aws_security_group.alb_sg.id
  from_port                    = 8000
  to_port                      = 8000
  ip_protocol                  = "tcp"
  description                  = "Accept traffic from ALB on port 8000"

  tags = {
    Name = "${var.prefix}-api-from-alb-8000"
    Type = "ingress"
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_security_group.alb_sg,
    aws_security_group.app_sg,
    null_resource.security_group_rules_dependency
  ]
}

# Allow app containers to receive SSR traffic from ALB (ingress to app)
resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app_sg.id
  referenced_security_group_id = aws_security_group.alb_sg.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
  description                  = "Accept traffic from ALB on port 3000"

  tags = {
    Name = "${var.prefix}-app-from-alb-3000"
    Type = "ingress"
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_security_group.alb_sg,
    aws_security_group.app_sg,
    null_resource.security_group_rules_dependency
  ]
}

# Additional ALB egress rules (non-circular)
resource "aws_vpc_security_group_egress_rule" "alb_http" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP outbound for health checks and redirects"
}

resource "aws_vpc_security_group_egress_rule" "alb_https" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS outbound for SSL validation and AWS APIs"
}

resource "aws_vpc_security_group_egress_rule" "alb_dns_tcp" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = data.aws_vpc.current.cidr_block
  from_port         = 53
  to_port           = 53
  ip_protocol       = "tcp"
  description       = "DNS resolution within VPC only"
}

resource "aws_vpc_security_group_egress_rule" "alb_dns_udp" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = data.aws_vpc.current.cidr_block
  from_port         = 53
  to_port           = 53
  ip_protocol       = "udp"
  description       = "DNS resolution within VPC only"
}

resource "aws_vpc_security_group_egress_rule" "alb_ntp" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 123
  to_port           = 123
  ip_protocol       = "udp"
  description       = "NTP time synchronization"
}

# Additional app ingress rules (non-circular)
resource "aws_vpc_security_group_ingress_rule" "app_http" {
  security_group_id = aws_security_group.app_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP from internet via load balancer"
}

resource "aws_vpc_security_group_ingress_rule" "app_https" {
  security_group_id = aws_security_group.app_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS from internet via load balancer"
}

# App egress rules
resource "aws_vpc_security_group_egress_rule" "app_https" {
  security_group_id = aws_security_group.app_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS outbound traffic"
}

resource "aws_vpc_security_group_egress_rule" "app_http" {
  security_group_id = aws_security_group.app_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "HTTP outbound traffic"
}

# App to database egress - handle multiple subnets
resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  for_each = toset(var.database_subnet_cidrs)

  security_group_id = aws_security_group.app_sg.id
  cidr_ipv4         = each.value
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
  description       = "PostgreSQL access to database subnet ${each.value}"
}

# Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "${var.prefix}-db-sg"
  description = "Allow PostgreSQL inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
    description     = "PostgreSQL from application security group"
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
    security_groups = [aws_security_group.app_sg.id]
    description     = "Allow return traffic to the application security group"
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