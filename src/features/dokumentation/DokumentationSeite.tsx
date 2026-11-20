// Dokumentations-Trainer: die Trainer des Pflegeprozesses an einem Ort (bis November 2026 sechs
// eigene Menüeinträge). Die Trainer selbst bleiben, wie sie sind; die Fallakte führt durch alle.
import { lazy, Suspense } from 'react';
import '../fertigkeiten/fertigkeiten.css';
import { useRoute } from '../../ui/shell/router';
import { Icon, type IconName } from '../../ui/icons';
import { PageHeading } from '../../ui/PageHeading';
import { DOKU_IDS, DOKU_NAME, DOKU_PFAD, dokuPfad, istDoku, type DokuId } from './pfad';

const SisTrainer = lazy(() => import('../sis/SisTrainer'));
const AssessmentTrainer = lazy(() => import('../assessment/AssessmentTrainer'));
const Pflegeplanung = lazy(() => import('../pflegeplanung/Pflegeplanung'));
const Berichttrainer = lazy(() => import('../bericht/Berichttrainer'));
const Uebergabetrainer = lazy(() => import('../uebergabe/Uebergabetrainer'));
const Fallakte = lazy(() => import('../fallakte/FallaktePage'));

interface Info { icon: IconName; schritt: string; text: string; minuten: number }

export const DOKU_INFO: Record<DokuId, Info> = {
  sis: { icon: 'form', schritt: '1 · Informationen sammeln', minuten: 20, text: 'Strukturierte Informationssammlung: Themenfelder ausfüllen, Risikomatrix einschätzen.' },
  assessment: { icon: 'gauge', schritt: '2 · Risiken einschätzen', minuten: 10, text: 'Braden, Barthel, Schmerzskalen, GCS und mehr: rechnen und an Fällen einschätzen.' },
  pflegeplanung: { icon: 'clipboard', schritt: '3 · Planen', minuten: 25, text: 'Probleme, Ressourcen, Ziele und Maßnahmen formulieren, neben einer Musterlösung vergleichen.' },
  bericht: { icon: 'pen', schritt: '4 · Dokumentieren', minuten: 15, text: 'Pflegeberichte sachlich und knapp schreiben, wertende Sprache erkennen.' },
  uebergabe: { icon: 'chat', schritt: '5 · Übergeben', minuten: 10, text: 'Übergaben nach SBAR strukturiert sprechen oder schreiben.' },
  fallakte: { icon: 'folder', schritt: 'Alles an einem Fall', minuten: 90, text: 'Eine Person über mehrere Wochen: von der SIS bis zur Übergabe und Evaluation, wie in der praktischen Prüfung.' },
};

function Leiste({ aktiv }: { aktiv?: DokuId }) {
  return (
    <nav className="pills fertig-leiste" aria-label="Dokumentationsschritt wählen">
      <a className="pill" href={`#${DOKU_PFAD}`} aria-current={aktiv ? undefined : 'page'}>Übersicht</a>
      {DOKU_IDS.map((d) => <a key={d} className="pill" href={`#${dokuPfad(d)}`} aria-current={aktiv === d ? 'page' : undefined}>{DOKU_NAME[d]}</a>)}
    </nav>
  );
}

function Teil({ id }: { id: DokuId }) {
  switch (id) {
    case 'sis': return <SisTrainer />;
    case 'assessment': return <AssessmentTrainer />;
    case 'pflegeplanung': return <Pflegeplanung />;
    case 'bericht': return <Berichttrainer />;
    case 'uebergabe': return <Uebergabetrainer />;
    case 'fallakte': return <Fallakte />;
  }
}

function Uebersicht() {
  return (
    <section className="page fertig">
      <PageHeading bild="ueben" eyebrow="Üben · Praxis" title="Dokumentations-Trainer"
        description="Der Pflegeprozess Schritt für Schritt: Informationen sammeln, Risiken einschätzen, planen, dokumentieren, übergeben. Oder alles an einem Fall in der Fallakte." />
      <Leiste />
      <ul className="fertig__liste" role="list">
        {DOKU_IDS.map((d) => {
          const i = DOKU_INFO[d];
          return (
            <li key={d}>
              <a className="card fertig__karte" href={`#${dokuPfad(d)}`}>
                <span className="fertig__icon" aria-hidden="true"><Icon name={i.icon} size={20} /></span>
                <span className="fertig__text">
                  <small className="muted">{i.schritt}</small>
                  <strong>{DOKU_NAME[d]}</strong>
                  <small className="muted">{i.text}</small>
                  <small className="muted">etwa {i.minuten} min</small>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function DokumentationSeite() {
  const { params } = useRoute();
  const t = params.get('teil');
  if (!istDoku(t)) return <Uebersicht />;
  return (
    <div className="page fertig-rahmen">
      <Leiste aktiv={t} />
      <Suspense fallback={<p className="muted">Wird geladen …</p>}><Teil key={t} id={t} /></Suspense>
    </div>
  );
}
