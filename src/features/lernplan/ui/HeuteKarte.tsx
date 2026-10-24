import './lernplan.css';
import { navigate } from '../../../ui/shell/router';
import { blockTitel, bloecke, dauer, inTagen } from './format';
import { usePlan } from './usePlan';
import { uebungenFuer } from '../trainer';
import { daysBetween } from '../dates';
import { KartenHinweis } from '../../karteikarten/ui/KartenHinweis';

/** Kurzansicht für die Übersicht: was heute im Lernplan steht und die nächste Prüfung. */
export function HeuteKarte() {
  const { ctx } = usePlan();
  if (!ctx) return null;
  const { plan, data } = ctx;
  const naechste = [...data.exams].filter((e) => e.date > data.today).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const tag = plan.days.find((d) => d.date === data.today);
  const zeigen = tag?.blocks.slice(0, 3) ?? [];
  return (
    <div className="card heute-karte">
      <div className="heute-karte__kopf">
        <h3>Heute im Lernplan</h3>
        {naechste && <span className="muted">Nächste Prüfung: {naechste.name}, {inTagen(daysBetween(data.today, naechste.date))}</span>}
      </div>
      {!naechste
        ? <p>Trag eine Prüfung ein, dann verteilt der Plan den Stoff bis dahin und erinnert dich an fällige Wiederholungen.</p>
        : tag?.blocks.length
          ? <>
            <p>{bloecke(tag.blocks.length)}, {dauer(tag.plannedMinutes)}:</p>
            <ul>{zeigen.map((b, i) => {
              const u = b.kind !== 'erarbeiten' ? uebungenFuer(b.topicId)[0] : undefined;
              return <li key={i}>{blockTitel(b)}: {ctx.topics.get(b.topicId)?.name}{u && <> · <button type="button" className="link" onClick={() => navigate(u.path)}>{u.label}</button></>}</li>;
            })}{tag.blocks.length > zeigen.length && <li>… und {tag.blocks.length - zeigen.length} weitere</li>}</ul>
          </>
          : <p>Für heute ist nichts mehr geplant.</p>}
      <KartenHinweis className="muted" />
      <div>
        <button type="button" className={naechste ? '' : 'primary'} onClick={() => navigate(naechste ? '/lernen/plan' : '/lernen/plan?ansicht=pruefungen&neu=1')}>
          {naechste ? 'Zum Lernplan' : 'Prüfung eintragen'}
        </button>
      </div>
    </div>
  );
}
