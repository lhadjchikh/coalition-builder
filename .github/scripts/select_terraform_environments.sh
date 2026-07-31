#!/usr/bin/env bash

set -euo pipefail

readonly CORRELATION_ID="github-run-${GITHUB_RUN_ID:-local}"

fail_selection() {
  local error_class="$1"
  local message="$2"

  printf 'stage=environment-selection correlation=%s outcome=failure error_class=%s message=%q\n' \
    "${CORRELATION_ID}" "${error_class}" "${message}" >&2
  exit 1
}

emit_selected_environments() {
  local json='['
  local separator=''
  local environment

  for environment in "$@"; do
    json+="${separator}\"${environment}\""
    separator=','
  done

  printf '%s]\n' "${json}"
}

select_manual_environment() {
  local requested_environment="$1"

  case "${requested_environment}" in
    shared | prod | dev) ;;
    *)
      fail_selection 'InvalidEnvironment' \
        "workflow_dispatch environment must be shared, prod, or dev"
      ;;
  esac

  emit_selected_environments "${requested_environment}"
}

classify_terraform_change() {
  local changed_path="$1"

  case "${changed_path}" in
    terraform/*.md) printf 'none\n' ;;
    terraform/environments/shared/*) printf 'shared\n' ;;
    terraform/environments/prod/*) printf 'prod\n' ;;
    terraform/environments/dev/*) printf 'dev\n' ;;
    terraform/modules/* | terraform/scripts/setup_remote_state.sh)
      printf 'all\n'
      ;;
    *) printf 'none\n' ;;
  esac
}

select_push_environments() {
  local shared_changed=false
  local prod_changed=false
  local dev_changed=false
  local common_configuration_changed=false
  local changed_path
  local change_scope

  for changed_path in "$@"; do
    change_scope="$(classify_terraform_change "${changed_path}")"
    case "${change_scope}" in
      shared)
        shared_changed=true
        ;;
      prod)
        prod_changed=true
        ;;
      dev)
        dev_changed=true
        ;;
      all)
        common_configuration_changed=true
        ;;
    esac
  done

  if [[ "${common_configuration_changed}" == 'true' ]]; then
    shared_changed=true
    prod_changed=true
    dev_changed=true
  fi

  local selected_environments=()
  if [[ "${shared_changed}" == 'true' ]]; then
    selected_environments+=(shared)
  fi
  if [[ "${prod_changed}" == 'true' ]]; then
    selected_environments+=(prod)
  fi
  if [[ "${dev_changed}" == 'true' ]]; then
    selected_environments+=(dev)
  fi
  if [[ "${shared_changed}" == 'false' && \
    "${prod_changed}" == 'false' && \
    "${dev_changed}" == 'false' ]]; then
    emit_selected_environments
  else
    emit_selected_environments "${selected_environments[@]}"
  fi
}

main() {
  if (( $# == 0 )); then
    fail_selection 'MissingEvent' 'GitHub event name is required'
  fi

  local event_name="$1"
  local requested_environment="${2:-}"
  shift
  if (( $# > 0 )); then
    shift
  fi

  case "${event_name}" in
    workflow_dispatch)
      select_manual_environment "${requested_environment}"
      ;;
    pull_request)
      printf '["dev"]\n'
      ;;
    push)
      select_push_environments "$@"
      ;;
    *)
      fail_selection 'UnsupportedEvent' "unsupported GitHub event: ${event_name}"
      ;;
  esac
}

main "$@"
