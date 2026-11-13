import type { CatalogModule } from '../catalog-types';
import kern from './pflege-generalistisch.json?kern';

/**
 * Fachmodul generalistische Pflegeausbildung.
 * Quelle sind die YAML-Dateien in ./katalog; daraus erzeugt scripts/build-module.py
 * pflege-generalistisch.json (nach jeder Katalogänderung neu bauen und mit einchecken).
 * JSON-Importe verlieren Literaltypen (z. B. afb: 1 | 2 | 3), daher der Cast;
 * Struktur und Verweise prüfen das JSON Schema und index.test.ts.
 *
 * Startgröße: Glossar, Krankheits- und Arzneimittel-Steckbriefe (zusammen gut 110 KB gzip) sind nicht im
 * Startpaket. Die Listen existieren sofort (leer) und werden von `ladePflegeVoll()` an Ort und Stelle gefüllt,
 * damit gehaltene Verweise gültig bleiben. Seiten rendern erst danach (PageBoundary wartet auf fachmodulBereit()).
 */
export const pflegeModule = { glossary: [], diseaseProfiles: [], drugProfiles: [], ...kern } as unknown as CatalogModule;

let voll: Promise<void> | undefined;
export function ladePflegeVoll(): Promise<void> {
  voll ??= import('./pflege-generalistisch.json?gross').then(({ default: gross }) => {
    const ziel = pflegeModule as unknown as Record<string, unknown[]>;
    for (const [k, liste] of Object.entries(gross)) if (!ziel[k]!.length) for (const e of liste) ziel[k]!.push(e);
  }).catch((e: unknown) => { voll = undefined; throw e; });
  return voll;
}
