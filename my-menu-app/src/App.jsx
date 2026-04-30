import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || ""
  : "";
const LOGO_URL = "/goldies-logo.png";
const POLL_INTERVAL_MS = 3000;
const THEME_STORAGE_KEY = "goldies-kds-theme";
const TRAINING_MODE_STORAGE_KEY = "goldies-kds-training-mode";
const APP_VERSION = "v1.2.5";
const RELEASE_NOTES_HIDE_KEY = "goldies-kds-hidden-release-notes-version";
const WEB_SERVICES_REMINDER_HIDE_KEY =
  "goldies-kds-hidden-web-services-reminder";
const INSTALL_PROMPT_HIDE_KEY = "goldies-kds-hidden-install-prompt";
const SUPPORT_EMAIL = "samantha@studiosamantha.com";
const SOFT_OPENING_DATE = "2026-04-30";
const WEB_SERVICES_REMINDER_DATE = "2026-05-02";
const SETTINGS_HELP_TEXT =
  "Settings holds the app tools you may need: theme, password change, support, and release notes.";
const RELEASE_NOTES = [
  {
    version: "v1.2.5",
    date: "Current build",
    summary: "The app now clears old cached files so updates load cleanly.",
    items: [
      "Old cached files are cleared when a new version activates.",
      "This helps prevent blank screens after app updates.",
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

function getTodayDateKey() {
  return getLocalDateInputValue();
}

function SoftOpeningDialog({ open, onClose }) {
  if (!open) return null;

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
                Soft Opening
              </div>
              <h2 className="text-2xl font-black text-[#0F4036] mt-1">
                Congratulations, Goldie&apos;s
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
              Wishing you all the luck on your soft opening from Samantha and Zahra.
            </p>
          </div>

          <p className="text-base leading-7">
            We&apos;ll be by for coffee tomorrow morning to show support.
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
      <WatermarkLayer trainingMode={false} />

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
              Custom Square tools for coffee shops and small businesses that
              need a polished display, simple staff workflows, and a
              better-looking daily operation.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Live board",
                  text: "New, Making, Ready, Completed, and Done all stay visible at a glance.",
                },
                {
                  title: "Useful counts",
                  text: "Today&apos;s counts, drink stats, and completed totals are easy to compare.",
                },
                {
                  title: "Staff tools",
                  text: "Password controls, training mode, and support links stay built in.",
                },
                {
                  title: "Square sync",
                  text: "Orders and status updates stay connected to Square and Supabase.",
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
                <li>Live Square orders in a simple kitchen board</li>
                <li>Customer names and employee tracking when available</li>
                <li>Reports, history, and daily order lookup</li>
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
                Square shop.
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

  try {
    return window.localStorage.getItem(TRAINING_MODE_STORAGE_KEY) === "true";
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

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getBeverageCategory(itemName = "") {
  const name = String(itemName || "").trim();
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");

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

function TicketCard({ ticket, onStatusChange, onNameChange }) {
  const [nameValue, setNameValue] = useState(ticket.customerName || "");
  const orderTime = formatOrderTime(ticket.createdAt);
  const timeClass = getTimeClass(ticket.createdAt);
  const visibleItems = getVisibleItems(ticket);
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

          <div className="mt-2 inline-flex rounded-full bg-[#EEE0C5]/55 border border-[#CA862B]/18 px-3 py-1 text-xs font-black text-[#0F4036]">
            {ticket.diningOption}
          </div>
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

function WatermarkLayer({ trainingMode = false }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url(${LOGO_URL})`,
        backgroundRepeat: "repeat",
        backgroundSize: "240px auto",
        backgroundPosition: "center top",
        opacity: trainingMode ? 0.08 : 0.06,
        transform: "rotate(-8deg) scale(1.08)",
        transformOrigin: "center",
        mixBlendMode: "multiply",
        filter: trainingMode
          ? "hue-rotate(185deg) saturate(1.25) contrast(1.05)"
          : "grayscale(1) contrast(1.05)",
      }}
    />
  );
}

function BrandFooter({ className = "" }) {
  return (
    <div
      className={`relative z-30 inline-flex items-center rounded-full border border-white/70 bg-[rgba(255,253,248,0.84)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5A4F3E] shadow-[0_8px_18px_rgba(15,64,54,0.06)] backdrop-blur-md ${className}`}
    >
      <span>Studio Samantha © 2026</span>
      <span className="mx-2 text-[#CA862B]/70">•</span>
      <a
        href="/learn-more.html"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Learn more
      </a>
    </div>
  );
}

function InstallPromptCard({ open, isIos, onInstall, onDismiss }) {
  if (!open) return null;

  return (
    <div className="mt-5 rounded-2xl border border-[#CA862B]/18 bg-[#EEE0C5]/50 px-4 py-4 text-left shadow-[0_12px_28px_rgba(15,64,54,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Install app
          </div>
          <div className="mt-1 text-sm font-black text-[#0F4036]">
            Add Goldie&apos;s KDS to your home screen
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-[#CA862B]/18 bg-white px-2.5 py-1 text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
        >
          Not now
        </button>
      </div>

      <p className="mt-2 text-sm leading-6 text-[#2D261C]">
        {isIos
          ? "On iPhone or iPad, tap Share and then choose Add to Home Screen."
          : "Install it once and it opens like a home screen app on this device."}
      </p>

      <div className="mt-3">
        <button
          type="button"
          onClick={onInstall}
          className="rounded-xl bg-[#0F4036] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0b352d]"
        >
          {isIos ? "Show steps" : "Add to Home Screen"}
        </button>
      </div>
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
  onChangePassword,
  suggestFixHref,
  onVersionClick,
  showPasswordAction = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed left-1/2 top-1/2 z-50 w-[min(20rem,calc(100vw-1.5rem))] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:right-4 sm:left-auto sm:top-24 sm:translate-x-0 sm:translate-y-0 sm:w-[20rem] sm:max-h-[calc(100vh-6rem)]">
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

      <div className="p-3 space-y-2">
        <ModeToggle
          active={themeMode === "dark"}
          label={themeMode === "dark" ? "Light mode" : "Dark mode"}
          onToggle={onThemeToggle}
          hint="Switch between the light and dark dashboard themes."
        />

        {showPasswordAction && (
          <button
            type="button"
            onClick={onChangePassword}
            className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45 text-left"
          >
            Change Password
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
                                {ticket.diningOption || "Order"}
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
    runLookup(defaultDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingMode, trainingTickets]);

  return (
    <section className="space-y-2">
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
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 px-4 py-3">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
            />
            <button
              type="button"
              onClick={() => runLookup(date)}
              disabled={loading}
              className="rounded-xl bg-[#0F4036] text-white px-4 py-2 text-sm font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {loading ? "Looking up..." : "Lookup"}
            </button>
          </div>

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
                            {ticket.diningOption || "Order"}
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
                                      {ticket.diningOption || "Order"}
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

function LoginScreen({
  onLogin,
  themeMode,
  onThemeToggle,
  themeStyle,
  trainingStyle,
  settingsOpen,
  onToggleSettings,
  onCloseSettings,
  onSettingsHelp,
  onChangePassword,
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
      className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.96),_rgba(238,224,197,1)_50%,_rgba(230,210,173,1)_100%)] text-[#111111] flex items-start justify-center px-4 pt-20 sm:items-center sm:pt-0 overflow-hidden"
      style={{ ...themeStyle, ...trainingStyle }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0) 28%, rgba(15,64,54,0.03) 100%)",
        }}
      />
      <WatermarkLayer trainingMode={false} />
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
            showPasswordAction={false}
            suggestFixHref={suggestFixHref}
            onVersionClick={onVersionClickMenu}
          />
        </div>
      </div>

      <main className="relative z-10 w-full max-w-md rounded-[1.75rem] bg-[rgba(255,253,248,0.94)] border border-white/70 shadow-[0_28px_80px_rgba(15,64,54,0.14)] backdrop-blur-xl p-7 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <BrandMark size="lg" />
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

        <InstallPromptCard
          open={showInstallPrompt && authStatus === "login"}
          isIos={isIosInstall}
          onInstall={handleInstallAction}
          onDismiss={dismissInstallPrompt}
        />

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
            <h2 className="text-2xl font-black text-[#0F4036]">Change Password</h2>
            <p className="text-sm text-[#6A614F] mt-1">
              Requires the current password.
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
              {saving ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoldiesKDS() {
  const [themeMode, setThemeMode] = useState(getSavedThemeMode);
  const [isTrainingMode, setIsTrainingMode] = useState(getSavedTrainingMode);
  const [authStatus, setAuthStatus] = useState("checking");
  const [signedInEmployee, setSignedInEmployee] = useState("");
  const [tickets, setTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [drinkCounts, setDrinkCounts] = useState([]);
  const [drinkOrderCount, setDrinkOrderCount] = useState(0);
  const [drinkReports, setDrinkReports] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [showTodayCount, setShowTodayCount] = useState(false);
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [showOrdersByDay, setShowOrdersByDay] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [installHelp, setInstallHelp] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isIosInstall, setIsIosInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hideInstallPrompt, setHideInstallPrompt] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(INSTALL_PROMPT_HIDE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showPitch, setShowPitch] = useState(false);
  const [pitchHash, setPitchHash] = useState(() => {
    if (typeof window === "undefined") return "";

    return window.location.hash || "";
  });
  const [modeHelp, setModeHelp] = useState(null);
  const [settingsHelp, setSettingsHelp] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hideSoftOpeningNote, setHideSoftOpeningNote] = useState(false);
  const [hideWebServicesReminder, setHideWebServicesReminder] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(WEB_SERVICES_REMINDER_HIDE_KEY) === "true";
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
  const isSoftOpeningDay = getTodayDateKey() === SOFT_OPENING_DATE;
  const showSoftOpeningNote =
    authStatus === "login" && isSoftOpeningDay && !hideSoftOpeningNote;
  const isWebServicesReminderDay = getTodayDateKey() === WEB_SERVICES_REMINDER_DATE;
  const showWebServicesReminder =
    authStatus === "authenticated" &&
    isWebServicesReminderDay &&
    !hideWebServicesReminder;
  const isPitchRoute =
    pitchHash === "#learn-more" ||
    pitchHash === "#pitch-preview" ||
    (typeof window !== "undefined" &&
      window.location.search.includes("pitch-preview"));
  const trainingThemeStyle = isTrainingMode
    ? themeMode === "dark"
      ? {
          backgroundColor: "#020617",
          backgroundImage:
            "radial-gradient(circle at top, rgba(59,130,246,0.28), rgba(15,23,42,0.98) 52%, rgba(2,6,23,1) 100%)",
          color: "#dbeafe",
          colorScheme: "dark",
        }
      : {
          backgroundColor: "#eff6ff",
          backgroundImage:
            "radial-gradient(circle at top, rgba(147,197,253,0.38), rgba(219,234,254,0.94) 48%, rgba(191,219,254,1) 100%)",
          color: "#1d4ed8",
        }
    : undefined;
  const themeStyle =
    themeMode === "dark"
      ? {
          backgroundColor: "#0B1220",
          backgroundImage:
            "radial-gradient(circle at top, rgba(59,130,246,0.12), rgba(11,18,32,0.98) 48%, rgba(3,7,18,1) 100%)",
          color: "#E5E7EB",
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
      if (hideInstallPrompt) {
        window.localStorage.setItem(INSTALL_PROMPT_HIDE_KEY, "true");
      } else {
        window.localStorage.removeItem(INSTALL_PROMPT_HIDE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [hideInstallPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standaloneMatch =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    const iosMatch =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    setIsStandalone(Boolean(standaloneMatch));
    setIsIosInstall(Boolean(iosMatch));

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      if (!hideInstallPrompt && !standaloneMatch) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setInstallPromptEvent(null);
      setHideInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (!standaloneMatch && !hideInstallPrompt) {
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [hideInstallPrompt]);

  useEffect(() => {
    if (isStandalone || hideInstallPrompt || authStatus !== "login") {
      setShowInstallPrompt(false);
      return;
    }

    if (installPromptEvent || isIosInstall) {
      setShowInstallPrompt(true);
    }
  }, [authStatus, hideInstallPrompt, installPromptEvent, isIosInstall, isStandalone]);

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
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch(apiUrl("/api/session"), {
          credentials: "include",
        });
        const session = await response.json();

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

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || isTrainingMode) return undefined;

    let mounted = true;

    async function fetchBoardAndTodayCounts() {
      try {
        const [ticketsResponse, drinkResponse] = await Promise.all([
          fetch(apiUrl("/api/tickets"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/reports/drinks?range=today"), {
            credentials: "include",
          }),
        ]);

        if (ticketsResponse.status === 401 || drinkResponse.status === 401) {
          setAuthStatus("login");
          return;
        }

        if (!ticketsResponse.ok) {
          throw new Error(`Failed to fetch tickets: ${ticketsResponse.status}`);
        }

        if (!drinkResponse.ok) {
          throw new Error(`Failed to fetch drink report: ${drinkResponse.status}`);
        }

        const liveTickets = await ticketsResponse.json();
        const todayReport = await drinkResponse.json();

        if (!mounted) return;

        setTickets(liveTickets.map(normalizeTicket));
        setDrinkCounts(
          (todayReport.totalsByName || []).map((drink) => ({
            name: drink.name,
            qty: drink.qty,
          }))
        );
        setDrinkOrderCount(todayReport.orderCount || 0);
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
  const displayedDrinkReports = isTrainingMode
    ? buildTrainingReports(displayedTickets)
    : drinkReports;
  const displayedConnectionStatus = isTrainingMode
    ? "Training mode"
    : connectionStatus;
  const activeTickets = displayedTickets.filter((ticket) => ticket.status !== "done");
  const hasOpenTickets = activeTickets.length > 0;

  const handleInstallAction = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      await installPromptEvent.userChoice.catch(() => null);
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
      setHideInstallPrompt(true);
      return;
    }

    setInstallHelp({
      title: "Add to Home Screen",
      body: isIosInstall
        ? "On iPhone or iPad, tap the Share button in Safari and choose Add to Home Screen."
        : "This browser does not support the install prompt right now. Try using the browser menu to add the app to the home screen.",
    });
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setHideInstallPrompt(true);
  };

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
        className="relative min-h-screen bg-[#EEE0C5] text-[#111111] flex items-center justify-center px-4 overflow-hidden"
        style={themeStyle}
      >
        <WatermarkLayer trainingMode={isTrainingMode} />
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
          trainingStyle={trainingThemeStyle}
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
          suggestFixHref={buildSupportMailto()}
          onVersionClickMenu={() => {
            setShowSettingsMenu(false);
            setShowReleaseNotes(true);
          }}
        />
        <SoftOpeningDialog
          open={showSoftOpeningNote}
          onClose={() => setHideSoftOpeningNote(true)}
        />
      </>
    );
  } else {
    content = (
      <div
        className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.96),_rgba(238,224,197,1)_50%,_rgba(230,210,173,1)_100%)] text-[#111111] overflow-hidden"
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
        <WatermarkLayer trainingMode={isTrainingMode} />
      <div className="relative z-10">
      <header className="border-b border-white/70 bg-[rgba(255,253,248,0.9)] backdrop-blur-xl px-4 md:px-6 py-4 shadow-[0_12px_30px_rgba(15,64,54,0.06)]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandMark />

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#0F4036]">
                Kitchen Display
              </h1>

              <p className="text-[#6A614F] mt-1 text-sm md:text-base">
                Live Square orders
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
              <div className="relative" onClick={(event) => event.stopPropagation()}>
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
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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
                onClick={() => setIsTrainingMode(false)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  !isTrainingMode
                    ? "bg-[#0F4036] text-white"
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
          trainingTickets={displayedTickets}
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
      <HelpDialog
        open={Boolean(installHelp)}
        title={installHelp?.title || ""}
        body={installHelp?.body || ""}
        onClose={() => setInstallHelp(null)}
      />
      <WebServicesReminderDialog
        open={showWebServicesReminder}
        onClose={() => setHideWebServicesReminder(true)}
      />
    </>
  );
}
