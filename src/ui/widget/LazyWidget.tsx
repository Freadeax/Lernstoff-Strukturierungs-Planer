import { lazy, Suspense, useState, type ComponentType, type CSSProperties, type LazyExoticComponent } from 'react';
import { useInView } from '../lib/hooks';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorState, SkeletonLines } from './states';
import type { WidgetDefinition, WidgetHostProps, WidgetLifecycle } from './types';

const cache = new Map<string, LazyExoticComponent<ComponentType<WidgetHostProps>>>();
function component(def: WidgetDefinition, fresh: boolean) {
  if (fresh || !cache.has(def.id)) cache.set(def.id, lazy(def.load));
  return cache.get(def.id)!;
}

/** Platzhalter mit fester Höhe, bis der Code des Moduls geladen ist (kein Layout-Sprung). */
function Placeholder({ def }: { def: WidgetDefinition }) {
  return (
    <section className="widget widget--loading" aria-busy="true" aria-label={def.title} style={{ minHeight: def.placeholderHeight }}>
      <header className="widget__header"><div className="widget__titles"><h3 className="widget__title">{def.title}</h3></div></header>
      <div className="widget__body"><SkeletonLines lines={4} /></div>
    </section>
  );
}

export function spanStyle(def: Pick<WidgetDefinition, 'span'>): CSSProperties {
  return { '--span-md': def.span.md ?? 12, '--span-lg': def.span.lg ?? def.span.md ?? 12, '--span-xl': def.span.xl ?? def.span.lg ?? def.span.md ?? 12 } as CSSProperties;
}

/**
 * Lädt ein Modul per dynamischem Import erst, wenn seine Rasterzelle in den sichtbaren
 * Bereich kommt (Intersection Observer). Jedes Modul ist ein eigener Code-Chunk.
 */
export function LazyWidget({ def, onHide, lifecycle }: { def: WidgetDefinition; onHide?: () => void; lifecycle?: WidgetLifecycle }) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '300px' });
  const [attempt, setAttempt] = useState(0);
  const Comp = inView ? component(def, attempt > 0) : null;
  return (
    <div ref={ref} className="grid__cell" style={spanStyle(def)}>
      {Comp ? (
        <ErrorBoundary resetKey={attempt} onError={(e) => lifecycle?.onError?.(def.id, e)}
          fallback={(e) => (
            <section className="widget widget--error" aria-label={def.title}>
              <div className="widget__body"><ErrorState error={e} onRetry={() => setAttempt((a) => a + 1)} /></div>
            </section>
          )}>
          <Suspense fallback={<Placeholder def={def} />}>
            <Comp id={def.id} onHide={onHide} lifecycle={lifecycle} />
          </Suspense>
        </ErrorBoundary>
      ) : <Placeholder def={def} />}
    </div>
  );
}
