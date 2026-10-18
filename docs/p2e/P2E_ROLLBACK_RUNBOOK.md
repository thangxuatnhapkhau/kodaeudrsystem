# P2-E — Rollback Runbook

## 1. Rollback Triggers

Initiate an immediate rollback of P2-E if any of the following occur in staging or production:
1. Users cannot open the Geolocation modal or render stored `orderPlots` on the Leaflet map.
2. Valid GeoJSON files (`<= 2 MB`, `<= 100` features, `<= 10,000` positions) fail to upload via `uploadEvidence`.
3. Valid `Point` (`<= 4 ha`) or single-ring `Polygon` (`<= 2,000` positions) plots fail to register via `registerPlot`.
4. `COMPLIANCE` / `ADMIN` users cannot submit `reviewGeo` (`VERIFIED`, `REJECTED`, `MORE_INFO_REQUIRED`).
5. Content Security Policy (`CSP`) violation errors appear in the browser console when opening or interacting with the Geolocation Workspace.

---

## 2. Zero-Downtime Rollback Procedure

Because P2-E introduces **zero** backend (`apps_script/*.gs`) or Google Sheets schema modifications, rollback is purely a frontend revert and does not require any database migration rollback.

### Option A — Instant Netlify Rollback (< 1 minute)
1. Open the Netlify site dashboard (`koda-eudr-system`).
2. Navigate to **Deploys**.
3. Select the previous known-good deploy (`529aa4b13526a404f439df8ec64af1f437cbfd60` or the prior production release).
4. Click **Publish deploy**.

### Option B — Git Revert on Release Branch
1. Revert the P2-E merge commit or restore the 4 modified frontend files to baseline commit `529aa4b13526a404f439df8ec64af1f437cbfd60`:
   ```powershell
   git checkout 529aa4b13526a404f439df8ec64af1f437cbfd60 -- public/geo.js public/geo.css public/app.js public/i18n.js
   git commit -m "Revert P2-E Geolocation Workspace upgrade to P2-A/B/C/D baseline"
   git push
   ```
2. Verify `npm run check && npm test` passes after revert.

---

## 3. Post-Rollback Data Integrity Verification

- All plots registered during P2-E operation use the identical `Plots` and `Source_Plot_Shares` table schema and remain 100% readable by the pre-P2-E `public/geo.js` viewer.
- All GeoJSON evidence documents uploaded during P2-E operation use the identical `Documents` table schema and remain accessible in the Evidence Viewer.
