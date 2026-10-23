/** SVG-Pfad einer Sparkline. null-Werte erzeugen Lücken. Koordinaten im viewBox 0..w × 0..h. */
export function sparkPath(values: Array<number | null>, w = 100, h = 32, pad = 2): string {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return '';
  const min = Math.min(...nums, 0);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) { pen = false; return; }
    const x = pad + i * step;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    pen = true;
  });
  return d;
}
