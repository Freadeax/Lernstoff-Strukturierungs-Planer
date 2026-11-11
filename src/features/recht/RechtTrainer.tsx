import { TrainerSeite } from '../quiz/TrainerSeite';
import { rechtGrundlageMit } from '../quiz/grundlage';
import { AUFGABEN, BEREICHE } from './aufgaben';

const bereichVon = new Map(Object.entries(AUFGABEN).flatMap(([b, liste]) => liste.map((a) => [a.id, b] as const)));
const grundlage = rechtGrundlageMit((id) => bereichVon.get(id));

export default function RechtTrainer() {
  return (
    <TrainerSeite grundlage={grundlage}
      titel="Recht-Trainer"
      intro="Schweigepflicht, Strafrecht und Haftung, Delegation und Vorbehaltsaufgaben, freiheitsentziehende Maßnahmen, Betreuung und Vorsorge, Pflegegrade sowie Arbeitszeit und Mutterschutz an erfundenen Fällen üben. Funktioniert offline."
      hinweis="Grundlage sind die Gesetzestexte (StGB, BGB, PflBG, SGB V, SGB XI, ArbZG, MuSchG) und übliche Lehrbuchinhalte. Keine Rechtsberatung: Im Einzelfall gelten Hausregelungen, Rechtsprechung und die Auskunft der Vorgesetzten. Für die Prüfung gilt dein Unterrichtsmaterial."
      pfad="/lernen/recht" quelle="recht" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
