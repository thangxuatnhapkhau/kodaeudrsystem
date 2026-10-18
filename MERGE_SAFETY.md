# Controlled merge safety

Admin-only merge is a canonical redirect, not a reference rewrite. Preview snapshots source/target and every SCHEMA table with supplier_id, including owners, documents, evidence tasks, chain nodes, material sources and GEO. No self/circular/inactive target, registration/legal-identity conflict, stale dependency snapshot or unresolved running merge is allowed. Both identities need human verification and explicit evidence/reason/confirmation.

Any affected SUPPLIER_USER account blocks merge with SECURITY_REVIEW_REQUIRED. This release deliberately has no one-click override: resolve and approve the access model separately. It never migrates user supplier_id or canonicalizes canTask_/canOrder_ checks. Selecting a canonical identity for future work may change who can see future records, so the gate is mandatory.

Execution writes a durable journal before the one master redirect mutation. Original FKs, nodes, plots, lots, edges, document versions, folders and evidence approvals remain unchanged. Reconcile before declaring success. A crash after redirect resumes from the same request/journal and completes audit without duplicating identity. Hash-check snapshots before recovery.

Rollback is eligible only while the source identity revision still equals that merge and the original dependencies are unchanged. Journal ROLLING_BACK before restoration permits a retry after interruption. New transactions, assignments or subsequent identity edits force manual recovery; never restore an entire workbook over valid later activity. No original records/documents are deleted. The 45KB journal-cell size limit is a deliberate execution blocker.
