import { describe, expect, it } from 'vitest';
import { FELDER, RISIKEN, SIS_FAELLE } from './faelle';
import { leereFelder, leereMatrix, musterMatrix, pruefeMatrix, pruefeSis } from './pruefung';

const fall = (id: string) => SIS_FAELLE.find((f) => f.id === id)!;

describe('Musterlösungen', () => {
  for (const f of SIS_FAELLE) {
    it(`${f.id}: Beispiel-SIS erfüllt alle Kernpunkte im richtigen Feld und die Matrix`, () => {
      const e = pruefeSis(f, f.muster, musterMatrix(f));
      const nichtOk = e.felder.flatMap((x) => x.punkte).filter((p) => p.status !== 'ok').map((p) => `${p.punkt.feld}/${p.punkt.id}: ${p.status}`);
      expect(nichtOk).toEqual([]);
      expect(e.matrix.filter((m) => m.status !== 'richtig').map((m) => m.zeile.risiko)).toEqual([]);
      expect(e.prozent).toBe(100);
      expect(e.hinweise).toEqual([]);
    });
    it(`${f.id}: Fall ist vollständig aufgebaut`, () => {
      expect(new Set(f.kernpunkte.map((k) => k.id)).size).toBe(f.kernpunkte.length);
      expect(f.matrix.map((m) => m.risiko)).toEqual(RISIKEN);
      for (const feld of FELDER) {
        expect(f.kernpunkte.some((k) => k.feld === feld && k.pflicht), `${feld} braucht einen Pflichtpunkt`).toBe(true);
        expect(f.muster[feld].trim().length).toBeGreaterThan(0);
      }
      for (const z of f.matrix) if (z.vorhanden !== 'nein') expect(z.themenfelder.length, z.risiko).toBeGreaterThan(0);
    });
  }
  it('Fall-IDs sind eindeutig', () => {
    expect(new Set(SIS_FAELLE.map((f) => f.id)).size).toBe(SIS_FAELLE.length);
  });
});

describe('pruefeSis', () => {
  it('leere SIS: 0 %, Hinweise auf Feld B, Themenfelder und Matrix', () => {
    const e = pruefeSis(fall('sommer'), leereFelder(), leereMatrix());
    expect(e.prozent).toBe(0);
    expect(e.matrixVollstaendig).toBe(false);
    expect(e.hinweise.join(' ')).toMatch(/Feld B ist leer/);
    expect(e.hinweise.join(' ')).toMatch(/Themenfeld 1, 2, 3, 4, 5, 6/);
    expect(e.hinweise.join(' ')).toMatch(/Risikomatrix/);
  });
  it('Kernpunkt im falschen Themenfeld zählt halb', () => {
    const felder = { ...leereFelder(), TF2: 'Hörgerät links' };
    const e = pruefeSis(fall('sommer'), felder, leereMatrix());
    const p = e.felder.find((x) => x.feld === 'TF1')!.punkte.find((x) => x.punkt.id === 'tf1-hoeren')!;
    expect(p.status).toBe('falsches-feld');
    expect(p.gefundenIn).toBe('TF2');
  });
  it('erkennt Fachsprache und fehlende Ich-Perspektive in Feld B', () => {
    const e = pruefeSis(fall('sommer'), { ...leereFelder(), B: 'Bewohnerin hat ein Sturzrisiko und eingeschränkte Mobilität.' }, leereMatrix());
    expect(e.hinweise.some((h) => h.includes('wörtlich'))).toBe(true);
    expect(e.hinweise.some((h) => h.includes('Fachsprache') && h.includes('mobilitaet'))).toBe(true);
  });
  it('findet wertende Begriffe, aber nicht „Sturz“ als „stur“', () => {
    const e = pruefeSis(fall('sommer'), { ...leereFelder(), TF2: 'Sturz vor 6 Wochen.', TF4: 'Sie ist uneinsichtig und stur.' }, leereMatrix());
    expect(e.wertend.sort()).toEqual(['stur ', 'uneinsichtig']);
  });
});

describe('pruefeMatrix', () => {
  it('bewertet ja/nein, weitere Einschätzung und Themenfeld', () => {
    const m = leereMatrix();
    m.sturz = { vorhanden: 'ja', weitere: 'nein', themenfelder: ['TF5'], welches: '' };
    m.dekubitus = { vorhanden: 'nein', weitere: 'nein', themenfelder: [], welches: '' };
    const e = pruefeMatrix(fall('sommer'), m);
    const sturz = e.find((x) => x.zeile.risiko === 'sturz')!;
    expect(sturz).toMatchObject({ vorhandenOk: true, weitereOk: false, themenfelderOk: false, status: 'teilweise', punkte: 2, max: 4 });
    expect(e.find((x) => x.zeile.risiko === 'dekubitus')!.status).toBe('richtig');
    expect(e.find((x) => x.zeile.risiko === 'schmerz')!.status).toBe('offen');
  });
  it('„beides“ lässt ja und nein gelten', () => {
    const f = fall('yildiz');
    for (const v of ['ja', 'nein'] as const) {
      const m = musterMatrix(f);
      m.sonstiges = { vorhanden: v, weitere: v, themenfelder: v === 'ja' ? ['TF3'] : [], welches: v === 'ja' ? 'Aspiration' : '' };
      expect(pruefeMatrix(f, m).find((x) => x.zeile.risiko === 'sonstiges')!.status).toBe('richtig');
    }
  });
  it('Sonstiges verlangt das passende Risiko', () => {
    const f = fall('wolf');
    const m = musterMatrix(f);
    m.sonstiges = { ...m.sonstiges, welches: 'Kontrakturen' };
    expect(pruefeMatrix(f, m).find((x) => x.zeile.risiko === 'sonstiges')!).toMatchObject({ welchesOk: false, status: 'teilweise' });
  });
});

describe('Lernplan-Verknüpfung', async () => {
  const { uebungenFuer } = await import('../lernplan/trainer');
  it('SIS-Thema führt zum SIS-Trainer, jedes Thema zur Mindmap', () => {
    expect(uebungenFuer('thema.pp.sis').map((u) => u.path)).toContain('/lernen/sis');
    expect(uebungenFuer('thema.kl.diabetes').at(-1)?.trainer).toBe('mindmap');
    expect(uebungenFuer('thema.gibtsnicht')).toEqual([]);
  });
});
