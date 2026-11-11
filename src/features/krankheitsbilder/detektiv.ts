// Krankheitsbild-Detektiv: Aufgaben, die aus den Steckbriefen des Fachmoduls erzeugt werden.
// Zwei Arten: aus Beobachtungen auf das Krankheitsbild schließen (Stufe 2) und Beschreibungen den
// Krankheitsbildern zuordnen (Stufe 1). Eine automatische Frage nach Komplikationen gibt es bewusst nicht:
// Allgemeine Komplikationen (Thrombose, Pneumonie, Pflegebedürftigkeit …) passen zu fast jedem Bild,
// erzeugte Ablenker wären oft fachlich falsch. Läuft über den Übungskern
// (src/features/quiz), damit Rückmeldung, Fehlerheft, Lernplan und Animationen dieselben sind.
// Inhalte sind Katalogwissen des Fachmoduls und werden als ergänzend gekennzeichnet (Belegregel).

import type { DiseaseProfile } from '../../modules/catalog-types';
import { mische, type Aufgabe, type AuswahlAufgabe, type ZuordnenAufgabe } from '../quiz/quiz';

export type DetektivArt = 'symptome' | 'zuordnen';

export const DETEKTIV_HINWEIS = 'Katalogwissen aus den Steckbriefen, ergänzend. Bei Abweichungen gilt dein Unterrichtsmaterial.';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Namen, unter denen ein Krankheitsbild im Text auftauchen kann: Name, Name ohne Klammerzusatz,
 * Synonyme und das erste Wort des Namens, wenn es ein Hauptwort mit mindestens sechs Buchstaben ist.
 */
const BEIWORT = /^(chronisch|akut|tief|proximal|peripher|arteriell|multipl|kolorektal|morbus|koronar)/i;

export function namenVon(p: Pick<DiseaseProfile, 'name' | 'synonyms'>): string[] {
  const ohneKlammer = p.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const kern = ohneKlammer.split(/\s+/).find((w) => !BEIWORT.test(w)) ?? '';
  // Hauptwort und sein Stamm, damit auch „epileptisch“ zu „Epilepsie“ oder „diabetisch“ zu „Diabetes“ verdeckt wird
  const haupt = /^[A-ZÄÖÜ][a-zäöüß]{5,}$/.test(kern) ? [kern, kern.slice(0, Math.max(6, kern.length - 3))] : [];
  const namen = [p.name, ohneKlammer, ...(p.synonyms ?? []), ...haupt];
  return [...new Set(namen.filter((n) => n.length >= 2))].sort((a, b) => b.length - a.length);
}

/** Ersetzt Namen und Synonyme im Text durch „[…]“, damit der Text die Lösung nicht verrät. */
export function maskiere(text: string, p: Pick<DiseaseProfile, 'name' | 'synonyms'>): string {
  let out = text;
  for (const n of namenVon(p)) out = out.replace(new RegExp(`${esc(n)}[\\wäöüß-]*`, 'gi'), '[…]');
  return out;
}

/** Wörter ab sechs Buchstaben, klein: grober Inhaltsabdruck für den Überschneidungstest. */
function stichwoerter(texte: readonly string[]): Set<string> {
  return new Set(texte.flatMap((t) => t.toLowerCase().match(/[a-zäöüß]{6,}/g) ?? []));
}

const teilt = (a: Set<string>, b: Set<string>) => [...a].some((w) => b.has(w));

function vertiefung(p: DiseaseProfile): string[] {
  return [`${p.name}: ${p.definition}`, ...(p.merksatz ? [`Merksatz: ${p.merksatz}`] : []), DETEKTIV_HINWEIS];
}

/** Aus drei Beobachtungen auf das Krankheitsbild schließen. Ablenker teilen keine dieser Beobachtungen. */
export function symptomAufgabe(p: DiseaseProfile, alle: readonly DiseaseProfile[], zufall: () => number): AuswahlAufgabe | null {
  const beobachtungen = mische(p.symptome, zufall).slice(0, 3).map((s) => maskiere(s, p));
  if (beobachtungen.length < 3) return null;
  const kern = stichwoerter(beobachtungen);
  const ablenker = mische(alle.filter((x) => x.id !== p.id && !teilt(kern, stichwoerter(x.symptome))), zufall).slice(0, 3);
  if (ablenker.length < 3) return null;
  return {
    id: `detektiv.symptome.${p.id}`, art: 'auswahl', stufe: 2, topicIds: p.topicIds,
    titel: 'Detektiv: Beobachtungen',
    frage: `Welches Krankheitsbild passt am besten zu diesen Beobachtungen?\n• ${beobachtungen.join('\n• ')}`,
    optionen: [p.name, ...ablenker.map((x) => x.name)], richtig: [0], mehrfach: false,
    erklaerung: [`Diese Beobachtungen stehen im Steckbrief „${p.name}“ unter Symptome.`, ...ablenker.map((x) => `${x.name}: ${x.definition}`).slice(0, 1)],
    vertiefung: vertiefung(p),
  };
}

/** Vier Beschreibungen (Definitionen) den Krankheitsbildern zuordnen. */
export function zuordnenAufgabe(gruppe: readonly DiseaseProfile[]): ZuordnenAufgabe | null {
  if (gruppe.length < 3) return null;
  const kurz = (p: DiseaseProfile) => { const s = maskiere(p.definition, p); const satz = s.split(/(?<=\.)\s/)[0] ?? s; return satz.length > 180 ? `${satz.slice(0, 177)}…` : satz; };
  return {
    id: `detektiv.zuordnen.${gruppe.map((p) => p.id).sort().join('+')}`, art: 'zuordnen', stufe: 1,
    topicIds: [...new Set(gruppe.flatMap((p) => p.topicIds))],
    titel: 'Detektiv: Beschreibungen',
    frage: 'Welches Krankheitsbild ist jeweils beschrieben?',
    paare: gruppe.map((p) => ({ links: kurz(p), rechts: p.name })),
    erklaerung: gruppe.map((p) => `${p.name}: ${p.definition}`),
    vertiefung: [DETEKTIV_HINWEIS],
  };
}

/**
 * Stellt eine Detektiv-Runde zusammen: abwechselnd zwei Beobachtungs-Aufgaben und eine Zuordnung, jedes
 * Krankheitsbild höchstens einmal als Hauptfigur. `nur` beschränkt auf bestimmte Krankheitsbilder (z. B. ein Thema).
 */
export function detektivRunde(alle: readonly DiseaseProfile[], anzahl: number, zufall: () => number = Math.random, nur?: readonly string[]): Aufgabe[] {
  const pool = nur?.length ? alle.filter((p) => nur.includes(p.id)) : alle;
  const out: Aufgabe[] = [];
  let i = 0;
  for (const p of mische(pool, zufall)) {
    if (out.length >= anzahl) break;
    const art: DetektivArt = i++ % 3 === 2 ? 'zuordnen' : 'symptome';
    const a = art === 'zuordnen'
      ? zuordnenAufgabe(mische([p, ...mische(alle.filter((x) => x.id !== p.id), zufall).slice(0, 3)], zufall))
      : symptomAufgabe(p, alle, zufall);
    if (a) out.push(a);
  }
  return out;
}
