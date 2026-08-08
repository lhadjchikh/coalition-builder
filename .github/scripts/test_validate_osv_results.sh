#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
validator="${repository_root}/.github/scripts/validate_osv_results.sh"
fixture_directory="$(mktemp -d)"
trap 'rm -rf -- "${fixture_directory}"' EXIT

fail() {
  printf 'stage=osv-result-validator-test outcome=failure message=%q\n' "$1" >&2
  exit 1
}

require_rejection() {
  local fixture_name="$1"
  local fixture_path="$2"

  if "${validator}" "${fixture_path}" >"${fixture_directory}/${fixture_name}.log" 2>&1; then
    fail "expected validator to reject ${fixture_name} results"
  fi
}

missing_results="${fixture_directory}/missing.json"
empty_results="${fixture_directory}/empty.json"
malformed_results="${fixture_directory}/malformed.json"
missing_array_results="${fixture_directory}/missing-array.json"
wrong_type_results="${fixture_directory}/wrong-type.json"
valid_results="${fixture_directory}/valid.json"
valid_populated_results="${fixture_directory}/valid-populated.json"

touch "${empty_results}"
printf '{invalid json\n' >"${malformed_results}"
printf '{"metadata": {}}\n' >"${missing_array_results}"
printf '{"results": {}}\n' >"${wrong_type_results}"
printf '{"results": []}\n' >"${valid_results}"
printf '{"results": [{}]}\n' >"${valid_populated_results}"

if "${validator}" >"${fixture_directory}/missing-argument.log" 2>&1; then
  fail "expected validator to require a results path"
fi

require_rejection "missing" "${missing_results}"
require_rejection "empty" "${empty_results}"
require_rejection "malformed" "${malformed_results}"
require_rejection "missing-array" "${missing_array_results}"
require_rejection "wrong-type" "${wrong_type_results}"

"${validator}" "${valid_results}" >"${fixture_directory}/valid.log" 2>&1 ||
  fail "expected validator to accept valid results"
"${validator}" "${valid_populated_results}" >"${fixture_directory}/valid-populated.log" 2>&1 ||
  fail "expected validator to accept populated results"

printf 'stage=osv-result-validator-test outcome=success\n'
