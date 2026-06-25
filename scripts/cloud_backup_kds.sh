#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${GOLDIES_BASE_URL:-https://goldieskds.com}"
BACKUP_DAYS="${GOLDIES_BACKUP_DAYS:-14}"
BACKUP_DIR="${GOLDIES_BACKUP_DIR:-.goldies-backup}"
KDS_TIME_ZONE="${KDS_TIME_ZONE:-America/Chicago}"
STAMP="$(date -u +"%Y-%m-%dT%H%M%SZ")"
BACKUP_NAME="goldies-kds-cloud-backup-${STAMP}"
OUT_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
COOKIE_JAR="$(mktemp)"
LOGIN_OUT="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR" "$LOGIN_OUT"
}
trap cleanup EXIT

if [ -z "${GOLDIES_KDS_PASSWORD:-}" ]; then
  echo "GOLDIES_KDS_PASSWORD is required for cloud backups."
  exit 1
fi

if ! [[ "$BACKUP_DAYS" =~ ^[0-9]+$ ]] || [ "$BACKUP_DAYS" -lt 1 ] || [ "$BACKUP_DAYS" -gt 31 ]; then
  echo "GOLDIES_BACKUP_DAYS must be a number between 1 and 31."
  exit 1
fi

mkdir -p "$OUT_DIR"

write_manifest() {
  CREATED_AT="$STAMP" BASE_URL="$BASE_URL" BACKUP_DAYS="$BACKUP_DAYS" KDS_TIME_ZONE="$KDS_TIME_ZONE" node - "$OUT_DIR/manifest.json" <<'NODE'
const fs = require("fs");
const manifest = {
  service: "goldies-kds",
  backupType: "kds-api-export",
  createdAt: process.env.CREATED_AT,
  baseUrl: process.env.BASE_URL,
  backupDays: Number(process.env.BACKUP_DAYS),
  timeZone: process.env.KDS_TIME_ZONE,
  note: "Generated from production KDS read endpoints. No passwords or session cookies are stored in this backup.",
};
fs.writeFileSync(process.argv[2], `${JSON.stringify(manifest, null, 2)}\n`);
NODE
}

fetch_public() {
  local relative_path="$1"
  local endpoint="$2"
  local out="${OUT_DIR}/${relative_path}"

  mkdir -p "$(dirname "$out")"
  curl -fsS "$BASE_URL$endpoint" -o "$out"
}

fetch_auth() {
  local relative_path="$1"
  local endpoint="$2"
  local out="${OUT_DIR}/${relative_path}"

  mkdir -p "$(dirname "$out")"
  curl -fsS -b "$COOKIE_JAR" "$BASE_URL$endpoint" -o "$out"
}

make_day_list() {
  node - "$BACKUP_DAYS" <<'NODE'
const days = Number(process.argv[2] || 14);
const timeZone = process.env.KDS_TIME_ZONE || "America/Chicago";
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

for (let offset = 0; offset < days; offset += 1) {
  const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  console.log(`${parts.year}-${parts.month}-${parts.day}`);
}
NODE
}

write_summary() {
  BACKUP_ROOT="$OUT_DIR" CREATED_AT="$STAMP" node - "$OUT_DIR/summary.json" <<'NODE'
const fs = require("fs");
const path = require("path");

const root = process.env.BACKUP_ROOT;

function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function countTickets(value) {
  if (Array.isArray(value)) return value.length;
  if (Array.isArray(value?.tickets)) return value.tickets.length;
  if (Array.isArray(value?.orders)) return value.orders.length;
  if (Array.isArray(value?.data)) return value.data.length;
  return null;
}

function pickNumber(value, keys) {
  for (const key of keys) {
    const found = key.split(".").reduce((current, part) => current?.[part], value);
    if (typeof found === "number") return found;
  }
  return null;
}

const ranges = ["today", "yesterday", "last7", "last30", "thisMonth"];
const drinkReports = Object.fromEntries(ranges.map((range) => {
  const report = readJson(`reports/drinks/${range}.json`, {});
  return [range, {
    orderCount: pickNumber(report, ["orderCount", "totalOrders", "summary.orderCount", "summary.totalOrders"]),
    drinkCount: pickNumber(report, ["drinkCount", "totalDrinks", "totalUnits", "summary.drinkCount", "summary.totalDrinks", "summary.totalUnits"]),
  }];
}));

const ticketDir = path.join(root, "tickets/day");
const ticketDays = fs.existsSync(ticketDir)
  ? fs.readdirSync(ticketDir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => {
        const date = file.replace(/\.json$/, "");
        return { date, count: countTickets(readJson(`tickets/day/${file}`)) };
      })
  : [];

const health = readJson("system/health.json", {});
const summary = {
  createdAt: process.env.CREATED_AT,
  health: {
    ok: health.ok ?? null,
    storage: health.storage ?? null,
    storageFallbackActive: health.storageFallbackActive ?? null,
    squareOnline: health.squareApi?.online ?? null,
    squareLastHealthyAt: health.squareApi?.lastHealthyAt ?? null,
  },
  drinkReports,
  ticketDays,
};

fs.writeFileSync(process.argv[2], `${JSON.stringify(summary, null, 2)}\n`);
NODE
}

write_manifest

echo "Fetching public health..."
fetch_public "system/health.json" "/api/health"

echo "Signing in for authenticated backup reads..."
login_code="$(
  curl -sS -o "$LOGIN_OUT" -w "%{http_code}" \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$GOLDIES_KDS_PASSWORD\",\"employeeName\":\"Cloud Backup\"}" \
    "$BASE_URL/api/login"
)"

if [ "$login_code" != "200" ]; then
  echo "Cloud backup login failed with status ${login_code}."
  exit 1
fi

echo "Fetching reports..."
for range in today yesterday last7 last30 thisMonth; do
  fetch_auth "reports/drinks/${range}.json" "/api/reports/drinks?range=${range}"
  fetch_auth "reports/drink-making-time/${range}.json" "/api/reports/drink-making-time?range=${range}"
done

echo "Fetching recent daily tickets..."
while IFS= read -r day; do
  fetch_auth "tickets/day/${day}.json" "/api/tickets/day?date=${day}"
done < <(make_day_list)

echo "Fetching menu and display data..."
fetch_auth "system/active-tickets.json" "/api/tickets"
fetch_auth "system/menu-availability.json" "/api/menu/availability"
fetch_auth "system/display-menu.json" "/api/display/menu"
fetch_auth "system/display-orders-up.json" "/api/display/orders-up"
fetch_auth "system/display-online-orders.json" "/api/display/online-orders"
fetch_public "system/public-kiosk-menu.json" "/api/beta/online-order/menu"

write_summary

tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tgz" -C "$BACKUP_DIR" "$BACKUP_NAME"

echo "Cloud backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tgz"
