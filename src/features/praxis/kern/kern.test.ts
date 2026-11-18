import { describe, expect, it } from 'vitest';
import { FAELLE_V2 } from './faelle';
import { PILOT_AMBULANT as FALL } from './faelle/amb-sturz-exsikkose';
import { anteil, freigabe, gilt, massnahme, replay, sende, start, vorspulen, type SimZustand } from './kern';
import type { FallV2, Rolle, SimEventEingabe, Stufe } from './typen';

const ROLLEN: Rolle[] = [1, 2, 3, 'pflegefachperson'];

/** Spielt Eingaben; offene Entscheidungen bekommen die erste „gut“-Option. */
function spiele(fall: FallV2, rolle: Rolle, stufe: Stufe, eingaben: readonly SimEventEingabe[]): SimZustand {
  let z = start(fall, rolle, stufe);
  for (const e of eingaben) {
    z = loeseEntscheidung(z);
    z = sende(z, e);
  }
  return loeseEntscheidung(z);
}
function loeseEntscheidung(z: SimZustand): SimZustand {
  while (z.offeneEntscheidung) {
    const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
    const gut = ev.entscheidung!.find((o) => o.wertung === 'gut')!;
    z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: gut.id });
  }
  return z;
}
function warteBis(z: SimZustand, t: number): SimZustand {
  while (z.t < t && !z.ende) z = loeseEntscheidung(sende(z, { art: 'warten', sek: Math.min(60, t - z.t) }));
  return z;
}
const arten = (z: SimZustand) => z.log.map((e) => e.art);

describe('Fallschema v2: Datenprüfung aller Fälle', () => {
  for (const fall of FAELLE_V2) {
    describe(fall.id, () => {
      it('jede angebotene Maßnahme existiert und hat Befugnis für alle Rollen', () => {
        for (const id of fall.massnahmen) {
          const m = massnahme(fall, id);
          expect(m, id).toBeDefined();
          for (const r of ROLLEN) expect(m!.befugnis[r], `${id} ${r}`).toBeDefined();
        }
      });
      it('Befunde, Anordnungen und SBAR-Verweise zeigen auf Vorhandenes', () => {
        for (const b of fall.befunde) expect(fall.massnahmen, b.massnahme).toContain(b.massnahme);
        const anordnungen = new Set(fall.anordnungen.map((a) => a.id));
        for (const r of fall.arzt.regeln) for (const a of r.anordnungen ?? []) expect(anordnungen.has(a), a).toBe(true);
        for (const a of fall.start.anordnungen ?? []) expect(anordnungen.has(a), a).toBe(true);
        for (const a of fall.anordnungen) expect(massnahme(fall, a.massnahme), a.massnahme).toBeDefined();
        const sbar = new Set(fall.sbar.map((s) => s.id));
        for (const e of fall.pruefwege.muster) if (e.art === 'anruf') for (const s of e.sbar) expect(sbar.has(s), s).toBe(true);
      });
      it('IDs sind eindeutig', () => {
        for (const liste of [fall.massnahmen, fall.sbar.map((s) => s.id), fall.anordnungen.map((a) => a.id), fall.ereignisse.map((e) => e.id), fall.bewertung.pflicht.map((p) => p.id), fall.bewertung.fehler.map((f) => f.id)]) {
          expect(new Set(liste).size).toBe(liste.length);
        }
      });
      it('Musterweg: ohne Fehler, ohne Grenzüberschreitung, alle Pflichthandlungen erfüllt', () => {
        const z = spiele(fall, 2, 2, fall.pruefwege.muster);
        expect(z.fehlerAus).toEqual([]);
        expect(arten(z)).not.toContain('grenzueberschreitung');
        const offen = fall.bewertung.pflicht.filter((p) => !gilt(z, p.erfuellt)).map((p) => p.id);
        expect(offen).toEqual([]);
        expect(z.abschluss).toBeDefined();
      });
      it('Unterlassungsweg: Zustand verschlechtert sich', () => {
        const z = warteBis(start(fall, 2, 2), fall.pruefwege.unterlassung.bisSek);
        expect(gilt(z, fall.pruefwege.unterlassung.erwartet)).toBe(true);
      });
      it('Grenzweg: Stufe 2 greift die PA ein, Stufe 3 wird eine Grenzüberschreitung festgehalten', () => {
        const g = fall.pruefwege.grenze;
        if (!g) return;
        expect(arten(spiele(fall, g.rolle, 2, g.events))).toContain(g.erwartet);
        expect(arten(spiele(fall, g.rolle, 3, g.events))).toContain('grenzueberschreitung');
      });
      it('deterministisch: Replay der Eingaben ergibt denselben Zustand', () => {
        const a = spiele(fall, 2, 2, fall.pruefwege.muster);
        const b = replay(fall, 2, 2, 1, a.eingaben);
        expect(JSON.stringify({ ...b, fall: undefined })).toBe(JSON.stringify({ ...a, fall: undefined }));
      });
    });
  }
});

describe('Kern: Befugnis und Freigabe (KONZEPT 6.1)', () => {
  it('BZ messen: 1. Drittel nur mit PA, ab 2. Drittel selbst', () => {
    const bz = massnahme(FALL, 'bz-messen')!;
    expect(freigabe(start(FALL, 1, 2), bz)).toBe('mit-pa');
    expect(freigabe(start(FALL, 2, 2), bz)).toBe('frei');
  });
  it('Medikament ohne Anordnung braucht Anordnung, mit Medikamentenplan nicht', () => {
    const z = start(FALL, 3, 2);
    expect(freigabe(z, massnahme(FALL, 'lorazepam-geben')!)).toBe('braucht-anordnung');
    expect(freigabe(z, massnahme(FALL, 'tabletten-wie-geplant-geben')!)).toBe('frei');
  });
  it('nur-ärztlich ergibt immer Grenze', () => {
    const z = start(FALL, 'pflegefachperson', 2);
    const zvk = { ...massnahme(FALL, 'puls-zaehlen')!, id: 'zvk', befugnis: { 1: 'nur-aerztlich', 2: 'nur-aerztlich', 3: 'nur-aerztlich', pflegefachperson: 'nur-aerztlich' } as const };
    expect(freigabe(z, zvk)).toBe('grenze');
  });
  it('gesperrt ergibt Grenze; Stufe 2: PA übernimmt als Pflegefachperson, nicht ausgeführt', () => {
    const fall: FallV2 = { ...FALL, befugnisUeberschreibung: { 'puls-zaehlen': { 1: 'gesperrt' } } };
    const z0 = start(fall, 1, 2);
    expect(freigabe(z0, massnahme(fall, 'puls-zaehlen')!)).toBe('grenze');
    const z = sende(z0, { art: 'massnahme', id: 'puls-zaehlen' });
    expect(z.getan['puls-zaehlen']).toBeUndefined();
    expect(z.log.some((e) => e.art === 'pa-eingriff' && e.typ === 'warnt')).toBe(true);
    const satz = z.meldungen.filter((x) => x.art === 'pa').map((x) => x.text).join(' ');
    expect(satz).toContain('Pflegefachperson');
    expect(satz).toContain('1. Drittel');
    expect(satz).not.toContain('ärztliche Aufgabe');
  });
  it('gesperrt in Stufe 3: Grenzüberschreitung mit befugnis gesperrt im Log', () => {
    const fall: FallV2 = { ...FALL, befugnisUeberschreibung: { 'puls-zaehlen': { 1: 'gesperrt' } } };
    const z = sende(start(fall, 1, 3), { art: 'massnahme', id: 'puls-zaehlen' });
    expect(z.log.some((e) => e.art === 'grenzueberschreitung' && e.befugnis === 'gesperrt' && e.massnahmeId === 'puls-zaehlen')).toBe(true);
  });
  it('Stufe 2: PA warnt bei fehlender Anordnung und führt nicht aus', () => {
    const z = sende(start(FALL, 3, 2), { art: 'massnahme', id: 'lorazepam-geben' });
    expect(z.getan['lorazepam-geben']).toBeUndefined();
    expect(z.log.some((e) => e.art === 'pa-eingriff' && e.typ === 'warnt')).toBe(true);
  });
  it('Stufe 3: Anleitung angefordert → keine Grenzüberschreitung', () => {
    let z = start(FALL, 1, 3);
    z = sende(z, { art: 'anleitung-anfordern', massnahme: 'tabletten-wie-geplant-geben' });
    z = sende(z, { art: 'massnahme', id: 'tabletten-wie-geplant-geben' });
    expect(arten(z)).not.toContain('grenzueberschreitung');
  });
});

describe('Kern: Pflegetasche, SBAR, Anordnungen, Remonstration', () => {
  it('ambulant: Blutdruck erst nach Gerät aus der Pflegetasche', () => {
    let z = sende(start(FALL, 2, 2), { art: 'massnahme', id: 'rr-messen' });
    expect(z.getan['rr-messen']).toBeUndefined();
    z = sende(z, { art: 'pflegetasche', geraet: 'rr-geraet' });
    z = sende(z, { art: 'massnahme', id: 'rr-messen' });
    expect(z.getan['rr-messen']).toHaveLength(1);
    expect(z.sichtbar).toContain('rrSys');
  });
  it('Ärztin reagiert nur auf Gemeldetes', () => {
    const knapp = sende(start(FALL, 2, 2), { art: 'anruf', an: 'aerztin', sbar: ['s-nur-sturz'] });
    expect(knapp.angeboten).toEqual([]);
    expect(knapp.flags).toContain('arzt-beruhigt');
    const voll = sende(start(FALL, 2, 2), { art: 'anruf', an: 'aerztin', sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-verwirrt-neu'] });
    expect(voll.angeboten).toEqual(['an-torasemid-pause', 'an-trinken']);
  });
  it('Anordnung schaltet erst nach Rückmeldung frei', () => {
    let z = sende(start(FALL, 2, 2), { art: 'anruf', an: 'aerztin', sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-verwirrt-neu'] });
    const m = massnahme(FALL, 'torasemid-zurueckhalten')!;
    expect(freigabe(z, m)).toBe('braucht-anordnung');
    z = sende(z, { art: 'rueckmelden', anordnung: 'an-torasemid-pause', rueckgelesen: true });
    expect(freigabe(z, m)).toBe('frei');
    expect(z.log.some((e) => e.art === 'anordnung-erhalten' && e.rueckgelesen)).toBe(true);
  });
  it('fehlerhafte Anordnung: Remonstration zieht sie zurück, blindes Ausführen ist ein Fehler', () => {
    const vorUnruhe = (z: SimZustand) => {
      z = sende(z, { art: 'warten', sek: 600 });
      expect(z.offeneEntscheidung).toBe('e-unruhe');
      return sende(z, { art: 'entscheidung', ereignis: 'e-unruhe', wahl: 'w-arzt-medis' });
    };
    let a = vorUnruhe(start(FALL, 3, 2));
    expect(a.angeboten).toContain('an-lorazepam');
    a = sende(a, { art: 'remonstrieren', anordnung: 'an-lorazepam' });
    expect(a.angeboten).not.toContain('an-lorazepam');
    expect(freigabe(a, massnahme(FALL, 'lorazepam-geben')!)).toBe('braucht-anordnung');

    let b = vorUnruhe(start(FALL, 3, 2));
    b = sende(b, { art: 'rueckmelden', anordnung: 'an-lorazepam', rueckgelesen: true });
    b = sende(b, { art: 'massnahme', id: 'lorazepam-geben' });
    expect(b.fehlerAus).toContain('f-lorazepam');
  });
  it('PA fragen: erst Impuls, dann Tipp; in Stufe 3 keine Hilfe', () => {
    let z = sende(start(FALL, 1, 2), { art: 'pa-fragen' });
    z = sende(z, { art: 'pa-fragen' });
    expect(z.log.filter((e) => e.art === 'pa-hilfe').map((e) => (e as { stufe: string }).stufe)).toEqual(['impuls', 'tipp']);
    const p = sende(start(FALL, 1, 3), { art: 'pa-fragen' });
    expect(arten(p)).not.toContain('pa-hilfe');
  });
  it('Sturz: sofort hochziehen löst den schweren Fehler aus', () => {
    const z = sende(start(FALL, 2, 2), { art: 'massnahme', id: 'sofort-hochziehen' });
    expect(z.fehlerAus).toContain('f-hochziehen');
  });
});

describe('Kern: Zeit', () => {
  it('Vorspulen stoppt beim nächsten Ereignis', () => {
    const z = vorspulen(start(FALL, 2, 2), 600);
    expect(z.ereignisseAus).toEqual(['e-tochter']);
    expect(z.t).toBe(300);
  });
  it('Wirkkurve: 0 vor Beginn, 1 an der Spitze, bleibt dauerhaft', () => {
    const k = { groesse: 'hydratation' as const, delta: 0.1, beginnSek: 100, spitzeSek: 200, dauerSek: 'dauerhaft' as const };
    expect(anteil(k, 50)).toBe(0);
    expect(anteil(k, 150)).toBeCloseTo(0.5);
    expect(anteil(k, 5000)).toBe(1);
  });
  it('alter Zustand bleibt unverändert (rein)', () => {
    const a = start(FALL, 2, 2);
    const vorher = JSON.stringify({ ...a, fall: undefined });
    sende(a, { art: 'massnahme', id: 'ansprechen-orientierung' });
    expect(JSON.stringify({ ...a, fall: undefined })).toBe(vorher);
  });
});
