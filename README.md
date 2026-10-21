# Telegram Video Sticker Maker

**Turn a short video into a Telegram sticker, right in your browser.**

Trim an MP4, MOV, WebM or OGG clip, frame it as a square, and download a silent
VP9 WebM for your Telegram sticker pack. All conversion happens on your device;
no account, API key or video upload is required.

**[Open the sticker maker](https://kitttt2025.github.io/telegram-video-sticker-maker/)**
· [English guide](#how-to-add-stickers-to-telegram)
· [繁體中文教學](#繁體中文使用教學)
· [Privacy](#privacy)

## What you can do

- **Pick the moment.** Select the start time and keep up to three seconds.
- **Frame the sticker.** Use **Fill** to crop to a square, or **Fit** to keep the
  whole frame with a background colour of your choice.
- **Control the size.** Choose a file-size target and frame rate. The converter
  retries at lower bitrates to fit the target, or explains what to adjust.
- **Preview and download.** Check the result before saving the `.webm` file.
- **Keep conversion local.** No backend, analytics, remote video processing or
  third-party font requests.

The website includes a four-step guide in **English** and **Traditional Chinese**.
Use the language buttons in the guide to switch between them.

## How to add stickers to Telegram

### 1. Create and download a sticker

1. [Open the app](https://kitttt2025.github.io/telegram-video-sticker-maker/) and
   drag in a video, or choose one from your device.
2. Select a clip of up to **3 seconds**. Choose **Fill** or **Fit**, and adjust the
   background, size limit or frame rate if needed.
3. Click **Create WebM**, preview the result, then click **Download WebM**.

### 2. Create a new sticker pack

1. Open the official [@Stickers](https://t.me/Stickers) bot in Telegram and press
   **Start**.
2. Send `/newvideo`, then enter a name for your pack.
3. Attach the downloaded `.webm` using **File / Document** so Telegram receives
   the original file. Send an emoji that represents the sticker when prompted.
4. Add more stickers if you wish, then send `/publish`.
5. Follow the bot's prompts for a pack icon and short name. Open the pack link it
   provides and select **Add Stickers**.

### Add to a pack you already manage

Send `/addsticker` to [@Stickers](https://t.me/Stickers), choose your pack, and send
its new WebM file and an emoji. Follow the bot's prompts to finish.

### If something does not work

- **Telegram rejects the file:** attach the downloaded `.webm` as a file, rather
  than the source MP4 or a compressed video attachment. Use `/newvideo` for video
  stickers; `/newanimated` expects `.tgs` animations.
- **The browser has no VP9 encoder:** try a current version of Chrome or Edge.
  Encoding support depends on the browser and device.
- **The clip exceeds the size target:** shorten it or lower the frame rate, then
  convert it again.
- **The bot looks different:** follow its current prompts. Telegram also offers
  a mini app through [@Stickers](https://t.me/Stickers).

See the [official Telegram sticker documentation](https://core.telegram.org/stickers)
and [video sticker requirements](https://core.telegram.org/stickers#video-stickers-and-emoji).
This tool creates video stickers; it does not export `.tgs` animations or custom emoji.

## 繁體中文使用教學

本工具可將影片轉換為 Telegram 影片貼圖。轉檔全程在您的裝置上進行，無需註冊帳戶或上傳影片。
網站的教學區提供 **English** 及 **繁體中文** 切換按鈕。

### 製作並下載貼圖

1. [開啟網站](https://kitttt2025.github.io/telegram-video-sticker-maker/)，拖入影片，或從裝置選取 MP4、MOV、WebM 或 OGG 檔案。
2. 選取最多 **3 秒**的片段。**Fill** 會將畫面裁切為正方形；**Fit** 會保留完整畫面，並以指定顏色填補空白區域。
3. 如有需要，可調整檔案大小上限及影格率。按下 **Create WebM**，預覽結果後，再按 **Download WebM** 下載。

### 建立新的貼圖包

1. 在 Telegram 開啟官方 [@Stickers](https://t.me/Stickers) 機器人，按下 **Start**。
2. 輸入 `/newvideo`，再輸入貼圖包名稱。
3. 透過附件選單中的 **File / Document（檔案）** 傳送下載的 `.webm`，以保留原始檔案，再依照提示傳送代表該貼圖的表情符號。
4. 如有需要，可繼續加入其他貼圖。完成後輸入 `/publish`。
5. 依照提示設定圖示及短名稱，開啟機器人提供的貼圖包連結，再按 **Add Stickers（加入貼圖）**。

**加入現有貼圖包：** 輸入 `/addsticker`，選擇您管理的貼圖包，傳送新的 WebM 檔案及表情符號，再依照提示完成操作。

**檔案無法加入：** 請以檔案形式傳送下載的 `.webm`，避免傳送原始 MP4 或經壓縮的影片附件。
WebM 貼圖應使用 `/newvideo`；`/newanimated` 適用於 `.tgs` 動畫。
若瀏覽器沒有 VP9 編碼器，請嘗試使用最新版 Chrome 或 Edge；若檔案超過大小上限，請縮短片段或降低影格率。
機器人介面如有更新，請以當前提示為準。

**私隱說明：** 只有您自行傳送檔案時，檔案才會上傳至 Telegram。貼圖包可以被分享，發佈前請確認影片及檔案名稱沒有個人資料。

## Output specifications

| Property | Output |
| --- | --- |
| Dimensions | 512 × 512 pixels |
| Duration | Up to 3 seconds |
| File size | Up to 256 KB, or your chosen lower target |
| Format | WebM with VP9 video |
| Audio | None |
| Frame rate | 12–30 fps |

The app uses the browser's WebCodecs API and a WebM muxer. It checks the actual
encoded file size and makes up to three attempts at lower bitrates. If the file
still exceeds your target, it asks you to shorten the clip or lower the frame rate.
It reports an error if VP9 encoding is unavailable.

## Browser support

Use a browser and device with **WebCodecs VP9 encoding** and support for decoding
your source video. A current version of Chrome or Edge is a good starting point;
Firefox and Safari support depends on the installed browser and platform.
Unsupported inputs or encoders produce an error message in the app.

## Privacy

Video decoding, frame rendering, encoding and downloading all happen locally.
The app has no analytics or remote processing. Its production Content Security
Policy blocks fetch and WebSocket connections.

GitHub Pages serves the site and may log ordinary requests, including IP
addresses. Opening a Telegram link takes you to Telegram; sending the exported
file to the bot uploads that file to Telegram.

Source metadata is not copied into the new video container. However, personal
information visible in the frames remains, and the download name retains the
source basename. Check both before sharing.

Read the [security policy](SECURITY.md) and the dated
[security review](SECURITY-REVIEW.md) for the scope and limits of the checks.

## Local development

Requires **Node.js 22.12 or newer**.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To check types, run the tests and create a
production build:

```bash
npm run check
```

Preview the production build with `npm run preview`.

## Deployment

The production build is a static site in `dist/`. Host that folder on GitHub
Pages or another static host.

The included GitHub Actions workflow checks and builds every push to `main`,
then deploys to GitHub Pages. In the repository settings, select
**Pages → Build and deployment → Source → GitHub Actions**.

## Credits and license

Built with React, WebCodecs and [webm-muxer](https://github.com/Vanilagy/webm-muxer).
Created with Codex. Released under the [MIT License](LICENSE).

This is an independent open-source project and is not affiliated with Telegram.
