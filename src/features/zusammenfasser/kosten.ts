// Grobe Kostenschätzung vor einem KI-Lauf, damit niemand von der Abrechnung überrascht wird.
// Preise: Claude Opus 5.5, Stand Oktober 2026 (Anthropic-Preisliste), in US-Dollar je Million Tokens.
// Die echten Werte stehen nach dem Lauf im Protokoll (PipelineRun.kosten).
import { MODEL } from './ki';

export const PREISE = { model: MODEL, eingabeJeMio: 4, ausgabeJeMio: 20, cacheLesenJeMio: 0.2 } as const;

/** Deutsche Fachtexte: etwa 3,2 Zeichen je Token (eher vorsichtig gerechnet). */
export const tokensAus = (zeichen: number) => Math.ceil(zeichen / 3.2);

export type KostenModus = 'originalgetreu' | 'lernen' | 'arbeitsauftrag' | 'pruefung' | 'vergleich';

const AUSGABE: Record<string, number> = { kurz: 3000, mittel: 6000, ausfuehrlich: 12000 };

export interface Schaetzung {
  eingabeTokens: number;
  ausgabeTokensMin: number;
  ausgabeTokensMax: number;
  aufrufeMin: number;
  aufrufeMax: number;
  dollarMin: number;
  dollarMax: number;
}

/**
 * Schätzung aus der Textmenge der Quellen. Jeder Aufruf schickt die Quellen mit (der zweite liest sie
 * meist günstig aus dem Cache). Ausgabe inkl. Denkzeit: Minimum ohne, Maximum mit Korrekturrunde.
 */
export function schaetzeKosten(o: { quellZeichen: number; modus: KostenModus; laenge?: string; kiPruefer?: boolean }): Schaetzung {
  const quelle = tokensAus(o.quellZeichen) + 1500; // + Systemanweisung und Modulregeln
  const ausgabe = (AUSGABE[o.laenge ?? 'mittel'] ?? 6000) * 2; // Antwort + Denken
  const pruefer = o.kiPruefer !== false && o.modus !== 'vergleich';
  const aufrufeMin = 1 + (pruefer ? 1 : 0) + (o.modus === 'vergleich' ? 1 : 0);
  const aufrufeMax = aufrufeMin + (o.modus === 'vergleich' ? 0 : 2); // Reparatur + erneute Prüfung
  const ein = (n: number) => quelle * PREISE.eingabeJeMio + (n - 1) * quelle * PREISE.cacheLesenJeMio;
  const ausgabeMin = ausgabe * aufrufeMin * 0.5;
  const ausgabeMax = ausgabe * aufrufeMax;
  return {
    eingabeTokens: quelle,
    ausgabeTokensMin: Math.round(ausgabeMin),
    ausgabeTokensMax: Math.round(ausgabeMax),
    aufrufeMin, aufrufeMax,
    dollarMin: (ein(aufrufeMin) + ausgabeMin * PREISE.ausgabeJeMio) / 1e6,
    dollarMax: (quelle * aufrufeMax * PREISE.eingabeJeMio + ausgabeMax * PREISE.ausgabeJeMio) / 1e6,
  };
}

const dollar = (n: number) => n < 0.01 ? 'unter 0,01 $' : `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

export function kostenText(s: Schaetzung): string {
  const umfang = s.eingabeTokens > 1000 ? `${Math.round(s.eingabeTokens / 1000).toLocaleString('de-DE')} Tsd.` : String(s.eingabeTokens);
  const aufrufe = s.aufrufeMin === s.aufrufeMax ? `${s.aufrufeMin}` : `${s.aufrufeMin}–${s.aufrufeMax}`;
  return `Geschätzt ${dollar(s.dollarMin)} bis ${dollar(s.dollarMax)} über deinen API-Schlüssel (${aufrufe} KI-Aufrufe, Quellen ≈ ${umfang} Tokens). Die genauen Kosten stehen danach im Laufprotokoll.`;
}
