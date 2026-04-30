import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || ""
  : "";
const LOGO_URL = "/goldies-logo.png";
const LOGO_DARK_URL = "/goldies-logo-white.png";
const OWNER_LOGO_URL = "/goldies-logo-owner.png";
const POLL_INTERVAL_MS = 3000;
const THEME_STORAGE_KEY = "goldies-kds-theme";
const TRAINING_MODE_STORAGE_KEY = "goldies-kds-training-mode";
const APP_VERSION = "v1.7.3";
const RELEASE_NOTES_HIDE_KEY = "goldies-kds-hidden-release-notes-version";
const CELEBRATION_HIDE_KEY = "goldies-kds-hidden-celebration";
const OWNER_REPORTS_NOTICE_HIDE_KEY = "goldies-kds-hidden-owner-reports-notice-v1";
const WEB_SERVICES_REMINDER_HIDE_KEY =
  "goldies-kds-hidden-web-services-reminder";
const SUPPORT_EMAIL = "samantha@studiosamantha.com";
const SOFT_OPENING_DATE = "2026-04-29";
const WEB_SERVICES_REMINDER_DATE = "2026-05-02";
const SETTINGS_HELP_TEXT =
  "Settings holds the app tools you may need: theme, password change, support, and release notes.";
const DINING_OPTIONS = ["For here", "To go", "Pickup", "Delivery", "Drive thru"];
const RELEASE_NOTES = [
  {
    version: "v1.7.3",
    date: "Current build",
    summary: "Added the POS-flexible marketing message.",
    items: [
      "The Learn More page now explains that DrinkFlow is built first for Square and designed to grow with Shopify, Clover, Lightspeed, and other POS workflows by request.",
      "The FAQ now clarifies that new POS connectors must be scoped around accessible order data, APIs, or webhooks.",
      "The marketing page keeps the promise honest while showing the product can grow beyond the first Square-connected shop.",
    ],
  },
  {
    version: "v1.7.2",
    date: "Previous build",
    summary: "Added the Goldie's living case study.",
    items: [
      "The Learn More page now links to a dedicated Goldie's Coffee & Goods case study.",
      "The case study documents opening-week feedback, version fixes, and future Supabase-backed proof points.",
      "Goldie's is now documented as the founding customer with lifetime free use of its current setup.",
    ],
  },
  {
    version: "v1.7.1",
    date: "Previous build",
    summary: "Sorted KDS tickets oldest first.",
    items: [
      "Each live KDS column now shows older tickets at the top and newer tickets at the bottom.",
      "This keeps the next order to start more obvious during a rush.",
      "The Learn More page now leads with the product visual and speaks to coffee shops, food trucks, and small drink counters.",
    ],
  },
  {
    version: "v1.7.0",
    date: "Previous build",
    summary: "Added owner history and coffee-shop analytics.",
    items: [
      "Owner Reports can save monthly snapshots to Supabase for long-term history.",
      "The owner portal now includes hourly drink volume, daily rotating coffee-shop guidance, and CSV download support.",
      "Owner Reports now shows how many drink orders included 2 or more drinks.",
      "Retail items like bagged coffee, soap, shower steamers, and packaged goods stay out of drink counts.",
      "The Learn More page now pitches the app specifically for coffee shops, smoothie shops, cafes, and drink counters.",
    ],
  },
  {
    version: "v1.6.2",
    date: "Previous build",
    summary: "Made owner snapshots more fluid as stats grow.",
    items: [
      "Owner snapshot cards now adapt more deeply to volume, ticket value, units per order, and category concentration.",
      "The insight cards change as more orders come in so owners get a more useful business read over time.",
    ],
  },
  {
    version: "v1.6.1",
    date: "Previous build",
    summary: "Customized owner snapshots by report range.",
    items: [
      "Owner Reports now changes the snapshot question and guidance for Today, Yesterday, 7 Days, 30 Days, This Month, and This Year.",
      "Each report range now gets a more specific owner read instead of one generic analysis style.",
    ],
  },
  {
    version: "v1.6.0",
    date: "Previous build",
    summary: "Added owner daily snapshot analysis.",
    items: [
      "Owner Reports now includes a Daily Owner Snapshot that explains what happened in plain English.",
      "The snapshot changes with the selected report range and highlights volume, revenue, average order value, and category mix.",
    ],
  },
  {
    version: "v1.5.9",
    date: "Previous build",
    summary: "Added a ticket service dropdown.",
    items: [
      "Ticket cards now let staff set For here, To go, Pickup, Delivery, or Drive thru directly.",
      "Service labels can also be inferred from Square item notes like to go or for here.",
    ],
  },
  {
    version: "v1.5.8",
    date: "Previous build",
    summary: "Kept food-only tickets out of the drink KDS columns.",
    items: [
      "The live New, Making, Ready, and Completed columns now only show tickets with drink items.",
      "Food-only Square orders no longer sit in the active drink workflow.",
    ],
  },
  {
    version: "v1.5.7",
    date: "Previous build",
    summary: "Made for-here/to-go labels visible on live tickets.",
    items: [
      "Ticket cards now show the Square dining/service label by default.",
      "If Square does not send a dining option, the ticket prompts staff to ask whether it is for here or to go.",
    ],
  },
  {
    version: "v1.5.6",
    date: "Previous build",
    summary: "Added this-year owner revenue reporting.",
    items: [
      "Drink Revenue now includes Today, Yesterday, 7 Days, 30 Days, This Month, and This Year.",
    ],
  },
  {
    version: "v1.5.5",
    date: "Previous build",
    summary: "Added owner password reset email support.",
    items: [
      "Owner Login now includes an email link for password reset requests.",
      "The owner password change dialog also links directly to Samantha for reset help.",
    ],
  },
  {
    version: "v1.5.4",
    date: "Previous build",
    summary: "Added owner password changes inside Owner Reports.",
    items: [
      "Owner Reports now has a Change Owner Password button.",
      "Changed owner passwords are stored securely as salted hashes.",
      "The generic owner password can be reset later if Blake or Claire forget it.",
    ],
  },
  {
    version: "v1.5.3",
    date: "Previous build",
    summary: "Added footer policy and ownership details.",
    items: [
      "The footer now links to privacy, data-use, and ownership information.",
      "The policy explains Goldie's internal dashboard data use and case-study permission rules.",
      "The footer now includes proprietary code and trademark notices.",
    ],
  },
  {
    version: "v1.5.2",
    date: "Previous build",
    summary: "Added tax breakdowns to Owner Reports.",
    items: [
      "Owner Reports now separate actual drink revenue from taxes collected.",
      "Category cards show revenue, tax, total collected, and units sold.",
      "Owner Login now has a Show/Hide password toggle.",
    ],
  },
  {
    version: "v1.5.1",
    date: "Previous build",
    summary: "Tightened Owner Login security.",
    items: [
      "Owner reports now require the owner password every time they are opened.",
      "Leaving owner reports clears the owner session.",
    ],
  },
  {
    version: "v1.5.0",
    date: "Previous build",
    summary: "Added Owner Login for private drink revenue reports.",
    items: [
      "Owner Login opens a separate financial dashboard.",
      "Owner reports show Coffee, Not Coffee, and Smoothies revenue from Square order data.",
    ],
  },
  {
    version: "v1.4.0",
    date: "Previous build",
    summary: "Added average drink making time.",
    items: [
      "The top dashboard now shows Avg Drink Time for completed drink tickets.",
      "The backend records KDS status taps to measure making-to-completed time.",
    ],
  },
  {
    version: "v1.3.7",
    date: "Previous build",
    summary: "Updated pitch page trademark wording.",
    items: [
      "Supabase now uses the same registered trademark treatment as Square on the pitch page.",
    ],
  },
  {
    version: "v1.3.6",
    date: "Previous build",
    summary: "Separated training dark mode from live dark mode.",
    items: [
      "Training dark mode now uses a warm Goldie/oat/espresso palette instead of live green.",
      "Training remains clearly dark and high-contrast without looking like production mode.",
    ],
  },
  {
    version: "v1.3.5",
    date: "Previous build",
    summary: "Matched the dark theme logo to Goldie's white brand mark.",
    items: [
      "Dark mode now uses Goldie's white logo from the brand assets.",
      "Dark-mode watermark branding now uses the white logo for better contrast.",
    ],
  },
  {
    version: "v1.3.4",
    date: "Previous build",
    summary: "Made dark mode a true high-contrast theme.",
    items: [
      "Live dark mode now uses dark panels with light text.",
      "Training dark mode now also uses dark panels while keeping its practice palette.",
    ],
  },
  {
    version: "v1.3.3",
    date: "Previous build",
    summary: "Polished the KDS visual controls.",
    items: [
      "Dark mode now uses Goldie's jewel green and gold instead of slate blue.",
      "The dining label toggle moved into Settings to keep the board cleaner.",
    ],
  },
  {
    version: "v1.3.2",
    date: "Previous build",
    summary: "Cleaned up dining labels and service trademark text.",
    items: [
      "Orders By Day now shows Square dining and fulfillment labels instead of the generic Order fallback.",
      "Dining labels can be toggled on or off in the live ticket columns.",
      "Footer trademark text now includes both Square and Supabase.",
    ],
  },
  {
    version: "v1.3.1",
    date: "Previous build",
    summary: "Stabilized Orders By Day while live polling is running.",
    items: [
      "Orders By Day no longer re-runs the lookup on every live board poll.",
      "The lookup panel stays under user control while the KDS keeps refreshing.",
    ],
  },
  {
    version: "v1.3.0",
    date: "Previous build",
    summary: "Soft opening fixes for login, counts, and order lookup.",
    items: [
      "The login screen no longer opens to a blank white page.",
      "The install app notice was removed from the login screen.",
      "Today's Count and Drink Stats now reset by the Goldie's Central-time day.",
      "Completed Today now clears after midnight when no new orders have been placed.",
      "Orders By Day lookup no longer flickers closed when searching.",
    ],
  },
  {
    version: "v1.2.7",
    date: "Previous build",
    summary: "Training mode now uses a much more obvious practice-only color scheme.",
    items: [
      "Training mode now reads clearly different from the live board.",
      "Light and dark training views each have their own practice palette.",
    ],
  },
  {
    version: "v1.1.20",
    date: "Current build",
    summary: "The footer Learn more link now opens the product page cleanly.",
    items: [
      "The footer link was lifted above the card so it clicks reliably.",
      "The product page still stays clean and easy to open.",
    ],
  },
  {
    version: "v1.1.8",
    date: "Current build",
    summary: "Settings now shows a help icon everywhere it appears.",
    items: [
      "The Settings menu now has a question-mark help button on login and the dashboard.",
      "The help popup explains what Settings contains.",
    ],
  },
  {
    version: "v1.1.7",
    date: "Current build",
    summary: "The login name field now has shorter wording.",
    items: [
      "The login hint now just says Enter your name.",
      "The login screen reads a little cleaner.",
    ],
  },
  {
    version: "v1.1.6",
    date: "Current build",
    summary: "The password screen was made simpler.",
    items: [
      "The password change screen no longer mentions Supabase.",
      "The password rule is now shorter and easier to read.",
    ],
  },
  {
    version: "v1.1.5",
    date: "Current build",
    summary: "The Settings popup now stays centered on narrow browser windows.",
    items: [
      "The Settings menu no longer drifts off the left edge when the browser is minimized.",
      "This makes the menu easier to use on narrow screens.",
    ],
  },
  {
    version: "v1.1.4",
    date: "Current build",
    summary: "The training demo name was corrected to Claire.",
    items: [
      "The practice environment now shows Claire instead of Clair.",
      "This only affects the fake training data.",
    ],
  },
  {
    version: "v1.1.3",
    date: "Current build",
    summary: "The soft opening popup now has a small confetti animation.",
    items: [
      "The celebration popup now feels more festive when it appears.",
      "The confetti stays subtle so it does not get in the way of the login screen.",
    ],
  },
  {
    version: "v1.1.2",
    date: "Current build",
    summary: "The utility actions were grouped into Settings to keep the screen cleaner.",
    items: [
      "Theme, Suggest Fix, Change Password, and What's New now live inside Settings.",
      "The dashboard header is cleaner and easier to scan.",
    ],
  },
  {
    version: "v1.1.1",
    date: "Current build",
    summary: "The help icon now opens an explanation when you tap it.",
    items: [
      "The question-mark button now opens a popup instead of only showing a hover hint.",
      "This works better on tablets and phones.",
    ],
  },
  {
    version: "v1.1.0",
    date: "Current build",
    summary: "Training mode now lives in the Mode card on the dashboard.",
    items: [
      "The Mode card now switches between Live and Training.",
      "Training mode is easier to find and clearly marked as practice data.",
    ],
  },
  {
    version: "v1.0.9",
    date: "Current build",
    summary: "Training mode can now switch the dashboard to fake practice data.",
    items: [
      "A training toggle was added so staff can practice without touching live Square data.",
      "A hover hint explains what the training switch does.",
    ],
  },
  {
    version: "v1.0.8",
    date: "Current build",
    summary: "The helper text under the count panels was cleaned up.",
    items: [
      "The extra note under Today's Count was removed.",
      "The extra note under Completed Today was removed.",
    ],
  },
  {
    version: "v1.0.7",
    date: "Current build",
    summary: "The soft opening message is now more festive on the login screen.",
    items: [
      "The soft opening popup now feels more celebratory.",
      "It still only appears on the planned day.",
    ],
  },
  {
    version: "v1.0.6",
    date: "Current build",
    summary: "A one-day soft opening message now appears on the login screen.",
    items: [
      "Tomorrow's login screen will show a congratulatory message for the soft opening.",
      "The message can be closed after it is seen.",
    ],
  },
  {
    version: "v1.0.5",
    date: "Current build",
    summary: "You can now show or hide the login password while typing.",
    items: [
      "The login password field has a Show / Hide toggle.",
      "This makes it easier to check the password before signing in.",
    ],
  },
  {
    version: "v1.0.4",
    date: "Current build",
    summary: "You can now dismiss the What's New popup with a button.",
    items: [
      "A Don't show again button was added to the release notes popup.",
      "The popup can be closed without getting in the way of the dashboard.",
    ],
  },
  {
    version: "v1.0.3",
    date: "Current build",
    summary: "The What's New page now opens from both login and the dashboard.",
    items: [
      "The version link now works from the login screen and the dashboard.",
      "Staff can check recent fixes without leaving the app.",
    ],
  },
  {
    version: "v1.0.2",
    date: "Current build",
    summary: "Login help now points staff to customer service after repeated wrong passwords.",
    items: [
      "After a few wrong password attempts, the login screen points staff to Suggest Fix.",
      "This makes it easier for the shop to get help without texting or calling.",
    ],
  },
  {
    version: "v1.0.1",
    date: "Current build",
    summary: "Fixes and small improvements for daily use.",
    items: [
      "Today's Count now shows orders and drinks separately.",
      "Completed Today now shows the full ticket details when you click an order number.",
      "The dashboard keeps the main ticket columns front and center.",
      "Login, password changes, and the Suggest Fix button stay easy to find for customer service.",
    ],
  },
];

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function buildSupportMailto() {
  const subject = encodeURIComponent("Goldie's KDS support request");
  const body = encodeURIComponent(
    [
      "Hi Samantha,",
      "",
      "I need help with the Goldie's KDS.",
      "",
      "What I was doing:",
      "",
      "What happened:",
      "",
      "Device/browser:",
      "",
      "Thanks,",
      "",
    ].join("\n")
  );

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function buildOwnerPasswordResetMailto(ownerName = "Owner") {
  const subject = encodeURIComponent("Goldie's KDS owner password reset");
  const body = encodeURIComponent(
    [
      "Hi Samantha,",
      "",
      "Please reset the Goldie's KDS Owner Login password.",
      "",
      `Requested by: ${ownerName || "Owner"}`,
      "",
      "I am sending this from an approved Blake or Claire email address.",
      "",
      "Thanks,",
      "",
    ].join("\n")
  );

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function getTodayDateKey() {
  return getLocalDateInputValue();
}

function getNthWeekdayDateKey(year, monthIndex, weekday, occurrence) {
  const date = new Date(year, monthIndex, 1);
  const offset = (weekday - date.getDay() + 7) % 7;
  date.setDate(1 + offset + (occurrence - 1) * 7);
  return getLocalDateInputValue(date);
}

function getScheduledCelebration(dateKey = getTodayDateKey()) {
  const year = Number(dateKey.slice(0, 4));
  const recurring = [
    {
      id: "national-coffee-day",
      date: `${year}-09-29`,
      eyebrow: "National Coffee Day",
      title: "Big coffee energy today",
      message:
        "Happy National Coffee Day, Goldie's. May the espresso pull smooth, the line move fast, and the regulars feel extra loved.",
      note:
        "Owner tip: this is a great day to watch hourly rushes and see which drink lane deserves a seasonal push.",
    },
    {
      id: "mothers-day",
      date: getNthWeekdayDateKey(year, 4, 0, 2),
      eyebrow: "Mother's Day",
      title: "A little extra love for Claire",
      message:
        "Happy Mother's Day, Claire. Hope today brings sweet customers, smooth service, and a moment to feel celebrated too.",
      note:
        "If the shop is open, watch gift drink orders and slower afternoon windows for a good reset moment.",
    },
    {
      id: "fathers-day",
      date: getNthWeekdayDateKey(year, 5, 0, 3),
      eyebrow: "Father's Day",
      title: "A little extra love for Blake",
      message:
        "Happy Father's Day, Blake. Hope the day is steady, kind, and full of good coffee.",
      note:
        "If service picks up, the hourly chart can help spot whether the Father's Day rush lands early or late.",
    },
    {
      id: "new-year",
      date: `${year}-01-01`,
      eyebrow: "New Year",
      title: "Fresh year, fresh tickets",
      message:
        "Happy New Year, Goldie's. Here's to steady mornings, loyal regulars, and a shop rhythm that keeps getting stronger.",
      note:
        "Owner tip: use this year-to-date view as the baseline for bigger menu and staffing decisions.",
    },
  ];
  const oneTime = [
    {
      id: "soft-opening",
      date: SOFT_OPENING_DATE,
      eyebrow: "Soft Opening",
      title: "Congratulations, Goldie's",
      message:
        "Wishing you all the luck on your soft opening from Samantha and Zahra.",
      note: "We'll be by for coffee tomorrow morning to show support.",
    },
  ];

  return [...oneTime, ...recurring].find((item) => item.date === dateKey) || null;
}

function CelebrationDialog({ open, onClose, celebration }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const colors = ["#CA862B", "#0F4036", "#EEE0C5", "#FFFFFF"];
        const left = 4 + ((index * 13) % 92);
        const size = 6 + (index % 4) * 2;
        return {
          id: index,
          left: `${left}%`,
          top: `${8 + (index % 5) * 9}%`,
          size,
          color: colors[index % colors.length],
          rotate: (index * 31) % 360,
          delay: `${(index % 6) * 0.18}s`,
          duration: `${2.8 + (index % 4) * 0.35}s`,
          drift: index % 2 === 0 ? -1 : 1,
        };
      }),
    []
  );

  if (!open || !celebration) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -12px, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 280px, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="relative w-full max-w-lg rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="absolute rounded-sm"
              aria-hidden="true"
              style={{
                left: piece.left,
                top: piece.top,
                width: `${piece.size}px`,
                height: `${Math.max(6, Math.round(piece.size * 0.8))}px`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate}deg)`,
                opacity: 0,
                animation: `confetti-fall ${piece.duration} linear ${piece.delay} infinite`,
                ["--drift"]: `${piece.drift * (18 + (piece.id % 4) * 6)}px`,
              }}
            />
          ))}
        </div>

        <div className="border-b border-[#CA862B]/18 px-5 py-4 bg-[#EEE0C5]/35">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
                {celebration.eyebrow}
              </div>
              <h2 className="text-2xl font-black text-[#0F4036] mt-1">
                {celebration.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#CA862B]" />
              <span className="h-3 w-3 rounded-full bg-[#0F4036]" />
              <span className="h-3 w-3 rounded-full bg-[#EEE0C5] border border-[#CA862B]/30" />
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4 text-[#2D261C]">
          <div className="rounded-2xl border border-[#CA862B]/18 bg-[#EEE0C5]/45 px-4 py-3">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
              Today&apos;s message
            </div>
            <p className="mt-2 text-base leading-7">
              {celebration.message}
            </p>
          </div>

          <p className="text-base leading-7">
            {celebration.note}
          </p>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0F4036] text-white px-4 py-2.5 font-black transition hover:bg-[#0b352d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebServicesReminderDialog({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <style>{`
        @keyframes soft-pop {
          0% { transform: translateY(10px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] overflow-hidden animate-[soft-pop_220ms_ease-out]">
        <div className="border-b border-[#CA862B]/18 px-5 py-4 bg-[#EEE0C5]/35">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Studio Samantha
          </div>
          <h2 className="text-2xl font-black text-[#0F4036] mt-1">
            A quick note for Goldie&apos;s
          </h2>
        </div>

        <div className="px-5 py-5 space-y-5 text-[#2D261C]">
          <p className="text-base leading-7">
            Keep me in mind if you guys ever decide you need a website or any
            design services - Sammy.
          </p>

          <div className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Website services
            </div>
            <p className="mt-2 text-sm leading-6 text-[#2D261C]">
              Custom websites, branded ordering pages, launch pages, logo
              support, and small design updates for Square shops that want a
              polished online presence.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0F4036] text-white px-4 py-2.5 font-black transition hover:bg-[#0b352d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OwnerReportsNoticeDialog({ open, onClose, onOpenOwnerLogin }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="border-b border-[#CA862B]/18 bg-[#EEE0C5]/35 px-5 py-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Owner Portal Update
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
            Downloadable reports are live
          </h2>
        </div>

        <div className="space-y-4 px-5 py-5 text-[#2D261C]">
          <p className="text-base leading-7">
            Owner Reports can now download the selected view as CSV, Excel, or a branded PDF.
          </p>
          <div className="rounded-2xl border border-[#CA862B]/18 bg-white px-4 py-3">
            <div className="text-sm font-black text-[#0F4036]">
              Find it in Settings
            </div>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
              Open Settings, choose Owner Login, then use Download Report in the owner portal.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={onOpenOwnerLogin}
              className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d]"
            >
              Open Owner Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleaseNotesDialog({ open, onClose, onHideForNow }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#CA862B]/18 px-5 py-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Release Notes
            </div>
            <h2 className="text-2xl font-black text-[#0F4036]">What&apos;s changed</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onHideForNow}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Don&apos;t show again
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          {RELEASE_NOTES.map((release) => (
            <section
              key={release.version}
              className="rounded-2xl border border-[#CA862B]/16 bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-lg font-black text-[#111111]">{release.version}</div>
                  <div className="text-sm font-semibold text-[#6A614F]">{release.date}</div>
                  <div className="mt-1 text-sm text-[#4E4637]">{release.summary}</div>
                </div>
              </div>

              <ul className="mt-3 space-y-2 text-sm text-[#2D261C]">
                {release.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#CA862B] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpDialog({ open, title, body, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="border-b border-[#CA862B]/18 px-5 py-4 bg-[#EEE0C5]/35">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Help
          </div>
          <h2 className="text-2xl font-black text-[#0F4036] mt-1">{title}</h2>
        </div>

        <div className="px-5 py-5 space-y-4 text-[#2D261C]">
          <p className="text-base leading-7">{body}</p>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0F4036] text-white px-4 py-2.5 font-black transition hover:bg-[#0b352d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PitchPage({ open, onBack }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.98),_rgba(238,224,197,1)_55%,_rgba(230,210,173,1)_100%)] text-[#111111]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0) 28%, rgba(15,64,54,0.03) 100%)",
        }}
      />
      <WatermarkLayer trainingMode={false} darkMode={false} />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <a
            href="https://www.studiosamantha.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#CA862B]/14 bg-[rgba(255,253,248,0.88)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#5A4F3E] shadow-sm backdrop-blur-md transition hover:bg-white/90 hover:text-[#0F4036]"
            aria-label="Visit Studio Samantha website"
          >
            Studio Samantha
          </a>

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#CA862B]/14 bg-[rgba(255,253,248,0.88)] px-4 py-2 text-sm font-black text-[#0F4036] shadow-sm transition hover:bg-white/90"
          >
            Back to app
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.75rem] border border-white/70 bg-[rgba(255,253,248,0.92)] p-6 shadow-[0_28px_80px_rgba(15,64,54,0.14)] backdrop-blur-xl">
            <h1 className="mt-6 text-4xl font-black tracking-tight text-[#0F4036]">
              Studio Samantha
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-[#2D261C]">
              Custom Square® tools for coffee shops, smoothie shops, and drink
              counters that need a polished display, simple staff workflows,
              and useful owner reporting.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Live board",
                  text: "New, Making, Ready, Completed, and Done stay visible during the rush.",
                },
                {
                  title: "Drink counts",
                  text: "Coffee, not coffee, smoothies, completed totals, and daily counts stay easy to compare.",
                },
                {
                  title: "Staff tools",
                  text: "Password controls, training mode, and support links stay built in.",
                },
                {
                  title: "Owner insights",
                  text: "Revenue, category mix, average ticket value, and hourly volume help owners spot rushes.",
                },
                {
                  title: "Brand ready",
                  text: "Colors, logo, and footer branding can match each shop.",
                },
                {
                  title: "Mobile friendly",
                  text: "The dashboard and login stay usable on phones and tablets too.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="text-sm font-black text-[#0F4036]">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-[#4E4637]">
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-[rgba(255,253,248,0.92)] p-5 shadow-[0_28px_80px_rgba(15,64,54,0.12)] backdrop-blur-xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
                Example dashboard
              </div>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["New", "12"],
                    ["Making", "5"],
                    ["Ready", "3"],
                    ["Completed", "8"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6A614F]">
                        {label}
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#0F4036]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
                        New ticket
                      </div>
                      <div className="mt-1 text-lg font-black text-[#111111]">
                        #R90W
                      </div>
                    </div>
                    <div className="rounded-full bg-[#EEE0C5]/55 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#0F4036]">
                      8:12 AM
                    </div>
                  </div>

                  <div className="mt-3 text-sm font-semibold text-[#4E4637]">
                    Sammy
                  </div>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-[#2D261C]">
                    <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                      1 Americano
                    </div>
                    <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                      1 Iced Latte
                    </div>
                    <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                      1 Blueberry Muffin
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-[rgba(255,253,248,0.92)] p-5 shadow-[0_28px_80px_rgba(15,64,54,0.12)] backdrop-blur-xl">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
                What it can do
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#2D261C]">
                <li>Live Square® orders in a simple drink board</li>
                <li>Customer names and employee tracking when available</li>
                <li>Drink revenue, hourly volume, history, and daily order lookup</li>
                <li>Training mode for practice without live data</li>
                <li>Support link, password controls, and release notes</li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-[#0F4036] p-5 text-white shadow-[0_28px_80px_rgba(15,64,54,0.2)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                Ready to talk?
              </div>
              <p className="mt-3 text-sm leading-6 text-white/90">
                Email me about setup, customization, or a copy for another
                coffee or drink shop.
              </p>
              <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/95">
                samantha@studiosamantha.com
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function getSavedThemeMode() {
  if (typeof window === "undefined") return "light";

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || "light";
  } catch {
    return "light";
  }
}

function getSavedTrainingMode() {
  if (typeof window === "undefined") return false;
  if (isDemoTrainingRoute()) return true;

  try {
    return window.localStorage.getItem(TRAINING_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function isDemoTrainingRoute() {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "training" || window.location.hash === "#demo";
  } catch {
    return false;
  }
}

function getLocalDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start: start.getTime(), end: end.getTime() };
}

function getRangeBounds(rangeKey) {
  const today = new Date();
  const todayBounds = getLocalDayBounds(today);
  const todayStart = new Date(todayBounds.start);
  const end = todayBounds.end;

  if (rangeKey === "today") {
    return todayBounds;
  }

  if (rangeKey === "yesterday") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 1);
    const next = new Date(start);
    next.setDate(next.getDate() + 1);
    return { start: start.getTime(), end: next.getTime() };
  }

  if (rangeKey === "last7" || rangeKey === "last30") {
    const days = rangeKey === "last7" ? 7 : 30;
    const start = new Date(todayStart);
    start.setDate(start.getDate() - (days - 1));
    return { start: start.getTime(), end };
  }

  if (rangeKey === "thisMonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: start.getTime(), end };
  }

  if (rangeKey === "thisYear") {
    const start = new Date(today.getFullYear(), 0, 1);
    return { start: start.getTime(), end };
  }

  return todayBounds;
}

function isSameLocalDay(timestamp, dateValue) {
  if (!timestamp || !dateValue) return false;

  const left = new Date(timestamp);
  const right = new Date(`${dateValue}T00:00:00`);

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function countBeverageOrdersForDay(tickets, dateValue) {
  return tickets.filter(
    (ticket) =>
      isSameLocalDay(ticket.createdAt, dateValue) && hasDrinkItems(ticket)
  ).length;
}

function buildDrinkReportFromTickets(tickets, rangeKey) {
  const { start, end } = getRangeBounds(rangeKey);
  const names = {};
  const categories = {};
  let orderCount = 0;

  tickets
    .filter((ticket) => ticket.createdAt >= start && ticket.createdAt < end)
    .forEach((ticket) => {
      const drinkItems = ticket.items.filter((item) => isDrinkItem(item.name));
      if (!drinkItems.length) return;

      orderCount += 1;

      drinkItems.forEach((item) => {
        const qty = Number(item.qty || 1);
        const category = getBeverageCategory(item.name);

        names[item.name] = (names[item.name] || 0) + qty;
        if (category) {
          categories[category] = (categories[category] || 0) + qty;
        }
      });
    });

  return {
    orderCount,
    totalsByName: Object.entries(names)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name)),
    totalsByCategory: categories,
  };
}

function buildDemoOwnerReport(tickets, rangeKey) {
  const { start, end } = getRangeBounds(rangeKey);
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
  const unitPrices = {
    Coffee: 575,
    "Not Coffee": 625,
    Smoothies: 700,
  };
  let orderCount = 0;
  let multiDrinkOrderCount = 0;

  tickets
    .filter((ticket) => ticket.createdAt >= start && ticket.createdAt < end)
    .forEach((ticket) => {
      const drinkItems = (ticket.items || []).filter((item) =>
        isDrinkItem(item.name)
      );
      if (!drinkItems.length) return;

      orderCount += 1;
      let orderUnits = 0;
      let orderRevenueCents = 0;

      drinkItems.forEach((item) => {
        const category = getBeverageCategory(item.name);
        if (!category || !categories[category]) return;

        const qty = Number(item.qty || 1);
        const revenueCents = qty * (unitPrices[category] || 600);
        const taxCents = Math.round(revenueCents * 0.0825);

        categories[category].units += qty;
        categories[category].revenueCents += revenueCents;
        categories[category].taxCents += taxCents;
        categories[category].totalCents += revenueCents + taxCents;
        orderUnits += qty;
        orderRevenueCents += revenueCents;
      });

      if (orderUnits >= 2) multiDrinkOrderCount += 1;

      const hour = new Date(ticket.createdAt).getHours();
      hourly[hour].orderCount += 1;
      hourly[hour].units += orderUnits;
      hourly[hour].revenueCents += orderRevenueCents;
    });

  const hourlyOrders = hourly.map((bucket) => ({
    ...bucket,
    revenue: formatCurrencyCents(bucket.revenueCents),
  }));
  const totalsByCategory = Object.values(categories).map((item) => ({
    ...item,
    revenue: formatCurrencyCents(item.revenueCents),
    tax: formatCurrencyCents(item.taxCents),
    total: formatCurrencyCents(item.totalCents),
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
  const multiDrinkOrderRate = orderCount
    ? Math.round((multiDrinkOrderCount / orderCount) * 100)
    : 0;

  return {
    startAt: new Date(start).toISOString(),
    endAt: new Date(end).toISOString(),
    orderCount,
    multiDrinkOrderCount,
    multiDrinkOrderRate,
    totalUnits,
    totalRevenueCents,
    totalRevenue: formatCurrencyCents(totalRevenueCents),
    totalTaxCents,
    totalTax: formatCurrencyCents(totalTaxCents),
    totalCollectedCents,
    totalCollected: formatCurrencyCents(totalCollectedCents),
    averageDrinkOrderValueCents: orderCount
      ? Math.round(totalCollectedCents / orderCount)
      : 0,
    averageDrinkOrderValue: formatCurrencyCents(
      orderCount ? Math.round(totalCollectedCents / orderCount) : 0
    ),
    totalsByCategory,
    hourlyOrders,
  };
}

function buildTrainingReports(tickets) {
  return REPORT_RANGES.reduce((acc, range) => {
    acc[range.key] = buildDrinkReportFromTickets(tickets, range.key);
    return acc;
  }, {});
}

function getTrainingLookupResults(tickets, dateValue) {
  return tickets
    .filter((ticket) => isSameLocalDay(ticket.createdAt, dateValue))
    .sort((a, b) => a.createdAt - b.createdAt);
}

const STATUS_COLUMNS = [
  {
    key: "new",
    label: "New",
    accent: "border-t-[#0F4036]",
    badge: "bg-[#0F4036]/10 text-[#0F4036]",
  },
  {
    key: "making",
    label: "Making",
    accent: "border-t-[#CA862B]",
    badge: "bg-[#CA862B]/15 text-[#8B5A1D]",
  },
  {
    key: "ready",
    label: "Ready",
    accent: "border-t-[#2C5F52]",
    badge: "bg-[#2C5F52]/12 text-[#2C5F52]",
  },
  {
    key: "completed",
    label: "Completed",
    accent: "border-t-[#111111]",
    badge: "bg-[#EEE0C5] text-[#111111]",
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

function formatCurrencyCents(cents = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents || 0) / 100);
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalMonthInputValue(date = new Date()) {
  return getLocalDateInputValue(date).slice(0, 7);
}

function matchesAnyPattern(value, patterns = []) {
  const text = String(value || "").toLowerCase();
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeDrinkText(name = "") {
  return String(name || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isNonDrinkItem(itemName = "") {
  const lower = normalizeDrinkText(itemName);

  return matchesAnyPattern(lower, [
    /\bsanctuary\b/i,
    /\bbamboo\b/i,
    /\bsoap\b/i,
    /\bshower steamer\b/i,
    /\bbestseller\b/i,
    /\bbagged coffee\b/i,
    /\bcoffee beans\b/i,
    /\bwhole bean\b/i,
    /\bground coffee\b/i,
    /\bbeans\b/i,
    /\bretail\b/i,
  ]);
}

function getBeverageCategory(itemName = "") {
  const name = String(itemName || "").trim();
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");

  if (isNonDrinkItem(name)) return null;

  if (
    [
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
      "Drip Refill",
    ].includes(name)
  ) {
    return "Coffee";
  }

  if (
    matchesAnyPattern(lower, [
      /\blatte\b/i,
      /\bcoffee\b/i,
      /\bespresso\b/i,
      /\bamericano\b/i,
      /\bcappuccino\b/i,
      /\bmocha\b/i,
      /\bmacchiato\b/i,
      /\bcold brew\b/i,
      /\bcoldbrew\b/i,
      /\bdrip\b/i,
      /\bpour over\b/i,
      /\bpourover\b/i,
      /\bgibraltar\b/i,
      /\bflat white\b/i,
      /\bcortado\b/i,
      /\bbreve\b/i,
    ]) || compact.includes("icedcoffee") || compact.includes("hotcoffee")
  ) {
    return "Coffee";
  }

  if (
    [
      "Chai Latte",
      "Hot Chocolate",
      "London Fog",
      "Matcha Latte",
      "Steamer",
      "Teas",
      "Refresher-Strawberry Mango",
    ].includes(name)
  ) {
    return "Not Coffee";
  }

  if (
    matchesAnyPattern(lower, [
      /\bmatcha\b/i,
      /\bchai\b/i,
      /\btea\b/i,
      /\bteas\b/i,
      /\bsteamer\b/i,
      /\brefresher\b/i,
      /\bhot chocolate\b/i,
      /\bfog\b/i,
      /\bboba\b/i,
    ])
  ) {
    return "Not Coffee";
  }

  if (
    [
      "Chocolate P/B Banana",
      "Greens",
      "Mango",
      "Strawberry",
      "Strawberry Banana",
    ].includes(name) ||
    /smoothie/i.test(lower) ||
    compact.includes("greens")
  ) {
    return "Smoothies";
  }

  return null;
}

function getTimeClass(createdAt) {
  const mins = getMinutesElapsed(createdAt);

  if (mins >= 10) return "text-[#8B5A1D] bg-[#CA862B]/10 border-[#CA862B]/22";
  if (mins >= 5) return "text-[#0F4036] bg-[#0F4036]/6 border-[#0F4036]/12";
  return "text-[#0F4036] bg-[#EEE0C5]/65 border-[#CA862B]/18";
}

function isDrinkItem(itemName = "") {
  return Boolean(getBeverageCategory(itemName));
}

function getDrinkItems(ticket) {
  return ticket.items.filter((item) => isDrinkItem(item.name));
}

function hasDrinkItems(ticket) {
  return getDrinkItems(ticket).length > 0;
}

function getVisibleItems(ticket) {
  return ticket.items;
}

function getPreviousStatus(status) {
  if (status === "making") return "new";
  if (status === "ready") return "making";
  if (status === "completed") return "ready";

  return null;
}

function formatDiningOption(ticket) {
  const itemNotes = (ticket.items || [])
    .map((item) => [item.note, ...(item.modifiers || [])].filter(Boolean).join(" "))
    .join(" ");
  const candidates = [
    ticket.diningOption,
    ticket.dining_option,
    ticket.fulfillmentType,
    ticket.fulfillment_type,
    ticket.fulfillment?.type,
    ticket.orderType,
    ticket.order_type,
    ticket.serviceChargeType,
    ticket.service_charge_type,
    ticket.fulfillment,
    itemNotes,
  ];
  const raw =
    candidates.find((candidate) => {
      const normalized = String(candidate || "").trim().toLowerCase();
      return normalized && normalized !== "unspecified" && normalized !== "order";
    }) || "";

  const value = String(raw).toLowerCase();

  if (value.includes("delivery")) return "Delivery";
  if (value.includes("shipment") || value.includes("shipping")) return "Delivery";
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

  return "Unspecified";
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
        if (!getBeverageCategory(item.name)) return;

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
    employeeName:
      ticket.employeeName ||
      ticket.employee_name ||
      ticket.takenBy ||
      ticket.taken_by ||
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

function getTrainingTimestamp(dayOffset, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function createTrainingTickets() {
  return [
    {
      id: "demo-1001",
      orderNumber: "T1001",
      customerName: "",
      employeeName: "Blake",
      createdAt: getTrainingTimestamp(0, 7, 58),
      completedAt: null,
      source: "Square Register",
      status: "new",
      diningOption: "To go",
      items: [
        { name: "Americano", qty: 1, modifiers: ["Oat milk"], note: "" },
        { name: "Butter Croissant", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-1002",
      orderNumber: "T1002",
      customerName: "Mia",
      employeeName: "Zahra",
      createdAt: getTrainingTimestamp(0, 8, 7),
      completedAt: null,
      source: "Square Register",
      status: "making",
      diningOption: "Pickup",
      items: [
        { name: "Latte", qty: 2, modifiers: ["Extra hot"], note: "" },
        { name: "Blueberry Muffin", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-1003",
      orderNumber: "T1003",
      customerName: "Sammy",
      employeeName: "Claire",
      createdAt: getTrainingTimestamp(0, 8, 15),
      completedAt: null,
      source: "Square Register",
      status: "ready",
      diningOption: "For here",
      items: [
        { name: "Matcha Latte", qty: 1, modifiers: ["Coconut milk"], note: "" },
        { name: "Bagel", qty: 1, modifiers: ["Toasted"], note: "" },
      ],
    },
    {
      id: "demo-1004",
      orderNumber: "T1004",
      customerName: "Jordan",
      employeeName: "Blake",
      createdAt: getTrainingTimestamp(0, 8, 29),
      completedAt: getTrainingTimestamp(0, 8, 42),
      source: "Square Register",
      status: "completed",
      diningOption: "Delivery",
      items: [
        { name: "Chai Latte", qty: 1, modifiers: ["Extra cinnamon"], note: "" },
        { name: "Refresher-Strawberry Mango", qty: 1, modifiers: [], note: "" },
        { name: "Scone", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-1005",
      orderNumber: "T1005",
      customerName: "",
      employeeName: "Zahra",
      createdAt: getTrainingTimestamp(0, 8, 39),
      completedAt: getTrainingTimestamp(0, 8, 51),
      source: "Square Register",
      status: "done",
      diningOption: "Drive thru",
      items: [
        { name: "Cold Brew", qty: 1, modifiers: [], note: "" },
        { name: "Chocolate P/B Banana", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-0998",
      orderNumber: "T0998",
      customerName: "Ashley",
      employeeName: "Claire",
      createdAt: getTrainingTimestamp(-1, 9, 4),
      completedAt: getTrainingTimestamp(-1, 9, 19),
      source: "Square Handheld",
      status: "done",
      diningOption: "Pickup",
      items: [
        { name: "Espresso", qty: 2, modifiers: [], note: "" },
        { name: "Drip Refill", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-0999",
      orderNumber: "T0999",
      customerName: "Nora",
      employeeName: "Blake",
      createdAt: getTrainingTimestamp(-1, 13, 11),
      completedAt: getTrainingTimestamp(-1, 13, 27),
      source: "Square Handheld",
      status: "done",
      diningOption: "To go",
      items: [
        { name: "Strawberry Banana", qty: 1, modifiers: [], note: "" },
        { name: "Teas", qty: 1, modifiers: [], note: "" },
      ],
    },
    {
      id: "demo-0995",
      orderNumber: "T0995",
      customerName: "Theo",
      employeeName: "Zahra",
      createdAt: getTrainingTimestamp(-3, 10, 22),
      completedAt: getTrainingTimestamp(-3, 10, 39),
      source: "Square Register",
      status: "done",
      diningOption: "For here",
      items: [
        { name: "Cappuccino", qty: 1, modifiers: ["Whole milk"], note: "" },
        { name: "Muffin", qty: 1, modifiers: [], note: "" },
      ],
    },
  ].map(normalizeTicket);
}

function TicketCard({
  ticket,
  onStatusChange,
  onNameChange,
  onDiningOptionChange,
  showDiningOption,
}) {
  const [nameValue, setNameValue] = useState(ticket.customerName || "");
  const orderTime = formatOrderTime(ticket.createdAt);
  const timeClass = getTimeClass(ticket.createdAt);
  const visibleItems = getVisibleItems(ticket);
  const ticketHasDrinks = hasDrinkItems(ticket);
  const previousStatus = getPreviousStatus(ticket.status);
  const hasSpecificDiningOption =
    ticket.diningOption &&
    !["Unspecified", "Order"].includes(ticket.diningOption);

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
        className: "bg-[#0F4036] text-white hover:bg-[#0b352d]",
      },
    ];
  } else if (ticket.status === "making") {
    actions = [
      {
        label: "Ready",
        status: "ready",
        className: "bg-[#CA862B] text-white hover:bg-[#b17420]",
      },
    ];
  } else if (ticket.status === "ready") {
    if (ticketHasDrinks) {
      actions = [
        {
          label: "Complete Drinks",
          status: "completed",
          className: "bg-[#111111] text-white hover:bg-black",
        },
      ];
    } else {
      actions = [
        {
          label: "Done",
          status: "done",
          className: "bg-[#111111] text-white hover:bg-black",
        },
      ];
    }
  } else if (ticket.status === "completed") {
    actions = [
      {
        label: "Done",
        status: "done",
        className: "bg-[#111111] text-white hover:bg-black",
      },
    ];
  }

  return (
    <article className="rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 p-3 shadow-[0_10px_24px_rgba(15,64,54,0.05)] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight leading-none text-[#0F4036]">
            #{ticket.orderNumber}
          </div>

          {ticket.customerName ? (
            <div className="mt-2 rounded-xl border border-[#0F4036]/14 bg-[#0F4036]/6 px-3 py-2">
              <div className="text-xs font-black uppercase tracking-wide text-[#0F4036]">
                Name from Square
              </div>
              <div className="mt-1 text-sm font-black text-[#111111]">
                {ticket.customerName}
              </div>
            </div>
          ) : (
            <label className="mt-2 block">
              <span className="text-xs font-black uppercase tracking-wide text-[#0F4036]/70">
                Name for callout
              </span>
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
                className="mt-1 w-full rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B] focus:ring-2 focus:ring-[#CA862B]/15"
              />
            </label>
          )}

          <div className="text-sm text-[#6A614F] mt-1">
            {ticket.source}
          </div>

          {ticket.employeeName && (
            <div className="mt-1 text-sm font-semibold text-[#111111]">
              Taken by {ticket.employeeName}
            </div>
          )}

          {showDiningOption && (
            <label className="mt-2 block">
              <span className="text-xs font-black uppercase tracking-wide text-[#0F4036]/70">
                Service
              </span>
              <select
                value={hasSpecificDiningOption ? ticket.diningOption : ""}
                onChange={(event) =>
                  onDiningOptionChange(ticket.id, event.target.value)
                }
                className="mt-1 w-full rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] outline-none focus:border-[#CA862B] focus:ring-2 focus:ring-[#CA862B]/15"
              >
                <option value="">Set service</option>
                {DINING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-sm font-black border ${timeClass}`}
        >
          {orderTime}
        </div>
      </div>

      <div className="space-y-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <div
              key={`${ticket.id}-${idx}`}
              className="border-t border-[#CA862B]/12 pt-2 first:border-t-0 first:pt-0"
            >
              <div className="flex gap-2 text-base font-bold leading-tight">
                <span className="text-[#6A614F]">{item.qty}×</span>
                <span className="text-[#111111]">{item.name}</span>
              </div>

              {item.modifiers.length > 0 && (
                <ul className="mt-1 ml-7 list-disc text-sm text-[#4E4637] space-y-0.5">
                  {item.modifiers.map((mod) => (
                    <li key={mod}>{mod}</li>
                  ))}
                </ul>
              )}

              {item.note && (
                <div className="mt-2 rounded-xl bg-[#CA862B]/10 border border-[#CA862B]/18 px-3 py-2 text-sm font-medium text-[#8B5A1D]">
                  Note: {item.note}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-4 text-sm text-[#6A614F]">
            No items to show.
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => onStatusChange(ticket.id, action.status)}
              className={`rounded-xl px-4 py-2.5 font-black transition shadow-sm ${action.className}`}
            >
              {action.label}
            </button>
          ))}

          {previousStatus && (
            <button
              onClick={() => onStatusChange(ticket.id, previousStatus)}
              className="rounded-xl px-4 py-2 font-black transition bg-white border border-[#CA862B]/24 text-[#0F4036] hover:bg-[#EEE0C5]/45"
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
    <div className="rounded-xl bg-[#FFFDF8] border border-[#CA862B]/18 p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-[#6A614F] font-bold">
        {label}
      </div>
      <div className="text-xl md:text-2xl font-black mt-1 text-[#111111]">
        {value}
      </div>
      <div className="text-sm text-[#6A614F] mt-1">
        {detail}
      </div>
    </div>
  );
}

function OwnerSnapshotCard({ report, range }) {
  const snapshot = buildOwnerSnapshotAnalysis(report, range);

  return (
    <section className="rounded-3xl border border-[#0F4036]/12 bg-[#0F4036] p-4 text-white shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#EEE0C5]">
            {snapshot.eyebrow}
          </div>
          <h2 className="mt-1 text-2xl font-black">
            {snapshot.question}
          </h2>
        </div>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#FFFDF8]">
          {getOwnerRangeLabel(range)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/12 bg-white/10 p-4">
        <div className="text-sm font-black uppercase tracking-[0.14em] text-[#EEE0C5]">
          {snapshot.tone}
        </div>
        <p className="mt-2 text-base font-semibold leading-relaxed text-[#FFFDF8]">
          {snapshot.summary}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.watch.map((item) => (
          <div
            key={item.title || item}
            className="rounded-2xl border border-white/12 bg-[#FFFDF8] px-4 py-3 text-sm font-bold leading-relaxed text-[#0F4036]"
          >
            {typeof item === "string" ? (
              item
            ) : (
              <>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
                  {item.title}
                </div>
                <div className="mt-1">{item.body}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatHourRange(hour) {
  const start = new Date(2024, 0, 1, hour);
  const end = new Date(2024, 0, 1, hour + 1);

  return `${start.toLocaleTimeString([], {
    hour: "numeric",
  })}-${end.toLocaleTimeString([], { hour: "numeric" })}`;
}

function getHourlyVolumeStats(hourlyOrders = []) {
  const active = hourlyOrders.filter((item) => Number(item.orderCount || 0) > 0);

  if (!active.length) {
    return {
      active: [],
      peak: null,
      slowest: null,
      maxOrders: 0,
    };
  }

  const sortedByOrders = active
    .slice()
    .sort((a, b) => Number(b.orderCount || 0) - Number(a.orderCount || 0));

  return {
    active,
    peak: sortedByOrders[0],
    slowest: sortedByOrders[sortedByOrders.length - 1],
    maxOrders: Number(sortedByOrders[0]?.orderCount || 0),
  };
}

function HourlyVolumeChart({ report, range }) {
  const hourlyOrders = report?.hourlyOrders || [];
  const stats = getHourlyVolumeStats(hourlyOrders);
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 24, right: 18, bottom: 44, left: 38 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxOrders = Math.max(stats.maxOrders, 1);
  const points = hourlyOrders.map((item, index) => {
    const x = padding.left + (plotWidth / 23) * index;
    const y =
      padding.top +
      plotHeight -
      (Number(item.orderCount || 0) / maxOrders) * plotHeight;

    return { ...item, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;
  const tickHours = [6, 8, 10, 12, 14, 16, 18];
  const rangeLabel = getOwnerRangeLabel(range);

  return (
    <section className="rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Hourly Volume
          </div>
          <h2 className="mt-1 text-xl font-black text-[#0F4036]">
            Drink Orders by Hour
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#6A614F]">
            {rangeLabel} drink orders from Supabase order history
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[280px]">
          <div className="rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] px-3 py-2">
            <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
              Busiest
            </div>
            <div className="font-black text-[#111111]">
              {stats.peak ? formatHourRange(stats.peak.hour) : "No data"}
            </div>
          </div>
          <div className="rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] px-3 py-2">
            <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
              Lowest
            </div>
            <div className="font-black text-[#111111]">
              {stats.slowest ? formatHourRange(stats.slowest.hour) : "No data"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`Hourly drink order chart for ${rangeLabel}`}
          className="h-[240px] min-w-[640px] w-full"
        >
          {[0, 0.5, 1].map((tick) => {
            const y = padding.top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={padding.left + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="#0F4036"
                  strokeOpacity="0.08"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#6A614F] text-[11px] font-bold"
                >
                  {Math.round(maxOrders * tick)}
                </text>
              </g>
            );
          })}

          {linePath && (
            <>
              <path d={areaPath} fill="#CA862B" opacity="0.12" />
              <path
                d={linePath}
                fill="none"
                stroke="#0F4036"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}

          {points.map((point) => {
            const isPeak = stats.peak?.hour === point.hour;
            return (
              <g key={point.hour}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isPeak ? 6 : 4}
                  fill={isPeak ? "#CA862B" : "#0F4036"}
                />
                <title>
                  {formatHourRange(point.hour)}: {point.orderCount} orders, {point.units} units
                </title>
              </g>
            );
          })}

          {tickHours.map((hour) => {
            const x = padding.left + (plotWidth / 23) * hour;
            return (
              <text
                key={hour}
                x={x}
                y={chartHeight - 14}
                textAnchor="middle"
                className="fill-[#6A614F] text-[11px] font-black"
              >
                {new Date(2024, 0, 1, hour).toLocaleTimeString([], {
                  hour: "numeric",
                })}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function getDailyAdviceIndex(seed, length) {
  if (!length) return 0;

  const text = String(seed || getTodayDateKey());
  const total = Array.from(text).reduce(
    (sum, char, index) => sum + char.charCodeAt(0) * (index + 1),
    0
  );

  return total % length;
}

function pickDailyAdvice(seed, options) {
  return options[getDailyAdviceIndex(seed, options.length)];
}

function buildCoffeeShopAdvice(report, range) {
  const hourlyStats = getHourlyVolumeStats(report?.hourlyOrders || []);
  const categories = report?.totalsByCategory || [];
  const topCategory = categories
    .slice()
    .sort((a, b) => Number(b.units || 0) - Number(a.units || 0))[0];
  const averageCents = Number(report?.averageDrinkOrderValueCents || 0);
  const orderCount = Number(report?.orderCount || 0);
  const multiDrinkCount = Number(report?.multiDrinkOrderCount || 0);
  const multiDrinkRate = Number(report?.multiDrinkOrderRate || 0);
  const rangeLabel = getOwnerRangeLabel(range);
  const adviceSeed = `${getTodayDateKey()}:${range}:${orderCount}:${topCategory?.category || "none"}`;
  const peakText = hourlyStats.peak
    ? `${formatHourRange(hourlyStats.peak.hour)} is the strongest hour with ${hourlyStats.peak.orderCount} drink orders.`
    : "No hourly drink pattern is visible yet.";
  const slowText = hourlyStats.slowest && hourlyStats.active.length > 1
    ? `${formatHourRange(hourlyStats.slowest.hour)} is the lowest active hour.`
    : "There is not enough spread yet to call a true slow hour.";
  const peakPrep = pickDailyAdvice(`${adviceSeed}:peak`, [
    "Set up milk, cups, lids, syrups, and smoothie prep before that window so the bar is not restocking mid-rush.",
    "Put your strongest bar coverage just ahead of that window and keep the handoff area clear.",
    "Use the 20 minutes before that window for backups, ice, milks, and a quick station reset.",
  ]);
  const prepMove = pickDailyAdvice(`${adviceSeed}:prep`, [
    "Prep around that lane first, then use the slower window to reset backups.",
    "Make that lane the first stock check before service gets busy.",
    "Keep that lane visible on the menu or register prompts while demand is warm.",
  ]);
  const healthyTicketMove = pickDailyAdvice(`${adviceSeed}:ticket-healthy`, [
    "A featured modifier or pastry prompt could lift it without slowing service.",
    "Try one simple register prompt and watch whether ticket value moves without hurting speed.",
    "Keep the add-on prompt short so the line keeps moving.",
  ]);
  const modestTicketMove = pickDailyAdvice(`${adviceSeed}:ticket-modest`, [
    "Try simple add-on prompts during slower moments.",
    "Use the quieter window for a featured syrup, size upgrade, or pastry pairing prompt.",
    "Watch whether a small special improves ticket value without making drinks slower.",
  ]);
  const slowWindowMove = pickDailyAdvice(`${adviceSeed}:slow`, [
    "Use that window for restock, batching, social posts, or a small offer if it repeats across days.",
    "Use that quieter stretch for backups, cleaning, prep notes, or a quick staff reset.",
    "If that slow hour repeats, it may be a good place for a light promo or prep-heavy task.",
  ]);
  const advice = [
    {
      title: "Staffing and bar flow",
      body: hourlyStats.peak
        ? `${peakText} ${peakPrep}`
        : "Once orders come in, this panel will call out where the busiest service window lands.",
    },
    {
      title: "Prep focus",
      body: topCategory?.units
        ? `${topCategory.category} is leading ${rangeLabel.toLowerCase()} with ${topCategory.units} units. ${prepMove}`
        : "No category has enough volume yet. Keep prep balanced until one lane starts leading.",
    },
    {
      title: "Ticket value",
      body: averageCents >= 900
        ? `Average drink order value is strong at ${report?.averageDrinkOrderValue || "$0.00"}. ${multiDrinkRate}% of individual drink orders contained 2 or more drinks. Protect speed and consistency before pushing more add-ons.`
        : averageCents >= 600
          ? `Average drink order value is healthy at ${report?.averageDrinkOrderValue || "$0.00"}. ${multiDrinkRate}% of individual drink orders contained 2 or more drinks. ${healthyTicketMove}`
          : `Average drink order value is modest at ${report?.averageDrinkOrderValue || "$0.00"}. ${multiDrinkRate}% of individual drink orders contained 2 or more drinks. ${modestTicketMove}`,
    },
    {
      title: "Slow-window move",
      body: orderCount
        ? `${slowText} ${slowWindowMove}`
        : "No drink orders are showing for this range yet. Check the report again once Square has synced today's service.",
    },
  ];

  return advice;
}

function CoffeeShopAdvice({ report, range }) {
  const rangeLabel = getOwnerRangeLabel(range);
  const advice = buildCoffeeShopAdvice(report, range);

  return (
    <section className="rounded-2xl border border-[#CA862B]/16 bg-[#FFFDF8] p-4 shadow-sm">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
          Coffee Shop Guidance
        </div>
        <h2 className="mt-1 text-xl font-black text-[#0F4036]">
          Expert Read for {rangeLabel}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#6A614F]">
          Rotates daily, based on today&apos;s date and this report&apos;s numbers.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {advice.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[#CA862B]/12 bg-white px-4 py-3"
          >
            <div className="text-sm font-black text-[#0F4036]">
              {item.title}
            </div>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#5A4F3E]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyDrinkCount({ drinkCounts, orderCount }) {
  const totalDrinks = drinkCounts.reduce((sum, drink) => sum + drink.qty, 0);

  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#0F4036]">Today&apos;s Count</h2>
          <p className="text-sm text-[#6A614F]">
            Coffee, not coffee, and smoothies only. Resets automatically at midnight.
          </p>
        </div>

        <div className="rounded-full bg-[#CA862B]/14 border border-[#CA862B]/26 px-3 py-1.5 text-sm font-black text-[#8B5A1D]">
          {orderCount} orders / {totalDrinks} drinks
        </div>
      </div>

      {drinkCounts.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {drinkCounts.map((drink) => (
            <div
              key={drink.name}
              className="rounded-xl bg-white border border-[#CA862B]/16 px-3 py-3"
            >
              <div className="text-xl font-black text-[#111111]">
                {drink.qty}
              </div>
              <div className="text-sm font-bold text-[#4E4637] leading-tight">
                {drink.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-4 text-[#6A614F] font-semibold">
          No drinks counted yet today.
        </div>
      )}
    </section>
  );
}

function DemoBrandMark({ size = "md" }) {
  const dimensions = size === "lg" ? "h-28 w-56" : "h-16 w-36";

  return (
    <div
      className={`${dimensions} flex items-center justify-center rounded-2xl border border-[#0F4036]/15 bg-white/80 shadow-sm`}
      aria-label="DrinkFlow Demo"
    >
      <div className="text-center leading-none">
        <div className="text-3xl font-black text-[#0F4036]">DF</div>
        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#CA862B]">
          Demo Cafe
        </div>
      </div>
    </div>
  );
}

function BrandMark({ size = "md", darkMode = false, demoMode = false }) {
  if (demoMode) return <DemoBrandMark size={size} />;

  const dimensions = size === "lg" ? "h-28 w-56" : "h-16 w-36";

  return (
    <img
      src={darkMode ? LOGO_DARK_URL : LOGO_URL}
      alt="Goldie's Coffee Shop"
      className={`${dimensions} object-contain`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function WatermarkLayer({ trainingMode = false, darkMode = false, demoMode = false }) {
  if (demoMode) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18px 18px, rgba(15,64,54,0.1) 0 2px, transparent 3px)",
          backgroundSize: "86px 86px",
          opacity: 0.5,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url(${darkMode ? LOGO_DARK_URL : LOGO_URL})`,
        backgroundRepeat: "repeat",
        backgroundSize: "240px auto",
        backgroundPosition: "center top",
        opacity: darkMode ? 0.08 : trainingMode ? 0.11 : 0.06,
        transform: "rotate(-8deg) scale(1.08)",
        transformOrigin: "center",
        mixBlendMode: darkMode ? "screen" : "multiply",
        filter: darkMode
          ? "none"
          : trainingMode
            ? "hue-rotate(230deg) saturate(1.6) contrast(1.08)"
            : "grayscale(1) contrast(1.05)",
      }}
    />
  );
}

function BrandFooter({ className = "" }) {
  return (
    <div
      className={`relative z-30 inline-flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/70 bg-[rgba(255,253,248,0.86)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5A4F3E] shadow-[0_8px_18px_rgba(15,64,54,0.06)] backdrop-blur-md ${className}`}
    >
      <span>Studio Samantha © 2026</span>
      <span className="text-[#CA862B]/70">•</span>
      <a
        href="/drinkflow-kds"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Learn more
      </a>
      <span className="text-[#CA862B]/70">•</span>
      <a
        href="/policy.html#data-use"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Data use
      </a>
      <span className="text-[#CA862B]/70">•</span>
      <a
        href="/policy.html#ownership"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Ownership
      </a>
      <span className="text-[#CA862B]/70">•</span>
      <a
        href="/policy.html#trademarks"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Trademarks
      </a>
    </div>
  );
}

function ModeToggle({ active, label, onToggle, hint, onInfoClick }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
          active
            ? "border-[#0F4036] bg-[#0F4036] text-white hover:bg-[#0b352d]"
            : "border-[#CA862B]/22 bg-white text-[#0F4036] hover:bg-[#EEE0C5]/45"
        }`}
      >
        {label}
      </button>

      {onInfoClick && (
        <button
          type="button"
          onClick={onInfoClick}
          title={hint}
          aria-label={hint}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#CA862B]/20 bg-white text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
        >
          ?
        </button>
      )}
    </div>
  );
}

function SettingsPopover({
  open,
  onClose,
  themeMode,
  onThemeToggle,
  showDiningOnTickets,
  onToggleDiningOnTickets,
  onOwnerLogin,
  onChangePassword,
  suggestFixHref,
  onVersionClick,
  showPasswordAction = true,
  ownerActionLabel = "Owner Login",
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={themeMode === "dark" ? "goldies-dark" : ""}>
      <button
        type="button"
        aria-label="Close settings"
        className="fixed inset-0 z-[190] cursor-default bg-[rgba(15,64,54,0.08)] backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[200] w-[min(24rem,calc(100vw-1.25rem))] max-h-[calc(100vh-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[#CA862B]/16 px-4 py-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Settings
            </div>
            <div className="text-sm font-black text-[#111111]">App tools</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#CA862B]/18 bg-white px-2.5 py-1.5 text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <ModeToggle
            active={themeMode === "dark"}
            label={themeMode === "dark" ? "Light mode" : "Dark mode"}
            onToggle={onThemeToggle}
            hint="Switch between the light and dark dashboard themes."
          />

          {onToggleDiningOnTickets && (
            <button
              type="button"
              onClick={onToggleDiningOnTickets}
              className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              title="Show or hide Square dining and service labels on ticket cards."
            >
              {showDiningOnTickets ? "Hide Service on Tickets" : "Show Service on Tickets"}
            </button>
          )}

          {showPasswordAction && (
            <button
              type="button"
              onClick={onChangePassword}
              className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Change Password
            </button>
          )}

          {onOwnerLogin && (
            <button
              type="button"
              onClick={onOwnerLogin}
              className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              {ownerActionLabel}
            </button>
          )}

          <a
            href={suggestFixHref}
            className="block w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Suggest Fix
          </a>

          <button
            type="button"
            onClick={onVersionClick}
            className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-left"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6A614F]">
              What&apos;s new?
            </div>
            <div className="text-sm font-black text-[#0F4036]">{APP_VERSION}</div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DrinkStats({ reports }) {
  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#0F4036]/12 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#0F4036]">Drink Stats</h2>
          <p className="text-sm text-[#6A614F]">
            Coffee, not coffee, and smoothies only
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {REPORT_RANGES.map((range) => {
          const report = reports[range.key] || {};
          const categories = report.totalsByCategory || {};
          const total = (report.totalsByName || []).reduce(
            (sum, drink) => sum + Number(drink.qty || 0),
            0
          );

          return (
            <div
              key={range.key}
              className="rounded-xl bg-white border border-[#0F4036]/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-black text-[#0F4036]">
                  {range.label}
                </div>

                <div className="rounded-full bg-[#EEE0C5]/65 border border-[#0F4036]/12 px-3 py-1 text-sm font-black text-[#111111]">
                  {total}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Coffee", "Not Coffee", "Smoothies"].map((category) => (
                  <div
                    key={category}
                    className="rounded-lg bg-[#FFFDF8] border border-[#0F4036]/10 px-3 py-2"
                  >
                    <div className="text-lg font-black text-[#111111]">
                      {categories[category] || 0}
                    </div>
                    <div className="text-xs font-bold text-[#6A614F] leading-tight">
                      {category}
                    </div>
                  </div>
                ))}
              </div>

              {report.totalsByName?.length > 0 && (
                <div className="mt-4 border-t border-[#0F4036]/10 pt-3">
                  <div className="text-xs font-black uppercase tracking-wide text-[#6A614F] mb-2">
                    Drink breakdown
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {report.totalsByName.map((drink) => (
                      <div
                        key={drink.name}
                        className="flex items-center justify-between gap-3 text-sm rounded-lg bg-[#FFFDF8] border border-[#0F4036]/8 px-3 py-2"
                      >
                        <span className="font-bold text-[#111111] truncate">
                          {drink.name}
                        </span>
                        <span className="font-black text-[#0F4036]">
                          {drink.qty}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#EEE0C5]/55 border border-[#0F4036]/12 px-3 py-2">
                    <span className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                      Total drinks
                    </span>
                    <span className="text-sm font-black text-[#111111]">
                      {total}
                    </span>
                  </div>
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
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#0F4036]">Completed Today</h2>
          <p className="text-sm text-[#6A614F]">
            Resets automatically each day
          </p>
        </div>

        <div className="rounded-full bg-[#EEE0C5]/75 border border-[#CA862B]/18 px-3 py-1.5 text-sm font-black text-[#111111]">
          {tickets.length} done
        </div>
      </div>

      {tickets.length ? (
        <div className="max-h-56 overflow-y-auto border border-[#CA862B]/16 rounded-xl bg-white">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#EEE0C5]/55 text-xs uppercase text-[#6A614F]">
              <tr>
                <th className="px-3 py-2 font-black">Order</th>
                <th className="px-3 py-2 font-black">Name</th>
                <th className="px-3 py-2 font-black">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr className="text-sm align-top">
                  <td className="px-3 py-2 font-black">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTicketId((current) =>
                            current === ticket.id ? null : ticket.id
                          )
                        }
                        className="inline-flex items-center gap-2 text-left font-black text-[#0F4036] hover:text-[#CA862B]"
                      >
                        <span>#{ticket.orderNumber}</span>
                        <span className="text-[#6A614F]">
                          {expandedTicketId === ticket.id ? "▴" : "▾"}
                        </span>
                      </button>
                  </td>
                  <td className="px-3 py-2 font-bold text-[#111111]">
                    {ticket.customerName || "—"}
                  </td>
                  <td className="px-3 py-2 font-bold text-[#111111]">
                    {formatCompletedTime(ticket.completedAt)}
                  </td>
                  </tr>

                  {expandedTicketId === ticket.id && (
                    <tr className="bg-[#FFFDF8]">
                      <td colSpan="3" className="px-3 py-3">
                        <div className="rounded-xl border border-[#CA862B]/16 bg-white p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                Source
                              </div>
                              <div className="font-bold text-[#111111]">
                                {ticket.source || "Square"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                Dining
                              </div>
                              <div className="font-bold text-[#111111]">
                                {ticket.diningOption || "Unspecified"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                Taken by
                              </div>
                              <div className="font-bold text-[#111111]">
                                {ticket.employeeName || "—"}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-black uppercase tracking-wide text-[#6A614F] mb-2">
                              Items
                            </div>
                            <div className="space-y-2">
                              {(ticket.items || []).length ? (
                                ticket.items.map((item, idx) => (
                                  <div
                                    key={`${ticket.id}-detail-${idx}`}
                                    className="rounded-lg border border-[#CA862B]/10 bg-[#FFFDF8] px-3 py-2"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="font-bold text-[#111111]">
                                        {item.qty}x {item.name}
                                      </div>
                                      {item.category && (
                                        <div className="rounded-full bg-[#EEE0C5]/70 border border-[#CA862B]/12 px-2 py-0.5 text-[11px] font-black text-[#0F4036]">
                                          {item.category}
                                        </div>
                                      )}
                                    </div>

                                    {item.modifiers?.length > 0 && (
                                      <div className="mt-1 text-sm text-[#4E4637]">
                                        {item.modifiers.join(", ")}
                                      </div>
                                    )}

                                    {item.note && (
                                      <div className="mt-1 text-sm font-medium text-[#8B5A1D]">
                                        Note: {item.note}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-[#6A614F]">
                                  No item details available.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        </td>
                      </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-4 text-[#6A614F] font-semibold">
          No completed transactions yet today.
        </div>
      )}
    </section>
  );
}

function OrdersByDayLookup({
  defaultDate,
  collapsed,
  onToggle,
  trainingMode,
  trainingTickets,
}) {
  const [date, setDate] = useState(defaultDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [searchedDate, setSearchedDate] = useState(defaultDate);

  function handleLookupSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    runLookup(date);
  }

  async function runLookup(nextDate = date) {
    const trimmedDate = String(nextDate || "").trim();
    if (!trimmedDate) return;

    try {
      setLoading(true);
      setError("");

      if (trainingMode) {
        const localResults = getTrainingLookupResults(trainingTickets, trimmedDate);
        setResults(localResults);
        setSearchedDate(trimmedDate);
        setExpandedTicketId(null);
        return;
      }

      const response = await fetch(apiUrl(`/api/tickets/day?date=${trimmedDate}`), {
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("Login required");
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Lookup failed: ${response.status}`);
      }

      const data = await response.json();
      setResults((data.tickets || []).map(normalizeTicket));
      setSearchedDate(data.date || trimmedDate);
      setExpandedTicketId(null);
    } catch (lookupError) {
      setError(lookupError.message || "Lookup failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (collapsed) return;

    runLookup(searchedDate || date || defaultDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, trainingMode]);

  useEffect(() => {
    if (collapsed || !trainingMode) return;

    const lookupDate = searchedDate || date || defaultDate;
    setResults(getTrainingLookupResults(trainingTickets, lookupDate));
  }, [collapsed, date, defaultDate, searchedDate, trainingMode, trainingTickets]);

  return (
    <section
      className="space-y-2"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFFDF8]/85 border border-[#CA862B]/18 px-4 py-3">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Orders By Day</h2>
          <p className="text-sm text-[#6A614F]">
            Search a single day of orders below
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <>
          <form
            onSubmit={handleLookupSubmit}
            className="flex flex-col sm:flex-row gap-2 sm:items-center rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 px-4 py-3"
          >
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0F4036] text-white px-4 py-2 text-sm font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {loading ? "Looking up..." : "Lookup"}
            </button>
          </form>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <section className="rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-black text-[#0F4036]">
                  {searchedDate}
                </div>
                <div className="text-xs text-[#6A614F]">Results for the selected day</div>
              </div>

              <div className="rounded-full bg-[#EEE0C5]/75 border border-[#CA862B]/18 px-3 py-1.5 text-sm font-black text-[#111111]">
                {results.length} orders
              </div>
            </div>

            {results.length ? (
              <div className="max-h-72 overflow-y-auto border border-[#CA862B]/16 rounded-xl bg-white">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#EEE0C5]/55 text-xs uppercase text-[#6A614F]">
                    <tr>
                      <th className="px-3 py-2 font-black">Order</th>
                      <th className="px-3 py-2 font-black">Name</th>
                      <th className="px-3 py-2 font-black">Status</th>
                      <th className="px-3 py-2 font-black">Dining</th>
                      <th className="px-3 py-2 font-black">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {results.map((ticket) => (
                      <React.Fragment key={ticket.id}>
                        <tr className="text-sm align-top">
                          <td className="px-3 py-2 font-black">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTicketId((current) =>
                                  current === ticket.id ? null : ticket.id
                                )
                              }
                              className="inline-flex items-center gap-2 text-left font-black text-[#0F4036] hover:text-[#CA862B]"
                            >
                              <span>#{ticket.orderNumber}</span>
                              <span className="text-[#6A614F]">
                                {expandedTicketId === ticket.id ? "▴" : "▾"}
                              </span>
                            </button>
                          </td>
                          <td className="px-3 py-2 font-bold text-[#111111]">
                            {ticket.customerName || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full bg-[#EEE0C5]/75 border border-[#CA862B]/18 px-2.5 py-1 text-xs font-black uppercase text-[#111111]">
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold text-[#111111]">
                            {ticket.diningOption || "Unspecified"}
                          </td>
                          <td className="px-3 py-2 font-bold text-[#111111]">
                            {formatOrderTime(ticket.createdAt)}
                          </td>
                        </tr>

                        {expandedTicketId === ticket.id && (
                          <tr className="bg-[#FFFDF8]">
                            <td colSpan="5" className="px-3 py-3">
                              <div className="rounded-xl border border-[#CA862B]/16 bg-white p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                      Source
                                    </div>
                                    <div className="font-bold text-[#111111]">
                                      {ticket.source || "Square"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                      Dining
                                    </div>
                                    <div className="font-bold text-[#111111]">
                                      {ticket.diningOption || "Unspecified"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                                      Taken by
                                    </div>
                                    <div className="font-bold text-[#111111]">
                                      {ticket.employeeName || "—"}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs font-black uppercase tracking-wide text-[#6A614F] mb-2">
                                    Items
                                  </div>
                                  <div className="space-y-2">
                                    {(ticket.items || []).length ? (
                                      ticket.items.map((item, idx) => (
                                        <div
                                          key={`${ticket.id}-lookup-${idx}`}
                                          className="rounded-lg border border-[#CA862B]/10 bg-[#FFFDF8] px-3 py-2"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="font-bold text-[#111111]">
                                              {item.qty}x {item.name}
                                            </div>
                                            {item.category && (
                                              <div className="rounded-full bg-[#EEE0C5]/70 border border-[#CA862B]/12 px-2 py-0.5 text-[11px] font-black text-[#0F4036]">
                                                {item.category}
                                              </div>
                                            )}
                                          </div>

                                          {item.modifiers?.length > 0 && (
                                            <div className="mt-1 text-sm text-[#4E4637]">
                                              {item.modifiers.join(", ")}
                                            </div>
                                          )}

                                          {item.note && (
                                            <div className="mt-1 text-sm font-medium text-[#8B5A1D]">
                                              Note: {item.note}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-[#6A614F]">
                                        No item details available.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-4 text-[#6A614F] font-semibold">
                No orders found for {searchedDate || "that day"}.
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

const OWNER_REPORT_RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "7 Days" },
  { key: "last30", label: "30 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
];

function getOwnerRangeLabel(rangeKey) {
  return (
    OWNER_REPORT_RANGES.find((option) => option.key === rangeKey)?.label ||
    "Selected Range"
  );
}

const OWNER_SNAPSHOT_COPY = {
  today: {
    eyebrow: "Today Snapshot",
    question: "What needs attention during service?",
    empty:
      "No drink revenue is showing for today yet. If the shop is open, watch Square syncing and make sure live drink orders are appearing in the KDS.",
    quiet:
      "Today is still quiet, so this is a good time to watch order flow, keep tickets clean, and use the next rush as the real read.",
    action:
      "During the rest of service, watch whether the rush creates bigger tickets or mainly single-drink orders.",
  },
  yesterday: {
    eyebrow: "Yesterday Snapshot",
    question: "What did yesterday teach us?",
    empty:
      "No drink revenue is showing for yesterday. If the shop had drink sales, this is worth checking against Square before using the report for decisions.",
    quiet:
      "Yesterday was quiet. Treat it as a baseline day and compare it against the next stronger service window.",
    action:
      "Use yesterday as a review point: what sold, what stayed quiet, and whether staffing felt matched to drink volume.",
  },
  last7: {
    eyebrow: "7-Day Snapshot",
    question: "What pattern is showing up this week?",
    empty:
      "No drink revenue is showing for the last 7 days. Check Square syncing before reading this as a true weekly pattern.",
    quiet:
      "This week is reading light so far. The next step is to watch which category still shows traction even when traffic is lower.",
    action:
      "Use the 7-day view to catch short-term shifts before they become a staffing, prep, or menu problem.",
  },
  last30: {
    eyebrow: "30-Day Snapshot",
    question: "What is the monthly pattern telling us?",
    empty:
      "No drink revenue is showing for the last 30 days. Check the data connection before using this as a monthly read.",
    quiet:
      "The 30-day range is reading light. Look for category concentration and repeat demand before making bigger menu decisions.",
    action:
      "Use the 30-day view for stronger decisions about prep, promos, menu focus, and which drink lane deserves attention.",
  },
  thisMonth: {
    eyebrow: "Month-to-Date Snapshot",
    question: "How is this month shaping up?",
    empty:
      "No drink revenue is showing for this month yet. If the month has started with sales, confirm the report connection before reading the trend.",
    quiet:
      "This month is still building. Watch whether the current pace is coming from steady daily volume or a few stronger days.",
    action:
      "Use this month-to-date read to decide whether to push a category, adjust prep, or watch average order value.",
  },
  thisYear: {
    eyebrow: "Year-to-Date Snapshot",
    question: "What is the bigger business signal?",
    empty:
      "No drink revenue is showing for this year yet. Confirm the report connection before using this as a year-to-date read.",
    quiet:
      "The year-to-date view is still modest. Focus on the drink categories that repeatedly show demand over time.",
    action:
      "Use the year-to-date view for higher-level decisions: menu direction, staffing patterns, and what the shop is becoming known for.",
  },
};

function buildOwnerSnapshotAnalysis(report, rangeKey) {
  const copy = OWNER_SNAPSHOT_COPY[rangeKey] || OWNER_SNAPSHOT_COPY.today;
  const orderCount = Number(report?.orderCount || 0);
  const drinkUnits = Number(report?.totalUnits || 0);
  const revenueCents = Number(report?.totalRevenueCents || 0);
  const averageCents = Number(report?.averageDrinkOrderValueCents || 0);
  const categories = report?.totalsByCategory || [];
  const activeCategories = categories
    .filter((item) => Number(item.units || 0) > 0)
    .map((item) => ({
      ...item,
      units: Number(item.units || 0),
      revenueCents: Number(item.revenueCents || 0),
    }));
  const topCategory = activeCategories
    .slice()
    .sort((a, b) => Number(b.units || 0) - Number(a.units || 0))[0];

  if (!orderCount && !drinkUnits) {
    return {
      eyebrow: copy.eyebrow,
      question: copy.question,
      tone: "Quiet service window",
      summary: copy.empty,
      watch: [
        {
          title: "Connection check",
          body: "Confirm live Square orders are appearing correctly.",
        },
        {
          title: "Owner action",
          body: copy.action,
        },
      ],
    };
  }

  const volumeRead =
    orderCount >= 40
      ? "high-volume"
      : orderCount >= 20
        ? "steady"
        : orderCount >= 8
          ? "light but active"
          : "quiet";
  const averageRead =
    averageCents >= 900
      ? "strong average drink order value"
      : averageCents >= 600
        ? "healthy average drink order value"
        : "modest average drink order value";
  const categoryRead = topCategory
    ? `${topCategory.category} led the mix with ${topCategory.units} units.`
    : "No single drink category stood out yet";
  const topCategoryShare = topCategory && drinkUnits
    ? Math.round((Number(topCategory.units || 0) / drinkUnits) * 100)
    : 0;
  const unitsPerOrder = orderCount ? drinkUnits / orderCount : 0;
  const unitsPerOrderLabel = unitsPerOrder.toFixed(1);
  const categoryFocusRead =
    topCategory && topCategoryShare >= 65
      ? `${topCategory.category} is carrying ${topCategoryShare}% of drink units, so demand is concentrated in one lane.`
      : topCategory && topCategoryShare >= 45
        ? `${topCategory.category} is the leading lane at ${topCategoryShare}% of drink units, but the mix is still somewhat balanced.`
        : "The category mix is spread out enough that no single lane is dominating the report.";
  const unitRead =
    unitsPerOrder >= 1.8
      ? `Tickets are averaging ${unitsPerOrderLabel} drinks each, which points to group orders or stronger add-on behavior.`
      : unitsPerOrder >= 1.25
        ? `Tickets are averaging ${unitsPerOrderLabel} drinks each, so some customers are ordering more than one drink.`
        : "Most drink tickets are currently single-drink orders.";
  const revenueRead =
    revenueCents >= 50000
      ? "Drink revenue is building into a meaningful management signal for this range."
      : revenueCents >= 15000
        ? "Drink revenue is active enough to watch category mix and average ticket value."
        : "Drink revenue is still early in this range, so treat this read as directional.";
  const averageOrderRead =
    averageCents >= 900
      ? "Average order value is strong. Watch whether that comes from premium drinks, multiple drinks, or both."
      : averageCents >= 600
        ? "Average order value is healthy. The next lever is increasing multi-drink tickets or add-ons."
        : "Average order value is modest. This may be a place to watch add-ons, specials, or upsell-friendly drinks.";
  const volumeAction =
    orderCount >= 40
      ? "Volume is high enough to review staffing, prep flow, and whether the rush stayed smooth."
      : orderCount >= 20
        ? "Volume is steady enough to compare against staffing and the pace at the bar."
        : orderCount >= 8
          ? "Volume is active but still small enough to inspect individual order patterns."
          : copy.quiet;
  const quietRead =
    orderCount < 8 ? `${copy.quiet} ` : "";
  const startAt = report?.startAt ? new Date(report.startAt).getTime() : 0;
  const endAt = report?.endAt ? new Date(report.endAt).getTime() : 0;
  const rangeDays =
    startAt && endAt
      ? Math.max(1, Math.round((endAt - startAt) / 86400000))
      : 1;
  const dailyRevenue = formatCurrencyCents(Math.round(revenueCents / rangeDays));
  const dailyOrders = (orderCount / rangeDays).toFixed(orderCount < rangeDays ? 1 : 0);
  const rangeLabel = getOwnerRangeLabel(rangeKey);
  const moneySignalByRange = {
    today: `Live service read: ${revenueRead} ${averageOrderRead} Watch the rest of today for whether average ticket value climbs during rush periods.`,
    yesterday: `Closed-day read: yesterday finished at ${report?.totalRevenue || "$0.00"} before tax. ${averageOrderRead} Use it as a clean comparison against today, not as a live staffing signal.`,
    last7: `Short-term trend: this week is averaging ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${revenueRead} Compare this to staffing and prep for the current week.`,
    last30: `Monthly trend: the last 30 days average ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${averageOrderRead} This is the better range for menu and promo decisions.`,
    thisMonth: `Month-to-date pace: this month is averaging ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${revenueRead} Watch whether the pace is improving or fading before month end.`,
    thisYear: `Long-term signal: year-to-date drink revenue is ${report?.totalRevenue || "$0.00"} before tax across ${drinkUnits} units. ${averageOrderRead} Use this for bigger menu, staffing, and category direction.`,
  };
  const ownerActionByRange = {
    today:
      averageCents < 600
        ? "For the rest of today, coach add-ons or premium drink suggestions and see whether the average ticket improves before close."
        : "For the rest of today, protect speed and prep on the strongest category so higher-value tickets do not slow the bar.",
    yesterday:
      "Use yesterday as a review: compare the strongest category, average ticket value, and staffing notes before changing today's plan.",
    last7:
      topCategoryShare >= 55
        ? `This week, make sure ${topCategory.category} prep and stock match demand before the next rush.`
        : "This week, watch whether demand stays spread across categories or starts concentrating in one lane.",
    last30:
      averageCents < 600
        ? "For the 30-day view, test a simple add-on or featured drink strategy before changing the broader menu."
        : "For the 30-day view, use the stronger average ticket to decide which drink lane deserves more menu focus.",
    thisMonth:
      "For this month, compare the current daily pace to the goal and adjust prep, specials, or category focus before the month closes.",
    thisYear:
      "For the year-to-date view, use the repeated category leader and ticket value pattern for bigger staffing, menu, and purchasing decisions.",
  };

  return {
    eyebrow: copy.eyebrow,
    question: copy.question,
    tone: `${rangeLabel} read`,
    summary: `${quietRead}${rangeLabel} looks ${volumeRead}: ${orderCount} drink orders, ${drinkUnits} drink units, and ${report?.totalRevenue || "$0.00"} in drink revenue before tax. The average collected per drink order is ${report?.averageDrinkOrderValue || "$0.00"}, which points to ${averageRead}.`,
    watch: [
      {
        title: "Demand mix",
        body: `${categoryRead} ${categoryFocusRead}`,
      },
      {
        title: "Ticket behavior",
        body: unitRead,
      },
      {
        title: "Money signal",
        body: moneySignalByRange[rangeKey] || `${revenueRead} ${averageOrderRead}`,
      },
      {
        title: "Owner action",
        body: `${ownerActionByRange[rangeKey] || copy.action} ${volumeAction}`,
      },
    ],
  };
}

function OwnerLoginDialog({ open, onClose, onLogin, themeMode }) {
  const [ownerName, setOwnerName] = useState("Owner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/owner/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Owner login failed");
      }

      const data = await response.json();
      setPassword("");
      onLogin(data.ownerName || ownerName || "Owner");
    } catch (loginError) {
      setError(loginError.message || "Owner login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4 ${themeMode === "dark" ? "goldies-dark" : ""}`}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Owner Login
            </div>
            <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
              Financial Reports
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Close
          </button>
        </div>

        <label className="block text-left">
          <span className="text-sm font-black text-[#0F4036]">Name</span>
          <input
            type="text"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
          />
        </label>

        <label className="block text-left">
          <span className="text-sm font-black text-[#0F4036]">Password</span>
          <div className="mt-2 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 pr-24 text-lg font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-[#CA862B]/18 bg-[#FFFDF8] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#0F4036] transition hover:bg-[#EEE0C5]/45 shadow-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#0F4036] text-white px-4 py-3 font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {submitting ? "Signing in..." : "Open Owner Reports"}
        </button>

        <a
          href={buildOwnerPasswordResetMailto(ownerName)}
          className="block w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-center text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
        >
          Email Samantha for password reset
        </a>
      </form>
    </div>
  );
}

function OwnerReportsView({
  ownerName,
  onClose,
  themeMode,
  demoMode = false,
  demoTickets = [],
}) {
  const [range, setRange] = useState("today");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOwnerPasswordModal, setShowOwnerPasswordModal] = useState(false);
  const [ownerPasswordError, setOwnerPasswordError] = useState("");
  const [ownerPasswordNotice, setOwnerPasswordNotice] = useState("");
  const [ownerPasswordSaving, setOwnerPasswordSaving] = useState(false);
  const [snapshotMonth, setSnapshotMonth] = useState(() => getLocalMonthInputValue());
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotsTableMissing, setSnapshotsTableMissing] = useState(false);
  const [snapshotNotice, setSnapshotNotice] = useState("");
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [reportExportMenuOpen, setReportExportMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchReport() {
      if (demoMode) {
        setReport(buildDemoOwnerReport(demoTickets, range));
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          apiUrl(`/api/owner/reports/drink-revenue?range=${range}`),
          { credentials: "include" }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Report unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (mounted) setReport(data);
      } catch (reportError) {
        if (mounted) setError(reportError.message || "Report unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      mounted = false;
    };
  }, [range, demoMode, demoTickets]);

  async function fetchSnapshots(month = snapshotMonth) {
    try {
      setSnapshotsLoading(true);
      setSnapshotError("");
      const response = await fetch(apiUrl(`/api/owner/snapshots?month=${month}`), {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Snapshot history unavailable: ${response.status}`);
      }

      const data = await response.json();
      setSnapshots(data.snapshots || []);
      setSnapshotsTableMissing(Boolean(data.tableMissing));
    } catch (historyError) {
      setSnapshotError(historyError.message || "Snapshot history unavailable");
    } finally {
      setSnapshotsLoading(false);
    }
  }

  useEffect(() => {
    if (demoMode) return;
    fetchSnapshots(snapshotMonth);
  }, [snapshotMonth, demoMode]);

  async function handleSaveSnapshot() {
    if (!report) return;

    const snapshot = buildOwnerSnapshotAnalysis(report, range);
    const advice = buildCoffeeShopAdvice(report, range);
    const moneySignal =
      snapshot.watch.find((item) => item.title === "Money signal")?.body || "";
    const ownerAction =
      snapshot.watch.find((item) => item.title === "Owner action")?.body || "";

    try {
      setSnapshotSaving(true);
      setSnapshotError("");
      setSnapshotNotice("");

      const response = await fetch(apiUrl("/api/owner/snapshots"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range,
          rangeLabel: getOwnerRangeLabel(range),
          snapshotDate: getTodayDateKey(),
          summary: snapshot.summary,
          moneySignal,
          ownerAction,
          report: { ...report, range },
          advice,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Snapshot save failed: ${response.status}`);
      }

      setSnapshotNotice("Owner snapshot saved for this month.");
      setSnapshotsTableMissing(false);
      setSnapshotMonth(getLocalMonthInputValue());
      await fetchSnapshots(getLocalMonthInputValue());
    } catch (saveError) {
      setSnapshotError(saveError.message || "Snapshot save failed");
    } finally {
      setSnapshotSaving(false);
    }
  }

  async function handleLogout() {
    await fetch(apiUrl("/api/owner/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    onClose();
  }

  async function handleOwnerPasswordChange({
    currentPassword,
    newPassword,
    confirmPassword,
    clear,
  }) {
    setOwnerPasswordSaving(true);
    setOwnerPasswordError("");

    try {
      const response = await fetch(apiUrl("/api/owner/password"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(data.error || "Owner login required");
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Owner password update failed: ${response.status}`
        );
      }

      clear();
      setShowOwnerPasswordModal(false);
      setOwnerPasswordNotice(
        data.message || "Owner password updated. Use the new password next time."
      );
    } catch (passwordError) {
      setOwnerPasswordError(passwordError.message || "Owner password update failed");
    } finally {
      setOwnerPasswordSaving(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.98),_rgba(238,224,197,1)_55%,_rgba(230,210,173,1)_100%)] p-4 text-[#111111] ${themeMode === "dark" ? "goldies-dark" : ""}`}>
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-[rgba(255,253,248,0.94)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-2xl border border-[#CA862B]/14 bg-white/80 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:h-[72px] sm:w-40">
              <img
                src={OWNER_LOGO_URL}
                alt="Goldie's Coffee & Goods"
                className="max-h-full max-w-full object-contain"
                loading="eager"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
                Owner Reports
              </div>
              <h1 className="mt-1 text-3xl font-black text-[#0F4036]">
                Drink Revenue
              </h1>
              <p className="mt-1 text-sm text-[#6A614F]">
                Coffee, Not Coffee, and Smoothies only
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#CA862B]/18 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#0F4036]">
              {ownerName || "Owner"}
            </span>
            {!demoMode && (
              <button
                type="button"
                onClick={() => {
                  setOwnerPasswordError("");
                  setShowOwnerPasswordModal(true);
                }}
                className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              >
                Change Owner Password
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
            >
              Sign out
            </button>
          </div>
        </header>

        {ownerPasswordNotice && (
          <div className="rounded-2xl border border-[#0F4036]/12 bg-[#0F4036]/8 px-4 py-3 text-sm font-bold text-[#0F4036]">
            {ownerPasswordNotice}
          </div>
        )}

        <section className="rounded-3xl border border-white/70 bg-[rgba(255,253,248,0.92)] p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {OWNER_REPORT_RANGES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setRange(option.key);
                    setReportExportMenuOpen(false);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    range === option.key
                      ? "bg-[#0F4036] text-white"
                      : "border border-[#CA862B]/22 bg-white text-[#0F4036] hover:bg-[#EEE0C5]/45"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setReportExportMenuOpen((current) => !current)}
                disabled={loading || Boolean(error)}
                className="w-full rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300 lg:w-auto"
              >
                Download Report
              </button>

              {reportExportMenuOpen && !loading && !error && (
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-[#CA862B]/18 bg-white shadow-[0_18px_45px_rgba(15,64,54,0.16)]">
                  {demoMode ? (
                    <div className="px-4 py-3 text-sm font-bold leading-5 text-[#6A614F]">
                      CSV, Excel, and PDF downloads are enabled in a live shop setup.
                    </div>
                  ) : (
                    <>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.csv?range=${range}`)}
                        className="block px-4 py-3 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                        onClick={() => setReportExportMenuOpen(false)}
                      >
                        CSV
                      </a>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.xlsx?range=${range}`)}
                        className="block px-4 py-3 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                        onClick={() => setReportExportMenuOpen(false)}
                      >
                        Excel workbook
                      </a>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.pdf?range=${range}`)}
                        className="block px-4 py-3 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                        onClick={() => setReportExportMenuOpen(false)}
                      >
                        PDF report
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-8 text-center font-semibold text-[#6A614F]">
              Loading owner report
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <StatCard
                  label="Actual Drink Revenue"
                  value={report?.totalRevenue || "$0.00"}
                  detail="Before tax"
                />
                <StatCard
                  label="Taxes Collected"
                  value={report?.totalTax || "$0.00"}
                  detail="Drink items only"
                />
                <StatCard
                  label="Total Collected"
                  value={report?.totalCollected || "$0.00"}
                  detail={`${report?.orderCount || 0} drink orders`}
                />
                <StatCard
                  label="Drink Units"
                  value={report?.totalUnits || 0}
                  detail="Coffee, not coffee, smoothies"
                />
                <StatCard
                  label="Orders With 2+ Drinks"
                  value={`${report?.multiDrinkOrderRate || 0}%`}
                  detail={`${report?.multiDrinkOrderCount || 0} of ${report?.orderCount || 0} individual drink orders`}
                />
              </div>

              <div className="mt-4">
                <OwnerSnapshotCard report={report} range={range} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <HourlyVolumeChart report={report} range={range} />
                <CoffeeShopAdvice report={report} range={range} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {(report?.totalsByCategory || []).map((item) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-[#CA862B]/16 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="text-sm font-black text-[#0F4036]">
                      {item.category}
                    </div>
                    <div className="mt-2 text-3xl font-black text-[#111111]">
                      {item.revenue}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#6A614F]">
                      Before tax
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] px-3 py-2">
                        <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                          Tax
                        </div>
                        <div className="font-black text-[#111111]">{item.tax}</div>
                      </div>
                      <div className="rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] px-3 py-2">
                        <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                          Total
                        </div>
                        <div className="font-black text-[#111111]">{item.total}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#6A614F]">
                      {item.units} drink units sold
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <PasswordSettingsDialog
        open={showOwnerPasswordModal}
        title="Change Owner Password"
        description="Requires the current owner password."
        submitLabel="Save Owner Password"
        supportHref={buildOwnerPasswordResetMailto(ownerName)}
        supportLabel="Forgot it? Email Samantha for reset"
        onClose={() => {
          setShowOwnerPasswordModal(false);
          setOwnerPasswordError("");
        }}
        onSubmit={handleOwnerPasswordChange}
        saving={ownerPasswordSaving}
        error={ownerPasswordError}
      />
    </div>
  );
}

function LoginScreen({
  onLogin,
  themeMode,
  onThemeToggle,
  themeStyle,
  settingsOpen,
  onToggleSettings,
  onCloseSettings,
  onSettingsHelp,
  onChangePassword,
  onOwnerLogin,
  suggestFixHref,
  onVersionClickMenu,
}) {
  const [employeeName, setEmployeeName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const lockoutActive = lockoutUntil > Date.now();

  useEffect(() => {
    if (!lockoutUntil) return undefined;

    const timeout = setTimeout(() => {
      setLockoutUntil(0);
      setFailedAttempts(0);
      setError("");
    }, Math.max(lockoutUntil - Date.now(), 0));

    return () => clearTimeout(timeout);
  }, [lockoutUntil]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (lockoutActive) {
      setError("Too many failed attempts. Use Suggest Fix to contact Samantha.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, employeeName }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setPassword("");
      setEmployeeName("");
      setFailedAttempts(0);
      setLockoutUntil(0);
      onLogin(data.employeeName || employeeName.trim());
    } catch (loginError) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setLockoutUntil(Date.now() + 30000);
        setError("Too many failed attempts. Use Suggest Fix to contact Samantha.");
      } else {
        setError(loginError.message || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.96),_rgba(238,224,197,1)_50%,_rgba(230,210,173,1)_100%)] text-[#111111] flex items-start justify-center px-4 pt-20 sm:items-center sm:pt-0 overflow-hidden ${
        themeMode === "dark" ? "goldies-dark" : ""
      }`}
      style={themeStyle}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0) 28%, rgba(15,64,54,0.03) 100%)",
        }}
      />
      <WatermarkLayer trainingMode={false} darkMode={themeMode === "dark"} />
      <div className="absolute right-4 top-6 sm:top-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSettings}
            className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Settings
          </button>

          <button
            type="button"
            onClick={onSettingsHelp}
            aria-label="Explain Settings"
            title="Settings includes the main utility actions for the app."
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CA862B]/20 bg-white text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            ?
          </button>
        </div>

        <div onClick={(event) => event.stopPropagation()}>
          <SettingsPopover
            open={settingsOpen}
            onClose={onCloseSettings}
            themeMode={themeMode}
            onThemeToggle={onThemeToggle}
            onOwnerLogin={onOwnerLogin}
            showPasswordAction={false}
            suggestFixHref={suggestFixHref}
            onVersionClick={onVersionClickMenu}
          />
        </div>
      </div>

      <main className="relative z-10 w-full max-w-md rounded-[1.75rem] bg-[rgba(255,253,248,0.94)] border border-white/70 shadow-[0_28px_80px_rgba(15,64,54,0.14)] backdrop-blur-xl p-7 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <BrandMark size="lg" darkMode={themeMode === "dark"} />
        </div>

        <div className="mb-3 inline-flex rounded-full border border-[#CA862B]/18 bg-[#EEE0C5]/55 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#6A614F]">
          Goldie&apos;s KDS
        </div>

        <h1 className="text-4xl font-black tracking-tight text-[#0F4036]">
          Kitchen Display
        </h1>

        <p className="text-[#6A614F] mt-2 max-w-[24rem]">
          Enter your name and password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4 w-full">
          <label className="block text-left">
            <span className="text-sm font-black text-[#0F4036]">Name</span>
            <input
              type="text"
              value={employeeName}
              onChange={(event) => setEmployeeName(event.target.value)}
              autoComplete="name"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-[#CA862B]/20 bg-white/95 px-4 py-3 text-lg font-bold outline-none shadow-[0_10px_30px_rgba(15,64,54,0.06)] focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/12"
            />
            <div className="mt-1 text-xs font-semibold text-[#6A614F]">
              Enter your name.
            </div>
          </label>

          <label className="block text-left">
            <span className="text-sm font-black text-[#0F4036]">Password</span>
            <div className="mt-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#CA862B]/20 bg-white/95 px-4 py-3 pr-24 text-lg font-bold outline-none shadow-[0_10px_30px_rgba(15,64,54,0.06)] focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-[#CA862B]/18 bg-[#FFFDF8] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#0F4036] transition hover:bg-[#EEE0C5]/45 shadow-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          {lockoutActive && (
            <div className="rounded-2xl bg-[#EEE0C5]/60 border border-[#CA862B]/20 px-4 py-3 text-sm font-semibold text-[#6A614F]">
              Too many failed attempts. Use Suggest Fix to contact Samantha.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || lockoutActive || !password || !employeeName.trim()}
            className="w-full rounded-2xl bg-[#0F4036] text-white px-4 py-3 font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300 shadow-[0_18px_40px_rgba(15,64,54,0.18)]"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 flex justify-center pb-1 pointer-events-auto">
          <BrandFooter className="max-w-full px-4 py-2 text-[11px] sm:text-[10px]" />
        </div>
      </main>
    </div>
  );
}

function PasswordSettingsDialog({
  open,
  onClose,
  onSubmit,
  saving,
  error,
  title = "Change Password",
  description = "Requires the current password.",
  submitLabel = "Save Password",
  supportHref = "",
  supportLabel = "",
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      currentPassword,
      newPassword,
      confirmPassword,
      clear: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-sm px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF8] border border-[#CA862B]/22 shadow-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#0F4036]">{title}</h2>
            <p className="text-sm text-[#6A614F] mt-1">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-black text-[#0F4036]">
              Current password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#0F4036]">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#0F4036]">
              Confirm new password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
          </label>

          <div className="text-sm text-[#6A614F]">
            Passwords must be at least 8 characters.
          </div>

          {supportHref && (
            <a
              href={supportHref}
              className="block rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-center text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              {supportLabel || "Email Samantha for password help"}
            </a>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#0F4036] text-white px-4 py-3 font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoldiesKDS() {
  const isDemoRoute = isDemoTrainingRoute();
  const [themeMode, setThemeMode] = useState(getSavedThemeMode);
  const [isTrainingMode, setIsTrainingMode] = useState(getSavedTrainingMode);
  const [authStatus, setAuthStatus] = useState(() =>
    isDemoTrainingRoute() ? "authenticated" : "checking"
  );
  const [signedInEmployee, setSignedInEmployee] = useState(() =>
    isDemoTrainingRoute() ? "Demo" : ""
  );
  const [tickets, setTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [drinkCounts, setDrinkCounts] = useState([]);
  const [drinkOrderCount, setDrinkOrderCount] = useState(0);
  const [drinkMakingTime, setDrinkMakingTime] = useState({
    label: "Collecting",
    sampleSize: 0,
  });
  const [drinkReports, setDrinkReports] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [showTodayCount, setShowTodayCount] = useState(false);
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [showOrdersByDay, setShowOrdersByDay] = useState(false);
  const [showDiningOnTickets, setShowDiningOnTickets] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [showOwnerReports, setShowOwnerReports] = useState(false);
  const [signedInOwner, setSignedInOwner] = useState("");
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [pitchHash, setPitchHash] = useState(() => {
    if (typeof window === "undefined") return "";

    return window.location.hash || "";
  });
  const [modeHelp, setModeHelp] = useState(null);
  const [settingsHelp, setSettingsHelp] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hiddenCelebrationKey, setHiddenCelebrationKey] = useState(() => {
    if (typeof window === "undefined") return "";

    try {
      return window.localStorage.getItem(CELEBRATION_HIDE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [hideWebServicesReminder, setHideWebServicesReminder] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(WEB_SERVICES_REMINDER_HIDE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [hideOwnerReportsNotice, setHideOwnerReportsNotice] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(OWNER_REPORTS_NOTICE_HIDE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [hiddenReleaseNotesVersion, setHiddenReleaseNotesVersion] = useState(() => {
    if (typeof window === "undefined") return "";

    try {
      return window.localStorage.getItem(RELEASE_NOTES_HIDE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [lastPoll, setLastPoll] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [lastError, setLastError] = useState("");
  const [defaultLookupDate] = useState(() => getLocalDateInputValue());
  const todayDateKey = getTodayDateKey();
  const scheduledCelebration = getScheduledCelebration(todayDateKey);
  const scheduledCelebrationKey = scheduledCelebration
    ? `${todayDateKey}:${scheduledCelebration.id}`
    : "";
  const showCelebrationNote =
    authStatus === "login" &&
    scheduledCelebration &&
    hiddenCelebrationKey !== scheduledCelebrationKey;
  const isWebServicesReminderDay = getTodayDateKey() === WEB_SERVICES_REMINDER_DATE;
  const showWebServicesReminder =
    authStatus === "authenticated" &&
    isWebServicesReminderDay &&
    !hideWebServicesReminder;
  const showOwnerReportsNotice =
    authStatus === "login" &&
    !hideOwnerReportsNotice &&
    !showCelebrationNote &&
    !isDemoRoute;
  const isPitchRoute =
    pitchHash === "#learn-more" ||
    pitchHash === "#pitch-preview" ||
    (typeof window !== "undefined" &&
      window.location.search.includes("pitch-preview"));
  const trainingThemeStyle = isTrainingMode
    ? themeMode === "dark"
      ? {
          backgroundColor: "#2A1B10",
          backgroundImage:
            "radial-gradient(circle at top, rgba(238,224,197,0.18), rgba(202,134,43,0.32) 32%, rgba(75,48,25,0.98) 62%, rgba(31,22,15,1) 100%)",
          color: "#FFF7EA",
          colorScheme: "dark",
        }
      : {
          backgroundColor: "#ecfeff",
          backgroundImage:
            "radial-gradient(circle at top, rgba(34,211,238,0.34), rgba(224,242,254,0.96) 46%, rgba(186,230,253,1) 100%)",
          color: "#0369a1",
        }
    : undefined;
  const themeStyle =
    themeMode === "dark"
      ? {
          backgroundColor: "#06231F",
          backgroundImage:
            "radial-gradient(circle at top, rgba(202,134,43,0.22), rgba(15,64,54,0.98) 44%, rgba(6,35,31,1) 100%)",
          color: "#FFF7EA",
          colorScheme: "dark",
        }
      : undefined;
  const [trainingTickets, setTrainingTickets] = useState(() =>
    createTrainingTickets()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore storage failures
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TRAINING_MODE_STORAGE_KEY,
        isTrainingMode ? "true" : "false"
      );
    } catch {
      // ignore storage failures
    }
  }, [isTrainingMode]);

  useEffect(() => {
    if (!isTrainingMode) return;

    setTrainingTickets(createTrainingTickets());
    setConnectionStatus("Training mode");
    setLastError("");
    setLastPoll(new Date());
  }, [isTrainingMode]);

  useEffect(() => {
    if (!isTrainingMode && authStatus === "authenticated") {
      setConnectionStatus("Connecting...");
    }
  }, [isTrainingMode, authStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (hiddenReleaseNotesVersion) {
        window.localStorage.setItem(
          RELEASE_NOTES_HIDE_KEY,
          hiddenReleaseNotesVersion
        );
      } else {
        window.localStorage.removeItem(RELEASE_NOTES_HIDE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [hiddenReleaseNotesVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (hiddenCelebrationKey) {
        window.localStorage.setItem(CELEBRATION_HIDE_KEY, hiddenCelebrationKey);
      } else {
        window.localStorage.removeItem(CELEBRATION_HIDE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [hiddenCelebrationKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (hideWebServicesReminder) {
        window.localStorage.setItem(WEB_SERVICES_REMINDER_HIDE_KEY, "true");
      } else {
        window.localStorage.removeItem(WEB_SERVICES_REMINDER_HIDE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [hideWebServicesReminder]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (hideOwnerReportsNotice) {
        window.localStorage.setItem(OWNER_REPORTS_NOTICE_HIDE_KEY, "true");
      } else {
        window.localStorage.removeItem(OWNER_REPORTS_NOTICE_HIDE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [hideOwnerReportsNotice]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncPitchHash = () => {
      setPitchHash(window.location.hash || "");
    };

    window.addEventListener("hashchange", syncPitchHash);
    return () => window.removeEventListener("hashchange", syncPitchHash);
  }, []);

  useEffect(() => {
    if (!passwordNotice) return undefined;

    const timeout = setTimeout(() => {
      setPasswordNotice("");
    }, 6000);

    return () => clearTimeout(timeout);
  }, [passwordNotice]);

  useEffect(() => {
    if (isDemoRoute) {
      setIsTrainingMode(true);
      setAuthStatus("authenticated");
      setSignedInEmployee("Demo");
      return undefined;
    }

    let mounted = true;

    async function checkSessions() {
      try {
        const staffResponse = await fetch(apiUrl("/api/session"), {
          credentials: "include",
        });
        const session = await staffResponse.json();

        if (!mounted) return;

        setAuthStatus(session.authenticated ? "authenticated" : "login");
        setSignedInEmployee(session.employeeName || "");
        if (!session.configured) {
          setLastError("KDS login is not configured on the backend.");
        }
      } catch (error) {
        if (!mounted) return;

        setAuthStatus("login");
        setSignedInEmployee("");
        setLastError(error.message || "Unable to check login session");
      }
    }

    checkSessions();

    return () => {
      mounted = false;
    };
  }, [isDemoRoute]);

  useEffect(() => {
    if (authStatus !== "authenticated" || isTrainingMode) return undefined;

    let mounted = true;

    async function fetchBoardAndTodayCounts() {
      try {
        const [ticketsResponse, drinkResponse, makingTimeResponse] = await Promise.all([
          fetch(apiUrl("/api/tickets"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/reports/drinks?range=today"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/reports/drink-making-time?range=today"), {
            credentials: "include",
          }),
        ]);

        if (
          ticketsResponse.status === 401 ||
          drinkResponse.status === 401 ||
          makingTimeResponse.status === 401
        ) {
          setAuthStatus("login");
          return;
        }

        if (!ticketsResponse.ok) {
          throw new Error(`Failed to fetch tickets: ${ticketsResponse.status}`);
        }

        if (!drinkResponse.ok) {
          throw new Error(`Failed to fetch drink report: ${drinkResponse.status}`);
        }

        if (!makingTimeResponse.ok) {
          throw new Error(
            `Failed to fetch drink making time: ${makingTimeResponse.status}`
          );
        }

        const liveTickets = await ticketsResponse.json();
        const todayReport = await drinkResponse.json();
        const makingTimeReport = await makingTimeResponse.json();

        if (!mounted) return;

        setTickets(liveTickets.map(normalizeTicket));
        setDrinkCounts(
          (todayReport.totalsByName || []).map((drink) => ({
            name: drink.name,
            qty: drink.qty,
          }))
        );
        setDrinkOrderCount(todayReport.orderCount || 0);
        setDrinkMakingTime({
          label: makingTimeReport.label || "Collecting",
          sampleSize: makingTimeReport.sampleSize || 0,
        });
        setLastPoll(new Date());
        setConnectionStatus("Connected");
        setLastError("");
      } catch (error) {
        if (!mounted) return;

        setConnectionStatus("Offline");
        setLastError(error.message || "Unknown polling error");
      }
    }

    fetchBoardAndTodayCounts();

    const interval = setInterval(fetchBoardAndTodayCounts, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authStatus, isTrainingMode]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !showCompletedToday || isTrainingMode)
      return undefined;

    let mounted = true;

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

    async function refreshCompletedTickets() {
      try {
        const liveCompletedTickets = await fetchCompletedTickets();

        if (!mounted) return;

        setCompletedTickets(liveCompletedTickets);
      } catch (error) {
        if (!mounted) return;

        setLastError(error.message || "Completed tickets unavailable");
      }
    }

    refreshCompletedTickets();

    const interval = setInterval(refreshCompletedTickets, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authStatus, showCompletedToday, isTrainingMode]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !showStats || isTrainingMode)
      return undefined;

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

    async function refreshDrinkReports() {
      try {
        const liveReports = await fetchDrinkReports();

        if (!mounted) return;

        setDrinkReports(liveReports);
      } catch (error) {
        if (!mounted) return;

        setLastError(error.message || "Drink stats unavailable");
      }
    }

    refreshDrinkReports();

    const interval = setInterval(refreshDrinkReports, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authStatus, showStats, isTrainingMode]);

  const displayedTickets = isTrainingMode ? trainingTickets : tickets;
  const displayedCompletedTickets = isTrainingMode
    ? displayedTickets.filter(
        (ticket) =>
          ["completed", "done"].includes(ticket.status) &&
          isSameLocalDay(ticket.completedAt || ticket.createdAt, getTodayDateKey())
      )
    : completedTickets;
  const displayedDrinkCounts = isTrainingMode
    ? getDailyDrinkCounts(displayedTickets)
    : drinkCounts;
  const displayedDrinkOrderCount = isTrainingMode
    ? countBeverageOrdersForDay(displayedTickets, getTodayDateKey())
    : drinkOrderCount;
  const displayedDrinkMakingTime = isTrainingMode
    ? {
        label: "3m 12s",
        sampleSize: 4,
      }
    : drinkMakingTime;
  const displayedDrinkReports = isTrainingMode
    ? buildTrainingReports(displayedTickets)
    : drinkReports;
  const displayedConnectionStatus = isTrainingMode
    ? "Training mode"
    : connectionStatus;
  const activeTickets = displayedTickets.filter(
    (ticket) => ticket.status !== "done" && hasDrinkItems(ticket)
  );
  const hasOpenTickets = activeTickets.length > 0;

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = activeTickets
        .filter((ticket) => ticket.status === col.key)
        .sort((a, b) => {
          const createdDelta = Number(a.createdAt || 0) - Number(b.createdAt || 0);
          if (createdDelta) return createdDelta;
          return String(a.orderNumber || "").localeCompare(String(b.orderNumber || ""));
        });

      return acc;
    }, {});
  }, [activeTickets]);

  function handleStatusChange(id, status) {
    if (isTrainingMode) {
      setTrainingTickets((current) =>
        current.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status,
                completedAt:
                  status === "completed" || status === "done"
                    ? Date.now()
                    : null,
              }
            : ticket
        )
      );
      return;
    }

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
    if (isTrainingMode) {
      setTrainingTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? { ...ticket, customerName } : ticket
        )
      );
      return;
    }

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

  function handleDiningOptionChange(id, diningOption) {
    if (isTrainingMode) {
      setTrainingTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? { ...ticket, diningOption } : ticket
        )
      );
      return;
    }

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id ? { ...ticket, diningOption } : ticket
      )
    );

    fetch(apiUrl(`/api/tickets/${id}/dining-option`), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diningOption }),
    })
      .then((response) => {
        if (response.status === 401) {
          setAuthStatus("login");
          throw new Error("Login required");
        }

        if (!response.ok) {
          throw new Error(`Service update failed: ${response.status}`);
        }
      })
      .catch((error) => {
        setLastError(`Service update failed: ${error.message}`);
      });
  }

  async function handlePasswordChange({
    currentPassword,
    newPassword,
    confirmPassword,
    clear,
  }) {
    setPasswordSaving(true);
    setPasswordError("");

    try {
      const response = await fetch(apiUrl("/api/password"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setAuthStatus("login");
        throw new Error(data.error || "Login required");
      }

      if (!response.ok) {
        throw new Error(data.error || `Password update failed: ${response.status}`);
      }

      clear();
      setShowPasswordModal(false);
      setPasswordNotice(
        data.message || "Password updated. Sign out to test the new password."
      );
    } catch (error) {
      setPasswordError(error.message || "Password update failed");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    await fetch(apiUrl("/api/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    setTickets([]);
    setCompletedTickets([]);
    setDrinkCounts([]);
    setDrinkOrderCount(0);
    setDrinkReports({});
    setShowPasswordModal(false);
    setPasswordError("");
    setPasswordNotice("");
    setAuthStatus("login");
    setSignedInEmployee("");
    setHideWebServicesReminder(false);
    setShowPitch(false);
    setPitchHash("");
  }

  let content;

  if (authStatus === "checking") {
    content = (
      <div
        className={`relative min-h-screen bg-[#EEE0C5] text-[#111111] flex items-center justify-center px-4 overflow-hidden ${
          themeMode === "dark"
            ? `goldies-dark ${isTrainingMode ? "goldies-training-dark" : ""}`
            : ""
        }`}
        style={themeStyle}
      >
        <WatermarkLayer
          trainingMode={isTrainingMode}
          darkMode={themeMode === "dark"}
          demoMode={isDemoRoute}
        />
        <div className="rounded-3xl bg-[#FFFDF8] border border-[#CA862B]/22 shadow-sm p-6 text-xl font-black text-[#0F4036]">
          Loading Kitchen Display
        </div>
      </div>
    );
  } else if (authStatus === "login") {
    content = (
      <>
        <LoginScreen
          onLogin={(employeeName) => {
            setSignedInEmployee(employeeName);
            setAuthStatus("authenticated");
          }}
          themeMode={themeMode}
          onThemeToggle={() =>
            setThemeMode((current) => (current === "dark" ? "light" : "dark"))
          }
          themeStyle={themeStyle}
          settingsOpen={showSettingsMenu}
          onToggleSettings={() => setShowSettingsMenu((current) => !current)}
          onCloseSettings={() => setShowSettingsMenu(false)}
          onSettingsHelp={() =>
            setSettingsHelp({
              title: "Settings",
              body: SETTINGS_HELP_TEXT,
            })
          }
          onChangePassword={() => {
            setShowSettingsMenu(false);
            setPasswordError("");
            setPasswordNotice("");
            setShowPasswordModal(true);
          }}
          onOwnerLogin={() => {
            setShowSettingsMenu(false);
            setSignedInOwner("");
            setShowOwnerReports(false);
            setShowOwnerLogin(true);
          }}
          suggestFixHref={buildSupportMailto()}
          onVersionClickMenu={() => {
            setShowSettingsMenu(false);
            setShowReleaseNotes(true);
          }}
        />
        <CelebrationDialog
          open={showCelebrationNote}
          celebration={scheduledCelebration}
          onClose={() => setHiddenCelebrationKey(scheduledCelebrationKey)}
        />
        <OwnerReportsNoticeDialog
          open={showOwnerReportsNotice}
          onClose={() => setHideOwnerReportsNotice(true)}
          onOpenOwnerLogin={() => {
            setHideOwnerReportsNotice(true);
            setSignedInOwner("");
            setShowOwnerReports(false);
            setShowOwnerLogin(true);
          }}
        />
      </>
    );
  } else {
    content = (
      <div
        className={`relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.96),_rgba(238,224,197,1)_50%,_rgba(230,210,173,1)_100%)] text-[#111111] overflow-hidden ${
          themeMode === "dark"
            ? `goldies-dark ${isTrainingMode ? "goldies-training-dark" : ""}`
            : ""
        }`}
        style={{ ...themeStyle, ...trainingThemeStyle }}
        onClick={() => setShowSettingsMenu(false)}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0) 26%, rgba(15,64,54,0.035) 100%)",
          }}
        />
        <WatermarkLayer
          trainingMode={isTrainingMode}
          darkMode={themeMode === "dark"}
          demoMode={isDemoRoute}
        />
      <div className="relative z-10">
      <header className="border-b border-white/70 bg-[rgba(255,253,248,0.9)] backdrop-blur-xl px-4 md:px-6 py-4 shadow-[0_12px_30px_rgba(15,64,54,0.06)]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandMark darkMode={themeMode === "dark"} demoMode={isDemoRoute} />

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#0F4036]">
                Kitchen Display
              </h1>

              <p className="text-[#6A614F] mt-1 text-sm md:text-base">
                {isDemoRoute ? "Fake demo orders" : "Live Square orders"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start xl:items-end gap-3">
            <div className="grid grid-cols-2 gap-2 w-full xl:w-auto">
              <div className="rounded-2xl bg-white/80 border border-[#CA862B]/14 px-3 py-2 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-[#6A614F] font-bold">
                  Time
                </div>
                <div className="text-xl font-black text-[#111111]">
                  {new Date().toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 border border-[#CA862B]/14 px-3 py-2 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-[#6A614F] font-bold">
                  Date
                </div>
                <div className="text-xl font-black text-[#111111]">
                  {new Date().toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
              {isDemoRoute && (
                <a
                  href="/drinkflow-kds"
                  className="rounded-2xl border border-[#CA862B]/14 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
                >
                  Back to Learn More
                </a>
              )}

            <div className="relative" onClick={(event) => event.stopPropagation()}>
                {isDemoRoute && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-sm font-bold leading-5 text-[#0F4036] shadow-[0_18px_45px_rgba(15,64,54,0.16)]">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#CA862B]">
                      Demo tip
                    </div>
                    Click Settings, then Owner Reports Demo.
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-2xl border border-[#CA862B]/14 bg-white/75 px-1.5 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowSettingsMenu((current) => !current)}
                    className="rounded-xl border border-transparent bg-transparent px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                  >
                    Settings
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSettingsHelp({
                        title: "Settings",
                        body: SETTINGS_HELP_TEXT,
                      })
                    }
                    aria-label="Explain Settings"
                    title="Settings includes the main utility actions for the app."
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CA862B]/18 bg-white text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
                  >
                    ?
                  </button>
                </div>

                <SettingsPopover
                  open={showSettingsMenu}
                  onClose={() => setShowSettingsMenu(false)}
                  themeMode={themeMode}
                  onThemeToggle={() =>
                    setThemeMode((current) =>
                      current === "dark" ? "light" : "dark"
                    )
                  }
                  showDiningOnTickets={showDiningOnTickets}
                  onToggleDiningOnTickets={() =>
                    setShowDiningOnTickets((current) => !current)
                  }
                  onOwnerLogin={() => {
                    setShowSettingsMenu(false);
                    if (isDemoRoute) {
                      setSignedInOwner("Demo Owner");
                      setShowOwnerLogin(false);
                      setShowOwnerReports(true);
                    } else {
                      setSignedInOwner("");
                      setShowOwnerReports(false);
                      setShowOwnerLogin(true);
                    }
                  }}
                  ownerActionLabel={isDemoRoute ? "Owner Reports Demo" : "Owner Login"}
                  showPasswordAction={true}
                  onChangePassword={() => {
                    setShowSettingsMenu(false);
                    setPasswordError("");
                    setPasswordNotice("");
                    setShowPasswordModal(true);
                  }}
                  suggestFixHref={buildSupportMailto()}
                  onVersionClick={() => {
                    setShowSettingsMenu(false);
                    setShowReleaseNotes(true);
                  }}
                />
              </div>

              <a
                href="https://squareup.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#CA862B]/14 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
              >
                Square Dashboard
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-[#CA862B]/14 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
              >
                Sign out
              </button>
            </div>

            {signedInEmployee && (
              <div className="rounded-full border border-[#CA862B]/18 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#0F4036] shadow-sm">
                {signedInEmployee}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-3 md:p-4 space-y-4 max-w-[1900px] mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-[rgba(255,253,248,0.88)] border border-white/70 p-3 shadow-[0_16px_40px_rgba(15,64,54,0.08)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-[#6A614F] font-bold">
                  Mode
                </div>
                <div className="text-xl md:text-2xl font-black mt-1 text-[#111111]">
                  {isTrainingMode ? "Training" : "Live"}
                </div>
                <div className="text-sm text-[#6A614F] mt-1">
                  {isTrainingMode ? "Fake demo data" : "Production"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModeHelp({
                    title: "Training mode",
                    body: "Training mode swaps in fake practice orders and sample counts. It does not change live Square data.",
                  })
                }
                title="Training mode swaps in fake orders and counts so staff can practice without changing live Square data."
                aria-label="Training mode swaps in fake orders and counts so staff can practice without changing live Square data."
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#CA862B]/20 bg-white text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              >
                ?
              </button>
            </div>

            <div className="mt-3 inline-flex rounded-2xl border border-[#CA862B]/18 bg-[#EEE0C5]/45 p-1">
              <button
                type="button"
                onClick={() => {
                  if (!isDemoRoute) setIsTrainingMode(false);
                }}
                disabled={isDemoRoute}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  !isTrainingMode
                    ? "bg-[#0F4036] text-white"
                    : isDemoRoute
                      ? "bg-transparent text-[#0F4036]/45"
                      : "bg-transparent text-[#0F4036] hover:bg-white/70"
                }`}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setIsTrainingMode(true)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  isTrainingMode
                    ? "bg-[#0F4036] text-white"
                    : "bg-transparent text-[#0F4036] hover:bg-white/70"
                }`}
              >
                Training
              </button>
            </div>
          </div>

          <StatCard
            label="Connection"
            value={displayedConnectionStatus}
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

          <StatCard
            label="Avg Drink Time"
            value={displayedDrinkMakingTime.label}
            detail={
              displayedDrinkMakingTime.sampleSize
                ? `${displayedDrinkMakingTime.sampleSize} completed today`
                : "Starts after first completed drink"
            }
          />
        </section>

        {lastError && (
          <div className="rounded-xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
            {lastError}
          </div>
        )}

        {passwordNotice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 px-4 py-3 font-medium">
            {passwordNotice}
          </div>
        )}

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Today&apos;s Count</h2>
              <p className="text-sm text-[#6A614F]">
                Drink totals
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTodayCount((current) => !current)}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              {showTodayCount ? "Hide" : "Show"}
            </button>
          </div>

          {showTodayCount && (
            <DailyDrinkCount
              drinkCounts={displayedDrinkCounts}
              orderCount={displayedDrinkOrderCount}
            />
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowStats((current) => !current)}
            className="rounded-xl bg-[#0F4036] text-white px-4 py-3 font-black transition hover:bg-[#0b352d] shadow-[0_14px_30px_rgba(15,64,54,0.16)]"
          >
            {showStats ? "Hide Stats" : "View Stats"}
          </button>
        </div>

        {showStats && <DrinkStats reports={displayedDrinkReports} />}

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {STATUS_COLUMNS.map((column) => (
            <section
              key={column.key}
              className={`rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 border-t-4 ${column.accent} p-3 shadow-[0_16px_40px_rgba(15,64,54,0.08)] flex flex-col backdrop-blur-sm ${
                hasOpenTickets
                  ? "xl:h-[calc(100vh-300px)] xl:min-h-[380px]"
                  : "xl:h-[220px] xl:min-h-[220px]"
              }`}
            >
              <div className="flex items-center justify-between px-1 py-1.5 mb-2 shrink-0">
                <h2 className="text-lg xl:text-xl font-black text-[#111111]">
                  {column.label}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-black shadow-sm ${column.badge}`}
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
                      onDiningOptionChange={handleDiningOptionChange}
                      showDiningOption={showDiningOnTickets}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-8 text-center text-[#6A614F] font-semibold">
                    No tickets
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Completed Today</h2>
              <p className="text-sm text-[#6A614F]">
                Finished tickets
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompletedToday((current) => !current)}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              {showCompletedToday ? "Hide" : "Show"}
            </button>
          </div>

          {showCompletedToday && (
            <CompletedTransactions tickets={displayedCompletedTickets} />
          )}
        </section>

        <OrdersByDayLookup
          defaultDate={defaultLookupDate}
          collapsed={!showOrdersByDay}
          onToggle={() => setShowOrdersByDay((current) => !current)}
          trainingMode={isTrainingMode}
          trainingTickets={isTrainingMode ? displayedTickets : []}
        />
      </main>
      </div>

      <PasswordSettingsDialog
        open={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError("");
        }}
        onSubmit={handlePasswordChange}
        saving={passwordSaving}
        error={passwordError}
      />
    </div>
    );
  }

  return (
    <>
      {content}
      <ReleaseNotesDialog
        open={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
        onHideForNow={() => {
          setHiddenReleaseNotesVersion(APP_VERSION);
          setShowReleaseNotes(false);
        }}
      />
      <HelpDialog
        open={Boolean(modeHelp)}
        title={modeHelp?.title || ""}
        body={modeHelp?.body || ""}
        onClose={() => setModeHelp(null)}
      />
      <HelpDialog
        open={Boolean(settingsHelp)}
        title={settingsHelp?.title || ""}
        body={settingsHelp?.body || ""}
        onClose={() => setSettingsHelp(null)}
      />
      <OwnerLoginDialog
        open={showOwnerLogin}
        themeMode={themeMode}
        onClose={() => setShowOwnerLogin(false)}
        onLogin={(ownerName) => {
          setSignedInOwner(ownerName || "Owner");
          setShowOwnerLogin(false);
          setShowOwnerReports(true);
        }}
      />
      {showOwnerReports && (
        <OwnerReportsView
          ownerName={signedInOwner || "Owner"}
          themeMode={themeMode}
          demoMode={isDemoRoute}
          demoTickets={trainingTickets}
          onClose={() => {
            setSignedInOwner("");
            setShowOwnerReports(false);
          }}
        />
      )}
      <WebServicesReminderDialog
        open={showWebServicesReminder}
        onClose={() => setHideWebServicesReminder(true)}
      />
    </>
  );
}
