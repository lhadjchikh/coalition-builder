locals {
  database_name_configuration = jsondecode(file("${path.module}/environment_database_names.json"))
}

output "environment_database_names" {
  description = "Authoritative database name for each application environment"
  value       = local.database_name_configuration.environment_databases
}

output "rds_initial_database_name" {
  description = "Immutable initial database name recorded by the existing RDS instance"
  value       = local.database_name_configuration.rds_initial_database
}
