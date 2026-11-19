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
  aufwachraum: ['thema.ph.periop', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen', 'thema.ph.medikamente'],
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

/** Lernthemen der Fälle auf dem neuen Kern (Spiegel von `fall.lehrplan.themen`, Test `fallplan.test.ts`).
 *  Eigene Liste, damit Lernpfad und Themenseite den Kern nicht laden müssen. */
export const KERN_THEMEN: Record<string, string[]> = {
  'amb-sturz-exsikkose': ['thema.pro.sturz', 'thema.pro.dehydratation', 'thema.kl.demenz', 'thema.beo.vitalzeichen', 'thema.pp.uebergabe'],
  'kh-pneumonie-sepsis': ['thema.kl.atmung', 'thema.kl.infektion', 'thema.beo.vitalzeichen', 'thema.re.schweigepflicht', 'thema.pp.uebergabe'],
  'lz-demenz-schmerz': ['thema.kl.demenz', 'thema.beo.bewusstsein', 'thema.ph.medikamente'],
  'paed-fieberkrampf': ['thema.kl.neuro.epilepsie', 'thema.kl.paediatrie', 'thema.re.schweigepflicht'],
  'psy-panik-suizidalitaet': ['thema.kl.psych', 'thema.re.schweigepflicht'],
  'sr-septischer-schock': ['thema.kl.infektion', 'thema.beo.notfall', 'thema.pp.uebergabe'],
  'kh-erster-tag': ['thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.re.schweigepflicht', 'thema.re.berufsrecht', 'thema.pro.sturz', 'thema.kom.selbstpflege'],
  'kh-reha-erster-weg': ['thema.ph.mobilisation', 'thema.pro.sturz', 'thema.ph.periop', 'thema.pro.thrombose', 'thema.beo.vitalzeichen'],
  'lz-koerperpflege-abgelehnt': ['thema.kom.gespraech', 'thema.kom.grundlagen', 'thema.ph.koerperpflege', 'thema.kom.ethik', 'thema.ph.ausscheidung', 'thema.pro.zystitis'],
  'kh-reanimation-bls': ['thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.kl.herz.khk', 'thema.pp.uebergabe', 'thema.kom.ethik'],
  'na-acs-brustschmerz': ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.beo.vitalzeichen', 'thema.ph.medikamente', 'thema.pp.uebergabe'],
  'lz-schlaganfall-akut': ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.fa.langzeit', 'thema.pp.uebergabe'],
  'its-beatmung-alarm': ['thema.beo.notfall', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.pp.uebergabe', 'thema.re.schweigepflicht'],
};

/** Kernfälle (IDs für ?neu=), die ein Thema üben. */
export function kernZuThema(topicId: string): string[] {
  return Object.keys(KERN_THEMEN).filter((id) => KERN_THEMEN[id]!.includes(topicId));
}
