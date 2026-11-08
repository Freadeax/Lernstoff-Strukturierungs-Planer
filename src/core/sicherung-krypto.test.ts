import { describe, expect, it } from 'vitest';
import { entschluessele, FalschesPasswort, istVerschluesselt, passwortProblem, verschluessele } from './sicherung-krypto';

describe('Verschlüsselte Sicherung', () => {
  const klar = JSON.stringify({ app: 'lernstoff-planer', schema: 7, data: { notizen: [{ text: 'Patientin Frau M., Zimmer 12 (Übung)' }] } });

  it('verschlüsselt und entschlüsselt mit Passwort, ohne Klartext in der Datei', async () => {
    const text = await verschluessele(klar, 'mein langes Passwort', 100_000);
    expect(istVerschluesselt(text)).toBe(true);
    expect(istVerschluesselt(klar)).toBe(false);
    expect(text).not.toContain('Patientin');
    expect(await entschluessele(text, 'mein langes Passwort')).toBe(klar);
  });

  it('meldet ein falsches Passwort und eine veränderte Datei', async () => {
    const text = await verschluessele(klar, 'mein langes Passwort', 100_000);
    await expect(entschluessele(text, 'falsches Passwort!')).rejects.toBeInstanceOf(FalschesPasswort);
    const s = JSON.parse(text);
    s.verschluesselt.daten = s.verschluesselt.daten.replace(/^./, (c: string) => (c === 'A' ? 'B' : 'A'));
    await expect(entschluessele(JSON.stringify(s), 'mein langes Passwort')).rejects.toBeInstanceOf(FalschesPasswort);
  });

  it('nutzt jedes Mal neues Salz', async () => {
    const a = JSON.parse(await verschluessele(klar, 'mein langes Passwort', 100_000));
    const b = JSON.parse(await verschluessele(klar, 'mein langes Passwort', 100_000));
    expect(a.verschluesselt.salz).not.toBe(b.verschluesselt.salz);
    expect(a.verschluesselt.daten).not.toBe(b.verschluesselt.daten);
  });

  it('verlangt ein Passwort mit mindestens 10 Zeichen', () => {
    expect(passwortProblem('kurz')).toBeTruthy();
    expect(passwortProblem('lang genug!')).toBeUndefined();
  });
});
