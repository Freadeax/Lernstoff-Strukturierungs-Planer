import { useEffect, useRef, useState } from 'react';
import { getModule, modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { PageHeading } from '../../ui/PageHeading';
import { useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { session as shellSession } from '../../ui/shell/session';
import { PRAXIS_THEMEN, praxisZuThema } from './themen';
import { faelleZuKrankheit, krankheitenZuFall, PRAXIS_KRANKHEITEN } from '../krankheitsbilder/fallbezug';
import { SCENARIOS, RESOURCES } from './catalog';
import { CHECKS, clinicalDebrief, clock, consciousness, debrief, dispatch, ketten, replay, sbarPruefung, SOURCES, start, wegLabel } from './engine';
import { blick, handlungenFuer, RAUM_ELEMENTE, raumElemente, type RaumElement } from './raum';
import { News2Badge, VitalKurve } from './VitalKurve';
import { Szene } from './Szene';
import { FotoSzene } from './FotoSzene';
import { auftragsSchritte } from './auftrag';
import { falltiefe, falltiefeText } from './falltiefe';
import { freigabeFuer } from './freigaben';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import { automatischeWertung } from '../../ui/sim/freigabe';
import { Portraet } from '../../ui/sim/Portraet';
import { personFuer } from '../../ui/sim/personen';
import { raumFotoFuer } from './raumfotos';
import { PatientenMonitor } from '../../ui/sim/PatientenMonitor';
import { monitorGruppe } from '../../ui/sim/monitor';
import { SimTon } from '../../ui/audio/SimTon';
import { klangZuBefund, raumFuerSetting } from '../../ui/audio/klaenge';
import { HoerBeispiel } from '../../ui/audio/HoerBeispiel';
import { szene as szenenZustand } from './szene';
import { HandlungsVideo } from '../../ui/sim/HandlungsVideo';
import { HANDLUNGSVIDEOS, phasenBild, type HandlungsVideoId } from '../../ui/sim/handlungsvideos';
import './szene.css';
import { archive, download, parseScenario, readArchive, readSession, saveSession } from './storage';
import { xapiDraft } from './tracking';
import { SchichtAnsicht } from './Schicht';
import { beginneSchicht, leseSchicht, SCHICHTEN, speichereSchicht, type Schicht } from './schicht';
import { BEWERTET, KETTEN, SETTINGS, STORY_KINDS, type Action, type Command, type Medication, type Scenario, type Session, type Vital } from './types';
import './praxis.css';

/** Fachmodul mit Katalog (Steckbriefe); die Registry liefert den allgemeinen Modultyp. */
const katalog = (id: string) => (getModule(id) ?? modules[0]) as CatalogModule | undefined;

const VITALS: { key: Vital; label: string; unit: string }[] = [
  { key: 'pulse', label: 'Puls', unit: '/min' }, { key: 'spo2', label: 'SpO₂', unit: '%' },
  { key: 'sys', label: 'RR syst.', unit: 'mmHg' }, { key: 'dia', label: 'RR diast.', unit: 'mmHg' },
  { key: 'resp', label: 'Atemfrequenz', unit: '/min' }, { key: 'temp', label: 'Temperatur', unit: '°C' },
  { key: 'glucose', label: 'Blutzucker', unit: 'mg/dl' }, { key: 'pain', label: 'Schmerz', unit: 'NRS' },
];
const PANELS = ['Patientenzimmer', 'Vitalkurve', 'Patientenakte', 'Medikation', 'Dokumentation', 'Verlauf'] as const;
export type Panel = typeof PANELS[number];
const format = (value: number | undefined, key: Vital) => value === undefined ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: key === 'temp' ? 1 : 0 }).format(value);

/** Handlungsknöpfe: in Raumansicht und Liste identisch. */
function Handlungen({ s, actions, send }: { s: Session; actions: Action[]; send: (c: Command) => void }) {
  if (!actions.length) return <p className="muted">Hier ist in dieser Einrichtung kein Werkzeug hinterlegt.</p>;
  return <div className="praxis-actions">{actions.map(a => <button key={a.id} disabled={s.done.includes(a.id) && !a.repeatable} onClick={() => send({ type: 'action', id: a.id })}><span>{a.label}</span><small>{a.seconds < 60 ? `${a.seconds} s` : `${a.seconds / 60} min`}{a.delay ? ` · Befund +${a.delay / 60} min` : ''}{a.requires ? ' · Freigabe erforderlich' : ''}{s.done.includes(a.id) ? ' · durchgeführt' : ''}</small></button>)}</div>;
}

/** Pflegetechniken als Lernclip: nur ansehen, verändert den Fall nicht. */
function Lernclips() {
  const [offen, setOffen] = useState<HandlungsVideoId | null>(null);
  return <div className="praxis-lernclips"><h5>Pflegetechniken ansehen</h5>
    <div className="praxis-lernclips__liste">{(Object.keys(HANDLUNGSVIDEOS) as HandlungsVideoId[]).map(id => <button key={id} type="button" onClick={() => setOffen(id)}>
      <img src={phasenBild(id, 0)} alt="" width={160} height={90} loading="lazy" /><span>{HANDLUNGSVIDEOS[id].titel}</span></button>)}</div>
    <p className="muted">Ohne Zeitverbrauch und ohne Folgen im Fall.</p>
    {offen && <HandlungsVideo id={offen} onClose={() => setOffen(null)} />}
  </div>;
}

const ANSICHT_KEY = 'lernstoff.praxis.ansicht';
type Ansicht = 'foto' | 'raum' | 'liste';
function leseAnsicht(): Ansicht { try { const a = localStorage.getItem(ANSICHT_KEY); return a === 'liste' || a === 'raum' ? a : 'foto'; } catch { return 'foto'; } }

/**
 * Patientenzimmer: Patient, Monitor, Materialwagen und Telefon sind benutzbar. Ein Klick zeigt,
 * was man dort sofort wahrnimmt, und die Handlungen an diesem Element. Die Liste bietet dieselben
 * Elemente und Handlungen für Tastatur, Screenreader und kleine Displays.
 */
function Room({ s, send, element, ansicht, setAnsicht }: { s: Session; send: (c: Command) => void; element: RaumElement; ansicht: Ansicht; setAnsicht: (a: Ansicht) => void }) {
  const foto = !!raumFotoFuer(s.scenario.id);
  const info = raumElemente(s.scenario);
  return <div className="praxis-room">
    <div className="praxis-room__head"><p>{s.scenario.environment}</p>
      <div className="praxis-ansicht" role="group" aria-label="Darstellung des Zimmers">{foto && <button aria-pressed={ansicht === 'foto'} onClick={() => setAnsicht('foto')}>Foto</button>}<button aria-pressed={ansicht === 'raum' || (ansicht === 'foto' && !foto)} onClick={() => setAnsicht('raum')}>Zeichnung</button><button aria-pressed={ansicht === 'liste'} onClick={() => setAnsicht('liste')}>Liste</button></div></div>
    {ansicht !== 'liste' ? <>
      <section className="praxis-element" aria-labelledby="praxis-element-titel">
        <h4 id="praxis-element-titel">{info[element].label}</h4>
        <p className="praxis-blick">{blick(s, element)}</p>
        <Handlungen s={s} actions={handlungenFuer(s.scenario, element)} send={send} />
        {element === 'wagen' && <Lernclips />}
      </section>
    </> : <div className="praxis-liste">{RAUM_ELEMENTE.map(e => <section key={e} aria-labelledby={`praxis-liste-${e}`}>
      <h4 id={`praxis-liste-${e}`}>{info[e].label} <small>· {info[e].zweck}</small></h4>
      <p className="praxis-blick">{blick(s, e)}</p>
      <Handlungen s={s} actions={handlungenFuer(s.scenario, e)} send={send} />
    </section>)}</div>}
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
    <FreigabeHinweis freigabe={freigabeFuer(s.scenario)} ort="entscheidung" />
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

const KETTEN_STATUS: Record<ReturnType<typeof ketten>[number]['status'], { icon: string; text: string }> = {
  erfüllt: { icon: '✓', text: 'Geschlossen' },
  vorausschauend: { icon: '✓', text: 'Erledigt, bevor die Beobachtung erhoben war' },
  verspätet: { icon: '△', text: 'Verspätet' },
  fehlt: { icon: '✗', text: 'Beobachtet, aber keine Konsequenz' },
  'nicht beobachtet': { icon: '○', text: 'Nicht beobachtet' },
  'kein Anlass': { icon: '–', text: 'Kein Anlass im Verlauf' },
};

/** Kernfall: vollständig ausgearbeitet, fachliche Freigabe durch einen Menschen steht aus. */
export function KernHinweis({ scenario, offen = false }: { scenario: Scenario; offen?: boolean }) {
  const k = scenario.kern;
  if (!k) return null;
  return <details className="praxis-kern" open={offen}><summary><strong>Kernfall</strong> · vollständig ausgearbeitet · fachliche Freigabe {k.freigabe === 'erteilt' ? `erteilt${k.pruefer ? ` durch ${k.pruefer}` : ''}` : 'ausstehend'} · Stand {new Date(`${k.stand}T12:00:00`).toLocaleDateString('de-DE')}</summary>
    <p>Bewertungskriterien, Ketten von Beobachtung zu Entscheidung und alternative richtige Wege sind hinterlegt. {k.freigabe === 'erteilt' ? '' : 'Eine Pflegefachperson oder Lehrkraft muss den Fall noch fachlich prüfen. Offene Prüfpunkte:'}</p>
    {k.freigabe !== 'erteilt' && <ul>{k.pruefpunkte.map(p => <li key={p}>{p}</li>)}</ul>}
  </details>;
}

/** Welche Beobachtung zu welcher Entscheidung geführt hat, und wo Reevaluation oder Eskalation fehlten. */
function KettenAnsicht({ s }: { s: Session }) {
  const k = ketten(s);
  if (!k.length) return null;
  const fehlend = k.filter(x => !x.ok);
  const luecken = fehlend.filter(x => x.art !== 'entscheidung');
  return <div className="praxis-ketten">
    <h4>Beobachtung → Entscheidung</h4>
    <p>{k.filter(x => x.ok && x.status !== 'kein Anlass').length} von {k.filter(x => x.status !== 'kein Anlass').length} Ketten geschlossen. <span className="praxis-pruefart">Geprüft: Reihenfolge und Zeitpunkt, nicht die Qualität der Ausführung</span></p>
    {luecken.length > 0 && <p className="praxis-outcome is-warning"><strong>Hier fehlten erneute Beurteilung oder Eskalation</strong>{luecken.map(x => `${KETTEN[x.art]}: ${x.decision}`).join(' · ')}</p>}
    <ol className="praxis-kette">{k.filter(x => x.status !== 'kein Anlass').sort((a, b) => Number(a.ok) - Number(b.ok)).map(x => <li key={x.id} className={x.ok ? 'is-ok' : 'is-open'}>
      <span className="eyebrow">{KETTEN[x.art]}</span>
      <strong>{KETTEN_STATUS[x.status].icon} {KETTEN_STATUS[x.status].text}{x.status === 'verspätet' && x.minutes !== undefined ? ` · nach ${x.minutes} min` : ''}</strong>
      <dl>
        <div><dt>Beobachtung</dt><dd>{x.observation}{x.seenAt !== undefined ? <small> · {clock(x.seenAt)} über „{x.seenLabel}“</small> : <small> · {x.status === 'kein Anlass' ? 'im Verlauf nicht aufgetreten' : 'nicht erhoben'}</small>}</dd></div>
        <div><dt>Entscheidung</dt><dd>{x.decision}{x.taken ? <small> · {clock(x.taken.at)} über „{x.taken.label}“{x.minutes !== undefined ? ` (${x.minutes} min nach der Beobachtung)` : ''}</small> : <small> · {x.status === 'kein Anlass' ? 'nicht nötig' : 'fehlt'}</small>}</dd></div>
      </dl>
      {x.ways.length > 1 && <p className="muted">Richtige Wege: {x.ways.map(w => w.label).join(' oder ')}</p>}
      <p>{x.why}{x.within ? ` Zeitfenster im Fall: ${Math.round(x.within / 60)} min.` : ''}</p>
    </li>)}</ol>
    {k.some(x => x.status === 'kein Anlass') && <p className="muted">Ohne Anlass in deinem Verlauf: {k.filter(x => x.status === 'kein Anlass').map(x => x.observation).join(' · ')}.</p>}
  </div>;
}

/** SBAR in Kernfällen: Stichwortprüfung. Ausdrücklich keine Sinnprüfung. */
function SbarInhalt({ s }: { s: Session }) {
  const p = sbarPruefung(s);
  if (!p.checks.length) return null;
  return <div className="praxis-sbar-inhalt"><h4>SBAR-Inhalt</h4>
    <p><span className="praxis-pruefart">Geprüft: Stichworte je Feld, keine Sinnprüfung</span> {p.vorhanden ? `${p.checks.filter(c => c.met).length} von ${p.checks.length} erwarteten Inhalten gefunden.` : 'Keine SBAR-Übergabe abgegeben.'}</p>
    {p.vorhanden && <ul>{p.checks.map(c => <li key={c.label}>{c.met ? '✓' : '○'} {c.label}</li>)}</ul>}
    <p className="muted">Ob die Aussagen stimmen und gut formuliert sind, kann nur eine Lehrperson beurteilen.</p></div>;
}

/** Klinischer Rückblick: Ausgang, Eskalation, Komplikationen, Fehlhandlungen, Lernimpulse. */
export function Klinik({ s }: { s: Session }) {
  const k = clinicalDebrief(s);
  return <section className="praxis-klinik" aria-label="Klinischer Verlauf">
    <h3>Klinischer Verlauf</h3>
    <KettenAnsicht s={s} />
    <SbarInhalt s={s} />
    <p className={`praxis-outcome ${k.final.unstable ? 'is-warning' : 'is-stable'}`}><strong>{k.final.unstable ? 'Lage bei Abschluss nicht stabil' : 'Lage bei Abschluss stabil'}</strong>{k.final.text}{k.activeComplications.length > 0 && ` Noch aktiv: ${k.activeComplications.join(', ')}.`}</p>
    <div className="praxis-klinik__grid">
      <div><span className="eyebrow">Eskalation</span><strong>{k.escalation}{k.escalationMinutes ? ` · nach ${k.escalationMinutes} min` : ''}</strong><p>{ESCALATION[k.escalation]} Höchster gemessener NEWS2: {k.maxNews2}, bei Abschluss (Modellwerte): {k.final.news2}.</p></div>
      <div><span className="eyebrow">Komplikationen</span><strong>{k.complications.length} eingetreten · {k.prevented.length} verhindert</strong>
        <ul>{k.complications.map(c => <li key={c.id}>△ {c.title}</li>)}{k.prevented.map(c => <li key={c.id}>✓ {c.prevented ?? c.title}</li>)}</ul></div>
      <div><span className="eyebrow">Fehlhandlungen</span><strong>{k.harms.length ? `${k.harms.length} mit Folgen` : 'keine'}</strong>
        <ul>{k.harms.map(h => <li key={`${h.id}-${h.at}`}>{clock(h.at)} · {h.text}</li>)}</ul></div>
    </div>
    {(s.chart?.length ?? 0) > 0 && <><h4>NEWS2 und Vitalwerte im Verlauf</h4><VitalKurve chart={s.chart!} /></>}
    {k.decisions.length > 0 && <><h4>Deine Entscheidungen</h4><p><span className="praxis-pruefart">{BEWERTET.inhalt}: deine Auswahl wird mit der fachlich besten Option verglichen</span></p><ul className="praxis-decisions">{k.decisions.map(d => <li key={d.event} className={d.best ? 'is-best' : 'is-other'}><strong>{d.best ? '✓ Gut gewählt' : '△ Anders gewählt'} · {d.title}</strong><span>{clock(d.at)} · {d.label}</span><p>{d.why}</p>{!d.best && <p className="muted">Fachlich besser: {d.bestLabel}</p>}</li>)}</ul></>}
    {s.scenario.teaching?.length ? <><h4>Merksätze zu diesem Fall</h4><ul>{s.scenario.teaching.map(t => <li key={t}>{t}</li>)}</ul></> : null}
    <Weiterlernen id={s.scenario.id} />
    <p className="muted">NEWS2: {SOURCES.news2.title}. Verlauf und Komplikationen sind didaktische Modellregeln, keine validierte Physiologie.</p>
  </section>;
}

/** Rückbezug auf die Lernthemen des Falls: Themenseite, Karteikarten, Skript. */
function Weiterlernen({ id }: { id: string }) {
  const moduleId = useStore(shellSession, (x) => x.moduleId);
  const topics = (getModule(moduleId) ?? modules[0])?.topics ?? [];
  const ids = PRAXIS_THEMEN[id] ?? [];
  const profile = katalog(moduleId)?.diseaseProfiles ?? [];
  const steckbriefe = krankheitenZuFall(PRAXIS_KRANKHEITEN, id).flatMap(k => profile.filter(p => p.id === k));
  if (!ids.length) return null;
  return <div className="praxis-weiter"><h4>Weiterlernen zu diesem Fall</h4><p className="muted">Diese Lernthemen hat der Fall geübt. Lücken aus dem Debriefing schließt du am besten gleich dort.</p>
    <ul>{ids.map(t => <li key={t}><a href={`#/lernen/thema?id=${encodeURIComponent(t)}`}>{topics.find(x => x.id === t)?.name ?? t}</a><span className="praxis-weiter__links"><a href={`#/lernen/karten?thema=${encodeURIComponent(t)}`}>Karteikarten</a> · <a href={`#/lernen/skript?thema=${encodeURIComponent(t)}`}>Skript</a></span></li>)}</ul>
    {steckbriefe.length > 0 && <p>Krankheitsbild nachlesen: {steckbriefe.map((p, i) => <span key={p.id}>{i > 0 && ' · '}<a href={`#/lernen/krankheitsbilder?kb=${encodeURIComponent(p.id)}`}>{p.name}</a></span>)}</p>}</div>;
}

/** Entscheidungsmoment: Die Simulationsuhr steht, bis eine Option gewählt ist. */
function Entscheidung({ s, send }: { s: Session; send: (c: Command) => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const event = s.open?.length ? s.scenario.storyline?.find(e => e.id === s.open![0]) : undefined;
  useEffect(() => { if (event) ref.current?.focus(); }, [event?.id]);
  if (!event?.choices) return null;
  return <section className="card praxis-decision" aria-labelledby={`entscheidung-${event.id}`}>
    <span className="eyebrow">Entscheidungsmoment · Uhr angehalten</span>
    <h3 id={`entscheidung-${event.id}`} ref={ref} tabIndex={-1}>{STORY_KINDS[event.kind]}: {event.title}</h3>
    <p>{event.detail}</p>
    <div className="praxis-decision__choices">{event.choices.map(c => <button key={c.id} onClick={() => send({ type: 'choose', event: event.id, choice: c.id })}>{c.label}</button>)}</div>
    <p className="muted">Wähle, wie du reagierst. Die Folgen zeigen sich im weiteren Verlauf; die Begründung steht im Debriefing.</p>
    <FreigabeHinweis freigabe={freigabeFuer(s.scenario)} ort="entscheidung" />
  </section>;
}

/** „Dein Auftrag“ (Gestaltungsvorlage): Simulationszeit, vier Arbeitsschritte mit Stand, Weg zum Debriefing. */
function Auftrag({ s, uhrLaeuft, onAbschluss }: { s: Session; uhrLaeuft: boolean; onAbschluss: () => void }) {
  const schritte = auftragsSchritte(s);
  const person = personFuer('praxis', s.scenario.id);
  const z = szenenZustand(s);
  const zustand = z.komplikation || z.atemnot >= 2 || z.alarm === 'rot' ? 'kritisch' : z.atemnot >= 1 || z.schmerz >= 2 ? 'angestrengt' : 'stabil';
  const aktuell = schritte.findIndex(x => !x.erledigt);
  return <aside className="praxis-auftrag" aria-labelledby="praxis-auftrag-titel">
    <h3 id="praxis-auftrag-titel">Dein Auftrag</h3>
    <FreigabeHinweis freigabe={freigabeFuer(s.scenario)} ort="chip" />
    {person && <Portraet person={person} zustand={zustand} groesse={56} mitName className="praxis-auftrag__person" />}
    <p className={`praxis-auftrag__zeit ${uhrLaeuft ? 'is-laeuft' : ''}`}>Simulationszeit · {clock(s.time)} · {uhrLaeuft ? 'läuft' : 'pausiert'}</p>
    <p className="praxis-auftrag__ziel">{s.scenario.recommendation}</p>
    <ol className="praxis-auftrag__schritte">{schritte.map((x, i) => <li key={x.id} className={x.erledigt ? 'is-erledigt' : i === aktuell ? 'is-aktuell' : ''} aria-current={i === aktuell ? 'step' : undefined}>
      <span className="praxis-auftrag__marke" aria-hidden="true">{x.erledigt ? '✓' : i + 1}</span>
      <span><strong>{x.titel}</strong><span className="visually-hidden">{x.erledigt ? ' (erledigt)' : ' (offen)'}</span>{i === aktuell && <small>{x.hinweis}</small>}</span>
    </li>)}</ol>
    <h4>Nach dem Fall</h4>
    <button type="button" className="praxis-auftrag__ende" onClick={onAbschluss}>Fall abschließen und Debriefing ansehen</button>
  </aside>;
}

/** Ein Patient im Blick: Monitor, letzte Rückmeldung, Entscheidungsmoment, Arbeitsbereiche. Auch im Schichtmodus genutzt. */
export function Arbeitsplatz({ s, send, panel, setPanel, zeitraffer = 1, uhrLaeuft, onAbschluss }: { s: Session; send: (c: Command) => void; panel: Panel; setPanel: (p: Panel) => void; zeitraffer?: number; uhrLaeuft?: boolean; onAbschluss?: () => void }) {
  const last = [...s.events].reverse().find(e => e.kind !== 'state') ?? s.events.at(-1);
  const [element, setElement] = useState<RaumElement>('patient');
  const [ansicht, setAnsichtState] = useState(leseAnsicht);
  const setAnsicht = (a: Ansicht) => { setAnsichtState(a); try { localStorage.setItem(ANSICHT_KEY, a); } catch { /* nur Komfort */ } };
  const foto = raumFotoFuer(s.scenario.id);
  const fokussieren = (e: RaumElement) => { setElement(e); setPanel('Patientenzimmer'); };
  const z = szenenZustand(s);
  return <>
    <div className="audio-simton"><SimTon raum={raumFuerSetting(s.scenario.setting)} telefon={z.telefonKlingelt} alarm={z.alarm}
      monitor={s.monitoring ? { puls: s.measured.pulse, spo2: s.measured.spo2, aktiv: true } : null} /></div>
    <div className={`praxis-buehne ${onAbschluss ? 'mit-auftrag' : ''}`}>
      {ansicht !== 'liste' && (foto && ansicht === 'foto'
        ? <FotoSzene s={s} raum={foto} fokus={element} onFokus={fokussieren} zeitraffer={zeitraffer} onZeichnung={() => setAnsicht('raum')} />
        : <Szene s={s} fokus={element} onFokus={fokussieren} zeitraffer={zeitraffer} />)}
      {onAbschluss && <Auftrag s={s} uhrLaeuft={!!uhrLaeuft} onAbschluss={onAbschluss} />}
    </div>
    <section className="praxis-monitor" aria-label="Vitalparameter"><div className="praxis-monitor__heading"><strong>{s.monitoring ? 'Kontinuierliches Monitoring' : s.measuredAt === null ? 'Noch keine Messung' : `Letzte Messung · ${clock(s.measuredAt)}`}</strong><span>SpO₂: LOINC 59408-5 · keine Alarmgrenzen für die pädiatrische Bewertung</span></div>
      {s.monitoring
        ? <><PatientenMonitor className="praxis-monitor__live" gruppe={monitorGruppe(s.scenario.age)} titel={`Monitor · ${clock(s.time)}`} werte={{ puls: s.measured.pulse ?? null, af: s.measured.resp ?? null, spo2: s.measured.spo2 ?? null, sys: s.measured.sys ?? null, dia: s.measured.dia ?? null, temp: s.measured.temp ?? null, avpu: consciousness(s), sauerstoff: s.oxygen ?? false }} />
          <dl className="praxis-monitor__rest">{VITALS.filter(v => v.key === 'glucose' || v.key === 'pain').map(v => <div key={v.key}><dt>{v.label}</dt><dd>{format(s.measured[v.key], v.key)}<small>{v.unit}</small></dd></div>)}</dl></>
        : <dl>{VITALS.map(v => <div key={v.key}><dt>{v.label}</dt><dd>{format(s.measured[v.key], v.key)}<small>{v.unit}</small></dd></div>)}</dl>}
      {automatischeWertung(freigabeFuer(s.scenario))
        ? <News2Badge point={s.monitoring && s.measuredAt !== null ? { at: s.measuredAt, vitals: s.vitals, avpu: consciousness(s), oxygen: s.oxygen ?? false } : s.chart?.at(-1)} />
        : <div className="praxis-news2 is-empty"><strong>Keine automatische Wertung</strong><span>NEWS2 gilt nur für Erwachsene. Der Monitor nutzt das Kinderprofil seiner Altersgruppe (Quelle im Monitorkopf). Der Fall ist fachlich ungeprüft: Werte selbst mit Kinder-Normwerten einordnen.</span></div>}
    </section>
    <Entscheidung s={s} send={send} />
    <div className={`praxis-feedback ${last?.kind === 'warning' ? 'is-warning' : last?.kind === 'story' ? 'is-story' : ''}`} role="status" aria-live="polite" aria-atomic="true"><strong>{last?.title}</strong><p>{last?.detail}</p></div>
    {last?.detail === s.scenario.findings.listen && klangZuBefund(last.detail) && <div className="audio-simton"><HoerBeispiel key={last.id} id={klangZuBefund(last.detail)!} p={{ af: s.vitals.resp }} label="Befund anhören" /><span className="audio-simton__status">Vereinfachte Nachbildung, mehr im <a href="#/lernen/hoeren">Hör-Trainer</a>.</span></div>}
    {s.pending.length > 0 && <details className="praxis-pending"><summary>{s.pending.length} offene Aufträge / Wirkungen</summary><ul>{s.pending.map(p => <li key={p.id}>{p.title} · fällig bei {clock(p.due)} (noch {Math.max(0, Math.ceil((p.due - s.time) / 60))} min)</li>)}</ul></details>}
    <nav className="praxis-panels" aria-label="Arbeitsbereich">{PANELS.map(p => <button key={p} aria-pressed={panel === p} onClick={() => setPanel(p)}>{p}</button>)}</nav>
    <div className="praxis-workspace">
      <section className="card praxis-main" aria-label={panel}>
        {panel === 'Patientenzimmer' && <Room s={s} send={send} element={element} ansicht={ansicht} setAnsicht={setAnsicht} />}
        {panel === 'Vitalkurve' && <><h3>Verlauf der Messungen</h3><p className="muted">Jede Messung, Nachkontrolle und Monitor-Minute. NEWS2 rechnet die App selbst (Skala 1, Bewusstsein nach ACVPU, Sauerstoff zählt mit 2 Punkten). Lokale Eskalationsregeln gehen vor.</p><VitalKurve chart={s.chart ?? []} /></>}
        {panel === 'Patientenakte' && <><h3>Aufnahme und Übergabe</h3><dl className="praxis-record">{[['S · Situation', s.scenario.situation], ['B · Hintergrund', s.scenario.background], ['A · Einschätzung aus der Übergabe', s.scenario.assessment], ['R · Empfehlung', s.scenario.recommendation], ['Allergien', s.scenario.allergies.join(', ') || 'Keine dokumentiert – aktiv erfragen'], ['Organfunktion', s.scenario.renal], ['Umgebung', s.scenario.environment]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>Befunde und Anordnungen</h3>{s.events.filter(e => e.kind === 'result').length ? s.events.filter(e => e.kind === 'result').map(e => <div key={e.id} className="praxis-result"><strong>{clock(e.at)} · {e.title}</strong><p>{e.detail}</p></div>) : <p>Noch keine Ergebnisse eingegangen.</p>}</>}
        {panel === 'Medikation' && (s.scenario.medications.length ? s.scenario.medications.map(m => <MedicationForm key={m.id} med={m} s={s} send={send} />) : <><h3>Medikationsschrank</h3><p>Für diesen Fall ist keine Arzneimittelgabe modelliert. Die Übung „Atemnot in der Nacht“ enthält eine vollständige Dosis- und Applikationsprüfung.</p><p>Es werden keine unbelegten Dosierungen aus Gewicht oder Nierenfunktion erzeugt.</p></>)}
        {panel === 'Dokumentation' && <Documentation send={send} />}
        {panel === 'Verlauf' && <><h3>Ereignisprotokoll</h3><Timeline s={s} /></>}
      </section>
      <aside className="card praxis-briefing"><span className="eyebrow">Dein Auftrag</span><h3>{s.scenario.focus}</h3><p>{s.scenario.situation}</p><p className="muted">{s.scenario.recommendation}</p>{s.level === 1 && <details open><summary>Lernziele für diesen Fall</summary><ul>{s.scenario.criteria.map(c => <li key={c.flag}>{c.label}</li>)}</ul></details>}<p className="muted">Du handelst als Pflegeauszubildende/r mit Praxisanleitung. Ärztliche Diagnostik und Medikation benötigen die im Fall hinterlegte Freigabe.</p><button onClick={() => download(`praxis-${s.scenario.id}-verlauf.json`, s)}>Verlauf als JSON sichern</button></aside>
    </div>
  </>;
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
  const [schicht, setSchicht] = useState<Schicht | null>(leseSchicht);
  const [schichtOffen, setSchichtOffen] = useState(() => !!schicht && schicht.phase === 'active' && !s);
  const [running, setRunning] = useState(false); const [speed, setSpeed] = useState(1);
  const [level, setLevel] = useState<1 | 2 | 3>(1); const [setting, setSetting] = useState('alle');
  const [panel, setPanel] = useState<Panel>('Patientenzimmer');
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
  useEffect(() => { if (s?.open?.length) setRunning(false); }, [s?.open?.length]);
  useEffect(() => { const message = speichereSchicht(schicht); if (message) setError(message); }, [schicht]);
  function beginSchicht(id: string) { const v = SCHICHTEN.find(x => x.id === id); if (!v) return; setSchicht(beginneSchicht(v, SCENARIOS, level)); setSchichtOffen(true); requestAnimationFrame(() => window.scrollTo({ top: 0 })); }
  function send(command: Command) { setSession(previous => previous ? dispatch(previous, command) : previous); }
  function begin(scenario: Scenario) { preserveUnreadable.current = false; setSession(start(scenario, level)); setRunning(false); setPanel('Patientenzimmer'); setError(''); requestAnimationFrame(() => headingRef.current?.focus()); }
  // ?thema=<id> zeigt nur die Fälle zu einem Lernthema (Sprung aus Lernpfad oder Lernplan).
  const { params } = useRoute();
  const moduleId = useStore(shellSession, (x) => x.moduleId);
  const thema = params.get('thema') ?? '';
  // ?fall=<id> zeigt genau einen Fall (Sprung aus dem Fehlerheft).
  const fallParam = params.get('fall') ?? '';
  const zumFall = fallParam ? SCENARIOS.filter((x) => x.id === fallParam) : [];
  // ?kb=<kh.id> zeigt die Fälle zu einem Krankheitsbild (Sprung aus dem Steckbrief).
  const kb = params.get('kb') ?? '';
  const kbFaelle = kb ? faelleZuKrankheit(PRAXIS_KRANKHEITEN, kb) : [];
  const zumKb = SCENARIOS.filter((x) => kbFaelle.includes(x.id));
  const kbName = kb ? katalog(moduleId)?.diseaseProfiles?.find((p) => p.id === kb)?.name ?? kb : '';
  const zumThema = zumFall.length ? zumFall : zumKb.length ? zumKb : thema ? praxisZuThema(thema, SCENARIOS) : [];
  const themaName = thema ? (getModule(moduleId) ?? modules[0])?.topics.find((t) => t.id === thema)?.name ?? thema : '';
  const sichtbar = zumThema.length ? zumThema : SCENARIOS;
  const active = s?.phase === 'active';
  return <section className="page praxis">
    <PageHeading eyebrow="Generalistische Pflegeausbildung" title="Praxissimulator" description="Beobachten. Entscheiden. Handeln. Ein eigener Übungsraum mit regelbasiertem Patientenverlauf – ohne KI und ohne API-Schlüssel." />
    <p className="praxis-disclaimer">Technische Lernvorschau · fachlich ungeprüft. Fiktive Szenarien mit vereinfachten Reaktionen, keine validierte Physiologiesimulation. Fachliche Freigabe durch qualifizierte Prüfer steht aus. Speicherung auf diesem Gerät.</p>
    {error && <p className="note warn" role="alert">{error}</p>}
    {schicht && schichtOffen && <SchichtAnsicht schicht={schicht} setSchicht={setSchicht} onClose={() => { setSchichtOffen(false); if (schicht.phase === 'finished') setSchicht(null); }} />}
    {!s && !(schicht && schichtOffen) && <>
      <div className="praxis-intro card"><div><span className="eyebrow">Deine nächste Schicht</span><h2>Ein Raum. Viele Entscheidungen.</h2><p>Übernimm einen Patienten, erhebe Befunde, organisiere Unterstützung und überprüfe die Wirkung deiner Maßnahmen. Die Simulationsuhr lässt sich jederzeit pausieren.</p></div><div className="praxis-intro__number"><strong>{SCENARIOS.length}</strong><span>Fälle in 9 Einsatzgebieten</span></div></div>
      <div className="praxis-filters">
        <label>Einrichtung<select value={setting} onChange={e => setSetting(e.target.value)}><option value="alle">Alle Einsatzgebiete</option><option value="kern">Kernfälle · vollständig ausgearbeitet</option>{Object.entries(SETTINGS).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select></label>
        <label>Ausbildungsstufe<select value={level} onChange={e => setLevel(Number(e.target.value) as 1 | 2 | 3)}><option value="1">1. Jahr · langsamer Verlauf, Lernziele sichtbar</option><option value="2">2. Jahr · regulärer Verlauf</option><option value="3">3. Jahr · schnellerer Verlauf</option></select></label>
      </div>
      {zumFall.length > 0 && <p className="note" role="status">Fall aus deinem Fehlerheft: <strong>{zumFall[0]!.title}</strong>. <button type="button" className="link" onClick={() => navigate('/lernen/praxis')}>Alle Fälle zeigen</button></p>}
      {kb && !zumFall.length && <p className="note" role="status">{zumKb.length ? <>Fälle zum Krankheitsbild <strong>{kbName}</strong>. </> : <>Zum Krankheitsbild <strong>{kbName}</strong> gibt es noch keinen Praxisfall. </>}<button type="button" className="link" onClick={() => navigate('/lernen/praxis')}>Alle Fälle zeigen</button></p>}
      {thema && !zumFall.length && !zumKb.length && <p className="note" role="status">{zumThema.length ? <>Fälle zum Thema <strong>{themaName}</strong>. </> : <>Zum Thema <strong>{themaName}</strong> gibt es noch keinen Praxisfall. </>}<button type="button" className="link" onClick={() => navigate('/lernen/praxis')}>Alle Fälle zeigen</button></p>}
      <div className="praxis-scenarios">{sichtbar.filter(x => setting === 'alle' || (setting === 'kern' ? !!x.kern : x.setting === setting)).map((scenario, index) => <article className="card praxis-scenario" key={scenario.id}>
        <div className="praxis-scenario__top"><span className="badge">{SETTINGS[scenario.setting]}</span><span className="muted" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
        <h3>{scenario.title}</h3><p>{scenario.situation}</p><small>{scenario.focus} · {scenario.kern ? <strong className="praxis-kernmarke">Kernfall · vollständig ausgearbeitet · Freigabe {scenario.kern.freigabe === 'erteilt' ? 'erteilt' : 'ausstehend'}</strong> : 'Szenariovorschau · fachlich ungeprüft'}</small>
        <FreigabeHinweis freigabe={freigabeFuer(scenario)} ort="start" />
        <p className="praxis-scenario__tiefe"><strong>Falltiefe:</strong> {falltiefeText(falltiefe(scenario))}{scenario.storyline?.length ? ' · Entscheidungen haben Folgen' : ''}</p>
        <button className="primary" onClick={() => begin(scenario)}>Schicht übernehmen</button>
      </article>)}</div>
      <section className="praxis-schichtwahl card" aria-labelledby="schichtwahl"><span className="eyebrow">Neu · Schichtmodus</span><h2 id="schichtwahl">Mehrere Patienten, eine Uhr</h2><p>Übernimm zwei oder drei Patienten gleichzeitig. Während du bei einem bist, verändern sich die anderen weiter. Wer braucht dich zuerst? Was delegierst du? Am Ende zählt auch die Übergabe.</p>
        {schicht?.phase === 'active' && <p className="note"><strong>Laufende Schicht: {schicht.title}</strong> · Schichtzeit {clock(schicht.time)} <button className="primary small" onClick={() => setSchichtOffen(true)}>Fortsetzen</button></p>}
        <div className="praxis-schichtwahl__liste">{SCHICHTEN.map(v => <article key={v.id} className="praxis-schichtwahl__eintrag"><span className="badge">{v.setting}</span><h3>{v.title}</h3><p>{v.text}</p><small>{v.faelle.map(id => SCENARIOS.find(x => x.id === id)?.patient).filter(Boolean).join(' · ')}</small><button onClick={() => { if (schicht?.phase === 'active' && !window.confirm('Die laufende Schicht wird dabei verworfen. Neue Schicht beginnen?')) return; beginSchicht(v.id); }}>Schicht beginnen</button></article>)}</div>
      </section>
      <Editor onStart={begin} />
      {readArchive().length > 0 && <details className="card"><summary>Abgeschlossene Übungen auf diesem Gerät</summary><ul>{readArchive().map(previous => <li key={previous.id}><button onClick={() => { setSession(previous); archivedRef.current = previous.id; }}>{previous.scenario.title} · {clock(previous.time)}</button></li>)}</ul><p className="muted">Die letzten zehn Abschlüsse bleiben im lokalen Archiv. Sie sind auch in der allgemeinen Datensicherung enthalten.</p></details>}
      <details className="card"><summary>Funktionsumfang und nächste Ausbauschritte</summary><p>Kernfälle: je ein vollständig ausgearbeiteter Fall für Normalstation, Notaufnahme und ambulante Pflege mit Ketten von Beobachtung zu Entscheidung, alternativen richtigen Wegen und Angabe, was nur auf Vorliegen und was inhaltlich geprüft wird. Die fachliche Freigabe durch eine Pflegefachperson steht aus.</p><p>Enthalten: {SCENARIOS.length} Lehrszenarien mit klinischem Verlauf (Komplikationen, Angehörige, Visite, Telefonate), Fehlhandlungen mit Folgen, NEWS2-Verlaufskurve mit Bewusstsein und Sauerstoff, Entscheidungsmomente mit verzweigtem Verlauf, Schichtmodus mit mehreren Patienten gleichzeitig, verzögerte Diagnostik, strukturierte Gespräche, Untersuchungsbefunde als Text, Pflegehandlungen, eine Furosemid-Rechenübung, SBAR, Dokumentation, Ereignisverlauf und JSON-Werkstatt.</p><p>Noch ausstehend: fachliche Freigabe der Kernfälle, Orbit-Kamera für die Raumansicht, fachlich validierte Dosis- und Interaktionsmodelle, Kreislaufstillstand und Reanimation, echte EKG-/Bilddaten, DICOM, echte Auskultationsaufnahmen, formale MTS-/ESI-Triage, VR, Konten, serverseitiges RBAC, verschlüsselte mandantenfähige Speicherung und xAPI-/SCORM-Anbindung.</p><p>Der <a href="#/lernen/fall">Text-Fallsimulator</a> bleibt ein separates Angebot.</p></details>
    </>}
    {s && !(schicht && schichtOffen) && <>
      <header className="praxis-sessionhead"><div><span className="eyebrow">{SETTINGS[s.scenario.setting]} · Ausbildungsjahr {s.level}</span><h2 ref={headingRef} tabIndex={-1}>{s.scenario.title}</h2><p>{s.scenario.patient}, {s.scenario.age} Jahre · {s.scenario.weight} kg</p><small>Modell {s.scenario.model.version} · {s.scenario.kern ? 'Kernfall · fachliche Freigabe ausstehend' : 'fachlich ungeprüft'} · Seed {s.seed}</small></div><div className="praxis-clock"><span>Simulationszeit</span><strong>{clock(s.time)}</strong><span>{active ? running ? 'Uhr läuft' : 'Uhr pausiert' : 'Fall beendet'}</span></div></header>
      {active ? <>
        <div className="praxis-controls" role="group" aria-label="Simulationssteuerung"><button className="primary" onClick={() => setRunning(!running)}>{running ? 'Uhr pausieren' : 'Uhr starten'}</button><label>Tempo<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="1">1× Echtzeit</option><option value="5">5×</option><option value="30">30× Zeitraffer</option></select></label>
          <button onClick={() => send({ type: 'advance', seconds: 60 })}>+1 Minute</button><button onClick={() => send({ type: 'advance', seconds: 300 })}>+5 Minuten</button>
          {RESOURCES[s.scenario.setting].longVisits && <button disabled={s.flags.care === undefined || s.flags.sbar === undefined || s.pending.length > 0} onClick={() => send({ type: 'advance', seconds: 86400 })}>Nächster Besuch · +1 Tag</button>}
          <button onClick={() => { setRunning(false); send({ type: 'finish' }); setPanel('Verlauf'); }}>Fall abschließen</button>
        </div>
        <p className="muted praxis-clockhint">Handlungen verbrauchen auch bei pausierter Uhr ihre angezeigte Simulationszeit. Beim Verlassen der Seite pausiert die Uhr. Tageswechsel erst nach Versorgung, SBAR und Abschluss offener Aufträge.</p>
        <Arbeitsplatz s={s} send={send} panel={panel} setPanel={setPanel} zeitraffer={running ? speed : 1} uhrLaeuft={running} onAbschluss={() => { setRunning(false); send({ type: 'finish' }); setPanel('Verlauf'); }} />
      </> : <div className="card praxis-debrief"><span className="eyebrow">Debriefing</span><h3>Deine Entscheidungen im Rückblick</h3><p>{debrief(s).filter(c => c.met).length} von {s.scenario.criteria.length} Szenariokriterien erfüllt · {s.events.filter(e => e.kind === 'warning').length} Warnungen · {s.pending.length} offene Aufträge bei Abschluss.</p><p className="muted">Die Auswertung prüft ausgeführte Handlungen und Zeitpunkte. Sie ist kein Kompetenznachweis. Freitexte und klinische Angemessenheit müssen mit einer Lehrperson reflektiert werden.</p>
        <KernHinweis scenario={s.scenario} />
        <details className="praxis-legende"><summary>Was wurde wie bewertet?</summary><dl>
          <div><dt>{BEWERTET.vorliegen}</dt><dd>Die Handlung wurde ausgeführt oder ein Text liegt vor. Ob sie gut gemacht oder der Text richtig ist, prüft die App nicht.</dd></div>
          <div><dt>{BEWERTET.zeitpunkt}</dt><dd>Zusätzlich zählt, wann oder in welcher Reihenfolge du gehandelt hast, z. B. erneute Beurteilung erst nach der Maßnahme.</dd></div>
          <div><dt>{BEWERTET.inhalt}</dt><dd>Deine Auswahl in einem Entscheidungsmoment wird mit der fachlich besten Option verglichen. Pflegebericht und SBAR-Freitext werden nie inhaltlich bewertet; in Kernfällen prüft die App bei SBAR nur Stichworte.</dd></div>
        </dl></details>
        <ul className="praxis-criteria">{debrief(s).map(c => <li key={c.flag}><strong>{c.met ? '✓ Erfüllt' : c.late ? '△ Verspätet' : '○ Offen'} · {c.label}</strong>{c.at !== undefined && <span>{clock(c.at)}</span>}<small className="praxis-pruefart">{c.pruefung}</small>{c.via && <small>Erfüllt über: {c.via}</small>}{c.anyOf?.length && !c.met ? <small>Richtige Wege: {[c.flag, ...c.anyOf].map(f => wegLabel(s.scenario, f)).join(' oder ')}</small> : null}<p>{c.why}</p>{SOURCES[c.source].url ? <a href={SOURCES[c.source].url} target="_blank" rel="noreferrer">{SOURCES[c.source].title}</a> : <small>{SOURCES[c.source].title}</small>}</li>)}</ul>
        <Klinik s={s} />
        <h3>Zur gemeinsamen Reflexion</h3><p>Welche Veränderung hat deine Entscheidung ausgelöst? Welche Informationen haben gefehlt? Welche Maßnahme würdest du beim nächsten Durchlauf früher oder anders ausführen?</p><details><summary>Vollständige Timeline und Warnungen</summary><Timeline s={s} /></details><div className="row"><button onClick={() => { download(`praxis-${s.scenario.id}-verlauf.json`, s); }}>Verlauf exportieren</button><button onClick={() => download(`praxis-${s.scenario.id}-xapi-entwurf.json`, xapiDraft(s))}>xAPI-Entwurf exportieren</button><button onClick={() => { const result = replay(s); setError(JSON.stringify(result) === JSON.stringify(s) ? 'Replay geprüft: Zustand und Verlauf stimmen vollständig überein.' : 'Replay weicht ab. Bitte Verlauf für die technische Prüfung sichern.'); }}>Replay prüfen</button><button onClick={() => begin(s.scenario)}>Diesen Fall wiederholen</button><button className="primary" onClick={() => { setSession(null); setRunning(false); }}>Zur Fallauswahl</button></div><p className="muted">Der xAPI-Entwurf enthält eine zufällige Sitzungskennung, Ereignistypen und Simulationszeit, keine Berichtstexte. Eine LRS-Verbindung und geprüfte LMS-Konformität sind noch nicht vorhanden.</p>
      </div>}
    </>}
  </section>;
}
