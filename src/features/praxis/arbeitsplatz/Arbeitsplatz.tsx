// Praxissimulator neu – Arbeitsplatz (Paket P2): ein Bildschirm für Stufe 2 auf dem neuen Kern.
// Links bzw. oben die Situation (Raumfoto mit Hotspots, Werteleiste, Uhr, Team), rechts bzw. unten
// der Handlungsraum (6 Reiter + Suche). Alle Fachlogik steckt im Kern; diese Datei zeigt nur an
// und schickt Eingaben (über ansicht.ts → kern.ts).
// iPhone: Variante A (E8 noch offen): Foto oben, schrumpft beim Scrollen zu einem kleinen Bild in der
// mitlaufenden Werteleiste, Reiter unten.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Vorlesen } from '../../../ui/audio/Vorlesen';
import { wenigBewegung } from '../../../ui/shell/session';
import type { MonitorGruppe } from '../../../ui/sim/monitor';
import { RaumBuehne, type Hotspot } from '../../../ui/sim/raeume/RaumBuehne';
import { RAEUME, raumUrl, type RaumId } from '../../../ui/sim/raeume/katalog';
import { anzeige, type SimZustand } from '../kern/kern';
import type { FallV2, Reiter, Rolle, SbarTeil, SimEventEingabe } from '../kern/typen';
import {
  anordnungen, bettAnzeige, beginne, dauer, FREIGABE_TEXT, handlungen, hatPflegetasche, lageText, offeneEntscheidung,
  pflegetasche, REITER, rekonstruiere, ROLLE_TEXT, sbarBausteine, SBAR_TEILE, spule, STUFE_TEXT, suche, team, uebersicht,
  uhrzeit, wende, werteleiste, type Arbeitsstand, type Handlung,
} from './ansicht';
import { lies, schreibe } from './speicher';
import { StreifenKurve } from './StreifenKurve';
import './arbeitsplatz.css';

type Tempo = 0 | 1 | 2 | 4;
/** Logik-Takt des Kerns: alle 5 s Spielzeit ein Schritt (KONZEPT 3.1). */
const TAKT = 5;

const GRUPPE: Record<FallV2['altersgruppe'], MonitorGruppe> = {
  saeugling: 'saeugling', kleinkind: 'kleinkind', schulkind: 'schulkind', jugendlich: 'erwachsen', erwachsen: 'erwachsen', hochbetagt: 'erwachsen',
};
const SETTING_TEXT: Record<FallV2['setting'], string> = {
  krankenhaus: 'Station', langzeit: 'Pflegeheim', ambulant: 'Hausbesuch', paediatrie: 'Kinderstation', psychiatrie: 'Psychiatrie',
  notaufnahme: 'Notaufnahme', schockraum: 'Schockraum', intensiv: 'Intensivstation', imc: 'IMC', aufwachraum: 'Aufwachraum',
};

const alterText = (f: FallV2) => f.person.alter.jahre !== undefined ? `${f.person.alter.jahre}` : `${f.person.alter.monate ?? 0} Monate`;
const istRaum = (id: string): id is RaumId => id in RAEUME;

export function Arbeitsplatz({ fall, onZurueck }: { fall: FallV2; onZurueck: () => void }) {
  const gespeichert = useMemo(() => lies(fall), [fall]);
  const [stand, setStand] = useState<Arbeitsstand | null>(null);
  const aendere = useCallback((f: (s: Arbeitsstand) => Arbeitsstand) => setStand((s) => (s ? f(s) : s)), []);
  const [rolle, setRolle] = useState<Rolle>(gespeichert?.rolle ?? fall.geeignet.rollen.find((r) => r !== 'pflegefachperson') ?? 1);

  useEffect(() => {
    if (!stand) return;
    schreibe({ version: 1, fall: fall.id, fallVersion: fall.version, rolle: stand.z.rolle, stufe: stand.z.stufe, seed: stand.z.seed, eingaben: stand.z.eingaben });
  }, [stand, fall]);

  if (!stand) {
    return <Briefing fall={fall} rolle={rolle} setRolle={setRolle} onZurueck={onZurueck}
      fortsetzen={gespeichert && gespeichert.eingaben.length > 0 ? () => { setStand(rekonstruiere(fall, gespeichert.rolle, gespeichert.stufe, gespeichert.seed, gespeichert.eingaben)); window.scrollTo({ top: 0 }); } : undefined}
      onStart={() => { schreibe(null); setStand(beginne(fall, rolle, 2)); window.scrollTo({ top: 0 }); }} />;
  }
  return <Platz stand={stand} setStand={aendere} onZurueck={onZurueck}
    onNeu={() => { schreibe(null); setStand(null); }} />;
}

/* ─────────────────────────── Briefing ─────────────────────────── */

function Briefing({ fall, rolle, setRolle, onStart, fortsetzen, onZurueck }: {
  fall: FallV2; rolle: Rolle; setRolle: (r: Rolle) => void; onStart: () => void; fortsetzen?: () => void; onZurueck: () => void;
}) {
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const rollen = fall.geeignet.rollen.filter((r) => fall.spur === 'B' || r !== 'pflegefachperson');
  return <div className="ap-briefing">
    <button type="button" className="ghost small" onClick={onZurueck}>‹ Zur Fallauswahl</button>
    <p className="eyebrow">Neuer Arbeitsplatz · Vorschau · Spur {fall.spur} · {SETTING_TEXT[fall.setting]}</p>
    <h2 ref={kopf} tabIndex={-1}>{fall.titel}</h2>
    <p className="ap-briefing__kurz">{fall.person.name}, {alterText(fall)} · {fall.kurz}</p>
    <section className="ap-briefing__karte" aria-labelledby="ap-uebernahme">
      <h3 id="ap-uebernahme">Übernahme</h3>
      <p>{fall.rahmen}</p>
      <blockquote>{fall.uebernahme}</blockquote>
      <Vorlesen text={`${fall.rahmen} ${fall.uebernahme}`} label="Übernahme vorlesen" />
    </section>
    <fieldset className="ap-briefing__rolle">
      <legend>Deine Rolle</legend>
      {rollen.map((r) => <label key={String(r)}><input type="radio" name="ap-rolle" checked={rolle === r} onChange={() => setRolle(r)} /> {r === 'pflegefachperson' ? 'Pflegefachperson' : `Auszubildende im ${r}. Drittel`}</label>)}
      <p className="muted">Die Rolle bestimmt, was du selbst darfst, was nur mit Praxisanleitung geht und was eine ärztliche Anordnung braucht.</p>
    </fieldset>
    <p className="muted">Stufe 2: Die Uhr läuft, du kannst anhalten und vorspulen. Deine Praxisanleitung hilft auf Nachfrage. Dauer etwa {fall.dauerMin[0]} bis {fall.dauerMin[1]} Minuten Spielzeit.</p>
    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={onStart}>{fortsetzen ? 'Neu beginnen' : 'Fall beginnen'}</button>
      {fortsetzen && <button type="button" onClick={fortsetzen}>Fortsetzen</button>}
    </div>
    <p className="ap-hinweis" role="note">Lernmodell: Werte und Verlauf sind vereinfacht. Fall fachlich {fall.freigabe.status === 'geprueft' ? 'geprüft' : 'noch nicht geprüft'}. Speicherung nur auf diesem Gerät.</p>
  </div>;
}

/* ─────────────────────────── Arbeitsplatz ─────────────────────────── */

function Platz({ stand, setStand, onZurueck, onNeu }: {
  stand: Arbeitsstand; setStand: (f: (s: Arbeitsstand) => Arbeitsstand) => void; onZurueck: () => void; onNeu: () => void;
}) {
  const { z } = stand;
  const fall = z.fall;
  const [tempo, setTempo] = useState<Tempo>(1);
  const [reiter, setReiter] = useState<Reiter>('beobachten');
  const [suchtext, setSuchtext] = useState('');
  const [tascheOffen, setTascheOffen] = useState(false);
  const [abschluss, setAbschluss] = useState(false);
  /** Meldungen seit der letzten eigenen Eingabe */
  const [seit, setSeit] = useState(z.meldungen.length);
  const [fotoWeg, setFotoWeg] = useState(false);
  const fotoRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const apRef = useRef<HTMLDivElement>(null);
  const leisteRef = useRef<HTMLDivElement>(null);
  const rueckRef = useRef<HTMLElement>(null);
  const [zeigeRueck, setZeigeRueck] = useState(0);

  const entscheidung = offeneEntscheidung(z);
  const laeuft = tempo > 0 && !z.ende && !entscheidung;

  // Uhr: alle TAKT/tempo Sekunden einen Logik-Schritt. Im Hintergrund-Tab nichts tun.
  useEffect(() => {
    if (!laeuft) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setStand((s) => wende(s, { art: 'warten', sek: TAKT }));
    }, (TAKT * 1000) / tempo);
    return () => window.clearInterval(id);
  }, [laeuft, tempo, setStand]);

  // iPhone (Variante A): Ist das große Foto aus dem Bild gescrollt, erscheint es klein in der Werteleiste.
  useEffect(() => {
    const el = fotoRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setFotoWeg(!!e && !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0, rootMargin: '-160px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [!!z.ende, abschluss]);

  // Höhe der mitlaufenden Werteleiste, damit die Reiter darunter kleben (schmale Ansicht).
  useEffect(() => {
    const el = leisteRef.current, ap = apRef.current;
    if (!el || !ap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => ap.style.setProperty('--ap-leiste-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  });

  // Nach einer eigenen Eingabe die Rückmeldung sichtbar machen (z. B. Antwort der Ärztin unter dem SBAR-Baukasten).
  useEffect(() => {
    if (zeigeRueck) rueckRef.current?.scrollIntoView({ block: 'nearest', behavior: wenigBewegung() ? 'auto' : 'smooth' });
  }, [zeigeRueck]);

  function eingabe(e: SimEventEingabe) {
    setSeit(z.meldungen.length);
    setZeigeRueck((n) => n + 1);
    setStand((s) => wende(s, e));
  }

  const alle = useMemo(() => handlungen(z), [z]);
  const liste = suchtext.trim() ? suche(alle, suchtext) : alle.filter((h) => h.reiter === reiter);
  const tasche = pflegetasche(z);
  const neu = z.meldungen.slice(seit);
  const raum = istRaum(fall.medien.raum) ? fall.medien.raum : undefined;

  const hotspots: Hotspot[] = [];
  if (raum) {
    const vorschlaege = RAEUME[raum].hotspots;
    const person = vorschlaege[0];
    if (person) hotspots.push({ id: 'person', label: `${fall.person.name}: beobachten und einschätzen`, kurz: fall.person.name.split(' ').pop(), x: person.x, y: person.y, onClick: () => zeigeReiter('beobachten') });
    const mon = vorschlaege.find((h) => h.id.includes('monitor'));
    if (mon && !hatPflegetasche(fall)) hotspots.push({ id: 'monitor', label: 'Monitor: messen', kurz: 'Monitor', x: mon.x, y: mon.y, onClick: () => zeigeReiter('messen') });
    if (hatPflegetasche(fall)) {
      const t = vorschlaege.find((h) => h.id.includes('tasche'));
      hotspots.push({ id: 'tasche', label: 'Pflegetasche öffnen', kurz: '🎒 Tasche', x: Math.min(t?.x ?? 0.97, 0.97), y: t?.y ?? 0.8, gedrueckt: tascheOffen, onClick: () => setTascheOffen((o) => !o) });
    }
  }

  function zeigeReiter(r: Reiter) {
    setSuchtext('');
    setReiter(r);
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: false }));
  }

  function tabTaste(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? REITER.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const ziel = REITER[(n + REITER.length) % REITER.length]!;
    setSuchtext(''); setReiter(ziel.id);
    document.getElementById(`ap-tab-${ziel.id}`)?.focus();
  }

  if (z.ende) {
    if (!z.abschluss) return <Abschluss z={z} onSenden={(e) => eingabe(e)} onZurueck={() => undefined} ende />;
    return <Ende z={z} onZurueck={onZurueck} onNeu={onNeu} />;
  }
  if (abschluss) return <Abschluss z={z} onSenden={(e) => { eingabe(e); setAbschluss(false); }} onZurueck={() => setAbschluss(false)} />;

  const werte = werteleiste(stand);
  const bett = bettAnzeige(stand);
  const zeit = uhrzeit(fall.startUhrzeit, z.t);
  const a = anzeige(z);
  const klinikMonitor = (fall.start.sichtbar?.length ?? 0) > 0;

  return <div ref={apRef} className={`ap ${fotoWeg ? 'is-foto-weg' : ''}`}>
    <div className="ap__situation">
      <header className="ap-kopf">
        <button type="button" className="ap-kopf__zurueck ghost" onClick={onZurueck} aria-label="Zur Fallauswahl">‹</button>
        <div className="ap-kopf__text">
          <h2>{fall.person.name}, {alterText(fall)} · {SETTING_TEXT[fall.setting]}</h2>
          <p>{fall.titel} · Spur {fall.spur}</p>
        </div>
        <span className="ap-kopf__rolle">{ROLLE_TEXT(z.rolle)} · {STUFE_TEXT[z.stufe]}</span>
      </header>

      <div className="ap-foto" ref={fotoRef}>
        {raum ? <RaumBuehne raum={raum} hotspots={hotspots} ort={SETTING_TEXT[fall.setting]}
          monitor={klinikMonitor ? { zustand: 'laeuft', gruppe: GRUPPE[fall.altersgruppe], werte: { puls: a.hf, spo2: a.spo2, af: a.af, sys: a.rrSys, dia: a.rrDia, temp: a.temp, avpu: a.avpu } } : undefined}
          fallback={<p className="ap-foto__fallback">{lageText(z)}</p>}>
          {bett && <span className="ap-bett" style={{ left: `${(RAEUME[raum].hotspots[0]?.x ?? 0.3) * 100}%`, top: `${((RAEUME[raum].hotspots[0]?.y ?? 0.3) + 0.14) * 100}%` }}>{bett}</span>}
        </RaumBuehne> : <p className="ap-foto__fallback">{lageText(z)}</p>}
        {tascheOffen && <Pflegetasche geraete={tasche} onHolen={(g) => eingabe({ art: 'pflegetasche', geraet: g })} onSchliessen={() => setTascheOffen(false)} />}
      </div>
      <p className="ap-lage"><strong>Jetzt:</strong> {lageText(z)} <span className="muted">Das Foto ist ein Beispielbild.</span></p>

      <div className="ap-leiste" ref={leisteRef}>
        <button type="button" className="ap-leiste__mini" tabIndex={fotoWeg ? 0 : -1} aria-hidden={!fotoWeg}
          aria-label="Zum Raumfoto" onClick={() => fotoRef.current?.scrollIntoView({ block: 'start' })}>
          {raum && <img src={raumUrl(raum)} alt="" width={64} height={36} />}
        </button>
        {fotoWeg && (klinikMonitor || stand.messungen.spo2?.live) && <StreifenKurve art={klinikMonitor ? 'ekg' : 'pleth'} puls={a.hf} aktiv={laeuft} />}
        <dl className="ap-werte" aria-label="Werte">
          {werte.map((w) => <div key={w.id} className={`ap-wert is-${w.stand} is-${w.alarm}`}>
            <dt>{w.label}</dt>
            <dd>{w.text}<span className="visually-hidden"> {w.stand === 'offen' ? 'noch nicht gemessen' : `${w.einheit}${w.zeit ? `, gemessen ${w.zeit}` : ', laufend'}${w.alarm !== 'ok' ? `, Alarm ${w.alarm}` : ''}`}</span></dd>
          </div>)}
        </dl>
        <div className="ap-uhr" role="group" aria-label="Uhr">
          <span className="ap-uhr__zeit" aria-label={`Uhrzeit ${zeit}${laeuft ? ', Uhr läuft' : ', Uhr steht'}`}>{zeit}</span>
          <button type="button" aria-pressed={tempo === 0} onClick={() => setTempo(0)} aria-label="Pause">❚❚</button>
          {([1, 2, 4] as const).map((t) => <button key={t} type="button" aria-pressed={tempo === t} onClick={() => setTempo(t)} aria-label={`Tempo ${t}-fach`}>{t}×</button>)}
          <button type="button" disabled={!!z.ende || !!entscheidung} onClick={() => { setSeit(z.meldungen.length); setStand((s) => spule(s)); }}
            title="Stoppt bei Ereignis, Alarm oder Rückfrage"><span aria-hidden="true">⏩ </span>5 Min.</button>
        </div>
      </div>

      <ul className="ap-team" aria-label="Team">
        {team(z).map((p) => <li key={p.wer} className={`ap-team__zeile is-${p.wer}`}>
          <span className="ap-team__kuerzel" aria-hidden="true">{p.kuerzel}</span>
          <div className="ap-team__text"><strong>{p.name}</strong>{p.text ? <p>{p.text}</p> : <p className="muted">{p.wer === 'pa' ? 'Ist in der Nähe.' : p.wer === 'aerztin' ? `Erreichbar: ${fall.arzt.erreichbar === 'hausarzt-praxis' ? 'Praxis per Telefon' : fall.arzt.erreichbar}` : 'Noch nichts.'}</p>}</div>
          {p.wer === 'pa' && z.stufe < 3 && <button type="button" className="small" onClick={() => eingabe({ art: 'pa-fragen' })}>PA fragen</button>}
          {p.wer === 'aerztin' && <button type="button" className="small" onClick={() => zeigeReiter('melden')}>Anrufen</button>}
        </li>)}
      </ul>
      <details className="ap-verlauf">
        <summary>Verlauf ({z.meldungen.length})</summary>
        <ol>{[...z.meldungen].reverse().map((m, i) => <li key={z.meldungen.length - i}><time>{uhrzeit(fall.startUhrzeit, m.t)}</time> {m.text}</li>)}</ol>
      </details>
    </div>

    <div className="ap__handlung">
      <div className="ap-reiter" role="tablist" aria-label="Was willst du tun?">
        {REITER.map((r, i) => <button key={r.id} id={`ap-tab-${r.id}`} type="button" role="tab" aria-selected={!suchtext && reiter === r.id}
          aria-controls="ap-panel" tabIndex={reiter === r.id ? 0 : -1} onKeyDown={(e) => tabTaste(e, i)} onClick={() => zeigeReiter(r.id)}>
          <span aria-hidden="true">{r.symbol}</span>{r.kurz}
        </button>)}
      </div>

      {entscheidung ? <Entscheidung z={z} onWahl={(wahl) => eingabe({ art: 'entscheidung', ereignis: entscheidung.id, wahl })} /> : <>
        {neu.length > 0 && <section ref={rueckRef} className="ap-rueckmeldung" aria-label="Rückmeldung">
          {neu.map((m, i) => <p key={seit + i} className={`is-${m.art}`}><time>{uhrzeit(fall.startUhrzeit, m.t)}</time> {m.text}</p>)}
        </section>}
        <div className="ap-suche">
          <label className="visually-hidden" htmlFor="ap-suche">Was willst du tun?</label>
          <input id="ap-suche" type="search" placeholder="🔍 Was willst du tun?" value={suchtext} onChange={(e) => setSuchtext(e.target.value)} />
        </div>
        <ul className="ap-legende" aria-label="Befugnis">
          <li className="ap-badge is-frei">selbst</li><li className="ap-badge is-mit-pa">mit PA</li><li className="ap-badge is-braucht-anordnung">braucht Anordnung</li><li className="ap-badge is-grenze">ärztlich</li>
        </ul>
        <div id="ap-panel" ref={panelRef} role="tabpanel" tabIndex={-1} aria-labelledby={suchtext ? undefined : `ap-tab-${reiter}`} aria-label={suchtext ? 'Suchergebnisse' : undefined} className="ap-panel">
          <h3 className="ap-panel__titel">{suchtext ? `Suche: ${liste.length} Treffer` : REITER.find((r) => r.id === reiter)!.titel}{!suchtext && reiter === 'messen' && hatPflegetasche(fall) ? ' · aus der Pflegetasche' : ''}</h3>
          {!suchtext && reiter === 'messen' && hatPflegetasche(fall) && <button type="button" className="small ap-tasche-knopf" aria-expanded={tascheOffen} onClick={() => setTascheOffen((o) => !o)}>🎒 Pflegetasche {tascheOffen ? 'schließen' : 'öffnen'}</button>}
          {!suchtext && reiter === 'melden' && <Melden z={z} eingabe={eingabe} onAbschluss={() => setAbschluss(true)} />}
          <ul className="ap-liste">
            {liste.map((h) => <Zeile key={`${h.art}:${h.id}`} h={h} z={z} mitReiter={!!suchtext} eingabe={eingabe} onTasche={() => setTascheOffen(true)} />)}
            {liste.length === 0 && <li className="muted">Dazu gibt es in diesem Fall nichts. Versuch ein anderes Wort.</li>}
          </ul>
        </div>
      </>}
      <p className="visually-hidden" aria-live="polite">{neu.at(-1)?.text ?? ''}</p>
    </div>
  </div>;
}

/* ─────────────────────────── Bausteine ─────────────────────────── */

function Zeile({ h, z, mitReiter, eingabe, onTasche }: { h: Handlung; z: SimZustand; mitReiter: boolean; eingabe: (e: SimEventEingabe) => void; onTasche: () => void }) {
  const zuletzt = h.getan.at(-1);
  const brauchtPa = z.stufe === 3 && h.freigabe === 'mit-pa' && !h.anleitungDa;
  const ausfuehren = () => {
    if (h.fehlendesGeraet) return onTasche();
    eingabe(h.art === 'frage' ? { art: 'frage', id: h.id } : { art: 'massnahme', id: h.id });
  };
  const badge = h.fehlendesGeraet ? { klasse: 'is-geraet', text: 'erst holen', lang: 'Gerät erst aus der Pflegetasche holen' }
    : h.freigabe ? { klasse: `is-${h.freigabe}`, text: FREIGABE_TEXT[h.freigabe].kurz, lang: FREIGABE_TEXT[h.freigabe].lang } : undefined;
  return <li className={`ap-zeile ${zuletzt !== undefined ? 'is-getan' : ''}`}>
    <button type="button" className="ap-zeile__knopf" onClick={ausfuehren}>
      <span className="ap-zeile__name">{h.name}{zuletzt !== undefined && <span className="ap-zeile__getan"> ✓ {uhrzeit(z.fall.startUhrzeit, zuletzt)}</span>}
        {mitReiter && <small> · {REITER.find((r) => r.id === h.reiter)?.kurz}</small>}</span>
      <span className="ap-zeile__zeit">{dauer(h.sek)}</span>
      {badge && <span className={`ap-badge ${badge.klasse}`}><span aria-hidden="true">{badge.text}</span><span className="visually-hidden">{badge.lang}</span></span>}
    </button>
    {brauchtPa && <button type="button" className="small" onClick={() => eingabe({ art: 'anleitung-anfordern', massnahme: h.id })}>PA dazuholen</button>}
  </li>;
}

function Pflegetasche({ geraete, onHolen, onSchliessen }: { geraete: ReturnType<typeof pflegetasche>; onHolen: (id: string) => void; onSchliessen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <div className="ap-tasche" role="dialog" aria-label="Pflegetasche" tabIndex={-1} ref={ref} onKeyDown={(e) => { if (e.key === 'Escape') onSchliessen(); }}>
    <div className="ap-tasche__kopf"><strong>🎒 Pflegetasche</strong><button type="button" className="small ghost" onClick={onSchliessen}>Schließen</button></div>
    <p className="muted">Herausholen und anlegen kostet 20 s.</p>
    <ul>{geraete.map((g) => <li key={g.id}>
      <span>{g.name}</span>
      {g.dabei ? <span className="ap-badge is-frei">angelegt</span> : <button type="button" className="small" onClick={() => onHolen(g.id)}>Herausholen</button>}
    </li>)}</ul>
  </div>;
}

function Entscheidung({ z, onWahl }: { z: SimZustand; onWahl: (id: string) => void }) {
  const e = offeneEntscheidung(z)!;
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.scrollIntoView({ block: 'nearest' }); }, [e.id]);
  return <section className="ap-entscheidung" aria-labelledby="ap-entscheidung">
    <p className="eyebrow">Entscheidungsmoment · Uhr angehalten</p>
    <h3 id="ap-entscheidung" ref={ref} tabIndex={-1}>{e.text}</h3>
    <p>Was tust du?</p>
    <div className="ap-entscheidung__optionen">
      {e.entscheidung!.map((o) => <button key={o.id} type="button" onClick={() => onWahl(o.id)}>{o.text}</button>)}
    </div>
  </section>;
}

function Melden({ z, eingabe, onAbschluss }: { z: SimZustand; eingabe: (e: SimEventEingabe) => void; onAbschluss: () => void }) {
  const [wahl, setWahl] = useState<string[]>([]);
  const bausteine = sbarBausteine(z);
  const liste = anordnungen(z);
  const umschalten = (id: string) => setWahl((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const anzahl = (t: SbarTeil) => bausteine[t].filter((b) => wahl.includes(b.id)).length;
  return <div className="ap-melden">
    <section className="ap-sbar" aria-labelledby="ap-sbar">
      <h4 id="ap-sbar">Ärztin anrufen: SBAR zusammenstellen</h4>
      <p className="muted">Wähle, was du sagst. Die Ärztin reagiert nur auf das, was du meldest. Werte erscheinen erst, wenn du sie erhoben hast.</p>
      {SBAR_TEILE.map((t) => <fieldset key={t.id}>
        <legend><b>{t.id}</b> {t.titel} <span className="muted">· {t.frage}{anzahl(t.id) ? ` · ${anzahl(t.id)} gewählt` : ''}</span></legend>
        {bausteine[t.id].map((b) => <label key={b.id}><input type="checkbox" checked={wahl.includes(b.id)} onChange={() => umschalten(b.id)} /> {b.text}</label>)}
      </fieldset>)}
      <button type="button" className="primary" disabled={!wahl.length} onClick={() => { eingabe({ art: 'anruf', an: 'aerztin', sbar: wahl }); setWahl([]); }}>
        📞 {z.fall.arzt.name} anrufen
      </button>
    </section>
    {liste.length > 0 && <section className="ap-anordnungen" aria-labelledby="ap-anordnungen">
      <h4 id="ap-anordnungen">Anordnungen</h4>
      <ul>{liste.map((a) => <li key={a.id} className={`is-${a.stand}`}>
        <p>{a.text}{a.plan && <span className="muted"> (Medikamentenplan)</span>}</p>
        {a.stand === 'angeboten' ? <div className="ap-anordnungen__knoepfe">
          <button type="button" className="small primary" onClick={() => eingabe({ art: 'rueckmelden', anordnung: a.id, rueckgelesen: true })}>Rücklesen und bestätigen</button>
          <button type="button" className="small" onClick={() => eingabe({ art: 'rueckmelden', anordnung: a.id, rueckgelesen: false })}>Ohne Rücklesen übernehmen</button>
          <button type="button" className="small" onClick={() => eingabe({ art: 'remonstrieren', anordnung: a.id })}>Hinterfragen (remonstrieren)</button>
        </div> : <p className="ap-anordnungen__stand">{a.stand === 'rueckgelesen' ? '✓ rückgelesen' : a.stand === 'uebernommen' ? 'übernommen, nicht rückgelesen' : 'zurückgezogen'}
          {!a.plan && a.stand !== 'zurueckgezogen' && <button type="button" className="small ghost" onClick={() => eingabe({ art: 'remonstrieren', anordnung: a.id })}>Hinterfragen</button>}</p>}
      </li>)}</ul>
    </section>}
    <button type="button" className="ap-abschluss-knopf" onClick={onAbschluss}>Fall abschließen: Pflegebedarf festhalten</button>
  </div>;
}

function Abschluss({ z, onSenden, onZurueck, ende }: { z: SimZustand; onSenden: (e: SimEventEingabe) => void; onZurueck: () => void; ende?: boolean }) {
  const [probleme, setProbleme] = useState<string[]>([]);
  const [ziele, setZiele] = useState<string[]>([]);
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const um = (l: string[], set: (x: string[]) => void, id: string) => set(l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  return <section className="ap-abschluss" aria-labelledby="ap-abschluss">
    {z.ende && <p className="note">{z.ende.text}</p>}
    <h2 id="ap-abschluss" ref={kopf} tabIndex={-1}>Pflegebedarf festhalten</h2>
    <p className="muted">Pflegebedarf erheben ist eine vorbehaltene Aufgabe von Pflegefachpersonen (§ 4 PflBG). Als Auszubildende übst du sie unter Verantwortung deiner Praxisanleitung.</p>
    <fieldset><legend>Welche Pflegeprobleme und Risiken siehst du?</legend>
      {z.fall.pflegebedarf.probleme.map((p) => <label key={p.id}><input type="checkbox" checked={probleme.includes(p.id)} onChange={() => um(probleme, setProbleme, p.id)} /> {p.text}</label>)}
    </fieldset>
    <fieldset><legend>Welche Pflegeziele passen?</legend>
      {z.fall.pflegebedarf.ziele.map((p) => <label key={p.id}><input type="checkbox" checked={ziele.includes(p.id)} onChange={() => um(ziele, setZiele, p.id)} /> {p.text}</label>)}
    </fieldset>
    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={() => onSenden({ art: 'abschluss', probleme, ziele })}>Abschließen</button>
      {!ende && <button type="button" onClick={onZurueck}>Zurück zum Fall</button>}
    </div>
  </section>;
}

function Ende({ z, onZurueck, onNeu }: { z: SimZustand; onZurueck: () => void; onNeu: () => void }) {
  const u = uebersicht(z);
  const kopf = useRef<HTMLHeadingElement>(null);
  useEffect(() => { kopf.current?.focus(); }, []);
  const pb = z.fall.pflegebedarf;
  const gewaehlt = new Set(z.abschluss?.probleme ?? []);
  return <section className="ap-ende" aria-labelledby="ap-ende">
    <p className="eyebrow">Fall beendet · {uhrzeit(z.fall.startUhrzeit, z.t)}</p>
    <h2 id="ap-ende" ref={kopf} tabIndex={-1}>{z.fall.titel}</h2>
    {z.ende && z.ende.ausgang !== 'abgeschlossen' && <p className="note">{z.ende.text}</p>}
    <p className="muted">Vorläufige Übersicht. Die ausführliche Auswertung nach Kompetenzbereichen folgt.</p>
    <h3>Pflichthandlungen</h3>
    <ul className="ap-ende__liste">{u.pflicht.map((p) => <li key={p.id} className={p.erfuellt ? 'is-ok' : 'is-fehlt'}>
      <strong>{p.erfuellt ? '✓' : '✗'} {p.text}</strong>{p.gewicht === 3 && !p.erfuellt && <span className="ap-badge is-grenze">kritisch</span>}<p>{p.warum}</p>
    </li>)}</ul>
    {u.fehler.length > 0 && <><h3>Pflegefehler</h3><ul className="ap-ende__liste">{u.fehler.map((f) => <li key={f.id} className="is-fehlt"><strong>{f.text}</strong> <span className="muted">({f.schwere})</span><p>{f.warum}</p></li>)}</ul></>}
    {u.grenzen.length > 0 && <><h3>Grenzüberschreitungen</h3><ul>{u.grenzen.map((g, i) => <li key={i}>{uhrzeit(z.fall.startUhrzeit, g.t)} {g.name}</li>)}</ul></>}
    <h3>Pflegebedarf</h3>
    <ul className="ap-ende__liste">{pb.probleme.map((p) => <li key={p.id} className={gewaehlt.has(p.id) === p.richtig ? 'is-ok' : 'is-fehlt'}>
      <strong>{gewaehlt.has(p.id) ? 'Gewählt' : 'Nicht gewählt'}: {p.text}</strong><p>{p.richtig ? 'Trifft zu.' : 'Trifft nicht zu.'} {p.warum}</p>
    </li>)}</ul>
    <p className="muted">Hilfen der Praxisanleitung: {u.paHilfen}</p>
    {z.fall.leitfaden.length > 0 && <details className="card"><summary>Leitfaden zum Fall</summary>{z.fall.leitfaden.map((l) => <section key={l.titel}><h4>{l.titel}</h4><p>{l.text}</p></section>)}</details>}
    <div className="ap-briefing__knoepfe">
      <button type="button" className="primary" onClick={onNeu}>Noch einmal</button>
      <button type="button" onClick={onZurueck}>Zur Fallauswahl</button>
    </div>
  </section>;
}
