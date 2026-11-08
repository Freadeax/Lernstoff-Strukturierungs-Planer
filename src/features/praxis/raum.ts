// Raumelemente des Praxissimulators: Patient, Monitor, Materialwagen, Telefon.
// Jede Handlung eines Falls gehört zu genau einem Element. Die Raumansicht und die
// strukturierte Liste nutzen dieselbe Zuordnung, damit beide gleichwertig bedienbar sind.
// Die Positionen sind normierte Raumkoordinaten (Meter, Bett in der Mitte) und dienen
// später als Grundlage für eine Orbit-Kamera.

import { RESOURCES } from './catalog';
import { consciousness } from './engine';
import type { Action, Scenario, Session } from './types';

export const RAUM_ELEMENTE = ['patient', 'monitor', 'wagen', 'telefon'] as const;
export type RaumElement = typeof RAUM_ELEMENTE[number];

type ElementInfo = { label: string; kurz: string; zweck: string; pos: { x: number; y: number; z: number }; svg: { x: number; y: number } };

/** Bezeichnungen hängen vom Einsatzort ab: im Hausbesuch gibt es keinen Monitor, sondern ein Messgerät. */
export function raumElemente(scenario: Pick<Scenario, 'setting'>): Record<RaumElement, ElementInfo> {
  const r = RESOURCES[scenario.setting];
  const zuhause = r.longVisits;
  return {
    patient: { label: zuhause ? 'Patientin/Patient im Sessel' : 'Patientin/Patient im Bett', kurz: 'Patient', zweck: 'Ansehen, ansprechen, untersuchen', pos: { x: 0, y: 0.6, z: 0 }, svg: { x: 36, y: 50 } },
    monitor: { label: r.monitor ? 'Monitor und Messgeräte' : 'Messgeräte aus der Pflegetasche', kurz: r.monitor ? 'Monitor' : 'Messgeräte', zweck: 'Messen und Verlauf ablesen', pos: { x: 1.2, y: 1.4, z: -0.6 }, svg: { x: 69, y: 22 } },
    wagen: { label: zuhause ? 'Pflegetasche und Material' : 'Materialwagen', kurz: zuhause ? 'Material' : 'Materialwagen', zweck: 'Material richten, pflegerisch handeln', pos: { x: 1.6, y: 0.8, z: 0.8 }, svg: { x: 87, y: 60 } },
    telefon: { label: zuhause ? 'Diensthandy' : 'Stationstelefon', kurz: 'Telefon', zweck: 'Team, Ärztin und Diagnostik erreichen', pos: { x: -1.8, y: 1.1, z: -0.9 }, svg: { x: 13, y: 26 } },
  };
}

const MESSEN = new Set(['vitals', 'monitor', 'reassess', 'ekg', 'bga', 'orthostase']);

/** Zu welchem Raumelement eine Handlung gehört. */
export function elementVon(a: Pick<Action, 'id' | 'category'>): RaumElement {
  if (MESSEN.has(a.id)) return 'monitor';
  if (a.category === 'gespraech' || a.category === 'untersuchung') return 'patient';
  if (a.category === 'pflege' || a.category === 'geraete') return 'wagen';
  return 'telefon';
}

export function handlungenFuer(scenario: Scenario, element: RaumElement): Action[] {
  return scenario.actions.filter(a => elementVon(a) === element);
}

/**
 * Was man beim Hinsehen sofort wahrnimmt, ohne Simulationszeit zu verbrauchen.
 * Bewusst qualitativ: Zahlen gibt es erst durch Messen.
 */
export function blick(s: Session, element: RaumElement): string {
  const v = s.vitals;
  if (element === 'patient') {
    const avpu = consciousness(s);
    const teile = [
      avpu === 'A' ? 'wach und ansprechbar' : avpu === 'C' ? 'wach, aber neu verwirrt' : avpu === 'V' ? 'reagiert nur auf Ansprache' : avpu === 'P' ? 'reagiert nur auf Schmerzreiz' : 'reagiert nicht',
      v.resp >= 25 ? 'atmet sichtbar schnell und angestrengt' : v.resp >= 21 ? 'atmet etwas schneller' : 'Atmung wirkt ruhig',
      v.sys < 90 || v.spo2 < 88 ? 'Haut blass bis grau' : 'Hautfarbe unauffällig',
      v.pain >= 7 ? 'wirkt stark schmerzgeplagt' : v.pain >= 4 ? 'verzieht ab und zu das Gesicht' : '',
      s.oxygen ? 'Sauerstoff läuft' : '',
    ].filter(Boolean);
    return `Erster Blick: ${teile.join(', ')}. Zahlen liefert erst eine Messung.`;
  }
  if (element === 'monitor') {
    if (s.monitoring) return 'Der Monitor zeigt fortlaufend Werte. Die Anzeige ersetzt nicht den Blick auf die Person.';
    return RESOURCES[s.scenario.setting].monitor ? 'Der Monitor ist noch nicht angeschlossen. Ohne Messung gibt es keine aktuellen Werte.' : 'Blutdruckgerät, Pulsoximeter, Thermometer und BZ-Gerät liegen bereit. Ohne Messung gibt es keine aktuellen Werte.';
  }
  if (element === 'wagen') {
    const bereit = s.scenario.actions.filter(a => elementVon(a) === 'wagen' && s.done.includes(a.id)).map(a => a.label);
    return bereit.length ? `Bereits umgesetzt: ${bereit.join(' · ')}.` : 'Noch nichts vorbereitet. Händehygiene und Material kommen vor jeder Maßnahme.';
  }
  const offen = s.pending.length;
  const anordnung = s.flags.orders !== undefined;
  return `${s.flags.help !== undefined || s.flags.ems !== undefined ? 'Hilfe ist angefordert.' : 'Noch niemand informiert.'} ${anordnung ? 'Eine ärztliche Rückmeldung liegt vor.' : ''} ${offen ? `${offen} Auftrag/Aufträge in Bearbeitung.` : ''}`.replace(/\s+/g, ' ').trim();
}
