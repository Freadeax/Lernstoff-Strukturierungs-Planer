// KI-Tutor nach dem Fall (P5, optional). Nur mit API-Schlüssel und auf Knopfdruck.
// Kontext = Fall (fiktiv), eigener Weg (Event-Log als Protokoll), Musterweg, Auswertung, Leitfaden mit Quellen.
// Datenschutz: Es geht nur dieser Übungsfall mit deinem Spielverlauf an Claude, kein Lernstand, keine Namen echter Personen.

import { entschaerfe, rufe, textAus } from '../../zusammenfasser/ki';
import { musterweg, protokoll, type KernAuswertung } from '../kern/auswertung';
import type { SimZustand } from '../kern/kern';

export interface TutorNachricht { rolle: 'du' | 'tutor'; text: string }

export const TUTOR_SYSTEM = `Du bist eine erfahrene Praxisanleiterin in der generalistischen Pflegeausbildung (PflBG, PflAPrV) und besprichst mit einer lernenden Person einen gerade gespielten Simulationsfall.
Regeln:
- Stütze dich nur auf den Fall, das Protokoll, den Musterweg, die Auswertung und den Leitfaden im Block <fall>. Erfinde keine Befunde, Werte, Studien oder Paragrafen. Fehlt etwas, sag das.
- Die Werte stammen aus einem vereinfachten Lernmodell. Der Fall ist fiktiv und fachlich nicht immer geprüft: Weise darauf hin, wenn eine Frage über das Modell hinausgeht, und verweise auf die genannten Quellen.
- Ärztliche Aufgaben bleiben ärztlich. Erkläre Befugnisgrenzen, Durchführungsverantwortung und Remonstration, wo es passt.
- Gib keine Lösung vor, bevor du nach der eigenen Überlegung gefragt hast, außer die Person bittet ausdrücklich darum.
- Antworte kurz (höchstens 8 Sätze), freundlich, konkret, auf Deutsch in der Du-Form, ohne Markdown-Überschriften.`;

/** Kontext für den Tutor (rein, testbar). */
export function tutorKontext(z: SimZustand, a: KernAuswertung): string {
  const f = z.fall;
  const quelle = (id: string) => f.quellen.find((q) => q.id === id)?.titel ?? id;
  const zeilen = [
    `Titel: ${f.titel} (Spur ${f.spur}, ${f.setting}, Rolle ${typeof z.rolle === 'number' ? `${z.rolle}. Ausbildungsdrittel` : 'Pflegefachperson'}, Stufe ${z.stufe})`,
    `Person: ${f.person.name}, ${f.person.alter.jahre ?? `${f.person.alter.monate} Monate`}; bekannt: ${f.person.diagnosenBekannt.join(', ')}; Medikamente: ${f.person.medikamentePlan.join(', ')}; Allergien: ${f.person.allergien.join(', ')}`,
    `Übernahme: ${f.uebernahme}`,
    `Lernziele: ${f.lernziele.join(' | ')}`,
    '',
    'Protokoll der lernenden Person (mm:ss seit Fallbeginn):',
    ...protokoll(z),
    z.ende ? `Ende: ${z.ende.text}` : '',
    '',
    'Musterweg:',
    ...musterweg(f).map((s, i) => `${i + 1}. ${s}`),
    '',
    `Auswertung: ${a.gesamt} % insgesamt; ${a.kb.map((b) => `KB ${b.id} ${b.prozent ?? '–'} %`).join(', ')}${a.klinisch.length ? `; ${a.klinisch.map((b) => `${b.name} ${b.prozent ?? '–'} %`).join(', ')}` : ''}`,
    ...a.beitraege.filter((b) => b.urteil === 'fehler' || b.urteil === 'teilweise').map((b) => `- ${b.urteil}: ${b.text}${b.deine ? ` (${b.deine})` : ''}. Warum: ${b.warum}`),
    '',
    'Leitfaden:',
    ...f.leitfaden.map((l) => `${l.titel}: ${l.text}${l.quellen?.length ? ` [Quellen: ${l.quellen.map(quelle).join('; ')}]` : ''}`),
  ];
  return entschaerfe(zeilen.filter((x, i, l) => x !== '' || l[i - 1] !== '').join('\n'));
}

export async function frageTutor(apiKey: string, kontext: string, verlauf: readonly TutorNachricht[], frage: string): Promise<string> {
  const messages = [
    ...verlauf.map((n, i) => ({ role: n.rolle === 'du' ? 'user' as const : 'assistant' as const, content: i === 0 && n.rolle === 'du' ? `<fall>\n${kontext}\n</fall>\n\n${n.text}` : n.text })),
    { role: 'user' as const, content: verlauf.length ? frage : `<fall>\n${kontext}\n</fall>\n\n${frage}` },
  ];
  const r = await rufe(apiKey, { system: TUTOR_SYSTEM, messages, effort: 'medium', maxTokens: 2000, schritt: 'praxis-tutor' });
  return textAus(r).trim();
}
