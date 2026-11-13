import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';
import { FIGUREN } from './figuren';
import { anatomieWeiter } from './verknuepfung';
import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';

const weiter = anatomieWeiter(modules[0] as CatalogModule);

export default function AnatomieTrainer() {
  return (
    <TrainerSeite
      titel="Anatomie-Trainer"
      intro="Abbildungen beschriften, Wege durch den Körper ordnen und Funktionen zuordnen: Zelle und Gewebe, Herz, Atmung, Niere, Verdauung, Skelett, Nervensystem, Auge und Ohr, Haut, Hormone sowie Fortpflanzung. Funktioniert offline."
      hinweis="Die Abbildungen sind Schemazeichnungen, nicht maßstabsgetreu. Wie im Lehrbuch liegt die rechte Körperseite in der Abbildung links. Ohne Bild lösbar: Beim Beschriften zeigt „Ohne Bild lösen“ die Lage jeder Nummer als Text, alles geht auch per Tastatur (Tab und Pfeiltasten)."
      pfad="/lernen/anatomie" quelle="anatomie" bereiche={BEREICHE} aufgaben={AUFGABEN} figuren={FIGUREN} proRunde={6} weiter={weiter}
    />
  );
}
