# GovJob India Cloudflare frontend

The `public/` folder contains the static site. Cloudflare Pages publishes the built `dist/` directory, and the Pages Function in `functions/api/[[path]].js` proxies `/api/*` to Apps Script.

## Cloudflare Pages Git deployment

1. In **Workers & Pages**, choose **Create application** > **Pages** > **Connect to Git**.
2. Select this repository and the `main` production branch.
3. Set the **Project name** to `govjob-india`. The project name controls the default hostname, so this produces `govjob-india.pages.dev` rather than an account or person's name. If that name is unavailable, select another neutral project name or attach a custom domain.
4. Configure the build:
   - Framework preset: **None**
   - Root directory: `cloudflare`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Deploy command: leave blank; Pages deploys the output automatically.
5. Under **Settings** > **Environment variables**, add encrypted variable `APPS_SCRIPT_API_URL` for Production (and Preview if preview deployments should use the API). Its value is the Apps Script Web App `/exec` URL.
6. Save and deploy. Confirm the deployment URL ends in `.pages.dev`, and test `/api/health`.

Never commit the actual Apps Script URL. `APPS_SCRIPT_API_URL` is read by the Pages Function at runtime.

For local development, copy `.env.example` to `.dev.vars`, install dependencies, then run `npm run dev`. Run `npm run check` to check the Pages Function syntax and build the frontend. Git integration handles production deployment; do not configure a deploy command in the Pages dashboard.
