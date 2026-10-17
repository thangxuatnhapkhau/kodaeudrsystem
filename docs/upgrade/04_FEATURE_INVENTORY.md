# 04 — FEATURE & UX/UI INVENTORY

- **Project:** KODA EUDR Workspace (`v2.9.4`)
- **Audit Phase:** Phase 0 (Read-Only System Audit — Gate A Deliverable 5 of 7)
- **Audit Timestamp:** 2026-10-16 (Asia/Ho_Chi_Minh)

---

## 1. Classification Legend (Per Section 4.6)

- **`PRESERVE (Working)`**: Functioning reliably in production; must be preserved 100% without regression.
- **`ENHANCE (Working but Slow / Confusing)`**: Functionally working, but suffers from latency, cognitive overload, scroll jumps, or poor ergonomics.
- **`PARTIAL (Partially Implemented)`**: Backend schema/endpoints exist, or basic UI exists, but lacks full workflow integration required by the Master Prompt.
- **`BROKEN (Requires Fix)`**: Exhibits a verified bug, discrepancy, or failure mode.
- **`LEGACY (Redundant / Historical)`**: Superseded by newer v2.7–v2.9 workflows; kept for backward compatibility or scheduled for archival cleanup.

---

## 2. Screen, Tab, Drawer, Modal & Workflow Inventory

### 2.1 Authentication & Account Lifecycle (`public/app.js`, `netlify/functions/auth.mjs`, `AuthService.gs`)

| ID | Screen / Component / Action | Source Location | Classification | Audit Notes & Upgrade Action |
| :--- | :--- | :--- | :---: | :--- |
| `F-01` | **Sign-In Screen (`signIn`)** | `public/app.js:20-27` | `ENHANCE (Working but Slow / Confusing)` | Uses Firebase `signInWithPassword` + `lookup`. Works reliably; upgrade visual hierarchy to Enterprise KODA Login card with clear loading state. |
| `F-02` | **Email Verification Gate (`emailVerification`)** | `public/app.js:28-36` | `PRESERVE (Working)` | Enforces `user.emailVerified === true` before workspace entry (`sendOobCode` + `lookup`). Must be preserved. |
| `F-03` | **Mandatory First-Login Password Change (`changePassword`)** | `public/app.js:37`, `auth.mjs:13-21` | `PRESERVE (Working)` | Enforces `≥12` chars, revokes refresh tokens, and calls `authPasswordChanged`. Note: fix Unicode HMAC parity in `_bridge.mjs` (`AUD-003`). |
| `F-04` | **Forgot Password (`sendOobCode` `PASSWORD_RESET`)** | `public/app.js:25` | `PRESERVE (Working)` | Sends password reset email without account enumeration leak. |
| `F-05` | **Topbar Language Switcher (`EN` / `VI`)** | `public/index.html:23`, `public/i18n.js` | `ENHANCE (Working but Slow / Confusing)` | English default (`EN`) with Vietnamese (`VI`) toggle works, but `public/app.js:159-163` has 4 hardcoded Vietnamese strings in English mode (`AUD-014`). |

---

### 2.2 Main Navigation Screens (`public/app.js`)

| ID | Screen / View (`data-view`) | Source Location | Classification | Audit Notes & Upgrade Action |
| :--- | :--- | :--- | :---: | :--- |
| `F-06` | **Dashboard (`dashboard`)** | `public/app.js:80-98` | `ENHANCE (Working but Slow / Confusing)` | Displays Hero panel, Evidence Progress %, 4 KPI cards (`Active orders`, `Overdue orders`, `In review`, `Missing evidence`), `Needs attention` top 4 tasks, `Recent orders`, and `Notifications`. Enhance with Enterprise KPI cards, quick-filter drilldowns, and Regulatory/Calendar status indicators. |
| `F-07` | **Orders Register (`orders`, `orderTable`, `filters`)** | `public/app.js:66-79, 99-104` | `ENHANCE (Working but Slow / Confusing)` | Supports quick search (`#quickSearch`) and 10 advanced filters (`q`, `status`, `supplier`, `owner`, `material`, `block`, `geo`, `due`, `from`, `to`). Upgrade table/card density, missing-metadata badges (e.g. `SO26-1619` missing customer/due), and filter chips. |
| `F-08` | **New Order Modal (`newOrder`)** | `public/app.js:186-189`, `OrderService.gs:createOrder` | `ENHANCE (Working but Slow / Confusing)` | Multi-product creation + Sales Order PDF upload + duplicate Drive folder check (`findOrderFolders`). Currently calls `syncTaskCalendar_` in a loop if `due` is set (`AUD-006`). |
| `F-09` | **Smart Import (`smartImport` — SO/PO/Excel)** | `public/smart-import.js`, `SmartImportService.gs` | `PRESERVE (Working)` | Supports draft order creation, client-side ExcelJS / OCR parsing, preview hash verification (`previewOrderImport`), and `confirmOrderImport` (verified in live `08_ACTIVITY_LOG` on `2026-10-16T07:21Z`). |
| `F-10` | **My Tasks (`myTasks`, `taskTable`)** | `public/app.js:112-120` | `ENHANCE (Working but Slow / Confusing)` | Groups tasks into `Overdue`, `Due Today`, `Due This Week`, `Awaiting My Review`, `Waiting for Supplier`, `Completed`, plus `All assigned evidence`. Upgrade action density and add quick filter/search. |
| `F-11` | **Calendar (`calendar`) & `syncCalendar` Button** | `public/app.js:264-275`, `CalendarService.gs` | `PARTIAL (Partially Implemented)` | Renders a 7-column month/week/list grid from `state.tasks` (`t.due`) and has a `Sync to Google Calendar` button. However: (a) Only syncs evidence tasks (`04_EVIDENCE_TRACKER`), ignoring Order due/shipment dates, Certificate expiry dates (`06_DOCUMENT_REGISTER.expiry_date`), Review Issue due dates (`37_REVIEW_ISSUES.due_date`), and Legal Review due dates; (b) Ignores `CALENDAR_SYNC_ENABLED` & `REMINDERS_ENABLED` in `09_CONFIG` (`AUD-006`); (c) Lacks sync status badges and direct event links. |
| `F-12` | **AI Assistant / Prompt Studio (`promptStudio`)** | `public/app.js:247-255`, `PromptService.gs` | `LEGACY (Redundant / Historical)` | Original v2.0–v2.4 order-level prompt generator (`DOCUMENT_REVIEW`, `PRICE_REDACTION`, `ENGLISH_SUBTITLE`). Still required by `completeCase()` (`18_AI_PROMPT_RUNS` check on `WorkspaceService.gs:11, 33`) and for Price Redaction / English Subtitle prompts, so **must be preserved**, while guiding users to Material Dossier & Business Review for v2.9 workflows. |
| `F-13` | **Export (`exports`)** | `public/app.js:276-285`, `ExportService.gs` | `PRESERVE (Working)` | Single-order (`exportPackage`) and multi-order (`exportPackages`) ZIP + manifest generation into Drive `Exports/` folder (`19_EXPORT_LOG`). Enforces orphan/superseded exclusion. |
| `F-14` | **Audit Trail (`audit`)** | `public/app.js:286`, `08_ACTIVITY_LOG` | `ENHANCE (Working but Slow / Confusing)` | Renders last 250 rows of `08_ACTIVITY_LOG` in a raw table without search/filter by Order, Actor, or Action type. Add instant client-side filter bar. |
| `F-15` | **Suppliers Directory (`suppliers`, `supplierDialog`)** | `public/app.js:295-305`, `AuthService.gs:26-32` | `PRESERVE (Working)` | Create, edit, and dependency-checked removal (`removeSupplier`) of suppliers in `14_SUPPLIERS`. |
| `F-16` | **Users & Access Management (`users`, `userDialog`, `capabilitiesDialog`)** | `public/app.js:287-294`, `AuthService.gs:14-24, 33-46, 91` | `PRESERVE (Working)` | Manages `05_OWNER_MASTER`, Firebase provisioning (`provision`), login enable/disable (`setEnabled`), two-step user removal (`prepareRemoveUser` -> `removeUser`), and capability grants (`grantCapabilities`). |
| `F-17` | **Settings (`settings`) / Regulatory Control Center** | `public/app.js:306-312`, `AuthService.gs:47-60`, `IntelligencePolicyService.gs` | `PARTIAL (Partially Implemented)` | Currently renders basic text inputs for `09_CONFIG` and a 3-field `saveCountryRisk` form. Lacks the 3-layer **Regulatory Control Center** (Workstream E: EU EUDR Official Rules + Annex I HS Furniture Mapping + Country Risk Benchmarking Table + Customer Compliance Rules + KODA Internal SOPs + Human Confirmation Workflow). |

---

### 2.3 Order Workspace & Sub-Tabs (`public/app.js:129-176` & Companion Modules)

| ID | Sub-Tab / Drawer / Feature | Source Location | Classification | Audit Notes & Upgrade Action |
| :--- | :--- | :--- | :---: | :--- |
| `F-18` | **Order Header & Readiness Summary (`.workspace-summary`)** | `public/app.js:156` | `ENHANCE (Working but Slow / Confusing)` | Shows SO, Product names, Customer, Owner, Shipment Date, Due Date, Readiness progress bar, Product Image preview (`getDocument` called on every render — `PERF-004`), and action buttons. Enhance with missing-metadata callouts and cached product image. |
| `F-19` | **Tab 1: Evidence Workspace (`#orderEvidencePanel`)** | `public/app.js:158-163` | `ENHANCE (Working but Slow / Confusing)` | Master selector for `Products` -> `Materials` (`All materials` toggle) -> `PO / lot source` -> `Supply Chain` (`KODA` + upstream nodes) -> 4 Evidence Blocks (`01_Commercial_Shipping`, `02_Certifications_Chain_of_Custody`, `03_Legality_Compliance`, `04_Geolocation`). Full DOM replacement causes scroll jumps (`AUD-010`). |
| `F-20` | **Product · Material · PO / Lot Trace Graph (`EudrTrace.open`)** | `public/trace.js`, `TraceService.gs` | `PRESERVE (Working)` | Manages `29_MATERIAL_SOURCES`, `30_PRODUCT_MATERIAL_USAGE`, `31_SOURCE_EDGES`, `34_SOURCE_RECORD_LINKS`, and safe material removal (`previewMaterialRemoval` / `applyMaterialRemoval`). |
| `F-21` | **Material Dossier · Upload, OCR/AI & Results (`dossierHub` / `EudrMaterialReview`)** | `public/material-review.js`, `MaterialReviewService.gs` | `PRESERVE (Working)` | v2.9.4 core workflow: multi-PDF upload (`v2.9.2`), Preliminary vs Confirmed PO/Lot source (`prepareMaterialReviewSource`), ChatGPT prompt with mandatory validation (`v2.9.4`), `Refresh results from Drive`, and `applyMaterialChainProposal`. Verified working in production logs (`2026-10-16`). |
| `F-22` | **Previous Whole-SO Dossier Reviews (`legacyDossier` / `EudrDossier`)** | `public/dossier.js`, `DossierService.gs` | `LEGACY (Redundant / Historical)` | Accessible under `<details class="legacy-dossier-access">` for historical whole-SO reviews, plus shares `beginDossierUpload`/`relayDossierChunk` infrastructure used by `material-review.js`. Must be preserved. |
| `F-23` | **GEO Review & Leaflet Map Modal (`geo` / `EudrGeo.open`)** | `public/geo.js`, `public/geo.css`, `GeoService.gs` | `PRESERVE (Working)` | Upgraded in `v2.9.4`: self-hosted Leaflet 1.9.4 + OSM tiles, `.geojson`/`.json` local preview, explicit closed `LineString` -> `Polygon` conversion checkbox, original GeoJSON evidence save (`04_Geolocation`), and `saveGeo` / `reviewGeo`. |
| `F-24` | **Document Viewer & Human Review Drawer (`documentView`)** | `public/app.js:197-244`, `public/pdf-preview.mjs`, `DocumentService.gs` | `ENHANCE (Working but Slow / Confusing)` | Self-hosted PDF.js canvas preview + two-step review confirmation (`IN_REVIEW`, `APPROVED`, `MORE_INFO_REQUIRED`, `REJECTED`), comments, version history, and processed copies. Needs Zoom controls, page jump input, byte caching (`PERF-004`), and full SHA-256/lineage metadata display (`AUD-009`). |
| `F-25` | **Tab 2: Ask KODA AI (`workspaceTab === 'chat'`)** | `public/workspace-chat.js`, `public/intelligence.js`, `WorkspaceChatService.gs`, `IntelligenceService.gs` | `PRESERVE (Working)` | Existing workspace Q&A over indexed OCR/metadata (`askKodaWorkspace`, `getKodaWorkspaceHistory`, `getWorkspaceChatIndex`). Per Section 2: *"The existing AI review functionality must remain operational. New AI chatbot development is not approved."* |
| `F-26` | **Tab 3: AI Review (`workspaceTab === 'review'`)** | `public/intelligence.js`, `ReviewBridgeService.gs` | `PRESERVE (Working)` | KODA Business Review Pack preparation (`prepareKodaBusinessReview`), Drive sync (`syncKodaBusinessReviewResults`), and dashboard (`getKodaReviewDashboard`). Verified in live logs on `2026-10-16T06:50Z`. |
| `F-27` | **Tab 4: Documents / Classification & Split (`workspaceTab === 'classify'`)** | `public/intelligence.js`, `ClassificationService.gs` | `ENHANCE (Working but Slow / Confusing)` | Page-range classification (`previewKodaDocumentClassification`) and client-side `PDF-Lib` child PDF creation (`saveKodaDocumentClassification`). Enhance UX in Workstream D with side-by-side PDF page preview, clear page-range validation, and parent-child lineage badges. |
| `F-28` | **Tab 5: Issues (`workspaceTab === 'issues'`)** | `public/intelligence.js`, `IssueService.gs` | `PRESERVE (Working)` | Tracks `37_REVIEW_ISSUES` (`createKodaReviewIssue`, `updateKodaReviewIssue`, `refreshKodaReviewScope`). Connect issue `due_date` to Workstream F Calendar follow-up! |
| `F-29` | **Tab 6: Customer Submission (`workspaceTab === 'customer'`)** | `public/intelligence.js`, `CustomerSubmissionService.gs` | `PRESERVE (Working)` | Manages BOM components (`38_PRODUCT_COMPONENTS`), Customer PO mappings (`39_CUSTOMER_PO_MAPPING`), readiness checks (`checkKodaCustomerReadiness`), and submission packages (`41_CUSTOMER_SUBMISSIONS`). |
| `F-30` | **Final Dossier Check & Internal Closure (`finalDossier` / `completeCase`)** | `public/app.js:178-182`, `WorkspaceService.gs:9-18, 21-34` | `PRESERVE (Working)` | Evaluates all blockers (`getDossierReview`) and requires human confirmation note to close (`completeCase`) or reopen (`reopenCase`). |

---

## 3. Lucian UX/UI Library Audit & Component Selection (Workstream C)

### 3.1 Verification of Lucian UX/UI Prompt Library (`https://lucianlabs.dev/uxui-prompt/`)
- **Source Repository Verified**: `https://github.com/Seokwoooo/lucian-uxui-prompt` (`v1.5.0`, **MIT License**).
- **Architecture of Lucian Library**: A catalog of 200+ UI/animation design patterns categorized into `interactive` (`001–047`), `Perceptual` (`075`), `structural` (`087–101`), `data` (`189`), etc.
- **Compliance & CSP Constraint Analysis**:
  - KODA EUDR Workspace enforces a strict Content Security Policy (`script-src 'self' 'wasm-unsafe-eval'; style-src 'self'`) with **zero inline styles (`style="..."`)** and **no external CDN scripts** (verified by `tests/upstream-and-preview.test.mjs:49, 58-59`).
  - Therefore, every selected Lucian pattern must be implemented using **pure external CSS (`public/style.css`) + clean semantic DOM classes (`data-*` / `aria-*`)**, with `@media (prefers-reduced-motion: reduce)` fallbacks and `0` third-party animation libraries (no GSAP/Three.js/Framer Motion).

### 3.2 Candidate Component Audit & Selection Matrix (Section 7)

| Candidate ID | Pattern Name | Suitability for B2B EUDR Compliance Workspace | Decision | Planned Adaptation in KODA EUDR Workspace |
| :---: | :--- | :--- | :---: | :--- |
| **`#040`** | **Sliding Tab Indicator** | High — clarifies active tab switching in Order Workspace (`Evidence`, `Ask KODA AI`, `AI Review`, `Documents`, `Issues`, `Customer`) and Regulatory Control Center. | **SELECTED (Adopt)** | Pure CSS active tab pill/underline transition (`180ms cubic-bezier(0.22, 1, 0.36, 1)`) on `.order-tabs` and `.sidebar #nav`. |
| **`#042`** | **Skeleton Loading Shimmer** | High — eliminates blank/freezing feeling during `bootstrap`, `getDossierHub`, and `documentView` PDF loading. | **SELECTED (Adopt)** | Pure CSS `.skeleton-shimmer` gradient animation (`background-size: 200% 100%`) disabled under `prefers-reduced-motion: reduce`. |
| **`#032`** | **Interactive Step Progress** | High — clarifies multi-step workflows (Order Creation → Material Confirmation → PO/Lot Source → Evidence Collection → Human Review → Export & Closure). | **SELECTED (Adopt)** | Structured workflow stepper component in Order Workspace & Dossier Split Studio showing completed, active, and blocked stages. |
| **`#039`** | **Accordion Smooth Expand** | High — improves progressive disclosure for `<details class="filter-panel">`, `<details class="document-details">`, and evidence block sections. | **SELECTED (Adopt)** | Smooth CSS disclosure indicator rotation and panel reveal for `<details>` elements without inline styles. |
| **`#046`** | **Toast Notification Stack** | High — replaces single plain-text `#msg` banner that scrolls out of view when users perform actions lower on the page. | **SELECTED (Adopt)** | Accessible `role="status"` / `aria-live="polite"` sticky notification bar / toast styling for `#msg` with semantic status tones (success, warning, error) while preserving `$('msg').textContent` compatibility for existing tests! |
| **`#189`** | **Live Metric Pulse** | Medium-High — highlights overdue tasks, `LEGAL_REVIEW_DUE`, and active upload/sync states in KPI cards and topbar dot. | **SELECTED (Adopt)** | Subtle status pulse on `.topbar-dot` and `.kpi.alert` / `.evidence-state--overdue` badges (`prefers-reduced-motion` safe). |
| **`#101`** | **Floating Action Dock** | Medium — helpful for sticky PDF viewer toolbar (Page jump + Zoom + Download) inside `documentView`. | **SELECTED (Adopt — Scoped)** | Applied specifically to `.pdf-preview-toolbar` so page navigation and zoom controls remain floating/sticky while scrolling tall PDFs. |
| **`#004`** | **Spotlight Border Card** | Low — mouse-tracking radial gradient borders require `mousemove` CSS variable injection (violating strict `no-inline-style` rule in `tests/upstream-and-preview.test.mjs:49`). | **REJECTED** | Replaced by clean, deterministic KODA green focus/hover border elevation (`border-color: var(--green); box-shadow`). |
| **`#075`** | **Morphing SVG Loader** | Low — decorative SVG morphing adds visual noise compared to a clean compliance progress bar + skeleton state. | **REJECTED** | Existing `.spinner` + `#042` Skeleton Shimmer + determinate `<progress>` bars provide clearer operational feedback. |
