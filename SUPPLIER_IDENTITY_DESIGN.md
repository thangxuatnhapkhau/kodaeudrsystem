# Supplier identity design

Identity and transactions are separate. Multiple chain nodes, tiers, orders, material sources and lots can reference one master supplier. Matching never collapses nodes/transactions and never approves evidence, legality, origin or DDS.

Resolution order: explicit canonical ID; unique verified identifier within an exact namespace and ISO jurisdiction; unique verified alias; exact name on a verified master; otherwise ranked candidates or a proposed new supplier. Conflicting registrations, duplicate master names or shared verified aliases block automatic selection. Inactive targets are unavailable. Historical redirects resolve identities, but authorization always compares original supplier IDs.

Strict automatic-name/alias equality uses NFKC, case and whitespace normalization only. Accent stripping, punctuation/hyphen handling, legal suffix tokens and possible OCR substitutions are candidate retrieval aids. One shared substantive token can retrieve a candidate; the overlap score only orders review, and is not calibrated legal confidence. No fuzzy threshold authorizes reuse or merge. Name tokens are deliberately broad; the live candidate report contains 8 pairs including four known suspicious pairs and four lower-quality overlaps. None is approved.

Every ambiguous proposal node needs a persisted, case-scoped queue decision. Chain confirmation is separate. Related new spellings must share a human-approved entity group, or carry explicit distinct-entity evidence. Refreshing the browser does not bypass server decisions. Human mapping does not automatically create a verified alias.

All master mutations run inside the existing script lock. Durable operation fingerprints reject changed retries. Write-ahead save/chain intents preserve planned IDs, and retries reconcile only untouched drafts. Changed source snapshots, documents, master data or already-edited drafts fail closed and require a fresh review/manual recovery. Sheets/Drive operations are not ACID transactions. See MERGE_SAFETY.md for compensating recovery.
