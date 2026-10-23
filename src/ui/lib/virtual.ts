// Fensterberechnung für virtuelles Scrollen mit fester Zeilenhöhe.

export interface VirtualWindow { start: number; end: number; offsetTop: number; totalHeight: number }

export function virtualWindow(count: number, rowHeight: number, scrollTop: number, viewport: number, overscan = 8): VirtualWindow {
  const totalHeight = count * rowHeight;
  if (count === 0 || rowHeight <= 0) return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };
  const first = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const visible = Math.ceil(Math.max(viewport, rowHeight) / rowHeight);
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, first + visible + overscan);
  return { start, end, offsetTop: start * rowHeight, totalHeight };
}
