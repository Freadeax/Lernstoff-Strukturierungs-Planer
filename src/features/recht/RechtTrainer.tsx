import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function RechtTrainer() {
  return (
    <TrainerSeite
      titel="Recht-Trainer"
      intro="Schweigepflicht, Strafrecht und Haftung, Delegation und Vorbehaltsaufgaben, freiheitsentziehende Maßnahmen, Betreuung und Vorsorge, Pflegegrade sowie Arbeitszeit und Mutterschutz an erfundenen Fällen üben. Funktioniert offline."
      hinweis="Grundlage sind die Gesetzestexte (StGB, BGB, PflBG, SGB V, SGB XI, ArbZG, MuSchG) und übliche Lehrbuchinhalte. Keine Rechtsberatung: Im Einzelfall gelten Hausregelungen, Rechtsprechung und die Auskunft der Vorgesetzten. Für die Prüfung gilt dein Unterrichtsmaterial."
      pfad="/lernen/recht" quelle="recht" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
