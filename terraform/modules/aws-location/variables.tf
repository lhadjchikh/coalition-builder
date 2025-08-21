variable "prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# Removed ecs_task_role_name variable to avoid circular dependency
# The compute module will handle attaching the policy to the ECS task role

variable "location_data_source" {
  description = "The data source for AWS Location Place Index. Valid values: 'Esri', 'Here', 'Grab'."
  type        = string
  default     = "Esri"

  validation {
    condition     = contains(["Esri", "Here", "Grab"], var.location_data_source)
    error_message = "Valid values for location_data_source are: Esri, Here, Grab."
  }
}