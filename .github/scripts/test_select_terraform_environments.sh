#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIRECTORY
SELECTOR="${SCRIPT_DIRECTORY}/select_terraform_environments.sh"
readonly SELECTOR
CHANGED_PATH_LISTER="${SCRIPT_DIRECTORY}/list_terraform_changed_paths.sh"
readonly CHANGED_PATH_LISTER

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
  local rejected_command="$1"
  shift

  if "${rejected_command}" "$@" >/dev/null 2>&1; then
    printf 'Expected command to reject: %s %s\n' \
      "${rejected_command}" "$*" >&2
    return 1
  fi
}

assert_selection '["shared"]' workflow_dispatch shared
assert_selection '["prod"]' workflow_dispatch prod
assert_selection '["dev"]' workflow_dispatch dev
assert_rejected "${SELECTOR}" workflow_dispatch invalid

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
assert_selection '[]' push '' terraform/modules/database/README.md
assert_selection '[]' push '' terraform/scripts/bootstrap/test_bootstrap.sh
assert_selection '[]' push '' terraform/terraform.tfvars.example
assert_selection '[]' push '' terraform/backend.tf
assert_selection '[]' push '' terraform/main.tf
assert_selection '[]' push '' terraform/outputs.tf
assert_selection '[]' push '' terraform/variables.tf
assert_selection '[]' push '' terraform/versions.tf
assert_rejected "${SELECTOR}" schedule

RENAME_FIXTURE_REPOSITORY="$(mktemp -d "${TMPDIR:-/tmp}/terraform-environment-selection.XXXXXX")"
readonly RENAME_FIXTURE_REPOSITORY
trap 'rm -rf -- "${RENAME_FIXTURE_REPOSITORY}"' EXIT

git init --quiet "${RENAME_FIXTURE_REPOSITORY}"
git -C "${RENAME_FIXTURE_REPOSITORY}" config user.email 'terraform-selection@example.com'
git -C "${RENAME_FIXTURE_REPOSITORY}" config user.name 'Terraform Selection Test'
mkdir -p "${RENAME_FIXTURE_REPOSITORY}/terraform/environments/shared"
printf 'resource "example" "moved" {}\n' \
  >"${RENAME_FIXTURE_REPOSITORY}/terraform/environments/shared/moved.tf"
git -C "${RENAME_FIXTURE_REPOSITORY}" add .
git -C "${RENAME_FIXTURE_REPOSITORY}" commit --quiet -m 'Add shared resource'
shared_commit="$(git -C "${RENAME_FIXTURE_REPOSITORY}" rev-parse HEAD)"
readonly shared_commit

mkdir -p "${RENAME_FIXTURE_REPOSITORY}/terraform/environments/prod"
git -C "${RENAME_FIXTURE_REPOSITORY}" mv \
  terraform/environments/shared/moved.tf \
  terraform/environments/prod/moved.tf
git -C "${RENAME_FIXTURE_REPOSITORY}" commit --quiet -m 'Move resource to prod'
prod_commit="$(git -C "${RENAME_FIXTURE_REPOSITORY}" rev-parse HEAD)"
readonly prod_commit

actual_changed_paths="$(
  cd "${RENAME_FIXTURE_REPOSITORY}"
  "${CHANGED_PATH_LISTER}" "${shared_commit}" "${prod_commit}"
)"
expected_changed_paths=$'terraform/environments/prod/moved.tf\nterraform/environments/shared/moved.tf'
if [[ "${actual_changed_paths}" != "${expected_changed_paths}" ]]; then
  printf 'Expected changed paths %q, got %q\n' \
    "${expected_changed_paths}" "${actual_changed_paths}" >&2
  exit 1
fi

(
  cd "${RENAME_FIXTURE_REPOSITORY}"
  assert_rejected "${CHANGED_PATH_LISTER}" \
    '0000000000000000000000000000000000000000' "${prod_commit}"
  assert_rejected "${CHANGED_PATH_LISTER}" \
    '1111111111111111111111111111111111111111' "${prod_commit}"
)

printf 'Terraform deployment environment selection tests passed.\n'
