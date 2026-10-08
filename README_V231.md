# KODA EUDR Workspace — v2.3.1 staging hotfix

Prepared 8 October 2026. This package contains the v2.3 staging candidate with a focused bridge diagnostic and CSP compatible PDF preview update. It is not a production deployment. Read `release/HOTFIX_UPSTREAM_CSP_2026-10-08.md` for scope, evidence, test results, and rollout checks. The original v2.3 acceptance report and migration requirements remain relevant.

## Verify locally

```sh
npm ci
npm run check
npm test
npm run test:pdf
```

For a staging rollout, use the existing Netlify configuration and environment variables. Deploy the frontend and functions together; no Apps Script schema change is introduced by this hotfix. Check the same update action, reopen the record before retrying if a 5xx occurs, and inspect the Netlify function log by `requestId`. Open a PDF preview to confirm the canvas renderer works under the served CSP. Complete the original v2.3 migration and acceptance gates separately if they have not already been completed.

The bundled PDF.js 6.4.299 assets are under `public/vendor/pdfjs/` with their upstream license. The PDF preview stays on this origin and uses an external module and worker. `script-src` allows the narrowly scoped WebAssembly compilation token while continuing to block inline scripts and general string evaluation.
