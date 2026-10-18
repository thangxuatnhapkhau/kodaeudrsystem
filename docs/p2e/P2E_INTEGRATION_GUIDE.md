# P2-E — Parallel Workstream Integration Guide (`P0` / `P1` / `P2-A..D` / `P2-E`)

## 1. Branch & Baseline Topology

- **Verified Baseline Commit (`P2-A/B/C/D`)**: `529aa4b13526a404f439df8ec64af1f437cbfd60` (`feature/eudr-p2-ux-navigation`)
- **P2-E Feature Branch**: `feature/eudr-p2e-geolocation`
- **Isolation Strategy**:
  - 95% of P2-E logic and styles are encapsulated in `public/geo.js` (`window.EudrGeo`) and `public/geo.css`.
  - `public/app.js` has only a 28-line localized context adapter update in `geoDialog()` and `reviewGeoDialog()`.
  - Zero changes were made to `apps_script/*.gs`, `netlify/functions/*`, or P0/P1 supplier identity files.

---

## 2. Shared-File Ownership Matrix

| File Path | Workstream Ownership | P2-E Scope of Change | Merge Conflict Risk |
|---|---|---|---|
| `public/geo.js` | **P2-E Primary** | Complete 4-tab Geolocation Workspace implementation (`window.EudrGeo`) | **Low** (untouched by P0/P1; lightly wrapped by P2-A/D) |
| `public/geo.css` | **P2-E Primary** | Complete stylesheet for 4-tab Geolocation Workspace, split-view Map/Inspector, and CSP utility classes | **Low** (untouched by P0/P1/P2-A..D) |
| `public/app.js` | Shared (`P0/P1`, `P2-A..D`, `P2-E`) | Only `geoDialog()` and `reviewGeoDialog()` updated to pass `productId`, `sourceId`, `chainNodeId`, `initialTab`, `initialPlotId`, `ops: EudrOps`, and `nav: EudrNav` | **Low** (localized to lines ~2705–2755) |
| `public/i18n.js` | Shared (`P2-A..D`, `P2-E`) | Additive `geo_*` translation keys in `en` and `vi` dictionaries | **Low** (append-only keys) |
| `tests/p2e-geolocation.test.mjs` | **P2-E Exclusive** | New automated test file for `GEO-M/U/R/V/N/L` | **None** |
| `docs/p2e/*.md` | **P2-E Exclusive** | 12 P2-E architecture, workflow, security, and release documents | **None** |

---

## 3. Step-by-Step Merge Procedure

1. **Verify Baseline & Workstream Status**:
   ```powershell
   git fetch --all
   git status
   ```
2. **Merge `feature/eudr-p2-ux-navigation` (if updated) into `feature/eudr-p2e-geolocation`**:
   - Ensure `EudrNav` and `EudrOps` globals in `public/app.js` remain intact.
   - Verify `geoDialog` and `reviewGeoDialog` pass `ops: EudrOps` and `nav: EudrNav` into `window.EudrGeo.open(...)`.
3. **Integrate with `P0` / `P1` (Supplier Identity & Directory) when ready**:
   - Confirm that `chain_nodes` and `sources` fields (`chain_node_id`, `supplier_name`, `source_id`, `po_number`) remain backward-compatible.
   - Do **not** overwrite any P0/P1 supplier resolution logic in `apps_script/` or `public/app.js`.
4. **Run Combined Verification**:
   ```powershell
   npm run check
   npm test
   ```
   All baseline, P0/P1, P2-A..D, and P2-E tests (`228+` tests) must pass before opening a release PR.
