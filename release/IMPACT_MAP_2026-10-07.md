# Existing System Impact Map — KODA EUDR

Audit date: 7 October 2026. Source scope: live `EUDR SYSTEM` workbook metadata, bounded header/ID reads, sample Order-folder listing, the supplied Drive code snapshot, and the v2.2 staging baseline. The live Apps Script deployment version, Netlify build and Firebase settings have **not** been independently read; code behavior below describes the staging source and/or Drive snapshot, not verified production execution. The v2.3 implementation and results are recorded in `ACCEPTANCE_REPORT_V23.md`.

## Confirmed workbook state

The workbook has 24 tabs. Relevant record counts (nonempty ID cells, excluding headers): `01_SO_MASTER` 2; `24_SO_PRODUCTS` 2; `02_SO_ITEM_MATERIAL` 3; `03_EVIDENCE_REQUIREMENT` 10; `04_EVIDENCE_TRACKER` 29; `05_OWNER_MASTER` 4; `06_DOCUMENT_REGISTER` 12; `08_ACTIVITY_LOG` 88; `18_AI_PROMPT_RUNS` 11. Supplier Master, Supply Chain and GEO plot tables currently have no data rows. Counts are a read-only snapshot and can change.

- Order: `01_SO_MASTER.id` is the stable case key. `so`, customer, PO, due, owner, folder ID, status, product summary and SO document ID are present.
- Product: `24_SO_PRODUCTS.id` links to `case_id`; name, SKU, quantity, UOM, image document ID and sequence exist. The current row for `SO26-0610` contains several product names as **one** legacy backfilled product with no quantity. Splitting it requires review of the source Sales Order.
- Material: `02_SO_ITEM_MATERIAL.id` links to case; material, optional `supplier_po`, category, source fields, folder ID, product IDs and traceability metadata exist.
- Supplier: `14_SUPPLIERS` is a reusable master. `15_SUPPLY_CHAIN` stores parent-linked order/material nodes and relationship folder IDs; both are empty in this snapshot.
- Requirement/task: `03_EVIDENCE_REQUIREMENT` holds defaults; `04_EVIDENCE_TRACKER` holds case/material/node-specific tasks, statuses and document IDs. The legacy four `evidence_block` values remain in tracker rows.
- Files: `06_DOCUMENT_REGISTER` stores Drive file IDs, active version, submission/review data and derivative provenance. `17_GEO_LOCATIONS` stores plot geometry/reference data.
- AI/audit: `18_AI_PROMPT_RUNS`, `07_AI_REVIEW_QUEUE`, `08_ACTIVITY_LOG`, `19_EXPORT_LOG`, `20_NOTIFICATIONS`, `21_OPERATIONS`, `23_UPLOAD_SESSIONS` support prompts, findings, audit, exports, notices and retry control.
- Config: `09_CONFIG` and `22_COUNTRY_RISK` store rules and country references. No country-risk rows are currently populated.

## Drive and application boundaries

The inspected Order `SO26-0610` retains `00_SO`, two material folders (`01_SOLID WALNUT`, `02_WALNUT VENEER`), `90_Processed`, `98_Export`, and `99_Archive`. Existing folder IDs are stored in Sheet rows. The material and relationship folder functions are in `apps_script/OrderService.gs`; upload placement and original/derivative registration are in `DocumentService.gs` and `TransferService.gs`. Do not rename or move existing folders as part of a schema migration.

`public/index.html`, `app.js`, `style.css`, `i18n.js` form the frontend. `netlify/functions/call.mjs`, `_bridge.mjs`, `_firebase.mjs`, `auth.mjs` authenticate and forward signed requests. `apps_script/Bridge.gs` dispatches actions to `Code.gs`, `AuthService.gs`, `OrderService.gs`, `DocumentService.gs`, `WorkspaceService.gs`, `PromptService.gs`, `GeoService.gs`, `MetadataService.gs`, `CalendarService.gs`, `TransferService.gs`, `ExportService.gs`, `Migration.gs`. The actual production release revision remains **NOT VERIFIED**.

## Function and permission impact

| Behavior | Candidate source | Change-sensitive dependencies |
|---|---|---|
| Order creation, edit, product/image | `OrderService.createOrder`, `updateOrder`, `saveOrderProduct`, `uploadProductImage`; `app.js` new/edit forms | Stable case ID, one SO PDF, Drive folder ID, `24_SO_PRODUCTS`, audit, retry keys |
| Material import/PO | `OrderService.createMaterial`, `updateMaterial`, `confirmMaterials` | `02_SO_ITEM_MATERIAL`, material folder, product references, requirement tasks |
| Supplier/chain | `AuthService.manageSupplier`, `OrderService.addChainNode`, `updateChainNode`, `syncNodeRequirements_` | `14_SUPPLIERS`, `15_SUPPLY_CHAIN`, tier folder, plots, evidence task |
| Evidence lifecycle | `DocumentService.uploadEvidence`, `removeDraftEvidence`, `submitDocument`, `reviewDocument`, `repairExistingSOReviewTask` | Tracker, registry, Drive original, version links, reviewer, audit |
| Sales Order access | `AuthService.documentVisible_`, `document_`; `WorkspaceService.bootstrap`; `DocumentService.getDocument`; `TransferService.getDocumentChunk`; `ExportService.authorizeExport_` | SO and derivatives must be checked in **all** paths, including direct API |
| Roles | `AuthService.capabilities_`, `requireCapability_`, `canOrder_`, `canTask_`; `app.js` `cap()` and `manage()` | Candidate Admin default is empty, contradicting the user's full Admin rights; both backend and UI are affected |
| Workspace/document blocks | `app.js workspace`, `nodeEvidenceTables`, `taskTable`; `style.css` | Candidate groups by chain node and loses `01_Commercial_Shipping`, `02_FSC_Certification`, `03_Transport`, `04_Geolocation` presentation |
| Final review | `WorkspaceService.completeCase`, `getMaterialReadiness`; `app.js workspace`, close action | Candidate shows consolidated `c.issues` prematurely, before evidence blocks |
| AI/derived PDFs | `PromptService` and `DocumentService.uploadProcessed`, `verifyProcessed`; offline `tools/derived_pdf.py` | Prompt run, source/derivative IDs, size/hash, reviewer; actual execution service is not integrated |
| Calendar | `CalendarService.syncTaskCalendar_`, `syncCalendar` | Task ID/event ID; Calendar credentials and live event counts are **NOT VERIFIED** |

## Confirmed security and migration concerns

Drive permission metadata reports `anyone: writer` on the workbook, source-code folder and evidence-root folder. An application role check cannot protect files that remain directly accessible through their Drive ACLs. Review inherited permissions and SO files before claiming SO confidentiality. The v2.2 baseline's chunk-upload path permitted evidence up to 25 MiB, and its Admin defaults omitted business capabilities; these are corrected in the v2.3 source and synthetic tests. The `24_SO_PRODUCTS` tab exists in the live workbook, but record-level reconciliation and deployed code version are **NOT VERIFIED**.

## Change sequence

1. Patch Admin capability evaluation and align frontend controls; test API-level SO view and review.
2. Restore the four evidence blocks within the existing workspace composition; keep product selector/image in the right-hand data area.
3. Move consolidated completeness validation to the final dossier action; retain individual missing statuses in evidence rows.
4. Enforce the strict upload size on both UI and backend, including legacy chunk routes.
5. Re-run synthetic tests and compare live schemas without writing production rows. The production version, ACL changes and end-to-end acceptance require access to the actual deployments and authorized role accounts.
