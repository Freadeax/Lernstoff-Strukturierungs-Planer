import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { fuehreAus, starte } from './lauf';
import { diagnostikSbar } from './sbar';

describe('Diagnostik – SBAR mit gemeinsamen Grundkriterien', () => {
  it('alle relevanten Fakten: Rufgrund, Hintergrund, Einschätzung, Empfehlung, Rückfrage erfüllt', () => {
    for (const fall of FAELLE) {
      const l = fuehreAus(starte(fall), fall, { typ: 'sbar', fakten: fall.sbar.filter((s) => s.relevant).map((s) => s.id) });
      const g = diagnostikSbar(l, fall);
      expect(g.anlass, fall.id).not.toBeNull();
      const st = Object.fromEntries(g.ergebnis!.map((x) => [x.id, x.status]));
      expect(st.rufgrund, fall.id).toBe('ok');
      expect(st.hintergrund, fall.id).toBe('ok');
      expect(['ok', 'teilweise'], `${fall.id}: ${g.ergebnis!.find((x) => x.id === 'einschaetzung')!.text}`).toContain(st.einschaetzung);
      expect(st.empfehlung, fall.id).toBe('ok');
    }
  });
  it('Ballast zählt beim Hintergrund', () => {
    const fall = FAELLE[0]!;
    const l = fuehreAus(starte(fall), fall, { typ: 'sbar', fakten: fall.sbar.map((s) => s.id) });
    expect(diagnostikSbar(l, fall).ergebnis!.find((x) => x.id === 'hintergrund')!.status).toBe('teilweise');
  });
});
