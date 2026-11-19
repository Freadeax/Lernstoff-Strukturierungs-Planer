// Praxissimulator neu – Verlaufsjournal (P12): chronologisch „Was ist passiert“, mit Filter.
// Rein. Quellen: eigene Eingaben aus dem Event-Log, Meldungen des Kerns (Befunde, Antworten, Nachrichten,
// Ereignisse, sichtbare Veränderungen) und Alarme. Bei Handlungen mit Wirkung: Vergleich vorher/nachher.

import { eingabeText } from '../kern/auswertung';
import type { Meldung, SimZustand } from '../kern/kern';
import type { Anzeige } from '../kern/typen';
import { vorherNachher, wirktAufWerte, type KurvenDaten, type Vergleich } from './kurve/kurvendaten';

export type JournalFilter = 'alle' | 'eigene' | 'befunde' | 'gespraeche' | 'zustand' | 'ereignisse';

export const JOURNAL_FILTER: ReadonlyArray<{ id: JournalFilter; text: string }> = [
  { id: 'alle', text: 'Alles' },
  { id: 'eigene', text: 'Meine Handlungen' },
  { id: 'befunde', text: 'Befunde & Werte' },
  { id: 'gespraeche', text: 'Gespräche' },
  { id: 'zustand', text: 'Zustand' },
  { id: 'ereignisse', text: 'Ereignisse & Alarme' },
];

export interface JournalEintrag {
  t: number;
  gruppe: Exclude<JournalFilter, 'alle'>;
  /** feinere Art für Symbol und Farbe */
  art: 'handlung' | 'befund' | 'gespraech' | 'arzt' | 'pa' | 'nachricht' | 'verlauf' | 'ereignis' | 'alarm' | 'hinweis' | 'doku' | 'fehler' | 'ende';
  text: string;
  wichtig?: boolean;
  /** bei Handlungen mit Wirkung: Werte vorher/nachher */
  vergleich?: Vergleich[];
  /** Reihenfolge innerhalb gleicher Zeit (Handlung vor ihrem Ergebnis) */
  n: number;
}

const GRUPPE_VON: Record<Meldung['art'], JournalEintrag['gruppe']> = {
  befund: 'befunde', doku: 'befunde', gespraech: 'gespraeche', arzt: 'gespraeche', pa: 'gespraeche', nachricht: 'gespraeche',
  verlauf: 'zustand', ereignis: 'ereignisse', fehler: 'ereignisse', ende: 'ereignisse', hinweis: 'eigene',
};

const NAME: Partial<Record<keyof Anzeige, string>> = { hf: 'Puls', spo2: 'SpO₂', rrSys: 'Blutdruck', af: 'Atemfrequenz', temp: 'Temperatur' };

export function journal(z: SimZustand, daten?: KurvenDaten): JournalEintrag[] {
  const fall = z.fall;
  const out: JournalEintrag[] = [];
  let n = 0;
  // Eigene Eingaben: im Log mit Zeitstempel vor dem Ergebnis (der Kern loggt die Eingabe, bevor er rechnet)
  for (const l of z.log) {
    if (l.art === 'alarm') {
      out.push({ t: l.t, gruppe: 'ereignisse', art: 'alarm', text: `Alarm ${l.stufe}: ${NAME[l.groesse] ?? l.groesse}`, wichtig: l.stufe === 'rot', n: n++ });
      continue;
    }
    if (!('t' in l) || l.art === 'warten' || l.art === 'abschluss') continue;
    if (!['massnahme', 'frage', 'pflegetasche', 'entscheidung', 'anleitung-anfordern', 'pa-fragen', 'anruf', 'nachricht', 'auflegen', 'rueckmelden', 'remonstrieren', 'dokumentieren'].includes(l.art)) continue;
    const e: JournalEintrag = { t: l.t, gruppe: 'eigene', art: 'handlung', text: eingabeText(fall, l as Parameters<typeof eingabeText>[1]), n: n++ };
    if (daten && l.art === 'massnahme' && wirktAufWerte(fall, l.id)) {
      const v = vorherNachher(daten, l.t);
      if (v.length) e.vergleich = v;
    }
    out.push(e);
  }
  // Meldungen des Kerns (Ergebnis, Antworten, Ereignisse, Zustand); Ereignis-Logeinträge sind darin enthalten
  for (const m of z.meldungen) {
    // P11: eigene Nachrichten (richtung 'raus') stehen schon als Handlung aus dem Log im Journal
    if (m.richtung === 'raus') continue;
    out.push({ t: m.t, gruppe: GRUPPE_VON[m.art], art: m.art, text: m.text, ...(m.wichtig ? { wichtig: true } : {}), n: n++ });
  }
  // stabil sortieren: Zeit, dann Handlung vor Meldungen, dann Entstehung
  const rang = (e: JournalEintrag) => (e.art === 'handlung' ? 0 : 1);
  return out.sort((a, b) => a.t - b.t || rang(a) - rang(b) || a.n - b.n);
}

export function filtere(liste: readonly JournalEintrag[], f: JournalFilter): JournalEintrag[] {
  return f === 'alle' ? [...liste] : liste.filter((e) => e.gruppe === f);
}
