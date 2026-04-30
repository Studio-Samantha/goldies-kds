#!/bin/zsh
set -euo pipefail

HEALTH_URL="${GOLDIES_KDS_HEALTH_URL:-https://goldies-kds-backend.onrender.com/api/health}"
STATE_DIR="${HOME}/Library/Application Support/GoldiesKDS"
STATE_FILE="${STATE_DIR}/square-health-state"

mkdir -p "${STATE_DIR}"

fetch_health() {
  /usr/bin/curl -fsS --max-time 10 "${HEALTH_URL}"
}

health_json="$(fetch_health 2>/dev/null || true)"
current_state="offline"

if [[ -n "${health_json}" && "${health_json}" == *'"online":true'* ]]; then
  current_state="online"
fi

previous_state="unknown"
if [[ -f "${STATE_FILE}" ]]; then
  previous_state="$(/bin/cat "${STATE_FILE}" 2>/dev/null || echo unknown)"
fi

if [[ "${current_state}" == "offline" && "${previous_state}" != "offline" ]]; then
  /usr/bin/osascript <<'APPLESCRIPT'
display notification "Square looks offline. Check the KDS backend." with title "Goldie's KDS"
APPLESCRIPT
fi

printf '%s' "${current_state}" > "${STATE_FILE}"
