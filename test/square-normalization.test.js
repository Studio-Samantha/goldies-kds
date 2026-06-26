const assert = require("node:assert/strict");
const Module = require("node:module");
const test = require("node:test");

process.env.GOLDIES_TEST_MODE = "1";

const originalLoad = Module._load;
Module._load = function loadWithTestStubs(request, parent, isMain) {
  if (request === "dotenv") return { config: () => ({}) };
  if (request === "express") {
    const app = {
      set: () => app,
      use: () => app,
      get: () => app,
      post: () => app,
      patch: () => app,
      listen: () => app,
    };
    const express = () => app;
    express.json = () => (_req, _res, next) => next && next();
    express.static = () => (_req, _res, next) => next && next();
    return express;
  }
  if (request === "cors") return () => (_req, _res, next) => next && next();
  if (request === "nodemailer") return { createTransport: () => ({ sendMail: async () => ({}) }) };
  if (request === "exceljs") return { Workbook: class {} };
  if (request === "pdfkit") return class {};
  if (request === "@supabase/supabase-js") return { createClient: () => ({}) };
  if (request === "square") {
    return {
      Client: class {},
      Environment: { Sandbox: "sandbox", Production: "production" },
    };
  }
  return originalLoad(request, parent, isMain);
};

const {
  __testExports: {
    buildOwnerDrinkRevenueReport,
    buildOwnerReportPeriod,
    buildCatalogMenuAvailabilityItems,
    buildStaticOnlineOrderingMenu,
    cleanCustomerName,
    getSuspiciousPickupNameTickets,
    getCanonicalDrinkName,
    getFallbackDrinkImageUrl,
    getDisplayDrinkItems,
    getItemDrinkCategory,
    normalizeSquareOrder,
    parseCustomerNameFromNotes,
    resolveKdsTicketStatus,
    shouldSkipUnpaidOnlineOrder,
    isServiceOption,
  },
} = require("../server");

test("canonical drink names clean up Square edits without changing display style", () => {
  assert.equal(getCanonicalDrinkName("STRAWBERRY BANANA (16 OZ)"), "Strawberry Banana (16 oz)");
  assert.equal(getCanonicalDrinkName("STRAWBERRY MANGO (12 OZ KIDS)"), "Strawberry Mango (12 oz Kids)");
  assert.equal(getCanonicalDrinkName("STRAWMANGO"), "Refresher - Strawberry Mango");
  assert.equal(getCanonicalDrinkName("CHOCOLATE P/B BANANA (12 OZ KIDS)"), "Chocolate P/B Banana (12 oz Kids)");
  assert.equal(getCanonicalDrinkName("AMERICANO DECAF"), "Americano (DECAF)");
  assert.equal(getCanonicalDrinkName("Steamer"), "Steamer (Or Cold)");
});

test("sync audit flags active tickets with drink labels as pickup names", () => {
  const suspicious = getSuspiciousPickupNameTickets([
    {
      id: "1",
      orderNumber: "1001",
      customerName: "STRAWMANGO",
      status: "new",
    },
    {
      id: "2",
      orderNumber: "1002",
      customerName: "Claire",
      status: "making",
    },
  ]);

  assert.deepEqual(suspicious, [
    {
      id: "1",
      orderNumber: "1001",
      customerName: "STRAWMANGO",
      status: "new",
    },
  ]);
});

test("customer-name cleanup rejects drink names and all-caps menu codes", () => {
  assert.equal(cleanCustomerName("STRAWMANGO"), "");
  assert.equal(cleanCustomerName("STRAWBERRY BANANA"), "");
  assert.equal(cleanCustomerName("Refresher - Strawberry Mango"), "");
  assert.equal(cleanCustomerName("Christy"), "Christy");
  assert.equal(cleanCustomerName("Sheena Rae"), "Sheena Rae");
});

test("customer-name note fallback only accepts explicit customer labels", () => {
  assert.equal(parseCustomerNameFromNotes([{ note: "for STRAWMANGO" }]), "");
  assert.equal(parseCustomerNameFromNotes([{ note: "extra strawberry" }]), "");
  assert.equal(parseCustomerNameFromNotes([{ note: "Customer: Claire pickup at 9" }]), "Claire");
  assert.equal(parseCustomerNameFromNotes([{ note: "Name - Blake" }]), "Blake");
});

test("drink classification keeps smoothies and refreshers in drink reporting", () => {
  assert.equal(getItemDrinkCategory({ name: "STRAWBERRY (16 OZ)" }), "Smoothies");
  assert.equal(getItemDrinkCategory({ name: "STRAWBERRY BANANA (12 OZ KIDS)" }), "Smoothies");
  assert.equal(getItemDrinkCategory({ name: "STRAWBERRY MANGO (16 OZ)" }), "Smoothies");
  assert.equal(getItemDrinkCategory({ name: "MANGO (16 OZ)" }), "Smoothies");
  assert.equal(getItemDrinkCategory({ name: "anything", category: "SMOOTHIES" }), "Smoothies");
  assert.equal(getItemDrinkCategory({ name: "MATCHA LATTE" }), "Not Coffee");
  assert.equal(getItemDrinkCategory({ name: "CHAI LATTE" }), "Not Coffee");
  assert.equal(getItemDrinkCategory({ name: "Steamer" }), "Not Coffee");
  assert.equal(getItemDrinkCategory({ name: "STRAWMANGO" }), "Not Coffee");
  assert.equal(getItemDrinkCategory({ name: "Muffin" }), null);
});

test("availability and online ordering menus use current display names", () => {
  const availabilityItems = buildCatalogMenuAvailabilityItems([
    { name: "STRAWMANGO", displayName: "Refresher - Strawberry Mango", category: "Not Coffee", priceCents: 600 },
    { name: "STRAWBERRY BANANA (16 OZ)", displayName: "Strawberry Banana (16 oz)", category: "Smoothies", priceCents: 700 },
    { name: "AMERICANO DECAF", displayName: "Americano (DECAF)", category: "Coffee", priceCents: 325 },
  ]);

  assert.deepEqual(
    availabilityItems.map((item) => [item.itemName, item.category, item.price]),
    [
      ["Americano (DECAF)", "Coffee", "$3.25"],
      ["Refresher - Strawberry Mango", "Not Coffee", "$6.00"],
      ["Strawberry Banana (16 oz)", "Smoothies", "$7.00"],
    ]
  );

  const unavailableKeys = new Set(["refresher strawberry mango"]);
  const staticOnlineMenu = buildStaticOnlineOrderingMenu({ unavailableKeys, includeForHereOnly: true });
  const staticNames = staticOnlineMenu.flatMap((group) => group.items.map((item) => item.name));

  assert.equal(staticNames.includes("Refresher - Strawberry Mango"), false);
  assert.equal(staticNames.includes("Steamer (Or Cold)"), true);
});

test("customer ordering filters Square service labels from drink additions", () => {
  assert.equal(isServiceOption({ name: "Hangin' Out" }), true);
  assert.equal(isServiceOption({ name: "Taking Off" }), true);
  assert.equal(isServiceOption({ name: "Vanilla" }), false);
});

test("custom owner report periods use Goldie's shop day boundaries", () => {
  const period = buildOwnerReportPeriod({
    range: "custom",
    startDate: "2026-05-01",
    endDate: "2026-05-01",
  });

  assert.equal(period.label, "May 1, 2026 - May 1, 2026");
  assert.equal(period.start.toISOString(), "2026-05-01T05:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-05-02T04:59:59.999Z");
  assert.equal(period.fileToken, "custom-2026-05-01-to-2026-05-01");
});

test("static customer ordering menu uses unique generated drink images", () => {
  const staticOnlineMenu = buildStaticOnlineOrderingMenu({ includeForHereOnly: true });
  const items = staticOnlineMenu.flatMap((group) => group.items);
  const imageUrls = items.map((item) => item.imageUrl);

  assert.equal(items.length, 29);
  assert.equal(new Set(imageUrls).size, imageUrls.length);
  assert.equal(
    imageUrls.every((url) => url.startsWith("/assets/drinks/generated/")),
    true
  );
  assert.equal(
    getFallbackDrinkImageUrl("Strawberry Banana (12 oz Kids)"),
    "/assets/drinks/generated/strawberry-banana-12-oz-kids.png"
  );
  assert.equal(
    getFallbackDrinkImageUrl("Strawberry Banana (16 oz)"),
    "/assets/drinks/generated/strawberry-banana-16-oz.png"
  );
});

test("orders-up display keeps individual drink done state", () => {
  const items = getDisplayDrinkItems({
    items: [
      {
        name: "STRAWBERRY MANGO (16 OZ)",
        qty: 1,
        category: "Smoothies",
        done: true,
      },
      {
        name: "Muffin",
        qty: 1,
        done: true,
      },
    ],
  });

  assert.deepEqual(items, [
    {
      name: "Strawberry Mango (16 oz)",
      qty: 1,
      modifiers: [],
      note: "",
      done: true,
    },
  ]);
});

test("Square order normalization keeps repeated identical drinks as separate KDS items", async () => {
  const ticket = await normalizeSquareOrder({
    id: "square-order-duplicate-drinks",
    orderNumber: "1042",
    createdAt: "2026-06-26T13:00:00.000Z",
    lineItems: [
      {
        uid: "same-square-line",
        catalogObjectId: "latte-variation",
        name: "Latte",
        quantity: "1",
      },
      {
        uid: "same-square-line",
        catalogObjectId: "latte-variation",
        name: "Latte",
        quantity: "1",
      },
    ],
  });

  assert.equal(ticket.items.length, 2);
  assert.deepEqual(ticket.items.map((item) => item.name), ["Latte", "Latte"]);
  assert.equal(new Set(ticket.items.map((item) => item.id)).size, 2);
  assert.deepEqual(ticket.items.map((item) => item.id), [
    "same-square-line__1",
    "same-square-line__2",
  ]);
});

test("brand-new completed Square drink orders still enter the active KDS queue", () => {
  const status = resolveKdsTicketStatus(
    null,
    {
      status: "completed",
      items: [{ name: "Drip", qty: 1, category: "Coffee" }],
    },
    {}
  );

  assert.equal(status, "new");
});

test("manual backfill keeps completed Square drink orders completed", () => {
  const status = resolveKdsTicketStatus(
    null,
    {
      status: "completed",
      items: [{ name: "Drip", qty: 1, category: "Coffee" }],
    },
    { refreshCompletedStatus: true }
  );

  assert.equal(status, "completed");
});

test("previously mis-saved completed Square drink orders reopen if KDS never completed them", () => {
  const status = resolveKdsTicketStatus(
    {
      status: "completed",
      raw_order: {
        state: "COMPLETED",
        kdsStatusEvents: [],
      },
    },
    {
      status: "completed",
      items: [{ name: "Drip", qty: 1, category: "Coffee" }],
    },
    {}
  );

  assert.equal(status, "new");
});

test("KDS-completed drink orders stay completed during Square sync", () => {
  const status = resolveKdsTicketStatus(
    {
      status: "completed",
      raw_order: {
        state: "COMPLETED",
        kdsStatusEvents: [{ status: "completed", at: "2026-06-26T13:00:00.000Z" }],
      },
    },
    {
      status: "completed",
      items: [{ name: "Drip", qty: 1, category: "Coffee" }],
    },
    {}
  );

  assert.equal(status, "completed");
});

test("unpaid DrinkFlow online checkout orders stay out of the KDS queue", () => {
  assert.equal(
    shouldSkipUnpaidOnlineOrder(
      {
        id: "online-order-1",
        source: { name: "DrinkFlow Online Orders" },
        metadata: { drinkflow_source: "online_ordering_beta" },
      },
      new Set()
    ),
    true
  );

  assert.equal(
    shouldSkipUnpaidOnlineOrder(
      {
        id: "online-order-1",
        source: { name: "DrinkFlow Online Orders" },
        metadata: { drinkflow_source: "online_ordering_beta" },
      },
      new Set(["online-order-1"])
    ),
    false
  );
});

test("owner report separates drink revenue from non-drink add-on signals", () => {
  const report = buildOwnerDrinkRevenueReport(
    [
      {
        square_order_id: "order-1",
        order_number: "1001",
        customer_name: "Claire",
        created_at: "2026-05-08T14:00:00.000Z",
        raw_order: {
          lineItems: [
            {
              uid: "line-1",
              name: "STRAWBERRY BANANA (16 OZ)",
              quantity: "1",
              totalMoney: { amount: 700 },
              totalTaxMoney: { amount: 50 },
            },
            {
              uid: "line-2",
              name: "Muffin",
              quantity: "2",
              totalMoney: { amount: 800 },
              totalTaxMoney: { amount: 60 },
            },
          ],
        },
      },
      {
        square_order_id: "order-2",
        order_number: "1002",
        customer_name: "Blake",
        created_at: "2026-05-08T15:00:00.000Z",
        raw_order: {
          lineItems: [
            {
              uid: "line-3",
              name: "Latte",
              quantity: "2",
              totalMoney: { amount: 1200 },
              totalTaxMoney: { amount: 90 },
            },
          ],
        },
      },
    ],
    new Date("2026-05-08T00:00:00.000Z"),
    new Date("2026-05-09T00:00:00.000Z")
  );

  assert.equal(report.orderCount, 2);
  assert.equal(report.totalUnits, 3);
  assert.equal(report.totalCollected, "$19.00");
  assert.equal(report.nonDrinkTotal, "$8.00");
  assert.equal(report.drinkOrdersWithNonDrinkItems, 1);
  assert.equal(report.drinkOrderNonDrinkAttachmentRate, 50);
  assert.equal(report.totalsByName[0].name, "Latte");
  assert.equal(report.totalsByName[0].units, 2);
});
