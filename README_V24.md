# KODA EUDR Workspace — v2.4.8 staging candidate

Prepared 8 October 2026. This package extends v2.3.1 staging source. It is a code candidate for review, not a live deployment. See `release/WORKSPACE_V24_2026-10-08.md` for behavior, migration, tests, and acceptance checks.

## Verify locally

```sh
npm ci
npm run check
npm test
npm run test:pdf
```

## Staging rollout

Back up workbook and Drive root; complete prior v2.2/v2.3 migrations; run `migrateV24(true)` from Apps Script editor, review `unmapped` and `unmapped_policies`, then run `migrateV24(false)` as active Admin. It adds relationship child folders, default task rows, and remaps known legacy task blocks without moving old files or changing approvals. Deploy Apps Script and Netlify frontend/functions as a compatible set. Test with real accounts before production promotion. Review Drive sharing separately: application access controls do not override Drive ACLs.

The four relationship folders are `Commercial Shipping`, `FSC Certification`, `Transport`, and `Geolocation`. Custom evidence is added inside a selected block. The Customer → KODA Sales Order appears in KODA only, never in Tier 1 or later supplier blocks. Existing temporary password presentation and required first-login password change remain in place.

Prompt Studio v3.0.2 identifies each authorized source document by name, document ID and Drive URL, and provides an authorized Workspace download button. DOCUMENT_REVIEW lists links for its permitted collection; PRICE_REDACTION and ENGLISH_SUBTITLE include the selected document link. The PDF bytes still must be attached to the AI session; a link alone does not give the model access. Deploy the changed Apps Script backend as well as the frontend, then generate a new prompt run.

The 2.4.4 layout moves the selected product image into the right side of the green order header. Products, Materials and Supply Chain each use the full card width; the material and relationship secondary actions sit behind their small left arrow. My Tasks displays the two groups at full width on ordinary desktop screens so row actions stay together. Edit Relationship can change an active supplier; unfiled tracker tasks and relationship folder names follow the new supplier. Existing documents or GEO linked to that relationship block supplier reassignment pending human mapping, preserving their provenance.

The 2.4.6 Products area keeps `+ Add Product` visible and makes each product row a selector. The selected product's Edit, Product Image and Remove actions are hidden inside the arrow immediately left of `+ Add Product`; the Materials arrow contains only material actions. This Product arrow remains usable before any material is created. Order cards and the Workspace header derive their complete names from all active SO Products in sequence, with the stored legacy product field used only if no active Product rows exist.

The 2.4.7 AI output panel includes externally registered `AI_OUTPUT` documents. A prompt run can still retain `AWAITING_RESULT` when its structured result was not imported, while a PDF has already been registered separately. The panel displays `PDF REGISTERED · PENDING_REVIEW` for a linked copy and offers authorized document viewing; it does not silently approve, verify, reclassify, or export the external copy. For normal processed-copy verification, use the authorized in-app registration with its required boolean validation report, then have a reviewer verify the PDF.

The 2.4.8 AI Assistant creates an idempotent order-level AI_Output folder and PRICE_REDACTION / ENGLISH_SUBTITLE child folders when a prompt is generated. It displays their Drive links and registers PDFs submitted through the Workspace into the matching folder and 06_DOCUMENT_REGISTER row. A Price Redaction takes an approved active original; English Subtitle takes only an approved, human-verified redacted PDF, preserves its price masks and puts each English translation below the related Vietnamese content. Validation reports require actual checks (including redaction_preserved for subtitles); generated claims alone are not proof. An authorized reviewer verifies each copy before it becomes selectable in Export. DOCUMENT_REVIEW now asks for every stakeholder, branch and GEO country/harvest-location discrepancy. Existing externally registered AI_OUTPUT rows remain pending. From AI Results, an authorized user can register their exact stored PDF bytes with an actual validation report into the processed-copy workflow; the original external record is retained, and only the new copy becomes export eligible after separate human verification.
