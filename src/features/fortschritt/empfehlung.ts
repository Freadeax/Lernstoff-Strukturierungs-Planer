// „Dein nächster Schritt“: höchstens drei konkrete Vorschläge aus dem Ist-Stand.
// Reine Funktion; jede Empfehlung nennt ihren Grund, damit sie nachvollziehbar bleibt.

import type { Exam, ID } from '../../core/types';
import { addDays, daysBetween } from '../../ui/lib/time';
import { evidenceRating } from '../lernplan/fsrs';
import type { TopicProgress } from '../lernplan/progress';
import type { BereichStand, StatReview, ZielStand } from './statistik';

export interface Empfehlung {
  id: string;
  titel: string;
  grund: string;
  aktion: string;
  pfad: string;
}

export interface EmpfehlungsEingabe {
  today: string;
  status: Map<ID, Pick<TopicProgress, 'status' | 'nextReview'>>;
  name: (id: ID) => string;
  reviewLogs: StatReview[];
  /** Wissensstand je CE. */
  ce: BereichStand[];
  exams: Exam[];
  /** Wochenziele der laufenden Woche. */
  ziele: ZielStand[];
  /** Erste passende Übung zu einem Thema (Pfad und Name), falls es eine gibt. */
  uebung: (topicId: ID) => { label: string; path: string } | undefined;
  /** CE-ID zu einer Prüfung, falls es eine CE-Prüfung ist. */
  ceVonPruefung: (examId: ID) => ID | undefined;
}

const plural = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

export function empfehlungen(e: EmpfehlungsEingabe, max = 3): Empfehlung[] {
  const out: Empfehlung[] = [];

  // 1. Fällige Wiederholungen: Wissen, das gerade verloren geht, ist am billigsten zu retten.
  const faellig = [...e.status].filter(([, p]) => p.status !== 'offen' && p.status !== 'bearbeitet' && p.nextReview && p.nextReview <= e.today);
  if (faellig.length) {
    out.push({
      id: 'wiederholen', titel: `${plural(faellig.length, 'Thema', 'Themen')} zur Wiederholung fällig`,
      grund: `Laut Lernplan jetzt abfragen, sonst sinkt die Abrufwahrscheinlichkeit${faellig.length <= 3 ? `: ${faellig.map(([id]) => e.name(id)).join(', ')}` : ''}.`,
      aktion: 'Zum Tagesplan', pfad: '/lernen/plan',
    });
  }

  // 2. Schwierigstes Thema der letzten 14 Tage (meiste nicht gelöste Abfragen, zuletzt nicht gelöst).
  const seit = addDays(e.today, -13);
  const fehl = new Map<ID, { fehl: number; letzte: number }>();
  for (const l of [...e.reviewLogs].sort((a, b) => a.date.localeCompare(b.date))) {
    const r = evidenceRating(l);
    if (r === undefined || l.date < seit || l.date > e.today) continue;
    const x = fehl.get(l.topicId) ?? { fehl: 0, letzte: 0 };
    fehl.set(l.topicId, { fehl: x.fehl + (r < 3 ? 1 : 0), letzte: r });
  }
  const schwer = [...fehl].filter(([, v]) => v.fehl > 0 && v.letzte < 3).sort((a, b) => b[1].fehl - a[1].fehl)[0];
  if (schwer) {
    const [id, v] = schwer;
    const u = e.uebung(id);
    out.push({
      id: 'schwierig', titel: `${e.name(id)} gezielt üben`,
      grund: `${plural(v.fehl, 'Abfrage', 'Abfragen')} in den letzten 14 Tagen nicht gelöst, die letzte auch nicht.`,
      aktion: u?.label ?? 'Im Fehlerheft ansehen', pfad: u?.path ?? '/lernen/fehler',
    });
  }

  // 3. CE mit der nächsten Prüfung, sonst die schwächste begonnene CE.
  const kommend = e.exams.filter((x) => x.date >= e.today && e.ceVonPruefung(x.id)).sort((a, b) => a.date.localeCompare(b.date));
  const mitPruefung = kommend.map((x) => ({ x, ce: e.ce.find((c) => c.id === e.ceVonPruefung(x.id)) })).find((p) => p.ce && p.ce.gesamt > 0 && p.ce.sicher < 1);
  if (mitPruefung?.ce) {
    const { ce, x } = mitPruefung;
    const tage = daysBetween(e.today, x.date);
    out.push({
      id: 'ce', titel: `${ce.code} vorbereiten`,
      grund: `Prüfung ${tage === 0 ? 'heute' : tage === 1 ? 'morgen' : `in ${tage} Tagen`}; ${ce.zahl.sicher} von ${ce.gesamt} Themen sicher, ${ce.zahl.offen} noch offen.`,
      aktion: 'Lernpfad öffnen', pfad: `/lernen/ce?ce=${encodeURIComponent(ce.id)}`,
    });
  } else {
    const schwach = e.ce.filter((c) => c.gesamt > 0 && c.begonnen > 0 && c.sicher < 1).sort((a, b) => a.sicher - b.sicher || a.begonnen - b.begonnen)[0];
    if (schwach) out.push({
      id: 'ce', titel: `${schwach.code} weiterführen`,
      grund: `Begonnen, aber erst ${schwach.zahl.sicher} von ${schwach.gesamt} Themen sicher.`,
      aktion: 'Lernpfad öffnen', pfad: `/lernen/ce?ce=${encodeURIComponent(schwach.id)}`,
    });
  }

  // 4. Wochenziel, das am weitesten hinter dem Wochenverlauf liegt.
  const wd = new Date(`${e.today}T12:00:00Z`).getUTCDay();
  const verstrichen = (wd === 0 ? 7 : wd) / 7;
  const rueck = e.ziele.filter((z) => !z.erreicht && z.anteil < verstrichen - 0.15).sort((a, b) => a.anteil - b.anteil)[0];
  if (rueck) {
    const rest = rueck.soll - rueck.ist;
    const ziel: Record<string, [string, string, string]> = {
      karten: [`Noch ${rest} Karteikarten diese Woche`, 'Karteikarten lernen', '/lernen/karten'],
      abfragen: [`Noch ${plural(rest, 'Abfrage', 'Abfragen')} diese Woche`, 'Zum Tagesplan', '/lernen/plan'],
      minutenProWoche: [`Noch ${rest} Min. Lernzeit diese Woche`, 'Zum Tagesplan', '/lernen/plan'],
      aktiveTage: [`Noch ${plural(rest, 'Lerntag', 'Lerntage')} diese Woche`, 'Karteikarten lernen', '/lernen/karten'],
    };
    const [titel, aktion, pfad] = ziel[rueck.id] ?? [`${rueck.label}: noch ${rest}`, 'Zum Tagesplan', '/lernen/plan'];
    out.push({ id: 'ziel', titel, grund: `Wochenziel ${rueck.label} erst zu ${Math.round(rueck.anteil * 100)} % erreicht.`, aktion, pfad });
  }

  if (!out.length) out.push({
    id: 'start', titel: 'Heute eine kleine Runde',
    grund: 'Nichts ist überfällig. Eine kurze Karteikarten-Runde hält die Serie und festigt Wissen.',
    aktion: 'Karteikarten lernen', pfad: '/lernen/karten',
  });
  return out.slice(0, max);
}
