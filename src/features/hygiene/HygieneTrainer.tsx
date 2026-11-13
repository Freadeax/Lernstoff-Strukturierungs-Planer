import { TrainerSeite } from '../quiz/TrainerSeite';
import { hygieneGrundlage } from '../quiz/grundlage';
import { useRoute } from '../../ui/shell/router';
import { AUFGABEN, BEREICHE } from './aufgaben';
import { Suchbilder } from './Suchbild';

export default function HygieneTrainer() {
  const { params } = useRoute();
  return (
    <>
      <TrainerSeite grundlage={hygieneGrundlage}
        titel="Hygiene-Trainer"
        intro="Händedesinfektion nach den 5 Momenten, Schutzausrüstung an- und ablegen, Übertragungswege und Isolierung, Basishygiene. Funktioniert offline."
        hinweis="Grundlage sind die KRINKO-Empfehlungen, die TRBA 250 und die Aktion Saubere Hände. Im Zweifel gilt der Hygieneplan deiner Einrichtung."
        pfad="/lernen/hygiene" quelle="hygiene" bereiche={BEREICHE} aufgaben={AUFGABEN}
      />
      {params.get('runde') !== '1' && <Suchbilder />}
    </>
  );
}
