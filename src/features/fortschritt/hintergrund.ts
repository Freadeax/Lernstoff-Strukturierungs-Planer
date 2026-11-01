// Wird von der Startseite nachgeladen: meldet neu erreichte Meilensteine und erinnert
// nachmittags einmal am Tag an eine gefährdete Lernserie. Läuft nur, wenn die App offen ist.

import { logActivity } from '../../core/activity';
import { dayKey } from '../../ui/lib/time';
import { notify } from '../../ui/shell/notifications';
import { alleMeilensteine, werteAus } from './auswertung';
import {
  gemeldeteMeilensteine, letzteErinnerung, meilensteineGestartet, merkeErinnerung, merkeMeilensteine, merkeMeilensteineGestartet,
  type FortschrittDaten,
} from './daten';
import { brauchtSerienErinnerung, neueMeilensteine, serie, type Ziele } from './statistik';

const heute = (jetzt: Date) => dayKey(jetzt);

export function pruefeFortschritt(d: FortschrittDaten, ziele: Ziele, jetzt = new Date()) {
  const liste = alleMeilensteine(d, werteAus(d), ziele);
  const gemeldet = gemeldeteMeilensteine();
  const neu = neueMeilensteine(liste, gemeldet);
  // Beim allerersten Lauf alles still übernehmen, was schon vorher erreicht war (auch wenn noch nichts erreicht ist):
  // gemeldet wird nur, was nach dem Start der Prüfung dazukommt.
  const ersterLauf = !meilensteineGestartet();
  if (ersterLauf) merkeMeilensteineGestartet();
  if (neu.length) {
    merkeMeilensteine([...gemeldet, ...neu.map((m) => m.id)]);
    if (!ersterLauf) {
      for (const m of neu) {
        notify('info', `Meilenstein erreicht: ${m.titel}`, m.text);
        void logActivity({ kind: 'uebung', severity: 'info', title: `Meilenstein erreicht: ${m.titel}`, detail: m.text, ref: m.id });
      }
    }
  }
  const s = serie(d.fakten, d.today);
  // formatToParts statt format: de-DE liefert „17 Uhr“, das wäre keine Zahl.
  const stunde = Number(new Intl.DateTimeFormat('de-DE', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).formatToParts(jetzt).find((p) => p.type === 'hour')?.value ?? 0);
  // Stand von gestern (Seite über Nacht offen): keine Erinnerung für einen vergangenen Tag.
  if (d.today === heute(jetzt) && brauchtSerienErinnerung(s, d.today, stunde, letzteErinnerung())) {
    merkeErinnerung(d.today);
    notify('warning', `Deine Serie: ${s.aktuell} Lerntage`, 'Heute ist noch nichts erfasst. Eine kurze Karteikarten-Runde reicht, damit sie weiterläuft.');
  }
}
