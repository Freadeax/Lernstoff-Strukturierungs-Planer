import { describe, expect, it } from 'vitest';
import { teileQuellen, verbindeZusammenfassungen } from './grosseQuellen';
import type { Summary } from '../../core/types';

describe('große Quellen', () => {
  it('berücksichtigt jeden Originalabschnitt genau einmal', () => {
    const chunks = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, documentId: 'd', page: i + 1, text: 'x'.repeat(15000) }));
    const teile = teileQuellen(chunks);
    expect(teile).toHaveLength(4);
    expect(teile.flat()).toEqual(chunks);
    expect(teile.every((t) => t.reduce((n, c) => n + c.text.length, 0) <= 45000)).toBe(true);
  });
  it('erhält Originalbelege, eindeutige IDs und die strengste Qualitätsbewertung', () => {
    const teil = (ampel: 'gruen' | 'rot', chunkId: string): Summary => ({ id: 's', mode: 'originalgetreu', length: 'kurz', topicIds: [], sourceDocumentIds: ['d'], createdAt: '', needsReview: false,
      claims: [{ id: 'c1', blockId: 'b1', text: 'Inhalt', citations: [{ documentId: 'd', chunkId, page: 1, quote: 'Inhalt' }], status: 'belegt', isSupplementary: false }],
      blocks: [{ id: 'b1', type: 'absatz', claimIds: ['c1'] }], rootBlockIds: ['b1'],
      qa: { ampel, befunde: [{ id: 'q1', pruefung: 'K1', schwere: 'warnung', claimId: 'c1', meldung: 'Prüfen' }], reparaturVersucht: false, statistik: { claims: 1, belegt: 1, unbelegt: 0, ergaenzung: 0, fehlt: 0 } } });
    const r = verbindeZusammenfassungen([teil('gruen', 'original1'), teil('rot', 'original2')]);
    expect(new Set(r.claims.map((c) => c.id)).size).toBe(2);
    expect(r.claims.map((c) => c.citations[0]!.chunkId)).toEqual(['original1', 'original2']);
    expect(r.blocks!.map((b) => b.claimIds[0])).toEqual(r.claims.map((c) => c.id));
    expect(r.qa!.ampel).toBe('rot');
    expect(r.qa!.statistik.claims).toBe(2);
    expect(r.qa!.befunde.map((b) => b.claimId)).toEqual(r.claims.map((c) => c.id));
  });
});
