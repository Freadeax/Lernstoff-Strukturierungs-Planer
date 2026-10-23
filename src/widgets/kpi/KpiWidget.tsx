import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { WidgetHostProps, WidgetLifecycle, WidgetState, SyncBadge } from '../../ui/widget/types';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { filterStore } from '../filter/filterStore';
import { activeDays, buildKpis, formatTrend, loadSnapshot, type KpiCard } from '../data';
import { sparkPath } from './sparkline';

function Sparkline({ values, label }: { values: Array<number | null>; label: string }) {
  const d = sparkPath(values, 100, 32);
  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={label}>
      {d && <path d={d} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function Scorecard({ card, partial }: { card: KpiCard; partial: boolean }) {
  const dir = card.trend === null ? 'neu' : card.trend > 0 ? 'up' : card.trend < 0 ? 'down' : 'flat';
  const points = card.series.filter((v) => v !== null && v > 0).length;
  return (
    <article className="kpi" aria-label={card.label}>
      <h4 className="kpi__label">{card.label}</h4>
      <div className="kpi__row">
        <span className="kpi__value">{card.value}</span>
        <span className={`kpi__trend kpi__trend--${dir}`} title="Veränderung zum gleich langen Zeitraum davor">
          {formatTrend(card.trend)}<span className="visually-hidden"> zur Vorperiode</span>
        </span>
      </div>
      {partial && points < 2
        ? <p className="kpi__spark-empty">Noch zu wenig Verlauf</p>
        : <Sparkline values={card.series} label={`Verlauf ${card.label}`} />}
      <p className="kpi__hint">{card.hint}</p>
    </article>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi-grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="kpi">
          <Bone w="60%" h="var(--text-sm)" />
          <Bone w="40%" h="var(--text-2xl)" />
          <Bone h="var(--space-5)" />
          <Bone w="80%" h="var(--text-xs)" />
        </div>
      ))}
    </div>
  );
}

export function KpiView({ id, state, badge, onRetry, lastSynced, onHide, lifecycle }: {
  id: string; state: WidgetState<KpiCard[]>; badge: SyncBadge; onRetry: () => void; lastSynced?: Date; onHide?: () => void; lifecycle?: WidgetLifecycle;
}) {
  return (
    <Widget id={id} state={state} onRetry={onRetry} skeleton={<KpiSkeleton />} lifecycle={lifecycle}
      header={{
        title: 'Lernfortschritt', subtitle: 'Im gewählten Zeitraum, Vergleich zum Zeitraum davor', badge, onHide,
        exportRows: state.status === 'ideal' || state.status === 'partial'
          ? () => state.data.map(({ series, ...c }) => ({ ...c, verlauf: series.join(' ') })) : undefined,
      }}
      body={{ minHeight: 'var(--kpi-body-h)', maxHeight: 'none' }}
      empty={{ illustration: 'dokumente', title: 'Noch kein Lernfortschritt', message: 'Importiere dein erstes Skript. Danach erscheinen hier Kennzahlen und Verläufe.', cta: { label: 'Material importieren', href: '/material/import' } }}
      footer={{ lastSynced }}>
      {(cards, { partial }) => (
        <div className="kpi-grid">{cards.map((c) => <Scorecard key={c.id} card={c} partial={partial} />)}</div>
      )}
    </Widget>
  );
}

export default function KpiWidget({ id, onHide, lifecycle }: WidgetHostProps) {
  const from = useStore(filterStore, (f) => f.from);
  const to = useStore(filterStore, (f) => f.to);
  const timeZone = useStore(filterStore, (f) => f.timeZone);
  const subjectId = useStore(filterStore, (f) => f.subjectId);
  const moduleId = useStore(session, (s) => s.moduleId);
  const { state, retry, lastSynced, badge } = useWidgetData({
    deps: [from, to, timeZone, subjectId, moduleId],
    load: async () => {
      const snap = await loadSnapshot({ subjectId }, moduleId);
      return { snap, cards: buildKpis(snap, { from, to, timeZone, subjectId }, moduleId) };
    },
    isEmpty: ({ snap }) => !snap.documents.length && !snap.summaries.length && !snap.board.length,
    isPartial: ({ cards }) => activeDays(cards.map((c) => c.series)) < 3 && 'Noch wenig Verlauf: Trends werden nach einigen Lerntagen aussagekräftig.',
  });
  const mapped: WidgetState<KpiCard[]> = state.status === 'ideal' || state.status === 'partial' ? { ...state, data: state.data.cards } : state;
  return <KpiView id={id} state={mapped} badge={badge} onRetry={retry} lastSynced={lastSynced} onHide={onHide} lifecycle={lifecycle} />;
}
