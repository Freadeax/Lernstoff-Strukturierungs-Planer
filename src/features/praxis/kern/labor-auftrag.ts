// G8 Labor im Fall: Die venöse Blutentnahme friert die Modellwerte zum Abnahmezeitpunkt ein; die Ergebnisse liegen
// erst nach Transport (Notfall: sofort, 15 min) und Laufzeit des Labors vor (Laufzeiten, Referenzen und Bewertung aus
// src/ui/sim/labor, wie auf der Diagnostik-Seite). Rein und deterministisch (Zeit nur aus z.t).

import { bewerte, istKritisch, parameter, referenz, type Altersgruppe as LaborGruppe } from '../../../ui/sim/labor/parameter';
import { TRANSPORT } from '../../../ui/sim/labor/modell';
import { monitorGruppe } from './physiologie/altersprofile';
import type { SimZustand } from './kern';
import type { Akte, Anzeige } from './typen';

/** Maßnahmen, die eine Blutprobe ins Labor schicken */
export const LABOR_ABNAHME: ReadonlySet<string> = new Set(['blutentnahme-venoes']);

/** Anzeigefeld → Laborparameter (Diagnostik-Seite) */
export const LABOR_FELDER = {
  hb: 'hb', leuko: 'leuko', thrombo: 'thrombo', crp: 'crp', pct: 'pct', natrium: 'na', kalium: 'k', krea: 'krea',
  egfr: 'egfr', harnstoff: 'harnstoff', inr: 'inr', aptt: 'aptt', bz: 'glukose',
} as const satisfies Partial<Record<keyof Anzeige, string>>;

export type LaborFeld = keyof typeof LABOR_FELDER;
export interface LaborProbe { t: number; werte: Partial<Record<LaborFeld, number>> }

/** Momentaufnahme der Laborwerte bei der Abnahme */
export function laborProbe(t: number, a: Anzeige): LaborProbe {
  const werte: LaborProbe['werte'] = {};
  for (const f of Object.keys(LABOR_FELDER) as LaborFeld[]) { const w = a[f]; if (typeof w === 'number') werte[f] = w; }
  return { t, werte };
}

/** Sekunden von der Abnahme bis zum Ergebnis eines Parameters (Notfall, Sofort-Transport) */
export function laborDauerSek(parameterId: string): number {
  const p = parameter(parameterId);
  return ((p.ort === 'poct' ? 0 : TRANSPORT.sofort) + p.laufzeit.notfall) * 60;
}

type LaborZeile = NonNullable<Akte['labor']>[number];

const zahl = (w: number, n: number) => w.toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n });

function norm(id: string, g: LaborGruppe): string | undefined {
  const r = referenz(parameter(id), 'w', g);
  if (r.min !== undefined && r.max !== undefined) return `${zahl(r.min, parameter(id).nachkomma)}–${zahl(r.max, parameter(id).nachkomma)}`;
  if (r.max !== undefined) return `< ${zahl(r.max, parameter(id).nachkomma)}`;
  if (r.min !== undefined) return `> ${zahl(r.min, parameter(id).nachkomma)}`;
  return undefined;
}

/**
 * Fertige Laborbefunde im Format der Akte (neueste zuerst) und ausstehende Proben.
 * `uhr` macht aus Spielzeit eine Uhrzeit (Akte/Doku). Geschlecht „d“ wird nach dem Bereich für Frauen bewertet.
 */
export function laborBefunde(z: SimZustand, uhr: (t: number) => string): { zeilen: LaborZeile[]; ausstehend: Array<{ abnahme: string; fertig: string }>; kritisch: boolean } {
  const g = monitorGruppe(z.fall.altersgruppe);
  const geschlecht = z.fall.person.geschlecht === 'm' ? 'm' : 'w';
  const zeilen: LaborZeile[] = [];
  const ausstehend: Array<{ abnahme: string; fertig: string }> = [];
  let kritisch = false;
  for (const probe of [...(z.laborProben ?? [])].reverse()) {
    let offen = 0;
    for (const f of Object.keys(LABOR_FELDER) as LaborFeld[]) {
      const id = LABOR_FELDER[f];
      const w = probe.werte[f];
      if (w === undefined) continue;
      const fertig = probe.t + laborDauerSek(id);
      if (z.t < fertig) { offen = Math.max(offen, fertig); continue; }
      const p = parameter(id);
      const flag = bewerte(p, w, geschlecht, g);
      if (istKritisch(flag)) kritisch = true;
      zeilen.push({
        name: p.name, wert: zahl(w, p.nachkomma), einheit: p.einheit || undefined, norm: norm(id, g),
        datum: `heute ${uhr(probe.t)}`, auffaellig: flag !== 'normal' && flag !== 'unbewertet',
      });
    }
    if (offen) ausstehend.push({ abnahme: uhr(probe.t), fertig: uhr(offen) });
  }
  return { zeilen, ausstehend, kritisch };
}
