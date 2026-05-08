#!/usr/bin/env bash
set -u

BASE_URL="${GOLDIES_BASE_URL:-https://goldieskds.com}"
COOKIE_JAR="$(mktemp)"
STATUS=0

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

  local tickets_code
  tickets_code="$(curl -sS -o /tmp/goldies-tickets.json -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/tickets")"
  if [ "$tickets_code" != "200" ]; then
    echo "FAIL tickets status=$tickets_code"
    cat /tmp/goldies-tickets.json
    STATUS=1
    return
  fi
  node - <<'NODE'
const fs = require("fs");
const tickets = JSON.parse(fs.readFileSync("/tmp/goldies-tickets.json", "utf8"));
console.log(`ticketsOk=true`);
console.log(`activeTickets=${Array.isArray(tickets) ? tickets.length : "not-array"}`);
if (!Array.isArray(tickets)) process.exit(2);
NODE
  if [ "$?" -ne 0 ]; then
    STATUS=1
  fi
}

check_public_health
check_authenticated_tickets

if [ "$STATUS" -eq 0 ]; then
  echo "SYSTEM CHECK PASSED"
else
  echo "SYSTEM CHECK FAILED"
fi

exit "$STATUS"
