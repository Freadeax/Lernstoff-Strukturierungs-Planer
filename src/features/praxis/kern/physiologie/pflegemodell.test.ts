import { describe, expect, it } from 'vitest';
import { herz as herzLernseite, lunge as lungeLernseite } from '../../../physiologie/modelle';
import { NORMAL, type ModellKontext } from '../modell';
import type { AktiverTreiber, Altersgruppe, Anzeige, Grundgroessen, Treiber } from '../typen';
import { vitalNormal } from '../../../../ui/sim/vitalnormen';
import { ALTERSPROFILE, fruehwarnung } from './altersprofile';
import { herz, lunge } from './organe';
import { atmung, befinden, kreislauf, lagerungsWirkung, opioidWirkung, PFLEGE_MODELL, ruheAnzeige } from './pflegemodell';

const GRUPPEN = Object.keys(ALTERSPROFILE) as Altersgruppe[];

interface Lauf { g: Grundgroessen; a: Anzeige; k: ModellKontext; treiber: AktiverTreiber[] }

/** Lässt das Modell wie der Kern laufen (Takt dt, Treiber seit 0, Basis = Start). */
function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], start: Partial<Grundgroessen> = {}, dt = 5, wirkung: ModellKontext['wirkung'] = {}): Lauf {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  let t = 0;
  while (t < minuten * 60) {
    g = PFLEGE_MODELL.naechster(g, tr, dt, { altersgruppe: ag, t, basis, wirkung });
    t += dt;
  }
  const k: ModellKontext = { altersgruppe: ag, t, basis, wirkung };
  return { g, a: PFLEGE_MODELL.anzeige(g, k), k, treiber: tr };
}

describe('Pflege-Physiologiemodell: Ruhewerte und Altersprofile', () => {
  it('Ruhewerte jeder Altersgruppe liegen im Normalbereich des gemeinsamen Vertrags', () => {
    for (const ag of GRUPPEN) {
      const a = ruheAnzeige(ag);
      const ng = ag === 'kleinkind' || ag === 'schulkind' ? ag : ag === 'saeugling' ? undefined : 'erwachsen';
      expect(a.spo2, ag).toBeGreaterThanOrEqual(96);
      expect(a.avpu).toBe('A');
      expect(a.gcs).toBe(15);
      expect(a.rhythmus).toBe('sinus');
      if (!ng) continue;
      for (const [id, wert] of [['puls', a.hf], ['af', a.af], ['sys', a.rrSys]] as const) {
        const n = vitalNormal(id, ng)!;
        if (n.min !== undefined) expect(wert, `${ag} ${id}`).toBeGreaterThanOrEqual(n.min);
        if (n.max !== undefined) expect(wert, `${ag} ${id}`).toBeLessThanOrEqual(n.max);
      }
    }
  });
  it('gesunde Erwachsene und Hochbetagte haben NEWS2 0, Säuglinge kein Profil', () => {
    for (const ag of ['erwachsen', 'hochbetagt', 'jugendlich'] as const) expect(fruehwarnung(ruheAnzeige(ag), ag, false, false).punkte).toBe(0);
    expect(fruehwarnung(ruheAnzeige('saeugling'), 'saeugling', false, false).system).toBe('kein Profil');
    expect(fruehwarnung(ruheAnzeige('kleinkind'), 'kleinkind', false, false).system).toBe('Kinderprofil');
  });
  it('ohne Treiber bleibt alles stabil (Gleichgewicht)', () => {
    for (const ag of GRUPPEN) {
      const { g } = lauf(ag, 120);
      for (const k of Object.keys(NORMAL) as Array<keyof Grundgroessen>) expect(g[k], `${ag} ${k}`).toBeCloseTo(NORMAL[k] as number, 3);
    }
  });
});

describe('Pflege-Physiologiemodell: Treiber fachlich plausibel', () => {
  // Jede Treiber-Art braucht hier einen Eintrag (Record erzwingt das beim Typprüfen).
  const PLAUSI: Record<Treiber['art'], () => void> = {
    blutung: () => {
      const r = lauf('erwachsen', 0);
      const k2 = lauf('erwachsen', 14, [{ art: 'blutung', mlProMin: 100 }]);   // ≈ 27 % Verlust: Klasse II
      const k3 = lauf('erwachsen', 20, [{ art: 'blutung', mlProMin: 100 }]);   // ≈ 38 %: Klasse III
      expect(k2.a.hf).toBeGreaterThan(100);
      expect(k2.a.rrSys).toBeGreaterThan(100);                 // Druck noch gehalten
      expect(k2.a.rekapSek!).toBeGreaterThan(r.a.rekapSek!);   // Zentralisation zuerst
      expect(k3.a.hf).toBeGreaterThan(120);
      expect(k3.a.rrSys).toBeLessThan(100);
    },
    bronchospasmus: () => {
      const { a, g, k, treiber } = lauf('erwachsen', 10, [{ art: 'bronchospasmus', staerke: 1 }]);
      expect(a.af).toBeGreaterThan(25);
      expect(a.spo2).toBeLessThanOrEqual(92);
      expect(a.hf).toBeGreaterThan(100);
      expect(befinden(g, treiber, k).atemgeraeusch).toBe('abgeschwaecht'); // stille Lunge
      const leicht = lauf('schulkind', 10, [{ art: 'bronchospasmus', staerke: 0.5 }]);
      expect(befinden(leicht.g, leicht.treiber, leicht.k).atemgeraeusch).toBe('atem-giemen');
    },
    hypoglykaemie: () => {
      const r = lauf('erwachsen', 60, [{ art: 'hypoglykaemie', abfallProStunde: 60 }]);
      expect(r.a.bz).toBeLessThan(45);
      expect(r.a.avpu).not.toBe('A');
      expect(befinden(r.g, r.treiber, r.k).haut).toBe('blass-kaltschweissig');
    },
    sepsis_verlauf: () => {
      const r = lauf('erwachsen', 180, [{ art: 'sepsis_verlauf', tempo: 1 }]);
      expect(r.a.temp).toBeGreaterThanOrEqual(38.5);
      expect(r.a.hf).toBeGreaterThan(110);
      expect(r.a.rrSys).toBeLessThan(100);
      expect(r.a.rrSys - r.a.rrDia!).toBeGreaterThanOrEqual(40);  // Vasodilatation: Diastole fällt stärker
      expect(fruehwarnung(r.a, 'erwachsen', false, false).punkte!).toBeGreaterThanOrEqual(5);
      const alt = lauf('hochbetagt', 180, [{ art: 'sepsis_verlauf', tempo: 1 }]);
      expect(alt.a.temp).toBeLessThan(r.a.temp);                  // Hochbetagte fiebern weniger
    },
    opioid_ueberhang: () => {
      const r = lauf('erwachsen', 15, [{ art: 'opioid_ueberhang', spiegel: 1, halbwertMin: 180 }]);
      expect(r.a.af).toBeLessThanOrEqual(9);
      expect(r.a.spo2).toBeLessThan(90);
      expect(r.a.avpu).not.toBe('A');
      expect(atmung(r.g, r.k).paCO2).toBeGreaterThan(60);
      // Halbwertszeit: nach 4 Halbwertszeiten wieder wach
      expect(lauf('erwachsen', 720, [{ art: 'opioid_ueberhang', spiegel: 1, halbwertMin: 180 }]).a.avpu).toBe('A');
    },
    naloxon: () => {
      const op: Treiber = { art: 'opioid_ueberhang', spiegel: 1, halbwertMin: 240 };
      const mit = (min: number) => lauf('erwachsen', min, [op, { art: 'naloxon', halbwertMin: 60 }]);
      const ohne = lauf('erwachsen', 10, [op]);
      expect(mit(10).g.vigilanz).toBeGreaterThan(ohne.g.vigilanz + 0.3);
      expect(mit(150).g.vigilanz).toBeLessThan(mit(10).g.vigilanz - 0.1);       // Renarkotisierung
    },
    insulin: () => {
      const r = (min: number) => lauf('erwachsen', min, [{ art: 'insulin', ie: 4 }], { blutzucker: 250 }).a.bz!;
      expect(r(60)).toBeGreaterThan(r(240));
      expect(250 - r(600)).toBeGreaterThan(140);    // 4 IE × 40 mg/dl wie im Lernmodell
      expect(250 - r(600)).toBeLessThan(165);
    },
    kohlenhydrate: () => {
      const schnell = lauf('erwachsen', 15, [{ art: 'kohlenhydrate', gramm: 20, schnell: true }], { blutzucker: 50 });
      const mahl = lauf('erwachsen', 15, [{ art: 'kohlenhydrate', gramm: 20 }], { blutzucker: 50 });
      expect(schnell.a.bz!).toBeGreaterThan(mahl.a.bz!);
      expect(lauf('erwachsen', 300, [{ art: 'kohlenhydrate', gramm: 20, schnell: true }], { blutzucker: 50 }).a.bz!).toBeGreaterThan(110);
    },
    exsikkose_progressiv: () => {
      const r = lauf('hochbetagt', 600, [{ art: 'exsikkose_progressiv', verlustProStunde: 0.02 }]);
      expect(r.g.hydratation).toBeLessThan(0.82);
      expect(r.a.rekapSek!).toBeGreaterThan(2);
      expect(befinden(r.g, r.treiber, r.k).schwindelBeimAufstehen).toBe(true);
    },
    delir_trigger: () => {
      const start = { hydratation: 0.78 };
      const mit = lauf('hochbetagt', 60, [{ art: 'delir_trigger', ausloeser: ['exsikkose'] }], start);
      const jung = lauf('erwachsen', 60, [{ art: 'delir_trigger', ausloeser: ['exsikkose'] }], start);
      expect(mit.g.delir).toBeGreaterThan(0.3);
      expect(mit.g.delir).toBeGreaterThan(jung.g.delir);         // Hochbetagte anfälliger
      expect(befinden(mit.g, mit.treiber, mit.k).neuVerwirrt).toBe(true);
      expect(lauf('hochbetagt', 60, [{ art: 'delir_trigger', ausloeser: ['exsikkose'] }]).g.delir).toBe(0);
    },
    harnverhalt: () => {
      const r = lauf('hochbetagt', 60, [{ art: 'harnverhalt' }, { art: 'delir_trigger', ausloeser: ['harnverhalt'] }]);
      expect(r.g.schmerz).toBeGreaterThan(2);
      expect(r.g.unruhe).toBeGreaterThan(0.25);
      expect(r.g.delir).toBeGreaterThan(0.3);
    },
    panik_eskaliert: () => {
      const r = lauf('jugendlich', 30, [{ art: 'panik_eskaliert', tempo: 2 }]);
      expect(r.g.angst).toBeGreaterThan(0.5);
      expect(r.a.af).toBeGreaterThan(20);
      expect(atmung(r.g, r.k).paCO2).toBeLessThan(35);     // Hyperventilation
      const voll = lauf('erwachsen', 60, [{ art: 'panik_eskaliert', tempo: 2 }]);
      expect(voll.a.hf).toBeGreaterThanOrEqual(110);          // Panikattacke: deutliche Tachykardie
      expect(voll.a.af).toBeGreaterThanOrEqual(26);
    },
    anaphylaxie: () => {
      // P16a: Blutdruck fällt, Puls steigt, Giemen und Atemnot; Adrenalin i. m. hebt den Blutdruck für eine Weile
      const r = lauf('erwachsen', 0, [], { gefaesstonus: 0.75 });
      const ohne = lauf('erwachsen', 20, [{ art: 'anaphylaxie', staerke: 0.8 }], { gefaesstonus: 0.75 });
      expect(ohne.a.rrSys).toBeLessThan(r.a.rrSys - 15);
      expect(ohne.a.hf).toBeGreaterThan(r.a.hf + 10);
      expect(ohne.a.af).toBeGreaterThan(22);
      expect(befinden(ohne.g, ohne.treiber, ohne.k).atemgeraeusch).toBe('atem-giemen');
      const mit = lauf('erwachsen', 20, [{ art: 'anaphylaxie', staerke: 0.8 }, { art: 'wirkstoff', id: 'adrenalin', dosisMg: 0.5, weg: 'im' }], { gefaesstonus: 0.75 });
      expect(mit.a.rrSys).toBeGreaterThan(ohne.a.rrSys + 10);
      expect(mit.a.spo2).toBeGreaterThanOrEqual(ohne.a.spo2);
    },
    fieberkrampf_kind: () => {
      const tr: Treiber[] = [{ art: 'fieberkrampf_kind', temperaturSchwelle: 39.5 }];
      const verlauf = [20, 38, 42, 60, 180].map((m) => lauf('kleinkind', m, tr, { temperatur: 38.6 }));
      expect(verlauf[0].g.krampf).toBe(0);
      const anfall = verlauf.findIndex((r) => r.g.krampf > 0);
      expect(anfall).toBeGreaterThan(0);
      expect(verlauf[anfall].a.avpu).not.toBe('A');
      expect(verlauf[anfall].a.spo2).toBeLessThanOrEqual(90);  // Hypoventilation im Anfall
      expect(PFLEGE_MODELL.anzeige({ ...verlauf[anfall].g, sauerstoff: 4 }, verlauf[anfall].k).spo2).toBeGreaterThanOrEqual(94);
      expect(verlauf[4].g.krampf).toBeLessThan(0);            // nur ein Anfall, danach postiktal
      expect(verlauf[4].a.avpu).toBe('A');
    },
    wirkstoff: () => {
      // Ausführlich in wirkstoffe.test.ts; hier: übliche Dosis Morphin s. c. lindert Schmerz ohne Atemdepression
      const r = lauf('erwachsen', 45, [{ art: 'wirkstoff', id: 'morphin', dosisMg: 10, weg: 'sc' }], { schmerz: 7 });
      expect(r.g.schmerz).toBeLessThan(4);
      expect(r.a.af).toBeGreaterThanOrEqual(10);
    },
    pneumonie: () => {
      const r = lauf('erwachsen', 120, [{ art: 'pneumonie', staerke: 1 }]);
      expect(r.a.spo2).toBeLessThanOrEqual(93);                  // NEWS2: mindestens 2 Punkte
      expect(r.a.temp).toBeGreaterThanOrEqual(38.2);
      expect(befinden(r.g, r.treiber, r.k).atemgeraeusch).toBe('atem-rg');
      const o2 = PFLEGE_MODELL.anzeige({ ...r.g, sauerstoff: 2 }, r.k);
      expect(o2.spo2).toBeGreaterThanOrEqual(94);
    },
  };
  for (const [art, pruefe] of Object.entries(PLAUSI)) it(art, pruefe);
});

describe('Pflege-Physiologiemodell: Kopplungen und Monotonie', () => {
  const k: ModellKontext = { altersgruppe: 'erwachsen' };
  const a = (g: Partial<Grundgroessen>) => PFLEGE_MODELL.anzeige({ ...NORMAL, ...g }, k);
  const reihe = (von: number, bis: number, n = 12) => Array.from({ length: n }, (_, i) => von + ((bis - von) * i) / (n - 1));
  const fallend = (xs: number[]) => xs.every((x, i) => i === 0 || x <= xs[i - 1]);
  const steigend = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]);

  it('weniger Volumen: Puls steigt, Blutdruck fällt, Rekap wird länger', () => {
    const v = reihe(1, 0.45);
    expect(steigend(v.map((x) => a({ volumen: x }).hf))).toBe(true);
    expect(fallend(v.map((x) => a({ volumen: x }).rrSys))).toBe(true);
    expect(steigend(v.map((x) => a({ volumen: x }).rekapSek!))).toBe(true);
  });
  it('weniger Gefäßtonus: Mitteldruck fällt', () => {
    expect(fallend(reihe(1, 0.35).map((x) => a({ gefaesstonus: x }).map!))).toBe(true);
  });
  it('schlechterer Gasaustausch: SpO₂ fällt; mehr Sauerstoff: SpO₂ steigt', () => {
    expect(fallend(reihe(1, 0.3).map((x) => a({ gasaustausch: x }).spo2))).toBe(true);
    expect(steigend(reihe(0, 6, 7).map((l) => a({ gasaustausch: 0.6, sauerstoff: l }).spo2))).toBe(true);
  });
  it('weniger Atemantrieb: CO₂ steigt, Atemfrequenz fällt', () => {
    const r = reihe(1, 0.3);
    expect(steigend(r.map((x) => atmung({ ...NORMAL, atemantrieb: x }, k).paCO2))).toBe(true);
    expect(fallend(r.map((x) => a({ atemantrieb: x }).af))).toBe(true);
  });
  it('Fieber: Puls und Atemfrequenz steigen', () => {
    const t = reihe(36.8, 40.5, 8);
    expect(steigend(t.map((x) => a({ temperatur: x }).hf))).toBe(true);
    expect(steigend(t.map((x) => a({ temperatur: x }).af))).toBe(true);
  });
  it('Vigilanz-Ursachen: tieferer Blutzucker → tiefere Vigilanz nach einer Minute', () => {
    const v = reihe(110, 25, 10).map((bz) => lauf('erwachsen', 3, [], { blutzucker: bz }).g.vigilanz);
    expect(fallend(v)).toBe(true);
  });
  it('O₂ hilft bei Hypoventilation viel, bei Shunt wenig', () => {
    const hypovent = { atemantrieb: 0.5 };
    const shunt = { gasaustausch: 0.3 };
    const gewinn = (g: Partial<Grundgroessen>) => a({ ...g, sauerstoff: 2 }).spo2 - a(g).spo2;
    expect(gewinn(hypovent)).toBeGreaterThan(gewinn(shunt));
  });
  it('O₂ verdeckt die Hypoventilation: SpO₂ gut, CO₂ hoch, Vigilanz sinkt', () => {
    const r = lauf('erwachsen', 15, [{ art: 'opioid_ueberhang', spiegel: 1, halbwertMin: 240 }], { sauerstoff: 2 });
    expect(r.a.spo2).toBeGreaterThanOrEqual(94);
    expect(atmung(r.g, r.k).paCO2).toBeGreaterThan(65);
    expect(r.a.avpu).not.toBe('A');
  });
  it('schwere Hypoxie beim Säugling führt zur Bradykardie', () => {
    const s = (gas: number) => PFLEGE_MODELL.anzeige({ ...NORMAL, gasaustausch: gas, atemantrieb: 0.4 }, { altersgruppe: 'saeugling' });
    expect(s(0.15).hf).toBeLessThan(s(0.6).hf);
    expect(s(0.15).rhythmus).toBe('sinusbradykardie');
  });
  it('Hochbetagte: Volumenmangel senkt den Blutdruck deutlicher (Vorlastabhängigkeit, schwacher Reflex)', () => {
    const abfall = (ag: Altersgruppe) => ruheAnzeige(ag).rrSys - PFLEGE_MODELL.anzeige({ ...NORMAL, volumen: 0.8 }, { altersgruppe: ag }).rrSys;
    expect(abfall('hochbetagt')).toBeGreaterThan(abfall('erwachsen') + 15);
  });
  it('Hochbetagte: schwächerer Pulsanstieg bei gleichem Volumenverlust', () => {
    const anstieg = (ag: Altersgruppe) => PFLEGE_MODELL.anzeige({ ...NORMAL, volumen: 0.75 }, { altersgruppe: ag }).hf - ruheAnzeige(ag).hf;
    expect(anstieg('hochbetagt')).toBeLessThan(anstieg('erwachsen'));
  });
});

describe('Pflege-Physiologiemodell: Wirkkurven, Determinismus, Lernseite', () => {
  it('laufende Wirkkurven werden nicht weggeregelt (Ziel = Basis + Treiber + wirkung)', () => {
    const r = lauf('erwachsen', 30, [], { vigilanz: 1 }, 5, { vigilanz: -0.3, temperatur: -0.6 });
    expect(r.g.vigilanz).toBeCloseTo(0.7, 2);
    expect(r.g.temperatur).toBeLessThan(36.6);
  });
  it('deterministisch: gleiche Eingaben, gleiche Werte', () => {
    const tr: Treiber[] = [{ art: 'sepsis_verlauf', tempo: 1 }, { art: 'delir_trigger', ausloeser: ['infekt'] }];
    expect(JSON.stringify(lauf('hochbetagt', 90, tr))).toBe(JSON.stringify(lauf('hochbetagt', 90, tr)));
  });
  it('kaum abhängig von der Schrittweite (5 s gegen 1 s)', () => {
    const tr: Treiber[] = [{ art: 'blutung', mlProMin: 60 }, { art: 'opioid_ueberhang', spiegel: 0.6, halbwertMin: 120 }, { art: 'kohlenhydrate', gramm: 30 }];
    const a = lauf('erwachsen', 20, tr, {}, 5).a;
    const b = lauf('erwachsen', 20, tr, {}, 1).a;
    for (const key of ['hf', 'rrSys', 'af', 'spo2', 'bz'] as const) expect(Math.abs((a[key] as number) - (b[key] as number)), key).toBeLessThanOrEqual(2);
  });
  it('Opioidspiegel halbiert sich je Halbwertszeit', () => {
    const tr: AktiverTreiber[] = [{ art: 'opioid_ueberhang', spiegel: 1, halbwertMin: 60, seit: 600 }];
    expect(opioidWirkung(tr, { altersgruppe: 'erwachsen', t: 600 + 3600 })).toBeCloseTo(0.5, 5);
  });
  it('Lernseite und Simulator rechnen mit demselben Herz- und Lungenmodell', () => {
    expect(herzLernseite).toBe(herz);
    expect(lungeLernseite).toBe(lunge);
    expect(kreislauf(NORMAL, { altersgruppe: 'erwachsen' }).map).toBe(herz({ hf: 70, vorlast: 50, nachlast: 50, kraft: 50, betablocker: false, aceHemmer: false, diuretikum: false }).map);
  });
  it('Lagerung nach dem Lungenmodell: gesunde Seite nach unten hilft bei Pneumonie rechts', () => {
    expect(lagerungsWirkung('pneumonie-rechts', 'seite-links')).toBeGreaterThan(0);
    expect(lagerungsWirkung('pneumonie-rechts', 'seite-rechts')).toBeLessThan(0);
  });
});

describe('Pflege-Physiologiemodell: Plausibilität des Pulses', () => {
  it('Hochbetagte mit Fieber 39–40 °C (Pneumonie): HF ≤ 135 auch nach einer Stunde', () => {
    for (const temperatur of [39, 39.5, 40]) {
      const r = lauf('hochbetagt', 60, [{ art: 'pneumonie', staerke: 1 }], { temperatur });
      expect(r.a.hf, `${temperatur} °C`).toBeLessThanOrEqual(135);
      expect(r.a.hf, `${temperatur} °C`).toBeGreaterThan(ruheAnzeige('hochbetagt').hf + 15);
    }
  });
  it('Sepsis mit Schock bei Erwachsenen: Sinustachykardie sättigt (HF ≤ 160 bei MAP um 55)', () => {
    const r = lauf('erwachsen', 60, [{ art: 'sepsis_verlauf', tempo: 1.4 }],
      { gasaustausch: 0.5, atemarbeit: 1.3, gefaesstonus: 0.72, volumen: 0.9, temperatur: 38.8, angst: 0.25 });
    expect(r.a.map!).toBeLessThan(65);
    expect(r.a.hf).toBeGreaterThan(130);
    expect(r.a.hf).toBeLessThanOrEqual(160);
  });
  it('Atemnot allein steigert die Angst bis zu einer Decke, nicht bis zur Panik', () => {
    const r = lauf('erwachsen', 90, [{ art: 'pneumonie', staerke: 1.4 }]);
    expect(r.g.angst).toBeGreaterThan(0.2);
    expect(r.g.angst).toBeLessThan(0.6);
  });
  it('der Puls folgt der Angst (auch unterhalb der Panikschwelle)', () => {
    const hf = (angst: number) => PFLEGE_MODELL.anzeige({ ...NORMAL, angst }, { altersgruppe: 'erwachsen' }).hf;
    expect(hf(0.4)).toBeGreaterThan(hf(0));
    expect(hf(0.58)).toBeGreaterThan(hf(0.4));
    expect(hf(0.9)).toBeGreaterThan(hf(0.58) + 15);
  });
});
