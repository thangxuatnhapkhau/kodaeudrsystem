# P2 Integration Guide with P0 & P1 Workstreams

## 1. Parallel Workstream Boundaries

| Workstream | Scope | Owned / Modified Files |
|---|---|---|
| **P0** | Supplier Identity Resolution Engine | Apps Script supplier matching engine, canonical ID resolution, backend normalization tables. |
| **P1** | Supplier Directory, Aliases, Matching Review & Controlled Merge | Supplier directory backend actions, alias/merge tables, supplier management review UI. |
| **P2** (`feature/eudr-p2-ux-navigation`) | Context-Aware Navigation, Categorized Sidebar, Actionable Dashboard KPIs, Global Loading & Operation Status Center | `public/index.html`, `public/app.js`, `public/geo.js`, `public/pdf-preview.mjs`, `public/i18n.js`, `public/style.css`, `tests/p2-ux-navigation.test.mjs`. |

## 2. Shared-File Ownership & Merge Strategy

1. **Zero Backend Overlap**: P2 makes **zero** modifications to `apps-script/*`, `netlify/functions/*`, or Google Sheets migration scripts. All P0/P1 backend changes merge cleanly without conflict.
2. **Frontend Shared Files (`public/app.js`, `public/i18n.js`, `public/style.css`)**:
   - In `public/app.js`, P2 encapsulates navigation state in `window.EudrNav` and operation tracking in `window.EudrOps` at the top of the file, and leaves `suppliers()` / `supplierForm()` (lines 989–991) untouched at their baseline definitions.
   - If P1 replaces or extends `suppliers()` / `supplierForm()` or adds a dedicated `public/supplier-directory.js` module, keep P1's `suppliers()` implementation and wire any new P1 drawer views to `EudrNav.openViewer()` if nested viewer history is desired.
   - In `public/i18n.js` and `public/style.css`, P2 appends its blocks at the end of the file so P0/P1 additions can be combined additively without overwriting either workstream.

## 3. Pre-Release Combined Verification Protocol

Before merging the combined P0 + P1 + P2 integration branch into `main`:
1. Merge `feature/eudr-p2-ux-navigation` into the staging integration branch alongside P0/P1.
2. Run `npm run check` and `npm test` (verifying all P0, P1, P2, and legacy v2.0–v2.9.5 tests pass together).
3. Execute the Staging UAT Checklist (`docs/p2/P2_UAT_CHECKLIST.md`).
