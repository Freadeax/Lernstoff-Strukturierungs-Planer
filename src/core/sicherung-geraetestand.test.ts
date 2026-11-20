// Datensicherung mit umgezogenen Lernständen (DB v8, core/geraetestand.ts): Sie erscheinen in der Sicherung wie
// früher unter `local`, ältere Sicherungen (Lernstände im localStorage-Teil) landen beim Einspielen in der Datenbank.
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from './db';
import { geraet } from './geraetestand';
import { erstelleSicherung, hatLehrerdaten, lesePruefe, loescheLokaleEintraege, spieleEin } from './sicherung';

class Speicher {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const ls = new Speicher();
(globalThis as { localStorage?: unknown }).localStorage = ls;

const MAPS = JSON.stringify([{ id: 'm1', wurzel: { id: 'w', text: 'Herz', kinder: [] }, erstellt: '2026-11-01', geaendert: '2026-11-01', schema: 2, rev: 1 }]);
const KLASSE = JSON.stringify([{ id: 'k1', name: '3BFP', lernende: ['Mia'], faelle: [] }]);

describe('Sicherung und Gerätestand', () => {
  beforeAll(async () => {
    ls.setItem('lernstoff.mindmaps', MAPS);
    ls.setItem('lernstoff.lehrer.klassen', KLASSE);
    ls.setItem('lernstoff.hygiene.stand', '{"x":1}');
    await geraet.starte();
  });

  it('Umzug beim Start: Lernstände in der Datenbank, nicht mehr im localStorage', async () => {
    expect(ls.getItem('lernstoff.mindmaps')).toBeNull();
    expect(geraet.getItem('lernstoff.mindmaps')).toBe(MAPS);
    expect((await db.geraetestand.get('lernstoff.lehrer.klassen'))?.wert).toBe(KLASSE);
    expect(hatLehrerdaten()).toBe(true);
  });

  it('die Sicherung enthält sie unter local (gleiches Format), die Tabelle selbst nicht', async () => {
    const s = await erstelleSicherung(db);
    expect(s.local?.['lernstoff.mindmaps']).toBe(MAPS);
    expect(s.local?.['lernstoff.hygiene.stand']).toBe('{"x":1}');
    expect(s.data.geraetestand).toBeUndefined();
    const ohne = await erstelleSicherung(db, { ohneLehrerdaten: true });
    expect(ohne.local?.['lernstoff.lehrer.klassen']).toBeUndefined();
  });

  it('ersetzen: alles weg, dann aus der Sicherung zurück in die Datenbank', async () => {
    const text = JSON.stringify(await erstelleSicherung(db));
    loescheLokaleEintraege();
    await geraet.gespeichert();
    expect(geraet.getItem('lernstoff.mindmaps')).toBeNull();
    expect(await db.geraetestand.get('lernstoff.mindmaps')).toBeUndefined();
    await spieleEin(lesePruefe(text, db).sicherung, 'ersetzen', db);
    expect(geraet.getItem('lernstoff.mindmaps')).toBe(MAPS);
    expect((await db.geraetestand.get('lernstoff.mindmaps'))?.wert).toBe(MAPS);
    expect(ls.getItem('lernstoff.mindmaps')).toBeNull();
    expect(ls.getItem('lernstoff.hygiene.stand')).toBe('{"x":1}');
  });

  it('zusammenführen mit einer älteren Sicherung vereinigt Listen (zweites Gerät), nichts geht verloren', async () => {
    const alt = JSON.parse(JSON.stringify(await erstelleSicherung(db))) as { schema: number; local: Record<string, string> };
    alt.schema = 7; // Sicherung von einem Gerät vor dem Umzug
    alt.local['lernstoff.mindmaps'] = JSON.stringify([{ id: 'm2', wurzel: { id: 'w2', text: 'Lunge', kinder: [] }, erstellt: '2026-11-02', geaendert: '2026-11-02', schema: 2, rev: 1 }]);
    await spieleEin(lesePruefe(JSON.stringify(alt), db).sicherung, 'zusammenfuehren', db);
    const ids = (JSON.parse(geraet.getItem('lernstoff.mindmaps')!) as Array<{ id: string }>).map((m) => m.id).sort();
    expect(ids).toEqual(['m1', 'm2']);
    expect(JSON.parse((await db.geraetestand.get('lernstoff.mindmaps'))!.wert)).toHaveLength(2);
  });
});
