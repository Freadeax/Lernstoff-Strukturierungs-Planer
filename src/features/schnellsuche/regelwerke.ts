// Weitere Standards und Regelwerke neben den DNQP-Expertenstandards. Inhalte kommen aus den vorhandenen
// Trainern (Hygiene, Notfall, Recht, Arzneimittel) und den Normen im Katalog; hier steht nur die Zuordnung.

import type { CatalogModule } from '../../modules/catalog-types';
import type { StandardInfo } from './quellen';
import type { SuchDok } from './suchkern';

export interface Regelwerk extends StandardInfo { pfad: string }

export const REGELWERKE: Regelwerk[] = [
  { id: 'rw.hygiene', kurz: 'Hygiene (KRINKO)', name: 'Hygiene und Infektionsprävention', details: 'KRINKO-Empfehlungen, 5 Indikationen der Händehygiene, TRBA 250', pfad: '/lernen/hygiene', ungeprueft: false, gruppe: 'regelwerk' },
  { id: 'rw.notfall', kurz: 'Notfall und Reanimation (ERC)', name: 'Notfall, Reanimation und ABCDE', details: 'Leitlinien des European Resuscitation Council 2021', pfad: '/lernen/notfall', ungeprueft: false, gruppe: 'regelwerk' },
  { id: 'rw.arzneimittel', kurz: 'Arzneimittelsicherheit', name: 'Sicherer Umgang mit Arzneimitteln', details: '6-R-Regel, Applikation, Betäubungsmittel', pfad: '/lernen/arzneimittel', ungeprueft: false, gruppe: 'regelwerk' },
  { id: 'rw.recht', kurz: 'Recht in der Pflege', name: 'Gesetze und Normen für die Pflege', details: 'StGB, BGB, PflBG, SGB V und XI, IfSG, Arbeitsschutz', pfad: '/lernen/recht', ungeprueft: false, gruppe: 'regelwerk' },
];

/** Normen aus dem Katalog (Gesetze, Verordnungen) als Einträge des Regelwerks Recht. */
export function ausNormen(modul: CatalogModule): SuchDok[] {
  return (modul.references ?? []).filter((r) => r.kind === 'norm').map((r) => ({
    id: `norm:${r.id}`, art: 'standard' as const, titel: r.name, standardIds: [r.id === 'norm.ifsg' ? 'rw.hygiene' : 'rw.recht'],
    pfad: 'Gesetz oder Verordnung', text: r.details ?? '', link: r.id === 'norm.ifsg' ? '/lernen/hygiene' : '/lernen/recht',
    details: [
      ...(r.details ? [{ label: 'Hinweis', text: r.details }] : []),
      ...(r.pruefstatus === 'ungeprueft' ? [{ label: 'Prüfstand', text: 'Fassung und Paragrafen noch nicht gegen den Gesetzestext geprüft.' }] : []),
    ],
  }));
}
