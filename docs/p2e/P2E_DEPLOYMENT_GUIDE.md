# P2-E — Staging & Production Deployment Guide

> [!IMPORTANT]
> Do **not** deploy to production without separate, explicit release approval after staging UAT sign-off.

## 1. Deployment Scope

P2-E is a **frontend-only** upgrade (`public/geo.js`, `public/geo.css`, `public/app.js`, `public/i18n.js`).
- **Apps Script (`apps_script/*.gs`)**: No backend changes or re-deployments are required (`listPlots`, `registerPlot`, `reviewGeo`, `uploadEvidence`, `linkPlotToSource` contracts are unchanged).
- **Google Sheets Schema**: No database migrations or column changes are required.
- **Netlify Functions (`netlify/functions/api.mjs`)**: No proxy changes are required.

---

## 2. Pre-Deployment Verification

Run the complete local verification pipeline before pushing or deploying:

```powershell
npm run check
npm test
```

Expected output:
- `npm run check`: `0` syntax errors.
- `npm test`: `228 / 228` tests passing (`0` failures).

---

## 3. Staging Deployment Steps (Netlify Branch Deploy / Preview)

1. Push `feature/eudr-p2e-geolocation` to GitHub:
   ```powershell
   git push -u origin feature/eudr-p2e-geolocation
   ```
2. Open the Netlify dashboard for `koda-eudr-system` and locate the **Deploy Preview** / **Branch Deploy** for `feature/eudr-p2e-geolocation`.
3. Execute the [P2E_UAT_CHECKLIST.md](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/kodaeudrsystem/docs/p2e/P2E_UAT_CHECKLIST.md) against the staging preview URL.

---

## 4. Production Promotion (After Explicit Approval Only)

1. Merge `feature/eudr-p2e-geolocation` into the release branch via reviewed Pull Request.
2. Verify Netlify production build logs and confirm CSP headers (`Content-Security-Policy`) in `netlify.toml` remain unchanged.
3. Perform post-deploy smoke test:
   - Open an order in `https://koda-eudr-system.netlify.app/`.
   - Launch **Geolocation Workspace** (`MAP`, `UPLOAD`, `REGISTER`, `REVIEW`).
   - Verify map tiles, plot selection, plot inspector fields, and `← Back to Order` navigation.
