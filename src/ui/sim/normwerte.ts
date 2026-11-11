// Fassade des gemeinsamen Normwert-Vertrags: ein Zugriff für Vitalwerte (vitalnormen.ts) und Laborwerte
// (labor/parameter.ts). Normwerte-Trainer, Labor-Tafel, Diagnostik-Kurven und Monitor lesen dieselben Zahlen.

import { hatProfil, parameter, PARAMETER_NACH_ID, referenz, type Altersgruppe, type Geschlecht } from './labor/parameter';
import { VITALWERTE, vitalNormal, vitalText, type NormBereich, type VitalId } from './vitalnormen';

export { VITALWERTE, VITAL_SCHWELLEN, vitalNormal, vitalText } from './vitalnormen';

export interface Normwert { id: string; art: 'vital' | 'labor'; name: string; einheit: string; bereich?: NormBereich }

/** Normalbereich eines Vital- oder Laborwerts für Altersgruppe und Geschlecht; ohne Profil ohne Bereich. */
export function normwert(id: string, opt: { gruppe?: Altersgruppe; geschlecht?: Geschlecht } = {}): Normwert {
  const gruppe = opt.gruppe ?? 'erwachsen';
  if (id in VITALWERTE) {
    const v = VITALWERTE[id as VitalId];
    return { id, art: 'vital', name: v.name, einheit: v.einheit, bereich: vitalNormal(id as VitalId, gruppe) };
  }
  if (!PARAMETER_NACH_ID[id]) throw new Error(`Unbekannter Normwert: ${id}`);
  const p = parameter(id);
  return { id, art: 'labor', name: p.name, einheit: p.einheit, bereich: hatProfil(p, gruppe) ? referenz(p, opt.geschlecht ?? 'w', gruppe) : undefined };
}

const zahl = (n: number, k: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: k, maximumFractionDigits: k }).format(n);

/**
 * Bereich als Text, z. B. „3,5 bis 5,0 mmol/l“. Mit `faktor`/`einheit` umrechnen, z. B. Leukozyten von G/l
 * auf pro µl (faktor 1000, nachkomma 0).
 */
export function normText(id: string, opt: { gruppe?: Altersgruppe; geschlecht?: Geschlecht; faktor?: number; einheit?: string; nachkomma?: number } = {}): string {
  if (id in VITALWERTE) return vitalText(id as VitalId, opt.gruppe);
  const n = normwert(id, opt), p = parameter(id), b = n.bereich;
  if (!b) return 'kein Profil';
  const f = opt.faktor ?? 1, k = opt.nachkomma ?? p.nachkomma, e = opt.einheit ?? n.einheit;
  if (b.min !== undefined && b.max !== undefined) return `${zahl(b.min * f, k)} bis ${zahl(b.max * f, k)} ${e}`.trim();
  if (b.max !== undefined) return `unter ${zahl(b.max * f, k)} ${e}`.trim();
  return `über ${zahl(b.min! * f, k)} ${e}`.trim();
}
