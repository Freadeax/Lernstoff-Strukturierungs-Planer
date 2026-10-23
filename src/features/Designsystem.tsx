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

type Lab = 'kpi' | 'chart' | 'feed' | 'themen' | 'board' | 'wizard';
type LabState = 'ideal' | 'loading' | 'empty' | 'error' | 'partial' | 'interaktiv';

const LABS: Array<[Lab, string]> = [['kpi', 'Kennzahlen'], ['chart', 'Diagramme'], ['feed', 'Aktivitäts-Feed'], ['themen', 'Tabelle'], ['board', 'Kanban'], ['wizard', 'Assistent']];
const STATES: Array<[LabState, string]> = [['ideal', 'Ideal'], ['loading', 'Laden'], ['empty', 'Leer'], ['error', 'Fehler'], ['partial', 'Teilweise'], ['interaktiv', 'Interaktiv']];

const COLORS = ['primary', 'primary-soft', 'secondary', 'secondary-soft', 'background', 'surface', 'surface-raised', 'surface-sunken', 'border', 'border-strong', 'text', 'text-muted', 'success', 'warning', 'danger', 'info', 'focus'];
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
        <p className="muted">Tokens, Bausteine und alle sechs Zustände jedes Moduls mit Beispieldaten. Nichts hier verändert deine Daten.</p>
      </div>

      <div className="card ds-section">
        <h3>Zustands-Labor</h3>
        <StateLab />
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
        <h3>Abstände (8px-Raster)</h3>
        <div className="ds-scale">
          {SPACES.map((s, i) => <div key={s}><i style={{ width: `var(--space-${s})` }} /><code>--space-{s}</code> {SPACE_PX[i]} px</div>)}
        </div>
      </div>

      <div className="card ds-section">
        <h3>Eckenradien und Ebenen</h3>
        <div className="ds-boxes">
          {['xs', 'sm', 'md', 'lg', 'pill'].map((r) => <div key={r} style={{ borderRadius: `var(--radius-${r})` }}><code>--radius-{r}</code></div>)}
        </div>
        <div className="ds-boxes">
          {[0, 1, 2, 3, 4].map((e) => <div key={e} style={{ boxShadow: `var(--elevation-${e})`, borderRadius: 'var(--radius-md)' }}><code>--elevation-{e}</code></div>)}
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
    </section>
  );
}
