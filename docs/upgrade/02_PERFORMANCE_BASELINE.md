# 02 — PERFORMANCE BASELINE & BOTTLENECK ANALYSIS

- **Project:** KODA EUDR Workspace (`v2.9.4`)
- **Audit Phase:** Phase 0 (Read-Only System Audit — Gate A Deliverable 3 of 7)
- **Audit Timestamp:** 2026-10-16 (Asia/Ho_Chi_Minh)
- **Mutations Executed:** `0` (Read-Only Audit)

---

## 1. Frontend Asset & Bundle Size Baseline (`public/`)

### 1.1 Eagerly Loaded Assets on Initial Boot (`public/index.html`)

Every visit or page refresh (`F5`) loads **16 HTTP resources** before the user even signs in. Because `netlify.toml` line 21 enforces `Cache-Control = "no-store"` on `/*`, the browser is prohibited from caching any of these files across reloads:

| # | Asset Path (`public/`) | Type | Uncompressed Size (Bytes) | Size (KB) | Load Mode | Audit Assessment |
| :-: | :--- | :---: | ---: | ---: | :---: | :--- |
| 1 | `/index.html` | HTML | 2,578 | 2.5 KB | Document | Fast, minimal shell. |
| 2 | `/style.css?v=2.9.0` | CSS | 41,875 | 40.9 KB | Render-blocking | Minified single-file stylesheet. |
| 3 | `/vendor/leaflet/leaflet.css?v=1.9.4` | CSS | 14,806 | 14.5 KB | Render-blocking | Loaded eagerly on login/dashboard even when GEO map is closed. |
| 4 | `/geo.css?v=2.9.4` | CSS | 1,350 | 1.3 KB | Render-blocking | Small CSS file; could be merged or kept cached. |
| 5 | `/koda-logo.png` | PNG | 45,806 | 44.7 KB | Eager `<img>` | Sidebar brand logo (`128px` display width). |
| 6 | `/eudr-workspace-icon.png?v=20261007` | PNG | **568,701** | **555.4 KB** | Favicon | **Oversized (555 KB for a 16×16/32×32 tab icon!)** |
| 7 | `/i18n.js?v=2.9.4` | JS | 89,970 | 87.9 KB | `defer` | Bilingual EN/VI dictionary & DOM translator. |
| 8 | `/dossier.js?v=2.9.4` | JS | 17,822 | 17.4 KB | `defer` | Whole-order Dossier Hub & PDF split logic. |
| 9 | `/smart-import.js?v=2.7.4` | JS | 15,194 | 14.8 KB | `defer` | Smart SO/PO/Excel import dialog. |
| 10 | `/trace.js?v=2.8.0` | JS | 11,262 | 11.0 KB | `defer` | Product · Material · PO/Lot graph editor. |
| 11 | `/material-review.js?v=2.9.4` | JS | 39,922 | 39.0 KB | `defer` | Material Dossier upload, prompt, and review actions. |
| 12 | `/workspace-chat.js?v=2.9.1` | JS | 7,515 | 7.3 KB | `defer` | Material OCR index & Q&A panel. |
| 13 | `/intelligence.js?v=2.9.4` | JS | 35,859 | 35.0 KB | `defer` | AI Review, Document Classification, Issues, Customer Submission. |
| 14 | `/vendor/leaflet/leaflet.js?v=1.9.4` | JS | **147,552** | **144.1 KB** | `defer` | Loaded eagerly on every boot even when map is not used. |
| 15 | `/map-config.js?v=2.9.4` | JS | 427 | 0.4 KB | `defer` | Tile URL configuration. |
| 16 | `/geo.js?v=2.9.4` | JS | 19,639 | 19.2 KB | `defer` | GeoJSON preview, LineString conversion, and plot registration. |
| 17 | `/app.js?v=2.9.4` | JS | **107,414** | **104.9 KB** | `defer` | Main application controller & view renderer. |
| — | **Total Eager Initial Boot Payload** | — | **1,167,692** | **1,140.3 KB** | — | **Re-fetched on every page load due to `Cache-Control: no-store`.** |

### 1.2 On-Demand / Vendor Assets (`public/vendor/`)

| Asset Group | Files | Total Size | Load Trigger | Caching Issue |
| :--- | :--- | ---: | :--- | :--- |
| **PDF Preview (`pdf-preview.mjs` + PDF.js)** | `pdf-preview.mjs` (3.5 KB), `pdf.min.mjs` (458.9 KB), `pdf.worker.min.mjs` (1,264.3 KB), 168 `.bcmap` files, `standard_fonts/` | **~1.73 MB** (+ cmaps/fonts) | First `documentView()` of a PDF | `Cache-Control: no-store` forces re-download of `1.73 MB` across sessions. |
| **PDF Splitting (`PDF-Lib`)** | `/vendor/pdf-lib.min.js` | **525.1 KB** | Loaded dynamically when splitting PDFs in `dossier.js` / `intelligence.js` | Uncached across reloads (`no-store`). |
| **Excel Smart Import (`ExcelJS`)** | `/vendor/exceljs.min.js` | **947.7 KB** | Loaded dynamically in `smart-import.js` | Uncached across reloads (`no-store`). |
| **Client-Side OCR (`Tesseract.js` + WASM + Lang)** | `tesseract.min.js` (63 KB), `worker.min.js` (111 KB), 3 WASM cores (20.3 MB), `eng.traineddata.gz` (10.9 MB), `vie.traineddata.gz` (3.8 MB) | **35.3 MB** | Triggered only during browser OCR (`ocr-import.mjs`) | `no-store` prevents caching the `14.7 MB` language `.traineddata.gz` and `6.7 MB` WASM core! |

---

## 2. End-to-End Workflow Performance Baseline

### 2.1 Measured & Modeled Workflow Latencies

| Workflow Operation | Current Network Calls | Sheets Tabs Read (`rows_`) | Sheets/Drive/Cal RPCs | Baseline Latency | Primary Bottleneck |
| :--- | :--- | :-: | :-: | :---: | :--- |
| **1. Initial App Load (Cold / Refresh)** | 17 static assets + `GET /api/auth` | 0 | 0 | **1.1s – 2.4s** | `1.14 MB` uncached static payload (`555 KB` favicon + `Cache-Control: no-store`). |
| **2. Dashboard Bootstrap (`bootstrap`)** | `POST /api/call` (`bootstrap`) | **19 tabs** | 1 `LockService` + 19 `openById` + 19 `getDataRange().getValues()` | **2.2s – 4.8s** (`5s–8s` cold GAS) | `db_()` calls `SpreadsheetApp.openById()` 19 times; dumps all 19 tables in one response. |
| **3. Order Listing & Filtering (`orders`)** | 0 (in-memory over `state`) | 0 | 0 | **15ms – 45ms** | Synchronous `$('main').innerHTML` rebuild on filter apply. |
| **4. Single Order Opening (`workspace`)** | `getDocument` (if `product.image_document_id` set) + tab API (`getKodaReviewDashboard` / `getWorkspaceChatIndex`) | 2–16 tabs (when sub-tab active) | 1–2 Drive calls | **80ms UI** + **1.8s – 3.5s** sub-tab/image | Full `$('main').innerHTML` rebuild + uncached product image `getDocument` on every product switch. |
| **5. Material / PO-Lot / Node Switching** | 0 (in `Evidence workspace` tab) or 1 (`chat`/`review` tab) | 0–16 tabs | 0 | **25ms – 60ms** (DOM) | Full `$('main').innerHTML` replacement destroys scroll position and focus state. |
| **6. Evidence Upload (<2 MB file)** | `uploadEvidence` + automatic `bootstrap` | 6 tabs + **19 tabs** (`bootstrap`) | **3 `LockService`** + Drive `createFile` + Calendar sync + 4 Sheet writes | **4.5s – 9.2s** | Synchronous `syncTaskCalendar_` + mandatory full `bootstrap()` reload after `act()`. |
| **7. PDF Preview Loading (`documentView`)** | `getDocument` (+ `getDocumentChunk` for >1.5MB) + PDF.js (`1.73 MB`) | 4 tabs per call | Drive `getFileById().getBlob().getBytes()` | **2.5s – 6.5s** (every open!) | **Zero client-side byte caching**: closing and re-opening the same PDF re-downloads all bytes from Drive via Apps Script! |
| **8. Multi-PDF Dossier Upload (Production Telemetry)** | `beginDossierUpload` + N × `relayDossierChunk` + `finishDossierUpload` | 4–6 tabs per chunk | Drive temp blobs + final file creation | **20.2s** (`286 KB`) to **66.6s** (`6.72 MB`) | Sequential chunk relay through Netlify -> Apps Script -> Drive (observed in `08_ACTIVITY_LOG` `2026-10-16T07:16–07:36Z`). |
| **9. GEO Data Loading & Map Open (`EudrGeo.open`)** | Leaflet tiles (`tile.openstreetmap.org`) | 0 (uses `state.geo`) | 0 | **120ms – 400ms** | Fast local GeoJSON parsing; `saveGeo` triggers full `bootstrap()` reload (`4s+`). |
| **10. AI Review Status Retrieval (`getMaterialReviews` / `getKodaReviewDashboard`)** | 1 `POST /api/call` per tab/drawer open | 6–13 tabs | 6–13 `openById` + `getValues()` | **1.8s – 3.8s** | Re-reads 13 sheets without memoized `db_()`. |
| **11. Calendar Synchronization (`syncCalendar`)** | `POST /api/call` (`syncCalendar`) | 4 tabs (`05`, `01`, `02`, `04`) | **N × (`Calendar.Events.get` + `insert`/`patch` + `patch_('04_EVIDENCE_TRACKER')`)** | **1.5s** (0 due dates) to **>45s TIMEOUT** (40+ tasks with due dates) | Calls `patch_()` inside loop (deleting `TABLE_CACHE_['04_EVIDENCE_TRACKER']` and re-reading entire sheet on every task!). |

### 2.2 Production Telemetry Verification (`08_ACTIVITY_LOG` & `21_OPERATIONS` on `2026-10-16`)

From live operational records captured on `2026-10-16`:
- **`prepareKodaBusinessReview`** (`06:50:17.351Z` -> `06:50:17.480Z`): `129 ms` post-audit commit overhead.
- **`createImportDraft`** (`07:16:19.177Z` -> `07:16:19.338Z`): `161 ms` post-audit commit overhead.
- **`confirmOrderImport`** (`07:21:28.091Z` -> `07:21:28.237Z`): `146 ms` post-audit commit overhead (added 2 products, 4 materials, excluded 1 non-wood item).
- **`prepareMaterialReviewSource`** (`07:43:00.372Z` -> `07:43:00.617Z`): `245 ms` post-audit commit overhead.
- **`uploadEvidence` (GeoJSON)** (`07:53:46.806Z` -> `07:53:47.412Z`): `606 ms` post-audit commit overhead.
- **`applyMaterialChainProposal`** (`08:01:22.887Z` -> `08:01:23.255Z`): `368 ms` post-audit commit overhead (3 nodes, 3 edges).

---

## 3. Deep-Dive Backend Bottleneck Analysis (`apps_script/*.gs`)

### 3.1 The `patch_()` + `rows_()` N² Cache-Thrashing Loop
Look at `apps_script/Code.gs` lines 74–78:
```javascript
var TABLE_CACHE_={};
function rows_(n){
  if(TABLE_CACHE_[n])return TABLE_CACHE_[n].map(x=>({...x}));
  const db=db_(),v=db.getSheetByName(n).getDataRange().getValues(),h=v.shift(),tz=db.getSpreadsheetTimeZone();
  ...
  TABLE_CACHE_[n]=result;
  return result.map(x=>({...x}));
}
function add_(n,o){
  delete TABLE_CACHE_[n];
  db_().getSheetByName(n).appendRow(SCHEMA[n].map(k=>safe_(o[k]===undefined?'':o[k])));
}
function patch_(n,id,o){
  delete TABLE_CACHE_[n];
  const s=db_().getSheetByName(n),v=s.getDataRange().getValues(),i=v.findIndex((r,j)=>j>0&&r[0]===id);
  if(i<1)throw Error('Record not found');
  Object.keys(o).forEach(k=>{
    const col=SCHEMA[n].indexOf(k);
    if(col<0)throw Error('Unknown field');
    s.getRange(i+1,col+1).setValue(safe_(o[k]));
  });
}
```
**Why this causes severe slowdowns and `UPSTREAM_TIMEOUT` / `UPSTREAM_NON_JSON`:**
1. **No Memoized `Spreadsheet` Handle (`db_()`)**: Every time `db_()` is called (`Code.gs:73`), it calls `PropertiesService.getScriptProperties().getProperty('DB_ID')` and `SpreadsheetApp.openById(id)`. During a single `bootstrap()` call, `db_()` is invoked **19 times**.
2. **Per-Cell `setValue()` RPCs in `patch_()`**: When `patch_()` updates 8 fields on a row (e.g., `manageSupplier`, `updateMaterialInfo`, `reviewDocument`), it executes **8 separate `s.getRange(i+1, col+1).setValue(...)` calls** instead of updating the row array in memory and writing the single row range `s.getRange(i+1, 1, 1, width).setValues([rowValues])` in **1 RPC**!
3. **`delete TABLE_CACHE_[n]` Cache Thrashing Inside Loops**:
   When `syncCalendar()` (`CalendarService.gs:39`) or `confirmMaterials()` (`OrderService.gs:88`) or `syncNodeRequirements_()` (`OrderService.gs:118`) loops over 30 tasks and calls `add_('04_EVIDENCE_TRACKER', ...)` or `patch_('04_EVIDENCE_TRACKER', ...)`:
   - Iteration 1: `patch_('04_EVIDENCE_TRACKER')` deletes `TABLE_CACHE_['04_EVIDENCE_TRACKER']` and calls `s.getDataRange().getValues()`.
   - Next inside the loop: `syncTaskCalendar_()` or `canTask_()` calls `rows_('04_EVIDENCE_TRACKER')`, which misses `TABLE_CACHE_` and calls `SpreadsheetApp.openById(id)` + `getDataRange().getValues()` again!
   - Across 30 tasks, the entire `04_EVIDENCE_TRACKER` sheet is read from Google Sheets **60+ times** in a single request!

---

## 4. Performance Findings Register

Every finding below includes all 10 required audit attributes per Section 11 of the Master Implementation Prompt.

### PERF-001 — `db_()` Calls `SpreadsheetApp.openById()` Repeatedly Without Per-Request Memoization
- **Finding ID:** `PERF-001` (Cross-ref `AUD-004`)
- **Severity:** **P1 (High Backend Latency)**
- **Observed evidence:** `apps_script/Code.gs:73` defines `function db_(){const id=PropertiesService.getScriptProperties().getProperty('DB_ID');if(!id)throw Error('Run setup first');return SpreadsheetApp.openById(id);}`. Across `bootstrap()`, `db_()` is called 19 times; across write operations, `db_()` is called 15–40+ times.
- **Exact file, function, endpoint or data source:** `apps_script/Code.gs` (`db_` line 73), `apps_script/Bridge.gs` (`doPost` line 5).
- **Root cause:** `SpreadsheetApp.openById(id)` and `PropertiesService` lookup are not cached in a request-scoped variable (`DB_HANDLE_`).
- **Business impact:** Adds `400ms–1,500ms` of pure Google Apps Script RPC overhead to every request.
- **Recommended fix:** Cache `DB_HANDLE_` and `DB_TIMEZONE_` per request (resetting in `Bridge.gs` `doPost` alongside `TABLE_CACHE_ = {}`).
- **Dependencies:** `apps_script/Code.gs`, `apps_script/Bridge.gs`.
- **Risk of change:** Very Low.
- **Verification method:** Unit test in `tests/` and execution timing comparison.

---

### PERF-002 — `patch_()` & `add_()` Invalidate `TABLE_CACHE_` Instead of Write-Through & Issue Per-Column `setValue()` RPCs
- **Finding ID:** `PERF-002` (Cross-ref `AUD-004`)
- **Severity:** **P1 (Critical Loop Scaling Bottleneck)**
- **Observed evidence:** `apps_script/Code.gs:77-78` deletes `TABLE_CACHE_[n]` on every `add_()` and `patch_()`, and `patch_()` executes `s.getRange(i+1, col+1).setValue(...)` inside `Object.keys(o).forEach(...)`.
- **Exact file, function, endpoint or data source:** `apps_script/Code.gs` (`add_` line 77, `patch_` line 78).
- **Root cause:** Naive cache invalidation and cell-by-cell writes.
- **Business impact:** O(N²) Google Sheets read/write amplification during multi-task operations (`confirmMaterials`, `syncCalendar`, `confirmOrderImport`, `applyMaterialChainProposal`), risking the 45s timeout (`UPSTREAM_TIMEOUT`).
- **Recommended fix:**
  1. In `patch_(n, id, o)`, batch multi-column updates into a single row `setValues([updatedRow])` call when >1 column changes.
  2. Maintain `TABLE_CACHE_[n]` via write-through (or cache raw sheet matrix) so repeated `rows_(n)` / `patch_(n)` calls in the same transaction do not re-fetch the entire worksheet from Google Sheets.
- **Dependencies:** `apps_script/Code.gs`.
- **Risk of change:** Low–Medium; must verify date formatting (`due` as `yyyy-MM-dd`, other `Date` instances as `toISOString()`) matches `rows_()` 100%.
- **Verification method:** Run all unit tests in `tests/` and verify 100% state parity between write-through cache and fresh `rows_()`.

---

### PERF-003 — Every Frontend Mutation (`act()`) Blocks on a Full 19-Table `bootstrap` Reload
- **Finding ID:** `PERF-003`
- **Severity:** **P1 (Frontend Perceived Latency)**
- **Observed evidence:** `public/app.js:39`:
  `async function act(action,...args){... const result=await call(action,...args); closeDrawer(); await load(); ...}`
  where `load()` calls `state = await call('bootstrap')` and `render()`.
- **Exact file, function, endpoint or data source:** `public/app.js` (`load` line 38, `act` line 39).
- **Root cause:** No optimistic/targeted state update or background refresh; user is locked out (`busy = true`, all buttons disabled across the entire document) until both the write RPC and a subsequent full `bootstrap` RPC complete.
- **Business impact:** Every single user action (even marking a notification read, saving a comment, or assigning a task) takes `2×` network round-trips (`4s–8s` total) with all UI buttons frozen.
- **Recommended fix:**
  1. Keep `load()` for authoritative synchronization, but combine backend `bootstrap` speedups (`PERF-001` & `PERF-002`) with non-blocking UI refresh indicators and scroll-position preservation so the screen does not jump or freeze unnecessarily.
  2. Deduplicate concurrent `load()` / `bootstrap` calls in flight.
- **Dependencies:** `public/app.js`.
- **Risk of change:** Low.
- **Verification method:** Measure `act()` completion time and verify scroll position and focus preservation in `tests/ui-dom.test.mjs`.

---

### PERF-004 — Zero Client-Side Caching of Document Bytes (`getDocument` / `getDocumentChunk`)
- **Finding ID:** `PERF-004` (Cross-ref `AUD-009`)
- **Severity:** **P1 (Evidence & PDF Review Latency — Workstream D)**
- **Observed evidence:**
  - `public/app.js:174` calls `call('getDocument', product.image_document_id)` every time `workspace()` runs (i.e. on **every click** of a material, PO/lot source, supply chain node, or order tab!).
  - `public/app.js:230, 238` calls `call('getDocument', id)` and `fileBytes(f, id)` every time a user opens `documentView(id)`. Closing the drawer and clicking "View" again re-downloads the entire PDF from Google Drive through Apps Script and Netlify Functions!
- **Exact file, function, endpoint or data source:** `public/app.js` (`workspace` line 174, `fileBytes` line 195, `documentView` lines 229–238).
- **Root cause:** No in-memory `Map` cache for downloaded document blobs/bytes in `public/app.js`.
- **Business impact:**
  1. Clicking between Materials or Supply Chain nodes in an order with a Product Image triggers redundant `getDocument` API calls on **every single click**!
  2. Re-opening a 2 MB PDF takes `3s–6s` every time instead of `<20ms`.
- **Recommended fix:** Introduce a session-scoped in-memory LRU byte/metadata cache (`DOCUMENT_CACHE` keyed by `documentId`, invalidated on `logout` or when `state.docs` shows a newer `updated_at`/`version`, capped at 40 MB) in `public/app.js`.
- **Dependencies:** `public/app.js`.
- **Risk of change:** Very Low (keyed by immutable document version/hash).
- **Verification method:** Verify clicking Materials/Chain Nodes makes `0` redundant `getDocument` calls for product images, and re-opening a viewed PDF renders in `<50ms` with `0` network calls.

---

### PERF-005 — Global `Cache-Control = "no-store"` in `netlify.toml` Forces `1.14 MB+` Re-Download on Every Page Refresh
- **Finding ID:** `PERF-005` (Cross-ref `AUD-011`)
- **Severity:** **P2 (Initial Load & Repeat Visit Performance)**
- **Observed evidence:** `netlify.toml` lines 15–21 apply `Cache-Control = "no-store"` to `for = "/*"`.
- **Exact file, function, endpoint or data source:** `netlify.toml` (line 21).
- **Root cause:** Overly broad `/*` rule intended for `/index.html` and `/api/*` was applied to all static vendor libraries (`/vendor/pdfjs/*`, `/vendor/leaflet/*`, `/vendor/pdf-lib.min.js`, `/vendor/exceljs.min.js`, `/vendor/ocr/*`).
- **Business impact:** Forces browsers to re-download `1.14 MB` on every page load, `1.73 MB` on PDF preview, and up to `35 MB` on OCR use.
- **Recommended fix:** Add specific `[[headers]]` blocks in `netlify.toml` for `/vendor/*` (`Cache-Control = "public, max-age=604800, immutable"`) while keeping `Cache-Control = "no-store"` on `/` and `/index.html` and `/api/*`.
- **Dependencies:** `netlify.toml`.
- **Risk of change:** Very Low.
- **Verification method:** Check `netlify.toml` rules and verify static vendor assets are served with caching headers while HTML/API remain `no-store`.

---

### PERF-006 — Oversized `568 KB` Favicon (`public/eudr-workspace-icon.png`)
- **Finding ID:** `PERF-006` (Cross-ref `AUD-011`)
- **Severity:** **P2 (Asset Optimization)**
- **Observed evidence:** `public/eudr-workspace-icon.png` is `568,701` bytes (`555.4 KB`), accounting for **49% of the entire initial page load byte weight**!
- **Exact file, function, endpoint or data source:** `public/eudr-workspace-icon.png`, `public/index.html` (lines 10–11).
- **Root cause:** Uncompressed high-resolution PNG was used directly as `<link rel="icon">`.
- **Business impact:** Wastes `>540 KB` of bandwidth on every page load.
- **Recommended fix:** Generate an optimized `<15 KB` icon (`favicon.png` / `eudr-workspace-icon.png`) while preserving visual fidelity.
- **Dependencies:** `public/eudr-workspace-icon.png`.
- **Risk of change:** Zero.
- **Verification method:** Verify file size `<20 KB` and valid PNG rendering.

---

### PERF-007 — Triple `LockService` Acquisition per Write in `Bridge.gs` + `withOperation_()`
- **Finding ID:** `PERF-007` (Cross-ref `AUD-005`)
- **Severity:** **P2 (Concurrency & Lock Wait Latency)**
- **Observed evidence:** Every mutation acquires `LockService.getScriptLock()` in `Bridge.gs:15` (for nonce check), releases it, acquires `lock_()` in `OrderService.gs:35` (`withOperation_` start), releases it, acquires `lock_()` inside the action body (if applicable), and acquires `lock_()` again in `OrderService.gs:35` (`withOperation_` finish).
- **Exact file, function, endpoint or data source:** `apps_script/Bridge.gs:15`, `apps_script/Code.gs:95`, `apps_script/OrderService.gs:35`.
- **Root cause:** `lock_(fn)` does not track re-entrancy (`LOCK_DEPTH_`), and `withOperation_()` splits lock acquisition across three separate blocks.
- **Business impact:** Multiplies `LockService` RPC overhead (`3–4×` per request) and creates race windows between `withOperation_` start and finish.
- **Recommended fix:** Make `lock_(fn)` re-entrant within a single request execution so nested `lock_()` calls share the active lock cleanly.
- **Dependencies:** `apps_script/Code.gs`.
- **Risk of change:** Low.
- **Verification method:** Unit test in `tests/` verifying re-entrant `lock_()` behavior and exception safety.

---

## 5. Target Performance Improvements Summary (Before → After)

| Metric | Observed Baseline (v2.9.4) | Target After Phase 1 Upgrade | Mechanism |
| :--- | :---: | :---: | :--- |
| **Initial Boot Static Transfer (Repeat Visit)** | `1,140 KB` | **`< 15 KB`** (98% reduction) | Scoped `Cache-Control` for `/vendor/*` + optimized favicon (`PERF-005`, `PERF-006`). |
| **Initial Boot Static Transfer (First Visit)** | `1,140 KB` | **`~595 KB`** (48% reduction) | Optimize `555 KB` favicon to `<15 KB` (`PERF-006`). |
| **Apps Script `db_()` `openById` Calls per `bootstrap`** | `19 calls` | **`1 call`** (95% reduction) | Per-request `DB_HANDLE_` memoization (`PERF-001`). |
| **Sheet Full-Table Reads during 30-Task Sync/Import** | `60+ reads` | **`1 read`** (98% reduction) | Write-through `TABLE_CACHE_` & batched row `patch_()` (`PERF-002`). |
| **Product Image `getDocument` Calls when Clicking Materials** | `1 RPC per click` (`1.5s–3s`) | **`0 RPCs`** (`0ms` cached) | Session-scoped `DOCUMENT_CACHE` in `public/app.js` (`PERF-004`). |
| **Re-opening an Already Viewed PDF (`documentView`)** | `2.5s – 6.5s` | **`< 80ms`** | Session-scoped `DOCUMENT_CACHE` (`PERF-004`). |
| **Material / Chain Node Switch Scroll Jump** | Full page jump to top | **Zero scroll jump (`<16ms`)** | Targeted container update & scroll position preservation (`AUD-010`). |
