import type { DomainModule } from '../core/types';
import { ladePflegeVoll, pflegeModule } from './pflege';

/** Alle verfügbaren Fachmodule. Ein neues Fachgebiet = ein neuer Eintrag, der Kern bleibt unverändert. */
export const modules: DomainModule[] = [pflegeModule];

export function getModule(id: string): DomainModule | undefined {
  return modules.find((m) => m.id === id);
}

/** Nachladen der großen Listen je Fachmodul (Glossar, Steckbriefe); neue Fachmodule tragen sich hier ein. */
const NACHLADEN: (() => Promise<void>)[] = [ladePflegeVoll];

let bereit: Promise<void> | undefined;
/**
 * Erfüllt, sobald alle Fachmodule vollständig sind. Immer dasselbe Versprechen (für React `use`),
 * nach einem Fehler (z. B. offline ohne Zwischenspeicher) beim nächsten Aufruf ein neuer Versuch.
 */
export function fachmodulBereit(): Promise<void> {
  bereit ??= Promise.all(NACHLADEN.map((f) => f())).then(() => undefined).catch((e: unknown) => { bereit = undefined; throw e; });
  return bereit;
}
