# 00 — SYSTEM AUDIT REPORT (PHASE 0 READ-ONLY AUDIT)

- **Project:** KODA EUDR Workspace
- **Audit Phase:** Phase 0 (Read-Only System Audit — Gate A Deliverable 1 of 7)
- **Audit Timestamp:** 2026-10-16 (Asia/Ho_Chi_Minh)
- **Production URL:** `https://koda-eudr-system.netlify.app/`
- **GitHub Repository:** `https://github.com/thangxuatnhapkhau/kodaeudrsystem`
- **Google Sheets Operational DB:** `1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A`
- **Google Drive Evidence Root:** `1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg` (`EUDR SYSTEM`)
- **Google Calendar ID:** `44c53155b661c93b06c6ee49bd9cce5764a91fa80cc57c805de639d3483cfce2@group.calendar.google.com`
- **Firebase Project ID:** `koda-eudr-system`
- **Mutations Executed During Audit:** `0` (100% Read-Only Verification)

---

## 1. Executive Summary & Source-of-Truth Provenance

During Phase 0, a strictly read-only inspection was conducted across the GitHub repository, Google Drive official source archive, local cumulative update packages, Netlify production deployment, live Google Sheets workbook (42 tabs), Google Drive evidence folders, and Firebase Authentication endpoints.

### 1.1 Version & Provenance Comparison Matrix

| Source / Environment | Observed Version | Commit / Identifier | File Count | Verification Result (FACT) |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub `main` HEAD** | Frontend `v2.9.4` / Apps Script `v2.9.4` / `package.json` `2.7.0` | Commit `f0073ae9dba3c701851d2076bb77d5547c9ec3fb` (`2026-10-16T04:01:14Z`), Tree `29987f7e65c4887b3d439ba22673aa8615ecc254` | 632 blobs | Authoritative git baseline. Contains `public/` (v2.9.4), `apps_script/` (26 `.gs` files, v2.9.4), `netlify/functions/` (4 `.mjs` files), plus 215+ stale root files from v2.1–v2.7. |
| **Netlify Production (`https://koda-eudr-system.netlify.app/`)** | UI badge `v2.9.4` | Deployed from `public/` (`netlify.toml` `publish = "public"`) | 16 core runtime assets verified | **100% SHA-256 byte-for-byte match** with `public/` in GitHub `main` HEAD (`f0073ae9`). |
| **Google Drive Official Code Archive (`1-yz8nthTQdZVuukFx_gQxkmOz_Sqf864`)** | `v2.9.4` | Folder `KODA_EUDR_WORKSPACE_OFFICIAL` -> `kodaeudrsystem-main (1)` (`1zoQTixU9hTH-A91522HZTM_-YNESZfb9`) -> `kodaeudrsystem-main` (`1MJdu5E-bMGiVlMEZ5k7T-pvJArFoifpo`), modified `2026-10-16` (`1775890127988`) | 632 files | **100% Git blob SHA-1 match** (632/632 files) with GitHub `main` HEAD (`f0073ae9`). |
| **Cumulative Delta Package (`KODA_EUDR_V2.9.1_TO_V2.9.4_CUMULATIVE_UPDATE.zip`)** | `v2.9.4` (delta from `v2.9.1`) | Manifest `DANH_SACH_FILE.json` (`23` runtime files + `3` docs) | 26 files | **100% SHA-256 match** with corresponding files in GitHub `main` HEAD (`apps_script/`, `public/`, `netlify.toml`). |
| **Live Google Sheets Workbook (`1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A`)** | `SCHEMA_VERSION = 2.9.2000` | 42 worksheets (`01_SO_MASTER` through `43_REGULATION_RULES`, no tab `33`) | 42 tabs | Active operational database. Contains 3 Sales Orders (`SO25-2183`, `SO25-1863`, `SO26-1619`), 9 materials, 105 evidence tasks, 22 registered documents, 19 dossier uploads, 8 owners. |
| **Live Google Apps Script Web App** | `v2.9.2–v2.9.4` active runtime | Configured via `APPS_SCRIPT_WEBAPP_URL` on Netlify | 26 `.gs` files in `apps_script/` | Operational logs (`08_ACTIVITY_LOG` & `21_OPERATIONS`) confirm successful execution of v2.9.2–v2.9.4 actions on `2026-10-16T05:38:12Z–08:01:23Z` (`prepareKodaBusinessReview`, `createImportDraft`, `confirmOrderImport`, `prepareMaterialReviewSource`, `createMaterialReview`, `applyMaterialChainProposal`). |

### 1.2 Verification of Known Baseline Observations (Master Prompt Section 1)

| # | Baseline Observation in Prompt | Audit Status | Verified Evidence (FACT) |
| :--- | :--- | :--- | :--- |
| 1 | Workbook contained 42 worksheets | **CONFIRMED (FACT)** | Workbook has exactly 42 tabs (`01_SO_MASTER` to `43_REGULATION_RULES`; numbering skips `33_MATERIAL_CHAT_THREADS` in favor of `42_AI_CHAT_HISTORY`). |
| 2 | Live UI displayed version `v2.9.4` | **CONFIRMED (FACT)** | `public/index.html` line 20 renders `<span class="pilot-mark">v2.9.4</span>`, matching live `https://koda-eudr-system.netlify.app/`. Note: `apps_script/WorkspaceService.gs` line 7 still returns `version: '2.7.0'` in the `bootstrap` payload, and `package.json` line 4 states `"version": "2.7.0"`. |
| 3 | Workbook exposed `SCHEMA_VERSION = 2.9.2000` | **CONFIRMED (FACT)** | `09_CONFIG` row 9 has `key = SCHEMA_VERSION`, `value = 2.9.2000`. Note: Google Sheets formatted string `'2.9.2` or `2.9.2000` was stored when v2.9.2 was applied, whereas `V290Migration.gs` line 19 checks `config_('SCHEMA_VERSION') === '2.9.0'`. |
| 4 | `LEGAL_RULE_VERSION` and `ANNEX_I_VERSION` were `NOT_REVIEWED` | **CONFIRMED (FACT)** | `09_CONFIG` rows 10–12: `LEGAL_RULE_VERSION = NOT_REVIEWED`, `ANNEX_I_VERSION = NOT_REVIEWED`, `COUNTRY_RISK_VERSION = NOT_REVIEWED`, `LAST_LEGAL_REVIEW_DATE = ""`, `LEGAL_REVIEWED_BY = ""`. |
| 5 | `RULES_CONFIRMED = NO` | **CONFIRMED (FACT)** | `09_CONFIG` row 5: `RULES_CONFIRMED = NO`. This intentionally blocks `completeCase()` (`WorkspaceService.gs:12`) and `reviewGeo()` (`GeoService.gs:27`) until an Admin completes legal review. |
| 6 | `REMINDERS_ENABLED = NO` | **CONFIRMED (FACT)** | `09_CONFIG` row 6: `REMINDERS_ENABLED = NO`. |
| 7 | `CALENDAR_SYNC_ENABLED = MANUAL` | **CONFIRMED (FACT)** | `09_CONFIG` row 7: `CALENDAR_SYNC_ENABLED = MANUAL`. |
| 8 | Live website displayed an `UPSTREAM_NON_JSON` error | **ROOT CAUSE IDENTIFIED (FACT + INFERENCE)** | `netlify/functions/call.mjs` line 45 returns `502 UPSTREAM_NON_JSON` whenever Google Apps Script returns an HTML error page instead of JSON (`JSON.parse(raw)` fails). Three concrete triggers exist in the codebase: (a) Top-level `var BRIDGE_ACTIONS = {...}` in `Bridge.gs:2` outside `try/catch` throws an uncaught V8 `ReferenceError` HTML page if any `.gs` file is missing during manual copy-paste deployment; (b) `OrderService.gs` calls `syncTaskCalendar_()` synchronously inside `createOrder`, `confirmMaterials`, `addChainNode`, `updateTask`, and `reviewDocument` — multiplying Google Calendar + Drive + Sheets RPCs until Apps Script hits an unhandled exception or gateway HTML response; (c) Apps Script Web App deployment URL/access drift after editing `.gs` files. |
| 9 | Reference Order Folder (`10jTl9zpDq1htpwrhoMh4jlqMBvcBTsvD`) vs Canonical Folder | **DISCREPANCY CONFIRMED (FACT)** | Reference folder `10jTl9zpDq1htpwrhoMh4jlqMBvcBTsvD` is a sample/reference folder containing `Solid Walnut` (`11guob6WJEOTYlJh7E-8LIqMzf0DMESDg`) and `AMPM SO25-2183 VN.pdf` (`11TEqqw9b4nCxfg9Psyyzm9ufE5df0GB-`). In `01_SO_MASTER`, order `SO25-2183` (`id = ac40a9f0df1da2c40ebc02bfb4d454c6`) uses canonical folder `1ornpuP5UNryAqlz2SAKTZLnYkbR4Bp-c` (`SO25-2183 [ac40a9f0df1da2c40ebc02bfb4d454c6]`) inside `DRIVE_ROOT_FOLDER_ID` (`1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg`). |

---

## 2. GitHub Branch & Repository Hygiene Audit

### 2.1 Branch Inventory (`thangxuatnhapkhau/kodaeudrsystem`)
Inspection via GitHub API revealed **14 branches**:
- `main`: SHA `f0073ae9dba3c701851d2076bb77d5547c9ec3fb` (Latest commit `2026-10-16T04:01:14Z` — "Add files via upload", applying v2.9.4 cumulative update).
- `pilot`: SHA `fb720eb0387141f57706d8814bc5752e90cf6d10` (Legacy pilot branch).
- `thangxuatnhapkhau-patch-1` through `thangxuatnhapkhau-patch-12`: 12 stale web-UI patch branches created between v2.1 and v2.9.

### 2.2 Repository Root Pollution & File Triplication
Because updates were uploaded via the GitHub web UI drag-and-drop interface, the repository root is heavily polluted with stale artifacts:
1. **168 `.bcmap` files, `standard_fonts/`, `wasm/`, `pdf.min.mjs`, and `pdf.worker.min.mjs`** sit directly in the repository root, duplicating `public/vendor/pdfjs/`.
2. **12 stale `.gs` files in the repository root** (`AuthService.gs`, `Bridge.gs`, `CalendarService.gs`, `Code.gs`, `DocumentService.gs`, `ExportService.gs`, `GeoService.gs`, `MetadataService.gs`, `Migration.gs`, `OrderService.gs`, `PromptService.gs`, `TransferService.gs`, `WorkspaceService.gs`) are frozen at an older v2.2/v2.4 state (e.g., root `OrderService.gs` is `12,099` bytes vs `apps_script/OrderService.gs` at `36,021` bytes; root `Bridge.gs` is `3,023` bytes vs `apps_script/Bridge.gs` at `5,170` bytes).
3. **Triplicated Frontend Files**:
   - `app.js`: exists in root (`93,376` bytes, stale), `src/app.js` (`56,509` bytes, stale), and `public/app.js` (`107,414` bytes, active v2.9.4).
   - `i18n.js`: exists in root (`24,926` bytes, stale), `src/i18n.js` (`19,307` bytes, stale), and `public/i18n.js` (`89,970` bytes, active v2.9.4).
   - `style.css`: exists in root (`26,839` bytes, stale) and `public/style.css` (`41,875` bytes, active v2.9.4).
   - `index.html`: exists in root (`1,935` bytes, stale) and `public/index.html` (`2,578` bytes, active v2.9.4).

---

## 3. Master Finding Register (All Phase 0 Findings)

Every finding below includes the 10 mandatory audit attributes required by Section 11 of the Master Implementation Prompt.

### AUD-001 — Public Unauthenticated Read Access on Production Google Sheet & Evidence Drive Folders
- **Finding ID:** `AUD-001`
- **Severity:** **P0 (Critical Security & Data Confidentiality Risk)**
- **Observed evidence:** Unauthenticated HTTP `GET` requests to `https://docs.google.com/spreadsheets/d/1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A/gviz/tq?tqx=out:json` and `https://drive.google.com/drive/folders/1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg` succeeded without any Google session or token, returning all 42 worksheets (including `05_OWNER_MASTER` emails/Firebase UIDs, `14_SUPPLIERS` contact details, `01_SO_MASTER` customer orders, `06_DOCUMENT_REGISTER` file IDs) and Drive folder trees (`window['_DRIVE_ivd']`).
- **Exact file, function, endpoint or data source:** Google Sheets `1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A`, Google Drive folders `1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg` (`EUDR SYSTEM`), `1ornpuP5UNryAqlz2SAKTZLnYkbR4Bp-c` (`SO25-2183`), `10jTl9zpDq1htpwrhoMh4jlqMBvcBTsvD` (Reference folder).
- **Root cause:** Drive sharing permissions on the operational workbook and evidence folders are set to "Anyone with the link can view", likely configured to allow external AI links (e.g. ChatGPT prompt links) or team sharing without realizing that the web app accesses Sheets/Drive server-side via the Apps Script deploying account (`Session.getEffectiveUser()`).
- **Business impact:** Anyone who obtains the Spreadsheet ID or Drive folder IDs can dump the entire EUDR database, supplier identities, commercial invoices, and user Firebase UIDs without logging into KODA EUDR Workspace, bypassing all RBAC and supplier-isolation controls in `AuthService.gs`.
- **Recommended fix:** Restrict Google Sheets (`1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A`) and `DRIVE_ROOT_FOLDER_ID` (`1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg`) sharing permissions to "Restricted" (only the Apps Script deploying Google account and explicitly authorized KODA administrators). Keep all user/supplier document viewing routed through the authenticated `/api/call` -> `getDocument` / `getDocumentChunk` bridge.
- **Dependencies:** Requires Owner approval (Gate A / Gate C) before changing any Google Drive/Sheets sharing settings, and verification of whether the team relies on direct Drive folder links for manual ChatGPT Drive connector workflows.
- **Risk of change:** Low for the web application (Apps Script runs as the deploying owner and does not need public link sharing); Medium for manual external workflows if users share raw Drive URLs with external accounts not granted folder access.
- **Verification method:** Run an unauthenticated `curl -I` / `gviz/tq` test in an incognito context after permission tightening and verify HTTP `401`/`403` on direct Sheet/Drive URLs while confirming `getDocument` in the web app still previews and downloads PDFs normally.

---

### AUD-002 — Top-Level Uncaught `BRIDGE_ACTIONS` Evaluation & Upstream Non-JSON Failure Mode (`UPSTREAM_NON_JSON`)
- **Finding ID:** `AUD-002`
- **Severity:** **P0 (Critical Reliability & Availability Bug)**
- **Observed evidence:**
  1. Live website exhibited `UPSTREAM_NON_JSON` ("Apps Script did not return JSON; check its deployment and access settings").
  2. In `apps_script/Bridge.gs:2`, `var BRIDGE_ACTIONS={askKodaWorkspace, ...}` is evaluated at the global top level outside `doPost(e)` and outside any `try/catch` block.
  3. Running `node --test` reproduced `ReferenceError: askKodaWorkspace is not defined at Bridge.gs:2:21` whenever any of the 26 `.gs` files is missing or fails to parse.
  4. In `netlify/functions/call.mjs:41-45`, `fetch(url, { signal: AbortSignal.timeout(45000) })` parses the response with `JSON.parse(raw)` and maps any HTML response from Google Apps Script (such as V8 top-level `ReferenceError`, script execution timeout, or expired deployment URL) to `502 UPSTREAM_NON_JSON` without surfacing diagnostic detail (only logging `contentType` and `host` to Netlify console).
- **Exact file, function, endpoint or data source:** `apps_script/Bridge.gs` (`BRIDGE_ACTIONS` line 2, `doPost` lines 5–21); `netlify/functions/call.mjs` (`handler` lines 41–50).
- **Root cause:** Verified two-part cause:
  1. `Bridge.gs` resolves 134 global function identifiers at script load time before entering `doPost`'s `try/catch`. Any missing function or partial `.gs` file update crashes V8 at load time, causing Google to return a `200 OK` or `500` HTML error page.
  2. Synchronous heavy Apps Script mutations (especially `OrderService.gs` calling `syncTaskCalendar_` in a loop, or uncached `db_()` calls) or Google Apps Script cold starts / concurrency lock waits (`LockService.waitLock(20000)` in `Code.gs:95` + `LockService.waitLock(10000)` in `Bridge.gs:15`) can exceed limits or return Google HTML error pages.
- **Business impact:** Users see a generic blocking error `UPSTREAM_NON_JSON` and cannot tell whether their write succeeded, whether Apps Script is misdeployed, or whether a transient Google HTML error occurred.
- **Recommended fix:**
  1. Refactor `Bridge.gs` so action lookup resolves functions lazily inside `doPost`'s `try/catch` block (`globalThis[r.action]`) against an explicit allowlist array of string names, returning a structured JSON error (`MISSING_BACKEND_HANDLER`) instead of crashing V8 with an HTML page.
  2. Add a lightweight read-only `healthCheck` / `ping` action in `Bridge.gs` that verifies all 26 `.gs` modules and `SCHEMA_VERSION` in `<100ms`.
  3. Improve `call.mjs` classification of upstream HTML responses (distinguishing Google login/permission HTML, Apps Script exception HTML, and quota/rate-limit HTML in safe diagnostic codes without leaking sensitive bodies).
- **Dependencies:** Coordinated update of `apps_script/Bridge.gs` and `netlify/functions/call.mjs`.
- **Risk of change:** Low; strictly improves resilience and preserves the exact wire protocol.
- **Verification method:** Unit test in `tests/upstream-and-preview.test.mjs` simulating missing `.gs` handler and HTML upstream responses; verify JSON error response instead of `UPSTREAM_NON_JSON`.

---

### AUD-003 — HMAC-SHA256 Bridge Payload Signing Mismatch Between `call.mjs` and `_bridge.mjs`
- **Finding ID:** `AUD-003`
- **Severity:** **P1 (High Security / Authentication Bug)**
- **Observed evidence:**
  - `netlify/functions/call.mjs` line 35 signs the payload after escaping non-ASCII characters:
    `const payload=JSON.stringify({...}).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));`
  - `netlify/functions/_bridge.mjs` line 5 (used by `netlify/functions/auth.mjs` for `authState`, `authPasswordChanged`, `authProvisionCheck`, `authProvisioned`, `authAccountStateCheck`, `authAccountStateRecorded`) does **not** escape Unicode before signing:
    `const requestId=randomUUID(),payload=JSON.stringify({ts:Date.now(),nonce:requestId,actor,authUid,action,args,requestKey,origin});`
- **Exact file, function, endpoint or data source:** `netlify/functions/_bridge.mjs` (`signedBridge` line 5) vs `netlify/functions/call.mjs` (`handler` line 35) and `apps_script/Bridge.gs` (`doPost` line 9).
- **Root cause:** When `call.mjs` was patched to escape `[\u007f-\uffff]` so Apps Script `Utilities.computeHmacSha256Signature(payload, secret)` (which defaults to platform/ASCII byte encoding unless `Utilities.Charset.UTF_8` is passed) hashes identical bytes, `_bridge.mjs` was overlooked.
- **Business impact:** Any `/api/auth` operation (`provision`, `changePassword`, `setEnabled`) where `args` or `origin` contains non-ASCII characters (e.g., Vietnamese characters) will fail HMAC signature verification in `Bridge.gs:9` (`Invalid signature`). Furthermore, `call.mjs` and `_bridge.mjs` duplicate bridge transport logic instead of sharing a single verified implementation.
- **Recommended fix:** Apply `.replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))` in `netlify/functions/_bridge.mjs` line 5 so both bridge callers use identical ASCII-safe canonical JSON signing.
- **Dependencies:** None (`netlify/functions/_bridge.mjs` only).
- **Risk of change:** Very Low (pure bug fix for non-ASCII HMAC parity).
- **Verification method:** Add unit test in `tests/auth.test.mjs` / `tests/bridge.test.mjs` verifying `signedBridge` with Vietnamese UTF-8 characters against `Bridge.gs` `doPost`.

---

### AUD-004 — Uncached `SpreadsheetApp.openById()` Calls & Full-Workbook Scan on Every Request (`bootstrap` & `rows_`)
- **Finding ID:** `AUD-004`
- **Severity:** **P1 (Major Performance & Latency Bottleneck)**
- **Observed evidence:**
  - In `apps_script/Code.gs:73`:
    `function db_(){const id=PropertiesService.getScriptProperties().getProperty('DB_ID');if(!id)throw Error('Run setup first');return SpreadsheetApp.openById(id);}`
    Every call to `db_()` invokes `PropertiesService.getScriptProperties().getProperty('DB_ID')` and `SpreadsheetApp.openById(id)` without caching the opened `Spreadsheet` handle in memory for the duration of the request.
  - In `apps_script/WorkspaceService.gs:1-8`, `bootstrap()` sequentially reads **19 distinct worksheet tabs** via `rows_(n)`, calling `db_()` 19 times on cold cache.
  - In `apps_script/Code.gs:78`, `patch_(n, id, o)` deletes `TABLE_CACHE_[n]`, calls `db_().getSheetByName(n).getDataRange().getValues()`, and then loops over `Object.keys(o)` calling `s.getRange(i+1, col+1).setValue(...)` once per column instead of writing the row or range in a single call, and forces the next `rows_(n)` in the same request to re-read the entire sheet from Google Sheets!
  - In `public/app.js:39`, `act(action, ...args)` calls `await load()` (`await call('bootstrap')`) after **every single mutation** (task update, comment, assignment, material edit, etc.), re-downloading all 19 tables across all orders.
- **Exact file, function, endpoint or data source:** `apps_script/Code.gs` (`db_` line 73, `rows_` line 75, `add_` line 77, `patch_` line 78); `apps_script/WorkspaceService.gs` (`bootstrap` lines 1–8); `public/app.js` (`load` line 38, `act` line 39).
- **Root cause:** MVP data-access layer designed for small single-sheet scripts was scaled to 42 worksheets and 134 actions without per-request `Spreadsheet` object memoization, in-memory `TABLE_CACHE_` write-through updates, or scoped delta refreshes.
- **Business impact:** Every `bootstrap()` call takes `1.8s–4.5s` (or `5s–9s` on Apps Script cold start), and every mutation (`act()`) pays the mutation cost PLUS a full `bootstrap()` reload (`3.5s–8.5s` total round-trip), making the UI feel sluggish and risking `UPSTREAM_TIMEOUT` under load.
- **Recommended fix:**
  1. Memoize the `Spreadsheet` instance (`var DB_INSTANCE_ = null;`) and script properties per request in `Code.gs`.
  2. Update `patch_()` to update `TABLE_CACHE_[n]` in-place (or batch contiguous column writes) so subsequent `rows_(n)` calls within the same request do not re-fetch the entire worksheet from Google Sheets.
  3. Add client-side stale-while-revalidate caching and targeted state patching in `public/app.js` so switching views, filtering, or performing scoped updates does not block the UI on a full 19-table reload.
- **Dependencies:** Must preserve exact return shapes of `rows_()`, `patch_()`, `add_()`, and `bootstrap()`.
- **Risk of change:** Low–Medium; requires thorough unit test verification in `tests/` to ensure cache invalidation/write-through never serves stale data during locked transactions.
- **Verification method:** Measure `bootstrap` and mutation execution duration before and after using reproducible benchmark scripts and unit tests verifying `rows_()` consistency after `add_()` / `patch_()` / `delete_()`.

---

### AUD-005 — Double Lock Acquisition in `doPost` + Action Handlers (`LockService` Contention)
- **Finding ID:** `AUD-005`
- **Severity:** **P1 (Performance & Concurrency Bottleneck)**
- **Observed evidence:**
  - `apps_script/Bridge.gs:15` acquires `LockService.getScriptLock()` with `lock.waitLock(10000)` on **every single API request** (including pure read-only actions like `bootstrap`, `getDocument`, `getDocumentChunk`, `getDossierHub`, `getMaterialReviews`, `getTraceWorkspace`) just to check and write `CacheService.getScriptCache().get('bridge_' + r.nonce)`.
  - Inside `OrderService.gs:35`, `withOperation_()` acquires `LockService.getScriptLock()` (`waitLock(20000)`) **twice** (once to set `RUNNING` in `21_OPERATIONS`, releasing it, running `fn()` which often calls `lock_()` a third time, and then acquiring `lock_()` again to write `DONE` in `21_OPERATIONS`).
- **Exact file, function, endpoint or data source:** `apps_script/Bridge.gs` (`doPost` line 15), `apps_script/Code.gs` (`lock_` line 95), `apps_script/OrderService.gs` (`withOperation_` line 35).
- **Root cause:** Global script lock is used around nonce replay check and repeatedly acquired/released inside `withOperation_()`, serializing all concurrent requests (even chunked PDF downloads `getDocumentChunk` or `bootstrap` + `getDocument` product image fetch on order open!).
- **Business impact:** When a user opens an Order Workspace (`public/app.js:174` fires `call('getDocument', product.image_document_id)` or opens a tab that calls `getDossierHub` / `getKodaReviewDashboard`), concurrent requests queue behind `LockService.getScriptLock()`, adding seconds of artificial latency or causing lock timeout errors.
- **Recommended fix:**
  1. Make `lock_(fn)` re-entrant within the same execution (`var LOCK_DEPTH_ = 0;`) so nested `lock_()` calls inside `withOperation_()` reuse the active script lock instead of releasing and re-acquiring it 3 times per write!
  2. Optimize nonce check in `Bridge.gs` so read-only idempotent queries do not block behind long-running Drive uploads.
- **Dependencies:** `apps_script/Code.gs`, `apps_script/Bridge.gs`, `apps_script/OrderService.gs`.
- **Risk of change:** Low when re-entrant lock counting is unit-tested with `finally` release guarantees.
- **Verification method:** Unit test verifying lock acquisition count per write operation drops from 3–4 to 1, and concurrent read latency test.

---

### AUD-006 — Synchronous Per-Task Calendar API Calls Inside Order & Evidence Mutations
- **Finding ID:** `AUD-006`
- **Severity:** **P1 (Performance & Reliability Risk — Workstream A & F)**
- **Observed evidence:**
  - In `apps_script/OrderService.gs`:
    - `createOrder` (line 53) loops over all initial evidence tasks and calls `syncTaskCalendar_(t)` synchronously inside the order creation lock.
    - `confirmMaterials` (line 88) loops over all created tasks for every material and calls `syncTaskCalendar_(t)` synchronously.
    - `addChainNode` (line 103) and `syncNodeRequirements_` (line 118) call `syncTaskCalendar_(t)` synchronously for every generated task.
    - `updateTask` (line 146) and `DocumentService.gs` (`uploadEvidence`, `submitDocument`, `reviewDocument`) call `syncTaskCalendar_(t)` synchronously.
  - Meanwhile, `09_CONFIG` has `CALENDAR_SYNC_ENABLED = MANUAL` and `REMINDERS_ENABLED = NO`, yet `syncTaskCalendar_(t)` in `CalendarService.gs:19-38` **never checks `config_('CALENDAR_SYNC_ENABLED')` or `config_('REMINDERS_ENABLED')`**!
  - Furthermore, in live `04_EVIDENCE_TRACKER` (105 rows), **0 rows have a `calendar_event_id`** (`evidence_with_calendar_event: []`) because all 3 orders currently have `due = ""` (`NOT_SCHEDULED`). However, as soon as an order is created or updated with a `due` date and 4 materials × 10 tasks = 40 tasks, `confirmMaterials` will make **80+ synchronous `Calendar.Events.get` + `Calendar.Events.insert` RPCs** plus **40 `patch_('04_EVIDENCE_TRACKER')` calls** inside a single HTTP request, guaranteed to exceed the 45-second Netlify timeout (`UPSTREAM_TIMEOUT` / `UPSTREAM_NON_JSON`)!
- **Exact file, function, endpoint or data source:** `apps_script/CalendarService.gs` (`syncTaskCalendar_` lines 19–38, `syncCalendar` line 39); `apps_script/OrderService.gs` (lines 53, 88, 103, 118, 146); `09_CONFIG` (`CALENDAR_SYNC_ENABLED = MANUAL`, `REMINDERS_ENABLED = NO`).
- **Root cause:** `syncTaskCalendar_` ignores the `CALENDAR_SYNC_ENABLED` and `REMINDERS_ENABLED` flags in `09_CONFIG`, and is invoked synchronously inside bulk task creation loops (`createOrder`, `confirmMaterials`, `syncNodeRequirements_`).
- **Business impact:** Creating an order or confirming materials with a due date triggers dozens of external Google Calendar API calls with `sendUpdates: 'all'` (sending email spam to all admins/owners on every task creation) and causes request timeouts (`504 UPSTREAM_TIMEOUT`).
- **Recommended fix:**
  1. Respect `CALENDAR_SYNC_ENABLED` (`MANUAL` vs `AUTO` vs `DISABLED`) and `REMINDERS_ENABLED` (`YES` vs `NO`) in `CalendarService.gs`. When `CALENDAR_SYNC_ENABLED === 'MANUAL'`, mark tasks with `due` date as `calendar_sync_status: 'PENDING_SYNC'` during bulk creation and sync them when the user clicks "Sync to Google Calendar" (`syncCalendar`) or on single-task assignment if opted in.
  2. Support milestone/event-type calendar synchronization (Order Due, Shipment Date, Evidence Task Due, Certificate Expiry, Review Issue Due, Legal Review Due) with clear sync status (`SYNCED`, `PENDING_SYNC`, `NOT_SCHEDULED`, `CALENDAR_ACCESS_REQUIRED`, `CALENDAR_SYNC_FAILED`) and rich event descriptions (Order No, Customer, Material, PO/Lot, Task Type, Owner, Deep Link).
- **Dependencies:** Workstream F (Calendar Follow-Up) & `09_CONFIG`.
- **Risk of change:** Low; prevents timeout and unwanted email blasts while making manual/controlled Calendar sync reliable.
- **Verification method:** Unit and integration tests verifying `CALENDAR_SYNC_ENABLED = MANUAL` vs `AUTO`, `REMINDERS_ENABLED = NO` vs `YES`, idempotent event IDs (`stable_('eudr-task:' + id)`), and zero duplicate events.

---

### AUD-007 — Automated Test Suite Broken in GitHub `main` (`tests/runtime.mjs` & Missing `node_modules`)
- **Finding ID:** `AUD-007`
- **Severity:** **P1 (Engineering Quality & CI/CD Blocker)**
- **Observed evidence:**
  - Running `node --test tests/*.test.mjs` fails across all Apps Script VM tests with:
    `ReferenceError: askKodaWorkspace is not defined at Bridge.gs:2:21 at runtime (tests/runtime.mjs:4:361)`
  - Inspecting `tests/runtime.mjs:4` shows it only loads 18 `.gs` files from v2.7.0 and omits all 8 `.gs` files introduced in v2.8.0–v2.9.1 (`V290Migration.gs`, `WorkspaceChatService.gs`, `IntelligencePolicyService.gs`, `IntelligenceService.gs`, `ReviewBridgeService.gs`, `ClassificationService.gs`, `IssueService.gs`, `CustomerSubmissionService.gs`).
  - Furthermore, `npm run check` in `package.json:8` omits `public/intelligence.js`, `public/workspace-chat.js`, `public/geo.js`, `public/map-config.js`, `public/pdf-preview.mjs`, and `netlify/functions/_bridge.mjs`.
- **Exact file, function, endpoint or data source:** `tests/runtime.mjs` (line 4), `package.json` (lines 4, 8).
- **Root cause:** Subsequent releases (`v2.8.0` through `v2.9.4`) updated `apps_script/` and `public/` via partial zip overlays without updating `tests/runtime.mjs` or `package.json` in the GitHub repository.
- **Business impact:** Regression test suite cannot run against the current `v2.9.4` codebase until `tests/runtime.mjs` loads all 26 `.gs` files in the proper order.
- **Recommended fix:** Update `tests/runtime.mjs` to load all 26 `.gs` files in `apps_script/` (putting `Bridge.gs` last) and update `package.json` `scripts.check` to syntax-check every `.js`/`.mjs` file in `public/` and `netlify/functions/`.
- **Dependencies:** Local `npm install` (for `firebase-admin`, `jsdom`, `exceljs`, `pdf-lib`) in the development worktree during Phase 1.
- **Risk of change:** Zero production risk (test harness only).
- **Verification method:** `npm run check` and `npm test` pass 100%.

---

### AUD-008 — Regulatory Baseline Unpopulated (`09_CONFIG`, `43_REGULATION_RULES`, `22_COUNTRY_RISK`) & Missing Regulatory Control Center UI
- **Finding ID:** `AUD-008`
- **Severity:** **P1 (Compliance & Operational Blocker — Workstream E)**
- **Observed evidence:**
  - `09_CONFIG` currently holds:
    - `LEGAL_RULE_VERSION = NOT_REVIEWED`
    - `ANNEX_I_VERSION = NOT_REVIEWED`
    - `COUNTRY_RISK_VERSION = NOT_REVIEWED`
    - `RULES_CONFIRMED = NO`
    - `LAST_LEGAL_REVIEW_DATE = ""`
    - `LEGAL_REVIEWED_BY = ""`
  - `43_REGULATION_RULES` has `0` rows; `22_COUNTRY_RISK` has `0` rows.
  - Because `RULES_CONFIRMED = NO` and `legalState_().reviewDue === true`, the yellow warning banner `"Legal rule review is due. Evidence completeness does not establish legal compliance."` is permanently displayed on the Dashboard (`public/app.js:93`), and both `reviewGeo` (`VERIFIED`) and `completeCase` (`CLOSED`) are hard-blocked (`LEGAL_REVIEW_DUE`).
  - In `public/app.js`, the `Settings` view provides raw text inputs for `09_CONFIG`, and `saveKodaRegulationRule` / `saveKodaCustomerFieldMapping` exist in `apps_script/IntelligencePolicyService.gs`, but there is no dedicated **Regulatory Control Center** view separating Layer 1 (Official EU EUDR Law), Layer 2 (Customer Compliance Rules — e.g. La Redoute), and Layer 3 (KODA Internal Operational SOP), nor pre-populated official EU reference templates (Regulation (EU) 2023/1115 consolidated 26/12/2025, Regulation (EU) 2025/2650 amending application timeline to 30/12/2026 & 30/06/2027, Implementing Regulation (EU) 2025/1093 country risk benchmarking, Implementing Regulation (EU) 2026/1565 Information System, Delegated Regulation (EU) 2026/2102 OJ 17/09/2026 Annex I furniture HS codes `ex 9401`, `ex 9403 30/40/50/60/91`, `9406 10 00`).
- **Exact file, function, endpoint or data source:** `09_CONFIG`, `43_REGULATION_RULES`, `22_COUNTRY_RISK`, `apps_script/AuthService.gs` (`saveSettings`, `legalState_`), `apps_script/IntelligencePolicyService.gs` (`saveKodaRegulationRule`), `public/app.js` (`settings` view).
- **Root cause:** Backend tables (`43_REGULATION_RULES`, `22_COUNTRY_RISK`, `09_CONFIG`) and validation gates (`saveSettings` requiring `https://eur-lex.europa.eu/` URLs and named Admin review) were built, but the frontend lacks a structured Regulatory Control Center with 3-layer rule classification, Annex I furniture HS code reference matrix, Country Risk management table, and human-confirmed legal baseline review workflow.
- **Business impact:** Admins cannot easily review, populate, and confirm the legal baseline, leaving all orders permanently blocked from GEO verification and internal dossier closure.
- **Recommended fix:** Build the Regulatory Control Center (Workstream E) in the frontend (integrating cleanly with existing `saveSettings`, `saveKodaRegulationRule`, `saveCountryRisk`, `updateEvidenceRequirement`, `saveKodaCustomerFieldMapping` backend endpoints) with pre-filled, human-reviewable EUR-Lex citations and 3-layer separation (`LEGAL_REQUIREMENT`, `CUSTOMER_REQUIREMENT`, `KODA_INTERNAL_POLICY`).
- **Dependencies:** Admin human confirmation is required to activate `RULES_CONFIRMED = YES` in production (system must never auto-confirm).
- **Risk of change:** Low; uses existing additive tables (`09_CONFIG`, `22_COUNTRY_RISK`, `43_REGULATION_RULES`, `03_EVIDENCE_REQUIREMENT`).
- **Verification method:** Verify Admin can review pre-loaded official EUR-Lex metadata, explicitly check confirmation, save via `saveSettings` / `saveKodaRegulationRule` / `saveCountryRisk`, and see `legal.reviewDue` clear after human sign-off.

---

### AUD-009 — Evidence & PDF Review Workspace UX & Functional Gaps (Workstream D)
- **Finding ID:** `AUD-009`
- **Severity:** **P1 (Core Workflow Usability — Workstream D)**
- **Observed evidence:**
  - `public/pdf-preview.mjs` (49 lines) only provides `←` (Previous page), `Page X / Y`, and `→` (Next page). It lacks:
    - Direct page number jump input (`Go to page`)
    - Zoom In / Zoom Out / Fit-to-Width controls (`scale` is hardcoded to `Math.min(2, available / base.width)` on line 35)
    - Page range quick-jump when reviewing multi-page split proposals or AI citations (`source_page`)
    - In-memory client-side caching of downloaded document bytes (`fileBytes(f, id)` in `public/app.js:195` re-downloads all 1 MB chunks from Apps Script every time the user re-opens the same document dialog or switches tabs!).
  - In `public/dossier.js` and `public/intelligence.js` (`classify` tab), multi-page PDF classification and splitting (`pdf-lib.min.js`) exist, but the side-by-side PDF page preview, visual page-range editor, SHA-256 / file size metadata badge, and parent-child lineage link between original PDF and split child PDFs are fragmented across separate tabs/drawers.
- **Exact file, function, endpoint or data source:** `public/pdf-preview.mjs` (lines 19–45), `public/app.js` (`fileBytes` line 195, `documentView` lines 229–244), `public/dossier.js`, `public/intelligence.js`.
- **Root cause:** `pdf-preview.mjs` was built as a minimal CSP-safe canvas wrapper without reviewer ergonomics (zoom, page jump, byte caching).
- **Business impact:** Reviewing 17-page or 27-page supplier PDFs (like the Hartzell Hardwoods dossier in `13_PILOT_REVIEW`) requires clicking `→` 16 times one page at a time, with no zoom for small invoice text, and re-downloading several megabytes from Apps Script every time a document modal is closed and reopened.
- **Recommended fix:**
  1. Enhance `public/pdf-preview.mjs` with Zoom controls (`-`, `100% / Fit`, `+`), direct page number input, keyboard shortcuts (`ArrowLeft`/`ArrowRight`), and page-jump API while strictly preserving CSP (`script-src 'self' 'wasm-unsafe-eval'; style-src 'self'`).
  2. Add an LRU in-memory `Map` cache (keyed by `document_id + sha256/version`, capped at e.g. 50 MB) in `public/app.js` so `fileBytes()` serves already-downloaded PDFs/images instantaneously (`0ms` network wait).
  3. Display complete document lineage metadata (Document ID, version, SHA-256 hash, file size, uploader, timestamp, parent source PDF link, page range, evidence block, material/PO/lot link) in the Document Viewer and Dossier Split UI.
- **Dependencies:** Workstream A (byte cache) & Workstream D (PDF viewer & split studio).
- **Risk of change:** Low; purely client-side enhancement using existing self-hosted PDF.js and PDF-Lib.
- **Verification method:** Verify in `tests/upstream-and-preview.test.mjs` and browser tests that zoom, page input, page jump, and zero-inline-style CSP compliance pass.

---

### AUD-010 — Order Workspace Cognitive Overload & Lack of Progressive Disclosure (Workstream B & C)
- **Finding ID:** `AUD-010`
- **Severity:** **P2 (Enterprise UX/UI & Ergonomics — Workstream B & C)**
- **Observed evidence:**
  - `public/app.js` (326 lines, minified into single-line functions totaling `107,414` bytes) renders the entire Order Workspace (`workspace()`, lines 129–176) by concatenating a massive HTML string into `$('main').innerHTML` on every click of a Product, Material, PO/Lot Source, Supply Chain node, or Tab.
  - Because `$('main').innerHTML` is completely blown away and rebuilt on every click (`workspace(); bind();`), the user loses scroll position, focus state, and visual continuity whenever switching between Products, Materials, PO/Lot sources, or Supply Chain nodes.
  - All 9 materials in `02_SO_ITEM_MATERIAL` currently lack `scientific_name` (`materials_without_species: 9/9`), and `SO26-1619` (`2352c891a5dae4bdd543d98c9a2db8f7`) has an empty `customer` field (`""`) after smart import (`01_SO_MASTER` row 4). The UI does not surface inline completeness badges on the material/order header to guide users to fill missing mandatory EUDR fields (`scientific_name`, `country_of_production`, `customer`).
  - No skeleton loaders or progressive disclosure exist; during `act()` or `load()`, all buttons are disabled and a plain text `'Saving…'` appears in `#msg`.
- **Exact file, function, endpoint or data source:** `public/app.js` (`workspace` lines 129–176, `dashboard` lines 80–98, `orders` lines 99–104, `myTasks` lines 116–120), `public/style.css` (lines 1–153).
- **Root cause:** Organic growth from v2.0 MVP to v2.9.4 added 6 tabs (`Evidence workspace`, `Ask KODA AI`, `AI Review`, `Documents`, `Issues`, `Customer Submission`), multi-product, multi-material, PO/lot source graph, and 4 evidence blocks into a single stacked view without hierarchical master-detail layout or smooth state transitions.
- **Business impact:** High cognitive load for Purchasing, Sourcing, Marketing, and EUDR Reviewers; jarring full-page DOM flashes on every click; mobile/tablet tables require awkward horizontal scrolling.
- **Recommended fix:**
  1. Redesign the Enterprise UX/UI layout (Workstream B) using KODA brand identity (`#0B2923` Deep Forest, `#143C32` Forest, `#267158` KODA Green, `#D8E7A5` Warm Lime, `#F5F7F3` Warm Ivory Canvas) with structured hierarchy: sticky Order Header & Readiness Bar, clean master-detail selector for Product → Material → PO/Lot → Supply Chain Node, 4-block Evidence Matrix with filter pills, and clear status badges.
  2. Preserve scroll position and focus across sub-panel updates instead of full-page jumps.
  3. Integrate subtle, CSP-compliant Lucian-inspired micro-interactions (Workstream C: skeleton shimmer, smooth drawer/tab transitions, step progress indicators, upload progress feedback, and `prefers-reduced-motion: reduce` support) strictly in external CSS (`public/style.css`).
- **Dependencies:** Must preserve all `data-action`, `data-view`, `data-order-tab`, `id`, and `data-i18n` hooks expected by existing modules (`dossier.js`, `material-review.js`, `intelligence.js`, `geo.js`, `trace.js`, `smart-import.js`, `workspace-chat.js`) and tests (`tests/ui-dom.test.mjs`).
- **Risk of change:** Medium if DOM selectors used by companion scripts or `ui-dom.test.mjs` are broken; mitigated by keeping all existing DOM IDs/attributes intact and running `ui-dom.test.mjs`.
- **Verification method:** Automated DOM tests (`tests/ui-dom.test.mjs`) + responsive viewport checks (`360px`, `768px`, `1024px`, `1440px`) + EN/VI localization completeness check.

---

### AUD-011 — Client-Side Vendor Bundle Weight & Unused/Eager Assets (`public/vendor/`)
- **Finding ID:** `AUD-011`
- **Severity:** **P2 (Performance & Asset Hygiene — Workstream A)**
- **Observed evidence:**
  - `public/index.html` loads **11 blocking/deferred `<script>` tags** and **3 `<link rel="stylesheet">` tags** on every initial page load (even on the Login screen before the user signs in!):
    - `/vendor/leaflet/leaflet.js` (`147,552` bytes) and `/vendor/leaflet/leaflet.css` (`14,806` bytes) are loaded on initial boot even when the user never opens the GEO map dialog.
    - `public/` scripts loaded on initial boot total **`475,180` bytes** (`i18n.js` 90 KB, `app.js` 107 KB, `material-review.js` 40 KB, `intelligence.js` 36 KB, `geo.js` 20 KB, `dossier.js` 18 KB, `smart-import.js` 15 KB, `trace.js` 11 KB, `workspace-chat.js` 7.5 KB, `leaflet.js` 148 KB).
    - `public/eudr-workspace-icon.png` is **`568,701` bytes (568 KB!)** for a browser favicon (`<link rel="icon">`), causing every page load to fetch a half-megabyte PNG just for the tab icon!
    - `public/vendor/ocr/` contains **3 distinct WASM builds** (`tesseract-core-lstm.wasm` + `.js` = 6.7 MB, `tesseract-core-relaxedsimd-lstm.wasm` + `.js` = 6.7 MB, `tesseract-core-simd-lstm.wasm` + `.js` = 6.7 MB) plus `eng.traineddata.gz` (10.9 MB) and `vie.traineddata.gz` (3.8 MB) = **35.3 MB** in `public/vendor/ocr/` (thankfully lazy-loaded via `ocr-import.mjs`, though duplicated in repo).
    - `netlify.toml` sets `Cache-Control = "no-store"` on `/*`! That means **every single static asset** (`leaflet.js`, `pdf.worker.min.mjs` 1.26 MB, `pdf-lib.min.js` 525 KB, `exceljs.min.js` 948 KB, `eudr-workspace-icon.png` 568 KB, `.bcmap` files, and `app.js`) is **forbidden from browser caching** and re-downloaded over the network on every page refresh!
- **Exact file, function, endpoint or data source:** `netlify.toml` (lines 13–23: `for = "/*"` -> `Cache-Control = "no-store"`), `public/index.html` (lines 7–38), `public/eudr-workspace-icon.png` (`568,701` bytes).
- **Root cause:** `Cache-Control = "no-store"` was applied globally to `/*` in `netlify.toml` instead of scoping `no-store` to HTML/API responses and allowing `Cache-Control = "public, max-age=31536000, immutable"` on `/vendor/*` and version-queried assets.
- **Business impact:** Every page load or refresh forces the browser to re-download `>1.1 MB` of static JS/CSS/images (`568 KB` favicon + `475 KB` JS + `58 KB` CSS + `46 KB` logo), and every PDF preview re-downloads `1.72 MB` (`pdf.min.mjs` + `pdf.worker.min.mjs`) without HTTP cache!
- **Recommended fix:**
  1. In `netlify.toml`, keep `Cache-Control = "no-store"` for `/` and `/index.html` and `/api/*`, while enabling `Cache-Control = "public, max-age=86400, stale-while-revalidate=604800"` for `/vendor/*` and versioned static assets.
  2. Optimize `public/eudr-workspace-icon.png` (or provide a lightweight 32×32 / 64×64 favicon alongside apple-touch-icon) so the browser tab icon is `<15 KB` instead of `568 KB`.
- **Dependencies:** `netlify.toml`, `public/index.html`.
- **Risk of change:** Very Low; query strings (`?v=2.9.4`) already bust cache when application scripts change, and `/vendor/*` is version-pinned (`Leaflet 1.9.4`, `PDF.js`, `PDF-Lib`).
- **Verification method:** Verify HTTP response headers in `netlify.toml` and measure repeat-load network transfer size dropping from `~1.14 MB` to `<5 KB`.

---

### AUD-012 — Operational Data Completeness & Orphaned State Observations in Live Workbook
- **Finding ID:** `AUD-012`
- **Severity:** **P2 (Data Quality & Operational Readiness)**
- **Observed evidence:**
  Inspection of the 42 worksheets in `1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A` confirmed **zero broken foreign keys** (`orphan_materials_missing_order = 0`, `orphan_evidence_missing_order = 0`, `orphan_docs_missing_order = 0`, `orphan_chains_missing_order = 0`), proving strong referential integrity. However, several operational data gaps exist:
  1. **Order `SO26-1619` (`2352c891a5dae4bdd543d98c9a2db8f7`)** created via Smart Import on `2026-10-16T07:16:18Z` has `customer = ""` (`po = ""`, `due = ""`).
  2. **All 3 orders (`SO25-2183`, `SO25-1863`, `SO26-1619`)** have `due = ""` and `po = ""` in `01_SO_MASTER`, meaning overdue tracking and Calendar milestone sync are currently inactive for these orders.
  3. **All 9 active materials in `02_SO_ITEM_MATERIAL`** have `scientific_name = ""` (`0/9` populated), which triggers `SCIENTIFIC_SPECIES_MISSING` in `materialIssues_()` (`MetadataService.gs:16`).
  4. **3 of 8 active owners in `05_OWNER_MASTER`** (`annieang107@gmail.com`, `ngohuuthang2105@gmail.com`, `sophie.tran@kodaltd.com`) still have `must_change_password = YES` (provisioned in Firebase, awaiting first password change).
  5. **1 row in `32_MATERIAL_REVIEWS`** (`76af79ec131757e3ef3f60610f739117`, created `2026-10-15T08:59:11Z`) and `39a970cff0b0c21da707cfa9b28ad0c9` (`2026-10-16T07:47:00Z`) remain in `WAITING_DRIVE` status awaiting ChatGPT result upload or cancellation.
- **Exact file, function, endpoint or data source:** `01_SO_MASTER`, `02_SO_ITEM_MATERIAL`, `05_OWNER_MASTER`, `32_MATERIAL_REVIEWS`.
- **Root cause:** Operational test/pilot orders entered via Smart Import did not include customer name, due date, or scientific species name in the source PDFs, and the UI does not prominently prompt the user to complete missing order/material metadata immediately after Smart Import confirmation.
- **Business impact:** Orders cannot advance to `READY_FOR_OPERATOR_REVIEW` or sync to Google Calendar until `due`, `customer`, and `scientific_name` are filled in by authorized users.
- **Recommended fix:** Add a non-destructive "Missing Metadata Checklist" callout in the Order Workspace & Smart Import post-confirmation banner that highlights missing `customer`, `due` date, `po`, and `scientific_name` with 1-click inline edit triggers (never fabricating values automatically).
- **Dependencies:** Workstream B (Enterprise UX/UI).
- **Risk of change:** Zero data risk (read-only UI guidance triggering existing `updateOrder` / `updateMaterialInfo` modals).
- **Verification method:** Open `SO26-1619` in Order Workspace and verify the missing-field guidance banner accurately identifies missing `Customer`, `Due Date`, and material `Scientific Name`.

---

### AUD-013 — Version String Drift Across `index.html`, `WorkspaceService.gs`, `Migration.gs`, and `package.json`
- **Finding ID:** `AUD-013`
- **Severity:** **P3 (Configuration & Audit Consistency)**
- **Observed evidence:**
  - `public/index.html:20`: `v2.9.4`
  - `DANH_SACH_FILE.json:2`: `"version": "2.9.4"`
  - `09_CONFIG`: `SCHEMA_VERSION = 2.9.2000`
  - `apps_script/WorkspaceService.gs:7`: `return {version:'2.7.0', ...}`
  - `package.json:4`: `"version": "2.7.0"`
  - `apps_script/V290Migration.gs:19`: checks `config_('SCHEMA_VERSION') === '2.9.0'`
- **Exact file, function, endpoint or data source:** `public/index.html`, `apps_script/WorkspaceService.gs`, `apps_script/V290Migration.gs`, `package.json`.
- **Root cause:** Version strings were hardcoded in multiple files and not updated together during incremental point releases (`v2.7.0` -> `v2.9.4`).
- **Business impact:** Confuses operators and auditors inspecting API payloads (`bootstrap` claims `2.7.0` while UI shows `v2.9.4` and Sheet shows `2.9.2000`).
- **Recommended fix:** Synchronize version constants across `package.json`, `WorkspaceService.gs`, and `index.html`, and normalize `V290Migration.gs` version comparison to accept `2.9.*` (`/^2\.9\./.test(String(config_('SCHEMA_VERSION')))`).
- **Dependencies:** None.
- **Risk of change:** Very Low (check if any test in `tests/v27.test.mjs` asserts `version === '2.7.0'` and update or keep backward-compatible).
- **Verification method:** Run `npm test` and inspect `bootstrap()` return payload.

---

### AUD-014 — Localization (`i18n.js`) Mixed Hardcoded Vietnamese & English Strings in `public/app.js`
- **Finding ID:** `AUD-014`
- **Severity:** **P3 (UX / Localization Consistency — Workstream B)**
- **Observed evidence:**
  - While `public/index.html` defaults to `lang="en"` and `EN` selected in `#language`, `public/app.js` contains several hardcoded Vietnamese strings directly inside the English default templates:
    - Line 159: `'Product chỉ có NON_WOOD theo bản import đã xác nhận.'` and `'Chưa có material gắn với product này. Xác nhận liên kết trong Product · Material · PO / lot.'`
    - Line 160: `'Nguồn chưa được phân bổ cho product này.'`
    - Line 163: `'Kiểm tra nhiều PDF theo material và nguồn PO/lô. Refresh results from Drive để lấy nhận xét, dẫn chứng và next actions.'`
- **Exact file, function, endpoint or data source:** `public/app.js` (lines 159, 160, 163), `public/i18n.js`.
- **Root cause:** During v2.7–v2.9 feature additions, developer messages were written in Vietnamese directly inside `app.js` instead of English source strings translated via `tt(...)` in `i18n.js`.
- **Business impact:** Violates the Master Prompt requirement: *"Application UI: English by default. Maintain the Vietnamese language option. Preserve existing localization keys and behavior. Do not introduce Vietnamese as the default language."* Global English-speaking B2B users/auditors see mixed Vietnamese paragraphs inside an English workspace.
- **Recommended fix:** Wrap all hardcoded Vietnamese strings in `public/app.js` (and companion scripts) with `tt('...')` using English default strings and map their exact Vietnamese equivalents in `public/i18n.js` while preserving 100% of existing localization keys.
- **Dependencies:** `public/app.js`, `public/i18n.js`.
- **Risk of change:** Low; check `tests/ui-dom.test.mjs` to ensure no test asserts those raw Vietnamese strings in English mode.
- **Verification method:** Switch language selector between `EN` and `VI` and verify 100% English rendering in `EN` mode and 100% Vietnamese rendering in `VI` mode.
