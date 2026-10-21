# Telegram Video Sticker Maker

A local-first video converter for **Telegram video stickers**.

Turn an MP4, MOV, WebM, or OGG video into a 512 x 512 silent WebM. Choose the
best three-second moment, set a size target, and download the result. Conversion stays in your browser; only sending the result to Telegram uploads it.

**[Open the sticker maker](https://kitttt2025.github.io/telegram-video-sticker-maker/)**

Free MP4 to WebM converter for Telegram stickers. No account or upload required.
This independent open-source project is not affiliated with Telegram.

## 點加 sticker 到 Telegram？

1. **揀片**：拖入 MP4／MOV／WebM／OGG，揀最多 3 秒。`Fill` 會裁成正方形；`Fit` 保留全畫面並加底色。
2. **下載**：按 **Create WebM**，完成後按 **Download WebM**。
3. **開新 pack**：到官方 [@Stickers](https://t.me/Stickers)，按 Start，輸入 `/newvideo`，再輸入貼圖包名稱。
4. **加 sticker**：用附件 → **File／檔案** 傳送下載嘅 `.webm` 原檔，唔好用影片壓縮模式；再按指示傳送代表佢嘅 emoji。
5. **發佈**：輸入 `/publish`，跟 bot 指示設定圖示及短名稱。打開佢提供嘅連結，按 **Add Stickers／加入貼圖**。

**已有自己嘅 pack？** 輸入 `/addsticker`，選擇你管理嘅 pack，傳送 `.webm` 同 emoji，再跟 bot 指示完成。

**加唔到？** 請用下載後嘅 `.webm` 原檔，唔好傳原本 MP4。呢個工具製作 video stickers；`/newanimated` 用於 `.tgs`，唔適用。Bot 介面如有改動，以佢顯示嘅選項為準。若瀏覽器無 VP9 編碼器，請試用新版 Chrome／Edge。

轉檔全程喺本機進行。你自行將檔案傳畀 Telegram 時先會上傳；貼圖包可以被分享，請先確認畫面冇私人內容。

## Quick start: add your sticker to Telegram

1. Choose a video, select up to three seconds, then click **Create WebM → Download WebM**.
2. Open the official [@Stickers](https://t.me/Stickers) bot, start it, and send `/newvideo` to name a new pack.
3. Attach the downloaded `.webm` as a **file/document**, preserving the original file. Send an emoji when prompted.
4. Send `/publish`, follow the bot's icon and short-name prompts, then open its pack link and choose **Add Stickers**.

To add to a pack you manage, use `/addsticker`, select the pack, and send the file and emoji. Follow the bot's prompts to finish. The bot also offers a mini app; its current prompts take precedence.

See the [official Telegram sticker guide](https://core.telegram.org/stickers) and [VP9 requirements](https://core.telegram.org/stickers#video-stickers-and-emoji).

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
If a browser cannot decode the selected source or encode VP9, the app shows
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
the browser. The production app blocks fetch/WebSocket connections using a Content Security
Policy and has no analytics or remote processing. GitHub Pages still serves the
site and may log ordinary requests (including IP addresses), as any web host can.
Opening the Telegram links navigates to Telegram; manually sending a sticker to
the bot uploads that file to Telegram. This is separate from local conversion.

Source metadata is not copied into the newly encoded video container, but visible
personal details in the frames remain, and the download name retains the source
basename. Check both before sharing. See [SECURITY.md](SECURITY.md) for the
security model and reporting instructions.

## Credits

Built with Codex. Uses React, WebCodecs, and
[webm-muxer](https://github.com/Vanilagy/webm-muxer) (MIT).

## License

[MIT](LICENSE)
