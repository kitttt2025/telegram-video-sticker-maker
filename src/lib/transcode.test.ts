import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawSquareFrame, pickVideoCodec } from './transcode';

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

describe('preview and export framing', () => {
  it('refuses to encode metadata-only video as a blank frame', () => {
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    const pendingVideo = { videoWidth: 640, videoHeight: 360, readyState: 1 } as HTMLVideoElement;
    expect(() => drawSquareFrame(context as unknown as CanvasRenderingContext2D, pendingVideo, 'cover', '#17231d')).toThrow(/not been decoded/);
    expect(context.drawImage).not.toHaveBeenCalled();
  });
  const video = {
    videoWidth: 640, videoHeight: 360, width: 0, height: 0, readyState: 2, seeking: false,
  } as HTMLVideoElement;

  it('uses intrinsic dimensions to fit the full video over the chosen matte', () => {
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    drawSquareFrame(context as unknown as CanvasRenderingContext2D, video, 'contain', '#ff0000');
    expect(context.fillStyle).toBe('#ff0000');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 112, 512, 288);
  });

  it('centres and crops the full-size video when filling the square', () => {
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    drawSquareFrame(context as unknown as CanvasRenderingContext2D, video, 'cover', '#17231d');
    const [, x, y, width, height] = context.drawImage.mock.calls[0];
    expect(x).toBeCloseTo(-199.111);
    expect(y).toBe(0);
    expect(width).toBeCloseTo(910.222);
    expect(height).toBe(512);
  });
});
