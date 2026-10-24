import { useEffect, useMemo, useRef, useState } from 'react';
import './sis.css';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { navigate, useRoute } from '../../ui/shell/router';
import { SIS_THEMA } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import {
  FELD_KURZ, FELDER, feldHilfe, feldLabel, MATRIX_FELDER, RISIKEN, RISIKO_LABEL, SETTING_LABEL, SIS_FAELLE, THEMENFELDER,
  type Feld, type JaNein, type Loesung, type Risiko, type SisFall, type Themenfeld,
} from './faelle';
import {
  leereFelder, leereMatrix, pruefeSis,
  type FeldStatus, type Felder, type Matrix, type MatrixErgebnis, type MatrixEingabe, type PunktStatus, type SisErgebnis,
} from './pruefung';
import { bewerteMitClaude, type KiRueckmeldung } from './claude';

type Abschnitt = 'B' | 'TF' | 'matrix';
interface Entwurf { felder: Felder; matrix: Matrix }

const ENTWURF_KEY = 'lernstoff.sis.entwuerfe';
const BESTE_KEY = 'lernstoff.sis.beste';

function lese<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback; } catch { return fallback; }
}
function schreibe(key: string, wert: unknown) {
  try { localStorage.setItem(key, JSON.stringify(wert)); } catch { /* privater Modus */ }
}
function ladeEntwurf(id: string): Entwurf {
  const e = lese<Record<string, Partial<Entwurf>>>(ENTWURF_KEY, {})[id];
  // Ältere oder beschädigte Entwürfe auffüllen statt abzustürzen
  return { felder: { ...leereFelder(), ...(e?.felder ?? {}) }, matrix: { ...leereMatrix(), ...(e?.matrix ?? {}) } };
}
function speichereEntwurf(id: string, e: Entwurf | null) {
  const alle = lese<Record<string, Entwurf>>(ENTWURF_KEY, {});
  if (e) alle[id] = e; else delete alle[id];
  schreibe(ENTWURF_KEY, alle);
}
function merkeBeste(fallId: string, prozent: number): Record<string, number> {
  const alt = lese<Record<string, number>>(BESTE_KEY, {});
  const neu = { ...alt, [fallId]: Math.max(alt[fallId] ?? 0, prozent) };
  schreibe(BESTE_KEY, neu);
  return neu;
}

const istLeer = (e: Entwurf) => FELDER.every((f) => !e.felder[f].trim()) && RISIKEN.every((r) => !e.matrix[r].vorhanden && !e.matrix[r].weitere);

const PUNKT_ZEICHEN: Record<PunktStatus, string> = { ok: '✓', 'falsches-feld': '↔', fehlt: '✗' };
const FELD_STATUS: Record<FeldStatus, string> = { vollstaendig: 'vollständig', teilweise: 'teilweise', fehlt: 'fehlt' };
const feldName = (f: Feld) => (f === 'B' ? 'Feld B' : `Themenfeld ${FELD_KURZ[f]}`);
const loesungText = (l: Loesung) => (l === 'beides' ? 'ja oder nein' : l);

function Fallkarte({ fall }: { fall: SisFall }) {
  return (
    <div className="card sis__fall">
      <div className="sis__kopf">
        <span className="badge badge--demo">{SETTING_LABEL[fall.setting]}</span>
      </div>
      <h3>{fall.titel}</h3>
      <p className="muted">{fall.anlass}</p>
      <dl className="sis__daten">
        {fall.person.map((d) => <div key={d.label}><dt>{d.label}</dt><dd>{d.wert}</dd></div>)}
      </dl>
      <details open className="sis__block">
        <summary>Erstgespräch</summary>
        <ul className="sis__gespraech">
          {fall.gespraech.map((a, i) => <li key={i}><span className="sis__wer">{a.wer}</span> „{a.text}“</li>)}
        </ul>
      </details>
      <details open className="sis__block">
        <summary>Deine Beobachtungen</summary>
        <ul>{fall.beobachtungen.map((b) => <li key={b}>{b}</li>)}</ul>
      </details>
      <details className="sis__block">
        <summary>Unterlagen</summary>
        <dl className="sis__daten">
          {fall.unterlagen.map((d) => <div key={d.label}><dt>{d.label}</dt><dd>{d.wert}</dd></div>)}
        </dl>
      </details>
      <p className="muted">Erfundener Übungsfall. Bitte keine echten Personendaten eingeben.</p>
    </div>
  );
}

function JaNeinWahl({ label, wert, onChange }: { label: string; wert?: JaNein; onChange: (v: JaNein) => void }) {
  return (
    <div className="sis__janein">
      <span className="sis__frage">{label}</span>
      <div className="pills" role="group" aria-label={label}>
        <button type="button" className="pill" aria-pressed={wert === 'ja'} onClick={() => onChange('ja')}>ja</button>
        <button type="button" className="pill" aria-pressed={wert === 'nein'} onClick={() => onChange('nein')}>nein</button>
      </div>
    </div>
  );
}

function MatrixKarte({ risiko, e, onChange }: { risiko: Risiko; e: MatrixEingabe; onChange: (e: MatrixEingabe) => void }) {
  const toggle = (t: Themenfeld) => onChange({ ...e, themenfelder: e.themenfelder.includes(t) ? e.themenfelder.filter((x) => x !== t) : [...e.themenfelder, t].sort() });
  return (
    <fieldset className={`sis__risiko${e.vorhanden && e.weitere ? ' is-fertig' : ''}`}>
      <legend>{RISIKO_LABEL[risiko]}</legend>
      {risiko === 'sonstiges' && e.vorhanden === 'ja' && (
        <label className="field sis__welches">
          <span className="muted">Welches Risiko?</span>
          <input value={e.welches} onChange={(x) => onChange({ ...e, welches: x.target.value })} placeholder="z. B. Kontrakturen" />
        </label>
      )}
      <JaNeinWahl label="Risiko vorhanden?" wert={e.vorhanden}
        onChange={(v) => onChange({ ...e, vorhanden: v, themenfelder: v === 'nein' ? [] : e.themenfelder })} />
      <JaNeinWahl label="Weitere Einschätzung notwendig?" wert={e.weitere} onChange={(v) => onChange({ ...e, weitere: v })} />
      {e.vorhanden === 'ja' && (
        <div className="sis__janein">
          <span className="sis__frage">Zeigt sich in Themenfeld</span>
          <div className="pills" role="group" aria-label={`${RISIKO_LABEL[risiko]}: Themenfelder`}>
            {MATRIX_FELDER.map((t) => (
              <button key={t} type="button" className="pill" aria-pressed={e.themenfelder.includes(t)} onClick={() => toggle(t)}>{FELD_KURZ[t]}</button>
            ))}
          </div>
        </div>
      )}
    </fieldset>
  );
}

function MatrixZeileErgebnis({ m }: { m: MatrixErgebnis }) {
  const deine = m.eingabe.vorhanden
    ? `${m.eingabe.vorhanden}${m.eingabe.vorhanden === 'ja' && m.eingabe.themenfelder.length ? ` (TF ${m.eingabe.themenfelder.map((t) => FELD_KURZ[t]).join(', ')})` : ''}, weitere ${m.eingabe.weitere ?? 'offen'}`
    : 'offen';
  const z = m.zeile;
  return (
    <tr className={`is-${m.status}`}>
      <th scope="row">{RISIKO_LABEL[z.risiko]}{z.risiko === 'sonstiges' && m.eingabe.welches.trim() ? `: ${m.eingabe.welches.trim()}` : ''}</th>
      <td>{deine}</td>
      <td>
        <strong>{loesungText(z.vorhanden)}</strong>
        {z.vorhanden !== 'nein' && z.themenfelder.length > 0 && ` (TF ${z.themenfelder.filter((t) => MATRIX_FELDER.includes(t)).map((t) => FELD_KURZ[t]).join(', ')})`}
        , weitere {loesungText(z.weitere)}
        <span className="sis__begruendung">{z.begruendung}</span>
      </td>
      <td className="sis__punkte">{m.punkte}/{m.max}</td>
    </tr>
  );
}

function Ergebnis({ e, fall }: { e: SisErgebnis; fall: SisFall }) {
  const stufe = e.prozent >= 85 ? 'gut' : e.prozent >= 60 ? 'mittel' : 'schwach';
  return (
    <div className="card sis__ergebnis" aria-live="polite">
      <div className="sis__kopf">
        <h3>Checkliste: {e.prozent} %</h3>
        <span className="muted">Texte {e.textProzent} % · Risikomatrix {e.matrixProzent} %</span>
      </div>
      <div className={`sis__balken sis__balken--${stufe}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.prozent}>
        <span style={{ width: `${e.prozent}%` }} />
      </div>
      {e.hinweise.map((h) => <div key={h} className="note warn">{h}</div>)}
      <div className="sis__felder">
        {e.felder.map((f) => (
          <section key={f.feld} className={`sis__feldergebnis is-${f.status}`}>
            <h4><span className="sis__nr">{FELD_KURZ[f.feld]}</span> {f.feld === 'B' ? 'Eigeneinschätzung (Feld B)' : feldLabel(f.feld, fall.setting)} <span className="muted">· {FELD_STATUS[f.status]}</span></h4>
            <ul>
              {f.punkte.map((p) => (
                <li key={p.punkt.id} className={`is-${p.status}`}>
                  <span className="sis__zeichen" aria-hidden="true">{PUNKT_ZEICHEN[p.status]}</span>
                  <span>
                    {p.punkt.text}
                    {!p.punkt.pflicht && <span className="muted"> (optional)</span>}
                    {p.status === 'falsches-feld' && <span className="muted"> · steht bei {feldName(p.gefundenIn!)}</span>}
                    <span className="visually-hidden">: {p.status === 'ok' ? 'erfüllt' : p.status === 'fehlt' ? 'fehlt' : 'im falschen Feld'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <h4>Risikomatrix</h4>
      <div className="sis__tabelle">
        <table>
          <thead><tr><th scope="col">Risiko</th><th scope="col">Deine Einschätzung</th><th scope="col">Lösung und Begründung</th><th scope="col">Punkte</th></tr></thead>
          <tbody>{e.matrix.map((m) => <MatrixZeileErgebnis key={m.zeile.risiko} m={m} />)}</tbody>
        </table>
      </div>
      <p className="muted">Die Checkliste sucht nach Stichworten. Sie erkennt nicht jede Formulierung und prüft nicht, ob eine Aussage stimmt. Die Risikoeinschätzung ist eine fachliche Entscheidung: Eine gut begründete Abweichung kann richtig sein.</p>
    </div>
  );
}

function KiErgebnis({ r }: { r: KiRueckmeldung }) {
  return (
    <div className="card sis__ki" aria-live="polite">
      <div className="sis__kopf"><h3>Rückmeldung von Claude</h3><span className="sis__note">Note {r.note}</span></div>
      {r.perspektive && <div className="note"><strong>Sicht der Person</strong><p>{r.perspektive}</p></div>}
      <div className="sis__felder">
        {r.felder.map((f) => (
          <section key={f.feld} className={`sis__feldergebnis is-${f.bewertung}`}>
            <h4><span className="sis__nr">{FELD_KURZ[f.feld]}</span> {feldName(f.feld)} <span className="muted">· {FELD_STATUS[f.bewertung]}</span></h4>
            {f.kommentar && <p>{f.kommentar}</p>}
          </section>
        ))}
      </div>
      {r.matrix && <div className="note"><strong>Risikomatrix</strong><p>{r.matrix}</p></div>}
      {r.fehler.length > 0 && <div className="note warn"><strong>Passt nicht zum Fall</strong><ul>{r.fehler.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.fehlt.length > 0 && <div className="note"><strong>Fehlt noch</strong><ul>{r.fehlt.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.staerken.length > 0 && <div className="note ok"><strong>Gut gemacht</strong><ul>{r.staerken.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      <p className="muted">KI-Rückmeldung, kann sich irren. Maßgeblich sind Praxisanleitung und Hausstandard.</p>
    </div>
  );
}

export default function SisTrainer() {
  const wunsch = useRoute().params.get('fall') ?? '';
  const [fallId, setFallId] = useState(() => (SIS_FAELLE.some((f) => f.id === wunsch) ? wunsch : SIS_FAELLE[0]!.id));
  const [entwurf, setEntwurf] = useState<Entwurf>(() => ladeEntwurf(fallId));
  const [abschnitt, setAbschnitt] = useState<Abschnitt>('B');
  const [ergebnis, setErgebnis] = useState<SisErgebnis | null>(null);
  const [ki, setKi] = useState<KiRueckmeldung | null>(null);
  const [kiLaeuft, setKiLaeuft] = useState(false);
  const [kiFehler, setKiFehler] = useState('');
  const [beste, setBeste] = useState(() => lese<Record<string, number>>(BESTE_KEY, {}));
  const [hilfe, setHilfe] = useState(false);
  const ergebnisRef = useRef<HTMLDivElement>(null);
  const eingabeRef = useRef<HTMLFormElement>(null);
  const lernplan = useLernplanUebernahme('sis');
  const apiKey = getApiKey();

  const fall = SIS_FAELLE.find((f) => f.id === fallId)!;
  const { felder, matrix } = entwurf;

  // Link mit ?fall= (z. B. aus dem Lernplan) wechselt den Fall
  useEffect(() => {
    if (wunsch && wunsch !== fallId && SIS_FAELLE.some((f) => f.id === wunsch)) waehleFall(wunsch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wunsch]);

  useEffect(() => { speichereEntwurf(fallId, istLeer(entwurf) ? null : entwurf); }, [fallId, entwurf]);

  const live = useMemo(() => pruefeSis(fall, felder, matrix), [fall, felder, matrix]);
  const tfGefuellt = THEMENFELDER.filter((t) => felder[t].trim()).length;
  const matrixFertig = RISIKEN.filter((r) => matrix[r].vorhanden && matrix[r].weitere).length;

  function zuruecksetzen() { setErgebnis(null); setKi(null); setKiFehler(''); lernplan.zuruecksetzen(); }

  function waehleFall(id: string) {
    setFallId(id); setEntwurf(ladeEntwurf(id)); setAbschnitt('B'); zuruecksetzen();
  }

  function setzeFeld(f: Feld, text: string) { setEntwurf((e) => ({ ...e, felder: { ...e.felder, [f]: text } })); zuruecksetzen(); }
  function setzeRisiko(r: Risiko, m: MatrixEingabe) { setEntwurf((e) => ({ ...e, matrix: { ...e.matrix, [r]: m } })); zuruecksetzen(); }

  function wechsle(a: Abschnitt) {
    setAbschnitt(a);
    requestAnimationFrame(() => eingabeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function pruefen() {
    const e = pruefeSis(fall, felder, matrix);
    setErgebnis(e); setKi(null); setKiFehler('');
    setBeste(merkeBeste(fall.id, e.prozent));
    // Ins Lernplan-Thema „Strukturmodell und SIS“, aber erst als vollständige SIS: Wer nur kurz
    // nachsieht, soll sich nicht den ersten Versuch des Tages verderben (der zählt allein).
    if (vollstaendig) lernplan.uebernimm([{ topicId: SIS_THEMA, scorePercent: e.prozent, anzahl: 1 }]);
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 85 ? 'info' : 'warning',
      title: `SIS: ${fall.titel} ${e.prozent} %`,
      detail: e.pflichtFehlend.length ? `Fehlt: ${e.pflichtFehlend.slice(0, 5).map((p) => p.text).join('; ')}${e.pflichtFehlend.length > 5 ? ' …' : ''}` : 'Alle Pflichtpunkte enthalten',
    });
    requestAnimationFrame(() => ergebnisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function fragClaude() {
    setKiLaeuft(true); setKiFehler('');
    try { setKi(await bewerteMitClaude({ apiKey, fall, felder, matrix })); }
    catch (err) { setKiFehler(err instanceof Error ? err.message : String(err)); }
    finally { setKiLaeuft(false); }
  }

  function neuBeginnen() {
    if (!istLeer(entwurf) && !confirm('Eingaben zu diesem Fall löschen und neu beginnen?')) return;
    setEntwurf({ felder: leereFelder(), matrix: leereMatrix() }); setAbschnitt('B'); zuruecksetzen();
  }

  function naechsterFall() {
    const i = SIS_FAELLE.findIndex((f) => f.id === fallId);
    waehleFall(SIS_FAELLE[(i + 1) % SIS_FAELLE.length]!.id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const leer = istLeer(entwurf);
  const vollstaendig = FELDER.every((f) => felder[f].trim()) && matrixFertig === RISIKEN.length;
  const status = (f: Feld) => live.felder.find((x) => x.feld === f)!.status;

  return (
    <section className="page sis">
      <div className="page__head">
        <h2>SIS-Trainer</h2>
        <p className="muted">Strukturierte Informationssammlung nach dem Strukturmodell: Lies das Erstgespräch, dann fülle Feld B, die sechs Themenfelder und die Risikomatrix aus. Die Checkliste prüft offline, eine ausführliche Rückmeldung gibt es optional von Claude.</p>
      </div>

      <div className="card sis__auswahl">
        <label className="field">
          <span className="muted">Fall</span>
          <select value={fallId} onChange={(e) => waehleFall(e.target.value)}>
            {SIS_FAELLE.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titel} · {SETTING_LABEL[f.setting]}{beste[f.id] !== undefined ? ` · bisher ${beste[f.id]} %` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <button type="button" className="ghost small" onClick={() => setHilfe((x) => !x)} aria-expanded={hilfe}>Wie ist die SIS aufgebaut?</button>
          <button type="button" className="ghost small" onClick={neuBeginnen} disabled={leer}>Neu beginnen</button>
        </div>
        {hilfe && (
          <div className="sis__hilfe">
            <p><strong>Feld A</strong> Name, Datum, wer am Gespräch beteiligt war (im Fall vorgegeben).</p>
            <p><strong>Feld B</strong> Was bewegt die Person, was braucht sie, was können wir tun? In ihren eigenen Worten.</p>
            <p><strong>Feld C1, Themenfelder 1 bis 6</strong> Je Themenfeld: Sicht der Person, deine fachliche Einschätzung (auch Ressourcen) und was ihr gemeinsam vereinbart habt.</p>
            <p><strong>Feld C2, Risikomatrix</strong> Je Risiko: Liegt es vor? Ist eine weitere Einschätzung (z. B. ein Assessment) nötig? In welchem Themenfeld zeigt es sich?</p>
            <p className="muted">Hausversionen weichen in Details ab. Maßgeblich ist das Formular deiner Einrichtung.</p>
          </div>
        )}
      </div>

      <div className="sis__layout">
        <Fallkarte fall={fall} />

        <form ref={eingabeRef} className="card sis__eingabe" onSubmit={(e) => { e.preventDefault(); pruefen(); }}>
          <div className="pills sis__abschnitte" role="tablist" aria-label="Teil der SIS">
            <button type="button" role="tab" className="pill" aria-selected={abschnitt === 'B'} aria-pressed={abschnitt === 'B'} onClick={() => wechsle('B')}>
              Feld B {felder.B.trim() ? '✓' : ''}
            </button>
            <button type="button" role="tab" className="pill" aria-selected={abschnitt === 'TF'} aria-pressed={abschnitt === 'TF'} onClick={() => wechsle('TF')}>
              Themenfelder {tfGefuellt}/6
            </button>
            <button type="button" role="tab" className="pill" aria-selected={abschnitt === 'matrix'} aria-pressed={abschnitt === 'matrix'} onClick={() => wechsle('matrix')}>
              Risikomatrix {matrixFertig}/6
            </button>
          </div>

          {abschnitt === 'B' && (
            <div role="tabpanel" className="sis__panel">
              <label className="sis__feld">
                <span className="sis__feldkopf"><span className="sis__nr">B</span> {feldLabel('B', fall.setting)}</span>
                <textarea rows={6} value={felder.B} placeholder={feldHilfe('B', fall.setting)} onChange={(e) => setzeFeld('B', e.target.value)} />
              </label>
              <div className="row"><span /><button type="button" onClick={() => wechsle('TF')}>Weiter zu den Themenfeldern</button></div>
            </div>
          )}

          {abschnitt === 'TF' && (
            <div role="tabpanel" className="sis__panel">
              {THEMENFELDER.map((t) => (
                <label key={t} className="sis__feld">
                  <span className="sis__feldkopf">
                    <span className="sis__nr">{FELD_KURZ[t]}</span> {feldLabel(t, fall.setting)}
                    {felder[t].trim() && <span className={`sis__live is-${status(t)}`}>{FELD_STATUS[status(t)]}</span>}
                  </span>
                  <textarea rows={4} value={felder[t]} placeholder={feldHilfe(t, fall.setting)} onChange={(e) => setzeFeld(t, e.target.value)} />
                </label>
              ))}
              <div className="row"><button type="button" className="ghost" onClick={() => wechsle('B')}>Zurück zu Feld B</button><button type="button" onClick={() => wechsle('matrix')}>Weiter zur Risikomatrix</button></div>
            </div>
          )}

          {abschnitt === 'matrix' && (
            <div role="tabpanel" className="sis__panel">
              <p className="muted">Für jedes Risiko angeben, ob es vorliegt und ob eine weitere fachliche Einschätzung notwendig ist. Bei „ja“ die Themenfelder 1 bis 5 wählen, in denen es sich zeigt.</p>
              <div className="sis__matrix">
                {RISIKEN.map((r) => <MatrixKarte key={r} risiko={r} e={matrix[r]} onChange={(m) => setzeRisiko(r, m)} />)}
              </div>
            </div>
          )}

          <div className="row sis__knoepfe">
            <button type="submit" className="primary" disabled={leer}>Prüfen</button>
            <span className="muted">Dein Entwurf bleibt auf diesem Gerät gespeichert.</span>
          </div>
        </form>
      </div>

      <div ref={ergebnisRef} className="sis__auswertung">
        {ergebnis && (
          <>
            <Ergebnis e={ergebnis} fall={fall} />
            {lernplan.uebernahme || lernplan.fehler
              ? <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
              : <p className="muted">Für den Lernplan zählt die SIS, sobald Feld B, alle sechs Themenfelder und die ganze Risikomatrix ausgefüllt sind.</p>}
            <div className="card">
              <div className="row">
                {apiKey
                  ? <button type="button" className="primary" onClick={fragClaude} disabled={kiLaeuft}>{kiLaeuft ? 'Claude liest …' : ki ? 'Noch einmal bewerten' : 'Ausführliche Rückmeldung von Claude'}</button>
                  : <p className="muted">Für eine ausführliche Rückmeldung (Sicht der Person, fachliche Richtigkeit) einen API-Schlüssel hinterlegen. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>}
                <button type="button" onClick={naechsterFall}>Nächster Fall</button>
              </div>
              {apiKey && !ki && !kiLaeuft && <p className="muted">Gesendet werden nur der Übungsfall und deine SIS.</p>}
              {kiFehler && <div className="note warn" role="alert">{kiFehler}</div>}
              <details>
                <summary>Beispiel-SIS ansehen</summary>
                <dl className="sis__muster">
                  {FELDER.map((f) => (
                    <div key={f}><dt><span className="sis__nr">{FELD_KURZ[f]}</span> {f === 'B' ? 'Feld B' : feldLabel(f, fall.setting)}</dt><dd>{fall.muster[f]}</dd></div>
                  ))}
                </dl>
              </details>
            </div>
            {ki && <KiErgebnis r={ki} />}
          </>
        )}
      </div>
    </section>
  );
}
