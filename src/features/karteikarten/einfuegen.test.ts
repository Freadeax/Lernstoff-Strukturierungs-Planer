import { describe, expect, it } from 'vitest';
import { erkenneTrenner, kartenSchluessel, zerlegeEinfuegung } from './einfuegen';

describe('Karten einfügen', () => {
  it('erkennt Tabulator aus Excel/Quizlet', () => {
    const r = zerlegeEinfuegung('Dekubitus\tDruckgeschwür\nApoplex\tSchlaganfall');
    expect(r.trenner).toBe('tab');
    expect(r.karten.map((k) => [k.vorne, k.hinten])).toEqual([['Dekubitus', 'Druckgeschwür'], ['Apoplex', 'Schlaganfall']]);
  });

  it('erkennt RemNote-Doppelpunkte und Aufzählungen', () => {
    const r = zerlegeEinfuegung('- Tachykardie :: Puls über 100/min\n- Bradykardie :: Puls unter 60/min');
    expect(r.trenner).toBe('doppelpunkt2');
    expect(r.karten).toHaveLength(2);
    expect(r.karten[1]!.hinten).toBe('Puls unter 60/min');
  });

  it('nimmt Zeilen ohne Trenner als Fortsetzung der Rückseite', () => {
    const r = zerlegeEinfuegung('Dekubitus-Prädilektionsstellen Rückenlage: \n- Hinterkopf\n- Kreuzbein\n\nFingertest: Rötung eindrücken', 'doppelpunkt');
    expect(r.karten).toHaveLength(1);
    expect(r.karten[0]!.vorne).toBe('Fingertest');
    const r2 = zerlegeEinfuegung('Prädilektionsstellen: Rückenlage\n  - Hinterkopf\n  - Kreuzbein');
    expect(r2.karten[0]!.hinten).toBe('Rückenlage\n• Hinterkopf\n• Kreuzbein');
  });

  it('macht Zeilen mit [[Lücken]] zu Lückentexten und überspringt Überschriften', () => {
    const r = zerlegeEinfuegung('# CE 05\nDer [[Fingertest]] prüft eine Rötung.\nBlutdruck; 120/80 mmHg');
    expect(r.karten.map((k) => k.luecken ?? false)).toEqual([true, false]);
    expect(r.uebersprungen).toEqual([]);
  });

  it('verarbeitet gemischte eindeutige Trenner im Automatikmodus', () => {
    const r = zerlegeEinfuegung('Dekubitus\tDruckgeschwür\nTachykardie :: Puls > 100\nApoplex -> Schlaganfall');
    expect(r.karten.map((k) => k.vorne)).toEqual(['Dekubitus', 'Tachykardie', 'Apoplex']);
  });

  it('meldet Zeilen ohne Trenner und ohne Karte davor', () => {
    expect(zerlegeEinfuegung('nur Text\nA; B').uebersprungen).toEqual([1]);
  });

  it('wählt bei Gleichstand das eindeutigere Trennzeichen', () => {
    expect(erkenneTrenner('Puls: Herzfrequenz -> Schläge pro Minute')).toBe('pfeil');
    expect(erkenneTrenner('ohne alles')).toBeUndefined();
  });

  it('vergleicht Vorderseiten ohne Groß/Klein und Leerraum', () => {
    expect(kartenSchluessel('  Dekubitus   Kategorie 1 ')).toBe(kartenSchluessel('dekubitus kategorie 1'));
  });
});
