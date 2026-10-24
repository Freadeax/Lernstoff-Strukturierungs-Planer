import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import {
  alleKnoten, alsSvg, alsText, ausruecken, ausText, ausVorlage, einruecken, entfernen, erinnern, geschwisterAnhaengen,
  kindAnhaengen, knoten, layout, passt, umbrechen, verschieben, vorschlaege, waehleLuecken, zeilen, type Knoten,
} from './modell';

const texte = (w: Knoten) => zeilen(w).map((z) => `${z.tiefe}:${z.k.text}`);
const beispiel = () => ausText('Diabetes\n  Symptome\n    Durst\n    Polyurie\n  Therapie\n    Insulin\n    Bewegung\n  Komplikationen')!;

describe('Baumoperationen', () => {
  it('Gliederung lesen und schreiben', () => {
    const w = beispiel();
    expect(texte(w)).toEqual(['0:Diabetes', '1:Symptome', '2:Durst', '2:Polyurie', '1:Therapie', '2:Insulin', '2:Bewegung', '1:Komplikationen']);
    expect(texte(ausText(alsText(w))!)).toEqual(texte(w));
  });
  it('liest Aufzählungszeichen und mehrere oberste Zeilen', () => {
    const w = ausText('- Ursachen\n  * Insulinmangel\n- Symptome\n\t• Durst', 'Diabetes')!;
    expect(texte(w)).toEqual(['0:Diabetes', '1:Ursachen', '2:Insulinmangel', '1:Symptome', '2:Durst']);
    expect(ausText('  \n ')).toBeNull();
  });
  it('anhängen, einrücken, ausrücken, verschieben, entfernen', () => {
    let w = beispiel();
    const therapie = w.kinder[1]!;
    const g = geschwisterAnhaengen(w, therapie.id, knoten('Diagnostik'));
    w = g.w;
    expect(w.kinder.map((k) => k.text)).toEqual(['Symptome', 'Therapie', 'Diagnostik', 'Komplikationen']);
    w = einruecken(w, g.neu.id);
    expect(w.kinder[1]!.kinder.map((k) => k.text)).toEqual(['Insulin', 'Bewegung', 'Diagnostik']);
    w = ausruecken(w, g.neu.id);
    expect(w.kinder.map((k) => k.text)).toEqual(['Symptome', 'Therapie', 'Diagnostik', 'Komplikationen']);
    w = verschieben(w, g.neu.id, -1);
    expect(w.kinder.map((k) => k.text)).toEqual(['Symptome', 'Diagnostik', 'Therapie', 'Komplikationen']);
    expect(verschieben(w, w.kinder[0]!.id, -1)).toBe(w);
    w = entfernen(w, therapie.id);
    expect(alleKnoten(w).map((k) => k.text)).not.toContain('Insulin');
    expect(entfernen(w, w.id)).toBe(w);
    expect(einruecken(w, w.kinder[0]!.id)).toBe(w);
    expect(ausruecken(w, w.kinder[0]!.id)).toBe(w);
  });
  it('lässt den alten Baum unverändert', () => {
    const w = beispiel();
    const vorher = alsText(w);
    kindAnhaengen(w, w.kinder[0]!.id, knoten('neu'));
    expect(alsText(w)).toBe(vorher);
  });
});

describe('Vorlagen', () => {
  it('Katalog-Vorlage nutzt Unterthemen und Glossar', () => {
    const w = ausVorlage('katalog', 'Pflegeprozess', pflegeModule, 'thema.pp');
    expect(w.kinder.map((k) => k.text)).toContain('Strukturmodell und SIS');
    const sis = w.kinder.find((k) => k.text === 'Strukturmodell und SIS')!;
    expect(sis.kinder.some((k) => k.text.includes('SIS'))).toBe(true);
  });
  it('Vorschläge nennen nur fehlende Begriffe', () => {
    const w = ausVorlage('katalog', 'SIS', pflegeModule, 'thema.pp.sis');
    expect(vorschlaege(w, pflegeModule, 'thema.pp.sis')).toEqual([]);
    const leer = ausVorlage('leer', 'SIS');
    expect(vorschlaege(leer, pflegeModule, 'thema.pp.sis').length).toBeGreaterThan(2);
  });
  it('Krankheitsbild hat sieben Äste', () => {
    expect(ausVorlage('krankheit', 'Pneumonie').kinder).toHaveLength(7);
  });
});

describe('Abgleich', () => {
  it('passt: Groß/klein, Umlaute, kleine Tippfehler, Abkürzung', () => {
    expect(passt('polyurie', 'Polyurie')).toBe(true);
    expect(passt('Ubelkeit', 'Übelkeit')).toBe(true);
    expect(passt('Uebelkeit', 'Übelkeit')).toBe(true);
    expect(passt('Polyuri', 'Polyurie')).toBe(true);
    expect(passt('BMI', 'Body-Mass-Index (BMI)')).toBe(true);
    expect(passt('Body Mass Index', 'Body-Mass-Index (BMI)')).toBe(true);
    expect(passt('Puls', 'Durst')).toBe(false);
    expect(passt('Ast', 'Asthma')).toBe(false);
    expect(passt('', 'x')).toBe(false);
  });
  it('erinnern: jeder Knoten zählt einmal', () => {
    const r = erinnern(beispiel(), 'Durst\ndurst, Insulin; Fieber');
    expect(r.getroffen.map((k) => k.text)).toEqual(['Durst', 'Insulin']);
    expect(r.falsch).toEqual(['durst', 'Fieber']);
    expect(r.prozent).toBe(29);
  });
  it('Lücken sind wiederholbar, ohne Wurzel und in Lesereihenfolge', () => {
    const w = beispiel();
    const a = waehleLuecken(w, 42), b = waehleLuecken(w, 42);
    expect(a).toEqual(b);
    expect(a.length).toBe(3);
    expect(a.every((l) => l.id !== w.id)).toBe(true);
    const ordnung = zeilen(w).map((z) => z.k.id);
    expect([...a].sort((x, y) => ordnung.indexOf(x.id) - ordnung.indexOf(y.id))).toEqual(a);
    expect(a[0]!.pfad[0]).toBe('Diabetes');
  });
});

describe('Layout', () => {
  it('umbrechen hält die Breite ein', () => {
    expect(umbrechen('Ursachen und Risikofaktoren', 22)).toEqual(['Ursachen und', 'Risikofaktoren']);
    expect(umbrechen('Donaudampfschifffahrtsgesellschaft', 12).every((z) => z.length <= 12)).toBe(true);
  });
  it('verteilt Äste links und rechts ohne Überlappung', () => {
    const w = ausVorlage('krankheit', 'Pneumonie');
    for (const k of w.kinder) for (let i = 0; i < 3; i++) k.kinder.push(knoten(`${k.text} ${i}`));
    const l = layout(w);
    expect(l.knoten).toHaveLength(alleKnoten(w).length);
    const wurzel = l.knoten[0]!;
    const seiten = new Set(l.knoten.filter((n) => n.tiefe === 1).map((n) => Math.sign(n.x - wurzel.x)));
    expect(seiten).toEqual(new Set([1, -1]));
    for (const a of l.knoten) for (const b of l.knoten) {
      if (a === b) continue;
      const ueber = Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.5 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 0.5;
      expect(ueber, `${a.k.text} / ${b.k.text}`).toBe(false);
    }
    expect(l.knoten.every((n) => n.x - n.w / 2 >= 0 && n.y - n.h / 2 >= 0 && n.x + n.w / 2 <= l.breite && n.y + n.h / 2 <= l.hoehe)).toBe(true);
  });
  it('SVG-Export ist eigenständig und maskiert Text', () => {
    const svg = alsSvg(layout(knoten('A & B <C>', [knoten('x')])));
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('A &amp; B &lt;C&gt;');
    expect(svg).not.toContain('var(--');
  });
});
