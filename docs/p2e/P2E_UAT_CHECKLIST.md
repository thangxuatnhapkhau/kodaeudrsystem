# P2-E — Staging User Acceptance Testing (UAT) Checklist

## 1. Pre-UAT Environment Verification

- [ ] Staging branch `feature/eudr-p2e-geolocation` deployed to isolated Netlify preview URL.
- [ ] Connected to staging Google Sheets database and staging Apps Script Web App (`EUDR_GAS_URL`).
- [ ] Test user accounts configured for roles: `ADMIN`, `COMPLIANCE`, `OPS`, `VIEWER`.
- [ ] Sample GeoJSON test fixtures prepared:
  - `valid-point-small.geojson` (`Point`, 2.5 ha)
  - `valid-polygon-7ha.geojson` (`Polygon`, single ring, 7.4 ha)
  - `closed-linestring.geojson` (`LineString`, 5 positions, closed)
  - `multipolygon-evidence.geojson` (`MultiPolygon`)
  - `self-intersecting-bowtie.geojson` (`Polygon`, self-intersecting)
  - `oversized-3mb.geojson` (`> 2 MB`)

---

## 2. Tab 1 (`MAP`) & Context Bar UAT Steps

- [ ] **UAT-M01**: Open an Order (`SO-...`), select a Product, Material, and Source PO / lot, then click **Geolocation Map & Register**.
  - **Expected**: Geolocation Workspace opens on the `MAP` tab. The top context bar shows `Sales Order`, `Product`, `Material`, `Source PO / lot`, and `Supply Chain Node`. Header status pills display `X plot(s)`, `Y VERIFIED`, `Z REVIEW_REQUIRED`.
- [ ] **UAT-M02**: Click a plot row in the **Registered Plots** list (`#geoRegisteredList`) or click a feature on the Leaflet map.
  - **Expected**: Map highlights the selected plot in blue (`#0b5cab`), fits bounds when **Fit Bounds to Plot** is clicked, and populates the **Plot Detail Inspector** (`#geoPlotInspector`) with all 10 verified fields (`Plot ID`, `Geometry type`, `Country of production`, `Area`, `Production date / range`, `Coordinate precision`, `Material`, `Source PO / lot`, `Related chain node`, `Evidence document`, `GEO verification status`). Any unpopulated optional metadata displays `Not provided`.
- [ ] **UAT-M03**: Click **Open Evidence Document** inside the Plot Detail Inspector.
  - **Expected**: Document Viewer opens for the linked `doc_id`. Clicking **Back** (`← Back`) returns directly to the Geolocation Workspace with the same plot still selected.

---

## 3. Tab 2 (`UPLOAD`) UAT Steps

- [ ] **UAT-U01**: Switch to the **UPLOAD** tab and select `valid-polygon-7ha.geojson`.
  - **Expected**: The 6-field **GeoJSON File Validation Summary** card (`#geoUploadSummary`) shows `File name`, `File size`, `Feature count`, `Geometry types`, `Coordinate position count`, and `Validation result: VALID`. The map preview shows the candidate feature with an amber dashed outline (`#c26c11`).
- [ ] **UAT-U02**: Select `oversized-3mb.geojson`.
  - **Expected**: Upload is blocked immediately with `GeoJSON file exceeds 2 MB limit.`
- [ ] **UAT-U03**: Select `closed-linestring.geojson`.
  - **Expected**: Warning checkbox `#geoLineConfirm` appears explaining that the original `LineString` file will be preserved unmodified as evidence, while registration converts the closed ring to a `Polygon` after confirmation.
- [ ] **UAT-U04**: Choose a `04_Geolocation` task (or `Create 04_Geolocation task automatically`) and click **Upload GeoJSON Evidence**.
  - **Expected**: Button locks (`aria-busy="true"`), operation status is tracked in the Operation Status Center, and upon completion `#geoUploadSuccessCard` appears with a **Register Plot →** button.

---

## 4. Tab 3 (`REGISTER`) UAT Steps

- [ ] **UAT-R01**: Click **Register Plot →** from the upload confirmation card (or open the **REGISTER** tab).
  - **Expected**: `#geoEligibilityBadge` shows `ELIGIBLE FOR REGISTRATION`. Source document dropdown defaults to the newly uploaded geolocation document.
- [ ] **UAT-R02**: Test EUDR Article 9 4-hectare rule: load `valid-point-small.geojson` (`Point`), enter `Area (ha) = 5.0`, and click **Register Plot**.
  - **Expected**: Registration is blocked with `Plots above 4 hectares require polygon boundaries under EUDR Article 9.` Change `Area (ha)` to `2.5` and verify eligibility turns green.
- [ ] **UAT-R03**: Check **Link registered plot to active Source PO / lot**, enter `Allocated %` (`100`), fill required metadata (`Plot ID`, `Country (ISO-2)`, `Area (ha)`, `Production Date / Range`), and click **Register Plot**.
  - **Expected**: Plot is registered and automatically linked to the active `Source PO / lot`. Confirmation banner `#geoRegistrationResult` displays with a **GEO Review →** button.
- [ ] **UAT-R04**: Click **Register Plot** again with the exact same `Plot ID` and geometry.
  - **Expected**: Blocked with `DUPLICATE_PLOT` message identifying the existing plot record.

---

## 5. Tab 4 (`REVIEW`) UAT Steps

- [ ] **UAT-V01**: Open the **REVIEW** tab.
  - **Expected**: The 4-tier verification scope banner (`#geoVerificationScopeNotice`) is clearly displayed (`Verification does not certify deforestation-free status or legal compliance.`).
- [ ] **UAT-V02**: Select a plot whose linked `doc_id` is still `UPLOADED` (not `APPROVED`) and choose `VERIFIED`.
  - **Expected**: `#geoReviewPrecheck` warns that the geolocation source document must be `APPROVED` before the plot can be marked `VERIFIED`, and includes an **Open Source Document** button.
- [ ] **UAT-V03**: Attempt to submit a review (`VERIFIED`, `REJECTED`, or `MORE_INFO_REQUIRED`) with empty review notes.
  - **Expected**: Submission is blocked (`Review notes are required for geolocation verification decisions.`).
- [ ] **UAT-V04**: With an `APPROVED` source document and review notes entered, submit `VERIFIED`.
  - **Expected**: Plot status updates to `VERIFIED` across the review card, plot inspector, registered plot list, and header summary pill.
