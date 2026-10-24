import { useMemo } from 'react';
import './faecher.css';
import type { MasteryStatus } from '../core/types';
import { navigate } from '../ui/shell/router';
import { STATUS_LABEL } from './lernplan/ui/format';
import { usePlan } from './lernplan/ui/usePlan';

const REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];

/**
 * Fächer des aktiven Fachmoduls mit Wissensstand aus dem Lernplan und Sprüngen in
 * Themen, Landkarte und Duell. „Sicher“ zählt nur nach echten Abfragen.
 */
export function Faecher() {
  const { ctx, error, retry } = usePlan();
  const faecher = useMemo(() => {
    if (!ctx) return [];
    return ctx.subjects.map((s) => {
      const themen = ctx.leaves.filter((t) => t.subjectId === s.id);
      const zahl = Object.fromEntries(REIHE.map((st) => [st, 0])) as Record<MasteryStatus, number>;
      for (const t of themen) zahl[ctx.plan.progress[t.id]?.status ?? 'offen']++;
      const minuten = themen.reduce((m, t) => m + (t.estimatedMinutes ?? ctx.settings.defaultEstimatedMinutes), 0);
      return { fach: s, themen: themen.length, zahl, minuten };
    }).filter((f) => f.themen > 0);
  }, [ctx]);

  return (
    <section className="page faecher">
      <div className="page__head">
        <h2>Fächer</h2>
        <p className="muted">Wissensstand je Fach. Sicher wird ein Thema erst nach erfolgreichen Abfragen, zum Beispiel aus einem Trainer oder einer Prüfungssimulation.</p>
      </div>
      {error && <div className="note warn" role="alert">Wissensstand nicht geladen. <button type="button" className="link" onClick={retry}>Erneut versuchen</button></div>}
      {!ctx && !error && <p className="muted">Lädt …</p>}
      <div className="faecher__liste">
        {faecher.map(({ fach, themen, zahl, minuten }) => (
          <article key={fach.id} className="card faecher__fach">
            <div className="faecher__kopf">
              {fach.code && <span className="badge badge--demo">{fach.code}</span>}
              <h3>{fach.name}</h3>
            </div>
            <p className="muted">{themen} Themen · etwa {Math.round(minuten / 60)} Std. Erarbeitung</p>
            <div className="faecher__balken" role="img" aria-label={REIHE.map((st) => `${zahl[st]} ${STATUS_LABEL[st]}`).join(', ')}>
              {REIHE.map((st) => zahl[st] > 0 && <span key={st} className={`faecher__teil faecher__teil--${st}`} style={{ flexGrow: zahl[st] }} />)}
            </div>
            <ul className="faecher__legende">
              {REIHE.filter((st) => zahl[st] > 0).map((st) => (
                <li key={st}><i className={`faecher__punkt faecher__teil--${st}`} />{zahl[st]} {STATUS_LABEL[st].toLowerCase()}</li>
              ))}
            </ul>
            <div className="faecher__aktionen">
              <button type="button" className="small" onClick={() => navigate(`/lernen/themen?fach=${encodeURIComponent(fach.id)}`)}>Themen</button>
              <button type="button" className="small" onClick={() => navigate(`/lernen/landkarte?fach=${encodeURIComponent(fach.id)}`)}>Landkarte</button>
              <button type="button" className="small ghost" onClick={() => navigate(`/lernen/duell?fach=${encodeURIComponent(fach.id)}`)}>Duell</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
