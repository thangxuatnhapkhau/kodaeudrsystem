# KODA EUDR WORKSPACE — P2-E GEOLOCATION WORKFLOW GUIDE
## End-to-End Plot Traceability, Upload, Registration & Verification

---

## 1. Four-Stage Operational Workflow

### Stage 1: MAP — Visual Inspection & Traceability Detail (`#geoTabPanel-map`)
1. **Map Canvas**:
   - Displays registered plots (`#087b67` solid green stroke/fill), the currently selected plot (`#0b5cab` royal blue highlight), and any local un-registered preview geometry (`#c26c11` amber dashed stroke).
   - Provides toolbar controls: `Show all plots` (`#geoFit`), `Fit selected plot` (`#geoFitSelected`), `Fit preview feature` (`#geoFitPreview`), and `Export GeoJSON` (`#geoExport`, non-supplier roles).
2. **Selected Plot Detail Inspector (`#geoPlotInspector`)**:
   - Displays all 10 verified traceability attributes for the selected plot:
     - `Plot ID`, `Geometry type`, `Country of production`, `Area`, `Production date / range`, `Coordinate precision`, `Material`, `Source PO / lot`, `Related chain node`, `Evidence document`, and `GEO verification status`.
   - Explicitly displays `Not provided` or `Not verified` when data is absent.
   - Allows linking an existing plot to the active `Source PO / lot` (`linkSourceRecord`) when `GEO_EDIT` is held.
3. **Empty State**:
   - When no plots are registered for the material, displays `"No registered plots for this material/source."` with a primary `Upload GeoJSON` CTA that opens the `UPLOAD` tab.

---

### Stage 2: UPLOAD — Original GeoJSON Evidence (`#geoTabPanel-upload`)
1. **Choose File**: Select a `.geojson` or `.json` file up to `2 MB`.
2. **Client Validation & File Summary (`#geoUploadSummary`)**:
   - Validates JSON syntax, UTF-8 BOM, Feature/FeatureCollection structure (`1–100` features), coordinate tuple format (`[longitude, latitude]` within `[-180..180, -90..90]`), total positions (`<= 10,000`), and polygon ring closure (`>= 4` positions).
   - Displays `File name`, `File size`, `Geometry type`, `Feature count`, `Coordinate positions`, and `Validation result`.
3. **Feature & Boundary Confirmation**:
   - Multi-feature files expose `#geoFeature` to inspect individual plots.
   - Closed `LineString` features (`>= 4` positions, matching start/end) expose `#geoLineConfirm` so the user can explicitly confirm conversion to a `Polygon` for registration while keeping the uploaded GeoJSON file unchanged.
4. **Save Original GeoJSON**:
   - Select an existing `04_Geolocation` evidence task or create a new scoped `04_Geolocation` requirement (`__NEW__` for users with `POLICY_EDIT`).
   - Clicking `Save original GeoJSON` (`#geoUpload`) uploads the exact unmodified file bytes via `uploadEvidence`, auto-populates `source_document_id` in the `REGISTER` tab, and shows a `"Register Plot →"` CTA.

---

### Stage 3: REGISTER — Source-Backed Plot Registration (`#geoTabPanel-register`)
1. **Eligibility Banner (`#geoEligibilityBanner`)**:
   - Confirms whether the selected geometry is `Point` or single-ring `Polygon` (`<= 2,000` positions, no duplicate vertices, non-zero area, no self-intersection, no antimeridian jump).
   - Marks `MultiPolygon`, `MultiPoint`, `MultiLineString`, and polygons with interior holes as `"Preview only — specialist review required for registration."`
2. **Source-Backed Metadata**:
   - `chain_node_id`: Must reference an active `PLOT`, `PRODUCER`, or `FOREST_OWNER` node for the material. Selecting a `PLOT` node auto-fills its `plot_id`.
   - `plot_id`: Unique within `(case_id, material_id)` (`DUPLICATE_PLOT` check).
   - `country_of_production`: 2-letter uppercase ISO country code (`[A-Z]{2}`).
   - `production_range`: Harvest/production date or range from source evidence.
   - `area_ha`: Plot area in hectares (`> 0`). Plots above `4 ha` require a `Polygon` (`Point` > 4 ha is rejected per EUDR Article 9).
   - `coordinate_precision_digits`: Integer `6–12` from source evidence.
   - `source_document_id`: Active evidence document in `06_DOCUMENT_REGISTER`.
   - Optional checkbox `#geoLinkActiveSource`: Links the newly registered plot to the active `Source PO / lot` (`29_MATERIAL_SOURCES` / `34_SOURCE_RECORD_LINKS`).
3. **Post-Registration**:
   - Saves plot with status `REVIEW_REQUIRED` and presents a confirmation card with `"GEO Review →"` CTA.

---

### Stage 4: REVIEW — Human Geolocation Verification (`#geoTabPanel-review`)
1. **Verification Boundaries Notice**:
   - Clearly separates (1) Automated Geometry Validation, (2) Source Document Approval (`06_DOCUMENT_REGISTER`), and (3) Human GEO Review (`17_GEO_LOCATIONS`), and states: `"Verification does not certify deforestation-free status or legal compliance."`
2. **Plot Verification List & Pre-Check**:
   - Lists all registered plots with their current verification status, source document approval state, chain node, PO/lot linkage, reviewer, and review timestamp.
   - Pre-check banner (`#geoReviewPrecheck`) warns if the linked source document is not yet `APPROVED` or if `legalState_().reviewDue` is active.
3. **Record Review (`#geoReviewForm`)**:
   - Users with `GEO_REVIEW` capability select `VERIFIED`, `REJECTED`, or `MORE_INFO_REQUIRED`, enter mandatory review notes (`<= 2,000` chars), and submit `reviewGeo`.
