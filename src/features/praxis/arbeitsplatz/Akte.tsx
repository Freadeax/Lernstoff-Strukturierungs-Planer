// Praxissimulator neu – Patientenakte (Paket P13). Eigener Bereich über dem Arbeitsplatz (Knopf in der Kopfzeile,
// Hotspot im Foto). Reiter: Überblick, Kurve, Medikation, Anordnungen, Pflegebericht (lesen + schreiben),
// Labor & Befunde, Assessments, Pflegeplanung. Nur Anzeige; Eingaben (dokumentieren) gehen an den Kern.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { anzeige, type SimZustand } from '../kern/kern';
import type { KurvenWert, SimEventEingabe } from '../kern/typen';
import {
  AKTE_REITER, akte, allergieBekannt, alterText, anordnungsZeilen, bericht, bilanzText, dokuGruppen, eigeneBefunde, istMinimal,
  kurvenSpalten, kurvenZeilen, medikation, neuAngeordnet, zellText, zuletztText, type AkteReiter,
} from './akte-ansicht';
import { Kurvenblatt, type SpurId } from './kurve/Kurvenblatt';
import { kurvendaten } from './kurve/kurvendaten';
import './akte.css';

/** Spuren im Kurvenblatt der Akte (nur die mit Werten): Kreislauf, Temperatur, BZ, Schmerz */
const AKTE_SPUREN = ['kreislauf', 'temp', 'bz', 'schmerz'] as const satisfies readonly SpurId[];
const SPUR_WERTE: Record<(typeof AKTE_SPUREN)[number], KurvenWert[]> = { kreislauf: ['rrSys', 'hf'], temp: ['temp'], bz: ['bz'], schmerz: ['schmerz'] };
const SCHEMA_KOPF = ['mo', 'mi', 'ab', 'na'] as const;

export function Akte({ z, start = 'ueberblick', onSchliessen, eingabe }: {
  z: SimZustand; start?: AkteReiter; onSchliessen: () => void; eingabe: (e: SimEventEingabe) => void;
}) {
  const [reiter, setReiter] = useState<AkteReiter>(start);
  const kopf = useRef<HTMLHeadingElement>(null);
  const zuvor = useRef<Element | null>(null);
  useEffect(() => {
    zuvor.current = document.activeElement;
    kopf.current?.focus();
    const alt = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = alt; (zuvor.current as HTMLElement | null)?.focus?.(); };
  }, []);

  function tabTaste(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? AKTE_REITER.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const ziel = AKTE_REITER[(n + AKTE_REITER.length) % AKTE_REITER.length]!;
    setReiter(ziel.id);
    document.getElementById(`akte-tab-${ziel.id}`)?.focus();
  }

  const p = z.fall.person;
  const a = akte(z);
  // Portal an body: der Arbeitsplatz liegt in einem eigenen Stapelkontext, die Kopfzeile der App sonst darüber.
  return createPortal(<div className="akte-hintergrund" onClick={(e) => { if (e.target === e.currentTarget) onSchliessen(); }}>
    <div className="akte" role="dialog" aria-modal="true" aria-labelledby="akte-titel" onKeyDown={(e) => { if (e.key === 'Escape') onSchliessen(); }}>
      <header className="akte__kopf">
        <div>
          <p className="eyebrow">Patientenakte · Uhr angehalten</p>
          <h2 id="akte-titel" ref={kopf} tabIndex={-1}>{p.name}, {alterText(z)}</h2>
          <p className="akte__kurz">
            {allergieBekannt(p.allergien) ? <span className="akte-warn">⚠ Allergie: {p.allergien.join(', ')}</span> : <span>Allergien: {p.allergien.join(', ') || 'keine Angabe'}</span>}
            {p.gewichtKg ? <span> · {p.gewichtKg.toLocaleString('de-DE')} kg</span> : null}
          </p>
        </div>
        <button type="button" className="akte__zu" onClick={onSchliessen}>Schließen</button>
      </header>
      <div className="akte__reiter" role="tablist" aria-label="Bereiche der Akte">
        {AKTE_REITER.map((r, i) => <button key={r.id} id={`akte-tab-${r.id}`} type="button" role="tab" aria-selected={reiter === r.id}
          aria-controls="akte-panel" tabIndex={reiter === r.id ? 0 : -1} onKeyDown={(e) => tabTaste(e, i)} onClick={() => setReiter(r.id)}>{r.titel}</button>)}
      </div>
      <div id="akte-panel" className="akte__inhalt" role="tabpanel" aria-labelledby={`akte-tab-${reiter}`} tabIndex={0}>
        {istMinimal(z) && <p className="ap-hinweis" role="note">Kurzakte: Für diesen Fall gibt es noch keine ausführliche Akte. Angezeigt werden die bekannten Personendaten.</p>}
        {reiter === 'ueberblick' && <Ueberblick z={z} />}
        {reiter === 'kurve' && <Kurve z={z} />}
        {reiter === 'medikation' && <Medikation z={z} />}
        {reiter === 'anordnungen' && <Anordnungen z={z} />}
        {reiter === 'bericht' && <Bericht z={z} eingabe={eingabe} />}
        {reiter === 'befunde' && <Befunde z={z} />}
        {reiter === 'assessments' && <Assessments z={z} />}
        {reiter === 'planung' && <Liste leer={!a.pflegeplanung?.length} leerText="Keine Pflegeplanung hinterlegt.">
          {a.pflegeplanung?.map((x, i) => <li key={i} className="akte-karte"><p><b>Problem:</b> {x.problem}</p><p><b>Ziel:</b> {x.ziel}</p>
            <ul>{x.massnahmen.map((m) => <li key={m}>{m}</li>)}</ul></li>)}
        </Liste>}
      </div>
      <p className="akte__fuss muted">Fiktive Lernakte. Gaben und Einträge im Fall werden automatisch mit Uhrzeit und deinem Kürzel abgezeichnet.</p>
    </div>
  </div>, document.body);
}

function Liste({ leer, leerText, children }: { leer: boolean; leerText: string; children: ReactNode }) {
  return leer ? <p className="muted">{leerText}</p> : <ul className="akte-liste">{children}</ul>;
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return <section className="akte-abschnitt"><h3>{titel}</h3>{children}</section>;
}

/* ─────────────────────────── Überblick ─────────────────────────── */

function Ueberblick({ z }: { z: SimZustand }) {
  const p = z.fall.person;
  const a = akte(z);
  return <>
    <dl className="akte-stamm">
      <div><dt>Name</dt><dd>{p.name}</dd></div>
      <div><dt>Alter</dt><dd>{alterText(z)}</dd></div>
      <div><dt>Geschlecht</dt><dd>{p.geschlecht === 'w' ? 'weiblich' : p.geschlecht === 'm' ? 'männlich' : 'divers'}</dd></div>
      {p.gewichtKg ? <div><dt>Gewicht</dt><dd>{p.gewichtKg.toLocaleString('de-DE')} kg</dd></div> : null}
      <div><dt>Allergien</dt><dd className={allergieBekannt(p.allergien) ? 'akte-warn' : ''}>{p.allergien.join(', ') || 'keine Angabe'}</dd></div>
      {p.hilfsmittel?.length ? <div><dt>Hilfsmittel</dt><dd>{p.hilfsmittel.join(', ')}</dd></div> : null}
    </dl>
    {a.aufnahmegrund && <Abschnitt titel="Aufnahme- bzw. Versorgungsgrund"><p>{a.aufnahmegrund}</p></Abschnitt>}
    <Abschnitt titel="Diagnosen">
      <Liste leer={!a.diagnosen?.length} leerText="Keine Diagnosen hinterlegt.">
        {a.diagnosen?.map((d) => <li key={d.text}>{d.text}{d.icd && <span className="muted"> · {d.icd}</span>}{d.seit && <span className="muted"> · seit {d.seit}</span>}</li>)}
      </Liste>
    </Abschnitt>
    {a.anamnese?.length ? <Abschnitt titel="Anamnese"><ul className="akte-liste">{a.anamnese.map((x) => <li key={x}>{x}</li>)}</ul></Abschnitt> : null}
    {a.rechtliches?.length ? <Abschnitt titel="Rechtliches"><ul className="akte-liste">{a.rechtliches.map((x) => <li key={x}>{x}</li>)}</ul></Abschnitt> : null}
    {p.biografie.length ? <Abschnitt titel="Biografie"><ul className="akte-liste">{p.biografie.map((x) => <li key={x}>{x}</li>)}</ul></Abschnitt> : null}
  </>;
}

/* ─────────────────────────── Kurve ─────────────────────────── */

function Kurve({ z }: { z: SimZustand }) {
  const spalten = kurvenSpalten(z);
  const zeilen = kurvenZeilen(spalten);
  const bilanz = bilanzText(z, anzeige(z).bilanzMl);
  const daten = kurvendaten(z, { vorwerte: akte(z).vorwerte, monitor: false });
  return <>
    <p className="muted">Kurvenblatt: Vorwerte aus der Akte (grau) und deine Messungen im Fall. Werte, die du nicht gemessen hast, stehen hier nicht.</p>
    {spalten.length === 0 ? <p className="muted">Noch keine Werte. Miss oder dokumentiere Vitalzeichen, dann erscheinen sie hier.</p> : <>
      <Kurvenblatt daten={daten} startUhrzeit={z.fall.startUhrzeit} achse="blatt" ohneMarken titel="Kurvenblatt"
        spuren={AKTE_SPUREN.filter((s) => daten.punkte.some((p) => SPUR_WERTE[s].some((k) => p.werte[k] !== undefined)))} />
      <div className="akte-tabelle-rahmen" tabIndex={0} role="region" aria-label="Kurvenblatt als Tabelle">
        <table className="akte-kurve">
          <caption className="visually-hidden">Kurvenblatt</caption>
          <thead><tr><th scope="col">Wert</th>{spalten.map((s, i) => <th key={i} scope="col" className={`is-${s.quelle}`}>{s.label}{s.kuerzel && <small> {s.kuerzel}</small>}</th>)}</tr></thead>
          <tbody>{zeilen.map((r) => <tr key={r.id}><th scope="row">{r.label} <small>{r.einheit}</small></th>
            {spalten.map((s, i) => <td key={i} className={`is-${s.quelle}`}>{zellText(s, r.id)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </>}
    {bilanz.length > 0 && <Abschnitt titel="Bilanz">{bilanz.map((b) => <p key={b}>{b}</p>)}</Abschnitt>}
  </>;
}

/* ─────────────────────────── Medikation ─────────────────────────── */

function Medikation({ z }: { z: SimZustand }) {
  const zeilen = medikation(z);
  const neu = neuAngeordnet(z);
  const dauer = zeilen.filter((m) => m.art === 'dauer');
  const bedarf = zeilen.filter((m) => m.art === 'bedarf');
  return <>
    <Abschnitt titel="Dauermedikation">
      {dauer.length === 0 ? <p className="muted">Keine Dauermedikation.</p> : <div className="akte-tabelle-rahmen" tabIndex={0} role="region" aria-label="Dauermedikation">
        <table className="akte-med">
          <thead><tr><th scope="col">Medikament</th>{SCHEMA_KOPF.map((k) => <th key={k} scope="col" className="akte-med__schema">{k}</th>)}<th scope="col">Letzte Gabe / heute</th></tr></thead>
          <tbody>{dauer.map((m) => <MedZeileView key={m.eintrag.id} m={m} z={z} />)}</tbody>
        </table>
      </div>}
    </Abschnitt>
    <Abschnitt titel="Bedarfsmedikation">
      {bedarf.length === 0 ? <p className="muted">Keine Bedarfsmedikation.</p> : <ul className="akte-liste">{bedarf.map((m) => <li key={m.eintrag.id} className="akte-karte">
        <p><b>{m.name}</b> {m.eintrag.form}{m.priscus && <span className="akte-tag is-warn">PRISCUS</span>}</p>
        <p>Bei: {m.eintrag.bedarf!.indikation}. Einzeldosis {m.eintrag.bedarf!.einzeldosis}, max. {m.eintrag.bedarf!.maxProTag}{m.eintrag.bedarf!.abstandH ? `, Abstand mind. ${m.eintrag.bedarf!.abstandH} h` : ''}.</p>
        <GabenText m={m} z={z} />
        {m.eintrag.hinweis && <p className="muted">{m.eintrag.hinweis}</p>}
      </li>)}</ul>}
    </Abschnitt>
    {neu.length > 0 && <Abschnitt titel="Im Fall neu angeordnet">
      <ul className="akte-liste">{neu.map((n) => <li key={n.id} className={`akte-karte ${n.zurueckgezogen ? 'is-zurueck' : 'is-neu'}`}>
        <p><span className="akte-tag">{n.zurueckgezogen ? 'zurückgenommen' : `neu ${n.uhr}`}</span> {n.text}</p>
        {n.gaben.length > 0 && <p>Gegeben: {n.gaben.map((g) => `${g.uhr} (${g.kuerzel})`).join(', ')}</p>}
      </li>)}</ul>
    </Abschnitt>}
  </>;
}

function MedZeileView({ m, z }: { m: ReturnType<typeof medikation>[number]; z: SimZustand }) {
  return <tr className={m.geaendert ? 'is-geaendert' : ''}>
    <th scope="row"><b>{m.name}</b> <span className="muted">{m.eintrag.form}</span>{m.priscus && <span className="akte-tag is-warn">PRISCUS</span>}
      {m.geaendert && <span className="akte-tag is-geaendert">geändert {m.geaendert.uhr}</span>}
      {m.eintrag.hinweis && <small className="akte-med__hinweis">{m.eintrag.hinweis}</small>}
      {m.geaendert && <small className="akte-med__hinweis">Anordnung: {m.geaendert.text}</small>}</th>
    {m.schemaText
      ? <td colSpan={4} className="akte-med__schema akte-med__schema--text">{m.schemaText}</td>
      : m.schema.map((s, i) => <td key={i} className="akte-med__schema">{s}</td>)}
    <td><GabenText m={m} z={z} /></td>
  </tr>;
}

function GabenText({ m, z }: { m: ReturnType<typeof medikation>[number]; z: SimZustand }) {
  return <div className="akte-gaben">
    {m.zuletztVorFall && <p className="muted">Zuletzt: {zuletztText(z, m.zuletztVorFall)}</p>}
    {m.gaben.map((g) => <p key={g.t} className={g.fehler ? 'akte-warn' : 'akte-gabe'}>✓ {g.uhr} gegeben · {g.kuerzel}{g.fehler && <><br /><span>⚠ {g.fehler}</span></>}</p>)}
    {m.geaendert && <p className="akte-gabe is-pause">⏸ ab {m.geaendert.uhr} laut Anordnung nicht geben</p>}
    {m.zurueckgehalten && <p className="akte-gabe is-pause">Zurückgehalten {m.zurueckgehalten}</p>}
  </div>;
}

/* ─────────────────────────── Anordnungen ─────────────────────────── */

function Anordnungen({ z }: { z: SimZustand }) {
  const zeilen = anordnungsZeilen(z);
  const NAME = { frueher: 'schriftlich', plan: 'gilt', muendlich: 'mündlich', offen: 'offen', zurueckgezogen: 'zurückgenommen' } as const;
  return <Liste leer={!zeilen.length} leerText="Keine ärztlichen Anordnungen.">
    {zeilen.map((a, i) => <li key={i} className={`akte-karte is-${a.art}`}>
      <p><span className="akte-tag">{NAME[a.art]}</span> <b>{a.zeit}</b> · {a.wer}</p>
      <p>{a.text}</p>
      {a.vermerk && <p className={a.art === 'offen' || a.vermerk.includes('NICHT') ? 'akte-warn' : 'muted'}>{a.vermerk}</p>}
    </li>)}
  </Liste>;
}

/* ─────────────────────────── Pflegebericht ─────────────────────────── */

function Bericht({ z, eingabe }: { z: SimZustand; eingabe: (e: SimEventEingabe) => void }) {
  const [wahl, setWahl] = useState<string[]>([]);
  const [frei, setFrei] = useState('');
  const gruppen = dokuGruppen(z);
  const zeilen = bericht(z);
  const umschalten = (id: string) => setWahl((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const kannSpeichern = wahl.length > 0 || frei.trim().length > 0;
  return <>
    <Liste leer={!zeilen.length} leerText="Noch keine Einträge.">
      {zeilen.map((e, i) => <li key={i} className={`akte-karte ${e.eigen ? 'is-eigen' : ''}`}><p><b>{e.zeit}</b> · {e.wer}</p><p>{e.text}</p></li>)}
    </Liste>
    <section className="akte-schreiben" aria-labelledby="akte-schreiben">
      <h3 id="akte-schreiben">Eintrag schreiben</h3>
      <p className="muted">Wähle, was du dokumentierst. Es stehen nur Dinge zur Wahl, die du erhoben oder getan hast. Schreiben kostet Spielzeit (ab 1 Minute).</p>
      {gruppen.length === 0 && <p className="muted">Noch nichts zu dokumentieren.</p>}
      {gruppen.map((g) => <fieldset key={g.id}>
        <legend>{g.titel}</legend>
        {g.bausteine.map((b) => <label key={b.id}><input type="checkbox" checked={wahl.includes(b.id)} onChange={() => umschalten(b.id)} /> {b.text}</label>)}
      </fieldset>)}
      <label className="akte-frei">Eigene Ergänzung (optional)
        <textarea rows={3} value={frei} onChange={(e) => setFrei(e.target.value)} placeholder="z. B. Tochter telefonisch informiert, kommt gegen 10 Uhr." />
      </label>
      <button type="button" className="primary" disabled={!kannSpeichern}
        onClick={() => { eingabe({ art: 'dokumentieren', bausteine: wahl, ...(frei.trim() ? { freitext: frei.trim() } : {}) }); setWahl([]); setFrei(''); }}>
        Eintrag speichern
      </button>
    </section>
  </>;
}

/* ─────────────────────────── Befunde & Assessments ─────────────────────────── */

function Befunde({ z }: { z: SimZustand }) {
  const labor = akte(z).labor ?? [];
  const eigene = eigeneBefunde(z).filter((b) => !b.assessment);
  return <>
    <Abschnitt titel="Labor">
      {labor.length === 0 ? <p className="muted">Keine Laborwerte in der Akte.</p> : <div className="akte-tabelle-rahmen" tabIndex={0} role="region" aria-label="Laborwerte">
        <table className="akte-labor">
          <thead><tr><th scope="col">Wert</th><th scope="col">Ergebnis</th><th scope="col">Norm</th><th scope="col">Datum</th></tr></thead>
          <tbody>{labor.map((l) => <tr key={l.name} className={l.auffaellig ? 'is-auffaellig' : ''}>
            <th scope="row">{l.name}</th><td>{l.wert}{l.einheit ? ` ${l.einheit}` : ''}{l.auffaellig && <span className="visually-hidden"> auffällig</span>}{l.auffaellig && <span aria-hidden="true"> ↑</span>}</td>
            <td>{l.norm ?? ''}</td><td>{l.datum}</td></tr>)}</tbody>
        </table>
      </div>}
    </Abschnitt>
    <Abschnitt titel="Deine Befunde im Fall">
      <Liste leer={!eigene.length} leerText="Noch keine Befunde erhoben.">
        {eigene.map((b, i) => <li key={i} className="akte-karte is-eigen"><p><b>{b.uhr}</b> · {b.name}</p><p>{b.text}</p></li>)}
      </Liste>
    </Abschnitt>
  </>;
}

function Assessments({ z }: { z: SimZustand }) {
  const frueher = akte(z).assessments ?? [];
  const eigene = eigeneBefunde(z).filter((b) => b.assessment);
  return <>
    <Liste leer={!frueher.length} leerText="Keine früheren Assessments in der Akte.">
      {frueher.map((x) => <li key={x.name} className="akte-karte"><p><b>{x.name}</b>: {x.wert} <span className="muted">· {x.datum}</span></p>{x.hinweis && <p className="muted">{x.hinweis}</p>}</li>)}
    </Liste>
    {eigene.length > 0 && <Abschnitt titel="Im Fall erhoben">
      <ul className="akte-liste">{eigene.map((b, i) => <li key={i} className="akte-karte is-eigen"><p><b>{b.uhr}</b> · {b.name}</p><p>{b.text}</p></li>)}</ul>
    </Abschnitt>}
  </>;
}
