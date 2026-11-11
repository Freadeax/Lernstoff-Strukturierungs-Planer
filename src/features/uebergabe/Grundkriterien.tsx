// Gemeinsame Anzeige der SBAR-Grundkriterien (Übergabe, Praxis, Diagnostik, Werkbank): erst der aus
// den Fallereignissen abgeleitete Anlass, dann die sechs Kriterien mit Status.
import './grundkriterien.css';
import { grundProzent, PRIORITAET_LABEL, type GrundErgebnis, type GrundStatus, type Rufanlass } from './grundkriterien';

const ZEICHEN: Record<GrundStatus, string> = { ok: '✓', teilweise: '◐', fehlt: '✗', offen: '?' };
const STATUS_TEXT: Record<GrundStatus, string> = { ok: 'erfüllt', teilweise: 'teilweise', fehlt: 'fehlt', offen: 'nicht automatisch prüfbar' };

export function SbarGrundkriterien({ anlass, ergebnis, titel = 'SBAR-Grundkriterien' }: { anlass: Rufanlass | null; ergebnis?: GrundErgebnis[]; titel?: string }) {
  return (
    <section className="sbar-grund" aria-label={titel}>
      <h4>{titel}{ergebnis ? <span className="muted"> · {grundProzent(ergebnis)} %</span> : null}</h4>
      {anlass && (
        <dl className="sbar-grund__anlass">
          <div><dt>Rufgrund</dt><dd>{anlass.rufgrund}</dd></div>
          <div><dt>Priorität</dt><dd><span className={`sbar-grund__prio is-${anlass.prioritaet}`}>{PRIORITAET_LABEL[anlass.prioritaet]}</span></dd></div>
          <div><dt>Empfehlung</dt><dd>{anlass.empfehlung}</dd></div>
          <div><dt>Rückfrage</dt><dd>{anlass.rueckfrage}</dd></div>
        </dl>
      )}
      {anlass && <p className="muted sbar-grund__quelle">Abgeleitet aus den Fallereignissen{anlass.quellen.length > 1 ? `: ${anlass.quellen.join(' · ')}` : ''}.</p>}
      {ergebnis && (
        <ul className="sbar-grund__liste">
          {ergebnis.map((g) => (
            <li key={g.id} className={`is-${g.status}`}>
              <span aria-hidden="true">{ZEICHEN[g.status]}</span>
              <span><strong>{g.label}</strong><span className="visually-hidden">: {STATUS_TEXT[g.status]}</span> {g.text}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted sbar-grund__fuss">Gleiche Grundkriterien in Übergabe-Trainer, Praxissimulator, Diagnostik und Werkbank. Stichwortprüfung, keine Sinnprüfung.</p>
    </section>
  );
}
