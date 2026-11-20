// Adressen des Wissenstrainers. Bewusst ohne Inhalte importiert, damit Lernplan, Menü und
// Links die Adressen kennen, ohne alle Aufgaben mitzuladen.
//
// Bis November 2026 hatte jedes Fachgebiet einen eigenen Trainer mit eigener Adresse
// (#/lernen/hygiene, #/lernen/anatomie …). Diese Adressen leiten weiter; die internen
// Kennungen (Lernstand, Fehlerheft, Zwischenstand, Lernplan) bleiben die alten.

export const WISSEN_PFAD = '/lernen/wissen';

/** Fachgebiete in der Reihenfolge der Auswahl. Die Kennung ist zugleich Fehlerheft-Quelle und Lernplan-Trainer. */
export const FACH_IDS = ['anatomie', 'arzneimittel', 'normwerte', 'labor', 'hygiene', 'notfall', 'expertenstandards', 'recht', 'grundlagen'] as const;
export type FachId = typeof FACH_IDS[number];

export const FACH_NAME: Record<FachId, string> = {
  anatomie: 'Anatomie', arzneimittel: 'Arzneimittel', normwerte: 'Normwerte', labor: 'Labor', hygiene: 'Hygiene',
  notfall: 'Notfall', expertenstandards: 'Expertenstandards', recht: 'Recht', grundlagen: 'Grundlagen',
};

export const istFach = (x: string | null | undefined): x is FachId => !!x && (FACH_IDS as readonly string[]).includes(x);

/** Adresse eines Fachgebiets im Wissenstrainer, optional mit Bereich und weiteren Angaben (stufe, runde, modus …). */
export function wissenPfad(fach?: FachId, params: Record<string, string | number | undefined> = {}): string {
  const q = new URLSearchParams();
  if (fach) q.set('fach', fach);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `${WISSEN_PFAD}?${s}` : WISSEN_PFAD;
}

/** Alte Einzeltrainer-Adressen → Fachgebiet. */
export const ALTE_PFADE: Record<string, FachId> = Object.fromEntries(FACH_IDS.map((f) => [`/lernen/${f}`, f]));

/** Neue Adresse für eine alte Trainer-Adresse; alle Angaben (bereich, stufe, runde, modus …) bleiben erhalten. */
export function weiterleitungFuer(path: string, params: URLSearchParams): string | undefined {
  const fach = ALTE_PFADE[path];
  if (!fach) return undefined;
  const q = new URLSearchParams(params);
  q.delete('fach');
  const rest = q.toString();
  return `${WISSEN_PFAD}?fach=${fach}${rest ? `&${rest}` : ''}`;
}
