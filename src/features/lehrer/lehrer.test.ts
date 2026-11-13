import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leseKernpunkte } from '../klasse/auswertung';
import { abgabeLink, abgabeText, entpacke, fallLink, findeRueckmeldung, leseAbgaben, leseFall, leseRueckmeldung, rueckmeldungCode, rueckmeldungLink } from '../klasse/kodierung';
import { abgabenZu, alleAbgaben, merkeRueckmeldung, nimmAbgabenAuf, rueckmeldungZu, speichereEigenen } from '../klasse/speicher';
import { klassenFassung, linkInhalt, loesungsFassung, maxPunkte, type Abgabe, type KlassenFall } from '../klasse/typen';
import { leseWahl, pruefeWahl, wahlAntwort, wahlText } from '../klasse/wahl';
import { ergebnis, leereBewertung, mitVorschlaegen, rueckmeldungAus, rueckmeldungText, vorschlag } from './bewertung';
import { noteFuer, ordneSchluessel, prozent, STANDARD_SCHLUESSEL } from './noten';
import {
  bewertungVon, datenbestand, klassen, klassenVonFall, loescheAllesLehrer, loescheFallKomplett, neueKlasse, notenschluessel,
  ordneAbgabeZu, ordneFallZu, speichereBewertung, speichereKlasse, speichereSchluessel,
} from './speicher';
import { nameSchluessel, type Bewertung } from './typen';
import { aufgabenStatistik, fristVorbei, klassenMatrix, matrixCsv, status } from './uebersicht';
import { kopiereFall } from './Aufgaben';

let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  });
});
afterEach(() => vi.unstubAllGlobals());

const fall: KlassenFall = {
  v: 1, id: 'fall0001', art: 'fallbeispiel', titel: 'Herr Weber, Pneumonie', situation: 'Herr Weber, 78 Jahre, Fieber 39,1 °C.',
  material: [], loesung: 'nach-abgabe', erstellt: '2026-11-01T08:00:00.000Z', frist: '2026-11-10', von: 'Herr Lang',
  aufgaben: [
    { id: 'a1', frage: 'Welche Risiken?', punkte: 4, erwartung: 'Sturz, Dehydratation', kernpunkte: leseKernpunkte('Sturzgefahr: sturz\nDehydratation: dehydr, exsikkose') },
    { id: 'a2', frage: 'Normaler Puls Erwachsener?', punkte: 2, typ: 'wahl', optionen: ['40–50', '60–100', '120–140'], richtig: [1] },
    { id: 'a3', frage: 'Pneumonieprophylaxe: was gehört dazu?', punkte: 3, typ: 'wahl', mehrfach: true, optionen: ['Atemübungen', 'Mobilisation', 'Flachlagerung', 'Mundpflege'], richtig: [0, 1, 3] },
  ],
};

const abgabe = (name: string, antworten: Record<string, string>, abgegeben = '2026-11-09T10:00:00.000Z'): Abgabe => ({ v: 1, fallId: fall.id, titel: fall.titel, name, antworten, abgegeben });

describe('Auswahlaufgaben', () => {
  it('liest und schreibt Buchstaben', () => {
    expect(leseWahl('C, a, z, A', 3)).toEqual([0, 2]);
    expect(wahlAntwort([2, 0, 2])).toBe('A, C');
    expect(wahlText(fall.aufgaben[1]!, 'B')).toBe('B) 60–100');
  });

  it('wertet eine und mehrere richtige Antworten aus', () => {
    expect(pruefeWahl(fall.aufgaben[1]!, 'B')).toEqual({ richtig: true, teil: 1 });
    expect(pruefeWahl(fall.aufgaben[1]!, 'A')).toEqual({ richtig: false, teil: 0 });
    expect(pruefeWahl(fall.aufgaben[2]!, 'A, B, D')).toEqual({ richtig: true, teil: 1 });
    expect(pruefeWahl(fall.aufgaben[2]!, 'A, B')!.teil).toBe(0.75);
    expect(pruefeWahl(fall.aufgaben[2]!, '')!.teil).toBe(0);
    expect(pruefeWahl(klassenFassung(fall).aufgaben[1]!, 'B')).toBeNull();
  });

  it('Klassenlink enthält Optionen und Punkte, aber nie die richtige Antwort', async () => {
    const code = new URLSearchParams((await fallLink(klassenFassung(fall), 'https://x/')).split('?')[1]).get('d')!;
    const roh = JSON.stringify(await entpacke(code));
    expect(roh).not.toMatch(/"richtig"|"erwartung"|"kernpunkte"/);
    expect(roh).toContain('60–100');
    const erhalten = await leseFall(code);
    expect(erhalten.aufgaben[1]).toMatchObject({ typ: 'wahl', optionen: ['40–50', '60–100', '120–140'], punkte: 2 });
    expect(erhalten.aufgaben[2]!.mehrfach).toBe(true);
    expect(linkInhalt(fall, 'klasse').ohne).toContain('richtige Antworten der Auswahlaufgaben');
    // Lösungslink trägt die richtige Antwort
    const loesung = await leseFall(new URLSearchParams((await fallLink(loesungsFassung(fall), 'https://x/')).split('?')[1]).get('d')!);
    expect(loesung.aufgaben[1]!.richtig).toEqual([1]);
  });

  it('prüft fremde Felder: unsinnige Indizes und Punkte fallen weg, alte Links bleiben Freitext', async () => {
    const kaputt = { ...fall, aufgaben: [{ id: 'x', frage: 'F', typ: 'wahl', optionen: ['a', 'b'], richtig: [5, -1, 1, 1], punkte: -3 }, { id: 'y', frage: 'G', typ: 'wahl', optionen: ['nur eine'] }] };
    const f = await leseFall('j' + btoa(unescape(encodeURIComponent(JSON.stringify(kaputt)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
    expect(f.aufgaben[0]).toMatchObject({ typ: 'wahl', richtig: [1] });
    expect(f.aufgaben[0]!.punkte).toBeUndefined();
    expect(f.aufgaben[1]!.typ).toBeUndefined();
  });

  it('Abgabe-Text zeigt die gewählte Antwort lesbar', async () => {
    const t = await abgabeText(fall, abgabe('Lea', { a2: 'B', a3: 'A, D' }));
    expect(t).toContain('B) 60–100');
    expect(t).toContain('A) Atemübungen\nD) Mundpflege');
  });
});

describe('Noten und Punkte', () => {
  it('Standardschlüssel und Grenzen', () => {
    expect(noteFuer(100)).toBe('1');
    expect(noteFuer(92)).toBe('1');
    expect(noteFuer(91.9)).toBe('2');
    expect(noteFuer(50)).toBe('4');
    expect(noteFuer(49.9)).toBe('5');
    expect(noteFuer(0)).toBe('6');
    expect(prozent(2, 3)).toBe(66.6); // nicht auf 66,7 aufrunden: sonst rutscht man über eine Grenze
  });

  it('eigener Schlüssel wird sortiert, die letzte Stufe beginnt bei 0', () => {
    const s = ordneSchluessel([{ note: 'bestanden', ab: 50 }, { note: 'nicht bestanden', ab: 20 }, { note: '', ab: 70 }]);
    expect(s).toEqual([{ note: 'bestanden', ab: 50 }, { note: 'nicht bestanden', ab: 0 }]);
    expect(noteFuer(10, s)).toBe('nicht bestanden');
    expect(ordneSchluessel([])).toEqual(STANDARD_SCHLUESSEL);
  });

  it('Vorschläge aus Kernpunkten und Auswahl, Ergebnis mit Note erst bei vollständiger Bewertung', () => {
    const a = abgabe('Lea', { a1: 'Sturzgefahr wegen Schwäche', a2: 'B', a3: 'A, B' });
    expect(vorschlag(fall.aufgaben[0]!, a.antworten.a1)).toEqual({ punkte: 2, grund: '1 von 2 Kernpunkten gefunden' });
    expect(vorschlag(fall.aufgaben[1]!, 'B')!.punkte).toBe(2);
    expect(vorschlag(fall.aufgaben[2]!, 'A, B')!.punkte).toBe(2.5); // 0,75 × 3 = 2,25 → halbe Punkte
    const leer = leereBewertung(fall, a);
    expect(ergebnis(fall, leer, STANDARD_SCHLUESSEL)).toMatchObject({ punkte: 0, max: 9, note: null, vollstaendig: false });
    const b = mitVorschlaegen(fall, a, leer);
    expect(b.punkte).toEqual({ a1: 2, a2: 2, a3: 2.5 });
    // Schon vergebene Punkte bleiben
    expect(mitVorschlaegen(fall, a, { ...leer, punkte: { a1: 4 } }).punkte.a1).toBe(4);
    const e = ergebnis(fall, { ...b, bewertet: 'x' }, STANDARD_SCHLUESSEL);
    expect(e).toMatchObject({ punkte: 6.5, max: 9, prozent: 72.2, note: '3', vollstaendig: true });
    // Zu viele Punkte zählen nur bis zur Höchstzahl
    expect(ergebnis(fall, { ...b, punkte: { a1: 10, a2: 2, a3: 3 } }, STANDARD_SCHLUESSEL).punkte).toBe(9);
    expect(maxPunkte(fall)).toBe(9);
  });
});

describe('Rückmeldung an Lernende', () => {
  const b: Bewertung = { fallId: fall.id, name: 'Lea K.', punkte: { a1: 3, a2: 2, a3: 1.5 }, kommentare: { a1: 'Gut erkannt, Dehydratation fehlt.' }, kommentar: 'Weiter so!', abgabeVom: '2026-11-09T10:00:00.000Z', bewertet: '2026-11-11T09:00:00.000Z' };

  it('enthält Punkte, Kommentare und auf Wunsch die Note, aber keine Lösung', async () => {
    const r = rueckmeldungAus(fall, b, STANDARD_SCHLUESSEL, true);
    expect(r).toMatchObject({ name: 'Lea K.', punkte: 6.5, max: 9, note: '3', kommentar: 'Weiter so!', von: 'Herr Lang' });
    expect(rueckmeldungAus(fall, b, STANDARD_SCHLUESSEL, false).note).toBeUndefined();
    const link = await rueckmeldungLink(r, 'https://x/');
    expect(link).toMatch(/^https:\/\/x\/#\/lernen\/klasse\/rueckmeldung\?d=z/);
    const roh = JSON.stringify(await entpacke(new URLSearchParams(link.split('?')[1]).get('d')!));
    expect(roh).not.toMatch(/Dehydratation"|"richtig"|"erwartung"|60–100/);
    expect(await leseRueckmeldung(new URLSearchParams(link.split('?')[1]).get('d')!)).toEqual(r);
    // Als Text mit Link oder als Code wiederfinden, auch umbrochen und zitiert
    expect((await findeRueckmeldung(rueckmeldungText(r, link)))!.punkte).toBe(6.5);
    const code = await rueckmeldungCode(r);
    expect((await findeRueckmeldung(`> ${code.slice(0, 20)}\n> ${code.slice(20)}`))!.name).toBe('Lea K.');
    expect(await findeRueckmeldung('Hallo, nichts drin')).toBeNull();
  });

  it('Lernende speichern die neueste Rückmeldung je Fall', () => {
    const r = rueckmeldungAus(fall, b, STANDARD_SCHLUESSEL, true);
    expect(merkeRueckmeldung(r)).toBe(true);
    expect(merkeRueckmeldung({ ...r, bewertet: '2026-11-01T00:00:00.000Z', punkte: 1 })).toBe(false);
    expect(rueckmeldungZu(fall.id)!.punkte).toBe(6.5);
  });

  it('lehnt Unsinn ab', async () => {
    await expect(leseRueckmeldung('zzz')).rejects.toThrow();
  });
});

describe('Abgabe per Link', () => {
  it('wird in eingefügtem Text gefunden wie ein Abgabe-Code', async () => {
    const a = abgabe('Tom', { a1: 'Sturz' });
    const link = await abgabeLink(a, 'https://x/');
    const { abgaben, fehler } = await leseAbgaben(`Hier mein Link: ${link}`);
    expect(fehler).toEqual([]);
    expect(abgaben.map((x) => x.name)).toEqual(['Tom']);
  });
});

describe('Klassen, Bewertungen, Übersicht', () => {
  const jetzt = new Date('2026-11-12T12:00:00');

  it('Status: offen, Frist vorbei, verspätet, bewertet, neue Abgabe seit Bewertung', () => {
    expect(fristVorbei('2026-11-10', new Date('2026-11-10T23:00:00'))).toBe(false);
    expect(status(fall, undefined, null, new Date('2026-11-09T12:00:00'))).toBe('offen');
    expect(status(fall, undefined, null, jetzt)).toBe('ueberfaellig');
    expect(status(fall, abgabe('A', {}), null, jetzt)).toBe('abgegeben');
    expect(status(fall, abgabe('A', {}, '2026-11-11T08:00:00'), null, jetzt)).toBe('verspaetet');
    const b = { ...leereBewertung(fall, abgabe('A', {})), bewertet: '2026-11-11T00:00:00Z' };
    expect(status(fall, abgabe('A', {}), b, jetzt)).toBe('bewertet');
    expect(status(fall, abgabe('A', {}, '2026-11-12T08:00:00.000Z'), b, jetzt)).toBe('neu');
  });

  it('Matrix: Liste plus fremde Namen, Durchschnitt, CSV', () => {
    speichereEigenen(fall);
    nimmAbgabenAuf([abgabe('lea k.', { a1: 'Sturz', a2: 'B', a3: 'A, B, D' }), abgabe('Gast', { a2: 'A' })]);
    const k = { ...neueKlasse('Kurs A'), lernende: ['Lea K.', 'Tom B.'], faelle: [fall.id] };
    speichereKlasse(k);
    speichereBewertung({ ...leereBewertung(fall, abgabe('lea k.', {})), punkte: { a1: 4, a2: 2, a3: 3 }, bewertet: '2026-11-11T09:00:00Z' });
    const m = klassenMatrix(klassen()[0]!, [fall], { abgaben: abgabenZu, bewertungen: (id) => (id === fall.id ? { [nameSchluessel('Lea K.')]: bewertungVon(fall.id, 'Lea K.')! } : {}), schluessel: STANDARD_SCHLUESSEL, jetzt });
    expect(m.zeilen.map((z) => [z.name, z.inListe, z.zellen[0]!.status])).toEqual([['Lea K.', true, 'bewertet'], ['Tom B.', true, 'ueberfaellig'], ['Gast', false, 'abgegeben']]);
    expect(m.zeilen[0]!.zellen[0]).toMatchObject({ prozent: 100, note: '1' });
    expect(m.spalten[0]).toMatchObject({ abgegeben: 2, bewertet: 1, schnitt: 100 });
    const csv = matrixCsv(m, (s) => s);
    expect(csv.startsWith('﻿"Name";"In Klassenliste"')).toBe(true);
    expect(csv).toContain('"Lea K.";"ja";"bewertet";"100";"1";"100"');
  });

  it('Statistik je Aufgabe: Schnitt, fehlende Kernpunkte, Auswahl-Verteilung', () => {
    const ab = [abgabe('A', { a1: 'Sturzgefahr', a2: 'B', a3: 'A' }), abgabe('B', { a1: 'Exsikkose und Sturz', a2: 'A', a3: 'A, B, D' }), abgabe('C', { a2: 'B' })];
    const s = aufgabenStatistik(fall, ab, {});
    expect(s[0]).toMatchObject({ quelle: 'vorschlag', leer: 1, fehlend: [{ text: 'Dehydratation', fehlt: 1 }] });
    expect(s[1]!.wahl!.map((w) => w.anzahl)).toEqual([1, 2, 0]);
    expect(s[1]!.schnitt).toBe(66.7);
  });

  it('Zuordnen überträgt Abgabe und Bewertung; Löschen räumt alles weg', () => {
    speichereEigenen(fall);
    nimmAbgabenAuf([abgabe('Lea', { a1: 'x' })]);
    speichereBewertung({ ...leereBewertung(fall, abgabe('Lea', {})), kommentar: 'k', bewertet: '2026-11-11T00:00:00Z' });
    const k = neueKlasse('Kurs');
    speichereKlasse(k);
    ordneFallZu(fall.id, k.id);
    expect(klassenVonFall(fall.id).map((x) => x.id)).toEqual([k.id]);
    expect(ordneAbgabeZu(fall.id, 'Lea', 'Lea K.')).toBe(true);
    expect(abgabenZu(fall.id).map((a) => a.name)).toEqual(['Lea K.']);
    expect(bewertungVon(fall.id, 'Lea K.')!.kommentar).toBe('k');
    expect(bewertungVon(fall.id, 'Lea')).toBeNull();
    expect(datenbestand()).toMatchObject({ klassen: 1, faelle: 1, abgaben: 1, bewertungen: 1 });
    loescheFallKomplett(fall.id);
    expect(datenbestand()).toMatchObject({ faelle: 0, abgaben: 0, bewertungen: 0 });
    expect(klassen()[0]!.faelle).toEqual([]);
    nimmAbgabenAuf([{ ...abgabe('X', {}), fallId: 'fremd' }]);
    loescheAllesLehrer();
    expect(Object.keys(alleAbgaben())).toEqual([]);
    expect(klassen()).toEqual([]);
  });

  it('Klassenliste: doppelte Namen fallen weg, Notenschlüssel speichern', () => {
    speichereKlasse({ ...neueKlasse('K'), lernende: ['Lea', ' lea ', 'Tom', ''] });
    expect(klassen()[0]!.lernende).toEqual(['Lea', 'Tom']);
    speichereSchluessel([{ note: 'gut', ab: 60 }, { note: 'schlecht', ab: 10 }]);
    expect(notenschluessel()).toEqual([{ note: 'gut', ab: 60 }, { note: 'schlecht', ab: 0 }]);
    speichereSchluessel(null);
    expect(notenschluessel()).toEqual(STANDARD_SCHLUESSEL);
  });

  it('Kopie bekommt eine neue Kennung und keine Frist', () => {
    const k = kopiereFall(fall);
    expect(k.id).not.toBe(fall.id);
    expect(k.frist).toBeUndefined();
    expect(k.titel).toBe('Herr Weber, Pneumonie (Kopie)');
  });
});

describe('Frist in Kalendertagen', () => {
  it('heute, morgen, gestern unabhängig von der Uhrzeit', async () => {
    const { fristTage } = await import('../klasse/Klassenmodus');
    expect(fristTage('2026-11-13', new Date('2026-11-13T07:00:00'))).toBe(0);
    expect(fristTage('2026-11-13', new Date('2026-11-13T23:30:00'))).toBe(0);
    expect(fristTage('2026-11-14', new Date('2026-11-13T23:30:00'))).toBe(1);
    expect(fristTage('2026-11-12', new Date('2026-11-13T00:10:00'))).toBe(-1);
  });
});

describe('Gleiche Person, andere Schreibweise', () => {
  it('neuere Abgabe ersetzt die ältere, egal in welcher Reihenfolge eingelesen', () => {
    nimmAbgabenAuf([abgabe('Lea K', { a1: 'neu' }, '2026-11-09T12:00:00.000Z')]);
    expect(nimmAbgabenAuf([abgabe('lea k.', { a1: 'alt' }, '2026-11-09T08:00:00.000Z')])).toMatchObject({ neu: 0, doppelt: 1 });
    expect(abgabenZu(fall.id).map((a) => a.antworten.a1)).toEqual(['neu']);
  });
});
