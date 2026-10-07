# KODA EUDR Workspace — v2.2 staging candidate

Prepared 7 October 2026 from the supplied Google Drive workspace and live header-only inspection of EUDR SYSTEM. This is an incremental implementation candidate, not a production release or regulatory approval. Production files, Sheet rows, sharing permissions, Firebase configuration and deployments were not changed.

## Start here

- `release/AUDIT_AND_ARCHITECTURE.md`: observed baseline, security findings, decisions and exact scope.
- `release/STAGING_AND_ROLLBACK.md`: isolated staging sequence, human gates and recovery.
- `release/UAT.csv`: all 63 requested acceptance scenarios and remaining manual checks.
- `release/LEGAL_BASELINE.json`: official references, retrieval limitations and pending human legal review.
- `release/SCHEMA_V22.json`: frozen baseline, added fields and final schemas.
- `release/javascript-tests.txt`, `release/pdf-tests.txt`, `release/syntax-check.txt`: executed results.
- `release/CHANGES.patch`: patch against downloaded baseline; complete modified files are included in their normal paths.
- `release/prompts/`: rendered production prompt templates, semantic version 3.0.0, with synthetic example context only.

## Verification

The untouched baseline passed 59 Node tests. The modified build passed 84 JavaScript tests (including 4 DOM interaction tests) and 7 Python PDF tests. These use synthetic data, mocked Google services and a local PDF engine. They do not prove live Firebase/Netlify/Apps Script acceptance. PDF examples were rendered and visually inspected.

Real-browser test execution is **BLOCKED**: Chromium was unavailable and the installer returned invalid/truncated archives. The supplied `tests/browser-v22.mjs` covers desktop EN, tablet VI and mobile VI, but has not passed in this environment. `tests/fixtures/historical-v21-browser-qa-result.json` belongs to the source baseline, not this upgrade.

## Release blockers

1. Drive metadata returned `anyone: writer` on the source-code folder, EUDR workbook and evidence root. An authorized owner must review/remove public editing and inspect inherited file sharing. Application controls cannot override Drive ACLs. No sharing changes were made here.
2. No isolated staging Apps Script/Netlify/Firebase deployment or live role accounts were provided. Deploy and exercise the included UAT against separate staging resources.
3. Complete official legal-text review is pending: several EUR-Lex full-text URLs returned anti-bot pages. Retrieved official metadata/FAQ does not constitute human legal confirmation. No legal setting or country-risk record was approved automatically.
4. Complete real-browser EN/VI visual QA and workflow UAT. Existing/new labels have EN/VI support, but not every technical field/error label has been linguistically reviewed.
5. Review real document size, quality, OCR and execution limits. The PDF engine is a separate offline worker in the existing human-operated prompt workflow, not a new automatic cloud AI service.

## Run locally

```sh
npm ci
npm test
npm run check
python -m pip install -r tools/requirements.txt
# Also install Tesseract OCR in the worker environment.
npm run test:pdf
# Optional browser QA dependency; install Playwright and its Chromium runtime first.
npm run test:browser
```

No credentials are included. The tools do not deploy or migrate automatically.

## PDF worker

```sh
python tools/derived_pdf.py redact source.pdf redacted.pdf manifest.json
python tools/derived_pdf.py subtitle source.pdf english-subtitle.pdf manifest.json
```

A manifest must identify `source_document_id` and list every source page in order. For redaction each page has `price_boxes` in PDF points `[x0,y0,x1,y1]`; `original_amounts` lists exact amounts for OCR checks. For subtitles each page has the supplied `english` text. This utility does not invent a translation or detect every price automatically. Run it on the actual source bytes with reviewed mappings from the AI/human workflow.

The worker reconstructs pages from sanitized images in a fresh PDF, removing source text layers, attachments, forms and metadata. Original files remain unchanged. Redacted PDFs lose searchable original text; subtitles keep visible original content in a separate area with supporting English below. No quality downgrade is attempted to force the file below 3,000,000 bytes; oversized output returns `OUTPUT_SIZE_BLOCKED`. Long subtitles return `TRANSLATION_LAYOUT_BLOCKED` instead of clipping. Specialist handling is required for unsupported/encrypted documents or uncertain OCR.

The generated report starts with human readability/traceability checks false unless explicitly supplied after review. The authorized human must verify those checks, register the report with the exact persisted prompt run and PDF, then separately verify the derivative in the application. Boolean report fields are declarations, not cryptographic proof; the application also stores/rechecks file SHA-256 and size. Do not treat report upload as automatic redaction/translation approval.
