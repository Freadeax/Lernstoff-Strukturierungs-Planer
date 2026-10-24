import './lernplan.css';
import { navigate, useRoute } from '../../../ui/shell/router';
import { usePlan } from './usePlan';
import { Heute } from './Heute';
import { Woche } from './Woche';
import { Pruefungen } from './Pruefungen';
import { Zeit } from './Zeit';

export type { PlanCtx } from './usePlan';

const ANSICHTEN = [
  { id: 'heute', label: 'Heute' },
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
      <div className="page__head">
        <h2>Lernplan</h2>
        <p className="muted">Wird bei jedem Öffnen aus deinem Ist-Stand neu berechnet: Lernzeit, echte Abfragen und verfügbare Zeit.</p>
      </div>
      <div className="pills lernplan__tabs" role="tablist" aria-label="Ansicht">
        {ANSICHTEN.map((a) => (
          <button key={a.id} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} aria-pressed={ansicht === a.id}
            onClick={() => navigate(a.id === 'heute' ? '/lernen/plan' : `/lernen/plan?ansicht=${a.id}`)}>
            {a.label}{a.id === 'pruefungen' && upcoming.length ? ` (${upcoming.length})` : ''}
          </button>
        ))}
      </div>
      {error && <p className="note warn">Lernplan konnte nicht geladen werden: {error.message} <button type="button" className="small" onClick={retry}>Erneut versuchen</button></p>}
      {!ctx && !error && <p className="muted">Lädt …</p>}
      {ctx && (
        <div role="tabpanel">
          {ansicht === 'heute' && <Heute ctx={ctx} />}
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
    </div>
  );
}
