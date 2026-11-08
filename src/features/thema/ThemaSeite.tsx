import '../faecher.css';
import '../lernplan/ui/lernplan.css';
import '../ce/ce.css';
import './thema.css';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../core/db';
import type { Document, ID, Summary } from '../../core/types';
import type { CatalogModule, CatalogTopic } from '../../modules/catalog-types';
import { getModule, modules } from '../../modules/registry';
import { PageHeading } from '../../ui/PageHeading';
import { useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { sammleFakten, useGeraeteDaten } from '../ce/daten';
import { SchrittListe } from '../ce/Lernpfad';
import { themaPfad } from '../ce/lernpfad';
import { ceListe, ceThemen, ceZuThema, type CeThema } from '../ce/modell';
import { faellig, istOffen, ladeFehler, QUELLE_LABEL } from '../fehlerheft/fehlerheft';
import { daysBetween } from '../lernplan/dates';
import { uebungenFuer } from '../lernplan/trainer';
import { blockTitel, inTagen, kurzDatum, STATUS_LABEL } from '../lernplan/ui/format';
import { usePlan } from '../lernplan/ui/usePlan';
import { kartenLage, naechsterBlock } from './thema';

const zaehl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const enc = encodeURIComponent;

/** Dokumente und Zusammenfassungen, die diesem Thema zugeordnet sind. */
function useQuellen(topicId: ID) {
  const [q, setQ] = useState<{ docs: Document[]; summaries: Summary[] } | null>(null);
  useEffect(() => {
    let aktiv = true;
    Promise.all([db.documents.where('topicIds').equals(topicId).toArray(), db.summaries.where('topicIds').equals(topicId).toArray()])
      .then(([docs, summaries]) => { if (aktiv) setQ({ docs, summaries }); })
      .catch(() => { if (aktiv) setQ({ docs: [], summaries: [] }); });
    return () => { aktiv = false; };
  }, [topicId]);
  return q;
}

function Abschnitt({ titel, children, aktion }: { titel: string; children: React.ReactNode; aktion?: React.ReactNode }) {
  return (
    <section className="card thema__abschnitt">
      <div className="thema__kopf"><h2>{titel}</h2>{aktion}</div>
      {children}
    </section>
  );
}

/**
 * Ein Thema als Mittelpunkt: Quellen, Skript, Karteikarten, Fall, Trainer, Fehler und nächste Wiederholung
 * an einer Stelle. Liest nur; geschrieben wird in den jeweiligen Modulen.
 */
export default function ThemaSeite() {
  const { params } = useRoute();
  const id = params.get('id') ?? '';
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule;
  const liste = useMemo(() => ceListe(modul), [modul]);
  const { ctx } = usePlan();
  const { daten, setHaken } = useGeraeteDaten(modul);
  const quellen = useQuellen(id);
  const [fehler] = useState(() => ladeFehler().filter((f) => istOffen(f) && f.topicIds.includes(id)));

  const topic = (modul.topics.find((t) => t.id === id) ?? ctx?.topics.get(id)) as CatalogTopic | undefined;
  const ce = useMemo(() => (topic ? ceZuThema(modul, id, liste) : undefined), [topic, modul, id, liste]);
  const eintrag: CeThema | undefined = useMemo(() => {
    if (!topic) return undefined;
    const ausCe = ce && ceThemen(modul, ce, daten.skripte, liste).find((t) => t.topic.id === id);
    return ausCe ?? { topic, herkunft: ['katalog'], skriptIds: daten.skripte.filter((s) => s.topicIds.includes(id)).map((s) => s.id) };
  }, [topic, ce, modul, daten.skripte, liste, id]);
  const fakten = useMemo(() => {
    if (!eintrag) return undefined;
    const f = sammleFakten([eintrag], { modul, daten, progress: ctx?.plan.progress ?? {}, reviewLogs: ctx?.data.reviewLogs ?? [], ceId: ce?.id ?? '' })[0]!;
    // Ohne CE gibt es keinen CE-Selbsttest: dann die erste passende Übung.
    return ce ? f : { ...f, testZiel: f.testZiel?.startsWith('/lernen/ce') ? uebungenFuer(id, modul)[0]?.path : f.testZiel };
  }, [eintrag, modul, daten, ctx, ce, id]);
  const pfad = useMemo(() => (fakten ? themaPfad(fakten) : undefined), [fakten]);

  if (!id || (!topic && ctx)) {
    return (
      <section className="page">
        <PageHeading title="Thema nicht gefunden" description="Wähle ein Thema aus der Themenliste oder über eine curriculare Einheit." />
        <div className="row"><button type="button" className="primary" onClick={() => navigate('/lernen/themen')}>Zur Themenliste</button> <button type="button" onClick={() => navigate('/lernen/ce')}>Curriculare Einheiten</button></div>
      </section>
    );
  }
  if (!topic || !fakten || !pfad) return <section className="page"><p role="status">Thema wird geladen …</p></section>;

  const today = ctx?.data.today ?? '';
  const progress = ctx?.plan.progress[id];
  const status = progress?.status ?? 'offen';
  const block = ctx ? naechsterBlock(ctx.plan.days, id, today) : undefined;
  const karten = kartenLage(daten.karten, daten.staende, id, today);
  const heuteFehler = faellig(fehler).length;
  const fach = modul.subjects.find((s) => s.id === topic.subjectId);
  const uebungen = uebungenFuer(id, modul).filter((u) => u.trainer !== 'fall' && u.trainer !== 'krankheitsbilder' && u.trainer !== 'praxis');
  const tage = (d: string) => (today ? inTagen(daysBetween(today, d)) : kurzDatum(d));

  return (
    <section className="page thema">
      {ce && <div><button type="button" className="link" onClick={() => navigate(`/lernen/ce?ce=${enc(ce.id)}`)}>← {ce.code} {ce.name}</button></div>}
      <PageHeading eyebrow={[ce?.code, fach?.name].filter(Boolean).join(' · ') || 'Thema'} title={topic.name}
        description="Quellen, Skript, Karteikarten, Fall und Übungen zu diesem Thema an einer Stelle." />

      <div className="thema__lage">
        <div className="card thema__kachel">
          <span className="muted">Wissensstand aus Abfragen</span>
          <strong><i className={`faecher__punkt faecher__teil--${status}`} aria-hidden="true" /> {STATUS_LABEL[status]}</strong>
          <span className="muted">{fakten.tests ? zaehl(fakten.tests, 'Abfrage', 'Abfragen') : 'Noch keine Abfrage'}</span>
        </div>
        <div className="card thema__kachel">
          <span className="muted">Nächste Wiederholung</span>
          {block
            ? <><strong>{tage(block.date)}</strong><span className="muted">{blockTitel(block.block)} im Lernplan</span></>
            : progress?.nextReview
              ? <><strong>{tage(progress.nextReview)}</strong><span className="muted">laut Wissensstand</span></>
              : <><strong>Nicht geplant</strong><span className="muted">Thema einer Prüfung zuordnen</span></>}
        </div>
        <div className="card thema__kachel">
          <span className="muted">Karteikarten</span>
          {karten.gesamt
            ? <><strong>{karten.faellig ? `${karten.faellig} fällig` : karten.neu ? `${karten.neu} neu` : 'Alles wiederholt'}</strong>
              <span className="muted">{zaehl(karten.gesamt, 'Karte', 'Karten')}{karten.naechsteFaelligkeit && !karten.faellig ? ` · wieder ${tage(karten.naechsteFaelligkeit)}` : ''}</span></>
            : <><strong>Keine</strong><span className="muted">Noch keine Karten zum Thema</span></>}
        </div>
      </div>

      <Abschnitt titel="Lernpfad" aktion={pfad.naechster?.ziel && <button type="button" className="primary small" onClick={() => navigate(pfad.naechster!.ziel!)}>Weiterlernen</button>}>
        <p className="muted">{pfad.gesamt ? `${pfad.erledigt} von ${zaehl(pfad.gesamt, 'Schritt', 'Schritten')} erledigt.` : ''} Lesen, Karten, Steckbrief, Fall, Selbsttest. Erledigt ist nur, was eine Spur hinterlassen hat.</p>
        <SchrittListe pfad={pfad} fakten={fakten} haken={daten.haken} onHaken={setHaken} />
      </Abschnitt>

      <Abschnitt titel="Quellen" aktion={<button type="button" className="small ghost" onClick={() => navigate('/material/import')}>Material hinzufügen</button>}>
        {!quellen ? <p className="muted" role="status">Quellen werden geladen …</p> : (
          <ul className="thema__liste">
            {fakten.skripte.map((s) => (
              <li key={s.id}><button type="button" className="link" onClick={() => navigate(`/lernen/skript?id=${enc(s.id)}`)}>{s.titel}</button><span className="muted"> · Skript, {s.gelesen} von {zaehl(s.abschnitte, 'Abschnitt', 'Abschnitten')} gelesen</span></li>
            ))}
            {quellen.docs.map((d) => (
              <li key={d.id}><span>{d.title}</span><span className="muted"> · Dokument</span> <button type="button" className="link" onClick={() => navigate(`/material/zusammenfassen?dokument=${enc(d.id)}`)}>Zusammenfassen</button></li>
            ))}
            {quellen.summaries.length > 0 && (
              <li><button type="button" className="link" onClick={() => navigate('/material/dokumente')}>{zaehl(quellen.summaries.length, 'Zusammenfassung', 'Zusammenfassungen')}</button><span className="muted"> mit Belegen bis zur Originalstelle{quellen.summaries.some((s) => s.needsReview) ? ', teils zur Prüfung markiert' : ''}</span></li>
            )}
            {!fakten.skripte.length && !quellen.docs.length && !quellen.summaries.length && <li className="muted">Noch keine eigenen Quellen zu diesem Thema auf diesem Gerät.</li>}
          </ul>
        )}
      </Abschnitt>

      <Abschnitt titel="Fehler" aktion={fehler.length > 0 && <button type="button" className="small" onClick={() => navigate('/lernen/fehler')}>{heuteFehler ? 'Jetzt wiederholen' : 'Fehlerheft'}</button>}>
        {fehler.length
          ? <ul className="thema__liste">{fehler.slice(0, 5).map((f) => <li key={f.id}><span>{f.titel}</span><span className="muted"> · {QUELLE_LABEL[f.quelle]}, {f.fehlerAnzahl}× falsch</span></li>)}
            {fehler.length > 5 && <li className="muted">und {fehler.length - 5} weitere</li>}</ul>
          : <p className="muted">Keine offenen Fehler zu diesem Thema.</p>}
      </Abschnitt>

      {uebungen.length > 0 && (
        <Abschnitt titel="Passende Übungen">
          <div className="ce__ueben">{uebungen.map((u) => <button key={u.path} type="button" className="small ghost" onClick={() => navigate(u.path)}>{u.label}</button>)}</div>
        </Abschnitt>
      )}
    </section>
  );
}
