// Ausführliche Rückmeldung zur Pflegeplanung durch Claude. Nur mit API-Schlüssel und auf Knopfdruck.
// Datenschutz: Es verlassen nur der Übungsfall (erfunden oder selbst eingegeben) und die Planung das Gerät.
// Die Regeln, die Code nicht prüfen kann (method: llm/abgleich), kommen aus dem Pflege-Katalog.
import Anthropic from '@anthropic-ai/sdk';
import type { CatalogCheckRule, CatalogModule } from '../../modules/catalog-types';
import type { PlanFall } from './faelle';
import { planAlsText, SCHRITTE, type Plan, type Schritt } from './plan';

export interface KiSchritt { schritt: Schritt; prozent: number; kommentar: string }
export interface KiRegel { regelId: string; erfuellt: boolean; kommentar: string }
export interface KiRueckmeldung {
  note: number;               // 1 (sehr gut) bis 6
  prozent: number;            // 0–100
  schritte: KiSchritt[];
  regeln: KiRegel[];
  staerken: string[];
  verbessern: string[];
  fachfehler: string[];       // fachlich falsch oder passt nicht zum Fall
  beispiel: string;           // ein überarbeiteter Ausschnitt (Problem, Ziel, Maßnahme)
}

const FORMATE = ['format.pflegeplanung', 'format.pesr', 'format.smart', 'format.massnahme', 'format.pflegebericht'];

/** Katalogregeln, die ein Modell beurteilen muss. Exportiert für Tests. */
export function kiRegeln(modul: CatalogModule): CatalogCheckRule[] {
  return modul.checkRules.filter((r) => r.method !== 'struktur' && (r.scope ?? []).some((s) => FORMATE.includes(s)));
}

function schema(regelIds: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['note', 'prozent', 'schritte', 'regeln', 'staerken', 'verbessern', 'fachfehler', 'beispiel'],
    properties: {
      note: { type: 'integer', description: 'Schulnote 1 bis 6' },
      prozent: { type: 'integer', description: '0 bis 100' },
      schritte: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['schritt', 'prozent', 'kommentar'],
          properties: { schritt: { type: 'string', enum: [...SCHRITTE] }, prozent: { type: 'integer' }, kommentar: { type: 'string' } },
        },
      },
      regeln: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['regelId', 'erfuellt', 'kommentar'],
          properties: { regelId: { type: 'string', enum: regelIds }, erfuellt: { type: 'boolean' }, kommentar: { type: 'string' } },
        },
      },
      staerken: { type: 'array', items: { type: 'string' } },
      verbessern: { type: 'array', items: { type: 'string' } },
      fachfehler: { type: 'array', items: { type: 'string' } },
      beispiel: { type: 'string' },
    },
  } as const;
}

function systemPrompt(regeln: CatalogCheckRule[]): string {
  return `Du bist Praxisanleiterin und Lehrerin in der generalistischen Pflegeausbildung (Deutschland, PflBG) und bewertest eine schriftliche Pflegeplanung nach dem Pflegeprozess (6 Schritte nach Fiechter/Meier: Informationssammlung, Probleme und Ressourcen nach PESR, Ziele nach SMART, Maßnahmen, Durchführung, Evaluation).
Regeln:
- Bewerte nur anhand des Falls und der Planung. Erfinde keine Befunde dazu. Wenn die Planung etwas annimmt, das nicht im Fall steht, sag das.
- Prüfe fachliche Richtigkeit: falsche oder gefährliche Maßnahmen, falsche Zuordnung (z. B. medizinische Diagnose als Pflegeproblem, Risiko als aktuelles Problem), Ziele, die nicht zum Problem passen.
- Ärztliche Tätigkeiten (Medikamente ansetzen, Dosis ändern) sind keine Pflegemaßnahmen; „nach ärztlicher Anordnung“ ist korrekt.
- Beurteile jede dieser Katalogregeln einmal (regelId wie angegeben):
${regeln.map((r) => `  - ${r.id}: ${r.description}`).join('\n')}
- "schritte": für jeden der sechs Schritte ein Eintrag. Durchführung ist freiwillig; wenn leer, prozent 0 und Kommentar „freiwillig, nicht bearbeitet“.
- Schreibe kurz, freundlich, konkret, auf Deutsch, in der Du-Form. Je Liste höchstens 5 Punkte, je Kommentar höchstens zwei Sätze.
- "beispiel": überarbeite das schwächste Problem samt einem Ziel und einer Maßnahme (Zeilen „P: …“, „E: …“, „S: …“, „R: …“, „Ziel: …“, „Maßnahme: …“). Behalte gute Formulierungen der lernenden Person.
- Note: 1 = vollständig, fachlich richtig, durchgängig und fallbezogen; 6 = nicht verwertbar.`;
}

function fallText(fall: PlanFall): string {
  const erwartung = fall.probleme.length
    ? `\n<erwartungshorizont hinweis="Nur zur Orientierung, andere fachlich begründete Lösungen sind auch richtig">\n${fall.probleme.map((p) => `- ${p.text} (${p.art === 'risiko' ? 'Risiko' : 'aktuell'}${p.pflicht ? '' : ', optional'}); passende Maßnahmen z. B.: ${p.massnahmen.text}`).join('\n')}\nRessourcen: ${fall.ressourcen.map((r) => r.text).join('; ')}\n</erwartungshorizont>`
    : '';
  return `<fall>
${fall.person ? `Person: ${fall.person}\n` : ''}${fall.bereich ? `Bereich: ${fall.bereich}\n` : ''}${fall.text}
${fall.daten.map((d) => `${d.label}: ${d.wert}`).join('\n')}
</fall>${fall.verlauf ? `\n<verlauf zeitpunkt="Evaluation">\n${fall.verlauf}\n</verlauf>` : ''}${erwartung}`;
}

export async function bewerteMitClaude(opts: { apiKey: string; fall: PlanFall; plan: Plan; modul: CatalogModule; model?: string }): Promise<KiRueckmeldung> {
  const regeln = kiRegeln(opts.modul);
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const response = await client.beta.messages.create({
    model: opts.model ?? 'claude-opus-5-5',
    max_tokens: 12000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: schema(regeln.map((r) => r.id)) } },
    system: systemPrompt(regeln),
    messages: [{
      role: 'user',
      content: `${fallText(opts.fall)}\n<pflegeplanung>\n${planAlsText(opts.plan)}\n</pflegeplanung>\nGib deine Rückmeldung als JSON.`,
    }],
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === 'refusal') throw new Error('Die KI hat die Anfrage abgelehnt.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte noch einmal versuchen.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return leseRueckmeldung(text, regeln.map((r) => r.id));
}

/** Liest die JSON-Antwort robust ein. Exportiert für Tests. */
export function leseRueckmeldung(text: string, regelIds: string[]): KiRueckmeldung {
  const start = text.indexOf('{');
  const ende = text.lastIndexOf('}');
  if (start < 0 || ende < start) throw new Error('Die Antwort der KI war nicht lesbar.');
  const roh = JSON.parse(text.slice(start, ende + 1)) as Partial<KiRueckmeldung>;
  const liste = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
  const prozent = (x: unknown) => Math.min(100, Math.max(0, Math.round(Number(x) || 0)));
  const schritte = SCHRITTE.map((s) => {
    const k = Array.isArray(roh.schritte) ? roh.schritte.find((x) => x?.schritt === s) : undefined;
    return { schritt: s, prozent: prozent(k?.prozent), kommentar: typeof k?.kommentar === 'string' ? k.kommentar : '' };
  });
  const regeln = (Array.isArray(roh.regeln) ? roh.regeln : [])
    .filter((r): r is KiRegel => !!r && regelIds.includes(r.regelId))
    .map((r) => ({ regelId: r.regelId, erfuellt: r.erfuellt === true, kommentar: typeof r.kommentar === 'string' ? r.kommentar : '' }));
  return {
    note: Math.min(6, Math.max(1, Math.round(Number(roh.note) || 6))),
    prozent: prozent(roh.prozent), schritte, regeln,
    staerken: liste(roh.staerken), verbessern: liste(roh.verbessern), fachfehler: liste(roh.fachfehler),
    beispiel: typeof roh.beispiel === 'string' ? roh.beispiel : '',
  };
}

