// Präanalytik: vom Laborauftrag bis zur Probe im Labor. Hier entstehen die meisten Laborfehler,
// und genau hier liegt die Verantwortung der Pflege. Rein und deterministisch, damit Tests und
// Debriefing dieselben Regeln sehen.

import { parameter, type Material } from './parameter';

export type Farbsystem = 'eu' | 'iso';

export interface Roehrchen {
  material: Material;
  name: string;
  /** Verschlussfarbe je Farbsystem. Die Farben hängen vom Hersteller ab: das Haus legt fest, welches gilt. */
  farbe: Record<Farbsystem, { name: string; hex: string }>;
  /** Position in der empfohlenen Abnahmereihenfolge (kleiner = früher). Patientennahe Proben haben keine. */
  reihenfolge?: number;
  hinweis: string;
}

export const ROEHRCHEN: Record<Material, Roehrchen> = {
  blutkultur: { material: 'blutkultur', name: 'Blutkulturflaschen (aerob + anaerob)', farbe: { eu: { name: 'Flaschen', hex: '#475569' }, iso: { name: 'Flaschen', hex: '#475569' } }, reihenfolge: 1, hinweis: 'Zuerst, steril: Hautdesinfektion mit Einwirkzeit, Septum desinfizieren, nicht nachtasten. Erst aerob, dann anaerob (bei Flügelkanüle umgekehrt wegen Luft im Schlauch).' },
  citrat: { material: 'citrat', name: 'Citrat (Gerinnung)', farbe: { eu: { name: 'grün', hex: '#16a34a' }, iso: { name: 'hellblau', hex: '#38bdf8' } }, reihenfolge: 2, hinweis: 'Exakt bis zur Markierung füllen (Mischverhältnis 1:9), sanft schwenken.' },
  serum: { material: 'serum', name: 'Serum', farbe: { eu: { name: 'weiß/braun', hex: '#a16207' }, iso: { name: 'rot/gold', hex: '#dc2626' } }, reihenfolge: 3, hinweis: 'Gerinnen lassen (ca. 30 min), dann zügig ins Labor.' },
  heparin: { material: 'heparin', name: 'Lithium-Heparin', farbe: { eu: { name: 'orange', hex: '#f97316' }, iso: { name: 'grün', hex: '#16a34a' } }, reihenfolge: 4, hinweis: 'Plasma für die klinische Chemie, je nach Labor statt Serum.' },
  edta: { material: 'edta', name: 'EDTA (Blutbild)', farbe: { eu: { name: 'rot', hex: '#dc2626' }, iso: { name: 'violett', hex: '#7c3aed' } }, reihenfolge: 5, hinweis: 'Nach Serum/Heparin: EDTA bindet Calcium und enthält Kalium, Verschleppung verfälscht beides.' },
  fluorid: { material: 'fluorid', name: 'Fluorid (Glukose, Laktat)', farbe: { eu: { name: 'gelb', hex: '#eab308' }, iso: { name: 'grau', hex: '#6b7280' } }, reihenfolge: 6, hinweis: 'Fluorid stoppt den Zuckerabbau der Blutzellen.' },
  bga: { material: 'bga', name: 'BGA-Spritze (heparinisiert)', farbe: { eu: { name: 'Spritze', hex: '#0ea5e9' }, iso: { name: 'Spritze', hex: '#0ea5e9' } }, hinweis: 'Arteriell durch ärztliches oder speziell geschultes Personal. Luftblasen entfernen, sofort messen.' },
  kapillar: { material: 'kapillar', name: 'Kapillarblut (Teststreifen)', farbe: { eu: { name: 'Streifen', hex: '#94a3b8' }, iso: { name: 'Streifen', hex: '#94a3b8' } }, hinweis: 'Seitlich an der Fingerbeere, Hände gewaschen und trocken, ersten Tropfen verwerfen.' },
  urin: { material: 'urin', name: 'Urin (Mittelstrahl)', farbe: { eu: { name: 'Becher', hex: '#facc15' }, iso: { name: 'Becher', hex: '#facc15' } }, hinweis: 'Frisch, Mittelstrahl nach Intimpflege; bei Katheter aus der Entnahmestelle, nie aus dem Beutel.' },
};

/** Röhrchen, die ein Auftrag braucht, in empfohlener Reihenfolge. Patientennahe Messungen ans Ende. */
export function benoetigteRoehrchen(parameterIds: string[]): Material[] {
  const set = new Set(parameterIds.map((id) => parameter(id).material));
  return [...set].sort((a, b) => (ROEHRCHEN[a].reihenfolge ?? 99) - (ROEHRCHEN[b].reihenfolge ?? 99));
}

/** Nur venöse Röhrchen mit fester Reihenfolge. */
export const venoes = (m: Material) => ROEHRCHEN[m].reihenfolge !== undefined;

/** Wie die Probe gewonnen wurde: Entscheidungen der Lernenden. */
export interface Abnahme {
  /** Identität am Bett aktiv erfragt bzw. Armband geprüft und Röhrchen vor Ort beschriftet. */
  identitaetGeprueft: boolean;
  /** Stauzeit in Sekunden. Über 60 s: Hämokonzentration und Hämolyse. */
  stauzeit: number;
  /** Aus dem Arm mit laufender Infusion abgenommen. */
  infusionsarm: boolean;
  /** Tatsächliche Reihenfolge der venösen Röhrchen. */
  reihenfolge: Material[];
  /** Citratröhrchen bis zur Markierung gefüllt. */
  citratVoll: boolean;
  /** Probe sofort transportiert (sonst: ungekühlt über 2 h gelegen). */
  sofortTransport: boolean;
  /** Blutkultur vor der ersten Antibiotikagabe. */
  vorAntibiose?: boolean;
  /** Röhrchen kräftig geschüttelt statt sanft geschwenkt. */
  geschuettelt?: boolean;
}

export const STANDARD_ABNAHME: Abnahme = { identitaetGeprueft: true, stauzeit: 40, infusionsarm: false, reihenfolge: [], citratVoll: true, sofortTransport: true, vorAntibiose: true, geschuettelt: false };

export type FehlerArt = 'identitaet' | 'haemolyse' | 'stauung' | 'infusion' | 'verschleppung' | 'citrat' | 'liegezeit' | 'antibiose';

export interface PraeanalytikFehler {
  art: FehlerArt;
  titel: string;
  folge: string;
  /** Betroffene Parameter mit Verfälschung: additiv (delta) oder als Faktor. */
  wirkung: { id: string; delta?: number; faktor?: number }[];
  /** Laborkommentar auf dem Befund, wenn das Labor den Fehler bemerkt. */
  laborKommentar?: string;
  /** true: Labor lehnt die Probe ab, es kommt kein Wert. */
  abgelehnt?: boolean;
}

/** Ist die Reihenfolge der venösen Röhrchen so, dass EDTA vor Serum/Heparin kam? */
function edtaVorChemie(reihe: Material[]): boolean {
  const iEdta = reihe.indexOf('edta');
  if (iEdta < 0) return false;
  return reihe.slice(iEdta + 1).some((m) => m === 'serum' || m === 'heparin');
}

export function reihenfolgeFehler(reihe: Material[]): { falsch: boolean; erwartet: Material[] } {
  const erwartet = [...reihe].sort((a, b) => (ROEHRCHEN[a].reihenfolge ?? 99) - (ROEHRCHEN[b].reihenfolge ?? 99));
  return { falsch: erwartet.some((m, i) => m !== reihe[i]), erwartet };
}

/** Welche Präanalytikfehler entstehen aus dieser Abnahme? */
export function fehlerAus(abnahme: Abnahme, materialien: Material[]): PraeanalytikFehler[] {
  const fehler: PraeanalytikFehler[] = [];
  const hat = (m: Material) => materialien.includes(m);
  const venoesJa = materialien.some(venoes);
  if (!venoesJa) return fehler;
  if (!abnahme.identitaetGeprueft) fehler.push({ art: 'identitaet', titel: 'Identität nicht geprüft', folge: 'Verwechslungsgefahr: Werte könnten von einer anderen Person stammen. Das Labor nimmt unbeschriftete Proben nicht an.', wirkung: [], laborKommentar: 'Probe nicht eindeutig zugeordnet: abgelehnt, bitte neu abnehmen.', abgelehnt: true });
  const haemolyse = abnahme.stauzeit > 120 || !!abnahme.geschuettelt;
  if (haemolyse && (hat('serum') || hat('heparin'))) fehler.push({ art: 'haemolyse', titel: 'Hämolyse', folge: 'Zerstörte rote Blutkörperchen geben Kalium frei: Kalium falsch hoch, ohne dass der Patient eine Hyperkaliämie hat.', wirkung: [{ id: 'k', delta: 1.4 }], laborKommentar: 'Probe hämolytisch: Kalium nicht sicher verwertbar.' });
  if (abnahme.stauzeit > 60) fehler.push({ art: 'stauung', titel: 'Zu lange gestaut', folge: 'Flüssigkeit tritt ins Gewebe aus: Hämoglobin, Eiweiß und Calcium werden zu hoch gemessen. Stauung höchstens 1 Minute, vor der Abnahme lösen.', wirkung: [{ id: 'hb', faktor: 1.06 }, { id: 'ca', faktor: 1.04 }] });
  if (abnahme.infusionsarm) fehler.push({ art: 'infusion', titel: 'Abnahme am Infusionsarm', folge: 'Infusionslösung verdünnt die Probe und verfälscht je nach Lösung Glukose und Natrium. Immer am Gegenarm oder Infusion pausieren nach Hausstandard.', wirkung: [{ id: 'hb', faktor: 0.85 }, { id: 'glukose', delta: 160 }, { id: 'na', delta: 4 }, { id: 'k', faktor: 0.9 }], laborKommentar: 'Auffällige Werte, Kontamination mit Infusionslösung möglich.' });
  if (edtaVorChemie(abnahme.reihenfolge)) fehler.push({ art: 'verschleppung', titel: 'EDTA vor Serum abgenommen', folge: 'Kalium-EDTA wird ins nächste Röhrchen verschleppt: Kalium falsch hoch, Calcium falsch niedrig.', wirkung: [{ id: 'k', delta: 1.8 }, { id: 'ca', delta: -0.6 }] });
  if (hat('citrat') && !abnahme.citratVoll) fehler.push({ art: 'citrat', titel: 'Citratröhrchen unterfüllt', folge: 'Zu viel Citrat für zu wenig Blut: Gerinnungszeiten falsch verlängert. Das Labor weist unterfüllte Röhrchen meist ab.', wirkung: [{ id: 'inr', faktor: 1.35 }, { id: 'aptt', faktor: 1.3 }], laborKommentar: 'Citratröhrchen unterfüllt: Gerinnung nicht beurteilbar.' });
  if (!abnahme.sofortTransport) fehler.push({ art: 'liegezeit', titel: 'Probe lange liegen gelassen', folge: 'Blutzellen verbrauchen Zucker und verlieren Kalium: Glukose (ohne Fluorid) falsch niedrig, Kalium falsch hoch.', wirkung: [{ id: 'k', delta: 0.7 }, { id: 'glukose', faktor: hat('fluorid') ? 0.97 : 0.8 }] });
  if (hat('blutkultur') && abnahme.vorAntibiose === false) fehler.push({ art: 'antibiose', titel: 'Blutkultur nach Antibiotikagabe', folge: 'Erreger wachsen in der Flasche oft nicht mehr an: falsch negative Blutkultur, gezielte Therapie wird schwieriger.', wirkung: [{ id: 'bk', faktor: 0 }] });
  return fehler;
}

/** Wendet die Fehler auf einen wahren Wert an. */
export function verfaelsche(id: string, wahr: number, fehler: PraeanalytikFehler[]): number {
  let w = wahr;
  for (const f of fehler) for (const e of f.wirkung) if (e.id === id) {
    if (e.faktor !== undefined) w *= e.faktor;
    if (e.delta !== undefined) w += e.delta;
  }
  return w;
}
