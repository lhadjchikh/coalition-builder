#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
lambda_workflow="${repository_root}/.github/workflows/deploy_lambda.yml"
frontend_workflow="${repository_root}/.github/workflows/deploy_frontend.yml"
management_workflow="${repository_root}/.github/workflows/lambda_management.yml"
terraform_workflow="${repository_root}/.github/workflows/deploy_terraform_environment.yml"
shellcheck_workflow="${repository_root}/.github/workflows/lint_shellcheck.yml"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "${path}" ]] || fail "expected ${path} to exist"
}

require_absent_file() {
  local path="$1"
  [[ ! -e "${path}" ]] || fail "expected retired workflow ${path} to be absent"
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

  if ! actual_count="$(grep -Fc -- "${expected}" "${path}")"; then
    actual_count=0
  fi
  [[ "${actual_count}" -eq "${expected_count}" ]] ||
    fail "expected ${path} to contain ${expected_count} occurrences of: ${expected}"
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
  grep -Fq -- "${expected}" <<<"${step_text}" || fail "expected ${step_name} step in ${path} to contain: ${expected}"
}

reject_text() {
  local path="$1"
  local rejected="$2"
  if grep -Fq -- "${rejected}" "${path}"; then
    fail "expected ${path} not to contain: ${rejected}"
  fi
}

require_file "${lambda_workflow}"
require_file "${frontend_workflow}"
require_file "${management_workflow}"
require_file "${terraform_workflow}"
require_file "${shellcheck_workflow}"
require_absent_file "${repository_root}/.github/workflows/deploy_app.yml"
require_absent_file "${repository_root}/.github/workflows/deploy_serverless.yml"

require_text "${lambda_workflow}" '      - "backend/**"'
require_text "${lambda_workflow}" 'group: deploy-lambda-'
require_text "${lambda_workflow}" "cancel-in-progress: false"
require_text "${lambda_workflow}" "poetry install --no-interaction --no-ansi --only main"
reject_text "${lambda_workflow}" "poetry add zappa"
require_text "${lambda_workflow}" "cloudformation describe-stacks"
require_text "${lambda_workflow}" "createcachetable"
require_text "${lambda_workflow}" "migrate --noinput"
require_text "${lambda_workflow}" "collectstatic --noinput"
require_text "${lambda_workflow}" "--connect-timeout 5"
require_text "${lambda_workflow}" "--max-time 15"
require_text "${lambda_workflow}" "\${DEPLOYMENT_API_URL%/}/api/health/"

require_text "${frontend_workflow}" 'group: deploy-frontend-'
require_text "${frontend_workflow}" "cancel-in-progress: false"
require_text "${frontend_workflow}" "github.event.pull_request.user.login != 'dependabot[bot]'"
require_text "${frontend_workflow}" "SITE_URL=\"\${{ vars.DEVELOPMENT_SITE_URL || vars.PRODUCTION_SITE_URL }}\""
require_step_text "${frontend_workflow}" "Build Project Artifacts" "CLOUDFRONT_DOMAIN: \${{ vars.CLOUDFRONT_DOMAIN }}"

require_text "${management_workflow}" "role-to-assume:"
reject_text "${management_workflow}" "aws-access-key-id:"
reject_text "${management_workflow}" "aws-secret-access-key:"
require_text "${management_workflow}" "scripts/configure_zappa.py"

require_text "${terraform_workflow}" "TF_VAR_create_new_key_pair: \${{ vars.CREATE_NEW_KEY_PAIR }}"
require_text "${terraform_workflow}" "validate_terraform_environment_variables.sh"
require_text_occurrences \
  "${shellcheck_workflow}" \
  '".github/workflows/deploy_terraform_environment.yml"' \
  2

echo "Deployment workflow regression tests passed."
