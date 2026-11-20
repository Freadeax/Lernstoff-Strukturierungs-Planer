// Prüfbogen ausfüllen, auf dem Gerät speichern und als Freigabe-Code weitergeben (Audit F-1).
// Ablauf: Prüferin füllt den Bogen aus (oder druckt ihn und füllt ihn auf Papier aus) → Ergebnis wird
// als Code kopiert → im Projekt-Chat eingefügt → Claude übernimmt es nach ERTEILT in
// src/ui/sim/freigabe-erteilt.ts. Erst dann zeigt die App den Inhalt überall als geprüft.

import { istObjekt, storage } from '../../ui/lib/store';
import type { PruefArt } from '../../ui/sim/freigabe';
import type { Erteilung, Urteil } from '../../ui/sim/freigabe-erteilt';

export type PunktErgebnis = 'passt' | 'aendern' | 'unklar';
export const PUNKT_TEXT: Record<PunktErgebnis, string> = { passt: 'Passt', aendern: 'Ändern', unklar: 'Unklar' };

/** Allgemeine Punkte, die jeder Bogen zusätzlich zu den Prüfpunkten des Inhalts enthält. */
export const ALLGEMEINE_PUNKTE = [
  'Fachlich richtig nach den genannten Quellen und dem Stand des Unterrichts',
  'Passt zum Ausbildungsstand der angegebenen Stufe',
  'Befugnisse und Grenzen von Auszubildenden sind richtig dargestellt',
  'Sprache verständlich, keine missverständlichen Handlungsanweisungen',
];

export interface Pruefbogen {
  id: string;
  fp: string;
  art: PruefArt;
  rolle: string;
  name?: string;
  datum: string;
  urteil: Urteil;
  /** Ergebnis je Prüfpunkt, Schlüssel = Text des Punkts. */
  punkte: Record<string, PunktErgebnis>;
  notizen: Record<string, string>;
  bemerkung?: string;
}

export const ROLLEN: Array<{ rolle: string; art: PruefArt }> = [
  { rolle: 'Lehrkraft Pflegeschule', art: 'fachperson' },
  { rolle: 'Praxisanleitung', art: 'fachperson' },
  { rolle: 'Pflegefachperson', art: 'fachperson' },
  { rolle: 'Ärztin/Arzt (Medikamente, Notfall)', art: 'fachperson' },
  { rolle: 'Auszubildende/r: Abgleich mit Unterrichtsmaterial', art: 'lehrmaterial' },
];

const URTEILE: Urteil[] = ['freigegeben', 'mit-aenderungen', 'nicht-freigegeben'];
const ARTEN: PruefArt[] = ['fachperson', 'lehrmaterial'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function istBogen(v: unknown): v is Pruefbogen {
  return istObjekt(v) && typeof v.id === 'string' && typeof v.fp === 'string' && typeof v.rolle === 'string'
    && typeof v.datum === 'string' && ISO.test(v.datum) && ARTEN.includes(v.art as PruefArt) && URTEILE.includes(v.urteil as Urteil)
    && istObjekt(v.punkte) && istObjekt(v.notizen);
}

const K_BOEGEN = 'lernstoff.freigabe.boegen';
export const ladeBoegen = (): Pruefbogen[] => storage.list<Pruefbogen>(K_BOEGEN, istBogen);

/** Speichert einen Bogen; pro Inhalt bleibt der neueste. */
export function speichereBogen(b: Pruefbogen): Pruefbogen[] {
  const liste = [b, ...ladeBoegen().filter((x) => x.id !== b.id)];
  storage.write(K_BOEGEN, liste);
  return liste;
}
export function entferneBogen(id: string): Pruefbogen[] {
  const liste = ladeBoegen().filter((x) => x.id !== id);
  storage.write(K_BOEGEN, liste);
  return liste;
}

/** Bogen als Eintrag für ERTEILT (ohne Einzelpunkte; die stehen in der Bemerkung, wenn etwas zu ändern ist). */
export function alsErteilung(b: Pruefbogen): Erteilung {
  const offen = Object.entries(b.punkte).filter(([, e]) => e !== 'passt').map(([p, e]) => `${PUNKT_TEXT[e]}: ${p}${b.notizen[p] ? ` (${b.notizen[p]})` : ''}`);
  const bemerkung = [b.bemerkung?.trim(), ...offen].filter(Boolean).join(' · ') || undefined;
  return { id: b.id, fp: b.fp, art: b.art, urteil: b.urteil, datum: b.datum, rolle: b.rolle, ...(b.name ? { name: b.name } : {}), ...(bemerkung ? { bemerkung } : {}) };
}

// ---------- Freigabe-Code ----------

const PRAEFIX = 'FREIGABE1:';

function b64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s);
}
function ausB64(code: string): string {
  const s = atob(code);
  return new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0)));
}

/** Code zum Weitergeben: kurz genug für einen Chat, lesbar über `leseCode`. */
export function freigabeCode(boegen: readonly Pruefbogen[]): string {
  return PRAEFIX + b64(JSON.stringify({ v: 1, boegen }));
}

/** Liest einen Freigabe-Code; ungültige Bögen fallen weg. Gibt null zurück, wenn der Code nicht lesbar ist. */
export function leseCode(text: string): Pruefbogen[] | null {
  const roh = text.trim().replace(/\s+/g, '');
  const i = roh.indexOf(PRAEFIX);
  if (i < 0) return null;
  try {
    const daten: unknown = JSON.parse(ausB64(roh.slice(i + PRAEFIX.length)));
    if (!istObjekt(daten) || daten.v !== 1 || !Array.isArray(daten.boegen)) return null;
    return daten.boegen.filter(istBogen);
  } catch { return null; }
}

/** Übernimmt Bögen aus einem Code; neuere Bögen ersetzen ältere desselben Inhalts. */
export function uebernimmBoegen(neu: readonly Pruefbogen[]): Pruefbogen[] {
  let liste = ladeBoegen();
  for (const b of neu) {
    const alt = liste.find((x) => x.id === b.id);
    if (!alt || alt.datum <= b.datum) liste = [b, ...liste.filter((x) => x.id !== b.id)];
  }
  storage.write(K_BOEGEN, liste);
  return liste;
}

/** Fertiger Eintrag für src/ui/sim/freigabe-erteilt.ts (Claude fügt ihn ein). */
export const erteilungsQuelltext = (boegen: readonly Pruefbogen[]) => boegen.map((b) => `  ${JSON.stringify(alsErteilung(b))},`).join('\n');
