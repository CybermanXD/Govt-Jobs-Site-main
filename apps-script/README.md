# GovJob India Apps Script backend

Only two files need to be copied into the Apps Script editor:

1. `Code.gs` — complete scraper, Sheets repository, triggers, parsers, and JSON API.
2. `appsscript.json` — project manifest.

## Deployment

1. Install dependencies with `npm install`.
2. Authenticate with `npm run login`.
3. Create or connect a standalone Apps Script project. If creating one, run `npm run create`.
4. Copy `.claspignore.example` to `.claspignore`.
5. In Apps Script Project Settings, add Script Property `SPREADSHEET_ID`.
6. Push with `npm run push`.
7. Run `setupProject()` in the editor once and authorize it.
8. Deploy as Web App: execute as the deploying user and allow anonymous access.

The setup function creates Sheet tabs, headers, source definitions, and scheduled triggers.
