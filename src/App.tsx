import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { formatBytes, formatDuration, safeDownloadName } from './lib/format';
import {
  DEFAULT_SIZE_LIMIT_BYTES,
  OUTPUT_FPS,
  TELEGRAM_MAX_DURATION,
  transcodeVideo,
  type FitMode,
  type TranscodeResult,
} from './lib/transcode';

type Phase = 'idle' | 'ready' | 'working' | 'done' | 'error';

interface SourceVideo {
  file: File;
  url: string;
  duration: number;
  width: number;
  height: number;
}

interface OutputVideo extends TranscodeResult {
  url: string;
}

const SUPPORTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || SUPPORTED_TYPES.includes(file.type);
}

function loadSourceVideo(file: File): Promise<SourceVideo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('error', handleError);
    };
    const handleMetadata = () => {
      cleanup();
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        URL.revokeObjectURL(url);
        reject(new Error('This video has no readable duration.'));
        return;
      }
      resolve({
        file,
        url,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    const handleError = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error('This browser cannot open that video format.'));
    };

    video.addEventListener('loadedmetadata', handleMetadata, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });
}

function downloadBlob(url: string, name: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function App() {
  const [source, setSource] = useState<SourceVideo | null>(null);
  const [output, setOutput] = useState<OutputVideo | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [sizeLimitKB, setSizeLimitKB] = useState(DEFAULT_SIZE_LIMIT_BYTES / 1024);
  const [startTime, setStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(TELEGRAM_MAX_DURATION);
  const [fit, setFit] = useState<FitMode>('cover');
  const [background, setBackground] = useState('#17231d');
  const [fps, setFps] = useState(OUTPUT_FPS);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sourceRef = useRef<SourceVideo | null>(null);
  const outputRef = useRef<OutputVideo | null>(null);

  sourceRef.current = source;
  outputRef.current = output;

  const sizeLimitBytes = sizeLimitKB * 1024;
  const durationLabel = source ? formatDuration(source.duration) : '0:00';
  const clipLength = source ? Math.min(clipDuration, source.duration - startTime) : 0;
  const clipEnd = startTime + clipLength;
  const targetLabel = useMemo(() => formatBytes(sizeLimitBytes), [sizeLimitBytes]);
  const sizeStatus =
    output && output.blob.size <= sizeLimitBytes ? 'Within target' : 'Over target';

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      if (outputRef.current) URL.revokeObjectURL(outputRef.current.url);
    };
  }, []);

  const clearOutput = () => {
    if (output) URL.revokeObjectURL(output.url);
    setOutput(null);
  };

  const chooseFile = async (file: File) => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearOutput();
    setError('');
    setProgress(0);
    setPhase('idle');

    if (!isVideoFile(file)) {
      setError('Choose a video file, such as MP4, MOV, WebM, or OGG.');
      setPhase('error');
      return;
    }

    try {
      const nextSource = await loadSourceVideo(file);
      if (source) URL.revokeObjectURL(source.url);
      setSource(nextSource);
      setStartTime(0);
      setClipDuration(Math.min(TELEGRAM_MAX_DURATION, nextSource.duration));
      setPhase('ready');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not open this video.');
      setPhase('error');
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void chooseFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (phase === 'working') return;
    const file = event.dataTransfer.files[0];
    if (file) void chooseFile(file);
  };

  const startConversion = async () => {
    if (!source) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    clearOutput();
    setError('');
    setProgress(0);
    setPhase('working');

    try {
      const result = await transcodeVideo(source.file, {
        sizeLimitBytes,
        fit,
        background,
        startTime,
        duration: clipLength,
        fps,
        onProgress: setProgress,
        signal: controller.signal,
      });
      const nextOutput = { ...result, url: URL.createObjectURL(result.blob) };
      setOutput(nextOutput);
      setPhase('done');
    } catch (conversionError) {
      if (conversionError instanceof DOMException && conversionError.name === 'AbortError') {
        setPhase('ready');
        return;
      }
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : 'Conversion stopped unexpectedly.',
      );
      setPhase('error');
    } finally {
      abortRef.current = null;
    }
  };

  const cancelConversion = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('ready');
    setProgress(0);
  };

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (source) URL.revokeObjectURL(source.url);
    clearOutput();
    setSource(null);
    setError('');
    setProgress(0);
    setPhase('idle');
  };

  return (
    <div className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <a className="brand" href="./" aria-label="video2webm home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>video2webm</span>
        </a>
        <div className="privacy-note">
          <span className="status-dot" />
          Files stay on this device
        </div>
      </header>

      <main className="layout">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Browser-native video compression</p>
          <h1 id="page-title">
            Sticker
            <br />
            ready.
            <br />
            <em>Zero uploads.</em>
          </h1>
          <p className="intro">
            Turn video into a Telegram animated sticker: 512 x 512, VP9, up to 3 seconds,
            under 256 KB, and silent. Everything happens inside your browser.
          </p>

          <div className="feature-row" aria-label="Features">
            <div>
              <strong>3 s</strong>
              <span>max length</span>
            </div>
            <div>
              <strong>0</strong>
              <span>uploads</span>
            </div>
            <div>
              <strong>256 KB</strong>
              <span>max size</span>
            </div>
          </div>
        </section>

        <section className="workbench" aria-label="Video converter">
          <div className="workbench-top">
            <span>01 / Source</span>
            <span>{source ? `${source.width} x ${source.height}` : 'Local only'}</span>
          </div>

          <div
            className={`dropzone ${isDragging ? 'is-dragging' : ''} ${source ? 'has-file' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              if (phase !== 'working') setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="video/*,.mp4,.mov,.webm,.ogv"
              onChange={handleInputChange}
              disabled={phase === 'working'}
            />

            {source ? (
              <div className="source-summary">
                <video
                  className="source-preview"
                  src={source.url}
                  controls
                  loop
                  muted
                  playsInline
                />
                <div className="file-details">
                  <p className="file-name">{source.file.name}</p>
                  <p>
                    {formatBytes(source.file.size)} / {durationLabel} / {source.width} x{' '}
                    {source.height}
                  </p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => inputRef.current?.click()}
                    disabled={phase === 'working'}
                  >
                    Choose another video
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="dropzone-button"
                onClick={() => inputRef.current?.click()}
                disabled={phase === 'working'}
              >
                <span className="upload-glyph" aria-hidden="true">
                  <span>+</span>
                </span>
                <span className="drop-title">Drop a video here</span>
                <span className="drop-subtitle">or choose a file from your device</span>
                <span className="file-types">MP4 / MOV / WebM / OGG</span>
              </button>
            )}
          </div>

          {source && (
            <div className="clip-picker">
              <div className="clip-picker-heading">
                <div>
                  <span>Sticker range</span>
                  <strong>
                    {formatDuration(startTime)} - {formatDuration(clipEnd)}
                  </strong>
                </div>
                <span>{clipLength.toFixed(2)} s</span>
              </div>
              <div className="timeline" aria-hidden="true">
                <div
                  className="timeline-window"
                  style={{
                    left: `${(startTime / source.duration) * 100}%`,
                    width: `${(clipLength / source.duration) * 100}%`,
                  }}
                />
              </div>
              <label htmlFor="start-time">
                <span>Start</span>
                <input
                  id="start-time"
                  type="range"
                  min="0"
                  max={Math.max(0, source.duration - 0.1)}
                  step="0.05"
                  value={startTime}
                  onChange={(event) => {
                    const nextStart = Number(event.target.value);
                    setStartTime(nextStart);
                    setClipDuration(
                      Math.min(clipDuration, Math.max(0.1, source.duration - nextStart)),
                    );
                  }}
                  disabled={phase === 'working'}
                />
              </label>
              <label htmlFor="clip-duration">
                <span>Length</span>
                <input
                  id="clip-duration"
                  type="range"
                  min="0.5"
                  max={Math.min(TELEGRAM_MAX_DURATION, Math.max(0.5, source.duration))}
                  step="0.1"
                  value={clipDuration}
                  onChange={(event) => {
                    const nextDuration = Number(event.target.value);
                    setClipDuration(nextDuration);
                    if (startTime + nextDuration > source.duration) {
                      setStartTime(Math.max(0, source.duration - nextDuration));
                    }
                  }}
                  disabled={phase === 'working'}
                />
              </label>
              {source.duration > TELEGRAM_MAX_DURATION && (
                <p className="clip-hint">
                  Telegram stickers are limited to 3 seconds. Choose the best moment.
                </p>
              )}
            </div>
          )}

          <div className="settings" aria-label="Output settings">
            <div className="setting-block">
              <div className="setting-heading">
                <label htmlFor="size-limit">Sticker size limit</label>
                <output htmlFor="size-limit">{sizeLimitKB} KB</output>
              </div>
              <div className="preset-row">
                <input
                  id="size-limit"
                  className="size-slider"
                  type="range"
                  min="64"
                  max="256"
                  step="8"
                  value={sizeLimitKB}
                  onChange={(event) => setSizeLimitKB(Number(event.target.value))}
                  disabled={phase === 'working'}
                />
              </div>
              <div className="telegram-specs">
                <span>Telegram animated sticker</span>
                <span>512 x 512</span>
                <span>3 s max</span>
                <span>256 KB max</span>
                <span>No audio</span>
              </div>
            </div>

            <div className="setting-grid">
              <fieldset className="setting-block" disabled={phase === 'working'}>
                <legend>Frame fit</legend>
                <div className="segmented">
                  <label>
                    <input
                      type="radio"
                      name="fit"
                      value="cover"
                      checked={fit === 'cover'}
                      onChange={() => setFit('cover')}
                    />
                    <span>Fill</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="fit"
                      value="contain"
                      checked={fit === 'contain'}
                      onChange={() => setFit('contain')}
                    />
                    <span>Fit</span>
                  </label>
                </div>
              </fieldset>

              <div className="setting-block color-setting">
                <label htmlFor="background-color">Matte</label>
                <div>
                  <input
                    id="background-color"
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    disabled={phase === 'working'}
                  />
                  <span>{background.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-heading">
                <label htmlFor="frame-rate">Frame rate</label>
                <output htmlFor="frame-rate">
                  {fps} fps{fps === OUTPUT_FPS ? ' (Telegram)' : ''}
                </output>
              </div>
              <input
                id="frame-rate"
                className="size-slider"
                type="range"
                min="12"
                max="30"
                step="2"
                value={fps}
                onChange={(event) => setFps(Number(event.target.value))}
                disabled={phase === 'working'}
              />
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <strong>Could not convert.</strong> {error}
            </div>
          )}

          {phase === 'working' && (
            <div className="progress-panel" aria-live="polite">
              <div>
                <span>Encoding locally</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <progress value={progress} max="1">
                {Math.round(progress * 100)}%
              </progress>
            </div>
          )}

          <div className="actions">
            {phase === 'working' ? (
              <button type="button" className="secondary-button" onClick={cancelConversion}>
                Cancel conversion
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => void startConversion()}
                disabled={!source}
              >
                <span>Create WebM</span>
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </section>

        {output && (
          <section className="result-card" aria-labelledby="result-title">
            <div className="result-heading">
              <div>
                <p className="eyebrow">02 / Output</p>
                <h2 id="result-title">Ready to download</h2>
              </div>
              <span className={output.blob.size <= sizeLimitBytes ? 'pass' : 'fail'}>
                {sizeStatus}
              </span>
            </div>

            <div className="result-body">
              <video
                key={output.url}
                className="result-preview"
                src={output.url}
                controls
                loop
                muted
                autoPlay
                playsInline
              />
              <div className="result-stats">
                <div>
                  <span>File size</span>
                  <strong>{formatBytes(output.blob.size)}</strong>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{targetLabel}</strong>
                </div>
                <div>
                  <span>Frame</span>
                  <strong>512 x 512</strong>
                </div>
                <div>
                  <span>Codec</span>
                  <strong>{output.codec}</strong>
                </div>
                <div>
                  <span>Length</span>
                  <strong>{output.duration.toFixed(2)} s</strong>
                </div>
              </div>
            </div>

            <div className="result-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => downloadBlob(output.url, safeDownloadName(source?.file.name ?? 'video'))}
              >
                <span>Download WebM</span>
                <span aria-hidden="true">↓</span>
              </button>
              <button type="button" className="secondary-button" onClick={reset}>
                Start over
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>video2webm / built with Codex</span>
        <span>For Telegram animated stickers / no uploads / no API keys</span>
      </footer>
    </div>
  );
}

export default App;
