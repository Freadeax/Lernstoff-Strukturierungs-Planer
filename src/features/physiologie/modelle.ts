// Physiologie-Modelle: vier kleine Lernmodelle mit Reglern. Bewusst vereinfacht und qualitativ:
// Sie zeigen Richtung und Zusammenhang (was steigt, was fällt, warum), keine Messwerte eines Menschen.
// Alles hier ist rein und testbar; Zeichnungen und Regler liegen in PhysiologieSeite.tsx.

// Herz, Lunge und Blutzucker liegen im Praxissimulator-Kern, damit Lernseite und Simulator dasselbe Modell nutzen.
// Haut/Dekubitus ebenso (Grundsystem G3: Druckbelastung im Simulator).
import { blutzucker, haut, HAUT_START, herz, HERZ_START, lunge, ZUCKER_START, type Befund, type HautEingabe, type HerzEingabe, type Lage, type ZuckerEingabe } from '../praxis/kern/physiologie/organe';
export * from '../praxis/kern/physiologie/organe';

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
