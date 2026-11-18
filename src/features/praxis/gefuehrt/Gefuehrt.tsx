// Praxissimulator Stufe 1: geführter Ablauf nach ABCDE auf einem Bildschirm.
// Links das Zimmer mit Monitor, darunter die zuletzt erhobenen Werte; rechts genau eine Frage
// mit wenigen Möglichkeiten und sofortiger Rückmeldung. Am Ende die gemeinsame Auswertung.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AuswertungsKarte } from '../../../ui/sim/AuswertungsKarte';
import { Portraet } from '../../../ui/sim/Portraet';
import { personFuer } from '../../../ui/sim/personen';
import { RaumBuehne } from '../../../ui/sim/raeume/RaumBuehne';
import { RAEUME } from '../../../ui/sim/raeume/katalog';
import { clock } from '../engine';
import { fotoMonitor } from '../FotoSzene';
import { laufendeVariante, raumFotoFuer } from '../raumfotos';
import { archive, pruefeSession } from '../storage';
import { szene } from '../szene';
import { alterText, SETTINGS, STORY_KINDS, type Session, type Vital } from '../types';
import { aktuellerSchritt, beginne, bereite, entscheide, fertig, unterbrechung, waehlbar, waehle, weiter, type GStand } from './ablauf';
import { gefuehrtAuswertung } from './auswertung';
import { leitfallFuer } from './leitfaelle';
import { PHASEN, WERTUNG_LABEL, type GOption, type Leitfall } from './typen';
import './gefuehrt.css';

const KEY = 'lernstoff.praxis.gefuehrt';

function lese(l: Leitfall): GStand | null {
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return null;
    const st = JSON.parse(raw) as GStand;
    if (st?.version !== 1 || st.fall !== l.fall || typeof st.schritt !== 'number' || typeof st.picks !== 'object') return null;
    st.session = pruefeSession(st.session);
    return st;
  } catch { return null; }
}
function speichere(st: GStand | null) { try { if (st) localStorage.setItem(KEY, JSON.stringify(st)); else localStorage.removeItem(KEY); } catch { /* nur Komfort */ } }

const WERTE: { key: Vital; label: string; unit: string }[] = [
  { key: 'resp', label: 'AF', unit: '/min' }, { key: 'spo2', label: 'SpO₂', unit: '%' }, { key: 'pulse', label: 'Puls', unit: '/min' },
  { key: 'sys', label: 'RR', unit: 'mmHg' }, { key: 'temp', label: 'Temp.', unit: '°C' }, { key: 'glucose', label: 'BZ', unit: 'mg/dl' },
];
const zahl = (n: number | undefined, k: Vital) => n === undefined ? '—' : n.toLocaleString('de-DE', { maximumFractionDigits: k === 'temp' ? 1 : 0 });

function Zimmer({ s }: { s: Session }) {
  const raum = raumFotoFuer(s.scenario.id);
  const z = szene(s);
  if (!raum) return <div className="gef-zimmer gef-zimmer--leer"><p>{s.scenario.environment}</p></div>;
  const nachtFoto = z.nacht ? RAEUME[raum.id].nacht : undefined;
  return <div className={`gef-zimmer is-alarm-${z.alarm}`}>
    <RaumBuehne raum={nachtFoto ?? laufendeVariante(raum, s.flags, s.time) ?? raum.id} monitor={fotoMonitor(s, z, raum)} ort={SETTINGS[s.scenario.setting]}
      fallback={<div className="gef-zimmer__fallback"><p>{s.scenario.environment}</p></div>} />
    {raum.beispiel && <p className="gef-hinweis">{raum.beispiel}</p>}
  </div>;
}

function Werte({ st }: { st: GStand }) {
  const s = st.session;
  const live = s.monitoring;
  const wert = (k: Vital) => live && k !== 'glucose' && k !== 'temp' && s.measured[k] !== undefined ? Math.round(s.measured[k]!) : st.werte[k];
  return <section className="gef-werte" aria-label="Erhobene Werte">
    <p className="gef-werte__kopf">{live ? 'Monitor läuft' : st.werteZeit === null ? 'Noch nichts gemessen' : `Zuletzt erhoben um ${clock(st.werteZeit)}`}</p>
    <dl>{WERTE.map(w => <div key={w.key}><dt>{w.label}</dt><dd>{w.key === 'sys' ? (wert('sys') === undefined ? '—' : `${zahl(wert('sys'), 'sys')}/${zahl(wert('dia'), 'dia')}`) : zahl(wert(w.key), w.key)}<small>{w.unit}</small></dd></div>)}</dl>
  </section>;
}

function Rueckmeldung({ o, befund }: { o: GOption; befund: string }) {
  return <div className={`gef-rueck is-${o.wertung}`} role="status">
    <strong className="gef-rueck__urteil">{WERTUNG_LABEL[o.wertung]}</strong>
    {befund && <p className="gef-rueck__befund">{befund}</p>}
    <p>{o.warum}</p>
  </div>;
}

/** Ereignisse, die seit der letzten Wahl eingetreten sind (Komplikation, Anruf, Befund, Warnung). */
function Ereignisse({ s, ab }: { s: Session; ab: number }) {
  const neu = s.events.filter(e => e.id > ab && (e.kind === 'story' || e.kind === 'result' || (e.kind === 'warning' && !e.title.startsWith('Folge:'))));
  if (!neu.length) return null;
  return <ul className="gef-ereignisse" aria-live="polite">{neu.map(e => <li key={e.id} className={`is-${e.kind}`}><time>{clock(e.at)}</time><div><strong>{e.title}</strong><p>{e.detail}</p></div></li>)}</ul>;
}

function Unterbrechung({ l, st, setSt }: { l: Leitfall; st: GStand; setSt: (s: GStand) => void }) {
  const e = unterbrechung(st)!;
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); }, [e.id]);
  return <div className="gef-frage gef-frage--unterbrechung">
    <span className="gef-phase">Unterbrechung · {STORY_KINDS[e.kind]}</span>
    <h3 ref={ref} tabIndex={-1}>{e.title}</h3>
    <p>{e.detail}</p>
    <div className="gef-optionen">{e.choices!.map(c => <button key={c.id} type="button" onClick={() => setSt(entscheide(l, st, c.id))}>{c.label}</button>)}</div>
  </div>;
}

export function Gefuehrt({ fall, onFrei, onZurueck }: { fall: string; onFrei: (fall: string) => void; onZurueck: () => void }) {
  const l = leitfallFuer(fall)!;
  const [st, setStRoh] = useState<GStand>(() => lese(l) ?? beginne(l));
  const [ab, setAb] = useState(() => st.session.events.at(-1)?.id ?? 0);
  const [letzteEntscheidung, setLetzteEntscheidung] = useState<string | null>(null);
  const archiviert = useRef('');
  const frageRef = useRef<HTMLHeadingElement>(null);
  const setSt = (n: GStand) => { setStRoh(n); speichere(n); };
  const schritt = aktuellerSchritt(l, st);
  const s = st.session;
  const offen = unterbrechung(st);
  const ende = fertig(l, st);
  const picks = schritt ? st.picks[schritt.id] ?? [] : [];
  const person = personFuer('praxis', s.scenario.id);
  const z = szene(s);
  const zustand = z.komplikation || z.atemnot >= 2 || z.alarm === 'rot' ? 'kritisch' : z.atemnot >= 1 || z.schmerz >= 2 ? 'angestrengt' : 'stabil';
  const auswertung = useMemo(() => ende ? gefuehrtAuswertung(l, st) : null, [ende, l, st]);

  useEffect(() => { if (ende && archiviert.current !== s.id) { archiviert.current = s.id; archive(s); } }, [ende, s]);
  useEffect(() => { frageRef.current?.focus({ preventScroll: true }); }, [st.schritt]);
  // Nach einer Unterbrechung während des Vorlaufs geht der Vorlauf weiter.
  useEffect(() => { if (!offen && schritt && st.picks[schritt.id] === undefined) setSt(bereite(l, st)); }, [offen, schritt, st]);

  function waehlen(id: string) { setAb(s.events.at(-1)?.id ?? 0); setLetzteEntscheidung(null); setSt(waehle(l, st, id)); }
  function weitergehen() { setAb(s.events.at(-1)?.id ?? 0); setLetzteEntscheidung(null); setSt(weiter(l, st)); }
  function neu() { const n = beginne(l); setAb(n.session.events.at(-1)?.id ?? 0); setSt(n); }

  const letzte = schritt && picks.length ? schritt.optionen.find(o => o.id === picks.at(-1)) : undefined;
  const befund = letzte ? letzte.befund ?? s.scenario.actions.find(a => a.id === letzte.aktionen?.[0])?.result ?? '' : '';
  const nochMehr = schritt && letzte && picks.length < (schritt.mehrfach ?? 1) && schritt.optionen.some(o => waehlbar(l, st, o.id));
  const entschieden = s.decisions?.at(-1);
  const entscheidungsText = entschieden && letzteEntscheidung === `${entschieden.event}:${entschieden.choice}` ? s.scenario.storyline?.find(e => e.id === entschieden.event)?.choices?.find(c => c.id === entschieden.choice) : undefined;

  return <div className="gef">
    <header className="gef-kopf">
      {person ? <Portraet person={person} zustand={zustand} groesse={52} /> : null}
      <div className="gef-kopf__text">
        <span className="gef-stufe">Stufe 1 · geführt · {SETTINGS[s.scenario.setting]}</span>
        <h2>{s.scenario.title}</h2>
        <p>{s.scenario.patient}, {alterText(s.scenario.age)}</p>
      </div>
      <div className="gef-uhr" aria-label={`Simulationszeit ${clock(s.time)}`}><small>Simulationszeit</small><strong>{clock(s.time).slice(0, 5)}</strong></div>
      <button type="button" className="gef-verlassen" onClick={onZurueck}>Fall verlassen</button>
    </header>

    {!ende && <ol className="gef-fortschritt" aria-label={`Schritt ${st.schritt + 1} von ${l.schritte.length}`}>{l.schritte.map((x, i) => <li key={x.id} className={i < st.schritt ? 'is-erledigt' : i === st.schritt ? 'is-aktuell' : ''} title={PHASEN[x.phase]} />)}</ol>}

    <div className={`gef-buehne ${ende ? 'is-ende' : ''}`}>
      <div className="gef-links">
        <Zimmer s={s} />
        <Werte st={st} />
        <details className="gef-akte"><summary>Fallakte</summary><dl>
          <div><dt>Rahmen</dt><dd>{l.rahmen}</dd></div>
          <div><dt>Vorgeschichte</dt><dd>{s.scenario.background}</dd></div>
          <div><dt>Allergien</dt><dd>{s.scenario.allergies.length ? s.scenario.allergies.join(', ') : 'keine bekannt'}</dd></div>
          <div><dt>Gewicht</dt><dd>{s.scenario.weight.toLocaleString('de-DE')} kg</dd></div>
          <div><dt>Lernziele</dt><dd><ul>{l.lernziele.map(x => <li key={x}>{x}</li>)}</ul></dd></div>
        </dl></details>
      </div>

      <section className="gef-rechts" aria-label="Dein nächster Schritt">
        {ende && auswertung ? <div className="gef-ende">
          <h3 ref={frageRef} tabIndex={-1}>Auswertung</h3>
          <AuswertungsKarte a={auswertung} />
          <div className="gef-ende__knoepfe">
            <button type="button" className="primary" onClick={() => onFrei(l.fall)}>Diesen Fall frei üben (Stufe 2)</button>
            <button type="button" onClick={neu}>Noch einmal geführt</button>
            <button type="button" onClick={onZurueck}>Zur Fallauswahl</button>
          </div>
          <p className="gef-hinweis">Quellen: {l.quellen.join(' · ')}. Fachliche Freigabe durch eine Pflegefachperson steht aus.</p>
        </div> : <>
          <Ereignisse s={s} ab={ab} />
          {entscheidungsText && <div className={`gef-rueck ${entscheidungsText.best ? 'is-gut' : 'is-falsch'}`} role="status"><strong className="gef-rueck__urteil">{entscheidungsText.best ? 'Richtig' : 'Nicht die beste Wahl'}</strong><p className="gef-rueck__befund">{entscheidungsText.result}</p><p>{entscheidungsText.why}</p></div>}
          {offen ? <Unterbrechung l={l} st={st} setSt={(n) => { const e = unterbrechung(st)!; setAb(s.events.at(-1)?.id ?? 0); const d = n.session.decisions?.at(-1); setLetzteEntscheidung(d ? `${e.id}:${d.choice}` : null); setSt(n); }} />
            : schritt && <div className="gef-frage">
              <span className="gef-phase">Schritt {st.schritt + 1} von {l.schritte.length} · {PHASEN[schritt.phase]}</span>
              {schritt.lage && <p className="gef-lage">{schritt.lage}</p>}
              <h3 ref={frageRef} tabIndex={-1}>{schritt.frage}</h3>
              <div className="gef-optionen">{schritt.optionen.map(o => {
                const gewaehlt = picks.includes(o.id);
                return <button key={o.id} type="button" aria-pressed={gewaehlt} className={gewaehlt ? `is-gewaehlt is-${o.wertung}` : ''} disabled={!gewaehlt && !waehlbar(l, st, o.id)} onClick={() => waehlen(o.id)}>{o.text}</button>;
              })}</div>
              {letzte && <Rueckmeldung o={letzte} befund={befund} />}
              {letzte && <div className="gef-weiter">
                {nochMehr && <span>Du kannst noch eine weitere Möglichkeit wählen.</span>}
                <button type="button" className="primary" onClick={weitergehen}>{st.schritt + 1 === l.schritte.length ? 'Fall abschließen' : 'Weiter'}</button>
              </div>}
            </div>}
        </>}
      </section>
    </div>
  </div>;
}
