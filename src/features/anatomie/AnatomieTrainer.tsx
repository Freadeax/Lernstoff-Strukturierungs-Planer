import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';
import { FIGUREN } from './figuren';

export default function AnatomieTrainer() {
  return (
    <TrainerSeite
      titel="Anatomie-Trainer"
      intro="Abbildungen beschriften, Wege durch den Körper ordnen und Funktionen zuordnen: Herz, Atmung, Niere, Verdauung, Skelett, Nervensystem, Auge und Ohr sowie Haut. Funktioniert offline."
      hinweis="Die Abbildungen sind Schemazeichnungen, nicht maßstabsgetreu. Wie im Lehrbuch liegt die rechte Körperseite in der Abbildung links."
      pfad="/lernen/anatomie" quelle="anatomie" bereiche={BEREICHE} aufgaben={AUFGABEN} figuren={FIGUREN} proRunde={6}
    />
  );
}
