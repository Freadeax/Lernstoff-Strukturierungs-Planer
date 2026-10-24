import { useCallback, useEffect, useMemo, useState } from 'react';
import './karteikarten.css';
import '../../lernplan/ui/lernplan.css';
import '../../rechnen/rechnen.css';
import { db } from '../../../core/db';
import type { ID } from '../../../core/types';
import { navigate, useRoute } from '../../../ui/shell/router';
import { stelleSitzungZusammen, type Sitzung as SitzungsPlan } from '../planung';
import { heute as heuteTag, ladeKartenDaten, neueHeute } from '../store';
import type { Karte } from '../typen';
import { Sitzung } from './Sitzung';
import { alleThemen, blaetter, modul, type KartenCtx } from './kontext';
import { Eigene, Stapel, Statistik } from './Verwalten';

type Ansicht = 'lernen' | 'stapel' | 'eigene' | 'statistik';
const ANSICHTEN: { id: Ansicht; label: string }[] = [
  { id: 'lernen', label: 'Lernen' }, { id: 'stapel', label: 'Stapel' }, { id: 'eigene', label: 'Eigene Karten' }, { id: 'statistik', label: 'Statistik' },
];

function Start({ ctx, thema, onStart }: { ctx: KartenCtx; thema?: ID; onStart: (s: SitzungsPlan, titel?: string) => void }) {
  const { daten, heute } = ctx;
  const themen = thema ? [thema, ...modul.topics.filter((t) => t.parentId === thema).map((t) => t.id)] : undefined;
  const opts = { heute, config: daten.config, neueHeuteSchon: neueHeute(daten.staende.values(), heute), themen };
  const plan = useMemo(() => stelleSitzungZusammen(daten.alle, daten.staende, opts), [daten, heute, thema]);
  const vorziehen = useMemo(() => (plan.karten.length ? null : stelleSitzungZusammen(daten.alle, daten.staende, { ...opts, vorziehen: true })), [plan]);
  const themaName = thema ? alleThemen.get(thema)?.name : undefined;
  const gelernt = [...daten.staende.values()].filter((s) => s.reps > 0).length;

  return (
    <div className="stack-2">
      {thema && (
        <div className="note">
          Nur Karten zu <strong>{themaName ?? thema}</strong>. <button type="button" className="link" onClick={() => navigate('/lernen/karten')}>Alle Themen</button>
        </div>
      )}
      <div className="card karten__start">
        <div className="karten__zahlen">
          <div><strong>{plan.faellig}</strong><span className="muted">fällig</span></div>
          <div><strong>{plan.neu}</strong><span className="muted">neu{thema ? '' : ` (max. ${daten.config.neueProTag}/Tag)`}</span></div>
          <div><strong>{daten.alle.length}</strong><span className="muted">Karten aktiv</span></div>
        </div>
        {plan.karten.length > 0 ? (
          <button type="button" className="primary karten__aufdecken" onClick={() => onStart(plan, themaName)}>
            {plan.faellig ? `${plan.karten.length} Karten lernen` : `${plan.neu} neue Karten lernen`}
          </button>
        ) : (
          <>
            <p>{gelernt ? 'Für heute ist alles wiederholt. Morgen geht es weiter.' : 'Keine Karten für diese Auswahl.'}</p>
            {vorziehen && vorziehen.karten.length > 0 && (
              <button type="button" onClick={() => onStart(vorziehen, themaName)}>
                Trotzdem {vorziehen.karten.length} Karten vorziehen
              </button>
            )}
            {!thema && daten.config.neueProTag > 0 && <p className="muted">Mehr neue Karten pro Tag stellst du unter „Stapel“ ein.</p>}
          </>
        )}
      </div>
      <details className="card">
        <summary>So funktioniert die Wiederholung</summary>
        <p>Jede Karte hat ihren eigenen Wiederholungsplan nach FSRS, demselben Verfahren wie im Lernplan. Je sicherer du eine Karte weißt, desto länger wird der Abstand bis zur nächsten Abfrage. Ziel ist, dass du sie zum Zeitpunkt der Wiederholung mit {Math.round(daten.config.retention * 100)} % Wahrscheinlichkeit noch weißt.</p>
        <p><strong>Vergessen</strong>: Karte kommt in dieser Sitzung gleich noch mal. <strong>Schwer</strong>: mit Mühe gewusst. <strong>Gut</strong>: gewusst. <strong>Leicht</strong>: sofort und sicher gewusst.</p>
        <p>Nach der Sitzung meldet die App jedes Thema mit mindestens drei Karten als Abfrage an den Lernplan. Dort zählt das als echter Wissensnachweis, anders als „ich glaube, ich kann das“.</p>
      </details>
    </div>
  );
}

export default function Karteikarten() {
  const { params } = useRoute();
  const ansicht = (ANSICHTEN.find((a) => a.id === params.get('ansicht'))?.id ?? 'lernen') as Ansicht;
  const thema = params.get('thema') ?? undefined;
  const [ctx, setCtx] = useState<KartenCtx | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sitzung, setSitzung] = useState<{ karten: Karte[]; titel?: string } | null>(null);

  const neuLaden = useCallback(async () => {
    try {
      const heute = heuteTag();
      const [daten, summaries, docs] = await Promise.all([ladeKartenDaten(modul, heute), db.summaries.toArray(), db.documents.toArray()]);
      setCtx({ daten, heute, summaries: summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), titles: new Map(docs.map((d) => [d.id, d.title])), neuLaden });
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { void neuLaden(); }, [neuLaden]);
  // Menü oder Zurück-Taste während einer Sitzung: Sitzung verlassen, Antworten sind schon gespeichert
  useEffect(() => { setSitzung(null); void neuLaden(); }, [ansicht, thema]);

  const wechsel = (a: Ansicht) => navigate(`/lernen/karten${a === 'lernen' ? (thema ? `?thema=${encodeURIComponent(thema)}` : '') : `?ansicht=${a}`}`);

  return (
    <section className="page karten">
      <div className="page__head">
        <h2>Karteikarten</h2>
        <p className="muted">Fachbegriffe, Katalogwissen und deine eigenen Zusammenfassungen mit Wiederholung im richtigen Abstand. Funktioniert offline, alles bleibt auf diesem Gerät.</p>
      </div>
      {!sitzung && (
        <div className="pills karten__tabs" role="tablist" aria-label="Ansicht">
          {ANSICHTEN.map((a) => <button key={a.id} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} aria-pressed={ansicht === a.id} onClick={() => wechsel(a.id)}>{a.label}</button>)}
        </div>
      )}
      {fehler && <p className="note warn">Karteikarten konnten nicht geladen werden: {fehler}</p>}
      {!ctx && !fehler && <p className="muted">Lädt …</p>}
      {ctx && sitzung && (
        <Sitzung karten={sitzung.karten} titel={sitzung.titel} staende={ctx.daten.staende} retention={ctx.daten.config.retention} heute={ctx.heute}
          topics={blaetter} titles={ctx.titles} onEnde={() => { setSitzung(null); void neuLaden(); }} />
      )}
      {ctx && !sitzung && ansicht === 'lernen' && <Start ctx={ctx} thema={thema} onStart={(s, titel) => setSitzung({ karten: s.karten, titel })} />}
      {ctx && !sitzung && ansicht === 'stapel' && <Stapel ctx={ctx} />}
      {ctx && !sitzung && ansicht === 'eigene' && <Eigene ctx={ctx} />}
      {ctx && !sitzung && ansicht === 'statistik' && <Statistik ctx={ctx} />}
    </section>
  );
}
