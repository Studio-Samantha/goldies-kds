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

const app = express();
const PORT = process.env.PORT || 3000;
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
const VALID_STATUSES = new Set(["new", "making", "ready", "completed", "done"]);
const VALID_DINING_OPTIONS = new Set([
  "For here",
  "To go",
  "Pickup",
  "Delivery",
  "Drive thru",
  "Unspecified",
]);
const SQUARE_SYNC_INTERVAL_MS = 30 * 1000;
const SQUARE_HEALTH_CHECK_INTERVAL_MS = 30 * 1000;
const SQUARE_HEALTH_ALERT_COOLDOWN_MS = 15 * 60 * 1000;
const READY_AUTO_COMPLETE_MS = 2 * 60 * 1000;
const SESSION_COOKIE_NAME = "goldies_kds_session";
const OWNER_SESSION_COOKIE_NAME = "goldies_owner_session";
const DEVELOPER_SESSION_COOKIE_NAME = "studio_samantha_developer_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
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
const ONLINE_ORDERING_CATEGORY_NAMES = (
  process.env.ONLINE_ORDERING_CATEGORY_NAMES || "Coffee,Not Coffee,Smoothies"
)
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);
const ONLINE_ORDERING_BETA_MENU = [
  { id: "latte", name: "Latte", category: "Coffee", priceCents: 575 },
  { id: "americano", name: "Americano", category: "Coffee", priceCents: 425 },
  { id: "decaf-americano", name: "Decaf (Americano)", category: "Coffee", priceCents: 425 },
  { id: "cold-brew", name: "Cold Brew", category: "Coffee", priceCents: 550 },
  { id: "cappuccino", name: "Cappuccino", category: "Coffee", priceCents: 525 },
  { id: "london-fog", name: "London Fog", category: "Not Coffee", priceCents: 575 },
  { id: "chai-latte", name: "Chai Latte", category: "Not Coffee", priceCents: 575 },
  { id: "matcha-latte", name: "Matcha Latte", category: "Not Coffee", priceCents: 625 },
  { id: "strawberry-banana", name: "Strawberry Banana", category: "Smoothies", priceCents: 700 },
  { id: "chocolate-pb-banana", name: "Chocolate P/B Banana", category: "Smoothies", priceCents: 700 },
  { id: "green-smoothie", name: "Green Smoothie", category: "Smoothies", priceCents: 700 },
];
const ONLINE_ORDERING_BETA_MENU_BY_ID = new Map(
  ONLINE_ORDERING_BETA_MENU.map((item) => [item.id, item])
);
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

if (!SQUARE_ACCESS_TOKEN) {
  console.error("ERROR: SQUARE_ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

if (!SQUARE_LOCATION_ID) {
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
  return text === "here" || text === "to go" || text === "togo" || text === "for here";
}

function getOnlineOrderingDrinkRule(itemName = "") {
  const text = normalizeCatalogLabel(itemName);
  if (
    text === "espresso" ||
    text.startsWith("espresso ") ||
    text.includes("gibraltar") ||
    text.includes("pour over")
  ) {
    return { online: false, reason: "For here only" };
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

function buildStaticOnlineOrderingMenu() {
  const grouped = new Map();
  for (const item of ONLINE_ORDERING_BETA_MENU) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push({
      id: item.id,
      name: item.name,
      category: item.category,
      price: formatCatalogMoney(item.priceCents),
      priceCents: item.priceCents,
      variationId: "",
      variationName: "",
      description: "",
      modifierGroups: [],
      source: "static",
    });
  }

  return Array.from(grouped, ([category, items]) => ({ category, items }));
}

async function getSquareOnlineOrderingMenu() {
  const unavailableKeys = await getUnavailableMenuKeys();
  const objects = await fetchSquareCatalogObjects([
    "ITEM",
    "ITEM_VARIATION",
    "MODIFIER",
    "MODIFIER_LIST",
    "CATEGORY",
  ]);
  const byId = new Map(objects.map((object) => [object.id, object]));
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
    const categoryName = categoriesById.get(categoryId) || itemData.category_name || "Drinks";
    const categoryAllowed = ONLINE_ORDERING_CATEGORY_NAMES.includes(categoryName.toLowerCase());
    const staticNameAllowed = ONLINE_ORDERING_BETA_MENU_BY_ID.has(
      String(itemData.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    );

    if (ONLINE_ORDERING_CATEGORY_NAMES.length && !categoryAllowed && !staticNameAllowed) {
      continue;
    }

    const itemRule = getOnlineOrderingDrinkRule(itemData.name || "");
    if (!itemRule.online) continue;

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
      if (!isMenuItemAvailable({ name: itemName }, unavailableKeys)) continue;
      const variationName =
        variationData.name && variationData.name !== "Regular" ? variationData.name : "";
      const variationModifierGroups = filterModifierGroupsForVariation(
        modifierGroups,
        itemName,
        variationName
      );

      if (!groups.has(categoryName)) groups.set(categoryName, []);
      groups.get(categoryName).push({
        id: variation.id,
        name: itemName,
        category: categoryName,
        price: formatCatalogMoney(priceCents),
        priceCents,
        variationId: variation.id,
        variationName,
        description: itemData.description || "",
        modifierGroups: variationModifierGroups,
        source: "square",
      });
    }
  }

  const menu = Array.from(groups, ([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.category.localeCompare(b.category));

  return menu.length ? menu : buildStaticOnlineOrderingMenu();
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

async function buildOnlineOrderingBetaLineItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  const menu = await getSquareOnlineOrderingMenu().catch((error) => {
    console.error("Square catalog menu unavailable, using static beta menu:", error.message);
    return buildStaticOnlineOrderingMenu();
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

  const mailer = getAlertMailer();
  if (!mailer) return false;

  const verifyUrl = `https://goldieskds.com/api/drinkflow-workspaces/verify-email?token=${encodeURIComponent(token)}`;
  await mailer.sendMail({
    from: ALERT_EMAIL_FROM,
    to: email,
    subject: "Verify your DrinkFlow beta workspace",
    text: [
      `Hi ${workspace.owner_name || "there"},`,
      "",
      `Your DrinkFlow beta workspace is reserved: ${workspace.app_url}`,
      "",
      "Verify this email before connecting live shop data:",
      verifyUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });

  return true;
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

console.log("Initializing Square client...");
console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
console.log(`Location ID: ${SQUARE_LOCATION_ID ? "Set" : "Missing"}`);

const squareClient = new Client({
  accessToken: SQUARE_ACCESS_TOKEN,
  environment:
    SQUARE_ENVIRONMENT === "sandbox" ? Environment.Sandbox : Environment.Production,
});

console.log("Square client initialized successfully");

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

const COFFEE_DRINKS = new Set([
  "Americano",
  "Decaf (Americano)",
  "Cappuccino",
  "Cold Brew",
  "Drip",
  "Drip Refill",
  "Espresso",
  "Flat White",
  "Gibraltar",
  "Latte",
  "Pour Over",
]);

const NOT_COFFEE_DRINKS = new Set([
  "Chai Latte",
  "Hot Chocolate",
  "London Fog",
  "Matcha Latte",
  "Steamer",
  "Teas",
  "Refresher-Strawberry Mango",
]);

const SMOOTHIE_DRINKS = new Set([
  "Chocolate P/B Banana",
  "Greens",
  "Mango",
  "Strawberry",
  "Strawberry Banana",
]);

const GOLDIES_MENU_CATEGORIES = [
  { key: "Coffee", label: "Coffee", items: Array.from(COFFEE_DRINKS) },
  { key: "Not Coffee", label: "Not Coffee", items: Array.from(NOT_COFFEE_DRINKS) },
  { key: "Smoothies", label: "Smoothies", items: Array.from(SMOOTHIE_DRINKS) },
];
let menuCatalogCache = { fetchedAt: 0, items: [] };
let localMenuAvailability = [];

function normalizeName(name = "") {
  return String(name).trim();
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

function getDrinkCategory(itemName = "") {
  const name = normalizeName(itemName);
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");

  if (isNonDrinkItem(name)) return null;

  if (COFFEE_DRINKS.has(name)) return "Coffee";
  if (NOT_COFFEE_DRINKS.has(name)) return "Not Coffee";
  if (SMOOTHIE_DRINKS.has(name)) return "Smoothies";

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

  if (lower.includes("smoothie")) return "Smoothies";
  if (compact.includes("greens")) return "Smoothies";

  return null;
}

function getItemDrinkCategory(item = {}) {
  if (isNonDrinkItem(item.name)) return null;

  const savedCategory = normalizeName(item.category);
  if (
    savedCategory === "Coffee" ||
    savedCategory === "Not Coffee" ||
    savedCategory === "Smoothies"
  ) {
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
      .map((name) => ({ name, priceCents: null, price: "Ask" })),
  }));
}

function normalizeMenuAvailabilityKey(name = "") {
  return normalizeDrinkText(name);
}

function isMenuItemAvailable(item = {}, unavailableKeys = new Set()) {
  return !unavailableKeys.has(normalizeMenuAvailabilityKey(item.name));
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

  const response = await fetch(`${getSquareRestBaseUrl()}/v2/catalog/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-01-22",
    },
    body: JSON.stringify({
      object_types: ["ITEM"],
      include_deleted_objects: false,
      include_related_objects: true,
      limit: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Square menu catalog unavailable: ${response.status}`);
  }

  const data = await response.json();
  menuCatalogCache = {
    fetchedAt: now,
    items: (data.objects || [])
      .filter((object) => object.type === "ITEM")
      .map((object) => {
        const itemData = object.itemData || object.item_data || {};
        return {
          id: object.id,
          name: itemData.name || "",
          priceCents: getCatalogItemPrice(object),
        };
      })
      .filter((item) => item.name && getDrinkCategory(item.name)),
  };

  return menuCatalogCache.items;
}

async function getGoldiesMenuBoard() {
  const staticMenu = buildStaticMenuItems();

  try {
    const [catalogItems, recentPrices, unavailableKeys] = await Promise.all([
      fetchSquareMenuCatalogItems(),
      fetchRecentMenuPrices(),
      getUnavailableMenuKeys(),
    ]);
    const catalogByName = new Map(
      catalogItems.map((item) => [normalizeDrinkText(item.name), item])
    );

    return staticMenu.map((category) => ({
      ...category,
      items: category.items
        .filter((item) => isMenuItemAvailable(item, unavailableKeys))
        .map((item) => {
          const catalogItem = catalogByName.get(normalizeDrinkText(item.name));
          const priceCents =
            catalogItem?.priceCents || recentPrices.get(normalizeDrinkText(item.name)) || null;
          return {
            ...item,
            priceCents,
            price: priceCents ? formatCurrency(priceCents) : "Ask",
          };
        }),
    }));
  } catch (error) {
    console.error("Error building menu board from Square catalog:", error.message);
    return staticMenu;
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
  const completed = await getCompletedTicketsToday().catch(() => []);
  const recentCompletedCutoff = Date.now() - 15 * 60 * 1000;

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

  const recentlyCompleted = completed
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
      const name = cleanOrderText(item.name, 160);
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

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    kdsPasswordState.source === "memory"
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

  if (KDS_PASSWORD) {
    kdsPasswordState = {
      source: "env",
      passwordHash: null,
      passwordSalt: null,
      plaintextPassword: String(KDS_PASSWORD),
    };
  } else {
    kdsPasswordState = {
      source: "unconfigured",
      passwordHash: null,
      passwordSalt: null,
      plaintextPassword: null,
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

  if (kdsPasswordState.source === "env") {
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
  const alreadyExists = tickets.some((existing) => existing.id === ticket.id);

  if (!alreadyExists) {
    tickets.unshift(ticket);
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
  if (type.includes("DINE")) return "For here";
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
    return "To go";
  }
  if (
    value.includes("dine") ||
    value.includes("for here") ||
    value.includes("eat in") ||
    value.includes("eatin")
  ) {
    return "For here";
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

  return String(rawName).trim();
}

function parseCustomerNameFromNotes(items = []) {
  const noteText = (items || [])
    .map((item) => item.note || item.notes || "")
    .filter(Boolean)
    .join(" ");
  const match =
    noteText.match(/\b(?:name|customer|cust)\s*[:\-]\s*([a-z][a-z\s'.-]{1,40})/i) ||
    noteText.match(/\bfor\s+([a-z][a-z\s'.-]{1,40})/i);

  if (match) {
    return match[1]
      .replace(/\s+(pickup|pick up|order|scheduled|at|for)\b.*$/i, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  const ignoredStarts =
    /^(to go|togo|for here|pickup|pick up|delivery|drive|hot|iced|ice|no |extra |add |sub |oat|almond|soy|whole|skim|decaf|regular|light|less|more)\b/i;
  const candidates = (items || [])
    .flatMap((item) => String(item.note || item.notes || "").split(/[,;|\n]|\s+-\s+/))
    .map((candidate) =>
      candidate
        .replace(/^(name|customer|cust)\s*[:\-]\s*/i, "")
        .replace(/\b(pickup|pick up|order|scheduled|at\s+\d.*|to go|for here)\b.*$/i, "")
        .trim()
        .replace(/\s+/g, " ")
    )
    .filter(Boolean);

  return (
    candidates.find((candidate) => {
      if (ignoredStarts.test(candidate)) return false;
      if (!/^[a-z][a-z'.-]*(\s+[a-z][a-z'.-]*){0,2}$/i.test(candidate)) {
        return false;
      }

      return candidate.length >= 2 && candidate.length <= 40;
    }) || ""
  );
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

  for (const lineItem of order.lineItems || []) {
    const modifiers = (lineItem.modifiers || []).map(
      (modifier) => modifier.name || "Unknown modifier"
    );
    const name = lineItem.name || "Unnamed item";

    items.push({
      id: lineItem.uid || lineItem.catalogObjectId || null,
      name,
      qty: Number.parseInt(lineItem.quantity, 10) || 1,
      modifiers,
      note: lineItem.note || "",
      category: getDrinkCategory(name),
    });
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(-4),
    customerName: (await getSquareCustomerName(order)) || parseCustomerNameFromNotes(items),
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
  const customerName = order.customer_name || parseCustomerNameFromNotes(items);
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

async function upsertTicket(ticket, rawOrder = null) {
  if (!supabase) {
    return addTicket(ticket);
  }

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

  return { ...ticket, status };
}

async function syncRecentSquareOrders() {
  if (!supabase) return;

  const now = Date.now();
  if (now - lastSquareSyncAt < SQUARE_SYNC_INTERVAL_MS) return;

  lastSquareSyncAt = now;
  const squareOrders = await fetchSquareOrders();
  const squarePayments = await fetchSquarePayments();
  const paymentOrders = await fetchSquarePaymentOrders(squarePayments);
  const employeeNameByOrderId = await buildPaymentEmployeeMap(squarePayments);

  for (const order of dedupeOrders([...squareOrders, ...paymentOrders])) {
    const ticket = await normalizeSquareOrder(order, employeeNameByOrderId.get(order.id) || null);
    await upsertTicket(ticket, order);
  }
}

async function getActiveTickets() {
  if (!supabase) return getLocalActiveTickets();

  await syncRecentSquareOrders();
  await autoCompleteStaleReadyTickets();

  const { data: orders, error: orderError } = await supabase
    .from("kds_orders")
    .select("*")
    .neq("status", "done")
    .order("created_at", { ascending: false });

  if (orderError) throw orderError;

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

  return orders.map((order) => ticketFromDb(order, itemsByOrderId.get(order.square_order_id) || []));
}

async function setTicketStatus(id, status) {
  const sanitizedStatus = sanitizeStatus(status);
  const statusUpdatedAt = new Date().toISOString();

  if (!supabase) {
    updateLocalTicketStatus(id, sanitizedStatus);
    return sanitizedStatus;
  }

  const updates = {
    status: sanitizedStatus,
    updated_at: statusUpdatedAt,
    completed_at: isCompletedStatus(sanitizedStatus) ? statusUpdatedAt : null,
  };

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

  updates.raw_order = appendStatusEvent(
    existingOrder.raw_order,
    sanitizedStatus,
    statusUpdatedAt
  );

  const { data, error } = await supabase
    .from("kds_orders")
    .update(updates)
    .eq("square_order_id", id)
    .select("square_order_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const missingError = new Error(`Ticket ${id} was not found`);
    missingError.statusCode = 404;
    throw missingError;
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
  const normalizedDiningOption = String(diningOption || "").trim() || "Unspecified";

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
        return (
          (ticket.status === "completed" || ticket.status === "done") &&
          ticket.createdAt >= start.getTime() &&
          ticket.createdAt <= end.getTime()
        );
      })
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, order_number, customer_name, created_at, updated_at, source, status, dining_option, raw_order")
    .in("status", ["completed", "done"])
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const orderIds = (orders || []).map((order) => order.square_order_id);
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

  return (orders || []).map((order) =>
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
  const start = new Date(now);

  if (range === "yesterday") {
    start.setDate(now.getDate() - 1);
  } else if (range === "last7") {
    start.setDate(now.getDate() - 6);
  } else if (range === "thisMonth") {
    start.setDate(1);
  } else if (range === "last30") {
    start.setDate(now.getDate() - 29);
  } else if (range === "thisYear") {
    start.setMonth(0, 1);
  } else {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

function getRangeEnd(range) {
  const now = new Date();

  if (range !== "yesterday") return now;

  const end = new Date(now);
  end.setDate(now.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return end;
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
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const start = new Date(parsed);
  start.setHours(0, 0, 0, 0);

  const end = new Date(parsed);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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

  const { data: items, error: itemsError } = await supabase
    .from("kds_order_items")
    .select("*")
    .in("order_id", orderIds);

  if (itemsError) throw itemsError;

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

function ticketHasDrinkItem(ticket) {
  return (ticket.items || []).some((item) => getItemDrinkCategory(item));
}

function getDisplayDrinkItems(ticket) {
  return (ticket.items || [])
    .filter((item) => getItemDrinkCategory(item))
    .map((item) => ({
      name: item.name || "Drink",
      qty: Number(item.qty || item.quantity || 1) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers.filter(Boolean) : [],
      note: item.note || "",
    }));
}

function getMakingDurationFromEvents(events, start, end) {
  return getMakingDurationSampleFromEvents(events, start, end)?.durationMs || null;
}

function getMakingDurationSampleFromEvents(events, start, end) {
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
  const start = getRangeStart(range);
  const end = getRangeEnd(range);

  if (!supabase) {
    const samples = tickets
      .filter((ticket) => ticketHasDrinkItem(ticket))
      .map((ticket) => {
        const sample = getMakingDurationSampleFromEvents(
          getStatusEvents(ticket.rawOrder || ticket.raw_order || {}),
          start,
          end
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
      range,
      ...getDurationBreakdowns(samples),
    };
  }

  const { data: orders, error: orderError } = await supabase
    .from("kds_orders")
    .select("square_order_id, raw_order")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (orderError) throw orderError;
  if (!orders?.length) {
    return {
      averageSeconds: 0,
      label: "Collecting",
      sampleSize: 0,
      range,
      byHour: [],
      byDrinkName: [],
    };
  }

  const orderIds = orders.map((order) => order.square_order_id);
  const { data: items, error: itemsError } = await supabase
    .from("kds_order_items")
    .select("order_id, name, category")
    .in("order_id", orderIds);

  if (itemsError) throw itemsError;

  const drinkItemsByOrderId = new Map();
  for (const item of items || []) {
    const category = getItemDrinkCategory(item);
    if (!category) continue;
    const existing = drinkItemsByOrderId.get(item.order_id) || [];
    existing.push({
      name: item.name,
      qty: item.quantity || 1,
      category,
    });
    drinkItemsByOrderId.set(item.order_id, existing);
  }

  const samples = orders
    .filter((order) => drinkItemsByOrderId.has(order.square_order_id))
    .map((order) => {
      const sample = getMakingDurationSampleFromEvents(
        getStatusEvents(order.raw_order),
        start,
        end
      );
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
    range,
    ...getDurationBreakdowns(samples),
  };
}

function buildDrinkReport(reportTickets, start, end = new Date()) {
  const totalsByName = new Map();
  const totalsByCategory = {
    Coffee: 0,
    "Not Coffee": 0,
    Smoothies: 0,
  };

  for (const ticket of reportTickets) {
    if (ticket.createdAt && ticket.createdAt < start.getTime()) continue;
    if (ticket.createdAt && ticket.createdAt > end.getTime()) continue;

    for (const item of ticket.items || []) {
      const category = getItemDrinkCategory(item);
      if (!category) continue;

      const qty = Number(item.qty || 1);
      totalsByName.set(item.name, (totalsByName.get(item.name) || 0) + qty);
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
  const categories = {
    Coffee: { category: "Coffee", revenueCents: 0, taxCents: 0, totalCents: 0, units: 0 },
    "Not Coffee": { category: "Not Coffee", revenueCents: 0, taxCents: 0, totalCents: 0, units: 0 },
    Smoothies: { category: "Smoothies", revenueCents: 0, taxCents: 0, totalCents: 0, units: 0 },
  };
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
  let multiDrinkOrderCount = 0;

  for (const order of orders || []) {
    const rawOrder = order.raw_order || {};
    const lineItems = rawOrder.lineItems || rawOrder.line_items || [];
    let orderHasDrink = false;
    let orderUnits = 0;
    let orderRevenueCents = 0;

    for (const lineItem of lineItems) {
      const name = lineItem.name || "";
      const category = getItemDrinkCategory({ name });
      if (!category) continue;

      const qty = Number.parseFloat(lineItem.quantity || "1") || 1;
      const totalCents = getLineItemAmountCents(lineItem);
      const taxCents = getLineItemTaxCents(lineItem);
      const revenueCents = Math.max(totalCents - taxCents, 0);

      categories[category].units += qty;
      categories[category].revenueCents += revenueCents;
      categories[category].taxCents += taxCents;
      categories[category].totalCents += totalCents;
      orderUnits += qty;
      orderRevenueCents += revenueCents;
      orderHasDrink = true;
    }

    if (orderHasDrink) {
      orderIds.add(order.square_order_id);
      if (orderUnits >= 2) multiDrinkOrderCount += 1;

      const createdAt = new Date(order.created_at);
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

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    orderCount: orderIds.size,
    multiDrinkOrderCount,
    multiDrinkOrderRate,
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
    hourlyOrders,
    shopHours,
  };
}

async function getOwnerDrinkRevenueReport(range = "today") {
  const start = getRangeStart(range);
  const end = getRangeEnd(range);

  if (!supabase) {
    return buildOwnerDrinkRevenueReport([], start, end);
  }

  await syncRecentSquareOrders();

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("square_order_id, created_at, raw_order")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) throw error;

  return buildOwnerDrinkRevenueReport(orders || [], start, end);
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
    .select("square_order_id, created_at, raw_order")
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
    "thisMonth",
    "thisYear",
  ]);
  return allowedRanges.has(range) ? range : "today";
}

function getOwnerRangeLabel(range = "today") {
  return (
    {
      today: "Today",
      yesterday: "Yesterday",
      last7: "Last 7 Days",
      last30: "Last 30 Days",
      thisMonth: "This Month",
      thisYear: "This Year",
    }[range] || "Today"
  );
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

  [summary, categories, hourly].forEach((sheet) => {
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
    ["2+ drink orders", `${Number(report.multiDrinkOrderRate || 0)}%`],
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

  doc.end();
}

function writeOwnerDrinkReportPdf(res, report = {}, range = "today") {
  const doc = new PDFDocument({ size: "LETTER", margin: 42 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="goldies-owner-report-${range}.pdf"`
  );

  doc.pipe(res);
  drawOwnerDrinkReportPdf(doc, report, range);
}

function buildOwnerDrinkReportPdfBuffer(report = {}, range = "today") {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 42 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawOwnerDrinkReportPdf(doc, report, range);
  });
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
    loginConfigured: isKdsLoginConfigured(),
    passwordSource: kdsPasswordState.source,
    squareApi: {
      online: !squareApiAlertState.offline,
      lastHealthyAt: squareApiAlertState.lastHealthyAt
        ? new Date(squareApiAlertState.lastHealthyAt).toISOString()
        : null,
      lastError: squareApiAlertState.lastError || null,
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
  "Owner portal",
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
    ip_address: cleanLeadText(
      req?.headers?.["x-forwarded-for"]?.split(",")?.[0] || req?.socket?.remoteAddress || "",
      80
    ),
    user_agent: cleanLeadText(req?.headers?.["user-agent"] || "", 300),
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    localAccessLogs.unshift({ id: `local-${Date.now()}`, ...entry });
    localAccessLogs = localAccessLogs.slice(0, 200);
    return entry;
  }

  const { error } = await supabase.from("kds_access_logs").insert(entry);
  if (error) throw error;
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

async function fetchAccessLogs({ role = "owner", limit = 12 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 80);
  const normalizedRole = cleanLeadText(role, 40);

  if (!supabase) {
    return localAccessLogs
      .filter((entry) => !normalizedRole || entry.role === normalizedRole)
      .slice(0, safeLimit);
  }

  let query = supabase
    .from("kds_access_logs")
    .select("*")
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

    sendDrinkFlowVerificationEmail(workspace).catch((mailError) => {
      console.error("DrinkFlow verification email failed:", mailError.message);
    });

    res.json({ ok: true, workspace: publicWorkspacePayload(workspace) });
  } catch (error) {
    console.error("Error reserving DrinkFlow workspace:", error);
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

    res.json({ ok: true, workspace: publicWorkspacePayload(workspace) });
  } catch (error) {
    console.error("Error creating DrinkFlow workspace:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/drinkflow/square/oauth/start", (req, res) => {
  if (!DRINKFLOW_SQUARE_APPLICATION_ID || !DRINKFLOW_SQUARE_APPLICATION_SECRET) {
    return res.status(503).json({
      error:
        "Square OAuth is not configured yet. Add DRINKFLOW_SQUARE_APPLICATION_ID, DRINKFLOW_SQUARE_APPLICATION_SECRET, and DRINKFLOW_SQUARE_REDIRECT_URL in Render.",
      diagnostics: getDrinkFlowSquareOAuthDiagnostics(),
    });
  }

  const slug = normalizeDrinkFlowSlug(req.query.slug || "");
  if (!slug) return res.status(400).json({ error: "Workspace is required before connecting Square." });

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
    req.body?.employeeName || req.body?.employeeNumber || req.body?.employeeId || ""
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
    const range = normalizeOwnerReportRange(req.query.range);
    const report = await getOwnerDrinkRevenueReport(range);

    res.json({
      ...report,
      range,
    });
  } catch (error) {
    console.error("Error fetching owner drink revenue report:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/owner/reports/drink-making-time", requireOwnerAuth, async (req, res) => {
  try {
    const report = await getDrinkMakingTimeReport(req.query.range || "today");

    res.json(report);
  } catch (error) {
    console.error("Error fetching owner drink making time report:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/owner/reports/drink-revenue.csv", requireOwnerAuth, async (req, res) => {
  try {
    const range = normalizeOwnerReportRange(req.query.range);
    const report = await getOwnerDrinkRevenueReport(range);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-report-${range}.csv"`
    );
    res.send(ownerReportToCsv(report, range));
  } catch (error) {
    console.error("Error downloading owner report CSV:", error);
    res.status(500).send(error.message);
  }
});

app.get("/api/owner/reports/drink-revenue.xlsx", requireOwnerAuth, async (req, res) => {
  try {
    const range = normalizeOwnerReportRange(req.query.range);
    const report = await getOwnerDrinkRevenueReport(range);
    const workbookBuffer = await buildOwnerReportWorkbook(report, range);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="goldies-owner-report-${range}.xlsx"`
    );
    res.send(Buffer.from(workbookBuffer));
  } catch (error) {
    console.error("Error downloading owner report workbook:", error);
    res.status(500).send(error.message);
  }
});

app.get("/api/owner/reports/drink-revenue.pdf", requireOwnerAuth, async (req, res) => {
  try {
    const range = normalizeOwnerReportRange(req.query.range);
    const report = await getOwnerDrinkRevenueReport(range);
    writeOwnerDrinkReportPdf(res, report, range);
  } catch (error) {
    console.error("Error downloading owner report PDF:", error);
    res.status(500).send(error.message);
  }
});

app.post("/api/owner/reports/drink-revenue/email", requireOwnerAuth, async (req, res) => {
  try {
    const email = normalizeLeadEmail(req.body?.email || ALERT_EMAIL_TO);
    const range = normalizeOwnerReportRange(req.body?.range || "today");

    if (!isValidLeadEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (!hasAlertEmailConfig()) {
      return res.status(503).json({
        error: "Report email is not configured on the backend yet.",
        diagnostics: getAlertEmailConfigDiagnostics(),
      });
    }

    const report = await getOwnerDrinkRevenueReport(range);
    const pdfBuffer = await buildOwnerDrinkReportPdfBuffer(report, range);
    const rangeLabel = getOwnerRangeLabel(range);

    await getAlertMailer().sendMail({
      from: ALERT_EMAIL_FROM,
      to: email,
      subject: `Goldie's KDS ${rangeLabel} owner report`,
      text: [
        `Attached is the Goldie's KDS ${rangeLabel.toLowerCase()} owner report.`,
        "",
        "Included:",
        "- drink revenue",
        "- drink units",
        "- hourly volume chart",
        "- category mix",
        "- multi-drink order signal",
        "",
        "This is a practice report email from the Owner Portal.",
      ].join("\n"),
      attachments: [
        {
          filename: `goldies-owner-report-${range}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    res.json({
      ok: true,
      message: `Sent ${rangeLabel.toLowerCase()} PDF report to ${email}.`,
    });
  } catch (error) {
    console.error("Error emailing owner report:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/owner/access-log", requireOwnerAuth, async (req, res) => {
  try {
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
    if (!supabase) return res.json({ insights: [] });

    const range = String(req.query.range || "today").toLowerCase();
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 12, 100);
    let query = supabase
      .from("kds_customer_insights")
      .select("*")
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
    };

    if (!supabase) {
      return res.json({ ok: true, insight: { id: `local-${Date.now()}`, ...insight } });
    }

    const { data, error } = await supabase
      .from("kds_customer_insights")
      .insert(insight)
      .select()
      .single();

    if (error) throw error;
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

app.get("/api/menu/availability", requireOwnerAuth, async (_req, res) => {
  try {
    const [categories, availability] = await Promise.all([
      getGoldiesMenuBoard(),
      getMenuAvailabilityRows(),
    ]);
    const availabilityByKey = new Map(
      (availability || []).map((row) => [
        normalizeMenuAvailabilityKey(row.item_key || row.item_name),
        row,
      ])
    );

    const items = [];
    for (const category of buildStaticMenuItems()) {
      for (const item of category.items || []) {
        const itemKey = normalizeMenuAvailabilityKey(item.name);
        const row = availabilityByKey.get(itemKey);
        items.push({
          itemKey,
          itemName: item.name,
          category: category.label,
          available: row ? Boolean(row.available) : true,
          updatedAt: row?.updated_at || null,
        });
      }
    }

    res.json({
      ok: true,
      items,
      visibleCategories: categories,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching menu availability:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/menu/availability", requireOwnerAuth, async (req, res) => {
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

app.get("/api/beta/online-order/menu", async (_req, res) => {
  try {
    const menu = await getSquareOnlineOrderingMenu();
    const hours = getOnlineOrderingHoursStatus();
    res.json({
      ok: true,
      source: menu.some((group) => group.items?.some((item) => item.source === "square"))
        ? "square"
        : "static",
      categories: menu,
      hours,
      pickupSlots: generatePickupSlots(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching online ordering beta menu:", error);
    res.json({
      ok: true,
      source: "static",
      categories: buildStaticOnlineOrderingMenu(),
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
    const lineItems = await buildOnlineOrderingBetaLineItems(req.body?.items);

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
      "DrinkFlow online ordering beta",
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
              name: "DrinkFlow Online Beta",
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
              drinkflow_source: "online_ordering_beta",
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
    console.error("Error creating online ordering beta checkout:", error);
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

app.post("/api/square-sync", requireKdsAuth, async (req, res) => {
  try {
    const squareOrders = await fetchSquareOrders();
    const paymentOrders = await fetchSquarePaymentOrders();
    const savedTickets = [];

    for (const order of dedupeOrders([...squareOrders, ...paymentOrders])) {
      const ticket = await normalizeSquareOrder(order);
      const savedTicket = await upsertTicket(ticket, order);
      savedTickets.push(savedTicket);
    }

    res.json({
      ok: true,
      found: squareOrders.length,
      foundFromPayments: paymentOrders.length,
      saved: savedTickets.length,
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
    await updateSquareOrderFulfillment(id, updatedStatus);

    res.json({ ok: true, id, status: updatedStatus });
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
    const report = await getDrinkReport(range);

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
    const allowedRanges = new Set(["today"]);
    const range = allowedRanges.has(req.query.range) ? req.query.range : "today";
    const report = await getDrinkMakingTimeReport(range);

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

bootstrap().catch((error) => {
  console.error("Failed to boot KDS backend:", error);
  process.exit(1);
});
