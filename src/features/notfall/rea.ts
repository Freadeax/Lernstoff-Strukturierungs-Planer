// Reanimationsübung (angelehnt an ERC 2021): Ablauf, Profile, Szenarien und Auswertung. Rein und ohne
// DOM, damit Taktmessung und Auswertung testbar sind.
// Audit (Notfall-Trainer): Erwachsene, Kinder und Neugeborene sind getrennte Profile mit eigenem Ablauf,
// eigenem Verhältnis, eigener Freigabe und eigenem Leitlinienstand (siehe freigaben.ts).
// Didaktisches Modell: ersetzt kein praktisches Training am Phantom. Der Notfallablauf der Einrichtung geht vor.

export type Rhythmus = 'kammerflimmern' | 'asystolie' | 'pea' | 'sinus';
/** Befund bei einer Analyse: Rhythmus am Defibrillator oder (Neugeborene) Herzfrequenz pro Minute. */
export type Analyse = Rhythmus | number;
export type Entscheidung = 'schockbar' | 'nicht-schockbar' | 'organisiert' | 'hf-unter-60' | 'hf-60-100' | 'hf-ueber-100';
export type ProfilId = 'erwachsene' | 'kinder' | 'neugeborene';

export const RHYTHMUS_NAME: Record<Rhythmus, string> = {
  kammerflimmern: 'Kammerflimmern', asystolie: 'Asystolie', pea: 'Pulslose elektrische Aktivität (PEA)', sinus: 'Sinusrhythmus mit tastbarem Puls',
};

/**
 * Richtige Entscheidung bei der Analyse. PEA und Sinus sind organisiert: dann Puls tasten.
 * Neugeborene: Herzfrequenz unter 60 → weiter Kompressionen; 60–100 → Kompressionen beenden,
 * Beatmung fortsetzen; über 100 → Beatmung fortsetzen, bis die Atmung ausreicht.
 */
export function richtigeEntscheidung(a: Analyse): Entscheidung {
  if (typeof a === 'number') return a < 60 ? 'hf-unter-60' : a <= 100 ? 'hf-60-100' : 'hf-ueber-100';
  return a === 'kammerflimmern' ? 'schockbar' : a === 'asystolie' ? 'nicht-schockbar' : 'organisiert';
}
/** Beendet dieser Befund die Kompressionen? Sinus (ROSC) bzw. Herzfrequenz ab 60/min. */
export const beendetKompression = (a: Analyse) => typeof a === 'number' ? a >= 60 : a === 'sinus';

export interface ReaSzenario {
  id: string;
  profil: ProfilId;
  titel: string;
  lage: string;
  /** Für gewichtsbezogene Dosen und Energien (Kinder, Neugeborene). */
  gewichtKg?: number;
  /** Befund bei jeder Analyse. Der letzte Eintrag beendet die Übung. */
  analysen: Analyse[];
}

export const SZENARIEN: ReaSzenario[] = [
  { id: 'vf', profil: 'erwachsene', titel: 'Kammerflimmern nach Herzinfarkt', lage: 'Herr K., 64 Jahre, kommt mit Brustschmerz in die Notaufnahme. Während der Übergabe auf der Trage sackt er zusammen und reagiert nicht mehr.', analysen: ['kammerflimmern', 'kammerflimmern', 'kammerflimmern', 'sinus'] },
  { id: 'asystolie', profil: 'erwachsene', titel: 'Atemstillstand nach Aspiration', lage: 'Frau S., 81 Jahre, hat sich im Pflegeheim beim Essen verschluckt. Der Rettungsdienst bringt sie, bei Ankunft reagiert sie nicht mehr.', analysen: ['asystolie', 'pea', 'sinus'] },
  { id: 'kind-hypoxie', profil: 'kinder', gewichtKg: 22, titel: 'Kind nach schwerem Asthmaanfall', lage: 'Der Rettungsdienst bringt Mia, 6 Jahre, etwa 22 kg, nach einem schweren Asthmaanfall. Bei der Übergabe im Schockraum wird sie schlaff und reagiert nicht mehr.', analysen: ['asystolie', 'pea', 'sinus'] },
  { id: 'kind-vf', profil: 'kinder', gewichtKg: 30, titel: 'Kind bricht beim Sport zusammen', lage: 'Jonas, 9 Jahre, etwa 30 kg, ist beim Fußball zusammengebrochen. Der Rettungsdienst bringt ihn in den Schockraum, er reagiert nicht.', analysen: ['kammerflimmern', 'kammerflimmern', 'sinus'] },
  { id: 'neugeborenes', profil: 'neugeborene', gewichtKg: 3, titel: 'Neugeborenes atmet nach der Geburt nicht', lage: 'Ein reifes Neugeborenes, etwa 3 kg, ist schlaff und atmet nach der Geburt nicht. Die Hebamme bringt es an die Reanimationseinheit mit Wärmelampe.', analysen: [40, 50, 90] },
];

/** Erste Schritte, bis die erste Kompression erfolgt. Reihenfolge ist Teil der Übung. */
export interface ErkennenSchritt { id: string; label: string; folge: string }
/** Erwachsene (ERC 2021 BLS/ALS im Krankenhaus). Der letzte Schritt beginnt die Kompressionen. */
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

/** Kinder (ERC 2021 Paediatric Life Support): erst 5 Beatmungen, dann 15:2. */
const ERKENNEN_KIND: ErkennenSchritt[] = [
  { id: 'ansprechen', label: 'Laut ansprechen und vorsichtig an den Schultern berühren', folge: 'Keine Reaktion.' },
  { id: 'hilfe', label: 'Laut um Hilfe rufen, zweite Person alarmiert sofort das Kinderreanimationsteam', folge: 'Eine Kollegin löst den Notfallalarm aus und holt den Defibrillator.' },
  { id: 'atmung', label: 'Atemwege öffnen, Atmung höchstens 10 Sekunden prüfen', folge: 'Keine normale Atmung.' },
  { id: 'initial', label: '5 initiale Beatmungen mit Beutel und Maske', folge: 'Der Brustkorb hebt sich bei den Beatmungen sichtbar.' },
  { id: 'lebenszeichen', label: 'Lebenszeichen prüfen, höchstens 10 Sekunden', folge: 'Keine Lebenszeichen, kein sicher tastbarer Puls.' },
  { id: 'druecken', label: 'Thoraxkompressionen beginnen (15:2)', folge: 'Unteres Drittel des Brustbeins, mindestens ein Drittel der Brustkorbtiefe, beim Schulkind mit einer oder zwei Händen.' },
];
const ABLENKER_KIND: ErkennenSchritt[] = [
  { id: 'gleich-druecken', label: 'Ohne Beatmung sofort mit 30:2 beginnen', folge: 'Bei Kindern entsteht der Stillstand meist durch Sauerstoffmangel. Deshalb zuerst 5 Beatmungen, danach 15:2.' },
  { id: 'puls', label: 'Lange am Handgelenk nach dem Puls suchen', folge: 'Lebenszeichen höchstens 10 Sekunden prüfen. Im Zweifel beginnen.' },
  { id: 'eltern', label: 'Zuerst die Eltern verständigen', folge: 'Kostet jetzt Zeit. Eine Person aus dem Team kümmert sich um die Eltern, sobald genug Hilfe da ist.' },
];

/** Neugeborene (ERC 2021 Newborn Life Support): Wärme, Atemweg, Blähen, Beatmen, erst dann 3:1. */
const ERKENNEN_NEU: ErkennenSchritt[] = [
  { id: 'waerme', label: 'Abtrocknen, in warme Tücher wickeln, Uhr starten', folge: 'Das Kind liegt warm unter der Wärmelampe. Es bleibt schlaff und atmet nicht.' },
  { id: 'beurteilen', label: 'Muskeltonus, Atmung und Herzfrequenz beurteilen, Hilfe rufen', folge: 'Herzfrequenz mit dem Stethoskop etwa 40/min. Das Neonatologieteam ist alarmiert.' },
  { id: 'atemweg', label: 'Kopf in Neutralposition, Atemwege öffnen', folge: 'Die Atemwege sind frei.' },
  { id: 'blaehen', label: '5 Blähbeatmungen, je 2 bis 3 Sekunden', folge: 'Nach der dritten Blähbeatmung hebt sich der Brustkorb.' },
  { id: 'beatmen', label: 'Brustkorbhebung prüfen, 30 Sekunden beatmen, Herzfrequenz erneut prüfen', folge: 'Trotz guter Beatmung bleibt die Herzfrequenz unter 60/min.' },
  { id: 'druecken', label: 'Thoraxkompressionen 3:1 mit Sauerstoff beginnen', folge: 'Beide Daumen auf das untere Drittel des Brustbeins, Hände umfassen den Brustkorb. Drei Kompressionen, eine Beatmung.' },
];
const ABLENKER_NEU: ErkennenSchritt[] = [
  { id: 'absaugen', label: 'Routinemäßig Mund und Nase absaugen', folge: 'Verzögert die Beatmung. Absaugen nur, wenn die Atemwege sichtbar verlegt sind.' },
  { id: 'ueberstrecken', label: 'Den Kopf weit überstrecken', folge: 'Beim Neugeborenen bleibt der Kopf in Neutralposition. Überstrecken kann die Atemwege verlegen.' },
  { id: 'sofort-druecken', label: 'Sofort mit Kompressionen beginnen', folge: 'Ohne wirksame Beatmung helfen Kompressionen nicht. Beim Neugeborenen kommt die Beatmung zuerst.' },
];

/** Alles, was Ablauf, Takt und Bewertung je Altersgruppe bestimmt. */
export interface ReaProfil {
  id: ProfilId;
  titel: string;
  kurz: string;
  /** Kompressionen und Beatmungen je Zyklus, z. B. 30:2, 15:2, 3:1. */
  druck: number;
  beatmung: number;
  /** Zielbereich der gemessenen Takte pro Minute. Bei Neugeborenen zählen Kompressionen und Beatmungen. */
  ziel: { min: number; max: number };
  zielText: string;
  /** Sekunden bis zur nächsten Analyse (regulär / kurze Übung). */
  zyklusSek: number;
  kurzSek: number;
  /** Beatmungen werden als Takt mitgezählt (3:1 ist ein durchgehender Rhythmus). */
  beatmungImTakt: boolean;
  defi: boolean;
  technik: string;
  erkennen: ErkennenSchritt[];
  ablenker: ErkennenSchritt[];
  entscheidungen: Entscheidung[];
}

export const PROFILE: Record<ProfilId, ReaProfil> = {
  erwachsene: {
    id: 'erwachsene', titel: 'Erwachsene', kurz: '30:2, 100–120/min, Rhythmusanalyse alle 2 Minuten',
    druck: 30, beatmung: 2, ziel: ZIEL, zielText: '100–120/min', zyklusSek: 120, kurzSek: 30, beatmungImTakt: false, defi: true,
    technik: 'Mitte des Brustkorbs, 5–6 cm tief, vollständig entlasten.',
    erkennen: ERKENNEN, ablenker: ABLENKER, entscheidungen: ['schockbar', 'nicht-schockbar', 'organisiert'],
  },
  kinder: {
    id: 'kinder', titel: 'Kinder', kurz: '5 initiale Beatmungen, dann 15:2, 100–120/min, Dosen nach Gewicht',
    druck: 15, beatmung: 2, ziel: ZIEL, zielText: '100–120/min', zyklusSek: 120, kurzSek: 30, beatmungImTakt: false, defi: true,
    technik: 'Unteres Drittel des Brustbeins, mindestens ein Drittel der Brustkorbtiefe.',
    erkennen: ERKENNEN_KIND, ablenker: ABLENKER_KIND, entscheidungen: ['schockbar', 'nicht-schockbar', 'organisiert'],
  },
  neugeborene: {
    id: 'neugeborene', titel: 'Neugeborene', kurz: 'Wärme, Blähen, Beatmen, dann 3:1, Herzfrequenz alle 30 Sekunden',
    // ERC: etwa 120 Ereignisse pro Minute (90 Kompressionen, 30 Beatmungen). Der Bereich 100–140 ist eine
    // didaktische Toleranz dieser Übung, keine Leitlinienangabe (Prüfpunkt in freigaben.ts).
    druck: 3, beatmung: 1, ziel: { min: 100, max: 140 }, zielText: 'etwa 120 Ereignisse/min', zyklusSek: 30, kurzSek: 30, beatmungImTakt: true, defi: false,
    technik: 'Zwei-Daumen-Technik, unteres Drittel des Brustbeins, ein Drittel der Brustkorbtiefe.',
    erkennen: ERKENNEN_NEU, ablenker: ABLENKER_NEU, entscheidungen: ['hf-unter-60', 'hf-60-100', 'hf-ueber-100'],
  },
};
export const PROFIL_IDS = Object.keys(PROFILE) as ProfilId[];
export const szenarienFuer = (p: ProfilId) => SZENARIEN.filter(s => s.profil === p);

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
export function auswerten(o: { start: number; ende: number; taps: number[]; entscheidungen: boolean[]; falscheSchritte: number; ziel?: { min: number; max: number } }): Auswertung {
  const ziel = o.ziel ?? ZIEL;
  const { taps } = o;
  const intervalle = taps.slice(1).map((t, i) => t - taps[i]!);
  const druck = intervalle.filter(d => d <= 1500);
  const imZiel = druck.filter(d => { const r = 60000 / d; return r >= ziel.min && r <= ziel.max; }).length;
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

const MERKSATZ: Record<ProfilId, string> = {
  erwachsene: 'keine Reaktion, keine normale Atmung → Hilfe, Alarm, Drücken.',
  kinder: 'keine Reaktion, keine normale Atmung → Hilfe, 5 Beatmungen, Lebenszeichen, 15:2.',
  neugeborene: 'Wärme, Atemweg, 5 Blähbeatmungen, Beatmen; erst bei Herzfrequenz unter 60/min trotz guter Beatmung drücken.',
};

/** Rückmeldungen zur Auswertung, in der Reihenfolge ihrer Bedeutung. */
export function hinweise(a: Auswertung, profil: ReaProfil = PROFILE.erwachsene): string[] {
  const h: string[] = [];
  const { ziel } = profil;
  const einheit = profil.beatmungImTakt ? 'Ereignisse/min' : '/min';
  if (a.bisDruck !== null && a.bisDruck > 30 && profil.id !== 'neugeborene') h.push(`Bis zur ersten Kompression vergingen ${a.bisDruck} Sekunden. Ziel: so schnell wie möglich, Erkennen in unter 10 Sekunden.`);
  if (a.mittel !== null && a.mittel < ziel.min) h.push(`Mittlerer Takt ${a.mittel} ${einheit} ist zu langsam. Ziel ${profil.zielText}${profil.beatmungImTakt ? ': drei Kompressionen und eine Beatmung in etwa 2 Sekunden' : ': etwa zwei Kompressionen pro Sekunde'}.`);
  if (a.mittel !== null && a.mittel > ziel.max) h.push(`Mittlerer Takt ${a.mittel} ${einheit} ist zu schnell. Bei zu hohem Takt leidet die Entlastung und Füllung des Herzens.`);
  if (a.ccf < 0.8) h.push(`Kompressionsanteil ${Math.round(a.ccf * 100)} %. Ziel über 80 %: Unterbrechungen für Beatmung, Analyse und Schock kurz halten.`);
  if (a.laengstePause > 10) h.push(`Längste Unterbrechung ${a.laengstePause.toLocaleString('de-DE')} s. Unterbrechungen höchstens 10 Sekunden, vor und nach dem Schock möglichst unter 5 Sekunden.`);
  if (a.richtigeAnalysen < a.analysen) h.push(profil.defi
    ? `${a.analysen - a.richtigeAnalysen} von ${a.analysen} Rhythmusanalysen falsch eingeordnet. Schockbar sind nur Kammerflimmern und pulslose Kammertachykardie.`
    : `${a.analysen - a.richtigeAnalysen} von ${a.analysen} Herzfrequenzen falsch eingeordnet. Unter 60/min weiter drücken, ab 60/min Kompressionen beenden und weiter beatmen.`);
  if (a.falscheSchritte) h.push(`${a.falscheSchritte} Umweg${a.falscheSchritte > 1 ? 'e' : ''} beim Erkennen. Merke: ${MERKSATZ[profil.id]}`);
  if (!h.length) h.push(`Sauber gearbeitet: zügiger Beginn, Takt im Ziel, kurze Unterbrechungen und richtige ${profil.defi ? 'Rhythmusentscheidungen' : 'Einordnung der Herzfrequenz'}.`);
  return h;
}

const zahl = (x: number) => x.toLocaleString('de-DE', { maximumFractionDigits: 2 });

/** Medikamentenhinweis nach ERC 2021 (Gabe nur auf ärztliche Anordnung bzw. durch das Reanimationsteam). */
export function medikamentHinweis(rhythmen: Analyse[], schocks: number, profil: ProfilId = 'erwachsene', gewichtKg?: number): string | null {
  if (profil === 'neugeborene') {
    // Zweite Kontrolle unter 60/min trotz Kompressionen und Beatmung
    const hf = rhythmen.filter((r): r is number => typeof r === 'number');
    if (hf.length === 2 && hf[1]! < 60) return `Herzfrequenz bleibt trotz guter Kompressionen und Beatmung unter 60/min: Nabelvenenzugang und Adrenalin 20 µg/kg i.v. durch das Team${gewichtKg ? ` (bei ${zahl(gewichtKg)} kg etwa ${zahl(gewichtKg * 20)} µg)` : ''}.`;
    return null;
  }
  const kind = profil === 'kinder' && gewichtKg;
  const adrenalin = kind ? `Adrenalin 10 µg/kg i.v./i.o. (bei ${zahl(gewichtKg)} kg ${zahl(gewichtKg * 10)} µg, höchstens 1 mg)` : 'Adrenalin 1 mg i.v.';
  const amiodaron = kind ? `Amiodaron 5 mg/kg (bei ${zahl(gewichtKg)} kg ${zahl(gewichtKg * 5)} mg)` : 'Amiodaron 300 mg i.v.';
  if (rhythmen[0] === 'asystolie' || rhythmen[0] === 'pea') return rhythmen.length === 1 ? `Nicht schockbar: ${adrenalin} so früh wie möglich, danach alle 3–5 Minuten (Team vorbereiten lassen).` : null;
  if (schocks === 3) return `Nach dem 3. Schock: ${adrenalin} und ${amiodaron} (Team vorbereiten lassen).`;
  return null;
}

/** Schockenergie: Kinder 4 J/kg (ERC 2021 PLS), Erwachsene nach Gerät. */
export function schockEnergie(profil: ProfilId, gewichtKg?: number): string {
  if (profil === 'kinder' && gewichtKg) return `4 J/kg, bei ${zahl(gewichtKg)} kg ${Math.min(gewichtKg * 4, 360)} J`;
  return 'Energie nach Gerät und Standard (biphasisch)';
}
