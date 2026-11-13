import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { alsUnsicher, bewerte, type Aufgabe } from './quiz';
import { ladeZwischenstand, speichereZwischenstand, ZWISCHENSTAND_GUELTIG_MS, ZWISCHENSTAND_KEY, type Zwischenstand } from './zwischenstand';
import { sicherheitAus, skriptZiel } from './Runde';
import { gehoertInSicherung } from '../../core/sicherung';

const auswahl: Aufgabe = { id: 'a1', art: 'auswahl', topicIds: ['thema.x'], titel: 'Händedesinfektion', frage: 'Wie lange wird eingerieben?', optionen: ['10 s', '30 s', '2 min'], richtig: [1], mehrfach: false, erklaerung: ['Mindestens 30 Sekunden.'] };
const fall: Aufgabe = {
  id: 'f1', art: 'fall', topicIds: ['thema.x'], titel: 'Fall: Sturz', frage: 'Was tun?', erklaerung: ['Erst sichern.'], einstieg: 'Frau K. liegt am Boden.',
  schritte: [
    { lage: 'Sie ist wach.', frage: 'Zuerst?', optionen: ['Aufheben', 'Ansprechen und untersuchen'], richtig: [1], mehrfach: false, warum: 'Erst Verletzungen ausschließen.' },
    { lage: 'Hüfte schmerzt.', frage: 'Dann?', optionen: ['Arzt informieren', 'Mobilisieren'], richtig: [0], mehrfach: false, warum: 'Verdacht auf Fraktur.' },
  ],
};

describe('Selbsteinschätzung', () => {
  it('erkennt Glückstreffer und sichere Irrtümer', () => {
    expect(sicherheitAus('unsicher', true)).toBe('geraten');
    expect(sicherheitAus('sicher', false)).toBe('sicherer-irrtum');
    expect(sicherheitAus('sicher', true)).toBeUndefined();
    expect(sicherheitAus(null, false)).toBeUndefined();
  });

  it('geratene richtige Antworten werden zu Fehlerheft-Einträgen mit Kennzeichen', () => {
    const e = alsUnsicher(auswahl, { art: 'auswahl', wahl: [1] }, 'hygiene');
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ id: 'hygiene:a1', sicherheit: 'geraten', loesung: '30 s' });
    expect(alsUnsicher(auswahl, { art: 'auswahl', wahl: [0] }, 'hygiene')).toEqual([]);
    const f = alsUnsicher(fall, { art: 'fall', wahl: [[1], [0]] }, 'notfall');
    expect(bewerte(fall, { art: 'fall', wahl: [[1], [0]] }).richtig).toBe(true);
    expect(f.map((x) => x.id)).toEqual(['notfall:f1:1', 'notfall:f1:2']);
  });

  it('Skript-Suche nutzt die Lösung, nicht die Ablenker', () => {
    const z = skriptZiel(auswahl);
    expect(z.texte).toContain('30 s');
    expect(z.texte).not.toContain('2 min');
  });
});

describe('Zwischenstand einer Runde', () => {
  let data: Map<string, string>;
  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  const stand = (n: number, gespeichert = Date.now()): Zwischenstand => ({
    rundeId: 'r1', bereich: 'mix', stufe: 0, aufgaben: [auswahl, fall], serie: 1, besteSerie: 1, gespeichert,
    ergebnisse: Array.from({ length: n }, () => ({ id: 'a1', b: { punkte: 1, max: 1, richtig: true, teile: [true] } })),
  });

  it('speichert je Trainer und lädt nur begonnene, unfertige und frische Runden', () => {
    speichereZwischenstand('hygiene', stand(1));
    expect(ladeZwischenstand('hygiene')?.rundeId).toBe('r1');
    expect(ladeZwischenstand('anatomie')).toBeNull();
    speichereZwischenstand('hygiene', stand(2));
    expect(ladeZwischenstand('hygiene')).toBeNull();
    speichereZwischenstand('hygiene', stand(1, Date.now() - ZWISCHENSTAND_GUELTIG_MS - 1));
    expect(ladeZwischenstand('hygiene')).toBeNull();
    speichereZwischenstand('hygiene', null);
    expect(JSON.parse(data.get(ZWISCHENSTAND_KEY)!)).toEqual({});
  });

  it('bleibt auf dem Gerät und wandert nicht in die Datensicherung', () => {
    expect(gehoertInSicherung(ZWISCHENSTAND_KEY)).toBe(false);
  });
});
