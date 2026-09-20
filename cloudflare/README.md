# GovJob India Cloudflare frontend

The `public/` folder contains the site. The catch-all Pages Function proxies `/api/*` to Apps Script.

## Cloudflare Pages

- Root directory: `cloudflare`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `APPS_SCRIPT_API_URL`

For local Pages development, copy `.env.example` to `.dev.vars`, install dependencies, build, then run `npm run dev`.
