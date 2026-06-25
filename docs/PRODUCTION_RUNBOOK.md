# Goldie's Production Runbook

## What Runs Automatically

- GitHub Actions runs `.github/workflows/goldies-system-check.yml` every 5 minutes.
- The check verifies public health, staff login, active tickets, daily reports, display boards, staff SOP access, and kiosk menu images.
- If the first check fails, GitHub waits 60 seconds and retries.
- If the retry also fails, GitHub can trigger a safe Render redeploy when `GOLDIES_RENDER_DEPLOY_HOOK_URL` is set as a repository secret.
- The workflow still fails after repeated failure so GitHub sends a failure alert instead of hiding the incident.
- GitHub Actions runs `.github/workflows/goldies-nightly-backup.yml` every night after close.
- The nightly backup exports production KDS health, reports, recent daily tickets, menu availability, and display board data as a downloadable GitHub artifact.
- Backups are retained in GitHub Actions for 30 days and do not require a laptop to be on.

## Required GitHub Secrets

- `GOLDIES_KDS_PASSWORD`: the staff KDS password for authenticated checks.
- `GOLDIES_RENDER_DEPLOY_HOOK_URL`: the Render deploy hook URL for safe redeploy recovery.

## Manual Backup

- Go to GitHub Actions.
- Open `Goldie's Nightly Backup`.
- Choose `Run workflow`.
- Leave `days` at `14` for a normal backup, or enter up to `31` when you want a larger recent history export.
- Download the finished backup from the workflow run's artifacts.

## What Not To Automate

- Do not automatically change production code.
- Do not automatically change Square credentials, Supabase credentials, passwords, or OAuth settings.
- Do not automatically run database migrations.

Those changes need a human review because they can affect live orders, payments, or data.
