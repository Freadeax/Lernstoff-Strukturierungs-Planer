// Ausbildungsnachweis-Helfer je Einsatz: Tätigkeiten mit Stufe, Anleitungsgespräche (Erst-, Zwischen-,
// Abschlussgespräch) und Abzeichnen auf dem Gerät. Rein. Der offizielle Ausbildungsnachweis (§ 3 Abs. 5 PflAPrV)
// kommt von Schule und Träger; diese Hilfe bereitet ihn vor und ersetzt ihn nicht.

import type { Einsatz } from './einsatz';
import type { Tagebuch } from './tagebuch';

export type Stufe = 'gesehen' | 'angeleitet' | 'selbststaendig';
export const STUFEN: Array<{ id: Stufe; label: string; kurz: string }> = [
  { id: 'gesehen', label: 'Gesehen', kurz: 'G' },
  { id: 'angeleitet', label: 'Unter Anleitung', kurz: 'A' },
  { id: 'selbststaendig', label: 'Selbstständig', kurz: 'S' },
];
const RANG: Record<Stufe, number> = { gesehen: 1, angeleitet: 2, selbststaendig: 3 };
export const STUFE_LABEL = Object.fromEntries(STUFEN.map((s) => [s.id, s.label])) as Record<Stufe, string>;

export interface Taetigkeit { id: string; label: string }
export interface TaetigkeitsGruppe { id: string; titel: string; taetigkeiten: Taetigkeit[] }

/**
 * Allgemeine Tätigkeitsliste, angelehnt an typische Ausbildungsnachweise der generalistischen Ausbildung.
 * Keine Vorgabe: Schulen und Träger haben eigene Kataloge. Eigene Tätigkeiten lassen sich je Einsatz ergänzen.
 */
export const KATALOG: TaetigkeitsGruppe[] = [
  { id: 'beob', titel: 'Beobachten und einschätzen', taetigkeiten: [
    { id: 'vital', label: 'Vitalzeichen messen und bewerten (Puls, RR, Atmung, Temperatur, SpO2)' },
    { id: 'bz', label: 'Blutzucker messen und bewerten' },
    { id: 'schmerz', label: 'Schmerz einschätzen (Skala, Verlauf)' },
    { id: 'bewusstsein', label: 'Bewusstsein und Orientierung einschätzen' },
    { id: 'assessment', label: 'Risiko einschätzen (Sturz, Dekubitus, Ernährung)' },
    { id: 'news', label: 'Verschlechterung erkennen (z. B. NEWS2) und melden' },
  ] },
  { id: 'pflege', titel: 'Körperpflege, Bewegung, Ernährung, Ausscheidung', taetigkeiten: [
    { id: 'koerperpflege', label: 'Ganz- oder Teilkörperpflege, aktivierend' },
    { id: 'mundpflege', label: 'Spezielle Mundpflege' },
    { id: 'mobilisation', label: 'Mobilisation, Transfer, rückenschonend und kinästhetisch' },
    { id: 'lagerung', label: 'Positionierung (Lagerung) mit Hilfsmitteln' },
    { id: 'essen', label: 'Unterstützung beim Essen und Trinken, Ein- und Ausfuhr' },
    { id: 'sonde', label: 'Sondenernährung verabreichen' },
    { id: 'ausscheidung', label: 'Unterstützung bei der Ausscheidung, Inkontinenzversorgung' },
    { id: 'katheter', label: 'Transurethralen Katheter legen oder versorgen' },
  ] },
  { id: 'prophylaxe', titel: 'Prophylaxen', taetigkeiten: [
    { id: 'dekubitus', label: 'Dekubitusprophylaxe planen und durchführen' },
    { id: 'sturz', label: 'Sturzprophylaxe' },
    { id: 'thrombose', label: 'Thromboseprophylaxe (z. B. MTS anziehen)' },
    { id: 'pneumonie', label: 'Pneumonieprophylaxe, Atemübungen' },
    { id: 'kontraktur', label: 'Kontrakturenprophylaxe' },
  ] },
  { id: 'medizin', titel: 'Medikamente und ärztlich veranlasste Maßnahmen', taetigkeiten: [
    { id: 'medis', label: 'Medikamente richten und verabreichen (6-R-Regel)' },
    { id: 'sc', label: 's.c.-Injektion (z. B. Heparin, Insulin)' },
    { id: 'im', label: 'i.m.-Injektion' },
    { id: 'infusion', label: 'Infusion vorbereiten, anhängen, überwachen' },
    { id: 'blutentnahme', label: 'Blutentnahme vorbereiten oder durchführen' },
    { id: 'wunde', label: 'Verbandwechsel aseptisch' },
    { id: 'periop', label: 'Patientin oder Patient für OP oder Untersuchung vorbereiten' },
  ] },
  { id: 'hygiene', titel: 'Hygiene und Sicherheit', taetigkeiten: [
    { id: 'haende', label: 'Händedesinfektion nach den 5 Momenten' },
    { id: 'isolation', label: 'Schutzkleidung bei Isolation an- und ablegen' },
    { id: 'notfall', label: 'Notfall: Hilfe holen, Basismaßnahmen, Notfallwagen kennen' },
  ] },
  { id: 'prozess', titel: 'Pflegeprozess und Dokumentation', taetigkeiten: [
    { id: 'anamnese', label: 'Pflegeanamnese oder SIS erheben' },
    { id: 'planung', label: 'Pflegeplanung erstellen oder anpassen' },
    { id: 'bericht', label: 'Pflegebericht schreiben' },
    { id: 'uebergabe', label: 'Übergabe geben (z. B. SBAR)' },
    { id: 'aufnahme', label: 'Aufnahme oder Entlassung begleiten' },
  ] },
  { id: 'kommunikation', titel: 'Kommunikation und Beratung', taetigkeiten: [
    { id: 'gespraech', label: 'Gespräch mit zu Pflegenden oder Angehörigen führen' },
    { id: 'beratung', label: 'Anleiten oder beraten (z. B. Insulin-Pen, Mobilität)' },
    { id: 'team', label: 'An Visite oder Teambesprechung teilnehmen' },
  ] },
];

const KATALOG_IDS = new Set(KATALOG.flatMap((g) => g.taetigkeiten.map((t) => t.id)));

export interface Vermerk { taetigkeit: string; stufe: Stufe; datum: string }
export interface Unterschrift { name: string; datum: string; /** PNG als data-URL, gezeichnet auf dem Gerät. */ bild?: string }

export type GespraechArt = 'erst' | 'zwischen' | 'abschluss';
export const GESPRAECHE: Array<{ id: GespraechArt; titel: string; wann: string }> = [
  { id: 'erst', titel: 'Erstgespräch', wann: 'in der ersten Woche' },
  { id: 'zwischen', titel: 'Zwischengespräch', wann: 'zur Mitte des Einsatzes' },
  { id: 'abschluss', titel: 'Abschlussgespräch', wann: 'in der letzten Woche' },
];

export interface Gespraech {
  art: GespraechArt;
  datum: string;
  ziele: string;
  gut: string;
  unterstuetzung: string;
  fragen: string;
  vereinbarungen: string;
  unterschrift?: Unterschrift;
}

export interface EinsatzNachweis {
  /** Ein Vermerk je Tätigkeit: die höchste erreichte Stufe mit Datum. */
  vermerke: Vermerk[];
  /** Eigene Tätigkeiten (id `eigen:<n>`). */
  eigene: Taetigkeit[];
  gespraeche: Gespraech[];
  /** Bestätigung der Tätigkeitsliste durch die Praxisanleitung. */
  bestaetigung?: Unterschrift;
}

export interface Nachweis { v: 1; einsaetze: Record<string, EinsatzNachweis> }
export const LEER_NACHWEIS: Nachweis = { v: 1, einsaetze: {} };
export const leererEinsatzNachweis = (): EinsatzNachweis => ({ vermerke: [], eigene: [], gespraeche: [] });

/** Höchstgröße einer gezeichneten Unterschrift (data-URL). */
export const MAX_BILD = 80_000;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const text = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.length <= max;
const istStufe = (v: unknown): v is Stufe => v === 'gesehen' || v === 'angeleitet' || v === 'selbststaendig';

export function istUnterschrift(v: unknown): v is Unterschrift {
  if (typeof v !== 'object' || v === null) return false;
  const u = v as Record<string, unknown>;
  return text(u.name, 120) && !!u.name.trim() && text(u.datum, 10) && DATUM.test(u.datum)
    && (u.bild === undefined || (text(u.bild, MAX_BILD) && u.bild.startsWith('data:image/png;base64,')));
}

function pruefeEinsatzNachweis(v: unknown): EinsatzNachweis | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const n = v as Record<string, unknown>;
  const eigene = Array.isArray(n.eigene) ? n.eigene.filter((t): t is Taetigkeit => typeof t === 'object' && t !== null && text((t as Taetigkeit).id, 40) && (t as Taetigkeit).id.startsWith('eigen:') && text((t as Taetigkeit).label, 200)).slice(0, 50) : [];
  const bekannt = new Set([...KATALOG_IDS, ...eigene.map((t) => t.id)]);
  const vermerke = Array.isArray(n.vermerke) ? n.vermerke.filter((x): x is Vermerk => typeof x === 'object' && x !== null && bekannt.has((x as Vermerk).taetigkeit) && istStufe((x as Vermerk).stufe) && text((x as Vermerk).datum, 10) && DATUM.test((x as Vermerk).datum)) : [];
  const gespraeche = Array.isArray(n.gespraeche) ? n.gespraeche.filter((g): g is Gespraech => {
    if (typeof g !== 'object' || g === null) return false;
    const x = g as Record<string, unknown>;
    return GESPRAECHE.some((a) => a.id === x.art) && text(x.datum, 10) && (x.datum === '' || DATUM.test(x.datum))
      && ['ziele', 'gut', 'unterstuetzung', 'fragen', 'vereinbarungen'].every((k) => text(x[k]))
      && (x.unterschrift === undefined || istUnterschrift(x.unterschrift));
  }).slice(0, 3) : [];
  return { vermerke, eigene, gespraeche, ...(istUnterschrift(n.bestaetigung) ? { bestaetigung: n.bestaetigung } : {}) };
}

export function pruefeNachweis(v: unknown): Nachweis {
  if (typeof v !== 'object' || v === null) return LEER_NACHWEIS;
  const e = (v as Record<string, unknown>).einsaetze;
  if (typeof e !== 'object' || e === null) return LEER_NACHWEIS;
  const out: Record<string, EinsatzNachweis> = {};
  for (const [id, n] of Object.entries(e).slice(0, 40)) { const p = pruefeEinsatzNachweis(n); if (p && text(id, 80)) out[id] = p; }
  return { v: 1, einsaetze: out };
}

/**
 * Stufe setzen. Eine niedrigere Stufe ersetzt eine höhere nicht (einmal selbstständig bleibt selbstständig),
 * außer `korrigieren` ist gesetzt. `null` entfernt den Vermerk.
 */
export function setzeStufe(n: EinsatzNachweis, taetigkeit: string, stufe: Stufe | null, datum: string, korrigieren = false): EinsatzNachweis {
  const alt = n.vermerke.find((v) => v.taetigkeit === taetigkeit);
  const rest = n.vermerke.filter((v) => v.taetigkeit !== taetigkeit);
  if (stufe === null) return { ...n, vermerke: rest };
  if (alt && !korrigieren && RANG[alt.stufe] >= RANG[stufe]) return n;
  // Neue Vermerke nach einer Bestätigung machen die Bestätigung ungültig: sie galt für den alten Stand.
  const { bestaetigung: _, ...ohne } = n;
  return { ...ohne, vermerke: [...rest, { taetigkeit, stufe, datum }] };
}

export function eigeneTaetigkeit(n: EinsatzNachweis, label: string): EinsatzNachweis {
  const l = label.trim().slice(0, 200);
  if (!l || n.eigene.length >= 50) return n;
  const nr = Math.max(0, ...n.eigene.map((t) => Number(t.id.slice(6)) || 0)) + 1;
  return { ...n, eigene: [...n.eigene, { id: `eigen:${nr}`, label: l }] };
}

export function setzeGespraech(n: EinsatzNachweis, g: Gespraech): EinsatzNachweis {
  return { ...n, gespraeche: [...n.gespraeche.filter((x) => x.art !== g.art), g].sort((a, b) => GESPRAECHE.findIndex((x) => x.id === a.art) - GESPRAECHE.findIndex((x) => x.id === b.art)) };
}

export function zaehle(n: EinsatzNachweis): Record<Stufe, number> & { gesamt: number } {
  const out = { gesehen: 0, angeleitet: 0, selbststaendig: 0, gesamt: KATALOG_IDS.size + n.eigene.length };
  for (const v of n.vermerke) out[v.stufe]++;
  return out;
}

/** Wann welches Gespräch ansteht, aus dem Einsatzzeitraum (Mitte bzw. letzte Woche). */
export function gespraechTermin(e: Pick<Einsatz, 'von' | 'bis'>, art: GespraechArt): string {
  const von = Date.parse(`${e.von}T12:00:00Z`), bis = Date.parse(`${e.bis}T12:00:00Z`);
  const t = art === 'erst' ? von + 3 * 86_400_000 : art === 'zwischen' ? von + Math.floor((bis - von) / 172_800_000) * 86_400_000 : bis - 4 * 86_400_000;
  return new Date(Math.min(bis, Math.max(von, t))).toISOString().slice(0, 10);
}

/** Vorschläge für die Gesprächsvorbereitung aus Lernzielen, offenen Fragen im Tagebuch und dem Tätigkeitsstand. */
export function vorbereitung(e: Einsatz, n: EinsatzNachweis, t: Tagebuch, art: GespraechArt): Pick<Gespraech, 'ziele' | 'gut' | 'unterstuetzung' | 'fragen'> {
  const name = new Map([...KATALOG.flatMap((g) => g.taetigkeiten), ...n.eigene].map((x) => [x.id, x.label]));
  const selbst = n.vermerke.filter((v) => v.stufe === 'selbststaendig').map((v) => name.get(v.taetigkeit)).filter(Boolean);
  const angeleitet = n.vermerke.filter((v) => v.stufe !== 'selbststaendig').map((v) => name.get(v.taetigkeit)).filter(Boolean);
  const fragen = t.notizen.filter((x) => x.art === 'frage' && !x.erledigt && (!x.einsatzId || x.einsatzId === e.id)).map((x) => x.text);
  const liste = (xs: Array<string | undefined>) => xs.slice(0, 8).map((x) => `- ${x}`).join('\n');
  return {
    ziele: e.ziele.length ? liste(e.ziele) : '',
    gut: art === 'erst' ? '' : liste(selbst),
    unterstuetzung: art === 'erst' ? '' : liste(angeleitet),
    fragen: liste(fragen),
  };
}
