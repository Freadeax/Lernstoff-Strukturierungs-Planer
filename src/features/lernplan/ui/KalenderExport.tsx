import { useState } from 'react';
import { download } from '../../../ui/widget/export';
import { storage } from '../../../ui/lib/store';
import { notify } from '../../../ui/shell/notifications';
import { beginnAm, BEGINN_VORSCHLAG, SCHICHT_VORLAGEN, type SchichtId } from '../alltag';
import { planAlsIcsMitUids } from '../ics';
import { saveConfig } from '../store';
import type { PlanCtx } from './Lernplan';

/** Zuletzt exportierte Termine (je Gerät), damit weggefallene Lerntage beim Neuimport abgesagt werden. */
export const ICS_KEY = 'lernstoff.lernplan.icsUids';

type Beginn = Partial<Record<SchichtId | 'normal', string>>;
const ZEILEN: Array<{ id: SchichtId | 'normal'; label: string }> = [{ id: 'normal', label: 'Normaler Tag' }, ...SCHICHT_VORLAGEN.filter((v) => v.id !== 'nacht').map((v) => ({ id: v.id, label: v.label }))];

/** Lernplan und Prüfungen als .ics-Datei für den Kalender (Apple, Google, Outlook). */
export function KalenderExport({ ctx, label = 'In den Kalender (.ics)' }: { ctx: PlanCtx; label?: string }) {
  const gespeichert = ctx.data.config.lernbeginn;
  const [beginn, setBeginn] = useState<Beginn>(() => gespeichert ?? {});
  const [zeigen, setZeigen] = useState(false);
  const notes = ctx.data.config.exceptionNotes ?? {};
  const mitUhrzeit = Object.values(beginn).some(Boolean);

  const exportieren = async () => {
    const frueher = storage.read<unknown[]>(ICS_KEY, []).filter((x): x is string => typeof x === 'string');
    const { ics, uids } = planAlsIcsMitUids(ctx.plan, ctx.data.exams, (id) => ctx.topics.get(id)?.name ?? id,
      { beginn: (day) => beginnAm(notes[day], beginn), frueher });
    download(`lernplan-${ctx.data.today}.ics`, ics, 'text/calendar;charset=utf-8');
    storage.write(ICS_KEY, uids);
    if (JSON.stringify(beginn) !== JSON.stringify(gespeichert ?? {})) await saveConfig({ lernbeginn: beginn }).catch(() => undefined);
    notify('info', 'Kalenderdatei erstellt', `Öffne sie, um ${mitUhrzeit ? 'die Lernzeiten' : 'die Lerntage'} und Prüfungen in deinen Kalender zu übernehmen. Ein neuer Export ersetzt die früheren Termine.`);
  };

  return (
    <div className="kalender-export">
      <button type="button" onClick={exportieren} disabled={!ctx.plan.days.some((d) => d.blocks.length)}>{label}</button>
      <button type="button" className="link" aria-expanded={zeigen} onClick={() => setZeigen((z) => !z)}>{mitUhrzeit ? 'Uhrzeiten ändern' : 'Mit Uhrzeiten?'}</button>
      {zeigen && (
        <fieldset className="kalender-export__zeiten">
          <legend>Lernbeginn im Kalender</legend>
          <p className="muted">Ohne Uhrzeit steht der Lerntag ganztägig im Kalender. Mit Uhrzeit dauert der Termin so lange wie die geplante Lernzeit mit Pausen. Sommer- und Winterzeit stimmen automatisch.</p>
          {ZEILEN.map((z) => (
            <label key={z.id} className="field kalender-export__zeile">{z.label}
              <input type="time" value={beginn[z.id] ?? ''} onChange={(e) => setBeginn((b) => ({ ...b, [z.id]: e.target.value || undefined }))} />
            </label>
          ))}
          <button type="button" className="small ghost" onClick={() => setBeginn(BEGINN_VORSCHLAG)}>Vorschlag übernehmen</button>
        </fieldset>
      )}
    </div>
  );
}
