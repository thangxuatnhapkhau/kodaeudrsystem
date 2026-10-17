# 06 — DEPENDENCY AND APPROVAL MATRIX
**Project:** KODA EUDR Workspace (`v2.9.4`)  
**Phase:** Phase 0 — Read-Only System Audit  
**Audit Date:** 2026-10-16  

---

## 1. Runtime & Build Dependency Inventory

### 1.1 Frontend Browser Dependencies (`public/`)

| Dependency | Location / Loading Mechanism | Current Version | Status & Audit Notes |
|---|---|---|---|
| **Google Fonts (`Plus Jakarta Sans`, `JetBrains Mono`)** | `https://fonts.googleapis.com` (`public/index.html`) | Webfont CSS2 | Allowed by CSP (`style-src` / `font-src`). |
| **Firebase Auth REST API (`identitytoolkit`)** | `https://identitytoolkit.googleapis.com/v1` (`public/app.js:33`) | v1 REST | Used directly via `fetch()` without heavy SDK bundle; allowed in `connect-src`. |
| **Firebase SecureToken REST API** | `https://securetoken.googleapis.com/v1` (`public/app.js:34`) | v1 REST | Used directly via `fetch()` for ID token refresh; allowed in `connect-src`. |
| **PDF.js (Recommended Optional Enhancement)** | Self-hosted in `/vendor/pdfjs/` (Proposed in Phase 4) | N/A (Currently native `<iframe>` Blob URL) | If approved for page-level PDF controls, must be bundled locally under `'self'` to preserve strict CSP. |

### 1.2 Netlify Functions & Node.js Dependencies (`package.json`)

| Package / Runtime | Version | Scope | Purpose |
|---|---|---|---|
| **Node.js Runtime** | `>=20.x` (`v24.14.0` verified locally) | Netlify Functions & Local Test Runner | Executes `netlify/functions/*.mjs`, `node --test`, and `scripts/*.mjs`. |
| **`firebase-admin`** | `^13.6.0` | Production (`dependencies`) | Verifies Firebase ID tokens in `netlify/functions/_firebase.mjs` when `FIREBASE_SERVICE_ACCOUNT_JSON` is configured. |

### 1.3 Google Apps Script Services (`apps_script/`)

| Google Service | Apps Script API | Files Using Service | Quota / Bottleneck Profile |
|---|---|---|---|
| **Google Sheets (`SpreadsheetApp`)** | `openById`, `getSheetByName`, `getDataRange`, `getValues`, `setValue`, `setValues`, `appendRow` | `Code.gs`, `WorkflowEngine.gs`, `AdminOpsService.gs`, `SupplierService.gs` | High sensitivity to repeated `openById` and per-cell `setValue()` calls; mitigated in Phase 1 via `DB_MEMO_` and `setValues()`. |
| **Google Drive (`DriveApp`)** | `getFolderById`, `getFileById`, `createFolder`, `createFile`, `getBlob` | `Code.gs`, `WorkflowEngine.gs`, `SampleCaseService.gs` | Used for evidence storage (`00_Order_Info` – `99_Sub_Suppliers_B2B`) and Base64 PDF/image retrieval (`getDocument`). |
| **Google Calendar (`CalendarApp`)** | `getCalendarById`, `createEvent`, `getEventById` | `CalendarService.gs` | High latency (`300–600 ms` per event RPC); must be gated by `CALENDAR_SYNC_ENABLED` and decoupled from bulk loops. |
| **Concurrency Lock (`LockService`)** | `getScriptLock().waitLock(25000)` | `Code.gs:84` (`withLock_`) | Serializes all mutating actions across the workspace to prevent concurrent row corruption. |
| **Script Cache (`CacheService`)** | `getScriptCache()` | `Code.gs:100` (`readObjectsCached_`) | Caches small tables (`<= 90 KB`) for 25 seconds. |
| **Script Properties (`PropertiesService`)** | `getScriptProperties()` | `Code.gs:61`, `Bridge.gs:19`, `GeminiService.gs` | Stores `DB_ID`, `ROOT_ID`, `CALENDAR_ID`, `BRIDGE_SECRET`, `ALLOWED_ORIGINS`, `GEMINI_API_KEY`. |
| **External HTTP (`UrlFetchApp`)** | `UrlFetchApp.fetch()` | `GeminiService.gs`, `GeoService.gs`, `TranslationService.gs` | Calls Gemini API (`generativelanguage.googleapis.com`) and translation/validation endpoints. |

---

## 2. Environment Variables & Script Properties Matrix (Names Only — Zero Secrets Exposed)

### 2.1 Netlify Environment Variables

| Variable Name | Consumed By | Required? | Purpose & Verification Status |
|---|---|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | `netlify/functions/_bridge.mjs`, `call.mjs` | **REQUIRED** | Target `https://script.google.com/macros/s/.../exec` endpoint. Verified active in production. |
| `BRIDGE_SECRET` | `netlify/functions/_bridge.mjs`, `call.mjs` | **REQUIRED** | Shared HMAC-SHA256 secret used to sign `ts.rawBody` into `bridgeSig`. Verified active in production. |
| `FIREBASE_PROJECT_ID` | `netlify/functions/auth.mjs`, `_firebase.mjs` | **REQUIRED** | Firebase project identifier (`koda-eudr-system`). Verified via `/api/auth`. |
| `FIREBASE_WEB_API_KEY` | `netlify/functions/auth.mjs`, `_firebase.mjs` | **REQUIRED** | Public Web API key returned by `/api/auth` (`hasApiKey: true`). Never committed to Git. |
| `FIREBASE_AUTH_DOMAIN` | `netlify/functions/auth.mjs` | Optional | Defaults to `<FIREBASE_PROJECT_ID>.firebaseapp.com`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `netlify/functions/_firebase.mjs` | Recommended | Enables local JWT signature verification via `firebase-admin` instead of `accounts:lookup` fallback. |
| `ALLOWED_ORIGINS` | `netlify/functions/_bridge.mjs`, `auth.mjs` | Recommended | Comma-separated list of allowed CORS origins (e.g., `https://koda-eudr-system.netlify.app`). |
| `LEGACY_TOKEN_LOGIN` | `netlify/functions/auth.mjs`, `call.mjs` | Optional | Defaults to `false`. Controls whether legacy session tokens are accepted when Firebase is enabled. |

### 2.2 Google Apps Script Properties (`PropertiesService.getScriptProperties()`)

| Property Key | Consumed By | Required? | Purpose & Security Recommendation |
|---|---|---|---|
| `DB_ID` | `apps_script/Code.gs:63` | **REQUIRED** | Google Sheets workbook ID (`1xura5W6coeGeJsc1zQMP6Emw_QMTv5XAf0bqpC5Uk3A`). Remove hardcoded fallback from `Code.gs:15` after verifying property is set. |
| `ROOT_ID` | `apps_script/Code.gs:64` | **REQUIRED** | Google Drive root evidence folder ID (`1BWXpf-L6yBPQtXbskoQKMfN890aZXCJg`). Remove hardcoded fallback from `Code.gs:16`. |
| `CALENDAR_ID` | `apps_script/Code.gs:65` | **REQUIRED** | Google Calendar ID (`44c53155b...`). Remove hardcoded fallback from `Code.gs:17`. |
| `BRIDGE_SECRET` | `apps_script/Bridge.gs:19` | **REQUIRED** | Must match Netlify `BRIDGE_SECRET` for HMAC-SHA256 verification. |
| `ALLOWED_ORIGINS` | `apps_script/Bridge.gs:27` | Recommended | Comma-separated allowed origins verified inside `verifyBridgeRequest_`. |
| `GEMINI_API_KEY` | `apps_script/GeminiService.gs` | Optional / Feature-Specific | Enables Gemini AI document & workspace review (`runAiDocumentReview`, `askKodaWorkspace`); falls back to deterministic heuristics if unset. |

---

## 3. Data & Configuration Preservation Contract

In compliance with **Section 3.1 (Data Integrity)** of the Master Prompt:
1. **Zero Destructive Writes:** No worksheet tabs, columns, row IDs, SHA-256 hashes, Drive folders, or audit entries (`08_ACTIVITY_LOG`, `16_EVENT_JOURNAL`, `21_OPERATIONS`) will be deleted, truncated, or renamed.
2. **No Unapproved Schema Migrations:** All 42 worksheets and `SCHEMA_VERSION = 2.9.2000` remain intact. None of the six approved workstreams require adding or renaming columns.
3. **Configuration Changes Require Explicit Owner Action or Approval:**
   - Restricting Google Sheets/Drive sharing permissions (`SEC-001` / `SEC-002`).
   - Confirming Regulatory Rules (`RULES_CONFIRMED = YES` in `09_CONFIG`) after legal review (`AUD-008`).
   - Switching `CALENDAR_SYNC_ENABLED` (`MANUAL` vs `AUTO`) or `REMINDERS_ENABLED` (`NO` vs `YES`).

---

## 4. Mandatory Owner Approval Gates (Section 18)

### 4.1 Gate A — Post-Phase 0 Audit & Implementation Plan Approval (CURRENT GATE)

Before any code is written or modified on an isolated branch (`feat/enterprise-upgrade-v2.9.5`), the Project Owner must review and approve:

| Gate A Item | Reference Document | Proposal Summary | Owner Decision Required |
|---|---|---|---|
| **1. Development Baseline** | `00_SYSTEM_AUDIT.md` | Select GitHub `main` HEAD (`f0073ae9dba3c701851d2076bb77d5547c9ec3fb`, `v2.9.4`) as the single canonical baseline, working on isolated branch `feat/enterprise-upgrade-v2.9.5`. | Approve / Modify |
| **2. Architecture Map** | `01_ARCHITECTURE_MAP.md` | Preserve existing Browser → Netlify Functions → Apps Script → Sheets/Drive/Calendar architecture; unify Netlify proxy logic into `_bridge.mjs` and make `Bridge.gs` fault-tolerant. | Approve / Modify |
| **3. Prioritized Issue List** | `00_SYSTEM_AUDIT.md`, `02_PERFORMANCE_BASELINE.md`, `03_SECURITY_AND_DATA_RISKS.md` | Address `AUD-001` through `AUD-014` across P0 (Security & `UPSTREAM_NON_JSON`), P1 (Performance, Calendar, Test Harness, Regulatory UX), P2 (UX/UI & PDF Split-View), and P3 (i18n). | Approve / Modify |
| **4. Selected Lucian Components** | `05_IMPLEMENTATION_PLAN.md` (Phase 3) | Pure CSS/SVG GPU-accelerated patterns (`cubic-bezier(0.22, 1, 0.36, 1)`, Skeleton Shimmer, DDS Readiness Ring, Slide-Over Drawer, Micro-Toast, `prefers-reduced-motion` support) with zero external heavy JS libraries. | Approve / Modify |
| **5. Phased Implementation Plan** | `05_IMPLEMENTATION_PLAN.md` | Execute Phases 1 → 7 sequentially on isolated branch with automated tests (`node --test`, `npm run verify:syntax`, `npm run verify:contracts`) before any staging deployment. | Approve / Modify |
| **6. Security & Config Remediation** | `03_SECURITY_AND_DATA_RISKS.md` | Owner/Admin restricts Google Sheet & Drive folder link sharing (`SEC-001`/`SEC-002`) to authorized accounts, and approves removing hardcoded IDs from `Code.gs:15-17` once `PropertiesService` keys are verified. | Approve / Modify |

---

### 4.2 Gate B — Staging Verification & Pre-Approval Before Any Production Config/Schema Change

Before any changes to live Google Sheets configuration (`09_CONFIG`, `43_REGULATION_RULES`, `22_COUNTRY_RISK`) or Apps Script properties:
1. All code changes in Phases 1–6 must be verified in local/staging tests (`node --test` 100% green).
2. A staging simulation and backup snapshot of the 42 worksheets must be verified.
3. Explicit Owner approval must be granted at **Gate B**.

---

### 4.3 Gate C — Final Production Deployment & Cutover Approval

Before merging `feat/enterprise-upgrade-v2.9.5` to `main` or updating the live Apps Script Web App (`AKfycb...`) and Netlify production deployment:
1. Complete verification report (Before vs. After metrics, test suite outputs, visual walkthrough, rollback instructions) must be presented in Vietnamese.
2. Explicit Owner approval must be granted at **Gate C**.
