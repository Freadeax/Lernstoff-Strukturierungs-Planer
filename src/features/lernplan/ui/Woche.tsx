import { useState } from 'react';
import { moveTopics } from '../../../core/board';
import { notify } from '../../../ui/shell/notifications';
import { navigate } from '../../../ui/shell/router';
import { addDays } from '../dates';
import { blockTitel, dauer, kurzDatum } from './format';
import { OhnePruefung, type PlanCtx } from './Lernplan';

export function Woche({ ctx }: { ctx: PlanCtx }) {
  const { plan, data } = ctx;
  const [offset, setOffset] = useState(0);
  const from = addDays(data.today, offset * 7);
  const to = addDays(from, 6);
  const tage = plan.days.filter((d) => d.date >= from && d.date <= to);
  const letzte = plan.days[plan.days.length - 1]?.date;
  const examsInWeek = data.exams.filter((e) => e.date >= from && e.date <= to);

  if (!plan.days.length) return <OhnePruefung />;

  const neu = [...new Set(tage.flatMap((d) => d.blocks.filter((b) => b.kind === 'erarbeiten').map((b) => b.topicId)))];
  const fuersBoard = neu.filter((id) => ctx.column(id) === 'pool');
  const summe = tage.reduce((s, d) => s + d.plannedMinutes, 0);
  const kapazitaet = tage.reduce((s, d) => s + d.capacityMinutes, 0);

  // Themen, die auf dem Board für diese Woche stehen, aber zu keiner Prüfung gehören
  const inPruefung = new Set(data.exams.filter((e) => e.date > data.today).flatMap((e) => e.topicIds));
  const ohnePruefung = data.board.filter((b) => (b.column === 'woche' || b.column === 'arbeit') && !inPruefung.has(b.topicId));

  const aufsBoard = async () => {
    try {
      await moveTopics(fuersBoard.map((id) => ({ topicId: id, column: 'woche', name: ctx.topics.get(id)?.name })));
      notify('info', `${fuersBoard.length} Themen nach „Diese Woche“ verschoben`);
    } catch (e) {
      notify('critical', 'Board nicht aktualisiert', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="stack-2">
      <div className="card woche__kopf">
        <div className="woche__nav">
          <button type="button" className="icon ghost" disabled={offset === 0} onClick={() => setOffset((o) => o - 1)} aria-label="Vorige Woche">‹</button>
          <h3>{kurzDatum(from)} bis {kurzDatum(to)}</h3>
          <button type="button" className="icon ghost" disabled={!letzte || to >= letzte} onClick={() => setOffset((o) => o + 1)} aria-label="Nächste Woche">›</button>
        </div>
        <p>{dauer(summe)} geplant von {dauer(kapazitaet)} verfügbar{neu.length ? `, ${neu.length} Themen neu erarbeiten` : ''}.</p>
        {fuersBoard.length > 0 && (
          <button type="button" onClick={aufsBoard}>
            {fuersBoard.length === 1 ? '1 Thema' : `${fuersBoard.length} Themen`} aufs Board unter „Diese Woche“ legen
          </button>
        )}
        {examsInWeek.map((e) => <p key={e.id} className="note">Prüfung „{e.name}“ am {kurzDatum(e.date)}</p>)}
      </div>

      {ohnePruefung.length > 0 && (
        <p className="note">
          {ohnePruefung.length === 1 ? '1 Thema steht' : `${ohnePruefung.length} Themen stehen`} auf dem Board unter „Diese Woche“ oder „In Arbeit“, gehört aber zu keiner Prüfung und wird deshalb nicht eingeplant
          ({ohnePruefung.slice(0, 3).map((b) => ctx.topics.get(b.topicId)?.name ?? b.topicId).join(', ')}{ohnePruefung.length > 3 ? ' …' : ''}).
          {' '}<button type="button" className="link" onClick={() => navigate('/lernen/plan?ansicht=pruefungen')}>Zu einer Prüfung hinzufügen</button>
        </p>
      )}

      <ol className="woche">
        {tage.map((d) => (
          <li key={d.date} className={`tag-karte${d.date === data.today ? ' tag-karte--heute' : ''}`}>
            <div className="tag-karte__kopf">
              <strong>{d.date === data.today ? 'Heute' : kurzDatum(d.date)}</strong>
              <span className="muted">{d.capacityMinutes ? `${dauer(d.plannedMinutes)} / ${dauer(d.capacityMinutes)}` : 'frei'}</span>
            </div>
            {d.capacityMinutes > 0 && <div className="balken"><span style={{ width: `${Math.min(100, (d.plannedMinutes / d.capacityMinutes) * 100)}%` }} /></div>}
            {d.blocks.length ? (
              <ul className="tag-karte__bloecke">
                {d.blocks.map((b, i) => (
                  <li key={i} className={`mini mini--${b.kind}`}>
                    <span className="mini__art">{blockTitel(b)}</span>
                    <span className="mini__thema">{ctx.topics.get(b.topicId)?.name ?? b.topicId}</span>
                    <span className="muted">{b.minutes} Min.</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">{d.capacityMinutes ? 'Nichts geplant.' : 'Keine Lernzeit.'}</p>}
          </li>
        ))}
      </ol>
      {plan.unscheduled.length > 0 && (
        <p className="note warn">
          Nicht eingeplant, weil die Zeit nicht reicht: {plan.unscheduled.map((u) => ctx.topics.get(u.topicId)?.name).join(', ')}.
          {' '}<button type="button" className="link" onClick={() => navigate('/lernen/plan?ansicht=zeit')}>Mehr Lernzeit eintragen</button>
        </p>
      )}
    </div>
  );
}
