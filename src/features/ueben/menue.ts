// Auf welcher Menüseite ein Lernplan-Trainer liegt. Seit der Neuordnung (November 2026) teilen sich
// mehrere Trainer eine Seite: die Fachgebiete den Wissenstrainer, Rechnen und Abläufe den Fertigkeiten-Trainer,
// SIS, Assessments, Pflegeplanung, Bericht, Übergabe den Dokumentations-Trainer.
import { FACH_NAME, istFach, wissenPfad } from '../wissen/pfad';
import { fertigPfad, istUebung, UEBUNG_NAME } from '../fertigkeiten/pfad';
import { DOKU_NAME, dokuPfad, istDoku } from '../dokumentation/pfad';
import { FALLART_NAME, kurzfallPfad } from '../praxis/pfad';

export function menueSeiteVon(trainer: string): string {
  if (istFach(trainer)) return 'wissen';
  if (istUebung(trainer)) return 'fertigkeiten';
  if (istDoku(trainer)) return 'dokumentation';
  // Früherer Fallsimulator: heute die Kurzfälle im Praxissimulator.
  if (trainer === 'fall') return 'praxis';
  return trainer;
}

/** Teil einer Sammelseite (Fachgebiet oder Fertigkeit) mit Name und Adresse, sonst undefined. */
export function teilVon(trainer: string): { name: string; path: string } | undefined {
  if (istFach(trainer)) return { name: FACH_NAME[trainer], path: wissenPfad(trainer) };
  if (istUebung(trainer)) return { name: UEBUNG_NAME[trainer], path: fertigPfad(trainer) };
  if (istDoku(trainer)) return { name: DOKU_NAME[trainer], path: dokuPfad(trainer) };
  if (trainer === 'fall') return { name: FALLART_NAME.kurz, path: kurzfallPfad() };
  return undefined;
}
