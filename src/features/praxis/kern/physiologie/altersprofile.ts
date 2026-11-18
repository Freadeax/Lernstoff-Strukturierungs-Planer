// Alters- und Settingprofile für das Pflege-Physiologiemodell (KONZEPT 4.6).
// Ruhewerte liegen in den Normalbereichen des gemeinsamen Vertrags (src/ui/sim/vitalnormen.ts),
// Alarmfarben und Frühwarnung kommen aus monitor.ts (Kinderprofile) und praxis/news2.ts (NEWS2).
// Didaktisch gerundet, fachlich ungeprüft (Lernmodell); lokale Vorgaben gehen vor.

import { alarmProfil, alarmStufe, type Alarm, type AlarmProfil, type MonitorGruppe, type MonitorParameter } from '../../../../ui/sim/monitor';
import { news2Punkte, type Avpu, type News2Risiko } from '../../news2';
import type { Altersgruppe, Anzeige } from '../typen';

export interface Altersprofil {
  gruppe: Altersgruppe;
  label: string;
  /** Ruhewerte im Wachzustand */
  ruhePuls: number;
  ruheAF: number;
  rrSys: number;
  rrDia: number;
  /** Normalbereich Puls (für Tachy-/Bradykardie-Benennung) */
  pulsNormal: [number, number];
  /** Höchste erreichbare Frequenz im Modell */
  maxPuls: number;
  /** Höchste Atemfrequenz im Modell */
  maxAF: number;
  /** typisches Gewicht in kg, wenn der Fall keins nennt */
  gewichtKg: number;
  /** Blutvolumen ml/kg */
  blutvolumenMlKg: number;
  /** Stärke des Barorezeptor-Reflexes (Hochbetagte: schwächer, Pulsanstieg bleibt oft aus) */
  baroGain: number;
  /** Vorlastabhängigkeit: Exponent auf das Volumen (1 = normal, Hochbetagte > 1: steifer Ventrikel, Exsikkose senkt den Druck stark) */
  vorlastExponent: number;
  /** Anteil der üblichen Fieberantwort (Hochbetagte fiebern oft weniger) */
  fieberAntwort: number;
  /** Anfälligkeit für Delir (Faktor auf die Auslöser) */
  delirAnfaellig: number;
  /** Altersbedingte Hinweise für Lernende */
  hinweise: string[];
}

export const ALTERSPROFILE: Record<Altersgruppe, Altersprofil> = {
  saeugling: {
    gruppe: 'saeugling', label: 'Säugling (unter 1 Jahr)', ruhePuls: 130, ruheAF: 40, rrSys: 85, rrDia: 50, pulsNormal: [100, 160],
    maxPuls: 230, maxAF: 90, gewichtKg: 6, blutvolumenMlKg: 85, baroGain: 0.8, vorlastExponent: 1, fieberAntwort: 1, delirAnfaellig: 0.5,
    hinweise: [
      'Säuglinge steigern das Herzzeitvolumen fast nur über die Frequenz. Eine Bradykardie bei Atemnot ist ein Alarmzeichen (Hypoxie).',
      'Der Blutdruck fällt spät: Rekapillarisierungszeit, Hautfarbe und Trinkverhalten zeigen den Kreislauf früher.',
      'Für Säuglinge gibt es hier kein freigegebenes Alarmprofil; die Werte werden nicht automatisch gefärbt.',
    ],
  },
  kleinkind: {
    gruppe: 'kleinkind', label: 'Kleinkind (1 bis 5 Jahre)', ruhePuls: 115, ruheAF: 28, rrSys: 95, rrDia: 58, pulsNormal: [90, 150],
    maxPuls: 210, maxAF: 70, gewichtKg: 14, blutvolumenMlKg: 80, baroGain: 1, vorlastExponent: 1, fieberAntwort: 1.1, delirAnfaellig: 0.6,
    hinweise: [
      'Kinder kompensieren Volumenverlust lange über den Puls. Fällt der Blutdruck, ist die Reserve aufgebraucht.',
      'Fieber steigt bei Kleinkindern schnell; ein Fieberkrampf ist möglich.',
    ],
  },
  schulkind: {
    gruppe: 'schulkind', label: 'Schulkind (6 bis 13 Jahre)', ruhePuls: 90, ruheAF: 20, rrSys: 105, rrDia: 65, pulsNormal: [70, 130],
    maxPuls: 200, maxAF: 50, gewichtKg: 30, blutvolumenMlKg: 75, baroGain: 1, vorlastExponent: 1, fieberAntwort: 1, delirAnfaellig: 0.6,
    hinweise: ['Auch Schulkinder halten den Blutdruck lange: Puls und Rekapillarisierung zuerst beurteilen.'],
  },
  jugendlich: {
    gruppe: 'jugendlich', label: 'Jugendliche (14 bis 17 Jahre)', ruhePuls: 75, ruheAF: 16, rrSys: 115, rrDia: 70, pulsNormal: [60, 100],
    maxPuls: 200, maxAF: 45, gewichtKg: 55, blutvolumenMlKg: 70, baroGain: 1, vorlastExponent: 1, fieberAntwort: 1, delirAnfaellig: 0.7,
    hinweise: ['NEWS2 ist für Erwachsene ab 16 Jahren entwickelt; bei Jüngeren gelten die Vorgaben der Kinderklinik.'],
  },
  erwachsen: {
    gruppe: 'erwachsen', label: 'Erwachsene', ruhePuls: 72, ruheAF: 14, rrSys: 122, rrDia: 78, pulsNormal: [60, 100],
    maxPuls: 185, maxAF: 45, gewichtKg: 75, blutvolumenMlKg: 70, baroGain: 1, vorlastExponent: 1, fieberAntwort: 1, delirAnfaellig: 1,
    hinweise: [],
  },
  hochbetagt: {
    gruppe: 'hochbetagt', label: 'Hochbetagte (ab etwa 80 Jahren)', ruhePuls: 72, ruheAF: 16, rrSys: 138, rrDia: 76, pulsNormal: [60, 100],
    maxPuls: 150, maxAF: 40, gewichtKg: 65, blutvolumenMlKg: 65, baroGain: 0.3, vorlastExponent: 2.2, fieberAntwort: 0.6, delirAnfaellig: 1.6,
    hinweise: [
      'Hochbetagte haben weniger Durstgefühl und trocknen schneller aus (Exsikkose), oft erkennbar an neuer Verwirrtheit.',
      'Der Pulsanstieg bei Volumenmangel oder Infektion fällt schwächer aus (Barorezeptoren, Betablocker): ein „normaler“ Puls beruhigt nicht.',
      'Fieber kann bei Infektionen fehlen oder niedrig bleiben; Schmerz wird oft anders geäußert (bei Demenz BESD nutzen).',
    ],
  },
};

export const profil = (g: Altersgruppe): Altersprofil => ALTERSPROFILE[g];

/** Altersgruppe → Gruppe des Monitors (Jugendliche und Hochbetagte nach Erwachsenenprofil). */
export function monitorGruppe(g: Altersgruppe): MonitorGruppe {
  return g === 'saeugling' || g === 'kleinkind' || g === 'schulkind' ? g : 'erwachsen';
}

const MONITOR_PARAM: Partial<Record<keyof Anzeige, MonitorParameter>> = { hf: 'puls', af: 'af', spo2: 'spo2', rrSys: 'sys', temp: 'temp' };

/** Alarmfarbe eines Anzeigewerts wie am Monitor (Erwachsene: NEWS2-Bänder, Kinder: Altersprofil, Säuglinge: keine). */
export function alarmFuer(groesse: keyof Anzeige, wert: number, g: Altersgruppe): Alarm {
  const p = MONITOR_PARAM[groesse];
  return p ? alarmStufe(p, wert, monitorGruppe(g)) : 'ok';
}

export interface Fruehwarnung {
  system: 'NEWS2' | 'Kinderprofil' | 'kein Profil';
  profil: AlarmProfil;
  /** nur NEWS2 */
  punkte?: number;
  risiko?: News2Risiko;
  /** Alarmfarbe je Wert */
  stufen: Partial<Record<keyof Anzeige, Alarm>>;
}

/**
 * Frühwarnung aus den Anzeigewerten. Erwachsene/Jugendliche/Hochbetagte: NEWS2 (ACVPU, „C“ = neu verwirrt);
 * Kinder: Farben nach Altersprofil; Säuglinge: kein freigegebenes Profil.
 */
export function fruehwarnung(a: Anzeige, g: Altersgruppe, mitSauerstoff: boolean, neuVerwirrt: boolean): Fruehwarnung {
  const mg = monitorGruppe(g);
  const stufen: Fruehwarnung['stufen'] = {};
  for (const k of Object.keys(MONITOR_PARAM) as Array<keyof Anzeige>) stufen[k] = alarmFuer(k, a[k] as number, g);
  if (mg !== 'erwachsen') return { system: mg === 'saeugling' ? 'kein Profil' : 'Kinderprofil', profil: alarmProfil(mg), stufen };
  const avpu: Avpu = a.avpu === 'A' && neuVerwirrt ? 'C' : a.avpu;
  const n = news2Punkte({ af: a.af, spo2: a.spo2, sauerstoff: mitSauerstoff, sys: a.rrSys, puls: a.hf, avpu, temp: a.temp });
  return { system: 'NEWS2', profil: alarmProfil(mg), punkte: n.punkte, risiko: n.risiko, stufen };
}
