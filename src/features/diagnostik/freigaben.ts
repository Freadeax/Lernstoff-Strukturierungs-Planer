// Fachliche Freigabe je Diagnostik-Fall (Audit SIM-02, gemeinsames Modell src/ui/sim/freigabe.ts).
// Alle Fälle sind didaktische Modelle und fachlich ungeprüft, bis eine Fachperson sie prüft und hier
// Rolle und Datum einträgt. Neue Fälle: Eintrag ergänzen (Test prüft Vollständigkeit).

import type { Freigabe, Quelle, Risiko } from '../../ui/sim/freigabe';
import type { DiagnostikFall } from './typen';

const ROLLE = 'Pflegefachperson mit Praxisanleitung; Labor- und Bildbefunde zusätzlich ärztliche Durchsicht';
const PRAEANALYTIK: Quelle = { titel: 'CLSI GP41: Collection of Diagnostic Venous Blood Specimens', stand: '2017' };
const SBAR: Quelle = { titel: 'AHRQ TeamSTEPPS (SBAR)', stand: '2023' };
const NEWS2: Quelle = { titel: 'Royal College of Physicians: NEWS2', stand: '2017' };
const VERLAUF = [{ datum: '2026-11-10', text: 'Fall angelegt' }, { datum: '2026-11-11', text: 'Freigabefelder ergänzt, Prüfung ausstehend' }];

type Eintrag = { lernziele: string[]; geltung: string; risiken: Risiko[]; pruefpunkte?: string[]; quellen?: Quelle[] };

const FAELLE: Record<string, Eintrag> = {
  'sepsis-pneumonie': { geltung: 'Erwachsene, Innere Station, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Blutkulturen vor Antibiotikum, Laktat-Grenzen'],
    quellen: [{ titel: 'Surviving Sepsis Campaign Guidelines', stand: '2021' }],
    lernziele: ['Sepsiszeichen erkennen und Laktat, Blutkulturen und Entzündungswerte sinnvoll anfordern', 'Blutkulturen korrekt und vor dem Antibiotikum abnehmen', 'Kritischen Laborwert quittieren und nach SBAR weitergeben'] },
  lungenembolie: { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall', 'geraet'], pruefpunkte: ['Kontrastmittel-Vorbereitung, Nierenwerte, D-Dimer-Einordnung'],
    quellen: [{ titel: 'ESC Guidelines on acute pulmonary embolism', stand: '2019' }],
    lernziele: ['Plötzliche Atemnot nach OP als mögliche Lungenembolie einordnen', 'CT mit Kontrastmittel vorbereiten (Nierenwerte, Allergie, Zugang)', 'Füllungsdefekt im CT-Fenster finden'] },
  herzinsuffizienz: { geltung: 'Erwachsene, Notaufnahme, ab 2. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['NT-proBNP-Grenzen, Stauungszeichen im Röntgen'],
    quellen: [{ titel: 'ESC Guidelines for heart failure', stand: '2021' }],
    lernziele: ['Stauungszeichen im Röntgen-Thorax erkennen', 'NT-proBNP einordnen und die Kalium-Falle durch Hämolyse erkennen', 'Atemerleichternd lagern und Bilanz begründen'] },
  pneumothorax: { geltung: 'Erwachsene, Notaufnahme, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Pleuralinie im echten Vergleichsbild'],
    quellen: [{ titel: 'BTS Guideline for pleural disease', stand: '2023' }],
    lernziele: ['Pneumothorax im Röntgen an der Pleuralinie erkennen', 'Spannungszeichen als Notfall einordnen', 'Befund strukturiert weitergeben'] },
  ketoazidose: { geltung: 'Erwachsene, Notaufnahme, ab 2. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Kalium unter Insulin, BGA-Deutung'],
    quellen: [{ titel: 'JBDS-IP: Management of diabetic ketoacidosis in adults', stand: '2023' }],
    lernziele: ['Metabolische Azidose in der BGA erkennen und Kompensation einordnen', 'Kalium und BZ unter Insulin engmaschig verfolgen', 'Abnahme nie am Infusionsarm'] },
  'asthma-kind': { geltung: 'Kinder (8 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall', 'medikament'], pruefpunkte: ['Kinderprofil für Puls, Atemfrequenz, Blutdruck', 'Kapilläre BGA, Kalium unter Salbutamol'],
    quellen: [{ titel: 'GINA Global Strategy for Asthma Management and Prevention', stand: '2024' }],
    lernziele: ['Schweren Asthmaanfall beim Schulkind erkennen', 'Steigendes pCO₂ als Warnzeichen der Erschöpfung deuten', 'Werte mit dem Kinderprofil statt mit Erwachsenengrenzen lesen'] },
  'gastroenteritis-kind': { geltung: 'Kinder (2 Jahre), Kinderstation, ab 2. Ausbildungsjahr', risiken: ['kinder'], pruefpunkte: ['Kinder-Referenzbereiche Kreatinin/Harnstoff', 'Hypoglykämie und Ketose beim Kleinkind'],
    quellen: [{ titel: 'ESPGHAN/ESPID Guidelines for acute gastroenteritis in children in Europe', stand: '2014' }],
    lernziele: ['Exsikkose beim Kleinkind erkennen', 'Kreatinin und Harnstoff mit der Kinderreferenz lesen', 'Hungerketose und Hygiene bei infektiöser Gastroenteritis einordnen'] },
  'gi-blutung': { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Hb-Verlauf und Schockzeichen, Kreuzblut'],
    quellen: [{ titel: 'ESGE Guideline: Endoscopic diagnosis and management of nonvariceal upper GI hemorrhage', stand: '2021' }],
    lernziele: ['Gastrointestinale Blutung an Klinik und Hb-Verlauf erkennen', 'Kreuzblut und Gerinnung rechtzeitig anfordern', 'Verlauf von Puls und Blutdruck als Schockzeichen deuten'] },
  hyperkaliaemie: { geltung: 'Erwachsene, Kardiologie, ab 2. Ausbildungsjahr', risiken: ['medikament', 'geraet'], pruefpunkte: ['Hämolyse als Störfaktor, EKG-Überwachung'],
    quellen: [{ titel: 'UK Kidney Association: Treatment of acute hyperkalaemia in adults', stand: '2020' }],
    lernziele: ['Kritisches Kalium von einer hämolytischen Probe unterscheiden', 'Monitor anschließen und Rhythmus beobachten', 'Kritischen Wert sofort ärztlich melden'] },
  'akutes-nierenversagen': { geltung: 'Erwachsene, Innere Station, ab 2. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Oligurie-Grenzen, Kreatinin-Verlauf'],
    quellen: [{ titel: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury', stand: '2012' }],
    lernziele: ['Oligurie und Kreatinin-Anstieg als akutes Nierenversagen einordnen', 'Bilanz und Urinausscheidung genau erfassen', 'Nephrotoxische Einflüsse und Kalium im Blick behalten'] },
};

export function freigabeFuer(fall: Pick<DiagnostikFall, 'id' | 'patient'>): Freigabe | undefined {
  const e = FAELLE[fall.id];
  if (!e) return undefined;
  const alter = fall.patient.alter;
  const zielgruppe = alter < 1 ? 'neugeborene' : alter < 18 ? 'kinder' : 'erwachsene';
  return {
    status: 'ungeprueft', lernziele: e.lernziele, geltung: e.geltung, zielgruppe,
    quellen: [PRAEANALYTIK, SBAR, ...(zielgruppe === 'erwachsene' ? [NEWS2] : []), ...(e.quellen ?? [])],
    prueferrolle: ROLLE, aenderungen: VERLAUF, risiken: e.risiken, pruefpunkte: e.pruefpunkte ?? [],
  };
}

export const FREIGABE_FAELLE = Object.keys(FAELLE);
