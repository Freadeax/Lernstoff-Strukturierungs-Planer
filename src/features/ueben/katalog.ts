// Steckbrief je Übung für „Alle Übungen“ (Audit 11.11.2026, Abschnitt 4): Dauer, Offline-Verfügbarkeit,
// Stufe und was nach der Übung im Lernstand oder Fehlerheft landet. CE und Fach werden nicht von Hand
// gepflegt, sondern aus der Themenzuordnung der Trainer abgeleitet (uebungenFuer), damit sie nicht veralten.

import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { leafTopics } from '../lernplan/store';
import { uebungenFuer } from '../lernplan/trainer';
import { ceListe, ceThemen } from '../ce/modell';

export type Offline = 'ja' | 'teils' | 'nein';
export type Stufe = 'einstieg' | 'fortgeschritten' | 'beide';

export interface UebungsInfo {
  /** Typische Dauer einer Runde in Minuten. */
  minuten: number;
  offline: Offline;
  stufe: Stufe;
  /** Was nach der Übung im Lernstand (Lernplan) landet. Leer = nichts. */
  lernstand?: string;
  /** Was im Fehlerheft landet. Leer = nichts. */
  fehlerheft?: string;
}

const RUNDE: UebungsInfo = {
  minuten: 8, offline: 'ja', stufe: 'beide',
  lernstand: 'Ergebnis je Thema ab drei Aufgaben, der erste Versuch des Tages zählt.',
  fehlerheft: 'Jede falsch gelöste Aufgabe mit Lösung und Erklärung.',
};
const SCHREIBEN: UebungsInfo = {
  minuten: 15, offline: 'teils', stufe: 'fortgeschritten',
  lernstand: 'Ergebnis der Checkliste je Thema.',
};

export const UEBUNG_INFO: Record<string, UebungsInfo> = {
  krankheitsbilder: { ...RUNDE, minuten: 10, lernstand: 'Fallaufgaben und Detektiv-Runden: Ergebnis je Thema, erster Versuch des Tages.', fehlerheft: 'Falsch beantwortete Fallaufgaben mit Begründung.' },
  anatomie: RUNDE, arzneimittel: RUNDE, normwerte: RUNDE, hygiene: RUNDE, expertenstandards: RUNDE, recht: RUNDE, notfall: RUNDE, labor: RUNDE,
  rechnen: { ...RUNDE, minuten: 10, lernstand: 'Nur die Prüfungsrunde zählt, je Rechenthema.', fehlerheft: 'Falsche Rechnungen mit Rechenweg.' },
  duell: { ...RUNDE, minuten: 3, stufe: 'einstieg', lernstand: 'Treffer je Thema nach der Runde.', fehlerheft: 'Verwechselte Fachbegriffe.' },
  mindmap: { minuten: 15, offline: 'ja', stufe: 'beide', lernstand: 'Im Prüfen-Modus: Ergebnis je Thema.' },
  praxis: { minuten: 15, offline: 'ja', stufe: 'beide', fehlerheft: 'Fehlentscheidungen der Schicht mit Begründung.' },
  fall: { minuten: 20, offline: 'nein', stufe: 'fortgeschritten', lernstand: 'Bewertung des Falls je Thema (braucht KI-Zugang).' },
  diagnostik: { minuten: 12, offline: 'ja', stufe: 'beide', lernstand: 'Ergebnis je Fall und Thema, ein Versuch zählt einmal.', fehlerheft: 'Verpasste Kriterien mit Beleg.' },
  assessment: { ...RUNDE, minuten: 10, lernstand: 'Fälle: Ergebnis je Instrument und Thema.', fehlerheft: 'Falsch eingeschätzte Fälle.' },
  pflegeplanung: { ...SCHREIBEN, minuten: 25 }, sis: { ...SCHREIBEN, minuten: 20 }, bericht: SCHREIBEN, uebergabe: { ...SCHREIBEN, minuten: 10 },
  simulation: { minuten: 45, offline: 'teils', stufe: 'fortgeschritten', lernstand: 'Nach „Übergeben“: Ergebnis je Thema. Im Lernmodus nur als Übung.', fehlerheft: 'Falsch beantwortete Auswahl- und Rechenfragen.' },
  examen: { minuten: 5, offline: 'ja', stufe: 'beide' },
  fehler: { minuten: 5, offline: 'ja', stufe: 'beide', fehlerheft: 'Neuer Versuch: richtig gilt als wiederholt, falsch bleibt offen.' },
  hoeren: { minuten: 5, offline: 'ja', stufe: 'einstieg' },
  klasse: { minuten: 20, offline: 'teils', stufe: 'beide' },
};

export const OFFLINE_LABEL: Record<Offline, string> = { ja: 'offline', teils: 'offline, KI optional', nein: 'braucht KI' };
export const STUFE_LABEL: Record<Stufe, string> = { einstieg: 'Einstieg', fortgeschritten: 'Fortgeschritten', beide: 'Einstieg bis Fortgeschritten' };

export type DauerFilter = 'kurz' | 'mittel' | 'lang';
export const DAUER_LABEL: Record<DauerFilter, string> = { kurz: 'bis 5 min', mittel: '6 bis 15 min', lang: 'über 15 min' };
export const dauerKlasse = (min: number): DauerFilter => (min <= 5 ? 'kurz' : min <= 15 ? 'mittel' : 'lang');

export interface Zuordnung { ce: Map<string, Set<string>>; fach: Map<string, Set<string>> }

/**
 * Je Übung (Menü-ID = Trainer-ID): zu welchen CEs und Fächern sie passende Aufgaben hat.
 * Übungen ohne Themenbezug (Simulation, Examen, Fehlerheft …) stehen in keiner Zuordnung und
 * bleiben bei CE- oder Fachfilter ausgeblendet.
 */
export function zuordnung(modul: CatalogModule = modules[0] as CatalogModule): Zuordnung {
  const ce = new Map<string, Set<string>>();
  const fach = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, k: string, v: string) => { const s = m.get(k) ?? new Set(); s.add(v); m.set(k, s); };
  const trainerJeThema = new Map<string, string[]>();
  for (const t of leafTopics(modul.topics)) {
    const tr = [...new Set(uebungenFuer(t.id, modul).map((u) => u.trainer))];
    trainerJeThema.set(t.id, tr);
    for (const x of tr) if (t.subjectId) add(fach, x, t.subjectId);
  }
  for (const c of ceListe(modul)) {
    for (const th of ceThemen(modul, c)) for (const x of trainerJeThema.get(th.topic.id) ?? []) add(ce, x, c.id);
  }
  return { ce, fach };
}

export interface Filter { ce?: string; fach?: string; dauer?: DauerFilter; nurOffline?: boolean; stufe?: Exclude<Stufe, 'beide'> }

/** Passt eine Übung zum Filter? Fehlt der Steckbrief, zählt die Übung nur ohne Filter. */
export function passt(id: string, f: Filter, z: Zuordnung): boolean {
  const info = UEBUNG_INFO[id];
  const aktiv = !!(f.ce || f.fach || f.dauer || f.nurOffline || f.stufe);
  if (!info) return !aktiv;
  if (f.ce && !z.ce.get(id)?.has(f.ce)) return false;
  if (f.fach && !z.fach.get(id)?.has(f.fach)) return false;
  if (f.dauer && dauerKlasse(info.minuten) !== f.dauer) return false;
  if (f.nurOffline && info.offline === 'nein') return false;
  if (f.stufe && info.stufe !== 'beide' && info.stufe !== f.stufe) return false;
  return true;
}
