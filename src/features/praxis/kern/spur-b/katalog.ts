// Spur B – Ergänzungen zum zentralen Handlungskatalog (P3, ../katalog.ts) für die Modellmodule (P1b).
// Nur was dort fehlt; alles andere nutzt die P3-IDs (monitor-anlegen, o2-geben, infusion-anhaengen, perfusor-vorbereiten,
// katecholamin-anpassen, arterie-nullabgleich, bga-abnehmen-arteriell, bga-messen-lesen, bilanz-fuehren …).
// Befugnisse im Stil von P3, mit Lehrplan-Nachweis (BW 3BFP) bzw. „nicht belegt“ mit Anmerkung. 'gesperrt' = nicht einmal mit Anleitung.

import { alsQuelle, nachweis as nw, NICHT_BELEGT, type Nachweis } from '../lehrplan-belege';
import type { BefugnisLevel, KB, KlinischerBereich, MassnahmeDefinition, Reiter, Rolle } from '../typen';

const S = 'selbst', A = 'mit-anleitung', G = 'gesperrt';
const b = (d1: BefugnisLevel, d2: BefugnisLevel, d3: BefugnisLevel, pfp: BefugnisLevel): Record<Rolle, BefugnisLevel> => ({ 1: d1, 2: d2, 3: d3, pflegefachperson: pfp });

export const SPUR_B_NACHWEIS: Record<string, Nachweis> = {};

function m(id: string, name: string, reiter: Reiter, zeit: number, kb: KB[], klinisch: KlinischerBereich[], n: Nachweis, mehr: Partial<MassnahmeDefinition> = {}): MassnahmeDefinition {
  SPUR_B_NACHWEIS[id] = n;
  const beleg = alsQuelle(n);
  return { id, name, reiter, spur: 'B', zeitbedarfSekunden: zeit, befugnis: b(S, S, S, S), kompetenzbereiche: kb, klinisch, ...(beleg ? { befugnisBeleg: beleg } : {}), ...mehr };
}

const DELEGIERT = 'Ärztlich veranlasst und delegierbar wie die venöse Blutentnahme; Grundwert: im 3. Drittel mit Anleitung.';

export const SPUR_B_LISTE: MassnahmeDefinition[] = [
  m('qsofa-erheben', 'qSOFA erheben (Atemfrequenz, Blutdruck, Bewusstsein)', 'beobachten', 30, ['I', 'V'], ['abcde'], nw(['vitalScreening12', 'notfallplan12'])),
  m('blutkulturen-abnehmen', 'Blutkulturen abnehmen (2 Paare, vor dem Antibiotikum)', 'messen', 180, ['I', 'III', 'V'], ['medikamente'],
    nw(['mitwirken12', 'eigenstaendig3'], { anmerkung: DELEGIERT }), {
      anordnungspflichtig: true, befugnis: b(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa', setzt: ['blutkulturen'],
    }),
  m('bga-venoes-abnehmen', 'Venöse BGA mit Laktat abnehmen', 'messen', 90, ['I', 'III'], ['abcde'],
    nw(['mitwirken12', 'eigenstaendig3'], { anmerkung: DELEGIERT }), {
      anordnungspflichtig: true, befugnis: b(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa', setzt: ['bga-abgenommen'],
    }),
  m('arterie-assistieren', 'Arterielle Kanüle: Material richten, assistieren, Druckmessung anschließen', 'versorgen', 300, ['I', 'III'], ['geraete', 'team'],
    nw(['invasiv3', 'zuAbleitungen12'], { anmerkung: 'Die Ärztin punktiert; die Pflege richtet, assistiert und schließt das Messsystem an.' }), {
      anordnungspflichtig: true, befugnis: b(G, G, A, S), risikoBeiUeberschreitung: 'abbruch-durch-pa',
      setzt: ['arterie-liegt'], modul: { arteriell: true, stoerungAn: ['art-nicht-genullt'] },
    }),
  m('art-system-pruefen', 'Arterielles System prüfen (Luft, Gerinnsel, Knick, Spüldruck)', 'messen', 60, ['I'], ['geraete'], nw(['instabil3', 'invasiv3']), {
    befugnis: b(G, G, A, S), risikoBeiUeberschreitung: 'warnung-pa', voraussetzung: { flag: 'arterie-liegt' }, modul: { stoerungAus: ['art-gedaempft'] },
  }),
  m('beatmung-diskonnektion-beheben', 'Beatmung: Diskonnektion suchen und beheben', 'akut', 20, ['I'], ['geraete', 'abcde'], nw(['atem3', 'instabil3']), {
    befugnis: b(G, A, A, S), risikoBeiUeberschreitung: 'warnung-pa', voraussetzung: { flag: 'beatmet' }, modul: { stoerungAus: ['diskonnektion'] },
  }),
  m('katecholamin-schenkel-spuelen', 'Zugang über den Katecholamin-Schenkel durchspülen', 'versorgen', 20, ['I'], ['medikamente', 'geraete'],
    NICHT_BELEGT('Fehlhandlung als Ablenker (Bolusgefahr); keine Befugnisfrage.'), { voraussetzung: { flag: 'perfusor-laeuft' } }),
];
