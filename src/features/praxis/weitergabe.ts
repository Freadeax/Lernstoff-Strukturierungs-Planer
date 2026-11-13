// Brücke Praxissimulator → Dokumentation: Ein gespielter Fall wird zur Vorlage für Übergabe,
// Pflegebericht und Pflegeplanung. Alles leitet sich aus dem Spielstand ab (Messwerte, erledigte
// Handlungen, Ereignisse, ausstehende Ergebnisse). Erwartet wird nur, was im Spiel wirklich
// vorkam: Wer nicht gemessen hat, muss keine Werte übergeben, sondern genau das sagen.
// Die Links tragen nur die Sitzungs-ID; die Daten bleiben im Gerätespeicher des Praxissimulators.

import { alarmStufe, monitorGruppe, type MonitorParameter } from '../../ui/sim/monitor';
import type { BerichtFall, Kernpunkt as BerichtPunkt, Bereich } from '../bericht/faelle';
import type { Fall as UebergabeFall, Kernpunkt as UebergabePunkt } from '../uebergabe/faelle';
import { vereinfache } from '../uebergabe/pruefung';
import { clock } from './engine';
import { raumFotoFuer } from './raumfotos';
import { readArchive, readSession } from './storage';
import { alterText, SETTINGS, type Session, type Vital } from './types';

/** Gespielte Sitzung aus dem laufenden Stand oder dem Archiv (letzte zehn Fälle). */
export function findeSitzung(id: string | null | undefined): Session | null {
  if (!id) return null;
  const aktuell = readSession().session;
  if (aktuell?.id === id) return aktuell;
  return readArchive().find((s) => s.id === id) ?? null;
}

export const weiterLink = (ziel: 'uebergabe' | 'bericht' | 'pflegeplanung', s: Pick<Session, 'id'>) =>
  `#/lernen/${ziel}?aus=praxis&sitzung=${encodeURIComponent(s.id)}`;

// ---------- Bausteine ----------

const STOPP = new Set(['einschliesslich', 'erfragen', 'standard', 'anordnung', 'beurteilen', 'vorbereiten', 'einbeziehen', 'erneut', 'wuensche', 'befinden', 'zustand', 'wirkung', 'strukturierte', 'nach', 'sofort', 'damit', 'messen', 'geben', 'ueber', 'anfordern', 'hinzuziehen', 'qualifiziertes']);

/** Wortstamm für die Mustersuche: vereinfacht, lange Wörter ohne Endung („nachblutung“ → „nachblutu“). */
export function stamm(wort: string): string {
  const v = vereinfache(wort).replace(/[^a-z0-9-]/g, '');
  return v.length > 7 ? v.slice(0, v.length - 2) : v;
}

/** Die n aussagekräftigsten Wörter eines Textes als Stämme (lange Wörter zuerst, ohne Füllwörter). */
export function schluessel(text: string, n = 2): string[] {
  const woerter = text.split(/[^A-Za-zÄÖÜäöüß-]+/).map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w.length >= 5 && !STOPP.has(vereinfache(w)));
  const eindeutig = [...new Map(woerter.map((w) => [stamm(w), w])).keys()];
  return eindeutig.sort((a, b) => b.length - a.length).slice(0, n);
}

const zahlText = (k: Vital, n: number) => (k === 'temp' ? String(Math.round(n * 10) / 10).replace('.', ',') : String(Math.round(n)));
const AVPU_TEXT: Record<string, { text: string; muster: string[] }> = {
  C: { text: 'neu verwirrt', muster: ['verwirr', 'desorient', 'delir'] },
  V: { text: 'reagiert nur auf Ansprache', muster: ['ansprache', 'somnol', 'schlaefrig', 'erweckbar'] },
  P: { text: 'reagiert nur auf Schmerzreiz', muster: ['schmerzreiz', 'sopor', 'kaum erweckbar'] },
  U: { text: 'reagiert nicht', muster: ['reagiert nicht', 'bewusstlos', 'keine reaktion', 'koma'] },
};
const PARAM: Partial<Record<Vital, { p: MonitorParameter; name: string; einheit: string }>> = {
  pulse: { p: 'puls', name: 'Puls', einheit: '/min' },
  resp: { p: 'af', name: 'Atemfrequenz', einheit: '/min' },
  spo2: { p: 'spo2', name: 'SpO₂', einheit: ' %' },
  sys: { p: 'sys', name: 'RR systolisch', einheit: ' mmHg' },
  temp: { p: 'temp', name: 'Temperatur', einheit: ' °C' },
};

export interface Messwert { key: Vital; text: string; zahl: string; auffaellig: boolean }

/** Zuletzt gemessene Werte, mit Auffälligkeit nach Altersgruppe (Kinder nach Kinderprofil). */
export function messwerte(s: Session): Messwert[] {
  const m = s.measured, gruppe = monitorGruppe(s.scenario.age);
  const out: Messwert[] = [];
  for (const k of ['pulse', 'sys', 'resp', 'spo2', 'temp'] as Vital[]) {
    const v = m[k];
    if (v === undefined) continue;
    const info = PARAM[k]!;
    const zahl = zahlText(k, v);
    const text = k === 'sys' && m.dia !== undefined ? `RR ${zahl}/${Math.round(m.dia)} mmHg` : `${info.name} ${zahl}${info.einheit}`;
    out.push({ key: k, text, zahl, auffaellig: alarmStufe(info.p, v, gruppe) !== 'ok' });
  }
  if (m.glucose !== undefined) out.push({ key: 'glucose', text: `BZ ${Math.round(m.glucose)} mg/dl`, zahl: String(Math.round(m.glucose)), auffaellig: m.glucose < 70 || m.glucose > 200 });
  if (m.pain !== undefined) out.push({ key: 'pain', text: `Schmerz NRS ${Math.round(m.pain)}`, zahl: String(Math.round(m.pain)), auffaellig: m.pain >= 4 });
  return out;
}

export interface Erledigt { id: string; label: string }

/** Was du im Fall getan hast: Pflege, Absprachen, Diagnostik, Geräte und Medikamente (ohne Gespräch und Untersuchung). */
export function handlungen(s: Session): Erledigt[] {
  const out: Erledigt[] = [];
  for (const id of s.done) {
    if (id.startsWith('med:')) {
      const med = s.scenario.medications.find((x) => `med:${x.id}` === id);
      if (med) out.push({ id, label: `${med.name} nach Anordnung gegeben` });
      continue;
    }
    const a = s.scenario.actions.find((x) => x.id === id);
    if (a && !a.harm && ['pflege', 'kommunikation', 'diagnostik', 'geraete'].includes(a.category)) out.push({ id, label: a.label });
  }
  return out;
}

/** Probleme aus dem Fallfokus („Unfallchirurgie · Nachblutung · Schockzeichen“ → Nachblutung, Schockzeichen). */
export function probleme(s: Session): string[] {
  const teile = s.scenario.focus.split('·').map((x) => x.trim()).filter(Boolean);
  return teile.length > 1 ? teile.slice(1) : teile;
}

const nachname = (s: Session) => s.scenario.patient.trim().split(/\s+/).at(-1) ?? s.scenario.patient;
const ersterSatz = (t: string) => (t.match(/^[^.!?]+[.!?]?/)?.[0] ?? t).trim();
const zeit = (sek: number) => clock(sek).slice(0, 5);

/** Chronik der Sitzung in lesbaren Zeilen (Minute seit Übernahme, Titel, Inhalt). */
export function chronik(s: Session, max = 30): string[] {
  return s.events
    .filter((e) => e.kind !== 'state' && e.kind !== 'note')
    .slice(-max)
    .map((e) => `${zeit(e.at)} ${e.title}: ${e.detail}`);
}

// ---------- Pflegeplanung ----------

export function planVorlage(s: Session): { text: string; verlauf: string } {
  const sc = s.scenario;
  const werte = messwerte(s);
  const text = [
    `${sc.patient}, ${alterText(sc.age)}, ${SETTINGS[sc.setting]}.`,
    sc.background, sc.situation, sc.assessment,
    sc.allergies.length ? `Allergien: ${sc.allergies.join(', ')}.` : 'Keine Allergien bekannt.',
    werte.length ? `Zuletzt gemessen: ${werte.map((w) => w.text).join(', ')}.` : '',
    `(Fall aus dem Praxissimulator, frei erfunden)`,
  ].filter(Boolean).join('\n');
  return { text, verlauf: chronik(s, 20).join('\n') };
}

// ---------- Übergabe an den Folgedienst ----------

export function uebergabeFall(s: Session): UebergabeFall {
  const sc = s.scenario;
  const werte = messwerte(s);
  const auff = werte.filter((w) => w.auffaellig);
  const tat = handlungen(s);
  const prob = probleme(s);
  const avpu = s.avpu && s.avpu !== 'A' ? AVPU_TEXT[s.avpu] : undefined;
  const k: UebergabePunkt[] = [
    { id: 'patient', teil: 'S', pflicht: true, text: `Person benennen (${sc.patient})`, muster: [stamm(nachname(s))] },
    { id: 'problem', teil: 'S', pflicht: true, text: `Aktuelles Problem: ${prob.join(', ')}`, muster: prob.flatMap((p) => schluessel(p, 2)) },
    { id: 'hintergrund', teil: 'B', pflicht: false, text: `Hintergrund: ${ersterSatz(sc.background)}`, muster: schluessel(ersterSatz(sc.background), 3) },
  ];
  if (sc.allergies.length) k.push({ id: 'allergie', teil: 'B', pflicht: true, text: `Allergie: ${sc.allergies.join(', ')}`, muster: ['allergi', ...sc.allergies.map(stamm)] });
  for (const w of auff) k.push({ id: `wert-${w.key}`, teil: 'A', pflicht: true, text: w.text, muster: [w.zahl] });
  if (!werte.length) k.push({ id: 'ungemessen', teil: 'A', pflicht: true, text: 'Dass noch keine Vitalwerte gemessen wurden', muster: ['nicht gemessen', 'keine vitalwerte', 'keine werte', 'noch keine', 'ungemessen'] });
  else if (!auff.length) k.push({ id: 'stabil', teil: 'A', pflicht: false, text: `Werte im Normbereich (${werte.map((w) => w.text).join(', ')})`, muster: ['stabil', 'unauffaellig', 'normbereich', 'normal', ...werte.map((w) => w.zahl)] });
  if (avpu) k.push({ id: 'bewusstsein', teil: 'A', pflicht: true, text: `Bewusstsein: ${avpu.text}`, muster: avpu.muster });
  if (tat.length) k.push({ id: 'getan', teil: 'A', pflicht: true, text: `Was du getan hast (${tat.map((t) => t.label).join('; ')})`, muster: tat.flatMap((t) => schluessel(t.label, 2)) });
  if (s.pending.length) k.push({ id: 'ausstehend', teil: 'R', pflicht: true, text: `Ausstehend: ${s.pending.map((p) => p.title).join(', ')}`, muster: ['ausstehend', 'steht noch aus', 'noch nicht da', ...s.pending.flatMap((p) => schluessel(p.title, 1))] });

  const muster = [
    `S: Ich übergebe ${sc.patient}, ${alterText(sc.age)}. Aktuell geht es um ${prob.join(' und ')}.`,
    `B: ${sc.background}${sc.allergies.length ? ` Allergie: ${sc.allergies.join(', ')}.` : ''}`,
    `A: ${werte.length ? `Zuletzt gemessen: ${werte.map((w) => w.text).join(', ')}.${auff.length ? '' : ' Die Werte sind stabil.'}` : 'Vitalwerte habe ich noch nicht gemessen.'}${avpu ? ` ${sc.patient} ${avpu.text}.` : ''}${tat.length ? ` Ich habe: ${tat.map((t) => t.label).join('; ')}.` : ''}`,
    `R: Bitte ${s.pending.length ? `die ausstehenden Ergebnisse (${s.pending.map((p) => p.title).join(', ')}) nachverfolgen und ` : ''}die Werte weiter kontrollieren und auf Verschlechterung achten.`,
  ].join('\n');

  return {
    id: `praxis-${s.id}`,
    titel: `Aus deinem Praxisfall: ${sc.title}`,
    bereich: SETTINGS[sc.setting],
    anlass: 'schicht',
    empfaenger: 'Kollegin im Folgedienst, am Bett',
    rolle: 'Du hast den Fall im Praxissimulator versorgt',
    lage: `Dein Dienst endet nach ${Math.max(1, Math.round(s.time / 60))} Minuten Fallzeit. Übergib ${sc.patient} so, dass die Kollegin sicher weiterarbeiten kann. Erwartet wird nur, was in deinem Spiel wirklich passiert ist.`,
    daten: [
      { label: 'Person', wert: `${sc.patient}, ${alterText(sc.age)}` },
      { label: 'Hintergrund', wert: sc.background },
      { label: 'Allergien', wert: sc.allergies.length ? sc.allergies.join(', ') : 'keine bekannt' },
      { label: 'Zuletzt gemessen', wert: werte.length ? werte.map((w) => w.text).join(', ') : 'nicht gemessen' },
      ...(avpu ? [{ label: 'Bewusstsein', wert: avpu.text }] : []),
      { label: 'Erledigt', wert: tat.length ? tat.map((t) => t.label).join('; ') : 'keine Pflegehandlung oder Absprache' },
      ...(s.pending.length ? [{ label: 'Ausstehend', wert: s.pending.map((p) => p.title).join(', ') }] : []),
    ],
    kernpunkte: k.filter((x) => x.muster.length),
    muster,
    ...(raumFotoFuer(sc.id) ? { raum: raumFotoFuer(sc.id)!.id } : {}),
  };
}

// ---------- Pflegebericht ----------

const BEREICH: Partial<Record<Session['scenario']['setting'], Bereich>> = { heim: 'langzeit', ambulant: 'ambulant' };

export function berichtFall(s: Session): BerichtFall {
  const sc = s.scenario;
  const werte = messwerte(s);
  const tat = handlungen(s);
  const sprach = s.done.includes('patient');
  const weitergabe = s.done.some((d) => d === 'orders' || d === 'help');
  const beobachtet = s.done.some((d) => ['inspect', 'assessment', 'palpate'].includes(d));
  const k: BerichtPunkt[] = [
    { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit oder Zeitraum', muster: ['uhr', 'minut'] },
  ];
  if (werte.length) k.push({ id: 'werte', baustein: 'beobachtung', pflicht: true, text: `Gemessene Werte (${werte.map((w) => w.text).join(', ')})`, muster: werte.filter((w) => w.auffaellig).map((w) => w.zahl).concat(werte.some((w) => w.auffaellig) ? [] : werte.map((w) => w.zahl)) });
  if (beobachtet) k.push({ id: 'befund', baustein: 'beobachtung', pflicht: !werte.length, text: `Beobachtung: ${ersterSatz(sc.findings.inspect)}`, muster: schluessel(`${sc.findings.inspect} ${sc.assessment}`, 4) });
  if (sprach) k.push({ id: 'aussage', baustein: 'aussage', pflicht: false, text: `Aussage wörtlich: ${sc.dialogue.patient}`, muster: schluessel(sc.dialogue.patient, 3) });
  if (tat.length) k.push({ id: 'massnahme', baustein: 'massnahme', pflicht: true, text: `Maßnahme (${tat.map((t) => t.label).join('; ')})`, muster: tat.flatMap((t) => schluessel(t.label, 2)) });
  if (tat.length) k.push({ id: 'wirkung', baustein: 'wirkung', pflicht: false, text: 'Wirkung oder Verlauf danach', muster: ['danach', 'anschliessend', 'daraufhin', 'unveraendert', 'besser', 'schlechter', 'kontroll', 'reagiert'] });
  if (weitergabe) k.push({ id: 'weitergabe', baustein: 'weitergabe', pflicht: true, text: 'Wen du informiert hast', muster: ['arzt', 'aerztin', 'dienst', 'informiert', 'team', 'verstaendigt'] });

  const muster = [
    `${Math.max(1, Math.round(s.time / 60))} Minuten nach Übernahme:`,
    beobachtet ? ersterSatz(sc.findings.inspect) : '',
    sc.assessment,
    werte.length ? `Gemessen: ${werte.map((w) => w.text).join(', ')}.` : '',
    sprach ? `${sc.patient} sagt: „${sc.dialogue.patient}“` : '',
    tat.length ? `Maßnahmen: ${tat.map((t) => t.label).join('; ')}.` : '',
    tat.length ? 'Danach Kontrolle der Werte, Verlauf siehe Kurve.' : '',
    weitergabe ? 'Diensthabende Ärztin informiert.' : '',
  ].filter(Boolean).join(' ');

  return {
    id: `praxis-${s.id}`,
    titel: `Aus deinem Praxisfall: ${sc.title}`,
    art: 'schreiben',
    bereich: BEREICH[sc.setting] ?? 'akut',
    person: `${sc.patient}, ${alterText(sc.age)}, ${ersterSatz(sc.background)}`,
    szene: [sc.situation, ...chronik(s, 12)],
    kernpunkte: k.filter((x) => x.muster.length),
    muster,
  };
}
