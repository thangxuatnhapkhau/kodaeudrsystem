# P2 UI Changelog — KODA EUDR Workspace

## 1. `public/index.html`
- Preserved official `/koda-logo.png`, `.brand-caption` (`EUDR WORKSPACE`), and `#0b2923` dark green sidebar branding.
- Added `#sidebarCollapseBtn` for desktop sidebar collapse/expand and `#sidebarOrderContext` for active/recent order quick return.
- Added `#mobileMenuBtn`, `#navBackBtn`, `#navForwardBtn`, `#breadcrumbBar`, and `#backToOrderBtn` to `.topbar`.
- Added `#opsStatusBtn` (`#opsStatusDot`, `#opsStatusLabel`), `#operationCenterPanel`, and `#operationBanner` for centralized operation status tracking.
- Added `.drawer-topbar` with `#drawerNavBar` inside `<dialog id="drawer">` so nested viewers show `← Back to GeoJSON Map` or `← Back to SO...` alongside `Close`.

## 2. `public/app.js`
- Added `window.EudrOps` (Operation & Loading Status Manager) and `window.EudrNav` (Context-Aware Navigation State Manager).
- Updated `render()` to organize sidebar items into three role-aware groups: `OPERATIONS` (`Dashboard`, `Orders`, `My Tasks`, `Calendar`), `EUDR MANAGEMENT` (`Suppliers`, `AI Assistant`, `Export`), and `ADMINISTRATION` (`Audit Trail`, `Users`, `Settings`).
- Added `isRequiredTask(t)` and `computeDashboardMetrics()` to eliminate mixed-unit summation and exclude `OPTIONAL` / `NOT_REQUIRED` tasks from mandatory missing counts.
- Updated `dashboard()` to render 6 clickable `<button class="kpi kpi-button" data-kpi="...">` cards and unit-separated hero pills (`.hero-metrics-breakdown`).
- Updated `orders()` and `myTasks()` to render `.kpi-filter-banner` with `Show all` and `← Back to Dashboard` actions when navigated from a Dashboard KPI card.
- Updated `workspace()` to push navigation steps (`product`, `material`, `source`, `chain`) into `EudrNav` and preserve exact selections across nested viewers.
- Integrated `documentView()`, `largeUpload()`, `fileBytes()`, `newOrder()`, `reviewGeoDialog()`, `geoDialog()`, `exports()`, and `aiOutputs()` with `EudrNav` and `EudrOps`.

## 3. `public/geo.js` & `public/pdf-preview.mjs`
- `public/geo.js`: Added `lastViewByMaterial` cache (`recordIndex`, `center`, `zoom`) and `clearSavedViews()` so returning from a PDF viewer to the GeoJSON drawer restores the exact selected plot and map viewport while still destroying the Leaflet instance on drawer close.
- `public/pdf-preview.mjs`: Added `onPageChange` callback support so `EudrNav` tracks and restores the active PDF page across navigation history.

## 4. `public/i18n.js` & `public/style.css`
- `public/i18n.js`: Added complete Vietnamese translations for all new P2 navigation, sidebar, KPI, and operation center labels while keeping English (`en`) as the default UI language.
- `public/style.css`: Added CSP-compliant styles and smooth animations (`.sidebar-collapsed`, `.mobile-open`, `.sidebar-active-card`, `.topbar-nav-controls`, `.breadcrumb-bar`, `.ops-status-btn`, `.operation-center-panel`, `.operation-banner`, `.p2-skeleton`, `.kpi-grid--p2`, `.kpi-button`, `.kpi-filter-banner`, `.drawer-topbar`) with `@media (prefers-reduced-motion: reduce)` protection.
