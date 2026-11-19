// Fallwelle P17a (CE 01–03, Einstiegsfälle 1. Drittel). Allgemeine Prüfungen (Musterweg ≥ 90 % in Rolle 2, Unterlassung,
// Grenzweg, Replay) laufen für alle Fälle in kern.test.ts und auswertung.test.ts; hier: 1. Drittel und Fallbesonderheiten.
import { describe, expect, it } from 'vitest';
import { partner } from '../../arbeitsplatz/gespraeche';
import { bewerte } from '../auswertung';
import { gilt, sende, start, type SimZustand } from '../kern';
import type { FallV2, SimEventEingabe } from '../typen';
import { KH_ERSTER_TAG as TAG } from './kh-erster-tag';
import { KH_HARNVERHALT_POSTOP as HV } from './kh-harnverhalt-postop';
import { KH_REHA_ERSTER_WEG as REHA } from './kh-reha-erster-weg';
import { LZ_DEKUBITUS_IMMOBIL as DK } from './lz-dekubitus-immobil';
import { LZ_KOERPERPFLEGE_ABGELEHNT as KP } from './lz-koerperpflege-abgelehnt';

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
const letzteArzt = (z: SimZustand) => z.meldungen.filter((x) => x.art === 'arzt').at(-1)?.text ?? '';
const bis = (z: SimZustand, t: number) => { while (z.t < t && !z.ende) z = gut(sende(z, { art: 'warten', sek: Math.min(60, t - z.t) })); return z; };

/** Musterweg im 1. Drittel: ≥ 90 % in allen Bereichen, keine Grenzüberschreitung. */
function erstesDrittel(fall: FallV2) {
  const z = spiele(start(fall, 1, 2), fall.pruefwege.muster);
  const a = bewerte(z);
  expect(z.fehlerAus).toEqual([]);
  expect(z.log.some((e) => e.art === 'grenzueberschreitung')).toBe(false);
  for (const b of a.kb) if (b.prozent !== null) expect(b.prozent, b.id).toBeGreaterThanOrEqual(90);
  expect(a.ergebnis.stufe).toBe('stabil');
}

describe('P17a CE 01 Erster Tag (Frau Hoffmann)', () => {
  it('Musterweg auch im 1. Drittel ≥ 90 %', () => erstesDrittel(TAG));
  it('Messen ohne Händedesinfektion: Fehler; mit Desinfektion vorher nicht', () => {
    expect(spiele(start(TAG, 1, 2), [m('rr-messen')]).fehlerAus).toContain('f-haende-vergessen');
    expect(spiele(start(TAG, 1, 2), [m('haendedesinfektion'), m('rr-messen'), m('haendedesinfektion')]).fehlerAus).toEqual([]);
  });
  it('Schwindel und Blutdruck ohne Trinkmenge: Ärztin fragt zurück; Rückmeldung bringt Anordnungen und Kontrollauftrag', () => {
    let z = spiele(start(TAG, 1, 2), [m('haendedesinfektion'), m('rr-messen'), { art: 'warten', sek: 200 },
      { art: 'anruf', an: 'aerztin', sbar: ['s-schwindel', 'a-rr-niedriger'] }]);
    expect(letzteArzt(z)).toMatch(/Wie viel hat sie/);
    z = spiele(z, [{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['zusage:melde-mich'] }, m('trinkmenge-erfragen'),
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-trinkt-wenig'] }, { art: 'warten', sek: 120 }]);
    expect(z.flags).toContain('arzt-informiert');
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-ramipril-pause', 'an-infusion']));
    expect(gilt(z, { auftrag: 'af-rr-kontrolle', status: 'offen' })).toBe(true);
  });
  it('Ramipril ohne Rücksprache: Fehler', () => {
    expect(spiele(start(TAG, 2, 2), [m('haendedesinfektion'), m('tabletten-wie-geplant-geben')]).fehlerAus).toContain('f-ramipril');
  });
  it('Paracetamol aus dem Bedarfsplan (zuletzt 02:30): Abstandsfehler', () => {
    expect(spiele(start(TAG, 2, 2), [m('bedarfsmedikation-oral')]).fehlerAus).toContain('med-abstand:mp-paracetamol');
  });
  it('Nachbarin am Telefon: Auskunft verletzt die Schweigepflicht, Verweisen nicht', () => {
    const z = bis(start(TAG, 1, 2), 430);
    expect(spiele(z, [{ art: 'frage', id: 'g-nachbarin-auskunft' }]).fehlerAus).toContain('schweigepflicht:g-nachbarin-auskunft');
    const v = spiele(z, [{ art: 'frage', id: 'g-nachbarin-verweisen' }, { art: 'frage', id: 'g-rueckruf' }]);
    expect(v.fehlerAus).toEqual([]);
    expect(v.flags).toContain('rueckruf-geklaert');
  });
  it('1. Drittel: Infusion hängt Jana an, die Volumenwirkung kommt an', () => {
    const muster = TAG.pruefwege.muster.filter((e) => e.art !== 'abschluss');
    const z = spiele(start(TAG, 1, 2), muster);
    expect(z.flags).toContain('infusion-durch-jana');
    expect(z.getan['infusion-anhaengen']).toBeUndefined();
    expect(z.grund.volumen).toBeGreaterThan(0.85);
  });
  it('Gesprächspartner: Patientin, Kollegin, Nachbarin', () => {
    expect(partner(start(TAG, 1, 2)).map((x) => x.id)).toEqual(expect.arrayContaining(['patient', 'kollegin', 'angehoerige', 'aerztin']));
  });
});

describe('P17a CE 03 Körperpflege abgelehnt (Herr Schäfer)', () => {
  it('Musterweg auch im 1. Drittel ≥ 90 %', () => erstesDrittel(KP));
  it('Waschen erst nach Aushandeln; ohne Grund bleibt das Einverständnis aus', () => {
    const ohne = spiele(start(KP, 1, 2), [m('vorstellen-einverstaendnis'), m('wuensche-aushandeln'), { art: 'frage', id: 'g-einverstanden' }, m('koerperpflege')]);
    expect(ohne.flags).not.toContain('einverstanden-pflege');
    expect(ohne.getan['koerperpflege']).toBeUndefined();
    const mit = spiele(start(KP, 1, 2), [m('vorstellen-einverstaendnis'), { art: 'frage', id: 'g-was-stoert' }, m('wuensche-aushandeln'), { art: 'frage', id: 'g-einverstanden' }]);
    expect(mit.flags).toContain('einverstanden-pflege');
  });
  it('Trotzdem waschen: schwerer Fehler, Angst und Unruhe steigen', () => {
    const z = spiele(start(KP, 1, 2), [m('koerperpflege-trotzdem'), { art: 'warten', sek: 60 }]);
    expect(z.fehlerAus).toContain('f-gegen-willen');
    expect(z.grund.angst).toBeGreaterThan(0.7);
  });
  it('Meldung ohne Urinstix: Hausarzt fragt zurück; nach dem Stix ordnet er den Dauerkatheter an, Remonstration zieht ihn zurück', () => {
    let z = spiele(start(KP, 2, 2), [m('vorstellen-einverstaendnis'), { art: 'frage', id: 'g-was-stoert' }, m('wuensche-aushandeln'), { art: 'frage', id: 'g-einverstanden' },
      { art: 'pflegetasche', geraet: 'thermometer' }, m('temperatur-ohr'), { art: 'anruf', an: 'aerztin', sbar: ['s-inkontinenz-neu', 'wert:temp'] }]);
    expect(letzteArzt(z)).toMatch(/Urinstix/);
    z = spiele(z, [{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['zusage:melde-mich'] }, m('inkontinenz-versorgen'),
      { art: 'pflegetasche', geraet: 'urinstix' }, m('urinstix'), { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-urinstix'] }, { art: 'warten', sek: 120 }]);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-trinken', 'an-dk']));
    z = spiele(z, [{ art: 'remonstrieren', anordnung: 'an-dk' }]);
    expect(z.angeboten).not.toContain('an-dk');
    expect(z.flags).toContain('remonstriert:an-dk');
  });
  it('Tochter: Auskunft ohne Blick in die Akte verletzt die Schweigepflicht, danach nicht', () => {
    const z = bis(start(KP, 1, 2), 610);
    expect(spiele(z, [{ art: 'frage', id: 'g-tochter' }]).fehlerAus).toContain('schweigepflicht:g-tochter');
    expect(spiele(z, [m('kurve-lesen'), { art: 'frage', id: 'g-tochter' }]).fehlerAus).toEqual([]);
  });
});

describe('P17a CE 02 Erster Weg zum Bad (Herr Brenner, Hüft-TEP)', () => {
  it('Musterweg auch im 1. Drittel ≥ 90 %', () => erstesDrittel(REHA));
  it('„Gehen Sie schon mal vor“: Sturz im Bad, schwerer Fehler', () => {
    const z = bis(start(REHA, 2, 2), 140);
    const ev = REHA.ereignisse.find((e) => e.id === 'e-dringend')!;
    let y = sende(z, { art: 'warten', sek: 30 });
    expect(y.offeneEntscheidung).toBe(ev.id);
    y = sende(y, { art: 'entscheidung', ereignis: ev.id, wahl: 'w-allein' });
    expect(y.fehlerAus).toContain('f-allein');
  });
  it('Kollaps ohne Hb: Arzt fragt nach dem Hb; mit Hb ordnet er Infusion und Novaminsulfon an', () => {
    let z = spiele(start(REHA, 2, 2), [m('haendedesinfektion'), m('rr-messen'), m('umgebung-sichern'), m('bettkante-sitzen'), m('gehen-begleiten'),
      { art: 'anruf', an: 'aerztin', sbar: ['s-kollaps', 'a-rr-puls'] }]);
    expect(letzteArzt(z)).toMatch(/Hb heute früh/);
    z = spiele(z, [{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['zusage:melde-mich'] }, m('kurve-lesen'),
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-hb'] }, { art: 'warten', sek: 120 }]);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-infusion', 'an-novamin']));
  });
  it('Novaminsulfon trotz Allergie gegeben: schwerer Fehler; Remonstration zieht die Anordnung zurück', () => {
    const vorher = spiele(start(REHA, 2, 2), [m('haendedesinfektion'), m('rr-messen'), m('kurve-lesen'), m('umgebung-sichern'), m('bettkante-sitzen'), m('gehen-begleiten'),
      { art: 'anruf', an: 'aerztin', sbar: ['s-kollaps', 'a-rr-puls', 'a-hb'] }]);
    const gegeben = spiele(vorher, [{ art: 'rueckmelden', anordnung: 'an-novamin', rueckgelesen: true }, m('metamizol-oral')]);
    expect(gegeben.fehlerAus).toContain('f-metamizol');
    const remonstriert = spiele(vorher, [{ art: 'remonstrieren', anordnung: 'an-novamin' }]);
    expect(remonstriert.angeboten).not.toContain('an-novamin');
  });
});

describe('P17a CE 02 Dekubitusgefahr (Frau Berger, G3)', () => {
  it('Musterweg auch im 1. Drittel ≥ 90 %', () => erstesDrittel(DK));
  it('Ohne Entlastung: Kategorie 1 nach gut 25 Minuten, Fingertest bleibt rot', () => {
    const z = bis(start(DK, 2, 2), 1700);
    expect(z.grund.dekubitusKat).toBe(1);
    expect(z.fehlerAus).toContain('f-kategorie1');
    const h = spiele(z, [m('haut-beobachten')]);
    expect(h.meldungen.filter((x) => x.art === 'befund').at(-1)?.text).toMatch(/rot bleibt/);
  });
  it('Positionieren setzt die Druckbelastung zurück, Rötung blasst ab', () => {
    const z = spiele(start(DK, 2, 2), [{ art: 'frage', id: 'g-ankuendigen' }, m('positionieren-druckentlastung'), { art: 'warten', sek: 60 }]);
    expect(z.grund.druckLast!).toBeLessThan(3);
    expect(bis(z, 1800).grund.dekubitusKat).toBe(0);
  });
  it('Entlastet, aber ohne Rückmeldung: Fall endet nach dem Vormittag stabil, nicht verschlechtert', () => {
    const z = bis(spiele(start(DK, 2, 2), [{ art: 'frage', id: 'g-ankuendigen' }, m('positionieren-druckentlastung')]), 2500);
    expect(z.grund.dekubitusKat).toBe(0);
    expect(z.ende?.ausgang).toBe('stabil');
  });
  it('Paracetamol nur einmal im Fall', () => {
    const z = spiele(start(DK, 2, 2), [m('schmerz-besd'), m('kurve-lesen'), { art: 'anruf', an: 'aerztin', sbar: ['s-schmerz-lagern', 'a-besd', 'a-trinkt-wenig'] },
      { art: 'rueckmelden', anordnung: 'an-paracetamol', rueckgelesen: true }, { art: 'auflegen', an: 'aerztin' }, m('bedarfsmedikation-oral'), m('bedarfsmedikation-oral')]);
    expect(z.treiber.filter((t) => t.art === 'wirkstoff').length).toBe(1);
    expect(z.meldungen.at(-1)?.text).toMatch(/noch nicht/);
  });
  it('Lagern ohne Ankündigung: Fehler; Franzbranntwein: Fehler', () => {
    expect(spiele(start(DK, 2, 2), [m('positionieren-druckentlastung')]).fehlerAus).toContain('f-ohne-ankuendigen');
    expect(spiele(start(DK, 2, 2), [m('franzbranntwein-einreiben')]).fehlerAus).toContain('f-franzbranntwein');
  });
  it('Meldung ohne Trinkmenge: Hausärztin fragt zurück; Rückmeldung bringt Paracetamol und BESD-Auftrag', () => {
    let z = spiele(start(DK, 2, 2), [m('schmerz-besd'), { art: 'anruf', an: 'aerztin', sbar: ['s-schmerz-lagern', 'a-besd'] }]);
    expect(letzteArzt(z)).toMatch(/Wie viel trinkt sie/);
    z = spiele(z, [{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['zusage:melde-mich'] }, m('kurve-lesen'),
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-trinkt-wenig'] }, { art: 'warten', sek: 120 }]);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-paracetamol', 'an-trinken']));
    expect(gilt(z, { auftrag: 'af-besd', status: 'offen' })).toBe(true);
  });
  it('BESD als Wert-Baustein für die Rückmeldung', () => {
    const z = spiele(start(DK, 2, 2), [m('schmerz-besd')]);
    expect(z.meldungen.some((x) => x.werte?.besd !== undefined)).toBe(true);
  });
});

describe('P17a CE 02 Harnverhalt nach der OP (Herr Kraus, G2)', () => {
  it('Musterweg auch im 1. Drittel ≥ 90 %', () => erstesDrittel(HV));
  it('Blase füllt sich weiter, Schmerz steigt; Katheter entleert und entlastet', () => {
    const ohne = bis(start(HV, 2, 2), 1200);
    expect(ohne.grund.blaseMl!).toBeGreaterThan(630);
    expect(ohne.grund.schmerz).toBeGreaterThan(4.8);
    const muster = HV.pruefwege.muster.filter((e) => e.art !== 'abschluss');
    const mit = spiele(start(HV, 2, 2), muster);
    expect(mit.grund.blaseMl!).toBeLessThan(150);
    expect(mit.grund.schmerz).toBeLessThan(3);
  });
  it('Meldung ohne Blasenscan: Arzt fragt zurück; nach dem Scan ordnet er den Einmalkatheter an', () => {
    let z = spiele(start(HV, 2, 2), [m('kurve-lesen'), { art: 'anruf', an: 'aerztin', sbar: ['s-kein-urin', 'b-prostata'] }]);
    expect(letzteArzt(z)).toMatch(/Wie voll ist die Blase/);
    z = spiele(z, [{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['zusage:melde-mich'] }, m('blasenscan'),
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-blasenscan'] }]);
    z = bis(z, z.t + 120);
    expect(z.angeboten).toEqual(expect.arrayContaining(['an-einmalkatheter', 'an-bilanz']));
  });
  it('Katheter im 1. Drittel: selbst gesperrt, Assistenz nach Anordnung möglich', () => {
    const z = spiele(start(HV, 1, 2), [m('blasenscan'), { art: 'anruf', an: 'aerztin', sbar: ['s-kein-urin', 'a-blasenscan'] },
      { art: 'rueckmelden', anordnung: 'an-einmalkatheter', rueckgelesen: true }, { art: 'auflegen', an: 'aerztin' }]);
    expect(spiele(z, [m('einmalkatheter')]).flags).not.toContain('katheterisiert');
    expect(spiele(z, [m('katheter-assistieren')]).flags).toContain('katheterisiert');
  });
  it('„Er ist halt inkontinent“: nur Vorlage ist ein schwerer Fehler', () => {
    const z = bis(start(HV, 2, 2), 290);
    let y = sende(z, { art: 'warten', sek: 30 });
    expect(y.offeneEntscheidung).toBe('e-vorlage');
    y = sende(y, { art: 'entscheidung', ereignis: 'e-vorlage', wahl: 'w-nur-vorlage' });
    expect(y.fehlerAus).toContain('f-nur-vorlage');
    expect(bis(spiele(start(HV, 2, 2), [m('vorlage-anlegen')]), 950).fehlerAus).toContain('f-nur-vorlage');
  });
  it('Vorlage zum Schutz und danach Blasenscan: kein Fehler', () => {
    const z = bis(spiele(start(HV, 2, 2), [m('blase-tasten'), m('vorlage-anlegen'), m('blasenscan')]), 950);
    expect(z.fehlerAus).not.toContain('f-nur-vorlage');
  });
  it('Scan-Wert und BESD stehen als Doku-Bausteine bereit', () => {
    const hv = spiele(start(HV, 2, 2), [m('blasenscan'), { art: 'dokumentieren', bausteine: ['wert:blaseMl'] }]);
    expect(hv.meldungen.filter((x) => x.art === 'doku').at(-1)?.text).toMatch(/Blasenfüllung \d+ ml/);
    const dk = spiele(start(DK, 2, 2), [m('schmerz-besd'), { art: 'dokumentieren', bausteine: ['wert:besd'] }]);
    expect(dk.meldungen.filter((x) => x.art === 'doku').at(-1)?.text).toMatch(/BESD \d+\/10/);
  });
  it('Blasenscan als Wert-Baustein', () => {
    const z = spiele(start(HV, 2, 2), [m('blasenscan')]);
    expect(z.meldungen.some((x) => x.werte?.blaseMl !== undefined)).toBe(true);
  });
});
