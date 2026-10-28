import { useEffect, useMemo, useRef, useState } from 'react';
import { logActivity } from '../../core/activity';
import { istObjekt, storage } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { AFB_LABEL, operatorAfb } from '../simulation/simulation';
import { useExamensModul } from './modul';
import {
  ALLGEMEINE_IMPULSE, ALTER_LABEL, faelleAusKrankheitsbildern, impulseFuer, mmss, MUENDLICHE_FAELLE, nameAusTitel, VERSORGUNG_LABEL, waehleFall, werteMuendlich,
  type Altersgruppe, type Impuls, type ImpulsCheck, type MuendlicherFall, type Versorgung,
} from './muendlich';
import { ergaenzeMuendlich, ladeMuendlich, type MuendlichEintrag, type Termine } from './speicher';

const ALLE_FAELLE: MuendlicherFall[] = [...MUENDLICHE_FAELLE, ...faelleAusKrankheitsbildern()];
const KB_KURZ: Record<Impuls['kb'], string> = { 'kb.III': 'III · Team und Kontext', 'kb.IV': 'IV · Recht und Ethik', 'kb.V': 'V · Wissenschaft und Berufsrolle' };
const LAUFEND = 'lernstoff.examen.muendlich.laufend';

type Modus = 'pruefung' | 'fallvorstellung' | 'reflexion';
const MODI: Record<Modus, { label: string; hinweis: string; minuten: number; vorbereitung: number }> = {
  pruefung: { label: 'Mündliche Prüfung', hinweis: 'Fallsituation mit Impulsen zu den Kompetenzbereichen III, IV und V, 30 bis 45 Minuten.', minuten: 30, vorbereitung: 20 },
  fallvorstellung: { label: 'Fallvorstellung', hinweis: 'Wie im praktischen Teil: Fall strukturiert vorstellen, höchstens 20 Minuten.', minuten: 20, vorbereitung: 10 },
  reflexion: { label: 'Reflexionsgespräch', hinweis: 'Wie im praktischen Teil: eigenes Handeln reflektieren, höchstens 20 Minuten.', minuten: 20, vorbereitung: 5 },
};

type Phase = 'vorbereitung' | 'sprechen' | 'check' | 'fertig';

interface Lauf {
  id: string;
  modus: Modus;
  fallId: string;
  impulse: Impuls[];
  phase: Phase;
  notizen: string;
  /** Zeitpunkte in ms: Ende der Vorbereitung, Beginn des Sprechens, Beginn des aktuellen Impulses. */
  vorbereitungBis: number;
  sprechenAb?: number;
  sprechMinuten: number;
  impulsAb?: number;
  i: number;
  checks: Record<string, ImpulsCheck>;
}

const istLauf = (v: unknown) => istObjekt(v) && typeof v.id === 'string' && Array.isArray(v.impulse) && v.impulse.every(istObjekt) && typeof v.fallId === 'string' && istObjekt(v.checks) && typeof v.i === 'number';

function impulseFuerModus(modus: Modus, fall: MuendlicherFall, anzahl: number): Impuls[] {
  const name = nameAusTitel(fall.titel);
  const einzeln = (id: string) => ALLGEMEINE_IMPULSE.filter((x) => x.id === id).map((x) => ({ ...x, frage: x.frage.replaceAll('{name}', name) }));
  if (modus === 'fallvorstellung') return einzeln('vorstellung');
  if (modus === 'reflexion') return einzeln('rolle');
  return impulseFuer(fall, anzahl);
}

/** Sekundentakt, solange `aktiv`. */
function useTakt(aktiv: boolean) {
  const [jetzt, setJetzt] = useState(Date.now);
  useEffect(() => {
    if (!aktiv) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [aktiv]);
  return jetzt;
}

/** Eigene Aufnahme zum Nachhören. Bleibt nur im Speicher dieser Seite und wird nirgends hochgeladen. */
function useAufnahme() {
  const [laeuft, setLaeuft] = useState(false);
  const [url, setUrl] = useState('');
  const [fehler, setFehler] = useState('');
  const rec = useRef<MediaRecorder | null>(null);
  const moeglich = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  useEffect(() => () => { rec.current?.stream.getTracks().forEach((t) => t.stop()); if (url) URL.revokeObjectURL(url); }, [url]);
  const start = async () => {
    setFehler('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const teile: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size) teile.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl((alt) => { if (alt) URL.revokeObjectURL(alt); return URL.createObjectURL(new Blob(teile, { type: r.mimeType || 'audio/webm' })); });
      };
      r.start();
      rec.current = r;
      setLaeuft(true);
    } catch {
      setFehler('Mikrofon nicht verfügbar oder nicht erlaubt. Du kannst ohne Aufnahme weiterüben.');
    }
  };
  const stopp = () => { if (rec.current?.state === 'recording') rec.current.stop(); rec.current = null; setLaeuft(false); };
  return { moeglich, laeuft, url, fehler, start, stopp };
}

export function Muendlich({ termine, aendere }: { termine: Termine; aendere: (p: Partial<Termine>) => void }) {
  const [lauf, setLaufRoh] = useState<Lauf | null>(() => storage.read<Lauf | null>(LAUFEND, null, 'local', istLauf));
  const [verlauf, setVerlauf] = useState<MuendlichEintrag[]>(ladeMuendlich);
  const setLauf = (l: Lauf | null) => { setLaufRoh(l); storage.write(LAUFEND, l && l.phase !== 'fertig' ? l : null); };
  const fall = lauf ? ALLE_FAELLE.find((f) => f.id === lauf.fallId) : undefined;

  if (lauf && fall) return <Durchlauf lauf={lauf} fall={fall} setLauf={setLauf} onFertig={(e) => setVerlauf(ergaenzeMuendlich(e))} />;
  return <Einrichten termine={termine} aendere={aendere} verlauf={verlauf} onStart={setLauf} />;
}

// ---------------------------------------------------------------- Einrichten

function Einrichten({ termine, aendere, verlauf, onStart }: {
  termine: Termine; aendere: (p: Partial<Termine>) => void; verlauf: MuendlichEintrag[]; onStart: (l: Lauf) => void;
}) {
  const { params } = useRoute();
  const roh = params.get('modus');
  const [modus, setModus] = useState<Modus>(roh === 'fallvorstellung' || roh === 'reflexion' ? roh : 'pruefung');
  const [fallId, setFallId] = useState('');
  const [anzahl, setAnzahl] = useState(4);
  const [vorbereitung, setVorbereitung] = useState(MODI[modus].vorbereitung);
  const [sprechMinuten, setSprechMinuten] = useState(MODI[modus].minuten);
  const zuletzt = verlauf.slice(0, 5).map((v) => v.fallId);
  const wechsle = (m: Modus) => { setModus(m); setVorbereitung(MODI[m].vorbereitung); setSprechMinuten(MODI[m].minuten); };

  const start = () => {
    const f = fallId ? ALLE_FAELLE.find((x) => x.id === fallId) : waehleFall(ALLE_FAELLE, { alter: termine.praktischAlter, versorgung: termine.praktischVersorgung }, Math.random, zuletzt);
    if (!f) return;
    const jetzt = Date.now();
    onStart({
      id: crypto.randomUUID(), modus, fallId: f.id, impulse: impulseFuerModus(modus, f, anzahl), phase: 'vorbereitung', notizen: '',
      vorbereitungBis: jetzt + vorbereitung * 60_000, sprechMinuten, i: 0, checks: {},
    });
  };

  return (
    <div className="stack-3">
      <div className="card examen__einrichten">
        <h2>Laut üben, wie in der Prüfung</h2>
        <div className="pills" role="group" aria-label="Übungsart">
          {(Object.keys(MODI) as Modus[]).map((m) => <button key={m} type="button" className="pill" aria-pressed={modus === m} onClick={() => wechsle(m)}>{MODI[m].label}</button>)}
        </div>
        <p className="muted">{MODI[modus].hinweis}</p>
        <div className="examen__felder">
          <label className="field">Fallsituation
            <select value={fallId} onChange={(e) => setFallId(e.target.value)}>
              <option value="">Zufällig (anders als dein praktischer Teil)</option>
              <optgroup label="Prüfungsfälle">
                {MUENDLICHE_FAELLE.map((f) => <option key={f.id} value={f.id}>{f.titel} · {VERSORGUNG_LABEL[f.versorgung]}</option>)}
              </optgroup>
              <optgroup label="Aus den Krankheitsbildern">
                {ALLE_FAELLE.filter((f) => f.herkunft === 'krankheitsbild').map((f) => <option key={f.id} value={f.id}>{f.titel} · {VERSORGUNG_LABEL[f.versorgung]}</option>)}
              </optgroup>
            </select>
          </label>
          {modus === 'pruefung' && (
            <label className="field">Impulse
              <select value={anzahl} onChange={(e) => setAnzahl(Number(e.target.value))}>
                {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
          <label className="field">Vorbereitung (Minuten)
            <select value={vorbereitung} onChange={(e) => setVorbereitung(Number(e.target.value))}>
              {[0, 5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n === 0 ? 'keine' : n}</option>)}
            </select>
          </label>
          <label className="field">Sprechzeit (Minuten)
            <select value={sprechMinuten} onChange={(e) => setSprechMinuten(Number(e.target.value))}>
              {(modus === 'pruefung' ? [15, 30, 45] : [10, 15, 20]).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <details className="examen__praktisch-info">
          <summary className="muted">Dein praktischer Teil: {termine.praktischAlter ? ALTER_LABEL[termine.praktischAlter] : 'Altersstufe offen'} · {termine.praktischVersorgung ? VERSORGUNG_LABEL[termine.praktischVersorgung] : 'Bereich offen'}</summary>
          <p className="muted examen__klein">Der mündliche Teil soll laut § 15 PflAPrV einen anderen Versorgungskontext und eine andere Altersstufe haben als der praktische. Trag hier ein, wie dein praktischer Teil aussieht, dann wählt der Zufall passend.</p>
          <div className="examen__felder">
            <label className="field">Altersstufe
              <select value={termine.praktischAlter ?? ''} onChange={(e) => aendere({ praktischAlter: (e.target.value || undefined) as Altersgruppe | undefined })}>
                <option value="">offen</option>
                {(Object.keys(ALTER_LABEL) as Altersgruppe[]).map((a) => <option key={a} value={a}>{ALTER_LABEL[a]}</option>)}
              </select>
            </label>
            <label className="field">Versorgungsbereich
              <select value={termine.praktischVersorgung ?? ''} onChange={(e) => aendere({ praktischVersorgung: (e.target.value || undefined) as Versorgung | undefined })}>
                <option value="">offen</option>
                {(Object.keys(VERSORGUNG_LABEL) as Versorgung[]).map((v) => <option key={v} value={v}>{VERSORGUNG_LABEL[v]}</option>)}
              </select>
            </label>
          </div>
        </details>
        <div className="faecher__aktionen">
          <button type="button" className="primary" onClick={start}>{vorbereitung ? 'Vorbereitung starten' : 'Los geht’s'}</button>
        </div>
        <p className="muted examen__klein">Übungsfälle und Impulse sind erfunden und fachlich nicht geprüft. Sie ersetzen keine Prüfungsfragen deiner Schule.</p>
      </div>

      {verlauf.length > 0 && (
        <div className="card">
          <h2>Bisher geübt</h2>
          <ul className="examen__verlauf">
            {verlauf.slice(0, 8).map((v) => (
              <li key={v.id}>
                <span>{v.titel} <span className="muted">· {MODI[v.modus as Modus]?.label ?? v.modus} · {new Date(v.at).toLocaleDateString('de-DE')}</span></span>
                <span className="examen__quote">{v.prozent} % · {mmss(v.sprechzeit)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Durchlauf

function Durchlauf({ lauf, fall, setLauf, onFertig }: { lauf: Lauf; fall: MuendlicherFall; setLauf: (l: Lauf | null) => void; onFertig: (e: MuendlichEintrag) => void }) {
  const { K } = useExamensModul();
  const jetzt = useTakt(lauf.phase === 'vorbereitung' || lauf.phase === 'sprechen');
  const aufnahme = useAufnahme();
  const imp = lauf.impulse[lauf.i];
  const set = (patch: Partial<Lauf>) => setLauf({ ...lauf, ...patch });
  const ergebnis = useMemo(() => werteMuendlich(lauf.impulse, lauf.checks), [lauf.impulse, lauf.checks]);
  const ueberschrift = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ueberschrift.current?.focus(); }, [lauf.phase, lauf.i]);

  const bucheImpulszeit = (l: Lauf): Record<string, ImpulsCheck> => {
    const aktuell = l.impulse[l.i];
    if (!aktuell || !l.impulsAb) return l.checks;
    const alt = l.checks[aktuell.id] ?? { erfuellt: [], sekunden: 0 };
    return { ...l.checks, [aktuell.id]: { ...alt, sekunden: alt.sekunden + Math.round((Date.now() - l.impulsAb) / 1000) } };
  };
  const beginneSprechen = () => { const t = Date.now(); set({ phase: 'sprechen', sprechenAb: t, impulsAb: t }); };
  const weiter = () => {
    const checks = bucheImpulszeit(lauf);
    if (lauf.i + 1 < lauf.impulse.length) set({ checks, i: lauf.i + 1, impulsAb: Date.now() });
    else { aufnahme.stopp(); set({ checks, phase: 'check', impulsAb: undefined }); }
  };
  const abbrechen = () => { aufnahme.stopp(); setLauf(null); };
  const kreuze = (id: string, n: number) => {
    const alt = lauf.checks[id] ?? { erfuellt: [], sekunden: 0 };
    const erfuellt = alt.erfuellt.includes(n) ? alt.erfuellt.filter((x) => x !== n) : [...alt.erfuellt, n];
    set({ checks: { ...lauf.checks, [id]: { ...alt, erfuellt } } });
  };
  const abschliessen = () => {
    const e: MuendlichEintrag = { id: lauf.id, at: new Date().toISOString(), fallId: fall.id, titel: fall.titel, modus: lauf.modus, prozent: ergebnis.prozent, sprechzeit: ergebnis.sprechzeit, impulse: lauf.impulse.length };
    onFertig(e);
    void logActivity({ kind: 'uebung', severity: 'info', title: `${MODI[lauf.modus].label} geübt: ${fall.titel}`, detail: `${ergebnis.prozent} % der Stichpunkte (Selbstcheck), Sprechzeit ${mmss(ergebnis.sprechzeit)}` });
    set({ phase: 'fertig' });
  };

  const vorbereitungRest = Math.max(0, Math.round((lauf.vorbereitungBis - jetzt) / 1000));
  const sprechRest = lauf.sprechenAb ? Math.round((lauf.sprechenAb + lauf.sprechMinuten * 60_000 - jetzt) / 1000) : lauf.sprechMinuten * 60;
  const impulsZeit = lauf.impulsAb ? Math.round((jetzt - lauf.impulsAb) / 1000) + (imp ? lauf.checks[imp.id]?.sekunden ?? 0 : 0) : 0;

  const fallText = (
    <div className="card examen__fall">
      <p className="eyebrow">{ALTER_LABEL[fall.alter]} · {VERSORGUNG_LABEL[fall.versorgung]}</p>
      <h3>{fall.titel}</h3>
      {fall.text.map((t, n) => <p key={n}>{t}</p>)}
    </div>
  );

  return (
    <div className="stack-3 examen__lauf">
      <div className="examen__leiste" role="group" aria-label="Zeit">
        {lauf.phase === 'vorbereitung' && <><span className="examen__uhr" role="timer" aria-label={`Vorbereitung, noch ${mmss(vorbereitungRest)}`}>{mmss(vorbereitungRest)}</span><span className="muted">Vorbereitung</span></>}
        {lauf.phase === 'sprechen' && <>
          <span className={`examen__uhr${sprechRest < 0 ? ' is-ueber' : sprechRest < 120 ? ' is-knapp' : ''}`} role="timer" aria-label={`Sprechzeit, ${sprechRest < 0 ? 'überzogen um' : 'noch'} ${mmss(Math.abs(sprechRest))}`}>{sprechRest < 0 ? '+' : ''}{mmss(Math.abs(sprechRest))}</span>
          <span className="muted">Impuls {lauf.i + 1}/{lauf.impulse.length} · {mmss(impulsZeit)}</span>
        </>}
        {(lauf.phase === 'check' || lauf.phase === 'fertig') && <span className="muted">Sprechzeit gesamt {mmss(ergebnis.sprechzeit)}</span>}
        <span className="examen__leiste-rest" />
        {lauf.phase !== 'fertig' && <button type="button" className="small ghost" onClick={abbrechen}>Abbrechen</button>}
      </div>

      {lauf.phase === 'vorbereitung' && (<>
        <h2 ref={ueberschrift} tabIndex={-1}>Vorbereitung: Fall lesen und Stichpunkte machen</h2>
        {fallText}
        <label className="field">Deine Stichpunkte (nur für dich, werden nicht bewertet)
          <textarea rows={6} value={lauf.notizen} onChange={(e) => set({ notizen: e.target.value })} placeholder="z. B. Situation – Hintergrund – Einschätzung – Empfehlung" />
        </label>
        {vorbereitungRest === 0 && <p className="note" role="status">Die Vorbereitungszeit ist um.</p>}
        <div className="faecher__aktionen"><button type="button" className="primary" onClick={beginneSprechen}>Prüfung beginnen</button></div>
      </>)}

      {lauf.phase === 'sprechen' && imp && (<>
        <div className="card examen__impuls">
          <div className="examen__impuls-kopf">
            <span className="badge badge--demo">{KB_KURZ[imp.kb]}</span>
            <span className="tag">{imp.operator} · {AFB_LABEL[operatorAfb(K, imp.operator, 2)]}</span>
          </div>
          <h2 ref={ueberschrift} tabIndex={-1} className="examen__frage">{imp.frage}</h2>
          <p className="muted examen__klein">Antworte laut und in ganzen Sätzen, als säße die Prüfungskommission vor dir. Erst danach prüfst du dich selbst.</p>
        </div>
        <details className="examen__fall-zu"><summary>Fall noch einmal lesen</summary>{fallText}{lauf.notizen && <pre className="examen__notizen">{lauf.notizen}</pre>}</details>
        {aufnahme.moeglich && (
          <div className="examen__aufnahme">
            {aufnahme.laeuft
              ? <button type="button" className="small" onClick={aufnahme.stopp}>Aufnahme beenden</button>
              : <button type="button" className="small ghost" onClick={() => void aufnahme.start()}>Antwort aufnehmen</button>}
            {aufnahme.laeuft && <span className="examen__rec" role="status">Aufnahme läuft</span>}
            {aufnahme.fehler && <span className="muted examen__klein">{aufnahme.fehler}</span>}
            {aufnahme.url && !aufnahme.laeuft && <audio controls src={aufnahme.url} />}
          </div>
        )}
        <div className="faecher__aktionen"><button type="button" className="primary" onClick={weiter}>{lauf.i + 1 < lauf.impulse.length ? 'Nächster Impuls' : 'Fertig gesprochen'}</button></div>
      </>)}

      {lauf.phase === 'check' && (<>
        <h2 ref={ueberschrift} tabIndex={-1}>Selbstcheck: Was hast du gesagt?</h2>
        <p className="muted">Hake ehrlich ab, was in deiner Antwort vorkam. {aufnahme.url ? 'Hör dazu deine Aufnahme an.' : ''}</p>
        {aufnahme.url && <audio controls src={aufnahme.url} />}
        {lauf.impulse.map((x) => (
          <fieldset key={x.id} className="card examen__check">
            <legend><span className="badge badge--demo">{x.kb.replace('kb.', '')}</span> {x.frage}</legend>
            {x.stichpunkte.map((s, n) => (
              <label key={n} className="check">
                <input type="checkbox" checked={lauf.checks[x.id]?.erfuellt.includes(n) ?? false} onChange={() => kreuze(x.id, n)} />
                <span>{s}</span>
              </label>
            ))}
            <p className="muted examen__klein">Sprechzeit {mmss(lauf.checks[x.id]?.sekunden ?? 0)}</p>
          </fieldset>
        ))}
        <div className="faecher__aktionen"><button type="button" className="primary" onClick={abschliessen}>Auswerten</button></div>
      </>)}

      {lauf.phase === 'fertig' && (<>
        <h2 ref={ueberschrift} tabIndex={-1}>{ergebnis.prozent} % der Stichpunkte getroffen</h2>
        <div className="card">
          <ul className="examen__verlauf">
            {(Object.keys(ergebnis.proBereich) as Impuls['kb'][]).filter((kb) => ergebnis.proBereich[kb].moeglich).map((kb) => (
              <li key={kb}><span>{KB_KURZ[kb]}</span><span className="examen__quote">{ergebnis.proBereich[kb].erfuellt}/{ergebnis.proBereich[kb].moeglich}</span></li>
            ))}
            <li><span>Sprechzeit</span><span className="examen__quote">{mmss(ergebnis.sprechzeit)} von {lauf.sprechMinuten}:00</span></li>
          </ul>
          <p className="muted examen__klein">Selbsteinschätzung: zählt im Lernplan nicht als Wissensnachweis. Für echte Abfragen nutze Karteikarten, Fälle oder die Prüfungssimulation.</p>
        </div>
        <div className="faecher__aktionen">
          <button type="button" className="primary" onClick={() => setLauf(null)}>Neue Übung</button>
          {fall.herkunft === 'krankheitsbild' && <button type="button" className="ghost" onClick={() => navigate(`/lernen/krankheitsbilder?fall=${encodeURIComponent(fall.id.replace(/^kh:/, ''))}`)}>Fall fachlich üben</button>}
          <button type="button" className="ghost" onClick={() => navigate(`/lernen/simulation?kb=${encodeURIComponent('kb.III,kb.IV,kb.V')}`)}>Probeprüfung III–V</button>
        </div>
      </>)}
    </div>
  );
}
