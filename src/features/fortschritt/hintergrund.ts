// Wird von der Startseite nachgeladen: meldet neu erreichte Meilensteine und erinnert
// nachmittags einmal am Tag an eine gefährdete Lernserie. Läuft nur, wenn die App offen ist.

import { logActivity } from '../../core/activity';
import { notify } from '../../ui/shell/notifications';
import { alleMeilensteine, werteAus } from './auswertung';
import { gemeldeteMeilensteine, letzteErinnerung, merkeErinnerung, merkeMeilensteine, type FortschrittDaten } from './daten';
import { brauchtSerienErinnerung, neueMeilensteine, serie, type Ziele } from './statistik';

export function pruefeFortschritt(d: FortschrittDaten, ziele: Ziele, jetzt = new Date()) {
  const liste = alleMeilensteine(d, werteAus(d), ziele);
  const gemeldet = gemeldeteMeilensteine();
  const neu = neueMeilensteine(liste, gemeldet);
  if (neu.length) {
    // Beim allerersten Lauf alles still übernehmen, was schon vorher erreicht war: sonst käme eine Flut.
    const ersterLauf = gemeldet.length === 0 && neu.length > 2;
    merkeMeilensteine([...gemeldet, ...neu.map((m) => m.id)]);
    if (!ersterLauf) {
      for (const m of neu) {
        notify('info', `Meilenstein erreicht: ${m.titel}`, m.text);
        void logActivity({ kind: 'uebung', severity: 'info', title: `Meilenstein erreicht: ${m.titel}`, detail: m.text, ref: m.id });
      }
    }
  }
  const s = serie(d.fakten, d.today);
  const stunde = Number(new Intl.DateTimeFormat('de-DE', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).format(jetzt));
  if (brauchtSerienErinnerung(s, d.today, stunde, letzteErinnerung())) {
    merkeErinnerung(d.today);
    notify('warning', `Deine Serie: ${s.aktuell} Lerntage`, 'Heute ist noch nichts erfasst. Eine kurze Karteikarten-Runde reicht, damit sie weiterläuft.');
  }
}
