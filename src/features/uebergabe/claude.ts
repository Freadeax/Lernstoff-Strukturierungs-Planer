// Ausführliche Rückmeldung zur Übergabe durch Claude. Nur mit API-Schlüssel und auf Knopfdruck.
// Datenschutz: Es verlassen nur der (erfundene) Übungsfall und der eingegebene Text das Gerät.
import Anthropic from '@anthropic-ai/sdk';
import { allgemeinePunkte, ANLASS_LABEL, TEIL_LABEL, type Fall, type Teil } from './faelle';

export interface KiTeil { teil: Teil; bewertung: 'vollstaendig' | 'teilweise' | 'fehlt'; kommentar: string }
export interface KiRueckmeldung {
  note: number;               // 1 (sehr gut) bis 6
  teile: KiTeil[];
  staerken: string[];
  fehlt: string[];
  fehler: string[];           // falsche oder abweichende Angaben gegenüber den Falldaten
  verbessert: string;         // überarbeitete Übergabe in SBAR-Form
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['note', 'teile', 'staerken', 'fehlt', 'fehler', 'verbessert'],
  properties: {
    note: { type: 'integer', description: 'Schulnote 1 bis 6' },
    teile: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['teil', 'bewertung', 'kommentar'],
        properties: {
          teil: { type: 'string', enum: ['S', 'B', 'A', 'R'] },
          bewertung: { type: 'string', enum: ['vollstaendig', 'teilweise', 'fehlt'] },
          kommentar: { type: 'string' },
        },
      },
    },
    staerken: { type: 'array', items: { type: 'string' } },
    fehlt: { type: 'array', items: { type: 'string' } },
    fehler: { type: 'array', items: { type: 'string' } },
    verbessert: { type: 'string' },
  },
} as const;

function systemPrompt(): string {
  return `Du bist Praxisanleiterin in der generalistischen Pflegeausbildung (Deutschland) und gibst Rückmeldung zu einer Übergabe nach dem SBAR-Schema (Situation, Hintergrund, Einschätzung, Empfehlung).
Regeln:
- Bewerte nur anhand der Falldaten. Erfinde keine Werte oder Befunde dazu.
- Prüfe jede Zahl und Angabe der Übergabe gegen die Falldaten. Abweichungen (falscher Wert, falsche Seite, falscher Name) gehören in "fehler".
- Achte auf: Vorstellung und Patientenidentifikation, klares akutes Problem, relevante statt vollständige Vorgeschichte, eigene Einschätzung, konkrete Bitte mit Zeitrahmen, Absprache zurückspiegeln, Kürze passend zum Anlass.
- Schreibe kurz, freundlich, konkret und auf Deutsch, in der Du-Form. Je Liste höchstens 4 Punkte.
- "verbessert" ist die überarbeitete Übergabe mit den Zeilen "S: …", "B: …", "A: …", "R: …". Behalte die Formulierungen der lernenden Person, wo sie gut sind.
- Note: 1 = alle wichtigen Punkte, korrekt und knapp; 6 = Übergabe nicht verwertbar.`;
}

function fallText(fall: Fall): string {
  const erwartet = [...allgemeinePunkte(fall.anlass), ...fall.kernpunkte]
    .map((k) => `- ${k.teil} (${TEIL_LABEL[k.teil]}): ${k.text}${k.pflicht ? '' : ' (optional)'}`).join('\n');
  return `<fall>
Anlass: ${ANLASS_LABEL[fall.anlass]}
Empfänger: ${fall.empfaenger}
Rolle der lernenden Person: ${fall.rolle}
Lage: ${fall.lage}
${fall.daten.map((d) => `${d.label}: ${d.wert}`).join('\n')}
</fall>
<erwartete_punkte>
${erwartet}
</erwartete_punkte>`;
}

export async function bewerteMitClaude(opts: { apiKey: string; fall: Fall; uebergabe: string; model?: string }): Promise<KiRueckmeldung> {
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
      content: `${fallText(opts.fall)}\n<uebergabe>\n${opts.uebergabe}\n</uebergabe>\nGib deine Rückmeldung als JSON.`,
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
  const note = Math.min(6, Math.max(1, Math.round(Number(roh.note) || 6)));
  const teile = (['S', 'B', 'A', 'R'] as Teil[]).map((t) => {
    const k = Array.isArray(roh.teile) ? roh.teile.find((x) => x?.teil === t) : undefined;
    const bewertung = k && ['vollstaendig', 'teilweise', 'fehlt'].includes(k.bewertung) ? k.bewertung : 'fehlt';
    return { teil: t, bewertung, kommentar: typeof k?.kommentar === 'string' ? k.kommentar : '' };
  });
  return {
    note, teile, staerken: liste(roh.staerken), fehlt: liste(roh.fehlt), fehler: liste(roh.fehler),
    verbessert: typeof roh.verbessert === 'string' ? roh.verbessert : '',
  };
}
