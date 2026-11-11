// Synthetische Übungsbilder (Phantome) für CT-Thorax und Röntgen-Thorax.
// Die Bilder werden im Browser aus einfachen Formen berechnet: keine Patientendaten, keine Lizenzfragen,
// kein Download. Sie sind didaktisch vereinfacht und ersetzen keine echte Bildgebung.
//
// Rohwerte liegen einheitlich als Uint16 (0..4095) vor:
//   CT:       Rohwert = HU + 1024   (Luft -1000 HU, Fett -100, Wasser 0, Weichteil ~40, Knochen 400..1000)
//   Röntgen:  Rohwert = Schwächung * 4095 (0 = schwarz/Luft, 1 = weiß/Knochen)
// Orientierung wie in der Radiologie: Patientenrechts liegt im Bild links.

export type Modalitaet = 'ct' | 'roentgen';

export type CtVariante = 'normal' | 'pneumonie' | 'lungenembolie' | 'pneumothorax' | 'erguss';
export type RoentgenVariante = 'normal' | 'pneumonie' | 'pneumothorax' | 'stauung';

export interface Rohbild {
  breite: number;
  hoehe: number;
  /** 0..4095, siehe Kopfkommentar. */
  werte: Uint16Array;
}

export const ROH_MAX = 4095;
export const huZuRoh = (hu: number) => Math.max(0, Math.min(ROH_MAX, Math.round(hu + 1024)));
export const rohZuHu = (roh: number) => roh - 1024;

// ---------- kleine Mathe-Helfer ----------

const klemme = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const glatt = (k0: number, k1: number, x: number) => {
  const t = klemme((x - k0) / (k1 - k0));
  return t * t * (3 - 2 * t);
};
/** 1 innerhalb der Ellipse, 0 außerhalb, weicher Rand der Breite `rand` (in Ellipsen-Einheiten). */
function ellipse(u: number, v: number, cx: number, cy: number, a: number, b: number, rand = 0.04): number {
  if (a <= 0 || b <= 0) return 0;
  const du = (u - cx) / a, dv = (v - cy) / b;
  const d = Math.sqrt(du * du + dv * dv);
  return 1 - glatt(1 - rand, 1 + rand, d);
}
/** Deterministischer Zufall 0..1 aus Ganzzahlen. */
function hash(i: number, j: number, s: number): number {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
/** Glattes Wertrauschen 0..1 an kontinuierlicher Stelle. */
function rauschen(x: number, y: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x: number, y: number, s: number) => 0.55 * rauschen(x, y, s) + 0.3 * rauschen(x * 2.1, y * 2.1, s + 7) + 0.15 * rauschen(x * 4.3, y * 4.3, s + 13);

/** Fein verteilte Gefäßpunkte in der Lunge (Querschnitte), dichter zum Hilus. */
function gefaessPunkte(u: number, v: number, hilusX: number, z: number): number {
  const g = 22; // Raster
  const gx = Math.floor((u + 1) * g), gy = Math.floor((v + 1) * g);
  let wert = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const cx = gx + dx, cy = gy + dy;
    const zs = Math.floor(z * 18);
    const h = hash(cx, cy, 31 + zs);
    if (h > 0.3) continue;
    const px = (cx + hash(cx, cy, 5 + zs)) / g - 1, py = (cy + hash(cx, cy, 9 + zs)) / g - 1;
    const naheHilus = 1 - klemme(Math.abs(px - hilusX) / 0.5);
    const r = 0.004 + 0.012 * naheHilus * naheHilus * hash(cx, cy, 17);
    const d = Math.hypot(u - px, v - py);
    wert = Math.max(wert, 1 - glatt(r * 0.6, r, d));
  }
  return wert;
}

// ---------- CT-Thorax, axiale Schicht ----------

/**
 * Eine axiale Schicht. `z` von 0 (Lungenspitze) bis 1 (Zwerchfell/Oberbauch).
 * Bei `kontrast` (CT-Angiographie) sind Herzhöhlen und Gefäße hell.
 */
export function ctSchicht(z: number, variante: CtVariante = 'normal', groesse = 320, kontrast = variante === 'lungenembolie'): Rohbild {
  const N = groesse, werte = new Uint16Array(N * N);
  const blut = kontrast ? 320 : 45;
  // Form der Lungen über die Höhe: oben klein, Mitte groß, unten verdrängt die Leberkuppel rechts.
  const lungeS = 0.45 + 0.55 * Math.sin(Math.PI * klemme(0.08 + z * 0.92, 0, 1) * 0.92);
  const leber = glatt(0.72, 1.0, z); // 0..1, rechts (Bild links) stärker
  const milz = glatt(0.82, 1.0, z);
  const herz = glatt(0.38, 0.55, z) * (1 - glatt(0.9, 1.02, z));
  const trachea = 1 - glatt(0.3, 0.42, z);
  const pt = variante === 'pneumothorax';

  for (let y = 0; y < N; y++) {
    const v = (y + 0.5) / N * 2 - 1;
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N * 2 - 1;
      // Körper
      const koerper = ellipse(u, v, 0, 0.03, 0.9, 0.66, 0.015);
      if (koerper <= 0.001) { werte[y * N + x] = huZuRoh(-1000 + (hash(x, y, 1) - 0.5) * 30); continue; }
      const muskel = ellipse(u, v, 0, 0.03, 0.84, 0.6, 0.03);
      let hu = -100 + 150 * muskel; // Fett außen, Muskel innen (~50)

      // Lungen
      const rl = ellipse(u, v, -0.4, 0.02 + leber * 0.06, 0.34 * lungeS, 0.5 * lungeS * (1 - 0.55 * leber), 0.03);
      let ll = ellipse(u, v, 0.41, 0.02, 0.33 * lungeS, 0.5 * lungeS * (1 - 0.4 * milz), 0.03);
      // Herz drückt die linke Lunge nach außen
      ll *= 1 - ellipse(u, v, 0.12, 0.08, 0.3 * herz + 0.01, 0.26 * herz + 0.01, 0.1) * 0.9;
      let lungeAnteil = Math.max(rl, ll);
      let ptLuft = 0;
      if (pt) {
        // Linke Lunge kollabiert zum Hilus, außen bleibt freie Luft ohne Gefäßzeichnung
        const kollaps = ellipse(u, v, 0.3, 0.02, 0.2 * lungeS, 0.36 * lungeS, 0.04);
        ptLuft = ll * (1 - kollaps);
        ll = Math.min(ll, kollaps);
        lungeAnteil = Math.max(rl, ll);
      }
      if (lungeAnteil > 0.001) {
        const textur = (fbm(u * 9, v * 9, 3) - 0.5) * 50;
        let lungeHu = -860 + textur;
        const hilusX = u < 0 ? -0.18 : 0.18;
        const g = gefaessPunkte(u, v, hilusX, z);
        lungeHu = lungeHu + (blut - lungeHu) * g;
        hu = hu + (lungeHu - hu) * lungeAnteil;
      }
      if (ptLuft > 0.001) hu = hu + (-995 - hu) * ptLuft;

      // Pleuraerguss: Flüssigkeit liegt hinten (unten im Bild) in beiden Lungenbasen
      if (variante === 'erguss' && z > 0.5) {
        const tiefe = 0.18 * glatt(0.5, 0.9, z);
        const erg = Math.max(
          ellipse(u, v, -0.42, 0.42, 0.3, tiefe + 0.02, 0.08) * rl,
          ellipse(u, v, 0.42, 0.42, 0.28, tiefe * 0.8 + 0.02, 0.08) * ll,
        );
        hu = hu + (12 - hu) * erg;
      }

      // Pneumonie: Konsolidierung im rechten Unterlappen (Bild links, hinten) mit Luftbronchogramm
      if (variante === 'pneumonie' && z > 0.5 && z < 0.95) {
        const staerke = glatt(0.5, 0.62, z) * (1 - glatt(0.86, 0.95, z));
        const rand = (fbm(u * 6, v * 6, 11) - 0.5) * 0.35;
        const kons = ellipse(u, v, -0.45, 0.24, 0.2 + rand * 0.2, 0.2 + rand * 0.2, 0.25) * staerke * rl;
        const milchglas = ellipse(u, v, -0.43, 0.2, 0.3, 0.3, 0.3) * staerke * rl;
        hu = hu + (-450 - hu) * milchglas * 0.7;
        hu = hu + (30 - hu) * kons;
        // Luftbronchogramm: dunkle Äste in der Verdichtung
        const ast = Math.abs(Math.sin((u + 0.45) * 24 + v * 9 + rauschen(u * 3, v * 3, 4) * 3));
        if (ast < 0.09 && kons > 0.6) hu = -700;
      }

      // Mediastinum
      const herzM = ellipse(u, v, 0.12, 0.1, 0.3 * herz + 0.001, 0.25 * herz + 0.001, 0.05);
      if (herzM > 0.001) {
        // Myokard Weichteil, Höhlen mit Kontrast hell
        const hoehle = ellipse(u, v, 0.14, 0.12, 0.2 * herz + 0.001, 0.15 * herz + 0.001, 0.1);
        const herzHu = 40 + (blut - 40) * hoehle * (kontrast ? 1 : 0.1);
        hu = hu + (herzHu - hu) * herzM;
      }
      // Gefäße: Aorta ascendens/Bogen, Aorta descendens, Truncus pulmonalis
      const aoAsc = (1 - glatt(0.55, 0.62, z)) * glatt(0.12, 0.2, z);
      const aoBogen = glatt(0.1, 0.16, z) * (1 - glatt(0.24, 0.3, z));
      const gefaess = Math.max(
        ellipse(u, v, 0.05, -0.12, 0.09 * aoAsc + 0.001, 0.09 * aoAsc + 0.001, 0.08),
        ellipse(u, v, 0.02, -0.08, 0.26 * aoBogen + 0.001, 0.07 * aoBogen + 0.001, 0.08),
        ellipse(u, v, 0.12, 0.32, 0.075, 0.075, 0.08) * glatt(0.1, 0.18, z),
        ellipse(u, v, -0.12, -0.18, 0.06, 0.06, 0.08) * glatt(0.15, 0.2, z) * (1 - glatt(0.5, 0.6, z)), // V. cava sup.
      );
      hu = hu + (blut - hu) * gefaess;
      // Truncus pulmonalis + rechte Pulmonalarterie (Höhe Hilus)
      const pa = glatt(0.3, 0.36, z) * (1 - glatt(0.5, 0.56, z));
      if (pa > 0.001) {
        const stamm = ellipse(u, v, 0.18, -0.16, 0.09, 0.09, 0.08) * pa;
        const rechts = ellipse(u, v, -0.05, -0.04, 0.2, 0.05, 0.08) * pa;
        const paM = Math.max(stamm, rechts);
        hu = hu + (blut - hu) * paM;
        if (variante === 'lungenembolie') {
          // Füllungsdefekt (Thrombus) in der rechten Pulmonalarterie: dunkler Fleck im hellen Gefäß
          const thrombus = ellipse(u, v, -0.1, -0.04, 0.07, 0.035, 0.25) * rechts;
          hu = hu + (35 - hu) * thrombus;
        }
      }
      // Trachea bzw. Hauptbronchien
      if (trachea > 0.01) {
        const tr = ellipse(u, v, 0, -0.2, 0.07, 0.065, 0.1) * trachea;
        hu = hu + (-1000 - hu) * tr;
      } else if (z < 0.5) {
        const br = Math.max(ellipse(u, v, -0.15, -0.12, 0.04, 0.035, 0.1), ellipse(u, v, 0.13, -0.11, 0.035, 0.03, 0.1)) * (1 - glatt(0.42, 0.5, z));
        hu = hu + (-1000 - hu) * br;
      }
      // Leber (Bild links unten im Oberbauch) und Milz
      if (leber > 0.001) hu = hu + (60 - hu) * ellipse(u, v, -0.3, 0.12, 0.5 * leber, 0.42 * leber, 0.05) * (1 - rl * 0.95);
      if (milz > 0.001) hu = hu + (50 - hu) * ellipse(u, v, 0.5, 0.25, 0.18 * milz, 0.22 * milz, 0.06) * (1 - ll * 0.95);

      // Wirbelsäule: Wirbelkörper, Spinalkanal, Wirbelbogen
      const wk = ellipse(u, v, 0, 0.46, 0.13, 0.12, 0.05);
      const wkKern = ellipse(u, v, 0, 0.46, 0.105, 0.095, 0.08);
      hu = hu + (850 - hu) * wk;
      hu = hu + (260 - hu) * wkKern;
      const bogen = ellipse(u, v, 0, 0.63, 0.12, 0.07, 0.08);
      hu = hu + (700 - hu) * bogen;
      hu = hu + (25 - hu) * ellipse(u, v, 0, 0.61, 0.045, 0.045, 0.1);
      // Sternum
      hu = hu + (550 - hu) * ellipse(u, v, 0, -0.58, 0.1 * (0.6 + 0.4 * herz), 0.035, 0.1) * glatt(0.15, 0.25, z);
      // Rippen: Querschnitte entlang der Thoraxwand, Lage wechselt mit der Höhe
      for (let k = 0; k < 9; k++) {
        const w = Math.PI * (0.15 + k * 0.088) + z * 0.6;
        for (const seite of [-1, 1]) {
          const rx = seite * Math.cos(w - Math.PI / 2 + Math.PI / 2) * 0.82;
          const ry = 0.03 + Math.sin(w) * 0.56 * (k > 4 ? 1 : -1) * 0.95;
          const r = ellipse(u, v, rx * (k > 4 ? 1 : 1), ry, 0.035, 0.022, 0.15);
          if (r > 0.001) hu = hu + (750 - hu) * r * muskel;
        }
      }

      // Bildrauschen
      hu += (hash(x, y, 2 + Math.floor(z * 100)) - 0.5) * 24;
      werte[y * N + x] = huZuRoh(hu * koerper + -1000 * (1 - koerper));
    }
  }
  return { breite: N, hoehe: N, werte };
}

// ---------- Röntgen-Thorax p.a. ----------

export function roentgenThorax(variante: RoentgenVariante = 'normal', groesse = 360): Rohbild {
  const N = groesse, werte = new Uint16Array(N * N);
  const herzBreite = variante === 'stauung' ? 0.46 : 0.28;
  // Zwerchfellkuppel je Seite (-1 = Bild links = Patientenrechts, steht etwas höher)
  const zwerchfell = (seite: number, t: number) => (seite < 0 ? 0.3 : 0.35) + 0.32 * ((t - 0.4) / 0.4) ** 2;
  const aussen = (v: number) => 0.14 + 0.66 * Math.sqrt(klemme((v + 0.84) / 0.7));
  for (let y = 0; y < N; y++) {
    const v = (y + 0.5) / N * 2 - 1;
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N * 2 - 1;
      const t = Math.abs(u), seite = u < 0 ? -1 : 1;
      // Rumpf mit Schultern und Halsansatz
      const halsBreite = 0.2, rumpfBreite = 0.9 - 0.05 * glatt(0.2, 1, v);
      const breite = halsBreite + (rumpfBreite - halsBreite) * glatt(-1.0, -0.72, v);
      const rumpf = 1 - glatt(breite - 0.03, breite + 0.02, t);
      let s = 0.05 + 0.4 * rumpf * (1 - 0.25 * (t / 0.9) ** 2);
      const arm = (1 - glatt(0.03, 0.08, Math.abs(t - 0.96))) * glatt(-0.85, -0.6, v);
      s += 0.3 * arm;

      // Lungenfeld
      const vd = zwerchfell(seite, t);
      const innen = 0.09 + 0.02 * glatt(-0.3, 0.2, v);
      const feld = (1 - glatt(aussen(v) - 0.03, aussen(v) + 0.01, t)) * glatt(innen - 0.01, innen + 0.03, t) * glatt(-0.88, -0.8, v) * (1 - glatt(vd - 0.015, vd + 0.015, v));
      let lunge = feld;
      let ptLuft = 0;
      if (variante === 'pneumothorax' && seite > 0) {
        // Linke Lunge (Bild rechts) kollabiert nach medial: feine Pleuralinie, außen keine Gefäßzeichnung
        const kante = 0.58 - 0.05 * Math.cos((v + 0.2) * 2.6);
        const aussenTeil = glatt(kante - 0.008, kante + 0.008, t);
        ptLuft = feld * aussenTeil;
        lunge = feld * (1 - aussenTeil);
        s += 0.16 * Math.exp(-((t - kante) ** 2) / 0.00004) * feld;
      }
      s -= 0.28 * lunge + 0.33 * ptLuft;
      // Gefäßzeichnung: verzweigt vom Hilus, nach außen feiner
      if (lunge > 0.001) {
        const dx = t - 0.2, dy = v + 0.05, d = Math.hypot(dx, dy);
        const w = Math.atan2(dy, dx);
        const ast = Math.pow(Math.abs(Math.sin(w * 7 + fbm(d * 5, w * 2, 5) * 3 + d * 2)), 10);
        s += lunge * (0.06 * ast + 0.12) * Math.exp(-d * 3.4);
        s += (fbm(u * 22, v * 22, 8) - 0.5) * 0.035 * lunge;
      }

      // Mediastinum mit Trachea, Herz, Aortenknopf
      const medBreite = 0.12 + 0.03 * glatt(-0.4, 0.0, v);
      const med = (1 - glatt(medBreite - 0.03, medBreite + 0.01, t)) * glatt(-0.95, -0.7, v);
      s += 0.16 * med;
      s -= 0.12 * (1 - glatt(0.025, 0.04, Math.abs(u + 0.005))) * glatt(-0.95, -0.8, v) * (1 - glatt(-0.35, -0.25, v));
      const herz = ellipse(u, v, 0.05 + (herzBreite - 0.28) * 0.45, 0.16, herzBreite, 0.22, 0.14) * glatt(-0.2, -0.05, v);
      s += 0.3 * herz;
      s += 0.12 * ellipse(u, v, 0.12, -0.32, 0.07, 0.055, 0.3);

      // Oberbauch unter dem Zwerchfell, Magenblase links (Bild rechts)
      s += 0.18 * glatt(vd - 0.01, vd + 0.05, v) * rumpf;
      if (seite > 0) s -= 0.15 * ellipse(u, v, 0.4, vd + 0.11, 0.11, 0.05, 0.3);

      // Wirbelsäule schwach, Schlüsselbeine, hintere Rippen
      s += 0.06 * (1 - glatt(0.05, 0.075, t)) * (0.6 + 0.4 * Math.abs(Math.sin(v * 24)));
      const yk = -0.7 + 0.1 * t - 0.12 * t * t;
      s += 0.18 * (1 - glatt(0.018, 0.032, Math.abs(v - yk))) * glatt(0.04, 0.08, t) * (1 - glatt(0.62, 0.7, t));
      for (let k = 0; k < 10; k++) {
        const y0 = -0.84 + k * 0.115;
        const yr = y0 - 0.06 * t + 0.42 * t * t;
        const dist = Math.abs(v - yr);
        const rippe = (1 - glatt(0.012, 0.024, dist)) * glatt(0.06, 0.1, t) * (1 - glatt(aussen(v) + 0.02, aussen(v) + 0.07, t));
        s += 0.07 * rippe * rumpf;
      }

      // Befunde
      if (variante === 'pneumonie') {
        const f = fbm(u * 7, v * 7, 21);
        const herd = ellipse(u, v, -0.45, 0.12, 0.2 + (f - 0.5) * 0.12, 0.15 + (f - 0.5) * 0.08, 0.5);
        s += 0.25 * herd * feld * (0.7 + 0.3 * f);
      }
      if (variante === 'stauung') {
        const hilusNah = Math.exp(-Math.hypot(t - 0.22, v + 0.05) * 3);
        s += 0.12 * hilusNah * feld;
        const kerley = (Math.abs(Math.sin(v * 80)) > 0.93 ? 1 : 0) * glatt(-0.05, 0.15, v) * glatt(aussen(v) - 0.12, aussen(v) - 0.04, t);
        s += 0.05 * kerley * feld;
        // Ergüsse: stumpfe Winkel, nach außen ansteigender Flüssigkeitsspiegel
        const spiegel = vd - 0.06 - 0.12 * glatt(0.3, 0.75, t);
        s += 0.22 * glatt(spiegel - 0.03, spiegel + 0.03, v) * feld;
      }
      s += (hash(x, y, 77) - 0.5) * 0.018;
      werte[y * N + x] = Math.round(klemme(s) * ROH_MAX);
    }
  }
  return { breite: N, hoehe: N, werte };
}

// ---------- Fensterung ----------

export interface Fenster {
  /** Fenstermitte (Level) in Anzeigeeinheiten: HU beim CT, 0..100 % beim Röntgen. */
  mitte: number;
  /** Fensterbreite in denselben Einheiten. */
  breite: number;
}

/** Anzeigeeinheit -> Rohwert. */
export const zuRoh = (m: Modalitaet, wert: number) => (m === 'ct' ? wert + 1024 : (wert / 100) * ROH_MAX);
/** Rohwert -> Anzeigeeinheit. */
export const vonRoh = (m: Modalitaet, roh: number) => (m === 'ct' ? roh - 1024 : (roh / ROH_MAX) * 100);

/** Nachschlagetabelle Rohwert -> Grauwert 0..255 für ein Fenster. */
export function grauTabelle(m: Modalitaet, f: Fenster): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(ROH_MAX + 1);
  const unten = zuRoh(m, f.mitte - f.breite / 2), oben = zuRoh(m, f.mitte + f.breite / 2);
  const spanne = Math.max(1, oben - unten);
  for (let r = 0; r <= ROH_MAX; r++) lut[r] = Math.round(klemme((r - unten) / spanne) * 255);
  return lut;
}

/** Füllt RGBA-Pixel aus Rohwerten und Grautabelle. */
export function malePixel(bild: Rohbild, lut: Uint8ClampedArray, ziel: Uint8ClampedArray): void {
  const w = bild.werte;
  for (let i = 0, j = 0; i < w.length; i++, j += 4) {
    const g = lut[w[i]];
    ziel[j] = g; ziel[j + 1] = g; ziel[j + 2] = g; ziel[j + 3] = 255;
  }
}

/** Mittelwert der Rohwerte in einem Kreis (normierte Koordinaten 0..1). Für Tests und die Messsonde. */
export function mittelwert(bild: Rohbild, x: number, y: number, r: number): number {
  const N = bild.breite, M = bild.hoehe;
  let summe = 0, n = 0;
  const x0 = Math.floor((x - r) * N), x1 = Math.ceil((x + r) * N), y0 = Math.floor((y - r) * M), y1 = Math.ceil((y + r) * M);
  for (let yy = Math.max(0, y0); yy < Math.min(M, y1); yy++) for (let xx = Math.max(0, x0); xx < Math.min(N, x1); xx++) {
    if (Math.hypot((xx + 0.5) / N - x, (yy + 0.5) / M - y) <= r) { summe += bild.werte[yy * N + xx]; n++; }
  }
  return n ? summe / n : 0;
}
