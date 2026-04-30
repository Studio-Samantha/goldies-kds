#!/bin/zsh
set -euo pipefail

REPO_ROOT="/Users/fullsailuniversity-samanthacarey/Desktop/goldies-kds-main"
DESKTOP_DIR="${HOME}/Desktop"
STAMP="$(date +%Y-%m-%d-%H%M)"
BACKUP_NAME="Goldies-KDS-backup-${STAMP}.zip"
BACKUP_PATH="${DESKTOP_DIR}/${BACKUP_NAME}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

if [[ ! -d "${REPO_ROOT}" ]]; then
  echo "Backup failed: repo not found at ${REPO_ROOT}" >&2
  exit 1
fi

mkdir -p "${DESKTOP_DIR}"
mkdir -p "${TMP_DIR}/goldies-kds-main"

rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'my-menu-app/node_modules' \
  --exclude 'my-menu-app/dist' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  "${REPO_ROOT}/" "${TMP_DIR}/goldies-kds-main/"

(
  cd "${TMP_DIR}"
  zip -qr "${BACKUP_PATH}" "goldies-kds-main"
)

echo "Created backup: ${BACKUP_PATH}"
