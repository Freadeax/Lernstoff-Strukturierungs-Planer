// Abspielen: einmalige Klänge und Schleifen mit kleinem Vorausplaner (Web-Audio-Uhr, nicht setTimeout-genau).

import type { Kategorie } from './einstellungen';
import { KLANG, type KlangId, type KlangParameter } from './klaenge';
import { ausgang } from './motor';
import type { Werkzeug } from './synth';

export interface SpielOptionen {
  /** Abspielknopf: spielt auch, wenn automatische Töne aus sind */
  erzwingen?: boolean;
  /** Kategorie überschreiben (z. B. Herzton im Hör-Trainer als 'sim') */
  kategorie?: Kategorie;
}

function werkzeug(id: KlangId, o: SpielOptionen): { w: Werkzeug; regler: GainNode } | null {
  const k = KLANG[id];
  if (!k) return null;
  const a = ausgang(o.kategorie ?? k.kategorie, o.erzwingen);
  if (!a) return null;
  const regler = a.ctx.createGain();
  regler.connect(a.ziel);
  return { w: { ctx: a.ctx, aus: regler, zufall: Math.random, dauerquellen: [] }, regler };
}

/** Spielt einen Klang einmal. Still, wenn die Kategorie aus ist oder der Browser kein Web Audio kann. */
export function spiele(id: KlangId, p: KlangParameter = {}, o: SpielOptionen = {}): void {
  try {
    const x = werkzeug(id, o);
    if (!x) return;
    const k = KLANG[id]!;
    const z = k.start?.(x.w, p) ?? {};
    k.takt(x.w, x.w.ctx.currentTime + 0.02, p, z);
    // Dauerklänge (start) nach 10 s abbauen, Einzelereignisse enden von selbst.
    if (k.start) window.setTimeout(() => ausblenden(x.regler, x.w.ctx, x.w.dauerquellen), 10000);
    else window.setTimeout(() => x.regler.disconnect(), 12000);
  } catch { /* Ton ist Komfort, nie ein Fehler für die Seite */ }
}

function ausblenden(regler: GainNode, ctx: AudioContext, quellen: AudioScheduledSourceNode[] = [], dauer = 0.12) {
  try {
    regler.gain.setTargetAtTime(0, ctx.currentTime, dauer / 3);
    window.setTimeout(() => {
      for (const q of quellen) { try { q.stop(); } catch { /* schon gestoppt */ } }
      try { regler.disconnect(); } catch { /* schon getrennt */ }
    }, dauer * 1000 + 200);
  } catch { /* schon getrennt */ }
}

export interface Schleife {
  /** Parameter ändern (z. B. neuer Puls), wirkt ab dem nächsten Takt */
  setze(p: KlangParameter): void;
  stopp(): void;
}

const VORLAUF = 0.35;

/** Startet einen Klang als Schleife. null, wenn stumm/nicht möglich. */
export function starteSchleife(id: KlangId, p: KlangParameter = {}, o: SpielOptionen = {}): Schleife | null {
  try {
    const x = werkzeug(id, o);
    if (!x) return null;
    const k = KLANG[id]!;
    const { w, regler } = x;
    let param = { ...p };
    const z = k.start?.(w, param) ?? {};
    let naechste = w.ctx.currentTime + 0.05;
    let lauf = true;
    const plane = () => {
      if (!lauf) return;
      // Nach einer Pause (Tab im Hintergrund) nicht alle verpassten Takte nachholen.
      if (naechste < w.ctx.currentTime - 1) naechste = w.ctx.currentTime + 0.05;
      let schutz = 0;
      while (naechste < w.ctx.currentTime + VORLAUF && schutz++ < 20) {
        const abstand = k.takt(w, naechste, param, z);
        naechste += Math.max(0.05, abstand || 1);
      }
    };
    plane();
    const id_ = window.setInterval(plane, 100);
    return {
      setze(neu) { param = { ...param, ...neu }; },
      stopp() { if (!lauf) return; lauf = false; clearInterval(id_); ausblenden(regler, w.ctx, w.dauerquellen); },
    };
  } catch { return null; }
}
