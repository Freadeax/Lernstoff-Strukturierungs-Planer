import { TrainerSeite } from '../quiz/TrainerSeite';
import { navigate, useRoute } from '../../ui/shell/router';
import { AUFGABEN, BEREICHE } from './aufgaben';
import { ABCDE } from './ABCDE';
import { Reanimation } from './Reanimation';
import './notfall.css';

const MODI = [
  { id: 'fragen', label: 'Wissensfragen' },
  { id: 'rea', label: 'Reanimation üben' },
  { id: 'abcde', label: 'ABCDE-Notfall' },
] as const;
type Modus = typeof MODI[number]['id'];

function Modi({ aktiv }: { aktiv: Modus }) {
  return <nav className="notfall-modi" aria-label="Übungsart">
    {MODI.map(m => <button key={m.id} type="button" aria-pressed={aktiv === m.id} onClick={() => navigate(m.id === 'fragen' ? '/lernen/notfall' : `/lernen/notfall?modus=${m.id}`)}>{m.label}</button>)}
  </nav>;
}

export default function NotfallTrainer() {
  const { params } = useRoute();
  const p = params.get('modus');
  const modus: Modus = p === 'rea' || p === 'abcde' ? p : 'fragen';
  if (modus === 'abcde') return (
    <section className="page notfall">
      <div className="page__head">
        <h2>Notfall-Trainer</h2>
        <p className="muted">Akute Notfälle nach dem ABCDE-Schema: einschätzen, Hilfe holen, handeln und die Wirkung erneut prüfen.</p>
      </div>
      <Modi aktiv={modus} />
      <ABCDE />
    </section>
  );
  if (modus === 'rea') return (
    <section className="page notfall">
      <div className="page__head">
        <h2>Notfall-Trainer</h2>
        <p className="muted">Reanimation üben, getrennt für Erwachsene, Kinder und Neugeborene: erkennen, im richtigen Verhältnis drücken und beatmen, Rhythmus oder Herzfrequenz einordnen.</p>
      </div>
      <Modi aktiv={modus} />
      <Reanimation />
    </section>
  );
  return (
    <>
      <div className="notfall-modi__oben"><Modi aktiv={modus} /></div>
      <TrainerSeite
        titel="Notfall-Trainer"
        intro="Reanimation nach den Basismaßnahmen, Einschätzung nach dem ABCDE-Schema und typische Notfälle auf Station: Unterzuckerung, Schlaganfall, Krampfanfall, Atemnot, Schock und Anaphylaxie. Funktioniert offline."
        hinweis="Grundlage sind die Leitlinien des European Resuscitation Council (ERC 2021) für Erwachsene. Übung ersetzt kein praktisches Reanimationstraining. Der Notfallablauf deiner Einrichtung geht vor."
        pfad="/lernen/notfall" quelle="notfall" bereiche={BEREICHE} aufgaben={AUFGABEN}
      />
    </>
  );
}
