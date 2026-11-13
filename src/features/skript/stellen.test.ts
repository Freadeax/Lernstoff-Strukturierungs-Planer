import { describe, expect, it } from 'vitest';
import { parseSkript } from './parser';
import { besterAusschnitt, klartext, schlagwoerter, stellenFuer } from './stellen';
import type { Skript } from './typen';

const md = `---
themen: [thema.ph.dekubitus]
---
# CE 04 · Dekubitusprophylaxe

## Quellen
- **[D]** Unterricht Dekubitus.pdf

## 1 · Entstehung
Druck und Scherkräfte verschließen Kapillaren; nach etwa zwei Stunden drohen Gewebeschäden. [D, S. 3]

## 2 · Risikoeinschätzung
- Die Braden-Skala erfasst sechs Bereiche, darunter Mobilität und Feuchtigkeit. [D, S. 5]
- Ein Fingertest zeigt eine Rötung der Kategorie 1. [D, S. 6]

## 3 · Lagerung
Die 30-Grad-Lagerung entlastet Sakrum und Trochanter. [D, S. 8]
`;

function skript(text: string, datei: string): Skript {
  return parseSkript(datei, text, { herkunft: 'datei', jetzt: '2026-11-13T10:00:00Z' });
}

describe('Stelle im Skript zu einer Aufgabe', () => {
  const s = skript(md, 'ce04-dekubitus.md');

  it('findet den Abschnitt über Schlagwörter und baut einen stabilen Link mit Nummer', () => {
    const [st] = stellenFuer([s], { topicIds: ['thema.ph.dekubitus'], texte: ['Welche Bereiche erfasst die Braden-Skala?', 'Mobilität, Feuchtigkeit, Ernährung …'] });
    expect(st).toBeDefined();
    expect(st!.abschnittTitel).toBe('Risikoeinschätzung');
    expect(st!.pfad).toMatch(/^\/lernen\/skript\?id=ce04-dekubitus&nr=2&q=/);
    expect(st!.ausschnitt).toContain('Braden-Skala erfasst sechs Bereiche');
    expect(st!.ausschnitt).not.toContain('[D');
  });

  it('nimmt nie das Quellenverzeichnis', () => {
    const st = stellenFuer([s], { topicIds: ['thema.ph.dekubitus'], texte: ['Unterricht Dekubitus pdf Quellen'] });
    expect(st.every((x) => x.abschnittTitel !== 'Quellen')).toBe(true);
  });

  it('fremde Skripte brauchen mehr Treffer als Skripte zum Thema', () => {
    expect(stellenFuer([s], { topicIds: ['thema.anderes'], texte: ['Lagerung'] })).toHaveLength(0);
    expect(stellenFuer([s], { topicIds: ['thema.ph.dekubitus'], texte: ['Lagerung'] })).toHaveLength(1);
    expect(stellenFuer([s], { topicIds: ['thema.anderes'], texte: ['Welche Lagerung entlastet Sakrum und Trochanter?'] })[0]?.abschnittTitel).toBe('Lagerung');
  });

  it('ohne Schlagwörter oder Skripte keine Stelle', () => {
    expect(stellenFuer([s], { topicIds: [], texte: ['Was ist das?'] })).toEqual([]);
    expect(stellenFuer([], { topicIds: ['thema.ph.dekubitus'], texte: ['Braden-Skala'] })).toEqual([]);
  });

  it('Hilfsfunktionen: Schlagwörter ohne Füllwörter, Klartext ohne Belege', () => {
    expect(schlagwoerter(['Welche Pflegefachperson misst den NEWS2?']).map((w) => w.wort)).toEqual(['misst', 'NEWS2']);
    expect(klartext('- **Merke:** Druck [D, S. 3] ⚠')).toBe('Merke: Druck');
    expect(besterAusschnitt({ markdown: 'Kurz.\nDie Haut wird täglich inspiziert und dokumentiert.' }, ['haut'])).toBe('Die Haut wird täglich inspiziert und dokumentiert.');
  });
});
