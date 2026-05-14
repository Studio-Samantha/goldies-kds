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
    cleanCustomerName,
    getSuspiciousPickupNameTickets,
    getCanonicalDrinkName,
    getDisplayDrinkItems,
    getItemDrinkCategory,
    parseCustomerNameFromNotes,
  },
} = require("../server");

test("canonical drink names clean up Square edits without changing display style", () => {
  assert.equal(getCanonicalDrinkName("STRAWBERRY BANANA (16 OZ)"), "Strawberry Banana (16 oz)");
  assert.equal(getCanonicalDrinkName("STRAWBERRY MANGO (12 OZ KIDS)"), "Strawberry Mango (12 oz Kids)");
  assert.equal(getCanonicalDrinkName("STRAWMANGO"), "Refresher - Strawberry Mango");
  assert.equal(getCanonicalDrinkName("CHOCOLATE P/B BANANA (12 OZ KIDS)"), "Chocolate P/B Banana (12 oz Kids)");
  assert.equal(getCanonicalDrinkName("AMERICANO DECAF"), "Americano (DECAF)");
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
  assert.equal(getItemDrinkCategory({ name: "STRAWMANGO" }), "Not Coffee");
  assert.equal(getItemDrinkCategory({ name: "Muffin" }), null);
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
