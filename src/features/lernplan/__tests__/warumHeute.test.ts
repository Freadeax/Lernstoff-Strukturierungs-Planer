import { describe, expect, it } from 'vitest';
import type { TopicProgress } from '../progress';
import type { PlanBlock } from '../scheduler';
import { warumHeute } from '../warumHeute';

const exam = { id: 'e', name: 'CE 05 Klausur', date: '2026-11-20', topicIds: ['t'], subjectIds: [] };
const block = (kind: PlanBlock['kind'], extra: Partial<PlanBlock> = {}): PlanBlock => ({ kind, topicId: 't', examId: 'e', minutes: 30, label: '', ...extra });
const prog = (p: Partial<TopicProgress>): TopicProgress => ({ topicId: 't', status: 'offen', studiedMinutes: 0, remainingStudyMinutes: 60, testCount: 0, reasons: [], ...p });

describe('Warum heute?', () => {
  it('erklärt Erarbeiten mit Prüfungsabstand und Restzeit', () => {
    const t = warumHeute(block('erarbeiten', { part: 1, parts: 2 }), prog({ studiedMinutes: 30, remainingStudyMinutes: 90 }), exam, '2026-11-13');
    expect(t).toContain('30 Min.');
    expect(t).toContain('1 Std. 30 Min.');
    expect(t).toContain('in 7 Tagen');
    expect(t).toContain('2 Einheiten');
  });
  it('erklärt die erste Abfrage', () => {
    expect(warumHeute(block('wiederholen'), prog({ status: 'bearbeitet' }), exam, '2026-11-13')).toContain('noch nie abgefragt');
  });
  it('nennt bei Wiederholungen die Abrufwahrscheinlichkeit', () => {
    expect(warumHeute(block('wiederholen'), prog({ status: 'unsicher', testCount: 2, retrievabilityToday: 0.78 }), exam, '2026-11-13')).toContain('78 %');
  });
  it('erklärt die letzte Abfrage vor der Prüfung', () => {
    expect(warumHeute(block('pruefungsvorbereitung'), prog({ testCount: 3 }), exam, '2026-11-19')).toContain('morgen');
  });
});
