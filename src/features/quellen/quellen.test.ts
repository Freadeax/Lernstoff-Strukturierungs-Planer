import { describe, expect, it } from 'vitest';
import { STANDARDS } from '../dnqp/standards';
import { alleNutzungen, ALLGEMEINE_STAENDE } from './nutzung';
import { eintraegeFuer, neuereFassungFuer, QUELLEN, jahr } from './register';
import { plusMonate, quellenStand, alleStaende } from './status';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe('Quellenregister', () => {
  it('jeder Eintrag hat eindeutige ID, https-Fundstelle und offizielle Beobachtungsstelle', () => {
    const ids = QUELLEN.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUELLEN) {
      expect(q.aktuell.fundstelle, q.id).toMatch(/^https:\/\//);
      expect(q.beobachten, q.id).toMatch(/^https:\/\//);
      if (q.geprueftAm) expect(q.geprueftAm, q.id).toMatch(ISO);
      if (q.aktuell.erschienen) expect(q.aktuell.erschienen, q.id).toMatch(ISO);
      if (!q.fest) expect(q.intervallMonate, q.id).toBeGreaterThan(0);
    }
  });

  it('jede Quellenangabe eines Inhalts gehört zu einem Registereintrag (neue Quellen bitte eintragen)', () => {
    const ohne = alleNutzungen().filter((n) => !ALLGEMEINE_STAENDE.test(n.quelle.stand) && !/je Präparat|Lehrbuch/.test(`${n.quelle.stand} ${n.quelle.titel}`) && eintraegeFuer(n.quelle.titel).length === 0);
    expect(ohne.map((n) => `${n.inhalt}: ${n.quelle.titel}`)).toEqual([]);
  });

  it('übernimmt alle geltenden DNQP-Standards aus dem DNQP-Modul', () => {
    for (const s of STANDARDS.filter((x) => x.status === 'aktuell')) expect(QUELLEN.some((q) => q.id === s.id), s.id).toBe(true);
  });

  it('zeigt neue Fassungen an Inhalten mit älterem Stand (Beispiele aus der Recherche 11/2026)', () => {
    expect(neuereFassungFuer({ titel: 'ESC Guidelines for heart failure', stand: '2021' })?.id).toBe('esc.hf');
    expect(neuereFassungFuer({ titel: 'ERC Guidelines: Paediatric Life Support', stand: '2021' })?.id).toBe('erc');
    expect(neuereFassungFuer({ titel: 'ERC Guidelines: Basic Life Support', stand: '2025' })).toBeUndefined();
    expect(neuereFassungFuer({ titel: 'Surviving Sepsis Campaign Guidelines', stand: '2026' })).toBeUndefined();
    // Änderung einer älteren Fassung zählt mit ihrem Jahr (KRINKO Händehygiene 2016, geändert 2026)
    expect(neuereFassungFuer({ titel: 'KRINKO-Empfehlungen (RKI), u. a. Händehygiene', stand: '2016' })?.id).toBe('krinko');
    expect(jahr(QUELLEN.find((q) => q.id === 'krinko')!.aktuell.stand)).toBe(2026);
  });

  it('Sepsis-Inhalte stehen auf der Surviving Sepsis Campaign 2026', () => {
    const ssc = alleNutzungen().filter((n) => /Surviving Sepsis/.test(n.quelle.titel));
    expect(ssc.length).toBeGreaterThan(0);
    for (const n of ssc) expect(jahr(n.quelle.stand), n.inhalt).toBe(2026);
  });
});

describe('Status je Quelle', () => {
  const basis = QUELLEN.find((q) => q.id === 'resus.anaphylaxie')!;
  it('rechnet Monate kalendergenau', () => {
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonate('2026-11-15', 12)).toBe('2027-11-15');
  });
  it('aktuell, fällig, noch nie nachgesehen', () => {
    expect(quellenStand({ ...basis, geprueftAm: '2026-11-15' }, [], '2026-12-01').status).toBe('aktuell');
    expect(quellenStand({ ...basis, geprueftAm: '2025-01-01' }, [], '2026-12-01').status).toBe('faellig');
    expect(quellenStand({ ...basis, geprueftAm: undefined }, [], '2026-12-01').status).toBe('nie-geprueft');
  });
  it('ein lokaler Vermerk setzt die Erinnerung zurück, schließt aber keinen offenen Abgleich', () => {
    const v = [{ id: basis.id, datum: '2026-12-01' }];
    expect(quellenStand({ ...basis, geprueftAm: '2025-01-01' }, [], '2026-12-02', v).status).toBe('aktuell');
    expect(quellenStand({ ...basis, offen: 'Inhalte anpassen' }, [], '2026-12-02', v).status).toBe('abgleich');
  });
  it('Inhalte mit älterer Quellenangabe lösen „abgleichen“ aus', () => {
    const n = [{ inhalt: 'Fall X', bereich: 'Test', pfad: '/', risiko: true, quelle: { titel: 'ESC Guidelines for heart failure', stand: '2021' } }];
    const s = quellenStand(QUELLEN.find((q) => q.id === 'esc.hf')!, n, '2026-11-15');
    expect(s.status).toBe('abgleich');
    expect(s.veraltet).toHaveLength(1);
  });
  it('alle Stände lassen sich berechnen, Abgleich zuerst', () => {
    const st = alleStaende(alleNutzungen(), '2026-11-15');
    expect(st).toHaveLength(QUELLEN.length);
    expect(st[0].status).toBe('abgleich');
  });
});
