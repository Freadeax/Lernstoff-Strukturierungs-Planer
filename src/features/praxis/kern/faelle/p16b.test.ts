// Runde 2, Paket P16b: CE06 Akutsituationen (Reanimation im Zimmer, ACS in der Notaufnahme, Schlaganfall im Heim, Beatmungsalarm auf Intensiv).
// Allgemeine Prüfungen (Musterweg ≥ 90 %, Unterlassung, Grenzweg, Replay) laufen für alle Fälle in kern.test.ts und auswertung.test.ts.
import { describe, expect, it } from 'vitest';
import { anzeige, gilt, sende, start, type SimZustand } from '../kern';
import type { SimEventEingabe } from '../typen';
import { ITS_BEATMUNG_ALARM as ITS } from './its-beatmung-alarm';
import { KH_REANIMATION_BLS as REA } from './kh-reanimation-bls';
import { LZ_SCHLAGANFALL_AKUT as LZ } from './lz-schlaganfall-akut';
import { NA_ACS_BRUSTSCHMERZ as NA } from './na-acs-brustschmerz';

function gut(z: SimZustand): SimZustand {
  while (z.offeneEntscheidung) {
    const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
    z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
  }
  return z;
}
function spiele(z: SimZustand, eingaben: readonly SimEventEingabe[]): SimZustand {
  for (const e of eingaben) z = sende(gut(z), e);
  return gut(z);
}
const m = (id: string): SimEventEingabe => ({ art: 'massnahme', id });
const warte = (sek: number): SimEventEingabe => ({ art: 'warten', sek });
/** Spielzeit bis t laufen lassen (Entscheidungen unterbrechen ein „warten“). */
function bis(z: SimZustand, t: number): SimZustand {
  while (z.t < t && !z.ende) z = gut(sende(z, warte(Math.min(60, t - z.t))));
  return z;
}
const letzteArzt = (z: SimZustand) => z.meldungen.filter((x) => x.art === 'arzt').at(-1)?.text ?? '';
/** Musterweg bis (ausschließlich) zum ersten Schritt, der `stopp` erfüllt */
const musterBis = (muster: readonly SimEventEingabe[], stopp: (e: SimEventEingabe) => boolean) => muster.slice(0, muster.findIndex(stopp));

describe('P16b Reanimation im Zimmer (BLS, AED)', () => {
  it('ohne Herzdruckmassage in den ersten zwei Minuten: Fehler, kein Kreislauf', () => {
    const z = spiele(start(REA, 2, 2), [m('bewusstsein-avpu'), warte(150)]);
    expect(z.fehlerAus).toContain('f-spaet');
    expect(anzeige(z).hf).toBe(0);
  });
  it('mit BLS, AED-Schock und Weiterdrücken kommt der Kreislauf zurück', () => {
    const z = spiele(start(REA, 2, 2), musterBis(REA.pruefwege.muster, (e) => e.art === 'massnahme' && e.id === 'puls-zaehlen'));
    expect(gilt(z, { getan: 'wahl:e-analyse:w-alle-weg' })).toBe(true);
    expect(anzeige(z).hf).toBeGreaterThan(40);
  });
  it('„Er wollte das nicht“ ohne Verfügung: Aufhören ist ein schwerer Fehler', () => {
    let z = start(REA, 2, 2);
    for (const e of [m('bewusstsein-avpu'), m('atmung-beobachten'), m('rea-team-alarmieren'), m('bls-herzdruckmassage')]) z = sende(z, e);
    for (let i = 0; i < 40 && z.offeneEntscheidung !== 'e-nachbar-wille'; i++) z = z.offeneEntscheidung ? sende(z, { art: 'entscheidung', ereignis: z.offeneEntscheidung, wahl: z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!.entscheidung!.find((o) => o.wertung === 'gut')!.id }) : sende(z, warte(30));
    expect(z.offeneEntscheidung).toBe('e-nachbar-wille');
    z = sende(z, { art: 'entscheidung', ereignis: 'e-nachbar-wille', wahl: 'w-aufhoeren' });
    expect(z.fehlerAus).toContain('f-aufgehoert');
  });
});

describe('P16b Brustschmerz in der Notaufnahme (STEMI, Sildenafil)', () => {
  it('Musterweg: nach Potenzmitteln gefragt, Nitrat hinterfragt und nicht gegeben', () => {
    const z = spiele(start(NA, 3, 2), NA.pruefwege.muster);
    expect(z.fehlerAus.filter((f) => f.startsWith('f-nitro'))).toEqual([]);
    expect(gilt(z, { getan: 'nitro-spray' })).toBe(false);
  });
  it('Nitrat ohne Frage nach Potenzmitteln ist ein Fehler, auch wenn angeordnet', () => {
    const vorAnruf = musterBis(NA.pruefwege.muster, (e) => e.art === 'frage' && e.id === 'g-medikamente');
    let z = spiele(start(NA, 3, 2), [...vorAnruf,
      { art: 'anruf', an: 'aerztin', sbar: ['s-acs', 'b-risiko', 'a-ekg-hebung', 'a-schmerz', 'a-kreislauf', 'r-sofort'] }]);
    expect(z.angeboten).toContain('an-nitro');
    z = spiele(z, [{ art: 'rueckmelden', anordnung: 'an-nitro', rueckgelesen: true }, m('nitro-spray')]);
    expect(z.fehlerAus).toContain('f-nitro-ungefragt');
  });
});

describe('P16b Schlaganfall im Pflegeheim (FAST, 112, Hausärztin)', () => {
  it('Hausärztin vor dem Notruf: sie schickt zum Notruf, leichter Fehler', () => {
    const z = spiele(start(LZ, 2, 2), [m('ansprechen-orientierung'), m('fast-test'),
      { art: 'anruf', an: 'aerztin', sbar: ['s-schlaganfall', 'a-wach', 'a-schlucken', 'r-112'] }]);
    expect(letzteArzt(z)).toMatch(/112/);
    expect(z.fehlerAus).toContain('f-hausaerztin-zuerst');
  });
  it('G5: Zeit seit „zuletzt gesund“ und Lysefenster aus dem Modell, FAST voll positiv', () => {
    const z = spiele(start(LZ, 2, 2), [m('lkw-klaeren')]);
    expect(anzeige(z).seitBeginnMin).toBeGreaterThanOrEqual(35);
    expect(anzeige(z).lyseFensterMin).toBeLessThan(240);
    expect(anzeige(z).fast).toBe(3);
  });
  it('Notruf zu spät: Fehler', () => {
    const z = bis(spiele(start(LZ, 2, 2), [m('ansprechen-orientierung'), m('fast-test')]), 620);
    expect(z.fehlerAus).toContain('f-notruf-spaet');
  });
  it('Musterweg: Morgenmedikation hinterfragt, nicht gegeben, Rückauftrag Blutdruck erledigt', () => {
    const z = spiele(start(LZ, 2, 2), LZ.pruefwege.muster);
    expect(z.flags).toContain('remonstriert:an-morgenmedikation');
    expect(gilt(z, { getan: 'morgenmedikation-geben' })).toBe(false);
    expect(z.fehlerAus).toEqual([]);
  });
});

describe('P16b Beatmungsalarm bei der Übergabe (Intensiv)', () => {
  it('Alarm stummschalten statt Ursache suchen: Fehler, Sättigung fällt weiter', () => {
    const z = spiele(start(ITS, 3, 2), [warte(20), m('alarm-stummschalten'), warte(260)]);
    expect(z.fehlerAus).toEqual(expect.arrayContaining(['f-stumm', 'f-spaet']));
    expect(anzeige(z).spo2).toBeLessThan(85);
  });
  it('Diskonnektion behoben: Beatmung wieder dicht, Sättigung erholt sich', () => {
    const z = spiele(start(ITS, 3, 2), [warte(20), m('beatmung-beobachten'), m('beatmung-diskonnektion-beheben'), warte(60)]);
    expect(z.fehlerAus).toEqual([]);
    expect(anzeige(z).spo2).toBeGreaterThanOrEqual(95);
  });
  it('Propofol 40 ml/h ohne Nachfrage umgesetzt: schwerer Fehler', () => {
    const vorRemo = musterBis(ITS.pruefwege.muster, (e) => e.art === 'remonstrieren');
    const z = spiele(start(ITS, 3, 2), [...vorRemo, { art: 'rueckmelden', anordnung: 'an-propofol-40', rueckgelesen: true }, m('propofol-40'), warte(120)]);
    expect(z.fehlerAus).toContain('f-propofol-40');
  });
  it('nur „er wird wach“ gemeldet: Dr. Lorenz fragt nach RASS, BPS und Perfusor zurück', () => {
    const vorAnruf = musterBis(ITS.pruefwege.muster, (e) => e.art === 'anruf');
    const z = spiele(start(ITS, 3, 2), [...vorAnruf, { art: 'anruf', an: 'aerztin', sbar: ['s-unruhig'] }]);
    expect(letzteArzt(z)).toMatch(/RASS und BPS/);
  });
  it('Analgesie zuerst: nach der Korrektur läuft Sufentanil 7 ml/h, Propofol bleibt bei 4 ml/h, RASS 0/−1', () => {
    const z = spiele(start(ITS, 3, 2), ITS.pruefwege.muster);
    const raten = Object.fromEntries((z.module?.perfusoren ?? []).map((p) => [p.id, p.mlProH]));
    expect(raten).toMatchObject({ propofol: 4, sufentanil: 7 });
    expect(anzeige(z).rass).toBeGreaterThanOrEqual(-1);
    expect(anzeige(z).rass).toBeLessThanOrEqual(0);
    expect(z.ende?.ausgang).toBe('stabil');
  });
});
