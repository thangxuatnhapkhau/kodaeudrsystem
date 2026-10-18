# P2-E — Automated Test Results

## 1. Test Execution Summary

| Metric | Result |
|---|---|
| Test Runner | Node.js built-in test runner (`node --test`) |
| Syntax Check (`npm run check`) | PASS (`public/geo.js`, `public/app.js`, `public/i18n.js`, all public scripts) |
| Total Automated Tests (`npm test`) | **228 / 228 PASS** (`0` failures) |
| P2-E Dedicated Test Suite (`tests/p2e-geolocation.test.mjs`) | **6 / 6 test suites PASS** (covering all 50 matrix scenarios `GEO-M01`..`GEO-L08`) |
| Baseline & P2-A/B/C/D Regression Suites | **222 / 222 PASS** (`0` regressions) |

---

## 2. P2-E Automated Test Matrix Results (`tests/p2e-geolocation.test.mjs`)

### 2.1 Map & Plot Inspection (`GEO-M01`..`GEO-M08`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-M01` | Open workspace with stored plots | **PASS** | Renders `#geoContextBar`, `#geoHeaderStatus`, `#geoTabBar`, `#geoMapCanvas`, `#geoPlotInspector`, and `#geoRegisteredList` |
| `GEO-M02` | Open workspace with no stored plots | **PASS** | Renders `#geoEmptyState` with `Upload GeoJSON` CTA (`#geoEmptyUploadBtn`) |
| `GEO-M03` | Select plot from map or list | **PASS** | Highlights selected plot row (`is-selected`) and updates `#geoPlotInspector` |
| `GEO-M04` | Fit bounds to selected plot | **PASS** | Clicking `#geoFitBoundsBtn` centers/fits map bounds to active geometry |
| `GEO-M05` | Open source document from plot detail | **PASS** | Clicking `#geoOpenEvidenceDocBtn` pushes `GEO_PLOT` state to `EudrNav` and opens `openDoc` |
| `GEO-M06` | Return from source document to plot detail | **PASS** | Restores `GEO` view, active tab, and selected `plot_id` (`PLOT-VN-01`) |
| `GEO-M07` | Distinguish preview vs registered plot | **PASS** | Registered layer uses `#087b67` solid; selected layer uses `#0b5cab`; preview layer uses `#c26c11` dashed (`dashArray: '6 5'`), reflected in `#geoMapLegend` |
| `GEO-M08` | Missing plot metadata fields | **PASS** | Displays `Not provided` / `Not verified` explicitly in `#geoPlotInspector`; zero fabricated values |

### 2.2 GeoJSON Upload & Parsing (`GEO-U01`..`GEO-U10`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-U01` | Valid Point GeoJSON | **PASS** | Parses, populates `#geoUploadSummary` (6 fields), enables `Upload GeoJSON Evidence` |
| `GEO-U02` | Valid single-ring Polygon GeoJSON | **PASS** | Parses, renders preview, enables upload and registration |
| `GEO-U03` | Valid FeatureCollection (`<= 100` features) | **PASS** | Lists all features in `#geoFeature` selector with index, geometry type, and feature label |
| `GEO-U04` | Closed LineString (`>= 4` positions) | **PASS** | Displays `#geoLineConfirm` warning; upload preserves original `LineString` bytes while registration requires explicit user confirmation |
| `GEO-U05` | MultiPolygon / GeometryCollection | **PASS** | Allowed for preview/evidence upload; blocked from plot registration with clear `#geoEligibilityBadge` reason |
| `GEO-U06` | File `> 2 MB` | **PASS** | Rejected before parsing with `GeoJSON file exceeds 2 MB limit.` |
| `GEO-U07` | Feature count `> 100` | **PASS** | Rejected with `GeoJSON exceeds 100 feature limit.` |
| `GEO-U08` | Positions `> 10,000` | **PASS** | Rejected with `GeoJSON exceeds 10,000 coordinate positions.` |
| `GEO-U09` | Invalid JSON | **PASS** | Rejected with clear parse error message |
| `GEO-U10` | Coordinates outside valid lon/lat range | **PASS** | Rejected with `Coordinates must be valid [longitude, latitude] numbers.` |

### 2.3 Plot Registration (`GEO-R01`..`GEO-R12`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-R01` | Point plot `<= 4 ha` with approved/uploaded source doc | **PASS** | `registerPlot` succeeds; renders `#geoRegistrationResult` and updates registered plot list |
| `GEO-R02` | Point plot `> 4 ha` | **PASS** | Blocked client-side (`Plots above 4 hectares require polygon boundaries under EUDR Article 9.`) |
| `GEO-R03` | Valid Polygon plot (`> 4 ha` and `<= 4 ha`) | **PASS** | `registerPlot` succeeds with canonical 6-decimal coordinates |
| `GEO-R04` | Unclosed Polygon | **PASS** | Blocked (`Polygon rings must be closed.`) |
| `GEO-R05` | Polygon with duplicate vertices | **PASS** | Blocked (`Polygon has duplicate vertices.`) |
| `GEO-R06` | Self-intersecting Polygon (bowtie) | **PASS** | Blocked (`Polygon intersects itself. Check the source file.`) |
| `GEO-R07` | Zero-area Polygon | **PASS** | Blocked (`Polygon has zero area.`) |
| `GEO-R08` | Polygon `> 2,000` positions | **PASS** | Blocked (`Selected polygon exceeds 2,000 positions. Simplify the source file outside the system and re-upload.`) |
| `GEO-R09` | Polygon with interior holes (`coordinates.length > 1`) | **PASS** | Blocked (`Polygon holes are not supported in this register.`) |
| `GEO-R10` | Missing source document | **PASS** | Blocked (`Choose an uploaded or approved geolocation document.`) |
| `GEO-R11` | Duplicate plot (`same order + material + plot_id + canonical coordinates`) | **PASS** | Blocked with `DUPLICATE_PLOT` error and existing plot reference |
| `GEO-R12` | Register and link to active `Source PO / lot` | **PASS** | Calls `registerPlot` then `linkPlotToSource` (`source_id`, `plot_id`, `allocated_pct`, `allocated_qty`), updating plot inspector |

### 2.4 Geolocation Verification (`GEO-V01`..`GEO-V06`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-V01` | Verify plot with `APPROVED` source document | **PASS** | `reviewGeo` (`VERIFIED`) succeeds and updates status pill |
| `GEO-V02` | Verify plot with unapproved (`UPLOADED`) source document | **PASS** | Blocked by `#geoReviewPrecheck` (`Approve the geolocation source document before marking plot VERIFIED.`) |
| `GEO-V03` | Reject plot with notes | **PASS** | `reviewGeo` (`REJECTED`) succeeds |
| `GEO-V04` | Request more info with notes | **PASS** | `reviewGeo` (`MORE_INFO_REQUIRED`) succeeds |
| `GEO-V05` | Submit review without notes | **PASS** | Blocked (`Review notes are required for geolocation verification decisions.`) |
| `GEO-V06` | Unauthorized role attempts review | **PASS** | Server error displayed cleanly without corrupting form state |

### 2.5 Navigation & Context (`GEO-N01`..`GEO-N06`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-N01` | `Order → Geolocation Workspace → Back to Order` | **PASS** | Preserves `so_id`, `product_id`, `material_id`, `source_id`, `chain_node_id` |
| `GEO-N02` | `Geolocation Workspace → Plot → Source PDF → Back to Plot` | **PASS** | Restores `GEO` workspace, active tab, and selected `plot_id` |
| `GEO-N03` | Switch between `MAP`, `UPLOAD`, `REGISTER`, `REVIEW` tabs | **PASS** | Preserves loaded GeoJSON candidate, form fields, and selected plot |
| `GEO-N04` | Close workspace with unsaved registration/review input | **PASS** | Prompts dirty-form confirmation before discarding |
| `GEO-N05` | Browser Back button / `EudrNav` stack integration | **PASS** | Pops `GEO` / `GEO_PLOT` state cleanly |
| `GEO-N06` | Switch Sales Order while Geolocation Workspace is open | **PASS** | Clears previous order's temporary GeoJSON preview and reloads new order plots |

### 2.6 Loading & Operation Status (`GEO-L01`..`GEO-L08`)

| Test ID | Scenario | Status | Verification Evidence |
|---|---|---|---|
| `GEO-L01` | Load stored plots | **PASS** | Tracked via `EudrOps` (`Load geolocation plots`) |
| `GEO-L02` | Parse local GeoJSON | **PASS** | Immediate inline feedback and validation card |
| `GEO-L03` | Upload GeoJSON evidence | **PASS** | Button locked (`aria-busy="true"`), tracked in `EudrOps`, post-upload card displayed |
| `GEO-L04` | Register plot | **PASS** | Button locked (`aria-busy="true"`), tracked in `EudrOps`, post-registration banner displayed |
| `GEO-L05` | Submit GEO review | **PASS** | Button locked (`aria-busy="true"`), tracked in `EudrOps`, status updated |
| `GEO-L06` | Export GeoJSON | **PASS** | Downloads `Order-Plots.geojson` with `exportReadyPlots` |
| `GEO-L07` | Double-click Upload / Register / Review | **PASS** | Single-flight lock prevents duplicate API calls (`registerCalls === 1`) |
| `GEO-L08` | Timeout or 5xx during Upload / Register / Review | **PASS** | Transitions operation to `OUTCOME_UNKNOWN` and displays `#geoOutcomeUnknownBanner` with `Refresh Workspace State` before re-submitting |
