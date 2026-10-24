import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { fallThemen, SZENARIEN, szenarioAusThema } from './faelle';
import {
  ABSCHLUSS_SCHEMA, fallTreffer, nachrichten, neuerFall, news2, parseAbschluss, parseZug, SCHRITT_THEMA, SCHRITTE, START_TEXT, systemPrompt, ZUG_SCHEMA,
  type Vitalwerte, type Zug,
} from './simulator';

const leer: Vitalwerte = { rr: '', puls: '', af: '', spo2: '', sauerstoff: '', temp: '', bz: '', schmerz: '', bewusstsein: '' };
const zug = (p: Partial<Zug> = {}): Zug => ({
  uhrzeit: '08:00', situation: 'Frau M. liegt im Bett.', vitalwerte: leer, zustand: 'stabil', schritt: 'informationssammlung',
  rueckmeldung: { wertung: 'keine', text: '' }, optionen: ['Ich messe den Blutdruck.'], beendet: false, ...p,
});

describe('Szenarien', () => {
  it('verweisen nur auf Themen, die es im Katalog gibt', () => {
    const ids = new Set(pflegeModule.topics.map((t) => t.id));
    for (const s of SZENARIEN) for (const id of s.topicIds) expect(ids.has(id), `${s.id}: ${id}`).toBe(true);
  });
  it('haben eindeutige IDs', () => {
    expect(new Set(SZENARIEN.map((s) => s.id)).size).toBe(SZENARIEN.length);
  });
  it('bieten freie Fälle aus fachlichen Themen an', () => {
    const themen = fallThemen(pflegeModule);
    expect(themen.length).toBeGreaterThan(20);
    expect(themen.some((t) => t.id === 'thema.pro.dekubitus')).toBe(true);
    expect(themen.some((t) => t.id.startsWith('thema.re.'))).toBe(false);
    expect(szenarioAusThema(themen[0]!, 'ambulant').topicIds).toEqual([themen[0]!.id]);
  });
});

describe('Prompt und Verlauf', () => {
  it('nimmt den verborgenen Verlauf und die Katalogthemen in den Systemprompt', () => {
    const s = SZENARIEN[0]!;
    const p = systemPrompt(s, 2, pflegeModule);
    expect(p).toContain(s.verborgen);
    expect(p).toContain('Herzinsuffizienz');
    expect(p).toContain('2. Ausbildungsjahr');
  });
  it('baut abwechselnd Nutzer- und Claude-Nachrichten', () => {
    const f = neuerFall(SZENARIEN[0]!, 1);
    f.runden.push({ zug: zug() }, { eingabe: 'Ich messe den Blutdruck.', zug: zug({ uhrzeit: '08:05' }) });
    const m = nachrichten(f, 'Ich lagere den Oberkörper hoch.');
    expect(m.map((x) => x.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user']);
    expect(m[0]!.content).toBe(START_TEXT);
    expect(JSON.parse(m[3]!.content as string).uhrzeit).toBe('08:05');
  });
});

describe('Schemata', () => {
  it('sind strikt (alle Felder Pflicht, keine Zusatzfelder)', () => {
    const pruefe = (s: Record<string, unknown>) => {
      if (s.type === 'object') {
        expect(s.additionalProperties).toBe(false);
        expect(s.required).toEqual(Object.keys(s.properties as object));
        Object.values(s.properties as object).forEach(pruefe);
      }
      if (s.type === 'array') pruefe(s.items as Record<string, unknown>);
    };
    pruefe(ZUG_SCHEMA); pruefe(ABSCHLUSS_SCHEMA);
  });
});

describe('parseZug', () => {
  it('normalisiert unbekannte Werte statt abzustürzen', () => {
    const z = parseZug(JSON.stringify({ situation: ' Herr K. ringt nach Luft. ', zustand: 'schlimm', schritt: 'x', optionen: ['a', 3, ' ', 'b'], vitalwerte: { spo2: ' 88 ' } }));
    expect(z.situation).toBe('Herr K. ringt nach Luft.');
    expect(z.zustand).toBe('stabil');
    expect(z.schritt).toBe('informationssammlung');
    expect(z.optionen).toEqual(['a', 'b']);
    expect(z.vitalwerte.spo2).toBe('88');
    expect(z.vitalwerte.rr).toBe('');
    expect(z.rueckmeldung.wertung).toBe('keine');
  });
  it('wirft bei fehlender Situation oder kaputtem JSON', () => {
    expect(() => parseZug('{"situation": ""}')).toThrow();
    expect(() => parseZug('kein json')).toThrow();
  });
});

describe('parseAbschluss', () => {
  it('ordnet Schritte, entfernt Doppelte und unbekannte Themen', () => {
    const a = parseAbschluss(JSON.stringify({
      note: 'sicher', gesamt: 'Gut.', staerken: ['x'], verbesserungen: [], musterloesung: '',
      themen: ['thema.pro.sturz', 'thema.gibtsnicht', 'thema.pro.sturz'],
      schritte: [
        { schritt: 'evaluation', bewertung: 'ok', kommentar: 'e' },
        { schritt: 'informationssammlung', bewertung: 'stark', kommentar: 'i' },
        { schritt: 'informationssammlung', bewertung: 'luecke', kommentar: 'doppelt' },
      ],
    }), pflegeModule);
    expect(a.schritte.map((s) => s.schritt)).toEqual(['informationssammlung', 'evaluation']);
    expect(a.schritte[0]!.bewertung).toBe('stark');
    expect(a.themen).toEqual(['thema.pro.sturz']);
    expect(SCHRITTE).toHaveLength(6);
  });
});

describe('Lernplan', () => {
  it('gibt die Note an die Szenario-Themen und jeden bearbeiteten Schritt an sein Pflegeprozess-Thema', () => {
    const ids = new Set(pflegeModule.topics.map((t) => t.id));
    for (const id of Object.values(SCHRITT_THEMA)) expect(ids.has(id), id).toBe(true);
    const f = { ...neuerFall(SZENARIEN[0]!, 1), abschluss: parseAbschluss(JSON.stringify({
      note: 'teilweise', gesamt: 'ok', staerken: [], verbesserungen: [], musterloesung: '', themen: [],
      schritte: [
        { schritt: 'informationssammlung', bewertung: 'stark', kommentar: '' },
        { schritt: 'ziele', bewertung: 'nicht_bearbeitet', kommentar: '' },
      ],
    }), pflegeModule) };
    expect(fallTreffer(f)).toEqual([
      { topicIds: SZENARIEN[0]!.topicIds, punkte: 60, max: 100 },
      { topicIds: ['thema.pp.anamnese'], punkte: 95, max: 100 },
    ]);
    expect(fallTreffer({ ...f, abschluss: undefined })).toEqual([]);
  });
});

describe('NEWS2', () => {
  const v = (p: Partial<Vitalwerte>): Vitalwerte => ({ ...leer, rr: '130/80', puls: '80', af: '16', spo2: '97', sauerstoff: 'nein', temp: '36,8', bewusstsein: 'A', ...p });

  it('meldet fehlende Parameter', () => {
    expect(news2({ ...leer, puls: '80' })!.fehlt).toContain('Atemfrequenz');
    expect(news2(v({ bewusstsein: '' }))!.fehlt).toEqual(['Bewusstsein']);
  });
  it('ist 0 bei Normalwerten', () => {
    expect(news2(v({}))).toEqual({ punkte: 0, risiko: 'niedrig', fehlt: [] });
  });
  it('bewertet einen Einzelwert von 3 als niedrig-mittel', () => {
    expect(news2(v({ spo2: '90' }))).toMatchObject({ punkte: 3, risiko: 'niedrig-mittel' });
  });
  it('erkennt hohes Risiko bei dekompensierter Herzinsuffizienz', () => {
    // AF 26 (3), SpO2 89 (3), O2 ja (2), RR 105 (1), Puls 115 (2), A (0), 37,2 (0) = 11
    expect(news2(v({ af: '26', spo2: '89 %', sauerstoff: 'ja', rr: '105/70', puls: '115', temp: '37,2' }))).toMatchObject({ punkte: 11, risiko: 'hoch' });
  });
  it('trifft die Grenzwerte', () => {
    expect(news2(v({ temp: '38,1' }))!.punkte).toBe(1);
    expect(news2(v({ temp: '39,1' }))!.punkte).toBe(2);
    expect(news2(v({ puls: '50' }))!.punkte).toBe(1);
    expect(news2(v({ af: '21' }))!.punkte).toBe(2);
    expect(news2(v({ bewusstsein: 'V' }))!.punkte).toBe(3);
    expect(news2(v({ rr: '220/100' }))!.punkte).toBe(3);
  });
});
