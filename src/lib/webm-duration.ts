interface Element {
  id: number;
  dataStart: number;
  end: number;
}

function readElement(view: DataView, offset: number, limit: number): Element {
  const readVint = (position: number, isId: boolean) => {
    if (position >= limit) throw new Error('Truncated WebM header.');
    const first = view.getUint8(position);
    let width = 1;
    let marker = 0x80;
    while (width <= 8 && !(first & marker)) { width += 1; marker >>= 1; }
    if (width > (isId ? 4 : 8) || position + width > limit) {
      throw new Error('Invalid WebM header.');
    }
    let value = isId ? first : first & (marker - 1);
    let unknown = !isId && value === marker - 1;
    for (let index = 1; index < width; index += 1) {
      const byte = view.getUint8(position + index);
      value = value * 256 + byte;
      unknown = unknown && byte === 255;
    }
    return { value, width, unknown };
  };
  const id = readVint(offset, true);
  const size = readVint(offset + id.width, false);
  const dataStart = offset + id.width + size.width;
  const end = size.unknown ? limit : dataStart + size.value;
  if (!Number.isSafeInteger(end) || end > limit) throw new Error('Truncated WebM element.');
  return { id: id.value, dataStart, end };
}

function findChild(view: DataView, start: number, end: number, id: number): Element | undefined {
  for (let offset = start; offset < end;) {
    const child = readElement(view, offset, end);
    if (child.id === id) return child;
    offset = child.end;
  }
}

/**
 * webm-muxer 5.x stores the last frame's start as Segment Duration. Correct the
 * generated non-streaming file to include that frame's display duration.
 * Walk EBML elements so compressed frame bytes can never be mistaken for metadata.
 */
export function setWebMDuration(buffer: ArrayBuffer, durationSeconds: number): void {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Invalid WebM duration.');
  }
  const view = new DataView(buffer);
  const segment = findChild(view, 0, view.byteLength, 0x18538067);
  const info = segment && findChild(view, segment.dataStart, segment.end, 0x1549a966);
  const duration = info && findChild(view, info.dataStart, info.end, 0x4489);
  if (!info || !duration) throw new Error('The generated WebM has no duration metadata.');
  const scale = findChild(view, info.dataStart, info.end, 0x2ad7b1);
  let nanosecondsPerTick = 1_000_000;
  if (scale) {
    nanosecondsPerTick = 0;
    for (let offset = scale.dataStart; offset < scale.end; offset += 1) {
      nanosecondsPerTick = nanosecondsPerTick * 256 + view.getUint8(offset);
    }
    if (!Number.isSafeInteger(nanosecondsPerTick) || nanosecondsPerTick <= 0) {
      throw new Error('Invalid WebM timestamp scale.');
    }
  }
  const ticks = durationSeconds * 1_000_000_000 / nanosecondsPerTick;
  if (duration.end - duration.dataStart === 8) view.setFloat64(duration.dataStart, ticks);
  else if (duration.end - duration.dataStart === 4) view.setFloat32(duration.dataStart, ticks);
  else throw new Error('Invalid WebM duration element.');
}
