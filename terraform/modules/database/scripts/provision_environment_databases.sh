#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
correlation_id="${DATABASE_PROVISIONING_CORRELATION_ID:-manual-database-provisioning}"
endpoint=""
master_user=""
maintenance_database="postgres"
prod_database=""
dev_database=""
prod_user=""
dev_user=""

log_event() {
  local stage="$1"
  local outcome="$2"
  local message="$3"

  printf 'stage=%s correlation=%s outcome=%s message="%s"\n' \
    "${stage}" "${correlation_id}" "${outcome}" "${message}"
}

fail() {
  log_event "validation" "failure" "$1" >&2
  exit 1
}

usage() {
  printf '%s\n' \
    "Usage: $0 --endpoint HOST[:PORT] --master-user USER \" \
    "  --prod-database NAME --dev-database NAME \" \
    "  --prod-user USER --dev-user USER [--maintenance-database NAME]"
}

require_option_value() {
  local option_name="$1"
  local option_value="${2:-}"

  [[ -n "${option_value}" ]] || fail "${option_name} requires a value"
}

parse_arguments() {
  while [[ $# -gt 0 ]]; do
    require_option_value "$1" "${2:-}"
    case "$1" in
      --endpoint) endpoint="$2" ;;
      --master-user) master_user="$2" ;;
      --maintenance-database) maintenance_database="$2" ;;
      --prod-database) prod_database="$2" ;;
      --dev-database) dev_database="$2" ;;
      --prod-user) prod_user="$2" ;;
      --dev-user) dev_user="$2" ;;
      --help)
        usage
        exit 0
        ;;
      *) fail "unknown option: $1" ;;
    esac
    shift 2
  done
}

validate_identifier() {
  local label="$1"
  local identifier="$2"

  [[ "${identifier}" =~ ^[a-z][a-z0-9_]*$ ]] ||
    fail "${label} must be a lowercase PostgreSQL identifier"
}

validate_configuration() {
  [[ -n "${endpoint}" ]] || fail "--endpoint is required"
  [[ -n "${master_user}" ]] || fail "--master-user is required"
  [[ -n "${prod_database}" ]] || fail "--prod-database is required"
  [[ -n "${dev_database}" ]] || fail "--dev-database is required"
  [[ -n "${prod_user}" ]] || fail "--prod-user is required"
  [[ -n "${dev_user}" ]] || fail "--dev-user is required"
  [[ -n "${PGPASSWORD:-}" ]] || fail "PGPASSWORD must contain the master password"

  validate_identifier "maintenance database" "${maintenance_database}"
  validate_identifier "production database" "${prod_database}"
  validate_identifier "development database" "${dev_database}"
  validate_identifier "master user" "${master_user}"
  validate_identifier "production user" "${prod_user}"
  validate_identifier "development user" "${dev_user}"

  [[ "${prod_database}" != "${dev_database}" ]] ||
    fail "production and development database names must be distinct"
  [[ "${prod_user}" != "${dev_user}" ]] ||
    fail "production and development users must be distinct"
}

provision_databases() {
  local psql_bin="${PSQL_BIN:-psql}"
  local database_host="${endpoint%:*}"
  local database_port="5432"

  if [[ "${endpoint}" == *:* ]]; then
    database_port="${endpoint##*:}"
  fi
  command -v "${psql_bin}" >/dev/null 2>&1 || fail "psql is required"

  PGCONNECT_TIMEOUT=10 PGOPTIONS="-c statement_timeout=30000" \
    "${psql_bin}" \
    --no-psqlrc \
    --set ON_ERROR_STOP=1 \
    --host "${database_host}" \
    --port "${database_port}" \
    --username "${master_user}" \
    --dbname "${maintenance_database}" \
    --set "prod_database=${prod_database}" \
    --set "dev_database=${dev_database}" \
    --set "prod_user=${prod_user}" \
    --set "dev_user=${dev_user}" \
    --file "${script_directory}/provision_environment_databases.sql"
}

main() {
  parse_arguments "$@"
  validate_configuration
  log_event "database-provisioning" "started" "valid configuration"
  provision_databases
  log_event "database-provisioning" "success" "environment databases and grants are ready"
}

main "$@"
