// Runde 2, Paket P14a: Klinik-, Schockraum- und Heimfall mit Messenger, Rückfragen, Rückaufträgen, Gesprächspartnern und Akte.
// Allgemeine Prüfungen (Musterweg ≥ 90 %, Unterlassung, Grenzweg, Replay) laufen für alle Fälle in kern.test.ts und auswertung.test.ts.
import { describe, expect, it } from 'vitest';
import { partner } from '../../arbeitsplatz/gespraeche';
import { gilt, sende, start, type SimZustand } from '../kern';
import { arztKanaele } from '../kommunikation';
import type { SimEventEingabe } from '../typen';
import { KH_PNEUMONIE_SEPSIS as KH } from './kh-pneumonie-sepsis';
import { LZ_DEMENZ_SCHMERZ as LZ } from './lz-demenz-schmerz';
import { SR_SEPTISCHER_SCHOCK as SR } from './sr-septischer-schock';

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
const m = (id: string): SimEventEingabe => ({ art: 'massnahme', id });
const warte = (sek: number): SimEventEingabe => ({ art: 'warten', sek });
/** Spielzeit bis t laufen lassen (Entscheidungen unterbrechen ein „warten“). */
function bis(z: SimZustand, t: number): SimZustand {
  while (z.t < t && !z.ende) z = gut(sende(z, { art: 'warten', sek: Math.min(60, t - z.t) }));
  return z;
}
const letzteArzt = (z: SimZustand) => z.meldungen.filter((x) => x.art === 'arzt').at(-1)?.text ?? '';
const nachrichtArzt = (kanal: 'telefon' | 'messenger', bausteine: string[]): SimEventEingabe => ({ art: 'nachricht', an: 'aerztin', kanal, bausteine });

describe('P14a Krankenhaus (Frau Albrecht)', () => {
  const ohneRr: SimEventEingabe[] = [m('ansprechen-orientierung'), m('af-zaehlen'),
    { art: 'anruf', an: 'aerztin', sbar: ['s-verschlechtert', 'a-af-hoch', 'a-verwirrt-neu'] }];
  it('ohne Blutdruck fragt die Ärztin zurück; „melde mich“ legt den Rückauftrag an, die Rückmeldung bringt die Sepsis-Anordnungen', () => {
    let z = spiele(start(KH, 2, 2), ohneRr);
    expect(letzteArzt(z)).toMatch(/Wie ist der Blutdruck/);
    expect(z.flags).not.toContain('arzt-kommt');
    z = spiele(z, [nachrichtArzt('telefon', ['zusage:melde-mich'])]);
    expect(gilt(z, { auftrag: 'af-rr', status: 'offen' })).toBe(true);
    z = spiele(z, [m('rr-messen'), nachrichtArzt('messenger', ['wert:rrSys']), warte(120)]);
    expect(z.flags).toContain('arzt-kommt');
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-o2', 'an-infusion']));
    expect(gilt(z, { auftrag: 'af-rr-kontrolle', status: 'offen' })).toBe(true);
  });
  it('nach dem ersten Kontakt gibt es den Klinik-Messenger', () => {
    expect(arztKanaele(start(KH, 2, 2))).toEqual(['telefon']);
    expect(arztKanaele(spiele(start(KH, 2, 2), ohneRr))).toEqual(['telefon', 'messenger']);
  });
  it('RR-Kontrolle nicht gemeldet: Rückauftrag verspätet, Fehler und PA-Erinnerung', () => {
    const z = spiele(start(KH, 2, 2), [m('af-zaehlen'), m('rr-messen'), m('ansprechen-orientierung'),
      { art: 'anruf', an: 'aerztin', sbar: ['a-af-hoch', 'a-rr-niedrig', 'a-verwirrt-neu'] }, warte(1300)]);
    expect(z.fehlerAus).toContain('auftrag-verspaetet:af-rr-kontrolle');
  });
  it('Tochter: Auskunft ohne Blick in den Aufnahmebogen verletzt die Schweigepflicht, danach nicht', () => {
    expect(spiele(start(KH, 2, 2), [{ art: 'frage', id: 'g-tochter-lage' }]).fehlerAus).toContain('schweigepflicht:g-tochter-lage');
    expect(spiele(start(KH, 2, 2), [m('kurve-lesen'), { art: 'frage', id: 'g-tochter-lage' }]).fehlerAus).toEqual([]);
  });
  it('Paracetamol aus dem Bedarfsplan zu früh (zuletzt 11:30): Abstandsfehler', () => {
    expect(spiele(start(KH, 2, 2), [m('paracetamol-geben')]).fehlerAus).toContain('med-abstand:mp-paracetamol');
  });
  it('Gesprächspartner: Tochter, Kollege und IMC (Übergabe mit Bausteinen)', () => {
    const p = partner(start(KH, 2, 2));
    expect(p.map((x) => x.id)).toEqual(expect.arrayContaining(['aerztin', 'patient', 'angehoerige', 'kollegin', 'aufnehmende-station']));
    expect(p.find((x) => x.id === 'aufnehmende-station')!.bausteine).toBe(true);
  });
});

describe('P14a Schockraum (Herr Kranz)', () => {
  it('Transportmonitor: Puls und Sättigung sind ab Beginn sichtbar, Blutdruck erst am Schockraum-Monitor', () => {
    const z = start(SR, 3, 2);
    expect(z.sichtbar).toEqual(['hf', 'spo2']);
    expect(spiele(z, [m('monitor-anlegen')]).sichtbar).toEqual(expect.arrayContaining(['rrSys', 'map', 'af']));
  });
  it('nur „Blutdruck niedrig“: Ärztin fragt nach qSOFA; mit Sepsis-Verdacht nennt sie Anordnungen und den Laktat-Auftrag', () => {
    let z = spiele(start(SR, 3, 2), [m('monitor-anlegen'), m('qsofa-erheben'), m('uebergabe-rd-annehmen'), { art: 'anruf', an: 'aerztin', sbar: ['a-hypotonie'] }]);
    expect(letzteArzt(z)).toMatch(/qSOFA/);
    z = spiele(z, [nachrichtArzt('telefon', ['s-sepsis-verdacht', 'b-penicillin-allergie'])]);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-bk', 'an-ringer', 'an-meropenem']));
    expect(z.angeboten).not.toContain('an-piptaz');
    expect(gilt(z, { auftrag: 'af-laktat', status: 'offen' })).toBe(true);
  });
  it('Laktat-Rückmeldung mit MAP nach Volumen: Schock-Anordnungen und Rückauftrag MAP nach Nullabgleich', () => {
    const z = spiele(start(SR, 3, 2), [m('uebergabe-rd-annehmen'), m('monitor-anlegen'), m('qsofa-erheben'),
      { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'b-penicillin-allergie', 'a-hypotonie'] },
      { art: 'rueckmelden', anordnung: 'an-ringer', rueckgelesen: true }, { art: 'rueckmelden', anordnung: 'an-bga', rueckgelesen: true },
      { art: 'anleitung-anfordern', massnahme: 'infusion-anhaengen' }, m('infusion-anhaengen'), m('bga-venoes-abnehmen'), m('bga-messen-lesen'),
      nachrichtArzt('telefon', ['wert:laktat', 'a-map-nach-volumen'])]);
    expect(gilt(z, { auftrag: 'af-laktat', status: 'gemeldet' })).toBe(true);
    expect(z.flags).toContain('schock-gemeldet');
    expect(gilt(z, { auftrag: 'af-map', status: 'offen' })).toBe(true);
  });
  it('Sohn informieren, bevor die Vollmacht bekannt ist: Schweigepflicht; nach der RD-Übergabe erlaubt', () => {
    expect(spiele(start(SR, 3, 2), [{ art: 'frage', id: 'g-sohn-info' }]).fehlerAus).toContain('schweigepflicht:g-sohn-info');
    const z = spiele(start(SR, 3, 2), [m('uebergabe-rd-annehmen'), { art: 'frage', id: 'g-sohn-info' }]);
    expect(z.fehlerAus).toEqual([]);
    expect(z.flags).toContain('sohn-informiert');
  });
  it('Paracetamol i. v. nach „Fieber“-Meldung: Heim hat um 21 Uhr gegeben → Abstandsfehler', () => {
    const z = spiele(start(SR, 'pflegefachperson', 2), [{ art: 'anruf', an: 'aerztin', sbar: ['s-fieber'] },
      { art: 'rueckmelden', anordnung: 'an-paracetamol', rueckgelesen: true }, m('paracetamol-iv')]);
    expect(z.fehlerAus).toEqual(expect.arrayContaining(['med-abstand:mp-paracetamol']));
  });
  it('Gesprächspartner: Rettungsdienst, Sohn, Intensivstation', () => {
    expect(partner(start(SR, 3, 2)).map((x) => x.id)).toEqual(expect.arrayContaining(['rettungsdienst', 'angehoerige', 'aufnehmende-station']));
  });
});

describe('P14a Langzeit (Frau Brückner)', () => {
  const befunde: SimEventEingabe[] = [m('schmerz-besd'), m('schleimhaut-pruefen'), m('kurve-lesen')];
  it('ohne Temperatur fragt der Hausarzt nach Fieber; nach der Rückmeldung kommen Anordnungen und der BESD-Auftrag', () => {
    let z = spiele(start(LZ, 2, 2), [...befunde, { art: 'anruf', an: 'aerztin', sbar: ['a-besd', 'a-druckstelle', 'a-nachts'] }]);
    expect(letzteArzt(z)).toMatch(/Hat sie Fieber/);
    expect(z.angeboten).toEqual([]);
    z = spiele(z, [nachrichtArzt('telefon', ['zusage:melde-mich']), { art: 'pflegetasche', geraet: 'thermometer' }, m('temperatur-ohr'),
      nachrichtArzt('messenger', ['wert:temp']), warte(120)]);
    expect(gilt(z, { auftrag: 'af-temp', status: 'gemeldet' })).toBe(true);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-schmerz', 'an-trinken', 'an-gitter']));
    expect(gilt(z, { auftrag: 'af-besd', status: 'offen' })).toBe(true);
  });
  it('Enkel am Telefon: Auskunft verletzt die Schweigepflicht, Verweisen an die Betreuerin nicht', () => {
    const z = bis(start(LZ, 2, 2), 1500);
    expect(spiele(z, [{ art: 'frage', id: 'g-enkel-auskunft' }]).fehlerAus).toContain('schweigepflicht:g-enkel-auskunft');
    expect(spiele(z, [{ art: 'frage', id: 'g-enkel-verweisen' }]).fehlerAus.filter((f) => f.startsWith('schweigepflicht'))).toEqual([]);
  });
  it('Betreuerin, Wohnbereichsleitung und Enkel sind Gesprächspartner; der Enkel erst, wenn er anruft', () => {
    const p0 = partner(start(LZ, 2, 2));
    expect(p0.map((x) => x.id)).toEqual(expect.arrayContaining(['betreuer', 'kollegin', 'angehoerige']));
    expect(p0.find((x) => x.id === 'angehoerige')!.fragen).toEqual([]);
  });
  it('BESD-Kontrolle nach dem Schmerzmittel: Rückmeldung mit gelindertem Schmerz', () => {
    const muster = LZ.pruefwege.muster.filter((e) => e.art !== 'abschluss');
    const z = spiele(start(LZ, 2, 2), muster);
    expect(gilt(z, { auftrag: 'af-besd', status: 'gemeldet' })).toBe(true);
    expect(z.flags).toContain('besd-rueckmeldung');
    expect(z.grund.schmerz).toBeLessThan(3);
  });
});
