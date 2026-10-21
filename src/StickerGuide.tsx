import { useState } from 'react';

const guides = {
  en: {
    eyebrow: 'Quick start',
    title: 'Add your sticker to Telegram',
    intro: 'Convert a clip, download the WebM, and add it to a pack with the official @Stickers bot.',
    openBot: 'Open @Stickers ↗',
    steps: [
      {
        title: 'Create your sticker',
        body: <>Choose a video and select up to 3 seconds. Click <strong>Create WebM</strong>, then <strong>Download WebM</strong> when it is ready.</>,
      },
      {
        title: 'Start a new pack',
        body: <>Open the official <strong>@Stickers</strong> bot in Telegram. Press <strong>Start</strong>, send <code>/newvideo</code>, and enter a name for your pack.</>,
      },
      {
        title: 'Send the WebM file',
        body: <>Attach the downloaded .webm as a <strong>File / Document</strong> to preserve the original file. Send an emoji that represents your sticker when prompted.</>,
      },
      {
        title: 'Publish and add',
        body: <>Send <code>/publish</code> and follow the bot’s prompts for an icon and a short name. Open the pack link it provides and select <strong>Add Stickers</strong>.</>,
      },
    ],
    existingTitle: 'Adding to an existing pack?',
    existing: <>Send <code>/addsticker</code>, choose a pack you manage, and send the WebM file and an emoji. Follow the bot’s prompts to finish.</>,
    troubleshootingTitle: 'File not accepted?',
    troubleshooting: <>Send the downloaded .webm as a file, rather than the original video or a compressed video attachment. Use <code>/newvideo</code> for WebM stickers; <code>/newanimated</code> is for .tgs animations. If conversion reports no VP9 encoder, try a current version of Chrome or Edge. Follow the bot’s current prompts if its interface changes.</>,
    privacy: 'Conversion runs on your device. The file is uploaded to Telegram only when you send it yourself. Sticker packs can be shared, so check the video and filename for personal information before publishing.',
    requirements: 'Official Telegram requirements ↗',
    independent: 'An independent open-source tool. Not affiliated with Telegram.',
  },
  'zh-Hant': {
    eyebrow: '使用教學',
    title: '如何將貼圖加入 Telegram',
    intro: '選取影片並下載 WebM 檔案，再透過官方 @Stickers 機器人加入貼圖包。',
    openBot: '開啟 @Stickers ↗',
    steps: [
      {
        title: '製作並下載貼圖',
        body: <>選取裝置上的影片，截取最多 3 秒的片段。按下 <strong>Create WebM</strong>，完成後再按 <strong>Download WebM</strong> 下載。</>,
      },
      {
        title: '建立新的貼圖包',
        body: <>在 Telegram 開啟官方 <strong>@Stickers</strong> 機器人，按下 <strong>Start</strong>，輸入 <code>/newvideo</code>，再輸入貼圖包名稱。</>,
      },
      {
        title: '傳送 WebM 檔案',
        body: <>透過附件選單中的 <strong>File / Document（檔案）</strong> 傳送下載的 .webm，以保留原始檔案。依照提示傳送一個代表該貼圖的表情符號。</>,
      },
      {
        title: '發佈並加入貼圖',
        body: <>輸入 <code>/publish</code>，依照提示設定圖示及短名稱。開啟機器人提供的貼圖包連結，再按 <strong>Add Stickers（加入貼圖）</strong>。</>,
      },
    ],
    existingTitle: '加入現有貼圖包',
    existing: <>輸入 <code>/addsticker</code>，選擇您管理的貼圖包，傳送 WebM 檔案及表情符號，再依照提示完成操作。</>,
    troubleshootingTitle: '檔案無法加入？',
    troubleshooting: <>請以檔案形式傳送下載的 .webm，避免傳送原始影片或經壓縮的影片附件。WebM 貼圖應使用 <code>/newvideo</code>；<code>/newanimated</code> 適用於 .tgs 動畫。若轉檔時顯示沒有 VP9 編碼器，請嘗試使用最新版 Chrome 或 Edge。機器人介面如有更新，請以當前提示為準。</>,
    privacy: '轉檔全程在您的裝置上進行。只有您自行傳送檔案時，檔案才會上傳至 Telegram。貼圖包可以被分享，發佈前請確認影片及檔案名稱沒有個人資料。',
    requirements: 'Telegram 官方格式要求 ↗',
    independent: '本專案為獨立開源工具，與 Telegram 無隸屬關係。',
  },
};

export default function StickerGuide() {
  const [language, setLanguage] = useState<'en' | 'zh-Hant'>('en');
  const guide = guides[language];

  return (
    <section className="sticker-guide" id="sticker-guide" aria-labelledby="guide-title">
      <div className="guide-language" role="group" aria-label="Guide language / 教學語言">
        <button type="button" lang="en" aria-pressed={language === 'en'} aria-controls="guide-content" onClick={() => setLanguage('en')}>English</button>
        <button type="button" lang="zh-Hant" aria-pressed={language === 'zh-Hant'} aria-controls="guide-content" onClick={() => setLanguage('zh-Hant')}>繁體中文</button>
      </div>
      <div id="guide-content" lang={language}>
        <div className="guide-heading">
          <div>
            <p className="eyebrow">{guide.eyebrow}</p>
            <h2 id="guide-title">{guide.title}</h2>
            <p>{guide.intro}</p>
          </div>
          <a className="guide-bot-link" href="https://t.me/Stickers" target="_blank" rel="noopener noreferrer">{guide.openBot}</a>
        </div>
        <ol className="guide-steps">
          {guide.steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="guide-notes">
          <p><strong>{guide.existingTitle}</strong> {guide.existing}</p>
          <p><strong>{guide.troubleshootingTitle}</strong> {guide.troubleshooting}</p>
          <p className="guide-privacy">{guide.privacy}</p>
        </div>
        <p className="guide-reference"><a href="https://core.telegram.org/stickers#video-stickers-and-emoji" target="_blank" rel="noopener noreferrer">{guide.requirements}</a> · {guide.independent}</p>
      </div>
    </section>
  );
}
