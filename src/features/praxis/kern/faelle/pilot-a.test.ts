// Pilotfälle Spur A (P6): Kalibrierung gegen das Modell und fallspezifische Wege.
// Allgemeine Prüfungen (Verweise, Musterweg, Unterlassung, Grenzweg, Replay) laufen für alle Fälle in kern.test.ts.
import { describe, expect, it } from 'vitest';
import { raumJetzt, team } from '../../arbeitsplatz/ansicht';
import { anzeige, freigabe, massnahme, sende, start, type SimZustand } from '../kern';
import type { SimEventEingabe } from '../typen';
import { KH_PNEUMONIE_SEPSIS as KH } from './kh-pneumonie-sepsis';
import { LZ_DEMENZ_SCHMERZ as LZ } from './lz-demenz-schmerz';
import { PAED_FIEBERKRAMPF as PAED } from './paed-fieberkrampf';
import { PSY_PANIK_SUIZIDALITAET as PSY } from './psy-panik-suizidalitaet';

/** Eingaben senden; offene Entscheidungen bekommen die erste „gut“-Option. */
function spiele(z: SimZustand, eingaben: readonly SimEventEingabe[]): SimZustand {
  for (const e of eingaben) z = sende(gut(z), e);
  return gut(z);
}
function gut(z: SimZustand): SimZustand {
  while (z.offeneEntscheidung) {
    const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
    z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
  }
  return z;
}
/** Spielzeit bis t laufen lassen (Entscheidungen unterbrechen ein „warten“). */
function bis(z: SimZustand, t: number): SimZustand {
  while (z.t < t && !z.ende) z = gut(sende(z, { art: 'warten', sek: Math.min(60, t - z.t) }));
  return z;
}
const m = (id: string): SimEventEingabe => ({ art: 'massnahme', id });
const warte = (sek: number): SimEventEingabe => ({ art: 'warten', sek });

describe('Pilot Krankenhaus: Pneumonie mit beginnender Sepsis', () => {
  it('Start passt zur Lage: RR 100–112, AF ab 22, SpO₂ 89–93 %, Puls über 110', () => {
    const a = anzeige(start(KH, 2, 2));
    expect(a.rrSys).toBeGreaterThanOrEqual(100);
    expect(a.rrSys).toBeLessThanOrEqual(112);
    expect(a.af).toBeGreaterThanOrEqual(22);
    expect(a.spo2).toBeGreaterThanOrEqual(89);
    expect(a.spo2).toBeLessThanOrEqual(93);
    expect(a.hf).toBeGreaterThan(110);
  });
  it('Sauerstoff nach Anordnung hebt die Sättigung in den Zielbereich', () => {
    const z = spiele(start(KH, 2, 2), [
      m('af-zaehlen'), m('rr-messen'), m('ansprechen-orientierung'),
      { art: 'anruf', an: 'aerztin', sbar: ['s-verschlechtert', 'a-af-hoch', 'a-rr-niedrig', 'a-verwirrt-neu'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true }, m('o2-geben'), warte(120),
    ]);
    expect(anzeige(z).spo2).toBeGreaterThanOrEqual(94);
  });
  it('nur „Fieber“ gemeldet: Paracetamol statt Sepsis-Versorgung, Fehler', () => {
    const z = spiele(start(KH, 2, 2), [{ art: 'anruf', an: 'aerztin', sbar: ['s-fieber'] }]);
    expect(z.angeboten).toEqual(['an-paracetamol']);
    expect(z.fehlerAus).toContain('f-nur-fieber');
  });
  it('Infusion: 1. Drittel gesperrt, 2. Drittel mit Anleitung (nach Anordnung)', () => {
    const anruf: SimEventEingabe[] = [m('af-zaehlen'), m('rr-messen'), { art: 'anruf', an: 'aerztin', sbar: ['a-af-hoch', 'a-rr-niedrig', 'a-verwirrt-neu'] }, { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true }];
    const inf = massnahme(KH, 'infusion-anhaengen')!;
    expect(freigabe(spiele(start(KH, 1, 2), anruf), inf)).toBe('grenze');
    expect(freigabe(spiele(start(KH, 2, 2), anruf), inf)).toBe('mit-pa');
  });
  it('Raumfoto wechselt mit dem Monitor', () => {
    const z = start(KH, 2, 2);
    expect(raumJetzt(z)).toBe('30b_station_zimmer_frau_sepsis_ohne_monitor');
    expect(raumJetzt(sende(z, m('monitor-anlegen')))).toBe('30b_station_zimmer_frau_sepsis_sensor_an');
  });
  it('Team-Leiste zeigt die Kollegin aus dem Fall', () => {
    expect(team(start(KH, 2, 2)).find((t) => t.wer === 'kollegin')!.name).toBe('Pflegefachmann Jonas (Schichtleitung)');
  });
});

describe('Pilot Langzeit: Demenz, Schmerz, Bettgitter', () => {
  it('Schmerzmittel und Prothese raus senken den Schmerz, Delir steigt langsamer', () => {
    const mit = spiele(start(LZ, 2, 2), LZ.pruefwege.muster.filter((e) => e.art !== 'abschluss'));
    const ohne = bis(start(LZ, 2, 2), mit.t);
    expect(mit.grund.delir).toBeLessThan(ohne.grund.delir);
    expect(bis(start(LZ, 2, 2), 2400).grund.delir).toBeGreaterThan(0.45);
  });
  it('ohne Blick in den Mund fragt der Hausarzt nach', () => {
    const z = spiele(start(LZ, 2, 2), [{ art: 'anruf', an: 'aerztin', sbar: ['s-isst-nicht', 'b-demenz'] }]);
    expect(z.angeboten).toEqual([]);
    expect(z.meldungen.filter((x) => x.art !== 'verlauf').at(-1)!.text).toMatch(/in den Mund geschaut/);
  });
  it('Bettgitter bleibt für Auszubildende gesperrt, auch mit Anordnung; Stufe 3 → Fehler', () => {
    const vorher: SimEventEingabe[] = [m('schmerz-besd'), m('schleimhaut-pruefen'), m('kurve-lesen'),
      { art: 'anruf', an: 'aerztin', sbar: ['a-besd', 'a-druckstelle', 'a-nachts'] }, { art: 'rueckmelden', anordnung: 'an-gitter', rueckgelesen: true }];
    const z2 = spiele(start(LZ, 3, 2), [...vorher, m('fem-anlegen')]);
    expect(z2.getan['fem-anlegen']).toBeUndefined();
    const z3 = spiele(start(LZ, 3, 3), [...vorher, m('fem-anlegen')]);
    expect(z3.fehlerAus).toContain('f-fem');
    expect(z3.log.some((e) => e.art === 'grenzueberschreitung')).toBe(true);
  });
  it('Essen anreichen, bevor die Prothese draußen ist, ist ein Fehler; danach nicht', () => {
    expect(spiele(start(LZ, 2, 2), [m('essen-anreichen')]).fehlerAus).toContain('f-essen-zwang');
    expect(spiele(start(LZ, 2, 2), [m('schleimhaut-pruefen'), m('mundpflege'), m('essen-anreichen')]).fehlerAus).not.toContain('f-essen-zwang');
  });
});

describe('Pilot Pädiatrie: Fieberkrampf', () => {
  const anfallsBeginn = (z: SimZustand) => z.log.find((e) => e.art === 'ereignis' && e.id === 'e-krampf')?.t;
  it('Start: Fieber, Puls 140–170; Anfall nach 5–9 Minuten', () => {
    const a = anzeige(start(PAED, 2, 2));
    expect(a.temp).toBeGreaterThanOrEqual(39);
    expect(a.hf).toBeGreaterThanOrEqual(140);
    expect(a.hf).toBeLessThanOrEqual(170);
    const t = anfallsBeginn(spiele(start(PAED, 2, 2), [warte(900)]));
    expect(t).toBeGreaterThanOrEqual(300);
    expect(t).toBeLessThanOrEqual(540);
  });
  it('frühe Fiebersenkung verhindert den Anfall nicht', () => {
    const z = spiele(start(PAED, 2, 2), [m('temperatur-ohr'), { art: 'anruf', an: 'aerztin', sbar: ['a-fieber'] },
      { art: 'remonstrieren', anordnung: 'an-para-500' }, { art: 'rueckmelden', anordnung: 'an-para-125', rueckgelesen: true }, m('paracetamol-supp'), m('wadenwickel')]);
    expect(anfallsBeginn(bis(z, 900))).toBeDefined();
  });
  it('500 mg ohne Nachrechnen: schwerer Fehler; nach Remonstration 125 mg', () => {
    const blind = spiele(start(PAED, 3, 2), [m('temperatur-ohr'), { art: 'anruf', an: 'aerztin', sbar: ['a-fieber'] },
      { art: 'rueckmelden', anordnung: 'an-para-500', rueckgelesen: true }, m('paracetamol-supp')]);
    expect(blind.fehlerAus).toContain('f-para-500');
  });
  it('nach dem Anfall: schläfrig (AVPU nicht A); Trinken jetzt ist ein Fehler', () => {
    const z = bis(start(PAED, 2, 2), 720);
    expect(z.grund.krampf).toBeLessThan(0);
    expect(anzeige(z).avpu).not.toBe('A');
    expect(spiele(z, [m('trinken-anbieten')]).fehlerAus).toContain('f-trinken');
  });
  it('festhalten und Beißkeil sind Fehler', () => {
    const z = spiele(start(PAED, 2, 2), [m('kind-festhalten'), m('beisskeil')]);
    expect(z.fehlerAus).toEqual(expect.arrayContaining(['f-festhalten', 'f-mund']));
  });
  it('Raumfoto: Anfall-Variante mit Pulsoxymeter', () => {
    expect(raumJetzt(bis(spiele(start(PAED, 2, 2), [m('pulsoxy-anlegen')]), 720))).toBe('20f_paediatrie_kleinkind_fieberkrampf_sensor_an');
  });
});

describe('Pilot Psychiatrie: Panik und Suizidalität', () => {
  it('ohne Hilfe steigt die Angst, die Atemfrequenz geht hoch', () => {
    const z0 = start(PSY, 2, 2);
    const z = bis(z0, 900);
    expect(z.grund.angst).toBeGreaterThan(0.8);
    expect(anzeige(z).af).toBeGreaterThan(anzeige(z0).af);
  });
  it('Atemanleitung beendet die Panik-Eskalation, Tütenatmung nicht und ist ein Fehler', () => {
    const ruhig = spiele(start(PSY, 2, 2), [m('atemanleitung-ruhig'), warte(300)]);
    expect(ruhig.treiber.some((t) => t.art === 'panik_eskaliert')).toBe(false);
    expect(ruhig.grund.angst).toBeLessThan(0.5);
    const tuete = spiele(start(PSY, 2, 2), [m('tuete-atmen')]);
    expect(tuete.treiber.some((t) => t.art === 'panik_eskaliert')).toBe(true);
    expect(tuete.fehlerAus).toContain('f-tuete');
  });
  it('Plan erst bekannt, wenn sie ruhiger ist', () => {
    const vorher = spiele(start(PSY, 3, 2), [m('suizidalitaet-ansprechen')]);
    expect(vorher.meldungen.filter((x) => x.art !== 'verlauf').at(-1)!.text).toMatch(/keine Luft/); // P12: Verlauf-Meldungen laufen dazwischen
    expect(vorher.ereignisseAus).not.toContain('e-versprechen');
  });
  it('Telefonieren, ohne dass jemand bei ihr bleibt: schwerer Fehler', () => {
    const z = spiele(start(PSY, 3, 2), [m('atemanleitung-ruhig'), m('suizidalitaet-ansprechen'), { art: 'anruf', an: 'aerztin', sbar: ['s-suizid', 'a-plan'] }]);
    expect(z.fehlerAus).toContain('f-allein');
  });
  it('stündliche Kontrolle ohne Remonstration: schwerer Fehler; Remonstration bringt 1:1-Begleitung', () => {
    const vorher: SimEventEingabe[] = [m('atemanleitung-ruhig'), m('suizidalitaet-ansprechen'), m('hilfe-holen'), { art: 'anruf', an: 'aerztin', sbar: ['s-suizid', 'a-plan'] }];
    const blind = spiele(start(PSY, 3, 2), [...vorher, { art: 'rueckmelden', anordnung: 'an-stuendlich', rueckgelesen: true }, m('kontrolle-stuendlich')]);
    expect(blind.fehlerAus).toContain('f-stuendlich');
    const rem = spiele(start(PSY, 3, 2), [...vorher, { art: 'remonstrieren', anordnung: 'an-stuendlich' }]);
    expect(rem.angeboten).toContain('an-1zu1');
  });
  it('Schweigeversprechen ist ein schwerer Fehler', () => {
    let z = spiele(start(PSY, 3, 2), [m('atemanleitung-ruhig')]);
    z = sende(z, m('suizidalitaet-ansprechen'));
    expect(z.offeneEntscheidung).toBe('e-versprechen');
    z = sende(z, { art: 'entscheidung', ereignis: 'e-versprechen', wahl: 'w-versprechen' });
    expect(z.fehlerAus).toContain('f-versprechen');
  });
});
