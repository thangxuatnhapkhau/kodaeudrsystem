# Rollback and recovery runbook

## Frontend
Record current/previous Netlify deploy IDs and immutable bundle hashes before release. On a dedicated staging site, switch to the verified prior bundle through the existing Netlify deployment flow. Keep identity feature disabled while mixed frontend/backend versions exist. Do not publish/revert production without separate approval.

## Backend
Record the prior Apps Script deployment/version and complete source bundle before deployment. Restore that immutable version for the same environment only. Retain existing API contracts; older code ignores appended identity columns. New identity routes will be unavailable with the old backend, so feature/UI activation must be coordinated. Never copy production credentials into staging.

## Data
Use backupSupplierIdentityMigration() or the verified sanitized pre-migration workbook; retain backup timestamp, DB ID, schema/plan hashes and SHA256. New migration rollback disables the additive feature and preserves headers/audit. It does not rewrite original rows. Any new decisions/master data after backup require reconciliation before feature rollback.

For eligible supplier merge: preview the merge log, validate snapshot hash/source revision and unchanged dependencies, then Admin calls rollbackSupplierMerge(mergeId,{confirmed:true,reason}). A ROLLING_BACK journal permits interruption recovery. If later transactions/assignments/identity changes exist, stop automated rollback and prepare targeted compensating actions approved by the data/security owner. Never restore an entire database blindly.

After rollback verify supplier IDs, all relevant FKs/orphans, raw ACL supplier keys, node/edge counts/direction, source/lot identity, document IDs/hashes/folder existence, audit/journal status and new legitimate transactions. Retain immutable evidence and logs. Calendar production events are untouched.

Executed drills: Apps Script migration/merge rollback in VM; additive schema/feature rollback on the live sanitized Google Sheets copy via connector. NOT_EXECUTED: Netlify deployment rollback, Apps Script deployment rollback, live authenticated merge rollback and live concurrent recovery.
