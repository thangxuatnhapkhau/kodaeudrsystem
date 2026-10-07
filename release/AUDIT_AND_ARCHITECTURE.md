# Audit and architecture decision

**Historical v2.2 design record.** Admin rights, the evidence upload limit and scoped requirements changed in v2.3. Use `ACCEPTANCE_REPORT_V23.md` for the current implementation and release gates.

## Inspected sources

Read the downloaded contents of all 14 Apps Script files, the frontend, Netlify handlers and existing tests. Read live workbook metadata (23 tabs) and headers for 16 workflow/security tables, with no business-row mutation or export. Compared the observed headers against code schema; matching prefixes are preserved in `tests/fixtures/live-headers-2026-10-07.json`.

The source contains Firebase email-verification/UID binding, first-login password controls, allowed-origin checking, HMAC signatures, nonce replay checks, request fingerprints and durable upload sessions. These were reused. The deployed Netlify site's runtime/version could not be independently verified through the available public retrieval route. Findings below refer to the supplied source, not a claim about live execution.

## Observed conflicts and implementation

| Area | Baseline observation | v2.2 implementation |
|---|---|---|
| Orders | Single product string and image on master | Immutable products in `24_SO_PRODUCTS`; safe legacy backfill; edit order metadata without changing case ID; product create/edit/inactivate and image history |
| Order creation | Existing idempotency operation/folder checks | Validated multi-product request, stable operation IDs, `CREATING` rows hidden from bootstrap, retry-resumable folder/file/product creation; images uploaded sequentially with retry recovery |
| Sales Order | `document_` granted all internal order-scoped users access; `reviewDocument` rejected `kind=SO` | Explicit `SO_VIEW`; gate originals and derivatives, bootstrap, metadata, direct/chunk downloads and export re-downloads; SO review task repair reuses registered physical file |
| Review authority | ADMIN/EUDR_REVIEWER defaults | Server-side capabilities, Marketing evidence review and policy control; Admin has no automatic business evidence authority; explicit audited grants |
| Material workflow | AI extraction and manager-only imports | AI extraction disabled; MP manual create/update/import; optional Material PO; product ID list; missing scientific species stays blank |
| Supplier master | Minimal Admin-only supplier table | Reusable supplier codes, address/country/contact/registration; normalized exact duplicate detection; ambiguous match returns `HUMAN_MAPPING_REQUIRED` |
| Chain | Parent graph available, limited node types/no folders | Progressive unbounded-depth graph; producer/forest-owner identity without forced commercial supplier; cycle/same-material checks; stable relationship folders; node-linked requirements |
| Evidence | Upload versioning, but no draft removal and weak submit boundary | Uploader-only draft replacement/removal, supersession, submitted/approved replacement denied until review return; exact node folder and document linkage |
| Requirements | Mutable default rows | Versioned append-only rule records and effective dates; task stores requirement/version; existing approvals not retroactively rewritten |
| AI | Small findings schema and prompts containing raw Drive URLs | Exact-schema source-ID validation; persisted versioned prompts/results; deterministic invoice date checks; explicit human findings review; authorized outputs viewer |
| Derived PDF | Upload prompts, no local transformation engine | Real raster sanitization and separate subtitle worker, page mapping/size/OCR tests; lineage, checksum/report/run registration and human verification |
| GEO | Point/simple polygon validator and human review already present | Reused; terminal producers can link plots; every linked plot must be verified for branch readiness; GeoJSON export; no generated coordinates |
| Export | Approved active versions, supplier exclusion | Reused plus SO capability, derived-state/checksum validation, stored document ID manifest and permission rechecks on every download; legacy packages require regeneration |
| Performance | Repeated full-table reads | Per-request table cache invalidated by writes. Bootstrap still reads tables once, then filters scopes. Production scale/index performance is not yet benchmarked. |

## Entity and folder model

- `01_SO_MASTER.id` remains immutable. Renaming SO never renames IDs or automatically moves folders.
- `24_SO_PRODUCTS.case_id` → order; `image_document_id` → existing document register.
- `02_SO_ITEM_MATERIAL.case_id` → order; `product_ids` stores validated immutable product IDs as a bounded JSON list (no duplicated material table).
- `14_SUPPLIERS` remains the shared supplier master. Country here is contact/address data, never automatically production origin.
- `15_SUPPLY_CHAIN` remains the parent graph. Each node has order/material scope, optional commercial supplier, identity/type, tier, terminal flag and folder.
- `04_EVIDENCE_TRACKER` binds requirement version, node and document.
- `06_DOCUMENT_REGISTER` remains the sole registry; derived files link original + prompt run + size/hash + human review.
- `17_GEO_LOCATIONS` remains the plot store with source and human reviewer.
- `07_AI_REVIEW_QUEUE` and `18_AI_PROMPT_RUNS` retain imported findings and exact prompts/results. No disconnected AI database.

New folders include immutable IDs in names. Relationship folders sit under the material folder; uploaded node evidence uses that stored folder ID. Existing folder links remain readable and no destructive reorganization runs. An existing physical folder not unambiguously associated with a retry requires explicit selection. Folder-level sharing must be separately secured.

## Default capability matrix

All rights below also require existing order/task scope. Explicit additional grants are stored in `05_OWNER_MASTER.capabilities`, assigned only by an authenticated Admin through the confirmation action. External suppliers cannot elevate through that field.

| Role | Order / SO | Material | Supplier / chain | Evidence | AI / export |
|---|---|---|---|---|---|
| Marketing | Create/edit + SO view | No default | No default | Review, policy; GEO review | Generate/review AI, export, close/reopen |
| MP | Metadata within assigned scope; no SO PDF | Create/update/import/PO | No default | No approval | AI assistance |
| Purchasing / Sourcing | Metadata; no SO PDF | No default material-master writes | Create/reuse/update | Upload/draft/submit; origin via GEO | AI assistance, no approval |
| Admin | System administration; SO only by grant | By grant | By grant | By grant | By grant |
| Legacy EUDR_REVIEWER | Assigned metadata; no automatic SO view | By grant | By grant | Explicit review grant required | AI assistance; export by grant |
| Supplier user | Existing supplier scope only | Scoped metadata | Existing limited visibility | Own assigned drafts/submit/GEO | No internal AI/export |
| Viewer | Assigned metadata | Read-only | Read-only | No write | No export by default |

Do not blindly migrate the previous Admin/Reviewer authority into new capability cells. A business owner must decide real grants in staging before release.

## State and lineage

Evidence: MISSING → UPLOADED (draft) → SUBMITTED → IN_REVIEW → APPROVED / REJECTED / MORE_INFO_REQUIRED. Removing a draft archives it as SUPERSEDED. Replacements retain old register rows, source files and audit. APPROVED means internal evidence acceptance only.

An SO uploaded during order creation starts SUBMITTED and is referenced by an order-level task. Repair links legacy SO review tasks and requests review without duplicating files or assigning approval. Existing approved states are preserved by migration and repair.

AI: AWAITING_RESULT → HUMAN_REVIEW_REQUIRED → REVIEWED. Every finding needs an explicit human resolution, accepted-warning decision or follow-up. Closure requires current source versions to be covered by reviewed AI runs. Derived output remains UPLOADED until explicit human verification; upload is not approval.

## Known implementation limits requiring staging decisions

- Apps Script/Drive lacks cross-service ACID transactions. Creation uses an idempotent recoverable sequence with hidden incomplete order rows. User/browser session loss during an optional image upload may require reopening the product and selecting that image again; the order itself is not duplicated.
- Identity folders/file markers prevent duplicate retries after the stored ID/marker succeeds. A process interruption between Drive object creation and its marker write can require human recovery, rather than guessing ownership.
- Original evidence keeps the existing 25 MiB chunk path. SO, product images and derived PDF use strict <3,000,000 byte limits.
- New node creation snapshots currently effective requirements. Applying later policies to old nodes is intentionally not automatic; design a reviewed re-synchronization workflow if needed.
- Original single-ring Point/Polygon support remains. Holes, antimeridian geometries and more complex geometry need specialist handling. Declared coordinate precision must be checked against the cited source by a human.
- AI review batches are limited to 200 findings and a bounded prompt/result cell size. Large orders need scoped runs. Date fields are deterministic comparisons of submitted evidence values, not proof that OCR/source extraction is correct.
- The PDF worker requires Python, PyMuPDF, Pillow and Tesseract in the human-operated AI workflow. It does not execute inside Netlify or Apps Script. Real document QA and human source mapping remain mandatory.
- Performance, concurrent real-user operations and all UI language/layout combinations still require live staging validation.
