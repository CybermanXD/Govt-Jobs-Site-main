# GovJob India

GovJob India is a government-jobs portal with a Google Apps Script scraping/API backend, Google Sheets persistence, and a static frontend on Cloudflare Pages.

## Live site and public API

- **Live site:** [https://govjob-india.pages.dev/](https://govjob-india.pages.dev/)
- **API health:** [https://govjob-india.pages.dev/api/health](https://govjob-india.pages.dev/api/health)
- **Jobs:** [https://govjob-india.pages.dev/api/jobs?offset=0&limit=50](https://govjob-india.pages.dev/api/jobs?offset=0&limit=50)
- **Jobs snapshot:** [https://govjob-india.pages.dev/api/snapshot](https://govjob-india.pages.dev/api/snapshot)

These public Cloudflare proxy URLs are the supported API entry points. The private Apps Script upstream URL is intentionally not published.

## Architecture

1. Time-driven Apps Script triggers scrape all configured listing pages in batches.
2. Normalized jobs and structured details are stored in Google Sheets.
3. The Apps Script Web App exposes read-only JSON actions.
4. A Cloudflare Pages Function proxies same-origin `/api/*` requests to Apps Script while Pages serves the static assets.
5. The static frontend uses only the Cloudflare API routes.

## Structure

- `apps-script/` — Apps Script scraper, Sheets repository, triggers, and JSON API.
- `cloudflare/public/` — static frontend.
- `cloudflare/functions/api/[[path]].js` — Pages Function for the API proxy.
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

1. In Cloudflare **Workers & Pages**, create a **Pages** application and connect this Git repository.
2. Select `main` as the production branch.
3. Set the project name to `govjob-india`. This name controls the default `project.pages.dev` hostname (`govjob-india.pages.dev`). If unavailable, choose another neutral project name or use a custom domain so the public URL does not contain an account/person name.
4. Set framework preset **None**, root directory `cloudflare`, build command `npm run build`, and output directory `dist`.
5. Leave the deploy command blank. Cloudflare Pages deploys `dist` automatically after the build.
6. In **Settings** > **Environment variables**, add encrypted `APPS_SCRIPT_API_URL` with the Apps Script `/exec` deployment URL. Add it separately to Production and Preview as needed; never put the real URL in tracked files.
7. Deploy and verify the assigned hostname ends with `.pages.dev`, then test `/api/health`.

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
# GovJob India

GovJob India provides a Cloudflare-hosted job website and a native Android client. Android source, architecture, setup, offline-cache details, and release instructions are documented in [`android-app/README.md`](android-app/README.md).
