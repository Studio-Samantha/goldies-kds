# Goldie's Production Update Rules

Goldie's is a live production app. For every customer-facing, staff-facing, owner-facing, or operational production change:

- Update the visible app version in `my-menu-app/src/App.jsx`.
- Add a release note that explains the user-facing change in plain language.
- Update owner/dashboard notes when the owner or staff should know about the change.
- Update the live Goldie's case study in `my-menu-app/public/case-study-goldies.html` when the change reflects the product story or live shop workflow.
- Keep OAuth work paused until the user explicitly resumes it.
- Keep Goldie's work separate from Zahra's game project.
- Run at least `node --check server.js` and the frontend build before deploy when the change touches production behavior or UI.
