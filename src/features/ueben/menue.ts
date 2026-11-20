// Auf welcher Menüseite ein Lernplan-Trainer liegt. Seit der Neuordnung (November 2026) teilen sich
// mehrere Trainer eine Seite: die Fachgebiete den Wissenstrainer, Rechnen und Abläufe den Fertigkeiten-Trainer.
import { FACH_NAME, istFach, wissenPfad } from '../wissen/pfad';
import { fertigPfad, istUebung, UEBUNG_NAME } from '../fertigkeiten/pfad';

export function menueSeiteVon(trainer: string): string {
  if (istFach(trainer)) return 'wissen';
  if (istUebung(trainer)) return 'fertigkeiten';
  return trainer;
}

/** Teil einer Sammelseite (Fachgebiet oder Fertigkeit) mit Name und Adresse, sonst undefined. */
export function teilVon(trainer: string): { name: string; path: string } | undefined {
  if (istFach(trainer)) return { name: FACH_NAME[trainer], path: wissenPfad(trainer) };
  if (istUebung(trainer)) return { name: UEBUNG_NAME[trainer], path: fertigPfad(trainer) };
  return undefined;
}
