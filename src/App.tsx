import { lazy, useEffect } from 'react';
import { Shell } from './ui/shell/Shell';
import { navigate, useRoute } from './ui/shell/router';
import { REDIRECTS } from './ui/shell/nav';
import { PageBoundary } from './ui/shell/PageBoundary';
import { WidgetGrid } from './ui/widget/Dashboard';
import { WIDGETS } from './widgets/registry';
import { Dashboard } from './features/Dashboard';
import { Faecher } from './features/Faecher';
import { Einstellungen } from './features/Einstellungen';
import { PageHeading } from './ui/PageHeading';

// Import (PDF, OCR, ZIP) und Zusammenfasser (Claude-SDK) sind groß: erst laden, wenn die Seite geöffnet wird.
const Dokumente = lazy(() => import('./features/Dokumente').then((m) => ({ default: m.Dokumente })));
const Zusammenfassen = lazy(() => import('./features/Zusammenfassen').then((m) => ({ default: m.Zusammenfassen })));
const Designsystem = lazy(() => import('./features/Designsystem'));
const Ablage = lazy(() => import('./features/ablage/AblageSeite'));
const Rechentrainer = lazy(() => import('./features/rechnen/Rechentrainer'));
const Fallsimulator = lazy(() => import('./features/fall/Fallsimulator'));
const Praxissimulator = lazy(() => import('./features/praxis/Praxissimulator'));
const Duell = lazy(() => import('./features/duell/DuellSeite'));
const SisTrainer = lazy(() => import('./features/sis/SisTrainer'));
const Berichttrainer = lazy(() => import('./features/bericht/Berichttrainer'));
const Mindmaps = lazy(() => import('./features/mindmap/Mindmaps'));
const AssessmentTrainer = lazy(() => import('./features/assessment/AssessmentTrainer'));
const Krankheitsbilder = lazy(() => import('./features/krankheitsbilder/Krankheitsbilder'));
const Uebergabetrainer = lazy(() => import('./features/uebergabe/Uebergabetrainer'));
const Simulation = lazy(() => import('./features/simulation/SimulationSeite'));
const Pflegeplanung = lazy(() => import('./features/pflegeplanung/Pflegeplanung'));
const Lernplan = lazy(() => import('./features/lernplan/ui/Lernplan'));
const Landkarte = lazy(() => import('./features/landkarte/Landkarte'));
const Klassenmodus = lazy(() => import('./features/klasse/Klassenmodus'));
const Datensicherung = lazy(() => import('./features/sicherung/Datensicherung'));
const Karteikarten = lazy(() => import('./features/karteikarten/ui/Karteikarten'));

function Page({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="page">
      <PageHeading title={title} description={intro ?? ''} />
      {children}
    </section>
  );
}

function View() {
  const { path } = useRoute();
  useEffect(() => { if (REDIRECTS[path]) navigate(REDIRECTS[path]!); }, [path]);
  if (path === '/lernen/klasse' || path.startsWith('/lernen/klasse/')) return <Klassenmodus />;
  switch (path) {
    case '/': return <Dashboard />;
    case '/lernen/plan': return <Lernplan />;
    case '/lernen/themen': return <Page title="Themen" intro="Alle Themen des Fachmoduls. Arbeitsstand direkt in der Tabelle ändern oder mehrere auswählen."><WidgetGrid widgets={[WIDGETS.themen]} allowHide={false} /></Page>;
    case '/lernen/landkarte': return <Landkarte />;
    case '/lernen/board': return <Page title="Lernstand"><WidgetGrid widgets={[WIDGETS.board]} allowHide={false} /></Page>;
    case '/lernen/karten': return <Karteikarten />;
    case '/lernen/rechnen': return <Rechentrainer />;
    case '/lernen/fall': return <Fallsimulator />;
    case '/lernen/praxis': return <Praxissimulator />;
    case '/lernen/duell': return <Duell />;
    case '/lernen/simulation': return <Simulation />;
    case '/lernen/pflegeplanung': return <Pflegeplanung />;
    case '/lernen/sis': return <SisTrainer />;
    case '/lernen/bericht': return <Berichttrainer />;
    case '/lernen/mindmap': return <Mindmaps />;
    case '/lernen/krankheitsbilder': return <Krankheitsbilder />;
    case '/lernen/assessment': return <AssessmentTrainer />;
    case '/lernen/uebergabe': return <Uebergabetrainer />;
    case '/lernen/faecher': return <Faecher />;
    case '/material/dokumente': return <Dokumente />;
    case '/material/import': return <Page title="Dein Material. Bereit zum Lernen." intro="In vier Schritten von der Datei zur nachvollziehbaren Lernquelle."><WidgetGrid widgets={[WIDGETS.wizard]} allowHide={false} /></Page>;
    case '/material/ablage': return <Ablage />;
    case '/material/zusammenfassen': return <Zusammenfassen />;
    case '/einstellungen': return <Einstellungen />;
    case '/system/sicherung': return <Datensicherung />;
    case '/system/design': return <Designsystem />;
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
  const { path } = useRoute();
  return <Shell><PageBoundary path={path}><View /></PageBoundary></Shell>;
}
