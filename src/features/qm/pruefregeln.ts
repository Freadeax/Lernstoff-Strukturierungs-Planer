// Formale Prüfregeln für Aufgaben (Item-Writing-Flaws). Vorbild sind die Leitfäden zum Schreiben von
// Prüfungsfragen in der Medizin- und Pflegeausbildung (NBME Item Writing Guide, Haladyna/Downing):
// Fehler in der Bauform machen eine Frage leichter oder schwerer, als es das Wissen rechtfertigt.
// Die Regeln sind bewusst vorsichtig: Sie liefern Hinweise für die Überarbeitung, keine Urteile über
// die fachliche Richtigkeit. Die fachliche Prüfung bleibt beim Menschen (Prüfstand).

import type { Aufgabe, AuswahlAufgabe, FallSchritt } from '../quiz/quiz';

export type RegelId =
  | 'alle-keine' | 'verneinung' | 'laenge' | 'absolut' | 'zwei-optionen' | 'begruendung-knapp' | 'wortecho' | 'ohne-thema-transfer';

export interface Regel {
  id: RegelId;
  titel: string;
  /** Warum das ein Problem ist, in einem Satz. */
  warum: string;
  /** Was man stattdessen tut. */
  besser: string;
  /** fehler = sollte nie vorkommen (Test hält es bei null); hinweis = ansehen und abwägen. */
  schwere: 'fehler' | 'hinweis';
}

export const REGELN: Record<RegelId, Regel> = {
  'alle-keine': {
    id: 'alle-keine', schwere: 'fehler', titel: '„Alle“ oder „keine der genannten“ als Option',
    warum: 'Wer zwei richtige Optionen erkennt, weiß die Lösung, ohne die übrigen zu kennen. Die Frage misst dann Testgeschick statt Wissen.',
    besser: 'Als Mehrfachauswahl stellen oder eine echte vierte Option formulieren.',
  },
  verneinung: {
    id: 'verneinung', schwere: 'hinweis', titel: 'Verneinte Frage ohne Hervorhebung',
    warum: 'Ein überlesenes „nicht“ kehrt die Frage um. In Prüfungen führt das zu Fehlern, die nichts mit dem Wissen zu tun haben.',
    besser: 'Positiv fragen („Welche Maßnahme ist angezeigt?“) oder die Verneinung in Großbuchstaben schreiben (NICHT, KEIN).',
  },
  laenge: {
    id: 'laenge', schwere: 'hinweis', titel: 'Lösung deutlich länger als die Ablenker',
    warum: 'Die längste, genaueste Antwort ist auffällig oft die richtige. Geübte Lernende raten sie.',
    besser: 'Ablenker gleich lang und gleich genau formulieren oder die Lösung kürzen.',
  },
  absolut: {
    id: 'absolut', schwere: 'hinweis', titel: 'Absolute Begriffe nur in den Ablenkern',
    warum: '„Immer“, „nie“, „ausschließlich“ markieren falsche Antworten. Wer das weiß, streicht sie ohne Fachwissen.',
    besser: 'Absolute Begriffe vermeiden oder auch in richtigen Optionen verwenden, wo sie fachlich stimmen.',
  },
  'zwei-optionen': {
    id: 'zwei-optionen', schwere: 'hinweis', titel: 'Nur zwei Antwortmöglichkeiten',
    warum: 'Bei zwei Optionen liegt die Ratewahrscheinlichkeit bei 50 Prozent; ein richtiges Ergebnis sagt wenig.',
    besser: 'Mindestens drei plausible Ablenker ergänzen oder als Zuordnung stellen.',
  },
  'begruendung-knapp': {
    id: 'begruendung-knapp', schwere: 'hinweis', titel: 'Begründung sehr knapp',
    warum: 'Nach einem Fehler hilft nur eine Begründung, die erklärt, warum die Lösung stimmt und die gewählte Antwort nicht.',
    besser: 'Die Begründung um das „Warum“ ergänzen, z. B. Mechanismus, Risiko oder Regel.',
  },
  wortecho: {
    id: 'wortecho', schwere: 'hinweis', titel: 'Wortecho zwischen Frage und Lösung',
    warum: 'Taucht ein seltenes Wort aus der Frage nur in der richtigen Option wieder auf, verrät es die Lösung.',
    besser: 'Das Wort in der Lösung umschreiben oder auch in Ablenkern verwenden.',
  },
  'ohne-thema-transfer': {
    id: 'ohne-thema-transfer', schwere: 'hinweis', titel: 'Fall ohne Lageschilderung',
    warum: 'Ein Fallschritt ohne neue Information prüft Wissen, keinen Transfer.',
    besser: 'Jeder Schritt bringt eine neue Beobachtung, auf die reagiert werden muss.',
  },
};

export interface Befund { regel: RegelId; aufgabeId: string; stelle?: string; detail: string }

const ALLE_KEINE = /\b(alle|keine) (der |oben |obigen )?(genannten|vorherigen|Antworten|Aussagen)\b|\balle (Antworten|Aussagen) (sind|stimmen)\b/i;
const VERNEINUNG = /\b(nicht|kein(?:e|en|er|es)?|außer|falsch)\b/;
const ABSOLUT = /\b(immer|nie|niemals|ausschließlich|grundsätzlich nie|stets|keinesfalls|auf keinen Fall|jede[rsn]?|sämtliche)\b/i;

// Häufige Wörter, die kein Echo verraten (Fachsprache der Aufgaben selbst)
const STOPP = new Set(['patientin', 'patienten', 'bewohnerin', 'bewohner', 'pflegefachperson', 'pflegekraft', 'maßnahme', 'maßnahmen', 'welche', 'welcher', 'welches', 'richtig', 'zutreffend', 'zutreffenden', 'aussagen', 'aussage', 'antwort', 'zuerst', 'wichtig', 'wichtigste', 'folgende', 'folgenden', 'zwischen', 'während', 'nachdem', 'gegenüber', 'zeigt', 'sinnvoll', 'besonders']);

const woerter = (s: string) => (s.toLowerCase().match(/[a-zäöüß]{7,}/g) ?? []).filter((w) => !STOPP.has(w));

/** Prüft eine Auswahl (eigene Frage oder Fallschritt). */
function pruefeAuswahl(id: string, frage: string, optionen: readonly string[], richtig: readonly number[], mehrfach: boolean, stelle?: string): Befund[] {
  const out: Befund[] = [];
  const b = (regel: RegelId, detail: string) => out.push({ regel, aufgabeId: id, stelle, detail });
  const ak = optionen.find((o) => ALLE_KEINE.test(o));
  if (ak) b('alle-keine', `Option „${ak}“`);
  // Verneinung: nur, wenn sie klein geschrieben ist (NICHT / KEIN gelten als hervorgehoben)
  const v = frage.match(VERNEINUNG);
  if (v && !/\b(NICHT|KEIN|KEINE|AUSSER|FALSCH)\b/.test(frage)) b('verneinung', `„${v[0]}“ in der Frage`);
  if (!mehrfach && optionen.length === 2) b('zwei-optionen', 'Zwei Optionen, eine richtig');
  if (!mehrfach && richtig.length === 1 && optionen.length >= 3) {
    const l = optionen[richtig[0]!]!.length;
    const andere = optionen.filter((_, i) => i !== richtig[0]).map((o) => o.length);
    const max = Math.max(...andere);
    const schnitt = andere.reduce((s, x) => s + x, 0) / andere.length;
    if (l > max * 1.3 && l > schnitt * 1.8 && l - max >= 25) b('laenge', `Lösung ${l} Zeichen, längster Ablenker ${max}`);
    const absolutFalsch = optionen.filter((o, i) => !richtig.includes(i) && ABSOLUT.test(o)).length;
    const absolutRichtig = richtig.some((i) => ABSOLUT.test(optionen[i]!));
    if (absolutFalsch >= 2 && !absolutRichtig) b('absolut', `${absolutFalsch} Ablenker mit „immer/nie/ausschließlich …“, Lösung ohne`);
    const fw = new Set(woerter(frage));
    const loes = woerter(optionen[richtig[0]!]!).filter((w) => fw.has(w));
    const echo = loes.find((w) => !optionen.some((o, i) => i !== richtig[0] && o.toLowerCase().includes(w)));
    if (echo) b('wortecho', `„${echo}“ steht in Frage und Lösung, in keinem Ablenker`);
  }
  return out;
}

/** Alle formalen Befunde einer Aufgabe. */
export function pruefeAufgabe(a: Aufgabe): Befund[] {
  const out: Befund[] = [];
  if (a.art === 'auswahl') out.push(...pruefeAuswahl(a.id, a.frage, a.optionen, a.richtig, a.mehrfach));
  if (a.art === 'fall') {
    a.schritte.forEach((s: FallSchritt, k) => {
      out.push(...pruefeAuswahl(a.id, s.frage, s.optionen, s.richtig, s.mehrfach, `Schritt ${k + 1}`));
      if (k > 0 && s.lage.trim().length < 15) out.push({ regel: 'ohne-thema-transfer', aufgabeId: a.id, stelle: `Schritt ${k + 1}`, detail: 'Lage fehlt oder ist sehr kurz' });
    });
  }
  const begruendung = a.erklaerung.join(' ').trim().length;
  if (begruendung < 60) out.push({ regel: 'begruendung-knapp', aufgabeId: a.id, detail: `${begruendung} Zeichen Begründung` });
  return out;
}

export const pruefeAlle = (aufgaben: readonly Aufgabe[]): Befund[] => aufgaben.flatMap(pruefeAufgabe);

/** Für Tests und Statistik: Befunde je Regel zählen. */
export function zaehleRegeln(befunde: readonly Befund[]): Record<RegelId, number> {
  const out = Object.fromEntries(Object.keys(REGELN).map((k) => [k, 0])) as Record<RegelId, number>;
  for (const b of befunde) out[b.regel]++;
  return out;
}

export type { AuswahlAufgabe };

/**
 * Wie oft ist bei Einfachauswahl die richtige Antwort die längste? Zufall wäre etwa 1/Optionenzahl
 * (bei vier Optionen 25 %). Deutlich mehr heißt: Geübte können raten (Längen-Hinweis über den ganzen Trainer).
 */
export function laengenQuote(aufgaben: readonly Aufgabe[]): { n: number; laengste: number; quote: number; zufall: number } {
  const fragen: Array<{ optionen: readonly string[]; richtig: number }> = [];
  for (const a of aufgaben) {
    if (a.art === 'auswahl' && !a.mehrfach && a.optionen.length >= 3) fragen.push({ optionen: a.optionen, richtig: a.richtig[0]! });
    if (a.art === 'fall') for (const s of a.schritte) if (!s.mehrfach && s.optionen.length >= 3) fragen.push({ optionen: s.optionen, richtig: s.richtig[0]! });
  }
  const laengste = fragen.filter((f) => f.optionen[f.richtig]!.length > Math.max(...f.optionen.filter((_, i) => i !== f.richtig).map((o) => o.length))).length;
  const zufall = fragen.reduce((s, f) => s + 1 / f.optionen.length, 0) / Math.max(1, fragen.length);
  return { n: fragen.length, laengste, quote: fragen.length ? laengste / fragen.length : 0, zufall };
}
