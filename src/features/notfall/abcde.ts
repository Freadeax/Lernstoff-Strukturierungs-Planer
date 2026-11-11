// ABCDE-Notfallübung: ein akut kranker Mensch, Einschätzung nach A–B–C–D–E, Maßnahmen mit Zeitbedarf,
// Werte verschlechtern sich bis zur wirksamen Maßnahme. Rein und deterministisch (testbar).
// Didaktisches Modell, keine validierte Physiologie. Medikamente nur nach Anordnung bzw. Notfall-SOP.

import type { RaumId } from '../../ui/sim/raeume/katalog';

export type Buchstabe = 'A' | 'B' | 'C' | 'D' | 'E';
export const BUCHSTABEN: Buchstabe[] = ['A', 'B', 'C', 'D', 'E'];
export const BUCHSTABE_NAME: Record<Buchstabe, string> = { A: 'Atemwege', B: 'Atmung', C: 'Kreislauf', D: 'Neurologie', E: 'Exposition' };

export interface Werte { puls: number; sys: number; dia: number; af: number; spo2: number; temp: number; bz: number; avpu: 'A' | 'C' | 'V' | 'P' | 'U' }
type Zahl = Exclude<keyof Werte, 'avpu'>;

export interface Befund { buchstabe: Buchstabe; label: string; sek: number; text: (w: Werte) => string; problem: boolean }
export interface Massnahme {
  id: string; buchstabe: Buchstabe | 'Team'; label: string; sek: number; text: string;
  effekt?: Partial<Record<Zahl, number>>;
  /** Stoppt die Verschlechterung (Anteil 0…1 der Drift fällt weg). */
  stoppt?: number;
  schluessel?: boolean; braucht?: string;
  /** Falsche Handlung: Erklärung, warum nicht. */
  falsch?: boolean;
  /** Schließt den Monitor an. */
  monitor?: boolean;
}
export interface Notfall {
  id: string; titel: string; raum: RaumId; person: string; lage: string;
  start: Werte; drift: Partial<Record<Zahl, number>>;
  befunde: Befund[]; massnahmen: Massnahme[];
  kritisch: (w: Werte) => string | null;
  /** Bewusstsein aus den Werten (z. B. bei Unterzucker). */
  bewusstsein?: (w: Werte) => Werte['avpu'];
  lernziel: string;
}

const rr = (w: Werte) => `${Math.round(w.sys)}/${Math.round(w.dia)} mmHg`;
const r = Math.round;

export const NOTFAELLE: Notfall[] = [
  {
    id: 'anaphylaxie', titel: 'Plötzliche Atemnot unter Antibiotikum', raum: '13_station_postop', person: 'Frau B., 45 Jahre, 1. Tag nach Bauch-OP',
    lage: 'Seit fünf Minuten läuft die erste Cefuroxim-Kurzinfusion. Frau B. klingelt: „Mir ist so komisch, ich krieg schlecht Luft.“',
    start: { puls: 126, sys: 86, dia: 50, af: 27, spo2: 91, temp: 36.9, bz: 112, avpu: 'A' }, drift: { sys: -4, dia: -2, spo2: -1.5, puls: 3, af: 1 },
    befunde: [
      { buchstabe: 'A', label: 'Atemwege: Sprechen, Geräusche, Mund ansehen', sek: 20, problem: true, text: () => 'Heisere Stimme, spricht in kurzen Sätzen. Leiser inspiratorischer Stridor. Lippen und Zunge geschwollen.' },
      { buchstabe: 'B', label: 'Atmung: zählen, ansehen, abhören, SpO₂', sek: 40, problem: true, text: w => `AF ${r(w.af)}/min, Einsatz der Atemhilfsmuskulatur, Giemen beidseits. SpO₂ ${r(w.spo2)} %.` },
      { buchstabe: 'C', label: 'Kreislauf: Puls, Blutdruck, Rekapillarisierung, Haut', sek: 45, problem: true, text: w => `Puls ${r(w.puls)}/min, schwach. RR ${rr(w)}. Rekapillarisierung 3 s. Haut gerötet und warm.` },
      { buchstabe: 'D', label: 'Neurologie: AVPU, Pupillen, Blutzucker', sek: 40, problem: false, text: w => `Wach (A), ängstlich, „ich hab Angst zu sterben“. Pupillen isokor. BZ ${r(w.bz)} mg/dl.` },
      { buchstabe: 'E', label: 'Exposition: Haut ganz ansehen, Infusion, Verlauf', sek: 40, problem: true, text: () => 'Quaddeln an Brust, Armen und Rücken, Flush. Die Antibiotika-Infusion läuft noch. Keine bekannte Allergie dokumentiert.' },
    ],
    massnahmen: [
      { id: 'stopp', buchstabe: 'E', label: 'Infusion sofort stoppen, Zugang belassen', sek: 10, schluessel: true, stoppt: 0.3, text: 'Infusion gestoppt, Zugang mit Kochsalz gespült und belassen. Auslöser ist entfernt.' },
      { id: 'hilfe', buchstabe: 'Team', label: 'Notfallteam bzw. Ärztin sofort alarmieren', sek: 15, schluessel: true, text: 'Das Notfallteam ist alarmiert und auf dem Weg. Ärztliche Anordnung über Notfall-SOP Anaphylaxie liegt vor.' },
      { id: 'lage', buchstabe: 'C', label: 'Flach lagern, Beine anheben (Oberkörper bei Atemnot leicht erhöht)', sek: 20, effekt: { sys: 6, dia: 3 }, text: 'Flach gelagert, Beine angehoben. Der Blutdruck steigt etwas.' },
      { id: 'o2', buchstabe: 'B', label: 'Sauerstoff hochdosiert über Maske mit Reservoir', sek: 20, effekt: { spo2: 4 }, text: 'Sauerstoff 15 l/min über Maske mit Reservoir.' },
      { id: 'adrenalin', buchstabe: 'C', label: 'Adrenalin 0,5 mg i.m. in den Oberschenkel (nach SOP/Anordnung)', sek: 30, braucht: 'hilfe', schluessel: true, stoppt: 0.7, effekt: { sys: 22, dia: 10, spo2: 4, af: -6, puls: -12 }, text: 'Adrenalin 0,5 mg i.m. in den seitlichen Oberschenkel gegeben (Zeit notiert). Nach wenigen Minuten bessern sich Atmung und Blutdruck. Wiederholung nach 5 Minuten möglich.' },
      { id: 'volumen', buchstabe: 'C', label: 'Vollelektrolytlösung schnell infundieren (nach Anordnung)', sek: 30, braucht: 'hilfe', effekt: { sys: 8, dia: 4, puls: -4 }, text: 'Vollelektrolytlösung läuft im Schuss über den liegenden Zugang.' },
      { id: 'monitor', buchstabe: 'C', label: 'Monitor anschließen (EKG, SpO₂, RR alle 3 min)', sek: 30, monitor: true, text: 'Monitor angeschlossen: fortlaufende Werte, Blutdruck automatisch.' },
      { id: 'aufsetzen', buchstabe: 'C', label: 'Aufsetzen und an die Bettkante setzen, damit sie besser Luft bekommt', sek: 20, falsch: true, effekt: { sys: -10 }, text: 'Nicht bei Schockzeichen: Aufrichten kann bei Anaphylaxie zum Kreislaufstillstand führen. Flach lagern, Oberkörper höchstens leicht erhöht.' },
      { id: 'antihist', buchstabe: 'C', label: 'Nur ein Antihistaminikum geben und abwarten', sek: 30, falsch: true, text: 'Antihistaminika wirken zu langsam und behandeln weder Atemwegsschwellung noch Schock. Mittel der ersten Wahl ist Adrenalin i.m.' },
    ],
    kritisch: w => w.spo2 < 82 ? 'Die Sauerstoffsättigung fällt unter 82 %, Frau B. wird bewusstlos.' : w.sys < 62 ? 'Der Blutdruck fällt unter 62 mmHg, Frau B. wird bewusstlos.' : null,
    lernziel: 'Anaphylaxie früh erkennen (A-, B- oder C-Problem plus Haut), Auslöser stoppen, Hilfe holen, Adrenalin i.m. als erste Wahl.',
  },
  {
    id: 'hypoglykaemie', titel: 'Nachts schwer erweckbar', raum: '10_pflegeheim_nacht', person: 'Herr W., 79 Jahre, Typ-2-Diabetes mit Insulin',
    lage: 'Kontrollrundgang um 2:40 Uhr. Herr W. liegt im Bett, ist schweißnass und reagiert kaum, als du ihn ansprichst.',
    start: { puls: 98, sys: 142, dia: 80, af: 18, spo2: 95, temp: 36.3, bz: 38, avpu: 'V' }, drift: { bz: -1.2, puls: 1 },
    bewusstsein: w => w.bz < 26 ? 'U' : w.bz < 34 ? 'P' : w.bz < 55 ? 'V' : w.bz < 70 ? 'C' : 'A',
    befunde: [
      { buchstabe: 'A', label: 'Atemwege: frei? Geräusche?', sek: 15, problem: false, text: w => w.avpu === 'P' || w.avpu === 'U' ? 'Schnarchende Atmung in Rückenlage, Zunge fällt zurück.' : 'Atemwege frei, leises Schnarchen.' },
      { buchstabe: 'B', label: 'Atmung: zählen, ansehen, SpO₂', sek: 40, problem: false, text: w => `AF ${r(w.af)}/min, regelmäßig, seitengleich. SpO₂ ${r(w.spo2)} %.` },
      { buchstabe: 'C', label: 'Kreislauf: Puls, Blutdruck, Haut', sek: 45, problem: true, text: w => `Puls ${r(w.puls)}/min, kräftig. RR ${rr(w)}. Haut kaltschweißig und blass.` },
      { buchstabe: 'D', label: 'Neurologie: AVPU, Pupillen, Blutzucker messen', sek: 45, problem: true, text: w => `${w.avpu === 'A' ? 'Wach und orientiert' : w.avpu === 'C' ? 'Wach, aber verwirrt' : w.avpu === 'V' ? 'Reagiert nur verlangsamt auf Ansprache (V)' : w.avpu === 'P' ? 'Reagiert nur auf Schmerzreiz (P)' : 'Keine Reaktion (U)'}. Pupillen isokor, keine Halbseitenzeichen. BZ ${r(w.bz)} mg/dl.` },
      { buchstabe: 'E', label: 'Exposition: Verletzungen, Plan, Essprotokoll', sek: 40, problem: true, text: () => 'Keine Verletzungen. Insulinplan: abends 20 IE Basalinsulin, gespritzt um 21 Uhr. Essprotokoll: Abendessen kaum gegessen.' },
    ],
    massnahmen: [
      { id: 'hilfe', buchstabe: 'Team', label: 'Notruf 112 bzw. Bereitschaftsarzt nach Heim-Notfallplan', sek: 20, schluessel: true, text: 'Notruf abgesetzt. Die Leitstelle bestätigt den Einsatz. Notfallplan und Medikamentenliste liegen bereit.' },
      { id: 'seite', buchstabe: 'A', label: 'Stabile Seitenlage, Atemweg freihalten', sek: 30, text: 'Stabile Seitenlage. Atmung frei und regelmäßig, Aspirationsschutz.' },
      { id: 'glukagon', buchstabe: 'D', label: 'Glukagon 1 mg i.m./s.c. nach ärztlichem Notfallplan', sek: 40, schluessel: true, stoppt: 1, effekt: { bz: 45 }, text: 'Glukagon nach dem hinterlegten Notfallplan gegeben. Nach 10 bis 15 Minuten wird Herr W. wacher.' },
      { id: 'kontrolle', buchstabe: 'D', label: 'Blutzucker nach 15 Minuten erneut messen', sek: 30, braucht: 'glukagon', text: 'Kontrollmessung eingeplant und dokumentiert. Sobald er sicher schlucken kann: langsam wirksame Kohlenhydrate anbieten.' },
      { id: 'saft', buchstabe: 'D', label: 'Saft mit Traubenzucker einflößen', sek: 30, falsch: true, text: 'Nicht bei eingeschränktem Bewusstsein: Aspirationsgefahr. Orale Glukose nur, wenn er wach ist und sicher schlucken kann.' },
      { id: 'insulin', buchstabe: 'D', label: 'Nachtinsulin trotzdem nach Plan geben', sek: 20, falsch: true, effekt: { bz: -8 }, text: 'Bei Unterzucker kein Insulin. Insulingabe senkt den Blutzucker weiter und verschlechtert den Zustand.' },
    ],
    kritisch: w => w.bz < 26 ? 'Der Blutzucker sinkt unter 26 mg/dl, Herr W. reagiert nicht mehr und krampft.' : null,
    lernziel: 'Bei jeder Bewusstseinsstörung den Blutzucker messen (D), Unterzucker erkennen, bei eingetrübtem Bewusstsein nichts oral, Glukagon nach Plan, Notruf.',
  },
  {
    id: 'sepsis', titel: 'Fieber, verwirrt, Blutdruck fällt', raum: '17_notaufnahme_untersuchung', person: 'Herr D., 41 Jahre, seit drei Tagen Brennen beim Wasserlassen',
    lage: 'Herr D. kommt vom Hausarzt: seit gestern Fieber und Flankenschmerz, heute wirkt er „durcheinander“. Er sitzt zitternd auf der Trage.',
    start: { puls: 122, sys: 92, dia: 52, af: 25, spo2: 93, temp: 39.3, bz: 164, avpu: 'C' }, drift: { sys: -2.2, dia: -1, puls: 2, af: 0.5, spo2: -0.4 },
    befunde: [
      { buchstabe: 'A', label: 'Atemwege: frei? Sprechen?', sek: 15, problem: false, text: () => 'Atemwege frei, spricht verwaschen, aber in ganzen Sätzen.' },
      { buchstabe: 'B', label: 'Atmung: zählen, abhören, SpO₂', sek: 40, problem: true, text: w => `AF ${r(w.af)}/min, flach. Keine Rasselgeräusche. SpO₂ ${r(w.spo2)} %.` },
      { buchstabe: 'C', label: 'Kreislauf: Puls, Blutdruck, Rekap, Haut, Urin', sek: 50, problem: true, text: w => `Puls ${r(w.puls)}/min. RR ${rr(w)}, MAP ${r((w.sys + 2 * w.dia) / 3)} mmHg. Rekapillarisierung 4 s, Knie marmoriert. Seit dem Morgen kaum Wasser gelassen.` },
      { buchstabe: 'D', label: 'Neurologie: AVPU, Orientierung, Blutzucker', sek: 40, problem: true, text: w => `Neu verwirrt (C): weiß nicht, wo er ist. Pupillen isokor. BZ ${r(w.bz)} mg/dl.` },
      { buchstabe: 'E', label: 'Exposition: Temperatur, Haut, Flanken, Urin', sek: 40, problem: true, text: w => `Temperatur ${w.temp.toLocaleString('de-DE', { maximumFractionDigits: 1 })} °C, Schüttelfrost. Klopfschmerz über der rechten Flanke. Die Urinprobe ist trüb und riecht übel. Keine Hautdefekte.` },
    ],
    massnahmen: [
      { id: 'hilfe', buchstabe: 'Team', label: 'Ärztin sofort holen: Verdacht auf Sepsis (qSOFA 3)', sek: 15, schluessel: true, text: 'Die Ärztin kommt sofort. Das Sepsis-Bündel wird gestartet, Anordnungen liegen vor.' },
      { id: 'o2', buchstabe: 'B', label: 'Sauerstoff, Ziel SpO₂ 94–98 %', sek: 20, effekt: { spo2: 3 }, text: 'Sauerstoff 2–4 l/min über Nasenbrille, SpO₂ steigt.' },
      { id: 'kulturen', buchstabe: 'E', label: 'Blutkulturen abnehmen (vor der Antibiose, nach Anordnung)', sek: 60, braucht: 'hilfe', schluessel: true, text: 'Zwei Paar Blutkulturen abgenommen und beschriftet, Urinprobe ins Labor.' },
      { id: 'volumen', buchstabe: 'C', label: 'Vollelektrolytlösung 500 ml schnell (nach Anordnung)', sek: 30, braucht: 'hilfe', schluessel: true, stoppt: 0.6, effekt: { sys: 12, dia: 6, puls: -8 }, text: 'Bolus läuft. Der Blutdruck steigt, Wirkung nach jedem Bolus neu beurteilen.' },
      { id: 'antibiose', buchstabe: 'E', label: 'Antibiotikum i.v. innerhalb der ersten Stunde (nach Anordnung)', sek: 30, braucht: 'kulturen', schluessel: true, stoppt: 0.4, text: 'Antibiotikum nach Anordnung angehängt, Uhrzeit dokumentiert.' },
      { id: 'monitor', buchstabe: 'C', label: 'Monitor anschließen, Ausscheidung stündlich messen', sek: 30, monitor: true, text: 'Monitor läuft, Bilanz gestartet.' },
      { id: 'fieber', buchstabe: 'E', label: 'Nur Fieber senken und in einer Stunde neu messen', sek: 20, falsch: true, text: 'Abwarten verzögert die Sepsisbehandlung. Jede Stunde ohne Antibiose verschlechtert die Prognose: Hilfe holen, Kulturen, Volumen, Antibiose.' },
    ],
    kritisch: w => w.sys < 70 ? 'Der Blutdruck fällt unter 70 mmHg, Herr D. trübt ein: septischer Schock.' : null,
    lernziel: 'Sepsis an Fieber, Atemfrequenz, Blutdruck und neuer Verwirrtheit erkennen, sofort eskalieren, Kulturen vor Antibiose, Volumen, Antibiose in der ersten Stunde.',
  },
];

// ---------- Spielstand ----------

export interface Eintrag { zeit: number; art: 'befund' | 'massnahme' | 'falsch' | 'hinweis' | 'kritisch'; buchstabe?: Buchstabe | 'Team'; titel: string; text: string }
export interface Stand {
  fall: Notfall; zeit: number; werte: Werte; monitor: boolean;
  /** Anteil der Drift, der noch wirkt (1 = ungebremst). */
  drift: number;
  befunde: Buchstabe[]; massnahmen: string[]; verlauf: Eintrag[];
  ende: null | 'stabil' | 'kritisch' | 'uebergabe';
}

export function beginne(fall: Notfall): Stand {
  return { fall, zeit: 0, werte: { ...fall.start }, monitor: false, drift: 1, befunde: [], massnahmen: [], verlauf: [{ zeit: 0, art: 'hinweis', titel: fall.person, text: fall.lage }], ende: null };
}

function vergehe(s: Stand, sek: number): Stand {
  const w = { ...s.werte };
  for (const [k, d] of Object.entries(s.fall.drift) as [Zahl, number][]) w[k] = w[k] + d * s.drift * (sek / 60);
  w.spo2 = Math.min(100, w.spo2); w.bz = Math.max(10, w.bz);
  if (s.fall.bewusstsein) w.avpu = s.fall.bewusstsein(w);
  const zeit = s.zeit + sek;
  const krit = s.fall.kritisch(w);
  if (krit && !s.ende) return { ...s, zeit, werte: w, ende: 'kritisch', verlauf: [...s.verlauf, { zeit, art: 'kritisch', titel: 'Kritische Verschlechterung', text: `${krit} Reanimationsbereitschaft, Notfallteam übernimmt.` }] };
  return { ...s, zeit, werte: w };
}

export function befunden(s: Stand, b: Buchstabe): Stand {
  if (s.ende) return s;
  const befund = s.fall.befunde.find(x => x.buchstabe === b)!;
  const n = vergehe(s, befund.sek);
  return { ...n, befunde: [...n.befunde, b], verlauf: [...n.verlauf, { zeit: n.zeit, art: 'befund', buchstabe: b, titel: `${b} · ${BUCHSTABE_NAME[b]}`, text: befund.text(n.werte) }] };
}

export function handeln(s: Stand, id: string): Stand {
  if (s.ende) return s;
  const m = s.fall.massnahmen.find(x => x.id === id)!;
  if (m.braucht && !s.massnahmen.includes(m.braucht)) {
    const v = s.fall.massnahmen.find(x => x.id === m.braucht)!;
    return { ...s, verlauf: [...s.verlauf, { zeit: s.zeit, art: 'hinweis', titel: 'Noch nicht möglich', text: `Zuerst: ${v.label}.` }] };
  }
  let n = vergehe(s, m.sek);
  if (n.ende) return n;
  const w = { ...n.werte };
  for (const [k, d] of Object.entries(m.effekt ?? {}) as [Zahl, number][]) w[k] = w[k] + d;
  w.spo2 = Math.min(100, w.spo2);
  if (n.fall.bewusstsein) w.avpu = n.fall.bewusstsein(w);
  n = { ...n, werte: w, drift: Math.max(0, n.drift - (m.stoppt ?? 0)), monitor: n.monitor || !!m.monitor, massnahmen: n.massnahmen.includes(m.id) ? n.massnahmen : [...n.massnahmen, m.id] };
  n.verlauf = [...n.verlauf, { zeit: n.zeit, art: m.falsch ? 'falsch' : 'massnahme', buchstabe: m.buchstabe, titel: m.label, text: m.text }];
  const schluessel = n.fall.massnahmen.filter(x => x.schluessel).every(x => n.massnahmen.includes(x.id));
  if (schluessel && n.drift <= 0.05 && !n.ende) n.ende = 'stabil';
  return n;
}

/** Einschätzung in der richtigen Reihenfolge? Zählt Befunde, die vor einem früheren Buchstaben erhoben wurden. */
export function reihenfolgeFehler(befunde: Buchstabe[]): number {
  let f = 0;
  const erste = [...new Set(befunde)];
  for (let i = 0; i < erste.length; i++) for (let j = i + 1; j < erste.length; j++) if (BUCHSTABEN.indexOf(erste[j]!) < BUCHSTABEN.indexOf(erste[i]!)) f++;
  return f;
}

export interface Bewertung { punkte: number; max: number; zeilen: { text: string; ok: boolean }[] }

export function bewerte(s: Stand): Bewertung {
  const z: { text: string; ok: boolean }[] = [];
  const alle = BUCHSTABEN.every(b => s.befunde.includes(b));
  z.push({ ok: alle, text: alle ? 'Alle fünf Bereiche A bis E eingeschätzt.' : `Nicht eingeschätzt: ${BUCHSTABEN.filter(b => !s.befunde.includes(b)).join(', ')}.` });
  const rf = reihenfolgeFehler(s.befunde);
  z.push({ ok: rf === 0, text: rf === 0 ? 'Reihenfolge A → E eingehalten.' : 'Reihenfolge nicht eingehalten: lebensbedrohliche Probleme in A und B zuerst ausschließen.' });
  const hilfe = s.verlauf.find(e => e.art === 'massnahme' && s.fall.massnahmen.find(m => m.label === e.titel)?.buchstabe === 'Team');
  z.push({ ok: !!hilfe && hilfe.zeit <= 180, text: hilfe ? `Hilfe nach ${Math.round(hilfe.zeit / 6) / 10} Minuten geholt${hilfe.zeit > 180 ? ' (Ziel: in den ersten 3 Minuten)' : ''}.` : 'Keine Hilfe geholt.' });
  for (const m of s.fall.massnahmen.filter(x => x.schluessel && x.buchstabe !== 'Team')) z.push({ ok: s.massnahmen.includes(m.id), text: `${s.massnahmen.includes(m.id) ? 'Erledigt' : 'Fehlt'}: ${m.label}.` });
  const falsche = s.fall.massnahmen.filter(m => m.falsch && s.massnahmen.includes(m.id));
  z.push({ ok: falsche.length === 0, text: falsche.length ? `Ungünstig: ${falsche.map(m => m.label).join('; ')}.` : 'Keine gefährlichen Handlungen.' });
  const erste = s.verlauf.find(e => e.art === 'massnahme' && s.fall.massnahmen.find(m => m.label === e.titel)?.schluessel);
  const neu = !!erste && s.verlauf.some(e => e.art === 'befund' && e.zeit > erste.zeit);
  z.push({ ok: neu, text: neu ? 'Nach den Maßnahmen erneut eingeschätzt.' : 'Nach den Maßnahmen nicht erneut eingeschätzt: Wirkung immer überprüfen (wieder bei A beginnen).' });
  z.push({ ok: s.ende !== 'kritisch', text: s.ende === 'kritisch' ? 'Der Zustand ist kritisch geworden, bevor die wirksamen Maßnahmen liefen.' : 'Zustand stabilisiert bzw. rechtzeitig übergeben.' });
  return { punkte: z.filter(x => x.ok).length, max: z.length, zeilen: z };
}

/** Übung beenden und an das Team übergeben (zählt als rechtzeitige Übergabe, wenn nicht kritisch). */
export function uebergeben(s: Stand): Stand {
  if (s.ende) return s;
  return { ...s, ende: 'uebergabe', verlauf: [...s.verlauf, { zeit: s.zeit, art: 'hinweis', titel: 'Übergabe an das Team', text: 'Du übergibst nach SBAR an das Notfallteam bzw. die Ärztin.' }] };
}

export const uhr = (sek: number) => `${String(Math.floor(sek / 60)).padStart(2, '0')}:${String(Math.round(sek % 60)).padStart(2, '0')}`;
