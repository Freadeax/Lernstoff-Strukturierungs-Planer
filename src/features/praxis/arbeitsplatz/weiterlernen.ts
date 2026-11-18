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
};
