import { describe, expect, it } from 'vitest';
import { uebenGruppen } from '../../ui/shell/nav';
import { passt, UEBUNG_INFO, zuordnung } from './katalog';

describe('Alle Übungen: Steckbriefe und Filter', () => {
  const z = zuordnung();
  it('jede Übung im Menü hat einen Steckbrief', () => {
    const ids = uebenGruppen().flatMap((g) => g.children!.map((c) => c.id));
    expect(ids.filter((id) => !UEBUNG_INFO[id])).toEqual([]);
  });
  it('CE und Fach werden aus den Themen abgeleitet', () => {
    expect(z.ce.get('hygiene')?.size ?? 0).toBeGreaterThan(0);
    expect(z.fach.get('rechnen')?.size ?? 0).toBeGreaterThan(0);
  });
  it('filtert nach Dauer, KI und Stufe', () => {
    expect(passt('duell', { dauer: 'kurz' }, z)).toBe(true);
    expect(passt('simulation', { dauer: 'kurz' }, z)).toBe(false);
    expect(passt('fall', { nurOffline: true }, z)).toBe(false);
    expect(passt('duell', { stufe: 'fortgeschritten' }, z)).toBe(false);
    expect(passt('anatomie', { stufe: 'einstieg' }, z)).toBe(true);
    expect(passt('examen', { ce: [...z.ce.get('hygiene')!][0] }, z)).toBe(false);
  });
});
