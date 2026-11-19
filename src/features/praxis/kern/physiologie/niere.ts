// Grundsystem G2: Niere und Ausscheidung (Lernmodell, didaktisch gerundet, fachlich ungeprüft; lokale Vorgaben gehen vor).
// Rein und deterministisch. Spur B rechnet Laktat und Stundenurin über dieselben Funktionen (Re-Export in spur-b/modul.ts).
//
// - Stundenurin: Nierendurchblutung (MAP, Füllung) × Antidiurese bei Flüssigkeitsmangel (ADH) + Diuretika.
// - Urinfarbe 1–8 nach der Urinfarbtafel (Armstrong 1994/1998): 1–3 gut getrunken, 4–6 zu wenig, 7–8 deutlicher Mangel.
// - Blasenfüllung (optional): füllt sich mit dem Stundenurin; ohne Abflusshindernis entleert sich die Blase ab etwa
//   350 ml, bei Harnverhalt nicht (Schmerz/Unruhe kommen aus dem Treiber im Pflegemodell). Ein Dauerkatheter beendet
//   den Harnverhalt (Katalog „blasenkatheter-legen“ → beendet: ['harnverhalt']), danach läuft die Blase ab.
// - Kalium: Ausgangswert 4,2 mmol/l; Schleifendiuretika senken es (Wirkstoffe, G1).

const begrenze = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Kalium-Ausgangswert in mmol/l, wenn der Fall keinen nennt. */
export const KALIUM_NORMAL = 4.2;

/** Urinproduktion ml/h: etwa 1 ml/kg/h bei MAP ≥ 75, unter MAP 65 deutlich weniger, unter 50 kaum noch. */
export function urinMlH(map: number, volumen: number, kg: number): number {
  const druck = begrenze((map - 50) / 25, 0, 1.2);
  const fuellung = begrenze((volumen - 0.6) / 0.4, 0, 1.2);
  return Math.round(kg * druck * fuellung * 10) / 10;
}

/**
 * Laktat-Ziel: Minderperfusion (MAP < 65, niedriges HZV) und Hypoxämie treiben es hoch.
 * Bei Sepsis kommt eine gestörte Mikrozirkulation dazu, die mit steigendem Druck abnimmt.
 */
export function laktatZiel(map: number, perfusion: number, spo2: number, sepsis = 0): number {
  const mikro = 1.2 * Math.min(1.5, sepsis) * begrenze((75 - map) / 15, 0, 1.5);
  return 1 + 0.12 * Math.max(0, 65 - map) + 4 * Math.max(0, 0.85 - perfusion) + 0.15 * Math.max(0, 88 - spo2) + mikro;
}

/** Antidiurese: Bei Flüssigkeitsmangel hält die Niere Wasser zurück (ADH), der Urin wird wenig und konzentriert. */
export function antidiurese(hydratation: number): number {
  return begrenze((hydratation - 0.7) / 0.25, 0.15, 1.15);
}

/** Stundenurin in ml/h aus Kreislauf, Hydratation und Diuretika (Spur A; Spur B mit Bilanzmodul rechnet ohne ADH). */
export function stundenurin(map: number, volumen: number, hydratation: number, kg: number, diureseMlH = 0): number {
  return Math.round((urinMlH(map, volumen, kg) * antidiurese(hydratation) + diureseMlH) * 10) / 10;
}

/**
 * Urinfarbe 1 (sehr hell) bis 8 (dunkel) nach der Urinfarbtafel. Hängt an der Konzentration:
 * wenig Urin je kg Körpergewicht und Flüssigkeitsmangel machen ihn dunkler, Diuretika heller.
 */
export function urinFarbe(hydratation: number, mlH: number, kg: number): number {
  const mlKgH = mlH / Math.max(1, kg);
  const konzentration = 3 + 14 * Math.max(0, 0.95 - hydratation) + 2.5 * begrenze((0.8 - mlKgH) / 0.6, -1, 1);
  return Math.round(begrenze(konzentration, 1, 8));
}

/** Schwelle, ab der eine gesunde Blase entleert wird (Harndrang), ml */
export const BLASE_ENTLEERUNG_ML = 350;
/** Ab dieser Füllung tut eine volle Blase weh (Harnverhalt) */
export const BLASE_SCHMERZ_ML = 500;

/**
 * Blasenfüllung nach dt Sekunden. Ohne Abflusshindernis wird ab BLASE_ENTLEERUNG_ML entleert (Restharn 30 ml),
 * bei Harnverhalt füllt sie sich weiter (bis 1500 ml).
 */
export function blaseNaechste(blaseMl: number, mlH: number, dt: number, harnverhalt: boolean): number {
  const voll = blaseMl + (mlH * dt) / 3600;
  if (!harnverhalt && voll >= BLASE_ENTLEERUNG_ML) return 30;
  return Math.min(1500, Math.round(voll * 10) / 10);
}

/** Kalium nach Schleifendiuretika: etwa −0,35 mmol/l je Liter zusätzlicher Diurese (Lernmodell). */
export function kaliumNachDiurese(kalium: number | undefined, diureseMl: number): number {
  return (kalium ?? KALIUM_NORMAL) - (0.35 * diureseMl) / 1000;
}
