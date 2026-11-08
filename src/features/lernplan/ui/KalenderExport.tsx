import { download } from '../../../ui/widget/export';
import { notify } from '../../../ui/shell/notifications';
import { planAlsIcs } from '../ics';
import type { PlanCtx } from './Lernplan';

/** Lernplan und Prüfungen als .ics-Datei für den Kalender (Apple, Google, Outlook). */
export function KalenderExport({ ctx, label = 'In den Kalender (.ics)' }: { ctx: PlanCtx; label?: string }) {
  const exportieren = () => {
    const ics = planAlsIcs(ctx.plan, ctx.data.exams, (id) => ctx.topics.get(id)?.name ?? id);
    download(`lernplan-${ctx.data.today}.ics`, ics, 'text/calendar;charset=utf-8');
    notify('info', 'Kalenderdatei erstellt', 'Öffne sie, um die Lerntage und Prüfungen in deinen Kalender zu übernehmen. Bei Änderungen am Plan neu exportieren.');
  };
  return <button type="button" onClick={exportieren} disabled={!ctx.plan.days.some((d) => d.blocks.length)}>{label}</button>;
}
