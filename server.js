require("dotenv").config();
process.env.TZ = process.env.KDS_TIME_ZONE || process.env.TZ || "America/Chicago";
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");
const { Client, Environment } = require("square");

const IS_TEST_MODE = process.env.GOLDIES_TEST_MODE === "1";
const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 3000;
const STAFF_SOP_DIR = path.join(__dirname, "staff-private", "sop");
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || "production";
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KDS_PASSWORD = process.env.KDS_PASSWORD;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Goldie123";
const SESSION_SECRET = process.env.SESSION_SECRET || SQUARE_ACCESS_TOKEN;
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || "";
const ALERT_SMTP_HOST = process.env.ALERT_SMTP_HOST || "";
const ALERT_SMTP_PORT = Number(process.env.ALERT_SMTP_PORT || 587);
const ALERT_SMTP_SECURE = String(process.env.ALERT_SMTP_SECURE || "").toLowerCase() === "true";
const ALERT_SMTP_USER = process.env.ALERT_SMTP_USER || "";
const ALERT_SMTP_PASS = process.env.ALERT_SMTP_PASS || "";
const ALERT_EMAIL_TO =
  process.env.SQUARE_ALERT_EMAIL_TO ||
  process.env.ALERT_EMAIL_TO ||
  process.env.EMAIL_ALERT_TO ||
  "";
const ALERT_EMAIL_FROM =
  process.env.SQUARE_ALERT_EMAIL_FROM ||
  process.env.ALERT_EMAIL_FROM ||
  process.env.EMAIL_ALERT_FROM ||
  ALERT_SMTP_USER ||
  ALERT_EMAIL_TO ||
  "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const DRINKFLOW_EMAIL_FROM =
  process.env.DRINKFLOW_EMAIL_FROM ||
  process.env.RESEND_FROM_EMAIL ||
  ALERT_EMAIL_FROM;
const VALID_STATUSES = new Set(["new", "making", "ready", "completed", "done"]);
const VALID_DINING_OPTIONS = new Set([
  "HANGIN' OUT",
  "TAKING OFF",
  "Pickup",
  "Delivery",
  "Drive thru",
  "Unspecified",
  "For here",
  "To go",
]);
const SQUARE_SYNC_INTERVAL_MS = 30 * 1000;
const SQUARE_SYNC_TIMEOUT_MS = Number(process.env.SQUARE_SYNC_TIMEOUT_MS || 4500);
const SQUARE_HEALTH_CHECK_INTERVAL_MS = 30 * 1000;
const SQUARE_HEALTH_ALERT_COOLDOWN_MS = 15 * 60 * 1000;
const READY_AUTO_COMPLETE_MS = 2 * 60 * 1000;
const SESSION_COOKIE_NAME = "goldies_kds_session";
const OWNER_SESSION_COOKIE_NAME = "goldies_owner_session";
const DEVELOPER_SESSION_COOKIE_NAME = "studio_samantha_developer_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
const ACCESS_LOG_RETENTION_DAYS = 7;
const CUSTOMER_INSIGHTS_RETENTION_DAYS = 7;
const KDS_PASSWORD_SETTING_KEY = "kds_password";
const OWNER_PASSWORD_SETTING_KEY = "owner_password";
const DEVELOPER_USERNAME = process.env.DEVELOPER_USERNAME || "StudioSamantha";
const DEVELOPER_PASSWORD_HASH =
  process.env.DEVELOPER_PASSWORD_HASH ||
  "1495452a693a8a1659c6ed4449554ded95522b7e0bfe429629d99949fec7d170ea058f6d067a1742ad81ffb0ae232e52602576fc96afe854a85ad7123a49fe5e";
const DEVELOPER_PASSWORD_SALT =
  process.env.DEVELOPER_PASSWORD_SALT || "a8a44832a6f84faf004f993d58de828c";
const DRINKFLOW_SQUARE_APPLICATION_ID =
  process.env.DRINKFLOW_SQUARE_APPLICATION_ID || process.env.SQUARE_APPLICATION_ID || "";
const DRINKFLOW_SQUARE_APPLICATION_SECRET =
  process.env.DRINKFLOW_SQUARE_APPLICATION_SECRET || process.env.SQUARE_APPLICATION_SECRET || "";
const DRINKFLOW_SQUARE_REDIRECT_URL =
  process.env.DRINKFLOW_SQUARE_REDIRECT_URL ||
  "https://goldieskds.com/api/drinkflow/square/oauth/callback";
const DRINKFLOW_SQUARE_OAUTH_SCOPE =
  "MERCHANT_PROFILE_READ ORDERS_READ ORDERS_WRITE ITEMS_READ PAYMENTS_READ PAYMENTS_WRITE";
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION || "2025-04-16";
const KIOSK_ASSET_BASE_URL = (process.env.KIOSK_ASSET_BASE_URL || "").replace(/\/+$/, "");
const ONLINE_ORDERING_CATEGORY_NAMES = (
  process.env.ONLINE_ORDERING_CATEGORY_NAMES || "Coffee,Not Coffee,Smoothies"
)
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);
const ONLINE_ORDERING_BETA_MENU = [
  { id: "americano", name: "Americano", category: "Coffee", priceCents: 325 },
  { id: "americano-decaf", name: "Americano (DECAF)", category: "Coffee", priceCents: 325 },
  { id: "cappuccino", name: "Cappuccino", category: "Coffee", priceCents: 425 },
  { id: "cold-brew", name: "Cold Brew", category: "Coffee", priceCents: 500 },
  { id: "drip", name: "Drip", category: "Coffee", priceCents: 325 },
  { id: "drip-refill", name: "Drip Refill", category: "Coffee", priceCents: 100 },
  { id: "espresso", name: "Espresso", category: "Coffee", priceCents: 300 },
  { id: "flat-white", name: "Flat White", category: "Coffee", priceCents: 450 },
  { id: "gibraltar", name: "Gibraltar", category: "Coffee", priceCents: 350 },
  { id: "latte", name: "Latte", category: "Coffee", priceCents: 500 },
  { id: "pour-over", name: "Pour Over", category: "Coffee", priceCents: 550 },
  { id: "chai-latte", name: "Chai Latte", category: "Not Coffee", priceCents: 500 },
  { id: "hot-chocolate", name: "Hot Chocolate", category: "Not Coffee", priceCents: 450 },
  { id: "london-fog", name: "London Fog", category: "Not Coffee", priceCents: 500 },
  { id: "matcha-latte", name: "Matcha Latte", category: "Not Coffee", priceCents: 525 },
  { id: "refresher-strawberry-mango", name: "Refresher - Strawberry Mango", category: "Not Coffee", priceCents: 600 },
  { id: "steamer-or-cold", name: "Steamer (Or Cold)", category: "Not Coffee", priceCents: 400 },
  { id: "chocolate-pb-banana-12-oz-kids", name: "Chocolate P/B Banana (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "chocolate-pb-banana-16-oz", name: "Chocolate P/B Banana (16 oz)", category: "Smoothies", priceCents: 700 },
  { id: "greens-12-oz-kids", name: "Greens (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "greens-16-oz", name: "Greens (16 oz)", category: "Smoothies", priceCents: 700 },
  { id: "mango-12-oz-kids", name: "Mango (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "mango-16-oz", name: "Mango (16 oz)", category: "Smoothies", priceCents: 700 },
  { id: "strawberry-12-oz-kids", name: "Strawberry (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "strawberry-16-oz", name: "Strawberry (16 oz)", category: "Smoothies", priceCents: 700 },
  { id: "strawberry-banana-12-oz-kids", name: "Strawberry Banana (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "strawberry-banana-16-oz", name: "Strawberry Banana (16 oz)", category: "Smoothies", priceCents: 700 },
  { id: "strawberry-mango-12-oz-kids", name: "Strawberry Mango (12 oz Kids)", category: "Smoothies", priceCents: 500 },
  { id: "strawberry-mango-16-oz", name: "Strawberry Mango (16 oz)", category: "Smoothies", priceCents: 700 },
];
const ONLINE_ORDERING_BETA_MENU_BY_ID = new Map(
  ONLINE_ORDERING_BETA_MENU.map((item) => [item.id, item])
);
const GOLDIES_MENU_CATEGORY_LABELS = ["Coffee", "Not Coffee", "Smoothies"];
const SHOP_TIME_ZONE = "America/Chicago";
const SHOP_HOURS = {
  0: null,
  1: { openHour: 7, closeHour: 15 },
  2: { openHour: 7, closeHour: 15 },
  3: { openHour: 7, closeHour: 15 },
  4: { openHour: 7, closeHour: 15 },
  5: { openHour: 7, closeHour: 15 },
  6: { openHour: 8, closeHour: 13 },
};

if (!IS_TEST_MODE && !SQUARE_ACCESS_TOKEN) {
  console.error("ERROR: SQUARE_ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

if (!IS_TEST_MODE && !SQUARE_LOCATION_ID) {
  console.error("ERROR: SQUARE_LOCATION_ID environment variable is required");
  process.exit(1);
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

if (!supabase) {
  console.warn(
    "WARNING: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for persistent storage."
  );
}

function hasAlertEmailConfig() {
  return Boolean(
    ALERT_SMTP_HOST &&
      ALERT_SMTP_USER &&
      ALERT_SMTP_PASS &&
      ALERT_EMAIL_TO &&
      ALERT_EMAIL_FROM
  );
}

function getAlertEmailConfigDiagnostics() {
  return {
    smtpHostSet: Boolean(ALERT_SMTP_HOST),
    smtpPort: ALERT_SMTP_PORT,
    smtpSecure: ALERT_SMTP_SECURE,
    smtpUserSet: Boolean(ALERT_SMTP_USER),
    smtpPassSet: Boolean(ALERT_SMTP_PASS),
    emailToSet: Boolean(ALERT_EMAIL_TO),
    emailFromSet: Boolean(ALERT_EMAIL_FROM),
    fromResolvedToUser: Boolean(ALERT_SMTP_USER && ALERT_EMAIL_FROM === ALERT_SMTP_USER),
    fromResolvedToTo: Boolean(ALERT_EMAIL_TO && ALERT_EMAIL_FROM === ALERT_EMAIL_TO),
  };
}

function getDrinkFlowSquareOAuthDiagnostics() {
  return {
    applicationIdSet: Boolean(DRINKFLOW_SQUARE_APPLICATION_ID),
    applicationSecretSet: Boolean(DRINKFLOW_SQUARE_APPLICATION_SECRET),
    redirectUrlSet: Boolean(DRINKFLOW_SQUARE_REDIRECT_URL),
    redirectUrl: DRINKFLOW_SQUARE_REDIRECT_URL,
  };
}

function getAlertMailer() {
  if (!hasAlertEmailConfig()) return null;
  if (alertMailer) return alertMailer;

  alertMailer = nodemailer.createTransport({
    host: ALERT_SMTP_HOST,
    port: ALERT_SMTP_PORT,
    secure: ALERT_SMTP_SECURE,
    requireTLS: !ALERT_SMTP_SECURE,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: ALERT_SMTP_USER,
      pass: ALERT_SMTP_PASS,
    },
  });

  return alertMailer;
}

async function sendAlertEmail(subject, text) {
  const mailer = getAlertMailer();
  if (!mailer) return false;

  await mailer.sendMail({
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject,
    text,
  });

  return true;
}

async function sendTransactionalEmail({ to, subject, text, from = DRINKFLOW_EMAIL_FROM }) {
  const email = normalizeLeadEmail(to);
  if (!email || !isValidLeadEmail(email) || !subject || !text) return false;

  if (RESEND_API_KEY && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: email, subject, text }),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Resend email failed: ${response.status}${details ? ` ${details}` : ""}`);
    }
    return true;
  }

  const mailer = getAlertMailer();
  if (!mailer) return false;

  await mailer.sendMail({
    from: from || ALERT_EMAIL_FROM,
    to: email,
    subject,
    text,
  });

  return true;
}

function isSmtpAuthDisabledError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("smtpclientauthentication is disabled") ||
    message.includes("smtp auth") ||
    message.includes("5.7.139")
  );
}

async function sendSquareOfflineEmail(reason, details = "") {
  const subject = `Goldie's KDS: Square API offline${reason ? ` (${reason})` : ""}`;
  const text = [
    "Square API health check failed for Goldie's KDS.",
    "",
    `Reason: ${reason || "Unknown error"}`,
    details ? `Details: ${details}` : "",
    "",
    `Time: ${new Date().toLocaleString()}`,
    "",
    "This alert sends once per outage until Square recovers.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendAlertEmail(subject, text);
}

function normalizeLeadEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidLeadEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function cleanLeadText(value, maxLength = 160) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLeadList(value, maxItems = 12, maxItemLength = 80) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanLeadText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeDrinkFlowSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

function publicWorkspacePayload(workspace = {}) {
  const { email_verification_token, access_token, refresh_token, ...safeWorkspace } = workspace;
  return safeWorkspace;
}

function getFirstCorsOrigin() {
  return (
    CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .find(Boolean) || ""
  );
}

function getOnlineOrderingReturnUrl(req) {
  const envOrigin = process.env.FRONTEND_ORIGIN || getFirstCorsOrigin();
  const requestOrigin = String(req.get("origin") || "").trim();
  const origin = envOrigin || (requestOrigin.startsWith("http") ? requestOrigin : "") || "https://goldieskds.com";
  const source = cleanLeadText(req.body?.source, 40);
  const returnPath = source === "self_order_kiosk" ? "/self-order-kiosk" : "/online-ordering-beta";
  return `${origin.replace(/\/+$/, "")}${returnPath}?ordered=1`;
}

function getSquareRestBaseUrl() {
  return SQUARE_ENVIRONMENT === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function cleanOrderText(value, maxLength = 240) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getShopDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";
  const weekdayName = getPart("weekday");
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  const hour = Number(getPart("hour") || 0);
  const minute = Number(getPart("minute") || 0);

  return {
    weekday,
    hour,
    minute,
    minutes: hour * 60 + minute,
  };
}

function getShopDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function getShopHoursForDate(date = new Date()) {
  const { weekday } = getShopDateParts(date);
  return SHOP_HOURS[weekday] || null;
}

function getOnlineOrderingHoursStatus(date = new Date()) {
  const parts = getShopDateParts(date);
  const hours = SHOP_HOURS[parts.weekday] || null;

  if (!hours) {
    return {
      accepting: false,
      label: "Closed today",
      message: "Goldie's is closed on Sundays. Online pickup ordering reopens Monday at 7:00 AM.",
    };
  }

  const openMinute = hours.openHour * 60;
  const closeMinute = hours.closeHour * 60;
  const accepting =
    parts.minutes >= openMinute && parts.minutes < closeMinute - 15;

  return {
    accepting,
    openHour: hours.openHour,
    closeHour: hours.closeHour,
    label: accepting ? "Open for pickup orders" : "Outside pickup hours",
    message: accepting
      ? `ASAP pickup ordering is available until 15 minutes before close.`
      : `Goldie's pickup hours today are ${hours.openHour}:00 AM-${hours.closeHour > 12 ? `${hours.closeHour - 12}:00 PM` : `${hours.closeHour}:00 AM`}.`,
  };
}

function generatePickupSlots(date = new Date()) {
  const now = new Date(date);
  const first = new Date(now.getTime() + 15 * 60000);
  first.setMinutes(Math.ceil(first.getMinutes() / 15) * 15, 0, 0);

  const slots = [];
  for (let index = 0; index < 7 * 24 * 4; index += 1) {
    const slot = new Date(first.getTime() + index * 15 * 60000);
    const slotParts = getShopDateParts(slot);
    const slotHours = getShopHoursForDate(slot);
    if (!slotHours) continue;
    const slotMinutes = slotParts.minutes;
    if (
      slotMinutes < slotHours.openHour * 60 ||
      slotMinutes > slotHours.closeHour * 60 - 15
    ) {
      continue;
    }

    slots.push({
      value: slot.toISOString(),
      label: slot.toLocaleString("en-US", {
        weekday: slot.toDateString() === now.toDateString() ? undefined : "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: SHOP_TIME_ZONE,
      }),
    });
  }

  return slots.slice(0, 16);
}

function isPickupTimeInsideShopHours(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const hours = getShopHoursForDate(date);
  if (!hours) return false;
  const parts = getShopDateParts(date);
  return (
    parts.minutes >= hours.openHour * 60 &&
    parts.minutes <= hours.closeHour * 60 - 15 &&
    date.getTime() > Date.now()
  );
}

async function fetchSquareCatalogObjects(types) {
  const objects = [];
  let cursor = "";

  do {
    const params = new URLSearchParams({ types: types.join(",") });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`${getSquareRestBaseUrl()}/v2/catalog/list?${params}`, {
      headers: {
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": SQUARE_API_VERSION,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.errors?.[0]?.detail || payload?.errors?.[0]?.code || "Square catalog unavailable.");
    }

    objects.push(...(payload.objects || []));
    cursor = payload.cursor || "";
  } while (cursor);

  return objects;
}

function isCatalogObjectPresentAtLocation(data = {}) {
  if (data.present_at_all_locations) return true;
  const locationIds = data.present_at_location_ids || [];
  return !locationIds.length || locationIds.includes(SQUARE_LOCATION_ID);
}

function getCatalogImageUrl(imageObject) {
  const imageData = imageObject?.image_data || imageObject?.imageData || {};
  return imageData.url || "";
}

function getDrinkImageSlug(itemName = "") {
  const normalized = String(itemName || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.includes("decaf") && normalized.includes("americano")) return "americano-decaf";
  if (normalized.includes("americano")) return "americano";
  if (normalized.includes("drip") && normalized.includes("refill")) return "drip-refill";
  if (normalized.includes("drip")) return "drip";
  if (normalized.includes("pour-over") || normalized.includes("pour")) return "pour-over";
  if (normalized.includes("espresso")) return "espresso";
  if (normalized.includes("flat") && normalized.includes("white")) return "flat-white";
  if (normalized.includes("gibraltar")) return "gibraltar";
  if (normalized.includes("cold") && normalized.includes("brew")) return "cold-brew";
  if (normalized.includes("cappuccino")) return "cappuccino";
  if (normalized.includes("london") && normalized.includes("fog")) return "london-fog";
  if (normalized.includes("chai")) return "chai-latte";
  if (normalized.includes("hot") && normalized.includes("chocolate")) return "hot-chocolate";
  if (normalized.includes("matcha")) return "matcha-latte";
  if (normalized.includes("refresher")) return "refresher-strawberry-mango";
  if (normalized.includes("steamer")) return "steamer-or-cold";
  if (normalized.includes("strawberry") && normalized.includes("mango")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "strawberry-mango-12-oz-kids"
      : "strawberry-mango-16-oz";
  }
  if (normalized.includes("pineapple") && normalized.includes("mango")) return "mango-pineapple";
  if (normalized.includes("chocolate") && normalized.includes("banana")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "chocolate-pb-banana-12-oz-kids"
      : "chocolate-pb-banana-16-oz";
  }
  if (normalized.includes("greens") || normalized.includes("green")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "greens-12-oz-kids"
      : "greens-16-oz";
  }
  if (normalized.includes("strawberry") && normalized.includes("banana")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "strawberry-banana-12-oz-kids"
      : "strawberry-banana-16-oz";
  }
  if (normalized.includes("mango")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "mango-12-oz-kids"
      : "mango-16-oz";
  }
  if (normalized.includes("strawberry")) {
    return normalized.includes("12-oz") || normalized.includes("kids")
      ? "strawberry-12-oz-kids"
      : "strawberry-16-oz";
  }
  if (normalized.includes("latte")) return "latte";
  return normalized || "latte";
}

const KIOSK_LOCAL_IMAGE_PATHS = {
  americano: "/assets/drinks/generated/americano.png",
  "americano-decaf": "/assets/drinks/generated/americano-decaf.png",
  cappuccino: "/assets/drinks/generated/cappuccino.png",
  "cold-brew": "/assets/drinks/generated/cold-brew.png",
  drip: "/assets/drinks/generated/drip.png",
  "drip-refill": "/assets/drinks/generated/drip-refill.png",
  espresso: "/assets/drinks/generated/espresso.png",
  "flat-white": "/assets/drinks/generated/flat-white.png",
  gibraltar: "/assets/drinks/generated/gibraltar.png",
  latte: "/assets/drinks/generated/latte.png",
  "pour-over": "/assets/drinks/generated/pour-over.png",
  "chai-latte": "/assets/drinks/generated/chai-latte.png",
  "hot-chocolate": "/assets/drinks/generated/hot-chocolate.png",
  "london-fog": "/assets/drinks/generated/london-fog.png",
  "matcha-latte": "/assets/drinks/generated/matcha-latte.png",
  "refresher-strawberry-mango": "/assets/drinks/generated/refresher-strawberry-mango.png",
  "steamer-or-cold": "/assets/drinks/generated/steamer-or-cold.png",
  "chocolate-pb-banana-12-oz-kids": "/assets/drinks/generated/chocolate-pb-banana-12-oz-kids.png",
  "chocolate-pb-banana-16-oz": "/assets/drinks/generated/chocolate-pb-banana-16-oz.png",
  "greens-12-oz-kids": "/assets/drinks/generated/greens-12-oz-kids.png",
  "greens-16-oz": "/assets/drinks/generated/greens-16-oz.png",
  "mango-12-oz-kids": "/assets/drinks/generated/mango-12-oz-kids.png",
  "mango-16-oz": "/assets/drinks/generated/mango-16-oz.png",
  "strawberry-12-oz-kids": "/assets/drinks/generated/strawberry-12-oz-kids.png",
  "strawberry-16-oz": "/assets/drinks/generated/strawberry-16-oz.png",
  "strawberry-banana-12-oz-kids": "/assets/drinks/generated/strawberry-banana-12-oz-kids.png",
  "strawberry-banana-16-oz": "/assets/drinks/generated/strawberry-banana-16-oz.png",
  "strawberry-mango-12-oz-kids": "/assets/drinks/generated/strawberry-mango-12-oz-kids.png",
  "strawberry-mango-16-oz": "/assets/drinks/generated/strawberry-mango-16-oz.png",
  "neutral-cafe-drink": "/assets/drinks/generated/neutral-cafe-drink.png",
};

const KIOSK_STOCK_IMAGE_URLS = {
  latte:
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  americano:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  "decaf-americano":
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
  "cold-brew":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  cappuccino:
    "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=80",
  "london-fog":
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
  "chai-latte":
    "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80",
  "hot-chocolate":
    "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=900&q=80",
  "matcha-latte":
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80",
  "strawberry-banana":
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=80",
  "strawberry-mango":
    "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
  "mango-pineapple":
    "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80",
  "chocolate-pb-banana":
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
  "green-smoothie":
    "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=900&q=80",
};

function resolveKioskAssetPath(path) {
  return KIOSK_ASSET_BASE_URL ? `${KIOSK_ASSET_BASE_URL}${path}` : path;
}

function getFallbackDrinkImageUrl(itemName = "") {
  const slug = getDrinkImageSlug(itemName);
  if (KIOSK_LOCAL_IMAGE_PATHS[slug]) return resolveKioskAssetPath(KIOSK_LOCAL_IMAGE_PATHS[slug]);
  if (KIOSK_STOCK_IMAGE_URLS[slug]) return KIOSK_STOCK_IMAGE_URLS[slug];
  return resolveKioskAssetPath(KIOSK_LOCAL_IMAGE_PATHS["neutral-cafe-drink"]);
}

function formatCatalogMoney(cents) {
  return formatMoney(Number(cents || 0));
}

function normalizeCatalogLabel(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getCatalogSizeToken(value) {
  const text = normalizeCatalogLabel(value);
  const ounceMatch = text.match(/\b(8|10|12|16|20|24)\s*(oz|ounce|ounces)\b/);
  if (ounceMatch) return ounceMatch[1];
  if (/\b(small|sm)\b/.test(text)) return "12";
  if (/\b(large|lg)\b/.test(text)) return "16";
  return "";
}

function isTemperatureModifierGroup(group = {}) {
  const text = normalizeCatalogLabel(
    `${group.name || ""} ${(group.options || []).map((option) => option.name).join(" ")}`
  );
  return /\bhot\b/.test(text) && /\b(iced|ice)\b/.test(text);
}

function isSizeModifierGroup(group = {}) {
  const text = normalizeCatalogLabel(
    `${group.name || ""} ${(group.options || []).map((option) => option.name).join(" ")}`
  );
  return /\b(size|oz|ounce|ounces|small|large|medium)\b/.test(text);
}

function isTemperatureOption(option = {}) {
  const text = normalizeCatalogLabel(option.name);
  return text === "hot" || text === "iced" || text === "ice";
}

function isHotOption(option = {}) {
  return normalizeCatalogLabel(option.name) === "hot";
}

function isSizeOption(option = {}) {
  return Boolean(getCatalogSizeToken(option.name));
}

function isServiceOption(option = {}) {
  const text = normalizeCatalogLabel(option.name).replace(/[^a-z0-9]+/g, " ").trim();
  return (
    text === "here" ||
    text === "to go" ||
    text === "togo" ||
    text === "for here" ||
    text === "hangin out" ||
    text === "hanging out" ||
    text === "taking off"
  );
}

function getOnlineOrderingDrinkRule(itemName = "") {
  const text = normalizeCatalogLabel(itemName);
  if (
    text === "espresso" ||
    text.startsWith("espresso ") ||
    text.includes("gibraltar") ||
    text.includes("pour over")
  ) {
    return { online: false, reason: "HANGIN' OUT only" };
  }

  if (text.includes("americano") || text === "latte" || text.startsWith("latte ")) {
    return { online: true, temperature: "choice" };
  }

  if (
    text.includes("drip refill") ||
    text.includes("flat white") ||
    text.includes("cappuccino") ||
    text === "drip" ||
    text.startsWith("drip ")
  ) {
    return { online: true, temperature: "hot" };
  }

  return { online: true, temperature: "optional" };
}

function buildVirtualTemperatureGroup(variationId, mode = "choice") {
  const options =
    mode === "hot"
      ? [
          {
            id: `virtual-temperature-${variationId}-hot`,
            name: "Hot",
            price: "$0.00",
            priceCents: 0,
            virtual: true,
          },
        ]
      : [
          {
            id: `virtual-temperature-${variationId}-hot`,
            name: "Hot",
            price: "$0.00",
            priceCents: 0,
            virtual: true,
          },
          {
            id: `virtual-temperature-${variationId}-iced`,
            name: "Iced",
            price: "$0.00",
            priceCents: 0,
            virtual: true,
          },
        ];

  return {
    id: `virtual-temperature-${variationId}`,
    name: "Temperature",
    role: "temperature",
    required: true,
    virtual: true,
    minSelected: 1,
    maxSelected: 1,
    selectionType: "single",
    options,
  };
}

function mergeOnlineModifierGroups(groups = []) {
  const merged = [];
  const additionOptionsByName = new Map();
  let additionGroup = null;

  for (const group of groups) {
    if (group.role !== "addition") {
      merged.push(group);
      continue;
    }

    if (!additionGroup) {
      additionGroup = {
        ...group,
        id: `${group.id}-combined`,
        name: "Drink additions",
        options: [],
        required: false,
        minSelected: 0,
        maxSelected: 0,
        selectionType: "multiple",
      };
      merged.push(additionGroup);
    }

    for (const option of group.options || []) {
      const key = normalizeCatalogLabel(option.name);
      if (additionOptionsByName.has(key)) continue;
      additionOptionsByName.set(key, true);
      additionGroup.options.push(option);
    }
  }

  return merged.filter((group) => group.options?.length);
}

function filterModifierGroupsForVariation(modifierGroups, itemName, variationName) {
  const variationSize = getCatalogSizeToken(`${itemName} ${variationName}`);
  const drinkRule = getOnlineOrderingDrinkRule(itemName);
  let hasTemperatureGroup = false;

  const groups = (modifierGroups || [])
    .filter((group) => {
      const groupSize = getCatalogSizeToken(group.name);
      return !groupSize || !variationSize || groupSize === variationSize;
    })
    .flatMap((group) => {
      const options = (group.options || []).filter((option) => !isServiceOption(option));
      const temperatureOptions = options.filter(isTemperatureOption);
      const filteredTemperatureOptions =
          drinkRule.temperature === "hot" ? temperatureOptions.filter(isHotOption) : temperatureOptions;
      const sizeOptions = options.filter(isSizeOption);
      const additionOptions = options.filter(
        (option) => !isTemperatureOption(option) && !isSizeOption(option)
      );

      if (temperatureOptions.length || sizeOptions.length) {
        const splitGroups = [];

        if (filteredTemperatureOptions.length && !hasTemperatureGroup) {
          hasTemperatureGroup = true;
          splitGroups.push({
            ...group,
            id: `${group.id}-temperature`,
            role: "temperature",
            options: filteredTemperatureOptions,
            required: ["choice", "hot"].includes(drinkRule.temperature),
            minSelected: ["choice", "hot"].includes(drinkRule.temperature) ? 1 : 0,
            maxSelected: 1,
            selectionType: "single",
          });
        }

        if (sizeOptions.length > 1) {
          splitGroups.push({
            ...group,
            id: `${group.id}-size`,
            role: "size",
            options: sizeOptions,
            required: true,
            minSelected: 1,
            maxSelected: 1,
            selectionType: "single",
          });
        }

        if (additionOptions.length) {
          splitGroups.push({
            ...group,
            id: `${group.id}-additions`,
            role: "addition",
            options: additionOptions,
            required: false,
            minSelected: 0,
            maxSelected: 0,
            selectionType: "multiple",
          });
        }

        return splitGroups;
      }

      return {
        ...group,
        role: "addition",
        options,
        required: Number(group.minSelected || 0) > 0,
        minSelected: group.minSelected,
        maxSelected: group.maxSelected,
        selectionType: Number(group.maxSelected || 0) === 1 ? "single" : "multiple",
      };
    })
    .filter((group) => group.options.length);

  if (["choice", "hot"].includes(drinkRule.temperature) && !hasTemperatureGroup) {
    groups.unshift(
      buildVirtualTemperatureGroup(
        `${itemName}-${variationName}`.replace(/[^a-z0-9]+/gi, "-"),
        drinkRule.temperature
      )
    );
  }

  return mergeOnlineModifierGroups(groups);
}

function buildStaticOnlineOrderingMenu({ includeForHereOnly = false, unavailableKeys = new Set() } = {}) {
  const grouped = new Map();
  for (const item of ONLINE_ORDERING_BETA_MENU) {
    const itemRule = getOnlineOrderingDrinkRule(item.name);
    if (!includeForHereOnly && !itemRule.online) continue;
    if (!isMenuItemAvailable(item, unavailableKeys)) continue;
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push({
      id: item.id,
      name: getCanonicalDrinkName(item.name),
      squareName: item.name,
      category: item.category,
      price: formatCatalogMoney(item.priceCents),
      priceCents: item.priceCents,
      variationId: "",
      variationName: "",
      description: "",
      imageUrl: getFallbackDrinkImageUrl(item.name),
      modifierGroups: [],
      source: "static",
    });
  }

  return Array.from(grouped, ([category, items]) => ({ category, items }));
}

async function getSquareOnlineOrderingMenu({ includeForHereOnly = false } = {}) {
  const unavailableKeys = await getUnavailableMenuKeys();
  const objects = await fetchSquareCatalogObjects([
    "ITEM",
    "ITEM_VARIATION",
    "IMAGE",
    "MODIFIER",
    "MODIFIER_LIST",
    "CATEGORY",
  ]);
  const byId = new Map(objects.map((object) => [object.id, object]));
  const imagesById = new Map(
    objects
      .filter((object) => object.type === "IMAGE")
      .map((object) => [object.id, getCatalogImageUrl(object)])
      .filter(([, url]) => Boolean(url))
  );
  const categoriesById = new Map(
    objects
      .filter((object) => object.type === "CATEGORY")
      .map((object) => [object.id, object.category_data?.name || ""])
  );
  const modifierListsById = new Map(
    objects
      .filter((object) => object.type === "MODIFIER_LIST")
      .map((object) => [object.id, object])
  );
  const groups = new Map();

  for (const object of objects) {
    if (object.type !== "ITEM" || object.is_deleted) continue;

    const itemData = object.item_data || {};
    if (!isCatalogObjectPresentAtLocation(itemData)) continue;

    const categoryId =
      itemData.reporting_category?.id ||
      itemData.category_id ||
      itemData.categories?.[0]?.id ||
      "";
    const squareCategoryName = categoriesById.get(categoryId) || itemData.category_name || "Drinks";
    const categoryName = normalizeGoldiesDrinkCategory(squareCategoryName) || squareCategoryName;
    const categoryAllowed = ONLINE_ORDERING_CATEGORY_NAMES.includes(squareCategoryName.toLowerCase());
    const staticNameAllowed = ONLINE_ORDERING_BETA_MENU_BY_ID.has(
      String(itemData.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    );

    if (ONLINE_ORDERING_CATEGORY_NAMES.length && !categoryAllowed && !staticNameAllowed) {
      continue;
    }

    const itemRule = getOnlineOrderingDrinkRule(itemData.name || "");
    if (!includeForHereOnly && !itemRule.online) continue;
    const catalogImageUrl =
      (itemData.image_ids || [])
        .map((imageId) => imagesById.get(imageId))
        .find(Boolean) || "";

    const modifierGroups = (itemData.modifier_list_info || [])
      .map((info) => {
        const list = modifierListsById.get(info.modifier_list_id);
        const listData = list?.modifier_list_data || {};
        const options = (listData.modifiers || [])
          .map((modifierRef) => byId.get(modifierRef.id) || modifierRef)
          .filter((modifier) => modifier && !modifier.is_deleted)
          .map((modifier) => {
            const modifierData = modifier.modifier_data || {};
            return {
              id: modifier.id,
              name: modifierData.name || "Modifier",
              price: formatCatalogMoney(modifierData.price_money?.amount || 0),
              priceCents: Number(modifierData.price_money?.amount || 0),
            };
          });

        return {
          id: info.modifier_list_id,
          name: listData.name || "Options",
          minSelected: Number(info.min_selected_modifiers || 0),
          maxSelected: Number(info.max_selected_modifiers || 0),
          selectionType:
            Number(info.max_selected_modifiers || 0) === 1 ? "single" : "multiple",
          options,
        };
      })
      .filter((group) => group.options.length);

    const variations = (itemData.variations || [])
      .map((variationRef) => byId.get(variationRef.id) || variationRef)
      .filter((variation) => {
        const variationData = variation?.item_variation_data || {};
        return variation && !variation.is_deleted && isCatalogObjectPresentAtLocation(variationData);
      });

    for (const variation of variations) {
      const variationData = variation.item_variation_data || {};
      const priceCents = Number(variationData.price_money?.amount || 0);
      if (!priceCents) continue;
      const itemName = itemData.name || variationData.name || "Drink";
      const variationName =
        variationData.name && variationData.name !== "Regular" ? variationData.name : "";
      const displayName = getCanonicalDrinkName(itemName);
      if (
        !isMenuItemAvailable({ name: displayName }, unavailableKeys) ||
        !isMenuItemAvailable({ name: itemName }, unavailableKeys)
      ) {
        continue;
      }
      const variationModifierGroups = filterModifierGroupsForVariation(
        modifierGroups,
        itemName,
        variationName
      );

      if (!groups.has(categoryName)) groups.set(categoryName, []);
      groups.get(categoryName).push({
        id: variation.id,
        name: displayName,
        squareName: itemName,
        category: categoryName,
        price: formatCatalogMoney(priceCents),
        priceCents,
        variationId: variation.id,
        variationName,
        description: itemData.description || "",
        imageUrl: catalogImageUrl || getFallbackDrinkImageUrl(itemName),
        modifierGroups: variationModifierGroups,
        source: "square",
      });
    }
  }

  const menu = Array.from(groups, ([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.category.localeCompare(b.category));

  return menu.length ? menu : buildStaticOnlineOrderingMenu({ includeForHereOnly, unavailableKeys });
}

function flattenOnlineOrderingMenu(menu) {
  const map = new Map();
  for (const group of menu || []) {
    for (const item of group.items || []) {
      map.set(item.id, item);
      if (item.variationId) map.set(item.variationId, item);
    }
  }
  return map;
}

async function buildOnlineOrderingBetaLineItems(rawItems, { includeForHereOnly = false } = {}) {
  if (!Array.isArray(rawItems)) return [];
  const menu = await getSquareOnlineOrderingMenu({ includeForHereOnly }).catch(async (error) => {
    console.error("Square catalog menu unavailable, using static customer ordering menu:", error.message);
    const unavailableKeys = await getUnavailableMenuKeys();
    return buildStaticOnlineOrderingMenu({ includeForHereOnly, unavailableKeys });
  });
  const menuById = flattenOnlineOrderingMenu(menu);

  return rawItems
    .map((rawItem) => {
      const rawId = String(rawItem?.variationId || rawItem?.id || "");
      const menuItem = menuById.get(rawId);
      const quantity = Math.min(10, Math.max(0, Number.parseInt(rawItem?.qty, 10) || 0));
      if (!menuItem || quantity <= 0) return null;
      const selectedModifierIds = Array.isArray(rawItem?.modifierIds)
        ? rawItem.modifierIds.map((id) => String(id))
        : [];
      const modifiers = [];
      const choiceNotes = [];
      for (const group of menuItem.modifierGroups || []) {
        const allowedGroupIds = new Set((group.options || []).map((option) => option.id));
        const selectedInGroup = selectedModifierIds.filter((id) => allowedGroupIds.has(id));
        if (group.required && !selectedInGroup.length) {
          const error = new Error(`Choose ${group.name} for ${menuItem.name}.`);
          error.statusCode = 400;
          throw error;
        }
        const cappedSelection =
          Number(group.maxSelected || 0) > 0
            ? selectedInGroup.slice(0, Number(group.maxSelected || 0))
            : selectedInGroup;
        const selectedOptions = (group.options || []).filter((option) =>
          cappedSelection.includes(option.id)
        );
        modifiers.push(
          ...selectedOptions
            .filter((option) => !option.virtual)
            .map((option) => ({ catalog_object_id: option.id }))
        );
        if (selectedOptions.some((option) => option.virtual)) {
          choiceNotes.push(
            `${group.role === "temperature" ? "Temperature" : group.name}: ${selectedOptions
              .map((option) => option.name)
              .join(", ")}`
          );
        } else if ((group.role === "temperature" || group.role === "size") && selectedOptions.length) {
          choiceNotes.push(
            `${group.role === "temperature" ? "Temperature" : "Size"}: ${selectedOptions
              .map((option) => option.name)
              .join(", ")}`
          );
        }
      }
      const lineItem = menuItem.variationId
        ? {
            catalog_object_id: menuItem.variationId,
            quantity: String(quantity),
          }
        : {
            name: menuItem.name,
            quantity: String(quantity),
            base_price_money: {
              amount: menuItem.priceCents,
              currency: "USD",
            },
          };

      return {
        ...lineItem,
        modifiers,
        note: [menuItem.category, ...choiceNotes, cleanOrderText(rawItem?.note, 120)]
          .filter(Boolean)
          .join(" | "),
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function getOnlineOrderConfirmationText({
  customerName,
  pickupTime,
  lineItems,
  checkoutUrl,
  orderId,
}) {
  const itemLines = (lineItems || []).map((item) => {
    const qty = item.quantity || "1";
    const name = item.name || "Drink";
    return `- ${qty}x ${name}${item.note ? ` (${item.note})` : ""}`;
  });

  return [
    `Hi ${customerName || "there"},`,
    "",
    "Thanks for starting a Goldie's pickup order.",
    pickupTime ? `Requested pickup: ${pickupTime}` : "",
    orderId ? `Order reference: ${orderId}` : "",
    "",
    "Your drinks:",
    ...(itemLines.length ? itemLines : ["- Drink order"]),
    "",
    "Finish payment through Square here:",
    checkoutUrl,
    "",
    "After payment is complete, Goldie's will receive the order in DrinkFlow KDS.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

async function reserveDrinkFlowWorkspace({ slug, shopName, ownerEmail, ownerName, req }) {
  const workspaceSlug = normalizeDrinkFlowSlug(slug || shopName);
  if (!workspaceSlug || workspaceSlug.length < 3) {
    const error = new Error("Choose a workspace name with at least 3 letters or numbers.");
    error.statusCode = 400;
    throw error;
  }

  const reserved = new Set(["www", "api", "admin", "developer", "goldies", "setup", "app"]);
  if (reserved.has(workspaceSlug)) {
    const error = new Error("That workspace name is reserved. Try another one.");
    error.statusCode = 409;
    throw error;
  }

  const row = {
    slug: workspaceSlug,
    shop_name: cleanLeadText(shopName, 160),
    owner_email: normalizeLeadEmail(ownerEmail),
    owner_name: cleanLeadText(ownerName, 120),
    status: "reserved",
    email_verified: false,
    email_verification_token: crypto.randomBytes(24).toString("hex"),
    square_connected: false,
    app_url: `https://${workspaceSlug}.drinkflowkds.com`,
    created_from_ip: cleanLeadText(
      req?.headers?.["x-forwarded-for"]?.split(",")[0] || req?.socket?.remoteAddress || "",
      80
    ),
    user_agent: cleanLeadText(req?.get("user-agent") || "", 500),
  };

  if (!supabase) return row;

  const { data: existing, error: existingError } = await supabase
    .from("drinkflow_workspaces")
    .select("slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    const error = new Error("That workspace name is already taken.");
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await supabase
    .from("drinkflow_workspaces")
    .insert(row)
    .select("slug, shop_name, owner_email, owner_name, status, email_verified, email_verification_token, square_connected, app_url, created_at")
    .single();

  if (error) throw error;
  return data || row;
}

async function sendDrinkFlowVerificationEmail(workspace) {
  const email = normalizeLeadEmail(workspace?.owner_email);
  const token = workspace?.email_verification_token;
  if (!email || !token || !isValidLeadEmail(email)) return false;

  const verifyUrl = `https://goldieskds.com/api/drinkflow-workspaces/verify-email?token=${encodeURIComponent(token)}`;
  await sendTransactionalEmail({
    to: email,
    subject: "Verify your DrinkFlow workspace",
    text: [
      `Hi ${workspace.owner_name || "there"},`,
      "",
      `Your DrinkFlow workspace is reserved: ${workspace.app_url}`,
      "",
      "Verify this email before connecting live shop data:",
      verifyUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });

  return true;
}

async function getDrinkFlowWorkspaceBySlug(slug) {
  const workspaceSlug = normalizeDrinkFlowSlug(slug);
  if (!workspaceSlug || !supabase) return null;

  const { data, error } = await supabase
    .from("drinkflow_workspaces")
    .select("slug, shop_name, owner_email, status, email_verified, square_connected, app_url")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function refreshDrinkFlowVerificationToken({ slug, ownerEmail }) {
  const workspaceSlug = normalizeDrinkFlowSlug(slug);
  const email = normalizeLeadEmail(ownerEmail);
  if (!workspaceSlug || !email || !supabase) return null;

  const { data: existing, error: existingError } = await supabase
    .from("drinkflow_workspaces")
    .select("slug, shop_name, owner_email, owner_name, status, email_verified, app_url")
    .eq("slug", workspaceSlug)
    .eq("owner_email", email)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing || existing.email_verified) return existing || null;

  const nextToken = crypto.randomBytes(24).toString("hex");
  const { data, error } = await supabase
    .from("drinkflow_workspaces")
    .update({
      email_verification_token: nextToken,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", workspaceSlug)
    .eq("owner_email", email)
    .select("slug, shop_name, owner_email, owner_name, status, email_verified, email_verification_token, square_connected, app_url, created_at")
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function sendOnlineOrderConfirmationEmail({
  to,
  customerName,
  pickupTime,
  lineItems,
  checkoutUrl,
  orderId,
}) {
  const email = normalizeLeadEmail(to);
  if (!email || !isValidLeadEmail(email)) return false;

  const mailer = getAlertMailer();
  if (!mailer) return false;

  await mailer.sendMail({
    from: ALERT_EMAIL_FROM,
    to: email,
    subject: "Goldie's pickup order confirmation",
    text: getOnlineOrderConfirmationText({
      customerName,
      pickupTime,
      lineItems,
      checkoutUrl,
      orderId,
    }),
  });

  return true;
}

if (!IS_TEST_MODE) {
  console.log("Initializing Square client...");
  console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`Location ID: ${SQUARE_LOCATION_ID ? "Set" : "Missing"}`);
}

const squareClient = IS_TEST_MODE
  ? {}
  : new Client({
      accessToken: SQUARE_ACCESS_TOKEN,
      environment:
        SQUARE_ENVIRONMENT === "sandbox" ? Environment.Sandbox : Environment.Production,
    });

if (!IS_TEST_MODE) {
  console.log("Square client initialized successfully");
}

const defaultAllowedOrigins = [
  "https://goldieskds.com",
  "https://www.goldieskds.com",
  "https://drinkflowkds.com",
  "https://www.drinkflowkds.com",
];
const allowedOrigins = Array.from(
  new Set([
    ...defaultAllowedOrigins,
    ...(CORS_ORIGIN
      ? CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
      : []),
  ])
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

let lastSquareSyncAt = 0;
let lastSquareSyncSuccessAt = 0;
let lastSquareSyncErrorAt = 0;
let lastSquareSyncError = "";
let lastSquareSyncSummary = {
  context: "startup",
  startedAt: null,
  finishedAt: null,
  fetchedOrders: 0,
  fetchedPaymentOrders: 0,
  dedupedOrders: 0,
  created: 0,
  updated: 0,
  saved: 0,
  failed: 0,
  storageFallback: 0,
};
let lastKnownActiveTickets = [];
let lastKnownActiveTicketsAt = 0;
let storageFallbackActive = false;
let storageFallbackLastError = "";
let lastSquareHealthCheckAt = 0;
let alertMailer = null;
let squareApiAlertState = {
  offline: false,
  lastAlertAt: 0,
  lastHealthyAt: Date.now(),
  lastError: "",
};
const squareCustomerNameCache = new Map();
const squareEmployeeNameCache = new Map();
let kdsPasswordState = {
  source: "unconfigured",
  passwordHash: null,
  passwordSalt: null,
  plaintextPassword: null,
};
let ownerPasswordState = {
  source: "env",
  passwordHash: null,
  passwordSalt: null,
  plaintextPassword: String(OWNER_PASSWORD),
};
let localDeveloperNotes = [];
let localAccessLogs = [];
let localCustomerInsights = [];
let localDrinkFlowOnboardingRequests = [];
let tickets = [
  {
    id: "local-101",
    orderNumber: "101",
    createdAt: Date.now() - 1000 * 60 * 3,
    source: "Local Test API",
    status: "new",
    diningOption: "Unspecified",
    items: [
      {
        name: "Latte",
        qty: 1,
        modifiers: ["Oat milk", "Vanilla"],
        note: "",
        category: "Coffee",
      },
    ],
  },
];

function getStaticDrinkNamesByCategory(category) {
  return ONLINE_ORDERING_BETA_MENU
    .filter((item) => item.category === category)
    .map((item) => item.name);
}

const COFFEE_DRINKS = new Set(getStaticDrinkNamesByCategory("Coffee"));
const NOT_COFFEE_DRINKS = new Set(getStaticDrinkNamesByCategory("Not Coffee"));
const SMOOTHIE_DRINKS = new Set(getStaticDrinkNamesByCategory("Smoothies"));
const GOLDIES_MENU_CATEGORIES = GOLDIES_MENU_CATEGORY_LABELS.map((category) => ({
  key: category,
  label: category,
  items: getStaticDrinkNamesByCategory(category),
}));
const GOLDIES_STATIC_MENU_PRICE_CENTS = new Map(
  ONLINE_ORDERING_BETA_MENU.map((item) => [item.name, item.priceCents])
);
let menuCatalogCache = { fetchedAt: 0, items: [] };
let squareCatalogCategoryCache = {
  fetchedAt: 0,
  audit: null,
  categoryByCatalogObjectId: new Map(),
};
let localMenuAvailability = [];

function normalizeName(name = "") {
  return String(name).trim();
}

function getAccessLogRetentionCutoff() {
  return new Date(Date.now() - ACCESS_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function getRequestIp(req) {
  const forwardedFor = String(req?.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  const directIp = cleanLeadText(req?.ip || req?.socket?.remoteAddress || "", 80);
  const candidate = forwardedFor || directIp;

  return candidate.replace(/^::ffff:/, "");
}

function trimLocalAccessLogs() {
  const cutoffTime = Date.parse(getAccessLogRetentionCutoff());
  localAccessLogs = localAccessLogs.filter((entry) => {
    const createdAt = Date.parse(entry.created_at || 0);
    return Number.isFinite(createdAt) && createdAt >= cutoffTime;
  });
}

function getCustomerInsightRetentionCutoff() {
  return new Date(Date.now() - CUSTOMER_INSIGHTS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function trimLocalCustomerInsights() {
  const cutoffTime = Date.parse(getCustomerInsightRetentionCutoff());
  localCustomerInsights = localCustomerInsights.filter((entry) => {
    const createdAt = Date.parse(entry.created_at || 0);
    return Number.isFinite(createdAt) && createdAt >= cutoffTime;
  });
}

function normalizeDrinkText(name = "") {
  return normalizeName(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripDrinkSizeDescriptors(value = "") {
  return normalizeDrinkText(value)
    .replace(/\([^)]*\b(?:oz|ounce|ounces|kid|kids|small|medium|large|regular)\b[^)]*\)/g, " ")
    .replace(/\b\d+\s*(?:oz|ounce|ounces)\b/g, " ")
    .replace(/\b(?:kid|kids|small|medium|large|regular)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGoldiesDrinkCategory(value = "") {
  const compact = normalizeDrinkText(value).replace(/\s+/g, "");

  if (compact === "coffee") return "Coffee";
  if (compact === "notcoffee" || compact === "noncoffee") return "Not Coffee";
  if (compact === "smoothie" || compact === "smoothies") return "Smoothies";

  return "";
}

function normalizeDiningOptionValue(value = "") {
  const normalized = String(value || "").trim();
  const lower = normalized.toLowerCase();

  if (
    lower.includes("delivery") ||
    lower.includes("shipment") ||
    lower.includes("shipping")
  ) {
    return "Delivery";
  }
  if (lower.includes("pickup") || lower.includes("pick up")) return "Pickup";
  if (lower.includes("drive")) return "Drive thru";
  if (
    lower.includes("hangin") ||
    lower.includes("hanging out") ||
    lower.includes("for here") ||
    lower.includes("dine") ||
    lower.includes("eat in") ||
    lower.includes("eatin")
  ) {
    return "HANGIN' OUT";
  }
  if (
    lower.includes("taking off") ||
    lower.includes("to go") ||
    lower.includes("togo") ||
    lower.includes("takeout") ||
    lower.includes("take out") ||
    lower.includes("carryout") ||
    lower.includes("carry out")
  ) {
    return "TAKING OFF";
  }
  return normalized;
}

function matchesAnyPattern(value, patterns = []) {
  const text = String(value || "").toLowerCase();
  return patterns.some((pattern) => pattern.test(text));
}

function isNonDrinkItem(itemName = "") {
  const lower = normalizeDrinkText(itemName);

  return matchesAnyPattern(lower, [
    /\bsanctuary\b/,
    /\bbamboo\b/,
    /\bsoap\b/,
    /\bshower steamer\b/,
    /\bbestseller\b/,
    /\bbagged coffee\b/,
    /\bcoffee beans\b/,
    /\bwhole bean\b/,
    /\bground coffee\b/,
    /\bbeans\b/,
    /\bretail\b/,
  ]);
}

function isSmoothieDrinkName(itemName = "") {
  const lower = stripDrinkSizeDescriptors(itemName);
  const compact = lower.replace(/\s+/g, "");

  if (lower.includes("smoothie")) return true;
  if (compact.includes("greens")) return true;
  if (compact.includes("strawberrybanana")) return true;
  if (compact.includes("strawberrymango")) return true;
  if (compact.includes("chocolatepbbanana")) return true;

  return [
    "mango",
    "strawberry",
    "greens",
    "chocolate p b banana",
    "chocolate pb banana",
    "strawberry banana",
    "strawberry mango",
  ].includes(lower);
}

function formatDrinkDisplayName(itemName = "") {
  const name = normalizeName(itemName).replace(/\s+/g, " ");
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .replace(/\bP\/B\b/g, "P/B")
    .replace(/\bOz\b/g, "oz")
    .replace(/\bDecaf\b/g, "DECAF");
}

function getCanonicalDrinkName(itemName = "") {
  const name = normalizeName(itemName);
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");

  if (compact.includes("strawmango")) return "Refresher - Strawberry Mango";
  if (lower.includes("refresher") && lower.includes("strawberry") && lower.includes("mango")) return "Refresher - Strawberry Mango";
  if (lower === "steamer") return "Steamer (Or Cold)";
  if (lower.includes("decaf") && lower.includes("americano")) return "Americano (DECAF)";

  if (isSmoothieDrinkName(name)) return formatDrinkDisplayName(name);

  const knownNames = [
    ...COFFEE_DRINKS,
    ...NOT_COFFEE_DRINKS,
    ...SMOOTHIE_DRINKS,
  ];
  const matched = knownNames.find((knownName) => normalizeDrinkText(knownName) === lower);
  if (matched) return matched;

  if (name && (name === name.toUpperCase() || name === name.toLowerCase())) {
    return formatDrinkDisplayName(name);
  }

  return name;
}

function getDrinkCategory(itemName = "") {
  const name = normalizeName(itemName);
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");
  const normalizedCategory = normalizeGoldiesDrinkCategory(itemName);

  if (isNonDrinkItem(name)) return null;
  if (normalizedCategory) return normalizedCategory;

  if (compact.includes("strawmango")) {
    return "Not Coffee";
  }

  if (COFFEE_DRINKS.has(name)) return "Coffee";
  if (NOT_COFFEE_DRINKS.has(name)) return "Not Coffee";
  if (SMOOTHIE_DRINKS.has(name)) return "Smoothies";

  if (
    matchesAnyPattern(lower, [
      /\bmatcha\b/,
      /\bchai\b/,
      /\btea\b/,
      /\bteas\b/,
      /\bsteamer\b/,
      /\brefresher\b/,
      /\bhot chocolate\b/,
      /\bfog\b/,
      /\bboba\b/,
    ])
  ) {
    return "Not Coffee";
  }

  if (
    matchesAnyPattern(lower, [
      /\blatte\b/,
      /\bcoffee\b/,
      /\bespresso\b/,
      /\bamericano\b/,
      /\bcappuccino\b/,
      /\bmocha\b/,
      /\bmacchiato\b/,
      /\bcold brew\b/,
      /\bcoldbrew\b/,
      /\bdrip\b/,
      /\bpour over\b/,
      /\bpourover\b/,
      /\bgibraltar\b/,
      /\bflat white\b/,
      /\bcortado\b/,
      /\bbreve\b/,
    ]) || compact.includes("icedcoffee") || compact.includes("hotcoffee")
  ) {
    return "Coffee";
  }

  if (isSmoothieDrinkName(name)) return "Smoothies";

  return null;
}

function getItemDrinkCategory(item = {}) {
  if (isNonDrinkItem(item.name)) return null;

  const savedCategory = normalizeGoldiesDrinkCategory(item.category);
  if (savedCategory) {
    return savedCategory;
  }

  return getDrinkCategory(item.name);
}

function getSquareRestBaseUrl() {
  return SQUARE_ENVIRONMENT === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

function getCatalogItemPrice(item = {}) {
  const variations = item?.itemData?.variations || item?.item_data?.variations || [];
  const prices = variations
    .map((variation) => {
      const variationData = variation.itemVariationData || variation.item_variation_data || {};
      return Number(
        variationData.priceMoney?.amount ?? variationData.price_money?.amount
      );
    })
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : null;
}

function buildStaticMenuItems() {
  return GOLDIES_MENU_CATEGORIES.map((category) => ({
    ...category,
    items: category.items
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const priceCents = GOLDIES_STATIC_MENU_PRICE_CENTS.get(name) || null;
        return {
          name,
          priceCents,
          price: priceCents ? formatCurrency(priceCents) : "Ask",
        };
      }),
  }));
}

function getGoldiesMenuCategoryOrder(category = "") {
  const index = GOLDIES_MENU_CATEGORIES.findIndex((entry) => entry.key === category);
  return index >= 0 ? index : GOLDIES_MENU_CATEGORIES.length;
}

function sortGoldiesMenuItems(a = {}, b = {}) {
  const categoryOrder = getGoldiesMenuCategoryOrder(a.category) - getGoldiesMenuCategoryOrder(b.category);
  if (categoryOrder !== 0) return categoryOrder;
  return String(a.itemName || a.name || "").localeCompare(String(b.itemName || b.name || ""));
}

function buildEmptyDrinkCategoryTotals() {
  return Object.fromEntries(GOLDIES_MENU_CATEGORY_LABELS.map((category) => [category, 0]));
}

function buildEmptyOwnerCategoryBuckets() {
  return Object.fromEntries(
    GOLDIES_MENU_CATEGORY_LABELS.map((category) => [
      category,
      { category, revenueCents: 0, taxCents: 0, totalCents: 0, units: 0 },
    ])
  );
}

function applyMenuAvailabilityRows(items = [], availabilityRows = []) {
  const availabilityByKey = new Map(
    (availabilityRows || []).map((row) => [
      normalizeMenuAvailabilityKey(row.item_key || row.item_name),
      row,
    ])
  );

  return items.map((item) => {
    const row = availabilityByKey.get(item.itemKey);
    return {
      ...item,
      available: row ? Boolean(row.available) : true,
      updatedAt: row?.updated_at || null,
    };
  });
}

function groupAvailabilityItemsForMenu(items = []) {
  const grouped = new Map();

  for (const item of items) {
    if (item.available === false) continue;
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push({
      name: item.itemName,
      squareName: item.squareName || item.itemName,
      priceCents: item.priceCents || null,
      price: item.price || (item.priceCents ? formatCurrency(item.priceCents) : "Ask"),
    });
  }

  return GOLDIES_MENU_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    items: (grouped.get(category.key) || []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

function buildStaticMenuAvailabilityItems() {
  return buildStaticMenuItems()
    .flatMap((category) =>
      (category.items || []).map((item) => ({
        itemKey: normalizeMenuAvailabilityKey(item.name),
        itemName: item.name,
        squareName: item.name,
        category: category.label,
        price: item.price,
        priceCents: item.priceCents || null,
        source: "static",
      }))
    )
    .sort(sortGoldiesMenuItems);
}

function buildCatalogMenuAvailabilityItems(catalogItems = [], recentPrices = new Map()) {
  const itemsByKey = new Map();

  for (const item of catalogItems) {
    const itemName = item.displayName || getCanonicalDrinkName(item.name);
    const category = normalizeGoldiesDrinkCategory(item.category) || getDrinkCategory(itemName);
    if (!itemName || !category) continue;

    const itemKey = normalizeMenuAvailabilityKey(itemName);
    if (!itemKey || itemsByKey.has(itemKey)) continue;

    const priceCents =
      item.priceCents ||
      recentPrices.get(normalizeDrinkText(item.name)) ||
      recentPrices.get(normalizeDrinkText(itemName)) ||
      GOLDIES_STATIC_MENU_PRICE_CENTS.get(itemName) ||
      null;
    itemsByKey.set(itemKey, {
      itemKey,
      itemName,
      squareName: item.name || itemName,
      category,
      price: priceCents ? formatCurrency(priceCents) : "Ask",
      priceCents,
      source: "square",
    });
  }

  return Array.from(itemsByKey.values()).sort(sortGoldiesMenuItems);
}

function normalizeMenuAvailabilityKey(name = "") {
  return normalizeDrinkText(name);
}

function isMenuItemAvailable(item = {}, unavailableKeys = new Set()) {
  return !unavailableKeys.has(normalizeMenuAvailabilityKey(item.name));
}

function getCatalogCategoryIds(itemData = {}) {
  return [
    itemData.reporting_category?.id,
    itemData.reportingCategory?.id,
    itemData.category_id,
    itemData.categoryId,
    ...(itemData.categories || []).map((category) => category.id),
  ].filter(Boolean);
}

async function fetchSquareDrinkCategoryAudit({ force = false } = {}) {
  if (!SQUARE_ACCESS_TOKEN) {
    return {
      ok: false,
      error: "Square access token is not configured.",
      categories: Object.fromEntries(GOLDIES_MENU_CATEGORY_LABELS.map((category) => [category, []])),
      missingCategories: [...GOLDIES_MENU_CATEGORY_LABELS],
      mismatches: [],
      categoryByCatalogObjectId: new Map(),
      checkedAt: new Date().toISOString(),
    };
  }

  const now = Date.now();
  if (!force && squareCatalogCategoryCache.audit && now - squareCatalogCategoryCache.fetchedAt < 10 * 60 * 1000) {
    return squareCatalogCategoryCache.audit;
  }

  const objects = await fetchSquareCatalogObjects(["ITEM", "ITEM_VARIATION", "CATEGORY"]);
  const categoryNamesById = new Map(
    objects
      .filter((object) => object.type === "CATEGORY" && !object.is_deleted)
      .map((object) => {
        const categoryData = object.category_data || object.categoryData || {};
        return [object.id, categoryData.name || ""];
      })
  );
  const categoryByCatalogObjectId = new Map();
  const categories = Object.fromEntries(GOLDIES_MENU_CATEGORY_LABELS.map((category) => [category, []]));
  const missingCategorySet = new Set(GOLDIES_MENU_CATEGORY_LABELS);
  const mismatches = [];

  for (const name of categoryNamesById.values()) {
    const normalizedCategory = normalizeGoldiesDrinkCategory(name);
    if (normalizedCategory) missingCategorySet.delete(normalizedCategory);
  }

  for (const object of objects) {
    if (object.type !== "ITEM" || object.is_deleted) continue;

    const itemData = object.item_data || object.itemData || {};
    const squareCategory = getCatalogCategoryIds(itemData)
      .map((id) => normalizeGoldiesDrinkCategory(categoryNamesById.get(id)))
      .find(Boolean);

    if (!squareCategory) continue;

    const itemName = itemData.name || "";
    const kdsCategory = getDrinkCategory(itemName);
    const displayName = getCanonicalDrinkName(itemName);
    const record = {
      id: object.id,
      name: displayName,
      squareName: itemName,
      squareCategory,
      kdsCategory: kdsCategory || "",
    };

    categories[squareCategory].push(record);
    categoryByCatalogObjectId.set(object.id, squareCategory);

    for (const variationRef of itemData.variations || []) {
      if (variationRef?.id) categoryByCatalogObjectId.set(variationRef.id, squareCategory);
    }

    if (kdsCategory !== squareCategory) {
      mismatches.push(record);
    }
  }

  for (const category of Object.keys(categories)) {
    categories[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  const audit = {
    ok: missingCategorySet.size === 0 && mismatches.length === 0,
    categories,
    missingCategories: Array.from(missingCategorySet),
    mismatches,
    categoryByCatalogObjectId,
    checkedAt: new Date().toISOString(),
  };

  squareCatalogCategoryCache = {
    fetchedAt: now,
    audit,
    categoryByCatalogObjectId,
  };

  return audit;
}

async function getSquareCatalogDrinkCategoryMap() {
  const audit = await fetchSquareDrinkCategoryAudit();
  return audit.categoryByCatalogObjectId || new Map();
}

async function getMenuAvailabilityRows() {
  if (!supabase) return localMenuAvailability;

  const { data, error } = await supabase
    .from("kds_menu_availability")
    .select("item_key, item_name, available, updated_at")
    .order("item_name", { ascending: true });

  if (error) {
    console.error("Error fetching menu availability:", error.message);
    return [];
  }

  return data || [];
}

async function getUnavailableMenuKeys() {
  const rows = await getMenuAvailabilityRows();
  return new Set(
    (rows || [])
      .filter((row) => row && row.available === false)
      .map((row) => normalizeMenuAvailabilityKey(row.item_key || row.item_name))
      .filter(Boolean)
  );
}

async function setMenuAvailability(itemName, available) {
  const cleanName = normalizeName(itemName).slice(0, 160);
  const itemKey = normalizeMenuAvailabilityKey(cleanName);
  if (!cleanName || !itemKey) {
    const error = new Error("Menu item name is required.");
    error.statusCode = 400;
    throw error;
  }

  const row = {
    item_key: itemKey,
    item_name: cleanName,
    available: Boolean(available),
    updated_at: new Date().toISOString(),
  };

  if (!supabase) {
    const index = localMenuAvailability.findIndex((entry) => entry.item_key === itemKey);
    if (index >= 0) localMenuAvailability[index] = row;
    else localMenuAvailability.push(row);
    return row;
  }

  const { data, error } = await supabase
    .from("kds_menu_availability")
    .upsert(row, { onConflict: "item_key" })
    .select("item_key, item_name, available, updated_at")
    .single();

  if (error) throw error;
  return data || row;
}

async function fetchSquareMenuCatalogItems() {
  if (!SQUARE_ACCESS_TOKEN) return [];

  const now = Date.now();
  if (now - menuCatalogCache.fetchedAt < 10 * 60 * 1000) {
    return menuCatalogCache.items;
  }

  const objects = await fetchSquareCatalogObjects(["ITEM", "ITEM_VARIATION", "CATEGORY"]);
  const byId = new Map(objects.map((object) => [object.id, object]));
  const categoryNamesById = new Map(
    objects
      .filter((object) => object.type === "CATEGORY" && !object.is_deleted)
      .map((object) => {
        const categoryData = object.category_data || object.categoryData || {};
        return [object.id, categoryData.name || ""];
      })
  );

  menuCatalogCache = {
    fetchedAt: now,
    items: objects
      .filter((object) => object.type === "ITEM" && !object.is_deleted)
      .map((object) => {
        const itemData = object.itemData || object.item_data || {};
        if (!isCatalogObjectPresentAtLocation(itemData)) return null;

        const category = getCatalogCategoryIds(itemData)
          .map((id) => normalizeGoldiesDrinkCategory(categoryNamesById.get(id)))
          .find(Boolean);
        if (!category) return null;

        const prices = (itemData.variations || [])
          .map((variationRef) => byId.get(variationRef.id) || variationRef)
          .filter((variation) => {
            const variationData = variation?.itemVariationData || variation?.item_variation_data || {};
            return variation && !variation.is_deleted && isCatalogObjectPresentAtLocation(variationData);
          })
          .map((variation) => {
            const variationData = variation.itemVariationData || variation.item_variation_data || {};
            return Number(
              variationData.priceMoney?.amount ?? variationData.price_money?.amount
            );
          })
          .filter((price) => Number.isFinite(price) && price > 0);

        return {
          id: object.id,
          name: itemData.name || "",
          displayName: getCanonicalDrinkName(itemData.name || ""),
          category,
          priceCents: prices.length ? Math.min(...prices) : null,
        };
      })
      .filter(Boolean)
      .filter((item) => item.name && getDrinkCategory(item.name)),
  };

  return menuCatalogCache.items;
}

async function getGoldiesMenuBoard() {
  const staticMenu = buildStaticMenuItems();

  try {
    const [catalogItems, recentPrices, availabilityRows] = await Promise.all([
      fetchSquareMenuCatalogItems(),
      fetchRecentMenuPrices(),
      getMenuAvailabilityRows(),
    ]);

    if (catalogItems.length) {
      return groupAvailabilityItemsForMenu(
        applyMenuAvailabilityRows(
          buildCatalogMenuAvailabilityItems(catalogItems, recentPrices),
          availabilityRows
        )
      );
    }

    return groupAvailabilityItemsForMenu(
      applyMenuAvailabilityRows(buildStaticMenuAvailabilityItems(), availabilityRows)
    );
  } catch (error) {
    console.error("Error building menu board from Square catalog:", error.message);
    try {
      const availabilityRows = await getMenuAvailabilityRows();
      return groupAvailabilityItemsForMenu(
        applyMenuAvailabilityRows(buildStaticMenuAvailabilityItems(), availabilityRows)
      );
    } catch (_availabilityError) {
      return staticMenu;
    }
  }
}

async function fetchRecentMenuPrices() {
  const prices = new Map();
  if (!supabase) return prices;

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("raw_order")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("Error fetching recent menu prices:", error.message);
    return prices;
  }

  for (const order of orders || []) {
    const lineItems = order.raw_order?.lineItems || order.raw_order?.line_items || [];
    for (const lineItem of lineItems) {
      const name = lineItem.name || "";
      if (!getDrinkCategory(name)) continue;

      const key = normalizeDrinkText(name);
      if (prices.has(key)) continue;

      const qty = Number.parseFloat(lineItem.quantity || "1") || 1;
      const totalCents = getLineItemAmountCents(lineItem);
      const taxCents = getLineItemTaxCents(lineItem);
      const unitCents = Math.round(Math.max(totalCents - taxCents, 0) / qty);
      if (unitCents > 0) prices.set(key, unitCents);
    }
  }

  return prices;
}

async function getCustomerOrdersUp() {
  const active = await getActiveTickets();
  const dayTickets = await getTicketsForDay(getShopDateString()).catch(() => []);
  const completedToday = dayTickets.filter((ticket) => isCompletedStatus(ticket.status));
  const fallbackCompleted = active.filter(
    (ticket) => isCompletedStatus(ticket.status) && Number(ticket.completedAt || ticket.updatedAt || 0) > 0
  );
  const completed = completedToday.length ? completedToday : fallbackCompleted;
  const recentCompletedCutoff = Date.now() - 15 * 60 * 1000;
  const uniqueCompleted = new Map();

  for (const ticket of completed) {
    uniqueCompleted.set(ticket.id, ticket);
  }

  const making = active
    .filter((ticket) => ticket.status === "making" && ticketHasDrinkItem(ticket))
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    .map((ticket) => ({
      id: ticket.id,
      orderNumber: ticket.orderNumber || ticket.id,
      customerName: ticket.customerName || "",
      diningOption: ticket.diningOption || "Pickup",
      source: ticket.source || "Square",
      isOnlineOrder: isOnlineOrderTicket(ticket),
      items: getDisplayDrinkItems(ticket),
      status: "Being made",
      startedAt: ticket.updatedAt || ticket.createdAt || null,
    }));

  const ready = active
    .filter((ticket) => ticket.status === "ready" && ticketHasDrinkItem(ticket))
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    .map((ticket) => ({
      id: ticket.id,
      orderNumber: ticket.orderNumber || ticket.id,
      customerName: ticket.customerName || "",
      diningOption: ticket.diningOption || "Pickup",
      source: ticket.source || "Square",
      isOnlineOrder: isOnlineOrderTicket(ticket),
      items: getDisplayDrinkItems(ticket),
      status: "Ready",
      readyAt: ticket.updatedAt || ticket.createdAt || null,
    }));

  const recentlyCompleted = Array.from(uniqueCompleted.values())
    .filter(
      (ticket) =>
        ticketHasDrinkItem(ticket) &&
        Number(ticket.completedAt || ticket.updatedAt || 0) >= recentCompletedCutoff
    )
    .sort(
      (a, b) =>
        Number(b.completedAt || b.updatedAt || 0) -
        Number(a.completedAt || a.updatedAt || 0)
    )
    .slice(0, 8)
    .map((ticket) => ({
      id: ticket.id,
      orderNumber: ticket.orderNumber || ticket.id,
      customerName: ticket.customerName || "",
      diningOption: ticket.diningOption || "Pickup",
      source: ticket.source || "Square",
      isOnlineOrder: isOnlineOrderTicket(ticket),
      items: getDisplayDrinkItems(ticket),
      status: "Picked up",
      completedAt: ticket.completedAt || ticket.updatedAt || null,
    }));

  return { making, ready, recentlyCompleted, updatedAt: new Date().toISOString() };
}

function isOnlineOrderTicket(ticket = {}) {
  const source = String(ticket.source || "").toLowerCase();
  const rawOrder = ticket.rawOrder || ticket.raw_order || {};
  const rawSource = String(rawOrder.source?.name || "").toLowerCase();
  const drinkflowSource = String(
    rawOrder.metadata?.drinkflow_source || rawOrder.metadata?.drinkflowSource || ""
  ).toLowerCase();

  return source.includes("online order") || rawSource.includes("drinkflow online") || drinkflowSource.includes("online");
}

function isPickupDriveThruTicket(ticket = {}) {
  const option = String(ticket.diningOption || "").trim().toLowerCase();
  return option.includes("pickup") || option.includes("drive");
}

async function getDriveThruDisplay() {
  const active = await getActiveTickets();
  const displayStatuses = new Set(["new", "making", "ready"]);

  const orders = active
    .filter(
      (ticket) =>
        displayStatuses.has(ticket.status) &&
        ticketHasDrinkItem(ticket) &&
        isPickupDriveThruTicket(ticket)
    )
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    .map((ticket) => ({
      id: ticket.id,
      orderNumber: ticket.orderNumber || ticket.id,
      customerName: ticket.customerName || "",
      diningOption: ticket.diningOption || "Pickup",
      status: ticket.status,
      createdAt: ticket.createdAt || null,
      updatedAt: ticket.updatedAt || ticket.createdAt || null,
      items: getDisplayDrinkItems(ticket),
    }));

  return { orders, updatedAt: new Date().toISOString() };
}

function sanitizeStatus(status) {
  return VALID_STATUSES.has(status) ? status : "new";
}

function toJsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue
    )
  );
}

function appendStatusEvent(rawOrder, status, at) {
  const base =
    rawOrder && typeof rawOrder === "object" && !Array.isArray(rawOrder)
      ? rawOrder
      : {};
  const existingEvents = Array.isArray(base.kdsStatusEvents)
    ? base.kdsStatusEvents
    : [];

  return toJsonSafe({
    ...base,
    kdsStatusEvents: [
      ...existingEvents.slice(-49),
      {
        status,
        at,
      },
    ],
  });
}

function getCompletedItemKeys(rawOrder) {
  if (!rawOrder || typeof rawOrder !== "object") return [];
  if (!Array.isArray(rawOrder.kdsCompletedItemKeys)) return [];

  return rawOrder.kdsCompletedItemKeys.map((itemKey) => String(itemKey));
}

function setCompletedItemKey(rawOrder, itemKey, done) {
  const base =
    rawOrder && typeof rawOrder === "object" && !Array.isArray(rawOrder)
      ? rawOrder
      : {};
  const normalizedKey = String(itemKey || "").trim();
  const existing = new Set(getCompletedItemKeys(base));

  if (normalizedKey) {
    if (done) {
      existing.add(normalizedKey);
    } else {
      existing.delete(normalizedKey);
    }
  }

  return toJsonSafe({
    ...base,
    kdsCompletedItemKeys: Array.from(existing),
  });
}

function getStatusEvents(rawOrder) {
  if (!rawOrder || typeof rawOrder !== "object") return [];
  if (!Array.isArray(rawOrder.kdsStatusEvents)) return [];

  return rawOrder.kdsStatusEvents
    .map((event) => ({
      status: sanitizeStatus(event.status),
      at: new Date(event.at).getTime(),
    }))
    .filter((event) => Number.isFinite(event.at))
    .sort((a, b) => a.at - b.at);
}

function isCompletedStatus(status) {
  return status === "completed" || status === "done";
}

function formatDurationSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Collecting";

  const rounded = Math.round(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;

  if (mins < 1) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function summarizeDurationSamples(samples = []) {
  const durations = samples
    .map((sample) => Number(sample.durationMs))
    .filter((duration) => Number.isFinite(duration) && duration > 0);
  const averageSeconds = durations.length
    ? Math.round(
        durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length /
          1000
      )
    : 0;

  return {
    averageSeconds,
    label: formatDurationSeconds(averageSeconds),
    sampleSize: durations.length,
  };
}

function formatHourLabel(hour) {
  const normalized = ((Number(hour) || 0) + 24) % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const display = normalized % 12 || 12;
  return `${display} ${suffix}`;
}

function getDurationBreakdowns(samples = []) {
  const byHour = new Map();
  const byDrinkName = new Map();

  for (const sample of samples) {
    const readyAt = Number(sample.readyAt || sample.completedAt || 0);
    if (Number.isFinite(readyAt) && readyAt > 0) {
      const hour = getShopDateParts(new Date(readyAt)).hour;
      const existing = byHour.get(hour) || [];
      existing.push(sample);
      byHour.set(hour, existing);
    }

    for (const item of sample.items || []) {
      const name = getCanonicalDrinkName(cleanOrderText(item.name, 160));
      if (!name) continue;
      const qty = Math.max(Number(item.qty || item.quantity || 1) || 1, 1);
      const existing = byDrinkName.get(name) || [];
      for (let i = 0; i < qty; i += 1) {
        existing.push(sample);
      }
      byDrinkName.set(name, existing);
    }
  }

  return {
    byHour: [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, hourSamples]) => ({
        hour,
        hourLabel: formatHourLabel(hour),
        ...summarizeDurationSamples(hourSamples),
      })),
    byDrinkName: [...byDrinkName.entries()]
      .map(([name, drinkSamples]) => ({
        name,
        ...summarizeDurationSamples(drinkSamples),
      }))
      .filter((item) => item.sampleSize > 0)
      .sort(
        (a, b) =>
          b.sampleSize - a.sampleSize ||
          b.averageSeconds - a.averageSeconds ||
          a.name.localeCompare(b.name)
      )
      .slice(0, 20),
  };
}

function getMoneyAmountCents(money) {
  const amount = Number(money?.amount ?? money?.amount_money ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getLineItemAmountCents(lineItem = {}) {
  const total =
    getMoneyAmountCents(lineItem.totalMoney) ||
    getMoneyAmountCents(lineItem.total_money) ||
    getMoneyAmountCents(lineItem.grossSalesMoney) ||
    getMoneyAmountCents(lineItem.gross_sales_money);
  if (total) return total;

  const unit =
    getMoneyAmountCents(lineItem.basePriceMoney) ||
    getMoneyAmountCents(lineItem.base_price_money) ||
    getMoneyAmountCents(lineItem.variationTotalPriceMoney) ||
    getMoneyAmountCents(lineItem.variation_total_price_money);
  const qty = Number.parseFloat(lineItem.quantity || "1") || 1;
  return Math.round(unit * qty);
}

function getLineItemTaxCents(lineItem = {}) {
  return (
    getMoneyAmountCents(lineItem.totalTaxMoney) ||
    getMoneyAmountCents(lineItem.total_tax_money) ||
    getMoneyAmountCents(lineItem.taxMoney) ||
    getMoneyAmountCents(lineItem.tax_money)
  );
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

function parseDateKey(value = "") {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function formatDateKeyFromParts({ year, month, day }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysToDateKey(dateKey, days) {
  const parts = parseDateKey(dateKey);
  if (!parts) return "";

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatDateKeyFromParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function getTimeZoneOffsetMs(date, timeZone = SHOP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "0";
  const localAsUtc = Date.UTC(
    Number(getPart("year")),
    Number(getPart("month")) - 1,
    Number(getPart("day")),
    Number(getPart("hour")),
    Number(getPart("minute")),
    Number(getPart("second"))
  );

  return localAsUtc - date.getTime();
}

function getShopDateTime(dateKey, hour = 0, minute = 0, second = 0, millisecond = 0) {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;

  const desiredUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    minute,
    second,
    millisecond
  );
  let timestamp = desiredUtc;

  for (let index = 0; index < 3; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(timestamp), SHOP_TIME_ZONE);
    timestamp = desiredUtc - offset;
  }

  return new Date(timestamp);
}

function getShopDayRangeFromKey(dateKey) {
  const start = getShopDateTime(dateKey);
  const nextDateKey = addDaysToDateKey(dateKey, 1);
  const nextStart = getShopDateTime(nextDateKey);

  if (!start || !nextStart) return null;
  return { start, end: new Date(nextStart.getTime() - 1) };
}

function getLocalDateKey(date = new Date()) {
  return getShopDateString(date);
}

function getMonthRange(monthValue = "") {
  const match = String(monthValue || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);

  return { start, end };
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function snapshotsTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("kds_owner_snapshots") ||
    message.includes("Could not find the table")
  );
}

function customerInsightsTableMissing(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("kds_customer_insights") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName) return cookies;

    cookies[rawName] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

function encodeSessionPayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeSessionPayload(payload) {
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function signSession(payload) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(String(payload))
    .digest("hex");
}

function createSessionToken(employeeName) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = encodeSessionPayload({
    expiresAt,
    employeeName: normalizeName(employeeName),
    role: "staff",
  });
  return `${payload}.${signSession(payload)}`;
}

function createOwnerSessionToken(ownerName = "Owner") {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = encodeSessionPayload({
    expiresAt,
    ownerName: normalizeName(ownerName) || "Owner",
    role: "owner",
  });
  return `${payload}.${signSession(payload)}`;
}

function createDeveloperSessionToken(username = DEVELOPER_USERNAME) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = encodeSessionPayload({
    expiresAt,
    username: normalizeName(username) || DEVELOPER_USERNAME,
    role: "developer",
  });
  return `${payload}.${signSession(payload)}`;
}

function getSessionFromToken(token) {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signSession(payload);
  if (signature.length !== expectedSignature.length) return null;

  const matches = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!matches) return null;

  const parsed = decodeSessionPayload(payload);
  if (!parsed || !parsed.expiresAt || parsed.expiresAt <= Date.now()) return null;

  return {
    expiresAt: parsed.expiresAt,
    employeeName: normalizeName(parsed.employeeName || ""),
    ownerName: normalizeName(parsed.ownerName || ""),
    username: normalizeName(parsed.username || ""),
    role: parsed.role || "staff",
  };
}

function isValidSessionToken(token) {
  return Boolean(getSessionFromToken(token));
}

function getCookieOptions(maxAge = SESSION_MAX_AGE_MS) {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    `HttpOnly`,
    `Path=/`,
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    `SameSite=${isProduction ? "None" : "Lax"}`,
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function normalizePasswordInput(password = "") {
  return String(password || "").trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");

  return {
    salt,
    hash,
  };
}

function verifyPassword(password, salt, hash) {
  const candidate = normalizePasswordInput(password);
  if (!candidate || !salt || !hash) return false;

  try {
    const derived = crypto.scryptSync(candidate, salt, 64);
    const expected = Buffer.from(hash, "hex");

    if (derived.length !== expected.length) return false;

    return crypto.timingSafeEqual(derived, expected);
  } catch (error) {
    return false;
  }
}

function isKdsLoginConfigured() {
  return (
    kdsPasswordState.source === "supabase" ||
    kdsPasswordState.source === "env" ||
    kdsPasswordState.source === "memory" ||
    kdsPasswordState.source === "fallback"
  );
}

async function loadKdsPasswordState() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("kds_settings")
        .select("setting_key, password_hash, password_salt, updated_at")
        .eq("setting_key", KDS_PASSWORD_SETTING_KEY)
        .maybeSingle();

      if (error) throw error;

      if (data?.password_hash && data?.password_salt) {
        kdsPasswordState = {
          source: "supabase",
          passwordHash: data.password_hash,
          passwordSalt: data.password_salt,
          plaintextPassword: null,
        };

        return kdsPasswordState;
      }
    } catch (error) {
      console.warn(
        `WARNING: Unable to load stored KDS password from Supabase: ${error.message}. Falling back to environment password if available.`
      );
    }
  }

  const fallbackPassword = process.env.KDS_PASSWORD || "espresso";

  if (KDS_PASSWORD) {
    kdsPasswordState = {
      source: "env",
      passwordHash: null,
      passwordSalt: null,
      plaintextPassword: String(KDS_PASSWORD),
    };
  } else {
    kdsPasswordState = {
      source: "fallback",
      passwordHash: null,
      passwordSalt: null,
      plaintextPassword: String(fallbackPassword),
    };
  }

  return kdsPasswordState;
}

async function persistKdsPassword(password) {
  const normalizedPassword = normalizePasswordInput(password);
  if (!normalizedPassword) {
    const error = new Error("New password cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const { salt, hash } = hashPassword(normalizedPassword);

  if (supabase) {
    const { error } = await supabase.from("kds_settings").upsert(
      {
        setting_key: KDS_PASSWORD_SETTING_KEY,
        password_hash: hash,
        password_salt: salt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" }
    );

    if (error) throw error;

    kdsPasswordState = {
      source: "supabase",
      passwordHash: hash,
      passwordSalt: salt,
      plaintextPassword: null,
    };

    return {
      source: "supabase",
      passwordLength: normalizedPassword.length,
    };
  }

  kdsPasswordState = {
    source: "memory",
    passwordHash: hash,
    passwordSalt: salt,
    plaintextPassword: null,
  };

  return {
    source: "memory",
    passwordLength: normalizedPassword.length,
  };
}

async function loadOwnerPasswordState() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("kds_settings")
        .select("setting_key, password_hash, password_salt, updated_at")
        .eq("setting_key", OWNER_PASSWORD_SETTING_KEY)
        .maybeSingle();

      if (error) throw error;

      if (data?.password_hash && data?.password_salt) {
        ownerPasswordState = {
          source: "supabase",
          passwordHash: data.password_hash,
          passwordSalt: data.password_salt,
          plaintextPassword: null,
        };

        return ownerPasswordState;
      }
    } catch (error) {
      console.warn(
        `WARNING: Unable to load stored owner password from Supabase: ${error.message}. Falling back to environment owner password.`
      );
    }
  }

  ownerPasswordState = {
    source: "env",
    passwordHash: null,
    passwordSalt: null,
    plaintextPassword: String(OWNER_PASSWORD),
  };

  return ownerPasswordState;
}

async function persistOwnerPassword(password) {
  const normalizedPassword = normalizePasswordInput(password);
  if (!normalizedPassword) {
    const error = new Error("New owner password cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const { salt, hash } = hashPassword(normalizedPassword);

  if (supabase) {
    const { error } = await supabase.from("kds_settings").upsert(
      {
        setting_key: OWNER_PASSWORD_SETTING_KEY,
        password_hash: hash,
        password_salt: salt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" }
    );

    if (error) throw error;

    ownerPasswordState = {
      source: "supabase",
      passwordHash: hash,
      passwordSalt: salt,
      plaintextPassword: null,
    };

    return {
      source: "supabase",
      passwordLength: normalizedPassword.length,
    };
  }

  ownerPasswordState = {
    source: "memory",
    passwordHash: hash,
    passwordSalt: salt,
    plaintextPassword: null,
  };

  return {
    source: "memory",
    passwordLength: normalizedPassword.length,
  };
}

function isPasswordMatch(password) {
  const normalizedPassword = normalizePasswordInput(password);
  if (!normalizedPassword || !isKdsLoginConfigured()) return false;

  if (kdsPasswordState.source === "supabase" || kdsPasswordState.source === "memory") {
    return verifyPassword(
      normalizedPassword,
      kdsPasswordState.passwordSalt,
      kdsPasswordState.passwordHash
    );
  }

  if (kdsPasswordState.source === "env" || kdsPasswordState.source === "fallback") {
    const provided = Buffer.from(normalizedPassword);
    const expected = Buffer.from(String(kdsPasswordState.plaintextPassword || ""));

    return (
      provided.length === expected.length &&
      crypto.timingSafeEqual(provided, expected)
    );
  }

  return false;
}

function isOwnerPasswordMatch(password) {
  const normalizedPassword = normalizePasswordInput(password);
  if (!normalizedPassword) return false;

  if (ownerPasswordState.source === "supabase" || ownerPasswordState.source === "memory") {
    return verifyPassword(
      normalizedPassword,
      ownerPasswordState.passwordSalt,
      ownerPasswordState.passwordHash
    );
  }

  const provided = Buffer.from(normalizedPassword);
  const expected = Buffer.from(String(ownerPasswordState.plaintextPassword || ""));

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

function isDeveloperLoginMatch(username, password) {
  const normalizedUsername = normalizeName(username);
  const expectedUsername = normalizeName(DEVELOPER_USERNAME);

  if (!normalizedUsername || normalizedUsername !== expectedUsername) return false;

  return verifyPassword(password, DEVELOPER_PASSWORD_SALT, DEVELOPER_PASSWORD_HASH);
}

function requireKdsAuth(req, res, next) {
  if (!isKdsLoginConfigured()) {
    return res.status(503).json({
      error: "KDS login is not configured. Set a password in the backend.",
    });
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[SESSION_COOKIE_NAME]);

  if (!session) {
    return res.status(401).json({ error: "Login required" });
  }

  req.kdsSession = session;
  return next();
}

function requireDeveloperAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[DEVELOPER_SESSION_COOKIE_NAME]);

  if (!session || session.role !== "developer") {
    return res.status(401).json({ error: "Studio Samantha login required" });
  }

  req.developerSession = session;
  return next();
}

function requireOwnerAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[OWNER_SESSION_COOKIE_NAME]);

  if (!session || session.role !== "owner") {
    return res.status(401).json({ error: "Owner login required" });
  }

  req.ownerSession = session;
  return next();
}

function requireKdsOrOwnerAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  const kdsSession = getSessionFromToken(cookies[SESSION_COOKIE_NAME]);
  const ownerSession = getSessionFromToken(cookies[OWNER_SESSION_COOKIE_NAME]);

  if (kdsSession) {
    req.kdsSession = kdsSession;
    return next();
  }

  if (ownerSession?.role === "owner") {
    req.ownerSession = ownerSession;
    return next();
  }

  return res.status(401).json({ error: "Login required" });
}

function addTicket(ticket) {
  const existingIndex = tickets.findIndex((existing) => existing.id === ticket.id);

  if (existingIndex === -1) {
    tickets.unshift(ticket);
  } else {
    tickets[existingIndex] = {
      ...tickets[existingIndex],
      ...ticket,
      status: tickets[existingIndex].status || ticket.status,
      completedAt: tickets[existingIndex].completedAt || ticket.completedAt,
    };
  }

  return ticket;
}

function updateLocalTicketStatus(id, status) {
  const completedAt =
    status === "completed" || status === "done" ? Date.now() : null;

  tickets = tickets.map((ticket) =>
    ticket.id === id
      ? {
          ...ticket,
          status,
          completedAt: completedAt || ticket.completedAt,
        }
      : ticket
  );
}

function updateLocalTicketItemDone(id, itemKey, done) {
  const normalizedKey = String(itemKey || "").trim();

  tickets = tickets.map((ticket) =>
    ticket.id === id
      ? {
          ...ticket,
          items: (ticket.items || []).map((item, index) => {
            const candidateKey = String(item.id || index);
            return candidateKey === normalizedKey
              ? { ...item, done: Boolean(done) }
              : item;
          }),
        }
      : ticket
  );
}

function updateLocalTicketName(id, customerName) {
  tickets = tickets.map((ticket) =>
    ticket.id === id ? { ...ticket, customerName } : ticket
  );
}

function updateLocalTicketDiningOption(id, diningOption) {
  tickets = tickets.map((ticket) =>
    ticket.id === id ? { ...ticket, diningOption } : ticket
  );
}

function getLocalActiveTickets() {
  return tickets.filter((ticket) => ticket.status !== "done");
}

async function fetchSquareOrders() {
  try {
    const { ordersApi } = squareClient;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const locations = await getSquareLocations();
    const locationIds = uniqueLocationIds(locations);
    const orders = [];

    for (const locationId of locationIds) {
      try {
        const response = await ordersApi.searchOrders({
          locationIds: [locationId],
          query: {
            filter: {
              dateTimeFilter: {
                createdAt: {
                  startAt: yesterday.toISOString(),
                  endAt: now.toISOString(),
                },
              },
              stateFilter: {
                states: ["OPEN", "COMPLETED"],
              },
            },
            sort: {
              sortField: "CREATED_AT",
              sortOrder: "DESC",
            },
          },
        });

        orders.push(...(response.result.orders || []));
      } catch (error) {
        console.error(`Error searching Square orders for location ${locationId}:`, error.message);
      }
    }

    return dedupeOrders(orders);
  } catch (error) {
    console.error("Error fetching Square orders:", error.message);
    return [];
  }
}

async function fetchSquarePayments() {
  try {
    const { paymentsApi } = squareClient;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const locations = await getSquareLocations();
    const locationIds = uniqueLocationIds(locations);
    const payments = [];

    for (const locationId of locationIds) {
      try {
        const response = await paymentsApi.listPayments(
          yesterday.toISOString(),
          now.toISOString(),
          "DESC",
          undefined,
          locationId,
          undefined,
          undefined,
          undefined,
          100
        );
        payments.push(...(response.result.payments || []));
      } catch (error) {
        console.error(
          `Error fetching Square payments for location ${locationId}:`,
          error.message
        );
      }
    }

    return dedupePayments(payments);
  } catch (error) {
    console.error("Error fetching Square payments:", error.message);
    return [];
  }
}

async function buildPaymentEmployeeMap(payments = []) {
  const employeeMap = new Map();
  const teamMemberIds = [...new Set(
    payments
      .map((payment) => String(payment.teamMemberId || payment.employeeId || "").trim())
      .filter(Boolean)
  )];

  const namesByTeamMemberId = new Map();

  for (const teamMemberId of teamMemberIds) {
    const name = await getSquareTeamMemberName(teamMemberId);
    namesByTeamMemberId.set(teamMemberId, name);
  }

  for (const payment of dedupePayments(payments)) {
    if (!payment.orderId) continue;

    const teamMemberId = String(payment.teamMemberId || payment.employeeId || "").trim();
    const employeeName = teamMemberId ? namesByTeamMemberId.get(teamMemberId) || "" : "";
    if (employeeName) {
      employeeMap.set(payment.orderId, employeeName);
      continue;
    }

    if (!employeeMap.has(payment.orderId)) {
      employeeMap.set(payment.orderId, "");
    }
  }

  return employeeMap;
}

async function fetchSquarePaymentOrders(payments = null) {
  try {
    const { ordersApi } = squareClient;
    const paymentList = payments || (await fetchSquarePayments());
    const orders = [];

    for (const payment of paymentList) {
      if (!payment.orderId) continue;

      try {
        const orderResponse = await ordersApi.retrieveOrder(payment.orderId);
        if (orderResponse.result.order) {
          orders.push(orderResponse.result.order);
        }
      } catch (error) {
        console.error(
          `Error retrieving Square order for payment ${payment.id}:`,
          error.message
        );
      }
    }

    return orders;
  } catch (error) {
    console.error("Error fetching Square payment orders:", error.message);
    return [];
  }
}

function dedupeOrders(orders) {
  const byId = new Map();

  for (const order of orders) {
    if (order?.id) byId.set(order.id, order);
  }

  return Array.from(byId.values());
}

function dedupePayments(payments) {
  const byId = new Map();

  for (const payment of payments) {
    if (payment?.id) byId.set(payment.id, payment);
  }

  return Array.from(byId.values());
}

function uniqueLocationIds(locations = []) {
  const ids = new Set([SQUARE_LOCATION_ID]);

  for (const location of locations) {
    if (location?.id) ids.add(location.id);
  }

  return Array.from(ids).filter(Boolean);
}

async function getSquareLocations() {
  try {
    const { locationsApi } = squareClient;
    const response = await locationsApi.listLocations();
    return response.result.locations || [];
  } catch (error) {
    console.error("Error listing Square locations:", error.message);
    return [];
  }
}

async function probeSquareApiHealth() {
  const now = Date.now();
  if (now - lastSquareHealthCheckAt < SQUARE_HEALTH_CHECK_INTERVAL_MS) return;

  lastSquareHealthCheckAt = now;

  try {
    const { locationsApi, ordersApi } = squareClient;
    const locationsResponse = await locationsApi.listLocations();
    const locations = locationsResponse.result.locations || [];
    const locationIds = uniqueLocationIds(locations);
    const probeLocationId = locationIds[0];

    if (!probeLocationId) {
      throw new Error("Square returned no accessible locations");
    }

    const probeEnd = new Date();
    const probeStart = new Date(probeEnd.getTime() - 5 * 60 * 1000);

    await ordersApi.searchOrders({
      locationIds: [probeLocationId],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: {
              startAt: probeStart.toISOString(),
              endAt: probeEnd.toISOString(),
            },
          },
          stateFilter: {
            states: ["OPEN", "COMPLETED"],
          },
        },
        sort: {
          sortField: "CREATED_AT",
          sortOrder: "DESC",
        },
      },
    });

    if (squareApiAlertState.offline) {
      console.log("Square API health recovered.");
    }

    squareApiAlertState = {
      ...squareApiAlertState,
      offline: false,
      lastHealthyAt: Date.now(),
      lastError: "",
    };
  } catch (error) {
    const nowMs = Date.now();
    const wasOffline = squareApiAlertState.offline;
    squareApiAlertState = {
      ...squareApiAlertState,
      offline: true,
      lastError: error.message || "Unknown Square API error",
    };

    const shouldAlert =
      !wasOffline ||
      nowMs - squareApiAlertState.lastAlertAt >= SQUARE_HEALTH_ALERT_COOLDOWN_MS;

    if (shouldAlert) {
      try {
        await sendSquareOfflineEmail(
          error.message || "Unknown Square API error",
          "The Square health probe failed while checking locations and recent orders."
        );
        squareApiAlertState.lastAlertAt = nowMs;
        console.error("Sent Square offline alert email:", error.message);
      } catch (mailError) {
        console.error("Failed to send Square offline alert email:", mailError.message);
      }
    } else {
      console.error("Square API health probe failed:", error.message);
    }
  }
}

function getSquareOrderStatus(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const fulfillmentState = (fulfillment.state || "").toUpperCase();
  const pickupStatus = (fulfillment.pickupDetails?.status || "").toUpperCase();
  const shipmentStatus = (fulfillment.shipmentDetails?.status || "").toUpperCase();

  if (
    fulfillmentState === "COMPLETED" ||
    pickupStatus === "COMPLETED" ||
    shipmentStatus === "DELIVERED"
  ) {
    return "completed";
  }

  if (
    fulfillmentState === "PREPARED" ||
    pickupStatus === "READY" ||
    pickupStatus === "PREPARED" ||
    shipmentStatus === "IN_TRANSIT"
  ) {
    return "ready";
  }

  if (
    fulfillmentState === "IN_PROGRESS" ||
    fulfillmentState === "RESERVED" ||
    pickupStatus === "IN_PROGRESS" ||
    pickupStatus === "RESERVED"
  ) {
    return "making";
  }

  return "new";
}

function getSquareOrderSourceLabel(order = {}) {
  const sourceName = String(order.source?.name || order.sourceName || order.source_name || "").trim();
  const drinkflowSource = String(
    order.metadata?.drinkflow_source || order.metadata?.drinkflowSource || ""
  ).toLowerCase();

  if (
    drinkflowSource.includes("online_ordering") ||
    sourceName.toLowerCase().includes("drinkflow online")
  ) {
    return "Online order";
  }

  return sourceName || "Square Register";
}

function getSquarePickupDueTime(order = {}) {
  const fulfillment = order.fulfillments?.[0] || {};
  const pickupDetails = fulfillment.pickupDetails || fulfillment.pickup_details || {};
  const metadataPickup = order.metadata?.pickup_time || order.metadata?.pickupTime || "";
  const rawPickup =
    pickupDetails.pickupAt ||
    pickupDetails.pickup_at ||
    pickupDetails.readyAt ||
    pickupDetails.ready_at ||
    metadataPickup ||
    "";
  const note = String(pickupDetails.note || "");
  const noteMatch = note.match(/Requested pickup:\s*([^|]+)/i);
  const rawValue = String(rawPickup || noteMatch?.[1] || "").trim();

  if (!rawValue) return "";
  if (rawValue.startsWith("ASAP - estimated ")) return rawValue.replace("ASAP - estimated ", "");
  if (rawValue.startsWith("ASAP")) return rawValue;

  const dateValue = new Date(rawValue);
  if (!Number.isNaN(dateValue.getTime())) {
    return dateValue.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    });
  }

  return rawValue;
}

function getDiningOption(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const type = String(fulfillment.type || "").toUpperCase();

  if (type === "DELIVERY" || type === "SHIPMENT") return "Delivery";
  if (type === "PICKUP") return "Pickup";
  if (type.includes("DINE")) return "HANGIN' OUT";
  if (type.includes("DRIVE")) return "Drive thru";

  const metadataCandidates = [
    order.diningOption,
    order.dining_option,
    order.orderType,
    order.order_type,
    order.serviceType,
    order.service_type,
    order.metadata?.dining_option,
    order.metadata?.diningOption,
    order.metadata?.order_type,
    order.metadata?.service_type,
    order.metadata?.serviceType,
    order.metadata?.orderType,
    (order.lineItems || order.line_items || [])
      .map((item) => item.note || item.notes || item.name || "")
      .join(" "),
  ];
  const metadataValue =
    metadataCandidates.find((candidate) => {
      const normalized = String(candidate || "").trim().toLowerCase();
      return normalized && normalized !== "unspecified" && normalized !== "order";
    }) || "";
  const value = String(metadataValue).toLowerCase();

  if (value.includes("delivery")) return "Delivery";
  if (value.includes("pickup") || value.includes("pick up")) return "Pickup";
  if (value.includes("drive")) return "Drive thru";
  if (
    value.includes("to go") ||
    value.includes("togo") ||
    value.includes("takeout") ||
    value.includes("take out") ||
    value.includes("carryout") ||
    value.includes("carry out")
  ) {
    return "TAKING OFF";
  }
  if (
    value.includes("dine") ||
    value.includes("for here") ||
    value.includes("eat in") ||
    value.includes("eatin")
  ) {
    return "HANGIN' OUT";
  }

  return "";
}

function getSquareCustomerNameFromFields(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const pickupRecipient = fulfillment.pickupDetails?.recipient || {};
  const deliveryRecipient = fulfillment.deliveryDetails?.recipient || {};
  const shipmentRecipient = fulfillment.shipmentDetails?.recipient || {};
  const rawName =
    order.ticketName ||
    order.ticket_name ||
    pickupRecipient.displayName ||
    deliveryRecipient.displayName ||
    shipmentRecipient.displayName ||
    order.metadata?.customer_name ||
    order.metadata?.customerName ||
    order.metadata?.name ||
    "";

  return cleanCustomerName(rawName);
}

function cleanCustomerName(value = "") {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name) return "";
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");

  if (getDrinkCategory(name) || isSmoothieDrinkName(name)) return "";
  if (compact.includes("strawmango") || compact.includes("strawberrymango")) return "";
  if (compact.includes("strawberrybanana") || compact.includes("chocolatepbbanana")) return "";
  if (compact.includes("refresher") || compact.includes("smoothie")) return "";
  if (/^[A-Z0-9 _-]{5,}$/.test(name) && name === name.toUpperCase()) return "";

  return name;
}

function parseCustomerNameFromNotes(items = []) {
  const noteText = (items || [])
    .map((item) => item.note || item.notes || "")
    .filter(Boolean)
    .join(" ");
  const match =
    noteText.match(/\b(?:name|customer|cust)\s*[:\-]\s*([a-z][a-z\s'.-]{1,40})/i);

  if (match) {
    return cleanCustomerName(
      match[1]
        .replace(/\s+(pickup|pick up|order|scheduled|at|for)\b.*$/i, "")
        .trim()
        .replace(/\s+/g, " ")
    );
  }

  return "";
}

async function getSquareTeamMemberName(teamMemberId) {
  const normalizedId = String(teamMemberId || "").trim();
  if (!normalizedId) return "";

  if (squareEmployeeNameCache.has(normalizedId)) {
    return squareEmployeeNameCache.get(normalizedId) || "";
  }

  try {
    const response = await squareClient.teamApi.retrieveTeamMember(normalizedId);
    const teamMember = response.result.teamMember || {};
    const resolvedName =
      [teamMember.givenName, teamMember.familyName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      String(teamMember.emailAddress || "").trim() ||
      "";

    squareEmployeeNameCache.set(normalizedId, resolvedName);
    return resolvedName;
  } catch (error) {
    squareEmployeeNameCache.set(normalizedId, "");
    console.error(`Error retrieving Square team member ${normalizedId}:`, error.message);
    return "";
  }
}

function getSquareCustomerIds(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const pickupRecipient = fulfillment.pickupDetails?.recipient || {};
  const deliveryRecipient = fulfillment.deliveryDetails?.recipient || {};
  const shipmentRecipient = fulfillment.shipmentDetails?.recipient || {};
  const tenders = order.tenders || [];

  return [
    order.customerId,
    order.customer_id,
    fulfillment.customerId,
    fulfillment.customer_id,
    pickupRecipient.customerId,
    pickupRecipient.customer_id,
    deliveryRecipient.customerId,
    deliveryRecipient.customer_id,
    shipmentRecipient.customerId,
    shipmentRecipient.customer_id,
    ...tenders.flatMap((tender) => [tender.customerId, tender.customer_id]),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

async function getSquareCustomerName(order) {
  const fieldName = getSquareCustomerNameFromFields(order);
  if (fieldName) return fieldName;

  const customerIds = [...new Set(getSquareCustomerIds(order))];
  if (!customerIds.length) return "";

  for (const customerId of customerIds) {
    if (squareCustomerNameCache.has(customerId)) {
      const cachedName = squareCustomerNameCache.get(customerId);
      if (cachedName) return cachedName;
      continue;
    }

    try {
      const response = await squareClient.customersApi.retrieveCustomer(customerId);
      const customer = response.result.customer || {};
      const resolvedName =
        [
          customer.givenName,
          customer.familyName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        String(customer.nickname || "").trim() ||
        String(customer.companyName || "").trim() ||
        String(customer.emailAddress || "").trim() ||
        "";

      squareCustomerNameCache.set(customerId, resolvedName);
      if (resolvedName) return resolvedName;
    } catch (error) {
      squareCustomerNameCache.set(customerId, "");
      console.error(`Error retrieving Square customer ${customerId}:`, error.message);
    }
  }

  return "";
}

function getEmployeeLookupIds(order, payment = null) {
  const tenders = order.tenders || [];

  return [
    order.employeeId,
    order.employee_id,
    order.teamMemberId,
    order.team_member_id,
    payment?.employeeId,
    payment?.employee_id,
    payment?.teamMemberId,
    payment?.team_member_id,
    ...tenders.flatMap((tender) => [tender.teamMemberId, tender.team_member_id]),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

async function getSquareEmployeeName(order, payment = null) {
  const metadataName =
    order.metadata?.employee_name ||
    order.metadata?.employeeName ||
    order.metadata?.staff_name ||
    order.metadata?.staffName ||
    "";

  if (metadataName) return String(metadataName).trim();

  const ids = [...new Set(getEmployeeLookupIds(order, payment))];
  if (!ids.length) return "";

  for (const id of ids) {
    const teamMemberName = await getSquareTeamMemberName(id);
    if (teamMemberName) return teamMemberName;
  }

  return "";
}

async function normalizeSquareOrder(order, payment = null) {
  const items = [];
  const catalogCategoryByObjectId = await getSquareCatalogDrinkCategoryMap().catch((error) => {
    console.warn(`WARNING: Unable to check Square drink categories: ${error.message}`);
    return new Map();
  });

  for (const lineItem of order.lineItems || []) {
    const modifiers = (lineItem.modifiers || []).map(
      (modifier) => modifier.name || "Unknown modifier"
    );
    const name = lineItem.name || "Unnamed item";
    const catalogObjectId = lineItem.catalogObjectId || lineItem.catalog_object_id || "";
    const category = catalogCategoryByObjectId.get(catalogObjectId) || getDrinkCategory(name);

    items.push({
      id: lineItem.uid || catalogObjectId || null,
      catalogObjectId,
      name,
      qty: Number.parseInt(lineItem.quantity, 10) || 1,
      modifiers,
      note: lineItem.note || "",
      category,
    });
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(-4),
    customerName: cleanCustomerName(await getSquareCustomerName(order)) || parseCustomerNameFromNotes(items),
    employeeName: await getSquareEmployeeName(order, payment),
    createdAt: new Date(order.createdAt || Date.now()).getTime(),
    source: getSquareOrderSourceLabel(order),
    pickupDueTime: getSquarePickupDueTime(order),
    status: "new",
    diningOption: getDiningOption(order),
    items,
  };
}

function ticketFromDb(order, items = []) {
  const rawDiningOption = getDiningOption(order.raw_order || {});
  const completedItemKeys = new Set(getCompletedItemKeys(order.raw_order));
  const customerName = cleanCustomerName(order.customer_name) || parseCustomerNameFromNotes(items);
  const storedDiningOption =
    order.dining_option &&
    order.dining_option !== "Order" &&
    order.dining_option !== "Unspecified"
      ? order.dining_option
      : "";

  return {
    id: order.square_order_id,
    orderNumber: order.order_number || order.square_order_id.slice(-4),
    customerName,
    employeeName: order.employee_name || order.raw_order?.employeeName || "",
    createdAt: new Date(order.created_at).getTime(),
    updatedAt: order.updated_at ? new Date(order.updated_at).getTime() : null,
    completedAt: order.completed_at ? new Date(order.completed_at).getTime() : null,
    source: order.source || getSquareOrderSourceLabel(order.raw_order || {}),
    pickupDueTime: getSquarePickupDueTime(order.raw_order || {}),
    status: sanitizeStatus(order.status),
    diningOption: storedDiningOption || rawDiningOption || "",
    items: items.map((item) => ({
      id: item.square_line_item_uid || String(item.id),
      name: item.name || "Unnamed item",
      qty: item.quantity || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      note: item.note || "",
      category: getItemDrinkCategory(item),
      done: completedItemKeys.has(String(item.square_line_item_uid || item.id)),
    })),
  };
}

function getSuspiciousPickupNameTickets(ticketsToCheck = lastKnownActiveTickets) {
  return (ticketsToCheck || [])
    .filter((ticket) => {
      const name = normalizeName(ticket.customerName || "");
      if (!name) return false;
      const compact = normalizeDrinkText(name).replace(/\s+/g, "");
      return (
        getDrinkCategory(name) ||
        isSmoothieDrinkName(name) ||
        compact.includes("strawmango") ||
        compact.includes("strawberrybanana") ||
        compact.includes("chocolatepbbanana") ||
        compact.includes("refresher") ||
        compact.includes("smoothie")
      );
    })
    .map((ticket) => ({
      id: ticket.id,
      orderNumber: ticket.orderNumber || ticket.id,
      customerName: ticket.customerName || "",
      status: ticket.status || "",
    }));
}

async function upsertTicket(ticket, rawOrder = null) {
  if (!supabase) {
    const alreadyExists = tickets.some((existing) => existing.id === ticket.id);
    return { ...addTicket(ticket), syncAction: alreadyExists ? "updated" : "created" };
  }

  try {
    const { data: existingOrder, error: existingError } = await supabase
      .from("kds_orders")
      .select("status, customer_name, raw_order, updated_at")
      .eq("square_order_id", ticket.id)
      .maybeSingle();

    if (existingError) throw existingError;

    const status = sanitizeStatus(existingOrder?.status || ticket.status);
    const createdAt = new Date(ticket.createdAt || Date.now()).toISOString();

    const { error: orderError } = await supabase.from("kds_orders").upsert(
      {
        square_order_id: ticket.id,
        order_number: ticket.orderNumber,
        customer_name: ticket.customerName || existingOrder?.customer_name || null,
        created_at: createdAt,
        source: ticket.source || "Square Register",
        status,
        dining_option: ticket.diningOption || "Unspecified",
        square_state: rawOrder?.state || null,
        raw_order: rawOrder
          ? toJsonSafe({
              ...rawOrder,
              kdsStatusEvents:
                existingOrder?.raw_order?.kdsStatusEvents ||
                rawOrder.kdsStatusEvents ||
                [],
              kdsCompletedItemKeys:
                existingOrder?.raw_order?.kdsCompletedItemKeys ||
                rawOrder.kdsCompletedItemKeys ||
                [],
              employeeName:
                ticket.employeeName ||
                existingOrder?.raw_order?.employeeName ||
                rawOrder.employeeName ||
                null,
              pickupDueTime:
                ticket.pickupDueTime ||
                existingOrder?.raw_order?.pickupDueTime ||
                getSquarePickupDueTime(rawOrder),
            })
          : existingOrder?.raw_order || null,
        updated_at: existingOrder?.updated_at || new Date().toISOString(),
      },
      { onConflict: "square_order_id" }
    );

    if (orderError) throw orderError;

    const { error: deleteError } = await supabase
      .from("kds_order_items")
      .delete()
      .eq("order_id", ticket.id);

    if (deleteError) throw deleteError;

    if (ticket.items.length) {
      const { error: itemsError } = await supabase.from("kds_order_items").insert(
        ticket.items.map((item) => ({
          order_id: ticket.id,
          square_line_item_uid: item.id || null,
          name: item.name || "Unnamed item",
          quantity: Number(item.qty || 1),
          modifiers: item.modifiers || [],
          note: item.note || "",
          category: getItemDrinkCategory(item),
        }))
      );

      if (itemsError) throw itemsError;
    }

    return { ...ticket, status, syncAction: existingOrder ? "updated" : "created" };
  } catch (error) {
    const alreadyExists = tickets.some((existing) => existing.id === ticket.id);
    console.error(
      `Supabase write failed for ${ticket.id}; serving ticket from memory until storage recovers:`,
      error.message
    );
    return {
      ...addTicket(ticket),
      status: sanitizeStatus(ticket.status),
      syncAction: alreadyExists ? "memory-updated" : "memory-created",
      storageFallback: true,
    };
  }
}

async function syncRecentSquareOrders(context = "scheduled sync") {
  const now = Date.now();
  if (now - lastSquareSyncAt < SQUARE_SYNC_INTERVAL_MS) return;

  lastSquareSyncAt = now;
  const startedAt = Date.now();
  const squareOrders = await fetchSquareOrders();
  const squarePayments = await fetchSquarePayments();
  const paymentOrders = await fetchSquarePaymentOrders(squarePayments);
  const employeeNameByOrderId = await buildPaymentEmployeeMap(squarePayments);
  const dedupedOrders = dedupeOrders([...squareOrders, ...paymentOrders]);
  const summary = {
    context,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: null,
    fetchedOrders: squareOrders.length,
    fetchedPaymentOrders: paymentOrders.length,
    dedupedOrders: dedupedOrders.length,
    created: 0,
    updated: 0,
    saved: 0,
    failed: 0,
    storageFallback: 0,
  };

  for (const order of dedupedOrders) {
    try {
      const ticket = await normalizeSquareOrder(order, employeeNameByOrderId.get(order.id) || null);
      const savedTicket = await upsertTicket(ticket, order);
      summary.saved += 1;
      if (savedTicket?.syncAction === "created") summary.created += 1;
      if (savedTicket?.syncAction === "updated") summary.updated += 1;
      if (savedTicket?.storageFallback) {
        summary.storageFallback += 1;
        storageFallbackActive = true;
        storageFallbackLastError = "Supabase storage unavailable; serving active tickets from memory.";
      }
    } catch (orderError) {
      summary.failed += 1;
      console.error(`Square order ${order?.id || "unknown"} failed during sync:`, orderError.message);
    }
  }

  lastSquareSyncSuccessAt = Date.now();
  lastSquareSyncErrorAt = 0;
  lastSquareSyncError = "";
  lastSquareSyncSummary = {
    ...summary,
    finishedAt: new Date(lastSquareSyncSuccessAt).toISOString(),
  };

  if (summary.storageFallback === 0 && summary.failed === 0) {
    storageFallbackActive = false;
    storageFallbackLastError = "";
  }
}

async function trySyncRecentSquareOrders(context = "ticket request") {
  try {
    await Promise.race([
      syncRecentSquareOrders(context),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Square sync timed out after ${SQUARE_SYNC_TIMEOUT_MS}ms`)),
          SQUARE_SYNC_TIMEOUT_MS
        )
      ),
    ]);
    return true;
  } catch (error) {
    lastSquareSyncError = error.message || "Unknown Square sync error";
    lastSquareSyncErrorAt = Date.now();
    console.error(`Square sync failed during ${context}; serving stored tickets:`, lastSquareSyncError);
    return false;
  }
}

async function getActiveTickets() {
  if (!supabase) return getLocalActiveTickets();

  await trySyncRecentSquareOrders("active tickets");
  try {
    await autoCompleteStaleReadyTickets();
  } catch (error) {
    console.error("Auto-complete check failed; serving active tickets:", error.message);
  }

  try {
    return await getStoredActiveTickets();
  } catch (error) {
    console.error("Stored tickets unavailable; serving in-memory Square tickets:", error.message);
    storageFallbackActive = true;
    storageFallbackLastError = error.message || "Supabase storage unavailable.";
    lastKnownActiveTickets = getLocalActiveTickets();
    lastKnownActiveTicketsAt = Date.now();
    return lastKnownActiveTickets;
  }
}

async function getStoredActiveTickets() {
  if (!supabase) return getLocalActiveTickets();

  const activeStart = getRangeStart("today");
  const { data: orders, error: orderError } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, updated_at, source, status, dining_option, raw_order")
    .gte("created_at", activeStart.toISOString())
    .in("status", ["new", "making", "ready"])
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

  if (!orders.length) {
    lastKnownActiveTickets = [];
    lastKnownActiveTicketsAt = Date.now();
    return [];
  }

  const orderIds = orders.map((order) => order.square_order_id);
  const { data: items, error: itemsError } = await supabase
    .from("kds_order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("id", { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByOrderId = new Map();
  for (const item of items || []) {
    const existing = itemsByOrderId.get(item.order_id) || [];
    existing.push(item);
    itemsByOrderId.set(item.order_id, existing);
  }

  const activeTickets = orders.map((order) =>
    ticketFromDb(order, itemsByOrderId.get(order.square_order_id) || [])
  );
  lastKnownActiveTickets = activeTickets;
  lastKnownActiveTicketsAt = Date.now();
  return activeTickets;
}

async function setTicketStatus(id, status) {
  const sanitizedStatus = sanitizeStatus(status);
  const statusUpdatedAt = new Date().toISOString();

  if (!supabase) {
    updateLocalTicketStatus(id, sanitizedStatus);
    return sanitizedStatus;
  }

  const { data, error } = await supabase
    .from("kds_orders")
    .update({
      status: sanitizedStatus,
      updated_at: statusUpdatedAt,
    })
    .eq("square_order_id", id)
    .select("square_order_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
  }

  try {
    const { data: existingOrder, error: existingError } = await supabase
      .from("kds_orders")
      .select("raw_order")
      .eq("square_order_id", id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingOrder) {
      const { error: rawOrderError } = await supabase
        .from("kds_orders")
        .update({
          raw_order: appendStatusEvent(
            existingOrder.raw_order,
            sanitizedStatus,
            statusUpdatedAt
          ),
        })
        .eq("square_order_id", id);

      if (rawOrderError) throw rawOrderError;
    }
  } catch (metadataError) {
    console.warn(
      `KDS status saved for ${id}, but status event metadata was not updated:`,
      metadataError.message
    );
  }

  try {
    const { error: completedAtError } = await supabase
      .from("kds_orders")
      .update({
        completed_at: isCompletedStatus(sanitizedStatus) ? statusUpdatedAt : null,
      })
      .eq("square_order_id", id);

    if (completedAtError) throw completedAtError;
  } catch (completedAtError) {
    console.warn(
      `KDS status saved for ${id}, but completed_at was not updated:`,
      completedAtError.message
    );
  }

  return sanitizedStatus;
}

async function autoCompleteStaleReadyTickets() {
  if (!supabase) return;

  const cutoff = new Date(Date.now() - READY_AUTO_COMPLETE_MS).toISOString();
  const { data: staleReadyOrders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id")
    .eq("status", "ready")
    .lte("updated_at", cutoff)
    .limit(20);

  if (error) throw error;
  if (!staleReadyOrders?.length) return;

  for (const order of staleReadyOrders) {
    try {
      const updatedStatus = await setTicketStatus(order.square_order_id, "completed");
      await updateSquareOrderFulfillment(order.square_order_id, updatedStatus);
    } catch (error) {
      console.error(
        `Error auto-completing ready ticket ${order.square_order_id}:`,
        error.message
      );
    }
  }
}

async function setTicketItemDone(id, itemKey, done) {
  const normalizedKey = String(itemKey || "").trim();
  if (!normalizedKey) {
    const badRequestError = new Error("Missing item key");
    badRequestError.statusCode = 400;
    throw badRequestError;
  }

  if (!supabase) {
    updateLocalTicketItemDone(id, normalizedKey, done);
    return Boolean(done);
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from("kds_orders")
    .select("square_order_id, raw_order")
    .eq("square_order_id", id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existingOrder) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
  }

  const { data, error } = await supabase
    .from("kds_orders")
    .update({
      raw_order: setCompletedItemKey(existingOrder.raw_order, normalizedKey, done),
      updated_at: new Date().toISOString(),
    })
    .eq("square_order_id", id)
    .select("square_order_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
  }

  return Boolean(done);
}

async function setTicketName(id, customerName) {
  const normalizedName = String(customerName || "").trim();

  if (!supabase) {
    updateLocalTicketName(id, normalizedName);
    return normalizedName;
  }

  const { data, error } = await supabase
    .from("kds_orders")
    .update({
      customer_name: normalizedName || null,
    })
    .eq("square_order_id", id)
    .select("square_order_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
  }

  return normalizedName;
}

async function setTicketDiningOption(id, diningOption) {
  const normalizedDiningOption = normalizeDiningOptionValue(diningOption) || "Unspecified";

  if (!VALID_DINING_OPTIONS.has(normalizedDiningOption)) {
    const error = new Error("Invalid dining option");
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    updateLocalTicketDiningOption(id, normalizedDiningOption);
    return normalizedDiningOption;
  }

  const { data, error } = await supabase
    .from("kds_orders")
    .update({
      dining_option: normalizedDiningOption,
    })
    .eq("square_order_id", id)
    .select("square_order_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
  }

  return normalizedDiningOption;
}

async function getCompletedTicketsToday() {
  const start = getRangeStart("today");
  const end = getRangeEnd("today");

  if (!supabase) {
    return tickets
      .filter((ticket) => {
        const completedTime = ticket.completedAt || ticket.updatedAt || ticket.createdAt;
        return (
          (ticket.status === "completed" || ticket.status === "done") &&
          completedTime >= start.getTime() &&
          completedTime <= end.getTime()
        );
      })
      .sort((a, b) => (b.completedAt || b.updatedAt || 0) - (a.completedAt || a.updatedAt || 0));
  }

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, updated_at, source, status, dining_option, raw_order")
    .in("status", ["completed", "done"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const normalizedOrders = (orders || []).map((order) => ({
    ...order,
    completed_at: order.completed_at || order.updated_at || order.created_at,
  }));

  const todaysOrders = normalizedOrders.filter((order) => {
    const completedTime = new Date(order.completed_at || order.updated_at || order.created_at).getTime();
    return completedTime >= start.getTime() && completedTime <= end.getTime();
  });

  const orderIds = todaysOrders.map((order) => order.square_order_id);
  if (!orderIds.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("kds_order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("id", { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByOrderId = new Map();
  for (const item of items || []) {
    const existing = itemsByOrderId.get(item.order_id) || [];
    existing.push(item);
    itemsByOrderId.set(item.order_id, existing);
  }

  return todaysOrders.map((order) =>
    ticketFromDb(order, itemsByOrderId.get(order.square_order_id) || [])
  );
}

function ticketMatchesQuery(ticket, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return false;

  return (
    String(ticket.id || "").toLowerCase().includes(q) ||
    String(ticket.orderNumber || "").toLowerCase().includes(q) ||
    String(ticket.customerName || "").toLowerCase().includes(q) ||
    String(ticket.employeeName || "").toLowerCase().includes(q) ||
    String(ticket.diningOption || "").toLowerCase().includes(q) ||
    (ticket.items || []).some((item) => {
      return (
        String(item.name || "").toLowerCase().includes(q) ||
        (item.modifiers || []).some((mod) => String(mod).toLowerCase().includes(q))
      );
    })
  );
}

async function findTickets(query) {
  const active = await getActiveTickets().catch(() => []);
  const completed = await getCompletedTicketsToday().catch(() => []);
  const combined = dedupeOrders([...active, ...completed]);

  return combined.filter((ticket) => ticketMatchesQuery(ticket, query));
}

function mapKDSStatusToSquareFulfillmentState(kdsStatus) {
  const mapping = {
    new: "PROPOSED",
    making: "IN_PROGRESS",
    ready: "PREPARED",
    completed: "COMPLETED",
    done: "COMPLETED",
  };
  return mapping[kdsStatus] || "PROPOSED";
}

async function updateSquareOrderFulfillment(orderId, kdsStatus) {
  try {
    if (orderId.startsWith("local-")) return;

    const { ordersApi } = squareClient;
    const orderResponse = await ordersApi.retrieveOrder(orderId);
    const order = orderResponse.result.order;

    if (!order?.fulfillments?.length) {
      console.warn(`No fulfillments found for order ${orderId}, skipping Square fulfillment update`);
      return;
    }

    const fulfillmentState = mapKDSStatusToSquareFulfillmentState(kdsStatus);
    const updatedFulfillments = order.fulfillments.map((fulfillment, idx) =>
      idx === 0 ? { ...fulfillment, state: fulfillmentState } : fulfillment
    );

    const updateResponse = await ordersApi.updateOrder(orderId, {
      order: {
        ...order,
        fulfillments: updatedFulfillments,
      },
    });

    console.log(
      `Updated Square order ${orderId} fulfillment to ${fulfillmentState}`,
      updateResponse.result.order?.id
    );
  } catch (error) {
    console.error(`Error updating Square order ${orderId} fulfillment:`, error.message);
  }
}

function getWebhookOrderId(event) {
  return (
    event.data?.object?.order_created?.order_id ||
    event.data?.object?.order_updated?.order_id ||
    event.data?.object?.order?.id ||
    event.data?.object?.payment?.order_id ||
    event.data?.id ||
    null
  );
}

function getWebhookPaymentId(event) {
  return event.data?.object?.payment?.id || event.data?.id || null;
}

function getRangeStart(range) {
  const now = new Date();
  const todayKey = getShopDateString(now);
  let startKey = todayKey;

  if (range === "yesterday") {
    startKey = addDaysToDateKey(todayKey, -1);
  } else if (range === "last7") {
    startKey = addDaysToDateKey(todayKey, -6);
  } else if (range === "thisQuarter") {
    const todayParts = parseDateKey(todayKey);
    const quarterStartMonth = Math.floor((todayParts.month - 1) / 3) * 3 + 1;
    startKey = formatDateKeyFromParts({
      year: todayParts.year,
      month: quarterStartMonth,
      day: 1,
    });
  } else if (range === "thisMonth") {
    const todayParts = parseDateKey(todayKey);
    startKey = formatDateKeyFromParts({
      year: todayParts.year,
      month: todayParts.month,
      day: 1,
    });
  } else if (range === "last30") {
    startKey = addDaysToDateKey(todayKey, -29);
  } else if (range === "thisYear") {
    const todayParts = parseDateKey(todayKey);
    startKey = formatDateKeyFromParts({
      year: todayParts.year,
      month: 1,
      day: 1,
    });
  }

  return getShopDateTime(startKey) || new Date(now);
}

function getRangeEnd(range) {
  const now = new Date();

  if (range !== "yesterday") return now;

  const yesterdayKey = addDaysToDateKey(getShopDateString(now), -1);
  return getShopDayRangeFromKey(yesterdayKey)?.end || now;
}

const DEFAULT_SHOP_HOURS = {
  openHour: 7,
  closeHour: 15,
  label: "7 AM-3 PM",
};

const SHOP_HOURS_BY_DAY = {
  6: {
    openHour: 8,
    closeHour: 13,
    label: "8 AM-1 PM",
  },
};

function getShopHoursForDate(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return DEFAULT_SHOP_HOURS;

  return SHOP_HOURS_BY_DAY[date.getDay()] || DEFAULT_SHOP_HOURS;
}

function isHourWithinShopHours(hour, shopHours = DEFAULT_SHOP_HOURS) {
  const openHour = Number(shopHours.openHour ?? DEFAULT_SHOP_HOURS.openHour);
  const closeHour = Number(shopHours.closeHour ?? DEFAULT_SHOP_HOURS.closeHour);

  return Number(hour) >= openHour && Number(hour) < closeHour;
}

function getDayRange(dateString) {
  return getShopDayRangeFromKey(dateString);
}

function isDateInputValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function getCustomDateRange(startDate, endDate) {
  if (!isDateInputValue(startDate) || !isDateInputValue(endDate)) {
    const error = new Error("Choose a start date and end date.");
    error.statusCode = 400;
    throw error;
  }

  const startParts = parseDateKey(startDate);
  const endParts = parseDateKey(endDate);

  if (!startParts || !endParts) {
    const error = new Error("Choose a valid start date and end date.");
    error.statusCode = 400;
    throw error;
  }

  const startOrdinal = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endOrdinal = Date.UTC(endParts.year, endParts.month - 1, endParts.day);

  if (endOrdinal < startOrdinal) {
    const error = new Error("End date must be after the start date.");
    error.statusCode = 400;
    throw error;
  }

  const spanDays = Math.floor((endOrdinal - startOrdinal) / 86400000) + 1;
  if (spanDays > 400) {
    const error = new Error("Custom reports can cover up to 400 days.");
    error.statusCode = 400;
    throw error;
  }

  const start = getShopDateTime(startDate);
  const end = getShopDayRangeFromKey(endDate)?.end;

  if (!start || !end) {
    const error = new Error("Choose a valid start date and end date.");
    error.statusCode = 400;
    throw error;
  }

  return { start, end, spanDays };
}

function formatOwnerReportDateLabel(dateInput) {
  if (isDateInputValue(dateInput)) {
    const parts = parseDateKey(dateInput);
    if (!parts) return "";
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: SHOP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildOwnerReportPeriod(query = {}) {
  const wantsCustom =
    query.range === "custom" ||
    Boolean(query.startDate || query.start || query.endDate || query.end);

  if (wantsCustom) {
    const startDate = String(query.startDate || query.start || "").trim();
    const endDate = String(query.endDate || query.end || "").trim();
    const { start, end, spanDays } = getCustomDateRange(startDate, endDate);
    return {
      range: "custom",
      label: `${formatOwnerReportDateLabel(startDate)} - ${formatOwnerReportDateLabel(endDate)}`,
      start,
      end,
      startDate,
      endDate,
      spanDays,
      fileToken: `custom-${startDate}-to-${endDate}`,
    };
  }

  const range = normalizeOwnerReportRange(query.range);
  const start = getRangeStart(range);
  const end = getRangeEnd(range);

  return {
    range,
    label: getOwnerRangeLabel(range),
    start,
    end,
    fileToken: range,
  };
}

function resolveOwnerReportPeriod(input = "today") {
  if (input && typeof input === "object" && input.start instanceof Date && input.end instanceof Date) {
    return input;
  }

  if (input && typeof input === "object") {
    return buildOwnerReportPeriod(input);
  }

  return buildOwnerReportPeriod({ range: input });
}

async function getTicketsForDay(dateString) {
  const range = getDayRange(dateString);
  if (!range) {
    const error = new Error("Invalid date");
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    return tickets
      .filter((ticket) => ticket.createdAt >= range.start.getTime() && ticket.createdAt <= range.end.getTime())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  await syncRecentSquareOrders();

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, updated_at, source, status, dining_option, raw_order")
    .gte("created_at", range.start.toISOString())
    .lte("created_at", range.end.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!orders.length) return [];

  const orderIds = orders.map((order) => order.square_order_id);
  const { data: items, error: itemsError } = await supabase
    .from("kds_order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("id", { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByOrderId = new Map();
  for (const item of items || []) {
    const existing = itemsByOrderId.get(item.order_id) || [];
    existing.push(item);
    itemsByOrderId.set(item.order_id, existing);
  }

  return orders.map((order) =>
    ticketFromDb(order, itemsByOrderId.get(order.square_order_id) || [])
  );
}

async function getDrinkReport(range = "today") {
  if (!supabase) {
    return buildDrinkReport(tickets, getRangeStart(range), getRangeEnd(range));
  }

  await syncRecentSquareOrders();

  const start = getRangeStart(range);
  const end = getRangeEnd(range);
  const selectColumns = "square_order_id, created_at, updated_at";

  const { data, error: orderError } = await supabase
    .from("kds_orders")
    .select(selectColumns)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (orderError) throw orderError;

  const orders = (data || []).map((order) => ({
    ...order,
    createdAt: new Date(order.created_at).getTime(),
  }));

  if (!orders.length) return buildDrinkReport([], start);

  const orderIds = orders.map((order) => order.square_order_id);
  const orderDateById = new Map(
    orders.map((order) => [order.square_order_id, order.createdAt])
  );
  const items = await fetchOrderItemsByOrderIds(orderIds);

  const reportTickets = orderIds.map((orderId) => ({
    id: orderId,
    createdAt: orderDateById.get(orderId),
    items: (items || [])
      .filter((item) => item.order_id === orderId)
      .map((item) => ({
        name: item.name,
        qty: item.quantity,
        category: getItemDrinkCategory(item),
      })),
  }));

  return buildDrinkReport(reportTickets, start, end);
}

async function fetchOrderItemsByOrderIds(orderIds = [], columns = "*") {
  if (!supabase || !orderIds.length) return [];

  const chunkSize = 100;
  const collected = [];

  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("kds_order_items")
      .select(columns)
      .in("order_id", chunk);

    if (error) throw error;
    collected.push(...(data || []));
  }

  return collected;
}

function ticketHasDrinkItem(ticket) {
  return (ticket.items || []).some((item) => getItemDrinkCategory(item));
}

function getDisplayDrinkItems(ticket) {
  return (ticket.items || [])
    .filter((item) => getItemDrinkCategory(item))
    .map((item) => ({
      name: getCanonicalDrinkName(item.name || "Drink"),
      qty: Number(item.qty || item.quantity || 1) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers.filter(Boolean) : [],
      note: item.note || "",
      done: Boolean(item.done || item.completed || item.completed_item),
    }));
}

function getMakingDurationFromEvents(events, start, end) {
  return getMakingDurationSampleFromEvents(events, start, end)?.durationMs || null;
}

function getMakingDurationSampleFromEvents(events, start, end, order = null) {
  let startedAt = null;
  let fallbackCompletedAt = null;

  for (const event of events) {
    if (event.status === "making") {
      startedAt = event.at;
      continue;
    }

    if (!startedAt) continue;

    if (event.status === "ready") {
      if (event.at < start.getTime() || event.at > end.getTime()) return null;
      const durationMs = event.at - startedAt;
      return durationMs > 0
        ? {
            durationMs,
            startedAt,
            readyAt: event.at,
            completedAt: event.at,
          }
        : null;
    }

    if (isCompletedStatus(event.status) && !fallbackCompletedAt) {
      fallbackCompletedAt = event.at;
    }
  }

  const orderUpdatedAt = order?.updated_at ? new Date(order.updated_at).getTime() : null;
  const orderCompletedAt = order?.completed_at ? new Date(order.completed_at).getTime() : null;

  if (!startedAt && order?.status === "making" && Number.isFinite(orderUpdatedAt)) {
    startedAt = orderUpdatedAt;
  }

  if (!fallbackCompletedAt && Number.isFinite(orderCompletedAt)) {
    fallbackCompletedAt = orderCompletedAt;
  }
  if (
    !fallbackCompletedAt &&
    isCompletedStatus(order?.status) &&
    Number.isFinite(orderUpdatedAt)
  ) {
    fallbackCompletedAt = orderUpdatedAt;
  }
  if (!startedAt || !fallbackCompletedAt) return null;
  if (fallbackCompletedAt < start.getTime() || fallbackCompletedAt > end.getTime()) return null;

  const durationMs = fallbackCompletedAt - startedAt;
  return durationMs > 0
    ? {
        durationMs,
        startedAt,
        readyAt: null,
        completedAt: fallbackCompletedAt,
      }
    : null;
}

async function getDrinkMakingTimeReport(range = "today") {
  const period = resolveOwnerReportPeriod(range);
  const { start, end } = period;

  if (!supabase) {
    const samples = tickets
      .filter((ticket) => ticketHasDrinkItem(ticket))
      .map((ticket) => {
        const rawOrder = ticket.rawOrder || ticket.raw_order || {};
        const sample = getMakingDurationSampleFromEvents(
          getStatusEvents(rawOrder),
          start,
          end,
          {
            status: ticket.status,
            updated_at: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : null,
            completed_at: ticket.completedAt ? new Date(ticket.completedAt).toISOString() : null,
          }
        );
        return sample
          ? {
              ...sample,
              items: getDisplayDrinkItems(ticket),
            }
          : null;
      })
      .filter(Boolean);
    const summary = summarizeDurationSamples(samples);

    return {
      ...summary,
      range: period.range,
      rangeLabel: period.label,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      measurement: "staff_start_to_ready",
      ...getDurationBreakdowns(samples),
    };
  }

  const { data: orders, error: orderError } = await supabase
    .from("kds_orders")
    .select("square_order_id, raw_order, status, updated_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (orderError) throw orderError;
  if (!orders?.length) {
    return {
      averageSeconds: 0,
      label: "Collecting",
      sampleSize: 0,
      range: period.range,
      rangeLabel: period.label,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      byHour: [],
      byDrinkName: [],
    };
  }

  const orderIds = orders.map((order) => order.square_order_id);
  const items = await fetchOrderItemsByOrderIds(orderIds, "order_id, name, category");

  const drinkItemsByOrderId = new Map();
  for (const item of items || []) {
    const category = getItemDrinkCategory(item);
    if (!category) continue;
    const existing = drinkItemsByOrderId.get(item.order_id) || [];
    existing.push({
      name: getCanonicalDrinkName(item.name),
      qty: item.quantity || 1,
      category,
    });
    drinkItemsByOrderId.set(item.order_id, existing);
  }

  const samples = orders
    .filter((order) => drinkItemsByOrderId.has(order.square_order_id))
    .map((order) => {
      const sample = getMakingDurationSampleFromEvents(getStatusEvents(order.raw_order), start, end, order);
      return sample
        ? {
            ...sample,
            orderId: order.square_order_id,
            items: drinkItemsByOrderId.get(order.square_order_id) || [],
          }
        : null;
    })
    .filter(Boolean);
  const summary = summarizeDurationSamples(samples);

  return {
    ...summary,
    range: period.range,
    rangeLabel: period.label,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    measurement: "staff_start_to_ready",
    ...getDurationBreakdowns(samples),
  };
}

function buildDrinkReport(reportTickets, start, end = new Date()) {
  const totalsByName = new Map();
  const totalsByCategory = buildEmptyDrinkCategoryTotals();

  for (const ticket of reportTickets) {
    if (ticket.createdAt && ticket.createdAt < start.getTime()) continue;
    if (ticket.createdAt && ticket.createdAt > end.getTime()) continue;

    for (const item of ticket.items || []) {
      const category = getItemDrinkCategory(item);
      if (!category) continue;

      const qty = Number(item.qty || 1);
      const displayName = getCanonicalDrinkName(item.name);
      totalsByName.set(displayName, (totalsByName.get(displayName) || 0) + qty);
      totalsByCategory[category] = (totalsByCategory[category] || 0) + qty;
    }
  }

  return {
    range: "custom",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    orderCount: reportTickets.filter((ticket) =>
      (ticket.items || []).some((item) => getItemDrinkCategory(item))
    ).length,
    totalsByName: Array.from(totalsByName.entries())
      .map(([name, qty]) => ({ name, qty, category: getDrinkCategory(name) }))
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name)),
    totalsByCategory,
  };
}

function buildOwnerDrinkRevenueReport(orders = [], start, end) {
  const shopHours = getShopHoursForDate(start);
  const categories = buildEmptyOwnerCategoryBuckets();
  const drinksByName = new Map();
  const orderDetails = [];
  const hourly = Array.from({ length: 24 }, (_value, hour) => ({
    hour,
    label: new Date(2024, 0, 1, hour).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    }),
    orderCount: 0,
    units: 0,
    revenueCents: 0,
    revenue: "$0.00",
  }));
  const orderIds = new Set();
  const allOrderIds = new Set();
  let multiDrinkOrderCount = 0;
  let ordersWithNonDrinkItems = 0;
  let drinkOrdersWithNonDrinkItems = 0;
  let nonDrinkUnits = 0;
  let nonDrinkRevenueCents = 0;
  let nonDrinkTaxCents = 0;
  let nonDrinkTotalCents = 0;

  for (const order of orders || []) {
    const rawOrder = order.raw_order || {};
    const lineItems = rawOrder.lineItems || rawOrder.line_items || [];
    let orderHasDrink = false;
    let orderHasNonDrink = false;
    let orderUnits = 0;
    let orderRevenueCents = 0;
    let orderTaxCents = 0;
    let orderTotalCents = 0;
    const orderDrinkNames = [];

    if (order.square_order_id && lineItems.length) {
      allOrderIds.add(order.square_order_id);
    }

    for (const lineItem of lineItems) {
      const name = lineItem.name || "";
      const category = getItemDrinkCategory({ name });
      const displayName = getCanonicalDrinkName(name);
      const qty = Number.parseFloat(lineItem.quantity || "1") || 1;
      const totalCents = getLineItemAmountCents(lineItem);
      const taxCents = getLineItemTaxCents(lineItem);
      const revenueCents = Math.max(totalCents - taxCents, 0);

      if (!category) {
        orderHasNonDrink = true;
        nonDrinkUnits += qty;
        nonDrinkRevenueCents += revenueCents;
        nonDrinkTaxCents += taxCents;
        nonDrinkTotalCents += totalCents;
        continue;
      }

      const drinkSummary =
        drinksByName.get(displayName) || {
          name: displayName,
          category,
          units: 0,
          orderCount: 0,
          revenueCents: 0,
          taxCents: 0,
          totalCents: 0,
        };

      categories[category].units += qty;
      categories[category].revenueCents += revenueCents;
      categories[category].taxCents += taxCents;
      categories[category].totalCents += totalCents;
      drinkSummary.units += qty;
      drinkSummary.orderCount += 1;
      drinkSummary.revenueCents += revenueCents;
      drinkSummary.taxCents += taxCents;
      drinkSummary.totalCents += totalCents;
      drinksByName.set(displayName, drinkSummary);
      orderUnits += qty;
      orderRevenueCents += revenueCents;
      orderTaxCents += taxCents;
      orderTotalCents += totalCents;
      orderDrinkNames.push(`${displayName}${qty > 1 ? ` x${qty}` : ""}`);
      orderHasDrink = true;
    }

    if (orderHasNonDrink) ordersWithNonDrinkItems += 1;

    if (orderHasDrink) {
      orderIds.add(order.square_order_id);
      if (orderUnits >= 2) multiDrinkOrderCount += 1;
      if (orderHasNonDrink) drinkOrdersWithNonDrinkItems += 1;

      const createdAt = new Date(order.created_at);
      orderDetails.push({
        orderId: order.square_order_id,
        orderNumber: order.order_number || String(order.square_order_id || "").slice(-4),
        customerName: order.customer_name || "",
        createdAt: order.created_at,
        createdAtLabel: Number.isNaN(createdAt.getTime())
          ? ""
          : createdAt.toLocaleString("en-US", {
              timeZone: SHOP_TIME_ZONE,
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
        units: orderUnits,
        revenueCents: orderRevenueCents,
        revenue: formatCurrency(orderRevenueCents),
        taxCents: orderTaxCents,
        tax: formatCurrency(orderTaxCents),
        totalCents: orderTotalCents,
        total: formatCurrency(orderTotalCents),
        items: orderDrinkNames,
      });

      if (!Number.isNaN(createdAt.getTime())) {
        const bucket = hourly[createdAt.getHours()];
        bucket.orderCount += 1;
        bucket.units += orderUnits;
        bucket.revenueCents += orderRevenueCents;
      }
    }
  }

  const hourlyOrders = hourly.map((bucket) => ({
    ...bucket,
    revenue: formatCurrency(bucket.revenueCents),
  }));
  const totalsByCategory = Object.values(categories).map((item) => ({
    ...item,
    revenue: formatCurrency(item.revenueCents),
    tax: formatCurrency(item.taxCents),
    total: formatCurrency(item.totalCents),
  }));
  const totalsByName = Array.from(drinksByName.values())
    .map((item) => ({
      ...item,
      revenue: formatCurrency(item.revenueCents),
      tax: formatCurrency(item.taxCents),
      total: formatCurrency(item.totalCents),
      averageUnitRevenueCents: item.units ? Math.round(item.revenueCents / item.units) : 0,
      averageUnitRevenue: formatCurrency(
        item.units ? Math.round(item.revenueCents / item.units) : 0
      ),
    }))
    .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents || a.name.localeCompare(b.name));
  const totalRevenueCents = totalsByCategory.reduce(
    (sum, item) => sum + item.revenueCents,
    0
  );
  const totalTaxCents = totalsByCategory.reduce(
    (sum, item) => sum + item.taxCents,
    0
  );
  const totalCollectedCents = totalsByCategory.reduce(
    (sum, item) => sum + item.totalCents,
    0
  );
  const totalUnits = totalsByCategory.reduce((sum, item) => sum + item.units, 0);
  const multiDrinkOrderRate = orderIds.size
    ? Math.round((multiDrinkOrderCount / orderIds.size) * 100)
    : 0;
  const nonDrinkOrderRate = allOrderIds.size
    ? Math.round((ordersWithNonDrinkItems / allOrderIds.size) * 100)
    : 0;
  const drinkOrderNonDrinkAttachmentRate = orderIds.size
    ? Math.round((drinkOrdersWithNonDrinkItems / orderIds.size) * 100)
    : 0;

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    orderCount: orderIds.size,
    allOrderCount: allOrderIds.size,
    multiDrinkOrderCount,
    multiDrinkOrderRate,
    ordersWithNonDrinkItems,
    nonDrinkOrderRate,
    drinkOrdersWithNonDrinkItems,
    drinkOrderNonDrinkAttachmentRate,
    nonDrinkUnits,
    nonDrinkRevenueCents,
    nonDrinkRevenue: formatCurrency(nonDrinkRevenueCents),
    nonDrinkTaxCents,
    nonDrinkTax: formatCurrency(nonDrinkTaxCents),
    nonDrinkTotalCents,
    nonDrinkTotal: formatCurrency(nonDrinkTotalCents),
    totalUnits,
    totalRevenueCents,
    totalRevenue: formatCurrency(totalRevenueCents),
    totalTaxCents,
    totalTax: formatCurrency(totalTaxCents),
    totalCollectedCents,
    totalCollected: formatCurrency(totalCollectedCents),
    averageDrinkOrderValueCents: orderIds.size
      ? Math.round(totalCollectedCents / orderIds.size)
      : 0,
    averageDrinkOrderValue: formatCurrency(
      orderIds.size ? Math.round(totalCollectedCents / orderIds.size) : 0
    ),
    totalsByCategory,
    totalsByName,
    hourlyOrders,
    orderDetails: orderDetails.sort(
      (a, b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0)
    ),
    shopHours,
  };
}

async function getOwnerDrinkRevenueReport(range = "today") {
  const period = resolveOwnerReportPeriod(range);
  const { start, end } = period;

  if (!supabase) {
    return {
      ...buildOwnerDrinkRevenueReport([], start, end),
      range: period.range,
      rangeLabel: period.label,
      startDate: period.startDate || null,
      endDate: period.endDate || null,
    };
  }

  await syncRecentSquareOrders();

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, raw_order")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) throw error;

  return {
    ...buildOwnerDrinkRevenueReport(orders || [], start, end),
    range: period.range,
    rangeLabel: period.label,
    startDate: period.startDate || null,
    endDate: period.endDate || null,
  };
}

async function getOwnerDrinkRevenueReportForDay(dateString = getLocalDateKey()) {
  const range = getDayRange(dateString);
  if (!range) {
    const error = new Error("Invalid date");
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    return buildOwnerDrinkRevenueReport([], range.start, range.end);
  }

  await syncRecentSquareOrders();

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, raw_order")
    .gte("created_at", range.start.toISOString())
    .lte("created_at", range.end.toISOString());

  if (error) throw error;

  return buildOwnerDrinkRevenueReport(orders || [], range.start, range.end);
}

function normalizeSnapshotPayload(body = {}, ownerName = "Owner") {
  const report = body.report || {};
  const advice = Array.isArray(body.advice) ? body.advice : [];
  const rangeKey = normalizeName(body.range || report.range || "today");
  const rangeLabel = normalizeName(body.rangeLabel || rangeKey);
  const snapshotDate = normalizeName(body.snapshotDate || getLocalDateKey());
  const hourly = Array.isArray(report.hourlyOrders) ? report.hourlyOrders : [];
  const shopHours = report.shopHours || getShopHoursForDate(report.startAt || snapshotDate);
  const activeHours = hourly.filter(
    (item) =>
      isHourWithinShopHours(item.hour, shopHours) &&
      Number(item.orderCount || 0) > 0
  );
  const peak = activeHours
    .slice()
    .sort((a, b) => Number(b.orderCount || 0) - Number(a.orderCount || 0))[0];
  const slow = activeHours
    .slice()
    .sort((a, b) => Number(a.orderCount || 0) - Number(b.orderCount || 0))[0];
  const categories = Array.isArray(report.totalsByCategory)
    ? report.totalsByCategory
    : [];
  const topCategory = categories
    .slice()
    .sort((a, b) => Number(b.units || 0) - Number(a.units || 0))[0];
  const findAdvice = (title) =>
    advice.find((item) =>
      String(item.title || "").toLowerCase().includes(title)
    )?.body || "";

  return {
    snapshot_date: snapshotDate,
    range_key: rangeKey,
    range_label: rangeLabel,
    start_at: report.startAt || null,
    end_at: report.endAt || null,
    order_count: Number(report.orderCount || 0),
    multi_drink_order_count: Number(report.multiDrinkOrderCount || 0),
    multi_drink_order_rate: Number(report.multiDrinkOrderRate || 0),
    drink_units: Number(report.totalUnits || 0),
    total_revenue_cents: Number(report.totalRevenueCents || 0),
    average_order_value_cents: Number(report.averageDrinkOrderValueCents || 0),
    top_category: topCategory?.category || null,
    peak_hour: peak ? Number(peak.hour) : null,
    peak_hour_label: peak?.label || null,
    slow_hour: slow ? Number(slow.hour) : null,
    slow_hour_label: slow?.label || null,
    summary: normalizeName(body.summary || ""),
    money_signal: normalizeName(body.moneySignal || findAdvice("money signal")),
    owner_action: normalizeName(body.ownerAction || findAdvice("owner action")),
    report,
    advice,
    created_by: normalizeName(ownerName || "Owner"),
    updated_at: new Date().toISOString(),
  };
}

function ownerSnapshotToCsv(snapshots = []) {
  const columns = [
    "snapshot_date",
    "range_key",
    "range_label",
    "order_count",
    "multi_drink_order_count",
    "multi_drink_order_rate",
    "drink_units",
    "total_revenue",
    "average_order_value",
    "top_category",
    "peak_hour",
    "slow_hour",
    "summary",
    "money_signal",
    "owner_action",
    "created_by",
    "updated_at",
  ];
  const rows = snapshots.map((snapshot) => [
    snapshot.snapshot_date,
    snapshot.range_key,
    snapshot.range_label,
    snapshot.order_count,
    snapshot.multi_drink_order_count,
    `${snapshot.multi_drink_order_rate || 0}%`,
    snapshot.drink_units,
    formatCurrency(snapshot.total_revenue_cents),
    formatCurrency(snapshot.average_order_value_cents),
    snapshot.top_category || "",
    snapshot.peak_hour_label || "",
    snapshot.slow_hour_label || "",
    snapshot.summary || "",
    snapshot.money_signal || "",
    snapshot.owner_action || "",
    snapshot.created_by || "",
    snapshot.updated_at || "",
  ]);

  return [columns, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function normalizeOwnerReportRange(range) {
  const allowedRanges = new Set([
    "today",
    "yesterday",
    "last7",
    "last30",
    "thisQuarter",
    "thisMonth",
    "thisYear",
  ]);
  return allowedRanges.has(range) ? range : "today";
}

function getOwnerRangeLabel(range = "today") {
  if (range && typeof range === "object" && range.label) return range.label;

  return (
    {
      today: "Today",
      yesterday: "Yesterday",
      last7: "Last 7 Days",
      last30: "Last 30 Days",
      thisQuarter: "This Quarter",
      thisMonth: "This Month",
      thisYear: "This Year",
    }[range] || "Today"
  );
}

function getOwnerReportFileToken(range = "today") {
  if (range && typeof range === "object") return range.fileToken || range.range || "custom";
  return String(range || "today").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "today";
}

function ownerReportToCsv(report = {}, range = "today") {
  const rows = [
    ["Goldie's Owner Report", getOwnerRangeLabel(range)],
    ["Start", report.startAt || ""],
    ["End", report.endAt || ""],
    [],
    ["Metric", "Value"],
    ["Actual drink revenue", report.totalRevenue || "$0.00"],
    ["Taxes collected", report.totalTax || "$0.00"],
    ["Total collected", report.totalCollected || "$0.00"],
    ["Drink orders", Number(report.orderCount || 0)],
    ["Drink units", Number(report.totalUnits || 0)],
    ["Average drink order value", report.averageDrinkOrderValue || "$0.00"],
    ["Orders with 2+ drinks", Number(report.multiDrinkOrderCount || 0)],
    ["2+ drink order rate", `${Number(report.multiDrinkOrderRate || 0)}%`],
    ["Drink orders with non-drink items", Number(report.drinkOrdersWithNonDrinkItems || 0)],
    ["Drink order non-drink attachment rate", `${Number(report.drinkOrderNonDrinkAttachmentRate || 0)}%`],
    ["Non-drink total collected", report.nonDrinkTotal || "$0.00"],
    [],
    ["Category", "Revenue", "Tax", "Total collected", "Units"],
    ...(report.totalsByCategory || []).map((item) => [
      item.category,
      item.revenue,
      item.tax,
      item.total,
      item.units,
    ]),
    [],
    ["Drink", "Category", "Units", "Lines", "Revenue", "Tax", "Total collected", "Average unit revenue"],
    ...(report.totalsByName || []).map((item) => [
      item.name,
      item.category,
      item.units,
      item.orderCount,
      item.revenue,
      item.tax,
      item.total,
      item.averageUnitRevenue,
    ]),
    [],
    ["Hour", "Orders", "Drink units", "Revenue"],
    ...(report.hourlyOrders || []).map((item) => [
      item.label,
      item.orderCount,
      item.units,
      item.revenue,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

async function buildOwnerReportWorkbook(report = {}, range = "today") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Goldie's KDS";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `Owner report for ${getOwnerRangeLabel(range)}`;
  workbook.title = `Goldie's Owner Report - ${getOwnerRangeLabel(range)}`;

  const summary = workbook.addWorksheet("Report Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 32 },
  ];
  [
    ["Range", getOwnerRangeLabel(range)],
    ["Actual drink revenue", report.totalRevenue || "$0.00"],
    ["Taxes collected", report.totalTax || "$0.00"],
    ["Total collected", report.totalCollected || "$0.00"],
    ["Drink orders", Number(report.orderCount || 0)],
    ["Drink units", Number(report.totalUnits || 0)],
    ["Average drink order value", report.averageDrinkOrderValue || "$0.00"],
    ["Orders with 2+ drinks", Number(report.multiDrinkOrderCount || 0)],
    ["2+ drink order rate", `${Number(report.multiDrinkOrderRate || 0)}%`],
    ["Drink orders with non-drink items", Number(report.drinkOrdersWithNonDrinkItems || 0)],
    ["Drink order non-drink attachment rate", `${Number(report.drinkOrderNonDrinkAttachmentRate || 0)}%`],
    ["All orders with non-drink items", Number(report.ordersWithNonDrinkItems || 0)],
    ["All-order non-drink item rate", `${Number(report.nonDrinkOrderRate || 0)}%`],
    ["Non-drink total collected", report.nonDrinkTotal || "$0.00"],
  ].forEach(([metric, value]) => summary.addRow({ metric, value }));

  const categories = workbook.addWorksheet("Category Mix");
  categories.columns = [
    { header: "Category", key: "category", width: 18 },
    { header: "Revenue", key: "revenue", width: 16 },
    { header: "Tax", key: "tax", width: 14 },
    { header: "Total Collected", key: "total", width: 18 },
    { header: "Units", key: "units", width: 12 },
  ];
  (report.totalsByCategory || []).forEach((item) => {
    categories.addRow({
      category: item.category,
      revenue: Number(item.revenueCents || 0) / 100,
      tax: Number(item.taxCents || 0) / 100,
      total: Number(item.totalCents || 0) / 100,
      units: Number(item.units || 0),
    });
  });
  ["revenue", "tax", "total"].forEach((key) => {
    categories.getColumn(key).numFmt = "$#,##0.00";
  });

  const hourly = workbook.addWorksheet("Hourly Volume");
  hourly.columns = [
    { header: "Hour", key: "label", width: 12 },
    { header: "Orders", key: "orderCount", width: 12 },
    { header: "Drink Units", key: "units", width: 14 },
    { header: "Revenue", key: "revenue", width: 16 },
  ];
  (report.hourlyOrders || []).forEach((item) => {
    hourly.addRow({
      label: item.label,
      orderCount: Number(item.orderCount || 0),
      units: Number(item.units || 0),
      revenue: Number(item.revenueCents || 0) / 100,
    });
  });
  hourly.getColumn("revenue").numFmt = "$#,##0.00";

  const drinks = workbook.addWorksheet("Drink Inventory Detail");
  drinks.columns = [
    { header: "Drink", key: "name", width: 28 },
    { header: "Category", key: "category", width: 16 },
    { header: "Units", key: "units", width: 12 },
    { header: "Lines", key: "orderCount", width: 12 },
    { header: "Revenue", key: "revenue", width: 16 },
    { header: "Tax", key: "tax", width: 14 },
    { header: "Total Collected", key: "total", width: 18 },
    { header: "Average Unit Revenue", key: "averageUnitRevenue", width: 20 },
  ];
  (report.totalsByName || []).forEach((item) => {
    drinks.addRow({
      name: item.name,
      category: item.category,
      units: Number(item.units || 0),
      orderCount: Number(item.orderCount || 0),
      revenue: Number(item.revenueCents || 0) / 100,
      tax: Number(item.taxCents || 0) / 100,
      total: Number(item.totalCents || 0) / 100,
      averageUnitRevenue: Number(item.averageUnitRevenueCents || 0) / 100,
    });
  });
  ["revenue", "tax", "total", "averageUnitRevenue"].forEach((key) => {
    drinks.getColumn(key).numFmt = "$#,##0.00";
  });

  const orderDetail = workbook.addWorksheet("Order Detail");
  orderDetail.columns = [
    { header: "Time", key: "createdAtLabel", width: 22 },
    { header: "Order", key: "orderNumber", width: 14 },
    { header: "Customer", key: "customerName", width: 20 },
    { header: "Drink Units", key: "units", width: 14 },
    { header: "Drink Revenue", key: "revenue", width: 16 },
    { header: "Drink Tax", key: "tax", width: 14 },
    { header: "Drink Total", key: "total", width: 16 },
    { header: "Drinks", key: "items", width: 46 },
  ];
  (report.orderDetails || []).forEach((order) => {
    orderDetail.addRow({
      createdAtLabel: order.createdAtLabel,
      orderNumber: order.orderNumber,
      customerName: order.customerName || "",
      units: Number(order.units || 0),
      revenue: Number(order.revenueCents || 0) / 100,
      tax: Number(order.taxCents || 0) / 100,
      total: Number(order.totalCents || 0) / 100,
      items: (order.items || []).join(", "),
    });
  });
  ["revenue", "tax", "total"].forEach((key) => {
    orderDetail.getColumn(key).numFmt = "$#,##0.00";
  });

  [summary, categories, hourly, drinks, orderDetail].forEach((sheet) => {
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F4036" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  });

  return workbook.xlsx.writeBuffer();
}

function drawOwnerDrinkReportPdf(doc, report = {}, range = "today") {
  const ownerLogoPath = path.join(
    __dirname,
    "my-menu-app",
    "public",
    "goldies-logo-owner.png"
  );
  const shopHours = report.shopHours || getShopHoursForDate(report.startAt || new Date());
  const activeHours = (report.hourlyOrders || []).filter(
    (item) =>
      isHourWithinShopHours(item.hour, shopHours) &&
      Number(item.orderCount || 0) > 0
  );
  const peakHour = activeHours
    .slice()
    .sort((a, b) => Number(b.orderCount || 0) - Number(a.orderCount || 0))[0];
  const maxHourlyOrders = Math.max(
    1,
    ...activeHours.map((item) => Number(item.orderCount || 0))
  );

  doc.roundedRect(42, 36, 528, 112, 14).fillAndStroke("#FFFDF8", "#E9D8B7");
  if (fs.existsSync(ownerLogoPath)) {
    doc.image(ownerLogoPath, 58, 54, { width: 150, height: 66, fit: [150, 66] });
  }
  doc
    .fillColor("#0F4036")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Owner Report", 230, 58, { width: 300 });
  doc
    .fillColor("#6A614F")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("COFFEE SHOP PERFORMANCE SNAPSHOT", 230, 85, {
      width: 300,
      characterSpacing: 0.8,
    });
  doc
    .fillColor("#111111")
    .fontSize(11)
    .font("Helvetica")
    .text(`Range: ${getOwnerRangeLabel(range)}`, 230, 108, { width: 150 })
    .text(`Generated: ${new Date().toLocaleDateString("en-US")}`, 360, 108, {
      width: 170,
    });

  const metricTop = 172;
  const metrics = [
    ["Drink revenue", report.totalRevenue || "$0.00"],
    ["Drink orders", String(report.orderCount || 0)],
    ["Drink units", String(report.totalUnits || 0)],
    ["Non-drink add-ons", `${Number(report.drinkOrderNonDrinkAttachmentRate || 0)}%`],
  ];
  metrics.forEach(([label, value], index) => {
    const x = 42 + index * 135;
    doc
      .roundedRect(x, metricTop, 124, 62, 8)
      .fillAndStroke("#FFFDF8", "#E9D8B7");
    doc
      .fillColor("#6A614F")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), x + 10, metricTop + 10, { width: 104 });
    doc
      .fillColor("#0F4036")
      .fontSize(17)
      .font("Helvetica-Bold")
      .text(value, x + 10, metricTop + 29, { width: 104 });
  });

  doc
    .fillColor("#111111")
    .fontSize(10)
    .font("Helvetica")
    .text(
      `${Number(report.multiDrinkOrderCount || 0)} of ${Number(report.orderCount || 0)} individual drink orders contained 2 or more drinks.`,
      42,
      252,
      { width: 528 }
    );
  doc
    .fillColor("#111111")
    .fontSize(10)
    .font("Helvetica")
    .text(
      `${Number(report.drinkOrdersWithNonDrinkItems || 0)} of ${Number(report.orderCount || 0)} drink orders also contained non-drink items.`,
      42,
      266,
      { width: 528 }
    );

  doc
    .fillColor("#0F4036")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Hourly Volume", 42, 286);
  doc
    .fillColor("#6A614F")
    .fontSize(9)
    .font("Helvetica")
    .text(
      peakHour
        ? `Peak hour: ${peakHour.label} with ${peakHour.orderCount} orders.`
        : "No drink order volume yet for this range.",
      42,
      306
    );

  const chartTop = 332;
  (report.hourlyOrders || []).forEach((item, index) => {
    const x = 42 + index * 22;
    const barHeight = Math.round((Number(item.orderCount || 0) / maxHourlyOrders) * 82);
    doc.rect(x, chartTop + 88 - barHeight, 12, barHeight).fill("#CA862B");
    if (index % 3 === 0) {
      doc
        .fillColor("#6A614F")
        .fontSize(6)
        .text(String(item.hour), x - 1, chartTop + 94, { width: 18, align: "center" });
    }
  });

  doc
    .fillColor("#0F4036")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Category Mix", 42, 458);
  let y = 484;
  (report.totalsByCategory || []).forEach((item) => {
    doc
      .roundedRect(42, y, 528, 34, 8)
      .fillAndStroke("#FFFDF8", "#E9D8B7");
    doc
      .fillColor("#0F4036")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(item.category, 54, y + 10, { width: 120 });
    doc
      .fillColor("#111111")
      .font("Helvetica")
      .text(`${item.revenue} revenue`, 190, y + 10, { width: 120 })
      .text(`${item.units} units`, 330, y + 10, { width: 90 })
      .text(`${item.total} collected`, 430, y + 10, { width: 120 });
    y += 42;
  });

  doc
    .fillColor("#6A614F")
    .fontSize(8)
    .font("Helvetica")
    .text(
      "Drink counts include Coffee, Not Coffee, and Smoothies only. Retail items and bagged coffee are excluded.",
      42,
      724,
      { width: 528, align: "center" }
    );

  drawOwnerDrinkReportDetailPages(doc, report, range);
  doc.end();
}

function drawOwnerReportHeader(doc, title, subtitle = "") {
  doc
    .fillColor("#0F4036")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text(title, 42, 42, { width: 340 });
  if (subtitle) {
    doc
      .fillColor("#6A614F")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(subtitle.toUpperCase(), 42, 66, {
        width: 500,
        characterSpacing: 0.6,
      });
  }
  doc.moveTo(42, 86).lineTo(570, 86).strokeColor("#E9D8B7").stroke();
}

function drawOwnerReportFooter(doc, pageLabel) {
  doc
    .fillColor("#6A614F")
    .fontSize(8)
    .font("Helvetica")
    .text(pageLabel, 42, 736, { width: 528, align: "center" });
}

function drawOwnerReportTable(doc, { x = 42, y = 108, columns = [], rows = [], maxRows = 18 }) {
  const rowHeight = 28;
  const headerHeight = 24;
  doc.roundedRect(x, y, 528, headerHeight, 8).fillAndStroke("#0F4036", "#0F4036");
  let cursorX = x;
  columns.forEach((column) => {
    doc
      .fillColor("#FFFFFF")
      .fontSize(7)
      .font("Helvetica-Bold")
      .text(String(column.label || "").toUpperCase(), cursorX + 8, y + 8, {
        width: column.width - 10,
      });
    cursorX += column.width;
  });

  let cursorY = y + headerHeight + 6;
  rows.slice(0, maxRows).forEach((row, index) => {
    const bg = index % 2 === 0 ? "#FFFDF8" : "#FFFFFF";
    doc.roundedRect(x, cursorY, 528, rowHeight, 7).fillAndStroke(bg, "#E9D8B7");
    cursorX = x;
    columns.forEach((column) => {
      doc
        .fillColor(column.color || "#111111")
        .fontSize(column.fontSize || 8)
        .font(column.bold ? "Helvetica-Bold" : "Helvetica")
        .text(String(row[column.key] ?? ""), cursorX + 8, cursorY + 8, {
          width: column.width - 10,
          align: column.align || "left",
          ellipsis: true,
        });
      cursorX += column.width;
    });
    cursorY += rowHeight + 4;
  });

  return cursorY;
}

function drawOwnerDrinkReportDetailPages(doc, report = {}, range = "today") {
  const rangeLabel = getOwnerRangeLabel(range);
  const generatedLabel = new Date().toLocaleString("en-US", {
    timeZone: SHOP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const topDrinks = Array.isArray(report.totalsByName) ? report.totalsByName : [];
  const hourly = Array.isArray(report.hourlyOrders) ? report.hourlyOrders : [];
  const orderDetails = Array.isArray(report.orderDetails) ? report.orderDetails : [];

  doc.addPage();
  drawOwnerReportHeader(
    doc,
    "CPA + Tax Detail",
    `${rangeLabel} | generated ${generatedLabel}`
  );
  const taxRows = [
    {
      label: "Drink revenue before tax",
      amount: report.totalRevenue || "$0.00",
      note: "Sales attributed to Coffee, Not Coffee, and Smoothies only.",
    },
    {
      label: "Taxes collected on drinks",
      amount: report.totalTax || "$0.00",
      note: "Pulled from Square line-item tax on drink items.",
    },
    {
      label: "Total collected on drinks",
      amount: report.totalCollected || "$0.00",
      note: "Drink revenue plus drink tax.",
    },
    {
      label: "Average drink order value",
      amount: report.averageDrinkOrderValue || "$0.00",
      note: "Total collected divided by drink-order count.",
    },
    {
      label: "Drink orders with non-drink items",
      amount: `${Number(report.drinkOrderNonDrinkAttachmentRate || 0)}%`,
      note: `${Number(report.drinkOrdersWithNonDrinkItems || 0)} of ${Number(report.orderCount || 0)} drink orders also included food, retail, grocery, or other non-drink items.`,
    },
    {
      label: "Non-drink collected in same period",
      amount: report.nonDrinkTotal || "$0.00",
      note: `${Number(report.ordersWithNonDrinkItems || 0)} total orders contained non-drink items. This is shown as context, not included in drink revenue.`,
    },
  ];
  let y = drawOwnerReportTable(doc, {
    y: 108,
    columns: [
      { key: "label", label: "CPA line", width: 190, bold: true, color: "#0F4036" },
      { key: "amount", label: "Amount", width: 110, bold: true, align: "right" },
      { key: "note", label: "Notes", width: 228, fontSize: 7 },
    ],
    rows: taxRows,
    maxRows: 10,
  });
  y += 16;
  doc
    .fillColor("#0F4036")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Category ledger", 42, y);
  y += 22;
  drawOwnerReportTable(doc, {
    y,
    columns: [
      { key: "category", label: "Category", width: 128, bold: true, color: "#0F4036" },
      { key: "units", label: "Units", width: 70, align: "right" },
      { key: "revenue", label: "Revenue", width: 100, align: "right", bold: true },
      { key: "tax", label: "Tax", width: 100, align: "right" },
      { key: "total", label: "Collected", width: 130, align: "right", bold: true },
    ],
    rows: report.totalsByCategory || [],
    maxRows: 8,
  });
  drawOwnerReportFooter(
    doc,
    "CPA note: retail, grocery, food, and bagged coffee are excluded from this drink-only report."
  );

  const inventoryRows = topDrinks.map((item) => ({
    ...item,
    units: Number(item.units || 0),
    orderCount: Number(item.orderCount || 0),
  }));
  const inventoryChunks = chunkRows(inventoryRows, 18);
  (inventoryChunks.length ? inventoryChunks : [[]]).forEach((chunk, index) => {
    doc.addPage();
    drawOwnerReportHeader(
      doc,
      index ? `Inventory + Prep Detail (${index + 1})` : "Inventory + Prep Detail",
      "Drink unit movement by menu item"
    );
    drawOwnerReportTable(doc, {
      y: 108,
      columns: [
        { key: "name", label: "Drink", width: 178, bold: true, color: "#0F4036" },
        { key: "category", label: "Category", width: 92 },
        { key: "units", label: "Units", width: 60, align: "right", bold: true },
        { key: "orderCount", label: "Lines", width: 60, align: "right" },
        { key: "revenue", label: "Revenue", width: 78, align: "right" },
        { key: "averageUnitRevenue", label: "Avg/unit", width: 60, align: "right" },
      ],
      rows: chunk,
      maxRows: 18,
    });
    if (!index) {
      doc
        .fillColor("#6A614F")
        .fontSize(9)
        .font("Helvetica")
        .text(
          "Inventory use: start with the highest-unit drinks when checking smoothie supplies, milk, coffee, matcha, chai, refresher base, cups, lids, and syrups.",
          42,
          690,
          { width: 528 }
        );
    }
    drawOwnerReportFooter(doc, "Inventory detail is based on Square drink line items and quantities.");
  });

  doc.addPage();
  drawOwnerReportHeader(doc, "Hourly Staffing + Prep Detail", "Order flow by hour");
  drawOwnerReportTable(doc, {
    y: 108,
    columns: [
      { key: "label", label: "Hour", width: 110, bold: true, color: "#0F4036" },
      { key: "orderCount", label: "Orders", width: 82, align: "right", bold: true },
      { key: "units", label: "Units", width: 82, align: "right" },
      { key: "revenue", label: "Revenue", width: 110, align: "right" },
      { key: "notes", label: "Use", width: 144 },
    ],
    rows: hourly
      .filter((item) => isHourWithinShopHours(item.hour, report.shopHours))
      .map((item) => ({
        ...item,
        notes: Number(item.orderCount || 0) > 0 ? "Prep/staffing signal" : "Quiet hour",
      })),
    maxRows: 18,
  });
  drawOwnerReportFooter(doc, "Hourly detail helps spot rushes, prep windows, and staffing patterns.");

  const orderRows = orderDetails.map((order) => ({
    ...order,
    customerName: order.customerName || "-",
    itemsLabel: (order.items || []).join(", "),
  }));
  const orderChunks = chunkRows(orderRows, 19);
  (orderChunks.length ? orderChunks : [[]]).forEach((chunk, index) => {
    doc.addPage();
    drawOwnerReportHeader(
      doc,
      index ? `Order Detail (${index + 1})` : "Order Detail",
      "Drink orders included in this report"
    );
    drawOwnerReportTable(doc, {
      y: 108,
      columns: [
        { key: "createdAtLabel", label: "Time", width: 92, bold: true },
        { key: "orderNumber", label: "Order", width: 60, color: "#0F4036", bold: true },
        { key: "customerName", label: "Name", width: 76 },
        { key: "units", label: "Units", width: 48, align: "right", bold: true },
        { key: "total", label: "Collected", width: 82, align: "right" },
        { key: "itemsLabel", label: "Drinks", width: 170, fontSize: 7 },
      ],
      rows: chunk,
      maxRows: 19,
    });
    drawOwnerReportFooter(
      doc,
      orderRows.length
        ? `Order detail page ${index + 1} of ${orderChunks.length}.`
        : "No drink orders were found for this report range."
    );
  });
}

function chunkRows(rows = [], size = 18) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function writeOwnerDrinkReportPdf(res, report = {}, range = "today") {
  const doc = new PDFDocument({ size: "LETTER", margin: 42 });
  const fileToken = getOwnerReportFileToken(range);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="goldies-owner-report-${fileToken}.pdf"`
  );

  doc.pipe(res);
  drawOwnerDrinkReportPdf(doc, report, range);
}

async function fetchOwnerSnapshotsForMonth(month, ascending = true) {
  if (!supabase) {
    const error = new Error("Supabase is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const range = getMonthRange(month);
  if (!range) {
    const error = new Error("Month must be YYYY-MM.");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from("kds_owner_snapshots")
    .select("*")
    .gte("snapshot_date", getLocalDateKey(range.start))
    .lt("snapshot_date", getLocalDateKey(range.end))
    .order("snapshot_date", { ascending })
    .order("range_key", { ascending: true });

  if (error) throw error;
  return data || [];
}

function addOwnerSnapshotSheet(workbook, snapshots, month) {
  const sheet = workbook.addWorksheet("Monthly Snapshots", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date", key: "snapshot_date", width: 14 },
    { header: "Range", key: "range_label", width: 16 },
    { header: "Orders", key: "order_count", width: 10 },
    { header: "Orders With 2+ Drinks", key: "multi_drink_order_count", width: 22 },
    { header: "2+ Drink Order Rate", key: "multi_drink_order_rate", width: 20 },
    { header: "Drink Units", key: "drink_units", width: 12 },
    { header: "Drink Revenue", key: "total_revenue", width: 16 },
    { header: "Average Order Value", key: "average_order_value", width: 20 },
    { header: "Top Category", key: "top_category", width: 18 },
    { header: "Peak Hour", key: "peak_hour_label", width: 16 },
    { header: "Slow Hour", key: "slow_hour_label", width: 16 },
    { header: "Money Signal", key: "money_signal", width: 48 },
    { header: "Owner Action", key: "owner_action", width: 48 },
    { header: "Summary", key: "summary", width: 56 },
  ];

  snapshots.forEach((snapshot) => {
    sheet.addRow({
      snapshot_date: snapshot.snapshot_date,
      range_label: snapshot.range_label || snapshot.range_key,
      order_count: Number(snapshot.order_count || 0),
      multi_drink_order_count: Number(snapshot.multi_drink_order_count || 0),
      multi_drink_order_rate: `${Number(snapshot.multi_drink_order_rate || 0)}%`,
      drink_units: Number(snapshot.drink_units || 0),
      total_revenue: (Number(snapshot.total_revenue_cents || 0) || 0) / 100,
      average_order_value:
        (Number(snapshot.average_order_value_cents || 0) || 0) / 100,
      top_category: snapshot.top_category || "",
      peak_hour_label: snapshot.peak_hour_label || "",
      slow_hour_label: snapshot.slow_hour_label || "",
      money_signal: snapshot.money_signal || "",
      owner_action: snapshot.owner_action || "",
      summary: snapshot.summary || "",
    });
  });

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F4036" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  sheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 24 : 42;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE9D8B7" } },
      };
    });
  });

  sheet.getColumn("total_revenue").numFmt = "$#,##0.00";
  sheet.getColumn("average_order_value").numFmt = "$#,##0.00";

  const summary = workbook.addWorksheet("Month Summary");
  const totalOrders = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.order_count || 0),
    0
  );
  const totalMultiDrinkOrders = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.multi_drink_order_count || 0),
    0
  );
  const totalRevenueCents = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.total_revenue_cents || 0),
    0
  );
  const multiDrinkRate = totalOrders
    ? Math.round((totalMultiDrinkOrders / totalOrders) * 100)
    : 0;

  summary.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 30 },
  ];
  [
    ["Month", month],
    ["Saved snapshots", snapshots.length],
    ["Drink orders", totalOrders],
    ["Orders with 2+ drinks", totalMultiDrinkOrders],
    ["2+ drink order rate", `${multiDrinkRate}%`],
    ["Drink revenue", formatCurrency(totalRevenueCents)],
  ].forEach(([metric, value]) => summary.addRow({ metric, value }));
  summary.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCA862B" },
    };
  });
}

async function buildOwnerSnapshotsWorkbook(snapshots, month) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Goldie's KDS";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `Owner snapshots for ${month}`;
  workbook.title = `Goldie's Owner Report ${month}`;
  addOwnerSnapshotSheet(workbook, snapshots, month);
  return workbook.xlsx.writeBuffer();
}

function writeOwnerReportPdf(res, snapshots, month) {
  const doc = new PDFDocument({ size: "LETTER", margin: 42 });
  const ownerLogoPath = path.join(
    __dirname,
    "my-menu-app",
    "public",
    "goldies-logo-owner.png"
  );
  const totalOrders = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.order_count || 0),
    0
  );
  const totalMultiDrinkOrders = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.multi_drink_order_count || 0),
    0
  );
  const totalRevenueCents = snapshots.reduce(
    (sum, snapshot) => sum + Number(snapshot.total_revenue_cents || 0),
    0
  );
  const multiDrinkRate = totalOrders
    ? Math.round((totalMultiDrinkOrders / totalOrders) * 100)
    : 0;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="goldies-owner-report-${month}.pdf"`
  );

  doc.pipe(res);
  doc.roundedRect(42, 36, 528, 112, 14).fillAndStroke("#FFFDF8", "#E9D8B7");

  if (fs.existsSync(ownerLogoPath)) {
    doc.image(ownerLogoPath, 58, 54, { width: 150, height: 66, fit: [150, 66] });
  }

  doc
    .fillColor("#0F4036")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Owner Report", 230, 58, { width: 300 });
  doc
    .fillColor("#6A614F")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("COFFEE SHOP PERFORMANCE SNAPSHOT", 230, 85, {
      width: 300,
      characterSpacing: 0.8,
    });
  doc
    .fillColor("#111111")
    .fontSize(11)
    .font("Helvetica")
    .text(`Month: ${month}`, 230, 108, { width: 150 })
    .text(`Saved snapshots: ${snapshots.length}`, 360, 108, { width: 160 });

  doc.y = 172;
  const metricTop = doc.y;
  const metricWidth = 125;
  [
    ["Drink revenue", formatCurrency(totalRevenueCents)],
    ["Drink orders", String(totalOrders)],
    ["2+ drink orders", `${multiDrinkRate}%`],
    ["Count", `${totalMultiDrinkOrders} of ${totalOrders}`],
  ].forEach(([label, value], index) => {
    const x = 42 + index * (metricWidth + 10);
    doc
      .roundedRect(x, metricTop, metricWidth, 62, 8)
      .fillAndStroke("#FFFDF8", "#E9D8B7");
    doc
      .fillColor("#6A614F")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), x + 10, metricTop + 10, {
        width: metricWidth - 20,
      });
    doc
      .fillColor("#0F4036")
      .fontSize(17)
      .font("Helvetica-Bold")
      .text(value, x + 10, metricTop + 28, { width: metricWidth - 20 });
  });

  doc.y = metricTop + 84;
  doc
    .fillColor("#0F4036")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Saved Reads");
  doc.moveDown(0.4);

  if (!snapshots.length) {
    doc
      .fillColor("#6A614F")
      .fontSize(10)
      .font("Helvetica")
      .text("No owner snapshots were saved for this month.");
  }

  snapshots.forEach((snapshot) => {
    if (doc.y > 650) doc.addPage();
    doc
      .fillColor("#0F4036")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`${snapshot.snapshot_date} - ${snapshot.range_label || snapshot.range_key}`);
    doc
      .fillColor("#111111")
      .fontSize(9)
      .font("Helvetica")
      .text(
        `${formatCurrency(snapshot.total_revenue_cents)} drink revenue, ${Number(snapshot.order_count || 0)} orders, ${Number(snapshot.multi_drink_order_rate || 0)}% contained 2 or more drinks.`
      );
    if (snapshot.peak_hour_label || snapshot.top_category) {
      doc
        .fillColor("#6A614F")
        .text(
          `Peak: ${snapshot.peak_hour_label || "-"}   Top category: ${snapshot.top_category || "-"}`
        );
    }
    if (snapshot.owner_action) {
      doc
        .moveDown(0.2)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Owner action", { continued: false });
      doc.font("Helvetica").text(snapshot.owner_action, { width: 510 });
    }
    doc.moveDown(0.8);
  });

  doc.end();
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Goldie's KDS backend",
    environment: SQUARE_ENVIRONMENT,
    storage: supabase ? "supabase" : "memory",
    storageFallbackActive,
    storageFallbackLastError: storageFallbackLastError || null,
    loginConfigured: isKdsLoginConfigured(),
    passwordSource: kdsPasswordState.source,
    squareApi: {
      online: !squareApiAlertState.offline,
      lastHealthyAt: squareApiAlertState.lastHealthyAt
        ? new Date(squareApiAlertState.lastHealthyAt).toISOString()
        : null,
      lastError: squareApiAlertState.lastError || null,
      lastSyncSuccessAt: lastSquareSyncSuccessAt
        ? new Date(lastSquareSyncSuccessAt).toISOString()
        : null,
      lastSyncErrorAt: lastSquareSyncErrorAt
        ? new Date(lastSquareSyncErrorAt).toISOString()
        : null,
      lastSyncError: lastSquareSyncError || null,
      lastSyncSummary: lastSquareSyncSummary,
      cachedActiveTicketCount: lastKnownActiveTickets.length,
      cachedActiveTicketsAt: lastKnownActiveTicketsAt
        ? new Date(lastKnownActiveTicketsAt).toISOString()
        : null,
      suspiciousPickupNames: getSuspiciousPickupNameTickets(),
      alertsConfigured: hasAlertEmailConfig(),
      alertConfig: getAlertEmailConfigDiagnostics(),
    },
    time: new Date().toISOString(),
  });
});

app.post("/api/drinkflow-leads", async (req, res) => {
  try {
    const email = normalizeLeadEmail(req.body?.email);
    const shopName = cleanLeadText(req.body?.shopName, 120);
    const featureInterest = cleanLeadText(req.body?.featureInterest, 240);
    const source = cleanLeadText(req.body?.source || "learn-more", 80);
    const pagePath = cleanLeadText(req.body?.pagePath, 200);
    const referrer = cleanLeadText(req.body?.referrer || req.get("referer") || "", 300);
    const honeypot = cleanLeadText(req.body?.company, 80);

    if (honeypot) {
      return res.json({ ok: true, message: "Thanks. You are on the update list." });
    }

    if (!isValidLeadEmail(email)) {
      return res.status(400).json({ ok: false, error: "Enter a valid email address." });
    }

    if (!supabase) {
      return res.status(503).json({
        ok: false,
        error: "Email capture storage is not configured yet.",
      });
    }

    const { error } = await supabase.from("drinkflow_leads").upsert(
      {
        email,
        shop_name: shopName,
        feature_interest: featureInterest,
        source,
        page_path: pagePath,
        referrer,
        user_agent: cleanLeadText(req.get("user-agent") || "", 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Error saving DrinkFlow lead:", error);
      const missingTable =
        error.code === "42P01" || /drinkflow_leads|schema cache/i.test(error.message || "");
      return res.status(missingTable ? 503 : 500).json({
        ok: false,
        error: missingTable
          ? "Email capture table is not installed in Supabase yet. Run the latest supabase-schema.sql."
          : "Could not save that email right now.",
      });
    }

    res.json({ ok: true, message: "Thanks. You are on the update list." });
  } catch (error) {
    console.error("Error handling DrinkFlow lead:", error);
    res.status(500).json({ ok: false, error: "Could not save that email right now." });
  }
});

app.get("/api/drinkflow-leads", async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        ok: false,
        error: "Email capture storage is not configured yet.",
      });
    }

    const { data, error } = await supabase
      .from("drinkflow_leads")
      .select("email, shop_name, feature_interest, source, page_path, referrer, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading DrinkFlow leads:", error);
      const missingTable =
        error.code === "42P01" || /drinkflow_leads|schema cache/i.test(error.message || "");
      return res.status(missingTable ? 503 : 500).json({
        ok: false,
        error: missingTable
          ? "Email capture table is not installed in Supabase yet. Run the latest supabase-schema.sql."
          : "Could not load email leads right now.",
      });
    }

    res.json({
      ok: true,
      count: data?.length || 0,
      leads: (data || []).map((lead) => ({
        email: lead.email || "",
        shopName: lead.shop_name || "",
        featureInterest: lead.feature_interest || "",
        source: lead.source || "",
        pagePath: lead.page_path || "",
        referrer: lead.referrer || "",
        createdAt: lead.created_at || null,
        updatedAt: lead.updated_at || null,
      })),
    });
  } catch (error) {
    console.error("Error reading DrinkFlow leads:", error);
    res.status(500).json({ ok: false, error: "Could not load email leads right now." });
  }
});

app.post("/api/drinkflow-surveys", async (req, res) => {
  try {
    const email = normalizeLeadEmail(req.body?.email);
    const honeypot = cleanLeadText(req.body?.company, 80);

    if (honeypot) {
      return res.json({ ok: true, message: "Thanks. Your survey was received." });
    }

    if (email && !isValidLeadEmail(email)) {
      return res.status(400).json({ ok: false, error: "Enter a valid email address or leave it blank." });
    }

    if (!supabase) {
      return res.status(503).json({
        ok: false,
        error: "Survey storage is not configured yet.",
      });
    }

    const survey = {
      email,
      contact_name: cleanLeadText(req.body?.contactName, 120),
      shop_name: cleanLeadText(req.body?.shopName, 120),
      business_type: cleanLeadText(req.body?.businessType, 120),
      pos_system: cleanLeadText(req.body?.posSystem, 80),
      current_kds: cleanLeadText(req.body?.currentKds, 120),
      current_workflow: cleanLeadText(req.body?.currentWorkflow, 1000),
      screens: cleanLeadList(req.body?.screens, 8, 80),
      needs: cleanLeadText(req.body?.needs, 160),
      features: cleanLeadList(req.body?.features, 14, 100),
      pricing: cleanLeadText(req.body?.pricing, 120),
      custom_branding: cleanLeadText(req.body?.customBranding, 80),
      notes: cleanLeadText(req.body?.notes, 1000),
      source: cleanLeadText(req.body?.source || "survey", 80),
      page_path: cleanLeadText(req.body?.pagePath, 200),
      referrer: cleanLeadText(req.body?.referrer || req.get("referer") || "", 300),
      user_agent: cleanLeadText(req.get("user-agent") || "", 500),
    };

    const hasUsefulAnswer =
      survey.email ||
      survey.contact_name ||
      survey.shop_name ||
      survey.business_type ||
      survey.pos_system ||
      survey.current_workflow ||
      survey.features.length > 0;

    if (!hasUsefulAnswer) {
      return res.status(400).json({ ok: false, error: "Answer at least one question before submitting." });
    }

    const { error } = await supabase.from("drinkflow_surveys").insert(survey);

    if (error) {
      console.error("Error saving DrinkFlow survey:", error);
      const missingTable =
        error.code === "42P01" || /drinkflow_surveys|schema cache/i.test(error.message || "");
      return res.status(missingTable ? 503 : 500).json({
        ok: false,
        error: missingTable
          ? "Survey table is not installed in Supabase yet. Run the latest supabase-schema.sql."
          : "Could not save that survey right now.",
      });
    }

    res.json({ ok: true, message: "Thank you. Your feedback was saved." });
  } catch (error) {
    console.error("Error handling DrinkFlow survey:", error);
    res.status(500).json({ ok: false, error: "Could not save that survey right now." });
  }
});

function normalizeDrinkFlowOnboardingRequest(body = {}, req = null) {
  const email = normalizeLeadEmail(body.email);
  return {
    contact_name: cleanLeadText(body.contactName, 120),
    email,
    workspace_slug: normalizeDrinkFlowSlug(body.workspaceSlug || body.shopName),
    phone: cleanLeadText(body.phone, 80),
    shop_name: cleanLeadText(body.shopName, 140),
    business_type: cleanLeadText(body.businessType, 120),
    location: cleanLeadText(body.location, 160),
    website: cleanLeadText(body.website, 240),
    social_links: cleanLeadList(body.socialLinks, 8, 180),
    pos_system: cleanLeadText(body.posSystem, 80),
    starter_theme: cleanLeadText(body.starterTheme, 80),
    order_sources: cleanLeadList(body.orderSources, 10, 100),
    screen_needs: cleanLeadList(body.screenNeeds, 12, 100),
    current_pain: cleanLeadText(body.currentPain, 1200),
    average_daily_orders: cleanLeadText(body.averageDailyOrders, 80),
    rush_window: cleanLeadText(body.rushWindow, 160),
    pricing_comfort: cleanLeadText(body.pricingComfort, 120),
    timeline: cleanLeadText(body.timeline, 160),
    notes: cleanLeadText(body.notes, 1600),
    status: "new",
    source: cleanLeadText(body.source || "drinkflow-onboarding", 80),
    page_path: cleanLeadText(body.pagePath, 200),
    referrer: cleanLeadText(body.referrer || req?.get("referer") || "", 300),
    user_agent: cleanLeadText(req?.get("user-agent") || "", 500),
  };
}

function drinkFlowOnboardingTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    message.includes("drinkflow_onboarding_requests") ||
    message.includes("schema cache")
  );
}

app.post("/api/drinkflow-onboarding", async (req, res) => {
  try {
    const honeypot = cleanLeadText(req.body?.company, 80);
    if (honeypot) {
      return res.json({ ok: true, message: "Thanks. Your setup request was received." });
    }

    const request = normalizeDrinkFlowOnboardingRequest(req.body, req);

    if (!request.email || !isValidLeadEmail(request.email)) {
      return res.status(400).json({ ok: false, error: "Enter a valid email address." });
    }

    if (!request.shop_name && !request.business_type && !request.current_pain) {
      return res.status(400).json({
        ok: false,
        error: "Tell us a little about the shop before submitting.",
      });
    }

    if (!supabase) {
      const localRequest = {
        id: `local-${Date.now()}`,
        ...request,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localDrinkFlowOnboardingRequests.unshift(localRequest);
      localDrinkFlowOnboardingRequests = localDrinkFlowOnboardingRequests.slice(0, 200);
      return res.json({
        ok: true,
        request: localRequest,
        storage: "memory",
        message: "Thanks. Your setup request was received.",
      });
    }

    const { data, error } = await supabase
      .from("drinkflow_onboarding_requests")
      .insert(request)
      .select("*")
      .single();

    if (error) throw error;

    res.json({
      ok: true,
      request: data,
      storage: "supabase",
      message: "Thanks. Your setup request was received.",
    });
  } catch (error) {
    if (drinkFlowOnboardingTableMissing(error)) {
      return res.status(503).json({
        ok: false,
        error:
          "DrinkFlow onboarding table is not installed in Supabase yet. Run the latest supabase-schema.sql.",
      });
    }

    console.error("Error saving DrinkFlow onboarding request:", error);
    res.status(500).json({ ok: false, error: "Could not save that setup request right now." });
  }
});

async function handleSquareAlertTest(req, res) {
  try {
    if (!hasAlertEmailConfig()) {
      return res.status(503).json({
        ok: false,
        error: "Alert email is not configured in the backend.",
      });
    }

    await sendAlertEmail(
      "Goldie's KDS: test alert",
      [
        "This is a test email from Goldie's KDS.",
        "",
        `Time: ${new Date().toLocaleString()}`,
        "",
        "If you received this, the alert email setup is working.",
      ].join("\n")
    );

    res.json({
      ok: true,
      sent: true,
      message: "Test alert email sent",
    });
  } catch (error) {
    console.error("Error sending test alert email:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

app.get("/api/square-alert-test", requireKdsAuth, handleSquareAlertTest);
app.post("/api/square-alert-test", requireKdsAuth, handleSquareAlertTest);

const DEVELOPER_NOTE_PROJECTS = new Set([
  "Studio Samantha",
  "GoldiesKDS",
  "DrinkFlowKDS",
  "Ignite Wonder",
  "VendorFlow",
]);
const DEVELOPER_NOTE_PLACEMENTS = new Set([
  "Developer diary",
  "Popup message",
  "Owner reports",
  "Case study",
  "Release notes",
  "Landing page",
  "Internal idea",
]);
const DEVELOPER_NOTE_VISIBILITY = new Set(["internal", "owner", "public"]);

function normalizeDeveloperNote(body = {}, username = DEVELOPER_USERNAME) {
  const project = cleanLeadText(body.project, 60) || "Studio Samantha";
  const placement = cleanLeadText(body.placement, 60) || "Developer diary";
  const visibility = cleanLeadText(body.visibility, 30) || "internal";
  const title = cleanLeadText(body.title, 140);
  const bodyText = cleanLeadText(body.body, 4000);
  const suggestion = cleanLeadText(body.suggestion, 900);
  const mood = cleanLeadText(body.mood, 50) || "sparkly";
  const showUntil = cleanLeadText(body.showUntil, 20);

  return {
    project: DEVELOPER_NOTE_PROJECTS.has(project) ? project : "Studio Samantha",
    placement: DEVELOPER_NOTE_PLACEMENTS.has(placement) ? placement : "Developer diary",
    visibility: DEVELOPER_NOTE_VISIBILITY.has(visibility) ? visibility : "internal",
    title: title || "Untitled studio note",
    body: bodyText,
    suggestion,
    mood,
    tags: cleanLeadList(body.tags, 12, 40),
    show_until: /^\d{4}-\d{2}-\d{2}$/.test(showUntil) ? showUntil : null,
    created_by: normalizeName(username) || DEVELOPER_USERNAME,
  };
}

function developerNotesTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    message.includes("developer_notes") ||
    message.includes("schema cache")
  );
}

function sortDeveloperNotes(notes = []) {
  return [...notes].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

async function recordAccessLog({
  actor = "",
  role = "owner",
  action = "login",
  req = null,
} = {}) {
  const entry = {
    actor: normalizeName(actor) || role,
    role: cleanLeadText(role, 40),
    action: cleanLeadText(action, 60),
    ip_address: cleanLeadText(getRequestIp(req), 80),
    user_agent: cleanLeadText(req?.headers?.["user-agent"] || "", 300),
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    localAccessLogs.unshift({ id: `local-${Date.now()}`, ...entry });
    trimLocalAccessLogs();
    localAccessLogs = localAccessLogs.slice(0, 200);
    return entry;
  }

  const { error } = await supabase.from("kds_access_logs").insert(entry);
  if (error) throw error;

  pruneAccessLogs().catch((cleanupError) => {
    console.warn(`WARNING: Unable to prune access logs: ${cleanupError.message}`);
  });

  return entry;
}

function accessLogsTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    message.includes("kds_access_logs") ||
    message.includes("schema cache")
  );
}

function accessLogsArchiveTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    message.includes("kds_access_logs_archive") ||
    message.includes("schema cache")
  );
}

async function pruneAccessLogs() {
  const cutoffAt = getAccessLogRetentionCutoff();

  if (!supabase) {
    trimLocalAccessLogs();
    return { archived: 0, deleted: 0, storage: "memory" };
  }

  const { data: oldLogs, error: fetchError } = await supabase
    .from("kds_access_logs")
    .select("*")
    .lt("created_at", cutoffAt)
    .order("created_at", { ascending: true })
    .limit(500);

  if (fetchError) throw fetchError;
  if (!oldLogs?.length) return { archived: 0, deleted: 0, storage: "supabase" };

  const archiveRows = oldLogs.map(({ id, ...row }) => ({
    original_id: id,
    ...row,
  }));

  let archiveSucceeded = false;
  try {
    const { error: archiveError } = await supabase
      .from("kds_access_logs_archive")
      .upsert(archiveRows, { onConflict: "original_id" });

    if (archiveError) {
      if (!accessLogsArchiveTableMissing(archiveError)) throw archiveError;
    } else {
      archiveSucceeded = true;
    }
  } catch (error) {
    if (!accessLogsArchiveTableMissing(error)) throw error;
  }

  const { error: deleteError } = await supabase
    .from("kds_access_logs")
    .delete()
    .lt("created_at", cutoffAt);

  if (deleteError) throw deleteError;

  return {
    archived: archiveSucceeded ? archiveRows.length : 0,
    deleted: oldLogs.length,
    storage: "supabase",
  };
}

function customerInsightsArchiveTableMissing(error) {
  const message = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    message.includes("kds_customer_insights_archive") ||
    message.includes("schema cache")
  );
}

async function pruneCustomerInsights() {
  const cutoffAt = getCustomerInsightRetentionCutoff();

  if (!supabase) {
    trimLocalCustomerInsights();
    return { archived: 0, deleted: 0, storage: "memory" };
  }

  const { data: oldInsights, error: fetchError } = await supabase
    .from("kds_customer_insights")
    .select("*")
    .lt("created_at", cutoffAt)
    .order("created_at", { ascending: true })
    .limit(500);

  if (fetchError) throw fetchError;
  if (!oldInsights?.length) return { archived: 0, deleted: 0, storage: "supabase" };

  const archiveRows = oldInsights.map(({ id, ...row }) => ({
    original_id: id,
    ...row,
  }));

  let archiveSucceeded = false;
  try {
    const { error: archiveError } = await supabase
      .from("kds_customer_insights_archive")
      .upsert(archiveRows, { onConflict: "original_id" });

    if (archiveError) {
      if (!customerInsightsArchiveTableMissing(archiveError)) throw archiveError;
    } else {
      archiveSucceeded = true;
    }
  } catch (error) {
    if (!customerInsightsArchiveTableMissing(error)) throw error;
  }

  const { error: deleteError } = await supabase
    .from("kds_customer_insights")
    .delete()
    .lt("created_at", cutoffAt);

  if (deleteError) throw deleteError;

  return {
    archived: archiveSucceeded ? archiveRows.length : 0,
    deleted: oldInsights.length,
    storage: "supabase",
  };
}

async function fetchAccessLogs({ role = "owner", limit = 12 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 80);
  const normalizedRole = cleanLeadText(role, 40);
  const cutoffAt = getAccessLogRetentionCutoff();

  if (!supabase) {
    return localAccessLogs
      .filter(
        (entry) =>
          (!normalizedRole || entry.role === normalizedRole) &&
          Date.parse(entry.created_at || 0) >= Date.parse(cutoffAt)
      )
      .slice(0, safeLimit);
  }

  let query = supabase
    .from("kds_access_logs")
    .select("*")
    .gte("created_at", cutoffAt)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (normalizedRole) query = query.eq("role", normalizedRole);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchDeveloperNotes({ project = "", limit = 80 } = {}) {
  const normalizedProject = cleanLeadText(project, 60);
  const safeLimit = Math.min(Math.max(Number(limit) || 80, 1), 200);

  if (!supabase) {
    const filtered = normalizedProject
      ? localDeveloperNotes.filter((note) => note.project === normalizedProject)
      : localDeveloperNotes;
    return sortDeveloperNotes(filtered).slice(0, safeLimit);
  }

  let query = supabase
    .from("developer_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (normalizedProject) query = query.eq("project", normalizedProject);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchDrinkFlowOnboardingRequests({ limit = 30 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);

  if (!supabase) {
    return localDrinkFlowOnboardingRequests.slice(0, safeLimit);
  }

  const { data, error } = await supabase
    .from("drinkflow_onboarding_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data || [];
}

app.get("/api/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[SESSION_COOKIE_NAME]);
  const authenticated = isKdsLoginConfigured() && Boolean(session);

  res.json({
    authenticated,
    configured: isKdsLoginConfigured(),
    employeeName: session?.employeeName || "",
  });
});

app.get("/api/developer/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[DEVELOPER_SESSION_COOKIE_NAME]);

  res.json({
    authenticated: Boolean(session && session.role === "developer"),
    username: session?.username || "",
  });
});

app.post("/api/developer/login", (req, res) => {
  const username = normalizeName(req.body?.username || "");
  const password = req.body?.password;

  if (!isDeveloperLoginMatch(username, password)) {
    return res.status(401).json({ error: "That studio login did not match." });
  }

  res.setHeader(
    "Set-Cookie",
    `${DEVELOPER_SESSION_COOKIE_NAME}=${encodeURIComponent(createDeveloperSessionToken(username))}; ${getCookieOptions()}`
  );

  recordAccessLog({
    actor: username,
    role: "developer",
    action: "login",
    req,
  }).catch((error) => {
    if (!accessLogsTableMissing(error)) {
      console.warn(`WARNING: Unable to record developer login: ${error.message}`);
    }
  });

  res.json({ ok: true, username });
});

app.post("/api/developer/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${DEVELOPER_SESSION_COOKIE_NAME}=; ${getCookieOptions(0)}`
  );

  res.json({ ok: true });
});

app.get("/api/developer/notes", requireDeveloperAuth, async (req, res) => {
  try {
    const notes = await fetchDeveloperNotes({
      project: req.query.project,
      limit: req.query.limit,
    });

    res.json({ notes, storage: supabase ? "supabase" : "memory" });
  } catch (error) {
    if (developerNotesTableMissing(error)) {
      return res.json({
        notes: [],
        tableMissing: true,
        storage: "missing-table",
        message: "Developer notes table is not installed in Supabase yet.",
      });
    }

    console.error("Error fetching developer notes:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/developer/drinkflow-onboarding", requireDeveloperAuth, async (req, res) => {
  try {
    const requests = await fetchDrinkFlowOnboardingRequests({ limit: req.query.limit });

    res.json({ requests, storage: supabase ? "supabase" : "memory" });
  } catch (error) {
    if (drinkFlowOnboardingTableMissing(error)) {
      return res.json({
        requests: [],
        tableMissing: true,
        storage: "missing-table",
        message: "DrinkFlow onboarding table is not installed in Supabase yet.",
      });
    }

    console.error("Error fetching DrinkFlow onboarding requests:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/developer/drinkflow-workspaces", requireDeveloperAuth, async (req, res) => {
  try {
    const ownerEmail = normalizeLeadEmail(req.body?.ownerEmail || req.body?.email);
    if (ownerEmail && !isValidLeadEmail(ownerEmail)) {
      return res.status(400).json({ error: "Enter a valid owner email address." });
    }

    const workspace = await reserveDrinkFlowWorkspace({
      slug: req.body?.slug,
      shopName: req.body?.shopName,
      ownerEmail,
      ownerName: req.body?.ownerName,
      req,
    });

    const verificationEmailSent = await sendDrinkFlowVerificationEmail(workspace).catch((mailError) => {
      console.error("DrinkFlow verification email failed:", mailError.message);
      return false;
    });

    res.json({ ok: true, verificationEmailSent, workspace: publicWorkspacePayload(workspace) });
  } catch (error) {
    console.error("Error reserving DrinkFlow workspace:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/developer/drinkflow-workspaces/verify", requireDeveloperAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Workspace storage is not configured." });

    const slug = normalizeDrinkFlowSlug(req.body?.slug || req.body?.workspaceSlug || "");
    const ownerEmail = normalizeLeadEmail(req.body?.ownerEmail || req.body?.email || "");
    if (!slug) return res.status(400).json({ error: "Workspace slug is required." });
    if (ownerEmail && !isValidLeadEmail(ownerEmail)) {
      return res.status(400).json({ error: "Enter a valid owner email address." });
    }

    const update = {
      email_verified: true,
      email_verification_token: "",
      updated_at: new Date().toISOString(),
    };
    if (ownerEmail) update.owner_email = ownerEmail;

    const { data, error } = await supabase
      .from("drinkflow_workspaces")
      .update(update)
      .eq("slug", slug)
      .select("slug, shop_name, owner_email, owner_name, status, email_verified, square_connected, app_url, created_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Workspace was not found." });

    res.json({ ok: true, workspace: publicWorkspacePayload(data) });
  } catch (error) {
    console.error("Error manually verifying DrinkFlow workspace:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/drinkflow-workspaces/verify-email", async (req, res) => {
  try {
    const token = cleanLeadText(req.query.token, 120);
    if (!token) return res.status(400).send("Verification token is missing.");
    if (!supabase) return res.status(503).send("Workspace storage is not configured.");

    const { data, error } = await supabase
      .from("drinkflow_workspaces")
      .update({
        email_verified: true,
        email_verification_token: "",
        updated_at: new Date().toISOString(),
      })
      .eq("email_verification_token", token)
      .select("slug")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).send("Verification link is invalid or already used.");

    res.redirect(`https://drinkflowkds.com/setup.html?email=verified&workspace=${encodeURIComponent(data.slug)}`);
  } catch (error) {
    console.error("DrinkFlow email verification error:", error);
    res.status(500).send("Email verification failed.");
  }
});

app.post("/api/drinkflow-workspaces", async (req, res) => {
  try {
    const ownerEmail = normalizeLeadEmail(req.body?.ownerEmail || req.body?.email);
    if (!ownerEmail || !isValidLeadEmail(ownerEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    const workspace = await reserveDrinkFlowWorkspace({
      slug: req.body?.slug,
      shopName: req.body?.shopName,
      ownerEmail,
      ownerName: req.body?.ownerName,
      req,
    });

    const verificationEmailSent = await sendDrinkFlowVerificationEmail(workspace).catch((mailError) => {
      console.error("DrinkFlow verification email failed:", mailError.message);
      return false;
    });

    res.json({ ok: true, verificationEmailSent, workspace: publicWorkspacePayload(workspace) });
  } catch (error) {
    console.error("Error creating DrinkFlow workspace:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/drinkflow-workspaces/resend-verification", async (req, res) => {
  try {
    const ownerEmail = normalizeLeadEmail(req.body?.ownerEmail || req.body?.email);
    const slug = normalizeDrinkFlowSlug(req.body?.slug || req.body?.workspaceSlug || "");
    if (!ownerEmail || !isValidLeadEmail(ownerEmail) || !slug) {
      return res.status(400).json({ error: "Enter the shop link and email used for signup." });
    }

    const workspace = await refreshDrinkFlowVerificationToken({ slug, ownerEmail });
    if (!workspace) {
      return res.status(404).json({ error: "We could not find an unverified app with that email and shop link." });
    }
    if (workspace.email_verified) {
      return res.json({
        ok: true,
        alreadyVerified: true,
        message: "This email is already verified. You can continue setup.",
        workspace: publicWorkspacePayload(workspace),
      });
    }

    const verificationEmailSent = await sendDrinkFlowVerificationEmail(workspace).catch((mailError) => {
      console.error("DrinkFlow verification resend failed:", mailError.message);
      return false;
    });

    if (!verificationEmailSent) {
      return res.status(503).json({
        error: "The app was found, but the verification email could not be sent yet.",
      });
    }

    res.json({
      ok: true,
      verificationEmailSent,
      message: "Verification email resent.",
      workspace: publicWorkspacePayload(workspace),
    });
  } catch (error) {
    console.error("Error resending DrinkFlow verification email:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/drinkflow/square/oauth/start", async (req, res) => {
  if (!DRINKFLOW_SQUARE_APPLICATION_ID || !DRINKFLOW_SQUARE_APPLICATION_SECRET) {
    return res.status(503).json({
      error:
        "Square OAuth is not configured yet. Add DRINKFLOW_SQUARE_APPLICATION_ID, DRINKFLOW_SQUARE_APPLICATION_SECRET, and DRINKFLOW_SQUARE_REDIRECT_URL in Render.",
      diagnostics: getDrinkFlowSquareOAuthDiagnostics(),
    });
  }

  const slug = normalizeDrinkFlowSlug(req.query.slug || "");
  if (!slug) return res.status(400).json({ error: "Workspace is required before connecting Square." });

  try {
    const workspace = await getDrinkFlowWorkspaceBySlug(slug);
    if (!workspace) return res.status(404).json({ error: "Create your DrinkFlow app before connecting Square." });
    if (!workspace.email_verified) {
      return res.status(403).json({
        error: "Verify your email before connecting Square.",
        nextStep: "Open the verification email from DrinkFlow, then return to setup.",
      });
    }
  } catch (error) {
    console.error("Error checking DrinkFlow workspace before Square OAuth:", error);
    return res.status(500).json({ error: "Could not verify your workspace before connecting Square." });
  }

  const state = Buffer.from(
    JSON.stringify({ slug, nonce: crypto.randomUUID(), createdAt: Date.now() })
  ).toString("base64url");
  const params = new URLSearchParams({
    client_id: DRINKFLOW_SQUARE_APPLICATION_ID,
    scope: DRINKFLOW_SQUARE_OAUTH_SCOPE,
    session: "false",
    state,
    redirect_uri: DRINKFLOW_SQUARE_REDIRECT_URL,
  });

  res.redirect(`${getSquareRestBaseUrl()}/oauth2/authorize?${params.toString()}`);
});

app.get("/api/developer/square/oauth/start", requireDeveloperAuth, (req, res) => {
  if (!DRINKFLOW_SQUARE_APPLICATION_ID || !DRINKFLOW_SQUARE_APPLICATION_SECRET) {
    return res.status(503).json({
      error:
        "Square OAuth is not configured yet. Add DRINKFLOW_SQUARE_APPLICATION_ID, DRINKFLOW_SQUARE_APPLICATION_SECRET, and DRINKFLOW_SQUARE_REDIRECT_URL in Render.",
      diagnostics: getDrinkFlowSquareOAuthDiagnostics(),
    });
  }

  const slug = normalizeDrinkFlowSlug(req.query.slug || "studio-samantha");
  const state = Buffer.from(
    JSON.stringify({ slug, nonce: crypto.randomUUID(), createdAt: Date.now() })
  ).toString("base64url");
  const params = new URLSearchParams({
    client_id: DRINKFLOW_SQUARE_APPLICATION_ID,
    scope: DRINKFLOW_SQUARE_OAUTH_SCOPE,
    session: "false",
    state,
    redirect_uri: DRINKFLOW_SQUARE_REDIRECT_URL,
  });

  res.redirect(`${getSquareRestBaseUrl()}/oauth2/authorize?${params.toString()}`);
});

async function handleDrinkFlowSquareOAuthCallback(req, res) {
  try {
    const code = cleanLeadText(req.query.code, 500);
    const state = cleanLeadText(req.query.state, 1000);
    if (!code) return res.status(400).send("Square did not return an authorization code.");
    if (!DRINKFLOW_SQUARE_APPLICATION_ID || !DRINKFLOW_SQUARE_APPLICATION_SECRET) {
      return res.status(503).send("Square OAuth is not configured in Render yet.");
    }

    const tokenResponse = await fetch(`${getSquareRestBaseUrl()}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": SQUARE_API_VERSION,
      },
      body: JSON.stringify({
        client_id: DRINKFLOW_SQUARE_APPLICATION_ID,
        client_secret: DRINKFLOW_SQUARE_APPLICATION_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: DRINKFLOW_SQUARE_REDIRECT_URL,
      }),
    });
    const payload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      console.error("Square OAuth token error:", JSON.stringify(payload));
      return res.status(502).send("Square connection failed. Check the OAuth app settings.");
    }

    const statePayload = (() => {
      try {
        return JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      } catch {
        return {};
      }
    })();
    const slug = normalizeDrinkFlowSlug(statePayload.slug || "studio-samantha");

    if (supabase) {
      await supabase.from("drinkflow_square_connections").upsert(
        {
          workspace_slug: slug,
          merchant_id: payload.merchant_id || "",
          access_token: payload.access_token || "",
          refresh_token: payload.refresh_token || "",
          expires_at: payload.expires_at || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_slug" }
      );
      await supabase
        .from("drinkflow_workspaces")
        .update({ square_connected: true, updated_at: new Date().toISOString() })
        .eq("slug", slug);
    }

    res.redirect(`https://drinkflowkds.com/setup.html?square=connected&workspace=${encodeURIComponent(slug)}`);
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    res.status(500).send("Square connection failed.");
  }
}

app.get("/api/drinkflow/square/oauth/callback", handleDrinkFlowSquareOAuthCallback);

app.get("/api/developer/square/oauth/callback", requireDeveloperAuth, handleDrinkFlowSquareOAuthCallback);

app.post("/api/developer/notes", requireDeveloperAuth, async (req, res) => {
  try {
    const note = normalizeDeveloperNote(req.body, req.developerSession?.username);

    if (!note.body && !note.suggestion) {
      return res.status(400).json({
        error: "Add a diary note, suggestion, or update before saving.",
      });
    }

    if (!supabase) {
      const localNote = {
        id: `local-${Date.now()}`,
        ...note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localDeveloperNotes.unshift(localNote);
      return res.json({ ok: true, note: localNote, storage: "memory" });
    }

    const { data, error } = await supabase
      .from("developer_notes")
      .insert(note)
      .select("*")
      .single();

    if (error) throw error;

    res.json({ ok: true, note: data, storage: "supabase" });
  } catch (error) {
    if (developerNotesTableMissing(error)) {
      return res.status(503).json({
        error:
          "Developer notes table is not installed in Supabase yet. Run the latest supabase-schema.sql.",
      });
    }

    console.error("Error saving developer note:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/login", (req, res) => {
  const password = req.body?.password;
  const employeeName = normalizeName(
    req.body?.employeeName || req.body?.employeeNumber || req.body?.employeeId || "Employee"
  );

  if (!isKdsLoginConfigured()) {
    return res.status(503).json({
      error: "KDS login is not configured. Set a password in the backend.",
    });
  }

  if (!employeeName) {
    return res.status(400).json({ error: "Employee name or number is required" });
  }

  if (!isPasswordMatch(password)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(createSessionToken(employeeName))}; ${getCookieOptions()}`
  );

  res.json({ ok: true, employeeName });
});

app.post("/api/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; ${getCookieOptions(0)}`
  );

  res.json({ ok: true });
});

app.get("/api/owner/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSessionFromToken(cookies[OWNER_SESSION_COOKIE_NAME]);

  res.json({
    authenticated: Boolean(session && session.role === "owner"),
    ownerName: session?.ownerName || "",
  });
});

app.post("/api/owner/login", (req, res) => {
  const password = req.body?.password;
  const ownerName = normalizeName(req.body?.ownerName || "Owner");

  if (!isOwnerPasswordMatch(password)) {
    return res.status(401).json({ error: "Invalid owner password" });
  }

  res.setHeader(
    "Set-Cookie",
    `${OWNER_SESSION_COOKIE_NAME}=${encodeURIComponent(createOwnerSessionToken(ownerName))}; ${getCookieOptions()}`
  );

  recordAccessLog({
    actor: ownerName,
    role: "owner",
    action: "login",
    req,
  }).catch((error) => {
    if (!accessLogsTableMissing(error)) {
      console.warn(`WARNING: Unable to record owner login: ${error.message}`);
    }
  });

  res.json({ ok: true, ownerName });
});

app.post("/api/owner/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${OWNER_SESSION_COOKIE_NAME}=; ${getCookieOptions(0)}`
  );

  res.json({ ok: true });
});

app.get("/api/owner/reports/drink-revenue", requireOwnerAuth, async (req, res) => {
  try {
    const period = buildOwnerReportPeriod(req.query);
    const report = await getOwnerDrinkRevenueReport(period).catch((error) => {
      console.error("Error building owner drink revenue report:", error);
      return {
        startAt: period.start.toISOString(),
        endAt: period.end.toISOString(),
        orderCount: 0,
        multiDrinkOrderCount: 0,
        multiDrinkOrderRate: 0,
        totalUnits: 0,
        totalRevenueCents: 0,
        totalRevenue: "$0.00",
        totalTaxCents: 0,
        totalTax: "$0.00",
        totalCollectedCents: 0,
        totalCollected: "$0.00",
        averageDrinkOrderValueCents: 0,
        averageDrinkOrderValue: "$0.00",
        totalsByCategory: [],
        hourlyOrders: [],
        shopHours: getShopHoursForDate(new Date()),
      };
    });

    res.json({
      ...report,
      range: period.range,
      rangeLabel: period.label,
      startDate: period.startDate || null,
      endDate: period.endDate || null,
    });
  } catch (error) {
    console.error("Error fetching owner drink revenue report:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/owner/reports/drink-making-time", requireOwnerAuth, async (req, res) => {
  try {
    const period = buildOwnerReportPeriod(req.query);
    const report = await getDrinkMakingTimeReport(period).catch((error) => {
      console.error("Error building owner drink making time report:", error);
      return {
        averageSeconds: 0,
        label: "Collecting",
        sampleSize: 0,
        range: period.range,
        rangeLabel: period.label,
        startAt: period.start.toISOString(),
        endAt: period.end.toISOString(),
        byHour: [],
        byDrinkName: [],
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error fetching owner drink making time report:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/owner/reports/drink-revenue.csv", requireOwnerAuth, async (req, res) => {
  try {
    const period = buildOwnerReportPeriod(req.query);
    const report = await getOwnerDrinkRevenueReport(period);
    const fileToken = getOwnerReportFileToken(period);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-report-${fileToken}.csv"`
    );
    res.send(ownerReportToCsv(report, period));
  } catch (error) {
    console.error("Error downloading owner report CSV:", error);
    res.status(error.statusCode || 500).send(error.message);
  }
});

app.get("/api/owner/reports/drink-revenue.xlsx", requireOwnerAuth, async (req, res) => {
  try {
    const period = buildOwnerReportPeriod(req.query);
    const report = await getOwnerDrinkRevenueReport(period);
    const workbookBuffer = await buildOwnerReportWorkbook(report, period);
    const fileToken = getOwnerReportFileToken(period);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-report-${fileToken}.xlsx"`
    );
    res.send(Buffer.from(workbookBuffer));
  } catch (error) {
    console.error("Error downloading owner report workbook:", error);
    res.status(error.statusCode || 500).send(error.message);
  }
});

app.get("/api/owner/reports/drink-revenue.pdf", requireOwnerAuth, async (req, res) => {
  try {
    const period = buildOwnerReportPeriod(req.query);
    const report = await getOwnerDrinkRevenueReport(period);
    writeOwnerDrinkReportPdf(res, report, period);
  } catch (error) {
    console.error("Error downloading owner report PDF:", error);
    res.status(error.statusCode || 500).send(error.message);
  }
});

app.get("/api/owner/access-log", requireOwnerAuth, async (req, res) => {
  try {
    pruneAccessLogs().catch((cleanupError) => {
      console.warn(`WARNING: Unable to prune access logs: ${cleanupError.message}`);
    });
    const logs = await fetchAccessLogs({ role: "owner", limit: req.query.limit || 12 });
    res.json({ logs, storage: supabase ? "supabase" : "memory" });
  } catch (error) {
    if (accessLogsTableMissing(error)) {
      return res.json({
        logs: [],
        tableMissing: true,
        storage: "missing-table",
        message: "Access log table is not installed in Supabase yet.",
      });
    }

    console.error("Error fetching owner access log:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/owner/snapshots", requireOwnerAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase is not configured." });
    }

    const cookies = parseCookies(req.headers.cookie || "");
    const ownerSession = getSessionFromToken(cookies[OWNER_SESSION_COOKIE_NAME]);
    const snapshot = normalizeSnapshotPayload(req.body, ownerSession?.ownerName);

    const { data, error } = await supabase
      .from("kds_owner_snapshots")
      .upsert(snapshot, { onConflict: "snapshot_date,range_key" })
      .select("*")
      .single();

    if (error) throw error;

    res.json({ ok: true, snapshot: data });
  } catch (error) {
    if (snapshotsTableMissing(error)) {
      return res.status(503).json({
        error:
          "Owner snapshot table is not installed in Supabase yet. Run the latest supabase-schema.sql.",
      });
    }

    console.error("Error saving owner snapshot:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/owner/snapshots", requireOwnerAuth, async (req, res) => {
  try {
    const month = normalizeName(req.query.month || getLocalDateKey().slice(0, 7));
    const data = await fetchOwnerSnapshotsForMonth(month, false);

    res.json({ month, snapshots: data || [] });
  } catch (error) {
    if (snapshotsTableMissing(error)) {
      return res.json({
        month: normalizeName(req.query.month || getLocalDateKey().slice(0, 7)),
        snapshots: [],
        tableMissing: true,
      });
    }

    console.error("Error fetching owner snapshots:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/owner/snapshots.csv", requireOwnerAuth, async (req, res) => {
  try {
    const month = normalizeName(req.query.month || getLocalDateKey().slice(0, 7));
    const data = await fetchOwnerSnapshotsForMonth(month, true);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-snapshots-${month}.csv"`
    );
    res.send(ownerSnapshotToCsv(data || []));
  } catch (error) {
    if (snapshotsTableMissing(error)) {
      return res.status(503).send(
        "Owner snapshot table is not installed in Supabase yet."
      );
    }

    console.error("Error downloading owner snapshots:", error);
    res.status(500).send(error.message);
  }
});

app.get("/api/owner/snapshots.xlsx", requireOwnerAuth, async (req, res) => {
  try {
    const month = normalizeName(req.query.month || getLocalDateKey().slice(0, 7));
    const data = await fetchOwnerSnapshotsForMonth(month, true);
    const workbookBuffer = await buildOwnerSnapshotsWorkbook(data, month);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-snapshots-${month}.xlsx"`
    );
    res.send(Buffer.from(workbookBuffer));
  } catch (error) {
    if (snapshotsTableMissing(error)) {
      return res.status(503).send(
        "Owner snapshot table is not installed in Supabase yet."
      );
    }

    console.error("Error downloading owner workbook:", error);
    res.status(error.statusCode || 500).send(error.message);
  }
});

app.get("/api/owner/snapshots.pdf", requireOwnerAuth, async (req, res) => {
  try {
    const month = normalizeName(req.query.month || getLocalDateKey().slice(0, 7));
    const data = await fetchOwnerSnapshotsForMonth(month, true);
    writeOwnerReportPdf(res, data, month);
  } catch (error) {
    if (snapshotsTableMissing(error)) {
      return res.status(503).send(
        "Owner snapshot table is not installed in Supabase yet."
      );
    }

    console.error("Error downloading owner PDF:", error);
    res.status(error.statusCode || 500).send(error.message);
  }
});

app.patch("/api/owner/password", requireOwnerAuth, async (req, res) => {
  try {
    const currentPassword = normalizePasswordInput(req.body?.currentPassword);
    const newPassword = normalizePasswordInput(req.body?.newPassword);
    const confirmPassword = normalizePasswordInput(req.body?.confirmPassword);

    if (!currentPassword) {
      return res.status(400).json({ error: "Current owner password is required" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "New owner password is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New owner password must be at least 8 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New owner password and confirmation do not match",
      });
    }

    if (!isOwnerPasswordMatch(currentPassword)) {
      return res.status(401).json({ error: "Current owner password is incorrect" });
    }

    const result = await persistOwnerPassword(newPassword);

    res.json({
      ok: true,
      message:
        result.source === "supabase"
          ? "Owner password updated."
          : "Owner password updated in memory only because Supabase is not configured.",
    });
  } catch (error) {
    console.error("Error updating owner password:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/password", requireKdsAuth, async (req, res) => {
  try {
    const currentPassword = normalizePasswordInput(req.body?.currentPassword);
    const newPassword = normalizePasswordInput(req.body?.newPassword);
    const confirmPassword = normalizePasswordInput(req.body?.confirmPassword);

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New password and confirmation do not match",
      });
    }

    if (!isPasswordMatch(currentPassword)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const result = await persistKdsPassword(newPassword);

    res.json({
      ok: true,
      message:
        result.source === "supabase"
          ? "Password updated."
          : "Password updated in memory only because Supabase is not configured.",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/tickets", requireKdsAuth, async (req, res) => {
  try {
    const activeTickets = await getActiveTickets();
    res.json(activeTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.setHeader("X-Goldies-KDS-Fallback", "last-known-active-tickets");
    try {
      const storedTickets = await getStoredActiveTickets();
      res.setHeader("X-Goldies-KDS-Fallback", "stored-active-tickets");
      res.json(storedTickets);
    } catch (fallbackError) {
      console.error("Error fetching stored fallback tickets:", fallbackError);
      try {
        const dayTickets = await getTicketsForDay(getShopDateString());
        const activeDayTickets = dayTickets.filter((ticket) =>
          ["new", "making", "ready"].includes(sanitizeStatus(ticket.status))
        );
        res.setHeader("X-Goldies-KDS-Fallback", "day-active-tickets");
        res.json(activeDayTickets);
      } catch (dayFallbackError) {
        console.error("Error fetching day fallback tickets:", dayFallbackError);
        res.json(lastKnownActiveTickets);
      }
    }
  }
});

app.get("/api/system/catalog-category-audit", requireKdsAuth, async (req, res) => {
  try {
    const audit = await fetchSquareDrinkCategoryAudit({
      force: String(req.query.refresh || "") === "1",
    });
    const { categoryByCatalogObjectId, ...publicAudit } = audit;

    res.json(publicAudit);
  } catch (error) {
    console.error("Error checking Square catalog drink categories:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tickets/completed", requireKdsAuth, async (req, res) => {
  try {
    const completedTickets = await getCompletedTicketsToday();
    res.json(completedTickets);
  } catch (error) {
    console.error("Error fetching completed tickets:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/customer-insights", requireKdsOrOwnerAuth, async (req, res) => {
  try {
    const range = String(req.query.range || "today").toLowerCase();
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 12, 100);
    const cutoffAt = getCustomerInsightRetentionCutoff();

    pruneCustomerInsights().catch((cleanupError) => {
      console.warn(`WARNING: Unable to prune customer insights: ${cleanupError.message}`);
    });

    if (!supabase) {
      const filtered = localCustomerInsights.filter((insight) => {
        const createdAt = Date.parse(insight.created_at || 0);
        if (!Number.isFinite(createdAt) || createdAt < Date.parse(cutoffAt)) return false;
        if (range !== "all") {
          const start = getRangeStart("today").toISOString();
          const end = getRangeEnd("today").toISOString();
          return createdAt >= Date.parse(start) && createdAt <= Date.parse(end);
        }
        return true;
      });

      return res.json({ insights: filtered.slice(0, limit), range, storage: "memory" });
    }

    let query = supabase
      .from("kds_customer_insights")
      .select("*")
      .gte("created_at", cutoffAt)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (range !== "all") {
      const start = getRangeStart("today");
      const end = getRangeEnd("today");
      query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ insights: data || [], range });
  } catch (error) {
    if (customerInsightsTableMissing(error)) {
      return res.json({
        insights: [],
        warning:
          "Customer insights table is not installed in Supabase yet. Run the latest supabase-schema.sql.",
      });
    }

    console.error("Error fetching customer insights:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/customer-insights", requireKdsAuth, async (req, res) => {
  try {
    const customerName = cleanOrderText(req.body?.customerName, 120);
    const note = cleanOrderText(req.body?.note, 1000);
    const drinkName = cleanOrderText(req.body?.drinkName, 160);
    const sourceOrderId = cleanOrderText(req.body?.sourceOrderId, 120);

    if (!note) return res.status(400).json({ error: "Insight note is required." });

    const insight = {
      customer_name: customerName,
      note,
      drink_name: drinkName,
      source_order_id: sourceOrderId,
      created_by: req.kdsSession?.employeeName || "",
      created_at: new Date().toISOString(),
    };

    if (!supabase) {
      const localInsight = { id: `local-${Date.now()}`, ...insight };
      localCustomerInsights.unshift(localInsight);
      trimLocalCustomerInsights();
      return res.json({ ok: true, insight: localInsight });
    }

    const { data, error } = await supabase
      .from("kds_customer_insights")
      .insert(insight)
      .select()
      .single();

    if (error) throw error;
    pruneCustomerInsights().catch((cleanupError) => {
      console.warn(`WARNING: Unable to prune customer insights: ${cleanupError.message}`);
    });
    res.json({ ok: true, insight: data });
  } catch (error) {
    if (customerInsightsTableMissing(error)) {
      return res.status(503).json({
        error:
          "Customer insights table is not installed in Supabase yet. Run the latest supabase-schema.sql.",
      });
    }

    console.error("Error saving customer insight:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tickets/search", requireKdsAuth, async (req, res) => {
  try {
    const query = req.query.q || "";
    const matches = await findTickets(query);

    res.json({
      ok: true,
      query,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Error searching tickets:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tickets/day", requireKdsAuth, async (req, res) => {
  try {
    const date = String(req.query.date || "").trim();
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const ticketsForDay = await getTicketsForDay(date);
    res.json({
      ok: true,
      date,
      count: ticketsForDay.length,
      tickets: ticketsForDay,
    });
  } catch (error) {
    console.error("Error fetching tickets for day:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/display/menu", requireKdsAuth, async (_req, res) => {
  try {
    const categories = await getGoldiesMenuBoard();
    res.json({
      ok: true,
      shopName: "Goldie's Coffee & Goods",
      categories,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching menu board:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/menu/availability", requireKdsOrOwnerAuth, async (_req, res) => {
  try {
    let catalogItems = [];
    let recentPrices = new Map();
    let catalogError = "";

    try {
      [catalogItems, recentPrices] = await Promise.all([
        fetchSquareMenuCatalogItems(),
        fetchRecentMenuPrices(),
      ]);
    } catch (error) {
      catalogError = error.message || "Square catalog unavailable.";
      console.error("Square catalog availability toggles unavailable, using static menu:", catalogError);
    }

    const availability = await getMenuAvailabilityRows();

    const baseItems = catalogItems.length
      ? buildCatalogMenuAvailabilityItems(catalogItems, recentPrices)
      : buildStaticMenuAvailabilityItems();
    const items = applyMenuAvailabilityRows(baseItems, availability);

    res.json({
      ok: true,
      items,
      visibleCategories: groupAvailabilityItemsForMenu(items),
      source: catalogItems.length ? "square" : "static",
      catalogError,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching menu availability:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/menu/availability", requireKdsOrOwnerAuth, async (req, res) => {
  try {
    const itemName = req.body?.itemName;
    const available = req.body?.available !== false;
    const row = await setMenuAvailability(itemName, available);
    res.json({ ok: true, item: row });
  } catch (error) {
    console.error("Error updating menu availability:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/display/orders-up", requireKdsAuth, async (_req, res) => {
  try {
    const display = await getCustomerOrdersUp();
    res.json({
      ok: true,
      shopName: "Goldie's Coffee & Goods",
      ...display,
    });
  } catch (error) {
    console.error("Error fetching customer orders display:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/display/drive-thru", requireKdsAuth, async (_req, res) => {
  try {
    const display = await getDriveThruDisplay();
    res.json({
      ok: true,
      shopName: "Goldie's Coffee & Goods",
      ...display,
    });
  } catch (error) {
    console.error("Error fetching drive thru display:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/display/online-orders", requireKdsAuth, async (_req, res) => {
  try {
    const active = await getActiveTickets();
    const displayStatuses = new Set(["new", "making", "ready"]);
    const orders = active
      .filter(
        (ticket) =>
          displayStatuses.has(ticket.status) &&
          ticketHasDrinkItem(ticket) &&
          isOnlineOrderTicket(ticket)
      )
      .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
      .map((ticket) => ({
        id: ticket.id,
        orderNumber: ticket.orderNumber || ticket.id,
        customerName: ticket.customerName || "",
        diningOption: ticket.diningOption || "Pickup",
        status: ticket.status,
        source: ticket.source || "Online order",
        isOnlineOrder: true,
        createdAt: ticket.createdAt || null,
        updatedAt: ticket.updatedAt || ticket.createdAt || null,
        items: getDisplayDrinkItems(ticket),
      }));

    res.json({
      ok: true,
      shopName: "Goldie's Coffee & Goods",
      orders,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching online orders display:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/beta/online-order/menu", async (req, res) => {
  const mode = normalizeName(req.query.mode || req.query.source || "").toLowerCase();
  const includeForHereOnly = mode === "kiosk" || mode === "self_order_kiosk";

  try {
    const menu = await getSquareOnlineOrderingMenu({ includeForHereOnly });
    const hours = getOnlineOrderingHoursStatus();
    res.json({
      ok: true,
      mode: includeForHereOnly ? "kiosk" : "online",
      source: menu.some((group) => group.items?.some((item) => item.source === "square"))
        ? "square"
        : "static",
      categories: menu,
      hours,
      pickupSlots: generatePickupSlots(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching online ordering menu:", error);
    const unavailableKeys = await getUnavailableMenuKeys();
    res.json({
      ok: true,
      mode: includeForHereOnly ? "kiosk" : "online",
      source: "static",
      categories: buildStaticOnlineOrderingMenu({ includeForHereOnly, unavailableKeys }),
      hours: getOnlineOrderingHoursStatus(),
      pickupSlots: generatePickupSlots(),
      updatedAt: new Date().toISOString(),
      warning: error.message,
    });
  }
});

app.get("/api/beta/online-order/quote", async (req, res) => {
  try {
    const hours = getOnlineOrderingHoursStatus();
    if (!hours.accepting) {
      return res.json({
        ok: true,
        accepting: false,
        hours,
        pickupSlots: generatePickupSlots(),
      });
    }

    const cartUnits = Math.min(20, Math.max(1, Number.parseInt(req.query.items, 10) || 1));
    const active = await getActiveTickets();
    const queueTickets = active.filter(
      (ticket) => ["new", "making"].includes(ticket.status) && ticketHasDrinkItem(ticket)
    );
    const drinksAhead = queueTickets.reduce(
      (sum, ticket) =>
        sum +
        getDisplayDrinkItems(ticket).reduce(
          (itemSum, item) => itemSum + (Number(item.qty) || 1),
          0
        ),
      0
    );
    const makingReport = await getDrinkMakingTimeReport("today").catch(() => ({
      averageSeconds: 0,
      label: "Collecting",
      sampleSize: 0,
    }));
    const averageSeconds = Math.max(120, Number(makingReport.averageSeconds || 0) || 210);
    const estimatedMinutes = Math.max(
      8,
      Math.ceil(((drinksAhead + cartUnits) * averageSeconds) / 60) + 3
    );
    const readyAt = new Date(Date.now() + estimatedMinutes * 60000);

    res.json({
      ok: true,
      queueTickets: queueTickets.length,
      drinksAhead,
      cartUnits,
      averageSeconds,
      averageLabel: makingReport.label || formatDurationSeconds(averageSeconds),
      estimatedMinutes,
      readyAt: readyAt.toISOString(),
      accepting: true,
      hours,
      pickupSlots: generatePickupSlots(),
      readyTimeLabel: readyAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      }),
    });
  } catch (error) {
    console.error("Error estimating online order ready time:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/beta/online-order/checkout", async (req, res) => {
  try {
    const hours = getOnlineOrderingHoursStatus();
    const source = cleanOrderText(req.body?.source, 80);
    const includeForHereOnly = source === "self_order_kiosk";
    const customerName = cleanOrderText(req.body?.customerName, 80);
    const customerEmail = normalizeLeadEmail(req.body?.customerEmail || req.body?.email);
    const rawPickupTime = cleanOrderText(req.body?.pickupTime, 120);
    const scheduledPickup = rawPickupTime.startsWith("20");

    if (!hours.accepting && !scheduledPickup) {
      return res.status(400).json({
        error:
          "ASAP pickup ordering is closed. Choose a scheduled pickup time during store hours.",
      });
    }

    if (scheduledPickup && !isPickupTimeInsideShopHours(rawPickupTime)) {
      return res.status(400).json({
        error:
          "Choose a pickup time during Goldie's hours: Mon-Fri 7 AM-3 PM or Saturday 8 AM-1 PM.",
      });
    }

    const pickupTime = rawPickupTime.startsWith("20")
      ? new Date(rawPickupTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Chicago",
        })
      : rawPickupTime;
    const notes = cleanOrderText(req.body?.notes, 300);
    const lineItems = await buildOnlineOrderingBetaLineItems(req.body?.items, {
      includeForHereOnly,
    });

    if (!customerName) {
      return res.status(400).json({ error: "Pickup name is required." });
    }

    if (customerEmail && !isValidLeadEmail(customerEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (!lineItems.length) {
      return res.status(400).json({ error: "Choose at least one drink." });
    }

    const pickupNote = [
      includeForHereOnly ? "DrinkFlow self-order kiosk" : "DrinkFlow online ordering",
      pickupTime ? `Requested pickup: ${pickupTime}` : "",
      notes ? `Customer notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const squareResponse = await fetch(
      `${getSquareRestBaseUrl()}/v2/online-checkout/payment-links`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Square-Version": SQUARE_API_VERSION,
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: SQUARE_LOCATION_ID,
            source: {
              name: includeForHereOnly ? "DrinkFlow Self Order Kiosk" : "DrinkFlow Online Orders",
            },
            pricing_options: {
              auto_apply_taxes: true,
              auto_apply_discounts: true,
            },
            line_items: lineItems,
            fulfillments: [
              {
                type: "PICKUP",
                state: "PROPOSED",
                pickup_details: {
                  recipient: {
                    display_name: customerName,
                  },
                  schedule_type: "ASAP",
                  note: pickupNote,
                },
              },
            ],
            metadata: {
              drinkflow_source: source || "online_ordering_beta",
              customer_name: customerName,
              customer_email: customerEmail,
              pickup_time: pickupTime,
            },
          },
          checkout_options: {
            allow_tipping: true,
            ask_for_shipping_address: false,
            redirect_url: getOnlineOrderingReturnUrl(req),
          },
        }),
      }
    );

    const payload = await squareResponse.json().catch(() => ({}));

    if (!squareResponse.ok) {
      console.error("Square checkout link error:", JSON.stringify(payload));
      return res.status(502).json({
        error: "Square checkout could not be created.",
        details: payload?.errors?.[0]?.detail || payload?.errors?.[0]?.code || "",
      });
    }

    const paymentLink = payload.payment_link || {};
    if (customerEmail && paymentLink.url) {
      sendOnlineOrderConfirmationEmail({
        to: customerEmail,
        customerName,
        pickupTime,
        lineItems,
        checkoutUrl: paymentLink.url,
        orderId: paymentLink.order_id || "",
      }).catch((mailError) => {
        console.error("Online order confirmation email failed:", mailError.message);
      });
    }

    res.json({
      ok: true,
      checkoutUrl: paymentLink.url,
      paymentLinkId: paymentLink.id || "",
      orderId: paymentLink.order_id || "",
    });
  } catch (error) {
    console.error("Error creating online ordering checkout:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/display/volume", requireKdsAuth, async (req, res) => {
  try {
    const selectedDate = normalizeName(req.query.date || getLocalDateKey());
    const report = await getOwnerDrinkRevenueReportForDay(selectedDate);
    res.json({
      ok: true,
      shopName: "Goldie's Coffee & Goods",
      selectedDate,
      report,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching volume display:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/staff/sop/:file", requireKdsAuth, (req, res) => {
  const allowedFiles = new Set([
    "goldies-recipes-1.png",
    "goldies-recipes-2.png",
  ]);
  const fileName = path.basename(String(req.params.file || ""));
  const recipeViewerHeader = String(req.get("x-goldies-recipe-viewer") || "");

  if (!allowedFiles.has(fileName)) {
    return res.status(404).json({ error: "Recipe SOP not found" });
  }

  if (recipeViewerHeader !== "kds") {
    return res.status(403).json({ error: "Open recipe cards from the signed-in KDS." });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(path.join(STAFF_SOP_DIR, fileName), (error) => {
    if (!error) return;
    console.error("Error serving staff SOP:", error.message);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({ error: "Recipe SOP unavailable" });
    }
  });
});

app.post("/api/square-sync", requireKdsAuth, async (req, res) => {
  try {
    const squareOrders = await fetchSquareOrders();
    const paymentOrders = await fetchSquarePaymentOrders();
    const savedTickets = [];
    const summary = {
      context: "manual sync",
      startedAt: new Date().toISOString(),
      fetchedOrders: squareOrders.length,
      fetchedPaymentOrders: paymentOrders.length,
      dedupedOrders: 0,
      created: 0,
      updated: 0,
      saved: 0,
      failed: 0,
      storageFallback: 0,
    };
    const dedupedOrders = dedupeOrders([...squareOrders, ...paymentOrders]);
    summary.dedupedOrders = dedupedOrders.length;

    for (const order of dedupedOrders) {
      try {
        const ticket = await normalizeSquareOrder(order);
        const savedTicket = await upsertTicket(ticket, order);
        savedTickets.push(savedTicket);
        summary.saved += 1;
        if (savedTicket?.syncAction === "created") summary.created += 1;
        if (savedTicket?.syncAction === "updated") summary.updated += 1;
        if (savedTicket?.storageFallback) {
          summary.storageFallback += 1;
          storageFallbackActive = true;
          storageFallbackLastError = "Supabase storage unavailable; serving active tickets from memory.";
        }
      } catch (orderError) {
        summary.failed += 1;
        console.error(`Manual Square sync failed for order ${order?.id || "unknown"}:`, orderError.message);
      }
    }
    summary.finishedAt = new Date().toISOString();
    lastSquareSyncSummary = summary;
    lastSquareSyncSuccessAt = Date.now();
    if (summary.storageFallback === 0 && summary.failed === 0) {
      storageFallbackActive = false;
      storageFallbackLastError = "";
    }

    res.json({
      ok: true,
      found: squareOrders.length,
      foundFromPayments: paymentOrders.length,
      saved: savedTickets.length,
      summary,
      orderIds: savedTickets.map((ticket) => ticket.id),
      orderNumbers: savedTickets.map((ticket) => ticket.orderNumber),
    });
  } catch (error) {
    console.error("Error syncing Square orders:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/square-sync", requireKdsAuth, async (req, res) => {
  try {
    const locations = await getSquareLocations();
    const locationIds = uniqueLocationIds(locations);
    const [squareOrders, paymentOrders] = await Promise.all([
      fetchSquareOrders(),
      fetchSquarePaymentOrders(),
    ]);

    res.json({
      ok: true,
      method: "POST",
      locationId: SQUARE_LOCATION_ID,
      accessibleLocations: locations.map((location) => ({
        id: location.id || null,
        name: location.name || null,
        status: location.status || null,
        type: location.type || null,
      })),
      queriedLocationCount: locationIds.length,
      foundFromOrders: squareOrders.length,
      foundFromPayments: paymentOrders.length,
    });
  } catch (error) {
    console.error("Square sync status error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/square-debug", requireKdsAuth, async (req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const locations = await getSquareLocations();
    const { paymentsApi } = squareClient;
    const payments = [];

    for (const locationId of uniqueLocationIds(locations)) {
      try {
        const paymentResponse = await paymentsApi.listPayments(
          yesterday.toISOString(),
          now.toISOString(),
          "DESC",
          undefined,
          locationId,
          undefined,
          undefined,
          undefined,
          10
        );
        payments.push(...(paymentResponse.result.payments || []));
      } catch (error) {
        console.error(
          `Square debug payment fetch failed for location ${locationId}:`,
          error.message
        );
      }
    }

    res.json({
      ok: true,
      environment: SQUARE_ENVIRONMENT,
      locationId: SQUARE_LOCATION_ID,
      checkedFrom: yesterday.toISOString(),
      checkedTo: now.toISOString(),
      accessibleLocations: locations.map((location) => ({
        id: location.id || null,
        name: location.name || null,
        status: location.status || null,
        type: location.type || null,
      })),
      paymentCount: payments.length,
      payments: payments.map((payment) => ({
        id: payment.id,
        orderId: payment.orderId || null,
        locationId: payment.locationId || null,
        status: payment.status || null,
        createdAt: payment.createdAt || null,
        amount:
          payment.amountMoney?.amount !== undefined
            ? String(payment.amountMoney.amount)
            : null,
      })),
    });
  } catch (error) {
    console.error("Square debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/tickets/:id/status", requireKdsAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid ticket status" });
    }

    const updatedStatus = await setTicketStatus(id, status);
    let squareFulfillmentSynced = true;
    let squareFulfillmentError = "";

    try {
      await updateSquareOrderFulfillment(id, updatedStatus);
    } catch (squareError) {
      squareFulfillmentSynced = false;
      squareFulfillmentError = squareError.message || "Square fulfillment sync failed";
      console.warn(
        `KDS status saved for ${id}, but Square fulfillment sync failed:`,
        squareFulfillmentError
      );
    }

    res.json({
      ok: true,
      id,
      status: updatedStatus,
      squareFulfillmentSynced,
      squareFulfillmentError,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/tickets/:id/items/:itemKey/done", requireKdsAuth, async (req, res) => {
  try {
    const { id, itemKey } = req.params;
    const done = req.body?.done !== false;
    const updatedDone = await setTicketItemDone(id, itemKey, done);

    res.json({ ok: true, id, itemKey, done: updatedDone });
  } catch (error) {
    console.error("Error updating ticket item done state:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/tickets/:id/name", requireKdsAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName } = req.body;
    const updatedName = await setTicketName(id, customerName);

    res.json({ ok: true, id, customerName: updatedName });
  } catch (error) {
    console.error("Error updating ticket name:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/tickets/:id/dining-option", requireKdsAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { diningOption } = req.body;
    const updatedDiningOption = await setTicketDiningOption(id, diningOption);

    res.json({ ok: true, id, diningOption: updatedDiningOption });
  } catch (error) {
    console.error("Error updating ticket dining option:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/test-ticket", requireKdsAuth, async (req, res) => {
  try {
    const id = `local-${Date.now()}`;
    const ticket = {
      id,
      orderNumber: id.slice(-4),
      customerName: "Test Customer",
      createdAt: Date.now(),
      source: "Local Test API",
      status: "new",
      diningOption: "Unspecified",
      items: [
        {
          name: "Test Cappuccino",
          qty: 1,
          modifiers: ["Small", "Whole milk"],
          note: "",
          category: "Coffee",
        },
      ],
    };

    const savedTicket = await upsertTicket(ticket);
    res.json(savedTicket);
  } catch (error) {
    console.error("Error creating test ticket:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/square-webhook", (req, res) => {
  res.json({
    ok: true,
    message:
      "Goldie's Square webhook endpoint is live. Square will send POST requests here.",
  });
});

app.post("/api/square-webhook", async (req, res) => {
  try {
    const event = req.body || {};

    console.log("Square webhook received:", event.type || "unknown event");

    if (
      event.type === "order.created" ||
      event.type === "order.updated" ||
      event.type === "payment.created" ||
      event.type === "payment.updated"
    ) {
      let orderId = getWebhookOrderId(event);

      if (!orderId && event.type.startsWith("payment.")) {
        const paymentId = getWebhookPaymentId(event);

        if (paymentId) {
          const { paymentsApi } = squareClient;
          const paymentResponse = await paymentsApi.getPayment(paymentId);
          orderId = paymentResponse.result.payment?.orderId || null;
        }
      }

      if (orderId) {
        const { ordersApi } = squareClient;
        const orderResponse = await ordersApi.retrieveOrder(orderId);
        const order = orderResponse.result.order;

        if (order) {
          const ticket = await normalizeSquareOrder(order);
          await upsertTicket(ticket, order);

          console.log(`Saved ticket from Square webhook: ${ticket.id}`);
        }
      }
    }

    res.status(200).json({
      ok: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/drinks", requireKdsAuth, async (req, res) => {
  try {
    const allowedRanges = new Set([
      "today",
      "yesterday",
      "last7",
      "last30",
      "thisMonth",
      "thisYear",
    ]);
    const range = allowedRanges.has(req.query.range) ? req.query.range : "today";
    const report = await getDrinkReport(range).catch((error) => {
      console.error("Error building drink report:", error);
      return {
        range,
        orderCount: 0,
        totalsByName: [],
        totalsByCategory: buildEmptyDrinkCategoryTotals(),
      };
    });

    res.json({
      ...report,
      range,
    });
  } catch (error) {
    console.error("Error fetching drink report:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/drink-making-time", requireKdsAuth, async (req, res) => {
  try {
    const allowedRanges = new Set(["today", "yesterday", "last7", "last30", "thisMonth", "thisYear"]);
    const range = allowedRanges.has(req.query.range) ? req.query.range : "today";
    const report = await getDrinkMakingTimeReport(range).catch((error) => {
      console.error("Error building drink making time report:", error);
      return {
        averageSeconds: 0,
        label: "Collecting",
        sampleSize: 0,
        range,
        byHour: [],
        byDrinkName: [],
      };
    });

    res.json(report);
  } catch (error) {
    console.error("Error fetching drink making time report:", error);
    res.status(500).json({ error: error.message });
  }
});

async function bootstrap() {
  await loadKdsPasswordState();
  await loadOwnerPasswordState();

  console.log(`Goldie's KDS backend running on port ${PORT}`);
  console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`Location ID: ${SQUARE_LOCATION_ID}`);
  console.log(`Storage: ${supabase ? "Supabase" : "Memory fallback"}`);
  console.log(`KDS login source: ${kdsPasswordState.source}`);
  console.log(`Owner login source: ${ownerPasswordState.source}`);

  if (!isKdsLoginConfigured()) {
    console.warn(
      "WARNING: KDS login is not configured. Set KDS_PASSWORD or store a password in Supabase."
    );
  }

  app.listen(PORT, () => {
    console.log("Ready to receive requests!");
  });

  probeSquareApiHealth().catch((error) => {
    console.error("Initial Square health probe failed:", error.message);
  });

  setInterval(() => {
    probeSquareApiHealth().catch((error) => {
      console.error("Scheduled Square health probe failed:", error.message);
    });
  }, SQUARE_HEALTH_CHECK_INTERVAL_MS);
}

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error("Failed to boot KDS backend:", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  __testExports: {
    buildOwnerDrinkRevenueReport,
    buildOwnerReportPeriod,
    buildCatalogMenuAvailabilityItems,
    buildStaticOnlineOrderingMenu,
    cleanCustomerName,
    fetchSquareDrinkCategoryAudit,
    getCanonicalDrinkName,
    getDrinkCategory,
    getFallbackDrinkImageUrl,
    getDisplayDrinkItems,
    getItemDrinkCategory,
    getSuspiciousPickupNameTickets,
    isServiceOption,
    isSmoothieDrinkName,
    parseCustomerNameFromNotes,
  },
};
