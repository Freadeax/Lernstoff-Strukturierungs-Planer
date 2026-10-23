import { useMemo, useState } from 'react';
import { db } from '../../core/db';
import { BOARD_COLUMNS, COLUMN_LABEL, moveTopics, type BoardColumn } from '../../core/board';
import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { SyncBadge, WidgetHostProps, WidgetLifecycle, WidgetState } from '../../ui/widget/types';
import { SmartTable, type Column } from '../../ui/table/SmartTable';
import { multiSort, toggleSort, type SortSpec } from '../../ui/table/sort';
import { useStore, storage } from '../../ui/lib/store';
import { useDebounced } from '../../ui/lib/hooks';
import { Icon } from '../../ui/icons';
import { useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { notify } from '../../ui/shell/notifications';
import { getModule } from '../../modules/registry';
import { countConditions, describe, emptyGroup, evaluate, newId, type Group, type QueryField } from './query';
import { QueryBuilder } from './QueryBuilder';
import { normalize } from '../../ui/lib/trie';

export interface ThemaRow {
  id: string; name: string; bereich: string; fach: string; fachId: string;
  schwierigkeit?: number; minuten?: number; voraussetzungen: number; dokumente: number; stand: BoardColumn;
  [k: string]: string | number | undefined;
}
type Pill = 'alle' | BoardColumn;

const DIFF = ['', 'sehr leicht', 'leicht', 'mittel', 'schwer', 'sehr schwer'];

export function fieldsFor(subjects: Array<{ id: string; name: string; code?: string }>): QueryField[] {
  return [
    { key: 'name', label: 'Thema', type: 'text' },
    { key: 'bereich', label: 'Bereich', type: 'text' },
    { key: 'fachId', label: 'Fach', type: 'enum', options: subjects.map((s) => ({ value: s.id, label: s.code ? `${s.code} · ${s.name}` : s.name })) },
    { key: 'schwierigkeit', label: 'Schwierigkeit', type: 'number' },
    { key: 'minuten', label: 'Minuten', type: 'number' },
    { key: 'voraussetzungen', label: 'Voraussetzungen', type: 'number' },
    { key: 'dokumente', label: 'Dokumente', type: 'number' },
    { key: 'stand', label: 'Arbeitsstand', type: 'enum', options: BOARD_COLUMNS.map((c) => ({ value: c.id, label: c.label })) },
  ];
}

export function columnsFor(onStand?: (row: ThemaRow, value: BoardColumn) => void): Column<ThemaRow>[] {
  return [
    { key: 'name', label: 'Thema', width: 260, minWidth: 140, sticky: true, value: (r) => r.name, render: (r) => <span className="stable__text" title={r.name}>{r.name}</span> },
    { key: 'fach', label: 'Fach', width: 80, value: (r) => r.fach },
    { key: 'bereich', label: 'Bereich', width: 200, value: (r) => r.bereich, render: (r) => <span className="stable__text muted" title={r.bereich}>{r.bereich}</span> },
    { key: 'schwierigkeit', label: 'Schwierigkeit', width: 130, align: 'end', value: (r) => r.schwierigkeit, render: (r) => r.schwierigkeit ? <span className="diff" title={DIFF[r.schwierigkeit]}>{'●'.repeat(r.schwierigkeit)}<span className="diff__off">{'●'.repeat(5 - r.schwierigkeit)}</span></span> : '–' },
    { key: 'minuten', label: 'Minuten', width: 100, align: 'end', value: (r) => r.minuten },
    { key: 'voraussetzungen', label: 'Vorauss.', width: 100, align: 'end', value: (r) => r.voraussetzungen },
    { key: 'dokumente', label: 'Dokumente', width: 110, align: 'end', value: (r) => r.dokumente },
    {
      key: 'stand', label: 'Arbeitsstand', width: 170, value: (r) => r.stand,
      render: (r) => <span className={`tag tag--col-${r.stand}`}>{COLUMN_LABEL[r.stand]}</span>,
      editor: onStand ? { options: BOARD_COLUMNS.map((c) => ({ value: c.id, label: c.label })), commit: (r, v) => onStand(r, v as BoardColumn) } : undefined,
    },
  ];
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="stack-2">
      <Bone h="var(--control-h)" r="var(--radius-sm)" />
      {Array.from({ length: rows }, (_, i) => <Bone key={i} h="var(--space-4)" w={i % 3 ? '100%' : '92%'} />)}
    </div>
  );
}

interface ThemenData { rows: ThemaRow[]; subjects: Array<{ id: string; name: string; code?: string }> }

export function ThemenView({ id, state, badge, onRetry, lastSynced, onHide, lifecycle, title = 'Themen', initialQuery, initialSearch = '', highlight, onStand }: {
  id: string; state: WidgetState<ThemenData>; badge: SyncBadge; onRetry: () => void; lastSynced?: Date; onHide?: () => void; lifecycle?: WidgetLifecycle;
  title?: string; initialQuery?: Group; initialSearch?: string; highlight?: string; onStand?: (rows: ThemaRow[], value: BoardColumn) => void | Promise<void>;
}) {
  const [pill, setPill] = useState<Pill>('alle');
  const [search, setSearch] = useState(initialSearch);
  const q = useDebounced(search, 250);
  const [query, setQuery] = useState<Group>(initialQuery ?? emptyGroup());
  const [showQb, setShowQb] = useState(!!initialQuery?.children.length);
  const [sort, setSort] = useState<SortSpec[]>(() => storage.read(`lernstoff.${id}.sort`, []));
  const [widths, setWidths] = useState<Record<string, number>>(() => storage.read(`lernstoff.${id}.widths`, {}));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);

  const data = state.status === 'ideal' || state.status === 'partial' ? state.data : undefined;
  const fields = useMemo(() => fieldsFor(data?.subjects ?? []), [data?.subjects]);
  const columns = useMemo(() => columnsFor(onStand ? (r, v) => onStand([r], v) : undefined), [onStand]);
  const filtered = useMemo(() => {
    if (!data) return [];
    const nq = normalize(q.trim());
    const rows = data.rows.filter((r) => (pill === 'alle' || r.stand === pill)
      && (!nq || normalize(`${r.name} ${r.bereich} ${r.fach}`).includes(nq)) && evaluate(query, r));
    return multiSort(rows, sort, (r, k) => r[k]);
  }, [data, pill, q, query, sort]);
  const pages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current = Math.min(page, pages);
  const visible = pageSize ? filtered.slice((current - 1) * pageSize, current * pageSize) : filtered;
  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: data?.rows.length ?? 0 };
    data?.rows.forEach((r) => { c[r.stand] = (c[r.stand] ?? 0) + 1; });
    return c;
  }, [data]);
  const conds = countConditions(query);

  async function bulk(col: BoardColumn) {
    const rows = filtered.filter((r) => selected.has(r.id));
    await onStand?.(rows, col);
    setSelected(new Set());
  }

  return (
    <Widget<ThemenData, Pill> id={id} state={state} onRetry={onRetry} skeleton={<TableSkeleton />} lifecycle={lifecycle}
      header={{
        title, subtitle: data ? `${filtered.length} von ${data.rows.length} Themen` : 'Themenkatalog des Fachmoduls', badge, onHide,
        filters: [{ key: 'alle', label: 'Alle', count: counts.alle }, ...BOARD_COLUMNS.map((c) => ({ key: c.id, label: c.label, count: counts[c.id] ?? 0 }))],
        activeFilter: pill, onFilterChange: (k) => { setPill(k); setPage(1); },
        exportRows: () => filtered.map((r) => ({ ...r, stand: COLUMN_LABEL[r.stand] })),
      }}
      body={{ minHeight: 'var(--table-body-min)', maxHeight: 'none' }}
      empty={{ illustration: 'themen', title: 'Kein Themenkatalog', message: 'Für dieses Fachmodul sind noch keine Themen hinterlegt.', cta: { label: 'Fächer ansehen', href: '/lernen/faecher' } }}
      footer={{
        lastSynced,
        pagination: { page: current, pageSize, total: filtered.length, pageSizes: [25, 50, 100, 0], onPageChange: setPage, onPageSizeChange: (s) => { setPageSize(s); setPage(1); } },
      }}>
      {() => (
        <div className="themen">
          <div className="themen__toolbar">
            <label className="themen__search">
              <Icon name="search" size={16} />
              <span className="visually-hidden">Themen durchsuchen</span>
              <input type="search" value={search} placeholder="Themen durchsuchen" onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </label>
            <button type="button" className="small" aria-expanded={showQb} aria-controls={`${id}-qb`} onClick={() => setShowQb(!showQb)}>
              Erweiterter Filter{conds ? ` (${conds})` : ''}
            </button>
          </div>
          {showQb && <div id={`${id}-qb`}><QueryBuilder value={query} fields={fields} onChange={(g) => { setQuery(g); setPage(1); }} /></div>}
          {conds > 0 && <p className="muted themen__query">Filter: {describe(query, fields)}</p>}
          {selected.size > 0 && onStand && (
            <div className="bulkbar" role="toolbar" aria-label="Aktionen für Auswahl">
              <strong>{selected.size} ausgewählt</strong>
              <span className="bulkbar__label">Verschieben nach</span>
              {BOARD_COLUMNS.map((c) => <button key={c.id} type="button" className="small" onClick={() => bulk(c.id)}>{c.label}</button>)}
              <button type="button" className="small ghost" onClick={() => setSelected(new Set())}>Auswahl aufheben</button>
            </div>
          )}
          {visible.length === 0
            ? <p className="themen__none">Keine Themen passen zu den Filtern.</p>
            : <SmartTable label={title} rows={visible} columns={columns} rowKey={(r) => r.id} sort={sort} highlight={highlight}
                onSortClick={(k) => setSort((s) => { const n = toggleSort(s, k); storage.write(`lernstoff.${id}.sort`, n); return n; })}
                widths={widths} onWidthChange={(k, w) => setWidths((x) => { const n = { ...x, [k]: w }; storage.write(`lernstoff.${id}.widths`, n); return n; })}
                selected={onStand ? selected : undefined} onSelectedChange={onStand ? setSelected : undefined} />}
        </div>
      )}
    </Widget>
  );
}

export async function loadThemen(moduleId: string): Promise<ThemenData> {
  const mod = getModule(moduleId);
  if (!mod) return { rows: [], subjects: [] };
  const [board, docs] = await Promise.all([db.board.toArray(), db.documents.toArray()]);
  const stand = new Map(board.map((b) => [b.topicId, b.column]));
  const docCount = new Map<string, number>();
  docs.forEach((d) => d.topicIds.forEach((t) => docCount.set(t, (docCount.get(t) ?? 0) + 1)));
  const byId = new Map(mod.topics.map((t) => [t.id, t]));
  const subj = new Map(mod.subjects.map((s) => [s.id, s]));
  const rows = mod.topics.filter((t) => t.parentId).map((t): ThemaRow => ({
    id: t.id, name: t.name, bereich: byId.get(t.parentId!)?.name ?? '', fachId: t.subjectId,
    fach: subj.get(t.subjectId)?.code ?? subj.get(t.subjectId)?.name ?? '', schwierigkeit: t.difficulty, minuten: t.estimatedMinutes,
    voraussetzungen: t.prerequisites.length, dokumente: docCount.get(t.id) ?? 0, stand: stand.get(t.id) ?? 'pool',
  }));
  return { rows, subjects: mod.subjects };
}

export default function ThemenWidget({ id, onHide, lifecycle }: WidgetHostProps) {
  const moduleId = useStore(session, (s) => s.moduleId);
  const { params } = useRoute();
  const fach = params.get('fach');
  const thema = params.get('thema') ?? undefined;
  const { state, retry, lastSynced, badge } = useWidgetData({
    deps: [moduleId], load: () => loadThemen(moduleId),
    isEmpty: (d) => d.rows.length === 0,
    isPartial: (d) => d.rows.length < 5 && 'Der Katalog enthält erst wenige Themen.',
  });
  const initialQuery = fach ? { ...emptyGroup(), children: [{ kind: 'cond' as const, id: newId(), field: 'fachId', op: 'equals' as const, value: fach }] } : undefined;
  const onStand = async (rows: ThemaRow[], column: BoardColumn) => {
    try {
      await moveTopics(rows.map((r) => ({ topicId: r.id, column, name: r.name })));
      if (rows.length > 1) notify('info', `${rows.length} Themen nach „${COLUMN_LABEL[column]}“ verschoben`);
    } catch (e) {
      notify('critical', 'Arbeitsstand nicht gespeichert', e instanceof Error ? e.message : String(e));
    }
  };
  return <ThemenView key={`${fach ?? ''}|${thema ?? ''}`} id={id} state={state} badge={badge} onRetry={retry} lastSynced={lastSynced} onHide={onHide}
    lifecycle={lifecycle} initialQuery={initialQuery} highlight={thema} onStand={onStand} />;
}
