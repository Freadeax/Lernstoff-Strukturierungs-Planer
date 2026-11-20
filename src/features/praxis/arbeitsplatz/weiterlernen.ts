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
  'kh-harnverhalt-postop': {
    themen: ['thema.ph.ausscheidung', 'thema.ph.periop', 'thema.ph.hygiene', 'thema.pro.delir'],
    krankheiten: ['kh.hwi', 'kh.delir'],
    extra: [{ label: 'Wissenstrainer Hygiene', path: '/lernen/wissen?fach=hygiene', warum: 'Aseptisches Arbeiten beim Katheterisieren üben.' }],
  },
  'lz-dekubitus-immobil': {
    themen: ['thema.pro.dekubitus', 'thema.ph.mobilisation', 'thema.beo.haut', 'thema.pro.dehydratation'],
    krankheiten: ['kh.dekubitus', 'kh.demenz'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Dekubitusprophylaxe und Schmerzmanagement im Überblick.' }],
  },
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
    extra: [{ label: 'Wissenstrainer Hygiene', path: '/lernen/wissen?fach=hygiene', warum: 'Händedesinfektion und die fünf Momente üben.' }],
  },
  'amb-sturz-exsikkose': {
    themen: ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.pro.delir'],
    krankheiten: ['kh.exsikkose', 'kh.delir'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Sturzprophylaxe und Ernährungsmanagement im Überblick.' }],
  },
  'sr-septischer-schock': {
    themen: ['thema.kl.infektion', 'thema.pro.zystitis', 'thema.beo.vitalzeichen', 'thema.beo.bewusstsein'],
    krankheiten: ['kh.sepsis', 'kh.hwi'],
    extra: [{ label: 'Rechentrainer: Perfusor und Laufrate', path: '/lernen/fertigkeiten?uebung=rechnen&typen=perfusor,laufrate', warum: 'Laufraten von Katecholaminen sicher berechnen.' }],
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
  'kh-nachblutung': {
    themen: ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.vitalzeichen', 'thema.pro.thrombose'],
    krankheiten: [],
  },
  'kh-medikationsverwechslung': {
    themen: ['thema.ph.medikamente', 'thema.qw.qm', 'thema.kl.diabetes', 'thema.re.haftung'],
    krankheiten: [],
  },
  'kh-lungenembolie': {
    themen: ['thema.pro.thrombose', 'thema.ph.mobilisation', 'thema.ph.periop', 'thema.beo.notfall'],
    krankheiten: [],
  },
  'kh-anaphylaxie-infusion': {
    themen: ['thema.ph.medikamente', 'thema.beo.notfall', 'thema.beo.haut', 'thema.beo.vitalzeichen'],
    krankheiten: [],
  },
  'awr-opioid-atemdepression': {
    themen: ['thema.ph.periop', 'thema.ph.medikamente', 'thema.kl.atmung', 'thema.beo.bewusstsein'],
    krankheiten: [],
  },
  'psy-panik-suizidalitaet': {
    themen: ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.kom.gespraech'],
    krankheiten: ['kh.angststoerung', 'kh.depression'],
  },
  // Fallwelle P19 (CE 10/11)
  'paed-asthma-schulkind': {
    themen: ['thema.kl.atmung', 'thema.kl.paediatrie', 'thema.kom.beratung'],
    krankheiten: ['kh.asthma'],
    extra: [{ label: 'Wissenstrainer Arzneimittel', path: '/lernen/wissen?fach=arzneimittel', warum: 'Salbutamol und Prednisolon: Wirkung, Nebenwirkung, Beobachtung.' }],
  },
  'paed-bronchiolitis-saeugling': {
    themen: ['thema.kl.atmung', 'thema.fa.paediatrie', 'thema.ph.hygiene', 'thema.pro.dehydratation'],
    krankheiten: ['kh.bronchiolitis'],
  },
  'paed-gastroenteritis-kleinkind': {
    themen: ['thema.kl.verdauung', 'thema.pro.dehydratation', 'thema.ph.hygiene', 'thema.kl.paediatrie'],
    krankheiten: ['kh.gastroenteritis', 'kh.exsikkose'],
  },
  'paed-rausch-jugendliche': {
    themen: ['thema.kl.paediatrie', 'thema.beo.bewusstsein', 'thema.pro.aspiration', 'thema.re.schweigepflicht'],
    krankheiten: ['kh.alkohol'],
  },
  'kh-delir-nacht': {
    themen: ['thema.pro.delir', 'thema.pro.sturz', 'thema.re.fem', 'thema.ph.ausscheidung'],
    krankheiten: ['kh.delir', 'kh.femurfraktur'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Sturzprophylaxe und Schmerzmanagement im Überblick.' }],
  },
  'psy-unruhe-deeskalation': {
    themen: ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.re.fem', 'thema.re.schweigepflicht'],
    krankheiten: ['kh.schizophrenie'],
  },
  'kh-alkoholentzug': {
    themen: ['thema.kl.psych', 'thema.ph.medikamente', 'thema.beo.vitalzeichen', 'thema.kom.gespraech'],
    krankheiten: ['kh.alkohol', 'kh.delir'],
  },
  'lz-demenz-aspiration': {
    themen: ['thema.pro.aspiration', 'thema.kl.demenz', 'thema.re.betreuung', 'thema.pro.pneumonie'],
    krankheiten: ['kh.demenz', 'kh.pneumonie'],
    extra: [{ label: 'Expertenstandards nachschlagen', path: '/lernen/schnellsuche', warum: 'Ernährungsmanagement und Beziehungsgestaltung bei Demenz im Überblick.' }],
  },
  'lz-unterzucker-mittag': {
    themen: ['thema.kl.diabetes', 'thema.ph.medikamente', 'thema.ph.ernaehrung'],
    krankheiten: ['kh.diabetes-typ2'],
    extra: [{ label: 'Rechentrainer: Insulin', path: '/lernen/fertigkeiten?uebung=rechnen', warum: 'Einheiten und Insulindosen sicher rechnen.' }],
  },
  'amb-hausbesuch-still': {
    themen: ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.ph.medikamente'],
    krankheiten: [],
  },
  'lz-palliativ-gespraech': {
    themen: ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.re.betreuung'],
    krankheiten: [],
  },
  'kh-sterbephase-nacht': {
    themen: ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente'],
    krankheiten: [],
  },
  'kh-reanimation-bls': {
    themen: ['thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.kl.herz.khk'],
    krankheiten: ['kh.herzinfarkt'],
    extra: [{ label: 'Reanimation üben', path: '/lernen/fertigkeiten?uebung=rea', warum: 'Herzdruckmassage, AED und Rhythmus im Wissenstrainer (Notfall) wiederholen.' }],
  },
  'na-acs-brustschmerz': {
    themen: ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.ph.medikamente'],
    krankheiten: ['kh.herzinfarkt'],
    extra: [{ label: 'Wissenstrainer Arzneimittel', path: '/lernen/wissen?fach=arzneimittel', warum: 'Nitrat, ASS, Heparin und Morphin: Wirkung, Gegenanzeigen, Beobachtung.' }],
  },
  'lz-schlaganfall-akut': {
    themen: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.fa.langzeit'],
    krankheiten: ['kh.schlaganfall'],
  },
  'its-beatmung-alarm': {
    themen: ['thema.kl.atmung', 'thema.beo.notfall', 'thema.ph.medikamente'],
    krankheiten: ['kh.pneumonie'],
    extra: [{ label: 'Rechentrainer: Perfusor und Laufrate', path: '/lernen/fertigkeiten?uebung=rechnen&typen=perfusor,laufrate', warum: 'Laufraten in Dosis umrechnen (Propofol, Sufentanil, Noradrenalin).' }],
  },
  'amb-herzschwaeche': {
    themen: ['thema.kl.herz.insuffizienz', 'thema.kom.beratung', 'thema.fa.ambulant'],
    krankheiten: ['kh.herzinsuffizienz'],
  },
  'amb-hypoglykaemie': {
    themen: ['thema.kl.diabetes', 'thema.kom.beratung', 'thema.fa.ambulant'],
    krankheiten: ['kh.diabetes-typ2'],
    extra: [{ label: 'Physiologie: Blutzucker', path: '/lernen/physiologie', warum: 'Wie Insulin, Kohlenhydrate und Bewegung den Zucker verschieben.' }],
  },
  'lz-schlaganfall-reha': {
    themen: ['thema.kl.neuro.schlaganfall', 'thema.pro.aspiration', 'thema.ph.mobilisation', 'thema.kom.beratung'],
    krankheiten: ['kh.schlaganfall'],
  },
};
