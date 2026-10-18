# P2-E — Release Notes: Geolocation Workspace UX & Plot Traceability Upgrade

**Release Branch**: `feature/eudr-p2e-geolocation`  
**Baseline Commit**: `529aa4b13526a404f439df8ec64af1f437cbfd60` (`feature/eudr-p2-ux-navigation`)  
**Automated Test Status**: `228 / 228 PASS` (`0` regressions)

---

## 1. Executive Summary

**P2-E** transforms the single-screen Geolocation & Plot Map modal into an integrated, 4-tab **Geolocation Workspace** (`MAP`, `UPLOAD`, `REGISTER`, `REVIEW`) with full source-to-plot traceability, context-aware navigation (`EudrNav`), and centralized operation status tracking (`EudrOps`).

---

## 2. Key Features Delivered

1. **Unified Header & 5-Part Context Bar (`#geoContextBar`)**:
   - Displays active context across all tabs: `Sales Order → Product → Material → Source PO / lot → Supply Chain Node`.
   - Live status summary pills (`X plot(s)`, `Y VERIFIED`, `Z REVIEW_REQUIRED`), `← Back to Order`, and dirty-form guarded `Close`.
2. **Tab 1 — `MAP` (Split-View Map & Plot Detail Inspector)**:
   - Interactive Leaflet/OpenStreetMap canvas with explicit visual legend distinguishing **Registered Plot** (`#087b67` solid), **Selected Plot** (`#0b5cab` highlighted), and **Local GeoJSON Preview** (`#c26c11` dashed).
   - **Plot Detail Inspector (`#geoPlotInspector`)** displaying all 10 verified plot attributes (`Plot ID`, `Geometry type`, `Country of production`, `Area`, `Production date / range`, `Coordinate precision`, `Material`, `Source PO / lot`, `Related chain node`, `Evidence document`, and `GEO verification status`), showing `Not provided` or `Not verified` whenever data is absent.
   - Direct **Open Evidence Document** action with full back-navigation return (`Plot → Source PDF → Back to Plot`).
3. **Tab 2 — `UPLOAD` (Step-by-Step GeoJSON Evidence Upload)**:
   - Enforces `<= 2 MB`, `1–100` features, `<= 10,000` coordinate positions, and valid `[lon, lat]` bounds.
   - 6-field **GeoJSON File Validation Summary** card (`#geoUploadSummary`), feature selector (`#geoFeature`), closed `LineString` confirmation (`#geoLineConfirm`), and `04_Geolocation` task selector (`#geoTask`).
   - Preserves original GeoJSON file bytes unmodified during `uploadEvidence` and guides users directly to plot registration via `#geoUploadSuccessCard`.
4. **Tab 3 — `REGISTER` (Source-Backed Plot Registration)**:
   - Live **Registration Eligibility Badge & Banner** (`#geoEligibilityBadge` / `#geoEligibilityBanner`) checking geometry type (`Point` vs single-ring `Polygon`), EUDR Article 9 4-hectare threshold (`Point > 4 ha` blocked), `<= 2,000` polygon positions, ring closure, self-intersection, duplicate vertices, zero area, and interior holes.
   - Client + server `DUPLICATE_PLOT` prevention (`same order + material + plot_id + canonical coordinates`).
   - One-step optional linking to the active `Source PO / lot` (`linkPlotToSource`) upon registration.
5. **Tab 4 — `REVIEW` (Geolocation Verification Workspace)**:
   - Explicit 4-tier verification scope banner clarifying that geolocation verification does **not** certify deforestation-free status or legal compliance.
   - Pre-check blocking `VERIFIED` if the linked geolocation source document is not yet `APPROVED`.
   - Mandatory review notes for `VERIFIED`, `REJECTED`, and `MORE_INFO_REQUIRED`.
6. **Operation Safety & CSP Compliance**:
   - Single-flight button locking (`aria-busy="true"`), `EudrOps` integration, and `OUTCOME_UNKNOWN` safe refresh prompt on timeout/5xx.
   - 100% compliance with strict `style-src 'self'` CSP (zero inline styles).
