import './fortschritt.css';
import { useEffect, useMemo } from 'react';
import { dauer } from '../lernplan/ui/format';
import { useFortschritt } from './daten';
import { serie, woche, wochenStart, wochenZiele } from './statistik';

let geprueft = false;

/** Kurzfassung auf der Startseite: Lernserie und Stand der Wochenziele. */
export function FortschrittKarte() {
  const { daten, ziele } = useFortschritt();
  const werte = useMemo(() => {
    if (!daten) return undefined;
    const s = serie(daten.fakten, daten.today);
    const zs = wochenZiele(woche(daten.fakten, wochenStart(daten.today)), ziele);
    return { s, zs };
  }, [daten, ziele]);
  useEffect(() => {
    // Meilensteine und Serien-Erinnerung einmal je App-Start, nachgeladen, damit die Startseite schlank bleibt.
    if (!daten || geprueft) return;
    geprueft = true;
    import('./hintergrund').then((m) => m.pruefeFortschritt(daten, ziele)).catch(() => undefined);
  }, [daten, ziele]);
  if (!werte) return null;
  const { s, zs } = werte;
  const erreicht = zs.filter((z) => z.erreicht).length;
  const zeit = zs.find((z) => z.id === 'minutenProWoche');
  return (
    <section className="card fs-karte" aria-labelledby="fs-karte-titel">
      <div>
        <p className="eyebrow" id="fs-karte-titel">Dein Fortschritt</p>
        <p><strong>{s.aktuell} {s.aktuell === 1 ? 'Lerntag' : 'Lerntage'} in Folge</strong>{s.gefaehrdet ? ' · heute noch lernen, dann läuft sie weiter' : s.heuteAktiv ? ' · heute erledigt' : ''}</p>
      </div>
      <div className="fs-karte__ziele">
        <p className="muted">Woche: {erreicht} von {zs.length} Zielen{zeit ? `, ${dauer(zeit.ist)} von ${dauer(zeit.soll)} Lernzeit` : ''}</p>
        {zeit && <div className="fs-balken" role="progressbar" aria-label="Lernzeit diese Woche" aria-valuemin={0} aria-valuemax={zeit.soll} aria-valuenow={Math.min(zeit.ist, zeit.soll)}><span style={{ width: `${Math.round(zeit.anteil * 100)}%` }} /></div>}
      </div>
      <a className="text-link" href="#/lernen/fortschritt">Fortschritt ansehen</a>
    </section>
  );
}
