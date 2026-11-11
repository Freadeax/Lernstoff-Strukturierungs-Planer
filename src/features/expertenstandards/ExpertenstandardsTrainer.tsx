import { TrainerSeite } from '../quiz/TrainerSeite';
import { standardGrundlage } from '../quiz/grundlage';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function ExpertenstandardsTrainer() {
  return (
    <TrainerSeite grundlage={standardGrundlage}
      titel="Expertenstandards-Trainer"
      intro="Aufbau der DNQP-Expertenstandards (Struktur, Prozess, Ergebnis) und ihre Kernaussagen zu Dekubitus, Sturz, Ernährung, Kontinenz, Schmerz, chronischen Wunden, Entlassung und Demenz. Funktioniert offline."
      hinweis="Die Aufgaben fassen Kernaussagen zusammen und ersetzen nicht den Originaltext. Die aktuelle Fassung jedes Standards steht in der Standardübersicht des DNQP."
      pfad="/lernen/expertenstandards" quelle="expertenstandards" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
