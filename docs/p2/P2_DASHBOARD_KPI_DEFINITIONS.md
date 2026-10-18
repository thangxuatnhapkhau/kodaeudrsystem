# P2-C Dashboard KPI Definitions & Formulas

## 1. Resolution of Baseline Mixed-Unit Bug

In the pre-P2 baseline, `.hero-panel` computed `overdue.length + missing.length + reviewing.length`, where `overdue` counted **Orders** (`01_SO_MASTER`) and `missing` / `reviewing` counted **Evidence Tasks** (`04_EVIDENCE_TRACKER`), and `missing` included `OPTIONAL` tasks.

In P2, `computeDashboardMetrics()` enforces strict unit separation and excludes `OPTIONAL`, `NOT_REQUIRED`, and archived (`active === 'NO'`) tasks from mandatory counts via `isRequiredTask(t)`:

```js
function isRequiredTask(t) {
  return Boolean(
    t &&
    t.active !== 'NO' &&
    t.required !== 'NO' &&
    t.override_state !== 'NOT_REQUIRED' &&
    t.override_state !== 'OPTIONAL'
  );
}
```

## 2. Six Standardized KPI Cards

| KPI ID | Card Label | Unit | Exact Formula (`computeDashboardMetrics`) | Click Destination |
|---|---|---|---|---|
| `ACTIVE_ORDERS` | **Active Orders** | Orders (`01_SO_MASTER`) | `state.cases.filter(c => c.status !== 'CLOSED')` | Opens `Orders` with `dashboardKpiFilter = 'ACTIVE_ORDERS'` and filter banner. |
| `OVERDUE_TASKS` | **Overdue Evidence Tasks** | Required Tasks (`04_EVIDENCE_TRACKER`) | `openRequiredTasks.filter(t => t.status !== 'APPROVED' && t.due && t.due < today())` (sub-label shows overdue order count separately). | Opens `My Tasks` filtered to `OVERDUE_TASKS` with `← Back to Dashboard`. |
| `AWAITING_REVIEW` | **Awaiting My Review** | Tasks (`04_EVIDENCE_TRACKER`) | Active tasks in `['UPLOADED','SUBMITTED','IN_REVIEW']` where `assigned_reviewer === user.email` or unassigned within reviewer's scope. | Opens `My Tasks` filtered to `AWAITING_REVIEW` with `← Back to Dashboard`. |
| `MISSING_REQUIRED` | **Missing Required Evidence** | Required Tasks (`04_EVIDENCE_TRACKER`) | `openRequiredTasks.filter(t => t.status === 'MISSING')` (strictly excludes `OPTIONAL` and `NOT_REQUIRED`). | Opens `My Tasks` filtered to `MISSING_REQUIRED` with `← Back to Dashboard`. |
| `WAITING_SUPPLIER` | **Waiting for Supplier** | Required Tasks (`04_EVIDENCE_TRACKER`) | `openRequiredTasks.filter(t => Boolean(t.supplier_id) && ['MISSING','REQUESTED','MORE_INFO_REQUIRED','REJECTED'].includes(t.status))` | Opens `My Tasks` filtered to `WAITING_SUPPLIER` with `← Back to Dashboard`. |
| `APPROVED_REQUIRED` | **Approved Required Evidence** | Required Tasks (`04_EVIDENCE_TRACKER`) | `requiredTasks.filter(t => t.status === 'APPROVED')` over `requiredTasks.length` (sub-label shows `%` and approved active files). | Opens `My Tasks` filtered to `APPROVED_REQUIRED` with `← Back to Dashboard`. |
