// Reanimationsübung (Basismaßnahmen im Krankenhaus, angelehnt an ERC 2021): Ablauf, Szenarien und
// Auswertung. Rein und ohne DOM, damit Taktmessung und Auswertung testbar sind.
// Didaktisches Modell: ersetzt kein praktisches Training am Phantom. Der Notfallablauf der Einrichtung geht vor.

export type Rhythmus = 'kammerflimmern' | 'asystolie' | 'pea' | 'sinus';
export type Entscheidung = 'schockbar' | 'nicht-schockbar' | 'organisiert';

export const RHYTHMUS_NAME: Record<Rhythmus, string> = {
  kammerflimmern: 'Kammerflimmern', asystolie: 'Asystolie', pea: 'Pulslose elektrische Aktivität (PEA)', sinus: 'Sinusrhythmus mit tastbarem Puls',
};

/** Richtige Entscheidung bei der Rhythmusanalyse. PEA und Sinus sind organisiert: dann Puls tasten. */
export function richtigeEntscheidung(r: Rhythmus): Entscheidung {
  return r === 'kammerflimmern' ? 'schockbar' : r === 'asystolie' ? 'nicht-schockbar' : 'organisiert';
}

export interface ReaSzenario {
  id: string;
  titel: string;
  lage: string;
  /** Rhythmus bei jeder Analyse (alle 2 Minuten). Der letzte Eintrag beendet die Übung. */
  analysen: Rhythmus[];
}

export const SZENARIEN: ReaSzenario[] = [
  { id: 'vf', titel: 'Kammerflimmern nach Herzinfarkt', lage: 'Herr K., 64 Jahre, kommt mit Brustschmerz in die Notaufnahme. Während der Übergabe auf der Trage sackt er zusammen und reagiert nicht mehr.', analysen: ['kammerflimmern', 'kammerflimmern', 'kammerflimmern', 'sinus'] },
  { id: 'asystolie', titel: 'Atemstillstand nach Aspiration', lage: 'Frau S., 81 Jahre, hat sich im Pflegeheim beim Essen verschluckt. Der Rettungsdienst bringt sie, bei Ankunft reagiert sie nicht mehr.', analysen: ['asystolie', 'pea', 'sinus'] },
];

/** Erste Schritte, bis die erste Kompression erfolgt. Reihenfolge ist Teil der Übung. */
export interface ErkennenSchritt { id: string; label: string; folge: string }
export const ERKENNEN: ErkennenSchritt[] = [
  { id: 'ansprechen', label: 'Laut ansprechen und an den Schultern rütteln', folge: 'Keine Reaktion.' },
  { id: 'hilfe', label: 'Laut um Hilfe rufen', folge: 'Eine Kollegin kommt dazu.' },
  { id: 'atmung', label: 'Atemwege frei machen, Atmung höchstens 10 Sekunden prüfen', folge: 'Keine normale Atmung, nur vereinzelte Schnappatmung.' },
  { id: 'alarm', label: 'Reanimationsteam alarmieren lassen, Defibrillator holen lassen', folge: 'Die Kollegin löst den Notfallalarm aus und holt den Defibrillator.' },
  { id: 'druecken', label: 'Sofort mit Thoraxkompressionen beginnen (30:2)', folge: 'Du kniest seitlich, Handballen auf die Mitte des Brustkorbs, Arme gestreckt.' },
];

/** Falsche, aber naheliegende Schritte: kosten Zeit und werden erklärt. */
export const ABLENKER: ErkennenSchritt[] = [
  { id: 'puls', label: 'Erst am Handgelenk den Puls suchen', folge: 'Pulstasten ist für Laien und Ungeübte unzuverlässig und verzögert den Beginn. Entscheidend: keine Reaktion, keine normale Atmung.' },
  { id: 'rr', label: 'Blutdruck messen', folge: 'Kostet wertvolle Zeit. Ohne Reaktion und normale Atmung beginnt sofort die Reanimation.' },
  { id: 'arzt', label: 'Ins Arztzimmer laufen und Bescheid sagen', folge: 'Nicht allein weggehen: rufen, alarmieren lassen und beim Patienten bleiben.' },
];

export const ZIEL = { min: 100, max: 120 } as const;

/** Kompressionsrate aus den letzten Druckzeitpunkten (ms). Pausen über 1,5 s beginnen eine neue Serie. */
export function rate(taps: number[], fenster = 6): number | null {
  const serie: number[] = [];
  for (let i = taps.length - 1; i >= 0 && serie.length <= fenster; i--) {
    if (serie.length && serie[0]! - taps[i]! > 1500) break;
    serie.unshift(taps[i]!);
  }
  if (serie.length < 3) return null;
  return Math.round(60000 / ((serie.at(-1)! - serie[0]!) / (serie.length - 1)));
}

export interface Auswertung {
  /** Sekunden bis zur ersten Kompression */
  bisDruck: number | null;
  kompressionen: number;
  /** Mittlere Rate über alle Serien */
  mittel: number | null;
  /** Anteil der Kompressionen im Zielbereich 100–120/min (0…1) */
  imZiel: number;
  /** Anteil der Zeit mit Kompressionen an der Reanimationszeit (Chest Compression Fraction, 0…1) */
  ccf: number;
  /** Längste Unterbrechung in Sekunden */
  laengstePause: number;
  richtigeAnalysen: number;
  analysen: number;
  falscheSchritte: number;
}

/**
 * Auswertung: taps = Druckzeitpunkte (ms), start = Beginn der Übung, ende = Ende,
 * Pausen über 1,5 s zählen als Unterbrechung (Beatmung, Analyse, Schock).
 */
export function auswerten(o: { start: number; ende: number; taps: number[]; entscheidungen: boolean[]; falscheSchritte: number }): Auswertung {
  const { taps } = o;
  const intervalle = taps.slice(1).map((t, i) => t - taps[i]!);
  const druck = intervalle.filter(d => d <= 1500);
  const imZiel = druck.filter(d => { const r = 60000 / d; return r >= ZIEL.min && r <= ZIEL.max; }).length;
  const schluss = taps.length ? o.ende - taps.at(-1)! : 0;
  const pausen = [...intervalle.filter(d => d > 1500), ...(schluss > 1500 ? [schluss] : [])];
  const cprZeit = taps.length > 1 ? o.ende - taps[0]! : 0;
  const pauseZeit = pausen.reduce((a, b) => a + b, 0);
  return {
    bisDruck: taps.length ? Math.round((taps[0]! - o.start) / 1000) : null,
    kompressionen: taps.length,
    mittel: druck.length ? Math.round(60000 / (druck.reduce((a, b) => a + b, 0) / druck.length)) : null,
    imZiel: druck.length ? imZiel / druck.length : 0,
    ccf: cprZeit > 0 ? Math.max(0, Math.min(1, 1 - pauseZeit / cprZeit)) : 0,
    laengstePause: pausen.length ? Math.round(Math.max(...pausen) / 100) / 10 : 0,
    richtigeAnalysen: o.entscheidungen.filter(Boolean).length,
    analysen: o.entscheidungen.length,
    falscheSchritte: o.falscheSchritte,
  };
}

/** Rückmeldungen zur Auswertung, in der Reihenfolge ihrer Bedeutung. */
export function hinweise(a: Auswertung): string[] {
  const h: string[] = [];
  if (a.bisDruck !== null && a.bisDruck > 30) h.push(`Bis zur ersten Kompression vergingen ${a.bisDruck} Sekunden. Ziel: so schnell wie möglich, Erkennen in unter 10 Sekunden.`);
  if (a.mittel !== null && a.mittel < ZIEL.min) h.push(`Mittlere Rate ${a.mittel}/min ist zu langsam. Ziel 100–120/min: etwa zwei Kompressionen pro Sekunde.`);
  if (a.mittel !== null && a.mittel > ZIEL.max) h.push(`Mittlere Rate ${a.mittel}/min ist zu schnell. Bei zu hoher Rate leidet die Entlastung und Füllung des Herzens.`);
  if (a.ccf < 0.8) h.push(`Kompressionsanteil ${Math.round(a.ccf * 100)} %. Ziel über 80 %: Unterbrechungen für Beatmung, Analyse und Schock kurz halten.`);
  if (a.laengstePause > 10) h.push(`Längste Unterbrechung ${a.laengstePause.toLocaleString('de-DE')} s. Unterbrechungen höchstens 10 Sekunden, vor und nach dem Schock möglichst unter 5 Sekunden.`);
  if (a.richtigeAnalysen < a.analysen) h.push(`${a.analysen - a.richtigeAnalysen} von ${a.analysen} Rhythmusanalysen falsch eingeordnet. Schockbar sind nur Kammerflimmern und pulslose Kammertachykardie.`);
  if (a.falscheSchritte) h.push(`${a.falscheSchritte} Umweg${a.falscheSchritte > 1 ? 'e' : ''} beim Erkennen. Merke: keine Reaktion, keine normale Atmung → Hilfe, Alarm, Drücken.`);
  if (!h.length) h.push('Sauber gearbeitet: zügiger Beginn, Rate im Ziel, kurze Unterbrechungen und richtige Rhythmusentscheidungen.');
  return h;
}

/** Medikamentenhinweis nach ERC (Gabe nur auf ärztliche Anordnung bzw. durch das Reanimationsteam). */
export function medikamentHinweis(rhythmen: Rhythmus[], schocks: number): string | null {
  if (rhythmen[0] === 'asystolie' || rhythmen[0] === 'pea') return rhythmen.length === 1 ? 'Nicht schockbar: Adrenalin 1 mg i.v. so früh wie möglich, danach alle 3–5 Minuten (Team vorbereiten lassen).' : null;
  if (schocks === 3) return 'Nach dem 3. Schock: Adrenalin 1 mg i.v. und Amiodaron 300 mg i.v. (Team vorbereiten lassen).';
  return null;
}
