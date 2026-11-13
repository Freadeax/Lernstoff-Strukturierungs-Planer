import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function GrundlagenTrainer() {
  return (
    <TrainerSeite
      titel="Grundlagen-Trainer"
      intro="Fachsprache sicher nutzen (Wortbausteine, Lage und Richtung, Abkürzungen) und die Grundlagen des Pflegeberufs üben: Kommunikation, Pflegemodelle, Qualität und Forschung, Versorgungsstrukturen. Funktioniert offline."
      hinweis="Grundlage ist übliches Lehrbuchwissen; für die Prüfung gilt dein Unterrichtsmaterial. Abkürzungen unterscheiden sich zwischen Einrichtungen: Maßgeblich ist die Abkürzungsliste deines Hauses."
      pfad="/lernen/grundlagen" quelle="grundlagen" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
