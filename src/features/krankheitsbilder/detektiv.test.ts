import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { pruefeAufgaben } from '../quiz/quiz';
import { rng } from '../rechnen/aufgaben';
import { detektivRunde, maskiere, namenVon, symptomAufgabe, zuordnenAufgabe } from './detektiv';

const PROFILE = pflegeModule.diseaseProfiles ?? [];
const themen = new Set(pflegeModule.topics.map((t) => t.id));

describe('Krankheitsbild-Detektiv', () => {
  it('maskiert Namen und Synonyme, damit der Text die Lösung nicht verrät', () => {
    const p = { name: 'Asthma bronchiale', synonyms: ['Bronchialasthma'] };
    expect(namenVon(p)).toContain('Asthma');
    expect(maskiere('Typischer Asthmaanfall mit Giemen', p)).toBe('Typischer […] mit Giemen');
    expect(maskiere('Ein Bronchialasthma-Anfall', p)).toBe('Ein […]');
    expect(maskiere('Herzinsuffizienz', { name: 'COPD', synonyms: ['Chronisch obstruktive Lungenerkrankung'] })).toBe('Herzinsuffizienz');
  });

  it('erzeugt für jedes Krankheitsbild gültige Aufgaben ohne Namen im Text', () => {
    const r = rng(7);
    const aufgaben = PROFILE.map((p) => symptomAufgabe(p, PROFILE, r.next)).filter((a) => !!a);
    expect(aufgaben.length).toBeGreaterThanOrEqual(PROFILE.length - 2);
    expect(pruefeAufgaben(aufgaben, themen)).toEqual([]);
    for (const a of aufgaben) {
      if (a.art !== 'auswahl' || !a.id.startsWith('detektiv.symptome')) continue;
      const p = PROFILE.find((x) => a.id.endsWith(x.id))!;
      for (const n of namenVon(p)) expect(a.frage.toLowerCase()).not.toContain(n.toLowerCase());
      expect(new Set(a.optionen).size).toBe(4);
    }
  });

  it('wählt nur Ablenker, die keine der gezeigten Beobachtungen teilen', () => {
    const r = rng(3);
    for (const p of PROFILE) {
      const a = symptomAufgabe(p, PROFILE, r.next);
      if (!a) continue;
      for (const name of a.optionen.slice(1)) expect(PROFILE.find((x) => x.name === name)!.id).not.toBe(p.id);
    }
  });

  it('ordnet Beschreibungen zu und stellt gemischte, gültige Runden zusammen', () => {
    const z = zuordnenAufgabe(PROFILE.slice(0, 4))!;
    expect(z.paare).toHaveLength(4);
    expect(pruefeAufgaben([z], themen)).toEqual([]);
    const runde = detektivRunde(PROFILE, 12, rng(11).next);
    expect(runde).toHaveLength(12);
    expect(new Set(runde.map((a) => a.art))).toEqual(new Set(['auswahl', 'zuordnen']));
    expect(pruefeAufgaben(runde, themen)).toEqual([]);
    const nur = detektivRunde(PROFILE, 5, rng(1).next, ['kh.copd', 'kh.asthma']);
    expect(nur.length).toBeGreaterThan(0);
    expect(nur.length).toBeLessThanOrEqual(2);
  });
});
