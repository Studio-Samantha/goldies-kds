#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_ROOT="${GOLDIES_BACKUP_ROOT:-${HOME}/Desktop/Goldies KDS Backups}"
LIVE_DATA_DAYS="${GOLDIES_BACKUP_LIVE_DATA_DAYS:-14}"
BASE_URL="${GOLDIES_BASE_URL:-https://goldieskds.com}"
STAMP="$(date +%Y-%m-%d-%H%M)"
BACKUP_NAME="Goldies-KDS-backup-${STAMP}.zip"
BACKUP_PATH="${BACKUP_ROOT}/${BACKUP_NAME}"
TMP_DIR="$(mktemp -d)"
COOKIE_JAR="${TMP_DIR}/cookies.txt"

cleanup() {
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

if [[ ! -f "${REPO_ROOT}/server.js" || ! -d "${REPO_ROOT}/my-menu-app" ]]; then
  echo "Backup failed: KDS repo not found at ${REPO_ROOT}" >&2
  exit 1
fi

mkdir -p "${BACKUP_ROOT}"
mkdir -p "${TMP_DIR}/goldies-kds-main"
mkdir -p "${TMP_DIR}/goldies-kds-main/live-data"

rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'my-menu-app/node_modules' \
  --exclude 'my-menu-app/dist' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  "${REPO_ROOT}/" "${TMP_DIR}/goldies-kds-main/"

cat > "${TMP_DIR}/goldies-kds-main/backup-manifest.json" <<EOF
{
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sourceRepo": "${REPO_ROOT}",
  "baseUrl": "${BASE_URL}",
  "liveDataDays": ${LIVE_DATA_DAYS}
}
EOF

if [[ -n "${GOLDIES_KDS_PASSWORD:-}" ]]; then
  login_code="$(
    curl -sS -o "${TMP_DIR}/login.json" -w "%{http_code}" \
      -c "${COOKIE_JAR}" \
      -H "Content-Type: application/json" \
      -d "{\"password\":\"${GOLDIES_KDS_PASSWORD}\",\"employeeName\":\"Backup\"}" \
      "${BASE_URL}/api/login"
  )"

  if [[ "${login_code}" == "200" ]]; then
    curl -fsS -b "${COOKIE_JAR}" "${BASE_URL}/api/health" \
      -o "${TMP_DIR}/goldies-kds-main/live-data/health.json"
    curl -fsS -b "${COOKIE_JAR}" "${BASE_URL}/api/reports/drinks?range=today" \
      -o "${TMP_DIR}/goldies-kds-main/live-data/report-today.json"
    curl -fsS -b "${COOKIE_JAR}" "${BASE_URL}/api/reports/drinks?range=last7" \
      -o "${TMP_DIR}/goldies-kds-main/live-data/report-last7.json"

    for offset in $(seq 0 "$((LIVE_DATA_DAYS - 1))"); do
      day="$(TZ="${KDS_TIME_ZONE:-America/Chicago}" date -v-"${offset}"d +%F 2>/dev/null || TZ="${KDS_TIME_ZONE:-America/Chicago}" date -d "-${offset} day" +%F)"
      curl -fsS -b "${COOKIE_JAR}" "${BASE_URL}/api/tickets/day?date=${day}" \
        -o "${TMP_DIR}/goldies-kds-main/live-data/tickets-${day}.json"
    done
  else
    echo "Live data backup skipped: KDS login failed with status ${login_code}" >&2
  fi
else
  echo "Live data backup skipped: set GOLDIES_KDS_PASSWORD to include KDS reports and order history." >&2
fi

(
  cd "${TMP_DIR}"
  zip -qr "${BACKUP_PATH}" "goldies-kds-main"
)

echo "Created backup: ${BACKUP_PATH}"
