// Examens-Hinweis für die Übersicht: nächster Prüfungstermin und genau ein nächster Schritt.
// Rein und klein, damit die Übersicht nichts vom Lernplan nachladen muss. Ohne Termine kein Hinweis.

import { daysBetween, type ISODate } from '../lernplan/dates';
import { planePraktisch, tageBis } from './praktisch';
import type { MuendlichEintrag, Termine } from './speicher';

export type TerminArt = 'schriftlich' | 'praktisch' | 'muendlich';
export const TERMIN_NAME: Record<TerminArt, string> = { schriftlich: 'Schriftlich', praktisch: 'Praktisch', muendlich: 'Mündlich' };

export interface Schritt { text: string; path: string; label: string; dringend: boolean }

export interface ExamensHinweis {
  /** Kommende Termine, nächster zuerst. */
  termine: Array<{ art: TerminArt; tage: number }>;
  schritt?: Schritt;
}

/** Ab so vielen Tagen vor der mündlichen Prüfung erinnert die Übersicht ans laute Üben. */
export const MUENDLICH_VORLAUF = 42;
/** So viele Tage ohne mündliche Übung gelten in dieser Zeit als zu lang. */
export const MUENDLICH_PAUSE = 7;

const datum = (iso: ISODate) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });

export function examensHinweis(termine: Termine, heute: ISODate, erledigt: Set<string>, verlauf: MuendlichEintrag[]): ExamensHinweis | null {
  const kommend = (['schriftlich', 'praktisch', 'muendlich'] as const)
    .map((art) => ({ art, tage: tageBis(termine[art], heute) }))
    .filter((t): t is { art: TerminArt; tage: number } => t.tage !== null && t.tage >= 0)
    .sort((a, b) => a.tage - b.tage);
  if (!kommend.length) return null;

  // 1. Überfällige oder aktuelle Etappe der praktischen Prüfung
  let schritt: Schritt | undefined;
  const praktisch = kommend.find((t) => t.art === 'praktisch');
  if (praktisch) {
    const plan = planePraktisch(termine.praktisch, heute, erledigt);
    const offen = plan.find((e) => e.status === 'ueberfaellig') ?? plan.find((e) => e.status === 'jetzt');
    if (offen) {
      const ueber = offen.status === 'ueberfaellig';
      schritt = {
        text: `Praktische Prüfung: „${offen.titel}“ ${ueber ? `war bis ${datum(offen.faelligAm)} geplant` : `bis ${datum(offen.faelligAm)}`} (${offen.erledigt}/${offen.schritte.length} erledigt).`,
        path: '/lernen/examen?ansicht=praktisch', label: 'Etappe ansehen', dringend: ueber,
      };
    }
  }

  // 2. Mündliche Prüfung naht und es wurde länger nicht laut geübt
  const muendlich = kommend.find((t) => t.art === 'muendlich');
  if (!schritt && muendlich && muendlich.tage <= MUENDLICH_VORLAUF) {
    const letzte = verlauf.map((v) => v.at.slice(0, 10)).sort().at(-1);
    const her = letzte ? daysBetween(letzte, heute) : null;
    if (her === null || her >= MUENDLICH_PAUSE) {
      schritt = {
        text: her === null ? 'Mündliche Prüfung: noch keine Übung laut gesprochen.' : `Mündliche Prüfung: zuletzt vor ${her} Tagen laut geübt.`,
        path: '/lernen/examen?ansicht=muendlich', label: 'Jetzt laut üben', dringend: muendlich.tage <= 14,
      };
    }
  }

  return { termine: kommend, schritt };
}

export function inTagen(tage: number): string {
  if (tage === 0) return 'heute';
  if (tage === 1) return 'morgen';
  return `in ${tage} Tagen`;
}
