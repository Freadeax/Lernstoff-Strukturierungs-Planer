import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from '../../core/db';
import type { Document, SourceChunk } from '../../core/types';
import { DOKUMENT_GRUPPE, dokumentSkriptId, skriptAusDokument } from './ausDokument';
import { kartenAusAbschnitt } from './karten';
import { parseSkript } from './parser';
import { pruefeSkript } from './pruefung';
import { uebernehmeDokument } from './store';

// Erfundenes Beispielmaterial (keine Originalinhalte).
const doc = (o: Partial<Document> = {}): Document => ({
  id: 'doc-1', title: 'Dekubitus [Folien] #2', kind: 'pdf', subjectIds: [], topicIds: ['thema.kl.demenz'], version: 1,
  contentHash: 'x', importedAt: '2026-11-13T10:00:00Z', ...o,
});
let n = 0;
const chunk = (page: number, text: string, o: Partial<SourceChunk> = {}): SourceChunk => ({ id: `c${String(++n).padStart(3, '0')}`, documentId: 'doc-1', page, text, ...o });

describe('Skript aus eigenem Dokument', () => {
  it('gliedert nach Kapiteln, belegt jeden Punkt mit seiner Seite und hält die Skript-Prüfung ein', () => {
    const md = skriptAusDokument(doc(), [
      chunk(2, 'Ein Dekubitus ist eine lokal begrenzte Schädigung der Haut.\n\nDruck und Zeit sind die Hauptursachen.', { chapter: 'Grundlagen', printedPage: '12' }),
      chunk(3, 'Risikofaktoren', { chapter: 'Grundlagen > Risiko' }),
      chunk(3, '• Immobilität\n• Feuchtigkeit\n• ⟦?⟧ Ernährung', { chapter: 'Grundlagen > Risiko' }),
      chunk(4, 'Die Haut wird regelmäßig inspiziert und dokumentiert, sodass Veränderungen früh auffallen und Maßnahmen angepasst werden können, bevor ein Schaden entsteht. Dazu gehört auch ein strukturierter Fingertest an gefährdeten Stellen und eine klare Absprache im Team, wer wann prüft und wie die Ergebnisse festgehalten werden.', { chapter: 'Prophylaxe' }),
      chunk(4, 'Sprechernotiz', { chapter: 'Prophylaxe', origin: 'notes' }),
      chunk(5, 'anderes Dokument', { documentId: 'doc-2' }),
    ]);
    expect(md.name).toBe('dok-dekubitus-folien-2.md');
    const s = parseSkript(md.name, md.text, { herkunft: 'dokument' });
    expect(s.id).toBe(dokumentSkriptId(doc()));
    expect(s.gruppe).toBe(DOKUMENT_GRUPPE);
    expect(s.dokumentId).toBe('doc-1');
    expect(s.topicIds).toEqual(['thema.kl.demenz']);
    expect(s.quellen.map((q) => q.kuerzel)).toEqual(['D']);
    expect(s.abschnitte.map((a) => `${a.nummer} ${a.titel}`)).toEqual(['1 Grundlagen', '2 Prophylaxe']);
    const [a1, a2] = s.abschnitte;
    expect(a1!.markdown).toContain('- Ein Dekubitus ist eine lokal begrenzte Schädigung der Haut. [D, S. 12]');
    expect(a1!.markdown).toContain('### Risiko');
    expect(a1!.markdown).toContain('- Feuchtigkeit [D, S. 3]');
    expect(a1!.luecken).toBe(1);
    expect(a2!.markdown).not.toContain('Sprechernotiz');
    expect(a2!.markdown).not.toMatch(/^- /m);           // langer Absatz bleibt Absatz
    expect(md.text).not.toContain('anderes Dokument');
    expect(md.text).not.toContain('[Folien]');          // eckige Klammern im Titel sind keine Belege
    const p = pruefeSkript(s);
    expect(p).toMatchObject({ ohneVerzeichnis: false, ohneSeite: 0, ohneQuelle: [], ohneBeleg: 0, unbenutzt: [] });
    // Karten nur aus belegten Punkten, der unleserliche bleibt draußen
    const karten = kartenAusAbschnitt(s, a1!);
    const alles = JSON.stringify(karten);
    expect(alles).toContain('Feuchtigkeit');
    expect(alles).not.toContain('unleserlich');
  });

  it('macht ohne Kapitel aus jeder Folie einen Abschnitt mit dem Folientitel', () => {
    const md = skriptAusDokument(doc({ kind: 'pptx', title: 'Pflegeprozess' }), [
      chunk(1, 'Pflegeprozess nach Fiechter/Meier\n\nSechs Schritte im Regelkreis'),
      chunk(2, 'Informationssammlung\n\nGespräch, Beobachtung, Messung'),
    ]);
    const s = parseSkript(md.name, md.text, { herkunft: 'dokument' });
    expect(s.abschnitte.map((a) => a.titel)).toEqual(['Pflegeprozess nach Fiechter/Meier', 'Informationssammlung']);
    expect(s.abschnitte[1]!.markdown).toBe('- Gespräch, Beobachtung, Messung [D, Folie 2]');
    expect(s.quellen[0]!.text).toContain('2 Folien');
  });

  it('teilt lange PDFs ohne Kapitel in Abschnitte zu drei Seiten', () => {
    const md = skriptAusDokument(doc({ topicIds: [] }), [1, 2, 3, 4].map((p) => chunk(p, `Text auf Seite ${p}.`)));
    const s = parseSkript(md.name, md.text, { herkunft: 'dokument' });
    expect(s.abschnitte.map((a) => a.titel)).toEqual(['Seiten 1–3', 'Seite 4']);
    expect(md.text).not.toContain('themen:');
  });
});

describe('Dokument als Skript speichern', () => {
  let db: LernstoffDB;
  beforeEach(() => {
    db = new LernstoffDB(`ausdok-${Math.random()}`);
    const m = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k),
    };
  });

  it('legt das Skript an, erkennt Unverändertes und meldet Dokumente ohne Text', async () => {
    await db.documents.put(doc());
    await db.chunks.bulkPut([chunk(1, 'Druck entlasten', { chapter: 'Maßnahmen' })]);
    const r = await uebernehmeDokument('doc-1', db);
    expect(r.ergebnis.neu).toHaveLength(1);
    const s = await db.skripte.get(r.id);
    expect(s?.herkunft).toBe('dokument');
    expect((await uebernehmeDokument('doc-1', db)).ergebnis.unveraendert).toHaveLength(1);
    await db.documents.put(doc({ id: 'leer', title: 'Leer' }));
    await expect(uebernehmeDokument('leer', db)).rejects.toThrow(/keinen erkannten Text/);
  });
});
