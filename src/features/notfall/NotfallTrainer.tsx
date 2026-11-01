import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function NotfallTrainer() {
  return (
    <TrainerSeite
      titel="Notfall-Trainer"
      intro="Reanimation nach den Basismaßnahmen, Einschätzung nach dem ABCDE-Schema und typische Notfälle auf Station: Unterzuckerung, Schlaganfall, Krampfanfall, Atemnot, Schock und Anaphylaxie. Funktioniert offline."
      hinweis="Grundlage sind die Leitlinien des European Resuscitation Council (ERC 2021) für Erwachsene. Übung ersetzt kein praktisches Reanimationstraining. Der Notfallablauf deiner Einrichtung geht vor."
      pfad="/lernen/notfall" quelle="notfall" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
