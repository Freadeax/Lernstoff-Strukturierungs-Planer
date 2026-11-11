import { describe, expect, it } from 'vitest';
import { ablesen, druckNach, genauigkeit, hoerKlaenge, hoerRunde, korotkow, neuerBlutdruckFall } from './hoeren';
import { ALARM_MUSTER, atemZyklus, herzZyklus, KLAENGE, piepFrequenz, raumFuerSetting } from '../../ui/audio/klaenge';

function zufallAus(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

describe('Klangbibliothek', () => {
  it('hat eindeutige IDs und zu jedem Lernklang einen Merksatz', () => {
    const ids = KLAENGE.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of hoerKlaenge()) expect(k.merkmal, k.id).toBeTruthy();
  });
  it('Monitorpiep wird mit fallender Sättigung tiefer, bleibt im hörbaren Bereich', () => {
    expect(piepFrequenz(100)).toBeCloseTo(880);
    expect(piepFrequenz(90)).toBeLessThan(piepFrequenz(95));
    expect(piepFrequenz(20)).toBe(piepFrequenz(70));
  });
  it('Alarmmuster: rot hat 10 Pulse, gelb 3, niedrig 2; rot wiederholt am häufigsten', () => {
    expect(ALARM_MUSTER.hoch.pulse).toHaveLength(10);
    expect(ALARM_MUSTER.mittel.pulse).toHaveLength(3);
    expect(ALARM_MUSTER.niedrig.pulse).toHaveLength(2);
    expect(ALARM_MUSTER.hoch.wiederholung).toBeLessThan(ALARM_MUSTER.mittel.wiederholung);
  });
  it('Herz- und Atemzyklus folgen der Frequenz', () => {
    expect(herzZyklus(60).periode).toBeCloseTo(1);
    expect(herzZyklus(150).systole).toBeLessThan(herzZyklus(60).systole);
    const z = atemZyklus(12, true);
    expect(z.aus).toBeGreaterThan(z.ein);
    expect(z.ein + z.aus).toBeLessThan(z.periode);
  });
  it('ordnet Settings und Raumfotos einem Raumklang zu', () => {
    expect(raumFuerSetting('its')).toBe('intensiv');
    expect(raumFuerSetting('15_intensiv_beatmung')).toBe('intensiv');
    expect(raumFuerSetting('18_notaufnahme_schockraum_nacht')).toBe('notaufnahme');
    expect(raumFuerSetting('langzeit')).toBe('heim');
    expect(raumFuerSetting('ambulant')).toBe('wohnung');
    expect(raumFuerSetting('krankenhaus')).toBe('station');
    expect(raumFuerSetting(undefined)).toBe('station');
  });
});

describe('Was hörst du?', () => {
  it('jede Frage hat 4 verschiedene Optionen mit der richtigen darunter', () => {
    const r = hoerRunde(8, undefined, zufallAus(7));
    expect(r).toHaveLength(8);
    for (const f of r) {
      expect(new Set(f.optionen).size).toBe(4);
      expect(f.optionen[f.richtig]).toBe(f.klang);
    }
  });
  it('Ablenker kommen zuerst aus derselben Gruppe', () => {
    const r = hoerRunde(5, 'herz', zufallAus(3));
    const herz = new Set(hoerKlaenge('herz').map((k) => k.id));
    for (const f of r) expect(f.optionen.filter((o) => herz.has(o)).length).toBe(4);
  });
});

describe('Blutdruck nach Gehör', () => {
  it('Fälle sind plausibel', () => {
    const z = zufallAus(11);
    for (let i = 0; i < 200; i++) {
      const f = neuerBlutdruckFall(z);
      expect(f.sys - f.dia).toBeGreaterThanOrEqual(30);
      expect(f.dia).toBeGreaterThanOrEqual(50);
      expect(f.start).toBe(f.sys + 30);
    }
  });
  it('Geräusch nur zwischen systolisch und diastolisch, mit Phasen', () => {
    const f = { sys: 140, dia: 80 };
    expect(korotkow(141, f).pegel).toBe(0);
    expect(korotkow(139, f).phase).toBe(1);
    expect(korotkow(100, f).phase).toBe(3);
    expect(korotkow(83, f).phase).toBe(4);
    expect(korotkow(80, f).pegel).toBe(0);
  });
  it('Druck sinkt um 3 mmHg/s; Ablesen auf gerade Zahlen; Bewertung', () => {
    const f = { sys: 120, dia: 80, puls: 70, start: 150 };
    expect(druckNach(f, 10)).toBe(120);
    expect(druckNach(f, 100)).toBe(0);
    expect(ablesen(121)).toBe(122);
    expect(genauigkeit(-3)).toBe('genau');
    expect(genauigkeit(6)).toBe('knapp');
    expect(genauigkeit(12)).toBe('daneben');
  });
});

import { klangZuBefund } from '../../ui/audio/klaenge';
describe('Befund zum Hörbeispiel', () => {
  it('ordnet Textbefunde der Praxisfälle zu', () => {
    expect(klangZuBefund('Beidseits basal feuchte Rasselgeräusche (Textbefund, keine Tonaufnahme).')).toBe('atem-rg');
    expect(klangZuBefund('Beidseits belüftet, keine Rasselgeräusche im Textbefund.')).toBe('atem-vesikulaer');
    expect(klangZuBefund('Exspiratorisches Giemen beidseits, Ausatmung deutlich verlängert.')).toBe('atem-giemen');
    expect(klangZuBefund('Leises Pfeifen beim Ausatmen beidseits.')).toBe('atem-giemen');
    expect(klangZuBefund('Atemgeräusche beidseits abgeschwächt im Übungsbefund.')).toBeNull();
    expect(klangZuBefund('Auskultation erst nach Zustimmung; akut steht Kontaktaufnahme im Vordergrund.')).toBeNull();
    expect(klangZuBefund('Unauffälliger orientierender Lungenbefund.')).toBe('atem-vesikulaer');
  });
});

describe('Textalternative', () => {
  it('verdeckt die Namen der Antwortmöglichkeiten', async () => {
    const { ohneNamen } = await import('./hoeren');
    expect(ohneNamen('Typisch für Stridor: pfeifend beim Einatmen.', ['Stridor', 'Giemen'])).toBe('Typisch für […]: pfeifend beim Einatmen.');
  });
});
