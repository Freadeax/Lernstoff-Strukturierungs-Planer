import { describe, expect, it } from 'vitest';
import { lernstufen } from './statistik';

describe('Lernstufen', () => {
  it('zählt gelesen, abgerufen, angewendet und bestätigt getrennt, Selbsteinschätzung nirgends', () => {
    const st = lernstufen(
      ['a', 'b', 'c', 'd'],
      [{ topicId: 'a', date: '2026-11-01', minutes: 30 }, { topicId: 'x', date: '2026-11-01', minutes: 30 }],
      [
        { topicId: 'a', date: '2026-11-02', source: 'karteikarten', rating: 3 },
        { topicId: 'b', date: '2026-11-02', source: 'trainer', scorePercent: 80 },
        { topicId: 'c', date: '2026-11-02', source: 'selbsteinschaetzung', rating: 4 },
      ],
      (id) => (id === 'a' ? 'sicher' : 'offen'),
      ['d', 'fremd'],
    );
    expect(st).toEqual({ gelesen: ['a', 'd'], abgerufen: ['a'], angewendet: ['b'], bestaetigt: ['a'] });
  });
});
