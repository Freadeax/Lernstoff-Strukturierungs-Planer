// Ablauf-Werkbank, reine Logik.
// Durchführen: An jeder Stelle drei Möglichkeiten (der richtige nächste Schritt, eine typische Falle, ein späterer Schritt).
//   Fehlermodus: Ein Fehlgriff zeigt sofort Fehler und Folge, dann geht es an derselben Stelle weiter.
//   Gezählt wird je Schritt nur der erste Griff.
// Fehler finden: Ein vorgeführter Ablauf enthält zwei bis drei Fehler (Falle eingeschoben, zwei Schritte vertauscht,
//   Pflichtschritt fehlt). Markieren, was falsch ist, und sagen, was fehlt.

import type { Ablauf, Falle, Schritt } from './inhalt';

export type Zufall = () => number;

/** Reproduzierbarer Zufall für Tests und gleiche Runden nach dem Neuladen. */
export function zufallAus(seed: number): Zufall {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mische<T>(xs: T[], zufall: Zufall): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out;
}
const eins = <T>(xs: T[], zufall: Zufall): T | undefined => xs[Math.floor(zufall() * xs.length)];

// ---------------------------------------------------------------- Durchführen

export interface Fehlgriff { position: number; id: string; art: 'falle' | 'reihenfolge'; kritisch: boolean }
export interface Stand { erledigt: string[]; fehlgriffe: Fehlgriff[] }
export const START: Stand = { erledigt: [], fehlgriffe: [] };

export interface Option { art: 'schritt' | 'falle'; id: string; text: string }

/** Welche Schritte jetzt richtig wären: der erste offene und alle offenen aus derselben Gruppe. */
export function erlaubt(a: Ablauf, erledigt: string[]): Schritt[] {
  const offen = a.schritte.filter((s) => !erledigt.includes(s.id));
  const erster = offen[0];
  if (!erster) return [];
  return erster.gruppe ? offen.filter((s) => s.gruppe === erster.gruppe) : [erster];
}

export const fertig = (a: Ablauf, s: Stand) => s.erledigt.length >= a.schritte.length;

/** Drei Möglichkeiten für die aktuelle Stelle. Gewählte Fallen kommen nicht wieder. */
export function optionen(a: Ablauf, s: Stand, zufall: Zufall): Option[] {
  const ok = erlaubt(a, s.erledigt);
  const richtig = eins(ok, zufall);
  if (!richtig) return [];
  const genutzt = new Set(s.fehlgriffe.map((f) => f.id));
  const position = s.erledigt.length;
  const fallen = a.fallen.filter((f) => !genutzt.has(f.id));
  const spaeter = a.schritte.filter((x) => !s.erledigt.includes(x.id) && !ok.includes(x) && !s.fehlgriffe.some((f) => f.position === position && f.id === x.id));
  const out: Option[] = [{ art: 'schritt', id: richtig.id, text: richtig.text }];
  const falle = eins(fallen, zufall);
  if (falle) out.push({ art: 'falle', id: falle.id, text: falle.text });
  const spaet = eins(spaeter, zufall);
  if (spaet) out.push({ art: 'schritt', id: spaet.id, text: spaet.text });
  for (const f of mische(fallen, zufall)) { if (out.length >= 3) break; if (!out.some((o) => o.id === f.id)) out.push({ art: 'falle', id: f.id, text: f.text }); }
  return mische(out, zufall);
}

export interface Rueckmeldung {
  richtig: boolean;
  kritisch: boolean;
  titel: string;
  text: string;
  folge?: string;
}

/** Eine Möglichkeit wählen. Richtig: weiter. Falsch: Fehler und Folge, die Stelle bleibt offen. */
export function waehle(a: Ablauf, s: Stand, o: Option): { stand: Stand; rueckmeldung: Rueckmeldung } {
  const position = s.erledigt.length;
  if (o.art === 'schritt') {
    const schritt = a.schritte.find((x) => x.id === o.id);
    if (!schritt) throw new Error(`Unbekannter Schritt ${o.id}`);
    if (erlaubt(a, s.erledigt).includes(schritt)) {
      return { stand: { ...s, erledigt: [...s.erledigt, schritt.id] }, rueckmeldung: { richtig: true, kritisch: !!schritt.kritisch, titel: 'Richtig', text: schritt.warum } };
    }
    const dran = erlaubt(a, s.erledigt)[0]!;
    return {
      stand: { ...s, fehlgriffe: [...s.fehlgriffe, { position, id: schritt.id, art: 'reihenfolge', kritisch: !!dran.kritisch }] },
      rueckmeldung: { richtig: false, kritisch: !!dran.kritisch, titel: 'Noch nicht dran', text: `Dieser Schritt kommt später. Vorher fehlt noch etwas${dran.kritisch ? ', und zwar etwas Sicherheitsrelevantes' : ''}.` },
    };
  }
  const falle: Falle | undefined = a.fallen.find((f) => f.id === o.id);
  if (!falle) throw new Error(`Unbekannte Falle ${o.id}`);
  return {
    stand: { ...s, fehlgriffe: [...s.fehlgriffe, { position, id: falle.id, art: 'falle', kritisch: !!falle.kritisch }] },
    rueckmeldung: { richtig: false, kritisch: !!falle.kritisch, titel: falle.kritisch ? 'Kritischer Fehler' : 'Fehler', text: falle.fehler, folge: falle.folge },
  };
}

export interface Auswertung {
  punkte: number;
  max: number;
  prozent: number;
  kritisch: number;
  /** Je Fehlgriff: an welcher Stelle, was gewählt wurde und was richtig gewesen wäre. */
  liste: Array<{ position: number; gewaehlt: string; richtig: string; erklaerung: string; folge?: string; kritisch: boolean }>;
}

export function auswerten(a: Ablauf, s: Stand): Auswertung {
  const max = a.schritte.length;
  const positionen = new Set(s.fehlgriffe.map((f) => f.position));
  const punkte = max - positionen.size;
  const liste = s.fehlgriffe.map((f) => {
    const richtig = a.schritte.find((x) => x.id === s.erledigt[f.position]) ?? a.schritte[f.position]!;
    if (f.art === 'falle') {
      const falle = a.fallen.find((x) => x.id === f.id)!;
      return { position: f.position, gewaehlt: falle.text, richtig: richtig.text, erklaerung: falle.fehler, folge: falle.folge, kritisch: f.kritisch };
    }
    const gewaehlt = a.schritte.find((x) => x.id === f.id)!;
    return { position: f.position, gewaehlt: gewaehlt.text, richtig: richtig.text, erklaerung: richtig.warum, kritisch: f.kritisch };
  });
  return { punkte, max, prozent: Math.round((punkte / max) * 100), kritisch: s.fehlgriffe.filter((f) => f.kritisch).length, liste };
}

// ---------------------------------------------------------------- Fehler finden

export type FehlerArt = 'falle' | 'tausch';
export interface Zeile { key: string; text: string; fehler?: { art: FehlerArt; erklaerung: string; folge?: string; kritisch: boolean } }
export interface FehlerVersion {
  zeilen: Zeile[];
  /** Weggelassener Pflichtschritt, falls einer fehlt. */
  fehlt?: Schritt;
  /** Auswahl für „Was fehlt?“: Kandidaten (Pflichtschritte), „nichts fehlt“ ist immer dabei. */
  fehltOptionen: Array<{ id: string; text: string }>;
  /** Anzahl eingebauter Fehler (Tausch zählt einmal). */
  anzahl: number;
}

export const NICHTS_FEHLT = 'nichts';

/** Ablauf mit eingebauten Fehlern: immer eine Falle und ein Tausch, oft zusätzlich ein fehlender Pflichtschritt. */
export function fehlerVersion(a: Ablauf, zufall: Zufall): FehlerVersion {
  let schritte = [...a.schritte];
  // Pflichtschritt weglassen (nicht den ersten, sonst ist es zu offensichtlich)
  let fehlt: Schritt | undefined;
  if (zufall() < 0.6) {
    fehlt = eins(schritte.filter((s, i) => s.kritisch && i > 0), zufall);
    if (fehlt) schritte = schritte.filter((s) => s !== fehlt);
  }
  const zeilen: Zeile[] = schritte.map((s) => ({ key: s.id, text: s.text }));
  // Tausch: zwei benachbarte Schritte aus verschiedenen Gruppen
  const tauschbar = zeilen.map((_, i) => i).filter((i) => i + 1 < zeilen.length && (!schritte[i]!.gruppe || schritte[i]!.gruppe !== schritte[i + 1]!.gruppe));
  const t = eins(tauschbar, zufall);
  if (t !== undefined) {
    const x = schritte[t]!, y = schritte[t + 1]!;
    const kritisch = !!(x.kritisch || y.kritisch);
    const erklaerung = `Vertauscht: „${y.text}“ gehört nach „${x.text}“. ${x.warum}`;
    zeilen[t] = { key: y.id, text: y.text, fehler: { art: 'tausch', erklaerung, kritisch } };
    zeilen[t + 1] = { key: x.id, text: x.text, fehler: { art: 'tausch', erklaerung, kritisch } };
  }
  // Falle einschieben, nicht direkt in den Tausch hinein
  const falle = eins(a.fallen, zufall)!;
  const stellen = zeilen.map((_, i) => i + 1).filter((i) => t === undefined || i !== t + 1);
  const pos = eins(stellen, zufall) ?? zeilen.length;
  zeilen.splice(pos, 0, { key: `falle:${falle.id}`, text: falle.text, fehler: { art: 'falle', erklaerung: falle.fehler, folge: falle.folge, kritisch: !!falle.kritisch } });

  const kandidaten = a.schritte.filter((s) => s.kritisch && s !== fehlt);
  const andere = mische(kandidaten, zufall).slice(0, 2);
  const fehltOptionen = mische([...(fehlt ? [fehlt] : []), ...andere], zufall).map((s) => ({ id: s.id, text: s.text }));
  fehltOptionen.push({ id: NICHTS_FEHLT, text: 'Es fehlt kein Pflichtschritt.' });
  return { zeilen, ...(fehlt ? { fehlt } : {}), fehltOptionen, anzahl: 1 + (t !== undefined ? 1 : 0) + (fehlt ? 1 : 0) };
}

export interface SuchErgebnis { punkte: number; max: number; prozent: number; gefunden: number; uebersehen: number; falschMarkiert: string[]; fehltRichtig: boolean }

/** Gefundene Fehler minus falsche Markierungen (nicht unter 0). Ein Tausch gilt als gefunden, wenn eine der beiden Zeilen markiert ist. */
export function bewerteSuche(v: FehlerVersion, markiert: ReadonlySet<string>, fehltAntwort: string): SuchErgebnis {
  const fehlerZeilen = v.zeilen.filter((z) => z.fehler);
  const falle = fehlerZeilen.filter((z) => z.fehler!.art === 'falle');
  const tausch = fehlerZeilen.filter((z) => z.fehler!.art === 'tausch');
  let gefunden = falle.filter((z) => markiert.has(z.key)).length;
  const tauschDa = tausch.length > 0;
  if (tauschDa && tausch.some((z) => markiert.has(z.key))) gefunden++;
  const fehltRichtig = fehltAntwort === (v.fehlt?.id ?? NICHTS_FEHLT);
  const falschMarkiert = v.zeilen.filter((z) => !z.fehler && markiert.has(z.key)).map((z) => z.key);
  const max = falle.length + (tauschDa ? 1 : 0) + 1;
  const punkte = Math.max(0, gefunden + (fehltRichtig ? 1 : 0) - falschMarkiert.length);
  const uebersehen = falle.length + (tauschDa ? 1 : 0) - gefunden + (v.fehlt && !fehltRichtig ? 1 : 0);
  return { punkte, max, prozent: Math.round((punkte / max) * 100), gefunden, uebersehen, falschMarkiert, fehltRichtig };
}
