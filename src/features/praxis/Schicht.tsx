import { useEffect, useRef, useState } from 'react';
import { Arbeitsplatz, Klinik, type Panel } from './Praxissimulator';
import { clock } from './engine';
import { beendeSchicht, handle, neuBei, schichtAuswertung, warte, wechsle, WEGEZEIT, type Schicht } from './schicht';
import { archive } from './storage';
import { alterText, type Command } from './types';

const ESKALATION_KURZ: Record<string, string> = { 'kein Auslöser gemessen': 'kein Auslöser gemessen', 'nicht eskaliert': 'nicht eskaliert', vorausschauend: 'vorausschauend', zeitnah: 'zeitnah', 'verspätet': 'verspätet' };

/** Schichtmodus: mehrere Patienten, eine Uhr. */
export function SchichtAnsicht({ schicht, setSchicht, onClose }: { schicht: Schicht; setSchicht: (f: (x: Schicht | null) => Schicht | null) => void; onClose: () => void }) {
  const [running, setRunning] = useState(false); const [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState<Panel>('Patientenzimmer');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const archiviert = useRef('');
  const s = schicht.sessions[schicht.active];
  const active = schicht.phase === 'active';
  useEffect(() => {
    if (!running || !active) return;
    const timer = window.setInterval(() => setSchicht(x => x ? warte(x, speed) : x), 1000);
    return () => clearInterval(timer);
  }, [running, speed, active]);
  useEffect(() => { if (s.open?.length) setRunning(false); }, [s.open?.length, schicht.active]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', pause); return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    // Abgeschlossene Patienten landen im Praxis-Archiv (zählt auch für CE-Lernpfade).
    if (schicht.phase === 'finished' && archiviert.current !== schicht.id) { for (const x of schicht.sessions) archive(x); archiviert.current = schicht.id; }
  }, [schicht.phase, schicht.id]);
  const send = (command: Command) => setSchicht(x => x ? handle(x, command) : x);
  const geheZu = (i: number) => { setSchicht(x => x ? wechsle(x, i) : x); setPanel('Patientenzimmer'); };

  return <section className="praxis-schicht" aria-label="Schichtmodus">
    <header className="praxis-sessionhead"><div><span className="eyebrow">Schichtmodus · {schicht.sessions.length} Patienten · Ausbildungsjahr {schicht.level}</span><h2 ref={headingRef} tabIndex={-1}>{schicht.title}</h2><p>Alle Verläufe laufen gleichzeitig weiter. Jeder Zimmerwechsel kostet {WEGEZEIT} Sekunden.</p></div><div className="praxis-clock"><span>Schichtzeit</span><strong>{clock(schicht.time)}</strong><span>{active ? running ? 'Uhr läuft' : 'Uhr pausiert' : 'Schicht beendet'}</span></div></header>
    {active ? <>
      <div className="praxis-controls" role="group" aria-label="Schichtsteuerung"><button className="primary" onClick={() => setRunning(!running)}>{running ? 'Uhr pausieren' : 'Uhr starten'}</button><label>Tempo<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="1">1× Echtzeit</option><option value="5">5×</option><option value="30">30× Zeitraffer</option></select></label>
        <button onClick={() => send({ type: 'advance', seconds: 60 })}>+1 Minute</button><button onClick={() => send({ type: 'advance', seconds: 300 })}>+5 Minuten</button>
        <button onClick={() => { setRunning(false); setSchicht(x => x ? beendeSchicht(x) : x); }}>Schicht beenden</button>
        <button className="ghost" onClick={() => { setRunning(false); onClose(); }}>Pausieren und zur Auswahl</button></div>
      <div className="praxis-patienten" role="group" aria-label="Patienten in deiner Schicht">{schicht.sessions.map((p, i) => {
        const neu = neuBei(schicht, i); const punkt = p.chart?.at(-1);
        return <button key={p.id} className="praxis-patient" aria-pressed={i === schicht.active} onClick={() => geheZu(i)}>
          <span className="praxis-patient__name">{p.scenario.patient}, {alterText(p.scenario.age)}</span>
          <small>{p.scenario.title}</small>
          <small>{punkt ? `zuletzt gemessen ${clock(punkt.at)}` : 'noch nicht gemessen'}{schicht.first[i] === null ? ' · noch nicht gesehen' : ''}</small>
          {i !== schicht.active && (neu.entscheidung || neu.ereignisse > 0) && <span className="praxis-patient__neu">{neu.entscheidung ? 'Entscheidung wartet' : `${neu.ereignisse} neue Meldung${neu.ereignisse === 1 ? '' : 'en'}`}</span>}
          {i === schicht.active && <span className="praxis-patient__hier">Du bist hier</span>}
        </button>;
      })}</div>
      <div className="praxis-schicht__patient"><h3>{s.scenario.patient} · {s.scenario.title}</h3><p className="muted">{s.scenario.background}</p></div>
      <Arbeitsplatz s={s} send={send} panel={panel} setPanel={setPanel} />
    </> : <Auswertung schicht={schicht} onClose={onClose} />}
  </section>;
}

function Auswertung({ schicht, onClose }: { schicht: Schicht; onClose: () => void }) {
  const a = schichtAuswertung(schicht);
  return <div className="card praxis-debrief"><span className="eyebrow">Schichtauswertung</span><h3>Wie lief deine Schicht?</h3>
    <div className="praxis-klinik__grid">
      <div><span className="eyebrow">Priorisierung</span><strong>{a.priorisiert ? 'Zuerst beim kritischsten Patienten' : a.reihenfolge.length ? 'Zuerst woanders' : 'Niemanden versorgt'}</strong><p>Höchster NEWS2 bei Übergabe: {a.kritisch.map(r => r.patient).join(', ')} ({a.kritisch[0]?.startNews2} Punkte). Deine Reihenfolge: {a.reihenfolge.map(r => r.patient.split(' ')[0]).join(' → ') || '—'}.</p></div>
      <div><span className="eyebrow">Ausgang</span><strong>{a.stabil} von {a.rows.length} stabil</strong><p>{a.unbesucht.length ? `Nicht gesehen: ${a.unbesucht.map(r => r.patient).join(', ')}.` : 'Alle Patienten wurden gesehen.'}</p></div>
      <div><span className="eyebrow">Übergabe</span><strong>{a.uebergaben} von {a.rows.length} mit SBAR</strong><p>{a.switches} Zimmerwechsel in {clock(a.dauer)}. Am Schichtende braucht jeder Patient eine strukturierte Übergabe.</p></div>
    </div>
    <div className="praxis-tablewrap" tabIndex={0} role="region" aria-label="Auswertung je Patient"><table className="praxis-schicht__tabelle"><caption>Je Patient</caption><thead><tr><th scope="col">Patient</th><th scope="col">NEWS2 Start</th><th scope="col">Erster Kontakt</th><th scope="col">Eskalation</th><th scope="col">Komplikationen</th><th scope="col">Entscheidungen</th><th scope="col">Lage</th></tr></thead>
      <tbody>{a.rows.map(r => <tr key={r.i}><th scope="row">{r.patient}</th><td>{r.startNews2}</td><td>{r.first === null ? '—' : clock(r.first)}</td><td>{ESKALATION_KURZ[r.klinik.escalation]}</td><td>{r.klinik.complications.length} eingetreten · {r.klinik.prevented.length} verhindert</td><td>{r.klinik.decisions.filter(d => d.best).length} / {r.klinik.decisions.length} gut</td><td>{r.klinik.final.unstable ? 'nicht stabil' : 'stabil'}</td></tr>)}</tbody></table></div>
    <p className="muted">Die Priorisierung vergleicht nur deinen ersten Kontakt mit dem NEWS2 bei Übergabe. In echt zählen auch Gespräch, Blick ins Zimmer und Teamabsprachen. Fachlich ungeprüft.</p>
    {schicht.sessions.map(s => <details key={s.id} className="praxis-schicht__detail"><summary>{s.scenario.patient} · {s.scenario.title}</summary><Klinik s={s} /></details>)}
    <h3>Zur Reflexion</h3><p>Woran hast du erkannt, wer dich zuerst braucht? Was hast du delegiert, was hättest du delegieren können? Wer wäre bei einer Übergabe jetzt am meisten gefährdet?</p>
    <div className="row"><button className="primary" onClick={onClose}>Zur Fallauswahl</button></div>
  </div>;
}
