// Praxissimulator neu – Belege der Befugnis-Grundwerte im Landeslehrplan Baden-Württemberg (Paket P3, E4).
// Quelle: „Landeslehrplan für die Berufsfachschule für Pflege (3BFP)“, Ministerium für Soziales und Integration /
// Ministerium für Kultus, Jugend und Sport BW, Az. 43 – 6512.-2243/102 vom 5. August 2020 (207 Seiten).
// Seitenzahlen = gedruckte Seitenzahl = PDF-Seite. Es gelten nur die generalistischen Abschnitte (Anlage 1 = 1./2. Drittel,
// Anlage 2 = 3. Drittel); die Varianten für Anlage 3 (Kinderkrankenpflege) und Anlage 4 (Altenpflege) zählen nicht.
//
// Wichtig für die Deutung:
// - Der Lehrplan ist ein Curriculum. Er sagt, WANN eine Handlung gelernt wird und auf welchem Kompetenzniveau
//   (Anlage 1: „wirken mit“, „übernehmen die Durchführung in stabilen Situationen“; Anlage 2: „führen eigenständig
//   ärztlich veranlasste Maßnahmen durch“). Er regelt keine Befugnis im Rechtssinn. Was eine Auszubildende
//   tatsächlich darf, entscheiden Einrichtung, Praxisanleitung und Recht (PflBG, Delegation). Darum bleiben die
//   Grundwerte einstellbar (einrichtung.ts).
// - Der Lehrplan fasst das 1. und 2. Drittel fast überall zusammen („1./2. Ausbildungsdrittel“). Eigene Inhalte des
//   1. Drittels haben nur CE 01–03. Ein Unterschied zwischen 1. und 2. Drittel ist daher meist nicht belegbar.
// - Stichworte sind kurze Umschreibungen, keine Lehrplantexte.

import type { BefugnisLevel, Quelle, Rolle } from './typen';

export const LEHRPLAN_TITEL = 'Landeslehrplan BW Berufsfachschule für Pflege (3BFP), 2020';

export type Drittelangabe = '1.' | '1./2.' | '3.';
/** massnahme = die Handlung selbst ist genannt · kompetenz = nur über eine allgemeine Kompetenz ableitbar */
export type StellenArt = 'massnahme' | 'kompetenz';
export type Staerke = 'ausdruecklich' | 'abgeleitet' | 'nicht-belegt';

export interface LehrplanStelle {
  seite: number;
  ce: string;                   // „05“
  drittel: Drittelangabe;
  abschnitt: string;            // „Handlungsmuster“, „Kompetenz III.2.b“
  stichwort: string;
  art: StellenArt;
}

export interface Nachweis {
  stellen: LehrplanStelle[];
  /** Kurz, warum der Grundwert so gesetzt ist (v. a. bei „nicht belegt“). */
  anmerkung?: string;
  /** Abweichung vom Vorschlag in KONZEPT.md 6.1 oder Stelle, an der der Lehrplan mehr zulassen würde. */
  abweichung?: string;
}

const s = (seite: number, ce: string, drittel: Drittelangabe, abschnitt: string, stichwort: string, art: StellenArt = 'massnahme'): LehrplanStelle =>
  ({ seite, ce, drittel, abschnitt, stichwort, art });

/** Alle verwendeten Fundstellen (geprüft am 18.11.2026 am hochgeladenen PDF). */
export const LP = {
  // Grundsätze: Aufsicht, Mitwirkung, Eigenständigkeit
  aufsicht1: s(14, '02', '1.', 'Kompetenz IV.2.a', 'Beruf unter Aufsicht und Anleitung von Pflegefachpersonen ausüben', 'kompetenz'),
  mitwirken12: s(53, '05', '1./2.', 'Kompetenz III.2.b', 'an ärztlich veranlassten Maßnahmen im Rahmen des Kenntnisstands mitwirken', 'kompetenz'),
  stabil12: s(54, '05', '1./2.', 'Kompetenz III.2.d', 'Diagnostik/Therapie unterstützen, Durchführung in stabilen Situationen', 'kompetenz'),
  komplStabil12: s(54, '05', '1./2.', 'Kompetenz III.2.c', 'Pflegephänomene und Komplikationen in stabilen Situationen beobachten', 'kompetenz'),
  eigenstaendig3: s(55, '05', '3.', 'Kompetenz III.2.b', 'ärztlich veranlasste Maßnahmen eigenständig durchführen', 'kompetenz'),
  invasiv3: s(55, '05', '3.', 'Kompetenz III.2.d', 'auch bei invasiven Maßnahmen umfassend unterstützen und begleiten', 'kompetenz'),
  instabil3: s(55, '05', '3.', 'Kompetenz III.2.c', 'Komplikationen auch in instabilen, krisenhaften Situationen beobachten', 'kompetenz'),
  einschaetzung3: s(55, '05', '3.', 'Kompetenz III.2.f', 'Einschätzungen interprofessionell vertreten', 'kompetenz'),
  eigenverantw3: s(56, '05', '3.', 'Kompetenz IV.2.a', 'Beruf eigenverantwortlich ausüben', 'kompetenz'),
  abgrenzen1: s(13, '02', '1.', 'Kompetenz III.1.a', 'Verantwortungs- und Aufgabenbereiche im Team abgrenzen', 'kompetenz'),
  delegation3: s(58, '05', '3.', 'Kontextbedingungen', 'Delegation einschließlich Anordnungen, Aufklärung, Einwilligung'),

  // CE 02 (1. Drittel): Grundpflege, Beobachtung, Dokumentation
  daten1: s(13, '02', '1.', 'Kompetenz I.2.a', 'pflegebezogene Daten erheben', 'kompetenz'),
  ziele1: s(13, '02', '1.', 'Kompetenz I.1.e', 'Pflegeziele vorschlagen, Wirksamkeit gemeinsam evaluieren', 'kompetenz'),
  doku1: s(13, '02', '1.', 'Kompetenz I.1.f', 'Maßnahmen und Beobachtungen dokumentieren'),
  beziehung1: s(13, '02', '1.', 'Kompetenz II.1.b/c', 'Beziehung aufbauen, verbal und nonverbal kommunizieren'),
  barrieren1: s(13, '02', '1.', 'Kompetenz II.1.e', 'Kommunikationsbarrieren erkennen und überbrücken'),
  selbstpflege1: s(13, '02', '1.', 'Kompetenz II.2.a', 'informieren und bei der Selbstpflege anleiten'),
  hygiene1: s(18, '02', '1.', 'Handlungsmuster', 'Händehygiene nach RKI-Empfehlung'),
  mobil1: s(15, '02', '1.', 'Handlungsmuster 02 A', 'Orts- und Positionswechsel unterstützen, Mobilitätsrisiken einschätzen'),
  umgebung1: s(15, '02', '1.', 'Handlungsmuster 02 A', 'sichere Umgebung gestalten'),
  standards1: s(16, '02', '1.', 'Handlungsmuster 02 A', 'Expertenstandards Mobilität, Sturzprophylaxe, Dekubitusprophylaxe'),
  vital1: s(18, '02', '1.', 'Handlungsmuster 02 B', 'Gesundheitszustand inkl. Vitalwerte beobachten und dokumentieren'),
  messgeraete1: s(19, '02', '1.', 'Handlungsmuster 02 B', 'digitale Messinstrumente und technische Hilfsmittel fachgerecht anwenden'),
  selbstversorgung1: s(18, '02', '1.', 'Handlungsmuster 02 B', 'Körperpflege, Mundhygiene, Essen/Trinken, Ausscheidung unterstützen'),
  ernaehrung1: s(19, '02', '1.', 'Handlungsmuster 02 B', 'Expertenstandard Ernährungsmanagement, Harnkontinenz'),
  aspiration1: s(20, '02', '1.', 'Didaktischer Kommentar', 'Anreichen von Nahrung, Aspirationsprophylaxe'),
  hilfsmittel1: s(19, '02', '1.', 'Handlungsmuster 02 B', 'bei der Hilfsmittelversorgung unterstützen (Hören, Sehen)'),

  // CE 04, 05, 07, 08 (kurative Pflege)
  diabetes12: s(33, '04', '1./2.', 'Handlungsmuster', 'Information, Schulung, Beratung bei Diabetes Typ 2'),
  schulung04_12: s(33, '04', '1./2.', 'Handlungsmuster', 'Gesundheitskommunikation: Information und Schulung verschiedener Zielgruppen'),
  praevention04_12: s(33, '04', '1./2.', 'Handlungsmuster', 'präventive Angebote bei gesundheitlichen Risiken (z. B. Lebensstil nach Herzinfarkt)'),
  beratung04_3: s(33, '04', '3.', 'Handlungsmuster', 'spezielle Gesundheitskommunikation: Beratung verschiedener Zielgruppen'),
  aufnahme12: s(59, '05', '1./2.', 'Handlungsmuster', 'Patientenaufnahme, Pflegebedarf feststellen, Pflegeprozess steuern'),
  zuAbleitungen12: s(59, '05', '1./2.', 'Handlungsmuster', 'Assistenz bei ärztlichen Interventionen, z. B. Umgang mit Zu- und Ableitungen'),
  sbar12: s(59, '05', '1./2.', 'Handlungsmuster', 'Zusammenarbeit im Team, Visite nach SBAR'),
  wunde12: s(59, '05', '1./2.', 'Handlungsmuster', 'Wundmanagement, Verbandwechsel bei unkomplizierten Wunden'),
  schmerz12: s(59, '05', '1./2.', 'Handlungsmuster', 'Schmerzmanagement akut, Assessments nach Alter und bei kognitiver Beeinträchtigung'),
  thermo12: s(59, '05', '1./2.', 'Handlungsmuster', 'Thermoregulation'),
  pharma12: s(59, '05', '1./2.', 'Handlungsmuster', 'Interventionen zur Unterstützung der erwünschten Wirkung von Arzneistoffen'),
  zirkulation12: s(59, '05', '1./2.', 'Handlungsmuster', 'Interventionen zur Zirkulation von Blut und Flüssigkeiten'),
  wasser12: s(59, '05', '1./2.', 'Handlungsmuster', 'Elektrolyt-, Säure-Basen- und Wasserhaushalt'),
  atem12: s(60, '05', '1./2.', 'Handlungsmuster', 'Durchgängigkeit der Atemwege und Gasaustausch fördern'),
  risiko12: s(60, '05', '1./2.', 'Handlungsmuster', 'Risikomanagement, Entlassungsmanagement (Grundlagen)'),
  medi12: s(103, '07', '1./2.', 'Handlungsmuster', 'Schmerzmanagement und Verabreichung von Medikamenten auf ärztliche Anordnung'),
  assistenz12: s(129, '08', '1./2.', 'Handlungsmuster', 'ärztlich angeordnete Maßnahmen durchführen, Assistenz z. B. bei Punktionen'),
  palliativ12: s(129, '08', '1./2.', 'Handlungsmuster', 'Begleitung sterbender Menschen und ihrer Bezugspersonen'),
  pflegeprozess3: s(60, '05', '3.', 'Handlungsmuster', 'Pflegebedarf in komplexen Lagen feststellen, Pflegeprozess steuern'),
  pharma3: s(60, '05', '3.', 'Handlungsmuster', 'Arzneimittelwirkung in Krisensituationen unterstützen (z. B. Schock)'),
  atem3: s(60, '05', '3.', 'Handlungsmuster', 'Atemunterstützung in komplexen Situationen'),
  wasser3: s(60, '05', '3.', 'Handlungsmuster', 'Flüssigkeits-, Elektrolyt- und Säure-Basen-Haushalt regulieren'),
  wunde3: s(60, '05', '3.', 'Handlungsmuster', 'Wundmanagement bei komplizierten Wunden'),
  schmerz3: s(60, '05', '3.', 'Handlungsmuster', 'Schmerzmanagement bei komplizierten Schmerzen'),
  bezugspersonen3: s(60, '05', '3.', 'Handlungsmuster', 'Bezugspersonen unterstützen und einbinden'),
  medfehler3: s(57, '05', '3.', 'Handlungsanlässe', 'Medikationsfehler, Nebenwirkungen und Wechselwirkungen'),
  intensiv3: s(57, '05', '3.', 'Handlungsanlässe', 'OP mit intensivtherapeutischer Nachbehandlung, akute Verschlechterung'),
  intensivBesuch3: s(62, '05', '3.', 'Lern- und Arbeitsaufgaben', 'Besuch einer Intensivstation'),

  // CE 06 Akutsituationen
  sofort12: s(78, '06', '1./2.', 'Kompetenz I.4.a', 'lebenserhaltende Sofortmaßnahmen bis zum Eintreffen der Ärztin einleiten'),
  sofort3: s(79, '06', '3.', 'Kompetenz I.4.a', 'lebenserhaltende Sofortmaßnahmen bis zum Eintreffen der Ärztin einleiten'),
  notfallplan12: s(78, '06', '1./2.', 'Kompetenz I.4.c', 'Notfallsituationen erkennen, nach Notfallplan handeln'),
  notruf12: s(82, '06', '1./2.', 'Handlungsmuster', 'Kommando-Kommunikation, Notruf mit 5 W'),
  triage12: s(82, '06', '1./2.', 'Handlungsmuster', 'Triage'),
  ersteHilfe12: s(82, '06', '1./2.', 'Handlungsmuster', 'Erste Hilfe, Sofortmaßnahmen bei Herzinfarkt, Lungenembolie, Schock'),
  notfallmedi12: s(82, '06', '1./2.', 'Handlungsmuster', 'Verabreichung von Notfallmedikamenten nach ärztlicher Anordnung'),
  rea12: s(82, '06', '1./2.', 'Handlungsmuster', 'Reanimation nach Leitlinie (BLS, ALS, PALS)'),
  vitalScreening12: s(82, '06', '1./2.', 'Handlungsmuster', 'Screening- und Assessmentinstrumente zur Einschätzung der Vitalfunktionen'),
  sbarNotfall12: s(82, '06', '1./2.', 'Handlungsmuster', 'Informationsweitergabe nach SBAR'),
  psychErsteHilfe12: s(82, '06', '1./2.', 'Handlungsmuster', 'emotionale Stabilisierung, psychologische Erste Hilfe'),
  erklaeren12: s(82, '06', '1./2.', 'Handlungsmuster', 'Maßnahmen erklären, verrichtungsbegleitende Kommunikation'),
  suizid12: s(80, '06', '1./2.', 'Handlungsanlässe', 'Selbst- und Fremdgefährdung, Suizidversuch'),
  als3: s(83, '06', '3.', 'Simulative Lernumgebungen', 'Advanced Life Support (Erwachsene/Kinder)'),
  gewalt3: s(83, '06', '3.', 'Handlungsmuster', 'Anzeichen von Gewalt erkennen und ansprechen'),
  ersthelfer3: s(83, '06', '3.', 'Handlungsmuster', 'Ersthelfende koordinieren, Bezugspersonen stabilisieren'),

  // CE 09, 10, 11
  biografie12: s(152, '09', '1./2.', 'Handlungsmuster', 'Biografiearbeit'),
  neugeborene12: s(169, '10', '1./2.', 'Handlungsmuster', 'Atmung einschätzen, Sauerstoffsättigung messen, Temperaturmanagement'),
  inhalation3: s(170, '10', '3.', 'Handlungsmuster', 'Inhalationen, atemunterstützende Maßnahmen, Peak-Flow'),
  hypo3: s(170, '10', '3.', 'Handlungsmuster', 'Hypo- und Hyperglykämie früh erkennen und vermeiden'),
  insulin3: s(171, '10', '3.', 'Handlungsmuster', 'Schulung zu Ernährung, Aktivität und Insulin'),
  // CE 07 Rehabilitatives Pflegehandeln (P17b, geprüft am 19.11.2026)
  bezugAnleiten12: s(97, '07', '1./2.', 'Kompetenz II.2.a', 'Bezugspersonen bei der Fremdpflege anleiten', 'kompetenz'),
  rehaSelbst12: s(103, '07', '1./2.', 'Handlungsmuster', 'Selbstständigkeit bei Beeinträchtigung der Selbstversorgung fördern, Schulung zur Alltagsbewältigung'),
  rehaInterprof12: s(103, '07', '1./2.', 'Handlungsmuster', 'interprofessionellen Rehaprozess mitgestalten, therapeutisch Erlerntes in den Alltag übernehmen'),
  rehaBeratung3: s(104, '07', '3.', 'Handlungsmuster', 'Bezugspersonen zur Wiedererlangung der eigenständigen Lebensführung beraten und schulen'),
  validation12: s(192, '11', '1./2.', 'Handlungsmuster', 'Beziehungsgestaltung bei veränderter Realitätswahrnehmung, z. B. Validation; Milieugestaltung'),
  uebergabe12: s(192, '11', '1./2.', 'Handlungsmuster', 'Beobachtungen bei Übergaben und Fallbesprechungen weitergeben'),
  krise3: s(192, '11', '3.', 'Handlungsmuster', 'psychische Krisen erkennen, kurzfristige Hilfe, Deeskalation'),
  fem3: s(193, '11', '3.', 'Lern- und Arbeitsaufgaben', 'freiheitsentziehende Maßnahmen beobachten und reflektieren (nicht anwenden)'),
  // P19 (Fallwelle Kinder/Psyche, geprüft am 19.11.2026 am hochgeladenen PDF)
  hygieneKind12: s(163, '10', '1./2.', 'Kompetenz III.2.a', 'Anforderungen der Hygiene beachten, Grundregeln der Infektionsprävention anwenden', 'kompetenz'),
  schutzKind12: s(170, '10', '1./2.', 'Handlungsmuster', 'physischen und psychischen Schutz und Sicherheit gewährleisten'),
  fluessigkeitKind3: s(170, '10', '3.', 'Handlungsmuster', 'Sicherung von Flüssigkeitszufuhr und Entspannung'),
  milieu12: s(192, '11', '1./2.', 'Handlungsmuster', 'Kommunikation bei psychischen und kognitiven Einschränkungen, Milieugestaltung'),
  risikoPsych12: s(192, '11', '1./2.', 'Handlungsmuster', 'begünstigende Faktoren ermitteln, Risikofaktoren und Ausmaß der Beeinträchtigung einschätzen'),
  sucht3: s(190, '11', '3.', 'Handlungsanlässe', 'Sucht und Verhaltensstörungen durch psychotrope Substanzen'),
} as const satisfies Record<string, LehrplanStelle>;

export type LpSchluessel = keyof typeof LP;

/** Nachweis bauen: Stellen über Schlüssel aus LP. */
export function nachweis(stellen: LpSchluessel[], mehr: Omit<Nachweis, 'stellen'> = {}): Nachweis {
  return { stellen: stellen.map((k) => LP[k]), ...mehr };
}
export const NICHT_BELEGT = (anmerkung: string, abweichung?: string): Nachweis => ({ stellen: [], anmerkung, abweichung });

/** Welche Stellen eine Spalte tragen: Kompetenzen wirken kumulativ weiter (was im 1. Drittel gelernt ist, gilt im 3.). */
function deckt(stelle: LehrplanStelle, rolle: Rolle): boolean {
  if (rolle === 1) return stelle.drittel !== '3.';
  if (rolle === 2) return stelle.drittel !== '3.';
  return true;
}

/**
 * Belegstärke je Spalte. Die Pflegefachperson ist höchstens „abgeleitet“ (Abschlussniveau, nicht Berufsrecht).
 * Ist eine Maßnahme im 1./2. Drittel „gesperrt“ und ordnet der Lehrplan sie erst dem 3. Drittel zu, gilt die Sperre als
 * abgeleitet belegt (die Handlung wird vorher nicht gelernt).
 */
export function spaltenStaerke(n: Nachweis, rolle: Rolle, level?: BefugnisLevel): Staerke {
  const passend = n.stellen.filter((x) => deckt(x, rolle));
  if (passend.length === 0) {
    return level === 'gesperrt' && (rolle === 1 || rolle === 2) && n.stellen.some((x) => x.drittel === '3.') ? 'abgeleitet' : 'nicht-belegt';
  }
  if (rolle !== 'pflegefachperson' && passend.some((x) => x.art === 'massnahme')) return 'ausdruecklich';
  return 'abgeleitet';
}

/** Gesamtstärke = schwächste Spalte der drei Drittel. */
export function staerke(n: Nachweis, befugnis?: Record<Rolle, BefugnisLevel>): Staerke {
  const r = ([1, 2, 3] as const).map((d) => spaltenStaerke(n, d, befugnis?.[d]));
  return r.includes('nicht-belegt') ? 'nicht-belegt' : r.includes('abgeleitet') ? 'abgeleitet' : 'ausdruecklich';
}

/** Hinweise, wo der Unterschied zwischen zwei Dritteln nicht aus dem Lehrplan folgt. */
export function unbelegteUnterschiede(n: Nachweis, befugnis: Record<Rolle, string>): string[] {
  const h: string[] = [];
  if (befugnis[1] !== befugnis[2] && !n.stellen.some((x) => x.drittel === '1.')) {
    h.push('Unterschied 1./2. Drittel nicht belegbar (Lehrplan fasst beide zusammen)');
  }
  if (befugnis[2] !== befugnis[3] && !n.stellen.some((x) => x.drittel === '3.')) {
    h.push('Unterschied 2./3. Drittel nicht aus einer Stelle des 3. Drittels belegt');
  }
  return h;
}

export function fundstelle(x: LehrplanStelle): string {
  return `S. ${x.seite} (CE ${x.ce}, ${x.drittel} Drittel, ${x.abschnitt})`;
}

/** Für MassnahmeDefinition.befugnisBeleg. Ohne Stelle: undefined (= Grundwert, nicht belegt). */
export function alsQuelle(n: Nachweis): Quelle | undefined {
  if (n.stellen.length === 0) return undefined;
  return { id: 'lehrplan-bw-3bfp', titel: LEHRPLAN_TITEL, fundstelle: n.stellen.map(fundstelle).join('; ') };
}
