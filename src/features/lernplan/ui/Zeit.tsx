import { useState } from 'react';
import { notify } from '../../../ui/shell/notifications';
import { addDays, eachDay } from '../dates';
import { saveConfig, WEEKDAYS } from '../store';
import type { Availability } from '../types';
import { dauer, kurzDatum } from './format';
import type { PlanCtx } from './Lernplan';

// Montag zuerst, wie im deutschen Kalender
const REIHENFOLGE = [1, 2, 3, 4, 5, 6, 0];
const BLOCK = [25, 30, 45, 60];
const ABFRAGE = [10, 15, 20, 30];
const PUFFER = [0, 0.1, 0.2];

async function speichere(fn: () => Promise<void>, ok: string) {
  try { await fn(); notify('info', ok); } catch (e) { notify('critical', 'Nicht gespeichert', e instanceof Error ? e.message : String(e)); }
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

  const hinzufuegen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!von || bis < von) return;
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
      <form className="ausnahme-form" onSubmit={hinzufuegen}>
        <label className="field">Von<input type="date" value={von} min={today} onChange={(e) => { setVon(e.target.value); if (bis < e.target.value) setBis(e.target.value); }} /></label>
        <label className="field">Bis<input type="date" value={bis} min={von} onChange={(e) => setBis(e.target.value)} /></label>
        <label className="field">Minuten pro Tag<input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} size={4} /></label>
        <label className="field">Notiz<input value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. krank" /></label>
        <button type="submit" disabled={!von || bis < von}>{n === 0 ? 'Als Ausfall eintragen' : 'Übernehmen'}</button>
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

  const wocheSpeichern = (e: React.FormEvent) => {
    e.preventDefault();
    const minutesByWeekday = woche.map((x) => Math.max(0, Math.round(Number(x)) || 0)) as Availability['minutesByWeekday'];
    speichere(() => saveConfig({ availability: { ...cfg.availability, minutesByWeekday } }), 'Wochenzeit gespeichert, Plan neu berechnet');
  };
  const setting = (patch: Partial<typeof s>) => speichere(() => saveConfig({ settings: { ...cfg.settings, ...patch } }), 'Einstellung gespeichert');

  return (
    <div className="stack-2">
      <form className="card" onSubmit={wocheSpeichern}>
        <h3>Lernzeit pro Woche</h3>
        <p className="muted">Wie viele Minuten du an einem normalen Tag lernen kannst. Davon bleiben {Math.round(s.bufferRatio * 100)} % als Puffer frei.</p>
        <div className="wochentage">
          {REIHENFOLGE.map((i) => (
            <label key={i} className="field">
              {WEEKDAYS[i]}
              <input inputMode="numeric" value={woche[i]} onChange={(e) => setWoche((w) => w.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${WEEKDAYS[i]}, Minuten`} />
            </label>
          ))}
        </div>
        <div className="row">
          <span className="muted">Zusammen {dauer(summe)} pro Woche</span>
          <button type="submit" className="primary" disabled={!geaendert}>Speichern</button>
        </div>
      </form>

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
