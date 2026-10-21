# Security

## Reporting a vulnerability

Please report security issues privately through this repository's
[private vulnerability report form](https://github.com/kitttt2025/telegram-video-sticker-maker/security/advisories/new).
Do not include secrets or private videos in a public issue.

## Design and privacy boundaries

This is a static client-side application. It has no backend, authentication,
database, API keys, or telemetry. Videos are read through the File API and
processed locally using canvas, WebCodecs and a WebM muxer. Source file metadata
is not copied into the generated container. Visible information in video frames
and the original basename in the downloaded filename are still present.

The production Content Security Policy restricts scripts to the site's own
origin, blocks network API connections and plugins, and permits blob video
previews. Inline styles are allowed for React's progress/timeline presentation.
The development server omits this policy so Vite's local hot reload can work.
Referrer information is suppressed, including on external guide links.

GitHub Pages receives ordinary site requests and may log visitor IP addresses.
Sending an exported sticker to Telegram is a separate, user-initiated upload.
This tool cannot control Telegram's storage or how sticker packs are shared.

## Repository safeguards

- Deployment actions are pinned to commit SHAs.
- The build job has read-only repository access and does not retain checkout credentials.
- Only the deployment job receives Pages and OIDC write permissions.
- Dependabot checks npm dependencies and GitHub Actions weekly.
- Local environment files, common key files and video files are ignored by Git.
  Ignore rules cannot protect files already tracked or deliberately force-added.
- Use GitHub's noreply email for commits; commit authors, messages and history
  are public. Do not commit local paths, credentials or private sample media.

Keep your browser updated: decoding untrusted media relies on browser codecs.
The app is not a sandbox for malicious files and does not remove identifying
content visible within a video.

## Checks

Run `npm audit` for currently reported dependency advisories and `npm run check`
for type checking, tests and a production build. An audit with no findings is not
a guarantee that all vulnerabilities have been discovered.
