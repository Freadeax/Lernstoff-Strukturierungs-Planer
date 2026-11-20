// Praxissimulator Stufe 1 (geführt) auf dem neuen Kern (P21). Route #/lernen/praxis?gefuehrt=<fall>.
// Links Raumfoto und erhobene Werte, rechts genau ein Schritt mit 3–4 Möglichkeiten und sofortiger
// Rückmeldung (Wertung, Befund aus dem Kern, Erklärung der Praxisanleitung). Die Uhr läuft nur mit den
// Handlungen. Am Ende dieselbe Auswertung wie in Stufe 2. Fachlogik nur in ablauf.ts und im Kern.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Vorlesen } from '../../../ui/audio/Vorlesen';
import { RaumBuehne } from '../../../ui/sim/raeume/RaumBuehne';
import { RAEUME, type RaumId } from '../../../ui/sim/raeume/katalog';
import { anzeige } from '../kern/kern';
import type { FallV2, Rolle } from '../kern/typen';
import { lageText, raumJetzt, ROLLE_TEXT, uhrzeit, werteleiste } from '../arbeitsplatz/ansicht';
import { Auswertung } from '../arbeitsplatz/Auswertung';
import '../arbeitsplatz/arbeitsplatz.css';
import {
  beginne, bilanz, entscheide, fertig, gutGewaehlt, meldungenZu, offeneEntscheidung, PHASE_TEXT, rekonstruiere, urteil,
  waehlbar, waehle, weiter, type Aktion, type Option, type Stufe1Stand,
} from './ablauf';
import { merkeErledigt } from '../erledigt';
import { praxisStandText } from '../kern/freigabe';
import './stufe1.css';

const KEY = 'lernstoff.praxis.stufe1';
interface Gespeichert { version: 1; fall: string; fallVersion: string; rolle: Rolle; aktionen: Aktion[] }

function lies(fall: FallV2): Gespeichert | null {
  try {
    const g = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Gespeichert | null;
    return g && g.version === 1 && g.fall === fall.id && g.fallVersion === fall.version && Array.isArray(g.aktionen) ? g : null;
  } catch { return null; }
}
function schreibe(g: Gespeichert | null) {
  try { if (g) localStorage.setItem(KEY, JSON.stringify(g)); else localStorage.removeItem(KEY); } catch { /* nur Komfort */ }
}

const SETTING_TEXT: Record<FallV2['setting'], string> = {
  krankenhaus: 'Station', langzeit: 'Pflegeheim', ambulant: 'Hausbesuch', paediatrie: 'Kinderstation', psychiatrie: 'Psychiatrie',
  notaufnahme: 'Notaufnahme', schockraum: 'Schockraum', intensiv: 'Intensivstation', imc: 'IMC', aufwachraum: 'Aufwachraum',
};
const alterText = (f: FallV2) => f.person.alter.jahre !== undefined ? `${f.person.alter.jahre} Jahre` : `${f.person.alter.monate ?? 0} Monate`;
const istRaum = (id: string): id is RaumId => id in RAEUME;

export function Stufe1({ fall, onZurueck, onFrei }: { fall: FallV2; onZurueck: () => void; onFrei: () => void }) {
  const gespeichert = useMemo(() => lies(fall), [fall]);
  const [rolle, setRolle] = useState<Rolle>(gespeichert?.rolle ?? fall.geeignet.rollen.find((r) => r !== 'pflegefachperson') ?? 1);
  const [lauf, setLauf] = useState<{ st: Stufe1Stand; aktionen: Aktion[] } | null>(null);

  useEffect(() => {
    if (lauf) schreibe({ version: 1, fall: fall.id, fallVersion: fall.version, rolle: lauf.st.stand.z.rolle, aktionen: lauf.aktionen });
  }, [lauf, fall]);
  const istFertig = !!lauf && fertig(lauf.st);
  useEffect(() => { if (istFertig) merkeErledigt(fall.id, 'gefuehrt'); }, [istFertig, fall.id]);

  if (!lauf) {
    return <Briefing fall={fall} rolle={rolle} setRolle={setRolle} onZurueck={onZurueck}
      fortsetzen={gespeichert && gespeichert.aktionen.length > 0 ? () => { setLauf({ st: rekonstruiere(fall, gespeichert.rolle, gespeichert.aktionen), aktionen: gespeichert.aktionen }); window.scrollTo({ top: 0 }); } : undefined}
      onStart={() => { schreibe(null); setLauf({ st: beginne(fall, rolle), aktionen: [] }); window.scrollTo({ top: 0 }); }} />;
  }
  const tu = (a: Aktion, f: (s: Stufe1Stand) => Stufe1Stand) => setLauf((l) => {
    if (!l) return l;
    const st = f(l.st);
    return st === l.st ? l : { st, aktionen: [...l.aktionen, a] };
  });
  return <Ablauf st={lauf.st} onZurueck={onZurueck} onFrei={onFrei}
    onWahl={(id) => tu({ art: 'wahl', option: id }, (s) => waehle(s, id))}
    onWeiter={() => tu({ art: 'weiter' }, weiter)}
    onEntscheidung={(id) => tu({ art: 'entscheidung', wahl: id }, (s) => entscheide(s, id))}
    onNeu={() => { schreibe(null); setLauf(null); }} />;
}

/* ─────────────────────────── Briefing ─────────────────────────── */

function Briefing({ fall, rolle, setRolle, onStart, fortsetzen, onZurueck }: {
  fall: FallV2; rolle: Rolle; setRolle: (r: Rolle) => void; onStart: () => void; fortsetzen?: () => void; onZurueck: () => void;
}) {
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const rollen = fall.geeignet.rollen.filter((r) => fall.spur === 'B' || r !== 'pflegefachperson');
  return <div className="ap-briefing s1-briefing">
    <button type="button" className="ghost small" onClick={onZurueck}>‹ Zur Fallauswahl</button>
    <p className="eyebrow">Stufe 1 · geführt · Spur {fall.spur} · {SETTING_TEXT[fall.setting]}</p>
    <h2 ref={kopf} tabIndex={-1}>{fall.titel}</h2>
    <p className="ap-briefing__kurz">{fall.person.name}, {alterText(fall)} · {fall.kurz}</p>
    <section className="ap-briefing__karte" aria-labelledby="s1-uebernahme">
      <h3 id="s1-uebernahme">Übernahme</h3>
      <p>{fall.rahmen}</p>
      <blockquote>{fall.uebernahme}</blockquote>
      <Vorlesen text={`${fall.rahmen} ${fall.uebernahme}`} label="Übernahme vorlesen" />
    </section>
    <fieldset className="ap-briefing__rolle">
      <legend>Deine Rolle</legend>
      {rollen.map((r) => <label key={String(r)}><input type="radio" name="s1-rolle" checked={rolle === r} onChange={() => setRolle(r)} /> {r === 'pflegefachperson' ? 'Pflegefachperson' : `Auszubildende im ${r}. Drittel`}</label>)}
      <p className="muted">Die Rolle bestimmt, was du selbst darfst. Was eine Anordnung braucht oder ärztliche Aufgabe ist, hält deine Praxisanleitung an.</p>
    </fieldset>
    <p className="muted">Stufe 1: Du gehst den Fall Schritt für Schritt. Je Schritt wählst du aus wenigen Möglichkeiten und bekommst sofort eine Rückmeldung mit Begründung. Die Uhr läuft nur mit deinen Handlungen. Danach kannst du denselben Fall frei üben (Stufe 2).</p>
    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={onStart}>{fortsetzen ? 'Neu beginnen' : 'Geführt beginnen'}</button>
      {fortsetzen && <button type="button" onClick={fortsetzen}>Fortsetzen</button>}
    </div>
    <p className="ap-hinweis" role="note">Lernmodell: Werte und Verlauf sind vereinfacht. Fall {praxisStandText(fall)}. Speicherung nur auf diesem Gerät.</p>
  </div>;
}

/* ─────────────────────────── Ablauf ─────────────────────────── */

function Ablauf({ st, onWahl, onWeiter, onEntscheidung, onZurueck, onNeu, onFrei }: {
  st: Stufe1Stand; onWahl: (id: string) => void; onWeiter: () => void; onEntscheidung: (id: string) => void;
  onZurueck: () => void; onNeu: () => void; onFrei: () => void;
}) {
  const z = st.stand.z;
  const fall = z.fall;
  const a = st.aktuell;
  const ev = offeneEntscheidung(st);
  const frageRef = useRef<HTMLHeadingElement>(null);
  const rueckRef = useRef<HTMLDivElement>(null);
  useEffect(() => { frageRef.current?.focus({ preventScroll: true }); }, [a?.nr, ev?.id]);
  useEffect(() => { if (a?.picks.length) rueckRef.current?.scrollIntoView({ block: 'nearest' }); }, [a?.picks.length]);

  if (fertig(st) && !a && !ev) {
    const b = bilanz(st);
    return <section className="page-praxis-s1 s1-ende">
      <div className="s1-bilanz">
        <p className="eyebrow">Stufe 1 · geführt · {ROLLE_TEXT(z.rolle)}</p>
        <p className="s1-bilanz__zahl"><strong>{b.erstVersuch} von {b.schritte}</strong> Schritten im ersten Versuch richtig{b.gefaehrlich ? `, ${b.gefaehrlich} × gefährlich gewählt` : ''}.</p>
        {b.lernpunkte.length > 0 && <details className="s1-lernpunkte"><summary>Deine Lernpunkte ({b.lernpunkte.length})</summary>
          <ul>{b.lernpunkte.map((l, i) => <li key={i}><span className="s1-phase">{PHASE_TEXT[l.phase]}</span> Du hast „{l.gewaehlt}“ gewählt. Richtig war: <strong>{l.richtig}</strong>. {l.warum}</li>)}</ul>
        </details>}
        <div className="s1-knoepfe">
          <button type="button" className="primary" onClick={onFrei}>Diesen Fall frei üben (Stufe 2)</button>
          <button type="button" onClick={onNeu}>Noch einmal geführt</button>
        </div>
      </div>
      <Auswertung z={z} onZurueck={onZurueck} onNeu={onNeu} />
    </section>;
  }

  const werte = werteleiste(st.stand);
  const raumId = raumJetzt(z);
  const raum = istRaum(raumId) ? raumId : istRaum(fall.medien.raum) ? fall.medien.raum : undefined;
  const klinikMonitor = (fall.start.sichtbar?.length ?? 0) > 0;
  const az = anzeige(z);
  const lage = a ? z.meldungen.slice(a.lageAb, a.meldungenAb).filter((m) => m.richtung !== 'raus' && m.art !== 'doku') : [];
  const letzteEntscheidung = st.entscheidungen.at(-1);
  const entschiedenJetzt = letzteEntscheidung && a && letzteEntscheidung.meldungAb >= a.lageAb && !ev
    ? fall.ereignisse.find((e) => e.id === letzteEntscheidung.ereignis)?.entscheidung?.find((o) => o.id === letzteEntscheidung.wahl) : undefined;
  const plan = st.plan.length;
  const nr = a ? a.nr : st.i;
  const vorbei = !!z.ende && !z.abschluss && a && st.plan[a.nr]?.art === 'eingabe';

  return <div className="s1">
    <header className="s1-kopf">
      <div className="s1-kopf__text">
        <span className="s1-stufe">Stufe 1 · geführt · {ROLLE_TEXT(z.rolle)} · {SETTING_TEXT[fall.setting]}</span>
        <h2>{fall.titel}</h2>
        <p>{fall.person.name}, {alterText(fall)}</p>
      </div>
      <div className="s1-uhr" aria-label={`Uhrzeit ${uhrzeit(fall.startUhrzeit, z.t)}`}><small>Uhrzeit</small><strong>{uhrzeit(fall.startUhrzeit, z.t)}</strong></div>
      <button type="button" className="s1-verlassen" onClick={onZurueck}>Fall verlassen</button>
    </header>
    <ol className="s1-fortschritt" aria-label={`Schritt ${Math.min(nr + 1, plan)} von ${plan}`}>
      {st.plan.map((_, i) => <li key={i} className={i < nr ? 'is-erledigt' : i === nr ? 'is-aktuell' : ''} />)}
    </ol>

    <div className="s1-buehne">
      <div className="s1-links">
        <div className="s1-zimmer">
          {raum ? <RaumBuehne raum={raum} ort={SETTING_TEXT[fall.setting]}
            monitor={klinikMonitor ? { zustand: 'laeuft', gruppe: fall.altersgruppe === 'saeugling' || fall.altersgruppe === 'kleinkind' || fall.altersgruppe === 'schulkind' ? fall.altersgruppe : 'erwachsen', werte: { puls: az.hf, spo2: az.spo2, af: az.af, sys: az.rrSys, dia: az.rrDia, temp: az.temp, avpu: az.avpu } } : undefined}
            fallback={<p className="s1-zimmer__fallback">{lageText(z)}</p>} /> : <p className="s1-zimmer__fallback">{lageText(z)}</p>}
        </div>
        <p className="s1-jetzt"><strong>Jetzt:</strong> {lageText(z)}</p>
        <section className="s1-werte" aria-label="Erhobene Werte">
          <dl>{werte.map((w) => <div key={w.id} className={`is-${w.stand} is-${w.alarm}`}>
            <dt>{w.label}</dt>
            <dd>{w.text}<small>{w.stand === 'offen' ? '' : w.einheit}</small><span className="visually-hidden">{w.stand === 'offen' ? ' noch nicht gemessen' : w.zeit ? `, gemessen ${w.zeit}` : ', laufend'}</span></dd>
          </div>)}</dl>
          <p className="s1-werte__fuss">Strich = noch nicht erhoben. Werte erscheinen erst, wenn du sie misst.</p>
        </section>
        <details className="s1-akte"><summary>Fallakte</summary><dl>
          <div><dt>Rahmen</dt><dd>{fall.rahmen}</dd></div>
          <div><dt>Übernahme</dt><dd>{fall.uebernahme}</dd></div>
          <div><dt>Bekannte Diagnosen</dt><dd>{fall.person.diagnosenBekannt.join(', ') || '—'}</dd></div>
          <div><dt>Medikamente</dt><dd>{fall.person.medikamentePlan.join(', ') || '—'}</dd></div>
          <div><dt>Allergien</dt><dd>{fall.person.allergien.length ? fall.person.allergien.join(', ') : 'keine bekannt'}</dd></div>
          <div><dt>Lernziele</dt><dd><ul>{fall.lernziele.map((x) => <li key={x}>{x}</li>)}</ul></dd></div>
        </dl></details>
      </div>

      <section className="s1-rechts" aria-label="Dein nächster Schritt">
        {lage.length > 0 && <ul className="s1-lage" aria-label="Was inzwischen passiert ist">
          {lage.map((m, i) => <li key={i} className={`is-${m.art}`}><time>{uhrzeit(fall.startUhrzeit, m.t)}</time><p>{m.text}</p></li>)}
        </ul>}
        {entschiedenJetzt && <div className={`s1-rueck is-${entschiedenJetzt.wertung}`} role="status">
          <strong className="s1-rueck__urteil">{urteil({ wertung: entschiedenJetzt.wertung, herkunft: 'muster' })}</strong>
          <p>{entschiedenJetzt.text}</p><p className="s1-rueck__pa">{fall.pa.name}: „{entschiedenJetzt.warum}“</p>
        </div>}

        {ev ? <div className="s1-frage s1-frage--ereignis">
          <span className="s1-phase">Entscheidungsmoment · Uhr steht</span>
          <h3 ref={frageRef} tabIndex={-1}>{ev.text}</h3>
          <p>Was tust du?</p>
          <div className="s1-optionen">{ev.entscheidung!.map((o) => <button key={o.id} type="button" onClick={() => onEntscheidung(o.id)}>{o.text}</button>)}</div>
        </div> : a && <div className="s1-frage">
          <span className="s1-phase">Schritt {a.nr + 1} von {plan} · {PHASE_TEXT[a.phase]}</span>
          {vorbei ? <>
            <h3 ref={frageRef} tabIndex={-1}>Der Fall ist zu Ende</h3>
            <p className="note warn">{z.ende!.text}</p>
          </> : <>
            <h3 ref={frageRef} tabIndex={-1}>{a.frage}</h3>
            <div className="s1-optionen">{a.optionen.map((o) => {
              const gewaehlt = a.picks.includes(o.id);
              return <button key={o.id} type="button" aria-pressed={gewaehlt} className={gewaehlt ? `is-gewaehlt is-${o.wertung}` : ''}
                disabled={gewaehlt || !waehlbar(st, o.id)} onClick={() => onWahl(o.id)}>
                <OptionText o={o} />
                {gewaehlt && <span className="visually-hidden">, gewählt: {urteil(o)}</span>}
              </button>;
            })}</div>
          </>}
          <div ref={rueckRef} className="s1-rueckliste" aria-live="polite">
            {a.picks.map((id, k) => {
              const o = a.optionen.find((x) => x.id === id)!;
              const kern = meldungenZu(st, a, k);
              return <div key={id} className={`s1-rueck is-${o.wertung}`}>
                <strong className="s1-rueck__urteil">{urteil(o)}</strong>
                <p className="s1-rueck__wahl">{o.text}</p>
                {kern.map((m, j) => <p key={j} className={`s1-rueck__kern is-${m.art}`}>{m.text}</p>)}
                {o.eingaben.length === 0 && o.wertung !== 'gut' && <p className="s1-rueck__kern is-hinweis">Nicht ausgeführt: In Stufe 1 hält dich die Praxisanleitung hier an.</p>}
                <p className="s1-rueck__pa">{fall.pa.name}: „{o.warum}“</p>
              </div>;
            })}
          </div>
          {(gutGewaehlt(a) || vorbei) && <div className="s1-weiter">
            <button type="button" className="primary" onClick={onWeiter}>{st.plan[a.nr]?.art === 'pflegebedarf' || vorbei ? 'Zur Auswertung' : 'Weiter'}</button>
          </div>}
          {!gutGewaehlt(a) && a.picks.length > 0 && !vorbei && <p className="s1-hinweis">Wähle noch einmal. Die Zeit, die deine Wahl gekostet hat, ist vergangen.</p>}
        </div>}
      </section>
    </div>
  </div>;
}

function OptionText({ o }: { o: Option }) {
  if (!o.inhalt?.length) return <span>{o.text}</span>;
  return <span className="s1-option">
    <span className="s1-option__titel">{o.text}</span>
    <span className="s1-option__inhalt">{o.inhalt.map((t, i) => <span key={i}>{t}</span>)}</span>
  </span>;
}
