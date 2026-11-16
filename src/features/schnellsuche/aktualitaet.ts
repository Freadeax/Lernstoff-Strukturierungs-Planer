// Quellen und Aktualität im Schnellsucher: Einträge des Quellenregisters (src/features/quellen) als
// durchsuchbare Quellen und der Fassungsstand an den Standards. Das Register bleibt die eine Datenquelle;
// hier steht nur die Abbildung auf Suchdokumente und die Zuordnung zu den Regelwerken.

import type { Nutzung } from '../quellen/nutzung';
import { jahr, type QuellenEintrag } from '../quellen/register-basis';
import { quellenStand, type QuellenStand } from '../quellen/status';
import type { SuchDok } from './suchkern';

/** Register-Eintrag → Regelwerk im Schnellsucher. Nicht genannte Einträge gehören zu keinem Standard. */
const ZU_REGELWERK: Record<string, string> = {
  'gesetz.ifsg': 'rw.hygiene', krinko: 'rw.hygiene', 'who.haendehygiene': 'rw.hygiene',
  erc: 'rw.notfall', 'resus.abcde': 'rw.notfall', 'resus.anaphylaxie': 'rw.notfall', news2: 'rw.notfall',
  fachinfo: 'rw.arzneimittel',
};

export const quellenLink = (id: string) => `/system/quellen?quelle=${encodeURIComponent(id)}`;

/**
 * Kurzer Hinweis, wenn Inhalte hinter der neuesten Fassung stehen oder ein Abgleich offen ist. Gleiche
 * Berechnung wie die Seite „Quellen und Aktualität“ (quellenStand), also auch über die Quellenangaben der Inhalte.
 */
export function standHinweis(st: QuellenStand): string | undefined {
  if (st.status !== 'abgleich') return undefined;
  return appStaende(st).length ? `neue Fassung ${st.eintrag.aktuell.stand}` : 'Abgleich offen';
}

/** Ältere Stände, auf denen App-Inhalte noch beruhen (Register-Angabe und Quellenangaben der Inhalte). */
function appStaende(st: QuellenStand): string[] {
  const e = st.eintrag;
  const alt = st.veraltet.map((n) => n.quelle.stand);
  if (e.appStand && jahr(e.appStand) < jahr(e.aktuell.stand)) alt.unshift(e.appStand);
  return [...new Set(alt)];
}

function standZeilen(st: QuellenStand): Array<{ label: string; text: string }> {
  const e = st.eintrag;
  const alt = appStaende(st);
  return [
    { label: 'Neueste Fassung', text: [e.aktuell.stand, e.aktuell.erschienen && `erschienen ${datum(e.aktuell.erschienen)}`].filter(Boolean).join(', ') },
    ...(alt.length ? [{ label: 'Stand der App-Inhalte', text: `${alt.join(', ')}${st.veraltet.length ? ` (${[...new Set(st.veraltet.map((n) => n.inhalt))].slice(0, 4).join(', ')}${st.veraltet.length > 4 ? ' …' : ''})` : ''}` }]
      : e.appStand ? [{ label: 'Stand der App-Inhalte', text: e.appStand }] : []),
    ...(e.kern ? [{ label: 'Was neu ist', text: e.kern }] : []),
    ...(e.offen ? [{ label: 'Abgleich offen', text: e.offen }] : []),
    { label: 'Zuletzt nachgesehen', text: st.letztePruefung ? datum(st.letztePruefung) : 'noch nie geprüft' },
  ];
}

const datum = (iso: string) => iso.split('-').reverse().join('.');

/** Gesetze, Leitlinien, Empfehlungen und Instrumente des Registers. DNQP-Standards stehen schon als Standard im Index. */
export function ausRegister(eintraege: readonly QuellenEintrag[], bekannteStandards: ReadonlySet<string>, nutzungen: readonly Nutzung[], heute: string): SuchDok[] {
  return eintraege.filter((e) => e.art !== 'expertenstandard').map((e) => {
    const st = quellenStand(e, nutzungen, heute);
    const rw = ZU_REGELWERK[e.id] ?? (e.art === 'gesetz' ? 'rw.recht' : undefined);
    return {
      id: `quelle:${e.id}`, art: 'quelle' as const, titel: e.titel,
      standardIds: rw && bekannteStandards.has(rw) ? [rw] : [],
      pfad: [e.herausgeber, `Stand ${e.aktuell.stand}`].join(' · '),
      text: [e.kern, e.offen, e.hinweis].filter(Boolean).join(' '),
      link: quellenLink(e.id),
      hinweis: standHinweis(st),
      details: [...standZeilen(st), ...(e.hinweis ? [{ label: 'Hinweis', text: e.hinweis }] : [])],
    };
  });
}

/** Ergänzt die DNQP-Standards im Index um Stand und offenen Abgleich aus dem Register (gleiche id). */
export function mitStand(doks: SuchDok[], eintraege: readonly QuellenEintrag[], nutzungen: readonly Nutzung[], heute: string): SuchDok[] {
  const nachId = new Map(eintraege.filter((e) => e.art === 'expertenstandard').map((e) => [e.id, e]));
  return doks.map((d) => {
    const e = d.art === 'standard' && d.id.startsWith('dnqp:') ? nachId.get(d.id.slice(5)) : undefined;
    if (!e) return d;
    const st = quellenStand(e, nutzungen, heute);
    return { ...d, hinweis: standHinweis(st), details: [...(d.details ?? []).filter((x) => x.label !== 'Fassung'), ...standZeilen(st)] };
  });
}
