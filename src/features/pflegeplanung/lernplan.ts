// Ergebnis einer Pflegeplanung an den Lernplan melden: je Schritt das passende Pflegeprozess-Thema,
// dazu die fachlichen Themen des Falls. Die Bewertung von Claude hat Vorrang vor der Checkliste,
// weil sie auch die fachliche Richtigkeit beurteilt.
import type { Topic } from '../../core/types';
import { logReview } from '../lernplan/store';
import type { PlanFall } from './faelle';
import type { KiRueckmeldung } from './claude';
import { PFLICHT } from './plan';
import { SCHRITT_THEMA, type Pruefergebnis } from './pruefung';

export interface LernplanEintrag { topic: Topic; prozent: number }

export function lernplanEintraege(topics: Topic[], fall: PlanFall, ergebnis: Pruefergebnis, ki?: KiRueckmeldung | null): LernplanEintrag[] {
  const gesamt = ki ? ki.prozent : ergebnis.prozent;
  const werte = new Map<string, number>([['thema.pp.prozess', gesamt]]);
  for (const s of PFLICHT) {
    const id = SCHRITT_THEMA[s];
    if (!id) continue;
    werte.set(id, ki ? ki.schritte.find((x) => x.schritt === s)!.prozent : ergebnis.schritte.find((x) => x.schritt === s)!.prozent);
  }
  for (const id of fall.topicIds) if (!werte.has(id)) werte.set(id, gesamt);
  return [...werte].flatMap(([id, prozent]) => {
    const topic = topics.find((t) => t.id === id);
    return topic ? [{ topic, prozent }] : [];
  });
}

export async function meldeAnLernplan(eintraege: LernplanEintrag[]) {
  for (const e of eintraege) await logReview(e.topic, 'offene_frage', { scorePercent: e.prozent });
}
