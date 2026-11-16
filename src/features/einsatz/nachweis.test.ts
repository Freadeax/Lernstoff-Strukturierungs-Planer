import { describe, expect, it } from 'vitest';
import type { Einsatz } from './einsatz';
import {
  eigeneTaetigkeit, gespraechTermin, KATALOG, leererEinsatzNachweis, MAX_BILD, pruefeNachweis, setzeGespraech, setzeStufe, vorbereitung, zaehle,
} from './nachweis';
import { LEER, type Tagebuch } from './tagebuch';

const E: Einsatz = { id: 'e1', art: 'akut', bereich: 'Chirurgie', von: '2026-12-01', bis: '2026-12-28', themen: [], ziele: ['Verbandwechsel sicher'], imLernplan: true, angelegt: '2026-11-16' };

describe('Ausbildungsnachweis', () => {
  it('Katalog-IDs sind eindeutig', () => {
    const ids = KATALOG.flatMap((g) => g.taetigkeiten.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('höhere Stufe ersetzt niedrigere, nicht umgekehrt (außer Korrektur)', () => {
    let n = setzeStufe(leererEinsatzNachweis(), 'sc', 'angeleitet', '2026-12-02');
    n = setzeStufe(n, 'sc', 'gesehen', '2026-12-03');
    expect(n.vermerke).toEqual([{ taetigkeit: 'sc', stufe: 'angeleitet', datum: '2026-12-02' }]);
    n = setzeStufe(n, 'sc', 'selbststaendig', '2026-12-10');
    expect(n.vermerke[0]!.stufe).toBe('selbststaendig');
    n = setzeStufe(n, 'sc', 'gesehen', '2026-12-11', true);
    expect(n.vermerke[0]!.stufe).toBe('gesehen');
    expect(setzeStufe(n, 'sc', null, '2026-12-11').vermerke).toEqual([]);
  });

  it('neuer Vermerk hebt eine Bestätigung auf', () => {
    const n = { ...leererEinsatzNachweis(), bestaetigung: { name: 'PA', datum: '2026-12-20' } };
    expect(setzeStufe(n, 'vital', 'gesehen', '2026-12-21').bestaetigung).toBeUndefined();
  });

  it('eigene Tätigkeiten bekommen fortlaufende IDs und zählen mit', () => {
    let n = eigeneTaetigkeit(leererEinsatzNachweis(), ' PEG-Verband ');
    n = eigeneTaetigkeit(n, 'Drainage');
    n = eigeneTaetigkeit(n, '   ');
    expect(n.eigene.map((t) => t.id)).toEqual(['eigen:1', 'eigen:2']);
    n = setzeStufe(n, 'eigen:2', 'gesehen', '2026-12-02');
    const z = zaehle(n);
    expect(z.gesehen).toBe(1);
    expect(z.gesamt).toBe(KATALOG.flatMap((g) => g.taetigkeiten).length + 2);
  });

  it('Gesprächstermine liegen im Einsatz', () => {
    expect(gespraechTermin(E, 'erst')).toBe('2026-12-04');
    expect(gespraechTermin(E, 'zwischen')).toBe('2026-12-14');
    expect(gespraechTermin(E, 'abschluss')).toBe('2026-12-24');
    expect(gespraechTermin({ von: '2026-12-01', bis: '2026-12-02' }, 'abschluss')).toBe('2026-12-01');
  });

  it('Vorbereitung nimmt Ziele, offene Fragen und Stand', () => {
    const t: Tagebuch = { ...LEER, notizen: [
      { id: 'a', at: '', tag: '2026-12-02', art: 'frage', text: 'Warum Heparin s.c.?', einsatzId: 'e1', themen: [], erledigt: false },
      { id: 'b', at: '', tag: '2026-12-02', art: 'frage', text: 'Erledigt', themen: [], erledigt: true },
      { id: 'c', at: '', tag: '2026-12-02', art: 'frage', text: 'Anderer Einsatz', einsatzId: 'x', themen: [], erledigt: false },
    ] };
    let n = setzeStufe(leererEinsatzNachweis(), 'sc', 'selbststaendig', '2026-12-02');
    n = setzeStufe(n, 'wunde', 'angeleitet', '2026-12-02');
    const v = vorbereitung(E, n, t, 'zwischen');
    expect(v.ziele).toBe('- Verbandwechsel sicher');
    expect(v.fragen).toBe('- Warum Heparin s.c.?');
    expect(v.gut).toContain('s.c.-Injektion');
    expect(v.unterstuetzung).toContain('Verbandwechsel');
    expect(vorbereitung(E, n, t, 'erst').gut).toBe('');
  });

  it('Gespräche bleiben je Art einmalig und sortiert', () => {
    const g = (art: 'erst' | 'zwischen' | 'abschluss') => ({ art, datum: '', ziele: '', gut: '', unterstuetzung: '', fragen: '', vereinbarungen: art });
    let n = setzeGespraech(leererEinsatzNachweis(), g('abschluss'));
    n = setzeGespraech(n, g('erst'));
    n = setzeGespraech(n, { ...g('erst'), vereinbarungen: 'neu' });
    expect(n.gespraeche.map((x) => x.art)).toEqual(['erst', 'abschluss']);
    expect(n.gespraeche[0]!.vereinbarungen).toBe('neu');
  });

  it('prüft gespeicherte Daten streng', () => {
    const roh = { v: 1, einsaetze: {
      e1: {
        vermerke: [{ taetigkeit: 'sc', stufe: 'gesehen', datum: '2026-12-01' }, { taetigkeit: 'unbekannt', stufe: 'gesehen', datum: '2026-12-01' }, { taetigkeit: 'vital', stufe: 'super', datum: '2026-12-01' }],
        eigene: [{ id: 'eigen:1', label: 'X' }, { id: 'boese', label: 'Y' }],
        gespraeche: [{ art: 'erst', datum: '', ziele: '', gut: '', unterstuetzung: '', fragen: '', vereinbarungen: '' }, { art: 'quatsch' }],
        bestaetigung: { name: 'PA', datum: '2026-12-20', bild: 'javascript:alert(1)' },
      },
      e2: 'kaputt',
    } };
    const n = pruefeNachweis(roh);
    expect(Object.keys(n.einsaetze)).toEqual(['e1']);
    const e1 = n.einsaetze.e1!;
    expect(e1.vermerke).toHaveLength(1);
    expect(e1.eigene.map((t) => t.id)).toEqual(['eigen:1']);
    expect(e1.gespraeche).toHaveLength(1);
    expect(e1.bestaetigung).toBeUndefined();
    expect(pruefeNachweis(null)).toEqual({ v: 1, einsaetze: {} });
    const gross = { v: 1, einsaetze: { e1: { vermerke: [], eigene: [], gespraeche: [], bestaetigung: { name: 'PA', datum: '2026-12-20', bild: `data:image/png;base64,${'A'.repeat(MAX_BILD)}` } } } };
    expect(pruefeNachweis(gross).einsaetze.e1!.bestaetigung).toBeUndefined();
  });
});
