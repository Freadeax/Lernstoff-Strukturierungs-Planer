import { useEffect, useMemo, useRef, useState } from 'react';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { Titelbild } from '../../ui/Titelbild';
import './fall.css';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { pflegeModule } from '../../modules/pflege';
import { useRoute } from '../../ui/shell/router';
import { proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import { faelleZuKrankheit, KI_KRANKHEITEN } from '../krankheitsbilder/fallbezug';
import { PatientenMonitor } from '../../ui/sim/PatientenMonitor';
import { DEMO_SZENARIO, demoAbschluss, demoZug, istDemo } from './demo';
import { Szene } from './Szene';
import { FotoSzene } from './FotoSzene';
import { fotoRaumFuer } from './fotoraeume';
import { Portraet } from '../../ui/sim/Portraet';
import { personFuer, type PortraetZustand } from '../../ui/sim/personen';
import { raumUrl } from '../../ui/sim/raeume/katalog';
import { szenenBild, type Fokus, type SzenenBild } from './szene';
import { LEISTE, leistenVorschlaege, objektInfo, RAUM_FUER, type Leiste, type Marker, type Raum } from './raeume';
import {
  fallThemen, SETTING_LABEL, STUFE_LABEL, SZENARIEN, szenarioAusThema,
  type Setting, type Stufe, type Szenario,
} from './faelle';
import {
  archiviere, fallTreffer, ladeAktuell, ladeArchiv, neuerFall, news2, news2Verlauf, NOTE_LABEL, SCHRITT_BEWERTUNG_LABEL, SCHRITT_LABEL, SCHRITTE,
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
  const params = useRoute().params;
  const wunsch = params.get('thema') ?? '';
  // Sprung aus dem Krankheitsbild-Steckbrief: #/lernen/fall?kb=kh.… stellt dessen Fälle nach vorn
  const kb = params.get('kb') ?? '';
  const kbFaelle = useMemo(() => (kb ? faelleZuKrankheit(KI_KRANKHEITEN, kb) : []), [kb]);
  const kbName = modul.diseaseProfiles?.find((p) => p.id === kb)?.name ?? kb;
  const [themaId, setThemaId] = useState(themen.some((t) => t.id === wunsch) ? wunsch : themen[0]?.id ?? '');
  const passt = (s: Szenario) => Number(kbFaelle.includes(s.id)) * 2 + Number(s.topicIds.includes(wunsch));
  const szenarien = useMemo(() => [...SZENARIEN].sort((a, b) => passt(b) - passt(a)), [wunsch, kbFaelle]);
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
      <div className="card fall__probe">
        <div>
          <strong>Probefall ohne KI</strong>
          <p className="muted">Ein kurzer, fest geschriebener Nachtdienst-Fall mit Zimmerszene und Monitor. Läuft ohne Schlüssel und offline, zählt nicht für den Lernplan.</p>
        </div>
        <button type="button" className="primary" onClick={() => onStart(DEMO_SZENARIO, 1)}>Probefall starten</button>
      </div>
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
              {kbFaelle.includes(s.id) && <span className="badge">zeigt {kbName}</span>}
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

/** ↑ oder ↓, wenn sich ein Messwert gegenüber dem letzten Zug verändert hat. */
function trend(alt: string, neu: string): '↑' | '↓' | '' {
  const zahl = (x: string) => Number(x.split('/')[0]!.replace(',', '.').replace(/[^\d.]/g, ''));
  if (!alt.trim() || !neu.trim()) return '';
  const a = zahl(alt), n = zahl(neu);
  return Number.isFinite(a) && Number.isFinite(n) && a !== n ? (n > a ? '↑' : '↓') : '';
}

function Kurve({ fall }: { fall: Fall }) {
  const letzter = fall.runden.at(-1)?.zug;
  const v = letzter?.vitalwerte;
  const vorher = fall.runden.at(-2)?.zug.vitalwerte;
  const score = v ? news2(v) : null;
  const verlauf = news2Verlauf(fall);
  const bearbeitet = new Set(fall.runden.filter((r) => r.eingabe !== undefined).map((r) => r.zug.schritt));
  return (
    <aside className="card fall__kurve" aria-label="Patientenkurve">
      <div className="fall__kurve-kopf">
        <h3>Kurve</h3>
        {letzter?.uhrzeit && <span className="fall__uhr">{letzter.uhrzeit} Uhr</span>}
      </div>
      {letzter && <p className={`fall__zustand fall__zustand--${letzter.zustand}`}>Zustand: <strong>{ZUSTAND_LABEL[letzter.zustand]}</strong></p>}
      <dl className="fall__vital">
        {VITAL.map(({ key, label, einheit }) => {
          const alt = vorher?.[key] ?? '', neu = v?.[key] ?? '';
          const richtung = trend(alt, neu);
          return (
            <div key={`${key}-${neu}`} className={[neu ? '' : 'is-leer', alt !== neu && neu ? 'is-geaendert' : ''].join(' ')}>
              <dt>{label}</dt>
              <dd>
                {neu || '–'}{neu && einheit ? <small> {einheit}</small> : null}
                {richtung && <span className="fall__trendpfeil is-neu" aria-label={richtung === '↑' ? 'gestiegen' : 'gesunken'}>{richtung}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {score && (score.fehlt.length
        ? <p className="muted fall__news">NEWS2: es fehlen {score.fehlt.join(', ')}.</p>
        : <p className={`fall__news fall__news--${score.risiko}`}>NEWS2: <strong>{score.punkte}</strong> Punkte, Risiko {score.risiko}</p>)}
      {verlauf.length > 1 && (
        <div className="fall__trend">
          <span>NEWS2-Verlauf</span>
          <ol aria-label="NEWS2 je Zug">
            {verlauf.map((p) => <li key={p.runde} className={`fall__news--${p.risiko}`} style={{ height: `${Math.max(12, Math.min(100, p.punkte / 12 * 100))}%` }} title={`${p.uhrzeit} Uhr: ${p.punkte}`}><span className="fall__sr">{p.uhrzeit} Uhr: </span>{p.punkte}</li>)}
          </ol>
        </div>
      )}

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

function Verlauf({ fall, bis }: { fall: Fall; bis?: number }) {
  return (
    <ol className="fall__verlauf">
      {fall.runden.slice(0, bis).map((r, i) => (
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

// ---------- Aktueller Zug: Rückmeldung und Untertitel ----------

/** Die neue Situation erscheint Wort für Wort (bei reduzierter Bewegung sofort, per CSS). */
function Untertitel({ uhrzeit, text }: { uhrzeit: string; text: string }) {
  const woerter = text.split(/(\s+)/);
  const schritt = Math.min(45, 2400 / Math.max(1, woerter.length / 2));
  let n = 0;
  return (
    <p className="fall__untertitel" aria-live="polite">
      {uhrzeit && <span className="fall__uhr">{uhrzeit} </span>}
      {woerter.map((w, i) => (/\s+/.test(w) ? w : <span key={i} className="fall__wort" style={{ animationDelay: `${(n++) * schritt}ms` }}>{w}</span>))}
    </p>
  );
}

function AktuellerZug({ fall }: { fall: Fall }) {
  const r = fall.runden.at(-1);
  if (!r) return null;
  const nr = fall.runden.length;
  return (
    <div className="fall__aktuell" key={nr}>
      {r.eingabe !== undefined && <p className="fall__ich fall__rueck"><span className="visually-hidden">Du: </span>{r.eingabe}</p>}
      {r.zug.rueckmeldung.wertung !== 'keine' && r.zug.rueckmeldung.text && (
        <div className={`note fall__rueck ${WERTUNG_KLASSE[r.zug.rueckmeldung.wertung]}`}>
          <strong>{WERTUNG_LABEL[r.zug.rueckmeldung.wertung]}</strong> <span className="muted">· {SCHRITT_LABEL[r.zug.schritt]}</span>
          <br />{r.zug.rueckmeldung.text}
        </div>
      )}
      <Untertitel uhrzeit={r.zug.uhrzeit} text={r.zug.situation} />
    </div>
  );
}

// ---------- Objektmenü und Bedienleiste ----------

function Vorschlag({ text, demo, onWahl }: { text: string; demo: boolean; onWahl: (t: string) => void }) {
  return (
    <li>
      <button type="button" className="fall__vorschlag" disabled={demo} onClick={() => onWahl(text)}
        title={demo ? 'Im Probefall wählst du aus den Vorschlägen unten. Mit KI-Schlüssel übernimmst du das als eigene Handlung.' : 'In das Eingabefeld übernehmen'}>
        {text}
      </button>
    </li>
  );
}

function Werkzeuge({ fall, bild, raum, demo, foto, marker, setMarker, onWahl, onUebersicht }: {
  fall: Fall; bild: SzenenBild; raum: Raum; demo: boolean; foto: boolean; marker: Marker | null; setMarker: (m: Marker | null) => void;
  onWahl: (t: string) => void; onUebersicht: () => void;
}) {
  const [bereich, setBereich] = useState<Leiste | null>(null);
  const runde = fall.runden.length;
  useEffect(() => { setBereich(null); }, [runde]);
  const info = marker ? objektInfo(marker.id, raum, bild) : null;
  return (
    <div className="fall__werkzeuge">
      <div className="fall__leiste" role="group" aria-label="Bedienleiste">
        {LEISTE.map((l) => (
          <button key={l.id} type="button" className="fall__leisten-knopf" aria-pressed={bereich === l.id}
            onClick={() => { setBereich(bereich === l.id ? null : l.id); setMarker(null); }}>{l.label}</button>
        ))}
        <button type="button" className="fall__leisten-knopf is-uebersicht" onClick={() => { setBereich(null); onUebersicht(); }}>Raumübersicht</button>
      </div>
      {info && marker && (
        <section className="fall__objekt" aria-label={`${marker.nr}: ${info.titel}`}>
          <div className="fall__objekt-kopf">
            <strong><span className="fall__objekt-nr" aria-hidden="true">{marker.nr}</span> {marker.id === 'patient' ? marker.name : info.titel}</strong>
            <button type="button" className="ghost" onClick={() => setMarker(null)}>Schließen</button>
          </div>
          <ul className="fall__objekt-beobachtung">{info.beobachtung.map((b) => <li key={b}>{b}</li>)}</ul>
          <ul className="fall__vorschlaege">{info.handlungen.map((h) => <Vorschlag key={h} text={h} demo={demo} onWahl={onWahl} />)}</ul>
        </section>
      )}
      {bereich && (
        <section className="fall__objekt" aria-label={LEISTE.find((l) => l.id === bereich)!.label}>
          <div className="fall__objekt-kopf">
            <strong>{LEISTE.find((l) => l.id === bereich)!.label}</strong>
            <button type="button" className="ghost" onClick={() => setBereich(null)}>Schließen</button>
          </div>
          {bereich === 'material' && foto && raum === 'krankenhaus' && (
            <figure className="fall__materialraum">
              <img src={raumUrl('19_krankenhaus_materialraum')} alt="Materialraum der Station: Regale mit Verbandsmaterial, Spritzen und Infusionszubehör, davor ein Verbandswagen." width={1280} height={720} loading="lazy" decoding="async" />
            </figure>
          )}
          {bereich === 'uebergabe' && <p className="muted">Entwurf aus dem bisherigen Verlauf. Prüfe ihn und ergänze, was fehlt.</p>}
          <ul className="fall__vorschlaege">{leistenVorschlaege(bereich, raum, bild, fall).map((h) => <Vorschlag key={h} text={h} demo={demo} onWahl={onWahl} />)}</ul>
        </section>
      )}
      {demo && (info || bereich) && <p className="muted fall__demo-hinweis">Im Probefall sind diese Handlungen nur zum Ansehen. Mit KI-Schlüssel übernimmst du sie ins Eingabefeld.</p>}
    </div>
  );
}

const warte = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

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
      // Probefall: kurze Pause, damit die Station sichtbar „reagiert“
      const z = istDemo(f) ? (await warte(500), demoZug(f, text)) : await spieleZug(apiKey, f, modul, text);
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
      if (istDemo(f)) {
        await warte(400);
        const fertig = { ...f, abschluss: demoAbschluss(f) };
        setFall(fertig); archiviere(fertig);
        return;
      }
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
  const bild = useMemo(() => (fall ? szenenBild(fall) : null), [fall]);
  const raum: Raum = fall ? RAUM_FUER[fall.szenario.setting] ?? 'krankenhaus' : 'krankenhaus';
  // Marker oder Raumübersicht steuern die Kamera, bis der nächste Zug kommt
  const [marker, setMarker] = useState<Marker | null>(null);
  const [kamera, setKamera] = useState<Fokus | null>(null);
  const fotoRaum = fall ? fotoRaumFuer(fall.szenario.id, fall.szenario.setting, fall.szenario.kurz) : null;
  const [gezeichnet, setGezeichnet] = useState(false);
  const zeigeFoto = !!fotoRaum && !gezeichnet;
  const person = fall ? personFuer('fall', fall.szenario.id) : null;
  const portraetZustand: PortraetZustand = bild?.zustand === 'kritisch' ? 'kritisch' : bild?.zustand === 'verschlechtert' ? 'angestrengt' : 'stabil';
  const runden = fall?.runden.length ?? 0;
  useEffect(() => { setMarker(null); setKamera(null); }, [runden]);
  function waehleMarker(m: Marker | null) { setMarker(m); setKamera(m ? m.ort : null); }
  function uebernimm(text: string) {
    setEingabe(text);
    requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  }
  const demo = fall ? istDemo(fall) : false;
  const entscheidungen = fall?.runden.filter((r) => r.eingabe).length ?? 0;

  return (
    <section className="page fall">
      <div className="page__head">
        <h2>Fallbeispiel-Simulator</h2>
        <p className="muted">Claude spielt Patientin, Angehörige und Station. Du entscheidest, was du tust, und der Verlauf hängt davon ab. Am Ende gibt es eine Auswertung entlang des Pflegeprozesses. Alle Fälle sind erfunden.</p>
        <DatenHinweis art="ki" detail="Gesendet werden der erfundene Fall und deine Eingaben." />
      </div>

      {!fall && <Titelbild motiv="simulation" sofort className="fall__titelbild" />}
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
              <div className="fall__kopf-titel">
                {person && <Portraet person={person} zustand={portraetZustand} groesse={56} />}
                <div>
                  <span className="badge badge--demo">{SETTING_LABEL[fall.szenario.setting]} · {STUFE_LABEL[fall.stufe]}</span>
                  <h3>{fall.szenario.titel}</h3>
                </div>
              </div>
              <button type="button" className="ghost" onClick={abbrechen}>Abbrechen</button>
            </div>
            <p className="muted">{fall.szenario.kurz}</p>

            {bild && (
              <div className="fall__buehne">
                <div className="fall__szenenwahl">
                  {zeigeFoto && fotoRaum ? (
                    <FotoSzene raum={fotoRaum} bild={bild} uhrzeit={letzter?.uhrzeit} fokus={kamera ?? undefined} aktiverMarker={marker?.id ?? null}
                      onMarker={(m) => waehleMarker(marker?.id === m.id ? null : m)}
                      fallback={<span>Das Raumfoto lädt gerade nicht. <button type="button" onClick={() => setGezeichnet(true)}>Gezeichnete Ansicht zeigen</button></span>} />
                  ) : (
                    <Szene bild={bild} raum={raum} uhrzeit={letzter?.uhrzeit} fokus={kamera ?? undefined} aktiverMarker={marker?.id ?? null} onMarker={(m) => waehleMarker(marker?.id === m.id ? null : m)} />
                  )}
                  {fotoRaum && (
                    <button type="button" className="ghost fall__ansicht" onClick={() => { setGezeichnet(!gezeichnet); setMarker(null); }}>
                      {gezeichnet ? 'Fotoansicht' : 'Gezeichnete Ansicht'}
                    </button>
                  )}
                </div>
                <PatientenMonitor werte={bild.monitor} aktiv={bild.monitorAn} titel={bild.monitorAn ? `${letzter?.uhrzeit ?? ''} Uhr` : 'Noch nicht gemessen'} />
              </div>
            )}

            {bild && letzter && !letzter.beendet && (
              <Werkzeuge fall={fall} bild={bild} raum={raum} demo={demo} foto={zeigeFoto} marker={marker} setMarker={waehleMarker} onWahl={uebernimm} onUebersicht={() => { setMarker(null); setKamera('raum'); }} />
            )}

            {fall.runden.length > 1 && (
              <details className="fall__verlauf-details">
                <summary>Bisheriger Verlauf ({fall.runden.length - 1} {fall.runden.length === 2 ? 'Abschnitt' : 'Abschnitte'})</summary>
                <Verlauf fall={fall} bis={-1} />
              </details>
            )}
            <AktuellerZug fall={fall} />

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
                  {demo ? <p className="muted fall__demo-hinweis">Im Probefall wählst du aus den Vorschlägen. Mit KI-Schlüssel kannst du frei schreiben.</p> : <>
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
                  </>}
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
