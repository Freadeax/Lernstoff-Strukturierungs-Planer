import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { EREIGNISSE } from './ereignisse';
import { felderAusBausteinen, felderAusText, grundProzent, pruefeGrundkriterien, rufanlass } from './grundkriterien';
import { MELDUNGEN } from '../labortrainer/werkbank/meldung';

const felder = felderAusText;

describe('rufanlass', () => {
  it('nimmt das schwerste, jüngste Ereignis', () => {
    const a = rufanlass([{ stufe: 'info', text: 'alt' }, { stufe: 'auffaellig', text: 'früh', minute: 1 }, { stufe: 'auffaellig', text: 'spät', minute: 5 }])!;
    expect(a.rufgrund).toBe('spät');
    expect(a.prioritaet).toBe('zeitnah');
    expect(a.quellen).toEqual(['spät', 'früh']);
    expect(a.rueckfrage).toMatch(/erneut anrufen/);
    expect(rufanlass([])).toBeNull();
  });
  it('jeder Übergabe-Fall hat Ereignisse, Schichtübergaben sind nicht dringend', () => {
    for (const f of FAELLE) {
      const a = rufanlass(EREIGNISSE[f.id] ?? []);
      expect(a, f.id).not.toBeNull();
      if (f.anlass === 'schicht') expect(a!.prioritaet, f.id).toBe('routine');
      if (f.anlass === 'notfall') expect(a!.prioritaet, f.id).toBe('sofort');
    }
  });
});

describe('pruefeGrundkriterien', () => {
  it('Musterübergaben erfüllen alle Grundkriterien', () => {
    for (const f of FAELLE) {
      const e = pruefeGrundkriterien(felder(f.muster), rufanlass(EREIGNISSE[f.id]!));
      expect(e.filter((x) => x.status !== 'ok').map((x) => `${x.id}: ${x.text}`), f.id).toEqual([]);
    }
  });
  it('erkennt Rufgrund an falscher Stelle, falsche Priorität und fehlende Rückfrage', () => {
    const a = rufanlass(EREIGNISSE.atemnot!)!;
    const e = pruefeGrundkriterien({ S: 'Hier Station 3, Frau Brandt.', B: 'Herzinsuffizienz seit gestern', A: 'Sie hat Atemnot, SpO2 86 %, ich mache mir Sorgen', R: 'Bitte zur Visite morgen ansehen.' }, a);
    const st = Object.fromEntries(e.map((x) => [x.id, x.status]));
    expect(st).toMatchObject({ rufgrund: 'teilweise', prioritaet: 'teilweise', hintergrund: 'ok', einschaetzung: 'ok', empfehlung: 'ok', rueckfrage: 'fehlt' });
    expect(grundProzent(e)).toBe(67);
  });
  it('Bausteine: Werkbank-Meldung mit Ballast und Diagnostik-Präfixe', () => {
    for (const m of MELDUNGEN) {
      const richtig = felderAusBausteinen(m.bausteine.filter((b) => b.teil !== 'x'));
      const a = rufanlass([{ stufe: 'kritisch', text: m.wert, muster: [m.wert.split(' ')[0]!.toLowerCase()] }]);
      const e = pruefeGrundkriterien(richtig.felder, a, { ballast: richtig.ballast });
      expect(e.filter((x) => x.status !== 'ok').map((x) => `${x.id}: ${x.text}`), m.id).toEqual([]);
      const mitBallast = felderAusBausteinen(m.bausteine);
      expect(pruefeGrundkriterien(mitBallast.felder, a, { ballast: mitBallast.ballast }).find((x) => x.id === 'hintergrund')!.status).toBe('teilweise');
    }
    const d = felderAusBausteinen([{ text: 'S: Herr M., Atemnot', relevant: true }, { text: 'Er hat kaum gefrühstückt', relevant: false }]);
    expect(d.felder.S).toBe('Herr M., Atemnot');
    expect(d.ballast).toBe(1);
  });
});
