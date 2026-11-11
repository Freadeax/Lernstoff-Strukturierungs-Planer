// Blutentnahme-Station der Werkbank: reine Logik (Szenarien, Bewertung), damit Tests und
// Oberfläche dieselben Regeln sehen. Die Fehlerregeln kommen aus der Präanalytik der Simulatoren.

import { bewerte, formatWert, parameter, type Flag } from '../../../ui/sim/labor/parameter';
import { benoetigteRoehrchen, fehlerAus, ROEHRCHEN, verfaelsche, venoes, type Abnahme, type FehlerArt, type PraeanalytikFehler } from '../../../ui/sim/labor/praeanalytik';
import type { Material } from '../../../ui/sim/labor/parameter';

export interface EntnahmeSzenario {
  id: string;
  titel: string;
  patient: { name: string; geburt: string; geschlecht: 'w' | 'm'; anrede: string };
  /** Kurzer Kontext am Bett. */
  lage: string;
  /** Angeforderte Parameter (bestimmen die Röhrchen). */
  parameter: string[];
  /** Wahre Werte der Person (ohne Präanalytikfehler). */
  wahr: Record<string, number>;
  /** Arm mit laufender Infusion. */
  infusion?: 'links' | 'rechts';
  /** Mit Flügelkanüle: ohne Verwurfröhrchen wird das erste Citratröhrchen unterfüllt. */
  fluegel?: boolean;
  /** Die erste Antibiotikagabe ist schon gelaufen. */
  antibiotikumGelaufen?: boolean;
}

export const SZENARIEN: EntnahmeSzenario[] = [
  {
    id: 'aufnahme', titel: 'Aufnahmelabor', patient: { name: 'Gerda Hoffmann', geburt: '14.03.1946', geschlecht: 'w', anrede: 'Frau Hoffmann' },
    lage: 'Aufnahme mit Schwäche und Schwindel. Am linken Unterarm läuft eine Glukose-5-%-Infusion.',
    parameter: ['k', 'na', 'krea', 'glukose', 'hb', 'leuko', 'crp'],
    wahr: { k: 4.3, na: 138, krea: 0.8, glukose: 112, hb: 12.8, leuko: 8.4, crp: 3 },
    infusion: 'links',
  },
  {
    id: 'gerinnung', titel: 'Gerinnung vor OP', patient: { name: 'Klaus Weber', geburt: '02.11.1958', geschlecht: 'm', anrede: 'Herr Weber' },
    lage: 'Morgen Hüft-OP, nimmt bis vorgestern Phenprocoumon. Schlechte Venen, du nimmst eine Flügelkanüle.',
    parameter: ['inr', 'aptt', 'hb', 'thrombo', 'k'],
    wahr: { inr: 1.2, aptt: 31, hb: 14.1, thrombo: 236, k: 4.1 },
    fluegel: true,
  },
  {
    id: 'sepsis', titel: 'Verdacht auf Sepsis', patient: { name: 'Ali Demir', geburt: '23.07.1951', geschlecht: 'm', anrede: 'Herr Demir' },
    lage: 'Fieber 39,4 °C, verwirrt, RR 92/50. Die erste Antibiotikagabe ist angeordnet, aber noch nicht gelaufen.',
    parameter: ['bk', 'crp', 'pct', 'leuko', 'krea', 'k', 'inr'],
    wahr: { inr: 1.4, crp: 182, pct: 6.8, leuko: 17.9, krea: 1.6, k: 4.6, bk: 1 },
  },
  {
    id: 'sepsis-spaet', titel: 'Blutkultur nach Antibiose', patient: { name: 'Marta Kowalski', geburt: '09.01.1939', geschlecht: 'w', anrede: 'Frau Kowalski' },
    lage: 'Pneumonie. Der Nachtdienst hat das Antibiotikum vor einer Stunde gegeben, Blutkulturen wurden vergessen.',
    parameter: ['bk', 'crp', 'leuko', 'k', 'krea'],
    wahr: { crp: 96, leuko: 14.2, k: 4.0, krea: 0.9, bk: 1 },
    antibiotikumGelaufen: true,
  },
];

/** Verwurf- bzw. Leerröhrchen bei Flügelkanüle (füllt den Schlauch, wird verworfen). */
export const VERWURF = 'verwurf' as const;
export type Platz = Material | typeof VERWURF;

export function roehrchenFuer(s: EntnahmeSzenario): Material[] {
  return benoetigteRoehrchen(s.parameter);
}

/** Röhrchen im Ständer: benötigte in gemischter Reihenfolge, bei Flügelkanüle plus Verwurfröhrchen. */
export function staender(s: EntnahmeSzenario, zufall: () => number = Math.random): Platz[] {
  const liste: Platz[] = [...roehrchenFuer(s)];
  if (s.fluegel) liste.push(VERWURF);
  for (let i = liste.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)); [liste[i], liste[j]] = [liste[j]!, liste[i]!]; }
  return liste;
}

/** Wie voll ein Röhrchen wird: bei Flügelkanüle ohne Verwurf saugt das erste Röhrchen Luft aus dem Schlauch. */
export function zielFuellung(s: EntnahmeSzenario, bisher: Platz[], naechstes: Platz): number {
  if (naechstes === VERWURF) return 0.5;
  if (s.fluegel && bisher.length === 0) return 0.82;
  return 1;
}

export interface EntnahmeEingabe {
  /** Offen gefragt („Wie heißen Sie …?“) und Armband geprüft. */
  identitaet: 'offen' | 'geschlossen' | 'keine';
  arm: 'links' | 'rechts';
  /** Stauzeit in Sekunden (von Anlegen bis Lösen). */
  stauzeit: number;
  /** Gefüllte Röhrchen in Reihenfolge, inklusive Verwurf. */
  folge: Platz[];
  /** Füllstand je Röhrchen (0..1) zur Zeit des Abziehens. */
  fuellung: Partial<Record<Material, number>>;
  mischen: 'schwenken' | 'schuetteln';
  transport: 'sofort' | 'spaeter';
}

export interface EntnahmeErgebnis {
  abnahme: Abnahme;
  fehler: PraeanalytikFehler[];
  werte: { id: string; wahr: number; gemessen?: number; flagWahr: Flag; flagGemessen?: Flag; verfaelscht: boolean }[];
  /** Hinweise ohne Wertverfälschung (z. B. fehlende Röhrchen). */
  hinweise: string[];
  punkte: number;
  max: number;
  /** Einzelkriterien wie ENTNAHME_KRITERIEN. */
  checks: boolean[];
}

export function bewerteEntnahme(s: EntnahmeSzenario, e: EntnahmeEingabe): EntnahmeErgebnis {
  const noetig = roehrchenFuer(s);
  const venoeseFolge = e.folge.filter((p): p is Material => p !== VERWURF && venoes(p));
  const abnahme: Abnahme = {
    identitaetGeprueft: e.identitaet === 'offen',
    stauzeit: e.stauzeit,
    infusionsarm: !!s.infusion && s.infusion === e.arm,
    reihenfolge: venoeseFolge,
    citratVoll: (e.fuellung.citrat ?? 0) >= 0.95,
    sofortTransport: e.transport === 'sofort',
    vorAntibiose: !s.antibiotikumGelaufen,
    geschuettelt: e.mischen === 'schuetteln',
  };
  const gefuellt = new Set(e.folge);
  const fehlend = noetig.filter((m) => !gefuellt.has(m));
  const fehler = fehlerAus(abnahme, noetig.filter((m) => gefuellt.has(m)));
  const abgelehnt = fehler.some((f) => f.abgelehnt);
  const werte = s.parameter.filter((id) => id !== 'bk').map((id) => {
    const p = parameter(id);
    const wahr = s.wahr[id] ?? 0;
    const roehrchenDa = gefuellt.has(p.material);
    const citratWeg = p.material === 'citrat' && fehler.some((f) => f.art === 'citrat');
    const gemessen = abgelehnt || !roehrchenDa || citratWeg ? undefined : verfaelsche(id, wahr, fehler);
    return {
      id, wahr, gemessen,
      flagWahr: bewerte(p, wahr, s.patient.geschlecht),
      flagGemessen: gemessen === undefined ? undefined : bewerte(p, gemessen, s.patient.geschlecht),
      verfaelscht: gemessen !== undefined && Math.abs(gemessen - wahr) > 1e-9,
    };
  });
  const hinweise: string[] = [];
  if (fehlend.length) hinweise.push(`Nicht abgenommen: ${fehlend.map((m) => ROEHRCHEN[m].name).join(', ')}. Diese Werte fehlen im Befund.`);
  if (e.identitaet === 'geschlossen') hinweise.push('„Sind Sie …?“ ist eine geschlossene Frage: Verwirrte oder schwerhörige Menschen nicken oft einfach. Offen fragen und das Armband prüfen.');
  if (s.fluegel && e.folge[0] !== VERWURF && noetig.includes('citrat')) hinweise.push('Flügelkanüle ohne Verwurfröhrchen: Die Luft im Schlauch landet im ersten Röhrchen.');
  if (s.antibiotikumGelaufen && noetig.includes('blutkultur')) hinweise.push('Die Blutkultur kommt nach der Antibiotikagabe: trotzdem abnehmen, aber auf dem Auftrag vermerken und ärztlich informieren. Künftig vor der ersten Gabe.');
  const checks = [
    e.identitaet === 'offen',
    !abnahme.infusionsarm,
    e.stauzeit <= 60,
    fehlend.length === 0,
    !fehler.some((f) => f.art === 'verschleppung') && !(venoeseFolge.length > 1 && venoeseFolge.some((m, i) => i > 0 && (ROEHRCHEN_RANG(m) < ROEHRCHEN_RANG(venoeseFolge[i - 1]!)))),
    !noetig.includes('citrat') || abnahme.citratVoll,
    e.mischen === 'schwenken',
    e.transport === 'sofort',
  ];
  return { abnahme, fehler, werte, hinweise, punkte: checks.filter(Boolean).length, max: checks.length, checks };
}

/** Was nach dem Fehler zu tun ist (Folgehandlung), getrennt von Ursache und Messwertänderung. */
export const FOLGEHANDLUNG: Record<FehlerArt, string> = {
  identitaet: 'Probe verwerfen, Person offen nach Name und Geburtsdatum fragen, Armband prüfen und neu abnehmen.',
  haemolyse: 'Kalium nicht behandeln, sondern ärztlich auf die Hämolyse hinweisen und schonend neu abnehmen (kurz stauen, nicht schütteln).',
  stauung: 'Werte mit Vorsicht lesen; bei Entscheidungsrelevanz neu abnehmen und den Stau vor dem Füllen lösen.',
  infusion: 'Ärztlich melden, dass die Probe verdünnt sein kann, und am Gegenarm neu abnehmen.',
  verschleppung: 'Kalium und Calcium ärztlich als fraglich melden und in der richtigen Reihenfolge neu abnehmen.',
  citrat: 'Gerinnung neu abnehmen, Citratröhrchen bis zur Marke füllen (bei Flügelkanüle erst Verwurfröhrchen).',
  liegezeit: 'Glukose und Kalium als fraglich kennzeichnen, bei Bedarf neu abnehmen und sofort transportieren.',
  antibiose: 'Trotzdem abnehmen, auf dem Auftrag „nach Antibiose“ vermerken und ärztlich informieren.',
};

export interface DebriefZeile { art: FehlerArt; ursache: string; erklaerung: string; messwert: string; folge: string }

/** Nachbesprechung: je Fehler Ursache, Änderung am Messwert und Folgehandlung getrennt. */
export function debrief(e: EntnahmeErgebnis): DebriefZeile[] {
  const abgelehnt = e.fehler.some((f) => f.abgelehnt);
  return e.fehler.map((f) => {
    const betroffen = e.werte.filter((w) => w.verfaelscht && f.wirkung.some((x) => x.id === w.id));
    const angefragt = f.wirkung.filter((x) => e.werte.some((w) => w.id === x.id)).map((x) => parameter(x.id).name);
    const messwert = f.abgelehnt ? 'Probe abgelehnt: kein Wert im Befund.'
      : abgelehnt ? (angefragt.length ? `Wegen der abgelehnten Probe nicht sichtbar. Verfälscht wären: ${angefragt.join(', ')}.` : 'Wegen der abgelehnten Probe nicht sichtbar.')
      : f.art === 'citrat' && e.werte.some((w) => parameter(w.id).material === 'citrat' && w.gemessen === undefined) ? 'Gerinnung nicht beurteilbar: kein Wert im Befund.'
      : betroffen.length ? betroffen.map((w) => { const p = parameter(w.id); return `${p.name} ${formatWert(p, w.wahr)} → ${formatWert(p, w.gemessen!)} ${p.einheit}`; }).join('; ')
      : f.art === 'antibiose' ? 'Blutkultur bleibt womöglich falsch negativ.'
      : 'In dieser Situation kein angeforderter Wert betroffen.';
    return { art: f.art, ursache: f.titel, erklaerung: f.folge, messwert, folge: FOLGEHANDLUNG[f.art] };
  });
}

/** Kriterien der Entnahme für den Lernplan (in derselben Reihenfolge wie die Punkte). */
export const ENTNAHME_KRITERIEN = ['Identität offen geprüft', 'Nicht am Infusionsarm', 'Stauzeit höchstens 1 min', 'Alle Röhrchen abgenommen', 'Reihenfolge eingehalten', 'Citrat voll', 'Sanft geschwenkt', 'Sofort transportiert'];

const ROEHRCHEN_RANG = (m: Material) => ROEHRCHEN[m].reihenfolge ?? 99;
