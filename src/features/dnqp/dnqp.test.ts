import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import type { CatalogModule } from '../../modules/catalog-types';
import { GRUNDLAGEN } from './grundlagen';
import { pruefeText, PRUEFREGELN, saetze } from './pruefung';
import { aktuelleFassung, pfadZu, STANDARDS, standardVon } from './standards';

const modul = pflegeModule as CatalogModule;
const REFS = new Map((modul.references ?? []).map((r) => [r.id, r]));
const THEMEN = new Set(modul.topics.map((t) => t.id));
const CES = new Set((modul.frameworks ?? []).flatMap((f) => f.items.map((i) => i.id)));

describe('DNQP-Standards: Datenvertrag', () => {
  it('jeder Katalogeintrag es.* hat einen Standard und umgekehrt', () => {
    const katalog = [...REFS.keys()].filter((id) => id.startsWith('es.')).sort();
    expect(STANDARDS.map((s) => s.id).sort()).toEqual(katalog);
  });

  it('IDs sind eindeutig und auffindbar', () => {
    expect(new Set(STANDARDS.map((s) => s.id)).size).toBe(STANDARDS.length);
    for (const s of STANDARDS) expect(standardVon(s.id)).toBe(s);
  });

  it('aktuelle Standards haben 5–6 Ebenen mit fortlaufenden Ankern und S/P/E-Teilen', () => {
    for (const s of STANDARDS.filter((x) => x.status === 'aktuell')) {
      expect(s.kriterien.length, s.id).toBeGreaterThanOrEqual(5);
      expect(s.kriterien.length, s.id).toBeLessThanOrEqual(6);
      s.kriterien.forEach((k, i) => {
        expect(k.id).toBe(`k${i + 1}`);
        expect(k.ebene).toBe(i + 1);
        for (const [art, teile] of [['S', k.struktur], ['P', k.prozess], ['E', k.ergebnis]] as const) {
          expect(teile.length, `${s.id}:${k.id}:${art}`).toBeGreaterThan(0);
          for (const t of teile) expect(t.id, `${s.id}:${k.id}`).toMatch(new RegExp(`^${art}${k.ebene}[a-c]?$`));
        }
        const ids = [...k.struktur, ...k.prozess, ...k.ergebnis].map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
    }
  });

  it('Fassungen sind chronologisch und stimmen mit dem Katalog überein', () => {
    for (const s of STANDARDS) {
      const jahre = s.fassungen.map((f) => f.jahr);
      expect([...jahre].sort((a, b) => a - b), s.id).toEqual(jahre);
      if (s.status === 'aktuell') {
        const letzte = s.fassungen[s.fassungen.length - 1];
        expect(REFS.get(s.id)?.details ?? '', s.id).toContain(String(letzte.jahr));
      }
    }
    expect(aktuelleFassung(standardVon('es.dekubitus')!)).toBe('2. Aktualisierung 2017');
  });

  it('Themen und CE gibt es im Katalog', () => {
    for (const s of STANDARDS) {
      expect(s.themaIds.length, s.id).toBeGreaterThan(0);
      for (const t of s.themaIds) expect(THEMEN.has(t), `${s.id} → ${t}`).toBe(true);
      for (const c of s.ceIds) expect(CES.has(c), `${s.id} → ${c}`).toBe(true);
    }
  });

  it('jeder Standard hat eine https-Quelle mit Prüfdatum, Zielsetzung und Lernhinweise', () => {
    for (const s of STANDARDS) {
      expect(s.quelle.url).toMatch(/^https:\/\//);
      expect(s.quelle.geprueftAm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.zielsetzung.length).toBeGreaterThan(40);
      expect(s.merke.length).toBeGreaterThan(0);
    }
    for (const g of GRUNDLAGEN) expect(g.punkte.length).toBeGreaterThan(2);
  });

  it('Pfade für den Schnellsucher', () => {
    expect(pfadZu('es.sturz', 'k3')).toBe('/lernen/dnqp?standard=es.sturz&kriterium=k3');
    expect(pfadZu()).toBe('/lernen/dnqp');
  });
});

describe('Expertenstandard-Prüfung', () => {
  it('jedes Suchmuster findet die eigene Fehlvorstellung', () => {
    expect(PRUEFREGELN.length).toBeGreaterThan(15);
    for (const s of STANDARDS) {
      for (const f of s.fehlvorstellungen.filter((x) => x.muster?.length)) {
        const ids = pruefeText(f.falsch).map((t) => `${t.standardId}/${t.fehlvorstellung.id}`);
        expect(ids, `${s.id}/${f.id}: ${f.falsch}`).toContain(`${s.id}/${f.id}`);
      }
    }
  });

  it('richtige Aussagen lösen keine Prüfhinweise aus', () => {
    const korrekt = [
      'Die Pflegefachkraft schätzt das Dekubitusrisiko zu Beginn ein und wiederholt die Einschätzung in individuellen Abständen.',
      'Innerhalb von 24 Stunden nach Übernahme erfolgt die erste Einschätzung zum Entlassungsmanagement.',
      'Eine Wunde gilt als chronisch, wenn sie nach acht Wochen nicht abgeheilt ist.',
      'Der Expertenstandard Kontinenzförderung umfasst Harn- und Stuhlkontinenz.',
      'Chronischer Schmerz besteht seit mindestens drei Monaten.',
      'Windeldermatitis betrifft Säuglinge.',
    ];
    for (const k of korrekt) expect(pruefeText(k), k).toEqual([]);
  });

  it('erkennt Richtigstellungen', () => {
    const [t] = pruefeText('Die frühere Bezeichnung lautete Förderung der Harnkontinenz.');
    expect(t.wirktRichtiggestellt).toBe(true);
  });

  it('zerlegt Markdown in Sätze', () => {
    expect(saetze('- Punkt eins.\n- Punkt zwei. Noch ein Satz.')).toEqual(['Punkt eins.', 'Punkt zwei.', 'Noch ein Satz.']);
  });
});
