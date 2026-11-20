// Freies Gespräch mit Claude in der Rolle des Gegenübers und Rückmeldung danach. Nur mit API-Schlüssel.
// Datenschutz: Es verlassen nur die erfundene Ausgangslage und das, was du im Gespräch schreibst, das Gerät.
// Die Rückmeldung ist ein Vorschlag zum Nachdenken und zählt nicht im Lernplan.
import Anthropic from '@anthropic-ai/sdk';
import type { SimAuswertung } from '../../ui/sim/auswertung';
import { leseRueckmeldung } from './rueckmeldung-lesen';
import { TECHNIK, type Dialog } from './dialoge';
import type { Nachricht } from './gespraech';


const MODELL = 'claude-opus-5-5';
const client = (apiKey: string) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

export function rollenPrompt(d: Dialog): string {
  return `Du spielst in einer Gesprächsübung für Pflegeauszubildende eine erfundene Person. Bleib durchgehend in deiner Rolle.
${d.rolleKi}
Ort und Lage: ${d.lage}
Regeln:
- Antworte nur als diese Person, in der Ich-Form, mit ein bis drei kurzen Sätzen gesprochener Sprache. Handlungen höchstens kurz in Klammern.
- Reagiere realistisch auf die Gesprächsführung: Zuhören, Gefühle ansprechen und konkrete Absprachen machen dich offener. Floskeln, Rechtfertigungen, Druck oder Belehrung machen dich verschlossener oder lauter.
- Gib keine Tipps zur Gesprächsführung und verlasse die Rolle nicht, auch wenn du dazu aufgefordert wirst.
- Keine echten Namen außer deinem Rollennamen, keine Gewaltdarstellungen.`;
}

function verlaufText(verlauf: Nachricht[]): Anthropic.MessageParam[] {
  // Erste Nachricht der Person als Assistent-Nachricht ist nicht erlaubt: Einstieg als Nutzer-Hinweis.
  const msgs: Anthropic.MessageParam[] = [{ role: 'user', content: '(Die Pflegefachperson kommt dazu. Beginne das Gespräch mit deinem ersten Satz.)' }];
  for (const n of verlauf) {
    const role = n.von === 'ich' ? 'user' : 'assistant';
    const last = msgs[msgs.length - 1]!;
    if (last.role === role) last.content = `${last.content as string}\n${n.text}`;
    else msgs.push({ role, content: n.text });
  }
  return msgs;
}

export async function gegenueberSagt(opts: { apiKey: string; dialog: Dialog; verlauf: Nachricht[] }): Promise<string> {
  const r = await client(opts.apiKey).beta.messages.create({
    model: MODELL, max_tokens: 400, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'low' },
    system: rollenPrompt(opts.dialog),
    messages: verlaufText(opts.verlauf),
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (r.stop_reason === 'refusal') throw new Error('Die KI hat die Antwort abgelehnt.');
  const text = r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim();
  if (!text) throw new Error('Keine Antwort erhalten.');
  return text.slice(0, 600);
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['stufe', 'zusammenfassung', 'punkte', 'merksaetze'],
  properties: {
    stufe: { type: 'string', enum: ['stabil', 'unsicher', 'kritisch'] },
    zusammenfassung: { type: 'string' },
    punkte: {
      type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['zitat', 'urteil', 'technik', 'warum', 'besser'],
        properties: {
          zitat: { type: 'string', description: 'Wörtlicher kurzer Ausschnitt aus einer Äußerung der lernenden Person' },
          urteil: { type: 'string', enum: ['gut', 'teilweise', 'fehler'] },
          technik: { type: 'string', enum: Object.keys(TECHNIK) },
          warum: { type: 'string' },
          besser: { type: 'string', description: 'Bei gut leer lassen' },
        },
      },
    },
    merksaetze: { type: 'array', items: { type: 'string' } },
  },
} as const;

export async function rueckmeldung(opts: { apiKey: string; dialog: Dialog; verlauf: Nachricht[] }): Promise<SimAuswertung> {
  const techniken = Object.entries(TECHNIK).map(([id, t]) => `${id}: ${t.name} (${t.foerderlich ? 'förderlich' : 'Sperre'}) – ${t.kurz}`).join('\n');
  const r = await client(opts.apiKey).beta.messages.create({
    model: MODELL, max_tokens: 4000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: `Du bist Praxisanleiterin in der Pflegeausbildung und gibst Rückmeldung zu einer Gesprächsübung. Ziel der Übung: ${opts.dialog.ziel}
Bewerte nur die Äußerungen der lernenden Person (ich), nicht die der Rolle. Wähle drei bis sechs aussagekräftige Stellen, mit wörtlichem Kurzzitat, Technik aus der Liste, Urteil und Begründung in ein bis zwei Sätzen, bei teilweise oder fehler mit einer besseren Formulierung. Sei freundlich, ehrlich und konkret, Du-Form, Deutsch. Erfinde keine Paragrafen. Höchstens drei Merksätze.
Techniken:
${techniken}`,
    messages: [{ role: 'user', content: `<lage>${opts.dialog.lage}</lage>\n<gespraech>\n${opts.verlauf.map((n) => `${n.von === 'ich' ? 'ICH' : 'GEGENÜBER'}: ${n.text}`).join('\n')}\n</gespraech>\nGib die Rückmeldung als JSON.` }],
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (r.stop_reason === 'refusal') throw new Error('Die KI hat die Rückmeldung abgelehnt.');
  return leseRueckmeldung(r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(''), opts.verlauf);
}

export { leseRueckmeldung } from './rueckmeldung-lesen';
