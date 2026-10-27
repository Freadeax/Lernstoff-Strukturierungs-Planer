import { useStore, createStore, storage } from '../lib/store';
import { LazyWidget } from './LazyWidget';
import type { WidgetDefinition, WidgetLifecycle } from './types';
import { notify } from '../shell/notifications';

// Ausgeblendete Module je Seite, dauerhaft auf dem Gerät.
const KEY = 'lernstoff.hidden';
const hidden = createStore<{ ids: string[] }>({ ids: storage.list<string>(KEY, (v) => typeof v === 'string') }, (s) => storage.write(KEY, s.ids));

/** Fehler eines Moduls landen als Mitteilung, ohne andere Module zu stören. */
export const defaultLifecycle: WidgetLifecycle = {
  onError: (id, e) => notify('warning', `Modul „${id}“ meldet einen Fehler`, e.message),
};

/** 12-Spalten-Raster. Spaltenbreite je Modul folgt der Breite des Inhaltsbereichs (Container Queries). */
export function WidgetGrid({ widgets, allowHide = true }: { widgets: WidgetDefinition[]; allowHide?: boolean }) {
  const ids = useStore(hidden, (s) => s.ids);
  const visible = widgets.filter((w) => !ids.includes(w.id));
  const hiddenHere = widgets.filter((w) => ids.includes(w.id));
  return (
    <>
      <div className="grid12">
        {visible.map((w) => (
          <LazyWidget key={w.id} def={w} lifecycle={defaultLifecycle}
            onHide={allowHide ? () => hidden.set((s) => ({ ids: [...s.ids, w.id] })) : undefined} />
        ))}
      </div>
      {hiddenHere.length > 0 && (
        <p className="grid12__hidden muted">
          Ausgeblendet: {hiddenHere.map((w) => w.title).join(', ')}{' '}
          <button type="button" className="small" onClick={() => hidden.set((s) => ({ ids: s.ids.filter((x) => !hiddenHere.some((w) => w.id === x)) }))}>Wieder einblenden</button>
        </p>
      )}
    </>
  );
}
