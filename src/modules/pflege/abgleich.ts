// Synonyme und Abkürzungen für den Antwort-Katalog (Freitext-Abgleich offline).
// Erstes Wort jeder Gruppe = Leitwort. Ergänzt wird aus dem Glossar (Begriff, Abkürzung, Synonyme).
// Seiten rendern erst nach ladePflegeVoll(), daher ist das Glossar beim ersten Aufruf gefüllt.

import { synonyme, type Synonyme } from '../../core/abgleich/normalisieren';
import { pflegeModule } from './index';

/** Handgepflegt: Alltagssprache auf Station ↔ Fachwort. Nur Gruppen, die wirklich dasselbe meinen. */
export const PFLEGE_SYNONYME: string[][] = [
  ['blutdruck', 'rr', 'riva rocci', 'blutdruckwert', 'blutdruckmessung'],
  ['messen', 'messe', 'misst', 'kontrollieren', 'kontrolliere', 'checken', 'checke', 'nachmessen', 'pruefen', 'pruefe', 'ueberpruefen'],
  ['aerztin', 'arzt', 'doktor', 'doktorin', 'doc', 'stationsarzt', 'stationsaerztin', 'dienstarzt', 'diensthabende aerztin', 'mediziner'],
  ['bescheid geben', 'bescheid sagen', 'informieren', 'melden', 'benachrichtigen', 'verstaendigen', 'anrufen', 'telefonieren', 'durchgeben'],
  ['sorge', 'sorgen', 'angst', 'aengste', 'befuerchtung', 'befuerchtungen', 'bedenken', 'panik'],
  ['wuetend', 'sauer', 'veraergert', 'aergerlich', 'zornig', 'aufgebracht', 'empoert', 'genervt', 'aerger', 'wut'],
  ['traurig', 'bedrueckt', 'niedergeschlagen', 'betruebt', 'weinen', 'weinst', 'weint', 'traenen'],
  ['tablette', 'tabletten', 'medikament', 'medikamente', 'pille', 'pillen', 'arznei', 'arzneimittel', 'medizin', 'medis'],
  ['entschuldigung', 'tut mir leid', 'es tut mir leid', 'sorry', 'verzeihung', 'bedauere'],
  ['sturz', 'gestuerzt', 'hingefallen', 'gefallen', 'umgefallen', 'stuerzen', 'faellt', 'fallen'],
  ['fixieren', 'fixierung', 'festbinden', 'festschnallen', 'bauchgurt', 'gurt', 'bettgitter', 'anbinden'],
  ['leitung', 'wohnbereichsleitung', 'stationsleitung', 'pdl', 'pflegedienstleitung', 'chefin', 'chef', 'vorgesetzte', 'vorgesetzten'],
  ['schwindel', 'schwindelig', 'schwindlig', 'schwarz vor augen', 'kreislauf', 'taumelig'],
  ['besprechungszimmer', 'besprechungsraum', 'dienstzimmer', 'ruhigen raum', 'ruhigen ort', 'ruhiges zimmer'],
  ['erzaehlen', 'erzaehlen sie', 'berichten', 'schildern', 'beschreiben'],
  ['verstehen', 'verstehe', 'nachvollziehen', 'kann ich nachvollziehen', 'nachvollziehbar', 'verstaendlich'],
  ['setzen', 'hinsetzen', 'setze mich', 'zu ihnen setzen', 'platz nehmen'],
  ['aufstehen', 'aufgestanden', 'raus muss', 'aus dem bett'],
  ['pfannkuchen', 'eierkuchen', 'palatschinken', 'crepes'],
  ['kinder', 'kids', 'kleinen'],
  ['schlaftablette', 'schlafmittel', 'beruhigungsmittel', 'beruhigungstablette'],
  ['operation', 'op', 'eingriff', 'operiert'],
  ['aufklaerungsgespraech', 'aufklaerung', 'vorgespraech', 'narkosegespraech'],
  ['stimme', 'sprechen', 'sprache', 'reden'],
  ['notieren', 'aufschreiben', 'dokumentieren', 'eintragen', 'vermerken', 'schreibe auf'],
  ['nachtlicht', 'licht anlassen', 'beleuchtung'],
  ['klingelmatte', 'sensormatte', 'trittmatte', 'bewegungsmelder'],
  ['klingeln', 'klingel', 'rufen', 'rufanlage', 'notruf'],
  ['schmerzen', 'schmerz', 'weh', 'tut weh'],
];

let zwischen: Synonyme | undefined;
let glossarStand = -1;

/** Synonyme fürs Pflegemodul, mit Glossar-Abkürzungen (zwischengespeichert, bis das Glossar wächst). */
export function pflegeSynonyme(): Synonyme {
  const gl = pflegeModule.glossary;
  if (zwischen && glossarStand === gl.length) return zwischen;
  const ausGlossar: string[][] = [];
  for (const g of gl) {
    if (!g.abbreviation || g.abbreviation.length < 2) continue;
    ausGlossar.push([g.term, g.abbreviation, ...(g.synonyms ?? [])]);
  }
  zwischen = synonyme([...PFLEGE_SYNONYME, ...ausGlossar]);
  glossarStand = gl.length;
  return zwischen;
}
