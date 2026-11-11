// Bausteine für synthetische Klänge: Ton mit Hüllkurve, gefiltertes Rauschen, Dauerrauschen.
// Alle Zeiten in Sekunden der AudioContext-Uhr.

export interface Werkzeug {
  ctx: AudioContext;
  /** Ziel dieses Klangs (eigener Regler, damit Stoppen alles auf einmal ausblendet) */
  aus: AudioNode;
  /** Zufall 0..1 (in Tests ersetzbar) */
  zufall: () => number;
  /** Dauerquellen dieses Klangs, werden beim Stoppen beendet */
  dauerquellen?: AudioScheduledSourceNode[];
}

const rauschCache = new WeakMap<BaseAudioContext, AudioBuffer>();
/** Zwei Sekunden weißes Rauschen, einmal je Kontext erzeugt. */
export function rauschPuffer(ctx: BaseAudioContext): AudioBuffer {
  let b = rauschCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    rauschCache.set(ctx, b);
  }
  return b;
}

function huelle(g: GainNode, t: number, pegel: number, attack: number, dauer: number, release: number) {
  const p = g.gain;
  p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(pegel, t + attack);
  p.setValueAtTime(pegel, t + Math.max(attack, dauer - release));
  p.exponentialRampToValueAtTime(0.0001, t + dauer);
}

export interface TonOptionen {
  f: number;
  dauer: number;
  pegel?: number;
  typ?: OscillatorType;
  attack?: number;
  release?: number;
  /** Frequenz am Ende (Gleiten) */
  fEnde?: number;
  /** Tiefpass für weichere Rechteck-/Sägezahntöne */
  tiefpass?: number;
  ziel?: AudioNode;
}

export function ton(w: Werkzeug, t: number, o: TonOptionen) {
  const { ctx } = w;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.typ ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.fEnde) osc.frequency.exponentialRampToValueAtTime(o.fEnde, t + o.dauer);
  huelle(g, t, o.pegel ?? 0.2, o.attack ?? 0.005, o.dauer, o.release ?? Math.min(0.08, o.dauer * 0.6));
  let kette: AudioNode = osc;
  if (o.tiefpass) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.tiefpass; osc.connect(f); kette = f; }
  kette.connect(g).connect(o.ziel ?? w.aus);
  osc.start(t); osc.stop(t + o.dauer + 0.02);
}

export interface RauschOptionen {
  dauer: number;
  pegel?: number;
  filter?: BiquadFilterType;
  f?: number;
  q?: number;
  fEnde?: number;
  attack?: number;
  release?: number;
  ziel?: AudioNode;
}

export function rauschen(w: Werkzeug, t: number, o: RauschOptionen) {
  const { ctx } = w;
  const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  src.buffer = rauschPuffer(ctx);
  src.loop = true;
  f.type = o.filter ?? 'bandpass';
  f.frequency.setValueAtTime(o.f ?? 1000, t);
  if (o.fEnde) f.frequency.exponentialRampToValueAtTime(o.fEnde, t + o.dauer);
  f.Q.value = o.q ?? 1;
  huelle(g, t, o.pegel ?? 0.2, o.attack ?? 0.005, o.dauer, o.release ?? Math.min(0.1, o.dauer * 0.6));
  src.connect(f).connect(g).connect(o.ziel ?? w.aus);
  src.start(t, w.zufall() * 1.5); src.stop(t + o.dauer + 0.02);
}

/**
 * Dauerndes gefiltertes Rauschen (Lüftung, Raumton, Stethoskop). Gibt den Regler zurück,
 * damit ein Rezept die Lautstärke im Takt formen kann (z. B. Atemzug).
 */
export function dauerRauschen(w: Werkzeug, o: { filter?: BiquadFilterType; f: number; q?: number; pegel: number }): GainNode {
  const { ctx } = w;
  const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  src.buffer = rauschPuffer(ctx); src.loop = true;
  f.type = o.filter ?? 'lowpass'; f.frequency.value = o.f; f.Q.value = o.q ?? 0.7;
  g.gain.value = o.pegel;
  src.connect(f).connect(g).connect(w.aus);
  src.start(ctx.currentTime, w.zufall() * 1.5);
  w.dauerquellen?.push(src);
  return g;
}

/** Dauerton (Netzbrummen, Kühlschrank). */
export function dauerTon(w: Werkzeug, o: { f: number; pegel: number; typ?: OscillatorType }): GainNode {
  const osc = w.ctx.createOscillator(), g = w.ctx.createGain();
  osc.type = o.typ ?? 'sine'; osc.frequency.value = o.f; g.gain.value = o.pegel;
  osc.connect(g).connect(w.aus); osc.start();
  w.dauerquellen?.push(osc);
  return g;
}

/** Lautstärke-Rampe auf einem Regler: von `von` nach `bis` in `dauer` ab t. */
export function rampe(g: GainNode, t: number, von: number, bis: number, dauer: number) {
  g.gain.setValueAtTime(Math.max(0.0001, von), t);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, bis), t + dauer);
}

/** Halbtonschritte auf eine Frequenz */
export const halbton = (f: number, n: number) => f * 2 ** (n / 12);
