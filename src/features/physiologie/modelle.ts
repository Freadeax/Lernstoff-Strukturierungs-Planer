// Physiologie-Modelle: vier kleine Lernmodelle mit Reglern. Bewusst vereinfacht und qualitativ:
// Sie zeigen Richtung und Zusammenhang (was steigt, was fällt, warum), keine Messwerte eines Menschen.
// Alles hier ist rein und testbar; Zeichnungen und Regler liegen in PhysiologieSeite.tsx.

// Herz, Lunge und Blutzucker liegen im Praxissimulator-Kern, damit Lernseite und Simulator dasselbe Modell nutzen.
import { blutzucker, herz, HERZ_START, lunge, ZUCKER_START, type Befund, type HerzEingabe, type Lage, type ZuckerEingabe } from '../praxis/kern/physiologie/organe';
export * from '../praxis/kern/physiologie/organe';

const klemme = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

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
