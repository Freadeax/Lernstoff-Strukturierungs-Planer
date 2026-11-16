// Speicher für Einsätze und Praxistagebuch: localStorage unter lernstoff.*, damit beides in der
// Datensicherung landet. Keine Datenbank-Version nötig.

import { storage } from '../../ui/lib/store';
import { istEinsatz, type Einsatz } from './einsatz';
import { LEER, pruefeTagebuch, type Tagebuch } from './tagebuch';
import { LEER_NACHWEIS, pruefeNachweis, type Nachweis } from './nachweis';

export const EINSAETZE_KEY = 'lernstoff.einsaetze';
export const TAGEBUCH_KEY = 'lernstoff.tagebuch';
const MAX_EINSAETZE = 40;

export function ladeEinsaetze(): Einsatz[] {
  return storage.read<unknown[]>(EINSAETZE_KEY, []).filter(istEinsatz).slice(0, MAX_EINSAETZE);
}

export function speichereEinsaetze(liste: Einsatz[]): boolean {
  return storage.write(EINSAETZE_KEY, liste.length ? liste.slice(0, MAX_EINSAETZE) : null);
}

export function ladeTagebuch(): Tagebuch {
  return pruefeTagebuch(storage.read<unknown>(TAGEBUCH_KEY, LEER));
}

export function speichereTagebuch(t: Tagebuch): boolean {
  return storage.write(TAGEBUCH_KEY, t.notizen.length || t.reflexionen.length ? t : null);
}

export const NACHWEIS_KEY = 'lernstoff.nachweis';

export function ladeNachweis(): Nachweis {
  return pruefeNachweis(storage.read<unknown>(NACHWEIS_KEY, LEER_NACHWEIS));
}

export function speichereNachweis(n: Nachweis): boolean {
  return storage.write(NACHWEIS_KEY, Object.keys(n.einsaetze).length ? n : null);
}
