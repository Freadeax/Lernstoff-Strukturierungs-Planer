import { describe, expect, it } from 'vitest';
import { alsFehler, alsTreffer, bewerte, mische, mischeOptionen, pruefeAufgaben, runde, startFolge, type Aufgabe } from './quiz';
import { ALLE_AUFGABEN as HYGIENE, AUFGABEN as HYGIENE_BEREICHE, HYGIENE_THEMA } from '../hygiene/aufgaben';
import { ALLE_AUFGABEN as ANATOMIE, AUFGABEN as ANATOMIE_BEREICHE, THEMA } from '../anatomie/aufgaben';
import { FIGUREN } from '../anatomie/figuren';
import { ALLE_AUFGABEN as STANDARDS, ES_THEMA } from '../expertenstandards/aufgaben';
import { ALLE_AUFGABEN as NORMWERTE, THEMEN as NORM_THEMEN } from '../normwerte/aufgaben';
import { ALLE_AUFGABEN as NOTFALL, NOTFALL_THEMA } from '../notfall/aufgaben';
import { ALLE_AUFGABEN as ARZNEI, AM_THEMA } from '../arzneimittel/aufgaben';
import { ALLE_AUFGABEN as RECHT, AUFGABEN as RECHT_BEREICHE, BEREICH_ZU_THEMA } from '../recht/aufgaben';
import { modules } from '../../modules/registry';
import { uebungenFuer } from '../lernplan/trainer';
import { mischeAuswahl, auswahlRichtig } from '../fehlerheft/fehlerheft';
import type { CatalogModule } from '../../modules/catalog-types';

const modul = modules[0] as CatalogModule;
const themen = new Set(modul.topics.map((t) => t.id));

/** Vorhersagbarer Zufall für Tests. */
function zufall(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const auswahl: Aufgabe = { id: 'a', art: 'auswahl', topicIds: ['t'], titel: 'T', frage: 'F?', optionen: ['A', 'B', 'C'], richtig: [1], mehrfach: false, erklaerung: ['weil'] };
const mehrfach: Aufgabe = { ...auswahl, id: 'm', mehrfach: true, richtig: [0, 2] };
const folge: Aufgabe = { id: 'r', art: 'reihenfolge', topicIds: ['t'], titel: 'Weg', frage: 'Ordne.', schritte: ['1', '2', '3', '4'], erklaerung: ['so'] };
const bild: Aufgabe = {
  id: 'b', art: 'beschriften', figur: 'x', topicIds: ['t'], titel: 'Bild', frage: 'Beschrifte.', erklaerung: ['so'],
  marken: [
    { nr: 1, x: 0, y: 0, label: 'Oben', hinweis: 'ganz hoch' },
    { nr: 2, x: 0, y: 0, label: 'Mitte', hinweis: 'dazwischen' },
    { nr: 3, x: 0, y: 0, label: 'Unten', hinweis: 'ganz tief' },
  ],
};

describe('Bewerten', () => {
  it('Einfachauswahl: alles oder nichts', () => {
    expect(bewerte(auswahl, { art: 'auswahl', wahl: [1] })).toMatchObject({ punkte: 1, max: 1, richtig: true });
    expect(bewerte(auswahl, { art: 'auswahl', wahl: [0] })).toMatchObject({ punkte: 0, richtig: false });
  });

  it('Mehrfachauswahl: ein Punkt je richtig entschiedener Option', () => {
    expect(bewerte(mehrfach, { art: 'auswahl', wahl: [0, 2] })).toMatchObject({ punkte: 3, max: 3, richtig: true });
    expect(bewerte(mehrfach, { art: 'auswahl', wahl: [0] })).toMatchObject({ punkte: 2, richtig: false });
    expect(bewerte(mehrfach, { art: 'auswahl', wahl: [0, 1, 2] })).toMatchObject({ punkte: 2, richtig: false });
  });

  it('Reihenfolge: Teilpunkte für richtige Nachbarn', () => {
    expect(bewerte(folge, { art: 'reihenfolge', folge: ['1', '2', '3', '4'] })).toMatchObject({ punkte: 3, max: 3, richtig: true });
    // Ein Block verschoben: 2-3 und 3-4 bleiben richtige Nachbarn
    const b = bewerte(folge, { art: 'reihenfolge', folge: ['2', '3', '4', '1'] });
    expect(b).toMatchObject({ punkte: 2, richtig: false });
    expect(b.teile).toEqual([false, false, false, false]);
    expect(bewerte(folge, { art: 'reihenfolge', folge: ['4', '3', '2', '1'] }).punkte).toBe(0);
  });

  it('Beschriften: ein Punkt je Marke', () => {
    const b = bewerte(bild, { art: 'beschriften', zuordnung: { 1: 'Oben', 2: 'Unten', 3: 'Mitte' } });
    expect(b).toMatchObject({ punkte: 1, max: 3, richtig: false, teile: [true, false, false] });
  });

  it('Lernplan: jede Aufgabe zählt einmal, Teilpunkte anteilig', () => {
    const b = bewerte(bild, { art: 'beschriften', zuordnung: { 1: 'Oben', 2: 'Mitte', 3: 'Oben' } });
    expect(alsTreffer(bild, b)).toEqual({ topicIds: ['t'], punkte: 2 / 3, max: 1 });
  });
});

describe('Mischen', () => {
  it('verliert keine Elemente', () => {
    expect(mische([1, 2, 3, 4, 5], zufall()).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('startet eine Reihenfolge nie schon richtig', () => {
    for (let seed = 1; seed < 50; seed++) expect(startFolge(['a', 'b'], zufall(seed))).toEqual(['b', 'a']);
  });

  it('behält beim Mischen der Optionen die richtige Lösung', () => {
    for (let seed = 1; seed < 20; seed++) {
      const m = mischeOptionen(mehrfach, zufall(seed));
      expect(m.art === 'auswahl' && m.richtig.map((i) => m.optionen[i]).sort()).toEqual(['A', 'C']);
    }
  });

  it('zieht für eine Runde höchstens die gewünschte Zahl', () => {
    expect(runde(HYGIENE, 8, zufall())).toHaveLength(8);
    expect(new Set(runde(HYGIENE, 8, zufall()).map((a) => a.id)).size).toBe(8);
  });

  it('nimmt Abbildungen immer in die Runde', () => {
    for (let seed = 1; seed < 20; seed++) {
      expect(runde(ANATOMIE_BEREICHE.herz, 3, zufall(seed)).some((a) => a.art === 'beschriften')).toBe(true);
      expect(runde(ANATOMIE, 8, zufall(seed)).filter((a) => a.art === 'beschriften')).toHaveLength(4);
    }
  });
});

describe('Fehlerheft', () => {
  it('nimmt richtige Antworten nicht auf', () => {
    expect(alsFehler(auswahl, { art: 'auswahl', wahl: [1] }, 'hygiene')).toEqual([]);
  });

  it('übernimmt Auswahlfragen so, wie sie gestellt waren', () => {
    const [f] = alsFehler(auswahl, { art: 'auswahl', wahl: [2] }, 'hygiene');
    expect(f).toMatchObject({ id: 'hygiene:a', quelle: 'hygiene', deineAntwort: 'C', loesung: 'B' });
    expect(f!.wiederholung).toEqual({ art: 'auswahl', optionen: ['A', 'B', 'C'], richtig: [1], mehrfach: false });
  });

  it('fragt bei einer Reihenfolge den ersten falschen Schritt ab', () => {
    const [f] = alsFehler(folge, { art: 'reihenfolge', folge: ['1', '3', '2', '4'] }, 'anatomie');
    expect(f!.frage).toContain('nach „1“');
    expect(f!.wiederholung).toMatchObject({ art: 'auswahl', richtig: [0] });
    const w = f!.wiederholung as { optionen: string[] };
    expect(w.optionen[0]).toBe('2');
    expect(w.optionen).not.toContain('1');
    expect(new Set(w.optionen).size).toBe(w.optionen.length);
  });

  it('macht aus jeder falschen Marke eine Frage ohne Abbildung', () => {
    const fehler = alsFehler(bild, { art: 'beschriften', zuordnung: { 1: 'Oben', 2: 'Unten', 3: 'Mitte' } }, 'anatomie');
    expect(fehler.map((f) => f.id)).toEqual(['anatomie:b:2', 'anatomie:b:3']);
    expect(fehler[0]!.frage).toContain('dazwischen');
    expect(fehler[0]!.loesung).toBe('Mitte');
  });

  it('erzeugt Wiederholungen, die das Fehlerheft lösen kann', () => {
    for (const a of [...HYGIENE, ...ANATOMIE, ...STANDARDS, ...NORMWERTE, ...NOTFALL, ...ARZNEI, ...RECHT]) {
      const leer = a.art === 'auswahl' ? { art: 'auswahl' as const, wahl: [] } : a.art === 'reihenfolge' ? { art: 'reihenfolge' as const, folge: [...a.schritte].reverse() } : { art: 'beschriften' as const, zuordnung: {} };
      for (const f of alsFehler(a, leer, 'hygiene')) {
        const w = f.wiederholung;
        if (w.art !== 'auswahl') throw new Error('nur Auswahl erwartet');
        expect(w.optionen.length, f.id).toBeGreaterThanOrEqual(2);
        expect(new Set(w.optionen).size, f.id).toBe(w.optionen.length);
        const gemischt = mischeAuswahl(w, zufall());
        expect(auswahlRichtig(gemischt, gemischt.richtig), f.id).toBe(true);
      }
    }
  });
});

describe('Inhalte', () => {
  it('Hygiene-Aufgaben sind vollständig und gehören zu Katalogthemen', () => {
    expect(pruefeAufgaben(HYGIENE, themen)).toEqual([]);
    expect(themen.has(HYGIENE_THEMA)).toBe(true);
    for (const liste of Object.values(HYGIENE_BEREICHE)) expect(liste.length).toBeGreaterThanOrEqual(6);
  });

  it('Anatomie-Aufgaben sind vollständig und gehören zu Katalogthemen', () => {
    expect(pruefeAufgaben(ANATOMIE, themen)).toEqual([]);
    for (const t of Object.values(THEMA)) expect(themen.has(t), t).toBe(true);
    for (const liste of Object.values(ANATOMIE_BEREICHE)) expect(liste.length).toBeGreaterThanOrEqual(5);
  });

  it('jede Abbildung, auf die eine Aufgabe zeigt, gibt es, und die Marken liegen im Bild', () => {
    for (const a of ANATOMIE) {
      if (a.art !== 'beschriften') continue;
      const f = FIGUREN[a.figur];
      expect(f, a.id).toBeDefined();
      const [, , w, h] = f!.viewBox.split(' ').map(Number);
      for (const m of a.marken) {
        expect(m.x >= 9 && m.x <= w! - 9 && m.y >= 9 && m.y <= h! - 9, `${a.id} Nummer ${m.nr}`).toBe(true);
      }
      // Marken dürfen sich nicht überdecken (Radius 9)
      for (const m of a.marken) for (const n of a.marken) {
        if (m.nr < n.nr) expect(Math.hypot(m.x - n.x, m.y - n.y), `${a.id} ${m.nr}/${n.nr}`).toBeGreaterThanOrEqual(19);
      }
    }
  });

  it('Expertenstandards- und Normwerte-Aufgaben sind vollständig und gehören zu Katalogthemen', () => {
    expect(pruefeAufgaben(STANDARDS, themen)).toEqual([]);
    expect(pruefeAufgaben(NORMWERTE, themen)).toEqual([]);
    expect(STANDARDS.every((a) => a.topicIds.includes(ES_THEMA))).toBe(true);
    for (const t of Object.values(NORM_THEMEN)) expect(themen.has(t), t).toBe(true);
    expect(uebungenFuer(ES_THEMA).map((u) => u.path)).toContain('/lernen/expertenstandards');
    expect(uebungenFuer(NORM_THEMEN.vital).map((u) => u.path)).toContain('/lernen/normwerte?bereich=vital');
  });

  it('Notfall- und Arzneimittel-Aufgaben sind vollständig und gehören zu Katalogthemen', () => {
    expect(pruefeAufgaben(NOTFALL, themen)).toEqual([]);
    expect(pruefeAufgaben(ARZNEI, themen)).toEqual([]);
    expect(NOTFALL.every((a) => a.topicIds.includes(NOTFALL_THEMA))).toBe(true);
    expect(uebungenFuer(NOTFALL_THEMA).map((u) => u.path)).toContain('/lernen/notfall');
    expect(uebungenFuer(AM_THEMA).map((u) => u.path)).toContain('/lernen/arzneimittel');
  });

  it('Recht-Aufgaben sind vollständig, jedes Rechtsthema hat genug Aufgaben für den Lernplan', () => {
    expect(pruefeAufgaben(RECHT, themen)).toEqual([]);
    for (const [thema, bereich] of Object.entries(BEREICH_ZU_THEMA)) {
      expect(uebungenFuer(thema).map((u) => u.path), thema).toContain(`/lernen/recht?bereich=${bereich}`);
      // Mindestens 3 Aufgaben zum Thema, damit eine Runde im Lernplan zählen kann
      expect(RECHT.filter((a) => a.topicIds.includes(thema)).length, thema).toBeGreaterThanOrEqual(3);
      // Der Sprung landet in einem Bereich, der das Thema wirklich abfragt
      expect(RECHT_BEREICHE[bereich].some((a) => a.topicIds.includes(thema)), thema).toBe(true);
    }
  });

  it('Lernplan verweist von den Themen auf die neuen Trainer', () => {
    expect(uebungenFuer(HYGIENE_THEMA).map((u) => u.path)).toContain('/lernen/hygiene');
    expect(uebungenFuer(THEMA.herz).map((u) => u.path)).toContain('/lernen/anatomie?bereich=herz');
  });
});

describe('Zuordnen und Fall in Schritten', () => {
  const paare: Aufgabe = {
    id: 'z', art: 'zuordnen', topicIds: ['t'], titel: 'Paare', frage: 'Ordne zu.', erklaerung: ['so'],
    paare: [{ links: 'MRSA', rechts: 'Kontakt' }, { links: 'Influenza', rechts: 'Tröpfchen' }, { links: 'Noro', rechts: 'Kontakt' }],
  };
  const fall: Aufgabe = {
    id: 'f', art: 'fall', topicIds: ['t'], titel: 'Fall', frage: 'Was tust du?', erklaerung: ['so'], einstieg: 'Frau K., 80 Jahre.',
    schritte: [
      { lage: 'Sie ist blass.', frage: 'Zuerst?', optionen: ['Messen', 'Warten'], richtig: [0], mehrfach: false, warum: 'Erst Werte.' },
      { lage: 'RR 85/50.', frage: 'Dann?', optionen: ['Hinlegen', 'Laufen', 'Melden'], richtig: [0, 2], mehrfach: true, warum: 'Sicherheit.' },
    ],
  };

  it('Zuordnen: Teilpunkte je Paar, Antworten rechts einmalig und sortiert', async () => {
    const { zuordnenOptionen } = await import('./quiz');
    expect(zuordnenOptionen(paare as never)).toEqual(['Kontakt', 'Tröpfchen']);
    expect(bewerte(paare, { art: 'zuordnen', zuordnung: { 0: 'Kontakt', 1: 'Kontakt', 2: 'Kontakt' } })).toMatchObject({ punkte: 2, max: 3, richtig: false, teile: [true, false, true] });
  });

  it('Fall: je Schritt ein Punkt, Mehrfachauswahl muss genau stimmen', () => {
    expect(bewerte(fall, { art: 'fall', wahl: [[0], [0, 2]] })).toMatchObject({ punkte: 2, max: 2, richtig: true });
    expect(bewerte(fall, { art: 'fall', wahl: [[0], [0]] })).toMatchObject({ punkte: 1, richtig: false, teile: [true, false] });
  });

  it('Fehlerheft: je falschem Paar bzw. Schritt eine Auswahlfrage, die ohne Runde lösbar ist', () => {
    const fz = alsFehler(paare, { art: 'zuordnen', zuordnung: { 0: 'Kontakt', 1: 'Kontakt', 2: 'Kontakt' } }, 'hygiene');
    expect(fz).toHaveLength(1);
    expect(fz[0]!.wiederholung).toMatchObject({ art: 'auswahl', richtig: [0] });
    expect(fz[0]!.wiederholung.art === 'auswahl' && fz[0]!.wiederholung.optionen[0]).toBe('Tröpfchen');
    const ff = alsFehler(fall, { art: 'fall', wahl: [[1], [0, 2]] }, 'hygiene');
    expect(ff).toHaveLength(1);
    expect(ff[0]!.frage).toContain('Sie ist blass.');
    expect(ff[0]!.erklaerung[0]).toBe('Erst Werte.');
  });

  it('Mischen behält die Lösung in jedem Fallschritt', () => {
    const m = mischeOptionen(fall, zufall(3));
    expect(m.art === 'fall' && m.schritte.map((st) => st.richtig.map((i) => st.optionen[i]))).toEqual([['Messen'], expect.arrayContaining(['Hinlegen', 'Melden'])]);
  });

  it('Bauprüfung findet kaputte Fälle und Paare', () => {
    expect(pruefeAufgaben([paare, fall])).toEqual([]);
    const kaputt: Aufgabe = { ...(fall as Extract<Aufgabe, { art: 'fall' }>), id: 'k', schritte: [{ lage: '', frage: '?', optionen: ['a'], richtig: [3], mehrfach: false, warum: '' }] };
    expect(pruefeAufgaben([kaputt]).length).toBeGreaterThan(2);
  });

  it('Stufe ergibt sich aus der Art, wenn nichts angegeben ist; Schwachstellen kommen aus dem Fehlerheft', async () => {
    const { stufeVon, schwachstellen } = await import('./quiz');
    expect([stufeVon(auswahl), stufeVon(mehrfach), stufeVon(fall), stufeVon({ ...auswahl, stufe: 3 })]).toEqual([1, 2, 3, 3]);
    expect(schwachstellen([auswahl, fall, paare], 'hygiene', ['hygiene:f:2', 'hygiene:a', 'recht:z']).map((a) => a.id)).toEqual(['a', 'f']);
  });
});
