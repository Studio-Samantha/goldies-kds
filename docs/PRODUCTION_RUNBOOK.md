# Goldie's Production Runbook

## What Runs Automatically

- GitHub Actions runs `.github/workflows/goldies-system-check.yml` every 5 minutes.
- The check verifies public health, staff login, active tickets, daily reports, display boards, staff SOP access, and kiosk menu images.
- If the first check fails, GitHub waits 60 seconds and retries.
- If the retry also fails, GitHub can trigger a safe Render redeploy when `GOLDIES_RENDER_DEPLOY_HOOK_URL` is set as a repository secret.
- The workflow still fails after repeated failure so GitHub sends a failure alert instead of hiding the incident.

## Required GitHub Secrets

- `GOLDIES_KDS_PASSWORD`: the staff KDS password for authenticated checks.
- `GOLDIES_RENDER_DEPLOY_HOOK_URL`: the Render deploy hook URL for safe redeploy recovery.

## What Not To Automate

- Do not automatically change production code.
- Do not automatically change Square credentials, Supabase credentials, passwords, or OAuth settings.
- Do not automatically run database migrations.

Those changes need a human review because they can affect live orders, payments, or data.
