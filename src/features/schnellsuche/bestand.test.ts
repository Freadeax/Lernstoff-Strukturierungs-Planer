import { describe, expect, it } from 'vitest';
import { modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { baueBestand } from './aufbau';
import { ausDnqp, type DnqpStandard } from './quellen';
import { suche } from './suchkern';

const MODUL = modules[0] as CatalogModule;

// Form wie die DNQP-Daten des Lernmoduls; Inhalt nur als Testbeispiel.
const BEISPIEL: DnqpStandard = {
  id: 'es.sturz', titel: 'Expertenstandard Sturzprophylaxe in der Pflege', kurztitel: 'Sturzprophylaxe', synonyme: ['Sturzvermeidung'],
  fassungen: [{ jahr: 2013, art: 'Aktualisierung' }, { jahr: 2022, art: 'Aktualisierung' }], zielsetzung: 'Stürze und Sturzfolgen vermeiden.',
  kriterien: [{ id: 'k1', nr: 1, thema: 'Einschätzung', struktur: ['Wissen zu Sturzrisikofaktoren.'], prozess: ['Erfasst Sturzrisikofaktoren.'], ergebnis: ['Einschätzung liegt vor.'], stichworte: ['TUG'] }],
  kernaussagen: ['Freiheitsentziehende Maßnahmen sind keine Sturzprophylaxe.'],
};

describe('Suchbestand', () => {
  const { index, standards } = baueBestand(MODUL, []);

  it('enthält alle Standards des Katalogs, Trainer, Instrumente und Glossar', () => {
    const katalog = (MODUL.references ?? []).filter((r) => r.kind === 'standard');
    expect(standards.filter((s) => s.gruppe === 'dnqp').map((s) => s.id).sort()).toEqual(katalog.map((r) => r.id).sort());
    expect(standards.filter((s) => s.gruppe === 'regelwerk').map((s) => s.id)).toEqual(['rw.hygiene', 'rw.notfall', 'rw.arzneimittel', 'rw.qualitaet', 'rw.recht']);
    for (const art of ['standard', 'uebung', 'instrument', 'begriff', 'kernaussage'] as const) expect(index.doks.some((d) => d.art === art)).toBe(true);
    expect(new Set(index.doks.map((d) => d.id)).size).toBe(index.doks.length);
  });
  it('verweist nur auf bekannte Standards und Seiten', () => {
    const bekannt = new Set(standards.map((s) => s.id));
    for (const d of index.doks) for (const s of d.standardIds) expect(bekannt.has(s), `${d.id} → ${s}`).toBe(true);
    for (const d of index.doks) if (d.link) expect(d.link).toMatch(/^\/lernen\/(thema|expertenstandards|assessment|dnqp|hygiene|notfall|arzneimittel|recht|grundlagen|ablauf)(\?|$)|^\/system\/quellen\?quelle=/);
  });
  it('findet typische Suchen der Ausbildung', () => {
    const erst = (q: string) => suche(index, q).treffer[0]?.dok;
    expect(erst('Druckgeschwür')?.standardIds).toContain('es.dekubitus');
    expect(erst('dekubitis')?.standardIds).toContain('es.dekubitus');
    expect(erst('Braden')?.art).toBe('instrument');
    expect(suche(index, 'Schmerz Demenz').treffer.some((t) => t.dok.id === 'instrument:besd')).toBe(true);
    expect(suche(index, 'stuerze').treffer[0]?.dok.standardIds).toContain('es.sturz');
  });
  it('findet weitere Standards: Hygiene, Notfall, Arzneimittel, Recht', () => {
    const std = (q: string) => suche(index, q).treffer[0]?.dok.standardIds;
    expect(std('Händedesinfektion')).toContain('rw.hygiene');
    expect(std('Herzdruckmassage')).toContain('rw.notfall');
    expect(std('6-R-Regel')).toContain('rw.arzneimittel');
    expect(std('Schweigepflicht')).toContain('rw.recht');
    expect(std('PDCA')).toContain('rw.qualitaet');
  });

  it('findet Handlungsabläufe und ihre typischen Fallen', () => {
    const e = suche(index, 'Verbandwechsel', { art: 'ablauf' });
    expect(e.treffer[0]?.dok).toMatchObject({ id: 'ablauf:verbandwechsel', link: '/lernen/ablauf?ablauf=verbandwechsel' });
    expect(e.treffer[0]?.dok.standardIds).toContain('rw.hygiene');
    const falle = suche(index, 'Recapping').treffer.find((t) => t.dok.id.startsWith('ablauf:sc-injektion:'));
    expect(falle?.dok.art).toBe('irrtum');
    expect(falle?.dok.link).toBe('/lernen/ablauf?ablauf=sc-injektion&modus=fehler');
    // auch über die falsche Handlung selbst auffindbar
    expect(suche(index, 'Nachttisch', { art: 'irrtum' }).treffer.some((t) => t.dok.id.startsWith('ablauf:verbandwechsel:'))).toBe(true);
  });
  it('zeigt Quellen mit Fassung und offenen Abgleichen aus dem Quellenregister', () => {
    const q = suche(index, 'Surviving Sepsis', { art: 'quelle' }).treffer[0]?.dok;
    expect(q?.link).toBe('/system/quellen?quelle=ssc');
    expect(q?.details?.some((d) => d.label === 'Neueste Fassung')).toBe(true);
    const pflbg = index.doks.find((d) => d.id === 'quelle:gesetz.pflbg');
    expect(pflbg?.standardIds).toEqual(['rw.recht']);
    expect(pflbg?.hinweis).toBe('Abgleich offen');
    expect(index.doks.find((d) => d.id === 'quelle:krinko')?.standardIds).toEqual(['rw.hygiene']);
    // Stand aus den Quellenangaben der Inhalte, wie auf der Seite „Quellen und Aktualität“
    const erc = index.doks.find((d) => d.id === 'quelle:erc');
    // Seit dem Quellen-Abgleich (#216) stehen die Reanimationsinhalte auf ERC 2025: kein Hinweis auf eine neuere Fassung mehr
    expect(erc).toBeDefined();
    expect(erc?.hinweis ?? '').not.toMatch(/^neue Fassung/);
    // Wo ein Hinweis auf eine neuere Fassung steht, zeigt der Eintrag auch den Stand der App-Inhalte
    for (const d of index.doks.filter((x) => x.id.startsWith('quelle:') && /^neue Fassung/.test(x.hinweis ?? ''))) {
      expect(d.details?.some((x) => x.label === 'Stand der App-Inhalte'), d.id).toBe(true);
    }
    // DNQP-Standards stehen nicht doppelt als Quelle im Index, bekommen aber den Stand aus dem Register
    expect(index.doks.some((d) => d.id.startsWith('quelle:es.'))).toBe(false);
    const echt = baueBestand(MODUL);
    const mitStand = echt.index.doks.filter((d) => d.id.startsWith('dnqp:') && d.details?.some((x) => x.label === 'Zuletzt nachgesehen'));
    expect(mitStand.length).toBeGreaterThan(5);
  });

  it('baut den Index schnell genug für jede Eingabe', () => {
    const t = performance.now();
    for (const q of ['dek', 'dekubitus einsch', 'schmerz demenz', 'mangelernaerung', 'xyz']) suche(index, q);
    expect(performance.now() - t).toBeLessThan(500);
  });

  it('bindet DNQP-Daten mit Kriterien je Ebene und Sprunglink ein', () => {
    const doks = ausDnqp([BEISPIEL]);
    expect(doks.filter((d) => d.art === 'kriterium').map((d) => d.titel)).toEqual(['S1 · Einschätzung', 'P1 · Einschätzung', 'E1 · Einschätzung']);
    expect(doks.find((d) => d.id === 'es.sturz:k1:p')?.link).toBe('/lernen/dnqp?standard=es.sturz&kriterium=k1');
    const mit = baueBestand(MODUL, [BEISPIEL]);
    expect(mit.index.doks.some((d) => d.id === 'katalog:es.sturz')).toBe(false);
    expect(mit.standards.find((s) => s.id === 'es.sturz')?.details).toBe('Aktualisierung 2022');
    const e = suche(mit.index, 'Sturzvermeidung P1');
    expect(e.treffer[0]?.dok.id).toBe('es.sturz:k1:p');
    expect(suche(mit.index, 'TUG E1').treffer.map((t) => t.dok.id)).toContain('es.sturz:k1:e');
  });
});
