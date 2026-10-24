import { lazy, Suspense, useEffect } from 'react';
import { Shell } from './ui/shell/Shell';
import { navigate, useRoute } from './ui/shell/router';
import { REDIRECTS } from './ui/shell/nav';
import { WidgetGrid } from './ui/widget/Dashboard';
import { WIDGETS } from './widgets/registry';
import { Dashboard } from './features/Dashboard';
import { Dokumente } from './features/Dokumente';
import { Zusammenfassen } from './features/Zusammenfassen';
import { Faecher } from './features/Faecher';
import { Einstellungen } from './features/Einstellungen';

const Designsystem = lazy(() => import('./features/Designsystem'));
const Ablage = lazy(() => import('./features/ablage/Ablage'));
const Rechentrainer = lazy(() => import('./features/rechnen/Rechentrainer'));
const Fallsimulator = lazy(() => import('./features/fall/Fallsimulator'));
const Duell = lazy(() => import('./features/duell/Duell'));
const SisTrainer = lazy(() => import('./features/sis/SisTrainer'));
const Mindmaps = lazy(() => import('./features/mindmap/Mindmaps'));
const Uebergabetrainer = lazy(() => import('./features/uebergabe/Uebergabetrainer'));
const Simulation = lazy(() => import('./features/simulation/Simulation'));
const Pflegeplanung = lazy(() => import('./features/pflegeplanung/Pflegeplanung'));
const Lernplan = lazy(() => import('./features/lernplan/ui/Lernplan'));
const Landkarte = lazy(() => import('./features/landkarte/Landkarte'));
const Karteikarten = lazy(() => import('./features/karteikarten/ui/Karteikarten'));

function Page({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="page">
      <div className="page__head"><h2>{title}</h2>{intro && <p className="muted">{intro}</p>}</div>
      {children}
    </section>
  );
}

function View() {
  const { path } = useRoute();
  useEffect(() => { if (REDIRECTS[path]) navigate(REDIRECTS[path]!); }, [path]);
  switch (path) {
    case '/': return <Dashboard />;
    case '/lernen/plan': return <Suspense fallback={<p className="muted">Lädt …</p>}><Lernplan /></Suspense>;
    case '/lernen/themen': return <Page title="Themen" intro="Alle Themen des Fachmoduls. Arbeitsstand direkt in der Tabelle ändern oder mehrere auswählen."><WidgetGrid widgets={[WIDGETS.themen]} allowHide={false} /></Page>;
    case '/lernen/landkarte': return <Suspense fallback={<p className="muted">Lädt …</p>}><Landkarte /></Suspense>;
    case '/lernen/board': return <Page title="Lernstand"><WidgetGrid widgets={[WIDGETS.board]} allowHide={false} /></Page>;
    case '/lernen/karten': return <Suspense fallback={<p className="muted">Lädt …</p>}><Karteikarten /></Suspense>;
    case '/lernen/rechnen': return <Suspense fallback={<p className="muted">Lädt …</p>}><Rechentrainer /></Suspense>;
    case '/lernen/fall': return <Suspense fallback={<p className="muted">Lädt …</p>}><Fallsimulator /></Suspense>;
    case '/lernen/duell': return <Suspense fallback={<p className="muted">Lädt …</p>}><Duell /></Suspense>;
    case '/lernen/simulation': return <Suspense fallback={<p className="muted">Lädt …</p>}><Simulation /></Suspense>;
    case '/lernen/pflegeplanung': return <Suspense fallback={<p className="muted">Lädt …</p>}><Pflegeplanung /></Suspense>;
    case '/lernen/sis': return <Suspense fallback={<p className="muted">Lädt …</p>}><SisTrainer /></Suspense>;
    case '/lernen/mindmap': return <Suspense fallback={<p className="muted">Lädt …</p>}><Mindmaps /></Suspense>;
    case '/lernen/uebergabe': return <Suspense fallback={<p className="muted">Lädt …</p>}><Uebergabetrainer /></Suspense>;
    case '/lernen/faecher': return <Faecher />;
    case '/material/dokumente': return <Dokumente />;
    case '/material/import': return <Page title="Import"><WidgetGrid widgets={[WIDGETS.wizard]} allowHide={false} /></Page>;
    case '/material/ablage': return <Suspense fallback={<p className="muted">Lädt …</p>}><Ablage /></Suspense>;
    case '/material/zusammenfassen': return <Zusammenfassen />;
    case '/einstellungen': return <Einstellungen />;
    case '/system/design': return <Suspense fallback={<p className="muted">Lädt …</p>}><Designsystem /></Suspense>;
    default:
      return (
        <Page title="Seite nicht gefunden">
          <p>Diese Adresse gibt es nicht.</p>
          <button type="button" className="primary" onClick={() => navigate('/')}>Zur Übersicht</button>
        </Page>
      );
  }
}

export function App() {
  return <Shell><View /></Shell>;
}
