// Neuer Arbeitsplatz → Dokumentation (P5): Ein abgeschlossener Fall auf dem Kern wird zur Vorlage für
// Übergabe, Pflegebericht und Pflegeplanung, wie beim bisherigen Simulator (../weitergabe.ts).
// Erwartet wird nur, was im Spiel vorkam: Werte, die sichtbar waren, eigene Maßnahmen, erhaltene Anordnungen.
// Links tragen nur „neu:<fall>“; der Stand liegt im Gerätespeicher des Arbeitsplatzes (nur Eingaben, Replay).

import type { BerichtFall, Kernpunkt as BerichtPunkt } from '../../bericht/faelle';
import type { Fall as UebergabeFall, Kernpunkt as UebergabePunkt } from '../../uebergabe/faelle';
import { massnahmenIn, protokoll } from '../kern/auswertung';
import { FAELLE_V2 } from '../kern/faelle';
import { alarmFuer } from '../kern/physiologie/altersprofile';
import { anzeige, massnahme, replay, type SimZustand } from '../kern/kern';
import type { Anzeige, FallV2 } from '../kern/typen';
import { schluessel, stamm } from '../weitergabe';
import { uhrzeit } from './ansicht';
import { lies } from './speicher';

export const NEU_PRAEFIX = 'neu:';
export const weiterLinkNeu = (ziel: 'uebergabe' | 'bericht' | 'pflegeplanung', fall: Pick<FallV2, 'id'>) =>
  `#/lernen/${ziel}?aus=praxis&sitzung=${encodeURIComponent(NEU_PRAEFIX + fall.id)}`;

/** Abgeschlossenen Fall des neuen Arbeitsplatzes wiederherstellen (null, wenn nicht gespeichert oder nicht abgeschlossen). */
export function findeNeu(id: string | null | undefined, faelle: readonly FallV2[] = FAELLE_V2): SimZustand | null {
  if (!id?.startsWith(NEU_PRAEFIX)) return null;
  const fall = faelle.find((f) => f.id === id.slice(NEU_PRAEFIX.length));
  const g = fall ? lies(fall) : null;
  if (!fall || !g) return null;
  const z = replay(fall, g.rolle, g.stufe, g.seed, g.eingaben);
  return z.abschluss ? z : null;
}

const SETTING: Record<FallV2['setting'], string> = {
  krankenhaus: 'Krankenhaus, Station', langzeit: 'Pflegeheim', ambulant: 'Ambulante Pflege', paediatrie: 'Kinderstation', psychiatrie: 'Psychiatrie',
  notaufnahme: 'Notaufnahme', schockraum: 'Schockraum', intensiv: 'Intensivstation', imc: 'IMC', aufwachraum: 'Aufwachraum',
};
const alter = (f: FallV2) => (f.person.alter.jahre !== undefined ? `${f.person.alter.jahre} Jahre` : `${f.person.alter.monate ?? 0} Monate`);
const nachname = (f: FallV2) => f.person.name.trim().split(/\s+/).at(-1) ?? f.person.name;
const ersterSatz = (t: string) => (t.match(/^[^.!?]+[.!?]?/)?.[0] ?? t).trim();

export interface WertNeu { key: keyof Anzeige; text: string; zahl: string; auffaellig: boolean }

const WERTE: Array<{ key: keyof Anzeige; name: string; einheit: string }> = [
  { key: 'hf', name: 'Puls', einheit: '/min' }, { key: 'rrSys', name: 'RR', einheit: 'mmHg' }, { key: 'af', name: 'Atemfrequenz', einheit: '/min' },
  { key: 'spo2', name: 'SpO₂', einheit: '%' }, { key: 'temp', name: 'Temperatur', einheit: '°C' }, { key: 'bz', name: 'BZ', einheit: 'mg/dl' },
  { key: 'map', name: 'MAP', einheit: 'mmHg' }, { key: 'laktat', name: 'Laktat', einheit: 'mmol/l' },
];

/** Werte am Ende, nur was gemessen bzw. am Monitor sichtbar war. */
export function werteNeu(z: SimZustand): WertNeu[] {
  const a = anzeige(z);
  const sichtbar = new Set(z.sichtbar);
  if (sichtbar.has('rrSys') || sichtbar.has('rrDia')) sichtbar.add('rrSys');
  return WERTE.flatMap((w) => {
    const v = a[w.key];
    if (!sichtbar.has(w.key) || typeof v !== 'number') return [];
    const zahl = w.key === 'temp' || w.key === 'laktat' ? v.toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : String(Math.round(v));
    const text = w.key === 'rrSys' ? `RR ${zahl}/${Math.round(a.rrDia)} mmHg` : `${w.name} ${zahl} ${w.einheit}`;
    const alarm = ['hf', 'rrSys', 'af', 'spo2', 'temp'].includes(w.key) ? alarmFuer(w.key, v, z.fall.altersgruppe) !== 'ok'
      : w.key === 'map' ? v < 65 : w.key === 'laktat' ? v > 2 : w.key === 'bz' ? v < 70 || v > 200 : false;
    return [{ key: w.key, text, zahl, auffaellig: alarm }];
  });
}

/** Eigene Maßnahmen (ohne Gespräche, Entscheidungen, Fehlhandlungen). */
export function erledigtNeu(z: SimZustand): string[] {
  const fehlerMassnahmen = new Set(z.fehlerAus.flatMap((id) => {
    const f = z.fall.bewertung.fehler.find((x) => x.id === id);
    return f ? massnahmenIn(f.wenn) : [];
  }));
  return Object.keys(z.getan)
    .filter((id) => !id.includes(':') && id !== 'anruf-aerztin' && !fehlerMassnahmen.has(id))
    .sort((a, b) => z.getan[a]![0]! - z.getan[b]![0]!)
    .map((id) => massnahme(z.fall, id)?.name ?? id);
}

const problemeNeu = (z: SimZustand) => (z.abschluss?.probleme ?? [])
  .map((id) => z.fall.pflegebedarf.probleme.find((p) => p.id === id))
  .filter((p): p is NonNullable<typeof p> => !!p?.richtig).map((p) => p.text);

const anordnungenNeu = (z: SimZustand) => z.fall.anordnungen.filter((a) => z.anordnungen[a.id] && !z.zurueckgezogen.includes(a.id) && !(z.fall.start.anordnungen ?? []).includes(a.id)).map((a) => a.text);
const allergien = (f: FallV2) => f.person.allergien.filter((a) => !/keine/i.test(a));

export function planVorlageNeu(z: SimZustand): { text: string; verlauf: string } {
  const f = z.fall;
  const werte = werteNeu(z);
  const text = [
    `${f.person.name}, ${alter(f)}, ${SETTING[f.setting]}.`,
    `Bekannt: ${f.person.diagnosenBekannt.join(', ')}.`,
    `Medikamente: ${f.person.medikamentePlan.join(', ')}.`,
    ...f.person.biografie.map((b) => `${b[0]!.toUpperCase()}${b.slice(1)}.`),
    f.uebernahme,
    allergien(f).length ? `Allergien: ${allergien(f).join(', ')}.` : 'Keine Allergien bekannt.',
    werte.length ? `Zuletzt gemessen: ${werte.map((w) => w.text).join(', ')}.` : '',
    '(Fall aus dem Praxissimulator, frei erfunden)',
  ].filter(Boolean).join('\n');
  return { text, verlauf: protokoll(z).slice(-20).join('\n') };
}

export function uebergabeFallNeu(z: SimZustand): UebergabeFall {
  const f = z.fall;
  const werte = werteNeu(z);
  const auff = werte.filter((w) => w.auffaellig);
  const tat = erledigtNeu(z);
  const prob = problemeNeu(z);
  const probleme = prob.length ? prob : [f.kurz];
  const an = anordnungenNeu(z);
  const a = anzeige(z);
  const bewusst = a.avpu !== 'A' ? { V: 'reagiert nur auf Ansprache', P: 'reagiert nur auf Schmerzreiz', U: 'reagiert nicht' }[a.avpu] : undefined;
  const all = allergien(f);
  const k: UebergabePunkt[] = [
    { id: 'patient', teil: 'S', pflicht: true, text: `Person benennen (${f.person.name})`, muster: [stamm(nachname(f))] },
    { id: 'problem', teil: 'S', pflicht: true, text: `Aktuelle Probleme: ${probleme.join(', ')}`, muster: probleme.flatMap((p) => schluessel(p, 2)) },
    { id: 'hintergrund', teil: 'B', pflicht: false, text: `Hintergrund: ${f.person.diagnosenBekannt.slice(0, 2).join(', ')}`, muster: f.person.diagnosenBekannt.slice(0, 2).flatMap((d) => schluessel(d, 1)) },
  ];
  if (all.length) k.push({ id: 'allergie', teil: 'B', pflicht: true, text: `Allergie: ${all.join(', ')}`, muster: ['allergi', ...all.map((x) => stamm(x.split(/\s/)[0] ?? x))] });
  for (const w of auff) k.push({ id: `wert-${w.key}`, teil: 'A', pflicht: true, text: w.text, muster: [w.zahl] });
  if (!werte.length) k.push({ id: 'ungemessen', teil: 'A', pflicht: true, text: 'Dass keine Vitalwerte gemessen wurden', muster: ['nicht gemessen', 'keine vitalwerte', 'keine werte', 'noch keine'] });
  if (bewusst) k.push({ id: 'bewusstsein', teil: 'A', pflicht: true, text: `Bewusstsein: ${bewusst}`, muster: ['ansprache', 'schmerzreiz', 'reagiert', 'somnol', 'bewusst'] });
  if (tat.length) k.push({ id: 'getan', teil: 'A', pflicht: true, text: `Was du getan hast (${tat.join('; ')})`, muster: tat.flatMap((t) => schluessel(t, 1)) });
  if (an.length) k.push({ id: 'anordnung', teil: 'R', pflicht: true, text: `Geltende Anordnungen: ${an.join(' · ')}`, muster: ['angeordnet', 'anordnung', ...an.flatMap((t) => schluessel(t, 1))] });

  const muster = [
    `S: Ich übergebe ${f.person.name}, ${alter(f)}. Aktuell geht es um ${probleme.join(' und ')}.`,
    `B: Bekannt sind ${f.person.diagnosenBekannt.slice(0, 2).join(' und ')}.${all.length ? ` Allergie: ${all.join(', ')}.` : ''}`,
    `A: ${werte.length ? `Zuletzt gemessen: ${werte.map((w) => w.text).join(', ')}.` : 'Vitalwerte habe ich nicht gemessen.'}${bewusst ? ` ${f.person.name} ${bewusst}.` : ''}${tat.length ? ` Ich habe: ${tat.join('; ')}.` : ''}`,
    `R: ${an.length ? `Angeordnet ist: ${an.join(' · ')}. ` : ''}Bitte Werte weiter kontrollieren und auf Verschlechterung achten.`,
  ].join('\n');

  return {
    id: `praxis-neu-${f.id}`,
    titel: `Aus deinem Praxisfall: ${f.titel}`,
    bereich: SETTING[f.setting],
    anlass: f.spur === 'B' ? 'notfall' : 'schicht',
    empfaenger: f.spur === 'B' ? 'Pflegefachperson der Intensivstation' : 'Kollegin im Folgedienst',
    rolle: 'Du hast den Fall im Praxissimulator versorgt',
    lage: `Nach ${Math.max(1, Math.round(z.t / 60))} Minuten Fallzeit übergibst du ${f.person.name}. Erwartet wird nur, was in deinem Spiel wirklich passiert ist.`,
    daten: [
      { label: 'Person', wert: `${f.person.name}, ${alter(f)}` },
      { label: 'Bekannt', wert: f.person.diagnosenBekannt.join(', ') },
      { label: 'Allergien', wert: all.length ? all.join(', ') : 'keine bekannt' },
      { label: 'Zuletzt gemessen', wert: werte.length ? werte.map((w) => w.text).join(', ') : 'nicht gemessen' },
      ...(bewusst ? [{ label: 'Bewusstsein', wert: bewusst }] : []),
      { label: 'Erledigt', wert: tat.length ? tat.join('; ') : 'keine Maßnahme' },
      ...(an.length ? [{ label: 'Anordnungen', wert: an.join(' · ') }] : []),
    ],
    kernpunkte: k.filter((x) => x.muster.length),
    muster,
  };
}

export function berichtFallNeu(z: SimZustand): BerichtFall {
  const f = z.fall;
  const werte = werteNeu(z);
  const tat = erledigtNeu(z);
  // Telefon setzt anruf-aerztin; ein Kontakt nur per Messenger zählt ebenso (P17b: Fall ohne Anruf)
  const arzt = Object.keys(z.getan).includes('anruf-aerztin') || z.log.some((e) => e.art === 'nachricht' && e.an === 'aerztin');
  const gespraech = z.fall.gespraech.filter((g) => z.getan[`frage:${g.id}`]).flatMap((g) => g.antwort.slice(0, 1).map((a) => a.text)).find((t) => t.startsWith('„'));
  const k: BerichtPunkt[] = [{ id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit oder Zeitraum', muster: ['uhr', 'minut'] }];
  if (werte.length) k.push({ id: 'werte', baustein: 'beobachtung', pflicht: true, text: `Gemessene Werte (${werte.map((w) => w.text).join(', ')})`, muster: (werte.some((w) => w.auffaellig) ? werte.filter((w) => w.auffaellig) : werte).map((w) => w.zahl) });
  if (gespraech) k.push({ id: 'aussage', baustein: 'aussage', pflicht: false, text: `Aussage wörtlich: ${gespraech}`, muster: schluessel(gespraech, 3) });
  if (tat.length) {
    k.push({ id: 'massnahme', baustein: 'massnahme', pflicht: true, text: `Maßnahme (${tat.join('; ')})`, muster: tat.flatMap((t) => schluessel(t, 1)) });
    k.push({ id: 'wirkung', baustein: 'wirkung', pflicht: false, text: 'Wirkung oder Verlauf danach', muster: ['danach', 'anschliessend', 'daraufhin', 'unveraendert', 'besser', 'schlechter', 'kontroll', 'reagiert', 'ruhiger'] });
  }
  if (arzt) k.push({ id: 'weitergabe', baustein: 'weitergabe', pflicht: true, text: `Wen du informiert hast (${f.arzt.name})`, muster: ['arzt', 'aerztin', 'informiert', 'verstaendigt', stamm(f.arzt.name.split(/\s+/).at(-1) ?? '')] });
  const muster = [
    `${uhrzeit(f.startUhrzeit, 0)} bis ${uhrzeit(f.startUhrzeit, z.t)} Uhr:`,
    ersterSatz(f.kurz),
    werte.length ? `Gemessen: ${werte.map((w) => w.text).join(', ')}.` : '',
    gespraech ? `${f.person.name} sagt: ${gespraech}` : '',
    tat.length ? `Maßnahmen: ${tat.join('; ')}.` : '',
    tat.length ? 'Danach Kontrolle der Werte, Verlauf siehe Kurve.' : '',
    arzt ? `${f.arzt.name} informiert.` : '',
  ].filter(Boolean).join(' ');
  return {
    id: `praxis-neu-${f.id}`,
    titel: `Aus deinem Praxisfall: ${f.titel}`,
    art: 'schreiben',
    bereich: f.setting === 'langzeit' ? 'langzeit' : f.setting === 'ambulant' ? 'ambulant' : 'akut',
    person: `${f.person.name}, ${alter(f)}, ${f.person.diagnosenBekannt.slice(0, 2).join(', ')}`,
    szene: [f.uebernahme, ...protokoll(z).slice(-12)],
    kernpunkte: k.filter((x) => x.muster.length),
    muster,
  };
}
