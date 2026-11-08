import { useEffect, useState } from 'react';
import { db } from '../../core/db';
import { SkriptKnopf } from '../skript/ui/SkriptKnopf';

/**
 * Vom Fehler zurück zum Stoff: das Thema mit Karteikarten wiederholen, im Skript nachlesen oder die
 * eigene Originalquelle öffnen (importierte Dokumente, die diesem Thema zugeordnet sind).
 */
export function Rueckwege({ topicId }: { topicId: string }) {
  const [docs, setDocs] = useState<Array<{ id: string; title: string }>>([]);
  useEffect(() => {
    let aktiv = true;
    db.documents.where('topicIds').equals(topicId).toArray()
      .then((d) => { if (aktiv) setDocs(d.map(({ id, title }) => ({ id, title }))); })
      .catch(() => undefined);
    return () => { aktiv = false; };
  }, [topicId]);
  return (
    <div className="fehlerheft__rueckwege" role="group" aria-label="Zurück zum Stoff">
      <a className="button-link" href={`#/lernen/karten?thema=${encodeURIComponent(topicId)}`}>Thema mit Karteikarten wiederholen</a>
      <SkriptKnopf topicId={topicId} />
      {docs.slice(0, 2).map((d) => (
        <a key={d.id} className="button-link" href={`#/material/dokumente?dokument=${encodeURIComponent(d.id)}`}>Original: {d.title}</a>
      ))}
    </div>
  );
}
