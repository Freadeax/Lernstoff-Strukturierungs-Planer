// Welche Lernthemen ein Fall des Praxissimulators übt. Damit finden Lernpfade und Themenseiten
// einen Fall, der ohne KI und ohne API-Schlüssel läuft. Nur Blatt-Themen des Katalogs (Test prüft das).
// Die alten Fälle (PRAXIS_THEMEN) sind mit P10 entfallen; alte IDs übersetzt altfaelle.ts.

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
  'kh-harnverhalt-postop': ['thema.ph.ausscheidung', 'thema.ph.periop', 'thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.pro.delir'],
  'lz-dekubitus-immobil': ['thema.pro.dekubitus', 'thema.ph.mobilisation', 'thema.beo.haut', 'thema.pro.dehydratation', 'thema.kl.demenz'],
  'lz-koerperpflege-abgelehnt': ['thema.kom.gespraech', 'thema.kom.grundlagen', 'thema.ph.koerperpflege', 'thema.kom.ethik', 'thema.ph.ausscheidung', 'thema.pro.zystitis'],
  'paed-asthma-schulkind': ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.fa.paediatrie', 'thema.kom.beratung', 'thema.re.schweigepflicht'],
  'paed-bronchiolitis-saeugling': ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.fa.paediatrie', 'thema.ph.hygiene', 'thema.pro.dehydratation'],
  'paed-gastroenteritis-kleinkind': ['thema.kl.paediatrie', 'thema.kl.verdauung', 'thema.pro.dehydratation', 'thema.ph.hygiene', 'thema.re.schweigepflicht'],
  'paed-rausch-jugendliche': ['thema.kl.paediatrie', 'thema.beo.bewusstsein', 'thema.pro.aspiration', 'thema.re.schweigepflicht', 'thema.kom.gespraech'],
  'kh-delir-nacht': ['thema.pro.delir', 'thema.pro.sturz', 'thema.re.fem', 'thema.ph.ausscheidung', 'thema.ph.medikamente'],
  'psy-unruhe-deeskalation': ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.re.fem', 'thema.re.schweigepflicht', 'thema.kom.gespraech'],
  'kh-alkoholentzug': ['thema.kl.psych', 'thema.ph.medikamente', 'thema.beo.vitalzeichen', 'thema.kom.gespraech', 'thema.re.schweigepflicht'],
  'kh-nachblutung': ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.vitalzeichen', 'thema.beo.notfall', 'thema.pro.thrombose', 'thema.pp.uebergabe'],
  'awr-opioid-atemdepression': ['thema.ph.periop', 'thema.ph.medikamente', 'thema.kl.atmung', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen', 'thema.pp.uebergabe'],
  'kh-anaphylaxie-infusion': ['thema.ph.medikamente', 'thema.beo.notfall', 'thema.beo.haut', 'thema.beo.vitalzeichen', 'thema.kl.infektion', 'thema.re.schweigepflicht'],
  'kh-lungenembolie': ['thema.ph.periop', 'thema.pro.thrombose', 'thema.ph.mobilisation', 'thema.beo.notfall', 'thema.beo.vitalzeichen', 'thema.kl.atmung'],
  'kh-medikationsverwechslung': ['thema.ph.medikamente', 'thema.kl.diabetes', 'thema.qw.qm', 'thema.re.haftung', 'thema.kom.ethik', 'thema.beo.vitalzeichen'],
  'lz-demenz-aspiration': ['thema.kl.demenz', 'thema.pro.aspiration', 'thema.kl.atmung', 'thema.re.betreuung', 'thema.pro.pneumonie'],
  'lz-unterzucker-mittag': ['thema.kl.diabetes', 'thema.ph.medikamente', 'thema.beo.bewusstsein', 'thema.ph.ernaehrung'],
  'amb-hausbesuch-still': ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.ph.medikamente', 'thema.re.versorgung'],
  'lz-palliativ-gespraech': ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.re.betreuung'],
  'kh-sterbephase-nacht': ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.re.betreuung'],
  'kh-reanimation-bls': ['thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.kl.herz.khk', 'thema.pp.uebergabe', 'thema.kom.ethik'],
  'na-acs-brustschmerz': ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.beo.vitalzeichen', 'thema.ph.medikamente', 'thema.pp.uebergabe'],
  'lz-schlaganfall-akut': ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.fa.langzeit', 'thema.pp.uebergabe'],
  'its-beatmung-alarm': ['thema.beo.notfall', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.pp.uebergabe', 'thema.re.schweigepflicht'],
  'amb-herzschwaeche': ['thema.kl.herz.insuffizienz', 'thema.kom.beratung', 'thema.fa.ambulant', 'thema.beo.vitalzeichen'],
  'amb-hypoglykaemie': ['thema.kl.diabetes', 'thema.kom.beratung', 'thema.fa.ambulant', 'thema.beo.bewusstsein'],
  'lz-schlaganfall-reha': ['thema.kl.neuro.schlaganfall', 'thema.pro.aspiration', 'thema.ph.mobilisation', 'thema.kom.beratung'],
};

/** Kernfälle (IDs für ?neu=), die ein Thema üben. */
export function kernZuThema(topicId: string): string[] {
  return Object.keys(KERN_THEMEN).filter((id) => KERN_THEMEN[id]!.includes(topicId));
}
