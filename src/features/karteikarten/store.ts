// Karteikarten lesen und schreiben (Dexie) und Ergebnisse an den Lernplan melden.

import { db } from '../../core/db';
import { logActivity } from '../../core/activity';
import type { ID, Topic } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { heute, logReview } from '../lernplan/store';
import type { Rating } from '../lernplan/types';
import { lueckenKarten, modulKarten } from './erzeugen';
import { bewerte, ergebnisseJeThema, stelleSitzungZusammen, type ThemenErgebnis } from './planung';
import { STANDARD_CONFIG, type Karte, type KartenConfig, type KartenLog, type KartenStand } from './typen';

export { heute };

export async function ladeConfig(): Promise<KartenConfig> {
  const c = await db.kartenConfig.get('standard');
  return { ...STANDARD_CONFIG, ...c, id: 'standard' };
}

export async function speichereConfig(patch: Partial<Omit<KartenConfig, 'id'>>) {
  await db.kartenConfig.put({ ...(await ladeConfig()), ...patch, id: 'standard' });
}

export interface KartenDaten {
  config: KartenConfig;
  modul: Karte[];
  gespeichert: Karte[];
  alle: Karte[];
  staende: Map<ID, KartenStand>;
  logs: KartenLog[];
}

/** Alles für die Karteikarten-Seite. Logs nur der letzten 60 Tage (Statistik). */
export async function ladeKartenDaten(modul: CatalogModule, tag = heute()): Promise<KartenDaten> {
  const seit = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  const [config, gespeichert, staende, logs] = await Promise.all([
    ladeConfig(), db.karten.toArray(), db.kartenStand.toArray(), db.kartenLogs.where('date').between(seit, tag, true, true).toArray(),
  ]);
  const ausModul = modulKarten(modul, config);
  return {
    config, modul: ausModul, gespeichert, alle: [...gespeichert.flatMap(lueckenKarten), ...ausModul],
    staende: new Map(staende.map((s) => [s.cardId, s])), logs,
  };
}

export const neueHeute = (staende: Iterable<KartenStand>, tag: string) => {
  let n = 0;
  for (const s of staende) if (s.erstmals === tag) n++;
  return n;
};

/** Für Übersicht und Lernplan: wie viel heute ansteht. */
export async function zaehleHeute(modul: CatalogModule, tag = heute()) {
  const d = await ladeKartenDaten(modul, tag);
  const s = stelleSitzungZusammen(d.alle, d.staende, { heute: tag, config: { ...d.config, sitzungsGroesse: Number.MAX_SAFE_INTEGER }, neueHeuteSchon: neueHeute(d.staende.values(), tag) });
  return { faellig: s.faellig, neu: s.neu };
}

/** Antwort verbuchen: neuer FSRS-Stand und ein Protokolleintrag, beides in einer Transaktion. */
export async function antworte(karte: Karte, rating: Rating, retention: number, tag = heute()): Promise<KartenStand> {
  return db.transaction('rw', [db.kartenStand, db.kartenLogs], async () => {
    const alt = await db.kartenStand.get(karte.id);
    const neu = bewerte(alt?.reps ? alt : undefined, karte.id, rating, tag, retention);
    await db.kartenStand.put(neu);
    await db.kartenLogs.add({ cardId: karte.id, date: tag, at: new Date().toISOString(), rating, topicIds: karte.topicIds });
    return neu;
  });
}

/** Karte pausieren oder wieder aufnehmen. Eine neue Karte bekommt dafür einen leeren Stand. */
export async function setzeAus(cardId: ID, aus: boolean) {
  const s = await db.kartenStand.get(cardId);
  if (aus) {
    await db.kartenStand.put(s ? { ...s, ausgesetzt: true } : { cardId, stability: 0, difficulty: 5, lastReview: '', due: '9999-12-31', reps: 0, lapses: 0, erstmals: '', ausgesetzt: true });
  } else if (s) {
    if (s.reps === 0) await db.kartenStand.delete(cardId);
    else await db.kartenStand.put({ ...s, ausgesetzt: false });
  }
}

export async function speichereKarte(k: Karte) {
  const jetzt = new Date().toISOString();
  await db.karten.put({ ...k, erstellt: k.erstellt ?? jetzt, geaendert: jetzt });
}

export async function loescheKarte(id: ID) {
  await db.transaction('rw', [db.karten, db.kartenStand], async () => {
    await db.karten.delete(id);
    await db.kartenStand.delete(id);
    // Lückentext: Lernstand jeder einzelnen Lücke
    await db.kartenStand.where('cardId').startsWith(`${id}:l`).delete();
  });
}

/** Kartenvorschläge aus einer Zusammenfassung speichern. Schon übernommene Karten behalten ihren Lernstand. */
export async function uebernehme(karten: Karte[], titel: string) {
  if (!karten.length) return;
  const vorhanden = new Map((await db.karten.bulkGet(karten.map((k) => k.id))).filter((k): k is Karte => !!k).map((k) => [k.id, k]));
  const jetzt = new Date().toISOString();
  await db.karten.bulkPut(karten.map((k) => ({ ...k, erstellt: vorhanden.get(k.id)?.erstellt ?? jetzt, geaendert: jetzt })));
  await logActivity({ kind: 'uebung', severity: 'info', ref: karten[0]!.ref, title: `${karten.length} Karteikarten übernommen`, detail: titel });
}

/**
 * Sitzungsende: je Thema mit mindestens drei Karten ein Abfrageergebnis an den Lernplan
 * (Quelle „Karteikarten“, zählt als echter Nachweis). Nur Themen, die der Lernplan kennt.
 */
export async function schliesseSitzungAb(antworten: Pick<KartenLog, 'cardId' | 'rating' | 'topicIds'>[], topics: Map<ID, Topic>, tag = heute()): Promise<ThemenErgebnis[]> {
  const ergebnisse = ergebnisseJeThema(antworten, new Set(topics.keys()));
  for (const e of ergebnisse) await logReview(topics.get(e.topicId)!, 'karteikarten', { scorePercent: e.scorePercent }, tag);
  const karten = new Set(antworten.map((a) => a.cardId)).size;
  const gewusst = antworten.filter((a) => a.rating >= 3).length;
  if (karten) {
    await logActivity({
      kind: 'uebung', severity: 'info', title: `Karteikarten: ${karten} Karten wiederholt`,
      detail: `${gewusst} von ${antworten.length} Antworten gewusst${ergebnisse.length ? `, ${ergebnisse.length} Themen an den Lernplan gemeldet` : ''}`,
    });
  }
  return ergebnisse;
}

// ---------------------------------------------------------------- Unterbrochene Sitzung

type Antwort = Pick<KartenLog, 'cardId' | 'rating' | 'topicIds'>;
const OFFEN = 'lernstoff.karten.offeneSitzung';

/** Antworten der laufenden Sitzung merken, damit ihr Ergebnis auch ohne „Fertig“ im Lernplan ankommt. */
export function merkeOffeneSitzung(antworten: Antwort[], tag: string) {
  try { localStorage.setItem(OFFEN, JSON.stringify({ tag, antworten })); } catch { /* privater Modus */ }
}
export function vergissOffeneSitzung() {
  try { localStorage.removeItem(OFFEN); } catch { /* privater Modus */ }
}

/**
 * Sitzung über Menü, Zurück-Taste oder Schließen der App verlassen: das bisherige Ergebnis
 * trotzdem an den Lernplan melden. Der Merker wird vorher entfernt, damit nichts doppelt zählt.
 */
export async function schliesseOffeneSitzungAb(topics: Map<ID, Topic>): Promise<ThemenErgebnis[] | null> {
  let offen: { tag: string; antworten: Antwort[] } | null = null;
  try { offen = JSON.parse(localStorage.getItem(OFFEN) ?? 'null'); } catch { offen = null; }
  vergissOffeneSitzung();
  if (!offen || !Array.isArray(offen.antworten) || !offen.antworten.length) return null;
  try { return await schliesseSitzungAb(offen.antworten, topics, offen.tag); }
  catch (e) { merkeOffeneSitzung(offen.antworten, offen.tag); throw e; }
}
