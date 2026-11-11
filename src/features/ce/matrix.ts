// Matrix CE × Ausbildungsabschnitt × Thema × Quelle × Übung (Audit 11/2026, Abschnitt „Curriculare Einheiten“).
// Reine Funktionen: Sie zeigen je Thema, ob der Weg von der Quelle bis zur Abfrage geschlossen ist,
// und je CE den Materialstand, die Zuordnung und die fachliche Freigabe.

import type { ID } from '../../core/types';
import type { ReviewLog } from '../lernplan/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { evidenceRating } from '../lernplan/fsrs';
import { uebungenFuer } from '../lernplan/trainer';
import { istQuellenAbschnitt } from '../skript/karten';
import type { Skript } from '../skript/typen';
import { ceListe, ceThemen, type Ce, type Herkunft } from './modell';
import { FRAGEN_JE_THEMA } from './selbsttest';

export type Ausbildungsabschnitt = 'ad12' | 'ad3';

export const ABSCHNITT_LABEL: Record<Ausbildungsabschnitt, string> = {
  ad12: '1./2. Ausbildungsdrittel',
  ad3: '3. Ausbildungsdrittel',
};
export const ABSCHNITT_KURZ: Record<Ausbildungsabschnitt, string> = { ad12: '1./2. Drittel', ad3: '3. Drittel' };

/** Materialstand eines Themas aus seinen Skripten. */
export type Materialstand = 'belegt' | 'luecken' | 'keine';
export const MATERIAL_LABEL: Record<Materialstand, string> = {
  belegt: 'Quelle belegt',
  luecken: 'Quelle mit Lücken',
  keine: 'Keine Quelle',
};

export type Freigabe = 'freigegeben' | 'teilweise' | 'offen';
export const FREIGABE_LABEL: Record<Freigabe, string> = {
  freigegeben: 'Fachlich freigegeben',
  teilweise: 'Teilweise freigegeben',
  offen: 'Fachlich ungeprüft',
};

export interface MatrixQuelle {
  skriptId: ID;
  titel: string;
  /** Lernabschnitte (ohne Quellenverzeichnis). */
  abschnitte: number;
  /** Lernabschnitte mit mindestens einem Beleg. */
  belegt: number;
  /** Mit ⚠ markierte, nicht belegte Stellen. */
  luecken: number;
  freigabe?: { am: string; von: string };
}

export interface MatrixThema {
  topicId: ID;
  name: string;
  fachId: ID;
  herkunft: Herkunft[];
  teil?: string;
  quellen: MatrixQuelle[];
  material: Materialstand;
  /** Karteikarten auf diesem Gerät, davon aus einem Skript. */
  karten: number;
  kartenAusSkript: number;
  /** Gezielte Übungen (Trainer, Fälle; ohne die Mindmap, die es zu jedem Thema gibt). */
  uebungen: string[];
  /** CE-Selbsttest möglich (genug Karteikarten). */
  selbsttest: boolean;
  /** Es gibt mindestens einen Weg, der ein Ergebnis in den Lernplan bucht. */
  abfragbar: boolean;
  /** Zählende Abfragen im Lernplan (abgeschlossen, nicht als Übung markiert). */
  abfragen: number;
  freigabe: Freigabe;
  /** Lücken im Weg Quelle → Zuordnung → Übung → Abfrage, in Worten. */
  fehlt: string[];
}

export interface MatrixCe {
  ce: Ce;
  abschnitte: Ausbildungsabschnitt[];
  themen: MatrixThema[];
  summe: {
    themen: number;
    mitQuelle: number;
    belegt: number;
    mitUebung: number;
    abfragbar: number;
    abgefragt: number;
    wegVollstaendig: number;
    /** Skripte der CE und davon fachlich freigegeben. */
    skripte: number;
    skripteFreigegeben: number;
  };
}

export interface MatrixDaten {
  skripte: Skript[];
  karten: Array<{ topicIds: ID[]; ref?: string; quelle?: string }>;
  reviewLogs?: ReviewLog[];
}

function quelleAus(s: Skript): MatrixQuelle {
  const lern = s.abschnitte.filter((a) => !istQuellenAbschnitt(a));
  return {
    skriptId: s.id, titel: s.titel, abschnitte: lern.length,
    belegt: lern.filter((a) => a.belege.length > 0).length,
    luecken: lern.reduce((n, a) => n + a.luecken, 0),
    ...(s.freigabe ? { freigabe: s.freigabe } : {}),
  };
}

function materialstand(qs: MatrixQuelle[]): Materialstand {
  if (!qs.length || qs.every((q) => q.abschnitte === 0)) return 'keine';
  return qs.every((q) => q.belegt === q.abschnitte && q.luecken === 0) ? 'belegt' : 'luecken';
}

function freigabeVon(qs: MatrixQuelle[]): Freigabe {
  const n = qs.filter((q) => q.freigabe).length;
  return n && n === qs.length ? 'freigegeben' : n ? 'teilweise' : 'offen';
}

export function abschnitteDerCe(modul: CatalogModule, ceId: ID): Ausbildungsabschnitt[] {
  const item = modul.frameworks?.find((f) => f.kind === 'curriculum')?.items.find((i) => i.id === ceId);
  return (item?.abschnitte ?? []).filter((a): a is Ausbildungsabschnitt => a === 'ad12' || a === 'ad3');
}

/** Matrix für eine CE. */
export function ceMatrix(modul: CatalogModule, ce: Ce, d: MatrixDaten, liste: Ce[] = ceListe(modul)): MatrixCe {
  const skripte = new Map(d.skripte.map((s) => [s.id, s]));
  const themen = ceThemen(modul, ce, d.skripte, liste);
  const kartenJe = new Map<ID, { alle: number; skript: number }>();
  for (const k of d.karten) {
    const ausSkript = (k.ref ?? '').startsWith('skript:');
    for (const t of new Set(k.topicIds)) {
      const z = kartenJe.get(t) ?? { alle: 0, skript: 0 };
      kartenJe.set(t, { alle: z.alle + 1, skript: z.skript + (ausSkript ? 1 : 0) });
    }
  }
  const abfragen = new Map<ID, number>();
  for (const l of d.reviewLogs ?? []) {
    if (evidenceRating(l) !== undefined) abfragen.set(l.topicId, (abfragen.get(l.topicId) ?? 0) + 1);
  }

  const zeilen: MatrixThema[] = themen.map((e) => {
    const id = e.topic.id;
    const quellen = e.skriptIds.map((sid) => skripte.get(sid)).filter((s): s is Skript => !!s).map(quelleAus);
    const material = materialstand(quellen);
    const k = kartenJe.get(id) ?? { alle: 0, skript: 0 };
    const uebungen = uebungenFuer(id, modul).filter((u) => u.trainer !== 'mindmap').map((u) => u.label);
    const selbsttest = k.alle >= FRAGEN_JE_THEMA;
    const abfragbar = selbsttest || uebungen.length > 0;
    const fehlt: string[] = [];
    if (material === 'keine') fehlt.push(quellen.length ? 'Skript ohne Lernabschnitte' : 'Keine Quelle: kein Skript dieser CE nennt das Thema');
    else if (material === 'luecken') fehlt.push('Quelle hat unbelegte Stellen');
    if (!e.herkunft.includes('katalog') && !e.herkunft.includes('oberthema')) fehlt.push('Nur über das Skript zugeordnet, nicht im Katalog');
    if (!k.alle && !uebungen.length) fehlt.push('Keine Übung: weder Karteikarten noch Trainer');
    else if (material !== 'keine' && !k.skript) fehlt.push('Noch keine Karteikarten aus dem Skript');
    if (!abfragbar) fehlt.push(`Keine Abfrage möglich: Selbsttest braucht ${FRAGEN_JE_THEMA} Karteikarten`);
    return {
      topicId: id, name: e.topic.name, fachId: e.topic.subjectId, herkunft: e.herkunft, ...(e.teil ? { teil: e.teil } : {}),
      quellen, material, karten: k.alle, kartenAusSkript: k.skript, uebungen, selbsttest, abfragbar,
      abfragen: abfragen.get(id) ?? 0, freigabe: freigabeVon(quellen), fehlt,
    };
  });

  const ceSkripte = d.skripte.filter((s) => themen.some((t) => t.skriptIds.includes(s.id)));
  return {
    ce,
    abschnitte: abschnitteDerCe(modul, ce.id),
    themen: zeilen,
    summe: {
      themen: zeilen.length,
      mitQuelle: zeilen.filter((z) => z.material !== 'keine').length,
      belegt: zeilen.filter((z) => z.material === 'belegt').length,
      mitUebung: zeilen.filter((z) => z.karten > 0 || z.uebungen.length > 0).length,
      abfragbar: zeilen.filter((z) => z.abfragbar).length,
      abgefragt: zeilen.filter((z) => z.abfragen > 0).length,
      wegVollstaendig: zeilen.filter(istWegVollstaendig).length,
      skripte: ceSkripte.length,
      skripteFreigegeben: ceSkripte.filter((s) => s.freigabe).length,
    },
  };
}

/** Quelle vorhanden, Übung vorhanden, Abfrage möglich. Ob schon abgefragt wurde, zählt hier nicht. */
export const istWegVollstaendig = (z: MatrixThema) => z.material !== 'keine' && (z.karten > 0 || z.uebungen.length > 0) && z.abfragbar;

/** Matrix aller CE. */
export function alleCeMatrix(modul: CatalogModule, d: MatrixDaten): MatrixCe[] {
  const liste = ceListe(modul);
  return liste.map((ce) => ceMatrix(modul, ce, d, liste));
}

/** Zeilen je Ausbildungsabschnitt: eine CE mit zwei Dritteln steht in beiden. */
export function nachAbschnitt(matrix: MatrixCe[]): Array<{ abschnitt: Ausbildungsabschnitt | 'ohne'; ces: MatrixCe[] }> {
  const reihe: Array<Ausbildungsabschnitt | 'ohne'> = ['ad12', 'ad3', 'ohne'];
  return reihe.map((a) => ({ abschnitt: a, ces: matrix.filter((m) => (a === 'ohne' ? !m.abschnitte.length : m.abschnitte.includes(a))) }))
    .filter((g) => g.ces.length);
}
