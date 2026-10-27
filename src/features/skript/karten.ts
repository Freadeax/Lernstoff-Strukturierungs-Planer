// Karteikarten aus einem Skript-Abschnitt. Nur belegte Aussagen: Zeilen mit ⚠ bleiben draußen,
// jede Karte trägt die Belege ihrer Punkte mit, damit man auf der Rückseite nachschlagen kann.

import type { ID } from '../../core/types';
import type { Karte, KartenBeleg } from '../karteikarten/typen';
import { belegText, eindeutig, findeBelege } from './parser';
import type { Abschnitt, Skript, SkriptBeleg } from './typen';

const MAX_PUNKTE = 6;

/** documentId, unter der Skript-Belege in Karteikarten stehen (Titel löst die Kartenansicht auf). */
export const skriptDokId = (skriptId: ID) => `skript:${skriptId}`;

function ohneMarkdown(s: string): string {
  return s.replace(/\*\*|__|`/g, '').replace(/\s*\[([^\]\n]{1,80})\](?!\()/g, (ganz, inhalt: string) => (/^[A-ZÄÖÜ][\w/-]*(,|;|$)/.test(inhalt) ? '' : ganz)).replace(/\s+/g, ' ').trim();
}

interface Punkt { text: string; belege: SkriptBeleg[]; unterpunkt?: boolean; /** Zwischenüberschrift, unter der der Punkt steht. */ gruppe?: string }

/**
 * Aufzählungspunkte eines Abschnitts mit ihren Belegen. Ein Unterpunkt erbt die Belege seines
 * Oberpunkts und der nächsten Zwischenüberschrift (Belege stehen oft dort: „**S1 · Haltung** [D, S. 18]“).
 */
export function punkte(markdown: string, bekannte?: Set<string>, erbe: SkriptBeleg[] = []): Punkt[] {
  const out: Punkt[] = [];
  let kontext: SkriptBeleg[] = erbe;
  let oben: SkriptBeleg[] = [];
  let gruppe: string | undefined;
  for (const zeile of markdown.split('\n')) {
    if (/^\s*(?:###+\s|\*\*[^*]+\*\*\s*(?:\[[^\]]+\])?\s*:?\s*$)/.test(zeile)) {
      const b = findeBelege(zeile, bekannte);
      kontext = b.length ? b : erbe;
      gruppe = ohneMarkdown(zeile.replace(/^\s*#+\s*/, '')).replace(/:\s*$/, '') || undefined;
      continue;
    }
    const m = zeile.match(/^(\s*)[-*+]\s+(.+)$/);
    if (!m) continue;
    const roh = m[2]!;
    const eigene = findeBelege(roh, bekannte);
    const unter = m[1]!.length >= 2;
    if (!unter) oben = eigene;
    if (/⚠/.test(roh)) continue;
    const text = ohneMarkdown(roh);
    if (text.length < 3) continue;
    const belege = eigene.length ? eigene : unter && oben.length ? oben : kontext;
    out.push({ text, belege, ...(unter ? { unterpunkt: true } : {}), ...(gruppe ? { gruppe } : {}) });
  }
  return out;
}

const alsKartenBeleg = (skriptId: ID, b: SkriptBeleg): KartenBeleg => {
  const seite = Number(b.stelle?.match(/\d+/)?.[0] ?? 0);
  return { documentId: skriptDokId(skriptId), page: seite, printedPage: belegText(b), quote: '' };
};

/** Definitionen der Form „**Begriff**: Erklärung“ oder „**Begriff** = Erklärung“. */
export function definitionen(markdown: string, bekannte?: Set<string>): Array<{ begriff: string; text: string; belege: SkriptBeleg[] }> {
  const out: Array<{ begriff: string; text: string; belege: SkriptBeleg[] }> = [];
  for (const zeile of markdown.split('\n')) {
    if (/⚠/.test(zeile)) continue;
    const m = zeile.match(/^\s*(?:[-*+]\s+)?\*\*([^*]{2,60})\*\*\s*(?:\([^)]*\)\s*)?(?::|=)\s*(.{12,})$/);
    if (!m) continue;
    const begriff = m[1]!.replace(/[:=]\s*$/, '').trim();
    if (/^(Was|Wie|Warum|Ergebnis|Beispiel|Merke|Fall|Hinweis|Quelle|Quellen|Tipp)\b/i.test(begriff)) continue;
    out.push({ begriff, text: ohneMarkdown(m[2]!), belege: findeBelege(m[2]!, bekannte) });
  }
  return out;
}

/** Kartenvorschläge zu einem Abschnitt: Kernaussagen in Gruppen und Definitionskarten. */
export function kartenAusAbschnitt(skript: Skript, abschnitt: Abschnitt, subjectIds: ID[] = []): Karte[] {
  const bekannte = new Set(skript.quellen.map((q) => q.kuerzel));
  const kopf = findeBelege(abschnitt.titel, bekannte);
  const basis = { quelle: 'zusammenfassung' as const, topicIds: skript.topicIds, subjectIds, ref: `skript:${skript.id}` };
  const titel = `${skript.titel} › ${abschnitt.titel}`;
  const ps = punkte(abschnitt.markdown, bekannte, kopf).filter((p) => p.belege.length);
  const out: Karte[] = [];
  // Punkte unter derselben Zwischenüberschrift bilden eine Karte, sonst fehlt der Zusammenhang
  // („Sie wird vor der Maßnahmenplanung formuliert“ – wer ist „sie“?).
  const gruppen: Array<{ gruppe?: string; ps: Punkt[] }> = [];
  for (const p of ps) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.gruppe === p.gruppe) letzte.ps.push(p); else gruppen.push({ gruppe: p.gruppe, ps: [p] });
  }
  gruppen.forEach((g, gi) => {
    const teile = Math.ceil(g.ps.length / MAX_PUNKTE);
    const frage = g.gruppe ? `${titel} › ${g.gruppe}` : titel;
    for (let i = 0; i < teile; i++) {
      const stueck = g.ps.slice(i * MAX_PUNKTE, (i + 1) * MAX_PUNKTE);
      out.push({
        ...basis, id: `skr:${skript.id}:${abschnitt.id}:${gi + 1}${teile > 1 ? `.${i + 1}` : ''}`, art: 'Abschnitt → Kernaussagen',
        vorne: `${frage}${teile > 1 ? ` (Teil ${i + 1} von ${teile})` : ''}: Was gehört dazu?`, hinten: '',
        liste: stueck.map((p) => (p.unterpunkt ? `– ${p.text}` : p.text)),
        belege: eindeutig(stueck.flatMap((p) => p.belege)).map((b) => alsKartenBeleg(skript.id, b)),
      });
    }
  });
  definitionen(abschnitt.markdown, bekannte).forEach((d, i) => {
    const belege = d.belege.length ? d.belege : kopf;
    if (!belege.length) return;
    out.push({
      ...basis, id: `skd:${skript.id}:${abschnitt.id}:${i + 1}`, art: 'Definition', vorne: `Was ist ${d.begriff}?`, hinten: d.text,
      belege: eindeutig(belege).map((b) => alsKartenBeleg(skript.id, b)),
    });
  });
  return out;
}
