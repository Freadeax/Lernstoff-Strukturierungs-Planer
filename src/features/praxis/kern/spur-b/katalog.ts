// Spur B – Handlungen für Akut, Notfall und Intensiv (Startbestand P1b für den ersten Spur-B-Fall).
// Paket P3 übernimmt sie in den Gesamtkatalog und belegt die Befugnisse mit dem BW-Landeslehrplan 3BFP (E4).
// Bis dahin: Grundwerte aus KONZEPT.md 6.1 und Vorgaben des Master-Threads (18.11.), NICHT belegt.
//   „gesperrt“ im Konzept = hier 'nur-aerztlich' (Knopf führt zur Ärztin bzw. Grenze).
//   Ärztliche Handlungen bleiben ärztlich: die Pflege bereitet vor, assistiert, überwacht.

import type { BefugnisLevel, KB, KlinischerBereich, MassnahmeDefinition, Reiter, Rolle } from '../typen';

const b = (d1: BefugnisLevel, d2: BefugnisLevel, d3: BefugnisLevel, pfp: BefugnisLevel): Record<Rolle, BefugnisLevel> => ({ 1: d1, 2: d2, 3: d3, pflegefachperson: pfp });

const SELBST = b('selbst', 'selbst', 'selbst', 'selbst');
/** i. v.-Medikamente und Perfusoren: 1./2. Drittel gesperrt, 3. Drittel Vorbereitung mit Anleitung, Pflegefachperson nach Anordnung */
const IV_MEDIKAMENT = b('nur-aerztlich', 'nur-aerztlich', 'mit-anleitung', 'nach-anordnung');
/** Infusion ohne Zusatz anhängen: 1. gesperrt, 2./3. mit Anleitung, Pflegefachperson nach Anordnung */
const INFUSION = b('nur-aerztlich', 'mit-anleitung', 'mit-anleitung', 'nach-anordnung');
/** Delegierbare Blutentnahme (Blutkulturen, BGA): mit Anordnung; Azubi 3. Drittel unter Anleitung */
const BLUTENTNAHME = b('nur-aerztlich', 'nur-aerztlich', 'mit-anleitung', 'nach-anordnung');
/** Geräte der Intensivpflege führen (art. Druck, Beatmungsalarme): Azubi 3. Drittel mit Anleitung */
const GERAET = b('nur-aerztlich', 'mit-anleitung', 'mit-anleitung', 'selbst');

function m(id: string, name: string, reiter: Reiter, zeit: number, kb: KB[], klinisch: KlinischerBereich[], mehr: Partial<MassnahmeDefinition> = {}): MassnahmeDefinition {
  return { id, name, reiter, spur: 'B', zeitbedarfSekunden: zeit, befugnis: SELBST, kompetenzbereiche: kb, klinisch, ...mehr };
}

export const SPUR_B_LISTE: MassnahmeDefinition[] = [
  // Beobachten & Einschätzen
  m('qsofa-erheben', 'qSOFA erheben (AF, RR, Bewusstsein)', 'beobachten', 30, ['I', 'V'], ['abcde']),
  m('rekap-haut-pruefen', 'Rekapillarisierung und Haut (Marmorierung) prüfen', 'beobachten', 20, ['I'], ['abcde']),
  m('gcs-erheben', 'Bewusstsein nach GCS einschätzen', 'beobachten', 30, ['I'], ['abcde']),
  m('rass-erheben', 'Sedierungstiefe einschätzen (RASS)', 'beobachten', 30, ['I', 'V'], ['abcde']),
  m('beatmung-beobachten', 'Beatmung beobachten (Thoraxbewegung, Spitzendruck, etCO₂)', 'beobachten', 30, ['I'], ['abcde', 'geraete'], { befugnis: GERAET }),

  // Akut & Sicherheit
  m('monitor-anschliessen', 'Monitor anschließen (EKG, SpO₂, NIBP alle 5 min)', 'akut', 45, ['I'], ['abcde', 'geraete'], { setzt: ['monitor'] }),
  m('o2-maske-reservoir', 'O₂ über Maske mit Reservoir (Notfallstandard, Ziel-SpO₂ 94–98 %)', 'akut', 30, ['I', 'V'], ['abcde'], {
    befugnis: b('mit-anleitung', 'selbst', 'selbst', 'selbst'), setzt: ['o2'],
    wirkung: [{ groesse: 'sauerstoff', delta: 10, beginnSek: 0, spitzeSek: 20, dauerSek: 'dauerhaft' }],
  }),
  m('schocklage-beine-hoch', 'Flach lagern, Beine anheben (Autotransfusion)', 'akut', 30, ['I'], ['abcde'], {
    wirkung: [{ groesse: 'volumen', delta: 0.05, beginnSek: 0, spitzeSek: 30, dauerSek: 300 }],
  }),
  m('oberkoerper-90-grad', 'Oberkörper 90° aufrichten', 'akut', 30, ['I'], ['abcde']),
  m('beatmung-diskonnektion-beheben', 'Diskonnektion suchen und beheben', 'akut', 20, ['I'], ['geraete'], { befugnis: GERAET, modul: { stoerungAus: ['diskonnektion'] } }),
  m('endotracheal-absaugen', 'Endotracheal absaugen (geschlossenes System)', 'akut', 60, ['I', 'V'], ['abcde', 'geraete'], {
    befugnis: b('nur-aerztlich', 'mit-anleitung', 'mit-anleitung', 'selbst'), modul: { stoerungAus: ['sekret'] },
  }),

  // Messen & Diagnostik
  m('ekg-12-kanal', '12-Kanal-EKG schreiben', 'messen', 120, ['I'], ['abcde'], { befugnis: b('mit-anleitung', 'selbst', 'selbst', 'selbst') }),
  m('blutkulturen-abnehmen', 'Blutkulturen abnehmen (2 Paare, delegiert)', 'messen', 240, ['I', 'III', 'V'], ['medikamente'], {
    befugnis: BLUTENTNAHME, anordnungspflichtig: true, risikoBeiUeberschreitung: 'warnung-pa', setzt: ['blutkulturen'],
  }),
  m('bga-abnehmen', 'BGA mit Laktat abnehmen und am Gerät messen (delegiert)', 'messen', 150, ['I', 'III'], ['abcde'], {
    befugnis: BLUTENTNAHME, anordnungspflichtig: true, risikoBeiUeberschreitung: 'warnung-pa',
  }),
  m('art-nullabgleich', 'Arterielle Druckmessung: Nullabgleich auf Herzhöhe', 'messen', 45, ['I', 'V'], ['geraete'], {
    befugnis: GERAET, voraussetzung: { flag: 'art-liegt' }, modul: { stoerungAus: ['art-nicht-genullt'] }, setzt: ['art-genullt'],
  }),
  m('art-system-pruefen', 'Arterielles System prüfen (Luft, Knick, Spülung)', 'messen', 60, ['I'], ['geraete'], {
    befugnis: GERAET, voraussetzung: { flag: 'art-liegt' }, modul: { stoerungAus: ['art-gedaempft'] },
  }),
  m('urin-stundenmenge', 'Urin-Stundenmenge am Dauerkatheter ablesen, Bilanz führen', 'messen', 30, ['I'], ['abcde']),

  // Pflegen & Versorgen (Medikamente immer nach Anordnung)
  m('ringer-1000-iv', 'Kristalloide Infusion 1000 ml rasch (nach Anordnung)', 'versorgen', 60, ['I', 'III'], ['medikamente'], {
    befugnis: INFUSION, anordnungspflichtig: true, risikoBeiUeberschreitung: 'warnung-pa', setzt: ['volumen'],
    wirkung: [
      { groesse: 'volumen', delta: 0.16, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' },
      { groesse: 'einfuhrMl', delta: 1000, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' },
    ],
  }),
  m('piperacillin-tazobactam-iv', 'Piperacillin/Tazobactam 4,5 g i. v. geben', 'versorgen', 120, ['I', 'III'], ['medikamente'], {
    befugnis: IV_MEDIKAMENT, anordnungspflichtig: true, risikoBeiUeberschreitung: 'patientenschaden', setzt: ['antibiotikum'],
  }),
  m('meropenem-iv', 'Meropenem 1 g i. v. als Kurzinfusion geben', 'versorgen', 120, ['I', 'III'], ['medikamente'], {
    befugnis: IV_MEDIKAMENT, anordnungspflichtig: true, risikoBeiUeberschreitung: 'patientenschaden', setzt: ['antibiotikum'],
    wirkung: [{ groesse: 'einfuhrMl', delta: 100, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' }],
  }),
  m('noradrenalin-perfusor-starten', 'Noradrenalin-Perfusor vorbereiten und starten', 'versorgen', 180, ['I', 'III', 'V'], ['medikamente', 'geraete'], {
    befugnis: IV_MEDIKAMENT, anordnungspflichtig: true, risikoBeiUeberschreitung: 'abbruch-durch-pa', setzt: ['na-laeuft'],
    // Laufrate kommt aus der Entscheidung (rechnen); bis dahin 0 ml/h
    modul: { perfusor: { id: 'na', wirkstoff: 'noradrenalin', konzentration: '5 mg/50 ml', mgProMl: 0.1, mlProH: 0 } },
  }),
  m('noradrenalin-steigern', 'Noradrenalin nach Zielvorgabe um 1 ml/h steigern', 'versorgen', 30, ['I', 'III'], ['medikamente', 'geraete'], {
    befugnis: IV_MEDIKAMENT, anordnungspflichtig: true, voraussetzung: { flag: 'na-laeuft' }, modul: { perfusor: { id: 'na', mlProHDelta: 1 } },
  }),
  m('noradrenalin-schenkel-anspuelen', 'Venenzugang über den Noradrenalin-Schenkel durchspülen', 'versorgen', 20, ['I'], ['medikamente', 'geraete'], {
    voraussetzung: { flag: 'na-laeuft' },
  }),
  m('arterie-assistieren', 'Arterielle Kanüle: Material richten, Ärztin assistieren, Messsystem anschließen', 'versorgen', 300, ['I', 'III'], ['geraete', 'team'], {
    befugnis: b('nur-aerztlich', 'mit-anleitung', 'mit-anleitung', 'selbst'), anordnungspflichtig: true,
    setzt: ['art-liegt'], modul: { arteriell: true, stoerungAn: ['art-nicht-genullt'] },
  }),
  m('paracetamol-iv', 'Paracetamol 1 g i. v. als Kurzinfusion', 'versorgen', 60, ['I', 'III'], ['medikamente'], {
    befugnis: IV_MEDIKAMENT, anordnungspflichtig: true,
    wirkung: [{ groesse: 'einfuhrMl', delta: 100, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' }],
  }),
  m('dk-pflege-beutel', 'Dauerkatheter: Urinbeutel tief, Urin beurteilen', 'versorgen', 30, ['I', 'V'], ['abcde']),

  // Melden & Übergabe
  m('uebergabe-rettungsdienst', 'Übergabe vom Rettungsdienst annehmen (strukturiert)', 'melden', 60, ['II', 'III'], ['team']),
  m('uebergabe-intensiv', 'Verlegung: strukturierte Übergabe an die Intensivstation', 'melden', 120, ['II', 'III'], ['team'], {
    voraussetzung: { anordnung: 'an-intensiv' }, setzt: ['auf-intensiv'],
  }),
];
