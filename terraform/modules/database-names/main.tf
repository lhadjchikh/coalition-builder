locals {
  environment_database_names = jsondecode(file("${path.module}/environment_database_names.json"))
}

output "environment_database_names" {
  description = "Authoritative database name for each application environment"
  value       = local.environment_database_names
}
