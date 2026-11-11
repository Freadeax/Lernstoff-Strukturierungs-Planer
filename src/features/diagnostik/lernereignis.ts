// Abgeschlossener Diagnostik-Fall als Lernereignis (Audit SIM-05): eigene Versuch-ID, getrennte
// Kriterien (Präanalytik, kritische Meldung, SBAR, Vorbereitung, Befundverständnis) und Themen je
// Kriterium für Lernplan und Fehlerheft. Rein und testbar; gebucht wird in FallAnsicht.

import type { Lernergebnis } from '../lernplan/ergebnis';
import type { NeuerFehler } from '../fehlerheft/fehlerheft';
import { auswertung, type Lauf, type Punkt } from './lauf';
import { FALL_THEMEN, KRITERIUM_LABEL, KRITERIUM_THEMA, type KriteriumId } from './themen';
import type { DiagnostikFall } from './typen';
import type { Stoerung } from '../../ui/sim/labor/bga';

const STOERUNGEN: Stoerung[] = ['normal', 'respiratorische Azidose', 'metabolische Azidose', 'respiratorische Alkalose', 'metabolische Alkalose', 'gemischte Azidose', 'gemischte Alkalose'];

export interface KriteriumErgebnis { id: KriteriumId; label: string; erfuellt: boolean; ok: number; gesamt: number }

/** Welches Kriterium ein Auswertungspunkt belegt. */
function kriteriumVon(p: Punkt): KriteriumId | undefined {
  if (p.titel === 'Präanalytik') return 'praeanalytik';
  if (p.titel === 'Kritischer Wert') return 'kritische-meldung';
  if (p.titel === 'SBAR-Übergabe') return 'sbar';
  if (p.titel.startsWith('Vorbereitung:')) return 'vorbereitung';
  if (p.titel === 'Sinnvolle Laborwerte' || p.titel.startsWith('Befunde im Bild:') || p.titel === 'Lernfragen') return 'befundverstaendnis';
  return undefined;
}

export function kriterien(l: Lauf, fall: DiagnostikFall): KriteriumErgebnis[] {
  const sum = new Map<KriteriumId, { ok: number; gesamt: number }>();
  for (const p of auswertung(l, fall)) {
    const k = kriteriumVon(p);
    if (!k || p.ok === null) continue;
    const s = sum.get(k) ?? { ok: 0, gesamt: 0 };
    sum.set(k, { ok: s.ok + (p.ok ? 1 : 0), gesamt: s.gesamt + 1 });
  }
  // Lernfragen einzeln statt als ein Punkt, damit viele Fragen mehr Gewicht haben
  const fragen = fall.fragen.filter((f) => l.antworten[f.id]);
  if (fragen.length) {
    const s = sum.get('befundverstaendnis')!;
    sum.set('befundverstaendnis', { ok: s.ok - (fragen.every((f) => l.antworten[f.id].richtig) ? 1 : 0) + fragen.filter((f) => l.antworten[f.id].richtig).length, gesamt: s.gesamt - 1 + fragen.length });
  }
  return (Object.keys(KRITERIUM_LABEL) as KriteriumId[]).filter((k) => sum.has(k))
    .map((id) => { const s = sum.get(id)!; return { id, label: KRITERIUM_LABEL[id], erfuellt: s.ok === s.gesamt, ok: s.ok, gesamt: s.gesamt }; });
}

export const versuchIdVon = (l: Lauf) => (l.id ? `diagnostik:${l.fallId}:${l.id}` : undefined);

/** Lernergebnis für den Lernplan; undefined, solange der Fall läuft oder bei alten Läufen ohne Kennung. */
export function lernereignis(l: Lauf, fall: DiagnostikFall): Lernergebnis | undefined {
  const versuchId = versuchIdVon(l);
  if (!versuchId || l.beendet === undefined) return undefined;
  const ks = kriterien(l, fall);
  const sum = new Map<string, { ok: number; gesamt: number }>();
  for (const k of ks) {
    for (const t of KRITERIUM_THEMA[k.id] ? [KRITERIUM_THEMA[k.id]!] : FALL_THEMEN[fall.id] ?? []) {
      const s = sum.get(t) ?? { ok: 0, gesamt: 0 };
      sum.set(t, { ok: s.ok + k.ok, gesamt: s.gesamt + k.gesamt });
    }
  }
  const ergebnisse = [...sum].filter(([, s]) => s.gesamt > 0)
    .map(([topicId, s]) => ({ topicId, scorePercent: Math.round((s.ok / s.gesamt) * 100), anzahl: s.gesamt }));
  if (!ergebnisse.length) return undefined;
  return {
    versuchId, status: 'abgeschlossen', aussagekraft: 'anwendung',
    herkunft: { modul: 'diagnostik', ref: fall.id, kriterien: ks.map(({ id, label, erfuellt }) => ({ id, label, erfuellt })) },
    ergebnisse,
  };
}

/** Falsch beantwortete Lernfragen des Falls für das Fehlerheft (Auswahlfragen und BGA-Deutung). */
export function fehlerAusLauf(l: Lauf, fall: DiagnostikFall): NeuerFehler[] {
  const themen = FALL_THEMEN[fall.id] ?? [];
  const out: NeuerFehler[] = [];
  for (const f of fall.fragen) {
    const a = l.antworten[f.id];
    if (!a || a.richtig) continue;
    if (f.art === 'wahl') {
      const richtig = f.optionen.map((o, i) => (o.richtig ? i : -1)).filter((i) => i >= 0);
      out.push({ id: `diagnostik:${fall.id}:${f.id}`, quelle: 'diagnostik', kriterium: 'Befundverständnis', fallId: fall.id, versuchId: versuchIdVon(l), beleg: `Diagnostik-Fall „${fall.titel}“ (fiktiv)`, topicIds: themen, titel: `Diagnostik · ${fall.titel}`, frage: f.frage, deineAntwort: a.wahl || '–',
        loesung: f.optionen.filter((o) => o.richtig).map((o) => o.text).join(' / '), erklaerung: f.optionen.filter((o) => o.richtig).map((o) => o.warum),
        wiederholung: { art: 'auswahl', optionen: f.optionen.map((o) => o.text), richtig, mehrfach: richtig.length > 1 } });
    } else if (f.art === 'bga') {
      const optionen = [...STOERUNGEN];
      out.push({ id: `diagnostik:${fall.id}:${f.id}`, quelle: 'diagnostik', kriterium: 'Befundverständnis', fallId: fall.id, versuchId: versuchIdVon(l), beleg: `Diagnostik-Fall „${fall.titel}“ (fiktiv)`, topicIds: ['thema.ap.atmung', ...themen], titel: `BGA · ${fall.titel}`, frage: `${f.frage} Welche Störung liegt vor?`, deineAntwort: a.wahl || '–',
        loesung: f.kompensation === 'keine' ? `${f.stoerung}, nicht kompensiert` : `${f.stoerung}, ${f.kompensation} kompensiert`, erklaerung: [f.erklaerung],
        wiederholung: { art: 'auswahl', optionen, richtig: [optionen.indexOf(f.stoerung)], mehrfach: false } });
    }
  }
  return out;
}
