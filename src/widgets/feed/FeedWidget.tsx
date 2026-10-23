import { useState } from 'react';
import { db } from '../../core/db';
import { KIND_LABEL, SEVERITY_LABEL, type ActivityEntry, type Severity } from '../../core/activity';
import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { SyncBadge, WidgetHostProps, WidgetLifecycle, WidgetState } from '../../ui/widget/types';
import { useStore } from '../../ui/lib/store';
import { useNow, useSentinel } from '../../ui/lib/hooks';
import { addDays, dayKey, formatDay, relativeTime } from '../../ui/lib/time';
import { getModule } from '../../modules/registry';
import { session } from '../../ui/shell/session';
import { filterStore } from '../filter/filterStore';

type SevFilter = 'alle' | Severity;
const PAGE = 30;

export interface FeedData { items: ActivityEntry[]; total: number; counts: Record<Severity, number>; timeZone: string }

export function FeedSkeleton() {
  return (
    <div className="feed">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="feed__item">
          <Bone w="var(--space-2)" h="var(--space-2)" r="var(--radius-pill)" />
          <div className="stack-1" style={{ flex: 1 }}><Bone w={i % 2 ? '70%' : '85%'} /><Bone w="40%" h="var(--text-xs)" /></div>
        </div>
      ))}
    </div>
  );
}

export function FeedList({ data, onMore, hasMore }: { data: FeedData; onMore?: () => void; hasMore: boolean }) {
  const now = useNow();
  const sentinel = useSentinel(() => onMore?.(), hasMore && !!onMore, [data.items.length]);
  let lastDay = '';
  return (
    <>
      <div className="feed" role="feed" aria-busy={false} aria-live="polite" aria-relevant="additions" aria-label="Lernaktivität">
        {data.items.map((e, i) => {
          const day = dayKey(e.at, data.timeZone);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <article key={e.id ?? i} className={`feed__item sev-${e.severity}`} aria-posinset={i + 1} aria-setsize={data.total} tabIndex={0}
              aria-label={`${SEVERITY_LABEL[e.severity]}: ${e.title}`}>
              {showDay && <h4 className="feed__day">{formatDay(day)}</h4>}
              <span className="sev-dot" aria-hidden="true" />
              <div className="feed__text">
                <div className="feed__title">{e.title}</div>
                {e.detail && <div className="feed__detail">{e.detail}</div>}
                <div className="feed__meta">
                  <span className={`tag tag--${e.severity}`}>{SEVERITY_LABEL[e.severity]}</span>
                  <span>{KIND_LABEL[e.kind]}</span>
                  <time dateTime={e.at} title={new Date(e.at).toLocaleString('de-DE')}>{relativeTime(e.at, now)}</time>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {hasMore && (
        <div ref={sentinel} className="feed__more">
          <button type="button" className="small" onClick={onMore}>Ältere Einträge laden</button>
        </div>
      )}
    </>
  );
}

export function FeedView({ id, state, badge, onRetry, lastSynced, onHide, sev, onSev, onMore, lifecycle }: {
  id: string; state: WidgetState<FeedData>; badge: SyncBadge; onRetry: () => void; lastSynced?: Date; onHide?: () => void;
  sev: SevFilter; onSev: (s: SevFilter) => void; onMore?: () => void; lifecycle?: WidgetLifecycle;
}) {
  const counts = state.status === 'ideal' || state.status === 'partial' ? state.data.counts : undefined;
  return (
    <Widget<FeedData, SevFilter> id={id} state={state} onRetry={onRetry} skeleton={<FeedSkeleton />} lifecycle={lifecycle}
      header={{
        title: 'Lernaktivität', subtitle: 'Importe, Zusammenfassungen und Lernstand im Zeitraum', badge, onHide,
        filters: [
          { key: 'alle', label: 'Alle' },
          { key: 'info', label: 'Info', count: counts?.info },
          { key: 'warning', label: 'Warnung', count: counts?.warning },
          { key: 'critical', label: 'Kritisch', count: counts?.critical },
        ],
        activeFilter: sev, onFilterChange: onSev,
        exportRows: state.status === 'ideal' || state.status === 'partial' ? () => state.data.items.map((e) => ({ ...e })) : undefined,
      }}
      empty={{ illustration: 'aktivitaet', title: sev === 'alle' ? 'Noch keine Aktivität' : `Keine Einträge „${SEVERITY_LABEL[sev as Severity]}“`, message: sev === 'alle' ? 'Sobald du Material importierst oder Themen verschiebst, erscheint es hier.' : 'Im gewählten Zeitraum gibt es keine Einträge dieser Stufe.', cta: sev === 'alle' ? { label: 'Material importieren', href: '/material/import' } : { label: 'Alle Stufen zeigen', onClick: () => onSev('alle') } }}
      footer={{ lastSynced, secondary: state.status === 'ideal' || state.status === 'partial' ? <span className="muted">{state.data.items.length} von {state.data.total}</span> : undefined }}>
      {(data) => <FeedList data={data} onMore={onMore} hasMore={data.items.length < data.total} />}
    </Widget>
  );
}

export default function FeedWidget({ id, onHide, lifecycle }: WidgetHostProps) {
  const from = useStore(filterStore, (f) => f.from);
  const to = useStore(filterStore, (f) => f.to);
  const timeZone = useStore(filterStore, (f) => f.timeZone);
  const subjectId = useStore(filterStore, (f) => f.subjectId);
  const moduleId = useStore(session, (s) => s.moduleId);
  const [sev, setSev] = useState<SevFilter>('alle');
  const [limit, setLimit] = useState(PAGE);
  const { state, retry, lastSynced, badge } = useWidgetData<FeedData>({
    deps: [from, to, timeZone, subjectId, sev, limit, moduleId],
    load: async () => {
      // Grob nach UTC vorfiltern, dann exakt nach Kalendertag in der Zeitzone.
      const raw = await db.activity.where('at').between(`${addDays(from, -1)}T00:00`, `${addDays(to, 1)}T23:59:59.999Z`, true, true).reverse().toArray();
      const topicSubject = new Map(getModule(moduleId)?.topics.map((t) => [t.id, t.subjectId]) ?? []);
      const docs = subjectId ? new Set((await db.documents.where('subjectIds').equals(subjectId).primaryKeys()) as string[]) : null;
      const inScope = raw.filter((e) => {
        const d = dayKey(e.at, timeZone);
        if (d < from || d > to) return false;
        if (!subjectId) return true;
        if (e.subjectIds) return e.subjectIds.includes(subjectId);
        if (e.kind === 'lernstand') return topicSubject.get(e.ref ?? '') === subjectId;
        return e.ref ? docs!.has(e.ref) : true;
      });
      const counts = { info: 0, warning: 0, critical: 0 } as Record<Severity, number>;
      inScope.forEach((e) => { counts[e.severity] += 1; });
      const filtered = sev === 'alle' ? inScope : inScope.filter((e) => e.severity === sev);
      return { items: filtered.slice(0, limit), total: filtered.length, counts, timeZone };
    },
    isEmpty: (d) => d.total === 0,
    isPartial: (d) => d.total < 3 && 'Erst wenige Einträge im Zeitraum.',
  });
  return <FeedView id={id} state={state} badge={badge} onRetry={retry} lastSynced={lastSynced} onHide={onHide} lifecycle={lifecycle}
    sev={sev} onSev={(s) => { setSev(s); setLimit(PAGE); }} onMore={() => setLimit((l) => l + PAGE)} />;
}
