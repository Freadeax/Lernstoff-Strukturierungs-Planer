// Übersetzt Fehler der einzelnen Trainer in Fehlerheft-Einträge (rein, testbar).
// Gleiche Aufgaben aus verschiedenen Trainern landen im selben Eintrag:
// Rechenaufgaben über Typ und Stufe, Glossarfragen über Frageart und Begriff.

import { TYPEN, TYP_LABEL, zahl, type Aufgabe, type AufgabenTyp, type Stufe } from '../rechnen/aufgaben';
import type { Frage as DuellFrage } from '../duell/duell';
import type { Antwort as SimAntwort, SimFrage } from '../simulation/simulation';
import type { NeuerFehler } from './fehlerheft';

const STUFE_LABEL: Record<Stufe, string> = { 1: 'Einstieg', 2: 'Station', 3: 'Profi' };
const THEMA = Object.fromEntries(TYPEN.map((t) => [t.typ, t.thema])) as Record<AufgabenTyp, string>;

const rechenId = (typ: AufgabenTyp, stufe: Stufe) => `rechnen:${typ}:${stufe}`;
const begriffId = (fragenId: string) => `begriff:${fragenId}`;

function ausZahl(typ: AufgabenTyp, stufe: Stufe, frage: string, eingabe: string, loesung: number, einheit: string, schritte: string[], quelle: NeuerFehler['quelle']): NeuerFehler {
  return {
    id: rechenId(typ, stufe), quelle, topicIds: [THEMA[typ]],
    titel: `${TYP_LABEL[typ]} · ${STUFE_LABEL[stufe]}`,
    frage, deineAntwort: eingabe.trim() || '–', loesung: `${zahl(loesung)} ${einheit}`, erklaerung: schritte,
    wiederholung: { art: 'rechnen', typ, stufe },
  };
}

export function ausRechentrainer(a: Aufgabe, eingabe: string): NeuerFehler {
  return ausZahl(a.typ, a.stufe, a.frage, eingabe, a.loesung, a.einheit, a.schritte, 'rechnen');
}

export function ausDuell(f: DuellFrage, gewaehlt: number | null): NeuerFehler {
  return {
    id: begriffId(f.id), quelle: 'duell', topicIds: f.karte.themen,
    titel: f.karte.begriff,
    frage: f.frage, deineAntwort: gewaehlt === null ? 'keine Antwort' : (f.optionen[gewaehlt] ?? '–'),
    loesung: f.optionen[f.richtig] ?? f.karte.begriff,
    erklaerung: [`${f.karte.begriff}${f.karte.abkuerzung && f.karte.abkuerzung !== f.karte.begriff ? ` (${f.karte.abkuerzung})` : ''}: ${f.karte.erklaerung}`],
    wiederholung: { art: 'auswahl', optionen: f.optionen, richtig: [f.richtig], mehrfach: false },
  };
}

/** Prüfungssimulation: Auswahl- und Rechenfragen. Offene Fragen bleiben draußen (keine sichere Auto-Wertung). */
export function ausSimulation(f: SimFrage, a: SimAntwort | undefined): NeuerFehler | null {
  if (f.art === 'zahl') {
    // id: rechnen:<typ>:<stufe>:<seed>
    const [, typ, stufe] = f.id.split(':');
    if (!TYPEN.some((t) => t.typ === typ) || !['1', '2', '3'].includes(stufe ?? '')) return null;
    return ausZahl(typ as AufgabenTyp, Number(stufe) as Stufe, f.frage, a?.text ?? '', f.loesung, f.einheit, f.schritte, 'simulation');
  }
  if (f.art !== 'auswahl') return null;
  const wahl = a?.wahl ?? [];
  const id = f.id.startsWith('glossar:') ? begriffId(f.id.slice('glossar:'.length)) : `simulation:${f.id}`;
  return {
    id, quelle: 'simulation', topicIds: f.topicId ? [f.topicId] : [],
    titel: f.hinweis ?? 'Prüfungsfrage',
    frage: f.frage,
    deineAntwort: wahl.length ? wahl.map((i) => f.optionen[i] ?? '').join(' · ') : 'keine Antwort',
    loesung: f.richtig.map((i) => f.optionen[i] ?? '').join(' · '),
    erklaerung: [
      ...(f.erklaerung ? [f.erklaerung] : []),
      ...(f.begruendungen ?? []).map((b, i) => (b ? `${f.optionen[i]}: ${b}` : '')).filter(Boolean),
    ],
    wiederholung: { art: 'auswahl', optionen: f.optionen, richtig: f.richtig, mehrfach: f.mehrfach },
  };
}
