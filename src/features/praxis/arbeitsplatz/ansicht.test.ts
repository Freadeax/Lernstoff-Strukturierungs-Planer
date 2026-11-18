import { describe, expect, it } from 'vitest';
import { PILOT_AMBULANT } from '../kern/faelle/amb-sturz-exsikkose';
import type { FallV2 } from '../kern/typen';
import {
  anordnungen, bettAnzeige, beginne, handlungen, lageText, pflegetasche, rekonstruiere, sbarBausteine, spule, suche,
  team, uebersicht, uhrzeit, wende, werteleiste, type Arbeitsstand,
} from './ansicht';

const fall = PILOT_AMBULANT;
const tu = (s: Arbeitsstand, ...e: Parameters<typeof wende>[1][]) => e.reduce(wende, s);
const wert = (s: Arbeitsstand, id: string) => werteleiste(s).find((w) => w.id === id)!;

describe('Arbeitsplatz-Ansicht', () => {
  it('zeigt im Hausbesuch zu Beginn keine Werte und bietet die Pflegetasche an', () => {
    const s = beginne(fall, 2, 2);
    expect(werteleiste(s).every((w) => w.stand === 'offen' && w.text === '—')).toBe(true);
    expect(pflegetasche(s.z).map((g) => g.id).sort()).toEqual(['bz-geraet', 'pulsoxy', 'rr-geraet', 'thermometer']);
    const rr = handlungen(s.z).find((h) => h.id === 'rr-messen')!;
    expect(rr.fehlendesGeraet).toBe('rr-geraet');
  });

  it('Pulsoxymeter läuft nach dem Anlegen live weiter, Blutdruck bleibt eine Momentaufnahme', () => {
    let s = tu(beginne(fall, 2, 2), { art: 'pflegetasche', geraet: 'pulsoxy' }, { art: 'massnahme', id: 'pulsoxy-anlegen' });
    expect(wert(s, 'spo2').stand).toBe('live');
    expect(bettAnzeige(s)).toMatch(/^SpO₂ \d+ · P \d+$/);
    s = tu(s, { art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' });
    const rr = wert(s, 'rr');
    expect(rr.stand).toBe('gemessen');
    expect(rr.zeit).toMatch(/^08:1\d$/);
    const vorher = rr.text;
    s = tu(s, { art: 'warten', sek: 600 });
    expect(wert(s, 'rr').text).toBe(vorher);
  });

  it('Befugnis-Abzeichen folgen der Rolle (BZ im 1. Drittel nur mit PA)', () => {
    const d1 = tu(beginne(fall, 1, 2), { art: 'pflegetasche', geraet: 'bz-geraet' });
    const d2 = tu(beginne(fall, 2, 2), { art: 'pflegetasche', geraet: 'bz-geraet' });
    expect(handlungen(d1.z).find((h) => h.id === 'bz-messen')!.freigabe).toBe('mit-pa');
    expect(handlungen(d2.z).find((h) => h.id === 'bz-messen')!.freigabe).toBe('frei');
    expect(handlungen(d2.z).find((h) => h.id === 'lorazepam-geben')!.freigabe).toBe('braucht-anordnung');
  });

  it('SBAR bietet Werte erst an, wenn sie erhoben sind; vollständige Meldung bringt Anordnungen zum Rücklesen', () => {
    let s = beginne(fall, 2, 2);
    expect(sbarBausteine(s.z).A.map((b) => b.id)).not.toContain('a-rr-niedrig');
    s = tu(s, { art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' });
    expect(sbarBausteine(s.z).A.map((b) => b.id)).toContain('a-rr-niedrig');
    s = tu(s, { art: 'massnahme', id: 'sitzend-sichern' }, { art: 'anruf', an: 'aerztin', sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-verwirrt-neu', 'r-hausbesuch'] });
    expect(anordnungen(s.z).filter((a) => a.stand === 'angeboten').map((a) => a.id)).toEqual(['an-torasemid-pause', 'an-trinken']);
    expect(team(s.z).find((t) => t.wer === 'aerztin')!.text).toMatch(/Torasemid heute weglassen/);
    s = tu(s, { art: 'rueckmelden', anordnung: 'an-torasemid-pause', rueckgelesen: true });
    expect(anordnungen(s.z).find((a) => a.id === 'an-torasemid-pause')!.stand).toBe('rueckgelesen');
  });

  it('Wiederherstellen aus den Eingaben ergibt denselben Stand (auch nach Vorspulen)', () => {
    let s = tu(beginne(fall, 2, 2), { art: 'pflegetasche', geraet: 'pulsoxy' }, { art: 'massnahme', id: 'pulsoxy-anlegen' }, { art: 'warten', sek: 5 });
    s = spule(s);
    const r = rekonstruiere(fall, 2, 2, 1, s.z.eingaben);
    expect(r.z.t).toBe(s.z.t);
    expect(werteleiste(r)).toEqual(werteleiste(s));
    expect(r.z.meldungen).toEqual(s.z.meldungen);
  });

  it('Suche findet über alle Reiter, ohne Umlaute und Groß-/Kleinschreibung', () => {
    const alle = handlungen(beginne(fall, 2, 2).z);
    expect(suche(alle, 'blutzucker').map((h) => h.id)).toEqual(['bz-messen']);
    expect(suche(alle, 'SCHMERZEN').some((h) => h.art === 'frage')).toBe(true);
    expect(suche(alle, 'trinkmenge fragen').map((h) => h.id)).toEqual(['trinkmenge-erfragen']);
  });

  it('Uhrzeit, Lage und Übersicht', () => {
    expect(uhrzeit('08:10', 95)).toBe('08:11');
    expect(uhrzeit('23:59', 120)).toBe('00:01');
    const s = beginne(fall, 2, 2);
    expect(lageText(s.z)).toBe('Frau Lindner sitzt am Boden, wirkt verwirrt, Haut trocken.');
    const u = uebersicht(s.z);
    expect(u.pflicht.length).toBe(fall.bewertung.pflicht.length);
    expect(u.fehler).toEqual([]);
  });

  it('Klinik: Werte vom Wandmonitor laufen von Anfang an live, keine Pflegetasche', () => {
    const klinik: FallV2 = { ...fall, id: 'test-klinik', setting: 'krankenhaus', start: { ...fall.start, sichtbar: ['hf', 'spo2', 'rrSys', 'af'] } };
    const s = beginne(klinik, 2, 2);
    expect(['hf', 'spo2', 'rr', 'af'].map((k) => wert(s, k).stand)).toEqual(['live', 'live', 'live', 'live']);
    expect(wert(s, 'temp').stand).toBe('offen');
    expect(pflegetasche(s.z)).toEqual([]);
    expect(handlungen(s.z).find((h) => h.id === 'rr-messen')!.fehlendesGeraet).toBeUndefined();
  });
});
