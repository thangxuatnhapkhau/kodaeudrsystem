# P2-D Global Loading & Operation Status Center Design

## 1. Operation State Machine

`window.EudrOps` manages all user-triggered and background operations using seven explicit states:

- `IDLE`: No active operations.
- `QUEUED`: Operation queued before execution.
- `RUNNING`: Operation in flight.
- `SUCCEEDED`: Operation completed and verified by backend response.
- `FAILED`: Definite failure (4xx validation/permission error); user input is preserved for correction.
- `OUTCOME_UNKNOWN`: Upstream timeout or 5xx error during a write action where backend persistence cannot be confirmed automatically; form stays open and warns the operator to verify before retrying.
- `CANCELLED`: Cancelled by user or pre-flight check.

## 2. Four Loading & Feedback Levels

| Level | Pattern | Implementation |
|---|---|---|
| **Level 1** | Inline Action Feedback | `EudrOps.lockButton(btn, label)` disables the triggering button, sets `aria-busy="true"`, and prevents duplicate submission. |
| **Level 2** | Section Skeleton Loading | `EudrOps.skeleton(label, rows)` renders accessible `.p2-skeleton` shimmer lines (`role="status"`, `aria-busy="true"`) during PDF preview and panel loads. |
| **Level 3** | Blocking Operation Banner | `#operationBanner` displays current step, real chunk progress bar, and a slow-network hint after 8 seconds (`Still working — waiting for Google Drive / Sheets…`). |
| **Level 4** | Operation Status Center | Topbar `#opsStatusBtn` badge (`running` / `Verify status` / `Failed` / `Operations ready`) opens `#operationCenterPanel` with per-operation history, chunk progress, and error details. |

## 3. Honest Progress Rules

- `validProgress(progress, unitLabel)` only renders a numeric percentage (`0–100%`) when backed by a real measurable unit (`unitLabel`, such as `"2/4 chunks"` or `"1/3 images"`).
- Single-request operations without chunk telemetry use an indeterminate spinner and step label (`Validating information`, `Registering order`, `Saving…`). Fake timer-based progress bars are strictly prohibited.
