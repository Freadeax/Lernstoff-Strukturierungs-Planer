import type { SourceChunk, Summary } from '../../core/types';
import { fasseZusammen, SCHRITT_TEXT, type ZusammenfassungsErgebnis } from './pipeline';
import type { PipelineRun } from './typen';

/** Jedes Quellstück wird berücksichtigt, ohne ein komplettes Buch in eine Anfrage zu pressen. */
export function teileQuellen(chunks: SourceChunk[], limit = 45000): SourceChunk[][] {
  const teile: SourceChunk[][] = [];
  let teil: SourceChunk[] = [], zeichen = 0;
  for (const c of chunks) {
    if (teil.length && zeichen + c.text.length > limit) { teile.push(teil); teil = []; zeichen = 0; }
    teil.push(c); zeichen += c.text.length;
  }
  if (teil.length) teile.push(teil);
  return teile;
}

/** IDs in jedem Teil sind lokal; Belege zeigen weiterhin direkt auf Original-Chunks. */
export function verbindeZusammenfassungen(teile: Summary[]): Summary {
  if (!teile.length) throw new Error('Keine Zusammenfassungen vorhanden.');
  const s: Summary = { ...teile[0]!, id: crypto.randomUUID(), claims: [], blocks: [], rootBlockIds: [],
    sourceDocumentIds: [...new Set(teile.flatMap((t) => t.sourceDocumentIds))],
    qa: { befunde: [], ampel: 'gruen', reparaturVersucht: false, statistik: { claims: 0, belegt: 0, unbelegt: 0, ergaenzung: 0, fehlt: 0 } } };
  teile.forEach((t, i) => {
    const id = (v: string) => `teil${i + 1}.${v}`;
    s.claims.push(...t.claims.map((c) => ({ ...c, id: id(c.id), blockId: c.blockId ? id(c.blockId) : undefined })));
    s.blocks!.push(...(t.blocks ?? []).map((b) => ({ ...b, id: id(b.id), claimIds: b.claimIds.map(id), children: b.children?.map(id) })));
    s.rootBlockIds!.push(...(t.rootBlockIds ?? []).map(id));
    s.needsReview ||= t.needsReview;
    if (t.qa) {
      s.qa!.befunde.push(...t.qa.befunde.map((b) => ({ ...b, id: id(b.id), claimId: b.claimId ? id(b.claimId) : undefined })));
      if (t.qa.ampel === 'rot' || (t.qa.ampel === 'gelb' && s.qa!.ampel !== 'rot')) s.qa!.ampel = t.qa.ampel;
      s.qa!.reparaturVersucht ||= t.qa.reparaturVersucht;
      for (const k of Object.keys(s.qa!.statistik) as Array<keyof NonNullable<Summary['qa']>['statistik']>) s.qa!.statistik[k] += t.qa.statistik[k];
    }
  });
  s.createdAt = new Date().toISOString();
  return s;
}

/** Läufe der Teile zu einem PipelineRun verbinden: Schritte mit „Teil n“ benannt, Tokens addiert. */
export function verbindeLaeufe(laeufe: PipelineRun[], summaryId: string): PipelineRun {
  const r: PipelineRun = {
    ...laeufe[0]!, id: crypto.randomUUID(), ergebnisSummaryId: summaryId, modelle: {}, rohantworten: [], befunde: [],
    eingabe: { ...laeufe[0]!.eingabe, documentIds: [...new Set(laeufe.flatMap((l) => l.eingabe.documentIds))], chunkIds: laeufe.flatMap((l) => l.eingabe.chunkIds) },
    kosten: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 },
  };
  laeufe.forEach((l, i) => {
    for (const [k, v] of Object.entries(l.modelle)) r.modelle[`Teil ${i + 1}: ${k}`] = v;
    r.rohantworten.push(...l.rohantworten.map((a) => ({ ...(a as object), teil: i + 1 })));
    r.befunde.push(...l.befunde.map((b) => ({ ...b, id: `teil${i + 1}.${b.id}`, claimId: b.claimId ? `teil${i + 1}.${b.claimId}` : undefined })));
    for (const k of ['inputTokens', 'outputTokens', 'cacheReadTokens'] as const) r.kosten![k] += l.kosten?.[k] ?? 0;
  });
  return r;
}

export async function fasseGrosseQuellenZusammen(opts: Parameters<typeof fasseZusammen>[0], onProgress: (text: string) => void): Promise<ZusammenfassungsErgebnis> {
  const teile = teileQuellen(opts.chunks);
  if (teile.length <= 1 || opts.modus === 'arbeitsauftrag') return fasseZusammen(opts);
  const summaries: Summary[] = [];
  const texte: string[] = [];
  const laeufe: PipelineRun[] = [];
  for (const [i, chunks] of teile.entries()) {
    const ids = new Set(chunks.map((c) => c.documentId));
    const r = await fasseZusammen({ ...opts, docs: opts.docs.filter((d) => ids.has(d.id)), chunks,
      onSchritt: (s) => onProgress(`Teil ${i + 1} von ${teile.length}: ${SCHRITT_TEXT[s]}`) });
    summaries.push(r.summary); texte.push(r.antwortText); laeufe.push(r.run);
  }
  const summary = verbindeZusammenfassungen(summaries);
  const run = verbindeLaeufe(laeufe, summary.id);
  return { summary: { ...summary, pipelineRunId: run.id }, antwortText: texte.join('\n\n'), run };
}
