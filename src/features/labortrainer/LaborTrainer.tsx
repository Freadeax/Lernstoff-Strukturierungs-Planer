import { lazy, Suspense } from 'react';
import { TrainerSeite } from '../quiz/TrainerSeite';
import { navigate, useRoute } from '../../ui/shell/router';
import { AUFGABEN, BEREICHE } from './aufgaben';

// Die Werkbank (interaktive Stationen) lädt erst, wenn sie geöffnet wird.
const Werkbank = lazy(() => import('./werkbank/Werkbank'));

export default function LaborTrainer() {
  const { params } = useRoute();
  const werkbank = params.get('modus') === 'werkbank';
  const laeuft = params.get('runde') === '1';
  return (
    <>
      {werkbank ? (
        <section className="page qz-seite">
          <div className="page__head">
            <h2>Labor-Werkbank</h2>
            <p><button type="button" className="link" onClick={() => navigate('/lernen/labor')}>← Zurück zu den Aufgabenrunden</button></p>
            <p className="muted">Blut selbst abnehmen und sehen, welche Werte ein Fehler verfälscht. Verläufe im Kumulativbefund lesen. Einen kritischen Wert annehmen und per SBAR melden. Alle Fälle sind fiktiv und fachlich vereinfacht.</p>
          </div>
          <Suspense fallback={<p className="muted">Werkbank wird geladen …</p>}><Werkbank /></Suspense>
        </section>
      ) : (
        <TrainerSeite
          titel="Labor-Trainer"
          intro="Blutentnahme ohne Präanalytikfehler, Blutgasanalysen in Schritten deuten und Laborbefunde pflegerisch einordnen. Funktioniert offline. Zum Ausprobieren im Fall: Labor und Bildgebung."
          hinweis="Übliche Richtwerte für Erwachsene, didaktisch vereinfacht. Röhrchenfarben und Grenzwerte richten sich nach dem eigenen Haus und dem Referenzbereich auf dem Befund."
          pfad="/lernen/labor" quelle="labor" bereiche={BEREICHE} aufgaben={AUFGABEN}
        />
      )}
      {!werkbank && !laeuft && (
        <aside className="card" aria-labelledby="wb-teaser" style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <h3 id="wb-teaser" style={{ margin: 0 }}>Labor-Werkbank</h3>
          <p className="muted" style={{ margin: 0 }}>Selbst Blut abnehmen (Röhrchen füllen, Stauzeit, Infusionsarm), Verläufe im Kumulativbefund lesen und einen kritischen Wert per SBAR melden. Du siehst danach, welche Werte dein Vorgehen verfälscht hat.</p>
          <div><button type="button" className="primary" onClick={() => navigate('/lernen/labor?modus=werkbank')}>Werkbank öffnen</button></div>
        </aside>
      )}
    </>
  );
}
