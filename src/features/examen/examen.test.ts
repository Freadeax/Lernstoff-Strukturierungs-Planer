import { describe, expect, it } from 'vitest';
import type { MasteryStatus } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import {
  ALLGEMEINE_IMPULSE, faelleAusKrankheitsbildern, impulseFuer, mmss, MUENDLICHE_FAELLE, nameAusTitel, waehleFall, werteMuendlich,
} from './muendlich';
import { ETAPPEN, planePraktisch, tageBis } from './praktisch';
import {
  achsen, einstufung, fehlerProThema, katalog, kompetenzenVon, passt, proBereich, proTeil, pruefungsTeile, radarPunkte, schwachstellen,
  simulationsSchwaechen, type Fakten,
} from './radar';

const k = katalog(pflegeModule);
const fakten = (status: Record<string, MasteryStatus>, p: Partial<Fakten> = {}): Fakten => ({
  status: new Map(Object.entries(status)), faellig: new Set(), fehler: new Map(), simSchwach: new Map(), ...p,
});

describe('Schwächen-Radar', () => {
  it('hat fünf Achsen I bis V aus dem Katalog', () => {
    expect(achsen(pflegeModule).map((a) => a.code)).toEqual(['I', 'II', 'III', 'IV', 'V']);
  });

  it('erbt Kompetenzen von Oberthemen und vergleicht über Ebenen hinweg', () => {
    expect(kompetenzenVon(k, 'thema.pro.dekubitus')).toContain('kb.I.2');
    expect(passt('kb.I.2', 'kb.I')).toBe(true);
    expect(passt('kb.I', 'kb.I.2')).toBe(true);
    expect(passt('kb.I', 'kb.II')).toBe(false);
    expect(passt('kb.I.1', 'kb.I.10')).toBe(false);
  });

  it('gewichtet sicher voll, unsicher halb, bearbeitet wenig', () => {
    const b = proBereich(k, fakten({ 'thema.pro.dekubitus': 'sicher', 'thema.ap.herz': 'unsicher' }));
    const i = b.find((x) => x.code === 'I')!;
    expect(i.themen).toBe(2);
    expect(i.staerke).toBe(75);
    expect(b.find((x) => x.code === 'II')!.themen).toBe(0);
    expect(b.find((x) => x.code === 'II')!.staerke).toBe(0);
  });

  it('liest die Prüfungsteile aus dem Katalog: drei Aufsichtsarbeiten, mündlich, praktisch', () => {
    const teile = pruefungsTeile(pflegeModule);
    expect(teile.map((t) => t.kurz)).toEqual(['Schriftlich 1', 'Schriftlich 2', 'Schriftlich 3', 'Mündlich', 'Praktisch']);
    expect(teile.find((t) => t.kurz === 'Mündlich')!.kompetenzen).toEqual(['kb.III', 'kb.IV', 'kb.V']);
    const st = proTeil(k, teile, fakten({ 'thema.kom.ethik': 'sicher' }));
    expect(st.find((s) => s.code === 'Mündlich')!.themen).toBe(1);
    expect(st.find((s) => s.code === 'Praktisch')!.themen).toBe(1);
  });

  it('stellt Themen mit Fehlern und schwachen Simulationen nach vorn', () => {
    const f = fakten(
      { 'thema.pro.dekubitus': 'sicher', 'thema.ap.herz': 'bearbeitet', 'thema.kom.ethik': 'unsicher', 'thema.ph.medikamente': 'offen' },
      { fehler: new Map([['thema.pro.dekubitus', 2]]), simSchwach: new Map([['thema.kom.ethik', 1]]) },
    );
    const s = schwachstellen(k, f);
    expect(s.map((x) => x.topicId)).toEqual(['thema.pro.dekubitus', 'thema.kom.ethik', 'thema.ap.herz']);
    expect(s[0]!.gruende[0]).toContain('2 offene Fehler');
  });

  it('zählt Simulationen nur im Zeitfenster und Fehler nur, solange sie offen sind', () => {
    const jetzt = new Date('2026-10-28T12:00:00Z');
    const m = simulationsSchwaechen([
      { at: '2026-10-20T10:00:00Z', schwach: ['a', 'a', 'b'] },
      { at: '2026-01-01T10:00:00Z', schwach: ['a'] },
      { at: 'kaputt', schwach: ['c'] },
    ], jetzt);
    expect([...m]).toEqual([['a', 1], ['b', 1]]);
    expect([...fehlerProThema([{ topicIds: ['x', 'x'] }, { topicIds: ['x'], behoben: '2026-10-01' }])]).toEqual([['x', 1]]);
  });

  it('rechnet Radarpunkte im Uhrzeigersinn ab oben und begrenzt Werte', () => {
    expect(radarPunkte([100, 100, 100, 100], 10, 50)).toEqual([[50, 40], [60, 50], [50, 60], [40, 50]]);
    expect(radarPunkte([150, -5], 10, 0)[0]).toEqual([0, -10]);
    expect(einstufung(80)).toBe('stabil');
    expect(einstufung(10)).toBe('baustelle');
  });
});

describe('Mündliche Prüfung', () => {
  it('liefert Fälle aus mehreren Altersstufen und Versorgungsbereichen', () => {
    const alle = [...MUENDLICHE_FAELLE, ...faelleAusKrankheitsbildern()];
    expect(new Set(alle.map((f) => f.alter)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(alle.map((f) => f.versorgung)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(alle.map((f) => f.id)).size).toBe(alle.length);
  });

  it('setzt den Namen ein und deckt die Kompetenzbereiche III, IV und V ab', () => {
    const fall = faelleAusKrankheitsbildern().find((f) => f.id === 'kh:hi-sommer')!;
    expect(nameAusTitel(fall.titel)).toBe('Frau Sommer');
    expect(nameAusTitel('Lina, 6 Jahre')).toBe('Lina');
    expect(fall.alter).toBe('alt');
    const imp = impulseFuer(fall, 3, () => 0.3);
    expect(imp).toHaveLength(3);
    expect(imp[0]!.id).toBe('vorstellung');
    expect(new Set(imp.map((x) => x.kb))).toEqual(new Set(['kb.III', 'kb.IV', 'kb.V']));
    expect(imp.every((x) => !x.frage.includes('{name}'))).toBe(true);
    expect(imp[0]!.frage).toContain('Frau Sommer');
  });

  it('nimmt eigene Impulse des Falls vor den allgemeinen', () => {
    const fall = MUENDLICHE_FAELLE[0]!;
    const imp = impulseFuer(fall, 5, () => 0.5);
    expect(imp.map((x) => x.id).slice(0, 3)).toEqual(['vorstellung', ...fall.impulse.map((x) => x.id)]);
    expect(impulseFuer(fall, 99).length).toBe(1 + fall.impulse.length + ALLGEMEINE_IMPULSE.length - 1);
  });

  it('wählt einen Fall mit anderer Altersstufe und anderem Versorgungsbereich als im praktischen Teil', () => {
    for (let s = 0; s < 1; s += 0.1) {
      const f = waehleFall(MUENDLICHE_FAELLE, { alter: 'alt', versorgung: 'langzeit' }, () => s)!;
      expect(f.alter).not.toBe('alt');
      expect(f.versorgung).not.toBe('langzeit');
    }
    expect(waehleFall(MUENDLICHE_FAELLE, {}, () => 0, MUENDLICHE_FAELLE.map((f) => f.id))).toBeDefined();
  });

  it('wertet Stichpunkte je Kompetenzbereich aus und ignoriert ungültige Indizes', () => {
    const imp = impulseFuer(MUENDLICHE_FAELLE[0]!, 3, () => 0);
    const e = werteMuendlich(imp, { [imp[0]!.id]: { erfuellt: [0, 1, 1, 99], sekunden: 90 } });
    expect(e.erfuellt).toBe(2);
    expect(e.proBereich['kb.III'].erfuellt).toBe(2);
    expect(e.sprechzeit).toBe(90);
    expect(e.prozent).toBe(Math.round((2 / e.moeglich) * 100));
    expect(mmss(125)).toBe('2:05');
  });
});

describe('Praktische Prüfung', () => {
  it('plant Etappen rückwärts und markiert die aktuelle', () => {
    const plan = planePraktisch('2027-03-01', '2027-01-10', new Set());
    expect(plan[0]!.faelligAm).toBe('2027-01-04');
    expect(plan[0]!.status).toBe('ueberfaellig');
    expect(plan.find((e) => e.status === 'jetzt')!.id).toBe('planung');
    expect(plan.at(-1)!.status).toBe('spaeter');
  });

  it('setzt eine Etappe auf erledigt, wenn alle Schritte abgehakt sind', () => {
    const e = ETAPPEN[0]!;
    const plan = planePraktisch('', '2027-01-20', new Set(e.schritte.map((s) => `${e.id}.${s.id}`)));
    expect(plan[0]!.status).toBe('erledigt');
    expect(plan[1]!.status).toBe('spaeter');
    expect(tageBis('', '2027-01-01')).toBeNull();
    expect(tageBis('2027-01-11', '2027-01-01')).toBe(10);
  });

  it('hat eindeutige Schritt-IDs', () => {
    const ids = ETAPPEN.flatMap((e) => e.schritte.map((s) => `${e.id}.${s.id}`));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
