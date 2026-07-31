#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIRECTORY
SELECTOR="${SCRIPT_DIRECTORY}/select_terraform_environments.sh"
readonly SELECTOR

assert_selection() {
  local expected_selection="$1"
  shift

  local actual_selection
  actual_selection="$("${SELECTOR}" "$@")"

  if [[ "${actual_selection}" != "${expected_selection}" ]]; then
    printf 'Expected %s, got %s for: %s\n' \
      "${expected_selection}" "${actual_selection}" "$*" >&2
    return 1
  fi
}

assert_rejected() {
  if "${SELECTOR}" "$@" >/dev/null 2>&1; then
    printf 'Expected selection to fail for: %s\n' "$*" >&2
    return 1
  fi
}

assert_selection '["shared"]' workflow_dispatch shared
assert_selection '["prod"]' workflow_dispatch prod
assert_selection '["dev"]' workflow_dispatch dev
assert_rejected workflow_dispatch invalid

assert_selection '["dev"]' pull_request

assert_selection '["shared"]' push '' terraform/environments/shared/main.tf
assert_selection '["prod"]' push '' terraform/environments/prod/main.tf
assert_selection '["dev"]' push '' terraform/environments/dev/main.tf
assert_selection '["shared","prod","dev"]' push '' \
  terraform/environments/dev/main.tf \
  terraform/environments/prod/main.tf \
  terraform/environments/shared/main.tf
assert_selection '["shared","prod","dev"]' push '' terraform/modules/networking/main.tf
assert_selection '["shared","prod","dev"]' push '' terraform/scripts/setup_remote_state.sh
assert_selection '[]' push '' .github/workflows/deploy_infra.yml
assert_selection '[]' push '' .github/workflows/deploy_terraform_environment.yml
assert_selection '[]' push '' .github/scripts/select_terraform_environments.sh
assert_selection '[]' push '' terraform/tests/modules/networking_test.go
assert_selection '[]' push '' terraform/README.md
assert_rejected schedule

printf 'Terraform deployment environment selection tests passed.\n'
