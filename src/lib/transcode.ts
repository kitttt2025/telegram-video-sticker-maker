import { ArrayBufferTarget, Muxer } from 'webm-muxer';

export const DEFAULT_SIZE_LIMIT_BYTES = 256 * 1024;
export const OUTPUT_SIZE = 512;
export const OUTPUT_FPS = 30;
export const TELEGRAM_MAX_DURATION = 3;

export type FitMode = 'cover' | 'contain';

export interface TranscodeOptions {
  sizeLimitBytes: number;
  fit: FitMode;
  background: string;
  startTime?: number;
  duration?: number;
  fps?: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface TranscodeResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  duration: number;
  codec: 'VP9';
}

interface EncoderAttempt {
  codec: string;
  muxerCodec: string;
  bitrate: number;
}

const MIN_BITRATE = 24_000;
const MAX_BITRATE = 8_000_000;
const ATTEMPTS = 3;
const MIN_FPS = 12;

export function hasWebCodecs(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

export async function pickVideoCodec(): Promise<Pick<EncoderAttempt, 'codec' | 'muxerCodec'>> {
  if (!hasWebCodecs()) {
    throw new Error(
      'This browser does not support WebCodecs. Use a current version of Chrome, Edge, or Firefox.',
    );
  }

  const candidates = [
    { codec: 'vp09.00.10.08', muxerCodec: 'V_VP9' },
  ];

  for (const candidate of candidates) {
    const support = await VideoEncoder.isConfigSupported({
      codec: candidate.codec,
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      bitrate: 250_000,
      framerate: OUTPUT_FPS,
    });
    if (support.supported) return candidate;
  }

  throw new Error('Telegram requires VP9. This browser has no VP9 encoder available. Try a current version of Chrome or Edge.');
}

/**
 * Reserve room for container overhead and quality headroom. The final output
 * is measured after encoding and retried with a smaller bitrate when needed.
 */
export function estimateBitrate(durationSeconds: number, sizeLimitBytes: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('The video has no readable duration.');
  }

  const usableBytes = Math.max(0, sizeLimitBytes) * 0.8;
  const bitrate = (usableBytes * 8) / durationSeconds;
  return Math.round(Math.min(MAX_BITRATE, Math.max(MIN_BITRATE, bitrate)));
}

export function buildAttempts(
  duration: number,
  sizeLimitBytes: number,
  codec: Pick<EncoderAttempt, 'codec' | 'muxerCodec'>,
): EncoderAttempt[] {
  const firstBitrate = estimateBitrate(duration, sizeLimitBytes);

  return Array.from({ length: ATTEMPTS }, (_, index) => ({
    ...codec,
    bitrate: Math.max(MIN_BITRATE, Math.round(firstBitrate * 0.72 ** index)),
  }));
}

export function drawSquareFrame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  fit: FitMode,
  background: string,
): void {
  const { width, height } = video;
  if (!width || !height) return;

  context.fillStyle = background;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const scale =
    fit === 'cover'
      ? Math.max(OUTPUT_SIZE / width, OUTPUT_SIZE / height)
      : Math.min(OUTPUT_SIZE / width, OUTPUT_SIZE / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const x = (OUTPUT_SIZE - drawWidth) / 2;
  const y = (OUTPUT_SIZE - drawHeight) / 2;

  context.drawImage(video, x, y, drawWidth, drawHeight);
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  errorName: string,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(eventName, handleSuccess);
      target.removeEventListener(errorName, handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const handleSuccess = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('The browser could not decode this video.'));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException('Conversion cancelled.', 'AbortError'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    target.addEventListener(eventName, handleSuccess, { once: true });
    target.addEventListener(errorName, handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function seekVideo(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('The browser could not decode this video.'));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException('Conversion cancelled.', 'AbortError'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });
    video.currentTime = time;
  });
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function recordOnce(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  options: TranscodeOptions,
  attempt: EncoderAttempt,
): Promise<Blob> {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas rendering is unavailable.');

  const startTime = options.startTime ?? 0;
  const duration = Math.min(
    options.duration ?? video.duration - startTime,
    video.duration - startTime,
    TELEGRAM_MAX_DURATION,
  );
  const fps = Math.max(MIN_FPS, Math.min(OUTPUT_FPS, options.fps ?? OUTPUT_FPS));
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: attempt.muxerCodec,
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      frameRate: fps,
    },
  });
  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
    error: (error) => {
      encoderError = error;
    },
  });
  encoder.configure({
    codec: attempt.codec,
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    bitrate: attempt.bitrate,
    framerate: fps,
    latencyMode: 'quality',
  });

  const frameCount = Math.max(1, Math.floor(duration * fps));
  const frameDuration = 1_000_000 / fps;

  try {
    for (let index = 0; index < frameCount; index += 1) {
      if (options.signal?.aborted) {
        throw new DOMException('Conversion cancelled.', 'AbortError');
      }
      if (encoderError) throw encoderError;

      await seekVideo(video, startTime + index / fps, options.signal);
      drawSquareFrame(context, video, options.fit, options.background);

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(index * frameDuration),
        duration: Math.round(frameDuration),
      });
      encoder.encode(frame, { keyFrame: index % Math.max(1, fps) === 0 });
      frame.close();

      while (encoder.encodeQueueSize > 8) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      await nextPaint();
      options.onProgress?.((index + 1) / frameCount);
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    muxer.finalize();

    return new Blob([target.buffer], { type: 'video/webm' });
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
}

export async function transcodeVideo(
  file: File,
  options: TranscodeOptions,
): Promise<TranscodeResult> {
  if (typeof HTMLVideoElement === 'undefined') {
    throw new Error('Video conversion requires a browser.');
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await waitForEvent(video, 'loadedmetadata', 'error', options.signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error('The video has no readable duration.');
    }

    const codec = await pickVideoCodec();
    const attempts = buildAttempts(
      Math.min(
        options.duration ?? video.duration,
        video.duration - (options.startTime ?? 0),
        TELEGRAM_MAX_DURATION,
      ),
      options.sizeLimitBytes,
      codec,
    );
    let lastResult: Blob | null = null;
    let resultDuration = TELEGRAM_MAX_DURATION;

    for (const attempt of attempts) {
      if (options.signal?.aborted) {
        throw new DOMException('Conversion cancelled.', 'AbortError');
      }

      const blob = await recordOnce(video, canvas, options, attempt);
      lastResult = blob;
      resultDuration = Math.min(
        options.duration ?? video.duration - (options.startTime ?? 0),
        video.duration - (options.startTime ?? 0),
        TELEGRAM_MAX_DURATION,
      );
      if (blob.size <= options.sizeLimitBytes) break;
    }

    if (!lastResult) throw new Error('No video was produced.');
    if (lastResult.size === 0) {
      throw new Error('The encoder produced an empty file. Try a shorter clip or lower frame rate.');
    }
    if (lastResult.size > options.sizeLimitBytes) {
      throw new Error(
        `Could not reach ${Math.round(options.sizeLimitBytes / 1024)} KB. Try a shorter clip or lower frame rate.`,
      );
    }
    options.onProgress?.(1);

    return {
      blob: lastResult,
      mimeType: lastResult.type,
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      duration: resultDuration,
      codec: 'VP9',
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
