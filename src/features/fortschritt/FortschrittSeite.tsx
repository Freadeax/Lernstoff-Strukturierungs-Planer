import { useMemo, useState } from 'react';
import '../faecher.css';
import './fortschritt.css';
import type { MasteryStatus } from '../../core/types';
import { PageHeading } from '../../ui/PageHeading';
import { addDays } from '../../ui/lib/time';
import { navigate, useRoute } from '../../ui/shell/router';
import { ceListe, ceThemen } from '../ce/modell';
import { SOURCE_LABEL, TRAINER_NAME } from '../lernplan/store';
import { dauer, kurzDatum, STATUS_LABEL } from '../lernplan/ui/format';
import type { EvidenceSource } from '../lernplan/types';
import { speichereZiel, useFortschritt, type FortschrittDaten } from './daten';
import {
  bereichsStand, gesamtWerte, kalenderWochen, kompetenzBereiche, meilensteine, serie, statusAm, stufe, STATUS_REIHE,
  wochenMitAllenZielen, wochenrueckblick, wochenStart, wochenZiele, woche, ZIEL_GRENZEN,
  type Bereich, type BereichStand, type Ziele, type ZielStand,
} from './statistik';

const ANSICHTEN = [
  { id: 'ueberblick', label: 'Überblick' },
  { id: 'woche', label: 'Wochenrückblick' },
  { id: 'bereiche', label: 'CE & Kompetenzen' },
  { id: 'meilensteine', label: 'Meilensteine' },
] as const;
type Ansicht = (typeof ANSICHTEN)[number]['id'];
const pfad = (a: Ansicht) => (a === 'ueberblick' ? '/lernen/fortschritt' : `/lernen/fortschritt?ansicht=${a}`);

const plural = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const prozent = (x: number) => `${Math.round(x * 100)} %`;
/** Für CSS ohne Leerzeichen. */
const breite = (x: number) => `${Math.round(Math.max(0, Math.min(1, x)) * 100)}%`;

interface Ctx {
  d: FortschrittDaten;
  ziele: Ziele;
  status: Map<string, { status: MasteryStatus }>;
  name: (id: string) => string;
}

function useCtx(d: FortschrittDaten | undefined, ziele: Ziele): Ctx | undefined {
  return useMemo(() => {
    if (!d) return undefined;
    const status = statusAm(d.lernstand, d.today);
    const namen = new Map(d.lernstand.leaves.map((t) => [t.id, t.name]));
    return { d, ziele, status, name: (id: string) => namen.get(id) ?? id };
  }, [d, ziele]);
}

export default function FortschrittSeite() {
  const { params } = useRoute();
  const raw = params.get('ansicht');
  const ansicht: Ansicht = ANSICHTEN.some((a) => a.id === raw) ? (raw as Ansicht) : 'ueberblick';
  const [zielStand, setZielStand] = useState(0);
  const { daten, ziele, error, retry } = useFortschritt(zielStand);
  const ctx = useCtx(daten, ziele);

  return (
    <section className="page fortschritt">
      <PageHeading eyebrow="Dranbleiben" title="Dein Fortschritt. Ehrlich gezählt."
        description="Lerntage, Wochenziele und Wissensstand aus allen Modulen. Gezählt wird nur, was du wirklich gelernt und abgefragt hast." />
      <div className="pills fortschritt__tabs" role="tablist" aria-label="Ansicht">
        {ANSICHTEN.map((a, index) => (
          <button key={a.id} id={`fs-tab-${a.id}`} type="button" role="tab" className="pill" aria-selected={ansicht === a.id}
            aria-controls="fs-panel" tabIndex={ansicht === a.id ? 0 : -1}
            onKeyDown={(e) => {
              const n = ANSICHTEN.length;
              const t = e.key === 'ArrowRight' ? (index + 1) % n : e.key === 'ArrowLeft' ? (index + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
              if (t < 0) return;
              e.preventDefault();
              navigate(pfad(ANSICHTEN[t]!.id));
              document.getElementById(`fs-tab-${ANSICHTEN[t]!.id}`)?.focus();
            }}
            onClick={() => navigate(pfad(a.id))}>{a.label}</button>
        ))}
      </div>
      <div id="fs-panel" role="tabpanel" aria-labelledby={`fs-tab-${ansicht}`} aria-busy={!ctx && !error} tabIndex={0}>
        {error && <p className="note warn">Fortschritt konnte nicht geladen werden: {error.message} <button type="button" className="small" onClick={retry}>Erneut versuchen</button></p>}
        {!ctx && !error && <p className="muted">Lädt …</p>}
        {ctx && ansicht === 'ueberblick' && <Ueberblick ctx={ctx} onZiele={() => setZielStand((n) => n + 1)} />}
        {ctx && ansicht === 'woche' && <Rueckblick ctx={ctx} start={params.get('woche')} />}
        {ctx && ansicht === 'bereiche' && <Bereiche ctx={ctx} />}
        {ctx && ansicht === 'meilensteine' && <Meilensteine ctx={ctx} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Bausteine

function ZielBalken({ z }: { z: ZielStand }) {
  const wert = z.id === 'minutenProWoche' ? `${dauer(z.ist)} von ${dauer(z.soll)}` : `${z.ist} von ${z.soll}${z.einheit ? ` ${z.einheit}` : ''}`;
  return (
    <li className={`fs-ziel${z.erreicht ? ' fs-ziel--erreicht' : ''}`}>
      <div className="fs-ziel__kopf"><strong>{z.label}</strong><span>{wert}{z.erreicht && <span className="fs-haken"> · erreicht</span>}</span></div>
      <div className="fs-balken" role="progressbar" aria-label={z.label} aria-valuemin={0} aria-valuemax={z.soll} aria-valuenow={Math.min(z.ist, z.soll)}>
        <span style={{ width: breite(z.anteil) }} />
      </div>
    </li>
  );
}

function StatusBalken({ zahl, gesamt }: { zahl: Record<MasteryStatus, number>; gesamt: number }) {
  if (!gesamt) return <p className="muted">Noch keine Themen zugeordnet.</p>;
  return (
    <>
      <div className="faecher__balken" role="img" aria-label={STATUS_REIHE.map((s) => `${zahl[s]} ${STATUS_LABEL[s]}`).join(', ')}>
        {STATUS_REIHE.map((s) => zahl[s] > 0 && <span key={s} className={`faecher__teil faecher__teil--${s}`} style={{ flexGrow: zahl[s] }} />)}
      </div>
      <ul className="faecher__legende">
        {STATUS_REIHE.filter((s) => zahl[s] > 0).map((s) => <li key={s}><i className={`faecher__punkt faecher__teil--${s}`} />{zahl[s]} {STATUS_LABEL[s].toLowerCase()}</li>)}
      </ul>
    </>
  );
}

const WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function Kalender({ ctx }: { ctx: Ctx }) {
  const wochen = useMemo(() => kalenderWochen(ctx.d.fakten, ctx.d.today, 12), [ctx]);
  return (
    <figure className="fs-kalender" aria-label="Lerntage der letzten zwölf Wochen">
      <div className="fs-kalender__raster">
        <div className="fs-kalender__wt" aria-hidden="true">{WT.map((w, i) => <span key={w}>{i % 2 === 0 ? w : ''}</span>)}</div>
        {wochen.map((w) => (
          <div key={w[0]!.date} className="fs-kalender__woche">
            {w.map((t) => {
              const zukunft = t.date > ctx.d.today;
              const text = zukunft ? kurzDatum(t.date)
                : `${kurzDatum(t.date)}: ${t.aktiv ? `${t.minuten} Min., ${plural(t.abfragen, 'Abfrage', 'Abfragen')}, ${plural(t.karten, 'Karte', 'Karten')}` : t.ruhetag ? 'Ruhetag' : 'nichts erfasst'}`;
              return <span key={t.date} title={text} aria-label={text} role="img"
                className={`fs-tag fs-tag--${zukunft ? 'zukunft' : stufe(t)}${t.ruhetag && !t.aktiv && !zukunft ? ' fs-tag--ruhe' : ''}${t.date === ctx.d.today ? ' fs-tag--heute' : ''}`} />;
            })}
          </div>
        ))}
      </div>
      <figcaption className="muted">
        Dunkler = mehr gelernt. Gestrichelt = Ruhetag laut Lernplan (unterbricht keine Serie).
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------- Überblick

function Ueberblick({ ctx, onZiele }: { ctx: Ctx; onZiele: () => void }) {
  const { d, ziele } = ctx;
  const s = useMemo(() => serie(d.fakten, d.today), [d]);
  const w = useMemo(() => woche(d.fakten, wochenStart(d.today)), [d]);
  const zs = wochenZiele(w, ziele);
  const gesamt = useMemo(() => gesamtWerte(d.fakten, d.today), [d]);
  const sicher = [...ctx.status.values()].filter((p) => p.status === 'sicher').length;
  const themen = d.lernstand.leaves.length;
  const [bearbeiten, setBearbeiten] = useState(false);

  const serieText = s.heuteAktiv ? 'Heute schon gelernt. Stark.'
    : s.heuteRuhetag ? 'Heute ist laut Lernplan Ruhetag. Deine Serie bleibt stehen.'
    : s.gefaehrdet ? 'Heute noch etwas lernen, damit deine Serie weiterläuft. Eine Karteikarten-Runde reicht.'
    : s.aktuell === 0 && s.laengste > 0 ? 'Neuer Anlauf: heute ist ein guter Tag für den ersten Lerntag.' : 'Lerne heute etwas und starte deine Serie.';

  return (
    <div className="fs-raster">
      <article className="card fs-serie">
        <p className="eyebrow">Lernserie</p>
        <p className="fs-zahl"><strong>{s.aktuell}</strong> {s.aktuell === 1 ? 'Lerntag' : 'Lerntage'} in Folge</p>
        <p>{serieText}</p>
        <p className="muted">Längste Serie: {plural(s.laengste, 'Tag', 'Tage')}. Ein Lerntag zählt, sobald du Lernzeit erfasst, etwas abfragst oder Karteikarten lernst.</p>
        <a className="text-link" href="#/lernen/karten">Karteikarten lernen</a>
      </article>

      <article className="card fs-woche">
        <div className="fs-kopf">
          <div><p className="eyebrow">Diese Woche</p><h2>{kurzDatum(w.start)} bis {kurzDatum(w.ende)}</h2></div>
          <button type="button" className="small" aria-expanded={bearbeiten} onClick={() => setBearbeiten((b) => !b)}>{bearbeiten ? 'Fertig' : 'Ziele anpassen'}</button>
        </div>
        {bearbeiten ? <ZielFormular ziele={ziele} onChange={onZiele} /> : (
          zs.length ? <ul className="fs-ziele">{zs.map((z) => <ZielBalken key={z.id} z={z} />)}</ul>
            : <p className="muted">Keine Wochenziele gesetzt.</p>
        )}
        <a className="text-link" href={`#${pfad('woche')}`}>Zum Wochenrückblick</a>
      </article>

      <article className="card fs-gesamt">
        <p className="eyebrow">Bisher insgesamt</p>
        <dl className="fs-kennzahlen">
          <div><dt>Lernzeit</dt><dd>{dauer(gesamt.minuten)}</dd></div>
          <div><dt>Lerntage</dt><dd>{gesamt.lerntage}</dd></div>
          <div><dt>Abfragen</dt><dd>{gesamt.abfragen}</dd></div>
          <div><dt>Karteikarten</dt><dd>{gesamt.karten}</dd></div>
          <div><dt>Themen sicher</dt><dd>{sicher} von {themen}</dd></div>
        </dl>
        {ziele.sichereThemen > 0 && (
          <ul className="fs-ziele"><ZielBalken z={{ id: 'sichereThemen', label: 'Gesamtziel sichere Themen', ist: sicher, soll: ziele.sichereThemen, einheit: 'Themen', anteil: Math.min(1, sicher / ziele.sichereThemen), erreicht: sicher >= ziele.sichereThemen }} /></ul>
        )}
        <p className="muted">„Sicher“ heißt: mehrfach an verschiedenen Tagen erfolgreich abgefragt und aktuell gut abrufbar. Lesen allein zählt nicht.</p>
      </article>

      <article className="card fs-kal">
        <p className="eyebrow">Letzte zwölf Wochen</p>
        <Kalender ctx={ctx} />
      </article>
    </div>
  );
}

const ZIEL_FELDER: Array<{ id: keyof Ziele; label: string; hilfe: string }> = [
  { id: 'minutenProWoche', label: 'Lernzeit pro Woche (Minuten)', hilfe: 'Erfasste Lernzeit im Lernplan.' },
  { id: 'aktiveTage', label: 'Lerntage pro Woche', hilfe: 'Tage mit Lernzeit, Abfrage oder Karteikarten.' },
  { id: 'abfragen', label: 'Abfragen pro Woche', hilfe: 'Echte Abfragen aus Trainern, Selbsttest, Quiz.' },
  { id: 'karten', label: 'Karteikarten pro Woche', hilfe: 'Jede bewertete Karte zählt.' },
  { id: 'sichereThemen', label: 'Gesamtziel: sichere Themen', hilfe: '0 = kein Gesamtziel.' },
];

function ZielFormular({ ziele, onChange }: { ziele: Ziele; onChange: () => void }) {
  return (
    <form className="fs-formular" onSubmit={(e) => e.preventDefault()}>
      {ZIEL_FELDER.map((f) => {
        const [lo, hi] = ZIEL_GRENZEN[f.id];
        return (
          <label key={f.id}>
            <span>{f.label}</span>
            <input type="number" inputMode="numeric" min={lo} max={hi} step={f.id === 'minutenProWoche' ? 15 : 1} defaultValue={ziele[f.id]}
              onChange={(e) => {
                const v = e.currentTarget.valueAsNumber;
                if (Number.isFinite(v) && v >= lo && v <= hi) { speichereZiel(f.id, Math.round(v)); onChange(); }
              }} />
            <small className="muted">{f.hilfe}</small>
          </label>
        );
      })}
      <button type="button" className="small" onClick={() => { for (const f of ZIEL_FELDER) speichereZiel(f.id, null); onChange(); }}>Vorschlag aus dem Lernplan nehmen</button>
      <p className="muted">Der Vorschlag richtet sich nach deiner verfügbaren Zeit im Lernplan. Ziele werden mit der Datensicherung übertragen.</p>
    </form>
  );
}

// ---------------------------------------------------------------- Wochenrückblick

const quelleName = (q: string) => TRAINER_NAME[q] ?? SOURCE_LABEL[q as EvidenceSource] ?? q;

function Rueckblick({ ctx, start: raw }: { ctx: Ctx; start: string | null }) {
  const { d, ziele } = ctx;
  const aktuell = wochenStart(d.today);
  const start = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? wochenStart(raw) : aktuell;
  const r = useMemo(() => wochenrueckblick(d.fakten, d.lernstand, start, d.today, ziele), [d, start, ziele]);
  const max = Math.max(30, ...r.woche.tage.map((t) => t.minuten));
  const geh = (s: string) => navigate(s === aktuell ? pfad('woche') : `${pfad('woche')}&woche=${s}`);

  return (
    <div className="fs-rueckblick">
      <div className="fs-wochennav">
        <button type="button" className="small" onClick={() => geh(addDays(start, -7))} aria-label="Vorherige Woche">‹ Vorwoche</button>
        <h2>{start === aktuell ? 'Diese Woche' : `Woche ab ${kurzDatum(start)}`}<small className="muted"> {kurzDatum(start)} bis {kurzDatum(r.woche.ende)}</small></h2>
        <button type="button" className="small" disabled={start >= aktuell} onClick={() => geh(addDays(start, 7))} aria-label="Nächste Woche">Nächste ›</button>
      </div>

      <article className="card">
        <ul className="fs-saetze">{r.saetze.map((s) => <li key={s}>{s}</li>)}</ul>
        <div className="fs-tage" role="img" aria-label={r.woche.tage.map((t) => `${kurzDatum(t.date)} ${t.minuten} Minuten`).join(', ')}>
          {r.woche.tage.map((t, i) => (
            <div key={t.date} className={`fs-tage__spalte${t.aktiv ? ' is-aktiv' : ''}${t.ruhetag ? ' is-ruhe' : ''}`}>
              <span className="fs-tage__wert">{t.minuten ? t.minuten : ''}</span>
              <span className="fs-tage__balken" style={{ height: `${Math.round((t.minuten / max) * 100)}%` }} />
              <span className="fs-tage__wt">{WT[i]}</span>
            </div>
          ))}
        </div>
        <p className="muted">Balken: Lernzeit in Minuten. Hervorgehoben: Lerntag (auch mit Abfragen oder Karten).</p>
      </article>

      {r.ziele.length > 0 && (
        <article className="card"><h3>Wochenziele</h3><ul className="fs-ziele">{r.ziele.map((z) => <ZielBalken key={z.id} z={z} />)}</ul></article>
      )}

      <div className="fs-raster">
        <article className="card">
          <h3>Neu sicher</h3>
          {r.neuSicher.length ? <ul className="fs-liste">{r.neuSicher.map((id) => <li key={id}>{ctx.name(id)}</li>)}</ul>
            : <p className="muted">Diese Woche ist kein Thema neu sicher geworden.</p>}
          {r.nichtMehrSicher.length > 0 && <>
            <h4>Wieder wiederholen</h4>
            <ul className="fs-liste">{r.nichtMehrSicher.map((id) => <li key={id}>{ctx.name(id)}</li>)}</ul>
          </>}
          {r.neuBegonnen.length > 0 && <p className="muted">{plural(r.neuBegonnen.length, 'Thema', 'Themen')} neu begonnen.</p>}
        </article>
        <article className="card">
          <h3>Meiste Lernzeit</h3>
          {r.meisteZeit.length ? <ul className="fs-liste">{r.meisteZeit.map((x) => <li key={x.topicId}><span>{ctx.name(x.topicId)}</span><span className="muted">{dauer(x.minuten)}</span></li>)}</ul>
            : <p className="muted">Keine Lernzeit erfasst.</p>}
        </article>
        <article className="card">
          <h3>Noch schwierig</h3>
          {r.schwierig.length ? <ul className="fs-liste">{r.schwierig.map((x) => <li key={x.topicId}><span>{ctx.name(x.topicId)}</span><span className="muted">{x.fehl} von {x.gesamt} nicht gelöst</span></li>)}</ul>
            : <p className="muted">Keine nicht gelösten Abfragen.</p>}
          {r.schwierig.length > 0 && <a className="text-link" href="#/lernen/fehler">Zum Fehlerheft</a>}
        </article>
        <article className="card">
          <h3>Womit geübt</h3>
          {r.quellen.length ? <ul className="fs-liste">{r.quellen.map((q) => <li key={q.quelle}><span>{quelleName(q.quelle)}</span><span className="muted">{q.anzahl}</span></li>)}</ul>
            : <p className="muted">Keine Abfragen.</p>}
        </article>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Bereiche

function BereichListe({ titel, text, staende, link }: { titel: string; text: string; staende: BereichStand[]; link?: (b: Bereich) => string }) {
  return (
    <section className="fs-bereiche" aria-label={titel}>
      <h2>{titel}</h2>
      <p className="muted">{text}</p>
      <div className="faecher__liste">
        {staende.map((b) => (
          <article key={b.id} className="card faecher__fach">
            <div className="fs-kopf">
              <h3><span className="fs-code">{b.code}</span> {b.name}</h3>
              <span className="fs-prozent" title="Anteil sicherer Themen">{b.gesamt ? prozent(b.sicher) : '–'}</span>
            </div>
            <StatusBalken zahl={b.zahl} gesamt={b.gesamt} />
            {b.gesamt > 0 && <p className="muted">{plural(b.gesamt, 'Thema', 'Themen')}, {prozent(b.begonnen)} begonnen.</p>}
            {link && <a className="text-link" href={`#${link(b)}`}>Öffnen</a>}
          </article>
        ))}
      </div>
    </section>
  );
}

function useBereiche(ctx: Ctx) {
  return useMemo(() => {
    const { modul, skripte } = ctx.d;
    const liste = ceListe(modul);
    const ce: Bereich[] = liste.map((c) => ({ id: c.id, code: c.code, name: c.name, topicIds: ceThemen(modul, c, skripte, liste).map((t) => t.topic.id) }));
    const st = (id: string) => ctx.status.get(id)?.status ?? 'offen';
    return { ce: bereichsStand(ce, st), kb: bereichsStand(kompetenzBereiche(modul), st) };
  }, [ctx]);
}

function Bereiche({ ctx }: { ctx: Ctx }) {
  const { ce, kb } = useBereiche(ctx);
  return (
    <>
      <BereichListe titel="Curriculare Einheiten" staende={ce} link={(b) => `/lernen/ce?ce=${encodeURIComponent(b.id)}`}
        text="Wissensstand je CE. Die Prozentzahl ist der Anteil sicherer Themen. Zuordnung wie auf der CE-Seite (Katalog und eigene Skripte)." />
      <BereichListe titel="Kompetenzbereiche" staende={kb}
        text="Kompetenzbereiche I bis V nach PflAPrV Anlage 2. Ein Thema kann zu mehreren Bereichen gehören. Die Zuordnung ist eine fachliche Einschätzung des Katalogs." />
    </>
  );
}

// ---------------------------------------------------------------- Meilensteine

function Meilensteine({ ctx }: { ctx: Ctx }) {
  const { ce } = useBereiche(ctx);
  const liste = useMemo(() => {
    const { d, ziele } = ctx;
    const g = gesamtWerte(d.fakten, d.today);
    return meilensteine({
      laengsteSerie: serie(d.fakten, d.today).laengste,
      minutenGesamt: g.minuten,
      abfragenGesamt: g.abfragen,
      kartenGesamt: g.karten,
      sicher: [...ctx.status.values()].filter((p) => p.status === 'sicher').length,
      themenGesamt: d.lernstand.leaves.length,
      bereicheBegonnen: ce.filter((b) => b.gesamt > 0 && b.zahl.offen === 0).length,
      wochenMitZiel: wochenMitAllenZielen(d.fakten, ziele, d.today),
    });
  }, [ctx, ce]);
  const erreicht = liste.filter((m) => m.erreicht).length;
  return (
    <>
      <p className="muted">{erreicht} von {liste.length} Meilensteinen erreicht. Alle werden aus deinen echten Lerndaten berechnet.</p>
      <ul className="fs-meilensteine">
        {liste.map((m) => (
          <li key={m.id} className={`card fs-meilenstein${m.erreicht ? ' is-erreicht' : ''}`}>
            <span className="fs-meilenstein__marke" aria-hidden="true">{m.erreicht ? '✓' : `${Math.round((m.ist / m.soll) * 100)}%`}</span>
            <div>
              <strong>{m.titel}</strong>
              <p className="muted">{m.text}</p>
              {!m.erreicht && <div className="fs-balken" role="progressbar" aria-label={m.titel} aria-valuemin={0} aria-valuemax={m.soll} aria-valuenow={m.ist}><span style={{ width: breite(m.ist / m.soll) }} /></div>}
              <span className="visually-hidden">{m.erreicht ? 'erreicht' : `${m.ist} von ${m.soll}`}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
