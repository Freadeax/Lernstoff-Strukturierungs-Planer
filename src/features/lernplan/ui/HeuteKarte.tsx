import './lernplan.css';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../../core/db';
import type { CatalogModule } from '../../../modules/catalog-types';
import { getModule } from '../../../modules/registry';
import { Icon } from '../../../ui/icons';
import { useStore } from '../../../ui/lib/store';
import { session } from '../../../ui/shell/session';
import { blockTitel, dauer, inTagen } from './format';
import { usePlan } from './usePlan';
import { daysBetween } from '../dates';
import { zaehleHeute } from '../../karteikarten/store';
import { faellig, ladeFehler } from '../../fehlerheft/fehlerheft';
import { PRAXIS_THEMEN } from '../../praxis/themen';
import { ceZuThema } from '../../ce/modell';
import { heuteAktion } from '../../thema/thema';

const ERSTE_SCHRITTE = [
  { titel: 'Beispiel ausprobieren', text: 'Eine Schicht im Praxissimulator. Ohne Anmeldung, ohne KI, offline.', ziel: '/lernen/praxis', icon: 'user' },
  { titel: 'Prüfung anlegen', text: 'Termin und Themen eintragen. Der Plan verteilt den Stoff bis dahin.', ziel: '/lernen/plan?ansicht=pruefungen&neu=1', icon: 'calendar' },
  { titel: 'Material importieren', text: 'Dein Skript als PDF, Foto oder Text. Es bleibt auf diesem Gerät.', ziel: '/material/import', icon: 'upload' },
] as const;

/** Beim ersten Besuch: drei Einstiege statt leerer Kennzahlen. */
function ErsterBesuch() {
  return (
    <section className="today-focus today-focus--start" aria-labelledby="today-title">
      <div className="today-focus__main">
        <span className="today-label"><span aria-hidden="true" /> Willkommen</span>
        <h2 id="today-title">Womit möchtest du anfangen?</h2>
        <p>Alles Weitere, auch die optionale KI, richtest du ein, wenn du es brauchst.</p>
      </div>
      <ol className="today-start" role="list">
        {ERSTE_SCHRITTE.map((s) => (
          <li key={s.ziel}><a href={`#${s.ziel}`}>
            <span className="today-start__icon" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
            <span><strong>{s.titel}</strong><small>{s.text}</small></span>
            <Icon name="chevronRight" size={16} />
          </a></li>
        ))}
      </ol>
    </section>
  );
}

/** Zähler außerhalb des Plans: Karteikarten, Fehlerheft, Dokumente. */
function useNebenZaehler(modul: CatalogModule | undefined) {
  const [z, setZ] = useState<{ faellig: number; neu: number; docs: number } | null>(null);
  const [fehler, setFehler] = useState(() => ladeFehler());
  useEffect(() => {
    let aktiv = true;
    Promise.all([modul ? zaehleHeute(modul).catch(() => ({ faellig: 0, neu: 0 })) : { faellig: 0, neu: 0 }, db.documents.count().catch(() => 0),
      // Eigenes Material zählt als Spur: gespeicherte Karten (Katalogkarten werden nicht gespeichert) und Skripte.
      db.karten.count().catch(() => 0), db.skripte.count().catch(() => 0)])
      .then(([k, docs, karten, skripte]) => { if (aktiv) setZ({ ...k, docs: docs + karten + skripte }); });
    const neu = () => setFehler(ladeFehler());
    window.addEventListener('fehlerheft', neu);
    return () => { aktiv = false; window.removeEventListener('fehlerheft', neu); };
  }, [modul]);
  return z && { ...z, fehlerFaellig: faellig(fehler).length, fehlerGesamt: fehler.length };
}

/** „Heute lernen“: die eine nächste Aktion vor Kennzahlen und Werkzeugen. */
export function HeuteKarte() {
  const { ctx, error, retry } = usePlan();
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = getModule(moduleId) as CatalogModule | undefined;
  const neben = useNebenZaehler(modul);
  const aktion = useMemo(() => {
    if (!ctx || !neben) return undefined;
    const { data, plan } = ctx;
    const block = plan.days.find((d) => d.date === data.today)?.blocks[0];
    const spuren = data.exams.length + data.studyLogs.length + data.reviewLogs.length + data.board.length + (data.cards?.length ?? 0) + neben.docs + neben.fehlerGesamt;
    return heuteAktion({
      block,
      themaName: block && ctx.topics.get(block.topicId)?.name,
      ceCode: block && modul ? ceZuThema(modul, block.topicId)?.code : undefined,
      kartenFaellig: neben.faellig, kartenNeu: neben.neu, fehlerFaellig: neben.fehlerFaellig,
      fallZumThema: !!block && Object.values(PRAXIS_THEMEN).some((t) => t.includes(block.topicId)),
      hatPruefung: data.exams.some((e) => e.date >= data.today),
      ersterBesuch: spuren === 0,
    });
  }, [ctx, neben, modul]);

  if (error) return <div className="note warn" role="alert">Dein Tagesplan konnte nicht geladen werden. <button type="button" onClick={retry}>Erneut versuchen</button></div>;
  if (!ctx || !neben) return <div className="today-focus today-focus--loading" role="status">Dein Tagesplan wird geladen …</div>;
  if (!aktion) return <ErsterBesuch />;
  const { plan, data } = ctx;
  const next = [...data.exams].filter((e) => e.date > data.today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const day = plan.days.find((d) => d.date === data.today);
  const blocks = day?.blocks.slice(0, 3) ?? [];
  return <section className="today-focus" aria-labelledby="today-title">
    <div className="today-focus__main">
      <span className="today-label"><span aria-hidden="true" /> Heute lernen</span>
      <h2 id="today-title">{aktion.titel}</h2>
      {aktion.teile.length > 0 && <p className="today-teile">{aktion.teile.join(' · ')}</p>}
      <a className="button-link focus-action" href={`#${aktion.ziel}`}>{aktion.knopf}<Icon name="chevronRight" size={18} /></a>
      {day && day.blocks.length > 1 && <p className="today-rest">Danach: {day.blocks.length - 1} weitere {day.blocks.length === 2 ? 'Einheit' : 'Einheiten'} · insgesamt {dauer(day.plannedMinutes)}. <a href="#/lernen/plan">Tagesplan</a></p>}
      {aktion.ziel.startsWith('/lernen/thema') && (neben.faellig > 0 || neben.fehlerFaellig > 0) && (
        <p className="today-rest">Wiederholen: {neben.faellig > 0 && <a href="#/lernen/karten">{neben.faellig} {neben.faellig === 1 ? 'Karte' : 'Karten'}</a>}{neben.faellig > 0 && neben.fehlerFaellig > 0 && ' · '}{neben.fehlerFaellig > 0 && <a href="#/lernen/fehler">{neben.fehlerFaellig} Fehler</a>}</p>
      )}
    </div>
    <div className="today-focus__detail">
      <div className="today-focus__detail-head"><Icon name="calendar" size={18} /><span>{next ? 'Nächste Prüfung' : 'So entsteht dein Lernplan'}</span></div>
      {next ? <><strong className="next-exam">{next.name}</strong><span className="next-exam-date">{new Date(`${next.date}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} · {inTagen(daysBetween(data.today, next.date))}</span>
        {blocks.length > 0 && <ol className="today-blocks">{blocks.map((b, i) => <li key={`${b.topicId}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><div><a href={`#/lernen/thema?id=${encodeURIComponent(b.topicId)}`}><strong>{ctx.topics.get(b.topicId)?.name}</strong></a><small>{blockTitel(b)} · {dauer(b.minutes)}</small></div></li>)}</ol>}</>
        : <ol className="focus-guide"><li><span>01</span>Prüfung & Themen festlegen</li><li><span>02</span>Verfügbare Lernzeit angeben</li><li><span>03</span>Mit deinem Tagesplan starten</li></ol>}
    </div>
  </section>;
}
