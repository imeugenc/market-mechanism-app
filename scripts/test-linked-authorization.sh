#!/usr/bin/env bash
set -euo pipefail

libpq_bin="/opt/homebrew/opt/libpq/bin"
credential_file="$(mktemp)"

cleanup() {
  rm -f "${credential_file}"
}
trap cleanup EXIT

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

"${libpq_bin}/psql" \
  --no-psqlrc \
  --quiet \
  --file="supabase/tests/024_authorization_hardening.sql"
