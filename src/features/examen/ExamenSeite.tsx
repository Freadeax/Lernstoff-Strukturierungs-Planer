import { useMemo, useState } from 'react';
import '../faecher.css';
import './examen.css';
import type { MasteryStatus } from '../../core/types';
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import { ladeFehler } from '../fehlerheft/fehlerheft';
import { uebungenFuer } from '../lernplan/trainer';
import { STATUS_LABEL } from '../lernplan/ui/format';
import { usePlan, type PlanCtx } from '../lernplan/ui/usePlan';
import { ladeVerlauf } from '../simulation/speicher';
import { Muendlich } from './Muendlich';
import { Praktisch } from './Praktisch';
import { useExamensModul } from './modul';
import {
  BAUSTELLE_UNTER, einstufung, fehlerProThema, proBereich, proTeil, radarPunkte, schwachstellen, simulationsSchwaechen,
  STABIL_AB, STATUS_GEWICHT, type Fakten, type Stand,
} from './radar';
import { ladeTermine, speichereTermine, type Termine } from './speicher';
import { tageBis } from './praktisch';

const REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];

const ANSICHTEN = [
  { id: 'ueberblick', label: 'Überblick' },
  { id: 'muendlich', label: 'Mündlich üben' },
  { id: 'praktisch', label: 'Praktisch planen' },
] as const;
type Ansicht = (typeof ANSICHTEN)[number]['id'];

const pfad = (a: Ansicht) => (a === 'ueberblick' ? '/lernen/examen' : `/lernen/examen?ansicht=${a}`);

export default function ExamenSeite() {
  const { params } = useRoute();
  const raw = params.get('ansicht');
  const ansicht: Ansicht = ANSICHTEN.some((a) => a.id === raw) ? (raw as Ansicht) : 'ueberblick';
  const [termine, setTermine] = useState<Termine>(ladeTermine);
  const aendere = (patch: Partial<Termine>) => setTermine((t) => { const n = { ...t, ...patch }; speichereTermine(n); return n; });

  return (
    <section className="page examen">
      <PageHeading eyebrow="Staatliche Prüfung" title="Examen. Gezielt statt auf gut Glück."
        description="Wo stehst du je Kompetenzbereich und Prüfungsteil? Übe die mündliche Prüfung laut und plane die praktische Prüfung rückwärts vom Termin." />
      <div className="pills" role="tablist" aria-label="Ansicht">
        {ANSICHTEN.map((a, index) => (
          <button key={a.id} id={`examen-tab-${a.id}`} type="button" role="tab" className="pill" aria-selected={ansicht === a.id} aria-controls="examen-panel" tabIndex={ansicht === a.id ? 0 : -1}
            onKeyDown={(e) => {
              const ziel = e.key === 'ArrowRight' ? (index + 1) % ANSICHTEN.length : e.key === 'ArrowLeft' ? (index + ANSICHTEN.length - 1) % ANSICHTEN.length : e.key === 'Home' ? 0 : e.key === 'End' ? ANSICHTEN.length - 1 : -1;
              if (ziel < 0) return;
              e.preventDefault();
              navigate(pfad(ANSICHTEN[ziel]!.id));
              document.getElementById(`examen-tab-${ANSICHTEN[ziel]!.id}`)?.focus();
            }}
            onClick={() => navigate(pfad(a.id))}>{a.label}</button>
        ))}
      </div>
      <div id="examen-panel" role="tabpanel" aria-labelledby={`examen-tab-${ansicht}`} tabIndex={0} className="examen__panel">
        {ansicht === 'ueberblick' && <Ueberblick termine={termine} aendere={aendere} />}
        {ansicht === 'muendlich' && <Muendlich termine={termine} aendere={aendere} />}
        {ansicht === 'praktisch' && <Praktisch termine={termine} aendere={aendere} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Termine

const TERMIN_LABEL: Array<{ key: 'schriftlich' | 'muendlich' | 'praktisch'; label: string }> = [
  { key: 'schriftlich', label: 'Schriftlich (1. Tag)' },
  { key: 'praktisch', label: 'Praktisch' },
  { key: 'muendlich', label: 'Mündlich' },
];

function countdown(tage: number | null) {
  if (tage === null) return 'Termin offen';
  if (tage < 0) return 'vorbei';
  if (tage === 0) return 'heute';
  return tage === 1 ? 'morgen' : `noch ${tage} Tage`;
}

function TerminKarte({ termine, aendere, heute }: { termine: Termine; aendere: (p: Partial<Termine>) => void; heute: string }) {
  return (
    <div className="card examen__termine">
      <h2>Deine Prüfungstermine</h2>
      <div className="examen__termin-liste">
        {TERMIN_LABEL.map(({ key, label }) => (
          <label key={key} className="field examen__termin">
            {label}
            <input type="date" value={termine[key]} onChange={(e) => aendere({ [key]: e.target.value } as Partial<Termine>)} />
            <span className="examen__countdown" aria-live="polite">{countdown(tageBis(termine[key], heute))}</span>
          </label>
        ))}
      </div>
      <p className="muted examen__klein">Nur auf diesem Gerät gespeichert. Für einen Lernplan mit Themen trägst du die Prüfung zusätzlich im <button type="button" className="link" onClick={() => navigate('/lernen/plan?ansicht=pruefungen&neu=1')}>Lernplan</button> ein.</p>
    </div>
  );
}

// ---------------------------------------------------------------- Radar

function Radar({ staende }: { staende: Stand[] }) {
  const groesse = 260, mitte = groesse / 2, radius = 92;
  const ringe = [25, 50, 75, 100];
  const achse = radarPunkte(staende.map(() => 100), radius, mitte);
  const label = radarPunkte(staende.map(() => 100), radius + 22, mitte);
  const werte = radarPunkte(staende.map((s) => s.staerke), radius, mitte);
  const beschreibung = staende.map((s) => `Bereich ${s.code}: ${s.staerke} Prozent`).join(', ');
  return (
    <svg className="examen__radar" viewBox={`0 0 ${groesse} ${groesse}`} role="img" aria-label={`Stärke je Kompetenzbereich. ${beschreibung}`}>
      {ringe.map((r) => (
        <polygon key={r} className="examen__ring" points={radarPunkte(staende.map(() => r), radius, mitte).map((p) => p.join(',')).join(' ')} />
      ))}
      {achse.map(([x, y], i) => <line key={i} className="examen__achse" x1={mitte} y1={mitte} x2={x} y2={y} />)}
      <polygon className="examen__flaeche" points={werte.map((p) => p.join(',')).join(' ')} />
      {werte.map(([x, y], i) => <circle key={i} className="examen__punkt" cx={x} cy={y} r={3.5} />)}
      {label.map(([x, y], i) => (
        <text key={i} x={x} y={y} className="examen__achsentext" textAnchor="middle" dominantBaseline="middle">{staende[i]!.code}</text>
      ))}
    </svg>
  );
}

function Balken({ zahl }: { zahl: Record<MasteryStatus, number> }) {
  return (
    <div className="faecher__balken" role="img" aria-label={REIHE.map((st) => `${zahl[st]} ${STATUS_LABEL[st]}`).join(', ')}>
      {REIHE.map((st) => zahl[st] > 0 && <span key={st} className={`faecher__teil faecher__teil--${st}`} style={{ flexGrow: zahl[st] }} />)}
    </div>
  );
}

const EINSTUFUNG_KLASSE: Record<string, string> = { stabil: 'tag--wissen-sicher', 'im Aufbau': 'tag--wissen-unsicher', baustelle: 'tag--critical' };

function useFakten(ctx?: PlanCtx): Fakten | undefined {
  return useMemo(() => {
    if (!ctx) return undefined;
    const status = new Map<string, MasteryStatus>();
    const faellig = new Set<string>();
    for (const t of ctx.leaves) {
      const p = ctx.plan.progress[t.id];
      status.set(t.id, p?.status ?? 'offen');
      if (p?.nextReview && p.nextReview <= ctx.data.today) faellig.add(t.id);
    }
    return { status, faellig, fehler: fehlerProThema(ladeFehler()), simSchwach: simulationsSchwaechen(ladeVerlauf()) };
  }, [ctx]);
}

function Ueberblick({ termine, aendere }: { termine: Termine; aendere: (p: Partial<Termine>) => void }) {
  const { ctx, error, retry } = usePlan();
  const { K, teile: TEILE } = useExamensModul();
  const fakten = useFakten(ctx);
  const bereiche = useMemo(() => (fakten ? proBereich(K, fakten) : []), [K, fakten]);
  const teile = useMemo(() => (fakten ? proTeil(K, TEILE, fakten) : []), [K, TEILE, fakten]);
  const baustellen = useMemo(() => (fakten ? schwachstellen(K, fakten) : []), [K, fakten]);
  const heute = ctx?.data.today ?? new Date().toISOString().slice(0, 10);
  const name = (id: string) => ctx?.topics.get(id)?.name ?? K.topics.get(id)?.name ?? id;
  const schwaechster = [...bereiche].filter((b) => b.themen).sort((a, b) => a.staerke - b.staerke)[0];

  return (
    <div className="stack-3">
      <TerminKarte termine={termine} aendere={aendere} heute={heute} />
      {error && <p className="note warn">Lernstand konnte nicht geladen werden: {error.message} <button type="button" className="small" onClick={retry}>Erneut versuchen</button></p>}
      {!ctx && !error && <p className="muted" role="status">Lernstand wird geladen …</p>}
      {ctx && fakten && (<>
        <div className="card examen__radar-karte">
          <div className="examen__radar-kopf">
            <h2>Schwächen-Radar</h2>
            <p className="muted">Stärke je Kompetenzbereich aus deinen echten Abfragen im Lernplan. Je weiter außen, desto sicherer.</p>
          </div>
          <div className="examen__radar-inhalt">
            <Radar staende={bereiche} />
            <ul className="examen__bereiche" aria-label="Kompetenzbereiche">
              {bereiche.map((b) => (
                <li key={b.id}>
                  <div className="examen__bereich-kopf">
                    <strong>{b.code}</strong>
                    <span className="examen__bereich-name">{b.name}</span>
                    <span className={`tag ${EINSTUFUNG_KLASSE[einstufung(b.staerke)]}`}>{b.themen ? `${b.staerke} % · ${einstufung(b.staerke)}` : 'keine Themen'}</span>
                  </div>
                  {b.themen > 0 && <Balken zahl={b.zahl} />}
                  <p className="muted examen__klein">
                    {b.themen} Themen{b.fehler ? ` · ${b.fehler} offene Fehler` : ''}{b.simSchwach ? ` · ${b.simSchwach}× schwach in Simulationen` : ''}
                    {' · '}<button type="button" className="link" onClick={() => navigate(`/lernen/simulation?kb=${encodeURIComponent(b.id)}`)}>Probeprüfung zu {b.code}</button>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          {bereiche.every((b) => b.staerke === 0) && (
            <p className="note">Noch keine Abfragen im Lernplan: das Radar startet bei null. Mach eine <button type="button" className="link" onClick={() => navigate('/lernen/simulation')}>Prüfungssimulation</button> oder frag Themen mit Karteikarten und Fällen ab, dann füllt es sich.</p>
          )}
          {schwaechster && bereiche.some((b) => b.staerke > 0) && schwaechster.staerke < STABIL_AB && (
            <p className="note">Größte Baustelle: <strong>Bereich {schwaechster.code}</strong> ({schwaechster.staerke} %). <button type="button" className="small" onClick={() => navigate(`/lernen/simulation?kb=${encodeURIComponent(schwaechster.id)}`)}>Gezielt üben</button></p>
          )}
        </div>

        <section className="examen__abschnitt" aria-labelledby="examen-teile">
          <h2 id="examen-teile">Bereit für die einzelnen Prüfungsteile?</h2>
          <div className="examen__teile">
            {teile.map((s) => (
              <article key={s.id} className="card examen__teil">
                <div className="examen__teil-kopf">
                  <span className="badge badge--demo">{s.code}</span>
                  <span className={`tag ${EINSTUFUNG_KLASSE[einstufung(s.staerke)]}`}>{s.themen ? `${s.staerke} %` : '–'}</span>
                </div>
                <h3>{s.name}</h3>
                <p className="muted examen__klein">{s.teil.minuten ? `${s.teil.minuten} Minuten · ` : ''}{s.themen} Themen · Bereiche {[...new Set(s.teil.kompetenzen.map((c) => K.kbOberbereich.get(c) ?? c))].map((c) => c.replace('kb.', '')).join(', ')}</p>
                {s.themen > 0 && <Balken zahl={s.zahl} />}
                <div className="faecher__aktionen">
                  {s.teil.art === 'schriftlich' && <button type="button" className="small" onClick={() => navigate(`/lernen/simulation?kb=${encodeURIComponent([...new Set(s.teil.kompetenzen.map((c) => K.kbOberbereich.get(c) ?? c))].join(','))}`)}>Probeklausur</button>}
                  {s.teil.art === 'muendlich' && <button type="button" className="small" onClick={() => navigate(pfad('muendlich'))}>Mündlich üben</button>}
                  {s.teil.art === 'praktisch' && <button type="button" className="small" onClick={() => navigate(pfad('praktisch'))}>Vorbereitung planen</button>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card examen__abschnitt" aria-labelledby="examen-baustellen">
          <h2 id="examen-baustellen">Als Nächstes angehen</h2>
          {baustellen.length ? (
            <ol className="examen__baustellen">
              {baustellen.map((b) => (
                <li key={b.topicId}>
                  <div><strong>{name(b.topicId)}</strong><span className="muted"> · {STATUS_LABEL[fakten.status.get(b.topicId) ?? 'offen']}</span></div>
                  <p className="muted examen__klein">{b.gruende.join(' · ')}</p>
                  <div className="faecher__aktionen">
                    {uebungenFuer(b.topicId).slice(0, 3).map((u) => <button key={u.path} type="button" className="small ghost" onClick={() => navigate(u.path)}>{u.label}</button>)}
                    {fakten.fehler.get(b.topicId) ? <button type="button" className="small ghost" onClick={() => navigate('/lernen/fehler')}>Fehlerheft</button> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Noch keine Schwachstellen erkennbar. Sobald du Themen abfragst, Fehler sammelst oder eine Prüfungssimulation machst, erscheinen hier die dringendsten Themen.</p>
          )}
        </section>

        <details className="examen__methode">
          <summary>Wie wird gerechnet?</summary>
          <p>Jedes lernbare Thema zählt bei allen Kompetenzbereichen, die es im Katalog hat (auch von Oberthemen geerbt). Stärke = Mittel über die Themen: sicher {STATUS_GEWICHT.sicher * 100} %, unsicher {STATUS_GEWICHT.unsicher * 100} %, bearbeitet {STATUS_GEWICHT.bearbeitet * 100} %, offen 0 %. Ab {STABIL_AB} % gilt ein Bereich als stabil, unter {BAUSTELLE_UNTER} % als Baustelle.</p>
          <p>„Als Nächstes“ zählt offene Fehler aus dem Fehlerheft, schwache Themen der Prüfungssimulationen der letzten 60 Tage, unsichere und fällige Themen. Selbsteinschätzungen und gelesene Skripte heben die Stärke nicht.</p>
          <p>Die Zuordnung der Themen zu Kompetenzbereichen ist eine fachliche Einschätzung des Katalogs. Die Prüfungsteile stammen aus der PflAPrV (§§ 14–16), wie im Katalog hinterlegt.</p>
        </details>
      </>)}
    </div>
  );
}
