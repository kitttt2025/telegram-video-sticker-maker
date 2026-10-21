/** Resolve only when the requested position has a decoded video frame. */
export function seekDecodedFrame(
  video: HTMLVideoElement,
  time: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', checkReady);
      video.removeEventListener('loadeddata', checkReady);
      video.removeEventListener('canplay', checkReady);
      video.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const checkReady = () => {
      if (video.seeking || video.readyState < 2 || Math.abs(video.currentTime - time) > 0.001) return;
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('The browser could not decode this video frame.'));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException('Conversion cancelled.', 'AbortError'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }
    video.addEventListener('seeked', checkReady);
    video.addEventListener('loadeddata', checkReady);
    video.addEventListener('canplay', checkReady);
    video.addEventListener('error', handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for a decoded video frame. Try another source format.'));
    }, 15_000);

    try {
      // Seeking to the already selected position may not emit a seeked event.
      if (Math.abs(video.currentTime - time) > 0.001) video.currentTime = time;
      checkReady();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function planVideoFrames(duration: number, fps: number) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(fps) || fps <= 0) {
    throw new Error('The video duration and frame rate must be positive.');
  }
  const count = Math.max(1, Math.floor(duration * fps));
  const frames = Array.from({ length: count }, (_, index) => {
    const timestamp = Math.round(index * 1_000_000 / fps);
    const nextTimestamp = Math.round((index + 1) * 1_000_000 / fps);
    return { timestamp, duration: nextTimestamp - timestamp, sourceOffset: index / fps };
  });
  const last = frames[frames.length - 1];
  return { frames, duration: (last.timestamp + last.duration) / 1_000_000 };
}
