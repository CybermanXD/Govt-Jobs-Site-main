# GovJob India Cloudflare frontend

The `public/` folder contains the site. A Cloudflare Worker serves the built files through its `ASSETS` binding and proxies `/api/*` to Apps Script.

## Cloudflare Workers Builds

- Root directory: `cloudflare`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Runtime secret: `APPS_SCRIPT_API_URL`

Set `APPS_SCRIPT_API_URL` as an encrypted Worker secret in Cloudflare; do not commit its value. For a CLI-managed Worker, it can be set with `npx wrangler secret put APPS_SCRIPT_API_URL`.

For local development, copy `.env.example` to `.dev.vars`, install dependencies, then run `npm run dev`. Run `npm run check` to build the frontend, check the Worker syntax, and perform a dry-run bundle. Run `npm run deploy` for a manual deployment.
