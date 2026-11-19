// Weiterlernen nach einem Fall auf dem neuen Kern (P5): Lernthemen, Krankheitsbilder, passende Trainer.
// Je Fall von Hand gepflegt (wie praxis/themen.ts und krankheitsbilder/fallbezug.ts); ein neuer Fall braucht
// einen Eintrag (Test in weiterlernen.test.ts).

export interface WeiterlernenEintrag {
  /** Blatt-Themen des Katalogs */
  themen: string[];
  /** Krankheitsbilder (kh.*) */
  krankheiten: string[];
  /** weitere Übungen mit Grund */
  extra?: Array<{ label: string; path: string; warum: string }>;
}

export const WEITERLERNEN_V2: Record<string, WeiterlernenEintrag> = {
  'lz-koerperpflege-abgelehnt': {
    themen: ['thema.kom.gespraech', 'thema.ph.koerperpflege', 'thema.ph.ausscheidung', 'thema.pro.zystitis'],
    krankheiten: ['kh.hwi'],
  },
  'kh-reha-erster-weg': {
    themen: ['thema.ph.mobilisation', 'thema.pro.sturz', 'thema.ph.periop', 'thema.pro.thrombose'],
    krankheiten: ['kh.arthrose'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Mobilität, Sturzprophylaxe und Schmerzmanagement im Überblick.' }],
  },
  'kh-erster-tag': {
    themen: ['thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.re.schweigepflicht', 'thema.pro.sturz'],
    krankheiten: ['kh.hwi'],
    extra: [{ label: 'Hygiene-Trainer', path: '/lernen/hygiene', warum: 'Händedesinfektion und die fünf Momente üben.' }],
  },
  'amb-sturz-exsikkose': {
    themen: ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.pro.delir'],
    krankheiten: ['kh.exsikkose', 'kh.delir'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Sturzprophylaxe und Ernährungsmanagement im Überblick.' }],
  },
  'sr-septischer-schock': {
    themen: ['thema.kl.infektion', 'thema.pro.zystitis', 'thema.beo.vitalzeichen', 'thema.beo.bewusstsein'],
    krankheiten: ['kh.sepsis', 'kh.hwi'],
    extra: [{ label: 'Rechentrainer: Perfusor und Laufrate', path: '/lernen/rechnen?typen=perfusor,laufrate', warum: 'Laufraten von Katecholaminen sicher berechnen.' }],
  },
  'kh-pneumonie-sepsis': {
    themen: ['thema.pro.pneumonie', 'thema.kl.infektion', 'thema.beo.vitalzeichen', 'thema.pro.delir'],
    krankheiten: ['kh.pneumonie', 'kh.sepsis', 'kh.delir'],
  },
  'lz-demenz-schmerz': {
    themen: ['thema.kl.demenz', 'thema.fa.langzeit', 'thema.pro.dekubitus', 'thema.pro.dehydratation'],
    krankheiten: ['kh.demenz', 'kh.dekubitus', 'kh.exsikkose'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Schmerzmanagement, Demenz, Dekubitus und Ernährung im Überblick.' }],
  },
  'paed-fieberkrampf': {
    themen: ['thema.fa.paediatrie', 'thema.kl.paediatrie', 'thema.beo.notfall', 'thema.kom.beratung'],
    krankheiten: ['kh.fieberkrampf'],
  },
  'psy-panik-suizidalitaet': {
    themen: ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.kom.gespraech'],
    krankheiten: ['kh.angststoerung', 'kh.depression'],
  },
  'kh-reanimation-bls': {
    themen: ['thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.kl.herz.khk'],
    krankheiten: ['kh.herzinfarkt'],
    extra: [{ label: 'Reanimation üben', path: '/lernen/notfall?modus=rea', warum: 'Herzdruckmassage, AED und Rhythmus im Notfall-Trainer wiederholen.' }],
  },
  'na-acs-brustschmerz': {
    themen: ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.ph.medikamente'],
    krankheiten: ['kh.herzinfarkt'],
    extra: [{ label: 'Arzneimittel-Trainer', path: '/lernen/arzneimittel', warum: 'Nitrat, ASS, Heparin und Morphin: Wirkung, Gegenanzeigen, Beobachtung.' }],
  },
  'lz-schlaganfall-akut': {
    themen: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.fa.langzeit'],
    krankheiten: ['kh.schlaganfall'],
  },
  'its-beatmung-alarm': {
    themen: ['thema.kl.atmung', 'thema.beo.notfall', 'thema.ph.medikamente'],
    krankheiten: ['kh.pneumonie'],
    extra: [{ label: 'Rechentrainer: Perfusor und Laufrate', path: '/lernen/rechnen?typen=perfusor,laufrate', warum: 'Laufraten in Dosis umrechnen (Propofol, Sufentanil, Noradrenalin).' }],
  },
};
