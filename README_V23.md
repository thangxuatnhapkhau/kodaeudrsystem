# KODA EUDR Workspace — v2.3 staging candidate

Historical v2.3 candidate. For the upstream/CSP update, read `README_V231.md` and `release/HOTFIX_UPSTREAM_CSP_2026-10-08.md` first; the v2.3 release hash manifest predates those changes.

Prepared 7 October 2026 from the supplied v2.2 staging source plus read-only checks of the live `EUDR SYSTEM` workbook and Drive metadata. This is **not** a production deployment or legal approval. No production Sheet rows, Drive files, sharing ACLs, Firebase settings or Netlify/Apps Script deployments were changed.

## Read first

- `release/ACCEPTANCE_REPORT_V23.md`: A–L audit, requirement status, data and permission models, migration counts, QA A–O, deployment gates and exceptions.
- `release/IMPACT_MAP_2026-10-07.md`: existing system and affected modules.
- `release/SCHEMA_V23.json`: exact schema and four additive tracker columns.
- `release/BUILD_V23.json` and `release/SHA256_V23.txt`: package file manifest and hashes.
- `release/LEGAL_BASELINE.json`, `release/prompts/`: historical v2.2 reference inputs. The legal baseline requires current human review.

Earlier `README_V22.md` and `release/*V22*` files are historical. In particular, v2.2 descriptions of Admin grants and a 25 MiB evidence upload do **not** apply to this candidate.

## What changed

- Admin has all backend business capabilities and sees New Order without an explicit grant.
- All manual uploads, including the existing chunk path and derived PDF registration, reject files at or above **3,000,000 bytes**.
- The Order Workspace retains its summary and combined Product/Material area, shows the four familiar evidence blocks, and opens consolidated blockers only at **Review & Complete Dossier**.
- Marketing/Admin can make a scoped `REQUIRED`, `OPTIONAL` or `NOT_REQUIRED` decision on a task, or add a scoped evidence type for a material/tier. Every decision requires a reason, actor and audit entry. Global policy rows stay unchanged.
- `migrateV23(true)` previews the additive schema; `migrateV23(false)` adds four columns to `04_EVIDENCE_TRACKER` without rewriting business rows. Run on a backed-up staging workbook before deploying this backend.

## Local verification

```sh
npm ci
npm run check
npm test
npm run test:pdf
```

These pass with synthetic/mock services in this package. Browser visual QA remains blocked here because the Chromium download was invalid; `npm run test:browser` requires Playwright plus a working Chromium installation. Live role, file, Calendar and deployment acceptance remain outstanding.

Do not deploy a v2.3 frontend against a v2.2 Apps Script bridge or skip the v2.3 header migration. Preserve all existing file IDs and approvals. The report specifies the staging, production and rollback sequence.
