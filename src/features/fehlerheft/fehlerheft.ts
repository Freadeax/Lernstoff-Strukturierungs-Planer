// Fehlerheft: falsch beantwortete Aufgaben aus Rechentrainer, Fachbegriff-Duell,
// Prüfungssimulation, Krankheitsbild-Fällen, Assessment-Fallvignetten, Übungstrainern und Entscheidungsmomenten des Praxissimulators an einer Stelle sammeln und gezielt wiederholen.
// Oben reine Funktionen (testbar), unten das Speichern (localStorage, wird mitgesichert).
//
// Regeln:
// - Gleiche Aufgabe = gleicher Eintrag. Beim Rechnen ist das der Aufgabentyp mit Stufe, denn
//   die Zahlen sind jedes Mal neu: Wiederholt wird eine „Zwillingsaufgabe“ mit neuen Werten.
// - „Behoben“ wie im Lernplan: zwei richtige Wiederholungen an verschiedenen Tagen nach dem
//   letzten Fehler. Ein neuer Fehler setzt den Eintrag zurück (Rückfall).
// - Das Fehlerheft zählt nicht als Abfrage im Lernplan: es fragt nur Schwächen ab und würde
//   den Wissensstand sonst verzerren.
// - Verteiltes Wiederholen (Vorbild Anki/Leitner): Nach einem Fehler ist der Eintrag am nächsten Tag dran,
//   jede richtige Wiederholung schiebt ihn in eine längere Stufe (INTERVALLE). Auch behobene Einträge kommen
//   in wachsenden Abständen zum Auffrischen wieder, bis sie nach der letzten Stufe als gefestigt gelten.
// - Hartnäckige Fehler (Anki: „Leech“): ab HARTNAECKIG_AB Fehlern hilft bloßes Wiederholen wenig. Die
//   Oberfläche schlägt dann Nachlesen im Skript oder eine eigene Karteikarte vor.

import type { ID } from '../../core/types';
import type { AufgabenTyp, Stufe } from '../rechnen/aufgaben';
import { istObjekt, storage } from '../../ui/lib/store';

export type FehlerQuelle = 'rechnen' | 'duell' | 'simulation' | 'krankheitsbilder' | 'assessment' | 'hygiene' | 'anatomie' | 'expertenstandards' | 'normwerte' | 'notfall' | 'arzneimittel' | 'praxis' | 'recht' | 'labor' | 'diagnostik' | 'grundlagen';

export const QUELLE_LABEL: Record<FehlerQuelle, string> = {
  rechnen: 'Rechentrainer', duell: 'Fachbegriff-Duell', simulation: 'Prüfungssimulation', krankheitsbilder: 'Krankheitsbilder', assessment: 'Assessments',
  hygiene: 'Hygiene-Trainer', anatomie: 'Anatomie-Trainer', expertenstandards: 'Expertenstandards', normwerte: 'Normwerte',
  notfall: 'Notfall-Trainer', arzneimittel: 'Arzneimittel-Trainer', praxis: 'Praxissimulator', recht: 'Recht-Trainer', labor: 'Labor-Trainer', diagnostik: 'Diagnostik-Fälle', grundlagen: 'Grundlagen-Trainer',
};

/** Wie ein Eintrag wiederholt wird. */
export type Wiederholung =
  | { art: 'rechnen'; typ: AufgabenTyp; stufe: Stufe }
  | { art: 'auswahl'; optionen: string[]; richtig: number[]; mehrfach: boolean };

export interface Fehler {
  id: string;
  quelle: FehlerQuelle;
  topicIds: ID[];
  titel: string;               // kurze Einordnung, z. B. „Dosis nach Gewicht · Station“
  frage: string;               // das letzte falsch beantwortete Beispiel
  deineAntwort: string;
  loesung: string;
  erklaerung: string[];        // Lösungsweg oder Begründung
  wiederholung: Wiederholung;
  erfasst: string;             // Tag des ersten Fehlers (JJJJ-MM-TT)
  letzterFehler: string;       // Tag des letzten Fehlers
  fehlerAnzahl: number;
  treffer: string[];           // Tage mit richtiger Wiederholung seit dem letzten Fehler
  behoben?: string;            // Tag, an dem der Eintrag als behoben gilt
  aktualisiert: string;        // ISO-Zeit, für das Zusammenführen von Sicherungen
  /** Kriterium oder Aufgabenart, z. B. „Präanalytik“ oder „Kritische Meldung“ (Etikett und Filter). */
  kriterium?: string;
  /** Fall, aus dem der Fehler stammt (Praxis-, Diagnostik- oder Krankheitsbild-Fall). */
  fallId?: string;
  /** Quelle oder Stand der Lösung als Text, z. B. „KRINKO 2016“ oder „Katalogwissen, ergänzend“. */
  beleg?: string;
  /** Zuletzt gezählte Versuche (Kennungen), damit Reload, Doppelklick oder erneutes Öffnen nicht doppelt zählen. */
  versuche?: string[];
  /** Stufe im Wiederholungsplan (0 = gerade falsch). Fehlt bei alten Einträgen, dann gilt die alte Tagesregel. */
  stufe?: number;
  /** Tag, ab dem der Eintrag wieder dran ist (JJJJ-MM-TT). Fehlt bei gefestigten Einträgen. */
  faelligAm?: string;
  /** Richtige Auffrischungen nach „behoben“. */
  auffrischungen?: number;
  /** Selbsteinschätzung beim letzten Eintrag: richtig geraten oder sicher, aber falsch. */
  sicherheit?: Sicherheit;
}

/**
 * Selbsteinschätzung vor dem Prüfen (Vorbild: Certainty-Based Marking in Moodle).
 * „geraten“ = richtig, aber unsicher → kommt zum Festigen ins Fehlerheft.
 * „sicherer-irrtum“ = falsch, obwohl sicher → besonders lohnend zu wiederholen (Hyperkorrektur-Effekt).
 */
export type Sicherheit = 'geraten' | 'sicherer-irrtum';
export const SICHERHEIT_LABEL: Record<Sicherheit, string> = { geraten: 'Geraten', 'sicherer-irrtum': 'Sicherer Irrtum' };

/** Was ein Trainer beim Fehler meldet. Zähler und Daten setzt das Fehlerheft selbst. */
export type NeuerFehler = Pick<Fehler, 'id' | 'quelle' | 'topicIds' | 'titel' | 'frage' | 'deineAntwort' | 'loesung' | 'erklaerung' | 'wiederholung' | 'kriterium' | 'fallId' | 'beleg' | 'sicherheit'> & {
  /** Kennung des Übungsversuchs (dieselbe wie im Lernplan). Ein Versuch zählt je Eintrag höchstens einmal. */
  versuchId?: string;
};

/** So viele Versuchskennungen merkt sich ein Eintrag. */
export const MAX_VERSUCHE = 20;

export const BEHOBEN_NACH = 2;
/**
 * Abstand in Tagen nach jeder richtigen Wiederholung, Stufe für Stufe. Stufe 0 (gerade falsch) → morgen.
 * Nach BEHOBEN_NACH Treffern ist der Fehler behoben; die weiteren Stufen sind Auffrischungen.
 * Nach der letzten Stufe gilt ein Eintrag als gefestigt und kommt nicht mehr von selbst.
 */
export const INTERVALLE = [1, 3, 7, 14, 30, 60] as const;
/** Ab so vielen Fehlern gilt ein Eintrag als hartnäckig. */
export const HARTNAECKIG_AB = 4;

/** Tag plus n Tage (JJJJ-MM-TT, lokale Zeit). */
export function plusTage(t: string, n: number): string {
  const [j, m, d] = t.split('-').map(Number) as [number, number, number];
  return tag(new Date(j, m - 1, d + n, 12));
}

/** Wann ist der Eintrag in Stufe `stufe` ab Tag `t` wieder dran? undefined = gefestigt. */
export function naechsterTermin(t: string, stufe: number): string | undefined {
  if (stufe <= 0) return plusTage(t, INTERVALLE[0]);
  return stufe < INTERVALLE.length ? plusTage(t, INTERVALLE[stufe]!) : undefined;
}
/** Obergrenze, damit localStorage klein bleibt. Behobene Einträge fallen zuerst weg. */
export const MAX_EINTRAEGE = 300;

const tag = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export { tag as heutigerTag };

/** Neue Fehler eintragen. Schon bekannte Aufgaben zählen hoch und verlieren den Status „behoben“. */
export function merke(liste: Fehler[], neue: NeuerFehler[], jetzt = new Date()): Fehler[] {
  const t = tag(jetzt);
  const iso = jetzt.toISOString();
  const map = new Map(liste.map((f) => [f.id, f]));
  // Dieselbe Aufgabe zweimal in einer Meldung (z. B. Doppelklick) zählt einmal
  const schon = new Set<string>();
  for (const { versuchId, ...n } of neue) {
    if (schon.has(n.id)) continue;
    schon.add(n.id);
    const alt = map.get(n.id);
    if (alt && versuchId && alt.versuche?.includes(versuchId)) continue;
    const versuche = versuchId ? [...(alt?.versuche ?? []), versuchId].slice(-MAX_VERSUCHE) : alt?.versuche;
    const plan = { stufe: 0, faelligAm: naechsterTermin(t, 0), auffrischungen: 0 };
    map.set(n.id, alt
      ? { ...alt, ...n, topicIds: [...new Set([...alt.topicIds, ...n.topicIds])], fehlerAnzahl: alt.fehlerAnzahl + 1, letzterFehler: t, treffer: [], behoben: undefined, aktualisiert: iso, ...plan, ...(versuche ? { versuche } : {}) }
      : { ...n, erfasst: t, letzterFehler: t, fehlerAnzahl: 1, treffer: [], aktualisiert: iso, ...plan, ...(versuche ? { versuche } : {}) });
  }
  return begrenze([...map.values()]);
}

function begrenze(liste: Fehler[]): Fehler[] {
  if (liste.length <= MAX_EINTRAEGE) return liste;
  // Behobene zuerst, dann die ältesten offenen
  const sortiert = [...liste].sort((a, b) => Number(!!b.behoben) - Number(!!a.behoben) || a.aktualisiert.localeCompare(b.aktualisiert));
  const weg = new Set(sortiert.slice(0, liste.length - MAX_EINTRAEGE).map((f) => f.id));
  return liste.filter((f) => !weg.has(f.id));
}

/**
 * Ergebnis einer Wiederholung eintragen. Falsch = wie ein neuer Fehler. Mit `versuchId` zählt derselbe
 * Wiederholungsversuch nur einmal (doppeltes Absenden, Reload).
 */
export function wiederholt(liste: Fehler[], id: string, richtig: boolean, eingabe: string, jetzt = new Date(), versuchId?: string): Fehler[] {
  const t = tag(jetzt);
  const iso = jetzt.toISOString();
  return liste.map((f) => {
    if (f.id !== id) return f;
    if (versuchId && f.versuche?.includes(versuchId)) return f;
    const versuche = versuchId ? { versuche: [...(f.versuche ?? []), versuchId].slice(-MAX_VERSUCHE) } : {};
    if (!richtig) {
      return { ...f, ...versuche, deineAntwort: eingabe, fehlerAnzahl: f.fehlerAnzahl + 1, letzterFehler: t, treffer: [], behoben: undefined, aktualisiert: iso, stufe: 0, faelligAm: naechsterTermin(t, 0), auffrischungen: 0 };
    }
    // Mehrmals am selben Tag richtig zählt einmal, sonst würde man an einem Tag durch alle Stufen springen
    if (f.treffer.includes(t) || (f.behoben && f.faelligAm === undefined && f.stufe !== undefined)) return { ...f, ...versuche, aktualisiert: iso };
    const treffer = [...f.treffer, t];
    const stufe = (f.stufe ?? Math.max(0, f.treffer.length)) + 1;
    const behoben = f.behoben ?? (treffer.length >= BEHOBEN_NACH ? t : undefined);
    return {
      ...f, ...versuche, treffer, behoben, aktualisiert: iso, stufe, faelligAm: naechsterTermin(t, stufe),
      auffrischungen: (f.auffrischungen ?? 0) + (f.behoben ? 1 : 0),
    };
  });
}

export const istOffen = (f: Fehler) => !f.behoben;
export const istHartnaeckig = (f: Fehler) => istOffen(f) && f.fehlerAnzahl >= HARTNAECKIG_AB;
/** Behoben und durch alle Stufen gegangen: kommt nicht mehr von selbst. */
export const istGefestigt = (f: Fehler) => !!f.behoben && f.stufe !== undefined && f.faelligAm === undefined;

/** Ist der Termin heute oder früher? Alte Einträge ohne Plan: offen = jeden Tag dran (bisherige Regel). */
function terminErreicht(f: Fehler, t: string): boolean {
  return f.faelligAm === undefined ? f.stufe === undefined && istOffen(f) : f.faelligAm <= t;
}

/**
 * Was heute zur Wiederholung dran ist: offene Einträge, deren Termin erreicht ist, die heute noch nicht
 * richtig waren und nicht erst heute falsch waren (sonst würde man die Lösung nur aus dem Kurzzeitgedächtnis
 * abrufen). `auchHeutige` nimmt die heutigen Fehler dazu („sofort üben“).
 * Reihenfolge: sichere Irrtümer und hartnäckige zuerst, dann häufige, dann die ältesten.
 */
export function faellig(liste: Fehler[], jetzt = new Date(), auchHeutige = false): Fehler[] {
  const t = tag(jetzt);
  const gewicht = (f: Fehler) => (f.sicherheit === 'sicherer-irrtum' ? 2 : 0) + (istHartnaeckig(f) ? 1 : 0);
  return liste
    .filter((f) => istOffen(f) && !f.treffer.includes(t) && (f.letzterFehler === t ? auchHeutige : terminErreicht(f, t)))
    .sort((a, b) => gewicht(b) - gewicht(a) || b.fehlerAnzahl - a.fehlerAnzahl || a.letzterFehler.localeCompare(b.letzterFehler));
}

/** Behobene Einträge, deren Auffrischung heute dran ist (längste Zeit überfällig zuerst). */
export function auffrischen(liste: Fehler[], jetzt = new Date()): Fehler[] {
  const t = tag(jetzt);
  return liste
    .filter((f) => !!f.behoben && f.faelligAm !== undefined && f.faelligAm <= t && !f.treffer.includes(t))
    .sort((a, b) => a.faelligAm!.localeCompare(b.faelligAm!));
}

/** Wie viele Einträge an den nächsten `tage` Tagen dran sind (heute eingeschlossen, Überfälliges zählt heute). */
export function vorschau(liste: Fehler[], jetzt = new Date(), tage = 7): Array<{ tag: string; offen: number; auffrischen: number }> {
  const heute = tag(jetzt);
  const out = Array.from({ length: tage }, (_, i) => ({ tag: plusTage(heute, i), offen: 0, auffrischen: 0 }));
  for (const f of liste) {
    if (istGefestigt(f)) continue;
    let termin = f.faelligAm ?? (istOffen(f) ? heute : undefined);
    if (!termin) continue;
    if (f.treffer.includes(heute) && termin <= heute) continue;
    if (termin < heute) termin = heute;
    const slot = out.find((x) => x.tag === termin);
    if (slot) { if (istOffen(f)) slot.offen++; else slot.auffrischen++; }
  }
  return out;
}

export interface Ueberblick {
  offen: number; faellig: number; heuteNeu: number; behoben: number; nachQuelle: Record<FehlerQuelle, number>;
  auffrischen: number; hartnaeckig: number; gefestigt: number;
}

export function ueberblick(liste: Fehler[], jetzt = new Date()): Ueberblick {
  const t = tag(jetzt);
  const offen = liste.filter(istOffen);
  const nachQuelle: Record<FehlerQuelle, number> = { rechnen: 0, duell: 0, simulation: 0, krankheitsbilder: 0, assessment: 0, hygiene: 0, anatomie: 0, expertenstandards: 0, normwerte: 0, notfall: 0, arzneimittel: 0, praxis: 0, recht: 0, labor: 0, diagnostik: 0, grundlagen: 0 };
  for (const f of offen) nachQuelle[f.quelle] = (nachQuelle[f.quelle] ?? 0) + 1;
  return {
    offen: offen.length,
    faellig: faellig(liste, jetzt).length,
    heuteNeu: offen.filter((f) => f.letzterFehler === t).length,
    behoben: liste.length - offen.length,
    nachQuelle,
    auffrischen: auffrischen(liste, jetzt).length,
    hartnaeckig: offen.filter(istHartnaeckig).length,
    gefestigt: liste.filter(istGefestigt).length,
  };
}

/** Offene Fehler je Thema, meiste zuerst. Einträge ohne Thema landen unter ''. */
export function nachThema(liste: Fehler[]): Array<{ topicId: ID; fehler: Fehler[] }> {
  const m = new Map<ID, Fehler[]>();
  for (const f of liste.filter(istOffen)) {
    for (const id of f.topicIds.length ? f.topicIds : ['']) m.set(id, [...(m.get(id) ?? []), f]);
  }
  return [...m].map(([topicId, fehler]) => ({ topicId, fehler })).sort((a, b) => b.fehler.length - a.fehler.length || a.topicId.localeCompare(b.topicId));
}

/** Auswahl-Antwort prüfen: genau die richtigen Optionen. */
export function auswahlRichtig(w: Extract<Wiederholung, { art: 'auswahl' }>, gewaehlt: number[]): boolean {
  const a = [...new Set(gewaehlt)].sort();
  const b = [...w.richtig].sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Optionen mischen und die Lösung mitnehmen (für die Wiederholung, damit nicht die Position gelernt wird). */
export function mischeAuswahl(w: Extract<Wiederholung, { art: 'auswahl' }>, zufall: () => number = Math.random): Extract<Wiederholung, { art: 'auswahl' }> {
  const idx = w.optionen.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  return { ...w, optionen: idx.map((i) => w.optionen[i]!), richtig: w.richtig.map((r) => idx.indexOf(r)) };
}

// ---------------------------------------------------------------- Speichern

const KEY = 'lernstoff.fehlerheft';

const istFehler = (v: unknown): boolean =>
  istObjekt(v) && typeof v.id === 'string' && typeof v.frage === 'string' && Array.isArray(v.treffer)
  && Array.isArray(v.topicIds) && Array.isArray(v.erklaerung) && istObjekt(v.wiederholung) && typeof v.letzterFehler === 'string';

export function ladeFehler(): Fehler[] {
  return storage.list<Fehler>(KEY, istFehler);
}

export function speichereFehler(liste: Fehler[]): boolean {
  const ok = storage.write(KEY, liste);
  try { window.dispatchEvent(new Event('fehlerheft')); } catch { /* ohne Fenster (Tests) */ }
  return ok;
}

/** Für Trainer: Fehler melden. Fehler beim Speichern brechen die Übung nicht ab. */
export function notiereFehler(neue: NeuerFehler[]): void {
  if (!neue.length) return;
  speichereFehler(merke(ladeFehler(), neue));
}

/** Alles, was heute im Fehlerheft dran ist: offene Wiederholungen und Auffrischungen (für Hinweise und „Heute“). */
export function heuteDran(liste: Fehler[], jetzt = new Date()): number {
  return faellig(liste, jetzt).length + auffrischen(liste, jetzt).length;
}
