import { useMemo, useState } from 'react';
import { notiereFehler } from '../fehlerheft/fehlerheft';
import { ausKrankheitsbild } from '../fehlerheft/quellen';
import './krankheitsbilder.css';
import { logActivity } from '../../core/activity';
import type { DiseaseProfile, DiseaseSection } from '../../modules/catalog-types';
import { pflegeModule } from '../../modules/pflege';
import { navigate, useRoute } from '../../ui/shell/router';
import { proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import { FAELLE, type Fallaufgabe } from './faelle';
import {
  ABSCHNITTE, ASSESSMENT_GRUPPE, belegeFuer, belegQuote, bewerteFall, faelleZuThema, MIN_PRO_THEMA, mischung, passtZurSuche, vollstaendig,
  type Antworten, type FallErgebnis,
} from './bewertung';

const ERLEDIGT_KEY = 'lernstoff.krankheitsbilder.erledigt';

type Ansicht = 'steckbriefe' | 'faelle';
type Erledigt = Record<string, { datum: string; prozent: number }>;

function ladeErledigt(): Erledigt {
  try { return (JSON.parse(localStorage.getItem(ERLEDIGT_KEY) ?? 'null') as Erledigt) ?? {}; } catch { return {}; }
}
function speichereErledigt(e: Erledigt) {
  try { localStorage.setItem(ERLEDIGT_KEY, JSON.stringify(e)); } catch { /* privater Modus */ }
}

const PROFILE = pflegeModule.diseaseProfiles ?? [];
const PROFIL = new Map(PROFILE.map((p) => [p.id, p]));
const DRUGS = new Map((pflegeModule.drugProfiles ?? []).map((d) => [d.id, d]));
const REFS = new Map((pflegeModule.references ?? []).map((r) => [r.id, r]));
const THEMEN = new Map(pflegeModule.topics.map((t) => [t.id, t]));

function gehe(p: { ansicht?: Ansicht; kb?: string; fall?: string; thema?: string }) {
  const q = new URLSearchParams();
  if (p.ansicht && p.ansicht !== 'steckbriefe') q.set('ansicht', p.ansicht);
  if (p.kb) q.set('kb', p.kb);
  if (p.fall) q.set('fall', p.fall);
  if (p.thema) q.set('thema', p.thema);
  const s = q.toString();
  navigate(`/lernen/krankheitsbilder${s ? `?${s}` : ''}`);
}

// ---------------------------------------------------------------- Belegstatus

function Beleg({ p, abschnitt }: { p: DiseaseProfile; abschnitt: DiseaseSection }) {
  const belege = belegeFuer(p, abschnitt);
  if (!belege.length) return <span className="tag tag--warning kb__beleg" title="Übliches Lehrbuchwissen, noch nicht mit deinem Unterricht abgeglichen">ungeprüft</span>;
  return (
    <span className="tag tag--wissen-sicher kb__beleg" title="Vollständig aus deinem Unterrichtsmaterial">
      Unterricht: {belege.map((b) => `${b.quelle}, ${b.seiten}`).join(' · ')}
    </span>
  );
}

function Abschnitt({ p, id, label }: { p: DiseaseProfile; id: DiseaseSection; label: string }) {
  if (id === 'definition') {
    return (
      <section className="kb__abschnitt">
        <div className="kb__abschnitt-kopf"><h3>{label}</h3><Beleg p={p} abschnitt={id} /></div>
        <p>{p.definition}</p>
      </section>
    );
  }
  if (id === 'prophylaxen') {
    if (!p.prophylaxen?.length) return null;
    return (
      <section className="kb__abschnitt">
        <div className="kb__abschnitt-kopf"><h3>{label}</h3><Beleg p={p} abschnitt={id} /></div>
        <ul className="kb__liste">
          {p.prophylaxen.map((x) => (
            <li key={x.topicId}><strong>{THEMEN.get(x.topicId)?.name ?? x.topicId}:</strong> {x.grund}</li>
          ))}
        </ul>
      </section>
    );
  }
  const punkte = p[id];
  if (!punkte?.length) return null;
  return (
    <section className="kb__abschnitt">
      <div className="kb__abschnitt-kopf"><h3>{label}</h3><Beleg p={p} abschnitt={id} /></div>
      <ul className="kb__liste">{punkte.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
}

// ---------------------------------------------------------------- Steckbriefe

function Liste({ erledigt }: { erledigt: Erledigt }) {
  const [suche, setSuche] = useState('');
  const treffer = useMemo(() => PROFILE.filter((p) => passtZurSuche(p, suche)), [suche]);
  return (
    <div className="stack-2">
      <label className="field kb__suche">Krankheitsbild, Synonym oder Symptom
        <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="z. B. Apoplex, Ödeme, Atemnot" />
      </label>
      <ul className="kb__karten">
        {treffer.map((p) => {
          const q = belegQuote(p);
          const faelle = FAELLE.filter((f) => f.krankheitId === p.id);
          const geloest = faelle.filter((f) => erledigt[f.id]).length;
          return (
            <li key={p.id}>
              <button type="button" className="card kb__karte" onClick={() => gehe({ kb: p.id })}>
                <strong>{p.name}</strong>
                {!!p.synonyms?.length && <span className="muted">{p.synonyms.join(', ')}</span>}
                <span className="kb__karte-tags">
                  {q.belegt ? <span className="tag tag--wissen-sicher">{q.belegt}/{q.gesamt} Abschnitte belegt</span> : <span className="tag tag--warning">ungeprüft</span>}
                  {!!faelle.length && <span className="tag">{geloest}/{faelle.length} {faelle.length === 1 ? 'Fall' : 'Fälle'}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!treffer.length && <p className="muted">Kein Krankheitsbild gefunden.</p>}
    </div>
  );
}

function Verknuepfungen({ p }: { p: DiseaseProfile }) {
  const drugs = (p.drugIds ?? []).map((id) => DRUGS.get(id)).filter((d) => !!d);
  const assessments = (p.assessmentIds ?? []).map((id) => REFS.get(id)).filter((r) => !!r);
  const standards = (p.referenceIds ?? []).map((id) => REFS.get(id)).filter((r) => !!r);
  const themen = [...new Set([...p.topicIds, ...(p.prophylaxen ?? []).map((x) => x.topicId)])];
  const faelle = FAELLE.filter((f) => f.krankheitId === p.id);
  return (
    <aside className="card kb__seite">
      {!!faelle.length && (
        <section>
          <h3>Fallaufgaben</h3>
          <div className="stack-1">
            {faelle.map((f) => <button key={f.id} type="button" className="primary small" onClick={() => gehe({ ansicht: 'faelle', fall: f.id })}>{f.titel}</button>)}
          </div>
        </section>
      )}
      {!!drugs.length && (
        <section>
          <h3>Medikamente</h3>
          <ul className="kb__links">
            {drugs.map((d) => (
              <li key={d.id}>
                <button type="button" className="link" onClick={() => navigate(`/lernen/karten?ansicht=steckbriefe&q=${encodeURIComponent(d.substance)}`)}>{d.substance}</button>
                <span className="muted"> {d.drugClass}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!!assessments.length && (
        <section>
          <h3>Assessments</h3>
          <ul className="kb__links">
            {assessments.map((a) => {
              const gruppe = ASSESSMENT_GRUPPE[a.id];
              return (
                <li key={a.id}>
                  {gruppe
                    ? <button type="button" className="link" onClick={() => navigate(`/lernen/assessment?gruppe=${gruppe}&modus=faelle`)}>{a.name}</button>
                    : <span>{a.name}</span>}
                  {a.details && <span className="muted"> {a.details}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {!!standards.length && (
        <section>
          <h3>Expertenstandards</h3>
          <ul className="kb__links">{standards.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
        </section>
      )}
      <section>
        <h3>Katalogthemen</h3>
        <ul className="kb__links">
          {themen.map((t) => (
            <li key={t}><button type="button" className="link" onClick={() => navigate(`/lernen/themen?thema=${encodeURIComponent(t)}`)}>{THEMEN.get(t)?.name ?? t}</button></li>
          ))}
        </ul>
      </section>
      <p className="muted kb__klein">Verknüpfungen sind eine Zuordnung des Katalogs, kein Beleg.</p>
    </aside>
  );
}

function Steckbrief({ p }: { p: DiseaseProfile }) {
  return (
    <div className="kb__layout">
      <article className="card kb__steckbrief">
        <div className="kb__kopf">
          <button type="button" className="ghost small" onClick={() => gehe({})}>← Alle Krankheitsbilder</button>
        </div>
        <h2 className="kb__titel">{p.name}</h2>
        {!!p.synonyms?.length && <p className="muted">{p.synonyms.join(' · ')}</p>}
        {ABSCHNITTE.map((a) => <Abschnitt key={a.id} p={p} id={a.id} label={a.label} />)}
        {p.merksatz && <p className="note">Merksatz: {p.merksatz}</p>}
        <div className="row">
          <button type="button" className="primary small" onClick={() => navigate(`/lernen/karten?krankheit=${encodeURIComponent(p.id)}`)}>Mit Karteikarten lernen</button>
        </div>
      </article>
      <Verknuepfungen p={p} />
    </div>
  );
}

// ---------------------------------------------------------------- Fallaufgaben

function FallListe({ thema, erledigt }: { thema?: string; erledigt: Erledigt }) {
  const liste = thema ? faelleZuThema(thema, FAELLE, pflegeModule) : FAELLE;
  return (
    <div className="stack-2">
      <p className="muted">Lies den Fall und beantworte alle Aufgaben. Danach siehst du die Lösung mit Erklärung und Beleg. Je Thema zählt im Lernplan der erste Fall des Tages.</p>
      {thema && (
        <p className="note">
          Fälle zum Thema „{THEMEN.get(thema)?.name ?? thema}“.{' '}
          <button type="button" className="link" onClick={() => gehe({ ansicht: 'faelle' })}>Alle Fälle zeigen</button>
        </p>
      )}
      <ul className="kb__karten">
        {liste.map((f) => {
          const e = erledigt[f.id];
          return (
            <li key={f.id}>
              <button type="button" className="card kb__karte" onClick={() => gehe({ ansicht: 'faelle', fall: f.id, thema })}>
                <strong>{f.titel}</strong>
                <span className="muted">{PROFIL.get(f.krankheitId)?.name} · {f.setting}</span>
                <span className="kb__karte-tags">
                  <span className="tag">{f.aufgaben.length} Aufgaben</span>
                  {e ? <span className={`tag ${e.prozent >= 85 ? 'tag--wissen-sicher' : 'tag--warning'}`}>Zuletzt {e.prozent} %</span> : <span className="tag tag--info">Neu</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!liste.length && <p className="muted">Zu diesem Thema gibt es noch keine Fallaufgabe.</p>}
    </div>
  );
}

function Fall({ fall, onFertig, onZurueck, onWeiter }: {
  fall: Fallaufgabe; onFertig: (f: Fallaufgabe, e: FallErgebnis) => void; onZurueck: () => void; onWeiter?: () => void;
}) {
  const p = PROFIL.get(fall.krankheitId);
  const [antworten, setAntworten] = useState<Antworten>({});
  const [ergebnis, setErgebnis] = useState<FallErgebnis | null>(null);
  const lernplan = useLernplanUebernahme('krankheitsbilder');
  const bereit = vollstaendig(fall, antworten);
  // Einmal je Fallaufruf mischen; Antworten bleiben Original-Indizes
  const reihenfolge = useMemo(() => Object.fromEntries(fall.aufgaben.map((a) => [a.id, mischung(a.optionen.length)])), [fall]);

  function waehle(aufgabeId: string, idx: number, mehrfach: boolean) {
    setAntworten((a) => {
      const alt = a[aufgabeId] ?? [];
      const neu = mehrfach ? (alt.includes(idx) ? alt.filter((i) => i !== idx) : [...alt, idx]) : [idx];
      return { ...a, [aufgabeId]: neu };
    });
  }

  function auswerten() {
    const e = bewerteFall(fall, antworten, p);
    setErgebnis(e);
    notiereFehler(e.zeilen.filter((z) => !z.richtig).map((z) => ausKrankheitsbild(fall, z.aufgabe, z.gewaehlt, p)));
    onFertig(fall, e);
    lernplan.uebernimm(proThema(e.treffer, MIN_PRO_THEMA));
  }

  return (
    <div className="kb__layout kb__layout--fall">
      <article className="card kb__fall">
        <div className="kb__kopf">
          <button type="button" className="ghost small" onClick={onZurueck}>← Alle Fälle</button>
          {p && <button type="button" className="ghost small" onClick={() => gehe({ kb: p.id })}>Steckbrief {p.name}</button>}
        </div>
        <h3>{fall.titel}</h3>
        <p className="muted">{fall.setting}</p>
        {fall.text.map((t, i) => <p key={i}>{t}</p>)}
        <p className="muted kb__klein">Fiktiver Übungsfall.</p>
      </article>

      <div className="stack-2">
        {fall.aufgaben.map((a, n) => {
          const z = ergebnis?.zeilen[n];
          const mehrfach = a.art === 'mehrfach';
          const gewaehlt = antworten[a.id] ?? [];
          return (
            <fieldset key={a.id} className={`card kb__aufgabe${z ? (z.richtig ? ' is-ok' : ' is-falsch') : ''}`} disabled={!!ergebnis}>
              <legend>{n + 1}. {a.frage}</legend>
              <p className="muted kb__klein">{mehrfach ? 'Alle zutreffenden Antworten wählen.' : 'Eine Antwort wählen.'}</p>
              <div className="kb__optionen" role={mehrfach ? 'group' : 'radiogroup'} aria-label={a.frage}>
                {reihenfolge[a.id].map((i) => {
                  const o = a.optionen[i];
                  const an = gewaehlt.includes(i);
                  const status = ergebnis ? (o.richtig ? ' is-loesung' : an ? ' is-fehler' : '') : '';
                  return (
                    <label key={i} className={`kb__option${an ? ' is-gewaehlt' : ''}${status}`}>
                      <input type={mehrfach ? 'checkbox' : 'radio'} name={`${fall.id}-${a.id}`} checked={an} onChange={() => waehle(a.id, i, mehrfach)} />
                      <span>{o.text}</span>
                      {ergebnis && o.richtig && <span className="kb__marke" aria-label="richtige Antwort">✓</span>}
                      {ergebnis && an && !o.richtig && <span className="kb__marke" aria-label="falsch gewählt">✗</span>}
                    </label>
                  );
                })}
              </div>
              {z && (
                <div className={`note ${z.richtig ? 'ok' : 'warn'}`}>
                  <strong>{z.richtig ? 'Richtig.' : `${z.punkte} von ${z.max} ${z.max === 1 ? 'Punkt' : 'Punkten'}.`}</strong> {a.erklaerung}
                  {p && <div className="kb__beleg-zeile"><Beleg p={p} abschnitt={a.abschnitt} /></div>}
                </div>
              )}
            </fieldset>
          );
        })}

        {!ergebnis ? (
          <div className="row">
            <button type="button" className="primary" disabled={!bereit} onClick={auswerten}>Auswerten</button>
            {!bereit && <span className="muted">Alle Aufgaben beantworten.</span>}
          </div>
        ) : (
          <div className="card stack-2">
            <h3>{ergebnis.punkte} von {ergebnis.max} Punkten</h3>
            <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
            <div className="row">
              {onWeiter && <button type="button" className="primary" onClick={onWeiter}>Nächster Fall</button>}
              <button type="button" onClick={onZurueck}>Alle Fälle</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Seite

export default function Krankheitsbilder() {
  const { params } = useRoute();
  const fall = FAELLE.find((f) => f.id === params.get('fall'));
  const ansicht: Ansicht = params.get('ansicht') === 'faelle' || fall ? 'faelle' : 'steckbriefe';
  const profil = PROFIL.get(params.get('kb') ?? '');
  const thema = params.get('thema') ?? undefined;
  const [erledigt, setErledigt] = useState<Erledigt>(ladeErledigt);

  function fertig(f: Fallaufgabe, e: FallErgebnis) {
    const prozent = e.max ? Math.round((e.punkte / e.max) * 100) : 0;
    const next = { ...erledigt, [f.id]: { datum: new Date().toISOString().slice(0, 10), prozent } };
    setErledigt(next); speichereErledigt(next);
    void logActivity({
      kind: 'uebung', severity: prozent >= 85 ? 'info' : 'warning',
      title: `Krankheitsbild-Fall: ${f.titel} (${PROFIL.get(f.krankheitId)?.name ?? ''})`,
      detail: `${e.punkte} von ${e.max} Punkten`,
    });
  }

  const liste = thema ? faelleZuThema(thema, FAELLE, pflegeModule) : FAELLE;
  const naechster = fall ? liste[liste.findIndex((f) => f.id === fall.id) + 1] : undefined;

  return (
    <section className="page kb">
      <div className="page__head">
        <h2>Krankheitsbilder</h2>
        <p className="muted">Steckbriefe zu häufigen Krankheitsbildern mit Ursachen, Symptomen, Pflegeschwerpunkten und Prophylaxen, verknüpft mit Medikamenten, Assessments und Katalogthemen. Dazu Fallaufgaben, die offline funktionieren und im Lernplan als Abfrage zählen.</p>
      </div>
      <div className="note warn">
        Lernhilfe, keine Behandlungsanweisung. Abschnitte mit grünem Hinweis stammen aus deinem Unterrichtsmaterial (mit Seite), alles mit „ungeprüft“ ist übliches Lehrbuchwissen und noch mit dem Unterricht abzugleichen. Es gelten ärztliche Anordnung und Hausstandard.
      </div>
      <div className="pills" role="tablist" aria-label="Ansicht">
        <button type="button" role="tab" className="pill" aria-selected={ansicht === 'steckbriefe'} aria-pressed={ansicht === 'steckbriefe'} onClick={() => gehe({})}>
          Steckbriefe <span className="pill__count">{PROFILE.length}</span>
        </button>
        <button type="button" role="tab" className="pill" aria-selected={ansicht === 'faelle'} aria-pressed={ansicht === 'faelle'} onClick={() => gehe({ ansicht: 'faelle' })}>
          Fallaufgaben <span className="pill__count">{FAELLE.length}</span>
        </button>
      </div>

      {ansicht === 'steckbriefe' && !profil && <Liste erledigt={erledigt} />}
      {ansicht === 'steckbriefe' && profil && <Steckbrief key={profil.id} p={profil} />}
      {ansicht === 'faelle' && !fall && <FallListe thema={thema} erledigt={erledigt} />}
      {ansicht === 'faelle' && fall && (
        <Fall key={fall.id} fall={fall} onFertig={fertig}
          onZurueck={() => gehe({ ansicht: 'faelle', thema })}
          onWeiter={naechster ? () => gehe({ ansicht: 'faelle', fall: naechster.id, thema }) : undefined} />
      )}
    </section>
  );
}
