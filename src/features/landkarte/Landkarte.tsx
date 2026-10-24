import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './landkarte.css';
import { db } from '../../core/db';
import { BOARD_COLUMNS, COLUMN_LABEL, moveTopics, type BoardColumn } from '../../core/board';
import type { Topic } from '../../core/types';
import { getModule } from '../../modules/registry';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { navigate, useRoute } from '../../ui/shell/router';
import { notify } from '../../ui/shell/notifications';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Icon } from '../../ui/icons';
import {
  ancestors, edgePath, isReady, layoutMap, openPath, predecessors, selectSubject, successors,
  type MapLayout, type MapNode,
} from './layout';
import { usePanZoom, type View } from './usePanZoom';
import { heute, topicKnowledge } from '../lernplan/store';
import { STATUS_LABEL } from '../lernplan/ui/format';

const DIFF = ['', 'sehr leicht', 'leicht', 'mittel', 'schwer', 'sehr schwer'];

function dauer(min: number): string {
  if (min < 60) return `${min} Min.`;
  const h = Math.round(min / 30) / 2;
  return `${h.toLocaleString('de-DE')} Std.`;
}

async function loadStand(): Promise<Map<string, BoardColumn>> {
  const entries = await db.board.toArray();
  return new Map(entries.map((e) => [e.topicId, e.column]));
}

interface Focus { selected?: string; path: Set<string>; edges: Set<string> }

/** Kanten und Knoten zeichnen. Eigene Komponente, damit Verschieben/Zoomen nichts neu rendert. */
const Welt = memo(function Welt({ map, stand, ready, focus, onSelect, onFocusNode }: {
  map: MapLayout; stand: (id: string) => BoardColumn; ready: Set<string>; focus: Focus;
  onSelect: (id: string) => void; onFocusNode: (n: MapNode) => void;
}) {
  const byId = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map]);
  const dim = !!focus.selected;
  return (
    <>
      {map.lanes.map((l, i) => (
        <div key={l.subjectId} className={`karte__lane${i % 2 ? ' karte__lane--alt' : ''}`} style={{ top: l.y, height: l.h, width: map.width }} />
      ))}
      <svg className="karte__edges" width={map.width} height={map.height} aria-hidden="true">
        <defs>
          {(['muted', 'ok', 'focus'] as const).map((c) => (
            <marker key={c} id={`karte-pfeil-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className={`karte__arrow karte__arrow--${c}`} />
            </marker>
          ))}
        </defs>
        {map.edges.map((e) => {
          const a = byId.get(e.from), b = byId.get(e.to);
          if (!a || !b) return null;
          const key = `${e.from}>${e.to}`;
          const on = focus.edges.has(key);
          const ok = stand(e.from) === 'erarbeitet';
          const tone = on ? 'focus' : ok ? 'ok' : 'muted';
          return (
            <path key={key} d={edgePath(a, b)}
              className={`karte__edge karte__edge--${e.kind} karte__edge--${tone}${dim && !on ? ' is-dim' : ''}`}
              markerEnd={e.kind === 'voraussetzung' ? `url(#karte-pfeil-${tone})` : undefined} />
          );
        })}
      </svg>
      {map.nodes.map((n) => {
        const s = stand(n.id);
        const isReadyNode = ready.has(n.id);
        const cls = ['karte__node', `karte__node--${s}`];
        if (isReadyNode) cls.push('is-ready');
        if (focus.selected === n.id) cls.push('is-selected');
        else if (dim && !focus.path.has(n.id)) cls.push('is-dim');
        return (
          <button key={n.id} type="button" className={cls.join(' ')} data-id={n.id}
            style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
            aria-pressed={focus.selected === n.id}
            aria-label={`${n.topic.name}. ${COLUMN_LABEL[s]}${isReadyNode ? ', bereit: alle Voraussetzungen erarbeitet' : ''}`}
            onClick={() => onSelect(n.id)} onFocus={() => onFocusNode(n)}>
            <span className="karte__node-title">{n.topic.name}</span>
            <span className="karte__node-meta">
              {s === 'erarbeitet' && <Icon name="check" size={14} />}
              {isReadyNode ? 'Bereit' : COLUMN_LABEL[s]}
              {n.topic.estimatedMinutes ? <span className="karte__node-min">{dauer(n.topic.estimatedMinutes)}</span> : null}
            </span>
          </button>
        );
      })}
    </>
  );
});

/** Wissensstand aus dem Lernplan: nur echte Abfragen machen ein Thema „sicher“. */
function Wissensstand({ topic }: { topic: Topic }) {
  const { state } = useWidgetData({ deps: [topic.id], load: () => topicKnowledge(topic) });
  if (state.status !== 'ideal' && state.status !== 'partial') return null;
  const p = state.data;
  const faellig = p.nextReview ? (p.nextReview <= heute() ? 'jetzt fällig' : `nächste Abfrage am ${p.nextReview.split('-').reverse().join('.')}`) : '';
  return (
    <section className="karte__abschnitt">
      <h4>Wissensstand</h4>
      <p><span className={`tag tag--wissen-${p.status}`}>{STATUS_LABEL[p.status]}</span>{faellig ? ` · ${faellig}` : ''}</p>
      <p className="muted">{p.reasons[0]}</p>
      <button type="button" className="small" onClick={() => navigate('/lernen/plan')}>Zum Lernplan</button>
    </section>
  );
}

function Details({ id, topics, preds, succs, stand, rankOf, subjects, onSelect, onClose }: {
  id: string; topics: Map<string, Topic>; preds: Map<string, string[]>; succs: Map<string, string[]>;
  stand: (id: string) => BoardColumn; rankOf: (id: string) => number; subjects: Map<string, { name: string; code?: string }>;
  onSelect: (id: string) => void; onClose: () => void;
}) {
  const t = topics.get(id);
  if (!t) return null;
  const s = stand(id);
  const direkt = preds.get(id) ?? [];
  const folgen = succs.get(id) ?? [];
  const offen = openPath(id, preds, stand, rankOf);
  const offenMin = offen.reduce((sum, x) => sum + (topics.get(x)?.estimatedMinutes ?? 0), 0);
  const einplanbar = offen.filter((x) => stand(x) === 'pool');
  const fach = subjects.get(t.subjectId);
  // Oberthemen ohne eigenes Elternteil heißen wie das Fach, das steht schon davor
  const eltern = t.parentId ? topics.get(t.parentId) : undefined;
  const bereich = eltern?.parentId ? eltern : undefined;

  const setze = async (ids: string[], column: BoardColumn) => {
    try {
      await moveTopics(ids.map((x) => ({ topicId: x, column, name: topics.get(x)?.name })));
      if (ids.length > 1) notify('info', `${ids.length} Themen nach „${COLUMN_LABEL[column]}“ verschoben`);
    } catch (e) {
      notify('critical', 'Arbeitsstand nicht gespeichert', e instanceof Error ? e.message : String(e));
    }
  };

  const Liste = ({ ids, leer }: { ids: string[]; leer: string }) => ids.length ? (
    <ul className="karte__liste">
      {ids.map((x) => (
        <li key={x}>
          <button type="button" className="karte__link" onClick={() => onSelect(x)}>
            <span>{topics.get(x)?.name ?? x}</span>
            <span className={`tag tag--col-${stand(x)}`}>{COLUMN_LABEL[stand(x)]}</span>
          </button>
        </li>
      ))}
    </ul>
  ) : <p className="muted">{leer}</p>;

  return (
    <aside className="card karte__details" aria-labelledby="karte-detail-titel">
      <div className="karte__details-kopf">
        <div>
          <p className="muted">{fach ? (fach.code ? `${fach.code} · ${fach.name}` : fach.name) : ''}{bereich ? ` › ${bereich.name}` : ''}</p>
          <h3 id="karte-detail-titel">{t.name}</h3>
        </div>
        <button type="button" className="icon ghost" onClick={onClose} aria-label="Details schließen"><Icon name="close" /></button>
      </div>
      <p className="muted">
        {t.difficulty ? `Schwierigkeit: ${DIFF[t.difficulty]}` : ''}
        {t.difficulty && t.estimatedMinutes ? ' · ' : ''}
        {t.estimatedMinutes ? `Erstlernzeit ca. ${dauer(t.estimatedMinutes)}` : ''}
      </p>

      <div className="pills" role="group" aria-label="Arbeitsstand">
        {BOARD_COLUMNS.map((c) => (
          <button key={c.id} type="button" className="pill" aria-pressed={s === c.id} title={c.hint} onClick={() => s !== c.id && setze([id], c.id)}>{c.label}</button>
        ))}
      </div>

      <Wissensstand topic={t} />

      <section className="karte__abschnitt">
        <h4>Lernpfad bis hierhin</h4>
        {offen.length === 0
          ? <p className="note ok">{direkt.length ? 'Alle Voraussetzungen sind erarbeitet.' : 'Keine Voraussetzungen im Katalog: guter Einstieg.'}</p>
          : <>
            <p>{offen.length === 1 ? 'Noch 1 Thema' : `Noch ${offen.length} Themen`} vorher{offenMin ? `, zusammen ca. ${dauer(offenMin).replace(/\.$/, '')}` : ''}. In dieser Reihenfolge:</p>
            <Liste ids={offen} leer="" />
            {einplanbar.length > 0 && (
              <button type="button" onClick={() => setze(einplanbar, 'woche')}>
                {einplanbar.length === 1 ? '1 offenes Thema' : `${einplanbar.length} offene Themen`} für diese Woche einplanen
              </button>
            )}
          </>}
      </section>

      <section className="karte__abschnitt">
        <h4>Direkte Voraussetzungen</h4>
        <Liste ids={direkt} leer="Keine." />
      </section>
      <section className="karte__abschnitt">
        <h4>Baut darauf auf</h4>
        <Liste ids={folgen} leer="Kein weiteres Thema im Katalog." />
      </section>
      <button type="button" className="karte__mehr" onClick={() => navigate(`/lernen/themen?thema=${encodeURIComponent(id)}`)}>
        In der Themen-Tabelle zeigen
      </button>
    </aside>
  );
}

export default function Landkarte() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const mod = getModule(moduleId);
  const { params } = useRoute();
  const [fach, setFach] = useState(() => params.get('fach') ?? '');
  const [selected, setSelected] = useState<string | undefined>(() => params.get('thema') ?? undefined);
  const [suche, setSuche] = useState('');
  const { state, retry } = useWidgetData({ deps: [], load: loadStand });

  const map = useMemo(() => mod ? layoutMap(selectSubject(mod.topics, fach || undefined), mod.subjects) : undefined, [mod, fach]);
  const preds = useMemo(() => predecessors(map?.edges ?? []), [map]);
  const succs = useMemo(() => successors(map?.edges ?? []), [map]);
  const rankOf = useMemo(() => {
    const r = new Map(map?.nodes.map((n) => [n.id, n.rank]));
    return (id: string) => r.get(id) ?? 0;
  }, [map]);
  const topics = useMemo(() => new Map(mod?.topics.map((t) => [t.id, t])), [mod]);
  const subjects = useMemo(() => new Map(mod?.subjects.map((s) => [s.id, s])), [mod]);

  const standMap = state.status === 'ideal' || state.status === 'partial' ? state.data : undefined;
  const stand = useMemo(() => (id: string): BoardColumn => standMap?.get(id) ?? 'pool', [standMap]);
  const ready = useMemo(() => new Set(map?.nodes.filter((n) => isReady(n.id, preds, stand)).map((n) => n.id)), [map, preds, stand]);

  const focus = useMemo<Focus>(() => {
    if (!selected || !map?.nodes.some((n) => n.id === selected)) return { path: new Set(), edges: new Set() };
    const vor = ancestors(selected, preds);
    const nach = succs.get(selected) ?? [];
    const path = new Set([selected, ...vor, ...nach]);
    const kette = new Set([selected, ...vor]);
    const edges = new Set(map.edges
      .filter((e) => (kette.has(e.to) && kette.has(e.from)) || (e.from === selected))
      .map((e) => `${e.from}>${e.to}`));
    return { selected, path, edges };
  }, [selected, map, preds, succs]);

  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const laneLabels = useRef<HTMLDivElement>(null);
  const mapRef = useRef(map);
  mapRef.current = map;
  // Fachnamen laufen am linken Rand mit, damit man bei jedem Zoom weiß, in welchem Fach man ist
  const onView = useCallback((v: View) => {
    const box = laneLabels.current, m = mapRef.current;
    if (!box || !m) return;
    const vh = viewport.current?.clientHeight ?? 0;
    m.lanes.forEach((l, i) => {
      const el = box.children[i] as HTMLElement | undefined;
      if (!el) return;
      const top = l.y * v.k + v.y, bottom = (l.y + l.h) * v.k + v.y;
      const y = Math.min(Math.max(top + 4, 4), bottom - el.offsetHeight - 4);
      el.style.transform = `translate(${Math.max(8, v.x + 16 * v.k)}px, ${y}px)`;
      el.style.visibility = bottom - top > el.offsetHeight + 8 && bottom > 0 && top < vh ? 'visible' : 'hidden';
    });
  }, []);
  const pz = usePanZoom(viewport, world, { w: map?.width ?? 0, h: map?.height ?? 0 }, onView);
  // Auf schmalen Flächen deckt das Detailblatt die untere Hälfte ab: gewähltes Thema dann oben zeigen
  const anchor = () => ((viewport.current?.clientWidth ?? 1000) < 700 ? { x: 0.5, y: 0.22 } : { x: 0.5, y: 0.5 });

  // Beim ersten Anzeigen und nach Fachwechsel einpassen; ein vorgewähltes Thema in die Mitte holen
  const initial = useRef(true);
  useLayoutEffect(() => {
    if (!map) return;
    const sel = initial.current && selected ? map.nodes.find((n) => n.id === selected) : undefined;
    if (sel) pz.centerOn(sel, 0.9, anchor()); else pz.fit(!initial.current);
    initial.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Erstes Einpassen, sobald die Fläche eine Größe hat (Seitenwechsel, Drehen des iPads)
  useEffect(() => {
    const el = viewport.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let last = 0;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e!.contentRect.width);
      if (last === 0 && w > 0 && !selected) pz.fit(false);
      last = w;
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pz.fit]);

  // Stabile Rückrufe für <Welt>, damit Verschieben und Zoomen die Knoten nicht neu rendert
  const latest = useRef({ map, pz });
  latest.current = { map, pz };
  const select = useCallback((id: string) => {
    setSelected((cur) => (cur === id ? undefined : id));
    const { map: m, pz: z } = latest.current;
    const n = m?.nodes.find((x) => x.id === id);
    const schmal = (viewport.current?.clientWidth ?? 1000) < 700;
    if (n && (schmal || !z.isVisible(n))) z.centerOn(n, 0.6, anchor());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onFocusNode = useCallback((n: MapNode) => {
    const z = latest.current.pz;
    if (!z.isVisible(n)) z.centerOn(n, 0.6);
  }, []);

  const springe = (name: string) => {
    setSuche(name);
    const n = map?.nodes.find((x) => x.topic.name === name);
    if (n) { setSelected(n.id); pz.centerOn(n, 0.9, anchor()); }
  };

  if (!mod) return <section className="page"><h2>Themen-Landkarte</h2><p>Kein Fachmodul gewählt.</p></section>;

  const erarbeitet = map?.nodes.filter((n) => stand(n.id) === 'erarbeitet').length ?? 0;
  const gesamt = map?.nodes.length ?? 0;

  return (
    <section className="page karte">
      <div className="page__head">
        <h2>Themen-Landkarte</h2>
        <p className="muted">
          <span className="karte__intro">Pfeile zeigen, was worauf aufbaut, die Farbe deinen Arbeitsstand. Thema antippen zeigt den Lernpfad. </span><span className="karte__stand" aria-live="polite"><strong>{erarbeitet}</strong> von {gesamt} erarbeitet, <strong>{ready.size}</strong> bereit.</span>
        </p>
      </div>

      <div className="karte__werkzeuge">
        <label className="karte__feld">
          <span className="visually-hidden">Fach</span>
          <select value={fach} onChange={(e) => setFach(e.target.value)}>
            <option value="">Alle Fächer</option>
            {mod.subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} · ${s.name}` : s.name}</option>)}
          </select>
        </label>
        <label className="karte__feld karte__feld--suche">
          <span className="visually-hidden">Thema finden</span>
          <input type="search" list="karte-themen" value={suche} placeholder="Thema finden, z. B. Diabetes" enterKeyHint="search"
            onChange={(e) => { setSuche(e.target.value); if (map?.nodes.some((n) => n.topic.name === e.target.value)) springe(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const q = suche.trim().toLocaleLowerCase('de');
              const n = q && map?.nodes.find((x) => x.topic.name.toLocaleLowerCase('de').includes(q));
              if (n) springe(n.topic.name); else notify('info', 'Kein passendes Thema gefunden');
            }} />
          <datalist id="karte-themen">{map?.nodes.map((n) => <option key={n.id} value={n.topic.name} />)}</datalist>
        </label>
        <details className="karte__legende-box">
          <summary>Legende</summary>
          <ul className="karte__legende">
            {BOARD_COLUMNS.map((c) => <li key={c.id}><span className={`karte__swatch karte__node--${c.id}`} />{c.label}</li>)}
            <li><span className="karte__swatch karte__swatch--ready" />Bereit: alle Voraussetzungen erarbeitet</li>
            <li><svg width="28" height="10" aria-hidden="true"><path d="M1,5 H22" className="karte__edge karte__edge--muted" /><path d="M20,1 L27,5 L20,9 z" className="karte__arrow karte__arrow--muted" /></svg>ist Voraussetzung für</li>
            <li><svg width="28" height="10" aria-hidden="true"><path d="M1,5 H22" className="karte__edge karte__edge--ok" /><path d="M20,1 L27,5 L20,9 z" className="karte__arrow karte__arrow--ok" /></svg>Voraussetzung erarbeitet</li>
            <li><svg width="28" height="10" aria-hidden="true"><path d="M1,5 H27" className="karte__edge karte__edge--teil karte__edge--muted" /></svg>Unterthema</li>
            <li>Ziehen verschiebt, zwei Finger oder Strg + Mausrad zoomen, Doppeltipp zoomt hinein.</li>
          </ul>
        </details>
      </div>

      {state.status === 'error' && (
        <p className="note warn">Arbeitsstand konnte nicht geladen werden. <button type="button" onClick={retry}>Erneut versuchen</button></p>
      )}

      <div className={`karte__rahmen${selected ? ' has-details' : ''}`}>
        <div ref={viewport} className="karte__viewport" tabIndex={0} onKeyDown={pz.onKeyDown}
          role="group" aria-roledescription="Karte" aria-label="Themen-Landkarte. Pfeiltasten verschieben, Plus und Minus zoomen, 0 passt ein.">
          <div ref={world} className="karte__welt" style={{ width: map?.width, height: map?.height }}>
            {map && <Welt map={map} stand={stand} ready={ready} focus={focus} onSelect={select} onFocusNode={onFocusNode} />}
          </div>
          <div ref={laneLabels} className="karte__lane-labels" aria-hidden="true">
            {map?.lanes.map((l) => <span key={l.subjectId} className="karte__lane-label">{l.label}</span>)}
          </div>
        </div>
        <div className="karte__zoom" role="group" aria-label="Zoom">
          <button type="button" className="icon ghost" onClick={() => pz.zoomBy(1.25)} disabled={pz.zoom >= pz.maxZoom} aria-label="Hineinzoomen"><Icon name="plus" /></button>
          <span className="karte__zoomwert">{Math.round(pz.zoom * 100)} %</span>
          <button type="button" className="icon ghost" onClick={() => pz.zoomBy(0.8)} disabled={pz.zoom <= pz.minZoom} aria-label="Herauszoomen"><Icon name="minus" /></button>
          <button type="button" className="icon ghost" onClick={() => pz.fit()} aria-label="Ganze Karte zeigen"><Icon name="maximize" /></button>
        </div>
        {selected && topics.has(selected) && (
          <Details id={selected} topics={topics} preds={preds} succs={succs} stand={stand} rankOf={rankOf} subjects={subjects}
            onSelect={select} onClose={() => setSelected(undefined)} />
        )}
      </div>
    </section>
  );
}
