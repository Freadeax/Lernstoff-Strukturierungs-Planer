import { describe, expect, it } from 'vitest';
import { alsFehler, mitVertiefung, pruefeVertiefung, type Aufgabe } from './quiz';
import * as hygiene from '../hygiene/aufgaben';
import * as hygieneV from '../hygiene/vertiefung';
import * as anatomie from '../anatomie/aufgaben';
import * as anatomieV from '../anatomie/vertiefung';
import * as expertenstandards from '../expertenstandards/aufgaben';
import * as expertenstandardsV from '../expertenstandards/vertiefung';
import * as normwerte from '../normwerte/aufgaben';
import * as normwerteV from '../normwerte/vertiefung';
import * as notfall from '../notfall/aufgaben';
import * as notfallV from '../notfall/vertiefung';
import * as arzneimittel from '../arzneimittel/aufgaben';
import * as arzneimittelV from '../arzneimittel/vertiefung';
import * as labor from '../labortrainer/aufgaben';
import * as laborV from '../labortrainer/vertiefung';
import * as recht from '../recht/aufgaben';
import * as rechtV from '../recht/vertiefung';

const TRAINER: Array<[string, readonly Aufgabe[], Record<string, string[]>]> = [
  ['Hygiene', hygiene.ALLE_AUFGABEN, hygieneV.VERTIEFUNG],
  ['Anatomie', anatomie.ALLE_AUFGABEN, anatomieV.VERTIEFUNG],
  ['Expertenstandards', expertenstandards.ALLE_AUFGABEN, expertenstandardsV.VERTIEFUNG],
  ['Normwerte', normwerte.ALLE_AUFGABEN, normwerteV.VERTIEFUNG],
  ['Notfall', notfall.ALLE_AUFGABEN, notfallV.VERTIEFUNG],
  ['Arzneimittel', arzneimittel.ALLE_AUFGABEN, arzneimittelV.VERTIEFUNG],
  ['Labor', labor.ALLE_AUFGABEN, laborV.VERTIEFUNG],
  ['Recht', recht.ALLE_AUFGABEN, rechtV.VERTIEFUNG],
];

describe('Vertiefung („Mehr verstehen“) in allen Trainern', () => {
  it.each(TRAINER)('%s: jede Aufgabe hat eine eigene Vertiefung, keine ist verwaist', (_, aufgaben, v) => {
    expect(pruefeVertiefung(aufgaben, v)).toEqual([]);
    expect(aufgaben.every((a) => (a.vertiefung?.length ?? 0) > 0)).toBe(true);
  });

  it('mitVertiefung lässt die Aufgaben sonst unverändert', () => {
    const a: Aufgabe = { id: 'x', art: 'auswahl', topicIds: ['t'], titel: 'T', frage: 'F?', optionen: ['a', 'b'], richtig: [0], mehrfach: false, erklaerung: ['E'] };
    const { b } = mitVertiefung({ b: [a] }, { x: ['Hintergrund mit genug Text, damit er als Vertiefung zählt.'] });
    expect(b[0]).toEqual({ ...a, vertiefung: ['Hintergrund mit genug Text, damit er als Vertiefung zählt.'] });
    expect(a.vertiefung).toBeUndefined();
  });

  it('pruefeVertiefung findet fehlende, verwaiste und wiederholte Einträge', () => {
    const a: Aufgabe = { id: 'x', art: 'auswahl', topicIds: ['t'], titel: 'T', frage: 'F?', optionen: ['a', 'b'], richtig: [0], mehrfach: false, erklaerung: ['Eine Erklärung, die lang genug für die Prüfung ist.'] };
    expect(pruefeVertiefung([a], {})).toEqual(['x: keine Vertiefung']);
    expect(pruefeVertiefung([a], { x: ['Eine Erklärung, die lang genug für die Prüfung ist.'], y: ['z'] })).toEqual(['y: Vertiefung ohne Aufgabe', 'x: Vertiefung wiederholt die Erklärung']);
  });

  it('die Vertiefung wandert mit ins Fehlerheft', () => {
    const a = hygiene.ALLE_AUFGABEN.find((x) => x.id === 'basis.recapping')!;
    const [f] = alsFehler(a, { art: 'auswahl', wahl: a.art === 'auswahl' ? [a.optionen.findIndex((_, i) => !a.richtig.includes(i))] : [] }, 'hygiene');
    expect(f?.erklaerung).toEqual([...a.erklaerung, ...a.vertiefung!]);
  });
});
