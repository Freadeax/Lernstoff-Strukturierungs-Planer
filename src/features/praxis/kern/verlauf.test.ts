// P12: sichtbarer Verlauf (Meldungen art 'verlauf') – nur Beobachtbares, entprellt, deterministisch.
import { describe, expect, it } from 'vitest';
import { inTakten } from './auswertung';
import { FAELLE_V2 } from './faelle';
import { replay, sende, start, type SimZustand } from './kern';
import { ENTPRELL_SEK, MERKMAL_IDS, MIN_ABSTAND_SEK, verlaufTakt, type Merkmal, type VerlaufStand } from './verlauf';

const verlauf = (z: SimZustand) => z.meldungen.filter((m) => m.art === 'verlauf');
const warte = (z: SimZustand, sek: number) => sende(z, { art: 'warten', sek });
const fall = (id: string) => FAELLE_V2.find((f) => f.id === id)!;

function basis(): Record<Merkmal, string> {
  const r = {} as Record<Merkmal, string>;
  for (const m of MERKMAL_IDS) r[m] = { bewusstsein: 'A', atmung: 'ruhig', atemtempo: 'normal', haut: 'rosig', schmerz: 'gering', unruhe: 'ruhig', angst: 'gering', orientierung: 'klar', krampf: 'nein', uebelkeit: 'nein' }[m];
  return r;
}

describe('Verlauf-Meldungen (P12)', () => {
  it('meldet eine Änderung erst, wenn sie ENTPRELL_SEK besteht; kurzes Flackern bleibt still', () => {
    const st: VerlaufStand = { stand: basis(), kandidat: {}, zuletzt: {} };
    const blass = { ...basis(), haut: 'blass' };
    expect(verlaufTakt(st, blass, 5, 'Frau X')).toEqual([]);
    expect(verlaufTakt(st, basis(), 10, 'Frau X')).toEqual([]); // zurück: verworfen
    expect(verlaufTakt(st, blass, 15, 'Frau X')).toEqual([]);
    const neu = verlaufTakt(st, blass, 15 + ENTPRELL_SEK, 'Frau X');
    expect(neu).toHaveLength(1);
    expect(neu[0]!.text).toBe('Frau X wird blass.');
    expect(neu[0]!.schlechter).toBe(true);
    // Rückweg erst nach dem Mindestabstand
    verlaufTakt(st, basis(), 40, 'Frau X');
    expect(verlaufTakt(st, basis(), 15 + ENTPRELL_SEK + 30, 'Frau X')).toEqual([]);
    expect(verlaufTakt(st, basis(), 15 + ENTPRELL_SEK + MIN_ABSTAND_SEK, 'Frau X').map((v) => v.text)).toEqual(['Die Haut von Frau X wird wieder rosiger.']);
  });

  it('Krampfanfall wird sofort gemeldet; wer nur auf Schmerz reagiert, wirkt nicht „verwirrt“', () => {
    const st: VerlaufStand = { stand: basis(), kandidat: {}, zuletzt: {} };
    expect(verlaufTakt(st, { ...basis(), krampf: 'ja' }, 5, 'Leon').map((v) => v.merkmal)).toEqual(['krampf']);
    const st2: VerlaufStand = { stand: basis(), kandidat: {}, zuletzt: {} };
    const tief = { ...basis(), bewusstsein: 'P', orientierung: 'verwirrt', angst: 'deutlich' };
    verlaufTakt(st2, tief, 5, 'Herr K');
    expect(verlaufTakt(st2, tief, 5 + ENTPRELL_SEK, 'Herr K').map((v) => v.merkmal)).toEqual(['bewusstsein']);
  });

  it('Panik ohne Hilfe: Frau Keller „atmet schneller“ und „gerät in Panik“, Bild zeigt Angst', () => {
    const z = warte(start(fall('psy-panik-suizidalitaet'), 2, 2), 900);
    const texte = verlauf(z).map((m) => m.text);
    expect(texte.some((t) => /atmet schneller/.test(t))).toBe(true);
    expect(texte.some((t) => /gerät in Panik/.test(t))).toBe(true);
    expect(z.bild.mimik).toBe('angst');
  });

  it('septischer Schock ohne Hilfe: Bewusstsein sinkt sichtbar, als wichtige Verschlechterung markiert', () => {
    const z = warte(start(fall('sr-septischer-schock'), 'pflegefachperson', 2), 900);
    const m = verlauf(z).find((x) => x.quelle === 'verlauf:bewusstsein');
    expect(m?.text).toMatch(/nur noch auf Schmerzreiz/);
    expect(m?.wichtig).toBe(true);
    expect(z.bild.mimik).toBe('schlaefrig');
  });

  it('nennt nie Zahlen (keine versteckten Modellwerte) – alle Fälle, Muster- und Unterlassungsweg', () => {
    for (const f of FAELLE_V2) {
      const rolle = f.geeignet.rollen[0]!;
      for (const z of [replay(f, rolle, 2, 1, f.pruefwege.muster), warte(start(f, rolle, 2), Math.max(f.pruefwege.unterlassung.bisSek, 900))]) {
        for (const m of verlauf(z)) expect(m.text, `${f.id}: ${m.text}`).not.toMatch(/\d/);
      }
    }
  });

  it('Replay und Warten in 5-s-Stücken ergeben dieselben Verlauf-Meldungen', () => {
    for (const f of FAELLE_V2) {
      const rolle = f.geeignet.rollen[0]!;
      const eingaben = [...f.pruefwege.muster, { art: 'warten' as const, sek: 600 }];
      const a = replay(f, rolle, 2, 1, eingaben);
      const b = replay(f, rolle, 2, 1, inTakten(eingaben));
      expect(verlauf(b), f.id).toEqual(verlauf(a));
      expect(b.bild, f.id).toEqual(a.bild);
    }
  });

  it('ein Fallereignis im selben Takt hat Vorrang (keine doppelte Beschreibung des Fieberkrampfs)', () => {
    const z = warte(start(fall('paed-fieberkrampf'), 2, 2), 600);
    const krampf = verlauf(z).filter((m) => m.quelle === 'verlauf:krampf' && /krampft/.test(m.text));
    const ereignisZeiten = z.meldungen.filter((m) => m.art === 'ereignis').map((m) => m.t);
    for (const k of krampf) expect(ereignisZeiten).not.toContain(k.t);
  });
});
