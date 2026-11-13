import { useMemo, useState } from 'react';
import type { WidgetState } from '../ui/widget/types';
import { Widget } from '../ui/widget/Widget';
import { KpiView } from '../widgets/kpi/KpiWidget';
import { ChartView } from '../widgets/charts/ChartWidget';
import { FeedView } from '../widgets/feed/FeedWidget';
import { ThemenView } from '../widgets/themen/ThemenWidget';
import { BoardView } from '../widgets/board/BoardWidget';
import { WizardView } from '../widgets/wizard/ImportWizard';
import { mockBoard, mockChart, mockFeed, mockKpis, mockThemen, mockWizard } from '../widgets/mocks';
import { notify } from '../ui/shell/notifications';
import { Icon } from '../ui/icons';
import { SystemLabor } from './designsystem/SystemLabor';
import { RaumBuehne } from '../ui/sim/raeume/RaumBuehne';
import { RAEUME, RAUM_IDS, type MonitorZustand, type RaumId } from '../ui/sim/raeume/katalog';

type Lab = 'kpi' | 'chart' | 'feed' | 'themen' | 'board' | 'wizard';
type LabState = 'ideal' | 'loading' | 'empty' | 'error' | 'partial' | 'interaktiv';

const LABS: Array<[Lab, string]> = [['kpi', 'Kennzahlen'], ['chart', 'Diagramme'], ['feed', 'Aktivitäts-Feed'], ['themen', 'Tabelle'], ['board', 'Kanban'], ['wizard', 'Assistent']];
const STATES: Array<[LabState, string]> = [['ideal', 'Ideal'], ['loading', 'Laden'], ['empty', 'Leer'], ['error', 'Fehler'], ['partial', 'Teilweise'], ['interaktiv', 'Interaktiv']];

const COLORS = ['primary', 'primary-soft', 'secondary', 'secondary-soft', 'background', 'surface', 'surface-raised', 'surface-sunken', 'border', 'border-strong', 'text', 'text-muted', 'success', 'warning', 'danger', 'info', 'focus'];
const AKZENTE = ['ink', 'outline', 'sun', 'coral', 'mint', 'apricot', 'lilac', 'sky'];
const KACHELN = [1, 2, 3, 4];
const BEWEGUNGEN: Array<[string, string]> = [['m-rise', 'von unten einblenden'], ['m-pop', 'aufspringen'], ['m-wipe', 'aufdecken'], ['m-shake', 'Fehler'], ['m-float', 'schweben'], ['m-pulse', 'Aufmerksamkeit']];
const SPACES = [1, 2, 3, 4, 5, 6, 7];
const SPACE_PX = ['4', '8', '16', '24', '32', '48', '64'];

function stateOf<T>(s: LabState, ideal: () => T, partial: () => T): WidgetState<T> {
  if (s === 'loading') return { status: 'loading' };
  if (s === 'empty') return { status: 'empty' };
  if (s === 'error') return { status: 'error', error: new Error('Die lokale Datenbank hat nicht geantwortet (Beispiel).') };
  if (s === 'partial') return { status: 'partial', data: partial(), reason: 'Beispiel für wenige Datensätze.' };
  return { status: 'ideal', data: ideal() };
}

function Boom(): never { throw new Error('Absichtlicher Renderfehler im Inhalt (Beispiel).'); }

function StateLab() {
  const [lab, setLab] = useState<Lab>('kpi');
  const [st, setSt] = useState<LabState>('ideal');
  const [nonce, setNonce] = useState(0);
  const common = { id: `lab-${lab}`, badge: 'demo' as const, onRetry: () => { notify('info', 'Neuer Versuch (Beispiel)'); setSt('ideal'); }, lastSynced: new Date(Date.now() - 120_000) };
  const view = useMemo(() => {
    switch (lab) {
      case 'kpi': return <KpiView {...common} state={stateOf(st, () => mockKpis(), () => mockKpis(true))} />;
      case 'chart': return <ChartView {...common} state={stateOf(st, () => mockChart(), () => mockChart(true))} onDrill={(d) => notify('info', `Drill-down auf ${d} (Beispiel)`)} />;
      case 'feed': return <FeedView {...common} state={stateOf(st, () => mockFeed(), () => mockFeed(true))} sev="alle" onSev={() => undefined} onMore={() => notify('info', 'Weitere Einträge würden jetzt geladen')} />;
      case 'themen': return <ThemenView {...common} title="Themen (Beispiel)" state={stateOf(st, () => mockThemen(), () => mockThemen(3))} onStand={(rows, c) => notify('info', `${rows.length} → ${c} (Beispiel, nicht gespeichert)`)} />;
      case 'board': return <BoardView {...common} state={stateOf(st, () => mockBoard(), () => mockBoard(true))} onCommit={async () => undefined} />;
      case 'wizard': return <WizardView {...common} state={stateOf(st, () => mockWizard(), () => mockWizard(true))} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lab, st, nonce]);

  return (
    <div className="ds-lab">
      <div className="ds-lab__bar">
        <label className="field">Modul
          <select value={lab} onChange={(e) => setLab(e.target.value as Lab)}>{LABS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <div className="pills" role="group" aria-label="Zustand">
          {STATES.map(([k, l]) => <button key={k} type="button" className="pill" aria-pressed={st === k} onClick={() => { setSt(k); setNonce((n) => n + 1); }}>{l}</button>)}
        </div>
      </div>
      {st === 'interaktiv' && <p className="note">Interaktiv: Fahre über Karten und Zeilen, springe mit Tab durch die Bedienelemente (sichtbarer Fokusring), zieh Karten am Griff oder drück auf einer Karte die Leertaste und verschieb sie mit den Pfeiltasten.</p>}
      <div key={`${lab}-${st}-${nonce}`}>{view}</div>
    </div>
  );
}

/** Bewegungs-Bausteine aus motion.css zum Ausprobieren. „Nochmal“ baut die Kästen neu auf. */
function BewegungsLabor() {
  const [lauf, setLauf] = useState(0);
  return (
    <>
      <p className="muted">Klassen und Tokens aus <code>src/ui/motion.css</code>. Dauern: <code>--dur-fast</code> 120 ms, <code>--dur-normal</code> 200 ms, <code>--dur-slow</code> 420 ms, <code>--dur-slower</code> 700 ms. Kurven: <code>--ease-out</code>, <code>--ease-spring</code>. Bei „Bewegung reduziert“ (System oder Profilmenü) steht alles sofort im Endzustand.</p>
      <div className="ds-motion" key={lauf}>
        {BEWEGUNGEN.map(([k, l]) => <div key={k} className={k}><code>.{k}</code><span>{l}</span></div>)}
      </div>
      <ul className="ds-motion m-stagger" key={`s${lauf}`} role="list" aria-label="Beispiel für .m-stagger">
        {KACHELN.concat(KACHELN).map((n, i) => <li key={i} style={{ background: `var(--tile-${n})` }}><code>.m-stagger</code><span>Kind {i + 1}</span></li>)}
      </ul>
      <div className="ds-states">
        <button type="button" onClick={() => setLauf((n) => n + 1)}><Icon name="refresh" size={16} /> Nochmal abspielen</button>
        <button type="button" className="m-press">.m-press: Taste mit hartem Schatten</button>
      </div>
    </>
  );
}

function BoundaryDemo() {
  const [boom, setBoom] = useState(false);
  return (
    <div className="grid12">
      <div className="grid__cell" style={{ '--span-md': 6 } as React.CSSProperties}>
        <Widget id="demo-a" state={{ status: 'ideal', data: 1 }} onRetry={() => setBoom(false)} skeleton={null}
          header={{ title: 'Modul A', subtitle: 'Löst auf Wunsch einen Renderfehler aus', badge: 'demo' }}
          empty={{ title: '', message: '', cta: { label: '' } }}
          footer={{ secondary: <button type="button" className="small danger" onClick={() => setBoom(true)}>Fehler auslösen</button> }}>
          {() => (boom ? <Boom /> : <p>Alles in Ordnung.</p>)}
        </Widget>
      </div>
      <div className="grid__cell" style={{ '--span-md': 6 } as React.CSSProperties}>
        <Widget id="demo-b" state={{ status: 'ideal', data: 1 }} onRetry={() => undefined} skeleton={null}
          header={{ title: 'Modul B', subtitle: 'Läuft unabhängig weiter', badge: 'live' }} empty={{ title: '', message: '', cta: { label: '' } }}>
          {() => <p>Ich bleibe sichtbar, auch wenn Modul A abstürzt.</p>}
        </Widget>
      </div>
    </div>
  );
}

function Stresstest() {
  const [on, setOn] = useState(false);
  const state = useMemo<WidgetState<ReturnType<typeof mockThemen>>>(() => (on ? { status: 'ideal', data: mockThemen(10_000) } : { status: 'loading' }), [on]);
  if (!on) return <button type="button" onClick={() => setOn(true)}>Tabelle mit 10.000 Zeilen erzeugen</button>;
  return <ThemenView id="stress" title="Stresstest: 10.000 Zeilen" badge="demo" state={state} onRetry={() => undefined} onStand={(rows) => notify('info', `${rows.length} Zeilen gewählt (Beispiel)`)} />;
}

export default function Designsystem() {
  return (
    <section className="page">
      <div className="page__head">
        <h2>Designsystem</h2>
        <p className="muted">Tokens, Bausteine, alle sechs Zustände jedes Moduls und fünf Systemzustände mit Beispieldaten. Nichts hier verändert deine Daten.</p>
      </div>

      <div className="card ds-section">
        <h3>Zustands-Labor</h3>
        <StateLab />
      </div>

      <div className="card ds-section">
        <h3>Systemzustände</h3>
        <p className="muted">Wie die App aussieht, wenn etwas außerhalb des Moduls nicht ideal ist. Jede Ansicht nennt die Regel, an die sich neue Module halten.</p>
        <SystemLabor />
      </div>

      <div className="card ds-section">
        <h3>Fehlergrenzen</h3>
        <p className="muted">Ein Fehler im Inhalt bleibt im eigenen Modul. „Erneut versuchen“ setzt nur dieses Modul zurück.</p>
        <BoundaryDemo />
      </div>

      <div className="card ds-section">
        <h3>Virtuelles Scrollen</h3>
        <p className="muted">Nur die sichtbaren Zeilen werden gezeichnet. Sortieren, Spaltenbreite ziehen und Mehrfachauswahl funktionieren auch hier.</p>
        <Stresstest />
      </div>

      <div className="card ds-section">
        <h3>Farben</h3>
        <div className="ds-swatches">
          {COLORS.map((c) => <div key={c} className="ds-swatch"><span style={{ background: `var(--color-${c})` }} /><code>--color-{c}</code></div>)}
        </div>
      </div>

      <div className="card ds-section">
        <h3>Akzentflächen und Kacheln</h3>
        <p className="muted">Tinte für Rahmen und harte Schatten, Akzentflächen für Marken und Formen, vier Kachelfarben für nebeneinander stehende Einstiege. Text auf Akzentflächen: <code>--color-on-accent</code>.</p>
        <div className="ds-swatches">
          {AKZENTE.map((c) => <div key={c} className="ds-swatch"><span style={{ background: `var(--color-${c})` }} /><code>--color-{c}</code></div>)}
          {KACHELN.map((n) => <div key={n} className="ds-swatch"><span style={{ background: `var(--tile-${n})` }} /><code>--tile-{n}</code></div>)}
        </div>
      </div>

      <div className="card ds-section">
        <h3>Bewegung</h3>
        <BewegungsLabor />
      </div>

      <div className="card ds-section">
        <h3>Abstände (8px-Raster)</h3>
        <div className="ds-scale">
          {SPACES.map((s, i) => <div key={s}><i style={{ width: `var(--space-${s})` }} /><code>--space-{s}</code> {SPACE_PX[i]} px</div>)}
        </div>
      </div>

      <div className="card ds-section">
        <h3>Eckenradien und Ebenen</h3>
        <div className="ds-boxes">
          {['xs', 'sm', 'md', 'lg', 'xl', 'pill'].map((r) => <div key={r} style={{ borderRadius: `var(--radius-${r})` }}><code>--radius-{r}</code></div>)}
        </div>
        <div className="ds-boxes">
          {[0, 1, 2, 3, 4].map((e) => <div key={e} style={{ boxShadow: `var(--elevation-${e})`, borderRadius: 'var(--radius-md)' }}><code>--elevation-{e}</code></div>)}
        </div>
        <div className="ds-boxes">
          {['sm', '', 'lg'].map((g) => <div key={g} style={{ boxShadow: `var(--shadow-hard${g && '-' + g})`, border: 'var(--border-card) solid var(--color-outline)', borderRadius: 'var(--radius-md)' }}><code>--shadow-hard{g && '-' + g}</code></div>)}
        </div>
      </div>

      <div className="card ds-section">
        <h3>Schaltflächen und Interaktion</h3>
        <div className="ds-states">
          <button type="button" className="primary">Primär</button>
          <button type="button">Sekundär</button>
          <button type="button" className="ghost">Ghost</button>
          <button type="button" className="danger">Löschen</button>
          <button type="button" className="is-hover">Hover</button>
          <button type="button" className="is-focus">Fokus</button>
          <button type="button" className="is-pressed">Aktiv</button>
          <button type="button" disabled>Deaktiviert</button>
          <button type="button" className="icon" aria-label="Suche"><Icon name="search" /></button>
        </div>
        <div className="pills">
          <button type="button" className="pill" aria-pressed="true">Filter aktiv</button>
          <button type="button" className="pill" aria-pressed="false">Filter</button>
          <span className="badge badge--live"><span className="badge__dot" />Aktuell</span>
          <span className="badge badge--syncing"><span className="badge__dot" />Lädt</span>
          <span className="badge badge--stalled"><span className="badge__dot" />Gestört</span>
        </div>
      </div>

      <RaumDemo />
    </section>
  );
}

const ZUSTAENDE: { id: MonitorZustand | 'ausfall'; label: string }[] = [
  { id: 'laeuft', label: 'Überwachung läuft' }, { id: 'standby', label: 'Standby' },
  { id: 'ausfall', label: 'Signalausfall SpO₂' }, { id: 'abwesend', label: 'Ohne Monitor' },
];

/** Gemeinsame Raumbühne der Simulatoren zum Ausprobieren: Räume, Hotspots, Monitorzustände, Kamerafokus. */
function RaumDemo() {
  const [raum, setRaum] = useState<RaumId>('12_station_kardiologie_monitoring');
  const [zustand, setZustand] = useState<MonitorZustand | 'ausfall'>('laeuft');
  const [fokus, setFokus] = useState<{ x: number; y: number } | null>(null);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const r = RAEUME[raum];
  const hotspots = r.hotspots.map((h) => ({ ...h, gedrueckt: gewaehlt === h.id, onClick: () => { setGewaehlt(h.id); setFokus((f) => (f ? null : { x: h.x, y: h.y })); } }));
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3>Raumbühne der Simulatoren</h3>
      <p className="muted">Raumfotos aus Philipps Komplettpaket (KI-generiert, fachlich noch ungeprüft). Hotspots antippen zoomt hinein, nochmal antippen zoomt zurück. Baustein: <code>src/ui/sim/raeume</code>.</p>
      <label className="field">Raum{' '}
        <select value={raum} onChange={(e) => { setRaum(e.target.value as RaumId); setFokus(null); setGewaehlt(null); }}>
          {RAUM_IDS.map((id) => <option key={id} value={id}>{RAEUME[id].bereich} · {RAEUME[id].titel}</option>)}
        </select>
      </label>
      {r.monitor && (
        <div className="pills" role="group" aria-label="Monitorzustand">
          {ZUSTAENDE.map((z) => <button key={z.id} type="button" className="pill" aria-pressed={zustand === z.id} onClick={() => setZustand(z.id)}>{z.label}</button>)}
        </div>
      )}
      <RaumBuehne
        raum={raum} hotspots={hotspots} fokus={fokus ? { ...fokus, zoom: 1.8 } : undefined}
        monitor={r.monitor || r.ohneMonitor ? { werte: { puls: 108, spo2: 92, af: 22, sys: 104, dia: 62, temp: 38.4 }, zustand: zustand === 'ausfall' ? 'signalausfall' : zustand, ausfall: ['spo2'] } : undefined}
        fallback={<p>Bild nicht geladen (offline?).</p>}
      />
      <p className="muted" role="status">{gewaehlt ? `Gewählt: ${r.hotspots.find((h) => h.id === gewaehlt)?.label ?? ''}` : 'Noch nichts gewählt.'}</p>
    </div>
  );
}
