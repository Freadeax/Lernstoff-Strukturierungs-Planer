import type { BlockKind, PlanBlock } from '../scheduler';
import type { MasteryStatus } from '../types';

const tag = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const lang = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
/** „Mo., 26.10.“ */
export const kurzDatum = (iso: string) => tag.format(asDate(iso));
/** „Montag, 26. Oktober 2026“ */
export const langDatum = (iso: string) => lang.format(asDate(iso));

export function dauer(min: number): string {
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

export function inTagen(n: number): string {
  if (n === 0) return 'heute';
  if (n === 1) return 'morgen';
  if (n < 0) return n === -1 ? 'gestern' : `vor ${-n} Tagen`;
  return `in ${n} Tagen`;
}

export const KIND_LABEL: Record<BlockKind, string> = {
  erarbeiten: 'Erarbeiten',
  wiederholen: 'Wiederholen',
  pruefungsvorbereitung: 'Letzte Abfrage',
};

export function blockTitel(b: PlanBlock): string {
  if (b.kind === 'erarbeiten') return b.parts && b.parts > 1 ? `Erarbeiten, Teil ${b.part} von ${b.parts}` : 'Erarbeiten';
  if (b.kind === 'pruefungsvorbereitung') return 'Letzte Abfrage vor der Prüfung';
  return b.label.startsWith('Erste') ? 'Erste Abfrage' : 'Wiederholung';
}

export const STATUS_LABEL: Record<MasteryStatus, string> = {
  offen: 'Offen', bearbeitet: 'Bearbeitet', unsicher: 'Unsicher', sicher: 'Sicher',
};

export const bloecke = (n: number) => (n === 1 ? '1 Block' : `${n} Blöcke`);
