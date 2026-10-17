# P2 Rollback Runbook — KODA EUDR Workspace

## 1. Zero-Data-Loss Guarantee

Because P2 modifies only frontend static files (`public/*`) and does not alter Google Sheets tables, Drive folder structures, or Apps Script endpoints, rolling back P2 has **zero impact** on stored orders, materials, supplier records, documents, or audit logs.

## 2. Instant Rollback via Netlify (Recommended — < 30 seconds)

1. Open the Netlify Dashboard for `koda-eudr-system`.
2. Navigate to **Deploys**.
3. Select the previous known-good production deploy (pinned baseline commit `04418c465713769cac77d8ab6b9668fa02d4289b`) and click **Publish deploy**.

## 3. Git Revert Rollback

If rolling back via Git:
```bash
git checkout main
git revert <p2-merge-commit-sha>
git push origin main
```
Users' browsers will automatically clear any incompatible session keys on next sign-in (`clearAuth()` removes `eudr_nav_state`).
