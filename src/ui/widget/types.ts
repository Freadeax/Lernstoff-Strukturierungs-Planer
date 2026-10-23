// Komponenten-Vertrag für alle Oberflächen-Module (Widgets).
// Jedes Widget trennt drei Schichten: Datenbeschaffung (Loader), Zustand (WidgetState)
// und Darstellung (View). Die View bekommt nur den Zustand und rendert alle sechs UI-Zustände.

import type { ReactNode } from 'react';

/**
 * Die fünf Datenzustände. Der sechste Zustand „interaktiv“ (Hover, Fokus, Aktiv, Ziehen,
 * Ablegen) ist kein Datenzustand, sondern gilt zusätzlich in jedem Zustand mit Inhalt;
 * er wird über CSS-Klassen und ARIA-Attribute umgesetzt (siehe widget.css).
 */
export type WidgetStatus = 'loading' | 'ideal' | 'partial' | 'empty' | 'error';

export type WidgetState<T> =
  | { status: 'loading' }
  | { status: 'ideal'; data: T }
  | { status: 'partial'; data: T; reason?: string }
  | { status: 'empty' }
  | { status: 'error'; error: Error };

/** Synchronisationsstatus im Kopf. 'live' = Daten folgen der lokalen Datenbank. */
export type SyncBadge = 'live' | 'syncing' | 'stalled' | 'offline' | 'demo';

export interface FilterPill<K extends string = string> { key: K; label: string; count?: number }

export interface MenuAction { id: string; label: string; onSelect: () => void; danger?: boolean }

/** Kopfzone: Titel, Status, lokale Filter, Kontextmenü. */
export interface HeaderZone<K extends string = string> {
  title: string;
  subtitle?: string;
  badge?: SyncBadge;
  filters?: FilterPill<K>[];
  activeFilter?: K;
  onFilterChange?: (key: K) => void;
  /** Zeilen für „Als CSV/JSON exportieren“. Fehlt die Funktion, entfällt der Export. */
  exportRows?: () => Array<Record<string, unknown>>;
  allowMaximize?: boolean;
  onHide?: () => void;
  extraActions?: MenuAction[];
}

export interface Pagination {
  page: number;          // 1-basiert
  pageSize: number;      // 0 = alle
  total: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/** Fußzone: Seitenwahl, letzter Abgleich, sekundäre Aktionen. */
export interface FooterZone {
  pagination?: Pagination;
  lastSynced?: Date;
  secondary?: ReactNode;
}

/** Leerzustand: Illustration, Erklärung und genau ein primärer Aufruf. */
export interface EmptySpec {
  illustration?: 'dokumente' | 'themen' | 'aktivitaet' | 'board' | 'diagramm' | 'allgemein';
  title: string;
  message: string;
  cta: { label: string; onClick?: () => void; href?: string };
}

/** Lebenszyklus-Hooks, z. B. für Messung oder spätere Fernsteuerung. */
export interface WidgetLifecycle {
  onMount?: (id: string) => void;
  onUpdate?: (id: string, status: WidgetStatus) => void;
  onDestroy?: (id: string) => void;
  onError?: (id: string, error: Error) => void;
}

/** Körperzone: feste Mindest- und Höchsthöhe, darin scrollt der Inhalt. */
export interface BodyZone {
  minHeight?: string;   // CSS-Wert, Standard var(--widget-body-min)
  maxHeight?: string;   // Standard var(--widget-body-max); 'none' für Assistenten
}

export interface WidgetFrameProps<T, K extends string = string> {
  id: string;
  header: HeaderZone<K>;
  state: WidgetState<T>;
  /** Skelett mit exakt der Geometrie des Idealzustands (kein Layout-Sprung). */
  skeleton: ReactNode;
  empty: EmptySpec;
  onRetry: () => void;
  body?: BodyZone;
  footer?: FooterZone;
  lifecycle?: WidgetLifecycle;
  /** Rendert den Inhalt für 'ideal' und 'partial'. */
  children: (data: T, partial: { partial: boolean; reason?: string }) => ReactNode;
}

/** Eintrag im Widget-Katalog: wird erst geladen, wenn er in den sichtbaren Bereich kommt. */
export interface WidgetDefinition {
  id: string;
  title: string;
  /** Spalten im 12er-Raster ab Containerbreite 768 / 1024 / 1440 px (darunter immer 12). */
  span: { md?: number; lg?: number; xl?: number };
  /** Höhe des Platzhalters bis zum Laden, damit nichts springt. */
  placeholderHeight: string;
  load: () => Promise<{ default: React.ComponentType<WidgetHostProps> }>;
}

/** Was der Dashboard-Host jedem Widget mitgibt. */
export interface WidgetHostProps {
  id: string;
  onHide?: () => void;
  lifecycle?: WidgetLifecycle;
}
