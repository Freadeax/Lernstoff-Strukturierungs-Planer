import { describe, expect, it } from 'vitest';
import { SZENARIEN } from './faelle';
import { minutenAus, monitorWerte, oberkoerperHoch, personenIn, szenenBild, zielVon } from './szene';
import { neuerFall, type Fall, type Vitalwerte, type Zug } from './simulator';

const leer: Vitalwerte = { rr: '', puls: '', af: '', spo2: '', sauerstoff: '', temp: '', bz: '', schmerz: '', bewusstsein: '' };
const zug = (z: Partial<Zug>): Zug => ({
  uhrzeit: '02:05', situation: '', vitalwerte: leer, zustand: 'stabil', schritt: 'informationssammlung',
  rueckmeldung: { wertung: 'keine', text: '' }, optionen: [], beendet: false, ...z,
});
const fall = (...runden: Array<{ eingabe?: string; zug: Zug }>): Fall => ({ ...neuerFall(SZENARIEN[0]!, 1), runden });

describe('Szene aus dem Fallverlauf', () => {
  it('erkennt Personen im Text', () => {
    expect(personenIn('Die Ärztin kommt herein, die Tochter wartet draußen.')).toEqual(['aerztin', 'angehoerige']);
    expect(personenIn('Das Notfallteam ist da.')).toEqual(['notfallteam']);
    expect(personenIn('Herr K. schläft.')).toEqual([]);
    expect(personenIn('Beide Unterschenkel sind geschwollen, er sieht Muttermale.')).toEqual([]);
  });

  it('leitet das Laufziel aus der Handlung ab', () => {
    expect(zielVon('Ich messe Blutdruck und Puls.')).toBe('monitor');
    expect(zielVon('Ich rufe die Ärztin an und übergebe nach SBAR.')).toBe('telefon');
    expect(zielVon('Ich hole Traubenzucker.')).toBe('wagen');
    expect(zielVon('Ich halte seine Hand.')).toBe('bett');
    expect(zielVon(undefined)).toBe('bett');
  });

  it('merkt sich die letzte Lagerung', () => {
    expect(oberkoerperHoch(['Ich lagere ihn in Herzbettlage.'])).toBe(true);
    expect(oberkoerperHoch(['Ich lagere ihn in Herzbettlage.', 'Ich lege ihn flach hin.'])).toBe(false);
    expect(oberkoerperHoch(['Er liegt flach. Ich setze ihn aufrecht hin.'])).toBe(true);
  });

  it('liest Uhrzeit und Vitalwerte', () => {
    expect(minutenAus('02:16')).toBe(136);
    expect(minutenAus('')).toBeNull();
    expect(monitorWerte({ ...leer, rr: '165/95', puls: '112', spo2: '89', sauerstoff: 'nein', bewusstsein: 'A' }))
      .toMatchObject({ sys: 165, dia: 95, puls: 112, spo2: 89, sauerstoff: false, avpu: 'A', af: null });
  });

  it('baut ein Bild mit Alarm, Kamera und Laufziel', () => {
    const b = szenenBild(fall(
      { zug: zug({ situation: 'Herr K. klingelt.' }) },
      { eingabe: 'Ich messe die Vitalzeichen.', zug: zug({ uhrzeit: '02:09', situation: 'Er ist kaltschweißig, die Lippen sind bläulich.', zustand: 'verschlechtert', vitalwerte: { ...leer, puls: '112', spo2: '89', af: '26' } }) },
    ));
    expect(b.monitorAn).toBe(true);
    expect(b.alarm).toBe(true);
    expect(b.fokus).toBe('monitor');
    expect(b.ziel).toBe('monitor');
    expect(b.schwitzt).toBe(true);
    expect(b.zyanose).toBe(true);
    expect(b.atem).toBe(26);
    expect(b.nacht).toBe(true);
    expect(b.beschreibung).toContain('Alarm');
  });

  it('fährt zur Tür, wenn jemand Neues hereinkommt, und zum Telefon, wenn es klingelt', () => {
    const tuer = szenenBild(fall({ zug: zug({}) }, { eingabe: 'Ich halte seine Hand.', zug: zug({ situation: 'Die Ärztin kommt zur Tür herein.' }) }));
    expect(tuer.fokus).toBe('tuer');
    expect(tuer.personen).toEqual(['aerztin']);
    const tel = szenenBild(fall({ zug: zug({ situation: 'Das Telefon klingelt: die Tochter ruft an.' }) }));
    expect(tel.fokus).toBe('telefon');
    expect(tel.telefon).toBe(true);
  });

  it('kommt ohne Runden aus', () => {
    const b = szenenBild(fall());
    expect(b.monitorAn).toBe(false);
    expect(b.fokus).toBe('raum');
    expect(b.atem).toBe(16);
  });
});
