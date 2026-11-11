// Raumfotos für alle Simulatoren (Praxis-, Fall- und Diagnostik-Simulator), aus Philipps
// Komplettpaket v2 (KI-generierte Szenen, ohne eingebrannte Menüs). Bilder liegen unter
// public/raeume/ (1280 × 720, WebP), werden erst beim Ansehen geladen und danach offline
// zwischengespeichert (runtimeCaching in vite.config.ts).
//
// Koordinaten sind relativ zum Bild (0…1, x nach rechts, y nach unten). Die Hotspots sind
// Vorschläge; jeder Simulator kann eigene übergeben. Vor Lerneinsatz fachlich prüfen
// (Gerätedetails, Kabelführung, Anatomie).

export type RaumId =
  | '07_ambulant_wohnzimmer_kompression'
  | '08_ambulant_pflegebad'
  | '09_ambulant_kueche_diabetes'
  | '10_pflegeheim_nacht'
  | '11_pflegeheim_speiseraum'
  | '12_station_kardiologie_monitoring'
  | '12a_station_kardiologie_ohne_monitor'
  | '13_station_postop'
  | '14_station_isolation'
  | '15_intensiv_beatmung'
  | '16_notaufnahme_triage'
  | '17_notaufnahme_untersuchung'
  | '18_notaufnahme_schockraum_nacht'
  | '19_krankenhaus_materialraum';

export type RaumBereich = 'Ambulante Pflege' | 'Pflegeheim' | 'Station' | 'Intensivstation' | 'Notaufnahme' | 'Krankenhaus';

/** Rechteck relativ zum Bild (0…1). */
export interface Rechteck { x: number; y: number; width: number; height: number }

export interface HotspotVorschlag { id: string; label: string; x: number; y: number }

export interface Raum {
  id: RaumId;
  bereich: RaumBereich;
  titel: string;
  /** Kurzbeschreibung für Screenreader (alt-Text). */
  beschreibung: string;
  /** Pfad relativ zur App-Basis. */
  datei: string;
  breite: number;
  hoehe: number;
  /** Bildschirmfläche des Patientenmonitors, auf die Live-Werte gelegt werden. */
  monitor?: Rechteck;
  /** Gleicher Raum ohne Monitor und Sensoren (für „Gerät abwesend“). */
  ohneMonitor?: RaumId;
  /** Gleicher Raum mit Monitor (Gegenstück zu ohneMonitor). */
  mitMonitor?: RaumId;
  hotspots: HotspotVorschlag[];
}

const B = 1280, H = 720;
const raum = (r: Omit<Raum, 'datei' | 'breite' | 'hoehe'>): Raum => ({ ...r, datei: `raeume/${r.id}.webp`, breite: B, hoehe: H });

const liste: Raum[] = [
  raum({
    id: '07_ambulant_wohnzimmer_kompression', bereich: 'Ambulante Pflege', titel: 'Wohnzimmer · Kompressionsversorgung',
    beschreibung: 'Wohnzimmer: eine ältere Klientin sitzt im Sessel, ein Bein hochgelagert mit Kompressionsstrumpf. Eine Pflegekraft hält eine Anziehhilfe, daneben die Pflegetasche.',
    hotspots: [
      { id: 'klientin', label: 'Klientin', x: 0.24, y: 0.3 },
      { id: 'bein', label: 'Bein und Strumpf', x: 0.4, y: 0.76 },
      { id: 'anziehhilfe', label: 'Anziehhilfe', x: 0.61, y: 0.32 },
      { id: 'tasche', label: 'Pflegetasche', x: 0.95, y: 0.8 },
    ],
  }),
  raum({
    id: '08_ambulant_pflegebad', bereich: 'Ambulante Pflege', titel: 'Pflegebad · Körperpflege und Hilfsmittel',
    beschreibung: 'Badezimmer mit bodengleicher Dusche, Duschstuhl, Haltegriffen und Waschbecken. Eine ältere Klientin sitzt am Fenster, auf dem Hocker steht die Pflegetasche.',
    hotspots: [
      { id: 'klientin', label: 'Klientin', x: 0.86, y: 0.5 },
      { id: 'duschstuhl', label: 'Duschstuhl', x: 0.56, y: 0.6 },
      { id: 'haltegriff', label: 'Haltegriff', x: 0.62, y: 0.42 },
      { id: 'waschplatz', label: 'Waschplatz', x: 0.22, y: 0.45 },
      { id: 'tasche', label: 'Pflegetasche', x: 0.24, y: 0.83 },
    ],
  }),
  raum({
    id: '09_ambulant_kueche_diabetes', bereich: 'Ambulante Pflege', titel: 'Küche · Diabetesfall',
    beschreibung: 'Küchentisch: ein älterer Klient im Gespräch mit einer Pflegekraft, auf dem Tisch Blutzuckermessgerät, Insulinpen, Abwurfbehälter und ein Tablet zur Dokumentation.',
    hotspots: [
      { id: 'klient', label: 'Klient', x: 0.83, y: 0.38 },
      { id: 'messgeraet', label: 'Blutzuckermessgerät', x: 0.69, y: 0.76 },
      { id: 'pen', label: 'Insulinpen', x: 0.6, y: 0.78 },
      { id: 'dokumentation', label: 'Dokumentation', x: 0.47, y: 0.75 },
    ],
  }),
  raum({
    id: '10_pflegeheim_nacht', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · Nachtdienst',
    beschreibung: 'Bewohnerzimmer bei Nacht mit gedämpftem Licht: ein älterer Bewohner liegt im Bett, daneben Nachttisch mit Lampe, ein Rollator und die offene Badtür.',
    hotspots: [
      { id: 'bewohner', label: 'Bewohner', x: 0.38, y: 0.42 },
      { id: 'rufanlage', label: 'Rufanlage am Nachttisch', x: 0.27, y: 0.5 },
      { id: 'rollator', label: 'Rollator', x: 0.72, y: 0.62 },
      { id: 'bad', label: 'Bad', x: 0.86, y: 0.45 },
    ],
  }),
  raum({
    id: '11_pflegeheim_speiseraum', bereich: 'Pflegeheim', titel: 'Speiseraum · Unterstützung beim Essen',
    beschreibung: 'Speiseraum im Pflegeheim: eine Bewohnerin im Rollstuhl am Tisch mit Teller und Trinkbecher, eine Pflegekraft sitzt daneben, im Hintergrund weitere Bewohner.',
    hotspots: [
      { id: 'bewohnerin', label: 'Bewohnerin', x: 0.13, y: 0.5 },
      { id: 'trinkbecher', label: 'Trinkbecher', x: 0.31, y: 0.58 },
      { id: 'teller', label: 'Teller und Esshilfe', x: 0.24, y: 0.66 },
      { id: 'pflegekraft', label: 'Pflegekraft', x: 0.48, y: 0.42 },
    ],
  }),
  raum({
    id: '12_station_kardiologie_monitoring', bereich: 'Station', titel: 'Kardiologie · Monitoring am Bett',
    beschreibung: 'Patientenzimmer der Kardiologie: ein Patient im Bett mit Blutdruckmanschette am Oberarm, EKG-Elektroden und Fingersensor. Rechts ein Monitor auf einem Gerätewagen.',
    monitor: { x: 0.628, y: 0.0965, width: 0.201, height: 0.2 },
    ohneMonitor: '12a_station_kardiologie_ohne_monitor',
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.31, y: 0.36 },
      { id: 'monitor', label: 'Monitor', x: 0.73, y: 0.2 },
      { id: 'manschette', label: 'Blutdruckmanschette', x: 0.25, y: 0.62 },
      { id: 'fingersensor', label: 'Fingersensor', x: 0.56, y: 0.68 },
    ],
  }),
  raum({
    id: '12a_station_kardiologie_ohne_monitor', bereich: 'Station', titel: 'Kardiologie · vor dem Anschließen',
    beschreibung: 'Dasselbe Patientenzimmer ohne Monitor und ohne angeschlossene Sensoren: ein Patient liegt im Bett.',
    mitMonitor: '12_station_kardiologie_monitoring',
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.31, y: 0.36 },
      { id: 'nachttisch', label: 'Nachttisch', x: 0.05, y: 0.62 },
    ],
  }),
  raum({
    id: '13_station_postop', bereich: 'Station', titel: 'Postoperatives Zimmer · Beobachtung und Mobilisation',
    beschreibung: 'Patientenzimmer nach einer Operation: ein Patient im Bett, am Infusionsständer eine Pumpe, am Bett ein Drainage- bzw. Urinbeutel, links ein Rollstuhl.',
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.77, y: 0.38 },
      { id: 'infusion', label: 'Infusion und Pumpe', x: 0.7, y: 0.3 },
      { id: 'drainage', label: 'Drainage', x: 0.695, y: 0.78 },
      { id: 'rufanlage', label: 'Rufanlage', x: 0.925, y: 0.51 },
      { id: 'rollstuhl', label: 'Rollstuhl', x: 0.17, y: 0.5 },
    ],
  }),
  raum({
    id: '14_station_isolation', bereich: 'Station', titel: 'Isolierzimmer · Patient und Vorraum',
    beschreibung: 'Isolierzimmer: ein älterer Patient im Bett, daneben Monitor und Infusionspumpe, an der Wand Spender für Händedesinfektion, rechts der Vorraum mit Schutzkitteln und Handschuhen.',
    monitor: { x: 0.367, y: 0.297, width: 0.054, height: 0.084 },
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.2, y: 0.46 },
      { id: 'monitor', label: 'Monitor', x: 0.39, y: 0.34 },
      { id: 'haendehygiene', label: 'Händedesinfektion', x: 0.605, y: 0.38 },
      { id: 'schutzkleidung', label: 'Schutzkleidung im Vorraum', x: 0.9, y: 0.36 },
      { id: 'abwurf', label: 'Abwurf', x: 0.65, y: 0.68 },
    ],
  }),
  raum({
    id: '15_intensiv_beatmung', bereich: 'Intensivstation', titel: 'Beatmungsplatz · Monitoring und Pumpen',
    beschreibung: 'Intensivbettplatz: ein beatmeter Patient im Bett, daneben Beatmungsgerät, ein großer Monitor und Spritzenpumpen am Turm.',
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.5, y: 0.55 },
      { id: 'beatmung', label: 'Beatmungsgerät', x: 0.73, y: 0.38 },
      { id: 'monitor', label: 'Monitor', x: 0.89, y: 0.3 },
      { id: 'pumpen', label: 'Spritzenpumpen', x: 0.24, y: 0.3 },
    ],
  }),
  raum({
    id: '16_notaufnahme_triage', bereich: 'Notaufnahme', titel: 'Triage · Ersteinschätzung',
    beschreibung: 'Triage-Platz der Notaufnahme: eine Pflegekraft am Schreibtisch mit Computer im Gespräch mit einem Patienten. Daneben ein Untersuchungsstuhl und ein mobiles Vitalzeichengerät.',
    monitor: { x: 0.639, y: 0.31, width: 0.048, height: 0.066 },
    hotspots: [
      { id: 'patient', label: 'Patient im Gespräch', x: 0.43, y: 0.38 },
      { id: 'arbeitsplatz', label: 'Arbeitsplatz und Ersteinschätzung', x: 0.06, y: 0.45 },
      { id: 'vitalzeichen', label: 'Vitalzeichengerät', x: 0.665, y: 0.4 },
      { id: 'liege', label: 'Untersuchungsstuhl', x: 0.57, y: 0.44 },
    ],
  }),
  raum({
    id: '17_notaufnahme_untersuchung', bereich: 'Notaufnahme', titel: 'Behandlungsplatz · Untersuchung',
    beschreibung: 'Behandlungsplatz der Notaufnahme: ein junger Patient sitzt auf der Trage, daneben ein Monitor auf dem Rollwagen, ein Vorhang, ein Waschbecken und ein Materialwagen.',
    monitor: { x: 0.435, y: 0.22, width: 0.066, height: 0.08 },
    hotspots: [
      { id: 'patient', label: 'Patient', x: 0.29, y: 0.36 },
      { id: 'monitor', label: 'Monitor', x: 0.47, y: 0.33 },
      { id: 'vorhang', label: 'Vorhang', x: 0.57, y: 0.16 },
      { id: 'material', label: 'Materialwagen', x: 0.87, y: 0.62 },
      { id: 'waschbecken', label: 'Händehygiene', x: 0.73, y: 0.37 },
    ],
  }),
  raum({
    id: '18_notaufnahme_schockraum_nacht', bereich: 'Notaufnahme', titel: 'Schockraum · Ankunft bei Nacht',
    beschreibung: 'Schockraum bei Nacht: ein Patient liegt zugedeckt auf der Trage des Rettungsdienstes. Ein Notfallsanitäter übergibt an zwei Pflegekräfte. Links Monitor und Defibrillator, rechts der Notfallwagen, im Hintergrund der Rettungswagen.',
    monitor: { x: 0.045, y: 0.17, width: 0.096, height: 0.17 },
    hotspots: [
      { id: 'patient', label: 'Patient auf der Trage', x: 0.43, y: 0.47 },
      { id: 'rettungsdienst', label: 'Übergabe Rettungsdienst', x: 0.62, y: 0.34 },
      { id: 'monitor', label: 'Monitor', x: 0.09, y: 0.25 },
      { id: 'defibrillator', label: 'Defibrillator', x: 0.21, y: 0.39 },
      { id: 'notfallwagen', label: 'Notfallwagen', x: 0.89, y: 0.6 },
    ],
  }),
  raum({
    id: '19_krankenhaus_materialraum', bereich: 'Krankenhaus', titel: 'Materialraum',
    beschreibung: 'Materialraum mit Regalen voller Verbandsmaterial und Spritzen, Handschuhspender an der Wand, ein Edelstahlwagen in der Mitte und ein Arbeitsplatz mit Computer.',
    hotspots: [
      { id: 'regal', label: 'Regal', x: 0.14, y: 0.42 },
      { id: 'handschuhe', label: 'Handschuhe', x: 0.42, y: 0.27 },
      { id: 'wagen', label: 'Wagen', x: 0.55, y: 0.6 },
      { id: 'arbeitsplatz', label: 'Arbeitsplatz', x: 0.78, y: 0.37 },
    ],
  }),
];

export const RAEUME: Record<RaumId, Raum> = Object.fromEntries(liste.map((r) => [r.id, r])) as Record<RaumId, Raum>;
export const RAUM_IDS = liste.map((r) => r.id);

/** Bild-URL relativ zur App-Basis (funktioniert auch unter einem Unterpfad). */
export const raumUrl = (id: RaumId) => `${import.meta.env.BASE_URL}${RAEUME[id].datei}`;

/** Monitorzustände wie in Philipps Anleitung. */
export type MonitorZustand = 'abwesend' | 'standby' | 'laeuft' | 'signalausfall';

/** Welches Bild zeigt den Raum im gewünschten Monitorzustand? (abwesend → Variante ohne Monitor, falls vorhanden) */
export function raumFuerZustand(id: RaumId, zustand?: MonitorZustand): RaumId {
  const r = RAEUME[id];
  if (zustand === 'abwesend') return r.ohneMonitor ?? id;
  if (zustand && r.mitMonitor) return r.mitMonitor;
  return id;
}
