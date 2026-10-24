import { useEffect, useState } from 'react';
import { db } from '../../core/db';
import { leseMerker, setzeMerker } from '../../core/sicherung';
import { navigate } from '../../ui/shell/router';
import { brauchtErinnerung } from './erinnerung';
import './sicherung.css';

/**
 * Übersicht: beim ersten Start erklären, dass alles nur in diesem Browser liegt; danach
 * höchstens einmal pro Woche an eine Sicherung erinnern, sobald es echten Lernstand gibt.
 */
export function SicherungsHinweis() {
  const [art, setArt] = useState<'erststart' | 'erinnerung' | null>(null);
  useEffect(() => {
    const m = leseMerker();
    if (!m.hinweisGesehen) { setArt('erststart'); return; }
    Promise.all([db.reviewLogs.count(), db.studyLogs.count(), db.kartenLogs.count(), db.documents.count()])
      .then((z) => { if (brauchtErinnerung(m, z.reduce((a, b) => a + b, 0))) setArt('erinnerung'); })
      .catch(() => undefined);
  }, []);
  if (!art) return null;

  if (art === 'erststart') {
    const ok = () => { setzeMerker({ hinweisGesehen: true, erinnertAm: new Date().toISOString() }); setArt(null); };
    return (
      <div className="card sicherung-hinweis" role="region" aria-label="Hinweis zu deinen Daten">
        <h3>Deine Daten bleiben auf diesem Gerät</h3>
        <p>Der Lernstoff-Planer hat kein Konto und keinen Server. Alles, was du lernst und anlegst, speichert nur dieser Browser.</p>
        <ul>
          <li>Auf dem iPhone oder iPad: über „Teilen → Zum Home-Bildschirm“ hinzufügen und immer von dort öffnen.</li>
          <li>Ab und zu unter <strong>Datensicherung</strong> eine Sicherung erstellen. Damit überträgst du deinen Stand auch auf ein anderes Gerät.</li>
        </ul>
        <div className="sicherung__knoepfe">
          <button type="button" className="primary" onClick={() => { ok(); navigate('/system/sicherung'); }}>Zur Datensicherung</button>
          <button type="button" className="ghost" onClick={ok}>Verstanden</button>
        </div>
      </div>
    );
  }
  const zuletzt = leseMerker().zuletzt;
  const spaeter = () => { setzeMerker({ erinnertAm: new Date().toISOString() }); setArt(null); };
  return (
    <p className="note sicherung-hinweis" role="status">
      {zuletzt ? 'Deine letzte Sicherung ist über eine Woche alt.' : 'Du hast deinen Lernstand noch nie gesichert.'}{' '}
      <button type="button" className="link" onClick={() => { spaeter(); navigate('/system/sicherung'); }}>Jetzt sichern</button>
      {' · '}
      <button type="button" className="link" onClick={spaeter}>Später</button>
    </p>
  );
}
