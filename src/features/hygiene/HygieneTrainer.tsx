import { TrainerSeite } from '../quiz/TrainerSeite';
import { AUFGABEN, BEREICHE } from './aufgaben';

export default function HygieneTrainer() {
  return (
    <TrainerSeite
      titel="Hygiene-Trainer"
      intro="Händedesinfektion nach den 5 Momenten, Schutzausrüstung an- und ablegen, Übertragungswege und Isolierung, Basishygiene. Funktioniert offline."
      hinweis="Grundlage sind die KRINKO-Empfehlungen, die TRBA 250 und die Aktion Saubere Hände. Im Zweifel gilt der Hygieneplan deiner Einrichtung."
      pfad="/lernen/hygiene" quelle="hygiene" bereiche={BEREICHE} aufgaben={AUFGABEN}
    />
  );
}
