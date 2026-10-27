// Rechentrainer: Aufgaben zum pflegerischen Rechnen (Einheiten, Dosis, Infusion, Perfusor,
// Insulin, Flüssigkeitsbilanz, BMI, Sauerstoffvorrat).
// Alle Werte sind fiktive Übungswerte und keine Dosierungsempfehlung. Aufgaben werden aus einem
// Startwert erzeugt (seed), damit sie reproduzierbar und testbar sind.

export type AufgabenTyp = 'einheiten' | 'dosis' | 'mgkg' | 'prozent' | 'laufrate' | 'tropfen' | 'laufzeit' | 'perfusor'
  | 'insulin' | 'bilanz' | 'bmi' | 'sauerstoff';
export type Stufe = 1 | 2 | 3;

export interface Aufgabe {
  id: string;            // typ:stufe:seed
  typ: AufgabenTyp;
  stufe: Stufe;
  frage: string;
  einheit: string;       // Einheit der erwarteten Antwort
  loesung: number;
  toleranz: number;      // erlaubte absolute Abweichung
  schritte: string[];    // Lösungsweg
}

/** `thema`: Katalogthema, in das eine Prüfungsrunde als Abfrage eingeht (Lernplan). */
export interface TypInfo { typ: AufgabenTyp; label: string; formel: string; merke?: string; thema: string }

const ARZNEI = 'thema.ph.medikamente';
const INFUSION = 'thema.ph.injektion';
const FLUESSIGKEIT = 'thema.pro.dehydratation';
const ERNAEHRUNG = 'thema.ph.ernaehrung';
const ATMUNG = 'thema.kl.atmung';

export const TYPEN: TypInfo[] = [
  { typ: 'einheiten', label: 'Einheiten', formel: '1 g = 1000 mg · 1 mg = 1000 µg · 1 l = 1000 ml', merke: 'Eine Stufe größer: durch 1000. Eine Stufe kleiner: mal 1000.', thema: ARZNEI },
  { typ: 'dosis', label: 'Dosis aus Ampulle', formel: 'ml = verordnete Menge ÷ Konzentration (mg/ml)', merke: 'Erst die Konzentration ausrechnen: Wirkstoff ÷ Volumen.', thema: ARZNEI },
  { typ: 'mgkg', label: 'Dosis nach Gewicht', formel: 'Dosis = mg/kg × Körpergewicht', merke: 'Danach wie bei der Ampulle: ml = mg ÷ Konzentration.', thema: ARZNEI },
  { typ: 'prozent', label: 'Prozentlösungen', formel: '1 % = 1 g in 100 ml = 10 mg/ml', merke: 'G 10 % heißt: 10 g Glukose in 100 ml.', thema: ARZNEI },
  { typ: 'laufrate', label: 'Laufrate Pumpe', formel: 'ml/h = Volumen (ml) ÷ Zeit (h)', merke: 'Minuten zuerst in Stunden umrechnen: min ÷ 60.', thema: INFUSION },
  { typ: 'tropfen', label: 'Tropfgeschwindigkeit', formel: 'Tropfen/min = ml × Tropfenfaktor ÷ Minuten', merke: 'Standardbesteck 20 Tropfen/ml: Tropfen/min = ml/h ÷ 3. Mikrotropf 60 Tropfen/ml: Tropfen/min = ml/h.', thema: INFUSION },
  { typ: 'laufzeit', label: 'Laufzeit', formel: 'Minuten = Volumen (ml) ÷ Laufrate (ml/h) × 60', thema: INFUSION },
  { typ: 'perfusor', label: 'Perfusor', formel: 'ml/h = Dosis pro Stunde ÷ Konzentration der Spritze', merke: 'µg/kg/min → mg/h: × kg × 60 ÷ 1000.', thema: INFUSION },
  { typ: 'insulin', label: 'Insulin', formel: 'ml = IE ÷ Konzentration (IE/ml) · U-100 = 100 IE/ml', merke: 'Auf dem Pen oder der Ampulle steht die Konzentration. Bei U-100 sind 10 IE = 0,1 ml.', thema: ARZNEI },
  { typ: 'bilanz', label: 'Flüssigkeitsbilanz', formel: 'Bilanz = Einfuhr gesamt − Ausfuhr gesamt', merke: 'Positiv: mehr aufgenommen als ausgeschieden. Negativ: mehr ausgeschieden. Erst alle Einfuhren, dann alle Ausfuhren addieren.', thema: FLUESSIGKEIT },
  { typ: 'bmi', label: 'BMI', formel: 'BMI = Gewicht (kg) ÷ (Größe in m)²', merke: 'Zentimeter erst in Meter umrechnen: 172 cm = 1,72 m. Dann die Größe mit sich selbst malnehmen.', thema: ERNAEHRUNG },
  { typ: 'sauerstoff', label: 'Sauerstoffvorrat', formel: 'Liter = Flaschenvolumen (l) × Druck (bar) · Minuten = Liter ÷ Flow (l/min)', merke: 'Bei einer Reserve nur den Druck über der Reserve nutzen: (Druck − Reserve) × Volumen.', thema: ATMUNG },
];

export const TYP_LABEL = Object.fromEntries(TYPEN.map((t) => [t.typ, t.label])) as Record<AufgabenTyp, string>;

// ---------- Zufall ----------

/** Kleiner, reproduzierbarer Zufallsgenerator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)]!;
  const int = (min: number, max: number, step = 1) => min + step * Math.floor(next() * (Math.floor((max - min) / step) + 1));
  return { next, pick, int };
}
type Rng = ReturnType<typeof rng>;

// ---------- Zahlen ----------

/** Rundet auf n Nachkommastellen ohne Gleitkomma-Reste (0,1 + 0,2 …). */
export function runde(x: number, n = 2): number {
  const f = 10 ** n;
  return Math.round((x + Number.EPSILON) * f) / f;
}

const NF = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 });
/** Deutsche Zahl: 2,5 · 1.000 */
export function zahl(x: number): string { return NF.format(runde(x, 3)); }
const stunden = (h: number) => (h === 1 ? '1 Stunde' : `${zahl(h)} Stunden`);

/** Liest eine Eingabe wie „2,5“, „2.5“, „ 1.000 “, „2,5 ml“. NaN, wenn keine Zahl erkennbar ist. */
export function leseZahl(eingabe: string): number {
  let s = eingabe.trim().replace(/\s+/g, '').replace(/[a-zA-Zµ/%]+$/u, '');
  if (!s) return NaN;
  // „1.000“ oder „1.000,5“: Punkt als Tausendertrennzeichen
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
  s = s.replace(',', '.');
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}

export type Bewertung = 'richtig' | 'gerundet' | 'falsch' | 'leer';

/** Prüft eine Antwort. „gerundet“ = innerhalb der Toleranz, aber nicht exakt. */
export function bewerte(a: Aufgabe, eingabe: string): Bewertung {
  const x = leseZahl(eingabe);
  if (Number.isNaN(x)) return 'leer';
  const d = Math.abs(x - a.loesung);
  if (d < 1e-9) return 'richtig';
  return d <= a.toleranz + 1e-9 ? 'gerundet' : 'falsch';
}

// ---------- Generatoren ----------

type Gen = (r: Rng, stufe: Stufe) => Omit<Aufgabe, 'id' | 'typ' | 'stufe'>;

const einheiten: Gen = (r, stufe) => {
  const paare = [
    { von: 'g', nach: 'mg', f: 1000 }, { von: 'mg', nach: 'g', f: 1 / 1000 },
    { von: 'mg', nach: 'µg', f: 1000 }, { von: 'µg', nach: 'mg', f: 1 / 1000 },
    { von: 'l', nach: 'ml', f: 1000 }, { von: 'ml', nach: 'l', f: 1 / 1000 },
  ] as const;
  const p = stufe === 1 ? r.pick(paare.filter((x) => x.f > 1)) : r.pick(paare);
  const werte = p.f > 1
    ? (stufe === 1 ? [1, 2, 3, 5, 10] : stufe === 2 ? [0.5, 1.5, 2.5, 0.25, 0.1] : [0.05, 0.125, 0.025, 0.005, 1.25])
    : (stufe === 2 ? [500, 250, 1500, 2000, 100] : [50, 125, 25, 5, 1250, 75]);
  const v = r.pick(werte);
  const l = runde(v * p.f, 6);
  return {
    frage: `Rechne ${zahl(v)} ${p.von} in ${p.nach} um.`,
    einheit: p.nach, loesung: l, toleranz: 0,
    schritte: [`${p.f > 1 ? 'Kleinere' : 'Größere'} Einheit: ${p.f > 1 ? 'mal' : 'durch'} 1000.`, `${zahl(v)} ${p.von} ${p.f > 1 ? '×' : '÷'} 1000 = ${zahl(l)} ${p.nach}`],
  };
};

const dosis: Gen = (r, stufe) => {
  const volumen = stufe === 1 ? r.pick([1, 2]) : r.pick([1, 2, 5, 10]);
  const konz = stufe === 1 ? r.pick([5, 10, 20, 50]) : stufe === 2 ? r.pick([2, 4, 5, 10, 25]) : r.pick([0.5, 2.5, 4, 12.5]);
  const wirkstoff = runde(konz * volumen, 3);
  const ml = stufe === 1 ? r.pick([0.5, 1, 1.5, 2].filter((x) => x <= volumen * 2)) : r.pick([0.4, 0.6, 0.8, 1.2, 1.5, 2.5, 3, 4].filter((x) => x <= volumen * 2));
  const verordnet = runde(konz * ml, 3);
  const inUg = stufe === 3 && verordnet < 2;
  const frage = inUg
    ? `Eine Ampulle enthält ${zahl(wirkstoff)} mg Wirkstoff in ${zahl(volumen)} ml. Verordnet sind ${zahl(verordnet * 1000)} µg. Wie viel ml ziehst du auf?`
    : `Eine Ampulle enthält ${zahl(wirkstoff)} mg Wirkstoff in ${zahl(volumen)} ml. Verordnet sind ${zahl(verordnet)} mg. Wie viel ml ziehst du auf?`;
  return {
    frage, einheit: 'ml', loesung: runde(ml, 2), toleranz: 0.01,
    schritte: [
      ...(inUg ? [`${zahl(verordnet * 1000)} µg ÷ 1000 = ${zahl(verordnet)} mg`] : []),
      `Konzentration: ${zahl(wirkstoff)} mg ÷ ${zahl(volumen)} ml = ${zahl(konz)} mg/ml`,
      `Menge: ${zahl(verordnet)} mg ÷ ${zahl(konz)} mg/ml = ${zahl(ml)} ml`,
    ],
  };
};

const mgkg: Gen = (r, stufe) => {
  const kg = stufe === 3 ? r.pick([4, 6, 8, 12, 15, 18, 22, 25]) : r.int(50, 100, 5);
  const proKg = stufe === 3 ? r.pick([0.1, 0.5, 1, 1.5, 2, 5, 10]) : r.pick([0.5, 1, 2, 3, 5]);
  const mg = runde(kg * proKg, 3);
  const wer = stufe === 3 ? 'Ein Kind wiegt' : 'Eine Patientin wiegt';
  if (stufe === 1) {
    return {
      frage: `${wer} ${zahl(kg)} kg. Verordnet sind ${zahl(proKg)} mg/kg. Wie viel mg erhält sie insgesamt?`,
      einheit: 'mg', loesung: mg, toleranz: 0,
      schritte: [`${zahl(proKg)} mg/kg × ${zahl(kg)} kg = ${zahl(mg)} mg`],
    };
  }
  const konz = r.pick([5, 10, 20, 25, 50]);
  const ml = runde(mg / konz, 2);
  return {
    frage: `${wer} ${zahl(kg)} kg. Verordnet sind ${zahl(proKg)} mg/kg, die Lösung enthält ${zahl(konz)} mg/ml. Wie viel ml werden verabreicht? (auf 2 Nachkommastellen)`,
    einheit: 'ml', loesung: ml, toleranz: 0.01,
    schritte: [
      `Dosis: ${zahl(proKg)} mg/kg × ${zahl(kg)} kg = ${zahl(mg)} mg`,
      `Menge: ${zahl(mg)} mg ÷ ${zahl(konz)} mg/ml = ${zahl(ml)} ml`,
    ],
  };
};

const prozent: Gen = (r, stufe) => {
  const loesungen = [
    { name: 'Glukose', p: [5, 10, 20, 40] },
    { name: 'NaCl', p: [0.9, 10] },
  ];
  const l = r.pick(loesungen);
  const p = r.pick(l.p);
  if (stufe === 1) {
    const v = r.pick([100, 250, 500, 1000]);
    const g = runde(p * v / 100, 3);
    return {
      frage: `Wie viel g ${l.name} enthalten ${zahl(v)} ml ${l.name} ${zahl(p)} %?`,
      einheit: 'g', loesung: g, toleranz: 0,
      schritte: [`${zahl(p)} % = ${zahl(p)} g in 100 ml`, `${zahl(p)} g × ${zahl(v)} ml ÷ 100 ml = ${zahl(g)} g`],
    };
  }
  if (stufe === 2) {
    const mgml = runde(p * 10, 3);
    return {
      frage: `Wie viel mg ${l.name} enthält 1 ml ${l.name} ${zahl(p)} %?`,
      einheit: 'mg/ml', loesung: mgml, toleranz: 0,
      schritte: [`${zahl(p)} % = ${zahl(p)} g in 100 ml = ${zahl(p * 1000)} mg in 100 ml`, `${zahl(p * 1000)} mg ÷ 100 ml = ${zahl(mgml)} mg/ml`],
    };
  }
  const p3 = r.pick([10, 20, 40]);
  const ml = r.pick([10, 20, 25, 50]);
  const g = runde(p3 * ml / 100, 3);
  return {
    frage: `Verordnet sind ${zahl(g)} g Glukose. Wie viel ml Glukose ${p3} % brauchst du?`,
    einheit: 'ml', loesung: ml, toleranz: 0,
    schritte: [`${p3} % = ${p3} g in 100 ml`, `${zahl(g)} g ÷ ${p3} g × 100 ml = ${zahl(ml)} ml`],
  };
};

const laufrate: Gen = (r, stufe) => {
  if (stufe < 3) {
    const h = stufe === 1 ? r.pick([1, 2, 4, 5]) : r.pick([3, 6, 8, 12, 24]);
    const rate = stufe === 1 ? r.pick([50, 100, 125, 250]) : r.pick([42, 63, 83, 125, 21]);
    const v = stufe === 1 ? rate * h : r.pick([500, 1000, 1500, 2000]);
    const l = runde(v / h, stufe === 1 ? 0 : 1);
    return {
      frage: `${zahl(v)} ml sollen über ${stunden(h)} über eine Infusionspumpe laufen. Welche Laufrate stellst du ein?${stufe === 2 ? ' (auf 1 Nachkommastelle)' : ''}`,
      einheit: 'ml/h', loesung: l, toleranz: stufe === 1 ? 0 : 0.1,
      schritte: [`${zahl(v)} ml ÷ ${h} h = ${zahl(l)} ml/h`],
    };
  }
  const min = r.pick([15, 20, 30, 45, 90]);
  const v = r.pick([50, 100, 250]);
  const l = runde(v * 60 / min, 1);
  return {
    frage: `${zahl(v)} ml Kurzinfusion sollen in ${min} Minuten einlaufen. Welche Laufrate stellst du an der Pumpe ein? (auf 1 Nachkommastelle)`,
    einheit: 'ml/h', loesung: l, toleranz: 0.1,
    schritte: [`${min} min ÷ 60 = ${zahl(min / 60)} h`, `${zahl(v)} ml ÷ ${zahl(min / 60)} h = ${zahl(l)} ml/h`],
  };
};

const tropfen: Gen = (r, stufe) => {
  const faktor = stufe === 3 && r.next() < 0.4 ? 60 : 20;
  const h = stufe === 1 ? r.pick([1, 2, 4, 5]) : r.pick([1, 2, 3, 4, 6, 8, 12]);
  // Stufe 1: ml/h durch 3 teilbar, damit glatte Tropfenzahlen herauskommen
  const v = stufe === 1 ? r.pick([60, 120, 150, 300]) * h : r.pick([250, 500, 1000, 1500]);
  const proMin = (v * faktor) / (h * 60);
  const l = Math.round(proMin);
  const besteck = faktor === 20 ? 'Standard-Infusionsbesteck (20 Tropfen/ml)' : 'Mikrotropfbesteck (60 Tropfen/ml)';
  return {
    frage: `${zahl(v)} ml sollen über ${stunden(h)} mit einem ${besteck} laufen. Wie viele Tropfen pro Minute stellst du ein?${stufe > 1 ? ' (ganze Tropfen)' : ''}`,
    einheit: 'Tropfen/min', loesung: l, toleranz: stufe === 1 ? 0 : 1,
    schritte: [
      `Gesamttropfen: ${zahl(v)} ml × ${faktor} = ${zahl(v * faktor)} Tropfen`,
      `Minuten: ${h} h × 60 = ${h * 60} min`,
      `${zahl(v * faktor)} ÷ ${h * 60} = ${zahl(proMin)}${Number.isInteger(runde(proMin, 6)) ? '' : ` ≈ ${l}`} Tropfen/min`,
    ],
  };
};

const laufzeit: Gen = (r, stufe) => {
  if (stufe === 3) {
    const tpm = r.pick([20, 25, 30, 40, 50]);
    const v = r.pick([500, 1000]);
    const min = Math.round((v * 20) / tpm);
    return {
      frage: `Eine Infusion mit ${zahl(v)} ml läuft mit ${tpm} Tropfen/min (Standardbesteck, 20 Tropfen/ml). Nach wie vielen Minuten ist sie durchgelaufen?`,
      einheit: 'min', loesung: min, toleranz: 1,
      schritte: [`Gesamttropfen: ${zahl(v)} ml × 20 = ${zahl(v * 20)} Tropfen`, `${zahl(v * 20)} ÷ ${tpm} Tropfen/min = ${zahl(min)} min (${zahl(runde(min / 60, 2))} h)`],
    };
  }
  const rate = stufe === 1 ? r.pick([50, 100, 125, 250]) : r.pick([40, 75, 80, 150, 200]);
  const v = stufe === 1 ? rate * r.pick([1, 2, 4]) : r.pick([100, 250, 500, 1000]);
  const min = runde((v / rate) * 60, 0);
  return {
    frage: `${zahl(v)} ml laufen mit ${rate} ml/h. Wie viele Minuten dauert die Infusion?`,
    einheit: 'min', loesung: min, toleranz: stufe === 1 ? 0 : 1,
    schritte: [`${zahl(v)} ml ÷ ${rate} ml/h = ${zahl(runde(v / rate, 3))} h`, `${zahl(runde(v / rate, 3))} h × 60 = ${zahl(min)} min`],
  };
};

const perfusor: Gen = (r, stufe) => {
  const spritze = 50;
  if (stufe < 3) {
    const mg = stufe === 1 ? r.pick([50, 100, 250, 500]) : r.pick([10, 20, 40, 60, 150]);
    const konz = mg / spritze;
    const proH = stufe === 1 ? runde(konz * r.pick([1, 2, 4, 5, 10]), 3) : runde(konz * r.pick([1.5, 2.5, 3, 6, 7.5]), 3);
    const l = runde(proH / konz, 1);
    return {
      frage: `Eine Perfusorspritze enthält ${zahl(mg)} mg in ${spritze} ml. Verordnet sind ${zahl(proH)} mg/h. Welche Laufrate stellst du ein?`,
      einheit: 'ml/h', loesung: l, toleranz: 0.1,
      schritte: [`Konzentration: ${zahl(mg)} mg ÷ ${spritze} ml = ${zahl(konz)} mg/ml`, `${zahl(proH)} mg/h ÷ ${zahl(konz)} mg/ml = ${zahl(l)} ml/h`],
    };
  }
  const kg = r.int(50, 100, 10);
  const ugKgMin = r.pick([0.05, 0.1, 0.2, 0.25]);
  const mg = r.pick([5, 10]);
  const konzUg = (mg * 1000) / spritze;           // µg/ml
  const ugMin = ugKgMin * kg;
  const ugH = ugMin * 60;
  const l = runde(ugH / konzUg, 1);
  return {
    frage: `Eine Patientin wiegt ${kg} kg. Verordnet sind ${zahl(ugKgMin)} µg/kg/min. Die Spritze enthält ${mg} mg in ${spritze} ml. Welche Laufrate in ml/h? (auf 1 Nachkommastelle)`,
    einheit: 'ml/h', loesung: l, toleranz: 0.1,
    schritte: [
      `Pro Minute: ${zahl(ugKgMin)} µg × ${kg} kg = ${zahl(ugMin)} µg/min`,
      `Pro Stunde: ${zahl(ugMin)} µg × 60 = ${zahl(ugH)} µg/h`,
      `Konzentration: ${mg} mg = ${zahl(mg * 1000)} µg ÷ ${spritze} ml = ${zahl(konzUg)} µg/ml`,
      `${zahl(ugH)} µg/h ÷ ${zahl(konzUg)} µg/ml = ${zahl(l)} ml/h`,
    ],
  };
};


const insulin: Gen = (r, stufe) => {
  if (stufe === 1) {
    const ie = r.pick([4, 6, 8, 10, 12, 16, 20, 24, 30]);
    const l = runde(ie / 100, 3);
    return {
      frage: `Für Herrn B. sind ${ie} IE Insulin angeordnet. Das Insulin hat die Konzentration U-100 (100 IE/ml). Wie viele ml sind das?`,
      einheit: 'ml', loesung: l, toleranz: 0,
      schritte: ['U-100 bedeutet 100 IE in 1 ml.', `${ie} IE ÷ 100 IE/ml = ${zahl(l)} ml`],
    };
  }
  if (stufe === 2) {
    const ml = r.pick([0.06, 0.08, 0.12, 0.14, 0.18, 0.22, 0.28, 0.35]);
    const l = runde(ml * 100, 0);
    return {
      frage: `In einer U-100-Insulinspritze sind ${zahl(ml)} ml aufgezogen. Wie viele IE sind das?`,
      einheit: 'IE', loesung: l, toleranz: 0,
      schritte: ['U-100: 1 ml enthält 100 IE.', `${zahl(ml)} ml × 100 IE/ml = ${zahl(l)} IE`],
    };
  }
  const gesamt = r.pick([50, 100]);
  const spritze = 50;
  const ieH = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]);
  const konz = gesamt / spritze;
  const l = runde(ieH / konz, 2);
  return {
    frage: `Im Perfusor sind ${gesamt} IE Normalinsulin in ${spritze} ml NaCl 0,9 %. Angeordnet sind ${zahl(ieH)} IE/h. Welche Laufrate stellst du ein? (auf 2 Nachkommastellen)`,
    einheit: 'ml/h', loesung: l, toleranz: 0.01,
    schritte: [`Konzentration: ${gesamt} IE ÷ ${spritze} ml = ${zahl(konz)} IE/ml`, `${zahl(ieH)} IE/h ÷ ${zahl(konz)} IE/ml = ${zahl(l)} ml/h`],
  };
};

/** „300 + 500 = 800“, bei nur einem Wert einfach „300“. */
const summe = (xs: number[]) => (xs.length > 1 ? `${xs.map(zahl).join(' + ')} = ${zahl(xs.reduce((a, b) => a + b, 0))}` : zahl(xs[0] ?? 0));

const bilanz: Gen = (r, stufe) => {
  const ein: [string, number][] = [['Getränke', r.int(800, 1600, 50)]];
  const aus: [string, number][] = [['Urin', r.int(700, 1800, 50)]];
  if (stufe >= 2) {
    ein.push([r.pick(['Infusion', 'Sondenkost', 'Suppe und Joghurt']), r.int(250, 1000, 50)]);
    aus.push([r.pick(['Erbrochenes', 'Wunddrainage', 'Magensonde (Ablauf)', 'flüssiger Stuhl']), r.int(100, 450, 25)]);
  }
  if (stufe === 3) {
    // Schätzwerte stehen in der Aufgabe, damit nichts als allgemeingültige Norm erscheint
    ein.push(['Oxidationswasser (Schätzwert laut Station)', 300]);
    aus.push(['Perspiratio insensibilis (Schätzwert laut Station)', r.pick([500, 600, 800])]);
  }
  const se = ein.reduce((s, [, v]) => s + v, 0);
  const sa = aus.reduce((s, [, v]) => s + v, 0);
  if (se === sa) aus[0]![1] += 50;
  const sa2 = aus.reduce((s, [, v]) => s + v, 0);
  const b = se - sa2;
  const liste = (xs: [string, number][]) => xs.map(([n, v]) => `${n} ${zahl(v)} ml`).join(', ');
  return {
    frage: `24-Stunden-Bilanz von Frau K. Einfuhr: ${liste(ein)}. Ausfuhr: ${liste(aus)}. Wie groß ist die Bilanz? Gib den Betrag in ml an, ob sie positiv oder negativ ist, steht im Lösungsweg.`,
    einheit: 'ml', loesung: Math.abs(b), toleranz: 0,
    schritte: [
      `Einfuhr: ${summe(ein.map(([, v]) => v))} ml`,
      `Ausfuhr: ${summe(aus.map(([, v]) => v))} ml`,
      `${zahl(se)} ml − ${zahl(sa2)} ml = ${b > 0 ? '+' : '−'}${zahl(Math.abs(b))} ml: ${b > 0 ? 'positive Bilanz (mehr aufgenommen als ausgeschieden)' : 'negative Bilanz (mehr ausgeschieden als aufgenommen)'}`,
    ],
  };
};

const bmi: Gen = (r, stufe) => {
  const cm = stufe === 1 ? r.pick([150, 160, 170, 180, 190, 200]) : r.int(148, 198);
  const kg = stufe === 1 ? r.int(45, 110, 5) : stufe === 2 ? r.int(42, 120) : runde(r.int(400, 1300) / 10, 1);
  const m = cm / 100;
  const l = runde(kg / (m * m), 1);
  const angabe = stufe === 3 ? `${zahl(kg)} kg` : `${kg} kg`;
  return {
    frage: `Eine Bewohnerin ist ${cm} cm groß und wiegt ${angabe}. Berechne den BMI. (auf 1 Nachkommastelle)`,
    einheit: 'kg/m²', loesung: l, toleranz: 0.1,
    schritte: [`${cm} cm = ${zahl(m)} m`, `${zahl(m)} m × ${zahl(m)} m = ${zahl(runde(m * m, 4))} m²`, `${zahl(kg)} kg ÷ ${zahl(runde(m * m, 4))} m² = ${zahl(l)} kg/m²`],
  };
};

const sauerstoff: Gen = (r, stufe) => {
  const vol = r.pick([2, 5, 10]);
  const bar = r.pick(stufe === 1 ? [200, 150, 100] : [200, 180, 150, 120, 90, 60]);
  const liter = vol * bar;
  if (stufe === 1) {
    return {
      frage: `Eine ${vol}-Liter-Sauerstoffflasche zeigt ${bar} bar. Wie viele Liter Sauerstoff sind noch darin?`,
      einheit: 'l', loesung: liter, toleranz: 0,
      schritte: [`${vol} l × ${bar} bar = ${zahl(liter)} l`],
    };
  }
  const flow = r.pick([1, 2, 3, 4, 5, 6, 8]);
  const reserve = stufe === 3 ? r.pick([20, 30, 50]) : 0;
  const nutzbar = vol * (bar - reserve);
  const l = Math.floor(nutzbar / flow);
  const transport = stufe === 3 ? ` Für den Transport plant die Station ${reserve} bar Reserve ein, die nicht verbraucht werden sollen.` : '';
  return {
    frage: `Eine ${vol}-Liter-Flasche zeigt ${bar} bar, angeordnet sind ${flow} l/min Sauerstoff.${transport} Für wie viele volle Minuten reicht der Vorrat?`,
    einheit: 'min', loesung: l, toleranz: 0,
    schritte: [
      ...(reserve ? [`Nutzbarer Druck: ${bar} bar − ${reserve} bar = ${bar - reserve} bar`] : []),
      `Vorrat: ${vol} l × ${bar - reserve} bar = ${zahl(nutzbar)} l`,
      `${zahl(nutzbar)} l ÷ ${flow} l/min = ${zahl(runde(nutzbar / flow, 2))} min, also ${zahl(l)} volle Minuten`,
    ],
  };
};

const GEN: Record<AufgabenTyp, Gen> = { einheiten, dosis, mgkg, prozent, laufrate, tropfen, laufzeit, perfusor, insulin, bilanz, bmi, sauerstoff };

export function erzeuge(typ: AufgabenTyp, stufe: Stufe, seed: number): Aufgabe {
  return { id: `${typ}:${stufe}:${seed}`, typ, stufe, ...GEN[typ](rng(seed), stufe) };
}

/** Nächste Aufgabe aus den gewählten Typen; vermeidet direkte Wiederholung desselben Typs, wenn möglich. */
export function naechste(typen: AufgabenTyp[], stufe: Stufe, seed: number, vorher?: AufgabenTyp): Aufgabe {
  const r = rng(seed ^ 0x9e3779b9);
  const pool = typen.length > 1 && vorher ? typen.filter((t) => t !== vorher) : typen;
  return erzeuge(r.pick(pool.length ? pool : TYPEN.map((t) => t.typ)), stufe, seed);
}
