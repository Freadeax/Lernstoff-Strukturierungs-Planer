import { describe, expect, it, beforeEach, vi } from 'vitest';
import { erteilungFuer, ERTEILT, inhaltsFingerabdruck, mitErteilung, type Erteilung } from '../../ui/sim/freigabe-erteilt';
import { istGeprueft, kennzeichnung } from '../../ui/sim/freigabe';
import { FAELLE_V2 } from '../praxis/kern/faelle';
import { praxisFingerabdruck, praxisFreigabe } from '../praxis/kern/freigabe';
import { alleInhalte, freigabeStatus } from './inhalte';
import { alsErteilung, freigabeCode, ladeBoegen, leseCode, speichereBogen, uebernimmBoegen, type Pruefbogen } from './ablauf';

const BASIS = praxisFreigabe(FAELLE_V2[0]!);
const bogen = (p: Partial<Pruefbogen> = {}): Pruefbogen => ({
  id: 'praxis:x', fp: 'abc', art: 'fachperson', rolle: 'Praxisanleitung', datum: '2026-11-20', urteil: 'freigegeben', punkte: { a: 'passt' }, notizen: {}, ...p,
});

describe('Inhalte mit Freigabe', () => {
  const inhalte = alleInhalte();
  it('haben eindeutige IDs, Fingerabdruck und Prüfpunkte', () => {
    const ids = inhalte.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of inhalte) {
      expect(i.fp, i.id).toMatch(/^[0-9a-f]{8}$/);
      expect(i.freigabe.lernziele.length, i.id).toBeGreaterThan(0);
    }
    expect(inhalte.some((i) => i.bereich === 'Praxissimulator')).toBe(true);
    expect(inhalte.some((i) => i.bereich === 'Wissenstrainer')).toBe(true);
  });
  it('jede übernommene Prüfung gehört zu einem bestehenden Inhalt', () => {
    const ids = new Set(inhalte.map((i) => i.id));
    for (const e of ERTEILT) expect(ids.has(e.id), e.id).toBe(true);
  });
  it('Praxisfälle mit Kindern oder Spur B tragen das passende Risiko', () => {
    for (const f of FAELLE_V2) {
      const fr = praxisFreigabe(f);
      if (f.spur === 'B') expect(fr.risiken, f.id).toContain('notfall');
      if (['saeugling', 'kleinkind', 'schulkind', 'jugendlich'].includes(f.altersgruppe)) expect(fr.risiken, f.id).toContain('kinder');
    }
  });
});

describe('Fingerabdruck und Übernahme', () => {
  it('der Fingerabdruck ändert sich mit dem Inhalt, nicht mit dem Freigabe-Stand', () => {
    const f = FAELLE_V2[0]!;
    const fp = praxisFingerabdruck(f);
    expect(praxisFingerabdruck({ ...f, freigabe: { ...f.freigabe, status: 'geprueft', pruefer: 'X', datum: '2026-11-20' } })).toBe(fp);
    expect(praxisFingerabdruck({ ...f, lernziele: [...f.lernziele, 'neu'] })).not.toBe(fp);
    expect(inhaltsFingerabdruck({ m: /a+/ })).not.toBe(inhaltsFingerabdruck({ m: /b+/ }));
  });
  it('nur eine Fachperson mit „freigegeben“ macht den Inhalt fachlich geprüft', () => {
    const liste: Erteilung[] = [{ id: 'x', fp: 'f1', art: 'fachperson', urteil: 'freigegeben', datum: '2026-11-20', rolle: 'Praxisanleitung' }];
    expect(istGeprueft(mitErteilung('x', 'f1', BASIS, liste))).toBe(true);
    expect(istGeprueft(mitErteilung('x', 'f2', BASIS, liste))).toBe(false);
    const geaendert = mitErteilung('x', 'f2', BASIS, liste);
    expect(geaendert.aenderungen.at(-1)!.text).toMatch(/seit dieser Prüfung geändert/);
    const lehr = mitErteilung('x', 'f1', BASIS, [{ ...liste[0]!, art: 'lehrmaterial', rolle: 'Auszubildende/r' }]);
    expect(istGeprueft(lehr)).toBe(false);
    expect(lehr.status).toBe('in-pruefung');
    expect(kennzeichnung(lehr)).toMatch(/Abgeglichen mit Unterrichtsmaterial/);
    expect(mitErteilung('x', 'f1', BASIS, [{ ...liste[0]!, urteil: 'mit-aenderungen' }]).status).toBe('in-pruefung');
  });
  it('die neueste Prüfung zählt', () => {
    const liste: Erteilung[] = [
      { id: 'x', fp: 'alt', art: 'fachperson', urteil: 'freigegeben', datum: '2026-11-01', rolle: 'A' },
      { id: 'x', fp: 'neu', art: 'fachperson', urteil: 'freigegeben', datum: '2026-11-20', rolle: 'B' },
    ];
    expect(erteilungFuer('x', 'neu', liste)).toMatchObject({ aktuell: true, erteilung: { rolle: 'B' } });
  });
  it('Status auf der Seite folgt der Liste', () => {
    const i = alleInhalte()[0]!;
    expect(freigabeStatus(i, [])).toBe('offen');
    expect(freigabeStatus(i, [{ id: i.id, fp: i.fp, art: 'fachperson', urteil: 'freigegeben', datum: '2026-11-20', rolle: 'P' }])).toBe('geprueft');
    expect(freigabeStatus(i, [{ id: i.id, fp: 'anders00', art: 'fachperson', urteil: 'freigegeben', datum: '2026-11-20', rolle: 'P' }])).toBe('geaendert');
    expect(freigabeStatus(i, [{ id: i.id, fp: i.fp, art: 'lehrmaterial', urteil: 'freigegeben', datum: '2026-11-20', rolle: 'P' }])).toBe('abgeglichen');
  });
});

describe('Prüfbogen und Freigabe-Code', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) });
  });
  it('Code hin und zurück, auch mit Umlauten', () => {
    const b = bogen({ bemerkung: 'Größe prüfen, Ödeme', punkte: { 'Dosis plausibel?': 'aendern' }, notizen: { 'Dosis plausibel?': '2,5 mg statt 5 mg' }, urteil: 'mit-aenderungen' });
    const code = freigabeCode([b]);
    expect(code.startsWith('FREIGABE1:')).toBe(true);
    expect(leseCode(`Hier der Code: ${code}`)).toEqual([b]);
    expect(leseCode('FREIGABE1:kaputt')).toBeNull();
    expect(leseCode('irgendwas')).toBeNull();
  });
  it('ungültige Bögen fallen beim Lesen weg', () => {
    const code = freigabeCode([bogen(), { ...bogen(), datum: 'gestern' } as Pruefbogen]);
    expect(leseCode(code)).toHaveLength(1);
  });
  it('Ergebnis wird zur Erteilung, Änderungswünsche landen in der Bemerkung', () => {
    const e = alsErteilung(bogen({ punkte: { a: 'passt', b: 'aendern' }, notizen: { b: 'Wert anpassen' }, urteil: 'mit-aenderungen' }));
    expect(e).toMatchObject({ id: 'praxis:x', urteil: 'mit-aenderungen', bemerkung: 'Ändern: b (Wert anpassen)' });
  });
  it('speichern und übernehmen: je Inhalt bleibt der neueste Bogen', () => {
    speichereBogen(bogen({ datum: '2026-11-20' }));
    uebernimmBoegen([bogen({ datum: '2026-11-19', rolle: 'alt' }), bogen({ id: 'praxis:y' })]);
    const liste = ladeBoegen();
    expect(liste).toHaveLength(2);
    expect(liste.find((b) => b.id === 'praxis:x')!.rolle).toBe('Praxisanleitung');
  });
});
