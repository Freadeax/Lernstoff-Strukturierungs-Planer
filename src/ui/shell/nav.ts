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
  /** Oberste Gruppe: Akzentfarbe ihrer Seiten (fehlt = aus dem Pfad abgeleitet, z. B. unter „Mehr“). */
  bereich?: Bereich;
  /** Weitere Seiten, bei denen dieser Menüpunkt als aktiv gilt (z. B. Ansichten der Themenseite). */
  auch?: string[];
}

// ---------- Übungen: drei Bündel (Übersicht „Alle Übungen“, Heute-Kacheln, „Passt dazu“) ----------
// Die Bündel sind unabhängig vom Menü: das Menü verteilt dieselben Einträge auf „Üben“, „Praxis“ und „Prüfung“.

const UEB = {
  wissen: { id: 'wissen', label: 'Wissenstrainer', path: '/lernen/wissen', icon: 'book' },
  krankheitsbilder: { id: 'krankheitsbilder', label: 'Krankheitsbilder', path: '/lernen/krankheitsbilder', icon: 'pulse' },
  // Praxissimulator: Praxisfälle (geführt und frei) und Kurzfälle (früher eigener Fallsimulator, mit oder ohne KI).
  praxis: { id: 'praxis', label: 'Praxissimulator', path: '/lernen/praxis', icon: 'clipboard' },
  fertigkeiten: { id: 'fertigkeiten', label: 'Fertigkeiten-Trainer', path: '/lernen/fertigkeiten', icon: 'stetho' },
  dokumentation: { id: 'dokumentation', label: 'Dokumentations-Trainer', path: '/lernen/dokumentation', icon: 'form' },
  diagnostik: { id: 'diagnostik', label: 'Labor und Bildgebung', path: '/lernen/diagnostik', icon: 'flask' },
  simulation: { id: 'simulation', label: 'Prüfungssimulation', path: '/lernen/simulation', icon: 'timer' },
  examen: { id: 'examen', label: 'Examen', path: '/lernen/examen', icon: 'examen' },
  fehler: { id: 'fehler', label: 'Fehlerheft', path: '/lernen/fehler', icon: 'alert' },
  gespraech: { id: 'gespraech', label: 'Gesprächssimulator', path: '/lernen/gespraech', icon: 'chat' },
  klasse: { id: 'klasse', label: 'Klassenmodus', path: '/lernen/klasse', icon: 'klasse' },
} satisfies Record<string, NavItem>;

export const UEBUNGS_BUENDEL: NavItem[] = [
  { id: 'fachwissen', label: 'Fachwissen', icon: 'book', children: [UEB.wissen, UEB.krankheitsbilder] },
  { id: 'praxis-gruppe', label: 'Praxis', icon: 'user', children: [UEB.praxis, UEB.fertigkeiten, UEB.dokumentation, UEB.diagnostik] },
  // Gesprächssimulator: Gesprächsführung ist Teil der praktischen und mündlichen Prüfung.
  { id: 'pruefung-gruppe', label: 'Prüfung', icon: 'timer', children: [UEB.simulation, UEB.examen, UEB.fehler, UEB.gespraech, UEB.klasse] },
];

/** Ansichten der Themenseite: eigene Seiten, im Menü aber nur ein Eintrag „Themen“ (Umschalter oben auf jeder Ansicht). */
export const THEMEN_ANSICHTEN: NavItem[] = [
  { id: 'themen', label: 'Themen', path: '/lernen/themen', icon: 'table' },
  { id: 'ce', label: 'Curriculare Einheiten', path: '/lernen/ce', icon: 'layers' },
  { id: 'landkarte', label: 'Themen-Landkarte', path: '/lernen/landkarte', icon: 'map' },
  { id: 'board', label: 'Mein Themenboard', path: '/lernen/board', icon: 'board' },
  { id: 'faecher', label: 'Fächer', path: '/lernen/faecher', icon: 'layers' },
  { id: 'mindmap', label: 'Mindmaps', path: '/lernen/mindmap', icon: 'mindmap' },
];
const THEMEN_PFADE = THEMEN_ANSICHTEN.map((a) => a.path!);

/**
 * Grundmenü für Einsteiger (Audit U-1): sieben Bereiche, alles Weitere unter „Mehr“.
 * Entwicklerseiten (Bildprüfung, Inhaltsqualität) nur mit Schalter in den Einstellungen (Rolle „admin“).
 */
export const NAV: NavItem[] = [
  { id: 'heute', label: 'Heute', path: '/', icon: 'home' },
  { id: 'plan', label: 'Lernplan', path: '/lernen/plan', icon: 'calendar' },
  {
    id: 'lernen', label: 'Lernen', icon: 'book', bereich: 'lernen', zu: true, children: [
      { ...THEMEN_ANSICHTEN[0]!, auch: THEMEN_PFADE.slice(1) },
      { id: 'skript', label: 'Skript', path: '/lernen/skript', icon: 'book' },
      { id: 'karten', label: 'Karteikarten', path: '/lernen/karten', icon: 'cards' },
      { id: 'dnqp', label: 'Expertenstandards (DNQP)', path: '/lernen/dnqp', icon: 'star' },
    ],
  },
  {
    id: 'ueben', label: 'Üben', icon: 'clipboard', bereich: 'ueben', zu: true, children: [
      { id: 'ueben-alle', label: 'Alle Übungen', path: '/lernen/ueben', icon: 'clipboard' },
      UEB.wissen, UEB.krankheitsbilder, UEB.fertigkeiten, UEB.dokumentation,
    ],
  },
  {
    id: 'praxis-bereich', label: 'Praxis', icon: 'user', bereich: 'ueben', zu: true, children: [
      UEB.praxis, UEB.diagnostik, UEB.gespraech,
      { id: 'einsatz', label: 'Praxiseinsatz', path: '/lernen/einsatz', icon: 'user' },
    ],
  },
  {
    id: 'pruefung', label: 'Prüfung', icon: 'timer', bereich: 'ueben', zu: true, children: [UEB.simulation, UEB.examen, UEB.fehler],
  },
  {
    id: 'material', label: 'Material', icon: 'folder', bereich: 'material', zu: true, children: [
      { id: 'dokumente', label: 'Dokumente', path: '/material/dokumente', icon: 'folder' },
      { id: 'import', label: 'Import-Assistent', path: '/material/import', icon: 'upload' },
      { id: 'ablage', label: 'Große Dateien', path: '/material/ablage', icon: 'upload' },
      { id: 'zusammenfassen', label: 'Zusammenfassen', path: '/material/zusammenfassen', icon: 'sparkle' },
    ],
  },
  {
    id: 'mehr', label: 'Mehr', icon: 'menu', zu: true, children: [
      { id: 'wegweiser', label: 'So lernst du hier', path: '/lernen/wegweiser', icon: 'sparkle' },
      { id: 'fortschritt', label: 'Fortschritt', path: '/lernen/fortschritt', icon: 'gauge' },
      { id: 'schnellsuche', label: 'Standard-Schnellsucher', path: '/lernen/schnellsuche', icon: 'search' },
      { id: 'physiologie', label: 'Physiologie-Modelle', path: '/lernen/physiologie', icon: 'pulse' },
      UEB.klasse,
      {
        // Lehrermodus: für Lehrkräfte und Praxisanleitung (Klassen, Fälle verteilen, bewerten).
        id: 'lehren', label: 'Lehren', icon: 'klasse', zu: true, children: [
          { id: 'lehrer', label: 'Lehrermodus', path: '/lehren', icon: 'klasse' },
          { id: 'lehrer-klassen', label: 'Klassen', path: '/lehren/klassen', icon: 'user' },
          { id: 'lehrer-aufgaben', label: 'Fälle und Aufgaben', path: '/lehren/aufgaben', icon: 'clipboard' },
          { id: 'lehrer-abgaben', label: 'Abgaben', path: '/lehren/abgaben', icon: 'upload' },
          { id: 'lehrer-radar', label: 'Klassen-Radar', path: '/lehren/radar', icon: 'gauge' },
        ],
      },
      {
        id: 'system', label: 'System', icon: 'settings', zu: true, children: [
          { id: 'einstellungen', label: 'Einstellungen', path: '/einstellungen', icon: 'settings' },
          { id: 'sicherung', label: 'Datensicherung', path: '/system/sicherung', icon: 'save' },
          { id: 'quellen', label: 'Quellen und Aktualität', path: '/system/quellen', icon: 'book' },
          { id: 'testphase', label: 'Testphase und Rückmeldung', path: '/system/test', icon: 'chat' },
          { id: 'bilder', label: 'Bildprüfung', path: '/system/bilder', icon: 'check', roles: ['admin'] },
          { id: 'qualitaet', label: 'Inhaltsqualität', path: '/system/qualitaet', icon: 'check', roles: ['admin'] },
        ],
      },
    ],
  },
];

/** Seiten ohne eigenen Menüeintrag (erreichbar über Links), für Seitentitel und Gerätetest. */
export const UNTERSEITEN: NavItem[] = [
  { id: 'thema', label: 'Thema', path: '/lernen/thema', icon: 'book' },
  ...THEMEN_ANSICHTEN.slice(1),
  { id: 'design', label: 'Designsystem', path: '/system/design', icon: 'palette', roles: ['admin'] },
  // Spielmodus des Wissenstrainers, erreichbar von dort
  { id: 'duell', label: 'Fachbegriff-Duell', path: '/lernen/duell', icon: 'duell' },
];

/** Ist ein Menüpunkt für diese Seite aktiv (eigener Pfad, Unterpfad oder eine seiner weiteren Seiten)? */
export function istAktiv(item: NavItem, path: string): boolean {
  const passt = (p: string) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/'));
  return (!!item.path && passt(item.path)) || (item.auch ?? []).some(passt);
}

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
  _ueben ??= new Set(['/lernen/ueben', ...flatNav(UEBUNGS_BUENDEL).map((i) => i.path!)]);
  return _ueben;
}

/** Menü-ID einer Übungsseite (unter „Üben“, ohne die Übersicht), sonst undefined. Für die Leiste „Passt dazu“. */
export function uebungsId(path: string): string | undefined {
  if (!uebenPfade().has(path) || path === '/lernen/ueben') return undefined;
  return flatNav(UEBUNGS_BUENDEL).find((i) => i.path === path)?.id;
}

/** Lern- und Materialseiten außerhalb von „Üben“, die „Passt dazu“ ebenfalls bekommen (feste Ziele). */
export const LERNSEITEN = new Set(['karten', 'skript', 'dnqp', 'schnellsuche', 'ce', 'themen', 'landkarte', 'board', 'fortschritt', 'dokumente', 'zusammenfassen', 'physiologie', 'einsatz']);

/** Menü-ID, für die „Passt dazu“ erscheint: jede Übung und die Lern- und Materialseiten aus LERNSEITEN. */
export function passtDazuId(path: string): string | undefined {
  const u = uebungsId(path);
  if (u) return u;
  const n = [...flatNav(NAV), ...UNTERSEITEN].find((i) => i.path === path);
  return n && LERNSEITEN.has(n.id) ? n.id : undefined;
}

/** Die drei Bündel unter „Üben“ (für die Übersichtsseite). */
export function uebenGruppen(): NavItem[] {
  return UEBUNGS_BUENDEL;
}

export function visibleNav(items: NavItem[], roles: Role[]): NavItem[] {
  return items
    .filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)))
    .map((i) => (i.children ? { ...i, children: visibleNav(i.children, roles) } : i))
    .filter((i) => i.path || i.children?.length);
}

/** Alle Seiten, die jemand mit diesen Rollen öffnen kann: Menü und Unterseiten (ohne die Themenseite, die eine ID braucht). Für Suche und Favoriten. */
export function sichtbareSeiten(roles: Role[]): NavItem[] {
  return [...flatNav(visibleNav(NAV, roles)), ...visibleNav(UNTERSEITEN, roles).filter((i) => i.id !== 'thema')];
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
  if (path === '/lernen/plan' || THEMEN_PFADE.includes(path)) return 'lernen';
  if ([...uebenPfade()].some((p) => path === p || path.startsWith(p + '/'))) return 'ueben';
  const gruppe = NAV.find((g) => flatNav(g.children ?? []).some((i) => i.path === path || path.startsWith(i.path + '/')));
  if (gruppe?.bereich) return gruppe.bereich;
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
  if (THEMEN_PFADE.includes(path) && path !== THEMEN_PFADE[0]) return 'Lernen · Themen';
  // „Mehr“ ist nur eine Schublade: die Marke nennt die Gruppe darin („System“) oder den Bereich.
  const spur = (suche(NAV, []) ?? []).filter((x) => x !== 'Mehr');
  return spur.join(' · ') || BEREICH_NAME[bereichVon(path)];
}

/** Alte Pfade (vor dem Designsystem) weiterleiten. */
export const REDIRECTS: Record<string, string> = {
  '/dokumente': '/material/dokumente',
  '/zusammenfassen': '/material/zusammenfassen',
  '/faecher': '/lernen/faecher',
  '/lernplan': '/lernen/plan',
  '/sicherung': '/system/sicherung',
};
