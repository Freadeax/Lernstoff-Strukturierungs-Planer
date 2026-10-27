import { describe, expect, it } from 'vitest';
import { erzeuge } from '../rechnen/aufgaben';
import { pflegeModule } from '../../modules/pflege';
import { erzeugeRunde, karten } from '../duell/duell';
import { katalog, rechenFragen } from '../simulation/simulation';
import { auswahlRichtig, faellig, MAX_EINTRAEGE, merke, mischeAuswahl, nachThema, ueberblick, wiederholt, type NeuerFehler } from './fehlerheft';
import { ausDuell, ausRechentrainer, ausSimulation } from './quellen';

const tag = (t: string) => new Date(`${t}T10:00:00`);
const rechenFehler = (seed = 1): NeuerFehler => ausRechentrainer(erzeuge('mgkg', 2, seed), '7');

describe('Fehlerheft', () => {
  it('fasst gleiche Rechentypen zu einem Eintrag zusammen und zählt hoch', () => {
    let l = merke([], [rechenFehler(1)], tag('2026-10-01'));
    l = merke(l, [rechenFehler(2)], tag('2026-10-02'));
    expect(l).toHaveLength(1);
    expect(l[0]!.id).toBe('rechnen:mgkg:2');
    expect(l[0]!.fehlerAnzahl).toBe(2);
    expect(l[0]!.erfasst).toBe('2026-10-01');
    expect(l[0]!.letzterFehler).toBe('2026-10-02');
    expect(l[0]!.wiederholung).toEqual({ art: 'rechnen', typ: 'mgkg', stufe: 2 });
  });

  it('heute gemachte Fehler sind erst ab morgen fällig', () => {
    const l = merke([], [rechenFehler()], tag('2026-10-01'));
    expect(faellig(l, tag('2026-10-01'))).toHaveLength(0);
    expect(faellig(l, tag('2026-10-01'), true)).toHaveLength(1);
    expect(faellig(l, tag('2026-10-02'))).toHaveLength(1);
  });

  it('behoben erst nach zwei richtigen Wiederholungen an verschiedenen Tagen', () => {
    let l = merke([], [rechenFehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    expect(l[0]!.treffer).toEqual(['2026-10-02']);
    expect(l[0]!.behoben).toBeUndefined();
    expect(faellig(l, tag('2026-10-02'))).toHaveLength(0);
    l = wiederholt(l, id, true, '1', tag('2026-10-04'));
    expect(l[0]!.behoben).toBe('2026-10-04');
    expect(ueberblick(l, tag('2026-10-04'))).toMatchObject({ offen: 0, behoben: 1 });
  });

  it('ein neuer Fehler setzt den Fortschritt zurück (Rückfall)', () => {
    let l = merke([], [rechenFehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    l = wiederholt(l, id, true, '1', tag('2026-10-03'));
    expect(l[0]!.behoben).toBeDefined();
    l = merke(l, [rechenFehler(5)], tag('2026-10-05'));
    expect(l[0]!.behoben).toBeUndefined();
    expect(l[0]!.treffer).toEqual([]);
    l = wiederholt(l, id, false, '3', tag('2026-10-06'));
    expect(l[0]!.fehlerAnzahl).toBe(3);
    expect(l[0]!.deineAntwort).toBe('3');
  });

  it('häufige Fehler kommen zuerst, Themen werden gruppiert', () => {
    const k = karten(pflegeModule);
    const frage = erzeugeRunde(k, k, ['definition'], 1, 3)[0]!;
    let l = merke([], [rechenFehler(), ausDuell(frage, null)], tag('2026-10-01'));
    l = merke(l, [rechenFehler(9)], tag('2026-10-01'));
    expect(faellig(l, tag('2026-10-02'))[0]!.id).toBe('rechnen:mgkg:2');
    expect(nachThema(l).flatMap((g) => g.fehler).length).toBeGreaterThanOrEqual(2);
  });

  it('hält die Liste klein und wirft behobene zuerst raus', () => {
    const viele: NeuerFehler[] = Array.from({ length: MAX_EINTRAEGE + 5 }, (_, i) => ({ ...rechenFehler(), id: `x:${i}` }));
    const l = merke([], viele, tag('2026-10-01'));
    expect(l).toHaveLength(MAX_EINTRAEGE);
  });

  it('gemischte Auswahl behält die richtige Antwort', () => {
    const w = { art: 'auswahl' as const, optionen: ['a', 'b', 'c', 'd'], richtig: [2], mehrfach: false };
    for (let s = 0; s < 20; s++) {
      const m = mischeAuswahl(w, () => (s * 0.137) % 1);
      expect(m.optionen[m.richtig[0]!]).toBe('c');
      expect(auswahlRichtig(m, [m.richtig[0]!])).toBe(true);
    }
    expect(auswahlRichtig({ ...w, richtig: [0, 2], mehrfach: true }, [2, 0])).toBe(true);
    expect(auswahlRichtig({ ...w, richtig: [0, 2], mehrfach: true }, [0])).toBe(false);
  });
});

describe('Quellen', () => {
  it('Duell und Prüfungssimulation landen bei derselben Glossarfrage im selben Eintrag', () => {
    const k = katalog(pflegeModule);
    const alle = karten(pflegeModule);
    const f = erzeugeRunde(alle, alle, ['definition'], 1, 7)[0]!;
    const d = ausDuell(f, (f.richtig + 1) % f.optionen.length);
    const s = ausSimulation({
      id: `glossar:${f.id}`, quelle: 'glossar', art: 'auswahl', topicId: f.karte.themen[0] ?? '', operator: 'benennen', afb: 1, punkte: 1, minuten: 1,
      frage: f.frage, optionen: f.optionen, richtig: [f.richtig], mehrfach: false,
    }, { wahl: [] })!;
    expect(s.id).toBe(d.id);
    expect(d.loesung).toBe(f.optionen[f.richtig]);
    expect(k.modul.topics.length).toBeGreaterThan(0);
  });

  it('Rechenfragen der Prüfungssimulation werden zu Zwillingsaufgaben im Rechentrainer-Eintrag', () => {
    const k = katalog(pflegeModule);
    const [f] = rechenFragen(k, 1, 2, 11, () => true);
    const n = ausSimulation(f!, { text: '0' })!;
    expect(n.id).toMatch(/^rechnen:[a-z]+:2$/);
    expect(n.wiederholung.art).toBe('rechnen');
    expect(n.quelle).toBe('simulation');
  });
});
