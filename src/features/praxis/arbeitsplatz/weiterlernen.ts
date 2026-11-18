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
};
