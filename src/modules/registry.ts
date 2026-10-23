import type { DomainModule } from '../core/types';
import { pflegeModule } from './pflege';

/** Alle verfügbaren Fachmodule. Ein neues Fachgebiet = ein neuer Eintrag, der Kern bleibt unverändert. */
export const modules: DomainModule[] = [pflegeModule];

export function getModule(id: string): DomainModule | undefined {
  return modules.find((m) => m.id === id);
}
