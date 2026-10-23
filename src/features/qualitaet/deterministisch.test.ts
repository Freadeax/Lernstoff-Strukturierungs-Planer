// Tests (inkl. Mutationstests) für die deterministischen Prüfungen und das Zerlegen.
import { expect, test } from 'vitest';
import {
  normalisiere, findeZitat, extrahiereZahlen, pruefeZahlen, pruefeBegriffe, pruefeAufgaben, zaehlePunkte,
  pruefeMarkierungen, pruefeAlles, ampel, type Chunk, type PruefClaim as Claim,
} from './deterministisch';
import { zerlegeAntwort, type ApiTextBlock } from '../zusammenfasser/zerlegen';

const assert = {
  equal: (a: unknown, b: unknown, m?: string) => expect(a, m).toBe(b),
  deepEqual: (a: unknown, b: unknown, m?: string) => expect(a, m).toEqual(b),
  ok: (x: unknown, m?: string) => expect(x, m).toBeTruthy(),
};


// Beispieltexte sind für den Test formuliert, keine echten Lehrbuchzitate.
const c1: Chunk = {
  id: 'k1', documentId: 'buchA', page: 87, printedPage: '412', chapter: '12.3 Dekubitusprophylaxe',
  text: '[S. 412 | 12.3 Dekubitusprophylaxe]\nUnter einem Dekubitus versteht man eine lokal begrenzte Schädi-\ngung der Haut und/oder des darunterliegenden Gewebes. Die Einschätzung erfolgt mit der Braden-Skala; ab ≤ 18 Punkten besteht ein Risiko. Bei Risiko soll die Positionierung individuell, z. B. alle 2–3 Stunden, erfolgen.',
};
const c2: Chunk = {
  id: 'k2', documentId: 'skriptB', page: 3, text: 'Die Positionierung erfolgt bei Risiko alle 2 Stunden. Die 30°-Seitenlage entlastet das Kreuzbein.',
};
const chunks = new Map([[c1.id, c1], [c2.id, c2]]);

test('Normalisierung: Silbentrennung, Anführungszeichen, Leerraum', () => {
  assert.equal(normalisiere('Schädi-\ngung  „Haut“'), 'schädigung "haut"');
});

test('Q1a: exaktes Zitat trotz Silbentrennung im Original, Positionen zeigen auf Original', () => {
  const t = findeZitat(c1.text, 'lokal begrenzte Schädigung der Haut');
  assert.equal(t.art, 'exakt');
  assert.ok(c1.text.slice(t.start, t.end).startsWith('lokal begrenzte Schädi'));
});

test('Q1a: leicht abweichendes Zitat → unscharf, erfundenes → nein', () => {
  assert.equal(findeZitat(c1.text, 'Die Einschätzung erfolgt mit der Braden Skala; ab ≤ 18 Punkten besteht ein Risiko.').art, 'unscharf');
  assert.equal(findeZitat(c1.text, 'Die Einschätzung erfolgt mit der Norton-Skala bei allen Bewohnern.').art, 'nein');
});

test('Zahlen: Ziffern, Bereiche, Zahlwörter, Einheiten, Vergleich', () => {
  const z = extrahiereZahlen('ab ≤ 18 Punkten, alle 2–3 Stunden, dreimal täglich, 30°-Seitenlage');
  assert.deepEqual(z.map(x => [x.wert, x.bis, x.einheit, x.vergleich]), [
    [18, undefined, 'Pkt', '≤'], [2, 3, 'h', undefined], [3, undefined, 'mal', undefined], [30, undefined, '°', undefined],
  ]);
  assert.equal(extrahiereZahlen('Eine Seitenlage ist ein Beispiel.').length, 0, 'Artikel "ein/eine" ist keine Zahl');
});

const claim = (text: string, kind: Claim['kind'] = 'fakt'): Claim => ({ id: 'x', text, kind, citations: [] });

test('Q2 Mutationen: geänderte Zahl, Einheit, Bereich und Vergleich werden gefunden', () => {
  const beleg = [c1.text];
  assert.equal(pruefeZahlen(claim('Positionierung bei Risiko alle 2–3 Stunden.'), beleg, 'originalgetreu').length, 0);
  for (const falsch of [
    'Positionierung bei Risiko alle 2 Stunden.',            // Bereich verkürzt
    'Positionierung bei Risiko alle 3–4 Stunden.',          // Zahl geändert
    'Positionierung bei Risiko alle 2–3 Minuten.',          // Einheit geändert
    'Risiko besteht ab ≥ 18 Punkten.',                      // Vergleich umgedreht
    'Risiko besteht ab ≤ 16 Punkten.',                      // Grenzwert geändert
  ]) {
    const b = pruefeZahlen(claim(falsch), beleg, 'originalgetreu');
    assert.ok(b.length > 0 && b.every(x => x.schwere === 'blocker'), `nicht erkannt: ${falsch}`);
  }
});

test('Q2: Lernhilfen werden nicht auf Zahlen geprüft, im Lernmodus nur Warnung', () => {
  assert.equal(pruefeZahlen(claim('Stell dir 3 Kissen vor.', 'lernhilfe'), [c1.text], 'lernen').length, 0);
  assert.equal(pruefeZahlen(claim('alle 4 Stunden'), [c1.text], 'lernen')[0].schwere, 'warnung');
});

test('Q3a: Fachbegriff durch Synonym ersetzt; Q3b: Definition ohne Zitat', () => {
  const glossar = [{ term: 'Dekubitus', synonyms: ['Druckgeschwür', 'Wundliegen'] }, { term: 'Positionierung', synonyms: ['Lagerung', 'Umlagern'] }];
  assert.equal(pruefeBegriffe(claim('Bei Risiko alle 2–3 Stunden Positionierung.'), [c1.text], glossar).length, 0);
  const b = pruefeBegriffe(claim('Bei Risiko alle 2–3 Stunden Lagerung.'), [c1.text], glossar);
  assert.equal(b[0]?.pruefung, 'Q3a');
  assert.ok(pruefeBegriffe(claim('Ein Dekubitus ist eine Hautschädigung.', 'definition'), [c1.text], glossar).some(x => x.pruefung === 'Q3b'));
});

test('Q4: fehlende Aufgabe, falsche Punktanzahl, fehlender PESR-Teil, Reihenfolge', () => {
  const antwort = `<aufgabe nr="2">\n### Aufgabe 2\n- a\n- b\n  - Unterpunkt zählt nicht\n- c\n</aufgabe>\n<aufgabe nr="1">\n### Aufgabe 1\n**P:** …\n**E:** …\n**S:** …\n</aufgabe>`;
  assert.equal(zaehlePunkte('- a\n- b\n  - x\n- c'), 3);
  const b = pruefeAufgaben(antwort, [
    { nr: '1', pflichtUeberschriften: ['P', 'E', 'S', 'R'] }, { nr: '2', geforderteAnzahl: 4 }, { nr: '3' },
  ]);
  const ids = b.map(x => `${x.pruefung}:${x.aufgabeNr ?? ''}`);
  assert.ok(ids.includes('Q4c:1'), 'R fehlt'); assert.ok(ids.includes('Q4b:2'), '3 statt 4'); assert.ok(ids.includes('Q4a:3'), 'Aufgabe 3 fehlt');
  assert.ok(b.some(x => x.meldung.includes('Reihenfolge')));
});

test('Q6: Ergänzung im originalgetreuen Modus verboten, offene Markierung erkannt', () => {
  assert.ok(pruefeMarkierungen('Text <ergaenzung>x</ergaenzung>', 'originalgetreu').some(b => b.pruefung === 'Q6a' && b.schwere === 'blocker'));
  assert.equal(pruefeMarkierungen('Text <ergaenzung>x</ergaenzung>', 'lernen').length, 0);
  assert.ok(pruefeMarkierungen('<fehlt>offen', 'lernen').some(b => b.pruefung === 'Q6b'));
});

test('Ende-zu-Ende: Antwort zerlegen, prüfen, Ampel', () => {
  const bloecke: ApiTextBlock[] = [
    { type: 'text', text: '## Dekubitus\n' },
    { type: 'text', text: 'Ein Dekubitus ist eine „lokal begrenzte Schädigung der Haut“.', citations: [
      { type: 'content_block_location', cited_text: 'Unter einem Dekubitus versteht man eine lokal begrenzte Schädigung der Haut', document_index: 0, start_block_index: 0, end_block_index: 1 }] },
    { type: 'text', text: '\nBei Risiko soll alle 2–3 Stunden positioniert werden.', citations: [
      { type: 'content_block_location', cited_text: 'Bei Risiko soll die Positionierung individuell, z. B. alle 2–3 Stunden, erfolgen.', document_index: 0, start_block_index: 0, end_block_index: 1 }] },
    { type: 'text', text: '\nDie Haut wird täglich inspiziert.\n<fehlt>Angaben zur Hautinspektion fehlen in den Quellen.</fehlt>' },
  ];
  const claims = zerlegeAntwort(bloecke, [['k1'], ['k2']], chunks);
  assert.deepEqual(claims.map(c => c.kind), ['struktur', 'definition', 'fakt', 'fakt', 'fehlt']);
  assert.equal(claims[1].citations[0].printedPage, '412');

  const ctx = { modus: 'originalgetreu' as const, chunks, erlaubteDokumente: new Set(['buchA', 'skriptB']), glossar: [],
    antwortText: bloecke.map(b => b.text).join('') };
  const befunde = pruefeAlles(claims, ctx);
  assert.deepEqual(befunde.map(b => b.pruefung), ['Q1c'], 'nur der unbelegte Satz „täglich inspiziert“');
  assert.equal(ampel(befunde), 'rot');
  assert.ok(claims[2].citations[0].charStart! > 0, 'Position für Hervorhebung gesetzt');
});

test('Q2b: unterschiedliche Werte in zwei Quellen werden als möglicher Widerspruch gemeldet', () => {
  const claims = zerlegeAntwort([
    { type: 'text', text: 'Positionierung bei Risiko alle 2–3 Stunden.', citations: [
      { type: 'content_block_location', cited_text: 'z. B. alle 2–3 Stunden', document_index: 0, start_block_index: 0, end_block_index: 1 },
      { type: 'content_block_location', cited_text: 'Die Positionierung erfolgt bei Risiko alle 2 Stunden.', document_index: 1, start_block_index: 0, end_block_index: 1 }] },
  ], [['k1'], ['k2']], chunks);
  const b = pruefeAlles(claims, { modus: 'lernen', chunks, erlaubteDokumente: new Set(['buchA', 'skriptB']), glossar: [], antwortText: '' });
  assert.ok(b.some(x => x.pruefung === 'Q2b'));
});
