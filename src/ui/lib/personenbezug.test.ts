import { describe, expect, it } from 'vitest';
import { personenbezug } from './personenbezug';

describe('Hinweise auf echte Personendaten', () => {
  it('erlaubt die Namen des Übungsfalls', () => {
    expect(personenbezug('Frau Kaiser sagt: „Ich will nach Hause.“ 14:30 Uhr RR 130/80 mmHg.', ['Erna Kaiser, 79 Jahre'])).toEqual([]);
  });
  it('findet fremde Namen, Geburtsdaten, Zimmer, Nummern und Kontakte', () => {
    const f = personenbezug('Frau Müller, geb. 12.03.1941, Zimmer 12, Versicherten-Nr. 123456, Tel. 0171 2345678, A123456789', ['Erna Kaiser']);
    expect(f.map((x) => x.art).sort()).toEqual(['geburtsdatum', 'kontakt', 'name', 'nummer', 'nummer', 'zimmer']);
  });
  it('Uhrzeiten, Messwerte und Mengen sind keine Personendaten', () => {
    expect(personenbezug('Um 7:45 Uhr 2 Löffel Suppe, 150 ml Tee, BZ 54 mg/dl, Temperatur 38,2 °C, nach 20 Minuten 7/10.')).toEqual([]);
  });
});
