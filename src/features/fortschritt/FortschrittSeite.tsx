import { useMemo, useState } from 'react';
import '../faecher.css';
import './fortschritt.css';
import type { MasteryStatus } from '../../core/types';
import { PageHeading } from '../../ui/PageHeading';
import { addDays } from '../../ui/lib/time';
import { navigate, useRoute } from '../../ui/shell/router';
import { SOURCE_LABEL, TRAINER_NAME } from '../lernplan/store';
import { dauer, kurzDatum, STATUS_LABEL } from '../lernplan/ui/format';
import type { EvidenceSource } from '../lernplan/types';
import { alleMeilensteine, naechsteSchritte, werteAus, type Auswertung } from './auswertung';
import { speichereZiel, useFortschritt, type FortschrittDaten } from './daten';
import {
  gesamtWerte, kalenderWochen, lernstufen, LERNSTUFEN, rueckblickText, serie, stufe, STATUS_REIHE, wissensVerlauf,
  wochenrueckblick, wochenStart, wochenZiele, woche, ZIEL_GRENZEN,
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

interface Ctx extends Auswertung {
  d: FortschrittDaten;
  ziele: Ziele;
}

function useCtx(d: FortschrittDaten | undefined, ziele: Ziele): Ctx | undefined {
  const a = useMemo(() => (d ? werteAus(d) : undefined), [d]);
  return useMemo(() => (d && a ? { ...a, d, ziele } : undefined), [d, a, ziele]);
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

function NaechsterSchritt({ ctx }: { ctx: Ctx }) {
  const liste = useMemo(() => naechsteSchritte(ctx.d, ctx, ctx.ziele), [ctx]);
  return (
    <article className="card fs-schritt">
      <p className="eyebrow">Dein nächster Schritt</p>
      <ol className="fs-schritte">
        {liste.map((e) => (
          <li key={e.id}>
            <div><strong>{e.titel}</strong><p className="muted">{e.grund}</p></div>
            <button type="button" className="small" onClick={() => navigate(e.pfad)}>{e.aktion}</button>
          </li>
        ))}
      </ol>
    </article>
  );
}

function Verlauf({ ctx }: { ctx: Ctx }) {
  const punkte = useMemo(() => wissensVerlauf(ctx.d.lernstand, ctx.d.today, 12), [ctx]);
  const gesamt = Math.max(1, ctx.d.lernstand.leaves.length);
  const letzte = punkte[punkte.length - 1]!, erste = punkte[0]!;
  const plus = letzte.zahl.sicher - erste.zahl.sicher;
  const begonnen = (p: typeof letzte) => gesamt - p.zahl.offen;
  // Skaliert auf die meisten begonnenen Themen, sonst wären die Balken bei vielen offenen Themen kaum sichtbar.
  const skala = Math.max(1, ...punkte.map(begonnen));
  return (
    <article className="card fs-verlauf">
      <p className="eyebrow">Wissensverlauf, zwölf Wochen</p>
      <p>{plus > 0 ? `${plural(plus, 'Thema', 'Themen')} mehr sicher als vor zwölf Wochen.` : plus < 0 ? `${plural(-plus, 'Thema', 'Themen')} weniger sicher als vor zwölf Wochen. Zeit für Wiederholungen.` : 'Noch keine Veränderung bei den sicheren Themen.'} {begonnen(letzte) - begonnen(erste) > 0 && `${begonnen(letzte) - begonnen(erste)} neu begonnen.`}</p>
      <div className="fs-verlauf__balken" role="img" aria-label={punkte.map((p) => `${kurzDatum(p.ende)}: ${p.zahl.sicher} sicher, ${p.zahl.unsicher} unsicher, ${p.zahl.bearbeitet} bearbeitet`).join('; ')}>
        {punkte.map((p) => (
          <div key={p.ende} className="fs-verlauf__spalte" title={`${kurzDatum(p.ende)}: ${p.zahl.sicher} sicher, ${p.zahl.unsicher} unsicher, ${p.zahl.bearbeitet} bearbeitet`}>
            {(['sicher', 'unsicher', 'bearbeitet'] as const).map((st) => p.zahl[st] > 0 && (
              <span key={st} className={`faecher__teil--${st}`} style={{ height: breite(p.zahl[st] / skala) }} />
            ))}
          </div>
        ))}
      </div>
      <ul className="faecher__legende">
        {(['sicher', 'unsicher', 'bearbeitet'] as const).map((st) => <li key={st}><i className={`faecher__punkt faecher__teil--${st}`} />{STATUS_LABEL[st]}</li>)}
      </ul>
      <p className="muted">Volle Höhe = {plural(skala, 'begonnenes Thema', 'begonnene Themen')}, Stand jeweils am Wochenende. Insgesamt {gesamt} Themen.</p>
    </article>
  );
}

/** Lernstufen: gelesen → abgerufen → angewendet → bestätigt, je Anzahl Themen. */
function Stufen({ ctx }: { ctx: Ctx }) {
  const { d } = ctx;
  const ids = useMemo(() => d.lernstand.leaves.map((t) => t.id), [d]);
  const st = useMemo(() => lernstufen(ids, d.lernstand.studyLogs, d.lernstand.reviewLogs, (id) => ctx.status.get(id)?.status ?? 'offen', d.skriptGelesen), [ids, d, ctx.status]);
  const gesamt = Math.max(1, ids.length);
  const luecke = st.gelesen.filter((id) => !st.abgerufen.includes(id) && !st.bestaetigt.includes(id));
  return (
    <article className="card fs-stufen">
      <p className="eyebrow">Vom Lesen zum Können</p>
      <ol className="fs-stufen__liste">
        {LERNSTUFEN.map((s) => (
          <li key={s.id}>
            <div className="fs-stufen__kopf"><strong>{s.label}</strong><span>{st[s.id].length} von {ids.length} Themen</span></div>
            <div className="fs-stufen__balken" role="img" aria-label={`${s.label}: ${st[s.id].length} von ${ids.length} Themen, ${prozent(st[s.id].length / gesamt)}`}><span style={{ width: breite(st[s.id].length / gesamt) }} /></div>
            <p className="muted">{s.text}</p>
          </li>
        ))}
      </ol>
      {luecke.length > 0 && (
        <p>{plural(luecke.length, 'Thema ist', 'Themen sind')} gelesen, aber noch nie abgefragt ({luecke.slice(0, 3).map(ctx.name).join(', ')}{luecke.length > 3 ? ' …' : ''}).
          {' '}<a className="text-link" href={`#/lernen/karten?thema=${encodeURIComponent(luecke[0]!)}`}>Jetzt abfragen</a></p>
      )}
      <p className="muted">Selbsteinschätzungen zählen auf keiner Stufe. Bestätigt ist ein Thema erst nach mehreren erfolgreichen Abfragen an verschiedenen Tagen.</p>
    </article>
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
      <NaechsterSchritt ctx={ctx} />
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

      <Stufen ctx={ctx} />
      <Verlauf ctx={ctx} />
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

function Kopieren({ text }: { text: () => string }) {
  const [stand, setStand] = useState<'' | 'ok' | 'fehler'>('');
  return (
    <div className="fs-kopieren">
      <button type="button" className="small" onClick={() => {
        navigator.clipboard?.writeText(text()).then(() => setStand('ok'), () => setStand('fehler')) ?? setStand('fehler');
      }}>Als Text kopieren</button>
      <span role="status" className="muted">{stand === 'ok' ? 'Kopiert.' : stand === 'fehler' ? 'Kopieren hier nicht möglich.' : ''}</span>
    </div>
  );
}

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
        <Kopieren text={() => rueckblickText(r, ctx.name)} />
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

function Bereiche({ ctx }: { ctx: Ctx }) {
  const { ce, kb } = ctx;
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
  const liste = useMemo(() => alleMeilensteine(ctx.d, ctx, ctx.ziele), [ctx]);
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
