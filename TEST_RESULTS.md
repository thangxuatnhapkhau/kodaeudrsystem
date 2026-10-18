# Test results — release candidate, 2026-10-18

| Scope | Executed | PASS | FAIL | BLOCKED / NOT_RUN |
|---|---:|---:|---:|---|
| Original JavaScript baseline | 217 | 217 | 0 | 0 |
| Upgrade JavaScript (includes 45 supplier tests) | 262 | 262 | 0 | 0 |
| Existing browser regression, corrected current fixture/navigation | 3 viewport scenarios | 3 | 0 | 0 |
| Supplier browser scenarios | 3 viewport scenarios | 3 | 0 | 0 |
| Native PDF regression | 7 | 2 | See environment note | 5 environment-blocked |
| Authenticated cloud UAT | 12 planned | 0 | 0 | 12 BLOCKED, NOT_RUN |

`npm run check` and `npm run check:identity` passed. Static checks parse 29 Apps Script files, verify nine supplier bridge actions, ensure migrations are not bridge-exposed, and check local HTML scripts/module paths. Live read-only audit found no missing supplier/node references among the inspected foreign keys; this is not proof of every Drive or JSON dependency.

The PDF runner actually executed seven tests after correcting Windows shell glob quoting. It reported 2 failures and 3 errors because native Tesseract is missing (OCR_VALIDATION_UNAVAILABLE); these five cases are classified BLOCKED, not PASS. The unchanged baseline produces the same outcome. PyMuPDF and Pillow were installed; the PDF worker was not changed. A trusted Tesseract installer was downloaded and hash-verified but was not installed globally. Production readiness remains closed.

The old browser fixture originally failed on both baseline and upgrade because it omitted current product/source allocations; its product action also sat inside a closed menu. Updated only that fixture and the menu-opening interaction, retaining all workflow assertions. All three scenarios then passed. New supplier scenarios exercise actual service functions in the Apps Script VM behind local HTTP mocks; they do not validate live Firebase/Apps Script/Google APIs.

Tests inject supplier/node/edge/task/merge/rollback failures and verify durable recovery, audit completion and stable IDs. Lock-boundary interleaving verifies rechecking a competing identity and actor permissions; true concurrent Apps Script execution remains a live UAT case. Screenshots were inspected at desktop, tablet and mobile; the initial reveal animation was allowed to finish before final capture. No cloud staging deployment or cloud UAT PASS is asserted.

Raw logs and JSON are in release/supplier-identity/. Historical release results elsewhere in the repository do not describe this release.
