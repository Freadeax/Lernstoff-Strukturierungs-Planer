// Praxissimulator neu – Abschluss und Auswertung (Paket P5).
// Abschluss: Pflegebedarf erheben und priorisieren, in Spur B Verdacht mit Begründung, SBAR-Übergabe.
// Auswertung: Prozent je Kompetenzbereich (PflAPrV) bzw. klinischem Bereich, verpasste kritische Pflichthandlungen,
// gemeinsame AuswertungsKarte, Zeitleiste der Werte mit eigenen Handlungen, Leitfaden mit Quellen, Weiterlernen,
// Weitergabe in Übergabe/Bericht/Pflegeplanung, optional KI-Tutor. Alle Fachlogik steckt in kern/auswertung.ts.

import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiKey } from '../../../core/settings';
import type { CatalogModule } from '../../../modules/catalog-types';
import { getModule, modules } from '../../../modules/registry';
import { DatenHinweis } from '../../../ui/DatenHinweis';
import { useStore } from '../../../ui/lib/store';
import { session as shellSession } from '../../../ui/shell/session';
import { AuswertungsKarte } from '../../../ui/sim/AuswertungsKarte';
import { bewerte, uebergabeBausteine, type BereichErgebnis, type KernAuswertung, type Zeitleiste as ZeitleisteDaten } from '../kern/auswertung';
import { alarmFuer } from '../kern/physiologie/altersprofile';
import type { SimZustand } from '../kern/kern';
import type { SbarTeil, SimEventEingabe } from '../kern/typen';
import { SBAR_TEILE, uhrzeit } from './ansicht';
import { simAuswertungNeu } from './auswertung-karte';
import { frageTutor, tutorKontext, type TutorNachricht } from './tutor';
import { weiterLinkNeu } from './weitergabe';
import { WEITERLERNEN_V2 } from './weiterlernen';

/* ─────────────────────────── Abschluss ─────────────────────────── */

export function Abschluss({ z, onSenden, onZurueck, ende }: { z: SimZustand; onSenden: (e: SimEventEingabe) => void; onZurueck: () => void; ende?: boolean }) {
  const [probleme, setProbleme] = useState<string[]>([]);
  const [ziele, setZiele] = useState<string[]>([]);
  const [verdacht, setVerdacht] = useState('');
  const [begruendung, setBegruendung] = useState<string[]>([]);
  const [sbar, setSbar] = useState<string[]>([]);
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const um = (l: string[], set: (x: string[]) => void, id: string) => set(l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  const schiebe = (i: number, d: -1 | 1) => setProbleme((l) => {
    const j = i + d;
    if (j < 0 || j >= l.length) return l;
    const n = [...l];
    [n[i], n[j]] = [n[j]!, n[i]!];
    return n;
  });
  const pb = z.fall.pflegebedarf;
  const v = z.fall.verdacht;
  const bausteine = uebergabeBausteine(z);
  const text = (id: string) => pb.probleme.find((p) => p.id === id)?.text ?? id;

  return <section className="ap-abschluss" aria-labelledby="ap-abschluss">
    {z.ende && <p className="note">{z.ende.text}</p>}
    <h2 id="ap-abschluss" ref={kopf} tabIndex={-1}>Fall abschließen</h2>
    <p className="muted">Pflegebedarf erheben ist eine vorbehaltene Aufgabe von Pflegefachpersonen (§ 4 PflBG). Als Auszubildende übst du sie unter Verantwortung deiner Praxisanleitung.</p>

    <fieldset><legend>1. Welche Pflegeprobleme und Risiken siehst du?</legend>
      {pb.probleme.map((p) => <label key={p.id}><input type="checkbox" checked={probleme.includes(p.id)} onChange={() => um(probleme, setProbleme, p.id)} /> {p.text}</label>)}
    </fieldset>
    {probleme.length > 1 && <section className="ap-reihenfolge" aria-labelledby="ap-reihenfolge">
      <h3 id="ap-reihenfolge">2. Priorisieren: Was ist am dringendsten?</h3>
      <p className="muted">Ganz oben steht, was zuerst angegangen werden muss.</p>
      <ol>{probleme.map((id, i) => <li key={id}>
        <span>{text(id)}</span>
        <span className="ap-reihenfolge__knoepfe">
          <button type="button" className="small" disabled={i === 0} onClick={() => schiebe(i, -1)} aria-label={`${text(id)} nach oben`}>↑</button>
          <button type="button" className="small" disabled={i === probleme.length - 1} onClick={() => schiebe(i, 1)} aria-label={`${text(id)} nach unten`}>↓</button>
        </span>
      </li>)}</ol>
    </section>}
    <fieldset><legend>{probleme.length > 1 ? '3' : '2'}. Welche Pflegeziele passen?</legend>
      {pb.ziele.map((p) => <label key={p.id}><input type="checkbox" checked={ziele.includes(p.id)} onChange={() => um(ziele, setZiele, p.id)} /> {p.text}</label>)}
    </fieldset>

    {v && <>
      <fieldset><legend>Dein Verdacht</legend>
        {v.optionen.map((o) => <label key={o.id}><input type="radio" name="ap-verdacht" checked={verdacht === o.id} onChange={() => setVerdacht(o.id)} /> {o.text}</label>)}
      </fieldset>
      <fieldset><legend>Woran machst du ihn fest?</legend>
        {v.begruendungen.map((b) => <label key={b.id}><input type="checkbox" checked={begruendung.includes(b.id)} onChange={() => um(begruendung, setBegruendung, b.id)} /> {b.text}</label>)}
      </fieldset>
    </>}

    <fieldset className="ap-uebergabe"><legend>Übergabe nach SBAR: Was gibst du weiter?</legend>
      <p className="muted">Nur was du erhoben hast, steht zur Wahl. Die Empfehlung formulierst du im Übergabetrainer.</p>
      {(['S', 'B', 'A'] as SbarTeil[]).map((t) => {
        const l = bausteine.filter((b) => b.teil === t);
        const info = SBAR_TEILE.find((x) => x.id === t)!;
        return l.length > 0 && <div key={t} className="ap-uebergabe__teil">
          <p className="ap-uebergabe__kopf"><b>{t}</b> {info.titel}</p>
          {l.map((b) => <label key={b.id}><input type="checkbox" checked={sbar.includes(b.id)} onChange={() => um(sbar, setSbar, b.id)} /> {b.text}</label>)}
        </div>;
      })}
    </fieldset>

    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={() => onSenden({ art: 'abschluss', probleme, ziele, sbar, ...(v ? { verdacht: verdacht || undefined, begruendung } : {}) })}>Abschließen und auswerten</button>
      {!ende && <button type="button" onClick={onZurueck}>Zurück zum Fall</button>}
    </div>
  </section>;
}

/* ─────────────────────────── Auswertung ─────────────────────────── */

const katalog = (id: string) => (getModule(id) ?? modules[0]) as CatalogModule | undefined;

export function Auswertung({ z, onZurueck, onNeu }: { z: SimZustand; onZurueck: () => void; onNeu: () => void }) {
  const a = useMemo(() => bewerte(z), [z]);
  const karte = useMemo(() => simAuswertungNeu(z, a), [z, a]);
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const fall = z.fall;
  const uhr = (t: number) => uhrzeit(fall.startUhrzeit, t);
  const pb = fall.pflegebedarf;
  const gewaehlt = z.abschluss?.probleme ?? [];
  const quelle = (id: string) => fall.quellen.find((q) => q.id === id);

  return <section className="ap-ende" aria-labelledby="ap-ende">
    <p className="eyebrow">Fall beendet · {uhr(z.t)} · Spur {fall.spur}</p>
    <h2 id="ap-ende" ref={kopf} tabIndex={-1}>{fall.titel}</h2>
    {z.ende && z.ende.ausgang !== 'abgeschlossen' && <p className={`note ${['verschlechtert', 'verstorben'].includes(z.ende.ausgang) ? 'warn' : ''}`}>{z.ende.text}</p>}

    <div className="ap-gesamt">
      <p className="ap-gesamt__zahl"><strong>{a.gesamt} %</strong> <span>insgesamt</span></p>
      <p className="muted">Gewichtet nach Pflichthandlungen (1 bis 3), Abzüge für Pflegefehler, Grenzüberschreitungen und konkrete Tipps. Denkanstöße der Praxisanleitung zählen nicht ({a.paImpulse} genutzt).</p>
    </div>

    {a.verpassteKritische.length > 0 && <section className="ap-kritisch" aria-labelledby="ap-kritisch">
      <h3 id="ap-kritisch"><span aria-hidden="true">✗ </span>Verpasste kritische Pflichthandlungen</h3>
      <ul>{a.verpassteKritische.map((v) => <li key={v.id}>
        <strong>{v.text}</strong> <span className="ap-kritisch__zeit">{v.ausBedingung ? `spätestens ${uhr(v.bisT)}` : `bis Fallende (${uhr(v.bisT)})`}</span>
        <p>{v.warum}</p>
      </li>)}</ul>
    </section>}

    <Bereiche titel="Kompetenzbereiche (PflAPrV)" liste={a.kb} prefix="KB " />
    {a.klinisch.length > 0 && <Bereiche titel="Klinische Bereiche (Spur B)" liste={a.klinisch} />}

    <AuswertungsKarte a={karte} titel="Was gut lief und was du verbessern kannst" />

    <section aria-labelledby="ap-zeitleiste" className="ap-zl-block">
      <h3 id="ap-zeitleiste">Zeitleiste</h3>
      <p className="muted">So haben sich die Werte im Lernmodell entwickelt, auch die, die du nicht gemessen hast. Striche oben: deine Handlungen; rot: Pflegefehler oder Grenzüberschreitung.</p>
      <Zeitleiste zl={a.zeitleiste} z={z} />
    </section>

    <section aria-labelledby="ap-pb">
      <h3 id="ap-pb">Pflegebedarf</h3>
      <ul className="ap-ende__liste">{pb.probleme.map((p) => {
        const rang = gewaehlt.indexOf(p.id);
        return <li key={p.id} className={(rang >= 0) === p.richtig ? 'is-ok' : 'is-fehlt'}>
          <strong>{rang >= 0 ? `Gewählt (Platz ${rang + 1})` : 'Nicht gewählt'}: {p.text}</strong>
          <p>{p.richtig ? `Trifft zu${p.prioritaet ? `, Priorität ${p.prioritaet}` : ''}.` : 'Trifft nicht zu.'} {p.warum}</p>
        </li>;
      })}</ul>
      {fall.verdacht && <p><strong>Verdacht:</strong> {fall.verdacht.optionen.find((o) => o.id === z.abschluss?.verdacht)?.text ?? 'keiner angegeben'}. Fachlich passend: {fall.verdacht.optionen.filter((o) => o.richtig).map((o) => o.text).join(', ')}.</p>}
    </section>

    {fall.leitfaden.length > 0 && <section className="ap-leitfaden" aria-labelledby="ap-leitfaden">
      <h3 id="ap-leitfaden">Lernleitfaden</h3>
      {fall.leitfaden.map((l) => <details key={l.titel}>
        <summary>{l.titel}</summary>
        <p>{l.text}</p>
        {l.quellen?.length ? <p className="muted">Quellen: {l.quellen.map((id) => quelle(id)?.titel ?? id).join(' · ')}</p> : null}
      </details>)}
      <details>
        <summary>Alle Quellen zum Fall</summary>
        <ul>{fall.quellen.map((q) => <li key={q.id}>{q.url ? <a href={q.url} target="_blank" rel="noreferrer">{q.titel}</a> : q.titel}{q.fundstelle ? `, ${q.fundstelle}` : ''}</li>)}</ul>
      </details>
    </section>}

    <Weiterlernen fallId={fall.id} />

    <section className="praxis-weiter praxis-doku" aria-labelledby="ap-doku">
      <h3 id="ap-doku">Diesen Fall dokumentieren</h3>
      <p className="muted">Die Trainer übernehmen deinen Verlauf: sichtbare Werte, deine Maßnahmen und erhaltene Anordnungen. Geprüft wird nur, was in deinem Spiel vorkam.</p>
      <ul>
        <li><a href={weiterLinkNeu('uebergabe', fall)}>Übergabe an den Folgedienst</a><span className="praxis-weiter__links">SBAR mit Prüfung</span></li>
        <li><a href={weiterLinkNeu('bericht', fall)}>Pflegebericht schreiben</a><span className="praxis-weiter__links">Beobachtung, Maßnahme, Wirkung</span></li>
        <li><a href={weiterLinkNeu('pflegeplanung', fall)}>Pflegeplanung zu diesem Fall</a><span className="praxis-weiter__links">als eigener Fall</span></li>
      </ul>
    </section>

    <Tutor z={z} a={a} />

    <p className="ap-hinweis">Lernmodell: Werte und Verlauf sind vereinfacht. Fall fachlich {fall.freigabe.status === 'geprueft' ? 'geprüft' : 'noch nicht geprüft'}.</p>
    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={onNeu}>Noch einmal</button>
      <button type="button" onClick={onZurueck}>Zur Fallauswahl</button>
    </div>
  </section>;
}

function Bereiche({ titel, liste, prefix = '' }: { titel: string; liste: BereichErgebnis[]; prefix?: string }) {
  return <section className="ap-bereiche" aria-label={titel}>
    <h3>{titel}</h3>
    <ul>{liste.map((b) => <li key={b.id} className={b.prozent === null ? 'is-leer' : b.prozent >= 90 ? 'is-gut' : b.prozent >= 60 ? 'is-teilweise' : 'is-fehler'}>
      <span className="ap-bereiche__name"><b>{prefix}{b.id.length <= 3 ? b.id : ''}</b>{b.id.length <= 3 ? ' ' : ''}{b.name}</span>
      <span className="ap-bereiche__balken" aria-hidden="true"><span style={{ width: `${b.prozent ?? 0}%` }} /></span>
      <span className="ap-bereiche__zahl">{b.prozent === null ? 'nicht beurteilt' : `${b.prozent} %`}</span>
    </li>)}</ul>
  </section>;
}

/* ─────────────────────────── Zeitleiste ─────────────────────────── */

type Reihe = { key: 'hf' | 'rrSys' | 'spo2' | 'af' | 'temp' | 'map' | 'laktat'; label: string; einheit: string; span: number };
const REIHEN: Reihe[] = [
  { key: 'hf', label: 'Puls', einheit: '/min', span: 30 },
  { key: 'rrSys', label: 'RR syst.', einheit: 'mmHg', span: 30 },
  { key: 'spo2', label: 'SpO₂', einheit: '%', span: 6 },
  { key: 'af', label: 'Atemfrequenz', einheit: '/min', span: 8 },
  { key: 'temp', label: 'Temperatur', einheit: '°C', span: 1.5 },
  { key: 'map', label: 'MAP', einheit: 'mmHg', span: 20 },
  { key: 'laktat', label: 'Laktat', einheit: 'mmol/l', span: 2 },
];
const de = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });

function Zeitleiste({ zl, z }: { zl: ZeitleisteDaten; z: SimZustand }) {
  const p = zl.punkte;
  const ende = Math.max(zl.ende, 60);
  const x = (t: number) => 2 + (t / ende) * 296;
  const auffaellig = (r: Reihe, n: number) => (r.key === 'map' ? n < 65 : r.key === 'laktat' ? n > 2 : alarmFuer(r.key, n, z.fall.altersgruppe) !== 'ok');
  const reihen = REIHEN.filter((r) => p.some((q) => typeof q[r.key] === 'number'));
  const eigene = zl.marken.filter((m) => m.art !== 'ereignis');
  const uhr = (t: number) => uhrzeit(z.fall.startUhrzeit, t);
  return <div className="ap-zl">
    <div className="ap-zl__reihe ap-zl__marken">
      <span className="ap-zl__label">Handlungen <small>{eigene.length}</small></span>
      <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {zl.marken.map((m, i) => <line key={i} x1={x(m.t)} x2={x(m.t)} y1={m.art === 'ereignis' ? 10 : 2} y2="18"
          className={m.art === 'fehler' || m.art === 'grenze' ? 'is-fehler' : m.art === 'ereignis' ? 'is-ereignis' : m.ausgefuehrt ? '' : 'is-nicht'} vectorEffect="non-scaling-stroke" />)}
      </svg>
    </div>
    {reihen.map((r) => {
      const werte = p.map((q) => q[r.key] as number | undefined);
      const da = werte.filter((w): w is number => typeof w === 'number');
      const lo0 = Math.min(...da), hi0 = Math.max(...da);
      const mitte = (lo0 + hi0) / 2, halb = Math.max(r.span, hi0 - lo0) / 2 * 1.15;
      const lo = mitte - halb, hi = mitte + halb;
      const y = (n: number) => 34 - ((n - lo) / (hi - lo)) * 30;
      const letzte = da.at(-1)!;
      const warn = da.some((n) => auffaellig(r, n));
      return <div className="ap-zl__reihe" key={r.key}>
        <span className="ap-zl__label">{r.label}<strong className={auffaellig(r, letzte) ? 'is-warn' : ''}>{de(letzte)} <small>{r.einheit}</small></strong>
          <small>{de(lo0)}–{de(hi0)}{warn ? ' · zeitweise auffällig' : ''}</small></span>
        <svg viewBox="0 0 300 38" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polyline points={p.flatMap((q) => (typeof q[r.key] === 'number' ? [`${x(q.t)},${y(q[r.key] as number)}`] : [])).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>;
    })}
    <p className="ap-zl__achse muted" aria-hidden="true"><span>{uhr(0)}</span><span>{uhr(zl.ende)}</span></p>
    <details>
      <summary>Deine Handlungen und Ereignisse ({zl.marken.length})</summary>
      <ol className="ap-zl__liste">{zl.marken.map((m, i) => <li key={i} className={`is-${m.art}`}>
        <time>{uhr(m.t)}</time> {m.art === 'fehler' ? 'Pflegefehler: ' : m.art === 'grenze' ? '' : m.art === 'ereignis' ? 'Ereignis: ' : ''}{m.text}{m.ausgefuehrt ? '' : ' (nicht ausgeführt)'}
      </li>)}</ol>
    </details>
    <details>
      <summary>Werte als Tabelle ({p.length})</summary>
      <div className="praxis-kurve__table"><table>
        <thead><tr><th scope="col">Zeit</th>{reihen.map((r) => <th scope="col" key={r.key}>{r.label}</th>)}</tr></thead>
        <tbody>{p.map((q) => <tr key={q.t}><td>{uhrzeit(z.fall.startUhrzeit, q.t, true)}</td>{reihen.map((r) => <td key={r.key}>{typeof q[r.key] === 'number' ? de(q[r.key] as number) : '–'}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}

/* ─────────────────────────── Weiterlernen ─────────────────────────── */

function Weiterlernen({ fallId }: { fallId: string }) {
  const moduleId = useStore(shellSession, (x) => x.moduleId);
  const e = WEITERLERNEN_V2[fallId];
  if (!e) return null;
  const kat = katalog(moduleId);
  const topics = (getModule(moduleId) ?? modules[0])?.topics ?? [];
  const profile = kat?.diseaseProfiles ?? [];
  return <section className="praxis-weiter" aria-labelledby="ap-weiter">
    <h3 id="ap-weiter">Weiterlernen zu diesem Fall</h3>
    <ul>{e.themen.map((t) => <li key={t}><a href={`#/lernen/thema?id=${encodeURIComponent(t)}`}>{topics.find((x) => x.id === t)?.name ?? t}</a>
      <span className="praxis-weiter__links"><a href={`#/lernen/karten?thema=${encodeURIComponent(t)}`}>Karteikarten</a> · <a href={`#/lernen/skript?thema=${encodeURIComponent(t)}`}>Skript</a></span></li>)}
      {e.extra?.map((x) => <li key={x.path}><a href={`#${x.path}`}>{x.label}</a><span className="praxis-weiter__links">{x.warum}</span></li>)}
    </ul>
    {e.krankheiten.length > 0 && <p>Krankheitsbild nachlesen: {e.krankheiten.map((k, i) => <span key={k}>{i > 0 && ' · '}<a href={`#/lernen/krankheitsbilder?kb=${encodeURIComponent(k)}`}>{profile.find((p) => p.id === k)?.name ?? k}</a></span>)}</p>}
  </section>;
}

/* ─────────────────────────── KI-Tutor (optional) ─────────────────────────── */

function Tutor({ z, a }: { z: SimZustand; a: KernAuswertung }) {
  const apiKey = getApiKey();
  const [verlauf, setVerlauf] = useState<TutorNachricht[]>([]);
  const [frage, setFrage] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const kontext = useMemo(() => tutorKontext(z, a), [z, a]);
  async function senden(text: string) {
    const f = text.trim();
    if (!f || laeuft) return;
    setLaeuft(true); setFehler('');
    try {
      const antwort = await frageTutor(apiKey, kontext, verlauf, f);
      setVerlauf((v) => [...v, { rolle: 'du', text: f }, { rolle: 'tutor', text: antwort }]);
      setFrage('');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Anfrage hat nicht geklappt.');
    } finally { setLaeuft(false); }
  }
  return <details className="ap-tutor">
    <summary>Mit dem KI-Tutor nachbesprechen (optional)</summary>
    {!apiKey ? <p className="muted">Dafür brauchst du einen API-Schlüssel in den <a href="#/einstellungen">Einstellungen</a>. Ohne Schlüssel bleibt alles auf diesem Gerät.</p> : <>
      <DatenHinweis art="ki" detail="Gesendet werden nur dieser erfundene Fall, dein Spielverlauf, der Musterweg, die Auswertung und der Leitfaden, kein Lernstand." />
      {verlauf.length > 0 && <ol className="ap-tutor__verlauf" aria-live="polite">{verlauf.map((n, i) => <li key={i} className={`is-${n.rolle}`}><strong>{n.rolle === 'du' ? 'Du' : 'Tutor'}:</strong> {n.text}</li>)}</ol>}
      {verlauf.length === 0 && <div className="ap-tutor__vorschlaege">
        {['Was hätte ich zuerst tun sollen?', 'Erklär mir meinen größten Fehler.', 'Warum war das wichtig für die Person?'].map((v) => <button key={v} type="button" className="small" disabled={laeuft} onClick={() => void senden(v)}>{v}</button>)}
      </div>}
      <form onSubmit={(e) => { e.preventDefault(); void senden(frage); }} className="ap-tutor__form">
        <label htmlFor="ap-tutor-frage" className="visually-hidden">Deine Frage an den Tutor</label>
        <input id="ap-tutor-frage" type="text" value={frage} onChange={(e) => setFrage(e.target.value)} placeholder="Deine Frage zum Fall" disabled={laeuft} />
        <button type="submit" className="primary" disabled={laeuft || !frage.trim()}>{laeuft ? 'Denkt nach …' : 'Fragen'}</button>
      </form>
      {fehler && <p className="note warn" role="alert">{fehler}</p>}
    </>}
  </details>;
}
