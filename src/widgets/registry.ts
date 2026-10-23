import type { WidgetDefinition } from '../ui/widget/types';

// Widget-Katalog. Jeder Eintrag ist ein eigener Code-Chunk (dynamischer Import) und wird
// erst geladen, wenn seine Rasterzelle sichtbar wird.
export const WIDGETS = {
  kpi: { id: 'kpi', title: 'Lernfortschritt', span: { md: 12 }, placeholderHeight: 'var(--ph-kpi)', load: () => import('./kpi/KpiWidget') },
  charts: { id: 'charts', title: 'Aktivität und Belegquote', span: { md: 12, lg: 7, xl: 8 }, placeholderHeight: 'var(--ph-chart)', load: () => import('./charts/ChartWidget') },
  feed: { id: 'feed', title: 'Lernaktivität', span: { md: 12, lg: 5, xl: 4 }, placeholderHeight: 'var(--ph-feed)', load: () => import('./feed/FeedWidget') },
  themen: { id: 'themen', title: 'Themen', span: { md: 12 }, placeholderHeight: 'var(--ph-table)', load: () => import('./themen/ThemenWidget') },
  board: { id: 'board', title: 'Lernstand-Board', span: { md: 12 }, placeholderHeight: 'var(--ph-board)', load: () => import('./board/BoardWidget') },
  wizard: { id: 'wizard', title: 'Import-Assistent', span: { md: 12, lg: 10, xl: 8 }, placeholderHeight: 'var(--ph-wizard)', load: () => import('./wizard/ImportWizard') },
} satisfies Record<string, WidgetDefinition>;

export type WidgetId = keyof typeof WIDGETS;
