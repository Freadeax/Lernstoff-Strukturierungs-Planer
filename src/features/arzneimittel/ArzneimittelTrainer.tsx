import { TrainerSeite } from '../quiz/TrainerSeite';
import { arzneimittelGrundlage } from '../quiz/grundlage';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function ArzneimittelTrainer() {
  return (
    <TrainerSeite grundlage={arzneimittelGrundlage}
      titel="Arzneimittel-Trainer"
      intro="Sicherer Umgang mit Arzneimitteln (6-R-Regel, Richten, Betäubungsmittel), Applikationsformen, Wirkstoffgruppen an der Endung erkennen und Nebenwirkungen beobachten. Funktioniert offline. Dosierungen rechnen geht im Rechentrainer."
      hinweis="Lehrbuchwissen für die Pflege. Maßgeblich sind die ärztliche Verordnung, die Fachinformation und der Standard deiner Einrichtung."
      pfad="/lernen/arzneimittel" quelle="arzneimittel" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
