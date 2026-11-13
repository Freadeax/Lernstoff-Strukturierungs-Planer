// DNQP: Wer, wie, wozu. Sinngemäß nach dem DNQP-Methodenpapier (11/2025), der Stellungnahme
// „Nutzung von Expertenstandards“ (11/2022) und der Standardübersicht (09/2026).

import type { GrundlagenAbschnitt, Quelle } from './typen';
import { UEBERSICHT_URL } from './standards/bau';

const METHODE: Quelle = { titel: 'DNQP-Methodenpapier, Fassung November 2025', url: 'https://www.dnqp.de/fileadmin/HSOS/Homepages/DNQP/Dateien/Weitere/DNQP-Methodenpapier2025.pdf', geprueftAm: '2026-11-12', art: 'auszug' };
const NUTZUNG: Quelle = { titel: 'DNQP-Lenkungsausschuss: Nutzung von Expertenstandards (2022)', url: 'https://www.dnqp.de/fileadmin/HSOS/Homepages/DNQP/Dateien/Weitere/DNQP_Nutzung_von_Expertenstandards.pdf', geprueftAm: '2026-11-12', art: 'auszug' };
export const UEBERSICHT: Quelle = { titel: 'DNQP: Übersicht über die verfügbaren Veröffentlichungen, Stand September 2026', url: UEBERSICHT_URL, geprueftAm: '2026-11-12', art: 'auszug' };

export const GRUNDLAGEN: GrundlagenAbschnitt[] = [
  {
    id: 'dnqp', titel: 'Was ist das DNQP?', quelle: METHODE,
    punkte: [
      'Das Deutsche Netzwerk für Qualitätsentwicklung in der Pflege (DNQP) ist ein bundesweiter Zusammenschluss von Fachleuten aus Pflegepraxis, -wissenschaft, -management und -bildung.',
      'Sitz ist die Hochschule Osnabrück (Fakultät Wirtschafts- und Sozialwissenschaften). Das Netzwerk besteht seit Anfang der 1990er-Jahre und finanziert sich aus dem Verkauf seiner Veröffentlichungen.',
      'Seit 1999 entwickelt das DNQP Expertenstandards in Zusammenarbeit mit dem Deutschen Pflegerat (DPR).',
      'Ein Lenkungsausschuss steuert die Arbeit inhaltlich und entscheidet, zu welchen Themen neue Standards entstehen.',
    ],
  },
  {
    id: 'begriff', titel: 'Was ist ein Expertenstandard?', quelle: METHODE,
    punkte: [
      'Ein evidenzbasiertes, monodisziplinäres Instrument: Er beschreibt den spezifischen Beitrag der Pflege zu einem zentralen Qualitätsrisiko (z. B. Dekubitus, Sturz, Schmerz).',
      'Er legt Zielsetzung und Qualitätsniveau fest und lässt Raum für den Einzelfall und die Gestaltung in der Einrichtung.',
      'Er richtet sich vor allem an Pflegefachkräfte, nimmt aber auch die Leitung der Einrichtung in die Pflicht (Strukturkriterien).',
      'Die Steuerung des Pflegeprozesses ist seit 2020 vorbehaltene Tätigkeit der Pflegefachkraft (§ 4 PflBG); die Standards folgen den Schritten des Pflegeprozesses.',
    ],
  },
  {
    id: 'aufbau', titel: 'Aufbau jedes Standards', quelle: METHODE,
    punkte: [
      'Präambel: Bedeutung des Themas, Zielgruppe, Anwender, Voraussetzungen und Begriffe.',
      'Standardaussage (Zielsetzung) und Begründung.',
      'Kriterientabelle mit 5 bis 6 Ebenen; jede Ebene hat Struktur- (S), Prozess- (P) und Ergebniskriterien (E) nach Donabedian.',
      'Struktur: was Pflegefachkraft (Wissen, Kompetenz) und Einrichtung (Verfahrensregel, Material, Personal) mitbringen. Prozess: was die Pflegefachkraft tut. Ergebnis: was beim Menschen oder in der Dokumentation nachweisbar ist.',
      'Die Ebenen folgen dem Pflegeprozess: Einschätzung → Planung → Information/Schulung/Beratung → Durchführung/Koordination → Evaluation.',
      'Dazu kommen Kommentierungen zu jedem Kriterium und eine Literaturstudie.',
    ],
  },
  {
    id: 'entstehung', titel: 'Wie ein Standard entsteht', quelle: METHODE,
    punkte: [
      'Themenauswahl: Kurzgutachten, Entscheidung durch den Lenkungsausschuss, öffentliche Ausschreibung der wissenschaftlichen Leitung.',
      'Expertenarbeitsgruppe: wissenschaftliche Leitung und bis zu 15 Fachleute aus Praxis und Wissenschaft, dazu mindestens eine Vertretung der Betroffenen.',
      'Systematische Literaturstudie (zwei unabhängige Reviewer, Bewertung der Evidenz nach GRADE).',
      'Entwurf mit Präambel, Kriterien und Kommentierungen.',
      'Konsensus-Konferenz: Die Fachöffentlichkeit diskutiert den Entwurf, der etwa vier Wochen vorher verschickt wird.',
      'Modellhafte Implementierung in Praxiseinrichtungen mit anschließendem Audit; laut Methodenpapier rund 25 Einrichtungen über mindestens sechs Monate.',
      'Veröffentlichung der endgültigen Fassung mit Implementierungsbericht. Von der Themenwahl bis zum Ende der Implementierung vergehen in der Regel etwa drei Jahre.',
      'Regelmäßige Aktualisierung, wenn sich der Wissensstand ändert.',
    ],
  },
  {
    id: 'verbindlichkeit', titel: 'Wie verbindlich sind Expertenstandards?', quelle: NUTZUNG,
    punkte: [
      'Die Empfehlungen haben laut DNQP den höchstmöglichen Empfehlungscharakter; ein Gesetz sind sie nicht.',
      'Sie gelten als Ausdruck des allgemein anerkannten Stands pflegerischen Wissens. Abweichungen sind im Einzelfall möglich, müssen aber fachlich begründet und dokumentiert werden.',
      'Für Pflegeeinrichtungen nach SGB XI verlangt § 11 Abs. 1 SGB XI Pflege nach dem allgemein anerkannten Stand medizinisch-pflegerischer Erkenntnisse. Diesen Stand geben die Expertenstandards wieder.',
      'Über § 113a SGB XI können Standards für Pflegeeinrichtungen verbindlich eingeführt werden. Bisher ist das für keinen Standard geschehen (der Mobilitätsstandard wurde dafür entwickelt, aber nicht in Kraft gesetzt).',
      'Verantwortung auf drei Ebenen: Pflegefachkraft (Wissen, Umsetzung), Einrichtung (Verfahrensregeln, Ressourcen), Gesellschaft (Rahmenbedingungen). Missbrauch, z. B. als Argument gegen angemessene Vergütung, lehnt der Lenkungsausschuss ab.',
    ],
  },
  {
    id: 'audit', titel: 'Audit und Umsetzung im Alltag', quelle: METHODE,
    punkte: [
      'Zu jedem Standard gibt es ein Auditinstrument, mit dem Einrichtungen prüfen, wie weit die Kriterien erfüllt sind.',
      'Die Einführung ist Aufgabe der Leitung und des ganzen Betriebs: Verfahrensregel, Fortbildung, Material, Personal.',
      'Expertenstandards werden als Buch verkauft; frei zugänglich sind Auszüge mit Präambel und Kriterientabelle. Für die Prüfung immer mit dem Original abgleichen.',
    ],
  },
];
