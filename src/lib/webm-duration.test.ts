import { ArrayBufferTarget, Muxer } from 'webm-muxer';
import { describe, expect, it } from 'vitest';
import { setWebMDuration } from './webm-duration';

function createContainer(timestamps: number[]) {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target, video: { codec: 'V_VP8', width: 512, height: 512, frameRate: 30 },
  });
  // Include a lookalike Duration header in the payload to detect raw-byte scans.
  const payload = new Uint8Array([0x44, 0x89, 0x88, 0, 0, 0, 0, 0, 0, 0, 0]);
  for (const timestamp of timestamps) muxer.addVideoChunkRaw(payload, 'key', timestamp);
  muxer.finalize();
  return target.buffer;
}

function metadataOffset(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return bytes.findIndex((value, index) => value === 0x44 && bytes[index + 1] === 0x89 && bytes[index + 2] === 0x88) + 3;
}

describe('WebM end-of-track duration', () => {
  it('includes the last frame without changing encoded payloads or offsets', () => {
    const buffer = createContainer([0, 33333, 66667]);
    const offset = metadataOffset(buffer);
    expect(new DataView(buffer).getFloat64(offset)).toBe(66);
    const expected = buffer.slice(0);
    new DataView(expected).setFloat64(offset, 100);
    setWebMDuration(buffer, 0.1);
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array(expected));
  });

  it('repairs the zero duration emitted for a single-frame clip', () => {
    const buffer = createContainer([0]);
    const offset = metadataOffset(buffer);
    expect(new DataView(buffer).getFloat64(offset)).toBe(0);
    setWebMDuration(buffer, 1 / 30);
    expect(new DataView(buffer).getFloat64(offset)).toBeCloseTo(1000 / 30);
  });

  it('rejects invalid or truncated output instead of corrupting the file', () => {
    expect(() => setWebMDuration(new ArrayBuffer(0), 1)).toThrow(/no duration/);
    expect(() => setWebMDuration(new Uint8Array([0x18]).buffer, 1)).toThrow(/header/);
    expect(() => setWebMDuration(createContainer([0]), 0)).toThrow(/Invalid WebM duration/);
  });
});
