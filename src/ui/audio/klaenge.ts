// Klangbibliothek: jedes Geräusch als kleines Syntheserezept. Keine Aufnahmen, keine Lizenzfragen.
// Körpergeräusche (Herz, Lunge, Darm) sind vereinfachte Nachbildungen zum Kennenlernen der Merkmale,
// kein Ersatz für echte Auskultationsaufnahmen (siehe docs/MATERIAL-BEDARF.md, Abschnitt Audio).

import type { Kategorie } from './einstellungen';
import { dauerRauschen, dauerTon, halbton, rauschen, ton, type Werkzeug } from './synth';

export interface KlangParameter {
  /** Herzfrequenz /min */
  puls?: number;
  /** Sauerstoffsättigung %, bestimmt die Tonhöhe des Monitorpieps */
  spo2?: number;
  /** Atemfrequenz /min */
  af?: number;
}

export type Gruppe = 'rueckmeldung' | 'geraet' | 'alarm' | 'herz' | 'lunge' | 'darm' | 'raum';
export const GRUPPEN: Record<Gruppe, string> = {
  rueckmeldung: 'Rückmeldetöne', geraet: 'Geräte und Ruf', alarm: 'Monitoralarme', herz: 'Herztöne',
  lunge: 'Atemgeräusche', darm: 'Darmgeräusche', raum: 'Raumklang',
};

type Zustand = Record<string, unknown>;

export interface Klang {
  id: string;
  titel: string;
  gruppe: Gruppe;
  kategorie: Kategorie;
  /** Was ist das? */
  text: string;
  /** Woran erkenne ich es? (Lernhinweis im Hör-Trainer) */
  merkmal?: string;
  /** Läuft als Schleife, bis gestoppt wird */
  schleife: boolean;
  /** Einmal zu Beginn: Dauerklänge anlegen, Zustand zurückgeben */
  start?: (w: Werkzeug, p: KlangParameter) => Zustand;
  /** Plant ein Ereignis ab t und gibt den Abstand zum nächsten in Sekunden zurück */
  takt: (w: Werkzeug, t: number, p: KlangParameter, z: Zustand) => number;
}

// ---------- Zeitmuster (rein rechnerisch, getestet) ----------

/**
 * Alarm-Rhythmen angelehnt an IEC 60601-1-8: hohe Priorität 10 Pulse (3+2, 3+2),
 * mittlere 3 Pulse, niedrige 2 Pulse. Zeiten in Sekunden ab Beginn der Gruppe.
 */
export const ALARM_MUSTER = {
  hoch: { pulse: [0, 0.2, 0.4, 0.8, 1.0, 1.7, 1.9, 2.1, 2.5, 2.7], dauer: 0.13, f: 523, wiederholung: 6 },
  mittel: { pulse: [0, 0.3, 0.6], dauer: 0.2, f: 440, wiederholung: 7 },
  niedrig: { pulse: [0, 0.35], dauer: 0.22, f: 392, wiederholung: 16 },
} as const;
export type AlarmPrioritaet = keyof typeof ALARM_MUSTER;

/** Monitorpiep: pro Prozentpunkt unter 100 % SpO₂ einen Halbton tiefer (wie an vielen Monitoren). */
export function piepFrequenz(spo2: number | undefined): number {
  const s = Math.min(100, Math.max(70, spo2 ?? 98));
  return halbton(880, -(100 - s));
}

/** Herzzyklus: Abstand der Schläge und Lage des 2. Herztons (Systole wird bei Tachykardie kürzer). */
export function herzZyklus(puls: number | undefined): { periode: number; systole: number } {
  const hf = Math.min(200, Math.max(30, puls ?? 72));
  const periode = 60 / hf;
  return { periode, systole: Math.min(0.34, periode * 0.4) };
}

/** Atemzyklus: Ein- und Ausatmung bei gegebener Atemfrequenz. */
export function atemZyklus(af: number | undefined, verlaengerteAusatmung = false): { periode: number; ein: number; aus: number } {
  const f = Math.min(40, Math.max(6, af ?? 14));
  const periode = 60 / f;
  const ein = periode * (verlaengerteAusatmung ? 0.3 : 0.38);
  const aus = periode * (verlaengerteAusatmung ? 0.6 : 0.45);
  return { periode, ein, aus };
}

// ---------- Hilfen ----------

function alarmPuls(w: Werkzeug, t: number, f: number, dauer: number, pegel = 0.16) {
  // Grundton mit Obertönen (Norm verlangt mind. 4 Harmonische): gefiltertes Rechteck + Quinte
  ton(w, t, { f, dauer, pegel, typ: 'square', tiefpass: 2600, attack: 0.012, release: 0.03 });
  ton(w, t, { f: f * 2, dauer, pegel: pegel * 0.25, attack: 0.012, release: 0.03 });
}

function alarmGruppe(prio: AlarmPrioritaet) {
  return (w: Werkzeug, t: number) => {
    const m = ALARM_MUSTER[prio];
    m.pulse.forEach((d, i) => alarmPuls(w, t + d, prio === 'niedrig' && i === 1 ? halbton(m.f, -3) : m.f, m.dauer));
    return m.wiederholung;
  };
}

function s1(w: Werkzeug, t: number, pegel = 1) {
  ton(w, t, { f: 58, fEnde: 42, dauer: 0.11, pegel: 0.55 * pegel, attack: 0.01 });
  rauschen(w, t, { dauer: 0.09, filter: 'lowpass', f: 140, pegel: 0.5 * pegel, attack: 0.008 });
}
function s2(w: Werkzeug, t: number, pegel = 1) {
  ton(w, t, { f: 78, fEnde: 60, dauer: 0.07, pegel: 0.42 * pegel, attack: 0.006 });
  rauschen(w, t, { dauer: 0.06, filter: 'lowpass', f: 220, pegel: 0.35 * pegel, attack: 0.005 });
}
function stethoskop(w: Werkzeug, pegel = 0.035) {
  // leises Grundrauschen, wie es durch das Schlauchsystem klingt
  return { grund: dauerRauschen(w, { filter: 'lowpass', f: 300, pegel }) };
}

function knistern(w: Werkzeug, t: number, dauer: number, anzahl: number) {
  for (let i = 0; i < anzahl; i++) {
    const d = t + w.zufall() * dauer;
    rauschen(w, d, { dauer: 0.006 + w.zufall() * 0.006, filter: 'bandpass', f: 700 + w.zufall() * 900, q: 1.5, pegel: 0.25 + w.zufall() * 0.25, attack: 0.001, release: 0.004 });
  }
}

function atemzug(w: Werkzeug, t: number, p: KlangParameter, o: { verlaengert?: boolean; pegel?: number; f?: number } = {}) {
  const z = atemZyklus(p.af, o.verlaengert);
  const pegel = o.pegel ?? 0.22, f = o.f ?? 650;
  rauschen(w, t, { dauer: z.ein, filter: 'lowpass', f, fEnde: f * 1.3, q: 0.5, pegel, attack: z.ein * 0.6, release: z.ein * 0.3 });
  rauschen(w, t + z.ein + 0.05, { dauer: z.aus, filter: 'lowpass', f: f * 0.75, fEnde: f * 0.5, q: 0.5, pegel: pegel * 0.45, attack: 0.15, release: z.aus * 0.6 });
  return z;
}

function uhrTick(w: Werkzeug, t: number, hoch: boolean, pegel = 0.05) {
  rauschen(w, t, { dauer: 0.012, filter: 'highpass', f: hoch ? 3500 : 2800, pegel, attack: 0.001, release: 0.008 });
}

function ferneEreignisse(w: Werkzeug, t: number, auswahl: Array<'piep' | 'schritte' | 'wagen' | 'telefon' | 'tuer' | 'stimmen' | 'pager' | 'vogel'>) {
  const was = auswahl[Math.floor(w.zufall() * auswahl.length)];
  switch (was) {
    case 'piep': for (let i = 0; i < 3; i++) ton(w, t + i * 0.9, { f: 990, dauer: 0.08, pegel: 0.02 }); break;
    case 'schritte': for (let i = 0; i < 6; i++) rauschen(w, t + i * 0.5 + w.zufall() * 0.04, { dauer: 0.05, filter: 'lowpass', f: 380, pegel: 0.05, attack: 0.003 }); break;
    case 'wagen': for (let i = 0; i < 14; i++) rauschen(w, t + i * 0.09 + w.zufall() * 0.03, { dauer: 0.02, filter: 'bandpass', f: 1800 + w.zufall() * 1200, q: 3, pegel: 0.03, attack: 0.001 }); break;
    case 'telefon': for (let i = 0; i < 2; i++) klingeln(w, t + i * 1.6, 0.6, 0.02); break;
    case 'tuer': rauschen(w, t, { dauer: 0.35, filter: 'lowpass', f: 250, pegel: 0.07, attack: 0.01 }); rauschen(w, t + 0.32, { dauer: 0.08, filter: 'lowpass', f: 180, pegel: 0.09, attack: 0.002 }); break;
    case 'stimmen': murmeln(w, t, 2.5 + w.zufall() * 2, 0.04); break;
    case 'pager': for (let i = 0; i < 4; i++) ton(w, t + i * 0.16, { f: 2100, dauer: 0.08, pegel: 0.018 }); break;
    case 'vogel': for (let i = 0; i < 3; i++) ton(w, t + i * 0.16, { f: 3200 + w.zufall() * 600, fEnde: 4400, dauer: 0.07, pegel: 0.025 }); break;
  }
}

/** Stimmengewirr in der Ferne: Rauschen im Sprachbereich, im Silbentakt moduliert. Keine Wörter. */
function murmeln(w: Werkzeug, t: number, dauer: number, pegel: number) {
  let d = 0;
  while (d < dauer) {
    const silbe = 0.12 + w.zufall() * 0.16;
    rauschen(w, t + d, { dauer: silbe, filter: 'bandpass', f: 350 + w.zufall() * 500, q: 4, pegel: pegel * (0.5 + w.zufall() * 0.5), attack: 0.03, release: 0.06 });
    d += silbe + (w.zufall() < 0.2 ? 0.25 : 0.03);
  }
}

/** Elektronischer Telefon-Klingelton: zwei Töne im schnellen Wechsel. */
function klingeln(w: Werkzeug, t: number, dauer: number, pegel = 0.12) {
  for (let d = 0; d < dauer; d += 0.05) {
    ton(w, t + d, { f: Math.round(d / 0.05) % 2 ? 1320 : 1060, dauer: 0.05, pegel, typ: 'square', tiefpass: 3000, attack: 0.002, release: 0.005 });
  }
}

function glocke(w: Werkzeug, t: number, f: number, pegel: number, dauer = 0.9) {
  ton(w, t, { f, dauer, pegel, attack: 0.004, release: dauer * 0.95 });
  ton(w, t, { f: f * 2.76, dauer: dauer * 0.4, pegel: pegel * 0.18, attack: 0.002, release: dauer * 0.38 });
}

// ---------- Katalog ----------

export const KLAENGE: Klang[] = [
  // Rückmeldung
  { id: 'klick', titel: 'Tippen', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Kurzer, leiser Klick beim Auswählen.',
    takt: (w, t) => { ton(w, t, { f: 1800, dauer: 0.025, pegel: 0.06, attack: 0.001 }); return 0; } },
  { id: 'richtig', titel: 'Richtig', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Zwei helle, aufsteigende Töne.',
    takt: (w, t) => { glocke(w, t, 659, 0.13, 0.35); glocke(w, t + 0.09, 988, 0.13, 0.5); return 0; } },
  { id: 'teilweise', titel: 'Teilweise richtig', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Ein mittlerer Ton: Teilpunkte.',
    takt: (w, t) => { glocke(w, t, 698, 0.12, 0.45); return 0; } },
  { id: 'falsch', titel: 'Nicht richtig', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Zwei weiche, absteigende Töne. Kein Strafton.',
    takt: (w, t) => { ton(w, t, { f: 330, dauer: 0.14, pegel: 0.12, typ: 'triangle' }); ton(w, t + 0.13, { f: 262, dauer: 0.22, pegel: 0.12, typ: 'triangle' }); return 0; } },
  { id: 'fertig', titel: 'Runde geschafft', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Kurzer Dreiklang nach oben.',
    takt: (w, t) => { [523, 659, 784, 1047].forEach((f, i) => glocke(w, t + i * 0.09, f, 0.1, 0.6)); return 0; } },
  { id: 'erfolg', titel: 'Ziel erreicht', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Funkelnder Dreiklang für Serien, Wochenziele, sehr gute Ergebnisse.',
    takt: (w, t) => { [523, 659, 784, 1047, 1319].forEach((f, i) => glocke(w, t + i * 0.07, f, 0.09, 0.9)); for (let i = 0; i < 6; i++) ton(w, t + 0.4 + i * 0.05, { f: 2093 + i * 180, dauer: 0.12, pegel: 0.02 }); return 0; } },
  { id: 'umdrehen', titel: 'Karte umdrehen', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Kurzes Wischen wie beim Umdrehen einer Karteikarte.',
    takt: (w, t) => { rauschen(w, t, { dauer: 0.16, filter: 'bandpass', f: 1200, fEnde: 3500, q: 1.2, pegel: 0.09, attack: 0.04, release: 0.1 }); return 0; } },
  { id: 'hinweis', titel: 'Hinweis', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Einzelner heller Gong, z. B. wenn eine Rückmeldung kommt.',
    takt: (w, t) => { glocke(w, t, 880, 0.1, 0.7); return 0; } },
  { id: 'zeit', titel: 'Zeit abgelaufen', gruppe: 'rueckmeldung', kategorie: 'ui', schleife: false, text: 'Drei ruhige Töne am Ende einer Zeitvorgabe.',
    takt: (w, t) => { for (let i = 0; i < 3; i++) glocke(w, t + i * 0.32, 784, 0.11, 0.3); return 0; } },

  // Geräte und Ruf
  { id: 'monitor-piep', titel: 'Monitor: Herzschlag', gruppe: 'geraet', kategorie: 'sim', schleife: true,
    text: 'Pulston des Monitors im Takt der Herzfrequenz.', merkmal: 'Die Tonhöhe sinkt mit der Sättigung: je tiefer der Ton, desto niedriger die SpO₂.',
    takt: (w, t, p) => { ton(w, t, { f: piepFrequenz(p.spo2), dauer: 0.07, pegel: 0.09, attack: 0.003, release: 0.03 }); return herzZyklus(p.puls).periode; } },
  { id: 'telefon', titel: 'Telefon', gruppe: 'geraet', kategorie: 'sim', schleife: true, text: 'Stationstelefon klingelt (Labor, Ärztin, Angehörige).', merkmal: 'Schneller Zweiton-Triller, etwa eine Sekunde, dann Pause. Kritische Laborwerte kommen oft so: zurücklesen und dokumentieren.',
    takt: (w, t) => { klingeln(w, t, 1); return 4; } },
  { id: 'patientenruf', titel: 'Patientenruf', gruppe: 'geraet', kategorie: 'sim', schleife: true, text: 'Rufanlage: jemand hat geklingelt.', merkmal: 'Zweiton-Gong, wiederholt sich, bis der Ruf vor Ort abgestellt wird.',
    takt: (w, t) => { glocke(w, t, 784, 0.12); glocke(w, t + 0.45, 622, 0.12, 1.1); return 4.5; } },
  { id: 'pumpe', titel: 'Spritzenpumpe: Alarm', gruppe: 'geraet', kategorie: 'sim', schleife: true, text: 'Perfusor meldet z. B. Spritze fast leer oder Verschluss.', merkmal: 'Schnelle hohe Dreiergruppe, deutlich heller als der Monitor.',
    takt: (w, t) => { for (let i = 0; i < 3; i++) ton(w, t + i * 0.14, { f: 1760, dauer: 0.08, pegel: 0.08 }); return 2.5; } },
  { id: 'nibp', titel: 'Blutdruckmessung (Monitor)', gruppe: 'geraet', kategorie: 'sim', schleife: false, text: 'Manschette pumpt auf, lässt stufenweise ab, Messung fertig.',
    takt: (w, t) => {
      for (let d = 0; d < 2.6; d += 0.03) rauschen(w, t + d, { dauer: 0.03, filter: 'bandpass', f: 140 + d * 30, q: 2, pegel: 0.05, attack: 0.002 });
      for (let i = 0; i < 7; i++) rauschen(w, t + 3 + i * 0.45, { dauer: 0.12, filter: 'highpass', f: 2500, pegel: 0.02, attack: 0.005 });
      rauschen(w, t + 6.3, { dauer: 0.6, filter: 'highpass', f: 1800, pegel: 0.04, attack: 0.02 });
      ton(w, t + 7, { f: 1040, dauer: 0.12, pegel: 0.06 }); return 0;
    } },
  { id: 'rea-alarm', titel: 'Reanimationsalarm', gruppe: 'geraet', kategorie: 'sim', schleife: true, text: 'Notfallalarm (Herzalarm) über Funk/Pieper.', merkmal: 'Schneller Zweiton-Wechsel ohne Pause: sofort reagieren.',
    takt: (w, t) => { for (let i = 0; i < 8; i++) ton(w, t + i * 0.15, { f: i % 2 ? 660 : 880, dauer: 0.14, pegel: 0.1, typ: 'square', tiefpass: 2400 }); return 2.2; } },
  { id: 'defi', titel: 'Defibrillator lädt', gruppe: 'geraet', kategorie: 'sim', schleife: false, text: 'Ladeton steigt an, dann Bereitschaftston. Niemand berührt den Patienten.',
    takt: (w, t) => { ton(w, t, { f: 500, fEnde: 2200, dauer: 3, pegel: 0.05, attack: 0.1 }); for (let i = 0; i < 6; i++) ton(w, t + 3.1 + i * 0.25, { f: 1400, dauer: 0.12, pegel: 0.08 }); return 0; } },

  // Alarme
  { id: 'alarm-hoch', titel: 'Alarm: hohe Priorität (rot)', gruppe: 'alarm', kategorie: 'sim', schleife: true,
    text: 'Lebensbedrohlicher Zustand, z. B. Asystolie, Kammerflimmern, extrem niedrige Sättigung.', merkmal: 'Zehn schnelle Töne (3+2, 3+2), alle paar Sekunden wieder. Sofort zum Patienten.',
    takt: alarmGruppe('hoch') },
  { id: 'alarm-mittel', titel: 'Alarm: mittlere Priorität (gelb)', gruppe: 'alarm', kategorie: 'sim', schleife: true,
    text: 'Grenzwert überschritten, z. B. Sättigung oder Herzfrequenz außerhalb der Grenzen.', merkmal: 'Drei Töne, langsamer und tiefer als der rote Alarm. Zeitnah prüfen.',
    takt: alarmGruppe('mittel') },
  { id: 'alarm-niedrig', titel: 'Hinweis: niedrige Priorität', gruppe: 'alarm', kategorie: 'sim', schleife: true,
    text: 'Technischer Hinweis, z. B. Elektrode lose, Sensor ab, Akku schwach.', merkmal: 'Zwei Töne, selten wiederholt. Kein Notfall, aber beheben.',
    takt: alarmGruppe('niedrig') },

  // Herz
  { id: 'herz-normal', titel: 'Normale Herztöne', gruppe: 'herz', kategorie: 'sim', schleife: true,
    text: '1. Herzton (Schluss der Segelklappen) und 2. Herzton (Schluss der Taschenklappen).', merkmal: '„Lupp – dupp“, Pause. Der 1. Ton ist dumpfer und länger, der 2. kürzer und heller.',
    start: (w) => stethoskop(w),
    takt: (w, t, p) => { const z = herzZyklus(p.puls); s1(w, t); s2(w, t + z.systole); return z.periode; } },
  { id: 'herz-tachy', titel: 'Tachykardie', gruppe: 'herz', kategorie: 'sim', schleife: true,
    text: 'Herzfrequenz über 100/min, z. B. bei Fieber, Volumenmangel, Schmerz, Angst.', merkmal: 'Gleiche Töne, aber schnell; die Pause nach dem 2. Ton wird kurz.',
    start: (w) => stethoskop(w),
    takt: (w, t, p) => { const z = herzZyklus(Math.max(120, p.puls ?? 130)); s1(w, t); s2(w, t + z.systole); return z.periode; } },
  { id: 'herz-arrhythmie', titel: 'Absolute Arrhythmie', gruppe: 'herz', kategorie: 'sim', schleife: true,
    text: 'Völlig unregelmäßiger Herzschlag, typisch bei Vorhofflimmern.', merkmal: 'Kein Rhythmus zum Mitklopfen, Abstände und Lautstärke wechseln ständig.',
    start: (w) => stethoskop(w),
    takt: (w, t) => { const periode = 0.42 + w.zufall() * 0.7, pegel = 0.6 + w.zufall() * 0.5; s1(w, t, pegel); s2(w, t + Math.min(0.3, periode * 0.45), pegel * 0.9); return periode; } },
  { id: 'herz-s3', titel: '3. Herzton (Galopp)', gruppe: 'herz', kategorie: 'sim', schleife: true,
    text: 'Zusätzlicher leiser, tiefer Ton kurz nach dem 2. Herzton, z. B. bei Herzinsuffizienz.', merkmal: 'Dreierrhythmus wie Pferdegalopp: „Lupp – dupp-da“.',
    start: (w) => stethoskop(w),
    takt: (w, t, p) => { const z = herzZyklus(p.puls ?? 90); s1(w, t); s2(w, t + z.systole); ton(w, t + z.systole + 0.14, { f: 38, dauer: 0.08, pegel: 0.4, attack: 0.015 }); rauschen(w, t + z.systole + 0.14, { dauer: 0.07, filter: 'lowpass', f: 90, pegel: 0.35 }); return z.periode; } },
  { id: 'herz-systolikum', titel: 'Systolisches Geräusch', gruppe: 'herz', kategorie: 'sim', schleife: true,
    text: 'Strömungsgeräusch zwischen 1. und 2. Herzton, z. B. bei Aortenklappenstenose.', merkmal: 'Rauschen zwischen „Lupp“ und „dupp“, schwillt an und ab (spindelförmig).',
    start: (w) => stethoskop(w),
    takt: (w, t, p) => {
      const z = herzZyklus(p.puls ?? 76); s1(w, t, 0.8); s2(w, t + z.systole, 0.7);
      const beginn = t + 0.06, dauer = z.systole - 0.09, g = w.ctx.createGain(), f = w.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 260; f.Q.value = 1.1;
      g.gain.setValueAtTime(0.0001, beginn); g.gain.linearRampToValueAtTime(0.32, beginn + dauer * 0.45); g.gain.linearRampToValueAtTime(0.0001, beginn + dauer);
      g.connect(w.aus); f.connect(g);
      rauschen(w, beginn, { dauer, filter: 'allpass', pegel: 1, attack: 0.001, release: 0.001, ziel: f });
      return z.periode;
    } },

  // Lunge
  { id: 'atem-vesikulaer', titel: 'Vesikuläres Atemgeräusch', gruppe: 'lunge', kategorie: 'sim', schleife: true,
    text: 'Normales Atemgeräusch über der Lunge.', merkmal: 'Weiches Rauschen, beim Einatmen lauter und länger, beim Ausatmen leiser und kurz.',
    start: (w) => stethoskop(w, 0.02),
    takt: (w, t, p) => atemzug(w, t, p).periode },
  { id: 'atem-giemen', titel: 'Giemen und Brummen', gruppe: 'lunge', kategorie: 'sim', schleife: true,
    text: 'Trockene Nebengeräusche durch verengte Atemwege, z. B. Asthma oder COPD.', merkmal: 'Pfeifende, musikalische Töne beim Ausatmen; die Ausatmung ist deutlich verlängert.',
    start: (w) => stethoskop(w, 0.02),
    takt: (w, t, p) => {
      const z = atemzug(w, t, p, { verlaengert: true, pegel: 0.16 });
      const aus = t + z.ein + 0.1;
      ton(w, aus, { f: 520, fEnde: 470, dauer: z.aus * 0.85, pegel: 0.05, typ: 'triangle', attack: 0.2, release: 0.3 });
      ton(w, aus + 0.2, { f: 690, fEnde: 640, dauer: z.aus * 0.6, pegel: 0.035, attack: 0.2, release: 0.3 });
      ton(w, aus, { f: 160, fEnde: 140, dauer: z.aus * 0.7, pegel: 0.04, typ: 'sawtooth', tiefpass: 500, attack: 0.25, release: 0.3 });
      return z.periode;
    } },
  { id: 'atem-rg', titel: 'Feuchte Rasselgeräusche', gruppe: 'lunge', kategorie: 'sim', schleife: true,
    text: 'Feinblasiges Knistern, wenn sich Flüssigkeit in den Alveolen befindet, z. B. Lungenödem, Pneumonie.', merkmal: 'Knistern wie Haare zwischen den Fingern reiben, vor allem gegen Ende der Einatmung.',
    start: (w) => stethoskop(w, 0.02),
    takt: (w, t, p) => { const z = atemzug(w, t, p, { pegel: 0.14 }); knistern(w, t + z.ein * 0.4, z.ein * 0.6, 22); return z.periode; } },
  { id: 'atem-stridor', titel: 'Inspiratorischer Stridor', gruppe: 'lunge', kategorie: 'sim', schleife: true,
    text: 'Lautes, hartes Geräusch bei Verengung der oberen Atemwege, z. B. Pseudokrupp, Fremdkörper, Schwellung.', merkmal: 'Pfeifend-ziehend beim Einatmen, oft ohne Stethoskop hörbar. Notfall!',
    takt: (w, t, p) => {
      const z = atemZyklus(p.af ?? 24);
      rauschen(w, t, { dauer: z.ein, filter: 'bandpass', f: 900, fEnde: 1100, q: 5, pegel: 0.3, attack: z.ein * 0.3, release: z.ein * 0.3 });
      ton(w, t, { f: 760, fEnde: 820, dauer: z.ein, pegel: 0.035, typ: 'sawtooth', tiefpass: 1800, attack: z.ein * 0.3, release: z.ein * 0.3 });
      rauschen(w, t + z.ein + 0.05, { dauer: z.aus * 0.8, filter: 'lowpass', f: 500, pegel: 0.06, attack: 0.1, release: 0.3 });
      return z.periode;
    } },

  // Darm
  { id: 'darm-normal', titel: 'Normale Darmgeräusche', gruppe: 'darm', kategorie: 'sim', schleife: true,
    text: 'Gluckern durch Bewegung von Luft und Flüssigkeit im Darm.', merkmal: 'Unregelmäßiges, tiefes Gurgeln alle paar Sekunden.',
    start: (w) => stethoskop(w, 0.025),
    takt: (w, t) => {
      const n = 3 + Math.floor(w.zufall() * 4);
      for (let i = 0; i < n; i++) rauschen(w, t + i * 0.07, { dauer: 0.09, filter: 'bandpass', f: 320 - i * 25 + w.zufall() * 60, fEnde: 180, q: 9, pegel: 0.25, attack: 0.01 });
      return 1.5 + w.zufall() * 4;
    } },
  { id: 'darm-hoch', titel: 'Hochgestellte, klingende Darmgeräusche', gruppe: 'darm', kategorie: 'sim', schleife: true,
    text: 'Gesteigerte, metallisch klingende Geräusche, z. B. bei mechanischem Ileus.', merkmal: 'Häufig, hell, „spritzend“ oder „tropfend“ wie in einer Metallschüssel.',
    start: (w) => stethoskop(w, 0.025),
    takt: (w, t) => {
      const n = 2 + Math.floor(w.zufall() * 3);
      for (let i = 0; i < n; i++) glocke(w, t + i * 0.06, 1300 + w.zufall() * 900, 0.05, 0.25);
      rauschen(w, t, { dauer: 0.12, filter: 'bandpass', f: 600, q: 6, pegel: 0.12 });
      return 0.5 + w.zufall() * 1.3;
    } },
  { id: 'darm-still', titel: 'Fehlende Darmgeräusche', gruppe: 'darm', kategorie: 'sim', schleife: true,
    text: '„Totenstille“: über Minuten keine Geräusche, z. B. bei paralytischem Ileus oder Peritonitis.', merkmal: 'Nur das leise Rauschen des Stethoskops. Mindestens 2–3 Minuten hören, bevor man das sagt.',
    start: (w) => stethoskop(w, 0.03),
    takt: () => 5 },

  // Raum
  { id: 'raum-station', titel: 'Normalstation', gruppe: 'raum', kategorie: 'atmo', schleife: true, text: 'Lüftung, ferne Schritte, Wagen, Türen, ein Telefon.',
    start: (w) => ({ luft: dauerRauschen(w, { f: 220, pegel: 0.05 }) }),
    takt: (w, t) => { ferneEreignisse(w, t, ['schritte', 'wagen', 'tuer', 'telefon', 'stimmen', 'piep']); return 5 + w.zufall() * 9; } },
  { id: 'raum-intensiv', titel: 'Intensivstation', gruppe: 'raum', kategorie: 'atmo', schleife: true, text: 'Beatmungsgerät im Takt, Monitore anderer Betten, Pumpen.',
    start: (w) => ({ luft: dauerRauschen(w, { f: 260, pegel: 0.05 }), brumm: dauerTon(w, { f: 100, pegel: 0.006 }) }),
    takt: (w, t) => {
      // ein Beatmungszyklus (~15/min) plus gelegentlich ferne Pieptöne
      rauschen(w, t, { dauer: 1.3, filter: 'bandpass', f: 1100, q: 0.8, pegel: 0.035, attack: 0.4, release: 0.6 });
      rauschen(w, t + 1.35, { dauer: 0.03, filter: 'highpass', f: 2500, pegel: 0.03, attack: 0.002 });
      for (let i = 0; i < 4; i++) if (w.zufall() < 0.6) ton(w, t + i * 1 + w.zufall() * 0.2, { f: 880 + Math.floor(w.zufall() * 3) * 110, dauer: 0.06, pegel: 0.012 });
      if (w.zufall() < 0.15) ferneEreignisse(w, t + 2, ['pager', 'schritte', 'stimmen']);
      return 4;
    } },
  { id: 'raum-notaufnahme', titel: 'Notaufnahme', gruppe: 'raum', kategorie: 'atmo', schleife: true, text: 'Viel Betrieb: Stimmen, Telefone, Pieper, Wagen.',
    start: (w) => ({ luft: dauerRauschen(w, { f: 300, pegel: 0.055 }) }),
    takt: (w, t) => { ferneEreignisse(w, t, ['stimmen', 'stimmen', 'telefon', 'pager', 'wagen', 'schritte', 'tuer', 'piep']); return 2 + w.zufall() * 4; } },
  { id: 'raum-heim', titel: 'Pflegeheim', gruppe: 'raum', kategorie: 'atmo', schleife: true, text: 'Ruhiges Zimmer, Wanduhr, ab und zu Schritte und Stimmen im Flur.',
    start: (w) => ({ luft: dauerRauschen(w, { f: 180, pegel: 0.03 }) }),
    takt: (w, t) => { for (let i = 0; i < 8; i++) uhrTick(w, t + i, i % 2 === 0); if (w.zufall() < 0.4) ferneEreignisse(w, t + 2 + w.zufall() * 4, ['schritte', 'stimmen', 'tuer']); return 8; } },
  { id: 'raum-wohnung', titel: 'Wohnung (ambulant)', gruppe: 'raum', kategorie: 'atmo', schleife: true, text: 'Wanduhr, Kühlschrank, draußen Vögel.',
    start: (w) => ({ luft: dauerRauschen(w, { f: 160, pegel: 0.025 }), kuehl: dauerTon(w, { f: 50, pegel: 0.01, typ: 'triangle' }) }),
    takt: (w, t) => { for (let i = 0; i < 8; i++) uhrTick(w, t + i, i % 2 === 0, 0.06); if (w.zufall() < 0.45) ferneEreignisse(w, t + w.zufall() * 6, ['vogel', 'vogel', 'tuer']); return 8; } },
];

export const KLANG = Object.fromEntries(KLAENGE.map((k) => [k.id, k])) as Record<string, Klang>;
export type KlangId = string;

export type Raum = 'station' | 'intensiv' | 'notaufnahme' | 'heim' | 'wohnung';
export const RAUM_KLANG: Record<Raum, KlangId> = {
  station: 'raum-station', intensiv: 'raum-intensiv', notaufnahme: 'raum-notaufnahme', heim: 'raum-heim', wohnung: 'raum-wohnung',
};

/**
 * Ordnet Setting-Namen aus Praxis-, Fall- und Diagnostiksimulator (oder eine Raumfoto-Kennung wie
 * „15_intensiv_beatmung“) einem Raumklang zu.
 */
export function raumFuerSetting(setting: string | undefined): Raum {
  const s = (setting ?? '').toLowerCase();
  if (s === 'its' || s.includes('intensiv')) return 'intensiv';
  if (s === 'zna' || s.includes('notauf') || s.includes('schock')) return 'notaufnahme';
  if (s === 'heim' || s === 'langzeit' || s === 'palliativ' || s.includes('pflegeheim')) return 'heim';
  if (s.includes('ambulant')) return 'wohnung';
  return 'station';
}

export function alarmKlang(stufe: 'ok' | 'gelb' | 'rot' | 'kein' | undefined): KlangId | null {
  return stufe === 'rot' ? 'alarm-hoch' : stufe === 'gelb' ? 'alarm-mittel' : null;
}

/**
 * Passendes Hörbeispiel zu einem Auskultationsbefund in Textform (Praxissimulator).
 * null, wenn der Befund kein eindeutiges Geräusch beschreibt (z. B. „abgeschwächt“, „erst nach Zustimmung“).
 */
export function klangZuBefund(befund: string): KlangId | null {
  const t = befund.toLowerCase();
  if (/stridor/.test(t)) return 'atem-stridor';
  if (/giemen|pfeif|brumm/.test(t)) return 'atem-giemen';
  if (/rassel/.test(t) && !/kein(e|en)? (auffällig\w* )?rassel/.test(t)) return 'atem-rg';
  if (/abgeschwächt|zustimmung|einwilligung/.test(t)) return null;
  if (/unauffällig|belüftet|keine auffällig|kein auffällig|vesikulär/.test(t)) return 'atem-vesikulaer';
  return null;
}
