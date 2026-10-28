import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { SZENARIEN } from '../fall/faelle';
import { ceListe, ceThemen, gruppeZuCe, kartenProThema, nachFach, skripteZuCe, steckbriefeZuThema, szenarienZuThema, type SkriptKopf } from './modell';

const modul = pflegeModule;
const liste = ceListe(modul);
const ce = (id: string) => liste.find((c) => c.id === id)!;
const blaetter = new Set(modul.topics.filter((t) => !modul.topics.some((k) => k.parentId === t.id)).map((t) => t.id));

describe('CE-Liste', () => {
  it('hat CE 01 bis 11, Teil-CEs hängen an CE 02', () => {
    expect(liste.map((c) => c.code)).toEqual(['CE 01', 'CE 02', 'CE 03', 'CE 04', 'CE 05', 'CE 06', 'CE 07', 'CE 08', 'CE 09', 'CE 10', 'CE 11']);
    expect(ce('ce.02').teile.map((t) => t.code)).toEqual(['CE 02A', 'CE 02B']);
  });

  it('ordnet Skript-Gruppen der CE zu, Lernfelder und Fremdes nicht', () => {
    expect(gruppeZuCe('CE 09', liste)).toBe('ce.09');
    expect(gruppeZuCe('CE 2A', liste)).toBe('ce.02');
    expect(gruppeZuCe('ce05', liste)).toBe('ce.05');
    expect(gruppeZuCe('LEB 5', liste)).toBeUndefined();
    expect(gruppeZuCe('CE 12', liste)).toBeUndefined();
    expect(gruppeZuCe('Weitere', liste)).toBeUndefined();
  });
});

describe('Themen einer CE', () => {
  it('jede CE hat mindestens ein Thema aus dem Katalog, alle Themen sind Blätter', () => {
    for (const c of liste) {
      const th = ceThemen(modul, c, [], liste);
      expect(th.length, c.code).toBeGreaterThan(0);
      for (const t of th) expect(blaetter.has(t.topic.id), t.topic.id).toBe(true);
    }
  });

  it('vererbt die Zuordnung eines Oberthemas an seine Unterthemen', () => {
    // thema.pro (Prophylaxen) trägt ce.04
    const th = ceThemen(modul, ce('ce.04'), [], liste);
    const deku = th.find((t) => t.topic.id === 'thema.pro.dekubitus');
    expect(deku?.herkunft).toEqual(['oberthema']);
  });

  it('merkt sich Teil-CEs', () => {
    const th = ceThemen(modul, ce('ce.02'), [], liste);
    expect(th.find((t) => t.topic.id === 'thema.ph.mobilisation')?.teil).toBe('CE 02A');
    expect(th.find((t) => t.topic.id === 'thema.ph.koerperpflege')?.teil).toBe('CE 02B');
  });

  it('nimmt Themen aus Skripten derselben CE auf, Skripte anderer CEs nicht', () => {
    const skripte: SkriptKopf[] = [
      { id: 'ce09-demenz', gruppe: 'CE 09', titel: 'Demenz', topicIds: ['thema.kl.demenz'] },
      { id: 'ce09-bett', gruppe: 'CE 09', titel: 'Bettlägerigkeit', topicIds: ['thema.kl.geriatrie', 'thema.unbekannt'] },
      { id: 'leb5-herz', gruppe: 'LEB 5', titel: 'Herzinsuffizienz', topicIds: ['thema.kl.herz.insuffizienz'] },
    ];
    const th = ceThemen(modul, ce('ce.09'), skripte, liste);
    const demenz = th.find((t) => t.topic.id === 'thema.kl.demenz');
    expect(demenz?.herkunft).toEqual(['skript']);
    expect(demenz?.skriptIds).toEqual(['ce09-demenz']);
    // geriatrie ist im Katalog schon CE 09 und steht zusätzlich im Skript
    expect(th.find((t) => t.topic.id === 'thema.kl.geriatrie')?.herkunft).toEqual(['katalog', 'skript']);
    expect(th.some((t) => t.topic.id === 'thema.kl.herz.insuffizienz')).toBe(false);
    expect(skripteZuCe(skripte, 'ce.09', liste).map((s) => s.id)).toEqual(['ce09-demenz', 'ce09-bett']);
  });

  it('gruppiert nach Fach in Modulreihenfolge ohne Doppelungen', () => {
    const th = ceThemen(modul, ce('ce.05'), [], liste);
    const g = nachFach(th, modul);
    const reihe = modul.subjects.map((s) => s.id);
    expect(g.map((x) => reihe.indexOf(x.fachId))).toEqual([...g.map((x) => reihe.indexOf(x.fachId))].sort((a, b) => a - b));
    expect(g.flatMap((x) => x.themen).length).toBe(th.length);
    expect(new Set(th.map((t) => t.topic.id)).size).toBe(th.length);
  });
});

describe('Inhalte je Thema', () => {
  it('findet Steckbriefe, Fälle und zählt Karten', () => {
    const profile = modul.diseaseProfiles ?? [];
    const mitThema = profile.find((p) => p.topicIds.length)!;
    expect(steckbriefeZuThema(mitThema.topicIds[0]!, profile)).toContain(mitThema);
    expect(szenarienZuThema('thema.kl.herz.insuffizienz', SZENARIEN).map((s) => s.id)).toContain('herzinsuffizienz');
    const n = kartenProThema([{ topicIds: ['a', 'b'] }, { topicIds: ['a', 'a'] }]);
    expect(n.get('a')).toBe(2);
    expect(n.get('b')).toBe(1);
  });
});
