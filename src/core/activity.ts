// Aktivitätsprotokoll: Grundlage für Aktivitäts-Feed, Diagramme und Mitteilungen.
// Liegt lokal in IndexedDB (Tabelle `activity`) und wird mit exportiert.

import { db } from './db';

export type Severity = 'info' | 'warning' | 'critical';
export type ActivityKind = 'import' | 'zusammenfassung' | 'lernstand' | 'dokument' | 'uebung' | 'lernplan' | 'system';

export interface ActivityEntry {
  id?: number;
  at: string;            // ISO-Zeitpunkt
  kind: ActivityKind;
  severity: Severity;
  title: string;
  detail?: string;
  subjectIds?: string[];
  ref?: string;          // z. B. Dokument- oder Themen-ID
}

export const KIND_LABEL: Record<ActivityKind, string> = {
  import: 'Import', zusammenfassung: 'Zusammenfassung', lernstand: 'Lernstand', dokument: 'Dokument', uebung: 'Übung', lernplan: 'Lernplan', system: 'System',
};
export const SEVERITY_LABEL: Record<Severity, string> = { info: 'Info', warning: 'Warnung', critical: 'Kritisch' };

export async function logActivity(entry: Omit<ActivityEntry, 'id' | 'at'> & { at?: string }) {
  try {
    await db.activity.add({ at: new Date().toISOString(), ...entry });
  } catch { /* Protokoll darf nie die eigentliche Aktion verhindern */ }
}
