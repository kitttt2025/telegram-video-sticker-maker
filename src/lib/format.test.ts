import { describe, expect, it } from 'vitest';
import { baseName, formatBytes, formatDuration, formatTimecode, safeDownloadName } from './format';
import { estimateBitrate } from './transcode';

describe('format helpers', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('formats durations', () => {
    expect(formatDuration(65.2)).toBe('1:05');
  });

  it('keeps subsecond trim positions visible and carries rounded seconds', () => {
    expect(formatTimecode(2.35)).toBe('0:02.35');
    expect(formatTimecode(59.999)).toBe('1:00.00');
    expect(formatTimecode(Number.NaN)).toBe('0:00.00');
  });

  it('creates a safe WebM download name', () => {
    expect(baseName('clip.final.mov')).toBe('clip.final');
    expect(safeDownloadName('A/B: C.mp4')).toBe('A-B- C_512x512.webm');
  });
});

describe('bitrate planning', () => {
  it('reserves headroom below the requested size', () => {
    expect(estimateBitrate(10, 256 * 1024)).toBe(167772);
  });

  it('rejects videos without a duration', () => {
    expect(() => estimateBitrate(0, 256 * 1024)).toThrow(/duration/i);
  });
});
