#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIRECTORY
readonly VALIDATOR="${SCRIPT_DIRECTORY}/validate_terraform_environment_variables.sh"

shared_environment=(
  AWS_ACCOUNT_ID=200363996622
  TF_VAR_prefix=landandbay
  TF_VAR_db_username=lab_admin
  TF_VAR_db_password=secret
  TF_VAR_app_db_username=coalition_app
  TF_VAR_bastion_public_key=ssh-rsa-placeholder
  TF_VAR_bastion_key_name=landandbay-bastion
  TF_VAR_create_new_key_pair=true
  TF_VAR_allowed_bastion_cidrs='["0.0.0.0/0"]'
  TF_VAR_allowed_lambda_cidrs='["10.1.3.0/24"]'
  TF_VAR_alert_email=admin@landandbay.org
  TF_VAR_domain_name=landandbay.org
  TF_VAR_github_repo=lhadjchikh/coalition-builder
  GITHUB_REPOSITORY=lhadjchikh/coalition-builder
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

assert_prod_configuration_is_accepted() {
  env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    AWS_ACCOUNT_ID=956322717133 \
    TF_VAR_prefix=landandbay \
    "${VALIDATOR}" prod >/dev/null
}

assert_unknown_environment_is_rejected() {
  if env -i PATH="${PATH}" GITHUB_RUN_ID=test \
    AWS_ACCOUNT_ID=956322717133 \
    TF_VAR_prefix=landandbay \
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
assert_prod_configuration_is_accepted
assert_unknown_environment_is_rejected

printf 'Terraform deployment variable validation tests passed.\n'
