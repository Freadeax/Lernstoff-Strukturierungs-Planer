// Prüfung einer SBAR-Übergabe per Code, ganz ohne KI. Läuft offline.
// Erkennt S/B/A/R-Überschriften („S:“, „Situation:“ …). Fehlen sie, wird der ganze Text durchsucht
// und die Reihenfolge über die Fundstellen geschätzt.
import { allgemeinePunkte, type Fall, type Kernpunkt, type Teil } from './faelle';

export const TEILE: Teil[] = ['S', 'B', 'A', 'R'];

export type PunktStatus = 'ok' | 'falscher-teil' | 'fehlt';
export type TeilStatus = 'vollstaendig' | 'teilweise' | 'fehlt';

export interface PunktErgebnis { punkt: Kernpunkt; status: PunktStatus; gefundenIn?: Teil }
export interface TeilErgebnis { teil: Teil; status: TeilStatus; punkte: PunktErgebnis[] }

export interface Pruefergebnis {
  teile: TeilErgebnis[];
  prozent: number;            // 0–100, Pflichtpunkte zählen doppelt
  pflichtFehlend: Kernpunkt[];
  gegliedert: boolean;        // S/B/A/R-Überschriften erkannt
  reihenfolgeOk: boolean;
  woerter: number;
  sekunden: number;           // geschätzte Sprechdauer
  hinweise: string[];
}

const WOERTER_PRO_MINUTE = 130;

/** Vereinfacht Text für den Vergleich. Zeilenumbrüche bleiben für die Gliederung erhalten. */
export function vereinfache(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/(\d)\s*komma\s*(\d)/g, '$1,$2')
    .replace(/(\d)\.(\d)/g, '$1,$2')
    .replace(/(\d+)\s*(?:zu|ueber|\/)\s*(\d+)/g, '$1/$2')
    .replace(/[^\S\n]+/g, ' ');
}

/** Satzzeichen zu Leerzeichen, außer in Zahlen (38,9 · 92/55 · 14:20) und „?“, „%“. */
function suchtext(seg: string): string {
  const t = seg
    .replace(/[,/:](?!\d)|(?<!\d)[,/:]/g, ' ')
    .replace(/[^a-z0-9?%,/:]+/g, ' ');
  return ` ${t.trim()} `;
}

const ZAHL = /^[\d,/:]+$/;

/** Fundstelle eines Musterteils oder -1. Zahlen nur als ganze Zahl (92 trifft nicht 192, 9,2 oder 145/92, aber 92/55). */
function stelle(t: string, teil: string): number {
  const z = teil.trim();
  if (ZAHL.test(z)) return t.search(new RegExp(`(?<![\\d,/:])${z}(?!\\d|[,:]\\d)`));
  return t.indexOf(teil);
}

/** Erste Fundstelle eines Musters (Alternativen, „ + “ = alle Teile) oder -1. */
export function findeMuster(t: string, muster: string[]): number {
  let best = -1;
  for (const alt of muster) {
    const pos = alt.split(' + ').map((x) => stelle(t, x));
    if (pos.some((p) => p < 0)) continue;
    const p = Math.min(...pos);
    if (best < 0 || p < best) best = p;
  }
  return best;
}

const UEBERSCHRIFT: Record<string, Teil> = {
  s: 'S', situation: 'S',
  b: 'B', hintergrund: 'B', background: 'B', vorgeschichte: 'B',
  a: 'A', einschaetzung: 'A', beurteilung: 'A', assessment: 'A',
  r: 'R', empfehlung: 'R', recommendation: 'R', bitte: 'R', anliegen: 'R',
};
// Überschrift am Zeilen- oder Satzanfang, gefolgt von Doppelpunkt (oder „-“, „)“)
const UEBERSCHRIFT_RE = /(^|\n|[.!?]\s)\s*(situation|hintergrund|background|vorgeschichte|einschaetzung|beurteilung|assessment|empfehlung|recommendation|anliegen|bitte|s|b|a|r)\s*(?::|\)|\s-\s|\s–\s)/g;

/** Zerlegt in Abschnitte je Teil. Leeres Ergebnis = keine Gliederung erkannt. */
export function gliedere(text: string): { teil: Teil; text: string; start: number }[] {
  const funde: { teil: Teil; start: number; ende: number }[] = [];
  for (const m of text.matchAll(UEBERSCHRIFT_RE)) {
    const start = m.index! + m[1].length;
    funde.push({ teil: UEBERSCHRIFT[m[2]]!, start, ende: m.index! + m[0].length });
  }
  // Mindestens zwei verschiedene Teile, sonst ist es vermutlich ein normales „bitte:“ o. Ä.
  if (new Set(funde.map((f) => f.teil)).size < 2) return [];
  return funde.map((f, i) => ({ teil: f.teil, start: f.start, text: text.slice(f.ende, funde[i + 1]?.start ?? text.length) }));
}

export function pruefe(fall: Fall, eingabe: string): Pruefergebnis {
  const roh = vereinfache(eingabe);
  const abschnitte = gliedere(roh);
  const gegliedert = abschnitte.length > 0;
  const ganz = suchtext(roh);
  const jeTeil = new Map<Teil, string>();
  for (const a of abschnitte) jeTeil.set(a.teil, (jeTeil.get(a.teil) ?? ' ') + suchtext(a.text));

  const alle = [...allgemeinePunkte(fall.anlass), ...fall.kernpunkte];
  const positionen: { teil: Teil; pos: number }[] = [];

  const ergebnisse: PunktErgebnis[] = alle.map((punkt) => {
    if (!gegliedert) {
      const pos = findeMuster(ganz, punkt.muster);
      if (pos < 0) return { punkt, status: 'fehlt' };
      positionen.push({ teil: punkt.teil, pos });
      return { punkt, status: 'ok' };
    }
    if (findeMuster(jeTeil.get(punkt.teil) ?? '', punkt.muster) >= 0) return { punkt, status: 'ok' };
    const anders = TEILE.find((t) => t !== punkt.teil && findeMuster(jeTeil.get(t) ?? '', punkt.muster) >= 0);
    return anders ? { punkt, status: 'falscher-teil', gefundenIn: anders } : { punkt, status: 'fehlt' };
  });

  const teile: TeilErgebnis[] = TEILE.map((teil) => {
    const punkte = ergebnisse.filter((e) => e.punkt.teil === teil);
    const pflicht = punkte.filter((e) => e.punkt.pflicht);
    const okP = pflicht.filter((e) => e.status === 'ok').length;
    const irgendwas = punkte.some((e) => e.status !== 'fehlt');
    const status: TeilStatus = pflicht.length && okP === pflicht.length ? 'vollstaendig' : irgendwas ? 'teilweise' : 'fehlt';
    return { teil, status, punkte };
  });

  let max = 0; let erreicht = 0;
  for (const e of ergebnisse) {
    const w = e.punkt.pflicht ? 2 : 1;
    max += w;
    erreicht += e.status === 'ok' ? w : e.status === 'falscher-teil' ? w / 2 : 0;
  }

  const reihenfolgeOk = gegliedert ? istSortiert(abschnitte.map((a) => a.teil)) : reihenfolgeGeschaetzt(positionen);
  const woerter = eingabe.split(/\s+/).filter(Boolean).length;
  const sekunden = Math.round((woerter / WOERTER_PRO_MINUTE) * 60);
  const pflichtFehlend = ergebnisse.filter((e) => e.punkt.pflicht && e.status === 'fehlt').map((e) => e.punkt);

  const hinweise: string[] = [];
  if (!woerter) hinweise.push('Noch kein Text.');
  else {
    if (!gegliedert) hinweise.push('Tipp: Beginne die Teile mit „S:“, „B:“, „A:“, „R:“. Dann prüft der Trainer auch, ob alles im richtigen Teil steht.');
    if (!reihenfolgeOk) hinweise.push('Reihenfolge prüfen: erst Situation, dann Hintergrund, Einschätzung, zuletzt Empfehlung.');
    if (fall.anlass !== 'schicht' && sekunden > 75) hinweise.push(`Gesprochen etwa ${dauer(sekunden)}. Am Telefon möglichst unter einer Minute bleiben: nur, was für die Entscheidung zählt.`);
    if (fall.anlass === 'notfall' && sekunden > 40) hinweise.push('Im Notfall noch knapper: Wer, wo, Verdacht, wichtigste Werte, was jetzt passieren muss.');
    if (woerter < 25) hinweise.push('Sehr kurz. Fehlen Werte oder deine Einschätzung?');
  }

  return {
    teile, prozent: max ? Math.round((erreicht / max) * 100) : 0, pflichtFehlend,
    gegliedert, reihenfolgeOk, woerter, sekunden, hinweise,
  };
}

function istSortiert(folge: Teil[]): boolean {
  const idx = folge.map((t) => TEILE.indexOf(t));
  return idx.every((v, i) => i === 0 || v >= idx[i - 1]!);
}

/** Ohne Überschriften: mittlere Fundstelle je Teil muss aufsteigen. Nicht gefundene Teile zählen nicht. */
function reihenfolgeGeschaetzt(pos: { teil: Teil; pos: number }[]): boolean {
  const mitte = TEILE.flatMap((t) => {
    const p = pos.filter((x) => x.teil === t).map((x) => x.pos).sort((a, b) => a - b);
    return p.length ? [p[Math.floor(p.length / 2)]!] : [];
  });
  return mitte.every((v, i) => i === 0 || v >= mitte[i - 1]!);
}

export function dauer(sek: number): string {
  if (sek < 60) return `${sek} s`;
  return `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')} min`;
}
