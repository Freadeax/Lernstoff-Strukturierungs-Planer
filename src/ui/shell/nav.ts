import type { IconName } from '../icons';

/**
 * Rollen: heute gibt es nur „lernende“. Erweiterungspunkt für Lehrende oder Praxisanleitung:
 * Rollen kämen dann aus den Claims eines Anmelde-Tokens (JWT) und blenden Menüpunkte ein oder aus.
 */
export type Role = 'lernende' | 'lehrende' | 'admin';

export interface NavItem {
  id: string;
  label: string;
  path?: string;          // Gruppen ohne eigenen Pfad
  icon?: IconName;
  roles?: Role[];         // fehlt = für alle sichtbar
  children?: NavItem[];   // bis zu drei Ebenen
  tab?: boolean;          // in der unteren Leiste auf dem Handy
}

export const NAV: NavItem[] = [
  { id: 'uebersicht', label: 'Übersicht', path: '/', icon: 'home', tab: true },
  {
    id: 'lernen', label: 'Lernen', icon: 'book', children: [
      { id: 'plan', label: 'Lernplan', path: '/lernen/plan', icon: 'calendar', tab: true },
      { id: 'themen', label: 'Themen', path: '/lernen/themen', icon: 'table', tab: true },
      { id: 'ce', label: 'Curriculare Einheiten', path: '/lernen/ce', icon: 'layers' },
      { id: 'landkarte', label: 'Themen-Landkarte', path: '/lernen/landkarte', icon: 'map' },
      { id: 'board', label: 'Lernstand', path: '/lernen/board', icon: 'board', tab: true },
      { id: 'skript', label: 'Skript', path: '/lernen/skript', icon: 'book' },
      { id: 'karten', label: 'Karteikarten', path: '/lernen/karten', icon: 'cards', tab: true },
      { id: 'faecher', label: 'Fächer', path: '/lernen/faecher', icon: 'layers' },
    ],
  },
  {
    id: 'ueben', label: 'Üben & anwenden', icon: 'clipboard', children: [
      { id: 'rechnen', label: 'Rechentrainer', path: '/lernen/rechnen', icon: 'calc' },
      { id: 'fall', label: 'Fallsimulator', path: '/lernen/fall', icon: 'user' },
      { id: 'praxis', label: 'Praxissimulator', path: '/lernen/praxis', icon: 'clipboard' },
      { id: 'duell', label: 'Fachbegriff-Duell', path: '/lernen/duell', icon: 'duell' },
      { id: 'examen', label: 'Examen', path: '/lernen/examen', icon: 'examen' },
      { id: 'simulation', label: 'Prüfungssimulation', path: '/lernen/simulation', icon: 'timer' },
      { id: 'fehler', label: 'Fehlerheft', path: '/lernen/fehler', icon: 'alert' },
      { id: 'pflegeplanung', label: 'Pflegeplanung', path: '/lernen/pflegeplanung', icon: 'clipboard' },
      { id: 'sis', label: 'SIS-Trainer', path: '/lernen/sis', icon: 'form' },
      { id: 'bericht', label: 'Pflegebericht-Trainer', path: '/lernen/bericht', icon: 'pen' },
      { id: 'mindmap', label: 'Mindmaps', path: '/lernen/mindmap', icon: 'mindmap' },
      { id: 'klasse', label: 'Klassenmodus', path: '/lernen/klasse', icon: 'klasse' },
      { id: 'krankheitsbilder', label: 'Krankheitsbilder', path: '/lernen/krankheitsbilder', icon: 'pulse' },
      { id: 'assessment', label: 'Assessments', path: '/lernen/assessment', icon: 'gauge' },
      { id: 'uebergabe', label: 'Übergabe-Trainer', path: '/lernen/uebergabe', icon: 'chat' },
    ],
  },
  {
    id: 'material', label: 'Material', icon: 'folder', children: [
      { id: 'dokumente', label: 'Dokumente', path: '/material/dokumente', icon: 'folder', tab: true },
      { id: 'import', label: 'Import-Assistent', path: '/material/import', icon: 'upload' },
      { id: 'ablage', label: 'Große Dateien', path: '/material/ablage', icon: 'upload' },
      { id: 'zusammenfassen', label: 'Zusammenfassen', path: '/material/zusammenfassen', icon: 'sparkle' },
    ],
  },
  {
    id: 'system', label: 'System', icon: 'settings', children: [
      { id: 'sicherung', label: 'Datensicherung', path: '/system/sicherung', icon: 'save' },
      { id: 'einstellungen', label: 'Einstellungen', path: '/einstellungen', icon: 'settings' },
      { id: 'design', label: 'Designsystem', path: '/system/design', icon: 'palette' },
    ],
  },
];

export function visibleNav(items: NavItem[], roles: Role[]): NavItem[] {
  return items
    .filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)))
    .map((i) => (i.children ? { ...i, children: visibleNav(i.children, roles) } : i))
    .filter((i) => i.path || i.children?.length);
}

export function flatNav(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => [...(i.path ? [i] : []), ...flatNav(i.children ?? [])]);
}

/** Alte Pfade (vor dem Designsystem) weiterleiten. */
export const REDIRECTS: Record<string, string> = {
  '/dokumente': '/material/dokumente',
  '/zusammenfassen': '/material/zusammenfassen',
  '/faecher': '/lernen/faecher',
  '/lernplan': '/lernen/plan',
  '/sicherung': '/system/sicherung',
};
