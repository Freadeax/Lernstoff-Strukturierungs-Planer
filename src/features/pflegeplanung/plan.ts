// Datenmodell einer Pflegeplanung, wie sie im Trainer ausgefüllt wird.
// Schritte und Pflichtteile entsprechen dem Aufgabenformat format.pflegeplanung im Pflege-Katalog.
import type { ProblemArt } from './faelle';

export const SCHRITTE = ['info', 'probleme', 'ziele', 'massnahmen', 'durchfuehrung', 'evaluation'] as const;
export type Schritt = typeof SCHRITTE[number];

export const SCHRITT_LABEL: Record<Schritt, string> = {
  info: 'Informationen sammeln',
  probleme: 'Probleme und Ressourcen',
  ziele: 'Ziele festlegen',
  massnahmen: 'Maßnahmen planen',
  durchfuehrung: 'Durchführen',
  evaluation: 'Evaluieren',
};

export const SCHRITT_KURZ: Record<Schritt, string> = {
  info: 'Info', probleme: 'PESR', ziele: 'Ziele', massnahmen: 'Maßnahmen', durchfuehrung: 'Bericht', evaluation: 'Evaluation',
};

export const SCHRITT_HILFE: Record<Schritt, string> = {
  info: 'Was sagt die Person selbst (subjektiv), was beobachtest oder misst du (objektiv)? Nur Fakten, noch keine Deutung.',
  probleme: 'Je Pflegeproblem: P (Problem), E (Einflussfaktoren, „beeinflusst durch …“), S (Symptome, „angezeigt durch …“), R (Ressourcen). Risikodiagnosen („Gefahr von …“) haben keine Symptome.',
  ziele: 'Je Problem mindestens ein Ziel aus Sicht der Person: spezifisch, messbar, akzeptiert, realistisch, terminiert (SMART).',
  massnahmen: 'Je Ziel mindestens eine Maßnahme: was, wie, wann bzw. wie oft, wer, und warum (Begründung, Expertenstandard).',
  durchfuehrung: 'Freiwillig: ein kurzer Pflegebericht zur ersten Durchführung. Sachlich beschreiben, nicht werten.',
  evaluation: 'Lies den Verlauf. Wurde jedes Ziel erreicht? Woran erkennst du das, und was passt du an?',
};

/** Pflichtschritte nach format.pflegeplanung (Durchführung ist freiwillig). */
export const PFLICHT: Schritt[] = ['info', 'probleme', 'ziele', 'massnahmen', 'evaluation'];

export interface Problem { id: string; art: ProblemArt; p: string; e: string; s: string; r: string }
export interface Ziel { id: string; problemId: string; text: string; termin: string }
export interface Massnahme { id: string; zielId: string; was: string; wie: string; wann: string; wer: string; begruendung: string }
export type Erreicht = '' | 'ja' | 'teilweise' | 'nein';
export interface Evaluation { erreicht: Erreicht; begruendung: string; anpassung: string }

export interface Plan {
  subjektiv: string;
  objektiv: string;
  probleme: Problem[];
  ziele: Ziel[];
  massnahmen: Massnahme[];
  bericht: string;
  evaluation: Record<string, Evaluation>; // nach Ziel-ID
}

export const ERREICHT_LABEL: Record<Exclude<Erreicht, ''>, string> = { ja: 'erreicht', teilweise: 'teilweise', nein: 'nicht erreicht' };

export const neueId = () => Math.random().toString(36).slice(2, 10);

export function leererPlan(): Plan {
  return { subjektiv: '', objektiv: '', probleme: [neuesProblem()], ziele: [], massnahmen: [], bericht: '', evaluation: {} };
}

export function neuesProblem(art: ProblemArt = 'aktuell'): Problem {
  return { id: neueId(), art, p: '', e: '', s: '', r: '' };
}
export function neuesZiel(problemId: string): Ziel {
  return { id: neueId(), problemId, text: '', termin: '' };
}
export function neueMassnahme(zielId: string): Massnahme {
  return { id: neueId(), zielId, was: '', wie: '', wann: '', wer: '', begruendung: '' };
}

/** Problem entfernen, samt zugehöriger Ziele, Maßnahmen und Evaluationen. */
export function ohneProblem(plan: Plan, id: string): Plan {
  const zielIds = new Set(plan.ziele.filter((z) => z.problemId === id).map((z) => z.id));
  return {
    ...plan,
    probleme: plan.probleme.filter((p) => p.id !== id),
    ziele: plan.ziele.filter((z) => !zielIds.has(z.id)),
    massnahmen: plan.massnahmen.filter((m) => !zielIds.has(m.zielId)),
    evaluation: Object.fromEntries(Object.entries(plan.evaluation).filter(([k]) => !zielIds.has(k))),
  };
}

export function ohneZiel(plan: Plan, id: string): Plan {
  const { [id]: _, ...evaluation } = plan.evaluation;
  return { ...plan, ziele: plan.ziele.filter((z) => z.id !== id), massnahmen: plan.massnahmen.filter((m) => m.zielId !== id), evaluation };
}

/** Kurzname eines Problems für Auswahllisten. */
export function problemName(p: Problem, i: number): string {
  return p.p.trim() ? p.p.trim() : `Problem ${i + 1}`;
}

/** Ob in einem Schritt schon etwas steht (für die Schrittanzeige). */
export function hatInhalt(plan: Plan, s: Schritt): boolean {
  switch (s) {
    case 'info': return !!(plan.subjektiv.trim() || plan.objektiv.trim());
    case 'probleme': return plan.probleme.some((p) => p.p.trim());
    case 'ziele': return plan.ziele.some((z) => z.text.trim());
    case 'massnahmen': return plan.massnahmen.some((m) => m.was.trim());
    case 'durchfuehrung': return !!plan.bericht.trim();
    case 'evaluation': return Object.values(plan.evaluation).some((e) => e.erreicht || e.begruendung.trim());
  }
}

/** Plan als lesbarer Text (für Claude und zum Kopieren). */
export function planAlsText(plan: Plan): string {
  const zeilen: string[] = ['## Informationssammlung', `Subjektiv: ${plan.subjektiv.trim() || '–'}`, `Objektiv: ${plan.objektiv.trim() || '–'}`, ''];
  plan.probleme.forEach((p, i) => {
    zeilen.push(`## Problem ${i + 1} (${p.art === 'risiko' ? 'Risikodiagnose' : 'aktuelles Problem'})`,
      `P: ${p.p.trim() || '–'}`, `E: ${p.e.trim() || '–'}`, `S: ${p.s.trim() || '–'}`, `R: ${p.r.trim() || '–'}`);
    plan.ziele.filter((z) => z.problemId === p.id).forEach((z, j) => {
      zeilen.push(`### Ziel ${i + 1}.${j + 1}: ${z.text.trim() || '–'}${z.termin.trim() ? ` (Überprüfung: ${z.termin.trim()})` : ''}`);
      plan.massnahmen.filter((m) => m.zielId === z.id).forEach((m) => {
        zeilen.push(`- Maßnahme: ${m.was.trim() || '–'} | wie: ${m.wie.trim() || '–'} | wann: ${m.wann.trim() || '–'} | wer: ${m.wer.trim() || '–'} | Begründung: ${m.begruendung.trim() || '–'}`);
      });
      const e = plan.evaluation[z.id];
      if (e && (e.erreicht || e.begruendung.trim())) {
        zeilen.push(`- Evaluation: ${e.erreicht ? ERREICHT_LABEL[e.erreicht] : 'offen'}; ${e.begruendung.trim() || '–'}${e.anpassung.trim() ? `; Anpassung: ${e.anpassung.trim()}` : ''}`);
      }
    });
    zeilen.push('');
  });
  const ohneProblem = plan.ziele.filter((z) => !plan.probleme.some((p) => p.id === z.problemId));
  ohneProblem.forEach((z) => zeilen.push(`### Ziel ohne Problem: ${z.text}`));
  if (plan.bericht.trim()) zeilen.push('## Pflegebericht (Durchführung)', plan.bericht.trim());
  return zeilen.join('\n').trim();
}
