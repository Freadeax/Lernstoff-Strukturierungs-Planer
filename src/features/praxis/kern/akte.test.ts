import { describe, expect, it } from 'vitest';
import { akteVon, gabenProTag, hoechstGaben, medPruefung, zuletztSek } from './akte';
import { bewerte } from './auswertung';
import { FAELLE_V2 } from './faelle';
import { PILOT_AMBULANT as FALL } from './faelle/amb-sturz-exsikkose';
import { dokuBausteine, gilt, replay, sende, start, type SimZustand } from './kern';
import type { SimEventEingabe } from './typen';

const spiel = (eingaben: SimEventEingabe[], rolle: 1 | 2 | 3 = 3) => replay(FALL, rolle, 2, 1, eingaben);
const medFehler = (z: SimZustand) => z.fehlerAus.filter((id) => id.startsWith('med-'));

describe('Akte: Zeiten und Plan lesen', () => {
  it('letzte Gabe vor Fallbeginn', () => {
    expect(zuletztSek('gestern 08:10', '08:10')).toBe(-86400);
    expect(zuletztSek('07:10', '08:10')).toBe(-3600);
    expect(zuletztSek('21:00', '08:10')).toBe(-(11 * 3600 + 10 * 60));   // Uhrzeit nach Start = Vortag
    expect(zuletztSek(undefined, '08:10')).toBeUndefined();
  });
  it('Schema und Höchstmenge', () => {
    expect(gabenProTag('1-0-1-0')).toBe(2);
    expect(gabenProTag('0,5-0-0')).toBe(1);
    const e = { id: 'x', wirkstoff: 'Metamizol', staerke: '500 mg', form: 'Tbl.' };
    expect(hoechstGaben({ ...e, bedarf: { indikation: '', einzeldosis: '1 g', maxProTag: '4 g' } })).toBe(4);
    expect(hoechstGaben({ ...e, bedarf: { indikation: '', einzeldosis: '500 mg', maxProTag: '3×' } })).toBe(3);
  });
  it('Minimal-Akte aus person, wenn fall.akte fehlt', () => {
    // Seit P14 haben alle Fälle eine Akte: Fall ohne Akte nachbauen
    const { akte: _ohne, ...ohne } = FAELLE_V2.find((f) => f.id === 'kh-pneumonie-sepsis')!;
    const a = akteVon(ohne as typeof FALL);
    expect(a.medikation).toHaveLength(ohne.person.medikamentePlan.length);
    expect(a.diagnosen?.map((d) => d.text)).toEqual(ohne.person.diagnosenBekannt);
    const { akte: _weg, ...rest } = FALL;
    const m = akteVon(rest as typeof FALL).medikation[0]!;
    expect(m).toMatchObject({ wirkstoff: 'Torasemid', staerke: '10 mg', schema: '1-0-0' });
  });
  it('Lindner hat eine vollständige Akte', () => {
    const a = FALL.akte!;
    expect(a.medikation.map((m) => m.wirkstoff)).toEqual(expect.arrayContaining(['Torasemid', 'Ramipril', 'Pantoprazol']));
    expect(a.vorwerte!.every((v) => (v.werte.rrSys ?? 0) >= 125)).toBe(true);
    expect(a.pflegebericht!.length).toBeGreaterThanOrEqual(2);
    for (const m of a.medikation) if (m.massnahme) expect(FALL.massnahmen).toContain(m.massnahme);
    for (const m of a.medikation) if (m.geaendertDurch) expect(FALL.anordnungen.map((x) => x.id)).toContain(m.geaendertDurch);
  });
});

describe('Medikamentengabe gegen den Plan', () => {
  it('erste Morgengabe ist in Ordnung, die zweite eine Doppelgabe mit Text', () => {
    let z = spiel([{ art: 'massnahme', id: 'tabletten-wie-geplant-geben' }]);
    expect(medFehler(z)).toEqual([]);
    z = sende(z, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' });
    expect(medFehler(z)).toEqual(expect.arrayContaining(['med-doppelt:mp-ramipril', 'med-doppelt:mp-pantoprazol']));
    expect(z.meldungen.some((m) => m.art === 'fehler' && m.text.includes('Doppelgabe: Ramipril'))).toBe(true);
  });
  it('pausierter Eintrag (Anordnung Torasemid-Pause) zählt nicht als Doppelgabe', () => {
    // P11: ohne Blutzucker fragt die Ärztin erst nach; deshalb vorher messen und wert:bz melden
    const anruf: SimEventEingabe = { art: 'anruf', an: 'aerztin', sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-verwirrt-neu', 'wert:bz'] };
    let z = spiel([{ art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' },
      { art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' }, anruf,
      { art: 'rueckmelden', anordnung: 'an-torasemid-pause', rueckgelesen: true }, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' }]);
    z = sende(z, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' });
    expect(medFehler(z)).not.toContain('med-doppelt:mp-torasemid');
    expect(medFehler(z)).toContain('med-doppelt:mp-ramipril');
  });
  it('Bedarf: Abstand 6 h; nach 6 h erlaubt', () => {
    let z = spiel([{ art: 'massnahme', id: 'bedarfsmedikation-oral' }]);
    expect(medFehler(z)).toEqual([]);
    z = sende(z, { art: 'massnahme', id: 'bedarfsmedikation-oral' });
    expect(medFehler(z)).toEqual(['med-abstand:mp-paracetamol']);
    // rein: 6 h später wäre es richtig
    expect(medPruefung(FALL, 'bedarfsmedikation-oral', [0, 6 * 3600], {})).toEqual([]);
    // Höchstmenge: 5. Gabe am Tag
    const tag = [0, 1, 2, 3, 4].map((i) => i * 6.5 * 3600 - 7 * 3600);
    expect(medPruefung(FALL, 'bedarfsmedikation-oral', tag, {}).map((f) => f.art)).toContain('med-max');
  });
  it('Auswertung zieht Medikationsfehler ab und nennt den Wirkstoff', () => {
    const z = spiel([{ art: 'massnahme', id: 'tabletten-wie-geplant-geben' }, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' }]);
    const b = bewerte(z).beitraege.find((x) => x.id === 'fehler:med-doppelt:mp-ramipril')!;
    expect(b.abzug).toBeGreaterThan(0);
    expect(b.text).toContain('Ramipril');
  });
});

describe('Pflegebericht (dokumentieren)', () => {
  it('Bausteine nur aus Bekanntem; Eintrag mit Werten, Bedingung dokumentiert, zählt als Pflegebericht', () => {
    let z = start(FALL, 2, 2);
    expect(dokuBausteine(z).some((b) => b.id.startsWith('wert:'))).toBe(false);
    z = sende(z, { art: 'pflegetasche', geraet: 'rr-geraet' });
    z = sende(z, { art: 'massnahme', id: 'rr-messen' });
    z = sende(z, { art: 'massnahme', id: 'schleimhaut-pruefen' });
    const ids = dokuBausteine(z).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(['wert:rrSys', 'befund:schleimhaut-pruefen', 'a-exsikkose']));
    const rr = z.meldungen.find((m) => m.quelle === 'rr-messen')!.werte!.rrSys!;
    const t0 = z.t;
    z = sende(z, { art: 'dokumentieren', bausteine: ['wert:rrSys', 'a-exsikkose', 'gibt-es-nicht'], freitext: 'Tochter informiert.' });
    expect(z.t).toBeGreaterThan(t0);
    const d = z.meldungen.filter((m) => m.art === 'doku').at(-1)!;
    expect(d.text).toContain('RR');
    expect(d.text).toContain('Tochter informiert.');
    expect(d.werte?.rrSys).toBe(rr);
    expect(gilt(z, { dokumentiert: 'a-exsikkose' })).toBe(true);
    expect(gilt(z, { dokumentiert: 'wert:rrSys' })).toBe(true);
    expect(gilt(z, { dokumentiert: 'gibt-es-nicht' })).toBe(false);
    expect(gilt(z, { getan: 'pflegebericht' })).toBe(true);
  });
  it('leerer Eintrag ändert nichts an Zeit und Doku', () => {
    const z = sende(start(FALL, 2, 2), { art: 'dokumentieren', bausteine: [], freitext: '  ' });
    expect(z.t).toBe(0);
    expect(z.meldungen.some((m) => m.art === 'doku')).toBe(false);
  });
  it('Replay identisch', () => {
    const e: SimEventEingabe[] = [{ art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' },
      { art: 'dokumentieren', bausteine: ['wert:rrSys'] }, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' }, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' }];
    const a = spiel(e), b = spiel(e);
    expect(b.meldungen).toEqual(a.meldungen);
    expect(b.log).toEqual(a.log);
  });
});

describe('Planeintrag ab Anordnung (ab)', () => {
  const FALL_AB = FAELLE_V2.find((f) => f.id === 'kh-alkoholentzug')!;
  const e = FALL_AB.akte!.medikation.find((m) => m.ab)!;
  it('Fälle: ab verweist auf eine Anordnung derselben Maßnahme', () => {
    for (const f of FAELLE_V2) for (const m of f.akte?.medikation ?? []) if (m.ab) {
      const a = f.anordnungen.find((x) => x.id === m.ab);
      expect(a, `${f.id} ${m.id}`).toBeDefined();
      expect(m.massnahme, `${f.id} ${m.id}`).toBe(a!.massnahme);
    }
  });
  it('vor der Anordnung keine Prüfung, danach Abstand; Gaben vor der Anordnung zählen nicht', () => {
    expect(e.massnahme).toBe('lorazepam-geben');
    expect(medPruefung(FALL_AB, 'lorazepam-geben', [0, 600], {})).toEqual([]);
    const an = { [e.ab!]: { rueckgelesen: true, t: 300 } };
    expect(medPruefung(FALL_AB, 'lorazepam-geben', [600, 1200], an).map((f) => f.id)).toEqual([`med-abstand:${e.id}`]);
    expect(medPruefung(FALL_AB, 'lorazepam-geben', [0, 600], an)).toEqual([]);
    expect(medPruefung(FALL_AB, 'lorazepam-geben', [600, 600 + 3600], an)).toEqual([]);
    expect(medPruefung(FALL_AB, 'lorazepam-geben', [600, 1200], an, [e.ab!])).toEqual([]);
  });
  it('Höchstmenge greift ab Anordnung (Palliativ: 6× Morphin)', () => {
    const f = FAELLE_V2.find((x) => x.id === 'lz-palliativ-gespraech')!;
    const m = f.akte!.medikation.find((x) => x.ab)!;
    const an = { [m.ab!]: { rueckgelesen: true, t: 0 } };
    const tag = [0, 1, 2, 3, 4, 5, 6].map((i) => i * 4 * 3600 - 15 * 3600);
    expect(medPruefung({ ...f, startUhrzeit: '23:59' }, m.massnahme!, tag.map((t) => t + 15 * 3600), an).map((x) => x.art)).toContain('med-max');
  });
});
