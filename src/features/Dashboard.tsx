import { useEffect, useState } from 'react';
import { db } from '../core/db';
import { getApiKey } from '../core/settings';

type Target = 'dokumente' | 'zusammenfassen' | 'einstellungen';

export function Dashboard({ onNavigate }: { onNavigate: (v: Target) => void }) {
  const [counts, setCounts] = useState({ docs: 0, summaries: 0 });
  useEffect(() => {
    Promise.all([db.documents.count(), db.summaries.count()]).then(([docs, summaries]) => setCounts({ docs, summaries }));
  }, []);
  const hasKey = !!getApiKey();
  return (
    <section>
      <h2>Übersicht</h2>
      <div className="card">
        <h3>So startest du</h3>
        <ol className="steps">
          <li className={hasKey ? 'done' : ''}><button className="link" onClick={() => onNavigate('einstellungen')}>API-Schlüssel eintragen</button></li>
          <li className={counts.docs ? 'done' : ''}><button className="link" onClick={() => onNavigate('dokumente')}>Lernmaterial hochladen</button> ({counts.docs} Dokumente)</li>
          <li className={counts.summaries ? 'done' : ''}><button className="link" onClick={() => onNavigate('zusammenfassen')}>Originalgetreu zusammenfassen</button> ({counts.summaries} gespeichert)</li>
        </ol>
      </div>
      <ul className="roadmap">
        <li>Phase 1: Dokumente, Fächer, quellengetreue Zusammenfassungen mit Prüfung</li>
        <li>Phase 2: Prüfungskalender und Lernplan (Logik fertig, Oberfläche folgt)</li>
        <li>Phase 3: Karteikarten, Quiz, Prüfungssimulation</li>
        <li>Phase 4: Quellenvergleich, Statistik, Sprache, Synchronisierung</li>
      </ul>
    </section>
  );
}
