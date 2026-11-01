import { beforeEach, describe, expect, it, vi } from 'vitest';

const meldungen: string[] = [];
vi.mock('../../ui/shell/notifications', () => ({ notify: (_s: string, titel: string) => { meldungen.push(titel); } }));
vi.mock('../../core/activity', () => ({ logActivity: async () => undefined }));

import { pflegeModule } from '../../modules/pflege';
import { DEFAULT_SETTINGS } from '../lernplan/types';
import type { FortschrittDaten } from './daten';
import { pruefeFortschritt } from './hintergrund';
import { standardZiele } from './statistik';

let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  meldungen.length = 0;
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k), key: (i: number) => [...data.keys()][i] ?? null, get length() { return data.size; },
  });
});

const quiz = (date: string) => ({ topicId: 'thema.ap.herz', date, source: 'quiz' as const, rating: 3 as const });
function daten(today: string, reviews: ReturnType<typeof quiz>[] = [], kartenTage: string[] = []): FortschrittDaten {
  return {
    today, modul: pflegeModule, skripte: [], exams: [],
    fakten: { studyLogs: [], reviewLogs: reviews, kartenLogs: kartenTage.map((date) => ({ date, rating: 3 })) },
    lernstand: { leaves: [], studyLogs: [], reviewLogs: reviews, settings: DEFAULT_SETTINGS },
  };
}
const um = (tag: string, stunde: number) => new Date(`${tag}T${String(stunde - 1).padStart(2, '0')}:30:00Z`); // MEZ = UTC+1

describe('Hintergrundprüfung', () => {
  it('erster Lauf ohne Meilensteine merkt sich den Start; danach erreichte werden gemeldet, auch mehrere', () => {
    pruefeFortschritt(daten('2026-11-02'), standardZiele(), um('2026-11-02', 10));
    expect(meldungen).toEqual([]);
    // erste Abfrage + 3 Tage Serie gleichzeitig: beide sind neu und werden gemeldet
    pruefeFortschritt(daten('2026-11-02', [quiz('2026-10-31'), quiz('2026-11-01'), quiz('2026-11-02')]), standardZiele(), um('2026-11-02', 11));
    expect(meldungen).toEqual(['Meilenstein erreicht: Erste Abfrage', 'Meilenstein erreicht: Drei Tage am Stück']);
    pruefeFortschritt(daten('2026-11-02', [quiz('2026-10-31'), quiz('2026-11-01'), quiz('2026-11-02')]), standardZiele(), um('2026-11-02', 12));
    expect(meldungen).toHaveLength(2);
  });

  it('erster Lauf mit schon erreichten Meilensteinen bleibt still', () => {
    pruefeFortschritt(daten('2026-11-02', [quiz('2026-11-02')]), standardZiele(), um('2026-11-02', 10));
    expect(meldungen).toEqual([]);
  });

  it('Serien-Erinnerung erst nachmittags, auch wenn vormittags schon geprüft wurde, und nur einmal', () => {
    const d = daten('2026-11-02', [], ['2026-10-30', '2026-10-31', '2026-11-01']);
    pruefeFortschritt(d, standardZiele(), um('2026-11-02', 10));
    expect(meldungen.filter((m) => m.startsWith('Deine Serie'))).toEqual([]);
    pruefeFortschritt(d, standardZiele(), um('2026-11-02', 17));
    pruefeFortschritt(d, standardZiele(), um('2026-11-02', 18));
    expect(meldungen.filter((m) => m.startsWith('Deine Serie'))).toEqual(['Deine Serie: 3 Lerntage']);
  });

  it('keine Erinnerung mit Daten von gestern (Seite über Nacht offen)', () => {
    pruefeFortschritt(daten('2026-11-01', [], ['2026-10-30', '2026-10-31']), standardZiele(), um('2026-11-02', 17));
    expect(meldungen.filter((m) => m.startsWith('Deine Serie'))).toEqual([]);
  });
});
