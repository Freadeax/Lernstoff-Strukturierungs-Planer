// Welche Lernthemen ein Fall des Praxissimulators übt. Damit finden Lernpfade und Themenseiten
// einen Fall, der ohne KI und ohne API-Schlüssel läuft. Nur Blatt-Themen des Katalogs (Test prüft das).

import type { Scenario } from './types';

export const PRAXIS_THEMEN: Record<string, string[]> = {
  hausbesuch: ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.kom.gespraech'],
  pflegeheim: ['thema.kl.diabetes', 'thema.fa.langzeit', 'thema.ph.medikamente'],
  nachtwache: ['thema.kl.herz.insuffizienz', 'thema.beo.vitalzeichen', 'thema.ph.medikamente'],
  zna: ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.fa.akut'],
  its: ['thema.fa.akut', 'thema.pp.uebergabe', 'thema.beo.vitalzeichen'],
  kind: ['thema.fa.paediatrie', 'thema.kl.paediatrie', 'thema.pro.dehydratation'],
  psychiatrie: ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.kom.gespraech'],
  reha: ['thema.ph.mobilisation', 'thema.pro.sturz', 'thema.kl.neuro.schlaganfall'],
  palliativ: ['thema.ph.palliativ', 'thema.kom.ethik', 'thema.kom.gespraech'],
  sepsis: ['thema.kl.infektion', 'thema.pro.zystitis', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen'],
  nachblutung: ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.vitalzeichen'],
  schlaganfall: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.pro.aspiration'],
  anaphylaxie: ['thema.beo.notfall', 'thema.ph.medikamente', 'thema.ph.injektion'],
  lungenembolie: ['thema.kl.herz.pavk', 'thema.pro.thrombose', 'thema.ph.periop'],
  delir: ['thema.pro.delir', 'thema.re.fem', 'thema.ph.periop', 'thema.ph.ausscheidung'],
  asthma: ['thema.kl.atmung', 'thema.kl.paediatrie', 'thema.re.schweigepflicht'],
  demenz: ['thema.kl.demenz', 'thema.pro.pneumonie', 'thema.pro.dekubitus', 'thema.kom.ethik'],
  bronchiolitis: ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.ph.hygiene', 'thema.pro.dehydratation'],
  herzschwaeche: ['thema.kl.herz.insuffizienz', 'thema.fa.ambulant', 'thema.ph.medikamente', 'thema.kom.beratung'],
  rausch: ['thema.beo.bewusstsein', 'thema.pro.aspiration', 'thema.kl.paediatrie', 'thema.kom.gespraech'],
};

/** Fälle, die ein Thema üben, in der Reihenfolge des Katalogs. */
export function praxisZuThema<T extends Pick<Scenario, 'id'>>(topicId: string, faelle: T[]): T[] {
  return faelle.filter((f) => PRAXIS_THEMEN[f.id]?.includes(topicId));
}
