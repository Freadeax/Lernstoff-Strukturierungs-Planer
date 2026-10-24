import { useEffect, useMemo, useRef, useState } from 'react';
import './fall.css';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { pflegeModule } from '../../modules/pflege';
import { useRoute } from '../../ui/shell/router';
import { proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import {
  fallThemen, SETTING_LABEL, STUFE_LABEL, SZENARIEN, szenarioAusThema,
  type Setting, type Stufe, type Szenario,
} from './faelle';
import {
  archiviere, fallTreffer, ladeAktuell, ladeArchiv, neuerFall, news2, NOTE_LABEL, SCHRITT_BEWERTUNG_LABEL, SCHRITT_LABEL, SCHRITTE,
  speichereAktuell, spieleZug, werteAus, WERTUNG_LABEL, ZUSTAND_LABEL,
  type Fall, type Vitalwerte, type Wertung,
} from './simulator';

const modul = pflegeModule;
const themaName = (id: string) => modul.topics.find((t) => t.id === id)?.name ?? id;
const PRAXISANLEITUNG = 'Ich frage meine Praxisanleitung kurz um Rat, was ich als Nächstes beachten sollte.';

const VITAL: Array<{ key: keyof Vitalwerte; label: string; einheit?: string }> = [
  { key: 'rr', label: 'RR', einheit: 'mmHg' }, { key: 'puls', label: 'Puls', einheit: '/min' },
  { key: 'af', label: 'AF', einheit: '/min' }, { key: 'spo2', label: 'SpO₂', einheit: '%' },
  { key: 'temp', label: 'Temp.', einheit: '°C' }, { key: 'bz', label: 'BZ', einheit: 'mg/dl' },
  { key: 'schmerz', label: 'Schmerz', einheit: 'NRS' }, { key: 'bewusstsein', label: 'Bewusstsein' },
  { key: 'sauerstoff', label: 'O₂-Gabe' },
];

const WERTUNG_KLASSE: Record<Wertung, string> = { gut: 'ok', teilweise: '', unguenstig: 'warn', gefaehrlich: 'warn fall__gefahr', keine: '' };

function fehlertext(e: unknown): string {
  const status = (e as { status?: number }).status;
  if (status === 401) return 'Der API-Schlüssel wurde abgelehnt. Bitte in den Einstellungen prüfen.';
  if (status === 429 || status === 529) return 'Claude ist gerade ausgelastet. Bitte gleich noch einmal versuchen.';
  if (!navigator.onLine) return 'Keine Internetverbindung. Der Simulator braucht Claude und damit Netz.';
  return e instanceof Error ? e.message : 'Unbekannter Fehler.';
}

// ---------- Start ----------

function Start({ onStart, apiKey }: { onStart: (s: Szenario, stufe: Stufe) => void; apiKey: string }) {
  const [stufe, setStufe] = useState<Stufe>(1);
  const themen = useMemo(() => fallThemen(modul), []);
  // Sprung aus dem Lernplan: #/lernen/fall?thema=… stellt passende Fälle nach vorn
  const wunsch = useRoute().params.get('thema') ?? '';
  const [themaId, setThemaId] = useState(themen.some((t) => t.id === wunsch) ? wunsch : themen[0]?.id ?? '');
  const szenarien = useMemo(() => [...SZENARIEN].sort((a, b) => Number(b.topicIds.includes(wunsch)) - Number(a.topicIds.includes(wunsch))), [wunsch]);
  const [setting, setSetting] = useState<Setting>('krankenhaus');
  const [archiv] = useState(ladeArchiv);
  const [offen, setOffen] = useState<Fall | null>(null);

  if (offen) return <Auswertung fall={offen} onNeu={() => setOffen(null)} onNochmal={() => onStart(offen.szenario, offen.stufe)} />;

  return (
    <>
      {!apiKey && (
        <div className="note warn" role="status">
          Für den Simulator braucht die App deinen Claude-API-Schlüssel. <a href="#/einstellungen">Zu den Einstellungen</a>
        </div>
      )}
      <div className="card fall__einstellungen">
        <span className="muted">Schwierigkeit</span>
        <div className="pills" role="group" aria-label="Schwierigkeit">
          {([1, 2, 3] as Stufe[]).map((s) => (
            <button key={s} type="button" className="pill" aria-pressed={stufe === s} onClick={() => setStufe(s)}>{STUFE_LABEL[s]}</button>
          ))}
        </div>
      </div>

      <div className="fall__szenarien">
        {szenarien.map((s) => (
          <button key={s.id} type="button" className="card fall__szenario" disabled={!apiKey} onClick={() => onStart(s, stufe)}>
            <span className="row fall__badges">
              <span className="badge badge--demo">{SETTING_LABEL[s.setting]}</span>
              {wunsch && s.topicIds.includes(wunsch) && <span className="badge">passt zu {themaName(wunsch)}</span>}
            </span>
            <strong>{s.titel}</strong>
            <span className="muted">{s.kurz}</span>
          </button>
        ))}
      </div>

      <form className="card fall__eigen" onSubmit={(e) => {
        e.preventDefault();
        const t = themen.find((x) => x.id === themaId);
        if (t) onStart(szenarioAusThema(t, setting), stufe);
      }}>
        <h3>Eigener Fall aus dem Themenkatalog</h3>
        <div className="fall__eigen-felder">
          <label>
            <span className="muted">Thema</span>
            <select value={themaId} onChange={(e) => setThemaId(e.target.value)}>
              {themen.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>
            <span className="muted">Setting</span>
            <select value={setting} onChange={(e) => setSetting(e.target.value as Setting)}>
              {(Object.keys(SETTING_LABEL) as Setting[]).map((s) => <option key={s} value={s}>{SETTING_LABEL[s]}</option>)}
            </select>
          </label>
        </div>
        <div className="row"><button type="submit" className="primary" disabled={!apiKey}>Fall erzeugen</button></div>
      </form>

      {archiv.length > 0 && (
        <div className="card">
          <h3>Deine letzten Fälle</h3>
          <ul className="fall__archiv">
            {archiv.map((f) => (
              <li key={f.id}>
                <button type="button" className="ghost" onClick={() => setOffen(f)}>
                  <strong>{f.szenario.titel}</strong>
                  <span className="muted">
                    {new Date(f.begonnen).toLocaleDateString('de-DE')} · {STUFE_LABEL[f.stufe]} · {f.abschluss ? NOTE_LABEL[f.abschluss.note] : 'ohne Auswertung'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// ---------- Kurve (Seitenleiste) ----------

function Kurve({ fall }: { fall: Fall }) {
  const letzter = fall.runden.at(-1)?.zug;
  const v = letzter?.vitalwerte;
  const score = v ? news2(v) : null;
  const bearbeitet = new Set(fall.runden.filter((r) => r.eingabe !== undefined).map((r) => r.zug.schritt));
  return (
    <aside className="card fall__kurve" aria-label="Patientenkurve">
      <div className="fall__kurve-kopf">
        <h3>Kurve</h3>
        {letzter?.uhrzeit && <span className="fall__uhr">{letzter.uhrzeit} Uhr</span>}
      </div>
      {letzter && <p className={`fall__zustand fall__zustand--${letzter.zustand}`}>Zustand: <strong>{ZUSTAND_LABEL[letzter.zustand]}</strong></p>}
      <dl className="fall__vital">
        {VITAL.map(({ key, label, einheit }) => (
          <div key={key} className={v?.[key] ? '' : 'is-leer'}>
            <dt>{label}</dt>
            <dd>{v?.[key] || '–'}{v?.[key] && einheit ? <small> {einheit}</small> : null}</dd>
          </div>
        ))}
      </dl>
      {score && (score.fehlt.length
        ? <p className="muted fall__news">NEWS2: es fehlen {score.fehlt.join(', ')}.</p>
        : <p className={`fall__news fall__news--${score.risiko}`}>NEWS2: <strong>{score.punkte}</strong> Punkte, Risiko {score.risiko}</p>)}

      <h3 className="fall__prozess-titel">Pflegeprozess</h3>
      <ol className="fall__prozess">
        {SCHRITTE.map((s) => (
          <li key={s} className={[bearbeitet.has(s) ? 'is-bearbeitet' : '', letzter?.schritt === s && fall.runden.length > 1 ? 'is-aktiv' : ''].join(' ')}>
            {SCHRITT_LABEL[s]}
          </li>
        ))}
      </ol>
      <p className="muted fall__hinweis">Werte und Verlauf sind fiktiv. NEWS2 rechnet die App selbst nach. Maßgeblich bleiben Anordnung und Hausstandard.</p>
    </aside>
  );
}

// ---------- Auswertung ----------

function Auswertung({ fall, onNeu, onNochmal }: { fall: Fall; onNeu: () => void; onNochmal: () => void }) {
  const a = fall.abschluss;
  return (
    <div className="card fall__auswertung" aria-live="polite">
      <p className="muted">{fall.szenario.titel} · {SETTING_LABEL[fall.szenario.setting]} · {STUFE_LABEL[fall.stufe]} · {fall.runden.filter((r) => r.eingabe).length} Entscheidungen</p>
      {a ? (
        <>
          <h3 className={`fall__note fall__note--${a.note}`}>{NOTE_LABEL[a.note]}</h3>
          <p>{a.gesamt}</p>
          <table className="fall__schritte">
            <thead><tr><th>Schritt</th><th>Bewertung</th><th>Kommentar</th></tr></thead>
            <tbody>
              {a.schritte.map((s) => (
                <tr key={s.schritt}>
                  <th scope="row">{SCHRITT_LABEL[s.schritt]}</th>
                  <td><span className={`fall__bew fall__bew--${s.bewertung}`}>{SCHRITT_BEWERTUNG_LABEL[s.bewertung]}</span></td>
                  <td>{s.kommentar}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fall__zweispaltig">
            <div><h4>Das war stark</h4><ul>{a.staerken.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            <div><h4>Das nächste Mal</h4><ul>{a.verbesserungen.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          </div>
          {a.musterloesung && <details><summary>Idealer Ablauf</summary><p>{a.musterloesung}</p></details>}
          {a.themen.length > 0 && (
            <>
              <h4>Zum Wiederholen</h4>
              <div className="pills">{a.themen.map((id) => <a key={id} className="pill" href="#/lernen/themen">{themaName(id)}</a>)}</div>
            </>
          )}
        </>
      ) : <p className="muted">Dieser Fall wurde ohne Auswertung beendet.</p>}
      <details>
        <summary>Verlauf nachlesen</summary>
        <Verlauf fall={fall} />
      </details>
      <div className="row">
        <button type="button" className="primary" onClick={onNeu}>Neuer Fall</button>
        <button type="button" onClick={onNochmal}>Diesen Fall noch einmal</button>
      </div>
    </div>
  );
}

// ---------- Verlauf ----------

function Verlauf({ fall }: { fall: Fall }) {
  return (
    <ol className="fall__verlauf">
      {fall.runden.map((r, i) => (
        <li key={i}>
          {r.eingabe !== undefined && <p className="fall__ich"><span className="visually-hidden">Du: </span>{r.eingabe}</p>}
          {r.zug.rueckmeldung.wertung !== 'keine' && r.zug.rueckmeldung.text && (
            <div className={`note ${WERTUNG_KLASSE[r.zug.rueckmeldung.wertung]}`}>
              <strong>{WERTUNG_LABEL[r.zug.rueckmeldung.wertung]}</strong> <span className="muted">· {SCHRITT_LABEL[r.zug.schritt]}</span>
              <br />{r.zug.rueckmeldung.text}
            </div>
          )}
          <p className="fall__situation">
            {r.zug.uhrzeit && <span className="fall__uhr">{r.zug.uhrzeit}</span>} {r.zug.situation}
          </p>
        </li>
      ))}
    </ol>
  );
}

// ---------- Seite ----------

export default function Fallsimulator() {
  const [apiKey] = useState(getApiKey);
  const [fall, setFall] = useState<Fall | null>(ladeAktuell);
  const [eingabe, setEingabe] = useState('');
  const [laedt, setLaedt] = useState<'' | 'zug' | 'auswertung'>('');
  const [fehler, setFehler] = useState('');
  const endeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lernplan = useLernplanUebernahme('fall');

  useEffect(() => { speichereAktuell(fall); }, [fall]);
  useEffect(() => { endeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [fall?.runden.length, laedt]);

  async function starte(s: Szenario, stufe: Stufe) {
    const f = neuerFall(s, stufe);
    setFall(f); setFehler(''); setEingabe('');
    await zug(f);
  }

  async function zug(f: Fall, text?: string) {
    setLaedt('zug'); setFehler('');
    try {
      const z = await spieleZug(apiKey, f, modul, text);
      setFall({ ...f, runden: [...f.runden, { eingabe: text, zug: z }] });
      setEingabe('');
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    } catch (e) {
      setFehler(fehlertext(e));
      if (text !== undefined) setEingabe(text);
    } finally {
      setLaedt('');
    }
  }

  async function beende(f: Fall) {
    setLaedt('auswertung'); setFehler('');
    try {
      const abschluss = await werteAus(apiKey, f, modul);
      const fertig = { ...f, abschluss };
      setFall(fertig); archiviere(fertig);
      void logActivity({
        kind: 'uebung', severity: abschluss.note === 'unsicher' ? 'warning' : 'info',
        title: `Fallsimulator: ${f.szenario.titel} – ${NOTE_LABEL[abschluss.note]}`,
        detail: `${STUFE_LABEL[f.stufe]}, ${f.runden.filter((r) => r.eingabe).length} Entscheidungen`,
        ref: f.szenario.topicIds[0],
      });
      lernplan.uebernimm(proThema(fallTreffer(fertig)));
    } catch (e) {
      setFehler(fehlertext(e));
    } finally {
      setLaedt('');
    }
  }

  function abbrechen() {
    if (!fall || !confirm('Fall ohne Auswertung beenden?')) return;
    if (fall.runden.some((r) => r.eingabe)) archiviere(fall);
    setFall(null); setFehler('');
  }

  const letzter = fall?.runden.at(-1)?.zug;
  const entscheidungen = fall?.runden.filter((r) => r.eingabe).length ?? 0;

  return (
    <section className="page fall">
      <div className="page__head">
        <h2>Fallbeispiel-Simulator</h2>
        <p className="muted">Claude spielt Patientin, Angehörige und Station. Du entscheidest, was du tust, und der Verlauf hängt davon ab. Am Ende gibt es eine Auswertung entlang des Pflegeprozesses. Alle Fälle sind erfunden.</p>
      </div>

      {!fall && <Start apiKey={apiKey} onStart={(s, st) => void starte(s, st)} />}

      {fall?.abschluss && (
        <>
          <Auswertung fall={fall} onNeu={() => { setFall(null); lernplan.zuruecksetzen(); }} onNochmal={() => { lernplan.zuruecksetzen(); void starte(fall.szenario, fall.stufe); }} />
          <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
        </>
      )}

      {fall && !fall.abschluss && (
        <div className="fall__layout">
          <div className="card fall__haupt">
            <div className="fall__kopf">
              <div>
                <span className="badge badge--demo">{SETTING_LABEL[fall.szenario.setting]} · {STUFE_LABEL[fall.stufe]}</span>
                <h3>{fall.szenario.titel}</h3>
              </div>
              <button type="button" className="ghost" onClick={abbrechen}>Abbrechen</button>
            </div>
            <p className="muted">{fall.szenario.kurz}</p>

            <Verlauf fall={fall} />

            {laedt && (
              <p className="fall__laedt" role="status">
                <span className="fall__punkte" aria-hidden="true"><i /><i /><i /></span>
                {laedt === 'auswertung' ? 'Dein Vorgehen wird ausgewertet …' : fall.runden.length ? 'Die Station reagiert …' : 'Der Fall wird vorbereitet …'}
              </p>
            )}
            {fehler && (
              <div className="note warn" role="alert">
                {fehler}
                {!fall.runden.length && <div className="row"><button type="button" onClick={() => void zug(fall)}>Erneut versuchen</button></div>}
              </div>
            )}

            {letzter && !laedt && (
              letzter.beendet ? (
                <div className="note ok" role="status">
                  Der Fall ist abgeschlossen.
                  <div className="row"><button type="button" className="primary" onClick={() => void beende(fall)}>Auswertung ansehen</button></div>
                </div>
              ) : (
                <form className="fall__eingabe" onSubmit={(e) => { e.preventDefault(); if (eingabe.trim()) void zug(fall, eingabe.trim()); }}>
                  {letzter.optionen.length > 0 && (
                    <div className="fall__optionen" role="group" aria-label="Vorschläge">
                      {letzter.optionen.map((o) => (
                        <button key={o} type="button" className="fall__option" onClick={() => void zug(fall, o)}>{o}</button>
                      ))}
                    </div>
                  )}
                  <label>
                    <span className="visually-hidden">Was tust du?</span>
                    <textarea ref={inputRef} rows={2} placeholder="Oder frei: Was tust du, was sagst du, was beobachtest du?" value={eingabe}
                      enterKeyHint="send"
                      onChange={(e) => setEingabe(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && eingabe.trim()) { e.preventDefault(); void zug(fall, eingabe.trim()); } }} />
                  </label>
                  <div className="row">
                    <button type="submit" className="primary" disabled={!eingabe.trim()}>Handeln</button>
                    <button type="button" className="ghost" onClick={() => void zug(fall, PRAXISANLEITUNG)}>Praxisanleitung fragen</button>
                    {entscheidungen >= 3 && <button type="button" className="ghost" onClick={() => void beende(fall)}>Fall beenden und auswerten</button>}
                  </div>
                </form>
              )
            )}
            <div ref={endeRef} />
          </div>
          <Kurve fall={fall} />
        </div>
      )}
    </section>
  );
}
