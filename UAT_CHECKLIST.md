# UAT checklist and release gates

Local JS tests cover J1 TC01–TC18 behavior using synthetic records, including verified aliases, conflicting IDs, Unicode/OCR variants, repeated nodes/positions, lock-boundary interleaving, request replay, partial failure and unauthorized edits. True simultaneous Apps Script users are not simulated by single-threaded VM interleaving: run the live concurrency case below.

For live staging, record tester, timestamp, commit, Apps Script version, DB/root IDs and evidence for each item in UAT_CASES.csv. All are currently BLOCKED/NOT_RUN, not PASS:
1. Firebase login/provisioning/expiry and role matrix with safe test accounts.
2. Two independent concurrent users creating the same proposed identity.
3. Signed Netlify → Apps Script bridge using only staging secrets/origins.
4. SO upload/import and product/material/source allocations.
5. OCR/AI review with real synthetic PDFs, citation/hash mismatch and stale context.
6. Supplier matching review, canonical reuse and duplicate prevention across SOs.
7. Alias approval, conflicting shared alias and unverified alias refusal.
8. Directed chain/lot/edge preservation and no missing task requirements.
9. Evidence classify/review/reject/approve and supplier-user isolation.
10. GEO and export with old supplier ID history and unchanged documents.
11. Dedicated test Calendar follow-up; no event per duplicate candidate.
12. Approved merge, interruption/retry, new-activity rollback refusal, deployment rollback and restoration verification.

Additional gates: security boundary corrected by authorized owner; inherited dependency findings reviewed; legal identity owners approve actual candidate pairs; no outstanding critical regression; fresh source/deployment baseline reconciliation. No production migration, merge, credential/permission change or deployment without separate approval after UAT.
