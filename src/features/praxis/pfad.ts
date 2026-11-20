// Adressen des Praxissimulators ohne Inhalte (klein, auch für App.tsx und den Lernplan).
// Seit der Zusammenführung (Audit U-2) ist der frühere Fallsimulator (#/lernen/fall) die Fallart „Kurzfälle“
// im Praxissimulator: #/lernen/praxis?art=kurz. Gespeicherte Stände (lernstoff.fall.*) bleiben unverändert.

export const PRAXIS_PFAD = '/lernen/praxis';
export const ALTER_FALL_PFAD = '/lernen/fall';

export type FallArt = 'praxis' | 'kurz';
export const FALLART_NAME: Record<FallArt, string> = { praxis: 'Praxisfälle', kurz: 'Kurzfälle' };

/** Adresse der Kurzfälle, optional mit Sprung zu Thema (?thema=) oder Krankheitsbild (?kb=). */
export function kurzfallPfad(sprung: Record<string, string> = {}): string {
  const q = new URLSearchParams({ art: 'kurz', ...sprung });
  return `${PRAXIS_PFAD}?${q.toString()}`;
}

export const fallArtVon = (params: URLSearchParams): FallArt => (params.get('art') === 'kurz' ? 'kurz' : 'praxis');

/** Alte Adresse #/lernen/fall?… → #/lernen/praxis?art=kurz&…, alle übrigen Angaben bleiben erhalten. */
export function fallWeiterleitung(path: string, params: URLSearchParams): string | undefined {
  if (path !== ALTER_FALL_PFAD && !path.startsWith(ALTER_FALL_PFAD + '/')) return undefined;
  const q = new URLSearchParams(params);
  q.delete('art');
  const rest = q.toString();
  return `${PRAXIS_PFAD}?art=kurz${rest ? `&${rest}` : ''}`;
}
