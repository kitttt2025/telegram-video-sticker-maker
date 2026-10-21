# video2webm

A local-first video converter for **Telegram animated stickers**.

Turn an MP4, MOV, WebM, or OGG video into a 512 x 512 silent WebM. Choose the
best three-second moment, set a size target, and download the result. The video
never leaves the browser.

## Telegram sticker targets

| Setting | Target |
| --- | --- |
| Canvas | 512 x 512 |
| Duration | 3 seconds or less |
| File size | 256 KB or less |
| Video | VP9 WebM, no audio |
| Frame rate | 30 fps |

The converter uses the browser's native WebCodecs API and a small WebM muxer.
It makes several encoding attempts at progressively lower bitrates until the
file fits the selected limit.

## Features

- Drag and drop, or choose a local video.
- Pick the start point and length of the sticker.
- Fill the square or fit the whole frame with a custom matte colour.
- Adjust the target size and frame rate.
- Preview the source and final sticker before downloading.
- No server, accounts, API keys, analytics, CDN fonts, or uploads.

## Browser support

Use a current desktop or mobile version of Chrome, Edge, or Firefox with
WebCodecs support. Safari support depends on the installed WebCodecs encoder.
If a browser cannot decode the selected source or encode VP9/VP8, the app shows
an error instead of uploading the file elsewhere.

## Run locally

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and test

```bash
npm run check
```

This runs the TypeScript check, unit tests, and production build. To preview the
production build:

```bash
npm run preview
```

## Deploy

The build output is a static site in `dist/`. Deploy that folder to any static
host, including GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

The included workflow builds and tests every push to `main`. If you enable
**Settings -> Pages -> Source: GitHub Actions**, it will also publish the
production build.

## Privacy

Video decoding, canvas rendering, encoding, and download all happen locally in
the browser. The app makes no network requests after its own static assets have
loaded.

## Credits

Built with Codex. Uses React, WebCodecs, and
[webm-muxer](https://github.com/Vanilagy/webm-muxer) (MIT).

## License

[MIT](LICENSE)
