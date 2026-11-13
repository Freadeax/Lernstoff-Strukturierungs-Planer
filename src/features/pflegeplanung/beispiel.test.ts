import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { beispielAlsPlan, vergleicheMitBeispiel } from './beispiel';
import { leererPlan } from './plan';
import { pruefe } from './pruefung';
import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';

describe('Beispiel-Planung als geprüfte Musterlösung', () => {
  it('liest P/E/S/R, Ziel mit Überprüfung und Maßnahme mit Wann/Wer/Begründung', () => {
    const plan = beispielAlsPlan(`P: Sturzgefahr
E: beeinflusst durch Schwindel
R: klingelt

Ziel: Frau X stürzt nicht. Überprüfung: täglich.
Maßnahme: Klingel in Reichweite
Wann: bei jeder Versorgung
Wer: Pflegefachperson
Begründung: Expertenstandard Sturzprophylaxe`);
    expect(plan.probleme).toEqual([{ id: 'p1', art: 'risiko', p: 'Sturzgefahr', e: 'beeinflusst durch Schwindel', s: '', r: 'klingelt' }]);
    expect(plan.ziele).toEqual([{ id: 'z1', problemId: 'p1', text: 'Frau X stürzt nicht.', termin: 'täglich' }]);
    expect(plan.massnahmen[0]).toMatchObject({ zielId: 'z1', was: 'Klingel in Reichweite', wann: 'bei jeder Versorgung', wer: 'Pflegefachperson', begruendung: 'Expertenstandard Sturzprophylaxe' });
  });

  for (const fall of FAELLE.filter((f) => f.beispiel)) {
    it(`${fall.id}: Beispiel besteht die Checkliste für Probleme, Ziele und Maßnahmen`, () => {
      const plan = beispielAlsPlan(fall.beispiel);
      expect(plan.probleme.length, 'mindestens ein Problem').toBeGreaterThan(0);
      for (const p of plan.probleme) expect(plan.ziele.some((z) => z.problemId === p.id), `Ziel zu ${p.p}`).toBe(true);
      for (const z of plan.ziele) expect(plan.massnahmen.some((m) => m.zielId === z.id), `Maßnahme zu ${z.text}`).toBe(true);

      const r = pruefe(fall, plan);
      for (const s of ['probleme', 'ziele', 'massnahmen'] as const) {
        const schritt = r.schritte.find((x) => x.schritt === s)!;
        const offen = schritt.befunde.filter((b) => b.schwere !== 'hinweis' || /^pp\.(pesr|fall\.art|fall\.massnahme)/.test(b.regelId));
        expect(offen.map((b) => b.text), s).toEqual([]);
      }
      // Jedes Problem im Beispiel ist eines der erwarteten Probleme des Falls, und seine Maßnahme wird erkannt
      for (const p of plan.probleme) {
        const t = suchtext(vereinfache(p.p));
        expect(fall.probleme.some((e) => findeMuster(t, e.muster) >= 0), `„${p.p}“ passt zu keinem erwarteten Problem`).toBe(true);
      }
      const getroffen = r.fallbezug!.probleme.filter((t) => t.gefunden);
      expect(getroffen.length).toBeGreaterThanOrEqual(plan.probleme.length > 1 ? 2 : 1);
      for (const t of getroffen) expect(t.massnahme, `Maßnahme zu ${t.erwartung.text}`).toBe(true);
    });
  }

  it('Vergleich zeigt je Beispiel-Problem, ob es auch in der eigenen Planung steht', () => {
    const fall = FAELLE.find((f) => f.id === 'huefte')!;
    const eigen = leererPlan();
    eigen.probleme[0]!.p = 'Akute Schmerzen im Hüftgelenk';
    const v = vergleicheMitBeispiel(fall, eigen);
    expect(v.map((x) => x.auchBeiDir)).toEqual([true, false]);
    expect(v[1]!.erwartung?.text).toMatch(/Sturz/);
    expect(v[0]!.massnahmen[0]!.wer).toBe('Pflegefachperson');
  });
});
