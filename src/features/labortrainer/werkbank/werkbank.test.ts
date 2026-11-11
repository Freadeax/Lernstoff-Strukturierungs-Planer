import { describe, expect, it } from 'vitest';
import { PARAMETER_NACH_ID } from '../../../ui/sim/labor/parameter';
import { ROEHRCHEN } from '../../../ui/sim/labor/praeanalytik';
import { bewerteEntnahme, debrief, ENTNAHME_KRITERIEN, FOLGEHANDLUNG, roehrchenFuer, staender, SZENARIEN, VERWURF, zielFuellung, type EntnahmeEingabe, type EntnahmeSzenario, type Platz } from './entnahme';
import { VERLAEUFE } from './verlauf';
import { werkbankErgebnis, werkbankThema } from './lernplan';
import { pruefeErgebnis } from '../../lernplan/ergebnis';
import { pflegeModule } from '../../../modules/pflege';
import { leafTopics } from '../../lernplan/store';
import { bewerteSbar, DOKU_FELDER, MELDUNGEN } from './meldung';

const sz = (id: string) => SZENARIEN.find((s) => s.id === id)!;
/** Musterlösung: richtige Reihenfolge, Verwurf bei Flügelkanüle, alles voll. */
function richtig(s: EntnahmeSzenario): EntnahmeEingabe {
  const folge: Platz[] = [...roehrchenFuer(s)].sort((a, b) => (ROEHRCHEN[a].reihenfolge ?? 99) - (ROEHRCHEN[b].reihenfolge ?? 99));
  if (s.fluegel) folge.unshift(VERWURF);
  const fuellung = Object.fromEntries(roehrchenFuer(s).map((m) => [m, 1]));
  return { identitaet: 'offen', arm: s.infusion === 'links' ? 'rechts' : 'links', stauzeit: 30, folge, fuellung, mischen: 'schwenken', transport: 'sofort' };
}

describe('Werkbank: Blutentnahme', () => {
  it('Szenarien nutzen nur bekannte Parameter und haben wahre Werte dazu', () => {
    for (const s of SZENARIEN) for (const id of s.parameter) { expect(PARAMETER_NACH_ID[id], `${s.id}/${id}`).toBeDefined(); expect(s.wahr[id], `${s.id}/${id}`).toBeTypeOf('number'); }
  });
  it('Musterlösung gibt volle Punkte und unverfälschte Werte (außer Antibiose-Fall)', () => {
    for (const s of SZENARIEN) {
      const e = bewerteEntnahme(s, richtig(s));
      expect(e.punkte, s.id).toBe(e.max);
      expect(e.werte.some((w) => w.verfaelscht), s.id).toBe(false);
      if (!s.antibiotikumGelaufen) expect(e.fehler, s.id).toEqual([]);
    }
  });
  it('Infusionsarm verdünnt: Glukose falsch hoch', () => {
    const s = sz('aufnahme');
    const e = bewerteEntnahme(s, { ...richtig(s), arm: 'links' });
    expect(e.fehler.map((f) => f.art)).toContain('infusion');
    const glu = e.werte.find((w) => w.id === 'glukose')!;
    expect(glu.gemessen!).toBeGreaterThan(glu.wahr);
    expect(e.punkte).toBeLessThan(e.max);
  });
  it('EDTA vor Serum: Kalium-Verschleppung', () => {
    const s = sz('aufnahme');
    const r = richtig(s);
    const folge = ['edta', ...r.folge.filter((p) => p !== 'edta')] as Platz[];
    const e = bewerteEntnahme(s, { ...r, folge });
    expect(e.fehler.map((f) => f.art)).toContain('verschleppung');
    const k = e.werte.find((w) => w.id === 'k')!;
    expect(k.gemessen!).toBeGreaterThan(k.wahr);
  });
  it('Flügelkanüle ohne Verwurf unterfüllt das erste Citratröhrchen', () => {
    const s = sz('gerinnung');
    expect(zielFuellung(s, [], 'citrat')).toBeLessThan(0.95);
    expect(zielFuellung(s, [VERWURF], 'citrat')).toBe(1);
    const r = richtig(s);
    const e = bewerteEntnahme(s, { ...r, folge: r.folge.filter((p) => p !== VERWURF), fuellung: { ...r.fuellung, citrat: 0.82 } });
    expect(e.fehler.map((f) => f.art)).toContain('citrat');
    expect(e.werte.find((w) => w.id === 'inr')!.gemessen).toBeUndefined();
  });
  it('Zu langer Stau und Liegenlassen verfälschen', () => {
    const s = sz('aufnahme');
    const e = bewerteEntnahme(s, { ...richtig(s), stauzeit: 120, transport: 'spaeter' });
    expect(e.fehler.map((f) => f.art)).toEqual(expect.arrayContaining(['stauung', 'liegezeit']));
  });
  it('Ohne offene Identitätsprüfung lehnt das Labor ab', () => {
    const s = sz('sepsis');
    const e = bewerteEntnahme(s, { ...richtig(s), identitaet: 'geschlossen' });
    expect(e.werte.every((w) => w.gemessen === undefined)).toBe(true);
  });
  it('Ständer enthält jedes Röhrchen genau einmal, Verwurf nur bei Flügelkanüle', () => {
    for (const s of SZENARIEN) {
      const st = staender(s, () => 0.3);
      expect(new Set(st).size).toBe(st.length);
      expect(st.includes(VERWURF)).toBe(!!s.fluegel);
      expect(st.length).toBe(roehrchenFuer(s).length + (s.fluegel ? 1 : 0));
    }
  });
});

describe('Werkbank: Kumulativbefund', () => {
  it('Verläufe sind vollständig und der gesuchte Wert ist am Ende auffällig', () => {
    for (const v of VERLAEUFE) {
      expect(v.werte[v.gesucht], v.id).toBeDefined();
      for (const [id, w] of Object.entries(v.werte)) { expect(PARAMETER_NACH_ID[id], id).toBeDefined(); expect(w.length, `${v.id}/${id}`).toBe(v.zeiten.length); }
      expect(v.handeln.optionen.length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(v.werte).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Werkbank: kritischen Wert melden', () => {
  it('jede Meldung hat genau eine richtige Notiz, je einen S/B/A/R-Baustein und richtige Optionen bis dahin', () => {
    for (const m of MELDUNGEN) {
      expect(m.notizen.filter((n) => n.richtig).length, m.id).toBe(1);
      expect(m.bausteine.filter((b) => b.teil !== 'x').map((b) => b.teil).sort().join(''), m.id).toBe('ABRS');
      expect(m.bausteine.some((b) => b.teil === 'x'), m.id).toBe(true);
      expect(m.bisDahin.filter((b) => b.richtig).length, m.id).toBeGreaterThanOrEqual(1);
    }
    expect(DOKU_FELDER.filter((f) => f.noetig).length).toBe(5);
  });
  it('SBAR in richtiger Reihenfolge ohne Unnötiges gibt volle Punkte', () => {
    for (const m of MELDUNGEN) {
      const ideal = ['S', 'B', 'A', 'R'].map((t) => m.bausteine.find((b) => b.teil === t)!.id);
      const w = bewerteSbar(m, ideal);
      expect(w.punkte).toBe(w.max);
      const falsch = bewerteSbar(m, [...ideal].reverse());
      expect(falsch.punkte).toBeLessThan(falsch.max);
      const mitX = bewerteSbar(m, [...ideal, m.bausteine.find((b) => b.teil === 'x')!.id]);
      expect(mitX.punkte).toBe(mitX.max - 1);
      const unvollstaendig = bewerteSbar(m, ideal.slice(0, 2));
      expect(unvollstaendig.hinweise.join(' ')).toMatch(/fehlt/);
    }
  });
});

describe('Werkbank: Nachbesprechung und Lernplan (Audit Abschnitt 5)', () => {
  it('Debrief trennt Fehlerursache, Messwertänderung und Folgehandlung', () => {
    const s = sz('aufnahme');
    const e = bewerteEntnahme(s, { ...richtig(s), arm: 'links', stauzeit: 90 });
    const d = debrief(e);
    expect(d.map((z) => z.art)).toEqual(expect.arrayContaining(['infusion', 'stauung']));
    const inf = d.find((z) => z.art === 'infusion')!;
    expect(inf.ursache).toMatch(/Infusionsarm/);
    expect(inf.messwert).toMatch(/Glukose .*→/);
    expect(inf.folge).toBe(FOLGEHANDLUNG.infusion);
    for (const z of d) expect(z.folge).not.toBe(z.erklaerung);
  });
  it('abgelehnte Probe: kein Wert statt Messwertänderung', () => {
    const s = sz('aufnahme');
    const d = debrief(bewerteEntnahme(s, { ...richtig(s), identitaet: 'keine' }));
    expect(d.find((z) => z.art === 'identitaet')!.messwert).toMatch(/abgelehnt/);
    const d2 = debrief(bewerteEntnahme(s, { ...richtig(s), identitaet: 'keine', arm: 'links' }));
    expect(d2.find((z) => z.art === 'infusion')!.messwert).toMatch(/nicht sichtbar.*Glukose/);
  });
  it('jede Fehlerart hat eine Folgehandlung, Kriterien passen zu den Punkten', () => {
    for (const f of Object.values(FOLGEHANDLUNG)) expect(f.length).toBeGreaterThan(20);
    const s = sz('gerinnung');
    expect(bewerteEntnahme(s, richtig(s)).checks).toHaveLength(ENTNAHME_KRITERIEN.length);
  });
  it('Lernplan: gültiges Ergebnis mit eigener Versuch-ID und Thema aus dem Katalog', () => {
    const blaetter = new Set(leafTopics(pflegeModule.topics).map((t) => t.id));
    for (const st of ['entnahme', 'meldung'] as const) expect(blaetter.has(werkbankThema(st))).toBe(true);
    for (const v of VERLAEUFE) expect(blaetter.has(werkbankThema('verlauf', v.gesucht)), v.id).toBe(true);
    const e = werkbankErgebnis({ station: 'entnahme', szenario: 'aufnahme', lauf: 'x1', topicId: werkbankThema('entnahme'), punkte: 6, max: 8, kriterien: [] });
    expect(pruefeErgebnis(e)).toBeUndefined();
    expect(e.versuchId).toBe('werkbank:entnahme:aufnahme:x1');
    expect(e.ergebnisse[0]!.scorePercent).toBe(75);
  });
});
