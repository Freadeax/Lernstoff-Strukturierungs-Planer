// Schwächen-Radar fürs Examen: fasst den Wissensstand aus dem Lernplan, offene Einträge im Fehlerheft und
// schwache Themen der letzten Prüfungssimulationen je Kompetenzbereich (PflAPrV Anlage 2) und je Teil der
// staatlichen Prüfung zusammen. Rein (keine DB, kein React), damit die Gewichtung testbar und nachvollziehbar ist.

import type { ID, MasteryStatus } from '../../core/types';
import type { CatalogModule, ExamFormat } from '../../modules/catalog-types';
import { katalog, vorfahren, type Katalog } from '../simulation/simulation';

/** Anteil, den ein Thema je Status zur Stärke beiträgt. Nur echte Abfragen führen zu „sicher“. */
export const STATUS_GEWICHT: Record<MasteryStatus, number> = { sicher: 1, unsicher: 0.5, bearbeitet: 0.2, offen: 0 };

/** Ab so vielen Prozent gilt ein Bereich als stabil, darunter als Baustelle. */
export const STABIL_AB = 70;
export const BAUSTELLE_UNTER = 35;

export interface Fakten {
  /** Lernbare Themen (Blätter) mit Status aus dem Lernplan. */
  status: Map<ID, MasteryStatus>;
  /** Themen mit fälliger Abfrage laut Lernplan. */
  faellig: Set<ID>;
  /** Offene Fehler je Thema (Fehlerheft). */
  fehler: Map<ID, number>;
  /** Wie oft ein Thema in den letzten Simulationen schwach war. */
  simSchwach: Map<ID, number>;
}

export interface Stand {
  id: ID;
  code: string;
  name: string;
  themen: number;
  zahl: Record<MasteryStatus, number>;
  /** 0 … 100, Mittel der Status-Gewichte. */
  staerke: number;
  fehler: number;
  simSchwach: number;
}

/** Alle Kompetenz-IDs eines Themas, geerbt von den Oberthemen (z. B. kb.I.2, kb.III.2). */
export function kompetenzenVon(k: Katalog, topicId: ID): ID[] {
  return [...new Set(vorfahren(k, topicId).flatMap((t) => t.competencyIds ?? []))];
}

/** kb.I passt zu kb.I.2 und umgekehrt: ein breites Thema zählt für jeden Unterbereich mit. */
export const passt = (a: ID, b: ID) => a === b || a.startsWith(b + '.') || b.startsWith(a + '.');

const leer = (): Record<MasteryStatus, number> => ({ sicher: 0, unsicher: 0, bearbeitet: 0, offen: 0 });

function stand(id: ID, code: string, name: string, themen: ID[], f: Fakten): Stand {
  const zahl = leer();
  let summe = 0, fehler = 0, sim = 0;
  for (const t of themen) {
    const s = f.status.get(t) ?? 'offen';
    zahl[s]++;
    summe += STATUS_GEWICHT[s];
    fehler += f.fehler.get(t) ?? 0;
    sim += f.simSchwach.get(t) ?? 0;
  }
  return { id, code, name, themen: themen.length, zahl, staerke: themen.length ? Math.round((summe / themen.length) * 100) : 0, fehler, simSchwach: sim };
}

/** Kompetenzbereiche der obersten Ebene (I … V) in Katalogreihenfolge. */
export function achsen(modul: CatalogModule) {
  return (modul.frameworks ?? []).filter((fw) => fw.kind === 'kompetenzen').flatMap((fw) => fw.items).filter((i) => !i.parentId);
}

/** Stand je Kompetenzbereich (I … V). Themen ohne Zuordnung bleiben außen vor. */
export function proBereich(k: Katalog, f: Fakten): Stand[] {
  const themen = [...f.status.keys()];
  return achsen(k.modul).map((a) => stand(a.id, a.code, a.name, themen.filter((t) => kompetenzenVon(k, t).some((c) => passt(c, a.id))), f));
}

export interface PruefungsTeil { id: ID; formatId: ID; kurz: string; name: string; art: ExamFormat['kind']; minuten?: number; kompetenzen: ID[] }

/**
 * Teile der staatlichen Prüfung mit eigenem Kompetenzbezug: die drei Aufsichtsarbeiten, der mündliche und
 * der praktische Teil. Daten aus dem Katalog (pruefung.staatlich.*), nicht hier festgeschrieben.
 */
export function pruefungsTeile(modul: CatalogModule): PruefungsTeil[] {
  const out: PruefungsTeil[] = [];
  for (const fmt of modul.examFormats ?? []) {
    if (!fmt.id.startsWith('pruefung.staatlich.')) continue;
    const mitBezug = (fmt.teile ?? []).filter((t) => t.competencyIds?.length);
    if (mitBezug.length) {
      for (const t of mitBezug) out.push({ id: `${fmt.id}#${t.code}`, formatId: fmt.id, kurz: `Schriftlich ${t.code}`, name: t.name, art: fmt.kind, minuten: t.durationMinutes ?? fmt.durationMinutes, kompetenzen: t.competencyIds! });
    } else if (fmt.competencyIds?.length) {
      out.push({ id: fmt.id, formatId: fmt.id, kurz: fmt.kind === 'muendlich' ? 'Mündlich' : fmt.kind === 'praktisch' ? 'Praktisch' : fmt.name, name: fmt.name, art: fmt.kind, minuten: fmt.durationMinutes, kompetenzen: fmt.competencyIds });
    }
  }
  return out;
}

/** Stand je Prüfungsteil: ein Thema zählt, wenn eine seiner Kompetenzen zum Teil passt. */
export function proTeil(k: Katalog, teile: PruefungsTeil[], f: Fakten): Array<Stand & { teil: PruefungsTeil }> {
  const themen = [...f.status.keys()];
  return teile.map((teil) => ({
    ...stand(teil.id, teil.kurz, teil.name, themen.filter((t) => kompetenzenVon(k, t).some((c) => teil.kompetenzen.some((p) => passt(c, p)))), f),
    teil,
  }));
}

export interface Schwachstelle { topicId: ID; punkte: number; gruende: string[] }

/**
 * Themen, die fürs Examen am dringendsten sind. Punkte sind eine Rangfolge, keine Note:
 * offene Fehler und schwache Simulationen wiegen mehr als ein noch offenes Thema, weil sie
 * zeigen, dass etwas schon einmal nicht saß.
 */
export function schwachstellen(k: Katalog, f: Fakten, max = 8): Schwachstelle[] {
  const out: Schwachstelle[] = [];
  for (const [topicId, status] of f.status) {
    if (!kompetenzenVon(k, topicId).length) continue;
    const gruende: string[] = [];
    let punkte = 0;
    const fehler = f.fehler.get(topicId) ?? 0;
    const sim = f.simSchwach.get(topicId) ?? 0;
    if (fehler) { punkte += 3 * Math.min(fehler, 3); gruende.push(`${fehler} offene${fehler === 1 ? 'r Fehler' : ' Fehler'} im Fehlerheft`); }
    if (sim) { punkte += 2 * Math.min(sim, 3); gruende.push(`${sim}× schwach in der Prüfungssimulation`); }
    if (status === 'unsicher') { punkte += 2; gruende.push('Abgefragt, aber noch nicht sicher'); }
    if (f.faellig.has(topicId) && status !== 'offen') { punkte += 1; gruende.push('Abfrage fällig'); }
    if (status === 'bearbeitet') { punkte += 1; gruende.push('Bearbeitet, aber noch nie abgefragt'); }
    if (punkte > 0) out.push({ topicId, punkte, gruende });
  }
  return out.sort((a, b) => b.punkte - a.punkte || a.topicId.localeCompare(b.topicId)).slice(0, max);
}

/** Zählt, wie oft ein Thema in den Simulationen der letzten `tage` Tage schwach war. */
export function simulationsSchwaechen(verlauf: Array<{ at: string; schwach: string[] }>, jetzt = new Date(), tage = 60): Map<ID, number> {
  const grenze = jetzt.getTime() - tage * 86_400_000;
  const out = new Map<ID, number>();
  for (const v of verlauf) {
    const t = Date.parse(v.at);
    if (!Number.isFinite(t) || t < grenze) continue;
    for (const id of new Set(v.schwach)) out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

/** Offene Fehler je Thema; ein Fehler mit mehreren Themen zählt bei jedem. */
export function fehlerProThema(fehler: Array<{ topicIds: ID[]; behoben?: unknown }>): Map<ID, number> {
  const out = new Map<ID, number>();
  for (const e of fehler) if (!e.behoben) for (const id of new Set(e.topicIds)) out.set(id, (out.get(id) ?? 0) + 1);
  return out;
}

export const einstufung = (staerke: number) => (staerke >= STABIL_AB ? 'stabil' : staerke < BAUSTELLE_UNTER ? 'baustelle' : 'im Aufbau');

/** Eckpunkte des Radar-Polygons, Achse 0 zeigt nach oben, im Uhrzeigersinn. */
export function radarPunkte(werte: number[], radius: number, mitte: number): Array<[number, number]> {
  const n = werte.length;
  return werte.map((w, i) => {
    const winkel = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (Math.max(0, Math.min(100, w)) / 100) * radius;
    return [Math.round((mitte + r * Math.cos(winkel)) * 10) / 10, Math.round((mitte + r * Math.sin(winkel)) * 10) / 10];
  });
}

export { katalog };
