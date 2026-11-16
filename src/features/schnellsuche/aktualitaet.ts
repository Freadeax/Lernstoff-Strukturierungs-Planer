// Quellen und Aktualität im Schnellsucher: Einträge des Quellenregisters (src/features/quellen) als
// durchsuchbare Quellen und der Fassungsstand an den Standards. Das Register bleibt die eine Datenquelle;
// hier steht nur die Abbildung auf Suchdokumente und die Zuordnung zu den Regelwerken.

import { jahr, type QuellenEintrag } from '../quellen/register-basis';
import type { SuchDok } from './suchkern';

/** Register-Eintrag → Regelwerk im Schnellsucher. Nicht genannte Einträge gehören zu keinem Standard. */
const ZU_REGELWERK: Record<string, string> = {
  'gesetz.ifsg': 'rw.hygiene', krinko: 'rw.hygiene', 'who.haendehygiene': 'rw.hygiene',
  erc: 'rw.notfall', 'resus.abcde': 'rw.notfall', 'resus.anaphylaxie': 'rw.notfall', news2: 'rw.notfall',
  fachinfo: 'rw.arzneimittel',
};

export const quellenLink = (id: string) => `/system/quellen?quelle=${encodeURIComponent(id)}`;

/** Kurzer Hinweis, wenn die App hinter der neuesten Fassung steht oder ein Abgleich offen ist. */
export function standHinweis(e: QuellenEintrag): string | undefined {
  if (e.appStand && jahr(e.appStand) < jahr(e.aktuell.stand)) return `neue Fassung ${e.aktuell.stand}`;
  if (e.offen) return 'Abgleich offen';
  return undefined;
}

function standZeilen(e: QuellenEintrag): Array<{ label: string; text: string }> {
  return [
    { label: 'Neueste Fassung', text: [e.aktuell.stand, e.aktuell.erschienen && `erschienen ${datum(e.aktuell.erschienen)}`].filter(Boolean).join(', ') },
    ...(e.appStand ? [{ label: 'Stand der App-Inhalte', text: e.appStand }] : []),
    ...(e.kern ? [{ label: 'Was neu ist', text: e.kern }] : []),
    ...(e.offen ? [{ label: 'Abgleich offen', text: e.offen }] : []),
    { label: 'Zuletzt nachgesehen', text: e.geprueftAm ? datum(e.geprueftAm) : 'noch nie geprüft' },
  ];
}

const datum = (iso: string) => iso.split('-').reverse().join('.');

/** Gesetze, Leitlinien, Empfehlungen und Instrumente des Registers. DNQP-Standards stehen schon als Standard im Index. */
export function ausRegister(eintraege: readonly QuellenEintrag[], bekannteStandards: ReadonlySet<string>): SuchDok[] {
  return eintraege.filter((e) => e.art !== 'expertenstandard').map((e) => {
    const rw = ZU_REGELWERK[e.id] ?? (e.art === 'gesetz' ? 'rw.recht' : undefined);
    return {
      id: `quelle:${e.id}`, art: 'quelle' as const, titel: e.titel,
      standardIds: rw && bekannteStandards.has(rw) ? [rw] : [],
      pfad: [e.herausgeber, `Stand ${e.aktuell.stand}`].join(' · '),
      text: [e.kern, e.offen, e.hinweis].filter(Boolean).join(' '),
      link: quellenLink(e.id),
      hinweis: standHinweis(e),
      details: [...standZeilen(e), ...(e.hinweis ? [{ label: 'Hinweis', text: e.hinweis }] : [])],
    };
  });
}

/** Ergänzt die DNQP-Standards im Index um Stand und offenen Abgleich aus dem Register (gleiche id). */
export function mitStand(doks: SuchDok[], eintraege: readonly QuellenEintrag[]): SuchDok[] {
  const nachId = new Map(eintraege.filter((e) => e.art === 'expertenstandard').map((e) => [e.id, e]));
  return doks.map((d) => {
    const e = d.art === 'standard' && d.id.startsWith('dnqp:') ? nachId.get(d.id.slice(5)) : undefined;
    if (!e) return d;
    return { ...d, hinweis: standHinweis(e), details: [...(d.details ?? []).filter((x) => x.label !== 'Fassung'), ...standZeilen(e)] };
  });
}
