import { describe, expect, it } from 'vitest';
import { flatNav, NAV, UNTERSEITEN } from '../../ui/shell/nav';
import { BEGRIFFE, BUENDEL, FRAGEN, KREISLAUF, PRUEFUNGSPHASEN, SEITEN, seitenInfo, WEGWEISER_PFAD, WISSENSSTUFEN } from './inhalt';
import { MASTERY_RULES } from '../lernplan/progress';

const bekannt = new Set([...flatNav(NAV), ...UNTERSEITEN].map((i) => i.path!));
const pfad = (p: string) => p.split('?')[0]!;

describe('Wegweiser', () => {
  it('ist im Menü erreichbar', () => {
    expect(bekannt.has(WEGWEISER_PFAD)).toBe(true);
  });

  it('verlinkt nur Seiten, die es gibt', () => {
    const links = [
      ...SEITEN.flatMap((s) => [s.path, s.weiter?.path]),
      ...KREISLAUF.flatMap((k) => k.links.map((l) => l.path)),
      ...PRUEFUNGSPHASEN.flatMap((p) => p.schritte.map((s) => s.link?.path)),
      ...BEGRIFFE.map((b) => b.link?.path),
      ...FRAGEN.map((f) => f.link?.path),
    ].filter((p): p is string => !!p);
    for (const l of links) expect(bekannt, l).toContain(pfad(l));
  });

  it('erklärt jede Seite eines Bündels genau einmal', () => {
    const pfade = BUENDEL.flatMap((b) => b.pfade);
    expect(new Set(pfade).size).toBe(pfade.length);
    for (const p of pfade) expect(seitenInfo(p), p).toBeDefined();
    for (const s of SEITEN) expect(pfade, s.path).toContain(s.path);
  });

  it('nennt die echten Schwellen für „sicher“', () => {
    const sicher = WISSENSSTUFEN.find((s) => s.name === 'Sicher')!.text;
    expect(sicher).toContain(`${MASTERY_RULES.minSuccessfulDays} gute Abfragen`);
    expect(sicher).toContain(`${Math.round(MASTERY_RULES.minRetrievability * 100)} %`);
  });
});
