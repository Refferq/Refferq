#!/usr/bin/env bash
set -euo pipefail

load_env_defaults() {
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi

  if [[ -f .env.local ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
  fi
}

if [[ -z "${STAGING_BASE_URL:-}" || -z "${STAGING_TRACKING_API_KEY:-}" || -z "${STAGING_REFERRAL_CODE:-}" ]]; then
  load_env_defaults
fi

echo "[launch-gate] Step 1/3: quality + security + env strict"
npm run launch:check

echo "[launch-gate] Step 1.5/3: program policy strict check"
npm run launch:policy:strict

echo "[launch-gate] Step 2/3: staging dry-run env validation"
: "${STAGING_BASE_URL:?STAGING_BASE_URL is required}"
: "${STAGING_TRACKING_API_KEY:?STAGING_TRACKING_API_KEY is required}"
: "${STAGING_REFERRAL_CODE:?STAGING_REFERRAL_CODE is required}"

echo "[launch-gate] Step 3/3: staging dry-run execution"
npm run staging:dry-run

if [[ "${LAUNCH_INCLUDE_CONTRACT_SMOKE:-0}" == "1" ]]; then
  echo "[launch-gate] Step 3.5/3: staging contract smoke"
  npm run staging:contract-smoke
fi

echo "[launch-gate] ✅ Launch gate passed"
