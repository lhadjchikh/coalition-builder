#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
pr_workflow="${repository_root}/.github/workflows/osv_scanner_pr.yml"
scheduled_workflow="${repository_root}/.github/workflows/osv_scanner_scheduled.yml"
osv_action_revision="8deb546fdb875b9996d27d4950be7312dac076a1"

fail() {
  printf 'stage=osv-workflow-test outcome=failure message=%q\n' "$1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "${path}" ]] || fail "expected ${path} to exist"
}

require_text() {
  local path="$1"
  local expected="$2"
  grep -Fq -- "${expected}" "${path}" || fail "expected ${path} to contain: ${expected}"
}

reject_text() {
  local path="$1"
  local rejected="$2"
  if grep -Fq -- "${rejected}" "${path}"; then
    fail "expected ${path} not to contain: ${rejected}"
  fi
}

require_scan_targets() {
  local path="$1"
  require_text "${path}" "--lockfile=./backend/poetry.lock"
  require_text "${path}" "--lockfile=./frontend/package-lock.json"
  require_text "${path}" "--lockfile=./terraform/tests/go.mod"
  reject_text "${path}" "--recursive"
}

require_file "${pr_workflow}"
require_file "${scheduled_workflow}"

require_text "${pr_workflow}" "pull_request:"
require_text "${pr_workflow}" "merge_group:"
require_text "${pr_workflow}" "osv-scanner-reusable-pr.yml@${osv_action_revision}"
require_text "${pr_workflow}" "security-events: write"
require_scan_targets "${pr_workflow}"

require_text "${scheduled_workflow}" "schedule:"
require_text "${scheduled_workflow}" "workflow_dispatch:"
require_text "${scheduled_workflow}" "osv-scanner-reusable.yml@${osv_action_revision}"
require_text "${scheduled_workflow}" "security-events: write"
require_text "${scheduled_workflow}" "fail-on-vuln: false"
require_scan_targets "${scheduled_workflow}"

printf 'stage=osv-workflow-test outcome=success\n'
