// Merkliste als Lernzettel: reiner Text zum Kopieren, Teilen oder Ausdrucken.

import { ART_NAME, EBENE_NAME, type SuchDok } from './suchkern';

export function lernzettel(doks: SuchDok[], standardName: (id: string) => string, datum = new Date()): string {
  const kopf = `Lernzettel Standards (${datum.toLocaleDateString('de-DE')})`;
  // Nach Standard gruppieren, in der Reihenfolge der Merkliste
  const gruppen = new Map<string, SuchDok[]>();
  for (const d of doks) {
    const g = d.standardIds[0] ? standardName(d.standardIds[0]) : 'Allgemein';
    gruppen.set(g, [...(gruppen.get(g) ?? []), d]);
  }
  const teile = [...gruppen].map(([g, liste]) => [
    `## ${g}`,
    ...liste.map((d) => {
      const art = d.ebene ? `${EBENE_NAME[d.ebene]} ${d.ebene}${d.kriterium ?? ''}` : ART_NAME[d.art];
      const details = (d.details ?? []).filter((x) => x.text !== d.text).map((x) => `  ${x.label}: ${x.text}`);
      return [`- [${art}] ${d.titel}`, ...(d.text ? [`  ${d.text}`] : []), ...details].join('\n');
    }),
  ].join('\n'));
  return [kopf, '', ...teile.flatMap((t) => [t, '']), 'Zusammenfassung aus der Lernstoff-App, ersetzt nicht den Originaltext des Standards.'].join('\n');
}
