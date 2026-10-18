# Data model

14_SUPPLIERS retains its 14 existing fields in order. Append: legal_name, display_name, registration_country, registration_namespace, registration_verified, identity_status, merged_into_id, verified_at, verified_by, identity_evidence, identity_revision. Existing registration is the sole identifier value; namespace/jurisdiction qualify it. Existing name remains compatible. Display name falls back to name; no legal name is inferred by migration.

Directory status is derived: ACTIVE means active=YES and no redirect; INACTIVE means active=NO; MERGED means identity_status=MERGED with merged_into_id. Identity verification is independently UNVERIFIED/VERIFIED. Blank legacy verification is treated as unverified. A merged historical record remains readable and retains its ID; it is excluded from new selections. There is one redirect source of truth rather than redundant canonical fields.

44_SUPPLIER_ALIASES stores supplier_id, original and strict normalized alias, type, country, verification status, evidence and creator/reviewer/timestamps/active. Same-supplier active duplicates are rejected. Cross-entity aliases are allowed as conflicts; no global uniqueness assumption. VERIFIED requires authorized explicit evidence review. Pending/rejected aliases cannot authorize automatic reuse.

45_SUPPLIER_MATCH_QUEUE stores context/case/node, detected text, original document/page/excerpt, candidate IDs/reasons, rule version, ranking/conflict indicators, decision/reviewer/time, resolution/new-group metadata, request key, source/master hashes and status. Supports PENDING_REVIEW, MATCH_CONFIRMED, NEW_CONFIRMED, REJECTED, CONFLICT, DEFERRED. Queue IDs are deterministic per context/node.

46_SUPPLIER_MERGE_LOG stores source/target, immutable snapshot/hash, per-table counts, reason/evidence, approval, RUNNING/DONE/ROLLING_BACK/ROLLED_BACK state, execution/reconciliation and rollback reference. Snapshot size over 45KB blocks execution pending a separately reviewed external journal strategy. Migration runs use existing activity log/config plus verified backup files; no purposeless extra table.

Exact ordered schemas are in migrations/si-1.0.0.json, the service definitions and the package schema inventory. No production schema has been changed.
