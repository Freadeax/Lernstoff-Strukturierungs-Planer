import { useMemo, useState } from 'react';
import './quiz.css';
import { storage } from '../../ui/lib/store';
import { logActivity } from '../../core/activity';
import { navigate, useRoute } from '../../ui/shell/router';
import { runde, type Aufgabe } from './quiz';
import { Runde, type Figur, type RundenErgebnis } from './Runde';
import type { FehlerQuelle } from '../fehlerheft/fehlerheft';
import type { TrainerId } from '../lernplan/trainer';

export interface TrainerBereich { id: string; label: string; kurz: string; wissen: string[] }

interface Props {
  titel: string;
  intro: string;
  hinweis?: string;
  pfad: string;
  quelle: FehlerQuelle & TrainerId;
  bereiche: TrainerBereich[];
  aufgaben: Record<string, Aufgabe[]>;
  figuren?: Record<string, Figur>;
  /** Aufgaben je Runde. Gemischte Runden ziehen aus allen Bereichen. */
  proRunde?: number;
  minProThema?: number;
}

type Stand = Record<string, { datum: string; prozent: number }>;
const MIX = 'mix';

export function TrainerSeite({ titel, intro, hinweis, pfad, quelle, bereiche, aufgaben, figuren, proRunde = 8, minProThema = 3 }: Props) {
  const { params } = useRoute();
  const key = `lernstoff.${quelle}.stand`;
  const [stand, setStand] = useState<Stand>(() => storage.read<Stand>(key, {}));
  const bereichParam = params.get('bereich') ?? '';
  const bereich = bereichParam === MIX || bereiche.some((b) => b.id === bereichParam) ? bereichParam : bereiche[0]!.id;
  const laeuft = params.get('runde') === '1';
  const [nr, setNr] = useState(0);

  const pool = useMemo(() => (bereich === MIX ? Object.values(aufgaben).flat() : aufgaben[bereich] ?? []), [aufgaben, bereich]);
  // Neue Runde bei jedem Start (nr) und Bereichswechsel
  const liste = useMemo(() => runde(pool, bereich === MIX ? proRunde + 2 : proRunde), [pool, nr, bereich, proRunde]);
  const info = bereiche.find((b) => b.id === bereich);
  const label = info?.label ?? 'Gemischte Runde';

  function gehe(b: string, start = false) {
    const q = new URLSearchParams({ bereich: b });
    if (start) q.set('runde', '1');
    navigate(`${pfad}?${q}`);
  }

  function fertig(e: RundenErgebnis) {
    const next = { ...stand, [bereich]: { datum: new Date().toISOString().slice(0, 10), prozent: e.prozent } };
    setStand(next); storage.write(key, next);
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 80 ? 'info' : 'warning',
      title: `${titel}: ${label}`, detail: `${e.prozent} % richtig, ${e.richtig} von ${e.anzahl} Aufgaben ganz richtig`,
    });
  }

  const karten = [...bereiche, { id: MIX, label: 'Gemischte Runde', kurz: 'Aufgaben aus allen Bereichen', wissen: [] }];

  return (
    <section className="page qz-seite">
      <div className="page__head">
        <h2>{titel}</h2>
        <p className="muted">{intro}</p>
      </div>

      {laeuft && liste.length ? (
        <Runde
          key={`${bereich}-${nr}`} aufgaben={liste} quelle={quelle} trainer={quelle} figuren={figuren} minProThema={minProThema}
          onFertig={fertig} onNeu={() => setNr((n) => n + 1)} onEnde={() => gehe(bereich)}
        />
      ) : (
        <>
          <ul className="qz-seite__bereiche" aria-label="Bereich wählen">
            {karten.map((b) => {
              const s = stand[b.id];
              const anzahl = b.id === MIX ? Object.values(aufgaben).flat().length : aufgaben[b.id]?.length ?? 0;
              return (
                <li key={b.id}>
                  <button type="button" className="card qz-seite__bereich" aria-pressed={bereich === b.id} onClick={() => gehe(b.id)}>
                    <strong>{b.label}</strong>
                    <span className="muted">{b.kurz} · {anzahl} Aufgaben</span>
                    {s ? <span className={`tag ${s.prozent >= 80 ? 'tag--wissen-sicher' : 'tag--warning'}`}>Zuletzt {s.prozent} %</span> : <span className="tag tag--info">Neu</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="card">
            <h3>{label}</h3>
            {info && info.wissen.length > 0 && (
              <details className="qz-seite__wissen">
                <summary>Kurz wiederholen, bevor es losgeht</summary>
                <ul>{info.wissen.map((w) => <li key={w}>{w}</li>)}</ul>
              </details>
            )}
            <div className="qz-seite__start">
              <button type="button" className="primary" onClick={() => { setNr((n) => n + 1); gehe(bereich, true); }}>
                Runde starten ({Math.min(pool.length, bereich === MIX ? proRunde + 2 : proRunde)} Aufgaben)
              </button>
              <span className="muted">Fehler kommen ins Fehlerheft. Ab {minProThema} Aufgaben je Thema zählt die Runde im Lernplan.</span>
            </div>
          </div>
          {hinweis && <p className="muted">{hinweis}</p>}
        </>
      )}
    </section>
  );
}
