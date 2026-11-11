// Audit SEC-04/SEC-05: Grenzen beim Einlesen fremder Sicherungen, Prüfung vor jeder Transaktion.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from './db';
import { erstelleSicherung, lesePruefe, leseSicherungsDatei, SICHERUNG_GRENZEN, SicherungZuGross, spieleEin } from './sicherung';
import { entschluessele, EntpacktZuGross, verschluessele } from './sicherung-krypto';

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
beforeEach(() => ls.clear());

let n = 0;
const neueDb = () => new LernstoffDB(`grenzen-${++n}`);
const basis = (data: Record<string, unknown[]>, extra: Record<string, unknown> = {}) => JSON.stringify({ app: 'lernstoff-planer', format: 1, schema: 7, exportedAt: '2026-11-11T10:00:00Z', data, ...extra });

describe('Sicherung: Grenzen und Prüfung vor dem Einspielen', () => {
  it('liest zu große Dateien gar nicht erst', async () => {
    let gelesen = false;
    const riesig = { size: SICHERUNG_GRENZEN.dateiBytes + 1, text: async () => { gelesen = true; return ''; } } as unknown as Blob;
    await expect(leseSicherungsDatei(riesig)).rejects.toBeInstanceOf(SicherungZuGross);
    expect(gelesen).toBe(false);
    expect(await leseSicherungsDatei(new Blob(['{"a":1}']))).toBe('{"a":1}');
  });

  it('bricht beim Entpacken einer präparierten verschlüsselten Datei ab (GZIP-Bombe)', async () => {
    const bombe = await verschluessele('0'.repeat(2_000_000), 'langes Passwort 123', 100_000);
    expect(bombe.length).toBeLessThan(100_000); // stark gepackt
    await expect(entschluessele(bombe, 'langes Passwort 123', 1_000_000)).rejects.toBeInstanceOf(EntpacktZuGross);
    expect(await entschluessele(bombe, 'langes Passwort 123', 3_000_000)).toHaveLength(2_000_000);
  });

  it('prüft Version, Zeilenform und Schlüssel, bevor die Datenbank angefasst wird', async () => {
    const db = neueDb();
    expect(() => lesePruefe(basis({}, { schema: 2.5 }), db)).toThrow(/Datenbank-Version.*ungültig/);
    expect(() => lesePruefe(basis({}, { format: 'x' }), db)).toThrow(/Sicherungsformat ist ungültig/);
    expect(() => lesePruefe(basis({ documents: [{ title: 'ohne id' }] }), db)).toThrow(/Dokumente.*ohne gültige Kennung/);
    expect(() => lesePruefe(basis({ board: [{ topicId: { $typ: 'x' } }] }), db)).toThrow(/Eintrag 1 ohne gültige Kennung/);
    // Protokolle mit fortlaufender Nummer brauchen keine Kennung
    expect(() => lesePruefe(basis({ studyLogs: [{ topicId: 't', date: '2026-11-11', minutes: 5 }] }), db)).not.toThrow();
    // Ausgangsdatenbank bleibt unverändert
    await db.subjects.add({ id: 'bleibt', name: 'X' });
    try { await spieleEin(lesePruefe(basis({ subjects: [{ name: 'kaputt' }] }), db).sicherung, 'ersetzen', db); } catch { /* erwartet */ }
    expect((await db.subjects.toArray()).map((s) => s.id)).toEqual(['bleibt']);
  });

  it('lässt beschädigte Trainerstände weg und nennt sie, statt alles abzulehnen', () => {
    const db = neueDb();
    const { sicherung, uebersicht } = lesePruefe(basis({}, { local: { 'lernstoff.mindmaps': '[{"id":"m1"}]', 'lernstoff.hygiene.stand': '{kaputt', 'lernstoff.apiKey': 'sk-ant-x' } }), db);
    expect(Object.keys(sicherung.local!)).toEqual(['lernstoff.mindmaps']);
    expect(uebersicht.lokalUngueltig).toEqual(['Ergebnisse im Hygiene-Trainer']);
    const viele = Object.fromEntries(Array.from({ length: SICHERUNG_GRENZEN.lokalEintraege + 1 }, (_, i) => [`lernstoff.x${i}`, '1']));
    expect(() => lesePruefe(basis({}, { local: viele }), db)).toThrow(SicherungZuGross);
  });

  it('nimmt Build-ID und Fachmodul in die Sicherung auf und zeigt sie in der Übersicht', async () => {
    const db = neueDb();
    const s = await erstelleSicherung(db, { fachmodul: 'pflege-generalistisch@0.1.0' });
    expect(s.build).toBeTruthy();
    const { uebersicht } = lesePruefe(JSON.stringify(s), db);
    expect(uebersicht).toMatchObject({ fachmodul: 'pflege-generalistisch@0.1.0', schema: db.verno });
  });
});
