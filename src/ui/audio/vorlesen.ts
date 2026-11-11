// Vorlesen mit der Sprachausgabe des Geräts (Web Speech API). Läuft offline mit den Systemstimmen,
// auf dem iPhone z. B. „Anna“ oder „Helena“. Es wird nichts an einen Server geschickt.

import { audioEinstellungen } from './einstellungen';
import { createStore } from '../lib/store';

export const vorleseStatus = createStore<{ laeuft: boolean; quelle: string | null }>({ laeuft: false, quelle: null });

export function kannVorlesen(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function deutscheStimmen(): SpeechSynthesisVoice[] {
  if (!kannVorlesen()) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('de'));
}

function stimme(): SpeechSynthesisVoice | undefined {
  const alle = deutscheStimmen();
  const wahl = audioEinstellungen.get().stimme;
  return alle.find((v) => v.voiceURI === wahl) ?? alle.find((v) => v.localService) ?? alle[0];
}

/**
 * Text in Abschnitte von höchstens ~220 Zeichen an Satzgrenzen teilen.
 * iOS bricht lange Äußerungen sonst mitten im Text ab.
 */
export function inAbschnitte(text: string, max = 220): string[] {
  const saetze = text.replace(/\s+/g, ' ').trim().match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [];
  const teile: string[] = [];
  let akt = '';
  for (const roh of saetze) {
    let s = roh;
    while (s.length > max) {
      const schnitt = s.lastIndexOf(' ', max) > 40 ? s.lastIndexOf(' ', max) : max;
      if (akt) { teile.push(akt.trim()); akt = ''; }
      teile.push(s.slice(0, schnitt).trim()); s = s.slice(schnitt);
    }
    if ((akt + s).length > max && akt) { teile.push(akt.trim()); akt = ''; }
    akt += s;
  }
  if (akt.trim()) teile.push(akt.trim());
  return teile.filter(Boolean);
}

/** Abkürzungen aus dem Pflegealltag so umschreiben, dass die Stimme sie verständlich spricht. */
export function sprechbar(text: string): string {
  return text
    .replace(/SpO₂|SpO2/g, 'S P O 2')
    .replace(/\bz\. ?B\./g, 'zum Beispiel')
    .replace(/\bd\. ?h\./g, 'das heißt')
    .replace(/\bu\. ?a\./g, 'unter anderem')
    .replace(/\bggf\./g, 'gegebenenfalls')
    .replace(/\bbzw\./g, 'beziehungsweise')
    .replace(/\bca\./g, 'circa')
    .replace(/\bmmHg\b/g, 'Millimeter Quecksilbersäule')
    .replace(/\/min\b/g, ' pro Minute')
    .replace(/°C/g, ' Grad')
    .replace(/[•▪◦→⟶]/g, ', ');
}

/** Liest den Text vor. Ein zweiter Aufruf mit derselben Quelle stoppt. */
export function lies(text: string, quelle = 'standard') {
  if (!kannVorlesen()) return;
  const st = vorleseStatus.get();
  speechSynthesis.cancel();
  if (st.laeuft && st.quelle === quelle) { vorleseStatus.set({ laeuft: false, quelle: null }); return; }
  const teile = inAbschnitte(sprechbar(text));
  if (!teile.length) return;
  const v = stimme();
  const tempo = audioEinstellungen.get().tempo;
  vorleseStatus.set({ laeuft: true, quelle });
  teile.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = v?.lang ?? 'de-DE';
    if (v) u.voice = v;
    u.rate = tempo;
    if (i === teile.length - 1) {
      u.onend = () => { if (vorleseStatus.get().quelle === quelle) vorleseStatus.set({ laeuft: false, quelle: null }); };
    }
    u.onerror = () => { if (vorleseStatus.get().quelle === quelle) vorleseStatus.set({ laeuft: false, quelle: null }); };
    speechSynthesis.speak(u);
  });
}

export function stoppeVorlesen() {
  if (!kannVorlesen()) return;
  speechSynthesis.cancel();
  vorleseStatus.set({ laeuft: false, quelle: null });
}

/**
 * Markdown (Skript, Zusammenfassungen) in vorlesbaren Text: Überschriften, Listen und Tabellen werden
 * zu Sätzen, Belegmarken [Q1 S. 3] und Formatierung fallen weg.
 */
export function markdownAlsText(md: string): string {
  return md
    .split('\n')
    .filter((z) => !/^\s*\|?\s*:?-{3,}/.test(z))           // Tabellen-Trennzeile
    .map((z) => z
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')                  // Bilder
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')               // Links: nur Text
      .replace(/\[[^\]]{0,60}\]/g, '')                        // Belegmarken
      .replace(/^\s{0,3}#{1,6}\s*/, '')                       // Überschrift
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')                // Listenpunkt
      .replace(/^\s*>\s?/, '')                                // Zitat
      .replace(/^.*\|.*$/, (z2) => z2.split('|').map((c) => c.trim()).filter(Boolean).join(', ')) // Tabellenzeile
      .replace(/[*_`~⚠]/g, '')
      .replace(/\s+([.,;:!?])/g, '$1')
      .trim())
    .filter(Boolean)
    .map((z) => (/[.!?:;,]$/.test(z) ? z : `${z}.`))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
