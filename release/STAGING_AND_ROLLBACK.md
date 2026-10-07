# Staging sequence and approval gates

## 1. Resolve access exposure and obtain snapshots

An authorized owner must review `anyone: writer` on the supplied source folder, EUDR workbook and evidence root, including inherited Sales Order file access. Do not rely on app permission changes to close direct Drive access. Use approved named groups/service identities. Recheck ACL metadata and test an unauthorized direct Drive viewer.

Record and retain production Apps Script version, Netlify deployment ID, complete workbook backup and folder/file ID inventory in a restricted destination. A generic Drive folder copy can create different file IDs: do not assume IDs in a copied Sheet point at a copied folder tree.

## 2. Prepare genuinely isolated resources

Create a staging workbook with matching V2.1 schemas and synthetic or approved sanitized records. Use a separate staging root and Calendar. Prefer a separate Firebase project with test accounts for Marketing, MP, Purchasing, Sourcing, Admin and external supplier. Ensure every folder/file reference in staging points to staging, or clear it in the staging copy with a reviewed mapping. **Never test writes against a Sheet clone that still references production folders.**

Create a staging Apps Script project and copy all supplied `apps_script` files. Enable the existing Advanced Calendar service when testing Calendar. Set Script Properties `DB_ID`, `ROOT_ID`, `CALENDAR_ID`, `BRIDGE_SECRET`, `ALLOWED_ORIGINS` to staging resources/secrets. Do not invoke `attachPreparedSheet()`, `reconnectPreparedSheet()` or parameterless `setup()`; those retained baseline helpers reference production IDs.

Keep staging credentials in Script Properties / Netlify environment only. Do not paste credentials into this repository, Sheet cells, prompts, screenshots or logs.

## 3. Schema preflight / migration

As the existing authorized deploying Admin, run `migrateV22()` (default dry run). It validates every expected V2.1 header, including existing tables not changed, before any write. Missing/wrong/extra/out-of-order columns stop with SCHEMA_MISMATCH. Do not auto-repair.

Review `release/SCHEMA_V22.json` and dry-run output. Then run `migrateV22(false)` **on staging only**. It adds columns, creates `24_SO_PRODUCTS`, and safely backfills one legacy product only for orders with no product rows. Missing legacy product names remain blank for human correction; no invented names or quantities. It does not grant capabilities, move folders, approve evidence or change legal config.

Save actual migration results and before/after table counts. Execute again: expected `columns=0, products=0`, with unchanged record IDs, source values, approvals and lineage. The included unit test verifies this algorithm on synthetic fixtures, not the production workbook.

## 4. Backend and Netlify

Deploy staging Apps Script as the designated service identity, retaining signed-bridge authentication and allowed origin checks. Use a separate Netlify staging site with the existing `netlify.toml` configuration. Set:

- `APPS_SCRIPT_WEBAPP_URL`: staging Apps Script endpoint
- `BRIDGE_SECRET`: matching staging secret (at least 32 characters)
- `ALLOWED_ORIGINS`: exact staging site origin only
- `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_WEB_API_KEY`: staging auth configuration
- `LEGACY_TOKEN_LOGIN=false` and `ALLOW_PILOT_ADMIN=false`

Run `npm ci`, `npm test`, `npm run check`. Python PDF tools stay in the approved offline worker environment. Do not replace Netlify with Sites hosting.

Deploy a new staging version of both backend and frontend together. Provision/bind staging Firebase users using the retained Admin flow. Assign needed order scopes and explicit business capabilities to non-Admin roles. Verify Admin has all application capabilities without a per-user grant. Do not email credentials from automation. For v2.3, run the additive `migrateV23(true)` preview and `migrateV23(false)` on the backed-up staging workbook before deploying the v2.3 backend; see `ACCEPTANCE_REPORT_V23.md`.

## 5. Legal and business configuration

Review every source in `LEGAL_BASELINE.json`, retrieve the complete current consolidated law and Annex I, confirm operator category/application date and production-country benchmarking, and record exact versions + human reviewer in Settings. Keep RULES_CONFIRMED=NO until that review. No supplied candidate JSON is approved legal configuration.

Review source-backed HS/CN mapping for each actual product. Tier structure and chronology are internal KODA controls, not legal certifications. Review required evidence and create initial policy versions through Marketing.

## 6. UAT and release decision

Execute every row of `UAT.csv` using real staging accounts, EN/VI, desktop/tablet/mobile. Capture actual request IDs, Sheet rows, folder IDs, document IDs, screenshots and expected/actual results. Preserve source originals. Include timeout retries, chunk corruption and unauthorized API manipulation. Browser and mock passes do not substitute for business sign-off.

Inspect all current documents and AI outputs in an order, including file replacement after a prior reviewed AI run. Confirm closure is blocked until current-version review is complete. Verify exports cannot reveal SO or SO-derived content to users lacking SO_VIEW, including cached ZIP downloads.

Only after the release blockers are cleared, provide the exact build checksum, migration plan/results, permissions matrix and UAT sign-offs for explicit human production approval. No production deployment is authorized by this package.

## 7. Rollback

Before production approval, record a reversible maintenance window and block writes during deployment. Additive schema does not require deleting columns for rollback. Preserve new tabs/columns/audit rows even if rolling back code.

A v2.1 runtime does **not** understand v2.2 products, capability rules or SO restrictions. Blindly reverting to v2.1 can restore broader SO access. Preferred failure response: disable writes/affected routes, retain v2.2 access checks, revert only an isolated faulty feature. If a full rollback is necessary, use the validated restricted backup environment and approved access controls; reconcile all post-backup operations manually before resuming writes.

Never restore a workbook backup over newer production records without a signed reconciliation plan. Never delete original/derived documents or audit rows as rollback. Preserve staging failure evidence and re-run migration dry run and permission tests before any reattempt.
