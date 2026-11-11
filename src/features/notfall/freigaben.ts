// Fachliche Freigabe und Leitlinienstand je Reanimationsprofil (Audit: „Erwachsene, Kinder und
// Neugeborene als getrennt geprüfte Profile … Leitlinienstand je Inhalt“). Gemeinsames Modell aus
// src/ui/sim/freigabe.ts. Bis eine Fachperson prüft, steht „fachlich ungeprüft“ am Start und am
// Entscheidungsort.

import type { Freigabe, Quelle } from '../../ui/sim/freigabe';
import type { ProfilId } from './rea';

const ROLLE = 'Reanimationstrainer:in (z. B. ERC-Instruktor:in) und Pflegefachperson mit Praxisanleitung; Medikamente zusätzlich ärztliche Durchsicht';
const ERC_2025 = 'Abgleich mit den ERC-Leitlinien 2025 (Inhalte stehen auf ERC 2021)';
const VERLAUF = [{ datum: '2026-11-11', text: 'Reanimationsübung Erwachsene angelegt' }, { datum: '2026-11-11', text: 'Profile Kinder und Neugeborene ergänzt, Freigabe ausstehend' }];

/** Leitlinienstand je Inhalt: Quelle und Stand, sichtbar am Start. */
export const LEITLINIEN: Record<ProfilId, Quelle[]> = {
  erwachsene: [{ titel: 'ERC Guidelines: Basic Life Support (Erwachsene)', stand: '2021' }, { titel: 'ERC Guidelines: Advanced Life Support (Erwachsene)', stand: '2021' }],
  kinder: [{ titel: 'ERC Guidelines: Paediatric Life Support', stand: '2021' }],
  neugeborene: [{ titel: 'ERC Guidelines: Newborn Resuscitation and Support of Transition of Infants at Birth', stand: '2021' }],
};

export const PROFIL_FREIGABE: Record<ProfilId, Freigabe> = {
  erwachsene: {
    status: 'ungeprueft', zielgruppe: 'erwachsene', geltung: 'Erwachsene, innerklinischer Kreislaufstillstand, ab 1. Ausbildungsjahr', prueferrolle: ROLLE,
    lernziele: ['Kreislaufstillstand in unter 10 Sekunden erkennen und Hilfe holen', 'Thoraxkompressionen 30:2 mit 100–120/min und kurzen Pausen', 'Schockbare und nicht schockbare Rhythmen unterscheiden'],
    quellen: LEITLINIEN.erwachsene, aenderungen: VERLAUF, risiken: ['notfall', 'medikament', 'geraet'],
    pruefpunkte: [ERC_2025, 'Medikamentenhinweise Adrenalin/Amiodaron', 'Zykluszeit und Schockablauf'],
  },
  kinder: {
    status: 'ungeprueft', zielgruppe: 'kinder', geltung: 'Kinder ab 1 Jahr bis zur Pubertät, innerklinisch, ab 2. Ausbildungsjahr', prueferrolle: ROLLE,
    lernziele: ['Kreislaufstillstand beim Kind als meist hypoxisch einordnen', '5 initiale Beatmungen, dann 15:2 mit 100–120/min', 'Gewichtsbezogene Dosen und Schockenergie (4 J/kg) kennen'],
    quellen: LEITLINIEN.kinder, aenderungen: VERLAUF, risiken: ['kinder', 'notfall', 'medikament', 'geraet'],
    pruefpunkte: [ERC_2025, 'Adrenalin 10 µg/kg, Amiodaron 5 mg/kg, Schock 4 J/kg', 'Reihenfolge Alarm, Beatmung, Lebenszeichen'],
  },
  neugeborene: {
    status: 'ungeprueft', zielgruppe: 'neugeborene', geltung: 'Reife Neugeborene direkt nach der Geburt, Kreißsaal/Neonatologie, ab 3. Ausbildungsjahr', prueferrolle: `${ROLLE}; Neonatologie`,
    lernziele: ['Wärme, Atemweg und Blähbeatmung vor jeder Kompression', 'Herzfrequenz als Leitgröße einordnen (unter 60, 60–100, über 100/min)', 'Kompressionen 3:1 mit etwa 120 Ereignissen pro Minute'],
    quellen: LEITLINIEN.neugeborene, aenderungen: VERLAUF, risiken: ['kinder', 'notfall', 'medikament'],
    pruefpunkte: [ERC_2025, 'Toleranz 100–140 Ereignisse/min ist didaktisch, keine Leitlinienangabe', 'Adrenalin 20 µg/kg über Nabelvene', 'Frühgeborene sind nicht abgebildet'],
  },
};

/** ABCDE-Notfallübung: Freigabe je Notfall (Erwachsene). */
const ABCDE_QUELLE: Quelle = { titel: 'Resuscitation Council UK: The ABCDE approach', stand: '2021' };
const ABCDE_VERLAUF = [{ datum: '2026-11-11', text: 'ABCDE-Übung angelegt, Freigabe ausstehend' }];
const abcde = (geltung: string, lernziele: string[], quellen: Quelle[], pruefpunkte: string[], risiken: Freigabe['risiken'] = ['notfall', 'medikament']): Freigabe => ({
  status: 'ungeprueft', zielgruppe: 'erwachsene', geltung, prueferrolle: 'Pflegefachperson mit Praxisanleitung und ärztliche Durchsicht (Notfallmedizin)',
  lernziele, quellen: [ABCDE_QUELLE, ...quellen], aenderungen: ABCDE_VERLAUF, risiken, pruefpunkte: ['Werteverlauf ist ein didaktisches Modell, keine validierte Physiologie', ...pruefpunkte],
});

export const NOTFALL_FREIGABE: Record<string, Freigabe> = {
  anaphylaxie: abcde('Erwachsene, Normalstation, ab 2. Ausbildungsjahr',
    ['Anaphylaxie an A-, B- oder C-Problem plus Hautzeichen erkennen', 'Auslöser stoppen, Hilfe holen, Adrenalin i.m. als erste Wahl', 'Lagerung nach Atemnot und Kreislauf wählen'],
    [{ titel: 'Resuscitation Council UK: Emergency treatment of anaphylaxis', stand: '2021' }], ['Adrenalin 0,5 mg i.m. und Wiederholung nach 5 Minuten', 'Lagerung bei Atemnot vs. Schock']),
  hypoglykaemie: abcde('Erwachsene, stationäre Langzeitpflege, Nachtdienst, ab 1. Ausbildungsjahr',
    ['Bei Bewusstseinsstörung immer Blutzucker messen', 'Bei eingetrübtem Bewusstsein nichts oral geben', 'Glukagon nur nach ärztlichem Notfallplan, Notruf absetzen'],
    [{ titel: 'JBDS: The hospital management of hypoglycaemia in adults with diabetes', stand: '2023' }], ['Glukagon-Dosis und Applikationsweg nach Präparat', 'BZ-Grenzen der Bewusstseinsstufen (Modell)']),
  sepsis: abcde('Erwachsene, Notaufnahme, ab 2. Ausbildungsjahr',
    ['Sepsis an Fieber, Atemfrequenz, Blutdruck und neuer Verwirrtheit erkennen', 'Sofort eskalieren, Blutkulturen vor Antibiose', 'Volumen und Antibiose in der ersten Stunde'],
    [{ titel: 'Surviving Sepsis Campaign: International Guidelines', stand: '2021' }], ['qSOFA nur als Warnzeichen, nicht als Diagnose', 'Volumenmenge nach Anordnung']),
};
