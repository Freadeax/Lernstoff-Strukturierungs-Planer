import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TRAINER_POOLS } from '../simulation/trainerpool';
import { fingerabdruck, kanonisch } from './fingerabdruck';
import { aufgabenStand, fingerabdruecke, PRUEFSTAND, pruefsumme, trainerStand, vergleiche, type LokalerVermerk, type Pruefstand } from './pruefstand';
import { TRAINER_REGISTER } from './register';
import type { AuswahlAufgabe } from '../quiz/quiz';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

describe('Prüfstand', () => {
  // Neu erfassen (bewusst, nicht im normalen Testlauf): QM_PRUEFSTAND_SCHREIBEN=1 npx vitest run src/features/qm/pruefstand.test.ts
  it.runIf(env.QM_PRUEFSTAND_SCHREIBEN === '1')('schreibt pruefstand.json', () => {
    const nur = env.QM_TRAINER?.split(',').filter(Boolean);
    const [am, von, rolle] = (env.QM_GEPRUEFT ?? '').split('|');
    const heute = new Date().toISOString().slice(0, 10);
    const neu: Pruefstand = { trainer: { ...PRUEFSTAND.trainer } };
    for (const p of TRAINER_POOLS) {
      if (nur && !nur.includes(p.quelle)) continue;
      const alt = neu.trainer[p.quelle];
      neu.trainer[p.quelle] = { erfasstAm: heute, geprueft: am && von && rolle ? { am, von, rolle } : alt?.geprueft ?? null, fps: fingerabdruecke(p.aufgaben) };
    }
    writeFileSync(fileURLToPath(new URL('./pruefstand.json', import.meta.url)), JSON.stringify(neu, null, 1) + '\n');
  });

  it('jeder Trainer der Simulation steht im Register und im Prüfstand', () => {
    for (const p of TRAINER_POOLS) {
      expect(TRAINER_REGISTER.map((e) => e.quelle), p.quelle).toContain(p.quelle);
      expect(PRUEFSTAND.trainer[p.quelle], `${p.quelle} fehlt in pruefstand.json – neu erfassen`).toBeTruthy();
    }
  });

  it('dauerhafte Prüfvermerke sind vollständig', () => {
    for (const [q, s] of Object.entries(PRUEFSTAND.trainer)) {
      if (s.geprueft) expect([s.geprueft.am, s.geprueft.von, s.geprueft.rolle].every(Boolean), q).toBe(true);
      expect(s.erfasstAm, q).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  const a: AuswahlAufgabe = { id: 'x', art: 'auswahl', topicIds: ['t'], titel: 'T', frage: 'F?', optionen: ['a', 'b', 'c'], richtig: [0], mehrfach: false, erklaerung: ['weil'] };

  it('Fingerabdruck reagiert auf Lösung und Text, nicht auf Vertiefung oder Stufe', () => {
    const fp = fingerabdruck(a);
    expect(fingerabdruck({ ...a, richtig: [1] })).not.toBe(fp);
    expect(fingerabdruck({ ...a, frage: 'F!' })).not.toBe(fp);
    expect(fingerabdruck({ ...a, vertiefung: ['mehr'], stufe: 2 })).toBe(fp);
    expect(kanonisch(a)).toContain('"F?"');
  });

  it('erkennt neue, geänderte und entfernte Aufgaben', () => {
    const fps = { x: fingerabdruck(a), y: 'deadbeef', alt: '00000000' };
    const v = vergleiche([a, { ...a, id: 'y' }, { ...a, id: 'z' }], fps);
    expect(v).toEqual({ neu: ['z'], geaendert: ['y'], entfernt: ['alt'], gleich: 1 });
  });

  it('Status: ungeprüft, geprüft, geändert, fällig; lokaler Vermerk gilt, wenn jünger', () => {
    const stand: Pruefstand = { trainer: { t: { erfasstAm: '2026-11-13', geprueft: null, fps: fingerabdruecke([a]) } } };
    expect(trainerStand('t', [a], '2026-11-14', stand).status).toBe('ungeprueft');
    const lokal: LokalerVermerk[] = [{ quelle: 't', am: '2026-11-14', von: 'P', rolle: 'PA', fps: fingerabdruecke([a]) }];
    const e = trainerStand('t', [a], '2026-11-20', stand, lokal);
    expect(e.status).toBe('geprueft');
    expect(e.pruefung?.lokal).toBe(true);
    expect(aufgabenStand(a, e)).toBe('geprueft');
    const geaendert = { ...a, richtig: [2] };
    const e2 = trainerStand('t', [geaendert], '2026-11-20', stand, lokal);
    expect(e2.status).toBe('geaendert');
    expect(aufgabenStand(geaendert, e2)).toBe('geaendert');
    expect(trainerStand('t', [a], '2028-01-01', stand, lokal).status).toBe('faellig');
  });

  it('Prüfsumme hängt nicht von der Reihenfolge ab', () => {
    expect(pruefsumme({ a: '1', b: '2' })).toBe(pruefsumme({ b: '2', a: '1' }));
    expect(pruefsumme({ a: '1', b: '2' })).not.toBe(pruefsumme({ a: '1', b: '3' }));
  });
});
