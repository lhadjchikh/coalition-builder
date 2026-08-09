#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIRECTORY
readonly VALIDATOR="${SCRIPT_DIRECTORY}/validate_terraform_environment_variables.sh"

shared_environment=(
  AWS_ACCOUNT_ID=123456789012
  TF_VAR_prefix=example-app
  TF_VAR_db_username=platform_admin
  TF_VAR_db_password=test-password
  TF_VAR_app_db_username=application_user
  TF_VAR_bastion_public_key=ssh-rsa-placeholder
  TF_VAR_bastion_key_name=example-bastion
  TF_VAR_create_new_key_pair=true
  TF_VAR_allowed_bastion_cidrs='["192.0.2.0/24"]'
  TF_VAR_allowed_lambda_cidrs='["198.51.100.0/24"]'
  TF_VAR_alert_email=alerts@example.invalid
  TF_VAR_domain_name=example.invalid
  TF_VAR_github_repo=example-org/example-repository
  GITHUB_REPOSITORY=example-org/example-repository
)

assert_shared_configuration_is_accepted() {
  env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${shared_environment[@]}" \
    "${VALIDATOR}" shared >/dev/null
}

assert_existing_key_configuration_is_accepted() {
  env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${shared_environment[@]}" \
    TF_VAR_create_new_key_pair=false \
    TF_VAR_bastion_public_key= \
    "${VALIDATOR}" shared >/dev/null
}

assert_missing_variable_is_rejected() {
  local rejected_variable="$1"
  local variables=()
  local assignment

  for assignment in "${shared_environment[@]}"; do
    if [[ "${assignment}" != "${rejected_variable}="* ]]; then
      variables+=("${assignment}")
    fi
  done

  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${variables[@]}" \
    "${VALIDATOR}" shared >/dev/null 2>&1; then
    printf 'Expected shared validation to reject missing %s\n' \
      "${rejected_variable}" >&2
    return 1
  fi
}

assert_all_shared_variables_are_required() {
  local assignment

  for assignment in "${shared_environment[@]}"; do
    assert_missing_variable_is_rejected "${assignment%%=*}"
  done
}

assert_empty_network_boundary_is_rejected() {
  local network_variable="$1"

  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${shared_environment[@]}" \
    "${network_variable}=[]" \
    "${VALIDATOR}" shared >/dev/null 2>&1; then
    printf 'Expected shared validation to reject empty %s\n' \
      "${network_variable}" >&2
    return 1
  fi
}

assert_empty_network_boundaries_are_rejected() {
  local assignment
  local variable_name

  for assignment in "${shared_environment[@]}"; do
    variable_name="${assignment%%=*}"
    if [[ "${variable_name}" == TF_VAR_allowed_*_cidrs ]]; then
      assert_empty_network_boundary_is_rejected "${variable_name}"
    fi
  done
}

assert_repository_identity_mismatch_is_rejected() {
  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${shared_environment[@]}" \
    TF_VAR_github_repo=another-owner/another-repository \
    "${VALIDATOR}" shared >/dev/null 2>&1; then
    printf 'Expected shared validation to reject a repository identity mismatch\n' >&2
    return 1
  fi
}

application_environment=(
  AWS_ACCOUNT_ID=123456789012
  TF_VAR_prefix=example-app
  TF_VAR_enable_api_custom_domain=true
)

assert_application_configuration_is_accepted() {
  local environment="$1"

  if [[ "${environment}" == dev ]]; then
    env -i PATH="${PATH}" GITHUB_RUN_ID=test \
      "${application_environment[@]}" \
      TF_VAR_database_isolation_ready=true \
      "${VALIDATOR}" "${environment}" >/dev/null
    return
  fi

  env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${application_environment[@]}" \
    "${VALIDATOR}" "${environment}" >/dev/null
}

assert_dev_database_isolation_gate_is_enforced() {
  local readiness

  for readiness in "" false; do
    if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
      "${application_environment[@]}" \
      TF_VAR_database_isolation_ready="${readiness}" \
      "${VALIDATOR}" dev >/dev/null 2>&1; then
      printf 'Expected dev validation to require TF_VAR_database_isolation_ready=true\n' >&2
      return 1
    fi
  done
}

# Terraform discovers the API Gateway id by name, so this flag is the only thing
# standing between a deployment and destroying the live custom domain. An unset
# or misspelled value must stop the deployment rather than read as "false".
assert_custom_domain_flag_is_required() {
  local environment="$1"

  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    AWS_ACCOUNT_ID=123456789012 \
    TF_VAR_prefix=example-app \
    "${VALIDATOR}" "${environment}" >/dev/null 2>&1; then
    printf 'Expected %s validation to reject a missing TF_VAR_enable_api_custom_domain\n' \
      "${environment}" >&2
    return 1
  fi
}

assert_non_boolean_custom_domain_flag_is_rejected() {
  local environment="$1"

  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    AWS_ACCOUNT_ID=123456789012 \
    TF_VAR_prefix=example-app \
    TF_VAR_enable_api_custom_domain=yes \
    "${VALIDATOR}" "${environment}" >/dev/null 2>&1; then
    printf 'Expected %s validation to reject a non-boolean TF_VAR_enable_api_custom_domain\n' \
      "${environment}" >&2
    return 1
  fi
}

# The shared account holds no API Gateway, so the custom domain flag is none of
# its business — it must neither be required there nor validated there.
assert_shared_environment_ignores_the_custom_domain_flag() {
  env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${shared_environment[@]}" \
    TF_VAR_enable_api_custom_domain=not-a-boolean \
    "${VALIDATOR}" shared >/dev/null
}

assert_unknown_environment_is_rejected() {
  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    "${application_environment[@]}" \
    "${VALIDATOR}" unknown >/dev/null 2>&1; then
    printf 'Expected validation to reject an unknown environment\n' >&2
    return 1
  fi
}

assert_shared_configuration_is_accepted
assert_existing_key_configuration_is_accepted
assert_all_shared_variables_are_required
assert_empty_network_boundaries_are_rejected
assert_repository_identity_mismatch_is_rejected
assert_shared_environment_ignores_the_custom_domain_flag
assert_dev_database_isolation_gate_is_enforced

for application_environment_name in prod dev; do
  assert_application_configuration_is_accepted "${application_environment_name}"
  assert_custom_domain_flag_is_required "${application_environment_name}"
  assert_non_boolean_custom_domain_flag_is_rejected "${application_environment_name}"
done

assert_unknown_environment_is_rejected

printf 'Terraform deployment variable validation tests passed.\n'
