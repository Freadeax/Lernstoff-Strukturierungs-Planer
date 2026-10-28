import { useEffect, useRef, useState } from 'react';
import { PageHeading } from '../../ui/PageHeading';
import { SCENARIOS, CATEGORIES, RESOURCES } from './catalog';
import { CHECKS, clinicalDebrief, clock, consciousness, debrief, dispatch, replay, SOURCES, start } from './engine';
import { News2Badge, VitalKurve } from './VitalKurve';
import { archive, download, parseScenario, readArchive, readSession, saveSession } from './storage';
import { xapiDraft } from './tracking';
import { SETTINGS, type Category, type Command, type Medication, type Scenario, type Session, type Vital } from './types';
import './praxis.css';

const VITALS: { key: Vital; label: string; unit: string }[] = [
  { key: 'pulse', label: 'Puls', unit: '/min' }, { key: 'spo2', label: 'SpO₂', unit: '%' },
  { key: 'sys', label: 'RR syst.', unit: 'mmHg' }, { key: 'dia', label: 'RR diast.', unit: 'mmHg' },
  { key: 'resp', label: 'Atemfrequenz', unit: '/min' }, { key: 'temp', label: 'Temperatur', unit: '°C' },
  { key: 'glucose', label: 'Blutzucker', unit: 'mg/dl' }, { key: 'pain', label: 'Schmerz', unit: 'NRS' },
];
const PANELS = ['Patientenzimmer', 'Vitalkurve', 'Patientenakte', 'Medikation', 'Dokumentation', 'Verlauf'] as const;
type Panel = typeof PANELS[number];
const format = (value: number | undefined, key: Vital) => value === undefined ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: key === 'temp' ? 1 : 0 }).format(value);

function Room({ s, send }: { s: Session; send: (c: Command) => void }) {
  return <div className="praxis-room">
    <div className="praxis-room__scene">
      <svg viewBox="0 0 700 240" aria-hidden="true" focusable="false">
        <path d="M25 210H675M70 60H220V150H70Z" fill="none" stroke="currentColor" strokeWidth="2" opacity=".25" />
        <path d="M145 60V150M70 105H220" stroke="currentColor" opacity=".2" />
        <rect x="245" y="139" width="310" height="38" rx="12" fill="currentColor" opacity=".16" />
        <path d="M255 175V210M540 175V210M245 140V110" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <circle cx="302" cy="114" r="24" fill="currentColor" opacity=".8" />
        <path d="M333 128Q385 90 430 128L519 139H323Z" fill="currentColor" opacity=".4" />
        <path d="M591 78V206M570 207H612M579 79H610" stroke="currentColor" strokeWidth="4" />
        <rect x="584" y="91" width="20" height="40" rx="4" fill="currentColor" opacity=".3" />
        <rect x="434" y="38" width="99" height="57" rx="5" fill="currentColor" opacity=".14" />
        <path d="M443 69H462L468 54L477 81L484 63L490 69H523" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="praxis-room__label">Interaktiver 2D-Arbeitsplatz · schematische Darstellung</span>
    </div>
    <p>{s.scenario.environment}</p>
    <div className="praxis-room__shortcuts" role="group" aria-label="Im Patientenzimmer handeln">
      <button onClick={() => send({ type: 'action', id: 'assessment' })}>Patient beurteilen</button>
      <button onClick={() => send({ type: 'action', id: 'vitals' })}>Messgerät verwenden</button>
      <button onClick={() => send({ type: 'action', id: 'help' })}>Team rufen</button>
    </div>
  </div>;
}

function MedicationForm({ med, s, send }: { med: Medication; s: Session; send: (c: Command) => void }) {
  const [checks, setChecks] = useState(CHECKS.map(() => false));
  const [dose, setDose] = useState(''); const [volume, setVolume] = useState('');
  const [route, setRoute] = useState('oral'); const [duration, setDuration] = useState('');
  const [equipment, setEquipment] = useState('');
  return <form className="praxis-med" onSubmit={e => {
    e.preventDefault(); send({ type: 'medication', id: med.id, dose: Number(dose), volume: Number(volume), route, duration: Number(duration), equipment, checks });
  }}>
    <h3>{med.name}</h3><p>Wirkstoff · ATC {med.atc} · Konzentration {med.concentration} {med.unit}/ml</p>
    <p className="note">{s.flags.orders === undefined ? 'Anordnung steht noch aus. Über „Team & Übergabe“ Rücksprache veranlassen.' : 'Anordnung liegt vor. Wortlaut im Verlauf nachlesen und vor Gabe abgleichen.'}</p>
    <div className="praxis-formgrid">
      <label>Dosis ({med.unit})<input required type="number" min="0.01" step="any" value={dose} onChange={e => setDose(e.target.value)} /></label>
      <label>Aufzuziehendes Volumen (ml)<input required type="number" min="0.01" step="any" value={volume} onChange={e => setVolume(e.target.value)} /></label>
      <label>Applikationsweg<select value={route} onChange={e => setRoute(e.target.value)}>{['oral', 'i.v.', 'i.m.', 's.c.', 'inhalativ'].map(r => <option key={r}>{r}</option>)}</select></label>
      <label>Applikationsdauer (Minuten)<input required type="number" min="0.1" max="240" step="any" value={duration} onChange={e => setDuration(e.target.value)} /></label>
      <label>Zubehör<select value={equipment} required onChange={e => setEquipment(e.target.value)}><option value="">Bitte auswählen</option>{['Spritze und i.v.-Zugang', 'Medikamentenbecher', 'Inhalationssystem', 'Insulinspritze'].map(x => <option key={x}>{x}</option>)}</select></label>
    </div>
    <fieldset><legend>8-R-Sicherheitsprüfung</legend>{CHECKS.map((label, i) => <label className="praxis-check" key={label}><input type="checkbox" checked={checks[i]} onChange={e => setChecks(checks.map((c, j) => j === i ? e.target.checked : c))} />{label}</label>)}</fieldset>
    <details><summary>Rechenhilfe</summary><p>Volumen (ml) = angeordnete Dosis ({med.unit}) ÷ Konzentration ({med.unit}/ml). Allergien und Organfunktion müssen zusätzlich klinisch geprüft werden; der Rechner bestimmt keine passende Dosis.</p></details>
    <button className="primary" disabled={s.done.includes(`med:${med.id}`)}>Geprüfte Gabe durchführen</button>
    <p className="muted">Fehlerhafte Eingaben werden abgefangen und im Debriefing aufgeführt. Auswahlmöglichkeiten bedeuten keine Freigabe aller Applikationswege.</p>
  </form>;
}

function Documentation({ send }: { send: (c: Command) => void }) {
  const [note, setNote] = useState(''); const [sbar, setSbar] = useState(['', '', '', '']);
  return <div className="praxis-documentation">
    <form onSubmit={e => { e.preventDefault(); send({ type: 'note', text: note }); if (note.trim().length >= 20) setNote(''); }}>
      <h3>Pflegebericht</h3><p className="muted">Beobachtung → Handlung → Wirkung. Nur fiktive Falldaten eintragen. Keine automatische inhaltliche Bewertung.</p>
      <label>Verlaufsdokumentation<textarea required minLength={20} maxLength={4000} rows={5} value={note} onChange={e => setNote(e.target.value)} placeholder="Was hast du beobachtet, getan und anschließend festgestellt?" /></label>
      <button>Pflegebericht speichern · 1 min</button>
    </form>
    <form onSubmit={e => { e.preventDefault(); send({ type: 'sbar', fields: sbar }); }}>
      <h3>Strukturierte SBAR-Übergabe</h3>
      {['Situation · Was ist gerade los?', 'Background · Welcher Hintergrund ist relevant?', 'Assessment · Wie schätzt du die Lage ein?', 'Recommendation · Was brauchst du als Nächstes?'].map((label, i) => <label key={label}>{label}<textarea required minLength={5} maxLength={1000} rows={2} value={sbar[i]} onChange={e => setSbar(sbar.map((x, j) => i === j ? e.target.value : x))} /></label>)}
      <button>SBAR übergeben · 1 min</button>
    </form>
  </div>;
}

function Timeline({ s }: { s: Session }) {
  const [all, setAll] = useState(false);
  const events = [...s.events].reverse();
  return <><ol className="praxis-timeline">{(all ? events : events.slice(0, 30)).map(e => <li key={e.id} className={e.kind === 'warning' ? 'is-warning' : e.kind === 'story' ? 'is-story' : ''}>
    <time>{clock(e.at)}</time><div><strong>{e.title}</strong>{e.detail && <p>{e.detail}</p>}</div>
  </li>)}</ol>{events.length > 30 && <button onClick={() => setAll(!all)}>{all ? 'Nur letzte 30 Einträge' : `Alle ${events.length} Einträge anzeigen`}</button>}</>;
}

const ESCALATION: Record<ReturnType<typeof clinicalDebrief>['escalation'], string> = {
  'kein Auslöser gemessen': 'Keine Messung hat einen NEWS2-Auslöser gezeigt. Wurde oft genug gemessen?',
  'nicht eskaliert': 'Ein auffälliger NEWS2 wurde gemessen, aber kein qualifiziertes Team hinzugezogen.',
  vorausschauend: 'Hilfe war schon organisiert, bevor der erste auffällige NEWS2 gemessen wurde.',
  zeitnah: 'Nach dem ersten auffälligen NEWS2 hast du innerhalb von zehn Minuten eskaliert.',
  verspätet: 'Zwischen auffälligem NEWS2 und Hilfe lagen mehr als zehn Minuten.',
};

/** Klinischer Rückblick: Ausgang, Eskalation, Komplikationen, Fehlhandlungen, Lernimpulse. */
function Klinik({ s }: { s: Session }) {
  const k = clinicalDebrief(s);
  return <section className="praxis-klinik" aria-label="Klinischer Verlauf">
    <h3>Klinischer Verlauf</h3>
    <p className={`praxis-outcome ${k.final.unstable ? 'is-warning' : 'is-stable'}`}><strong>{k.final.unstable ? 'Lage bei Abschluss nicht stabil' : 'Lage bei Abschluss stabil'}</strong>{k.final.text}{k.activeComplications.length > 0 && ` Noch aktiv: ${k.activeComplications.join(', ')}.`}</p>
    <div className="praxis-klinik__grid">
      <div><span className="eyebrow">Eskalation</span><strong>{k.escalation}{k.escalationMinutes ? ` · nach ${k.escalationMinutes} min` : ''}</strong><p>{ESCALATION[k.escalation]} Höchster gemessener NEWS2: {k.maxNews2}, bei Abschluss (Modellwerte): {k.final.news2}.</p></div>
      <div><span className="eyebrow">Komplikationen</span><strong>{k.complications.length} eingetreten · {k.prevented.length} verhindert</strong>
        <ul>{k.complications.map(c => <li key={c.id}>△ {c.title}</li>)}{k.prevented.map(c => <li key={c.id}>✓ {c.prevented ?? c.title}</li>)}</ul></div>
      <div><span className="eyebrow">Fehlhandlungen</span><strong>{k.harms.length ? `${k.harms.length} mit Folgen` : 'keine'}</strong>
        <ul>{k.harms.map(h => <li key={`${h.id}-${h.at}`}>{clock(h.at)} · {h.text}</li>)}</ul></div>
    </div>
    {(s.chart?.length ?? 0) > 0 && <><h4>NEWS2 und Vitalwerte im Verlauf</h4><VitalKurve chart={s.chart!} /></>}
    {s.scenario.teaching?.length ? <><h4>Merksätze zu diesem Fall</h4><ul>{s.scenario.teaching.map(t => <li key={t}>{t}</li>)}</ul></> : null}
    <p className="muted">NEWS2: {SOURCES.news2.title}. Verlauf und Komplikationen sind didaktische Modellregeln, keine validierte Physiologie.</p>
  </section>;
}

function Editor({ onStart }: { onStart: (s: Scenario) => void }) {
  const [json, setJson] = useState(''); const [error, setError] = useState('');
  return <details className="card praxis-editor"><summary>Szenario-Werkstatt · JSON bearbeiten und lokal ausprobieren</summary>
    <p>Für Lehrende: Szenario laden, Befunde, Maßnahmen und Kriterien anpassen. Änderungen werden nur lokal ausgeführt. JSON-Dateien können verborgene Falllösungen enthalten.</p>
    <label>Vorlage<select defaultValue="" onChange={e => { const s = SCENARIOS.find(x => x.id === e.target.value); if (s) setJson(JSON.stringify(s, null, 2)); }}><option value="">Vorlage auswählen</option>{SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
    <label>Szenario-JSON<textarea value={json} onChange={e => setJson(e.target.value)} rows={10} maxLength={200000} spellCheck={false} /></label>
    <label>JSON-Datei öffnen<input type="file" accept=".json,application/json" onChange={async e => {
      try { const f = e.target.files?.[0]; if (!f) return; if (f.size > 200000) throw new Error('Datei zu groß (maximal 200 kB).'); setJson(await f.text()); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Datei konnte nicht geöffnet werden.'); }
    }} /></label>
    <div className="row"><button onClick={() => { try { const s = parseScenario(json); setError(''); onStart(s); } catch (e) { setError(e instanceof Error ? e.message : 'Ungültiges Szenario.'); } }}>Eigenes Szenario testen</button>
      <button onClick={() => { try { const s = parseScenario(json); download(`${s.id}.json`, s); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Ungültiges Szenario.'); } }}>Szenario exportieren</button></div>
    {error && <p role="alert" className="note warn">{error}</p>}
  </details>;
}

export default function Praxissimulator() {
  const [initial] = useState(readSession);
  const [s, setSession] = useState<Session | null>(initial.session);
  const [error, setError] = useState(initial.error);
  const preserveUnreadable = useRef(!!initial.error);
  const [running, setRunning] = useState(false); const [speed, setSpeed] = useState(1);
  const [level, setLevel] = useState<1 | 2 | 3>(1); const [setting, setSetting] = useState('alle');
  const [panel, setPanel] = useState<Panel>('Patientenzimmer'); const [category, setCategory] = useState<Category>('untersuchung');
  const sessionRef = useRef(s); sessionRef.current = s;
  const archivedRef = useRef('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // An unreadable old save is preserved until the user deliberately starts a new case.
    if (!s && preserveUnreadable.current) return;
    const message = saveSession(s); if (message) setError(message);
    if (s?.phase === 'finished' && archivedRef.current !== s.id) { const message = archive(s); if (message) setError(message); else archivedRef.current = s.id; }
  }, [s, initial.error]);
  useEffect(() => {
    if (!running || s?.phase !== 'active') return;
    const timer = window.setInterval(() => setSession(previous => previous ? dispatch(previous, { type: 'advance', seconds: speed }) : previous), 1000);
    return () => clearInterval(timer);
  }, [running, speed, s?.phase]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    const persist = () => { if (sessionRef.current) saveSession(sessionRef.current); };
    document.addEventListener('visibilitychange', pause); window.addEventListener('pagehide', persist);
    return () => { document.removeEventListener('visibilitychange', pause); window.removeEventListener('pagehide', persist); };
  }, []);
  function send(command: Command) { setSession(previous => previous ? dispatch(previous, command) : previous); }
  function begin(scenario: Scenario) { preserveUnreadable.current = false; setSession(start(scenario, level)); setRunning(false); setPanel('Patientenzimmer'); setCategory('untersuchung'); setError(''); requestAnimationFrame(() => headingRef.current?.focus()); }
  const last = s ? [...s.events].reverse().find(e => e.kind !== 'state') ?? s.events.at(-1) : undefined;
  const active = s?.phase === 'active';
  return <section className="page praxis">
    <PageHeading eyebrow="Generalistische Pflegeausbildung" title="Praxissimulator" description="Beobachten. Entscheiden. Handeln. Ein eigener Übungsraum mit regelbasiertem Patientenverlauf – ohne KI und ohne API-Schlüssel." />
    <p className="praxis-disclaimer">Technische Lernvorschau · fachlich ungeprüft. Fiktive Szenarien mit vereinfachten Reaktionen, keine validierte Physiologiesimulation. Fachliche Freigabe durch qualifizierte Prüfer steht aus. Speicherung auf diesem Gerät.</p>
    {error && <p className="note warn" role="alert">{error}</p>}
    {!s && <>
      <div className="praxis-intro card"><div><span className="eyebrow">Deine nächste Schicht</span><h2>Ein Raum. Viele Entscheidungen.</h2><p>Übernimm einen Patienten, erhebe Befunde, organisiere Unterstützung und überprüfe die Wirkung deiner Maßnahmen. Die Simulationsuhr lässt sich jederzeit pausieren.</p></div><div className="praxis-intro__number"><strong>09</strong><span>Einsatzgebiete</span></div></div>
      <div className="praxis-filters">
        <label>Einrichtung<select value={setting} onChange={e => setSetting(e.target.value)}><option value="alle">Alle Einsatzgebiete</option>{Object.entries(SETTINGS).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select></label>
        <label>Ausbildungsstufe<select value={level} onChange={e => setLevel(Number(e.target.value) as 1 | 2 | 3)}><option value="1">1. Jahr · langsamer Verlauf, Lernziele sichtbar</option><option value="2">2. Jahr · regulärer Verlauf</option><option value="3">3. Jahr · schnellerer Verlauf</option></select></label>
      </div>
      <div className="praxis-scenarios">{SCENARIOS.filter(x => setting === 'alle' || x.setting === setting).map((scenario, index) => <article className="card praxis-scenario" key={scenario.id}>
        <div className="praxis-scenario__top"><span className="badge">{SETTINGS[scenario.setting]}</span><span className="muted" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
        <h3>{scenario.title}</h3><p>{scenario.situation}</p><small>{scenario.focus} · {scenario.id === 'nachtwache' ? 'Technischer Referenzfall' : 'Szenariovorschau'} · fachlich ungeprüft</small>
        {scenario.storyline?.length ? <small className="praxis-scenario__story">Verlauf mit {scenario.storyline.length} möglichen Ereignissen · Entscheidungen haben Folgen</small> : null}
        <button className="primary" onClick={() => begin(scenario)}>Schicht übernehmen</button>
      </article>)}</div>
      <Editor onStart={begin} />
      {readArchive().length > 0 && <details className="card"><summary>Abgeschlossene Übungen auf diesem Gerät</summary><ul>{readArchive().map(previous => <li key={previous.id}><button onClick={() => { setSession(previous); archivedRef.current = previous.id; }}>{previous.scenario.title} · {clock(previous.time)}</button></li>)}</ul><p className="muted">Die letzten zehn Abschlüsse bleiben im lokalen Archiv. Sie sind auch in der allgemeinen Datensicherung enthalten.</p></details>}
      <details className="card"><summary>Funktionsumfang und nächste Ausbauschritte</summary><p>Enthalten: {SCENARIOS.length} Lehrszenarien mit klinischem Verlauf (Komplikationen, Angehörige, Visite, Telefonate), Fehlhandlungen mit Folgen, NEWS2-Verlaufskurve mit Bewusstsein und Sauerstoff, Einzelpatient-Verlauf, verzögerte Diagnostik, strukturierte Gespräche, Untersuchungsbefunde als Text, Pflegehandlungen, eine Furosemid-Rechenübung, SBAR, Dokumentation, Ereignisverlauf und JSON-Werkstatt.</p><p>Noch ausstehend: fachlich validierte Dosis- und Interaktionsmodelle, Kreislaufstillstand und Reanimation, echte EKG-/Bilddaten, DICOM, Audios, formale MTS-/ESI-Triage, mehrere gleichzeitige Patienten, VR, Konten, serverseitiges RBAC, verschlüsselte mandantenfähige Speicherung und xAPI-/SCORM-Anbindung.</p><p>Der <a href="#/lernen/fall">Text-Fallsimulator</a> bleibt ein separates Angebot.</p></details>
    </>}
    {s && <>
      <header className="praxis-sessionhead"><div><span className="eyebrow">{SETTINGS[s.scenario.setting]} · Ausbildungsjahr {s.level}</span><h2 ref={headingRef} tabIndex={-1}>{s.scenario.title}</h2><p>{s.scenario.patient}, {s.scenario.age} Jahre · {s.scenario.weight} kg</p><small>Modell {s.scenario.model.version} · fachlich ungeprüft · Seed {s.seed}</small></div><div className="praxis-clock"><span>Simulationszeit</span><strong>{clock(s.time)}</strong><span>{active ? running ? 'Uhr läuft' : 'Uhr pausiert' : 'Fall beendet'}</span></div></header>
      {active ? <>
        <div className="praxis-controls" role="group" aria-label="Simulationssteuerung"><button className="primary" onClick={() => setRunning(!running)}>{running ? 'Uhr pausieren' : 'Uhr starten'}</button><label>Tempo<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="1">1× Echtzeit</option><option value="5">5×</option><option value="30">30× Zeitraffer</option></select></label>
          <button onClick={() => send({ type: 'advance', seconds: 60 })}>+1 Minute</button><button onClick={() => send({ type: 'advance', seconds: 300 })}>+5 Minuten</button>
          {RESOURCES[s.scenario.setting].longVisits && <button disabled={s.flags.care === undefined || s.flags.sbar === undefined || s.pending.length > 0} onClick={() => send({ type: 'advance', seconds: 86400 })}>Nächster Besuch · +1 Tag</button>}
          <button onClick={() => { setRunning(false); send({ type: 'finish' }); setPanel('Verlauf'); }}>Fall abschließen</button>
        </div>
        <p className="muted praxis-clockhint">Handlungen verbrauchen auch bei pausierter Uhr ihre angezeigte Simulationszeit. Beim Verlassen der Seite pausiert die Uhr. Tageswechsel erst nach Versorgung, SBAR und Abschluss offener Aufträge.</p>
        <section className="praxis-monitor" aria-label="Vitalparameter"><div className="praxis-monitor__heading"><strong>{s.monitoring ? 'Kontinuierliches Monitoring' : s.measuredAt === null ? 'Noch keine Messung' : `Letzte Messung · ${clock(s.measuredAt)}`}</strong><span>SpO₂: LOINC 59408-5 · keine Alarmgrenzen für die pädiatrische Bewertung</span></div>
          <dl>{VITALS.map(v => <div key={v.key}><dt>{v.label}</dt><dd>{format(s.measured[v.key], v.key)}<small>{v.unit}</small></dd></div>)}</dl>
          <News2Badge point={s.monitoring && s.measuredAt !== null ? { at: s.measuredAt, vitals: s.vitals, avpu: consciousness(s), oxygen: s.oxygen ?? false } : s.chart?.at(-1)} />
        </section>
        <div className={`praxis-feedback ${last?.kind === 'warning' ? 'is-warning' : last?.kind === 'story' ? 'is-story' : ''}`} role="status" aria-live="polite" aria-atomic="true"><strong>{last?.title}</strong><p>{last?.detail}</p></div>
        {s.pending.length > 0 && <details className="praxis-pending"><summary>{s.pending.length} offene Aufträge / Wirkungen</summary><ul>{s.pending.map(p => <li key={p.id}>{p.title} · fällig bei {clock(p.due)} (noch {Math.max(0, Math.ceil((p.due - s.time) / 60))} min)</li>)}</ul></details>}
        <nav className="praxis-panels" aria-label="Arbeitsbereich">{PANELS.map(p => <button key={p} aria-pressed={panel === p} onClick={() => setPanel(p)}>{p}</button>)}</nav>
        <div className="praxis-workspace">
          <section className="card praxis-main" aria-label={panel}>
            {panel === 'Patientenzimmer' && <><Room s={s} send={send} /><h3>Was tust du als Nächstes?</h3><div className="praxis-categories" role="group" aria-label="Maßnahmenkategorie">{Object.entries(CATEGORIES).filter(([k]) => k !== 'geraete' || RESOURCES[s.scenario.setting].devices).map(([k, label]) => <button key={k} aria-pressed={category === k} onClick={() => setCategory(k as Category)}>{label}</button>)}</div><div className="praxis-actions">{s.scenario.actions.filter(a => a.category === category).map(a => <button key={a.id} disabled={s.done.includes(a.id) && !a.repeatable} onClick={() => send({ type: 'action', id: a.id })}><span>{a.label}</span><small>{a.seconds < 60 ? `${a.seconds} s` : `${a.seconds / 60} min`}{a.delay ? ` · Befund +${a.delay / 60} min` : ''}{a.requires ? ' · Freigabe erforderlich' : ''}{s.done.includes(a.id) ? ' · durchgeführt' : ''}</small></button>)}{!s.scenario.actions.some(a => a.category === category) && <p>In dieser Einrichtung ist dafür kein Werkzeug hinterlegt.</p>}</div></>}
            {panel === 'Vitalkurve' && <><h3>Verlauf der Messungen</h3><p className="muted">Jede Messung, Nachkontrolle und Monitor-Minute. NEWS2 rechnet die App selbst (Skala 1, Bewusstsein nach ACVPU, Sauerstoff zählt mit 2 Punkten). Lokale Eskalationsregeln gehen vor.</p><VitalKurve chart={s.chart ?? []} /></>}
            {panel === 'Patientenakte' && <><h3>Aufnahme und Übergabe</h3><dl className="praxis-record">{[['S · Situation', s.scenario.situation], ['B · Hintergrund', s.scenario.background], ['A · Einschätzung aus der Übergabe', s.scenario.assessment], ['R · Empfehlung', s.scenario.recommendation], ['Allergien', s.scenario.allergies.join(', ') || 'Keine dokumentiert – aktiv erfragen'], ['Organfunktion', s.scenario.renal], ['Umgebung', s.scenario.environment]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>Befunde und Anordnungen</h3>{s.events.filter(e => e.kind === 'result').length ? s.events.filter(e => e.kind === 'result').map(e => <div key={e.id} className="praxis-result"><strong>{clock(e.at)} · {e.title}</strong><p>{e.detail}</p></div>) : <p>Noch keine Ergebnisse eingegangen.</p>}</>}
            {panel === 'Medikation' && (s.scenario.medications.length ? s.scenario.medications.map(m => <MedicationForm key={m.id} med={m} s={s} send={send} />) : <><h3>Medikationsschrank</h3><p>Für diesen Fall ist keine Arzneimittelgabe modelliert. Die Übung „Atemnot in der Nacht“ enthält eine vollständige Dosis- und Applikationsprüfung.</p><p>Es werden keine unbelegten Dosierungen aus Gewicht oder Nierenfunktion erzeugt.</p></>)}
            {panel === 'Dokumentation' && <Documentation send={send} />}
            {panel === 'Verlauf' && <><h3>Ereignisprotokoll</h3><Timeline s={s} /></>}
          </section>
          <aside className="card praxis-briefing"><span className="eyebrow">Dein Auftrag</span><h3>{s.scenario.focus}</h3><p>{s.scenario.situation}</p><p className="muted">{s.scenario.recommendation}</p>{s.level === 1 && <details open><summary>Lernziele für diesen Fall</summary><ul>{s.scenario.criteria.map(c => <li key={c.flag}>{c.label}</li>)}</ul></details>}<p className="muted">Du handelst als Pflegeauszubildende/r mit Praxisanleitung. Ärztliche Diagnostik und Medikation benötigen die im Fall hinterlegte Freigabe.</p><button onClick={() => download(`praxis-${s.scenario.id}-verlauf.json`, s)}>Verlauf als JSON sichern</button></aside>
        </div>
      </> : <div className="card praxis-debrief"><span className="eyebrow">Debriefing</span><h3>Deine Entscheidungen im Rückblick</h3><p>{debrief(s).filter(c => c.met).length} von {s.scenario.criteria.length} Szenariokriterien erfüllt · {s.events.filter(e => e.kind === 'warning').length} Warnungen · {s.pending.length} offene Aufträge bei Abschluss.</p><p className="muted">Die Auswertung prüft ausgeführte Handlungen und Zeitpunkte. Sie ist kein Kompetenznachweis. Freitexte und klinische Angemessenheit müssen mit einer Lehrperson reflektiert werden.</p>
        <ul className="praxis-criteria">{debrief(s).map(c => <li key={c.flag}><strong>{c.met ? '✓ Erfüllt' : c.late ? '△ Verspätet' : '○ Offen'} · {c.label}</strong>{c.at !== undefined && <span>{clock(c.at)}</span>}<p>{c.why}</p>{SOURCES[c.source].url ? <a href={SOURCES[c.source].url} target="_blank" rel="noreferrer">{SOURCES[c.source].title}</a> : <small>{SOURCES[c.source].title}</small>}</li>)}</ul>
        <Klinik s={s} />
        <h3>Zur gemeinsamen Reflexion</h3><p>Welche Veränderung hat deine Entscheidung ausgelöst? Welche Informationen haben gefehlt? Welche Maßnahme würdest du beim nächsten Durchlauf früher oder anders ausführen?</p><details><summary>Vollständige Timeline und Warnungen</summary><Timeline s={s} /></details><div className="row"><button onClick={() => { download(`praxis-${s.scenario.id}-verlauf.json`, s); }}>Verlauf exportieren</button><button onClick={() => download(`praxis-${s.scenario.id}-xapi-entwurf.json`, xapiDraft(s))}>xAPI-Entwurf exportieren</button><button onClick={() => { const result = replay(s); setError(JSON.stringify(result) === JSON.stringify(s) ? 'Replay geprüft: Zustand und Verlauf stimmen vollständig überein.' : 'Replay weicht ab. Bitte Verlauf für die technische Prüfung sichern.'); }}>Replay prüfen</button><button onClick={() => begin(s.scenario)}>Diesen Fall wiederholen</button><button className="primary" onClick={() => { setSession(null); setRunning(false); }}>Zur Fallauswahl</button></div><p className="muted">Der xAPI-Entwurf enthält eine zufällige Sitzungskennung, Ereignistypen und Simulationszeit, keine Berichtstexte. Eine LRS-Verbindung und geprüfte LMS-Konformität sind noch nicht vorhanden.</p>
      </div>}
    </>}
  </section>;
}
