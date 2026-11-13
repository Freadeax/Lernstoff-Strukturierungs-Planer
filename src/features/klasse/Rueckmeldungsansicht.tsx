import { datumText } from './teilen';
import { istWahl, type KlassenFall, type Rueckmeldung } from './typen';
import { wahlText } from './wahl';

const z = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });

/** Rückmeldung der Lehrkraft: Punkte, Note und Kommentare, wenn vorhanden neben den eigenen Antworten. */
export function Rueckmeldungsansicht({ r, fall, antworten, eigenerName }: { r: Rueckmeldung; fall?: KlassenFall | null; antworten?: Record<string, string>; eigenerName?: string }) {
  const fremd = eigenerName && eigenerName.trim().toLowerCase() !== r.name.trim().toLowerCase();
  const prozent = r.max ? Math.floor(((r.punkte ?? 0) / r.max) * 1000) / 10 : null;
  return (
    <div className="card klasse__rueckmeldung">
      <div className="klasse__kopf">
        <h3>Rückmeldung{r.von ? ` von ${r.von}` : ''}</h3>
        <span className="muted">{datumText(r.bewertet)}</span>
      </div>
      {fremd && <div className="note warn" role="status">Diese Rückmeldung ist für {r.name}, nicht für {eigenerName}.</div>}
      {r.max ? (
        <p className="klasse__ergebnis">
          <strong>{z(r.punkte ?? 0)} von {z(r.max)} Punkten</strong>{prozent !== null && ` · ${z(prozent)} %`}{r.note && <> · Note <strong>{r.note}</strong></>}
        </p>
      ) : r.note ? <p className="klasse__ergebnis">Note <strong>{r.note}</strong></p> : null}
      {r.kommentar && <p className="klasse__text klasse__erwartung">{r.kommentar}</p>}
      {r.aufgaben.filter((a) => a.kommentar || a.max).map((a) => {
        const nr = r.aufgaben.indexOf(a) + 1;
        const auf = fall?.aufgaben.find((x) => x.id === a.id);
        const roh = antworten?.[a.id]?.trim();
        const meine = auf && istWahl(auf) ? wahlText(auf, roh) : roh;
        return (
          <section key={a.id} className="klasse__loesung-aufgabe">
            <h4>
              <span className="klasse__nr">{nr}</span> {auf?.frage ?? a.frage}
              {a.max ? <span className="klasse__quote">{a.punkte === undefined ? '–' : z(a.punkte)} / {z(a.max)} P.</span> : null}
            </h4>
            {meine && <details className="klasse__block"><summary>Deine Antwort</summary><p className="klasse__text">{meine}</p></details>}
            {a.kommentar && <p className="klasse__text">{a.kommentar}</p>}
          </section>
        );
      })}
      <p className="muted">Rückmeldung zum Lernen. Nicht unterschrieben, ersetzt keine offizielle Notenmitteilung.</p>
    </div>
  );
}
