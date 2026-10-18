# KODA EUDR WORKSPACE — P2-E DATA INTEGRITY REVIEW
## Evidence Immutability, Source-Backed Metadata & Geometry Validation

---

## 1. Core Data Integrity Guarantees

1. **Original GeoJSON Byte Immutability**:
   - Local preview (`readFile(file, false)`) and evidence upload (`readFile(file, true)`) never mutate the uploaded file's bytes.
   - When a user confirms a closed `LineString` as a plot boundary (`#geoLineConfirm`), the conversion to `{type: 'Polygon', coordinates: [ring]}` applies **only** to the registration candidate payload sent to `saveGeo`, while the original GeoJSON uploaded to `06_DOCUMENT_REGISTER` remains byte-for-byte identical to the supplier's file, and an explicit audit note (`"User confirmed closed LineString as plot boundary; Polygon registered. Original GeoJSON unchanged."`) is recorded in `17_GEO_LOCATIONS.notes`.

2. **Zero Map Inference Policy**:
   - The frontend never auto-calculates or fabricates `country_of_production`, `area_ha`, `production_range`, or `coordinate_precision_digits` from map coordinates or bounding boxes.
   - All four fields must be explicitly entered by the authorized user from cited source evidence.
   - Missing fields in registered records are displayed as `"Not provided"` / `"Not verified"`.

3. **Strict Geometry & EUDR Article 9 Validation Parity**:
   - File size: `<= 2,000,000` bytes (2 MB).
   - Feature count: `1..100` features per GeoJSON file.
   - Coordinate positions: `<= 10,000` total positions per file; `<= 2,000` positions per registered polygon ring.
   - Coordinate bounds: `[longitude, latitude]` finite numbers with `|lon| <= 180` and `|lat| <= 90`.
   - Polygon topology: Single exterior ring (`coordinates.length === 1`), closed (`ring[0] === ring[ring.length - 1]`), `>= 4` positions, no duplicate vertices, non-zero area (`|area| >= 1e-15`), no antimeridian jump (`|Δlon| <= 180`), and no self-intersecting or collinear overlapping edges.
   - Plot size rule: `Point` geometry with `area_ha > 4` is rejected on both client (`validatePlotRegistration`) and server (`GeoService.gs:saveGeo`) with `"For wood plots above 4 ha, provide a polygon"`.

4. **Duplicate Plot Prevention**:
   - Both client (`validatePlotRegistration`) and server (`GeoService.gs:saveGeo`) enforce uniqueness of `(case_id, material_id, plot_id)` and reject duplicates with code `DUPLICATE_PLOT`.

5. **Verification Boundary Enforcement**:
   - Newly registered plots always start in `REVIEW_REQUIRED`.
   - Uploading a GeoJSON file or registering a plot never auto-approves the evidence task (`04_EVIDENCE_TRACKER`) or sets `verification_status = 'VERIFIED'`.
   - Setting `verification_status = 'VERIFIED'` via `reviewGeo` requires `GEO_REVIEW` capability, non-empty reviewer notes, current legal review (`!legalState_().reviewDue`), and an active `APPROVED` source document in `06_DOCUMENT_REGISTER`.
