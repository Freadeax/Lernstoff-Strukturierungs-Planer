import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function LaborTrainer() {
  return (
    <TrainerSeite
      titel="Labor-Trainer"
      intro="Blutentnahme ohne Präanalytikfehler, Blutgasanalysen in Schritten deuten und Laborbefunde pflegerisch einordnen. Funktioniert offline. Zum Ausprobieren im Fall: Labor und Bildgebung."
      hinweis="Übliche Richtwerte für Erwachsene, didaktisch vereinfacht. Röhrchenfarben und Grenzwerte richten sich nach dem eigenen Haus und dem Referenzbereich auf dem Befund."
      pfad="/lernen/labor" quelle="labor" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
