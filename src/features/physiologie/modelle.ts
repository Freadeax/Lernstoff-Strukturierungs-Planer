// Physiologie-Modelle: vier kleine Lernmodelle mit Reglern. Bewusst vereinfacht und qualitativ:
// Sie zeigen Richtung und Zusammenhang (was steigt, was fällt, warum), keine Messwerte eines Menschen.
// Alles hier ist rein und testbar; Zeichnungen und Regler liegen in PhysiologieSeite.tsx.

const klemme = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const rund = (x: number) => Math.round(x);

// ------------------------------------------------------------------ Herz

export interface HerzEingabe {
  /** Herzfrequenz in Schlägen pro Minute (40 bis 180). */
  hf: number;
  /** Füllung des Herzens (Vorlast) in Prozent, 50 ist normal. */
  vorlast: number;
  /** Gefäßwiderstand (Nachlast) in Prozent, 50 ist normal. */
  nachlast: number;
  /** Kontraktionskraft in Prozent, 50 ist normal, niedrig z. B. bei Herzinsuffizienz. */
  kraft: number;
  betablocker: boolean;
  aceHemmer: boolean;
  diuretikum: boolean;
}

export const HERZ_START: HerzEingabe = { hf: 70, vorlast: 50, nachlast: 50, kraft: 50, betablocker: false, aceHemmer: false, diuretikum: false };

export interface HerzErgebnis {
  /** Wirksame Werte nach den Medikamenten. */
  hf: number; vorlast: number; nachlast: number; kraft: number;
  /** Schlagvolumen in ml. */
  sv: number;
  /** Herzzeitvolumen in l/min. */
  hzv: number;
  sys: number; dia: number; map: number;
  /** Anteil der Füllzeit, die bei dieser Frequenz bleibt (1 = reicht voll). */
  fuellung: number;
  hinweise: string[];
}

/** Frank-Starling: mehr Füllung, mehr Auswurf, aber abflachend. Normiert auf 1 bei 50 %. */
const starling = (v: number) => (1 - Math.exp(-v / 35)) / (1 - Math.exp(-50 / 35));

export function herz(e: HerzEingabe): HerzErgebnis {
  let { hf, vorlast, nachlast, kraft } = e;
  if (e.betablocker) { hf *= 0.85; kraft -= 5; }
  if (e.aceHemmer) { nachlast -= 15; vorlast -= 5; }
  if (e.diuretikum) vorlast -= 15;
  hf = klemme(hf, 30, 200); vorlast = klemme(vorlast, 5, 100); nachlast = klemme(nachlast, 5, 100); kraft = klemme(kraft, 5, 100);
  // Die Systole dauert in Ruhe etwa 0,3 s und verkürzt sich bei hoher Frequenz kaum; die Diastole (Füllzeit) wird knapp.
  const systole = 0.2 + 0.1 * (70 / hf);
  const diastole = Math.max(0.02, 60 / hf - systole);
  const fuellung = klemme(1 - Math.exp(-diastole / 0.08), 0.2, 1);
  const kraftFaktor = 0.4 + 0.6 * (kraft / 50) ** 0.8;
  // Ein schwaches Herz reagiert stärker auf die Nachlast (deshalb helfen Nachlastsenker bei Herzinsuffizienz).
  const empfindlich = 0.2 + 0.6 * Math.max(0, 50 - kraft) / 50;
  const nachlastFaktor = 1 + empfindlich * (1 - nachlast / 50);
  const pumpe = klemme(70 * starling(vorlast * fuellung) * kraftFaktor * nachlastFaktor, 10, 140);
  // Das Herz kann nur auswerfen, was venös zurückfließt. Der Rückstrom hängt an der Füllung (Volumen).
  const rueckstrom = 5.8 * (vorlast / 50) ** 0.8;
  const begrenzt = (pumpe * hf) / 1000 > rueckstrom;
  const hzv = Math.min((pumpe * hf) / 1000, rueckstrom);
  const sv = (hzv * 1000) / hf;
  // Mitteldruck = Herzzeitvolumen × Widerstand. Kalibriert: 70/min, 70 ml, Widerstand 50 % → etwa 93 mmHg.
  const widerstand = 19 * (0.55 + 0.9 * (nachlast / 100));
  const map = klemme(hzv * widerstand, 25, 180);
  const pp = klemme(sv * 0.6, 10, 90);
  const sys = map + (2 / 3) * pp;
  const dia = map - pp / 3;
  const hinweise: string[] = [];
  if (begrenzt && fuellung >= 0.85) hinweise.push('Mehr Frequenz bringt hier kaum mehr Auswurf: Das Herz kann nur pumpen, was zurückfließt. Das Schlagvolumen wird kleiner.');
  if (fuellung < 0.85) hinweise.push('Die Frequenz ist so hoch, dass die Kammern in der kurzen Diastole nicht mehr voll werden. Das Schlagvolumen sinkt trotz schnellem Herzschlag.');
  if (map < 65) hinweise.push('Mitteldruck unter 65 mmHg: Organe wie Niere und Gehirn werden nicht mehr sicher durchblutet (Schockgefahr).');
  if (sys >= 140) hinweise.push('Systolisch 140 mmHg und mehr: Bereich der Hypertonie.');
  if (hf < 50) hinweise.push('Bradykardie: Das Herzzeitvolumen hängt jetzt stark am Schlagvolumen.');
  if (e.betablocker) hinweise.push('Betablocker: Frequenz und Kraft sinken, das Herz braucht weniger Sauerstoff. Puls und Blutdruck vor der Gabe kontrollieren.');
  if (e.aceHemmer) hinweise.push('ACE-Hemmer: Gefäße weiten sich, die Nachlast sinkt, das schwache Herz pumpt leichter. Achten auf Schwindel beim Aufstehen und trockenen Reizhusten.');
  if (e.diuretikum) hinweise.push('Diuretikum: weniger Volumen, weniger Füllung. Entlastet bei Stauung, zu viel führt zu Exsikkose und Blutdruckabfall. Gewicht und Bilanz beobachten.');
  if (kraft < 35) hinweise.push('Schwache Kontraktion wie bei Herzinsuffizienz: Mehr Füllung hilft kaum noch, das Blut staut sich zurück (Ödeme, Atemnot).');
  return { hf: rund(hf), vorlast: rund(vorlast), nachlast: rund(nachlast), kraft: rund(kraft), sv: rund(sv), hzv: Math.round(hzv * 10) / 10, sys: rund(sys), dia: rund(dia), map: rund(map), fuellung, hinweise };
}

// ------------------------------------------------------------------ Haut / Dekubitus

export interface HautEingabe {
  /** Auflagedruck in mmHg (0 bis 150). */
  druck: number;
  /** Stunden ohne Entlastung (0 bis 8). */
  stunden: number;
  scherkraefte: boolean;
  feuchtigkeit: boolean;
}

export const HAUT_START: HautEingabe = { druck: 40, stunden: 1, scherkraefte: false, feuchtigkeit: false };

/** Faustwert aus der Lehre: Über etwa 32 mmHg werden Kapillaren zugedrückt. Individuell sehr verschieden. */
export const KAPILLARDRUCK = 32;

export type Kategorie = 0 | 1 | 2 | 3 | 4;

export const KATEGORIE_TEXT: Record<Kategorie, { titel: string; text: string }> = {
  0: { titel: 'Keine Schädigung', text: 'Die Haut wird wieder durchblutet. Rötung verschwindet beim Fingertest.' },
  1: { titel: 'Kategorie 1', text: 'Nicht wegdrückbare Rötung bei intakter Haut. Fingertest: Die Rötung bleibt. Sofort entlasten.' },
  2: { titel: 'Kategorie 2', text: 'Teilverlust der Haut: flache, offene Wunde oder Blase. Epidermis und Teile der Dermis sind betroffen.' },
  3: { titel: 'Kategorie 3', text: 'Vollständiger Hautverlust bis ins Unterhautfettgewebe. Knochen, Sehnen und Muskeln liegen nicht frei.' },
  4: { titel: 'Kategorie 4', text: 'Vollständiger Gewebeverlust mit freiliegendem Knochen, Sehnen oder Muskeln.' },
};

export interface HautErgebnis {
  kategorie: Kategorie;
  /** Belastung im Modell, 0 bis 1 je Schicht von außen nach innen: Epidermis, Dermis, Subkutis, Muskel. */
  schichten: [number, number, number, number];
  hinweise: string[];
}

/**
 * Druck mal Zeit: Nur der Anteil über dem Kapillardruck schadet. Scherkräfte und Feuchtigkeit verstärken.
 * Tiefe Schäden beginnen am Knochen (Muskel ist empfindlicher als Haut), daher wächst die Belastung von innen.
 */
export function haut(e: HautEingabe): HautErgebnis {
  const ueber = Math.max(0, e.druck - KAPILLARDRUCK);
  const faktor = (e.scherkraefte ? 1.5 : 1) * (e.feuchtigkeit ? 1.3 : 1);
  const last = ueber * e.stunden * faktor;
  const kategorie: Kategorie = last < 25 || e.stunden < 0.5 ? 0 : last < 80 ? 1 : last < 200 ? 2 : last < 350 ? 3 : 4;
  const s = (schwelle: number) => klemme((last - 15) / schwelle, 0, 1);
  // Muskel nahe am Knochen leidet zuerst; Feuchtigkeit trifft die Oberfläche.
  const schichten: [number, number, number, number] = [
    klemme(s(200) + (e.feuchtigkeit ? 0.2 : 0), 0, 1), s(260), s(320), s(200),
  ];
  const hinweise: string[] = [];
  if (e.druck <= KAPILLARDRUCK) hinweise.push(`Unter etwa ${KAPILLARDRUCK} mmHg bleiben die Kapillaren offen: Weichlagerung senkt den Auflagedruck.`);
  else if (e.stunden >= 2) hinweise.push('Der Druck liegt über dem Kapillardruck und das schon lange: Bewegungsplan prüfen, Lage wechseln, Mikrobewegungen fördern.');
  if (e.scherkraefte) hinweise.push('Scherkräfte (Hinunterrutschen im Bett, Ziehen statt Heben) verschieben die Schichten gegeneinander und reißen Gefäße ab.');
  if (e.feuchtigkeit) hinweise.push('Feuchte Haut (Inkontinenz, Schweiß) weicht auf und wird schneller verletzt: Hautschutz, rasch versorgen.');
  if (kategorie >= 3) hinweise.push('Tiefe Schäden entstehen oft am Knochen und sind außen erst spät sichtbar.');
  return { kategorie, schichten, hinweise };
}

// ------------------------------------------------------------------ Lunge / Lagerung

export type Lage = 'rueckenlage' | 'oberkoerper' | 'seite-links' | 'seite-rechts' | 'bauchlage';
export type Befund = 'gesund' | 'atelektase' | 'pneumonie-rechts';

export const LAGE_LABEL: Record<Lage, string> = {
  rueckenlage: 'Flache Rückenlage', oberkoerper: 'Oberkörperhochlage (30 bis 45°)', 'seite-links': 'Seitenlage links (links unten)',
  'seite-rechts': 'Seitenlage rechts (rechts unten)', bauchlage: 'Bauchlage',
};
export const BEFUND_LABEL: Record<Befund, string> = {
  gesund: 'Gesunde Lunge', atelektase: 'Minderbelüftung hinten unten (Atelektasen)', 'pneumonie-rechts': 'Pneumonie rechts',
};

/** Vier Bereiche: je Lungenflügel hinten unten (dorsobasal) und vorne oben (ventral). */
export type Region = 'rechts-hinten' | 'rechts-vorne' | 'links-hinten' | 'links-vorne';
export const REGIONEN: Region[] = ['rechts-vorne', 'links-vorne', 'rechts-hinten', 'links-hinten'];

export interface RegionWert { belueftung: number; durchblutung: number; unten: boolean }

export interface LungeErgebnis {
  regionen: Record<Region, RegionWert>;
  /** Anteil des Blutes, der an schlecht belüfteten Bereichen vorbeifließt (Shunt im Modell, 0 bis 1). */
  shunt: number;
  gasaustausch: 'gut' | 'eingeschränkt' | 'schlecht';
  hinweise: string[];
}

/** Liegt der Bereich in dieser Lage unten (schwerkraftabhängig)? */
function unten(lage: Lage, r: Region): boolean {
  const hinten = r.endsWith('hinten');
  const rechts = r.startsWith('rechts');
  switch (lage) {
    case 'rueckenlage': case 'oberkoerper': return hinten;
    case 'bauchlage': return !hinten;
    case 'seite-links': return !rechts;
    case 'seite-rechts': return rechts;
  }
}

/**
 * Schwerkraft: Blut fließt vor allem in die unten liegenden Bereiche, die Belüftung folgt bei Spontanatmung abgeschwächt.
 * Flach auf dem Rücken drücken Bauch und Zwerchfell auf die hinteren unteren Bereiche; die Oberkörperhochlage entlastet.
 * Kranke Bereiche (Atelektase, Pneumonie) werden kaum belüftet. Atelektasen öffnen sich teilweise, wenn sie oben liegen.
 */
export function lunge(lage: Lage, befund: Befund): LungeErgebnis {
  const regionen = {} as Record<Region, RegionWert>;
  let blut = 0;
  let vorbei = 0;
  for (const r of REGIONEN) {
    const u = unten(lage, r);
    let v = u ? 1.3 : 0.7;
    const q = u ? 1.4 : 0.6;
    const hinten = r.endsWith('hinten');
    if (hinten && lage === 'rueckenlage') v -= 0.2;
    if (hinten && lage === 'oberkoerper') v += 0.1;
    if (befund === 'atelektase' && hinten) v *= u ? 0.3 : 0.75;
    if (befund === 'pneumonie-rechts' && r.startsWith('rechts')) v *= 0.3;
    regionen[r] = { belueftung: Math.round(v * 100) / 100, durchblutung: q, unten: u };
    blut += q;
    vorbei += q * Math.max(0, 1 - v / q);
  }
  const shunt = Math.round((vorbei / blut) * 100) / 100;
  const gasaustausch = shunt < 0.18 ? 'gut' : shunt < 0.4 ? 'eingeschränkt' : 'schlecht';
  const hinweise: string[] = [];
  if (lage === 'rueckenlage') hinweise.push('Flach auf dem Rücken drücken Bauchorgane das Zwerchfell nach oben, hinten unten wird schlecht belüftet. Daher Oberkörperhochlage bei Atemnot und zur Pneumonieprophylaxe.');
  if (lage === 'oberkoerper') hinweise.push('Oberkörper hoch: Das Zwerchfell kann tiefer treten, die unteren Bereiche werden besser belüftet.');
  if (befund === 'pneumonie-rechts' && lage === 'seite-links') hinweise.push('„Gesunde Seite nach unten“: Das meiste Blut fließt jetzt durch die gut belüftete linke Lunge.');
  if (befund === 'pneumonie-rechts' && lage === 'seite-rechts') hinweise.push('Die kranke Lunge liegt unten und bekommt das meiste Blut, das aber kaum Sauerstoff aufnimmt.');
  if (befund === 'atelektase' && lage === 'bauchlage') hinweise.push('In Bauchlage liegen die hinteren Bereiche oben und werden entlastet; die Belüftung verteilt sich gleichmäßiger. So wird Bauchlage auf Intensivstationen bei schwerem Lungenversagen genutzt.');
  if (befund === 'atelektase' && lage !== 'bauchlage') hinweise.push('Atelektasen liegen meist hinten unten: Mobilisation, Lagewechsel und tiefes Durchatmen öffnen sie wieder.');
  return { regionen, shunt, gasaustausch, hinweise };
}

// ------------------------------------------------------------------ Blutzucker

export type Stoffwechsel = 'gesund' | 'typ1' | 'typ2';
export const STOFFWECHSEL_LABEL: Record<Stoffwechsel, string> = { gesund: 'Gesund', typ1: 'Diabetes Typ 1 (kein eigenes Insulin)', typ2: 'Diabetes Typ 2 (insulinresistent)' };

export interface ZuckerEingabe {
  stoffwechsel: Stoffwechsel;
  /** Kohlenhydrate der Mahlzeit in Gramm, zur Minute 0. */
  kohlenhydrate: number;
  /** Normalinsulin in Einheiten, gespritzt zur Minute 0. */
  insulin: number;
  /** 30 Minuten zügiges Gehen ab Minute 60. */
  bewegung: boolean;
}

export const ZUCKER_START: ZuckerEingabe = { stoffwechsel: 'typ1', kohlenhydrate: 60, insulin: 2, bewegung: false };

export interface ZuckerErgebnis {
  /** Blutzucker in mg/dl alle 10 Minuten über 6 Stunden (37 Werte). */
  verlauf: number[];
  min: number; max: number;
  hypo: boolean; hyper: boolean;
  hinweise: string[];
}

export const SCHRITT_MIN = 10;
export const DAUER_MIN = 360;

/** Gamma-förmige Wirkkurve mit Gipfel bei `gipfel` Minuten, Fläche 1. */
function kurve(t: number, gipfel: number): number {
  if (t <= 0) return 0;
  return (t / (gipfel * gipfel)) * Math.exp(-t / gipfel);
}

/**
 * Faustwerte aus der Diabetesschulung: 10 g Kohlenhydrate heben um etwa 35 mg/dl, 1 Einheit Normalinsulin senkt um etwa 40 mg/dl
 * (bei Typ 2 schwächer). Normalinsulin wirkt am stärksten nach etwa 2 Stunden. Gesunde regeln selbst gegen 90 mg/dl.
 */
export function blutzucker(e: ZuckerEingabe): ZuckerErgebnis {
  const start = e.stoffwechsel === 'gesund' ? 90 : e.stoffwechsel === 'typ2' ? 140 : 120;
  const insulinWirkung = e.stoffwechsel === 'typ2' ? 25 : 40;
  const regel = e.stoffwechsel === 'gesund' ? 0.06 : e.stoffwechsel === 'typ2' ? 0.012 : 0;
  const ziel = e.stoffwechsel === 'typ2' ? 130 : 90;
  let g = start;
  const verlauf = [g];
  for (let t = SCHRITT_MIN; t <= DAUER_MIN; t += SCHRITT_MIN) {
    const kh = e.kohlenhydrate * 3.5 * kurve(t, 40) * SCHRITT_MIN;
    const ins = e.insulin * insulinWirkung * kurve(t, 120) * SCHRITT_MIN;
    const sport = e.bewegung && t > 60 && t <= 150 ? (t <= 90 ? 1.2 : 0.4) * SCHRITT_MIN * (e.stoffwechsel === 'gesund' ? 0.3 : 1) : 0;
    g = g + kh - ins - sport - regel * SCHRITT_MIN * (g - ziel);
    g = klemme(g, 30, 600);
    verlauf.push(rund(g));
  }
  const min = Math.min(...verlauf);
  const max = Math.max(...verlauf);
  const hypo = min < 70;
  const hyper = max > 250;
  const hinweise: string[] = [];
  if (hypo) hinweise.push('Unterzuckerung (unter 70 mg/dl): Zittern, Schwitzen, Unruhe, Verwirrtheit. Bei Bewusstsein schnell wirksame Kohlenhydrate geben (z. B. Traubenzucker), Blutzucker nachkontrollieren.');
  if (hyper) hinweise.push('Über 250 mg/dl: Durst, viel Urin, Müdigkeit. Bei Typ 1 an Ketoazidose denken, Arzt informieren.');
  if (e.stoffwechsel === 'gesund') hinweise.push('Gesunde schütten selbst Insulin aus: Der Zucker steigt nach dem Essen nur kurz an und kehrt von allein zurück.');
  if (e.stoffwechsel === 'typ1' && e.kohlenhydrate > 0 && e.insulin === 0) hinweise.push('Ohne eigenes Insulin bleibt der Zucker nach dem Essen oben. Typ 1 braucht immer Insulin.');
  if (e.bewegung) hinweise.push('Bewegung senkt den Blutzucker, die Muskeln nehmen Zucker auch ohne viel Insulin auf. Bei Insulintherapie vorher Kohlenhydrate einplanen oder Insulin anpassen.');
  if (!hypo && !hyper && e.stoffwechsel !== 'gesund') hinweise.push('Insulin und Kohlenhydrate passen hier zueinander: Der Zucker bleibt im Zielbereich.');
  return { verlauf, min, max, hypo, hyper, hinweise };
}

// ------------------------------------------------------------------ Erkundungsaufträge

export type ModellId = 'herz' | 'haut' | 'lunge' | 'zucker';

export interface Zustand { herz: HerzEingabe; haut: HautEingabe; lage: Lage; befund: Befund; zucker: ZuckerEingabe }

export const START: Zustand = { herz: HERZ_START, haut: HAUT_START, lage: 'rueckenlage', befund: 'gesund', zucker: ZUCKER_START };

export interface Auftrag { id: string; modell: ModellId; text: string; geschafft: (z: Zustand) => boolean; warum: string }

/** Kleine Erkundungsaufträge: Man findet die Lösung durch Drehen an den Reglern, nicht durch Raten. */
export const AUFTRAEGE: Auftrag[] = [
  { id: 'herz-tachy', modell: 'herz', text: 'Finde die Frequenz, ab der das Schlagvolumen deutlich einbricht.', geschafft: (z) => herz(z.herz).fuellung < 0.85,
    warum: 'Bei hoher Frequenz verkürzt sich vor allem die Diastole. Die Kammern füllen sich nicht mehr, das Schlagvolumen fällt.' },
  { id: 'herz-insuffizienz', modell: 'herz', text: 'Stelle eine schwache Kontraktion (unter 35 %) ein und bringe das Herzzeitvolumen mit Medikamenten wieder auf etwa 4 l/min, ohne dass der Mitteldruck unter 65 fällt.',
    geschafft: (z) => { const r = herz(z.herz); return z.herz.kraft < 35 && (z.herz.aceHemmer || z.herz.betablocker || z.herz.diuretikum) && r.hzv >= 3.9 && r.map >= 65; },
    warum: 'Nachlastsenkung erleichtert dem schwachen Herzen die Arbeit. In der echten Therapie wirken Betablocker und ACE-Hemmer langfristig schützend; das zeigt dieses Modell nicht.' },
  { id: 'haut-kategorie2', modell: 'haut', text: 'Erzeuge mit möglichst wenig Druck eine Kategorie 2: Was beschleunigt den Schaden?', geschafft: (z) => haut(z.haut).kategorie >= 2 && z.haut.druck <= 60,
    warum: 'Zeit, Scherkräfte und Feuchtigkeit verstärken schon mäßigen Druck. Deshalb gehören Bewegungsplan, rutschfeste Lagerung und Hautschutz zusammen.' },
  { id: 'haut-schutz', modell: 'haut', text: 'Lass 8 Stunden vergehen, ohne dass ein Schaden entsteht.', geschafft: (z) => z.haut.stunden >= 8 && haut(z.haut).kategorie === 0,
    warum: 'Nur wenn der Auflagedruck unter dem Kapillardruck bleibt, ist lange Liegezeit unschädlich: Weichlagerung oder Lagewechsel.' },
  { id: 'lunge-pneumonie', modell: 'lunge', text: 'Bei Pneumonie rechts: Finde die Lage mit dem besten Gasaustausch.', geschafft: (z) => z.befund === 'pneumonie-rechts' && z.lage === 'seite-links',
    warum: 'Gesunde Seite nach unten: Dort fließt das meiste Blut, und dort wird gut belüftet.' },
  { id: 'lunge-atelektase', modell: 'lunge', text: 'Bei Atelektasen hinten unten: Welche Lage bringt den Gasaustausch auf „gut“?', geschafft: (z) => z.befund === 'atelektase' && lunge(z.lage, z.befund).gasaustausch === 'gut',
    warum: 'Die Bauchlage entlastet die hinteren Bereiche. Auf Station reichen oft schon Mobilisation und Oberkörperhochlage.' },
  { id: 'zucker-passend', modell: 'zucker', text: 'Typ 1, 60 g Kohlenhydrate: Wähle die Insulinmenge, bei der der Zucker zwischen 70 und 250 mg/dl bleibt.',
    geschafft: (z) => { const r = blutzucker(z.zucker); return z.zucker.stoffwechsel === 'typ1' && z.zucker.kohlenhydrate === 60 && !r.hypo && !r.hyper && z.zucker.insulin > 0; },
    warum: 'Insulin richtet sich nach den Kohlenhydraten. Zu wenig: Hyperglykämie, zu viel: Hypoglykämie.' },
  { id: 'zucker-sport', modell: 'zucker', text: 'Löse mit derselben Insulinmenge durch Bewegung eine Unterzuckerung aus.',
    geschafft: (z) => z.zucker.bewegung && z.zucker.stoffwechsel !== 'gesund' && blutzucker(z.zucker).hypo && !blutzucker({ ...z.zucker, bewegung: false }).hypo,
    warum: 'Bewegung senkt den Zucker zusätzlich. Wer Insulin spritzt, isst vorher etwas oder reduziert die Dosis.' },
];
