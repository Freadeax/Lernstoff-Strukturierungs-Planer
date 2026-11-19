// Grundsystem G3: Haut, Mobilität und Sturz (Lernmodell, didaktisch gerundet, fachlich ungeprüft; lokale Vorgaben gehen vor).
// Rein und deterministisch. Dekubitus nach dem Druck-mal-Zeit-Modell der Lernseite (organe.ts → haut()),
// Sturzrisiko als Liste von Gründen aus dem Modellzustand (DNQP Expertenstandard Sturzprophylaxe: Risikofaktoren
// erkennen statt Punktwert). Beides ersetzt keine Einschätzung am Menschen.
//
// - Treiber `immobil` { druckMmHg, scherkraefte?, feucht? }: Auflagedruck an der belasteten Stelle.
// - Grundgröße `druckLast` (mmHg·h über Kapillardruck): steigt unter Druck, Minderdurchblutung (MAP < 65) und
//   Flüssigkeitsmangel beschleunigen; ohne Druck erholt sich das Gewebe (−40 je Stunde).
//   Positionieren/Mobilisieren entlastet (Katalog: Wirkkurve druckLast faktor 0 = neue Auflagestelle).
// - Grundgröße `dekubitusKat` 0–4: höchste erreichte Kategorie, geht im Fall nicht zurück.

import type { AktiverTreiber, Grundgroessen, Treiber } from '../typen';
import { dekubitusKategorie, hautVerstaerker, KAPILLARDRUCK, klemme, type Kategorie } from './organe';

/** Erholung des Gewebes ohne Druck, mmHg·h je Stunde */
export const HAUT_ERHOLUNG_PRO_STUNDE = 40;

/** Zuwachs der Druckbelastung je Stunde (mmHg über Kapillardruck × Verstärker × Durchblutung). */
export function druckRate(druckMmHg: number, scherkraefte: boolean | undefined, feucht: boolean | undefined, map: number, hydratation: number): number {
  const durchblutung = (map < 65 ? 1 + klemme((65 - map) / 25, 0, 1) * 0.6 : 1) * (hydratation < 0.85 ? 1.2 : 1);
  return Math.max(0, druckMmHg - KAPILLARDRUCK) * hautVerstaerker(scherkraefte, feucht) * durchblutung;
}

/** Ein Schritt Haut: neue Druckbelastung und Kategorie (oder undefined, wenn der Fall Haut nicht führt). */
export function hautSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, map: number): Pick<Grundgroessen, 'druckLast' | 'dekubitusKat'> | undefined {
  const immobil = treiber.find((t): t is Extract<Treiber, { art: 'immobil' }> => t.art === 'immobil');
  if (!immobil && alt.druckLast === undefined) return undefined;
  const std = dt / 3600;
  const last0 = alt.druckLast ?? 0;
  const rate = immobil ? druckRate(immobil.druckMmHg, immobil.scherkraefte, immobil.feucht, map, alt.hydratation) : 0;
  const druckLast = rate > 0 ? last0 + rate * std : Math.max(0, last0 - HAUT_ERHOLUNG_PRO_STUNDE * std);
  const dekubitusKat = Math.max(alt.dekubitusKat ?? 0, dekubitusKategorie(druckLast)) as Kategorie;
  return { druckLast, dekubitusKat };
}

export type SturzStufe = 'gering' | 'erhöht' | 'hoch';
export interface Sturzrisiko { stufe: SturzStufe; gruende: string[] }

/** Werte, die das Sturzrisiko aus dem Zustand braucht (aus Pflegemodell/Wirkstoffen). */
export interface SturzEingabe {
  hochbetagt: boolean;
  /** Blutdruck systolisch und Schwindel beim Aufstehen (Befinden) */
  rrSys: number;
  schwindel: boolean;
  /** zentral dämpfende Wirkstoffe (Sedierung + Opioid aus G1) */
  sedierung: number;
  /** zusätzliche Diurese ml/h (Harndrang) */
  diureseMlH: number;
  immobil: boolean;
}

/** Sturzrisiko mit Gründen; „hoch“ ab drei Gründen oder bei Delir/Bewusstseinsstörung mit Aufstehdrang. */
export function sturzrisiko(g: Grundgroessen, e: SturzEingabe): Sturzrisiko {
  const gruende: string[] = [];
  if (e.hochbetagt) gruende.push('hohes Alter');
  if (g.delir > 0.35 || g.orientierung < 0.6) gruende.push('Verwirrtheit/Delir: schätzt Gefahren nicht ein');
  if (g.unruhe > 0.4 && g.vigilanz > 0.5) gruende.push('Unruhe mit Aufstehdrang');
  if (g.vigilanz < 0.8) gruende.push('Bewusstsein eingetrübt');
  if (e.schwindel || e.rrSys < 100) gruende.push('Kreislauf: Schwindel beim Aufstehen (Volumenmangel, niedriger Blutdruck)');
  if (e.sedierung > 0.1) gruende.push('Medikamente mit Sedierung (Benzodiazepine, Opioide)');
  if (e.diureseMlH > 50 || (g.blaseMl ?? 0) > 300) gruende.push('Harndrang (Diuretikum, volle Blase): eiliges Aufstehen');
  if (g.blutzucker < 70) gruende.push('Unterzuckerung');
  if (g.schmerz >= 5) gruende.push('starke Schmerzen');
  if (g.temperatur >= 38.5) gruende.push('Fieber, Schwäche');
  if (e.immobil) gruende.push('eingeschränkte Mobilität');
  const schwer = gruende.some((x) => x.startsWith('Verwirrtheit') || x.startsWith('Bewusstsein'));
  const stufe: SturzStufe = gruende.length >= 3 || (schwer && gruende.length >= 2) ? 'hoch' : gruende.length >= 1 ? 'erhöht' : 'gering';
  return { stufe, gruende };
}

/** Steckt ein Immobilitäts-Treiber in der Liste? */
export const istImmobil = (treiber: readonly AktiverTreiber[] | readonly Treiber[]) => treiber.some((t) => t.art === 'immobil');
