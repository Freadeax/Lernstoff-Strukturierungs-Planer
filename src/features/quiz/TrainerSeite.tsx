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
import { ladeZwischenstand, speichereZwischenstand, type Zwischenstand } from './zwischenstand';
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
  /** Weiterführende Links nach dem Prüfen. */
  weiter?: (a: Aufgabe) => Array<{ label: string; path: string }>;
}

type Stand = Record<string, { datum: string; prozent: number }>;
const MIX = 'mix';
const SCHWACH = 'schwach';

export function TrainerSeite({ titel, intro, hinweis, pfad, quelle, bereiche, aufgaben, figuren, proRunde = 8, minProThema = 3, grundlage, weiter }: Props) {
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
  // Begonnene Runde (nach Neuladen, App-Wechsel oder Abbrechen) und Nachübung falscher Aufgaben
  const [offen, setOffen] = useState<Zwischenstand | null>(() => ladeZwischenstand(quelle));
  // Neuladen mitten in der Runde (?runde=1): an derselben Stelle weitermachen
  const [fortsetzen, setFortsetzen] = useState<Zwischenstand | null>(() => (laeuft && offen?.bereich === bereichParam ? offen : null));
  const [nachuebung, setNachuebung] = useState<Aufgabe[] | null>(null);

  const roh = useMemo(() => (bereich === MIX ? alle : bereich === SCHWACH ? schwach : aufgaben[bereich] ?? []), [aufgaben, alle, schwach, bereich]);
  const pool = useMemo(() => (stufe ? roh.filter((a) => stufeVon(a) === stufe) : roh), [roh, stufe]);
  const anzahl = bereich === MIX ? proRunde + 2 : proRunde;
  // Neue Runde bei jedem Start (nr) und Bereichswechsel
  const liste = useMemo(() => runde(pool, anzahl), [pool, nr, anzahl]);
  const info = bereiche.find((b) => b.id === bereich);
  const label = info?.label ?? (bereich === SCHWACH ? 'Meine Schwachstellen' : 'Gemischte Runde');

  function weiterMachen(z: Zwischenstand) {
    setFortsetzen(z); setNachuebung(null);
    const st = z.stufe === 1 || z.stufe === 2 || z.stufe === 3 ? z.stufe : 0;
    gehe(z.bereich, true, st);
  }
  function verwerfen() { speichereZwischenstand(quelle, null); setOffen(null); }
  function zurAuswahl() { setFortsetzen(null); setNachuebung(null); setOffen(ladeZwischenstand(quelle)); gehe(bereich); }

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

      {laeuft && (liste.length || fortsetzen || nachuebung) ? (
        <Runde
          key={`${bereich}-${stufe}-${nr}${fortsetzen ? `-f${fortsetzen.rundeId}` : ''}${nachuebung ? '-n' : ''}`}
          aufgaben={nachuebung ?? liste} quelle={quelle} trainer={quelle} figuren={figuren} minProThema={minProThema} grundlage={grundlage} weiter={weiter}
          bereich={bereich} stufe={stufe} fortsetzen={fortsetzen} nachuebung={!!nachuebung || !!fortsetzen?.nachuebung}
          onFertig={fertig}
          onNeu={() => { setFortsetzen(null); setNachuebung(null); setNr((n) => n + 1); }}
          onEnde={zurAuswahl}
          onNachuebung={(falsche) => { setFortsetzen(null); setNachuebung(falsche); setNr((n) => n + 1); }}
        />
      ) : (
        <>
          {offen && (
            <div className="card qz-seite__fortsetzen" role="status">
              <div>
                <strong>Begonnene Runde fortsetzen</strong>
                <p className="muted">
                  {offen.nachuebung ? 'Nachübung' : bereiche.find((b) => b.id === offen.bereich)?.label ?? (offen.bereich === SCHWACH ? 'Meine Schwachstellen' : 'Gemischte Runde')}
                  {' · '}{offen.ergebnisse.length} von {offen.aufgaben.length} Aufgaben geprüft
                  {' · '}{offen.ergebnisse.filter((e) => e.b.richtig).length} ganz richtig
                </p>
              </div>
              <div className="row">
                <button type="button" className="primary" onClick={() => weiterMachen(offen)}>Fortsetzen</button>
                <button type="button" className="ghost" onClick={verwerfen}>Verwerfen</button>
              </div>
            </div>
          )}
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
