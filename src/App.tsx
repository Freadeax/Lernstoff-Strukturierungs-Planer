import { lazy, Suspense, useEffect } from 'react';
import { Shell } from './ui/shell/Shell';
import { navigate, useRoute } from './ui/shell/router';
import { REDIRECTS, gruppenPfad, passtDazuId } from './ui/shell/nav';
import { PageBoundary } from './ui/shell/PageBoundary';
import { WidgetGrid } from './ui/widget/Dashboard';
import { WIDGETS } from './widgets/registry';
import { Dashboard } from './features/Dashboard';
import { PageHeading } from './ui/PageHeading';

// Import (PDF, OCR, ZIP) und Zusammenfasser (Claude-SDK) sind groß: erst laden, wenn die Seite geöffnet wird.
const Dokumente = lazy(() => import('./features/Dokumente').then((m) => ({ default: m.Dokumente })));
const Zusammenfassen = lazy(() => import('./features/Zusammenfassen').then((m) => ({ default: m.Zusammenfassen })));
const Faecher = lazy(() => import('./features/Faecher').then((m) => ({ default: m.Faecher })));
const Einstellungen = lazy(() => import('./features/Einstellungen').then((m) => ({ default: m.Einstellungen })));
const Designsystem = lazy(() => import('./features/Designsystem'));
const Bildpruefung = lazy(() => import('./features/assetstatus/Bildpruefung'));
const Ablage = lazy(() => import('./features/ablage/AblageSeite'));
const Rechentrainer = lazy(() => import('./features/rechnen/Rechentrainer'));
const Fehlerheft = lazy(() => import('./features/fehlerheft/FehlerheftSeite'));
const Fallsimulator = lazy(() => import('./features/fall/Fallsimulator'));
const Praxissimulator = lazy(() => import('./features/praxis/Praxissimulator'));
const LaborTrainer = lazy(() => import('./features/labortrainer/LaborTrainer'));
const Diagnostik = lazy(() => import('./features/diagnostik/DiagnostikSeite'));
const Duell = lazy(() => import('./features/duell/DuellSeite'));
const SisTrainer = lazy(() => import('./features/sis/SisTrainer'));
const Berichttrainer = lazy(() => import('./features/bericht/Berichttrainer'));
const Mindmaps = lazy(() => import('./features/mindmap/Mindmaps'));
const AssessmentTrainer = lazy(() => import('./features/assessment/AssessmentTrainer'));
const Krankheitsbilder = lazy(() => import('./features/krankheitsbilder/Krankheitsbilder'));
const Uebergabetrainer = lazy(() => import('./features/uebergabe/Uebergabetrainer'));
const Simulation = lazy(() => import('./features/simulation/SimulationSeite'));
const Fallakte = lazy(() => import('./features/fallakte/FallaktePage'));
const Pflegeplanung = lazy(() => import('./features/pflegeplanung/Pflegeplanung'));
const Lernplan = lazy(() => import('./features/lernplan/ui/Lernplan'));
const Landkarte = lazy(() => import('./features/landkarte/Landkarte'));
const Klassenmodus = lazy(() => import('./features/klasse/Klassenmodus'));
const Lehrermodus = lazy(() => import('./features/lehrer/Lehrermodus'));
const Datensicherung = lazy(() => import('./features/sicherung/Datensicherung'));
const Karteikarten = lazy(() => import('./features/karteikarten/ui/Karteikarten'));
const Skript = lazy(() => import('./features/skript/ui/Skript'));
const CeSeite = lazy(() => import('./features/ce/CeSeite'));
const Fortschritt = lazy(() => import('./features/fortschritt/FortschrittSeite'));
const Examen = lazy(() => import('./features/examen/ExamenSeite'));
const HygieneTrainer = lazy(() => import('./features/hygiene/HygieneTrainer'));
const AnatomieTrainer = lazy(() => import('./features/anatomie/AnatomieTrainer'));
const ExpertenstandardsTrainer = lazy(() => import('./features/expertenstandards/ExpertenstandardsTrainer'));
const DnqpSeite = lazy(() => import('./features/dnqp/DnqpSeite'));
const NormwerteTrainer = lazy(() => import('./features/normwerte/NormwerteTrainer'));
const NotfallTrainer = lazy(() => import('./features/notfall/NotfallTrainer'));
const HoerTrainer = lazy(() => import('./features/hoeren/HoerTrainer'));
const ArzneimittelTrainer = lazy(() => import('./features/arzneimittel/ArzneimittelTrainer'));
const RechtTrainer = lazy(() => import('./features/recht/RechtTrainer'));
const GrundlagenTrainer = lazy(() => import('./features/grundlagen/GrundlagenTrainer'));
const Schnellsuche = lazy(() => import('./features/schnellsuche/Schnellsuche'));
const UebenSeite = lazy(() => import('./features/ueben/UebenSeite'));
const PasstDazu = lazy(() => import('./features/ueben/PasstDazuLeiste'));
const Testphase = lazy(() => import('./features/testphase/TestphaseSeite'));
const ThemaSeite = lazy(() => import('./features/thema/ThemaSeite'));
const Wegweiser = lazy(() => import('./features/wegweiser/WegweiserSeite'));
// Kurzhilfe für die beiden Seiten, die hier direkt gebaut werden: eigener kleiner Chunk, das Startpaket bleibt gleich.
const SeitenHilfe = lazy(() => import('./features/wegweiser/SeitenHilfe'));

function Page({ title, intro, hilfe, children }: { title: string; intro?: string; hilfe?: string; children: React.ReactNode }) {
  return (
    <section className="page">
      <PageHeading title={title} description={intro ?? ''} />
      {hilfe && <Suspense fallback={null}><SeitenHilfe path={hilfe} /></Suspense>}
      {children}
    </section>
  );
}

function View() {
  const { path } = useRoute();
  useEffect(() => { if (REDIRECTS[path]) navigate(REDIRECTS[path]!); }, [path]);
  if (path === '/lernen/klasse' || path.startsWith('/lernen/klasse/')) return <Klassenmodus />;
  if (path === '/lehren' || path.startsWith('/lehren/')) return <Lehrermodus />;
  switch (path) {
    case '/': return <Dashboard />;
    case '/lernen/plan': return <Lernplan />;
    case '/lernen/themen': return <Page title="Themen" hilfe="/lernen/themen" intro="Alle Themen des Fachmoduls. Arbeitsstand direkt in der Tabelle ändern oder mehrere auswählen."><WidgetGrid widgets={[WIDGETS.themen]} allowHide={false} /></Page>;
    case '/lernen/ce': return <CeSeite />;
    case '/lernen/wegweiser': return <Wegweiser />;
    case '/lernen/thema': return <ThemaSeite />;
    case '/lernen/ueben': return <UebenSeite />;
    case '/lernen/fortschritt': return <Fortschritt />;
    case '/lernen/landkarte': return <Landkarte />;
    case '/lernen/board': return <Page title="Mein Themenboard" hilfe="/lernen/board" intro="Dein Arbeitsstand je Thema: Themenpool, diese Woche, in Arbeit, erarbeitet. Ob du ein Thema sicher kannst, zeigt der Wissensstand aus Abfragen im Lernplan."><WidgetGrid widgets={[WIDGETS.board]} allowHide={false} /></Page>;
    case '/lernen/skript': return <Skript />;
    case '/lernen/karten': return <Karteikarten />;
    case '/lernen/schnellsuche': return <Schnellsuche />;
    case '/lernen/rechnen': return <Rechentrainer />;
    case '/lernen/fehler': return <Fehlerheft />;
    case '/lernen/fall': return <Fallsimulator />;
    case '/lernen/praxis': return <Praxissimulator />;
    case '/lernen/duell': return <Duell />;
    case '/lernen/simulation': return <Simulation />;
    case '/lernen/examen': return <Examen />;
    case '/lernen/fallakte': return <Fallakte />;
    case '/lernen/pflegeplanung': return <Pflegeplanung />;
    case '/lernen/sis': return <SisTrainer />;
    case '/lernen/bericht': return <Berichttrainer />;
    case '/lernen/mindmap': return <Mindmaps />;
    case '/lernen/krankheitsbilder': return <Krankheitsbilder />;
    case '/lernen/assessment': return <AssessmentTrainer />;
    case '/lernen/uebergabe': return <Uebergabetrainer />;
    case '/lernen/hygiene': return <HygieneTrainer />;
    case '/lernen/anatomie': return <AnatomieTrainer />;
    case '/lernen/expertenstandards': return <ExpertenstandardsTrainer />;
    case '/lernen/dnqp': return <DnqpSeite />;
    case '/lernen/normwerte': return <NormwerteTrainer />;
    case '/lernen/diagnostik': return <Diagnostik />;
    case '/lernen/labor': return <LaborTrainer />;
    case '/lernen/notfall': return <NotfallTrainer />;
    case '/lernen/hoeren': return <HoerTrainer />;
    case '/lernen/arzneimittel': return <ArzneimittelTrainer />;
    case '/lernen/recht': return <RechtTrainer />;
    case '/lernen/grundlagen': return <GrundlagenTrainer />;
    case '/lernen/faecher': return <Faecher />;
    case '/material/dokumente': return <Dokumente />;
    case '/material/import': return <Page title="Dein Material. Bereit zum Lernen." intro="In vier Schritten von der Datei zur nachvollziehbaren Lernquelle."><WidgetGrid widgets={[WIDGETS.wizard]} allowHide={false} /></Page>;
    case '/material/ablage': return <Ablage />;
    case '/material/zusammenfassen': return <Zusammenfassen />;
    case '/einstellungen': return <Einstellungen />;
    case '/system/sicherung': return <Datensicherung />;
    case '/system/design': return <Designsystem />;
    case '/system/bilder': return <Bildpruefung />;
    case '/system/test': return <Testphase />;
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
  // Schlüssel je Seite: beim Seitenwechsel wird der Rahmen neu aufgebaut, die Einblend-Animation läuft erneut.
  // Unterseiten des Klassenmodus teilen sich einen Schlüssel, damit ihr Zustand erhalten bleibt.
  const seite = path.startsWith('/lernen/klasse') ? '/lernen/klasse' : path;
  const uebung = passtDazuId(path);
  return <Shell><PageBoundary path={path}><div className="route" key={seite} style={{ '--kopf-marke': JSON.stringify(gruppenPfad(seite)) } as React.CSSProperties}><View />
    {uebung && <Suspense fallback={null}><PasstDazu id={uebung} path={path} /></Suspense>}</div></PageBoundary></Shell>;
}
