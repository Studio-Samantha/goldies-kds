import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || ""
  : "";
const LOGO_URL = "/goldies-logo.png";
const POLL_INTERVAL_MS = 3000;

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

const STATUS_COLUMNS = [
  {
    key: "new",
    label: "New",
    accent: "border-t-green-700",
    badge: "bg-green-100 text-green-800",
  },
  {
    key: "making",
    label: "Making",
    accent: "border-t-amber-400",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    key: "ready",
    label: "Ready",
    accent: "border-t-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "completed",
    label: "Completed",
    accent: "border-t-neutral-700",
    badge: "bg-neutral-200 text-neutral-800",
  },
];

const REPORT_RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
];

const DRINK_MENU_ITEMS = new Set([
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
  "Chai Latte",
  "Hot Chocolate",
  "London Fog",
  "Matcha Latte",
  "Steamer",
  "Teas",
  "Refresher-Strawberry Mango",
  "Chocolate P/B Banana",
  "Greens",
  "Mango",
  "Strawberry",
  "Strawberry Banana",
]);

function getMinutesElapsed(createdAt) {
  return Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
}

function formatOrderTime(createdAt) {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCompletedTime(completedAt) {
  if (!completedAt) return "—";

  return new Date(completedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getTimeClass(createdAt) {
  const mins = getMinutesElapsed(createdAt);

  if (mins >= 10) return "text-red-700 bg-red-50 border-red-100";
  if (mins >= 5) return "text-amber-700 bg-amber-50 border-amber-100";
  return "text-emerald-700 bg-emerald-50 border-emerald-100";
}

function isDrinkItem(itemName = "") {
  if (DRINK_MENU_ITEMS.has(itemName)) return true;

  const lower = itemName.toLowerCase();

  return [
    "latte",
    "coffee",
    "espresso",
    "americano",
    "cappuccino",
    "mocha",
    "macchiato",
    "matcha",
    "chai",
    "tea",
    "teas",
    "steamer",
    "smoothie",
    "refresher",
    "cold brew",
    "drip",
    "hot chocolate",
    "fog",
    "pour over",
    "gibraltar",
  ].some((keyword) => lower.includes(keyword));
}

function getDrinkItems(ticket) {
  return ticket.items.filter((item) => isDrinkItem(item.name));
}

function hasDrinkItems(ticket) {
  return getDrinkItems(ticket).length > 0;
}

function getVisibleItems(ticket) {
  if (ticket.status === "completed") {
    return getDrinkItems(ticket);
  }

  return ticket.items;
}

function getPreviousStatus(status) {
  if (status === "making") return "new";
  if (status === "ready") return "making";
  if (status === "completed") return "ready";

  return null;
}

function formatDiningOption(ticket) {
  const raw =
    ticket.diningOption ||
    ticket.dining_option ||
    ticket.fulfillmentType ||
    ticket.fulfillment_type ||
    ticket.orderType ||
    ticket.order_type ||
    ticket.serviceChargeType ||
    ticket.service_charge_type ||
    ticket.fulfillment ||
    "";

  const value = String(raw).toLowerCase();

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

function isToday(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getDailyDrinkCounts(tickets) {
  const counts = {};

  tickets
    .filter((ticket) => isToday(ticket.createdAt))
    .forEach((ticket) => {
      ticket.items.forEach((item) => {
        if (!isDrinkItem(item.name)) return;

        const qty = Number(item.qty || 1);
        counts[item.name] = (counts[item.name] || 0) + qty;
      });
    });

  return Object.entries(counts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

function normalizeTicket(ticket) {
  const normalized = {
    id: ticket.id || ticket.order_id || crypto.randomUUID(),
    orderNumber:
      ticket.orderNumber ||
      ticket.order_number ||
      ticket.ticketName ||
      "—",
    customerName:
      ticket.customerName ||
      ticket.customer_name ||
      ticket.recipientName ||
      ticket.recipient_name ||
      "",
    completedAt:
      typeof ticket.completedAt === "number"
        ? ticket.completedAt
        : ticket.completedAt || ticket.completed_at
          ? new Date(ticket.completedAt || ticket.completed_at).getTime()
          : null,
    createdAt:
      typeof ticket.createdAt === "number"
        ? ticket.createdAt
        : new Date(
            ticket.createdAt ||
              ticket.created_at ||
              Date.now()
          ).getTime(),
    source: ticket.source || "Square",
    status: ticket.status || "new",
    items: (ticket.items || []).map((item) => ({
      name: item.name || "Unnamed item",
      qty: item.qty || item.quantity || 1,
      modifiers: item.modifiers || [],
      note: item.note || "",
    })),
  };

  return {
    ...normalized,
    diningOption: formatDiningOption({
      ...ticket,
      ...normalized,
    }),
  };
}

function TicketCard({ ticket, onStatusChange, onNameChange }) {
  const [nameValue, setNameValue] = useState(ticket.customerName || "");
  const orderTime = formatOrderTime(ticket.createdAt);
  const timeClass = getTimeClass(ticket.createdAt);
  const visibleItems = getVisibleItems(ticket);
  const drinkOnlyMode = ticket.status === "completed";
  const ticketHasDrinks = hasDrinkItems(ticket);
  const previousStatus = getPreviousStatus(ticket.status);

  let actions = [];

  useEffect(() => {
    const nextName = ticket.customerName || "";
    if (nextName) {
      setNameValue(nextName);
    }
  }, [ticket.customerName]);

  function saveName() {
    const nextName = nameValue.trim();
    if (nextName === (ticket.customerName || "")) return;

    onNameChange(ticket.id, nextName);
  }

  if (ticket.status === "new") {
    actions = [
      {
        label: "Start",
        status: "making",
        className: "bg-green-700 text-white hover:bg-green-800",
      },
    ];
  } else if (ticket.status === "making") {
    actions = [
      {
        label: "Ready",
        status: "ready",
        className: "bg-amber-400 text-white hover:bg-amber-500",
      },
    ];
  } else if (ticket.status === "ready") {
    if (ticketHasDrinks) {
      actions = [
        {
          label: "Complete Drinks",
          status: "completed",
          className: "bg-neutral-900 text-white hover:bg-black",
        },
      ];
    } else {
      actions = [
        {
          label: "Done",
          status: "done",
          className: "bg-neutral-900 text-white hover:bg-black",
        },
      ];
    }
  } else if (ticket.status === "completed") {
    actions = [
      {
        label: "Done",
        status: "done",
        className: "bg-neutral-900 text-white hover:bg-black",
      },
    ];
  }

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-3 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight leading-none">
            #{ticket.orderNumber}
          </div>

          <div className="text-sm text-neutral-500 mt-1">
            {ticket.source}
          </div>

          {ticket.customerName && (
            <div className="mt-2 text-lg font-black text-neutral-900">
              {ticket.customerName}
            </div>
          )}

            <input
              type="text"
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveName();
                  event.currentTarget.blur();
                }
              }}
            placeholder="Add name"
            className="mt-2 w-full max-w-[180px] rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />

          <div className="mt-2 inline-flex rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-black text-neutral-700">
            {ticket.diningOption}
          </div>
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-sm font-black border ${timeClass}`}
        >
          {orderTime}
        </div>
      </div>

      {drinkOnlyMode && (
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-xs font-bold text-sky-900">
          Completed view shows drinks only
        </div>
      )}

      <div className="space-y-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <div
              key={`${ticket.id}-${idx}`}
              className="border-t border-neutral-100 pt-2 first:border-t-0 first:pt-0"
            >
              <div className="flex gap-2 text-base font-bold leading-tight">
                <span className="text-neutral-500">{item.qty}×</span>
                <span>{item.name}</span>
              </div>

              {item.modifiers.length > 0 && (
                <ul className="mt-1 ml-7 list-disc text-sm text-neutral-700 space-y-0.5">
                  {item.modifiers.map((mod) => (
                    <li key={mod}>{mod}</li>
                  ))}
                </ul>
              )}

              {item.note && (
                <div className="mt-2 rounded-xl bg-yellow-50 border border-yellow-100 px-3 py-2 text-sm font-medium text-yellow-900">
                  Note: {item.note}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
            No drink items to show.
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => onStatusChange(ticket.id, action.status)}
              className={`rounded-xl px-4 py-2.5 font-black transition ${action.className}`}
            >
              {action.label}
            </button>
          ))}

          {previousStatus && (
            <button
              onClick={() => onStatusChange(ticket.id, previousStatus)}
              className="rounded-xl px-4 py-2 font-black transition bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              Back
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-neutral-500 font-bold">
        {label}
      </div>
      <div className="text-2xl font-black mt-1">
        {value}
      </div>
      <div className="text-sm text-neutral-500 mt-1">
        {detail}
      </div>
    </div>
  );
}

function DailyDrinkCount({ drinkCounts }) {
  const totalDrinks = drinkCounts.reduce((sum, drink) => sum + drink.qty, 0);

  return (
    <section className="rounded-3xl bg-white border border-neutral-200 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Today&apos;s Count</h2>
          <p className="text-sm text-neutral-500">
            Resets automatically at midnight
          </p>
        </div>

        <div className="rounded-full bg-amber-100 border border-amber-200 px-4 py-2 text-sm font-black text-amber-900">
          {totalDrinks} drinks
        </div>
      </div>

      {drinkCounts.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {drinkCounts.map((drink) => (
            <div
              key={drink.name}
              className="rounded-2xl bg-neutral-50 border border-neutral-200 px-3 py-3"
            >
              <div className="text-2xl font-black">
                {drink.qty}
              </div>
              <div className="text-sm font-bold text-neutral-700 leading-tight">
                {drink.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-500 font-semibold">
          No drinks counted yet today.
        </div>
      )}
    </section>
  );
}

function BrandMark({ size = "md" }) {
  const dimensions = size === "lg" ? "h-28 w-56" : "h-16 w-36";

  return (
    <img
      src={LOGO_URL}
      alt="Goldie's Coffee Shop"
      className={`${dimensions} object-contain`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function DrinkStats({ reports }) {
  return (
    <section className="rounded-3xl bg-white border border-neutral-200 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Drink Stats</h2>
          <p className="text-sm text-neutral-500">
            Totals include completed orders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {REPORT_RANGES.map((range) => {
          const report = reports[range.key] || {};
          const categories = report.totalsByCategory || {};
          const total =
            Number(categories.Coffee || 0) +
            Number(categories["Not Coffee"] || 0) +
            Number(categories.Smoothies || 0);

          return (
            <div
              key={range.key}
              className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-black text-neutral-600">
                  {range.label}
                </div>

                <div className="rounded-full bg-white border border-neutral-200 px-3 py-1 text-sm font-black">
                  {total}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Coffee", "Not Coffee", "Smoothies"].map((category) => (
                  <div
                    key={category}
                    className="rounded-xl bg-white border border-neutral-200 px-3 py-2"
                  >
                    <div className="text-xl font-black">
                      {categories[category] || 0}
                    </div>
                    <div className="text-xs font-bold text-neutral-500 leading-tight">
                      {category}
                    </div>
                  </div>
                ))}
              </div>

              {report.totalsByName?.length > 0 && (
                <div className="mt-4 border-t border-neutral-200 pt-3 space-y-2">
                  {report.totalsByName.slice(0, 3).map((drink) => (
                    <div
                      key={drink.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-bold text-neutral-700 truncate">
                        {drink.name}
                      </span>
                      <span className="font-black">
                        {drink.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CompletedTransactions({ tickets }) {
  return (
    <section className="rounded-3xl bg-white border border-neutral-200 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Completed Today</h2>
          <p className="text-sm text-neutral-500">
            Resets automatically each day
          </p>
        </div>

        <div className="rounded-full bg-neutral-100 border border-neutral-200 px-4 py-2 text-sm font-black text-neutral-800">
          {tickets.length} done
        </div>
      </div>

      {tickets.length ? (
        <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded-2xl">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-black">Order</th>
                <th className="px-3 py-2 font-black">Name</th>
                <th className="px-3 py-2 font-black">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="text-sm">
                  <td className="px-3 py-2 font-black">
                    #{ticket.orderNumber}
                  </td>
                  <td className="px-3 py-2 font-bold text-neutral-700">
                    {ticket.customerName || "—"}
                  </td>
                  <td className="px-3 py-2 font-bold text-neutral-700">
                    {formatCompletedTime(ticket.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-500 font-semibold">
          No completed transactions yet today.
        </div>
      )}
    </section>
  );
}

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }

      setPassword("");
      onLogin();
    } catch (loginError) {
      setError(loginError.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-neutral-950 flex items-center justify-center px-4">
      <main className="w-full max-w-md rounded-3xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          <BrandMark size="lg" />

          <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 text-amber-900 px-3 py-1 text-sm font-bold">
            Goldie’s Coffee Shop
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight">
          Kitchen Display
        </h1>

        <p className="text-neutral-600 mt-2">
          Enter the staff password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full rounded-2xl bg-neutral-950 text-white px-4 py-3 font-black transition hover:bg-black disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function GoldiesKDS() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [tickets, setTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [drinkCounts, setDrinkCounts] = useState([]);
  const [drinkReports, setDrinkReports] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [showTodayCount, setShowTodayCount] = useState(false);
  const [lastPoll, setLastPoll] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch(apiUrl("/api/session"), {
          credentials: "include",
        });
        const session = await response.json();

        if (!mounted) return;

        setAuthStatus(session.authenticated ? "authenticated" : "login");
        if (!session.configured) {
          setLastError("KDS login is not configured on the backend.");
        }
      } catch (error) {
        if (!mounted) return;

        setAuthStatus("login");
        setLastError(error.message || "Unable to check login session");
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return undefined;

    let mounted = true;

    async function fetchDrinkReports() {
      const reports = {};

      await Promise.all(
        REPORT_RANGES.map(async (range) => {
          const response = await fetch(
            apiUrl(`/api/reports/drinks?range=${range.key}`),
            {
              credentials: "include",
            }
          );

          if (response.status === 401) {
            setAuthStatus("login");
            return;
          }

          if (!response.ok) {
            throw new Error(
              `Failed to fetch ${range.label} drink report: ${response.status}`
            );
          }

          reports[range.key] = await response.json();
        })
      );

      return reports;
    }

    async function fetchCompletedTickets() {
      const response = await fetch(apiUrl("/api/tickets/completed"), {
        credentials: "include",
      });

      if (response.status === 401) {
        setAuthStatus("login");
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch completed tickets: ${response.status}`);
      }

      const completed = await response.json();
      return completed.map(normalizeTicket);
    }

    function getTodayDrinkCounts(reports) {
      const today = reports.today || {};

      return (today.totalsByName || []).map((drink) => ({
        name: drink.name,
        qty: drink.qty,
      }));
    }

    async function fetchDrinkCounts() {
      const response = await fetch(apiUrl("/api/reports/drinks?range=today"), {
        credentials: "include",
      });

      if (response.status === 401) {
        setAuthStatus("login");
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch drink report: ${response.status}`);
      }

      const report = await response.json();
      return (report.totalsByName || []).map((drink) => ({
        name: drink.name,
        qty: drink.qty,
      }));
    }

    async function fetchTickets() {
      try {
        const response = await fetch(apiUrl("/api/tickets"), {
          credentials: "include",
        });

        if (response.status === 401) {
          setAuthStatus("login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch tickets: ${response.status}`);
        }

        const liveTickets = await response.json();
        const liveReports = await fetchDrinkReports();
        const liveCompletedTickets = await fetchCompletedTickets().catch((error) => {
          setLastError(error.message || "Completed tickets unavailable");
          return [];
        });
        const liveDrinkCounts =
          Object.keys(liveReports).length > 0
            ? getTodayDrinkCounts(liveReports)
            : await fetchDrinkCounts();

        if (!mounted) return;

        setTickets(liveTickets.map(normalizeTicket));
        setCompletedTickets(liveCompletedTickets);
        setDrinkCounts(liveDrinkCounts);
        setDrinkReports(liveReports);
        setLastPoll(new Date());
        setConnectionStatus("Connected");
        setLastError("");
      } catch (error) {
        if (!mounted) return;

        setConnectionStatus("Offline");
        setLastError(error.message || "Unknown polling error");
      }
    }

    fetchTickets();

    const interval = setInterval(fetchTickets, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authStatus]);

  const activeTickets = tickets.filter((ticket) => ticket.status !== "done");

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = activeTickets.filter((ticket) => {
        if (ticket.status !== col.key) return false;

        if (col.key === "completed") {
          return hasDrinkItems(ticket);
        }

        return true;
      });

      return acc;
    }, {});
  }, [activeTickets]);

  function handleStatusChange(id, status) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket
      )
    );

    fetch(apiUrl(`/api/tickets/${id}/status`), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((response) => {
        if (response.status === 401) {
          setAuthStatus("login");
          throw new Error("Login required");
        }

        if (!response.ok) {
          throw new Error(`Status update failed: ${response.status}`);
        }
      })
      .catch((error) => {
        setLastError(`Status update failed: ${error.message}`);
      });
  }

  function handleNameChange(id, customerName) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id ? { ...ticket, customerName } : ticket
      )
    );

    fetch(apiUrl(`/api/tickets/${id}/name`), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName }),
    })
      .then((response) => {
        if (response.status === 401) {
          setAuthStatus("login");
          throw new Error("Login required");
        }

        if (!response.ok) {
          throw new Error(`Name update failed: ${response.status}`);
        }
      })
      .catch((error) => {
        setLastError(`Name update failed: ${error.message}`);
      });
  }

  async function handleLogout() {
    await fetch(apiUrl("/api/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    setTickets([]);
    setCompletedTickets([]);
    setDrinkCounts([]);
    setDrinkReports({});
    setAuthStatus("login");
  }

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-[#fbfaf7] text-neutral-950 flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white border border-neutral-200 shadow-sm p-6 text-xl font-black">
          Loading Kitchen Display
        </div>
      </div>
    );
  }

  if (authStatus === "login") {
    return <LoginScreen onLogin={() => setAuthStatus("authenticated")} />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <header className="border-b-4 border-amber-400 bg-white/95 px-4 md:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandMark />

            <div>
              <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 text-amber-900 px-3 py-1 text-sm font-bold mb-2">
                Goldie’s Coffee Shop
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Kitchen Display
              </h1>

              <p className="text-neutral-600 mt-1 text-base">
                Live Square orders
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3">
            <div className="text-left lg:text-right">
              <div className="text-3xl font-black">
                {new Date().toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>

              <div className="text-sm text-neutral-500">
                {new Date().toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="p-3 md:p-4 space-y-4">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="Mode"
            value="Live"
            detail="Production"
          />

          <StatCard
            label="Connection"
            value={connectionStatus}
            detail="Square API"
          />

          <StatCard
            label="Last poll"
            value={lastPoll.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
            detail="Every 3 seconds"
          />

          <StatCard
            label="Open tickets"
            value={activeTickets.length}
            detail="All active columns"
          />
        </section>

        {lastError && (
          <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
            {lastError}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Today&apos;s Count</h2>
            <button
              type="button"
              onClick={() => setShowTodayCount((current) => !current)}
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-100"
            >
              {showTodayCount ? "Hide" : "Show"}
            </button>
          </div>

          {showTodayCount && <DailyDrinkCount drinkCounts={drinkCounts} />}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowStats((current) => !current)}
            className="rounded-2xl bg-neutral-950 text-white px-4 py-3 font-black transition hover:bg-black"
          >
            {showStats ? "Hide Stats" : "View Stats"}
          </button>
        </div>

        {showStats && <DrinkStats reports={drinkReports} />}

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {STATUS_COLUMNS.map((column) => (
            <section
              key={column.key}
              className={`rounded-2xl bg-white/70 border border-neutral-200 border-t-4 ${column.accent} p-3 shadow-sm xl:h-[calc(100vh-330px)] xl:min-h-[360px] flex flex-col`}
            >
              <div className="flex items-center justify-between px-1 py-1.5 mb-2 shrink-0">
                <h2 className="text-xl font-black">
                  {column.label}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-black ${column.badge}`}
                >
                  {grouped[column.key]?.length || 0}
                </span>
              </div>

              <div className="space-y-3 xl:overflow-y-auto xl:pr-1">
                {grouped[column.key]?.length ? (
                  grouped[column.key].map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                      onNameChange={handleNameChange}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-8 text-center text-neutral-500 font-semibold">
                    No tickets
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>

        <CompletedTransactions tickets={completedTickets} />
      </main>
    </div>
  );
}
