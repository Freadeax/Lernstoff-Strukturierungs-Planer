import { useMemo, useState } from 'react';
import './quiz.css';
import { storage } from '../../ui/lib/store';
import { logActivity } from '../../core/activity';
import { navigate, useRoute } from '../../ui/shell/router';
import { runde, schwachstellen, stufeVon, STUFE_LABEL, type Aufgabe, type Stufe } from './quiz';
import { istOffen, ladeFehler } from '../fehlerheft/fehlerheft';
import { Runde, type Figur, type RundenErgebnis } from './Runde';
import type { FehlerQuelle } from '../fehlerheft/fehlerheft';
import type { TrainerId } from '../lernplan/trainer';
import { FachListe } from './FachText';
import type { Grundlage } from './grundlage';

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
  /** Quelle, Stand und Geltung je Aufgabe (siehe grundlage.ts). */
  grundlage?: Grundlage;
}

type Stand = Record<string, { datum: string; prozent: number }>;
const MIX = 'mix';
const SCHWACH = 'schwach';

export function TrainerSeite({ titel, intro, hinweis, pfad, quelle, bereiche, aufgaben, figuren, proRunde = 8, minProThema = 3, grundlage }: Props) {
  const { params } = useRoute();
  const key = `lernstoff.${quelle}.stand`;
  const [stand, setStand] = useState<Stand>(() => storage.read<Stand>(key, {}));
  const bereichParam = params.get('bereich') ?? '';
  const alle = useMemo(() => Object.values(aufgaben).flat(), [aufgaben]);
  const offeneIds = useMemo(() => ladeFehler().filter((f) => istOffen(f) && f.quelle === quelle).map((f) => f.id), [quelle, params]);
  const schwach = useMemo(() => schwachstellen(alle, quelle, offeneIds), [alle, quelle, offeneIds]);
  const bereich = bereichParam === MIX || (bereichParam === SCHWACH && schwach.length > 0) || bereiche.some((b) => b.id === bereichParam) ? bereichParam : bereiche[0]!.id;
  const stufeParam = Number(params.get('stufe'));
  const stufe: Stufe | 0 = stufeParam === 1 || stufeParam === 2 || stufeParam === 3 ? stufeParam : 0;
  const laeuft = params.get('runde') === '1';
  const [nr, setNr] = useState(0);

  const roh = useMemo(() => (bereich === MIX ? alle : bereich === SCHWACH ? schwach : aufgaben[bereich] ?? []), [aufgaben, alle, schwach, bereich]);
  const pool = useMemo(() => (stufe ? roh.filter((a) => stufeVon(a) === stufe) : roh), [roh, stufe]);
  const anzahl = bereich === MIX ? proRunde + 2 : proRunde;
  // Neue Runde bei jedem Start (nr) und Bereichswechsel
  const liste = useMemo(() => runde(pool, anzahl), [pool, nr, anzahl]);
  const info = bereiche.find((b) => b.id === bereich);
  const label = info?.label ?? (bereich === SCHWACH ? 'Meine Schwachstellen' : 'Gemischte Runde');

  function gehe(b: string, start = false, st: Stufe | 0 = stufe) {
    const q = new URLSearchParams({ bereich: b });
    if (st) q.set('stufe', String(st));
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

  const karten = [
    ...bereiche,
    { id: MIX, label: 'Gemischte Runde', kurz: 'Aufgaben aus allen Bereichen', wissen: [] },
    ...(schwach.length ? [{ id: SCHWACH, label: 'Meine Schwachstellen', kurz: 'Aufgaben mit offenen Fehlern', wissen: [] }] : []),
  ];
  const zaehle = (id: string) => (id === MIX ? alle.length : id === SCHWACH ? schwach.length : aufgaben[id]?.length ?? 0);
  const proStufe = ([1, 2, 3] as const).map((st) => ({ st, n: roh.filter((a) => stufeVon(a) === st).length }));

  return (
    <section className="page qz-seite">
      <div className="page__head">
        <h2>{titel}</h2>
        <p className="muted">{intro}</p>
      </div>

      {laeuft && liste.length ? (
        <Runde
          key={`${bereich}-${stufe}-${nr}`} aufgaben={liste} quelle={quelle} trainer={quelle} figuren={figuren} minProThema={minProThema} grundlage={grundlage}
          onFertig={fertig} onNeu={() => setNr((n) => n + 1)} onEnde={() => gehe(bereich)}
        />
      ) : (
        <>
          <ul className="qz-seite__bereiche" aria-label="Bereich wählen">
            {karten.map((b) => {
              const s = stand[b.id];
              const n = zaehle(b.id);
              return (
                <li key={b.id}>
                  <button type="button" className="card qz-seite__bereich" aria-pressed={bereich === b.id} onClick={() => gehe(b.id)}>
                    <strong>{b.label}</strong>
                    <span className="muted">{b.kurz} · {n} Aufgaben</span>
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
                <FachListe texte={info.wissen} />
                <p className="muted qz-seite__tipp">Unterstrichene Fachbegriffe antippen für eine Kurzdefinition.</p>
              </details>
            )}
            <div className="qz-seite__filter" role="group" aria-label="Schwierigkeit">
              <span className="muted">Schwierigkeit:</span>
              <button type="button" className="small" aria-pressed={stufe === 0} onClick={() => gehe(bereich, false, 0)}>Alle ({roh.length})</button>
              {proStufe.map(({ st, n }) => (
                <button key={st} type="button" className="small" aria-pressed={stufe === st} disabled={!n} onClick={() => gehe(bereich, false, st)}>
                  {STUFE_LABEL[st]} ({n})
                </button>
              ))}
            </div>
            <div className="qz-seite__start">
              <button type="button" className="primary" disabled={!pool.length} onClick={() => { setNr((n) => n + 1); gehe(bereich, true); }}>
                Runde starten ({Math.min(pool.length, anzahl)} Aufgaben)
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
