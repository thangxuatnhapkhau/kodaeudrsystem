# KODA EUDR WORKSPACE — P2-E UI CHANGELOG
## Geolocation Workspace UX & Visual Upgrade Summary

---

## 1. Visual & Interaction Enhancements

| Area | Baseline (Before P2-E) | Upgraded (P2-E) |
|---|---|---|
| **Workspace Header** | Minimal `Material · Plot map` heading with no order/product/source/node context. | Full KODA dark-green header (`.geo-header`) with status summary pills (`plot(s)`, `VERIFIED`, `REVIEW_REQUIRED`), `← Back to Order` button, and 5-part `#geoContextBar` (`Sales Order → Product → Material → Source PO / lot → Supply Chain Node`). |
| **Navigation Tabs** | Single long vertical scroll combining map, file input, registration form, and list. | Accessible 4-tab bar (`1. MAP`, `2. UPLOAD`, `3. REGISTER`, `4. REVIEW`) with ARIA `role="tablist"`, keyboard arrow/Home/End navigation, and persistent DOM panels. |
| **Map Viewer Layout** | Full-width map stacked above forms; registered plots at the very bottom. | Desktop 2-column split layout (`.geo-map-split`): interactive Leaflet map + legend on the left; Selected Plot Detail Inspector (`#geoPlotInspector`) + Registered Plot List (`#geoRegisteredList`) on the right. |
| **Map Legend & Styling** | Identical `#087b67` stroke for both stored plots and local file previews. | Distinct visual encoding: `#087b67` solid for registered plots, `#0b5cab` bold highlight for the selected plot, and `#c26c11` dashed amber stroke for temporary local previews. |
| **Selected Plot Inspector** | Only 5 fields shown inline in list item text. | Dedicated 10-field definition grid (`.geo-detail-grid`) showing `Plot ID`, `Geometry type`, `Country of production`, `Area`, `Production date / range`, `Coordinate precision`, `Material`, `Source PO / lot`, `Related chain node`, `Evidence document`, and `GEO verification status`. |
| **GeoJSON Upload** | Plain file input with minimal filename string. | 6-field validation summary grid (`#geoUploadSummary`), feature selector, closed `LineString` confirmation, `View preview on map` shortcut, `04_Geolocation` task selector, and post-upload confirmation card (`#geoUploadSuccessCard`) with `Register Plot →` CTA. |
| **Plot Registration** | No visual eligibility badge; no client-side duplicate plot check; no direct PO/lot link option. | Live eligibility badge (`#geoEligibilityBadge`) & banner, client + server `Point > 4 ha` and `DUPLICATE_PLOT` validation, optional active `Source PO / lot` link checkbox (`#geoLinkActiveSource`), and post-registration result banner (`#geoRegistrationResult`) with `GEO Review →` CTA. |
| **GEO Verification** | Separate modal (`reviewGeoDialog`) that replaced the Geolocation Workspace. | Integrated `REVIEW` tab (`#geoTabPanel-review`) with 4-tier verification boundary disclaimer, plot review cards, source document approval pre-check (`#geoReviewPrecheck`), and inline `#geoReviewForm`. |
