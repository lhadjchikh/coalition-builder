#!/usr/bin/env bash

set -euo pipefail

readonly CORRELATION_ID="github-run-${GITHUB_RUN_ID:-local}"

fail_validation() {
  local error_class="$1"
  local variable_name="$2"
  local message="$3"

  printf 'stage=terraform-input-validation correlation=%s outcome=failure error_class=%s variable=%s message=%q\n' \
    "${CORRELATION_ID}" "${error_class}" "${variable_name}" "${message}" >&2
  exit 1
}

require_nonempty_variable() {
  local variable_name="$1"

  if [[ -z "${!variable_name:-}" ]]; then
    fail_validation 'MissingVariable' "${variable_name}" \
      "required deployment input is not set"
  fi
}

require_boolean_variable() {
  local variable_name="$1"

  require_nonempty_variable "${variable_name}"
  case "${!variable_name}" in
    true | false) ;;
    *)
      fail_validation 'InvalidBoolean' "${variable_name}" \
        "deployment input must be true or false"
      ;;
  esac
}

require_nonempty_string_array() {
  local variable_name="$1"

  require_nonempty_variable "${variable_name}"
  if ! jq -e \
    'type == "array" and length > 0 and all(.[]; type == "string" and length > 0)' \
    <<<"${!variable_name}" >/dev/null; then
    fail_validation 'InvalidStringArray' "${variable_name}" \
      "deployment input must be a non-empty JSON string array"
  fi
}

validate_shared_environment() {
  local required_variable
  local required_variables=(
    TF_VAR_db_username
    TF_VAR_db_password
    TF_VAR_app_db_username
    TF_VAR_bastion_public_key
    TF_VAR_bastion_key_name
    TF_VAR_alert_email
    TF_VAR_domain_name
    TF_VAR_github_repo
  )

  for required_variable in "${required_variables[@]}"; do
    require_nonempty_variable "${required_variable}"
  done

  require_boolean_variable TF_VAR_create_new_key_pair
  require_nonempty_string_array TF_VAR_allowed_bastion_cidrs
  require_nonempty_string_array TF_VAR_allowed_lambda_cidrs
}

validate_environment() {
  local environment="$1"

  require_nonempty_variable AWS_ACCOUNT_ID
  require_nonempty_variable TF_VAR_prefix

  case "${environment}" in
    shared) validate_shared_environment ;;
    prod | dev) ;;
    *)
      fail_validation 'InvalidEnvironment' environment \
        "deployment environment must be shared, prod, or dev"
      ;;
  esac
}

main() {
  if (( $# != 1 )); then
    fail_validation 'InvalidArguments' environment \
      "exactly one deployment environment is required"
  fi

  validate_environment "$1"
  printf 'stage=terraform-input-validation correlation=%s outcome=success environment=%s\n' \
    "${CORRELATION_ID}" "$1"
}

main "$@"
