# P2 Staging UAT Checklist — KODA EUDR Workspace

## 1. Context-Aware Navigation (P2-A)
- [ ] Open `Dashboard` → `Orders` → select an Order (e.g., `SO25-2183`) → select a Material (`Solid Walnut`) → select a PO/lot Source → click `GEO Review` → click `View` on a source PDF.
- [ ] Click `← Back to GeoJSON Map` in the drawer header (or topbar `← Back`) and verify the GeoJSON map reopens with the same selected plot and zoom level.
- [ ] Click `← Back` again and verify the drawer closes and the Order Workspace still has the exact Material and PO/lot Source selected.
- [ ] Click `Forward →` and verify the previous step is restored.
- [ ] Refresh the browser (`F5`) while inside an Order Workspace and verify the Order, Material, and Source selection recover automatically.
- [ ] Edit a field in `Edit Order` without saving and click another sidebar tab; verify the unsaved-changes confirmation prompt appears.

## 2. Sidebar & Workspace Navigation Redesign (P2-B)
- [ ] Verify the official KODA logo (`/koda-logo.png`) and dark green `#0b2923` sidebar styling are unchanged.
- [ ] Verify sidebar items are grouped under `OPERATIONS`, `EUDR MANAGEMENT`, and `ADMINISTRATION`.
- [ ] Click `◂` (`#sidebarCollapseBtn`) on desktop to collapse the sidebar to icon/compact width, and click `▸` to expand it.
- [ ] Open an Order, navigate to `Calendar`, and verify the `Active order context` card in the sidebar displays the Order number and returns directly to that Order when clicked.
- [ ] Switch language to `Tiếng Việt` and back to `English`; verify all sidebar groups, breadcrumbs, and KPI labels translate cleanly.

## 3. Operational Dashboard & Actionable KPIs (P2-C)
- [ ] Verify the 6 KPI cards (`Active Orders`, `Overdue Evidence Tasks`, `Awaiting My Review`, `Missing Required Evidence`, `Waiting for Supplier`, `Approved Required Evidence`) display explicit units.
- [ ] Mark a task as `OPTIONAL` and verify `Missing Required Evidence` and `Overdue Evidence Tasks` exclude it.
- [ ] Click `Overdue Evidence Tasks` and verify `My Tasks` opens with the filter banner (`Filtered from Dashboard KPI: Overdue Evidence Tasks`) and `← Back to Dashboard` button.
- [ ] Click `Active Orders` and verify `Orders` opens filtered to open orders (`status !== 'CLOSED'`).

## 4. Global Loading & Operation Status Center (P2-D)
- [ ] Trigger a save or upload action and verify the topbar Operation Status pill (`#opsStatusBtn`) updates to `running` and `#operationBanner` shows the current step.
- [ ] Click `#opsStatusBtn` to open the Operation Status Center panel (`#operationCenterPanel`) and verify recent operations and their states (`RUNNING`, `SUCCEEDED`, `FAILED`, `OUTCOME_UNKNOWN`) are listed.
