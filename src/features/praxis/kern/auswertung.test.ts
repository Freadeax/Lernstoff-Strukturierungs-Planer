import { describe, expect, it } from 'vitest';
import { bewerte, inTakten, musterweg, protokoll, uebergabeBausteine, zeitleiste, type KernAuswertung } from './auswertung';
import { FAELLE_V2 } from './faelle';
import { PILOT_AMBULANT as LINDNER } from './faelle/amb-sturz-exsikkose';
import { SR_SEPTISCHER_SCHOCK as KRANZ } from './faelle/sr-septischer-schock';
import { replay, sende, start, vorspulen, type SimZustand } from './kern';
import type { FallV2, Rolle, SimEventEingabe, Stufe } from './typen';

const rolleFuer = (fall: FallV2): Rolle => (fall.geeignet.rollen.includes(2) ? 2 : fall.geeignet.rollen[0]);

function loese(z: SimZustand): SimZustand {
  while (z.offeneEntscheidung) {
    const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
    z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
  }
  return z;
}
function spiele(fall: FallV2, rolle: Rolle, stufe: Stufe, eingaben: readonly SimEventEingabe[]): SimZustand {
  let z = start(fall, rolle, stufe);
  for (const e of eingaben) z = sende(loese(z), e);
  return loese(z);
}
const ohneFall = (z: SimZustand) => JSON.stringify({ ...z, fall: undefined, eingaben: undefined });
const prozent = (a: KernAuswertung) => Object.fromEntries([...a.kb, ...a.klinisch].map((b) => [b.id, b.prozent]));

describe('Zeitleiste: Wartezeiten in Takt-Stücken ergeben denselben Zustand', () => {
  it('Wartezeiten, die kein Vielfaches von 5 sind', () => {
    const eingaben: SimEventEingabe[] = [
      { art: 'warten', sek: 7 }, { art: 'massnahme', id: 'ansprechen-orientierung' }, { art: 'warten', sek: 13 },
      { art: 'warten', sek: 2 }, { art: 'massnahme', id: 'verletzung-pruefen-sturz' }, { art: 'warten', sek: 333 }, { art: 'warten', sek: 401 },
    ];
    for (const fall of [LINDNER, KRANZ]) {
      const a = replay(fall, rolleFuer(fall), 2, 1, eingaben);
      const b = replay(fall, rolleFuer(fall), 2, 1, inTakten(eingaben));
      expect(ohneFall(b)).toBe(ohneFall(a));
    }
  });
  it('Vorspulen mit Stopp an Ereignis und Alarm', () => {
    for (const fall of FAELLE_V2) {
      let z = start(fall, rolleFuer(fall), 2);
      z = sende(z, { art: 'warten', sek: 3 });
      for (let i = 0; i < 6 && !z.ende; i++) z = loese(vorspulen(z, 300));
      expect(z.eingaben.some((e) => e.art === 'warten' && e.sek % 5 !== 0)).toBe(true);
      const b = replay(fall, z.rolle, z.stufe, z.seed, inTakten(z.eingaben));
      expect(ohneFall(b)).toBe(ohneFall(z));
    }
  });
  it('liefert Werte im 5-s-Raster und eigene Handlungen als Marken', () => {
    const z = spiele(LINDNER, 2, 2, LINDNER.pruefwege.muster);
    const zl = zeitleiste(z);
    expect(zl.punkte[0]!.t).toBe(0);
    expect(zl.ende).toBe(z.t);
    for (let i = 1; i < zl.punkte.length; i++) expect(zl.punkte[i]!.t).toBeGreaterThan(zl.punkte[i - 1]!.t);
    expect(zl.marken.some((m) => m.text === 'Blutdruck messen' || m.text.includes('Blutdruck'))).toBe(true);
    expect(zl.marken.filter((m) => m.art === 'ereignis').length).toBeGreaterThan(0);
  });
});

describe('Auswertung je Fall', () => {
  for (const fall of FAELLE_V2) {
    describe(fall.id, () => {
      const rolle = rolleFuer(fall);
      const muster = bewerte(spiele(fall, rolle, 2, fall.pruefwege.muster));

      it('Musterweg: mindestens 90 % in allen beurteilten Bereichen, nichts Kritisches', () => {
        for (const b of [...muster.kb, ...muster.klinisch]) if (b.prozent !== null) expect(b.prozent, `${b.id}`).toBeGreaterThanOrEqual(90);
        expect(muster.gesamt).toBeGreaterThanOrEqual(90);
        expect(muster.verpassteKritische).toEqual([]);
        expect(muster.ergebnis.stufe).toBe('stabil');
        expect(muster.kb.filter((b) => b.prozent !== null).length).toBeGreaterThanOrEqual(4);
        if (fall.spur === 'B') expect(muster.klinisch.filter((b) => b.prozent !== null).length).toBeGreaterThanOrEqual(4);
      });

      it('Unterlassung: deutlich schlechter, kritische Pflichthandlungen sichtbar mit Zeitpunkt', () => {
        let z = start(fall, rolle, 2);
        while (z.t < fall.pruefwege.unterlassung.bisSek && !z.ende) z = loese(sende(z, { art: 'warten', sek: 60 }));
        z = sende(z, { art: 'abschluss', probleme: [], ziele: [] });
        const a = bewerte(z);
        expect(a.gesamt).toBeLessThan(muster.gesamt - 40);
        expect(a.verpassteKritische.length).toBeGreaterThan(0);
        for (const v of a.verpassteKritische) { expect(v.warum.length).toBeGreaterThan(10); expect(v.bisT).toBeGreaterThan(0); }
        expect(a.ergebnis.stufe).toBe('kritisch');
      });

      it('Grenzweg (Stufe 3): Kompetenzbereich III schlechter als im Musterweg', () => {
        const g = fall.pruefwege.grenze;
        if (!g) return;
        const a = bewerte(sende(spiele(fall, g.rolle, 3, g.events), { art: 'abschluss', probleme: [], ziele: [] }));
        expect(a.beitraege.some((b) => b.art === 'grenze')).toBe(true);
        const iii = (x: KernAuswertung) => x.kb.find((b) => b.id === 'III')!.prozent ?? 0;
        expect(iii(a)).toBeLessThan(iii(muster) - 20);
        expect(a.gesamt).toBeLessThan(muster.gesamt);
      });

      it('Form: jeder Beitrag begründet, Bereiche nur KB bzw. in Spur B klinisch', () => {
        for (const b of muster.beitraege) { expect(b.warum.trim(), b.id).not.toBe(''); expect(b.bereiche.length, b.id).toBeGreaterThan(0); }
        if (fall.spur === 'A') expect(muster.klinisch).toEqual([]);
      });

      it('Protokoll und Musterweg sind lesbar', () => {
        expect(musterweg(fall).length).toBeGreaterThan(5);
        const p = protokoll(spiele(fall, rolle, 2, fall.pruefwege.muster));
        expect(p.every((z) => /^\d\d:\d\d /.test(z))).toBe(true);
      });
    });
  }
});

describe('Auswertung: einzelne Regeln', () => {
  const basis = () => spiele(LINDNER, 2, 2, LINDNER.pruefwege.muster.filter((e) => e.art !== 'abschluss'));
  const abschluss = LINDNER.pruefwege.muster.find((e) => e.art === 'abschluss') as Extract<SimEventEingabe, { art: 'abschluss' }>;

  it('PA: Impuls ohne Abzug, Tipp mit leichtem Abzug', () => {
    let z = start(LINDNER, 2, 2);
    z = sende(z, { art: 'pa-fragen' });
    const nurImpuls = bewerte(spiele(LINDNER, 2, 2, [{ art: 'pa-fragen' }, ...LINDNER.pruefwege.muster]));
    const mitTipp = bewerte(spiele(LINDNER, 2, 2, [{ art: 'pa-fragen' }, { art: 'pa-fragen' }, ...LINDNER.pruefwege.muster]));
    const ohne = bewerte(spiele(LINDNER, 2, 2, LINDNER.pruefwege.muster));
    expect(nurImpuls.paImpulse).toBe(1);
    expect(nurImpuls.kb.find((b) => b.id === 'I')!.prozent).toBe(ohne.kb.find((b) => b.id === 'I')!.prozent);
    expect(mitTipp.paTipps).toBe(1);
    expect(mitTipp.kb.find((b) => b.id === 'I')!.abzug).toBeGreaterThan(0);
  });

  it('Rücklesen zählt; ohne Rücklesen teilweise', () => {
    const ohne = LINDNER.pruefwege.muster.map((e) => (e.art === 'rueckmelden' ? { ...e, rueckgelesen: false } : e));
    const a = bewerte(spiele(LINDNER, 2, 2, ohne));
    expect(a.beitraege.filter((b) => b.art === 'ruecklesen').every((b) => b.urteil === 'teilweise')).toBe(true);
  });

  it('Remonstration: hinterfragt = gut, blind ausgeführt = Fehler und Abzug in III und IV', () => {
    const bisUnruhe = (wahl: string): SimZustand => {
      let z = start(LINDNER, 3, 2);
      z = sende(z, { art: 'warten', sek: 600 });
      return sende(z, { art: 'entscheidung', ereignis: 'e-unruhe', wahl });
    };
    const gut = bewerte(sende(sende(bisUnruhe('w-arzt-medis'), { art: 'remonstrieren', anordnung: 'an-lorazepam' }), abschluss));
    let b = bisUnruhe('w-arzt-medis');
    b = sende(b, { art: 'rueckmelden', anordnung: 'an-lorazepam', rueckgelesen: true });
    b = sende(b, { art: 'massnahme', id: 'lorazepam-geben' });
    const blind = bewerte(sende(b, abschluss));
    expect(gut.beitraege.find((x) => x.id === 'remonstration:an-lorazepam')!.urteil).toBe('gut');
    expect(blind.beitraege.find((x) => x.id === 'remonstration:an-lorazepam')!.urteil).toBe('fehler');
    expect(blind.beitraege.some((x) => x.id === 'fehler:f-lorazepam')).toBe(true);
    for (const k of ['III', 'IV'] as const) expect(blind.kb.find((x) => x.id === k)!.prozent!).toBeLessThan(gut.kb.find((x) => x.id === k)!.prozent!);
  });

  it('Pflegebedarf: falsche Reihenfolge und unpassende Probleme kosten Punkte', () => {
    const richtig = bewerte(sende(basis(), abschluss)).beitraege.find((b) => b.art === 'pflegebedarf')!;
    const verdreht = bewerte(sende(basis(), { ...abschluss, probleme: [...abschluss.probleme].reverse() })).beitraege.find((b) => b.art === 'pflegebedarf')!;
    const falsch = bewerte(sende(basis(), { ...abschluss, probleme: [...abschluss.probleme, 'pb-obstipation', 'pb-dekubitus'] })).beitraege.find((b) => b.art === 'pflegebedarf')!;
    expect(richtig.erreicht).toBe(richtig.moeglich);
    expect(verdreht.erreicht).toBeLessThan(richtig.erreicht);
    expect(falsch.erreicht).toBeLessThan(richtig.erreicht);
    expect(falsch.deine).toContain('Obstipation');
  });

  it('Übergabe: nur Bekanntes, falsche Bausteine ziehen ab, ohne Übergabe 0', () => {
    const z = basis();
    const bekannt = uebergabeBausteine(z).map((b) => b.id);
    expect(bekannt).toContain('a-rr-niedrig');
    expect(bekannt).not.toContain('r-hausbesuch');
    expect(uebergabeBausteine(start(LINDNER, 2, 2)).map((b) => b.id)).not.toContain('a-rr-niedrig');
    const mitFalsch = bewerte(sende(z, { ...abschluss, sbar: [...abschluss.sbar!, 'a-demenz'] })).beitraege.find((b) => b.art === 'uebergabe')!;
    const ohne = bewerte(sende(z, { ...abschluss, sbar: undefined })).beitraege.find((b) => b.art === 'uebergabe')!;
    expect(mitFalsch.erreicht).toBeLessThan(mitFalsch.moeglich);
    expect(ohne.erreicht).toBe(0);
  });

  it('Spur B: Verdacht falsch = schlechter, klinische Bereiche gefüllt', () => {
    const ab = KRANZ.pruefwege.muster.find((e) => e.art === 'abschluss') as Extract<SimEventEingabe, { art: 'abschluss' }>;
    const ohneAb = KRANZ.pruefwege.muster.filter((e) => e.art !== 'abschluss');
    const z = spiele(KRANZ, 3, 2, ohneAb);
    const gut = bewerte(sende(z, ab)).beitraege.find((b) => b.art === 'verdacht')!;
    const falsch = bewerte(sende(z, { ...ab, verdacht: 'v-exsikkose', begruendung: ['bg-trinkt-wenig'] })).beitraege.find((b) => b.art === 'verdacht')!;
    expect(gut.urteil).toBe('gut');
    expect(falsch.urteil).toBe('fehler');
    expect(falsch.besser).toContain('Septischer Schock');
  });

  it('Spur B: Fehler bekommen klinische Bereiche über die Maßnahmen ihrer Bedingung', () => {
    // Penicillin ohne Remonstration (Pflegefachperson, Anordnung rückgelesen)
    let z = start(KRANZ, 'pflegefachperson', 2);
    for (const e of [
      { art: 'massnahme', id: 'uebergabe-rd-annehmen' }, { art: 'massnahme', id: 'monitor-anlegen' }, { art: 'massnahme', id: 'qsofa-erheben' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'a-hypotonie'] },
      { art: 'rueckmelden', anordnung: 'an-piptaz', rueckgelesen: true }, { art: 'massnahme', id: 'piptaz-richten' },
    ] as SimEventEingabe[]) z = loese(sende(z, e));
    const a = bewerte(sende(z, { art: 'abschluss', probleme: [], ziele: [] }));
    const f = a.beitraege.find((b) => b.id === 'fehler:f-penicillin');
    expect(f).toBeDefined();
    expect(f!.bereiche).toContain('medikamente');
    expect(a.beitraege.find((b) => b.id === 'remonstration:an-piptaz')!.urteil).toBe('fehler');
    expect(prozent(a).medikamente).toBeLessThan(50);
  });
});
