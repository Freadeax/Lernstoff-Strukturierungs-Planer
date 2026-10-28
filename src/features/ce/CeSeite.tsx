import { useMemo, useState } from 'react';
import '../faecher.css';
import '../lernplan/ui/lernplan.css';
import './ce.css';
import type { MasteryStatus } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import { SZENARIEN } from '../fall/faelle';
import { daysBetween } from '../lernplan/dates';
import { uebungenFuer } from '../lernplan/trainer';
import { dauer, inTagen, kurzDatum, STATUS_LABEL } from '../lernplan/ui/format';
import { usePlan, type PlanCtx } from '../lernplan/ui/usePlan';
import { CePruefung } from './CePruefung';
import { sammleFakten, useGeraeteDaten, type GeraeteDaten } from './daten';
import { PfadKarte, PfadPunkte, SchrittListe } from './Lernpfad';
import { cePfad, themaPfad, type Haken, type ThemaFakten, type ThemaPfad } from './lernpfad';
import {
  ceListe, ceThemen, HERKUNFT_LABEL, nachFach, skripteZuCe, steckbriefeZuThema,
  type Ce, type CeThema,
} from './modell';
import { findeCePruefung } from './pruefung';
import { Selbsttest } from './Selbsttest';
import { testbareThemen } from './selbsttest';

const modul = pflegeModule;
const LISTE = ceListe(modul);
const PROFILE = modul.diseaseProfiles ?? [];
const REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];
const DIFF = ['', 'sehr leicht', 'leicht', 'mittel', 'schwer', 'sehr schwer'];

type Status = (topicId: string) => MasteryStatus;

/** Lernpfad je Thema aus Gerätedaten und Lernplan. */
function pfadeFuer(ce: Ce, themen: CeThema[], daten: GeraeteDaten, ctx?: PlanCtx) {
  const fakten = sammleFakten(themen, { modul, daten, progress: ctx?.plan.progress ?? {}, reviewLogs: ctx?.data.reviewLogs ?? [], ceId: ce.id });
  return new Map(fakten.map((f) => [f.topicId, { fakten: f, pfad: themaPfad(f) }]));
}
type Pfade = Map<string, { fakten: ThemaFakten; pfad: ThemaPfad }>;

function zaehle(themen: CeThema[], status: Status) {
  const zahl = Object.fromEntries(REIHE.map((s) => [s, 0])) as Record<MasteryStatus, number>;
  for (const t of themen) zahl[status(t.topic.id)]++;
  return zahl;
}

function Balken({ zahl }: { zahl: Record<MasteryStatus, number> }) {
  return (
    <>
      <div className="faecher__balken" role="img" aria-label={REIHE.map((st) => `${zahl[st]} ${STATUS_LABEL[st]}`).join(', ')}>
        {REIHE.map((st) => zahl[st] > 0 && <span key={st} className={`faecher__teil faecher__teil--${st}`} style={{ flexGrow: zahl[st] }} />)}
      </div>
      <ul className="faecher__legende">
        {REIHE.filter((st) => zahl[st] > 0).map((st) => (
          <li key={st}><i className={`faecher__punkt faecher__teil--${st}`} />{zahl[st]} {STATUS_LABEL[st].toLowerCase()}</li>
        ))}
      </ul>
    </>
  );
}

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

// ---------------------------------------------------------------- Übersicht aller CE

function Uebersicht({ daten, ctx, status, minuten }: { daten: GeraeteDaten; ctx?: PlanCtx; status: Status; minuten: (t: CeThema) => number }) {
  const { skripte } = daten;
  const karten = useMemo(() => LISTE.map((ce) => {
    const themen = ceThemen(modul, ce, skripte, LISTE);
    const ids = themen.map((t) => t.topic.id);
    return {
      ce, themen,
      pfad: cePfad([...pfadeFuer(ce, themen, daten, ctx).values()].map((x) => x.pfad)),
      skripte: skripteZuCe(skripte, ce.id, LISTE).length,
      steckbriefe: PROFILE.filter((p) => ids.some((id) => steckbriefeZuThema(id, [p]).length)).length,
      faelle: SZENARIEN.filter((s) => s.topicIds.some((id) => ids.includes(id))).length,
    };
  }), [skripte, daten, ctx]);
  const today = ctx?.data.today;

  return (
    <>
      <PageHeading title="Curriculare Einheiten" description="Alle CE der generalistischen Pflegeausbildung mit ihren Themen und deinem Wissensstand. Tippe auf eine CE, um die Themen aufzuschlüsseln." />
      <div className="ce__liste">
        {karten.map(({ ce, themen, pfad, skripte: nSkripte, steckbriefe, faelle }) => {
          const exam = ctx && findeCePruefung(ctx.data.exams, ce.id);
          const kommt = exam && today && exam.date > today;
          return (
          <article key={ce.id} className="card faecher__fach ce__karte">
            <div className="faecher__kopf">
              <span className="badge badge--demo">{ce.code}</span>
              <h3>{ce.name}</h3>
            </div>
            {kommt && <p className="ce__termin">Prüfung {kurzDatum(exam.date)} · {inTagen(daysBetween(today, exam.date))}</p>}
            {!!ce.teile.length && (
              <ul className="ce__teile">{ce.teile.map((t) => <li key={t.id}><strong>{t.code.replace('CE ', '')}</strong> {t.name}</li>)}</ul>
            )}
            <p className="muted">
              {anzahl(themen.length, 'Thema', 'Themen')} · etwa {Math.max(1, Math.round(themen.reduce((m, t) => m + minuten(t), 0) / 60))} Std. Erarbeitung
            </p>
            {themen.length > 0 && <Balken zahl={zaehle(themen, status)} />}
            {pfad.gesamt > 0 && (
              <p className="muted ce__pfadstand">
                Lernpfad: {pfad.erledigt} von {pfad.gesamt} Schritten{pfad.fertig ? ` · ${anzahl(pfad.fertig, 'Thema', 'Themen')} fertig` : ''}
              </p>
            )}
            <p className="muted ce__inhalte">
              {[nSkripte && anzahl(nSkripte, 'Skript', 'Skripte'), steckbriefe && anzahl(steckbriefe, 'Krankheitsbild', 'Krankheitsbilder'), faelle && anzahl(faelle, 'Fall', 'Fälle')].filter(Boolean).join(' · ') || 'Noch keine Skripte, Krankheitsbilder oder Fälle'}
            </p>
            <div className="faecher__aktionen">
              <button type="button" className="small primary" onClick={() => navigate(`/lernen/ce?ce=${encodeURIComponent(ce.id)}`)}>{pfad.erledigt ? 'Lernpfad fortsetzen' : 'Lernpfad öffnen'}</button>
            </div>
          </article>
          );
        })}
      </div>
      <p className="muted">
        Zuordnung aus dem Pflege-Katalog (fachliche Einschätzung, nicht wörtlich aus den Rahmenplänen) und aus den Themen deiner Skripte. CE-Titel sind noch nicht gegen die Rahmenpläne geprüft.
      </p>
    </>
  );
}

// ---------------------------------------------------------------- Eine CE im Detail

function ThemaZeile({ e, status, minuten, pfad, fakten, haken, onHaken }: {
  e: CeThema; status: Status; minuten: (t: CeThema) => number; pfad?: ThemaPfad; fakten?: ThemaFakten; haken: Haken; onHaken: (h: Haken) => void;
}) {
  const t = e.topic;
  const st = status(t.id);
  // Fall und Krankheitsbild-Fälle stehen schon im Pfad
  const uebungen = uebungenFuer(t.id, modul).filter((u) => u.trainer !== 'fall' && u.trainer !== 'krankheitsbilder');

  return (
    <details className="ce__thema">
      <summary>
        <i className={`faecher__punkt faecher__teil--${st}`} aria-hidden="true" />
        <span className="ce__thema-name">{t.name}</span>
        <span className="ce__chips">
          {pfad && <PfadPunkte pfad={pfad} />}
          {e.teil && <span className="badge badge--demo">{e.teil}</span>}
          <span className="ce__status">{STATUS_LABEL[st]}</span>
        </span>
      </summary>
      <div className="ce__thema-inhalt">
        <p className="muted">
          {dauer(minuten(e))} Erarbeitung{t.difficulty ? ` · ${DIFF[t.difficulty]}` : ''} · Zuordnung: {e.herkunft.map((h) => HERKUNFT_LABEL[h]).join(', ')}
        </p>
        {pfad && fakten && <SchrittListe pfad={pfad} fakten={fakten} haken={haken} onHaken={onHaken} />}
        {!!uebungen.length && (
          <div className="ce__ueben">
            <span className="muted">Weitere Übungen</span>
            {uebungen.map((u) => <button key={u.path} type="button" className="small ghost" onClick={() => navigate(u.path)}>{u.label}</button>)}
          </div>
        )}
      </div>
    </details>
  );
}

function Detail({ ce, daten, ctx, status, minuten, setHaken }: {
  ce: Ce; daten: GeraeteDaten; ctx?: PlanCtx; status: Status; minuten: (t: CeThema) => number; setHaken: (h: Haken) => void;
}) {
  const { skripte } = daten;
  const themen = useMemo(() => ceThemen(modul, ce, skripte, LISTE), [ce, skripte]);
  const gruppen = useMemo(() => nachFach(themen, modul), [themen]);
  const eigene = useMemo(() => skripteZuCe(skripte, ce.id, LISTE), [skripte, ce]);
  const pfade: Pfade = useMemo(() => pfadeFuer(ce, themen, daten, ctx), [ce, themen, daten, ctx]);
  const gesamt = useMemo(() => cePfad(themen.map((t) => pfade.get(t.topic.id)!.pfad)), [themen, pfade]);
  const testbar = useMemo(() => testbareThemen(daten.karten, themen.map((t) => t.topic.id)).size, [daten.karten, themen]);
  const namen = useMemo(() => new Map(themen.map((t) => [t.topic.id, t.topic.name])), [themen]);
  const [nurOffen, setNurOffen] = useState(false);
  const sichtbar = (e: CeThema) => !nurOffen || !!pfade.get(e.topic.id)?.pfad.naechster;

  return (
    <>
      <div><button type="button" className="link" onClick={() => navigate('/lernen/ce')}>← Alle curricularen Einheiten</button></div>
      <PageHeading eyebrow={ce.code} title={ce.name} description={`${anzahl(themen.length, 'Thema', 'Themen')} · etwa ${dauer(themen.reduce((m, t) => m + minuten(t), 0))} Erarbeitung`} />
      {!!ce.teile.length && (
        <ul className="ce__teile">{ce.teile.map((t) => <li key={t.id}><strong>{t.code}</strong> {t.name}</li>)}</ul>
      )}
      {themen.length > 0 && <div className="card ce__stand"><Balken zahl={zaehle(themen, status)} /></div>}
      {themen.length > 0 && (
        <PfadKarte pfad={gesamt} themaName={(id) => namen.get(id) ?? id} testbar={testbar}
          onTest={() => navigate(`/lernen/ce?ce=${encodeURIComponent(ce.id)}&ansicht=test`)} />
      )}
      {ctx && <CePruefung ce={ce} themen={themen.map((t) => t.topic)} ctx={ctx} />}

      <section className="ce__abschnitt">
        <h2>Deine Skripte</h2>
        {eigene.length ? (
          <ul className="ce__skripte">
            {eigene.map((s) => (
              <li key={s.id}>
                <button type="button" className="link" onClick={() => navigate(`/lernen/skript?id=${encodeURIComponent(s.id)}`)}>{s.titel}</button>
                <span className="muted"> · {anzahl(s.abschnitte.length, 'Abschnitt', 'Abschnitte')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Noch kein Skript zu {ce.code} auf diesem Gerät. <button type="button" className="link" onClick={() => navigate('/lernen/skript')}>Skripte laden</button></p>
        )}
      </section>

      <section className="ce__abschnitt">
        <div className="ce__kopfzeile">
          <h2>Themen</h2>
          <label className="ce__filter"><input type="checkbox" checked={nurOffen} onChange={(e) => setNurOffen(e.target.checked)} /> Fertige ausblenden</label>
        </div>
        {!themen.length && <p className="muted">Dieser CE ist im Katalog noch kein Thema zugeordnet.</p>}
        {gruppen.map((g) => {
          const liste = g.themen.filter(sichtbar);
          if (!liste.length) return null;
          return (
            <div key={g.fachId} className="ce__fach">
              <div className="ce__kopfzeile">
                <h3>{g.fach}</h3>
                <button type="button" className="small ghost" onClick={() => navigate(`/lernen/landkarte?fach=${encodeURIComponent(g.fachId)}`)}>Landkarte</button>
              </div>
              {liste.map((e) => {
                const p = pfade.get(e.topic.id);
                return <ThemaZeile key={e.topic.id} e={e} status={status} minuten={minuten} pfad={p?.pfad} fakten={p?.fakten} haken={daten.haken} onHaken={setHaken} />;
              })}
            </div>
          );
        })}
      </section>
    </>
  );
}

/**
 * Curriculare Einheiten: Übersicht aller CE und je CE ein geführter Lernpfad
 * (Skript → Karteikarten → Steckbrief → Fall → Selbsttest), Prüfungstermin und Wochenplan.
 */
export default function CeSeite() {
  const { params } = useRoute();
  const ce = LISTE.find((c) => c.id === params.get('ce'));
  const { ctx, error, retry } = usePlan();
  const { daten, setHaken } = useGeraeteDaten(modul);
  const status: Status = (id) => ctx?.plan.progress[id]?.status ?? 'offen';
  const standard = ctx?.settings.defaultEstimatedMinutes ?? 60;
  const minuten = (t: CeThema) => t.topic.estimatedMinutes ?? standard;

  return (
    <section className="page ce">
      {error && <div className="note warn" role="alert">Wissensstand nicht geladen. <button type="button" className="link" onClick={retry}>Erneut versuchen</button></div>}
      {!LISTE.length && <p className="muted">Das aktive Fachmodul hat keine curricularen Einheiten.</p>}
      {ce && params.get('ansicht') === 'test'
        ? <Selbsttest ce={ce} themen={ceThemen(modul, ce, daten.skripte, LISTE)} daten={daten} status={status} nurThema={params.get('thema') ?? undefined} />
        : ce
          ? <Detail ce={ce} daten={daten} ctx={ctx} status={status} minuten={minuten} setHaken={setHaken} />
          : <Uebersicht daten={daten} ctx={ctx} status={status} minuten={minuten} />}
    </section>
  );
}
