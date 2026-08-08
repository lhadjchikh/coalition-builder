#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
pr_workflow="${repository_root}/.github/workflows/osv_scanner_pr.yml"
merge_group_workflow="${repository_root}/.github/workflows/osv_scanner_merge_group.yml"
scheduled_workflow="${repository_root}/.github/workflows/osv_scanner_scheduled.yml"
osv_action_revision="8deb546fdb875b9996d27d4950be7312dac076a1"
osv_scanner_revision="06b2ab4348248b456ee06c9e953637f55e03504f"

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

require_job_text() {
  local path="$1"
  local job_name="$2"
  local expected="$3"
  local job_text

  job_text="$(awk -v heading="  ${job_name}:" '
    $0 == heading { in_job = 1 }
    in_job && $0 != heading && /^  [[:alnum:]_]+:/ { exit }
    in_job { print }
  ' "${path}")"
  grep -Fq -- "${expected}" <<<"${job_text}" ||
    fail "expected ${job_name} job in ${path} to contain: ${expected}"
}

require_merge_group_scan_order() {
  local path="$1"

  awk '
    $0 == "      - name: Checkout merge group base" && next_stage == 0 { next_stage = 1; next }
    $0 == "      - name: Scan existing dependencies" && next_stage == 1 { next_stage = 2; next }
    $0 == "      - name: Checkout merge group head" && next_stage == 2 { next_stage = 3; next }
    $0 == "      - name: Scan proposed dependencies" && next_stage == 3 { next_stage = 4; next }
    END { exit next_stage == 4 ? 0 : 1 }
  ' "${path}" || fail "expected ${path} to scan base before merge group head"
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
require_file "${merge_group_workflow}"
require_file "${scheduled_workflow}"

require_text "${pr_workflow}" "pull_request:"
require_text "${pr_workflow}" "osv-scanner-reusable-pr.yml@${osv_action_revision}"
require_text "${pr_workflow}" "security-events: write"
reject_text "${pr_workflow}" "merge_group:"
require_scan_targets "${pr_workflow}"

require_text "${merge_group_workflow}" "merge_group:"
require_job_text "${merge_group_workflow}" "scan_merge_group" "name: Reject newly introduced dependency vulnerabilities / osv-scan"
require_job_text "${merge_group_workflow}" "scan_merge_group" "BASE_SHA: \${{ github.event.merge_group.base_sha }}"
require_job_text "${merge_group_workflow}" "scan_merge_group" "git checkout --force --detach \"\${BASE_SHA}\""
require_job_text "${merge_group_workflow}" "scan_merge_group" "HEAD_SHA: \${{ github.sha }}"
require_job_text "${merge_group_workflow}" "scan_merge_group" "git checkout --force --detach \"\${HEAD_SHA}\""
require_job_text "${merge_group_workflow}" "scan_merge_group" "osv-scanner-action@${osv_scanner_revision}"
require_job_text "${merge_group_workflow}" "scan_merge_group" "osv-reporter-action@${osv_scanner_revision}"
require_job_text "${merge_group_workflow}" "scan_merge_group" "--old=old-results.json"
require_job_text "${merge_group_workflow}" "scan_merge_group" "--new=new-results.json"
require_scan_targets "${merge_group_workflow}"
require_merge_group_scan_order "${merge_group_workflow}"

require_text "${scheduled_workflow}" "schedule:"
require_text "${scheduled_workflow}" "workflow_dispatch:"
require_text "${scheduled_workflow}" "osv-scanner-reusable.yml@${osv_action_revision}"
require_text "${scheduled_workflow}" "security-events: write"
require_text "${scheduled_workflow}" "fail-on-vuln: false"
require_scan_targets "${scheduled_workflow}"

printf 'stage=osv-workflow-test outcome=success\n'
