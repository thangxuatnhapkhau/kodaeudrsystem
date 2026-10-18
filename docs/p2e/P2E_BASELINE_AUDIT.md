# KODA EUDR WORKSPACE — P2-E BASELINE AUDIT
## Geolocation Workspace UX & Plot Traceability Upgrade

- **Workstream**: P2-E — Geolocation Workspace UX & Plot Traceability Upgrade
- **Feature Branch**: `feature/eudr-p2e-geolocation`
- **Verified Parent Baseline Commit**: `529aa4b13526a404f439df8ec64af1f437cbfd60` (`feature/eudr-p2-ux-navigation`)
- **Production Baseline Commit**: `d2d6ef63c01bd1e59ab89cf0701606506526d02f` (`main`)
- **Audit Date**: 2026-10-18

---

## 1. Baseline Inspection Summary

### 1.1 Existing Frontend Geolocation Implementation (`public/geo.js`, `public/geo.css`)
- **`window.EudrGeo` API**:
  - `open({state, materialId, call, drawer, refresh, onDocument, onReview})`
  - `close()`
  - `parse(text)`
  - `candidate(feature, confirmed)`
  - `checkGeometry(geometry)`
  - `getSavedView(materialId)` / `clearSavedViews()`
- **Baseline Capabilities Verified**:
  - Self-hosted Leaflet (`public/vendor/leaflet/leaflet.js` v1.9.4) with HTTPS OpenStreetMap tiles (`public/map-config.js`).
  - Client-side parsing limits enforced: `MAX_BYTES = 2,000,000` (2 MB), `MAX_FEATURES = 100`, `MAX_POSITIONS = 10,000`.
  - Geometry validation (`checkGeometry`) enforcing `Point` or single-ring `Polygon` (`<= 2,000` positions, closed ring, no duplicate vertices, non-zero area, no antimeridian jump `> 180°`, no self-intersection).
  - Closed `LineString` conversion to `Polygon` only after explicit user confirmation (`#geoLineConfirm`) while preserving original GeoJSON bytes.
  - Evidence upload to `04_Geolocation` tasks via `uploadEvidence` and `addScopedRequirement`.
  - Plot registration via `saveGeo(caseId, input)`.
  - Plot verification via `reviewGeo(geoId, {status, notes})`.
  - Case-level GeoJSON export via `exportGeoJSON(caseId)` (hidden/blocked for `SUPPLIER_USER`).

### 1.2 Baseline UX & Workflow Gaps Identified
1. **Single-Scroll Stacked Drawer**: Map viewer, GeoJSON upload, plot registration form, and registered plot list were stacked in a single vertical drawer without clear step separation, causing users to miss the distinction between local preview, original evidence upload, plot registration, and human GEO review.
2. **Incomplete Traceability Context Header**: Opening the Geolocation drawer only showed `Material · Plot map`, omitting the active `Sales Order`, `Product`, `Source PO / Lot`, and `Selected Supply Chain Node`.
3. **Sparse Plot Detail Inspection**: Registered plot cards only showed `plot_id`, `country_of_production`, `area_ha`, `verification_status`, and `production_range`. Key fields (`Geometry type`, `Coordinate precision`, `Material`, `Source PO / lot`, `Related chain node`, `Evidence document`) were not inspectable in a structured detail panel.
4. **Disconnected GEO Review Modal**: Clicking `Review GEO` replaced the entire Geolocation drawer with a separate minimal form (`reviewGeoDialog`), losing map visibility, plot metadata context, and source document status pre-checks.
5. **Visual Ambiguity Between Registered Plots and Temporary Local Previews**: Both registered plots and local preview polygons rendered with identical `#087b67` solid strokes.

---

## 2. Backend Contract & Permission Audit (`apps_script/GeoService.gs`, `apps_script/TraceService.gs`)

| Backend Function | Required Capability / Role | Tables Read / Written | Validation Invariants |
|---|---|---|---|
| `saveGeo(caseId, input)` | `GEO_EDIT` + `canAccessMaterial_` | Reads `02_SO_ITEM_MATERIAL`, `15_SUPPLY_CHAIN`, `06_DOCUMENT_REGISTER`; Writes `17_GEO_LOCATIONS`, `08_ACTIVITY_LOG` | Requires `PLOT`/`PRODUCER`/`FOREST_OWNER` node; `plot_id` match on `PLOT` node; unique `(case_id, material_id, plot_id)` (`DUPLICATE_PLOT`); ISO-2 `country_of_production`; `area_ha > 0`; `Point` with `area_ha > 4` rejected (`INVALID_GEO`); `coordinate_precision_digits` integer `6..12`; `validateGeometry_` (`Point` or single-ring `Polygon <= 2000` vertices). Sets `verification_status = 'REVIEW_REQUIRED'`. |
| `reviewGeo(id, input)` | `GEO_REVIEW` + `canAccessCase_` | Reads `17_GEO_LOCATIONS`, `06_DOCUMENT_REGISTER`, `09_CONFIG`; Patches `17_GEO_LOCATIONS`, `08_ACTIVITY_LOG` | `status` in `['VERIFIED', 'REJECTED', 'MORE_INFO_REQUIRED']`; `notes` required (`<= 2000` chars). `VERIFIED` requires `!legalState_().reviewDue` (`LEGAL_REVIEW_DUE`) and active `APPROVED` source document (`EVIDENCE_NOT_APPROVED`). |
| `exportGeoJSON(caseId)` | Non-`SUPPLIER_USER` + `canAccessCase_` | Reads `17_GEO_LOCATIONS` | Exports `FeatureCollection` of registered plots for `caseId`. |
| `linkSourceRecord(sourceId, {type:'GEO', id, confirmed:true})` | `!SUPPLIER_USER` + `GEO_EDIT`/`MATERIAL_EDIT`/`CHAIN_EDIT`/`ORDER_EDIT` | Reads `29_MATERIAL_SOURCES`, `17_GEO_LOCATIONS`; Writes `34_SOURCE_RECORD_LINKS` | Links a registered plot in `17_GEO_LOCATIONS` to a specific `source_id` (`PO / lot`) without duplicating plot rows. |

---

## 3. Shared-File Ownership & Parallel Workstream Isolation

- **P0 / P1 (Supplier Identity & Directory)**: Untouched. No changes to `14_SUPPLIERS`, supplier matching, or migration scripts.
- **P2-A (`EudrNav`) & P2-D (`EudrOps`)**: Reused directly via `ops` and `nav` adapters passed into `window.EudrGeo.open(...)`.
- **Modified Files in P2-E**:
  - `public/geo.js` (Primary P2-E module)
  - `public/geo.css` (Primary P2-E stylesheet)
  - `public/app.js` (2-line integration hook in `geoDialog` and `reviewGeoDialog`)
  - `public/i18n.js` (Additive P2-E bilingual dictionary entries)
  - `tests/p2e-geolocation.test.mjs` (New P2-E automated test suite)
