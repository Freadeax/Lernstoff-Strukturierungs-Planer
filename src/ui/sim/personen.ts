// Patientenporträts für alle Simulatoren (Praxis-, Fall-, Diagnostik-Simulator) aus Philipps
// Materiallieferungen. KI-generiert, fiktive Personen. Bilder unter public/personen/ (512 px WebP),
// werden erst beim Ansehen geladen und danach offline zwischengespeichert (runtimeCaching).
// Dateiname wie in der Lieferung: <fall-id>_<zustand>.webp. Fehlt ein Zustand, gilt „stabil“.

export type PortraetZustand = 'stabil' | 'angestrengt' | 'kritisch';

export interface Person {
  id: string;
  name: string;
  alter: number;
  /** Basis des Dateinamens ohne Zustand, z. B. „praxis-asthma“ */
  datei: string;
  /** Gelieferte Zustände */
  zustaende: PortraetZustand[];
  /** Kurzbeschreibung für Screenreader */
  beschreibung: string;
  /** Fälle, in denen die Person vorkommt („praxis:<id>“, „fall:<id>“) */
  faelle: string[];
}

const liste: Person[] = [
  {
    id: 'mila', name: 'Mila', alter: 2, datei: 'praxis-kind', zustaende: ['stabil'],
    beschreibung: 'Mila, ein Kleinkind mit braunem Bob und türkisfarbenem Schlafoberteil.',
    faelle: ['praxis:kind'],
  },
  {
    id: 'ben', name: 'Ben', alter: 7, datei: 'praxis-asthma', zustaende: ['stabil'],
    beschreibung: 'Ben, ein Schulkind mit dunkelbraunem, gewelltem Haar und hellblauem Oberteil.',
    faelle: ['praxis:asthma', 'fall:asthma-kind'],
  },
];

export const PERSONEN: Record<string, Person> = Object.fromEntries(liste.map((p) => [p.id, p]));

/** Person zu einem Fall, z. B. personFuer('fall', 'asthma-kind'). */
export function personFuer(simulator: 'praxis' | 'fall' | 'diagnostik', fallId: string): Person | null {
  const schluessel = `${simulator}:${fallId}`;
  return liste.find((p) => p.faelle.includes(schluessel)) ?? null;
}

/** Bildpfad; fehlende Zustände fallen auf „stabil“ zurück. */
export function portraetUrl(p: Person, zustand: PortraetZustand = 'stabil'): string {
  const z = p.zustaende.includes(zustand) ? zustand : 'stabil';
  return `${import.meta.env.BASE_URL}personen/${p.datei}_${z}.webp`;
}
