// Praxissimulator neu – Kern: Datenvertrag (Fallschema v2), Stand 18.11.2026
// Gilt für Spur A (Pflege, Generalistik) und Spur B (Akut, Notfall, Intensiv).
// Grundsatz: Ein Fall ist reine Daten. Der Kern (rein, deterministisch) rechnet
// Zustand = Fall + Event-Log. Darstellung und Auswertung lesen nur Kern-Ergebnisse.
// Konzept: /mnt/project-files/praxissimulator-neu/KONZEPT.md (Projektordner), Abschnitte 3–8.

/* ───────────────────────── Grundbegriffe ───────────────────────── */

export type Spur = 'A' | 'B';
export type Setting =
  | 'krankenhaus' | 'langzeit' | 'ambulant' | 'paediatrie' | 'psychiatrie'        // Spur A
  | 'notaufnahme' | 'schockraum' | 'intensiv' | 'imc' | 'aufwachraum';           // Spur B
export type Altersgruppe = 'saeugling' | 'kleinkind' | 'schulkind' | 'jugendlich' | 'erwachsen' | 'hochbetagt';

export type Ausbildungsdrittel = 1 | 2 | 3;
/** 'pflegefachperson' nur in Spur B (E11). */
export type Rolle = Ausbildungsdrittel | 'pflegefachperson';
export type Stufe = 1 | 2 | 3;                         // geführt · frei mit PA · Prüfung
/** 'gesperrt' (P3): in diesem Drittel nicht einmal mit Anleitung, aber keine ärztliche Aufgabe (KONZEPT 6.1). */
export type BefugnisLevel = 'selbst' | 'mit-anleitung' | 'nach-anordnung' | 'nur-aerztlich' | 'gesperrt';
export type Reiter = 'gespraech' | 'beobachten' | 'akut' | 'messen' | 'versorgen' | 'melden';

/** PflAPrV Anlage 2, Kompetenzbereiche I–V */
export type KB = 'I' | 'II' | 'III' | 'IV' | 'V';
/** Zusätzliche klinische Bereiche in Spur B */
export type KlinischerBereich = 'abcde' | 'geraete' | 'medikamente' | 'team' | 'zeit';

/** Sekunden Spielzeit seit Fallbeginn */
export type Sek = number;

export interface Quelle {
  id: string;
  titel: string;                 // z. B. „DNQP Expertenstandard Sturzprophylaxe, 2. Aktualisierung 2022“
  fundstelle?: string;           // Seite, Kapitel, Empfehlung
  url?: string;
}

/* ─────────────────────── Physiologie & Zustand ─────────────────────── */

/** Gekoppelte Grundgrößen (normiert 0..1 bzw. physikalisch, je Größe dokumentiert im Kern). */
export interface Grundgroessen {
  // Kreislauf
  volumen: number;               // 1 = normal, 0.7 = deutlicher Mangel
  pumpleistung: number;          // 1 = normal
  gefaesstonus: number;          // 1 = normal, < 1 = Vasodilatation (Sepsis)
  // Atmung
  atemantrieb: number;           // 1 = normal, < 1 = gedämpft (Opioid)
  atemarbeit: number;            // 1 = normal, > 1 = erschwert
  gasaustausch: number;          // 1 = normal, < 1 = gestört
  // Stoffwechsel
  blutzucker: number;            // mg/dl
  temperatur: number;            // °C
  hydratation: number;           // 1 = normal, < 1 = Exsikkose
  // Kognition & Befinden
  vigilanz: number;              // 1 = wach, 0 = bewusstlos (→ AVPU/GCS)
  orientierung: number;          // 1 = voll orientiert
  delir: number;                 // 0 = kein, 1 = ausgeprägt (→ Nu-DESC/CAM)
  unruhe: number;                // 0..1
  schmerz: number;               // NRS 0..10
  angst: number;                 // 0..1
  uebelkeit: number;             // 0..1
  // Zusätze Paket P1 (Physiologie)
  sauerstoff: number;            // O₂-Zufuhr in l/min (0 = Raumluft); Maßnahme O₂-Gabe als Wirkkurve delta
  krampf: number;                // 0 = kein Anfall, > 0 = Krampfaktivität, < 0 = nach dem Anfall (postiktal, kehrt zu 0 zurück)
  // Spur B (optional, nur mit Modellmodulen; P1b)
  sedierung?: number;            // 0..1 Sedativa-Wirkung (Perfusor), → RASS, Vigilanz, Atemantrieb
  laktat?: number;               // mmol/l, Bestand (steigt bei Minderperfusion, sinkt langsam)
  kalium?: number;               // mmol/l
  einfuhrMl?: number;            // Bilanz: kumulierte Einfuhr seit Fallbeginn (Infusion = Wirkkurve)
  ausfuhrMl?: number;            // Bilanz: kumulierte Urinmenge seit Fallbeginn
  // G1 Wirkstoffe: vom Modell geschrieben (angewandter Arzneimittelanteil), in Fällen nicht setzen
  wirkSchmerz?: number;          // NRS-Anteil, um den Analgetika den Schmerz gerade senken (≤ 0)
  wirkAngst?: number;            // Anteil, um den Anxiolytika die Angst gerade senken (≤ 0)
  wirkTonus?: number;            // Gefäßtonus-Anteil durch Arzneimittel (z. B. Metamizol i. v. < 0)
  wirkHf?: number;               // Pulsanstieg relativ durch Arzneimittel (z. B. Salbutamol)
  wirkDiurese?: number;          // zusätzliche Diurese durch Arzneimittel ml/h (Furosemid …)
  // G2 Ausscheidung (optional): Blasenfüllung in ml; Fall setzt sie, ein Harnverhalt legt sie an
  blaseMl?: number;
  // G3 Haut (optional): Druckbelastung mmHg·h über Kapillardruck an der Auflagestelle, höchste Dekubitus-Kategorie 0–4
  druckLast?: number;
  dekubitusKat?: number;
  // G5 Neuro (optional, vom Modell geführt): Defizit 0..1, Hirndruck 0..1, betroffene Körperseite (1 = links, −1 = rechts),
  // Minuten seit Symptombeginn; wirkOpioid = wirksamer Opioidanteil (für enge Pupillen), vom Modell geschrieben
  neuroDefizit?: number;
  hirndruck?: number;
  neuroSeite?: number;
  seitBeginnMin?: number;
  wirkOpioid?: number;
  // G6 Schlucken (optional): Dysphagie 0..1 (vom Modell), aspirierte Menge (kumuliert), akute Aspirationsfolge,
  // Folge-Pneumonie 0..1.2; kostAngepasst 0..1 setzt die Maßnahme „kost-anpassen“ (Wirkkurve)
  dysphagie?: number;
  aspiration?: number;
  aspirationAkut?: number;
  aspirationsPneumonie?: number;
  kostAngepasst?: number;
  // G7 Schlaf (optional): Schlafdefizit 0..1 (Fall setzt es zum Aktivieren), nachts wach 0/1 (vom Modell),
  // schlafSchutz 0..1 setzt „reizarm-gestalten“ (Wirkkurve)
  schlafdefizit?: number;
  nachtWach?: number;
  schlafSchutz?: number;
  // G8 Labor (vom Modell geführt, Startwert = Zielwert; Fälle dürfen Ausgangswerte setzen): Entzündung 0..1,2,
  // Sepsisgrad, CRP mg/l, Leukozyten G/l, PCT ng/ml, Kreatinin mg/dl, Harnstoff mg/dl, Erythrozytenmasse relativ (Blutung)
  entzuendung?: number;
  sepsisGrad?: number;
  crp?: number;
  leuko?: number;
  pct?: number;
  krea?: number;
  harnstoff?: number;
  hbMasse?: number;
  // G9 Wunde (optional, nur mit Treiber wunde/wundblutung): Infektgrad 0..1, Tag nach OP, Blut im Verband ml,
  // wirksame Nachblutung ml/min (vom Modell), Druckverband 0..1 (Wirkkurve aus „blutung-stillen“)
  wundInfekt?: number;
  wundTag?: number;
  verbandBlutMl?: number;
  wundBlutungMlMin?: number;
  blutstillung?: number;
  // Alkoholentzug (vom Modell geführt, nur mit Treiber alkoholentzug): wirksamer Entzug 0..1,2 (nach Benzodiazepin),
  // Stunden seit letztem Konsum, Halluzinationen 0..1, Krampfbereitschaft 0..1 (1 = Anfall gehabt), Wernicke-Verwirrtheit 0..1, Thiamin gegeben 0/1
  entzug?: number;
  entzugStd?: number;
  halluzination?: number;
  entzugKrampf?: number;
  wernicke?: number;
  thiamin?: number;
  // Atemerschöpfung (nur mit Treiber atemerschoepfung oder Startwert): 0..1
  erschoepfung?: number;
}

/** Vom Kern abgeleitet, Ziele für den Monitor (Logik-Takt 5 s, Render interpoliert). */
export interface Anzeige {
  hf: number; rrSys: number; rrDia: number; af: number; spo2: number; temp: number;
  bz?: number; etco2?: number;
  rhythmus: Rhythmus;
  avpu: 'A' | 'V' | 'P' | 'U';
  gcs?: number;
  /** Mitteldruck mmHg (P1) */
  map?: number;
  /** Rekapillarisierungszeit in Sekunden (P1) */
  rekapSek?: number;
  // Spur B (P1b): nur befüllt, wenn das passende Modul an ist
  artSys?: number; artDia?: number;
  /** Arterielle Kurve gedämpft (Luft, Gerinnsel, abgeknickt): Systole zu niedrig, Diastole zu hoch */
  artGedaempft?: boolean;
  rass?: number;                 // −5 … +4
  /** Stundenurin ml/h (Spur A immer aus dem Modell; Spur B mit Bilanzmodul über den Dauerkatheter) */
  urinMlH?: number;
  /** Urinfarbe 1 (hell) bis 8 (dunkel) nach Urinfarbtafel (G2) */
  urinFarbe?: number;
  /** Blasenfüllung ml, nur wenn das Modell sie führt (G2; Ultraschall-Blasenscan) */
  blaseMl?: number;
  /** Dekubitus-Kategorie 0–4 an der Auflagestelle, nur wenn das Modell Haut führt (G3) */
  dekubitusKat?: number;
  // G5 Neuro: Pupillen (mm, Lichtreaktion), GCS-Teilwerte; Schlaganfallzeichen nur mit Schlaganfall
  pupilleRechtsMm?: number; pupilleLinksMm?: number;
  pupilleRechtsLicht?: 'prompt' | 'träge' | 'lichtstarr'; pupilleLinksLicht?: 'prompt' | 'träge' | 'lichtstarr';
  gcsAugen?: number; gcsVerbal?: number; gcsMotorik?: number;
  /** FAST positiv 0–3 (Gesicht, Arm, Sprache) */
  fast?: number;
  /** NIHSS grob geschätzt 0–42 */
  nihss?: number;
  /** Minuten seit Symptombeginn, verbleibendes Lysefenster (4,5 h) in Minuten */
  seitBeginnMin?: number; lyseFensterMin?: number;
  /** G6: Gugging Swallowing Screen 0–20 (20 unauffällig, ≤ 14 Aspirationsgefahr), nur wenn das Modell Schlucken führt */
  guss?: number;
  /** G7: Schlafzustand, nur wenn der Fall Schlaf führt */
  schlaf?: 'schläft' | 'wach' | 'wach, unruhig';
  /** Alkoholentzug: Zittern, Schwitzen, Halluzinationen, Stunden seit letztem Konsum, CIWA-Ar 0–67 (G4) */
  tremor?: 'kein' | 'leicht' | 'deutlich' | 'grob';
  schwitzen?: boolean;
  halluzinationen?: boolean;
  entzugStd?: number;
  ciwa?: number;
  /** Atemerschöpfung (nur wenn das Modell sie führt): keine / droht / dekompensiert; Apnoen bei Säuglingen und Kleinkindern */
  atemerschoepfung?: 'keine' | 'droht' | 'dekompensiert';
  apnoen?: boolean;
  /** G9 Wunde: Phase, Sekret, Infektzeichen 0–5 (Rötung, Überwärmung, Schwellung, Schmerz, Eiter), Verband, Blut im Verband ml */
  wundPhase?: 'exsudativ' | 'proliferativ' | 'reparativ';
  wundsekret?: 'keins' | 'serös' | 'blutig' | 'eitrig';
  wundInfektZeichen?: number;
  verband?: 'trocken' | 'leicht durchgeblutet' | 'durchgeblutet' | 'durchnässt';
  verbandBlutMl?: number;
  // G8 Labor: wahrer Modellwert jetzt (für Bedingungen; Befunde nach Laufzeit über laborBefunde() im Kern)
  hb?: number; leuko?: number; thrombo?: number; crp?: number; pct?: number; natrium?: number;
  krea?: number; egfr?: number; harnstoff?: number; inr?: number; aptt?: number;
  // G4 Einschätzungen aus dem Modell (Kern ergänzt sie in anzeige(z); vereinfacht, physiologie/einschaetzungen.ts)
  /** Puls / RR systolisch */
  schockindex?: number;
  /** qSOFA 0–3 */
  qsofa?: number;
  /** NEWS2-Punkte (nur Erwachsenenprofil) */
  news2?: number;
  /** PEWS 0–9 (nur Kinder) */
  pews?: number;
  /** Nu-DESC 0–10 (≥ 2 Delir wahrscheinlich) */
  nuDesc?: number;
  /** BESD 0–10 (≥ 2 Schmerz möglich) */
  besd?: number;
  bilanzMl?: number;             // Einfuhr − Ausfuhr seit Fallbeginn
  /** Beatmung: Spitzendruck in cmH₂O */
  ppeak?: number;
  // BGA (aus dem Modell; die Pflege liest und meldet, befundet nicht ärztlich)
  ph?: number; paco2?: number; pao2?: number; hco3?: number; be?: number; laktat?: number; kalium?: number;
}
export type Rhythmus = 'sinus' | 'sinustachykardie' | 'sinusbradykardie' | 'vorhofflimmern' | 'vt' | 'kammerflimmern' | 'asystolie' | 'pea';

/** Treiber verändern Grundgrößen über die Zeit. Parameter je Treiber im Kern dokumentiert. */
export type Treiber =
  | { art: 'blutung'; mlProMin: number }
  | { art: 'bronchospasmus'; staerke: number }
  | { art: 'hypoglykaemie'; abfallProStunde: number }
  | { art: 'sepsis_verlauf'; tempo: number }
  | { art: 'opioid_ueberhang'; spiegel: number; halbwertMin: number }
  | { art: 'exsikkose_progressiv'; verlustProStunde: number }
  | { art: 'delir_trigger'; ausloeser: Array<'schmerz' | 'umgebung' | 'harnverhalt' | 'exsikkose' | 'infekt' | 'medikamente'> }
  | { art: 'panik_eskaliert'; tempo: number }
  | { art: 'fieberkrampf_kind'; temperaturSchwelle: number }
  | { art: 'pneumonie'; staerke: number }
  /** P16a: allergische Sofortreaktion (Anaphylaxie): Gefäßtonus fällt, Kapillarleck, Bronchospasmus; Adrenalin bremst */
  | { art: 'anaphylaxie'; staerke: number }
  /** P16a: Lungenembolie (Totraum/Shunt, Rechtsherzbelastung), staerke 0..1 */
  | { art: 'lungenembolie'; staerke: number }
  // Zusätze Paket P1
  /** Normalinsulin s. c. (Gipfel nach etwa 2 h) */
  | { art: 'insulin'; ie: number; gipfelMin?: number }
  /** Kohlenhydrate; schnell = Traubenzucker/Saft (Gipfel 15 min), sonst Mahlzeit (Gipfel 40 min) */
  | { art: 'kohlenhydrate'; gramm: number; schnell?: boolean }
  /** Opioid-Antagonist: wirkt kürzer als viele Opioide (Renarkotisierung) */
  | { art: 'naloxon'; halbwertMin: number }
  /** volle Blase / Harnverhalt: Schmerz, Unruhe, Delir-Auslöser; endet über MassnahmeDefinition.beendet */
  | { art: 'harnverhalt' }
  /** G5: Schlaganfall; seite = betroffene Körperseite (rechts → Aphasie), schwere 0..1, blutung = intrazerebrale Blutung, beginnVorMin = Symptombeginn vor Fallstart */
  | { art: 'schlaganfall'; seite: 'links' | 'rechts'; schwere: number; blutung?: boolean; beginnVorMin?: number }
  /** G5: Lyse (rtPA) nach ärztlicher Anordnung; Nutzen hängt vom Zeitpunkt ab, bei Blutung Schaden */
  | { art: 'lyse' }
  /** G6: Schluckstörung (Dysphagie) 0..1 */
  | { art: 'schluckstoerung'; schwere: number }
  /** G6: Mahlzeit oder Getränk (wirkt 15 Minuten); ohne Dysphagie folgenlos */
  | { art: 'nahrung'; form: 'essen' | 'trinken' }
  /** G7: nächtliche Störung (Lärm, Licht, Pflegehandlungen, Mehrbettzimmer) 0..1 */
  | { art: 'schlafstoerung'; staerke: number }
  /** G5: Raumforderung im Kopf (Blutung, Schädel-Hirn-Trauma); seite = Hirnhälfte */
  | { art: 'hirndruck'; tempo: number; seite?: 'links' | 'rechts' }
  /** G3: liegt/sitzt ohne Eigenbewegung; Auflagedruck in mmHg (Weichlagerung ≈ 30, Standardmatratze ≈ 60–80) */
  | { art: 'immobil'; druckMmHg: number; scherkraefte?: boolean; feucht?: boolean }
  /** Alkoholentzug: schwere 0..1 (≥ 0,6 Gefahr Delirium tremens), letzterKonsumVorStd = Stunden seit dem letzten Trinken bei Fallstart */
  | { art: 'alkoholentzug'; schwere: number; letzterKonsumVorStd: number }
  /** Atemerschöpfung bei hoher Atemarbeit über Zeit (v. a. Säuglinge); tempo multipliziert die Erschöpfungsrate (Standard 1) */
  | { art: 'atemerschoepfung'; tempo?: number }
  /** G9: Wunde (OP-Wunde, Trauma, chronisch); tagPostOp bei Fallstart, infektTempo = Anstieg des Wundinfekts je Stunde */
  | { art: 'wunde'; ort: string; tagPostOp?: number; infektTempo?: number }
  /** G9: Nachblutung in den Verband (Volumenverlust wie blutung); Druckverband senkt sie um 80 % */
  | { art: 'wundblutung'; mlProMin: number }
  // G1 Wirkstoffe (Register physiologie/wirkstoffe.ts): Kinetik nach Weg, Halbwertszeit, Alter und Gewicht
  | { art: 'wirkstoff'; id: string; dosisMg: number; weg?: ArzneiWeg };

export type ArzneiWeg = 'iv' | 'sc' | 'im' | 'oral' | 'sublingual' | 'bukkal' | 'rektal' | 'inhalativ';

/** Treiber im Zustand: seit = Spielzeit, zu der er hinzukam (vom Kern gestempelt, nur aus z.t). */
export type AktiverTreiber = Treiber & { seit?: Sek };

/** Gerätestörungen in Spur B (Alarme, Befunde) */
export type GeraeteStoerung = 'diskonnektion' | 'tubus-verlegt' | 'sekret' | 'art-gedaempft' | 'art-nicht-genullt';

/** Spur-B-Modellmodule, im Fall zugeschaltet. Der Kern führt eine Laufzeitkopie (SimZustand.module). */
export interface ModellModule {
  beatmung?: { fio2: number; peep: number; af: number; vt: number };
  /** mgProMl: Konzentration als Zahl für Laufrate ↔ Dosis (z. B. Noradrenalin 5 mg/50 ml = 0,1) */
  perfusoren?: Array<{ id: string; wirkstoff: string; konzentration: string; mlProH: number; mgProMl?: number }>;
  arteriell?: boolean;
  bga?: boolean;
  rhythmus?: Rhythmus;
  sedierung?: { rassZiel: number };
  bilanz?: boolean;
  stoerungen?: GeraeteStoerung[];
}

/** Änderung an den Modellmodulen durch Maßnahme, Ereignis oder Entscheidung (P1b). */
export interface ModulEingriff {
  /** Perfusor anlegen oder ändern (gleiche id). mlProHDelta = titrieren, stopp = beenden. */
  perfusor?: { id: string; wirkstoff?: string; konzentration?: string; mgProMl?: number; mlProH?: number; mlProHDelta?: number; stopp?: boolean };
  /** Beatmung setzen/ändern; null = keine Beatmung (Spontanatmung) */
  beatmung?: Partial<NonNullable<ModellModule['beatmung']>> | null;
  arteriell?: boolean;
  /** null = Rhythmus wieder vom Modell bestimmen */
  rhythmus?: Rhythmus | null;
  sedierung?: { rassZiel: number };
  stoerungAn?: GeraeteStoerung[];
  stoerungAus?: GeraeteStoerung[];
}

/** Bildzustand: der Kern liefert ihn, die Darstellung wählt IDs aus katalog.ts / personen.ts. */
export interface Bildzustand {
  haltung?: 'liegt' | 'oberkoerper-hoch' | 'sitzt' | 'sitzt-ringt' | 'am-boden' | 'unruhig';
  haut?: 'rosig' | 'blass' | 'blass-kaltschweissig' | 'zyanotisch' | 'gerötet-heiss' | 'trocken';
  geraete?: string[];            // z. B. ['pulsoxy', 'rr-manschette', 'o2-brille']
  mimik?: 'ruhig' | 'schmerz' | 'angst' | 'verwirrt' | 'schlaefrig';
}

/* ───────────────────────────── Bedingungen ───────────────────────────── */

export type Vergleich = '<' | '<=' | '>' | '>=';
export type Bedingung =
  | { ab: Sek }                                                  // Spielzeit erreicht
  | { getan: string; bis?: Sek }                                  // Maßnahme ausgeführt (optional bis Zeitpunkt)
  | { nichtGetan: string; bis: Sek }                              // Unterlassung bis Zeitpunkt
  | { flag: string }
  | { wert: keyof Grundgroessen | keyof Anzeige; vergleich: Vergleich; grenze: number }
  | { gemeldet: string[] }                                        // SBAR-Bausteine im letzten Anruf
  | { anordnung: string; rueckgelesen?: boolean }
  // Runde 2 (P11/P13): Kommunikation und Dokumentation
  | { auftrag: string; status: AuftragStatus }                   // Rückauftrag der Ärztin (P11)
  | { gesagt: string; an?: Gegenueber }                          // Baustein in einer Nachricht an … (P11, jederzeit im Fall)
  | { dokumentiert: string }                                     // Baustein im Pflegebericht (P13)
  | { alle: Bedingung[] }
  | { eine: Bedingung[] }
  | { nicht: Bedingung };

/* ───────────────────────────── Maßnahmen ───────────────────────────── */

export interface Wirkkurve {
  /** Welche Grundgröße, um wie viel (absolut oder Faktor), wie schnell. */
  groesse: keyof Grundgroessen;
  delta?: number;
  faktor?: number;
  beginnSek: Sek;
  spitzeSek: Sek;
  dauerSek: Sek | 'dauerhaft';
}

/** Gilt für den zentralen Handlungskatalog (Paket P3) und für fallspezifische Maßnahmen. */
export interface MassnahmeDefinition {
  id: string;
  name: string;
  reiter: Reiter;
  spur: Spur | 'beide';
  zeitbedarfSekunden: number;
  /** Grundwerte nach BW-Landeslehrplan 3BFP (E4), mit Fundstelle. */
  befugnis: Record<Rolle, BefugnisLevel>;
  befugnisBeleg?: Quelle;
  risikoBeiUeberschreitung?: 'warnung-pa' | 'abbruch-durch-pa' | 'patientenschaden';
  /** Braucht unabhängig von der Rolle eine ärztliche Anordnung (Medikamente, O₂ über Standard, Infusion). */
  anordnungspflichtig?: boolean;
  wirkung?: Wirkkurve[];
  /** Startet Treiber (P1), z. B. Morphin als opioid_ueberhang mit Halbwertszeit, Insulin, Traubenzucker. */
  treiber?: Treiber[];
  /** Beendet alle laufenden Treiber dieser Arten (P1), z. B. Blasenkatheter → 'harnverhalt'. */
  beendet?: Array<Treiber['art']>;
  /** Setzt Flags (z. B. 'trinkt', 'sturzmatte') */
  setzt?: string[];
  /** Nur sichtbar/ausführbar, wenn erfüllt (z. B. Pulsoxy erst aus der Pflegetasche holen). */
  voraussetzung?: Bedingung;
  /** Benötigtes Messgerät. Im Heim und ambulant muss es erst aus der Pflegetasche geholt werden (E9). */
  geraet?: string;
  /** Spur B: verändert Modellmodule (Perfusor, Beatmung, art. Druck, Störungen) */
  modul?: ModulEingriff;
  kompetenzbereiche: KB[];
  klinisch?: KlinischerBereich[];
  quellen?: Quelle[];
}

/** Ergebnis einer Maßnahme im Fall: was man sieht, hört, misst – abhängig vom Zustand. */
export interface Befund {
  massnahme: string;
  /** Erste passende Variante gilt; ohne Bedingung = Standard. */
  varianten: Array<{ wenn?: Bedingung; text: string; zeigt?: Array<keyof Anzeige>; ton?: string }>;
}

/* ─────────────────────── Kommunikation & Team ─────────────────────── */

/** Runde 2 (P11): alle Gesprächspartner. Jede/r hat einen eigenen Gesprächsverlauf (Faden). */
export type Gegenueber =
  | 'patient' | 'angehoerige' | 'eltern' | 'betreuer'
  | 'aerztin' | 'kollegin' | 'pa' | 'rettungsdienst' | 'aufnehmende-station';
/** vor-ort = im Zimmer · telefon = Anruf (Faden offen bis auflegen) · messenger = Klinik-/Praxis-Chat, Antwort kommt verzögert */
export type Kanal = 'vor-ort' | 'telefon' | 'messenger';
export type AuftragStatus = 'offen' | 'erledigt' | 'gemeldet' | 'verspaetet';

/**
 * Rückauftrag (P11): „BZ messen und melden“, „in 30 Minuten RR kontrollieren und Bescheid geben“.
 * Entsteht aus einer ArztRegel (`auftraege`). Erledigt = Bedingung erfüllt NACH Auftragszeit (Kern prüft getan-Zeitpunkte ≥ seit).
 * Gemeldet = Nachricht an die Ärztin mit allen `meldung`-Bausteinen. Dann antwortet die erste passende `folge`-Regel.
 */
export interface Rueckauftrag {
  id: string;
  text: string;
  erledigt: Bedingung;
  /** Bausteine, die die Rückmeldung enthalten muss, z. B. ['wert:bz'] oder SBAR-IDs. */
  meldung: string[];
  /** Ab Auftrag; danach Status verspaetet, PA erinnert, Fehler `auftrag-verspaetet:<id>` im Log. */
  meldenBinnenSek?: Sek;
  folge: ArztRegel[];
}

/**
 * Wert-Bausteine (P11): Der Kern bietet für jeden gemessenen Wert automatisch einen Baustein an,
 * ID `wert:<Anzeige-Schlüssel>` (wert:bz, wert:rrSys, wert:spo2 …), Teil 'A', Text mit dem zuletzt gemessenen Wert.
 * Fälle verweisen nur auf die ID (in `gemeldet`, `meldung`, `erwartet`).
 */
export type WertBausteinId = `wert:${string}`;

export interface GespraechsEintrag {
  id: string;
  /** Frage im Offline-Katalog */
  frage: string;
  an: Gegenueber;
  /** P11: Standard vor-ort für Patient/Angehörige, telefon für Ärztin/Rettungsdienst. */
  kanal?: Kanal;
  antwort: Array<{ wenn?: Bedingung; text: string; setzt?: string[] }>;
  /** P11: nur anbieten, wenn erfüllt (z. B. Kollegin erst, wenn sie im Dienst ist). */
  nurWenn?: Bedingung;
  /** P11: Auskunft unterliegt der Schweigepflicht (Angehörige ohne Einwilligung) → Fehler, wenn nicht `erlaubtWenn`. */
  schweigepflicht?: { erlaubtWenn: Bedingung; fehlerText: string };
  /** Beziehungsgestaltung: Wirkung auf Angst/Unruhe */
  wirkung?: Wirkkurve[];
  kompetenzbereiche: KB[];
  /** Fakten, die die KI preisgeben darf (Grounding). Nichts außerhalb davon. */
  fakten?: string[];
}

export type SbarTeil = 'S' | 'B' | 'A' | 'R';
export interface SbarBaustein {
  id: string;
  teil: SbarTeil;
  text: string;
  /** kern = muss rein · hilfreich · ablenker = unnötig · falsch = sachlich falsch */
  art: 'kern' | 'hilfreich' | 'ablenker' | 'falsch';
  /** Nur anbieten, wenn der Wert bekannt sein kann (gemessen/beobachtet). */
  bekanntWenn?: Bedingung;
}

export interface Anordnung {
  id: string;
  massnahme: string;              // Verweis auf MassnahmeDefinition
  /** Weitere Maßnahmen, die dieselbe Anordnung freischaltet (z. B. Medikament richten oder geben) */
  auchFuer?: string[];
  text: string;                   // „500 ml Ringer-Lösung s. c. über 4 h“
  /** Fehlerhafte Anordnung → Remonstration erwartet (6.4) */
  fehlerhaft?: { warum: string; korrektur: string; /** Anordnung-ID, die nach der Remonstration angeboten wird */ ersatz?: string };
}

export interface ArztRegel {
  /** P11: Mit id antwortet eine Regel nur einmal je Faden-Verlauf (der Kern merkt sich beantwortete IDs). */
  id?: string;
  /** Reihenfolge zählt: erste passende Regel antwortet. */
  wenn: Bedingung;
  antwort: string;                // was die Ärztin sagt
  anordnungen?: string[];         // Anordnung-IDs
  kommtNachSek?: Sek;             // Ärztin kommt persönlich
  setzt?: string[];
  /** P11: Rückfrage der Ärztin („Wie hoch ist der Zucker?“). Der Faden bleibt offen; die nächste Nachricht mit
   *  den `erwartet`-Bausteinen wird wieder gegen die Regeln geprüft. `nichtBekannt`: Antwort, wenn der Wert fehlt
   *  (Lernende sagen „messe ich und melde mich“) → Kern legt den Auftrag `auftrag` an. */
  rueckfrage?: { text: string; erwartet: string[]; auftrag?: string };
  /** P11: Rückaufträge (IDs aus fall.arzt.auftraege), die mit dieser Antwort entstehen. */
  auftraege?: string[];
  /** P11: Antwort über Messenger kommt nach … Sek (Standard 0 am Telefon). */
  antwortNachSek?: Sek;
}

export interface Ereignis {
  id: string;
  wann: Bedingung;
  art: 'patient' | 'angehoerige' | 'team' | 'telefon' | 'klingel' | 'geraet' | 'komplikation' | 'visite';
  text: string;
  /** Hält die Uhr an und fragt (Entscheidungsmoment, wie bisher choices). */
  entscheidung?: Array<{ id: string; text: string; wertung: 'gut' | 'vertretbar' | 'falsch' | 'gefaehrlich'; warum: string; setzt?: string[]; loestAnrufAus?: boolean; modul?: ModulEingriff }>;
  treiber?: Treiber[];            // neu hinzukommende Treiber (Komplikation)
  /** Spur B: Gerätestörung, Rhythmuswechsel usw. */
  modul?: ModulEingriff;
  bild?: Bildzustand;
  verhindertDurch?: Bedingung;
}

/** Praxisanleitung (E10): gestuft, nie die Lösung */
export interface PaHilfe {
  wenn?: Bedingung;
  impuls: string;                 // 1. Frage, kein Abzug
  tipp: string;                   // 2. Frage, leichter Abzug
}

/* ─────────────────────────── Bewertung ─────────────────────────── */

export interface Pflichthandlung {
  id: string;
  text: string;                   // „Ärztin über Exsikkose-Zeichen informiert“
  erfuellt: Bedingung;
  kompetenzbereiche: KB[];
  klinisch?: KlinischerBereich[];
  gewicht: 1 | 2 | 3;             // 3 = kritisch (verpasst = deutlich sichtbar in der Auswertung)
  warum: string;
}

export interface Pflegefehler {
  id: string;
  text: string;
  wenn: Bedingung;
  schwere: 'leicht' | 'mittel' | 'schwer';
  kompetenzbereiche: KB[];
  folge?: { text: string; treiber?: Treiber[]; wirkung?: Wirkkurve[] };
  warum: string;
}

/** Abschluss: Pflegebedarf erheben (§ 4 PflBG, von Azubis unter Verantwortung der PA geübt) */
export interface PflegebedarfAuswahl {
  probleme: Array<{ id: string; text: string; richtig: boolean; prioritaet?: 1 | 2 | 3; warum: string }>;
  ziele: Array<{ id: string; text: string; passtZu: string[]; richtig: boolean }>;
}

/** Nur Spur B: Verdacht mit Begründung */
export interface Verdacht {
  optionen: Array<{ id: string; text: string; richtig: boolean }>;
  begruendungen: Array<{ id: string; text: string; stuetzt: string[] }>;
}

export interface LeitfadenAbschnitt { titel: string; text: string; quellen?: string[] }

/* ─────────────────────────── Der Fall ─────────────────────────── */

export interface FallV2 {
  schema: 2;
  id: string;
  version: string;                // für Prüfcode/Klasse (abwärtskompatibel halten)
  spur: Spur;
  setting: Setting;
  altersgruppe: Altersgruppe;
  titel: string;
  kurz: string;                   // eine Zeile für die Fallliste
  rahmen: string;                 // Rolle/Situation in einem Satz
  lernziele: string[];
  /** Runde 3 (P15): Einordnung nach Landeslehrplan BW 3BFP. ce = IDs aus ce/lehrplan.ts ('ce.05'),
   *  abschnitt = Ausbildungsabschnitte, themen = Topic-IDs aus pflege-generalistisch.json, kompetenzen = PflAPrV-Kennungen ('I.2.a'). */
  lehrplan?: { ce: string[]; abschnitt: Array<'ad12' | 'ad3'>; themen?: string[]; kompetenzen?: string[] };
  geeignet: { rollen: Rolle[]; stufen: Stufe[] };
  dauerMin: [number, number];     // geplante Spielzeit, z. B. [10, 15]
  freigabe: { status: 'entwurf' | 'ungeprueft' | 'geprueft'; pruefer?: string; datum?: string; pruefpunkte: string[] };
  quellen: Quelle[];

  person: {
    name: string;
    alter: { jahre?: number; monate?: number };
    geschlecht: 'w' | 'm' | 'd';
    biografie: string[];
    diagnosenBekannt: string[];
    medikamentePlan: string[];
    allergien: string[];
    hilfsmittel?: string[];
    gewichtKg?: number;
  };
  medien: {
    raum: string;                 // RaumId aus src/ui/sim/raeume/katalog.ts
    raumVarianten?: Array<{ wenn: Bedingung; raum: string }>;
    portraet?: string;            // Personen-ID aus personen.ts
    toene?: Record<string, string>;
  };
  uebernahme: string;             // kurze Übergabe zu Beginn (vorlesbar)
  startUhrzeit: string;           // „08:15“

  start: {
    grund: Partial<Grundgroessen>;
    treiber: Treiber[];
    module?: ModellModule;        // Spur B
    bild: Bildzustand;
    flags?: string[];
    /** Anordnungen, die zu Beginn schon gelten (z. B. Medikamentenplan). */
    anordnungen?: string[];
    /** Was zu Beginn schon gemessen/angelegt ist (Klinik: Monitor läuft). */
    sichtbar?: Array<keyof Anzeige>;
  };

  /** IDs aus dem zentralen Katalog, die in diesem Fall angeboten werden (inkl. Ablenker). */
  massnahmen: string[];
  /** Fallspezifische Maßnahmen oder Überschreibungen (z. B. Befugnis der Einrichtung). */
  massnahmenZusatz?: MassnahmeDefinition[];
  befugnisUeberschreibung?: Record<string, Partial<Record<Rolle, BefugnisLevel>>>;

  befunde: Befund[];
  gespraech: GespraechsEintrag[];
  sbar: SbarBaustein[];
  anordnungen: Anordnung[];
  arzt: {
    name: string; erreichbar: 'telefon' | 'vor-ort' | 'hausarzt-praxis' | 'bereitschaft'; regeln: ArztRegel[];
    /** P11: Rückaufträge, auf die Regeln verweisen */
    auftraege?: Rueckauftrag[];
    /** P11: welche Kanäle es in diesem Setting gibt (Standard ['telefon']) */
    kanaele?: Kanal[];
  };
  ereignisse: Ereignis[];
  pa: { name: string; hilfen: PaHilfe[] };
  /** Team-Leiste (P6, optional): Name der Kollegin/des Kollegen im Dienst; sonst „Umfeld und Team“. */
  team?: { kollegin?: string; /** P11: Leitung/Stationsleitung, Rettungsdienst usw. als Gesprächspartner */ weitere?: Partial<Record<Gegenueber, string>> };
  /** Runde 2 (P13): Patientenakte. Fehlt sie, baut die Oberfläche eine Minimal-Akte aus `person`. */
  akte?: Akte;

  bewertung: {
    pflicht: Pflichthandlung[];
    fehler: Pflegefehler[];
    /** Wann der Fall endet (zusätzlich zu „Abschließen“). */
    ende: Array<{ wenn: Bedingung; text: string; ausgang: 'stabil' | 'verlegt' | 'verschlechtert' | 'verstorben' }>;
  };
  pflegebedarf: PflegebedarfAuswahl;
  verdacht?: Verdacht;
  leitfaden: LeitfadenAbschnitt[];

  /** Tests (P0): Musterweg erreicht ≥ 90 %, Unterlassungsweg verschlechtert, Grenzweg erzeugt Grenzüberschreitung. */
  pruefwege: {
    muster: SimEventEingabe[];
    unterlassung: { bisSek: Sek; erwartet: Bedingung };
    grenze?: { rolle: Rolle; events: SimEventEingabe[]; erwartet: string };
  };
}

/* ─────────────────────────── Patientenakte (P13) ─────────────────────────── */

export type KurvenWert = 'rrSys' | 'rrDia' | 'hf' | 'af' | 'spo2' | 'temp' | 'bz' | 'schmerz' | 'gewicht';

export interface MedPlanEintrag {
  id: string;
  wirkstoff: string;
  handelsname?: string;
  staerke: string;                 // „10 mg“
  form: string;                    // „Tbl.“, „i. v.“, „s. c.“
  /** Dauermedikation „1-0-1-0“; leer bei Bedarf */
  schema?: string;
  /** Bedarfsmedikation mit Indikation und Höchstmenge */
  bedarf?: { indikation: string; einzeldosis: string; maxProTag: string; abstandH?: number };
  /** Katalog-Maßnahme, mit der die Gabe im Fall geschieht (z. B. 'tabletten-wie-geplant-geben') */
  massnahme?: string;
  /** zuletzt gegeben (Uhrzeit vor Fallbeginn), für Abstand/Doppelgabe */
  zuletzt?: string;
  hinweis?: string;               // „PRISCUS“, „vor Gabe RR messen“
  /** Anordnung, die den Eintrag im Fall ändert (pausieren, neu) */
  geaendertDurch?: string;
  /**
   * Anordnungs-ID: Der Eintrag gilt erst ab dieser Anordnung im Fall (z. B. neu angeordnete Bedarfsmedikation).
   * Vorher steht er nicht in der Akte; ab dann prüft medPruefung Abstand, Höchstmenge und Doppelgabe.
   * Gaben vor der Anordnung zählen nicht mit. Wird die Anordnung zurückgezogen, prüft der Kern nicht mehr gegen den Eintrag.
   */
  ab?: string;
}

export interface Vorwert {
  /** Uhrzeit oder „gestern 18:00“ – nur Anzeige */
  zeit: string;
  /** Stunden vor Fallbeginn, für die Kurve */
  vorH: number;
  werte: Partial<Record<KurvenWert, number>>;
  kuerzel?: string;
}

export interface AkteEintrag { zeit: string; wer: string; text: string }

export interface Akte {
  aufnahmegrund?: string;
  anamnese?: string[];
  diagnosen?: Array<{ text: string; icd?: string; seit?: string }>;
  medikation: MedPlanEintrag[];
  /** Vorwerte für das Kurvenblatt (Tage/Stunden vor dem Fall) */
  vorwerte?: Vorwert[];
  /** bisherige Pflegeberichte und ärztliche Einträge */
  pflegebericht?: AkteEintrag[];
  aerztlicheAnordnungen?: AkteEintrag[];
  assessments?: Array<{ name: string; wert: string; datum: string; hinweis?: string }>;
  labor?: Array<{ name: string; wert: string; einheit?: string; norm?: string; datum: string; auffaellig?: boolean }>;
  bilanzVortag?: { einfuhrMl: number; ausfuhrMl: number };
  pflegeplanung?: Array<{ problem: string; ziel: string; massnahmen: string[] }>;
  /** Patientenverfügung, Vorsorgevollmacht, Einwilligung Auskunft an Angehörige … */
  rechtliches?: string[];
}

/* ─────────────────────────── Event-Log ─────────────────────────── */

/** Was die Darstellung an den Kern schickt (ohne Zeit; der Kern stempelt t). */
export type SimEventEingabe =
  | { art: 'massnahme'; id: string }
  | { art: 'frage'; id: string }
  | { art: 'pflegetasche'; geraet: string }
  | { art: 'anruf'; an: 'aerztin'; sbar: string[]; freitext?: string }
  /** P11: Nachricht in einem Faden (Telefon offen, Messenger, vor Ort). `anruf` bleibt = Faden Ärztin neu öffnen + Nachricht. */
  | { art: 'nachricht'; an: Gegenueber; kanal: Kanal; bausteine: string[]; freitext?: string; auftrag?: string }
  | { art: 'auflegen'; an: Gegenueber }
  /** P13: Eintrag in den Pflegebericht (Bausteine wie SBAR/Wert-Bausteine, optional Freitext) */
  | { art: 'dokumentieren'; bausteine: string[]; freitext?: string }
  | { art: 'rueckmelden'; anordnung: string; rueckgelesen: boolean }
  | { art: 'remonstrieren'; anordnung: string; grund?: string }
  | { art: 'pa-fragen' }
  | { art: 'anleitung-anfordern'; massnahme: string }
  | { art: 'entscheidung'; ereignis: string; wahl: string }
  | { art: 'warten'; sek: Sek }
  | { art: 'abschluss'; probleme: string[]; ziele: string[]; verdacht?: string; begruendung?: string[]; sbar?: string[] };

/** Was im Log steht: Eingaben mit Zeit + vom Kern erzeugte Folgen. */
export type SimEvent =
  | (SimEventEingabe & { t: Sek })
  | { t: Sek; art: 'anordnung-erhalten'; massnahmeId: string; anordnung: string; rueckgelesen: boolean }
  | { t: Sek; art: 'grenzueberschreitung'; massnahmeId: string; rolle: Rolle; befugnis: BefugnisLevel }
  | { t: Sek; art: 'pa-eingriff'; massnahmeId: string; typ: 'unterstuetzt' | 'warnt' | 'bricht-ab' }
  | { t: Sek; art: 'pa-hilfe'; stufe: 'impuls' | 'tipp' }
  | { t: Sek; art: 'ereignis'; id: string }
  | { t: Sek; art: 'alarm'; groesse: keyof Anzeige; stufe: 'gelb' | 'rot' }
  | { t: Sek; art: 'fehler'; id: string }
  | { t: Sek; art: 'auftrag'; id: string; status: AuftragStatus }
  | { t: Sek; art: 'antwort'; von: Gegenueber; text: string; regel?: string };

export type Freigabe = 'frei' | 'mit-pa' | 'braucht-anordnung' | 'grenze';
