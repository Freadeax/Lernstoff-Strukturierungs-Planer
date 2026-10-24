import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Document, SourceChunk } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import type { PruefClaim } from '../qualitaet/deterministisch';
import { aufgabenAntworten, befundeAusUrteilen, prueferAnweisung, type PrueferAntwort } from './pruefer';
import { baueGliederung, befundeListe, statusFuer, systemPrompt } from './pipeline';
import { zerlegeAntwort } from './zerlegen';

const rufe = vi.fn();
const rufeJson = vi.fn();
vi.mock('./ki', async (orig) => ({ ...(await orig<typeof import('./ki')>()), rufe: (...a: unknown[]) => rufe(...a), rufeJson: (...a: unknown[]) => rufeJson(...a) }));

const claim = (id: string, kind: PruefClaim['kind'], text = `Aussage ${id}`): PruefClaim => ({
  id, kind, text, citations: kind === 'fakt' ? [{ chunkId: 'k1', documentId: 'a', page: 1, quote: 'Zitat' }] : [],
});
const urteil = (claimId: string, teil: Partial<PrueferAntwort['urteile'][number]> = {}) => ({
  claimId, k1_stuetzung: 'gestuetzt' as const, k3_sinnveraenderung: null, k5_definitionen_vermischt: false, lernhilfe_fachlich_falsch: null, begruendung: '', ...teil,
});

describe('KI-Prüfer: Urteile → Befunde', () => {
  const claims = [claim('c1', 'fakt'), claim('c2', 'fakt'), claim('c3', 'lernhilfe'), claim('c4', 'fakt')];

  it('übersetzt K1, K3, K5, Lernhilfe, K2 und K4 mit der Schwere aus der Spezifikation', () => {
    const b = befundeAusUrteilen({
      urteile: [
        urteil('c1', { k1_stuetzung: 'nicht_gestuetzt', begruendung: 'Zitat nennt keine Zeit.' }),
        urteil('c2', { k1_stuetzung: 'teilweise', k3_sinnveraenderung: '„kann“ wurde zu „muss“.' }),
        urteil('c3', { lernhilfe_fachlich_falsch: 'Eselsbrücke vertauscht Stadien.' }),
        urteil('c4', { k5_definitionen_vermischt: true }),
        urteil('unbekannt', { k1_stuetzung: 'nicht_gestuetzt' }),
      ],
      aufgaben: [{ nr: '1', k2_operator_erfuellt: false, begruendung: 'Nur genannt statt begründet.' }, { nr: '2', k2_operator_erfuellt: true, begruendung: '' }],
      k4_widersprueche: [
        { unterthema: 'Intervall', chunkIds: ['k1', 'k2'], beschreibung: '2 h gegen 3 h', bereits_markiert: false },
        { unterthema: 'Definition', chunkIds: ['k1', 'k2'], beschreibung: 'x', bereits_markiert: true },
      ],
    }, claims, 'originalgetreu');
    expect(b.map((x) => `${x.pruefung}:${x.schwere}:${x.claimId ?? x.aufgabeNr ?? ''}`)).toEqual([
      'K1:blocker:c1', 'K1:warnung:c2', 'K3:blocker:c2', 'K3:blocker:c3', 'K5:blocker:c4', 'K2:warnung:1', 'K4:warnung:', 'K4:hinweis:',
    ]);
    expect(b[0].meldung).toContain('Zitat nennt keine Zeit.');
  });

  it('wertet Sinnverschiebung im Lernmodus als Warnung', () => {
    const b = befundeAusUrteilen({ urteile: [urteil('c1', { k3_sinnveraenderung: 'Einschränkung fehlt' })], aufgaben: [], k4_widersprueche: [] }, claims, 'lernen');
    expect(b[0]).toMatchObject({ pruefung: 'K3', schwere: 'warnung' });
  });

  it('setzt Aussagen ohne Gliederung, Lücken und Rückfragen ein, Aufgabenblock nur bei Aufgaben', () => {
    const titel = new Map([['a', 'Lehrbuch']]);
    const ohne = prueferAnweisung([claim('c1', 'fakt'), claim('c2', 'struktur', '## Titel'), claim('c3', 'fehlt')], titel);
    expect(ohne).toContain('"id": "c1"');
    expect(ohne).toContain('"quelle": "Lehrbuch"');
    expect(ohne).not.toContain('"c2"');
    expect(ohne).not.toContain('"c3"');
    expect(ohne).not.toMatch(/\{\{|<aufgaben>|<!--/);
    const mit = prueferAnweisung([claim('c1', 'fakt')], titel, [{ nr: '1', wortlaut: 'Nennen Sie drei …', operatoren: ['nennen'], bestandteile: [], antwort: '- a' }]);
    expect(mit).toContain('<aufgaben>');
    expect(mit).toContain('Nennen Sie drei');
  });

  it('liest die Antwortabschnitte je Aufgabe', () => {
    expect([...aufgabenAntworten('<aufgabe nr="1">\n- a\n</aufgabe>\n<aufgabe nr="2a">b</aufgabe>')]).toEqual([['1', '- a'], ['2a', 'b']]);
  });
});

describe('Pipeline-Bausteine', () => {
  it('setzt die Modus-Anweisung je Modus ohne offene Platzhalter ein', () => {
    const lernen = systemPrompt(pflegeModule, 'mittel', { modus: 'lernen', verwandteThemen: ['Mobilität'], wissensstand: { status: 'unsicher', haeufigeFehler: ['Braden mit Norton verwechselt'] } });
    expect(lernen).toContain('## Modus: Lernen');
    expect(lernen).toContain('Mobilität');
    expect(lernen).toContain('Braden mit Norton verwechselt');
    expect(lernen).not.toMatch(/\{\{|<!--/);
    const auftrag = systemPrompt(pflegeModule, 'mittel', { modus: 'arbeitsauftrag', aufgaben: [{ nr: '1', wortlaut: 'Formulieren Sie eine Pflegediagnose.', operatoren: ['formulieren'], bestandteile: [], aufgabenformatId: 'format.pesr', unsicher: false }] });
    expect(auftrag).toContain('## Modus: Arbeitsauftrag');
    expect(auftrag).toContain('Formulieren Sie eine Pflegediagnose.');
    expect(auftrag).toContain('format.pesr: Pflegediagnose nach PESR. Bestandteile: P, E, S, R.');
    expect(auftrag).toContain('nennen (AFB I)');
    expect(auftrag).not.toMatch(/\{\{|<!--|"unsicher"/);
  });

  it('baut aus Zeilen eine Gliederung mit Überschrift, Liste, Tabelle und Kasten', () => {
    const chunks = new Map<string, SourceChunk>();
    const claims = zerlegeAntwort([{ type: 'text', text: '## Maßnahmen\n- Haut prüfen. Lagern.\n1. Erster Schritt\n| A | B |\n|---|---|\n<lernhilfe>Merksatz hier.</lernhilfe>\nText.' }], [], chunks);
    const { blocks, blockVon } = baueGliederung(claims);
    expect(blocks.map((b) => b.type)).toEqual(['ueberschrift', 'liste', 'liste', 'tabelle', 'kasten', 'absatz']);   // Trennzeile |---| ist keine Aussage
    expect(blocks[0]).toMatchObject({ level: 2, title: 'Maßnahmen' });
    expect(blocks[1].claimIds).toHaveLength(2);
    expect(blocks[4].kastenArt).toBe('lernhilfe');
    expect(claims.find((c) => c.text === 'Erster Schritt')).toBeTruthy();
    expect(claims.some((c) => c.text === '1.')).toBe(false);
    expect(blockVon.get(claims[1].id)).toBe(blocks[1].id);
  });

  it('macht aus K1-Blockern „ohne Beleg“ und listet Befunde für die Reparatur mit Aussagetext', () => {
    expect(statusFuer({ id: 'c1', kind: 'fakt' }, [{ pruefung: 'K1', schwere: 'blocker', claimId: 'c1', meldung: '' }])).toBe('unbelegt');
    expect(statusFuer({ id: 'c1', kind: 'fakt' }, [{ pruefung: 'K3', schwere: 'blocker', claimId: 'c1', meldung: '' }])).toBe('abweichend');
    const claims = zerlegeAntwort([{ type: 'text', text: 'Lagern alle 3 Stunden.' }], [], new Map());
    const liste = befundeListe([
      { pruefung: 'Q2', schwere: 'blocker', claimId: claims[0].id, meldung: 'Zahl 3 nicht im Beleg.' },
      { pruefung: 'Q4d', schwere: 'hinweis', meldung: 'egal' },
      { pruefung: 'Q4a', schwere: 'blocker', aufgabeNr: '2', meldung: 'fehlt' },
    ], claims);
    expect(liste).toBe('- [Q2, blocker] Aussage „Lagern alle 3 Stunden.“: Zahl 3 nicht im Beleg.\n- [Q4a, blocker] Aufgabe 2: fehlt');
  });
});

describe('Gate mit einer Reparaturrunde', () => {
  const doc: Document = { id: 'a', title: 'Lehrbuch', kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: 'a', importedAt: '' };
  const chunk: SourceChunk = { id: 'k1', documentId: 'a', page: 1, printedPage: '412', text: 'Bei Risiko soll alle 2 Stunden positioniert werden.' };
  const antwort = (text: string) => ({
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: '## Lagerung\n' }, {
      type: 'text', text,
      citations: [{ type: 'content_block_location', cited_text: 'Bei Risiko soll alle 2 Stunden positioniert werden.', document_index: 0, start_block_index: 0, end_block_index: 1 }],
    }],
  });
  const leer: PrueferAntwort = { urteile: [], aufgaben: [], k4_widersprueche: [] };

  beforeEach(() => { rufe.mockReset(); rufeJson.mockReset(); });

  it('repariert einmal nach einem Blocker und prüft danach erneut', async () => {
    const { fasseZusammen } = await import('./pipeline');
    rufe.mockResolvedValueOnce(antwort('Bei Risiko soll alle 3 Stunden positioniert werden.'))
      .mockResolvedValueOnce(antwort('Bei Risiko soll alle 2 Stunden positioniert werden.'));
    rufeJson.mockResolvedValue(leer);
    const schritte: string[] = [];
    const { summary } = await fasseZusammen({ apiKey: 'x', modul: pflegeModule, length: 'kurz', docs: [doc], chunks: [chunk], onSchritt: (s) => schritte.push(s) });

    expect(rufe).toHaveBeenCalledTimes(2);
    expect(rufeJson).toHaveBeenCalledTimes(2);
    const zweiter = rufe.mock.calls[1][1].messages;
    expect(zweiter).toHaveLength(3);
    expect(zweiter[1]).toEqual({ role: 'assistant', content: expect.stringContaining('3 Stunden') });
    expect(zweiter[2].content).toContain('[Q2, blocker]');
    expect(summary.qa).toMatchObject({ ampel: 'gruen', reparaturVersucht: true });
    expect(summary.claims.find((c) => c.kind === 'fakt')?.status).toBe('belegt');
    expect(summary.blocks?.[0]).toMatchObject({ type: 'ueberschrift', title: 'Lagerung' });
    expect(schritte).toEqual(['generierung', 'pruefung-code', 'pruefung-ki', 'reparatur', 'pruefung-code', 'pruefung-ki', 'fertig']);
  });

  it('repariert höchstens einmal und zeigt verbleibende KI-Blocker rot', async () => {
    const { fasseZusammen } = await import('./pipeline');
    rufe.mockResolvedValue(antwort('Bei Risiko muss alle 2 Stunden positioniert werden.'));
    rufeJson.mockImplementation(async (_k: string, o: { messages: Array<{ content: Array<{ text?: string }> }> }) => {
      const id = /"id": "(c\d+)"/.exec(o.messages[0].content.at(-1)?.text ?? '')?.[1] ?? 'c2';
      return { ...leer, urteile: [urteil(id, { k3_sinnveraenderung: '„soll“ wurde zu „muss“.' })] };
    });
    const { summary } = await fasseZusammen({ apiKey: 'x', modul: pflegeModule, length: 'kurz', docs: [doc], chunks: [chunk] });
    expect(rufe).toHaveBeenCalledTimes(2);
    expect(summary.qa).toMatchObject({ ampel: 'rot', reparaturVersucht: true });
    expect(summary.qa?.befunde.some((b) => b.pruefung === 'K3')).toBe(true);
    expect(summary.claims.find((c) => c.kind === 'fakt')?.status).toBe('abweichend');
  });

  it('ruft ohne KI-Prüfer und ohne Blocker nur einmal auf', async () => {
    const { fasseZusammen } = await import('./pipeline');
    rufe.mockResolvedValue(antwort('Bei Risiko soll alle 2 Stunden positioniert werden.'));
    const { summary } = await fasseZusammen({ apiKey: 'x', modul: pflegeModule, length: 'kurz', docs: [doc], chunks: [chunk], kiPruefer: false });
    expect(rufe).toHaveBeenCalledTimes(1);
    expect(rufeJson).not.toHaveBeenCalled();
    expect(summary.qa).toMatchObject({ ampel: 'gruen', reparaturVersucht: false });
  });
});
