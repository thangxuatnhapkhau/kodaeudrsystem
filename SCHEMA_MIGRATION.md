# Schema migration

Only editor entrypoints: previewSupplierIdentityMigration(), backupSupplierIdentityMigration(), applySupplierIdentityMigration(input), rollbackSupplierIdentityMigration(input). They are not bridge actions. Require a current deploying Admin, ENVIRONMENT=STAGING, a dedicated DB_ID and ROOT_ID, and reject prepared production IDs. The stage-only guard is intentional; production migration requires a separately approved release change.

1. Inventory all current headers/dependencies. Freeze writes for backup/plan.
2. Dry-run and inspect exact append/create plan and schema/plan hashes.
3. Create backup, read back bytes and retain SHA256, timestamp and file ID.
4. Apply {confirmed:true, plan_hash, schema_hash, backup_id, backup_sha256}. Revalidate every source table against the backup before mutating. Append headers and create three tables only. Existing supplier rows/IDs and FKs are untouched. Verify schema and record activity.
5. If interrupted while adding headers, leave feature disabled. Inventory the partial schema, obtain a new dry-run/backup and approve the remaining additive plan. Preserve the initial backup. Do not delete/rewrite tables to retry.
6. Rollback disables SUPPLIER_IDENTITY_VERSION and retains additive headers/audit. It refuses blind restoration if source data or new identity decisions changed. Old code ignores appended columns. Reconcile new transactions before any further recovery.

Live staging schema migration was executed through a Google Sheets connector adapter and verified by readback. The Apps Script implementation was tested against a simulated spreadsheet, not deployed. Those are distinct validation scopes. See MIGRATION_EXECUTION_LOG.json.
