import { describe, expect, it } from 'vitest';
import { aktiveItems, bmi, bmiPunkte, INSTRUMENTE, kategorie, minMax, summe, vollstaendig } from './instrumente';
import { GRUPPEN, VIGNETTEN } from './vignetten';
import { bewerteVignette, loesungsItems } from './bewertung';
import { pflegeModule } from '../../modules/pflege';

describe('Instrumente', () => {
  it('haben lückenlose Kategorien über den ganzen Punktebereich', () => {
    for (const instr of Object.values(INSTRUMENTE)) {
      const { min, max } = minMax(instr);
      // Barthel geht in Fünferschritten, die anderen in Einerschritten
      const schritt = instr.id === 'barthel' ? 5 : 1;
      for (let p = min; p <= max; p += schritt) expect(kategorie(instr, p), `${instr.id} ${p}`).toBeDefined();
    }
  });

  it('kennen die üblichen Spannweiten', () => {
    expect(minMax(INSTRUMENTE.braden)).toEqual({ min: 6, max: 23 });
    expect(minMax(INSTRUMENTE.barthel)).toEqual({ min: 0, max: 100 });
    expect(minMax(INSTRUMENTE.nrs)).toEqual({ min: 0, max: 10 });
    expect(minMax(INSTRUMENTE.besd)).toEqual({ min: 0, max: 10 });
    expect(minMax(INSTRUMENTE.mna)).toEqual({ min: 0, max: 14 });
  });

  it('tauscht beim MNA den BMI gegen den Wadenumfang', () => {
    expect(aktiveItems(INSTRUMENTE.mna).map((i) => i.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F1']);
    expect(aktiveItems(INSTRUMENTE.mna, new Set(['F2'])).map((i) => i.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F2']);
  });

  it('rechnet Summe, Vollständigkeit und Grenzwerte', () => {
    const items = aktiveItems(INSTRUMENTE.braden);
    expect(vollstaendig(items, { sensorik: 4 })).toBe(false);
    expect(summe(items, { sensorik: 4, feuchtigkeit: 4, aktivitaet: 4, mobilitaet: 4, ernaehrung: 1, reibung: 1 })).toBe(18);
    expect(kategorie(INSTRUMENTE.braden, 18)?.id).toBe('gering');
    expect(kategorie(INSTRUMENTE.braden, 12)?.id).toBe('hoch');
    expect(kategorie(INSTRUMENTE.besd, 2)?.id).toBe('wahrscheinlich');
    expect(kategorie(INSTRUMENTE.mna, 11)?.id).toBe('risiko');
    expect(kategorie(INSTRUMENTE.barthel, 85)?.id).toBe('selbst');
  });

  it('rechnet den BMI', () => {
    expect(bmi(61.5, 165)).toBe(22.6);
    expect(bmi(0, 165)).toBeNull();
    expect([18.9, 19, 20.9, 21, 22.9, 23].map(bmiPunkte)).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it('verweisen nur auf Blatt-Themen aus dem Katalog', () => {
    const ids = new Set(pflegeModule.topics.map((t) => t.id));
    const eltern = new Set(pflegeModule.topics.map((t) => t.parentId).filter(Boolean));
    for (const instr of Object.values(INSTRUMENTE)) {
      for (const t of instr.topicIds) { expect(ids.has(t), t).toBe(true); expect(eltern.has(t), t).toBe(false); }
    }
  });
});

describe('Fallvignetten', () => {
  it('haben eindeutige IDs und für jede Gruppe mindestens zwei Fälle', () => {
    expect(new Set(VIGNETTEN.map((v) => v.id)).size).toBe(VIGNETTEN.length);
    for (const g of GRUPPEN) expect(VIGNETTEN.filter((v) => v.gruppe === g.id).length).toBeGreaterThanOrEqual(2);
  });

  for (const v of VIGNETTEN) {
    it(`${v.id}: Musterlösung ist vollständig, gültig und passt zum Fazit`, () => {
      const instr = INSTRUMENTE[v.instrument];
      expect(GRUPPEN.find((g) => g.id === v.gruppe)!.instrumente).toContain(v.instrument);
      const ersatz = new Set(Object.keys(v.loesung).filter((id) => instr.items.find((i) => i.id === id)?.ersatzFuer));
      const items = aktiveItems(instr, ersatz);
      expect(Object.keys(v.loesung).sort()).toEqual(items.map((i) => i.id).sort());
      expect(loesungsItems(v).map((i) => i.id)).toEqual(items.map((i) => i.id));
      for (const item of items) {
        expect(item.stufen.map((s) => s.punkte), `${item.id}`).toContain(v.loesung[item.id]);
        expect(v.begruendung[item.id], `Begründung ${item.id}`).toBeTruthy();
      }
      const s = summe(items, v.loesung);
      // Das Fazit nennt die Summe zuerst, damit Text und Lösung nicht auseinanderlaufen
      if (v.instrument !== 'nrs') expect(v.fazit).toMatch(new RegExp(`^${s} Punkt`));
      expect(kategorie(instr, s)).toBeDefined();
      if (v.gruppe === 'schmerz') expect(v.instrumentWahl).toBeTruthy();
      if (v.koerper) expect(bmiPunkte(bmi(v.koerper.kg, v.koerper.cm)!)).toBe(v.loesung.F1);
    });
  }
});

describe('bewerteVignette', () => {
  const krueger = VIGNETTEN.find((v) => v.id === 'br-krueger')!;
  const schulz = VIGNETTEN.find((v) => v.id === 'sz-schulz')!;
  const peters = VIGNETTEN.find((v) => v.id === 'mna-peters')!;

  it('gibt für die Musterlösung volle Punkte', () => {
    const e = bewerteVignette(krueger, { werte: krueger.loesung, kategorie: 'hoch' });
    expect(e.summeSoll).toBe(12);
    expect(e.punkte).toBe(e.max);
    expect(e.max).toBe(7);
    expect(e.instrumentRichtig).toBeNull();
  });

  it('zählt Fehler je Item, falsche Einstufung und falsches Instrument', () => {
    const e = bewerteVignette(schulz, { werte: { ...schulz.loesung, trost: 2 }, kategorie: 'unauffaellig', instrument: 'nrs' });
    expect(e.zeilen.filter((z) => !z.richtig).map((z) => z.item.id)).toEqual(['trost']);
    expect(e.kategorieRichtig).toBe(false);
    expect(e.instrumentRichtig).toBe(false);
    expect(e.summeIst).toBe(9);
    expect(e.punkte).toBe(4);
    expect(e.max).toBe(7);
    expect(e.treffer.every((t) => t.topicIds.includes('thema.kl.demenz'))).toBe(true);
  });

  it('wertet BMI statt Wadenumfang als Fehler', () => {
    const { F2: _f2, ...rest } = peters.loesung;
    const e = bewerteVignette(peters, { werte: { ...rest, F1: 0 }, kategorie: 'mangel' });
    expect(e.zeilen.find((z) => z.item.id === 'F2')?.richtig).toBe(false);
    expect(e.kategorieRichtig).toBe(true);
  });
});

describe('Lernplan-Kopplung', () => {
  it('verlinkt passende Themen auf die Fallvignetten', async () => {
    const { uebungenFuer } = await import('../lernplan/trainer');
    expect(uebungenFuer('thema.pro.dekubitus').map((u) => u.path)).toContain('/lernen/assessment?gruppe=braden&modus=faelle');
    expect(uebungenFuer('thema.beo.bewusstsein').find((u) => u.trainer === 'assessment')?.path).toContain('gruppe=schmerz');
    expect(uebungenFuer('thema.pro.dehydratation').find((u) => u.trainer === 'assessment')?.path).toContain('gruppe=mna');
    expect(uebungenFuer('thema.kl.diabetes').some((u) => u.trainer === 'assessment')).toBe(false);
  });
});
