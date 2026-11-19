// Praxissimulator neu – zentraler Handlungskatalog (Paket P3), Stand 18.11.2026.
// Alle 6 Pflege-Reiter, Spur A (Generalistik) und Spur B (Akut/Notfall/Intensiv). Ein Fall bietet nur eine Auswahl an
// (FallV2.massnahmen) und kann Maßnahmen überschreiben (massnahmenZusatz, befugnisUeberschreibung).
//
// Befugnis-Grundwerte: je Drittel mit dem BW-Landeslehrplan 3BFP belegt (E4), siehe lehrplan-belege.ts.
// NACHWEIS[id] hält die Fundstellen; befugnisBeleg wird daraus gefüllt. Ohne Fundstelle bleibt befugnisBeleg leer und
// der Wert ist ein Grundwert aus KONZEPT.md 6.1 („nicht belegt“). Einrichtungen stellen über einrichtung.ts um.
// Lesbare Übersicht für Philipp: Projektordner praxissimulator-neu/BEFUGNIS-MATRIX.md (erzeugt aus matrix.ts).
//
// Regeln
// - Medikamente, Infusionen, O₂, Wundtherapie, Katheter, freiheitsentziehende Maßnahmen: anordnungspflichtig.
// - Ärztliche Handlungen (Intubation, ZVK, Zugang legen …) bleiben in beiden Spuren 'nur-aerztlich'; die Pflege
//   bereitet vor, assistiert und überwacht (eigene Maßnahmen).
// - Wirkkurven sind Lernmodell-Werte für die Grundgrößen (typen.ts). Fallspezifische Arzneiwirkungen gehören in den Fall.
// - Geräte mit `geraet` muss man im Heim und ambulant erst aus der Pflegetasche holen (E9), siehe PFLEGETASCHE.

import { alsQuelle, nachweis as nw, NICHT_BELEGT, type Nachweis } from './lehrplan-belege';
import { SPUR_B_LISTE, SPUR_B_NACHWEIS } from './spur-b/katalog';
import type { BefugnisLevel, KB, MassnahmeDefinition, Quelle, Reiter, Rolle } from './typen';

/** Befugnis kurz: 1., 2., 3. Drittel, Pflegefachperson */
export function befugnis(d1: BefugnisLevel, d2: BefugnisLevel = d1, d3: BefugnisLevel = d2, pfp: BefugnisLevel = d3): Record<Rolle, BefugnisLevel> {
  return { 1: d1, 2: d2, 3: d3, pflegefachperson: pfp };
}

const SELBST = befugnis('selbst');
const S = 'selbst', A = 'mit-anleitung', X = 'nur-aerztlich', G = 'gesperrt';
const NUR_AERZTLICH = befugnis(X);

/** Geräte, die im Heim und ambulant in der Pflegetasche stecken (E9). */
export const PFLEGETASCHE = ['rr-geraet', 'pulsoxy', 'thermometer', 'bz-geraet', 'stethoskop', 'urinstix'] as const;

/* ───────────────────────── Quellen ───────────────────────── */

const Q = {
  sturz: { id: 'dnqp-sturz', titel: 'DNQP Expertenstandard Sturzprophylaxe in der Pflege' },
  dekubitus: { id: 'dnqp-dekubitus', titel: 'DNQP Expertenstandard Dekubitusprophylaxe in der Pflege' },
  schmerz: { id: 'dnqp-schmerz', titel: 'DNQP Expertenstandard Schmerzmanagement in der Pflege' },
  mobilitaet: { id: 'dnqp-mobilitaet', titel: 'DNQP Expertenstandard Erhaltung und Förderung der Mobilität' },
  ernaehrung: { id: 'dnqp-ernaehrung', titel: 'DNQP Expertenstandard Ernährungsmanagement' },
  kontinenz: { id: 'dnqp-kontinenz', titel: 'DNQP Expertenstandard Kontinenzförderung in der Pflege (2024)' },
  wunden: { id: 'dnqp-wunden', titel: 'DNQP Expertenstandard Pflege von Menschen mit chronischen Wunden' },
  demenz: { id: 'dnqp-demenz', titel: 'DNQP Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz' },
  erc: { id: 'erc-2025', titel: 'ERC Leitlinien Reanimation 2025' },
  krinko: { id: 'krinko', titel: 'KRINKO-Empfehlungen (RKI)' },
  news2: { id: 'news2', titel: 'Royal College of Physicians: NEWS2 (2017)' },
  at4: { id: '4at', titel: '4AT Delir-Screening (Originalquelle)' },
  besd: { id: 'besd', titel: 'BESD – Beurteilung von Schmerzen bei Demenz' },
  gcs: { id: 'gcs', titel: 'Glasgow Coma Scale' },
  pflbg: { id: 'pflbg', titel: 'Pflegeberufegesetz (PflBG) § 4 vorbehaltene Tätigkeiten' },
  bgb1831: { id: 'bgb-1831', titel: 'BGB § 1831 Freiheitsentziehende Unterbringung und Maßnahmen' },
  mts: { id: 'mts', titel: 'Manchester-Triage-System' },
  rass: { id: 'rass', titel: 'Richmond Agitation-Sedation Scale (RASS)' },
  camicu: { id: 'cam-icu', titel: 'CAM-ICU' },
  bps: { id: 'bps', titel: 'Behavioral Pain Scale (BPS)' },
  sbar: { id: 'sbar', titel: 'SBAR-Kommunikation (WHO High 5s / Aktionsbündnis Patientensicherheit)' },
  alkohol: { id: 's3-alkohol', titel: 'S3-Leitlinie Screening, Diagnose und Behandlung alkoholbezogener Störungen (AWMF 076-001), 2021' },
  gastro: { id: 'gpge-gastroenteritis', titel: 'S2k-Leitlinie Akute infektiöse Gastroenteritis im Säuglings-, Kindes- und Jugendalter (GPGE, AWMF 068-003)' },
} satisfies Record<string, Quelle>;

/* ───────────────────────── Bausteine ───────────────────────── */

export const NACHWEIS: Record<string, Nachweis> = {};

function m(id: string, name: string, reiter: Reiter, zeitbedarfSekunden: number, kompetenzbereiche: KB[], n: Nachweis, mehr: Partial<MassnahmeDefinition> = {}): MassnahmeDefinition {
  NACHWEIS[id] = n;
  const beleg = alsQuelle(n);
  return { id, name, reiter, spur: 'beide', zeitbedarfSekunden, befugnis: SELBST, kompetenzbereiche, ...(beleg ? { befugnisBeleg: beleg } : {}), ...mehr };
}

const B_ANLEITUNG_DANN_SELBST = 'Grundwert KONZEPT 6.1: im 1. Drittel mit Anleitung, danach selbst.';

/* ───────────────────────── Katalog ───────────────────────── */

const LISTE: MassnahmeDefinition[] = [
  /* ─────────────── 1 Gespräch & Beziehung ─────────────── */
  m('vorstellen-einverstaendnis', 'Sich vorstellen, Vorhaben erklären, Einverständnis einholen', 'gespraech', 20, ['II', 'IV'], nw(['beziehung1', 'erklaeren12'])),
  m('ansprechen-orientierung', 'Ansprechen und Orientierung prüfen', 'gespraech', 20, ['I', 'II'], nw(['beziehung1', 'daten1'])),
  m('trinkmenge-erfragen', 'Nach Trinkmenge fragen', 'gespraech', 30, ['I', 'II'], nw(['daten1', 'selbstversorgung1'])),
  m('biografie-erfragen', 'Gewohnheiten und Biografie erfragen', 'gespraech', 120, ['I', 'II'], nw(['daten1', 'biografie12'])),
  m('beschwerden-erfragen', 'Beschwerden, Beginn und Verlauf erfragen', 'gespraech', 60, ['I', 'II'], nw(['daten1', 'beziehung1'])),
  m('patientenwille-erfragen', 'Patientenwillen und Patientenverfügung erfragen', 'gespraech', 90, ['II', 'IV'], nw(['palliativ12'], { anmerkung: 'Selbstbestimmung I.6.a in CE 06 (S. 78).' })),
  m('beruhigen-zusprechen', 'Ruhig zusprechen, Halt geben, nicht allein lassen', 'gespraech', 60, ['II'], nw(['psychErsteHilfe12', 'beziehung1']), {
    wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }],
  }),
  m('validierend-sprechen', 'Validierend auf Gefühle eingehen (Validation)', 'gespraech', 120, ['II', 'V'], nw(['validation12']), {
    spur: 'A', quellen: [Q.demenz],
    wirkung: [
      { groesse: 'unruhe', delta: -0.15, beginnSek: 30, spitzeSek: 120, dauerSek: 'dauerhaft' },
      { groesse: 'angst', delta: -0.1, beginnSek: 30, spitzeSek: 120, dauerSek: 'dauerhaft' },
    ],
  }),
  m('deeskalierend-sprechen', 'Deeskalierend sprechen, Abstand und Fluchtweg wahren', 'gespraech', 120, ['II', 'III'], nw(['krise3', 'psychErsteHilfe12'], {
    anmerkung: 'Deeskalation ausdrücklich erst im 3. Drittel (CE 11); im 1./2. Drittel nur emotionale Stabilisierung (CE 06). Darum dort mit Anleitung.',
  }), {
    befugnis: befugnis(A, A, S), wirkung: [{ groesse: 'unruhe', delta: -0.2, beginnSek: 30, spitzeSek: 180, dauerSek: 'dauerhaft' }],
  }),
  m('suizidalitaet-ansprechen', 'Suizidgedanken offen und direkt ansprechen', 'gespraech', 120, ['I', 'II'], nw(['suizid12', 'krise3'], {
    anmerkung: 'Handlungsanlass Suizidversuch schon 1./2. Drittel, Krisenhilfe ausdrücklich im 3. Drittel. Im 1./2. Drittel gemeinsam mit der PA.',
  }), { spur: 'A', befugnis: befugnis(A, A, S) }),
  m('atemanleitung-ruhig', 'Gemeinsam ruhig atmen (langsam ausatmen, mitzählen) bei Panik', 'gespraech', 120, ['I', 'II'], nw(['psychErsteHilfe12', 'atem12'], {
    anmerkung: 'Emotionale Stabilisierung (CE 06) und Atmung fördern (CE 05). Keine Tütenatmung: sie kann bei körperlicher Ursache gefährlich sein.',
  }), {
    spur: 'A', beendet: ['panik_eskaliert'],
    wirkung: [{ groesse: 'angst', delta: -0.25, beginnSek: 30, spitzeSek: 240, dauerSek: 'dauerhaft' }],
  }),
  m('kommunikationshilfe', 'Kommunikationshilfe einsetzen (Hörgerät, Brille, einfache Sprache, Dolmetscher)', 'gespraech', 60, ['II'], nw(['barrieren1', 'hilfsmittel1'])),
  m('reorientieren', 'Orientierung geben (Name, Ort, Uhrzeit, Licht, Brille/Hörgerät, Vertrautes)', 'gespraech', 90, ['I', 'II'], nw(['milieu12', 'validation12', 'hilfsmittel1']), {
    spur: 'A', quellen: [Q.demenz],
    wirkung: [
      { groesse: 'angst', delta: -0.1, beginnSek: 30, spitzeSek: 180, dauerSek: 'dauerhaft' },
      { groesse: 'orientierung', delta: 0.1, beginnSek: 60, spitzeSek: 600, dauerSek: 'dauerhaft' },
    ],
  }),
  m('trinken-beraten', 'Zum Trinken beraten und Trinkplan vereinbaren', 'gespraech', 90, ['II', 'V'], nw(['selbstpflege1', 'ernaehrung1']), { spur: 'A', quellen: [Q.ernaehrung] }),
  // P17b (CE04/CE07): Schulung, Anleitung, Bezugspersonen
  m('schulen-selbstmanagement', 'Zu Selbstkontrolle und Warnzeichen schulen (chronische Erkrankung)', 'gespraech', 240, ['II', 'I'], nw(['schulung04_12', 'praevention04_12', 'diabetes12']), {
    spur: 'A', setzt: ['geschult'],
  }),
  m('bezugsperson-anleiten', 'Bezugsperson anleiten (vormachen, üben lassen, Rückmeldung geben)', 'gespraech', 300, ['II'], nw(['bezugAnleiten12', 'rehaBeratung3']), { spur: 'A' }),
  m('eltern-einbeziehen', 'Eltern/Bezugsperson beruhigen und einbeziehen', 'gespraech', 90, ['II'], nw(['psychErsteHilfe12', 'bezugspersonen3']), { spur: 'A' }),
  m('kommunikation-tubus', 'Mit intubierter Person kommunizieren (Ja/Nein, Buchstabentafel)', 'gespraech', 120, ['II'], NICHT_BELEGT(
    'Lehrplan nennt nur den Besuch einer Intensivstation (S. 62). Grundwert: im 1./2. Drittel mit Anleitung.',
  ), { spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['team'] }),
  m('angehoerige-schockraum', 'Angehörige im Schockraum betreuen und informieren lassen', 'gespraech', 120, ['II', 'III'], nw(['ersthelfer3', 'psychErsteHilfe12']), {
    spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['team'],
  }),

  /* ─────────────── 2 Beobachten & Einschätzen ─────────────── */
  m('ersteindruck-abcde', 'Ersteindruck nach ABCDE', 'beobachten', 20, ['I'], nw(['vitalScreening12', 'notfallplan12']), { klinisch: ['abcde'] }),
  m('verletzung-pruefen-sturz', 'Nach Sturz auf Verletzungen prüfen', 'beobachten', 60, ['I', 'V'], nw(['mobil1', 'ersteHilfe12']), { quellen: [Q.sturz] }),
  m('kopf-pruefen', 'Kopf auf Verletzung prüfen', 'beobachten', 20, ['I'], nw(['ersteHilfe12', 'daten1'])),
  m('schmerz-nrs', 'Schmerz einschätzen (NRS)', 'beobachten', 30, ['I', 'V'], nw(['schmerz12']), { quellen: [Q.schmerz] }),
  m('schmerz-besd', 'Schmerz bei Demenz einschätzen (BESD)', 'beobachten', 120, ['I', 'V'], nw(['schmerz12']), { spur: 'A', quellen: [Q.besd, Q.schmerz] }),
  m('schmerz-kinderskala', 'Schmerz beim Kind einschätzen (altersgerechte Skala)', 'beobachten', 60, ['I', 'V'], nw(['schmerz12']), { spur: 'A', quellen: [Q.schmerz] }),
  m('schleimhaut-pruefen', 'Mundschleimhaut und Zunge ansehen', 'beobachten', 20, ['I'], nw(['daten1', 'wasser12'])),
  m('hautturgor-pruefen', 'Hautspannung prüfen', 'beobachten', 20, ['I'], nw(['daten1', 'wasser12'])),
  m('haut-beobachten', 'Haut ansehen (Farbe, Temperatur, Schweiß, Zyanose)', 'beobachten', 20, ['I'], nw(['vital1', 'vitalScreening12'])),
  m('rekap-pruefen', 'Rekapillarisierungszeit prüfen', 'beobachten', 15, ['I'], nw(['vitalScreening12', 'zirkulation12']), { klinisch: ['abcde'] }),
  m('atmung-beobachten', 'Atmung beobachten (Muster, Einziehungen, Atemhilfsmuskulatur)', 'beobachten', 30, ['I'], nw(['vital1', 'atem12', 'neugeborene12']), { klinisch: ['abcde'] }),
  m('atemgeraeusche-hoeren', 'Atemgeräusche hören (Stethoskop)', 'beobachten', 60, ['I'], nw(['atem12'], {
    anmerkung: 'Abhören ist im Lehrplan nicht ausdrücklich genannt, nur die Beobachtung der Atmung. Pflegerisches Abhören als Beobachtung, keine ärztliche Befundung.',
  }), { geraet: 'stethoskop', befugnis: befugnis(A, S) }),
  m('bewusstsein-avpu', 'Bewusstsein einschätzen (AVPU/GCS)', 'beobachten', 30, ['I'], nw(['vitalScreening12', 'notfallplan12']), { klinisch: ['abcde'], quellen: [Q.gcs] }),
  m('pupillen-pruefen', 'Pupillen prüfen (Größe, Lichtreaktion)', 'beobachten', 20, ['I'], nw(['vitalScreening12'])),
  m('fast-test', 'Schlaganfallzeichen prüfen (BE-FAST)', 'beobachten', 45, ['I', 'V'], nw(['ersteHilfe12', 'vitalScreening12'], { anmerkung: 'Schlaganfall als Notfall in CE 06 genannt (S. 80).' }), { klinisch: ['abcde'] }),
  m('oedeme-pruefen', 'Auf Ödeme prüfen (Knöchel, Schienbein)', 'beobachten', 20, ['I'], nw(['daten1', 'wasser12'])),
  m('urin-beobachten', 'Urin beobachten (Menge, Farbe)', 'beobachten', 30, ['I'], nw(['selbstversorgung1', 'wasser12'])),
  m('delir-screening-4at', 'Delir-Screening (4AT)', 'beobachten', 90, ['I', 'V'], nw(['daten1', 'validation12']), { quellen: [Q.at4] }),
  m('entzug-einschaetzen', 'Alkoholentzug einschätzen (Zittern, Schwitzen, Unruhe, Halluzinationen; CIWA-Ar/AESB)', 'beobachten', 120, ['I', 'V'], nw(['risikoPsych12', 'sucht3'], {
    anmerkung: 'Risikoeinschätzung bei psychischen Problemlagen schon 1./2. Drittel, Sucht als Handlungsanlass ausdrücklich im 3. Drittel. Strukturierter Bogen bis zum 2. Drittel mit Anleitung.',
  }), { spur: 'A', befugnis: befugnis(A, A, S), quellen: [Q.alkohol] }),
  m('ausscheidung-beobachten', 'Erbrechen und Stuhl beobachten (Menge, Häufigkeit, Aussehen), Windel wiegen', 'beobachten', 60, ['I'], nw(['selbstversorgung1', 'vital1', 'wasser12'])),
  m('sturzrisiko-einschaetzen', 'Sturzrisiko einschätzen', 'beobachten', 120, ['I', 'V'], nw(['mobil1', 'standards1']), { spur: 'A', quellen: [Q.sturz] }),
  m('dekubitusrisiko-einschaetzen', 'Dekubitusrisiko und Haut an Druckstellen einschätzen', 'beobachten', 120, ['I', 'V'], nw(['standards1', 'selbstversorgung1']), { spur: 'A', quellen: [Q.dekubitus] }),
  m('spritzstellen-pruefen', 'Insulin-Spritzstellen ansehen und tasten (Verhärtung, Lipohypertrophie)', 'beobachten', 60, ['I'], nw(['diabetes12', 'insulin3']), { spur: 'A' }),
  m('wunde-beurteilen', 'Wunde beurteilen (Größe, Exsudat, Rötung, Geruch)', 'beobachten', 60, ['I', 'V'], nw(['wunde12', 'wunde3']), { spur: 'A', quellen: [Q.wunden] }),
  m('schlucken-pruefen', 'Schluckfähigkeit prüfen (vor dem Trinken/Essen)', 'beobachten', 90, ['I', 'V'], nw(['aspiration1', 'selbstversorgung1'], {
    anmerkung: 'Anreichen mit Aspirationsprophylaxe ist im 1. Drittel genannt; ein strukturiertes Schluckscreening nicht. Darum bis zum 2. Drittel mit Anleitung.',
  }), { spur: 'A', befugnis: befugnis(A, A, S) }),
  m('news2-berechnen', 'Frühwarnwert berechnen (NEWS2/PEWS)', 'beobachten', 60, ['I', 'V'], nw(['vitalScreening12']), { quellen: [Q.news2], klinisch: ['abcde'] }),
  m('triage-ersteinschaetzung', 'Ersteinschätzung (Triage) durchführen', 'beobachten', 120, ['I', 'III'], nw(['triage12'], {
    anmerkung: 'Triage ist im 1./2. Drittel als Inhalt genannt. Selbstständige Triage braucht in Notaufnahmen eine Schulung; darum für Azubis mit Anleitung.',
  }), { risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, A, A, S), klinisch: ['abcde', 'zeit'], quellen: [Q.mts] }),
  m('rass-einschaetzen', 'Sedierungstiefe einschätzen (RASS)', 'beobachten', 30, ['I'], NICHT_BELEGT('RASS ist im Lehrplan nicht genannt. Grundwert: im 3. Drittel selbst (Intensiveinsatz).'), {
    spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['medikamente'], quellen: [Q.rass],
  }),
  m('delir-cam-icu', 'Delir auf Intensivstation prüfen (CAM-ICU)', 'beobachten', 90, ['I', 'V'], NICHT_BELEGT('CAM-ICU ist im Lehrplan nicht genannt.'), {
    klinisch: ['abcde'], spur: 'B', befugnis: befugnis(A, A, S), quellen: [Q.camicu],
  }),
  m('schmerz-bps', 'Schmerz bei beatmeter Person einschätzen (BPS)', 'beobachten', 60, ['I', 'V'], nw(['schmerz3'], { anmerkung: 'Nur allgemein „komplizierte Schmerzen“ im 3. Drittel.' }), {
    klinisch: ['medikamente'], spur: 'B', befugnis: befugnis(A, A, S), quellen: [Q.bps],
  }),
  m('beatmung-beobachten', 'Beatmung beobachten (Thoraxbewegung, Synchronität, Alarme)', 'beobachten', 60, ['I'], nw(['atem3', 'instabil3']), {
    spur: 'B', befugnis: befugnis(A, A, S), voraussetzung: { flag: 'beatmet' }, klinisch: ['geraete', 'abcde'],
  }),
  m('drainagen-beobachten', 'Drainagen und Sonden beobachten (Menge, Aussehen)', 'beobachten', 45, ['I'], nw(['zuAbleitungen12', 'komplStabil12']), { spur: 'B', klinisch: ['geraete'] }),

  /* ─────────────── 3 Akut & Sicherheit ─────────────── */
  m('sitzend-sichern', 'Sitzend sichern, wärmen, nicht allein lassen', 'akut', 60, ['I'], nw(['ersteHilfe12', 'mobil1']), {
    setzt: ['gesichert'], wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
  }),
  m('hilfe-holen', 'Hilfe holen (Klingel, Kollegin rufen)', 'akut', 15, ['III'], nw(['notfallplan12', 'abgrenzen1']), { setzt: ['hilfe-geholt'], klinisch: ['team'] }),
  m('notruf-112', 'Rettungsdienst rufen (112)', 'akut', 60, ['III'], nw(['notruf12', 'sofort12']), { setzt: ['rettungsdienst'] }),
  m('rea-team-alarmieren', 'Reanimationsteam alarmieren (innerklinisch)', 'akut', 20, ['III'], nw(['notfallplan12', 'rea12']), { setzt: ['rea-team'], klinisch: ['team', 'zeit'] }),
  m('umgebung-sichern', 'Umgebung sichern (Stolperfallen, Licht)', 'akut', 60, ['I', 'V'], nw(['umgebung1', 'standards1']), { setzt: ['umgebung-sicher'] }),
  m('oberkoerper-hoch', 'Oberkörper hochlagern (Atemerleichterung)', 'akut', 30, ['I'], nw(['mobil1', 'atem12']), {
    setzt: ['oberkoerper-hoch'], wirkung: [
      { groesse: 'atemarbeit', faktor: 0.88, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' },
      { groesse: 'angst', delta: -0.05, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' },
    ],
  }),
  m('flachlagern-beine-hoch', 'Flach lagern, Beine hoch (bei Kollaps/Schock, nicht bei Atemnot)', 'akut', 30, ['I'], nw(['ersteHilfe12']), {
    setzt: ['schocklage'], wirkung: [{ groesse: 'volumen', delta: 0.04, beginnSek: 0, spitzeSek: 30, dauerSek: 600 }],
  }),
  m('stabile-seitenlage', 'Stabile Seitenlage', 'akut', 30, ['I'], nw(['ersteHilfe12']), { setzt: ['seitenlage'], klinisch: ['abcde'] }),
  m('atemwege-freimachen', 'Atemwege freimachen (Kopf überstrecken, Mund ausräumen)', 'akut', 20, ['I'], nw(['ersteHilfe12', 'sofort12']), {
    klinisch: ['abcde'], wirkung: [{ groesse: 'atemarbeit', faktor: 0.9, beginnSek: 0, spitzeSek: 10, dauerSek: 'dauerhaft' }],
  }),
  m('absaugen-oral', 'Mund und Rachen absaugen', 'akut', 60, ['I'], nw(['atem12', 'stabil12'], {
    anmerkung: 'Absaugen ist im generalistischen Teil nicht genannt (nur Anlage 4, S. 75). Abgeleitet aus „Durchgängigkeit der Atemwege fördern“.',
  }), {
    befugnis: befugnis(A, A, S), klinisch: ['abcde'],
    wirkung: [{ groesse: 'atemarbeit', faktor: 0.9, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }, { groesse: 'gasaustausch', delta: 0.04, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
  }),
  m('o2-geben', 'Sauerstoff geben (nach Anordnung/Standard)', 'akut', 45, ['I', 'III'], nw(['atem12', 'mitwirken12', 'eigenstaendig3']), {
    anordnungspflichtig: true, befugnis: befugnis(A, S), risikoBeiUeberschreitung: 'warnung-pa', setzt: ['o2-laeuft'], klinisch: ['abcde', 'medikamente'],
    wirkung: [{ groesse: 'sauerstoff', delta: 2, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }],   // 2 l/min; Fall kann Menge überschreiben
  }),
  m('blutung-stillen', 'Blutung stillen (Druck, Druckverband, hochlagern)', 'akut', 60, ['I'], nw(['ersteHilfe12', 'sofort12']), { setzt: ['blutung-gestillt'], klinisch: ['abcde'] }),
  m('krampf-schuetzen', 'Bei Krampfanfall schützen und Zeit messen', 'akut', 30, ['I'], nw(['ersteHilfe12', 'sofort12']), { setzt: ['krampf-geschuetzt'] }),
  m('glukose-oral', 'Bei Unterzucker schnell wirksame Kohlenhydrate geben (wach, kann schlucken)', 'akut', 60, ['I', 'V'], nw(['hypo3', 'ersteHilfe12'], {
    anmerkung: 'Hypoglykämie ausdrücklich erst im 3. Drittel (CE 10); Erste Hilfe ab 1./2. Drittel. Gilt als Sofortmaßnahme nach Standard ohne Einzelanordnung.',
  }), {
    treiber: [{ art: 'kohlenhydrate', gramm: 20, schnell: true }],
  }),
  m('bls-herzdruckmassage', 'Herzdruckmassage beginnen (BLS)', 'akut', 120, ['I'], nw(['rea12', 'sofort12']), { setzt: ['bls-laeuft'], quellen: [Q.erc], klinisch: ['abcde', 'zeit'] }),
  m('beutel-maske-beatmen', 'Mit Beutel und Maske beatmen', 'akut', 60, ['I'], nw(['rea12', 'sofort12']), { befugnis: befugnis(A, S), quellen: [Q.erc], klinisch: ['abcde'] }),
  m('aed-anlegen', 'AED holen, anlegen und Anweisungen folgen', 'akut', 60, ['I'], nw(['rea12', 'sofort12']), { setzt: ['aed'], quellen: [Q.erc], klinisch: ['geraete', 'zeit'] }),
  m('sturzprophylaxe-bett', 'Bett tief stellen, Sturzmatte, Klingel in Reichweite', 'akut', 60, ['I', 'V'], nw(['umgebung1', 'standards1']), { spur: 'A', setzt: ['sturzmatte'], quellen: [Q.sturz] }),
  m('sitzwache', 'Sitzwache/Begleitung organisieren', 'akut', 60, ['I', 'III'], nw(['validation12', 'abgrenzen1']), { spur: 'A', setzt: ['begleitet'] }),
  m('reizarm-gestalten', 'Reize verringern (Mitpatienten/Besuch hinausbitten, Licht, Lärm, eine Ansprechperson)', 'akut', 60, ['I', 'III'], nw(['milieu12', 'krise3']), {
    spur: 'A', setzt: ['reizarm'],
    wirkung: [
      { groesse: 'unruhe', delta: -0.1, beginnSek: 30, spitzeSek: 300, dauerSek: 'dauerhaft' },
      { groesse: 'angst', delta: -0.05, beginnSek: 30, spitzeSek: 300, dauerSek: 'dauerhaft' },
    ],
  }),
  m('gefaehrliche-gegenstaende-sichern', 'Gefährliche Gegenstände und gesammelte Tabletten gemeinsam sichern', 'akut', 120, ['I', 'IV'], nw(['suizid12', 'krise3'], {
    anmerkung: 'Selbstgefährdung als Handlungsanlass ab 1./2. Drittel, Krisenhilfe im 3. Drittel. Offen und mit Einverständnis, im 1./2. Drittel gemeinsam mit der PA.',
  }), { spur: 'A', befugnis: befugnis(A, A, S), setzt: ['gegenstaende-gesichert'] }),
  m('fem-anlegen', 'Freiheitsentziehende Maßnahme anwenden (Bettgitter, Gurt)', 'akut', 120, ['IV'], nw(['fem3'], {
    anmerkung: 'Der Lehrplan sieht im 3. Drittel nur Beobachten und Reflektieren vor. Anwendung nur mit Einwilligung bzw. richterlicher Genehmigung und Anordnung.',
  }), {
    spur: 'A', anordnungspflichtig: true, befugnis: befugnis(G, G, G, S), risikoBeiUeberschreitung: 'patientenschaden', setzt: ['fem'], quellen: [Q.bgb1831],
  }),
  m('defi-vorbereiten', 'Defibrillator bereitstellen, Elektroden kleben', 'akut', 45, ['I', 'III'], nw(['rea12', 'als3']), {
    spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['geraete', 'zeit'], quellen: [Q.erc],
  }),
  m('defibrillation-manuell', 'Manuell defibrillieren', 'akut', 15, ['I'], nw(['als3'], {
    anmerkung: 'ALS ist Lerninhalt, die manuelle Defibrillation bleibt ärztlich bzw. Teil einer ALS-Freigabe der Einrichtung (einstellbar). AED: siehe aed-anlegen.',
  }), { spur: 'B', befugnis: NUR_AERZTLICH, risikoBeiUeberschreitung: 'abbruch-durch-pa', klinisch: ['geraete'] }),
  m('notfallmedikament-vorbereiten', 'Notfallmedikament aufziehen und beschriften (Closed Loop)', 'akut', 60, ['I', 'III'], nw(['notfallmedi12', 'als3', 'eigenstaendig3'], {
    abweichung: 'Lehrplan nennt die Verabreichung von Notfallmedikamenten nach Anordnung schon im 1./2. Drittel. KONZEPT 6.1 sperrt i. v. im 1./2. Drittel. Gewählt: 2. Drittel mit Anleitung, 1. Drittel gesperrt.',
  }), {
    spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, A, A, S), risikoBeiUeberschreitung: 'patientenschaden', klinisch: ['medikamente', 'team'],
  }),
  m('intubation-vorbereiten', 'Intubation vorbereiten (Material, Absaugung, Präoxygenierung)', 'akut', 120, ['I', 'III'], nw(['invasiv3', 'atem3'], {
    anmerkung: 'Invasive Maßnahmen begleiten ausdrücklich im 3. Drittel. Im 1./2. Drittel nur Mitwirkung (III.2.b), hier gesperrt bzw. mit Anleitung.',
  }), { risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, A, A, S), klinisch: ['geraete', 'team'] }),
  m('intubation-assistieren', 'Bei der Intubation assistieren', 'akut', 120, ['III'], nw(['invasiv3']), {
    risikoBeiUeberschreitung: 'abbruch-durch-pa', spur: 'B', befugnis: befugnis(G, G, A, S), voraussetzung: { getan: 'intubation-vorbereiten' }, setzt: ['beatmet'], klinisch: ['team'],
  }),
  m('intubation-durchfuehren', 'Selbst intubieren', 'akut', 60, ['I'], nw(['invasiv3'], { anmerkung: 'Ärztliche Aufgabe in beiden Spuren (KONZEPT 0).' }), {
    klinisch: ['abcde', 'team'], spur: 'B', befugnis: NUR_AERZTLICH, risikoBeiUeberschreitung: 'abbruch-durch-pa',
  }),
  m('zugang-legen', 'Venösen Zugang legen', 'akut', 120, ['I'], nw(['mitwirken12', 'eigenstaendig3'], {
    anmerkung: 'Ärztliche Aufgabe, delegierbar. Eine Einrichtung kann sie für Pflegefachpersonen freigeben (einstellbar).',
  }), { befugnis: NUR_AERZTLICH, risikoBeiUeberschreitung: 'abbruch-durch-pa', setzt: ['zugang-liegt'] }),
  m('zvk-legen', 'Zentralen Venenkatheter legen', 'akut', 600, ['I'], NICHT_BELEGT('Ärztliche Aufgabe (KONZEPT 0, 6.1).'), {
    klinisch: ['geraete'], spur: 'B', befugnis: NUR_AERZTLICH, risikoBeiUeberschreitung: 'abbruch-durch-pa',
  }),
  m('schockraum-dokurolle', 'Schockraum: Zeit und Maßnahmen protokollieren', 'akut', 60, ['III'], nw(['triage12', 'doku1']), { spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['team', 'zeit'] }),

  /* ─────────────── 4 Messen & Diagnostik ─────────────── */
  m('pulsoxy-anlegen', 'Pulsoxymeter anlegen', 'messen', 40, ['I'], nw(['messgeraete1', 'neugeborene12']), { geraet: 'pulsoxy' }),
  m('rr-messen', 'Blutdruck messen', 'messen', 60, ['I'], nw(['vital1', 'messgeraete1']), { geraet: 'rr-geraet' }),
  m('puls-zaehlen', 'Puls tasten und zählen', 'messen', 30, ['I'], nw(['vital1'])),
  m('af-zaehlen', 'Atemfrequenz zählen', 'messen', 30, ['I'], nw(['vital1', 'vitalScreening12'])),
  m('temperatur-ohr', 'Temperatur messen (Ohr)', 'messen', 30, ['I'], nw(['vital1', 'thermo12']), { geraet: 'thermometer' }),
  m('bz-messen', 'Blutzucker messen', 'messen', 90, ['I'], nw(['messgeraete1', 'diabetes12', 'hypo3'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), { geraet: 'bz-geraet', befugnis: befugnis(A, S) }),
  m('urinstix', 'Urinstix', 'messen', 90, ['I'], nw(['messgeraete1', 'selbstversorgung1'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), { geraet: 'urinstix', befugnis: befugnis(A, S) }),
  m('peak-flow', 'Peak-Flow messen', 'messen', 60, ['I'], nw(['inhalation3'], { anmerkung: 'Ausdrücklich erst im 3. Drittel (CE 10).' }), { spur: 'A', befugnis: befugnis(A, A, S) }),
  m('bilanz-fuehren', 'Ein- und Ausfuhr bilanzieren', 'messen', 60, ['I'], nw(['wasser12', 'doku1']), { setzt: ['bilanz'] }),
  m('gewicht-messen', 'Körpergewicht messen', 'messen', 60, ['I'], nw(['ernaehrung1', 'messgeraete1']), { spur: 'A' }),
  m('dosett-pruefen', 'Medikamentendosett prüfen', 'messen', 30, ['I', 'IV'], nw(['medi12', 'pharma12'])),
  m('kurve-lesen', 'Kurve, Vorbefunde und Medikamentenplan lesen', 'messen', 60, ['I'], nw(['doku1', 'aufnahme12'])),
  m('monitor-anlegen', 'Überwachungsmonitor anlegen (EKG, SpO₂, RR)', 'messen', 60, ['I'], nw(['messgeraete1', 'vitalScreening12']), { klinisch: ['geraete'] }),
  m('ekg-12-kanal', '12-Kanal-EKG schreiben', 'messen', 180, ['I', 'III'], nw(['mitwirken12', 'stabil12', 'eigenstaendig3'], { anmerkung: 'Diagnostik in stabilen Situationen im 1./2. Drittel mit Anleitung, im 3. Drittel eigenständig.' }), {
    befugnis: befugnis(A, A, S), klinisch: ['geraete'],
  }),
  m('blutentnahme-venoes', 'Venös Blut abnehmen', 'messen', 180, ['I', 'III'], nw(['mitwirken12', 'eigenstaendig3'], {
    anmerkung: 'Ärztlich veranlasst und delegierbar. Im Lehrplan nicht ausdrücklich genannt; Grundwert: im 3. Drittel mit Anleitung.',
  }), { anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa' }),
  m('abstrich-nehmen', 'Abstrich nehmen (z. B. Wunde, Nasen-Rachen)', 'messen', 90, ['I', 'III'], nw(['mitwirken12', 'stabil12']), {
    anordnungspflichtig: true, befugnis: befugnis(A, S), quellen: [Q.krinko],
  }),
  m('etco2-anschliessen', 'Kapnografie anschließen und etCO₂ ablesen', 'messen', 60, ['I'], NICHT_BELEGT('Kapnografie ist im Lehrplan nicht genannt.'), {
    risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, A, A, S), klinisch: ['geraete'],
  }),
  m('arterie-nullabgleich', 'Arterielle Druckmessung nullen und Kurve prüfen', 'messen', 60, ['I'], nw(['instabil3', 'invasiv3']), {
    risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, G, A, S), voraussetzung: { flag: 'arterie-liegt' }, klinisch: ['geraete'],
    setzt: ['art-genullt'], modul: { stoerungAus: ['art-nicht-genullt'] },   // Spur-B-Modul (P1b): Messwert danach unverschoben
  }),
  m('bga-abnehmen-arteriell', 'BGA aus dem arteriellen Zugang abnehmen', 'messen', 120, ['I'], nw(['eigenstaendig3', 'invasiv3']), {
    risikoBeiUeberschreitung: 'patientenschaden', spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), voraussetzung: { flag: 'arterie-liegt' }, setzt: ['bga-abgenommen'], klinisch: ['geraete'],
  }),
  m('bga-messen-lesen', 'BGA messen, Werte lesen und melden', 'messen', 90, ['I', 'III'], nw(['instabil3', 'einschaetzung3']), {
    risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, A, S), voraussetzung: { flag: 'bga-abgenommen' }, klinisch: ['abcde'],
  }),
  m('laborwerte-lesen', 'Laborverlauf lesen und Auffälliges melden', 'messen', 60, ['I', 'III'], nw(['komplStabil12', 'instabil3']), { klinisch: ['abcde'], spur: 'B' }),
  m('cuffdruck-messen', 'Cuffdruck messen', 'messen', 45, ['I'], nw(['atem3']), {
    risikoBeiUeberschreitung: 'warnung-pa', spur: 'B', befugnis: befugnis(G, A, A, S), voraussetzung: { flag: 'beatmet' }, klinisch: ['geraete'],
  }),

  /* ─────────────── 5 Pflegen & Versorgen ─────────────── */
  m('trinken-anbieten', 'Trinken anbieten, Trinkprotokoll beginnen', 'versorgen', 120, ['I', 'V'], nw(['selbstversorgung1', 'ernaehrung1']), {
    setzt: ['trinkprotokoll'],
    wirkung: [
      { groesse: 'hydratation', delta: 0.12, beginnSek: 120, spitzeSek: 1800, dauerSek: 'dauerhaft' },
      { groesse: 'volumen', delta: 0.08, beginnSek: 120, spitzeSek: 1800, dauerSek: 'dauerhaft' },
    ],
  }),
  m('orale-rehydratation', 'Orale Rehydratationslösung in kleinen Mengen geben (Löffel/Spritze, nach Plan)', 'versorgen', 300, ['I', 'V'], nw(['selbstversorgung1', 'wasser12', 'fluessigkeitKind3'], {
    anmerkung: 'Flüssigkeitszufuhr sichern ist Grundpflege; beim Kind mit Erbrechen nach Plan der Ärztin oder des Stationsstandards. Im 1. Drittel mit Anleitung.',
  }), {
    spur: 'A', befugnis: befugnis(A, S), setzt: ['trinkprotokoll'], quellen: [Q.gastro],
    wirkung: [
      { groesse: 'hydratation', delta: 0.08, beginnSek: 300, spitzeSek: 2400, dauerSek: 'dauerhaft' },
      { groesse: 'volumen', delta: 0.06, beginnSek: 300, spitzeSek: 2400, dauerSek: 'dauerhaft' },
    ],
  }),
  m('essen-anreichen', 'Essen anreichen (aufrecht, kleine Bissen, Aspirationsprophylaxe)', 'versorgen', 300, ['I', 'V'], nw(['aspiration1', 'selbstversorgung1']), { spur: 'A', quellen: [Q.ernaehrung] }),
  m('koerperpflege', 'Bei der Körperpflege unterstützen', 'versorgen', 600, ['I', 'II'], nw(['selbstversorgung1', 'hygiene1'])),
  m('mundpflege', 'Mundpflege', 'versorgen', 180, ['I'], nw(['selbstversorgung1'])),
  m('nase-absaugen', 'Nasensekret beim Säugling absaugen (vor dem Trinken, schonend)', 'versorgen', 90, ['I'], nw(['neugeborene12', 'inhalation3'], {
    anmerkung: 'Sicherung der Atemwege beim Neugeborenen 1./2. Drittel, atemunterstützende Maßnahmen beim Kind 3. Drittel. Bis zum 2. Drittel mit Anleitung.',
  }), {
    spur: 'A', befugnis: befugnis(A, A, S),
    wirkung: [{ groesse: 'atemarbeit', delta: -0.3, beginnSek: 0, spitzeSek: 60, dauerSek: 1800 }],
  }),
  m('isolation-einrichten', 'Isolierung nach Hygieneplan (Einzelzimmer, Schutzkittel, Handschuhe, Händedesinfektion)', 'versorgen', 120, ['I', 'III'], nw(['hygiene1', 'hygieneKind12']), {
    setzt: ['isoliert'], quellen: [Q.krinko],
  }),
  m('inkontinenz-versorgen', 'Bei Ausscheidung unterstützen, Inkontinenz versorgen', 'versorgen', 300, ['I', 'II'], nw(['selbstversorgung1', 'ernaehrung1']), { quellen: [Q.kontinenz] }),
  m('positionieren-druckentlastung', 'Positionieren zur Druckentlastung', 'versorgen', 180, ['I', 'V'], nw(['mobil1', 'standards1']), { quellen: [Q.dekubitus] }),
  m('mobilisieren-transfer', 'Mobilisieren, Transfer Bett–Stuhl', 'versorgen', 300, ['I', 'V'], nw(['mobil1', 'standards1']), { quellen: [Q.mobilitaet] }),
  // P17b (CE04/CE07)
  m('positionieren-hemiplegie', 'Nach Schlaganfall positionieren (betroffene Seite einbeziehen, Schulter schützen)', 'versorgen', 240, ['I', 'V'], nw(['mobil1', 'rehaSelbst12'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), {
    spur: 'A', befugnis: befugnis(A, S), quellen: [Q.mobilitaet],
  }),
  m('anleiten-selbstpflege', 'Zur Selbstpflege anleiten statt abnehmen (vormachen, selbst tun lassen, Rückmeldung)', 'versorgen', 300, ['I', 'II'], nw(['selbstpflege1', 'rehaSelbst12']), { spur: 'A' }),
  m('kost-anpassen', 'Kost und Getränke nach Schluckbefund anpassen (angedickt, weich)', 'versorgen', 60, ['I', 'V'], nw(['aspiration1', 'rehaInterprof12'], {
    anmerkung: 'Setzt die Empfehlung von Logopädie bzw. Ärztin um; die Kostform legt das Team fest.',
  }), { spur: 'A', setzt: ['kost-angepasst'] }),
  m('kompression-ausziehen', 'Kompressionsstrümpfe ausziehen bzw. heute weglassen', 'versorgen', 90, ['I'], nw(['zirkulation12', 'selbstversorgung1']), { setzt: ['kompression-aus'] }),
  m('kohlenhydrate-langsam', 'Langsam wirksame Kohlenhydrate nachgeben (Brot, Mahlzeit)', 'versorgen', 120, ['I', 'V'], nw(['hypo3', 'diabetes12']), {
    spur: 'A', treiber: [{ art: 'kohlenhydrate', gramm: 24 }],
  }),
  m('kompression-anziehen', 'Kompressionsstrümpfe anziehen', 'versorgen', 300, ['I'], nw(['zirkulation12'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), { befugnis: befugnis(A, S) }),
  m('hausnotruf-anlegen', 'Hausnotruf anlegen und erklären', 'versorgen', 30, ['I', 'II'], nw(['umgebung1', 'selbstpflege1']), { spur: 'A' }),
  m('lippenbremse-anleiten', 'Lippenbremse und Atemtechnik anleiten', 'versorgen', 90, ['I', 'II'], nw(['atem12', 'selbstpflege1']), {
    wirkung: [
      { groesse: 'atemarbeit', faktor: 0.92, beginnSek: 30, spitzeSek: 120, dauerSek: 900 },
      { groesse: 'angst', delta: -0.1, beginnSek: 30, spitzeSek: 120, dauerSek: 'dauerhaft' },
    ],
  }),
  m('atemstimulierende-einreibung', 'Atemstimulierende Einreibung', 'versorgen', 300, ['I'], nw(['atem12']), {
    spur: 'A', wirkung: [
      { groesse: 'unruhe', delta: -0.1, beginnSek: 60, spitzeSek: 300, dauerSek: 1800 },
      { groesse: 'angst', delta: -0.1, beginnSek: 60, spitzeSek: 300, dauerSek: 1800 },
    ],
  }),
  m('wadenwickel', 'Wadenwickel bei Fieber (warme Füße, kein Schüttelfrost)', 'versorgen', 300, ['I', 'V'], nw(['thermo12']), {
    spur: 'A', wirkung: [{ groesse: 'temperatur', delta: -0.5, beginnSek: 300, spitzeSek: 1200, dauerSek: 2400 }],
  }),
  m('verband-unkompliziert', 'Verbandwechsel bei unkomplizierter Wunde (aseptisch)', 'versorgen', 300, ['I', 'V'], nw(['wunde12', 'hygiene1'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), {
    anordnungspflichtig: true, befugnis: befugnis(A, S), quellen: [Q.krinko],
  }),
  m('verband-kompliziert', 'Verbandwechsel bei komplizierter/chronischer Wunde', 'versorgen', 600, ['I', 'V'], nw(['wunde3'], { anmerkung: 'Komplizierte Wunden ausdrücklich erst im 3. Drittel.' }), {
    spur: 'A', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa', quellen: [Q.wunden],
  }),
  m('tabletten-wie-geplant-geben', 'Tabletten aus dem Dosett geben (wie geplant)', 'versorgen', 60, ['I', 'III'], nw(['medi12', 'aufsicht1', 'eigenstaendig3']), {
    anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'warnung-pa',
  }),
  m('bedarfsmedikation-oral', 'Bedarfsmedikation oral geben (nach Anordnung, R-Regeln)', 'versorgen', 60, ['I', 'III'], nw(['medi12', 'pharma12', 'eigenstaendig3', 'medfehler3']), {
    anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'patientenschaden', klinisch: ['medikamente'],
  }),
  m('torasemid-zurueckhalten', 'Torasemid heute zurückhalten', 'versorgen', 20, ['I', 'III'], nw(['medi12', 'eigenstaendig3']), { anordnungspflichtig: true }),
  m('gabe-zurueckstellen', 'Geplante Gabe zurückstellen und sofort ärztlich Rücksprache halten', 'versorgen', 20, ['I', 'III'], nw(['medi12', 'medfehler3'], {
    anmerkung: 'Keine Gabe, darum ohne Anordnung: Bei klarem Hinderungsgrund (z. B. Unterzucker vor dem Insulin) stellt die Pflege zurück und informiert sofort. Über das Weglassen entscheidet die Ärztin.',
  }), { setzt: ['gabe-zurueckgestellt'], klinisch: ['medikamente'] }),
  m('lorazepam-geben', 'Lorazepam geben', 'versorgen', 60, ['I', 'III'], nw(['medi12', 'eigenstaendig3', 'medfehler3']), {
    treiber: [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, weg: 'oral' }],   // G1: Wirkung aus dem Wirkstoffregister
    anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'patientenschaden',
  }),
  m('sc-injektion', 'Subkutan spritzen (z. B. Heparin, nach Anordnung)', 'versorgen', 90, ['I', 'III'], nw(['medi12', 'mitwirken12', 'eigenstaendig3'], {
    anmerkung: 'Injektionen sind im Lehrplan nicht einzeln genannt; abgeleitet aus Medikamentengabe auf Anordnung (1./2.) und eigenständiger Durchführung (3.).',
  }), { anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'patientenschaden', klinisch: ['medikamente'] }),
  m('insulin-sc', 'Insulin s. c. nach Schema geben', 'versorgen', 120, ['I', 'III'], nw(['diabetes12', 'medi12', 'insulin3', 'eigenstaendig3']), {
    anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'patientenschaden', klinisch: ['medikamente'],
    treiber: [{ art: 'insulin', ie: 4 }],   // Beispieldosis; der Fall setzt die angeordnete Dosis über massnahmenZusatz
  }),
  m('inhalation-geben', 'Inhalation/Dosieraerosol mit Spacer geben (nach Anordnung)', 'versorgen', 120, ['I', 'II'], nw(['medi12', 'atem12', 'inhalation3']), {
    treiber: [{ art: 'wirkstoff', id: 'salbutamol', dosisMg: 0.2, weg: 'inhalativ' }],   // 2 Hübe; Fall kann Dosis überschreiben
    anordnungspflichtig: true, befugnis: befugnis(A, A, S), risikoBeiUeberschreitung: 'warnung-pa', klinisch: ['medikamente'],
  }),
  m('sondennahrung-geben', 'Sondennahrung über liegende PEG geben', 'versorgen', 300, ['I'], nw(['zuAbleitungen12', 'stabil12']), {
    spur: 'A', anordnungspflichtig: true, befugnis: befugnis(A, A, S), voraussetzung: { flag: 'peg-liegt' }, risikoBeiUeberschreitung: 'warnung-pa',
  }),
  m('blasenkatheter-legen', 'Transurethralen Blasenkatheter legen', 'versorgen', 600, ['I', 'III'], nw(['assistenz12', 'eigenstaendig3'], {
    anmerkung: 'Nicht ausdrücklich genannt (nur Anlage 4, S. 75). Grundwert: ab 2. Drittel mit Anleitung.',
  }), { anordnungspflichtig: true, befugnis: befugnis(G, A, A, S), risikoBeiUeberschreitung: 'warnung-pa', setzt: ['dk-liegt'], beendet: ['harnverhalt'], quellen: [Q.krinko] }),
  m('infusion-ueberwachen', 'Laufende Infusion überwachen (Tropfrate, Einstichstelle)', 'versorgen', 45, ['I'], nw(['zuAbleitungen12', 'komplStabil12'], { anmerkung: B_ANLEITUNG_DANN_SELBST }), {
    befugnis: befugnis(A, S), voraussetzung: { flag: 'infusion-laeuft' },
  }),
  m('infusion-anhaengen', 'Infusion ohne Zusatz anhängen/wechseln (z. B. 500 ml Vollelektrolyt)', 'versorgen', 120, ['I', 'III'], nw(['zuAbleitungen12', 'mitwirken12', 'eigenstaendig3'], {
    abweichung: 'Lehrplan 3. Drittel („eigenständig ärztlich veranlasste Maßnahmen“) würde „selbst“ tragen; KONZEPT 6.1 sieht „mit Anleitung“ vor. Konservativ übernommen, Einrichtung kann lockern.',
  }), {
    anordnungspflichtig: true, befugnis: befugnis(G, A, A, S), risikoBeiUeberschreitung: 'patientenschaden', voraussetzung: { flag: 'zugang-liegt' }, setzt: ['infusion-laeuft'], klinisch: ['medikamente'],
    wirkung: [
      { groesse: 'volumen', delta: 0.1, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
      { groesse: 'hydratation', delta: 0.08, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
    ],
  }),
  m('iv-medikament-vorbereiten', 'i. v.-Medikament vorbereiten (richten, beschriften)', 'versorgen', 120, ['I', 'III'], nw(['mitwirken12', 'pharma3', 'medfehler3']), {
    anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa', klinisch: ['medikamente'],
  }),
  m('iv-medikament-geben', 'i. v.-Medikament über liegenden Zugang geben', 'versorgen', 60, ['I', 'III'], nw(['eigenstaendig3', 'pharma3'], {
    abweichung: 'KONZEPT 6.1: auch im 3. Drittel nur Vorbereitung mit Anleitung. Lehrplan ließe im 3. Drittel mehr zu; i. v.-Gabe durch Azubis bleibt hier gesperrt (Patientensicherheit, Einrichtungsregel).',
  }), {
    anordnungspflichtig: true, befugnis: befugnis(G, G, G, S), risikoBeiUeberschreitung: 'patientenschaden', voraussetzung: { flag: 'zugang-liegt' }, klinisch: ['medikamente'],
  }),
  m('perfusor-laufrate-berechnen', 'Perfusor-Laufrate berechnen (mg/h ↔ ml/h)', 'versorgen', 90, ['I', 'V'], nw(['pharma3', 'medfehler3']), {
    spur: 'B', befugnis: befugnis(S), klinisch: ['medikamente'],
  }),
  m('perfusor-vorbereiten', 'Perfusor vorbereiten und anschließen', 'versorgen', 180, ['I', 'III'], nw(['pharma3', 'eigenstaendig3', 'medfehler3'], {
    anmerkung: 'KONZEPT 6.1: Perfusoren im 3. Drittel Vorbereitung mit Anleitung.',
  }), { spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), risikoBeiUeberschreitung: 'patientenschaden', setzt: ['perfusor-laeuft'], klinisch: ['medikamente', 'geraete'] }),
  m('perfusor-wechseln', 'Perfusorspritze ohne Unterbrechung wechseln', 'versorgen', 120, ['I'], nw(['pharma3', 'instabil3']), {
    spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), risikoBeiUeberschreitung: 'patientenschaden', voraussetzung: { flag: 'perfusor-laeuft' }, klinisch: ['medikamente', 'geraete'],
  }),
  m('katecholamin-anpassen', 'Katecholamin-Laufrate nach Zielwert-Anordnung anpassen', 'versorgen', 30, ['I', 'III'], nw(['pharma3'], {
    anmerkung: 'Lehrplan nennt nur Arzneimittelwirkung beim Schock unterstützen. Laufrate ändern bleibt Pflegefachpersonen nach Anordnung vorbehalten.',
  }), {
    spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, G, S), risikoBeiUeberschreitung: 'patientenschaden', voraussetzung: { flag: 'perfusor-laeuft' }, klinisch: ['medikamente'],
    wirkung: [{ groesse: 'gefaesstonus', delta: 0.1, beginnSek: 30, spitzeSek: 300, dauerSek: 'dauerhaft' }],
  }),
  m('geschlossen-absaugen', 'Endotracheal geschlossen absaugen', 'versorgen', 90, ['I'], nw(['atem3', 'invasiv3']), {
    risikoBeiUeberschreitung: 'patientenschaden', spur: 'B', befugnis: befugnis(G, G, A, S), voraussetzung: { flag: 'beatmet' }, klinisch: ['geraete', 'abcde'],
    wirkung: [{ groesse: 'gasaustausch', delta: 0.05, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
    modul: { stoerungAus: ['sekret'] },   // Spur-B-Modul (P1b): Sekretverlegung behoben
  }),
  m('mundpflege-beatmet', 'Mundpflege bei beatmeter Person (VAP-Prophylaxe)', 'versorgen', 300, ['I', 'V'], nw(['selbstversorgung1', 'atem3']), {
    klinisch: ['geraete'], spur: 'B', befugnis: befugnis(A, A, S), voraussetzung: { flag: 'beatmet' }, quellen: [Q.krinko],
  }),
  m('bauchlage-mitwirken', 'Bei Lagerungstherapie (Bauchlage) im Team mitwirken', 'versorgen', 600, ['I', 'III'], nw(['atem3', 'invasiv3']), {
    risikoBeiUeberschreitung: 'abbruch-durch-pa', spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), voraussetzung: { flag: 'beatmet' }, klinisch: ['team'],
    wirkung: [{ groesse: 'gasaustausch', delta: 0.08, beginnSek: 600, spitzeSek: 3600, dauerSek: 'dauerhaft' }],
  }),
  m('zvk-verband', 'ZVK-Verband wechseln (aseptisch)', 'versorgen', 300, ['I', 'V'], nw(['zuAbleitungen12', 'invasiv3']), {
    risikoBeiUeberschreitung: 'patientenschaden', spur: 'B', anordnungspflichtig: true, befugnis: befugnis(G, G, A, S), voraussetzung: { flag: 'zvk-liegt' }, quellen: [Q.krinko], klinisch: ['geraete'],
  }),

  /* ─────────────── 6 Melden & Übergabe ─────────────── */
  m('tochter-informieren', 'Angehörige informieren', 'melden', 120, ['II'], nw(['bezugspersonen3', 'beziehung1'], {
    anmerkung: 'Information über Gesundheitszustand nach Absprache mit der verantwortlichen Pflegefachperson (Schweigepflicht CE 01, S. 9).',
  })),
  m('therapieteam-informieren', 'Therapieteam einbeziehen (Logopädie, Physio-, Ergotherapie)', 'melden', 60, ['III', 'II'], nw(['rehaInterprof12']), { spur: 'A' }),
  m('pflegebericht', 'Pflegebericht schreiben', 'melden', 180, ['I', 'IV'], nw(['doku1'])),
  m('pdl-informieren', 'Pflegedienstleitung informieren', 'melden', 60, ['III'], nw(['abgrenzen1'])),
  m('pflegefachperson-informieren', 'Verantwortliche Pflegefachperson/Schichtleitung informieren', 'melden', 60, ['III'], nw(['abgrenzen1', 'aufsicht1']), { klinisch: ['team'] }),
  m('uebergabe-schicht', 'Übergabe an die nächste Schicht (strukturiert)', 'melden', 180, ['II', 'III'], nw(['uebergabe12', 'sbar12']), { quellen: [Q.sbar] }),
  m('uebergabe-rettungsdienst', 'Übergabe an den Rettungsdienst', 'melden', 120, ['II', 'III'], nw(['sbarNotfall12', 'notruf12']), { spur: 'A', klinisch: ['team'] }),
  m('sturzprotokoll', 'Sturzereignis dokumentieren', 'melden', 180, ['I', 'IV'], nw(['doku1', 'standards1']), { spur: 'A', quellen: [Q.sturz] }),
  m('pflegeplanung-anpassen', 'Pflegebedarf festhalten, Pflegeplanung anpassen', 'melden', 300, ['I'], nw(['ziele1', 'aufnahme12', 'pflegeprozess3'], {
    anmerkung: 'Vorbehaltene Aufgabe (§ 4 PflBG): Auszubildende üben sie in allen Dritteln unter Verantwortung der Pflegefachperson, daher durchgehend mit Anleitung.',
  }), { befugnis: befugnis(A, A, A, S), quellen: [Q.pflbg] }),
  m('gewalt-verdacht-melden', 'Verdacht auf Gewalt ansprechen und melden', 'melden', 120, ['III', 'IV'], nw(['gewalt3'], { anmerkung: 'Ausdrücklich 3. Drittel. Im 1./2. Drittel: Beobachtung an die Pflegefachperson melden.' }), {
    spur: 'A', befugnis: befugnis(A, A, S),
  }),
  m('uebergabe-rd-annehmen', 'Übergabe vom Rettungsdienst annehmen (strukturiert)', 'melden', 120, ['II', 'III'], nw(['sbarNotfall12', 'triage12']), {
    spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['team'],
  }),
  m('verlegung-uebergabe', 'Verlegungsübergabe Intensiv ↔ Station', 'melden', 300, ['II', 'III'], nw(['uebergabe12', 'intensiv3']), {
    spur: 'B', befugnis: befugnis(A, A, S), klinisch: ['team'],
  }),
];

// Spur-B-Ergänzungen (P1b): nur Maßnahmen, die oben fehlen, mit eigenem Nachweis
Object.assign(NACHWEIS, SPUR_B_NACHWEIS);
const ALLE = [...LISTE, ...SPUR_B_LISTE];

export const KATALOG: Readonly<Record<string, MassnahmeDefinition>> = Object.fromEntries(ALLE.map((x) => [x.id, x]));
export const KATALOG_LISTE: readonly MassnahmeDefinition[] = ALLE;
