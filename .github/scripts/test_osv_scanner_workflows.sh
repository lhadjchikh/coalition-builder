#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
pr_workflow="${repository_root}/.github/workflows/osv_scanner_pr.yml"
merge_group_workflow="${repository_root}/.github/workflows/osv_scanner_merge_group.yml"
comparison_workflow="${repository_root}/.github/workflows/osv_scanner_compare.yml"
scheduled_workflow="${repository_root}/.github/workflows/osv_scanner_scheduled.yml"
results_validator="${repository_root}/.github/scripts/validate_osv_results.sh"
osv_scanner_revision="06b2ab4348248b456ee06c9e953637f55e03504f"
artifact_upload_revision="bbbca2ddaa5d8feaa63e36b76fdaad77386f024f"
sarif_upload_revision="cdefb33c0f6224e58673d9004f47f7cb3e328b89"

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

require_text_occurrences() {
  local path="$1"
  local expected="$2"
  local expected_count="$3"
  local actual_count

  actual_count="$(grep -Fc -- "${expected}" "${path}" || true)"
  [[ "${actual_count}" -eq "${expected_count}" ]] ||
    fail "expected ${path} to contain ${expected_count} occurrences of: ${expected}"
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

require_step_text() {
  local path="$1"
  local step_name="$2"
  local expected="$3"
  local step_text

  step_text="$(awk -v heading="      - name: ${step_name}" '
    $0 == heading { in_step = 1 }
    in_step && $0 != heading && /^      - name:/ { exit }
    in_step { print }
  ' "${path}")"
  grep -Fq -- "${expected}" <<<"${step_text}" ||
    fail "expected ${step_name} step in ${path} to contain: ${expected}"
}

require_comparison_scan_order() {
  local path="$1"

  awk '
    $0 == "      - name: Checkout comparison base" && next_stage == 0 { next_stage = 1; next }
    $0 == "      - name: Remove existing result file" && next_stage == 1 { next_stage = 2; next }
    $0 == "      - name: Scan existing dependencies" && next_stage == 2 { next_stage = 3; next }
    $0 == "      - name: Validate existing scan results" && next_stage == 3 { next_stage = 4; next }
    $0 == "      - name: Preserve validated baseline" && next_stage == 4 { next_stage = 5; next }
    $0 == "      - name: Checkout proposed revision" && next_stage == 5 { next_stage = 6; next }
    $0 == "      - name: Remove proposed result file" && next_stage == 6 { next_stage = 7; next }
    $0 == "      - name: Scan proposed dependencies" && next_stage == 7 { next_stage = 8; next }
    $0 == "      - name: Validate proposed scan results" && next_stage == 8 { next_stage = 9; next }
    $0 == "      - name: Restore validated baseline" && next_stage == 9 { next_stage = 10; next }
    $0 == "      - name: Reject newly introduced vulnerabilities" && next_stage == 10 { next_stage = 11; next }
    END { exit next_stage == 11 ? 0 : 1 }
  ' "${path}" || fail "expected ${path} to scan base before proposed revision"
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
require_file "${comparison_workflow}"
require_file "${scheduled_workflow}"
require_file "${results_validator}"

require_text "${pr_workflow}" "pull_request:"
require_job_text "${pr_workflow}" "scan_pr" "uses: ./.github/workflows/osv_scanner_compare.yml"
require_job_text "${pr_workflow}" "scan_pr" "base_sha: \${{ github.event.pull_request.base.sha }}"
require_job_text "${pr_workflow}" "scan_pr" "head_sha: \${{ github.sha }}"
reject_text "${pr_workflow}" "merge_group:"

require_text "${merge_group_workflow}" "merge_group:"
require_job_text "${merge_group_workflow}" "scan_merge_group" "uses: ./.github/workflows/osv_scanner_compare.yml"
require_job_text "${merge_group_workflow}" "scan_merge_group" "base_sha: \${{ github.event.merge_group.base_sha }}"
require_job_text "${merge_group_workflow}" "scan_merge_group" "head_sha: \${{ github.sha }}"

require_text "${comparison_workflow}" "workflow_call:"
require_job_text "${comparison_workflow}" "osv_scan" "name: osv-scan"
require_job_text "${comparison_workflow}" "osv_scan" "osv-scanner-action@${osv_scanner_revision}"
require_job_text "${comparison_workflow}" "osv_scan" "osv-reporter-action@${osv_scanner_revision}"
require_job_text "${comparison_workflow}" "osv_scan" "--output=old-results.json"
require_job_text "${comparison_workflow}" "osv_scan" "--output=new-results.json"
require_job_text "${comparison_workflow}" "osv_scan" "--old=old-results.json"
require_job_text "${comparison_workflow}" "osv_scan" "--new=new-results.json"
require_step_text "${comparison_workflow}" "Checkout comparison base" "BASE_SHA: \${{ inputs.base_sha }}"
require_step_text "${comparison_workflow}" "Checkout comparison base" "git checkout --force --detach \"\${BASE_SHA}\""
require_step_text "${comparison_workflow}" "Remove existing result file" "rm -f -- old-results.json"
require_step_text "${comparison_workflow}" "Scan existing dependencies" "--output=old-results.json"
require_step_text "${comparison_workflow}" "Validate existing scan results" "OSV_RESULTS_FILE: old-results.json"
require_step_text "${comparison_workflow}" "Preserve validated baseline" "install -m 0600 old-results.json \"\${RUNNER_TEMP}/old-results.json\""
require_step_text "${comparison_workflow}" "Checkout proposed revision" "HEAD_SHA: \${{ inputs.head_sha }}"
require_step_text "${comparison_workflow}" "Checkout proposed revision" "git checkout --force --detach \"\${HEAD_SHA}\""
require_step_text "${comparison_workflow}" "Remove proposed result file" "rm -f -- new-results.json"
require_step_text "${comparison_workflow}" "Scan proposed dependencies" "--output=new-results.json"
require_step_text "${comparison_workflow}" "Validate proposed scan results" "OSV_RESULTS_FILE: new-results.json"
require_step_text "${comparison_workflow}" "Restore validated baseline" "rm -f -- old-results.json"
require_step_text "${comparison_workflow}" "Restore validated baseline" "install -m 0600 \"\${RUNNER_TEMP}/old-results.json\" old-results.json"
require_step_text "${comparison_workflow}" "Reject newly introduced vulnerabilities" "--old=old-results.json"
require_step_text "${comparison_workflow}" "Reject newly introduced vulnerabilities" "--new=new-results.json"
require_text_occurrences "${comparison_workflow}" 'validate_osv_results.sh' 3
require_scan_targets "${comparison_workflow}"
require_comparison_scan_order "${comparison_workflow}"

require_text "${scheduled_workflow}" "schedule:"
require_text "${scheduled_workflow}" "workflow_dispatch:"
require_job_text "${scheduled_workflow}" "scan_scheduled" "osv-scanner-action@${osv_scanner_revision}"
require_job_text "${scheduled_workflow}" "scan_scheduled" "osv-reporter-action@${osv_scanner_revision}"
require_job_text "${scheduled_workflow}" "scan_scheduled" ".github/scripts/validate_osv_results.sh"
require_step_text "${scheduled_workflow}" "Remove existing result file" "rm -f -- results.json"
require_step_text "${scheduled_workflow}" "Upload scan artifact" "actions/upload-artifact@${artifact_upload_revision}"
require_step_text "${scheduled_workflow}" "Upload scan artifact" "path: results.sarif"
require_step_text "${scheduled_workflow}" "Upload to code scanning" "github/codeql-action/upload-sarif@${sarif_upload_revision}"
require_step_text "${scheduled_workflow}" "Upload to code scanning" "sarif_file: results.sarif"
require_text "${scheduled_workflow}" "security-events: write"
require_text "${scheduled_workflow}" "--fail-on-vuln=false"
require_scan_targets "${scheduled_workflow}"

printf 'stage=osv-workflow-test outcome=success\n'
