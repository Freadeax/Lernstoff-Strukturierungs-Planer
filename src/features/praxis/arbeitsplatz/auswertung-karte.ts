// Adapter: Kern-Auswertung (P5) → gemeinsame Auswertung (src/ui/sim/auswertung.ts, AuswertungsKarte).
import type { AuswertungsPunkt, SimAuswertung } from '../../../ui/sim/auswertung';
import type { KernAuswertung } from '../kern/auswertung';
import type { SimZustand } from '../kern/kern';
import { uhrzeit } from './ansicht';

export function simAuswertungNeu(z: SimZustand, a: KernAuswertung): SimAuswertung {
  const uhr = (t: number) => uhrzeit(z.fall.startUhrzeit, t);
  const punkte: AuswertungsPunkt[] = a.beitraege
    .filter((b) => b.urteil !== 'info' || b.abzug > 0)
    .map((b) => {
      const urteil = b.urteil === 'info' ? 'teilweise' : b.urteil;
      const verpasst = b.art === 'pflicht' && b.urteil === 'fehler';
      return {
        id: b.id, titel: `${b.text}${b.gewicht === 3 ? ' (kritisch)' : ''}`, urteil, warum: b.warum,
        ...(b.deine ? { deine: b.deine } : {}),
        ...(b.besser && urteil !== 'gut' ? { besser: b.besser } : {}),
        ...(b.t !== undefined ? { wann: verpasst ? `spätestens ${uhr(b.t)}` : uhr(b.t) } : verpasst ? { wann: 'bis Fallende' } : {}),
      };
    });
  return {
    quelle: 'Praxissimulator',
    ergebnis: a.ergebnis,
    punkte,
    merksaetze: z.fall.lernziele,
    grenzen: `Bewertet werden Handlungen, Zeitpunkte, Entscheidungen und deine Auswahl im Abschluss, keine Freitexte. Die Prozentwerte sind eine Lernhilfe, keine Note. Lernmodell; der Fall ist fachlich ${z.fall.freigabe.status === 'geprueft' ? 'geprüft' : 'noch nicht geprüft'}.`,
  };
}
