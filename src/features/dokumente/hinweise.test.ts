import { describe, expect, it } from 'vitest';
import type { SourceChunk } from '../../core/types';
import { dubletten, leseHinweise } from './hinweise';
import { minhash } from './import/dedupe';
import type { Fingerprint } from './import/types';

const chunk = (id: string, page: number, extra: Partial<SourceChunk> = {}): SourceChunk => ({ id, documentId: 'd', page, text: 'Text', ...extra });

describe('Lesehinweise', () => {
  it('sammelt schwer lesbare Seiten (je Seite einmal), unleserliche Stellen und geschätzte Seiten', () => {
    const h = leseHinweise([
      chunk('1', 1, { ocrConfidence: 0.9 }),
      chunk('2', 2, { ocrConfidence: 0.5 }),
      chunk('3', 2, { ocrConfidence: 0.4 }),
      chunk('4', 3, { text: 'a ⟦?⟧ b ⟦?⟧', pageEstimated: true }),
    ]);
    expect(h.schwerLesbar).toEqual([{ chunkId: '2', seite: '2', sicherheit: 0.4 }]);
    expect(h.unleserlich).toBe(2);
    expect(h.ersteUnleserlich).toBe('4');
    expect(h.geschaetzt).toBe(true);
  });
  it('ohne Auffälligkeiten leer', () => {
    expect(leseHinweise([chunk('1', 1)])).toMatchObject({ schwerLesbar: [], unleserlich: 0, geschaetzt: false });
  });
});

describe('Dubletten aus Fingerabdrücken', () => {
  const text = 'Die Dekubitusprophylaxe umfasst Bewegungsförderung, Druckentlastung, Hautpflege und regelmäßige Risikoeinschätzung nach Expertenstandard.';
  const fp = (id: string, fileHash: string, t = text): Fingerprint & { kind: string } => ({
    documentId: id, title: id.toUpperCase(), fileHash, contentHash: t, minhash: minhash(t), paragraphHashes: [], meta: {} as Fingerprint['meta'], importedAt: '', kind: 'pdf',
  });
  it('trägt gleiche Dateien bei beiden Dokumenten ein', () => {
    const m = dubletten([fp('a', 'h1'), fp('b', 'h1'), fp('c', 'h3', 'Völlig anderer Inhalt über Händehygiene und die fünf Indikationen der WHO im Stationsalltag.')]);
    expect(m.get('a')?.map((x) => [x.kind, x.otherTitle])).toEqual([['gleiche-datei', 'B']]);
    expect(m.get('b')?.map((x) => [x.kind, x.otherTitle])).toEqual([['gleiche-datei', 'A']]);
    expect(m.has('c')).toBe(false);
  });
});
