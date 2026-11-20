// Fachliche Freigabe der Praxisfälle im gemeinsamen Modell (src/ui/sim/freigabe.ts), damit der
// Prüfbogen (#/system/freigabe) und die Anzeige im Fall dieselbe Grundlage haben (Audit F-1).
// Der Fingerabdruck umfasst den ganzen Fall ohne den Freigabe-Stand: jede inhaltliche Änderung nach
// einer Prüfung macht die Prüfung ungültig.

import { freigabeDatum, type Freigabe, type Risiko, type Zielgruppe } from '../../../ui/sim/freigabe';
import { inhaltsFingerabdruck, mitErteilung } from '../../../ui/sim/freigabe-erteilt';
import type { Altersgruppe, FallV2, Setting } from './typen';

const SETTING: Record<Setting, string> = {
  krankenhaus: 'Krankenhaus, Normalstation', langzeit: 'stationäre Langzeitpflege', ambulant: 'ambulante Pflege', paediatrie: 'Kinderstation',
  psychiatrie: 'Psychiatrie', notaufnahme: 'Notaufnahme', schockraum: 'Schockraum', intensiv: 'Intensivstation', imc: 'IMC', aufwachraum: 'Aufwachraum',
};
const ALTER: Record<Altersgruppe, string> = {
  saeugling: 'Säugling', kleinkind: 'Kleinkind', schulkind: 'Schulkind', jugendlich: 'Jugendliche', erwachsen: 'Erwachsene', hochbetagt: 'Hochbetagte',
};
const zielgruppe = (a: Altersgruppe): Zielgruppe => (a === 'saeugling' ? 'neugeborene' : a === 'erwachsen' || a === 'hochbetagt' ? 'erwachsene' : 'kinder');

export const PRAXIS_PRUEFERROLLE = 'Pflegefachperson mit Praxisanleitung oder Lehrkraft; Medikamente und Notfall zusätzlich ärztliche Durchsicht';

/** Fingerabdruck eines Praxisfalls ohne Freigabe-Stand (Status, Prüfer, Datum). */
export const praxisFingerabdruck = (fall: FallV2) => inhaltsFingerabdruck({ ...fall, freigabe: { pruefpunkte: fall.freigabe.pruefpunkte } });

/** Praxisfall als Freigabe im gemeinsamen Modell, mit übernommener Prüfung. */
export function praxisFreigabe(fall: FallV2): Freigabe {
  const risiken: Risiko[] = [];
  if (fall.person.medikamentePlan.length) risiken.push('medikament');
  if (fall.spur === 'B') risiken.push('notfall');
  if (zielgruppe(fall.altersgruppe) !== 'erwachsene') risiken.push('kinder');
  const f: Freigabe = {
    status: fall.freigabe.status === 'geprueft' ? 'geprueft' : 'ungeprueft',
    lernziele: fall.lernziele,
    geltung: `${ALTER[fall.altersgruppe]}, ${SETTING[fall.setting]}, Ausbildungsstufen ${fall.geeignet.stufen.join(', ')}`,
    zielgruppe: zielgruppe(fall.altersgruppe),
    quellen: fall.quellen.map((q) => ({ titel: q.titel, stand: q.titel.match(/(?:19|20)\d{2}/)?.[0] ?? 'ohne Jahresangabe' })),
    prueferrolle: PRAXIS_PRUEFERROLLE,
    pruefung: fall.freigabe.status === 'geprueft' && fall.freigabe.datum ? { rolle: fall.freigabe.pruefer ?? 'Fachperson', datum: fall.freigabe.datum, art: 'fachperson' } : undefined,
    aenderungen: [{ datum: '2026-11-18', text: `Fall angelegt (Fassung ${fall.version})` }],
    risiken,
    pruefpunkte: fall.freigabe.pruefpunkte,
  };
  return mitErteilung(`praxis:${fall.id}`, praxisFingerabdruck(fall), f);
}

const cache = new WeakMap<FallV2, Freigabe>();
const gecacht = (fall: FallV2) => { let f = cache.get(fall); if (!f) { f = praxisFreigabe(fall); cache.set(fall, f); } return f; };

/** Kurzer Stand für den Hinweis im Fall: „fachlich geprüft am …“, „mit Unterrichtsmaterial abgeglichen“ oder „noch nicht geprüft“. */
export function praxisStandText(fall: FallV2): string {
  const f = gecacht(fall);
  if (f.status === 'geprueft' && f.pruefung) return `fachlich geprüft am ${freigabeDatum(f.pruefung.datum)}`;
  if (f.pruefung?.art === 'lehrmaterial') return `mit Unterrichtsmaterial abgeglichen am ${freigabeDatum(f.pruefung.datum)}, fachlich noch nicht geprüft`;
  return 'noch nicht fachlich geprüft';
}
