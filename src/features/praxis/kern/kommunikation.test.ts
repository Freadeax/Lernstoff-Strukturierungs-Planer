// P11 Kommunikation: Gesprächsfäden, Arzt-Messenger, Rückfragen, Rückaufträge, Schweigepflicht (Muster: Frau Lindner)
import { describe, expect, it } from 'vitest';
import { bewerte } from './auswertung';
import { PILOT_AMBULANT as FALL } from './faelle/amb-sturz-exsikkose';
import { gilt, replay, sende, start, type SimZustand } from './kern';
import { arztKanaele, auftragsListe, MESSENGER_SEK, wertBausteine, ZUSAGE_ID } from './kommunikation';
import type { SimEventEingabe } from './typen';

const SBAR_OHNE_BZ = ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-exsikkose', 'a-verwirrt-neu', 'a-verletzung', 'r-hausbesuch'];
const VORBEREITUNG: SimEventEingabe[] = [
  { art: 'massnahme', id: 'verletzung-pruefen-sturz' },
  { art: 'massnahme', id: 'sitzend-sichern' },
  { art: 'pflegetasche', geraet: 'rr-geraet' },
  { art: 'massnahme', id: 'rr-messen' },
  { art: 'massnahme', id: 'schleimhaut-pruefen' },
  { art: 'massnahme', id: 'trinken-anbieten' },
];
const spiele = (eingaben: readonly SimEventEingabe[], z: SimZustand = start(FALL, 2, 2)) => eingaben.reduce(sende, z);
const vonAerztin = (z: SimZustand) => z.meldungen.filter((m) => m.faden === 'aerztin' && m.richtung === 'rein').map((m) => m.text);

describe('Kommunikation (P11)', () => {
  it('Musterweg: Rückauftrag RR-Kontrolle wird erledigt, gemeldet und beantwortet; alle Kompetenzbereiche ≥ 90 %', () => {
    const z = replay(FALL, 2, 2, 1, FALL.pruefwege.muster);
    expect(z.ende?.ausgang).toBe('stabil');
    expect(gilt(z, { auftrag: 'af-rr-kontrolle', status: 'gemeldet' })).toBe(true);
    expect(gilt(z, { auftrag: 'af-rr-kontrolle', status: 'verspaetet' })).toBe(false);
    expect(z.log.filter((e) => e.art === 'auftrag').map((e) => e.art === 'auftrag' && e.status)).toEqual(['offen', 'erledigt', 'gemeldet']);
    expect(vonAerztin(z).at(-1)).toMatch(/richtige Richtung|Immer noch niedrig/);
    for (const b of bewerte(z).kb) expect(b.prozent, b.id).toBeGreaterThanOrEqual(90);
  });

  it('Rückfrage „Wie hoch ist der Zucker?“: Zusage legt den Rückauftrag an, Melden per Messenger bringt die Anordnungen', () => {
    let z = spiele([...VORBEREITUNG, { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: SBAR_OHNE_BZ }]);
    expect(vonAerztin(z).at(-1)).toMatch(/Wie hoch ist der Zucker/);
    expect(z.angeboten).toEqual([]);
    // der Wert-Baustein fehlt noch: nur die Zusage hilft
    expect(wertBausteine(z).map((b) => b.id)).not.toContain('wert:bz');
    z = spiele([{ art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: [ZUSAGE_ID] }, { art: 'auflegen', an: 'aerztin' }], z);
    expect(auftragsListe(z).map((a) => [a.id, a.status])).toEqual([['af-bz', 'offen']]);
    expect(arztKanaele(z)).toContain('messenger');
    z = spiele([{ art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' }], z);
    expect(gilt(z, { auftrag: 'af-bz', status: 'erledigt' })).toBe(true);
    expect(wertBausteine(z).find((b) => b.id === 'wert:bz')?.text).toMatch(/^BZ \d+ mg\/dl \(gemessen \d\d:\d\d\)$/);
    // Messenger: Antwort kommt verzögert, die Zeit läuft weiter
    z = sende(z, { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz'] });
    expect(gilt(z, { auftrag: 'af-bz', status: 'gemeldet' })).toBe(true);
    expect(z.angeboten).toEqual([]);
    expect(z.komm.ausstehend).toHaveLength(1);
    z = sende(z, { art: 'warten', sek: MESSENGER_SEK });
    expect(z.angeboten).toEqual(['an-torasemid-pause', 'an-trinken']);
    expect(vonAerztin(z).at(-1)).toMatch(/Torasemid heute weglassen/);
    // dieselbe Regel (id r-hausbesuch) antwortet nicht noch einmal
    z = spiele([{ art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz'] }, { art: 'warten', sek: 5 }], z);
    expect(vonAerztin(z).at(-1)).toMatch(/notiert/);
    expect(vonAerztin(z).filter((t) => /Torasemid heute weglassen/.test(t))).toHaveLength(1);
    expect(auftragsListe(z).map((a) => a.id)).toEqual(['af-bz', 'af-rr-kontrolle']);
  });

  it('Gemeldet wird der zuletzt gemessene Wert, nicht der aktuelle Modellwert', () => {
    let z = spiele([{ art: 'pflegetasche', geraet: 'rr-geraet' }, { art: 'massnahme', id: 'rr-messen' }]);
    const vorher = wertBausteine(z).find((b) => b.id === 'wert:rrSys')!.text;
    z = spiele([{ art: 'massnahme', id: 'trinken-anbieten' }, { art: 'warten', sek: 900 }], z);
    expect(wertBausteine(z).find((b) => b.id === 'wert:rrSys')!.text).toBe(vorher);
    // nicht gemessene Werte lassen sich nicht melden
    z = sende(z, { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:spo2', 's-sturz'] });
    expect(z.komm.faeden.aerztin?.bausteine).toEqual(['s-sturz']);
  });

  it('Rückauftrag zu spät: Status verspätet, PA erinnert, Fehler zählt in KB II', () => {
    const muster = FALL.pruefwege.muster;
    const bisAuflegen = muster.slice(0, muster.findIndex((e) => e.art === 'auflegen') + 1);
    let z = replay(FALL, 2, 2, 1, bisAuflegen);
    z = sende(z, { art: 'warten', sek: 1600 });
    expect(gilt(z, { auftrag: 'af-rr-kontrolle', status: 'verspaetet' })).toBe(true);
    expect(z.fehlerAus).toContain('auftrag-verspaetet:af-rr-kontrolle');
    expect(z.meldungen.some((m) => m.art === 'pa' && /wartet noch auf deine Rückmeldung/.test(m.text))).toBe(true);
    z = sende(z, { art: 'abschluss', probleme: [], ziele: [] });
    const b = bewerte(z);
    const fehler = b.beitraege.find((x) => x.id === 'fehler:auftrag-verspaetet:af-rr-kontrolle');
    expect(fehler?.bereiche).toEqual(['II']);
    expect(fehler?.abzug).toBeGreaterThan(0);
  });

  it('Schweigepflicht: Tochter ohne Einwilligung informiert → Fehler mit Text; mit Einwilligung kein Fehler', () => {
    const ohne = sende(start(FALL, 2, 2), { art: 'frage', id: 'g-tochter-lage' });
    expect(ohne.fehlerAus).toContain('schweigepflicht:g-tochter-lage');
    expect(ohne.meldungen.some((m) => m.art === 'fehler' && /Einwilligung/.test(m.text) && m.faden === 'angehoerige')).toBe(true);
    const mit = spiele([{ art: 'frage', id: 'g-einwilligung' }, { art: 'frage', id: 'g-tochter-lage' }]);
    expect(mit.fehlerAus).not.toContain('schweigepflicht:g-tochter-lage');
    expect(mit.flags).toContain('einwilligung-tochter');
    expect(mit.meldungen.filter((m) => m.faden === 'angehoerige').map((m) => m.richtung)).toEqual(['raus', 'rein']);
  });

  it('Telefon: Faden bleibt offen bis „auflegen“ oder bis du dich dem Patienten zuwendest', () => {
    let z = sende(start(FALL, 2, 2), { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['a-verwirrt-neu'] });
    expect(z.komm.faeden.aerztin?.telefonOffen).toBe(true);
    expect(vonAerztin(z).at(-1)).toMatch(/Haben Sie Blutdruck gemessen/);
    z = sende(z, { art: 'massnahme', id: 'ansprechen-orientierung' });
    expect(z.komm.faeden.aerztin?.telefonOffen).toBe(false);
    // ohne Konsultation kein Messenger: Nachricht geht als Anruf
    const neu = sende(start(FALL, 2, 2), { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['s-nur-sturz'] });
    expect(neu.getan['anruf-aerztin']).toHaveLength(1);
  });

  it('Replay: gleiche Eingaben ergeben denselben Zustand, auch mit Messenger-Wartezeit', () => {
    const eingaben: SimEventEingabe[] = [...VORBEREITUNG, { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: SBAR_OHNE_BZ },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: [ZUSAGE_ID] }, { art: 'auflegen', an: 'aerztin' },
      { art: 'pflegetasche', geraet: 'bz-geraet' }, { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz'], freitext: 'BZ ist da' }, { art: 'warten', sek: 30 }, { art: 'warten', sek: 75 }];
    const a = replay(FALL, 2, 2, 1, eingaben);
    const b = replay(FALL, 2, 2, 1, a.eingaben);
    expect(b.meldungen).toEqual(a.meldungen);
    expect(b.komm).toEqual(a.komm);
    expect(b.log).toEqual(a.log);
  });
});
