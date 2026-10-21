export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, '0')}`;
}

export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'video';
}

export function safeDownloadName(fileName: string): string {
  return `${baseName(fileName)
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'video'}_512x512.webm`;
}
