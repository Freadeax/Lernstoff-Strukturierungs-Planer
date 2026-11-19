import { describe, expect, it } from 'vitest';
import { LEHRPLAN } from '../ce/lehrplan';
import { ALTFALL_TITEL } from './altfaelle';
import { ABDECKUNG_OFFEN, abdeckungsLuecken, FALLPLAN, fallauswahl, planZaehler } from './fallplan';
import { FAELLE_V2 } from './kern/faelle';
import { KERN_THEMEN, kernZuThema } from './themen';

const CE = Object.keys(LEHRPLAN);

describe('Fallplan nach CE (P15)', () => {
  it('jeder Kernfall steht im Fallplan bei seiner Haupt-CE', () => {
    for (const f of FAELLE_V2) {
      const e = FALLPLAN.find((p) => p.fall === f.id);
      expect(e, f.id).toBeDefined();
      expect(e!.ce).toBe(f.lehrplan!.ce[0]);
    }
    for (const p of FALLPLAN.filter((x) => x.fall)) expect(FAELLE_V2.some((f) => f.id === p.fall), p.fall).toBe(true);
  });

  it('jeder Altfall ist genau einmal einem Plan-Eintrag zugeordnet', () => {
    const alt = FALLPLAN.flatMap((p) => p.alt ?? []);
    expect(new Set(alt).size).toBe(alt.length);
    expect([...alt].sort()).toEqual(Object.keys(ALTFALL_TITEL).sort());
    for (const p of FALLPLAN.filter((x) => x.alt?.length)) expect(p.fall, p.titel).toBeDefined();
  });

  it('Plan-Einträge: gültige CE, Abschnitt mit Stunden laut Lehrplan', () => {
    for (const p of FALLPLAN) {
      expect(LEHRPLAN[p.ce], p.titel).toBeDefined();
      for (const a of p.abschnitt) expect(LEHRPLAN[p.ce]!.stunden[a], `${p.titel}: ${p.ce} ${a}`).toBeDefined();
      if (p.art !== 'vorhanden') expect(p.paket, p.titel).toBeDefined();
    }
  });

  it('Abdeckung: jede CE ein Kernfall im 1./2. Drittel, CE04–CE11 einer im 3. Drittel; offene Lücken stimmen genau', () => {
    // Wird ein Fall fertig, die Lücke aus ABDECKUNG_OFFEN streichen.
    // Parallele Fallwellen: neue Lücken sind verboten; erledigte Einträge in ABDECKUNG_OFFEN dürfen stehen bleiben.
    for (const l of abdeckungsLuecken(CE, FAELLE_V2)) expect(ABDECKUNG_OFFEN, l).toContain(l);
  });

  it('KERN_THEMEN spiegelt fall.lehrplan.themen', () => {
    expect(Object.keys(KERN_THEMEN).sort()).toEqual(FAELLE_V2.map((f) => f.id).sort());
    for (const f of FAELLE_V2) expect(KERN_THEMEN[f.id], f.id).toEqual(f.lehrplan!.themen ?? []);
    for (const id of ['kh-pneumonie-sepsis', 'paed-fieberkrampf', 'psy-panik-suizidalitaet']) expect(kernZuThema('thema.re.schweigepflicht')).toContain(id);
  });

  it('Fallauswahl: Kernfälle zuerst, dann geplant; Drittel-Filter', () => {
    const [ce05] = fallauswahl(['ce.05'], FAELLE_V2);
    const arten = ce05!.eintraege.map((e) => e.art);
    expect(arten[0]).toBe('kern');
    for (const g of fallauswahl(CE, FAELLE_V2)) {
      const a = g.eintraege.map((e) => e.art);
      if (a.includes('geplant')) expect(a.lastIndexOf('kern'), g.ce).toBeLessThan(a.indexOf('geplant'));
    }
    // Schockraum nur im 3. Drittel
    const [ce06a] = fallauswahl(['ce.06'], FAELLE_V2, 'ad12');
    expect(ce06a!.eintraege.some((e) => e.art === 'kern' && e.id === 'sr-septischer-schock')).toBe(false);
    const [ce06b] = fallauswahl(['ce.06'], FAELLE_V2, 'ad3');
    expect(ce06b!.eintraege.find((e) => e.art === 'kern')?.art === 'kern' && (ce06b!.eintraege[0] as { id: string }).id).toBe('sr-septischer-schock');
  });

  it('Zähler je CE', () => {
    // Zählt mit, wenn Fallwellen Einträge erledigen: Summe bleibt die Zahl der Plan-Einträge.
    for (const ce of ['ce.01', 'ce.05']) {
      const z = planZaehler(ce);
      expect(z.vorhanden + z.geplant).toBe(FALLPLAN.filter((e) => e.ce === ce).length);
      expect(z.vorhanden).toBeGreaterThanOrEqual(1);
    }
  });
});
