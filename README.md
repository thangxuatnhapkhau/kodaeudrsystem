# KODA EUDR Supplier Identity Upgrade P0 + P1 — SI 1.0.0

Release assessment: **NOT_READY for production**. Source implementation is reviewable and locally tested. Dedicated Apps Script/Netlify/Firebase staging deployment and live UAT remain unverified. Do not use this package to deploy production.

This is an additive brownfield upgrade of GitHub baseline `04418c465713769cac77d8ab6b9668fa02d4289b`. It retains Netlify → signed Apps Script bridge → Google Sheets/Drive/Calendar and Firebase authentication. Deployable frontend is `public/`; backend is every `apps_script/*.gs` plus `apps_script/appsscript.json`. Root-level legacy JavaScript/GS files and `src/` are historical copies, not the deployment entrypoints. They are retained unchanged. Never mix them into an Apps Script project.

## Rebuild / verify
1. Install Node.js >=20 and run `npm ci --ignore-scripts`.
2. Run `npm run check`, `npm run check:identity`, `npm test`.
3. Run `npx playwright install chromium`, `npm run test:browser`, `npm run test:identity:browser`.
4. For existing offline PDF regression: install `tools/requirements.txt` and native Tesseract with English data on PATH, then `npm run test:pdf`. The PDF worker remains unchanged.
5. Follow DEPLOYMENT_GUIDE.md for isolated staging, schema backup/migration and Firebase provisioning. No production command is supplied by the new migration entrypoints.

The release ZIP includes the full deployable baseline, new services/UI, migrations, tests, configuration templates, reports, manifests and SHA256 hashes. Node modules, Git internals, Python caches, old embedded source ZIPs, raw production snapshots and credentials are excluded. Historical release records are evidence of prior releases only; current results are in TEST_RESULTS.md and release/supplier-identity/.

Operational reports containing production supplier IDs are provided in the delivery package/Drive release, not the public PR. No production documents are included. See SECURITY_REVIEW.md before sharing or deploying.

Remote publication is blocked by GitHub integration HTTP 403 and missing noninteractive Git credentials. No PR was created. A public-review patch and ready draft PR text are supplied in release/supplier-identity/. Do not push the full operational delivery branch to a public repository.
