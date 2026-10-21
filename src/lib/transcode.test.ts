import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickVideoCodec } from './transcode';

afterEach(() => vi.unstubAllGlobals());

describe('Telegram codec compatibility', () => {
  it('selects VP9 when the browser can encode it', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: vi.fn().mockResolvedValue({ supported: true }),
    });
    await expect(pickVideoCodec()).resolves.toEqual({
      codec: 'vp09.00.10.08', muxerCodec: 'V_VP9',
    });
  });

  it('rejects a VP8-only browser instead of producing an incompatible sticker', async () => {
    vi.stubGlobal('VideoFrame', class {});
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: vi.fn(async ({ codec }: { codec: string }) => ({
        supported: codec === 'vp8',
      })),
    });
    await expect(pickVideoCodec()).rejects.toThrow('Telegram requires VP9');
  });
});
