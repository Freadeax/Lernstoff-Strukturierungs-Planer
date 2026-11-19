// P12: Kurvendaten und Verlaufsjournal – nur Gemessenes und Sichtbares.
import { describe, expect, it } from 'vitest';
import { PILOT_AMBULANT } from '../../kern/faelle/amb-sturz-exsikkose';
import { SR_SEPTISCHER_SCHOCK } from '../../kern/faelle/sr-septischer-schock';
import { anzeige, sende, start, type SimZustand } from '../../kern/kern';
import type { SimEventEingabe } from '../../kern/typen';
import { filtere, journal } from '../journal';
import { kurvendaten, liveAb, messpunkte, monitorPunkte, vorherNachher, vorwertPunkte } from './kurvendaten';

const spiele = (z: SimZustand, e: SimEventEingabe[]) => e.reduce(sende, z);
const m = (id: string): SimEventEingabe => ({ art: 'massnahme', id });
const tasche = (geraet: string): SimEventEingabe => ({ art: 'pflegetasche', geraet });
const warte = (sek: number): SimEventEingabe => ({ art: 'warten', sek });

describe('Kurvendaten (P12)', () => {
  it('Hausbesuch: vor der ersten Messung keine Punkte und keine Monitorlinie', () => {
    const d = kurvendaten(spiele(start(PILOT_AMBULANT, 2, 2), [warte(120)]));
    expect(d.punkte).toEqual([]);
    expect(d.monitor).toEqual([]);
  });

  it('RR-Messung ist eine Momentaufnahme: Punkt bleibt, auch wenn sich das Modell weiter verändert', () => {
    let z = spiele(start(PILOT_AMBULANT, 2, 2), [tasche('rr-geraet')]);
    const a = anzeige(z);
    z = spiele(z, [m('rr-messen')]);
    const p = messpunkte(z.meldungen);
    expect(p).toHaveLength(1);
    expect(p[0]!.werte).toEqual({ rrSys: a.rrSys, rrDia: a.rrDia });
    z = spiele(z, [m('trinken-anbieten'), warte(1800)]);
    expect(messpunkte(z.meldungen)).toEqual(p);
  });

  it('Pulsoxymeter: Linie erst ab dem Anlegen, nur SpO₂/Puls – nie RR oder versteckte Werte', () => {
    const z = spiele(start(PILOT_AMBULANT, 2, 2), [warte(60), tasche('pulsoxy'), m('pulsoxy-anlegen'), warte(300)]);
    const ab = liveAb(z);
    expect(Object.keys(ab).sort()).toEqual(['hf', 'spo2']);
    const linie = monitorPunkte(z);
    expect(linie.length).toBeGreaterThan(10);
    expect(linie[0]!.t).toBeGreaterThanOrEqual(ab.spo2!);
    for (const p of linie) expect(Object.keys(p.werte).every((k) => k === 'hf' || k === 'spo2')).toBe(true);
  });

  it('Spur B mit Monitor ab Fallbeginn: Linie ab 0 im 5-s-Raster', () => {
    const mitMonitor = { ...SR_SEPTISCHER_SCHOCK, start: { ...SR_SEPTISCHER_SCHOCK.start, sichtbar: ['hf', 'spo2', 'rrSys', 'rrDia'] as const } } as typeof SR_SEPTISCHER_SCHOCK;
    const z = spiele(start(mitMonitor, 'pflegefachperson', 2), [warte(60)]);
    const linie = monitorPunkte(z);
    expect(linie[0]!.t).toBe(0);
    expect(linie.at(-1)!.t).toBe(60);
    expect(linie.every((p, i) => i === 0 || p.t - linie[i - 1]!.t === 5)).toBe(true);
  });

  it('Vorwerte der Akte (P13): negative Zeit, Label bleibt', () => {
    const v = vorwertPunkte([{ zeit: 'gestern 18:00', vorH: 14, werte: { rrSys: 142, rrDia: 84, hf: 72 }, kuerzel: 'SB' }, { zeit: 'heute 06:00', vorH: 2, werte: { temp: 36.9 } }]);
    expect(v.map((p) => p.t)).toEqual([-50400, -7200]);
    expect(v[0]).toMatchObject({ quelle: 'vorwert', label: 'gestern 18:00', kuerzel: 'SB' });
    const d = kurvendaten(start(PILOT_AMBULANT, 2, 2), { vorwerte: [{ zeit: 'gestern', vorH: 20, werte: { rrSys: 140, rrDia: 85 } }] });
    expect(d.punkte[0]!.quelle).toBe('vorwert');
  });

  it('Vorher/nachher nach Trinken: RR vorher und jüngste Messung danach; ohne neue Messung kein Vergleich', () => {
    const vorher = spiele(start(PILOT_AMBULANT, 2, 2), [tasche('rr-geraet'), m('rr-messen'), m('trinken-anbieten')]);
    const tTrinken = vorher.log.find((l) => l.art === 'massnahme' && l.id === 'trinken-anbieten')!.t;
    expect(vorherNachher(kurvendaten(vorher), tTrinken)).toEqual([]);
    const nach = spiele(vorher, [warte(600), m('rr-messen')]);
    const v = vorherNachher(kurvendaten(nach), tTrinken);
    const rr = v.find((x) => x.groesse === 'rrSys')!;
    expect(rr.vorher.t).toBeLessThanOrEqual(tTrinken);
    expect(rr.nachher.t).toBeGreaterThan(tTrinken);
    expect(rr.nachher.wert2).toBeDefined();
  });

  it('Marken: eigene Handlungen, Ereignisse, Alarme und Zustand in zeitlicher Reihenfolge', () => {
    const z = spiele(start(PILOT_AMBULANT, 2, 2), [m('verletzung-pruefen-sturz'), tasche('pulsoxy'), m('pulsoxy-anlegen'), warte(600)]);
    const d = kurvendaten(z);
    expect(d.marken.some((x) => x.art === 'handlung' && /Verletzungen/.test(x.text))).toBe(true);
    expect(d.marken.some((x) => x.art === 'ereignis')).toBe(true);
    expect(d.marken.every((x, i) => i === 0 || x.t >= d.marken[i - 1]!.t)).toBe(true);
  });
});

describe('Verlaufsjournal (P12)', () => {
  it('chronologisch, eigene Handlung vor ihrem Befund, mit Filter', () => {
    const z = spiele(start(PILOT_AMBULANT, 2, 2), [tasche('rr-geraet'), m('rr-messen'), warte(400)]);
    const j = journal(z, kurvendaten(z));
    expect(j.every((e, i) => i === 0 || e.t >= j[i - 1]!.t)).toBe(true);
    const i = j.findIndex((e) => e.art === 'handlung' && /Blutdruck/.test(e.text));
    expect(j[i + 1]!.art).toBe('befund');
    expect(filtere(j, 'eigene').every((e) => e.gruppe === 'eigene')).toBe(true);
    expect(filtere(j, 'befunde').some((e) => /RR/.test(e.text))).toBe(true);
    expect(filtere(j, 'ereignisse').some((e) => /Tochter/.test(e.text))).toBe(true);
    expect(filtere(j, 'alle')).toHaveLength(j.length);
  });

  it('Handlung mit Wirkung bekommt den Vorher/nachher-Vergleich', () => {
    const z = spiele(start(PILOT_AMBULANT, 2, 2), [tasche('rr-geraet'), m('rr-messen'), m('trinken-anbieten'), warte(600), m('rr-messen')]);
    const e = journal(z, kurvendaten(z)).find((x) => x.art === 'handlung' && /Trinken/.test(x.text))!;
    expect(e.vergleich?.some((v) => v.groesse === 'rrSys')).toBe(true);
  });
});
