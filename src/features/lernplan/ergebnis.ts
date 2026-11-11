// Einheitliches Ergebnisformat für alle Lernmodule (Audit 11.11.2026, Abschnitt 3 und Paket C).
//
// Ein Lernergebnis sagt, woher es stammt (Modul, Fall/Karte, Kriterien), zu welchen Themen es gehört,
// wann es entstand, zu welchem Versuch es gehört und wie aussagekräftig es ist. Gespeichert wird je Thema
// eine Zeile in reviewLogs mit diesen Zusatzfeldern (keine eigene Tabelle, keine neue DB-Version).
//
// Regeln:
// - Dieselbe versuchId wird je Thema nur einmal gebucht (Reload, Wiederöffnen, zweiter Tab).
// - Ein offener Versuch darf später abgeschlossen oder abgebrochen werden; nur abgeschlossene zählen.
// - aussagekraft 'uebung' (Lernmodus, Hilfen) wird protokolliert, zählt aber nicht.
// - Wie bisher zählt je Modul, Thema und Tag nur der erste abgeschlossene Versuch. Spätere Versuche
//   desselben Tages werden als 'uebung' protokolliert, damit Nachbessern bis 100 % nichts vortäuscht.

import type { Topic } from '../../core/types';
import { db } from '../../core/db';
import { modules } from '../../modules/registry';
import { evidenceRating } from './fsrs';
import { heute, leafTopics, logReview, type BuchungsStatus } from './store';
import type { Aussagekraft, EvidenceSource, Herkunft, ReviewLog, VersuchStatus } from './types';

export interface Lernergebnis {
  /** Stabil je Versuch, Form `<modul>:<ref>:<lauf>`, z. B. `diagnostik:sepsis-1:2026-11-11T08:00`. */
  versuchId: string;
  herkunft: Herkunft;
  status: VersuchStatus;
  aussagekraft: Aussagekraft;
  /** Art der Abfrage für den Lernplan. Standard: 'trainer' bei Anwendung, 'quiz' bei Abruf. */
  quelle?: EvidenceSource;
  ergebnisse: Array<{ topicId: string; scorePercent: number; anzahl: number }>;
  /** Kalendertag (Standard: heute). */
  date?: string;
}

export type ErgebnisStatus = BuchungsStatus | 'kein_thema' | 'als_uebung';
export interface ErgebnisBuchung { topicId: string; name: string; scorePercent: number; status: ErgebnisStatus; zaehlt: boolean }

/** Prüft ein Lernergebnis; gibt eine Fehlermeldung zurück oder undefined. */
export function pruefeErgebnis(e: Lernergebnis): string | undefined {
  if (!e.versuchId?.trim()) return 'Ein Lernergebnis braucht eine versuchId.';
  if (!e.herkunft?.modul?.trim()) return 'Ein Lernergebnis braucht eine Herkunft (Modul).';
  if (!['abgeschlossen', 'offen', 'abgebrochen'].includes(e.status)) return 'Unbekannter Versuchsstatus.';
  if (!['abruf', 'anwendung', 'uebung'].includes(e.aussagekraft)) return 'Unbekannte Aussagekraft.';
  if (!e.ergebnisse.length) return 'Ein Lernergebnis braucht mindestens ein Thema.';
  if (e.ergebnisse.some((x) => !Number.isFinite(x.scorePercent) || x.scorePercent < 0 || x.scorePercent > 100 || !Number.isInteger(x.anzahl) || x.anzahl < 1)) {
    return 'Ergebnisse brauchen 0 bis 100 Prozent und mindestens eine bewertete Aufgabe.';
  }
  return undefined;
}

/**
 * Entscheidet ohne Datenbank je Thema: unbekannte Themen und Oberthemen fallen weg, ein zweiter
 * abgeschlossener Versuch desselben Moduls am selben Tag wird zur Übung.
 */
export function planeBuchung(e: Lernergebnis, topics: Topic[], heuteVorhanden: Array<Pick<ReviewLog, 'topicId' | 'versuchId' | 'herkunft' | 'status' | 'aussagekraft' | 'source' | 'rating' | 'scorePercent'> & { trainer?: string }>) {
  const leaves = new Map(leafTopics(topics).map((t) => [t.id, t]));
  const zaehltSchon = new Set(heuteVorhanden
    .filter((l) => (l.herkunft?.modul ?? l.trainer) === e.herkunft.modul && l.versuchId !== e.versuchId && evidenceRating(l as ReviewLog) !== undefined)
    .map((l) => l.topicId));
  return e.ergebnisse.map((x) => {
    const topic = leaves.get(x.topicId);
    const aussagekraft: Aussagekraft = e.status === 'abgeschlossen' && e.aussagekraft !== 'uebung' && zaehltSchon.has(x.topicId) ? 'uebung' : e.aussagekraft;
    return { ...x, topic, aussagekraft, zurUebung: aussagekraft !== e.aussagekraft };
  });
}

/** Bucht ein Lernergebnis in den Lernplan und sagt je Thema, was passiert ist. */
export async function bucheErgebnis(e: Lernergebnis, topics: Topic[] = modules[0]?.topics ?? []): Promise<ErgebnisBuchung[]> {
  const fehler = pruefeErgebnis(e);
  if (fehler) throw new Error(fehler);
  const date = e.date ?? heute();
  const alle = new Map(topics.map((t) => [t.id, t]));
  return db.transaction('rw', db.reviewLogs, db.activity, async () => {
    const ids = e.ergebnisse.map((x) => x.topicId);
    const vorhanden = await db.reviewLogs.where('topicId').anyOf(ids).filter((l) => l.date === date).toArray();
    const out: ErgebnisBuchung[] = [];
    for (const p of planeBuchung(e, topics, vorhanden)) {
      const name = alle.get(p.topicId)?.name ?? p.topicId;
      if (!p.topic) { out.push({ topicId: p.topicId, name, scorePercent: p.scorePercent, status: 'kein_thema', zaehlt: false }); continue; }
      const quelle = e.quelle ?? (e.aussagekraft === 'abruf' ? 'quiz' : 'trainer');
      const status = await logReview(p.topic, quelle, { scorePercent: p.scorePercent }, date, quelle === 'trainer' ? e.herkunft.modul : undefined,
        { versuchId: e.versuchId, herkunft: e.herkunft, status: e.status, aussagekraft: p.aussagekraft });
      const zaehlt = status !== 'schon_gebucht' && e.status === 'abgeschlossen' && p.aussagekraft !== 'uebung';
      out.push({ topicId: p.topicId, name, scorePercent: p.scorePercent, status: p.zurUebung && status !== 'schon_gebucht' ? 'als_uebung' : status, zaehlt });
    }
    return out;
  });
}

/** Kurzer Satz für die Anzeige nach dem Buchen. */
export function buchungsText(b: ErgebnisBuchung[]): string {
  const n = (s: ErgebnisStatus) => b.filter((x) => x.status === s).length;
  const teile: string[] = [];
  const gezaehlt = b.filter((x) => x.zaehlt).length;
  if (gezaehlt) teile.push(`${gezaehlt === 1 ? '1 Thema' : `${gezaehlt} Themen`} im Lernplan gezählt`);
  if (n('als_uebung')) teile.push(`${n('als_uebung')} heute schon gezählt, als Übung protokolliert`);
  if (n('schon_gebucht')) teile.push(`${n('schon_gebucht')} war schon gebucht`);
  if (n('kein_thema')) teile.push(`${n('kein_thema')} ohne passendes Lernplan-Thema`);
  return teile.length ? teile.join(', ') + '.' : 'Nichts gebucht.';
}
