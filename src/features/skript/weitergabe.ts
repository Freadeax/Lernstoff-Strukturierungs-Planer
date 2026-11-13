// Skripte an Mitschülerinnen und Mitschüler weitergeben, ohne dabei Buch- oder Unterrichtsinhalte zu verteilen.
//
// Grundsatz: Weitergeben geht nur, wenn klar ist, dass man es darf. Skripte aus dem privaten Material-Repo
// und wörtliche Kopien eigener Dokumente bleiben immer privat. Verweist ein Skript auf einen Fachverlag,
// ist es ebenfalls gesperrt, auch wenn im Kopf `weitergabe: erlaubt` steht. Alles andere geht nach
// einer ausdrücklichen Bestätigung („selbst geschrieben, darf ich weitergeben“).

import type { Skript } from './typen';

/** Verlage und lizenzierte Werke, deren Inhalte nie weitergegeben werden. */
const VERLAGE = /\b(thieme|elsevier|urban\s*&\s*fischer|springer|kohlhammer|hogrefe|verlag\s+hans\s+huber|cornelsen|europa[-\s]lehrmittel|westermann|schl[üu]tersche|recom|enp[-\s]?praxisleitlinien?|i[-\s]?care|pflege\s*heute|arzneimittellehre\s+f[üu]r\s+die\s+pflege)\b/i;

export type WeitergabeStatus =
  | { darf: true; bestaetigt: boolean }
  | { darf: false; grund: string };

/** Fundstelle eines Verlagsnamens in Titel, Quellen oder Einleitung (für die Begründung). */
export function verlagErwaehnt(s: Pick<Skript, 'titel' | 'quellen' | 'einleitung' | 'gruppe'>): string | undefined {
  for (const t of [s.titel, s.gruppe, s.einleitung, ...s.quellen.map((q) => q.text)]) {
    const m = t?.match(VERLAGE);
    if (m) return m[0];
  }
  return undefined;
}

/** Ob und warum ein Skript weitergegeben werden darf. */
export function weitergabe(s: Skript): WeitergabeStatus {
  if (s.herkunft === 'repo') return { darf: false, grund: 'Es kommt aus deinem privaten Material-Repo. Diese Skripte stützen sich auf Unterrichtsmaterial und Bücher und bleiben bei dir.' };
  if (s.herkunft === 'dokument') return { darf: false, grund: 'Es ist eine wörtliche Kopie eines Dokuments. Gib das Original nur weiter, wenn du es darfst, und lass die Person es selbst als Skript übernehmen.' };
  if (s.weitergabe === 'nein') return { darf: false, grund: 'Im Kopf des Skripts steht „weitergabe: nein“.' };
  const verlag = verlagErwaehnt(s);
  if (verlag) return { darf: false, grund: `Es verweist auf „${verlag}“. Inhalte aus Fachbüchern und lizenzierten Werken dürfen nicht weitergegeben werden.` };
  return { darf: true, bestaetigt: s.weitergabe === 'erlaubt' };
}

/** Skript wieder als Markdown im Skript-Format (für die Weitergabe). Abbildungen fallen weg, sie liegen nur privat. */
export function alsMarkdown(s: Skript): string {
  const ohneBilder = (t: string) => t.replace(/!\[[^\]\n]*\]\([^)\n]*\)\s*/g, '');
  const kopf = [
    '---',
    ...(s.topicIds.length ? [`themen: [${s.topicIds.join(', ')}]`] : []),
    `gruppe: ${s.gruppe}`,
    'weitergabe: erlaubt',
    '---',
  ];
  const zeilen = [...kopf, `# ${s.titel}`, ''];
  if (s.einleitung.trim()) zeilen.push(ohneBilder(s.einleitung).trim(), '');
  if (s.quellen.length) zeilen.push('**Quellen**', ...s.quellen.map((q) => `- **[${q.kuerzel}]** ${q.text}`), '');
  for (const a of s.abschnitte) {
    const kopfBeleg = a.kopfBelege?.length ? ` [${a.kopfBelege.map((b) => (b.stelle ? `${b.kuerzel}, ${b.stelle}` : b.kuerzel)).join('; ')}]` : '';
    zeilen.push(`## ${a.nummer ? `${a.nummer} · ` : ''}${a.titel}${kopfBeleg}`, '', ohneBilder(a.markdown).trim(), '');
  }
  return `${zeilen.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
