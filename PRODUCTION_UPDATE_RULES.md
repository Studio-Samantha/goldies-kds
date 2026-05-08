# Goldie's Production Update Rules

Goldie's is a live production app. For every customer-facing, staff-facing, owner-facing, or operational production change:

- Update the visible app version in `my-menu-app/src/App.jsx`.
- Add a release note that explains the user-facing change in plain language.
- Update owner/dashboard notes when the owner or staff should know about the change.
- Update the live Goldie's case study in `my-menu-app/public/case-study-goldies.html` when the change reflects the product story or live shop workflow.
- Track downtime and recovery through periodic system checks. Use `GOLDIES_TRACK_UPTIME=1 bash scripts/system_check.sh` so outages and recovery duration are written to the local Goldie's KDS health log.
- Do not add fake owner context. Weather, local events, and local demand notes need an explicit data source before they appear as live production signals. Approved local-event source categories include Exira Public Library, Exira Community Club, Exira Community Center events and rentals, City of Exira public updates, TJ's Pourhouse events, local business-hosted events such as chiropractor/yoga-in-the-park events, civic groups such as Lions Club and Masons, churches, and other local event listings. Use this context to help owners anticipate traffic, staffing, prep, and specials.
- Keep OAuth work paused until the user explicitly resumes it.
- Keep Goldie's work separate from Zahra's game project.
- Run at least `node --check server.js` and the frontend build before deploy when the change touches production behavior or UI.
