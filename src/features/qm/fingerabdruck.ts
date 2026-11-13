// Fingerabdruck einer Aufgabe: ändert sich, sobald sich am Inhalt etwas ändert, das die Antwort oder ihre
// Bewertung berührt (Frage, Optionen, Lösung, Begründung, Schritte, Marken). So erkennt die App ohne
// Versionsnummern, welche Aufgaben seit der letzten Prüfung geändert wurden und ob eine Meldung oder
// Statistik noch zur aktuellen Fassung gehört (Vorbild: Fragenversionen in Moodle).
// Reine Funktion, ohne Krypto-API, damit sie in Tests, im Browser und in Skripten gleich rechnet.

import type { Aufgabe } from '../quiz/quiz';

/** Kanonische Form: feste Feldreihenfolge, ohne Darstellungsfelder (Vertiefung und Stufe ändern die Lösung nicht). */
export function kanonisch(a: Aufgabe): string {
  const kern: unknown[] = [a.art, a.frage, a.topicIds, a.erklaerung];
  if (a.art === 'auswahl') kern.push(a.optionen, a.richtig, a.mehrfach);
  else if (a.art === 'reihenfolge') kern.push(a.schritte);
  else if (a.art === 'zuordnen') kern.push(a.paare.map((p) => [p.links, p.rechts]));
  else if (a.art === 'fall') kern.push(a.einstieg, a.schritte.map((s) => [s.lage, s.frage, s.optionen, s.richtig, s.mehrfach, s.warum]));
  else kern.push(a.figur, a.marken.map((m) => [m.nr, m.label, m.hinweis]));
  return JSON.stringify(kern);
}

/** FNV-1a 32 Bit als 8 Hex-Zeichen. Kollisionen sind bei einigen hundert Aufgaben je Trainer praktisch ausgeschlossen. */
export function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const fingerabdruck = (a: Aufgabe): string => fnv(kanonisch(a));
