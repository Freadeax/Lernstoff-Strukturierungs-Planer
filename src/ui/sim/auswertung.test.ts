import { describe, expect, it } from 'vitest';
import { formFehler, kurzfassung, sortierePunkte, zaehle, type SimAuswertung } from './auswertung';
import { DEMO_SZENARIO, demoAbschluss, demoZug } from '../../features/fall/demo';
import { neuerFall, type Fall } from '../../features/fall/simulator';
import { fallAuswertung } from '../../features/fall/auswertung';
import { beginne, handeln, NOTFAELLE, uebergeben } from '../../features/notfall/abcde';
import { PROFILE } from '../../features/notfall/rea';
import { abcdeAuswertung, reaAuswertung } from '../../features/notfall/auswertung';

const beispiel: SimAuswertung = {
  quelle: 'Test', ergebnis: { stufe: 'unsicher', text: 'Lage beherrscht.' }, merksaetze: [],
  punkte: [
    { id: 'a', titel: 'A', urteil: 'gut', warum: 'weil' },
    { id: 'b', titel: 'B', urteil: 'fehler', warum: 'weil', besser: 'anders' },
    { id: 'c', titel: 'C', urteil: 'teilweise', warum: 'weil' },
  ],
};

describe('Gemeinsame Auswertung', () => {
  it('sortiert zu Verbesserndes nach vorn und zählt', () => {
    expect(sortierePunkte(beispiel.punkte).map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(zaehle(beispiel)).toEqual({ gut: 1, teilweise: 1, fehler: 1 });
    expect(kurzfassung(beispiel)).toBe('Mit Lücken: 1 gut, 1 teilweise, 1 zu verbessern');
    expect(formFehler(beispiel)).toEqual([]);
    expect(formFehler({ ...beispiel, punkte: [{ id: 'x', titel: 'X', urteil: 'gut', warum: '', besser: 'y' }] })).toHaveLength(2);
  });

  it('Fallsimulator: Probefall mit Fehlwahl zeigt den besseren Weg', () => {
    let f: Fall = neuerFall(DEMO_SZENARIO, 1);
    f = { ...f, runden: [{ zug: demoZug(f) }] };
    for (let i = 0; i < 12 && !f.runden.at(-1)!.zug.beendet; i++) {
      const o = f.runden.at(-1)!.zug.optionen;
      const eingabe = i === 0 ? o.find((x) => /flach/.test(x)) ?? o[0]! : o.find((x) => /messe|Herzbettlage|SBAR|Bilanz|aufrecht/.test(x)) ?? o[0]!;
      f = { ...f, runden: [...f.runden, { eingabe, zug: demoZug(f, eingabe) }] };
    }
    f = { ...f, abschluss: demoAbschluss(f) };
    const a = fallAuswertung(f)!;
    expect(formFehler(a)).toEqual([]);
    const erste = a.punkte[0]!;
    expect(erste.urteil).toBe('fehler');
    expect(erste.besser).toMatch(/messe/);
    expect(fallAuswertung({ ...f, abschluss: undefined })).toBeNull();
  });

  it('Notfall: ABCDE und Reanimation in derselben Form', () => {
    const fall = NOTFAELLE[0]!;
    const s = uebergeben(handeln(beginne(fall), fall.massnahmen[0]!.id));
    const a = abcdeAuswertung(s);
    expect(formFehler(a)).toEqual([]);
    expect(a.punkte.some((p) => p.urteil === 'fehler')).toBe(true);
    const r = reaAuswertung({ bisDruck: 45, kompressionen: 80, mittel: 90, imZiel: 0.2, ccf: 0.55, laengstePause: 14, richtigeAnalysen: 1, analysen: 2, falscheSchritte: 1 }, PROFILE.erwachsene);
    expect(formFehler(r)).toEqual([]);
    expect(r.ergebnis.stufe).toBe('kritisch');
    const gut = reaAuswertung({ bisDruck: 5, kompressionen: 300, mittel: 110, imZiel: 0.9, ccf: 0.9, laengstePause: 6, richtigeAnalysen: 2, analysen: 2, falscheSchritte: 0 }, PROFILE.erwachsene);
    expect(gut.ergebnis.stufe).toBe('stabil');
    expect(gut.punkte.every((p) => p.urteil === 'gut')).toBe(true);
  });
});
