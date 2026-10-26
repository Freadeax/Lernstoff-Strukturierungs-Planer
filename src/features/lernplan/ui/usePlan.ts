import { ladeThemen } from '../../../core/topics';
import { useMemo } from 'react';
import type { BoardColumn } from '../../../core/board';
import type { Exam, Subject, Topic } from '../../../core/types';
import { getModule } from '../../../modules/registry';
import { useStore } from '../../../ui/lib/store';
import { session } from '../../../ui/shell/session';
import { useWidgetData } from '../../../ui/widget/useWidgetData';
import { buildPlan, type StudyPlan } from '../scheduler';
import { forecastExams, type ExamForecast } from '../forecast';
import { resolveSettings, type PlannerInput, type PlannerSettings } from '../types';
import { assembleInput, heute, leafTopics, loadPlannerData, type PlannerData } from '../store';

export interface PlanCtx {
  data: PlannerData;
  input: PlannerInput;
  plan: StudyPlan;
  forecasts: ExamForecast[];
  settings: PlannerSettings;
  topics: Map<string, Topic>;
  leaves: Topic[];
  subjects: Subject[];
  exams: Map<string, Exam>;
  column: (topicId: string) => BoardColumn;
}

/** Plan, Prognose und Nachschlagetabellen aus den geladenen Fakten. */
export function usePlan(): { ctx?: PlanCtx; error?: Error; retry: () => void } {
  const moduleId = useStore(session, (s) => s.moduleId);
  const mod = getModule(moduleId);
  const { state, retry } = useWidgetData({ deps: [moduleId], load: async () => loadPlannerData(await ladeThemen(moduleId), heute()) });
  const data = state.status === 'ideal' || state.status === 'partial' ? state.data : undefined;
  const ctx = useMemo(() => {
    if (!data) return undefined;
    const input = assembleInput(data);
    const board = new Map(data.board.map((b) => [b.topicId, b.column]));
    return {
      data, input,
      plan: buildPlan(input),
      forecasts: forecastExams(input),
      settings: resolveSettings(input),
      topics: new Map(data.topics.map((t) => [t.id, t])),
      leaves: leafTopics(data.topics),
      subjects: mod?.subjects ?? [],
      exams: new Map(data.exams.map((e) => [e.id, e])),
      column: (id: string) => board.get(id) ?? 'pool',
    } satisfies PlanCtx;
  }, [data, mod]);
  return { ctx, error: state.status === 'error' ? state.error : undefined, retry };
}

