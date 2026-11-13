import { pruefeAntwort } from '../klasse/auswertung';
import type { Abgabe, KlassenFall } from '../klasse/typen';
import { istWahl } from '../klasse/typen';
import { pruefeWahl } from '../klasse/wahl';
import { ergebnis, vorschlag } from './bewertung';
import { prozent } from './noten';
import { nameSchluessel, type Bewertung, type Klasse, type Notenstufe, type Status } from './typen';

// Klassenübersicht: Wer hat was abgegeben, was ist bewertet, wo hakt es in der Klasse?
// Reine Rechnung ohne Speicherzugriff, damit sie sich gut testen lässt.

/** Frist gilt bis Ende des Tages (lokale Zeit). */
export function fristVorbei(frist: string | undefined, jetzt: Date): boolean {
  if (!frist) return false;
  return jetzt.getTime() > new Date(`${frist}T23:59:59`).getTime();
}

export function status(fall: KlassenFall, abgabe: Abgabe | undefined, b: Bewertung | undefined | null, jetzt: Date): Status {
  if (!abgabe) return fristVorbei(fall.frist, jetzt) ? 'ueberfaellig' : 'offen';
  if (b?.bewertet) return b.abgabeVom < abgabe.abgegeben ? 'neu' : 'bewertet';
  return fall.frist && new Date(abgabe.abgegeben).getTime() > new Date(`${fall.frist}T23:59:59`).getTime() ? 'verspaetet' : 'abgegeben';
}

export interface Zelle { status: Status; prozent: number | null; note: string | null; abgabe?: Abgabe }
export interface Zeile { name: string; inListe: boolean; zellen: Zelle[]; schnitt: number | null }
export interface Spalte { fall: KlassenFall; abgegeben: number; bewertet: number; schnitt: number | null }
export interface Matrix { zeilen: Zeile[]; spalten: Spalte[] }

export interface Quellen {
  abgaben: (fallId: string) => Abgabe[];
  bewertungen: (fallId: string) => Record<string, Bewertung>;
  schluessel: Notenstufe[];
  jetzt: Date;
}

const mittel = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);

/**
 * Zeilen = Lernende aus der Klassenliste plus alle, die ohne Listeneintrag abgegeben haben.
 * Spalten = Fälle der Klasse (Reihenfolge wie übergeben).
 */
export function klassenMatrix(klasse: Klasse, faelle: KlassenFall[], q: Quellen): Matrix {
  const namen = new Map<string, { name: string; inListe: boolean }>();
  for (const n of klasse.lernende) namen.set(nameSchluessel(n), { name: n, inListe: true });
  for (const f of faelle) for (const a of q.abgaben(f.id)) if (!namen.has(nameSchluessel(a.name))) namen.set(nameSchluessel(a.name), { name: a.name, inListe: false });

  const jeFall = faelle.map((f) => {
    const ab = new Map(q.abgaben(f.id).map((a) => [nameSchluessel(a.name), a]));
    return { f, ab, bw: q.bewertungen(f.id) };
  });

  const zeilen: Zeile[] = [...namen.entries()].map(([k, { name, inListe }]) => {
    const zellen = jeFall.map(({ f, ab, bw }) => {
      const a = ab.get(k);
      const b = bw[k];
      const s = status(f, a, b, q.jetzt);
      const e = b?.bewertet ? ergebnis(f, b, q.schluessel) : null;
      return { status: s, prozent: e?.vollstaendig ? e.prozent : null, note: e?.note ?? null, abgabe: a };
    });
    return { name, inListe, zellen, schnitt: mittel(zellen.map((z) => z.prozent).filter((p): p is number => p !== null)) };
  });
  zeilen.sort((a, b) => (a.inListe === b.inListe ? a.name.localeCompare(b.name, 'de') : a.inListe ? -1 : 1));

  const spalten: Spalte[] = jeFall.map(({ f }, i) => {
    const z = zeilen.map((x) => x.zellen[i]!);
    return {
      fall: f,
      abgegeben: z.filter((x) => x.abgabe).length,
      bewertet: z.filter((x) => x.status === 'bewertet' || x.status === 'neu').length,
      schnitt: mittel(z.map((x) => x.prozent).filter((p): p is number => p !== null)),
    };
  });
  return { zeilen, spalten };
}

export interface AufgabenStatistik {
  id: string;
  nr: number;
  frage: string;
  /** Durchschnitt in Prozent: bewertete Punkte, sonst Vorschlag aus dem Code. */
  schnitt: number | null;
  quelle: 'bewertung' | 'vorschlag' | null;
  leer: number;
  /** Kernpunkte, die in vielen Antworten fehlen (absteigend). */
  fehlend: { text: string; fehlt: number }[];
  /** Auswahl: wie oft welche Option gewählt wurde. */
  wahl?: { option: string; anzahl: number; richtig: boolean }[];
}

/** Je Aufgabe: Wie gut klappt sie, was fehlt oft? Für die Nachbesprechung im Unterricht. */
export function aufgabenStatistik(fall: KlassenFall, abgaben: Abgabe[], bewertungen: Record<string, Bewertung>): AufgabenStatistik[] {
  return fall.aufgaben.map((a, i) => {
    const antworten = abgaben.map((x) => x.antworten[a.id] ?? '');
    const bewertet = abgaben.map((x) => bewertungen[nameSchluessel(x.name)]).filter((b) => b?.bewertet && typeof b.punkte[a.id] === 'number');
    let schnitt: number | null = null;
    let quelle: AufgabenStatistik['quelle'] = null;
    if (a.punkte && bewertet.length) {
      schnitt = mittel(bewertet.map((b) => prozent(Math.min(b!.punkte[a.id]!, a.punkte!), a.punkte!)));
      quelle = 'bewertung';
    } else if (a.punkte && abgaben.length) {
      const v = antworten.map((t) => vorschlag(a, t)).filter((x) => x !== null);
      if (v.length) { schnitt = mittel(v.map((x) => prozent(x!.punkte, a.punkte!))); quelle = 'vorschlag'; }
    }
    const kp = a.kernpunkte ?? [];
    const fehlend = kp.map((k, j) => ({ text: k.text, fehlt: antworten.filter((t) => t.trim() && !pruefeAntwort(a, t)[j]?.ok).length }))
      .filter((x) => x.fehlt > 0).sort((x, y) => y.fehlt - x.fehlt);
    const stat: AufgabenStatistik = { id: a.id, nr: i + 1, frage: a.frage, schnitt, quelle, leer: antworten.filter((t) => !t.trim()).length, fehlend };
    if (istWahl(a)) {
      const opt = a.optionen!;
      const zaehle = opt.map(() => 0);
      for (const t of antworten) for (const m of t.toUpperCase().matchAll(/\b([A-Z])\b/g)) { const j = m[1]!.charCodeAt(0) - 65; if (j < opt.length) zaehle[j]!++; }
      stat.wahl = opt.map((o, j) => ({ option: o, anzahl: zaehle[j]!, richtig: !!a.richtig?.includes(j) }));
      if (schnitt === null && abgaben.length && a.richtig?.length) {
        schnitt = mittel(antworten.map((t) => (pruefeWahl(a, t)?.teil ?? 0) * 100));
        stat.schnitt = schnitt; stat.quelle = 'vorschlag';
      }
    }
    return stat;
  });
}

const zelle = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** Notenliste der Klasse als CSV (Semikolon + BOM, öffnet in Excel mit deutschen Einstellungen). */
export function matrixCsv(m: Matrix, statusText: (s: Status) => string): string {
  const kopf = ['Name', 'In Klassenliste', ...m.spalten.flatMap((s) => [`${s.fall.titel}: Status`, `${s.fall.titel}: %`, `${s.fall.titel}: Note`]), 'Durchschnitt %'];
  const zeilen = m.zeilen.map((z) => [
    z.name, z.inListe ? 'ja' : 'nein',
    ...z.zellen.flatMap((c) => [statusText(c.status), c.prozent === null ? '' : String(c.prozent).replace('.', ','), c.note ?? '']),
    z.schnitt === null ? '' : String(z.schnitt).replace('.', ','),
  ]);
  return '﻿' + [kopf, ...zeilen].map((r) => r.map(zelle).join(';')).join('\r\n');
}
