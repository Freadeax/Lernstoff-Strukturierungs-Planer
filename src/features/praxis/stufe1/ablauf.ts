// Praxissimulator Stufe 1 (geführt) auf dem neuen Kern (Paket P21).
// Rein, ohne React. Ein Lernmodus über denselben v2-Fällen wie der Arbeitsplatz (Stufe 2):
// Der Musterweg des Falls gibt die Schritte vor, je Schritt 3–4 Möglichkeiten mit Wertung und Begründung.
// Die Möglichkeiten werden aus dem Fall abgeleitet (Musterweg, Pflegefehler, Befugnis, SBAR-Bausteine,
// Anordnungen, Pflegebedarf) und – wo es geht – vorher im Kern durchgespielt („Probelauf“):
// Erzeugt eine Handlung im Kern einen Pflegefehler oder stoppt die Praxisanleitung sie, ist sie falsch.
// Gesteuert wird nur über Eingaben an den Kern (sende), damit Uhr, Verlauf, Auswertung identisch bleiben.

import { angeboteneMassnahmen, befugnisLevel, freigabe, gilt, massnahme, sende, verfuegbar, type Meldung, type SimZustand } from '../kern/kern';
import { bausteinText } from '../kern/kommunikation';
import { massnahmenIn } from '../kern/auswertung';
import type { Bedingung, FallV2, Pflegefehler, Rolle, SimEventEingabe } from '../kern/typen';
import { beginne as beginneStand, wende, type Arbeitsstand } from '../arbeitsplatz/ansicht';

/* ─────────────────────────── Begriffe ─────────────────────────── */

/** gut: fachlich richtig · vertretbar: nicht falsch, aber jetzt nicht das Wichtigste · falsch: hilft nicht oder verzögert · gefaehrlich: schadet */
export type Wertung = 'gut' | 'vertretbar' | 'falsch' | 'gefaehrlich';
export const WERTUNG_LABEL: Record<Wertung, string> = { gut: 'Richtig', vertretbar: 'Vertretbar', falsch: 'Nicht zielführend', gefaehrlich: 'Gefährlich' };
/** Urteil über einer Möglichkeit: Pflegefehler und Befugnisgrenzen heißen so, wie sie sind. */
export const urteil = (o: Pick<Option, 'wertung' | 'herkunft'>) =>
  o.wertung === 'falsch' && o.herkunft === 'fehler' ? 'Pflegefehler' : o.herkunft === 'befugnis' ? (o.wertung === 'gefaehrlich' ? 'Gefährlich: nicht deine Aufgabe' : 'Nicht deine Aufgabe') : WERTUNG_LABEL[o.wertung];

export type Phase = 'gespraech' | 'beobachten' | 'akut' | 'messen' | 'versorgen' | 'melden' | 'anordnung' | 'doku' | 'verdacht' | 'pflegebedarf';
export const PHASE_TEXT: Record<Phase, string> = {
  gespraech: 'Gespräch', beobachten: 'Beobachten', akut: 'Sofortmaßnahme', messen: 'Messen', versorgen: 'Versorgen',
  melden: 'Melden', anordnung: 'Anordnung', doku: 'Dokumentation', verdacht: 'Verdacht', pflegebedarf: 'Pflegebedarf',
};

/** Woher eine Möglichkeit stammt (für Tests und die Auswertung des Lernmodus). */
export type Herkunft = 'muster' | 'fehler' | 'befugnis' | 'reihenfolge' | 'ablenker' | 'kommunikation' | 'pflegebedarf' | 'verdacht';

export interface Option {
  id: string;
  text: string;
  /** Inhalt einer Nachricht oder eines Berichts als Liste (nur Anzeige) */
  inhalt?: string[];
  wertung: Wertung;
  warum: string;
  herkunft: Herkunft;
  /** Eingaben an den Kern. Leer = nur Rückmeldung (z. B. unvollständige Meldung: Senden würde den Fall verbiegen). */
  eingaben: SimEventEingabe[];
}

export interface Schritt {
  /** Index im Plan */
  nr: number;
  phase: Phase;
  frage: string;
  optionen: Option[];
  /** gewählte Option-IDs in Reihenfolge */
  picks: string[];
  /** Meldungen des Kerns ab hier gehören zu diesem Schritt (Befund, PA, Antworten) */
  meldungenAb: number;
  /** Was seit dem letzten Schritt passiert ist (Vorlauf, Ereignisse, Verlauf) beginnt hier */
  lageAb: number;
  /** je Pick: ab welcher Meldung dessen Rückmeldung beginnt */
  pickMeldungAb: number[];
}

/** Ein Schritt des Plans: eine Muster-Eingabe mit Vorlauf (warten, auflegen) und Geräten aus der Pflegetasche. */
export interface PlanSchritt {
  /** Eingaben, die vor dem Schritt automatisch an den Kern gehen (warten, auflegen, PA dazuholen) */
  vorher: SimEventEingabe[];
  /** Pflegetasche vor einer Messung (gehört zur richtigen Möglichkeit) */
  geraete: string[];
  art: 'eingabe' | 'verdacht' | 'pflegebedarf';
  /** Muster-Eingabe (bei 'verdacht' leer) */
  muster?: SimEventEingabe;
  /** Weitere Anordnungen aus demselben Gespräch, die zusammen zurückgelesen werden */
  weitere?: Array<Extract<SimEventEingabe, { art: 'rueckmelden' }>>;
  /** Wievielte gleiche Maßnahme/Frage im Musterweg (1 = erste), zum Überspringen bereits erledigter Schritte */
  vorkommen: number;
}

export interface Stufe1Stand {
  plan: PlanSchritt[];
  /** nächster Plan-Index */
  i: number;
  stand: Arbeitsstand;
  aktuell?: Schritt;
  erledigt: Schritt[];
  /** Entscheidungen bei Ereignissen: Ereignis → gewählte Option (für die Zusammenfassung) */
  entscheidungen: Array<{ ereignis: string; wahl: string; meldungAb: number }>;
  /** Eingaben einer Wahl, die ein Entscheidungsmoment unterbrochen hat; gehen nach der Entscheidung an den Kern */
  ausstehend?: SimEventEingabe[];
  /** Beginn der Lage-Meldungen, solange ein Entscheidungsmoment den Vorlauf unterbricht */
  lageAb?: number;
}

/** Was Lernende tun; daraus lässt sich der Stand jederzeit nachspielen (Speicher). */
export type Aktion = { art: 'wahl'; option: string } | { art: 'weiter' } | { art: 'entscheidung'; wahl: string };

/* ─────────────────────────── Plan aus dem Musterweg ─────────────────────────── */

const AUTOMATISCH = new Set<SimEventEingabe['art']>(['warten', 'auflegen', 'anleitung-anfordern', 'pa-fragen']);

const schluessel = (e: SimEventEingabe): string | undefined =>
  e.art === 'massnahme' ? `m:${e.id}` : e.art === 'frage' ? `f:${e.id}` : undefined;

export function plane(fall: FallV2): PlanSchritt[] {
  const plan: PlanSchritt[] = [];
  let vorher: SimEventEingabe[] = [];
  let geraete: string[] = [];
  const zaehler: Record<string, number> = {};
  for (const e of fall.pruefwege.muster) {
    if (AUTOMATISCH.has(e.art) || e.art === 'entscheidung') { vorher.push(e); continue; }
    if (e.art === 'pflegetasche') { geraete.push(e.geraet); continue; }
    if (e.art === 'abschluss' && fall.verdacht && e.verdacht) {
      plan.push({ vorher, geraete: [], art: 'verdacht', vorkommen: 1 });
      vorher = [];
    }
    // Geräte gehören zur nächsten Maßnahme; vor allem anderen werden sie automatisch geholt.
    if (e.art !== 'massnahme' && geraete.length) { vorher.push(...geraete.map((g): SimEventEingabe => ({ art: 'pflegetasche', geraet: g }))); geraete = []; }
    const letzter = plan.at(-1);
    if (e.art === 'rueckmelden' && !vorher.length && letzter?.muster?.art === 'rueckmelden') {
      (letzter.weitere ??= []).push(e);
      continue;
    }
    const k = schluessel(e);
    const vorkommen = k ? (zaehler[k] = (zaehler[k] ?? 0) + 1) : 1;
    plan.push({ vorher, geraete, art: e.art === 'abschluss' ? 'pflegebedarf' : 'eingabe', muster: e, vorkommen });
    vorher = []; geraete = [];
  }
  return plan;
}

/* ─────────────────────────── Hilfen ─────────────────────────── */

/** Stabiler Hash für eine gemischte, aber reproduzierbare Reihenfolge der Möglichkeiten. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const mische = (liste: Option[], salz: string) => [...liste].sort((a, b) => hash(`${salz}:${a.id}`) - hash(`${salz}:${b.id}`));

/** Maßnahmen, die eine Bedingung positiv verlangt (getan), nicht unter `nicht`. */
function getanPositiv(b: Bedingung, out: string[] = []): string[] {
  if ('alle' in b) b.alle.forEach((x) => getanPositiv(x, out));
  else if ('eine' in b) b.eine.forEach((x) => getanPositiv(x, out));
  else if ('getan' in b) out.push(b.getan);
  return out;
}

const name = (fall: FallV2, id: string) => massnahme(fall, id)?.name ?? fall.gespraech.find((g) => g.id === id)?.frage ?? id;
const frageId = (id: string) => `frage:${id}`;

/** Begründung für die richtige Handlung: Pflichthandlung des Falls, sonst Leitfaden-freier Standardsatz. */
function warumRichtig(fall: FallV2, e: SimEventEingabe): string {
  const ids = e.art === 'massnahme' ? [e.id] : e.art === 'frage' ? [frageId(e.id), e.id] : [];
  // Die spezifischste Pflichthandlung (wenigste Maßnahmen in der Bedingung) begründet am genauesten.
  const p = fall.bewertung.pflicht.map((x) => ({ x, m: massnahmenIn(x.erfuellt) })).filter(({ m }) => m.some((id) => ids.includes(id)))
    .sort((a, b) => a.m.length - b.m.length)[0]?.x;
  if (p) return p.warum;
  if (e.art === 'frage') {
    const g = fall.gespraech.find((x) => x.id === e.id);
    return g?.an === 'patient' ? 'Das Gespräch schafft Vertrauen und bringt Informationen, die du für die nächsten Schritte brauchst.'
      : 'So holst du die Information von der Person, die sie hat, und beziehst das Umfeld ein.';
  }
  const wer = fall.person.name;
  const r = e.art === 'massnahme' ? massnahme(fall, e.id)?.reiter : undefined;
  switch (r) {
    case 'beobachten': return 'Erst hinsehen, dann handeln: Diese Beobachtung zeigt dir den Zustand jetzt und ist die Grundlage für alles Weitere.';
    case 'messen': return 'Ein gemessener Wert macht deine Einschätzung belastbar. Ohne ihn kannst du die Lage nicht sicher beurteilen und nicht sicher melden.';
    case 'akut': return 'Sicherheit zuerst: Das schützt vor weiterem Schaden, bevor du in Ruhe weiter einschätzt.';
    case 'gespraech': return `Beziehung und Information: So erfährst du, was gerade erlebt wird, und ${wer} weiß, was passiert.`;
    case 'melden': return 'Wer Bescheid wissen muss, erfährt es jetzt. So kann das Team rechtzeitig mitentscheiden.';
    default: return 'Das ist jetzt die passende pflegerische Maßnahme zu dem, was du erhoben hast.';
  }
}

/** Wie oft die Maßnahme/Frage schon getan wurde (Kern-Log, nicht nur Musterweg). */
function anzahlGetan(z: SimZustand, e: SimEventEingabe): number {
  if (e.art === 'massnahme') return z.getan[e.id]?.length ?? 0;
  if (e.art === 'frage') return z.getan[frageId(e.id)]?.length ?? 0;
  return 0;
}

function phaseVon(fall: FallV2, p: PlanSchritt): Phase {
  if (p.art === 'verdacht') return 'verdacht';
  if (p.art === 'pflegebedarf') return 'pflegebedarf';
  const e = p.muster!;
  switch (e.art) {
    case 'massnahme': {
      if (e.id === 'pflegebericht') return 'doku';
      const r = massnahme(fall, e.id)?.reiter ?? 'beobachten';
      return r;
    }
    case 'frage': return 'gespraech';
    case 'rueckmelden': case 'remonstrieren': return 'anordnung';
    case 'dokumentieren': return 'doku';
    default: return 'melden';
  }
}

/* ─────────────────────────── Probelauf im Kern ─────────────────────────── */

interface Probe { wertung: Wertung; warum: string; herkunft: Herkunft }

const FREIGABE_WARUM = {
  'braucht-anordnung': 'Medikamente, Infusionen und Sauerstoff über den Standard hinaus gibt es nur auf ärztliche Anordnung. Erst einschätzen, dann mit Werten melden, dann umsetzen.',
  'nur-aerztlich': 'Das ist eine ärztliche Aufgabe. Du trägst die Durchführungsverantwortung und darfst sie ablehnen. Deine Aufgabe ist, die Lage einzuschätzen und zu melden.',
  gesperrt: 'Das übernimmt in deinem Ausbildungsabschnitt noch eine Pflegefachperson; du schaust zu und lernst es.',
} as const;

/** Spielt eine Handlung im Kern durch und liest ab, ob sie schadet oder gestoppt wird. */
function probe(z: SimZustand, e: SimEventEingabe): Probe | undefined {
  const n = sende(z, e);
  const neu = n.log.slice(z.log.length);
  const fehler = neu.filter((l): l is Extract<typeof l, { art: 'fehler' }> => l.art === 'fehler')
    .map((l) => z.fall.bewertung.fehler.find((f) => f.id === l.id) ?? kommFehlerText(z, l.id)).filter((f): f is FehlerInfo => !!f);
  if (fehler.length) {
    const schwer = fehler.some((f) => f.schwere === 'schwer');
    return { wertung: schwer ? 'gefaehrlich' : 'falsch', warum: fehler.map((f) => f.warum).join(' '), herkunft: 'fehler' };
  }
  if (e.art === 'massnahme' && neu.some((l) => l.art === 'pa-eingriff' && l.typ === 'warnt')) {
    const m = massnahme(z.fall, e.id)!;
    const lvl = befugnisLevel(z, m);
    const f = freigabe(z, m);
    const warum = f === 'braucht-anordnung' ? FREIGABE_WARUM['braucht-anordnung'] : lvl === 'gesperrt' ? FREIGABE_WARUM.gesperrt : FREIGABE_WARUM['nur-aerztlich'];
    return { wertung: m.risikoBeiUeberschreitung === 'patientenschaden' ? 'gefaehrlich' : 'falsch', warum, herkunft: 'befugnis' };
  }
  return undefined;
}

type FehlerInfo = Pick<Pflegefehler, 'warum'> & { schwere: Pflegefehler['schwere'] };
function kommFehlerText(z: SimZustand, id: string): FehlerInfo | undefined {
  if (id.startsWith('schweigepflicht:')) {
    const g = z.fall.gespraech.find((x) => x.id === id.slice('schweigepflicht:'.length));
    return { warum: g?.schweigepflicht?.fehlerText ?? 'Auskunft ohne Einwilligung verletzt die Schweigepflicht.', schwere: 'mittel' };
  }
  if (id.startsWith('med-')) return { warum: 'Der Medikationsplan lässt diese Gabe jetzt nicht zu (Doppelgabe, Abstand oder Höchstmenge). Vor jeder Gabe den Plan prüfen.', schwere: id.startsWith('med-abstand:') ? 'mittel' : 'schwer' };
  return undefined;
}

/* ─────────────────────────── Möglichkeiten je Schritt ─────────────────────────── */

/** Kandidaten für Ablenker: angebotene Maßnahmen und Fragen, verfügbar, noch nicht getan. */
function kandidaten(z: SimZustand, p: PlanSchritt, plan: readonly PlanSchritt[], nr: number): Array<{ e: SimEventEingabe; id: string; spaeter: boolean; reiter?: string; fehlerVerdacht: boolean }> {
  const fall = z.fall;
  const muster = p.muster!;
  const spaeterIds = new Set(plan.slice(nr + 1).map((x) => x.muster && schluessel(x.muster)).filter(Boolean) as string[]);
  const fruehereIds = new Set(plan.slice(0, nr).map((x) => x.muster && schluessel(x.muster)).filter(Boolean) as string[]);
  const fehlerIds = new Set(fall.bewertung.fehler.flatMap((f) => getanPositiv(f.wenn)));
  const out: ReturnType<typeof kandidaten> = [];
  for (const m of angeboteneMassnahmen(fall)) {
    const k = `m:${m.id}`;
    if ((muster.art === 'massnahme' && muster.id === m.id) || fruehereIds.has(k) || (z.getan[m.id]?.length ?? 0) > 0) continue;
    if (m.id === 'pflegebericht') continue;
    if (!verfuegbar(z, m).ok) continue;
    out.push({ e: { art: 'massnahme', id: m.id }, id: k, spaeter: spaeterIds.has(k), reiter: m.reiter, fehlerVerdacht: fehlerIds.has(m.id) });
  }
  for (const g of fall.gespraech) {
    const k = `f:${g.id}`;
    if ((muster.art === 'frage' && muster.id === g.id) || fruehereIds.has(k) || (z.getan[frageId(g.id)]?.length ?? 0) > 0) continue;
    if (g.an === 'aerztin') continue;
    out.push({ e: { art: 'frage', id: g.id }, id: k, spaeter: spaeterIds.has(k), fehlerVerdacht: fehlerIds.has(frageId(g.id)) || !!g.schweigepflicht });
  }
  return out;
}

const MAX_PROBEN = 10;

/** Möglichkeiten für eine Handlung am Patienten (Maßnahme oder Frage). */
function handlungsOptionen(z: SimZustand, p: PlanSchritt, plan: readonly PlanSchritt[], nr: number, angeboten: Readonly<Record<string, number>>): Option[] {
  const fall = z.fall;
  const muster = p.muster!;
  const richtigName = name(fall, (muster as { id: string }).id);
  const geraete = p.geraete.filter((g) => !z.geraete.includes(g));
  const richtig: Option = {
    id: schluessel(muster)!, text: richtigName + (geraete.length ? ' (Gerät aus der Pflegetasche holen)' : ''),
    wertung: 'gut', warum: warumRichtig(fall, muster), herkunft: 'muster',
    eingaben: [...geraete.map((g): SimEventEingabe => ({ art: 'pflegetasche', geraet: g })), muster],
  };
  const reiter = muster.art === 'massnahme' ? massnahme(fall, muster.id)?.reiter : 'gespraech';
  // Reihenfolge der Proben: Verdacht auf Pflegefehler, Befugnisgrenzen, gleicher Reiter, später im Musterweg, Rest.
  const alle = kandidaten(z, p, plan, nr);
  const grenze = (k: (typeof alle)[number]) => k.e.art === 'massnahme' && freigabe(z, massnahme(fall, k.e.id)!) !== 'frei' && freigabe(z, massnahme(fall, k.e.id)!) !== 'mit-pa';
  const rang = (k: (typeof alle)[number]) => (k.fehlerVerdacht ? 0 : grenze(k) ? 1 : k.reiter === reiter && !k.spaeter ? 2 : k.spaeter ? 3 : 4);
  // Abwechslung: schon oft gezeigte Ablenker rücken nach hinten.
  const oft = (k: (typeof alle)[number]) => angeboten[k.id] ?? 0;
  const sortiert = [...alle].sort((a, b) => Number(oft(a) >= 2) - Number(oft(b) >= 2) || rang(a) - rang(b) || oft(a) - oft(b) || hash(`${nr}:${a.id}`) - hash(`${nr}:${b.id}`));

  const schlecht: Option[] = [], ablenker: Option[] = [], spaeter: Option[] = [];
  for (const k of sortiert.slice(0, MAX_PROBEN)) {
    const text = name(fall, (k.e as { id: string }).id);
    const pr = probe(z, k.e);
    if (pr) { schlecht.push({ id: k.id, text, ...pr, eingaben: [k.e] }); continue; }
    if (k.spaeter) {
      spaeter.push({ id: k.id, text, wertung: 'vertretbar', herkunft: 'reihenfolge', eingaben: [k.e],
        warum: `Das gehört in diesem Fall dazu, aber nicht jetzt. Vorrang hat: ${richtigName}.` });
      continue;
    }
    // Einschätzen und Gespräch ist selten falsch, nur gerade nicht das Wichtigste; Eingreifen ohne Anlass schon.
    const einschaetzen = k.e.art === 'frage' || k.reiter === 'beobachten' || k.reiter === 'messen' || k.reiter === 'gespraech';
    ablenker.push(einschaetzen
      ? { id: k.id, text, wertung: 'vertretbar', herkunft: 'ablenker', eingaben: [k.e], warum: `Nicht falsch, aber jetzt nicht das Wichtigste. Vorrang hat: ${richtigName}.` }
      : { id: k.id, text, wertung: 'falsch', herkunft: 'ablenker', eingaben: [k.e], warum: `Passt jetzt nicht zur Lage und kostet Zeit. Vorrang hat: ${richtigName}.` });
  }
  ablenker.sort((a, b) => Number(a.wertung === 'vertretbar') - Number(b.wertung === 'vertretbar'));
  // Je Art höchstens eine, dann auffüllen: Ziel 3 Ablenker (also 4 Möglichkeiten).
  const auswahl: Option[] = [];
  for (const l of [schlecht, ablenker, spaeter]) if (l[0]) auswahl.push(l.shift()!);
  for (const l of [schlecht, ablenker, spaeter]) while (auswahl.length < 3 && l.length) auswahl.push(l.shift()!);
  return [richtig, ...auswahl];
}

function nachrichtOptionen(z: SimZustand, e: Extract<SimEventEingabe, { art: 'nachricht' | 'anruf' }>): Option[] {
  const fall = z.fall;
  const bausteine = e.art === 'anruf' ? e.sbar : e.bausteine;
  const an = e.art === 'anruf' ? 'aerztin' : e.an;
  const wer = an === 'aerztin' ? fall.arzt.name : an === 'kollegin' ? (fall.team?.kollegin ?? 'Kollegin') : (fall.team?.weitere?.[an] ?? ({ patient: 'Patient/in', angehoerige: 'Angehörige', eltern: 'Eltern', betreuer: 'Betreuer/in', pa: fall.pa.name, rettungsdienst: 'Rettungsdienst', 'aufnehmende-station': 'aufnehmende Station' } as Record<string, string>)[an] ?? an);
  const wie = e.art === 'anruf' || (e.art === 'nachricht' && e.kanal === 'telefon') ? 'Anrufen' : e.art === 'nachricht' && e.kanal === 'messenger' ? 'Nachricht schreiben' : 'Sagen';
  const texte = (ids: readonly string[]) => ids.map((id) => bausteinText(z, id));
  const opts: Option[] = [{
    id: 'meldung', text: `${wie}: ${wer}`, inhalt: texte(bausteine), wertung: 'gut', herkunft: 'muster', eingaben: [e],
    warum: an === 'aerztin'
      ? 'Vollständig und strukturiert (SBAR): Situation, Hintergrund, deine Einschätzung mit den gemessenen Werten und was du brauchst. So kann die Ärztin entscheiden.'
      : 'Wer die Lage kennt, kann mitdenken und mithelfen. Gib nur weiter, was die Person für ihre Aufgabe braucht.',
  }];
  const teil = (id: string) => (id.startsWith('wert:') || id.startsWith('zusage:') ? 'A' : fall.sbar.find((b) => b.id === id)?.teil);
  const nurS = bausteine.filter((id) => teil(id) === 'S');
  const fehlt = bausteine.filter((id) => teil(id) === 'A' || teil(id) === 'R');
  if (an === 'aerztin' && fehlt.length && bausteine.length >= 3) {
    opts.push({ id: 'unvollstaendig', text: `${wie}: ${wer}`, inhalt: texte(nurS.length ? nurS : bausteine.slice(0, 1)), wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: `Ohne deine Einschätzung und die Werte kann ${fall.arzt.name} nicht entscheiden und muss alles erfragen. Es fehlt: ${texte(fehlt).join(' · ')}.` });
  }
  const bekannt = (id: string) => { const b = fall.sbar.find((x) => x.id === id); return !b?.bekanntWenn || pruefeSicher(z, b.bekanntWenn); };
  const lang = bausteine.length >= 3;
  const falsch = lang ? fall.sbar.find((b) => b.art === 'falsch' && !bausteine.includes(b.id) && bekannt(b.id)) : undefined;
  if (falsch) {
    opts.push({ id: 'falsch', text: `${wie}: ${wer}`, inhalt: texte([...bausteine.filter((id) => teil(id) !== 'A'), falsch.id]), wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: `„${falsch.text}“ stimmt so nicht und führt in die Irre. Melde nur, was du beobachtet oder gemessen hast.` });
  }
  const ablenker = lang ? fall.sbar.find((b) => b.art === 'ablenker' && !bausteine.includes(b.id) && bekannt(b.id)) : undefined;
  if (ablenker) {
    opts.push({ id: 'ablenker', text: `${wie}: ${wer}`, inhalt: texte([...bausteine, ablenker.id]), wertung: 'vertretbar', herkunft: 'kommunikation', eingaben: [],
      warum: `Inhaltlich vollständig, aber „${ablenker.text}“ ist hier unnötig. Kurz und auf den Punkt spart Zeit am Telefon.` });
  }
  if (!lang && an === 'aerztin') {
    opts.push({ id: 'umstaendlich', text: `Anrufen und ${fall.arzt.name} die ganze Geschichte noch einmal erzählen`, wertung: 'vertretbar', herkunft: 'kommunikation', eingaben: [],
      warum: 'Die Ärztin kennt die Lage schon. Für eine Rückmeldung reicht kurz und genau, was sie wissen wollte.' });
  }
  if (opts.length < 3) {
    opts.push({ id: 'abwarten', text: an === 'aerztin' ? 'Noch nicht melden, erst weiter beobachten' : 'Nichts sagen und allein weitermachen', wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: an === 'aerztin' ? 'Die Veränderung ist jetzt zu melden. Abwarten verzögert die ärztliche Entscheidung.' : 'Ohne Absprache weiß niemand Bescheid; gerade in dieser Lage brauchst du das Team.' });
  }
  return opts.slice(0, 4);
}

function pruefeSicher(z: SimZustand, b: Bedingung): boolean {
  try { return gilt(z, b); } catch { return false; }
}

function anordnungOptionen(z: SimZustand, e: Extract<SimEventEingabe, { art: 'rueckmelden' | 'remonstrieren' }>, weitere: readonly Extract<SimEventEingabe, { art: 'rueckmelden' }>[] = []): Option[] {
  const fall = z.fall;
  const a = fall.anordnungen.find((x) => x.id === e.anordnung);
  const text = a?.text ?? e.anordnung;
  const offenNoch = weitere.filter((w) => z.angeboten.includes(w.anordnung));
  const alle = e.art === 'rueckmelden' ? [...(z.angeboten.includes(e.anordnung) ? [e] : []), ...offenNoch] : [];
  const texte = alle.map((x) => fall.anordnungen.find((y) => y.id === x.anordnung)?.text ?? x.anordnung);
  if (e.art === 'remonstrieren') {
    return [
      { id: 'remonstrieren', text: `Nachfragen: „${text}“ – das passt so nicht`, wertung: 'gut', herkunft: 'muster', eingaben: [e],
        warum: `${a?.fehlerhaft?.warum ?? 'Die Anordnung ist fehlerhaft.'} Du trägst die Durchführungsverantwortung und sprichst Bedenken sofort an (Remonstration).` },
      { id: 'umsetzen', text: `Zurücklesen und so umsetzen: „${text}“`, wertung: 'gefaehrlich', herkunft: 'kommunikation', eingaben: [],
        warum: `${a?.fehlerhaft?.warum ?? 'Die Anordnung ist fehlerhaft.'} Wer eine erkennbar falsche Anordnung ausführt, haftet mit.` },
      { id: 'ignorieren', text: 'Nichts sagen und die Anordnung einfach nicht umsetzen', wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
        warum: 'Stillschweigend nicht umsetzen lässt die Lage ungeklärt. Die Ärztin muss wissen, warum und was stattdessen geschieht.' },
    ];
  }
  return [
    { id: 'zuruecklesen', text: alle.length > 1 ? `Alle ${alle.length} Anordnungen zurücklesen` : `Zurücklesen: „${texte[0] ?? text}“`, ...(alle.length > 1 ? { inhalt: texte } : {}),
      wertung: 'gut', herkunft: 'muster', eingaben: alle,
      warum: 'Mündliche und telefonische Anordnungen liest du zurück (read back) und lässt sie bestätigen. So fallen Hör- und Verständnisfehler auf.' },
    { id: 'ok', text: '„Okay, mache ich.“', wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: 'Ohne Zurücklesen bleiben Missverständnisse bei Dosis, Weg oder Zeit unbemerkt.' },
    { id: 'spaeter', text: 'Auflegen und die Anordnung später aus dem Gedächtnis notieren', wertung: 'gefaehrlich', herkunft: 'kommunikation', eingaben: [],
      warum: 'Aus dem Gedächtnis entstehen Fehler. Anordnung sofort notieren, zurücklesen, bestätigen lassen.' },
  ];
}

function dokuOptionen(z: SimZustand, e: SimEventEingabe): Option[] {
  const inhalt = e.art === 'dokumentieren' ? e.bausteine.map((id) => bausteinText(z, id)) : undefined;
  return [
    { id: 'doku', text: 'Jetzt im Pflegebericht dokumentieren', ...(inhalt ? { inhalt } : {}), wertung: 'gut', herkunft: 'muster', eingaben: [e],
      warum: 'Zeitnah, sachlich, mit Uhrzeit und Werten: Was du beobachtet, gemessen, gemeldet und getan hast. Nur so können andere nahtlos weitermachen.' },
    { id: 'spaeter', text: 'Am Ende der Schicht alles auf einmal eintragen', wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: 'Später fehlen Uhrzeiten und Einzelheiten, und die Kolleginnen arbeiten bis dahin ohne die Information.' },
    { id: 'knapp', text: '„Patient versorgt, alles in Ordnung“ eintragen', wertung: 'falsch', herkunft: 'kommunikation', eingaben: [],
      warum: 'Ohne Befunde, Werte und Maßnahmen ist der Eintrag wertlos und rechtlich nicht belastbar.' },
  ];
}

function verdachtOptionen(fall: FallV2): Option[] {
  const v = fall.verdacht!;
  const richtig = v.optionen.find((o) => o.richtig);
  const stuetzt = richtig ? v.begruendungen.filter((b) => b.stuetzt.includes(richtig.id)).map((b) => b.text) : [];
  const grund = stuetzt.length ? `Dafür sprechen: ${stuetzt.join(' · ')}.` : '';
  return v.optionen.slice(0, 4).map((o): Option => ({
    id: o.id, text: o.text, wertung: o.richtig ? 'gut' : 'falsch', herkunft: 'verdacht', eingaben: [],
    warum: o.richtig ? `Passt zu den Befunden. ${grund}` : `Passt nicht zu dem, was du erhoben hast. ${grund}`,
  }));
}

function pflegebedarfOptionen(fall: FallV2, e: Extract<SimEventEingabe, { art: 'abschluss' }>): Option[] {
  const pb = fall.pflegebedarf.probleme;
  const vorrang = pb.find((p) => p.id === e.probleme[0]) ?? pb.find((p) => p.richtig && p.prioritaet === 1) ?? pb.find((p) => p.richtig);
  const opts: Option[] = [];
  if (vorrang) opts.push({ id: vorrang.id, text: vorrang.text, wertung: 'gut', herkunft: 'muster', eingaben: [e], warum: vorrang.warum });
  const weiteres = pb.find((p) => p.richtig && p.id !== vorrang?.id);
  if (weiteres) opts.push({ id: weiteres.id, text: weiteres.text, wertung: 'vertretbar', herkunft: 'pflegebedarf', eingaben: [],
    warum: `Richtig erkannt, aber nachrangig. ${weiteres.warum} Zuerst: ${vorrang?.text ?? ''}.` });
  for (const p of pb.filter((x) => !x.richtig).slice(0, 4 - opts.length)) opts.push({ id: p.id, text: p.text, wertung: 'falsch', herkunft: 'pflegebedarf', eingaben: [], warum: p.warum });
  return opts;
}

/** Baut die Möglichkeiten eines Plan-Schritts aus dem aktuellen Kernzustand. */
export function optionenFuer(z: SimZustand, plan: readonly PlanSchritt[], nr: number, angeboten: Readonly<Record<string, number>> = {}): { phase: Phase; frage: string; optionen: Option[] } {
  const p = plan[nr]!;
  const fall = z.fall;
  const phase = phaseVon(fall, p);
  let frage = 'Was tust du als Nächstes?';
  let optionen: Option[];
  if (p.art === 'verdacht') { frage = 'Welcher Verdacht passt zu deinen Befunden?'; optionen = verdachtOptionen(fall); }
  else if (p.art === 'pflegebedarf') { frage = 'Welches Pflegeproblem steht jetzt an erster Stelle?'; optionen = pflegebedarfOptionen(fall, p.muster as Extract<SimEventEingabe, { art: 'abschluss' }>); }
  else {
    const e = p.muster!;
    switch (e.art) {
      case 'massnahme':
        if (e.id === 'pflegebericht') { frage = 'Was ist mit der Dokumentation?'; optionen = dokuOptionen(z, e); }
        else optionen = handlungsOptionen(z, p, plan, nr, angeboten);
        break;
      case 'frage': optionen = handlungsOptionen(z, p, plan, nr, angeboten); break;
      case 'nachricht': case 'anruf':
        frage = (e.art === 'anruf' || e.an === 'aerztin') ? 'Wie meldest du?' : 'Was sagst du wem?';
        optionen = nachrichtOptionen(z, e); break;
      case 'rueckmelden': case 'remonstrieren':
        frage = `${fall.arzt.name} ordnet an. Wie reagierst du?`; optionen = anordnungOptionen(z, e, p.weitere); break;
      case 'dokumentieren': frage = 'Was ist mit der Dokumentation?'; optionen = dokuOptionen(z, e); break;
      default: optionen = [{ id: 'weiter', text: 'Weiter', wertung: 'gut', herkunft: 'muster', eingaben: [e], warum: '' }];
    }
  }
  return { phase, frage, optionen: mische(optionen, `${fall.id}:${nr}`) };
}

/* ─────────────────────────── Ablauf ─────────────────────────── */

const offen = (z: SimZustand) => !!z.offeneEntscheidung;

/** Schickt Eingaben nacheinander, hört bei Fallende oder offener Entscheidung auf. */
function schicke(stand: Arbeitsstand, eingaben: readonly SimEventEingabe[]): { stand: Arbeitsstand; rest: SimEventEingabe[] } {
  let s = stand;
  for (let k = 0; k < eingaben.length; k++) {
    const e = eingaben[k]!;
    if (offen(s.z)) return { stand: s, rest: eingaben.slice(k) };
    // Nach Fallende nimmt der Kern nur noch den Abschluss an.
    if (s.z.ende && e.art !== 'abschluss') continue;
    s = wende(s, e);
  }
  return { stand: s, rest: [] };
}

/** Ist der Plan-Schritt im aktuellen Zustand sinnlos geworden (schon erledigt, Anordnung nicht angeboten …)? */
function ueberspringen(z: SimZustand, p: PlanSchritt): boolean {
  if (p.art !== 'eingabe') return false;
  const e = p.muster!;
  if ((e.art === 'massnahme' || e.art === 'frage') && anzahlGetan(z, e) >= p.vorkommen) return true;
  if (e.art === 'massnahme') {
    const m = massnahme(z.fall, e.id);
    if (!m) return true;
    // Gerät fehlt nur, weil die Pflegetasche noch zu ist: das holt die richtige Möglichkeit mit.
    const mitGeraet = { ...z, geraete: [...z.geraete, ...p.geraete] };
    if (!verfuegbar(mitGeraet, m).ok) return true;
  }
  if (e.art === 'rueckmelden') return ![e, ...(p.weitere ?? [])].some((x) => z.angeboten.includes(x.anordnung));
  if (e.art === 'remonstrieren') return !z.angeboten.includes(e.anordnung) && !z.anordnungen[e.anordnung];
  return false;
}

/** Bereitet den nächsten Schritt vor: Vorlauf an den Kern, überspringen, Möglichkeiten einfrieren. */
function bereite(st: Stufe1Stand): Stufe1Stand {
  let { stand, i } = st;
  const lageAb = st.lageAb ?? stand.z.meldungen.length;
  while (i < st.plan.length && !stand.z.abschluss) {
    if (offen(stand.z)) return { ...st, stand, i, aktuell: undefined, lageAb };
    const p = st.plan[i]!;
    // Fall endet vorzeitig (Ende-Bedingung): Es bleibt der Abschluss (Verdacht, Pflegebedarf), wie im Arbeitsplatz.
    if (stand.z.ende && p.art === 'eingabe') { i++; continue; }
    const r = schicke(stand, p.vorher);
    stand = r.stand;
    if (r.rest.length || offen(stand.z)) {
      // Ereignis mit Entscheidung im Vorlauf: Rest des Vorlaufs merken, nach der Entscheidung weiter.
      const plan = [...st.plan];
      plan[i] = { ...p, vorher: r.rest };
      return { ...st, plan, stand, i, aktuell: undefined, lageAb };
    }
    if (st.plan[i]!.vorher.length) { const plan = [...st.plan]; plan[i] = { ...p, vorher: [] }; st = { ...st, plan }; }
    if (stand.z.ende && p.art === 'eingabe') { i++; continue; }
    if (ueberspringen(stand.z, p)) { i++; continue; }
    const angeboten: Record<string, number> = {};
    for (const s of st.erledigt) for (const o of s.optionen) if (o.herkunft !== 'muster') angeboten[o.id] = (angeboten[o.id] ?? 0) + 1;
    const o = optionenFuer(stand.z, st.plan, i, angeboten);
    const { lageAb: _l, ...rest } = st;
    return { ...rest, stand, i, aktuell: { nr: i, ...o, picks: [], meldungenAb: stand.z.meldungen.length, lageAb, pickMeldungAb: [] } };
  }
  const { lageAb: _l, ...rest } = st;
  return { ...rest, stand, i, aktuell: undefined };
}

export function beginne(fall: FallV2, rolle: Rolle, seed = 1): Stufe1Stand {
  return bereite({ plan: plane(fall), i: 0, stand: beginneStand(fall, rolle, 1, seed), erledigt: [], entscheidungen: [] });
}

export const gutGewaehlt = (s: Schritt) => s.picks.some((id) => s.optionen.find((o) => o.id === id)?.wertung === 'gut');

/** Darf diese Möglichkeit jetzt gewählt werden? Bis die richtige gefunden ist, darf man weiter probieren. */
export function waehlbar(st: Stufe1Stand, optionId: string): boolean {
  const a = st.aktuell;
  if (!a || st.stand.z.abschluss || offen(st.stand.z) || gutGewaehlt(a)) return false;
  // Ist der Fall vorzeitig zu Ende, bleibt nur der Abschluss.
  if (st.stand.z.ende && st.plan[a.nr]?.art === 'eingabe') return false;
  return !a.picks.includes(optionId) && a.optionen.some((o) => o.id === optionId);
}

export function waehle(st: Stufe1Stand, optionId: string): Stufe1Stand {
  if (!waehlbar(st, optionId)) return st;
  const a = st.aktuell!;
  const o = a.optionen.find((x) => x.id === optionId)!;
  const ab = st.stand.z.meldungen.length;
  const { stand, rest } = schicke(st.stand, o.eingaben);
  return { ...st, stand, ...(rest.length && offen(stand.z) ? { ausstehend: rest } : {}), aktuell: { ...a, picks: [...a.picks, o.id], pickMeldungAb: [...a.pickMeldungAb, ab] } };
}

/** Weiter zum nächsten Schritt (erst nach der richtigen Wahl; bei Fallende sofort). */
export function weiter(st: Stufe1Stand): Stufe1Stand {
  const a = st.aktuell;
  if (offen(st.stand.z)) return st;
  if (a && !gutGewaehlt(a) && !st.stand.z.ende) return st;
  const neu: Stufe1Stand = { ...st, i: a ? a.nr + 1 : st.i, aktuell: undefined, erledigt: a ? [...st.erledigt, a] : st.erledigt };
  return bereite(neu);
}

/** Entscheidungsmoment eines Fallereignisses (Uhr steht): Wahl geht an den Kern. */
export function entscheide(st: Stufe1Stand, wahl: string): Stufe1Stand {
  const ev = st.stand.z.offeneEntscheidung;
  if (!ev) return st;
  const ab = st.stand.z.meldungen.length;
  const nachher = schicke(wende(st.stand, { art: 'entscheidung', ereignis: ev, wahl }), st.ausstehend ?? []);
  const { ausstehend: _weg, ...ohne } = st;
  const stand = nachher.stand;
  const n: Stufe1Stand = { ...ohne, ...(nachher.rest.length ? { ausstehend: nachher.rest } : {}), stand, entscheidungen: [...st.entscheidungen, { ereignis: ev, wahl, meldungAb: ab }] };
  // Kam die Entscheidung im Vorlauf, geht es mit dem Schritt weiter; kam sie nach einer Wahl, bleibt der Schritt offen.
  return n.aktuell ? n : bereite(n);
}

/** Fertig, wenn der Abschluss (Pflegebedarf) an den Kern ging oder der Plan durch ist. */
export const fertig = (st: Stufe1Stand) => !!st.stand.z.abschluss || (!!st.stand.z.ende && !st.aktuell && st.i >= st.plan.length);

export function fuehreAus(st: Stufe1Stand, a: Aktion): Stufe1Stand {
  return a.art === 'wahl' ? waehle(st, a.option) : a.art === 'weiter' ? weiter(st) : entscheide(st, a.wahl);
}

/** Aus gespeicherten Aktionen wiederherstellen (gleiche Aktionen → gleicher Stand). */
export function rekonstruiere(fall: FallV2, rolle: Rolle, aktionen: readonly Aktion[], seed = 1): Stufe1Stand {
  return aktionen.reduce(fuehreAus, beginne(fall, rolle, seed));
}

/** Offene Entscheidung (Ereignis) für die Anzeige */
export function offeneEntscheidung(st: Stufe1Stand) {
  const id = st.stand.z.offeneEntscheidung;
  return id ? st.stand.z.fall.ereignisse.find((e) => e.id === id) : undefined;
}

/** Rückmeldungen des Kerns zu einem Pick (Befund, PA, Antwort), ohne die eigene Nachricht. */
export function meldungenZu(st: Stufe1Stand, s: Schritt, k: number): Meldung[] {
  const ab = s.pickMeldungAb[k] ?? s.meldungenAb;
  const bis = s.pickMeldungAb[k + 1] ?? st.stand.z.meldungen.length;
  return st.stand.z.meldungen.slice(ab, bis).filter((m) => m.richtung !== 'raus' && m.art !== 'doku');
}

/* ─────────────────────────── Zusammenfassung ─────────────────────────── */

export interface Stufe1Bilanz {
  schritte: number;
  /** richtig im ersten Versuch */
  erstVersuch: number;
  /** Schritte mit gefährlicher Wahl */
  gefaehrlich: number;
  /** je Schritt: erste Wahl falsch → was richtig gewesen wäre */
  lernpunkte: Array<{ phase: Phase; gewaehlt: string; richtig: string; warum: string }>;
}

export function bilanz(st: Stufe1Stand): Stufe1Bilanz {
  const alle = [...st.erledigt, ...(st.aktuell && st.aktuell.picks.length ? [st.aktuell] : [])];
  const lernpunkte: Stufe1Bilanz['lernpunkte'] = [];
  let erst = 0, gef = 0;
  for (const s of alle) {
    const erste = s.optionen.find((o) => o.id === s.picks[0]);
    const richtig = s.optionen.find((o) => o.wertung === 'gut');
    if (erste?.wertung === 'gut') erst++;
    else if (erste && richtig) lernpunkte.push({ phase: s.phase, gewaehlt: erste.text, richtig: richtig.text, warum: richtig.warum });
    if (s.picks.some((id) => s.optionen.find((o) => o.id === id)?.wertung === 'gefaehrlich')) gef++;
  }
  return { schritte: alle.length, erstVersuch: erst, gefaehrlich: gef, lernpunkte };
}
