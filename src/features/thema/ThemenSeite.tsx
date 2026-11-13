import './thema.css';
import { lazy, Suspense } from 'react';
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import { storage } from '../../ui/lib/store';
import { WidgetGrid } from '../../ui/widget/Dashboard';
import { WIDGETS } from '../../widgets/registry';
import SeitenHilfe from '../wegweiser/SeitenHilfe';

const ThemenBaum = lazy(() => import('./ThemenBaum'));

// #/lernen/themen: zwei Ansichten auf denselben Katalog. Baum = Orientierung und Fortschritt je Bereich,
// Tabelle = Sortieren, Filtern, Arbeitsstand für viele Themen auf einmal. Die Wahl merkt sich die App.

type Ansicht = 'baum' | 'tabelle';
const KEY = 'lernstoff.themen.ansicht';

export default function ThemenSeite() {
  const { params } = useRoute();
  const gewaehlt = params.get('ansicht');
  // Alte Links mit ?thema= oder ?fach= (Tabelle mit Markierung/Filter) bleiben bei der Tabelle, außer es wird ausdrücklich der Baum gewünscht.
  const ansicht: Ansicht = gewaehlt === 'baum' || gewaehlt === 'tabelle' ? gewaehlt
    : params.get('fach') ? 'tabelle' : storage.read<string>(KEY, 'baum') === 'tabelle' ? 'tabelle' : 'baum';
  const waehle = (a: Ansicht) => {
    storage.write(KEY, a);
    const p = new URLSearchParams(params);
    p.set('ansicht', a);
    navigate(`/lernen/themen?${p.toString()}`);
  };
  return (
    <section className="page">
      <PageHeading title="Themen" description={ansicht === 'baum'
        ? 'Fach, Bereich und Thema als aufklappbarer Baum. Die Balken zeigen, wie viel davon sicher, unsicher, bearbeitet oder offen ist.'
        : 'Alle Themen des Fachmoduls. Arbeitsstand direkt in der Tabelle ändern oder mehrere auswählen.'} />
      <SeitenHilfe path="/lernen/themen" />
      <div className="pills themen__ansicht" role="group" aria-label="Ansicht">
        <button type="button" className="pill" aria-pressed={ansicht === 'baum'} onClick={() => waehle('baum')}>Baum</button>
        <button type="button" className="pill" aria-pressed={ansicht === 'tabelle'} onClick={() => waehle('tabelle')}>Tabelle</button>
        <a className="pill" href="#/lernen/board">Board</a>
        <a className="pill" href="#/lernen/landkarte">Landkarte</a>
      </div>
      {ansicht === 'baum'
        ? <Suspense fallback={<p className="muted" role="status">Themenbaum wird geladen …</p>}><ThemenBaum /></Suspense>
        : <WidgetGrid widgets={[WIDGETS.themen]} allowHide={false} />}
    </section>
  );
}
