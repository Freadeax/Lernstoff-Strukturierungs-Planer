// Ausführliche Rückmeldung zum Pflegebericht durch Claude. Nur mit API-Schlüssel und auf Knopfdruck.
// Datenschutz: Es verlassen nur der (erfundene) Übungsfall und der eingegebene Text das Gerät.
import Anthropic from '@anthropic-ai/sdk';
import { BAUSTEIN_LABEL, BEREICH_LABEL, type BerichtFall } from './faelle';

export interface KiRueckmeldung {
  note: number;               // 1 (sehr gut) bis 6
  sachlich: string;           // Urteil zu Wertfreiheit und Genauigkeit
  staerken: string[];
  fehlt: string[];
  fehler: string[];           // Angaben, die nicht zur Situation passen
  umformulieren: { vorher: string; nachher: string }[];
  verbessert: string;
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['note', 'sachlich', 'staerken', 'fehlt', 'fehler', 'umformulieren', 'verbessert'],
  properties: {
    note: { type: 'integer', description: 'Schulnote 1 bis 6' },
    sachlich: { type: 'string' },
    staerken: { type: 'array', items: { type: 'string' } },
    fehlt: { type: 'array', items: { type: 'string' } },
    fehler: { type: 'array', items: { type: 'string' } },
    umformulieren: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['vorher', 'nachher'], properties: { vorher: { type: 'string' }, nachher: { type: 'string' } } },
    },
    verbessert: { type: 'string' },
  },
} as const;

function systemPrompt(): string {
  return `Du bist Praxisanleiterin in der generalistischen Pflegeausbildung (Deutschland) und gibst Rückmeldung zu einem Eintrag im Pflegebericht.
Ein guter Eintrag: Uhrzeit, beobachtbares Verhalten und Messwerte statt Bewertungen, Aussagen der Person wörtlich in Anführungszeichen, durchgeführte Maßnahme, Wirkung oder Reaktion, wer informiert wurde. Knapp, sachlich, ohne Wertung, ohne Vermutung als Tatsache, ohne ungenaue Wörter wie „gut“, „wenig“, „wie immer“.
Regeln:
- Bewerte nur anhand der Situation. Erfinde nichts dazu.
- Prüfe jede Angabe gegen die Situation. Abweichungen (falsche Zeit, falscher Wert, falsche Seite) gehören in "fehler".
- "umformulieren": höchstens 4 konkrete Stellen aus dem Text der lernenden Person mit sachlicher Alternative.
- "verbessert": der überarbeitete Eintrag. Behalte gute Formulierungen der lernenden Person.
- Schreibe kurz, freundlich und konkret auf Deutsch in der Du-Form. Je Liste höchstens 4 Punkte.
- Note: 1 = vollständig, sachlich, knapp; 6 = nicht verwertbar oder wertend.`;
}

export async function bewerteMitClaude(opts: { apiKey: string; fall: BerichtFall; text: string; model?: string }): Promise<KiRueckmeldung> {
  const { fall } = opts;
  const erwartet = fall.kernpunkte.map((k) => `- ${BAUSTEIN_LABEL[k.baustein]}: ${k.text}${k.pflicht ? '' : ' (optional)'}`).join('\n');
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const response = await client.beta.messages.create({
    model: opts.model ?? 'claude-opus-5-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: systemPrompt(),
    messages: [{
      role: 'user',
      content: `<situation>\nBereich: ${BEREICH_LABEL[fall.bereich]}\nPerson: ${fall.person}\n${fall.szene.join('\n')}\n</situation>\n<erwartete_punkte>\n${erwartet}\n</erwartete_punkte>\n<eintrag>\n${opts.text}\n</eintrag>\nGib deine Rückmeldung als JSON.`,
    }],
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === 'refusal') throw new Error('Die KI hat die Anfrage abgelehnt.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte noch einmal versuchen.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return leseRueckmeldung(text);
}

/** Liest die JSON-Antwort robust ein. Exportiert für Tests. */
export function leseRueckmeldung(text: string): KiRueckmeldung {
  const start = text.indexOf('{');
  const ende = text.lastIndexOf('}');
  if (start < 0 || ende < start) throw new Error('Die Antwort der KI war nicht lesbar.');
  const roh = JSON.parse(text.slice(start, ende + 1)) as Partial<KiRueckmeldung>;
  const liste = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
  const s = (x: unknown) => (typeof x === 'string' ? x : '');
  return {
    note: Math.min(6, Math.max(1, Math.round(Number(roh.note) || 6))),
    sachlich: s(roh.sachlich), staerken: liste(roh.staerken), fehlt: liste(roh.fehlt), fehler: liste(roh.fehler),
    umformulieren: Array.isArray(roh.umformulieren)
      ? roh.umformulieren.filter((u) => u && typeof u.vorher === 'string' && typeof u.nachher === 'string').map((u) => ({ vorher: u.vorher, nachher: u.nachher }))
      : [],
    verbessert: s(roh.verbessert),
  };
}
