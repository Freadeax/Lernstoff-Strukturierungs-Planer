// Fallwelle P19 (CE 10/11): fallbezogene Prüfungen zu Rückfrage, Remonstration, Schweigepflicht und Modellverlauf.
// Allgemeine Prüfungen (Musterweg ≥ 90 %, Unterlassung, Grenzweg, Replay) laufen für alle Fälle in kern.test.ts und auswertung.test.ts.
import { describe, expect, it } from 'vitest';
import { anzeige, gilt, sende, start, type SimZustand } from '../kern';
import type { SimEventEingabe } from '../typen';
import { KH_ALKOHOLENTZUG as ENTZUG } from './kh-alkoholentzug';
import { KH_DELIR_NACHT as DELIR } from './kh-delir-nacht';
import { PAED_ASTHMA_SCHULKIND as ASTHMA } from './paed-asthma-schulkind';
import { PAED_BRONCHIOLITIS_SAEUGLING as BRONCH } from './paed-bronchiolitis-saeugling';
import { PAED_GASTROENTERITIS_KLEINKIND as GASTRO } from './paed-gastroenteritis-kleinkind';
import { PAED_RAUSCH_JUGENDLICHE as RAUSCH } from './paed-rausch-jugendliche';
import { PSY_UNRUHE_DEESKALATION as PSY } from './psy-unruhe-deeskalation';

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
function bis(z: SimZustand, t: number): SimZustand {
  while (z.t < t && !z.ende) z = gut(sende(z, { art: 'warten', sek: Math.min(60, t - z.t) }));
  return z;
}
/** Musterweg bis vor das erste Ereignis der Art (ausschließlich). */
const bisVor = (fall: typeof RAUSCH, art: string) => fall.pruefwege.muster.slice(0, fall.pruefwege.muster.findIndex((e) => e.art === art));
function waehle(z: SimZustand, wahl: string): SimZustand {
  while (!z.offeneEntscheidung && !z.ende) z = sende(z, { art: 'warten', sek: 60 });
  return sende(z, { art: 'entscheidung', ereignis: z.offeneEntscheidung!, wahl });
}
const m = (id: string): SimEventEingabe => ({ art: 'massnahme', id });
const f = (id: string): SimEventEingabe => ({ art: 'frage', id });
const tel = (bausteine: string[]): SimEventEingabe => ({ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine });
const letzteArzt = (z: SimZustand) => z.meldungen.filter((x) => x.art === 'arzt').at(-1)?.text ?? '';

describe('P19 Asthma Schulkind', () => {
  it('ohne Sättigung fragt die Ärztin zurück', () => {
    const z = spiele(start(ASTHMA, 2, 2), [m('atmung-beobachten'), tel(['s-anfall', 'a-atemnot'])]);
    expect(letzteArzt(z)).toMatch(/Sättigung/);
  });
});

describe('P19 Bronchiolitis Säugling', () => {
  it('Xylometazolin 0,1 % beim Säugling: Remonstration bringt Kochsalz als Ersatz', () => {
    let z = spiele(start(BRONCH, 2, 2), BRONCH.pruefwege.muster.slice(0, BRONCH.pruefwege.muster.findIndex((e) => e.art === 'remonstrieren')));
    expect(z.angeboten).toContain('an-xylo');
    z = spiele(z, [{ art: 'remonstrieren', anordnung: 'an-xylo', grund: 'Säugling' }]);
    expect(z.flags).toContain('remonstriert:an-xylo');
    expect(z.angeboten).toContain('an-nacl');
  });
});

describe('P19 Gastroenteritis Kleinkind', () => {
  it('Kita-Leitung bekommt keine Auskunft (Schweigepflicht)', () => {
    const z = bis(start(GASTRO, 2, 2), 1000);
    const id = GASTRO.gespraech.find((g) => g.schweigepflicht)!.id;
    expect(spiele(z, [f(id)]).fehlerAus).toContain(`schweigepflicht:${id}`);
  });
});

describe('P19 Rausch Jugendliche', () => {
  it('ohne Behandlung fällt der Blutzucker unter 60; mit Glukose-Infusion nicht', () => {
    expect(anzeige(bis(start(RAUSCH, 3, 2), 1500)).bz!).toBeLessThan(60);
    const i = RAUSCH.pruefwege.muster.findIndex((e) => e.art === 'massnahme' && e.id === 'glukose-infusion');
    const behandelt = bis(spiele(start(RAUSCH, 3, 2), RAUSCH.pruefwege.muster.slice(0, i + 1)), 1500);
    expect(gilt(behandelt, { getan: 'glukose-infusion' })).toBe(true);
    expect(anzeige(behandelt).bz!).toBeGreaterThanOrEqual(65);
  });
  it('Traubenzucker-Gel bei Bewusstseinstrübung ist ein Fehler; Freundin bekommt keine Auskunft', () => {
    const ohneRemonstration = spiele(start(RAUSCH, 3, 2), [...bisVor(RAUSCH, 'remonstrieren'), { art: 'rueckmelden', anordnung: 'an-gel', rueckgelesen: true }, m('glukose-oral')]);
    expect(ohneRemonstration.fehlerAus).toContain('f-gel');
    expect(spiele(start(RAUSCH, 3, 2), [f('g-jana-auskunft')]).fehlerAus).toContain('schweigepflicht:g-jana-auskunft');
  });
  it('ohne Seitenlage vor dem Erbrechen: Aspirationsfehler', () => {
    expect(bis(start(RAUSCH, 3, 2), 500).fehlerAus).toContain('f-aspiration');
  });
});

describe('P19 Delir nachts', () => {
  it('nur 4AT gemeldet: Rückfrage nach der Blase; mit Blasenbefund kommen die Anordnungen', () => {
    let z = spiele(start(DELIR, 2, 2), [m('delir-screening-4at'), tel(['s-delir', 'a-4at'])]);
    expect(letzteArzt(z)).toMatch(/Blase/);
    z = spiele(z, [m('blase-tasten'), tel(['a-blase'])]);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-katheter', 'an-metamizol', 'an-lorazepam']));
  });
  it('Einmalkatheter beendet den Harnverhalt, das Delir steigt danach nicht weiter so schnell', () => {
    const ohne = bis(start(DELIR, 3, 2), 1800);
    const i = DELIR.pruefwege.muster.findIndex((e) => e.art === 'massnahme' && e.id === 'einmalkatheter');
    const mit = bis(spiele(start(DELIR, 3, 2), DELIR.pruefwege.muster.slice(0, i + 1)), 1800);
    expect(gilt(mit, { getan: 'einmalkatheter' })).toBe(true);
    expect(mit.grund.delir).toBeLessThan(ohne.grund.delir - 0.15);
  });
  it('Bettgitter ist ein Fehler (FEM ohne Genehmigung)', () => {
    expect(waehle(start(DELIR, 3, 2), 'w-gitter').fehlerAus).toContain('f-gitter');
  });
});

describe('P19 Unruhe und Deeskalation', () => {
  it('Telefonische Fixierung: Remonstration bringt das freiwillige Lorazepam-Angebot', () => {
    let z = spiele(start(PSY, 3, 2), [m('deeskalierend-sprechen'), m('reizarm-gestalten'), m('kurve-lesen'),
      tel(['s-unruhe', 'b-psychose', 'b-medikamente', 'a-deeskaliert'])]);
    expect(z.angeboten).toContain('an-fixierung');
    z = spiele(z, [{ art: 'remonstrieren', anordnung: 'an-fixierung', grund: 'keine Gefahr' }]);
    expect(z.angeboten).toContain('an-lorazepam');
  });
  it('Mutter ohne Schweigepflichtentbindung: Auskunft ist ein Fehler', () => {
    expect(spiele(bis(start(PSY, 3, 2), 600), [f('g-mutter-auskunft')]).fehlerAus).toContain('schweigepflicht:g-mutter-auskunft');
  });
  it('Deeskalation stoppt den Anstieg der Anspannung', () => {
    const ohne = bis(start(PSY, 3, 2), 900);
    const mit = bis(spiele(start(PSY, 3, 2), [m('deeskalierend-sprechen')]), 900);
    expect(mit.grund.angst).toBeLessThan(ohne.grund.angst - 0.15);
  });
});

describe('P19 Alkoholentzug', () => {
  it('ohne Puls und Temperatur fragt der Arzt zurück', () => {
    const z = spiele(start(ENTZUG, 3, 2), [m('entzug-einschaetzen'), tel(['s-entzug', 'a-score'])]);
    expect(letzteArzt(z)).toMatch(/Puls/);
  });
  it('starre Gabe „bis er schläft“: Remonstration bringt die symptomgesteuerte Anordnung', () => {
    let z = spiele(start(ENTZUG, 3, 2), [m('entzug-einschaetzen'), m('puls-zaehlen'), tel(['s-entzug', 'a-score', 'wert:hf'])]);
    expect(z.angeboten).toContain('an-lorazepam-starr');
    z = spiele(z, [{ art: 'remonstrieren', anordnung: 'an-lorazepam-starr', grund: 'Anreicherung' }]);
    expect(z.angeboten).toContain('an-lorazepam-score');
  });
  it('Ehefrau ohne Einwilligung: Schweigepflicht; mit Einwilligung Fremdanamnese', () => {
    expect(spiele(bis(start(ENTZUG, 3, 2), 900), [f('g-frau')]).fehlerAus).toContain('schweigepflicht:g-frau');
    const z = spiele(bis(spiele(start(ENTZUG, 3, 2), [f('g-einwilligung')]), 900), [f('g-frau')]);
    expect(gilt(z, { flag: 'fremdanamnese' })).toBe(true);
  });
});
