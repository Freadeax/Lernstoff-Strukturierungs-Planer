// Gemeinsamer Audio-Motor: ein AudioContext für die ganze App, je Kategorie ein Lautstärkeregler.
// Alle Klänge werden zur Laufzeit synthetisch erzeugt (Web Audio API): keine Dateien, offline, lizenzfrei.
//
// iPhone/iPad: Safari startet Ton erst nach einer Berührung. Der Motor hängt sich deshalb an die nächste
// Berührung/Taste und entsperrt dort. Standard ist die Audio-Sitzung „ambient“: Lautlos-Schalter wird
// beachtet, laufende Musik anderer Apps wird nicht unterbrochen.

import { audioEinstellungen, hoerbar, type AudioEinstellungen, type Kategorie } from './einstellungen';

type Bus = Kategorie | 'frei';
interface Motor { ctx: AudioContext; master: GainNode; busse: Record<Bus, GainNode> }

let motor: Motor | null = null;
let fehlgeschlagen = false;

type AudioCtor = typeof AudioContext;
function klasse(): AudioCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
}

export function audioMoeglich(): boolean { return !!klasse(); }

function audioSitzung(s: AudioEinstellungen) {
  // Safari 16.4+: navigator.audioSession. Andere Browser kennen das nicht.
  const as = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (as) { try { as.type = s.trotzLautlos ? 'playback' : 'ambient'; } catch { /* älteres Safari */ } }
}

function pegelAnwenden(s = audioEinstellungen.get()) {
  if (!motor) return;
  const t = motor.ctx.currentTime;
  motor.master.gain.setTargetAtTime(s.lautstaerke * s.lautstaerke * 0.9 + 0.0001, t, 0.03);
  for (const k of ['ui', 'sim', 'atmo'] as Kategorie[]) {
    const pegel = hoerbar(k, s) ? (k === 'atmo' ? 0.55 : 1) : 0;
    motor.busse[k].gain.setTargetAtTime(pegel, t, 0.04);
  }
}

function erzeuge(): Motor | null {
  if (motor) return motor;
  const K = klasse();
  if (!K || fehlgeschlagen) return null;
  try {
    const ctx = new K({ latencyHint: 'interactive' });
    const master = ctx.createGain();
    // Sanfter Begrenzer: viele gleichzeitige Klänge (Raum + Monitor + Alarm) übersteuern nicht.
    const begrenzer = ctx.createDynamicsCompressor();
    begrenzer.threshold.value = -12; begrenzer.knee.value = 12; begrenzer.ratio.value = 8;
    begrenzer.attack.value = 0.003; begrenzer.release.value = 0.2;
    master.connect(begrenzer).connect(ctx.destination);
    const bus = () => { const g = ctx.createGain(); g.connect(master); return g; };
    motor = { ctx, master, busse: { ui: bus(), sim: bus(), atmo: bus(), frei: bus() } };
    audioSitzung(audioEinstellungen.get());
    pegelAnwenden();
    return motor;
  } catch { fehlgeschlagen = true; return null; }
}

let angemeldet = false;
function anmelden() {
  if (angemeldet || typeof window === 'undefined') return;
  angemeldet = true;
  audioEinstellungen.subscribe(() => { const s = audioEinstellungen.get(); audioSitzung(s); pegelAnwenden(s); });
  const opt = { capture: true, passive: true } as const;
  for (const typ of ['pointerdown', 'touchend', 'keydown'] as const) window.addEventListener(typ, entsperre, opt);
  document.addEventListener('visibilitychange', () => {
    if (!motor) return;
    if (document.hidden) void motor.ctx.suspend().catch(() => {});
    else void motor.ctx.resume().catch(() => {});
  });
}

/**
 * In einem Klick-/Tipp-Handler aufrufen, bevor Ton starten soll (iOS verlangt die Geste).
 * Wird außerdem automatisch bei jeder Berührung aufgerufen, sobald der Motor geladen ist.
 */
export function entsperre() {
  anmelden();
  const s = audioEinstellungen.get();
  if (!motor && !s.an) return;
  const m = erzeuge();
  if (!m || m.ctx.state === 'running') return;
  void m.ctx.resume().catch(() => {});
  try {
    // Ein stiller Puffer innerhalb der Geste schaltet ältere iOS-Versionen frei.
    const b = m.ctx.createBufferSource(); b.buffer = m.ctx.createBuffer(1, 1, 22050); b.connect(m.master); b.start(0);
  } catch { /* nur Komfort */ }
}

export interface Ausgang { ctx: AudioContext; ziel: AudioNode }

/**
 * Ausgang für eine Kategorie oder null, wenn sie stumm ist.
 * `erzwingen` = ausdrücklicher Abspielknopf: spielt auch, wenn automatische Töne aus sind.
 */
export function ausgang(kat: Kategorie, erzwingen = false): Ausgang | null {
  anmelden();
  if (!erzwingen && !hoerbar(kat)) return null;
  const m = erzeuge();
  if (!m) return null;
  if (m.ctx.state === 'suspended' && !document.hidden) void m.ctx.resume().catch(() => {});
  return { ctx: m.ctx, ziel: erzwingen ? m.busse.frei : m.busse[kat] };
}

/** Für Tests: Motor zurücksetzen. */
export function _zuruecksetzen() { motor = null; fehlgeschlagen = false; }
