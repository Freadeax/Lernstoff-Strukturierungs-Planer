import './fortschritt.css';
import { useEffect, useMemo } from 'react';
import { dauer } from '../lernplan/ui/format';
import { useFortschritt } from './daten';
import { KompetenzRadar } from './KompetenzRadar';
import { radarAchsen, schwaechsteAchse } from './radar';
import { kompetenzBereiche, serie, statusAm, woche, wochenStart, wochenZiele } from './statistik';

/** Kurzfassung auf der Startseite: Lernserie und Stand der Wochenziele. */
export function FortschrittKarte() {
  const { daten, ziele } = useFortschritt();
  const werte = useMemo(() => {
    if (!daten) return undefined;
    const s = serie(daten.fakten, daten.today);
    const zs = wochenZiele(woche(daten.fakten, wochenStart(daten.today)), ziele);
    const status = statusAm(daten.lernstand, daten.today);
    const achsen = radarAchsen(kompetenzBereiche(daten.modul), (id) => status.get(id)?.status ?? 'offen');
    return { s, zs, achsen };
  }, [daten, ziele]);
  useEffect(() => {
    // Meilensteine und Serien-Erinnerung bei jeder Datenänderung und alle 15 Minuten (Nachmittag, Tageswechsel).
    // Doppelte Meldungen verhindern die gespeicherten Merker. Nachgeladen, damit die Startseite schlank bleibt.
    if (!daten) return;
    const pruefe = () => { import('./hintergrund').then((m) => m.pruefeFortschritt(daten, ziele)).catch(() => undefined); };
    pruefe();
    const t = setInterval(pruefe, 15 * 60_000);
    return () => clearInterval(t);
  }, [daten, ziele]);
  if (!werte) return null;
  const { s, zs, achsen } = werte;
  const schwach = schwaechsteAchse(achsen);
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
      {schwach && (
        <div className="fs-karte__radar">
          <KompetenzRadar achsen={achsen} klein />
          <p className="muted">Kompetenzbereiche: am schwächsten <strong>{schwach.code}</strong> mit {schwach.jetzt} %. <a href="#/lernen/fortschritt">Radar ansehen</a></p>
        </div>
      )}
      <a className="text-link" href="#/lernen/fortschritt">Fortschritt ansehen</a>
    </section>
  );
}
