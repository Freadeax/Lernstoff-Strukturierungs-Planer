// Praxissimulator neu – lesbare Befugnis-Matrix aus dem Katalog (Paket P3). Rein; die Datei schreibt matrix.test.ts,
// wenn BEFUGNIS_MATRIX=<Pfad> gesetzt ist: BEFUGNIS_MATRIX=../BEFUGNIS-MATRIX.md npx vitest run src/features/praxis/kern/matrix

import { KATALOG_LISTE, NACHWEIS } from './katalog';
import { fundstelle, LEHRPLAN_TITEL, LP, spaltenStaerke, staerke, unbelegteUnterschiede, type Staerke } from './lehrplan-belege';
import type { BefugnisLevel, MassnahmeDefinition, Reiter, Rolle } from './typen';

const REITER: Array<[Reiter, string]> = [
  ['gespraech', '1 Gespräch & Beziehung'], ['beobachten', '2 Beobachten & Einschätzen'], ['akut', '3 Akut & Sicherheit'],
  ['messen', '4 Messen & Diagnostik'], ['versorgen', '5 Pflegen & Versorgen'], ['melden', '6 Melden & Übergabe'],
];
const LEVEL_TEXT: Record<BefugnisLevel, string> = {
  selbst: 'selbst', 'mit-anleitung': 'mit PA', 'nach-anordnung': 'nach Anordnung', gesperrt: 'gesperrt', 'nur-aerztlich': 'ärztlich',
};
const ZEICHEN: Record<Staerke, string> = { ausdruecklich: '●', abgeleitet: '◐', 'nicht-belegt': '○' };
const ROLLEN: Rolle[] = [1, 2, 3, 'pflegefachperson'];

const zelle = (m: MassnahmeDefinition, r: Rolle) => `${LEVEL_TEXT[m.befugnis[r]]} ${ZEICHEN[spaltenStaerke(NACHWEIS[m.id]!, r, m.befugnis[r])]}`;
const seiten = (m: MassnahmeDefinition) => [...new Set(NACHWEIS[m.id]!.stellen.map((x) => x.seite))].sort((a, b) => a - b).join(', ') || '–';
const esc = (t: string) => t.replace(/\|/g, '/');

export function befugnisMatrix(stand = '18.11.2026'): string {
  const L: string[] = [];
  const alle = KATALOG_LISTE;
  const nachStaerke = (s: Staerke) => alle.filter((m) => staerke(NACHWEIS[m.id]!, m.befugnis) === s);
  const einsZwei = alle.filter((m) => m.befugnis[1] !== m.befugnis[2] && !NACHWEIS[m.id]!.stellen.some((x) => x.drittel === '1.'));
  const abw = alle.filter((m) => NACHWEIS[m.id]!.abweichung);

  L.push('# Befugnis-Matrix Praxissimulator (Handlungskatalog P3)', '');
  L.push(`Stand ${stand}. Erzeugt aus \`src/features/praxis/kern/katalog.ts\`. Grundlage: ${LEHRPLAN_TITEL}, Az. 43 – 6512.-2243/102 vom 5.8.2020.`, '');
  L.push('## Kurz zusammengefasst', '');
  L.push(`- ${alle.length} Maßnahmen in 6 Reitern (Spur A ${alle.filter((m) => m.spur !== 'B').length}, Spur B ${alle.filter((m) => m.spur !== 'A').length}, „beide“ zählt doppelt).`);
  L.push(`- Belegt für alle drei Drittel: ${nachStaerke('ausdruecklich').length} ausdrücklich (●), ${nachStaerke('abgeleitet').length} nur über allgemeine Kompetenzen (◐), ${nachStaerke('nicht-belegt').length} mindestens ein Drittel nicht belegt (○).`);
  L.push('- **Der Lehrplan unterscheidet 1. und 2. Drittel fast nie** (gemeinsamer Abschnitt „1./2. Ausbildungsdrittel“; eigene 1.-Drittel-Inhalte nur CE 01–03). Jeder Unterschied zwischen 1. und 2. Drittel unten ist deshalb **nur ein Konzept-Grundwert** und braucht eine Entscheidung.');
  L.push('- Der Lehrplan beschreibt Lernzeitpunkt und Kompetenzniveau, keine Befugnis im Rechtssinn: 1./2. Drittel „wirken mit“, „Durchführung in stabilen Situationen“ (S. 53–54), 3. Drittel „führen eigenständig ärztlich veranlasste Maßnahmen durch“ (S. 55). Was jemand wirklich darf, entscheiden Einrichtung und Praxisanleitung; darum sind alle Grundwerte über ein Einrichtungsprofil einstellbar (`kern/einrichtung.ts`, ärztliche Vorbehalte ausgenommen).', '');

  L.push('### Unterschied 1. ↔ 2. Drittel nur Konzept-Grundwert (im Lehrplan nicht unterschieden)', '');
  L.push('| Maßnahme | 1. Drittel | 2. Drittel |', '|---|---|---|');
  for (const m of einsZwei) L.push(`| ${esc(m.name)} | ${LEVEL_TEXT[m.befugnis[1]]} | ${LEVEL_TEXT[m.befugnis[2]]} |`);
  L.push('');
  L.push('### Abweichungen vom Konzept-Vorschlag oder Stellen, an denen der Lehrplan mehr zuließe', '');
  for (const m of abw) L.push(`- **${esc(m.name)}**: ${NACHWEIS[m.id]!.abweichung}`);
  L.push('');
  L.push('### Nicht belegt (Grundwert aus KONZEPT 6.1)', '');
  for (const m of nachStaerke('nicht-belegt')) {
    const n = NACHWEIS[m.id]!;
    const spalten = ([1, 2, 3] as const).filter((d) => spaltenStaerke(n, d, m.befugnis[d]) === 'nicht-belegt').map((d) => `${d}.`).join(', ');
    L.push(`- ${esc(m.name)} (Drittel ${spalten})${n.anmerkung ? `: ${n.anmerkung}` : ''}`);
  }
  L.push('');

  L.push('## Lesehilfe', '');
  L.push('- Befugnis: **selbst** · **mit PA** (Praxisanleitung kommt dazu) · **gesperrt** (in diesem Drittel nicht, auch nicht mit Anleitung) · **ärztlich** (ärztliche Aufgabe, Pflege assistiert). „Anordnung: ja“ heißt: zusätzlich immer eine ärztliche Anordnung nötig, egal welche Rolle.');
  L.push('- Beleg je Spalte: ● Maßnahme im Lehrplan genannt · ◐ nur über eine allgemeine Kompetenz ableitbar · ○ nicht belegt. Die Spalte PFP (Pflegefachperson, Spur B) ist höchstens ◐, weil der Lehrplan das Abschlussniveau beschreibt, nicht das Berufsrecht.');
  L.push('- Seiten = gedruckte Seite im Lehrplan-PDF (generalistische Abschnitte, Anlage 1 und 2).', '');

  for (const [r, titel] of REITER) {
    L.push(`## ${titel}`, '');
    L.push('| Maßnahme | Spur | 1. | 2. | 3. | PFP | Anordnung | Lehrplan S. | Hinweis |', '|---|---|---|---|---|---|---|---|---|');
    for (const m of alle.filter((x) => x.reiter === r)) {
      const n = NACHWEIS[m.id]!;
      const hinweis = [...unbelegteUnterschiede(n, m.befugnis), n.anmerkung ?? ''].filter(Boolean).join(' ');
      L.push(`| ${esc(m.name)} | ${m.spur === 'beide' ? 'A+B' : m.spur} | ${ROLLEN.map((x) => zelle(m, x)).join(' | ')} | ${m.anordnungspflichtig ? 'ja' : ''} | ${seiten(m)} | ${esc(hinweis)} |`);
    }
    L.push('');
  }

  L.push('## Verwendete Lehrplan-Stellen', '');
  L.push('| Seite | CE | Drittel | Abschnitt | Inhalt (Stichwort) | Art |', '|---|---|---|---|---|---|');
  for (const x of Object.values(LP).sort((a, b) => a.seite - b.seite)) {
    L.push(`| ${x.seite} | ${x.ce} | ${x.drittel} | ${x.abschnitt} | ${esc(x.stichwort)} | ${x.art === 'massnahme' ? 'Maßnahme' : 'Kompetenz'} |`);
  }
  L.push('', `Fundstellen-Format im Code: ${fundstelle(LP.medi12)}.`, '');
  return L.join('\n');
}
