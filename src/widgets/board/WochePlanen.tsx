import './woche-planen.css';
import { useEffect, useState } from 'react';
import { ladeThemen } from '../../core/topics';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { assembleInput, heute, loadPlannerData } from '../../features/lernplan/store';
import { buildPlan, dayCapacity } from '../../features/lernplan/scheduler';
import { resolveSettings } from '../../features/lernplan/types';
import { addDays } from '../../features/lernplan/dates';
import { wochenVorschlag, type WochenVorschlag } from '../../features/lernplan/wochenVorschlag';
import { dauer } from '../../features/lernplan/ui/format';
import type { Card } from './board-model';

/**
 * Vorschlag für „Diese Woche“: lädt Prüfungen, Lernzeit und Fortschritt (wie der Lernplan) erst beim Öffnen,
 * damit das Board selbst klein bleibt. Übernommen wird nur, was angehakt ist; das Board macht es rückgängig.
 */
export default function WochePlanen({ karten, onUebernehmen, onSchliessen }: {
  karten: Card[]; onUebernehmen: (ids: string[]) => void; onSchliessen: () => void;
}) {
  const moduleId = useStore(session, (s) => s.moduleId);
  const [v, setV] = useState<WochenVorschlag | null>(null);
  const [fehler, setFehler] = useState('');
  const [wahl, setWahl] = useState<Set<string>>(new Set());

  useEffect(() => {
    let aktiv = true;
    (async () => {
      const themen = await ladeThemen(moduleId);
      const tag = heute();
      const daten = await loadPlannerData(themen, tag);
      const input = assembleInput(daten);
      const plan = buildPlan(input);
      // Direkt aus der Lernzeit, nicht aus plan.days: ohne Prüfung plant der Lernplan keine Tage.
      const settings = resolveSettings(input);
      const kapazitaet = Array.from({ length: 7 }, (_, i) => dayCapacity(input.availability, addDays(tag, i), settings)).reduce((s, m) => s + m, 0);
      const byId = new Map(themen.map((t) => [t.id, t]));
      const ergebnis = wochenVorschlag(karten.map((k) => ({
        id: k.id, name: k.name, column: k.column, wissen: k.wissen,
        restMinuten: plan.progress[k.id]?.remainingStudyMinutes ?? k.minutes,
        prerequisites: byId.get(k.id)?.prerequisites ?? [],
      })), daten.exams, tag, kapazitaet);
      if (!aktiv) return;
      setV(ergebnis);
      setWahl(new Set(ergebnis.vorschlaege.map((x) => x.id)));
    })().catch((e) => { if (aktiv) setFehler(e instanceof Error ? e.message : String(e)); });
    return () => { aktiv = false; };
  }, [karten, moduleId]);

  const umschalten = (id: string) => setWahl((w) => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const summe = v?.vorschlaege.filter((x) => wahl.has(x.id)).reduce((s, x) => s + x.minuten, 0) ?? 0;

  return (
    <section className="note board__woche" aria-labelledby="board-woche-titel">
      <h3 id="board-woche-titel">Vorschlag für diese Woche</h3>
      {fehler && <p role="alert">Vorschlag nicht möglich: {fehler}</p>}
      {!v && !fehler && <p role="status">Prüfungen und Lernzeit werden geladen …</p>}
      {v && (<>
        {v.kapazitaet > 0 && <p>
          In den nächsten 7 Tagen hast du <strong>{dauer(v.kapazitaet)}</strong> Lernzeit
          {v.belegt > 0 && <>, davon {dauer(Math.min(v.belegt, v.kapazitaet))} schon durch „Diese Woche“ und „In Arbeit“ belegt</>}.
          {' '}Zuerst kommen Themen deiner nächsten Prüfung, dann Themen, deren Voraussetzungen du schon erarbeitet hast.
        </p>}
        {v.hinweis && <p><strong>{v.hinweis}</strong>{v.kapazitaet <= 0 && <> <a href="#/lernen/plan?ansicht=zeit">Lernzeit eintragen</a></>}</p>}
        {v.vorschlaege.length > 0 && (
          <ul className="board__woche-liste">
            {v.vorschlaege.map((x) => (
              <li key={x.id}>
                <label className="check">
                  <input type="checkbox" checked={wahl.has(x.id)} onChange={() => umschalten(x.id)} />
                  <span><strong>{x.name}</strong> <span className="muted">· etwa {dauer(x.minuten)} · {x.grund}</span></span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="board__woche-aktionen">
          {v.vorschlaege.length > 0 && (
            <button type="button" className="primary small" disabled={!wahl.size} onClick={() => onUebernehmen([...wahl])}>
              {wahl.size === 1 ? '1 Thema' : `${wahl.size} Themen`} nach „Diese Woche“{summe ? ` (${dauer(summe)})` : ''}
            </button>
          )}
          <button type="button" className="small ghost" onClick={onSchliessen}>Schließen</button>
        </div>
      </>)}
    </section>
  );
}
