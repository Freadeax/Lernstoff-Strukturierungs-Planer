import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ID, Topic } from '../../../core/types';
import { pflegeModule } from '../../../modules/pflege';
import { navigate, useRoute } from '../../../ui/shell/router';
import { notify } from '../../../ui/shell/notifications';
import { logStudy } from '../../lernplan/store';
import { uebernehme } from '../../karteikarten/store';
import { kartenAusAbschnitt } from '../karten';
import { belegText, gruppenRang, leseMinuten } from '../parser';
import { begriffe, suche } from '../suche';
import { mitOberthemen } from '../themen';
import {
  holeAusRepo, ladeLesestaende, ladeSkripte, leseDateien, loescheSkript, markiereGelesen, merkeZuletzt,
  repoEingerichtet, REPO_ORDNER, setzeThemen, uebernehmeDateien, type ImportErgebnis,
} from '../store';
import type { Abschnitt, Lesestand, Skript as SkriptT, SkriptBeleg } from '../typen';
import { PageHeading } from '../../../ui/PageHeading';
import { Markdown, type MdKontext } from './Markdown';
import './skript.css';

const topics = new Map<ID, Topic>(pflegeModule.topics.map((t) => [t.id, t]));
const blaetter = pflegeModule.topics.filter((t) => !pflegeModule.topics.some((k) => k.parentId === t.id));
const fachVon = (topicIds: ID[]) => [...new Set(topicIds.map((id) => topics.get(id)?.subjectId).filter((x): x is ID => !!x))];

const pfad = (p: Record<string, string | undefined>) => {
  const q = new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => !!e[1]));
  const s = q.toString();
  return `/lernen/skript${s ? `?${s}` : ''}`;
};

function anteil(s: SkriptT, st?: Lesestand) {
  const ids = new Set(s.abschnitte.map((a) => a.id));
  const gelesen = (st?.gelesen ?? []).filter((id) => ids.has(id)).length;
  return { gelesen, gesamt: s.abschnitte.length };
}

// ---------------------------------------------------------------- Import

function meldeImport(e: ImportErgebnis) {
  const teile = [e.neu.length && `${e.neu.length} neu`, e.aktualisiert.length && `${e.aktualisiert.length} aktualisiert`, e.unveraendert.length && `${e.unveraendert.length} unverändert`].filter(Boolean);
  if (e.fehler.length) notify('warning', 'Nicht alle Dateien übernommen', e.fehler.join(' '));
  notify('info', 'Skripte geladen', teile.join(', ') || 'Keine passenden Dateien gefunden.');
}

function ImportPanel({ onFertig, offen }: { onFertig: () => void; offen?: boolean }) {
  const [laeuft, setLaeuft] = useState(false);
  const datei = useRef<HTMLInputElement>(null);
  const repo = repoEingerichtet();
  const lauf = async (fn: () => Promise<Array<{ name: string; text: string }>>, herkunft: SkriptT['herkunft']) => {
    setLaeuft(true);
    try { meldeImport(await uebernehmeDateien(await fn(), herkunft)); onFertig(); }
    catch (e) { notify('critical', 'Laden fehlgeschlagen', e instanceof Error ? e.message : String(e)); }
    finally { setLaeuft(false); }
  };
  return (
    <details className="card sk-import" open={offen}>
      <summary>Skripte laden oder aktualisieren</summary>
      <p className="muted">
        Deine Zusammenfassungen stützen sich auf Unterrichtsmaterial und lizenzierte Bücher. Sie sind deshalb nicht in der App eingebaut,
        sondern kommen von dir: aus deinem privaten Material-Repo (Ordner <code>{REPO_ORDNER}/</code>) oder als Datei. Danach liegen sie offline auf diesem Gerät.
      </p>
      <div className="sk-import__knoepfe">
        <button type="button" className="primary" disabled={!repo || laeuft} onClick={() => lauf(() => holeAusRepo(), 'repo')}>
          {laeuft ? 'Lädt …' : 'Aus dem Material-Repo laden'}
        </button>
        <button type="button" disabled={laeuft} onClick={() => datei.current?.click()}>Dateien wählen (.md oder .zip)</button>
        <input ref={datei} type="file" accept=".md,.markdown,.txt,.zip,text/markdown,application/zip" multiple hidden
          onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) void lauf(() => leseDateien(f), 'datei'); }} />
      </div>
      {!repo && <p className="muted">Für das Material-Repo zuerst unter <a href="#/material/ablage">Material → Große Dateien</a> Repo und Token eintragen.</p>}
      <p className="muted">Gibst du die App an andere weiter, sehen sie deine Skripte nicht: Sie liegen nur auf deinen Geräten. Mit der <a href="#/system/sicherung">Datensicherung</a> nimmst du sie auf ein anderes Gerät mit.</p>
    </details>
  );
}

// ---------------------------------------------------------------- Übersicht

function Uebersicht({ skripte, staende, thema, onNeu }: { skripte: SkriptT[]; staende: Record<string, Lesestand>; thema?: string; onNeu: () => void }) {
  const [q, setQ] = useState('');
  const t = thema ? topics.get(thema) : undefined;
  const sichtbar = t ? skripte.filter((s) => mitOberthemen(s.topicIds, topics).has(t.id)) : skripte;
  const gruppen = useMemo(() => {
    const m = new Map<string, SkriptT[]>();
    for (const s of sichtbar) m.set(s.gruppe, [...(m.get(s.gruppe) ?? []), s]);
    return [...m.entries()].sort((a, b) => gruppenRang(a[0]).localeCompare(gruppenRang(b[0])))
      .map(([g, ss]) => [g, ss.sort((a, b) => a.datei.localeCompare(b.datei, 'de'))] as const);
  }, [sichtbar]);
  const treffer = useMemo(() => (q.trim().length >= 2 ? suche(skripte, q) : []), [skripte, q]);
  const weiter = skripte.map((s) => ({ s, st: staende[s.id] })).filter((x) => x.st?.zuletzt).sort((a, b) => (b.st!.geaendert).localeCompare(a.st!.geaendert))[0];

  return (
    <>
      <div className="sk-suche">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="In allen Skripten suchen, z. B. Verstehenshypothese" aria-label="In allen Skripten suchen" enterKeyHint="search" />
      </div>
      {q.trim().length >= 2 ? (
        <section className="card" aria-live="polite">
          <h3>{treffer.length ? `${treffer.length}${treffer.length === 50 ? '+' : ''} Treffer` : 'Keine Treffer'}</h3>
          <ul className="sk-treffer">
            {treffer.map((tr) => (
              <li key={`${tr.skript.id}-${tr.abschnitt.id}`}>
                <a href={`#${pfad({ id: tr.skript.id, a: tr.abschnitt.id, q })}`}>
                  <span className="sk-treffer__wo">{tr.skript.gruppe} · {tr.skript.titel}</span>
                  <strong>{tr.abschnitt.nummer ? `${tr.abschnitt.nummer} · ` : ''}{tr.abschnitt.titel}</strong>
                  <span className="muted">{tr.ausschnitt}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {t && (
            <p className="note">
              Skripte zum Thema <strong>{t.name}</strong>. <a href={`#${pfad({})}`}>Alle zeigen</a>
            </p>
          )}
          {weiter && !t && (
            <a className="card sk-weiter" href={`#${pfad({ id: weiter.s.id, a: weiter.st!.zuletzt })}`}>
              <span className="muted">Weiterlesen</span>
              <strong>{weiter.s.titel}</strong>
              <span className="muted">{weiter.s.abschnitte.find((a) => a.id === weiter.st!.zuletzt)?.titel}</span>
            </a>
          )}
          {gruppen.map(([g, ss]) => (
            <section key={g} className="sk-gruppe">
              <h3>{g}</h3>
              <ul className="sk-liste">
                {ss.map((s) => {
                  const { gelesen, gesamt } = anteil(s, staende[s.id]);
                  const min = leseMinuten(s.abschnitte.reduce((n, a) => n + a.woerter, 0));
                  return (
                    <li key={s.id}>
                      <a className="card sk-eintrag" href={`#${pfad({ id: s.id })}`}>
                        <strong>{s.titel}</strong>
                        <span className="muted">{gesamt} Abschnitte · ca. {min} Min. · {s.quellen.length} {s.quellen.length === 1 ? 'Quelle' : 'Quellen'}</span>
                        <span className="sk-fortschritt" aria-label={`${gelesen} von ${gesamt} Abschnitten gelesen`}>
                          <span style={{ width: `${gesamt ? (gelesen / gesamt) * 100 : 0}%` }} />
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {t && !sichtbar.length && <p className="muted">Zu diesem Thema ist noch kein Skript zugeordnet.</p>}
        </>
      )}
      <ImportPanel onFertig={onNeu} />
    </>
  );
}

// ---------------------------------------------------------------- Leser

function ThemenWahl({ skript, onNeu }: { skript: SkriptT; onNeu: () => void }) {
  const [neu, setNeu] = useState('');
  const setze = async (ids: ID[]) => { await setzeThemen(skript.id, ids); onNeu(); };
  return (
    <div className="sk-themen">
      <ul className="sk-chips" aria-label="Zugeordnete Themen">
        {skript.topicIds.map((id) => (
          <li key={id} className="tag">
            <a href={`#/lernen/landkarte?thema=${encodeURIComponent(id)}`}>{topics.get(id)?.name ?? id}</a>
            <button type="button" className="ghost small" aria-label={`${topics.get(id)?.name ?? id} entfernen`} onClick={() => setze(skript.topicIds.filter((x) => x !== id))}>×</button>
          </li>
        ))}
      </ul>
      <form className="sk-themen__neu" onSubmit={(e) => { e.preventDefault(); if (neu && !skript.topicIds.includes(neu)) void setze([...skript.topicIds, neu]); setNeu(''); }}>
        <select value={neu} onChange={(e) => setNeu(e.target.value)} aria-label="Thema hinzufügen">
          <option value="">Thema hinzufügen …</option>
          {blaetter.filter((t) => !skript.topicIds.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="submit" className="small" disabled={!neu}>Hinzufügen</button>
      </form>
    </div>
  );
}

/** Lesezeit des aktuellen Abschnitts: zählt nur, solange die Seite sichtbar ist. */
function useLesezeit(key: string) {
  const [sek, setSek] = useState(0);
  useEffect(() => {
    setSek(0);
    const iv = setInterval(() => { if (document.visibilityState === 'visible') setSek((s) => s + 5); }, 5000);
    return () => clearInterval(iv);
  }, [key]);
  return sek;
}

function Lernzeit({ skript, sekunden, gesamtSek }: { skript: SkriptT; sekunden: number; gesamtSek: number }) {
  const themen = skript.topicIds.map((id) => topics.get(id)).filter((t): t is Topic => !!t && blaetter.includes(t));
  const [thema, setThema] = useState(themen[0]?.id ?? '');
  const [min, setMin] = useState('');
  const vorschlag = Math.max(1, Math.round((gesamtSek || sekunden) / 60));
  if (!themen.length) return <p className="muted">Ordne oben ein Thema zu, dann kannst du die Lesezeit in den Lernplan übernehmen.</p>;
  const n = Math.round(Number(min || vorschlag));
  return (
    <form className="sk-lernzeit" onSubmit={async (e) => {
      e.preventDefault();
      const t = topics.get(thema);
      if (!t || !(n > 0)) return;
      try { await logStudy(t, n); notify('info', `${n} Min. Lernzeit gespeichert`, `${t.name}. Gelesen heißt noch nicht sicher: Frag dich danach mit Karteikarten ab.`); setMin(''); }
      catch (err) { notify('critical', 'Nicht gespeichert', err instanceof Error ? err.message : String(err)); }
    }}>
      <label>Lernzeit
        <input inputMode="numeric" value={min} placeholder={String(vorschlag)} onChange={(e) => setMin(e.target.value)} size={3} aria-label="Minuten" /> Min.
      </label>
      {themen.length > 1 && (
        <select value={thema} onChange={(e) => setThema(e.target.value)} aria-label="Für Thema">
          {themen.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      <button type="submit" className="small" disabled={!(n > 0)}>In den Lernplan</button>
    </form>
  );
}

function Leser({ skript, aId, q, staende, onNeu, setStaende }: {
  skript: SkriptT; aId?: string; q?: string; staende: Record<string, Lesestand>;
  onNeu: () => void; setStaende: (s: Record<string, Lesestand>) => void;
}) {
  const index = Math.max(0, skript.abschnitte.findIndex((a) => a.id === aId));
  const a: Abschnitt | undefined = skript.abschnitte[index];
  const st = staende[skript.id];
  const gelesen = new Set(st?.gelesen ?? []);
  const [beleg, setBeleg] = useState<SkriptBeleg[] | null>(null);
  const [gesamtSek, setGesamtSek] = useState(0);
  const sek = useLesezeit(`${skript.id}:${a?.id}`);
  const oben = useRef<HTMLDivElement>(null);
  useEffect(() => { if (a) merkeZuletzt(skript.id, a.id); setBeleg(null); oben.current?.scrollIntoView({ block: 'start' }); }, [skript.id, a?.id]);
  useEffect(() => { setGesamtSek(0); }, [skript.id]);
  useEffect(() => { if (sek) setGesamtSek((g) => g + 5); }, [sek]);

  const quellen = new Map(skript.quellen.map((x) => [x.kuerzel, x.text]));
  const k: MdKontext = { bekannte: new Set(quellen.keys()), onBeleg: setBeleg, hervorheben: q ? begriffe(q) : [] };
  const geh = (i: number) => navigate(pfad({ id: skript.id, a: skript.abschnitte[i]?.id, q }));
  const { gelesen: anzahl, gesamt } = anteil(skript, st);
  const karten = a ? kartenAusAbschnitt(skript, a, fachVon(skript.topicIds)) : [];

  const toggle = (id: string, an: boolean) => setStaende(markiereGelesen(skript.id, id, an));

  return (
    <div className="sk-leser" ref={oben}>
      <nav className="sk-toc card" aria-label="Abschnitte">
        <a className="sk-zurueck" href={`#${pfad({})}`}>← Alle Skripte</a>
        <p className="sk-toc__titel"><span className="muted">{skript.gruppe}</span><br /><strong>{skript.titel}</strong></p>
        <p className="muted">{anzahl} von {gesamt} gelesen</p>
        <ol>
          {skript.abschnitte.map((x, i) => (
            <li key={x.id} className={i === index ? 'is-current' : undefined}>
              <a href={`#${pfad({ id: skript.id, a: x.id, q })}`} aria-current={i === index ? 'page' : undefined}>
                <span className="sk-toc__haken" aria-label={gelesen.has(x.id) ? 'gelesen' : undefined}>{gelesen.has(x.id) ? '✓' : ''}</span>
                {x.nummer ? `${x.nummer} · ` : ''}{x.titel}
              </a>
            </li>
          ))}
        </ol>
        <select className="sk-toc__mobil" value={a?.id} onChange={(e) => navigate(pfad({ id: skript.id, a: e.target.value, q }))} aria-label="Abschnitt wählen">
          {skript.abschnitte.map((x) => <option key={x.id} value={x.id}>{gelesen.has(x.id) ? '✓ ' : ''}{x.nummer ? `${x.nummer} · ` : ''}{x.titel}</option>)}
        </select>
      </nav>

      <article className="sk-text">
        {index === 0 && (
          <>
            {skript.einleitung && <div className="sk-einleitung"><Markdown text={skript.einleitung} k={k} /></div>}
            <details className="sk-quellen">
              <summary>Quellen ({skript.quellen.length})</summary>
              <dl>{skript.quellen.map((x) => <div key={x.kuerzel}><dt>[{x.kuerzel}]</dt><dd>{x.text}</dd></div>)}</dl>
              <p className="muted">Seite = Seite in deinem Material, wie in der Quellenliste angegeben. ⚠ markiert Stellen, die nicht im Material stehen.</p>
            </details>
            <ThemenWahl skript={skript} onNeu={onNeu} />
          </>
        )}
        {a && (
          <section aria-labelledby="sk-abschnitt">
            <h3 id="sk-abschnitt" className="sk-abschnitt__titel">
              {a.nummer && <span className="sk-nr">{a.nummer}</span>}{a.titel}
            </h3>
            <p className="muted sk-meta">
              ca. {leseMinuten(a.woerter)} Min.
              {!!a.belege.length && ` · Belege: ${[...new Set(a.belege.map((b) => b.kuerzel))].join(', ')}`}
              {!!a.luecken && ` · ${a.luecken} ⚠ nicht belegt`}
            </p>
            <Markdown text={a.markdown} k={k} />
          </section>
        )}

        {beleg && (
          <div className="sk-belegbox" role="status">
            {beleg.map((b) => (
              <p key={belegText(b)}><strong>[{belegText(b)}]</strong> {quellen.get(b.kuerzel) ?? 'Quelle nicht in der Liste'}</p>
            ))}
            <button type="button" className="ghost small" onClick={() => setBeleg(null)} aria-label="Schließen">×</button>
          </div>
        )}

        {a && (
          <div className="sk-aktionen card">
            <label className="sk-gelesen">
              <input type="checkbox" checked={gelesen.has(a.id)} onChange={(e) => toggle(a.id, e.target.checked)} /> Abschnitt gelesen
            </label>
            <div className="sk-aktionen__knoepfe">
              <button type="button" className="small" disabled={!karten.length} onClick={async () => {
                try { await uebernehme(karten, `${skript.titel} › ${a.titel}`); notify('info', `${karten.length} Karteikarten übernommen`, 'Sie liegen jetzt bei deinen Karteikarten, mit Beleg auf der Rückseite.'); }
                catch (e) { notify('critical', 'Nicht übernommen', e instanceof Error ? e.message : String(e)); }
              }}>{karten.length ? `${karten.length} Karteikarten übernehmen` : 'Keine belegten Punkte für Karten'}</button>
              {skript.topicIds[0] && (
                <button type="button" className="small" onClick={() => navigate(`/lernen/karten?thema=${encodeURIComponent(skript.topicIds[0]!)}`)}>Mit Karteikarten abfragen</button>
              )}
            </div>
            <Lernzeit skript={skript} sekunden={sek} gesamtSek={gesamtSek} />
          </div>
        )}

        <div className="sk-blaettern">
          <button type="button" disabled={index === 0} onClick={() => geh(index - 1)}>← Zurück</button>
          <button type="button" className="primary" disabled={index >= skript.abschnitte.length - 1} onClick={() => {
            if (a && !gelesen.has(a.id)) toggle(a.id, true);
            geh(index + 1);
          }}>Weiter →</button>
        </div>

        {index === skript.abschnitte.length - 1 && (
          <p className="muted sk-ende">
            Ende des Skripts. <button type="button" className="ghost small" onClick={async () => {
              if (!confirm(`„${skript.titel}“ von diesem Gerät entfernen? Dein Lesestand geht verloren, übernommene Karteikarten bleiben.`)) return;
              await loescheSkript(skript.id); navigate(pfad({})); onNeu();
            }}>Skript von diesem Gerät entfernen</button>
          </p>
        )}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------- Seite

export default function Skript() {
  const { params } = useRoute();
  const id = params.get('id') ?? undefined;
  const [skripte, setSkripte] = useState<SkriptT[] | null>(null);
  const [staende, setStaende] = useState<Record<string, Lesestand>>(() => ladeLesestaende());
  const [fehler, setFehler] = useState<string | null>(null);
  const neuLaden = useCallback(() => {
    ladeSkripte().then(setSkripte).catch((e) => setFehler(e instanceof Error ? e.message : String(e)));
    setStaende(ladeLesestaende());
  }, []);
  useEffect(() => { neuLaden(); }, [neuLaden]);
  const skript = id ? skripte?.find((s) => s.id === id) : undefined;

  return (
    <section className="page skript">
      {!skript && (
        <PageHeading eyebrow="Lernen" title="Skript" description="Deine belegten Lernzusammenfassungen, nach Curricularen Einheiten geordnet. Jede Aussage nennt ihre Seite im Material, ⚠ markiert, was dort nicht steht. Funktioniert offline." />
      )}
      {fehler && <p className="note warn">Skripte konnten nicht geladen werden: {fehler}</p>}
      {!skripte && !fehler && <p className="muted">Lädt …</p>}
      {skripte && id && !skript && <p className="note warn">Dieses Skript liegt nicht auf diesem Gerät. <a href={`#${pfad({})}`}>Zur Übersicht</a></p>}
      {skripte && skript && (
        <Leser skript={skript} aId={params.get('a') ?? staende[skript.id]?.zuletzt} q={params.get('q') ?? undefined} staende={staende} onNeu={neuLaden} setStaende={setStaende} />
      )}
      {skripte && !id && !skripte.length && (
        <>
          <div className="state">
            <p className="state__title">Noch keine Skripte auf diesem Gerät</p>
            <p className="state__msg">Lade deine Zusammenfassungen einmal aus dem Material-Repo oder als Datei. Danach kannst du sie auch ohne Internet lesen.</p>
          </div>
          <ImportPanel onFertig={neuLaden} offen />
        </>
      )}
      {skripte && !id && !!skripte.length && <Uebersicht skripte={skripte} staende={staende} thema={params.get('thema') ?? undefined} onNeu={neuLaden} />}
    </section>
  );
}
