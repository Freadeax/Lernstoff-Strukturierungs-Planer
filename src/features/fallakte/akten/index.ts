// Alle Fallakten und ihre Teilfälle je Trainer. Die Trainer hängen die Teilfälle an ihre Fallliste an.
// Nur Daten, keine Oberfläche: wird von den Trainer-Listen importiert.
import { LINDNER, LINDNER_BARTHEL, LINDNER_BERICHT, LINDNER_BRADEN, LINDNER_EREIGNISSE, LINDNER_PLAN, LINDNER_SIS, LINDNER_UEBERGABE } from './lindner';

export const AKTEN = [LINDNER];

export const AKTEN_SIS = [LINDNER_SIS];
export const AKTEN_VIGNETTEN = [LINDNER_BRADEN, LINDNER_BARTHEL];
export const AKTEN_PLAENE = [LINDNER_PLAN];
export const AKTEN_BERICHTE = [LINDNER_BERICHT];
export const AKTEN_UEBERGABEN = [LINDNER_UEBERGABE];
export const AKTEN_EREIGNISSE = { [LINDNER_UEBERGABE.id]: LINDNER_EREIGNISSE };
