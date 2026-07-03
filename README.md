# Charlie Blaze — Certificate of Taste Analysis

Live cannabis DNA profile. Reads the Purchases tab (fed by the Dutchie
receipt auto-sync) via Apps Script JSON endpoint.

## Wire the live data
1. Paste `apps-script/cb-live-endpoint.gs` into the Sheet's Apps Script (below the v2 logger)
2. Deploy > New deployment > Web app (Execute as Me, access: Anyone with link)
3. Put the /exec URL into `APPS_SCRIPT_URL` in `src/App.jsx`
4. Redeploy on Vercel

Badge shows ● LIVE when reading the Sheet, OFFLINE SNAPSHOT on fallback.

Find Your Fire 🔥
