#!/usr/bin/env bash

set -euo pipefail

environment_name="${1:?environment is required}"
expected_stored_digest="${2:?expected stored digest is required}"
expected_state_digest="${3:?expected state digest is required}"

readonly region="us-east-1"
readonly lock_table="coalition-terraform-locks"
readonly correlation_id="github-run-${GITHUB_RUN_ID:-unknown}-${GITHUB_RUN_ATTEMPT:-0}"
readonly runner_temp="${RUNNER_TEMP:?RUNNER_TEMP is required}"

log_repair_outcome() {
  local stage="$1"
  local outcome="$2"
  local detail="$3"

  echo "stage=${stage} correlation=${correlation_id} outcome=${outcome} ${detail}"
}

require_lowercase_md5() {
  local digest_name="$1"
  local digest="$2"

  if [[ ! "${digest}" =~ ^[0-9a-f]{32}$ ]]; then
    log_repair_outcome "input-validation" "failure" "error=invalid-${digest_name}"
    return 1
  fi
}

release_state_lock() {
  local exit_status="$?"
  trap - EXIT

  if aws dynamodb delete-item \
    --table-name "${lock_table}" \
    --region "${region}" \
    --key "${state_lock_key}" \
    --condition-expression "#info = :repair_info" \
    --expression-attribute-names '{"#info":"Info"}' \
    --expression-attribute-values "${repair_info_expression}" >/dev/null; then
    log_repair_outcome "lock-release" "success" "environment=${environment_name}"
  else
    log_repair_outcome "lock-release" "failure" "environment=${environment_name} error=conditional-delete-failed"
    exit 1
  fi

  exit "${exit_status}"
}

require_lowercase_md5 "stored-digest" "${expected_stored_digest}"
require_lowercase_md5 "state-digest" "${expected_state_digest}"

account_id="$(aws sts get-caller-identity --query Account --output text)"
readonly account_id
readonly state_bucket="coalition-terraform-state-${account_id}"
readonly state_key="${environment_name}/terraform.tfstate"
readonly state_lock_id="${state_bucket}/${state_key}"
readonly digest_item_id="${state_lock_id}-md5"
readonly state_file="${runner_temp}/${environment_name}-terraform-state.json"
repair_info="$(jq -cn \
  --arg id "${correlation_id}" \
  --arg operation "state-digest-repair" \
  --arg who "github-actions" \
  --arg path "${state_lock_id}" \
  '{ID: $id, Operation: $operation, Who: $who, Path: $path}')"
readonly repair_info
state_lock_key="$(jq -cn --arg lock_id "${state_lock_id}" '{LockID: {S: $lock_id}}')"
readonly state_lock_key
state_lock_item="$(jq -cn \
  --arg lock_id "${state_lock_id}" \
  --arg repair_info "${repair_info}" \
  '{LockID: {S: $lock_id}, Info: {S: $repair_info}}')"
readonly state_lock_item
repair_info_expression="$(jq -cn --arg repair_info "${repair_info}" '{":repair_info": {S: $repair_info}}')"
readonly repair_info_expression

aws dynamodb put-item \
  --table-name "${lock_table}" \
  --region "${region}" \
  --item "${state_lock_item}" \
  --condition-expression "attribute_not_exists(#lock_id)" \
  --expression-attribute-names '{"#lock_id":"LockID"}' >/dev/null
trap release_state_lock EXIT
log_repair_outcome "lock-acquisition" "success" "environment=${environment_name}"

state_object_metadata="$(aws s3api get-object \
  --bucket "${state_bucket}" \
  --key "${state_key}" \
  --region "${region}" \
  "${state_file}")"
downloaded_version_id="$(jq -er '.VersionId' <<<"${state_object_metadata}")"
readonly downloaded_version_id

if ! jq -e '
  type == "object" and
  (.version | type == "number") and
  (.serial | type == "number") and
  (.lineage | type == "string" and length > 0) and
  (.resources | type == "array")
' "${state_file}" >/dev/null; then
  log_repair_outcome "state-validation" "failure" "environment=${environment_name} error=invalid-terraform-state"
  exit 1
fi

calculated_state_digest="$(md5sum "${state_file}" | awk '{print $1}')"
readonly calculated_state_digest
if [[ "${calculated_state_digest}" != "${expected_state_digest}" ]]; then
  log_repair_outcome "state-validation" "failure" "environment=${environment_name} error=unexpected-state-digest"
  exit 1
fi

current_version_id="$(aws s3api head-object \
  --bucket "${state_bucket}" \
  --key "${state_key}" \
  --region "${region}" \
  --query VersionId \
  --output text)"
readonly current_version_id
if [[ "${current_version_id}" != "${downloaded_version_id}" ]]; then
  log_repair_outcome "state-validation" "failure" "environment=${environment_name} error=state-changed-during-validation"
  exit 1
fi

digest_item_key="$(jq -cn --arg lock_id "${digest_item_id}" '{LockID: {S: $lock_id}}')"
readonly digest_item_key
stored_digest_item="$(aws dynamodb get-item \
  --table-name "${lock_table}" \
  --region "${region}" \
  --consistent-read \
  --key "${digest_item_key}")"
stored_digest="$(jq -er '.Item.Digest.S' <<<"${stored_digest_item}")"
readonly stored_digest
if [[ "${stored_digest}" != "${expected_stored_digest}" ]]; then
  log_repair_outcome "digest-validation" "failure" "environment=${environment_name} error=unexpected-stored-digest"
  exit 1
fi

replacement_digest_item="$(jq -cn \
  --arg lock_id "${digest_item_id}" \
  --arg digest "${calculated_state_digest}" \
  '{LockID: {S: $lock_id}, Digest: {S: $digest}}')"
readonly replacement_digest_item
expected_digest_expression="$(jq -cn \
  --arg digest "${expected_stored_digest}" \
  '{":expected_digest": {S: $digest}}')"
readonly expected_digest_expression

aws dynamodb put-item \
  --table-name "${lock_table}" \
  --region "${region}" \
  --item "${replacement_digest_item}" \
  --condition-expression "#digest = :expected_digest" \
  --expression-attribute-names '{"#digest":"Digest"}' \
  --expression-attribute-values "${expected_digest_expression}" >/dev/null

confirmed_digest_item="$(aws dynamodb get-item \
  --table-name "${lock_table}" \
  --region "${region}" \
  --consistent-read \
  --key "${digest_item_key}")"
confirmed_digest="$(jq -er '.Item.Digest.S' <<<"${confirmed_digest_item}")"
readonly confirmed_digest
if [[ "${confirmed_digest}" != "${calculated_state_digest}" ]]; then
  log_repair_outcome "digest-repair" "failure" "environment=${environment_name} error=confirmation-mismatch"
  exit 1
fi

log_repair_outcome "digest-repair" "success" "environment=${environment_name} state_version=${downloaded_version_id}"
