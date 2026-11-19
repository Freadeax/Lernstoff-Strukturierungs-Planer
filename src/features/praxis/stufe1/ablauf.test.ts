import { describe, expect, it } from 'vitest';
import { bewerte } from '../kern/auswertung';
import { FAELLE_V2 } from '../kern/faelle';
import { sende, start, type SimZustand } from '../kern/kern';
import type { FallV2, Rolle } from '../kern/typen';
import { beginne, bilanz, entscheide, fertig, offeneEntscheidung, plane, rekonstruiere, waehle, weiter, type Aktion, type Stufe1Stand } from './ablauf';

const rolleFuer = (fall: FallV2): Rolle => (fall.geeignet.rollen.includes(2) ? 2 : fall.geeignet.rollen[0]);

/** Musterweg direkt im Kern (wie kern.test.ts): offene Entscheidungen bekommen die „gut“-Option. */
function musterImKern(fall: FallV2): SimZustand {
  let z = start(fall, rolleFuer(fall), 1);
  const loese = () => { while (z.offeneEntscheidung) { const ev = fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!; z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id }); } };
  for (const e of fall.pruefwege.muster) { loese(); z = sende(z, e); }
  loese();
  return z;
}

/** Spielt den Lernmodus durch. `irrweg`: erst alle falschen Möglichkeiten, dann die richtige. */
function spiele(fall: FallV2, irrweg: boolean) {
  let st: Stufe1Stand = beginne(fall, rolleFuer(fall));
  const aktionen: Aktion[] = [];
  const tu = (a: Aktion) => { aktionen.push(a); st = a.art === 'wahl' ? waehle(st, a.option) : a.art === 'weiter' ? weiter(st) : entscheide(st, a.wahl); };
  for (let runde = 0; runde < 400 && !fertig(st); runde++) {
    const ev = offeneEntscheidung(st);
    if (ev) { const o = ev.entscheidung!.find((x) => x.wertung === 'gut') ?? ev.entscheidung![0]!; tu({ art: 'entscheidung', wahl: o.id }); continue; }
    const a = st.aktuell;
    if (!a) break;
    const reihe = irrweg ? [...a.optionen.filter((o) => o.wertung !== 'gut'), ...a.optionen.filter((o) => o.wertung === 'gut')] : a.optionen.filter((o) => o.wertung === 'gut');
    for (const o of reihe) { if (fertig(st) || offeneEntscheidung(st)) break; tu({ art: 'wahl', option: o.id }); }
    if (!offeneEntscheidung(st)) tu({ art: 'weiter' });
  }
  return { st, aktionen };
}

describe('Stufe 1 (geführt) auf dem Kern', () => {
  for (const fall of FAELLE_V2) {
    describe(fall.id, () => {
      it('Plan folgt dem Musterweg und endet mit dem Pflegebedarf', () => {
        const p = plane(fall);
        expect(p.length).toBeGreaterThan(3);
        expect(p.at(-1)!.art).toBe('pflegebedarf');
      });

      it('jeder Schritt: 2–4 Möglichkeiten, genau eine richtig, alle begründet', () => {
        const { st } = spiele(fall, false);
        for (const s of st.erledigt) {
          expect(s.optionen.length, `Schritt ${s.nr}`).toBeGreaterThanOrEqual(2);
          expect(s.optionen.length).toBeLessThanOrEqual(4);
          expect(s.optionen.filter((o) => o.wertung === 'gut')).toHaveLength(1);
          expect(new Set(s.optionen.map((o) => o.id)).size).toBe(s.optionen.length);
          for (const o of s.optionen) expect(o.warum.trim().length, `${s.nr}:${o.id}`).toBeGreaterThan(10);
        }
      });

      it('immer richtig = Musterweg im Kern (gleiche Eingaben, gleiche Auswertung)', () => {
        const { st } = spiele(fall, false);
        expect(fertig(st)).toBe(true);
        expect(st.stand.z.eingaben).toEqual(musterImKern(fall).eingaben);
        const a = bewerte(st.stand.z);
        for (const b of a.kb) if (b.prozent !== null) expect(b.prozent, `KB ${b.id}`).toBeGreaterThanOrEqual(90);
        expect(bilanz(st).erstVersuch).toBe(bilanz(st).schritte);
      });

      it('Irrweg (erst alles Falsche) läuft durch und ist nachspielbar', () => {
        const { st, aktionen } = spiele(fall, true);
        expect(fertig(st)).toBe(true);
        const b = rekonstruiere(fall, rolleFuer(fall), aktionen);
        expect(b.stand.z.eingaben).toEqual(st.stand.z.eingaben);
        expect(b.stand.z.t).toBe(st.stand.z.t);
      });
    });
  }

  it('Ablenker kommen aus dem Fall: Pflegefehler, Befugnis und Reihenfolge werden erkannt', () => {
    const herkunft = new Set<string>();
    for (const fall of FAELLE_V2) for (const s of spiele(fall, false).st.erledigt) for (const o of s.optionen) herkunft.add(o.herkunft);
    for (const h of ['fehler', 'befugnis', 'reihenfolge', 'ablenker', 'kommunikation', 'pflegebedarf']) expect(herkunft, h).toContain(h);
  });

  it('falsche Wahl wird im Kern ausgeführt und zählt in der Bilanz', () => {
    const fall = FAELLE_V2[0]!;
    let st = beginne(fall, rolleFuer(fall));
    const falsch = st.aktuell!.optionen.find((o) => o.wertung !== 'gut' && o.eingaben.length)!;
    const t0 = st.stand.z.t;
    st = waehle(st, falsch.id);
    expect(st.stand.z.t).toBeGreaterThan(t0);
    expect(weiter(st)).toBe(st);       // erst nach der richtigen Wahl geht es weiter
    st = waehle(st, st.aktuell!.optionen.find((o) => o.wertung === 'gut')!.id);
    st = weiter(st);
    expect(bilanz(st).lernpunkte).toHaveLength(1);
  });
});
