// Export der Widget-Daten als CSV (Excel-kompatibel, Semikolon, UTF-8 mit BOM) oder JSON.

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\r\n');
}

export function download(name: string, content: string, type: string) {
  const blob = new Blob([type.startsWith('text/csv') ? '﻿' + content : content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportRows(id: string, rows: Array<Record<string, unknown>>, format: 'csv' | 'json') {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'csv') download(`${id}-${date}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  else download(`${id}-${date}.json`, JSON.stringify(rows, null, 2), 'application/json');
}
