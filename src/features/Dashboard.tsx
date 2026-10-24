import { useEffect, useState } from 'react';
import { db } from '../core/db';
import { getApiKey } from '../core/settings';
import { WidgetGrid } from '../ui/widget/Dashboard';
import { FilterBar } from '../widgets/filter/FilterBar';
import { WIDGETS } from '../widgets/registry';
import { navigate } from '../ui/shell/router';
import { HeuteKarte } from './lernplan/ui/HeuteKarte';

function ErsteSchritte() {
  const [counts, setCounts] = useState<{ docs: number; summaries: number } | null>(null);
  useEffect(() => {
    Promise.all([db.documents.count(), db.summaries.count()]).then(([docs, summaries]) => setCounts({ docs, summaries }));
  }, []);
  const hasKey = !!getApiKey();
  if (!counts || (hasKey && counts.docs && counts.summaries)) return null;
  return (
    <div className="card onboarding">
      <h3>So startest du</h3>
      <ol className="steps">
        <li className={hasKey ? 'done' : ''}><button className="link" onClick={() => navigate('/einstellungen')}>API-Schlüssel eintragen</button></li>
        <li className={counts.docs ? 'done' : ''}><button className="link" onClick={() => navigate('/material/import')}>Lernmaterial importieren</button> ({counts.docs} Dokumente)</li>
        <li className={counts.summaries ? 'done' : ''}><button className="link" onClick={() => navigate('/material/zusammenfassen')}>Originalgetreu zusammenfassen</button> ({counts.summaries} gespeichert)</li>
      </ol>
    </div>
  );
}

export function Dashboard() {
  return (
    <section className="page">
      <div className="page__head">
        <h2>Übersicht</h2>
      </div>
      <ErsteSchritte />
      <HeuteKarte />
      <FilterBar />
      <WidgetGrid widgets={[WIDGETS.kpi, WIDGETS.charts, WIDGETS.feed]} />
    </section>
  );
}
