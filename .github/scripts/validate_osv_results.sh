#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  printf 'stage=osv-result-validation correlation_id=none outcome=failure error_class=InvalidArguments\n' >&2
  exit 1
fi

results_file="$1"
correlation_id="${results_file##*/}"

if [[ ! -s "${results_file}" ]]; then
  printf 'stage=osv-result-validation correlation_id=%q outcome=failure error_class=MissingResults\n' "${correlation_id}" >&2
  exit 1
fi

if ! jq -e 'type == "object" and has("results") and (.results | type == "array")' "${results_file}" >/dev/null; then
  printf 'stage=osv-result-validation correlation_id=%q outcome=failure error_class=InvalidResults\n' "${correlation_id}" >&2
  exit 1
fi

printf 'stage=osv-result-validation correlation_id=%q outcome=success\n' "${correlation_id}"
