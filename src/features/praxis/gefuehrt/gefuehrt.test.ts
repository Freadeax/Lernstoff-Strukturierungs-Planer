import { describe, expect, it } from 'vitest';
import { formFehler } from '../../../ui/sim/auswertung';
import { aktuellerSchritt, beginne, entscheide, fertig, unterbrechung, waehle, waehlbar, weiter, type GStand } from './ablauf';
import { gefuehrtAuswertung } from './auswertung';
import { LEITFAELLE } from './leitfaelle';
import type { Leitfall, Wertung } from './typen';

/** Spielt einen Leitfall durch: wählt je Schritt die Optionen nach `wahl`, Unterbrechungen mit der besten Option. */
function spiele(l: Leitfall, wahl: (w: Wertung) => boolean): GStand {
  let st = beginne(l);
  for (let i = 0; i < 200 && !fertig(l, st); i++) {
    const e = unterbrechung(st);
    if (e) { st = entscheide(l, st, e.choices!.find((c) => c.best)!.id); continue; }
    const schritt = aktuellerSchritt(l, st)!;
    const o = schritt.optionen.find((x) => wahl(x.wertung) && waehlbar(l, st, x.id)) ?? schritt.optionen.find((x) => waehlbar(l, st, x.id));
    if (o && !(st.picks[schritt.id] ?? []).length) st = waehle(l, st, o.id);
    st = weiter(l, st);
  }
  return st;
}

describe('Leitfälle (geführt)', () => {
  it('gibt es für sechs Fälle', () => expect(LEITFAELLE.map((l) => l.fall)).toEqual(['nachtwache', 'pflegeheim', 'asthma', 'sepsis', 'aufwachraum', 'hausbesuch']));
  for (const l of LEITFAELLE) {
    describe(l.fall, () => {
      const st0 = beginne(l);
      const sc = st0.session.scenario;
      it('verweist nur auf vorhandene Handlungen und Medikamente', () => {
        for (const s of l.schritte) for (const o of s.optionen) {
          for (const a of o.aktionen ?? []) expect(sc.actions.some((x) => x.id === a), `${s.id}/${o.id}: ${a}`).toBe(true);
          if (o.medikation) expect(sc.medications.some((m) => m.id === o.medikation)).toBe(true);
        }
      });
      it('hat je Schritt eindeutige Optionen, mindestens eine richtige und jede begründet', () => {
        expect(new Set(l.schritte.map((s) => s.id)).size).toBe(l.schritte.length);
        for (const s of l.schritte) {
          expect(new Set(s.optionen.map((o) => o.id)).size).toBe(s.optionen.length);
          expect(s.optionen.some((o) => o.wertung === 'gut'), s.id).toBe(true);
          expect(s.optionen.length).toBeGreaterThanOrEqual(2);
          for (const o of s.optionen) expect(o.warum.length, `${s.id}/${o.id}`).toBeGreaterThan(20);
        }
      });
      it('beginnt mit dem Ersteindruck und endet mit der Dokumentation', () => {
        expect(l.schritte[0]!.phase).toBe('ersteindruck');
        expect(l.schritte.at(-1)!.phase).toBe('doku');
      });
      it('richtiger Weg: Fall endet ohne Fehlhandlung und mit vollständiger Auswertung', () => {
        const st = spiele(l, (w) => w === 'gut');
        expect(st.session.phase).toBe('finished');
        expect(st.session.harms ?? []).toEqual([]);
        expect(st.session.flags.help).toBeDefined();
        const a = gefuehrtAuswertung(l, st);
        expect(formFehler(a)).toEqual([]);
        expect(a.ergebnis.stufe).not.toBe('kritisch');
        expect(a.punkte.filter((p) => p.id.startsWith('schritt:')).every((p) => p.urteil === 'gut')).toBe(true);
      });
      it('gefährlicher Weg wird als kritisch gewertet', () => {
        if (!l.schritte.some((s) => s.optionen.some((o) => o.wertung === 'gefaehrlich'))) return;
        const st = spiele(l, (w) => w === 'gefaehrlich');
        expect(st.session.phase).toBe('finished');
        expect((st.session.harms ?? []).length).toBeGreaterThan(0);
        expect(gefuehrtAuswertung(l, st).ergebnis.stufe).toBe('kritisch');
      });
      it('ist deterministisch', () => {
        const a = spiele(l, (w) => w === 'gut'); const b = spiele(l, (w) => w === 'gut');
        expect(a.session.vitals).toEqual(b.session.vitals);
        expect(a.session.time).toBe(b.session.time);
      });
    });
  }
});
