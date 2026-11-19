// Praxissimulator neu – Auswertung (Paket P5). Rein und deterministisch: Fall + Zustand (Event-Log) → Ergebnis.
// Prozent je PflAPrV-Kompetenzbereich I–V, in Spur B zusätzlich klinische Bereiche (KONZEPT 8).
// Bewertet werden Pflichthandlungen nach Gewicht, Pflegefehler nach Schwere, Grenzüberschreitungen,
// Warnungen und Tipps der Praxisanleitung (Impulse ohne Abzug), Rücklesen, Remonstration und der Abschluss
// (Pflegebedarf mit Reihenfolge, Verdacht in Spur B, SBAR-Übergabe).
// Die Zeitleiste entsteht per Replay der Eingaben; Wartezeiten werden dabei in Takt-Stücke geteilt
// (gleiches Ergebnis wie am Stück, Test in auswertung.test.ts), damit die Werte im 5-s-Raster vorliegen.

import { istMedFehler, medFehlerText } from './akte';
import { anzeige, gilt, massnahme, sende, start, TAKT_SEK, type SimZustand } from './kern';
import type { Bedingung, FallV2, KB, KlinischerBereich, SbarBaustein, SimEventEingabe } from './typen';

export type Bereich = KB | KlinischerBereich;

export const KB_NAME: Record<KB, string> = {
  I: 'Pflegeprozess und Pflegediagnostik',
  II: 'Kommunikation und Beratung',
  III: 'Intra- und interprofessionelles Handeln',
  IV: 'Gesetze, Verordnungen und ethische Leitlinien',
  V: 'Wissenschaftliche Erkenntnisse und berufsethische Werte',
};
export const KLINISCH_NAME: Record<KlinischerBereich, string> = {
  abcde: 'ABCDE und Priorisierung',
  geraete: 'Geräte- und Alarmsicherheit',
  medikamente: 'Medikamentensicherheit',
  team: 'Teamkommunikation',
  zeit: 'Zeit',
};
export const KBS: readonly KB[] = ['I', 'II', 'III', 'IV', 'V'];
export const KLINISCHE: readonly KlinischerBereich[] = ['abcde', 'geraete', 'medikamente', 'team', 'zeit'];

/** Abzug je Pflegefehler nach Schwere (in Gewichtspunkten, wie Pflichthandlungen 1–3). */
export const ABZUG_FEHLER = { leicht: 1, mittel: 2, schwer: 4 } as const;
export const ABZUG_GRENZE = 3;
/** Medikationsfehler gegen den Plan (P13): Doppelgabe und Höchstmenge schwer, zu kurzer Abstand mittel */
export const MED_SCHWERE = (id: string): 'mittel' | 'schwer' => (id.startsWith('med-abstand:') ? 'mittel' : 'schwer');
export const ABZUG_GRENZE_SCHADEN = 4;
export const ABZUG_PA_WARNT = 1;
export const ABZUG_PA_TIPP = 0.5;
/** Gewicht der Abschluss-Blöcke */
export const GEWICHT = { entscheidung: 2, pflegebedarf: 3, verdacht: 2, uebergabe: 2, remonstration: 3, ruecklesen: 1 } as const;

export type BeitragArt = 'pflicht' | 'entscheidung' | 'fehler' | 'grenze' | 'pa' | 'ruecklesen' | 'remonstration' | 'pflegebedarf' | 'verdacht' | 'uebergabe';

/** Ein bewerteter Punkt. Prozent je Bereich = (Σ erreicht − Σ abzug) / Σ möglich über alle Beiträge des Bereichs. */
export interface Beitrag {
  id: string;
  art: BeitragArt;
  text: string;
  bereiche: Bereich[];
  moeglich: number;
  erreicht: number;
  abzug: number;
  urteil: 'gut' | 'teilweise' | 'fehler' | 'info';
  warum: string;
  deine?: string;
  besser?: string;
  /** Spielzeit in Sekunden */
  t?: number;
  /** nur Pflicht: 1–3 */
  gewicht?: 1 | 2 | 3;
}

export interface BereichErgebnis {
  id: Bereich;
  name: string;
  /** null = in diesem Fall nicht beurteilt */
  prozent: number | null;
  moeglich: number;
  erreicht: number;
  abzug: number;
}

export interface VerpassteKritische {
  id: string;
  text: string;
  warum: string;
  /** „spätestens“-Zeitpunkt aus der Bedingung, sonst Fallende */
  bisT: number;
  ausBedingung: boolean;
}

export interface ZeitPunkt {
  t: number;
  hf: number; rrSys: number; rrDia: number; spo2: number; af: number; temp: number;
  map?: number; laktat?: number;
}
export interface ZeitMarke {
  t: number;
  text: string;
  art: SimEventEingabe['art'] | 'fehler' | 'grenze' | 'ereignis';
  /** false: die PA hat gestoppt oder es ging nicht (z. B. Gerät fehlt) */
  ausgefuehrt: boolean;
}
export interface Zeitleiste { punkte: ZeitPunkt[]; marken: ZeitMarke[]; ende: number }

export interface KernAuswertung {
  fallId: string;
  spur: FallV2['spur'];
  gesamt: number;
  kb: BereichErgebnis[];
  /** nur Spur B */
  klinisch: BereichErgebnis[];
  beitraege: Beitrag[];
  verpassteKritische: VerpassteKritische[];
  paImpulse: number;
  paTipps: number;
  ergebnis: { stufe: 'stabil' | 'unsicher' | 'kritisch'; text: string };
  zeitleiste: Zeitleiste;
}

/* ─────────────────────────── Hilfen ─────────────────────────── */

const runde = (n: number) => Math.round(n * 10) / 10;

/** Alle Maßnahme-IDs, auf die sich eine Bedingung bezieht (getan/nichtGetan). */
export function massnahmenIn(b: Bedingung, out: string[] = []): string[] {
  if ('alle' in b) b.alle.forEach((x) => massnahmenIn(x, out));
  else if ('eine' in b) b.eine.forEach((x) => massnahmenIn(x, out));
  else if ('nicht' in b) massnahmenIn(b.nicht, out);
  else if ('getan' in b) out.push(b.getan);
  else if ('nichtGetan' in b) out.push(b.nichtGetan);
  return out;
}
const enthaelt = (b: Bedingung, art: 'gemeldet' | 'nicht'): boolean =>
  art in b || ('alle' in b && b.alle.some((x) => enthaelt(x, art))) || ('eine' in b && b.eine.some((x) => enthaelt(x, art))) || ('nicht' in b && (art === 'nicht' || enthaelt(b.nicht, art)));

/** Größte Frist „bis“ in einer Bedingung (für „spätestens“). */
function frist(b: Bedingung): number | undefined {
  if ('alle' in b || 'eine' in b) {
    const l = ('alle' in b ? b.alle : b.eine).map(frist).filter((x): x is number => x !== undefined);
    return l.length ? Math.max(...l) : undefined;
  }
  if ('getan' in b) return b.bis;
  if ('nichtGetan' in b) return b.bis;
  return undefined;
}

/** Klinische Bereiche einer Bedingung über die Maßnahmen darin (Spur B, Fehler ohne eigene Zuordnung). */
function klinischAus(fall: FallV2, b: Bedingung): KlinischerBereich[] {
  const s = new Set<KlinischerBereich>();
  for (const id of massnahmenIn(b)) for (const k of massnahme(fall, id)?.klinisch ?? []) s.add(k);
  return [...s];
}

/** Lesbarer Name einer Eingabe (Zeitleiste, Protokoll, Tutor). */
export function eingabeText(fall: FallV2, e: SimEventEingabe): string {
  switch (e.art) {
    case 'massnahme': return massnahme(fall, e.id)?.name ?? e.id;
    case 'frage': return `Gespräch: ${fall.gespraech.find((g) => g.id === e.id)?.frage ?? e.id}`;
    case 'pflegetasche': return `Aus der Pflegetasche geholt: ${e.geraet}`;
    case 'anruf': return `${fall.arzt.name} angerufen: ${e.sbar.map((id) => fall.sbar.find((s) => s.id === id)?.text ?? id).join(' · ') || 'ohne Inhalt'}`;
    case 'rueckmelden': return `Anordnung ${e.rueckgelesen ? 'rückgelesen' : 'ohne Rücklesen übernommen'}: ${fall.anordnungen.find((a) => a.id === e.anordnung)?.text ?? e.anordnung}`;
    case 'remonstrieren': return `Anordnung hinterfragt: ${fall.anordnungen.find((a) => a.id === e.anordnung)?.text ?? e.anordnung}`;
    case 'pa-fragen': return 'Praxisanleitung gefragt';
    case 'anleitung-anfordern': return `Praxisanleitung dazugeholt: ${massnahme(fall, e.massnahme)?.name ?? e.massnahme}`;
    case 'entscheidung': {
      const ev = fall.ereignisse.find((x) => x.id === e.ereignis);
      return `Entscheidung: ${ev?.entscheidung?.find((o) => o.id === e.wahl)?.text ?? e.wahl}`;
    }
    case 'warten': return `${e.sek} s gewartet`;
    case 'abschluss': return 'Fall abgeschlossen';
    // Runde 2 (P11/P13): der Kern setzt sie um; Texte hier vorläufig, P11/P13 verfeinern
    case 'nachricht': return `Nachricht an ${e.an}: ${e.bausteine.map((id) => fall.sbar.find((s) => s.id === id)?.text ?? id).join(' · ') || e.freitext || 'ohne Inhalt'}`;
    case 'auflegen': return `Gespräch mit ${e.an} beendet`;
    case 'dokumentieren': return 'Im Pflegebericht dokumentiert';
  }
}

/* ─────────────────────────── Zeitleiste (Replay) ─────────────────────────── */

/** Wartezeiten in Takt-Stücke teilen (min(5, Rest)); ergibt denselben Zustand wie am Stück. */
export function inTakten(eingaben: readonly SimEventEingabe[]): SimEventEingabe[] {
  const out: SimEventEingabe[] = [];
  for (const e of eingaben) {
    if (e.art !== 'warten') { out.push(e); continue; }
    for (let rest = e.sek; rest > 0; rest -= TAKT_SEK) out.push({ art: 'warten', sek: Math.min(TAKT_SEK, rest) });
  }
  return out;
}

function punkt(z: SimZustand): ZeitPunkt {
  const a = anzeige(z);
  return {
    t: z.t, hf: a.hf, rrSys: a.rrSys, rrDia: a.rrDia, spo2: a.spo2, af: a.af, temp: a.temp,
    ...(a.map !== undefined ? { map: a.map } : {}), ...(a.laktat !== undefined ? { laktat: a.laktat } : {}),
  };
}

interface Replay { zeitleiste: Zeitleiste; ende: SimZustand; /** Pflicht-ID → [erstmals erfüllt, Beginn der letzten erfüllten Strecke] */ pflichtZeit: Record<string, { erst?: number; letzte?: number }> }

function spieleNach(z: SimZustand): Replay {
  const fall = z.fall;
  let s = start(fall, z.rolle, z.stufe, z.seed);
  const punkte: ZeitPunkt[] = [punkt(s)];
  const marken: ZeitMarke[] = [];
  const pflichtZeit: Replay['pflichtZeit'] = {};
  const merkePflicht = () => {
    for (const p of fall.bewertung.pflicht) {
      const pz = (pflichtZeit[p.id] ??= {});
      if (gilt(s, p.erfuellt)) { pz.erst ??= s.t; pz.letzte ??= s.t; } else pz.letzte = undefined;
    }
  };
  merkePflicht();
  for (const e of inTakten(z.eingaben)) {
    const vorher = s;
    s = sende(s, e);
    if (e.art !== 'warten' && e.art !== 'abschluss') {
      const getanVorher = e.art === 'massnahme' ? (vorher.getan[e.id]?.length ?? 0) : 0;
      const ausgefuehrt = e.art === 'massnahme' ? (s.getan[e.id]?.length ?? 0) > getanVorher : s !== vorher;
      marken.push({ t: vorher.t, text: eingabeText(fall, e), art: e.art, ausgefuehrt });
    }
    for (const l of s.log.slice(vorher.log.length)) {
      if (l.art === 'fehler') marken.push({ t: l.t, text: fall.bewertung.fehler.find((f) => f.id === l.id)?.text ?? medFehlerText(fall, l.id) ?? l.id, art: 'fehler', ausgefuehrt: true });
      else if (l.art === 'grenzueberschreitung') marken.push({ t: l.t, text: `Grenze überschritten: ${massnahme(fall, l.massnahmeId)?.name ?? l.massnahmeId}`, art: 'grenze', ausgefuehrt: true });
      else if (l.art === 'ereignis') marken.push({ t: l.t, text: fall.ereignisse.find((x) => x.id === l.id)?.text ?? l.id, art: 'ereignis', ausgefuehrt: true });
    }
    if (s.t !== punkte.at(-1)!.t) punkte.push(punkt(s));
    merkePflicht();
  }
  return { zeitleiste: { punkte, marken, ende: s.t }, ende: s, pflichtZeit };
}

/** Zeitleiste der Werte mit eigenen Handlungen (Replay der Eingaben im 5-s-Raster). */
export const zeitleiste = (z: SimZustand): Zeitleiste => spieleNach(z).zeitleiste;

/* ─────────────────────────── Abschluss ─────────────────────────── */

/** Bausteine, die am Ende bekannt sein können (S, B, A; die Empfehlung gehört zum Anruf). */
export function uebergabeBausteine(z: SimZustand): SbarBaustein[] {
  return z.fall.sbar.filter((b) => b.teil !== 'R' && (!b.bekanntWenn || gilt(z, b.bekanntWenn)));
}

function pflegebedarfBeitrag(z: SimZustand): Beitrag {
  const pb = z.fall.pflegebedarf;
  const ab = z.abschluss;
  const gewaehlt = ab?.probleme ?? [];
  let summe = 0, max = 0;
  const fehlend: string[] = [], falsch: string[] = [];
  for (const p of pb.probleme) {
    const w = p.prioritaet === 1 ? 2 : 1;
    max += w;
    const g = gewaehlt.includes(p.id);
    if (g === p.richtig) summe += w;
    else if (p.richtig) fehlend.push(p.text); else falsch.push(p.text);
  }
  const ziele = ab?.ziele ?? [];
  for (const zl of pb.ziele) {
    max += 1;
    if (ziele.includes(zl.id) === zl.richtig) summe += 1;
    else if (!zl.richtig) falsch.push(`Ziel: ${zl.text}`);
  }
  // Reihenfolge: gewählte, zutreffende Probleme sollen nach Priorität geordnet sein (Paarvergleich)
  const geordnet = gewaehlt.map((id) => pb.probleme.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p?.richtig && !!p.prioritaet);
  let paare = 0, richtig = 0;
  for (let i = 0; i < geordnet.length; i++) for (let j = i + 1; j < geordnet.length; j++) {
    paare++;
    if (geordnet[i]!.prioritaet! <= geordnet[j]!.prioritaet!) richtig++;
  }
  max += 1;
  const reihenfolgeOk = paare === 0 ? geordnet.length > 0 : richtig / paare;
  summe += typeof reihenfolgeOk === 'number' ? reihenfolgeOk : reihenfolgeOk ? 1 : 0;
  const r = ab ? summe / max : 0;
  const erreicht = runde(GEWICHT.pflegebedarf * r);
  const top = pb.probleme.filter((p) => p.richtig && p.prioritaet === 1).map((p) => p.text);
  return {
    id: 'abschluss:pflegebedarf', art: 'pflegebedarf', text: 'Pflegebedarf erhoben und priorisiert', bereiche: ['I'],
    moeglich: GEWICHT.pflegebedarf, erreicht, abzug: 0, urteil: r >= 0.9 ? 'gut' : r >= 0.6 ? 'teilweise' : 'fehler',
    deine: ab ? `${gewaehlt.length} Probleme, ${ziele.length} Ziele gewählt${fehlend.length ? `; gefehlt: ${fehlend.join(', ')}` : ''}${falsch.length ? `; unpassend: ${falsch.join(', ')}` : ''}` : 'Kein Pflegebedarf festgehalten',
    ...(r >= 0.9 ? {} : { besser: `Zuerst: ${top.join(' und ')}` }),
    warum: 'Pflegebedarf erheben ist eine vorbehaltene Aufgabe (§ 4 PflBG). Die dringendsten Probleme gehören nach oben, Ziele müssen zu den Problemen passen.',
    ...(ab && z.ende ? { t: z.ende.t } : {}),
  };
}

function verdachtBeitrag(z: SimZustand): Beitrag | undefined {
  const v = z.fall.verdacht;
  if (!v) return undefined;
  const ab = z.abschluss;
  const richtigeOption = v.optionen.find((o) => o.richtig);
  const optionOk = !!ab?.verdacht && v.optionen.find((o) => o.id === ab.verdacht)?.richtig === true;
  const gew = ab?.begruendung ?? [];
  let summe = optionOk ? 2 : 0, max = 2;
  for (const b of v.begruendungen) {
    max += 1;
    const stuetzt = !!richtigeOption && b.stuetzt.includes(richtigeOption.id);
    if (gew.includes(b.id) === stuetzt) summe += 1;
  }
  const r = ab?.verdacht ? summe / max : 0;
  return {
    id: 'abschluss:verdacht', art: 'verdacht', text: 'Verdacht mit Begründung', bereiche: ['I', 'V'],
    moeglich: GEWICHT.verdacht, erreicht: runde(GEWICHT.verdacht * r), abzug: 0, urteil: r >= 0.9 ? 'gut' : optionOk ? 'teilweise' : 'fehler',
    deine: ab?.verdacht ? `${v.optionen.find((o) => o.id === ab.verdacht)?.text ?? ab.verdacht}${gew.length ? `, weil ${gew.map((id) => v.begruendungen.find((b) => b.id === id)?.text ?? id).join('; ')}` : ' (ohne Begründung)'}` : 'Kein Verdacht angegeben',
    ...(r >= 0.9 || !richtigeOption ? {} : { besser: `${richtigeOption.text}, weil ${v.begruendungen.filter((b) => b.stuetzt.includes(richtigeOption.id)).map((b) => b.text).join('; ')}` }),
    warum: 'Die Pflege stellt keine ärztliche Diagnose, begründet aber ihren Verdacht mit eigenen Beobachtungen und Messwerten. So wird er im Team ernst genommen.',
  };
}

function uebergabeBeitrag(z: SimZustand): Beitrag {
  const bekannt = uebergabeBausteine(z);
  const kern = bekannt.filter((b) => b.art === 'kern');
  const gew = new Set(z.abschluss?.sbar ?? []);
  const kernDrin = kern.filter((b) => gew.has(b.id));
  const falsch = bekannt.filter((b) => b.art === 'falsch' && gew.has(b.id));
  const ablenker = bekannt.filter((b) => b.art === 'ablenker' && gew.has(b.id));
  const r = !z.abschluss?.sbar ? 0 : kern.length === 0 ? 1 : Math.max(0, Math.min(1, (kernDrin.length - falsch.length - 0.5 * ablenker.length) / kern.length));
  const fehlt = kern.filter((b) => !gew.has(b.id));
  const spurB = z.fall.spur === 'B';
  return {
    id: 'abschluss:uebergabe', art: 'uebergabe', text: 'Übergabe nach SBAR', bereiche: spurB ? ['II', 'team'] : ['II'],
    moeglich: GEWICHT.uebergabe, erreicht: runde(GEWICHT.uebergabe * r), abzug: 0,
    urteil: r >= 0.9 ? 'gut' : r >= 0.5 ? 'teilweise' : 'fehler',
    deine: z.abschluss?.sbar ? `${kernDrin.length} von ${kern.length} wichtigen Punkten${falsch.length ? `, falsch: ${falsch.map((b) => b.text).join('; ')}` : ''}${ablenker.length ? `, unnötig: ${ablenker.map((b) => b.text).join('; ')}` : ''}` : 'Keine Übergabe zusammengestellt',
    ...(r >= 0.9 ? {} : { besser: fehlt.length ? `Hinein gehört auch: ${fehlt.map((b) => b.text).join(' · ')}` : 'Falsches und Unnötiges weglassen.' }),
    warum: 'Eine Übergabe enthält, was die nächste Person für sichere Weiterversorgung braucht: Lage, Hintergrund und deine Einschätzung mit Werten. Ablenker kosten Aufmerksamkeit.',
  };
}

/* ─────────────────────────── Auswertung ─────────────────────────── */

export function bewerte(z: SimZustand): KernAuswertung {
  const fall = z.fall;
  const spurB = fall.spur === 'B';
  const { zeitleiste: zl, pflichtZeit } = spieleNach(z);
  const endeT = z.t;
  const beitraege: Beitrag[] = [];
  const mitKlinisch = (kb: KB[], k: KlinischerBereich[] | undefined): Bereich[] => (spurB ? [...kb, ...(k ?? [])] : [...kb]);
  const verpasste: VerpassteKritische[] = [];

  // Pflichthandlungen nach Gewicht
  for (const p of fall.bewertung.pflicht) {
    const pz = pflichtZeit[p.id] ?? {};
    const amEnde = gilt(z, p.erfuellt);
    const erfuellt = amEnde || (enthaelt(p.erfuellt, 'gemeldet') && pz.erst !== undefined);
    const tErfuellt = amEnde ? pz.letzte : pz.erst;
    const ohneZeit = enthaelt(p.erfuellt, 'nicht') && tErfuellt === 0;
    const f = frist(p.erfuellt);
    beitraege.push({
      id: `pflicht:${p.id}`, art: 'pflicht', text: p.text, bereiche: mitKlinisch(p.kompetenzbereiche, p.klinisch),
      moeglich: p.gewicht, erreicht: erfuellt ? p.gewicht : 0, abzug: 0, urteil: erfuellt ? 'gut' : 'fehler', warum: p.warum, gewicht: p.gewicht,
      ...(erfuellt && tErfuellt !== undefined && !ohneZeit ? { t: tErfuellt } : {}),
      ...(!erfuellt ? { deine: 'Nicht erfüllt', ...(f !== undefined ? { t: f } : {}) } : {}),
    });
    if (!erfuellt && p.gewicht === 3) verpasste.push({ id: p.id, text: p.text, warum: p.warum, bisT: f ?? endeT, ausBedingung: f !== undefined });
  }

  // Entscheidungsmomente: gut voll, vertretbar halb, falsch nichts, gefährlich mit Abzug
  for (const e of z.log) {
    if (e.art !== 'entscheidung') continue;
    const ev = fall.ereignisse.find((x) => x.id === e.ereignis);
    const o = ev?.entscheidung?.find((x) => x.id === e.wahl);
    if (!ev || !o) continue;
    const gut = ev.entscheidung!.find((x) => x.wertung === 'gut');
    const erreicht = o.wertung === 'gut' ? GEWICHT.entscheidung : o.wertung === 'vertretbar' ? GEWICHT.entscheidung / 2 : 0;
    beitraege.push({
      id: `entscheidung:${ev.id}`, art: 'entscheidung', text: ev.text, bereiche: ['I'], moeglich: GEWICHT.entscheidung, erreicht,
      abzug: o.wertung === 'gefaehrlich' ? 2 : 0, urteil: o.wertung === 'gut' ? 'gut' : o.wertung === 'vertretbar' ? 'teilweise' : 'fehler',
      deine: o.text, ...(o.wertung !== 'gut' && gut ? { besser: gut.text } : {}), warum: o.wertung === 'gut' || !gut ? o.warum : `${o.warum} ${gut.warum}`, t: e.t,
    });
  }

  // Pflegefehler nach Schwere
  for (const id of z.fehlerAus) {
    const f = fall.bewertung.fehler.find((x) => x.id === id);
    if (!f) continue;
    const t = z.log.find((e) => e.art === 'fehler' && e.id === id)?.t;
    beitraege.push({
      id: `fehler:${f.id}`, art: 'fehler', text: f.text, bereiche: mitKlinisch(f.kompetenzbereiche, klinischAus(fall, f.wenn)),
      moeglich: 0, erreicht: 0, abzug: ABZUG_FEHLER[f.schwere], urteil: 'fehler', warum: f.warum,
      deine: `Pflegefehler (${f.schwere})${f.folge ? `: ${f.folge.text}` : ''}`, ...(t !== undefined ? { t } : {}),
    });
  }

  // Medikationsfehler gegen den Plan (P13): Doppelgabe, Abstand, Höchstmenge
  for (const id of z.fehlerAus) {
    if (!istMedFehler(id)) continue;
    const schwere = MED_SCHWERE(id);
    const t = z.log.find((e) => e.art === 'fehler' && e.id === id)?.t;
    const meldung = z.meldungen.find((m) => m.art === 'fehler' && m.quelle === id)?.text;
    beitraege.push({
      id: `fehler:${id}`, art: 'fehler', text: medFehlerText(fall, id) ?? id, bereiche: mitKlinisch(['I', 'III'], ['medikamente']),
      moeglich: 0, erreicht: 0, abzug: ABZUG_FEHLER[schwere], urteil: 'fehler',
      warum: 'Vor jeder Gabe den Medikationsplan prüfen: letzte Gabe, Abstand, Tageshöchstmenge (6-R-Regel, richtige Zeit).',
      deine: `Medikationsfehler (${schwere})${meldung ? `: ${meldung}` : ''}`, ...(t !== undefined ? { t } : {}),
    });
  }

  // Grenzüberschreitungen (Stufe 3) und Warnungen der PA (Stufe 2)
  z.log.forEach((e, i) => {
    if (e.art === 'grenzueberschreitung') {
      const m = massnahme(fall, e.massnahmeId);
      const schaden = m?.risikoBeiUeberschreitung === 'patientenschaden';
      beitraege.push({
        id: `grenze:${i}`, art: 'grenze', text: `Befugnis überschritten: ${m?.name ?? e.massnahmeId}`,
        bereiche: mitKlinisch(['III', 'IV'], m?.klinisch), moeglich: 0, erreicht: 0, abzug: schaden ? ABZUG_GRENZE_SCHADEN : ABZUG_GRENZE, urteil: 'fehler', t: e.t,
        deine: `Ohne ${e.befugnis === 'nur-aerztlich' ? 'ärztliche Durchführung' : e.befugnis === 'gesperrt' ? 'Pflegefachperson' : e.befugnis === 'mit-anleitung' ? 'Praxisanleitung' : 'Anordnung'} ausgeführt`,
        besser: e.befugnis === 'nur-aerztlich' ? 'Ärztin rufen, vorbereiten und assistieren.' : e.befugnis === 'mit-anleitung' ? 'Praxisanleitung dazuholen.' : e.befugnis === 'gesperrt' ? 'Zuschauen und sich zeigen lassen.' : 'Erst Anordnung einholen und rücklesen.',
        warum: 'Wer ausführt, trägt die Durchführungsverantwortung. Außerhalb der eigenen Befugnis gefährdest du die Person und dich.',
      });
    } else if (e.art === 'pa-eingriff' && e.typ === 'warnt') {
      const m = massnahme(fall, e.massnahmeId);
      beitraege.push({
        id: `pa-warnt:${i}`, art: 'pa', text: `Praxisanleitung musste stoppen: ${m?.name ?? e.massnahmeId}`, bereiche: ['III'],
        moeglich: 0, erreicht: 0, abzug: ABZUG_PA_WARNT, urteil: 'teilweise', t: e.t,
        warum: 'Vor dem Handeln klären: Darf ich das selbst, nur mit Anleitung, oder braucht es eine Anordnung?',
      });
    }
  });

  // Hilfen der PA: Impulse ohne Abzug, Tipps leichter Abzug
  const hilfen = z.log.filter((e): e is Extract<typeof e, { art: 'pa-hilfe' }> => e.art === 'pa-hilfe');
  const paImpulse = hilfen.filter((h) => h.stufe === 'impuls').length;
  const paTipps = hilfen.filter((h) => h.stufe === 'tipp').length;
  if (paTipps) beitraege.push({
    id: 'pa:tipps', art: 'pa', text: `${paTipps} konkrete${paTipps === 1 ? 'r' : ''} Tipp${paTipps === 1 ? '' : 's'} der Praxisanleitung`, bereiche: ['I'],
    moeglich: 0, erreicht: 0, abzug: ABZUG_PA_TIPP * paTipps, urteil: 'info', warum: 'Denkanstöße kosten nichts, ein konkreter Tipp zieht leicht ab.',
  });

  // Rücklesen erhaltener Anordnungen (nicht der Medikamentenplan zu Beginn)
  for (const e of z.log) {
    if (e.art !== 'anordnung-erhalten') continue;
    const a = fall.anordnungen.find((x) => x.id === e.anordnung);
    beitraege.push({
      id: `ruecklesen:${e.anordnung}`, art: 'ruecklesen', text: `Anordnung rückgelesen: ${a?.text ?? e.anordnung}`, bereiche: spurB ? ['III', 'team'] : ['III'],
      moeglich: GEWICHT.ruecklesen, erreicht: e.rueckgelesen ? GEWICHT.ruecklesen : 0, abzug: 0, urteil: e.rueckgelesen ? 'gut' : 'teilweise', t: e.t,
      ...(e.rueckgelesen ? {} : { deine: 'Ohne Rücklesen übernommen', besser: 'Anordnung wiederholen und bestätigen lassen.' }),
      warum: 'Rücklesen (Closed Loop) verhindert Hör- und Verständnisfehler bei mündlichen Anordnungen.',
    });
  }

  // Remonstration: jede fehlerhafte Anordnung, die angeboten wurde
  for (const a of fall.anordnungen) {
    if (!a.fehlerhaft) continue;
    const angeboten = z.angeboten.includes(a.id) || !!z.anordnungen[a.id] || z.zurueckgezogen.includes(a.id);
    if (!angeboten) continue;
    const remonstriert = z.flags.includes(`remonstriert:${a.id}`);
    const m = massnahme(fall, a.massnahme);
    const t = z.log.find((e) => e.art === 'remonstrieren' && e.anordnung === a.id)?.t;
    beitraege.push({
      id: `remonstration:${a.id}`, art: 'remonstration', text: `Fehlerhafte Anordnung hinterfragt: ${a.text}`,
      bereiche: mitKlinisch(['III', 'IV'], ['team', ...(m?.klinisch?.includes('medikamente') ? ['medikamente' as const] : [])]),
      moeglich: GEWICHT.remonstration, erreicht: remonstriert ? GEWICHT.remonstration : 0, abzug: 0, urteil: remonstriert ? 'gut' : 'fehler',
      ...(t !== undefined ? { t } : {}),
      ...(remonstriert ? {} : { deine: z.anordnungen[a.id] ? 'Übernommen, ohne nachzufragen' : 'Nicht hinterfragt', besser: `Remonstrieren: ${a.fehlerhaft.warum}` }),
      warum: a.fehlerhaft.warum,
    });
  }

  // Abschluss
  beitraege.push(pflegebedarfBeitrag(z));
  const v = verdachtBeitrag(z);
  if (v) beitraege.push(v);
  beitraege.push(uebergabeBeitrag(z));

  const bereich = (id: Bereich, name: string): BereichErgebnis => {
    const l = beitraege.filter((b) => b.bereiche.includes(id));
    const moeglich = l.reduce((s, b) => s + b.moeglich, 0);
    const erreicht = l.reduce((s, b) => s + b.erreicht, 0);
    const abzug = l.reduce((s, b) => s + b.abzug, 0);
    const prozent = moeglich > 0 ? Math.round(Math.max(0, Math.min(1, (erreicht - abzug) / moeglich)) * 100) : abzug > 0 ? 0 : null;
    return { id, name, prozent, moeglich: runde(moeglich), erreicht: runde(erreicht), abzug: runde(abzug) };
  };
  const kb = KBS.map((k) => bereich(k, KB_NAME[k]));
  const klinisch = spurB ? KLINISCHE.map((k) => bereich(k, KLINISCH_NAME[k])) : [];
  const m = beitraege.reduce((s, b) => s + b.moeglich, 0);
  const gesamt = m > 0 ? Math.round(Math.max(0, Math.min(1, (beitraege.reduce((s, b) => s + b.erreicht - b.abzug, 0)) / m)) * 100) : 0;

  const schwer = z.fehlerAus.some((id) => (istMedFehler(id) ? MED_SCHWERE(id) : fall.bewertung.fehler.find((f) => f.id === id)?.schwere) === 'schwer');
  const grenzen = beitraege.some((b) => b.art === 'grenze');
  const schlecht = z.ende && ['verschlechtert', 'verstorben'].includes(z.ende.ausgang);
  const stufe = verpasste.length || schwer || schlecht ? 'kritisch' : gesamt < 80 || grenzen || z.fehlerAus.length ? 'unsicher' : 'stabil';
  const text = [
    z.ende && z.ende.ausgang !== 'abgeschlossen' ? z.ende.text : '',
    `${gesamt} % insgesamt.`,
    verpasste.length ? `${verpasste.length} kritische Pflichthandlung${verpasste.length === 1 ? '' : 'en'} verpasst.` : '',
    schwer ? 'Mindestens ein schwerer Pflegefehler.' : '',
  ].filter(Boolean).join(' ');

  return {
    fallId: fall.id, spur: fall.spur, gesamt, kb, klinisch, beitraege, verpassteKritische: verpasste, paImpulse, paTipps,
    ergebnis: { stufe, text }, zeitleiste: zl,
  };
}

/* ─────────────────────────── Protokoll (Tutor, Weitergabe) ─────────────────────────── */

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/** Eigener Weg als lesbare Zeilen „mm:ss Text“ (ohne Warten). */
export function protokoll(z: SimZustand): string[] {
  return spieleNach(z).zeitleiste.marken.map((m) => `${mmss(m.t)} ${m.art === 'fehler' ? 'Fehler: ' : m.art === 'ereignis' ? 'Ereignis: ' : ''}${m.text}${m.ausgefuehrt ? '' : ' (nicht ausgeführt)'}`);
}

/** Musterweg des Falls als lesbare Schritte. */
export function musterweg(fall: FallV2): string[] {
  return fall.pruefwege.muster.filter((e) => e.art !== 'warten').map((e) => eingabeText(fall, e));
}
