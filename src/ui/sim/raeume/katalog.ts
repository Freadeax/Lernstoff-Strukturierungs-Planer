// Raumfotos für alle Simulatoren (Praxis-, Fall- und Diagnostik-Simulator), aus Philipps
// Komplettpaket v2 (KI-generierte Szenen, ohne eingebrannte Menüs). Bilder liegen unter
// public/raeume/ (1280 × 720, WebP), werden erst beim Ansehen geladen und danach offline
// zwischengespeichert (runtimeCaching in vite.config.ts).
//
// Koordinaten sind relativ zum Bild (0…1, x nach rechts, y nach unten). Die Hotspots sind
// Vorschläge (Monitor-Hotspots sitzen unter dem Bildschirm, damit sie die Live-Werte nicht verdecken);
// jeder Simulator kann eigene übergeben. Vor Lerneinsatz fachlich prüfen
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
  | '19_krankenhaus_materialraum'
  | '20_paediatrie_kleinkind'
  | '20a_paediatrie_kleinkind_ohne_monitor'
  | '20m_paediatrie_kleinkind_monitor_verbunden'
  | '20n_paediatrie_kleinkind_nacht'
  | '20f_paediatrie_kleinkind_fieberkrampf'
  | '21_paediatrie_schulkind'
  | '21a_paediatrie_schulkind_ohne_monitor'
  | '21b_paediatrie_schulkind_spacer'
  | '21m_paediatrie_schulkind_monitor_verbunden'
  | '26_pflegeheim_zimmer_tag'
  | '26a_pflegeheim_zimmer_schlaganfall'
  | '26b_pflegeheim_zimmer_fruehstueck_unberuehrt'
  | '26h_pflegeheim_zimmer_hypoglykaemie'
  | '26p_pflegeheim_zimmer_pneumonie'
  | '27_station_zweibett_nacht'
  | '27a_station_zweibett_nacht_niedrigbett_sturzmatte'
  | '30_station_zimmer_frau'
  | '30a_station_zimmer_frau_ohne_monitor'
  | '30b_station_zimmer_frau_sepsis'
  | '30m_station_zimmer_frau_monitor_verbunden';

export type RaumBereich = 'Ambulante Pflege' | 'Pflegeheim' | 'Station' | 'Intensivstation' | 'Notaufnahme' | 'Krankenhaus' | 'Pädiatrie';

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
  /** Gleicher Raum mit angeschlossenem Sensor am Patienten (für „Überwachung läuft“, z. B. 20 → 20m). */
  verbunden?: RaumId;
  /** Gleicher Raum mit abgefallenem oder gelöstem Sensor (für „Signalausfall“); bisher nicht geliefert. */
  sensorAb?: RaumId;
  /** Gleicher Raum bei Nacht (gleicher Bildausschnitt). */
  nacht?: RaumId;
  hotspots: HotspotVorschlag[];
}

const B = 1280, H = 720;
const raum = (r: Omit<Raum, 'datei' | 'breite' | 'hoehe'>): Raum => ({ ...r, datei: `raeume/${r.id}.webp`, breite: B, hoehe: H });

// Pädiatrie aus der ersten Materiallieferung (11.11.2026, docs/MATERIAL-BEDARF.md, KI-generiert).
// Alle Varianten haben denselben Bildausschnitt, Hotspots gelten daher für die ganze Raumfamilie.
const KLEINKIND_MONITOR: Rechteck = { x: 0.762, y: 0.1052, width: 0.1764, height: 0.1722 };
const kleinkindHotspots = (mitWagen: boolean, clipAmKind = false): HotspotVorschlag[] => [
  { id: 'kind', label: 'Kind', x: 0.45, y: 0.4 },
  { id: 'mutter', label: 'Mutter', x: 0.19, y: 0.3 },
  { id: 'trinkbecher', label: 'Trinkbecher', x: 0.05, y: 0.56 },
  { id: 'thermometer', label: 'Fieberthermometer', x: 0.11, y: 0.65 },
  { id: 'rufanlage', label: 'Rufanlage', x: 0.55, y: 0.85 },
  ...(mitWagen ? [
    { id: 'monitor', label: 'Monitorwagen', x: 0.86, y: 0.55 },
    { id: 'manschette', label: 'Kindermanschette', x: 0.82, y: 0.45 },
    clipAmKind ? { id: 'fingerclip', label: 'Fingerclip am Kind', x: 0.45, y: 0.56 } : { id: 'fingerclip', label: 'Fingerclip', x: 0.89, y: 0.47 },
  ] : []),
];
const SCHULKIND_MONITOR: Rechteck = { x: 0.8002, y: 0.1488, width: 0.1663, height: 0.1637 };
const schulkindHotspots = (mitWagen: boolean, spacerAmKind = false, clipAmKind = false): HotspotVorschlag[] => [
  { id: 'kind', label: 'Kind', x: 0.42, y: 0.3 },
  { id: 'mutter', label: 'Mutter', x: 0.17, y: 0.25 },
  { id: 'sauerstoff', label: 'Sauerstoff-Wandanschluss mit Flowmeter', x: 0.6, y: 0.25 },
  { id: 'rufanlage', label: 'Rufanlage', x: 0.52, y: 0.87 },
  spacerAmKind ? { id: 'spacer', label: 'Dosieraerosol mit Spacer und Maske', x: 0.39, y: 0.42 } : { id: 'spacer', label: 'Dosieraerosol und Spacer', x: 0.24, y: 0.72 },
  ...(mitWagen ? [{ id: 'monitor', label: 'Monitorwagen', x: 0.88, y: 0.53 }] : []),
  ...(clipAmKind ? [{ id: 'fingerclip', label: 'Fingerclip am Kind', x: 0.43, y: 0.63 }] : []),
];

// Welle 2 (11.11.2026): Bewohnerzimmer tags, Zweibettzimmer nachts, internistisches Zimmer (KI-generiert).
const heimHotspots = (person: { label: string; x: number; y: number }): HotspotVorschlag[] => [
  { id: 'person', ...person },
  { id: 'rufanlage', label: 'Rufanlage', x: 0.13, y: 0.58 },
  { id: 'trinkglas', label: 'Trinkglas', x: 0.05, y: 0.53 },
  { id: 'kissen', label: 'Lagerungskissen', x: 0.47, y: 0.52 },
  { id: 'doku', label: 'Pflegedokumentation', x: 0.09, y: 0.78 },
  { id: 'tablett', label: 'Frühstückstablett', x: 0.38, y: 0.83 },
  { id: 'rollstuhl', label: 'Rollstuhl', x: 0.9, y: 0.48 },
];
const ZWEIBETT_MONITOR: Rechteck = { x: 0.7051, y: 0.2157, width: 0.0706, height: 0.0978 };
const zweibettHotspots = (niedrig: boolean): HotspotVorschlag[] => [
  { id: 'patient', label: 'Patient an der Bettkante', x: 0.4, y: 0.34 },
  { id: 'bettgitter', label: 'Bettgitter', x: 0.33, y: niedrig ? 0.56 : 0.46 },
  { id: 'rufanlage', label: 'Rufanlage', x: 0.31, y: niedrig ? 0.62 : 0.53 },
  ...(niedrig ? [{ id: 'sturzmatte', label: 'Sturzmatte', x: 0.49, y: 0.84 }] : []),
  { id: 'nachbar', label: 'Schlafender Nachbar', x: 0.9, y: 0.35 },
  { id: 'tuer', label: 'Tür zum Flur', x: 0.59, y: 0.31 },
  { id: 'monitor', label: 'Monitorwagen', x: 0.75, y: 0.46 },
];
const INNERE_MONITOR: Rechteck = { x: 0.7129, y: 0.237, width: 0.1447, height: 0.153 };
const innereHotspots = (person: string, wagen: boolean, sensor = false, sepsis = false): HotspotVorschlag[] => [
  { id: 'patient', label: person, x: 0.46, y: 0.46 },
  sepsis ? { id: 'bettdecke', label: 'Bettdecke', x: 0.45, y: 0.61 } : { id: 'zugang', label: 'Venenzugang', x: 0.47, y: 0.62 },
  { id: 'infusion', label: 'Infusionsbeutel', x: 0.23, y: 0.14 },
  { id: 'tropfkammer', label: 'Tropfkammer', x: 0.23, y: 0.24 },
  { id: 'rufanlage', label: 'Rufanlage', x: 0.51, y: 0.87 },
  { id: 'tuer', label: 'Zimmertür', x: 0.08, y: 0.4 },
  ...(wagen ? [{ id: 'monitor', label: 'Monitorwagen', x: 0.79, y: 0.48 }] : []),
  ...(sensor ? [{ id: 'fingersensor', label: 'Fingersensor', x: 0.43, y: 0.72 }] : []),
];

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
      { id: 'monitor', label: 'Monitor', x: 0.73, y: 0.34 },
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
      { id: 'monitor', label: 'Monitor', x: 0.39, y: 0.43 },
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
      { id: 'vitalzeichen', label: 'Vitalzeichengerät', x: 0.665, y: 0.45 },
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
      { id: 'monitor', label: 'Monitor', x: 0.09, y: 0.39 },
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
  raum({
    id: '20_paediatrie_kleinkind', bereich: 'Pädiatrie', titel: 'Kinderstation · Kleinkind mit Mutter',
    beschreibung: 'Kinderzimmer auf Station: ein Mädchen liegt mit Stofftier im Gitterbett, die Mutter sitzt daneben. Links Nachttisch mit Trinkbecher und Thermometer, rechts ein Monitorwagen mit Kindermanschette und Fingerclip auf der Ablage.',
    monitor: KLEINKIND_MONITOR, ohneMonitor: '20a_paediatrie_kleinkind_ohne_monitor', verbunden: '20m_paediatrie_kleinkind_monitor_verbunden', nacht: '20n_paediatrie_kleinkind_nacht',
    hotspots: kleinkindHotspots(true),
  }),
  raum({
    id: '20a_paediatrie_kleinkind_ohne_monitor', bereich: 'Pädiatrie', titel: 'Kinderstation · ohne Monitor',
    beschreibung: 'Dasselbe Kinderzimmer ohne Monitorwagen: das Mädchen im Gitterbett, die Mutter daneben, Trinkbecher und Thermometer auf dem Nachttisch.',
    mitMonitor: '20_paediatrie_kleinkind',
    hotspots: kleinkindHotspots(false),
  }),
  raum({
    id: '20m_paediatrie_kleinkind_monitor_verbunden', bereich: 'Pädiatrie', titel: 'Kinderstation · Monitor angeschlossen',
    beschreibung: 'Dasselbe Kinderzimmer, der Fingerclip sitzt am Kind und ist mit dem Monitorwagen verbunden.',
    monitor: KLEINKIND_MONITOR, ohneMonitor: '20a_paediatrie_kleinkind_ohne_monitor', nacht: '20n_paediatrie_kleinkind_nacht',
    hotspots: kleinkindHotspots(true, true),
  }),
  raum({
    id: '20n_paediatrie_kleinkind_nacht', bereich: 'Pädiatrie', titel: 'Kinderstation · Nacht',
    beschreibung: 'Dasselbe Kinderzimmer bei gedimmtem Nachtlicht: das Mädchen im Gitterbett, die Mutter daneben, rechts der Monitorwagen.',
    monitor: KLEINKIND_MONITOR,
    hotspots: kleinkindHotspots(true),
  }),
  raum({
    id: '20f_paediatrie_kleinkind_fieberkrampf', bereich: 'Pädiatrie', titel: 'Kinderstation · Kleinkind nach Fieberkrampf',
    beschreibung: 'Dasselbe Kinderzimmer mit einem jüngeren Mädchen, wach und erschöpft im Gitterbett. Die Mutter sitzt besorgt daneben, rechts der Monitorwagen.',
    monitor: KLEINKIND_MONITOR,
    hotspots: kleinkindHotspots(true),
  }),
  raum({
    id: '21_paediatrie_schulkind', bereich: 'Pädiatrie', titel: 'Kinderstation · Schulkind mit Atemnot',
    beschreibung: 'Kinderzimmer auf Station: ein Junge sitzt angestrengt aufrecht im Bett, die Mutter daneben. Vorn auf dem Tisch Dosieraerosol mit Spacer, an der Wand ein Sauerstoffanschluss mit Flowmeter, rechts ein Monitorwagen.',
    monitor: SCHULKIND_MONITOR, ohneMonitor: '21a_paediatrie_schulkind_ohne_monitor', verbunden: '21m_paediatrie_schulkind_monitor_verbunden',
    hotspots: schulkindHotspots(true),
  }),
  raum({
    id: '21a_paediatrie_schulkind_ohne_monitor', bereich: 'Pädiatrie', titel: 'Kinderstation · Schulkind ohne Monitor',
    beschreibung: 'Dasselbe Zimmer ohne Monitorwagen: der Junge sitzt im Bett, die Mutter daneben, Spacer auf dem Tisch.',
    mitMonitor: '21_paediatrie_schulkind',
    hotspots: schulkindHotspots(false),
  }),
  raum({
    id: '21b_paediatrie_schulkind_spacer', bereich: 'Pädiatrie', titel: 'Kinderstation · Inhalation mit Spacer',
    beschreibung: 'Dasselbe Zimmer: der Junge inhaliert mit Maske über den Spacer, die Mutter sitzt daneben.',
    monitor: SCHULKIND_MONITOR, ohneMonitor: '21a_paediatrie_schulkind_ohne_monitor',
    hotspots: schulkindHotspots(true, true),
  }),
  raum({
    id: '21m_paediatrie_schulkind_monitor_verbunden', bereich: 'Pädiatrie', titel: 'Kinderstation · Schulkind am Monitor',
    beschreibung: 'Dasselbe Zimmer, der Fingerclip sitzt am Jungen und ist mit dem Monitorwagen verbunden.',
    monitor: SCHULKIND_MONITOR, ohneMonitor: '21a_paediatrie_schulkind_ohne_monitor',
    hotspots: schulkindHotspots(true, false, true),
  }),
  raum({
    id: '26_pflegeheim_zimmer_tag', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · tagsüber',
    beschreibung: 'Bewohnerzimmer im Pflegeheim: eine alte Frau sitzt halb aufgerichtet im Pflegebett, davor ein Frühstückstablett. Links Nachttisch mit Trinkglas und Rufanlage, rechts Sessel und Rollstuhl.',
    hotspots: heimHotspots({ label: 'Bewohnerin', x: 0.29, y: 0.38 }),
  }),
  raum({
    id: '26a_pflegeheim_zimmer_schlaganfall', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · Bewohner im Sessel',
    beschreibung: 'Dasselbe Bewohnerzimmer: ein älterer Mann sitzt im Sessel, sein Mundwinkel hängt leicht auf einer Seite. Das Pflegebett links ist leer.',
    hotspots: heimHotspots({ label: 'Bewohner', x: 0.7, y: 0.34 }),
  }),
  raum({
    id: '26b_pflegeheim_zimmer_fruehstueck_unberuehrt', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · Frühstück unberührt',
    beschreibung: 'Dasselbe Bewohnerzimmer: die Bewohnerin im Pflegebett wendet den Blick ab, auf dem Tablett stehen eine volle Schale und ein ganzes Brötchen.',
    hotspots: heimHotspots({ label: 'Bewohnerin', x: 0.29, y: 0.38 }),
  }),
  raum({
    id: '26h_pflegeheim_zimmer_hypoglykaemie', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · Bewohnerin angespannt',
    beschreibung: 'Dasselbe Bewohnerzimmer mit einer anderen Bewohnerin: sie sitzt wach und angespannt im Pflegebett, das Frühstück steht davor.',
    hotspots: heimHotspots({ label: 'Bewohnerin', x: 0.29, y: 0.38 }),
  }),
  raum({
    id: '26p_pflegeheim_zimmer_pneumonie', bereich: 'Pflegeheim', titel: 'Bewohnerzimmer · Bewohner im Bett',
    beschreibung: 'Dasselbe Bewohnerzimmer: ein alter Mann liegt halb aufgerichtet im Pflegebett, das Frühstückstablett steht davor.',
    hotspots: heimHotspots({ label: 'Bewohner', x: 0.29, y: 0.38 }),
  }),
  raum({
    id: '27_station_zweibett_nacht', bereich: 'Station', titel: 'Zweibettzimmer · Nacht',
    beschreibung: 'Zweibettzimmer bei Nacht: ein alter Mann sitzt an der Bettkante und beugt sich vor, das Bettgitter ist halb oben. Rechts schläft der Bettnachbar, neben der offenen Tür steht ein ausgeschalteter Monitorwagen.',
    monitor: ZWEIBETT_MONITOR,
    hotspots: zweibettHotspots(false),
  }),
  raum({
    id: '27a_station_zweibett_nacht_niedrigbett_sturzmatte', bereich: 'Station', titel: 'Zweibettzimmer · Niedrigbett und Sturzmatte',
    beschreibung: 'Dasselbe Zweibettzimmer: das Bett ist ganz abgesenkt, davor liegt eine Sturzmatte. Der Mann sitzt an der Bettkante, der Nachbar schläft.',
    monitor: ZWEIBETT_MONITOR,
    hotspots: zweibettHotspots(true),
  }),
  raum({
    id: '30_station_zimmer_frau', bereich: 'Station', titel: 'Innere Medizin · Patientin mit Infusion',
    beschreibung: 'Internistisches Einzelzimmer: eine junge Frau sitzt halb aufgerichtet im Bett und reibt sich den Arm. Links läuft eine Infusion, rechts steht ein Monitorwagen mit dunklem Bildschirm.',
    monitor: INNERE_MONITOR, ohneMonitor: '30a_station_zimmer_frau_ohne_monitor', verbunden: '30m_station_zimmer_frau_monitor_verbunden',
    hotspots: innereHotspots('Patientin', true),
  }),
  raum({
    id: '30a_station_zimmer_frau_ohne_monitor', bereich: 'Station', titel: 'Innere Medizin · ohne Monitor',
    beschreibung: 'Dasselbe Zimmer ohne Monitorwagen: die junge Frau im Bett reibt sich den Arm, links der Infusionsständer.',
    mitMonitor: '30_station_zimmer_frau',
    hotspots: innereHotspots('Patientin', false),
  }),
  raum({
    id: '30m_station_zimmer_frau_monitor_verbunden', bereich: 'Station', titel: 'Innere Medizin · Fingersensor angeschlossen',
    beschreibung: 'Dasselbe Zimmer: die junge Frau trägt einen Fingersensor, das Kabel führt zum Monitorwagen.',
    monitor: INNERE_MONITOR, ohneMonitor: '30a_station_zimmer_frau_ohne_monitor',
    hotspots: innereHotspots('Patientin', true, true),
  }),
  raum({
    id: '30b_station_zimmer_frau_sepsis', bereich: 'Station', titel: 'Innere Medizin · ältere Patientin, verwirrt',
    beschreibung: 'Dasselbe Zimmer mit einer alten Frau im Bett, die an der Bettdecke nestelt und unsicher blickt. Infusionsständer und Monitorwagen stehen an ihren Plätzen.',
    monitor: INNERE_MONITOR,
    hotspots: innereHotspots('Patientin', true, false, true),
  }),
];

export const RAEUME: Record<RaumId, Raum> = Object.fromEntries(liste.map((r) => [r.id, r])) as Record<RaumId, Raum>;
export const RAUM_IDS = liste.map((r) => r.id);

/** Bild-URL relativ zur App-Basis (funktioniert auch unter einem Unterpfad). */
export const raumUrl = (id: RaumId) => `${import.meta.env.BASE_URL}${RAEUME[id].datei}`;

/** Monitorzustände wie in Philipps Anleitung. */
export type MonitorZustand = 'abwesend' | 'standby' | 'laeuft' | 'signalausfall';

/** Zustandsregeln für Bildvarianten (docs/RAEUME.md, Abschnitt Zustandsregeln). */
export interface RaumZustand {
  /** Gerät aus/an, Sensor angelegt oder abgefallen */
  monitor?: MonitorZustand;
  /** Tag/Nacht: true wählt die Nachtvariante, falls geliefert */
  nacht?: boolean;
}

/**
 * Welches Bild zeigt den Raum im gewünschten Zustand?
 * 1. Nacht: Nachtvariante desselben Ausschnitts (z. B. 20 → 20n), sonst bleibt das Tagbild (Simulator legt Filter darüber).
 * 2. Gerät abwesend: Variante ohne Monitor (12 → 12a).
 * 3. Gerät an/Standby: Variante mit Monitor (12a → 12).
 * 4. Überwachung läuft: Sensor am Patienten, falls geliefert (20 → 20m).
 * 5. Signalausfall: Sensor abgefallen, falls geliefert; sonst wie „läuft“ (der Monitor zeigt den Ausfall).
 * Patientenzustand und Maßnahmen wählen die Simulatoren über ihre Zuordnung (z. B. Praxis `waehrend`: 21 → 21b).
 */
export function raumFuerZustand(id: RaumId, zustand?: MonitorZustand | RaumZustand): RaumId {
  const z: RaumZustand = typeof zustand === 'object' ? zustand : { monitor: zustand };
  const basis = z.nacht ? RAEUME[id].nacht ?? id : id;
  const r = RAEUME[basis];
  if (!z.monitor) return basis;
  if (z.monitor === 'abwesend') return r.ohneMonitor ?? basis;
  const mit = r.mitMonitor ?? basis;
  if (z.monitor === 'laeuft') return RAEUME[mit].verbunden ?? mit;
  if (z.monitor === 'signalausfall') return RAEUME[mit].sensorAb ?? RAEUME[mit].verbunden ?? mit;
  return mit;
}

/** Alle Bilder, die die Zustandsregeln von einem Raum aus erreichen (inklusive des Raums selbst). */
export function raumVarianten(id: RaumId, zustaende: readonly MonitorZustand[] = ['abwesend', 'standby', 'laeuft', 'signalausfall'], nacht = true): RaumId[] {
  const set = new Set<RaumId>([id]);
  for (const n of nacht ? [false, true] : [false]) {
    set.add(raumFuerZustand(id, { nacht: n }));
    for (const m of zustaende) set.add(raumFuerZustand(id, { monitor: m, nacht: n }));
  }
  return [...set];
}
