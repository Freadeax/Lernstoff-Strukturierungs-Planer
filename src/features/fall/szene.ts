// Was die animierte Zimmerszene zeigt, abgeleitet aus dem Fallverlauf. Rein und testbar:
// Die KI beschreibt frei, deshalb lesen wir Personen, Telefon, Lagerung und Laufziel über
// Stichworte aus Situation und Eingabe. Unsicheres bleibt einfach weg, statt falsch zu zeigen.

import { blutdruck, gesamtAlarm, zahl, type MonitorWerte } from '../../ui/sim/monitor';
import type { Fall, Vitalwerte, Zug, Zustand } from './simulator';

export type Person = 'aerztin' | 'angehoerige' | 'kollegin' | 'notfallteam';
export type Ort = 'bett' | 'monitor' | 'wagen' | 'telefon' | 'tuer';
export type Fokus = 'raum' | Ort;

export interface SzenenBild {
  zustand: Zustand;
  monitor: MonitorWerte;
  /** Monitor zeigt Werte erst, wenn gemessen wurde */
  monitorAn: boolean;
  /** Atemzüge pro Minute für die Brustbewegung (geschätzt, wenn nicht gemessen) */
  atem: number;
  sauerstoff: boolean;
  oberkoerperHoch: boolean;
  personen: Person[];
  telefon: boolean;
  alarm: boolean;
  schwitzt: boolean;
  zyanose: boolean;
  /** Wohin die Pflegekraft ("Du") geht */
  ziel: Ort;
  /** Wohin die Kamera fährt */
  fokus: Fokus;
  nacht: boolean;
  /** Minuten seit Mitternacht für die Wanduhr, null = unbekannt */
  minuten: number | null;
  /** Kurzbeschreibung für Screenreader */
  beschreibung: string;
}

export const PERSON_LABEL: Record<Person, string> = {
  aerztin: 'Ärztin', angehoerige: 'Angehörige', kollegin: 'Kollegin', notfallteam: 'Notfallteam',
};
export const ORT_LABEL: Record<Ort, string> = {
  bett: 'am Bett', monitor: 'am Monitor', wagen: 'am Materialwagen', telefon: 'am Telefon', tuer: 'an der Tür',
};

const PERSON_MUSTER: Array<[Person, RegExp]> = [
  ['notfallteam', /notfallteam|reanimationsteam|rea-team|notarzt|notärzt|rettungsdienst|sanitäter|\bmet\b|medical emergency/i],
  ['aerztin', /ärztin|arzt\b|ärzte|\bdr\.|visite|stationsärzt|dienstarzt|diensthabende/i],
  ['angehoerige', /\btochter|\bsohn\b|\behefrau|\behemann|\benkel|angehörig|\bbruder\b|\bmutter\b|\bvater\b|\bpartnerin|\bpartner\b/i],
  ['kollegin', /kollegin|kollege|praxisanleit|stationsleitung|schichtleitung/i],
];

const ZIEL_MUSTER: Array<[Ort, RegExp]> = [
  ['telefon', /ruf\w*|anruf|telefon|informier|sbar|verständig|melde\w* (der|dem) (ärztin|arzt)/i],
  ['monitor', /mess|vital|blutdruck|puls|sättigung|spo|temperatur|news|monitor|bz\b|blutzucker|atemfrequenz|zähle/i],
  ['wagen', /material|medikament|infusion|verband|hole|bring|richte|vorbereit|sauerstoff|absaug|insulin|traubenzucker|glukose/i],
  ['tuer', /angehörig|tochter|sohn|gehe (raus|hinaus|zur tür)|tür/i],
];

/** Personen, die in diesem Text vorkommen (Reihenfolge fest). */
export function personenIn(text: string): Person[] {
  return PERSON_MUSTER.filter(([, re]) => re.test(text)).map(([p]) => p);
}

/** Wohin eine Handlung die Pflegekraft führt. Ohne Treffer: ans Bett. */
export function zielVon(eingabe: string | undefined): Ort {
  if (!eingabe) return 'bett';
  return ZIEL_MUSTER.find(([, re]) => re.test(eingabe))?.[0] ?? 'bett';
}

const HOCH = /oberkörper\w*\s*(hoch|erhöht|aufrecht)|herzbett|hochlager|hoch ?gelagert|aufrecht|aufsetzen|setze ihn auf|setze sie auf|sitzt (im bett )?aufrecht|30\s*°|45\s*°|kopfteil (hoch|an)/i;
const FLACH = /flach|kopfteil (runter|ab)|schocklage|beine hoch/i;

/** Aktuelle Lagerung aus dem gesamten Verlauf: die letzte Erwähnung gewinnt. */
export function oberkoerperHoch(texte: string[]): boolean {
  let hoch = false;
  for (const t of texte) {
    const h = t.search(HOCH), f = t.search(FLACH);
    if (h >= 0 && (f < 0 || h > f)) hoch = true;
    else if (f >= 0) hoch = false;
  }
  return hoch;
}

export function monitorWerte(v: Vitalwerte | undefined): MonitorWerte {
  if (!v) return {};
  const [sys, dia] = blutdruck(v.rr);
  const o2 = v.sauerstoff.trim().toLowerCase();
  return {
    puls: zahl(v.puls), af: zahl(v.af), spo2: zahl(v.spo2), sys, dia, temp: zahl(v.temp),
    avpu: v.bewusstsein.trim() || null, sauerstoff: o2 === 'ja' ? true : o2 === 'nein' ? false : null,
  };
}

const GESCHAETZTE_ATMUNG: Record<Zustand, number> = { stabil: 16, verbessert: 15, verschlechtert: 24, kritisch: 30 };

export function minutenAus(uhrzeit: string | undefined): number | null {
  const m = /(\d{1,2})[:.](\d{2})/.exec(uhrzeit ?? '');
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

const istAn = (m: MonitorWerte) => [m.puls, m.spo2, m.af].some((x) => x !== null && x !== undefined);

/** Alarm in einem Zug: kritischer Zustand, roter Monitorwert oder ausdrücklich im Text. */
function alarmVon(zug: Zug | undefined, messwert = true): boolean {
  if (!zug) return false;
  const m = monitorWerte(zug.vitalwerte);
  return zug.zustand === 'kritisch' || (messwert && istAn(m) && gesamtAlarm(m) === 'rot') || /alarm|reanimation|notfall/i.test(zug.situation);
}

/** Szene für den aktuellen Stand des Falls. */
/** messwertAlarm=false: rote Erwachsenen-Grenzen lösen keinen Alarm aus (Kinderfall ohne Freigabe). */
export function szenenBild(fall: Fall, { messwertAlarm = true }: { messwertAlarm?: boolean } = {}): SzenenBild {
  const runden = fall.runden;
  const letzte = runden.at(-1);
  const zug = letzte?.zug;
  const situation = zug?.situation ?? '';
  const zustand: Zustand = zug?.zustand ?? 'stabil';
  const monitor = monitorWerte(zug?.vitalwerte);
  const monitorAn = istAn(monitor);
  const alarm = alarmVon(zug, messwertAlarm);
  const alarmNeu = alarm && !alarmVon(runden.at(-2)?.zug, messwertAlarm);
  const personen = personenIn(situation);
  const telefon = /telefon|ruft (an|zurück)|anruf|klingelt das telefon|am apparat/i.test(situation);
  const verlaufTexte = runden.flatMap((r) => [r.eingabe ?? '', r.zug.situation]);
  const sauerstoff = monitor.sauerstoff === true || /nasenbrille|sauerstoffbrille|sauerstoffmaske|o₂-brille|o2-brille|sauerstoff läuft/i.test(situation);
  const ziel = zielVon(letzte?.eingabe);
  const vorher = personenIn(runden.at(-2)?.zug.situation ?? '');
  const neuePerson = personen.some((p) => !vorher.includes(p));
  // Kamera: Neues zuerst (Telefon, wer hereinkommt, frischer Alarm), sonst dorthin, wo du handelst
  const fokus: Fokus = telefon ? 'telefon'
    : neuePerson ? 'tuer'
      : alarmNeu && monitorAn ? 'monitor'
        : letzte?.eingabe ? ziel
          : alarm && monitorAn ? 'monitor' : 'raum';
  const minuten = minutenAus(zug?.uhrzeit);
  const nacht = minuten === null ? false : minuten < 6 * 60 || minuten >= 21 * 60;
  const atem = monitor.af ?? GESCHAETZTE_ATMUNG[zustand];

  const teile = [
    `Patient ${zustand === 'kritisch' ? 'in kritischem Zustand' : zustand}`,
    oberkoerperHoch(verlaufTexte) ? 'Oberkörper hoch gelagert' : '',
    sauerstoff ? 'bekommt Sauerstoff' : '',
    personen.length ? `im Zimmer: ${personen.map((p) => PERSON_LABEL[p]).join(', ')}` : '',
    telefon ? 'das Telefon klingelt' : '',
    alarm ? 'Alarm' : '',
    `du stehst ${ORT_LABEL[ziel]}`,
  ].filter(Boolean);

  return {
    zustand, monitor, monitorAn, atem, sauerstoff,
    oberkoerperHoch: oberkoerperHoch(verlaufTexte),
    personen, telefon, alarm,
    schwitzt: /schwitz|schweiß|kaltschweiß/i.test(situation),
    zyanose: zustand === 'kritisch' || /bläulich|zyano|blaue lippen|lippen sind blau/i.test(situation),
    ziel, fokus, nacht, minuten,
    beschreibung: teile.join(', ') + '.',
  };
}
