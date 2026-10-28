import { useEffect, useMemo, useState } from 'react';
import { notiereFehler } from '../fehlerheft/fehlerheft';
import { ausSimulation } from '../fehlerheft/quellen';
import './simulation.css';
import { db } from '../../core/db';
import { logActivity } from '../../core/activity';
import { moveTopics } from '../../core/board';
import { getApiKey } from '../../core/settings';
import type { Exam, SourceChunk } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { notify } from '../../ui/shell/notifications';
import { navigate, useRoute } from '../../ui/shell/router';
import { logReview } from '../lernplan/store';
import { bewerteAntwort } from '../zusammenfasser/pruefung';
import type { FragenSatz } from '../zusammenfasser/typen';
import { zahl } from '../rechnen/aufgaben';
import {
  AFB_LABEL, auswerten, istBeantwortet, katalog, lernplanEintraege, QUELLE_LABEL, QUELLEN, restzeit, SCHWACH_AB,
  selbstWertung, stelleZusammen, uhr, werteAus,
  type Afb, type Antwort, type Auswertung, type Gruppe, type OffeneFrage, type Quelle, type SimFrage, type Wertung,
} from './simulation';
import { ergaenzeVerlauf, ladeEinstellungen, ladeLauf, ladeVerlauf, speichereEinstellungen, speichereLauf, type Einstellungen, type Lauf, type VerlaufEintrag } from './speicher';

const K = katalog(pflegeModule);
const KB = [...K.kbName.entries()].map(([id, name]) => ({ id, code: name.split(' · ')[0]!, name: name.split(' · ')[1]! }));
const STAATLICH = pflegeModule.examFormats?.find((f) => f.id === 'pruefung.staatlich.schriftlich');

const STANDARD: Einstellungen = { quellen: ['glossar', 'rechnen', 'material'], kb: [], afb: [], anzahl: 20, stufe: 2, minuten: null, pruefungId: '' };
const VORLAGEN: Array<{ id: string; label: string; e: Partial<Einstellungen>; hinweis: string }> = [
  { id: 'kurz', label: 'Kurztest', e: { anzahl: 10, minuten: 15, kb: [], afb: [] }, hinweis: '10 Fragen in 15 Minuten' },
  { id: 'klausur', label: 'Klausur', e: { anzahl: 25, minuten: null, kb: [], afb: [] }, hinweis: '25 Fragen, Zeit nach Umfang' },
  ...(STAATLICH?.durationMinutes ? [{
    id: 'staatlich', label: 'Probe Staatsprüfung', e: { anzahl: 40, minuten: STAATLICH.durationMinutes, kb: [], afb: [], quellen: ['glossar', 'rechnen', 'material'] as Quelle[] },
    hinweis: `Eine Aufsichtsarbeit: ${STAATLICH.durationMinutes} Minuten. Hier kommen Fragen aus allen Kompetenzbereichen, jede echte Aufsichtsarbeit hat eigene Schwerpunkte (§ 14 PflAPrV). Die echte Prüfung ist fallbezogen und frei formuliert, nimm dafür Fragen aus deinem Material dazu.`,
  }] : []),
];
const ANZAHLEN = [10, 20, 30, 40];
const ZEITEN = [15, 30, 45, 60, 90, 120];

const neuerSeed = () => Math.floor(Math.random() * 2 ** 31);
const prozent = (p: number, m: number) => (m ? Math.round((p / m) * 100) : 0);
const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
const themaName = (id: string) => K.topics.get(id)?.name ?? 'Ohne Thema';

function useFragenSaetze() {
  const [saetze, setSaetze] = useState<FragenSatz[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  useEffect(() => {
    db.summaries.where('mode').equals('pruefung').toArray().then((s) => setSaetze((s as FragenSatz[]).filter((x) => x.fragen?.length))).catch(() => {});
    db.exams.toArray().then((e) => setExams(e.sort((a, b) => a.date.localeCompare(b.date)))).catch(() => {});
  }, []);
  return { saetze, exams };
}

// ---------- Einrichten ----------

function Einrichten({ onStart, saetze, exams, verlauf }: { onStart: (l: Lauf) => void; saetze: FragenSatz[]; exams: Exam[]; verlauf: VerlaufEintrag[] }) {
  const { params } = useRoute();
  const [e, setE] = useState<Einstellungen>(() => {
    const x = ladeEinstellungen(STANDARD);
    // ?kb=kb.III,kb.IV: aus dem Schwächen-Radar direkt eine Probeprüfung zu diesen Bereichen.
    const kb = (params.get('kb') ?? '').split(',').filter((id) => KB.some((b) => b.id === id));
    const mitKb = kb.length ? { ...x, kb } : x;
    return params.get('pruefung') ? { ...mitKb, pruefungId: params.get('pruefung')! } : mitKb;
  });
  const [satzIds, setSatzIds] = useState<string[]>([]);
  const [seed] = useState(neuerSeed);
  const set = (patch: Partial<Einstellungen>) => setE((cur) => { const n = { ...cur, ...patch }; speichereEinstellungen(n); return n; });
  const pruefung = exams.find((x) => x.id === e.pruefungId);
  const auswahl = { ...e, seed, satzIds, topicIds: pruefung?.topicIds ?? [] };
  const z = useMemo(() => stelleZusammen(K, auswahl, saetze), [JSON.stringify(auswahl), saetze]);
  const minuten = e.minuten ?? z.minuten;

  const start = () => {
    const jetzt = Date.now();
    const titel = pruefung ? `Simulation: ${pruefung.name}` : VORLAGEN.find((v) => v.e.anzahl === e.anzahl && v.e.minuten === e.minuten)?.label ?? 'Prüfungssimulation';
    onStart({ id: crypto.randomUUID(), titel, auswahl, fragen: z.fragen, antworten: {}, markiert: [], start: jetzt, deadline: jetzt + minuten * 60_000, i: 0 });
  };

  return (
    <>
      <div className="card sim__einstellungen">
        <div className="sim__zeile">
          <span className="muted">Vorlage</span>
          <div className="pills">
            {VORLAGEN.map((v) => <button key={v.id} type="button" className="pill" title={v.hinweis} onClick={() => set(v.e)}>{v.label}</button>)}
          </div>
        </div>
        {exams.length > 0 && (
          <label className="sim__zeile">
            <span className="muted">Prüfung</span>
            <select value={e.pruefungId} onChange={(ev) => set({ pruefungId: ev.target.value })}>
              <option value="">Alle Themen</option>
              {exams.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.topicIds.length} Themen)</option>)}
            </select>
          </label>
        )}
        <div className="sim__zeile">
          <span className="muted">Quellen</span>
          <div className="pills">
            {QUELLEN.map((q) => (
              <button key={q.id} type="button" className="pill" title={q.hinweis} aria-pressed={e.quellen.includes(q.id)}
                onClick={() => set({ quellen: toggle(e.quellen, q.id) })}>
                {q.label}{q.id === 'material' && e.quellen.includes(q.id) && <span className="pill__count">{z.vorrat.material}</span>}
              </button>
            ))}
          </div>
        </div>
        {e.quellen.includes('material') && (
          saetze.length ? (
            <details className="sim__saetze">
              <summary className="muted">Fragensätze: {satzIds.length ? `${satzIds.length} von ${saetze.length}` : `alle ${saetze.length}`}</summary>
              {saetze.map((s) => (
                <label key={s.id} className="check">
                  <input type="checkbox" checked={!satzIds.length || satzIds.includes(s.id)}
                    onChange={() => setSatzIds(toggle(satzIds.length ? satzIds : saetze.map((x) => x.id), s.id))} />
                  <span>{s.pruefungName} <span className="muted">· {s.fragen.length} Fragen · {new Date(s.createdAt).toLocaleDateString('de-DE')}</span></span>
                </label>
              ))}
            </details>
          ) : (
            <p className="muted sim__hinweis">Noch keine Fragen aus deinem Material. Unter <button type="button" className="link" onClick={() => navigate('/material/zusammenfassen')}>Zusammenfassen</button> im Modus „Prüfung“ erstellen, dann stehen sie hier mit Belegen bereit.</p>
          )
        )}
        <div className="sim__zeile">
          <span className="muted">Kompetenz&shy;bereiche</span>
          <div className="pills" role="group" aria-label="Kompetenzbereiche">
            <button type="button" className="pill" aria-pressed={!e.kb.length} onClick={() => set({ kb: [] })}>Alle</button>
            {KB.map((b) => <button key={b.id} type="button" className="pill" title={b.name} aria-pressed={e.kb.includes(b.id)} onClick={() => set({ kb: toggle(e.kb, b.id) })}>{b.code}</button>)}
          </div>
        </div>
        {e.kb.length > 0 && <ul className="sim__kb muted">{KB.filter((b) => e.kb.includes(b.id)).map((b) => <li key={b.id}><strong>{b.code}</strong> {b.name}</li>)}</ul>}
        <div className="sim__zeile">
          <span className="muted">Anforderung</span>
          <div className="pills" role="group" aria-label="Anforderungsbereiche">
            <button type="button" className="pill" aria-pressed={!e.afb.length} onClick={() => set({ afb: [] })}>Alle</button>
            {([1, 2, 3] as Afb[]).map((a) => <button key={a} type="button" className="pill" title={AFB_LABEL[a]} aria-pressed={e.afb.includes(a)} onClick={() => set({ afb: toggle(e.afb, a) })}>{AFB_LABEL[a]}</button>)}
          </div>
        </div>
        <div className="sim__zeile">
          <span className="muted">Fragen</span>
          <div className="pills">{ANZAHLEN.map((n) => <button key={n} type="button" className="pill" aria-pressed={e.anzahl === n} onClick={() => set({ anzahl: n })}>{n}</button>)}</div>
        </div>
        {e.quellen.includes('rechnen') && (
          <div className="sim__zeile">
            <span className="muted">Rechnen</span>
            <div className="pills">{([1, 2, 3] as const).map((s) => <button key={s} type="button" className="pill" aria-pressed={e.stufe === s} onClick={() => set({ stufe: s })}>{['Einstieg', 'Standard', 'Fortgeschritten'][s - 1]}</button>)}</div>
          </div>
        )}
        <div className="sim__zeile">
          <span className="muted">Zeitlimit</span>
          <div className="pills">
            <button type="button" className="pill" aria-pressed={e.minuten === null} onClick={() => set({ minuten: null })}>Nach Umfang ({z.minuten} min)</button>
            {ZEITEN.map((m) => <button key={m} type="button" className="pill" aria-pressed={e.minuten === m} onClick={() => set({ minuten: m })}>{m} min</button>)}
          </div>
        </div>
      </div>

      <div className="card sim__start">
        <div>
          <strong>{z.fragen.length} Fragen · {z.punkte} Punkte · {minuten} Minuten</strong>
          <p className="muted">
            {z.fragen.length < e.anzahl && z.fragen.length > 0 && `Mit dieser Auswahl gibt es nur ${z.fragen.length} passende Fragen. `}
            {!z.fragen.length && 'Keine passende Frage. Wähle mehr Quellen oder weniger Filter. '}
            {(['material', 'rechnen', 'glossar'] as Quelle[]).map((q) => [q, z.fragen.filter((f) => f.quelle === q).length] as const).filter(([, n]) => n).map(([q, n]) => `${n} × ${QUELLE_LABEL[q]}`).join(', ')}
          </p>
          <p className="muted">Die Zeit läuft auch weiter, wenn du die App schließt. Ist sie abgelaufen, wird automatisch abgegeben.</p>
        </div>
        <button type="button" className="primary" disabled={!z.fragen.length} onClick={start}>Prüfung starten</button>
      </div>

      {verlauf.length > 0 && (
        <div className="card">
          <h3>Bisherige Simulationen</h3>
          <ul className="sim__verlauf">
            {verlauf.slice(0, 8).map((v) => (
              <li key={v.id}>
                <span>{v.titel} <span className="muted">· {new Date(v.at).toLocaleDateString('de-DE')} · {v.fragen} Fragen · {v.gebraucht} von {v.minuten} min</span></span>
                <span className={`sim__quote ${v.prozent >= 80 ? 'gut' : v.prozent >= SCHWACH_AB * 100 ? 'mittel' : 'schwach'}`}>{v.prozent} %</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// ---------- Prüfung ----------

function FrageEingabe({ f, a, onChange, disabled }: { f: SimFrage; a?: Antwort; onChange: (a: Antwort) => void; disabled?: boolean }) {
  if (f.art === 'auswahl') {
    const wahl = a?.wahl ?? [];
    return (
      <div className="sim__optionen" role={f.mehrfach ? 'group' : 'radiogroup'}>
        {f.optionen.map((o, i) => (
          <label key={i} className={`check option sim__option ${wahl.includes(i) ? 'is-gewaehlt' : ''}`}>
            <input type={f.mehrfach ? 'checkbox' : 'radio'} name={f.id} disabled={disabled} checked={wahl.includes(i)}
              onChange={() => onChange({ wahl: f.mehrfach ? toggle(wahl, i) : [i] })} />
            <span><span className="sim__buchstabe">{'ABCD'[i] ?? i + 1}</span> {o}</span>
          </label>
        ))}
      </div>
    );
  }
  if (f.art === 'zahl') {
    return (
      <div className="rechnen__eingabe">
        <input inputMode="decimal" autoComplete="off" disabled={disabled} value={a?.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} aria-label={`Ergebnis in ${f.einheit}`} placeholder="Ergebnis" />
        <span className="rechnen__einheit">{f.einheit}</span>
      </div>
    );
  }
  return <textarea className="wide" rows={8} disabled={disabled} value={a?.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} placeholder={`Deine Antwort (Operator: ${f.operator})`} />;
}

function Kopfzeile({ f }: { f: SimFrage }) {
  return (
    <div className="sim__meta muted">
      <span>{QUELLE_LABEL[f.quelle]}</span>
      <span>{f.operator} · AFB {['I', 'II', 'III'][f.afb - 1]}</span>
      <span>{f.punkte} {f.punkte === 1 ? 'Punkt' : 'Punkte'}</span>
      {f.topicId && <span>{themaName(f.topicId)}</span>}
    </div>
  );
}

function Pruefung({ lauf, setLauf, onAbgabe }: { lauf: Lauf; setLauf: (l: Lauf) => void; onAbgabe: (automatisch: boolean) => void }) {
  const [jetzt, setJetzt] = useState(Date.now());
  const [uebersicht, setUebersicht] = useState(false);
  useEffect(() => { const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  const rest = restzeit(lauf.deadline, jetzt);
  useEffect(() => { if (rest <= 0) onAbgabe(true); }, [rest <= 0]);
  const f = lauf.fragen[lauf.i]!;
  const beantwortet = lauf.fragen.filter((x) => istBeantwortet(x, lauf.antworten[x.id])).length;
  const gesamt = lauf.deadline - lauf.start;
  const geh = (i: number) => { setLauf({ ...lauf, i: Math.max(0, Math.min(lauf.fragen.length - 1, i)) }); setUebersicht(false); };
  const markiert = lauf.markiert.includes(f.id);

  const abgeben = () => {
    const offen = lauf.fragen.length - beantwortet;
    const text = offen ? `${offen} ${offen === 1 ? 'Frage ist' : 'Fragen sind'} noch unbeantwortet. Trotzdem abgeben?` : 'Prüfung abgeben? Danach lassen sich die Antworten nicht mehr ändern.';
    if (confirm(text)) onAbgabe(false);
  };

  return (
    <div className="sim__pruefung">
      <div className={`sim__leiste ${rest < 60_000 ? 'is-kritisch' : rest < 5 * 60_000 ? 'is-knapp' : ''}`}>
        <span className="sim__uhr" role="timer" aria-live={rest < 60_000 ? 'assertive' : 'off'}>{uhr(rest)}</span>
        <div className="sim__zeitbalken" aria-hidden><span style={{ transform: `scaleX(${gesamt ? rest / gesamt : 0})` }} /></div>
        <button type="button" className="small" aria-expanded={uebersicht} onClick={() => setUebersicht(!uebersicht)}>{beantwortet}/{lauf.fragen.length}</button>
        <button type="button" className="small primary" onClick={abgeben}>Abgeben</button>
      </div>

      {uebersicht && (
        <div className="card sim__raster" aria-label="Übersicht der Fragen">
          {lauf.fragen.map((x, i) => (
            <button key={x.id} type="button" onClick={() => geh(i)} aria-current={i === lauf.i}
              className={`${istBeantwortet(x, lauf.antworten[x.id]) ? 'is-beantwortet' : ''} ${lauf.markiert.includes(x.id) ? 'is-markiert' : ''}`}>
              {i + 1}
            </button>
          ))}
          <p className="muted">Ausgefüllt = beantwortet, Rand = markiert zum Nachsehen.</p>
        </div>
      )}

      <article className="card sim__frage">
        <div className="sim__kopf">
          <strong>Frage {lauf.i + 1} von {lauf.fragen.length}</strong>
          <button type="button" className={`small ${markiert ? 'pill--accent' : 'ghost'}`} aria-pressed={markiert}
            onClick={() => setLauf({ ...lauf, markiert: toggle(lauf.markiert, f.id) })}>{markiert ? 'Markiert' : 'Markieren'}</button>
        </div>
        <Kopfzeile f={f} />
        {f.hinweis && <p className="muted sim__hinweis">{f.hinweis}</p>}
        <p className={`sim__text ${f.quelle === 'glossar' && f.frage.length < 12 ? 'sim__text--gross' : ''}`}>{f.frage}</p>
        <FrageEingabe key={f.id} f={f} a={lauf.antworten[f.id]} onChange={(a) => setLauf({ ...lauf, antworten: { ...lauf.antworten, [f.id]: a } })} />
        <div className="row sim__nav">
          <button type="button" disabled={lauf.i === 0} onClick={() => geh(lauf.i - 1)}>Zurück</button>
          {lauf.i < lauf.fragen.length - 1
            ? <button type="button" className="primary" onClick={() => geh(lauf.i + 1)}>Weiter</button>
            : <button type="button" className="primary" onClick={abgeben}>Abgeben</button>}
        </div>
      </article>
    </div>
  );
}

// ---------- Auswertung ----------

function Balken({ g }: { g: Gruppe }) {
  const p = prozent(g.punkte, g.max);
  return (
    <li className="sim__balken">
      <div className="sim__balken-kopf"><span>{g.label}</span><span className="muted">{g.max ? `${g.punkte}/${g.max} · ${p} %` : '–'}{g.offen ? ` · ${g.offen} offen` : ''}</span></div>
      <div className="sim__spur"><span className={p >= 80 ? 'gut' : p >= SCHWACH_AB * 100 ? 'mittel' : 'schwach'} style={{ width: `${g.max ? p : 0}%` }} /></div>
    </li>
  );
}

function OffeneBewertung({ f, a, w, onWertung }: { f: OffeneFrage; a?: Antwort; w: Wertung; onWertung: (w: Wertung) => void }) {
  const [erfuellt, setErfuellt] = useState<number[]>([]);
  if (w.art !== 'offen') return null;
  return (
    <div className="note sim__selbst">
      <strong>Selbst bewerten</strong>
      <p className="muted">Vergleiche deine Antwort mit der Musterlösung und hake ab, was du erfüllt hast. Das geht als Selbsteinschätzung an den Lernplan und zählt dort nicht als Nachweis.</p>
      {f.kriterien.map((c, i) => (
        <label key={i} className="check"><input type="checkbox" checked={erfuellt.includes(i)} onChange={() => setErfuellt(toggle(erfuellt, i))} /><span>{c.kriterium} <span className="muted">({c.punkte} P.)</span></span></label>
      ))}
      <button type="button" className="small" disabled={!a?.text?.trim()} onClick={() => onWertung(selbstWertung(f, erfuellt))}>Bewertung übernehmen</button>
    </div>
  );
}

function Loesung({ f, a, w }: { f: SimFrage; a?: Antwort; w: Wertung }) {
  if (f.art === 'auswahl') {
    return (
      <ul className="sim__aufloesung">
        {f.optionen.map((o, i) => (
          <li key={i} className={f.richtig.includes(i) ? 'richtig' : a?.wahl?.includes(i) ? 'falsch' : ''}>
            <span className="sim__buchstabe">{'ABCD'[i]}</span> {o}
            {a?.wahl?.includes(i) && <span className="muted"> · deine Wahl</span>}
            {f.begruendungen?.[i] && <div className="muted">{f.begruendungen[i]}</div>}
          </li>
        ))}
        {f.erklaerung && <li className="sim__erklaerung">{f.erklaerung}</li>}
      </ul>
    );
  }
  if (f.art === 'zahl') {
    return (
      <div>
        <p>Deine Antwort: <strong>{a?.text?.trim() || '–'}</strong> · Lösung: <strong>{zahl(f.loesung)} {f.einheit}</strong>{w.detail ? ` · ${w.detail}` : ''}</p>
        <ol className="rechnen__weg">{f.schritte.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
    );
  }
  return (
    <div>
      <p className="muted">Deine Antwort</p>
      <p className="pre sim__antwort">{a?.text?.trim() || '–'}</p>
      {w.detail && <p className="pre">{w.detail}</p>}
      <details><summary>Musterlösung und Kriterien</summary>
        <p className="pre">{f.musterloesung}</p>
        <ul>{f.kriterien.map((c, i) => <li key={i}>{c.kriterium} ({c.punkte} P.)</li>)}</ul>
        <p className="muted">Aus: {f.material.satzName}. Die Belegstellen findest du unter Zusammenfassen bei diesem Fragensatz.</p>
      </details>
    </div>
  );
}

function Ergebnis({ lauf, setLauf, onNeu }: { lauf: Lauf; setLauf: (l: Lauf) => void; onNeu: () => void }) {
  const w = lauf.wertungen ?? {};
  const a: Auswertung = useMemo(() => auswerten(K, lauf.fragen, w), [lauf]);
  const [ki, setKi] = useState<{ fertig: number; gesamt: number } | null>(null);
  const [verschieben, setVerschieben] = useState(true);
  const [nurFalsche, setNurFalsche] = useState(true);
  const offene = lauf.fragen.filter((f): f is OffeneFrage => f.art === 'offen' && w[f.id]?.art === 'offen');
  const eintraege = lernplanEintraege(K, lauf.fragen, w);
  const gebraucht = Math.round(((lauf.abgegeben ?? Date.now()) - lauf.start) / 60_000);
  const setWertung = (id: string, x: Wertung) => setLauf({ ...lauf, wertungen: { ...(lauf.wertungen ?? {}), [id]: x } });

  async function mitClaude() {
    const apiKey = getApiKey();
    if (!apiKey) { notify('warning', 'Kein API-Schlüssel', 'In den Einstellungen eintragen oder die Antworten selbst bewerten.'); return; }
    setKi({ fertig: 0, gesamt: offene.length });
    const neu = { ...(lauf.wertungen ?? {}) };
    const chunkCache = new Map<string, Map<string, SourceChunk>>();
    let fehler = 0;
    for (const [n, f] of offene.entries()) {
      try {
        const key = f.material.dokumentIds.join(',');
        if (!chunkCache.has(key)) {
          const chunks = await db.chunks.where('documentId').anyOf(f.material.dokumentIds).toArray();
          chunkCache.set(key, new Map(chunks.map((c) => [c.id, c])));
        }
        const r = await bewerteAntwort({ apiKey, modul: pflegeModule, frage: f.material.frage, antwort: lauf.antworten[f.id]?.text ?? '', chunks: chunkCache.get(key)! });
        neu[f.id] = { punkte: r.gesamt, max: r.max || f.punkte, art: 'ki', detail: [r.rueckmeldung, r.fehlt.length ? `Es fehlt: ${r.fehlt.join('; ')}` : ''].filter(Boolean).join('\n') };
      } catch { fehler++; }
      setKi({ fertig: n + 1, gesamt: offene.length });
    }
    setLauf({ ...lauf, wertungen: neu });
    setKi(null);
    if (fehler) notify('warning', `${fehler} Antworten nicht bewertet`, 'Später erneut versuchen oder selbst bewerten.');
  }

  async function uebergeben() {
    try {
      for (const e of eintraege) {
        const topic = K.topics.get(e.topicId);
        if (topic) await logReview(topic, e.source, { scorePercent: e.scorePercent });
      }
      if (verschieben && a.schwach.length) {
        const board = await db.board.bulkGet(a.schwach);
        const moves = a.schwach.filter((_, i) => board[i]?.column !== 'woche' && board[i]?.column !== 'arbeit')
          .map((id) => ({ topicId: id, column: 'woche' as const, name: themaName(id) }));
        if (moves.length) await moveTopics(moves);
      }
      setLauf({ ...lauf, uebergeben: true });
      notify('info', 'An den Lernplan übergeben', `${eintraege.length} Themen mit Ergebnis, der Plan rechnet neu.`);
    } catch (err) {
      notify('critical', 'Übergabe fehlgeschlagen', err instanceof Error ? err.message : String(err));
    }
  }

  const liste = lauf.fragen.map((f, i) => ({ f, i, w: w[f.id]! })).filter(({ w: x }) => !nurFalsche || x.art === 'offen' || x.punkte < x.max);

  return (
    <>
      <div className="card sim__ergebnis">
        <h3>{lauf.titel}</h3>
        {lauf.automatisch && <p className="note warn">Die Zeit ist abgelaufen, die Prüfung wurde automatisch abgegeben.</p>}
        <div className="kpi-grid sim__kpis">
          <div className="kpi"><p className="kpi__label">Punkte</p><div className="kpi__value">{a.punkte}/{a.max}</div></div>
          <div className="kpi"><p className="kpi__label">Ergebnis</p><div className="kpi__value">{Math.round(a.prozent)} %</div></div>
          <div className="kpi"><p className="kpi__label">Note (Orientierung)</p><div className="kpi__value">{a.note.note}</div><p className="kpi__hint">{a.note.label}, Schlüssel deiner Schule kann abweichen</p></div>
          <div className="kpi"><p className="kpi__label">Zeit</p><div className="kpi__value">{gebraucht} min</div><p className="kpi__hint">von {Math.round((lauf.deadline - lauf.start) / 60_000)} min</p></div>
        </div>
        {a.offen > 0 && (
          <div className="note warn sim__offen">
            <span>{a.offen} offene {a.offen === 1 ? 'Antwort ist' : 'Antworten sind'} noch nicht bewertet und fehlen im Ergebnis.</span>
            <button type="button" className="small primary" disabled={!!ki} onClick={mitClaude}>{ki ? `Claude bewertet … ${ki.fertig}/${ki.gesamt}` : 'Mit Claude bewerten'}</button>
            <span className="muted">oder unten bei jeder Frage selbst bewerten.</span>
          </div>
        )}
      </div>

      <div className="sim__gruppen">
        <div className="card"><h3>Kompetenzbereiche</h3><ul className="sim__balkenliste">{a.jeKb.map((g) => <Balken key={g.key} g={g} />)}</ul></div>
        <div className="card"><h3>Anforderungsbereiche</h3><ul className="sim__balkenliste">{a.jeAfb.map((g) => <Balken key={g.key} g={g} />)}</ul>
          <h3>Operatoren</h3><ul className="sim__balkenliste">{a.jeOperator.map((g) => <Balken key={g.key} g={g} />)}</ul></div>
        <div className="card sim__themen"><h3>Themen</h3><p className="muted">Schwächste zuerst. Unter {SCHWACH_AB * 100} % gilt ein Thema als schwach.</p>
          <ul className="sim__balkenliste">{a.jeThema.map((g) => <Balken key={g.key} g={g} />)}</ul></div>
      </div>

      <div className="card sim__lernplan">
        <h3>An den Lernplan übergeben</h3>
        {lauf.uebergeben ? (
          <p className="note ok">Übergeben. <button type="button" className="link" onClick={() => navigate('/lernen/plan')}>Zum Lernplan</button></p>
        ) : eintraege.length ? (
          <>
            <p className="muted">Je Thema ein Abfrageergebnis. Der Lernplan plant Wiederholungen danach neu. {a.offen > 0 && 'Unbewertete Antworten fehlen dabei, bewerte sie vorher.'}</p>
            <ul className="sim__eintraege">
              {eintraege.map((e) => (
                <li key={e.topicId + e.source}><span>{themaName(e.topicId)}</span><span className="muted">{e.scorePercent} % · {e.fragen} {e.fragen === 1 ? 'Frage' : 'Fragen'}{e.source === 'selbsteinschaetzung' ? ' · Selbsteinschätzung' : ''}</span></li>
              ))}
            </ul>
            {a.schwach.length > 0 && <label className="check"><input type="checkbox" checked={verschieben} onChange={(e) => setVerschieben(e.target.checked)} /><span>{a.schwach.length} schwache {a.schwach.length === 1 ? 'Thema' : 'Themen'} im Lernstand auf „Diese Woche“ setzen</span></label>}
            <button type="button" className="primary" onClick={uebergeben}>Übergeben</button>
          </>
        ) : <p className="muted">Keine Ergebnisse mit Thema, die übergeben werden können.</p>}
      </div>

      <div className="card">
        <div className="sim__kopf">
          <h3>Fragen durchsehen</h3>
          <label className="check"><input type="checkbox" checked={nurFalsche} onChange={(e) => setNurFalsche(e.target.checked)} /><span>Nur falsche und offene</span></label>
        </div>
        {!liste.length && <p className="muted">Alles richtig.</p>}
        {liste.map(({ f, i, w: x }) => (
          <article key={f.id} className={`sim__durchsicht ${x.art === 'offen' ? '' : x.punkte >= x.max ? 'ok' : x.punkte > 0 ? 'teil' : 'falsch'}`}>
            <div className="sim__kopf"><strong>Frage {i + 1}</strong><span className="muted">{x.art === 'offen' ? 'nicht bewertet' : `${x.punkte}/${x.max} P.`}{x.art === 'ki' ? ' · Claude' : x.art === 'selbst' ? ' · selbst bewertet' : ''}</span></div>
            <Kopfzeile f={f} />
            <p className="pre">{f.frage}</p>
            <Loesung f={f} a={lauf.antworten[f.id]} w={x} />
            {f.art === 'offen' && <OffeneBewertung f={f} a={lauf.antworten[f.id]} w={x} onWertung={(n) => setWertung(f.id, n)} />}
          </article>
        ))}
      </div>

      <div className="row"><span /><button type="button" className="primary" onClick={onNeu}>Neue Simulation</button></div>
    </>
  );
}

// ---------- Seite ----------

export default function Simulation() {
  const [lauf, setLaufState] = useState<Lauf | null>(ladeLauf);
  const [verlauf, setVerlauf] = useState(ladeVerlauf);
  const { saetze, exams } = useFragenSaetze();
  const setLauf = (l: Lauf | null) => { setLaufState(l); speichereLauf(l); };

  function abgabe(automatisch: boolean) {
    if (!lauf || lauf.abgegeben) return;
    const jetzt = Math.min(Date.now(), lauf.deadline);
    const wertungen = Object.fromEntries(lauf.fragen.map((f) => [f.id, werteAus(f, lauf.antworten[f.id])]));
    const fertig: Lauf = { ...lauf, abgegeben: jetzt, automatisch, wertungen };
    setLauf(fertig);
    const a = auswerten(K, fertig.fragen, wertungen);
    notiereFehler(lauf.fragen.filter((f) => wertungen[f.id]?.art === 'auto' && wertungen[f.id]?.richtig === false)
      .flatMap((f) => ausSimulation(f, lauf.antworten[f.id]) ?? []));
    setVerlauf(ergaenzeVerlauf({
      id: lauf.id, titel: lauf.titel, at: new Date(jetzt).toISOString(), minuten: Math.round((lauf.deadline - lauf.start) / 60_000),
      gebraucht: Math.round((jetzt - lauf.start) / 60_000), fragen: lauf.fragen.length, punkte: a.punkte, max: a.max, prozent: Math.round(a.prozent), schwach: a.schwach,
    }));
    void logActivity({
      kind: 'uebung', severity: a.prozent >= 50 ? 'info' : 'warning', ref: lauf.id,
      title: `Prüfungssimulation: ${a.punkte} von ${a.max} Punkten`,
      detail: `${lauf.fragen.length} Fragen, ${Math.round((jetzt - lauf.start) / 60_000)} min${automatisch ? ', Zeit abgelaufen' : ''}${a.offen ? `, ${a.offen} offene Antworten noch unbewertet` : ''}`,
    });
  }

  // Bewertungen nachträglich (Claude oder Selbstbewertung) im Verlauf nachziehen
  useEffect(() => {
    if (!lauf?.abgegeben || !lauf.wertungen) return;
    const a = auswerten(K, lauf.fragen, lauf.wertungen);
    const alt = verlauf.find((v) => v.id === lauf.id);
    if (alt && (alt.punkte !== a.punkte || alt.max !== a.max)) setVerlauf(ergaenzeVerlauf({ ...alt, punkte: a.punkte, max: a.max, prozent: Math.round(a.prozent), schwach: a.schwach }));
  }, [lauf?.wertungen]);

  const laeuft = lauf && !lauf.abgegeben;

  return (
    <section className={`page sim ${laeuft ? 'sim--laeuft' : ''}`}>
      <div className="page__head">
        <h2>Prüfungssimulation</h2>
        {!laeuft && <p className="muted">Schriftliche Probeprüfung mit Zeitlimit aus Fachbegriffen, Rechenaufgaben und Fragen aus deinem Material, gefiltert nach Kompetenzbereichen und Anforderungsbereichen. Das Ergebnis geht je Thema an den Lernplan.</p>}
      </div>
      {!lauf && <Einrichten onStart={setLauf} saetze={saetze} exams={exams} verlauf={verlauf} />}
      {laeuft && <Pruefung lauf={lauf} setLauf={setLauf} onAbgabe={abgabe} />}
      {lauf?.abgegeben && <Ergebnis lauf={lauf} setLauf={setLauf} onNeu={() => { if (lauf.uebergeben || confirm('Ergebnis wurde noch nicht an den Lernplan übergeben. Trotzdem neu beginnen?')) setLauf(null); }} />}
    </section>
  );
}
