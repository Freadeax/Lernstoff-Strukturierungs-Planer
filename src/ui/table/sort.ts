export interface SortSpec { key: string; dir: 'asc' | 'desc' }

/** Mehrspaltige Sortierung, Reihenfolge der Spezifikation = Priorität. Stabil. */
export function multiSort<R>(rows: R[], spec: SortSpec[], get: (row: R, key: string) => string | number | undefined | null): R[] {
  if (!spec.length) return rows;
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      for (const s of spec) {
        const x = get(a.r, s.key); const y = get(b.r, s.key);
        let c: number;
        if (x === y) c = 0;
        else if (x === undefined || x === null || x === '') c = 1;           // Leere immer nach hinten
        else if (y === undefined || y === null || y === '') c = -1;
        else c = (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))) * (s.dir === 'asc' ? 1 : -1);
        if (c !== 0) return c;
      }
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/** Klick auf eine Spalte: aufsteigend → absteigend → aus. Andere Spalten bleiben als Nebenkriterium. */
export function toggleSort(spec: SortSpec[], key: string): SortSpec[] {
  const cur = spec.find((s) => s.key === key);
  if (!cur) return [...spec, { key, dir: 'asc' }];
  if (cur.dir === 'asc') return spec.map((s) => (s.key === key ? { key, dir: 'desc' } : s));
  return spec.filter((s) => s.key !== key);
}
