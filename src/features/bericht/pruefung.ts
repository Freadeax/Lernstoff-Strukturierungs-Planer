// Prüfung eines Pflegeberichts per Code, ganz ohne KI. Läuft offline.
// Zwei Teile: Kernpunkte des Falls (wie im Übergabe-Trainer) und eine Sprachprüfung, die wertende,
// ungenaue und vermutende Wörter findet. Wörtliche Rede in Anführungszeichen ist davon ausgenommen,
// denn dort stehen die Worte der Person.
import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';
import { BAUSTEINE, type Baustein, type BerichtFall, type Kernpunkt } from './faelle';

export type FundArt = 'wertend' | 'vage' | 'vermutung';
export interface Fund { art: FundArt; wort: string; start: number; ende: number }

export interface PunktErgebnis { punkt: Kernpunkt; ok: boolean }
export interface BausteinErgebnis { baustein: Baustein; punkte: PunktErgebnis[]; status: 'vollstaendig' | 'teilweise' | 'fehlt' | 'leer' }

/** Fallunabhängige Grundkriterien eines Eintrags (Audit Pflegebericht). Reine Stichwortprüfung. */
export type GrundId = 'zeit' | 'fakten' | 'massnahme' | 'wirkung';
export interface Grundkriterium { id: GrundId; label: string; ok: boolean; hinweis: string }

export interface BerichtErgebnis {
  grund: Grundkriterium[];
  bausteine: BausteinErgebnis[];
  funde: Fund[];
  wertfrei: boolean;
  prozent: number;
  woerter: number;
  pflichtFehlend: Kernpunkt[];
  hinweise: string[];
}

// Wortstämme; erlaubt sind nur übliche Endungen, damit „stur“ nicht „Sturz“ trifft und „faul“ nicht „faulig“.
const WERTEND = ['aggressiv', 'uneinsichtig', 'unkooperativ', 'stur', 'faul', 'nervig', 'nervt', 'jammert', 'jammern', 'rumgejammert', 'meckert', 'gemeckert', 'rumgemeckert', 'schwierig', 'bockig', 'zickig', 'frech', 'renitent', 'querulant', 'hysterisch', 'launisch', 'anstrengend', 'unmöglich', 'böse', 'eklig', 'ekelhaft', 'verweigert', 'verweigerung', 'dreckig', 'lästig', 'theatralisch', 'simuliert', 'wehleidig', 'undankbar', 'dickköpfig'];
// Ganze Wörter oder Wendungen, die nichts Messbares sagen.
const VAGE = ['gut', 'schlecht', 'normal', 'unauffällig', 'wie immer', 'mal wieder', 'wieder mal', 'o\\. ?B\\.', 'ohne Befund', 'ständig', 'total', 'die ganze Nacht', 'viel', 'wenig', 'etwas', 'ok', 'okay', 'alles gut', 'wie gewohnt'];
const VERMUTUNG = ['wahrscheinlich', 'vermutlich', 'scheint', 'scheinbar', 'anscheinend', 'offenbar', 'offensichtlich', 'angeblich', 'wohl', 'bestimmt'];

const L = '\\p{L}';
const RE: Record<FundArt, RegExp> = {
  wertend: new RegExp(`(?<!${L})(${WERTEND.join('|')})(?:e|en|er|es|em|ität|ung|heit|keit)?(?!${L})`, 'giu'),
  vage: new RegExp(`(?<!${L})(${VAGE.join('|')})(?!${L})`, 'giu'),
  vermutung: new RegExp(`(?<!${L})(${VERMUTUNG.join('|')})(?!${L})`, 'giu'),
};

/** Ersetzt wörtliche Rede („…“, "…", »…«) durch Leerzeichen gleicher Länge, Positionen bleiben gleich. */
export function ohneZitate(text: string): string {
  return text.replace(/„[^“”"]*[“”"]|"[^"]*"|»[^«]*«|«[^»]*»|“[^”]*”/g, (m) => ' '.repeat(m.length));
}

/** Findet problematische Wörter mit Position im Originaltext (für die Markierung). */
export function sprachpruefung(text: string): Fund[] {
  const t = ohneZitate(text);
  const funde: Fund[] = [];
  for (const art of ['wertend', 'vermutung', 'vage'] as FundArt[]) {
    for (const m of t.matchAll(RE[art])) {
      const start = m.index!, ende = start + m[0].length;
      if (funde.some((f) => start < f.ende && ende > f.start)) continue;
      funde.push({ art, wort: text.slice(start, ende), start, ende });
    }
  }
  return funde.sort((a, b) => a.start - b.start);
}

/** Zerlegt den Text in Stücke mit und ohne Fund (für die Anzeige). */
export function markiere(text: string, funde: Fund[]): { text: string; fund?: Fund }[] {
  const out: { text: string; fund?: Fund }[] = [];
  let pos = 0;
  for (const f of funde) {
    if (f.start > pos) out.push({ text: text.slice(pos, f.start) });
    out.push({ text: text.slice(f.start, f.ende), fund: f });
    pos = f.ende;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}

const ZEIT = /\d{1,2}[:.]\d{2}|\d{1,2}\s*uhr|(?<!\p{L})(?:seit|ab|bis|nach|vor|um|gegen|innerhalb)\s+(?:\d+|einer|eine|zwei|drei|einigen)\s*(?:min|minute|minuten|std|stunde|stunden|tag|tagen)?|(?<!\p{L})(?:frühdienst|spätdienst|nachtdienst|morgens|mittags|abends|nachts)(?!\p{L})/iu;
// Messbare oder beobachtbare Angaben: Zahl mit Einheit oder wörtliche Rede.
const FAKT = /\d+(?:[.,]\d+)?\s*(?:mmhg|\/min|°c|%|ml|l|mg\/dl|mmol|kg|cm|mal|löffel|bissen|tasse|tassen|becher|glas|gläser|portion|von 10|\/10)(?!\p{L})|[„"»“]/iu;
const MASSNAHME = /(?<!\p{L})(?:gegeben|verabreicht|angeboten|angereicht|gelagert|umgelagert|mobilisiert|begleitet|gemessen|kontrolliert|informiert|verständigt|angerufen|durchgeführt|gewechselt|versorgt|unterstützt|abgesaugt|eingerieben|aufgesetzt|hingesetzt|beruhigt|erklärt|angeleitet|getrunken lassen|gereicht|ermöglicht|geholt|ausgezogen|angezogen|geduscht|gewaschen|verbunden|gekühlt|zugedeckt|geöffnet|abgesetzt|gestoppt|eingesetzt|appliziert|injiziert|inhaliert|aufgeholfen|verbandwechsel|nachgesehen)(?!\p{L})/iu;
const WIRKUNG = /(?<!\p{L})(?:danach|anschließend|daraufhin|im anschluss|nach\s+\d+\s*(?:min|minuten|std|stunden)|wirkung|wirkt|reagiert|ruhiger|entspannt|schläft|schlief|besser|gebessert|unverändert|nicht verändert|weiterhin|nachgelassen|gesunken|gestiegen|bleibt|blieb|lehnt|lehnte)(?!\p{L})/iu;

// Reaktion der Person nach der Maßnahme: Wirkungswort, neue Uhrzeit, beobachtbares Verhalten oder wörtliche Aussage.
const REAKTION = /(?<!\p{L})(?:gegessen|getrunken|geht|ging|sitzt|saß|liegt|schläft|schlafend|gelingt|gelang|sagt|sagte|nrs\s*\d)(?!\p{L})|\d{1,2}[:.]\d{2}|\d{1,2}\s*uhr|[„"»“]/iu;

/** Grundkriterien: Zeitbezug, beobachtbare Fakten, Maßnahme und Wirkung (Wirkung nach der Maßnahme). */
export function grundkriterien(text: string): Grundkriterium[] {
  const t = text.trim();
  const m = MASSNAHME.exec(t);
  const danach = m ? t.slice(m.index + m[0].length) : '';
  return [
    { id: 'zeit', label: 'Zeitbezug', ok: ZEIT.test(t), hinweis: 'Wann wurde beobachtet oder gehandelt? Uhrzeit oder Zeitraum nennen.' },
    { id: 'fakten', label: 'Beobachtbare Fakten', ok: FAKT.test(t), hinweis: 'Messwerte, Mengen oder wörtliche Aussagen statt Eindrücken.' },
    { id: 'massnahme', label: 'Maßnahme', ok: !!m, hinweis: 'Was hast du getan? Die Maßnahme ausdrücklich nennen.' },
    { id: 'wirkung', label: 'Wirkung nach der Maßnahme', ok: !!m && (WIRKUNG.test(danach) || REAKTION.test(danach)), hinweis: 'Wie hat die Person auf die Maßnahme reagiert? Nach der Maßnahme beschreiben, was sich verändert hat.' },
  ];
}

export function pruefeBericht(fall: BerichtFall, text: string): BerichtErgebnis {
  const such = suchtext(vereinfache(text));
  const ergebnisse = fall.kernpunkte.map((punkt) => ({ punkt, ok: findeMuster(such, punkt.muster) >= 0 }));
  const bausteine: BausteinErgebnis[] = BAUSTEINE.map((b) => {
    const punkte = ergebnisse.filter((e) => e.punkt.baustein === b);
    const pflicht = punkte.filter((e) => e.punkt.pflicht);
    const status = !punkte.length ? 'leer'
      : pflicht.every((e) => e.ok) && punkte.some((e) => e.ok) ? 'vollstaendig'
        : punkte.some((e) => e.ok) ? 'teilweise' : 'fehlt';
    return { baustein: b, punkte, status };
  });

  const funde = text.trim() ? sprachpruefung(text) : [];
  const wertend = funde.filter((f) => f.art === 'wertend');
  const wertfrei = !!text.trim() && !wertend.length;

  // Kernpunkte: Pflicht 2, optional 1; dazu „sachlich, ohne Wertung“ mit 3 Punkten
  let max = 3, erreicht = wertfrei ? 3 : 0;
  for (const e of ergebnisse) { const w = e.punkt.pflicht ? 2 : 1; max += w; if (e.ok) erreicht += w; }

  const woerter = text.split(/\s+/).filter(Boolean).length;
  const hinweise: string[] = [];
  if (!woerter) hinweise.push('Noch kein Text.');
  else {
    if (wertend.length) hinweise.push(`Wertende Wörter: ${[...new Set(wertend.map((f) => `„${f.wort}“`))].join(', ')}. Beschreibe, was du gesehen und gehört hast, statt es zu bewerten.`);
    const vermutung = funde.filter((f) => f.art === 'vermutung');
    if (vermutung.length) hinweise.push(`Vermutungen (${[...new Set(vermutung.map((f) => `„${f.wort}“`))].join(', ')}): Schreib die Beobachtung auf, auf die du dich stützt, oder kennzeichne deutlich, dass es deine Einschätzung ist.`);
    const vage = funde.filter((f) => f.art === 'vage');
    if (vage.length) hinweise.push(`Ungenau: ${[...new Set(vage.map((f) => `„${f.wort}“`))].join(', ')}. Nenne stattdessen Mengen, Zeiten oder genaues Verhalten (z. B. „2 Löffel Suppe“ statt „wenig“).`);
    if (!/\d{1,2}[:.]\d{2}|\d{1,2}\s*uhr/i.test(text)) hinweise.push('Es fehlt eine Uhrzeit. Ein Bericht sagt, wann etwas beobachtet wurde.');
    if (!/[„"“»«]/.test(text) && fall.kernpunkte.some((k) => k.baustein === 'aussage')) hinweise.push('Tipp: Was die Person sagt, gehört wörtlich in Anführungszeichen. So bleibt erkennbar, was Aussage und was Beobachtung ist.');
    if (woerter < 15) hinweise.push('Sehr kurz. Fehlen Beobachtung, Maßnahme oder Wirkung?');
  }

  return {
    grund: grundkriterien(text), bausteine, funde, wertfrei, woerter,
    prozent: woerter ? Math.round((erreicht / max) * 100) : 0,
    pflichtFehlend: ergebnisse.filter((e) => e.punkt.pflicht && !e.ok).map((e) => e.punkt),
    hinweise,
  };
}
