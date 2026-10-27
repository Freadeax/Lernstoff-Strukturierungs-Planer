// Nachvollziehbarkeit (docs/ZUSAMMENFASSER.md, 6.6): welcher Lauf mit welchen Prompt-Versionen,
// welchem Modell und wie vielen Tokens dieses Ergebnis erzeugt hat. Ältere Ergebnisse haben keinen Lauf.
import { useEffect, useState } from 'react';
import { db } from '../../../core/db';
import type { PipelineRun } from '../typen';

const SCHRITT: Record<string, string> = {
  generierung: 'Erstellung', reparatur: 'Korrekturrunde', 'ki-pruefer': 'KI-Prüfer', fragen: 'Fragen', 'fragen-pruefer': 'Fragen-Prüfer',
  'aussagen-je-quelle': 'Aussagen je Quelle', abgleich: 'Abgleich',
};
const schritt = (k: string) => k.replace(/^(Teil \d+: )?([a-z-]+)( \d+)?$/, (_, t = '', s: string, n = '') => `${t}${SCHRITT[s] ?? s}${n}`);
const zahl = (n: number) => n.toLocaleString('de-DE');

export function LaufInfo({ runId }: { runId?: string }) {
  const [run, setRun] = useState<PipelineRun | null>(null);
  useEffect(() => {
    setRun(null);
    if (runId) db.pipelineRuns.get(runId).then((r) => setRun(r ?? null)).catch(() => {});
  }, [runId]);
  if (!run) return null;
  return (
    <details className="befunde-alle lauf-info">
      <summary>Wie ist das entstanden?</summary>
      <ul className="befunde">
        <li>{new Date(run.startedAt).toLocaleString('de-DE')} · {Object.keys(run.modelle).map(schritt).join(' → ')}</li>
        <li>Modell: {[...new Set(Object.values(run.modelle).map((m) => m.model))].join(', ')}</li>
        <li>Prompt-Versionen: {Object.entries(run.promptVersionen).map(([k, v]) => `${k} ${v}`).join(', ')}</li>
        {run.kosten && <li>Tokens: {zahl(run.kosten.inputTokens)} gelesen, {zahl(run.kosten.cacheReadTokens)} aus dem Zwischenspeicher, {zahl(run.kosten.outputTokens)} geschrieben</li>}
      </ul>
    </details>
  );
}
