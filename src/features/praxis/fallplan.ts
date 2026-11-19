// Fallplan nach CE (Runde 3, P15): welcher Praxisfall zu welcher curricularen Einheit und welchem Ausbildungsdrittel gehört.
// Quelle: Projektordner praxissimulator-neu/FALLPLAN-CE.md, Abschnitt 4. Rein und ohne den Kern, damit die CE-Seite
// den Plan lesen kann, ohne die Fälle zu laden. Neue Kernfälle tragen ihre Einordnung selbst (`fall.lehrplan`);
// hier steht nur, welcher Altfall bzw. welcher geplante Fall damit erledigt ist (Feld `fall`).
//
// Pflege: Ist ein Fall auf dem neuen Kern fertig, beim passenden Eintrag `fall: '<id>'` setzen. Der Test
// `fallplan.test.ts` prüft, dass jeder Kernfall hier vorkommt und die Abdeckungslücken (ABDECKUNG_OFFEN) stimmen.

import type { Abschnitt } from '../ce/lehrplan';

export type PlanArt = 'vorhanden' | 'migrieren' | 'neu';

export interface PlanEintrag {
  ce: string;
  /** Arbeitstitel im Fallplan. */
  titel: string;
  art: PlanArt;
  abschnitt: Abschnitt[];
  /** Paket der Fallwelle (P16–P19), leer bei vorhandenen Fällen. */
  paket?: 'P16' | 'P17' | 'P18' | 'P19';
  /** Altfall im alten Simulator (scenarios.json), der durch diesen Eintrag abgelöst wird. */
  alt?: string[];
  /** Fall auf dem neuen Kern (FAELLE_V2), sobald es ihn gibt. */
  fall?: string;
}

export const FALLPLAN: readonly PlanEintrag[] = [
  { ce: 'ce.01', titel: 'Erster Tag: Händehygiene, erste Begegnung, Vitalzeichen, Schweigepflicht', art: 'neu', abschnitt: ['ad12'], paket: 'P17', fall: 'kh-erster-tag' },

  { ce: 'ce.02', titel: 'Sturz und Exsikkose im Hausbesuch', art: 'vorhanden', abschnitt: ['ad12'], fall: 'amb-sturz-exsikkose' },
  { ce: 'ce.02', titel: 'Erster Weg zum Bad nach Hüft-TEP', art: 'migrieren', abschnitt: ['ad12'], paket: 'P17', alt: ['reha'], fall: 'kh-reha-erster-weg' },
  { ce: 'ce.02', titel: 'Dekubitusgefahr bei Immobilität', art: 'neu', abschnitt: ['ad12'], paket: 'P17' },
  { ce: 'ce.02', titel: 'Harnverhalt nach der OP, Inkontinenz', art: 'neu', abschnitt: ['ad12'], paket: 'P17' },

  { ce: 'ce.03', titel: 'Bewohner lehnt die Körperpflege ab', art: 'neu', abschnitt: ['ad12'], paket: 'P17', fall: 'lz-koerperpflege-abgelehnt' },

  { ce: 'ce.04', titel: 'Herzschwäche: Gewicht, Ödeme, Schulung', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P17', alt: ['herzschwaeche'] },
  { ce: 'ce.04', titel: 'Diabetes: Unterzuckerung und Insulinschulung', art: 'neu', abschnitt: ['ad12', 'ad3'], paket: 'P17' },

  { ce: 'ce.05', titel: 'Pneumonie mit beginnender Sepsis', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'kh-pneumonie-sepsis', alt: ['sepsis', 'nachtwache'] },
  { ce: 'ce.05', titel: 'Nachblutung nach der OP', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P16', alt: ['nachblutung'] },
  { ce: 'ce.05', titel: 'Aufwachraum: Atemdepression nach Opioid', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P16', alt: ['aufwachraum'] },
  { ce: 'ce.05', titel: 'Anaphylaxie bei der ersten Infusion', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P16', alt: ['anaphylaxie'] },
  { ce: 'ce.05', titel: 'Lungenembolie bei der Mobilisation', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P16', alt: ['lungenembolie'] },
  { ce: 'ce.05', titel: 'Medikationsfehler und Verwechslung', art: 'neu', abschnitt: ['ad12', 'ad3'], paket: 'P16' },

  { ce: 'ce.06', titel: 'Septischer Schock im Schockraum', art: 'vorhanden', abschnitt: ['ad3'], fall: 'sr-septischer-schock' },
  { ce: 'ce.06', titel: 'Brustschmerz in der Notaufnahme', art: 'migrieren', abschnitt: ['ad3'], paket: 'P16', alt: ['zna'] },
  { ce: 'ce.06', titel: 'Akuter Schlaganfall im Heim', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P16', alt: ['schlaganfall'] },
  { ce: 'ce.06', titel: 'Alarm während der Übergabe auf der Intensivstation', art: 'migrieren', abschnitt: ['ad3'], paket: 'P16', alt: ['its'] },
  { ce: 'ce.06', titel: 'Reanimation (BLS) im Zimmer', art: 'neu', abschnitt: ['ad12', 'ad3'], paket: 'P16' },

  { ce: 'ce.07', titel: 'Schlaganfall in der Reha: Schlucken, Lagerung, Angehörige anleiten', art: 'neu', abschnitt: ['ad12', 'ad3'], paket: 'P17' },

  { ce: 'ce.08', titel: 'Zeit für ein schwieriges Gespräch', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P18', alt: ['palliativ'] },
  { ce: 'ce.08', titel: 'Sterbephase: Atemnot, Unruhe, Angehörige', art: 'neu', abschnitt: ['ad12', 'ad3'], paket: 'P18' },

  { ce: 'ce.09', titel: 'Demenz und Schmerz im Pflegeheim', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'lz-demenz-schmerz' },
  { ce: 'ce.09', titel: 'Frau Kühn isst seit gestern nichts', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P18', alt: ['demenz'] },
  { ce: 'ce.09', titel: 'Unruhe vor dem Mittagessen', art: 'migrieren', abschnitt: ['ad12'], paket: 'P18', alt: ['pflegeheim'] },
  { ce: 'ce.09', titel: 'Die Wohnung ist heute ungewohnt still', art: 'migrieren', abschnitt: ['ad12', 'ad3'], paket: 'P18', alt: ['hausbesuch'] },

  { ce: 'ce.10', titel: 'Fieberkrampf beim Kleinkind', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'paed-fieberkrampf' },
  { ce: 'ce.10', titel: 'Asthmaanfall beim Schulkind', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'paed-asthma-schulkind', alt: ['asthma'] },
  { ce: 'ce.10', titel: 'Bronchiolitis beim Säugling', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'paed-bronchiolitis-saeugling', alt: ['bronchiolitis'] },
  { ce: 'ce.10', titel: 'Gastroenteritis und Exsikkose beim Kind', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'paed-gastroenteritis-kleinkind', alt: ['kind'] },
  { ce: 'ce.10', titel: 'Jugendliche nach der Party nicht wach', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'paed-rausch-jugendliche', alt: ['rausch'] },

  { ce: 'ce.11', titel: 'Panik und Suizidalität', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'psy-panik-suizidalitaet' },
  { ce: 'ce.11', titel: 'Delir in der Nacht', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'kh-delir-nacht', alt: ['delir'] },
  { ce: 'ce.11', titel: 'Unruhe im Aufenthaltsraum, Deeskalation', art: 'vorhanden', abschnitt: ['ad12', 'ad3'], fall: 'psy-unruhe-deeskalation', alt: ['psychiatrie'] },
  { ce: 'ce.11', titel: 'Alkoholentzug auf Station', art: 'vorhanden', abschnitt: ['ad3'], fall: 'kh-alkoholentzug' },
];

/** Wo noch kein Fall auf dem neuen Kern die Abdeckungsregel erfüllt (Stand main). Wird kleiner, sobald Fälle kommen;
 *  der Test verlangt, dass keine Lücke außerhalb der Liste entsteht (parallele Fallwellen: erledigte Einträge dürfen kurz stehen bleiben, beim nächsten PR streichen). Regel: jede CE ein Kernfall im 1./2. Drittel, CE04–CE11 einer im 3. Drittel. */
export const ABDECKUNG_OFFEN: readonly string[] = [
  'ce.04:ad12', 'ce.04:ad3', 'ce.07:ad12', 'ce.07:ad3', 'ce.08:ad12', 'ce.08:ad3',
];

const MIT_AD3 = ['ce.04', 'ce.05', 'ce.06', 'ce.07', 'ce.08', 'ce.09', 'ce.10', 'ce.11'];

/** Minimaler Blick auf einen Kernfall, damit die Funktionen ohne den Kern testbar bleiben. */
export interface KernFallKopf { id: string; titel: string; kurz: string; lehrplan?: { ce: string[]; abschnitt: Abschnitt[] } }
export interface AltFallKopf { id: string; title: string }

export type AuswahlEintrag =
  | { art: 'kern'; id: string; titel: string; kurz: string; abschnitt: Abschnitt[]; auchIn: string[]; haupt: boolean }
  | { art: 'alt'; id: string; titel: string; abschnitt: Abschnitt[]; paket?: string; abgeloestDurch?: string }
  | { art: 'geplant'; titel: string; abschnitt: Abschnitt[]; paket?: string };

export interface CeGruppe { ce: string; eintraege: AuswahlEintrag[] }

const passt = (abschnitt: Abschnitt[], filter: Abschnitt | 'alle') => filter === 'alle' || abschnitt.includes(filter);

/**
 * Fallauswahl nach CE: zuerst Kernfälle (Haupt-CE vor „auch in“), dann Altfälle (Markierung „alt“, bis zur Ablösung),
 * dann noch geplante Fälle. `ceIds` gibt Reihenfolge und Umfang vor (z. B. alle CE oder nur ?ce=).
 */
export function fallauswahl(ceIds: string[], kern: readonly KernFallKopf[], alt: readonly AltFallKopf[], filter: Abschnitt | 'alle' = 'alle'): CeGruppe[] {
  const kernIds = new Set(kern.map((k) => k.id));
  return ceIds.map((ce) => {
    const k: AuswahlEintrag[] = kern
      .filter((f) => f.lehrplan?.ce.includes(ce) && passt(f.lehrplan.abschnitt, filter))
      .map((f) => ({ art: 'kern' as const, id: f.id, titel: f.titel, kurz: f.kurz, abschnitt: f.lehrplan!.abschnitt, auchIn: f.lehrplan!.ce.filter((c) => c !== ce), haupt: f.lehrplan!.ce[0] === ce }))
      .sort((a, b) => Number(b.haupt) - Number(a.haupt));
    const plan = FALLPLAN.filter((p) => p.ce === ce && passt(p.abschnitt, filter));
    const a: AuswahlEintrag[] = plan.flatMap((p) => (p.alt ?? []).map((id) => alt.find((s) => s.id === id)).filter((s): s is AltFallKopf => !!s)
      .map((s) => ({ art: 'alt' as const, id: s.id, titel: s.title, abschnitt: p.abschnitt, paket: p.paket, abgeloestDurch: p.fall && kernIds.has(p.fall) ? kern.find((x) => x.id === p.fall)!.titel : undefined })));
    const g: AuswahlEintrag[] = plan.filter((p) => !p.alt?.length && !(p.fall && kernIds.has(p.fall)))
      .map((p) => ({ art: 'geplant' as const, titel: p.titel, abschnitt: p.abschnitt, paket: p.paket }));
    return { ce, eintraege: [...k, ...a, ...g] };
  });
}

/** Lücken der Abdeckungsregel (nur Kernfälle zählen). */
export function abdeckungsLuecken(ceIds: string[], kern: readonly KernFallKopf[]): string[] {
  const out: string[] = [];
  for (const ce of ceIds) {
    const hat = (a: Abschnitt) => kern.some((f) => f.lehrplan?.ce.includes(ce) && f.lehrplan.abschnitt.includes(a));
    if (!hat('ad12')) out.push(`${ce}:ad12`);
    if (MIT_AD3.includes(ce) && !hat('ad3')) out.push(`${ce}:ad3`);
  }
  return out;
}

/** Wie viele Fälle (Kern, alt) es je CE gibt; für die CE-Seite ohne Kern-Import. */
export function planZaehler(ce: string): { vorhanden: number; alt: number; geplant: number } {
  const p = FALLPLAN.filter((x) => x.ce === ce);
  return {
    vorhanden: p.filter((x) => x.fall).length,
    alt: p.filter((x) => !x.fall).reduce((s, x) => s + (x.alt?.length ?? 0), 0),
    geplant: p.filter((x) => !x.fall && !x.alt?.length).length,
  };
}
