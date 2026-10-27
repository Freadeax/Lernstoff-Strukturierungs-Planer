import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Document, SourceChunk } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { Protokoll, type KiAntwort } from './ki';
import { systemPrompt } from './pipeline';
import { fragenPrueferAnweisung, fragenUrteilAuswerten, type FragenUrteil } from './pruefung';
import { zusammenfuehren } from './vergleich';
import { verbindeLaeufe } from './grosseQuellen';
import type { VergleichsZeile } from './typen';

const { rufe, rufeJson } = vi.hoisted(() => ({ rufe: vi.fn(), rufeJson: vi.fn() }));
vi.mock('./ki', async (orig) => {
  const echt = await orig<typeof import('./ki')>();
  // Wie die echten Aufrufe: Antwort ins Protokoll schreiben
  const mitProtokoll = (f: typeof rufe, json: boolean) => async (k: string, o: { protokoll?: InstanceType<typeof echt.Protokoll>; schritt?: string; effort?: string }) => {
    const r = await f(k, o);
    o.protokoll?.erfasse(o.schritt ?? 'aufruf', o.effort ?? 'high', json ? { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(r) }], usage: { input_tokens: 10, output_tokens: 5 } } : r);
    return r;
  };
  return { ...echt, rufe: mitProtokoll(rufe, false), rufeJson: mitProtokoll(rufeJson, true) };
});

const antwort = (text: string, usage = { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 }): KiAntwort => ({ stop_reason: 'end_turn', model: 'claude-opus-5-5', usage, content: [{ type: 'text', text }] });

describe('Protokoll (PipelineRun)', () => {
  it('nummeriert wiederholte Schritte, summiert Tokens und liest Prompt-Versionen', () => {
    const p = new Protokoll().prompts({ '00-basis': '<!-- prompt: 00-basis · version 0.3 · … -->\nText', ohne: 'kein Kopf' });
    p.erfasse('generierung', 'high', antwort('a'));
    p.erfasse('generierung', 'high', antwort('b', { input_tokens: 1, output_tokens: 2, cache_read_input_tokens: 3 }));
    const run = p.alsRun({ mode: 'originalgetreu', topicIds: [], documentIds: ['d'], chunkIds: ['k'] }, [], 's1');
    expect(run.promptVersionen).toEqual({ '00-basis': '0.3', ohne: '?' });
    expect(Object.keys(run.modelle)).toEqual(['generierung', 'generierung 2']);
    expect(run.kosten).toEqual({ inputTokens: 101, outputTokens: 22, cacheReadTokens: 53 });
    expect(run.rohantworten).toEqual([{ schritt: 'generierung', stop_reason: 'end_turn', text: 'a' }, { schritt: 'generierung 2', stop_reason: 'end_turn', text: 'b' }]);
    expect(run.ergebnisSummaryId).toBe('s1');
  });

  it('verbindet die Läufe großer Quellen zu einem', () => {
    const teil = (n: number) => {
      const p = new Protokoll(); p.erfasse('generierung', 'high', antwort(`t${n}`));
      return p.alsRun({ mode: 'originalgetreu', topicIds: [], documentIds: [`d${n}`], chunkIds: [`k${n}`] }, [{ id: 'b1', pruefung: 'Q1c', schwere: 'warnung', claimId: 'c1', meldung: 'x' }], `s${n}`);
    };
    const r = verbindeLaeufe([teil(1), teil(2)], 'gesamt');
    expect(Object.keys(r.modelle)).toEqual(['Teil 1: generierung', 'Teil 2: generierung']);
    expect(r.eingabe.documentIds).toEqual(['d1', 'd2']);
    expect(r.befunde.map((b) => b.claimId)).toEqual(['teil1.c1', 'teil2.c1']);
    expect(r.kosten?.outputTokens).toBe(40);
    expect(r.ergebnisSummaryId).toBe('gesamt');
  });
});

describe('Lernzielübersicht', () => {
  it('setzt Prüfung, Lernziele und Länge ein und verbietet Ergänzungen', () => {
    const s = systemPrompt(pflegeModule, 'kurz', { modus: 'lernziele', pruefung: { name: 'Klausur LF 4', datum: '2026-11-20', lernziele: 'Dekubitus einschätzen' } });
    expect(s).toContain('## Modus: Prüfung (Lernzielübersicht)');
    expect(s).toContain('„Klausur LF 4“ am 2026-11-20');
    expect(s).toContain('Dekubitus einschätzen');
    expect(s).toContain('Laut Material prüfungsrelevant');
    expect(s).not.toMatch(/\{\{|<!--/);
  });

  it('läuft so streng wie originalgetreu und wird als Prüfungs-Summary mit Lauf gespeichert', async () => {
    const { fasseZusammen } = await import('./pipeline');
    const doc: Document = { id: 'a', title: 'Skript', kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: 'a', importedAt: '' };
    const chunk: SourceChunk = { id: 'k1', documentId: 'a', page: 1, text: 'Die Braden-Skala erfasst das Dekubitusrisiko.' };
    rufe.mockReset(); rufeJson.mockReset();
    // erste Fassung mit unbelegter Aussage → Q1c blockt wie im originalgetreuen Modus → eine Korrekturrunde
    rufe.mockResolvedValueOnce(antwort('## Lernziel 1\nDie Norton-Skala ist veraltet.'))
      .mockResolvedValueOnce({ ...antwort(''), content: [{ type: 'text', text: '## Lernziel 1\n' }, { type: 'text', text: '- Die Braden-Skala erfasst das Dekubitusrisiko.', citations: [{ type: 'content_block_location', cited_text: 'Die Braden-Skala erfasst das Dekubitusrisiko.', document_index: 0, start_block_index: 0, end_block_index: 1 }] }] });
    rufeJson.mockResolvedValue({ urteile: [], aufgaben: [], k4_widersprueche: [] });
    const { summary, run } = await fasseZusammen({ apiKey: 'x', modul: pflegeModule, length: 'kurz', docs: [doc], chunks: [chunk], modus: 'lernziele', pruefung: { name: 'K', datum: '', lernziele: '' } });
    expect(summary.mode).toBe('pruefung');
    expect(summary.qa).toMatchObject({ ampel: 'gruen', reparaturVersucht: true });
    expect(summary.pipelineRunId).toBe(run.id);
    expect(run.ergebnisSummaryId).toBe(summary.id);
    expect(Object.keys(run.modelle)).toEqual(['generierung', 'ki-pruefer', 'reparatur', 'ki-pruefer 2']);
    expect(Object.keys(run.promptVersionen)).toEqual(['00-basis', '07-lernzieluebersicht', '20-pruefer', '30-reparatur']);
    expect(run.eingabe).toMatchObject({ mode: 'pruefung', documentIds: ['a'], chunkIds: ['k1'] });
  });
});

describe('Fragen-Prüfer', () => {
  const mc = { typ: 'mc_einfach' as const, operator: 'nennen', schwierigkeit: 1 as const, frage: 'Ab wie vielen Punkten?', musterloesung: '18', bewertungskriterien: [{ kriterium: 'Wert', punkte: 1 }],
    belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten' }], pruefungsrelevanzBeleg: null,
    optionen: [{ text: '18', richtig: true, begruendung: '' }, { text: '20', richtig: false, begruendung: '' }, { text: 'etwa 18', richtig: false, begruendung: '' }, { text: '30', richtig: false, begruendung: '' }] };
  const offen = { ...mc, typ: 'offen' as const, frage: 'Definieren Sie Dekubitus.', optionen: null };
  const gut = (nr: number, optionen = 0): FragenUrteil => ({ nr, frage_eindeutig: true, musterloesung_gestuetzt: true, optionen: Array.from({ length: optionen }, (_, index) => ({ index, markierung_stimmt: true, eindeutig: true })), begruendung: '' });

  it('nummeriert Fragen und zeigt die Markierung der Optionen', () => {
    const t = fragenPrueferAnweisung([mc, offen]);
    expect(t).toContain('"nr": 1');
    expect(t).toContain('"als_richtig_markiert": true');
    expect(t).not.toMatch(/\{\{|<!--/);
  });

  it('verwirft mehrdeutige Ablenker, unbelegte Musterlösungen und unbeurteilte Fragen', () => {
    const mehrdeutig = gut(0, 4); mehrdeutig.optionen[2].eindeutig = false; mehrdeutig.begruendung = '„etwa 18“ ist nicht eindeutig falsch.';
    expect(fragenUrteilAuswerten([mc, offen], [mehrdeutig, gut(1)])).toEqual([
      { ok: false, grund: '„Ab wie vielen Punkten?“: Antwortoption falsch markiert oder nicht eindeutig. „etwa 18“ ist nicht eindeutig falsch.' }, { ok: true },
    ]);
    expect(fragenUrteilAuswerten([mc], [gut(0, 3)])[0].ok).toBe(false);   // Urteil zu Option 4 fehlt
    expect(fragenUrteilAuswerten([offen], [{ ...gut(0), musterloesung_gestuetzt: false }])[0].grund).toContain('Musterlösung nicht belegt');
    expect(fragenUrteilAuswerten([offen], [])[0]).toMatchObject({ ok: false });
  });

  it('verwirft beim Erstellen, was der Prüfer ablehnt, und fordert einmal nach', async () => {
    const { erstelleFragen } = await import('./pruefung');
    const doc: Document = { id: 'a', title: 'Skript', kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: 'a', importedAt: '' };
    const chunk: SourceChunk = { id: 'k1', documentId: 'a', page: 1, text: 'Ab 18 Punkten besteht ein Dekubitusrisiko.' };
    rufe.mockReset(); rufeJson.mockReset();
    const zweite = { ...offen, frage: 'Nennen Sie den Grenzwert.' };
    rufeJson
      .mockResolvedValueOnce({ fragen: [mc, offen] })
      .mockResolvedValueOnce({ urteile: [{ ...gut(0, 4), optionen: gut(0, 4).optionen.map((o, i) => (i === 2 ? { ...o, eindeutig: false } : o)) }, gut(1)] })
      .mockResolvedValueOnce({ fragen: [zweite] })
      .mockResolvedValueOnce({ urteile: [gut(0)] });
    const { satz, run } = await erstelleFragen({ apiKey: 'x', modul: pflegeModule, docs: [doc], chunks: [chunk], name: 'K', datum: '', lernziele: '', anzahl: 2, schwacheThemen: '' });
    expect(satz.fragen.map((f) => f.frage)).toEqual(['Definieren Sie Dekubitus.', 'Nennen Sie den Grenzwert.']);
    expect(satz.verworfen).toBe(1);
    expect(satz.verworfenGruende?.[0]).toContain('nicht eindeutig');
    expect(Object.keys(run.modelle)).toEqual(['fragen', 'fragen-pruefer', 'fragen 2', 'fragen-pruefer 2']);
    expect(satz.pipelineRunId).toBe(run.id);
  });

  it('prüft ohne KI-Prüfer nur per Code', async () => {
    const { erstelleFragen } = await import('./pruefung');
    const doc: Document = { id: 'a', title: 'Skript', kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: 'a', importedAt: '' };
    const chunk: SourceChunk = { id: 'k1', documentId: 'a', page: 1, text: 'Ab 18 Punkten besteht ein Dekubitusrisiko.' };
    rufeJson.mockReset();
    rufeJson.mockResolvedValueOnce({ fragen: [mc] });
    const { satz } = await erstelleFragen({ apiKey: 'x', modul: pflegeModule, docs: [doc], chunks: [chunk], name: '', datum: '', lernziele: '', anzahl: 1, schwacheThemen: '', kiPruefer: false });
    expect(rufeJson).toHaveBeenCalledTimes(1);
    expect(satz.fragen).toHaveLength(1);
  });

  beforeEach(() => { vi.clearAllMocks(); });
});

describe('Vergleich: zusammengeführte Fassung', () => {
  const b = (chunkId: string) => [{ chunkId, zitat: 'x' }];
  const zeilen: VergleichsZeile[] = [
    { unterthema: 'Intervall', art: 'widerspruechlich', erlaeuterung: '2 h gegen 3 h', jeQuelle: [{ documentId: 'a', aussage: 'alle 2 h', belege: b('k1') }, { documentId: 'b', aussage: 'alle 3 h', belege: b('k2') }] },
    { unterthema: 'Definition', art: 'uebereinstimmend', erlaeuterung: '', jeQuelle: [{ documentId: 'a', aussage: 'lokale Schädigung', belege: b('k1') }, { documentId: 'b', aussage: 'lokale Schädigung der Haut', belege: b('k2') }] },
    { unterthema: 'Skala', art: 'ergaenzend', erlaeuterung: '', jeQuelle: [{ documentId: 'a', aussage: null, belege: [] }, { documentId: 'b', aussage: 'Norton', belege: b('k2') }] },
  ];

  it('nennt Übereinstimmendes einmal, Ergänzungen mit Quelle und Unterschiede je Quelle', () => {
    const z = zusammenfuehren(zeilen);
    expect(z.map((a) => a.unterthema)).toEqual(['Definition', 'Skala', 'Intervall']);
    expect(z[0].einheitlich).toEqual({ aussage: 'lokale Schädigung', quellen: [{ documentId: 'a', belege: b('k1') }, { documentId: 'b', belege: b('k2') }] });
    expect(z[1].einheitlich?.quellen.map((q) => q.documentId)).toEqual(['b']);
    expect(z[2].jeQuelle?.map((q) => q.aussage)).toEqual(['alle 2 h', 'alle 3 h']);
    expect(z[2].einheitlich).toBeUndefined();
  });
});
