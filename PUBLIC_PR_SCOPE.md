# Public PR scope

The public pull request contains implementation, synthetic tests, configuration placeholders and general engineering documentation. It intentionally omits production supplier/reference audit CSVs, source-specific permission findings, raw database snapshots and actual staging-resource inventories. Those belong to the user's separately authorized delivery package.

Code in the source ZIP and PR is the same. BASELINE_AUDIT.md, SECURITY_REVIEW.md and DEPLOYMENT_GUIDE.md have more detailed operational information in the authorized ZIP. Public variants are deliberately redacted. Current test logs/screenshots and staging evidence are included in the ZIP; tests regenerate their local output when run from the PR.

The PR is a draft. It must not be merged, auto-merged or published to production before isolated live staging UAT and a separate production approval.
