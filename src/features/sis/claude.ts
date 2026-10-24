// Ausführliche Rückmeldung zur SIS durch Claude. Nur mit API-Schlüssel und auf Knopfdruck.
// Datenschutz: Es verlassen nur der (erfundene) Übungsfall und die eingegebene SIS das Gerät.
import Anthropic from '@anthropic-ai/sdk';
import { FELDER, feldLabel, RISIKO_LABEL, SETTING_LABEL, type Feld, type SisFall } from './faelle';
import type { Felder, Matrix } from './pruefung';

export type KiBewertung = 'vollstaendig' | 'teilweise' | 'fehlt';
export interface KiFeld { feld: Feld; bewertung: KiBewertung; kommentar: string }
export interface KiRueckmeldung {
  note: number;               // 1 (sehr gut) bis 6
  felder: KiFeld[];
  perspektive: string;        // Sicht der Person und Verständigung
  matrix: string;             // Kommentar zur Risikomatrix
  staerken: string[];
  fehlt: string[];
  fehler: string[];           // Angaben, die nicht zum Fall passen
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['note', 'felder', 'perspektive', 'matrix', 'staerken', 'fehlt', 'fehler'],
  properties: {
    note: { type: 'integer', description: 'Schulnote 1 bis 6' },
    felder: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['feld', 'bewertung', 'kommentar'],
        properties: {
          feld: { type: 'string', enum: FELDER },
          bewertung: { type: 'string', enum: ['vollstaendig', 'teilweise', 'fehlt'] },
          kommentar: { type: 'string' },
        },
      },
    },
    perspektive: { type: 'string' },
    matrix: { type: 'string' },
    staerken: { type: 'array', items: { type: 'string' } },
    fehlt: { type: 'array', items: { type: 'string' } },
    fehler: { type: 'array', items: { type: 'string' } },
  },
} as const;

function systemPrompt(): string {
  return `Du bist Praxisanleiterin in der generalistischen Pflegeausbildung (Deutschland) und gibst Rückmeldung zu einer Strukturierten Informationssammlung (SIS) nach dem Strukturmodell.
Regeln:
- Bewerte nur anhand der Falldaten. Erfinde keine Befunde dazu.
- Feld B gibt die Sicht der Person wieder, möglichst wörtlich, ohne Fachsprache und ohne Bewertung. Aussagen von Angehörigen müssen gekennzeichnet sein.
- Die Themenfelder enthalten die Sicht der Person, die fachliche Einschätzung der Pflegefachperson und die Verständigung (was vereinbart wurde, was die Person wünscht oder ablehnt). Ressourcen gehören dazu, nicht nur Defizite.
- Die Risikomatrix: Ist die Einschätzung je Risiko (Dekubitus, Sturz, Inkontinenz, Schmerz, Ernährung, Sonstiges) fachlich begründet und passt sie zu den Themenfeldern? Wird eine weitere Einschätzung (z. B. Assessment) richtig angestoßen?
- Prüfe Angaben gegen die Falldaten. Abweichungen (falsche Seite, falscher Wert, nicht genannte Diagnose) gehören in "fehler". Wertende Formulierungen benennen.
- Keine Maßnahmenplanung verlangen: Die SIS ist die Grundlage dafür.
- Schreibe kurz, freundlich, konkret und auf Deutsch in der Du-Form. Je Liste höchstens 4 Punkte, je Kommentar höchstens 2 Sätze.
- Note: 1 = vollständig, fachlich richtig, personzentriert; 6 = nicht verwertbar.`;
}

function fallText(fall: SisFall): string {
  return `<fall>
Setting: ${SETTING_LABEL[fall.setting]}
Anlass: ${fall.anlass}
${fall.person.map((d) => `${d.label}: ${d.wert}`).join('\n')}
Erstgespräch:
${fall.gespraech.map((a) => `- ${a.wer}: „${a.text}“`).join('\n')}
Beobachtungen:
${fall.beobachtungen.map((b) => `- ${b}`).join('\n')}
${fall.unterlagen.map((d) => `${d.label}: ${d.wert}`).join('\n')}
</fall>
<musterloesung_matrix>
${fall.matrix.map((z) => `- ${RISIKO_LABEL[z.risiko]}: ${z.vorhanden}, weitere Einschätzung ${z.weitere}. ${z.begruendung}`).join('\n')}
</musterloesung_matrix>`;
}

function sisText(fall: SisFall, felder: Felder, matrix: Matrix): string {
  const f = FELDER.map((k) => `${k === 'B' ? 'Feld B' : `Themenfeld ${k.slice(2)}`} (${feldLabel(k, fall.setting)}):\n${felder[k].trim() || '(leer)'}`).join('\n\n');
  const m = fall.matrix.map((z) => {
    const e = matrix[z.risiko];
    const tf = e.themenfelder.length ? `, Themenfeld ${e.themenfelder.map((t) => t.slice(2)).join(', ')}` : '';
    const was = z.risiko === 'sonstiges' && e.welches.trim() ? ` (${e.welches.trim()})` : '';
    return `- ${RISIKO_LABEL[z.risiko]}${was}: ${e.vorhanden ?? 'offen'}, weitere Einschätzung ${e.weitere ?? 'offen'}${tf}`;
  }).join('\n');
  return `<sis>\n${f}\n\nRisikomatrix:\n${m}\n</sis>`;
}

export async function bewerteMitClaude(opts: { apiKey: string; fall: SisFall; felder: Felder; matrix: Matrix; model?: string }): Promise<KiRueckmeldung> {
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
      content: `${fallText(opts.fall)}\n${sisText(opts.fall, opts.felder, opts.matrix)}\nGib deine Rückmeldung als JSON.`,
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
  const felder = FELDER.map((f) => {
    const k = Array.isArray(roh.felder) ? roh.felder.find((x) => x?.feld === f) : undefined;
    const bewertung: KiBewertung = k && ['vollstaendig', 'teilweise', 'fehlt'].includes(k.bewertung) ? k.bewertung : 'fehlt';
    return { feld: f, bewertung, kommentar: typeof k?.kommentar === 'string' ? k.kommentar : '' };
  });
  const s = (x: unknown) => (typeof x === 'string' ? x : '');
  return { note, felder, perspektive: s(roh.perspektive), matrix: s(roh.matrix), staerken: liste(roh.staerken), fehlt: liste(roh.fehlt), fehler: liste(roh.fehler) };
}
