import { useEffect, useMemo, useState } from 'react';
import './einsatz.css';
import { erledigteFaelle } from '../praxis/erledigt';
import type { ID } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { getModule, modules } from '../../modules/registry';
import { PageHeading } from '../../ui/PageHeading';
import { useStore } from '../../ui/lib/store';
import { dayKey } from '../../ui/lib/time';
import { navigate, useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { SeitenHilfe } from '../wegweiser/SeitenHilfe';
import { leafTopics } from '../lernplan/store';
import { kurzDatum } from '../lernplan/ui/format';
import { usePlan } from '../lernplan/ui/usePlan';
import { ART, EINSATZ_ARTEN, type EinsatzArt } from './arten';
import {
  AMPEL_TEXT, aktuellerEinsatz, bereitCheck, dauerTage, einsatzName, einsatzTag, neuerEinsatz, phase, sortiert,
  type Einsatz, type Phase, type Station,
} from './einsatz';
import { synchronisiere } from './lernplan';
import { ladeEinsaetze, ladeTagebuch, speichereEinsaetze, speichereTagebuch } from './speicher';
import type { Tagebuch } from './tagebuch';
import { NotizAnsicht, TagebuchAnsicht } from './TagebuchTeile';
import { NachweisAnsicht } from './NachweisTeile';

const ANSICHTEN = [
  { id: 'einsaetze', label: 'Einsätze' },
  { id: 'notiz', label: 'Schnellnotiz' },
  { id: 'tagebuch', label: 'Praxistagebuch' },
  { id: 'nachweis', label: 'Nachweis' },
] as const;
type Ansicht = (typeof ANSICHTEN)[number]['id'];
const pfad = (a: Ansicht) => (a === 'einsaetze' ? '/lernen/einsatz' : `/lernen/einsatz?ansicht=${a}`);

export const PHASE_TEXT: Record<Phase, string> = { spaeter: 'geplant', vorbereitung: 'Vorbereitung', laeuft: 'läuft', vorbei: 'vorbei' };
export const AMPEL_KLASSE = { gruen: 'tag--wissen-sicher', gelb: 'tag--wissen-unsicher', rot: 'tag--critical' } as const;

export interface SeitenCtx {
  modul: CatalogModule;
  heute: string;
  liste: Einsatz[];
  themaName: (id: ID) => string;
  blaetter: Array<{ id: ID; name: string }>;
  tagebuch: Tagebuch;
  setTagebuch: (t: Tagebuch) => void;
}

export default function EinsatzSeite() {
  const { params } = useRoute();
  const raw = params.get('ansicht');
  const ansicht: Ansicht = ANSICHTEN.some((a) => a.id === raw) ? (raw as Ansicht) : 'einsaetze';
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]!) as CatalogModule;
  const heute = dayKey(new Date());
  const [liste, setListe] = useState<Einsatz[]>(ladeEinsaetze);
  const [tagebuch, setTb] = useState<Tagebuch>(ladeTagebuch);
  const [syncFehler, setSyncFehler] = useState('');
  const namen = useMemo(() => new Map(modul.topics.map((t) => [t.id, t.name])), [modul]);
  const blaetter = useMemo(() => leafTopics(modul.topics).map((t) => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name, 'de')), [modul]);

  useEffect(() => {
    synchronisiere(liste, modul, heute).then(() => setSyncFehler(''), (e: unknown) => setSyncFehler(e instanceof Error ? e.message : String(e)));
  }, [liste, modul, heute]);

  const ctx: SeitenCtx = {
    modul, heute, liste, blaetter, tagebuch,
    themaName: (id) => namen.get(id) ?? id,
    setTagebuch: (t) => { speichereTagebuch(t); setTb(t); },
  };
  const aendere = (neu: Einsatz[]) => { speichereEinsaetze(neu); setListe(neu); };

  return (
    <section className="page einsatz">
      <PageHeading eyebrow="Praxis" title="Praxiseinsatz. Vorbereitet ankommen."
        description="Trag deine Einsätze ein: Der Lernplan zieht die passenden Themen vor, der Bereit-Check zeigt, was schon sitzt. Auf Station notierst du schnell, zu Hause arbeitest du es im Praxistagebuch aus." />
      <SeitenHilfe path="/lernen/einsatz" />
      <div className="pills" role="tablist" aria-label="Ansicht">
        {ANSICHTEN.map((a, index) => (
          <button key={a.id} id={`ez-tab-${a.id}`} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} aria-controls="ez-panel" tabIndex={ansicht === a.id ? 0 : -1}
            onKeyDown={(e) => {
              const n = ANSICHTEN.length;
              const t = e.key === 'ArrowRight' ? (index + 1) % n : e.key === 'ArrowLeft' ? (index + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
              if (t < 0) return;
              e.preventDefault();
              navigate(pfad(ANSICHTEN[t]!.id));
              document.getElementById(`ez-tab-${ANSICHTEN[t]!.id}`)?.focus();
            }}
            onClick={() => navigate(pfad(a.id))}>{a.label}</button>
        ))}
      </div>
      <div id="ez-panel" role="tabpanel" aria-labelledby={`ez-tab-${ansicht}`} tabIndex={0} className="einsatz__panel">
        {syncFehler && <p className="note warn">Lernplan konnte nicht angepasst werden: {syncFehler}</p>}
        {ansicht === 'einsaetze' && <Einsaetze ctx={ctx} aendere={aendere} bearbeiten={params.get('id')} neu={params.get('neu') === '1'} />}
        {ansicht === 'notiz' && <NotizAnsicht ctx={ctx} />}
        {ansicht === 'tagebuch' && <TagebuchAnsicht ctx={ctx} />}
        {ansicht === 'nachweis' && <NachweisAnsicht ctx={ctx} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Einsätze

function Einsaetze({ ctx, aendere, bearbeiten, neu }: { ctx: SeitenCtx; aendere: (l: Einsatz[]) => void; bearbeiten: string | null; neu: boolean }) {
  const { liste, heute } = ctx;
  const aktuell = aktuellerEinsatz(liste, heute);
  const zuBearbeiten = bearbeiten ? liste.find((e) => e.id === bearbeiten) : undefined;
  const [formOffen, setFormOffen] = useState(neu || !!zuBearbeiten || !liste.length);
  const [loeschen, setLoeschen] = useState<string | null>(null);
  useEffect(() => { setFormOffen(neu || !!zuBearbeiten || !liste.length); }, [neu, bearbeiten]); // eslint-disable-line react-hooks/exhaustive-deps -- bewusst: läuft bewusst nur, wenn sich die genannten Werte ändern (Ereignis)

  const speichere = (e: Einsatz) => {
    aendere(sortiert([...liste.filter((x) => x.id !== e.id), e]));
    setFormOffen(false);
    navigate('/lernen/einsatz');
  };

  return (
    <div className="stack-3">
      {aktuell && <AktuellerEinsatz ctx={ctx} einsatz={aktuell} />}
      {formOffen
        ? <EinsatzFormular key={zuBearbeiten?.id ?? 'neu'} ctx={ctx} alt={zuBearbeiten} onSpeichern={speichere} onAbbrechen={liste.length ? () => { setFormOffen(false); navigate('/lernen/einsatz'); } : undefined} />
        : <button type="button" className="primary einsatz__neu" onClick={() => navigate('/lernen/einsatz?neu=1')}>Einsatz eintragen</button>}
      {liste.length > 0 && (
        <section aria-labelledby="ez-liste">
          <h2 id="ez-liste">Deine Einsätze</h2>
          <ul className="einsatz__liste">
            {sortiert(liste).map((e) => {
              const p = phase(e, heute);
              return (
                <li key={e.id} className={`card einsatz__eintrag einsatz__eintrag--${p}`}>
                  <div className="einsatz__kopf">
                    <h3>{einsatzName(e)}</h3>
                    <span className={`tag ${p === 'laeuft' ? 'tag--info' : p === 'vorbereitung' ? 'tag--warning' : ''}`}>{PHASE_TEXT[p]}</span>
                  </div>
                  <p className="muted">{kurzDatum(e.von)} bis {kurzDatum(e.bis)} · {dauerTage(e)} Tage · {e.themen.length} Themen{e.imLernplan ? ' · im Lernplan' : ''}</p>
                  <div className="faecher__aktionen">
                    <button type="button" className="small" onClick={() => navigate(`/lernen/einsatz?id=${encodeURIComponent(e.id)}`)}>Bearbeiten</button>
                    <button type="button" className="small" onClick={() => navigate(`/lernen/einsatz?ansicht=tagebuch&einsatz=${encodeURIComponent(e.id)}`)}>Tagebuch</button>
                    {loeschen === e.id
                      ? <>
                          <button type="button" className="small danger" onClick={() => { aendere(liste.filter((x) => x.id !== e.id)); setLoeschen(null); }}>Wirklich löschen</button>
                          <button type="button" className="small ghost" onClick={() => setLoeschen(null)}>Behalten</button>
                        </>
                      : <button type="button" className="small ghost" onClick={() => setLoeschen(e.id)}>Löschen</button>}
                  </div>
                  {loeschen === e.id && <p className="muted einsatz__klein">Der Einsatz verschwindet auch aus dem Lernplan. Notizen im Tagebuch bleiben.</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function AktuellerEinsatz({ ctx, einsatz: e }: { ctx: SeitenCtx; einsatz: Einsatz }) {
  const p = phase(e, ctx.heute);
  const info = ART.get(e.art)!;
  const bisStart = Math.round((Date.parse(e.von) - Date.parse(ctx.heute)) / 86_400_000);
  return (
    <section className="card einsatz__aktuell" aria-labelledby="ez-aktuell">
      <p className="eyebrow">{p === 'laeuft' ? `Tag ${einsatzTag(e, ctx.heute)} von ${dauerTage(e)}` : bisStart === 1 ? 'Beginnt morgen' : `Beginnt in ${bisStart} Tagen`}</p>
      <h2 id="ez-aktuell">{p === 'laeuft' ? 'Du bist im Einsatz' : 'Bereit für'} {einsatzName(e)}</h2>
      {p === 'laeuft'
        ? <p>Notiere auf Station, was dir begegnet, und arbeite es abends im Tagebuch aus. <button type="button" className="small primary" onClick={() => navigate('/lernen/einsatz?ansicht=notiz')}>Schnellnotiz</button></p>
        : <p className="muted">Die vier Stationen zeigen, wofür es schon echte Ergebnisse gibt. Selbsteinschätzung zählt nicht.</p>}
      <BereitCheck ctx={ctx} einsatz={e} />
      {e.ziele.length > 0 && (
        <div>
          <h3>Deine Lernziele</h3>
          <ul className="einsatz__ziele">{e.ziele.map((z, i) => <li key={i}>{z}</li>)}</ul>
        </div>
      )}
      <details className="einsatz__alltag">
        <summary>So läuft es dort meistens</summary>
        {info.alltag.map((s, i) => <p key={i}>{s}</p>)}
        <p className="muted einsatz__klein">Allgemeine Orientierung. Abläufe unterscheiden sich je Haus und Station.</p>
      </details>
    </section>
  );
}

interface PraxisFall { id: string; titel: string; setting: string; abschnitt: string[] }

function BereitCheck({ ctx, einsatz }: { ctx: SeitenCtx; einsatz: Einsatz }) {
  const { ctx: plan, error } = usePlan();
  const [faelle, setFaelle] = useState<PraxisFall[] | null>(null);
  useEffect(() => {
    let an = true;
    import('../praxis/kern/faelle').then((m) => {
      if (!an) return;
      setFaelle(m.FAELLE_V2.map((f) => ({ id: f.id, titel: f.titel.replace(/[„“]/g, ''), setting: f.setting, abschnitt: f.lehrplan?.abschnitt ?? [] })));
    }, () => { if (an) setFaelle([]); });
    return () => { an = false; };
  }, []);
  const stationen = useMemo<Station[] | undefined>(() => {
    if (!plan || !faelle) return undefined;
    const erledigt = erledigteFaelle();
    const settings = ART.get(einsatz.art)!.praxisSettings;
    // Orientierungseinsatz: nur Fälle für das 1./2. Drittel, sonst wird die Liste zu lang.
    const passt = (f: PraxisFall) => settings.includes(f.setting) && (einsatz.art !== 'orientierung' || f.abschnitt.includes('ad12'));
    return bereitCheck(einsatz, {
      heute: ctx.heute,
      status: (id) => plan.plan.progress[id]?.status ?? 'offen',
      themaName: ctx.themaName,
      faelle: faelle.filter(passt).map((f) => ({ id: f.id, titel: f.titel, erledigt: erledigt.has(f.id) })),
      ergebnisse: plan.data.reviewLogs,
    });
  }, [plan, faelle, einsatz, ctx.heute]); // eslint-disable-line react-hooks/exhaustive-deps -- bewusst: übrige Werte leiten sich aus den genannten ab
  if (error) return <p className="note warn">Lernstand konnte nicht geladen werden: {error.message}</p>;
  if (!stationen) return <p className="muted" role="status">Bereit-Check wird berechnet …</p>;
  return (
    <ol className="einsatz__stationen" aria-label="Bereit-Check">
      {stationen.map((s, i) => (
        <li key={s.id} className="einsatz__station">
          <div className="einsatz__kopf">
            <h3><span className="einsatz__nr" aria-hidden="true">{i + 1}</span> {s.titel}</h3>
            <span className={`tag ${AMPEL_KLASSE[s.ampel]}`}>{AMPEL_TEXT[s.ampel]}</span>
          </div>
          <p className="muted einsatz__klein">{s.text}</p>
          <ul className="einsatz__links">
            {s.links.map((l) => (
              <li key={l.path}><a href={`#${l.path}`}>{l.label}</a>{l.erledigt && <span className="einsatz__haken"> · erledigt</span>}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------- Formular

function EinsatzFormular({ ctx, alt, onSpeichern, onAbbrechen }: { ctx: SeitenCtx; alt?: Einsatz; onSpeichern: (e: Einsatz) => void; onAbbrechen?: () => void }) {
  const [e, setE] = useState<Einsatz>(() => alt ?? neuerEinsatz('akut', ctx.heute, ctx.heute));
  const [zieleText, setZieleText] = useState(alt?.ziele.join('\n') ?? '');
  const [weiteres, setWeiteres] = useState('');
  const [fehler, setFehler] = useState('');
  const patch = (p: Partial<Einsatz>) => setE((x) => ({ ...x, ...p }));
  const artThemen = new Set(ART.get(e.art)?.themen ?? []);
  const sichtbar = [...new Set([...ART.get(e.art)!.themen, ...e.themen])];

  const wechsleArt = (art: EinsatzArt) => {
    // Themen der alten Art gegen die der neuen tauschen, selbst ergänzte Themen bleiben.
    const alteArt = new Set(ART.get(e.art)?.themen ?? []);
    patch({ art, themen: [...new Set([...ART.get(art)!.themen, ...e.themen.filter((t) => !alteArt.has(t))])] });
  };
  const umschalten = (id: ID) => patch({ themen: e.themen.includes(id) ? e.themen.filter((t) => t !== id) : [...e.themen, id] });

  const absenden = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!e.von || !e.bis) return setFehler('Bitte Beginn und Ende eintragen.');
    if (e.bis < e.von) return setFehler('Das Ende liegt vor dem Beginn.');
    if (!e.themen.length && e.imLernplan) return setFehler('Wähle mindestens ein Thema oder nimm den Haken „im Lernplan vorziehen“ heraus.');
    setFehler('');
    onSpeichern({ ...e, bereich: e.bereich.trim().slice(0, 200), ziele: zieleText.split('\n').map((z) => z.trim()).filter(Boolean).slice(0, 30) });
  };

  return (
    <form className="card einsatz__form stack-2" onSubmit={absenden} aria-labelledby="ez-form-titel">
      <h2 id="ez-form-titel">{alt ? 'Einsatz bearbeiten' : 'Einsatz eintragen'}</h2>
      <label className="field">Art des Einsatzes
        <select value={e.art} onChange={(x) => wechsleArt(x.target.value as EinsatzArt)}>
          {EINSATZ_ARTEN.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <p className="muted einsatz__klein">Vertiefungseinsatz: wähle die Art, in der er stattfindet, und schreib „Vertiefung“ in den Namen.</p>
      <label className="field">Station oder Einrichtung (optional)
        <input type="text" value={e.bereich} maxLength={200} onChange={(x) => patch({ bereich: x.target.value })} placeholder="z. B. Station 4B Kinderchirurgie" />
      </label>
      <div className="einsatz__datum">
        <label className="field">Beginn<input type="date" value={e.von} onChange={(x) => patch({ von: x.target.value })} required /></label>
        <label className="field">Ende<input type="date" value={e.bis} onChange={(x) => patch({ bis: x.target.value })} required /></label>
      </div>
      <fieldset className="einsatz__themen">
        <legend>Themen, die vorher sitzen sollten ({e.themen.length})</legend>
        <p className="muted einsatz__klein">Vorschlag der App für diese Art. Abwählen, was bei dir nicht passt; weitere Themen unten ergänzen.</p>
        <div className="einsatz__haekchen">
          {sichtbar.map((id) => (
            <label key={id} className="einsatz__haekchen-zeile">
              <input type="checkbox" checked={e.themen.includes(id)} onChange={() => umschalten(id)} />
              <span>{ctx.themaName(id)}{!artThemen.has(id) && <span className="muted"> (ergänzt)</span>}</span>
            </label>
          ))}
        </div>
        <label className="field">Weiteres Thema ergänzen
          <select value={weiteres} onChange={(x) => { const id = x.target.value; setWeiteres(''); if (id && !e.themen.includes(id)) patch({ themen: [...e.themen, id] }); }}>
            <option value="">Thema wählen …</option>
            {ctx.blaetter.filter((t) => !e.themen.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      </fieldset>
      <label className="field">Eigene Lernziele für den Einsatz (eine pro Zeile, optional)
        <textarea rows={3} value={zieleText} onChange={(x) => setZieleText(x.target.value)} placeholder={'z. B. Selbstständig s.c. spritzen\nEine Übergabe nach SBAR machen'} />
      </label>
      <label className="einsatz__haekchen-zeile">
        <input type="checkbox" checked={e.imLernplan} onChange={(x) => patch({ imLernplan: x.target.checked })} />
        <span>Themen im Lernplan vorziehen (als Termin „Einsatz …“ mit geringerem Gewicht als eine Klausur)</span>
      </label>
      {fehler && <p className="note warn" role="alert">{fehler}</p>}
      <div className="faecher__aktionen">
        <button type="submit" className="primary">Speichern</button>
        {onAbbrechen && <button type="button" className="ghost" onClick={onAbbrechen}>Abbrechen</button>}
      </div>
    </form>
  );
}
