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
export type BefugnisLevel = 'selbst' | 'mit-anleitung' | 'nach-anordnung' | 'nur-aerztlich';
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
  // Spur B (optional, nur mit Modellmodulen; P1b)
  sauerstoff?: number;           // O₂ l/min (P1 legt die Größe an; hier nur bis zum Zusammenführen)
  sedierung?: number;            // 0..1 Sedativa-Wirkung (Perfusor), → RASS, Vigilanz, Atemantrieb
  laktat?: number;               // mmol/l, Bestand (steigt bei Minderperfusion, sinkt langsam)
  kalium?: number;               // mmol/l
  einfuhrMl?: number;            // Bilanz: kumulierte Einfuhr seit Fallbeginn (Infusion = Wirkkurve)
  ausfuhrMl?: number;            // Bilanz: kumulierte Urinmenge seit Fallbeginn
}

/** Vom Kern abgeleitet, Ziele für den Monitor (Logik-Takt 5 s, Render interpoliert). */
export interface Anzeige {
  hf: number; rrSys: number; rrDia: number; af: number; spo2: number; temp: number;
  bz?: number; etco2?: number;
  rhythmus: Rhythmus;
  avpu: 'A' | 'V' | 'P' | 'U';
  gcs?: number;
  /** Mitteldruck (P1 setzt ihn im Basismodell; Spur B aus der arteriellen Messung) */
  map?: number;
  // Spur B (P1b): nur befüllt, wenn das passende Modul an ist
  artSys?: number; artDia?: number;
  /** Arterielle Kurve gedämpft (Luft, Gerinnsel, abgeknickt): Systole zu niedrig, Diastole zu hoch */
  artGedaempft?: boolean;
  rass?: number;                 // −5 … +4
  urinMlH?: number;
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
  | { art: 'pneumonie'; staerke: number };

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

export interface GespraechsEintrag {
  id: string;
  /** Frage im Offline-Katalog */
  frage: string;
  an: 'patient' | 'angehoerige' | 'eltern' | 'betreuer';
  antwort: Array<{ wenn?: Bedingung; text: string }>;
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
  text: string;                   // „500 ml Ringer-Lösung s. c. über 4 h“
  /** Fehlerhafte Anordnung → Remonstration erwartet (6.4) */
  fehlerhaft?: { warum: string; korrektur: string; /** Anordnung-ID, die nach der Remonstration angeboten wird */ ersatz?: string };
}

export interface ArztRegel {
  /** Reihenfolge zählt: erste passende Regel antwortet. */
  wenn: Bedingung;
  antwort: string;                // was die Ärztin sagt
  anordnungen?: string[];         // Anordnung-IDs
  kommtNachSek?: Sek;             // Ärztin kommt persönlich
  setzt?: string[];
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
  arzt: { name: string; erreichbar: 'telefon' | 'vor-ort' | 'hausarzt-praxis' | 'bereitschaft'; regeln: ArztRegel[] };
  ereignisse: Ereignis[];
  pa: { name: string; hilfen: PaHilfe[] };

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

/* ─────────────────────────── Event-Log ─────────────────────────── */

/** Was die Darstellung an den Kern schickt (ohne Zeit; der Kern stempelt t). */
export type SimEventEingabe =
  | { art: 'massnahme'; id: string }
  | { art: 'frage'; id: string }
  | { art: 'pflegetasche'; geraet: string }
  | { art: 'anruf'; an: 'aerztin'; sbar: string[]; freitext?: string }
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
  | { t: Sek; art: 'fehler'; id: string };

export type Freigabe = 'frei' | 'mit-pa' | 'braucht-anordnung' | 'grenze';
