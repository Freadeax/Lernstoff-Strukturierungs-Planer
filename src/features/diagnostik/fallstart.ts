// Fallstart (Audit SIM-03 und Live-Funde 1/3): Zustand je Fall, Schritte aus dem Fall selbst,
// Falltyp, ungefähre Dauer und Ortsangabe nach der Station des Falls statt nach dem Raumfoto.

import { RAEUME } from '../../ui/sim/raeume/katalog';
import type { Lauf } from './lauf';
import type { DiagnostikFall } from './typen';

export type FallZustand = 'neu' | 'laeuft' | 'beendet';

export function fallZustand(l: Lauf | undefined): FallZustand {
  if (!l) return 'neu';
  return l.beendet !== undefined ? 'beendet' : 'laeuft';
}

/** Primärer Knopf in der Fallliste je Zustand. */
export const ZUSTAND_KNOPF: Record<FallZustand, string> = { neu: 'Starten', laeuft: 'Fortsetzen', beendet: 'Auswertung ansehen' };
export const ZUSTAND_TEXT: Record<FallZustand, string> = { neu: 'neu', laeuft: 'läuft', beendet: 'abgeschlossen' };

const MODALITAET: Record<string, string> = { roentgen: 'Röntgen', ct: 'CT' };

/** Schritte genau dieses Falls (statt eines allgemeinen Ablaufs, der Bildgebung auch bei Fällen ohne Bilder ankündigt). */
export function fallSchritte(f: DiagnostikFall): string[] {
  const s: string[] = [];
  s.push(f.monitor?.start === 'abwesend' ? 'Patientin oder Patient einschätzen, Monitor anschließen' : 'Patientin oder Patient einschätzen, Monitor lesen');
  if (Object.keys(f.labor).length) s.push('Laborauftrag, Röhrchen und Blutabnahme, Befund lesen');
  if (f.bildgebung.length) s.push(`Bildgebung vorbereiten und lesen: ${f.bildgebung.map((u) => u.serie.untersuchung).join(', ')}`);
  if (f.sbar.length) s.push('Kritische Werte melden und ärztlich informieren (SBAR)');
  if (f.anordnungen.length) s.push('Anordnungen umsetzen und Wirkung beobachten');
  if (f.fragen.length) s.push(`Lernfragen (${f.fragen.length}) und Auswertung`);
  return s;
}

/** Falltyp in einer Zeile, z. B. „Erwachsene · Labor und Bildgebung (Röntgen, CT)“. */
export function fallTyp(f: DiagnostikFall): string {
  const alter = f.patient.alter;
  const wer = alter < 1 ? 'Säugling' : alter < 18 ? `Kind, ${alter} Jahre` : 'Erwachsene';
  const mod = [...new Set(f.bildgebung.map((u) => MODALITAET[u.serie.quelle.modalitaet] ?? u.serie.quelle.modalitaet))];
  const was = mod.length ? `Labor und Bildgebung (${mod.join(', ')})` : 'Labor ohne Bildgebung';
  return `${wer} · ${was}`;
}

/** Grobe Bearbeitungsdauer in Minuten (echte Zeit, nicht Simulationszeit), auf 5 gerundet. */
export function dauerMinuten(f: DiagnostikFall): number {
  const roh = 8 + f.bildgebung.length * 5 + f.fragen.length * 2 + (f.anordnungen.length ? 3 : 0);
  return Math.max(10, Math.round(roh / 5) * 5);
}

/**
 * Ortsangabe für die Szene: die Station aus dem Fall zuerst, danach nur die Situation aus dem Raumfoto
 * (ohne dessen Fachbereich), damit z. B. ein Fall der Inneren nicht „Kardiologie“ heißt.
 */
export function ortTitel(f: DiagnostikFall): string {
  const station = f.bereich.split(',')[0].trim();
  const raum = RAEUME[f.raum];
  const teil = raum?.titel.split(' · ')[1];
  return teil ? `${station} · ${teil}` : station;
}

/** Bildbeschreibung ohne den Fachbereich des Fotos (der Fall kann auf einer anderen Station spielen). */
export function ortBeschreibung(f: DiagnostikFall): string | undefined {
  const b = RAEUME[f.raum]?.beschreibung;
  return b?.replace(/^Patientenzimmer der [A-ZÄÖÜ][\wäöüß]*( Medizin)?/, 'Patientenzimmer');
}
