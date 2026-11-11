// „Warum zuerst?“: kurze Begründung, warum eine Voraussetzung vor einem Thema kommt.
// Der Katalog nennt nur die Abhängigkeit, nicht den Grund. Die Begründung entsteht hier aus dem Fachpaar
// (z. B. Anatomie → Krankheitslehre) und aus Fachbegriffen des Voraussetzungsthemas. Sie ist eine Lesehilfe,
// keine fachlich geprüfte Aussage, und sagt das auch.

import type { Topic } from '../../core/types';

export interface Warum { text: string; begriffe: string[]; hinweis: string }

const fach = (id: string) => id.replace(/^fach\./, '');

/** Fachpaare (Voraussetzung → Thema) mit Begründung. „*“ = jedes Fach. */
const REGELN: Array<[string, string, (vor: string, t: string) => string]> = [
  ['anatomie', 'krankheitslehre', (v, t) => `Eine Krankheit verstehst du als Abweichung vom Gesunden. Erst Aufbau und Funktion („${v}“), dann was dabei gestört ist („${t}“).`],
  ['anatomie', 'beobachtung', (v) => `Zeichen und Messwerte ergeben erst Sinn, wenn du weißt, wie „${v}“ im gesunden Körper arbeitet.`],
  ['anatomie', '*', (v) => `Die Maßnahme setzt am Körper an. Wer „${v}“ kennt, kann sie begründen statt sie nur auszuführen.`],
  ['krankheitslehre', '*', (v, t) => `Für „${t}“ musst du das Krankheitsbild aus „${v}“ erkennen und seine Folgen einschätzen können.`],
  ['beobachtung', '*', (v) => `Erst sicher beobachten und einschätzen („${v}“), dann entscheiden und handeln.`],
  ['pflegeprozess', '*', (v) => `Die Arbeit folgt dem Pflegeprozess aus „${v}“: Informationen, Probleme und Ressourcen, Ziele, Maßnahmen, Evaluation.`],
  ['recht', '*', (v) => `„${v}“ legt den Rahmen fest: was du darfst, wozu du verpflichtet bist und was du dokumentieren musst.`],
  ['kommunikation', '*', (v) => `Gespräch, Beratung und Haltung aus „${v}“ sind hier das Werkzeug.`],
  ['pflegehandeln', '*', (v) => `Die Handgriffe und Abläufe aus „${v}“ werden hier vorausgesetzt.`],
  ['prophylaxen', '*', (v) => `Risiken einschätzen und vorbeugen („${v}“) gehört hier schon dazu.`],
  ['fachsprache', '*', (v) => `Die Fachbegriffe aus „${v}“ werden hier ohne Erklärung benutzt.`],
];

export function warumZuerst(vor: Topic, thema: Topic, art: 'voraussetzung' | 'teil', begriffe: string[] = []): Warum {
  const hinweis = 'Begründung aus Fach und Katalog abgeleitet, nicht einzeln fachlich geprüft.';
  const b = begriffe.slice(0, 4);
  if (art === 'teil') {
    return { text: `„${thema.name}“ ist ein Teil von „${vor.name}“. Der Überblick kommt zuerst, die Einzelheiten danach.`, begriffe: b, hinweis };
  }
  const a = fach(vor.subjectId), z = fach(thema.subjectId);
  if (a === z) {
    return { text: `„${thema.name}“ baut im selben Fach auf „${vor.name}“ auf. Grundbegriffe und Zusammenhänge daraus werden vorausgesetzt.`, begriffe: b, hinweis };
  }
  const regel = REGELN.find(([x, y]) => x === a && y === z) ?? REGELN.find(([x, y]) => x === a && y === '*');
  const text = regel ? regel[2](vor.name, thema.name) : `Der Katalog nennt „${vor.name}“ als Grundlage für „${thema.name}“.`;
  return { text, begriffe: b, hinweis };
}
