import { describe, expect, it } from 'vitest';
import { computeProgress, DEFAULT_SETTINGS, type ReviewLog } from '..';
import { topics } from './fixtures';

const haut = topics[0]!;
const study = [{ topicId: 'haut', date: '2026-10-20', minutes: 90 }];

describe('Fortschrittsstatus', () => {
  it('ohne Aktivität ist ein Thema offen', () => {
    expect(computeProgress(haut, [], [], '2026-10-26', DEFAULT_SETTINGS).status).toBe('offen');
  });

  it('gelesen ist nicht verstanden: ohne Abfrage höchstens „bearbeitet“, Abfrage sofort fällig', () => {
    const p = computeProgress(haut, study, [], '2026-10-26', DEFAULT_SETTINGS);
    expect(p.status).toBe('bearbeitet');
    expect(p.remainingStudyMinutes).toBe(0);
    expect(p.nextReview).toBe('2026-10-26');
  });

  it('Selbsteinschätzung hebt den Status nicht an', () => {
    const logs: ReviewLog[] = [
      { topicId: 'haut', date: '2026-10-21', source: 'selbsteinschaetzung', rating: 4 },
      { topicId: 'haut', date: '2026-10-24', source: 'selbsteinschaetzung', rating: 4 },
    ];
    const p = computeProgress(haut, study, logs, '2026-10-26', DEFAULT_SETTINGS);
    expect(p.status).toBe('bearbeitet');
    expect(p.reasons.join(' ')).toMatch(/Selbsteinschätzungen/);
  });

  it('eine einzelne gute Abfrage reicht nicht für „sicher“', () => {
    const logs: ReviewLog[] = [{ topicId: 'haut', date: '2026-10-25', source: 'quiz', scorePercent: 95 }];
    expect(computeProgress(haut, study, logs, '2026-10-26', DEFAULT_SETTINGS).status).toBe('unsicher');
  });

  it('mehrfach erfolgreich an verschiedenen Tagen abgefragt ist „sicher“', () => {
    const logs: ReviewLog[] = [
      { topicId: 'haut', date: '2026-10-21', source: 'karteikarten', rating: 3 },
      { topicId: 'haut', date: '2026-10-24', source: 'quiz', scorePercent: 85 },
    ];
    const p = computeProgress(haut, study, logs, '2026-10-26', DEFAULT_SETTINGS);
    expect(p.status).toBe('sicher');
    expect(p.nextReview! > '2026-10-26').toBe(true);
  });

  it('ein schlechtes letztes Ergebnis macht ein Thema wieder unsicher', () => {
    const logs: ReviewLog[] = [
      { topicId: 'haut', date: '2026-10-15', source: 'quiz', rating: 3 },
      { topicId: 'haut', date: '2026-10-19', source: 'quiz', rating: 3 },
      { topicId: 'haut', date: '2026-10-25', source: 'pruefungssimulation', scorePercent: 40 },
    ];
    expect(computeProgress(haut, study, logs, '2026-10-26', DEFAULT_SETTINGS).status).toBe('unsicher');
  });

  it('ohne Wiederholung sinkt ein sicheres Thema mit der Zeit auf „unsicher“', () => {
    const logs: ReviewLog[] = [
      { topicId: 'haut', date: '2026-10-21', source: 'quiz', rating: 3 },
      { topicId: 'haut', date: '2026-10-24', source: 'quiz', rating: 3 },
    ];
    const later = computeProgress(haut, study, logs, '2027-01-15', DEFAULT_SETTINGS);
    expect(later.status).toBe('unsicher');
    expect(later.reasons.join(' ')).toMatch(/vergessen/);
  });

  it('Logs aus der Zukunft werden nicht mitgezählt', () => {
    const logs: ReviewLog[] = [{ topicId: 'haut', date: '2026-11-01', source: 'quiz', rating: 4 }];
    expect(computeProgress(haut, study, logs, '2026-10-26', DEFAULT_SETTINGS).testCount).toBe(0);
  });
});
