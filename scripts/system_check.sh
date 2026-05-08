#!/usr/bin/env bash
set -u

BASE_URL="${GOLDIES_BASE_URL:-https://goldieskds.com}"
COOKIE_JAR="$(mktemp)"
STATUS=0
TODAY="$(TZ="${KDS_TIME_ZONE:-America/Chicago}" date +%F)"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

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

exit "$STATUS"
