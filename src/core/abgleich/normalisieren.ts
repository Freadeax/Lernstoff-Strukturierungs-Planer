// Antwort-Katalog: Freitext für den Abgleich aufbereiten (offline, fachneutral).
// Kleinschreibung, Umlaute falten, Satzzeichen weg, Abkürzungen und Synonyme auf ein Leitwort,
// grober deutscher Wortstamm. Das Fachmodul liefert die Synonymgruppen.

/** Wörter ohne Bedeutung für den Inhalt. Pronomen bleiben bewusst drin (Ich-Botschaft, „Sie“-Anrede). */
const STOPP = new Set(
  ('der die das den dem des ein eine einer eines einem einen und oder aber doch denn ja nein nicht noch schon auch nur mal '
  + 'so wie was wer wo da dann wenn weil dass ob zu zum zur im in am an auf aus bei mit nach von vor fuer ueber unter um '
  + 'ist sind war waren bin bist sein seid hat habe haben hatte hatten wird werden wurde wuerde kann koennen muss muessen '
  + 'soll sollen will wollen mag es man sich bitte eben halt etwa erst einmal jetzt gerade sehr ganz gar').split(' '),
);

export function falte(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/₂/g, '2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Sehr grober Wortstamm: genügt, damit „misst/messe/messen“ und „Sorgen/Sorge“ zusammenfallen. */
export function stamm(w: string): string {
  if (w.length <= 4 || /^\d/.test(w)) return w;
  for (const e of ['ungen', 'ung', 'heit', 'keit', 'isch', 'lich', 'end', 'est', 'ern', 'em', 'en', 'er', 'es', 'st', 'e', 'n', 's', 't']) {
    if (w.endsWith(e) && w.length - e.length >= 4) return w.slice(0, -e.length);
  }
  return w;
}

export interface Synonyme {
  /** gefaltetes Wort oder Wortfolge → Leitwort (gefaltet) */
  ersetze: Map<string, string>;
  /** längste Wortfolge in `ersetze` (für den Abgleich mehrteiliger Ausdrücke) */
  maxWoerter: number;
}

/** Gruppen wie [['blutdruck', 'RR', 'Blutdruckmessung'], …]: das erste Wort ist das Leitwort. */
export function synonyme(gruppen: string[][]): Synonyme {
  const ersetze = new Map<string, string>();
  let maxWoerter = 1;
  for (const g of gruppen) {
    const leit = falte(g[0] ?? '');
    if (!leit) continue;
    for (const w of g) {
      const f = falte(w);
      if (!f || ersetze.has(f)) continue;
      ersetze.set(f, leit);
      maxWoerter = Math.max(maxWoerter, f.split(' ').length);
    }
  }
  return { ersetze, maxWoerter };
}

/** Text → Liste von Inhalts-Stämmen (nach Synonymen, ohne Stoppwörter). */
export function woerter(text: string, syn?: Synonyme): string[] {
  const roh = falte(text).split(' ').filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < roh.length;) {
    let treffer = '';
    let laenge = 1;
    if (syn) {
      for (let n = Math.min(syn.maxWoerter, roh.length - i); n >= 1; n--) {
        const t = syn.ersetze.get(roh.slice(i, i + n).join(' '));
        if (t) { treffer = t; laenge = n; break; }
      }
    }
    if (treffer) {
      for (const t of treffer.split(' ')) out.push(stamm(t));
    } else if (!STOPP.has(roh[i]!)) out.push(stamm(roh[i]!));
    i += laenge;
  }
  return out;
}

/** Zeichen-Dreiergruppen eines Wortes, für Tippfehler („Blutdurck“). */
export function trigramme(w: string): string[] {
  const s = `_${w}_`;
  const out: string[] = [];
  for (let i = 0; i + 3 <= s.length; i++) out.push(s.slice(i, i + 3));
  return out;
}
