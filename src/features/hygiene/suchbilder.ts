// Suchbilder zum Hygiene-Trainer: Raumfotos aus dem gemeinsamen Katalog (14 Isolierzimmer,
// 19 Materialraum) mit Fundstellen. Grundlage wie der Trainer (KRINKO, TRBA 250, Aktion Saubere
// Hände); im Zweifel gilt der Hygieneplan der Einrichtung. Fachlich ungeprüftes Lernmodell.

import type { RaumId } from '../../ui/sim/raeume/katalog';

export interface Fundstelle { id: string; titel: string; text: string }
export interface Suchbild { id: string; raum: RaumId; titel: string; auftrag: string; funde: Fundstelle[] }

export const SUCHBILDER: Suchbild[] = [
  {
    id: 'isolierung', raum: '14_station_isolation', titel: 'Im Isolierzimmer',
    auftrag: 'Finde die Stellen, an denen Hygiene im Isolierzimmer entschieden wird.',
    funde: [
      { id: 'schutzkleidung', titel: 'Schutzkleidung im Vorraum', text: 'Schutzkittel und Handschuhe vor dem Betreten anlegen, je nach Erreger zusätzlich Mund-Nasen-Schutz oder FFP2-Maske. Abgelegt wird vor dem Verlassen im Zimmer oder in der Schleuse, danach folgt die Händedesinfektion.' },
      { id: 'haendehygiene', titel: 'Händedesinfektion', text: 'Vor und nach dem Patientenkontakt, vor aseptischen Tätigkeiten, nach Kontakt mit potenziell infektiösem Material und nach Kontakt mit der Patientenumgebung (5 Momente). Handschuhe ersetzen sie nicht.' },
      { id: 'patient', titel: 'Patient', text: 'Patientenbezogenes Material wie Stethoskop, Blutdruckmanschette und Thermometer bleibt im Zimmer. Besuchende werden angeleitet.' },
      { id: 'monitor', titel: 'Geräte und Flächen', text: 'Patientennahe Flächen und Geräte mindestens täglich wischdesinfizieren, mit einem Mittel, das gegen den Erreger wirksam ist (zum Beispiel bei Norovirus).' },
      { id: 'abwurf', titel: 'Abwurf', text: 'Abfall und Wäsche im Zimmer sammeln und verschlossen ausschleusen. Spitze und scharfe Gegenstände sofort in den durchstichsicheren Abwurf, ohne Recapping.' },
    ],
  },
  {
    id: 'material', raum: '19_krankenhaus_materialraum', titel: 'Im Materialraum',
    auftrag: 'Was gilt hier für Lagerung und Richten von Material?',
    funde: [
      { id: 'regal', titel: 'Regal mit Sterilgut', text: 'Sterilgut trocken, staubgeschützt und möglichst geschlossen lagern. Vor Gebrauch Verfallsdatum und unversehrte Verpackung prüfen. Ältere Ware nach vorn.' },
      { id: 'handschuhe', titel: 'Handschuhe', text: 'Einmalhandschuhe schützen dich, ersetzen aber keine Händedesinfektion: vorher und nach dem Ausziehen desinfizieren. Mit Handschuhen nichts im Lager anfassen.' },
      { id: 'wagen', titel: 'Wagen', text: 'Arbeitsfläche vor dem Richten wischdesinfizieren und trocknen lassen. Reines und unreines Material getrennt halten.' },
      { id: 'arbeitsplatz', titel: 'Arbeitsplatz', text: 'Tastatur, Maus und Telefon sind Kontaktflächen: nach Plan desinfizieren und nicht mit Handschuhen bedienen.' },
    ],
  },
];
