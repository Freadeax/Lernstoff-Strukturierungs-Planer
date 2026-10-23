import { useId } from 'react';
import { useStore } from '../../ui/lib/store';
import { timeZones } from '../../ui/lib/time';
import { Icon } from '../../ui/icons';
import { getModule } from '../../modules/registry';
import { session } from '../../ui/shell/session';
import { drillUp, filterStore, presetRange } from './filterStore';

const PRESETS = [[7, '7 Tage'], [14, '14 Tage'], [30, '30 Tage'], [90, '90 Tage']] as const;

/** Globale Filterleiste für die Übersicht: Zeitraum mit Zeitzone und Fach. */
export function FilterBar() {
  const f = useStore(filterStore, (s) => s);
  const moduleId = useStore(session, (s) => s.moduleId);
  const subjects = getModule(moduleId)?.subjects ?? [];
  const id = useId();
  const invalid = f.from > f.to;

  return (
    <div className="filterbar" role="search" aria-label="Globale Filter">
      <div className="filterbar__presets pills" role="group" aria-label="Zeitraum schnell wählen">
        {PRESETS.map(([d, label]) => {
          const r = presetRange(d, f);
          return (
            <button key={d} type="button" className="pill" aria-pressed={r.from === f.from && r.to === f.to}
              onClick={() => filterStore.set({ ...r, previous: undefined })}>{label}</button>
          );
        })}
        {f.previous && (
          <button type="button" className="pill pill--accent" onClick={drillUp}>
            <Icon name="chevronLeft" size={14} /> Zurück zum Zeitraum
          </button>
        )}
      </div>
      <div className="filterbar__fields">
        <label className="field">
          <span>Von</span>
          <input type="date" value={f.from} max={f.to} aria-invalid={invalid} aria-describedby={invalid ? `${id}-err` : undefined}
            onChange={(e) => e.target.value && filterStore.set({ from: e.target.value, previous: undefined })} />
        </label>
        <label className="field">
          <span>Bis</span>
          <input type="date" value={f.to} min={f.from} aria-invalid={invalid}
            onChange={(e) => e.target.value && filterStore.set({ to: e.target.value, previous: undefined })} />
        </label>
        <label className="field">
          <span>Zeitzone</span>
          <select value={f.timeZone} onChange={(e) => filterStore.set({ timeZone: e.target.value })}>
            {timeZones().map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Fach</span>
          <select value={f.subjectId} onChange={(e) => filterStore.set({ subjectId: e.target.value })}>
            <option value="">Alle Fächer</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} · ` : ''}{s.name}</option>)}
          </select>
        </label>
        <label className="check filterbar__persist">
          <input type="checkbox" checked={f.persist} onChange={(e) => filterStore.set({ persist: e.target.checked })} />
          Filter merken
        </label>
      </div>
      {invalid && <p id={`${id}-err`} className="field-error">„Von“ liegt nach „Bis“.</p>}
    </div>
  );
}
