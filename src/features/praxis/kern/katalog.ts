// Praxissimulator neu – Handlungskatalog (Startbestand für den Pilotfall).
// Paket P3 baut den Katalog aus und belegt jede Befugnis mit dem BW-Landeslehrplan 3BFP (E4).
// Bis dahin gilt: befugnisBeleg fehlt = Grundwert aus dem Konzept (KONZEPT.md 6.1), noch nicht belegt.

import { SPUR_B_LISTE } from './spur-b/katalog';
import type { BefugnisLevel, KB, MassnahmeDefinition, Reiter, Rolle } from './typen';

/** Befugnis kurz: 1., 2., 3. Drittel, Pflegefachperson */
export function befugnis(d1: BefugnisLevel, d2: BefugnisLevel = d1, d3: BefugnisLevel = d2, pfp: BefugnisLevel = d3): Record<Rolle, BefugnisLevel> {
  return { 1: d1, 2: d2, 3: d3, pflegefachperson: pfp };
}

const SELBST = befugnis('selbst');

function m(id: string, name: string, reiter: Reiter, zeitbedarfSekunden: number, kompetenzbereiche: KB[], mehr: Partial<MassnahmeDefinition> = {}): MassnahmeDefinition {
  return { id, name, reiter, spur: 'beide', zeitbedarfSekunden, befugnis: SELBST, kompetenzbereiche, ...mehr };
}

const LISTE: MassnahmeDefinition[] = [
  // Gespräch & Beziehung
  m('ansprechen-orientierung', 'Ansprechen und Orientierung prüfen', 'gespraech', 20, ['I', 'II']),
  m('trinkmenge-erfragen', 'Nach Trinkmenge fragen', 'gespraech', 30, ['I', 'II']),

  // Beobachten & Einschätzen
  m('ersteindruck-abcde', 'Ersteindruck nach ABCDE', 'beobachten', 20, ['I']),
  m('verletzung-pruefen-sturz', 'Nach Sturz auf Verletzungen prüfen', 'beobachten', 60, ['I', 'V']),
  m('kopf-pruefen', 'Kopf auf Verletzung prüfen', 'beobachten', 20, ['I']),
  m('schmerz-nrs', 'Schmerz einschätzen (NRS)', 'beobachten', 30, ['I', 'V']),
  m('schleimhaut-pruefen', 'Mundschleimhaut und Zunge ansehen', 'beobachten', 20, ['I']),
  m('hautturgor-pruefen', 'Hautspannung prüfen', 'beobachten', 20, ['I']),
  m('urin-beobachten', 'Urin beobachten (Menge, Farbe)', 'beobachten', 30, ['I']),
  m('delir-screening-4at', 'Delir-Screening (4AT)', 'beobachten', 90, ['I', 'V']),

  // Akut & Sicherheit
  m('sitzend-sichern', 'Sitzend sichern, wärmen, nicht allein lassen', 'akut', 60, ['I'], {
    setzt: ['gesichert'], wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
  }),
  m('notruf-112', 'Rettungsdienst rufen (112)', 'akut', 60, ['III'], { setzt: ['rettungsdienst'] }),
  m('umgebung-sichern', 'Umgebung sichern (Stolperfallen, Licht)', 'akut', 60, ['I', 'V'], { setzt: ['umgebung-sicher'] }),

  // Messen & Befunde
  m('pulsoxy-anlegen', 'Pulsoxymeter anlegen', 'messen', 40, ['I'], { geraet: 'pulsoxy' }),
  m('rr-messen', 'Blutdruck messen', 'messen', 60, ['I'], { geraet: 'rr-geraet' }),
  m('puls-zaehlen', 'Puls tasten und zählen', 'messen', 30, ['I']),
  m('temperatur-ohr', 'Temperatur messen (Ohr)', 'messen', 30, ['I'], { geraet: 'thermometer' }),
  m('bz-messen', 'Blutzucker messen', 'messen', 90, ['I'], { geraet: 'bz-geraet', befugnis: befugnis('mit-anleitung', 'selbst') }),
  m('dosett-pruefen', 'Medikamentendosett prüfen', 'messen', 30, ['I', 'IV']),

  // Pflegen & Versorgen
  m('trinken-anbieten', 'Trinken anbieten, Trinkprotokoll beginnen', 'versorgen', 120, ['I', 'V'], {
    setzt: ['trinkprotokoll'],
    wirkung: [
      { groesse: 'hydratation', delta: 0.12, beginnSek: 120, spitzeSek: 1800, dauerSek: 'dauerhaft' },
      { groesse: 'volumen', delta: 0.08, beginnSek: 120, spitzeSek: 1800, dauerSek: 'dauerhaft' },
    ],
  }),
  m('tabletten-wie-geplant-geben', 'Tabletten aus dem Dosett geben (wie geplant)', 'versorgen', 60, ['I', 'III'], {
    anordnungspflichtig: true, befugnis: befugnis('mit-anleitung', 'mit-anleitung', 'selbst'), risikoBeiUeberschreitung: 'warnung-pa',
  }),
  m('torasemid-zurueckhalten', 'Torasemid heute zurückhalten', 'versorgen', 20, ['I', 'III'], { anordnungspflichtig: true }),
  m('lorazepam-geben', 'Lorazepam geben', 'versorgen', 60, ['I', 'III'], {
    anordnungspflichtig: true, befugnis: befugnis('mit-anleitung', 'mit-anleitung', 'selbst'), risikoBeiUeberschreitung: 'patientenschaden',
  }),
  m('kompression-anziehen', 'Kompressionsstrümpfe anziehen', 'versorgen', 300, ['I'], { befugnis: befugnis('mit-anleitung', 'selbst') }),
  m('hausnotruf-anlegen', 'Hausnotruf anlegen und erklären', 'versorgen', 30, ['I', 'II']),

  // Melden & Übergabe
  m('tochter-informieren', 'Angehörige informieren', 'melden', 120, ['II']),
  m('pflegebericht', 'Pflegebericht schreiben', 'melden', 180, ['I', 'IV']),
  m('pdl-informieren', 'Pflegedienstleitung informieren', 'melden', 60, ['III']),
];

/** Spur-B-Handlungen (Akut/Intensiv) liegen in spur-b/katalog.ts (P1b). */
export const KATALOG: Readonly<Record<string, MassnahmeDefinition>> = Object.fromEntries([...LISTE, ...SPUR_B_LISTE].map((x) => [x.id, x]));
