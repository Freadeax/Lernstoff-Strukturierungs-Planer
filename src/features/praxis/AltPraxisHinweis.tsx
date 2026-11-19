// Hinweis in Übergabe, Pflegebericht und Pflegeplanung, wenn ein Weitergabe-Link noch auf eine Sitzung des
// entfernten alten Praxissimulators zeigt (P10). Statt ins Leere führt er zum Nachfolgefall im neuen Arbeitsplatz.
import { altSitzung } from './altfaelle';

export function AltPraxisHinweis({ sitzung }: { sitzung: string }) {
  const alt = altSitzung(sitzung);
  if (!alt) return <p className="note warn">Der Praxisfall ist auf diesem Gerät nicht mehr gespeichert. Wähle einen Übungsfall oder spiel den Fall erneut.</p>;
  return <p className="note warn">„{alt.titel.replace(/[„“]/g, '')}“ lief im bisherigen Praxissimulator, den der neue Arbeitsplatz ersetzt hat. Die Sitzung lässt sich hier nicht mehr übernehmen.{' '}
    {alt.neu ? <a href={`#/lernen/praxis?neu=${encodeURIComponent(alt.neu)}`}>Den Nachfolgefall spielen</a> : <a href="#/lernen/praxis">Zur Fallauswahl</a>}. In dessen Auswertung geht es wieder zu Übergabe, Pflegebericht und Pflegeplanung.</p>;
}
