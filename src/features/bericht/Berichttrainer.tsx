import { storage } from '../../ui/lib/store';
import { useEffect, useRef, useState } from 'react';
import './bericht.css';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { navigate, useRoute } from '../../ui/shell/router';
import { BERICHT_THEMA } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import { useDiktat } from '../uebergabe/diktat';
import { BAUSTEIN_KURZ, BAUSTEIN_LABEL, BAUSTEINE, BERICHT_FAELLE, BEREICH_LABEL, type BerichtFall } from './faelle';
import { markiere, pruefeBericht, sprachpruefung, type BerichtErgebnis, type FundArt } from './pruefung';
import { bewerteMitClaude, type KiRueckmeldung } from './claude';

const ENTWURF_KEY = 'lernstoff.bericht.entwuerfe';
const BESTE_KEY = 'lernstoff.bericht.beste';
/** Ab so vielen Wörtern zählt ein Eintrag als Abfrage im Lernplan. */
const MIN_WOERTER_LERNPLAN = 15;

const lese = <T,>(key: string, fallback: T) => storage.read<T>(key, fallback);
const schreibe = (key: string, wert: unknown) => { storage.write(key, wert); };
const ladeEntwurf = (id: string) => {
  const e = lese<Record<string, unknown>>(ENTWURF_KEY, {})[id];
  return typeof e === 'string' ? e : '';
};
function speichereEntwurf(id: string, text: string) {
  const alle = lese<Record<string, string>>(ENTWURF_KEY, {});
  if (text.trim()) alle[id] = text; else delete alle[id];
  schreibe(ENTWURF_KEY, alle);
}

const FUND_LABEL: Record<FundArt, string> = { wertend: 'wertend', vage: 'ungenau', vermutung: 'Vermutung' };

function Markiert({ text }: { text: string }) {
  return (
    <>
      {markiere(text, sprachpruefung(text)).map((s, i) => (s.fund
        ? <mark key={i} className={`bericht__fund is-${s.fund.art}`} title={FUND_LABEL[s.fund.art]}>{s.text}<span className="visually-hidden"> ({FUND_LABEL[s.fund.art]})</span></mark>
        : <span key={i}>{s.text}</span>))}
    </>
  );
}

function Fallkarte({ fall }: { fall: BerichtFall }) {
  return (
    <div className="card bericht__fall">
      <div className="bericht__kopf">
        <span className="badge badge--demo">{BEREICH_LABEL[fall.bereich]}</span>
        <span className="muted">{fall.art === 'umschreiben' ? 'Eintrag sachlich neu schreiben' : 'Eintrag schreiben'}</span>
      </div>
      <h3>{fall.titel}</h3>
      <p className="muted">{fall.person}</p>
      <h4>Was passiert ist</h4>
      <ol className="bericht__szene">{fall.szene.map((s) => <li key={s}>{s}</li>)}</ol>
      {fall.vorlage && (
        <div className="bericht__vorlage">
          <h4>So steht es bisher im Bericht</h4>
          <p><Markiert text={fall.vorlage} /></p>
          <p className="muted">Markiert: <mark className="bericht__fund is-wertend">wertend</mark> <mark className="bericht__fund is-vage">ungenau</mark> <mark className="bericht__fund is-vermutung">Vermutung</mark></p>
        </div>
      )}
      <p className="muted">Erfundener Übungsfall. Bitte keine echten Personendaten eingeben.</p>
    </div>
  );
}

function Ergebnis({ e, text }: { e: BerichtErgebnis; text: string }) {
  const stufe = e.prozent >= 85 ? 'gut' : e.prozent >= 60 ? 'mittel' : 'schwach';
  return (
    <div className="card bericht__ergebnis" aria-live="polite">
      <div className="bericht__kopf">
        <h3>Checkliste: {e.prozent} %</h3>
        <span className="muted">{e.woerter} Wörter · {e.wertfrei ? 'sachlich' : 'enthält Wertungen'}</span>
      </div>
      <div className={`bericht__balken bericht__balken--${stufe}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.prozent}>
        <span style={{ width: `${e.prozent}%` }} />
      </div>
      <div className="bericht__deintext">
        <h4>Dein Eintrag</h4>
        <p className="pre"><Markiert text={text} /></p>
      </div>
      {e.hinweise.map((h) => <div key={h} className="note warn">{h}</div>)}
      <div className="bericht__bausteine">
        {e.bausteine.filter((b) => b.status !== 'leer').map((b) => (
          <section key={b.baustein} className={`bericht__baustein is-${b.status}`}>
            <h4>{BAUSTEIN_LABEL[b.baustein]}</h4>
            <ul>
              {b.punkte.map((p) => (
                <li key={p.punkt.id} className={p.ok ? 'is-ok' : 'is-fehlt'}>
                  <span className="bericht__zeichen" aria-hidden="true">{p.ok ? '✓' : '✗'}</span>
                  <span>{p.punkt.text}{!p.punkt.pflicht && <span className="muted"> (optional)</span>}<span className="visually-hidden">: {p.ok ? 'erfüllt' : 'fehlt'}</span></span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="muted">Die Checkliste sucht nach Stichworten und markiert typische Wertungen. Sie erkennt nicht jede Formulierung und prüft nicht, ob eine Angabe stimmt.</p>
    </div>
  );
}

function KiErgebnis({ r }: { r: KiRueckmeldung }) {
  return (
    <div className="card bericht__ki" aria-live="polite">
      <div className="bericht__kopf"><h3>Rückmeldung von Claude</h3><span className="bericht__note">Note {r.note}</span></div>
      {r.sachlich && <p>{r.sachlich}</p>}
      {r.umformulieren.length > 0 && (
        <div className="note"><strong>Besser so</strong>
          <ul className="bericht__umform">{r.umformulieren.map((u, i) => <li key={i}><s>{u.vorher}</s> → {u.nachher}</li>)}</ul>
        </div>
      )}
      {r.fehler.length > 0 && <div className="note warn"><strong>Passt nicht zur Situation</strong><ul>{r.fehler.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.fehlt.length > 0 && <div className="note"><strong>Fehlt noch</strong><ul>{r.fehlt.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.staerken.length > 0 && <div className="note ok"><strong>Gut gemacht</strong><ul>{r.staerken.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.verbessert && <details open><summary>Überarbeiteter Eintrag</summary><p className="pre bericht__muster">{r.verbessert}</p></details>}
      <p className="muted">KI-Rückmeldung, kann sich irren. Maßgeblich sind Praxisanleitung und Hausstandard.</p>
    </div>
  );
}

export default function Berichttrainer() {
  const wunsch = useRoute().params.get('fall') ?? '';
  const [fallId, setFallId] = useState(() => (BERICHT_FAELLE.some((f) => f.id === wunsch) ? wunsch : BERICHT_FAELLE[0]!.id));
  const [text, setText] = useState(() => ladeEntwurf(fallId));
  const [ergebnis, setErgebnis] = useState<BerichtErgebnis | null>(null);
  const [geprueft, setGeprueft] = useState('');
  const [ki, setKi] = useState<KiRueckmeldung | null>(null);
  const [kiLaeuft, setKiLaeuft] = useState(false);
  const [kiFehler, setKiFehler] = useState('');
  const [beste, setBeste] = useState(() => lese<Record<string, number>>(BESTE_KEY, {}));
  const [hilfe, setHilfe] = useState(false);
  const ergebnisRef = useRef<HTMLDivElement>(null);
  const lernplan = useLernplanUebernahme('bericht');
  const apiKey = getApiKey();
  const fall = BERICHT_FAELLE.find((f) => f.id === fallId)!;

  useEffect(() => {
    if (wunsch && wunsch !== fallId && BERICHT_FAELLE.some((f) => f.id === wunsch)) waehleFall(wunsch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wunsch]);
  useEffect(() => { speichereEntwurf(fallId, text); }, [fallId, text]);

  const diktat = useDiktat((stueck) => {
    setText((alt) => (alt && !/\s$/.test(alt) ? `${alt} ${stueck}` : alt + stueck));
    zuruecksetzen();
  });

  function zuruecksetzen() { setErgebnis(null); setKi(null); setKiFehler(''); lernplan.zuruecksetzen(); }
  function waehleFall(id: string) { diktat.stop(); setFallId(id); setText(ladeEntwurf(id)); zuruecksetzen(); }

  function pruefen() {
    diktat.stop();
    const e = pruefeBericht(fall, text);
    setErgebnis(e); setGeprueft(text); setKi(null); setKiFehler('');
    const neu = { ...beste, [fall.id]: Math.max(beste[fall.id] ?? 0, e.prozent) };
    setBeste(neu); schreibe(BESTE_KEY, neu);
    if (e.woerter >= MIN_WOERTER_LERNPLAN) lernplan.uebernimm([{ topicId: BERICHT_THEMA, scorePercent: e.prozent, anzahl: 1 }]);
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 85 ? 'info' : 'warning',
      title: `Pflegebericht: ${fall.titel} ${e.prozent} %`,
      detail: e.wertfrei ? (e.pflichtFehlend.length ? `Fehlt: ${e.pflichtFehlend.map((p) => p.text).join('; ')}` : 'Alle Pflichtpunkte enthalten') : 'Enthält wertende Wörter',
    });
    requestAnimationFrame(() => ergebnisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function fragClaude() {
    setKiLaeuft(true); setKiFehler('');
    try { setKi(await bewerteMitClaude({ apiKey, fall, text: geprueft })); }
    catch (err) { setKiFehler(err instanceof Error ? err.message : String(err)); }
    finally { setKiLaeuft(false); }
  }

  function naechsterFall() {
    const i = BERICHT_FAELLE.findIndex((f) => f.id === fallId);
    waehleFall(BERICHT_FAELLE[(i + 1) % BERICHT_FAELLE.length]!.id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const leer = !text.trim();
  const woerter = text.split(/\s+/).filter(Boolean).length;

  return (
    <section className="page bericht">
      <div className="page__head">
        <h2>Pflegebericht-Trainer</h2>
        <p className="muted">Schreib Berichtseinträge sachlich: was du gesehen, gehört und getan hast, ohne Wertung. Die Checkliste prüft offline und markiert wertende, ungenaue und vermutende Wörter.</p>
      </div>

      <div className="card bericht__auswahl">
        <label className="field">
          <span className="muted">Fall</span>
          <select value={fallId} onChange={(e) => waehleFall(e.target.value)}>
            {BERICHT_FAELLE.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titel} · {f.art === 'umschreiben' ? 'umschreiben' : 'neu schreiben'}{beste[f.id] !== undefined ? ` · bisher ${beste[f.id]} %` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <button type="button" className="ghost small" onClick={() => setHilfe((x) => !x)} aria-expanded={hilfe}>Was gehört in einen Eintrag?</button>
        </div>
        {hilfe && (
          <dl className="bericht__hilfe">
            {BAUSTEINE.map((b) => <div key={b}><dt>{BAUSTEIN_KURZ[b]}</dt><dd>{BAUSTEIN_LABEL[b]}</dd></div>)}
            <div><dt>Nicht</dt><dd>Bewertungen („aggressiv“, „stur“), ungenaue Wörter („gut“, „wenig“, „wie immer“) und Vermutungen als Tatsache.</dd></div>
          </dl>
        )}
      </div>

      <div className="bericht__layout">
        <Fallkarte fall={fall} />
        <form className="card bericht__eingabe" onSubmit={(e) => { e.preventDefault(); pruefen(); }}>
          <div className="bericht__kopf">
            <h3>Dein Eintrag</h3>
            <span className="muted">{woerter} Wörter</span>
          </div>
          <label className="bericht__feld">
            <span className="visually-hidden">Berichtseintrag</span>
            <textarea rows={9} value={text} placeholder={'Uhrzeit: Beobachtung. Sie sagt: „…“ Maßnahme. Wirkung. Informiert: …'}
              onChange={(e) => { setText(e.target.value); zuruecksetzen(); }} />
          </label>
          {diktat.aktiv && <div className="note" role="status">Hört zu … {diktat.zwischen && <em>{diktat.zwischen}</em>}</div>}
          {diktat.fehler && <div className="note warn" role="alert">{diktat.fehler}</div>}
          <div className="row bericht__knoepfe">
            <button type="submit" className="primary" disabled={leer}>Prüfen</button>
            {diktat.moeglich && (
              <button type="button" className={diktat.aktiv ? 'danger' : undefined} aria-pressed={diktat.aktiv} onClick={() => (diktat.aktiv ? diktat.stop() : diktat.start())}>
                {diktat.aktiv ? 'Diktat beenden' : 'Sprechen'}
              </button>
            )}
            <button type="button" className="ghost" disabled={leer} onClick={() => { setText(''); zuruecksetzen(); }}>Leeren</button>
          </div>
          <p className="muted">Dein Entwurf bleibt auf diesem Gerät gespeichert.</p>
        </form>
      </div>

      <div ref={ergebnisRef} className="bericht__auswertung">
        {ergebnis && (
          <>
            <Ergebnis e={ergebnis} text={geprueft} />
            {ergebnis.woerter >= MIN_WOERTER_LERNPLAN
              ? <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
              : <p className="muted">Für den Lernplan zählt ein Eintrag ab {MIN_WOERTER_LERNPLAN} Wörtern.</p>}
            <div className="card">
              <div className="row">
                {apiKey
                  ? <button type="button" className="primary" onClick={fragClaude} disabled={kiLaeuft}>{kiLaeuft ? 'Claude liest …' : ki ? 'Noch einmal bewerten' : 'Ausführliche Rückmeldung von Claude'}</button>
                  : <p className="muted">Für eine ausführliche Rückmeldung mit Umformulierungen einen API-Schlüssel hinterlegen. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>}
                <button type="button" onClick={naechsterFall}>Nächster Fall</button>
              </div>
              {apiKey && !ki && !kiLaeuft && <p className="muted">Gesendet werden nur der Übungsfall und dein Text.</p>}
              {kiFehler && <div className="note warn" role="alert">{kiFehler}</div>}
              <details>
                <summary>Beispiel-Eintrag ansehen</summary>
                <p className="pre bericht__muster">{fall.muster}</p>
              </details>
            </div>
            {ki && <KiErgebnis r={ki} />}
          </>
        )}
      </div>
    </section>
  );
}
