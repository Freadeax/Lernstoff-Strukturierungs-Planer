import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// Verschieben und Zoomen für die Landkarte: ein Finger oder Maus zieht, zwei Finger zoomen,
// Mausrad/Trackpad, Doppeltipp, Tastatur. Die Ansicht wird direkt am Element gesetzt
// (kein React-Rendern pro Bewegung), nur der Zoomwert für die Anzeige geht in den State.

export interface View { x: number; y: number; k: number }

const MIN_K = 0.12, MAX_K = 2.5, DRAG_PX = 6, DOUBLE_TAP_MS = 300;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

export function usePanZoom(viewport: RefObject<HTMLDivElement | null>, world: RefObject<HTMLDivElement | null>, size: { w: number; h: number }, onView?: (v: View) => void) {
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const listener = useRef(onView);
  listener.current = onView;
  const [zoom, setZoom] = useState(1);
  const dragged = useRef(false);

  const apply = useCallback((animate = false) => {
    const el = world.current;
    if (!el) return;
    const { x, y, k } = view.current;
    el.classList.toggle('is-animated', animate);
    el.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    listener.current?.(view.current);
    setZoom(k);
  }, [world]);

  const zoomAt = useCallback((px: number, py: number, k: number, animate = false) => {
    const v = view.current, nk = clampK(k);
    view.current = { k: nk, x: px - ((px - v.x) / v.k) * nk, y: py - ((py - v.y) / v.k) * nk };
    apply(animate);
  }, [apply]);

  const zoomBy = useCallback((f: number) => {
    const r = viewport.current?.getBoundingClientRect();
    if (r) zoomAt(r.width / 2, r.height / 2, view.current.k * f, true);
  }, [viewport, zoomAt]);

  const fit = useCallback((animate = true) => {
    const r = viewport.current?.getBoundingClientRect();
    if (!r || !r.width || !size.w) return;
    const k = clampK(Math.min(r.width / size.w, r.height / size.h) * 0.96);
    view.current = { k, x: (r.width - size.w * k) / 2, y: Math.max(0, (r.height - size.h * k) / 2) };
    apply(animate);
  }, [viewport, size.w, size.h, apply]);

  /**
   * Rechteck in Weltkoordinaten an einen Ankerpunkt holen (Anteil der Fläche, Standard Mitte);
   * `minK` zoomt dabei mindestens so weit hinein.
   */
  const centerOn = useCallback((box: { x: number; y: number; w: number; h: number }, minK = 0.8, anchor = { x: 0.5, y: 0.5 }) => {
    const r = viewport.current?.getBoundingClientRect();
    if (!r) return;
    const k = Math.max(view.current.k, minK);
    view.current = { k, x: r.width * anchor.x - (box.x + box.w / 2) * k, y: r.height * anchor.y - (box.y + box.h / 2) * k };
    apply(true);
  }, [viewport, apply]);

  const isVisible = useCallback((box: { x: number; y: number; w: number; h: number }) => {
    const r = viewport.current?.getBoundingClientRect();
    if (!r) return true;
    const { x, y, k } = view.current;
    return box.x * k + x >= 0 && box.y * k + y >= 0 && (box.x + box.w) * k + x <= r.width && (box.y + box.h) * k + y <= r.height;
  }, [viewport]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let start: { x: number; y: number; vx: number; vy: number } | null = null;
    let pinch: { d: number; k: number } | null = null;
    let lastTap = { t: 0, x: 0, y: 0 };
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const twoFinger = () => {
      const [a, b] = [...pointers.values()];
      return { d: Math.hypot(a!.x - b!.x, a!.y - b!.y), mx: (a!.x + b!.x) / 2, my: (a!.y + b!.y) / 2 };
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) {
        const p = local(e);
        start = { x: p.x, y: p.y, vx: view.current.x, vy: view.current.y };
        dragged.current = false;
      } else if (pointers.size === 2) {
        pinch = { d: twoFinger().d, k: view.current.k };
        dragged.current = true;
        start = null;
        for (const id of pointers.keys()) try { el.setPointerCapture(id); } catch { /* bereits beendet */ }
      }
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size >= 2 && pinch) {
        const { d, mx, my } = twoFinger();
        if (pinch.d > 0) zoomAt(mx, my, pinch.k * (d / pinch.d));
        // Mittelpunkt mitführen: neuer Ausgangswert für die nächste Bewegung
        pinch = { d, k: view.current.k };
        return;
      }
      if (!start) return;
      const p = local(e);
      const dx = p.x - start.x, dy = p.y - start.y;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_PX) return;
      if (!dragged.current) {
        dragged.current = true;
        // Erst beim echten Ziehen einfangen, sonst kämen Tipps auf Themen nicht mehr an
        try { el.setPointerCapture(e.pointerId); } catch { /* ignorieren */ }
        el.classList.add('is-dragging');
      }
      view.current = { ...view.current, x: start.vx + dx, y: start.vy + dy };
      apply();
    };
    const up = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const p = local(e);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 1) {
        // Nach dem Zoomen mit einem Finger nahtlos weiterziehen
        const rest = [...pointers.values()][0]!;
        start = { x: rest.x, y: rest.y, vx: view.current.x, vy: view.current.y };
        return;
      }
      el.classList.remove('is-dragging');
      start = null;
      // Doppeltipp auf freie Fläche: hineinzoomen
      const onNode = (e.target as Element | null)?.closest?.('.karte__node');
      if (!dragged.current && !onNode) {
        const now = e.timeStamp;
        if (now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 30) {
          zoomAt(p.x, p.y, view.current.k * 1.8, true);
          lastTap = { t: 0, x: 0, y: 0 };
        } else lastTap = { t: now, x: p.x, y: p.y };
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      if (e.ctrlKey || e.metaKey) zoomAt(p.x, p.y, view.current.k * Math.exp(-e.deltaY * 0.01));
      else if (e.shiftKey && !e.deltaX) { view.current = { ...view.current, x: view.current.x - e.deltaY }; apply(); }
      else { view.current = { ...view.current, x: view.current.x - e.deltaX, y: view.current.y - e.deltaY }; apply(); }
    };
    // Safari (iPad/iPhone): eigene Pinch-Geste der Seite unterdrücken, wir zoomen selbst
    const gesture = (e: Event) => e.preventDefault();
    // Ein Tipp nach dem Ziehen darf kein Thema auswählen
    const click = (e: MouseEvent) => { if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false; } };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gesture);
    el.addEventListener('gesturechange', gesture);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gesture);
      el.removeEventListener('gesturechange', gesture);
      el.removeEventListener('click', click, true);
    };
  }, [viewport, apply, zoomAt]);

  /** Tastatur auf der Kartenfläche: Pfeile verschieben, +/− zoomen, 0 passt ein. */
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const step = 80;
    const pan = (dx: number, dy: number) => { view.current = { ...view.current, x: view.current.x + dx, y: view.current.y + dy }; apply(true); };
    switch (e.key) {
      case 'ArrowLeft': pan(step, 0); break;
      case 'ArrowRight': pan(-step, 0); break;
      case 'ArrowUp': pan(0, step); break;
      case 'ArrowDown': pan(0, -step); break;
      case '+': case '=': zoomBy(1.25); break;
      case '-': zoomBy(0.8); break;
      case '0': fit(); break;
      default: return;
    }
    e.preventDefault();
  }, [apply, zoomBy, fit]);

  return { zoom, zoomBy, fit, centerOn, isVisible, onKeyDown, minZoom: MIN_K, maxZoom: MAX_K };
}
