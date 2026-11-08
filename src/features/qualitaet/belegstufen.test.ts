import { describe, expect, it } from 'vitest';
import type { Claim, Document, Summary } from '../../core/types';
import {
  geltungsHinweis, mitFreigabe, quellenLuecken, sensibleKategorien, stufenAusBefunden, stufenUebersicht, stufenVon, uebersichtText,
} from './belegstufen';

const zit = (documentId = 'd1') => [{ chunkId: 'c1', documentId, page: 1, quote: 'x' }];
const claim = (p: Partial<Claim> = {}): Claim => ({ id: 'a', text: 'Aussage', citations: zit(), status: 'belegt', isSupplementary: false, kind: 'fakt', ...p });
const doc = (id: string, quelle?: Document['quelle']): Document => ({ id, title: id, kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: '', importedAt: '', quelle });

describe('stufenAusBefunden', () => {
  it('trennt Zitat und Sinn: ohne KI-Prüfer bleibt der Sinn ungeprüft', () => {
    expect(stufenAusBefunden(claim(), [], null)).toEqual({ zitat: 'gefunden', sinn: 'nicht_geprueft' });
  });
  it('Sinn geprüft nur, wenn der KI-Prüfer zu dieser Aussage geurteilt hat', () => {
    expect(stufenAusBefunden(claim(), [], new Set(['a'])).sinn).toBe('gestuetzt');
    expect(stufenAusBefunden(claim(), [], new Set(['b'])).sinn).toBe('nicht_geprueft');
  });
  it('Zitat nicht gefunden und ohne Beleg', () => {
    expect(stufenAusBefunden(claim(), [{ pruefung: 'Q1a', schwere: 'blocker', claimId: 'a' }], new Set(['a']))).toEqual({ zitat: 'nicht_gefunden', sinn: 'nicht_gestuetzt' });
    expect(stufenAusBefunden(claim({ citations: [] }), [{ pruefung: 'Q1c', schwere: 'warnung', claimId: 'a' }], null).zitat).toBe('ohne_beleg');
    expect(stufenAusBefunden(claim(), [{ pruefung: 'Q1a', schwere: 'warnung', claimId: 'a' }], null).zitat).toBe('aehnlich');
  });
  it('KI-Befunde und Zahlenabweichung senken die Sinnstufe', () => {
    const ki = new Set(['a']);
    expect(stufenAusBefunden(claim(), [{ pruefung: 'K1', schwere: 'warnung', claimId: 'a' }], ki).sinn).toBe('teilweise');
    expect(stufenAusBefunden(claim(), [{ pruefung: 'K3', schwere: 'warnung', claimId: 'a' }], ki).sinn).toBe('nicht_gestuetzt');
    expect(stufenAusBefunden(claim(), [{ pruefung: 'Q2', schwere: 'blocker', claimId: 'a' }], null).sinn).toBe('nicht_gestuetzt');
  });
  it('Lernhilfen und Gliederung brauchen keinen Beleg', () => {
    expect(stufenAusBefunden(claim({ kind: 'lernhilfe', citations: [] }), [], null)).toEqual({ zitat: 'entfaellt', sinn: 'entfaellt' });
  });
});

describe('sensible Aussagen und Quellenangaben', () => {
  const docs = new Map([['d1', doc('d1', { art: 'expertenstandard', herausgeber: 'DNQP' })], ['d2', doc('d2', { art: 'einrichtung' })], ['d3', doc('d3')]]);
  it('erkennt Kategorien aus Quellenart und Text', () => {
    expect(sensibleKategorien(claim(), docs)).toEqual(['expertenstandard']);
    expect(sensibleKategorien(claim({ citations: zit('d3'), text: 'Nach § 203 StGB gilt die Schweigepflicht.' }), docs)).toEqual(['recht']);
    expect(sensibleKategorien(claim({ citations: zit('d3'), text: 'Paracetamol 500 mg alle 6 Stunden' }), docs)).toEqual(['arzneimittel']);
    expect(sensibleKategorien(claim({ citations: zit('d3'), text: 'Der Blutdruck liegt normal bei 120/80 mmHg, Temperatur 36,5 °C.' }), docs)).toEqual(['normwert']);
    expect(sensibleKategorien(claim({ citations: zit('d3'), text: 'Hämoglobin 12 g/dl' }), docs)).toEqual(['normwert']);
    expect(sensibleKategorien(claim({ citations: zit('d3'), text: 'Die Haut wird täglich inspiziert.' }), docs)).toEqual([]);
  });
  it('nennt fehlende Angaben und veraltete Prüfung', () => {
    expect(quellenLuecken(undefined, undefined).map((l) => l.feld)).toEqual(['art']);
    const voll = { art: 'expertenstandard' as const, herausgeber: 'DNQP', fassung: '2. Aktualisierung 2017', geltungsbereich: 'bundesweit', geprueftAm: '2026-01-10' };
    expect(quellenLuecken(voll, { chapter: '3.2 Risikoeinschätzung' }, '2026-11-08')).toEqual([]);
    expect(quellenLuecken({ ...voll, geprueftAm: '2024-01-10' }, { chapter: '3.2' }, '2026-11-08').map((l) => l.feld)).toEqual(['veraltet']);
    expect(quellenLuecken({ art: 'gesetz' }, {}, '2026-11-08').map((l) => l.feld)).toEqual(['herausgeber', 'fassung', 'abschnitt', 'geltungsbereich', 'geprueftAm']);
  });
  it('unterscheidet Expertenstandard und Hausvorgabe', () => {
    expect(geltungsHinweis(claim({ citations: [...zit('d1'), ...zit('d2')] }), docs)).toMatch(/Fachstandard und auf eine Vorgabe/);
    expect(geltungsHinweis(claim({ citations: zit('d2') }), docs)).toMatch(/Hausvorgabe/);
    expect(geltungsHinweis(claim(), docs)).toBeNull();
  });
});

describe('Übersicht und Freigabe', () => {
  const s: Summary = {
    id: 's', mode: 'originalgetreu', length: 'kurz', topicIds: [], sourceDocumentIds: ['d1'], createdAt: '', needsReview: false,
    claims: [
      claim({ id: 'a', pruefung: { zitat: 'gefunden', sinn: 'gestuetzt' } }),
      claim({ id: 'b', pruefung: { zitat: 'gefunden', sinn: 'teilweise' } }),
      claim({ id: 'c', kind: 'lernhilfe', citations: [], isSupplementary: true, pruefung: { zitat: 'entfaellt', sinn: 'entfaellt' } }),
    ],
    qa: { befunde: [], ampel: 'gelb', reparaturVersucht: false, statistik: { claims: 3, belegt: 1, unbelegt: 0, ergaenzung: 1, fehlt: 0 } },
  };
  it('zeigt die drei Stufen getrennt statt „alle belegt“', () => {
    const u = stufenUebersicht(s, new Map(), new Map());
    expect(u).toMatchObject({ aussagen: 2, zitatGefunden: 2, sinnGeprueft: 1, freigegeben: 0 });
    expect(uebersichtText(u)).toBe('Zitat gefunden: 2 von 2 · Sinn geprüft: 1 von 2 · fachlich freigegeben: 0 von 2');
  });
  it('Freigabe setzen und zurücknehmen lässt die anderen Stufen stehen', () => {
    const f = { urteil: 'freigegeben' as const, durch: 'Praxisanleitung', am: '2026-11-08T08:00:00Z' };
    const mit = mitFreigabe(s, 'b', f);
    expect(mit.claims[1].pruefung).toEqual({ zitat: 'gefunden', sinn: 'teilweise', freigabe: f });
    expect(stufenUebersicht(mit, new Map(), new Map()).freigegeben).toBe(1);
    expect(mitFreigabe(mit, 'b', null).claims[1].pruefung).toEqual({ zitat: 'gefunden', sinn: 'teilweise' });
    expect(s.claims[1].pruefung?.freigabe).toBeUndefined();
  });
  it('ältere Zusammenfassungen ohne Stufen leiten sie aus den Befunden ab', () => {
    const alt = { ...s, claims: [claim({ id: 'x' })], qa: { ...s.qa!, befunde: [{ id: 'b1', pruefung: 'Q1a', schwere: 'warnung' as const, claimId: 'x', meldung: '' }] } };
    expect(stufenVon(alt.claims[0], alt)).toEqual({ zitat: 'aehnlich', sinn: 'nicht_geprueft' });
  });
});
