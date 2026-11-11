import { createStore, istObjekt, storage } from '../lib/store';

// Einstellungen für Töne und Vorlesen. Gelten je Gerät (Stimmen und Lautsprecher sind je Gerät verschieden),
// deshalb nicht in der Datensicherung (siehe NICHT_SICHERN in core/sicherung.ts).

/** ui = Rückmeldetöne in Übungen, sim = Geräte und Alarme in Simulatoren, atmo = Raumklang im Hintergrund. */
export type Kategorie = 'ui' | 'sim' | 'atmo';
export const KATEGORIEN: Array<{ id: Kategorie; label: string; text: string }> = [
  { id: 'ui', label: 'Rückmeldetöne', text: 'Richtig, falsch, Runde geschafft, Karte umdrehen.' },
  { id: 'sim', label: 'Geräte und Alarme', text: 'Monitor, Alarme, Telefon und Patientenruf in den Simulatoren.' },
  { id: 'atmo', label: 'Raumklang', text: 'Leiser Hintergrund je Ort: Station, Intensiv, Notaufnahme, Heim, Wohnung.' },
];

export interface AudioEinstellungen {
  /** Hauptschalter für alle automatischen Töne. Abspielknöpfe (Hör-Trainer, Probehören) spielen trotzdem. */
  an: boolean;
  /** 0 bis 1 */
  lautstaerke: number;
  kategorien: Record<Kategorie, boolean>;
  /** iPhone/iPad: auch im Lautlos-Modus abspielen (Audio-Sitzung „playback“ statt „ambient“). */
  trotzLautlos: boolean;
  /** Gewählte Vorlesestimme (voiceURI), leer = erste deutsche Stimme. */
  stimme: string;
  /** Sprechtempo 0,6 bis 1,6 */
  tempo: number;
}

export const STANDARD: AudioEinstellungen = {
  an: true, lautstaerke: 0.7, kategorien: { ui: true, sim: true, atmo: true }, trotzLautlos: false, stimme: '', tempo: 1,
};

export const AUDIO_KEY = 'lernstoff.audio';

const zahl = (v: unknown, min: number, max: number, ersatz: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : ersatz;

/** Gespeicherten Stand lesen; Unbekanntes oder Kaputtes fällt auf den Standard zurück. */
export function bereinige(roh: unknown): AudioEinstellungen {
  if (!istObjekt(roh)) return { ...STANDARD, kategorien: { ...STANDARD.kategorien } };
  const k = istObjekt(roh.kategorien) ? roh.kategorien : {};
  const bool = (v: unknown, e: boolean) => (typeof v === 'boolean' ? v : e);
  return {
    an: bool(roh.an, STANDARD.an),
    lautstaerke: zahl(roh.lautstaerke, 0, 1, STANDARD.lautstaerke),
    kategorien: { ui: bool(k.ui, true), sim: bool(k.sim, true), atmo: bool(k.atmo, true) },
    trotzLautlos: bool(roh.trotzLautlos, false),
    stimme: typeof roh.stimme === 'string' ? roh.stimme.slice(0, 200) : '',
    tempo: zahl(roh.tempo, 0.6, 1.6, 1),
  };
}

export const audioEinstellungen = createStore<AudioEinstellungen>(
  bereinige(storage.read<unknown>(AUDIO_KEY, {})),
  (s) => { storage.write(AUDIO_KEY, s); },
);

export function setzeAudio(patch: Partial<AudioEinstellungen>) {
  audioEinstellungen.set(patch);
}
export function setzeKategorie(k: Kategorie, an: boolean) {
  audioEinstellungen.set((s) => ({ ...s, kategorien: { ...s.kategorien, [k]: an } }));
}

/** Spielt diese Kategorie gerade automatisch? */
export function hoerbar(k: Kategorie, s: AudioEinstellungen = audioEinstellungen.get()): boolean {
  return s.an && s.kategorien[k];
}
