import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../core/db';
import { BOARD_COLUMNS, COLUMN_LABEL, moveTopics, type BoardColumn } from '../../core/board';
import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { SyncBadge, WidgetHostProps, WidgetLifecycle, WidgetState } from '../../ui/widget/types';
import { useStore } from '../../ui/lib/store';
import { useSentinel } from '../../ui/lib/hooks';
import { Icon } from '../../ui/icons';
import { session } from '../../ui/shell/session';
import { notify } from '../../ui/shell/notifications';
import { getModule } from '../../modules/registry';
import { arrange, orderForDrop, type Card, type Columns } from './board-model';

const BATCH = 12;
type Pill = 'alle' | 'leicht' | 'schwer';
interface Target { column: BoardColumn; index: number }
interface Drag { id: string; x: number; y: number; dx: number; dy: number; width: number; mode: 'pointer' | 'keyboard' }

export interface BoardData { cards: Array<Omit<Card, 'column' | 'order'>>; entries: import('../../core/board').BoardEntry[]; subjects: Array<{ id: string; name: string; code?: string }> }

export function BoardSkeleton() {
  return (
    <div className="board">
      {BOARD_COLUMNS.map((c, i) => (
        <div key={c.id} className="board__col">
          <div className="board__colhead"><Bone w="50%" /></div>
          <div className="board__list">{Array.from({ length: 4 - (i % 2) }, (_, j) => <Bone key={j} h="var(--card-h)" r="var(--radius-sm)" />)}</div>
        </div>
      ))}
    </div>
  );
}

function CardView({ card, dragging, kbActive, onPointerDown, onKeyDown, onMove }: {
  card: Card; dragging: boolean; kbActive: boolean;
  onPointerDown: (e: React.PointerEvent, card: Card) => void; onKeyDown: (e: React.KeyboardEvent, card: Card) => void;
  onMove: (card: Card, col: BoardColumn) => void;
}) {
  return (
    <article className={`kcard${dragging ? ' is-drag-source' : ''}${kbActive ? ' is-lifted' : ''}`} data-card={card.id} tabIndex={0}
      aria-roledescription="verschiebbare Karte" aria-label={`${card.name}, ${card.fach}`}
      aria-describedby="board-help" onKeyDown={(e) => onKeyDown(e, card)}>
      <span className="kcard__grip" onPointerDown={(e) => onPointerDown(e, card)} aria-hidden="true"><Icon name="grip" size={18} /></span>
      <div className="kcard__body">
        <div className="kcard__title">{card.name}</div>
        <div className="kcard__meta">
          <span className="tag">{card.fach}</span>
          {card.minutes && <span>{card.minutes} Min.</span>}
          {card.difficulty && <span className="diff" title={`Schwierigkeit ${card.difficulty} von 5`}>{'●'.repeat(card.difficulty)}<span className="diff__off">{'●'.repeat(5 - card.difficulty)}</span></span>}
        </div>
      </div>
      <label className="kcard__move">
        <span className="visually-hidden">Verschieben nach</span>
        <select value={card.column} onChange={(e) => onMove(card, e.target.value as BoardColumn)} tabIndex={-1}>
          {BOARD_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <Icon name="chevronDown" size={14} />
      </label>
    </article>
  );
}

function Column({ id, label, hint, cards, target, drag, onPointerDown, onKeyDown, onMove }: {
  id: BoardColumn; label: string; hint: string; cards: Card[]; target: Target | null; drag: Drag | null;
  onPointerDown: (e: React.PointerEvent, card: Card) => void; onKeyDown: (e: React.KeyboardEvent, card: Card) => void; onMove: (c: Card, col: BoardColumn) => void;
}) {
  const [shown, setShown] = useState(BATCH);
  const sentinel = useSentinel(() => setShown((s) => s + BATCH), shown < cards.length, [cards.length]);
  const isTarget = target?.column === id;
  const visible = cards.slice(0, Math.max(shown, isTarget ? target!.index + 1 : 0));
  return (
    <section className={`board__col${isTarget ? ' is-drop-target' : ''}`} data-col={id} aria-label={`${label}, ${cards.length} Themen`}>
      <header className="board__colhead">
        <h4>{label} <span className="board__count">{cards.length}</span></h4>
        <p className="muted">{hint}</p>
      </header>
      <div className="board__list" data-scroll-root="">
        {visible.map((c, i) => (
          <div key={c.id}>
            {isTarget && target!.index === i && <div className="drop-line" aria-hidden="true" />}
            <CardView card={c} dragging={drag?.id === c.id && drag.mode === 'pointer'} kbActive={drag?.id === c.id && drag.mode === 'keyboard'}
              onPointerDown={onPointerDown} onKeyDown={onKeyDown} onMove={onMove} />
          </div>
        ))}
        {isTarget && target!.index >= visible.length && <div className="drop-line" aria-hidden="true" />}
        {cards.length === 0 && !isTarget && <p className="board__empty">Hierher ziehen</p>}
        {shown < cards.length && (
          <div ref={sentinel} className="board__more">
            <button type="button" className="small ghost" onClick={() => setShown((s) => s + BATCH)}>{cards.length - shown} weitere laden</button>
          </div>
        )}
      </div>
    </section>
  );
}

export function BoardView({ id, state, badge, onRetry, lastSynced, onHide, lifecycle, onCommit }: {
  id: string; state: WidgetState<BoardData>; badge: SyncBadge; onRetry: () => void; lastSynced?: Date; onHide?: () => void; lifecycle?: WidgetLifecycle;
  onCommit?: (card: Card, column: BoardColumn, order: number) => Promise<void>;
}) {
  const [pill, setPill] = useState<Pill>('alle');
  const [fach, setFach] = useState('');
  const [overrides, setOverrides] = useState(new Map<string, { column: BoardColumn; order: number }>());
  const [drag, setDrag] = useState<Drag | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [announce, setAnnounce] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const refocus = useRef<string | null>(null);
  const data = state.status === 'ideal' || state.status === 'partial' ? state.data : undefined;

  const cols: Columns | null = useMemo(() => {
    if (!data) return null;
    const cards = data.cards.filter((c) => (!fach || c.fachId === fach)
      && (pill === 'alle' || (pill === 'leicht' ? (c.difficulty ?? 3) <= 2 : (c.difficulty ?? 3) >= 4)));
    return arrange(cards, data.entries, overrides);
  }, [data, overrides, pill, fach]);

  // Bestätigte Daten ersetzen die optimistische Vorschau.
  useEffect(() => {
    if (!data || !overrides.size) return;
    const byTopic = new Map(data.entries.map((e) => [e.topicId, e]));
    const pending = new Map([...overrides].filter(([k, v]) => byTopic.get(k)?.column !== v.column || byTopic.get(k)?.order !== v.order));
    if (pending.size !== overrides.size) setOverrides(pending);
  }, [data, overrides]);
  useEffect(() => {
    if (!refocus.current) return;
    (boardRef.current?.querySelector(`[data-card="${CSS.escape(refocus.current)}"]`) as HTMLElement | null)?.focus();
    refocus.current = null;
  });

  async function commit(card: Card, column: BoardColumn, index: number) {
    if (!cols || !onCommit) return;
    const order = orderForDrop(cols, card.id, column, index);
    setOverrides((m) => new Map(m).set(card.id, { column, order }));   // optimistisch
    setAnnounce(`${card.name} liegt jetzt in ${COLUMN_LABEL[column]}, Position ${index + 1}.`);
    try {
      await onCommit(card, column, order);
    } catch (e) {
      setOverrides((m) => { const n = new Map(m); n.delete(card.id); return n; });   // zurückrollen
      notify('critical', 'Verschieben fehlgeschlagen', e instanceof Error ? e.message : String(e));
    }
  }

  function targetAt(x: number, y: number, dragId: string): Target | null {
    const els = document.elementsFromPoint(x, y);
    const colEl = els.find((el) => (el as HTMLElement).dataset?.col) as HTMLElement | undefined;
    if (!colEl || !cols) return null;
    const column = colEl.dataset.col as BoardColumn;
    const cardEls = [...colEl.querySelectorAll<HTMLElement>('[data-card]')].filter((el) => el.dataset.card !== dragId);
    let index = cardEls.length;
    for (let i = 0; i < cardEls.length; i++) {
      const r = cardEls[i]!.getBoundingClientRect();
      if (y < r.top + r.height / 2) { index = i; break; }
    }
    return { column, index };
  }

  function onPointerDown(e: React.PointerEvent, card: Card) {
    if (!onCommit || e.button !== 0) return;
    e.preventDefault();
    const el = (e.currentTarget as HTMLElement).closest('[data-card]') as HTMLElement;
    const r = el.getBoundingClientRect();
    const grip = e.currentTarget as HTMLElement;
    grip.setPointerCapture(e.pointerId);
    let current: Drag = { id: card.id, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, width: r.width, mode: 'pointer' };
    let tgt: Target | null = null;
    setDrag(current);
    const move = (ev: PointerEvent) => {
      current = { ...current, x: ev.clientX, y: ev.clientY };
      setDrag(current);
      tgt = targetAt(ev.clientX, ev.clientY, card.id);
      setTarget(tgt);
      // Automatisch scrollen, wenn die Karte an den Rand gezogen wird (Handy: Spalten nebeneinander).
      const b = boardRef.current;
      if (b) {
        const br = b.getBoundingClientRect();
        if (ev.clientX < br.left + 32) b.scrollLeft -= 16; else if (ev.clientX > br.right - 32) b.scrollLeft += 16;
      }
    };
    const end = (ev: PointerEvent) => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', end);
      grip.removeEventListener('pointercancel', end);
      setDrag(null); setTarget(null);
      if (ev.type === 'pointerup' && tgt) commit(card, tgt.column, tgt.index);
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }

  function onKeyDown(e: React.KeyboardEvent, card: Card) {
    if (!cols || !onCommit) return;
    const lifted = drag?.mode === 'keyboard' && drag.id === card.id;
    const colIdx = BOARD_COLUMNS.findIndex((c) => c.id === (target?.column ?? card.column));
    if (!lifted) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const index = cols[card.column].findIndex((c) => c.id === card.id);
        setDrag({ id: card.id, x: 0, y: 0, dx: 0, dy: 0, width: 0, mode: 'keyboard' });
        setTarget({ column: card.column, index });
        setAnnounce(`${card.name} aufgenommen. Pfeiltasten verschieben, Leertaste legt ab, Escape bricht ab.`);
      }
      return;
    }
    const t = target!;
    const len = (col: BoardColumn) => cols[col].filter((c) => c.id !== card.id).length;
    let next: Target | null = null;
    if (e.key === 'ArrowRight' && colIdx < BOARD_COLUMNS.length - 1) { const col = BOARD_COLUMNS[colIdx + 1]!.id; next = { column: col, index: Math.min(t.index, len(col)) }; }
    else if (e.key === 'ArrowLeft' && colIdx > 0) { const col = BOARD_COLUMNS[colIdx - 1]!.id; next = { column: col, index: Math.min(t.index, len(col)) }; }
    else if (e.key === 'ArrowDown') next = { ...t, index: Math.min(t.index + 1, len(t.column)) };
    else if (e.key === 'ArrowUp') next = { ...t, index: Math.max(0, t.index - 1) };
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setDrag(null); setTarget(null);
      refocus.current = card.id;
      commit(card, t.column, t.index);
      return;
    } else if (e.key === 'Escape') {
      setDrag(null); setTarget(null); setAnnounce('Verschieben abgebrochen.');
      return;
    }
    if (next) {
      e.preventDefault();
      setTarget(next);
      setAnnounce(`${COLUMN_LABEL[next.column]}, Position ${next.index + 1}`);
    }
  }

  const dragCard = drag?.mode === 'pointer' && cols ? Object.values(cols).flat().find((c) => c.id === drag.id) : undefined;

  return (
    <Widget<BoardData, Pill> id={id} state={state} onRetry={onRetry} skeleton={<BoardSkeleton />} lifecycle={lifecycle}
      header={{
        title: 'Lernstand-Board', subtitle: 'Arbeitsstand je Thema. Sicher ist ein Thema erst nach erfolgreichen Abfragen.', badge, onHide,
        filters: [{ key: 'alle', label: 'Alle' }, { key: 'leicht', label: 'Leicht' }, { key: 'schwer', label: 'Schwer' }],
        activeFilter: pill, onFilterChange: setPill,
        exportRows: cols ? () => Object.values(cols).flat().map((c) => ({ thema: c.name, fach: c.fach, stand: COLUMN_LABEL[c.column] })) : undefined,
      }}
      body={{ minHeight: 'var(--board-body-min)', maxHeight: 'none' }}
      empty={{ illustration: 'board', title: 'Keine Themen', message: 'Das Fachmodul enthält noch keine Themen für das Board.', cta: { label: 'Fächer ansehen', href: '/lernen/faecher' } }}
      footer={{ lastSynced, secondary: data && (
        <label className="board__fach">
          <span className="visually-hidden">Fach</span>
          <select value={fach} onChange={(e) => setFach(e.target.value)}>
            <option value="">Alle Fächer</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.code ?? s.name}</option>)}
          </select>
        </label>
      ) }}>
      {() => cols && (
        <>
          <p id="board-help" className="visually-hidden">Leertaste nimmt die Karte auf, Pfeiltasten verschieben sie, Leertaste legt sie ab. Auf dem Handy am Griff ziehen oder über die Auswahl verschieben.</p>
          <div className="visually-hidden" aria-live="assertive">{announce}</div>
          <div ref={boardRef} className={`board${drag ? ' is-dragging' : ''}`}>
            {BOARD_COLUMNS.map((c) => (
              <Column key={c.id} id={c.id} label={c.label} hint={c.hint} cards={cols[c.id]} target={target} drag={drag}
                onPointerDown={onPointerDown} onKeyDown={onKeyDown}
                onMove={(card, col) => { refocus.current = card.id; commit(card, col, cols[col].length); }} />
            ))}
          </div>
          {dragCard && drag && createPortal(
            <div className="kcard kcard--ghost" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width }} aria-hidden="true">
              <span className="kcard__grip"><Icon name="grip" size={18} /></span>
              <div className="kcard__body"><div className="kcard__title">{dragCard.name}</div><div className="kcard__meta"><span className="tag">{dragCard.fach}</span></div></div>
            </div>, document.body,
          )}
        </>
      )}
    </Widget>
  );
}

export async function loadBoard(moduleId: string): Promise<BoardData> {
  const mod = getModule(moduleId);
  const entries = await db.board.toArray();
  const subj = new Map(mod?.subjects.map((s) => [s.id, s]) ?? []);
  const cards = (mod?.topics ?? []).filter((t) => t.parentId).map((t) => ({
    id: t.id, name: t.name, fachId: t.subjectId, fach: subj.get(t.subjectId)?.code ?? subj.get(t.subjectId)?.name ?? '',
    difficulty: t.difficulty, minutes: t.estimatedMinutes,
  }));
  return { cards, entries, subjects: mod?.subjects ?? [] };
}

export default function BoardWidget({ id, onHide, lifecycle }: WidgetHostProps) {
  const moduleId = useStore(session, (s) => s.moduleId);
  const { state, retry, lastSynced, badge } = useWidgetData({
    deps: [moduleId], load: () => loadBoard(moduleId),
    isEmpty: (d) => d.cards.length === 0,
    isPartial: (d) => !d.entries.some((e) => e.column !== 'pool') && 'Noch nichts eingeplant: Zieh Themen aus dem Pool nach „Diese Woche“.',
  });
  return <BoardView id={id} state={state} badge={badge} onRetry={retry} lastSynced={lastSynced} onHide={onHide} lifecycle={lifecycle}
    onCommit={(card, column, order) => moveTopics([{ topicId: card.id, column, order, name: card.name }])} />;
}
