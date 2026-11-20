import { describe, expect, it } from 'vitest';
import { formFehler } from '../../../ui/sim/auswertung';
import { bewerte } from '../kern/auswertung';
import { FAELLE_V2 } from '../kern/faelle';
import { SR_SEPTISCHER_SCHOCK as KRANZ } from '../kern/faelle/sr-septischer-schock';
import { sende, start, type SimZustand } from '../kern/kern';
import type { FallV2, Rolle, SimEventEingabe } from '../kern/typen';
import { simAuswertungNeu } from './auswertung-karte';
import { tutorKontext } from './tutor';
import { berichtFallNeu, erledigtNeu, findeNeu, planVorlageNeu, uebergabeFallNeu, weiterLinkNeu } from './weitergabe';

const rolleFuer = (fall: FallV2): Rolle => (fall.geeignet.rollen.includes(2) ? 2 : fall.geeignet.rollen[0]);
function spiele(fall: FallV2, eingaben: readonly SimEventEingabe[]): SimZustand {
  let z = start(fall, rolleFuer(fall), 2);
  const loese = (x: SimZustand) => {
    while (x.offeneEntscheidung) {
      const ev = x.fall.ereignisse.find((e) => e.id === x.offeneEntscheidung)!;
      x = sende(x, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
    }
    return x;
  };
  for (const e of eingaben) z = sende(loese(z), e);
  return loese(z);
}

describe('Neuer Arbeitsplatz: Auswertung, Tutor, Weitergabe', () => {
  for (const fall of FAELLE_V2) {
    const muster = spiele(fall, fall.pruefwege.muster);
    const leer = sende(start(fall, rolleFuer(fall), 2), { art: 'abschluss', probleme: [], ziele: [] });

    it(`${fall.id}: Adapter liefert gültige gemeinsame Auswertung`, () => {
      for (const z of [muster, leer]) {
        const s = simAuswertungNeu(z, bewerte(z));
        expect(formFehler(s)).toEqual([]);
        expect(s.merksaetze).toEqual(fall.lernziele);
      }
      const s = simAuswertungNeu(leer, bewerte(leer));
      expect(s.punkte.some((p) => p.urteil === 'fehler' && p.wann?.startsWith('spätestens') || p.wann === 'bis Fallende')).toBe(true);
    });

    it(`${fall.id}: Tutor-Kontext enthält Protokoll, Musterweg und Leitfaden mit Quellen`, () => {
      const k = tutorKontext(muster, bewerte(muster));
      expect(k).toContain('Protokoll der lernenden Person');
      expect(k).toContain('Musterweg:');
      expect(k).toContain(fall.leitfaden[0]!.titel);
      expect(k).toContain(fall.quellen.find((q) => fall.leitfaden.some((l) => l.quellen?.includes(q.id)))!.titel);
      expect(k).not.toMatch(/<\/?(dokument|system)/i);
    });

    it(`${fall.id}: Übergabe, Bericht und Planung aus dem gespielten Fall`, () => {
      const u = uebergabeFallNeu(muster);
      expect(u.kernpunkte.length).toBeGreaterThanOrEqual(4);
      expect(u.kernpunkte.every((k) => k.muster.length > 0)).toBe(true);
      const b = berichtFallNeu(muster);
      expect(b.kernpunkte.some((k) => k.baustein === 'massnahme')).toBe(true);
      expect(b.kernpunkte.some((k) => k.baustein === 'weitergabe')).toBe(true);
      expect(planVorlageNeu(muster).text).toContain(fall.person.name);
      // ohne Messung: Übergabe erwartet „nicht gemessen“
      if (fall.setting === 'ambulant') expect(uebergabeFallNeu(leer).kernpunkte.some((k) => k.id === 'ungemessen')).toBe(true);
      expect(weiterLinkNeu('bericht', fall)).toBe(`#/lernen/dokumentation?teil=bericht&aus=praxis&sitzung=neu%3A${fall.id}`);
    });
  }

  it('Kranz: Allergie gehört in die Übergabe, Fehlhandlungen nicht in „erledigt“', () => {
    const z = spiele(KRANZ, KRANZ.pruefwege.muster);
    expect(uebergabeFallNeu(z).kernpunkte.some((k) => k.id === 'allergie')).toBe(true);
    let f = start(KRANZ, 'pflegefachperson', 2);
    for (const e of [{ art: 'massnahme', id: 'oberkoerper-hoch' }] as SimEventEingabe[]) f = sende(f, e);
    expect(erledigtNeu(f)).not.toContain('Oberkörper hochlagern (Atemerleichterung)');
    expect(f.fehlerAus).toContain('f-oberkoerper-hoch');
  });

  it('findeNeu: nur mit Präfix und gespeichertem, abgeschlossenem Fall', () => {
    expect(findeNeu(null)).toBeNull();
    expect(findeNeu('abc')).toBeNull();
    expect(findeNeu('neu:gibt-es-nicht')).toBeNull();
  });
});
