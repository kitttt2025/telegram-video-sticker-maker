# Security and privacy review — 2026-10-21

## Scope and results

Reviewed the public repository at commit `122daab`, its only public branch
(`main`), all four reachable commits and their file versions, both published
GitHub Actions runs and their log archives, and both GitHub Pages artifacts.
There were no tags, releases, or public issues/PRs at the time of review.
The new production build was included in the scan: 73 items in total.

A pattern-based scan for common provider tokens, private keys, credential
assignments, personal local paths and email addresses found no matches requiring
remediation. Manual source review found no uploads, telemetry, remote scripts,
user-controlled HTML injection or committed private media. The public GitHub
handle and GitHub noreply commit email are intentionally visible. This does not
inspect the owner's wider GitHub profile, other repositories, inaccessible or
deleted remote objects, third-party caches, or unknown secret formats.

`npm audit` reported zero known vulnerabilities. GitHub secret-scanning and
Dependabot alert APIs returned empty lists after their protections were enabled;
new scans can report additional findings later.

## Changes made

- Enabled GitHub secret scanning, push protection, private vulnerability
  reporting, vulnerability alerts and Dependabot security fixes.
- Limited deployment write permissions to the deploy job; disabled persisted
  checkout credentials and pinned third-party actions to verified commit SHAs.
- Added weekly npm and GitHub Actions dependency checks.
- Added a production Content Security Policy that blocks network API connections,
  with local blob media previews, and a no-referrer policy.
- Ignored common private key and video file types to reduce accidental commits.
- Clarified the boundary between local processing, hosting logs and manually
  uploading the exported sticker to Telegram.

## Validation and remaining boundaries

Type checking, seven unit tests and the production build passed. A synthetic
local video converted successfully under the production security policy to
512 × 512 VP9 WebM (9.4 KB); the browser reported no warnings or errors.
The guide's anchor navigation and narrow-screen layout were checked in-browser.
No test file was sent to Telegram.

Direct pushes to `main` remain allowed. Anyone with repository write access can
change published code; account security and collaborator access were outside
this review. The production policy allows same-origin scripts and inline styles,
and is a defense in depth, not a guarantee against compromised source code.

No identifying source metadata is copied into the new video container, but
visible content and the download's source basename can still identify someone.
Check those before sharing. No scan can prove the absence of every secret or
vulnerability; these results describe the reviewed state and checks above.
