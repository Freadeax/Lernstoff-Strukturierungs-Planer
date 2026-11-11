import { useCallback, useEffect, useMemo, useState } from 'react';
import './karteikarten.css';
import '../../lernplan/ui/lernplan.css';
import '../../rechnen/rechnen.css';
import { db } from '../../../core/db';
import type { ID } from '../../../core/types';
import { navigate, useRoute } from '../../../ui/shell/router';
import { istProblem, problemSitzung, stelleSitzungZusammen, type Sitzung as SitzungsPlan } from '../planung';
import { notify } from '../../../ui/shell/notifications';
import { heute as heuteTag, ladeKartenDaten, neueHeute, schliesseOffeneSitzungAb } from '../store';
import { QUELLE_LABEL, type Karte, type KartenQuelle } from '../typen';
import { Sitzung } from './Sitzung';
import { alleThemen, blaetter, modul, type KartenCtx } from './kontext';
import { Steckbriefe } from './Steckbriefe';
import { skriptDokId } from '../../skript/karten';
import { Eigene, Stapel, Statistik } from './Verwalten';

type Ansicht = 'lernen' | 'steckbriefe' | 'stapel' | 'eigene' | 'statistik';
const ANSICHTEN: { id: Ansicht; label: string }[] = [
  { id: 'lernen', label: 'Lernen' }, { id: 'steckbriefe', label: 'Medikamente' }, { id: 'stapel', label: 'Stapel' }, { id: 'eigene', label: 'Eigene Karten' }, { id: 'statistik', label: 'Statistik' },
];

/** Oberstes Thema einer Karte (Einstieg „Nach Thema“ zeigt nur diese Ebene). */
function oberthema(id: ID): ID {
  let t = alleThemen.get(id);
  while (t?.parentId && alleThemen.has(t.parentId)) t = alleThemen.get(t.parentId);
  return t?.id ?? id;
}

function Start({ ctx, thema, krankheit, onStart }: { ctx: KartenCtx; thema?: ID; krankheit?: ID; onStart: (s: SitzungsPlan, titel?: string) => void }) {
  const { daten, heute } = ctx;
  const themen = thema ? [thema, ...modul.topics.filter((t) => t.parentId === thema).map((t) => t.id)] : undefined;
  const profil = krankheit ? modul.diseaseProfiles?.find((p) => p.id === krankheit) : undefined;
  const [quellen, setQuellen] = useState<KartenQuelle[]>([]);
  const vorhanden = useMemo(() => (Object.keys(QUELLE_LABEL) as KartenQuelle[]).filter((q) => daten.alle.some((k) => k.quelle === q)), [daten]);
  const opts = { heute, config: daten.config, neueHeuteSchon: neueHeute(daten.staende.values(), heute), themen, ref: profil?.id, quellen };
  const plan = useMemo(() => stelleSitzungZusammen(daten.alle, daten.staende, opts), [daten, heute, thema, profil, quellen]);
  const schnell = useMemo(() => {
    const o = { ...opts, config: { ...daten.config, sitzungsGroesse: 10 } };
    const s = stelleSitzungZusammen(daten.alle, daten.staende, o);
    return s.karten.length ? s : stelleSitzungZusammen(daten.alle, daten.staende, { ...o, vorziehen: true });
  }, [daten, heute, thema, profil, quellen]);
  const imPool = (k: Karte) => (!quellen.length || quellen.includes(k.quelle));
  const problem = useMemo(() => problemSitzung(daten.alle.filter(imPool), daten.staende, heute, daten.config.sitzungsGroesse), [daten, heute, quellen]);
  const problemGesamt = useMemo(() => [...daten.staende.values()].filter((s) => istProblem(s, heute)).length, [daten, heute]);
  const umschalten = (q: KartenQuelle) => setQuellen((alt) => (alt.includes(q) ? alt.filter((x) => x !== q) : [...alt, q]));
  const nurFaellig = useMemo(() => stelleSitzungZusammen(daten.alle, daten.staende, { ...opts, nur: 'faellig' }), [daten, heute, thema, profil, quellen]);
  const nurNeu = useMemo(() => stelleSitzungZusammen(daten.alle, daten.staende, { ...opts, nur: 'neu' }), [daten, heute, thema, profil, quellen]);
  // Themen mit Karten für den themenbezogenen Einstieg (oberste Ebene, nach Anzahl)
  const themenMitKarten = useMemo(() => {
    const zahl = new Map<ID, number>();
    for (const k of daten.alle) for (const t of k.topicIds) { const top = oberthema(t); zahl.set(top, (zahl.get(top) ?? 0) + 1); }
    return [...zahl].filter(([id]) => alleThemen.has(id)).sort((a, b) => b[1] - a[1]);
  }, [daten]);
  const vorziehen = useMemo(() => (plan.karten.length ? null : stelleSitzungZusammen(daten.alle, daten.staende, { ...opts, vorziehen: true })), [plan]);
  const themaName = profil?.name ?? (thema ? alleThemen.get(thema)?.name : undefined);
  const gezielt = !!thema || !!profil;
  const gelernt = [...daten.staende.values()].filter((s) => s.reps > 0).length;

  return (
    <div className="stack-2">
      {gezielt && (
        <div className="note">
          Nur Karten zu <strong>{themaName ?? thema}</strong>. <button type="button" className="link" onClick={() => navigate('/lernen/karten')}>Alle Themen</button>
        </div>
      )}
      <div className="card karten__start">
        <div className="karten__zahlen">
          <div><strong>{plan.faellig}</strong><span className="muted">fällig</span></div>
          <div><strong>{plan.neu}</strong><span className="muted">neu{gezielt ? '' : ` (max. ${daten.config.neueProTag}/Tag)`}</span></div>
          <div><strong>{daten.alle.length}</strong><span className="muted">Karten aktiv</span></div>
        </div>
        {plan.karten.length > 0 ? (
          <div className="karten__einstiege">
            {nurFaellig.karten.length > 0 && (
              <button type="button" className="primary karten__aufdecken" onClick={() => onStart(nurFaellig, themaName ? `${themaName} · Wiederholen` : 'Fällige wiederholen')}>
                {nurFaellig.karten.length} fällige wiederholen
              </button>
            )}
            <button type="button" className={nurFaellig.karten.length ? '' : 'primary karten__aufdecken'} disabled={!nurNeu.karten.length} onClick={() => onStart(nurNeu, themaName ? `${themaName} · Neue Karten` : 'Neue Karten')}>
              {nurNeu.karten.length ? `${nurNeu.karten.length} neue lernen` : 'Keine neuen für heute'}
            </button>
            {plan.faellig > 0 && plan.neu > 0 && (
              <button type="button" className="ghost" onClick={() => onStart(plan, themaName)}>Gemischt ({plan.karten.length})</button>
            )}
          </div>
        ) : (
          <>
            <p>{gelernt ? 'Für heute ist alles wiederholt. Morgen geht es weiter.' : 'Keine Karten für diese Auswahl.'}</p>
            {vorziehen && vorziehen.karten.length > 0 && (
              <button type="button" onClick={() => onStart(vorziehen, themaName)}>
                Trotzdem {vorziehen.karten.length} Karten vorziehen
              </button>
            )}
            {!gezielt && daten.config.neueProTag > 0 && <p className="muted">Mehr neue Karten pro Tag stellst du unter „Stapel“ ein.</p>}
          </>
        )}
      </div>
      <div className="card karten__gezielt">
        <h3>Gezielt üben</h3>
        {!gezielt && themenMitKarten.length > 1 && (
          <label className="karten__thema">
            <span className="muted">Nach Thema:</span>
            <select value="" onChange={(e) => { if (e.target.value) navigate(`/lernen/karten?thema=${encodeURIComponent(e.target.value)}`); }}>
              <option value="">Thema wählen …</option>
              {themenMitKarten.map(([id, n]) => <option key={id} value={id}>{alleThemen.get(id)?.name ?? id} ({n})</option>)}
            </select>
          </label>
        )}
        {vorhanden.length > 1 && (
          <div className="karten__quellen" role="group" aria-label="Nur Karten aus">
            <span className="muted">Nur aus:</span>
            {vorhanden.map((q) => (
              <button key={q} type="button" className="pill small" aria-pressed={quellen.includes(q)} onClick={() => umschalten(q)}>{QUELLE_LABEL[q]}</button>
            ))}
            {quellen.length > 0 && <button type="button" className="link" onClick={() => setQuellen([])}>alle</button>}
          </div>
        )}
        <div className="row">
          <button type="button" disabled={!schnell.karten.length} onClick={() => onStart(schnell, themaName ? `${themaName} · Schnellrunde` : 'Schnellrunde')}>
            Schnellrunde ({schnell.karten.length} {schnell.karten.length === 1 ? 'Karte' : 'Karten'})
          </button>
          <button type="button" disabled={!problem.karten.length} onClick={() => onStart(problem, 'Problemkarten')}>
            Problemkarten ({problem.karten.length})
          </button>
        </div>
        <p className="muted">
          Problemkarten sind Karten, die du mindestens zweimal vergessen hast, die besonders schwer sind oder die du heute wahrscheinlich nicht mehr weißt.
          {problemGesamt > 0 ? ` Insgesamt ${problemGesamt}.` : ' Im Moment hast du keine.'} Die wackeligsten kommen zuerst, auch wenn sie noch nicht fällig sind.
        </p>
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
  const krankheit = params.get('krankheit') ?? undefined;
  const [ctx, setCtx] = useState<KartenCtx | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sitzung, setSitzung] = useState<{ karten: Karte[]; titel?: string; nr: number } | null>(null);
  const starte = (karten: Karte[], titel?: string) => setSitzung((alt) => ({ karten, titel, nr: (alt?.nr ?? 0) + 1 }));

  const neuLaden = useCallback(async () => {
    try {
      const heute = heuteTag();
      const [daten, summaries, docs, skripte] = await Promise.all([ladeKartenDaten(modul, heute), db.summaries.toArray(), db.documents.toArray(), db.skripte.toArray()]);
      const titles = new Map([...docs.map((d) => [d.id, d.title] as const), ...skripte.map((s) => [skriptDokId(s.id), `${s.gruppe} · ${s.titel}`] as const)]);
      setCtx({ daten, heute, summaries: summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), titles, neuLaden });
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => {
    // Sitzung, die beim letzten Mal ohne Abschluss endete (App geschlossen): Ergebnis nachmelden
    schliesseOffeneSitzungAb(blaetter)
      .then((e) => { if (e?.length) notify('info', 'Letzte Karteikarten-Sitzung nachgemeldet', `${e.length} ${e.length === 1 ? 'Thema' : 'Themen'} an den Lernplan übertragen.`); })
      .catch(() => undefined)
      .finally(() => void neuLaden());
  }, [neuLaden]);
  // Menü oder Zurück-Taste während einer Sitzung: Sitzung verlassen. Antworten sind schon gespeichert,
  // das Ergebnis meldet die Sitzung beim Verlassen selbst an den Lernplan.
  useEffect(() => { setSitzung(null); void neuLaden(); }, [ansicht, thema, krankheit]);

  const wechsel = (a: Ansicht) => navigate(`/lernen/karten${a === 'lernen' ? (thema ? `?thema=${encodeURIComponent(thema)}` : '') : `?ansicht=${a}`}`);

  return (
    <section className="page karten">
      <div className="page__head">
        <h2>Karteikarten</h2>
        <p className="muted">Fachbegriffe, Katalogwissen, Medikamenten- und Krankheitsbild-Steckbriefe und deine eigenen Zusammenfassungen mit Wiederholung im richtigen Abstand. Funktioniert offline, alles bleibt auf diesem Gerät.</p>
      </div>
      {!sitzung && (
        <div className="pills karten__tabs" role="tablist" aria-label="Ansicht">
          {ANSICHTEN.map((a) => <button key={a.id} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} onClick={() => wechsel(a.id)}>{a.label}</button>)}
        </div>
      )}
      {fehler && <p className="note warn">Karteikarten konnten nicht geladen werden: {fehler}</p>}
      {!ctx && !fehler && <p className="muted">Lädt …</p>}
      {ctx && sitzung && (
        <Sitzung key={sitzung.nr} karten={sitzung.karten} titel={sitzung.titel} staende={ctx.daten.staende} retention={ctx.daten.config.retention} heute={ctx.heute}
          topics={blaetter} titles={ctx.titles} onEnde={() => { setSitzung(null); void neuLaden(); }}
          onNochmal={(k) => { void neuLaden().then(() => starte(k, 'Noch einmal')); }} />
      )}
      {ctx && !sitzung && ansicht === 'lernen' && <Start ctx={ctx} thema={thema} krankheit={krankheit} onStart={(s, titel) => starte(s.karten, titel)} />}
      {ctx && !sitzung && ansicht === 'steckbriefe' && <Steckbriefe ctx={ctx} />}
      {ctx && !sitzung && ansicht === 'stapel' && <Stapel ctx={ctx} />}
      {ctx && !sitzung && ansicht === 'eigene' && <Eigene ctx={ctx} />}
      {ctx && !sitzung && ansicht === 'statistik' && <Statistik ctx={ctx} />}
    </section>
  );
}
