// Ergebnis einer Pflegeplanung für den Lernplan: je Schritt das passende Pflegeprozess-Thema,
// dazu die fachlichen Themen des Falls. Die Bewertung von Claude hat Vorrang vor der Checkliste,
// weil sie auch die fachliche Richtigkeit beurteilt. Gespeichert wird über lernplan/trainer.ts
// (Quelle „trainer“, je Thema und Tag zählt die erste Meldung).
import type { ThemenErgebnis } from '../lernplan/trainer';
import type { PlanFall } from './faelle';
import type { KiRueckmeldung } from './claude';
import { PFLICHT } from './plan';
import { SCHRITT_THEMA, type Pruefergebnis } from './pruefung';

export function lernplanErgebnisse(fall: PlanFall, ergebnis: Pruefergebnis, ki?: KiRueckmeldung | null): ThemenErgebnis[] {
  const gesamt = ki ? ki.prozent : ergebnis.prozent;
  const werte = new Map<string, number>([['thema.pp.prozess', gesamt]]);
  for (const s of PFLICHT) {
    const id = SCHRITT_THEMA[s];
    if (!id) continue;
    werte.set(id, ki ? ki.schritte.find((x) => x.schritt === s)!.prozent : ergebnis.schritte.find((x) => x.schritt === s)!.prozent);
  }
  for (const id of fall.topicIds) if (!werte.has(id)) werte.set(id, gesamt);
  return [...werte].map(([topicId, scorePercent]) => ({ topicId, scorePercent, anzahl: 1 }));
}
