import type { CatalogModule } from '../catalog-types';
import katalog from './pflege-generalistisch.json';

/**
 * Fachmodul generalistische Pflegeausbildung.
 * Quelle sind die YAML-Dateien in ./katalog; daraus erzeugt scripts/build-module.py
 * pflege-generalistisch.json (nach jeder Katalogänderung neu bauen und mit einchecken).
 * JSON-Importe verlieren Literaltypen (z. B. afb: 1 | 2 | 3), daher der Cast;
 * Struktur und Verweise prüfen das JSON Schema und index.test.ts.
 */
export const pflegeModule = katalog as unknown as CatalogModule;
