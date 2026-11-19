import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AERZTLICH_VORBEHALTEN, grundBefugnis, mitEinrichtung, pruefeProfil, ROLLEN, type EinrichtungsProfil } from './einrichtung';
import { FAELLE_V2 } from './faelle';
import { PILOT_AMBULANT as FALL } from './faelle/amb-sturz-exsikkose';
import { KATALOG, KATALOG_LISTE, NACHWEIS, PFLEGETASCHE } from './katalog';
import { freigabe, massnahme, replay, start } from './kern';
import { LP, spaltenStaerke, staerke } from './lehrplan-belege';
import { befugnisMatrix } from './matrix';
import { NORMAL, OPTIONALE_WIRKGROESSEN } from './modell';
import type { BefugnisLevel, Reiter } from './typen';

const REITER: Reiter[] = ['gespraech', 'beobachten', 'akut', 'messen', 'versorgen', 'melden'];
/** Strenge: höher = strenger. Mit fortschreitender Ausbildung darf es nur lockerer werden. */
const STRENGE: Record<BefugnisLevel, number> = { selbst: 0, 'mit-anleitung': 1, 'nach-anordnung': 2, gesperrt: 3, 'nur-aerztlich': 4 };

describe('Handlungskatalog P3', () => {
  it('IDs eindeutig, Pflichtfelder gesetzt', () => {
    expect(new Set(KATALOG_LISTE.map((m) => m.id)).size).toBe(KATALOG_LISTE.length);
    for (const m of KATALOG_LISTE) {
      expect(m.zeitbedarfSekunden, m.id).toBeGreaterThan(0);
      expect(m.kompetenzbereiche.length, m.id).toBeGreaterThan(0);
      for (const r of ROLLEN) expect(m.befugnis[r], `${m.id} ${r}`).toBeDefined();
    }
  });
  it('alle 6 Reiter in beiden Spuren besetzt', () => {
    for (const spur of ['A', 'B'] as const) for (const r of REITER) {
      const n = KATALOG_LISTE.filter((m) => m.reiter === r && (m.spur === spur || m.spur === 'beide')).length;
      expect(n, `${spur} ${r}`).toBeGreaterThanOrEqual(5);
    }
    expect(KATALOG_LISTE.filter((m) => m.spur === 'B').length).toBeGreaterThanOrEqual(25);
  });
  it('Befugnis wird mit der Ausbildung nie strenger (1 ≥ 2 ≥ 3 ≥ Pflegefachperson)', () => {
    for (const m of KATALOG_LISTE) {
      const b = m.befugnis;
      expect(STRENGE[b[1]] >= STRENGE[b[2]] && STRENGE[b[2]] >= STRENGE[b[3]] && STRENGE[b[3]] >= STRENGE[b.pflegefachperson], m.id).toBe(true);
    }
  });
  it('ärztliche Aufgaben sind für alle Rollen ärztlich und haben einen Abbruch durch die PA', () => {
    for (const id of AERZTLICH_VORBEHALTEN) {
      const m = KATALOG[id]!;
      for (const r of ROLLEN) expect(m.befugnis[r], `${id} ${r}`).toBe('nur-aerztlich');
      expect(m.risikoBeiUeberschreitung).toBe('abbruch-durch-pa');
    }
  });
  it('gesperrte oder ärztliche Maßnahmen haben ein Risiko bei Überschreitung', () => {
    for (const m of KATALOG_LISTE) {
      if (ROLLEN.some((r) => m.befugnis[r] === 'gesperrt' || m.befugnis[r] === 'nur-aerztlich')) expect(m.risikoBeiUeberschreitung, m.id).toBeDefined();
    }
  });
  it('Spur B hat klinische Bereiche; Geräte nur aus der Pflegetasche', () => {
    for (const m of KATALOG_LISTE.filter((x) => x.spur === 'B')) expect(m.klinisch?.length, m.id).toBeGreaterThan(0);
    for (const m of KATALOG_LISTE.filter((x) => x.geraet)) expect(PFLEGETASCHE as readonly string[], m.id).toContain(m.geraet);
  });
  it('Wirkkurven zeigen auf echte Grundgrößen und sind zeitlich geordnet', () => {
    for (const m of KATALOG_LISTE) for (const k of m.wirkung ?? []) {
      expect([...Object.keys(NORMAL), ...OPTIONALE_WIRKGROESSEN], m.id).toContain(k.groesse);
      expect(k.spitzeSek, m.id).toBeGreaterThanOrEqual(k.beginnSek);
      if (k.dauerSek !== 'dauerhaft') expect(k.dauerSek, m.id).toBeGreaterThanOrEqual(k.spitzeSek);
      expect(k.delta !== undefined || k.faktor !== undefined, m.id).toBe(true);
    }
  });
  it('Pilotfall findet alle Katalog-Maßnahmen und bleibt auf dem Musterweg', () => {
    for (const fall of FAELLE_V2) for (const id of fall.massnahmen) expect(massnahme(fall, id), id).toBeDefined();
  });
});

describe('Belege BW-Lehrplan 3BFP (E4)', () => {
  it('jede Maßnahme hat einen Nachweis; ohne Stelle eine Anmerkung und kein befugnisBeleg', () => {
    for (const m of KATALOG_LISTE) {
      const n = NACHWEIS[m.id];
      expect(n, m.id).toBeDefined();
      if (n!.stellen.length === 0) {
        expect(n!.anmerkung, m.id).toBeTruthy();
        expect(m.befugnisBeleg, m.id).toBeUndefined();
      } else {
        expect(m.befugnisBeleg?.fundstelle, m.id).toMatch(/^S\. \d+/);
      }
    }
  });
  it('Fundstellen liegen in generalistischen Abschnitten (keine Anlage-3/4-Seiten)', () => {
    // Anlage 3/4-Varianten: S. 38–51, 64–76, 85–94, 108–121, 133–145, 156–161, 174–182, 195–207
    const sonder: Array<[number, number]> = [[38, 51], [64, 76], [85, 94], [108, 121], [133, 145], [156, 161], [174, 182], [195, 207]];
    for (const [k, x] of Object.entries(LP)) {
      expect(sonder.some(([a, b]) => x.seite >= a && x.seite <= b), k).toBe(false);
      expect(x.seite).toBeGreaterThanOrEqual(7);
    }
  });
  it('Stärke je Spalte: Pflegefachperson höchstens abgeleitet; 3.-Drittel-Stelle deckt nicht das 1.', () => {
    const vital = NACHWEIS['rr-messen']!;
    expect(spaltenStaerke(vital, 1)).toBe('ausdruecklich');
    expect(spaltenStaerke(vital, 'pflegefachperson')).toBe('abgeleitet');
    const peak = NACHWEIS['peak-flow']!;
    expect(spaltenStaerke(peak, 1)).toBe('nicht-belegt');
    expect(spaltenStaerke(peak, 3)).toBe('ausdruecklich');
    expect(staerke(peak)).toBe('nicht-belegt');
  });
  it('Matrix enthält alle Maßnahmen und die Zusammenfassung zum 1./2. Drittel', () => {
    const md = befugnisMatrix();
    for (const m of KATALOG_LISTE) expect(md).toContain(m.name.replace(/\|/g, '/'));
    expect(md).toContain('Unterschied 1. ↔ 2. Drittel nur Konzept-Grundwert');
    const ziel = process.env.BEFUGNIS_MATRIX;
    if (ziel) writeFileSync(ziel, md);
  });
});

describe('Einrichtungsprofil', () => {
  const profil: EinrichtungsProfil = {
    id: 'test', name: 'Testklinik',
    abweichungen: {
      'bz-messen': { 1: 'selbst' },
      'zugang-legen': { pflegefachperson: 'selbst' },
      'zvk-legen': { pflegefachperson: 'selbst' },
      'gibt-es-nicht': { 1: 'selbst' },
    },
  };
  it('prüft unbekannte Maßnahmen und ärztliche Vorbehalte', () => {
    const f = pruefeProfil(profil).map((x) => x.massnahme);
    expect(f).toContain('zvk-legen');
    expect(f).toContain('gibt-es-nicht');
    expect(f).not.toContain('bz-messen');
  });
  it('Grundwerte einstellbar, Vorbehalte bleiben', () => {
    expect(grundBefugnis('bz-messen', 1)).toBe('mit-anleitung');
    expect(grundBefugnis('bz-messen', 1, profil)).toBe('selbst');
    expect(grundBefugnis('zugang-legen', 'pflegefachperson', profil)).toBe('selbst');
    expect(grundBefugnis('zvk-legen', 'pflegefachperson', profil)).toBe('nur-aerztlich');
  });
  it('wirkt im Kern über den Fall, replay-fest, Fall-Überschreibung hat Vorrang', () => {
    const fall = mitEinrichtung(FALL, profil);
    expect(freigabe(start(FALL, 1, 2), massnahme(FALL, 'bz-messen')!)).toBe('mit-pa');
    expect(freigabe(start(fall, 1, 2), massnahme(fall, 'bz-messen')!)).toBe('frei');
    const eingaben = [{ art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' }] as const;
    expect(replay(fall, 1, 2, 1, eingaben).t).toBe(replay(fall, 1, 2, 1, eingaben).t);
    const mitFall = mitEinrichtung({ ...FALL, befugnisUeberschreibung: { 'bz-messen': { 1: 'gesperrt' } } }, profil);
    expect(mitFall.befugnisUeberschreibung?.['bz-messen']?.[1]).toBe('gesperrt');
    expect(FALL.befugnisUeberschreibung).toBeUndefined();
  });
});
