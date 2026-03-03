# GitHub OIDC Module
# Creates an IAM OIDC provider for GitHub Actions and an IAM role
# that GitHub Actions workflows can assume via OIDC federation.

terraform {
  required_version = ">= 1.12.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.99.0"
    }
  }
}

data "aws_caller_identity" "current" {}

# GitHub OIDC Provider
# Only one provider per account is needed (GitHub's thumbprint is stable)
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["ffffffffffffffffffffffffffffffffffffffff"]

  tags = {
    Name = "github-actions-oidc"
  }
}

locals {
  oidc_provider_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.existing_oidc_provider_arn
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "github-actions-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = local.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = var.github_subjects
          }
        }
      }
    ]
  })

  tags = {
    Name        = "github-actions-${var.environment}"
    Environment = var.environment
  }
}

# Attach managed policies to the role
resource "aws_iam_role_policy_attachment" "github_actions" {
  count = length(var.policy_arns)

  role       = aws_iam_role.github_actions.name
  policy_arn = var.policy_arns[count.index]
}

# Inline policy for Terraform operations (S3 state, DynamoDB locks)
resource "aws_iam_role_policy" "terraform_operations" {
  count = var.enable_terraform_policy ? 1 : 0

  name = "${var.environment}-terraform-operations"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TerraformStateAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::coalition-terraform-state-*",
          "arn:aws:s3:::coalition-terraform-state-*/*"
        ]
      },
      {
        Sid    = "TerraformLockAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/coalition-terraform-locks"
      }
    ]
  })
}

# Inline policy for infrastructure management (Terraform plan/apply)
resource "aws_iam_role_policy" "infrastructure" {
  count = var.enable_infrastructure_policy ? 1 : 0

  name = "${var.environment}-infrastructure"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        # --- Global services (no account in ARN or required by Terraform) ---
        {
          Sid      = "EC2AndVPC"
          Effect   = "Allow"
          Action   = ["ec2:*"]
          Resource = "*"
        },
        {
          Sid      = "S3"
          Effect   = "Allow"
          Action   = ["s3:*"]
          Resource = "*"
        },
        {
          Sid      = "CloudFront"
          Effect   = "Allow"
          Action   = ["cloudfront:*"]
          Resource = "*"
        },
        {
          Sid      = "WAF"
          Effect   = "Allow"
          Action   = ["wafv2:*"]
          Resource = "*"
        },
        {
          Sid      = "SES"
          Effect   = "Allow"
          Action   = ["ses:*"]
          Resource = "*"
        },
        {
          Sid      = "Route53"
          Effect   = "Allow"
          Action   = ["route53:*"]
          Resource = "*"
        },
        {
          Sid      = "ACM"
          Effect   = "Allow"
          Action   = ["acm:*"]
          Resource = "*"
        },
        {
          Sid      = "APIGateway"
          Effect   = "Allow"
          Action   = ["apigateway:*"]
          Resource = "*"
        },
        {
          Sid      = "KMS"
          Effect   = "Allow"
          Action   = ["kms:*"]
          Resource = "*"
        },
        {
          Sid      = "Location"
          Effect   = "Allow"
          Action   = ["geo:*"]
          Resource = "*"
        },
        {
          Sid      = "Budgets"
          Effect   = "Allow"
          Action   = ["budgets:*", "ce:*"]
          Resource = "*"
        },

        # --- IAM read-only (safe at *) ---
        {
          Sid    = "IAMReadOnly"
          Effect = "Allow"
          Action = [
            "iam:GetRole",
            "iam:GetRolePolicy",
            "iam:GetPolicy",
            "iam:GetPolicyVersion",
            "iam:GetInstanceProfile",
            "iam:GetOpenIDConnectProvider",
            "iam:ListRolePolicies",
            "iam:ListAttachedRolePolicies",
            "iam:ListInstanceProfilesForRole",
            "iam:ListPolicyVersions",
            "iam:ListRoleTags",
          ]
          Resource = "*"
        },

        # --- IAM mutate (scoped to prefix and OIDC provider) ---
        {
          Sid    = "IAMMutate"
          Effect = "Allow"
          Action = [
            "iam:CreateRole",
            "iam:DeleteRole",
            "iam:UpdateRole",
            "iam:TagRole",
            "iam:UntagRole",
            "iam:PutRolePolicy",
            "iam:DeleteRolePolicy",
            "iam:AttachRolePolicy",
            "iam:DetachRolePolicy",
            "iam:PassRole",
            "iam:CreatePolicy",
            "iam:DeletePolicy",
            "iam:CreatePolicyVersion",
            "iam:DeletePolicyVersion",
            "iam:CreateInstanceProfile",
            "iam:DeleteInstanceProfile",
            "iam:AddRoleToInstanceProfile",
            "iam:RemoveRoleFromInstanceProfile",
            "iam:CreateOpenIDConnectProvider",
            "iam:DeleteOpenIDConnectProvider",
            "iam:TagOpenIDConnectProvider",
            "iam:UpdateOpenIDConnectProviderThumbprint",
            "iam:AddClientIDToOpenIDConnectProvider",
            "iam:CreateServiceLinkedRole",
          ]
          Resource = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.resource_prefix}-*",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${var.resource_prefix}-*",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/${var.resource_prefix}-*",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/*",
          ]
        },

        # --- Account-scoped services ---
        {
          Sid      = "RDS"
          Effect   = "Allow"
          Action   = ["rds:*"]
          Resource = "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid      = "Lambda"
          Effect   = "Allow"
          Action   = ["lambda:*"]
          Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid      = "ECR"
          Effect   = "Allow"
          Action   = ["ecr:*"]
          Resource = "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid      = "SecretsManager"
          Effect   = "Allow"
          Action   = ["secretsmanager:*"]
          Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid      = "SSM"
          Effect   = "Allow"
          Action   = ["ssm:*"]
          Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid      = "SNS"
          Effect   = "Allow"
          Action   = ["sns:*"]
          Resource = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        },
        {
          Sid    = "CloudWatch"
          Effect = "Allow"
          Action = ["cloudwatch:*", "logs:*"]
          Resource = [
            "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*",
            "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*",
          ]
        },
      ],

      # --- STS: only if peering_account_ids is non-empty ---
      length(var.peering_account_ids) > 0 ? [
        {
          Sid    = "STS"
          Effect = "Allow"
          Action = ["sts:AssumeRole"]
          Resource = [
            for account_id in var.peering_account_ids :
            "arn:aws:iam::${account_id}:role/vpc-peering-accepter"
          ]
        },
      ] : [],
    )
  })
}
