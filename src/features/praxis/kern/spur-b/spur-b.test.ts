import { describe, expect, it } from 'vitest';
import { deuteBga } from '../../../../ui/sim/labor/bga';
import { SR_SEPTISCHER_SCHOCK as FALL } from '../faelle/sr-septischer-schock';
import { anzeige, freigabe, massnahme, replay, sende, start, verfuegbar, type SimZustand } from '../kern';
import { NORMAL, type ModellKontext } from '../modell';
import { PFLEGE_MODELL } from '../physiologie/pflegemodell';
import type { Grundgroessen, ModellModule, SimEventEingabe } from '../typen';
import { alsLaborBga, bgaAusModell, po2AusSpo2 } from './bga';
import { monitorWerte } from './monitor';
import { wendeModulAn } from './modul';
import { SPUR_B_MODELL } from './standard';
import { dosis, laufrate, perfusorDosis } from './perfusor';

const BASIS = PFLEGE_MODELL;
const MODELL = SPUR_B_MODELL;
const SEPSIS: Grundgroessen = { ...NORMAL, volumen: 0.85, gefaesstonus: 0.6, laktat: 3, einfuhrMl: 0, ausfuhrMl: 0 };
const k = (module?: ModellModule): ModellKontext => ({ altersgruppe: 'erwachsen', gewichtKg: 75, ...(module ? { module } : {}) });
const na = (mlProH: number): ModellModule => ({ perfusoren: [{ id: 'na', wirkstoff: 'noradrenalin', konzentration: '5 mg/50 ml', mgProMl: 0.1, mlProH }] });
const laufe = (g: Grundgroessen, sek: number, kontext: ModellKontext) => { for (let t = 0; t < sek; t += 5) g = MODELL.naechster(g, [], 5, kontext); return g; };

function spiele(z: SimZustand, eingaben: SimEventEingabe[], wahl?: Record<string, string>): SimZustand {
  for (const e of eingaben) {
    while (z.offeneEntscheidung) {
      const ev = z.fall.ereignisse.find((x) => x.id === z.offeneEntscheidung)!;
      z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: wahl?.[ev.id] ?? ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
    }
    z = sende(z, e);
  }
  return z;
}

describe('Perfusor: Laufrate ↔ Dosis', () => {
  it('Noradrenalin 5 mg/50 ml, 0,1 µg/kg/min, 75 kg = 4,5 ml/h', () => {
    expect(laufrate(0.1, 0.1, 75, 'µg/kg/min')).toBeCloseTo(4.5);
    expect(dosis(4.5, 0.1, 75, 'µg/kg/min')).toBeCloseTo(0.1);
  });
  it('Propofol 10 mg/ml, 15 ml/h, 75 kg = 2 mg/kg/h', () => {
    expect(dosis(15, 10, 75, 'mg/kg/h')).toBeCloseTo(2);
    expect(perfusorDosis({ id: 'p', wirkstoff: 'propofol', konzentration: '1 %', mgProMl: 10, mlProH: 15 }, 75)).toEqual({ wert: 2, einheit: 'mg/kg/h' });
  });
  it('Laufrate und Dosis sind Umkehrungen', () => {
    for (const d of [0.05, 0.2, 0.37]) expect(dosis(laufrate(d, 0.2, 63, 'µg/kg/min'), 0.2, 63, 'µg/kg/min')).toBeCloseTo(d);
  });
});

describe('Eingriffe in die Module (rein)', () => {
  it('Perfusor anlegen, titrieren, stoppen; alte Module bleiben unverändert', () => {
    const a = wendeModulAn(undefined, { perfusor: { id: 'na', wirkstoff: 'noradrenalin', konzentration: '5 mg/50 ml', mgProMl: 0.1, mlProH: 4.5 } });
    const b = wendeModulAn(a, { perfusor: { id: 'na', mlProHDelta: 1 } });
    expect(a.perfusoren![0].mlProH).toBe(4.5);
    expect(b.perfusoren![0]).toMatchObject({ wirkstoff: 'noradrenalin', mgProMl: 0.1, mlProH: 5.5 });
    expect(wendeModulAn(b, { perfusor: { id: 'na', stopp: true } }).perfusoren).toEqual([]);
    expect(wendeModulAn(b, { perfusor: { id: 'na', mlProHDelta: -10 } }).perfusoren![0].mlProH).toBe(0);
  });
  it('Störungen an/aus, Beatmung setzen und beenden', () => {
    const a = wendeModulAn({}, { stoerungAn: ['sekret', 'art-gedaempft'], beatmung: { fio2: 0.5 } });
    expect(a.beatmung).toEqual({ fio2: 0.5, peep: 5, af: 14, vt: 500 });
    const b = wendeModulAn(a, { stoerungAus: ['sekret'], beatmung: null });
    expect(b.stoerungen).toEqual(['art-gedaempft']);
    expect(b.beatmung).toBeUndefined();
  });
});

describe('Hülle um das Basismodell', () => {
  it('ohne Module exakt das Basismodell', () => {
    for (const g of [NORMAL, SEPSIS, { ...NORMAL, atemantrieb: 0.5, blutzucker: 50 }]) {
      expect(MODELL.naechster(g, [{ art: 'sepsis_verlauf', tempo: 1 }], 5, k())).toEqual(BASIS.naechster(g, [{ art: 'sepsis_verlauf', tempo: 1 }], 5, k()));
      expect(MODELL.anzeige(g, k())).toEqual(BASIS.anzeige(g, k()));
    }
  });
  it('Bestände bleiben unberührt: Noradrenalin hebt den Druck, ändert aber nicht den Gefäßtonus selbst', () => {
    const g = MODELL.naechster(SEPSIS, [], 5, k(na(9)));
    expect(g.gefaesstonus).toBeCloseTo(BASIS.naechster(SEPSIS, [], 5, k()).gefaesstonus);
  });
  it('hohe Laufrate: Begrenzen des wirksamen Tonus senkt den Grundbestand nicht (Review #235)', () => {
    const g = laufe({ ...NORMAL }, 60, k(na(45)));
    expect(g.gefaesstonus).toBeCloseTo(NORMAL.gefaesstonus, 6);
    expect(g.pumpleistung).toBeCloseTo(NORMAL.pumpleistung, 6);
  });
  it('Urinausscheidung folgt dem echten Druck, nicht dem ungenullten Messwert (Review #235)', () => {
    const g = { ...SEPSIS, volumen: 0.8, gefaesstonus: 0.5 };
    const richtig = MODELL.anzeige(g, k({ bilanz: true, arteriell: true }));
    const ungenullt = MODELL.anzeige(g, k({ bilanz: true, arteriell: true, stoerungen: ['art-nicht-genullt'] }));
    expect(ungenullt.map! - richtig.map!).toBe(18);
    expect(ungenullt.urinMlH).toBe(richtig.urinMlH);
  });
  it('Noradrenalin: MAP steigt mit der Laufrate', () => {
    const map = (ml: number) => MODELL.anzeige(SEPSIS, k(na(ml))).map!;
    expect(map(4.5)).toBeGreaterThan(map(0));
    expect(map(9)).toBeGreaterThan(map(4.5));
    // der Barorezeptorreflex des Basismodells kappt den Druck, die Wirkung darf aber nicht kippen
    expect(map(45)).toBeGreaterThanOrEqual(map(9));
  });
  it('arterielle Messung: ohne Nullabgleich verschoben, gedämpft Systole tiefer und Diastole höher', () => {
    const richtig = MODELL.anzeige(SEPSIS, k({ arteriell: true }));
    const ungenullt = MODELL.anzeige(SEPSIS, k({ arteriell: true, stoerungen: ['art-nicht-genullt'] }));
    const gedaempft = MODELL.anzeige(SEPSIS, k({ arteriell: true, stoerungen: ['art-gedaempft'] }));
    expect(ungenullt.artSys! - richtig.artSys!).toBe(18);
    expect(gedaempft.artSys!).toBeLessThan(richtig.artSys!);
    expect(gedaempft.artDia!).toBeGreaterThan(richtig.artDia!);
    expect(Math.abs(gedaempft.map! - richtig.map!)).toBeLessThanOrEqual(1);
    expect(gedaempft.artGedaempft).toBe(true);
  });
  it('Beatmung: Diskonnektion ohne CO₂ und ohne Druck, Sekret und verlegter Tubus erhöhen den Spitzendruck', () => {
    const b = { fio2: 0.4, peep: 8, af: 16, vt: 450 };
    const frei = MODELL.anzeige(NORMAL, k({ beatmung: b }));
    expect(frei.af).toBe(16);
    expect(frei.etco2!).toBeGreaterThan(25);
    expect(MODELL.anzeige(NORMAL, k({ beatmung: b, stoerungen: ['diskonnektion'] }))).toMatchObject({ etco2: 0, ppeak: 0, af: 0 });
    expect(MODELL.anzeige(NORMAL, k({ beatmung: b, stoerungen: ['sekret'] })).ppeak!).toBeGreaterThan(frei.ppeak!);
    expect(MODELL.anzeige(NORMAL, k({ beatmung: b, stoerungen: ['tubus-verlegt'] })).ppeak!).toBeGreaterThan(40);
  });
  it('Rhythmus: Kammerflimmern ohne Auswurf, Vorhofflimmern schneller', () => {
    expect(MODELL.anzeige(NORMAL, k({ rhythmus: 'kammerflimmern' }))).toMatchObject({ hf: 0, rrSys: 0, map: 0, avpu: 'U', rhythmus: 'kammerflimmern' });
    expect(MODELL.anzeige(NORMAL, k({ rhythmus: 'vorhofflimmern' })).hf).toBeGreaterThan(MODELL.anzeige(NORMAL, k({})).hf);
  });
  it('Laktat steigt bei Minderperfusion und sinkt langsam, wenn der Druck wieder reicht', () => {
    const schlecht = laufe({ ...SEPSIS, volumen: 0.65, gefaesstonus: 0.2, laktat: 1 }, 900, k({}));
    expect(MODELL.anzeige(schlecht, k({})).map!).toBeLessThan(60);
    expect(schlecht.laktat!).toBeGreaterThan(1.5);
    // Sepsis-Treiber: Mikrozirkulationsstörung hält Laktat höher als ohne Sepsis
    const sepsis = (() => { let g: Grundgroessen = { ...SEPSIS, gefaesstonus: 0.45, laktat: 1 }; for (let t = 0; t < 900; t += 5) g = MODELL.naechster(g, [{ art: 'sepsis_verlauf', tempo: 1, seitSek: 0 } as never], 5, k({})); return g; })();
    expect(sepsis.laktat!).toBeGreaterThan(laufe({ ...SEPSIS, gefaesstonus: 0.45, laktat: 1 }, 900, k({})).laktat! + 0.15);
    const gut = laufe({ ...NORMAL, laktat: 4 }, 600, k({}));
    expect(gut.laktat!).toBeLessThan(4);
    expect(gut.laktat!).toBeGreaterThan(2.5); // Clearance braucht Zeit
  });
  it('Bilanz: Urin fließt nur mit ausreichendem Druck', () => {
    const gut = laufe({ ...NORMAL, einfuhrMl: 0, ausfuhrMl: 0 }, 3600, k({ bilanz: true }));
    expect(gut.ausfuhrMl!).toBeGreaterThan(50);
    const schock = MODELL.anzeige({ ...SEPSIS, volumen: 0.7, gefaesstonus: 0.25 }, k({ bilanz: true }));
    expect(schock.urinMlH!).toBeLessThan(20);
  });
  it('Propofol senkt die Sedierungstiefe (RASS) dosisabhängig und flach: 1 mg/kg/h ≈ −1, 4 mg/kg/h ≈ −3', () => {
    // 1 % Propofol (10 mg/ml), 75 kg: 7,5 ml/h = 1 mg/kg/h
    const rassBei = (mgKgH: number, sufentanil = 0) => {
      const perfusoren: NonNullable<ModellModule['perfusoren']> = [{ id: 'p', wirkstoff: 'propofol', konzentration: '1 %', mgProMl: 10, mlProH: 7.5 * mgKgH }];
      if (sufentanil) perfusoren.push({ id: 's', wirkstoff: 'sufentanil', konzentration: '5 µg/ml', mgProMl: 0.005, mlProH: (sufentanil * 75) / 5 });
      const g = laufe({ ...NORMAL }, 900, k({ perfusoren }));
      return MODELL.anzeige(g, k({ perfusoren })).rass!;
    };
    expect(MODELL.anzeige(NORMAL, k({})).rass).toBe(0);
    expect(rassBei(1)).toBeGreaterThanOrEqual(-1);
    expect(rassBei(2)).toBeGreaterThanOrEqual(-2);
    expect(rassBei(4)).toBeLessThanOrEqual(-3);
    expect(rassBei(4)).toBeGreaterThanOrEqual(-4);
    // leitliniennahes Ziel RASS 0/−1 mit Propofol 1 mg/kg/h + Sufentanil 0,3 µg/kg/h erreichbar (Synergie moderat)
    expect(rassBei(1, 0.3)).toBeGreaterThanOrEqual(-1);
    expect(rassBei(2, 0.3)).toBeLessThanOrEqual(rassBei(2));
  });
});

describe('BGA aus dem Modell', () => {
  it('normal → pH um 7,40', () => {
    const b = bgaAusModell({ paco2: 40, pao2: 95, laktat: 1 });
    expect(b.ph).toBeCloseTo(7.4, 1);
    expect(deuteBga(alsLaborBga(b)).stoerung).toBe('normal');
  });
  it('Laktat 6 → metabolische Azidose, pCO₂ 65 → respiratorische Azidose', () => {
    expect(deuteBga(alsLaborBga(bgaAusModell({ paco2: 40, pao2: 90, laktat: 6 }))).stoerung).toBe('metabolische Azidose');
    expect(deuteBga(alsLaborBga(bgaAusModell({ paco2: 65, pao2: 60, laktat: 1 }))).stoerung).toBe('respiratorische Azidose');
  });
  it('pO₂ aus SpO₂ plausibel', () => {
    expect(po2AusSpo2(97)).toBeGreaterThan(80);
    expect(po2AusSpo2(90)).toBeGreaterThan(55);
    expect(po2AusSpo2(90)).toBeLessThan(65);
  });
});

describe('Fall: septischer Schock im Schockraum', () => {
  const ERSTER_ANRUF_OHNE_ALLERGIE: SimEventEingabe[] = [
    { art: 'massnahme', id: 'monitor-anlegen' },
    { art: 'massnahme', id: 'qsofa-erheben' },
    { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'a-hypotonie', 'a-verwirrt'] },
  ];
  it('Allergie nicht gemeldet: Penicillin wird angeordnet, Remonstration bringt Meropenem', () => {
    let z = spiele(start(FALL, 'pflegefachperson', 2), ERSTER_ANRUF_OHNE_ALLERGIE);
    expect(z.angeboten).toContain('an-piptaz');
    z = sende(z, { art: 'remonstrieren', anordnung: 'an-piptaz' });
    expect(z.angeboten).not.toContain('an-piptaz');
    expect(z.angeboten).toContain('an-meropenem');
  });
  it('blind ausgeführt: schwerer Fehler mit Anaphylaxie-Folge', () => {
    let z = spiele(start(FALL, 'pflegefachperson', 2), ERSTER_ANRUF_OHNE_ALLERGIE);
    z = spiele(z, [{ art: 'rueckmelden', anordnung: 'an-piptaz', rueckgelesen: true }, { art: 'massnahme', id: 'piptaz-iv' }]);
    expect(z.fehlerAus).toContain('f-penicillin');
    expect(z.fehlerAus).toContain('f-ab-vor-bk');
    expect(z.treiber.some((t) => t.art === 'bronchospasmus')).toBe(true);
  });
  const BIS_NA: SimEventEingabe[] = [
    { art: 'massnahme', id: 'monitor-anlegen' },
    { art: 'massnahme', id: 'qsofa-erheben' },
    { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'a-hypotonie', 'b-penicillin-allergie'] },
    { art: 'rueckmelden', anordnung: 'an-ringer', rueckgelesen: true },
    { art: 'anleitung-anfordern', massnahme: 'infusion-anhaengen' },
    { art: 'massnahme', id: 'infusion-anhaengen' },
    { art: 'anruf', an: 'aerztin', sbar: ['a-map-nach-volumen'] },
    { art: 'rueckmelden', anordnung: 'an-noradrenalin', rueckgelesen: true },
  ];
  it('Befugnis Noradrenalin: 3. Drittel nur mit Anleitung, Pflegefachperson nach Anordnung, 1./2. Drittel gesperrt', () => {
    const m = massnahme(FALL, 'perfusor-vorbereiten')!;
    expect(m.befugnis).toEqual({ 1: 'gesperrt', 2: 'gesperrt', 3: 'mit-anleitung', pflegefachperson: 'selbst' });
    expect(m.anordnungspflichtig).toBe(true);
    expect(m.befugnisBeleg).toBeDefined();
    expect(freigabe(start(FALL, 2, 2), m)).toBe('grenze');
    expect(freigabe(start(FALL, 'pflegefachperson', 2), m)).toBe('braucht-anordnung');
    const z = spiele(start(FALL, 'pflegefachperson', 2), BIS_NA);
    expect(freigabe(z, m)).toBe('frei');
    expect(freigabe(z, m, 3)).toBe('mit-pa');
  });
  it('Grenzweg: 3. Drittel startet den Perfusor ohne Anleitung → Stufe 2 kommt die PA dazu, Stufe 3 Grenzüberschreitung', () => {
    const p = spiele(start(FALL, 3, 2), [...BIS_NA, { art: 'massnahme', id: 'perfusor-vorbereiten' }]);
    expect(p.log.some((e) => e.art === 'pa-eingriff' && e.typ === 'unterstuetzt' && e.massnahmeId === 'perfusor-vorbereiten')).toBe(true);
    const z = spiele(start(FALL, 3, 3), [...BIS_NA, { art: 'massnahme', id: 'perfusor-vorbereiten' }]);
    const grenze = z.log.filter((e) => e.art === 'grenzueberschreitung').map((e) => (e as { massnahmeId: string }).massnahmeId);
    expect(grenze).toEqual(['perfusor-vorbereiten']);
    // Titrieren bleibt im 3. Drittel gesperrt (nur Pflegefachperson nach Anordnung)
    expect(freigabe(z, massnahme(FALL, 'katecholamin-anpassen')!)).toBe('grenze');
  });
  it('Laufrate: richtig 4,5 ml/h; Kommafehler 45 ml/h ist ein schwerer Fehler und treibt den Druck hoch', () => {
    const nachStart = (wahl: string) => spiele(start(FALL, 'pflegefachperson', 2), [...BIS_NA, { art: 'massnahme', id: 'perfusor-vorbereiten' }, { art: 'warten', sek: 5 }], { 'e-laufrate': wahl });
    const gut = nachStart('w-4-5');
    expect(gut.module!.perfusoren![0].mlProH).toBe(4.5);
    expect(gut.flags).toContain('laufrate-richtig');
    const falsch = nachStart('w-45');
    expect(falsch.fehlerAus).toContain('f-laufrate-10fach');
    expect(anzeige(falsch).map!).toBeGreaterThan(anzeige(gut).map! + 10);
  });
  it('Perfusor nur einmal vorbereiten: laufende Rate bleibt; Titrieren wirkt nur über die Dosis (Review #235)', () => {
    const gut = spiele(start(FALL, 'pflegefachperson', 2), [...BIS_NA, { art: 'massnahme', id: 'perfusor-vorbereiten' }, { art: 'warten', sek: 5 }], { 'e-laufrate': 'w-4-5' });
    expect(verfuegbar(gut, massnahme(FALL, 'perfusor-vorbereiten')!).ok).toBe(false);
    expect(gut.module!.perfusoren![0].mlProH).toBe(4.5);
    expect(massnahme(FALL, 'katecholamin-anpassen')!.wirkung ?? []).toEqual([]);
  });
  it('Musterweg mit Pflegefachperson (titriert zusätzlich): Module entstehen im Replay identisch', () => {
    const muster = FALL.pruefwege.muster.flatMap((e): SimEventEingabe[] =>
      e.art === 'massnahme' && e.id === 'art-system-pruefen' ? [e, { art: 'massnahme', id: 'katecholamin-anpassen' }] : [e]);
    let z = spiele(start(FALL, 'pflegefachperson', 2), muster);
    z = spiele(z, []);
    expect(z.fehlerAus).toEqual([]);
    expect(z.log.some((e) => e.art === 'grenzueberschreitung' || e.art === 'pa-eingriff')).toBe(false);
    expect(z.module!.perfusoren![0]).toMatchObject({ id: 'na', mlProH: 5.5 });
    expect(z.module!.arteriell).toBe(true);
    const r = replay(FALL, 'pflegefachperson', 2, 1, z.eingaben);
    expect(r.module).toEqual(z.module);
    expect(JSON.stringify({ ...r, fall: undefined })).toBe(JSON.stringify({ ...z, fall: undefined }));
  });
  it('ohne Volumen: neues Vorhofflimmern nach 10 Minuten', () => {
    const z = spiele(start(FALL, 3, 2), [{ art: 'warten', sek: 610 }]);
    expect(z.ereignisseAus).toContain('e-vhf');
    expect(anzeige(z).rhythmus).toBe('vorhofflimmern');
    expect(z.fehlerAus).toContain('f-volumen-spaet');
    expect(anzeige(z).map!).toBeLessThan(anzeige(start(FALL, 3, 2)).map!);
  });
  it('Befundtexte bekommen Werte aus dem Modell, Monitorwerte nur für Sichtbares', () => {
    const z = spiele(start(FALL, 3, 2), [{ art: 'massnahme', id: 'monitor-anlegen' }]);
    const text = z.meldungen.find((m) => m.quelle === 'monitor-anlegen')!.text;
    expect(text).not.toMatch(/\{/);
    const w = monitorWerte(anzeige(z), z.sichtbar);
    expect(w.puls).toBe(anzeige(z).hf);
    expect(w.artSys).toBeNull();
    expect(w.temp).toBeNull();
  });
});
