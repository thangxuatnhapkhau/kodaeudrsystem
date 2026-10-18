# P2 Deployment Guide — KODA EUDR Workspace

## 1. Deployment Scope

P2 is a **100% frontend static asset upgrade** (`public/index.html`, `public/app.js`, `public/geo.js`, `public/pdf-preview.mjs`, `public/i18n.js`, `public/style.css`).
- **Apps Script Web App Deployment Required?**: **No** (no backend Apps Script files were modified by P2).
- **Google Sheets Schema Migration Required?**: **No** (no sheet columns or tables were added or altered by P2).
- **Netlify Environment Variable Changes Required?**: **No**.

## 2. Staging / Preview Deployment Steps

1. Push the isolated branch `feature/eudr-p2-ux-navigation` to GitHub:
   ```bash
   git push -u origin feature/eudr-p2-ux-navigation
   ```
2. Open a Pull Request on GitHub from `feature/eudr-p2-ux-navigation` (do **not** merge into `main` until staging UAT and P0/P1 integration sign-off are complete).
3. Netlify automatically builds a **Deploy Preview** URL for the Pull Request.
4. Execute `docs/p2/P2_UAT_CHECKLIST.md` against the Netlify Deploy Preview URL.

## 3. Production Release (After Explicit Approval Only)

1. Verify `npm run check && npm test` passes 100% (222/222 tests).
2. Merge the approved PR into `main`.
3. Verify Netlify production deploy completes and asset cache-busting query strings (`?v=2.9.6`) serve the updated `style.css`, `geo.css`, `i18n.js`, `geo.js`, and `app.js`.
