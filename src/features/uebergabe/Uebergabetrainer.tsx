import { storage } from '../../ui/lib/store';
import { useMemo, useRef, useState } from 'react';
import './uebergabe.css';
import { logActivity } from '../../core/activity';
import { UEBERGABE_THEMA } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import { getApiKey } from '../../core/settings';
import { navigate } from '../../ui/shell/router';
import { ANLASS_LABEL, FAELLE, TEIL_HILFE, TEIL_LABEL, type Fall, type Teil } from './faelle';
import { dauer, pruefe, TEILE, type Pruefergebnis, type PunktStatus, type TeilStatus } from './pruefung';
import { bewerteMitClaude, type KiRueckmeldung } from './claude';
import { useDiktat } from './diktat';

type Modus = 'gefuehrt' | 'frei';
type Felder = Record<Teil, string>;
const LEER: Felder = { S: '', B: '', A: '', R: '' };
const BESTE_KEY = 'lernstoff.uebergabe.beste';

function ladeBeste(): Record<string, number> {
  return storage.read<Record<string, number>>(BESTE_KEY, {});
}
function merkeBeste(fallId: string, prozent: number): Record<string, number> {
  const alt = ladeBeste();
  const neu = { ...alt, [fallId]: Math.max(alt[fallId] ?? 0, prozent) };
  storage.write(BESTE_KEY, neu);
  return neu;
}

const PUNKT_ZEICHEN: Record<PunktStatus, string> = { ok: '✓', 'falscher-teil': '↔', fehlt: '✗' };
const TEIL_STATUS: Record<TeilStatus, string> = { vollstaendig: 'vollständig', teilweise: 'teilweise', fehlt: 'fehlt' };

function Fallkarte({ fall }: { fall: Fall }) {
  return (
    <div className="card sbar__fall">
      <div className="sbar__kopf">
        <span className={`badge badge--demo sbar__anlass sbar__anlass--${fall.anlass}`}>{ANLASS_LABEL[fall.anlass]}</span>
        <span className="muted">{fall.bereich}</span>
      </div>
      <h3>{fall.titel}</h3>
      <p className="sbar__lage">{fall.lage}</p>
      <dl className="sbar__daten">
        <div><dt>Du bist</dt><dd>{fall.rolle}</dd></div>
        <div><dt>Übergabe an</dt><dd>{fall.empfaenger}</dd></div>
        {fall.daten.map((d) => <div key={d.label}><dt>{d.label}</dt><dd>{d.wert}</dd></div>)}
      </dl>
      <p className="muted">Erfundener Übungsfall. Bitte keine echten Patientendaten eingeben.</p>
    </div>
  );
}

function Ergebnis({ e }: { e: Pruefergebnis }) {
  const stufe = e.prozent >= 85 ? 'gut' : e.prozent >= 60 ? 'mittel' : 'schwach';
  return (
    <div className="card sbar__ergebnis" aria-live="polite">
      <div className="sbar__kopf">
        <h3>Checkliste: {e.prozent} %</h3>
        <span className="muted">{e.woerter} Wörter · gesprochen etwa {dauer(e.sekunden)}</span>
      </div>
      <div className={`sbar__balken sbar__balken--${stufe}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.prozent}>
        <span style={{ width: `${e.prozent}%` }} />
      </div>
      <div className="sbar__teile">
        {e.teile.map((t) => (
          <section key={t.teil} className={`sbar__teil is-${t.status}`}>
            <h4><span className="sbar__buchstabe">{t.teil}</span> {TEIL_LABEL[t.teil]} <span className="muted">· {TEIL_STATUS[t.status]}</span></h4>
            <ul>
              {t.punkte.map((p) => (
                <li key={p.punkt.id} className={`is-${p.status}`}>
                  <span className="sbar__zeichen" aria-hidden="true">{PUNKT_ZEICHEN[p.status]}</span>
                  <span>
                    {p.punkt.text}
                    {!p.punkt.pflicht && <span className="muted"> (optional)</span>}
                    {p.status === 'falscher-teil' && <span className="muted"> · steht bei {TEIL_LABEL[p.gefundenIn!]}</span>}
                    <span className="visually-hidden">: {p.status === 'ok' ? 'erfüllt' : p.status === 'fehlt' ? 'fehlt' : 'im falschen Teil'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {e.hinweise.map((h) => <div key={h} className="note warn">{h}</div>)}
      <p className="muted">Die Checkliste sucht nach Stichworten und Zahlen. Sie erkennt nicht jede Formulierung und prüft nicht, ob eine Angabe stimmt. Dafür gibt es die Rückmeldung von Claude.</p>
    </div>
  );
}

function KiErgebnis({ r }: { r: KiRueckmeldung }) {
  return (
    <div className="card sbar__ki" aria-live="polite">
      <div className="sbar__kopf"><h3>Rückmeldung von Claude</h3><span className="sbar__note">Note {r.note}</span></div>
      <div className="sbar__teile">
        {r.teile.map((t) => (
          <section key={t.teil} className={`sbar__teil is-${t.bewertung}`}>
            <h4><span className="sbar__buchstabe">{t.teil}</span> {TEIL_LABEL[t.teil]} <span className="muted">· {TEIL_STATUS[t.bewertung]}</span></h4>
            {t.kommentar && <p>{t.kommentar}</p>}
          </section>
        ))}
      </div>
      {r.fehler.length > 0 && <div className="note warn"><strong>Stimmt nicht mit dem Fall überein</strong><ul>{r.fehler.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.fehlt.length > 0 && <div className="note"><strong>Fehlt noch</strong><ul>{r.fehlt.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.staerken.length > 0 && <div className="note ok"><strong>Gut gemacht</strong><ul>{r.staerken.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.verbessert && <details open><summary>Überarbeitete Übergabe</summary><p className="pre sbar__muster">{r.verbessert}</p></details>}
      <p className="muted">KI-Rückmeldung, kann sich irren. Maßgeblich sind Praxisanleitung und Hausstandard.</p>
    </div>
  );
}

export default function Uebergabetrainer() {
  const [fallId, setFallId] = useState(FAELLE[0]!.id);
  const [modus, setModus] = useState<Modus>('gefuehrt');
  const [felder, setFelder] = useState<Felder>(LEER);
  const [frei, setFrei] = useState('');
  const [fokus, setFokus] = useState<Teil | 'frei'>('S');
  const [ergebnis, setErgebnis] = useState<Pruefergebnis | null>(null);
  const [ki, setKi] = useState<KiRueckmeldung | null>(null);
  const [kiLaeuft, setKiLaeuft] = useState(false);
  const [kiFehler, setKiFehler] = useState('');
  const [beste, setBeste] = useState(ladeBeste);
  const [hilfe, setHilfe] = useState(false);
  const ergebnisRef = useRef<HTMLDivElement>(null);
  const lernplan = useLernplanUebernahme('uebergabe');
  const apiKey = getApiKey();

  const fall = FAELLE.find((f) => f.id === fallId)!;
  const text = modus === 'frei' ? frei : TEILE.filter((t) => felder[t].trim()).map((t) => `${t}: ${felder[t].trim()}`).join('\n');
  const live = useMemo(() => pruefe(fall, text), [fall, text]);

  const diktat = useDiktat((stueck) => {
    const ziel = modus === 'frei' ? 'frei' : fokus;
    const anhaengen = (alt: string) => (alt && !/\s$/.test(alt) ? `${alt} ${stueck}` : alt + stueck);
    if (ziel === 'frei') setFrei(anhaengen);
    else setFelder((f) => ({ ...f, [ziel]: anhaengen(f[ziel]) }));
    zuruecksetzen();
  });

  function zuruecksetzen() { setErgebnis(null); setKi(null); setKiFehler(''); lernplan.zuruecksetzen(); }

  function waehleFall(id: string) {
    diktat.stop();
    setFallId(id); setFelder(LEER); setFrei(''); setFokus(modus === 'frei' ? 'frei' : 'S'); zuruecksetzen();
  }

  function wechsleModus(m: Modus) {
    if (m === modus) return;
    // Text mitnehmen: geführt → frei als „S: …“-Zeilen, frei → geführt bleibt leer, wenn nicht gegliedert
    if (m === 'frei') { setFrei(text); setFokus('frei'); }
    else { setFokus('S'); }
    setModus(m); zuruecksetzen();
  }

  function pruefen() {
    diktat.stop();
    const e = pruefe(fall, text);
    setErgebnis(e); setKi(null); setKiFehler('');
    setBeste(merkeBeste(fall.id, e.prozent));
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 85 ? 'info' : 'warning',
      title: `SBAR-Übergabe: ${fall.titel} ${e.prozent} %`,
      detail: e.pflichtFehlend.length ? `Fehlt: ${e.pflichtFehlend.map((p) => p.text).join('; ')}` : 'Alle Pflichtpunkte enthalten',
    });
    // Übergabe nach SBAR ist ein eigenes Katalogthema; der erste Versuch des Tages zählt
    lernplan.uebernimm([{ topicId: UEBERGABE_THEMA, scorePercent: e.prozent, anzahl: 1 }]);
    requestAnimationFrame(() => ergebnisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function fragClaude() {
    setKiLaeuft(true); setKiFehler('');
    try { setKi(await bewerteMitClaude({ apiKey, fall, uebergabe: text })); }
    catch (err) { setKiFehler(err instanceof Error ? err.message : String(err)); }
    finally { setKiLaeuft(false); }
  }

  function zufall() {
    const andere = FAELLE.filter((f) => f.id !== fallId);
    waehleFall(andere[Math.floor(Math.random() * andere.length)]!.id);
  }

  const leer = !text.trim();

  return (
    <section className="page sbar">
      <div className="page__head">
        <h2>Übergabe-Trainer (SBAR)</h2>
        <p className="muted">Lies den Fall, dann übergib ihn: tippen oder diktieren. Die Checkliste prüft offline, ob Situation, Hintergrund, Einschätzung und Empfehlung vollständig sind.</p>
      </div>

      <div className="card sbar__auswahl">
        <label className="field">
          <span className="muted">Fall</span>
          <select value={fallId} onChange={(e) => waehleFall(e.target.value)}>
            {FAELLE.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titel} · {ANLASS_LABEL[f.anlass]}{beste[f.id] !== undefined ? ` · bisher ${beste[f.id]} %` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <div className="pills" role="group" aria-label="Eingabe">
            <button type="button" className="pill" aria-pressed={modus === 'gefuehrt'} onClick={() => wechsleModus('gefuehrt')}>Geführt (4 Felder)</button>
            <button type="button" className="pill" aria-pressed={modus === 'frei'} onClick={() => wechsleModus('frei')}>Frei sprechen</button>
          </div>
          <div className="row sbar__aktionen">
            <button type="button" className="ghost small" onClick={() => setHilfe((x) => !x)} aria-expanded={hilfe}>Was ist SBAR?</button>
            <button type="button" className="ghost small" onClick={zufall}>Zufälliger Fall</button>
          </div>
        </div>
        {hilfe && (
          <dl className="sbar__hilfe">
            {TEILE.map((t) => <div key={t}><dt><span className="sbar__buchstabe">{t}</span> {TEIL_LABEL[t]}</dt><dd>{TEIL_HILFE[t]}</dd></div>)}
          </dl>
        )}
      </div>

      <div className="sbar__layout">
        <Fallkarte fall={fall} />

        <form className="card sbar__eingabe" onSubmit={(e) => { e.preventDefault(); pruefen(); }}>
          <div className="sbar__kopf">
            <h3>Deine Übergabe</h3>
            <span className="muted" aria-live="off">{live.woerter} Wörter · ca. {dauer(live.sekunden)}</span>
          </div>

          {modus === 'gefuehrt' ? TEILE.map((t) => {
            const st = live.teile.find((x) => x.teil === t)!.status;
            return (
              <label key={t} className={`sbar__feld${fokus === t ? ' is-fokus' : ''}`}>
                <span className="sbar__feldkopf">
                  <span className="sbar__buchstabe">{t}</span> {TEIL_LABEL[t]}
                  {felder[t].trim() && <span className={`sbar__live is-${st}`}>{TEIL_STATUS[st]}</span>}
                </span>
                <textarea rows={3} value={felder[t]} placeholder={TEIL_HILFE[t]} enterKeyHint="next"
                  onFocus={() => setFokus(t)}
                  onChange={(e) => { setFelder((f) => ({ ...f, [t]: e.target.value })); zuruecksetzen(); }} />
              </label>
            );
          }) : (
            <label className="sbar__feld">
              <span className="visually-hidden">Übergabe</span>
              <textarea rows={10} value={frei} onFocus={() => setFokus('frei')}
                placeholder={'S: Hier ist … Ich rufe an wegen …\nB: …\nA: …\nR: Bitte …'}
                onChange={(e) => { setFrei(e.target.value); zuruecksetzen(); }} />
            </label>
          )}

          {diktat.aktiv && (
            <div className="note sbar__hoeren" role="status">
              <span className="sbar__punkt" aria-hidden="true" /> Hört zu{modus === 'gefuehrt' ? ` (Feld ${TEIL_LABEL[fokus as Teil]})` : ''} … {diktat.zwischen && <em>{diktat.zwischen}</em>}
            </div>
          )}
          {diktat.fehler && <div className="note warn" role="alert">{diktat.fehler}</div>}

          <div className="row sbar__knoepfe">
            <button type="submit" className="primary" disabled={leer}>Prüfen</button>
            {diktat.moeglich && (
              <button type="button" className={diktat.aktiv ? 'danger' : undefined} aria-pressed={diktat.aktiv}
                onClick={() => (diktat.aktiv ? diktat.stop() : diktat.start())}>
                {diktat.aktiv ? 'Diktat beenden' : 'Sprechen'}
              </button>
            )}
            <button type="button" className="ghost" disabled={leer} onClick={() => { setFelder(LEER); setFrei(''); zuruecksetzen(); }}>Leeren</button>
          </div>
          <p className="muted">
            {diktat.moeglich
              ? 'Sprechen nutzt die Spracherkennung des Geräts. Alternativ: Mikrofon-Taste auf der Tastatur.'
              : 'Diktieren: Tippe ins Feld und dann auf das Mikrofon der Tastatur.'}
            {modus === 'frei' && ' Sag oder schreib „S:“, „B:“, „A:“, „R:“ vor jedem Teil, dann prüft der Trainer auch die Zuordnung.'}
          </p>
        </form>
      </div>

      <div ref={ergebnisRef} className="sbar__auswertung">
        {ergebnis && (
          <>
            <Ergebnis e={ergebnis} />
            <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
            <div className="card">
              <div className="row">
                {apiKey
                  ? <button type="button" className="primary" onClick={fragClaude} disabled={kiLaeuft}>{kiLaeuft ? 'Claude liest …' : ki ? 'Noch einmal bewerten' : 'Ausführliche Rückmeldung von Claude'}</button>
                  : <p className="muted">Für eine ausführliche Rückmeldung (prüft auch, ob deine Werte stimmen) einen API-Schlüssel hinterlegen. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>}
                <button type="button" onClick={zufall}>Nächster Fall</button>
              </div>
              {apiKey && !ki && !kiLaeuft && <p className="muted">Gesendet werden nur der Übungsfall und dein Text.</p>}
              {kiFehler && <div className="note warn" role="alert">{kiFehler}</div>}
              <details>
                <summary>Beispiel-Übergabe ansehen</summary>
                <p className="pre sbar__muster">{fall.muster}</p>
              </details>
            </div>
            {ki && <KiErgebnis r={ki} />}
          </>
        )}
      </div>
    </section>
  );
}
