import { DatenHinweis } from '../../ui/DatenHinweis';

type Diktat = { frage: boolean; aktiv: boolean; bestaetigeUndStarte: () => void; frageSchliessen: () => void };

/** Rückfrage vor dem ersten Diktat: wohin die Aufnahme geht. Erscheint, wenn `start()` sie anfordert. */
export function DiktatFrage({ diktat }: { diktat: Diktat }) {
  if (!diktat.frage || diktat.aktiv) return null;
  return (
    <div className="note" role="dialog" aria-label="Hinweis zum Diktat">
      <DatenHinweis art="diktat" className="ohne-rahmen" />
      <div className="row">
        <button type="button" className="primary" onClick={diktat.bestaetigeUndStarte}>Verstanden, Diktat starten</button>
        <button type="button" className="ghost" onClick={diktat.frageSchliessen}>Lieber tippen</button>
      </div>
    </div>
  );
}
