provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# AWS Cloud Control provider for Cost Explorer resources
provider "awscc" {
  region = var.aws_region
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  prefix     = var.prefix
  aws_region = var.aws_region

  # VPC settings
  create_vpc = var.create_vpc
  vpc_id     = var.vpc_id
  vpc_cidr   = var.vpc_cidr

  # Subnet settings
  create_public_subnets = var.create_public_subnets
  public_subnet_ids     = var.public_subnet_ids
  public_subnet_a_cidr  = var.public_subnet_a_cidr
  public_subnet_b_cidr  = var.public_subnet_b_cidr

  create_private_subnets = var.create_private_subnets
  private_subnet_ids     = var.private_subnet_ids
  private_subnet_a_cidr  = var.private_subnet_a_cidr
  private_subnet_b_cidr  = var.private_subnet_b_cidr

  create_db_subnets        = var.create_db_subnets
  db_subnet_ids            = var.db_subnet_ids
  private_db_subnet_a_cidr = var.private_db_subnet_a_cidr
  private_db_subnet_b_cidr = var.private_db_subnet_b_cidr

  create_vpc_endpoints = true
}

# AWS Location Service Module
module "aws_location" {
  source = "./modules/aws-location"

  prefix      = var.prefix
  environment = var.environment
}

# Zappa Module - S3 bucket, IAM role, and Lambda security group for Zappa deployments
module "zappa" {
  source = "./modules/zappa"

  prefix                = var.prefix
  aws_region            = var.aws_region
  vpc_id                = module.networking.vpc_id
  create_lambda_sg      = true
  database_subnet_cidrs = module.networking.db_subnet_cidrs

  secret_arns = [
    module.secrets.db_url_secret_arn,
    module.secrets.secret_key_secret_arn,
  ]
  secrets_kms_key_arn = module.secrets.secrets_kms_key_arn

  tags = var.tags
}

# Security Module
module "security" {
  source = "./modules/security"

  prefix                   = var.prefix
  vpc_id                   = module.networking.vpc_id
  allowed_bastion_cidrs    = var.allowed_bastion_cidrs
  lambda_security_group_id = module.zappa.lambda_security_group_id
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  prefix              = var.prefix
  vpc_id              = module.networking.vpc_id
  budget_limit_amount = var.budget_limit_amount
  alert_email         = var.alert_email
}

# Database Module
module "database" {
  source = "./modules/database"

  prefix                     = var.prefix
  aws_region                 = var.aws_region
  db_subnet_ids              = module.networking.private_db_subnet_ids
  db_security_group_id       = module.security.db_security_group_id
  db_allocated_storage       = var.db_allocated_storage
  db_engine_version          = var.db_engine_version
  db_instance_class          = var.db_instance_class
  db_name                    = var.db_name
  db_username                = var.db_username
  db_password                = var.db_password
  app_db_username            = var.app_db_username
  use_secrets_manager        = true
  db_backup_retention_period = 14
  auto_setup_database        = var.auto_setup_database
  prevent_destroy            = var.prevent_destroy
}

# Secrets Module
module "secrets" {
  source = "./modules/secrets"

  prefix          = var.prefix
  app_db_username = var.app_db_username
  app_db_password = var.app_db_password
  db_endpoint     = module.database.db_instance_endpoint
  db_name         = module.database.db_instance_name
  site_password   = var.site_password
}

# SES Module for Email
module "ses" {
  source = "./modules/ses"

  prefix               = var.prefix
  aws_region           = var.aws_region
  domain_name          = var.domain_name
  from_email           = var.ses_from_email
  verify_domain        = var.ses_verify_domain
  route53_zone_id      = var.route53_zone_id
  dmarc_email          = var.ses_notification_email
  notification_email   = var.ses_notification_email
  enable_notifications = var.ses_enable_notifications
}

# Bastion Host Module
module "bastion" {
  source = "./modules/bastion"

  prefix                    = var.prefix
  public_subnet_id          = module.networking.public_subnet_ids[0]
  bastion_security_group_id = module.security.bastion_security_group_id
  bastion_key_name          = var.bastion_key_name
  bastion_public_key        = var.bastion_public_key
  create_new_key_pair       = var.create_new_key_pair
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  prefix                 = var.prefix
  domain_name            = var.domain_name
  force_destroy          = var.static_assets_force_destroy
  cors_allowed_origins   = var.static_assets_cors_origins != null ? var.static_assets_cors_origins : ["https://${var.domain_name}"]
  enable_versioning      = var.static_assets_enable_versioning
  enable_lifecycle_rules = var.static_assets_enable_lifecycle

  # CloudFront TTL configuration
  s3_cache_min_ttl         = var.cloudfront_s3_cache_min_ttl
  s3_cache_default_ttl     = var.cloudfront_s3_cache_default_ttl
  s3_cache_max_ttl         = var.cloudfront_s3_cache_max_ttl
  static_cache_min_ttl     = var.cloudfront_static_cache_min_ttl
  static_cache_default_ttl = var.cloudfront_static_cache_default_ttl
  static_cache_max_ttl     = var.cloudfront_static_cache_max_ttl
}

# Serverless Storage Module - Creates S3 buckets for Lambda/serverless deployments
# This module creates separate buckets for dev, staging, and production environments
# automatically, making it easy for open-source contributors to get started
module "serverless_storage" {
  source = "./modules/serverless-storage"

  project_name                 = var.prefix
  force_destroy_non_production = var.environment != "prod"
  enable_lifecycle_rules       = true
  enable_cloudfront            = var.environment == "prod" || var.environment == "staging"

  production_cors_origins = [
    "https://${var.domain_name}",
    "https://www.${var.domain_name}"
  ]
}

# Lambda ECR Module - Creates ECR repositories for Lambda deployment
module "lambda_ecr" {
  source = "./modules/lambda-ecr"

  tags = var.tags
}

# ACM certificate for domain and all subdomains
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# API custom domain
resource "aws_api_gateway_domain_name" "api" {
  domain_name              = "api.${var.domain_name}"
  regional_certificate_arn = aws_acm_certificate_validation.main.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = var.api_gateway_id
  stage_name  = var.api_gateway_stage
  domain_name = aws_api_gateway_domain_name.api.domain_name
}

resource "aws_route53_record" "api" {
  zone_id = var.route53_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.api.regional_zone_id
    evaluate_target_health = true
  }
}

# DNS - Point domain to Vercel
resource "aws_route53_record" "apex" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = ["76.76.21.21"]
}

resource "aws_route53_record" "www" {
  zone_id = var.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}
