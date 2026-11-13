// Fachliche Freigabe je Fall im KI-Fallsimulator (Audit SIM-02, Modell in src/ui/sim/freigabe.ts).
// Alle Fälle sind didaktische Modelle und fachlich ungeprüft, bis eine Pflegefachperson sie prüft und
// hier Rolle und Datum einträgt. Bei KI-Fällen prüft man Ausgangslage, verborgenen Verlauf und die
// Bewertungsregeln; den frei erzeugten Text kann niemand vorab freigeben.
// Neue Fälle: Eintrag ergänzen (freigaben.test.ts prüft Vollständigkeit).

import type { Freigabe, Risiko, Zielgruppe } from '../../ui/sim/freigabe';
import { monitorGruppe, type MonitorGruppe } from '../../ui/sim/monitor';
import type { Szenario } from './faelle';

const ROLLE = 'Pflegefachperson mit Praxisanleitung; bei Medikamenten- und Notfallinhalten zusätzlich ärztliche Durchsicht';
const ABCDE = { titel: 'Resuscitation Council UK: The ABCDE approach', stand: '2021' };
const SBAR = { titel: 'AHRQ TeamSTEPPS (SBAR)', stand: '2023' };
const NEWS2 = { titel: 'Royal College of Physicians: NEWS2', stand: '2017' };
const VERLAUF_KI = [{ datum: '2026-10-25', text: 'Ausgangslage angelegt' }, { datum: '2026-11-11', text: 'Freigabefelder ergänzt, Prüfung ausstehend' }];
const VERLAUF_PROBE = [{ datum: '2026-11-10', text: 'Probefall angelegt' }, { datum: '2026-11-11', text: 'Abzweige ergänzt, Freigabefelder ergänzt, Prüfung ausstehend' }];
const KI_PUNKT = 'Verborgener Verlauf und Bewertung der KI: realistisch und ohne Handlungsanweisung über die Ausbildung hinaus';

type Eintrag = { lernziele: string[]; geltung: string; risiken: Risiko[]; pruefpunkte?: string[]; quellen?: Freigabe['quellen'] };

const HYPO_Q = { titel: 'JBDS: Hospital management of hypoglycaemia', stand: '2023' };
const ANAPH_Q = { titel: 'Resuscitation Council UK: Emergency treatment of anaphylaxis', stand: '2021' };
const ASTHMA_Q = { titel: 'Nationale VersorgungsLeitlinie Asthma', stand: '2024' };

const FAELLE: Record<string, Eintrag> = {
  // Probefälle ohne KI: Text, Abzweige und Wertungen stehen fest in demo.ts und sind vollständig prüfbar.
  'demo-atemnot': { geltung: 'Erwachsene, internistische Station, Nachtdienst, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Lagerung und Sauerstoff nur nach Anordnung/SOP', 'Vitalwerte je Etappe'],
    lernziele: ['Nächtliche Atemnot bei Herzinsuffizienz strukturiert einschätzen', 'Atemerleichternd lagern und Vitalzeichen messen', 'Die Ärztin nach SBAR informieren'] },
  'demo-hypo': { geltung: 'Erwachsene, stationäre Langzeitpflege, ab 1. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Glukosegabe nur bei sicherem Schlucken', 'Insulin erst nach BZ-Kontrolle'], quellen: [HYPO_Q],
    lernziele: ['Unruhe und Schwitzen vor dem Essen als möglichen Unterzucker erkennen', 'Blutzucker messen und Glukose sicher geben', 'Insulingabe zurückstellen und Rücksprache halten'] },
  'demo-nachblutung': { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Schockzeichen, Kompression, Lagerung'],
    lernziele: ['Nachblutung und beginnenden Schock nach OP erkennen', 'Druck ausüben, Hilfe holen, Vitalzeichen engmaschig messen', 'Blutverlust und Verlauf dokumentieren und übergeben'] },
  'demo-asthma': { geltung: 'Kinder (7 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall', 'medikament'], pruefpunkte: ['Kinder-Normwerte und Alarmgrenzen statt Erwachsenen-NEWS2', 'Notfallspray mit Spacer, Notfallplan'], quellen: [ASTHMA_Q],
    lernziele: ['Schweren Asthmaanfall beim Kind erkennen (Sprechdyspnoe, Einziehungen)', 'Atemerleichternd lagern und Notfallplan klären', 'Die Mutter beruhigen und einbeziehen'] },
  'demo-sepsis': { geltung: 'Erwachsene, internistische Station, ab 2. Ausbildungsjahr', risiken: ['notfall', 'medikament'], pruefpunkte: ['Sepsis-Kriterien, Blutkulturen vor Antibiotikum, Zeitfenster erste Stunde'],
    lernziele: ['Neue Verwirrtheit bei Infekt als mögliche Sepsis erkennen', 'Die Ärztin mit dem Verdacht „Sepsis“ nach SBAR alarmieren', 'Blutkulturen vor Antibiotikum, Bilanz und engmaschige Kontrolle umsetzen'] },
  'demo-schlaganfall': { geltung: 'Erwachsene, orthopädische Station, ab 1. Ausbildungsjahr', risiken: ['notfall', 'medikament'], pruefpunkte: ['BE-FAST, Zeitpunkt zuletzt normal, Blutdruck nicht eigenmächtig senken', 'Thromboseprophylaxe in der Übergabe'],
    lernziele: ['Schlaganfallzeichen mit BE-FAST erkennen', 'Zeitpunkt zuletzt normal sichern und sofort alarmieren', 'Aspiration verhindern und die Verlegung nach SBAR übergeben'] },
  'demo-anaphylaxie': { geltung: 'Erwachsene, internistische Station, ab 2. Ausbildungsjahr', risiken: ['notfall', 'medikament'], pruefpunkte: ['Infusion stoppen, Adrenalin i.m. nach SOP, Lagerung nach Beschwerden'], quellen: [ANAPH_Q],
    lernziele: ['Anaphylaxie bei Infusion erkennen', 'Auslöser stoppen, Zugang belassen, Hilfe holen', 'Adrenalin i.m. vorbereiten und Allergie dokumentieren'] },
  'demo-fieberkrampf': { geltung: 'Kinder (2 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall'], pruefpunkte: ['Kinder-Normwerte und Alarmgrenzen statt Erwachsenen-NEWS2', 'Krampfdauer, Seitenlage, Notfallmedikation nur nach Standard'],
    lernziele: ['Fieberkrampf erkennen, Dauer messen und vor Verletzung schützen', 'Nach dem Krampf Atemwege frei halten', 'Eltern anleiten und Diagnosefragen an die Ärztin geben'] },
  'demo-bronchiolitis': { geltung: 'Säugling (4 Monate), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall'], pruefpunkte: ['Säuglings-Normwerte und Alarmgrenzen statt Erwachsenen-NEWS2', 'Ziel-Sättigung, Magensonde und Infusion nach Hausstandard', 'Kontaktisolierung bei RSV'],
    lernziele: ['Atemarbeit, Atempausen und Trinkmenge beim Säugling einschätzen', 'Nase freimachen, sicher lagern und früh ärztlich informieren', 'RSV-Kontaktisolierung einhalten und Alarme hörbar lassen'] },
  'demo-herzschwaeche': { geltung: 'Erwachsene, Ambulante Pflege, ab 2. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Gewichtsgrenze 2 kg in 3 Tagen, Trinkmengenvorgabe', 'Kontraindikation Kompression bei dekompensierter Herzinsuffizienz', 'Telefonische Anordnung im ambulanten Dienst'],
    lernziele: ['Dekompensation an Gewicht, Ödemen und Atemnot im Liegen erkennen', 'Medikamenteneinnahme prüfen und die Hausärztin mit Werten informieren', 'Selbstbestimmung respektieren und einen Notfallplan vereinbaren'] },
  // KI-Fälle aus faelle.ts
  herzinsuffizienz: { geltung: 'Erwachsene, internistische Station, ab 2. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Flüssigkeitsbilanz, Diuretikum nur nach Anordnung'],
    lernziele: ['Kardiale Dekompensation an Gewicht, Ödemen und Orthopnoe erkennen', 'Oberkörper hoch lagern und Ärztin informieren', 'Bilanz und Gewicht als Verlaufskontrolle nutzen'] },
  'hueft-tep': { geltung: 'Erwachsene, Unfallchirurgie, ab 1. Ausbildungsjahr', risiken: [], pruefpunkte: ['Delirscreening, Mobilisation nach Kreislaufkontrolle'],
    lernziele: ['Hypoaktives Delir nach OP erkennen', 'Trinkmenge, Schmerz und Sturzrisiko einschätzen', 'Mobilisation vorbereitet und sicher durchführen'] },
  hypoglykaemie: { geltung: 'Erwachsene, stationäre Langzeitpflege, ab 1. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Glukosegabe nur bei sicherem Schlucken'], quellen: [HYPO_Q],
    lernziele: ['Unterzucker an Schwitzen und Unruhe erkennen', 'Blutzucker messen und Glukose sicher geben', 'Insulinplan und Essen prüfen'] },
  pneumonie: { geltung: 'Erwachsene, stationäre Langzeitpflege, ab 1. Ausbildungsjahr', risiken: [], pruefpunkte: ['Schluckstörung, Aspirationsprophylaxe'],
    lernziele: ['Aspirationspneumonie bei Schluckstörung erkennen', 'Vitalzeichen erheben und Hausarzt informieren', 'Aspirationsprophylaxe beim Essen umsetzen'] },
  schlaganfall: { geltung: 'Erwachsene, orthopädische Station, ab 1. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['BE-FAST, Zeitfenster, keine orale Gabe'],
    lernziele: ['Schlaganfallzeichen mit BE-FAST erkennen', 'Zeitpunkt des Symptombeginns sichern', 'Sofort eskalieren, nichts zu essen oder trinken geben'] },
  dekubitus: { geltung: 'Erwachsene, ambulante Pflege, ab 1. Ausbildungsjahr', risiken: [], quellen: [{ titel: 'DNQP Expertenstandard Dekubitusprophylaxe', stand: '2017' }],
    lernziele: ['Dekubitus Kategorie 1 mit Fingertest erkennen', 'Bewegungsplan mit der pflegenden Angehörigen vereinbaren', 'Hautbeobachtung und Risiko dokumentieren'] },
  fieberkrampf: { geltung: 'Kinder (2 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall'], pruefpunkte: ['Kinder-Normwerte statt Erwachsenen-NEWS2', 'Krampfdauer, Seitenlage, Notfallmedikation nur nach Anordnung'],
    lernziele: ['Fieberkrampf erkennen und das Kind vor Verletzung schützen', 'Krampfdauer messen und Hilfe holen', 'Eltern beruhigen und informieren'] },
  palliativ: { geltung: 'Erwachsene, stationäre Langzeitpflege, ab 2. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Symptomkontrolle nur nach Anordnung, Patientenverfügung'],
    lernziele: ['Patientenverfügung und Willen der Bewohnerin beachten', 'Angehörige in der Sterbephase begleiten', 'Symptome erfassen und Linderung organisieren'] },
  sepsis: { geltung: 'Erwachsene, internistische Station, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Sepsis-Kriterien, Eskalationszeitpunkt'],
    lernziele: ['Sepsis an Bewusstsein, Atemfrequenz und Blutdruck erkennen', 'Sofort eskalieren', 'Verlauf engmaschig dokumentieren'] },
  nachblutung: { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Schockzeichen, Kompression, Lagerung'],
    lernziele: ['Nachblutung und Schockzeichen nach OP erkennen', 'Sofortmaßnahmen und Eskalation einleiten', 'Blutverlust und Vitalzeichen dokumentieren'] },
  copd: { geltung: 'Erwachsene, ambulante Pflege, ab 2. Ausbildungsjahr', risiken: ['geraet', 'medikament'], pruefpunkte: ['Sauerstoff nur nach Verordnung, Zielsättigung bei COPD'],
    lernziele: ['Exazerbation einer COPD erkennen', 'Heimsauerstoff nach Verordnung prüfen', 'Hausarzt oder Notruf passend einschalten'] },
  'sturz-nacht': { geltung: 'Erwachsene, stationäre Langzeitpflege, Nachtdienst, ab 1. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Kopfverletzung unter Antikoagulation, Neurocheck'],
    lernziele: ['Nach einem Sturz zuerst Bewusstsein und Verletzungen prüfen', 'Blutverdünner als Risiko für Hirnblutung einordnen', 'Sturz dokumentieren und Arzt informieren'] },
  anaphylaxie: { geltung: 'Erwachsene, internistische Station, ab 2. Ausbildungsjahr', risiken: ['notfall', 'medikament'], pruefpunkte: ['Infusion stoppen, Adrenalin i.m. nach SOP'], quellen: [ANAPH_Q],
    lernziele: ['Anaphylaxie bei Infusion erkennen', 'Infusion stoppen und sofort Hilfe holen', 'Adrenalin i.m. als Mittel der ersten Wahl kennen'] },
  lungenembolie: { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Lagerung, Sauerstoff, Eskalation'],
    lernziele: ['Plötzliche Atemnot nach OP als mögliche Lungenembolie erkennen', 'Oberkörper hoch lagern und Hilfe holen', 'Thromboseprophylaxe einordnen'] },
  'delir-nacht': { geltung: 'Erwachsene, Unfallchirurgie, Nachtdienst, ab 2. Ausbildungsjahr', risiken: [], pruefpunkte: ['Keine freiheitsentziehenden Maßnahmen ohne rechtliche Grundlage'],
    lernziele: ['Delir von Demenz unterscheiden', 'Auslöser systematisch suchen', 'Beruhigen und Zugang sichern ohne Zwang'] },
  'asthma-kind': { geltung: 'Kinder (7 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall', 'medikament'], pruefpunkte: ['Kinder-Normwerte und Alarmgrenzen statt Erwachsenen-NEWS2', 'Notfallspray mit Spacer, Notfallplan'], quellen: [ASTHMA_Q],
    lernziele: ['Schweren Asthmaanfall beim Kind erkennen', 'Atemerleichternd lagern und Notfallplan klären', 'Eltern einbeziehen'] },
  'demenz-verfuegung': { geltung: 'Erwachsene, stationäre Langzeitpflege, ab 2. Ausbildungsjahr', risiken: [], pruefpunkte: ['Patientenverfügung, Pneumoniezeichen'],
    lernziele: ['Pneumoniezeichen bei Demenz trotz untypischer Symptome erkennen', 'Patientenverfügung und mutmaßlichen Willen beachten', 'Angehörige und Hausarzt einbeziehen'] },
};

/** Alter in Jahren aus der Kurzbeschreibung („Ben, 7 Jahre, …“), sonst null. */
export function alterAus(kurz: string): number | null {
  const m = /(\d{1,3})\s*Jahre/.exec(kurz);
  if (m) return Number(m[1]);
  // Säuglinge: „4 Monate“ oder „3 Wochen“ als Bruchteil eines Jahres
  const monate = /(\d{1,2})\s*Monate?\b/.exec(kurz);
  if (monate) return Number(monate[1]) / 12;
  const wochen = /(\d{1,2})\s*Wochen?\b/.exec(kurz);
  return wochen ? Number(wochen[1]) / 52 : null;
}

export function zielgruppeVon(s: Pick<Szenario, 'setting' | 'kurz'>): Zielgruppe {
  const alter = alterAus(s.kurz);
  if (alter !== null) return alter < 1 ? 'neugeborene' : alter < 18 ? 'kinder' : 'erwachsene';
  return s.setting === 'paediatrie' ? 'kinder' : 'erwachsene';
}

/** Altersgruppe für den Monitor; Kinder ohne Altersangabe gelten als Kleinkind. */
export function monitorGruppeVon(s: Pick<Szenario, 'setting' | 'kurz'>): MonitorGruppe {
  const alter = alterAus(s.kurz);
  if (alter !== null) return monitorGruppe(alter);
  return s.setting === 'paediatrie' ? 'kleinkind' : 'erwachsen';
}

export function freigabeFuerFall(s: Pick<Szenario, 'id' | 'titel' | 'setting' | 'kurz'>): Freigabe {
  const zielgruppe = zielgruppeVon(s);
  const probe = s.id.startsWith('demo-');
  const e: Eintrag = FAELLE[s.id] ?? {
    // Freier Fall zu einem Lernplan-Thema: nur die Bewertungsregeln sind prüfbar.
    geltung: `Freier KI-Fall zum Thema „${s.titel}“`, risiken: zielgruppe === 'erwachsene' ? [] : ['kinder'],
    lernziele: [`Den Pflegeprozess zum Thema „${s.titel}“ einmal durchlaufen`, 'Verschlechterung rechtzeitig erkennen und eskalieren'],
  };
  return {
    status: 'ungeprueft', lernziele: e.lernziele, geltung: e.geltung, zielgruppe,
    quellen: [ABCDE, SBAR, ...(zielgruppe === 'erwachsene' ? [NEWS2] : []), ...(e.quellen ?? [])],
    prueferrolle: ROLLE, aenderungen: probe ? VERLAUF_PROBE : VERLAUF_KI, risiken: e.risiken,
    pruefpunkte: [...(e.pruefpunkte ?? []), ...(probe ? [] : [KI_PUNKT])],
  };
}

export const FREIGABE_FAELLE = Object.keys(FAELLE);
