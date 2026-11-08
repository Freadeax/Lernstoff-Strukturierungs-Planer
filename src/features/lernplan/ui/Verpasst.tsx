import { useEffect, useMemo, useState } from 'react';
import { storage } from '../../../ui/lib/store';
import { navigate } from '../../../ui/shell/router';
import { istPlanStand, planStand, verpassteBloecke, type PlanStand } from '../alltag';
import { dauer, KIND_LABEL, kurzDatum } from './format';
import type { PlanCtx } from './Lernplan';

/** Plan des letzten geöffneten Tages (je Gerät, nicht in der Sicherung). */
export const PLANSTAND_KEY = 'lernstoff.lernplan.stand';

/**
 * Erklärt nach einem Tag ohne Erfassung, welche Blöcke liegen blieben, wohin sie gerutscht sind und warum.
 * Der Stand des Tages wird beim Öffnen gemerkt und erst nach „Verstanden“ durch den heutigen ersetzt.
 */
export function Verpasst({ ctx }: { ctx: PlanCtx }) {
  const { plan, data } = ctx;
  const [stand, setStand] = useState<PlanStand | undefined>(() => {
    const s = storage.read<unknown>(PLANSTAND_KEY, null);
    return istPlanStand(s) ? s : undefined;
  });
  const offen = stand && stand.date < data.today;
  const liste = useMemo(() => (offen ? verpassteBloecke(stand, plan, data.studyLogs, data.reviewLogs) : []), [offen, stand, plan, data]);

  useEffect(() => {
    // Heutigen Stand nur merken, wenn kein älterer mehr erklärt werden muss.
    if (offen && liste.length) return;
    const neu = planStand(plan);
    storage.write(PLANSTAND_KEY, neu);
    if (offen) setStand(neu);
  }, [offen, liste.length, plan]);

  if (!offen || !liste.length) return null;
  const verstanden = () => { const neu = planStand(plan); storage.write(PLANSTAND_KEY, neu); setStand(neu); };
  return (
    <section className="card verpasst" aria-labelledby="verpasst-titel">
      <h3 id="verpasst-titel">Am {kurzDatum(stand.date)} liegen geblieben</h3>
      <p className="muted">Der Plan hat sich neu berechnet. So geht es mit den offenen Blöcken weiter:</p>
      <ul className="verpasst__liste">
        {liste.map((b) => (
          <li key={b.kind + b.topicId}>
            <strong>{ctx.topics.get(b.topicId)?.name ?? b.topicId}</strong>
            <span className="muted"> · {KIND_LABEL[b.kind]}, {dauer(b.minutes)} · {b.neu ? (b.neu === data.today ? 'jetzt heute' : `jetzt am ${kurzDatum(b.neu)}`) : 'kein neuer Termin'}</span>
            <p>{b.warum}</p>
          </li>
        ))}
      </ul>
      <div className="row">
        <button type="button" className="ghost" onClick={() => navigate('/lernen/plan?ansicht=zeit')}>Lernzeit oder Dienstplan anpassen</button>
        <button type="button" className="primary" onClick={verstanden}>Verstanden</button>
      </div>
    </section>
  );
}
