# Security review (public engineering summary)

Firebase authentication, signed bridge identity, capability checks and original supplier-ID authorization boundaries are retained. Supplier users cannot access new master-data actions or elevate with injected capabilities. Usage/history are filtered by authorized order scope; merges are Admin-only and block affected external-user dependencies. Redirect resolution is never used to broaden authorization.

New identity/alias approvals require evidence and current server-side snapshots. Durable save/chain/merge journals support reconciliation and safe retries; altered or stale state fails closed. No credentials or production records are intentionally added to this PR. Configuration files contain placeholders only. Preview deployments require explicitly verified isolated staging bindings.

Production security/access review, live authenticated staging UAT and deployment verification are still required. Source-specific security findings and operational evidence belong to the user's authorized delivery package and are not disclosed in this public PR. The release remains NOT_READY. Dependency audit found inherited moderate transitive findings; no unreviewed major dependency upgrade was made.
