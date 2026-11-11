// Skript-Prüfung (Audit 11.11.2026): fehlende Seiten und fehlende Quellen getrennt,
// stabile Abschnittsnummern, ältere Fassungen bleiben nachvollziehbar.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from '../../core/db';
import { behalteKartenIds, kartenAusAbschnitt } from './karten';
import { parseSkript } from './parser';
import { findeAbschnitt, neueFassung, pruefeSkript, pruefungText } from './pruefung';
import { ladeLesestaende, markiereGelesen, uebernehmeDateien } from './store';

const TEXT = `# CE 01 · Prüfskript

**Quellen**
- **[A]** Unterricht.pdf (10 S.)
- **[B]** Buch.pdf (300 S.)

## 1 · Gut belegt [A, S. 2]

- Aussage mit Seite [A, S. 3].
- Erbt den Beleg der Überschrift.

## 2 · Lücken

- Quelle genannt, Seite fehlt [A].
- Kürzel fehlt im Verzeichnis [X, S. 4].
- Ganz ohne Beleg.
- Nicht im Material ⚠

## 3 · Literatur

- Irgendein Buch.
`;

describe('Belegprüfung', () => {
  it('meldet fehlende Seiten und fehlende Quellen getrennt, je Abschnitt und gesamt', () => {
    const s = parseSkript('p.md', TEXT, { herkunft: 'datei' });
    const p = pruefeSkript(s);
    expect(p.abschnitte[0]).toMatchObject({ nummer: '1', ohneSeite: [], ohneQuelle: [], ohneBeleg: 0, luecken: 0 });
    expect(p.abschnitte[1]).toMatchObject({ nummer: '2', ohneSeite: ['A'], ohneQuelle: ['X'], ohneBeleg: 2, luecken: 1 });
    // Quellenverzeichnis-Abschnitte zählen nicht als „ohne Beleg“
    expect(p.abschnitte[2]!.ohneBeleg).toBe(0);
    expect(p).toMatchObject({ ohneVerzeichnis: false, ohneSeite: 1, ohneQuelle: ['X'], ohneBeleg: 2, luecken: 1, unbenutzt: ['B'] });
    const t = pruefungText(p);
    expect(t[0]).toMatch(/^Quelle fehlt: \[X\]/);
    expect(t[1]).toMatch(/^Seite fehlt: 1 Beleg/);
    expect(t.join(' ')).toMatch(/Ohne Beleg: 2 Punkte/);
  });

  it('ohne Quellenverzeichnis: Quelle fehlt für alle Belege', () => {
    const s = parseSkript('o.md', '# CE 01 · Ohne\n\n## 1 · A\n\n- Satz [A, S. 1].\n', { herkunft: 'datei' });
    const p = pruefeSkript(s);
    expect(p.ohneVerzeichnis).toBe(true);
    expect(pruefungText(p)[0]).toMatch(/kein Quellenverzeichnis/);
  });
});

describe('Stabile Abschnitte und Fassungen', () => {
  const alt = parseSkript('p.md', TEXT, { herkunft: 'datei', jetzt: '2026-11-01T08:00:00Z' });
  // Neue Fassung: vorne ein Abschnitt eingeschoben, Abschnitt 3 entfällt, die alten Nummern bleiben
  const neuText = TEXT.replace('## 1 · Gut belegt', '## 0 · Neu vorne [A, S. 1]\n\n- Neu [A, S. 1].\n\n## 1 · Gut belegt').replace(/## 3 · Literatur[\s\S]*$/, '');
  const neu = parseSkript('p.md', neuText, { herkunft: 'datei', jetzt: '2026-11-11T08:00:00Z' });

  it('Link mit Nummer trifft denselben Abschnitt, auch wenn vorne einer dazukommt', () => {
    expect(alt.abschnitte[0]!.id).toBe('a1');
    expect(neu.abschnitte[1]!.id).toBe('a2');
    expect(findeAbschnitt(neu, { nr: '1' }).abschnitt!.titel).toBe('Gut belegt');
    expect(findeAbschnitt(neu, { a: 'a1' }).abschnitt!.titel).toBe('Neu vorne');
  });

  it('entfallener Abschnitt: Hinweis nennt die alte Fassung und ihren Titel', () => {
    const { skript, idKarte } = neueFassung(alt, neu);
    expect(skript.fassungen).toHaveLength(1);
    expect(skript.fassungen![0]).toMatchObject({ hash: alt.hash, stand: '2026-11-01T08:00:00Z' });
    expect(idKarte.get('a1')).toBe('a2');
    expect(idKarte.has('a3')).toBe(false);
    const f = findeAbschnitt(skript, { nr: '3' });
    expect(f.abschnitt).toBeUndefined();
    expect(f.hinweis).toMatch(/Abschnitt 3 „Literatur“ gab es in der Fassung vom 2026-11-01/);
    expect(findeAbschnitt(skript, { nr: '9' }).hinweis).toMatch(/gibt es in diesem Skript nicht/);
  });

  it('Karten-IDs hängen an der Nummer; erneutes Übernehmen behält alte IDs und damit den Lernstand', () => {
    const kAlt = kartenAusAbschnitt(alt, alt.abschnitte[0]!);
    const kNeu = kartenAusAbschnitt(neu, neu.abschnitte[1]!);
    expect(kNeu[0]!.id).toBe('skr:p:n1:1');
    expect(kNeu.map((k) => k.id)).toEqual(kAlt.map((k) => k.id));
    // Karte aus der Zeit vor den Nummer-IDs (a1) bleibt erhalten statt doppelt
    const vorher = [{ ...kAlt[0]!, id: 'skr:p:a1:1' }];
    expect(behalteKartenIds(kNeu, vorher)[0]!.id).toBe('skr:p:a1:1');
  });

  describe('Import einer neuen Fassung', () => {
    beforeEach(() => {
      const m = new Map<string, string>();
      (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    });
    it('hebt die alte Gliederung auf und bildet den Lesestand auf die neuen Abschnitte ab', async () => {
      const db = new LernstoffDB(`fassung-${Math.random()}`);
      await uebernehmeDateien([{ name: 'p.md', text: TEXT }], 'datei', db, '2026-11-01T08:00:00Z');
      markiereGelesen('p', 'a1', true);
      markiereGelesen('p', 'a3', true);
      const e = await uebernehmeDateien([{ name: 'p.md', text: neuText }], 'datei', db, '2026-11-11T08:00:00Z');
      expect(e.aktualisiert).toHaveLength(1);
      const s = (await db.skripte.get('p'))!;
      expect(s.fassungen?.[0]?.abschnitte.map((a) => a.titel)).toEqual(['Gut belegt', 'Lücken', 'Literatur']);
      expect(ladeLesestaende().p!.gelesen).toEqual(['a2']);
    });
  });
});
