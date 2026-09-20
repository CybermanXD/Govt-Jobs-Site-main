# GovJob India

GovJob India is a government-jobs portal with a Google Apps Script scraping/API backend, Google Sheets persistence, and a Cloudflare Worker serving a static frontend.

## Architecture

1. Time-driven Apps Script triggers scrape all configured listing pages in batches.
2. Normalized jobs and structured details are stored in Google Sheets.
3. The Apps Script Web App exposes read-only JSON actions.
4. A Cloudflare Worker proxies same-origin `/api/*` requests to Apps Script and serves static assets.
5. The static frontend uses only the Cloudflare API routes.

## Structure

- `apps-script/` — Apps Script scraper, Sheets repository, triggers, and JSON API.
- `cloudflare/public/` — static frontend.
- `cloudflare/src/index.js` — Worker entry module and API proxy.
- `.old/` — ignored snapshot of the previous Flask/Supabase implementation.

## Backend setup

1. Create a blank Google Spreadsheet.
2. Create a standalone Apps Script project.
3. Copy `apps-script/Code.gs` and `apps-script/appsscript.json` into it (or use clasp).
4. Set Script Property `SPREADSHEET_ID` to the spreadsheet ID.
5. Run `setupProject()` once and authorize access.
6. Deploy as a Web App, executing as you and accessible to anyone.
7. Run `runListingBatch()` manually once; triggers continue automatically.

Apps Script actions:

- `?action=jobs&offset=0&limit=50`
- `?action=snapshot`
- `?action=details_snapshot`
- `?action=job_details&id=...` or `&url=...`
- `?action=meta`
- `?action=health`

## Cloudflare setup

1. Create a Cloudflare Workers Builds project connected to the repository, with root directory `cloudflare`.
2. Build command: `npm run build`.
3. Deploy command: `npx wrangler deploy`.
4. Add the encrypted runtime secret `APPS_SCRIPT_API_URL` containing the Apps Script `/exec` deployment URL.
5. Deploy the Worker. The `ASSETS` binding uploads `dist` and the Worker handles the existing `/api/*` routes.

For a CLI-managed deployment, set the secret without putting its value in a tracked file:

```bash
cd cloudflare
npx wrangler secret put APPS_SCRIPT_API_URL
npm run deploy
```

Local frontend development:

```bash
cd cloudflare
npm install
npm run dev
```

Create `cloudflare/.dev.vars` locally:

```text
APPS_SCRIPT_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

## Trigger schedule

- Listing batches: every 10 minutes.
- Detail batches: every 10 minutes.
- Cleanup and cache rebuild: daily.

The source cursor allows full coverage across multiple Apps Script executions without exceeding runtime quotas.
