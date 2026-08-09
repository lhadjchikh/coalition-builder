locals {
  environment_database_names = {
    dev  = "coalition_dev"
    prod = "coalition"
  }
}

output "environment_database_names" {
  description = "Authoritative database name for each application environment"
  value       = local.environment_database_names
}
