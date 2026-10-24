// Mindmaps: Datenmodell, Baumoperationen, Layout, Vorlagen und Abgleich. Alles rein und testbar,
// das Speichern (localStorage) steht unten.

import type { CatalogModule } from '../../modules/catalog-types';
import { normalize } from '../../ui/lib/trie';

export interface Knoten { id: string; text: string; kinder: Knoten[] }
export interface Mindmap {
  id: string;
  wurzel: Knoten;           // Text der Wurzel = Titel
  topicId?: string;         // Thema im Katalog, dann zählt das Üben für den Lernplan
  erstellt: string;
  geaendert: string;
}

let zaehler = 0;
export const neueId = () => `k${Date.now().toString(36)}${(zaehler++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const knoten = (text: string, kinder: Knoten[] = []): Knoten => ({ id: neueId(), text, kinder });

// ---------------------------------------------------------------- Baum

export interface Zeile { k: Knoten; tiefe: number; elternId?: string; ast: number }

/** Baum als Gliederung in Lesereihenfolge. `ast` = Index des Hauptasts (für die Farbe), Wurzel -1. */
export function zeilen(w: Knoten): Zeile[] {
  const out: Zeile[] = [{ k: w, tiefe: 0, ast: -1 }];
  const geh = (k: Knoten, tiefe: number, ast: number) => {
    for (const c of k.kinder) { out.push({ k: c, tiefe, elternId: k.id, ast }); geh(c, tiefe + 1, ast); }
  };
  w.kinder.forEach((c, i) => { out.push({ k: c, tiefe: 1, elternId: w.id, ast: i }); geh(c, 2, i); });
  return out;
}

export const alleKnoten = (w: Knoten): Knoten[] => [w, ...w.kinder.flatMap(alleKnoten)];
export const anzahl = (w: Knoten) => alleKnoten(w).length;

function aendere(w: Knoten, id: string, f: (k: Knoten) => Knoten): Knoten {
  if (w.id === id) return f(w);
  let geaendert = false;
  const kinder = w.kinder.map((c) => { const n = aendere(c, id, f); if (n !== c) geaendert = true; return n; });
  return geaendert ? { ...w, kinder } : w;
}

/** Eltern eines Knotens (oder undefined für die Wurzel). */
export function eltern(w: Knoten, id: string): Knoten | undefined {
  for (const c of w.kinder) {
    if (c.id === id) return w;
    const e = eltern(c, id);
    if (e) return e;
  }
  return undefined;
}

export const umbenennen = (w: Knoten, id: string, text: string) => aendere(w, id, (k) => ({ ...k, text }));

export function kindAnhaengen(w: Knoten, id: string, neu: Knoten = knoten('')): { w: Knoten; neu: Knoten } {
  return { w: aendere(w, id, (k) => ({ ...k, kinder: [...k.kinder, neu] })), neu };
}

/** Geschwister direkt hinter `id`. An der Wurzel wird ein Kind angehängt. */
export function geschwisterAnhaengen(w: Knoten, id: string, neu: Knoten = knoten('')): { w: Knoten; neu: Knoten } {
  const e = eltern(w, id);
  if (!e) return kindAnhaengen(w, id, neu);
  return {
    w: aendere(w, e.id, (k) => {
      const i = k.kinder.findIndex((c) => c.id === id);
      return { ...k, kinder: [...k.kinder.slice(0, i + 1), neu, ...k.kinder.slice(i + 1)] };
    }),
    neu,
  };
}

/** Entfernt einen Knoten samt Unterpunkten. Die Wurzel bleibt. */
export function entfernen(w: Knoten, id: string): Knoten {
  const e = eltern(w, id);
  if (!e) return w;
  return aendere(w, e.id, (k) => ({ ...k, kinder: k.kinder.filter((c) => c.id !== id) }));
}

/** Einrücken: wird letztes Kind des vorherigen Geschwisters. */
export function einruecken(w: Knoten, id: string): Knoten {
  const e = eltern(w, id);
  if (!e) return w;
  const i = e.kinder.findIndex((c) => c.id === id);
  if (i <= 0) return w;
  const k = e.kinder[i]!, vor = e.kinder[i - 1]!;
  return aendere(w, e.id, (x) => ({
    ...x,
    kinder: x.kinder.filter((c) => c.id !== id).map((c) => (c.id === vor.id ? { ...c, kinder: [...c.kinder, k] } : c)),
  }));
}

/** Ausrücken: steht danach hinter seinem bisherigen Elternknoten. */
export function ausruecken(w: Knoten, id: string): Knoten {
  const e = eltern(w, id);
  if (!e) return w;
  const g = eltern(w, e.id);
  if (!g) return w;
  const k = e.kinder.find((c) => c.id === id)!;
  return aendere(w, g.id, (x) => {
    const ohne = x.kinder.map((c) => (c.id === e.id ? { ...c, kinder: c.kinder.filter((y) => y.id !== id) } : c));
    const i = ohne.findIndex((c) => c.id === e.id);
    return { ...x, kinder: [...ohne.slice(0, i + 1), k, ...ohne.slice(i + 1)] };
  });
}

/** Unter den Geschwistern nach oben (-1) oder unten (+1) schieben. */
export function verschieben(w: Knoten, id: string, richtung: -1 | 1): Knoten {
  const e = eltern(w, id);
  if (!e) return w;
  const i = e.kinder.findIndex((c) => c.id === id);
  const j = i + richtung;
  if (j < 0 || j >= e.kinder.length) return w;
  return aendere(w, e.id, (x) => {
    const kinder = [...x.kinder];
    [kinder[i], kinder[j]] = [kinder[j]!, kinder[i]!];
    return { ...x, kinder };
  });
}

// ---------------------------------------------------------------- Text: Gliederung ein und aus

/** Als eingerückte Liste (zwei Leerzeichen je Ebene), z. B. zum Kopieren in Notizen. */
export function alsText(w: Knoten): string {
  return zeilen(w).map((z) => `${'  '.repeat(z.tiefe)}${z.tiefe ? '- ' : ''}${z.k.text}`).join('\n');
}

/**
 * Liest eine eingerückte Liste (Leerzeichen, Tabs, „-“, „*“, „•“, „1.“). Die erste Zeile wird Wurzel;
 * stehen mehrere Zeilen auf oberster Ebene, wird `titel` die Wurzel.
 */
export function ausText(text: string, titel = 'Mindmap'): Knoten | null {
  const roh = text.replace(/\t/g, '    ').split(/\r?\n/)
    .map((l) => ({ einzug: l.match(/^\s*/)![0].length, text: l.trim().replace(/^([-*•–]|\d+[.)])\s*/, '').trim() }))
    .filter((l) => l.text);
  if (!roh.length) return null;
  const minEinzug = Math.min(...roh.map((l) => l.einzug));
  const oben = roh.filter((l) => l.einzug === minEinzug).length;
  const wurzel = oben === 1 && roh[0]!.einzug === minEinzug ? knoten(roh.shift()!.text) : knoten(titel);
  const stapel: { einzug: number; k: Knoten }[] = [{ einzug: -1, k: wurzel }];
  for (const l of roh) {
    while (stapel.length > 1 && stapel[stapel.length - 1]!.einzug >= l.einzug) stapel.pop();
    const k = knoten(l.text);
    stapel[stapel.length - 1]!.k.kinder.push(k);
    stapel.push({ einzug: l.einzug, k });
  }
  return wurzel;
}

// ---------------------------------------------------------------- Vorlagen

export type VorlageId = 'leer' | 'krankheit' | 'katalog';
export const VORLAGEN: { id: VorlageId; label: string; text: string }[] = [
  { id: 'leer', label: 'Leer', text: 'Nur das Thema in der Mitte.' },
  { id: 'krankheit', label: 'Krankheitsbild', text: 'Äste Definition, Ursachen, Symptome, Diagnostik, Therapie, Pflege, Komplikationen.' },
  { id: 'katalog', label: 'Aus dem Katalog', text: 'Unterthemen und Fachbegriffe aus dem Glossar als Gerüst.' },
];
const KRANKHEIT = ['Definition', 'Ursachen und Risikofaktoren', 'Symptome', 'Diagnostik', 'Therapie', 'Pflege', 'Komplikationen'];
const MAX_BEGRIFFE = 10;

/** Fachbegriffe eines Themas aus dem Glossar (mit Abkürzung, falls vorhanden). */
export function begriffeZu(modul: CatalogModule, topicId: string): string[] {
  return modul.glossary
    .filter((g) => g.topicIds?.includes(topicId))
    .map((g) => (g.abbreviation ? `${g.term} (${g.abbreviation})` : g.term));
}

export function ausVorlage(vorlage: VorlageId, titel: string, modul?: CatalogModule, topicId?: string): Knoten {
  if (vorlage === 'krankheit') return knoten(titel, KRANKHEIT.map((t) => knoten(t)));
  if (vorlage === 'katalog' && modul && topicId) {
    const unter = modul.topics.filter((t) => t.parentId === topicId);
    if (unter.length) {
      return knoten(titel, unter.map((u) => knoten(u.name, begriffeZu(modul, u.id).slice(0, MAX_BEGRIFFE).map((b) => knoten(b)))));
    }
    return knoten(titel, begriffeZu(modul, topicId).slice(0, MAX_BEGRIFFE).map((b) => knoten(b)));
  }
  return knoten(titel);
}

/** Begriffe aus Katalog und Glossar zum Thema, die in der Mindmap noch fehlen. */
export function vorschlaege(w: Knoten, modul: CatalogModule, topicId: string): string[] {
  const unter = modul.topics.filter((t) => t.parentId === topicId);
  const kandidaten = [...unter.map((u) => u.name), ...begriffeZu(modul, topicId), ...unter.flatMap((u) => begriffeZu(modul, u.id))];
  const vorhanden = alleKnoten(w).map((k) => k.text);
  return [...new Set(kandidaten)].filter((k) => !vorhanden.some((v) => passt(v, k)));
}

// ---------------------------------------------------------------- Abgleich beim Üben

/** Vereinfacht für den Vergleich: klein, Umlaute, ohne Klammerzusatz und Satzzeichen. */
export function kern(text: string): string {
  return normalize(text).replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}
/** Abkürzung aus einem Klammerzusatz, z. B. „Body-Mass-Index (BMI)“ → „bmi“. */
function abkuerzung(text: string): string | undefined {
  const m = text.match(/\(([^)]{1,12})\)\s*$/);
  return m ? kern(m[1]!) : undefined;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let vor = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const akt = [i];
    for (let j = 1; j <= b.length; j++) {
      akt[j] = Math.min(vor[j]! + 1, akt[j - 1]! + 1, vor[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    vor = akt;
  }
  return vor[b.length]!;
}

/** Ist `antwort` dasselbe wie `soll`? Kleine Tippfehler sind erlaubt, Abkürzung in Klammern zählt auch. */
export function passt(antwort: string, soll: string): boolean {
  const a = kern(antwort), s = kern(soll);
  if (!a || !s) return false;
  if (a === s) return true;
  const abk = abkuerzung(soll);
  if (abk && a === abk) return true;
  const toleranz = s.length >= 12 ? 2 : s.length >= 5 ? 1 : 0;
  return levenshtein(a, s) <= toleranz;
}

// ---------------------------------------------------------------- Üben

export interface Luecke { id: string; soll: string; pfad: string[] }

/** Zufällige, aber mit `seed` wiederholbare Auswahl von Lücken. Die Wurzel bleibt immer sichtbar. */
export function waehleLuecken(w: Knoten, seed: number, anteil = 0.4, max = 12): Luecke[] {
  const z = zeilen(w).filter((x) => x.tiefe > 0 && x.k.text.trim());
  if (!z.length) return [];
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  const n = Math.min(max, z.length, Math.max(1, Math.round(z.length * anteil)));
  const gemischt = z.map((x) => ({ x, r: rnd() })).sort((a, b) => a.r - b.r).slice(0, n).map((y) => y.x);
  const reihenfolge = new Map(z.map((x, i) => [x.k.id, i]));
  return gemischt
    .sort((a, b) => reihenfolge.get(a.k.id)! - reihenfolge.get(b.k.id)!)
    .map((x) => ({ id: x.k.id, soll: x.k.text, pfad: pfadZu(w, x.k.id).slice(0, -1) }));
}

export function pfadZu(w: Knoten, id: string): string[] {
  if (w.id === id) return [w.text];
  for (const c of w.kinder) {
    const p = pfadZu(c, id);
    if (p.length) return [w.text, ...p];
  }
  return [];
}

export interface Erinnerung { getroffen: Knoten[]; verpasst: Knoten[]; falsch: string[]; prozent: number }

/** Freies Erinnern: jede Eingabezeile darf höchstens einen Knoten treffen, jeder Knoten zählt einmal. */
export function erinnern(w: Knoten, eingabe: string): Erinnerung {
  const soll = alleKnoten(w).filter((k) => k.id !== w.id && k.text.trim());
  const zeilenRoh = eingabe.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const offen = new Set(soll.map((k) => k.id));
  const getroffen: Knoten[] = []; const falsch: string[] = [];
  for (const z of zeilenRoh) {
    const k = soll.find((x) => offen.has(x.id) && passt(z, x.text));
    if (k) { offen.delete(k.id); getroffen.push(k); } else falsch.push(z);
  }
  const verpasst = soll.filter((k) => offen.has(k.id));
  return { getroffen, verpasst, falsch, prozent: soll.length ? Math.round((getroffen.length / soll.length) * 100) : 0 };
}

/** Ab so vielen abgefragten Begriffen zählt eine Übung für den Lernplan. */
export const MIN_FUER_LERNPLAN = 5;

// ---------------------------------------------------------------- Layout

export interface LayoutKnoten { k: Knoten; x: number; y: number; w: number; h: number; zeilen: string[]; tiefe: number; ast: number; seite: 1 | -1 }
export interface LayoutKante { von: LayoutKnoten; nach: LayoutKnoten }
export interface MindmapLayout { knoten: LayoutKnoten[]; kanten: LayoutKante[]; breite: number; hoehe: number }

export const GEOM = { zeichen: 7.4, zeile: 18, pad: 10, abstandX: 36, abstandY: 10, rand: 24, maxZeichen: 22, maxZeichenWurzel: 18 };

/** Bricht Text in Zeilen um (an Leerzeichen und Bindestrichen, lange Wörter hart). */
export function umbrechen(text: string, max: number): string[] {
  const woerter = (text.trim() || ' ').split(/\s+/);
  const out: string[] = [];
  let akt = '';
  for (let wort of woerter) {
    while (wort.length > max) {
      if (akt) { out.push(akt); akt = ''; }
      out.push(wort.slice(0, max - 1) + '-');
      wort = wort.slice(max - 1);
    }
    if (!akt) akt = wort;
    else if ((akt + ' ' + wort).length <= max) akt += ' ' + wort;
    else { out.push(akt); akt = wort; }
  }
  if (akt) out.push(akt);
  return out;
}

function masse(text: string, tiefe: number) {
  const zeilen = umbrechen(text, tiefe === 0 ? GEOM.maxZeichenWurzel : GEOM.maxZeichen);
  const laengste = Math.max(...zeilen.map((z) => z.length));
  const faktor = tiefe === 0 ? 1.25 : tiefe === 1 ? 1.08 : 1;
  return { zeilen, w: Math.max(48, laengste * GEOM.zeichen * faktor + GEOM.pad * 2), h: zeilen.length * GEOM.zeile * faktor + GEOM.pad * 1.4 };
}

/**
 * Klassische Mindmap: Wurzel in der Mitte, Hauptäste abwechselnd rechts und links nach Gewicht
 * verteilt, Unteräste nach außen. Koordinaten sind Mittelpunkte, alles positiv verschoben.
 */
export function layout(w: Knoten): MindmapLayout {
  const ln: LayoutKnoten[] = [];
  const kanten: LayoutKante[] = [];
  const wm = masse(w.text, 0);
  const wurzel: LayoutKnoten = { k: w, x: 0, y: 0, w: wm.w, h: wm.h, zeilen: wm.zeilen, tiefe: 0, ast: -1, seite: 1 };
  ln.push(wurzel);

  const hoehe = new Map<string, number>();
  const miss = (k: Knoten, tiefe: number): number => {
    const eigen = masse(k.text, tiefe).h;
    const kinder = k.kinder.reduce((s, c) => s + miss(c, tiefe + 1), 0) + Math.max(0, k.kinder.length - 1) * GEOM.abstandY;
    const h = Math.max(eigen, kinder);
    hoehe.set(k.id, h);
    return h;
  };
  w.kinder.forEach((c) => miss(c, 1));

  // Hauptäste verteilen: der Reihe nach auf die gerade leichtere Seite, rechts beginnt
  const rechts: number[] = []; const links: number[] = [];
  let hr = 0, hl = 0;
  w.kinder.forEach((c, i) => {
    const h = hoehe.get(c.id)!;
    if (hr <= hl) { rechts.push(i); hr += h + GEOM.abstandY * 2; } else { links.push(i); hl += h + GEOM.abstandY * 2; }
  });

  const setze = (k: Knoten, tiefe: number, ast: number, seite: 1 | -1, elter: LayoutKnoten, oben: number) => {
    const m = masse(k.text, tiefe);
    const h = hoehe.get(k.id)!;
    const x = elter.x + seite * (elter.w / 2 + GEOM.abstandX + m.w / 2);
    const n: LayoutKnoten = { k, x, y: oben + h / 2, w: m.w, h: m.h, zeilen: m.zeilen, tiefe, ast, seite };
    ln.push(n); kanten.push({ von: elter, nach: n });
    const summe = k.kinder.reduce((s, c) => s + hoehe.get(c.id)!, 0) + Math.max(0, k.kinder.length - 1) * GEOM.abstandY;
    let y = oben + (h - summe) / 2;
    for (const c of k.kinder) { setze(c, tiefe + 1, ast, seite, n, y); y += hoehe.get(c.id)! + GEOM.abstandY; }
  };
  for (const [seite, liste, gesamt] of [[1, rechts, hr], [-1, links, hl]] as const) {
    let y = -(gesamt - GEOM.abstandY * 2) / 2;
    for (const i of liste) {
      const c = w.kinder[i]!;
      setze(c, 1, i, seite, wurzel, y);
      y += hoehe.get(c.id)! + GEOM.abstandY * 2;
    }
  }

  const minX = Math.min(...ln.map((n) => n.x - n.w / 2)), maxX = Math.max(...ln.map((n) => n.x + n.w / 2));
  const minY = Math.min(...ln.map((n) => n.y - n.h / 2)), maxY = Math.max(...ln.map((n) => n.y + n.h / 2));
  for (const n of ln) { n.x += GEOM.rand - minX; n.y += GEOM.rand - minY; }
  return { knoten: ln, kanten, breite: maxX - minX + GEOM.rand * 2, hoehe: maxY - minY + GEOM.rand * 2 };
}

/** Geschwungene Verbindung vom Rand des Elternknotens zum Rand des Kindes. */
export function kantenPfad(a: LayoutKnoten, b: LayoutKnoten): string {
  const x1 = a.x + b.seite * (a.w / 2), y1 = a.y;
  const x2 = b.x - b.seite * (b.w / 2), y2 = b.y;
  const mx = (x1 + x2) / 2;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${mx.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** Feste Astfarben für den Export (die Ansicht nutzt Tokens und den Dunkelmodus). */
export const EXPORT_FARBEN = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Eigenständige SVG-Datei zum Speichern oder Drucken. */
export function alsSvg(l: MindmapLayout): string {
  const farbe = (ast: number) => (ast < 0 ? '#1f2937' : EXPORT_FARBEN[ast % EXPORT_FARBEN.length]!);
  const kanten = l.kanten.map((k) => `<path d="${kantenPfad(k.von, k.nach)}" fill="none" stroke="${farbe(k.nach.ast)}" stroke-width="${k.nach.tiefe === 1 ? 3 : 1.6}" stroke-linecap="round"/>`).join('');
  const knoten = l.knoten.map((n) => {
    const f = farbe(n.ast);
    const groesse = n.tiefe === 0 ? 17 : n.tiefe === 1 ? 14.5 : 13;
    const zh = groesse * 1.35;
    const y0 = n.y - ((n.zeilen.length - 1) * zh) / 2;
    const text = n.zeilen.map((z, i) => `<tspan x="${n.x.toFixed(1)}" y="${(y0 + i * zh).toFixed(1)}">${esc(z)}</tspan>`).join('');
    const rect = `<rect x="${(n.x - n.w / 2).toFixed(1)}" y="${(n.y - n.h / 2).toFixed(1)}" width="${n.w.toFixed(1)}" height="${n.h.toFixed(1)}" rx="${n.tiefe === 0 ? 14 : 8}" fill="${n.tiefe === 0 ? f : n.tiefe === 1 ? f : '#ffffff'}" fill-opacity="${n.tiefe === 1 ? 0.14 : 1}" stroke="${f}" stroke-width="${n.tiefe === 0 ? 0 : 1.4}"/>`;
    return `${rect}<text text-anchor="middle" dominant-baseline="central" font-size="${groesse}" font-weight="${n.tiefe < 2 ? 600 : 400}" fill="${n.tiefe === 0 ? '#ffffff' : '#111827'}">${text}</text>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(l.breite)}" height="${Math.ceil(l.hoehe)}" viewBox="0 0 ${Math.ceil(l.breite)} ${Math.ceil(l.hoehe)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"><rect width="100%" height="100%" fill="#ffffff"/>${kanten}${knoten}</svg>`;
}

// ---------------------------------------------------------------- Speichern (dieses Gerät)

const KEY = 'lernstoff.mindmaps';

export function ladeAlle(): Mindmap[] {
  try {
    const roh = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    if (!Array.isArray(roh)) return [];
    return roh.filter((m): m is Mindmap => !!m && typeof m === 'object' && typeof (m as Mindmap).id === 'string' && !!(m as Mindmap).wurzel);
  } catch { return []; }
}

/** Speichert alle Mindmaps. Gibt false zurück, wenn der Speicher voll oder gesperrt ist. */
export function speichereAlle(maps: Mindmap[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(maps)); return true; } catch { return false; }
}

export function neueMindmap(wurzel: Knoten, topicId?: string): Mindmap {
  const jetzt = new Date().toISOString();
  return { id: neueId(), wurzel, ...(topicId ? { topicId } : {}), erstellt: jetzt, geaendert: jetzt };
}
