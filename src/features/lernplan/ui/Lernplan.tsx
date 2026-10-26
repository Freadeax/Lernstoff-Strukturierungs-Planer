import './lernplan.css';
import { navigate, useRoute } from '../../../ui/shell/router';
import { usePlan } from './usePlan';
import { Heute } from './Heute';
import { Woche } from './Woche';
import { Pruefungen } from './Pruefungen';
import { Zeit } from './Zeit';
import { Wissensstand } from './Wissensstand';
import { PageHeading } from '../../../ui/PageHeading';

export type { PlanCtx } from './usePlan';

const ANSICHTEN = [
  { id: 'heute', label: 'Heute' },
  { id: 'wissensstand', label: 'Wissensstand' },
  { id: 'woche', label: 'Woche' },
  { id: 'pruefungen', label: 'Prüfungen' },
  { id: 'zeit', label: 'Lernzeit' },
] as const;
type Ansicht = (typeof ANSICHTEN)[number]['id'];

export default function Lernplan() {
  const { params } = useRoute();
  const raw = params.get('ansicht');
  const ansicht: Ansicht = ANSICHTEN.some((a) => a.id === raw) ? (raw as Ansicht) : 'heute';
  const { ctx, error, retry } = usePlan();
  const upcoming = ctx?.data.exams.filter((e) => e.date > ctx.data.today) ?? [];

  return (
    <section className="page lernplan">
      <PageHeading eyebrow="Schritt für Schritt" title="Dein Plan. Passend zu deinem Alltag."
        description="Prüfungstermine, verfügbare Zeit und echte Abfragen bestimmen deine nächsten Lerneinheiten." />
      <div className="pills lernplan__tabs" role="tablist" aria-label="Ansicht">
        {ANSICHTEN.map((a) => (
          <button key={a.id} id={`plan-tab-${a.id}`} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} aria-controls="plan-panel" tabIndex={ansicht === a.id ? 0 : -1}
            onKeyDown={(e) => {
              const index = ANSICHTEN.findIndex((v) => v.id === a.id);
              const target = e.key === 'ArrowRight' ? (index + 1) % ANSICHTEN.length : e.key === 'ArrowLeft' ? (index + ANSICHTEN.length - 1) % ANSICHTEN.length : e.key === 'Home' ? 0 : e.key === 'End' ? ANSICHTEN.length - 1 : -1;
              if (target < 0) return;
              e.preventDefault();
              const next = ANSICHTEN[target]!;
              navigate(next.id === 'heute' ? '/lernen/plan' : `/lernen/plan?ansicht=${next.id}`);
              document.getElementById(`plan-tab-${next.id}`)?.focus();
            }}
            onClick={() => navigate(a.id === 'heute' ? '/lernen/plan' : `/lernen/plan?ansicht=${a.id}`)}>
            {a.label}{a.id === 'pruefungen' && upcoming.length ? ` (${upcoming.length})` : ''}
          </button>
        ))}
      </div>
      {error && <p className="note warn">Lernplan konnte nicht geladen werden: {error.message} <button type="button" className="small" onClick={retry}>Erneut versuchen</button></p>}
      {!ctx && !error && <p className="muted">Lädt …</p>}
      {ctx && (
        <div id="plan-panel" role="tabpanel" aria-labelledby={`plan-tab-${ansicht}`} tabIndex={0}>
          {ansicht === 'heute' && <Heute ctx={ctx} />}
          {ansicht === 'wissensstand' && <Wissensstand ctx={ctx} />}
          {ansicht === 'woche' && <Woche ctx={ctx} />}
          {ansicht === 'pruefungen' && <Pruefungen ctx={ctx} />}
          {ansicht === 'zeit' && <Zeit ctx={ctx} />}
        </div>
      )}
    </section>
  );
}

/** Hinweis, wenn noch keine Prüfung eingetragen ist: ohne Termin gibt es keinen Plan. */
export function OhnePruefung() {
  return (
    <div className="card lernplan__leer">
      <h3>Noch keine Prüfung eingetragen</h3>
      <p>Der Plan verteilt den Stoff rückwärts vom Prüfungstermin. Trag zuerst eine Klausur oder Prüfung mit ihren Themen ein.</p>
      <button type="button" className="primary" onClick={() => navigate('/lernen/plan?ansicht=pruefungen&neu=1')}>Prüfung eintragen</button>
      <button type="button" className="ghost" onClick={() => navigate('/lernen/plan?ansicht=wissensstand')}>Wissensstand ohne Prüfung prüfen</button>
    </div>
  );
}
