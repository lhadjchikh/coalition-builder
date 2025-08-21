variable "prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "domain_name" {
  description = "Domain name for sending emails"
  type        = string
}

variable "from_email" {
  description = "Default from email address"
  type        = string
}

variable "verify_domain" {
  description = "Whether to verify the entire domain in SES"
  type        = bool
  default     = true
}

variable "verify_email" {
  description = "Whether to verify individual email address (fallback if domain verification is false)"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route53 zone ID for automatic DNS verification (optional)"
  type        = string
  default     = ""
}

variable "create_spf_record" {
  description = "Whether to create SPF record for better deliverability"
  type        = bool
  default     = true
}

variable "create_dmarc_record" {
  description = "Whether to create DMARC record for email authentication"
  type        = bool
  default     = true
}

variable "dmarc_email" {
  description = "Email address for DMARC reports"
  type        = string
  default     = ""
}

variable "enable_notifications" {
  description = "Whether to enable SNS notifications for bounces and complaints"
  type        = bool
  default     = true
}

variable "notification_email" {
  description = "Email address for receiving SES notifications"
  type        = string
  default     = ""
}

variable "secret_recovery_days" {
  description = "Number of days to retain deleted secrets"
  type        = number
  default     = 7
}