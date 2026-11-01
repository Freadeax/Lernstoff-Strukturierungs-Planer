// Rückmeldung zur mündlichen Übung durch Claude. Nur mit API-Schlüssel und auf Knopfdruck.
// Datenschutz: Es verlassen nur der (erfundene) Übungsfall, die Impulse mit ihren Stichpunkten und
// die festgehaltenen Antworten das Gerät, keine Aufnahme und keine Lernstände.
// Die Rückmeldung ist ein Vorschlag für den Selbstcheck. Sie zählt wie dieser nicht im Lernplan.
import Anthropic from '@anthropic-ai/sdk';
import type { Impuls, MuendlicherFall } from './muendlich';

export interface KiImpuls {
  id: string;
  /** Indizes der Stichpunkte, die Claude in der Antwort erkennt. */
  erfuellt: number[];
  kommentar: string;
  /** Aussagen, die fachlich oder rechtlich zweifelhaft wirken: im Material nachprüfen. */
  bedenken: string[];
  /** Ein bis drei Sätze, wie die Antwort prüfungsreif klingen könnte. */
  beispiel: string;
}

export interface KiMuendlich {
  note: number;            // 1 (sehr gut) bis 6, nur für beantwortete Impulse
  impulse: KiImpuls[];
  staerken: string[];
  tipps: string[];
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['note', 'impulse', 'staerken', 'tipps'],
  properties: {
    note: { type: 'integer', description: 'Schulnote 1 bis 6 für die beantworteten Impulse' },
    impulse: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'erfuellt', 'kommentar', 'bedenken', 'beispiel'],
        properties: {
          id: { type: 'string' },
          erfuellt: { type: 'array', items: { type: 'integer' }, description: 'Nummern (ab 0) der Stichpunkte, die in der Antwort vorkommen' },
          kommentar: { type: 'string' },
          bedenken: { type: 'array', items: { type: 'string' } },
          beispiel: { type: 'string' },
        },
      },
    },
    staerken: { type: 'array', items: { type: 'string' } },
    tipps: { type: 'array', items: { type: 'string' } },
  },
} as const;

function systemPrompt(): string {
  return `Du bist Mitglied einer Prüfungskommission im mündlichen Teil der staatlichen Prüfung zur Pflegefachfrau bzw. zum Pflegefachmann (PflAPrV, Kompetenzbereiche III bis V) und gibst einer lernenden Person Rückmeldung zu einer Übung.
Regeln:
- Die Antworten wurden laut gesprochen und nur stichpunktartig oder per Diktat festgehalten. Bewerte Inhalt und Aufbau, nicht Rechtschreibung oder Satzbau.
- Ein Stichpunkt gilt als erfüllt, wenn die Antwort ihn sinngemäß enthält. Sei ehrlich, aber nicht kleinlich. Nicht beantwortete Impulse bekommen keine erfüllten Stichpunkte und keinen Kommentar.
- Erfinde keine Paragrafen, Studien oder Zahlen. Nennst du eine Rechtsgrundlage oder einen Expertenstandard, dann nur allgemein bekannte und ohne Detailbehauptungen.
- Wirkt eine Aussage der Antwort fachlich oder rechtlich zweifelhaft, gehört sie in "bedenken" mit kurzer Begründung. Formuliere vorsichtig („Prüfe …“), weil du das Unterrichtsmaterial nicht kennst.
- "beispiel" zeigt in ein bis drei Sätzen, wie ein prüfungsreifer Kern der Antwort klingen könnte, mit Bezug auf die Person im Fall. Übernimm gute Formulierungen der lernenden Person.
- Schreibe kurz, freundlich, konkret und auf Deutsch in der Du-Form. "staerken" und "tipps" höchstens je 3 Punkte.
- Note: 1 = alle Stichpunkte fallbezogen und begründet; 6 = Antworten gehen an den Impulsen vorbei.`;
}

export function anfrageText(fall: MuendlicherFall, impulse: Impuls[], antworten: Record<string, string>): string {
  const teile = impulse.map((imp) => {
    const antwort = (antworten[imp.id] ?? '').trim();
    return `<impuls id="${imp.id}" kompetenzbereich="${imp.kb}" operator="${imp.operator}">
Frage: ${imp.frage}
Stichpunkte:
${imp.stichpunkte.map((s, n) => `${n}: ${s}`).join('\n')}
<antwort>${antwort || '(nicht festgehalten)'}</antwort>
</impuls>`;
  });
  return `<fall titel="${fall.titel}">
${fall.text.join('\n')}
</fall>
${teile.join('\n')}
Gib deine Rückmeldung als JSON.`;
}

export async function bewerteMuendlich(opts: { apiKey: string; fall: MuendlicherFall; impulse: Impuls[]; antworten: Record<string, string>; model?: string }): Promise<KiMuendlich> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const response = await client.beta.messages.create({
    model: opts.model ?? 'claude-opus-5-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: systemPrompt(),
    messages: [{ role: 'user', content: anfrageText(opts.fall, opts.impulse, opts.antworten) }],
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === 'refusal') throw new Error('Die KI hat die Anfrage abgelehnt.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte noch einmal versuchen.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return leseMuendlich(text, opts.impulse, opts.antworten);
}

/**
 * Liest die JSON-Antwort robust ein: nur bekannte Impulse, nur gültige Stichpunkt-Nummern, und für
 * Impulse ohne festgehaltene Antwort nie erfüllte Stichpunkte. Exportiert für Tests.
 */
export function leseMuendlich(text: string, impulse: Impuls[], antworten: Record<string, string>): KiMuendlich {
  const start = text.indexOf('{');
  const ende = text.lastIndexOf('}');
  if (start < 0 || ende < start) throw new Error('Die Antwort der KI war nicht lesbar.');
  const roh = JSON.parse(text.slice(start, ende + 1)) as Record<string, unknown>;
  const liste = (x: unknown, max = 6) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && !!s.trim()).slice(0, max) : []);
  const rohImpulse = Array.isArray(roh.impulse) ? (roh.impulse as Array<Record<string, unknown>>) : [];
  const ergebnis: KiImpuls[] = impulse.map((imp) => {
    const k = rohImpulse.find((x) => x && x.id === imp.id);
    const beantwortet = !!(antworten[imp.id] ?? '').trim();
    const erfuellt = beantwortet && k && Array.isArray(k.erfuellt)
      ? [...new Set(k.erfuellt.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < imp.stichpunkte.length))].sort((a, b) => a - b)
      : [];
    return {
      id: imp.id, erfuellt,
      kommentar: beantwortet && typeof k?.kommentar === 'string' ? k.kommentar : '',
      bedenken: beantwortet ? liste(k?.bedenken, 4) : [],
      beispiel: typeof k?.beispiel === 'string' ? k.beispiel : '',
    };
  });
  return {
    note: Math.min(6, Math.max(1, Math.round(Number(roh.note) || 6))),
    impulse: ergebnis, staerken: liste(roh.staerken, 3), tipps: liste(roh.tipps, 3),
  };
}
