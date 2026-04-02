#!/usr/bin/env bash
set -euo pipefail

echo "[launch-gate] Step 1/3: quality + security + env strict"
npm run launch:check

echo "[launch-gate] Step 2/3: staging dry-run env validation"
: "${STAGING_BASE_URL:?STAGING_BASE_URL is required}"
: "${STAGING_TRACKING_API_KEY:?STAGING_TRACKING_API_KEY is required}"
: "${STAGING_REFERRAL_CODE:?STAGING_REFERRAL_CODE is required}"

echo "[launch-gate] Step 3/3: staging dry-run execution"
npm run staging:dry-run

echo "[launch-gate] ✅ Launch gate passed"
