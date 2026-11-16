// Handlungsabläufe der Ablauf-Werkbank (src/features/ablauf) im Schnellsucher: je Ablauf ein Eintrag
// mit allen Schritten und je typischer Falle ein Eintrag mit Fehler und Folge. Die Inhalte bleiben dort.

import type { Ablauf } from '../ablauf/inhalt';
import type { SuchDok } from './suchkern';

/** Welche Regelwerke ein Ablauf berührt. Unbekannte Abläufe gehören über ihre Quellen dazu. */
const ZU_REGELWERK: Record<string, string[]> = {
  'sc-injektion': ['rw.arzneimittel', 'rw.hygiene'],
  medikamente: ['rw.arzneimittel'],
  verbandwechsel: ['rw.hygiene'],
  katheter: ['rw.hygiene'],
};

function regelwerkeVon(a: Ablauf): string[] {
  if (ZU_REGELWERK[a.id]) return ZU_REGELWERK[a.id];
  const q = a.quellen.join(' ');
  return [
    ...(/KRINKO|TRBA|Hygiene/i.test(q) ? ['rw.hygiene'] : []),
    ...(/Fachinformation|Arzneimittel|Medikation/i.test(q) ? ['rw.arzneimittel'] : []),
  ];
}

export const ablaufLink = (id: string, modus?: 'fehler') => `/lernen/ablauf?ablauf=${encodeURIComponent(id)}${modus ? `&modus=${modus}` : ''}`;

export function ausAblaeufen(ablaeufe: readonly Ablauf[]): SuchDok[] {
  return ablaeufe.flatMap((a) => {
    const standardIds = regelwerkeVon(a);
    const kritisch = a.schritte.filter((s) => s.kritisch);
    const ablauf: SuchDok = {
      id: `ablauf:${a.id}`, art: 'ablauf', titel: a.titel, standardIds,
      pfad: `Ablauf-Werkbank · ${a.kurz}`,
      text: [a.lage, ...a.schritte.map((s) => s.text)].join(' '),
      stichworte: [a.kurz, ...a.material],
      link: ablaufLink(a.id),
      details: [
        { label: 'Situation', text: a.lage },
        { label: `Schritte (${a.schritte.length})`, text: a.schritte.map((s, i) => `${i + 1}. ${s.text}${s.kritisch ? ' (kritisch)' : ''}`).join(' ') },
        ...(kritisch.length ? [{ label: 'Kritische Schritte', text: kritisch.map((s) => `${s.text}: ${s.warum}`).join(' ') }] : []),
        ...(a.material.length ? [{ label: 'Material', text: a.material.join(', ') }] : []),
        ...(a.quellen.length ? [{ label: 'Quellen', text: a.quellen.join('; ') }] : []),
      ],
    };
    const fallen: SuchDok[] = a.fallen.map((f) => ({
      id: `ablauf:${a.id}:${f.id}`, art: 'irrtum', titel: f.fehler, standardIds,
      pfad: `${a.titel} · typische Falle${f.kritisch ? ' (kritisch)' : ''}`,
      text: `${f.fehler} ${f.folge}`,
      link: ablaufLink(a.id, 'fehler'),
      details: [
        { label: 'So nicht', text: f.text },
        { label: 'Warum falsch', text: f.fehler },
        { label: 'Mögliche Folge', text: f.folge },
      ],
    }));
    return [ablauf, ...fallen];
  });
}
