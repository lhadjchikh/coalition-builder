#!/usr/bin/env bash

set -euo pipefail

readonly CORRELATION_ID="github-run-${GITHUB_RUN_ID:-local}"
readonly ZERO_SHA='0000000000000000000000000000000000000000'

fail_changed_path_listing() {
  local error_class="$1"
  local message="$2"

  printf 'stage=changed-path-discovery correlation=%s outcome=failure error_class=%s message=%q\n' \
    "${CORRELATION_ID}" "${error_class}" "${message}" >&2
  exit 1
}

list_changed_paths() {
  local before_sha="$1"
  local after_sha="$2"

  if [[ "${before_sha}" == "${ZERO_SHA}" ]]; then
    fail_changed_path_listing 'MissingBaseCommit' \
      'cannot select Terraform environments without a base commit'
  fi

  if ! git diff --no-renames --name-only "${before_sha}" "${after_sha}"; then
    fail_changed_path_listing 'GitDiffError' \
      "could not compare commits ${before_sha} and ${after_sha}"
  fi

  printf 'stage=changed-path-discovery correlation=%s outcome=success\n' \
    "${CORRELATION_ID}" >&2
}

main() {
  if (( $# != 2 )); then
    fail_changed_path_listing 'InvalidArguments' \
      'before and after commit SHAs are required'
  fi

  list_changed_paths "$1" "$2"
}

main "$@"
