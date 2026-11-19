// P11 Kommunikationsbereich: Partner, Ungelesen, Rückauftrag-Leiste, Freitext-Zuordnung offline
import { describe, expect, it } from 'vitest';
import { PILOT_AMBULANT as FALL } from '../kern/faelle/amb-sturz-exsikkose';
import { sende, start, type SimZustand } from '../kern/kern';
import { ZUSAGE_ID } from '../kern/kommunikation';
import type { SimEventEingabe } from '../kern/typen';
import { auftraege, bausteinGruppen, fadenLaenge, partner, verstehe } from './gespraeche';

const spiele = (eingaben: SimEventEingabe[], z: SimZustand = start(FALL, 2, 2)) => eingaben.reduce(sende, z);

describe('Kommunikationsbereich (P11)', () => {
  it('zeigt Ärztin, Patientin, Angehörige (aus team.weitere) und PA; Ungelesen zählt Antworten', () => {
    let z = start(FALL, 2, 2);
    expect(partner(z).map((p) => p.id)).toEqual(['aerztin', 'patient', 'angehoerige', 'pa']);
    expect(partner(z).find((p) => p.id === 'angehoerige')?.name).toBe('Tochter Anke Lindner');
    z = sende(z, { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['a-verwirrt-neu'] });
    expect(partner(z).find((p) => p.id === 'aerztin')).toMatchObject({ ungelesen: 1, telefonOffen: true });
    expect(partner(z, { aerztin: fadenLaenge(z, 'aerztin') }).find((p) => p.id === 'aerztin')?.ungelesen).toBe(0);
    // Stufe 3: keine Praxisanleitung als Gesprächspartner
    expect(partner(start(FALL, 2, 3)).map((p) => p.id)).not.toContain('pa');
  });

  it('Rückfrage bietet die Zusage an; Rückauftrag-Leiste mit Frist und Melden erst nach dem Messen', () => {
    let z = spiele([{ art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-verwirrt-neu'] }]);
    expect(bausteinGruppen(z, 'aerztin')[0]).toMatchObject({ teil: 'Z' });
    expect(bausteinGruppen(z, 'aerztin').find((g) => g.teil === 'W')?.liste.map((b) => b.id)).toEqual(['wert:rrSys']);
    z = sende(z, { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: [ZUSAGE_ID] });
    expect(auftraege(z)).toMatchObject([{ id: 'af-bz', status: 'offen', frist: 'noch 10 Min.', meldbar: false }]);
    z = spiele([{ art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' }], z);
    expect(auftraege(z)[0]).toMatchObject({ status: 'erledigt', meldbar: true });
  });

  it('Freitext offline: Stichwörter werden Bausteinen zugeordnet', () => {
    const z = spiele([{ art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['a-verwirrt-neu'] }]);
    const angebot = bausteinGruppen(z, 'aerztin').flatMap((g) => g.liste);
    expect(verstehe('Der Blutzucker liegt bei 128.', angebot)).toEqual(['wert:bz']);
    expect(verstehe('Sie nimmt Torasemid und Ramipril wegen ihrer Herzinsuffizienz', angebot)).toContain('b-herz-diuretikum');
    expect(verstehe('Hallo, guten Morgen', angebot)).toEqual([]);
  });
});
