#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "[launch-evidence] npm is required in PATH"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

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

load_env_defaults

mkdir -p docs/studiosol/evidence
TS_UTC="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
EVIDENCE_FILE="docs/studiosol/evidence/launch-evidence-${TS_UTC}.md"

BRANCH="$(git branch --show-current 2>/dev/null || echo "unknown")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

{
  echo "# Launch Evidence Report"
  echo
  echo "- Generated (UTC): ${TS_UTC}"
  echo "- Branch: \`${BRANCH}\`"
  echo "- Commit: \`${COMMIT}\`"
  echo
} > "$EVIDENCE_FILE"

run_step() {
  local title="$1"
  local cmd="$2"

  echo "[launch-evidence] ${title}"
  {
    echo "## ${title}"
    echo
    echo "\`\`\`bash"
    echo "${cmd}"
    echo "\`\`\`"
    echo
    echo "\`\`\`text"
  } >> "$EVIDENCE_FILE"

  set +e
  local output
  output="$(bash -lc "${cmd}" 2>&1)"
  local status=$?
  set -e

  printf "%s\n" "$output" >> "$EVIDENCE_FILE"
  {
    echo "\`\`\`"
    echo
    echo "- Exit code: \`${status}\`"
    echo
  } >> "$EVIDENCE_FILE"

  if [[ $status -ne 0 ]]; then
    echo "[launch-evidence] FAILED: ${title} (exit ${status})"
    echo "[launch-evidence] Evidence file: ${EVIDENCE_FILE}"
    exit "$status"
  fi
}

run_step "Check (lint/test/build)" "npm run check"
run_step "Audit (prod deps)" "npm run audit:prod"
run_step "Env Gate (strict)" "npm run launch:env:strict"
run_step "Policy Gate (strict)" "npm run launch:policy:strict"
run_step "Staging Dry Run" "npm run staging:dry-run"

if [[ "${LAUNCH_INCLUDE_CONTRACT_SMOKE:-0}" == "1" ]]; then
  run_step "Staging Contract Smoke" "npm run staging:contract-smoke"
fi

{
  echo "## Verdict"
  echo
  echo "✅ All configured launch evidence checks passed."
} >> "$EVIDENCE_FILE"

echo "[launch-evidence] ✅ Done"
echo "[launch-evidence] Evidence file: ${EVIDENCE_FILE}"
