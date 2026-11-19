import { describe, expect, it } from 'vitest';
import type { MasteryStatus } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { STATUS_GEWICHT } from '../examen/radar';
import { RADAR_GEWICHT, radarAchsen, schwaechsteAchse } from '../fortschritt/radar';
import { leafTopics } from '../lernplan/store';
import { FAELLE_V2 } from '../praxis/kern/faelle';
import { TRAINER_NAME } from '../lernplan/store';
import { flatNav, NAV, UNTERSEITEN } from '../../ui/shell/nav';
import { EINSATZ_ARTEN, STICHWORTE } from './arten';
import {
  abgleich, aktuellerEinsatz, besteErgebnisse, bereitCheck, EINSATZ_GEWICHT, einsatzPruefung, einsatzPruefungsId, istEinsatz, neuerEinsatz,
  phase, pruefungsTermin, VORLAUF_TAGE, type CheckFakten, type Einsatz,
} from './einsatz';
import {
  aendereNotiz, eingang, istNotiz, LEER, MAX_NOTIZEN, mitNotiz, mitReflexion, pruefeTagebuch, tage, themenVorschlag, type Notiz,
} from './tagebuch';

const blaetter = new Set(leafTopics(pflegeModule.topics).map((t) => t.id));
const fach = new Map(pflegeModule.topics.map((t) => [t.id, t.subjectId]));
const fachVon = (id: string) => fach.get(id);
const pfade = new Set([...flatNav(NAV), ...UNTERSEITEN].map((i) => i.path!));

const einsatz = (p: Partial<Einsatz> = {}): Einsatz => ({ ...neuerEinsatz('paediatrie', '2026-12-01', '2027-01-15', new Date('2026-11-16T10:00:00Z'), 'e1'), ...p });

describe('Einsatzarten', () => {
  it('jede Art nennt nur lernbare Themen (Blätter), ohne Doppelte', () => {
    for (const a of EINSATZ_ARTEN) {
      expect(a.themen.length, a.id).toBeGreaterThanOrEqual(8);
      expect(new Set(a.themen).size, a.id).toBe(a.themen.length);
      for (const t of a.themen) expect(blaetter.has(t), `${a.id}: ${t}`).toBe(true);
    }
  });
  it('Stichwörter zeigen nur auf lernbare Themen', () => {
    for (const [wort, ids] of Object.entries(STICHWORTE)) for (const t of ids) expect(blaetter.has(t), `${wort}: ${t}`).toBe(true);
  });
  it('Übungen im Bereit-Check zeigen auf echte Seiten und bekannte Trainer', () => {
    for (const a of EINSATZ_ARTEN) {
      for (const u of [...a.notfall, ...a.handgriffe]) {
        expect(pfade.has(u.path.split('?')[0]!), `${a.id}: ${u.path}`).toBe(true);
        expect(TRAINER_NAME[u.trainer], `${a.id}: ${u.trainer}`).toBeTruthy();
      }
    }
  });
  it('jede Art hat passende Praxisfälle im Simulator', () => {
    const settings = new Set<string>(FAELLE_V2.map((f) => f.setting));
    for (const a of EINSATZ_ARTEN) expect(a.praxisSettings.some((s) => settings.has(s)), a.id).toBe(true);
  });
});

describe('Einsatz: Phase und Lernplan', () => {
  it('Phasen: geplant, Vorbereitung ab drei Wochen vorher, läuft, vorbei', () => {
    const e = einsatz();
    expect(phase(e, '2026-11-01')).toBe('spaeter');
    expect(VORLAUF_TAGE).toBe(21);
    expect(phase(e, '2026-11-09')).toBe('spaeter');
    expect(phase(e, '2026-11-10')).toBe('vorbereitung');
    expect(phase(e, '2026-12-01')).toBe('laeuft');
    expect(phase(e, '2027-01-15')).toBe('laeuft');
    expect(phase(e, '2027-01-16')).toBe('vorbei');
  });

  it('aktueller Einsatz: laufender vor dem nächsten', () => {
    const a = einsatz({ id: 'a', von: '2026-11-10', bis: '2026-11-30' });
    const b = einsatz({ id: 'b', von: '2026-12-01', bis: '2026-12-20' });
    expect(aktuellerEinsatz([b, a], '2026-11-16')?.id).toBe('a');
    expect(aktuellerEinsatz([b, a], '2026-12-02')?.id).toBe('b');
    expect(aktuellerEinsatz([b, a], '2026-10-01')).toBeUndefined();
  });

  it('Lernplan-Termin: vor dem Einsatz der erste Tag, währenddessen der letzte', () => {
    const e = einsatz();
    expect(pruefungsTermin(e, '2026-11-16')).toBe('2026-12-01');
    expect(pruefungsTermin(e, '2026-12-05')).toBe('2027-01-15');
    const x = einsatzPruefung(e, '2026-11-16', fachVon);
    expect(x.id).toBe(einsatzPruefungsId('e1'));
    expect(x.topicIds).toEqual(e.themen);
    expect(x.subjectIds.length).toBeGreaterThan(0);
    expect(EINSATZ_GEWICHT).toBeLessThan(1);
  });

  it('Abgleich legt an, verschiebt den Termin, löscht vergangene und abgewählte Einsätze', () => {
    const e = einsatz();
    const leer = abgleich([e], [], '2026-11-16', fachVon);
    expect(leer.speichern.map((x) => x.id)).toEqual(['einsatz:e1']);
    const vorher = leer.speichern[0]!;
    // nichts geändert: nichts zu tun
    expect(abgleich([e], [vorher], '2026-11-20', fachVon)).toEqual({ speichern: [], loeschen: [] });
    // Einsatz hat begonnen: Termin rückt auf das Ende
    expect(abgleich([e], [vorher], '2026-12-02', fachVon).speichern[0]?.date).toBe('2027-01-15');
    // vorbei oder ohne Lernplan: weg; fremde Prüfungen bleiben unberührt
    const klausur = { id: 'k', name: 'Klausur', date: '2026-12-10', topicIds: [], subjectIds: [] };
    expect(abgleich([e], [vorher, klausur], '2027-02-01', fachVon).loeschen.map((x) => x.id)).toEqual(['einsatz:e1']);
    expect(abgleich([{ ...e, imLernplan: false }], [vorher, klausur], '2026-11-20', fachVon).loeschen.map((x) => x.id)).toEqual(['einsatz:e1']);
    expect(abgleich([], [vorher, klausur], '2026-11-20', fachVon).loeschen.map((x) => x.id)).toEqual(['einsatz:e1']);
  });

  it('prüft gespeicherte Einsätze streng', () => {
    expect(istEinsatz(einsatz())).toBe(true);
    expect(istEinsatz({ ...einsatz(), art: 'mond' })).toBe(false);
    expect(istEinsatz({ ...einsatz(), von: '2027-02-01' })).toBe(false);
    expect(istEinsatz({ ...einsatz(), themen: 'x' })).toBe(false);
    expect(istEinsatz(null)).toBe(false);
  });
});

describe('Bereit-Check', () => {
  const fakten = (p: Partial<CheckFakten> = {}): CheckFakten => ({
    heute: '2026-11-16', status: () => 'offen', themaName: (id) => id, faelle: [{ id: 'kind', titel: 'Kind', erledigt: false }, { id: 'asthma', titel: 'Asthma', erledigt: false }], ergebnisse: [], ...p,
  });

  it('ohne Daten ist alles rot, mit echten Ergebnissen grün', () => {
    const e = einsatz();
    expect(bereitCheck(e, fakten()).map((s) => s.ampel)).toEqual(['rot', 'rot', 'rot', 'rot']);
    const alle = (s: MasteryStatus) => () => s;
    const gut = [...EINSATZ_ARTEN.find((a) => a.id === 'paediatrie')!.notfall, ...EINSATZ_ARTEN.find((a) => a.id === 'paediatrie')!.handgriffe]
      .map((u) => ({ trainer: u.trainer, date: '2026-11-10', scorePercent: 80, status: 'abgeschlossen' }));
    const s = bereitCheck(e, fakten({ status: alle('sicher'), faelle: [{ id: 'kind', titel: 'Kind', erledigt: true }, { id: 'asthma', titel: 'Asthma', erledigt: true }], ergebnisse: gut }));
    expect(s.map((x) => x.ampel)).toEqual(['gruen', 'gruen', 'gruen', 'gruen']);
  });

  it('Wissen: gelb ab einem Drittel abgefragt, grün erst mit genug sicheren Themen', () => {
    const e = einsatz({ themen: ['thema.kl.paediatrie', 'thema.ph.neugeborenes', 'thema.beo.vitalzeichen'] });
    const st = (m: Record<string, MasteryStatus>) => (id: string) => m[id] ?? 'offen';
    expect(bereitCheck(e, fakten({ status: st({ 'thema.kl.paediatrie': 'unsicher' }) }))[0]!.ampel).toBe('gelb');
    expect(bereitCheck(e, fakten({ status: st({ 'thema.kl.paediatrie': 'unsicher', 'thema.ph.neugeborenes': 'unsicher', 'thema.beo.vitalzeichen': 'unsicher' }) }))[0]!.ampel).toBe('gelb');
    expect(bereitCheck(e, fakten({ status: st({ 'thema.kl.paediatrie': 'sicher', 'thema.ph.neugeborenes': 'sicher', 'thema.beo.vitalzeichen': 'unsicher' }) }))[0]!.ampel).toBe('gruen');
  });

  it('Trainer-Ergebnisse: nur abgeschlossen, keine Übung, nicht älter als 60 Tage', () => {
    const beste = besteErgebnisse([
      { trainer: 'notfall', date: '2026-11-10', scorePercent: 90, status: 'abgebrochen' },
      { trainer: 'notfall', date: '2026-11-10', scorePercent: 95, aussagekraft: 'uebung' },
      { trainer: 'notfall', date: '2026-08-01', scorePercent: 100 },
      { trainer: 'notfall', date: '2026-11-12', scorePercent: 60 },
      { trainer: 'hygiene', date: '2026-11-12', scorePercent: 75 },
    ], '2026-11-16');
    expect(beste.get('notfall')).toBe(60);
    expect(beste.get('hygiene')).toBe(75);
  });

  it('Karten-Link trägt alle Einsatzthemen', () => {
    const e = einsatz();
    const link = bereitCheck(e, fakten())[0]!.links[0]!.path;
    expect(decodeURIComponent(link)).toContain(e.themen.join(','));
  });
});

describe('Praxistagebuch', () => {
  const notiz = (p: Partial<Notiz> = {}): Notiz => ({ id: 'n1', at: '2026-11-16T08:00:00Z', tag: '2026-11-16', art: 'beobachtung', text: 'BZ 320 vor dem Frühstück', themen: [], erledigt: false, ...p });
  const quelle = { themen: leafTopics(pflegeModule.topics).map((t) => ({ id: t.id, name: t.name })), glossar: pflegeModule.glossary };

  it('schlägt passende Themen aus Stichwörtern, Glossar und Themennamen vor', () => {
    expect(themenVorschlag('BZ 320 vor dem Frühstück, Insulin nach Schema', quelle)).toContain('thema.kl.diabetes');
    expect(themenVorschlag('Verbandwechsel am Sakrum, Wunde nässt', quelle)).toContain('thema.ph.wunde');
    expect(themenVorschlag('Bewohnerin nachts gestürzt', quelle)).toContain('thema.pro.sturz');
    expect(themenVorschlag('Herzinsuffizienz mit Ödemen an beiden Beinen', quelle)[0]).toBe('thema.kl.herz.insuffizienz');
    expect(themenVorschlag('', quelle)).toEqual([]);
    expect(themenVorschlag('ok', quelle)).toEqual([]);
  });

  it('verwirft kaputte Einträge einzeln', () => {
    const t = pruefeTagebuch({ v: 1, notizen: [notiz(), { id: 3 }, notiz({ id: 'n2', art: 'quatsch' as never })], reflexionen: [{ id: 'r' }] });
    expect(t.notizen.map((n) => n.id)).toEqual(['n1']);
    expect(t.reflexionen).toEqual([]);
    expect(pruefeTagebuch('Unsinn')).toEqual(LEER);
    expect(istNotiz(notiz({ text: 'x'.repeat(5000) }))).toBe(false);
  });

  it('Eingang, Tage und Themen des Tages', () => {
    let t = mitNotiz(LEER, notiz({ themen: ['thema.kl.diabetes'] }));
    t = mitNotiz(t, notiz({ id: 'n2', tag: '2026-11-17', themen: ['thema.ph.wunde', 'thema.kl.diabetes'] }));
    t = mitReflexion(t, { id: 'r1', at: '', tag: '2026-11-17', themen: ['thema.kl.diabetes'], situation: 'a', gedanken: '', gut: '', lernen: '' });
    expect(eingang(t).map((n) => n.id)).toEqual(['n2', 'n1']);
    t = aendereNotiz(t, 'n1', { erledigt: true });
    expect(eingang(t).map((n) => n.id)).toEqual(['n2']);
    const ts = tage(t);
    expect(ts.map((x) => x.tag)).toEqual(['2026-11-17', '2026-11-16']);
    expect(ts[0]!.themen[0]).toBe('thema.kl.diabetes');
  });

  it('ist voll: die älteste erledigte Notiz fällt zuerst weg', () => {
    let t = { ...LEER, notizen: Array.from({ length: MAX_NOTIZEN }, (_, i) => notiz({ id: `x${i}`, erledigt: i === 3 })) };
    t = mitNotiz(t, notiz({ id: 'neu' }));
    expect(t.notizen).toHaveLength(MAX_NOTIZEN);
    expect(t.notizen.some((n) => n.id === 'x3')).toBe(false);
    expect(t.notizen[0]!.id).toBe('neu');
  });
});

describe('Kompetenz-Radar', () => {
  it('gleiche Gewichte wie das Examen-Radar', () => {
    expect(RADAR_GEWICHT).toEqual(STATUS_GEWICHT);
  });
  it('Stärke heute und vor vier Wochen, schwächster Bereich erst mit Daten', () => {
    const bereiche = [{ id: 'kb.I', code: 'I', name: 'eins', topicIds: ['a', 'b'] }, { id: 'kb.II', code: 'II', name: 'zwei', topicIds: ['c'] }, { id: 'kb.III', code: 'III', name: 'drei', topicIds: [] }];
    const jetzt: Record<string, MasteryStatus> = { a: 'sicher', b: 'unsicher', c: 'bearbeitet' };
    const achsen = radarAchsen(bereiche, (id) => jetzt[id] ?? 'offen', () => 'offen');
    expect(achsen.map((a) => [a.jetzt, a.vorher])).toEqual([[75, 0], [20, 0], [0, 0]]);
    expect(schwaechsteAchse(achsen)?.code).toBe('II');
    expect(schwaechsteAchse(radarAchsen(bereiche, () => 'offen'))).toBeUndefined();
  });
});
