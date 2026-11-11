// Warnung direkt am Freitextfeld, sobald der Text nach echten Personendaten aussieht
// (Audit: Warnung am Eingabefeld und vor optionalem KI-Feedback). Zeigt nichts, solange nichts auffällt.

import { PERSONEN_TEXT, personenbezug } from './lib/personenbezug';

export function PersonenWarnung({ text, erlaubt = [], vorKi = false }: { text: string; erlaubt?: string[]; vorKi?: boolean }) {
  const funde = personenbezug(text, erlaubt);
  if (!funde.length) return null;
  const arten = [...new Set(funde.map((f) => PERSONEN_TEXT[f.art]))];
  return (
    <p className="note warn personen-warnung" role="status">
      <strong>{vorKi ? 'Vor dem Senden prüfen:' : 'Mögliche echte Personendaten:'}</strong>{' '}
      {arten.join(', ')} ({funde.map((f) => `„${f.text}“`).join(', ')}). Bitte nur ausgedachte Übungsdaten verwenden{vorKi ? ', sonst gehen sie an Claude (Anthropic).' : '.'}
    </p>
  );
}

export { personenbezug };
