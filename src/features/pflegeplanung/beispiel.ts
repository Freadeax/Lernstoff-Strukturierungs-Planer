// Beispiel-Planung eines Falls als echter Plan: dieselbe Struktur, die Lernende im Trainer ausfüllen.
// Das Beispiel steht in faelle.ts als Text, Zeile für Zeile:
//   P: / E: / S: / R:          ein Pflegeproblem (Risikodiagnose ohne S)
//   Ziel: … Überprüfung: …     Ziel zum letzten Problem, Text nach „Überprüfung:“ wird zum Termin
//   Maßnahme: / Wann: / Wer: / Begründung:   Maßnahme zum letzten Ziel
// Weil daraus ein Plan wird, prüft beispiel.test.ts jede Beispiel-Planung mit derselben Checkliste
// wie die Planung der Lernenden. Das Beispiel ist damit eine geprüfte Musterlösung.
import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';
import type { ErwartetesProblem, PlanFall } from './faelle';
import type { Massnahme, Plan, Problem, Ziel } from './plan';

const RISIKO = /(gefahr|risiko|gefaehrd)/;
const ZEILE = /^(P|E|S|R|Ziel|Maßnahme|Wann|Wer|Begründung):\s*(.*)$/;

export function beispielAlsPlan(text: string): Plan {
  const probleme: Problem[] = [];
  const ziele: Ziel[] = [];
  const massnahmen: Massnahme[] = [];
  for (const roh of text.split('\n')) {
    const m = ZEILE.exec(roh.trim());
    if (!m) continue;
    const [, feld, wert = ''] = m;
    const problem = probleme[probleme.length - 1];
    const ziel = ziele[ziele.length - 1];
    const mass = massnahmen[massnahmen.length - 1];
    switch (feld) {
      case 'P':
        probleme.push({ id: `p${probleme.length + 1}`, art: RISIKO.test(vereinfache(wert)) ? 'risiko' : 'aktuell', p: wert, e: '', s: '', r: '' });
        break;
      case 'E': case 'S': case 'R':
        if (problem) problem[feld.toLowerCase() as 'e' | 's' | 'r'] = wert;
        break;
      case 'Ziel': {
        if (!problem) break;
        const [zieltext = '', termin = ''] = wert.split(/\s*Überprüfung:\s*/);
        ziele.push({ id: `z${ziele.length + 1}`, problemId: problem.id, text: zieltext.trim(), termin: termin.trim().replace(/\.$/, '') });
        break;
      }
      case 'Maßnahme':
        if (ziel) massnahmen.push({ id: `m${massnahmen.length + 1}`, zielId: ziel.id, was: wert, wie: wert, wann: '', wer: '', begruendung: '' });
        break;
      case 'Wann': if (mass) mass.wann = wert; break;
      case 'Wer': if (mass) mass.wer = wert; break;
      case 'Begründung': if (mass) mass.begruendung = wert; break;
    }
  }
  return { subjektiv: '', objektiv: '', probleme, ziele, massnahmen, bericht: '', evaluation: {} };
}

export interface BeispielVergleich {
  problem: Problem;
  ziele: Ziel[];
  massnahmen: Massnahme[];
  /** Erwartetes Problem des Falls, zu dem das Beispiel-Problem gehört. */
  erwartung?: ErwartetesProblem;
  /** Steht dasselbe Problem (gleiche Stichwörter) auch in der eigenen Planung? */
  auchBeiDir: boolean;
}

/** Beispiel-Planung Problem für Problem neben die eigene Planung legen. */
export function vergleicheMitBeispiel(fall: PlanFall, eigen: Plan): BeispielVergleich[] {
  const bsp = beispielAlsPlan(fall.beispiel);
  const eigeneP = eigen.probleme.map((p) => suchtext(vereinfache(p.p)));
  return bsp.probleme.map((problem) => {
    const t = suchtext(vereinfache(problem.p));
    const erwartung = fall.probleme.find((e) => findeMuster(t, e.muster) >= 0);
    const ziele = bsp.ziele.filter((z) => z.problemId === problem.id);
    const zielIds = new Set(ziele.map((z) => z.id));
    return {
      problem, ziele, massnahmen: bsp.massnahmen.filter((m) => zielIds.has(m.zielId)),
      ...(erwartung ? { erwartung } : {}),
      auchBeiDir: !!erwartung && eigeneP.some((x) => findeMuster(x, erwartung.muster) >= 0),
    };
  });
}
