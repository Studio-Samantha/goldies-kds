import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const BACKEND_LABEL = API_BASE_URL
  ? API_BASE_URL.includes("ngrok")
    ? "ngrok backend"
    : "absolute backend"
  : "proxied backend";
const BACKEND_URL = API_BASE_URL || window.location.origin;
const POLL_INTERVAL_MS = 3000;

const MOCK_TICKETS = [
  {
    id: "104",
    orderNumber: "104",
    createdAt: Date.now() - 1000 * 60 * 2,
    source: "Square Register",
    status: "new",
    items: [
      { name: "Latte", qty: 1, modifiers: ["Oat milk", "Vanilla", "Extra shot"] },
      { name: "Hot Chocolate", qty: 1, modifiers: ["Small"] },
    ],
  },
  {
    id: "105",
    orderNumber: "105",
    createdAt: Date.now() - 1000 * 60 * 7,
    source: "Square Handheld",
    status: "making",
    items: [
      { name: "Strawberry Banana", qty: 2, modifiers: ["No banana on one"] },
      { name: "Chai Latte", qty: 1, modifiers: ["Iced", "Oat milk"] },
    ],
  },
  {
    id: "106",
    orderNumber: "106",
    createdAt: Date.now() - 1000 * 60 * 13,
    source: "Square Register",
    status: "ready",
    items: [
      { name: "Flat White", qty: 1, modifiers: ["Regular"] },
    ],
  },
];

const CURRENT_MENU = {
  Coffee: [
    "Americano",
    "Cappuccino",
    "Cold Brew",
    "Drip",
    "Espresso",
    "Flat White",
    "Gibraltar",
    "Latte",
    "Pour Over",
    "Drip Refill",
  ],
  "Not Coffee": [
    "Chai Latte",
    "Hot Chocolate",
    "London Fog",
    "Matcha Latte",
    "Steamer",
    "Teas",
    "Refresher-Strawberry Mango",
  ],
  Smoothies: [
    "Chocolate P/B Banana",
    "Greens",
    "Mango",
    "Strawberry",
    "Strawberry Banana",
  ],
};

const KDS_TEST_MENU_ITEMS = Object.values(CURRENT_MENU).flat();

const STATUS_COLUMNS = [
  { key: "new", label: "New" },
  { key: "making", label: "Making" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

function getMinutesElapsed(createdAt) {
  return Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
}

function formatElapsed(createdAt) {
  const mins = getMinutesElapsed(createdAt);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

function getTimeClass(createdAt) {
  const mins = getMinutesElapsed(createdAt);
  if (mins >= 10) return "text-red-700 bg-red-50 border-red-100";
  if (mins >= 5) return "text-amber-700 bg-amber-50 border-amber-100";
  return "text-emerald-700 bg-emerald-50 border-emerald-100";
}

function normalizeTicket(ticket) {
  return {
    id: ticket.id || ticket.order_id || crypto.randomUUID(),
    orderNumber: ticket.orderNumber || ticket.order_number || ticket.ticketName || "—",
    createdAt: typeof ticket.createdAt === "number" ? ticket.createdAt : new Date(ticket.createdAt || ticket.created_at || Date.now()).getTime(),
    source: ticket.source || "Square",
    status: ticket.status || "new",
    items: (ticket.items || []).map((item) => ({
      name: item.name || "Unnamed item",
      qty: item.qty || item.quantity || 1,
      modifiers: item.modifiers || [],
      note: item.note || "",
    })),
  };
}

function MenuAccordion({ menu }) {
  const [openSections, setOpenSections] = useState({
    Coffee: true,
    "Not Coffee": true,
    Smoothies: true,
  });

  const totalItems = Object.values(menu).reduce((sum, items) => sum + items.length, 0);

  function toggleSection(category) {
    setOpenSections((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <section className="rounded-3xl bg-white border border-neutral-200 p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Menu</h2>
          <p className="text-sm text-neutral-500">{Object.keys(menu).length} categories · {totalItems} items total · retail excluded</p>
        </div>
        <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-bold border border-neutral-200">
          Sandbox menu reference
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {Object.entries(menu).map(([category, items]) => (
          <div key={category} className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
            <button
              onClick={() => toggleSection(category)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50 text-left"
            >
              <span className="font-black text-lg">{category}</span>
              <span className="rounded-full bg-white border border-neutral-200 px-3 py-1 text-sm font-bold text-neutral-600">
                {items.length} {openSections[category] ? "▲" : "▼"}
              </span>
            </button>

            {openSections[category] && (
              <div className="p-3 grid grid-cols-1 gap-2">
                {items.map((item) => (
                  <div key={item} className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-800">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TicketCard({ ticket, onStatusChange }) {
  const elapsed = formatElapsed(ticket.createdAt);
  const timeClass = getTimeClass(ticket.createdAt);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold tracking-tight">#{ticket.orderNumber}</div>
          <div className="text-sm text-neutral-500">{ticket.source}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-semibold border ${timeClass}`}>{elapsed}</div>
      </div>

      <div className="space-y-3">
        {ticket.items.map((item, idx) => (
          <div key={`${ticket.id}-${idx}`} className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0">
            <div className="flex gap-2 text-lg font-semibold">
              <span className="text-neutral-500">{item.qty}×</span>
              <span>{item.name}</span>
            </div>
            {item.modifiers.length > 0 && (
              <ul className="mt-1 ml-7 list-disc text-sm text-neutral-700 space-y-0.5">
                {item.modifiers.map((mod) => <li key={mod}>{mod}</li>)}
              </ul>
            )}
            {item.note && (
              <div className="mt-2 rounded-xl bg-yellow-50 border border-yellow-100 px-3 py-2 text-sm font-medium text-yellow-900">
                Note: {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        {ticket.status !== "making" && ticket.status !== "ready" && ticket.status !== "completed" && (
          <button onClick={() => onStatusChange(ticket.id, "making")} className="rounded-xl bg-neutral-900 text-white px-3 py-2 font-semibold">Start</button>
        )}
        {ticket.status !== "ready" && ticket.status !== "completed" && (
          <button onClick={() => onStatusChange(ticket.id, "ready")} className="rounded-xl bg-neutral-100 px-3 py-2 font-semibold">Ready</button>
        )}
        {ticket.status !== "completed" && (
          <button onClick={() => onStatusChange(ticket.id, "done")} className="rounded-xl bg-neutral-100 px-3 py-2 font-semibold col-span-2">Done</button>
        )}
      </div>
    </div>
  );
}

export default function GoldiesKDSTestHarness() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [lastPoll, setLastPoll] = useState(new Date());
  const [pollCount, setPollCount] = useState(0);
  const [useMockPolling, setUseMockPolling] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Sandbox mode");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    const interval = setInterval(async () => {
      setLastPoll(new Date());
      setPollCount((count) => count + 1);

      if (useMockPolling) {
        setConnectionStatus("Sandbox mode");
        return;
      }

      try {
        const url = API_BASE_URL ? `${API_BASE_URL}/api/tickets` : "/api/tickets";
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch tickets: ${response.status}`);
        const liveTickets = await response.json();
        setTickets(liveTickets.map(normalizeTicket));
        setConnectionStatus("Connected to /api/tickets");
        setLastError("");
      } catch (error) {
        setConnectionStatus("Live polling error");
        setLastError(error.message || "Unknown polling error");
        console.warn("Live polling failed. Keeping current tickets.", error);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [useMockPolling]);

  const activeTickets = tickets.filter((ticket) => ticket.status !== "done");

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = activeTickets.filter((ticket) => ticket.status === col.key);
      return acc;
    }, {});
  }, [activeTickets]);

  function handleStatusChange(id, status) {
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, status } : ticket));

    if (!useMockPolling) {
      const statusUrl = API_BASE_URL ? `${API_BASE_URL}/api/tickets/${id}/status` : `/api/tickets/${id}/status`;
    fetch(statusUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch((error) => {
        setLastError(`Status update failed: ${error.message}`);
      });
    }
  }

  function addMockTicket() {
    const id = String(Math.floor(Math.random() * 900) + 100);
    const options = KDS_TEST_MENU_ITEMS.map((name) => ({
      name,
      modifiers: name.includes("Latte") || name === "Cappuccino" || name === "Flat White"
        ? [Math.random() > 0.5 ? "Oat milk" : "Whole milk", Math.random() > 0.5 ? "Iced" : "Hot"]
        : name === "Mango" || name === "Strawberry" || name === "Strawberry Banana"
          ? [Math.random() > 0.5 ? "Add protein" : "No dairy"]
          : ["Regular"],
    }));
    const item = options[Math.floor(Math.random() * options.length)];
    setTickets((current) => [
      {
        id,
        orderNumber: id,
        createdAt: Date.now(),
        source: Math.random() > 0.5 ? "Square Register" : "Square Handheld",
        status: "new",
        items: [{ qty: 1, ...item }],
      },
      ...current,
    ]);
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 text-neutral-950">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center rounded-full bg-yellow-100 border border-yellow-200 text-yellow-900 px-3 py-1 text-sm font-bold mb-3">
            Goldie’s Coffee Shop
          </div>
          <h1 className="text-4xl font-black tracking-tight">Kitchen Display</h1>
          <p className="text-neutral-600 mt-1">Square register + handheld orders, polling every 3 seconds</p>
          <p className="text-neutral-500 text-sm mt-1">Sandbox menu has 22 KDS items across Coffee, Not Coffee, and Smoothies. Retail and Community Can Kombucha are excluded.</p>
          <p className="text-neutral-500 text-sm mt-2">Backend: <span className="font-semibold text-neutral-800">{BACKEND_LABEL}</span> (<span className="underline decoration-dotted">{BACKEND_URL}</span>)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={addMockTicket} className="rounded-2xl bg-neutral-900 text-white px-4 py-3 font-bold shadow-sm">Add Test Ticket</button>
          <button onClick={() => setUseMockPolling(!useMockPolling)} className="rounded-2xl bg-white border border-neutral-200 px-4 py-3 font-bold shadow-sm">
            {useMockPolling ? "Sandbox Tickets" : "Live /api/tickets"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Mode</div>
          <div className="text-xl font-black">{useMockPolling ? "Sandbox" : "Live API"}</div>
        </div>
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Connection</div>
          <div className="text-xl font-black">{connectionStatus}</div>
        </div>
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Last poll</div>
          <div className="text-xl font-black">{lastPoll.toLocaleTimeString()}</div>
        </div>
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Poll count</div>
          <div className="text-xl font-black">{pollCount}</div>
        </div>
      </section>

      {lastError && (
        <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 mb-6 font-medium">
          {lastError}
        </div>
      )}

      <MenuAccordion menu={CURRENT_MENU} />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((column) => (
          <section key={column.key} className="rounded-3xl bg-neutral-100 border border-neutral-200 p-3 min-h-[500px]">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <h2 className="text-2xl font-black">{column.label}</h2>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold border border-neutral-200">{grouped[column.key]?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {grouped[column.key]?.length ? grouped[column.key].map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onStatusChange={handleStatusChange} />
              )) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-8 text-center text-neutral-500">No tickets</div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}