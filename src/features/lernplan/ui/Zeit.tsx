import { useMemo, useState } from 'react';
import { notify } from '../../../ui/shell/notifications';
import { addDays, eachDay, type ISODate } from '../dates';
import { saveConfig, WEEKDAYS } from '../store';
import type { Availability } from '../types';
import { availableMinutes, buildPlan } from '../scheduler';
import { erklaereAenderung, naechsteTage, SCHICHT_VORLAGEN, schichtAusNotiz, schichtMinuten, wendeDienstplanAn, type SchichtId } from '../alltag';
import { dauer, kurzDatum } from './format';
import type { PlanCtx } from './Lernplan';
import { Field, useFormFeedback } from '../../../ui/form/Field';

// Montag zuerst, wie im deutschen Kalender
const REIHENFOLGE = [1, 2, 3, 4, 5, 6, 0];
const BLOCK = [25, 30, 45, 60];
const ABFRAGE = [10, 15, 20, 30];
const PUFFER = [0, 0.1, 0.2];

async function speichere(fn: () => Promise<void>, ok: string) {
  try { await fn(); notify('info', ok); } catch (e) { notify('critical', 'Nicht gespeichert', e instanceof Error ? e.message : String(e)); }
}

/**
 * Zeigt vor dem Speichern, was sich am Plan ändert: welche Themen später fertig werden oder nicht mehr passen.
 * Gerechnet wird mit denselben Eingaben wie der Plan, nur mit der neuen Verfügbarkeit.
 */
export function AenderungsVorschau({ ctx, availability }: { ctx: PlanCtx; availability?: Availability }) {
  const saetze = useMemo(() => {
    if (!availability) return undefined;
    const today = ctx.data.today;
    // Heute bereits verbrauchte Zeit bleibt abgezogen, wie im Plan selbst.
    const heuteRest = ctx.input.availability.exceptions?.[today];
    const doneToday = heuteRest !== undefined && ctx.data.config.availability.exceptions?.[today] !== heuteRest
      ? availableMinutes(ctx.data.config.availability, today) - heuteRest : 0;
    const neu: Availability = doneToday > 0
      ? { ...availability, exceptions: { ...availability.exceptions, [today]: Math.max(0, availableMinutes(availability, today) - doneToday) } }
      : availability;
    const nachher = buildPlan({ ...ctx.input, availability: neu });
    return erklaereAenderung(ctx.plan, nachher, (id) => ctx.topics.get(id)?.name ?? id);
  }, [ctx, availability]);
  if (!saetze) return null;
  if (!ctx.data.exams.some((e) => e.date > ctx.data.today)) return <p className="muted" aria-live="polite">Ohne anstehende Prüfung verschiebt sich nichts.</p>;
  return (
    <div className="vorschau" aria-live="polite">
      <p className="vorschau__titel">{saetze.length ? 'Das ändert sich am Plan:' : 'Am Ende der Erarbeitung ändert sich nichts. Blöcke werden nur auf andere Tage verteilt.'}</p>
      {saetze.length > 0 && (
        <ul>
          {saetze.slice(0, 6).map((v) => <li key={v.topicId + v.art} className={`vorschau__${v.art}`}>{v.text}</li>)}
          {saetze.length > 6 && <li className="muted">… und {saetze.length - 6} weitere Themen</li>}
        </ul>
      )}
    </div>
  );
}

const TAGE = 14;

/** Dienstplan für die nächsten zwei Wochen: je Tag Frühdienst, Spätdienst, Nachtdienst, Schultag oder frei. */
function Dienstplan({ ctx }: { ctx: PlanCtx }) {
  const cfg = ctx.data.config;
  const today = ctx.data.today;
  const tage = naechsteTage(today, TAGE);
  const notes = cfg.exceptionNotes ?? {};
  const eigene = cfg.shiftMinutes;
  const start = () => Object.fromEntries(tage.map((d) => [d, schichtAusNotiz(notes[d]) ?? ''])) as Record<ISODate, SchichtId | ''>;
  const [wahl, setWahl] = useState<Record<ISODate, SchichtId | ''>>(start);
  const [minuten, setMinuten] = useState(() => Object.fromEntries(SCHICHT_VORLAGEN.map((v) => [v.id, String(schichtMinuten(v.id, eigene))])) as Record<SchichtId, string>);
  const eigeneNeu = Object.fromEntries(SCHICHT_VORLAGEN.map((v) => [v.id, Math.max(0, Math.min(1440, Math.round(Number(minuten[v.id]) || 0)))])) as Record<SchichtId, number>;
  const anfang = start();
  const geaendert = tage.filter((d) => wahl[d] !== anfang[d]);
  const minutenGeaendert = SCHICHT_VORLAGEN.some((v) => eigeneNeu[v.id] !== schichtMinuten(v.id, eigene));
  const plan = Object.fromEntries(tage
    .filter((d) => wahl[d] !== anfang[d] || (minutenGeaendert && wahl[d]))
    .map((d) => [d, wahl[d] || null])) as Record<ISODate, SchichtId | null>;
  const ergebnis = Object.keys(plan).length ? wendeDienstplanAn(cfg.availability, notes, plan, eigeneNeu) : undefined;

  const speichern = () => {
    if (!ergebnis && !minutenGeaendert) return;
    speichere(() => saveConfig({ ...(ergebnis ? { availability: ergebnis.availability, exceptionNotes: ergebnis.notes } : {}), shiftMinutes: eigeneNeu }),
      `Dienstplan gespeichert${geaendert.length ? `, ${geaendert.length === 1 ? '1 Tag' : `${geaendert.length} Tage`} geändert` : ''}, Plan neu berechnet`);
  };

  return (
    <div className="card dienstplan">
      <h3>Dienstplan der nächsten zwei Wochen</h3>
      <p className="muted">Wähle für jeden Tag die Schicht. Die Lernzeit kommt aus der Vorlage, „Normal“ nimmt die Wochenzeit. Vor dem Speichern siehst du, was sich verschiebt.</p>
      <ol className="dienstplan__tage">
        {tage.map((d) => {
          const id = wahl[d];
          const m = id ? eigeneNeu[id] : availableMinutes({ ...cfg.availability, exceptions: Object.fromEntries(Object.entries(cfg.availability.exceptions ?? {}).filter(([k]) => schichtAusNotiz(notes[k]) === undefined)) }, d);
          return (
            <li key={d} className={id !== anfang[d] ? 'dienstplan__tag dienstplan__tag--neu' : 'dienstplan__tag'}>
              <label htmlFor={`schicht-${d}`}>{d === today ? 'Heute' : kurzDatum(d)}</label>
              <select id={`schicht-${d}`} value={id} onChange={(e) => setWahl((w) => ({ ...w, [d]: e.target.value as SchichtId | '' }))}>
                <option value="">Normal</option>
                {SCHICHT_VORLAGEN.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <span className="muted">{m ? dauer(m) : 'keine Lernzeit'}</span>
            </li>
          );
        })}
      </ol>
      <details className="dienstplan__vorlagen">
        <summary>Lernzeit der Vorlagen anpassen</summary>
        <div className="wochentage">
          {SCHICHT_VORLAGEN.map((v) => (
            <label key={v.id} className="field">{v.label} · Minuten
              <input type="number" min={0} max={1440} step={5} inputMode="numeric" value={minuten[v.id]} onChange={(e) => setMinuten((x) => ({ ...x, [v.id]: e.target.value }))} aria-describedby={`vorlage-${v.id}`} />
              <span id={`vorlage-${v.id}`} className="muted">{v.hinweis}</span>
            </label>
          ))}
        </div>
      </details>
      <AenderungsVorschau ctx={ctx} availability={ergebnis?.availability} />
      <div className="row">
        <span className="muted">{geaendert.length ? `${geaendert.length === 1 ? '1 Tag' : `${geaendert.length} Tage`} geändert` : 'Keine Änderung'}</span>
        <span>
          {(geaendert.length > 0 || minutenGeaendert) && <button type="button" className="ghost" onClick={() => { setWahl(start()); setMinuten(Object.fromEntries(SCHICHT_VORLAGEN.map((v) => [v.id, String(schichtMinuten(v.id, eigene))])) as Record<SchichtId, string>); }}>Zurücksetzen</button>}
          {' '}<button type="button" className="primary" disabled={!ergebnis && !minutenGeaendert} onClick={speichern}>Dienstplan speichern</button>
        </span>
      </div>
    </div>
  );
}

function Ausnahmen({ ctx }: { ctx: PlanCtx }) {
  const cfg = ctx.data.config;
  const today = ctx.data.today;
  const [von, setVon] = useState(today);
  const [bis, setBis] = useState(today);
  const [min, setMin] = useState('0');
  const [notiz, setNotiz] = useState('');
  const ex = cfg.availability.exceptions ?? {};
  const notes = cfg.exceptionNotes ?? {};
  const kommend = Object.keys(ex).filter((d) => d >= today).sort();
  const n = Math.max(0, Math.round(Number(min) || 0));
  const feedback = useFormFeedback({
    from: !von ? 'Wähle den ersten Tag der Ausnahme.' : von < today ? 'Wähle heute oder einen späteren Tag.' : '',
    to: !bis ? 'Wähle den letzten Tag der Ausnahme.' : bis < von ? 'Das Enddatum darf nicht vor dem Startdatum liegen.' : '',
    minutes: !min.trim() || !Number.isInteger(Number(min)) || Number(min) < 0 || Number(min) > 1440 ? 'Gib eine ganze Zahl zwischen 0 und 1440 Minuten ein. 0 bedeutet keine Lernzeit.' : '',
  });

  const vorschau = useMemo(() => {
    const minOk = !!min.trim() && Number.isInteger(Number(min)) && Number(min) >= 0 && Number(min) <= 1440;
    if (!von || !bis || bis < von || von < today || !minOk) return undefined;
    const exceptions = { ...ex };
    for (const d of eachDay(von, addDays(bis, 1))) exceptions[d] = n;
    return { ...cfg.availability, exceptions };
  }, [von, bis, n, min, ex, cfg.availability, today]);

  const hinzufuegen = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedback.validate(e.currentTarget)) return;
    const tage = eachDay(von, addDays(bis, 1));
    const exceptions = { ...ex };
    const exceptionNotes = { ...notes };
    for (const d of tage) { exceptions[d] = n; if (notiz.trim()) exceptionNotes[d] = notiz.trim(); else delete exceptionNotes[d]; }
    speichere(() => saveConfig({ availability: { ...cfg.availability, exceptions }, exceptionNotes }),
      `${tage.length === 1 ? '1 Tag' : `${tage.length} Tage`} geändert, Plan neu berechnet`);
    setNotiz('');
  };
  const entfernen = (d: string) => {
    const { [d]: _a, ...exceptions } = ex;
    const { [d]: _b, ...exceptionNotes } = notes;
    speichere(() => saveConfig({ availability: { ...cfg.availability, exceptions }, exceptionNotes }), 'Ausnahme entfernt');
  };

  return (
    <div className="card">
      <h3>Ausnahmen</h3>
      <p className="muted">Krank, Spätdienst, Urlaub oder ein freier Tag mit mehr Zeit. Verpasste Blöcke landen automatisch wieder im Plan.</p>
      <form className="ausnahme-form" onSubmit={hinzufuegen} noValidate>
        <p className="required-note">Mit <span className="required-mark">*</span> markierte Felder sind erforderlich.</p>
        <Field label="Von" name="from" required error={feedback.error('from')}>{(props) => <input {...props} type="date" value={von} min={today} onBlur={() => feedback.touch('from')} onChange={(e) => { setVon(e.target.value); if (bis < e.target.value) setBis(e.target.value); }} />}</Field>
        <Field label="Bis einschließlich" name="to" required error={feedback.error('to')}>{(props) => <input {...props} type="date" value={bis} min={von} onBlur={() => feedback.touch('to')} onChange={(e) => setBis(e.target.value)} />}</Field>
        <div className="pills ausnahme-form__vorlagen" role="group" aria-label="Vorlage übernehmen">
          {SCHICHT_VORLAGEN.map((v) => <button key={v.id} type="button" className="pill" aria-pressed={notiz === v.label && n === schichtMinuten(v.id, cfg.shiftMinutes)} onClick={() => { setMin(String(schichtMinuten(v.id, cfg.shiftMinutes))); setNotiz(v.label); }}>{v.label}</button>)}
        </div>
        <Field label="Lernzeit pro Tag in Minuten" name="minutes" required hint="0 Minuten bedeutet: An diesen Tagen hast du frei vom Lernen." error={feedback.error('minutes')}>{(props) => <input {...props} type="number" min={0} max={1440} step={1} inputMode="numeric" value={min} onBlur={() => feedback.touch('minutes')} onChange={(e) => setMin(e.target.value)} />}</Field>
        <Field label="Notiz" name="note" hint="Optional. Zum Beispiel Schichtdienst, Urlaub oder krank.">{(props) => <input {...props} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Spätdienst" />}</Field>
        <AenderungsVorschau ctx={ctx} availability={vorschau} />
        <button type="submit">{n === 0 ? 'Als Ausfall eintragen' : 'Lernzeit übernehmen'}</button>
      </form>
      {kommend.length > 0 && (
        <ul className="erledigt">
          {kommend.map((d) => (
            <li key={d}>
              <span>{kurzDatum(d)}{notes[d] ? ` · ${notes[d]}` : ''}</span>
              <span className="muted">{ex[d] ? dauer(ex[d]!) : 'keine Lernzeit'} <button type="button" className="small ghost" onClick={() => entfernen(d)} aria-label={`Ausnahme am ${kurzDatum(d)} entfernen`}>Entfernen</button></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Zeit({ ctx }: { ctx: PlanCtx }) {
  const cfg = ctx.data.config;
  const [woche, setWoche] = useState(() => cfg.availability.minutesByWeekday.map(String));
  const summe = woche.reduce((s, x) => s + (Math.round(Number(x)) || 0), 0);
  const geaendert = woche.some((x, i) => (Math.round(Number(x)) || 0) !== cfg.availability.minutesByWeekday[i]);
  const s = ctx.settings;
  const feedback = useFormFeedback(Object.fromEntries(woche.map((value, i) => [`day-${i}`, !value.trim() || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 1440 ? 'Gib eine ganze Zahl zwischen 0 und 1440 Minuten ein. Für einen freien Tag trage 0 ein.' : ''])));

  const wocheSpeichern = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedback.validate(e.currentTarget)) return;
    const minutesByWeekday = woche.map((x) => Math.max(0, Math.round(Number(x)) || 0)) as Availability['minutesByWeekday'];
    speichere(() => saveConfig({ availability: { ...cfg.availability, minutesByWeekday } }), 'Wochenzeit gespeichert, Plan neu berechnet');
  };
  const setting = (patch: Partial<typeof s>) => speichere(() => saveConfig({ settings: { ...cfg.settings, ...patch } }), 'Einstellung gespeichert');

  return (
    <div className="stack-2">
      <form className="card" onSubmit={wocheSpeichern} noValidate>
        <h3>Lernzeit pro Woche</h3>
        <p className="muted">Wie viele Minuten du an einem normalen Tag lernen kannst. Davon bleiben {Math.round(s.bufferRatio * 100)} % als Puffer frei.</p>
        <div className="wochentage">
          {REIHENFOLGE.map((i) => (
            <Field key={i} label={`${WEEKDAYS[i]} · Minuten`} name={`day-${i}`} required error={feedback.error(`day-${i}`)}>
              {(props) => <input {...props} type="number" min={0} max={1440} step={1} inputMode="numeric" value={woche[i]} onBlur={() => feedback.touch(`day-${i}`)} onChange={(e) => setWoche((w) => w.map((x, j) => (j === i ? e.target.value : x)))} />}
            </Field>
          ))}
        </div>
        <div className="row">
          <span className="muted">Zusammen {dauer(summe)} pro Woche</span>
          <button type="submit" className="primary" disabled={!geaendert}>Speichern</button>
        </div>
      </form>

      <Dienstplan ctx={ctx} />

      <Ausnahmen ctx={ctx} />

      <div className="card">
        <h3>Lernblöcke</h3>
        <div className="einstellungen">
          <div>
            <p>Länge eines Lernblocks</p>
            <div className="pills" role="group" aria-label="Blocklänge">
              {BLOCK.map((m) => <button key={m} type="button" className="pill" aria-pressed={s.blockMinutes === m} onClick={() => setting({ blockMinutes: m })}>{m} Min.</button>)}
            </div>
          </div>
          <div>
            <p>Dauer einer Abfrage</p>
            <div className="pills" role="group" aria-label="Abfragedauer">
              {ABFRAGE.map((m) => <button key={m} type="button" className="pill" aria-pressed={s.reviewMinutes === m} onClick={() => setting({ reviewMinutes: m })}>{m} Min.</button>)}
            </div>
          </div>
          <div>
            <p>Puffer für Unvorhergesehenes</p>
            <div className="pills" role="group" aria-label="Puffer">
              {PUFFER.map((p) => <button key={p} type="button" className="pill" aria-pressed={s.bufferRatio === p} onClick={() => setting({ bufferRatio: p })}>{Math.round(p * 100)} %</button>)}
            </div>
          </div>
        </div>
        <p className="muted">Wiederholungen folgen FSRS mit Ziel {Math.round(s.desiredRetention * 100)} % Abrufwahrscheinlichkeit. „Sicher“ ist ein Thema erst nach mindestens zwei erfolgreichen Abfragen an verschiedenen Tagen.</p>
      </div>
    </div>
  );
}
