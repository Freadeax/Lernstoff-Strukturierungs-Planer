// Regressionstest: Kein Text der App enthält eine bekannte Fehlvorstellung zu den
// DNQP-Expertenstandards, ohne sie im selben Satz richtigzustellen.
// Das DNQP-Modul selbst ist ausgenommen, weil es die Fehlvorstellungen als Lernstoff zitiert.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pruefeText } from './pruefung';

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === 'dnqp' ? [] : dateien(pfad);
    return /\.(ts|tsx|yaml|md)$/.test(name) && !/\.test\./.test(name) ? [pfad] : [];
  });
}

describe('App-Texte und Expertenstandards', () => {
  it('enthalten keine unkommentierte Fehlvorstellung', () => {
    const offen = dateien('src').flatMap((datei) => pruefeText(readFileSync(datei, 'utf8'))
      .filter((t) => !t.wirktRichtiggestellt)
      .map((t) => `${datei}: ${t.standardId}/${t.fehlvorstellung.id}: ${t.satz.slice(0, 160)}`));
    expect(offen).toEqual([]);
  });
});
