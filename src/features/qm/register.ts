// Inhaltsregister der Übungstrainer: je Trainer Quellen mit Stand, Geltung, Prüferrolle und Prüfpunkte.
// Gleiches Freigabe-Modell wie die Simulatoren (src/ui/sim/freigabe.ts), damit „fachlich geprüft“
// überall dasselbe heißt. Solange keine Fachperson geprüft hat, bleibt der Status „ungeprueft“.
// Die Grundlage je Aufgabe (quiz/grundlage.ts) zeigt dieselbe Quelle an der einzelnen Frage.

import type { Freigabe, Quelle } from '../../ui/sim/freigabe';
import type { FehlerQuelle } from '../fehlerheft/fehlerheft';
import {
  anatomieGrundlage, arzneimittelGrundlage, grundlagenGrundlage, hygieneGrundlage, laborGrundlage, normwertGrundlage,
  notfallGrundlage, rechtGrundlage, standardGrundlage, type Grundlage,
} from '../quiz/grundlage';

export interface TrainerEintrag {
  quelle: FehlerQuelle;
  name: string;
  pfad: string;
  grundlage: Grundlage;
  freigabe: Freigabe;
}

const PA = 'Pflegefachperson mit Praxisanleitung';
const ANGELEGT = (text: string) => [{ datum: '2026-11-13', text }];

function eintrag(quelle: FehlerQuelle, name: string, pfad: string, grundlage: Grundlage, f: Omit<Freigabe, 'status' | 'aenderungen' | 'zielgruppe'> & { aenderungen?: Freigabe['aenderungen'] }): TrainerEintrag {
  return {
    quelle, name, pfad, grundlage,
    freigabe: { status: 'ungeprueft', zielgruppe: 'erwachsene', aenderungen: f.aenderungen ?? ANGELEGT('Ins Inhaltsregister aufgenommen, fachliche Prüfung ausstehend'), ...f },
  };
}

const q = (titel: string, stand: string): Quelle => ({ titel, stand });

export const TRAINER_REGISTER: TrainerEintrag[] = [
  eintrag('hygiene', 'Hygiene', '/lernen/hygiene', hygieneGrundlage, {
    geltung: 'Krankenhaus und stationäre Langzeitpflege, ab 1. Ausbildungsjahr', prueferrolle: `${PA} und Hygienefachkraft`,
    lernziele: ['Indikationen der Händedesinfektion sicher anwenden', 'PSA nach Übertragungsweg wählen'],
    quellen: [q('KRINKO-Empfehlungen (RKI), u. a. Händehygiene', '2016'), q('Infektionsschutzgesetz (IfSG)', '2026'), q('WHO: 5 Moments for Hand Hygiene', '2009')],
    risiken: [], pruefpunkte: ['Abgleich mit dem Hygieneplan der Schule', 'Erregerspezifische Maßnahmen (MRSA, MRGN, Noro, C. diff.)'],
  }),
  eintrag('anatomie', 'Anatomie', '/lernen/anatomie', anatomieGrundlage, {
    geltung: 'Grundlagen für alle Ausbildungsjahre', prueferrolle: 'Lehrkraft für Anatomie und Physiologie',
    lernziele: ['Strukturen an Schemazeichnungen benennen', 'Funktionen und Wege (Blutkreislauf, Harnbildung) in Reihenfolge bringen'],
    quellen: [q('Lehrbücher Anatomie und Physiologie für Pflegeberufe', 'Lehrbuchstand')],
    risiken: [], pruefpunkte: ['Schemazeichnungen: Lage der Marken', 'Fachbegriffe in deutscher und lateinischer Form'],
  }),
  eintrag('expertenstandards', 'Expertenstandards', '/lernen/expertenstandards', standardGrundlage, {
    geltung: 'Alle Versorgungsbereiche, ab 1. Ausbildungsjahr', prueferrolle: PA,
    lernziele: ['Aufbau der Expertenstandards (Struktur, Prozess, Ergebnis) erklären', 'Kernaussagen einzelner Standards anwenden'],
    quellen: [q('DNQP-Expertenstandards, jeweils aktuelle Fassung laut DNQP-Lernmodul', '2026')],
    risiken: [], pruefpunkte: ['Fassung je Standard gegen dnqp.de', 'Neu erscheinende Aktualisierungen (DNQP-Lernmodul)'],
  }),
  eintrag('normwerte', 'Normwerte', '/lernen/normwerte', normwertGrundlage, {
    geltung: 'Erwachsene; Kinderwerte nur, wo ausdrücklich genannt', prueferrolle: `${PA}; Laborwerte zusätzlich ärztliche Durchsicht`,
    lernziele: ['Vitalzeichen und wichtige Laborwerte einordnen', 'Abweichungen erkennen und melden'],
    quellen: [q('Lehrbuch-Referenzbereiche, gerundet', 'Lehrbuchstand'), q('NEWS2 (Royal College of Physicians)', '2017')],
    risiken: ['medikament'], pruefpunkte: ['Referenzbereiche gegen den Befund des Ausbildungslabors', 'Einheiten (mg/dl vs. mmol/l)'],
  }),
  eintrag('notfall', 'Notfall', '/lernen/notfall', notfallGrundlage, {
    geltung: 'Erwachsene, innerklinisch und Langzeitpflege; Kinderfragen getrennt markiert', prueferrolle: 'Reanimationstrainer:in (z. B. ERC-Instruktor:in) und Pflegefachperson mit Praxisanleitung',
    lernziele: ['Kreislaufstillstand erkennen und Basismaßnahmen in richtiger Reihenfolge', 'Akute Notfälle nach ABCDE einschätzen und melden'],
    quellen: [q('ERC Guidelines: Basic Life Support', '2021'), q('ERC Guidelines: Paediatric Life Support', '2021'), q('Resuscitation Council UK: The ABCDE approach', '2021')],
    risiken: ['notfall', 'kinder', 'medikament'], pruefpunkte: ['Vollständiger Abgleich mit den ERC-Leitlinien 2025 (BLS-Ablauf schon angepasst)', 'Notfallablauf der Schule und der Einsatzorte'],
    aenderungen: [
      { datum: '2026-11-13', text: 'Ins Inhaltsregister aufgenommen, fachliche Prüfung ausstehend' },
      { datum: '2026-11-13', text: 'BLS-Ablauf nach ERC 2025: erst Hilfe rufen, dann Atmung prüfen' },
    ],
  }),
  eintrag('arzneimittel', 'Arzneimittel', '/lernen/arzneimittel', arzneimittelGrundlage, {
    geltung: 'Erwachsene, ab 1. Ausbildungsjahr; keine Dosisentscheidungen', prueferrolle: `${PA} und ärztliche oder pharmazeutische Durchsicht`,
    lernziele: ['6-R-Regel und Applikationswege sicher anwenden', 'Typische Neben- und Wechselwirkungen beobachten'],
    quellen: [q('Lehrbuch Arzneimittellehre für Pflegeberufe', 'Lehrbuchstand'), q('Fachinformationen der Wirkstoffgruppen', 'je Präparat')],
    risiken: ['medikament'], pruefpunkte: ['Wirkstoffbeispiele und Handelsnamen', 'Beobachtungsschwerpunkte je Gruppe'],
  }),
  eintrag('recht', 'Recht', '/lernen/recht', rechtGrundlage, {
    geltung: 'Deutschland, Bundesrecht, ab 1. Ausbildungsjahr', prueferrolle: 'Lehrkraft für Recht in der Pflegeausbildung',
    lernziele: ['Schweigepflicht, Haftung und Delegation an Fällen anwenden', 'Betreuungsrecht nach der Reform 2023 einordnen'],
    quellen: [q('StGB, BGB, PflBG, SGB V, SGB XI, ArbZG, MuSchG', '2026'), q('Betreuungsrechtsreform', '2023')],
    risiken: [], pruefpunkte: ['Paragrafenangaben gegen gesetze-im-internet.de', 'Neue Gesetzesänderungen seit dem Inhaltsstand'],
  }),
  eintrag('labor', 'Labor', '/lernen/labor', laborGrundlage, {
    geltung: 'Erwachsene; Kinderbereich getrennt', prueferrolle: `${PA}; Befunddeutung zusätzlich ärztliche Durchsicht`,
    lernziele: ['Blutentnahme fehlerfrei vorbereiten (Präanalytik)', 'Blutgasanalyse und Befunde einordnen'],
    quellen: [q('CLSI GP41: Collection of Diagnostic Venous Blood Specimens', '2017'), q('Lehrbuch-Referenzbereiche', 'Lehrbuchstand')],
    risiken: ['kinder'], pruefpunkte: ['Röhrchensystem und Reihenfolge des Ausbildungshauses', 'Kinder-Referenzbereiche'],
  }),
  eintrag('grundlagen', 'Grundlagen', '/lernen/grundlagen', grundlagenGrundlage, {
    geltung: 'Alle Ausbildungsjahre', prueferrolle: 'Lehrkraft der Pflegeschule',
    lernziele: ['Fachsprache und Abkürzungen sicher lesen', 'Berufsrechtliche Grundlagen (PflBG) kennen'],
    quellen: [q('Lehrbücher medizinische Terminologie und Berufskunde', 'Lehrbuchstand'), q('PflBG und PflAPrV', '2026')],
    risiken: [], pruefpunkte: ['Abkürzungsliste der Einsatzorte', 'Berufsrecht nach aktueller Fassung'],
  }),
];

export const registerFuer = (quelle: string): TrainerEintrag | undefined => TRAINER_REGISTER.find((e) => e.quelle === quelle);
