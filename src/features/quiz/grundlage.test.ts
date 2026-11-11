import { describe, expect, it } from 'vitest';
import { AUFGABEN as RECHT } from '../recht/aufgaben';
import { AUFGABEN as HYGIENE } from '../hygiene/aufgaben';
import { AUFGABEN as ES } from '../expertenstandards/aufgaben';
import { AUFGABEN as NORM } from '../normwerte/aufgaben';
import { AUFGABEN as AM } from '../arzneimittel/aufgaben';
import {
  arzneimittelGrundlage, hygieneEbene, hygieneGrundlage, normenIn, normwertGrundlage, rechtGrundlageMit, standardGrundlage, standardsIn, texteVon,
} from './grundlage';

const alle = (r: Record<string, unknown[]>) => Object.values(r).flat() as Parameters<typeof texteVon>[0][];

describe('Grundlage je Aufgabe', () => {
  it('liest Normzitate', () => {
    expect(normenIn('Nach § 203 Abs. 1 StGB und § 630a BGB, außerdem Art. 2 GG; nochmals § 203 Abs. 1 StGB.')).toEqual(['§ 203 Abs. 1 StGB', '§ 630a BGB', 'Art. 2 GG']);
  });

  it('Recht: jede Aufgabe nennt Paragrafen und Geltung', () => {
    const bereich = new Map(Object.entries(RECHT).flatMap(([b, l]) => l.map((x) => [x.id, b] as const)));
    const g = rechtGrundlageMit((id) => bereich.get(id));
    for (const x of alle(RECHT)) {
      const z = g(x);
      expect(z[0]!.text).toMatch(/§|Art\./);
      expect(z.some((r) => r.label === 'Geltung')).toBe(true);
    }
  });

  it('Expertenstandards: Herausgeber, Fassung und Lerntext-Hinweis', () => {
    for (const x of alle(ES)) {
      const z = standardGrundlage(x);
      expect(z.some((r) => r.label === 'Lerntext')).toBe(true);
    }
    expect(standardsIn('Sturzrisiko einschätzen').map((s) => s.id)).toEqual(['sturz']);
  });

  it('Hygiene unterscheidet Basis, Fallbezug und Einrichtung', () => {
    expect(hygieneEbene('Händedesinfektion vor Patientenkontakt')).toBe('basis');
    expect(hygieneEbene('Bei MRSA Kontaktisolierung')).toBe('fall');
    expect(hygieneEbene('laut Hygieneplan der Station')).toBe('einrichtung');
    const ebenen = new Set(alle(HYGIENE).map((x) => hygieneGrundlage(x)[0]!.text));
    expect(ebenen.size).toBeGreaterThan(1);
  });

  it('Normwerte und Arzneimittel nennen Referenz, Alarmwert und Dosisgrenze', () => {
    for (const x of alle(NORM)) expect(normwertGrundlage(x).map((z) => z.label)).toEqual(expect.arrayContaining(['Gilt für', 'Referenz', 'Alarmwert']));
    for (const x of alle(AM)) expect(arzneimittelGrundlage(x).some((z) => z.label === 'Grenze')).toBe(true);
  });
});
