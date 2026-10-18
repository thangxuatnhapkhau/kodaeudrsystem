# Release notes — SI 1.0.0 candidate

Implements P0/P1 supplier identity resolution, verified aliases, server-side review decisions, current-design review/directory UI, explicit legal identity verification, controlled redirect merge, durable intents/retries, additive stage migration and rollback scripts. Architecture and transaction identity are retained.

Intentional behavior changes: unverified exact names require review instead of automatic reuse; chain confirmation does not approve identity; related new names require an explicit shared entity group or distinct-entity evidence; supplier removal deactivates and retains history; merged IDs cannot be selected independently; supplier-user merge dependencies remain blocked for security review. Existing clients editing a supplier must send expected_updated_at. New frontend/backend must ship together after migration.

Current assessment: NOT_READY for production. Locally runnable source package is complete; cloud staging and authenticated UAT are pending. Production database/source/documents/deployments/permissions and Calendar events were not modified. A separate sanitized staging copy and new release folder were created. No actual supplier pair was verified or merged.
