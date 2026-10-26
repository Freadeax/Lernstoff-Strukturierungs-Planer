import './lernplan.css';
import { Icon } from '../../../ui/icons';
import { blockTitel, bloecke, dauer, inTagen } from './format';
import { usePlan } from './usePlan';
import { daysBetween } from '../dates';
import { KartenHinweis } from '../../karteikarten/ui/KartenHinweis';

/** Der nächste sinnvolle Schritt steht vor Kennzahlen und Werkzeugen. */
export function HeuteKarte() {
  const { ctx, error, retry } = usePlan();
  if (error) return <div className="note warn" role="alert">Dein Tagesplan konnte nicht geladen werden. <button type="button" onClick={retry}>Erneut versuchen</button></div>;
  if (!ctx) return <div className="today-focus today-focus--loading" role="status">Dein Tagesplan wird geladen …</div>;
  const { plan, data } = ctx;
  const next = [...data.exams].filter((e) => e.date > data.today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const day = plan.days.find((d) => d.date === data.today);
  const blocks = day?.blocks.slice(0, 3) ?? [];
  return <section className="today-focus" aria-labelledby="today-title">
    <div className="today-focus__main">
      <span className="today-label"><span aria-hidden="true" /> Dein Fokus heute</span>
      <h2 id="today-title">{!next ? 'Gib deinem Lernen ein Ziel.' : blocks.length ? 'Ein Schritt nach dem anderen.' : 'Dein Plan für heute.'}</h2>
      <p>{!next ? 'Trag deine nächste Prüfung ein. Dein Plan verteilt den Stoff in machbare Einheiten und plant Wiederholungen gleich mit ein.' : blocks.length ? `${bloecke(day!.blocks.length)} · ${dauer(day!.plannedMinutes)} geplante Lernzeit. Starte mit deiner nächsten Einheit.` : 'Für heute ist nichts mehr geplant. Öffne deinen Lernplan oder nutze die Zeit für eine Wiederholung.'}</p>
      <a className="button-link focus-action" href={next ? '#/lernen/plan' : '#/lernen/plan?ansicht=pruefungen&neu=1'}>{next ? 'Meinen Lernplan öffnen' : 'Erste Prüfung eintragen'}<Icon name="chevronRight" size={18} /></a>
      <KartenHinweis className="today-cards" />
    </div>
    <div className="today-focus__detail">
      <div className="today-focus__detail-head"><Icon name="calendar" size={18} /><span>{next ? 'Nächste Prüfung' : 'So entsteht dein Lernplan'}</span></div>
      {next ? <><strong className="next-exam">{next.name}</strong><span className="next-exam-date">{new Date(`${next.date}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} · {inTagen(daysBetween(data.today, next.date))}</span>
        {blocks.length > 0 && <ol className="today-blocks">{blocks.map((b, i) => <li key={`${b.topicId}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{ctx.topics.get(b.topicId)?.name}</strong><small>{blockTitel(b)} · {dauer(b.minutes)}</small></div></li>)}</ol>}</>
        : <ol className="focus-guide"><li><span>01</span>Prüfung & Themen festlegen</li><li><span>02</span>Verfügbare Lernzeit angeben</li><li><span>03</span>Mit deinem Tagesplan starten</li></ol>}
    </div>
  </section>;
}
