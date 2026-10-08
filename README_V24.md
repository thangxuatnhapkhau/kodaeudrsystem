# KODA EUDR Workspace — v2.4 staging candidate

Prepared 8 October 2026. This package extends v2.3.1 staging source. It is a code candidate for review, not a live deployment. See `release/WORKSPACE_V24_2026-10-08.md` for behavior, migration, tests, and acceptance checks.

## Verify locally

```sh
npm ci
npm run check
npm test
npm run test:pdf
```

## Staging rollout

Back up workbook and Drive root; complete prior v2.2/v2.3 migrations; run `migrateV24(true)` from Apps Script editor, review `unmapped` and `unmapped_policies`, then run `migrateV24(false)` as active Admin. It adds relationship child folders, default task rows, and remaps known legacy task blocks without moving old files or changing approvals. Deploy Apps Script and Netlify frontend/functions as a compatible set. Test with real accounts before production promotion. Review Drive sharing separately: application access controls do not override Drive ACLs.

The four relationship folders are `Commercial Shipping`, `FSC Certification`, `Transport`, and `Geolocation`. Custom evidence is added inside a selected block. Existing temporary password presentation and required first-login password change remain in place.
