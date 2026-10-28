// Praktische Prüfung planen: Rückwärtsplan vom Prüfungstag mit Etappen und Übungen in der App.
// Die Eckdaten (Teile, Dauer, mindestens zwei Menschen) stehen im Katalog unter pruefung.staatlich.praktisch.
// Die Etappen sind ein Vorschlag zur Vorbereitung, keine Vorgabe der Schule oder der PflAPrV.

import { addDays, daysBetween, type ISODate } from '../lernplan/dates';

export interface Etappe {
  id: string;
  /** Tage vor dem Prüfungstag, an dem die Etappe spätestens erledigt sein sollte. */
  tageVorher: number;
  titel: string;
  schritte: Array<{ id: string; text: string; link?: { label: string; path: string } }>;
}

export const ETAPPEN: Etappe[] = [
  {
    id: 'rahmen', tageVorher: 56, titel: 'Rahmen klären',
    schritte: [
      { id: 'termin', text: 'Prüfungstermin, Station bzw. Einrichtung und Prüfende mit Schule und Praxisanleitung abstimmen' },
      { id: 'vertiefung', text: 'Versorgungsbereich des Vertiefungseinsatzes notieren: die Prüfungsaufgabe richtet sich danach' },
      { id: 'ablauf', text: 'Ablauf der eigenen Schule erfragen: Vorbereitungszeit, Form des Pflegeplans (schriftlich oder elektronisch), Hilfsmittel' },
    ],
  },
  {
    id: 'planung', tageVorher: 42, titel: 'Pflegeprozess sicher planen',
    schritte: [
      { id: 'pflegeplan', text: 'Zwei vollständige Pflegeplanungen zu Menschen aus dem Einsatzbereich schreiben', link: { label: 'Pflegeplanung üben', path: '/lernen/pflegeplanung' } },
      { id: 'sis', text: 'Strukturierte Informationssammlung (SIS) einmal komplett durchspielen', link: { label: 'SIS-Trainer', path: '/lernen/sis' } },
      { id: 'assessments', text: 'Häufige Einschätzungsinstrumente des Bereichs wiederholen', link: { label: 'Assessments', path: '/lernen/assessment' } },
    ],
  },
  {
    id: 'vorbehalt', tageVorher: 35, titel: 'Vorbehaltene Tätigkeiten',
    schritte: [
      { id: 'pflbg4', text: 'Vorbehaltene Tätigkeiten nach § 4 PflBG wiederholen: Pflegebedarf erheben, Pflegeprozess organisieren und steuern, Qualität analysieren und sichern' },
      { id: 'begruenden', text: 'Zu jeder geplanten Maßnahme einen Satz „weil …“ formulieren können' },
    ],
  },
  {
    id: 'fallvorstellung', tageVorher: 28, titel: 'Fallvorstellung trainieren',
    schritte: [
      { id: 'fv-zeit', text: 'Fallvorstellung laut üben und auf höchstens 20 Minuten bringen', link: { label: 'Fallvorstellung mit Zeitnahme', path: '/lernen/examen?ansicht=muendlich&modus=fallvorstellung' } },
      { id: 'uebergabe', text: 'Strukturierte Übergabe (z. B. SBAR) üben', link: { label: 'Übergabe-Trainer', path: '/lernen/uebergabe' } },
    ],
  },
  {
    id: 'durchfuehrung', tageVorher: 14, titel: 'Probedurchlauf',
    schritte: [
      { id: 'probe', text: 'Probedurchlauf mit der Praxisanleitung: mindestens zwei Menschen, davon einer mit erhöhtem Pflegebedarf, im Zeitrahmen der Prüfung' },
      { id: 'bericht', text: 'Pflegebericht zur Probe schreiben und auf wertende Sprache prüfen', link: { label: 'Pflegebericht-Trainer', path: '/lernen/bericht' } },
      { id: 'rechnen', text: 'Pflegerisches Rechnen auffrischen (Infusion, Dosierung)', link: { label: 'Rechentrainer', path: '/lernen/rechnen' } },
    ],
  },
  {
    id: 'reflexion', tageVorher: 7, titel: 'Reflexionsgespräch vorbereiten',
    schritte: [
      { id: 'refl', text: 'Reflexion des Probedurchlaufs laut üben (höchstens 20 Minuten): Was lief gut, was würdest du ändern, warum?', link: { label: 'Reflexion mit Zeitnahme', path: '/lernen/examen?ansicht=muendlich&modus=reflexion' } },
      { id: 'fehler', text: 'Offene Einträge im Fehlerheft abarbeiten', link: { label: 'Fehlerheft', path: '/lernen/fehler' } },
    ],
  },
  {
    id: 'tag', tageVorher: 1, titel: 'Am Tag davor',
    schritte: [
      { id: 'material', text: 'Dienstkleidung, Uhr mit Sekundenzeiger, Schreibzeug und Unterlagen der Schule bereitlegen' },
      { id: 'ruhe', text: 'Nichts Neues mehr lernen, früh schlafen' },
    ],
  },
];

export type EtappenStatus = 'erledigt' | 'jetzt' | 'ueberfaellig' | 'spaeter';

export interface PlanEtappe extends Etappe { faelligAm: ISODate; status: EtappenStatus; erledigt: number }

/** Etappen mit Fälligkeitsdatum und Status. Ohne Prüfungsdatum bleibt alles „später“. */
export function planePraktisch(pruefung: ISODate | '', heute: ISODate, erledigt: Set<string>): PlanEtappe[] {
  return ETAPPEN.map((e, i) => {
    const n = e.schritte.filter((s) => erledigt.has(`${e.id}.${s.id}`)).length;
    const faelligAm = pruefung ? addDays(pruefung, -e.tageVorher) : '';
    let status: EtappenStatus = 'spaeter';
    if (n === e.schritte.length) status = 'erledigt';
    else if (pruefung) {
      const vorherige = i > 0 ? addDays(pruefung, -ETAPPEN[i - 1]!.tageVorher) : '';
      if (faelligAm < heute) status = 'ueberfaellig';
      else if (!vorherige || vorherige <= heute) status = 'jetzt';
    }
    return { ...e, faelligAm, status, erledigt: n };
  });
}

/** Ganze Tage bis zum Termin (0 = heute, negativ = vorbei), oder null ohne Termin. */
export function tageBis(termin: ISODate | '', heute: ISODate): number | null {
  return termin ? daysBetween(heute, termin) : null;
}
