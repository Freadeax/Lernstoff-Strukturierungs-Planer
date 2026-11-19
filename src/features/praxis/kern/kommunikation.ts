// Praxissimulator neu – Kommunikation (Paket P11, Runde 2). Rein und deterministisch, wird von kern.ts aufgerufen.
// Gesprächsfäden je Gegenüber, Arzt-Messenger mit verzögerten Antworten, Rückfragen, Rückaufträge mit Frist,
// Wert-Bausteine („wert:bz“ = zuletzt gemessener Wert), Schweigepflicht. Nur Daten im SimZustand, keine Uhrzeit von außen:
// Antworten werden vom Kern gestempelt (fällig = t + antwortNachSek), Replay ergibt denselben Zustand.

import { pruefe, type BedingungsKontext } from './bedingung';
import { kontext, type Meldung, type SimZustand } from './kern';
import type {
  Anzeige, ArztRegel, AuftragStatus, Gegenueber, Kanal, Rueckauftrag, SbarBaustein,
} from './typen';

/* ─────────────────────────── Zustand ─────────────────────────── */

export interface FadenStand {
  /** Telefon gerade offen (bis „auflegen“ oder bis du dich einer anderen Handlung zuwendest) */
  telefonOffen: boolean;
  /** alle Bausteine dieses Fadens (seit dem letzten `anruf`); Grundlage für `gemeldet` */
  bausteine: string[];
  /** Regeln, die in diesem Faden schon geantwortet haben (`regel:<i>` bzw. `<auftrag>:<i>`) */
  regeln: string[];
  /** offene Rückfrage der Ärztin („Wie hoch ist der Zucker?“) */
  rueckfrage?: { text: string; erwartet: string[]; auftrag?: string };
}

export interface AuftragStand {
  seit: number;
  erledigtT?: number;
  gemeldetT?: number;
  verspaetet?: boolean;
}

/** Messenger-Antwort, die erst nach `faellig` eintrifft */
export interface AusstehendeAntwort {
  faellig: number;
  /** 'regeln' = fall.arzt.regeln, sonst ID des Rückauftrags (folge-Regeln) */
  liste: string;
  index: number;
}

export interface KommStand {
  faeden: Partial<Record<Gegenueber, FadenStand>>;
  auftraege: Record<string, AuftragStand>;
  /** Regeln mit `id`, die schon geantwortet haben (antworten nur einmal) */
  regelnAus: string[];
  ausstehend: AusstehendeAntwort[];
  /** wer wann welchen Baustein gesagt hat (Bedingung `gesagt`) */
  gesagt: Array<{ id: string; an: Gegenueber; t: number }>;
}

export const neuerKommStand = (): KommStand => ({ faeden: {}, auftraege: {}, regelnAus: [], ausstehend: [], gesagt: [] });

/** Wartezeit auf eine Messenger-Antwort, wenn die Regel nichts angibt */
export const MESSENGER_SEK = 90;
/** Spielzeit je Eingabe */
export const KOSTEN = { anruf: 90, telefon: 30, messenger: 20, vorOrt: 30, auflegen: 5 } as const;

/** „Messe ich und melde mich“: Antwort auf eine Rückfrage, wenn der Wert noch fehlt */
export const ZUSAGE_ID = 'zusage:melde-mich';
export const ZUSAGE_TEXT = 'Das habe ich noch nicht erhoben. Ich messe gleich und melde mich wieder.';

export const GEGENUEBER_NAME: Record<Gegenueber, string> = {
  patient: 'Patient/in', angehoerige: 'Angehörige', eltern: 'Eltern', betreuer: 'Betreuer/in',
  aerztin: 'Ärztin/Arzt', kollegin: 'Kollegin', pa: 'Praxisanleitung', rettungsdienst: 'Rettungsdienst', 'aufnehmende-station': 'Aufnehmende Station',
};

export function faden(z: SimZustand, an: Gegenueber): FadenStand {
  return (z.komm.faeden[an] ??= { telefonOffen: false, bausteine: [], regeln: [] });
}

/* ─────────────────────────── Bedingungen ─────────────────────────── */

/** Bedingung `{ auftrag, status }`: 'erledigt' gilt auch nach dem Melden; 'verspaetet' bleibt nach dem Melden bestehen. */
export function auftragGilt(k: KommStand, id: string, status: AuftragStatus): boolean {
  const a = k.auftraege[id];
  if (!a) return false;
  switch (status) {
    case 'offen': return a.erledigtT === undefined && a.gemeldetT === undefined;
    case 'erledigt': return a.erledigtT !== undefined;
    case 'gemeldet': return a.gemeldetT !== undefined;
    case 'verspaetet': return !!a.verspaetet;
  }
}

export const gesagtGilt = (k: KommStand, id: string, an?: Gegenueber) => k.gesagt.some((g) => g.id === id && (!an || g.an === an));

/** Status zur Anzeige: gemeldet > verspätet > erledigt > offen */
export function auftragStatus(a: AuftragStand): AuftragStatus {
  return a.gemeldetT !== undefined ? 'gemeldet' : a.verspaetet ? 'verspaetet' : a.erledigtT !== undefined ? 'erledigt' : 'offen';
}

/** Rückauftrag-Bedingung relativ zur Auftragszeit: zählt nur, was danach getan wurde; `ab` = Sekunden nach dem Auftrag. */
function relativ(k: BedingungsKontext, seit: number): BedingungsKontext {
  const getan: Record<string, number[]> = {};
  for (const [id, zeiten] of Object.entries(k.getan)) {
    const danach = zeiten.filter((t) => t >= seit).map((t) => t - seit);
    if (danach.length) getan[id] = danach;
  }
  return { ...k, t: k.t - seit, getan };
}

/* ─────────────────────────── Wert-Bausteine ─────────────────────────── */

type WertSchluessel = keyof Anzeige | 'schmerz';

const WERT: Partial<Record<WertSchluessel, { label: string; einheit: string; stellen?: number }>> = {
  rrSys: { label: 'RR', einheit: 'mmHg' }, hf: { label: 'Puls', einheit: '/min' }, spo2: { label: 'SpO₂', einheit: '%' },
  af: { label: 'AF', einheit: '/min' }, temp: { label: 'Temp.', einheit: '°C', stellen: 1 }, bz: { label: 'BZ', einheit: 'mg/dl' },
  schmerz: { label: 'Schmerz (0–10)', einheit: '' }, map: { label: 'MAP', einheit: 'mmHg' }, etco2: { label: 'etCO₂', einheit: 'mmHg' },
  laktat: { label: 'Laktat', einheit: 'mmol/l', stellen: 1 }, gcs: { label: 'GCS', einheit: '' },
};

const zahl = (w: number, stellen = 0) => w.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

export function uhr(startUhrzeit: string, t: number): string {
  const [h, m] = startUhrzeit.split(':').map(Number);
  const g = ((h || 0) * 3600 + (m || 0) * 60 + Math.floor(t)) % 86400;
  return `${String(Math.floor(g / 3600)).padStart(2, '0')}:${String(Math.floor((g % 3600) / 60)).padStart(2, '0')}`;
}

/** Zuletzt gemessene Werte (aus den Befund-Meldungen, Messwert zum Messzeitpunkt) */
export function letzteMesswerte(z: SimZustand): Partial<Record<WertSchluessel, { wert: number; t: number }>> {
  const r: Partial<Record<WertSchluessel, { wert: number; t: number }>> = {};
  for (const m of z.meldungen) {
    if (m.art === 'doku') continue;   // Pflegebericht wiederholt nur Werte, misst nicht neu
    for (const [k, w] of Object.entries(m.werte ?? {}) as Array<[WertSchluessel, number]>) if (typeof w === 'number') r[k] = { wert: w, t: m.t };
  }
  return r;
}

/** Wert-Bausteine `wert:<schlüssel>` für jeden gemessenen Wert (Teil A). RR fasst rrSys/rrDia zusammen. */
export function wertBausteine(z: SimZustand): SbarBaustein[] {
  const w = letzteMesswerte(z);
  const liste: SbarBaustein[] = [];
  for (const [k, d] of Object.entries(WERT) as Array<[WertSchluessel, NonNullable<(typeof WERT)[WertSchluessel]>]>) {
    const m = w[k];
    if (!m) continue;
    const text = k === 'rrSys' && w.rrDia
      ? `RR ${zahl(m.wert)}/${zahl(w.rrDia.wert)} mmHg`
      : `${d.label} ${zahl(m.wert, d.stellen)}${d.einheit ? ` ${d.einheit}` : ''}`;
    liste.push({ id: `wert:${k}`, teil: 'A', text: `${text} (gemessen ${uhr(z.fall.startUhrzeit, m.t)})`, art: 'hilfreich' });
  }
  return liste;
}

/** Text eines Bausteins für den Chatverlauf */
export function bausteinText(z: SimZustand, id: string): string {
  if (id === ZUSAGE_ID) return ZUSAGE_TEXT;
  if (id.startsWith('wert:')) return wertBausteine(z).find((b) => b.id === id)?.text ?? id;
  return z.fall.sbar.find((b) => b.id === id)?.text ?? id;
}

/* ─────────────────────────── Ärztin ─────────────────────────── */

function regelListe(z: SimZustand, liste: string): readonly ArztRegel[] {
  return liste === 'regeln' ? z.fall.arzt.regeln : z.fall.arzt.auftraege?.find((a) => a.id === liste)?.folge ?? [];
}

const arztText = (z: SimZustand, text: string) => `${z.fall.arzt.name}: ${text}`;

function sagtArzt(z: SimZustand, text: string, quelle?: string) {
  z.meldungen.push({ t: z.t, art: 'arzt', text: arztText(z, text), faden: 'aerztin', richtung: 'rein', ...(quelle ? { quelle } : {}) });
  z.log.push({ t: z.t, art: 'antwort', von: 'aerztin', text, ...(quelle ? { regel: quelle } : {}) });
}

/** Wirkung einer Arzt-Antwort: Text, Flags, Anordnungen, Rückaufträge, Rückfrage */
function wendeAntwortAn(z: SimZustand, r: ArztRegel) {
  sagtArzt(z, r.antwort, r.id);
  for (const f of r.setzt ?? []) if (!z.flags.includes(f)) z.flags.push(f);
  for (const a of r.anordnungen ?? []) if (!z.angeboten.includes(a) && !z.anordnungen[a]) z.angeboten.push(a);
  for (const id of r.auftraege ?? []) neuerAuftrag(z, id);
  const f = faden(z, 'aerztin');
  if (r.rueckfrage) {
    f.rueckfrage = { ...r.rueckfrage };
    sagtArzt(z, r.rueckfrage.text, r.id);
  }
}

function neuerAuftrag(z: SimZustand, id: string) {
  const def = z.fall.arzt.auftraege?.find((a) => a.id === id);
  if (!def || z.komm.auftraege[id]) return;
  z.komm.auftraege[id] = { seit: z.t };
  z.log.push({ t: z.t, art: 'auftrag', id, status: 'offen' });
}

/**
 * Erste passende Regel aus der Liste, die in diesem Faden noch nicht und (mit id) im Fall noch nie geantwortet hat.
 * Im laufenden Faden geht es nur „nach oben“: Hat Regel k geantwortet, kommen danach nur noch Regeln vor k in Frage
 * (die Reihenfolge im Fall ist von genau nach allgemein). So antwortet z. B. „Rufen Sie mit den Werten noch mal an“
 * nicht erneut, wenn die Ärztin schon nach dem Zucker gefragt hat.
 */
function waehle(z: SimZustand, liste: string): number {
  const f = faden(z, 'aerztin');
  const schon = f.regeln.filter((r) => r.startsWith(`${liste}:`)).map((r) => Number(r.slice(liste.length + 1)));
  const grenze = schon.length ? Math.min(...schon) : Infinity;
  return regelListe(z, liste).findIndex((r, i) =>
    i < grenze && !(r.id && z.komm.regelnAus.includes(r.id)) && pruefe(r.wenn, kontext(z)));
}

/** Regel antwortet: sofort (Telefon) oder nach antwortNachSek (Messenger). */
function antworte(z: SimZustand, liste: string, index: number, kanal: Kanal) {
  const r = regelListe(z, liste)[index];
  if (!r) return;
  if (r.id && !z.komm.regelnAus.includes(r.id)) z.komm.regelnAus.push(r.id);
  faden(z, 'aerztin').regeln.push(`${liste}:${index}`);
  const warte = r.antwortNachSek ?? (kanal === 'messenger' ? MESSENGER_SEK : 0);
  if (warte > 0) z.komm.ausstehend.push({ faellig: z.t + warte, liste, index });
  else wendeAntwortAn(z, r);
}

/** Klassischer Anruf (SimEventEingabe 'anruf' und Entscheidungen mit loestAnrufAus): öffnet den Faden neu. */
export function arztAnruf(z: SimZustand, sbar: readonly string[]) {
  const f = faden(z, 'aerztin');
  f.telefonOffen = true;
  f.bausteine = gueltigeBausteine(z, sbar);
  f.regeln = [];
  f.rueckfrage = undefined;
  z.letzterAnruf = [...f.bausteine];
  for (const id of f.bausteine) z.komm.gesagt.push({ id, an: 'aerztin', t: z.t });
  if (f.bausteine.length) raus(z, 'aerztin', f.bausteine, undefined, 'telefon');
  const i = waehle(z, 'regeln');
  if (i < 0) sagtArzt(z, '„Ich habe Sie nicht ganz verstanden. Was genau ist los?“');
  else antworte(z, 'regeln', i, 'telefon');
}

/** Nur Wert-Bausteine von Werten, die wirklich gemessen wurden; doppelte entfernen. */
function gueltigeBausteine(z: SimZustand, ids: readonly string[]): string[] {
  const werte = new Set(wertBausteine(z).map((b) => b.id));
  return [...new Set(ids)].filter((id) => !id.startsWith('wert:') || werte.has(id));
}

function raus(z: SimZustand, an: Gegenueber, bausteine: readonly string[], freitext: string | undefined, kanal: Kanal) {
  const satz = (t: string) => (/[.!?“]$/.test(t) ? t : `${t}.`);
  const text = [...bausteine.map((id) => satz(bausteinText(z, id))), ...(freitext?.trim() ? [`„${freitext.trim()}“`] : [])].join(' ');
  z.meldungen.push({ t: z.t, art: 'nachricht', text: text || '…', faden: an, richtung: 'raus', quelle: kanal });
}

/** Kanäle zur Ärztin: aus dem Fall; sonst Telefon und, sobald sie einmal konsultiert ist, der Messenger. */
export function arztKanaele(z: SimZustand): Kanal[] {
  if (z.fall.arzt.kanaele?.length) return [...z.fall.arzt.kanaele];
  const konsultiert = !!z.getan['anruf-aerztin']?.length || !!z.getan['nachricht-aerztin']?.length;
  return konsultiert ? ['telefon', 'messenger'] : ['telefon'];
}

/**
 * Nachricht an die Ärztin (Telefon im offenen Faden oder Messenger). Ablauf:
 * 1. Rückmeldung zu einem erledigten Rückauftrag (alle `meldung`-Bausteine in dieser Nachricht) → gemeldet, `folge`-Regel antwortet.
 * 2. Offene Rückfrage: `erwartet` enthalten → Regeln erneut; Zusage „melde mich“ → Rückauftrag `rueckfrage.auftrag`.
 * 3. Sonst: erste passende Regel mit allen Bausteinen des Fadens.
 * Gibt die Spielzeit zurück, die die Nachricht kostet.
 */
export function arztNachricht(z: SimZustand, kanal: Kanal, ids: readonly string[], freitext: string | undefined, auftrag: string | undefined): number {
  const f = faden(z, 'aerztin');
  const kanalOk = arztKanaele(z).includes(kanal) ? kanal : 'telefon';
  let kosten: number = kanalOk === 'messenger' ? KOSTEN.messenger : KOSTEN.telefon;
  if (kanalOk === 'telefon' && !f.telefonOffen) { f.telefonOffen = true; kosten = KOSTEN.anruf; (z.getan['anruf-aerztin'] ??= []).push(z.t); }
  if (kanalOk === 'messenger') { f.telefonOffen = false; (z.getan['nachricht-aerztin'] ??= []).push(z.t); }
  const bausteine = gueltigeBausteine(z, ids);
  raus(z, 'aerztin', bausteine, freitext, kanalOk);
  for (const id of bausteine) if (!f.bausteine.includes(id)) f.bausteine.push(id);
  for (const id of bausteine) z.komm.gesagt.push({ id, an: 'aerztin', t: z.t });
  z.letzterAnruf = [...f.bausteine];
  aktualisiereAuftraege(z);

  // 1. Rückmeldung zu einem Rückauftrag
  const def = (z.fall.arzt.auftraege ?? []).find((a) => {
    const s = z.komm.auftraege[a.id];
    return s && s.erledigtT !== undefined && s.gemeldetT === undefined && (!auftrag || auftrag === a.id) && a.meldung.every((m) => bausteine.includes(m));
  });
  if (def) {
    z.komm.auftraege[def.id]!.gemeldetT = z.t;
    z.log.push({ t: z.t, art: 'auftrag', id: def.id, status: 'gemeldet' });
    const i = waehle(z, def.id);
    if (i >= 0) antworte(z, def.id, i, kanalOk);
    else if (kanalOk === 'messenger') z.komm.ausstehend.push({ faellig: z.t + MESSENGER_SEK, liste: 'danke', index: 0 });
    else sagtArzt(z, '„Danke für die Rückmeldung.“');
    return kosten;
  }

  // 2. Offene Rückfrage
  if (f.rueckfrage) {
    const rf = f.rueckfrage;
    if (rf.erwartet.every((e) => bausteine.includes(e))) f.rueckfrage = undefined;
    else if (bausteine.includes(ZUSAGE_ID)) {
      f.rueckfrage = undefined;
      if (rf.auftrag) neuerAuftrag(z, rf.auftrag);
      sagtArzt(z, '„Gut, dann melden Sie sich bitte, sobald Sie den Wert haben.“');
      return kosten;
    }
  }

  // 3. Regeln mit dem ganzen Faden
  const i = waehle(z, 'regeln');
  if (i >= 0) antworte(z, 'regeln', i, kanalOk);
  else if (!bausteine.length && !freitext?.trim()) sagtArzt(z, '„Ja? Was gibt es?“');
  else if (f.regeln.length === 0) sagtArzt(z, '„Ich habe Sie nicht ganz verstanden. Was genau ist los?“');
  else sagtArzt(z, '„Danke, ist notiert.“');
  return kosten;
}

export function auflegen(z: SimZustand, an: Gegenueber): boolean {
  const f = z.komm.faeden[an];
  if (!f?.telefonOffen) return false;
  f.telefonOffen = false;
  z.meldungen.push({ t: z.t, art: 'hinweis', text: 'Aufgelegt.', faden: an, richtung: 'raus' });
  return true;
}

/** Wer sich dem Patienten zuwendet, legt auf (Telefon nicht nebenbei). */
export function legeAufWennOffen(z: SimZustand) {
  for (const an of Object.keys(z.komm.faeden) as Gegenueber[]) {
    if (z.komm.faeden[an]?.telefonOffen) auflegen(z, an);
  }
}

/* ─────────────────────────── Andere Gesprächspartner ─────────────────────────── */

const QUITTUNG: Partial<Record<Gegenueber, string>> = {
  rettungsdienst: '„Danke, habe ich so übernommen.“',
  'aufnehmende-station': '„Danke für die Übergabe, wir sind vorbereitet.“',
  kollegin: '„Alles klar, danke.“',
  pa: '„Danke, gut zusammengefasst.“',
};

/** Nachricht an Patient, Angehörige, Kollegin, PA, Rettungsdienst, Station: Bausteine festhalten, kurze Quittung. */
export function andereNachricht(z: SimZustand, an: Gegenueber, kanal: Kanal, ids: readonly string[], freitext: string | undefined): number {
  const bausteine = gueltigeBausteine(z, ids);
  raus(z, an, bausteine, freitext, kanal);
  const f = faden(z, an);
  for (const id of bausteine) if (!f.bausteine.includes(id)) f.bausteine.push(id);
  for (const id of bausteine) z.komm.gesagt.push({ id, an, t: z.t });
  (z.getan[`nachricht:${an}`] ??= []).push(z.t);
  const name = an === 'kollegin' ? z.fall.team?.kollegin : an === 'pa' ? z.fall.pa.name : z.fall.team?.weitere?.[an];
  const text = QUITTUNG[an] ?? '„Danke.“';
  z.meldungen.push({ t: z.t, art: 'gespraech', text: name ? `${name}: ${text}` : text, faden: an, richtung: 'rein' });
  return kanal === 'messenger' ? KOSTEN.messenger : kanal === 'telefon' ? KOSTEN.telefon : KOSTEN.vorOrt;
}

/* ─────────────────────────── Takt: Antworten und Fristen ─────────────────────────── */

/** Fällige Messenger-Antworten zustellen (nach dem Zeitschritt). */
export function stelleZu(z: SimZustand) {
  if (!z.komm.ausstehend.length) return;
  const faellig = z.komm.ausstehend.filter((a) => a.faellig <= z.t);
  if (!faellig.length) return;
  z.komm.ausstehend = z.komm.ausstehend.filter((a) => a.faellig > z.t);
  for (const a of faellig) {
    if (a.liste === 'danke') { sagtArzt(z, '„Danke für die Rückmeldung.“'); continue; }
    const r = regelListe(z, a.liste)[a.index];
    if (r) wendeAntwortAn(z, r);
  }
}

/** Rückaufträge prüfen: erledigt (Bedingung nach Auftragszeit), verspätet (Frist) → PA-Impuls und Fehler. */
export function aktualisiereAuftraege(z: SimZustand) {
  let k: BedingungsKontext | undefined;
  for (const [id, s] of Object.entries(z.komm.auftraege)) {
    if (s.gemeldetT !== undefined) continue;
    const def = z.fall.arzt.auftraege?.find((a) => a.id === id);
    if (!def) continue;
    if (s.erledigtT === undefined && pruefe(def.erledigt, relativ((k ??= kontext(z)), s.seit))) {
      s.erledigtT = z.t;
      z.log.push({ t: z.t, art: 'auftrag', id, status: 'erledigt' });
    }
    if (!s.verspaetet && def.meldenBinnenSek !== undefined && z.t > s.seit + def.meldenBinnenSek) {
      s.verspaetet = true;
      z.log.push({ t: z.t, art: 'auftrag', id, status: 'verspaetet' });
      const fid = `auftrag-verspaetet:${id}`;
      if (!z.fehlerAus.includes(fid)) { z.fehlerAus.push(fid); z.log.push({ t: z.t, art: 'fehler', id: fid }); }
      if (z.stufe < 3) {
        z.meldungen.push({ t: z.t, art: 'pa', text: `${z.fall.pa.name}: „Die Ärztin wartet noch auf deine Rückmeldung: ${def.text}“`, faden: 'pa', richtung: 'rein', quelle: fid });
      }
    }
  }
}

/** Offene Rückaufträge für die Leiste (Frist in Sekunden, negativ = überfällig). */
export interface AuftragZeile { id: string; text: string; status: AuftragStatus; seit: number; restSek?: number; meldung: string[] }
export function auftragsListe(z: SimZustand): AuftragZeile[] {
  return (z.fall.arzt.auftraege ?? []).flatMap((def: Rueckauftrag): AuftragZeile[] => {
    const s = z.komm.auftraege[def.id];
    if (!s) return [];
    return [{
      id: def.id, text: def.text, status: auftragStatus(s), seit: s.seit, meldung: def.meldung,
      ...(def.meldenBinnenSek !== undefined && s.gemeldetT === undefined ? { restSek: s.seit + def.meldenBinnenSek - z.t } : {}),
    }];
  });
}

/** Fehlertexte für Kommunikationsfehler, die nicht im Fall stehen (Auswertung, KB II/IV). */
export function kommFehler(z: SimZustand, id: string): { text: string; warum: string; kb: Array<'II' | 'IV'>; schwere: 'leicht' | 'mittel' } | undefined {
  if (id.startsWith('auftrag-verspaetet:')) {
    const def = z.fall.arzt.auftraege?.find((a) => a.id === id.slice('auftrag-verspaetet:'.length));
    return { text: `Rückauftrag nicht rechtzeitig gemeldet${def ? `: ${def.text}` : ''}`, schwere: 'leicht', kb: ['II'],
      warum: 'Die Ärztin plant mit deiner Rückmeldung. Kommt sie zu spät, entscheidet sie ohne aktuelle Werte (Closed Loop).' };
  }
  if (id.startsWith('schweigepflicht:')) {
    const g = z.fall.gespraech.find((x) => x.id === id.slice('schweigepflicht:'.length));
    return { text: `Schweigepflicht verletzt${g ? `: ${g.frage}` : ''}`, schwere: 'mittel', kb: ['II', 'IV'],
      warum: g?.schweigepflicht?.fehlerText ?? 'Auskünfte an Dritte nur mit Einwilligung oder rechtlicher Grundlage (§ 203 StGB).' };
  }
  return undefined;
}

export type { Meldung };
