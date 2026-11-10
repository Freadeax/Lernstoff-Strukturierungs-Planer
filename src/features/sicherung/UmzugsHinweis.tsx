import { useState } from 'react';
import { mussUmziehen, NEUE_ADRESSE } from '../../core/hosting';
import './sicherung.css';

const MERKER = 'lernstoff.umzug.eingeklappt';

/**
 * Auf der alten Adresse: Hinweis auf die neue Adresse und wie der Lernstand mitkommt.
 * Der Browser trennt die Daten je Adresse, deshalb geht es nur über eine Sicherung.
 */
export function UmzugsHinweis() {
  const [zu, setZu] = useState(() => { try { return sessionStorage.getItem(MERKER) === '1'; } catch { return false; } });
  if (!mussUmziehen()) return null;
  const einklappen = (wert: boolean) => { setZu(wert); try { sessionStorage.setItem(MERKER, wert ? '1' : '0'); } catch { /* privater Modus */ } };
  return (
    <div className="card sicherung-hinweis umzug" role="region" aria-label="Der Planer zieht um">
      <h3>Der Lernstoff-Planer hat eine neue Adresse</h3>
      <p>Ab jetzt: <a href={NEUE_ADRESSE}><strong>{NEUE_ADRESSE.replace(/^https:\/\//, '').replace(/\/$/, '')}</strong></a>. Dort ist die App besser geschützt. Diese Adresse bekommt keine Updates mehr.</p>
      {zu ? <button type="button" className="link" onClick={() => einklappen(false)}>So nimmst du deinen Lernstand mit</button> : (
        <>
          <ol>
            <li>Hier unter <a href="#/system/sicherung">Datensicherung</a> eine Sicherung erstellen, gern mit Passwort.</li>
            <li>Die neue Adresse öffnen, auf dem iPhone oder iPad mit „Teilen → Zum Home-Bildschirm“ hinzufügen und von dort starten.</li>
            <li>Dort unter Datensicherung die Datei einspielen („Ersetzen“, wenn die neue App noch leer ist).</li>
            <li>API-Schlüssel und Zugang zu „Große Dateien“ dort neu eintragen. Die stehen aus Sicherheitsgründen nicht in der Sicherung.</li>
            <li>Erst wenn alles da ist: die alte App vom Home-Bildschirm löschen.</li>
          </ol>
          <div className="sicherung__knoepfe">
            <a className="button-link primary" href="#/system/sicherung">Sicherung erstellen</a>
            <button type="button" className="ghost" onClick={() => einklappen(true)}>Später</button>
          </div>
        </>
      )}
    </div>
  );
}
