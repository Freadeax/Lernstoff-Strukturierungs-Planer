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
    case '/lernen/themen': return <Page title="Themen" intro="Alle Themen des Fachmoduls. Arbeitsstand direkt in der Tabelle ändern oder mehrere auswählen."><WidgetGrid widgets={[WIDGETS.themen]} allowHide={false} /></Page>;
    case '/lernen/board': return <Page title="Lernstand"><WidgetGrid widgets={[WIDGETS.board]} allowHide={false} /></Page>;
    case '/lernen/faecher': return <Faecher />;
    case '/material/dokumente': return <Dokumente />;
    case '/material/import': return <Page title="Import"><WidgetGrid widgets={[WIDGETS.wizard]} allowHide={false} /></Page>;
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
