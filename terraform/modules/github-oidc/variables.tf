variable "environment" {
  description = "Environment name (e.g., shared, prod, dev)"
  type        = string
}

variable "create_oidc_provider" {
  description = "Whether to create the OIDC provider (only needed once per account)"
  type        = bool
  default     = true
}

variable "existing_oidc_provider_arn" {
  description = "ARN of an existing OIDC provider (used when create_oidc_provider is false)"
  type        = string
  default     = ""
}

variable "github_subjects" {
  description = "List of GitHub OIDC subject claims to allow (e.g., repo:org/repo:environment:prod)"
  type        = list(string)
}

variable "policy_arns" {
  description = "List of IAM policy ARNs to attach to the GitHub Actions role"
  type        = list(string)
  default     = []
}

variable "enable_terraform_policy" {
  description = "Whether to attach the inline Terraform state/lock policy"
  type        = bool
  default     = true
}

variable "enable_infrastructure_policy" {
  description = "Whether to attach the inline infrastructure management policy for Terraform CI/CD"
  type        = bool
  default     = false
}
