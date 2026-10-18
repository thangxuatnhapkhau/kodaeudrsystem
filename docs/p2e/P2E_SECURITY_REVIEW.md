# KODA EUDR WORKSPACE — P2-E SECURITY & ACCESS CONTROL REVIEW
## CSP Compliance, XSS Prevention & Role/Capability Gating

---

## 1. Content Security Policy (`style-src 'self'`) Compliance
- Verified that `public/geo.js`, `public/geo.css`, and `public/app.js` contain **zero** inline `style="..."` attributes, **zero** `.style.` DOM mutations, and **zero** `setAttribute('style', ...)` calls.
- All tab switching (`MAP`, `UPLOAD`, `REGISTER`, `REVIEW`) and conditional UI elements use the HTML `hidden` attribute and external CSS rules in `public/geo.css`.
- Map tile URLs in `public/geo.js` are validated with `/^https:\/\//` before initializing `L.tileLayer`, with `referrerPolicy: 'strict-origin-when-cross-origin'`.

## 2. XSS & Untrusted GeoJSON Sanitization
- All GeoJSON feature properties (`f.properties.plot_id`, `f.properties.name`) and user/database fields rendered in HTML templates pass through `esc()` (`&`, `<`, `>`, `"`, `'` entity escaping).
- Leaflet popups bind text using `document.createElement('span')` and `.textContent = f.properties.name || ''` (never HTML strings).
- Coordinate previews (`#geoCoordinates`) and status messages (`#geoMessage`, `#geoMapStatus`, `#geoGeometryStatus`, `#geoReviewPrecheck`) use `.textContent` exclusively.

## 3. Role & Capability Enforcement Matrix

| Action / UI Control | Frontend Gate (`public/geo.js`) | Backend Gate (`apps_script/GeoService.gs` / `TraceService.gs`) |
|---|---|---|
| View Geolocation Workspace & Map | Assigned Order & Material scope | `bootstrap()` material/order scope filtering (`canAccessMaterial_`) |
| Upload Original GeoJSON (`#geoUpload`) | `has('EVIDENCE_UPLOAD')` | `requireCapability_(u, 'EVIDENCE_UPLOAD')` + `task_` scope check |
| Create Scoped Geolocation Task (`__NEW__`) | `has('POLICY_EDIT')` | `requireCapability_(u, 'POLICY_EDIT')` in `addScopedRequirement` |
| Register Plot (`#geoForm` / `saveGeo`) | `has('GEO_EDIT')` | `requireCapability_(u, 'GEO_EDIT')` + `canAccessMaterial_` |
| Link Plot to Source PO/Lot (`linkSourceRecord`) | `has('GEO_EDIT')` + active `sourceId` | `u.role !== 'SUPPLIER_USER'` + `GEO_EDIT`/`MATERIAL_EDIT`/`CHAIN_EDIT`/`ORDER_EDIT` |
| Review GEO (`#geoReviewForm` / `reviewGeo`) | `has('GEO_REVIEW')` | `requireCapability_(u, 'GEO_REVIEW')` + `canAccessCase_` |
| Export GeoJSON (`#geoExport` / `exportGeoJSON`) | `state.user.role !== 'SUPPLIER_USER'` | `if (u.role === 'SUPPLIER_USER') fail_('PERMISSION_DENIED', ...)` |
