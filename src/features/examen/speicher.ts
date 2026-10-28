// Examens-Einstellungen, Checkliste der praktischen Prüfung und Verlauf der mündlichen Übungen liegen in
// localStorage: klein, nur auf diesem Gerät, keine neue DB-Tabelle nötig. Die Datensicherung nimmt
// localStorage-Schlüssel mit dem Präfix „lernstoff.“ mit.

import { istObjekt, storage } from '../../ui/lib/store';
import type { Altersgruppe, Versorgung } from './muendlich';

const TERMINE = 'lernstoff.examen.termine';
const CHECKLISTE = 'lernstoff.examen.praktisch';
const VERLAUF = 'lernstoff.examen.muendlich';

export interface Termine {
  schriftlich: string;     // ISO-Datum des ersten Prüfungstags, '' = offen
  muendlich: string;
  praktisch: string;
  /** Altersstufe und Versorgungsbereich der praktischen Prüfung: die mündliche soll sich davon unterscheiden. */
  praktischAlter?: Altersgruppe;
  praktischVersorgung?: Versorgung;
}

export const KEINE_TERMINE: Termine = { schriftlich: '', muendlich: '', praktisch: '' };

const istDatum = (v: unknown) => v === '' || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
const istTermine = (v: unknown) => istObjekt(v) && istDatum(v.schriftlich) && istDatum(v.muendlich) && istDatum(v.praktisch);

export const ladeTermine = (): Termine => ({ ...KEINE_TERMINE, ...storage.read<Termine>(TERMINE, KEINE_TERMINE, 'local', istTermine) });
export const speichereTermine = (t: Termine) => storage.write(TERMINE, t);

export const ladeCheckliste = (): Set<string> => new Set(storage.read<string[]>(CHECKLISTE, []).filter((x) => typeof x === 'string'));
export const speichereCheckliste = (s: Set<string>) => storage.write(CHECKLISTE, [...s]);

export interface MuendlichEintrag { id: string; at: string; fallId: string; titel: string; modus: string; prozent: number; sprechzeit: number; impulse: number }
const istEintrag = (v: unknown) => istObjekt(v) && typeof v.id === 'string' && typeof v.at === 'string' && typeof v.prozent === 'number';

export const ladeMuendlich = () => storage.list<MuendlichEintrag>(VERLAUF, istEintrag);
export function ergaenzeMuendlich(e: MuendlichEintrag): MuendlichEintrag[] {
  const neu = [e, ...ladeMuendlich().filter((x) => x.id !== e.id)].slice(0, 30);
  storage.write(VERLAUF, neu);
  return neu;
}
