// Laufender Diagnostik-Fall: Zustand, Befehle und Auswertung. Rein und deterministisch;
// die Oberfläche hält nur den Zustand und schickt Befehle.

import { bewerte, istKind, parameter } from '../../ui/sim/labor/parameter';
import { kumulativ, werteAuftrag, type Auftrag, type AuftragsErgebnis, type Ergebnis, type Flags, type Prioritaet, wahrerWert } from '../../ui/sim/labor/modell';
import { benoetigteRoehrchen, STANDARD_ABNAHME, type Abnahme } from '../../ui/sim/labor/praeanalytik';
import type { MonitorWerte } from '../../ui/sim/monitor';
import type { DiagnostikFall, Untersuchung } from './typen';

export interface UntersuchungLauf { serie: string; start: number; fertig: number; befundAb: number; vorbereitung: string[] }
export interface LogEintrag { minute: number; text: string; art: 'system' | 'eigen' }

export interface Lauf {
  fallId: string;
  minute: number;
  flags: Flags;
  auftraege: Auftrag[];
  untersuchungen: UntersuchungLauf[];
  /** Eigene Tipps je Serie */
  tipps: Record<string, { x: number; y: number; schicht: number; treffer?: string }[]>;
  gefunden: string[];
  aufgedeckt: string[];
  /** Parameter-ID@Minute des Befunds -> Minute der Quittung */
  quittiert: Record<string, number>;
  /** Parameter-ID@Auftrag -> Minute, zu der der kritische Wert ärztlich nachgemeldet wurde */
  gemeldet?: Record<string, number>;
  sbar?: { minute: number; fakten: string[] };
  massnahmen: { id: string; minute: number }[];
  antworten: Record<string, { richtig: boolean; wahl: string }>;
  log: LogEintrag[];
  beendet?: number;
  /** Minute, zu der der Monitor angeschlossen wurde (Fälle mit monitor.start = 'abwesend'). */
  monitorAn?: number;
  /** Minute, zu der der abgerutschte Fingersensor neu angelegt wurde. */
  sensorNeu?: number;
}

export type Befehl =
  | { typ: 'labor'; parameter: string[]; prioritaet: Prioritaet; abnahme: Abnahme }
  | { typ: 'warten'; minuten: number }
  | { typ: 'untersuchung'; serie: string; vorbereitung: string[] }
  | { typ: 'tipp'; serie: string; x: number; y: number; schicht: number; treffer?: string }
  | { typ: 'aufdecken'; serie: string }
  | { typ: 'quittieren'; schluessel: string }
  | { typ: 'sbar'; fakten: string[] }
  | { typ: 'melden'; schluessel: string }
  | { typ: 'massnahme'; id: string }
  | { typ: 'antwort'; frage: string; richtig: boolean; wahl: string }
  | { typ: 'notiz'; text: string }
  | { typ: 'monitor' }
  | { typ: 'sensor' }
  | { typ: 'beenden' };

export const ZEIT = { abnahme: 8, poct: 3, sbar: 5 };

export function starte(fall: DiagnostikFall): Lauf {
  return { fallId: fall.id, minute: 0, flags: {}, auftraege: [], untersuchungen: [], tipps: {}, gefunden: [], aufgedeckt: [], quittiert: {}, massnahmen: [], antworten: {}, log: [{ minute: 0, art: 'system', text: `Fall übernommen: ${fall.patient.name}, ${fall.patient.alter} Jahre. ${fall.patient.anlass}` }] };
}

const log = (l: Lauf, text: string, art: LogEintrag['art'] = 'system'): LogEintrag[] => [...l.log, { minute: l.minute, text, art }];

export function ergebnisse(l: Lauf, fall: DiagnostikFall): AuftragsErgebnis[] {
  return l.auftraege.map((a) => werteAuftrag(a, fall.labor, l.flags, fall.patient.geschlecht, istKind(fall.patient.alter)));
}

export const anrufSchluessel = (e: Ergebnis, a: Auftrag) => `${e.parameter}@${a.id}`;

/** Kritische Werte, die das Labor gerade telefonisch meldet und die noch nicht quittiert sind. */
export function offeneAnrufe(l: Lauf, fall: DiagnostikFall): { schluessel: string; ergebnis: Ergebnis }[] {
  const out: { schluessel: string; ergebnis: Ergebnis }[] = [];
  for (const a of ergebnisse(l, fall)) for (const e of a.ergebnisse) {
    if (e.anruf && e.fertig <= l.minute && l.quittiert[anrufSchluessel(e, a.auftrag)] === undefined) out.push({ schluessel: anrufSchluessel(e, a.auftrag), ergebnis: e });
  }
  return out;
}

/** Quittierte kritische Werte, die nach dem SBAR-Gespräch kamen und noch ärztlich nachgemeldet werden müssen. */
export function offeneMeldungen(l: Lauf, fall: DiagnostikFall): { schluessel: string; ergebnis: Ergebnis }[] {
  if (!l.sbar) return [];
  const out: { schluessel: string; ergebnis: Ergebnis }[] = [];
  for (const a of ergebnisse(l, fall)) for (const e of a.ergebnisse) {
    const k = anrufSchluessel(e, a.auftrag);
    if (e.anruf && l.quittiert[k] !== undefined && l.sbar.minute < e.fertig && l.gemeldet?.[k] === undefined) out.push({ schluessel: k, ergebnis: e });
  }
  return out;
}

/** Nächster Zeitpunkt, an dem ein Befund eintrifft (Labor oder Radiologie). */
export function naechsterBefund(l: Lauf, fall: DiagnostikFall): number | undefined {
  const zeiten = [
    ...ergebnisse(l, fall).flatMap((a) => a.ergebnisse.map((e) => e.fertig)),
    ...l.untersuchungen.map((u) => u.befundAb),
  ].filter((t) => t > l.minute);
  return zeiten.length ? Math.min(...zeiten) : undefined;
}

export function vitalwerte(l: Lauf, fall: DiagnostikFall): MonitorWerte {
  const w = (k: keyof DiagnostikFall['vital'], d = 0) => Number(wahrerWert(fall.vital[k], l.minute, l.flags).toFixed(d));
  return { puls: w('puls'), af: w('af'), spo2: w('spo2'), sys: w('sys'), dia: w('dia'), temp: w('temp', 1), sauerstoff: l.flags.o2 !== undefined };
}

function rueckt(l: Lauf, min: number): Lauf {
  return { ...l, minute: l.minute + min };
}

export function untersuchungVon(fall: DiagnostikFall, serie: string): Untersuchung | undefined {
  return fall.bildgebung.find((u) => u.serie.id === serie);
}

export function fuehreAus(l: Lauf, fall: DiagnostikFall, b: Befehl): Lauf {
  if (l.beendet !== undefined && b.typ !== 'antwort') return l;
  switch (b.typ) {
    case 'labor': {
      if (!b.parameter.length) return l;
      const venoes = b.parameter.some((id) => parameter(id).ort !== 'poct');
      const dauer = venoes ? ZEIT.abnahme : ZEIT.poct;
      const abnahme: Abnahme = { ...b.abnahme, vorAntibiose: l.flags.antibiose === undefined };
      const auftrag: Auftrag = { id: `a${l.auftraege.length + 1}`, parameter: [...b.parameter], prioritaet: b.prioritaet, minute: l.minute + dauer, abnahme };
      const namen = b.parameter.map((id) => parameter(id).kurz).join(', ');
      const n = rueckt(l, dauer);
      const flags = benoetigteRoehrchen(b.parameter).includes('blutkultur') && n.flags['bk-abgenommen'] === undefined ? { ...n.flags, 'bk-abgenommen': n.minute } : n.flags;
      return { ...n, flags, auftraege: [...l.auftraege, auftrag], log: log(n, `${venoes ? 'Blut abgenommen' : 'Patientennah gemessen'} (${b.prioritaet === 'notfall' ? 'Notfall' : 'Routine'}): ${namen}`) };
    }
    case 'warten': {
      const n = rueckt(l, Math.max(1, Math.round(b.minuten)));
      return { ...n, log: log(n, `${Math.round(b.minuten)} min vergangen`) };
    }
    case 'untersuchung': {
      const u = untersuchungVon(fall, b.serie);
      if (!u || l.untersuchungen.some((x) => x.serie === b.serie)) return l;
      const n = rueckt(l, u.dauer);
      return { ...n, untersuchungen: [...l.untersuchungen, { serie: b.serie, start: l.minute, fertig: n.minute, befundAb: n.minute + u.befundNach, vorbereitung: b.vorbereitung }], log: log(n, `${u.serie.untersuchung} durchgeführt`) };
    }
    case 'tipp': {
      const liste = [...(l.tipps[b.serie] ?? []), { x: b.x, y: b.y, schicht: b.schicht, treffer: b.treffer }];
      const gefunden = b.treffer && !l.gefunden.includes(b.treffer) && !l.aufgedeckt.includes(b.treffer) ? [...l.gefunden, b.treffer] : l.gefunden;
      return { ...l, tipps: { ...l.tipps, [b.serie]: liste }, gefunden };
    }
    case 'aufdecken': {
      // Auch das echte Vergleichsbild: nur dessen Befunde aufdecken, nicht die des synthetischen Bildes.
      const serie = fall.bildgebung.flatMap((u) => [u.serie, ...(u.echt ? [u.echt] : [])]).find((x) => x.id === b.serie);
      if (!serie) return l;
      const neu = serie.befunde.map((x) => x.id).filter((id) => !l.gefunden.includes(id) && !l.aufgedeckt.includes(id));
      return { ...l, aufgedeckt: [...l.aufgedeckt, ...neu] };
    }
    case 'quittieren': {
      if (l.quittiert[b.schluessel] !== undefined) return l;
      const [id] = b.schluessel.split('@');
      return { ...l, quittiert: { ...l.quittiert, [b.schluessel]: l.minute }, log: log(l, `Kritischer Wert ${parameter(id).name} telefonisch entgegengenommen, zurückgelesen und dokumentiert`) };
    }
    case 'sbar': {
      if (l.sbar) return l;
      const n = rueckt(l, ZEIT.sbar);
      return { ...n, sbar: { minute: l.minute, fakten: b.fakten }, log: log(n, 'Ärztin/Arzt per SBAR informiert, Anordnungen liegen vor') };
    }
    case 'melden': {
      if (!l.sbar || l.gemeldet?.[b.schluessel] !== undefined || l.quittiert[b.schluessel] === undefined) return l;
      const [id] = b.schluessel.split('@');
      const n = rueckt(l, 2);
      return { ...n, gemeldet: { ...l.gemeldet, [b.schluessel]: l.minute }, log: log(n, `Kritischen Wert ${parameter(id).name} ärztlich nachgemeldet`) };
    }
    case 'massnahme': {
      const a = fall.anordnungen.find((x) => x.id === b.id);
      if (!a || !l.sbar || l.flags[a.flag] !== undefined) return l;
      const n = rueckt(l, a.dauer);
      const zeit = l.minute + Math.min(a.dauer, 5);
      // Blutkulturen als Anordnung: dieselbe Probe geht auch ins Labor (sonst gäbe es nie einen Befund).
      const bk = a.flag === 'bk-abgenommen' && !l.auftraege.some((x) => x.parameter.includes('bk'))
        ? [{ id: `a${l.auftraege.length + 1}`, parameter: ['bk'], prioritaet: 'notfall' as Prioritaet, minute: zeit, abnahme: { ...STANDARD_ABNAHME, vorAntibiose: l.flags.antibiose === undefined } }]
        : [];
      return { ...n, flags: { ...n.flags, [a.flag]: zeit }, auftraege: [...l.auftraege, ...bk], massnahmen: [...l.massnahmen, { id: a.id, minute: l.minute }], log: log(n, `Durchgeführt: ${a.label}`) };
    }
    case 'antwort':
      if (l.antworten[b.frage]) return l;
      return { ...l, antworten: { ...l.antworten, [b.frage]: { richtig: b.richtig, wahl: b.wahl } } };
    case 'monitor': {
      if (fall.monitor?.start !== 'abwesend' || l.monitorAn !== undefined) return l;
      const n = rueckt(l, 3);
      return { ...n, monitorAn: n.minute, log: log(n, 'Monitor angeschlossen: EKG-Elektroden, Fingersensor, Blutdruckmanschette (Intervall 15 min)') };
    }
    case 'sensor': {
      if (monitorZustand(l, fall) !== 'signalausfall') return l;
      const n = rueckt(l, 1);
      return { ...n, sensorNeu: n.minute, log: log(n, 'Fingersensor war abgerutscht, neu angelegt; SpO₂-Kurve wieder sauber') };
    }
    case 'notiz':
      return b.text.trim() ? { ...l, log: log(l, b.text.trim(), 'eigen') } : l;
    case 'beenden':
      return { ...l, beendet: l.minute, log: log(l, 'Fall beendet') };
  }
}

export type MonitorStatus = 'abwesend' | 'laeuft' | 'signalausfall';

/** Zustand des Monitors am Bett: nicht angeschlossen, läuft, oder Fingersensor abgerutscht (nur SpO₂ fällt aus). */
export function monitorZustand(l: Lauf, fall: DiagnostikFall): MonitorStatus {
  const m = fall.monitor;
  if (!m) return 'laeuft';
  if (m.start === 'abwesend' && l.monitorAn === undefined) return 'abwesend';
  const seit = m.start === 'abwesend' ? l.monitorAn! : 0;
  if (m.sensorAusfallNach !== undefined && l.sensorNeu === undefined && l.minute >= seit + m.sensorAusfallNach) return 'signalausfall';
  return 'laeuft';
}

/** Kumulativbefund zum aktuellen Zeitpunkt. */
export function befundReihen(l: Lauf, fall: DiagnostikFall) {
  return kumulativ(ergebnisse(l, fall), fall.labor, l.minute);
}

export interface Punkt { ok: boolean | null; titel: string; text: string }

export function auswertung(l: Lauf, fall: DiagnostikFall): Punkt[] {
  const p: Punkt[] = [];
  const erg = ergebnisse(l, fall);
  const angefordert = new Set(l.auftraege.flatMap((a) => a.parameter));
  const fehlt = fall.empfohlen.filter((id) => !angefordert.has(id));
  p.push({ ok: fehlt.length === 0, titel: 'Sinnvolle Laborwerte', text: fehlt.length ? `Es fehlten: ${fehlt.map((id) => parameter(id).name).join(', ')}.` : 'Alle wegweisenden Werte angefordert.' });

  const fehler = erg.flatMap((a) => a.fehler.map((f) => ({ f, a })));
  if (l.auftraege.length) p.push({ ok: fehler.length === 0, titel: 'Präanalytik', text: fehler.length ? fehler.map(({ f, a }) => `${f.titel} (Abnahme ${a.auftrag.id.slice(1)}): ${f.folge}`).join(' ') : 'Alle Proben sauber gewonnen: Identität, Stauzeit, Gegenarm, Reihenfolge, Füllung, Transport.' });

  const kritisch = erg.flatMap((a) => a.ergebnisse.filter((e) => e.anruf && e.fertig <= l.minute).map((e) => ({ e, k: anrufSchluessel(e, a.auftrag) })));
  for (const { e, k } of kritisch) {
    const q = l.quittiert[k];
    const pp = parameter(e.parameter);
    // Gemeldet zählt nur, wenn die Meldung nach Eintreffen des Werts kam (SBAR danach oder eigene Nachmeldung).
    const meldung = l.gemeldet?.[k] ?? (l.sbar && l.sbar.minute >= e.fertig ? l.sbar.minute : undefined);
    const text = q === undefined ? `Der Laboranruf zu ${pp.name} wurde nicht entgegengenommen.` : `${pp.name} nach ${q - e.fertig} min quittiert${meldung !== undefined ? `, ärztlich gemeldet nach ${meldung - e.fertig} min.` : l.sbar ? ', aber nicht ärztlich nachgemeldet (das SBAR-Gespräch lag vor dem Befund).' : ', aber nicht ärztlich weitergegeben.'}${e.verfaelscht ? ' Achtung: der Wert war durch die Präanalytik verfälscht.' : ''}`;
    p.push({ ok: q !== undefined && meldung !== undefined, titel: 'Kritischer Wert', text });
  }

  for (const u of fall.bildgebung) {
    const ul = l.untersuchungen.find((x) => x.serie === u.serie.id);
    if (!ul) continue;
    const fehlend = u.vorbereitung.filter((v) => v.noetig && !ul.vorbereitung.includes(v.id));
    const unnoetig = u.vorbereitung.filter((v) => !v.noetig && ul.vorbereitung.includes(v.id));
    const nierenwert = erg.some((a) => a.ergebnisse.some((e) => (e.parameter === 'krea' || e.parameter === 'egfr') && e.wert !== undefined && e.fertig <= ul.start));
    const nichtBelegt = ul.vorbereitung.includes('niere') && u.kontrastmittel && !nierenwert;
    p.push({ ok: !fehlend.length && !unnoetig.length && !nichtBelegt, titel: `Vorbereitung: ${u.serie.titel}`, text: [
      fehlend.length ? `Vergessen: ${fehlend.map((v) => `${v.text} (${v.warum})`).join(' ')}` : '',
      unnoetig.length ? `Nicht nötig: ${unnoetig.map((v) => `${v.text} (${v.warum})`).join(' ')}` : '',
      nichtBelegt ? 'Du hast „Kreatinin liegt vor“ abgehakt, es gab vor der Untersuchung aber noch keinen Nierenwert.' : '',
    ].filter(Boolean).join(' ') || 'Vollständig und ohne unnötige Schritte.' });
    const befunde = u.serie.befunde;
    const selbst = befunde.filter((b) => l.gefunden.includes(b.id));
    p.push({ ok: selbst.length === befunde.length, titel: `Befunde im Bild: ${u.serie.titel}`, text: `${selbst.length} von ${befunde.length} selbst gefunden${befunde.length > selbst.length ? `: offen ${befunde.filter((b) => !selbst.includes(b)).map((b) => b.titel).join(', ')}` : ''}.` });
  }

  if (l.sbar) {
    const relevant = fall.sbar.filter((s) => s.relevant);
    const fehlen = relevant.filter((s) => !l.sbar!.fakten.includes(s.id));
    const zuviel = fall.sbar.filter((s) => !s.relevant && l.sbar!.fakten.includes(s.id));
    p.push({ ok: !fehlen.length && !zuviel.length, titel: 'SBAR-Übergabe', text: [fehlen.length ? `Gefehlt: ${fehlen.map((s) => s.text).join(' · ')}` : 'Alle wichtigen Punkte genannt.', zuviel.length ? `Unnötig oder irreführend: ${zuviel.map((s) => s.text).join(' · ')}` : ''].filter(Boolean).join(' ') });
  } else p.push({ ok: false, titel: 'SBAR-Übergabe', text: 'Die Ärztin oder der Arzt wurde nicht informiert, deshalb gab es keine Anordnungen.' });

  for (const [zuerst, danach, warum] of fall.reihenfolge ?? []) {
    const a = l.flags[zuerst], b = l.flags[danach];
    if (b === undefined) continue;
    p.push({ ok: a !== undefined && a <= b, titel: 'Reihenfolge', text: a !== undefined && a <= b ? `Richtig: ${warum}` : `Nicht eingehalten. ${warum}` });
  }
  const offen = fall.anordnungen.filter((a) => l.flags[a.flag] === undefined);
  if (l.sbar) p.push({ ok: !offen.length, titel: 'Anordnungen umgesetzt', text: offen.length ? `Offen: ${offen.map((a) => a.label).join(', ')}.` : `Alle umgesetzt, ${l.massnahmen.length ? `erste nach ${l.massnahmen[0].minute - l.sbar.minute} min` : ''}.` });

  const beantwortet = fall.fragen.filter((f) => l.antworten[f.id]);
  if (beantwortet.length) p.push({ ok: beantwortet.every((f) => l.antworten[f.id].richtig), titel: 'Lernfragen', text: `${beantwortet.filter((f) => l.antworten[f.id].richtig).length} von ${beantwortet.length} richtig.` });
  return p;
}

/** Wert eines Parameters, der gerade auf dem Monitor/Befund steht (für Hinweise). */
export function letzterWert(l: Lauf, fall: DiagnostikFall, id: string): { wert: number; flag: ReturnType<typeof bewerte> } | undefined {
  const r = befundReihen(l, fall)[id];
  if (!r?.length) return undefined;
  const w = r[r.length - 1].wert;
  return { wert: w, flag: bewerte(parameter(id), w, fall.patient.geschlecht, istKind(fall.patient.alter)) };
}
