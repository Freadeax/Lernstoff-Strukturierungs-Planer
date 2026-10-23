import { useMemo } from 'react';
import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { SyncBadge, WidgetHostProps, WidgetLifecycle, WidgetState } from '../../ui/widget/types';
import { useStore } from '../../ui/lib/store';
import { formatDay } from '../../ui/lib/time';
import { session } from '../../ui/shell/session';
import { drillDown, filterStore, presetRange } from '../filter/filterStore';
import { activeDays, buildChart, loadSnapshot, type ChartData } from '../data';
import { createCrosshair, LineChart, StackedBarChart, type Series } from './engine';

const shortDay = (d: string) => formatDay(d).replace(/^(\w+)\.?,?\s*/, '');

export function ChartSkeleton() {
  return (
    <div className="charts">
      {[0, 1].map((i) => (
        <div key={i} className="chart">
          <Bone w="40%" h="var(--text-sm)" />
          <Bone h="var(--chart-h)" r="var(--radius-sm)" />
          <Bone w="100%" h="var(--text-xs)" />
        </div>
      ))}
    </div>
  );
}

export function ChartView({ id, state, badge, onRetry, lastSynced, onHide, onDrill, onWiden, lifecycle }: {
  id: string; state: WidgetState<ChartData>; badge: SyncBadge; onRetry: () => void; lastSynced?: Date; onHide?: () => void;
  onDrill?: (day: string) => void; onWiden?: () => void; lifecycle?: WidgetLifecycle;
}) {
  const crosshair = useMemo(createCrosshair, []);
  return (
    <Widget id={id} state={state} onRetry={onRetry} skeleton={<ChartSkeleton />} lifecycle={lifecycle}
      header={{
        title: 'Aktivität und Belegquote', subtitle: 'Tippe auf einen Tag, um alle Module darauf zu filtern', badge, onHide,
        exportRows: state.status === 'ideal' || state.status === 'partial'
          ? () => state.data.days.map((d, i) => ({ tag: d, import: state.data.stacks.import[i], zusammenfassung: state.data.stacks.zusammenfassung[i], lernstand: state.data.stacks.lernstand[i], belegquote: state.data.quote[i] })) : undefined,
      }}
      body={{ minHeight: 'var(--chart-body-h)', maxHeight: 'none' }}
      empty={{ illustration: 'diagramm', title: 'Keine Aktivität im Zeitraum', message: 'In diesem Zeitraum wurde nichts importiert, zusammengefasst oder verschoben.', cta: { label: 'Auf 90 Tage erweitern', onClick: onWiden } }}
      footer={{ lastSynced }}>
      {(data) => {
        const bars: Series[] = [
          { key: 'import', label: 'Import', color: 'var(--color-series-1)', values: data.stacks.import },
          { key: 'zusammenfassung', label: 'Zusammenfassung', color: 'var(--color-series-2)', values: data.stacks.zusammenfassung },
          { key: 'lernstand', label: 'Lernstand', color: 'var(--color-series-3)', values: data.stacks.lernstand },
        ];
        const line: Series[] = [{ key: 'quote', label: 'Belegte Aussagen', color: 'var(--color-series-2)', values: data.quote }];
        const drill = (i: number) => onDrill?.(data.days[i]!);
        return (
          <div className="charts">
            <div>
              <div className="chart__head"><h4>Aktivität je Tag</h4>
                <ul className="legend" role="list">{bars.map((s) => <li key={s.key}><span className="chart__swatch" style={{ background: s.color }} />{s.label}</li>)}</ul>
              </div>
              <StackedBarChart label="Aktivität je Tag" days={data.days} series={bars} crosshair={crosshair} onDrill={drill} formatDay={shortDay} />
            </div>
            <div>
              <div className="chart__head"><h4>Belegte Aussagen</h4><span className="muted">Durchschnitt je Tag</span></div>
              <LineChart label="Anteil belegter Aussagen je Tag" days={data.days} series={line} crosshair={crosshair} onDrill={drill}
                formatDay={shortDay} max={1} format={(v) => `${Math.round(v * 100)} %`} />
            </div>
          </div>
        );
      }}
    </Widget>
  );
}

export default function ChartWidget({ id, onHide, lifecycle }: WidgetHostProps) {
  const from = useStore(filterStore, (f) => f.from);
  const to = useStore(filterStore, (f) => f.to);
  const timeZone = useStore(filterStore, (f) => f.timeZone);
  const subjectId = useStore(filterStore, (f) => f.subjectId);
  const moduleId = useStore(session, (s) => s.moduleId);
  const { state, retry, lastSynced, badge } = useWidgetData({
    deps: [from, to, timeZone, subjectId, moduleId],
    load: async () => buildChart(await loadSnapshot({ subjectId }, moduleId), { from, to, timeZone }),
    isEmpty: (d) => activeDays([d.stacks.import, d.stacks.zusammenfassung, d.stacks.lernstand]) === 0,
    isPartial: (d) => d.days.length > 1 && activeDays([d.stacks.import, d.stacks.zusammenfassung, d.stacks.lernstand]) < 3
      && 'Erst an wenigen Tagen Aktivität. Der Verlauf füllt sich mit der Zeit.',
  });
  return <ChartView id={id} state={state} badge={badge} onRetry={retry} lastSynced={lastSynced} onHide={onHide} lifecycle={lifecycle}
    onDrill={(day) => { if (from !== to) drillDown(day); }} onWiden={() => filterStore.set({ ...presetRange(90), previous: undefined })} />;
}
