import { useEffect, useRef, useState } from 'react';
import { liveQuery } from 'dexie';

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Aktuelle Uhrzeit, alle `ms` aktualisiert (für „vor 2 Min.“). */
export function useNow(ms = 30_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Ruft `onVisible` auf, sobald das Element in den sichtbaren Bereich kommt. */
export function useInView<E extends Element>(options: IntersectionObserverInit = { rootMargin: '200px' }) {
  const ref = useRef<E | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setInView(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return [ref, inView] as const;
}

/**
 * Wiederholt auslösender Beobachter, z. B. für unendliches Scrollen. Beobachtet relativ zum
 * nächsten Elternelement mit data-scroll-root (Körperzone eines Widgets), sonst zum Fenster.
 */
export function useSentinel(onHit: () => void, enabled: boolean, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onHit);
  cb.current = onHit;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;
    const root = el.closest('[data-scroll-root]');
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) cb.current(); }, { root, rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
  return ref;
}

export { liveQuery };
