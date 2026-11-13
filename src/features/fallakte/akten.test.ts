import { describe, expect, it } from 'vitest';
import { AKTEN } from './akten';
import { aktenStand, ASSESSMENT_KEY, BESTE_KEYS, schrittProzent, type Leser } from './stand';
import { ART_PFAD, schrittPfad, type SchrittArt } from './typen';
import { SIS_FAELLE } from '../sis/faelle';
import { VIGNETTEN } from '../assessment/vignetten';
import { FAELLE as PLAENE } from '../pflegeplanung/faelle';
import { BERICHT_FAELLE } from '../bericht/faelle';
import { FAELLE as UEBERGABEN } from '../uebergabe/faelle';
import { EREIGNISSE } from '../uebergabe/ereignisse';
import { pruefeSis, musterMatrix } from '../sis/pruefung';
import { pruefeBericht } from '../bericht/pruefung';
import { pruefe as pruefeUebergabe } from '../uebergabe/pruefung';
import { vereinfache } from '../uebergabe/pruefung';
import { NAV } from '../../ui/shell/nav';

/** Text eines Teilfalls, in dem der Name der Person vorkommen muss. */
function fallText(art: SchrittArt, id: string): string | undefined {
  switch (art) {
    case 'sis': { const f = SIS_FAELLE.find((x) => x.id === id); return f && f.person.map((p) => p.wert).join(' '); }
    case 'assessment': return VIGNETTEN.find((x) => x.id === id)?.titel;
    case 'pflegeplanung': return PLAENE.find((x) => x.id === id)?.person;
    case 'bericht': return BERICHT_FAELLE.find((x) => x.id === id)?.person;
    case 'uebergabe': { const f = UEBERGABEN.find((x) => x.id === id); return f && `${f.daten.map((d) => d.wert).join(' ')} ${f.muster}`; }
  }
}

describe('Fallakten', () => {
  it('haben eindeutige IDs, Schritte und Rückblickfragen', () => {
    expect(new Set(AKTEN.map((a) => a.id)).size).toBe(AKTEN.length);
    for (const a of AKTEN) {
      expect(a.schritte.length, a.id).toBeGreaterThanOrEqual(4);
      expect(new Set(a.schritte.map((s) => s.id)).size, a.id).toBe(a.schritte.length);
      expect(a.rueckblick.length, a.id).toBeGreaterThanOrEqual(2);
      // Jede Dokumentationsart kommt vor: der Fall soll wirklich von der Aufnahme bis zur Übergabe reichen
      expect(new Set(a.schritte.map((s) => s.art)), a.id).toEqual(new Set(Object.keys(ART_PFAD)));
    }
  });

  for (const a of AKTEN) {
    const nachname = a.person.split(',')[0]!.split(' ').pop()!;
    it(`${a.id}: jeder Schritt verweist auf einen vorhandenen Fall derselben Person`, () => {
      for (const s of a.schritte) {
        const text = fallText(s.art, s.fallId);
        expect(text, `${s.art}/${s.fallId} fehlt in der Trainer-Liste`).toBeDefined();
        expect(text, `${s.art}/${s.fallId}`).toContain(nachname);
      }
    });

    it(`${a.id}: Musterlösungen der Teilfälle bestehen die Prüfung per Code`, () => {
      for (const s of a.schritte) {
        if (s.art === 'sis') { const f = SIS_FAELLE.find((x) => x.id === s.fallId)!; expect(pruefeSis(f, f.muster, musterMatrix(f)).prozent).toBe(100); }
        if (s.art === 'bericht') { const f = BERICHT_FAELLE.find((x) => x.id === s.fallId)!; expect(pruefeBericht(f, f.muster).prozent).toBe(100); }
        if (s.art === 'uebergabe') {
          const f = UEBERGABEN.find((x) => x.id === s.fallId)!;
          expect(pruefeUebergabe(f, f.muster).prozent).toBe(100);
          expect(EREIGNISSE[f.id]?.length, 'Ereignisse für die SBAR-Grundkriterien').toBeGreaterThan(0);
        }
      }
    });

    it(`${a.id}: Adressen führen in den Trainer und zurück zur Akte`, () => {
      for (const s of a.schritte) expect(schrittPfad(a.id, s)).toBe(`${ART_PFAD[s.art]}?fall=${s.fallId}&akte=${a.id}`);
    });
  }

  it('Lindner: Werte passen über die Teilfälle zusammen', () => {
    const a = AKTEN.find((x) => x.id === 'lindner')!;
    const texte = a.schritte.map((s) => vereinfache(fallText(s.art, s.fallId) ?? ''));
    const sis = SIS_FAELLE.find((x) => x.id === 'lindner')!;
    const plan = PLAENE.find((x) => x.id === 'lindner-herz')!;
    const bericht = BERICHT_FAELLE.find((x) => x.id === 'lindner-nacht')!;
    const sbar = UEBERGABEN.find((x) => x.id === 'lindner-hausaerztin')!;
    const braden = VIGNETTEN.find((x) => x.id === 'br-lindner')!;
    const barthel = VIGNETTEN.find((x) => x.id === 'ba-lindner')!;
    const sum = (l: Record<string, number>) => Object.values(l).reduce((s, x) => s + x, 0);
    // Assessments in der Pflegeplanung = Ergebnis der Vignetten
    const assessments = plan.daten.find((d) => d.label === 'Assessments')!.wert;
    expect(assessments).toContain(`Braden ${sum(braden.loesung)}`);
    expect(assessments).toContain(`Barthel ${sum(barthel.loesung)}`);
    // Meldegrenze aus der SIS ist der Anlass der Übergabe: 73,6 − 71,5 = 2,1 kg > 2 kg
    expect(sis.unterlagen.find((u) => u.label === 'Ärztliche Vorgabe')!.wert).toMatch(/2 kg in drei Tagen/);
    expect(sbar.daten.find((d) => d.label === 'Gewicht')!.wert).toMatch(/73,6 kg.*71,5 kg/);
    // Nachtwerte aus dem Bericht stehen genauso in der Übergabe
    for (const w of ['2:50', '89 %']) {
      expect(bericht.szene.join(' ')).toContain(w);
      expect(sbar.daten.map((d) => d.wert).join(' ')).toContain(w);
    }
    expect(texte.every((t) => t.includes('lindner'))).toBe(true);
  });
});

describe('Stand', () => {
  const a = AKTEN[0]!;
  const leser = (werte: Record<string, Record<string, unknown>>): Leser => (key) => werte[key] ?? {};

  it('ohne Ergebnisse: nichts bearbeitet, nächster Schritt ist der erste', () => {
    const st = aktenStand(a, leser({}));
    expect(st.bearbeitet).toBe(0);
    expect(st.naechster).toBe(a.schritte[0]);
    expect(st.gesamt).toBe(0);
  });

  it('liest Bestwerte der Trainer und Assessment-Ergebnisse, ignoriert Unsinn', () => {
    const sis = a.schritte.find((s) => s.art === 'sis')!;
    const as = a.schritte.find((s) => s.art === 'assessment')!;
    const plan = a.schritte.find((s) => s.art === 'pflegeplanung')!;
    const lies = leser({
      [BESTE_KEYS.sis]: { [sis.fallId]: 92 },
      [ASSESSMENT_KEY]: { [as.fallId]: { datum: '2026-11-13', prozent: 70 } },
      [BESTE_KEYS.pflegeplanung]: { [plan.fallId]: 'kaputt' },
    });
    expect(schrittProzent(sis, lies)).toBe(92);
    expect(schrittProzent(as, lies)).toBe(70);
    expect(schrittProzent(plan, lies)).toBeUndefined();
    const st = aktenStand(a, lies);
    expect(st.bearbeitet).toBe(2);
    expect(st.gut).toBe(1);
    // erster offener Schritt vor schwachen
    expect(st.naechster).toBe(a.schritte.find((_, i) => st.prozente[i] === undefined));
  });

  it('alles bearbeitet: nächster ist der erste schwache, sonst keiner', () => {
    const alle = (p: number) => {
      const w: Record<string, Record<string, unknown>> = {};
      for (const s of a.schritte) {
        if (s.art === 'assessment') (w[ASSESSMENT_KEY] ??= {})[s.fallId] = { prozent: p };
        else (w[BESTE_KEYS[s.art]] ??= {})[s.fallId] = p;
      }
      return leser(w);
    };
    expect(aktenStand(a, alle(100)).naechster).toBeUndefined();
    expect(aktenStand(a, alle(100)).gesamt).toBe(100);
    expect(aktenStand(a, alle(50)).naechster).toBe(a.schritte[0]);
  });
});

describe('Einbindung', () => {
  it('Fallakte steht im Menü', () => {
    const praxis = JSON.stringify(NAV);
    expect(praxis).toContain('/lernen/fallakte');
  });
});
