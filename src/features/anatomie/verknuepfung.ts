// Anatomie → Krankheitsbild und Beobachtungsaufgabe (Audit 11.11.2026): Nach einer Aufgabe führt ein Link
// zum passenden Steckbrief und, wo vorhanden, zur Fallaufgabe, in der man die Beobachtung übt.
// Zuordnung über Katalogthemen: Organbereich der Anatomie → klinische Themen der Krankheitsbilder.

import type { CatalogModule } from '../../modules/catalog-types';
import type { Aufgabe } from '../quiz/quiz';
import { THEMA } from './aufgaben';

/** Organbereich (Anatomie-Thema) → Themenpräfixe der Krankheitsbilder. */
export const ORGAN_ZU_KLINIK: Record<string, string[]> = {
  'thema.ap.herz': ['thema.kl.herz'],
  'thema.ap.atmung': ['thema.kl.atmung'],
  'thema.ap.niere': ['thema.kl.niere'],
  'thema.ap.verdauung': ['thema.kl.verdauung'],
  'thema.ap.bewegung': ['thema.kl.bewegung'],
  'thema.ap.nerven': ['thema.kl.neuro', 'thema.kl.demenz'],
  'thema.ap.haut': ['thema.pro.dekubitus', 'thema.ph.wunde'],
  'thema.ap.hormone': ['thema.kl.diabetes', 'thema.kl.schilddruese'],
};

export interface Weiter { label: string; path: string }

/** Passende Krankheitsbilder zu einer Anatomie-Aufgabe, höchstens drei. */
export function krankheitsbilderZu(a: Pick<Aufgabe, 'topicIds'>, modul: CatalogModule): Array<{ id: string; name: string; topicId: string }> {
  const praefixe = a.topicIds.flatMap((t) => ORGAN_ZU_KLINIK[t] ?? []);
  if (!praefixe.length) return [];
  return (modul.diseaseProfiles ?? [])
    .map((p) => ({ p, t: p.topicIds.find((t) => praefixe.some((x) => t === x || t.startsWith(`${x}.`))) }))
    .filter((x): x is { p: typeof x.p; t: string } => !!x.t)
    .slice(0, 3)
    .map(({ p, t }) => ({ id: p.id, name: p.name, topicId: t }));
}

/** Links „Weiter mit“: Steckbrief und Beobachtung im Fall. */
export const anatomieWeiter = (modul: CatalogModule) => (a: Aufgabe): Weiter[] => {
  const kb = krankheitsbilderZu(a, modul);
  const out: Weiter[] = kb.map((k) => ({ label: `Krankheitsbild: ${k.name}`, path: `/lernen/krankheitsbilder?kb=${encodeURIComponent(k.id)}` }));
  if (kb[0]) out.push({ label: 'Beobachtung im Fall üben', path: `/lernen/krankheitsbilder?ansicht=faelle&thema=${encodeURIComponent(kb[0].topicId)}` });
  return out;
};

export const ANATOMIE_THEMEN = new Set(Object.values(THEMA));
