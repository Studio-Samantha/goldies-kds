require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client, Environment } = require("square");

const app = express();
const PORT = process.env.PORT || 3000;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || "sandbox";
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Add error handling for missing environment variables
if (!SQUARE_ACCESS_TOKEN) {
  console.error("ERROR: SQUARE_ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

if (!SQUARE_LOCATION_ID) {
  console.error("ERROR: SQUARE_LOCATION_ID environment variable is required");
  process.exit(1);
}

console.log("Initializing Square client...");
console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
console.log(`Location ID: ${SQUARE_LOCATION_ID ? "Set" : "Missing"}`);

const squareClient = new Client({
  accessToken: SQUARE_ACCESS_TOKEN,
  environment: SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox,
});

console.log("Square client initialized successfully");

app.use(cors());
app.use(express.json());

let tickets = [
  {
    id: "local-101",
    orderNumber: "101",
    createdAt: Date.now() - 1000 * 60 * 3,
    source: "Local Test API",
    status: "new",
    items: [
      {
        name: "Latte",
        qty: 1,
        modifiers: ["Oat milk", "Vanilla"],
      },
    ],
  },
];

async function fetchSquareOrders() {
  try {
    const { ordersApi } = squareClient;

    // Fetch orders from the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const response = await ordersApi.searchOrders({
      locationIds: SQUARE_LOCATION_ID ? [SQUARE_LOCATION_ID] : [],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: {
              startAt: yesterday.toISOString(),
              endAt: now.toISOString(),
            },
          },
          stateFilter: {
            states: ["OPEN", "COMPLETED"], // Include both open and completed orders
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
    console.error("Error fetching Square orders:", error);
    return [];
  }
}

function getSquareOrderStatus(order) {
  const squareState = (order.state || "").toUpperCase();
  const fulfillment = order.fulfillments?.[0] || {};
  const fulfillmentState = (fulfillment.state || "").toUpperCase();
  const pickupStatus = (fulfillment.pickupDetails?.status || "").toUpperCase();
  const shipmentStatus = (fulfillment.shipmentDetails?.status || "").toUpperCase();

  if (squareState === "COMPLETED") {
    return "completed";
  }

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

function normalizeSquareOrder(order) {
  const items = [];

  if (order.lineItems) {
    for (const lineItem of order.lineItems) {
      const modifiers = [];

      if (lineItem.modifiers) {
        for (const modifier of lineItem.modifiers) {
          modifiers.push(modifier.name || "Unknown modifier");
        }
      }

      items.push({
        name: lineItem.name || "Unnamed item",
        qty: parseInt(lineItem.quantity) || 1,
        modifiers,
        note: lineItem.note || "",
      });
    }
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id.slice(-4),
    createdAt: new Date(order.createdAt).getTime(),
    source: "Square Register",
    status: getSquareOrderStatus(order),
    items,
  };
}

function addTicket(ticket) {
  const alreadyExists = tickets.some((existing) => existing.id === ticket.id);

  if (!alreadyExists) {
    tickets.unshift(ticket);
  }

  return ticket;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Goldie's KDS backend",
    environment: SQUARE_ENVIRONMENT,
    time: new Date().toISOString(),
  });
});

app.get("/api/tickets", async (req, res) => {
  try {
    // Fetch fresh orders from Square
    const squareOrders = await fetchSquareOrders();
    const normalizedOrders = squareOrders.map(normalizeSquareOrder);

    // Add any local tickets that aren't done
    const localActiveTickets = tickets.filter((ticket) => ticket.status !== "done");

    // Combine and deduplicate (prefer Square data over local)
    const allTickets = [...normalizedOrders];
    for (const localTicket of localActiveTickets) {
      if (!allTickets.some((t) => t.id === localTicket.id)) {
        allTickets.push(localTicket);
      }
    }

    res.json(allTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    // Fallback to local tickets
    res.json(tickets.filter((ticket) => ticket.status !== "done"));
  }
});

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
    const { ordersApi } = squareClient;

    // Fetch the current order to get its state and fulfillments
    const orderResponse = await ordersApi.retrieveOrder(orderId);
    const order = orderResponse.result.order;

    if (!order.fulfillments || order.fulfillments.length === 0) {
      console.warn(`No fulfillments found for order ${orderId}, skipping update`);
      return;
    }

    // Update the first fulfillment's state
    const fulfillmentState = mapKDSStatusToSquareFulfillmentState(kdsStatus);
    const updatedFulfillments = order.fulfillments.map((fulfillment, idx) =>
      idx === 0 ? { ...fulfillment, state: fulfillmentState } : fulfillment
    );

    // Update the order with new fulfillment state
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
    console.error(
      `Error updating Square order ${orderId} fulfillment:`,
      error.message
    );
  }
}

app.patch("/api/tickets/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Update local tickets
  tickets = tickets.map((ticket) =>
    ticket.id === id ? { ...ticket, status } : ticket
  );

  // Try to update Square if this is a Square order (order ID format)
  if (id.startsWith("C") || id.match(/^[A-Z0-9]{20,}/)) {
    await updateSquareOrderFulfillment(id, status);
  }

  res.json({ ok: true, id, status });
});

app.post("/api/test-ticket", (req, res) => {
  const id = String(Date.now());

  const ticket = addTicket({
    id,
    orderNumber: id.slice(-4),
    createdAt: Date.now(),
    source: "Local Test API",
    status: "new",
    items: [
      {
        name: "Test Cappuccino",
        qty: 1,
        modifiers: ["Small", "Whole milk"],
      },
    ],
  });

  res.json(ticket);
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

    // Square webhooks have a specific structure
    if (event.type === "order.created" || event.type === "order.updated") {
      const orderId = event.data?.object?.order_created?.order_id || event.data?.object?.order_updated?.order_id;

      if (orderId) {
        // Fetch the full order details
        const { ordersApi } = squareClient;
        const orderResponse = await ordersApi.retrieveOrder(orderId);
        const order = orderResponse.result.order;

        if (order) {
          const ticket = normalizeSquareOrder(order);
          addTicket(ticket);

          console.log(`Added ticket from Square webhook: ${ticket.id}`);
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

app.listen(PORT, () => {
  console.log(`🚀 Goldie's KDS backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`🏪 Location ID: ${SQUARE_LOCATION_ID}`);
  console.log(`🔗 Ready to receive requests!`);
});
