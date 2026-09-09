#!/usr/bin/env bash
set -euo pipefail

backup_label="${1:-pre-change}"
backup_dir="backups"
libpq_bin="/opt/homebrew/opt/libpq/bin"
credential_file="$(mktemp)"

cleanup() {
  rm -f "${credential_file}"
}
trap cleanup EXIT

if [[ ! -x "${libpq_bin}/pg_dump" ]]; then
  echo "pg_dump was not found at ${libpq_bin}/pg_dump" >&2
  exit 1
fi

mkdir -p "${backup_dir}"
chmod 700 "${backup_dir}"

npx supabase db dump --linked --dry-run > "${credential_file}"
chmod 600 "${credential_file}"

read_value() {
  local variable_name="$1"
  awk -F'"' -v key="${variable_name}" '$0 ~ "^export " key "=" { print $2; exit }' "${credential_file}"
}

export PGHOST="$(read_value PGHOST)"
export PGPORT="$(read_value PGPORT)"
export PGUSER="$(read_value PGUSER)"
export PGPASSWORD="$(read_value PGPASSWORD)"
export PGDATABASE="$(read_value PGDATABASE)"

if [[ -z "${PGHOST}" || -z "${PGUSER}" || -z "${PGPASSWORD}" ]]; then
  echo "Supabase did not return temporary backup credentials." >&2
  exit 1
fi

schema_file="${backup_dir}/marketmechanism-${backup_label}-schema.sql"
data_file="${backup_dir}/marketmechanism-${backup_label}-data.sql"

"${libpq_bin}/pg_dump" \
  --schema=public \
  --schema-only \
  --quote-all-identifiers \
  --role=postgres \
  --file="${schema_file}"

"${libpq_bin}/pg_dump" \
  --schema=public \
  --data-only \
  --quote-all-identifiers \
  --role=postgres \
  --file="${data_file}"

chmod 600 "${schema_file}" "${data_file}"

echo "Schema backup: ${schema_file}"
echo "Data backup: ${data_file}"
