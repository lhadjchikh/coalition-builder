variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "coalition"
}

variable "vpc_id" {
  description = "ID of the VPC to monitor"
  type        = string
}

variable "budget_limit_amount" {
  description = "Monthly budget limit amount in USD"
  type        = string
  default     = "30"
}

variable "alert_email" {
  description = "Email address to receive budget and other alerts"
  type        = string
}
variable "application_log_group_name" {
  description = "CloudWatch log group to watch for email delivery failures (empty disables the alarm)"
  type        = string
  default     = ""
}
