import type { SourceChunk, Summary } from '../../core/types';
import { fasseZusammen, SCHRITT_TEXT } from './pipeline';

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

export async function fasseGrosseQuellenZusammen(opts: Parameters<typeof fasseZusammen>[0], onProgress: (text: string) => void) {
  const teile = teileQuellen(opts.chunks);
  if (teile.length <= 1 || opts.modus === 'arbeitsauftrag') return fasseZusammen(opts);
  const summaries: Summary[] = [];
  const texte: string[] = [];
  for (const [i, chunks] of teile.entries()) {
    const ids = new Set(chunks.map((c) => c.documentId));
    const r = await fasseZusammen({ ...opts, docs: opts.docs.filter((d) => ids.has(d.id)), chunks,
      onSchritt: (s) => onProgress(`Teil ${i + 1} von ${teile.length}: ${SCHRITT_TEXT[s]}`) });
    summaries.push(r.summary); texte.push(r.antwortText);
  }
  return { summary: verbindeZusammenfassungen(summaries), antwortText: texte.join('\n\n') };
}
