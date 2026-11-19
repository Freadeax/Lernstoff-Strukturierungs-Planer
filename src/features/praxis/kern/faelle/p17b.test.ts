// Fallwelle P17b (CE 04/CE 07): Herzschwäche, Unterzucker mit Insulin, Schlaganfall-Reha.
// Allgemeine Prüfungen (Musterweg ≥ 90 %, Unterlassung, Grenzweg, Replay) laufen für alle Fälle in kern.test.ts und auswertung.test.ts.
import { describe, expect, it } from 'vitest';
import { anzeige, gilt, sende, start, type SimZustand } from '../kern';
import type { SimEventEingabe } from '../typen';
import { AMB_HERZSCHWAECHE as HI } from './amb-herzschwaeche';
import { AMB_HYPOGLYKAEMIE as DM } from './amb-hypoglykaemie';
import { LZ_SCHLAGANFALL_REHA as SA } from './lz-schlaganfall-reha';

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
const tasche = (geraet: string): SimEventEingabe => ({ art: 'pflegetasche', geraet });
const warte = (sek: number): SimEventEingabe => ({ art: 'warten', sek });
const letzteArzt = (z: SimZustand) => z.meldungen.filter((x) => x.art === 'arzt').at(-1)?.text ?? '';
const anArzt = (kanal: 'telefon' | 'messenger', bausteine: string[]): SimEventEingabe => ({ art: 'nachricht', an: 'aerztin', kanal, bausteine });

describe('P17b Herzschwäche zu Hause (Herr Petersen)', () => {
  it('Ausgangslage passt zu den Texten: Sättigung knapp, Atemfrequenz erhöht', () => {
    const a = anzeige(start(HI, 2, 2));
    expect(a.spo2).toBeGreaterThanOrEqual(90);
    expect(a.spo2).toBeLessThanOrEqual(94);
    expect(a.af).toBeGreaterThanOrEqual(22);
  });
  it('ohne Gewicht und Sättigung fragt die Hausärztin zurück; Rückmeldung bringt die Anordnungen', () => {
    let z = spiele(start(HI, 2, 2), [m('beschwerden-erfragen'), m('oedeme-pruefen'), anArzt('telefon', ['s-atemnot', 'a-atemnot', 'a-oedeme'])]);
    expect(letzteArzt(z)).toMatch(/Wie viel wiegt er/);
    z = spiele(z, [anArzt('telefon', ['zusage:melde-mich'])]);
    expect(gilt(z, { auftrag: 'af-werte', status: 'offen' })).toBe(true);
    z = spiele(z, [tasche('pulsoxy'), m('pulsoxy-anlegen'), m('gewicht-messen'), anArzt('messenger', ['a-gewicht', 'wert:spo2']), warte(120)]);
    expect(z.flags).toContain('arzt-informiert');
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-torasemid-zusatz', 'an-kompression']));
  });
  it('Kompression blind übernommen: Fehler und schlechtere Sättigung', () => {
    const ohne = spiele(start(HI, 2, 2), [warte(900)]);
    const mit = spiele(start(HI, 2, 2), [m('kompression-anziehen'), warte(900)]);
    expect(mit.fehlerAus).toContain('f-kompression');
    expect(anzeige(mit).spo2).toBeLessThan(anzeige(ohne).spo2);
  });
  it('Tochter: Auskunft erst nach Einverständnis', () => {
    expect(spiele(start(HI, 2, 2), [warte(300), { art: 'frage', id: 'g-tochter-lage' }]).fehlerAus).toContain('schweigepflicht:g-tochter-lage');
    expect(spiele(start(HI, 2, 2), [warte(300), { art: 'frage', id: 'g-einwilligung' }, { art: 'frage', id: 'g-tochter-lage' }]).fehlerAus).toEqual([]);
  });
});

describe('P17b Unterzucker vor dem Abendinsulin (Herr Becker)', () => {
  it('Ausgangslage: Unterzucker, wach', () => {
    const a = anzeige(start(DM, 2, 2));
    expect(a.bz).toBeLessThan(70);
    expect(a.avpu).toBe('A');
  });
  it('Traubenzucker hebt den Zucker innerhalb einer Viertelstunde über 70', () => {
    const z = spiele(start(DM, 2, 2), [m('glukose-oral'), warte(900)]);
    expect(anzeige(z).bz).toBeGreaterThan(70);
  });
  it('volle Insulindosis ist ein schwerer Fehler und senkt den Zucker weiter', () => {
    const z = spiele(start(DM, 3, 2), [m('insulin-abend'), warte(1200)]);
    expect(z.fehlerAus).toContain('f-insulin-voll');
    expect(anzeige(z).bz).toBeLessThan(45);
  });
  it('Brot statt Traubenzucker: leichter Fehler', () => {
    expect(spiele(start(DM, 2, 2), [m('kohlenhydrate-langsam')]).fehlerAus).toContain('f-brot-zuerst');
  });
  it('Rückmeldung nach dem Nachmessen bringt die reduzierte Dosis', () => {
    const z = spiele(start(DM, 2, 2), [tasche('bz-geraet'), m('bz-messen'), m('glukose-oral'), m('beschwerden-erfragen'),
      anArzt('telefon', ['s-hypo', 'b-insulin', 'a-hypo', 'wert:bz']), { art: 'remonstrieren', anordnung: 'an-insulin-voll' }, { art: 'auflegen', an: 'aerztin' },
      warte(600), warte(300), m('bz-messen'), anArzt('messenger', ['wert:bz']), warte(120)]);
    expect(z.flags).toContain('bz-rueckmeldung');
    expect(z.angeboten).toContain('an-insulin-reduziert');
  });
});

describe('P17b Schlaganfall-Reha (Herr Wagner)', () => {
  it('dünner Kaffee der Ehefrau: Aspiration, Sättigung fällt', () => {
    let z = start(SA, 2, 2);
    z = sende(z, warte(300));
    expect(z.offeneEntscheidung).toBe('e-kaffee');
    z = sende(z, { art: 'entscheidung', ereignis: 'e-kaffee', wahl: 'w-lassen' });
    z = spiele(z, [warte(300)]);
    expect(z.fehlerAus).toContain('f-aspiration');
    expect(anzeige(z).spo2).toBeLessThan(93);
  });
  it('am gelähmten Arm hochziehen: schwerer Fehler mit Schmerz', () => {
    const z = spiele(start(SA, 2, 2), [m('am-arm-hochziehen'), warte(30)]);
    expect(z.fehlerAus).toContain('f-arm');
  });
  it('ohne Werte fragt die Ärztin nach Fieber und Sättigung; alle Tabletten mörsern ohne Nachfrage ist ein Fehler', () => {
    let z = spiele(start(SA, 2, 2), [m('positionieren-hemiplegie'), m('schlucken-pruefen'), m('kost-anpassen'),
      anArzt('messenger', ['s-schlucken', 'a-husten-trinken', 'a-tabletten']), warte(90)]);
    expect(letzteArzt(z)).toMatch(/Fieber/);
    z = spiele(z, [anArzt('messenger', ['zusage:melde-mich']), tasche('thermometer'), m('temperatur-ohr'), tasche('pulsoxy'), m('pulsoxy-anlegen'),
      anArzt('messenger', ['wert:temp', 'wert:spo2']), warte(120)]);
    expect(z.flags).toContain('arzt-informiert');
    z = spiele(z, [{ art: 'rueckmelden', anordnung: 'an-moersern', rueckgelesen: true }, m('tabletten-moersern')]);
    expect(z.fehlerAus).toContain('f-gemoersert');
  });
});
