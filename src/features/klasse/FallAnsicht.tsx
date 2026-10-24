import { ART_LABEL, type KlassenFall } from './typen';
import { fristText } from './teilen';

/** Kopf und Fallmaterial, gleich für Klasse und Lehrkraft. */
export function FallAnsicht({ fall }: { fall: KlassenFall }) {
  return (
    <div className="card klasse__fall">
      <div className="klasse__kopf">
        <span className="badge badge--demo">{ART_LABEL[fall.art]}</span>
        {fall.frist && <span className="muted">Abgabe bis {fristText(fall.frist)}</span>}
      </div>
      <h3>{fall.titel}</h3>
      {fall.von && <p className="muted">Von {fall.von}</p>}
      {fall.situation.trim() && <p className="klasse__text">{fall.situation}</p>}
      {fall.material.map((m, i) => (
        <details key={i} open className="klasse__block">
          <summary>{m.titel}</summary>
          <p className="klasse__text">{m.text}</p>
        </details>
      ))}
      <p className="muted">Übungsfall. Bitte keine echten Personen- oder Patientendaten eingeben.</p>
    </div>
  );
}
