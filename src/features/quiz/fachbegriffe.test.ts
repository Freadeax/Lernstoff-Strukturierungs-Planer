import { describe, expect, it } from 'vitest';
import { baueIndex, begriffeIn, zerlege } from './fachbegriffe';
import { modules } from '../../modules/registry';
import type { CatalogGlossaryEntry, CatalogModule } from '../../modules/catalog-types';

const g = (term: string, definition: string, mehr: Partial<CatalogGlossaryEntry> = {}): CatalogGlossaryEntry => ({ term, definition, origin: 'katalog', ...mehr });

const klein = baueIndex([
  g('Thrombose', 'Gefäßverschluss durch ein Blutgerinnsel.'),
  g('Thromboseprophylaxe', 'Maßnahmen gegen Thrombosen.'),
  g('Ödem', 'Flüssigkeit im Interstitium.'),
  g('Blutdruck nach Riva-Rocci', 'Nicht-invasiv gemessener Blutdruck.', { abbreviation: 'RR' }),
  g('Dehydratation', 'Abnahme des Körperwassers.', { synonyms: ['Exsikkose'] }),
  g('Exsikkose', 'Austrocknung des Körpers.'),
  g('dys-', 'Vorsilbe: gestört.'),
  g('Multiple Sklerose', 'Entzündliche ZNS-Erkrankung.', { abbreviation: 'MS' }),
]);

const markiert = (text: string) => zerlege(text, klein).flatMap((a) => (typeof a === 'string' ? [] : [a.text]));

describe('Fachbegriffe im Text', () => {
  it('findet ganze Wörter mit Endungen, aber nicht in Zusammensetzungen', () => {
    expect(markiert('Ödeme an beiden Beinen sprechen gegen eine Thrombose.')).toEqual(['Ödeme', 'Thrombose']);
    expect(markiert('Die Thromboseprophylaxe beginnt früh.')).toEqual(['Thromboseprophylaxe']);
    expect(markiert('Thrombosegefahr')).toEqual([]);
  });

  it('nimmt Abkürzungen nur in genau der Schreibweise', () => {
    expect(markiert('RR 150/90 mmHg, Messung nach 5 ms.')).toEqual(['RR']);
    expect(markiert('Sie hat MS.')).toEqual(['MS']);
  });

  it('markiert jeden Begriff nur einmal und lässt den Text vollständig', () => {
    const t = 'Thrombose hier, Thrombose dort.';
    const z = zerlege(t, klein);
    expect(z.map((a) => (typeof a === 'string' ? a : a.text)).join('')).toBe(t);
    expect(z.filter((a) => typeof a !== 'string')).toHaveLength(1);
  });

  it('ein Synonym verdrängt keinen eigenen Eintrag, Wortbausteine werden nicht markiert', () => {
    const b = begriffeIn(['Exsikkose bei dys- …'], klein);
    expect(b.map((x) => x.term)).toEqual(['Exsikkose']);
  });

  it('kennzeichnet Katalogdefinitionen ohne Beleg', () => {
    expect(begriffeIn(['Thrombose'], klein)[0]?.katalog).toBe(true);
  });

  it('arbeitet mit dem echten Glossar des Pflegemoduls', () => {
    const modul = modules[0] as CatalogModule;
    const index = baueIndex(modul.glossary);
    const b = begriffeIn(['Bei Tachykardie und Dyspnoe den RR messen und an eine Lungenembolie denken.'], index);
    expect(b.map((x) => x.term)).toEqual(expect.arrayContaining(['Tachykardie', 'Dyspnoe']));
    expect(b.some((x) => x.abbreviation === 'RR')).toBe(true);
  });
});
