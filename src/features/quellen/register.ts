// Quellenregister: Basis (Gesetze, Leitlinien, Empfehlungen, Instrumente) aus register-basis.ts plus
// die DNQP-Expertenstandards aus dem DNQP-Modul. Regeln für Einträge stehen in register-basis.ts.

import { STANDARDS as DNQP, STAND_UEBERSICHT } from '../dnqp/standards';
import { UEBERSICHT_URL as DNQP_UEBERSICHT } from '../dnqp/standards/bau';
import { GESETZE, LEITLINIEN, INSTRUMENTE, type QuellenEintrag } from './register-basis';

export * from './register-basis';

// ---------------------------------------------------------------- Expertenstandards (aus dem DNQP-Modul)

const STANDARDS: QuellenEintrag[] = [
  {
    id: 'dnqp.alle', titel: 'DNQP-Expertenstandards (Übersicht)', herausgeber: 'DNQP, Hochschule Osnabrück', art: 'expertenstandard',
    muster: /^DNQP-Expertenstandards, jeweils/, aktuell: { stand: 'Übersicht 09/2026', fundstelle: DNQP_UEBERSICHT },
    geprueftAm: STAND_UEBERSICHT, beobachten: 'https://www.dnqp.de/expertenstandards-und-auditinstrumente/', intervallMonate: 6,
    hinweis: 'Gilt für den Expertenstandards-Trainer. Die Fassung je Standard steht in den Einträgen darunter.',
  },
  ...DNQP.filter((s) => s.status === 'aktuell').map((s): QuellenEintrag => {
    const letzte = s.fassungen[s.fassungen.length - 1];
    // Hinweis „stammen aus der Fassung 2018/2019“: Inhalte stehen noch auf einer älteren Fassung.
    const alt = letzte?.hinweis?.match(/stammen aus der Fassung (\d{4})/)?.[1];
    return {
      id: s.id, titel: s.titel, herausgeber: 'DNQP, Hochschule Osnabrück', art: 'expertenstandard',
      muster: new RegExp(`^DNQP Expertenstandard ${s.kurztitel}`),
      aktuell: { stand: letzte ? `${letzte.art} ${letzte.jahr}` : '', fundstelle: s.quelle.url },
      appStand: alt ?? (letzte ? String(letzte.jahr) : undefined),
      geprueftAm: s.quelle.geprueftAm, beobachten: 'https://www.dnqp.de/expertenstandards-und-auditinstrumente/', intervallMonate: 12,
      offen: alt ? `Kriterien im DNQP-Modul stammen noch aus der Fassung ${alt}. Sobald der Auszug der neuen Fassung frei abrufbar ist, nachziehen.` : undefined,
      hinweis: s.quelle.art === 'sekundaer' ? 'Nur über Pressemitteilung oder Fachpresse belegt, kein freier Auszug.' : undefined,
    };
  }),
];

export const QUELLEN: QuellenEintrag[] = [...GESETZE, ...STANDARDS, ...LEITLINIEN, ...INSTRUMENTE];

/** Einträge, zu denen eine Quellenangabe gehört (eine Angabe kann mehrere Gesetze nennen). */
export function eintraegeFuer(titel: string): QuellenEintrag[] {
  return QUELLEN.filter((q) => q.muster.test(titel));
}
