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
  /** Gruppe startet eingeklappt (klappt auf, wenn eine Seite darin offen ist). */
  zu?: boolean;
}

export const NAV: NavItem[] = [
  { id: 'heute', label: 'Heute', path: '/', icon: 'home' },
  {
    id: 'lernen', label: 'Lernen', icon: 'book', children: [
      { id: 'wegweiser', label: 'So lernst du hier', path: '/lernen/wegweiser', icon: 'sparkle' },
      { id: 'plan', label: 'Lernplan', path: '/lernen/plan', icon: 'calendar' },
      { id: 'ce', label: 'Curriculare Einheiten', path: '/lernen/ce', icon: 'layers' },
      { id: 'themen', label: 'Themen', path: '/lernen/themen', icon: 'table' },
      { id: 'skript', label: 'Skript', path: '/lernen/skript', icon: 'book' },
      { id: 'dnqp', label: 'Expertenstandards (DNQP)', path: '/lernen/dnqp', icon: 'star' },
      { id: 'karten', label: 'Karteikarten', path: '/lernen/karten', icon: 'cards' },
      { id: 'schnellsuche', label: 'Standard-Schnellsucher', path: '/lernen/schnellsuche', icon: 'search' },
      { id: 'landkarte', label: 'Themen-Landkarte', path: '/lernen/landkarte', icon: 'map' },
      { id: 'board', label: 'Mein Themenboard', path: '/lernen/board', icon: 'board' },
      { id: 'fortschritt', label: 'Fortschritt', path: '/lernen/fortschritt', icon: 'gauge' },
      { id: 'faecher', label: 'Fächer', path: '/lernen/faecher', icon: 'layers' },
    ],
  },
  {
    // Drei Bündel statt einer langen Liste: Wissen festigen, in der Praxis anwenden, auf die Prüfung vorbereiten.
    id: 'ueben', label: 'Üben', icon: 'clipboard', zu: true, children: [
      { id: 'ueben-alle', label: 'Alle Übungen', path: '/lernen/ueben', icon: 'clipboard' },
      {
        id: 'fachwissen', label: 'Fachwissen', icon: 'book', zu: true, children: [
          { id: 'krankheitsbilder', label: 'Krankheitsbilder', path: '/lernen/krankheitsbilder', icon: 'pulse' },
          { id: 'anatomie', label: 'Anatomie-Trainer', path: '/lernen/anatomie', icon: 'heart' },
          { id: 'arzneimittel', label: 'Arzneimittel-Trainer', path: '/lernen/arzneimittel', icon: 'pill' },
          { id: 'normwerte', label: 'Normwerte-Trainer', path: '/lernen/normwerte', icon: 'thermo' },
          { id: 'hygiene', label: 'Hygiene-Trainer', path: '/lernen/hygiene', icon: 'shield' },
          { id: 'expertenstandards', label: 'Expertenstandards', path: '/lernen/expertenstandards', icon: 'star' },
          { id: 'recht', label: 'Recht-Trainer', path: '/lernen/recht', icon: 'scale' },
          { id: 'rechnen', label: 'Rechentrainer', path: '/lernen/rechnen', icon: 'calc' },
          { id: 'duell', label: 'Fachbegriff-Duell', path: '/lernen/duell', icon: 'duell' },
          { id: 'mindmap', label: 'Mindmaps', path: '/lernen/mindmap', icon: 'mindmap' },
        ],
      },
      {
        id: 'praxis-gruppe', label: 'Praxis', icon: 'user', zu: true, children: [
          { id: 'praxis', label: 'Praxissimulator', path: '/lernen/praxis', icon: 'clipboard' },
          { id: 'fall', label: 'Fallsimulator', path: '/lernen/fall', icon: 'user' },
          { id: 'diagnostik', label: 'Labor und Bildgebung', path: '/lernen/diagnostik', icon: 'flask' },
          { id: 'labor', label: 'Labor-Trainer', path: '/lernen/labor', icon: 'pulse' },
          { id: 'notfall', label: 'Notfall-Trainer', path: '/lernen/notfall', icon: 'siren' },
          { id: 'assessment', label: 'Assessments', path: '/lernen/assessment', icon: 'gauge' },
          { id: 'pflegeplanung', label: 'Pflegeplanung', path: '/lernen/pflegeplanung', icon: 'clipboard' },
          { id: 'sis', label: 'SIS-Trainer', path: '/lernen/sis', icon: 'form' },
          { id: 'bericht', label: 'Pflegebericht-Trainer', path: '/lernen/bericht', icon: 'pen' },
          { id: 'uebergabe', label: 'Übergabe-Trainer', path: '/lernen/uebergabe', icon: 'chat' },
        ],
      },
      {
        id: 'pruefung-gruppe', label: 'Prüfung', icon: 'timer', zu: true, children: [
          { id: 'simulation', label: 'Prüfungssimulation', path: '/lernen/simulation', icon: 'timer' },
          // Fallakte: ein Fall durch alle Dokumentationstrainer, wie in der praktischen Prüfung
          { id: 'fallakte', label: 'Fallakte', path: '/lernen/fallakte', icon: 'folder' },
          { id: 'examen', label: 'Examen', path: '/lernen/examen', icon: 'examen' },
          { id: 'fehler', label: 'Fehlerheft', path: '/lernen/fehler', icon: 'alert' },
          // Praxis und Fachwissen sind mit je zehn Einträgen voll; Blutdruck nach Gehör ist auch Prüfungsstoff (praktische Prüfung).
          { id: 'hoeren', label: 'Hör-Trainer', path: '/lernen/hoeren', icon: 'stetho' },
          { id: 'klasse', label: 'Klassenmodus', path: '/lernen/klasse', icon: 'klasse' },
        ],
      },
    ],
  },
  {
    // Lehrermodus: für Lehrkräfte und Praxisanleitung (Klassen, Fälle verteilen, bewerten). Startet eingeklappt.
    id: 'lehren', label: 'Lehren', icon: 'klasse', zu: true, children: [
      { id: 'lehrer', label: 'Lehrermodus', path: '/lehren', icon: 'klasse' },
      { id: 'lehrer-klassen', label: 'Klassen', path: '/lehren/klassen', icon: 'user' },
      { id: 'lehrer-aufgaben', label: 'Fälle und Aufgaben', path: '/lehren/aufgaben', icon: 'clipboard' },
      { id: 'lehrer-abgaben', label: 'Abgaben', path: '/lehren/abgaben', icon: 'upload' },
    ],
  },
  {
    id: 'material', label: 'Material', icon: 'folder', children: [
      { id: 'dokumente', label: 'Dokumente', path: '/material/dokumente', icon: 'folder' },
      { id: 'import', label: 'Import-Assistent', path: '/material/import', icon: 'upload' },
      { id: 'ablage', label: 'Große Dateien', path: '/material/ablage', icon: 'upload' },
      { id: 'zusammenfassen', label: 'Zusammenfassen', path: '/material/zusammenfassen', icon: 'sparkle' },
    ],
  },
  {
    id: 'system', label: 'System', icon: 'settings', children: [
      { id: 'sicherung', label: 'Datensicherung', path: '/system/sicherung', icon: 'save' },
      { id: 'bilder', label: 'Bildprüfung', path: '/system/bilder', icon: 'check' },
      { id: 'einstellungen', label: 'Einstellungen', path: '/einstellungen', icon: 'settings' },
      { id: 'testphase', label: 'Testphase und Rückmeldung', path: '/system/test', icon: 'chat' },
    ],
  },
];

/** Seiten ohne eigenen Menüeintrag (erreichbar über Links), für Seitentitel und Gerätetest. */
export const UNTERSEITEN: NavItem[] = [
  { id: 'thema', label: 'Thema', path: '/lernen/thema', icon: 'book' },
  { id: 'design', label: 'Designsystem', path: '/system/design', icon: 'palette' },
];

/** Untere Leiste auf dem Handy: vier feste Ziele plus „Mehr“ (öffnet das ganze Menü). */
export interface Tab { id: string; label: string; path: string; icon: IconName; bereich: (path: string) => boolean }

export const TABS: Tab[] = [
  { id: 'heute', label: 'Heute', path: '/', icon: 'home', bereich: (p) => p === '/' },
  { id: 'plan', label: 'Lernplan', path: '/lernen/plan', icon: 'calendar', bereich: (p) => p === '/lernen/plan' },
  { id: 'material', label: 'Material', path: '/material/dokumente', icon: 'folder', bereich: (p) => p.startsWith('/material/') },
  { id: 'ueben', label: 'Üben', path: '/lernen/ueben', icon: 'clipboard', bereich: (p) => uebenPfade().has(p) },
];

let _ueben: Set<string> | undefined;
function uebenPfade(): Set<string> {
  _ueben ??= new Set(flatNav(NAV.find((i) => i.id === 'ueben')?.children ?? []).map((i) => i.path!));
  return _ueben;
}

/** Menü-ID einer Übungsseite (unter „Üben“, ohne die Übersicht), sonst undefined. Für die Leiste „Passt dazu“. */
export function uebungsId(path: string): string | undefined {
  if (!uebenPfade().has(path) || path === '/lernen/ueben') return undefined;
  return flatNav(NAV.find((i) => i.id === 'ueben')?.children ?? []).find((i) => i.path === path)?.id;
}

/** Die drei Bündel unter „Üben“ (für die Übersichtsseite). */
export function uebenGruppen(): NavItem[] {
  return (NAV.find((i) => i.id === 'ueben')?.children ?? []).filter((i) => i.children?.length);
}

export function visibleNav(items: NavItem[], roles: Role[]): NavItem[] {
  return items
    .filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)))
    .map((i) => (i.children ? { ...i, children: visibleNav(i.children, roles) } : i))
    .filter((i) => i.path || i.children?.length);
}

export function flatNav(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => [...(i.path ? [i] : []), ...flatNav(i.children ?? [])]);
}

/** Seitentitel für einen Pfad, auch für Seiten ohne Menüeintrag. */
export function seitenName(path: string): string | undefined {
  return [...flatNav(NAV), ...UNTERSEITEN].find((i) => i.path === path)?.label;
}

/** Bereich einer Seite (oberste Menügruppe): steuert die Akzentfarbe der Shell über `data-bereich`. */
export type Bereich = 'heute' | 'lernen' | 'ueben' | 'lehren' | 'material' | 'system';
export const BEREICH_NAME: Record<Bereich, string> = { heute: 'Heute', lernen: 'Lernen', ueben: 'Üben', lehren: 'Lehren', material: 'Material', system: 'System' };

export function bereichVon(path: string): Bereich {
  if (path === '/') return 'heute';
  const gruppe = NAV.find((g) => flatNav(g.children ?? []).some((i) => i.path === path || path.startsWith(i.path + '/')));
  if (gruppe) return gruppe.id as Bereich;
  if (path.startsWith('/material/')) return 'material';
  if (path === '/lehren' || path.startsWith('/lehren/')) return 'lehren';
  if (path.startsWith('/lernen/')) return 'lernen';
  return 'system';
}

/** Wo eine Seite im Menü liegt, zum Beispiel „Üben · Fachwissen“. Steht als Marke über dem Seitentitel. */
export function gruppenPfad(path: string): string {
  const suche = (items: NavItem[], spur: string[]): string[] | undefined => {
    for (const i of items) {
      if (i.path === path) return spur;
      const tiefer = i.children && suche(i.children, [...spur, i.label]);
      if (tiefer) return tiefer;
    }
    return undefined;
  };
  return (suche(NAV, []) ?? [BEREICH_NAME[bereichVon(path)]]).join(' · ') || BEREICH_NAME[bereichVon(path)];
}

/** Alte Pfade (vor dem Designsystem) weiterleiten. */
export const REDIRECTS: Record<string, string> = {
  '/dokumente': '/material/dokumente',
  '/zusammenfassen': '/material/zusammenfassen',
  '/faecher': '/lernen/faecher',
  '/lernplan': '/lernen/plan',
  '/sicherung': '/system/sicherung',
};
