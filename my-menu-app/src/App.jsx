import React, { useEffect, useMemo, useRef, useState } from "react";
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
const APP_VERSION = "v1.10.22";
const RELEASE_NOTES_HIDE_KEY = "goldies-kds-hidden-release-notes-version";
const CELEBRATION_HIDE_KEY = "goldies-kds-hidden-celebration";
const OWNER_REPORTS_NOTICE_HIDE_KEY = "goldies-kds-hidden-owner-reports-notice-v2";
const SUPPORT_EMAIL = "samantha@studiosamantha.com";
const POLICY_VERSION = "2026-05-08";
const POLICY_TYPE = "drinkflow_kds_privacy_data_handling_policy";
const POLICY_ACK_STORAGE_KEY = "goldies-kds-policy-acknowledgment";
const POLICY_REMINDER_STORAGE_KEY = `goldies-kds-policy-reminder-${POLICY_VERSION}`;
const GOLDIES_POLICY_CONTEXT = {
  businessName: "Goldie's",
  productName: "DrinkFlow Kitchen Display Systems (KDS)",
  policyType: POLICY_TYPE,
  policyVersion: POLICY_VERSION,
  policyScope: "Goldie's KDS and owner/admin dashboard",
};
const SOFT_OPENING_DATE = "2026-04-29";
const SETTINGS_HELP_TEXT =
  "Settings has the app tools: theme, password change, support, and release notes.";
const DINING_OPTIONS = ["HANGIN' OUT", "TAKING OFF", "Pickup", "Delivery", "Drive thru"];
const DAILY_UPDATE_NOTICE = {
  id: APP_VERSION,
  eyebrow: "Today on the KDS",
  title: "Square history backfill is safer",
  message:
    "The KDS can refill recent Square order history into primary storage after a temporary storage interruption.",
  note:
    "Backfilled orders keep their Square status so old completed tickets do not return to the active kitchen board.",
};
const OWNER_PORTAL_RECENT_CHANGES = [
  {
    title: "Square history backfill",
    body:
      "Recent Square order history can be safely refilled into primary storage after a temporary interruption, with old completed orders kept off the live board.",
  },
  {
    title: "Degraded mode ticket actions",
    body:
      "When the KDS is temporarily using live memory fallback, staff can still clear tickets, mark drinks done, and update ticket details.",
  },
  {
    title: "Emergency KDS fallback",
    body:
      "If primary storage is unavailable, Square sync now keeps active tickets in server memory so the kitchen screen can continue in a temporary degraded mode.",
  },
  {
    title: "Report downloads",
    body:
      "End-of-day report email has been removed. CSV, Excel, and PDF downloads are the supported report path, now with This Quarter and Custom date ranges for tax and owner review periods.",
  },
  {
    title: "Unique ordering photos",
    body:
      "Self Order Kiosk and Online Orders now use a different generated photo for every current drink menu item.",
  },
  {
    title: "Customer tools wording",
    body:
      "The ordering and display links now read as customer tools, while the internal route stays compatible with existing links.",
  },
  {
    title: "Policy wording alignment",
    body:
      "The public policy and DrinkFlow pages now use Owner Reports wording, including the demo/training reports section that confirms sample data only.",
  },
  {
    title: "Owner Reports button",
    body:
      "Owner Reports now lives as a top-level KDS button instead of being hidden inside Settings. Training mode opens the demo reports directly without the owner password prompt.",
  },
  {
    title: "Compact privacy card",
    body:
      "Privacy & Agreements now opens collapsed in Owner Reports, and the policy acknowledgment prompt happens after KDS sign-in instead of reopening inside Owner Reports.",
  },
  {
    title: "Current Square drink menu",
    body:
      "Menu Board, availability toggles, self-order kiosk, online pickup, and fallback drink lists now match Square's current Coffee, Not Coffee, and Smoothies names and prices.",
  },
  {
    title: "Ordering photos and details",
    body:
      "Self Order Kiosk and Online Ordering now use the added drink photos for Americano, Cappuccino, Chai Latte, and Hot Chocolate, plus drink-specific detail copy instead of generic checkout text.",
  },
  {
    title: "Timing report clarity",
    body:
      "Timing reports now state that they measure staff Start-to-Ready taps, so unusually short handcrafted-drink samples point to workflow timing rather than actual prep speed.",
  },
  {
    title: "Volume Board drinks made",
    body:
      "Volume Board now shows drink orders and drinks made side by side, plus average drinks per order and peak-hour drink units.",
  },
  {
    title: "Private recipe cards",
    body:
      "Staff recipe cards now open through a signed-in KDS viewer, block plain copied links, and tell browsers not to cache the files.",
  },
  {
    title: "Orders Up item progress",
    body:
      "Individual drinks checked off on Focus Board now carry through to Orders Up with a done mark and crossed-off drink name.",
  },
  {
    title: "Focus Board readability",
    body:
      "Focus Board now uses larger order text, larger modifier text, bigger touch buttons, and two side-by-side columns on portrait iPads.",
  },
  {
    title: "Smoothie category check",
    body:
      "The KDS now checks Square's Coffee, Not Coffee, and Smoothies categories so renamed smoothie items do not disappear from service tickets.",
  },
  {
    title: "Square sync audit",
    body:
      "The dashboard Connection report now shows Square orders found, created, updated, failed, and suspicious pickup-name flags.",
  },
  {
    title: "Safer Square imports",
    body:
      "Drink labels like STRAWMANGO are now normalized as drinks and blocked from becoming pickup names.",
  },
  {
    title: "Regression checks",
    body:
      "CI now runs backend tests for Square name cleanup, drink classification, and owner report add-on math before future deploys.",
  },
  {
    title: "View Stats mobile cleanup",
    body:
      "The View Stats report, range toggles, drink breakdown, and timing report now fit better on phones, iPads, and desktop screens.",
  },
  {
    title: "Deeper owner downloads",
    body:
      "Owner report downloads now include CPA, inventory, hourly, order-detail, and non-drink add-on signals while keeping the PDF polished.",
  },
  {
    title: "Owner guidance",
    body:
      "Sales read and next-step guidance now rotate daily so the owner view feels less repetitive while keeping the same report numbers.",
  },
  {
    title: "Ordering screens",
    body:
      "Self Order Kiosk and Online Ordering now share a cleaner photo-menu style, with better drink photos and a more polished checkout flow.",
  },
  {
    title: "Responsive cleanup",
    body:
      "Connection reports, release notes, owner login, item details, and ordering checkout panels now scroll cleanly on phones, iPads, and desktop screens.",
  },
  {
    title: "Owner reports cleanup",
    body:
      "Customer insights and Today's Snapshot are now collapsible so the owner report is easier to scan during service.",
  },
  {
    title: "Connection tracking",
    body:
      "The dashboard Connection box can open a report with Square health, sync state, and downtime tracking notes.",
  },
];
const RELEASE_NOTES = [
  {
    version: "v1.10.22",
    date: "Current build",
    summary: "Added safer Square history backfill support.",
    items: [
      "Manual Square sync can now backfill a chosen recent date window into primary storage.",
      "Backfilled completed orders use their Square status so old tickets do not reappear as new active tickets.",
      "The sync summary records the backfill window for easier recovery checks.",
    ],
  },
  {
    version: "v1.10.21",
    date: "Previous build",
    summary: "Kept ticket actions working during storage interruptions.",
    items: [
      "Done, Ready, Start, drink checkoffs, customer names, and dining labels now update in temporary memory fallback mode.",
      "Tickets shown during degraded mode can be cleared from the kitchen screen instead of getting stuck.",
      "The v1.10.20 live-ticket storage fallback remains in place.",
    ],
  },
  {
    version: "v1.10.20",
    date: "Previous build",
    summary: "Added a temporary storage fallback for live tickets.",
    items: [
      "When primary storage is unavailable, Square orders can still appear in the KDS from server memory.",
      "The fallback keeps the kitchen usable during a storage interruption, while owner history and reports resume when storage is restored.",
      "The v1.10.19 Owner Reports export cleanup and unique ordering images remain in place.",
    ],
  },
  {
    version: "v1.10.19",
    date: "Previous build",
    summary: "Cleaned up report exports and customer ordering images.",
    items: [
      "Owner Reports now includes This Quarter and Custom date ranges for the main report, timing report, CSV, Excel, and PDF exports.",
      "The old end-of-day report email form has been removed so downloads stay the reliable reporting path.",
      "Customer tools now uses Online Orders wording in the visible owner and ordering screens.",
      "Self Order Kiosk and Online Orders now use a unique generated image for each current drink menu item.",
      "The v1.10.18 Owner Reports policy wording alignment remains in place.",
    ],
  },
  {
    version: "v1.10.18",
    date: "Previous build",
    summary: "Aligned Owner Reports wording across policy and public pages.",
    items: [
      "The public policy now calls the demo/training area Owner Reports instead of Owner Portal.",
      "The DrinkFlow public page now uses Owner Reports across pricing, feature copy, and demo screenshots.",
      "The policy wording continues to state that demo/training reports use fake/sample data only and do not connect to Goldie's live Square data.",
      "The v1.10.17 Owner Reports, View Stats, menu-source cleanup, and Square service-label filtering changes remain in place.",
    ],
  },
  {
    version: "v1.10.17",
    date: "Previous build",
    summary: "Renamed the visible owner area to Owner Reports.",
    items: [
      "Owner Reports is now the visible label on the login screen, dashboard button, settings action, and training-mode reports entry.",
      "Customer ordering no longer shows Square dining/service labels like Hangin' Out or Taking Off as drink additions.",
      "View Stats now uses shared compact range controls and avoids horizontal overflow when the window is narrowed.",
      "Static drink names, prices, categories, and fallback ordering groups now share fewer duplicated lists.",
      "The v1.10.16 menu, owner report, photo, and timing-report changes remain in place.",
    ],
  },
  {
    version: "v1.10.16",
    date: "Previous build",
    summary: "Cleaned up Owner Reports, policy acknowledgments, menus, ordering photos, and Volume Board totals.",
    items: [
      "Owner Reports now has its own top-level KDS button and the user-facing label no longer says Owner Login.",
      "Training mode now opens demo reports directly with sample owner numbers and no owner password prompt.",
      "Privacy & Agreements opens collapsed in Owner Reports and only shows detailed policy/status rows when expanded.",
      "The policy acknowledgment dialog now appears after KDS sign-in when the current policy version has not been acknowledged, instead of reopening from Owner Reports.",
      "Menu Board and menu availability toggles now build directly from Square's current Coffee, Not Coffee, and Smoothies categories with current names and prices.",
      "Self-order kiosk uses the full in-shop Square drink menu, while online pickup keeps hang-out-only drinks filtered out.",
      "Self-order kiosk and online ordering now use the added drink photos and drink-specific detail text for the supported drink names.",
      "Timing reports now clarify that the numbers measure staff Start-to-Ready taps.",
      "Volume Board now shows Drinks made beside Drink orders, with peak-hour drink units included.",
    ],
  },
  {
    version: "v1.10.15",
    date: "Previous build",
    summary: "Showed Focus Board drink checkoffs on Orders Up.",
    items: [
      "Orders Up now receives individual drink done state from the KDS backend.",
      "Checked-off drinks show with a checkmark, crossed-off drink name, and Done label on the pickup display.",
      "Focus Board now uses larger order text, larger modifier text, bigger touch buttons, and two side-by-side columns on portrait iPads.",
      "The regular full dashboard keeps its Back button for cases where staff need to move a ticket back.",
      "Private recipe cards now open inside the signed-in KDS and no longer expose reusable direct links.",
      "Goldie's display boards and public pages got a responsive overflow cleanup for narrow phone and tablet screens.",
      "Backend regression coverage now verifies Orders Up keeps individual drink done state.",
    ],
  },
  {
    version: "v1.10.14",
    date: "Previous build",
    summary: "Kept Square-renamed smoothies visible in KDS.",
    items: [
      "Smoothie names from Square, including STRAWBERRY MANGO and size labels like 16 OZ or 12 OZ KIDS, now classify as Smoothies.",
      "The KDS keeps the current Square item names and only cleans the casing for display, such as Strawberry Mango (16 oz).",
      "System checks now audit Square's Coffee, Not Coffee, and Smoothies categories against KDS drink classification.",
      "Roller Roller Coaster dependencies were removed from the Goldie's app package because that game is a separate project.",
    ],
  },
  {
    version: "v1.10.13",
    date: "Previous build",
    summary: "Added Goldie's owner privacy acknowledgment and a safe demo reports view.",
    items: [
      "Goldie's owner/admin dashboard now has a lightweight policy acknowledgment flow for the 2026-05-08 Privacy & Data Handling Policy.",
      "Owner Reports includes a Privacy & Agreements card for policy status, case study boundaries, domain reminders, and daily checks.",
      "The /demo/owner reports view uses fake sample data only and is clearly labeled for school projects, public demos, screenshots, portfolio use, and walkthroughs.",
      "Demo owner reports now use generic DrinkFlow Demo Cafe branding and never use Goldie's live Square data, logo, recipes, customer/order data, or private financials.",
    ],
  },
  {
    version: "v1.10.12",
    date: "Previous build",
    summary: "Added sync audit details to the Connection report.",
    items: [
      "Connection report now shows the last Square sync context, orders found, created, updated, saved, and failed.",
      "Connection report now flags suspicious pickup names when a drink label appears where a customer name should be.",
      "Manual Square sync also records the same summary counts.",
    ],
  },
  {
    version: "v1.10.11",
    date: "Previous build",
    summary: "Added Square normalization regression checks.",
    items: [
      "Drink labels like STRAWMANGO now normalize to Refresher - Strawberry Mango instead of being treated as pickup names.",
      "Backend regression tests now cover customer-name cleanup, smoothie/refresher classification, and owner report non-drink add-on math.",
      "GitHub CI now runs backend tests, backend syntax checks, and the frontend production build.",
    ],
  },
  {
    version: "v1.10.10",
    date: "Previous build",
    summary: "Cleaned up View Stats on mobile and report email handling.",
    items: [
      "View Stats now uses tighter mobile controls and cards so drink stats and timing reports fit better on phones, iPads, and desktop screens.",
      "End-of-day PDF report email now prefers Resend when configured instead of relying only on Outlook SMTP.",
      "If Microsoft 365 blocks SMTP AUTH, Owner Reports now shows a plain-English error instead of the raw Outlook failure.",
      "Owner report downloads now include detailed CPA, inventory, hourly, order-detail, and non-drink add-on sections.",
    ],
  },
  {
    version: "v1.10.9",
    date: "Previous build",
    summary: "Cleaned up edited drink names across dashboards and ordering.",
    items: [
      "Today's Count, Drink Stats, Average Drink Time, display boards, Online Ordering, and Self Order Kiosk now use readable drink names instead of raw all-caps Square names.",
      "Kids-size smoothie variants roll into the main smoothie name so counts stay readable.",
      "Connection reports, release notes, owner login, item details, and ordering checkout panels now scroll cleanly on phones, iPads, and desktop screens.",
      "Owner Reports now keeps Customer insights and Today's Snapshot collapsible so the report is easier to scan.",
      "Square checkout still uses the original Square item IDs and variation IDs.",
    ],
  },
  {
    version: "v1.10.8",
    date: "Previous build",
    summary: "Restored smoothie items to drink workflows.",
    items: [
      "Smoothies now count as drink items even when Square sends all-caps names or kids-size labels.",
      "Mango, Strawberry, Greens, Strawberry Banana, and Chocolate P/B Banana variants now stay visible on KDS and display boards.",
    ],
  },
  {
    version: "v1.10.7",
    date: "Previous build",
    summary: "Added retry and safe recovery to cloud checks.",
    items: [
      "Cloud system checks now retry once after a failure before treating it as a real incident.",
      "If the retry also fails, the workflow can trigger a safe Render redeploy when the deploy-hook secret is configured.",
      "The workflow still fails after repeated trouble so GitHub can alert instead of silently hiding the issue.",
      "A production runbook now documents what is safe to automate and what still needs human review.",
    ],
  },
  {
    version: "v1.10.6",
    date: "Previous build",
    summary: "Added cloud-scheduled production system checks.",
    items: [
      "GitHub now runs Goldie's production system check every 5 minutes from the cloud, including before opening and after close.",
      "The scheduled check verifies health, login, active tickets, daily reports, display boards, staff SOP access, and kiosk menu images.",
      "Downtime and recovery state are saved between scheduled runs so incidents are easier to review later.",
      "The authenticated checks need the GOLDIES_KDS_PASSWORD repository secret to stay set in GitHub.",
    ],
  },
  {
    version: "v1.10.5",
    date: "Previous build",
    summary: "Made owner sessions easier to tuck away.",
    items: [
      "Owner Reports now labels recent access as Owner sessions and keeps the session details collapsed until opened.",
      "The sessions area now reads like a quiet security summary instead of another always-open tool.",
    ],
  },
  {
    version: "v1.10.4",
    date: "Previous build",
    summary: "Tightened Owner Reports wording and varied the daily owner read.",
    items: [
      "Owner Reports recent changes now start collapsed so the main report stays first.",
      "Sales read and What you should do next now rotate daily based on date, range, category mix, order count, and ticket value.",
      "The confusing Owner tools shortcut strip was removed; existing report actions stay where they already worked.",
      "Weather, local events, and Goldie's news mentions are tracked as the next owner-context sources to add, using public sources such as Exira Public Library, Exira Community Club, Exira Community Center events and rentals, City of Exira updates, TJ's Pourhouse events, local business-hosted events like yoga in the park, civic groups, churches, local news, and other public listings.",
    ],
  },
  {
    version: "v1.10.3",
    date: "Previous build",
    summary: "Cleaned up Owner Reports, connection reporting, and customer ordering visuals.",
    items: [
      "Owner Reports now opens with the main report first and keeps recent changes and owner tools collapsible.",
      "Owner Reports recent changes can collapse, while exports, customer-ordering links, and access checks stay in the main report area where they already worked.",
      "Owner Reports now has one clear exit button instead of separate Back and Sign out buttons doing the same thing.",
      "The dashboard Connection box now opens a connection report with Square health, sync state, cached ticket count, and downtime tracking notes.",
      "Self Order Kiosk and Online Ordering now share the same refined Goldie's photo-menu style.",
      "Owner Reports recent changes now call out the improved self-order and online ordering screens for owners.",
      "Smoothie fallback images now vary by drink title instead of reusing one generic smoothie photo.",
      "Periodic system checks can now write a local downtime and recovery log when GOLDIES_TRACK_UPTIME=1 is enabled.",
      "The production update rules now require downtime/recovery tracking for operational incidents.",
    ],
  },
  {
    version: "v1.10.1",
    date: "Previous build",
    summary: "Fixed the Orders Up recently completed list for live service.",
    items: [
      "Orders Up now pulls completed drink tickets from today's saved order lookup before falling back to active tickets.",
      "The recently completed display now matches the same production data path used by day lookup, owner stats, and drink counts.",
      "The Staff tools shortcut area stays focused on private recipe cards; the menu-toggle shortcut was removed.",
      "Production update rule: owner reports notes, visible version notes, and the public case study should be updated with each live-facing change.",
    ],
  },
  {
    version: "v1.10.0",
    date: "Previous build",
    summary: "Stabilized the production Square sync path during live service.",
    items: [
      "The live board now falls back to today's stored active tickets if the direct active-ticket request fails.",
      "The active board filters to New, Making, and Ready so completed history does not crowd service.",
      "System health now exposes Square sync state so production checks can tell the difference between app health and connector lag.",
      "Display boards and report windows now have quick switchers so staff can jump between related views without returning to the dashboard first.",
      "This is still the stabilized production build; the Square OAuth connect flow remains the next major release.",
    ],
  },
  {
    version: "v1.9.9",
    date: "Previous build",
    summary: "Finished the dashboard cleanup and refreshed the public story copy.",
    items: [
      "View Stats, Displays, and Focus Board now stay grouped together, while the fullscreen toggle stays small and out of the way.",
      "The public case study and login popup now match the cleaned-up dashboard version.",
      "Menu availability toggles, owner access logs, and customer note retention still follow the tighter day-by-day workflow.",
      "The developer route is still available through the Vercel rewrites for the private Studio Samantha workspace.",
    ],
  },
  {
    version: "v1.9.6",
    date: "Previous build",
    summary: "Added a Studio Samantha dashboard and owner report email tools.",
    items: [
      "A private Studio Samantha dashboard can save developer notes, update ideas, and diary entries.",
      "Notes can be tagged for GoldiesKDS, DrinkFlowKDS, Studio Samantha, Ignite Wonder, or VendorFlow.",
      "Notes can be marked for popups, owner reports updates, release notes, case studies, landing pages, or internal ideas.",
      "The dashboard uses a playful rainbow style so it feels like Studio Samantha instead of a shop operations screen.",
      "Owner Reports now has a practice end-of-day email field for sending the selected PDF report.",
      "Dense Owner Reports timing and category details are collapsed by default so the main read is easier to scan.",
      "Owner Reports now has a collapsed access check showing recent owner logins when the access log table is installed.",
    ],
  },
  {
    version: "v1.9.5",
    date: "Previous build",
    summary: "Cleaned up daily notes and pickup communication.",
    items: [
      "Customer insights on the dashboard now behave like daily KDS data and only show notes from today.",
      "Older customer insight notes remain archived in Supabase for owner review.",
      "Orders Up now gives customers a clear pickup button when their ready order is still on the board.",
      "Ready orders are automatically cleared after two minutes so they do not sit on the board all day.",
      "Average drink time now measures the making-to-ready workflow instead of waiting for pickup completion.",
      "Average drink time can now expand into hourly, range, and drink-name timing breakdowns.",
      "Focus Board now has a fast Order complete action for making tickets.",
      "Retail-only tickets in order lookup now read Retail items only instead of showing New.",
    ],
  },
  {
    version: "v1.9.4",
    date: "Previous build",
    summary: "Improved live display names and always-on display behavior.",
    items: [
      "KDS and Orders Up now use a customer name from item notes when Square does not provide a customer name.",
      "Customer-facing display boards request Chrome screen wake lock while open so full-screen boards can stay on.",
      "Saturday owner stats use Goldie's 8 AM-1 PM service window.",
      "Making tickets can now check off individual drinks and move to Ready once all drinks are finished.",
    ],
  },
  {
    version: "v1.9.3",
    date: "Previous build",
    summary: "Cleaned up online order option groups.",
    items: [
      "Americano and similar drinks now show Temperature and Size as separate required sections.",
      "Drink additions now stays focused on actual add-ons like flavors, milk, cold foam, and extra shots.",
      "Duplicate add-on names from overlapping Square modifier lists are collapsed for a cleaner customer order flow.",
    ],
  },
  {
    version: "v1.9.2",
    date: "Previous build",
    summary: "Tightened customer ordering and display routing.",
    items: [
      "Self Order Kiosk now has a direct app route.",
      "Online Orders display now filters to true online pickup orders only.",
      "Orders Up keeps a clear Online or In person label on customer-facing order cards.",
      "Mixed Square modifier lists are separated into Temperature, Size, and Drink additions for customer ordering.",
      "The public pages now reflect online ordering, self-order kiosk, and a la carte customer-facing display options.",
    ],
  },
  {
    version: "v1.9.1",
    date: "Previous build",
    summary: "Cleaned up drink choices and added a kiosk ordering path.",
    items: [
      "Online Ordering now removes for-here-only espresso, gibraltar, and pour over drinks.",
      "Americano and latte now require a hot or iced choice when ordered online.",
      "Hot-only drinks such as drip, drip refill, flat white, and cappuccino stay hot in the online flow.",
      "Temperature and size choices are shown separately from drink additions in the cart.",
      "A Self Order Kiosk route now uses the same menu and checkout flow as online ordering.",
    ],
  },
  {
    version: "v1.9.0",
    date: "Previous build",
    summary: "Added the first real online ordering path.",
    items: [
      "Owner Reports now links to a customer-facing Online Ordering page where testers can build a drink pickup order.",
      "The order page sends selected drinks to Square Checkout so a paid test order can flow back into the KDS.",
      "New online pickup tickets now show a red pending-order alert with placed time and drink details.",
      "Orders Up now labels Online versus In person orders.",
      "Orders Up now shows drinks currently being made, not just orders that are ready.",
      "The dashboard now has a Customer insights note area for small customer/menu requests.",
      "Online Ordering can read Square catalog drink options and estimate ASAP pickup time from queue depth.",
      "The ordering flow keeps menu prices controlled by the backend instead of trusting browser-entered prices.",
      "The sign-in update message now tells owners what changed in the KDS before they start service.",
    ],
  },
  {
    version: "v1.8.3",
    date: "Previous build",
    summary: "Added service-window guidance and a volume display.",
    items: [
      "Owner Reports now reads Today Snapshot against Goldie's 7 AM-3 PM Central service window.",
      "Before opening, during service, and after close now get different owner guidance.",
      "Today pacing now mentions how far through the service window the shop is.",
      "Displays now includes a Volume Board with hourly order volume, drink mix, average drinks, and 2+ drink rate.",
    ],
  },
  {
    version: "v1.8.2",
    date: "Previous build",
    summary: "Added a drive-thru display path.",
    items: [
      "The dashboard now has a Displays menu with Menu Board, Orders Up, and Drive Thru links.",
      "The new display only shows Pickup and Drive thru drink orders.",
      "The display uses simple status labels, drink details, and car graphics so customers can read it at a glance.",
    ],
  },
  {
    version: "v1.8.1",
    date: "Previous build",
    summary: "Cleaned up wording across the app.",
    items: [
      "App labels, public pages, survey wording, policy copy, and release notes got a consistency pass.",
      "Demo and training labels now use calmer, more consistent language.",
      "Menu Board and Orders Up now hide the full-screen X and the normal Live Display/Updated status strip while running cleanly.",
      "Pricing and source-code wording now line up better across the public pages.",
    ],
  },
  {
    version: "v1.8.0",
    date: "Previous build",
    summary: "Made Focus Board denser for busy service.",
    items: [
      "The Drink Menu board now uses smaller headers, tighter spacing, and denser menu rows so more fits on an iPad.",
      "Orders Up now uses more compact pickup cards and smaller display headers.",
      "Focus Board now shows compact drink-first ticket cards so staff can see more orders before scrolling.",
      "Non-drink items are collapsed into a small hidden-items note on Focus Board while the full dashboard keeps the complete ticket detail.",
      "The Learn More and case study pages got a lighter copy pass so the public wording feels less stiff.",
    ],
  },
  {
    version: "v1.7.10",
    date: "Previous build",
    summary: "Clarified monthly and annual pricing.",
    items: [
      "The Learn More page now shows DrinkFlow KDS as $6.99/month or $60/year.",
      "DrinkFlow Lite pricing now makes the discounted $25/year option clearer beside $2.99/month.",
      "The savings copy now compares monthly and annual plans more accurately.",
    ],
  },
  {
    version: "v1.7.9",
    date: "Previous build",
    summary: "Added drink details to the Orders Up display.",
    items: [
      "Orders Up now shows the order number, customer name when available, and drink-only item details.",
      "The customer display keeps non-drink retail and food items off the pickup screen.",
      "Ready and recently picked-up orders both use the customer-safe drink summary.",
    ],
  },
  {
    version: "v1.7.8",
    date: "Previous build",
    summary: "Added an owner reports example to the case study.",
    items: [
      "The Goldie's case study now shows an example Drink Revenue Dashboard.",
      "The example highlights drink revenue, peak hour, average drinks, 2+ drink order rate, hourly volume, drink mix, and report exports.",
      "This helps show why Owner Reports belongs in the full DrinkFlow KDS plan.",
    ],
  },
  {
    version: "v1.7.7",
    date: "Previous build",
    summary: "Renamed the active-ticket mode and cleaned up full screen.",
    items: [
      "The active-ticket mode is called Focus Board so staff can quickly switch into the three-column rush layout.",
      "Full screen mode now keeps extra display controls out of the way and shows a small X to exit.",
      "The main KDS board still uses New Tickets, Making, and Ready as the active workflow.",
      "Marketing visuals were refreshed to match the current three-column app layout.",
    ],
  },
  {
    version: "v1.7.6",
    date: "Previous build",
    summary: "Added a focused active-ticket board.",
    items: [
      "The main KDS board now shows New Tickets, Making, and Ready only.",
      "The redundant Completed column was removed from the active board.",
      "A Focus Board toggle near the Kitchen Display title hides the extra dashboard sections so staff can see only active ticket columns during a rush.",
      "The dashboard keeps completed history and extra stats available outside focus mode.",
    ],
  },
  {
    version: "v1.7.5",
    date: "Previous build",
    summary: "Added customer-facing display boards.",
    items: [
      "The dashboard now has quick buttons for a branded menu board and a customer orders-up display.",
      "The menu board shows Goldie's Coffee, Not Coffee, and Smoothies sections with prices from Square when available.",
      "The customer display shows ready order numbers and can be expanded into a customer-safe pickup board.",
      "DrinkFlow marketing now includes customer-facing display boards as an a la carte enhancement.",
    ],
  },
  {
    version: "v1.7.4",
    date: "Previous build",
    summary: "Added the themed shop survey and Lite preview.",
    items: [
      "The marketing site now has a DrinkFlow-themed survey page that can save responses to Supabase.",
      "The survey includes contact name, shop name, email, POS, screen, pricing, and feature questions.",
      "The Learn More page now shows an example of what DrinkFlow Lite looks like: live KDS columns without the owner reports or custom domain.",
      "The hero and Lite pricing now show a $2.99/month starting point.",
      "The a la carte section now gives clearer examples of small post-launch improvements.",
      "The survey and landing page now mention the first month of DrinkFlow Lite free after survey completion and onboarding.",
    ],
  },
  {
    version: "v1.7.3",
    date: "Previous build",
    summary: "Added the POS-flexible marketing message.",
    items: [
      "The Learn More page now explains that DrinkFlow is built first for Square, with Shopify, Clover, Lightspeed, and other POS workflows as possible future paths.",
      "The FAQ now says new POS connectors depend on accessible order data, APIs, or webhooks.",
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
      "Goldie's is documented as the first live customer for this setup.",
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
      "Owner Reports now includes hourly drink volume, daily rotating coffee-shop guidance, and CSV download support.",
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
      "Ticket cards now let staff set HANGIN' OUT, TAKING OFF, Pickup, Delivery, or Drive thru directly.",
      "Service labels can also be inferred from Square item notes like to go or for here.",
    ],
  },
  {
    version: "v1.5.8",
    date: "Previous build",
    summary: "Kept food-only tickets out of the drink KDS columns.",
    items: [
      "The live ticket workflow now only shows orders with drink items.",
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
      "The owner password can be reset later if an owner forgets it.",
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
      "The top dashboard now shows Avg Drink Time for drink orders timed at the bar.",
      "The backend records KDS status taps to measure Making to Ready time.",
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
      "Need help with Goldie's KDS.",
      "",
      "What were you doing:",
      "",
      "What happened:",
      "",
      "Device or browser:",
      "",
      "Thanks,",
      "",
    ].join("\n")
  );

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function buildOwnerPasswordResetMailto(ownerName = "Owner") {
  const subject = encodeURIComponent("Goldie's KDS Owner Reports password reset");
  const body = encodeURIComponent(
    [
      "Hi Samantha,",
      "",
      "Please reset the Goldie's KDS Owner Reports password.",
      "",
      `Requested by: ${ownerName || "Owner"}`,
      "",
      "This message is from an approved Blake or Claire email address.",
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
        "Wishing you all the luck on your soft opening.",
      note: "You can stop by for coffee tomorrow morning to show support.",
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
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
      <div className="relative mx-auto my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10">
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
              What changed
            </div>
            <p className="mt-2 text-base leading-7">
              {celebration.message}
            </p>
          </div>

          <div className="rounded-2xl border border-[#0F4036]/10 bg-white px-4 py-3">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#0F4036]">
              Useful for today
            </div>
            <p className="mt-2 text-base leading-7">
              {celebration.note}
            </p>
          </div>

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
      <style>{`
        @keyframes soft-pop {
          0% { transform: translateY(10px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative mx-auto my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] animate-[soft-pop_220ms_ease-out] sm:my-10">
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
            Keep Goldie's in mind if you ever decide you need a website or any
            design help - Sammy.
          </p>

          <div className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Website services
            </div>
            <p className="mt-2 text-sm leading-6 text-[#2D261C]">
              Custom websites, branded ordering pages, launch pages, logo
              support, and small design updates for Square shops that want a
              cleaner online presence.
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative mx-auto my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10">
        <div className="border-b border-[#CA862B]/18 bg-[#EEE0C5]/35 px-5 py-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Goldie&apos;s KDS Update
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
            Reports and display boards are live
          </h2>
        </div>

        <div className="space-y-4 px-5 py-5 text-[#2D261C]">
          <p className="text-base leading-7">
            Owner Reports can download CSV, Excel, or branded PDF reports. The dashboard also has
            Menu Board and Orders Up buttons for customer-facing displays.
          </p>
          <div className="rounded-2xl border border-[#CA862B]/18 bg-white px-4 py-3">
            <div className="text-sm font-black text-[#0F4036]">
              Where to find everything
            </div>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
              Owner Reports is now a top dashboard button. Menu Board and Orders Up are in the
              Displays menu and can be opened on a customer-facing screen.
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
              Open Owner Reports
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="mx-auto my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10">
        <div className="flex flex-col gap-3 border-b border-[#CA862B]/18 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Release Notes
            </div>
            <h2 className="text-2xl font-black text-[#0F4036]">What&apos;s changed</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="mx-auto my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10">
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

function ConnectionReportDialog({
  open,
  report,
  loading,
  error,
  backfillLoading,
  backfillResult,
  onBackfill,
  onClose,
  onRefresh,
}) {
  if (!open) return null;

  const square = report?.squareApi || {};
  const syncSummary = square.lastSyncSummary || {};
  const suspiciousPickupNames = square.suspiciousPickupNames || [];
  const rows = [
    ["App status", report?.ok ? "Online" : "Unknown"],
    ["Storage", report?.storage ? "Online" : "Unknown"],
    ["Square API", square.online === false ? "Offline" : "Online"],
    ["Last healthy", square.lastHealthyAt ? new Date(square.lastHealthyAt).toLocaleString() : "Not recorded"],
    ["Last sync", square.lastSyncSuccessAt ? new Date(square.lastSyncSuccessAt).toLocaleString() : "Not recorded"],
    ["Last sync error", square.lastSyncError || "None"],
    ["Orders found", String(syncSummary.dedupedOrders ?? "Unknown")],
    ["Created / updated", `${syncSummary.created ?? 0} / ${syncSummary.updated ?? 0}`],
    ["Sync failures", String(syncSummary.failed ?? 0)],
    ["Cached active tickets", String(square.cachedActiveTicketCount ?? "Unknown")],
    ["Suspicious pickup names", String(suspiciousPickupNames.length)],
    ["Alerts configured", square.alertsConfigured ? "Yes" : "No"],
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="mx-auto my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10">
        <div className="border-b border-[#CA862B]/18 bg-[#EEE0C5]/35 px-5 py-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#6A614F]">
            Connection report
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
            Square and system health
          </h2>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
              {error}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-3">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
                  {label}
                </div>
                <div className="mt-1 text-sm font-black text-[#0F4036]">
                  {loading ? "Checking..." : value}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-[#0F4036]/10 bg-[#0F4036]/8 px-4 py-3 text-sm font-semibold leading-6 text-[#0F4036]">
            Last sync context: {syncSummary.context || "Not recorded"}. The created/updated count helps show whether Square sent new orders or refreshed existing tickets.
          </div>
          {backfillResult ? (
            <div className="rounded-2xl border border-[#CA862B]/18 bg-[#EEE0C5]/35 px-4 py-3 text-sm font-bold leading-6 text-[#2D261C]">
              {backfillResult}
            </div>
          ) : null}
          {suspiciousPickupNames.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
              Review pickup names: {suspiciousPickupNames.map((ticket) => `#${ticket.orderNumber} ${ticket.customerName}`).join(", ")}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onBackfill}
              disabled={backfillLoading}
              className="rounded-xl border border-[#CA862B]/26 bg-[#CA862B] px-4 py-2.5 font-black text-white transition hover:bg-[#a86d22] disabled:cursor-wait disabled:opacity-60"
            >
              {backfillLoading ? "Backfilling..." : "Backfill 4 days"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d]"
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
              Custom Square tools for coffee shops, smoothie shops, and drink
              counters that need a clean display, simple staff workflows,
              and useful owner reporting.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Live board",
                  text: "New Tickets, Making, and Ready keep the active rush easy to read.",
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
                <li>Live Square orders in a simple drink board</li>
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
                Email about setup, customization, or a copy for another
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
    const path = window.location.pathname.replace(/\/+$/, "");
    return (
      path === "/demo/owner" ||
      params.get("demo") === "training" ||
      window.location.hash === "#demo"
    );
  } catch {
    return false;
  }
}

function isDemoOwnerRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/demo/owner";
}

function isPolicyAcknowledgmentRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/goldies/policy-acknowledgment" || path === "/policy-acknowledgment";
}

function isDeveloperDashboardRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/developer" || path === "/dev" || path === "/studio-dashboard";
}

function isOnlineOrderingBetaRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/online-ordering-beta" || path === "/order-beta";
}

function isSelfOrderKioskRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === "/self-order-kiosk" || path === "/kiosk";
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

  if (rangeKey === "thisQuarter") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const start = new Date(today.getFullYear(), quarterStartMonth, 1);
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
        const displayName = getCanonicalDrinkName(item.name);

        names[displayName] = (names[displayName] || 0) + qty;
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

const DEMO_OWNER_SEED = {
  today: { orders: 86, units: 112, revenueCents: 64240, multi: 29 },
  yesterday: { orders: 74, units: 96, revenueCents: 54890, multi: 22 },
  last7: { orders: 524, units: 681, revenueCents: 389640, multi: 168 },
  last30: { orders: 2184, units: 2839, revenueCents: 1627820, multi: 704 },
  thisQuarter: { orders: 6120, units: 7956, revenueCents: 4559600, multi: 1984 },
  thisMonth: { orders: 697, units: 906, revenueCents: 519320, multi: 219 },
  thisYear: { orders: 6948, units: 9032, revenueCents: 5161280, multi: 2260 },
};

const DEMO_TOP_DRINKS = [
  { name: "Iced Vanilla Latte", category: "Coffee", qty: 24, unitCents: 625 },
  { name: "Strawberry Smoothie", category: "Smoothies", qty: 18, unitCents: 725 },
  { name: "Hot Americano", category: "Coffee", qty: 15, unitCents: 475 },
  { name: "Honey Chai", category: "Not Coffee", qty: 13, unitCents: 650 },
  { name: "Mango Lemonade", category: "Not Coffee", qty: 11, unitCents: 575 },
  { name: "Blueberry Banana Smoothie", category: "Smoothies", qty: 9, unitCents: 725 },
];

const DEMO_RECENT_ORDERS = [
  { orderNumber: "1042", item: "Iced Vanilla Latte", status: "Ready", time: "8:14 AM" },
  { orderNumber: "1043", item: "Strawberry Smoothie", status: "Making", time: "8:17 AM" },
  { orderNumber: "1044", item: "Hot Americano", status: "New", time: "8:20 AM" },
];

function buildEmptyOwnerCategoryBuckets() {
  return Object.fromEntries(
    GOLDIES_MENU_CATEGORY_LABELS.map((category) => [
      category,
      { category, revenueCents: 0, taxCents: 0, totalCents: 0, units: 0 },
    ])
  );
}

function buildDemoOwnerReport(_tickets, rangeKey, customRange = {}) {
  const seed =
    rangeKey === "custom"
      ? DEMO_OWNER_SEED.last30
      : DEMO_OWNER_SEED[rangeKey] || DEMO_OWNER_SEED.today;
  const { start, end } =
    rangeKey === "custom" && customRange.startDate && customRange.endDate
      ? getCustomRangeBounds(customRange.startDate, customRange.endDate)
      : getRangeBounds(rangeKey);
  const scale = seed.units / DEMO_OWNER_SEED.today.units;
  const scaledTopDrinks = DEMO_TOP_DRINKS.map((item) => ({
    ...item,
    qty: Math.max(1, Math.round(item.qty * scale)),
  }));
  const categoryBuckets = buildEmptyOwnerCategoryBuckets();

  scaledTopDrinks.forEach((item) => {
    const revenueCents = item.qty * item.unitCents;
    const taxCents = Math.round(revenueCents * 0.0825);
    categoryBuckets[item.category].units += item.qty;
    categoryBuckets[item.category].revenueCents += revenueCents;
    categoryBuckets[item.category].taxCents += taxCents;
    categoryBuckets[item.category].totalCents += revenueCents + taxCents;
  });

  const generatedRevenueCents = Object.values(categoryBuckets).reduce(
    (sum, item) => sum + item.revenueCents,
    0
  );
  const adjustment = generatedRevenueCents
    ? seed.revenueCents / generatedRevenueCents
    : 1;
  const totalsByCategory = Object.values(categoryBuckets).map((item) => {
    const revenueCents = Math.round(item.revenueCents * adjustment);
    const taxCents = Math.round(revenueCents * 0.0825);
    return {
      ...item,
      revenueCents,
      taxCents,
      totalCents: revenueCents + taxCents,
      revenue: formatCurrencyCents(revenueCents),
      tax: formatCurrencyCents(taxCents),
      total: formatCurrencyCents(revenueCents + taxCents),
    };
  });
  const hourlyPattern = {
    7: 9,
    8: 18,
    9: 14,
    10: 11,
    11: 10,
    12: 13,
    13: 7,
    14: 4,
  };
  const hourlyOrders = Array.from({ length: 24 }, (_value, hour) => {
    const share = (hourlyPattern[hour] || 0) / DEMO_OWNER_SEED.today.orders;
    const orderCount = Math.round(seed.orders * share);
    const units = Math.round(seed.units * share);
    const revenueCents = Math.round(seed.revenueCents * share);
    return {
      hour,
      label: new Date(2024, 0, 1, hour).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      }),
      orderCount,
      units,
      revenueCents,
      revenue: formatCurrencyCents(revenueCents),
    };
  });
  const totalTaxCents = Math.round(seed.revenueCents * 0.0825);
  const totalCollectedCents = seed.revenueCents + totalTaxCents;

  return {
    demoDataOnly: true,
    businessName: "DrinkFlow Demo Cafe",
    reportSubtitle: "Sample Report - Demo Data Only",
    startAt: new Date(start).toISOString(),
    endAt: new Date(end).toISOString(),
    orderCount: seed.orders,
    multiDrinkOrderCount: seed.multi,
    multiDrinkOrderRate: Math.round((seed.multi / seed.orders) * 100),
    totalUnits: seed.units,
    totalRevenueCents: seed.revenueCents,
    totalRevenue: formatCurrencyCents(seed.revenueCents),
    totalTaxCents,
    totalTax: formatCurrencyCents(totalTaxCents),
    totalCollectedCents,
    totalCollected: formatCurrencyCents(totalCollectedCents),
    averageDrinkOrderValueCents: Math.round(totalCollectedCents / seed.orders),
    averageDrinkOrderValue: formatCurrencyCents(Math.round(totalCollectedCents / seed.orders)),
    busiestHour: "8:00 AM",
    topDrink: "Iced Vanilla Latte",
    topCategory: "Coffee",
    totalsByName: scaledTopDrinks.map(({ name, qty }) => ({ name, qty })),
    totalsByCategory,
    hourlyOrders,
    recentOrders: DEMO_RECENT_ORDERS,
    systemChecks: [
      { label: "Square connection", status: "Passed - Demo Mode" },
      { label: "Dashboard health", status: "Passed" },
      { label: "Analytics update", status: "Passed" },
      { label: "Domain renewal status", status: "Skipped - Demo Mode" },
      { label: "Privacy policy status", status: "Passed" },
      { label: "Case study permission", status: "Demo Data Only" },
    ],
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
    label: "New Tickets",
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
];

const FOCUS_STATUS_COLUMNS = STATUS_COLUMNS.filter((column) =>
  ["new", "making"].includes(column.key)
);

const REPORT_RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
];

const GOLDIES_MENU_CATEGORY_LABELS = ["Coffee", "Not Coffee", "Smoothies"];
const GENERATED_DRINK_IMAGE_BASE = "/assets/drinks/generated";

function getGeneratedDrinkImageUrl(id) {
  return `${GENERATED_DRINK_IMAGE_BASE}/${id}.png`;
}

const GOLDIES_STATIC_DRINK_MENU_ITEMS = [
  { id: "americano", name: "Americano", category: "Coffee", priceCents: 325, imageUrl: getGeneratedDrinkImageUrl("americano") },
  { id: "americano-decaf", name: "Americano (DECAF)", category: "Coffee", priceCents: 325, imageUrl: getGeneratedDrinkImageUrl("americano-decaf") },
  { id: "cappuccino", name: "Cappuccino", category: "Coffee", priceCents: 425, imageUrl: getGeneratedDrinkImageUrl("cappuccino") },
  { id: "cold-brew", name: "Cold Brew", category: "Coffee", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("cold-brew") },
  { id: "drip", name: "Drip", category: "Coffee", priceCents: 325, imageUrl: getGeneratedDrinkImageUrl("drip") },
  { id: "drip-refill", name: "Drip Refill", category: "Coffee", priceCents: 100, imageUrl: getGeneratedDrinkImageUrl("drip-refill") },
  { id: "espresso", name: "Espresso", category: "Coffee", priceCents: 300, imageUrl: getGeneratedDrinkImageUrl("espresso") },
  { id: "flat-white", name: "Flat White", category: "Coffee", priceCents: 450, imageUrl: getGeneratedDrinkImageUrl("flat-white") },
  { id: "gibraltar", name: "Gibraltar", category: "Coffee", priceCents: 350, imageUrl: getGeneratedDrinkImageUrl("gibraltar") },
  { id: "latte", name: "Latte", category: "Coffee", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("latte") },
  { id: "pour-over", name: "Pour Over", category: "Coffee", priceCents: 550, imageUrl: getGeneratedDrinkImageUrl("pour-over") },
  { id: "chai-latte", name: "Chai Latte", category: "Not Coffee", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("chai-latte") },
  { id: "hot-chocolate", name: "Hot Chocolate", category: "Not Coffee", priceCents: 450, imageUrl: getGeneratedDrinkImageUrl("hot-chocolate") },
  { id: "london-fog", name: "London Fog", category: "Not Coffee", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("london-fog") },
  { id: "matcha-latte", name: "Matcha Latte", category: "Not Coffee", priceCents: 525, imageUrl: getGeneratedDrinkImageUrl("matcha-latte") },
  { id: "refresher-strawberry-mango", name: "Refresher - Strawberry Mango", category: "Not Coffee", priceCents: 600, imageUrl: getGeneratedDrinkImageUrl("refresher-strawberry-mango") },
  { id: "steamer-or-cold", name: "Steamer (Or Cold)", category: "Not Coffee", priceCents: 400, imageUrl: getGeneratedDrinkImageUrl("steamer-or-cold") },
  { id: "chocolate-pb-banana-12-oz-kids", name: "Chocolate P/B Banana (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("chocolate-pb-banana-12-oz-kids") },
  { id: "chocolate-pb-banana-16-oz", name: "Chocolate P/B Banana (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("chocolate-pb-banana-16-oz") },
  { id: "greens-12-oz-kids", name: "Greens (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("greens-12-oz-kids") },
  { id: "greens-16-oz", name: "Greens (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("greens-16-oz") },
  { id: "mango-12-oz-kids", name: "Mango (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("mango-12-oz-kids") },
  { id: "mango-16-oz", name: "Mango (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("mango-16-oz") },
  { id: "strawberry-12-oz-kids", name: "Strawberry (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("strawberry-12-oz-kids") },
  { id: "strawberry-16-oz", name: "Strawberry (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("strawberry-16-oz") },
  { id: "strawberry-banana-12-oz-kids", name: "Strawberry Banana (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("strawberry-banana-12-oz-kids") },
  { id: "strawberry-banana-16-oz", name: "Strawberry Banana (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("strawberry-banana-16-oz") },
  { id: "strawberry-mango-12-oz-kids", name: "Strawberry Mango (12 oz Kids)", category: "Smoothies", priceCents: 500, imageUrl: getGeneratedDrinkImageUrl("strawberry-mango-12-oz-kids") },
  { id: "strawberry-mango-16-oz", name: "Strawberry Mango (16 oz)", category: "Smoothies", priceCents: 700, imageUrl: getGeneratedDrinkImageUrl("strawberry-mango-16-oz") },
];

function getStaticDrinkNamesByCategory(category) {
  return GOLDIES_STATIC_DRINK_MENU_ITEMS
    .filter((item) => item.category === category)
    .map((item) => item.name);
}

const COFFEE_MENU_ITEMS = new Set(getStaticDrinkNamesByCategory("Coffee"));
const NOT_COFFEE_MENU_ITEMS = new Set(getStaticDrinkNamesByCategory("Not Coffee"));
const SMOOTHIE_MENU_ITEMS = new Set(getStaticDrinkNamesByCategory("Smoothies"));
const DRINK_MENU_ITEMS = new Set(GOLDIES_STATIC_DRINK_MENU_ITEMS.map((item) => item.name));

function getMinutesElapsed(createdAt) {
  return Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
}

function formatElapsedLabel(timestamp) {
  const mins = getMinutesElapsed(timestamp);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

function formatOrderTime(createdAt) {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOnlineTicket(ticket = {}) {
  return (
    Boolean(ticket.isOnlineOrder) ||
    String(ticket.source || "").toLowerCase().includes("online")
  );
}

function formatCompletedTime(completedAt) {
  if (!completedAt) return "—";

  return new Date(completedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCompletedDate(completedAt) {
  if (!completedAt) return "—";

  return new Date(completedAt).toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
    year: "numeric",
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

function stripDrinkSizeDescriptors(value = "") {
  return normalizeDrinkText(value)
    .replace(/\([^)]*\b(?:oz|ounce|ounces|kid|kids|small|medium|large|regular)\b[^)]*\)/g, " ")
    .replace(/\b\d+\s*(?:oz|ounce|ounces)\b/g, " ")
    .replace(/\b(?:kid|kids|small|medium|large|regular)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDrinkDisplayName(itemName = "") {
  const name = String(itemName || "").trim().replace(/\s+/g, " ");
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .replace(/\bP\/B\b/g, "P/B")
    .replace(/\bOz\b/g, "oz")
    .replace(/\bDecaf\b/g, "DECAF");
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
  const smoothieName = stripDrinkSizeDescriptors(name);
  const smoothieCompact = smoothieName.replace(/\s+/g, "");

  if (isNonDrinkItem(name)) return null;

  if (NOT_COFFEE_MENU_ITEMS.has(name)) return "Not Coffee";

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

  if (COFFEE_MENU_ITEMS.has(name)) return "Coffee";

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
    smoothieCompact.includes("strawberrybanana") ||
    smoothieCompact.includes("strawberrymango") ||
    smoothieCompact.includes("chocolatepbbanana") ||
    ["mango", "strawberry", "greens", "chocolate p b banana", "chocolate pb banana", "strawberry banana", "strawberry mango"].includes(smoothieName)
  ) {
    return "Smoothies";
  }

  if (SMOOTHIE_MENU_ITEMS.has(name) || /smoothie/i.test(lower) || compact.includes("greens")) {
    return "Smoothies";
  }

  return null;
}

function getCanonicalDrinkName(itemName = "") {
  const name = String(itemName || "").trim();
  const lower = normalizeDrinkText(name);
  const compact = lower.replace(/\s+/g, "");
  const smoothieName = stripDrinkSizeDescriptors(name);

  if (
    compact.includes("chocolatepbbanana") ||
    compact.includes("strawberrybanana") ||
    compact.includes("strawberrymango") ||
    smoothieName === "mango" ||
    smoothieName === "strawberry" ||
    smoothieName === "greens"
  ) {
    return formatDrinkDisplayName(name);
  }
  if (lower.includes("refresher") && lower.includes("strawberry") && lower.includes("mango")) return "Refresher - Strawberry Mango";
  if (lower === "steamer") return "Steamer (Or Cold)";
  if (lower.includes("decaf") && lower.includes("americano")) return "Americano (DECAF)";
  if (DRINK_MENU_ITEMS.has(name)) return name;

  if (name && (name === name.toUpperCase() || name === name.toLowerCase())) {
    return formatDrinkDisplayName(name);
  }

  return name;
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

function getOrderLookupStatusLabel(ticket) {
  const itemCount = Array.isArray(ticket?.items) ? ticket.items.length : 0;
  if (itemCount > 0 && !hasDrinkItems(ticket)) return "Retail items only";

  const statusLabels = {
    new: "New",
    making: "Making",
    ready: "Ready",
    completed: "Completed",
    done: "Done",
  };

  return statusLabels[ticket?.status] || ticket?.status || "Unknown";
}

function getVisibleItems(ticket) {
  return ticket.items;
}

function getItemKey(item, index) {
  return String(item?.id || item?.itemId || item?.square_line_item_uid || index);
}

function areAllDrinkItemsDone(items = []) {
  const drinkItems = (items || []).filter((item) => isDrinkItem(item.name));
  return drinkItems.length > 0 && drinkItems.every((item) => Boolean(item.done));
}

function parseCustomerNameFromNotes(items = []) {
  const noteText = (items || [])
    .map((item) => item.note)
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
    .flatMap((item) => String(item.note || "").split(/[,;|\n]|\s+-\s+/))
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
    value.includes("taking off") ||
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
    value.includes("hangin") ||
    value.includes("for here") ||
    value.includes("eat in") ||
    value.includes("eatin")
  ) {
    return "HANGIN' OUT";
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
        const displayName = getCanonicalDrinkName(item.name);
        counts[displayName] = (counts[displayName] || 0) + qty;
      });
    });

  return Object.entries(counts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

function getStableItemId(item, index) {
  const base = String(item?.id || item?.itemId || item?.square_line_item_uid || "item").trim();
  if (base && /__\d+$/.test(base)) return base;

  return `${base || "item"}__${index + 1}`;
}

function normalizeTicket(ticket) {
const items = (ticket.items || []).map((item, index) => ({
    id: getStableItemId(item, index),
    name: getCanonicalDrinkName(item.name || "Unnamed item"),
    qty: item.qty || item.quantity || 1,
    modifiers: item.modifiers || [],
    note: item.note || "",
    done: Boolean(item.done || item.completed || item.completed_item),
  }));
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
      parseCustomerNameFromNotes(items) ||
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
    updatedAt:
      typeof ticket.updatedAt === "number"
        ? ticket.updatedAt
        : ticket.updatedAt || ticket.updated_at
          ? new Date(ticket.updatedAt || ticket.updated_at).getTime()
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
    isOnlineOrder:
      Boolean(ticket.isOnlineOrder || ticket.is_online_order) ||
      String(ticket.source || "").toLowerCase().includes("online"),
    pickupDueTime:
      ticket.pickupDueTime ||
      ticket.pickup_due_time ||
      ticket.rawOrder?.pickupDueTime ||
      ticket.raw_order?.pickupDueTime ||
      "",
    status: ticket.status || "new",
    items,
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
      diningOption: "TAKING OFF",
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
      diningOption: "HANGIN' OUT",
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
        { name: "Refresher - Strawberry Mango", qty: 1, modifiers: [], note: "" },
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
        { name: "Chocolate P/B Banana (16 oz)", qty: 1, modifiers: [], note: "" },
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
      diningOption: "TAKING OFF",
      items: [
        { name: "Strawberry Banana (16 oz)", qty: 1, modifiers: [], note: "" },
        { name: "London Fog", qty: 1, modifiers: [], note: "" },
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
      diningOption: "HANGIN' OUT",
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
  onItemDoneChange,
  onNameChange,
  onDiningOptionChange,
  showDiningOption,
  compact = false,
  focusMode = false,
}) {
  const [nameValue, setNameValue] = useState(ticket.customerName || "");
  const orderTime = formatOrderTime(ticket.createdAt);
  const timeClass = getTimeClass(ticket.createdAt);
  const drinkItems = getDrinkItems(ticket);
  const visibleItems = compact ? drinkItems : getVisibleItems(ticket);
  const displayName = String(ticket.customerName || "").trim();
  const hiddenItemCount = compact
    ? Math.max((ticket.items || []).length - drinkItems.length, 0)
    : 0;
  const ticketHasDrinks = hasDrinkItems(ticket);
  const previousStatus = getPreviousStatus(ticket.status);
  const stageStartedAt = ticket.updatedAt || ticket.createdAt;
  const stageElapsedLabel = formatElapsedLabel(stageStartedAt);
  const stageLabel =
    ticket.status === "ready"
      ? `Ready ${stageElapsedLabel} ago`
      : ticket.status === "making"
        ? `Making ${stageElapsedLabel}`
        : ticket.status === "new"
          ? `Waiting ${stageElapsedLabel}`
          : null;
  const hasSpecificDiningOption =
    ticket.diningOption &&
    !["Unspecified", "Order"].includes(ticket.diningOption);
  const isOnlineOrder = isOnlineTicket(ticket);
  const canCheckOffDrinks = ticket.status === "making";

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
    actions = compact
      ? [
          {
            label: "Order complete",
            status: "completed",
            className: "bg-[#111111] text-white hover:bg-black",
          },
        ]
      : [
          {
            label: "Ready",
            status: "ready",
            className: "bg-[#0F4036] text-white hover:bg-[#0b352d]",
          },
          {
            label: "Order complete",
            status: "completed",
            className: "bg-[#111111] text-white hover:bg-black",
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
    <article className={`rounded-2xl bg-[#FFFDF8] border border-[#CA862B]/18 shadow-[0_10px_24px_rgba(15,64,54,0.05)] ${
      focusMode ? "p-3 space-y-3" : compact ? "p-2.5 space-y-2" : "p-3 space-y-3"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`${focusMode ? "text-3xl md:text-[2.1rem]" : compact ? "text-xl" : "text-2xl"} break-words font-black tracking-tight leading-none text-[#0F4036]`}>
            {displayName || `#${ticket.orderNumber}`}
          </div>

          {compact ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {displayName && (
                <span className={`rounded-lg border border-[#0F4036]/12 bg-[#0F4036]/6 px-2 py-1 font-black text-[#111111] ${focusMode ? "text-sm" : "text-xs"}`}>
                  #{ticket.orderNumber}
                </span>
              )}
              {showDiningOption && hasSpecificDiningOption && (
                <span className={`rounded-lg border border-[#CA862B]/18 bg-[#CA862B]/10 px-2 py-1 font-black text-[#8B5A1D] ${focusMode ? "text-sm" : "text-xs"}`}>
                  {ticket.diningOption}
                </span>
              )}
              {isOnlineOrder && (
                <span className={`rounded-lg border border-[#0F4036]/14 bg-[#0F4036] px-2 py-1 font-black text-white ${focusMode ? "text-sm" : "text-xs"}`}>
                  Online order
                </span>
              )}
              {isOnlineOrder && ticket.pickupDueTime && (
                <span className={`rounded-lg border border-red-200 bg-red-50 px-2 py-1 font-black text-red-800 ${focusMode ? "text-sm" : "text-xs"}`}>
                  Due {ticket.pickupDueTime}
                </span>
              )}
            </div>
          ) : displayName ? (
            <div className="mt-2 rounded-xl border border-[#0F4036]/14 bg-[#0F4036]/6 px-3 py-2">
              <div className="text-xs font-black uppercase tracking-wide text-[#0F4036]">
                Order
              </div>
              <div className="mt-1 text-sm font-black text-[#111111]">
                #{ticket.orderNumber}
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

          {!compact && (
            <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
              isOnlineOrder
                ? "bg-[#0F4036] text-white"
                : "bg-[#CA862B]/10 text-[#6A614F]"
            }`}>
              {isOnlineOrder ? "Online order" : ticket.source}
            </div>
          )}

          {!compact && isOnlineOrder && ticket.pickupDueTime && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <div className="text-xs font-black uppercase tracking-wide text-red-700">
                Customer was told
              </div>
              <div className="mt-1 text-lg font-black text-red-900">
                Ready by {ticket.pickupDueTime}
              </div>
            </div>
          )}

          {!compact && ticket.employeeName && (
            <div className="mt-1 text-sm font-semibold text-[#111111]">
              Taken by {ticket.employeeName}
            </div>
          )}

          {stageLabel && (
            <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 font-black ${focusMode ? "text-sm" : "text-xs"} ${
              ticket.status === "ready" && getMinutesElapsed(stageStartedAt) >= 1
                ? "bg-[#CA862B]/16 text-[#8B5A1D]"
                : "bg-[#0F4036]/8 text-[#0F4036]"
            }`}>
              {stageLabel}
              {ticket.status === "ready" ? " - clears at 2 min" : ""}
            </div>
          )}

          {!compact && showDiningOption && (
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

        <div className={`shrink-0 rounded-xl border font-black ${focusMode ? "px-3 py-2 text-base" : compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} ${timeClass}`}>
          {orderTime}
        </div>
      </div>

      <div className={focusMode ? "space-y-2.5" : compact ? "space-y-1.5" : "space-y-2"}>
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => {
            const itemKey = getItemKey(item, idx);
            const isDrink = isDrinkItem(item.name);
            const isDone = Boolean(item.done);

            return (
              <div
                key={`${ticket.id}-${itemKey}`}
                className={`${focusMode ? "rounded-xl px-2.5 py-2" : compact ? "rounded-xl px-2 py-1.5" : "border-t border-[#CA862B]/12 pt-2 first:border-t-0 first:pt-0"} ${
                  isDone ? "bg-[#0F4036]/8 opacity-75" : "bg-white/70"
                }`}
              >
                <div className={`flex min-w-0 items-start gap-2 font-bold leading-tight ${focusMode ? "text-xl md:text-2xl" : compact ? "text-sm" : "text-base"}`}>
                  {canCheckOffDrinks && isDrink && (
                    <button
                      type="button"
                      onClick={() =>
                        onItemDoneChange(ticket.id, itemKey, !isDone)
                      }
                      aria-label={`${isDone ? "Mark not done" : "Mark done"} ${item.name}`}
                      className={`mt-[-1px] inline-flex shrink-0 items-center justify-center rounded-full border font-black transition ${focusMode ? "h-10 w-10 text-lg" : "h-7 w-7 text-sm"} ${
                        isDone
                          ? "border-[#0F4036] bg-[#0F4036] text-white"
                          : "border-[#CA862B]/30 bg-white text-[#CA862B] hover:bg-[#EEE0C5]/60"
                      }`}
                    >
                      {isDone ? "✓" : ""}
                    </button>
                  )}
                  <span className="text-[#6A614F]">{item.qty}×</span>
                  <span className={`min-w-0 break-words ${isDone ? "text-[#0F4036] line-through decoration-2" : "text-[#111111]"}`}>
                    {item.name}
                  </span>
                </div>

              {item.modifiers.length > 0 && !compact && (
                <ul className="mt-1 ml-7 list-disc space-y-0.5 break-words text-sm text-[#4E4637]">
                  {item.modifiers.map((mod) => (
                    <li key={mod}>{mod}</li>
                  ))}
                </ul>
              )}

              {item.modifiers.length > 0 && compact && (
                <div className={`mt-1 break-words font-semibold leading-snug text-[#4E4637] ${focusMode ? "ml-12 text-lg md:text-xl" : "text-xs"}`}>
                  {item.modifiers.join(", ")}
                </div>
              )}

              {item.note && !compact && (
                <div className="mt-2 rounded-xl bg-[#CA862B]/10 border border-[#CA862B]/18 px-3 py-2 text-sm font-medium text-[#8B5A1D]">
                  Note: {item.note}
                </div>
              )}

              {item.note && compact && (
                <div className={`mt-1 break-words font-semibold leading-snug text-[#8B5A1D] ${focusMode ? "ml-12 text-lg md:text-xl" : "text-xs"}`}>
                  Note: {item.note}
                </div>
              )}
              </div>
            );
          })
        ) : (
          <div className={`${compact ? "rounded-xl p-2 text-xs" : "rounded-2xl p-4 text-sm"} border border-dashed border-[#CA862B]/22 bg-white/70 text-[#6A614F]`}>
            No items to show.
          </div>
        )}

        {hiddenItemCount > 0 && (
          <div className="rounded-lg border border-[#CA862B]/14 bg-[#EEE0C5]/50 px-2 py-1 text-xs font-black text-[#6A614F]">
            {hiddenItemCount} non-drink item{hiddenItemCount === 1 ? "" : "s"} hidden on Focus Board
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className={`grid grid-cols-1 ${focusMode ? "gap-2.5" : "gap-1.5"} ${compact ? "" : "pt-1"}`}>
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => onStatusChange(ticket.id, action.status)}
              className={`rounded-xl font-black transition shadow-sm ${focusMode ? "min-h-[58px] px-4 py-3 text-xl" : compact ? "px-3 py-2 text-sm" : "min-h-[48px] px-4 py-3 text-base"} ${action.className}`}
            >
              {action.label}
            </button>
          ))}

          {previousStatus && !compact && !focusMode && (
            <button
              onClick={() => onStatusChange(ticket.id, previousStatus)}
              className="rounded-xl border border-[#CA862B]/24 bg-white px-4 py-2 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Back
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function StatCard({ label, value, detail, onClick, actionLabel }) {
  const interactive = typeof onClick === "function";
  const Element = interactive ? "button" : "div";
  return (
    <Element
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={`rounded-xl bg-[#FFFDF8] border border-[#CA862B]/18 p-3 text-left shadow-sm ${
        interactive ? "transition hover:border-[#CA862B]/45 hover:shadow-md" : ""
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-[#6A614F] font-bold">
        {label}
      </div>
      <div className="text-xl md:text-2xl font-black mt-1 text-[#111111]">
        {value}
      </div>
      <div className="text-sm text-[#6A614F] mt-1">
        {detail}
      </div>
      {actionLabel ? (
        <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#0F4036]">
          {actionLabel}
        </div>
      ) : null}
    </Element>
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

function pickOwnerSnapshotLine(seed, options) {
  return pickDailyAdvice(seed, options.filter(Boolean));
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
          What you should watch for {rangeLabel}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#6A614F]">
          Plain-language cues for prep, staffing, and the bar rhythm.
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

const REPORT_WINDOW_OPTIONS = [
  { panel: "today-count", label: "Today's Count" },
  { panel: "orders-by-day", label: "Orders By Day" },
  { panel: "stats", label: "View Stats" },
];

function getDashboardReportHref(panel) {
  if (typeof window === "undefined") return `/?panel=${panel}`;

  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = "/";
  nextUrl.search = "";
  nextUrl.hash = "";
  nextUrl.searchParams.set("panel", panel);

  try {
    if (window.location.search.includes("demo=training")) {
      nextUrl.searchParams.set("demo", "training");
    }
  } catch {
    // ignore URL construction failures
  }

  return `${nextUrl.pathname}${nextUrl.search}`;
}

function ReportWindowSwitcher({ activePanel }) {
  return (
    <nav className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap" aria-label="Report views">
      {REPORT_WINDOW_OPTIONS.map((option) => {
        const isActive = option.panel === activePanel;
        return (
          <a
            key={option.panel}
            href={getDashboardReportHref(option.panel)}
            className={`flex min-h-10 items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-black leading-tight transition sm:min-h-0 sm:px-3 sm:text-sm ${
              isActive
                ? "bg-[#0F4036] text-white"
                : "border border-[#CA862B]/22 bg-white text-[#0F4036] hover:bg-[#EEE0C5]/45"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {option.label}
          </a>
        );
      })}
    </nav>
  );
}

function ReportWindowShell({ eyebrow, title, description, activePanel, onClose, children }) {
  const closeWindow = onClose || (() => window.close());
  const contentMaxWidth = activePanel === "stats" ? "max-w-[1120px]" : "max-w-[1400px]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.96),_rgba(238,224,197,1)_50%,_rgba(230,210,173,1)_100%)] px-3 py-3 text-[#111111] sm:px-4 sm:py-4">
      <div className={`mx-auto flex min-h-[calc(100vh-1.5rem)] w-full min-w-0 ${contentMaxWidth} flex-col gap-3`}>
        <header className="rounded-2xl border border-white/70 bg-[rgba(255,253,248,0.94)] px-4 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                {eyebrow}
              </div>
              <h1 className="mt-1 text-2xl font-black text-[#0F4036] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-[#6A614F]">
                {description}
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:items-end">
              {activePanel ? <ReportWindowSwitcher activePanel={activePanel} /> : null}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <a
                  href="/"
                  className="flex min-h-10 items-center justify-center rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-center text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45 sm:px-4 sm:text-sm"
                >
                  Back
                </a>
                <button
                  type="button"
                  onClick={closeWindow}
                  className="flex min-h-10 items-center justify-center rounded-xl bg-[#0F4036] px-3 py-2 text-center text-xs font-black text-white transition hover:bg-[#0b352d] sm:px-4 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}

function TodayCountReportWindow({ drinkCounts, orderCount }) {
  const [liveDrinkCounts, setLiveDrinkCounts] = useState(drinkCounts || []);
  const [liveOrderCount, setLiveOrderCount] = useState(orderCount || 0);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchTodayCount() {
      try {
        const response = await fetch(apiUrl("/api/reports/drinks?range=today"), {
          credentials: "include",
        });
        if (response.status === 401) {
          setError("Login required. Close this window and reopen it from the dashboard.");
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Today's count unavailable: ${response.status}`);
        }
        if (!mounted) return;
        setLiveDrinkCounts(
          (data.totalsByName || []).map((drink) => ({
            name: drink.name,
            qty: drink.qty,
          }))
        );
        setLiveOrderCount(data.orderCount || 0);
        setError("");
      } catch (countError) {
        if (!mounted) return;
        setError(countError.message || "Today's count unavailable.");
      }
    }

    fetchTodayCount();
    const interval = setInterval(fetchTodayCount, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <ReportWindowShell
      eyebrow="Daily report"
      title="Today's Drink Order Count"
      description="This opens in its own window so the main dashboard can stay focused on live tickets."
      activePanel="today-count"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
          {error}
        </div>
      )}
      <DailyDrinkCount drinkCounts={liveDrinkCounts} orderCount={liveOrderCount} />
    </ReportWindowShell>
  );
}

function OrdersByDayReportWindow({
  defaultDate,
  trainingMode,
  trainingTickets,
}) {
  return (
    <ReportWindowShell
      eyebrow="Daily lookup"
      title="Look up orders by day"
      description="Search one day of completed or active tickets without crowding the main board."
      activePanel="orders-by-day"
    >
      <OrdersByDayLookup
        defaultDate={defaultDate}
        collapsed={false}
        onToggle={() => window.close()}
        trainingMode={trainingMode}
        trainingTickets={trainingTickets}
        windowMode
      />
    </ReportWindowShell>
  );
}

function StatsReportWindow({ reports, timeReports, onClose }) {
  return (
    <ReportWindowShell
      eyebrow="Owner stats"
      title="View Stats"
      description="A compact report window for drink counts and staff Start-to-Ready timing."
      activePanel="stats"
      onClose={onClose}
    >
      <div className="grid min-w-0 gap-3 sm:gap-4">
        <DrinkStats reports={reports} />
        <DrinkTimeStatsPanel reports={timeReports} onClose={onClose} />
      </div>
    </ReportWindowShell>
  );
}

function CustomerInsightsPanel() {
  const [customerName, setCustomerName] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const [note, setNote] = useState("");
  const [insights, setInsights] = useState([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function refreshInsights() {
    try {
      const response = await fetch(apiUrl("/api/customer-insights"), {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setInsights(data.insights || []);
    } catch {
      // Insight history is helpful, but the dashboard should not fail if it is unavailable.
    }
  }

  useEffect(() => {
    refreshInsights();
    const interval = setInterval(refreshInsights, 60000);
    return () => clearInterval(interval);
  }, []);

  async function saveInsight(event) {
    event.preventDefault();
    if (!note.trim() || saving) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(apiUrl("/api/customer-insights"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, drinkName, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Insight could not be saved.");

      setCustomerName("");
      setDrinkName("");
      setNote("");
      setStatus("Saved customer insight.");
      await refreshInsights();
    } catch (error) {
      setStatus(error.message || "Insight could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/70 bg-[rgba(255,253,248,0.92)] p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0F4036]">Customer insights</h2>
          <p className="text-sm font-semibold text-[#6A614F]">
            Save today's customer requests and menu clues. Older notes roll into the 7-day archive for owners.
          </p>
        </div>
        {status ? <div className="text-sm font-black text-[#0F4036]">{status}</div> : null}
      </div>

      <form onSubmit={saveInsight} className="mt-3 grid gap-2 md:grid-cols-[160px_180px_minmax(0,1fr)_auto]">
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Customer name"
          className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B]"
        />
        <input
          value={drinkName}
          onChange={(event) => setDrinkName(event.target.value)}
          placeholder="Drink"
          className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B]"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Example: asked for lavender in a London Fog"
          className="rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#CA862B]"
        />
        <button
          type="submit"
          disabled={!note.trim() || saving}
          className={`rounded-xl px-4 py-2 text-sm font-black text-white ${
            note.trim() && !saving ? "bg-[#0F4036]" : "bg-neutral-300"
          }`}
        >
          {saving ? "Saving" : "Save"}
        </button>
      </form>

      {insights.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {insights.slice(0, 6).map((insight) => (
            <div key={insight.id} className="min-w-[220px] rounded-xl border border-[#CA862B]/14 bg-white px-3 py-2">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[#8B5A1D]">
                {insight.customer_name || "Customer note"}
              </div>
              <div className="mt-1 text-sm font-bold text-[#111111]">{insight.note}</div>
              {insight.drink_name ? (
                <div className="mt-1 text-xs font-semibold text-[#6A614F]">{insight.drink_name}</div>
              ) : null}
              {insight.created_at ? (
                <div className="mt-1 text-[11px] font-bold text-[#8B5A1D]">
                  {new Date(insight.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MenuAvailabilityPanel({ demoMode = false }) {
  const [showMenuAvailability, setShowMenuAvailability] = useState(false);
  const [menuAvailability, setMenuAvailability] = useState([]);
  const [menuAvailabilityLoading, setMenuAvailabilityLoading] = useState(false);
  const [menuAvailabilityError, setMenuAvailabilityError] = useState("");
  const [menuAvailabilityNotice, setMenuAvailabilityNotice] = useState("");

  useEffect(() => {
    if (demoMode || !showMenuAvailability) return;

    async function fetchMenuAvailability() {
      try {
        setMenuAvailabilityLoading(true);
        setMenuAvailabilityError("");
        const response = await fetch(apiUrl("/api/menu/availability"), {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Menu availability unavailable: ${response.status}`);
        }
        setMenuAvailability(data.items || []);
      } catch (availabilityError) {
        setMenuAvailabilityError(availabilityError.message || "Menu availability unavailable");
      } finally {
        setMenuAvailabilityLoading(false);
      }
    }

    fetchMenuAvailability();
  }, [demoMode, showMenuAvailability]);

  async function handleMenuAvailabilityChange(itemName, available) {
    setMenuAvailability((current) =>
      current.map((item) =>
        item.itemName === itemName ? { ...item, available } : item
      )
    );
    setMenuAvailabilityNotice("");
    setMenuAvailabilityError("");

    try {
      const response = await fetch(apiUrl("/api/menu/availability"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemName, available }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Menu update failed: ${response.status}`);
      }
      setMenuAvailabilityNotice(
        available
          ? `${itemName} is back on customer menus.`
          : `${itemName} is hidden from the menu board and online ordering.`
      );
    } catch (availabilityError) {
      setMenuAvailabilityError(availabilityError.message || "Menu update failed");
    }
  }

  if (demoMode) return null;

  return (
    <section id="menu-availability" className="scroll-mt-24 rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
            Menu availability
          </div>
          <div className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
            Employees can hide sold-out drinks from the menu board and online ordering fast.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMenuAvailability((current) => !current)}
          className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
        >
          {showMenuAvailability ? "Hide toggles" : "Show toggles"}
        </button>
      </div>

      {showMenuAvailability && (
        <div className="mt-3 rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] p-3">
          {menuAvailabilityLoading ? (
            <div className="text-sm font-semibold text-[#6A614F]">
              Loading menu toggles...
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {menuAvailability.map((item) => (
                <label
                  key={item.itemKey || item.itemName}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#111111]"
                >
                  <span>
                    <span className="block">{item.itemName}</span>
                    <span className="text-xs font-semibold text-[#6A614F]">{item.category}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={item.available !== false}
                    onChange={(event) =>
                      handleMenuAvailabilityChange(item.itemName, event.target.checked)
                    }
                    className="h-5 w-5 accent-[#0F4036]"
                  />
                </label>
              ))}
            </div>
          )}
          {menuAvailabilityNotice ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
              {menuAvailabilityNotice}
            </div>
          ) : null}
          {menuAvailabilityError ? (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
              {menuAvailabilityError}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function StaffToolsGuide({ demoMode = false }) {
  const [recipePreview, setRecipePreview] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState("");
  const [recipeError, setRecipeError] = useState("");

  useEffect(() => {
    return () => {
      if (recipePreview?.url) URL.revokeObjectURL(recipePreview.url);
    };
  }, [recipePreview]);

  if (demoMode) return null;

  const recipeCards = [
    { label: "Smoothie recipes", file: "goldies-recipes-1.png" },
    { label: "Coffee recipes", file: "goldies-recipes-2.png" },
  ];

  async function openRecipeCard(card) {
    setRecipeLoading(card.file);
    setRecipeError("");

    try {
      const response = await fetch(apiUrl(`/api/staff/sop/${card.file}`), {
        credentials: "include",
        cache: "no-store",
        headers: { "X-Goldies-Recipe-Viewer": "kds" },
      });

      if (response.status === 401) {
        throw new Error("Sign in to the KDS before opening recipe cards.");
      }
      if (!response.ok) {
        throw new Error(`Recipe card unavailable: ${response.status}`);
      }

      const blob = await response.blob();
      const nextPreview = {
        title: card.label,
        url: URL.createObjectURL(blob),
      };

      setRecipePreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return nextPreview;
      });
    } catch (error) {
      setRecipeError(error.message || "Recipe card unavailable.");
    } finally {
      setRecipeLoading("");
    }
  }

  function closeRecipePreview() {
    setRecipePreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  return (
    <>
      <section className="rounded-2xl border border-[#CA862B]/18 bg-[rgba(255,253,248,0.92)] p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
              Staff tools to know
            </div>
            <h2 className="mt-1 text-xl font-black text-[#0F4036]">
              New dashboard shortcuts
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#6A614F]">
              Use Menu Availability to hide sold-out drinks from customer menus, and open the private recipe cards when staff need a quick drink build reference.
            </p>
            {recipeError ? (
              <div className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-900">
                {recipeError}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {recipeCards.map((card) => (
              <button
                key={card.file}
                type="button"
                onClick={() => openRecipeCard(card)}
                disabled={Boolean(recipeLoading)}
                className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45 disabled:cursor-wait disabled:opacity-60"
              >
                {recipeLoading === card.file ? "Opening..." : card.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {recipePreview ? (
        <div className="fixed inset-0 z-[90] bg-[#111111]/70 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label={recipePreview.title}>
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#CA862B]/24 bg-[#FFFDF8] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#CA862B]/18 px-4 py-3">
              <h2 className="min-w-0 text-lg font-black text-[#0F4036] md:text-2xl">
                {recipePreview.title}
              </h2>
              <button
                type="button"
                onClick={closeRecipePreview}
                className="rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#EEE0C5]/35 p-3">
              <img
                src={recipePreview.url}
                alt={recipePreview.title}
                className="mx-auto h-auto max-w-full rounded-xl border border-[#CA862B]/18 bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function buildCustomerInsightsAnalysis(insights = []) {
  const normalized = insights.map((insight) => ({
    ...insight,
    searchText: [
      insight.customer_name,
      insight.drink_name,
      insight.note,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));

  const namedCustomers = normalized.filter((insight) =>
    String(insight.customer_name || "").trim()
  ).length;
  const drinkMentions = normalized.filter((insight) =>
    String(insight.drink_name || "").trim()
  ).length;

  const themes = [
    {
      title: "Things customers ask for",
      match: /(add|want|asked|request|lavender|decaf|syrup|flavor|option|special)/i,
      empty: "No repeated asks yet.",
    },
    {
      title: "Recipe or prep reminders",
      match: /(recipe|how to|make|prep|foam|blend|steep|shot|milk|ice|procedure|sop)/i,
      empty: "No prep reminders saved yet.",
    },
    {
      title: "Regulars to remember",
      match: /(regular|always|usual|favorite|likes|name|customer|again)/i,
      empty: "No regular details saved yet.",
    },
    {
      title: "Things to fix",
      match: /(wrong|slow|confusing|missed|forgot|out|stock|waste|refund|problem|issue)/i,
      empty: "Nothing has been flagged here yet.",
    },
  ].map((theme) => {
    const matches = normalized.filter((insight) => theme.match.test(insight.searchText));
    return {
      ...theme,
      count: matches.length,
      examples: matches.slice(0, 2),
    };
  });

  const topDrinkCounts = new Map();
  normalized.forEach((insight) => {
    const drink = String(insight.drink_name || "").trim();
    if (!drink) return;
    topDrinkCounts.set(drink, (topDrinkCounts.get(drink) || 0) + 1);
  });
  const topDrinks = [...topDrinkCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([drink, count]) => ({ drink, count }));

  const actionTheme = themes.find((theme) => theme.count > 0);
  const ownerRead = insights.length
    ? actionTheme
      ? `Most of the saved notes are about ${actionTheme.title.toLowerCase()}. Read those first when you have a quiet minute.`
      : "There are notes saved, but no clear pattern yet. Keep adding them through a few more rushes."
    : "No customer notes have been saved yet. Once staff add notes, this area will help summarize them.";

  return {
    total: insights.length,
    namedCustomers,
    drinkMentions,
    topDrinks,
    themes,
    ownerRead,
  };
}

function CustomerInsightsHistory() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const analysis = buildCustomerInsightsAnalysis(insights);

  useEffect(() => {
    let mounted = true;

    async function loadInsights() {
      try {
        setLoading(true);
        setWarning("");
        const response = await fetch(apiUrl("/api/customer-insights?range=all&limit=60"), {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Customer insights unavailable: ${response.status}`);
        }

        if (!mounted) return;
        setInsights(data.insights || []);
        setWarning(data.warning || "");
      } catch (error) {
        if (mounted) setWarning(error.message || "Customer insights unavailable.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInsights();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/70 bg-[rgba(255,253,248,0.92)] p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
            Customer insights
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
            Notes from the counter
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#6A614F]">
            Archived customer requests, menu clues, and regular details saved by the team.
          </p>
        </div>
        <span className="rounded-full border border-[#CA862B]/18 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#0F4036]">
          {insights.length} saved
        </span>
      </div>

      {warning ? (
        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
          {warning}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-5 text-center text-sm font-semibold text-[#6A614F]">
          Loading customer insights
        </div>
      ) : insights.length ? (
        <>
          <div className="mt-3 rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
              Quick read
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-[#111111]">
              {analysis.ownerRead}
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                  Notes with names
                </div>
                <div className="mt-1 text-2xl font-black text-[#0F4036]">
                  {analysis.namedCustomers}
                </div>
              </div>
              <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                  Notes tied to drinks
                </div>
                <div className="mt-1 text-2xl font-black text-[#0F4036]">
                  {analysis.drinkMentions}
                </div>
              </div>
              <div className="rounded-xl bg-[#EEE0C5]/35 px-3 py-2">
                <div className="text-xs font-black uppercase tracking-wide text-[#6A614F]">
                  Most mentioned drink
                </div>
                <div className="mt-1 text-sm font-black text-[#0F4036]">
                  {analysis.topDrinks[0]
                    ? `${analysis.topDrinks[0].drink} (${analysis.topDrinks[0].count})`
                    : "No drink names yet"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {analysis.themes.map((theme) => (
              <article
                key={theme.title}
                className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-[#0F4036]">{theme.title}</h3>
                  <span className="rounded-full bg-[#EEE0C5]/55 px-2.5 py-1 text-xs font-black text-[#0F4036]">
                    {theme.count}
                  </span>
                </div>
                {theme.examples.length ? (
                  <div className="mt-2 space-y-2">
                    {theme.examples.map((insight) => (
                      <p
                        key={`${theme.title}-${insight.id}`}
                        className="rounded-xl bg-[#FFFDF8] px-3 py-2 text-xs font-bold leading-5 text-[#4E4637]"
                      >
                        {insight.note}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#6A614F]">
                    {theme.empty}
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-2xl border border-[#CA862B]/14 bg-white px-4 py-3 shadow-sm"
              >
                <div className="text-xs font-black uppercase tracking-[0.12em] text-[#8B5A1D]">
                  {insight.customer_name || "Customer note"}
                </div>
                <div className="mt-1 text-sm font-black leading-5 text-[#111111]">
                  {insight.note}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#6A614F]">
                  {insight.drink_name ? (
                    <span className="rounded-full bg-[#EEE0C5]/55 px-2.5 py-1">
                      {insight.drink_name}
                    </span>
                  ) : null}
                  {insight.created_by ? (
                    <span className="rounded-full bg-[#EEE0C5]/55 px-2.5 py-1">
                      Saved by {insight.created_by}
                    </span>
                  ) : null}
                  {insight.created_at ? (
                    <span className="rounded-full bg-[#EEE0C5]/55 px-2.5 py-1">
                      {new Date(insight.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-5 text-center text-sm font-semibold text-[#6A614F]">
          No customer insights saved yet.
        </div>
      )}
    </section>
  );
}

function DemoBrandMark({ size = "md" }) {
  const dimensions = size === "lg" ? "h-28 w-56" : "h-16 w-36";

  return (
    <div className={`${dimensions} flex items-center justify-center gap-2 rounded-2xl border border-[#0F4036]/15 bg-white/80 px-3 shadow-sm`}>
      <img
        src="/demo/demo-cafe-logo.svg"
        alt="DrinkFlow Demo Cafe"
        className="h-11 w-11 rounded-xl"
      />
      <div className="text-left leading-none">
        <div className="text-base font-black text-[#0F4036]">DF</div>
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
        href="https://drinkflowkds.com"
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
      <span className="text-[#CA862B]/70">•</span>
      <a
        href="/developer"
        className="cursor-pointer normal-case tracking-normal text-[#0F4036] transition hover:text-[#CA862B] focus:outline-none focus-visible:text-[#CA862B]"
      >
        Developer Login
      </a>
    </div>
  );
}

function PoweredByDrinkFlow({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[#0F4036]/12 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#5A4F3E] shadow-[0_8px_18px_rgba(15,64,54,0.06)] backdrop-blur-md ${className}`}
    >
      <span>Powered by</span>
      <a
        href="https://drinkflowkds.com"
        className="text-[#0F4036] transition hover:text-[#CA862B]"
      >
        DrinkFlow KDS
      </a>
    </div>
  );
}

function PolicyAcknowledgmentPage() {
  const [record, setRecord] = useState(readPolicyAcknowledgment);
  const [showDialog, setShowDialog] = useState(!record);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,253,248,0.98),_rgba(238,224,197,1)_58%,_rgba(230,210,173,1)_100%)] px-4 py-6 text-[#2D261C]">
      <main className="mx-auto max-w-3xl rounded-3xl border border-[#CA862B]/18 bg-[#FFFDF8]/95 p-5 shadow-[0_24px_70px_rgba(15,64,54,0.1)]">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
          Goldie&apos;s KDS Policy Acknowledgment
        </div>
        <h1 className="mt-2 text-3xl font-black text-[#0F4036]">
          Review and Acknowledge Policy
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6A614F]">
          This page is for the Goldie&apos;s DrinkFlow KDS owner/admin dashboard
          acknowledgment workflow. It is not a full e-signature integration.
        </p>

        <PrivacyAgreementsCard
          policyAcknowledgment={record}
          policyReminder={readPolicyReminder()}
          defaultExpanded
        />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href="/policy.html"
            className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 text-center font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Read Policy
          </a>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d]"
          >
            Acknowledge Policy
          </button>
          <a
            href="/"
            className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 text-center font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
          >
            Back to KDS
          </a>
        </div>
      </main>
      <PolicyAcknowledgmentDialog
        open={showDialog}
        ownerName={record?.user_name || "Owner"}
        onRecorded={(nextRecord) => {
          setRecord(nextRecord || readPolicyAcknowledgment());
          setShowDialog(false);
        }}
        onRemindLater={() => setShowDialog(false)}
      />
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
  ownerActionLabel = "Owner Reports",
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

function ReportRangeSelector({
  reports,
  selectedRange,
  onSelectRange,
  valueForRange,
  detailForRange,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {REPORT_RANGES.map((range) => {
        const report = reports[range.key] || {};
        const active = selectedRange === range.key;

        return (
          <button
            key={range.key}
            type="button"
            onClick={() => onSelectRange(range.key)}
            className={`min-h-[78px] rounded-xl border px-3 py-2 text-left transition ${
              active
                ? "border-[#0F4036] bg-[#0F4036] text-white"
                : "border-[#CA862B]/18 bg-white text-[#0F4036] hover:bg-[#EEE0C5]/40"
            }`}
          >
            <div className="text-xs font-black uppercase tracking-[0.12em] opacity-75">
              {range.label}
            </div>
            <div className="mt-1 text-xl font-black sm:text-2xl">
              {valueForRange(report)}
            </div>
            <div className="text-xs font-bold opacity-75">
              {detailForRange(report)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DrinkStats({ reports }) {
  const [selectedRange, setSelectedRange] = useState("today");
  const [collapsed, setCollapsed] = useState(false);
  const selectedReport = reports[selectedRange] || {};
  const selectedRangeLabel =
    REPORT_RANGES.find((range) => range.key === selectedRange)?.label || "Today";
  const categories = selectedReport.totalsByCategory || {};
  const total = (selectedReport.totalsByName || []).reduce(
    (sum, drink) => sum + Number(drink.qty || 0),
    0
  );

  return (
    <section className="rounded-2xl bg-[#FFFDF8] border border-[#0F4036]/12 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#0F4036]">Drink Stats</h2>
          <p className="text-sm text-[#6A614F]">
            Coffee, not coffee, and smoothies only
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45 sm:w-auto"
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show drink stats" : "Collapse drink stats"}
        </button>
      </div>

      <ReportRangeSelector
        reports={reports}
        selectedRange={selectedRange}
        onSelectRange={(rangeKey) => {
          setSelectedRange(rangeKey);
          setCollapsed(false);
        }}
        valueForRange={(report) =>
          (report.totalsByName || []).reduce(
            (sum, drink) => sum + Number(drink.qty || 0),
            0
          )
        }
        detailForRange={() => "drinks counted"}
      />

      {!collapsed && (
        <div className="mt-2 rounded-xl bg-white border border-[#0F4036]/10 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
                {selectedRangeLabel}
              </div>
              <div className="mt-1 text-3xl font-black text-[#111111]">
                {total}
              </div>
              <div className="text-sm font-bold text-[#6A614F]">
                total drinks counted
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {GOLDIES_MENU_CATEGORY_LABELS.map((category) => (
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

          {selectedReport.totalsByName?.length > 0 ? (
            <div className="mt-4 border-t border-[#0F4036]/10 pt-3">
              <div className="text-xs font-black uppercase tracking-wide text-[#6A614F] mb-2">
                Drink breakdown
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {selectedReport.totalsByName.map((drink) => (
                  <div
                    key={drink.name}
                    className="flex flex-col gap-1 rounded-lg border border-[#0F4036]/8 bg-[#FFFDF8] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <span className="min-w-0 break-words font-bold leading-tight text-[#111111]">
                      {drink.name}
                    </span>
                    <span className="shrink-0 font-black text-[#0F4036]">
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
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#CA862B]/22 bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6A614F]">
              No drink breakdown for this range yet.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DrinkTimeStatsPanel({ reports, onClose }) {
  const [selectedRange, setSelectedRange] = useState("today");
  const selectedReport = reports[selectedRange] || {};
  const selectedLabel =
    REPORT_RANGES.find((range) => range.key === selectedRange)?.label || "Today";

  return (
    <section className="rounded-2xl border border-[#0F4036]/12 bg-[#FFFDF8] p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
            Timing report
          </div>
          <h2 className="mt-1 text-xl font-black text-[#0F4036] sm:text-2xl">
            Average drink time
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold text-[#6A614F]">
            Timing follows staff Start-to-Ready taps. Very short samples usually mean Start was tapped after the drink was already underway, so the report doubles as a workflow-coaching signal.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45 sm:w-auto"
        >
          Close
        </button>
      </div>

      <div className="mt-4">
        <ReportRangeSelector
          reports={reports}
          selectedRange={selectedRange}
          onSelectRange={setSelectedRange}
          valueForRange={(report) => report.label || "Collecting"}
          detailForRange={(report) => `${report.sampleSize || 0} orders timed`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-[#CA862B]/14 bg-white p-3 sm:p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
            {selectedLabel}
          </div>
          <div className="mt-2 text-3xl font-black text-[#111111] sm:text-4xl">
            {selectedReport.label || "Collecting"}
          </div>
          <div className="mt-1 text-sm font-bold text-[#6A614F]">
            {selectedReport.sampleSize || 0} drink orders timed
          </div>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#CA862B]/14 bg-white p-3 sm:p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
              By hour
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {selectedReport.byHour?.length ? (
                selectedReport.byHour.map((hour) => (
                  <div key={hour.hour} className="rounded-xl border border-[#0F4036]/8 bg-[#FFFDF8] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-[#111111]">{hour.hourLabel}</span>
                      <span className="font-black text-[#0F4036]">{hour.label}</span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#6A614F]">
                      {hour.sampleSize} orders timed
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#CA862B]/22 bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6A614F]">
                  No hourly timing samples yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#CA862B]/14 bg-white p-3 sm:p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
              By drink name
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {selectedReport.byDrinkName?.length ? (
                selectedReport.byDrinkName.map((drink) => (
                  <div key={drink.name} className="rounded-xl border border-[#0F4036]/8 bg-[#FFFDF8] px-3 py-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="min-w-0 break-words font-black leading-tight text-[#111111]">{drink.name}</span>
                      <span className="shrink-0 font-black text-[#0F4036]">{drink.label}</span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#6A614F]">
                      {drink.sampleSize} orders timed
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#CA862B]/22 bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6A614F]">
                  No drink-name timing samples yet.
                </div>
              )}
            </div>
          </div>
        </div>
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
                <th className="px-3 py-2 font-black">Date</th>
                <th className="px-3 py-2 font-black">Time</th>
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
                    {formatCompletedDate(ticket.completedAt)}
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
  windowMode = false,
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
          {windowMode ? "Close window" : collapsed ? "Show" : "Hide"}
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
                            <span className="rounded-full bg-[#EEE0C5]/75 border border-[#CA862B]/18 px-2.5 py-1 text-xs font-black text-[#111111]">
                              {getOrderLookupStatusLabel(ticket)}
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
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom" },
];

function getOwnerRangeLabel(rangeKey) {
  return (
    OWNER_REPORT_RANGES.find((option) => option.key === rangeKey)?.label ||
    "Selected Range"
  );
}

function getCustomRangeBounds(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

function getOwnerReportDateLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSelectedOwnerRangeLabel(rangeKey, customRange = {}) {
  if (rangeKey !== "custom") return getOwnerRangeLabel(rangeKey);
  if (!customRange.startDate || !customRange.endDate) return "Custom Range";
  return `${getOwnerReportDateLabel(customRange.startDate)} - ${getOwnerReportDateLabel(customRange.endDate)}`;
}

function buildOwnerReportQuery(rangeKey, customRange = {}) {
  const params = new URLSearchParams();
  params.set("range", rangeKey);

  if (rangeKey === "custom") {
    params.set("startDate", customRange.startDate || "");
    params.set("endDate", customRange.endDate || "");
  }

  return params.toString();
}

function isCustomOwnerRangeReady(customRange = {}) {
  if (!customRange.startDate || !customRange.endDate) return false;
  return new Date(`${customRange.startDate}T00:00:00`) <= new Date(`${customRange.endDate}T00:00:00`);
}

const SHOP_TIME_ZONE = "America/Chicago";
const SHOP_OPEN_HOUR = 7;
const SHOP_CLOSE_HOUR = 15;
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
  const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) return DEFAULT_SHOP_HOURS;
  return SHOP_HOURS_BY_DAY[date.getDay()] || DEFAULT_SHOP_HOURS;
}

function getShopHoursFromReport(report, selectedDate = getTodayDateKey()) {
  return report?.shopHours || getShopHoursForDate(selectedDate);
}

function getShopTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);

  return { hour, minute, minutes: hour * 60 + minute };
}

function getServiceWindowRead(now = new Date(), shopHours = DEFAULT_SHOP_HOURS, selectedDate = getTodayDateKey()) {
  const todayKey = getTodayDateKey();
  const isToday = selectedDate === todayKey;
  const openHour = Number(shopHours.openHour ?? DEFAULT_SHOP_HOURS.openHour);
  const closeHour = Number(shopHours.closeHour ?? DEFAULT_SHOP_HOURS.closeHour);
  const label = shopHours.label || DEFAULT_SHOP_HOURS.label;

  if (!isToday) {
    return {
      phase: "past-day",
      label: "Past day",
      pace: `This view is showing ${selectedDate}, using Goldie's ${label} Central service window.`,
      action: "Use this as a day review instead of a live staffing read.",
    };
  }

  const { minutes } = getShopTimeParts(now);
  const openMinute = openHour * 60;
  const closeMinute = closeHour * 60;
  const serviceMinutes = closeMinute - openMinute;

  if (minutes < openMinute) {
    return {
      phase: "before-open",
      label: "Before open",
      pace: `Goldie's opens at ${label.split("-")[0]} Central and closes at ${label.split("-")[1]} Central today.`,
      action: "Use this as a pre-service check: confirm Square is syncing, then watch the first real rush after open.",
    };
  }

  if (minutes >= closeMinute) {
    return {
      phase: "after-close",
      label: "After close",
      pace: `Goldie's service window has closed for the day: ${label} Central.`,
      action: "Treat today as a closed-day read now. Use the numbers for review, restock notes, and tomorrow's prep instead of live staffing moves.",
    };
  }

  const elapsed = minutes - openMinute;
  const remaining = closeMinute - minutes;
  const progress = Math.max(0, Math.min(100, Math.round((elapsed / serviceMinutes) * 100)));
  const elapsedHours = Math.floor(elapsed / 60);
  const elapsedMinutes = elapsed % 60;
  const remainingHours = Math.floor(remaining / 60);
  const remainingMinutes = remaining % 60;
  const elapsedLabel =
    elapsedHours > 0
      ? `${elapsedHours}h ${elapsedMinutes}m`
      : `${elapsedMinutes}m`;
  const remainingLabel =
    remainingHours > 0
      ? `${remainingHours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;

  return {
    phase: "open",
    label: "Open now",
    progress,
    pace: `Goldie's is ${progress}% through its ${label} Central service window, with ${elapsedLabel} served and about ${remainingLabel} left.`,
    action: "Use this as a live service read. Compare the current pace to the time left before changing prep, staffing, or specials.",
  };
}

function getTodayServiceWindowRead(now = new Date()) {
  return getServiceWindowRead(now, getShopHoursForDate(getTodayDateKey()), getTodayDateKey());
}

const OWNER_SNAPSHOT_COPY = {
  today: {
    eyebrow: "Today's Snapshot",
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
  thisQuarter: {
    eyebrow: "Quarter Snapshot",
    question: "What does this quarter show?",
    empty:
      "No drink revenue is showing for this quarter. Check the data connection before using this for tax or planning work.",
    quiet:
      "This quarter is reading light. Use it as a planning period and compare it against month-to-date before changing the menu.",
    action:
      "Use the quarter view for taxes, owner planning, purchasing habits, and category-level decisions.",
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
  custom: {
    eyebrow: "Custom Range Snapshot",
    question: "What does this selected period show?",
    empty:
      "No drink revenue is showing for this selected date range. Check the dates and Square syncing before using the report.",
    quiet:
      "This selected range is reading light. Use it for context, then compare it to a stronger period before making big changes.",
    action:
      "Use custom ranges for quarterly taxes, owner review periods, or any date window that needs a clean export.",
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
  const serviceWindow = rangeKey === "today" ? getTodayServiceWindowRead() : null;

  if (!orderCount && !drinkUnits) {
    return {
      eyebrow: copy.eyebrow,
      question: copy.question,
      tone: serviceWindow?.label || "Quiet service window",
      summary: serviceWindow ? `${serviceWindow.pace} ${copy.empty}` : copy.empty,
      watch: [
        {
          title: "Connection check",
          body: "Confirm live Square orders are appearing correctly.",
        },
        {
          title: "What you should do next",
          body: serviceWindow?.action || copy.action,
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
  const drinkOrderNonDrinkAttachmentRate = Number(report?.drinkOrderNonDrinkAttachmentRate || 0);
  const drinkOrdersWithNonDrinkItems = Number(report?.drinkOrdersWithNonDrinkItems || 0);
  const nonDrinkAttachmentRead =
    drinkOrderNonDrinkAttachmentRate >= 45
      ? `${drinkOrderNonDrinkAttachmentRate}% of drink orders also included non-drink items (${drinkOrdersWithNonDrinkItems} orders), which is a strong add-on and inventory signal.`
      : drinkOrderNonDrinkAttachmentRate >= 20
        ? `${drinkOrderNonDrinkAttachmentRate}% of drink orders also included non-drink items (${drinkOrdersWithNonDrinkItems} orders), so add-ons are meaningfully attached to drink traffic.`
        : drinkOrderNonDrinkAttachmentRate > 0
          ? `${drinkOrderNonDrinkAttachmentRate}% of drink orders also included non-drink items (${drinkOrdersWithNonDrinkItems} orders). Keep watching which food or retail items pair with drinks.`
          : "No non-drink add-ons are attached to drink orders in this range yet.";
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
      ? "Drink sales are strong enough to plan staffing and prep around this range."
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
  const snapshotSeed = `${getTodayDateKey()}:${rangeKey}:${orderCount}:${drinkUnits}:${topCategory?.category || "none"}:${averageCents}`;
  const moneySignalByRange = {
    today: pickOwnerSnapshotLine(`${snapshotSeed}:money:today`, [
      `${serviceWindow?.pace || "Live service read:"} ${revenueRead} ${averageOrderRead} Watch whether average ticket value climbs during rush periods.`,
      `${rangeLabel} is showing ${report?.totalRevenue || "$0.00"} before tax from ${orderCount} drink orders. ${averageOrderRead} The next signal is whether multi-drink orders show up during the busiest stretch.`,
      `${serviceWindow?.label || "Today"} has a ${averageRead} pattern so far. ${categoryFocusRead} Keep an eye on whether that mix holds through the next service window.`,
    ]),
    yesterday: pickOwnerSnapshotLine(`${snapshotSeed}:money:yesterday`, [
      `Closed-day read: yesterday finished at ${report?.totalRevenue || "$0.00"} before tax. ${averageOrderRead} Use it as a clean comparison against today, not as a live staffing signal.`,
      `Yesterday gives you a settled read: ${orderCount} drink orders, ${drinkUnits} units, and ${report?.averageDrinkOrderValue || "$0.00"} per drink order. Compare the category leader against today's early pattern.`,
      `Yesterday's drink sales landed at ${report?.totalRevenue || "$0.00"} before tax. ${categoryFocusRead} That is the useful detail to carry into the next schedule or prep note.`,
    ]),
    last7: pickOwnerSnapshotLine(`${snapshotSeed}:money:last7`, [
      `Short-term trend: this week is averaging ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${revenueRead} Compare this to staffing and prep for the current week.`,
      `The 7-day view is best for near-term rhythm: ${dailyOrders} drink orders per day on average and ${averageRead}. Use it to spot whether this week feels heavier, lighter, or just different.`,
      `This week has ${drinkUnits} drink units across ${orderCount} drink orders. ${categoryFocusRead} That mix matters more than one isolated busy hour.`,
    ]),
    last30: pickOwnerSnapshotLine(`${snapshotSeed}:money:last30`, [
      `Monthly trend: the last 30 days average ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${averageOrderRead} This is the better range for menu and promo decisions.`,
      `The 30-day read smooths out odd days: ${dailyRevenue} in drink revenue per day and ${dailyOrders} drink orders per day on average. ${categoryFocusRead}`,
      `Over the last 30 days, ${report?.averageDrinkOrderValue || "$0.00"} is the average collected per drink order. ${averageOrderRead} Watch whether that is coming from premium drinks, multiple drinks, or both.`,
    ]),
    thisMonth: pickOwnerSnapshotLine(`${snapshotSeed}:money:thisMonth`, [
      `Month-to-date pace: this month is averaging ${dailyOrders} drink orders and ${dailyRevenue} in drink revenue per day. ${revenueRead} Watch whether the pace is improving or fading before month end.`,
      `This month is building around ${topCategory?.category || "the current drink mix"} with ${drinkUnits} units so far. ${categoryFocusRead} Use the remaining days to test small adjustments.`,
      `Month-to-date drink revenue is ${report?.totalRevenue || "$0.00"} before tax. ${averageOrderRead} The useful question is whether the average ticket is moving with the traffic.`,
    ]),
    thisYear: pickOwnerSnapshotLine(`${snapshotSeed}:money:thisYear`, [
      `Long-term read: year-to-date drink revenue is ${report?.totalRevenue || "$0.00"} before tax across ${drinkUnits} units. ${averageOrderRead} Use this for bigger menu, staffing, and category direction.`,
      `The year-to-date view is the strategic read: ${drinkUnits} drink units, ${orderCount} drink orders, and ${report?.averageDrinkOrderValue || "$0.00"} per drink order. Look for the pattern that keeps repeating.`,
      `Year-to-date, the strongest signal is not one day; it is the repeated category and ticket-value pattern. ${categoryFocusRead} ${averageOrderRead}`,
    ]),
  };
  const ownerActionByRange = {
    today: pickOwnerSnapshotLine(`${snapshotSeed}:action:today`, [
      averageCents < 600
        ? `${serviceWindow?.action || "For the rest of today, coach add-ons or premium drink suggestions and see whether the average ticket improves before close."}`
        : `${serviceWindow?.action || "For the rest of today, protect speed and prep on the strongest category so higher-value tickets do not slow the bar."}`,
      topCategory
        ? `Before the next rush, check ${topCategory.category} backups first, then watch whether add-ons or second drinks lift the ticket average.`
        : "Before the next rush, check the live board against Square and keep the bar reset simple.",
      unitsPerOrder >= 1.25
        ? "Keep the handoff area clear for multi-drink orders, then note whether those bigger tickets are slowing pickup."
        : "Try one short add-on prompt today and watch whether single-drink tickets start turning into two-drink tickets.",
    ]),
    yesterday: pickOwnerSnapshotLine(`${snapshotSeed}:action:yesterday`, [
      "Use yesterday as a review: compare the strongest category, average ticket value, and staffing notes before changing today's plan.",
      topCategory ? `Carry one concrete prep note forward from yesterday: was ${topCategory.category} stocked before the rush or did it need a mid-service reset?` : "Use yesterday as a calm review day and compare Square totals before making a menu call.",
      "Pick one thing to compare against today: category leader, average ticket, or busiest hour. Do not try to optimize all three from one day.",
    ]),
    last7: pickOwnerSnapshotLine(`${snapshotSeed}:action:last7`, [
      topCategoryShare >= 55
        ? `This week, make sure ${topCategory.category} prep and stock match demand before the next rush.`
        : "This week, watch whether demand stays spread across categories or starts concentrating in one lane.",
      "Use the 7-day view for staffing rhythm: compare the busiest windows against who was actually on bar.",
      averageCents < 600
        ? "For the next week, test one easy upsell or featured pairing and see whether average order value moves."
        : "For the next week, protect the drink lane that is already working before adding a new special.",
    ]),
    last30: pickOwnerSnapshotLine(`${snapshotSeed}:action:last30`, [
      averageCents < 600
        ? "For the 30-day view, test a simple add-on or featured drink strategy before changing the broader menu."
        : "For the 30-day view, use the stronger average ticket to decide which drink lane deserves more menu focus.",
      topCategory ? `Use this month of data to decide whether ${topCategory.category} needs more menu attention, prep space, or purchasing priority.` : "Use the 30-day view to choose one menu or prep experiment, then measure it for another month.",
      "Make one small operating change from this view, not five. The 30-day report is strongest when it turns into one clear test.",
    ]),
    thisMonth: pickOwnerSnapshotLine(`${snapshotSeed}:action:thisMonth`, [
      "For this month, compare the current daily pace to the goal and adjust prep, specials, or category focus before the month closes.",
      "Before month end, choose whether the priority is more orders, higher average ticket, or smoother rush coverage. The next move depends on that choice.",
      topCategory ? `If ${topCategory.category} stays on top through month end, consider giving it the cleanest prep plan and menu visibility.` : "Use the rest of the month to identify a category leader before making a promo decision.",
    ]),
    thisYear: pickOwnerSnapshotLine(`${snapshotSeed}:action:thisYear`, [
      "For the year-to-date view, use the repeated category leader and ticket value pattern for bigger staffing, menu, and purchasing decisions.",
      "Use this range for big calls only: menu structure, seasonal planning, staffing assumptions, and purchasing habits.",
      topCategory ? `If ${topCategory.category} keeps leading year-to-date, it should influence buying, training, and how the menu is organized.` : "Use the year-to-date view to separate real patterns from opening-week noise.",
    ]),
  };

  return {
    eyebrow: copy.eyebrow,
    question: copy.question,
    tone: serviceWindow?.label || `${rangeLabel} read`,
    summary: `${serviceWindow ? `${serviceWindow.pace} ` : ""}${quietRead}${rangeLabel} looks ${volumeRead}: ${orderCount} drink orders, ${drinkUnits} drink units, and ${report?.totalRevenue || "$0.00"} in drink revenue before tax. The average collected per drink order is ${report?.averageDrinkOrderValue || "$0.00"}, which points to ${averageRead}.`,
    watch: [
      {
        title: "Demand mix",
        body: `${categoryRead} ${categoryFocusRead}`,
      },
      {
        title: "Ticket behavior",
        body: `${unitRead} ${nonDrinkAttachmentRead}`,
      },
      {
        title: "Sales read",
        body: moneySignalByRange[rangeKey] || `${revenueRead} ${averageOrderRead}`,
      },
      {
          title: "What you should do next",
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
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-[2px] sm:p-4 ${themeMode === "dark" ? "goldies-dark" : ""}`}>
      <form
        onSubmit={handleSubmit}
        className="mx-auto my-4 w-full max-w-md space-y-4 rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:my-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Owner Reports
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

        <div className="flex justify-center">
          <PoweredByDrinkFlow />
        </div>

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

function readPolicyAcknowledgment() {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(POLICY_ACK_STORAGE_KEY) || "null"
    );
    return parsed?.policy_version === POLICY_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function readPolicyReminder() {
  if (typeof window === "undefined") {
    return { reminder_count: 0, last_reminded_timestamp: "" };
  }

  try {
    return (
      JSON.parse(window.localStorage.getItem(POLICY_REMINDER_STORAGE_KEY) || "null") || {
        reminder_count: 0,
        last_reminded_timestamp: "",
      }
    );
  } catch {
    return { reminder_count: 0, last_reminded_timestamp: "" };
  }
}

function writePolicyReminder(record) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POLICY_REMINDER_STORAGE_KEY, JSON.stringify(record));
}

function formatPolicyTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PolicyAcknowledgmentDialog({
  open,
  ownerName,
  onRecorded,
  onRemindLater,
}) {
  const [mode, setMode] = useState("notice");
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState(ownerName || "Owner");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("notice");
    setChecked(false);
    setUserName(ownerName || "Owner");
  }, [open, ownerName]);

  if (!open) return null;

  function handleAcknowledge() {
    const acknowledged_timestamp = new Date().toISOString();
    const reminder = readPolicyReminder();
    const record = {
      business_name: GOLDIES_POLICY_CONTEXT.businessName,
      user_name: userName.trim() || ownerName || "Owner",
      user_email: userEmail.trim(),
      product_name: GOLDIES_POLICY_CONTEXT.productName,
      policy_type: GOLDIES_POLICY_CONTEXT.policyType,
      policy_version: GOLDIES_POLICY_CONTEXT.policyVersion,
      policy_scope: GOLDIES_POLICY_CONTEXT.policyScope,
      acknowledged_timestamp,
      dismissed_timestamp: reminder.dismissed_timestamp || "",
      reminder_count: Number(reminder.reminder_count || 0),
      last_reminded_timestamp: reminder.last_reminded_timestamp || "",
    };

    window.localStorage.setItem(POLICY_ACK_STORAGE_KEY, JSON.stringify(record));
    onRecorded(record);
    setMode("thanks");
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-[#CA862B]/22 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
          <div className="border-b border-[#CA862B]/18 bg-[#EEE0C5]/35 px-5 py-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
              Goldie&apos;s KDS
            </div>
            <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
              {mode === "review"
                ? "Review and Acknowledge Policy"
                : mode === "thanks"
                  ? "Thank you."
                  : "Privacy & Data Handling Policy Update"}
            </h2>
          </div>

          {mode === "notice" && (
            <div className="space-y-4 px-5 py-5 text-[#2D261C]">
              <p className="text-base leading-7">
                We&apos;ve updated the Privacy & Data Handling Policy for DrinkFlow
                Kitchen Display Systems (KDS) to clearly explain how Square data,
                order information, dashboard analytics, daily checks, case study
                information, and domain reminders are handled for the Goldie&apos;s KDS
                pilot.
              </p>
              <p className="text-sm font-semibold leading-6 text-[#6A614F]">
                Please review and acknowledge the current policy version when you have a
                chance. This acknowledgment helps us keep the Goldie&apos;s pilot clear,
                professional, and respectful of private business information.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <a
                  href="/policy.html"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 text-center font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Read Policy
                </a>
                <button
                  type="button"
                  onClick={() => setMode("review")}
                  className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d]"
                >
                  Acknowledge Policy
                </button>
                <button
                  type="button"
                  onClick={onRemindLater}
                  className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          )}

          {mode === "review" && (
            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-5 text-[#2D261C]">
              <div>
                <h3 className="text-xl font-black text-[#0F4036]">
                  DrinkFlow KDS Privacy & Data Handling Policy
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#6A614F]">
                  This policy explains how DrinkFlow KDS may handle Square data,
                  order information, dashboard analytics, daily checks, case study
                  information, and domain reminders. For Goldie&apos;s, this applies
                  to the Goldie&apos;s KDS, owner/admin dashboard, and pilot.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6A614F]">
                    Name
                  </span>
                  <input
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#0F4036]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6A614F]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(event) => setUserEmail(event.target.value)}
                    placeholder="owner@email.com"
                    className="mt-1 w-full rounded-xl border border-[#CA862B]/22 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#0F4036]"
                  />
                </label>
              </div>

              <ul className="space-y-2 text-sm font-semibold leading-6 text-[#2D261C]">
                <li>Goldie&apos;s owns its business data, recipes, menu information, Square account, customer/order information, financial data, and business assets.</li>
                <li>Studio Samantha / DrinkFlow KDS owns the software, dashboard, code, analytics structure, branding, documentation, workflows, and product concepts.</li>
                <li>DrinkFlow KDS may access Square, order, menu, and analytics data only as needed to provide, test, troubleshoot, support, and improve the KDS and owner dashboard.</li>
                <li>DrinkFlow KDS may run daily or recurring checks to support app reliability, Square connection status, dashboard functionality, analytics updates, domain renewal reminders, policy reminders, and service troubleshooting.</li>
                <li>Goldie&apos;s private live dashboard data should not be used for public demos, school projects, portfolio materials, marketing, or case study materials unless approved.</li>
                <li>Public use should rely on approved information, anonymized data, aggregated data, blurred screenshots, fake/sample data, or demo/test environment data.</li>
                <li>DrinkFlow KDS does not sell Goldie&apos;s business data, customer/order data, Square data, recipes, financial information, or operational analytics.</li>
              </ul>

              <label className="flex gap-3 rounded-2xl border border-[#CA862B]/18 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#2D261C]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#0F4036]"
                />
                <span>
                  I have reviewed and acknowledge the current Privacy & Data Handling
                  Policy for the Goldie&apos;s DrinkFlow KDS pilot.
                </span>
              </label>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={!checked}
                  className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  Acknowledge Policy
                </button>
                <button
                  type="button"
                  onClick={onRemindLater}
                  className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          )}

          {mode === "thanks" && (
            <div className="space-y-4 px-5 py-5 text-[#2D261C]">
              <p className="text-base font-bold leading-7">
                Your acknowledgment has been recorded.
              </p>
              <div className="rounded-2xl border border-[#CA862B]/18 bg-white px-4 py-3 text-sm font-black text-[#0F4036]">
                Policy version acknowledged: {POLICY_VERSION}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRecorded(readPolicyAcknowledgment())}
                  className="rounded-xl bg-[#0F4036] px-4 py-2.5 font-black text-white transition hover:bg-[#0b352d]"
                >
                  Continue to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrivacyAgreementsCard({
  demoMode = false,
  policyAcknowledgment,
  policyReminder,
  onOpenPolicy,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const acknowledged = Boolean(policyAcknowledgment);
  const lastDailyCheck = demoMode
    ? "Sample timestamp"
    : "Scheduled checks active when cloud monitoring runs";
  const lastSquareSync = demoMode ? "Demo Mode" : "Shown in the Square and System Health box";

  return (
    <section className="rounded-2xl border border-[#CA862B]/18 bg-white/85 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
            Privacy & Agreements
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                acknowledged || demoMode
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {acknowledged || demoMode ? "Acknowledged" : "Needs acknowledgment"}
            </span>
            <span className="rounded-full bg-[#EEE0C5]/55 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#6A614F]">
              Policy {POLICY_VERSION}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6A614F]">
            {demoMode
              ? "Demo owner reports privacy notes are collapsed because the demo uses sample data only."
              : acknowledged
                ? `Acknowledged by ${policyAcknowledgment?.user_name || "Owner"}${policyAcknowledgment?.acknowledged_timestamp ? ` on ${formatPolicyTimestamp(policyAcknowledgment.acknowledged_timestamp)}` : ""}.`
                : "The acknowledgment prompt now appears after KDS sign-in and stays dismissed once the current policy version is acknowledged."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/policy.html"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-center text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            onClick={onOpenPolicy}
          >
            View Policy
          </a>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            aria-expanded={expanded}
          >
            {expanded ? "Hide Details" : "Show Details"}
          </button>
        </div>
      </div>

      {expanded && (
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Privacy Policy", acknowledged || demoMode ? "Acknowledged" : "Needs Acknowledgment"],
          ["Policy Version", POLICY_VERSION],
          ["Acknowledged By", demoMode ? "Demo Owner" : policyAcknowledgment?.user_name || ""],
          ["Acknowledged On", demoMode ? "Sample timestamp" : formatPolicyTimestamp(policyAcknowledgment?.acknowledged_timestamp)],
          ["Last Dismissed", demoMode ? "Sample timestamp" : formatPolicyTimestamp(policyReminder?.dismissed_timestamp)],
          ["Reminder Count", demoMode ? "2" : String(policyReminder?.reminder_count || 0)],
          ["Case Study Permission", demoMode ? "Demo Data Only" : "Approved with restrictions"],
          ["Custom Domain", demoMode ? "demo.drinkflowkds.com" : "goldieskds.com"],
          ["Fallback Domain", demoMode ? "goldies-demo.drinkflowkds.com" : "goldies.drinkflowkds.com or goldieskds.drinkflowkds.com"],
          ["Domain Status", demoMode ? "Demo Mode" : "Managed by Studio Samantha / DrinkFlow KDS"],
          ["Domain Renewal Date", demoMode ? "Sample future date" : "First-year renewal reminder pending"],
          ["Daily Checks", demoMode ? "Active" : "Active"],
          ["Last Daily Check", lastDailyCheck],
          ["Last Square Sync Check", lastSquareSync],
          ["Last Dashboard Health Check", demoMode ? "Sample timestamp" : "Tracked by scheduled system checks"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] px-3 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6A614F]">
              {label}
            </div>
            <div className="mt-1 text-sm font-black text-[#111111]">
              {value || "Not recorded yet"}
            </div>
          </div>
        ))}
      </div>
      )}
    </section>
  );
}

function buildDemoReportCsv(report, range) {
  const rows = [
    ["DEMO DATA ONLY"],
    ["Business", "DrinkFlow Demo Cafe"],
    ["Report", getOwnerRangeLabel(range)],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Total orders", report?.orderCount || 0],
    ["Total drink units", report?.totalUnits || 0],
    ["Total revenue", report?.totalRevenue || "$0.00"],
    ["Average prep time", "3m 42s"],
    ["Busiest hour", report?.busiestHour || "8:00 AM"],
    ["Top drink", report?.topDrink || "Iced Vanilla Latte"],
    [],
    ["Category", "Units", "Revenue"],
    ...(report?.totalsByCategory || []).map((item) => [
      item.category,
      item.units,
      item.revenue,
    ]),
  ];

  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

function downloadDemoReportCsv(report, range) {
  const blob = new Blob([buildDemoReportCsv(report, range)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `drinkflow-demo-${range}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openDemoReportPreview(report, timingReport, range) {
  const preview = window.open("", "_blank", "noopener,noreferrer");
  if (!preview) return;
  const categories = (report?.totalsByCategory || [])
    .map(
      (item) =>
        `<tr><td>${item.category}</td><td>${item.units}</td><td>${item.revenue}</td></tr>`
    )
    .join("");
  const topDrinks = (report?.totalsByName || [])
    .map((item) => `<li>${item.name}: ${item.qty}</li>`)
    .join("");
  preview.document.write(`<!doctype html>
<html>
  <head>
    <title>DrinkFlow Demo Cafe Report</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color: #222; margin: 32px; }
      .mark { width: 64px; height: 64px; border-radius: 18px; background: #0f4036; color: white; display: grid; place-items: center; font-weight: 900; font-size: 24px; }
      .banner { margin: 18px 0; padding: 12px 14px; border: 2px solid #0f4036; background: #eef7f2; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #ddd; padding: 9px; text-align: left; }
      th { background: #eee0c5; }
      footer { margin-top: 32px; font-size: 12px; color: #555; }
      @media print { button { display: none; } }
    </style>
  </head>
  <body>
    <button onclick="window.print()">Print / Save PDF</button>
    <div class="mark">DF</div>
    <h1>DrinkFlow Demo Cafe</h1>
    <h2>Sample Report - Demo Data Only</h2>
    <div class="banner">DEMO DATA ONLY. This report uses fictional sample data for training, school projects, public demos, and product walkthroughs. No live Goldie's data is included.</div>
    <h3>${getOwnerRangeLabel(range)} Summary</h3>
    <p>Total drinks/orders: ${report?.orderCount || 0}. Drink units: ${report?.totalUnits || 0}. Average prep time: ${timingReport?.label || "3m 42s"}. Busiest hour: ${report?.busiestHour || "8:00 AM"}.</p>
    <table><thead><tr><th>Category</th><th>Units</th><th>Revenue</th></tr></thead><tbody>${categories}</tbody></table>
    <h3>Top Drinks</h3>
    <ul>${topDrinks}</ul>
    <h3>System Health</h3>
    <p>Square sync status: Demo Mode. Daily checks status: Active. Privacy policy status: Passed. Case study permission: Demo Data Only.</p>
    <footer>Generated by DrinkFlow Kitchen Display Systems (KDS). This demo report uses fictional sample data only. No live Goldie's data is included.</footer>
  </body>
</html>`);
  preview.document.close();
}

function OwnerReportsView({
  ownerName,
  onClose,
  themeMode,
  demoMode = false,
  demoTickets = [],
}) {
  const [range, setRange] = useState("today");
  const [customRange, setCustomRange] = useState(() => {
    const end = getTodayDateKey();
    const startDate = new Date(`${end}T00:00:00`);
    startDate.setDate(startDate.getDate() - 89);
    return {
      startDate: getLocalDateInputValue(startDate),
      endDate: end,
    };
  });
  const [report, setReport] = useState(null);
  const [timingReport, setTimingReport] = useState(null);
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
  const [showTimingDetails, setShowTimingDetails] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [showAccessLog, setShowAccessLog] = useState(false);
  const [showOwnerSnapshot, setShowOwnerSnapshot] = useState(false);
  const [showCustomerInsights, setShowCustomerInsights] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);
  const [accessLogError, setAccessLogError] = useState("");
  const [accessLogLoading, setAccessLogLoading] = useState(false);
  const [showRecentChanges, setShowRecentChanges] = useState(false);
  const [policyAcknowledgment] = useState(readPolicyAcknowledgment);
  const [policyReminder] = useState(readPolicyReminder);
  const demoQuery = demoMode ? "?demo=training" : "";
  const selectedRangeLabel = getSelectedOwnerRangeLabel(range, customRange);
  const reportQuery = buildOwnerReportQuery(range, customRange);
  const canLoadSelectedRange = range !== "custom" || isCustomOwnerRangeReady(customRange);

  useEffect(() => {
    let mounted = true;

    async function fetchReport() {
      if (!canLoadSelectedRange) {
        setReport(null);
        setTimingReport(null);
        setError("Choose a valid start and end date for the custom report.");
        setLoading(false);
        return;
      }

      if (demoMode) {
        setReport(buildDemoOwnerReport(demoTickets, range, customRange));
        setTimingReport({
          label: "3m 12s",
          sampleSize: 4,
          byHour: [
            { hour: 9, hourLabel: "9 AM", label: "2m 48s", sampleSize: 2 },
            { hour: 10, hourLabel: "10 AM", label: "3m 36s", sampleSize: 2 },
          ],
          byDrinkName: [
            { name: "Latte", label: "3m 05s", sampleSize: 2 },
            { name: "Cold Brew", label: "2m 10s", sampleSize: 1 },
          ],
        });
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [response, timingResponse] = await Promise.all([
          fetch(apiUrl(`/api/owner/reports/drink-revenue?${reportQuery}`), {
            credentials: "include",
          }),
          fetch(apiUrl(`/api/owner/reports/drink-making-time?${reportQuery}`), {
            credentials: "include",
          }),
        ]);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Report unavailable: ${response.status}`);
        }
        if (!timingResponse.ok) {
          const data = await timingResponse.json().catch(() => ({}));
          throw new Error(data.error || `Timing report unavailable: ${timingResponse.status}`);
        }

        const data = await response.json();
        const timingData = await timingResponse.json();
        if (mounted) {
          setReport(data);
          setTimingReport(timingData);
        }
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
  }, [range, customRange, demoMode, demoTickets, reportQuery, canLoadSelectedRange]);

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

  useEffect(() => {
    if (demoMode || !showAccessLog) return;

    async function fetchOwnerAccessLog() {
      try {
        setAccessLogLoading(true);
        setAccessLogError("");
        const response = await fetch(apiUrl("/api/owner/access-log?limit=12"), {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Access log unavailable: ${response.status}`);
        }

        setAccessLogs(data.logs || []);
        if (data.tableMissing) {
          setAccessLogError("Access log table is not installed in Supabase yet.");
        }
      } catch (logError) {
        setAccessLogError(logError.message || "Access log unavailable");
      } finally {
        setAccessLogLoading(false);
      }
    }

    fetchOwnerAccessLog();
  }, [demoMode, showAccessLog]);

  async function handleSaveSnapshot() {
    if (!report) return;

    const snapshot = buildOwnerSnapshotAnalysis(report, range);
    const advice = buildCoffeeShopAdvice(report, range);
    const moneySignal =
      snapshot.watch.find((item) => item.title === "Sales read")?.body || "";
    const ownerAction =
      snapshot.watch.find((item) => item.title === "What you should do next")?.body || "";

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
          rangeLabel: selectedRangeLabel,
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
    if (demoMode) {
      onClose();
      return;
    }

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
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={OWNER_LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-full max-w-full object-contain"
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#6A614F]">
                {demoMode ? "DrinkFlow Demo Cafe" : "Owner Reports"}
              </div>
              <h1 className="mt-1 text-3xl font-black text-[#0F4036]">
                {demoMode ? "Demo Owner Reports" : "Drink Revenue"}
              </h1>
              <p className="mt-1 text-sm text-[#6A614F]">
                {demoMode
                  ? "Sample analytics and reports for DrinkFlow Kitchen Display Systems (KDS)"
                  : "Coffee, Not Coffee, and Smoothies only"}
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
              className="rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
            >
              {demoMode ? "Exit demo" : "Back to dashboard"}
            </button>
          </div>
        </header>

        {ownerPasswordNotice && (
          <div className="rounded-2xl border border-[#0F4036]/12 bg-[#0F4036]/8 px-4 py-3 text-sm font-bold text-[#0F4036]">
            {ownerPasswordNotice}
          </div>
        )}

        {!demoMode && (
          <section className="rounded-3xl border border-[#CA862B]/18 bg-[rgba(255,253,248,0.94)] p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                  Recent production changes
                </div>
                <h2 className="mt-1 text-xl font-black text-[#0F4036]">
                  What changed in {APP_VERSION}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
                  Short owner notes for live-service fixes and ordering updates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentChanges((current) => !current)}
                className="rounded-xl border border-[#CA862B]/18 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              >
                {showRecentChanges ? "Hide notes" : "Show notes"}
              </button>
            </div>
            {showRecentChanges && (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {OWNER_PORTAL_RECENT_CHANGES.map((change) => (
                <div key={change.title} className="rounded-2xl border border-[#CA862B]/12 bg-white px-4 py-3">
                  <div className="text-sm font-black text-[#0F4036]">
                    {change.title}
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
                    {change.body}
                  </p>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {demoMode && (
          <div className="rounded-3xl border-2 border-[#0F4036] bg-[#eaf7f1] px-5 py-4 text-[#0F4036] shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.18em]">
              Demo Mode
            </div>
            <div className="mt-1 text-lg font-black">
              This dashboard uses sample data only. No live Goldie&apos;s Square data
              is shown.
            </div>
            <p className="mt-2 text-sm font-semibold leading-6">
              Data shown here is fictional and intended for training, school
              projects, public demos, screenshots, portfolio use, customer
              conversations, and product walkthroughs.
            </p>
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
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          openDemoReportPreview(report, timingReport, range);
                          setReportExportMenuOpen(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                      >
                        Preview / Print PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadDemoReportCsv(report, range);
                          setReportExportMenuOpen(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                      >
                        Download CSV
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.csv?${reportQuery}`)}
                        className="block px-4 py-3 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                        onClick={() => setReportExportMenuOpen(false)}
                      >
                        CSV
                      </a>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.xlsx?${reportQuery}`)}
                        className="block px-4 py-3 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                        onClick={() => setReportExportMenuOpen(false)}
                      >
                        Excel workbook
                      </a>
                      <a
                        href={apiUrl(`/api/owner/reports/drink-revenue.pdf?${reportQuery}`)}
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

          {range === "custom" && (
            <div className="mb-4 grid gap-3 rounded-2xl border border-[#CA862B]/18 bg-white/80 p-3 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                  Start date
                </span>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 text-sm font-bold text-[#111111] outline-none focus:border-[#0F4036]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                  End date
                </span>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2.5 text-sm font-bold text-[#111111] outline-none focus:border-[#0F4036]"
                />
              </label>
              <div className="rounded-xl border border-[#0F4036]/10 bg-[#FFFDF8] px-4 py-3 text-sm font-bold leading-5 text-[#0F4036]">
                {selectedRangeLabel}
              </div>
            </div>
          )}

          <PrivacyAgreementsCard
            demoMode={demoMode}
            policyAcknowledgment={policyAcknowledgment}
            policyReminder={policyReminder}
          />

          {!demoMode && (
            <section className="mb-4 rounded-2xl border border-[#CA862B]/18 bg-white/80 p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                    Owner sessions
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
                    Recent owner reports sign-ins stay tucked away unless you need to review them.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccessLog((current) => !current)}
                  className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  {showAccessLog ? "Hide sessions" : "Show sessions"}
                </button>
              </div>

              {showAccessLog && (
                <div className="mt-3 rounded-xl border border-[#CA862B]/12 bg-[#FFFDF8] p-3">
                  {accessLogLoading ? (
                    <div className="text-sm font-semibold text-[#6A614F]">
                      Loading recent access...
                    </div>
                  ) : accessLogs.length ? (
                    <div className="space-y-2">
                      {accessLogs.map((entry) => (
                        <div
                          key={entry.id || `${entry.actor}-${entry.created_at}`}
                          className="flex flex-col gap-1 rounded-lg bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="font-black text-[#111111]">
                              {entry.actor || "Owner"}
                            </div>
                            <div className="text-xs font-bold text-[#6A614F]">
                              {entry.action || "login"} · {entry.role || "owner"}
                            </div>
                            {entry.ip_address ? (
                              <div className="text-[11px] font-bold text-[#8B5A1D]">
                                IP {entry.ip_address}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-sm font-black text-[#0F4036]">
                            {entry.created_at
                              ? new Date(entry.created_at).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-[#6A614F]">
                      No owner access entries yet.
                    </div>
                  )}
                  {accessLogError ? (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                      {accessLogError}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-900 px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-[#CA862B]/18 bg-white/80 p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                  Customer tools
                </div>
                <div className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
                  Customer-facing ordering and display screens connected to the KDS workflow.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/volume-board${demoQuery}`}
                  className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Volume Board
                </a>
                <a
                  href={`/online-ordering-beta${demoQuery}`}
                  className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Online Orders
                </a>
                <a
                  href={`/self-order-kiosk${demoQuery}`}
                  className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                >
                  Self Order Kiosk
                </a>
                {!demoMode && (
                  <a
                    href="/demo/owner"
                    className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                  >
                    Demo Owner Reports
                  </a>
                )}
              </div>
            </div>
          </div>

          {demoMode && (
            <section className="mb-4 rounded-2xl border border-[#CA862B]/18 bg-white/80 p-3 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                Demo reports
              </div>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#6A614F]">
                Reports generated here use fake sample data and generic branding. They
                are safe for school projects, screenshots, public demos, and customer
                walkthroughs.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  "Daily Summary",
                  "Last 7 Days Report",
                  "Last 30 Days Report",
                  "Monthly Report",
                  "Category Breakdown",
                  "Rush Hour Report",
                  "System Health Report",
                  "Workflow Report",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openDemoReportPreview(report, timingReport, range)}
                    className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
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

              <div className="mt-4 rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                      Bar workflow timing
                    </div>
                    <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
                      Average drink time: {timingReport?.label || "Collecting"}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#6A614F]">
                      Based on staff Start-to-Ready taps. A one-second handcrafted drink usually means the Start button was tapped late, not that the drink was actually made in one second.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTimingDetails((current) => !current)}
                    className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                  >
                    {showTimingDetails ? "Hide timing details" : "Show timing details"}
                  </button>
                </div>
                {showTimingDetails && (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#0F4036]/8 bg-[#FFFDF8] p-3">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
                      By hour
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {timingReport?.byHour?.length ? (
                        timingReport.byHour.slice(0, 8).map((hour) => (
                          <div key={hour.hour} className="rounded-lg bg-white px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-[#111111]">{hour.hourLabel}</span>
                              <span className="font-black text-[#0F4036]">{hour.label}</span>
                            </div>
                            <div className="text-xs font-bold text-[#6A614F]">{hour.sampleSize} orders timed</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm font-semibold text-[#6A614F]">
                          No hourly timing samples yet.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#0F4036]/8 bg-[#FFFDF8] p-3">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">
                      By drink name
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {timingReport?.byDrinkName?.length ? (
                        timingReport.byDrinkName.slice(0, 8).map((drink) => (
                          <div key={drink.name} className="rounded-lg bg-white px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-black text-[#111111]">{drink.name}</span>
                              <span className="shrink-0 font-black text-[#0F4036]">{drink.label}</span>
                            </div>
                            <div className="text-xs font-bold text-[#6A614F]">{drink.sampleSize} orders timed</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm font-semibold text-[#6A614F]">
                          No drink-name timing samples yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                      Owner read
                    </div>
                    <h2 className="mt-1 text-xl font-black text-[#0F4036]">
                      Today&apos;s Snapshot
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[#6A614F]">
                      Collapsed so the main report stays easy to scan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOwnerSnapshot((current) => !current)}
                    className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                  >
                    {showOwnerSnapshot ? "Hide Today's Snapshot" : "Show Today's Snapshot"}
                  </button>
                </div>
                {showOwnerSnapshot && (
                  <div className="mt-4">
                    <OwnerSnapshotCard report={report} range={range} />
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <HourlyVolumeChart report={report} range={range} />
                <CoffeeShopAdvice report={report} range={range} />
              </div>

              <div className="mt-4 rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                      Category detail
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#6A614F]">
                      Collapsed by default so the owner view stays focused.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDetails((current) => !current)}
                    className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                  >
                    {showCategoryDetails ? "Hide category mix" : "Show category mix"}
                  </button>
                </div>

                {showCategoryDetails && (
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
                )}
              </div>

              {demoMode && (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <section className="rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                      Recent demo orders
                    </div>
                    <div className="mt-3 space-y-2">
                      {(report?.recentOrders || []).map((order) => (
                        <div key={order.orderNumber} className="flex items-center justify-between gap-3 rounded-xl border border-[#CA862B]/10 bg-[#FFFDF8] px-3 py-2 text-sm">
                          <div className="font-black text-[#111111]">
                            Order #{order.orderNumber} - {order.item}
                          </div>
                          <div className="shrink-0 font-bold text-[#0F4036]">
                            {order.status} - {order.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl border border-[#CA862B]/16 bg-white p-4 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5A1D]">
                      Demo system checks
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(report?.systemChecks || []).map((check) => (
                        <div key={check.label} className="rounded-xl border border-[#CA862B]/10 bg-[#FFFDF8] px-3 py-2">
                          <div className="text-xs font-black uppercase tracking-[0.12em] text-[#6A614F]">
                            {check.label}
                          </div>
                          <div className="mt-1 text-sm font-black text-[#0F4036]">
                            {check.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </section>

        {!demoMode && (
          <section className="rounded-3xl border border-white/70 bg-[rgba(255,253,248,0.92)] p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                  Customer insights
                </div>
                <h2 className="mt-1 text-2xl font-black text-[#0F4036]">
                  Notes from the counter
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6A614F]">
                  Collapsed so Owner Reports stays focused during service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerInsights((current) => !current)}
                className="rounded-xl border border-[#CA862B]/22 bg-[#FFFDF8] px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              >
                {showCustomerInsights ? "Hide customer insights" : "Show customer insights"}
              </button>
            </div>
            {showCustomerInsights && (
              <div className="mt-4">
                <CustomerInsightsHistory />
              </div>
            )}
          </section>
        )}
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
  isTrainingMode = false,
}) {
  const [employeeName, setEmployeeName] = useState("Employee");
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
        body: JSON.stringify({ password, employeeName: employeeName.trim() || "Employee" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setPassword("");
      setEmployeeName("");
      setFailedAttempts(0);
      setLockoutUntil(0);
      onLogin(data.employeeName || employeeName.trim() || "Employee");
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
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onOwnerLogin}
            className="rounded-xl border border-[#CA862B]/22 bg-[#0F4036] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
          >
            {isTrainingMode ? "Training Owner Reports" : "Owner Reports"}
          </button>
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
            disabled={submitting || lockoutActive || !password}
            className="w-full rounded-2xl bg-[#0F4036] text-white px-4 py-3 font-black transition hover:bg-[#0b352d] disabled:cursor-not-allowed disabled:bg-neutral-300 shadow-[0_18px_40px_rgba(15,64,54,0.18)]"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 flex justify-center pb-1 pointer-events-auto">
          <BrandFooter className="max-w-full px-4 py-2 text-[11px] sm:text-[10px]" />
        </div>
        <div className="mt-3 flex justify-center pointer-events-auto">
          <PoweredByDrinkFlow />
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

function getDisplayRoute() {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/goldies-menu" || path === "/menu-board") return "menu";
  if (path === "/orders-up" || path === "/customer-orders") return "orders";
  if (path === "/drive-thru" || path === "/drive-thru-board") return "drive-thru";
  if (path === "/volume-board" || path === "/drink-volume") return "volume";
  if (path === "/online-orders" || path === "/online-order-board") return "online-orders";
  return "";
}

function getDashboardReportPanel() {
  if (typeof window === "undefined") return "";

  try {
    const path = window.location.pathname.replace(/\/+$/, "");
    const params = new URLSearchParams(window.location.search);
    const panel = params.get("panel") || "";
    const normalizedPanel = ["today-count", "orders-by-day", "stats"].includes(panel)
      ? panel
      : "";

    if (normalizedPanel) return normalizedPanel;
    if (path === "/today-count") return "today-count";
    if (path === "/orders-by-day") return "orders-by-day";
    if (path === "/stats") return "stats";
  } catch {
    return "";
  }

  return "";
}

function openDashboardReportWindow(panel) {
  if (typeof window === "undefined") return;

  window.open(
    getDashboardReportHref(panel),
    "_blank",
    "noopener,noreferrer,width=1280,height=900"
  );
}

function useDisplayTheme() {
  const [themeMode, setThemeMode] = useState(getSavedThemeMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore storage failures
    }
  }, [themeMode]);

  return {
    themeMode,
    isDark: themeMode === "dark",
    toggleTheme: () =>
      setThemeMode((current) => (current === "dark" ? "light" : "dark")),
  };
}

function useFullscreenMode() {
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false
  );
  const [fullscreenMessage, setFullscreenMessage] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenMessage("");
    } catch {
      setFullscreenMessage("Use your browser menu if full screen is blocked.");
    }
  }

  return { isFullscreen, fullscreenMessage, toggleFullscreen };
}

function useScreenWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return undefined;
    }

    let wakeLock = null;
    let cancelled = false;

    async function requestWakeLock() {
      if (document.visibilityState !== "visible") return;

      try {
        wakeLock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await wakeLock.release().catch(() => {});
          return;
        }

        wakeLock.addEventListener("release", () => {
          if (!cancelled && document.visibilityState === "visible") {
            requestWakeLock();
          }
        });
      } catch {
        // Chrome may require a user gesture. Retry on the next tap.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") requestWakeLock();
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pointerdown", requestWakeLock);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pointerdown", requestWakeLock);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [enabled]);
}

function DisplayBackground({ children, accent = "gold", darkMode = false }) {
  useScreenWakeLock(true);

  const isGreen = accent === "green";
  const backgroundImage = darkMode
    ? "radial-gradient(circle at 12% 8%, rgba(202,134,43,0.22), transparent 28%), radial-gradient(circle at 86% 4%, rgba(255,253,248,0.1), transparent 32%), linear-gradient(135deg, #041c19 0%, #0F4036 48%, #1F160F 100%)"
    : isGreen
      ? "radial-gradient(circle at 20% 12%, rgba(15,64,54,0.22), transparent 30%), radial-gradient(circle at 82% 8%, rgba(202,134,43,0.26), transparent 30%), linear-gradient(135deg, #FFFDF8 0%, #F4E8D1 46%, #EEE0C5 100%)"
      : "radial-gradient(circle at 12% 8%, rgba(202,134,43,0.2), transparent 28%), radial-gradient(circle at 86% 4%, rgba(15,64,54,0.2), transparent 32%), linear-gradient(135deg, #FFFDF8 0%, #F8F1E5 48%, #E7EEE9 100%)";

  return (
    <div
      className={`min-h-screen px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 overflow-x-hidden ${
        darkMode ? "bg-[#041c19] text-[#FFF7EA]" : "bg-[#FFFDF8] text-[#111111]"
      }`}
      style={{ backgroundImage }}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url(${darkMode ? LOGO_DARK_URL : LOGO_URL})`,
          backgroundSize: "180px",
          backgroundRepeat: "repeat",
          transform: "rotate(-8deg) scale(1.08)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function DisplayHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-3xl border border-[#CA862B]/20 bg-white/82 shadow-[0_22px_60px_rgba(15,64,54,0.12)]">
          <img src={LOGO_URL} alt="Goldie's Coffee & Goods" className="max-h-14 max-w-14 object-contain" />
        </div>
        <div>
          <div className="text-xs md:text-sm font-black uppercase tracking-[0.22em] text-[#8B5A1D]">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0F4036] md:text-4xl">
            {title}
          </h1>
        </div>
      </div>
      <p className="max-w-xl text-base font-bold leading-7 text-[#5A4F3E] md:text-xl md:text-right">
        {subtitle}
      </p>
    </header>
  );
}

function DisplayStatus({ error }) {
  if (!error) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] sm:mt-5 sm:gap-3 sm:text-sm sm:tracking-[0.16em]">
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-red-900 shadow-sm sm:px-4">
        {error}
      </span>
    </div>
  );
}

function DisplayBackButton() {
  const { isFullscreen } = useFullscreenMode();
  if (isFullscreen) return null;
  const demoMode = isDemoTrainingRoute();

  return (
    <a
      href={demoMode ? "/?demo=training" : "/"}
      className="fixed bottom-3 right-3 z-30 rounded-full border border-white/24 bg-[#0F4036]/90 px-3 py-2 text-xs font-semibold text-white shadow-[0_16px_44px_rgba(15,64,54,0.22)] backdrop-blur-md transition hover:bg-[#0b352d] xl:right-4 xl:top-4 xl:bottom-auto xl:px-4 xl:text-sm"
    >
      Back to KDS
    </a>
  );
}

function getDisplayHref(path, demoMode = false) {
  return demoMode ? `${path}?demo=training` : path;
}

function getDemoDisplayTickets() {
  return createTrainingTickets().sort((a, b) => a.createdAt - b.createdAt);
}

function ticketToCustomerDisplayOrder(ticket) {
  return {
    id: ticket.id,
    orderNumber: ticket.orderNumber || ticket.id,
    customerName: ticket.customerName || "",
    diningOption: ticket.diningOption || "Order",
    source: ticket.source || "Square",
    isOnlineOrder: isOnlineTicket(ticket),
    pickupDueTime: ticket.pickupDueTime || "",
    status: ticket.status,
    createdAt: ticket.createdAt || null,
    updatedAt: ticket.completedAt || ticket.createdAt || null,
    items: getDrinkItems(ticket).map((item) => ({
      name: getCanonicalDrinkName(item.name || "Drink"),
      qty: Number(item.qty || 1) || 1,
      modifiers: Array.isArray(item.modifiers) ? item.modifiers.filter(Boolean) : [],
      note: item.note || "",
    })),
  };
}

function getDemoOrdersUpDisplay() {
  const displayTickets = getDemoDisplayTickets().filter(hasDrinkItems);
  return {
    making: displayTickets
      .filter((ticket) => ticket.status === "making")
      .map((ticket) => ({ ...ticketToCustomerDisplayOrder(ticket), status: "Being made" })),
    ready: displayTickets
      .filter((ticket) => ticket.status === "ready")
      .map(ticketToCustomerDisplayOrder),
    recentlyCompleted: displayTickets
      .filter((ticket) => ticket.status === "completed" || ticket.status === "done")
      .map(ticketToCustomerDisplayOrder),
  };
}

function getDemoDriveThruDisplay() {
  return getDemoDisplayTickets()
    .filter((ticket) => {
      const option = String(ticket.diningOption || "").toLowerCase();
      return (
        ["new", "making", "ready"].includes(ticket.status) &&
        hasDrinkItems(ticket) &&
        (option.includes("pickup") || option.includes("drive"))
      );
    })
    .map(ticketToCustomerDisplayOrder);
}

function getDemoOnlineOrdersDisplay() {
  return getDemoDisplayTickets()
    .filter((ticket) => ["new", "making", "ready"].includes(ticket.status) && hasDrinkItems(ticket))
    .slice(0, 3)
    .map((ticket) => ({
      ...ticketToCustomerDisplayOrder(ticket),
      source: "Online Pickup",
      isOnlineOrder: true,
    }));
}

function getDemoMenuDisplay() {
  const groups = new Map();
  const samplePrices = {
    Coffee: "$5.75",
    "Not Coffee": "$6.25",
    Smoothies: "$7.00",
  };

  for (const ticket of getDemoDisplayTickets()) {
    for (const item of getDrinkItems(ticket)) {
      const category = getBeverageCategory(item.name) || "Drinks";
      if (!groups.has(category)) groups.set(category, new Set());
      groups.get(category).add(item.name);
    }
  }

  return Array.from(groups.entries()).map(([label, names]) => ({
    key: label,
    label,
    items: Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        price: samplePrices[label] || "Ask",
      })),
  }));
}

function FullscreenButton({ darkMode = false }) {
  const { isFullscreen, fullscreenMessage, toggleFullscreen } = useFullscreenMode();
  if (isFullscreen) return null;

  const buttonClass = darkMode
    ? "border-white/20 bg-white/12 text-[#FFF7EA] hover:bg-white/18"
    : "border-white/24 bg-[#0F4036]/90 text-white hover:bg-[#0b352d]";

  return (
    <div className="fixed bottom-3 left-3 z-30 xl:left-auto xl:right-32 xl:top-4 xl:bottom-auto">
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label="Enter full screen"
        className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_16px_44px_rgba(15,64,54,0.22)] backdrop-blur-md transition xl:px-4 xl:text-sm ${buttonClass}`}
      >
        Full screen
      </button>
      {fullscreenMessage && (
        <div className="mt-2 max-w-[190px] rounded-2xl bg-white/92 px-3 py-2 text-xs font-semibold text-[#0F4036] shadow-lg">
          {fullscreenMessage}
        </div>
      )}
    </div>
  );
}

function DisplayThemeButton({ themeMode, onToggle, darkMode = false }) {
  const { isFullscreen } = useFullscreenMode();
  if (isFullscreen) return null;

  const buttonClass = darkMode
    ? "border-white/20 bg-white/12 text-[#FFF7EA] hover:bg-white/18"
    : "border-white/24 bg-[#0F4036]/90 text-white hover:bg-[#0b352d]";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_16px_44px_rgba(15,64,54,0.22)] backdrop-blur-md transition xl:left-auto xl:right-[15.25rem] xl:top-4 xl:bottom-auto xl:translate-x-0 xl:px-4 xl:text-sm ${buttonClass}`}
    >
      {themeMode === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

const DISPLAY_SWITCHER_OPTIONS = [
  { route: "menu", label: "Menu", path: "/goldies-menu" },
  { route: "orders", label: "Orders Up", path: "/orders-up" },
  { route: "online-orders", label: "Online", path: "/online-orders" },
  { route: "drive-thru", label: "Drive Thru", path: "/drive-thru" },
  { route: "volume", label: "Volume", path: "/volume-board" },
];

function DisplaySwitcher({ activeRoute, darkMode = false, demoMode = false }) {
  const { isFullscreen } = useFullscreenMode();
  if (isFullscreen) return null;

  const inactiveClass = darkMode
    ? "border-white/14 bg-white/10 text-[#FFF7EA] hover:bg-white/16"
    : "border-[#0F4036]/12 bg-white/86 text-[#0F4036] hover:bg-white";

  return (
    <nav className="mx-auto flex w-full max-w-[1500px] flex-wrap gap-2 rounded-[18px] border border-white/60 bg-white/60 p-2 shadow-sm backdrop-blur-md" aria-label="Display boards">
      {DISPLAY_SWITCHER_OPTIONS.map((option) => {
        const isActive = option.route === activeRoute;
        return (
          <a
            key={option.route}
            href={getDisplayHref(option.path, demoMode)}
            className={`rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              isActive
                ? "bg-[#0F4036] text-white"
                : inactiveClass
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {option.label}
          </a>
        );
      })}
    </nav>
  );
}

function MenuBoardDisplay() {
  const { themeMode, isDark, toggleTheme } = useDisplayTheme();
  const demoMode = isDemoTrainingRoute();
  const [menu, setMenu] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refreshMenu() {
      if (demoMode) {
        setMenu(getDemoMenuDisplay());
        setUpdatedAt(new Date().toISOString());
        setError("");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/display/menu"), {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("Sign in to the KDS on this device first.");
        }
        if (!response.ok) {
          throw new Error(`Menu unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setMenu(data.categories || []);
        setUpdatedAt(data.updatedAt || "");
        setError("");
      } catch (displayError) {
        if (!mounted) return;
        setError(displayError.message || "Menu unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshMenu();
    const interval = setInterval(refreshMenu, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [demoMode]);

  const fallbackMenu = GOLDIES_MENU_CATEGORY_LABELS.map((label) => ({
    label,
    items: [],
  }));
  const cardClass = isDark
    ? "border-white/12 bg-[#082622] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    : "border-[#0F4036]/10 bg-white shadow-[0_24px_70px_rgba(15,64,54,0.12)]";
  const cardHeaderClass = isDark
    ? "border-white/10 bg-white/8"
    : "border-[#0F4036]/10 bg-[#FFFDF8]";
  const headingClass = isDark ? "text-[#FFF7EA]" : "text-[#0F4036]";
  const itemClass = isDark ? "text-[#FFF7EA]" : "text-[#2D261C]";
  const priceClass = isDark
    ? "bg-[#CA862B]/18 text-[#F3D39B]"
    : "bg-[#0F4036]/8 text-[#0F4036]";

  return (
    <DisplayBackground darkMode={isDark}>
      <DisplayBackButton />
      <FullscreenButton darkMode={isDark} />
      <DisplayThemeButton themeMode={themeMode} onToggle={toggleTheme} darkMode={isDark} />
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1500px] flex-col gap-3 sm:min-h-[calc(100vh-44px)] md:gap-4">
        <DisplaySwitcher activeRoute="menu" darkMode={isDark} demoMode={demoMode} />
        <header className="overflow-hidden rounded-[20px] border border-[#0F4036]/14 bg-[#0F4036] text-white shadow-[0_20px_60px_rgba(15,64,54,0.18)] sm:rounded-[26px]">
          <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr] sm:items-center sm:p-4 md:grid-cols-[auto_1fr_auto] md:gap-4 md:p-5">
            <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 sm:rounded-[18px] md:h-20 md:w-20 md:rounded-[22px]">
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12 md:max-h-14 md:max-w-14"
                />
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3D39B] sm:text-xs sm:tracking-[0.24em]">
                {demoMode ? "DF Demo Cafe" : "Goldie's Coffee & Goods"}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl">
                Drink Menu
              </h1>
            </div>
            <div className="hidden rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 md:block">
              Fresh today
            </div>
          </div>
        </header>
        <DisplayStatus loading={loading} error={error} updatedAt={updatedAt} darkMode={isDark} />

        <main className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-3 xl:gap-4">
          {(menu.length ? menu : fallbackMenu).map((category) => (
            <section
              key={category.key || category.label}
              className={`flex min-h-0 flex-col overflow-hidden rounded-[18px] border sm:rounded-[24px] lg:min-h-[360px] ${cardClass}`}
            >
              <div className={`border-b px-3 py-3 sm:px-4 sm:py-4 ${cardHeaderClass}`}>
                <h2 className={`text-xl font-semibold tracking-normal md:text-2xl ${headingClass}`}>
                  {category.label}
                </h2>
              </div>
              <div className={`grid gap-0 divide-y ${isDark ? "divide-white/10" : "divide-[#0F4036]/8"}`}>
                {category.items?.length ? (
                  category.items.map((item) => (
                    <div
                      key={item.name}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <span className={`min-w-0 text-sm font-medium leading-tight tracking-normal sm:text-base md:text-lg ${itemClass}`}>
                        {item.name}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:text-sm md:text-base ${priceClass}`}>
                        {item.price || "Ask"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={`m-5 rounded-2xl border border-dashed border-[#CA862B]/24 p-6 text-lg font-semibold ${isDark ? "bg-white/8 text-[#FFF7EA]/72" : "bg-[#FFFDF8] text-[#6A614F]"}`}>
                    Menu loading
                  </div>
                )}
              </div>
            </section>
          ))}
        </main>
      </div>
    </DisplayBackground>
  );
}

function CustomerOrderDetails({ order, darkMode = false, compact = false }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const nameClass = darkMode ? "text-[#FFF7EA]" : "text-[#2D261C]";
  const detailClass = darkMode ? "text-[#FFF7EA]/68" : "text-[#6A614F]";
  const itemGridStyle = compact
    ? undefined
    : { gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))" };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong className={`min-w-0 break-words text-lg font-semibold leading-none tracking-normal sm:text-xl ${nameClass}`}>
          {order.customerName || `Order ${order.orderNumber}`}
        </strong>
        {order.customerName ? (
          <span className={`min-w-0 break-words text-sm font-medium sm:text-base ${detailClass}`}>
            Order {order.orderNumber}
          </span>
        ) : null}
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          order.isOnlineOrder
            ? darkMode
              ? "bg-red-500/22 text-red-100"
              : "bg-red-100 text-red-800"
            : darkMode
              ? "bg-white/10 text-[#FFF7EA]/76"
              : "bg-[#0F4036]/8 text-[#0F4036]"
        }`}>
          {order.isOnlineOrder ? "Online" : "In person"}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5" style={itemGridStyle}>
        {items.length ? (
          items.map((item, index) => {
            const isDone = Boolean(item.done);

            return (
              <div
                key={`${order.id}-${item.name}-${index}`}
                className={`min-w-0 rounded-xl border px-2.5 py-2 ${
                  isDone
                    ? darkMode
                      ? "border-emerald-200/16 bg-emerald-200/10"
                      : "border-[#0F4036]/12 bg-[#0F4036]/6"
                    : darkMode
                      ? "border-white/10 bg-white/8"
                      : "border-[#0F4036]/10 bg-[#FFFDF8]"
                }`}
              >
                <div className={`flex min-w-0 items-start gap-2 text-sm font-semibold leading-tight sm:text-base ${isDone ? (darkMode ? "text-[#FFF7EA]/62" : "text-[#0F4036]/62") : nameClass}`}>
                  {isDone ? (
                    <span className={`mt-[-1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      darkMode ? "bg-emerald-200/18 text-emerald-100" : "bg-[#0F4036] text-white"
                    }`}>
                      ✓
                    </span>
                  ) : null}
                  <span className={`min-w-0 break-words ${isDone ? "line-through decoration-2" : ""}`}>
                    {item.qty > 1 ? `${item.qty}x ` : ""}
                    {item.name}
                  </span>
                </div>
                {(item.modifiers?.length || item.note) ? (
                  <div className={`mt-1 break-words text-xs font-medium leading-snug sm:text-sm ${isDone ? (darkMode ? "text-[#FFF7EA]/48 line-through decoration-1" : "text-[#0F4036]/48 line-through decoration-1") : detailClass}`}>
                    {[...(item.modifiers || []), item.note].filter(Boolean).join(", ")}
                  </div>
                ) : null}
                {isDone ? (
                  <div className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${darkMode ? "text-emerald-100/72" : "text-[#0F4036]/68"}`}>
                    Done
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${darkMode ? "border-white/10 bg-white/8 text-[#FFF7EA]/68" : "border-[#0F4036]/10 bg-[#FFFDF8] text-[#6A614F]"}`}>
            Drink details loading
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersUpDisplay() {
  const { themeMode, isDark, toggleTheme } = useDisplayTheme();
  const demoMode = isDemoTrainingRoute();
  const [orders, setOrders] = useState({ making: [], ready: [], recentlyCompleted: [] });
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingOrderId, setCompletingOrderId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refreshOrders() {
      if (demoMode) {
        setOrders(getDemoOrdersUpDisplay());
        setUpdatedAt(new Date().toISOString());
        setError("");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/display/orders-up"), {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("Sign in to the KDS on this device first.");
        }
        if (!response.ok) {
          throw new Error(`Orders unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setOrders({
          making: data.making || [],
          ready: data.ready || [],
          recentlyCompleted: data.recentlyCompleted || [],
        });
        setUpdatedAt(data.updatedAt || "");
        setError("");
      } catch (displayError) {
        if (!mounted) return;
        setError(displayError.message || "Orders unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshOrders();
    const interval = setInterval(refreshOrders, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [demoMode]);

  async function handlePickupClick(order) {
    if (!order?.id || completingOrderId) return;
    if (demoMode) {
      setOrders((current) => ({
        making: current.making,
        ready: current.ready.filter((entry) => entry.id !== order.id),
        recentlyCompleted: [
          { ...order, status: "Picked up", completedAt: new Date().toISOString() },
          ...current.recentlyCompleted,
        ].slice(0, 8),
      }));
      return;
    }

    setCompletingOrderId(order.id);
    setError("");

    try {
      const response = await fetch(apiUrl(`/api/tickets/${order.id}/status`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Could not mark order picked up: ${response.status}`);
      }

      setOrders((current) => ({
        making: current.making,
        ready: current.ready.filter((entry) => entry.id !== order.id),
        recentlyCompleted: [
          { ...order, status: "Picked up", completedAt: new Date().toISOString() },
          ...current.recentlyCompleted,
        ].slice(0, 8),
      }));
      setUpdatedAt(new Date().toISOString());
    } catch (pickupError) {
      setError(pickupError.message || "Could not mark order picked up.");
    } finally {
      setCompletingOrderId("");
    }
  }

  const cardClass = isDark
    ? "border-white/12 bg-[#082622] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    : "border-[#0F4036]/10 bg-white shadow-[0_24px_70px_rgba(15,64,54,0.12)]";
  const cardHeaderClass = isDark
    ? "border-white/10 bg-white/8"
    : "border-[#0F4036]/10 bg-[#FFFDF8]";
  const headingClass = isDark ? "text-[#FFF7EA]" : "text-[#0F4036]";
  const mutedClass = isDark ? "text-[#FFF7EA]/68" : "text-[#6A614F]";
  const readyTileClass = isDark
    ? "border-[#CA862B]/22 bg-[#082622] text-[#FFF7EA]"
    : "border-[#0F4036]/10 bg-white text-[#111111]";
  const orderTileGridStyle = {
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
  };

  return (
    <DisplayBackground accent="green" darkMode={isDark}>
      <DisplayBackButton />
      <FullscreenButton darkMode={isDark} />
      <DisplayThemeButton themeMode={themeMode} onToggle={toggleTheme} darkMode={isDark} />
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1500px] flex-col gap-3 sm:min-h-[calc(100vh-44px)] md:gap-4">
        <DisplaySwitcher activeRoute="orders" darkMode={isDark} demoMode={demoMode} />
        <header className="overflow-hidden rounded-[20px] border border-[#0F4036]/14 bg-[#0F4036] text-white shadow-[0_20px_60px_rgba(15,64,54,0.18)] sm:rounded-[26px]">
          <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr] sm:items-center sm:p-4 md:grid-cols-[auto_1fr_auto] md:gap-4 md:p-5">
            <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 sm:rounded-[18px] md:h-20 md:w-20 md:rounded-[22px]">
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12 md:max-h-14 md:max-w-14"
                />
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3D39B] sm:text-xs sm:tracking-[0.24em]">
                {demoMode ? "DF Demo Cafe" : "Goldie's Coffee & Goods"}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl">
                Orders Up
              </h1>
            </div>
            <div className="hidden rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 md:block">
              Pickup counter
            </div>
          </div>
        </header>
        <DisplayStatus loading={loading} error={error} updatedAt={updatedAt} darkMode={isDark} />

        <main className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-[0.9fr_1.1fr_0.65fr] xl:gap-4">
          <section className={`overflow-hidden rounded-[18px] border sm:rounded-[24px] ${cardClass}`}>
            <div className={`flex items-end justify-between gap-3 border-b px-3 py-3 sm:px-4 sm:py-4 ${cardHeaderClass}`}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D] sm:text-xs sm:tracking-[0.2em]">
                  Being made
                </div>
                <h2 className={`mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl ${headingClass}`}>
                  At the bar
                </h2>
              </div>
              <div className={`rounded-full px-3 py-1.5 text-sm font-semibold sm:px-4 sm:text-base ${isDark ? "bg-white/10 text-[#FFF7EA]" : "bg-[#CA862B]/12 text-[#8B5A1D]"}`}>
                {orders.making.length}
              </div>
            </div>

            {orders.making.length ? (
              <div className="grid gap-2.5 p-3" style={orderTileGridStyle}>
                {orders.making.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-[16px] border p-3 sm:rounded-[20px] ${isDark ? "border-[#CA862B]/22 bg-white/8 text-[#FFF7EA]" : "border-[#CA862B]/18 bg-[#FFFDF8] text-[#111111]"}`}
                  >
                    <CustomerOrderDetails order={order} darkMode={isDark} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[180px] place-items-center p-4 text-center">
                <div>
                  <div className={`text-xl font-semibold tracking-normal sm:text-2xl ${headingClass}`}>
                    No drinks at the bar
                  </div>
                  <p className={`mt-2 text-base font-medium ${mutedClass}`}>
                    Orders move here once staff starts them.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={`overflow-hidden rounded-[18px] border sm:rounded-[24px] ${cardClass}`}>
            <div className={`flex items-end justify-between gap-3 border-b px-3 py-3 sm:px-4 sm:py-4 ${cardHeaderClass}`}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D] sm:text-xs sm:tracking-[0.2em]">
                  Ready now
                </div>
                <h2 className={`mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl ${headingClass}`}>
                  Pick up
                </h2>
                <p className={`mt-1 text-sm font-semibold ${mutedClass}`}>
                  Tap your order when it is in your hands.
                </p>
              </div>
              <div className={`rounded-full px-3 py-1.5 text-sm font-semibold sm:px-4 sm:text-base ${isDark ? "bg-white/10 text-[#FFF7EA]" : "bg-[#0F4036]/8 text-[#0F4036]"}`}>
                {orders.ready.length}
              </div>
            </div>

            {orders.ready.length ? (
              <div className="grid gap-2.5 p-3 sm:p-4" style={orderTileGridStyle}>
                {orders.ready.map((order) => (
                  <div
                    key={order.id}
                    className={`grid gap-3 rounded-[16px] border p-3 shadow-[0_14px_34px_rgba(15,64,54,0.12)] sm:rounded-[20px] ${readyTileClass}`}
                  >
                    <CustomerOrderDetails order={order} darkMode={isDark} />
                    <button
                      type="button"
                      onClick={() => handlePickupClick(order)}
                      disabled={completingOrderId === order.id}
                      className={`min-h-[64px] rounded-[16px] px-4 py-3 text-lg font-black shadow-[0_12px_28px_rgba(15,64,54,0.16)] transition active:scale-[0.99] sm:text-xl ${
                        isDark
                          ? "bg-[#F3D39B] text-[#082622] disabled:bg-white/20 disabled:text-white/40"
                          : "bg-[#0F4036] text-white disabled:bg-neutral-300"
                      }`}
                    >
                      {completingOrderId === order.id ? "Clearing..." : "Order picked up"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[220px] place-items-center p-4 text-center sm:min-h-[280px] lg:min-h-[320px]">
                <div>
                  <div className={`text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl ${headingClass}`}>
                    Making drinks
                  </div>
                  <p className={`mt-3 text-base font-medium sm:text-lg ${mutedClass}`}>
                    Ready order numbers will show here.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={`overflow-hidden rounded-[18px] border sm:rounded-[24px] ${cardClass}`}>
            <div className={`border-b px-3 py-3 sm:px-4 sm:py-4 ${cardHeaderClass}`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D] sm:text-xs sm:tracking-[0.2em]">
                Recently picked up
              </div>
              <h2 className={`mt-1 text-lg font-semibold tracking-normal sm:text-xl md:text-2xl ${headingClass}`}>
                Completed
              </h2>
            </div>
            <div className={`grid gap-0 divide-y ${isDark ? "divide-white/10" : "divide-[#0F4036]/8"}`}>
              {orders.recentlyCompleted.length ? (
                orders.recentlyCompleted.map((order) => (
                  <div
                    key={order.id}
                    className="grid gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <CustomerOrderDetails order={order} darkMode={isDark} compact />
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-xs ${isDark ? "bg-[#CA862B]/18 text-[#F3D39B]" : "bg-[#0F4036]/8 text-[#0F4036]"}`}>
                        Picked up
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`m-5 rounded-2xl border border-dashed border-[#CA862B]/24 p-6 text-lg font-semibold ${isDark ? "bg-white/8 text-[#FFF7EA]/72" : "bg-[#FFFDF8] text-[#6A614F]"}`}>
                  Completed orders will appear here briefly.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </DisplayBackground>
  );
}

function DriveThruCarIcon({ ready = false }) {
  return (
    <svg viewBox="0 0 120 64" aria-hidden="true" className="h-12 w-24 shrink-0">
      <path
        d="M19 42h7l8-16c2-4 6-7 11-7h29c5 0 9 3 12 7l8 16h7c4 0 7 3 7 7v5H12v-5c0-4 3-7 7-7Z"
        fill="none"
        stroke={ready ? "#0F4036" : "#CA862B"}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M39 41h42l-6-12H45l-6 12Z"
        fill={ready ? "rgba(15,64,54,0.12)" : "rgba(202,134,43,0.16)"}
        stroke={ready ? "#0F4036" : "#CA862B"}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="54" r="7" fill="#FFFDF8" stroke={ready ? "#0F4036" : "#CA862B"} strokeWidth="5" />
      <circle cx="86" cy="54" r="7" fill="#FFFDF8" stroke={ready ? "#0F4036" : "#CA862B"} strokeWidth="5" />
    </svg>
  );
}

function getDriveThruStatusCopy(status) {
  if (status === "ready") return { label: "Ready", helper: "Pick up", ready: true };
  if (status === "making") return { label: "Making", helper: "At the bar", ready: false };
  return { label: "Received", helper: "In line", ready: false };
}

function DriveThruDisplay() {
  const { themeMode, isDark, toggleTheme } = useDisplayTheme();
  const demoMode = isDemoTrainingRoute();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refreshDriveThru() {
      if (demoMode) {
        setOrders(getDemoDriveThruDisplay());
        setError("");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/display/drive-thru"), {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("Sign in to the KDS on this device first.");
        }
        if (!response.ok) {
          throw new Error(`Drive thru display unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setOrders(data.orders || []);
        setError("");
      } catch (displayError) {
        if (!mounted) return;
        setError(displayError.message || "Drive thru display unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshDriveThru();
    const interval = setInterval(refreshDriveThru, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [demoMode]);

  const cardClass = isDark
    ? "border-white/12 bg-[#082622] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    : "border-[#0F4036]/10 bg-white shadow-[0_24px_70px_rgba(15,64,54,0.12)]";
  const headingClass = isDark ? "text-[#FFF7EA]" : "text-[#0F4036]";
  const mutedClass = isDark ? "text-[#FFF7EA]/68" : "text-[#6A614F]";

  return (
    <DisplayBackground accent="green" darkMode={isDark}>
      <DisplayBackButton />
      <FullscreenButton darkMode={isDark} />
      <DisplayThemeButton themeMode={themeMode} onToggle={toggleTheme} darkMode={isDark} />
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1500px] flex-col gap-3 sm:min-h-[calc(100vh-44px)] md:gap-4">
        <DisplaySwitcher activeRoute="drive-thru" darkMode={isDark} demoMode={demoMode} />
        <header className="overflow-hidden rounded-[20px] border border-[#0F4036]/14 bg-[#0F4036] text-white shadow-[0_20px_60px_rgba(15,64,54,0.18)] sm:rounded-[26px]">
          <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-4 md:gap-4 md:p-5">
            <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 sm:rounded-[18px] md:h-20 md:w-20 md:rounded-[22px]">
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12 md:max-h-14 md:max-w-14"
                />
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3D39B] sm:text-xs sm:tracking-[0.24em]">
                {demoMode ? "DF Demo Cafe" : "Pickup & Drive Thru"}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl">
                Order Board
              </h1>
            </div>
            <div className="hidden justify-self-end rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 md:block">
              Watch for your order
            </div>
          </div>
        </header>
        <DisplayStatus error={error} />

        {orders.length ? (
        <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => {
              const statusCopy = getDriveThruStatusCopy(order.status);
              return (
                <section
                  key={order.id}
                  className={`rounded-[18px] border p-4 sm:rounded-[24px] sm:p-5 ${cardClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${statusCopy.ready ? "text-[#0F4036]" : "text-[#8B5A1D]"}`}>
                        {statusCopy.helper}
                      </div>
                      <h2 className={`mt-1 text-3xl font-semibold leading-none tracking-normal sm:text-4xl ${headingClass}`}>
                        {order.customerName || `Order ${order.orderNumber}`}
                      </h2>
                      {order.customerName ? (
                        <div className={`mt-2 text-lg font-semibold ${mutedClass}`}>
                          Order {order.orderNumber}
                        </div>
                      ) : null}
                    </div>
                    <DriveThruCarIcon ready={statusCopy.ready} />
                  </div>

                  <div className={`mt-4 rounded-2xl border px-3 py-2 text-sm font-black uppercase tracking-[0.14em] ${
                    statusCopy.ready
                      ? "border-[#0F4036]/18 bg-[#0F4036]/8 text-[#0F4036]"
                      : "border-[#CA862B]/24 bg-[#CA862B]/10 text-[#8B5A1D]"
                  }`}>
                    {statusCopy.label}
                  </div>

                  <div className="mt-3">
                    <CustomerOrderDetails order={order} darkMode={isDark} compact />
                  </div>
                </section>
              );
            })}
          </main>
        ) : (
          <main className={`grid flex-1 place-items-center rounded-[18px] border p-6 text-center sm:rounded-[24px] ${cardClass}`}>
            <div>
              <DriveThruCarIcon />
              <h2 className={`mt-4 text-3xl font-semibold tracking-normal sm:text-5xl ${headingClass}`}>
                {loading ? "Checking orders" : "No pickup orders yet"}
              </h2>
              <p className={`mt-3 text-base font-medium sm:text-lg ${mutedClass}`}>
                Pickup and drive-thru drink orders will show here.
              </p>
            </div>
          </main>
        )}
      </div>
    </DisplayBackground>
  );
}

function VolumeBoardChart({ hourlyOrders = [], darkMode = false, shopHours = DEFAULT_SHOP_HOURS }) {
  const openHour = Number(shopHours.openHour ?? SHOP_OPEN_HOUR);
  const closeHour = Number(shopHours.closeHour ?? SHOP_CLOSE_HOUR);
  const serviceHours = Array.from({ length: Math.max(closeHour - openHour, 1) }, (_value, index) => {
    const hour = openHour + index;
    return hourlyOrders.find((item) => Number(item.hour) === hour) || {
      hour,
      orderCount: 0,
      units: 0,
    };
  });
  const maxOrders = Math.max(
    1,
    ...serviceHours.map((item) => Number(item.orderCount || 0))
  );
  const chartWidth = 760;
  const chartHeight = 280;
  const padding = { top: 28, right: 22, bottom: 54, left: 42 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const points = serviceHours.map((item, index) => {
    const divisor = Math.max(serviceHours.length - 1, 1);
    const x = padding.left + (plotWidth / divisor) * index;
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
  const peak = serviceHours
    .slice()
    .sort((a, b) => Number(b.orderCount || 0) - Number(a.orderCount || 0))[0];
  const axisClass = darkMode ? "fill-[#FFF7EA]/72" : "fill-[#6A614F]";
  const gridStroke = darkMode ? "#FFF7EA" : "#0F4036";

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      role="img"
      aria-label={`Hourly drink order volume from ${shopHours.label || "open to close"}`}
      className="h-full min-h-[260px] w-full"
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
              stroke={gridStroke}
              strokeOpacity="0.1"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              className={`${axisClass} text-[12px] font-bold`}
            >
              {Math.round(maxOrders * tick)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="#CA862B" opacity={darkMode ? "0.22" : "0.14"} />
      <path
        d={linePath}
        fill="none"
        stroke="#CA862B"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point) => {
        const isPeak = Number(peak?.hour) === Number(point.hour) && Number(point.orderCount || 0) > 0;
        return (
          <g key={point.hour}>
            <circle
              cx={point.x}
              cy={point.y}
              r={isPeak ? 9 : 6}
              fill={isPeak ? "#0F4036" : "#CA862B"}
              stroke={darkMode ? "#FFF7EA" : "#FFFDF8"}
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={chartHeight - 18}
              textAnchor="middle"
              className={`${axisClass} text-[13px] font-black`}
            >
              {new Date(2024, 0, 1, point.hour).toLocaleTimeString([], {
                hour: "numeric",
              })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VolumeBoardDisplay() {
  const { themeMode, isDark, toggleTheme } = useDisplayTheme();
  const demoMode = isDemoTrainingRoute();
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateKey());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refreshVolume() {
      if (demoMode) {
        const demoReport = buildDemoOwnerReport(getDemoDisplayTickets(), "today");
        setReport({
          ...demoReport,
          shopHours: getShopHoursForDate(selectedDate),
        });
        setUpdatedAt(new Date().toISOString());
        setError("");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/display/volume?date=${encodeURIComponent(selectedDate)}`), {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("Sign in to the KDS on this device first.");
        }
        if (!response.ok) {
          throw new Error(`Volume board unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setReport(data.report || null);
        setUpdatedAt(data.updatedAt || "");
        setError("");
      } catch (displayError) {
        if (!mounted) return;
        setError(displayError.message || "Volume board unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshVolume();
    const interval = setInterval(refreshVolume, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [demoMode, selectedDate]);

  const shopHours = getShopHoursFromReport(report, selectedDate);
  const serviceRead = getServiceWindowRead(new Date(), shopHours, selectedDate);
  const orderCount = Number(report?.orderCount || 0);
  const totalUnits = Number(report?.totalUnits || 0);
  const averageDrinks = orderCount ? (totalUnits / orderCount).toFixed(1) : "0.0";
  const categories = (report?.totalsByCategory || []).filter((item) => Number(item.units || 0) > 0);
  const totalCategoryUnits = categories.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const sortedCategories = categories
    .slice()
    .sort((a, b) => Number(b.units || 0) - Number(a.units || 0));
  const hourlyStats = getHourlyVolumeStats(
    (report?.hourlyOrders || []).filter(
      (item) => Number(item.hour) >= Number(shopHours.openHour) && Number(item.hour) < Number(shopHours.closeHour)
    )
  );
  const cardClass = isDark
    ? "border-white/12 bg-[#082622] text-[#FFF7EA] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    : "border-[#0F4036]/10 bg-white text-[#111111] shadow-[0_24px_70px_rgba(15,64,54,0.12)]";
  const headingClass = isDark ? "text-[#FFF7EA]" : "text-[#0F4036]";
  const mutedClass = isDark ? "text-[#FFF7EA]/68" : "text-[#6A614F]";
  const panelClass = isDark ? "border-white/10 bg-white/8" : "border-[#0F4036]/10 bg-[#FFFDF8]";

  return (
    <DisplayBackground accent="green" darkMode={isDark}>
      <DisplayBackButton />
      <FullscreenButton darkMode={isDark} />
      <DisplayThemeButton themeMode={themeMode} onToggle={toggleTheme} darkMode={isDark} />
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1500px] flex-col gap-3 sm:min-h-[calc(100vh-44px)] md:gap-4">
        <DisplaySwitcher activeRoute="volume" darkMode={isDark} demoMode={demoMode} />
        <header className="overflow-hidden rounded-[20px] border border-[#0F4036]/14 bg-[#0F4036] text-white shadow-[0_20px_60px_rgba(15,64,54,0.18)] sm:rounded-[26px]">
          <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-4 md:gap-4 md:p-5">
            <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 sm:rounded-[18px] md:h-20 md:w-20 md:rounded-[22px]">
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12 md:max-h-14 md:max-w-14"
                />
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3D39B] sm:text-xs sm:tracking-[0.24em]">
                {shopHours.label} Central
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl">
                Volume Board
              </h1>
            </div>
            <div className="justify-self-start rounded-2xl border border-white/16 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/82 md:justify-self-end">
              <label className="sr-only" htmlFor="volume-board-date">Volume Board date</label>
              <input
                id="volume-board-date"
                type="date"
                value={selectedDate}
                max={getTodayDateKey()}
                onChange={(event) => {
                  setLoading(true);
                  setSelectedDate(event.target.value || getTodayDateKey());
                }}
                className="rounded-xl border border-white/18 bg-white/95 px-3 py-2 text-sm font-black text-[#0F4036] outline-none"
              />
              <span className="ml-2 hidden md:inline">{serviceRead.label}</span>
            </div>
          </div>
        </header>
        <DisplayStatus error={error} />

        <main className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <section className={`rounded-[18px] border p-3 sm:rounded-[24px] sm:p-5 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D] sm:text-xs sm:tracking-[0.2em]">
                  Hourly order volume
                </div>
                <h2 className={`mt-1 text-xl font-semibold tracking-normal sm:text-3xl ${headingClass}`}>
                  Today&apos;s rush curve
                </h2>
                <p className={`mt-2 max-w-3xl text-sm font-medium sm:text-base ${mutedClass}`}>
                  {serviceRead.pace}
                </p>
              </div>
              <div className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${panelClass}`}>
                {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : loading ? "Loading" : "Live"}
              </div>
            </div>
            <div className="mt-3 min-h-[280px]">
              <VolumeBoardChart
                hourlyOrders={report?.hourlyOrders || []}
                darkMode={isDark}
                shopHours={shopHours}
              />
            </div>
          </section>

          <section className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>Drink orders</span>
                <strong className={`mt-2 block text-3xl font-semibold leading-none ${headingClass}`}>{orderCount}</strong>
              </div>
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>Drinks made</span>
                <strong className={`mt-2 block text-3xl font-semibold leading-none ${headingClass}`}>{totalUnits}</strong>
              </div>
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>Avg drinks/order</span>
                <strong className={`mt-2 block text-3xl font-semibold leading-none ${headingClass}`}>{averageDrinks}</strong>
              </div>
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>2+ drink rate</span>
                <strong className={`mt-2 block text-3xl font-semibold leading-none ${headingClass}`}>{Number(report?.multiDrinkOrderRate || 0)}%</strong>
              </div>
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>Peak hour</span>
                <strong className={`mt-2 block text-2xl font-semibold leading-none ${headingClass}`}>
                  {hourlyStats.peak ? formatHourRange(hourlyStats.peak.hour) : "Collecting"}
                </strong>
              </div>
              <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>Peak drinks</span>
                <strong className={`mt-2 block text-3xl font-semibold leading-none ${headingClass}`}>
                  {hourlyStats.peak ? Number(hourlyStats.peak.units || 0) : 0}
                </strong>
              </div>
            </div>

            <div className={`rounded-[18px] border p-4 sm:rounded-[22px] ${cardClass}`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D]">
                Drink mix
              </div>
              <h2 className={`mt-1 text-2xl font-semibold tracking-normal ${headingClass}`}>
                Category share
              </h2>
              <div className="mt-4 grid gap-3">
                {sortedCategories.length ? (
                  sortedCategories.map((category) => {
                    const share = totalCategoryUnits
                      ? Math.round((Number(category.units || 0) / totalCategoryUnits) * 100)
                      : 0;
                    return (
                      <div key={category.category}>
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                          <span className={headingClass}>{category.category}</span>
                          <span className={mutedClass}>{category.units} units · {share}%</span>
                        </div>
                        <div className={`mt-2 h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-[#0F4036]/8"}`}>
                          <div className="h-full rounded-full bg-[#CA862B]" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`rounded-2xl border border-dashed border-[#CA862B]/24 p-5 text-base font-semibold ${panelClass}`}>
                    Drink mix will appear after today&apos;s drink orders sync.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </DisplayBackground>
  );
}

function OnlineOrdersDisplay() {
  const { themeMode, isDark, toggleTheme } = useDisplayTheme();
  const demoMode = isDemoTrainingRoute();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refreshOnlineOrders() {
      if (demoMode) {
        setOrders(getDemoOnlineOrdersDisplay());
        setUpdatedAt(new Date().toISOString());
        setError("");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/display/online-orders"), {
          credentials: "include",
        });

        if (response.status === 401) {
          throw new Error("Sign in to the KDS on this device first.");
        }
        if (!response.ok) {
          throw new Error(`Online order board unavailable: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setOrders(data.orders || []);
        setUpdatedAt(data.updatedAt || "");
        setError("");
      } catch (displayError) {
        if (!mounted) return;
        setError(displayError.message || "Online order board unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refreshOnlineOrders();
    const interval = setInterval(refreshOnlineOrders, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [demoMode]);

  const groupedOrders = ["new", "making", "ready"].map((status) => ({
    status,
    label: status === "new" ? "Received" : status === "making" ? "Making" : "Ready",
    orders: orders.filter((order) => order.status === status),
  }));
  const cardClass = isDark
    ? "border-white/12 bg-[#082622] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    : "border-[#0F4036]/10 bg-white shadow-[0_24px_70px_rgba(15,64,54,0.12)]";
  const headingClass = isDark ? "text-[#FFF7EA]" : "text-[#0F4036]";
  const mutedClass = isDark ? "text-[#FFF7EA]/68" : "text-[#6A614F]";
  const headerClass = isDark ? "border-white/10 bg-white/8" : "border-[#0F4036]/10 bg-[#FFFDF8]";

  return (
    <DisplayBackground accent="green" darkMode={isDark}>
      <DisplayBackButton />
      <FullscreenButton darkMode={isDark} />
      <DisplayThemeButton themeMode={themeMode} onToggle={toggleTheme} darkMode={isDark} />
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1500px] flex-col gap-3 sm:min-h-[calc(100vh-44px)] md:gap-4">
        <DisplaySwitcher activeRoute="online-orders" darkMode={isDark} demoMode={demoMode} />
        <header className="overflow-hidden rounded-[20px] border border-[#0F4036]/14 bg-[#0F4036] text-white shadow-[0_20px_60px_rgba(15,64,54,0.18)] sm:rounded-[26px]">
          <div className="grid gap-3 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-4 md:gap-4 md:p-5">
            <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 sm:rounded-[18px] md:h-20 md:w-20 md:rounded-[22px]">
              {demoMode ? (
                <DemoBrandMark size="sm" />
              ) : (
                <img
                  src={LOGO_URL}
                  alt="Goldie's Coffee & Goods"
                  className="max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12 md:max-h-14 md:max-w-14"
                />
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3D39B] sm:text-xs sm:tracking-[0.24em]">
                {demoMode ? "DF Demo Cafe" : "Online Pickup"}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl">
                Online Orders
              </h1>
            </div>
            <div className="hidden justify-self-end rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 md:block">
              Drinks only
            </div>
          </div>
        </header>
        <DisplayStatus error={error} />

        <main className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-3">
          {groupedOrders.map((group) => (
            <section key={group.status} className={`overflow-hidden rounded-[18px] border sm:rounded-[24px] ${cardClass}`}>
              <div className={`flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-4 sm:py-4 ${headerClass}`}>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B5A1D]">
                    Online pickup
                  </div>
                  <h2 className={`mt-1 text-xl font-semibold tracking-normal sm:text-2xl ${headingClass}`}>
                    {group.label}
                  </h2>
                </div>
                <div className={`rounded-full px-3 py-1.5 text-sm font-semibold ${isDark ? "bg-white/10 text-[#FFF7EA]" : "bg-[#0F4036]/8 text-[#0F4036]"}`}>
                  {group.orders.length}
                </div>
              </div>
              <div className="grid gap-2.5 p-3 sm:p-4">
                {group.orders.length ? (
                  group.orders.map((order) => (
                    <div key={order.id} className={`rounded-[16px] border p-3 ${isDark ? "border-white/10 bg-white/8" : "border-[#0F4036]/10 bg-[#FFFDF8]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`text-2xl font-semibold leading-none ${headingClass}`}>
                            {order.customerName || `Order ${order.orderNumber}`}
                          </div>
                          {order.customerName ? (
                            <div className={`mt-1 text-base font-semibold ${mutedClass}`}>Order {order.orderNumber}</div>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "bg-[#CA862B]/18 text-[#F3D39B]" : "bg-[#CA862B]/10 text-[#8B5A1D]"}`}>
                          {order.diningOption || "Pickup"}
                        </span>
                      </div>
                      <div className="mt-3">
                        <CustomerOrderDetails order={order} darkMode={isDark} compact />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`rounded-2xl border border-dashed border-[#CA862B]/24 p-5 text-base font-semibold ${isDark ? "bg-white/8 text-[#FFF7EA]/72" : "bg-[#FFFDF8] text-[#6A614F]"}`}>
                    {loading ? "Checking online orders" : "No online pickup drinks here."}
                  </div>
                )}
              </div>
            </section>
          ))}
        </main>

        <p className={`text-center text-xs font-semibold ${mutedClass}`}>
          {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Online orders board"}
        </p>
      </div>
    </DisplayBackground>
  );
}

function RollerRollerCoasterGameLegacy() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const hudFrameRef = useRef(0);
  const audioRef = useRef(null);
  const worldRef = useRef(null);
  const GAME_MESSAGE = "Tap jump or press Space to help Zahra collect stars and Mango treats.";
  const [hud, setHud] = useState({
    score: 0,
    stars: 0,
    treats: 0,
    crashes: 0,
    shield: 0,
    best: 0,
    speed: 0,
    message: GAME_MESSAGE,
  });
  const [musicOn, setMusicOn] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  async function playNotes(notes = [], baseGain = 0.07) {
    if (!musicOn || typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }

      const ctx = audioRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      notes.forEach((note, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = index === 0 ? "triangle" : "sine";
        oscillator.frequency.value = note;
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + index * 0.03);
        gain.gain.exponentialRampToValueAtTime(baseGain, now + index * 0.03 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.03 + 0.22);
        oscillator.stop(now + index * 0.03 + 0.24);
      });
    } catch {
      // ignore audio failures
    }
  }

  async function unlockAudio() {
    if (!musicOn || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }
      const ctx = audioRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
    } catch {
      // ignore unlock failures
    }
  }

  function createScene(width, height) {
    const groundY = Math.round(height * 0.78);
    const laneBase = groundY - 70;
    const obstacleKinds = ["loop", "spark", "bump", "rainbow", "puff", "banner"];
    const stars = Array.from({ length: 10 }, (_, index) => ({
      id: `star-${index}`,
      x: width + 120 + index * 180 + Math.random() * 160,
      y: laneBase - 40 - (index % 4) * 34,
      size: 12 + (index % 3) * 4,
      twinkle: Math.random() * Math.PI * 2,
    }));
    const treats = Array.from({ length: 8 }, (_, index) => ({
      id: `treat-${index}`,
      x: width + 180 + index * 210 + Math.random() * 180,
      y: laneBase - 8 - (index % 3) * 22,
      size: 14 + (index % 2) * 2,
      kind: "fish",
      twinkle: Math.random() * Math.PI * 2,
    }));
    const powerups = Array.from({ length: 3 }, (_, index) => ({
      id: `powerup-${index}`,
      x: width + 420 + index * 460 + Math.random() * 160,
      y: laneBase - 56 - (index % 2) * 10,
      size: 18,
      kind: "shield",
      twinkle: Math.random() * Math.PI * 2,
    }));
    const platforms = Array.from({ length: 5 }, (_, index) => ({
      id: `platform-${index}`,
      x: width + 260 + index * 300 + Math.random() * 160,
      y: laneBase - 28 - (index % 3) * 18,
      width: 78 + (index % 3) * 24,
      bounce: 720 + (index % 2) * 60,
      kind: index % 2 === 0 ? "spring" : "cloud",
    }));
    const obstacles = Array.from({ length: 6 }, (_, index) => ({
      id: `obstacle-${index}`,
      x: width + 220 + index * 220 + Math.random() * 120,
      y: index % 2 === 0 ? laneBase + (index % 3 === 0 ? 0 : -18) : laneBase - 82,
      kind: obstacleKinds[index % obstacleKinds.length],
      size: 28 + (index % 3) * 10,
      avoidance: index % 2 === 0 ? "jump" : "duck",
    }));
    const clouds = Array.from({ length: 5 }, (_, index) => ({
      id: `cloud-${index}`,
      x: 60 + index * (width / 4),
      y: 48 + (index % 2) * 38,
      size: 52 + index * 8,
    }));

    return {
      width,
      height,
      groundY,
      laneBase,
      distance: 0,
      speed: 240,
      jumpHeight: 0,
      jumpVelocity: 0,
      ducking: false,
      starsCollected: 0,
      treatsCollected: 0,
      crashesTaken: 0,
      score: 0,
      best: 0,
      message: GAME_MESSAGE,
      obstacles,
      stars,
      treats,
      clouds,
      platforms,
      powerups,
      sparklePhase: 0,
      hitCooldown: 0,
      lastStarMessage: 0,
      lastTreatMessage: 0,
      shieldTime: 0,
      shieldPulse: 0,
      platformCooldown: 0,
    };
  }

  function resetGame(message = GAME_MESSAGE) {
    const { width, height } = canvasSize;
    worldRef.current = createScene(width, height);
    worldRef.current.message = message;
    setHud((current) => ({
      ...current,
      score: 0,
      stars: 0,
      treats: 0,
      crashes: 0,
      shield: 0,
      speed: 0,
      message,
    }));
  }

  function setDucking(active) {
    const world = worldRef.current;
    if (!world) return;
    world.ducking = active;
    world.message = active ? "Duck under it!" : "Up again!";
  }

  function jump() {
    const world = worldRef.current;
    if (!world) return;
    if (world.jumpHeight > 0.5) return;

    setDucking(false);
    unlockAudio();
    world.jumpVelocity = 920;
    world.jumpHeight = 1;
    world.message = "Sparkle jump!";
    playNotes([523, 659, 784], 0.035);
  }

  function startGame() {
    setShowIntro(false);
    unlockAudio();
    playNotes([523, 659, 784, 1046], 0.05);
  }

  async function copyShareLink() {
    try {
      await unlockAudio();
      await window.navigator.clipboard.writeText(window.location.href);
      const world = worldRef.current;
      if (world) {
        world.message = "Link copied. Zahra can share the coaster!";
      }
      playNotes([659, 784, 1046], 0.04);
    } catch {
      const world = worldRef.current;
      if (world) {
        world.message = "Sharing is ready once the browser allows copy.";
      }
    }
  }

  useEffect(() => {
    const world = createScene(canvasSize.width, canvasSize.height);
    world.best = Number(window.localStorage?.getItem("roller-roller-coaster-best") || 0) || 0;
    worldRef.current = world;
    setHud({
      score: 0,
      stars: 0,
      treats: 0,
      crashes: 0,
      shield: 0,
      best: world.best,
      speed: 0,
      message: GAME_MESSAGE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function syncSize() {
      const node = sceneRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(520, Math.round(rect.height));
      setCanvasSize({ width, height });
    }

    syncSize();
    const observer = typeof ResizeObserver !== "undefined" && sceneRef.current
      ? new ResizeObserver(syncSize)
      : null;
    if (observer && sceneRef.current) observer.observe(sceneRef.current);
    window.addEventListener("resize", syncSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, []);

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      } else if (event.code === "ArrowDown" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        setDucking(true);
      }
    }

    function onKeyUp(event) {
      if (event.code === "ArrowDown" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        setDucking(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicOn, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    let active = true;

    function drawStar(ctx, x, y, radius, points, innerRadius, color, rotation = 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let index = 0; index < points * 2; index += 1) {
        const step = Math.PI / points;
        const dist = index % 2 === 0 ? radius : innerRadius;
        const px = Math.cos(index * step - Math.PI / 2) * dist;
        const py = Math.sin(index * step - Math.PI / 2) * dist;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    function drawCloud(ctx, x, y, size, tint, alpha = 0.6) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.44, size * 0.28, 0, 0, Math.PI * 2);
      ctx.ellipse(x + size * 0.18, y - size * 0.08, size * 0.34, size * 0.24, 0, 0, Math.PI * 2);
      ctx.ellipse(x - size * 0.18, y - size * 0.05, size * 0.3, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawMango(ctx, x, y, scale, bounce) {
      const sway = Math.sin(bounce * 0.04) * 2;
      ctx.save();
      ctx.translate(x, y + sway);
      ctx.scale(scale, scale);
      ctx.fillStyle = "#B86A3C";
      ctx.strokeStyle = "#6A3C21";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-18, -12, 36, 24, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#F7D9BD";
      ctx.beginPath();
      ctx.arc(0, -2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1d120c";
      ctx.beginPath();
      ctx.arc(-5, -4, 1.7, 0, Math.PI * 2);
      ctx.arc(5, -4, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(0, 2);
      ctx.lineTo(2, 0);
      ctx.fillStyle = "#7C2D12";
      ctx.fill();
      ctx.fillStyle = "#B86A3C";
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(-22, -20);
      ctx.lineTo(-11, -16);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(14, -10);
      ctx.lineTo(22, -20);
      ctx.lineTo(11, -16);
      ctx.fill();
      ctx.restore();
    }

    function drawTreat(ctx, x, y, scale, kind, twinkle) {
      ctx.save();
      ctx.translate(x, y + Math.sin(twinkle) * 2);
      ctx.rotate(Math.sin(twinkle * 0.6) * 0.12);
      ctx.scale(scale, scale);

      if (kind === "bone") {
        ctx.fillStyle = "#F7E6C7";
        ctx.strokeStyle = "#9A6B2C";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-10, -5, 20, 10, 5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-12, -1, 5.5, 0, Math.PI * 2);
        ctx.arc(12, -1, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (kind === "heart") {
        ctx.fillStyle = "#FF8CCB";
        ctx.strokeStyle = "#B83D82";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 9);
        ctx.bezierCurveTo(-12, 1, -10, -10, -1, -10);
        ctx.bezierCurveTo(7, -10, 8, -2, 0, 4);
        ctx.bezierCurveTo(-8, -2, -7, -10, 1, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = "#FFB84D";
        ctx.strokeStyle = "#9A6B2C";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(-6, -10, 8, -7);
        ctx.lineTo(15, 0);
        ctx.lineTo(8, 7);
        ctx.quadraticCurveTo(-6, 10, -14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#6A3C21";
        ctx.beginPath();
        ctx.arc(-3, -1, 1.6, 0, Math.PI * 2);
        ctx.arc(3, -1, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawRider(ctx, x, baseY, jumpHeight, pulse, time, ducking = false) {
      const y = baseY - jumpHeight;
      const bob = Math.sin(time * 0.01) * 2;
      const cartY = y + bob;
      const cartW = 128;
      const cartH = 56;
      ctx.save();
      ctx.translate(x, cartY);

      ctx.fillStyle = "rgba(255,255,255,0.33)";
      ctx.strokeStyle = "#F3D39B";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-cartW / 2, -cartH / 2, cartW, cartH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#FF8CCB";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-36, -22);
      ctx.quadraticCurveTo(0, -34, 36, -22);
      ctx.stroke();

      ctx.strokeStyle = "#CA862B";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-54, 14);
      ctx.quadraticCurveTo(-12, 40, 42, 20);
      ctx.stroke();

      const wheelY = 30;
      const wheelX = -42;
      ctx.fillStyle = "#0F4036";
      [wheelX, wheelX + 70].forEach((offset) => {
        ctx.beginPath();
        ctx.arc(offset, wheelY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#CA862B";
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      ctx.save();
      ctx.translate(-8, ducking ? -36 - pulse : -48 - pulse);
      ctx.scale(ducking ? 1.0 : 1.05, ducking ? 0.88 : 1.05);

      // hair
      ctx.fillStyle = "#3E251B";
      ctx.beginPath();
      ctx.arc(0, -10, 20, Math.PI, 0);
      ctx.fill();
      if (!ducking) {
        ctx.beginPath();
        ctx.moveTo(-18, -6);
        ctx.quadraticCurveTo(-24, -22, -10, -18);
        ctx.quadraticCurveTo(-2, -16, -4, -2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(18, -6);
        ctx.quadraticCurveTo(24, -22, 10, -18);
        ctx.quadraticCurveTo(2, -16, 4, -2);
        ctx.fill();
      }

      // face
      ctx.fillStyle = "#F3C8B1";
      ctx.beginPath();
      ctx.arc(0, ducking ? 4 : 0, 17, 0, Math.PI * 2);
      ctx.fill();

      // eyes and smile
      ctx.fillStyle = "#2C1D16";
      ctx.beginPath();
      ctx.arc(-6, ducking ? 2 : -2, 1.9, 0, Math.PI * 2);
      ctx.arc(6, ducking ? 2 : -2, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7C2D12";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, ducking ? 8 : 5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // rainbow shirt
      ctx.fillStyle = "#7BE0C4";
      ctx.beginPath();
      ctx.roundRect(-18, ducking ? 16 : 12, 36, ducking ? 20 : 24, 10);
      ctx.fill();
      ctx.fillStyle = "#FF4D9D";
      ctx.fillRect(-18, ducking ? 16 : 12, 36, 5);
      ctx.fillStyle = "#FFD84D";
      ctx.fillRect(-18, ducking ? 21 : 17, 36, 5);
      ctx.fillStyle = "#70A8FF";
      ctx.fillRect(-18, ducking ? 26 : 22, 36, 5);

      // arms
      ctx.strokeStyle = "#F3C8B1";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-16, ducking ? 24 : 18);
      ctx.lineTo(-28, ducking ? 30 : 32);
      ctx.moveTo(16, ducking ? 24 : 18);
      ctx.lineTo(28, ducking ? 30 : 32);
      ctx.stroke();

      // legs
      ctx.strokeStyle = "#6A3C21";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-8, ducking ? 32 : 35);
      ctx.lineTo(-12, ducking ? 42 : 48);
      ctx.moveTo(8, ducking ? 32 : 35);
      ctx.lineTo(12, ducking ? 42 : 48);
      ctx.stroke();

      // shoes
      ctx.fillStyle = "#FFF7EA";
      ctx.beginPath();
      ctx.roundRect(-16, ducking ? 40 : 46, 12, 6, 3);
      ctx.roundRect(4, ducking ? 40 : 46, 12, 6, 3);
      ctx.fill();

      // sparkle bow / halo
      ctx.fillStyle = "#B18BFF";
      ctx.beginPath();
      ctx.arc(-11, ducking ? -14 : -16, 4, 0, Math.PI * 2);
      ctx.arc(11, ducking ? -14 : -16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -16);
      ctx.lineTo(2, -16);
      ctx.stroke();
      ctx.restore();

      drawMango(ctx, 50, -16, 0.82, time);
      ctx.restore();
    }

    function drawObstacle(ctx, obstacle, time) {
      const bob = Math.sin((time + obstacle.x) * 0.02) * 2;
      const x = obstacle.x;
      const y = obstacle.y + bob;
      ctx.save();
      ctx.translate(x, y);

      if (obstacle.avoidance === "duck") {
        ctx.strokeStyle = "#CA862B";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-42, -20);
        ctx.lineTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.lineTo(42, -20);
        ctx.stroke();
        ctx.fillStyle = "#FF8CCB";
        ctx.beginPath();
        ctx.roundRect(-36, -44, 72, 18, 8);
        ctx.fill();
        ctx.strokeStyle = "#7A2F72";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (obstacle.kind === "loop") {
        ctx.strokeStyle = "#CA862B";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 8, obstacle.size * 0.6, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#FCE7A1";
        ctx.beginPath();
        ctx.arc(0, 8, obstacle.size * 0.26, 0, Math.PI * 2);
        ctx.fill();
      } else if (obstacle.kind === "spark") {
        drawStar(ctx, 0, 0, obstacle.size, 5, obstacle.size * 0.42, "#fff3a8", time * 0.002);
      } else if (obstacle.kind === "rainbow") {
        ctx.fillStyle = "#FF7CC9";
        ctx.beginPath();
        ctx.roundRect(-18, -obstacle.size * 0.7, 36, obstacle.size * 0.9, 10);
        ctx.fill();
        ctx.strokeStyle = "#7A2F72";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (obstacle.kind === "puff") {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(-10, 4, obstacle.size * 0.32, 0, Math.PI * 2);
        ctx.arc(0, -6, obstacle.size * 0.42, 0, Math.PI * 2);
        ctx.arc(12, 4, obstacle.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#D7A8F0";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#8C4CFF";
        ctx.beginPath();
        ctx.roundRect(-obstacle.size * 0.42, -obstacle.size * 0.8, obstacle.size * 0.84, obstacle.size, 12);
        ctx.fill();
        ctx.strokeStyle = "#4C1D95";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawPlatform(ctx, platform, time) {
      ctx.save();
      ctx.translate(platform.x, platform.y + Math.sin(time * 0.01 + platform.x * 0.02) * 1.5);
      if (platform.kind === "spring") {
        ctx.fillStyle = "#FFF7EA";
        ctx.strokeStyle = "#CA862B";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-8, -8, platform.width, 16, 10);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#FF4D9D";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(platform.width - 14, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#C7F9EA";
        ctx.strokeStyle = "#0F4036";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-10, -7, platform.width + 20, 14, 8);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPowerup(ctx, powerup, time, shieldActive) {
      const glow = 0.6 + Math.sin(time * 0.01 + powerup.twinkle) * 0.15;
      ctx.save();
      ctx.translate(powerup.x, powerup.y + Math.sin(time * 0.012 + powerup.twinkle) * 2);
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = shieldActive ? "#7DD3FC" : "#93C5FD";
      ctx.beginPath();
      ctx.arc(0, 0, 18 + Math.sin(powerup.twinkle + time * 0.005) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glow;
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(powerup.twinkle + time * 0.005) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF4D9D";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(4, -1);
      ctx.lineTo(11, 0);
      ctx.lineTo(4, 1);
      ctx.lineTo(0, 8);
      ctx.lineTo(-4, 1);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-4, -1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawTrack(ctx, width, baseY, time, phase) {
      const rainbow = ["#FF4D9D", "#FF8B4D", "#FFD84D", "#7BE0C4", "#70A8FF", "#B18BFF"];
      const yShift = Math.sin(time * 0.0015) * 8;
      const wave = (x) => trackYAtX(x, baseY, time, phase);

      rainbow.forEach((color, index) => {
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.lineWidth = 14 - index * 1.3;
        for (let x = -40; x <= width + 40; x += 16) {
          const y = wave(x) + index * 2 - 12;
          if (x === -40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.strokeStyle = "#FFF7EA";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = -40; x <= width + 40; x += 16) {
        const y = wave(x) + 26;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function trackYAtX(x, baseY, time, phase) {
      const yShift = Math.sin(time * 0.0015) * 4;
      return baseY + yShift + Math.sin((x + phase) / 92) * 10 + Math.sin((x + phase) / 44) * 4;
    }

    function frame(now) {
      if (!active) return;
      const canvas = canvasRef.current;
      const world = worldRef.current;
      if (!canvas || !world) {
        rafRef.current = window.requestAnimationFrame(frame);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = window.requestAnimationFrame(frame);
        return;
      }

      if (!lastFrameRef.current) lastFrameRef.current = now;
      const delta = Math.min(0.035, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const groundY = world.groundY;
      const riderX = Math.round(width * 0.24);
      const riderTrackY = trackYAtX(riderX, groundY, now, world.distance * 0.92);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.restore();

      world.distance += world.speed * delta;
      world.speed = clamp(240 + world.distance / 1800 + world.starsCollected * 2, 240, 430);
      world.sparklePhase += delta * 9;

      if (world.jumpHeight > 0 || world.jumpVelocity > 0) {
        world.jumpVelocity -= 2100 * delta;
        world.jumpHeight += world.jumpVelocity * delta;
        if (world.jumpHeight <= 0) {
          world.jumpHeight = 0;
          world.jumpVelocity = 0;
        }
      }

      world.hitCooldown = Math.max(0, world.hitCooldown - delta);
      world.lastStarMessage = Math.max(0, world.lastStarMessage - delta);
      world.lastTreatMessage = Math.max(0, world.lastTreatMessage - delta);
      world.crashFlash = Math.max(0, (world.crashFlash || 0) - delta);
      world.shieldTime = Math.max(0, world.shieldTime - delta);
      world.shieldPulse = Math.max(0, world.shieldPulse - delta);
      world.platformCooldown = Math.max(0, world.platformCooldown - delta);

      const riderY = riderTrackY - 84 - world.jumpHeight;
      const riderDuckOffset = world.ducking ? 16 : 0;
      const riderDuckHeight = world.ducking ? 62 : 86;
      const riderRect = {
        x: riderX - 28,
        y: riderY - 54 + riderDuckOffset,
        width: 84,
        height: riderDuckHeight,
      };

      world.obstacles.forEach((obstacle) => {
        obstacle.x -= world.speed * delta;
        if (obstacle.x < -120) {
          const farthest = Math.max(...world.obstacles.map((entry) => entry.x));
          obstacle.x = farthest + 180 + Math.random() * 120;
          obstacle.avoidance = Math.random() > 0.45 ? "jump" : "duck";
          obstacle.kind = obstacle.avoidance === "duck"
            ? ["rainbow", "puff", "banner"][Math.floor(Math.random() * 3)]
            : ["loop", "spark", "bump"][Math.floor(Math.random() * 3)];
          obstacle.size = 28 + Math.floor(Math.random() * 18);
          obstacle.y = obstacle.avoidance === "duck"
            ? world.laneBase - 82 - Math.floor(Math.random() * 18)
            : world.laneBase + (Math.random() > 0.55 ? 0 : -20);
        }

        const overlap =
          obstacle.x > riderRect.x - 10 &&
          obstacle.x < riderRect.x + riderRect.width;
        const jumpCollision =
          obstacle.avoidance === "jump" &&
          overlap &&
          riderRect.y + riderRect.height > obstacle.y - 16 &&
          riderRect.y < obstacle.y + 80;
        const duckCollision =
          obstacle.avoidance === "duck" &&
          overlap &&
          !world.ducking &&
          riderY < obstacle.y + 10 &&
          riderY > obstacle.y - 70;
        if ((jumpCollision || duckCollision) && world.jumpHeight < 42 && world.hitCooldown <= 0) {
          if (world.shieldTime > 0) {
            world.shieldTime = 0;
            world.shieldPulse = 0.9;
            world.message = "Shield popped! Keep rolling.";
            playNotes([784, 1046, 1318], 0.05);
            obstacle.x = Math.max(...world.obstacles.map((entry) => entry.x)) + 240 + Math.random() * 160;
            obstacle.avoidance = Math.random() > 0.45 ? "jump" : "duck";
            obstacle.kind = obstacle.avoidance === "duck"
              ? ["rainbow", "puff", "banner"][Math.floor(Math.random() * 3)]
              : ["loop", "spark", "bump"][Math.floor(Math.random() * 3)];
            obstacle.y = obstacle.avoidance === "duck"
              ? world.laneBase - 82 - Math.floor(Math.random() * 18)
              : world.laneBase + (Math.random() > 0.55 ? 0 : -20);
            return;
          }
          world.hitCooldown = 1;
          world.crashesTaken += 1;
          world.crashFlash = 0.8;
          world.message = obstacle.avoidance === "duck" ? "Duck it next time!" : "Crash! Dodge the next one.";
          world.speed = Math.max(220, world.speed - 24);
          playNotes([196, 220], 0.025);
          if (world.crashesTaken >= 3) {
            resetGame("Too many crashes. Starting a fresh ride.");
            return;
          }
        }
      });

      world.stars.forEach((star, index) => {
        star.x -= world.speed * delta;
        if (star.x < -120) {
          const farthest = Math.max(...world.stars.map((entry) => entry.x));
          star.x = farthest + 120 + Math.random() * 220;
          star.y = world.laneBase - 34 - ((index + Math.round(world.distance / 250)) % 4) * 36;
          star.size = 12 + ((index + Math.round(world.distance / 400)) % 3) * 4;
          star.twinkle = Math.random() * Math.PI * 2;
        }

        const hitX = Math.abs(star.x - riderX) < 36;
        const hitY = Math.abs(star.y - (riderY - 78)) < 48;
        if (hitX && hitY) {
          world.starsCollected += 1;
          world.score += 25;
          world.lastStarMessage = 1.5;
          world.message = world.starsCollected % 5 === 0 ? "Mango found a mega sparkle!" : "Star collected!";
          star.x = Math.max(...world.stars.map((entry) => entry.x)) + 180 + Math.random() * 140;
          star.y = world.laneBase - 42 - Math.floor(Math.random() * 4) * 30;
          playNotes([523, 659, 784, 1046], 0.05);
        }
      });

      world.treats.forEach((treat, index) => {
        treat.x -= world.speed * delta;
        if (treat.x < -120) {
          const farthest = Math.max(...world.treats.map((entry) => entry.x));
          treat.x = farthest + 160 + Math.random() * 200;
          treat.y = world.laneBase - 6 - ((index + Math.round(world.distance / 220)) % 3) * 24;
          treat.kind = "fish";
          treat.size = 14 + Math.floor(Math.random() * 4);
          treat.twinkle = Math.random() * Math.PI * 2;
        }

        const hitTreatX = Math.abs(treat.x - riderX) < 34;
        const hitTreatY = Math.abs(treat.y - (riderY - 66)) < 42;
        if (hitTreatX && hitTreatY) {
          world.treatsCollected += 1;
          world.score += 12;
          world.lastTreatMessage = 1.4;
          world.message = "Mango got a fish treat!";
          treat.x = Math.max(...world.treats.map((entry) => entry.x)) + 180 + Math.random() * 140;
          treat.y = world.laneBase - 8 - Math.floor(Math.random() * 3) * 24;
          treat.kind = "fish";
          playNotes([392, 523, 659], 0.045);
        }
      });

      world.platforms.forEach((platform, index) => {
        platform.x -= world.speed * delta * 0.98;
        if (platform.x < -160) {
          const farthest = Math.max(...world.platforms.map((entry) => entry.x));
          platform.x = farthest + 240 + Math.random() * 180;
          platform.y = world.laneBase - 28 - ((index + Math.round(world.distance / 180)) % 3) * 18;
          platform.width = 78 + Math.floor(Math.random() * 34);
          platform.bounce = 720 + Math.floor(Math.random() * 120);
          platform.kind = Math.random() > 0.5 ? "spring" : "cloud";
        }

        const onPlatform =
          riderX > platform.x - 32 &&
          riderX < platform.x + platform.width + 32 &&
          Math.abs((riderY + 28) - platform.y) < 16 &&
          world.jumpHeight < 16 &&
          world.platformCooldown <= 0;

        if (onPlatform) {
          world.platformCooldown = 0.35;
          world.jumpVelocity = Math.max(world.jumpVelocity, platform.bounce);
          world.jumpHeight = Math.max(world.jumpHeight, 2);
          world.message = "Bounce!";
          playNotes([659, 784, 988], 0.04);
        }
      });

      world.powerups.forEach((powerup, index) => {
        powerup.x -= world.speed * delta * 0.96;
        if (powerup.x < -140) {
          const farthest = Math.max(...world.powerups.map((entry) => entry.x));
          powerup.x = farthest + 320 + Math.random() * 220;
          powerup.y = world.laneBase - 56 - ((index + Math.round(world.distance / 300)) % 2) * 16;
          powerup.twinkle = Math.random() * Math.PI * 2;
        }

        const hitPowerupX = Math.abs(powerup.x - riderX) < 36;
        const hitPowerupY = Math.abs(powerup.y - (riderY - 72)) < 48;
        if (hitPowerupX && hitPowerupY) {
          world.shieldTime = 5;
          world.message = "Star power shield!";
          powerup.x = Math.max(...world.powerups.map((entry) => entry.x)) + 360 + Math.random() * 200;
          powerup.y = world.laneBase - 56 - Math.floor(Math.random() * 2) * 16;
          playNotes([523, 784, 1046, 1318], 0.05);
        }
      });

      world.clouds.forEach((cloud, index) => {
        cloud.x -= delta * (world.speed * 0.14);
        if (cloud.x < -120) {
          cloud.x = width + 120 + index * 180;
          cloud.y = 36 + Math.random() * 84;
          cloud.size = 46 + Math.random() * 34;
        }
      });

      world.score = Math.round(world.distance / 8 + world.starsCollected * 22 + Math.max(0, (world.speed - 240) * 0.4));
      world.best = Math.max(world.best || 0, world.score);
      try {
        window.localStorage.setItem("roller-roller-coaster-best", String(world.best));
      } catch {
        // ignore storage failures
      }

      if (now - hudFrameRef.current > 110) {
        hudFrameRef.current = now;
        setHud({
          score: world.score,
          stars: world.starsCollected,
          treats: world.treatsCollected,
          crashes: world.crashesTaken,
          shield: Math.ceil(world.shieldTime),
          best: world.best,
          speed: Math.round(world.speed),
          message: world.message,
        });
      }

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#fff7fd");
      bg.addColorStop(0.4, "#ffe8f7");
      bg.addColorStop(0.7, "#dffaf4");
      bg.addColorStop(1, "#eef6ff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 12; i += 1) {
        const sparkleX = ((i * 137) + world.distance * 0.12) % (width + 120) - 60;
        const sparkleY = 50 + (i % 5) * 54 + Math.sin((world.sparklePhase + i) * 0.9) * 8;
        drawStar(ctx, sparkleX, sparkleY, 5 + (i % 3), 5, 2.3, i % 2 === 0 ? "#FFFFFF" : "#FCE7A1", world.sparklePhase + i * 0.3);
      }

      world.clouds.forEach((cloud) => drawCloud(ctx, cloud.x, cloud.y, cloud.size, "#FFFFFF", 0.72));

      drawTrack(ctx, width, groundY, now, world.distance * 0.58);

      if (world.crashFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 72, 120, ${Math.min(0.24, world.crashFlash * 0.3)})`;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = `rgba(255, 72, 120, ${Math.min(0.8, world.crashFlash)})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(6, 6, width - 12, height - 12);
        ctx.fillStyle = `rgba(255, 72, 120, ${Math.min(1, world.crashFlash * 1.2)})`;
        ctx.font = "900 28px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Crash!", width / 2, 76);
        ctx.restore();
      }

      if (world.shieldTime > 0) {
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.min(0.22, world.shieldTime * 0.03);
        ctx.fillStyle = "#7DD3FC";
        ctx.beginPath();
        ctx.arc(riderX, riderTrackY - 24, 82 + Math.sin(now * 0.01) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#FDE68A";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(riderX, riderTrackY - 24, 82 + Math.sin(now * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.56)";
      ctx.fillRect(0, groundY + 34, width, height - groundY);
      ctx.restore();

      world.stars.forEach((star) => {
        drawStar(
          ctx,
          star.x,
          star.y,
          star.size,
          5,
          star.size * 0.45,
          "#FFF08A",
          world.sparklePhase + star.twinkle
        );
      });

      world.obstacles.forEach((obstacle) => drawObstacle(ctx, obstacle, now));
      world.platforms.forEach((platform) => drawPlatform(ctx, platform, now));
      world.powerups.forEach((powerup) => drawPowerup(ctx, powerup, now, world.shieldTime > 0));

      drawRider(
        ctx,
        riderX,
        riderTrackY,
        world.jumpHeight,
        Math.sin(world.distance * 0.1) * 6,
        now,
        world.ducking
      );

      ctx.save();
      ctx.fillStyle = "#0F4036";
      ctx.font = "900 16px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Roller Roller Coaster", 24, 34);
      ctx.fillStyle = "#6A614F";
      ctx.font = "700 13px Inter, system-ui, sans-serif";
      ctx.fillText("Zahra rides forever. Mango rides too.", 24, 56);
      ctx.restore();

      rafRef.current = window.requestAnimationFrame(frame);
    }

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      active = false;
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [canvasSize.height, musicOn]);

  useEffect(() => {
    function startAudioOnFirstTouch() {
      unlockAudio();
    }

    window.addEventListener("pointerdown", startAudioOnFirstTouch);
    return () => window.removeEventListener("pointerdown", startAudioOnFirstTouch);
  }, [musicOn]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(236,219,255,1)_36%,_rgba(215,245,255,1)_68%,_rgba(211,247,221,1)_100%)] text-[#1b1730]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <header className="rounded-[32px] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(109,76,165,0.14)] backdrop-blur md:p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex rounded-full bg-[#0F4036] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white">
              For Zahra
            </div>
            <h1 className="text-3xl font-black leading-none text-[#0F4036] md:text-6xl">
              Roller Roller Coaster
            </h1>
            <div className="grid w-full max-w-[700px] gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="flex min-h-[220px] items-center justify-center rounded-[30px] border border-dashed border-[#7A5CF5]/25 bg-white/70 px-6 py-8 text-center text-sm font-black uppercase tracking-[0.2em] text-[#6D4CA5]">
                Roller art reset
              </div>
              <div className="flex min-h-[220px] items-center justify-center rounded-[30px] border border-dashed border-[#FF4D9D]/25 bg-white/70 px-6 py-8 text-center text-sm font-black uppercase tracking-[0.2em] text-[#B13373]">
                Fresh start
              </div>
            </div>
            <p className="max-w-3xl text-base font-semibold leading-7 text-[#5f4d79] md:text-lg">
              Free to play, rainbow track, unicorn sparkle, endless stars, Mango treats, and easy tap controls.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={startGame}
                className="rounded-[24px] bg-[#FF4D9D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(255,77,157,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ec2c87]"
              >
                Start the ride
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-[24px] border border-[#CA862B]/18 bg-[#FFF7EA] px-5 py-3 text-sm font-black text-[#0F4036] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Copy share link
              </button>
            </div>
          </div>
        </header>

        <main className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <section
            ref={sceneRef}
            className="relative min-h-[580px] overflow-hidden rounded-[34px] border border-white/80 bg-white/70 shadow-[0_28px_90px_rgba(109,76,165,0.16)]"
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute inset-0 h-full w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 p-4 md:p-6">
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Stars {hud.stars}
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Mango treats {hud.treats}
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Crashes {hud.crashes}/3
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Shield {hud.shield}s
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Score {hud.score}
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Best {hud.best}
                </div>
                <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F4036] shadow-sm">
                  Speed {hud.speed}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-6">
              <div className="rounded-[28px] border border-white/72 bg-white/90 px-4 py-3 shadow-[0_12px_40px_rgba(109,76,165,0.12)]">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                  {hud.message}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#5f4d79]">
                  Space or the Jump button helps Zahra hop obstacles, collect stars, and scoop Mango fish treats.
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 md:bottom-5">
              <div className="pointer-events-auto flex w-full max-w-[520px] gap-3 rounded-[28px] border border-white/80 bg-white/92 p-3 shadow-[0_18px_50px_rgba(109,76,165,0.18)]">
                <button
                  type="button"
                  onClick={jump}
                  className="flex-1 rounded-[22px] bg-[#FF4D9D] px-5 py-4 text-base font-black text-white shadow-[0_16px_30px_rgba(255,77,157,0.24)]"
                >
                  Jump
                </button>
                <button
                  type="button"
                  onPointerDown={() => {
                    unlockAudio();
                    setDucking(true);
                  }}
                  onPointerUp={() => setDucking(false)}
                  onPointerCancel={() => setDucking(false)}
                  onPointerLeave={() => setDucking(false)}
                  className="flex-1 rounded-[22px] bg-[#0F4036] px-5 py-4 text-base font-black text-white shadow-[0_16px_30px_rgba(15,64,54,0.18)]"
                >
                  Duck
                </button>
                <button
                  type="button"
                  onClick={() => setMusicOn((current) => !current)}
                  className="rounded-[22px] border border-[#7A5CF5]/18 bg-[#7A5CF5] px-4 py-4 text-sm font-black text-white transition hover:bg-[#6842f0]"
                >
                  Sound
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_24px_70px_rgba(109,76,165,0.12)]">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8B5A1D]">
              Cartoon preview
            </div>
            <h2 className="mt-2 text-2xl font-black text-[#0F4036]">
              Zahra, Samantha, and Mango
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f4d79]">
              Free to play. The coaster is being rebuilt from a clean baseline.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex min-h-[160px] items-center justify-center rounded-[24px] border border-dashed border-[#7A5CF5]/25 bg-white/70 px-4 py-6 text-center text-xs font-black uppercase tracking-[0.22em] text-[#6D4CA5]">
                Reset art slot
              </div>
              <div className="flex min-h-[160px] items-center justify-center rounded-[24px] border border-dashed border-[#FF4D9D]/25 bg-white/70 px-4 py-6 text-center text-xs font-black uppercase tracking-[0.22em] text-[#B13373]">
                Placeholder slot
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={jump}
                className="rounded-[22px] bg-[#FF4D9D] px-4 py-4 text-sm font-black text-white shadow-[0_18px_30px_rgba(255,77,157,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ec2c87]"
              >
                Jump now
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-[22px] border border-[#CA862B]/18 bg-[#FFF7EA] px-4 py-4 text-sm font-black text-[#0F4036] transition hover:bg-white"
              >
                Copy share link
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

const ONLINE_ORDERING_BETA_MENU = GOLDIES_MENU_CATEGORY_LABELS.map((category) => ({
  category,
  items: GOLDIES_STATIC_DRINK_MENU_ITEMS
    .filter((item) => item.category === category)
    .map((item) => ({
      ...item,
      price: formatCurrencyCents(item.priceCents),
    })),
}));

function isOnlinePickupStaticItem(item = {}) {
  const text = String(item.name || "").toLowerCase();
  return !(
    text === "espresso" ||
    text.includes("gibraltar") ||
    text.includes("pour over")
  );
}

function normalizeOnlineOrderMenuGroups(groups = [], { includeForHereOnly = false } = {}) {
  return (groups || []).map((group) => ({
    ...group,
    items: (group.items || [])
      .filter((item) => includeForHereOnly || isOnlinePickupStaticItem(item))
      .map((item) => ({
      ...item,
      squareName: item.squareName || item.name,
      name: getCanonicalDrinkName(item.name),
    })),
  }));
}

const KIOSK_STOCK_IMAGE_URLS = {
  "latte":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  "americano":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  "decaf-americano":
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
  "cold-brew":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  "cappuccino":
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

const KIOSK_LOCAL_IMAGE_URLS = {
  ...Object.fromEntries(
    GOLDIES_STATIC_DRINK_MENU_ITEMS.map((item) => [item.id, item.imageUrl])
  ),
  "neutral-cafe-drink": getGeneratedDrinkImageUrl("neutral-cafe-drink"),
};

function getKioskImageSlug(item = {}) {
  const text = `${item.id || ""} ${item.name || ""} ${item.squareName || ""}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const isKidsSize = text.includes("12-oz") || text.includes("kids");

  if (text.includes("decaf") && text.includes("americano")) return "americano-decaf";
  if (text.includes("drip") && text.includes("refill")) return "drip-refill";
  if (text.includes("drip")) return "drip";
  if (text.includes("pour-over") || text.includes("pour")) return "pour-over";
  if (text.includes("espresso")) return "espresso";
  if (text.includes("flat-white") || (text.includes("flat") && text.includes("white"))) return "flat-white";
  if (text.includes("gibraltar")) return "gibraltar";
  if (text.includes("cold-brew")) return "cold-brew";
  if (text.includes("cappuccino")) return "cappuccino";
  if (text.includes("americano")) return "americano";
  if (text.includes("london-fog") || (text.includes("london") && text.includes("fog"))) return "london-fog";
  if (text.includes("chai")) return "chai-latte";
  if (text.includes("hot-chocolate")) return "hot-chocolate";
  if (text.includes("matcha")) return "matcha-latte";
  if (text.includes("refresher")) return "refresher-strawberry-mango";
  if (text.includes("steamer")) return "steamer-or-cold";
  if (text.includes("chocolate") && text.includes("banana")) {
    return isKidsSize ? "chocolate-pb-banana-12-oz-kids" : "chocolate-pb-banana-16-oz";
  }
  if (text.includes("green") || text.includes("greens")) {
    return isKidsSize ? "greens-12-oz-kids" : "greens-16-oz";
  }
  if (text.includes("strawberry") && text.includes("banana")) {
    return isKidsSize ? "strawberry-banana-12-oz-kids" : "strawberry-banana-16-oz";
  }
  if (text.includes("strawberry") && text.includes("mango")) {
    return isKidsSize ? "strawberry-mango-12-oz-kids" : "strawberry-mango-16-oz";
  }
  if (text.includes("mango")) return isKidsSize ? "mango-12-oz-kids" : "mango-16-oz";
  if (text.includes("strawberry")) return isKidsSize ? "strawberry-12-oz-kids" : "strawberry-16-oz";
  return "latte";
}

function getOnlineOrderItemDescription(item = {}) {
  const explicitDescription = String(item.description || "").trim();
  const isOldFillerDescription =
    /goldie's drink option|prepared for pickup|square checkout/i.test(explicitDescription);
  if (explicitDescription && !isOldFillerDescription) return explicitDescription;

  const name = String(item.name || "drink").toLowerCase();
  const category = String(item.category || "").toLowerCase();
  if (name.includes("refresher")) return "Cold strawberry mango refresher; bright, fruity, and coffee-free.";
  if (name.includes("chocolate") && name.includes("banana")) {
    return "Chocolate, peanut butter, and banana smoothie; rich, cold, and filling.";
  }
  if (name.includes("strawberry") && name.includes("banana")) {
    return "Strawberry and banana smoothie with a classic fruit blend profile.";
  }
  if (name.includes("strawberry") && name.includes("mango")) {
    return "Strawberry and mango smoothie with a bright tropical fruit profile.";
  }
  if (name.includes("greens") || name.includes("green")) {
    return "Green smoothie option with a cold, produce-forward profile.";
  }
  if (name.includes("mango")) return "Mango smoothie; sweet, cold, and fruit-forward.";
  if (name.includes("strawberry")) return "Strawberry smoothie; sweet, cold, and fruit-forward.";
  if (name.includes("decaf") && name.includes("americano")) {
    return "Decaf espresso with hot water for a clean Americano flavor without regular caffeine.";
  }
  if (name.includes("americano")) return "Espresso with hot water for a clean, lighter-bodied coffee.";
  if (name.includes("cappuccino")) return "Espresso with steamed milk and a thicker foam cap than a latte.";
  if (name.includes("cold brew")) return "Cold-steeped coffee served chilled for a smooth, lower-acid sip.";
  if (name.includes("drip refill")) return "A refill of Goldie's brewed drip coffee.";
  if (name.includes("drip")) return "Goldie's brewed coffee, served straightforward and easy to customize.";
  if (name.includes("espresso")) return "A concentrated espresso shot, served small and strong.";
  if (name.includes("flat white")) return "Espresso with steamed milk and a thin microfoam texture.";
  if (name.includes("gibraltar")) return "A small espresso and milk drink with a balanced cortado-style profile.";
  if (name.includes("pour over")) return "A hand-poured coffee brewed to order for a clear, slower-sipped cup.";
  if (name.includes("hot chocolate")) return "Creamy chocolate drink with steamed milk and a cozy dessert-style profile.";
  if (name.includes("london fog")) return "Earl Grey tea latte style drink with steamed milk and vanilla notes.";
  if (name.includes("chai")) return "Spiced chai with steamed milk; warm, sweet, and aromatic.";
  if (name.includes("matcha")) return "Matcha green tea with milk for a creamy, earthy drink.";
  if (name.includes("steamer")) return "Steamed or cold milk-based drink for a simple non-coffee option.";
  if (name.includes("latte")) return "Espresso with steamed milk and a light layer of foam.";

  if (category.includes("smoothie")) return "Cold blended drink from Goldie's smoothie menu.";
  if (category.includes("not coffee")) return "Non-coffee drink with the available milk, flavor, and temperature choices.";
  if (category.includes("coffee")) return "Coffee drink with the available milk, flavor, and temperature choices.";
  return "Made to order from Goldie's current drink menu.";
}

function getOnlineOrderVisualStyle(item = {}) {
  const text = `${item.category || ""} ${item.name || ""}`.toLowerCase();
  if (text.includes("smoothie") || text.includes("banana") || text.includes("green")) {
    return {
      background:
        "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.72), transparent 26%), linear-gradient(135deg, #E9F0D5, #7FA36C 48%, #0F4036)",
      label: "Cold blend",
    };
  }
  if (text.includes("matcha") || text.includes("tea") || text.includes("chai") || text.includes("fog")) {
    return {
      background:
        "radial-gradient(circle at 25% 18%, rgba(255,255,255,0.74), transparent 25%), linear-gradient(135deg, #FFF7EA, #D6B983 48%, #0F4036)",
      label: "Tea bar",
    };
  }
  return {
    background:
      "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.78), transparent 26%), linear-gradient(135deg, #FFF7EA, #CA862B 50%, #0F4036)",
    label: "Coffee bar",
  };
}

function getOnlineOrderImageUrl(item = {}) {
  const slug = getKioskImageSlug(item);
  if (KIOSK_LOCAL_IMAGE_URLS[slug]) return KIOSK_LOCAL_IMAGE_URLS[slug];

  if (item.imageUrl && !String(item.imageUrl).startsWith("/assets/drinks/")) {
    return item.imageUrl;
  }

  return KIOSK_STOCK_IMAGE_URLS[slug] || KIOSK_LOCAL_IMAGE_URLS["neutral-cafe-drink"];
}

function DrinkProductImage({ item, className = "" }) {
  return (
    <div className={`overflow-hidden bg-[#E8DDC9] ${className}`}>
      <img
        src={getOnlineOrderImageUrl(item)}
        alt=""
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </div>
  );
}

function OnlineOrderingBetaPage({ kioskMode = false }) {
  const demoMode = isDemoTrainingRoute();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const ordered = searchParams.has("ordered");
  const testerName = (
    searchParams.get("name") ||
    searchParams.get("customer") ||
    searchParams.get("tester") ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const [menuGroups, setMenuGroups] = useState(() =>
    normalizeOnlineOrderMenuGroups(ONLINE_ORDERING_BETA_MENU, {
      includeForHereOnly: kioskMode,
    })
  );
  const [menuSource, setMenuSource] = useState("static");
  const [orderingHours, setOrderingHours] = useState(null);
  const [serverPickupSlots, setServerPickupSlots] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState(testerName);
  const [customerEmail, setCustomerEmail] = useState("");
  const [pickupMode, setPickupMode] = useState("asap");
  const [scheduledPickupTime, setScheduledPickupTime] = useState("");
  const [readyQuote, setReadyQuote] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const cartTotalCents = cart.reduce((sum, item) => {
    const baseCents =
      Number(item.priceCents || 0) ||
      Math.round(
        (Number.parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0) * 100
      );
    const modifierCents = (item.modifierGroups || []).reduce(
      (sum, group) =>
        sum +
        (group.options || [])
          .filter((option) => (item.modifierIds || []).includes(option.id))
          .reduce((optionSum, option) => optionSum + Number(option.priceCents || 0), 0),
      0
    );
    return sum + (baseCents + modifierCents) * item.qty;
  }, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const pickupSlots = serverPickupSlots.length ? serverPickupSlots : [];
  const pickupTime =
    pickupMode === "scheduled"
      ? scheduledPickupTime
      : readyQuote?.readyTimeLabel
        ? `ASAP - estimated ${readyQuote.readyTimeLabel}`
        : "ASAP";
  useEffect(() => {
    let mounted = true;

    async function fetchMenu() {
      try {
        const response = await fetch(
          apiUrl(`/api/beta/online-order/menu${kioskMode ? "?mode=kiosk" : ""}`)
        );
        const data = await response.json().catch(() => ({}));
        if (!mounted || !response.ok || !Array.isArray(data.categories)) return;
        setMenuGroups(
          normalizeOnlineOrderMenuGroups(
            data.categories.length ? data.categories : ONLINE_ORDERING_BETA_MENU,
            { includeForHereOnly: kioskMode }
          )
        );
        setMenuSource(data.source || "static");
        setOrderingHours(data.hours || null);
        setServerPickupSlots(data.pickupSlots || []);
      } catch {
        if (mounted) setMenuSource("static");
      }
    }

    fetchMenu();
    return () => {
      mounted = false;
    };
  }, [kioskMode]);

  useEffect(() => {
    let mounted = true;

    async function fetchReadyQuote() {
      if (!cartItemCount) {
        setReadyQuote(null);
        return;
      }

      try {
        const response = await fetch(
          apiUrl(`/api/beta/online-order/quote?items=${cartItemCount}`)
        );
        const data = await response.json().catch(() => ({}));
        if (!mounted || !response.ok) return;
        setReadyQuote(data);
        setOrderingHours(data.hours || null);
        setServerPickupSlots(data.pickupSlots || []);
      } catch {
        if (mounted) setReadyQuote(null);
      }
    }

    fetchReadyQuote();
    const interval = setInterval(fetchReadyQuote, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [cartItemCount]);

  function addItem(item, category) {
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry
        );
      }

      const defaultModifierIds = (item.modifierGroups || [])
        .filter(
          (group) =>
            group.required &&
            group.selectionType === "single" &&
            (group.options || []).length === 1
        )
        .map((group) => group.options[0].id);

      return [...current, { ...item, category, qty: 1, modifierIds: defaultModifierIds }];
    });
  }

  function updateQty(id, delta) {
    setCart((current) =>
      current
        .map((entry) =>
          entry.id === id ? { ...entry, qty: Math.max(0, entry.qty + delta) } : entry
        )
        .filter((entry) => entry.qty > 0)
    );
  }

  function toggleModifier(itemId, groupId, modifierId, selectionType = "multiple") {
    setCart((current) =>
      current.map((entry) => {
        if (entry.id !== itemId) return entry;
        const currentIds = entry.modifierIds || [];
        const group = (entry.modifierGroups || []).find((modifierGroup) => modifierGroup.id === groupId);
        const groupOptionIds = new Set((group?.options || []).map((option) => option.id));

        if (selectionType === "single") {
          const withoutGroup = currentIds.filter((id) => !groupOptionIds.has(id));
          return {
            ...entry,
            modifierIds: currentIds.includes(modifierId)
              ? withoutGroup
              : [...withoutGroup, modifierId],
          };
        }

        const nextIds = currentIds.includes(modifierId)
          ? currentIds.filter((id) => id !== modifierId)
          : [...currentIds, modifierId];
        return { ...entry, modifierIds: nextIds };
      })
    );
  }

  async function createCheckout() {
    if (!cart.length || submitting) return;
    if (pickupMode === "asap" && orderingHours && !orderingHours.accepting) {
      setOrderError("ASAP pickup is closed. Choose a scheduled pickup time during store hours.");
      return;
    }
    for (const item of cart) {
      for (const group of item.modifierGroups || []) {
        if (!group.required) continue;
        const optionIds = new Set((group.options || []).map((option) => option.id));
        const hasSelection = (item.modifierIds || []).some((id) => optionIds.has(id));
        if (!hasSelection) {
          setOrderError(`Choose ${group.name} for ${item.name}.`);
          return;
        }
      }
    }

    setSubmitting(true);
    setOrderError("");

    try {
      const response = await fetch(apiUrl("/api/beta/online-order/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName,
          customerEmail,
          pickupTime,
          notes,
          source: kioskMode ? "self_order_kiosk" : "online_ordering_beta",
          items: cart.map((item) => ({
            id: item.id,
            variationId: item.variationId,
            qty: item.qty,
            modifierIds: item.modifierIds || [],
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.details || data.error || "Checkout could not be created.");
      }

      if (!data.checkoutUrl) {
        throw new Error("Square did not return a checkout link.");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setOrderError(error.message || "Checkout could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5E9D7] text-[#111111]">
      <div className="relative overflow-hidden border-b border-[#CA862B]/16 bg-[#FDF8EF]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0F4036]" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={demoMode ? "/?demo=training" : "/"}
              className="inline-flex rounded-full border border-[#CA862B]/18 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
            >
              Back to KDS
            </a>
            <button
              type="button"
              onClick={() => setShowCartDrawer(true)}
              className="inline-flex items-center gap-3 rounded-full bg-[#0F4036] px-4 py-2 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,64,54,0.18)] transition hover:bg-[#0b352d]"
            >
              <span>Cart</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[#0F4036]">{cartItemCount}</span>
            </button>
          </div>

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] border border-[#CA862B]/16 bg-white shadow-[0_20px_48px_rgba(15,64,54,0.12)]">
                  {demoMode ? <DemoBrandMark size="sm" /> : <img src={LOGO_URL} alt="Goldie's Coffee & Goods" className="max-h-20 max-w-20 object-contain" />}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-[#8B5A1D]">
                    {kioskMode ? "Goldie's self order" : "Goldie's pickup ordering"}
                  </div>
                  <h1 className="mt-2 max-w-3xl text-4xl font-black leading-[0.98] tracking-normal text-[#0F4036] md:text-6xl">
                    {kioskMode ? "Choose your drink." : "Goldie's drinks, ordered ahead."}
                  </h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#5A4F3E]">
                {kioskMode
                  ? "Browse the photo menu, add your favorites, then open the cart when you're ready."
                  : "Choose your drink, add a pickup name, and pay through Square checkout."}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-[#CA862B]/16 bg-white p-4 shadow-[0_24px_70px_rgba(15,64,54,0.12)]">
              <div className="grid grid-cols-3 gap-2 text-center">
                {["Choose", "Customize", "Checkout"].map((step) => (
                  <div key={step} className="rounded-2xl bg-[#F6EFE1] px-2 py-3 text-sm font-black text-[#0F4036]">{step}</div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-[#0F4036] px-4 py-3 text-white">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#F3D39B]">Pickup</div>
                <div className="mt-1 text-xl font-black">{readyQuote?.readyTimeLabel ? `ASAP around ${readyQuote.readyTimeLabel}` : "ASAP or scheduled"}</div>
              </div>
            </div>
          </div>
          {orderingHours && !orderingHours.accepting ? (
            <div className="mt-5 rounded-2xl border border-[#CA862B]/20 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#0F4036]">
              {orderingHours.message} You can still schedule a pickup during open hours.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 p-4 pb-28">

        {ordered ? (
          <div className="rounded-3xl border border-[#0F4036]/14 bg-white/90 p-4 text-sm font-bold leading-6 text-[#0F4036] shadow-sm">
            Payment complete. Square may take a moment to send the order back to the KDS.
          </div>
        ) : null}

        <main className="grid gap-5">
          <section className="space-y-4">
            <div className="sticky top-0 z-20 -mx-4 border-b border-[#CA862B]/12 bg-[#F6EFE1]/92 px-4 py-3 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {menuGroups.map((group) => (
                  <a
                    key={group.category}
                    href={`#kiosk-category-${group.category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                    className="shrink-0 rounded-full border border-[#CA862B]/18 bg-white px-4 py-2 text-sm font-black text-[#0F4036] shadow-sm transition hover:bg-[#EEE0C5]/45"
                  >
                    {group.category}
                  </a>
                ))}
              </div>
            </div>

            {menuGroups.map((group) => (
              <article key={group.category} className="rounded-[2rem] border border-white/70 bg-[rgba(255,253,248,0.96)] p-4 shadow-[0_18px_48px_rgba(15,64,54,0.08)]">
                <div id={`kiosk-category-${group.category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="flex scroll-mt-24 items-end justify-between gap-3">
                  <h2 className="text-2xl font-black text-[#0F4036]">{group.category}</h2>
                  <span className="rounded-full bg-[#CA862B]/10 px-2.5 py-1 text-xs font-black text-[#8B5A1D]">
                    {group.items.length}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-[1.25rem] border border-[#CA862B]/16 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => setDetailItem({ ...item, category: group.category })}
                        className="block w-full text-left"
                      >
                        <DrinkProductImage item={{ ...item, category: group.category }} className="aspect-[4/3] w-full" />
                      </button>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <span className="block text-base font-black text-[#111111]">
                            {item.name}
                            {item.variationName ? (
                              <span className="block text-xs font-bold text-[#6A614F]">
                                {item.variationName}
                              </span>
                            ) : null}
                          </span>
                        <button
                          type="button"
                          onClick={() => setDetailItem({ ...item, category: group.category })}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#CA862B]/20 bg-[#FFFDF8] text-xs font-black text-[#0F4036] transition hover:bg-[#EEE0C5]"
                          aria-label={`More about ${item.name}`}
                          title={`More about ${item.name}`}
                        >
                          i
                        </button>
                        </div>
                        <span className="mt-1 block text-sm font-semibold text-[#6A614F]">
                          {item.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => addItem(item, group.category)}
                          className="mt-3 min-h-11 w-full rounded-xl bg-[#0F4036] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
                        >
                          Add to order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          {showCartDrawer && (
            <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/40 p-3 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Close cart"
                className="absolute inset-0 cursor-default"
                onClick={() => setShowCartDrawer(false)}
              />
              <aside className="relative mx-auto my-3 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-[rgba(255,253,248,0.98)] p-4 shadow-[0_24px_70px_rgba(15,64,54,0.24)] md:my-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">Your pickup</div>
                    <h2 className="mt-1 text-2xl font-black text-[#0F4036]">Review order</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCartDrawer(false)}
                      className="rounded-full border border-[#CA862B]/18 bg-white px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
                    >
                      Close
                    </button>
                    <div className="rounded-2xl bg-[#0F4036] px-3 py-2 text-right text-white">
                      <div className="text-xs font-black uppercase tracking-[0.12em] text-white/70">{cartItemCount} items</div>
                      <div className="text-lg font-black">${(cartTotalCents / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {cart.length ? (
                    cart.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-[#CA862B]/16 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-[#111111]">
                          {item.name}
                          {item.variationName ? (
                            <span className="block text-xs font-bold text-[#6A614F]">
                              {item.variationName}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-[#6A614F]">{item.price}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQty(item.id, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#CA862B]/22 bg-white font-black text-[#0F4036]">-</button>
                        <span className="w-6 text-center font-black">{item.qty}</span>
                        <button type="button" onClick={() => updateQty(item.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#CA862B]/22 bg-white font-black text-[#0F4036]">+</button>
                      </div>
                    </div>
                    {(item.modifierGroups || []).length ? (
                      <div className="mt-3 space-y-3 border-t border-[#CA862B]/12 pt-3">
                        {item.modifierGroups.map((group) => {
                          const groupLabel =
                            group.role === "temperature"
                              ? "Temperature"
                              : group.role === "size"
                                ? "Size"
                                : "Drink additions";

                          return (
                            <div key={`${item.id}-${group.id}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-black uppercase tracking-[0.12em] text-[#8B5A1D]">
                                  {groupLabel}
                                </div>
                                {group.role === "addition" && group.name && group.name !== groupLabel ? (
                                  <span className="text-xs font-bold text-[#6A614F]">
                                    {group.name}
                                  </span>
                                ) : null}
                                <span className="rounded-full bg-[#CA862B]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#8B5A1D]">
                                  {group.required
                                    ? "Required"
                                    : group.selectionType === "single"
                                      ? "Choose one"
                                      : "Choose any"}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(group.options || []).map((option) => {
                                  const checked = (item.modifierIds || []).includes(option.id);
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() =>
                                        toggleModifier(
                                          item.id,
                                          group.id,
                                          option.id,
                                          group.selectionType
                                        )
                                      }
                                      className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                                        checked
                                          ? "border-[#0F4036] bg-[#0F4036] text-white"
                                          : "border-[#CA862B]/20 bg-[#FFFDF8] text-[#0F4036] hover:bg-[#EEE0C5]/45"
                                      }`}
                                    >
                                      {option.name}
                                      {option.priceCents ? ` +${option.price}` : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-4 text-sm font-semibold text-[#6A614F]">
                  Tap a drink photo to start an order.
                </div>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-black text-[#0F4036]">Pickup name</span>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15" />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-black text-[#0F4036]">Email confirmation</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="you@email.com"
                className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-black text-[#0F4036]">Pickup time</span>
              <select
                value={pickupMode === "scheduled" ? scheduledPickupTime : "asap"}
                onChange={(event) => {
                  if (event.target.value === "asap") {
                    setPickupMode("asap");
                    setScheduledPickupTime("");
                  } else {
                    setPickupMode("scheduled");
                    setScheduledPickupTime(event.target.value);
                  }
                }}
                className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15"
              >
                <option value="asap" disabled={orderingHours && !orderingHours.accepting}>
                  {orderingHours && !orderingHours.accepting
                    ? "ASAP unavailable outside pickup hours"
                    : `ASAP${readyQuote?.readyTimeLabel ? ` - estimated ${readyQuote.readyTimeLabel}` : ""}`}
                </option>
                {pickupSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    Schedule for {slot.label}
                  </option>
                ))}
              </select>
            </label>
            {pickupMode === "asap" && readyQuote ? (
              <div className="mt-2 rounded-2xl border border-[#0F4036]/12 bg-[#0F4036]/6 px-4 py-3 text-sm font-bold leading-6 text-[#0F4036]">
                Estimated ready around {readyQuote.readyTimeLabel}. Based on {readyQuote.drinksAhead} drinks ahead and {readyQuote.averageLabel} average drink time.
              </div>
            ) : null}
            <label className="mt-3 block">
              <span className="text-sm font-black text-[#0F4036]">Notes or flavor request</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Example: London Fog with lavender if available" rows="4" className="mt-2 w-full rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 font-bold outline-none focus:border-[#CA862B] focus:ring-4 focus:ring-[#CA862B]/15" />
            </label>
            {orderError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {orderError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={createCheckout}
              disabled={!cart.length || !customerName.trim() || submitting}
              className={`mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-center font-black text-white transition ${
                cart.length && customerName.trim() && !submitting ? "bg-[#0F4036] hover:bg-[#0b352d]" : "bg-neutral-300"
              }`}
            >
              {submitting ? "Opening Square checkout..." : kioskMode ? "Checkout" : "Pay with Square"}
            </button>
            <p className="mt-3 text-xs font-semibold leading-5 text-[#6A614F]">
              Checkout note: payment opens in Square checkout. Once paid, Square sends the order back for KDS intake.
            </p>
          </aside>
            </div>
          )}
        </main>
      </div>

      {cartItemCount > 0 && !showCartDrawer ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#CA862B]/18 bg-[#FFFDF8]/96 p-3 shadow-[0_-18px_45px_rgba(15,64,54,0.14)] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B5A1D]">Your order</div>
              <div className="text-lg font-black text-[#0F4036]">
                {cartItemCount} {cartItemCount === 1 ? "item" : "items"} · ${(cartTotalCents / 100).toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCartDrawer(true)}
              className="rounded-2xl bg-[#0F4036] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,64,54,0.2)] transition hover:bg-[#0b352d]"
            >
              View cart
            </button>
          </div>
        </div>
      ) : null}

      {detailItem ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 backdrop-blur-sm sm:p-4">
          <div className="absolute inset-0" onClick={() => setDetailItem(null)} />
          <div className="relative mx-auto my-3 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(0,0,0,0.24)] md:my-8">
            <div
              className="relative grid gap-4 overflow-hidden bg-[#0F4036] p-5 text-white md:grid-cols-[0.9fr_1.1fr] md:items-center"
            >
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg font-black text-[#0F4036] shadow-sm"
                aria-label="Close item details"
              >
                x
              </button>
              <DrinkProductImage item={detailItem} className="relative aspect-square rounded-[1.8rem] border border-white/24 shadow-[0_24px_70px_rgba(0,0,0,0.22)]" />
              <div className="relative flex min-h-52 flex-col justify-between">
                <div>
                  <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-lg">
                    <img src={LOGO_URL} alt="Goldie's Coffee & Goods" className="max-h-11 max-w-11 object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                      Goldie&apos;s {getOnlineOrderVisualStyle(detailItem).label}
                    </div>
                    <h2 className="mt-1 text-3xl font-black leading-none">
                      {detailItem.name}
                    </h2>
                    {detailItem.variationName ? (
                      <div className="mt-2 text-sm font-black text-white/82">
                        {detailItem.variationName}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-5 inline-flex w-fit rounded-full bg-white/92 px-4 py-2 text-sm font-black text-[#0F4036]">
                  {detailItem.price}
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5A1D]">
                  Drink details
                </div>
                <p className="mt-2 text-base font-semibold leading-7 text-[#4E4637]">
                  {getOnlineOrderItemDescription(detailItem)}
                </p>
                {(detailItem.modifierGroups || []).length ? (
                  <div className="mt-3 text-sm font-bold text-[#6A614F]">
                    Options available after adding: {(detailItem.modifierGroups || [])
                      .map((group) => group.name)
                      .slice(0, 3)
                      .join(", ")}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  addItem(detailItem, detailItem.category);
                  setDetailItem(null);
                }}
                className="rounded-2xl bg-[#0F4036] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b352d]"
              >
                Add to order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const DEVELOPER_PROJECTS = [
  "Studio Samantha",
  "GoldiesKDS",
  "DrinkFlowKDS",
  "Ignite Wonder",
  "VendorFlow",
];
const DEVELOPER_PLACEMENTS = [
  "Developer diary",
  "Popup message",
  "Owner reports",
  "Case study",
  "Release notes",
  "Landing page",
  "Internal idea",
];
const DEVELOPER_MOODS = ["sparkly", "rainbow", "urgent", "soft launch", "future idea"];

function formatDeveloperNoteDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDeveloperList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "string") return value;
  return "";
}

function DeveloperDiaryDashboard() {
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [username, setUsername] = useState("StudioSamantha");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [notes, setNotes] = useState([]);
  const [onboardingRequests, setOnboardingRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [storage, setStorage] = useState("");
  const [form, setForm] = useState({
    project: "Studio Samantha",
    placement: "Developer diary",
    visibility: "internal",
    title: "",
    body: "",
    suggestion: "",
    mood: "sparkly",
    tags: "",
    showUntil: "",
  });

  async function refreshNotes() {
    try {
      const response = await fetch(apiUrl("/api/developer/notes?limit=80"), {
        credentials: "include",
      });

      if (response.status === 401) {
        setSessionStatus("login");
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load diary notes");

      setNotes(data.notes || []);
      setStorage(data.storage || "");
      if (data.tableMissing) {
        setNotice("Supabase needs the developer_notes table. Notes will appear here after the schema is installed.");
      }
    } catch (noteError) {
      setError(noteError.message || "Could not load diary notes");
    }
  }

  async function refreshOnboardingRequests() {
    try {
      const response = await fetch(apiUrl("/api/developer/drinkflow-onboarding?limit=20"), {
        credentials: "include",
      });

      if (response.status === 401) {
        setSessionStatus("login");
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load DrinkFlow setup requests");

      setOnboardingRequests(data.requests || []);
      if (data.storage) setStorage(data.storage);
      if (data.tableMissing) {
        setNotice("Supabase needs the drinkflow_onboarding_requests table before setup requests appear here.");
      }
    } catch (requestError) {
      setError(requestError.message || "Could not load DrinkFlow setup requests");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function checkDeveloperSession() {
      try {
        const response = await fetch(apiUrl("/api/developer/session"), {
          credentials: "include",
        });
        const data = await response.json();

        if (!mounted) return;

        if (data.authenticated) {
          setSessionStatus("authenticated");
          setUsername(data.username || "StudioSamantha");
          refreshNotes();
          refreshOnboardingRequests();
        } else {
          setSessionStatus("login");
        }
      } catch (sessionError) {
        if (!mounted) return;
        setSessionStatus("login");
        setLoginError(sessionError.message || "Could not check studio login");
      }
    }

    checkDeveloperSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(apiUrl("/api/developer/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Studio login failed");

      setPassword("");
      setSessionStatus("authenticated");
      setUsername(data.username || username || "StudioSamantha");
      await refreshNotes();
      await refreshOnboardingRequests();
    } catch (loginFailure) {
      setLoginError(loginFailure.message || "Studio login failed");
    }
  }

  async function handleLogout() {
    await fetch(apiUrl("/api/developer/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setSessionStatus("login");
    setNotes([]);
    setOnboardingRequests([]);
  }

  async function handleSaveNote(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const response = await fetch(apiUrl("/api/developer/notes"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Could not save that note");

      setForm((current) => ({
        ...current,
        title: "",
        body: "",
        suggestion: "",
        tags: "",
        showUntil: "",
      }));
      setNotice("Saved to the developer diary.");
      setStorage(data.storage || storage);
      await refreshNotes();
    } catch (saveError) {
      setError(saveError.message || "Could not save that note");
    } finally {
      setSaving(false);
    }
  }

  const rainbowText = {
    fontFamily: "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive",
  };

  if (sessionStatus === "checking") {
    return (
      <div className="min-h-screen bg-[#fff7fb] p-6 text-[#2b2235]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border-4 border-white bg-white/80 p-8 text-center shadow-2xl">
          <div className="text-lg font-black">Opening the studio diary...</div>
        </div>
      </div>
    );
  }

  if (sessionStatus === "login") {
    return (
      <div className="min-h-screen overflow-hidden bg-[#fff7fb] p-4 text-[#2b2235]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,112,150,0.35),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(113,206,236,0.36),transparent_24%),radial-gradient(circle_at_50%_82%,rgba(255,210,90,0.42),transparent_30%)]" />
        <form
          onSubmit={handleLogin}
          className="relative mx-auto mt-12 max-w-lg overflow-hidden rounded-[2rem] border-4 border-white bg-white/88 p-6 shadow-[0_28px_90px_rgba(91,58,109,0.22)] backdrop-blur md:mt-24 md:p-8"
        >
          <div className="mb-6 flex justify-center gap-2">
            {["#ff5c8a", "#ffb84d", "#ffe66d", "#58c785", "#5cc8ff", "#a875ff"].map((color) => (
              <span key={color} className="h-4 w-4 rounded-full" style={{ background: color }} />
            ))}
          </div>
          <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[#7b5aa6]">
            Studio Samantha
          </p>
          <h1
            className="mt-2 text-center text-6xl font-black leading-none text-[#ff4f8b] md:text-7xl"
            style={rainbowText}
          >
            Developer Diary
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-center text-sm font-semibold leading-6 text-[#66576f]">
            A private place for updates, ideas, case-study notes, owner reports messages,
            and little sparks before they become features.
          </p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                User name
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#ff5c8a]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#ff5c8a]"
              />
            </label>
          </div>

          {loginError ? (
            <div className="mt-4 rounded-2xl border-2 border-[#ff9cb7] bg-[#fff0f5] px-4 py-3 text-sm font-black text-[#9a244f]">
              {loginError}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#ff4f8b] via-[#ffb84d] to-[#58c785] px-5 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.01]"
          >
            Open the diary
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7fb] text-[#2b2235]">
      <div className="bg-gradient-to-r from-[#ff5c8a] via-[#ffd35a] via-[#79d66f] via-[#63d2ff] to-[#b38cff] px-4 py-3" />

      <header className="border-b-4 border-white bg-white/82 px-4 py-5 shadow-sm backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7b5aa6]">
              Studio Samantha control room
            </p>
            <h1 className="mt-1 text-5xl font-black text-[#ff4f8b] md:text-7xl" style={rainbowText}>
              Little Developer Diary
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#66576f]">
              Capture the thought once, then decide whether it belongs in Goldie&apos;s,
              DrinkFlow, the owner reports, a popup, a case study, or the public story.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {storage ? (
              <span className="rounded-full border-2 border-[#bdebd4] bg-[#effff6] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#21744f]">
                {storage}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border-2 border-[#f3c4df] bg-white px-4 py-2 text-sm font-black text-[#7b5aa6] transition hover:bg-[#fff0f7]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] md:px-8">
        <form
          onSubmit={handleSaveNote}
          className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-[0_24px_70px_rgba(91,58,109,0.14)] md:p-6"
        >
          <div className="mb-5 flex flex-wrap gap-2">
            {DEVELOPER_PROJECTS.map((project) => (
              <button
                key={project}
                type="button"
                onClick={() => setForm((current) => ({ ...current, project }))}
                className={`rounded-full border-2 px-3 py-2 text-xs font-black transition ${
                  form.project === project
                    ? "border-[#ff5c8a] bg-[#ff5c8a] text-white"
                    : "border-[#f3c4df] bg-[#fff7fb] text-[#7b5aa6] hover:bg-[#fff0f7]"
                }`}
              >
                {project}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Where should this go?
              </span>
              <select
                value={form.placement}
                onChange={(event) =>
                  setForm((current) => ({ ...current, placement: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 font-black outline-none focus:border-[#ff5c8a]"
              >
                {DEVELOPER_PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>
                    {placement}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Visibility
              </span>
              <select
                value={form.visibility}
                onChange={(event) =>
                  setForm((current) => ({ ...current, visibility: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 font-black outline-none focus:border-[#ff5c8a]"
              >
                <option value="internal">Internal only</option>
                <option value="owner">Owner-facing</option>
                <option value="public">Public story</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
              Tiny headline
            </span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ready orders should feel like a handoff, not a parking lot"
              className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#ff5c8a]"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
              Diary note
            </span>
            <textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              placeholder="What did you notice? What changed? What should future-you remember?"
              rows={8}
              className="mt-2 w-full resize-y rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 text-base font-semibold leading-7 outline-none focus:border-[#ff5c8a]"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
              Suggestion or next action
            </span>
            <textarea
              value={form.suggestion}
              onChange={(event) =>
                setForm((current) => ({ ...current, suggestion: event.target.value }))
              }
              placeholder="Turn this into a popup, owner note, case study update, report idea..."
              rows={3}
              className="mt-2 w-full resize-y rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 text-base font-semibold leading-7 outline-none focus:border-[#ff5c8a]"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Mood
              </span>
              <select
                value={form.mood}
                onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))}
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 font-black outline-none focus:border-[#ff5c8a]"
              >
                {DEVELOPER_MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Tags
              </span>
              <input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="stats, popup, Ragbrai"
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 font-black outline-none focus:border-[#ff5c8a]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7b5aa6]">
                Show until
              </span>
              <input
                type="date"
                value={form.showUntil}
                onChange={(event) =>
                  setForm((current) => ({ ...current, showUntil: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border-2 border-[#f3c4df] bg-white px-4 py-3 font-black outline-none focus:border-[#ff5c8a]"
              />
            </label>
          </div>

          {notice ? (
            <div className="mt-4 rounded-2xl border-2 border-[#bdebd4] bg-[#effff6] px-4 py-3 text-sm font-black text-[#21744f]">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border-2 border-[#ff9cb7] bg-[#fff0f5] px-4 py-3 text-sm font-black text-[#9a244f]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#ff4f8b] via-[#ffb84d] to-[#58c785] px-5 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save this spark"}
          </button>
        </form>

        <aside className="space-y-4">
          <section className="rounded-[2rem] border-4 border-white bg-[#2b2235] p-5 text-white shadow-[0_24px_70px_rgba(91,58,109,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd35a]">
              How this becomes useful
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#ffd35a]" style={rainbowText}>
              Write once, reuse later
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/78">
              These notes can become Goldie&apos;s popups, owner reports language, release notes,
              DrinkFlow case-study updates, Studio Samantha event copy, or future product ideas.
            </p>
          </section>

          <section className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-[0_24px_70px_rgba(91,58,109,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b5aa6]">
              Private setup notes
            </p>
              <h2 className="mt-2 text-3xl font-black text-[#ff4f8b]" style={rainbowText}>
              Plug-and-play path
            </h2>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#66576f]">
              <p>
                Keep the public story customer-facing. Use this private diary for Mom Test
                questions, mentor notes, pricing reactions, and setup homework.
              </p>
              <ul className="space-y-2 pl-5">
                <li>Build a list of 5-10 nearby coffee shops, food trucks, and vendors.</li>
                <li>Ask what they use now, what breaks during rushes, and what they already pay for.</li>
                <li>Test pricing language from starter workflow to owner-reporting setup.</li>
                <li>Watch for real willingness to pay before expanding beyond Square.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_24px_70px_rgba(91,58,109,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b5aa6]">
                  DrinkFlow leads
                </p>
                <h2 className="text-xl font-black text-[#2b2235]">Setup request queue</h2>
              </div>
              <button
                type="button"
                onClick={refreshOnboardingRequests}
                className="rounded-full bg-[#effff6] px-3 py-1.5 text-xs font-black text-[#21744f]"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {onboardingRequests.length ? (
                onboardingRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-3xl border-2 border-[#c9f0dc] bg-[#fbfffd] p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#58c785] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                        {request.status || "new"}
                      </span>
                      {request.pos_system ? (
                        <span className="rounded-full bg-[#fff1bf] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#7c5812]">
                          {request.pos_system}
                        </span>
                      ) : null}
                      {request.pricing_comfort ? (
                        <span className="rounded-full bg-[#e8f7ff] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#246d99]">
                          {request.pricing_comfort}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[#2b2235]">
                      {request.shop_name || request.business_type || "New DrinkFlow shop"}
                    </h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#7b5aa6]">
                      {formatDeveloperNoteDate(request.created_at)}
                    </p>
                    <div className="mt-2 space-y-1 text-sm font-semibold leading-6 text-[#66576f]">
                      {request.contact_name || request.email ? (
                        <p>
                          <strong>Contact:</strong>{" "}
                          {[request.contact_name, request.email].filter(Boolean).join(" - ")}
                        </p>
                      ) : null}
                      {request.business_type || request.location ? (
                        <p>
                          <strong>Shop:</strong>{" "}
                          {[request.business_type, request.location].filter(Boolean).join(" - ")}
                        </p>
                      ) : null}
                      {request.starter_theme ? (
                        <p>
                          <strong>Theme:</strong> {request.starter_theme}
                        </p>
                      ) : null}
                      {formatDeveloperList(request.screen_needs) ? (
                        <p>
                          <strong>Screens:</strong> {formatDeveloperList(request.screen_needs)}
                        </p>
                      ) : null}
                      {request.current_pain ? (
                        <p>
                          <strong>Pain point:</strong> {request.current_pain}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#c9f0dc] bg-[#fbfffd] p-5 text-sm font-black text-[#21744f]">
                  No setup requests yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_24px_70px_rgba(91,58,109,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#2b2235]">Recent diary entries</h2>
              <button
                type="button"
                onClick={refreshNotes}
                className="rounded-full bg-[#fff0f7] px-3 py-1.5 text-xs font-black text-[#ff4f8b]"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {notes.length ? (
                notes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-3xl border-2 border-[#f3c4df] bg-[#fffafd] p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#ff5c8a] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                        {note.project}
                      </span>
                      <span className="rounded-full bg-[#fff1bf] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#7c5812]">
                        {note.placement}
                      </span>
                      <span className="rounded-full bg-[#e8f7ff] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#246d99]">
                        {note.visibility}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[#2b2235]">{note.title}</h3>
                    {note.body ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#66576f]">
                        {note.body}
                      </p>
                    ) : null}
                    {note.suggestion ? (
                      <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-[#2b2235]">
                        {note.suggestion}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#9b86aa]">
                      <span>{formatDeveloperNoteDate(note.created_at)}</span>
                      {note.mood ? <span>{note.mood}</span> : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#f3c4df] bg-[#fffafd] p-6 text-center text-sm font-black text-[#9b86aa]">
                  No diary notes yet.
                </div>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default function GoldiesKDS() {
  if (isDeveloperDashboardRoute()) return <DeveloperDiaryDashboard />;
  if (isPolicyAcknowledgmentRoute()) return <PolicyAcknowledgmentPage />;
  if (isDemoOwnerRoute()) {
    return (
      <OwnerReportsView
        ownerName="Demo Owner"
        themeMode={getSavedThemeMode()}
        demoMode
        demoTickets={createTrainingTickets()}
        onClose={() => {
          window.location.href = "/?demo=training";
        }}
      />
    );
  }
  if (isOnlineOrderingBetaRoute()) return <OnlineOrderingBetaPage />;
  if (isSelfOrderKioskRoute()) return <OnlineOrderingBetaPage kioskMode />;

  const displayRoute = getDisplayRoute();
  if (displayRoute === "menu") return <MenuBoardDisplay />;
  if (displayRoute === "orders") return <OrdersUpDisplay />;
  if (displayRoute === "drive-thru") return <DriveThruDisplay />;
  if (displayRoute === "volume") return <VolumeBoardDisplay />;
  if (displayRoute === "online-orders") return <OnlineOrdersDisplay />;

  const {
    isFullscreen: isDashboardFullscreen,
    toggleFullscreen: toggleDashboardFullscreen,
  } = useFullscreenMode();
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
  const pendingTicketStatusesRef = useRef(new Map());
  const [drinkCounts, setDrinkCounts] = useState([]);
  const [drinkOrderCount, setDrinkOrderCount] = useState(0);
  const [drinkMakingTime, setDrinkMakingTime] = useState({
    label: "Collecting",
    sampleSize: 0,
  });
  const [drinkReports, setDrinkReports] = useState({});
  const [drinkTimeReports, setDrinkTimeReports] = useState({});
  const [showDrinkTimeStats, setShowDrinkTimeStats] = useState(false);
  const [showTicketColumns, setShowTicketColumns] = useState(true);
  const [showFocusBoard, setShowFocusBoard] = useState(false);
  const [showOpenTickets, setShowOpenTickets] = useState(false);
  const [showOnlineOrderAlertDetails, setShowOnlineOrderAlertDetails] = useState(false);
  const [showDiningOnTickets, setShowDiningOnTickets] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [showOwnerReports, setShowOwnerReports] = useState(false);
  const [signedInOwner, setSignedInOwner] = useState("");
  const [policyAcknowledgment, setPolicyAcknowledgment] = useState(readPolicyAcknowledgment);
  const [policyReminder, setPolicyReminder] = useState(readPolicyReminder);
  const [showPolicyAcknowledgment, setShowPolicyAcknowledgment] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [pitchHash, setPitchHash] = useState(() => {
    if (typeof window === "undefined") return "";

    return window.location.hash || "";
  });
  const [modeHelp, setModeHelp] = useState(null);
  const [settingsHelp, setSettingsHelp] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDisplaysMenu, setShowDisplaysMenu] = useState(false);
  const [hiddenCelebrationKey, setHiddenCelebrationKey] = useState(() => {
    if (typeof window === "undefined") return "";

    try {
      return window.localStorage.getItem(CELEBRATION_HIDE_KEY) || "";
    } catch {
      return "";
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
  const [connectionDetail, setConnectionDetail] = useState("Square API");
  const [showConnectionReport, setShowConnectionReport] = useState(false);
  const [connectionReport, setConnectionReport] = useState(null);
  const [connectionReportLoading, setConnectionReportLoading] = useState(false);
  const [connectionReportError, setConnectionReportError] = useState("");
  const [connectionBackfillLoading, setConnectionBackfillLoading] = useState(false);
  const [connectionBackfillResult, setConnectionBackfillResult] = useState("");
  const [lastError, setLastError] = useState("");
  const [systemNotice, setSystemNotice] = useState("");
  const [showSystemPopup, setShowSystemPopup] = useState(false);
  const [defaultLookupDate] = useState(() => getLocalDateInputValue());
  const dashboardReportPanel = getDashboardReportPanel();
  const isTodayCountWindow = dashboardReportPanel === "today-count";
  const isOrdersByDayWindow = dashboardReportPanel === "orders-by-day";
  const isStatsWindow = dashboardReportPanel === "stats";
  function resetDashboardViews() {
    setShowDrinkTimeStats(false);
    setShowTicketColumns(true);
    setShowFocusBoard(false);
    setShowOpenTickets(false);
    setShowReportsMenu(false);
    setShowSettingsMenu(false);
    setShowDisplaysMenu(false);
    setShowOwnerLogin(false);
    setShowOwnerReports(false);
    setSignedInOwner("");
    setShowPitch(false);
    setPitchHash("");
    setModeHelp(null);
    setSettingsHelp(null);
  }

  function openOwnerPortal() {
    setShowSettingsMenu(false);
    if (isDemoRoute || isTrainingMode) {
      setSignedInOwner(isDemoRoute ? "Demo Owner" : "Training Owner");
      setShowOwnerLogin(false);
      setShowOwnerReports(true);
      return;
    }

    setSignedInOwner("");
    setShowOwnerReports(false);
    setShowOwnerLogin(true);
  }

  const todayDateKey = getTodayDateKey();
  const scheduledCelebration = getScheduledCelebration(todayDateKey);
  const scheduledCelebrationKey = scheduledCelebration
    ? `${todayDateKey}:${scheduledCelebration.id}`
    : "";
  const dailyUpdateKey = `${todayDateKey}:daily-update:${DAILY_UPDATE_NOTICE.id}`;
  const showCelebrationNote =
    authStatus === "login" &&
    ((scheduledCelebration && hiddenCelebrationKey !== scheduledCelebrationKey) ||
      (!scheduledCelebration && hiddenCelebrationKey !== dailyUpdateKey));
  const loginCelebration = scheduledCelebration || DAILY_UPDATE_NOTICE;
  const loginCelebrationKey = scheduledCelebration ? scheduledCelebrationKey : dailyUpdateKey;
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

  async function fetchConnectionReport() {
    setConnectionReportLoading(true);
    setConnectionReportError("");
    try {
      const response = await fetch(apiUrl("/api/health"), {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Health check failed: ${response.status}`);
      setConnectionReport(data);
    } catch (error) {
      setConnectionReportError(error.message || "Connection report unavailable.");
    } finally {
      setConnectionReportLoading(false);
    }
  }

  async function runSquareHistoryBackfill() {
    setConnectionBackfillLoading(true);
    setConnectionBackfillResult("");
    setConnectionReportError("");
    try {
      const response = await fetch(apiUrl("/api/square-sync"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lookbackDays: 4 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Backfill failed: ${response.status}`);
      const summary = data.summary || {};
      setConnectionBackfillResult(
        `Backfill complete: ${summary.saved ?? data.saved ?? 0} orders checked, ${summary.created ?? 0} created, ${summary.updated ?? 0} refreshed, ${summary.failed ?? 0} failed.`
      );
      await fetchConnectionReport();
    } catch (error) {
      setConnectionReportError(error.message || "Square history backfill failed.");
    } finally {
      setConnectionBackfillLoading(false);
    }
  }

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
    setConnectionDetail("Practice data");
    setLastError("");
    setLastPoll(new Date());
  }, [isTrainingMode]);

  useEffect(() => {
    if (!isTrainingMode && authStatus === "authenticated") {
      setConnectionStatus("Connecting...");
      setConnectionDetail("Square API");
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
    if (authStatus !== "authenticated" || isDemoRoute || isTrainingMode) return;

    const record = readPolicyAcknowledgment();
    setPolicyAcknowledgment(record);
    if (!record) {
      setPolicyReminder(readPolicyReminder());
      setShowPolicyAcknowledgment(true);
    }
  }, [authStatus, isDemoRoute, isTrainingMode]);

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
        if (!session.authenticated) {
          resetDashboardViews();
        }
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
        const [ticketsResponse, drinkResponse, makingTimeResponse, healthResponse] = await Promise.all([
          fetch(apiUrl("/api/tickets"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/reports/drinks?range=today"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/reports/drink-making-time?range=today"), {
            credentials: "include",
          }),
          fetch(apiUrl("/api/health"), {
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

        const health = healthResponse.ok ? await healthResponse.json() : null;
        const squareApi = health?.squareApi || {};
        let currentSystemNotice = "";
        if (squareApi.online === false || squareApi.lastSyncError) {
          const notice =
            squareApi.lastSyncError ||
            squareApi.lastError ||
            "Square is not reporting healthy right now.";
          currentSystemNotice = `Square sync is being checked. The dashboard may show stored tickets while the connection catches up. Detail: ${notice}`;
          setSystemNotice(currentSystemNotice);
          setShowSystemPopup(true);
        } else {
          setSystemNotice("");
        }

        if (!ticketsResponse.ok) {
          let detail = "";
          try {
            const payload = await ticketsResponse.json();
            detail = payload?.error || "";
          } catch {
            detail = "";
          }
          setSystemNotice(
            `Ticket sync is having trouble. Keep taking orders in Square and use any tickets already visible here while we reconnect. ${detail ? `Detail: ${detail}` : ""}`
          );
          setShowSystemPopup(true);
          throw new Error(`Failed to fetch tickets: ${ticketsResponse.status}`);
        }

        const ticketFallback = ticketsResponse.headers.get("x-goldies-kds-fallback") || "";
        const nextConnectionDetail = ticketFallback ? "Stored tickets" : "Square API";
        const liveTickets = await ticketsResponse.json();
        const todayReport = drinkResponse.ok
          ? await drinkResponse.json()
          : { totalsByName: [], orderCount: 0 };
        const makingTimeReport = makingTimeResponse.ok
          ? await makingTimeResponse.json()
          : { label: "Collecting", sampleSize: 0 };

        if (!mounted) return;

        const now = Date.now();
        const pendingStatuses = pendingTicketStatusesRef.current;
        const normalizedTickets = liveTickets.map(normalizeTicket).map((ticket) => {
          const pending = pendingStatuses.get(ticket.id);
          if (!pending) return ticket;
          if (pending.expiresAt <= now) {
            pendingStatuses.delete(ticket.id);
            return ticket;
          }
          return {
            ...ticket,
            status: pending.status,
            updatedAt: pending.updatedAt,
            completedAt:
              pending.status === "completed" || pending.status === "done"
                ? pending.updatedAt
                : ticket.completedAt,
          };
        });

        setTickets(normalizedTickets);
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
        setConnectionStatus(currentSystemNotice ? "Checking Square" : "Connected");
        setConnectionDetail(nextConnectionDetail);
        setLastError("");
      } catch (error) {
        if (!mounted) return;

        setConnectionStatus("Offline");
        setConnectionDetail("Check connection");
        const message = error.message || "Unknown polling error";
        setLastError(message);
        if (message.includes("Failed to fetch tickets")) {
          setSystemNotice(
            "Ticket sync is temporarily unavailable. Square itself may still be taking orders. We are checking the Square connection and stored dashboard tickets."
          );
          setShowSystemPopup(true);
        }
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
    if (
      authStatus !== "authenticated" ||
      (!isStatsWindow && !showDrinkTimeStats) ||
      isTrainingMode
    )
      return undefined;

    let mounted = true;

    async function fetchDrinkReports() {
      const reports = {};
      const timeReports = {};

      await Promise.all(
        REPORT_RANGES.map(async (range) => {
          const [response, timeResponse] = await Promise.all([
            fetch(apiUrl(`/api/reports/drinks?range=${range.key}`), {
              credentials: "include",
            }),
            fetch(apiUrl(`/api/reports/drink-making-time?range=${range.key}`), {
              credentials: "include",
            }),
          ]);

          if (response.status === 401 || timeResponse.status === 401) {
            setAuthStatus("login");
            return;
          }

          if (!response.ok) {
            reports[range.key] = { totalsByName: [], totalsByCategory: {} };
          } else {
            reports[range.key] = await response.json();
          }

          timeReports[range.key] = timeResponse.ok
            ? await timeResponse.json()
            : { label: "Collecting", sampleSize: 0 };
        })
      );

      return { reports, timeReports };
    }

    async function refreshDrinkReports() {
      try {
        const { reports: liveReports, timeReports: liveTimeReports } =
          await fetchDrinkReports();

        if (!mounted) return;

        setDrinkReports(liveReports);
        setDrinkTimeReports(liveTimeReports);
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
  }, [authStatus, isStatsWindow, showDrinkTimeStats, isTrainingMode]);

  const displayedTickets = isTrainingMode ? trainingTickets : tickets;
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
  const displayedDrinkTimeReports = isTrainingMode
    ? {
        today: {
          label: "3m 12s",
          sampleSize: 4,
          byHour: [
            { hour: 9, hourLabel: "9 AM", label: "2m 48s", sampleSize: 2 },
            { hour: 10, hourLabel: "10 AM", label: "3m 36s", sampleSize: 2 },
          ],
          byDrinkName: [
            { name: "Latte", label: "3m 05s", sampleSize: 2 },
            { name: "Cold Brew", label: "2m 10s", sampleSize: 1 },
          ],
        },
      }
    : drinkTimeReports;
  const displayedConnectionStatus = isTrainingMode
    ? "Training mode"
    : connectionStatus;
  const displayedConnectionDetail = isTrainingMode ? "Practice data" : connectionDetail;
  const activeTickets = displayedTickets.filter(
    (ticket) =>
      ticket.status !== "done" &&
      ticket.status !== "completed" &&
      hasDrinkItems(ticket)
  );
  const pendingOnlineOrders = activeTickets
    .filter((ticket) => ticket.status === "new" && isOnlineTicket(ticket))
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
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
        ticket.id === id
          ? {
              ...ticket,
              status,
              updatedAt: Date.now(),
              completedAt:
                status === "completed" || status === "done" ? Date.now() : null,
            }
          : ticket
      )
    );
    pendingTicketStatusesRef.current.set(id, {
      status,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 15000,
    });

    fetch(apiUrl(`/api/tickets/${id}/status`), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setAuthStatus("login");
          throw new Error(data.error || "Login required");
        }

        if (!response.ok) {
          throw new Error(data.error || `Status update failed: ${response.status}`);
        }

        return data;
      })
      .then((data) => {
        pendingTicketStatusesRef.current.delete(id);
        if (data?.status) {
          setTickets((current) =>
            current.map((ticket) =>
              ticket.id === id
                ? {
                    ...ticket,
                    status: data.status,
                    updatedAt: Date.now(),
                    completedAt:
                      data.status === "completed" || data.status === "done"
                        ? Date.now()
                        : ticket.completedAt,
                  }
                : ticket
            )
          );
        }
      })
      .catch((error) => {
        pendingTicketStatusesRef.current.delete(id);
        setLastError(`Status update failed: ${error.message}`);
      });
  }

  function handleItemDoneChange(id, itemKey, done) {
    function updateTicketItems(ticket) {
      if (ticket.id !== id) return ticket;

      const nextItems = (ticket.items || []).map((item, index) =>
        getItemKey(item, index) === itemKey ? { ...item, done } : item
      );

      return {
        ...ticket,
        items: nextItems,
        status:
          ticket.status === "making" && areAllDrinkItemsDone(nextItems)
            ? "ready"
            : ticket.status,
      };
    }

    if (isTrainingMode) {
      setTrainingTickets((current) => current.map(updateTicketItems));
      return;
    }

    let shouldMoveReady = false;

    setTickets((current) =>
      current.map((ticket) => {
        const nextTicket = updateTicketItems(ticket);
        if (ticket.id === id && ticket.status !== nextTicket.status) {
          shouldMoveReady = true;
        }
        return nextTicket;
      })
    );

    fetch(apiUrl(`/api/tickets/${id}/items/${encodeURIComponent(itemKey)}/done`), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    })
      .then((response) => {
        if (response.status === 401) {
          setAuthStatus("login");
          throw new Error("Login required");
        }

        if (!response.ok) {
          throw new Error(`Item update failed: ${response.status}`);
        }

        if (shouldMoveReady) {
          handleStatusChange(id, "ready");
        }
      })
      .catch((error) => {
        setLastError(`Drink checkoff failed: ${error.message}`);
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

  async function handleDashboardFullscreen() {
    await toggleDashboardFullscreen();
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
    setDrinkCounts([]);
    setDrinkOrderCount(0);
    setDrinkReports({});
    setDrinkTimeReports({});
    setShowPasswordModal(false);
    setPasswordError("");
    setPasswordNotice("");
    resetDashboardViews();
    setAuthStatus("login");
    setSignedInEmployee("");
  }

  function handlePolicyRemindLater() {
    const reminder = {
      ...policyReminder,
      dismissed_timestamp: new Date().toISOString(),
      last_reminded_timestamp: new Date().toISOString(),
      reminder_count: Number(policyReminder?.reminder_count || 0) + 1,
      policy_version: POLICY_VERSION,
    };
    writePolicyReminder(reminder);
    setPolicyReminder(reminder);
    setShowPolicyAcknowledgment(false);
  }

  function handlePolicyRecorded(record) {
    const nextRecord = record || readPolicyAcknowledgment();
    setPolicyAcknowledgment(nextRecord);
    setShowPolicyAcknowledgment(false);
  }

  if (authStatus === "authenticated") {
    if (isTodayCountWindow) {
      return (
        <TodayCountReportWindow
          drinkCounts={displayedDrinkCounts}
          orderCount={displayedDrinkOrderCount}
        />
      );
    }

    if (isOrdersByDayWindow) {
      return (
        <OrdersByDayReportWindow
          defaultDate={defaultLookupDate}
          trainingMode={isTrainingMode}
          trainingTickets={isTrainingMode ? displayedTickets : []}
        />
      );
    }

    if (isStatsWindow) {
      return (
        <StatsReportWindow
          reports={displayedDrinkReports}
          timeReports={displayedDrinkTimeReports}
          onClose={() => window.close()}
        />
      );
    }
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
            resetDashboardViews();
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
          onOwnerLogin={openOwnerPortal}
          suggestFixHref={buildSupportMailto()}
          isTrainingMode={isTrainingMode}
          onVersionClickMenu={() => {
            setShowSettingsMenu(false);
            setShowReleaseNotes(true);
          }}
        />
        <CelebrationDialog
          open={showCelebrationNote}
          celebration={loginCelebration}
          onClose={() => setHiddenCelebrationKey(loginCelebrationKey)}
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
        onClick={() => {
          setShowSettingsMenu(false);
          setShowDisplaysMenu(false);
          setShowReportsMenu(false);
        }}
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
        {showSystemPopup && systemNotice && (
          <div className="fixed inset-x-4 top-4 z-[80] mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-[0_18px_55px_rgba(120,53,15,0.22)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Square connection notice
                </div>
                <div className="mt-1 text-sm font-bold leading-relaxed">
                  {systemNotice}
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowSystemPopup(false);
                }}
                className="rounded-xl bg-amber-700 px-3 py-2 text-sm font-black text-white transition hover:bg-amber-800"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      <div className="relative z-10">
      <header className="relative z-40 border-b border-white/70 bg-[rgba(255,253,248,0.9)] backdrop-blur-xl px-4 md:px-6 py-4 shadow-[0_12px_30px_rgba(15,64,54,0.06)]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandMark darkMode={themeMode === "dark"} demoMode={isDemoRoute} />

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#0F4036]">
                Kitchen Display
              </h1>

              <p className="text-[#6A614F] mt-1 text-sm md:text-base">
                {isDemoRoute ? "Demo orders" : "Live Square orders"}
              </p>

              {!isDashboardFullscreen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFocusBoard((current) => !current)}
                    className={`rounded-2xl border border-[#CA862B]/18 px-4 py-2 text-sm font-black transition shadow-sm ${
                      showFocusBoard
                        ? "bg-[#0F4036] text-white"
                        : "bg-white/80 text-[#0F4036] hover:bg-[#EEE0C5]/55"
                    }`}
                  >
                    {showFocusBoard ? "Full Dashboard" : "Focus Board"}
                  </button>

                  <div className="relative" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisplaysMenu(false);
                        setShowSettingsMenu(false);
                        setShowReportsMenu((current) => !current);
                      }}
                      className="rounded-2xl border border-[#CA862B]/18 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
                      aria-expanded={showReportsMenu}
                    >
                      View Stats
                    </button>

                    {showReportsMenu && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#CA862B]/22 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,64,54,0.16)]">
                        <button
                          type="button"
                          onClick={() => openDashboardReportWindow("today-count")}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Today&apos;s Drink Order Count
                        </button>
                        <button
                          type="button"
                          onClick={() => openDashboardReportWindow("orders-by-day")}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Look up orders by day
                        </button>
                        <button
                          type="button"
                          onClick={() => openDashboardReportWindow("stats")}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          View Stats
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowDisplaysMenu((current) => !current);
                      }}
                      className="rounded-2xl border border-[#CA862B]/18 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
                      aria-expanded={showDisplaysMenu}
                    >
                      Displays
                    </button>

                    {showDisplaysMenu && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#CA862B]/22 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,64,54,0.16)]">
                        <a
                          href={getDisplayHref("/goldies-menu", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Menu Board
                        </a>
                        <a
                          href={getDisplayHref("/orders-up", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Orders Up
                        </a>
                        <a
                          href={getDisplayHref("/drive-thru", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Drive Thru
                        </a>
                        <a
                          href={getDisplayHref("/volume-board", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Volume Board
                        </a>
                        <a
                          href={getDisplayHref("/online-orders", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Online Orders
                        </a>
                        <a
                          href={getDisplayHref("/self-order-kiosk", isDemoRoute)}
                          className="block rounded-xl px-3 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55"
                        >
                          Self Order Kiosk
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

            {!isDashboardFullscreen && (
            <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
              {isDemoRoute && (
                <a
                  href="https://drinkflowkds.com"
                  className="rounded-2xl border border-[#CA862B]/14 bg-white/80 px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/55 shadow-sm"
                >
                  Back to Learn More
                </a>
              )}

              <button
                type="button"
                onClick={openOwnerPortal}
                className="rounded-2xl border border-[#CA862B]/14 bg-[#0F4036] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#0b352d]"
              >
                {isTrainingMode ? "Training Owner Reports" : "Owner Reports"}
              </button>

            <div className="relative" onClick={(event) => event.stopPropagation()}>
                {isDemoRoute && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[#CA862B]/22 bg-white px-4 py-3 text-sm font-bold leading-5 text-[#0F4036] shadow-[0_18px_45px_rgba(15,64,54,0.16)]">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#CA862B]">
                      Demo tip
                    </div>
                    Click Training Owner Reports for the demo reports.
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-2xl border border-[#CA862B]/14 bg-white/75 px-1.5 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisplaysMenu(false);
                      setShowSettingsMenu((current) => !current);
                    }}
                    className="rounded-xl border border-[#0F4036]/16 bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
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
                  onOwnerLogin={openOwnerPortal}
                  ownerActionLabel={isDemoRoute || isTrainingMode ? "Training Owner Reports" : "Owner Reports"}
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
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-800 transition hover:bg-red-100 shadow-sm"
              >
                Sign out
              </button>
            </div>
            )}

            {signedInEmployee && (
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-[#CA862B]/18 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#0F4036] shadow-sm">
                  {signedInEmployee}
                </div>
                <button
                  type="button"
                  onClick={handleDashboardFullscreen}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition shadow-sm ${
                    isDashboardFullscreen
                      ? "border-[#0F4036]/16 bg-[#0F4036] text-white hover:bg-[#0b352d]"
                      : "border-[#CA862B]/18 bg-white/80 text-[#0F4036] hover:bg-[#EEE0C5]/55"
                  }`}
                  title={isDashboardFullscreen ? "Exit full screen" : "Enter full screen"}
                  aria-label={isDashboardFullscreen ? "Exit full screen" : "Enter full screen"}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none ${
                      isDashboardFullscreen
                        ? "border-white/35 bg-white/12 text-white"
                        : "border-[#CA862B]/20 bg-[#EEE0C5]/45 text-[#0F4036]"
                    }`}
                  >
                    {isDashboardFullscreen ? "–" : "+"}
                  </span>
                  <span>{isDashboardFullscreen ? "Exit full screen" : "Full screen"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`p-3 md:p-4 space-y-4 mx-auto ${showFocusBoard ? "max-w-none" : "max-w-[1900px]"}`}>
        {!showFocusBoard && (
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
                  {isTrainingMode ? "Demo data" : "Production"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModeHelp({
                    title: "Training mode",
                    body: "Training mode swaps in practice orders and sample counts. It does not change live Square data.",
                  })
                }
                title="Training mode swaps in practice orders and counts so staff can practice without changing live Square data."
                aria-label="Training mode swaps in practice orders and counts so staff can practice without changing live Square data."
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
            detail={displayedConnectionDetail}
            actionLabel="Open report"
            onClick={() => {
              setShowConnectionReport(true);
              fetchConnectionReport();
            }}
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
            onClick={() => setShowOpenTickets((current) => !current)}
            actionLabel={showOpenTickets ? "Hide open tickets" : "Show open tickets"}
          />

          <StatCard
            label="Avg Drink Time"
            value={displayedDrinkMakingTime.label}
            detail={
              displayedDrinkMakingTime.sampleSize
                ? `${displayedDrinkMakingTime.sampleSize} drink orders timed today`
                : "Starts after first ready drink"
            }
            onClick={() => setShowDrinkTimeStats((current) => !current)}
            actionLabel={showDrinkTimeStats ? "Hide timing report" : "Open timing report"}
          />
        </section>
        )}

        {!showFocusBoard && showDrinkTimeStats && (
          <DrinkTimeStatsPanel
            reports={displayedDrinkTimeReports}
            onClose={() => setShowDrinkTimeStats(false)}
          />
        )}

        {systemNotice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Square connection notice
            </div>
            <div className="mt-1 text-sm font-bold leading-relaxed">{systemNotice}</div>
          </div>
        )}

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

        {!showFocusBoard && <StaffToolsGuide demoMode={isDemoRoute} />}

        {!showFocusBoard && showOpenTickets && (
          <section className="space-y-2 rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Open Tickets</h2>
                <p className="text-sm text-[#6A614F]">Current open tickets across all active columns.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenTickets(false)}
                className="rounded-xl border border-[#CA862B]/22 bg-white px-4 py-2 text-sm font-black text-[#0F4036] transition hover:bg-[#EEE0C5]/45"
              >
                Hide
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeTickets.length ? (
                activeTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-[#CA862B]/14 bg-white p-3 shadow-sm">
                    <TicketCard
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                      onItemDoneChange={handleItemDoneChange}
                      onNameChange={handleNameChange}
                      onDiningOptionChange={handleDiningOptionChange}
                      showDiningOption={showDiningOnTickets}
                      compact={true}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CA862B]/22 bg-white/70 p-8 text-center text-[#6A614F] font-semibold">
                  No open tickets right now
                </div>
              )}
            </div>
          </section>
        )}

        {pendingOnlineOrders.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-[0_16px_40px_rgba(185,28,28,0.12)]">
            <button
              type="button"
              onClick={() => setShowOnlineOrderAlertDetails((current) => !current)}
              className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
                  Online pickup alert
                </div>
                <div className="mt-1 text-xl font-black text-red-900">
                  {pendingOnlineOrders.length} pending online {pendingOnlineOrders.length === 1 ? "order" : "orders"}
                </div>
              </div>
              <span className="rounded-xl bg-red-700 px-3 py-2 text-sm font-black text-white">
                {showOnlineOrderAlertDetails ? "Hide details" : "Show details"}
              </span>
            </button>

            {showOnlineOrderAlertDetails && (
              <div className="grid gap-2 border-t border-red-200 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
                {pendingOnlineOrders.map((ticket) => {
                  const drinkItems = getDrinkItems(ticket);
                  return (
                    <div key={ticket.id} className="rounded-xl border border-red-200 bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black text-red-900">
                            #{ticket.orderNumber}
                          </div>
                          <div className="text-sm font-bold text-red-700">
                            Placed {formatOrderTime(ticket.createdAt)}
                          </div>
                        </div>
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-800">
                          Online
                        </span>
                      </div>
                      {ticket.customerName ? (
                        <div className="mt-2 text-sm font-black text-[#111111]">
                          {ticket.customerName}
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-1.5">
                        {drinkItems.map((item, index) => (
                          <div key={`${ticket.id}-${item.name}-${index}`} className="rounded-lg bg-red-50 px-2.5 py-2 text-sm font-bold text-red-950">
                            {item.qty > 1 ? `${item.qty}x ` : ""}
                            {item.name}
                            {item.modifiers?.length || item.note ? (
                              <span className="block text-xs font-semibold text-red-700">
                                {[...(item.modifiers || []), item.note].filter(Boolean).join(", ")}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

          {!showFocusBoard && <CustomerInsightsPanel />}

          {!showFocusBoard && <MenuAvailabilityPanel demoMode={isDemoRoute || isTrainingMode} />}

        {!showFocusBoard && !showTicketColumns ? (
          <section className="rounded-2xl border border-white/70 bg-[rgba(255,253,248,0.9)] p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Ticket columns</h2>
                <p className="text-sm text-[#6A614F]">
                  New, making, and ready stay tucked away until you open them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketColumns(true)}
                className="rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
              >
                Open ticket columns
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-[rgba(255,253,248,0.9)] border border-white/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-[#0F4036]">Ticket columns</h2>
                <p className="text-sm text-[#6A614F]">
                  {showFocusBoard
                    ? "New and making tickets stay front and center during a rush."
                    : "New, making, and ready stay open by default. Collapse them here if you want a cleaner view."}
                </p>
              </div>
              {!showFocusBoard ? (
                <button
                  type="button"
                  onClick={() => setShowTicketColumns(false)}
                  className="rounded-xl bg-[#0F4036] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b352d]"
                >
                  Collapse ticket columns
                </button>
              ) : null}
            </div>

            <div className={`grid grid-cols-1 gap-3 ${
              showFocusBoard ? "md:grid-cols-2" : "xl:grid-cols-3"
            }`}>
              {(showFocusBoard ? FOCUS_STATUS_COLUMNS : STATUS_COLUMNS).map((column) => (
                <section
                  key={column.key}
                  className={`rounded-2xl bg-white border border-[#CA862B]/12 border-t-4 ${column.accent} p-3 shadow-[0_16px_40px_rgba(15,64,54,0.08)] flex flex-col ${
                    showFocusBoard
                      ? "min-h-[calc(100vh-170px)] max-h-[calc(100vh-150px)]"
                      : hasOpenTickets
                        ? "xl:min-h-[520px]"
                        : "xl:min-h-[220px]"
                  }`}
                >
                  <div className={`flex items-center justify-between px-1 py-1.5 mb-2 shrink-0 ${
                    showFocusBoard ? "sticky top-0 z-10 rounded-xl bg-[#FFFDF8]/95 backdrop-blur" : ""
                  }`}>
                    <h2 className="text-lg xl:text-xl font-black text-[#111111]">
                      {column.label}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black shadow-sm ${column.badge}`}
                    >
                      {grouped[column.key]?.length || 0}
                    </span>
                  </div>

                  <div className={`min-h-0 ${
                    showFocusBoard ? "space-y-2 overflow-y-auto pr-1" : "space-y-3 xl:pr-1"
                  }`}>
                    {grouped[column.key]?.length ? (
                      grouped[column.key].map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onStatusChange={handleStatusChange}
                          onItemDoneChange={handleItemDoneChange}
                          onNameChange={handleNameChange}
                          onDiningOptionChange={handleDiningOptionChange}
                          showDiningOption={showDiningOnTickets}
                          compact={showFocusBoard}
                          focusMode={showFocusBoard}
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
            </div>
          </section>
        )}

        {!showFocusBoard && null}
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
      <PolicyAcknowledgmentDialog
        open={
          authStatus === "authenticated" &&
          !isDemoRoute &&
          !isTrainingMode &&
          showPolicyAcknowledgment &&
          !policyAcknowledgment
        }
        ownerName={signedInEmployee || "Goldie's"}
        onRecorded={handlePolicyRecorded}
        onRemindLater={handlePolicyRemindLater}
      />
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
      <ConnectionReportDialog
        open={showConnectionReport}
        report={connectionReport}
        loading={connectionReportLoading}
        error={connectionReportError}
        backfillLoading={connectionBackfillLoading}
        backfillResult={connectionBackfillResult}
        onBackfill={runSquareHistoryBackfill}
        onClose={() => setShowConnectionReport(false)}
        onRefresh={fetchConnectionReport}
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
          demoMode={isDemoRoute || isTrainingMode}
          demoTickets={trainingTickets}
          onClose={() => {
            setSignedInOwner("");
            setShowOwnerReports(false);
          }}
        />
      )}
    </>
  );
}
