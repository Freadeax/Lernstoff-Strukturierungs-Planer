import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function GrundlagenTrainer() {
  return (
    <TrainerSeite
      titel="Grundlagen-Trainer"
      intro="Fachsprache sicher nutzen: Fachwörter aus Vorsilbe, Stamm und Endung erschließen, Lage- und Richtungsbegriffe anwenden, Abkürzungen aus Übergabe, Befund und Anordnung auflösen. Funktioniert offline."
      hinweis="Grundlage ist übliches Lehrbuchwissen. Abkürzungen unterscheiden sich zwischen Einrichtungen: Maßgeblich ist die Abkürzungsliste deines Hauses."
      pfad="/lernen/grundlagen" quelle="grundlagen" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
