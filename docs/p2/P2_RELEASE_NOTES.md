# P2 Release Notes — UX, Navigation & Operation Experience Upgrade

- **Release Package**: `KODA_EUDR_P2_UX_NAVIGATION_UPGRADE`
- **Branch**: `feature/eudr-p2-ux-navigation`
- **Baseline Commit**: `04418c465713769cac77d8ab6b9668fa02d4289b`

## Key Highlights

### 1. Context-Aware Navigation (`window.EudrNav`)
- Full multi-step Back and Forward navigation across `Dashboard → Orders → Order Workspace → Product → Material → PO/Lot Source → Supply Chain Node → GeoJSON Map → Source Evidence PDF`.
- Nested viewer stack (`viewerStack`) allows opening a Source Evidence PDF or GEO Review directly from the GeoJSON Map and returning to the exact GeoJSON Map plot and viewport (`recordIndex`, `center`, `zoom`) without losing context.
- Interactive topbar breadcrumbs (`#breadcrumbBar`), context-aware `← Back to SO...` quick button (`#backToOrderBtn`), browser `popstate` support, refresh recovery via `sessionStorage` + URL hash, post-refresh access revalidation, and unsaved-form navigation protection (`canNavigateAway()`).

### 2. Categorized & Collapsible Sidebar (KODA Brand Preserved)
- Retains the official KODA logo (`/koda-logo.png`) and `#0b2923` dark green sidebar identity.
- Groups navigation into `OPERATIONS` (`Dashboard`, `Orders`, `My Tasks`, `Calendar`), `EUDR MANAGEMENT` (`Suppliers`, `AI Assistant`, `Export`), and `ADMINISTRATION` (`Audit Trail`, `Users`, `Settings`).
- Adds desktop sidebar collapse toggle (`#sidebarCollapseBtn`), responsive mobile drawer (`#mobileMenuBtn`), and an `Active order context` quick-return card (`#sidebarOrderContext`).

### 3. Unit-Consistent, Actionable Dashboard KPIs
- Fixes the baseline mixed-unit hero calculation by separating **Orders**, **Required Evidence Tasks**, and **Approved Active Files**.
- Excludes `OPTIONAL`, `NOT_REQUIRED`, and archived tasks from mandatory missing and overdue counts.
- All 6 KPI cards (`Active Orders`, `Overdue Evidence Tasks`, `Awaiting My Review`, `Missing Required Evidence`, `Waiting for Supplier`, `Approved Required Evidence`) are interactive buttons that open the corresponding pre-filtered `Orders` or `My Tasks` view with a filter banner and `← Back to Dashboard`.

### 4. Global Loading & Operation Status Center (`window.EudrOps`)
- Centralized 7-state operation tracker (`IDLE`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `OUTCOME_UNKNOWN`, `CANCELLED`).
- Provides inline button locks (Level 1), section skeletons (Level 2), a blocking progress banner with real chunk telemetry (Level 3), and a persistent topbar Operation Status Center (`#opsStatusBtn` / `#operationCenterPanel`, Level 4).
- Distinguishes definite errors from `OUTCOME_UNKNOWN` (5xx / gateway timeout during writes) so operators verify records before re-submitting.
