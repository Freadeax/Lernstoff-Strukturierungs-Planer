import { describe, expect, it } from 'vitest';
import { getModule } from '../../modules/registry';
import { leafTopics } from '../lernplan/store';
import { auswerten, bewerteSuche, erlaubt, fehlerVersion, fertig, NICHTS_FEHLT, optionen, START, waehle, zufallAus } from './ablauf';
import { ABLAEUFE, ABLAUF } from './inhalt';

describe('Ablauf-Inhalte', () => {
  it('IDs eindeutig, Themen sind Blatt-Themen, genug Fallen', () => {
    const blaetter = new Set(leafTopics(getModule('pflege-generalistisch')!.topics).map((t) => t.id));
    expect(new Set(ABLAEUFE.map((a) => a.id)).size).toBe(ABLAEUFE.length);
    for (const a of ABLAEUFE) {
      const ids = [...a.schritte.map((s) => s.id), ...a.fallen.map((f) => f.id)];
      expect(new Set(a.schritte.map((s) => s.id)).size, a.id).toBe(a.schritte.length);
      expect(new Set(a.fallen.map((f) => f.id)).size, a.id).toBe(a.fallen.length);
      expect(ids.length).toBeGreaterThan(0);
      expect(a.fallen.length, a.id).toBeGreaterThanOrEqual(5);
      expect(a.schritte.filter((s) => s.kritisch).length, a.id).toBeGreaterThanOrEqual(3);
      expect(a.quellen.length, a.id).toBeGreaterThan(0);
      for (const t of a.topicIds) expect(blaetter.has(t), `${a.id}: ${t}`).toBe(true);
      // Gruppen nur aus benachbarten Schritten
      const gruppen = a.schritte.map((s) => s.gruppe);
      for (const g of new Set(gruppen.filter(Boolean))) {
        const idx = gruppen.flatMap((x, i) => (x === g ? [i] : []));
        expect(idx[idx.length - 1]! - idx[0]!, `${a.id}: ${g}`).toBe(idx.length - 1);
      }
    }
  });
});

describe('Durchführen', () => {
  const a = ABLAUF['sc-injektion']!;
  it('nur richtige Griffe: volle Punkte', () => {
    let s = START;
    const z = zufallAus(1);
    while (!fertig(a, s)) {
      const o = optionen(a, s, z);
      expect(o.length).toBe(3);
      const r = o.find((x) => x.art === 'schritt' && erlaubt(a, s.erledigt).some((e) => e.id === x.id))!;
      s = waehle(a, s, r).stand;
    }
    expect(auswerten(a, s)).toMatchObject({ punkte: a.schritte.length, prozent: 100, kritisch: 0 });
  });

  it('Fehlgriffe zählen je Stelle einmal, Fallen kommen nicht wieder', () => {
    let s = START;
    const r1 = waehle(a, s, { art: 'falle', id: 'recap', text: '' });
    expect(r1.rueckmeldung).toMatchObject({ richtig: false, kritisch: true });
    s = r1.stand;
    s = waehle(a, s, { art: 'schritt', id: 'doku', text: '' }).stand;
    expect(s.erledigt).toEqual([]);
    for (let i = 0; i < 20; i++) expect(optionen(a, s, zufallAus(i)).some((o) => o.id === 'recap' || o.id === 'doku')).toBe(false);
    s = waehle(a, s, { art: 'schritt', id: 'anordnung', text: '' }).stand;
    const e = auswerten(a, s);
    expect(e.punkte).toBe(a.schritte.length - 1);
    expect(e.kritisch).toBe(2);
    expect(e.liste[0]).toMatchObject({ position: 0, folge: expect.stringContaining('Nadelstich') });
  });

  it('Gruppen: Schritte dürfen untereinander tauschen', () => {
    const m = ABLAUF.medikamente!;
    expect(erlaubt(m, []).map((x) => x.id)).toEqual(['hd', 'ruhe']);
    const s = waehle(m, START, { art: 'schritt', id: 'ruhe', text: '' });
    expect(s.rueckmeldung.richtig).toBe(true);
    expect(erlaubt(m, s.stand.erledigt).map((x) => x.id)).toEqual(['hd']);
  });
});

describe('Fehler finden', () => {
  it('baut Fehler ein und bewertet', () => {
    for (const a of ABLAEUFE) for (let seed = 0; seed < 30; seed++) {
      const v = fehlerVersion(a, zufallAus(seed));
      const fehler = v.zeilen.filter((z) => z.fehler);
      expect(fehler.filter((z) => z.fehler!.art === 'falle')).toHaveLength(1);
      expect(fehler.filter((z) => z.fehler!.art === 'tausch')).toHaveLength(2);
      expect(new Set(v.zeilen.map((z) => z.key)).size).toBe(v.zeilen.length);
      expect(v.fehltOptionen.some((o) => o.id === (v.fehlt?.id ?? NICHTS_FEHLT))).toBe(true);
      const alles = new Set(fehler.map((z) => z.key));
      const voll = bewerteSuche(v, alles, v.fehlt?.id ?? NICHTS_FEHLT);
      expect(voll.prozent).toBe(100);
      expect(voll.punkte).toBe(3);
      const leer = bewerteSuche(v, new Set(), NICHTS_FEHLT);
      expect(leer.uebersehen).toBe(v.anzahl);
    }
  });
  it('falsche Markierungen kosten Punkte', () => {
    const a = ABLAUF.katheter!;
    const v = fehlerVersion(a, zufallAus(3));
    const richtig = v.zeilen.find((z) => !z.fehler)!;
    const e = bewerteSuche(v, new Set([richtig.key]), v.fehlt?.id ?? NICHTS_FEHLT);
    expect(e.falschMarkiert).toEqual([richtig.key]);
    expect(e.punkte).toBe(0);
  });
});
