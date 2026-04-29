require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
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
const SESSION_SECRET = process.env.SESSION_SECRET || SQUARE_ACCESS_TOKEN;
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || "";
const VALID_STATUSES = new Set(["new", "making", "ready", "completed", "done"]);
const SQUARE_SYNC_INTERVAL_MS = 30 * 1000;
const SESSION_COOKIE_NAME = "goldies_kds_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;

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

if (!KDS_PASSWORD) {
  console.warn(
    "WARNING: KDS_PASSWORD is not configured. KDS login is disabled until this env var is set."
  );
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

const allowedOrigins = CORS_ORIGIN
  ? CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

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
let tickets = [
  {
    id: "local-101",
    orderNumber: "101",
    createdAt: Date.now() - 1000 * 60 * 3,
    source: "Local Test API",
    status: "new",
    diningOption: "Order",
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

function normalizeName(name = "") {
  return String(name).trim();
}

function getDrinkCategory(itemName = "") {
  const name = normalizeName(itemName);
  const lower = name.toLowerCase();

  if (COFFEE_DRINKS.has(name)) return "Coffee";
  if (NOT_COFFEE_DRINKS.has(name)) return "Not Coffee";
  if (SMOOTHIE_DRINKS.has(name)) return "Smoothies";

  if (
    [
      "latte",
      "coffee",
      "espresso",
      "americano",
      "cappuccino",
      "mocha",
      "macchiato",
      "cold brew",
      "drip",
      "pour over",
      "gibraltar",
      "flat white",
    ].some((keyword) => lower.includes(keyword))
  ) {
    return "Coffee";
  }

  if (
    [
      "matcha",
      "chai",
      "tea",
      "teas",
      "steamer",
      "refresher",
      "hot chocolate",
      "fog",
    ].some((keyword) => lower.includes(keyword))
  ) {
    return "Not Coffee";
  }

  if (lower.includes("smoothie")) return "Smoothies";

  return null;
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

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName) return cookies;

    cookies[rawName] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

function signSession(expiresAt) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(String(expiresAt))
    .digest("hex");
}

function createSessionToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  return `${expiresAt}.${signSession(expiresAt)}`;
}

function isValidSessionToken(token) {
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  const expiresAtMs = Number(expiresAt);

  if (!expiresAtMs || expiresAtMs <= Date.now() || !signature) return false;

  const expectedSignature = signSession(expiresAt);
  if (signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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

function isPasswordMatch(password) {
  if (!KDS_PASSWORD || !password) return false;

  const provided = Buffer.from(String(password));
  const expected = Buffer.from(String(KDS_PASSWORD));

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

function requireKdsAuth(req, res, next) {
  if (!KDS_PASSWORD) {
    return res.status(503).json({
      error: "KDS login is not configured. Set KDS_PASSWORD on the backend.",
    });
  }

  const cookies = parseCookies(req.headers.cookie || "");

  if (!isValidSessionToken(cookies[SESSION_COOKIE_NAME])) {
    return res.status(401).json({ error: "Login required" });
  }

  return next();
}

function addTicket(ticket) {
  const alreadyExists = tickets.some((existing) => existing.id === ticket.id);

  if (!alreadyExists) {
    tickets.unshift(ticket);
  }

  return ticket;
}

function updateLocalTicketStatus(id, status) {
  tickets = tickets.map((ticket) =>
    ticket.id === id
      ? {
          ...ticket,
          status,
          completedAt: status === "done" ? Date.now() : ticket.completedAt,
        }
      : ticket
  );
}

function updateLocalTicketName(id, customerName) {
  tickets = tickets.map((ticket) =>
    ticket.id === id ? { ...ticket, customerName } : ticket
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

    const response = await ordersApi.searchOrders({
      locationIds: [SQUARE_LOCATION_ID],
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

    return response.result.orders || [];
  } catch (error) {
    console.error("Error fetching Square orders:", error.message);
    return [];
  }
}

async function fetchSquarePaymentOrders() {
  try {
    const { ordersApi, paymentsApi } = squareClient;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const response = await paymentsApi.listPayments(
      yesterday.toISOString(),
      now.toISOString(),
      "DESC",
      undefined,
      SQUARE_LOCATION_ID,
      undefined,
      undefined,
      undefined,
      100
    );
    const payments = response.result.payments || [];
    const orders = [];

    for (const payment of payments) {
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
    console.error("Error fetching Square payments:", error.message);
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

function getDiningOption(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const type = String(fulfillment.type || "").toUpperCase();

  if (type === "DELIVERY" || type === "SHIPMENT") return "Delivery";
  if (type === "PICKUP") return "Pickup";

  const metadataValue =
    order.metadata?.dining_option ||
    order.metadata?.diningOption ||
    order.metadata?.order_type ||
    order.metadata?.orderType ||
    "";
  const value = String(metadataValue).toLowerCase();

  if (value.includes("delivery")) return "Delivery";
  if (value.includes("pickup") || value.includes("pick up")) return "Pickup";
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

  return "Order";
}

function getSquareCustomerName(order) {
  const fulfillment = order.fulfillments?.[0] || {};
  const pickupRecipient = fulfillment.pickupDetails?.recipient || {};
  const deliveryRecipient = fulfillment.deliveryDetails?.recipient || {};
  const shipmentRecipient = fulfillment.shipmentDetails?.recipient || {};
  const tenders = order.tenders || [];
  const firstTenderCustomer =
    tenders.find((tender) => tender.customerId || tender.buyerEmailAddress) || {};
  const rawName =
    pickupRecipient.displayName ||
    deliveryRecipient.displayName ||
    shipmentRecipient.displayName ||
    order.metadata?.customer_name ||
    order.metadata?.customerName ||
    order.metadata?.name ||
    firstTenderCustomer.customerId ||
    "";

  return String(rawName).trim();
}

function normalizeSquareOrder(order) {
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
    customerName: getSquareCustomerName(order),
    createdAt: new Date(order.createdAt || Date.now()).getTime(),
    source: "Square Register",
    status: getSquareOrderStatus(order),
    diningOption: getDiningOption(order),
    items,
  };
}

function ticketFromDb(order, items = []) {
  return {
    id: order.square_order_id,
    orderNumber: order.order_number || order.square_order_id.slice(-4),
    customerName: order.customer_name || "",
    createdAt: new Date(order.created_at).getTime(),
    completedAt: order.completed_at ? new Date(order.completed_at).getTime() : null,
    source: order.source || "Square Register",
    status: sanitizeStatus(order.status),
    diningOption: order.dining_option || "Order",
    items: items.map((item) => ({
      id: item.square_line_item_uid || String(item.id),
      name: item.name || "Unnamed item",
      qty: item.quantity || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      note: item.note || "",
      category: item.category || getDrinkCategory(item.name),
    })),
  };
}

async function upsertTicket(ticket, rawOrder = null) {
  if (!supabase) {
    return addTicket(ticket);
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from("kds_orders")
    .select("status")
    .eq("square_order_id", ticket.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const status = sanitizeStatus(existingOrder?.status || ticket.status);
  const createdAt = new Date(ticket.createdAt || Date.now()).toISOString();

  const { error: orderError } = await supabase.from("kds_orders").upsert(
    {
      square_order_id: ticket.id,
      order_number: ticket.orderNumber,
      customer_name: ticket.customerName || null,
      created_at: createdAt,
      source: ticket.source || "Square Register",
      status,
      dining_option: ticket.diningOption || "Order",
      completed_at: ticket.completedAt
        ? new Date(ticket.completedAt).toISOString()
        : null,
      square_state: rawOrder?.state || null,
      raw_order: rawOrder ? toJsonSafe(rawOrder) : null,
      updated_at: new Date().toISOString(),
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
        category: item.category || getDrinkCategory(item.name),
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
  const paymentOrders = await fetchSquarePaymentOrders();

  for (const order of dedupeOrders([...squareOrders, ...paymentOrders])) {
    const ticket = normalizeSquareOrder(order);
    await upsertTicket(ticket, order);
  }
}

async function getActiveTickets() {
  if (!supabase) return getLocalActiveTickets();

  await syncRecentSquareOrders();

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

  if (!supabase) {
    updateLocalTicketStatus(id, sanitizedStatus);
    return sanitizedStatus;
  }

  const updates = {
    status: sanitizedStatus,
    updated_at: new Date().toISOString(),
  };

  if (sanitizedStatus === "done") {
    updates.completed_at = new Date().toISOString();
  }

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

  return normalizedName;
}

async function getCompletedTicketsToday() {
  const start = getRangeStart("today");
  const end = getRangeEnd("today");

  if (!supabase) {
    return tickets
      .filter((ticket) => {
        const completedAt = ticket.completedAt || ticket.createdAt;
        return (
          ticket.status === "done" &&
          completedAt >= start.getTime() &&
          completedAt <= end.getTime()
        );
      })
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  const { data: orders, error } = await supabase
    .from("kds_orders")
    .select("*")
    .eq("status", "done")
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString())
    .order("completed_at", { ascending: false });

  if (error) {
    if (error.message?.includes("completed_at")) {
      console.warn("completed_at column is not available yet; returning empty completed tickets list");
      return [];
    }

    throw error;
  }

  return (orders || []).map((order) => ticketFromDb(order, []));
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

async function getDrinkReport(range = "today") {
  if (!supabase) {
    return buildDrinkReport(tickets, getRangeStart(range), getRangeEnd(range));
  }

  const start = getRangeStart(range);
  const end = getRangeEnd(range);
  const { data: orders, error: orderError } = await supabase
    .from("kds_orders")
    .select("square_order_id, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (orderError) throw orderError;
  if (!orders.length) return buildDrinkReport([], start);

  const orderIds = orders.map((order) => order.square_order_id);
  const orderDateById = new Map(
    orders.map((order) => [order.square_order_id, new Date(order.created_at).getTime()])
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
        category: item.category || getDrinkCategory(item.name),
      })),
  }));

  return buildDrinkReport(reportTickets, start, end);
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
      const category = item.category || getDrinkCategory(item.name);
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
    totalsByName: Array.from(totalsByName.entries())
      .map(([name, qty]) => ({ name, qty, category: getDrinkCategory(name) }))
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name)),
    totalsByCategory,
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Goldie's KDS backend",
    environment: SQUARE_ENVIRONMENT,
    storage: supabase ? "supabase" : "memory",
    time: new Date().toISOString(),
  });
});

app.get("/api/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated =
    Boolean(KDS_PASSWORD) && isValidSessionToken(cookies[SESSION_COOKIE_NAME]);

  res.json({
    authenticated,
    configured: Boolean(KDS_PASSWORD),
  });
});

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};

  if (!KDS_PASSWORD) {
    return res.status(503).json({
      error: "KDS login is not configured. Set KDS_PASSWORD on the backend.",
    });
  }

  if (!isPasswordMatch(password)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(createSessionToken())}; ${getCookieOptions()}`
  );

  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; ${getCookieOptions(0)}`
  );

  res.json({ ok: true });
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

app.post("/api/square-sync", requireKdsAuth, async (req, res) => {
  try {
    const squareOrders = await fetchSquareOrders();
    const paymentOrders = await fetchSquarePaymentOrders();
    const savedTickets = [];

    for (const order of dedupeOrders([...squareOrders, ...paymentOrders])) {
      const ticket = normalizeSquareOrder(order);
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

app.get("/api/square-debug", requireKdsAuth, async (req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { paymentsApi } = squareClient;
    const paymentResponse = await paymentsApi.listPayments(
      yesterday.toISOString(),
      now.toISOString(),
      "DESC",
      undefined,
      SQUARE_LOCATION_ID,
      undefined,
      undefined,
      undefined,
      10
    );
    const payments = paymentResponse.result.payments || [];

    res.json({
      ok: true,
      environment: SQUARE_ENVIRONMENT,
      locationId: SQUARE_LOCATION_ID,
      checkedFrom: yesterday.toISOString(),
      checkedTo: now.toISOString(),
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
      diningOption: "Order",
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
          const ticket = normalizeSquareOrder(order);
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

app.listen(PORT, () => {
  console.log(`Goldie's KDS backend running on port ${PORT}`);
  console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`Location ID: ${SQUARE_LOCATION_ID}`);
  console.log(`Storage: ${supabase ? "Supabase" : "Memory fallback"}`);
  console.log("Ready to receive requests!");
});
