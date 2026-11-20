import { describe, expect, it } from 'vitest';
import { bereichVon, flatNav, gruppenPfad, istAktiv, NAV, seitenName, sichtbareSeiten, THEMEN_ANSICHTEN, uebenGruppen, visibleNav } from './nav';
import { rollenFuer } from './session';

describe('Navigation', () => {
  it('nennt den Platz einer Seite im Menü', () => {
    expect(gruppenPfad('/lernen/wissen')).toBe('Üben');
    expect(gruppenPfad('/lernen/praxis')).toBe('Praxis');
    expect(gruppenPfad('/lernen/plan')).toBe('Lernen');
    expect(gruppenPfad('/lernen/landkarte')).toBe('Lernen · Themen');
    // „Mehr“ ist nur eine Schublade und taucht in der Marke nicht auf
    expect(gruppenPfad('/einstellungen')).toBe('System');
    expect(gruppenPfad('/system/design')).toBe('System');
  });
  it('führt das Designsystem nicht im Menü, kennt die Seite aber weiter', () => {
    expect(flatNav(NAV).some((i) => i.path === '/system/design')).toBe(false);
    expect(seitenName('/system/design')).toBe('Designsystem');
    expect(bereichVon('/system/design')).toBe('system');
  });
  it('hat genau die drei Übungsbündel, die „Heute“ direkt öffnet', () => {
    expect(uebenGruppen().map((g) => g.id)).toEqual(['fachwissen', 'praxis-gruppe', 'pruefung-gruppe']);
  });
});

describe('Grundmenü für Einsteiger (Audit U-1)', () => {
  const lernende = visibleNav(NAV, rollenFuer(false));
  it('hat oben höchstens acht Einträge, der letzte ist „Mehr“', () => {
    expect(lernende.map((i) => i.label)).toEqual(['Heute', 'Lernplan', 'Lernen', 'Üben', 'Praxis', 'Prüfung', 'Material', 'Mehr']);
    // Alle Gruppen starten eingeklappt: zu sehen sind zunächst nur die acht Zeilen.
    for (const g of lernende.filter((i) => i.children)) expect(g.zu, g.id).toBe(true);
  });
  it('jede Gruppe des Grundmenüs hat höchstens fünf Einträge', () => {
    for (const g of lernende.filter((i) => i.children && i.id !== 'mehr')) expect(g.children!.length, g.id).toBeLessThanOrEqual(5);
  });
  it('kein Fallsimulator mehr im Menü (Kurzfälle im Praxissimulator)', () => {
    expect(flatNav(NAV).some((i) => i.path === '/lernen/fall')).toBe(false);
    expect(flatNav(NAV).filter((i) => i.path === '/lernen/praxis')).toHaveLength(1);
  });
  it('blendet Entwicklerseiten nur mit dem Schalter ein', () => {
    const dev = ['/system/bilder', '/system/qualitaet', '/system/design'];
    const ohne = sichtbareSeiten(rollenFuer(false)).map((i) => i.path);
    const mit = sichtbareSeiten(rollenFuer(true)).map((i) => i.path);
    for (const p of dev) { expect(ohne, p).not.toContain(p); expect(mit, p).toContain(p); }
    expect(ohne).toContain('/system/sicherung');
  });
  it('Themen-Ansichten: ein Menüeintrag, der auf jeder Ansicht aktiv ist und in der Suche bleibt', () => {
    const themen = flatNav(NAV).find((i) => i.id === 'themen')!;
    for (const a of THEMEN_ANSICHTEN) {
      expect(istAktiv(themen, a.path!), a.path).toBe(true);
      expect(sichtbareSeiten(rollenFuer(false)).some((i) => i.path === a.path), a.path).toBe(true);
      expect(bereichVon(a.path!)).toBe('lernen');
    }
    expect(flatNav(NAV).filter((i) => THEMEN_ANSICHTEN.some((a) => a.path === i.path))).toHaveLength(1);
  });
  it('jede Seite bleibt erreichbar: Menü oder Unterseite', () => {
    const vorher = ['/lernen/wegweiser', '/lernen/ce', '/lernen/themen', '/lernen/skript', '/lernen/dnqp', '/lernen/karten', '/lernen/schnellsuche', '/lernen/landkarte',
      '/lernen/physiologie', '/lernen/mindmap', '/lernen/board', '/lernen/einsatz', '/lernen/fortschritt', '/lernen/faecher', '/lernen/klasse', '/lehren/radar', '/system/test', '/system/quellen'];
    const alle = sichtbareSeiten(rollenFuer(false)).map((i) => i.path);
    for (const p of vorher) expect(alle, p).toContain(p);
  });
});
