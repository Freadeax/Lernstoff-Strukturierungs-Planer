// Übersetzt Fehler der einzelnen Trainer in Fehlerheft-Einträge (rein, testbar).
// Gleiche Aufgaben aus verschiedenen Trainern landen im selben Eintrag:
// Rechenaufgaben über Typ und Stufe, Glossarfragen über Frageart und Begriff.

import { TYPEN, TYP_LABEL, zahl, type Aufgabe, type AufgabenTyp, type Stufe } from '../rechnen/aufgaben';
import type { Frage as DuellFrage } from '../duell/duell';
import type { Antwort as SimAntwort, SimFrage } from '../simulation/simulation';
import type { Aufgabe as FallAufgabe, Fallaufgabe } from '../krankheitsbilder/faelle';
import { ABSCHNITTE, aufgabenThemen } from '../krankheitsbilder/bewertung';
import { INSTRUMENTE } from '../assessment/instrumente';
import type { Vignette } from '../assessment/vignetten';
import type { VignettenErgebnis } from '../assessment/bewertung';
import type { NeuerFehler } from './fehlerheft';

const STUFE_LABEL: Record<Stufe, string> = { 1: 'Einstieg', 2: 'Station', 3: 'Profi' };
const THEMA = Object.fromEntries(TYPEN.map((t) => [t.typ, t.thema])) as Record<AufgabenTyp, string>;

/** Erste Zeile einer Frage, gekürzt: unterscheidet Einträge aus demselben Fall. */
const kurz = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')} …` : s);

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

/** Krankheitsbild-Fall: eine falsch gelöste Teilaufgabe, mit kurzem Fallbezug statt des ganzen Falltexts. */
export function ausKrankheitsbild(fall: Fallaufgabe, a: FallAufgabe, gewaehlt: number[], profil: { name: string; topicIds: string[] } | undefined): NeuerFehler {
  const richtig = a.optionen.flatMap((o, i) => (o.richtig ? [i] : []));
  const abschnitt = ABSCHNITTE.find((x) => x.id === a.abschnitt)?.label ?? a.abschnitt;
  return {
    id: `kh:${fall.id}:${a.id}`, quelle: 'krankheitsbilder', topicIds: aufgabenThemen(a, profil),
    titel: `${profil?.name ?? fall.titel} · ${kurz(a.frage)}`,
    frage: `${fall.text[0] ?? fall.titel} ${a.frage}`.trim(),
    deineAntwort: gewaehlt.length ? gewaehlt.map((i) => a.optionen[i]?.text ?? '').join(' · ') : 'keine Antwort',
    loesung: richtig.map((i) => a.optionen[i]!.text).join(' · '),
    erklaerung: [a.erklaerung, `Nachlesen im Steckbrief: ${abschnitt}`],
    wiederholung: { art: 'auswahl', optionen: a.optionen.map((o) => o.text), richtig, mehrfach: a.art === 'mehrfach' },
  };
}

/**
 * Assessment-Fallvignette: je falsch eingeschätztem Bereich ein Eintrag, dazu die Einstufung.
 * Wiederholt wird als Auswahl der Stufen, mit dem ganzen Falltext, weil die Hinweise verteilt stehen.
 */
export function ausAssessment(v: Vignette, e: VignettenErgebnis, eigeneKategorie: string | null): NeuerFehler[] {
  const instr = INSTRUMENTE[v.instrument];
  const topicIds = v.topicIds ?? instr.topicIds;
  const fall = `${v.titel} (${v.setting}): ${v.text.join(' ')}`;
  const stufe = (p: number, kurz: string) => `${p} · ${kurz}`;
  const items: NeuerFehler[] = e.zeilen.filter((z) => !z.richtig).map((z) => {
    const optionen = z.item.stufen.map((s) => stufe(s.punkte, s.kurz));
    const ist = z.item.stufen.find((s) => s.punkte === z.ist);
    return {
      id: `as:${v.id}:${z.item.id}`, quelle: 'assessment', topicIds,
      titel: `${instr.kurz} · ${v.titel} · ${z.item.label}`,
      frage: instr.ohneSumme ? `${fall} Welche Stufe trifft bei „${z.item.label}“ zu?` : `${fall} Wie viele Punkte gibt es bei „${z.item.label}“?`,
      deineAntwort: ist ? stufe(ist.punkte, ist.kurz) : 'keine Antwort',
      loesung: optionen[z.item.stufen.findIndex((s) => s.punkte === z.soll)] ?? String(z.soll),
      erklaerung: [z.begruendung],
      wiederholung: { art: 'auswahl', optionen, richtig: [z.item.stufen.findIndex((s) => s.punkte === z.soll)], mehrfach: false },
    };
  });
  if (!e.kategorieRichtig && e.kategorieSoll) {
    const optionen = instr.kategorien.map((k) => `${k.label} (${k.min === k.max ? k.min : `${k.min}–${k.max}`})`);
    const eigene = instr.kategorien.findIndex((k) => k.id === eigeneKategorie);
    items.push({
      id: `as:${v.id}:einstufung`, quelle: 'assessment', topicIds,
      titel: `${instr.kurz} · ${v.titel} · Einstufung`,
      frage: instr.ohneSumme ? `${fall} Wie wird das Ergebnis im ${instr.kurz} eingestuft?` : `${v.titel}: Die ${instr.kurz} ergibt ${e.summeSoll} Punkte. Wie wird das eingestuft?`,
      deineAntwort: eigene >= 0 ? optionen[eigene]! : 'keine Antwort',
      loesung: optionen[instr.kategorien.indexOf(e.kategorieSoll)]!,
      erklaerung: [v.fazit, instr.richtung],
      wiederholung: { art: 'auswahl', optionen, richtig: [instr.kategorien.indexOf(e.kategorieSoll)], mehrfach: false },
    });
  }
  return items;
}
