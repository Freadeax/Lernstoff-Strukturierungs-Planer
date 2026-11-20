import { describe, expect, it, vi } from 'vitest';

const antworten: string[] = [];
vi.mock('../../core/ki/tor', () => ({
  torAntwort: vi.fn(async () => ({ text: antworten.shift() ?? '', restGeraet: 5 })),
}));

const { zuordnenTor, rueckmeldungTor } = await import('./tor');
const { DIALOGE } = await import('./dialoge');
const d = DIALOGE[0]!;
const k = d.knoten[0]!;

describe('Gesprächssimulator über das KI-Tor', () => {
  it('übernimmt nur gültige Indizes', async () => {
    antworten.push('{"index": 1, "begruendung": "Rechtfertigung"}', '{"index": 7, "begruendung": "x"}', 'Text davor {"index": -1, "begruendung": "passt nicht"}');
    expect((await zuordnenTor(d, k, 'war nicht ich')).index).toBe(1);
    expect((await zuordnenTor(d, k, 'x')).index).toBe(-1);
    expect(await zuordnenTor(d, k, 'y')).toEqual({ index: -1, begruendung: 'passt nicht' });
  });
  it('meldet unlesbare Antworten als Fehler statt zu raten', async () => {
    antworten.push('keine Ahnung');
    await expect(zuordnenTor(d, k, 'z')).rejects.toThrow(/nicht lesbar/);
  });
  it('Rückmeldung: Zitate müssen aus den eigenen Worten stammen', async () => {
    antworten.push(JSON.stringify({ stufe: 'stabil', zusammenfassung: 'Gut gemacht.', merksaetze: ['M'], punkte: [
      { zitat: 'Sie sind wütend', urteil: 'gut', technik: 'spiegeln', warum: 'Gefühl benannt.' },
      { zitat: 'Das habe ich nie gesagt', urteil: 'fehler', technik: 'drohen', warum: 'erfunden' },
    ] }));
    const a = await rueckmeldungTor(d, [{ von: 'gegenueber', text: 'Was ist hier los?' }, { von: 'ich', text: 'Sie sind wütend, das verstehe ich.' }]);
    expect(a.punkte).toHaveLength(1);
    expect(a.quelle).toContain('eingebaute KI');
  });
});
