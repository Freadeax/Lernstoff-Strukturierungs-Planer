import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { PARAMETER_NACH_ID } from '../../ui/sim/labor/parameter';
import { deuteBga } from '../../ui/sim/labor/bga';
import { anzahlSchichten, phantomSchicht } from '../../ui/sim/bildgebung/serie';
import { ctSchicht, mittelwert, roentgenThorax } from '../../ui/sim/bildgebung/phantom';
import { zVonIndex } from '../../ui/sim/bildgebung/serie';

describe('Diagnostik-Fälle', () => {
  it('eindeutige IDs, bekannte Laborparameter, vollständige Lerninhalte', () => {
    expect(new Set(FAELLE.map((f) => f.id)).size).toBe(FAELLE.length);
    for (const f of FAELLE) {
      for (const id of [...Object.keys(f.labor), ...f.empfohlen]) expect(PARAMETER_NACH_ID[id], `${f.id}: ${id}`).toBeDefined();
      for (const id of f.empfohlen) expect(f.labor[id], `${f.id}: empfohlen ${id} ohne Verlauf`).toBeDefined();
      expect(f.fragen.length).toBeGreaterThanOrEqual(2);
      expect(f.sbar.some((s) => s.relevant) && f.sbar.some((s) => !s.relevant)).toBe(true);
      expect(f.aufloesung.pflege.length).toBeGreaterThanOrEqual(3);
      const flags = new Set(f.anordnungen.map((a) => a.flag));
      for (const verlauf of [...Object.values(f.labor), ...Object.values(f.vital)]) for (const t of verlauf.therapie ?? []) expect(flags.has(t.flag), `${f.id}: Therapie-Flag ${t.flag}`).toBe(true);
      for (const [a, b] of f.reihenfolge ?? []) { expect(flags.has(a)).toBe(true); expect(flags.has(b)).toBe(true); }
    }
  });

  it('Fragen verweisen auf vorhandene Serien und Befunde; BGA-Lösungen passen zur Deutung', () => {
    for (const f of FAELLE) for (const q of f.fragen) {
      if (q.art === 'befund') {
        const u = f.bildgebung.find((b) => b.serie.id === q.serie);
        expect(u, `${q.id}`).toBeDefined();
        expect(u!.serie.befunde.some((b) => b.id === q.befund), `${q.id}`).toBe(true);
      }
      if (q.art === 'wahl') expect(q.optionen.filter((o) => o.richtig)).toHaveLength(1);
      if (q.art === 'bga') { const d = deuteBga(q.werte); expect([d.stoerung, d.kompensation], q.id).toEqual([q.stoerung, q.kompensation]); }
    }
  });

  it('echte Bilder nur mit Lizenz, Urheber und Quelle', () => {
    for (const f of FAELLE) for (const u of f.bildgebung) {
      const q = u.serie.quelle;
      if (q.art === 'bilder') { expect(q.lizenz).toMatch(/CC|gemeinfrei|Public Domain/i); expect(q.urheber).not.toBe(''); expect(q.quelleUrl).toMatch(/^https:\/\//); }
    }
  });

  it('jeder Befund liegt dort, wo sich das Phantom vom Normalbefund unterscheidet', () => {
    for (const f of FAELLE) for (const u of f.bildgebung) {
      const s = u.serie, q = s.quelle;
      if (q.art !== 'phantom') continue;
      for (const b of s.befunde) {
        const n = anzahlSchichten(s);
        const i = b.schichten ? Math.round((b.schichten[0] + b.schichten[1]) / 2) : 0;
        expect(i).toBeLessThan(n);
        const krank = phantomSchicht(s, i);
        const gesund = q.modalitaet === 'ct' ? ctSchicht(zVonIndex(i, n), 'normal', 320, q.kontrast) : roentgenThorax('normal');
        const diff = Math.abs(mittelwert(krank, b.x, b.y, b.r * 0.6) - mittelwert(gesund, b.x, b.y, b.r * 0.6));
        expect(diff, `${f.id}/${b.id}`).toBeGreaterThan(40);
      }
    }
  });
});
