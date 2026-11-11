// Alle Übungstrainer als Fragenquelle der Prüfungssimulation. Wird von der Seite dynamisch geladen,
// damit die Aufgaben nicht im Startpaket landen.

import type { TrainerPool } from './simulation';
import { ALLE_AUFGABEN as hygiene } from '../hygiene/aufgaben';
import { ALLE_AUFGABEN as anatomie } from '../anatomie/aufgaben';
import { ALLE_AUFGABEN as expertenstandards } from '../expertenstandards/aufgaben';
import { ALLE_AUFGABEN as normwerte } from '../normwerte/aufgaben';
import { ALLE_AUFGABEN as notfall } from '../notfall/aufgaben';
import { ALLE_AUFGABEN as arzneimittel } from '../arzneimittel/aufgaben';
import { ALLE_AUFGABEN as recht } from '../recht/aufgaben';
import { ALLE_AUFGABEN as labor } from '../labortrainer/aufgaben';

export const TRAINER_POOLS: TrainerPool[] = [
  { quelle: 'hygiene', name: 'Hygiene', aufgaben: hygiene },
  { quelle: 'anatomie', name: 'Anatomie', aufgaben: anatomie },
  { quelle: 'expertenstandards', name: 'Expertenstandards', aufgaben: expertenstandards },
  { quelle: 'normwerte', name: 'Normwerte', aufgaben: normwerte },
  { quelle: 'notfall', name: 'Notfall', aufgaben: notfall },
  { quelle: 'arzneimittel', name: 'Arzneimittel', aufgaben: arzneimittel },
  { quelle: 'recht', name: 'Recht', aufgaben: recht },
  { quelle: 'labor', name: 'Labor', aufgaben: labor },
];
