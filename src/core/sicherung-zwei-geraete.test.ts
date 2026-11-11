// Abnahmefall A-05 (Website-Audit): Zwei Testgeräte mit unterschiedlichen Änderungen, Sicherungen in beide
// Richtungen einspielen. Konflikte, fehlende Einträge, Rückfall und erhaltener Lernstand müssen nachvollziehbar sein.
// Die beiden „Geräte“ sind zwei getrennte Datenbanken und zwei getrennte localStorage-Stände.
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LernstoffDB } from './db';
import { erstelleSicherung, ladeRueckfall, lesePruefe, spieleEin, stelleRueckfallWiederHer, vergleiche, type Sicherung } from './sicherung';

class Speicher {
  m = new Map<string, string>();
  sperre?: string;
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { if (k === this.sperre) throw new DOMException('voll', 'QuotaExceededError'); this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

interface Geraet { db: LernstoffDB; ls: Speicher }
let n = 0;
function geraet(): Geraet { return { db: new LernstoffDB(`a05-${++n}`), ls: new Speicher() }; }
/** Alles, was die Sicherung über localStorage tut, läuft auf dem gerade „aktiven“ Gerät. */
async function auf<T>(g: Geraet, f: () => Promise<T>): Promise<T> {
  (globalThis as { localStorage?: unknown }).localStorage = g.ls;
  return f();
}
const sichern = (g: Geraet) => auf(g, async () => lesePruefe(JSON.stringify(await erstelleSicherung(g.db)), g.db).sicherung);

const dok = (id: string, title: string, importedAt: string) => ({ id, title, kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: `h-${id}`, importedAt });
const karte = (id: string, vorne: string, geaendert: string) => ({ id, quelle: 'eigen', vorne, hinten: '…', topicIds: [], erstellt: '2026-11-01T08:00:00Z', geaendert });

describe('A-05 · Datensicherung zwischen zwei Geräten', () => {
  it('führt Dokument, Karte, Mindmap und laufenden Fall in beide Richtungen nachvollziehbar zusammen', async () => {
    const iphone = geraet(), ipad = geraet();

    // gemeinsamer Ausgangsstand
    for (const g of [iphone, ipad]) {
      await g.db.documents.add(dok('d-gemeinsam', 'Dekubitus Skript', '2026-11-01T08:00:00Z') as never);
      await g.db.karten.add(karte('k1', 'Braden-Skala?', '2026-11-01T08:00:00Z') as never);
    }
    // iPhone: neues Dokument, Karte geändert, Mindmap, eigener laufender Fall
    await iphone.db.documents.add(dok('d-iphone', 'Diabetes Arbeitsblatt', '2026-11-05T08:00:00Z') as never);
    await iphone.db.karten.put(karte('k1', 'Braden-Skala: 6 Kategorien?', '2026-11-05T09:00:00Z') as never);
    iphone.ls.m.set('lernstoff.mindmaps', JSON.stringify([{ id: 'mm-iphone', geaendert: '2026-11-05T10:00:00Z' }]));
    iphone.ls.m.set('lernstoff.simulation.laufend', JSON.stringify({ id: 'lauf-iphone', begonnen: '2026-11-05T11:00:00Z', frage: 3 }));
    // iPad: eigene Karte, andere Mindmap, anderer laufender Fall
    await ipad.db.karten.add(karte('k-ipad', 'Normwert Kalium?', '2026-11-06T08:00:00Z') as never);
    ipad.ls.m.set('lernstoff.mindmaps', JSON.stringify([{ id: 'mm-ipad', geaendert: '2026-11-06T10:00:00Z' }]));
    ipad.ls.m.set('lernstoff.simulation.laufend', JSON.stringify({ id: 'lauf-ipad', begonnen: '2026-11-06T11:00:00Z', frage: 7 }));

    // iPhone → iPad: Vorschau
    const vomIphone = await sichern(iphone);
    const v = await auf(ipad, () => vergleiche(vomIphone, ipad.db));
    expect(v.zeilen.find((z) => z.bereich === 'Dokumente')).toMatchObject({ neu: 1, gleich: 1, nurHier: 0, konflikt: 0 });
    expect(v.zeilen.find((z) => z.bereich === 'eigene Karteikarten')).toMatchObject({ neu: 0, neuerInDatei: 1, nurHier: 1 });
    expect(v.lokal).toContainEqual({ bereich: 'Mindmaps', art: 'zusammenfuehren', dazu: 1 });
    expect(v.lokal.find((l) => l.bereich === 'laufende Prüfungssimulation')?.art).toBe('konflikt');

    // iPhone → iPad einspielen
    const e1 = await auf(ipad, () => spieleEin(vomIphone, 'zusammenfuehren', ipad.db));
    expect(e1).toMatchObject({ neu: 1, aktualisiert: 1, lokalFehler: [] });
    expect(e1.rueckfall).toBeTruthy();
    expect(e1.lokalUebernommen).toEqual(['Mindmaps']); // der laufende Fall blieb, wird also nicht als übernommen gemeldet
    expect((await ipad.db.documents.toArray()).map((d) => d.id).sort()).toEqual(['d-gemeinsam', 'd-iphone']);
    expect((await ipad.db.karten.get('k1'))!.vorne).toContain('6 Kategorien');
    expect(await ipad.db.karten.get('k-ipad')).toBeTruthy();
    expect(JSON.parse(ipad.ls.getItem('lernstoff.mindmaps')!).map((m: { id: string }) => m.id).sort()).toEqual(['mm-ipad', 'mm-iphone']);
    // laufender Fall: kein Mischmasch, der iPad-Lauf bleibt als Ganzes
    expect(JSON.parse(ipad.ls.getItem('lernstoff.simulation.laufend')!)).toEqual({ id: 'lauf-ipad', begonnen: '2026-11-06T11:00:00Z', frage: 7 });

    // iPad → iPhone: danach haben beide denselben Datenbank-Stand
    const vomIpad = await sichern(ipad);
    const e2 = await auf(iphone, () => spieleEin(vomIpad, 'zusammenfuehren', iphone.db));
    expect(e2).toMatchObject({ neu: 1, aktualisiert: 0 });
    for (const t of ['documents', 'karten'] as const) {
      const a = (await iphone.db.table(t).toArray()).map((x) => JSON.stringify(x)).sort();
      const b = (await ipad.db.table(t).toArray()).map((x) => JSON.stringify(x)).sort();
      expect(a).toEqual(b);
    }
    // nochmals vergleichen: nichts mehr offen außer dem bewusst nicht gemischten laufenden Fall
    const nochmalVomIpad = await sichern(ipad);
    const rest = await auf(iphone, () => vergleiche(nochmalVomIpad, iphone.db));
    expect(rest.zeilen.every((z) => z.neu === 0 && z.neuerInDatei === 0 && z.konflikt === 0 && z.nurHier === 0)).toBe(true);
    expect(rest.lokal.map((l) => l.art)).toEqual(['konflikt']);
  });

  it('weist einen Teilfehler aus und stellt mit dem Rückfall den alten Lernstand wieder her', async () => {
    const quelle = geraet(), ziel = geraet();
    await quelle.db.documents.add(dok('d-neu', 'Neu', '2026-11-07T08:00:00Z') as never);
    quelle.ls.m.set('lernstoff.mindmaps', '[{"id":"mm-neu"}]');
    quelle.ls.m.set('lernstoff.fall.archiv', '[{"id":"f-neu"}]');
    const datei: Sicherung = await sichern(quelle);

    await ziel.db.documents.add(dok('d-alt', 'Alt', '2026-11-01T08:00:00Z') as never);
    ziel.ls.m.set('lernstoff.fall.archiv', '[{"id":"f-alt"}]');
    ziel.ls.sperre = 'lernstoff.fall.archiv'; // Speicher voll für genau diesen Eintrag

    const e = await auf(ziel, () => spieleEin(datei, 'ersetzen', ziel.db));
    expect(e.lokalFehler).toEqual(['lernstoff.fall.archiv']);
    expect(e.lokalUebernommen).toEqual(['Mindmaps']);
    expect((await ziel.db.documents.toArray()).map((d) => d.id)).toEqual(['d-neu']);
    expect(await auf(ziel, () => ladeRueckfall(ziel.db))).toBeTruthy();

    ziel.ls.sperre = undefined;
    await auf(ziel, () => stelleRueckfallWiederHer(ziel.db));
    expect((await ziel.db.documents.toArray()).map((d) => d.id)).toEqual(['d-alt']);
    expect(ziel.ls.getItem('lernstoff.fall.archiv')).toContain('f-alt');
    expect(ziel.ls.getItem('lernstoff.mindmaps')).toBeNull();
  });
});
