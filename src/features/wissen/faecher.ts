// Inhalte des Wissenstrainers: ein Eintrag je Fachgebiet. Die Aufgaben selbst bleiben in ihren
// Ordnern (anatomie/, hygiene/ …), hier werden sie nur zusammengeführt.
import type { Aufgabe } from '../quiz/quiz';
import type { Figur } from '../quiz/Runde';
import type { TrainerBereich } from '../quiz/TrainerSeite';
import {
  anatomieGrundlage, arzneimittelGrundlage, grundlagenGrundlage, hygieneGrundlage, laborGrundlage, normwertGrundlage,
  notfallGrundlage, rechtGrundlageMit, standardGrundlage, type Grundlage,
} from '../quiz/grundlage';
import type { IconName } from '../../ui/icons';
import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { pfadZu, STANDARDS } from '../dnqp/standards';
import * as anatomie from '../anatomie/aufgaben';
import { FIGUREN } from '../anatomie/figuren';
import { anatomieWeiter } from '../anatomie/verknuepfung';
import * as arzneimittel from '../arzneimittel/aufgaben';
import * as normwerte from '../normwerte/aufgaben';
import * as labor from '../labortrainer/aufgaben';
import * as hygiene from '../hygiene/aufgaben';
import * as notfall from '../notfall/aufgaben';
import * as es from '../expertenstandards/aufgaben';
import * as recht from '../recht/aufgaben';
import * as grundlagen from '../grundlagen/aufgaben';
import { FACH_NAME, type FachId } from './pfad';

export interface Fach {
  id: FachId;
  label: string;
  icon: IconName;
  /** Eine Zeile für die Auswahl. */
  kurz: string;
  intro: string;
  hinweis: string;
  bereiche: TrainerBereich[];
  aufgaben: Record<string, Aufgabe[]>;
  grundlage: Grundlage;
  figuren?: Record<string, Figur>;
  weiter?: (a: Aufgabe) => Array<{ label: string; path: string }>;
  proRunde?: number;
}

const rechtBereich = new Map(Object.entries(recht.AUFGABEN).flatMap(([b, liste]) => liste.map((a) => [a.id, b] as const)));

/** Nach dem Prüfen: passende Standards im DNQP-Lernmodul nachlesen. */
function standardWeiter(a: Aufgabe) {
  const passend = STANDARDS.filter((s) => s.themaIds.some((t) => a.topicIds.includes(t)));
  return passend.length
    ? passend.map((s) => ({ label: `${s.kurztitel} nachlesen`, path: pfadZu(s.id) }))
    : [{ label: 'Alle Expertenstandards nachlesen', path: pfadZu() }];
}

const b = (x: { BEREICHE: TrainerBereich[] }) => x.BEREICHE;
const auf = (x: { AUFGABEN: Record<string, Aufgabe[]> }) => x.AUFGABEN;

export const FAECHER: Fach[] = [
  {
    id: 'anatomie', label: FACH_NAME.anatomie, icon: 'heart', kurz: 'Abbildungen beschriften, Wege durch den Körper, Funktionen',
    intro: 'Abbildungen beschriften, Wege durch den Körper ordnen und Funktionen zuordnen: Zelle und Gewebe, Herz, Atmung, Niere, Verdauung, Skelett, Nervensystem, Auge und Ohr, Haut, Hormone sowie Fortpflanzung.',
    hinweis: 'Die Abbildungen sind Schemazeichnungen, nicht maßstabsgetreu. Wie im Lehrbuch liegt die rechte Körperseite in der Abbildung links. Ohne Bild lösbar: Beim Beschriften zeigt „Ohne Bild lösen“ die Lage jeder Nummer als Text, alles geht auch per Tastatur (Tab und Pfeiltasten).',
    bereiche: b(anatomie), aufgaben: auf(anatomie), grundlage: anatomieGrundlage, figuren: FIGUREN,
    weiter: anatomieWeiter(modules[0] as CatalogModule), proRunde: 6,
  },
  {
    id: 'arzneimittel', label: FACH_NAME.arzneimittel, icon: 'pill', kurz: '6-R-Regel, Applikation, Wirkstoffgruppen, Nebenwirkungen',
    intro: 'Sicherer Umgang mit Arzneimitteln (6-R-Regel, Richten, Betäubungsmittel), Applikationsformen, Wirkstoffgruppen an der Endung erkennen und Nebenwirkungen beobachten. Dosierungen rechnen geht im Rechentrainer.',
    hinweis: 'Lehrbuchwissen für die Pflege. Maßgeblich sind die ärztliche Verordnung, die Fachinformation und der Standard deiner Einrichtung.',
    bereiche: b(arzneimittel), aufgaben: auf(arzneimittel), grundlage: arzneimittelGrundlage,
  },
  {
    id: 'normwerte', label: FACH_NAME.normwerte, icon: 'thermo', kurz: 'Vitalzeichen, Laborwerte, Ausscheidung einstufen',
    intro: 'Normbereiche von Vitalzeichen, Blutzucker, Laborwerten und Ausscheidung bei Erwachsenen kennen und gemessene Werte richtig einstufen.',
    hinweis: 'Übliche Richtwerte für Erwachsene. Laborgrenzen unterscheiden sich je nach Labor und Methode: Maßgeblich ist der Referenzbereich auf dem Befund, bei Kindern gelten andere Werte.',
    bereiche: b(normwerte), aufgaben: auf(normwerte), grundlage: normwertGrundlage,
  },
  {
    id: 'labor', label: FACH_NAME.labor, icon: 'flask', kurz: 'Präanalytik, Blutgas, Befunde, Kinderwerte',
    intro: 'Blutentnahme ohne Präanalytikfehler, Blutgasanalysen in Schritten deuten und Laborbefunde pflegerisch einordnen. Zum Ausprobieren im Fall: Labor und Bildgebung.',
    hinweis: 'Übliche Richtwerte für Erwachsene, im Bereich Kinder und Säuglinge altersabhängige Werte, didaktisch vereinfacht. Röhrchenfarben und Grenzwerte richten sich nach dem eigenen Haus und dem Referenzbereich auf dem Befund.',
    bereiche: b(labor), aufgaben: auf(labor), grundlage: laborGrundlage,
  },
  {
    id: 'hygiene', label: FACH_NAME.hygiene, icon: 'shield', kurz: '5 Momente, Schutzausrüstung, Erreger, Basishygiene',
    intro: 'Händedesinfektion nach den 5 Momenten, Schutzausrüstung an- und ablegen, Übertragungswege und Isolierung, Basishygiene.',
    hinweis: 'Grundlage sind die KRINKO-Empfehlungen, die TRBA 250 und die Aktion Saubere Hände. Im Zweifel gilt der Hygieneplan deiner Einrichtung.',
    bereiche: b(hygiene), aufgaben: auf(hygiene), grundlage: hygieneGrundlage,
  },
  {
    id: 'notfall', label: FACH_NAME.notfall, icon: 'siren', kurz: 'Basismaßnahmen, ABCDE, Notfälle auf Station, Kinder',
    intro: 'Reanimation nach den Basismaßnahmen, Einschätzung nach dem ABCDE-Schema und typische Notfälle auf Station: Unterzuckerung, Schlaganfall, Krampfanfall, Atemnot, Schock und Anaphylaxie.',
    hinweis: 'Grundlage sind die Leitlinien des European Resuscitation Council (ERC 2025) für Erwachsene und Kinder, darunter der Ablauf „erst Hilfe rufen, dann Atmung prüfen“. Übung ersetzt kein praktisches Reanimationstraining. Der Notfallablauf deiner Einrichtung geht vor.',
    bereiche: b(notfall), aufgaben: auf(notfall), grundlage: notfallGrundlage,
  },
  {
    id: 'expertenstandards', label: FACH_NAME.expertenstandards, icon: 'star', kurz: 'Aufbau und Kernaussagen der DNQP-Standards',
    intro: 'Aufbau der DNQP-Expertenstandards (Struktur, Prozess, Ergebnis) und ihre Kernaussagen zu Dekubitus, Sturz, Ernährung, Kontinenz, Schmerz, chronischen Wunden, Entlassung und Demenz.',
    hinweis: 'Die Aufgaben fassen Kernaussagen zusammen und ersetzen nicht den Originaltext. Alle Standards mit Ebenen und aktuellen Fassungen stehen unter Lernen → Expertenstandards (DNQP).',
    bereiche: b(es), aufgaben: auf(es), grundlage: standardGrundlage, weiter: standardWeiter,
  },
  {
    id: 'recht', label: FACH_NAME.recht, icon: 'scale', kurz: 'Schweigepflicht, Haftung, Delegation, Betreuung, Arbeitsrecht',
    intro: 'Schweigepflicht, Strafrecht und Haftung, Delegation und Vorbehaltsaufgaben, freiheitsentziehende Maßnahmen, Betreuung und Vorsorge, Pflegegrade sowie Arbeitszeit und Mutterschutz an erfundenen Fällen üben.',
    hinweis: 'Grundlage sind die Gesetzestexte (StGB, BGB, PflBG, SGB V, SGB XI, ArbZG, MuSchG) und übliche Lehrbuchinhalte. Keine Rechtsberatung: Im Einzelfall gelten Hausregelungen, Rechtsprechung und die Auskunft der Vorgesetzten. Für die Prüfung gilt dein Unterrichtsmaterial.',
    bereiche: b(recht), aufgaben: auf(recht), grundlage: rechtGrundlageMit((id) => rechtBereich.get(id)),
  },
  {
    id: 'grundlagen', label: FACH_NAME.grundlagen, icon: 'book', kurz: 'Fachsprache, Kommunikation, Pflegemodelle, Qualität',
    intro: 'Fachsprache sicher nutzen (Wortbausteine, Lage und Richtung, Abkürzungen) und die Grundlagen des Pflegeberufs üben: Kommunikation, Pflegemodelle, Qualität und Forschung, Versorgungsstrukturen.',
    hinweis: 'Grundlage ist übliches Lehrbuchwissen; für die Prüfung gilt dein Unterrichtsmaterial. Abkürzungen unterscheiden sich zwischen Einrichtungen: Maßgeblich ist die Abkürzungsliste deines Hauses.',
    bereiche: b(grundlagen), aufgaben: auf(grundlagen), grundlage: grundlagenGrundlage,
  },
];

export const FACH: Record<FachId, Fach> = Object.fromEntries(FAECHER.map((f) => [f.id, f])) as Record<FachId, Fach>;

/** Fachgebiet jeder Aufgabe (Kennungen sind über alle Fachgebiete eindeutig, siehe wissen.test.ts). */
export const FACH_VON_AUFGABE = new Map<string, FachId>(
  FAECHER.flatMap((f) => Object.values(f.aufgaben).flat().map((a) => [a.id, f.id] as const)),
);

/** Bereich jeder Aufgabe innerhalb ihres Fachgebiets. */
export const BEREICH_VON_AUFGABE = new Map<string, string>(
  FAECHER.flatMap((f) => Object.entries(f.aufgaben).flatMap(([bereich, liste]) => liste.map((a) => [a.id, bereich] as const))),
);

export const ALLE_FIGUREN: Record<string, Figur> = Object.assign({}, ...FAECHER.map((f) => f.figuren ?? {}));

const fachVon = (a: Aufgabe): Fach => FACH[FACH_VON_AUFGABE.get(a.id) ?? 'grundlagen'];

/** Grundlage und Weiterführendes einer Aufgabe nach ihrem Fachgebiet (für gemischte Runden). */
export const gemischteGrundlage: Grundlage = (a) => fachVon(a).grundlage(a);
export const gemischtWeiter = (a: Aufgabe) => fachVon(a).weiter?.(a) ?? [];

/** Auswahl für eine eigene Runde: „fach.bereich“ oder nur „fach“ (alle Bereiche). */
export function aufgabenAus(auswahl: string[]): Aufgabe[] {
  const out: Aufgabe[] = [];
  const gesehen = new Set<string>();
  for (const s of auswahl) {
    const [f, bereich] = s.split('.');
    const fach = FACH[f as FachId];
    if (!fach) continue;
    const listen = bereich ? [fach.aufgaben[bereich] ?? []] : Object.values(fach.aufgaben);
    for (const a of listen.flat()) if (!gesehen.has(a.id)) { gesehen.add(a.id); out.push(a); }
  }
  return out;
}
