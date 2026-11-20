// Schlussschritt einer Fallakte (#/lernen/dokumentation?teil=fallakte&fall=<id>&akte=<id>): späterer Verlauf, Ziele aus der
// Musterplanung einschätzen und je Ziel die passende Anpassung wählen. Offline geprüft (evaluation.ts).
import { useState } from 'react';
import { PageHeading } from '../../ui/PageHeading';
import { storage } from '../../ui/lib/store';
import { navigate } from '../../ui/shell/router';
import { AkteLeiste } from './AkteLeiste';
import { EVALUATION_KEY, pruefeEvaluation, STAND_LABEL, type Antworten, type EvalErgebnis } from './evaluation';
import type { AktenSchritt, Fallakte, ZielStand } from './typen';

const ENTWURF_KEY = 'lernstoff.fallakte.evaluation.entwuerfe';
const STAENDE: ZielStand[] = ['ja', 'teilweise', 'nein'];

function ladeEntwurf(id: string): Antworten {
  const e = storage.read<Record<string, unknown>>(ENTWURF_KEY, {})[id];
  return e && typeof e === 'object' ? (e as Antworten) : {};
}
function speichereEntwurf(id: string, a: Antworten) {
  storage.write(ENTWURF_KEY, { ...storage.read<Record<string, unknown>>(ENTWURF_KEY, {}), [id]: a });
}
function merkeBestwert(id: string, prozent: number) {
  const alle = storage.read<Record<string, unknown>>(EVALUATION_KEY, {});
  const bisher = typeof alle[id] === 'number' ? (alle[id] as number) : -1;
  if (prozent > bisher) storage.write(EVALUATION_KEY, { ...alle, [id]: prozent });
}

export function EvaluationSchritt({ akte, schritt }: { akte: Fallakte; schritt: AktenSchritt }) {
  const ev = akte.evaluation;
  const [antworten, setAntworten] = useState<Antworten>(() => ladeEntwurf(ev.id));
  const [ergebnis, setErgebnis] = useState<EvalErgebnis | null>(null);
  const aendere = (zielId: string, patch: Antworten[string]) => {
    const neu = { ...antworten, [zielId]: { ...antworten[zielId], ...patch } };
    setAntworten(neu);
    setErgebnis(null);
    speichereEntwurf(ev.id, neu);
  };
  const vorlaeufig = pruefeEvaluation(ev, antworten);
  const pruefen = () => {
    const e = pruefeEvaluation(ev, antworten);
    setErgebnis(e);
    merkeBestwert(ev.id, e.prozent);
  };
  const neu = () => { setAntworten({}); setErgebnis(null); speichereEntwurf(ev.id, {}); };

  return (
    <section className="page fallakte">
      <AkteLeiste art="evaluation" fallId={ev.id} />
      <PageHeading eyebrow="Fallakte · Evaluation" title={schritt.titel} description={`${akte.person} · ${schritt.wann}`}
        action={<button type="button" className="ghost small" onClick={() => navigate(`/lernen/dokumentation?teil=fallakte&akte=${encodeURIComponent(akte.id)}`)}>Zur Fallakte</button>} />

      <div className="card fallakte__einstieg">
        <h2>Verlauf</h2>
        {ev.verlauf.map((t) => <p key={t}>{t}</p>)}
        <p className="muted">{schritt.auftrag} Die Ziele stammen aus der Musterplanung. Geprüft wird offline: je Ziel ein Punkt für die Einschätzung und einer für die Anpassung.</p>
      </div>

      <ol className="fallakte__zeitleiste" aria-label="Ziele">
        {ev.ziele.map((z, i) => {
          const a = antworten[z.id] ?? {};
          const erg = ergebnis?.ziele.find((x) => x.zielId === z.id);
          const zustand = !erg ? '' : erg.standOk && erg.anpassungOk ? 'is-gut' : 'is-teil';
          return (
            <li key={z.id} className={`card fallakte__schritt fallakte__ziel ${zustand}`}>
              <p className="muted">Ziel {i + 1} · {z.problem}</p>
              <h3>{z.ziel}</h3>
              <fieldset className="fallakte__wahl">
                <legend>Ist das Ziel erreicht?</legend>
                <div className="fallakte__staende">
                  {STAENDE.map((s) => (
                    <button key={s} type="button" className="pill small" aria-pressed={a.stand === s} onClick={() => aendere(z.id, { stand: s })}>{STAND_LABEL[s]}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="fallakte__wahl">
                <legend>Wie schreibst du die Planung fort?</legend>
                <div className="fallakte__optionen">
                  {z.anpassungen.map((o, k) => {
                    const gewaehlt = a.anpassung === k;
                    const markierung = erg && (gewaehlt || o.richtig) ? (o.richtig ? ' is-richtig' : ' is-falsch') : '';
                    return (
                      <button key={o.text} type="button" className={`fallakte__option${markierung}`} aria-pressed={gewaehlt} onClick={() => aendere(z.id, { anpassung: k })}>
                        {o.text}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {erg && (
                <div className="fallakte__rueckmeldung" role="status">
                  <p><strong>{erg.standOk ? 'Einschätzung passt.' : `Einschätzung: ${STAND_LABEL[z.erwartet]}.`}</strong> {z.beleg}</p>
                  {z.anpassungen.map((o, k) => (a.anpassung === k || o.richtig) && (
                    <p key={o.text}><strong>{o.richtig ? 'Passende Anpassung' : 'Deine Wahl passt nicht'}:</strong> {o.warum}</p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="card fallakte__rueckblick">
        {ergebnis ? (
          <>
            <h2>Ergebnis: {ergebnis.prozent} %</h2>
            <p>{ergebnis.punkte} von {ergebnis.max} Punkten. {ev.fazit}</p>
            <div className="row">
              <button type="button" onClick={() => navigate(`/lernen/dokumentation?teil=fallakte&akte=${encodeURIComponent(akte.id)}`)}>Abschluss und Rückblick</button>
              <button type="button" className="ghost" onClick={neu}>Neu beginnen</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">{vorlaeufig.vollstaendig ? 'Alle Ziele beantwortet.' : 'Beantworte bei jedem Ziel beide Fragen.'}</p>
            <div className="row">
              <button type="button" onClick={pruefen} disabled={!vorlaeufig.vollstaendig}>Prüfen</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
