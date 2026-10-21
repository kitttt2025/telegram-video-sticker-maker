import { useEffect, useRef, useState } from 'react';
import { formatTimecode } from './lib/format';
import type { FitMode } from './lib/transcode';

interface StickerPreviewProps {
  src: string;
  startTime: number;
  duration: number;
  fit: FitMode;
  background: string;
  disabled: boolean;
}

export default function StickerPreview({
  src, startTime, duration, fit, background, disabled,
}: StickerPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wantsPlayback = useRef(false);
  const endTime = startTime + duration;
  const previousRange = useRef({ startTime, endTime });
  const preferredTime = useRef(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(startTime);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      wantsPlayback.current = false;
      video?.pause();
    };
  }, []);

  const stop = () => {
    wantsPlayback.current = false;
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const seek = (time: number) => {
    // Keep the last frame inside the selection, including when it ends at EOF.
    const nextTime = Math.max(startTime, Math.min(time, endTime - 0.001));
    preferredTime.current = nextTime;
    const video = videoRef.current;
    if (video && video.readyState >= 1) video.currentTime = nextTime;
    setPlayhead(nextTime);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    wantsPlayback.current = false;
    video.pause();
    setIsPlaying(false);

    const previous = previousRange.current;
    // Moving Start previews the first frame; moving Length previews the last.
    const showEnd = previous.startTime === startTime && previous.endTime !== endTime;
    const nextTime = showEnd ? Math.max(startTime, endTime - 1 / 30) : startTime;
    previousRange.current = { startTime, endTime };
    preferredTime.current = nextTime;
    if (video.readyState >= 1) video.currentTime = nextTime;
    setPlayhead(nextTime);
  }, [startTime, endTime, disabled]);

  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (!video) return;
    let animationFrame = 0;
    const tick = () => {
      if (!video.paused && (video.currentTime >= endTime || video.currentTime < startTime)) {
        video.currentTime = startTime;
      }
      setPlayhead(video.currentTime);
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, startTime, endTime]);

  const play = async () => {
    const video = videoRef.current;
    if (!video || disabled) return;
    setError('');
    // Always begin a new playback at the selected start point.
    seek(startTime);
    wantsPlayback.current = true;
    try {
      await video.play();
    } catch (playError) {
      if (!wantsPlayback.current) return;
      wantsPlayback.current = false;
      setIsPlaying(false);
      if (!(playError instanceof DOMException && playError.name === 'AbortError')) {
        setError('Could not play this preview. Try pressing Play selection again.');
      }
    }
  };

  const updateTime = () => {
    const video = videoRef.current;
    if (!video) return;
    if (wantsPlayback.current && !video.paused && video.currentTime >= endTime) {
      video.currentTime = startTime;
    }
    setPlayhead(video.currentTime);
  };

  return (
    <div className="sticker-preview">
      <div className="preview-heading">
        <span>Live sticker preview</span>
        <span>{fit === 'cover' ? 'Fill · cropped' : 'Fit · full frame'}</span>
      </div>
      <video
        ref={videoRef}
        className="live-preview-video"
        src={src}
        style={{ objectFit: fit, backgroundColor: background }}
        aria-label="Sticker preview"
        preload="auto"
        muted
        playsInline
        onLoadedMetadata={() => seek(preferredTime.current)}
        onTimeUpdate={updateTime}
        onSeeked={updateTime}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (wantsPlayback.current) void play();
        }}
        onError={() => setError('This browser could not preview the video. Try another file.')}
      />
      <div className="preview-controls">
        <button type="button" className="preview-play" onClick={() => isPlaying ? stop() : void play()} disabled={disabled}>
          {isPlaying ? 'Pause preview' : 'Play selection'}
        </button>
        <input
          aria-label="Preview position"
          type="range"
          min="0"
          max={duration}
          step="any"
          value={Math.max(0, Math.min(duration, playhead - startTime))}
          onChange={(event) => {
            stop();
            seek(startTime + Number(event.target.value));
          }}
          disabled={disabled}
        />
        <output className="preview-time">{formatTimecode(playhead)}</output>
      </div>
      <p className="preview-caption">
        Loops {formatTimecode(startTime)}–{formatTimecode(endTime)} · Silent preview
      </p>
      {error && <p className="preview-error" role="alert">{error}</p>}
    </div>
  );
}
