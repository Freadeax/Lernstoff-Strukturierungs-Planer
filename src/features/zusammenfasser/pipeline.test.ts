import { describe, expect, it } from 'vitest';
import type { Document, SourceChunk } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { quellenBloecke, systemPrompt } from './pipeline';

const doc = (id: string): Document => ({ id, title: `Dok ${id}`, kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: id, importedAt: '' });
const chunk = (id: string, documentId: string, page: number): SourceChunk => ({ id, documentId, page, printedPage: String(page + 10), text: `Text ${id}` });

describe('Zusammenfasser-Anfrage', () => {
  it('baut je Dokument einen Content-Block pro Chunk und merkt die Zuordnung', () => {
    const { bloecke, blockZuChunk } = quellenBloecke([doc('a'), doc('b')], [chunk('a2', 'a', 2), chunk('a1', 'a', 1), chunk('b1', 'b', 1)]);
    expect(blockZuChunk).toEqual([['a1', 'a2'], ['b1']]);
    expect(bloecke[0].source.content[0].text).toBe('[S. 11]\nText a1');
    expect(bloecke[0].citations.enabled).toBe(true);
    expect('cache_control' in bloecke[0]).toBe(false);
    expect('cache_control' in bloecke[1]).toBe(true);
  });

  it('setzt Modus und Länge in den Systemprompt ein', () => {
    const s = systemPrompt(pflegeModule, 'kurz');
    expect(s).toContain('## Modus: originalgetreu');
    expect(s).toContain('Länge kurz');
    expect(s).not.toMatch(/\{\{|<!--/);
  });
});
