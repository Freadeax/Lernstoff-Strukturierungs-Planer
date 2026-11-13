import { Fragment, useEffect, useRef } from 'react';
import { createStore, useStore } from '../lib/store';
import { navigate } from './router';
import { fokus, schalteFokus, setzeFokus } from './fokus';

// Tastenkürzel für iPad mit Tastatur und Computer. „?“ zeigt die Übersicht.
// Kürzel greifen nicht, solange in ein Feld getippt wird.

export const SPRUENGE: Array<[string, string, string]> = [
  ['1', '/', 'Heute'],
  ['2', '/lernen/plan', 'Lernplan'],
  ['3', '/material/dokumente', 'Material'],
  ['4', '/lernen/ueben', 'Üben'],
  ['5', '/lernen/karten', 'Karteikarten'],
];

export const kuerzelHilfe = createStore({ offen: false });

export function imFeld(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/** Taste → Pfad für Alt/Wahltaste + Ziffer (code, weil die Wahltaste auf dem Mac Sonderzeichen erzeugt). */
export function sprungZiel(e: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'code'>): string | null {
  if (!e.altKey || e.ctrlKey || e.metaKey) return null;
  const ziffer = /^Digit(\d)$/.exec(e.code)?.[1];
  return SPRUENGE.find(([k]) => k === ziffer)?.[1] ?? null;
}

export function Tastenkuerzel() {
  const offen = useStore(kuerzelHilfe, (s) => s.offen);
  const dialog = useRef<HTMLDialogElement>(null);
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const alt = mac ? '⌥' : 'Alt';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const ziel = sprungZiel(e);
      if (ziel) { e.preventDefault(); navigate(ziel); return; }
      if (e.key === 'Escape' && fokus.get().an && !document.querySelector('dialog[open], [aria-expanded="true"][aria-haspopup]')) { setzeFokus(false); return; }
      if (imFeld(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '?') { e.preventDefault(); kuerzelHilfe.set({ offen: true }); }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); schalteFokus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  return (
    <dialog ref={dialog} className="kuerzel" aria-labelledby="kuerzel-titel" onClose={() => kuerzelHilfe.set({ offen: false })}
      onClick={(e) => { if (e.target === dialog.current) kuerzelHilfe.set({ offen: false }); }}>
      <h2 id="kuerzel-titel">Tastenkürzel</h2>
      <p className="muted">Für iPad mit Tastatur und Computer. Greifen nicht, während du in ein Feld tippst.</p>
      <dl className="summary-list">
        <dt><kbd>{mac ? '⌘' : 'Strg'} K</kbd> oder <kbd>/</kbd></dt><dd>Suche</dd>
        {SPRUENGE.map(([k, , l]) => <Fragment key={k}><dt><kbd>{alt} {k}</kbd></dt><dd>{l}</dd></Fragment>)}
        <dt><kbd>F</kbd></dt><dd>Fokus-Modus an/aus (Menüs ausblenden, Lernzeit-Timer)</dd>
        <dt><kbd>?</kbd></dt><dd>Diese Übersicht</dd>
        <dt><kbd>Esc</kbd></dt><dd>Dialog oder Menü schließen, sonst Fokus-Modus beenden</dd>
      </dl>
      <form method="dialog"><button className="primary">Schließen</button></form>
    </dialog>
  );
}
