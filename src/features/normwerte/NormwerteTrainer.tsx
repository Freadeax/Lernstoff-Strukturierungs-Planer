import { TrainerSeite } from '../quiz/TrainerSeite';
import { normwertGrundlage } from '../quiz/grundlage';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function NormwerteTrainer() {
  return (
    <TrainerSeite grundlage={normwertGrundlage}
      titel="Normwerte-Trainer"
      intro="Normbereiche von Vitalzeichen, Blutzucker, Laborwerten und Ausscheidung bei Erwachsenen kennen und gemessene Werte richtig einstufen. Funktioniert offline."
      hinweis="Übliche Richtwerte für Erwachsene. Laborgrenzen unterscheiden sich je nach Labor und Methode: Maßgeblich ist der Referenzbereich auf dem Befund, bei Kindern gelten andere Werte."
      pfad="/lernen/normwerte" quelle="normwerte" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
