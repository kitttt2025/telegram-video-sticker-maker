import { afterEach, describe, expect, it, vi } from 'vitest';
import { planVideoFrames, seekDecodedFrame } from './video-frame';

class PendingVideo extends EventTarget {
  readyState = 1;
  seeking = false;
  position = 0;
  get currentTime() { return this.position; }
  set currentTime(time: number) {
    this.position = time;
    this.seeking = true;
    this.readyState = 1;
  }
  get element() { return this as unknown as HTMLVideoElement; }
}

afterEach(() => vi.useRealTimers());

describe('decoded frame capture', () => {
  it('waits for actual first-frame data even when seeking to zero completes', async () => {
    const video = new PendingVideo();
    const ready = vi.fn();
    const pending = seekDecodedFrame(video.element, 0).then(ready);
    video.dispatchEvent(new Event('seeked'));
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    video.readyState = 2;
    video.dispatchEvent(new Event('loadeddata'));
    await pending;
    expect(ready).toHaveBeenCalledOnce();
  });

  it('does not capture the old frame while the requested seek is pending', async () => {
    const video = new PendingVideo();
    video.readyState = 2;
    const ready = vi.fn();
    const pending = seekDecodedFrame(video.element, 2).then(ready);
    video.readyState = 2;
    video.dispatchEvent(new Event('loadeddata'));
    await Promise.resolve();
    expect(ready).not.toHaveBeenCalled();
    video.seeking = false;
    video.dispatchEvent(new Event('seeked'));
    await pending;
    expect(ready).toHaveBeenCalledOnce();
  });

  it('accepts an already decoded frame without requiring another seek event', async () => {
    const video = new PendingVideo();
    video.readyState = 2;
    await expect(seekDecodedFrame(video.element, 0)).resolves.toBeUndefined();
  });

  it('can cancel a stalled first-frame decode', async () => {
    const video = new PendingVideo();
    const controller = new AbortController();
    const pending = seekDecodedFrame(video.element, 0, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejected;
  });

  it('reports decode errors and times out instead of encoding a blank frame', async () => {
    const video = new PendingVideo();
    const pending = seekDecodedFrame(video.element, 0);
    const rejected = expect(pending).rejects.toThrow(/could not decode/);
    video.dispatchEvent(new Event('error'));
    await rejected;

    vi.useFakeTimers();
    const timeout = seekDecodedFrame(video.element, 0);
    const timedOut = expect(timeout).rejects.toThrow(/Timed out/);
    await vi.advanceTimersByTimeAsync(15_000);
    await timedOut;
  });
});

describe('complete output frame timing', () => {
  it.each([12, 14, 24, 30])('includes the last frame at %i fps without timestamp gaps', (fps) => {
    const plan = planVideoFrames(3, fps);
    expect(plan.frames[0].timestamp).toBe(0);
    expect(plan.duration).toBe(3);
    for (let index = 1; index < plan.frames.length; index += 1) {
      const previous = plan.frames[index - 1];
      expect(previous.timestamp + previous.duration).toBe(plan.frames[index].timestamp);
    }
    expect(plan.frames.at(-1)!.sourceOffset).toBeLessThan(3);
  });

  it('reports encoded duration when a fractional selection ends between frames', () => {
    const plan = planVideoFrames(1.3, 14);
    expect(plan.frames).toHaveLength(18);
    expect(plan.duration).toBeCloseTo(18 / 14, 6);
    expect(plan.frames.at(-1)!.sourceOffset).toBeLessThan(1.3);
  });

  it('gives a one-frame clip a positive display duration', () => {
    const plan = planVideoFrames(0.02, 30);
    expect(plan.frames).toHaveLength(1);
    expect(plan.duration).toBeCloseTo(1 / 30, 6);
  });
});
