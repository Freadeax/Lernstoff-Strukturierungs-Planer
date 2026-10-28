import { useEffect, useMemo, useState } from 'react';
import '../faecher.css';
import './ce.css';
import { db } from '../../core/db';
import type { MasteryStatus } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import { SZENARIEN } from '../fall/faelle';
import { ladeKartenDaten } from '../karteikarten/store';
import { uebungenFuer } from '../lernplan/trainer';
import { dauer, STATUS_LABEL } from '../lernplan/ui/format';
import { usePlan } from '../lernplan/ui/usePlan';
import type { Skript } from '../skript/typen';
import {
  ceListe, ceThemen, HERKUNFT_LABEL, kartenProThema, nachFach, skripteZuCe, steckbriefeZuThema, szenarienZuThema,
  type Ce, type CeThema,
} from './modell';

const modul = pflegeModule;
const LISTE = ceListe(modul);
const PROFILE = modul.diseaseProfiles ?? [];
const REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];
const DIFF = ['', 'sehr leicht', 'leicht', 'mittel', 'schwer', 'sehr schwer'];

type Status = (topicId: string) => MasteryStatus;

/** Skripte und Karteikarten liegen nur auf dem Gerät; ohne sie bleibt die Seite trotzdem nutzbar. */
function useGeraeteDaten() {
  const [skripte, setSkripte] = useState<Skript[]>([]);
  const [karten, setKarten] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    let aktiv = true;
    db.skripte.toArray().then((s) => { if (aktiv) setSkripte(s); }).catch(() => undefined);
    ladeKartenDaten(modul).then((d) => { if (aktiv) setKarten(kartenProThema(d.alle.filter((k) => !d.staende.get(k.id)?.ausgesetzt))); }).catch(() => undefined);
    return () => { aktiv = false; };
  }, []);
  return { skripte, karten };
}

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

function Uebersicht({ skripte, status, minuten }: { skripte: Skript[]; status: Status; minuten: (t: CeThema) => number }) {
  const karten = useMemo(() => LISTE.map((ce) => {
    const themen = ceThemen(modul, ce, skripte, LISTE);
    const ids = themen.map((t) => t.topic.id);
    return {
      ce, themen,
      skripte: skripteZuCe(skripte, ce.id, LISTE).length,
      steckbriefe: PROFILE.filter((p) => ids.some((id) => steckbriefeZuThema(id, [p]).length)).length,
      faelle: SZENARIEN.filter((s) => s.topicIds.some((id) => ids.includes(id))).length,
    };
  }), [skripte]);

  return (
    <>
      <PageHeading title="Curriculare Einheiten" description="Alle CE der generalistischen Pflegeausbildung mit ihren Themen und deinem Wissensstand. Tippe auf eine CE, um die Themen aufzuschlüsseln." />
      <div className="ce__liste">
        {karten.map(({ ce, themen, skripte: nSkripte, steckbriefe, faelle }) => (
          <article key={ce.id} className="card faecher__fach ce__karte">
            <div className="faecher__kopf">
              <span className="badge badge--demo">{ce.code}</span>
              <h3>{ce.name}</h3>
            </div>
            {!!ce.teile.length && (
              <ul className="ce__teile">{ce.teile.map((t) => <li key={t.id}><strong>{t.code.replace('CE ', '')}</strong> {t.name}</li>)}</ul>
            )}
            <p className="muted">
              {anzahl(themen.length, 'Thema', 'Themen')} · etwa {Math.max(1, Math.round(themen.reduce((m, t) => m + minuten(t), 0) / 60))} Std. Erarbeitung
            </p>
            {themen.length > 0 && <Balken zahl={zaehle(themen, status)} />}
            <p className="muted ce__inhalte">
              {[nSkripte && anzahl(nSkripte, 'Skript', 'Skripte'), steckbriefe && anzahl(steckbriefe, 'Krankheitsbild', 'Krankheitsbilder'), faelle && anzahl(faelle, 'Fall', 'Fälle')].filter(Boolean).join(' · ') || 'Noch keine Skripte, Krankheitsbilder oder Fälle'}
            </p>
            <div className="faecher__aktionen">
              <button type="button" className="small primary" onClick={() => navigate(`/lernen/ce?ce=${encodeURIComponent(ce.id)}`)}>Themen ansehen</button>
            </div>
          </article>
        ))}
      </div>
      <p className="muted">
        Zuordnung aus dem Pflege-Katalog (fachliche Einschätzung, nicht wörtlich aus den Rahmenplänen) und aus den Themen deiner Skripte. CE-Titel sind noch nicht gegen die Rahmenpläne geprüft.
      </p>
    </>
  );
}

// ---------------------------------------------------------------- Eine CE im Detail

function ThemaZeile({ e, status, minuten, skripte, karten }: {
  e: CeThema; status: Status; minuten: (t: CeThema) => number; skripte: Map<string, Skript>; karten: Map<string, number>;
}) {
  const t = e.topic;
  const st = status(t.id);
  const steckbriefe = steckbriefeZuThema(t.id, PROFILE);
  const faelle = szenarienZuThema(t.id, SZENARIEN);
  const uebungen = uebungenFuer(t.id, modul).filter((u) => !(u.trainer === 'fall' && faelle.length));
  const nKarten = karten.get(t.id) ?? 0;
  const eigeneSkripte = e.skriptIds.map((id) => skripte.get(id)).filter((s): s is Skript => !!s);

  return (
    <details className="ce__thema">
      <summary>
        <i className={`faecher__punkt faecher__teil--${st}`} aria-hidden="true" />
        <span className="ce__thema-name">{t.name}</span>
        <span className="ce__chips">
          {e.teil && <span className="badge badge--demo">{e.teil}</span>}
          <span className="ce__status">{STATUS_LABEL[st]}</span>
        </span>
      </summary>
      <div className="ce__thema-inhalt">
        <p className="muted">
          {dauer(minuten(e))} Erarbeitung{t.difficulty ? ` · ${DIFF[t.difficulty]}` : ''} · Zuordnung: {e.herkunft.map((h) => HERKUNFT_LABEL[h]).join(', ')}
        </p>
        <dl className="ce__links">
          <dt>Lesen</dt>
          <dd>
            {eigeneSkripte.length
              ? eigeneSkripte.map((s) => <button key={s.id} type="button" className="small" onClick={() => navigate(`/lernen/skript?id=${encodeURIComponent(s.id)}`)}>{s.titel}</button>)
              : <button type="button" className="small ghost" onClick={() => navigate(`/lernen/skript?thema=${encodeURIComponent(t.id)}`)}>Skripte zum Thema suchen</button>}
          </dd>
          <dt>Karteikarten</dt>
          <dd>
            {nKarten
              ? <button type="button" className="small" onClick={() => navigate(`/lernen/karten?thema=${encodeURIComponent(t.id)}`)}>{anzahl(nKarten, 'Karte', 'Karten')} lernen</button>
              : <span className="muted">keine</span>}
          </dd>
          {!!steckbriefe.length && (<>
            <dt>Krankheitsbilder</dt>
            <dd>{steckbriefe.map((p) => <button key={p.id} type="button" className="small" onClick={() => navigate(`/lernen/krankheitsbilder?kb=${encodeURIComponent(p.id)}`)}>{p.name}</button>)}</dd>
          </>)}
          {!!faelle.length && (<>
            <dt>Fälle</dt>
            <dd>{faelle.map((f) => <button key={f.id} type="button" className="small" onClick={() => navigate(`/lernen/fall?thema=${encodeURIComponent(t.id)}`)}>{f.titel}</button>)}</dd>
          </>)}
          {!!uebungen.length && (<>
            <dt>Üben</dt>
            <dd>{uebungen.map((u) => <button key={u.path} type="button" className="small ghost" onClick={() => navigate(u.path)}>{u.label}</button>)}</dd>
          </>)}
        </dl>
      </div>
    </details>
  );
}

function Detail({ ce, skripte, karten, status, minuten }: {
  ce: Ce; skripte: Skript[]; karten: Map<string, number>; status: Status; minuten: (t: CeThema) => number;
}) {
  const themen = useMemo(() => ceThemen(modul, ce, skripte, LISTE), [ce, skripte]);
  const gruppen = useMemo(() => nachFach(themen, modul), [themen]);
  const eigene = useMemo(() => skripteZuCe(skripte, ce.id, LISTE), [skripte, ce]);
  const skriptMap = useMemo(() => new Map(skripte.map((s) => [s.id, s])), [skripte]);
  const [nurOffen, setNurOffen] = useState(false);
  const sichtbar = (e: CeThema) => !nurOffen || status(e.topic.id) !== 'sicher';

  return (
    <>
      <div><button type="button" className="link" onClick={() => navigate('/lernen/ce')}>← Alle curricularen Einheiten</button></div>
      <PageHeading eyebrow={ce.code} title={ce.name} description={`${anzahl(themen.length, 'Thema', 'Themen')} · etwa ${dauer(themen.reduce((m, t) => m + minuten(t), 0))} Erarbeitung`} />
      {!!ce.teile.length && (
        <ul className="ce__teile">{ce.teile.map((t) => <li key={t.id}><strong>{t.code}</strong> {t.name}</li>)}</ul>
      )}
      {themen.length > 0 && <div className="card ce__stand"><Balken zahl={zaehle(themen, status)} /></div>}

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
          <label className="ce__filter"><input type="checkbox" checked={nurOffen} onChange={(e) => setNurOffen(e.target.checked)} /> Sichere ausblenden</label>
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
              {liste.map((e) => <ThemaZeile key={e.topic.id} e={e} status={status} minuten={minuten} skripte={skriptMap} karten={karten} />)}
            </div>
          );
        })}
      </section>
    </>
  );
}

/**
 * Curriculare Einheiten: Übersicht aller CE und je CE die Themen mit Wissensstand
 * und Sprüngen zu Skript, Karteikarten, Krankheitsbildern, Fällen und Übungen.
 */
export default function CeSeite() {
  const { params } = useRoute();
  const ce = LISTE.find((c) => c.id === params.get('ce'));
  const { ctx, error, retry } = usePlan();
  const { skripte, karten } = useGeraeteDaten();
  const status: Status = (id) => ctx?.plan.progress[id]?.status ?? 'offen';
  const standard = ctx?.settings.defaultEstimatedMinutes ?? 60;
  const minuten = (t: CeThema) => t.topic.estimatedMinutes ?? standard;

  return (
    <section className="page ce">
      {error && <div className="note warn" role="alert">Wissensstand nicht geladen. <button type="button" className="link" onClick={retry}>Erneut versuchen</button></div>}
      {!LISTE.length && <p className="muted">Das aktive Fachmodul hat keine curricularen Einheiten.</p>}
      {ce
        ? <Detail ce={ce} skripte={skripte} karten={karten} status={status} minuten={minuten} />
        : <Uebersicht skripte={skripte} status={status} minuten={minuten} />}
    </section>
  );
}
