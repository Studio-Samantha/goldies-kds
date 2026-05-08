#!/usr/bin/env bash
set -u

BASE_URL="${GOLDIES_BASE_URL:-https://goldieskds.com}"
COOKIE_JAR="$(mktemp)"
STATUS=0
TODAY="$(TZ="${KDS_TIME_ZONE:-America/Chicago}" date +%F)"
TRACK_UPTIME="${GOLDIES_TRACK_UPTIME:-0}"
UPTIME_STATE_DIR="${GOLDIES_UPTIME_STATE_DIR:-${HOME}/Library/Application Support/GoldiesKDS}"
UPTIME_STATE_FILE="${UPTIME_STATE_DIR}/system-health-state"
UPTIME_LOG_FILE="${UPTIME_STATE_DIR}/system-health-events.jsonl"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

record_uptime_event() {
  if [ "$TRACK_UPTIME" != "1" ]; then
    return
  fi

  mkdir -p "$UPTIME_STATE_DIR"

  local current_state="up"
  local reason="system-check-passed"
  if [ "$STATUS" -ne 0 ]; then
    current_state="down"
    reason="system-check-failed"
  fi

  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  local previous_state="unknown"
  local previous_since="$now"
  if [ -f "$UPTIME_STATE_FILE" ]; then
    previous_state="$(node -e 'const fs=require("fs");try{const s=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(s.state||"unknown")}catch{process.stdout.write("unknown")}' "$UPTIME_STATE_FILE")"
    previous_since="$(node -e 'const fs=require("fs");try{const s=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(s.since||process.argv[2])}catch{process.stdout.write(process.argv[2])}' "$UPTIME_STATE_FILE" "$now")"
  fi

  if [ "$current_state" != "$previous_state" ]; then
    STATE="$current_state" PREVIOUS_STATE="$previous_state" SINCE="$previous_since" NOW="$now" REASON="$reason" BASE_URL="$BASE_URL" LOG_FILE="$UPTIME_LOG_FILE" node - <<'NODE'
const fs = require("fs");
const event = {
  at: process.env.NOW,
  service: "goldies-kds",
  baseUrl: process.env.BASE_URL,
  state: process.env.STATE,
  previousState: process.env.PREVIOUS_STATE,
  previousSince: process.env.SINCE,
  reason: process.env.REASON,
};
if (event.state === "up" && event.previousState === "down") {
  const started = Date.parse(event.previousSince);
  const ended = Date.parse(event.at);
  if (Number.isFinite(started) && Number.isFinite(ended)) {
    event.downtimeMs = Math.max(0, ended - started);
    event.downtimeMinutes = Math.round((event.downtimeMs / 60000) * 10) / 10;
  }
}
fs.appendFileSync(process.env.LOG_FILE, `${JSON.stringify(event)}\n`);
NODE
  fi

  STATE="$current_state" SINCE="$now" PREVIOUS_STATE="$previous_state" PREVIOUS_SINCE="$previous_since" STATE_FILE="$UPTIME_STATE_FILE" node - <<'NODE'
const fs = require("fs");
const state = process.env.STATE;
const previousState = process.env.PREVIOUS_STATE;
const previousSince = process.env.PREVIOUS_SINCE;
const since = state === previousState && previousSince ? previousSince : process.env.SINCE;
fs.writeFileSync(process.env.STATE_FILE, JSON.stringify({ state, since, updatedAt: process.env.SINCE }, null, 2));
NODE
}

check_public_health() {
  echo "== Public health =="
  local body
  body="$(curl -fsS "$BASE_URL/api/health" 2>/tmp/goldies-health.err)"
  local code=$?
  if [ "$code" -ne 0 ]; then
    echo "FAIL health request: $(cat /tmp/goldies-health.err)"
    STATUS=1
    return
  fi
  BODY="$body" node - <<'NODE'
const health = JSON.parse(process.env.BODY || "{}");
const square = health.squareApi || {};
console.log(`ok=${health.ok}`);
console.log(`storage=${health.storage}`);
console.log(`loginConfigured=${health.loginConfigured}`);
console.log(`squareOnline=${square.online}`);
console.log(`squareLastHealthyAt=${square.lastHealthyAt || "none"}`);
console.log(`squareLastError=${square.lastError || "none"}`);
console.log(`squareLastSyncSuccessAt=${square.lastSyncSuccessAt || "none"}`);
console.log(`squareLastSyncError=${square.lastSyncError || "none"}`);
console.log(`alertsConfigured=${square.alertsConfigured}`);
if (!health.ok || health.storage !== "supabase" || !health.loginConfigured || square.online === false) {
  process.exit(2);
}
NODE
  if [ "$?" -ne 0 ]; then
    STATUS=1
  fi
}

check_authenticated_tickets() {
  if [ -z "${GOLDIES_KDS_PASSWORD:-}" ]; then
    echo "== Authenticated tickets =="
    echo "SKIP set GOLDIES_KDS_PASSWORD to check /api/tickets."
    return
  fi

  echo "== Authenticated tickets =="
  local login_code
  login_code="$(
    curl -sS -o /tmp/goldies-login.json -w "%{http_code}" \
      -c "$COOKIE_JAR" \
      -H "Content-Type: application/json" \
      -d "{\"password\":\"$GOLDIES_KDS_PASSWORD\",\"employeeName\":\"System Check\"}" \
      "$BASE_URL/api/login"
  )"
  if [ "$login_code" != "200" ]; then
    echo "FAIL login status=$login_code"
    STATUS=1
    return
  fi

  check_json_endpoint "tickets" "$BASE_URL/api/tickets" "array"
  node - <<'NODE'
const fs = require("fs");
const tickets = JSON.parse(fs.readFileSync("/tmp/goldies-check-tickets.json", "utf8"));
console.log(`ticketsOk=true`);
console.log(`activeTickets=${Array.isArray(tickets) ? tickets.length : "not-array"}`);
if (!Array.isArray(tickets)) process.exit(2);
NODE
  if [ "$?" -ne 0 ]; then
    STATUS=1
  fi
}

check_json_endpoint() {
  local name="$1"
  local url="$2"
  local shape="${3:-object}"
  local out="/tmp/goldies-check-${name}.json"
  local code

  code="$(curl -sS -o "$out" -w "%{http_code}" -b "$COOKIE_JAR" "$url")"
  if [ "$code" != "200" ]; then
    echo "FAIL $name status=$code"
    cat "$out"
    STATUS=1
    return 1
  fi

  NAME="$name" SHAPE="$shape" OUT="$out" node - <<'NODE'
const fs = require("fs");
const name = process.env.NAME;
const shape = process.env.SHAPE;
const value = JSON.parse(fs.readFileSync(process.env.OUT, "utf8"));
if (shape === "array" && !Array.isArray(value)) process.exit(2);
if (shape === "object" && (!value || Array.isArray(value) || typeof value !== "object")) process.exit(2);
console.log(`${name}Ok=true`);
NODE
  if [ "$?" -ne 0 ]; then
    STATUS=1
    return 1
  fi
}

check_authenticated_workflows() {
  if [ -z "${GOLDIES_KDS_PASSWORD:-}" ]; then
    return
  fi

  echo "== Authenticated workflows =="
  check_json_endpoint "drinks-today" "$BASE_URL/api/reports/drinks?range=today" "object"
  check_json_endpoint "drink-time" "$BASE_URL/api/reports/drink-making-time?range=today" "object"
  check_json_endpoint "tickets-day" "$BASE_URL/api/tickets/day?date=$TODAY" "object"
  check_json_endpoint "menu-availability" "$BASE_URL/api/menu/availability" "object"
  check_json_endpoint "display-menu" "$BASE_URL/api/display/menu" "object"
  check_json_endpoint "display-orders-up" "$BASE_URL/api/display/orders-up" "object"
  check_json_endpoint "display-online-orders" "$BASE_URL/api/display/online-orders" "object"

  local sop_code
  sop_code="$(curl -sS -o /tmp/goldies-check-sop.png -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/staff/sop/goldies-recipes-1.png")"
  if [ "$sop_code" != "200" ]; then
    echo "FAIL staff SOP status=$sop_code"
    STATUS=1
  else
    echo "staffSopOk=true"
  fi
}

check_public_kiosk_menu() {
  echo "== Public kiosk menu =="
  check_json_endpoint "public-kiosk-menu" "$BASE_URL/api/beta/online-order/menu" "object"
  node - <<'NODE'
const fs = require("fs");
const menu = JSON.parse(fs.readFileSync("/tmp/goldies-check-public-kiosk-menu.json", "utf8"));
const items = (menu.categories || []).flatMap((category) => category.items || []);
const missingImages = items.filter((item) => !item.imageUrl);
console.log(`kioskMenuSource=${menu.source || "unknown"}`);
console.log(`kioskMenuItems=${items.length}`);
console.log(`kioskMenuMissingImages=${missingImages.length}`);
if (!items.length || missingImages.length) process.exit(2);
NODE
  if [ "$?" -ne 0 ]; then
    STATUS=1
  fi
}

check_public_health
check_authenticated_tickets
check_authenticated_workflows
check_public_kiosk_menu

if [ "$STATUS" -eq 0 ]; then
  echo "SYSTEM CHECK PASSED"
else
  echo "SYSTEM CHECK FAILED"
fi

record_uptime_event

exit "$STATUS"
