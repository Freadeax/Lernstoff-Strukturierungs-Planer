// Adapter Blutentnahme-Station → einheitliche Zustandskomponenten (src/ui/sim/zustand.ts, Audit SIM-07).
// Zeigt nur, was am Bett sichtbar ist: Stau, Kanüle, Röhrchen im Halter und im Ständer. Bewertet
// nichts vorab (keine Reihenfolge, keine Identitätsprüfung als „richtig“), das kommt im Befund.
import { ROEHRCHEN } from '../../../ui/sim/labor/praeanalytik';
import type { AufgabeEintrag, SimZustand, ZustandEintrag } from '../../../ui/sim/zustand';
import { VERWURF, type EntnahmeEingabe, type EntnahmeSzenario, type Platz } from './entnahme';

export type EntnahmeSchritt = 'identitaet' | 'arm' | 'stau' | 'roehrchen' | 'abschluss' | 'ergebnis';
export const ENTNAHME_SCHRITTE: EntnahmeSchritt[] = ['identitaet', 'arm', 'stau', 'roehrchen', 'abschluss', 'ergebnis'];
const SCHRITT_TITEL: Record<EntnahmeSchritt, string> = {
  identitaet: 'Identität sichern', arm: 'Arm auswählen', stau: 'Stauen und punktieren',
  roehrchen: 'Röhrchen füllen', abschluss: 'Mischen und Transport', ergebnis: 'Befund ansehen',
};
/** Ab dieser Stauzeit warnt auch die Stationsanzeige. */
export const STAU_WARN_SEK = 60;

export interface EntnahmeStand {
  sz: EntnahmeSzenario; schritt: EntnahmeSchritt;
  identitaet?: EntnahmeEingabe['identitaet']; arm?: 'links' | 'rechts';
  stauSek: number; stauAngelegt: boolean; stauGeloest: boolean;
  regal: Platz[]; folge: Platz[]; aktiv?: { platz: Platz; stand: number };
  mischen?: EntnahmeEingabe['mischen']; transport?: EntnahmeEingabe['transport'];
}

const name = (p: Platz) => (p === VERWURF ? 'Verwurfröhrchen' : ROEHRCHEN[p].name);
const IDENT: Record<EntnahmeEingabe['identitaet'], string> = { offen: 'offen erfragt, Armband angesehen', geschlossen: 'mit Ja/Nein-Frage bestätigt', keine: 'nicht erfragt' };

export function entnahmeZustand(z: EntnahmeStand): SimZustand {
  const { sz } = z;
  const patient: ZustandEintrag[] = [
    { id: 'person', label: sz.patient.anrede, wert: `geb. ${sz.patient.geburt}`, stufe: 'normal' },
    { id: 'identitaet', label: 'Identität', wert: z.identitaet ? IDENT[z.identitaet] : 'noch nicht geklärt', stufe: z.identitaet ? 'normal' : 'aus' },
    { id: 'arm', label: 'Arm', wert: z.arm ? `${z.arm}${sz.infusion === z.arm ? ', hier läuft die Infusion' : ''}` : 'noch nicht gewählt', stufe: z.arm ? 'normal' : 'aus' },
  ];
  if (sz.infusion) patient.push({ id: 'infusion', label: 'Infusion', wert: `läuft am ${sz.infusion === 'links' ? 'linken' : 'rechten'} Arm`, stufe: 'normal' });

  const stauWert = !z.stauAngelegt ? 'nicht angelegt' : z.stauGeloest ? `gelöst nach ${z.stauSek} s` : `liegt seit ${z.stauSek} s`;
  const stauLiegt = z.stauAngelegt && !z.stauGeloest;
  const geraete: ZustandEintrag[] = [
    { id: 'stau', label: 'Stauschlauch', wert: stauWert, stufe: stauLiegt ? (z.stauSek > STAU_WARN_SEK ? 'achtung' : 'normal') : 'aus' },
    { id: 'kanuele', label: sz.fluegel ? 'Flügelkanüle' : 'Kanüle', wert: z.schritt === 'roehrchen' ? 'liegt in der Vene' : ['abschluss', 'ergebnis'].includes(z.schritt) ? 'entfernt, abgedrückt' : 'noch nicht punktiert', stufe: z.schritt === 'roehrchen' ? 'normal' : 'aus' },
    { id: 'halter', label: 'Halter', wert: z.aktiv ? `${name(z.aktiv.platz)}, ${Math.round(z.aktiv.stand * 100)} %` : 'leer', stufe: z.aktiv ? 'normal' : 'aus' },
  ];

  const material: ZustandEintrag[] = z.regal.map((p) => {
    const nr = z.folge.indexOf(p);
    return { id: `roehrchen:${p}`, label: name(p), wert: nr >= 0 ? `gefüllt als ${nr + 1}.` : z.aktiv?.platz === p ? 'im Halter' : 'im Ständer', stufe: nr >= 0 || z.aktiv?.platz === p ? 'normal' : 'aus' };
  });
  if (z.mischen) material.push({ id: 'mischen', label: 'Gemischt', wert: z.mischen === 'schwenken' ? 'sanft geschwenkt' : 'geschüttelt', stufe: 'normal' });
  if (z.transport) material.push({ id: 'transport', label: 'Transport', wert: z.transport === 'sofort' ? 'Rohrpost sofort' : 'Sammelrunde in 3 Stunden', stufe: 'normal' });

  const alarme: ZustandEintrag[] = [];
  if (stauLiegt && z.stauSek > STAU_WARN_SEK) alarme.push({ id: 'stau', label: 'Stau liegt', wert: `${z.stauSek} s`, stufe: 'achtung' });

  const jetzt = ENTNAHME_SCHRITTE.indexOf(z.schritt);
  const gefuellt = z.folge.filter((p) => p !== VERWURF).length;
  const benoetigt = z.regal.filter((p) => p !== VERWURF).length;
  const aufgaben: AufgabeEintrag[] = ENTNAHME_SCHRITTE.map((s, i) => ({
    id: s, titel: SCHRITT_TITEL[s],
    status: i < jetzt || (s === 'ergebnis' && z.schritt === 'ergebnis') ? 'erledigt' : 'offen',
    ...(s === 'roehrchen' && jetzt >= i ? { hinweis: `${gefuellt} von ${benoetigt} gefüllt` } : {}),
  }));
  return { patient, geraete, material, alarme, aufgaben };
}
