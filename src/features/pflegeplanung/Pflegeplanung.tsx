import { storage } from '../../ui/lib/store';
import { useEffect, useMemo, useRef, useState } from 'react';
import './pflegeplanung.css';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { pflegeModule } from '../../modules/pflege';
import { navigate, useRoute } from '../../ui/shell/router';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import { eigenerFall, FAELLE, SETTING_LABEL, type PlanFall, type ProblemArt } from './faelle';
import {
  ERREICHT_LABEL, hatInhalt, leererPlan, neueMassnahme, neuesProblem, neuesZiel, ohneProblem, ohneZiel, problemName,
  SCHRITTE, SCHRITT_HILFE, SCHRITT_KURZ, SCHRITT_LABEL,
  type Erreicht, type Evaluation, type Massnahme, type Plan, type Problem, type Schritt, type Ziel,
} from './plan';
import { pruefe, type Befund, type Pruefergebnis, type Schwere } from './pruefung';
import { bewerteMitClaude, type KiRueckmeldung } from './claude';
import { lernplanErgebnisse } from './lernplan';

// ---------- Entwürfe und Bestwerte (nur dieses Gerät) ----------

interface Entwurf { plan: Plan; schritt: Schritt; eigenText?: string; eigenVerlauf?: string }
const ENTWURF_KEY = 'lernstoff.pflegeplanung.entwuerfe';
const BESTE_KEY = 'lernstoff.pflegeplanung.beste';
const EIGEN = 'eigen';

const lese = <T,>(key: string, fallback: T) => storage.read<T>(key, fallback);
const schreibe = (key: string, wert: unknown) => { storage.write(key, wert); };
const ladeEntwurf = (id: string): Entwurf | undefined => lese<Record<string, Entwurf>>(ENTWURF_KEY, {})[id];
function speichereEntwurf(id: string, e: Entwurf | null) {
  const alle = lese<Record<string, Entwurf>>(ENTWURF_KEY, {});
  if (e) alle[id] = e; else delete alle[id];
  schreibe(ENTWURF_KEY, alle);
}

const SCHWERE_LABEL: Record<Schwere, string> = { fehler: 'Fehlt', warnung: 'Prüfen', hinweis: 'Tipp' };
const stufe = (p: number) => (p >= 85 ? 'gut' : p >= 60 ? 'mittel' : 'schwach');

// ---------- Kleine Bausteine ----------

function Feld({ label, wert, onChange, zeilen = 2, hinweis, deaktiviert }: {
  label: string; wert: string; onChange: (v: string) => void; zeilen?: number; hinweis?: string; deaktiviert?: boolean;
}) {
  return (
    <label className="pp__feld">
      <span className="pp__feldkopf">{label}</span>
      {zeilen === 1
        ? <input type="text" value={wert} placeholder={hinweis} disabled={deaktiviert} onChange={(e) => onChange(e.target.value)} />
        : <textarea rows={zeilen} value={wert} placeholder={hinweis} disabled={deaktiviert} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function Befunde({ befunde }: { befunde: Befund[] }) {
  if (!befunde.length) return null;
  return (
    <ul className="pp__befunde">
      {befunde.map((b, i) => (
        <li key={`${b.regelId}-${b.ref ?? ''}-${i}`} className={`is-${b.schwere}`}>
          <span className="pp__schwere">{SCHWERE_LABEL[b.schwere]}</span><span>{b.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Fallkarte({ fall, verlaufZeigen, eigen, setEigen }: {
  fall: PlanFall; verlaufZeigen: boolean;
  eigen?: { text: string; verlauf: string }; setEigen?: (e: { text: string; verlauf: string }) => void;
}) {
  if (eigen && setEigen) {
    return (
      <div className="card pp__fall">
        <h3>Eigener Fall</h3>
        <Feld label="Fallbeschreibung" zeilen={8} wert={eigen.text} onChange={(text) => setEigen({ ...eigen, text })}
          hinweis="Fall aus dem Unterricht oder einer Prüfung einfügen. Keine echten Namen oder Patientendaten." />
        <Feld label="Verlauf für die Evaluation (freiwillig)" zeilen={3} wert={eigen.verlauf} onChange={(verlauf) => setEigen({ ...eigen, verlauf })}
          hinweis="Was ist nach einigen Tagen passiert?" />
        <p className="muted">Beim eigenen Fall prüft die Checkliste nur Aufbau und Formulierung. Ob die Inhalte zum Fall passen, beurteilt Claude.</p>
      </div>
    );
  }
  return (
    <div className="card pp__fall">
      <div className="pp__kopf">
        <span className={`badge badge--demo pp__setting pp__setting--${fall.setting}`}>{SETTING_LABEL[fall.setting]}</span>
        <span className="muted">{fall.bereich}</span>
      </div>
      <h3>{fall.titel}</h3>
      <p className="muted">{fall.person}</p>
      <p className="pp__text">{fall.text}</p>
      <dl className="pp__daten">
        {fall.daten.map((d) => <div key={d.label}><dt>{d.label}</dt><dd>{d.wert}</dd></div>)}
      </dl>
      {verlaufZeigen && fall.verlauf && (
        <div className="note pp__verlauf"><strong>Verlauf</strong><p>{fall.verlauf}</p></div>
      )}
      <p className="muted">Erfundener Übungsfall.</p>
    </div>
  );
}

// ---------- Editoren je Schritt ----------

type Setze = (f: (p: Plan) => Plan) => void;

function InfoEditor({ plan, setze }: { plan: Plan; setze: Setze }) {
  return (
    <>
      <Feld label="Subjektiv: Was sagt die Person (oder Angehörige)?" zeilen={4} wert={plan.subjektiv}
        onChange={(v) => setze((p) => ({ ...p, subjektiv: v }))} hinweis="z. B. „Ich hab Angst, dass …“, Wünsche, Gewohnheiten" />
      <Feld label="Objektiv: Was beobachtest oder misst du?" zeilen={5} wert={plan.objektiv}
        onChange={(v) => setze((p) => ({ ...p, objektiv: v }))} hinweis="Vitalwerte, Skalen (Braden, NRS), Haut, Mobilität, Ausscheidung …" />
    </>
  );
}

function ProblemEditor({ plan, setze }: { plan: Plan; setze: Setze }) {
  const aendere = (id: string, patch: Partial<Problem>) => setze((p) => ({ ...p, probleme: p.probleme.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const neu = (art: ProblemArt) => setze((p) => ({ ...p, probleme: [...p.probleme, neuesProblem(art)] }));
  return (
    <>
      {plan.probleme.map((pr, i) => (
        <fieldset key={pr.id} className={`pp__block pp__block--${pr.art}`}>
          <legend>Problem {i + 1}</legend>
          <div className="row pp__blockkopf">
            <div className="pills" role="group" aria-label="Art des Problems">
              <button type="button" className="pill small" aria-pressed={pr.art === 'aktuell'} onClick={() => aendere(pr.id, { art: 'aktuell' })}>Aktuell</button>
              <button type="button" className="pill small" aria-pressed={pr.art === 'risiko'} onClick={() => aendere(pr.id, { art: 'risiko' })}>Risiko</button>
            </div>
            <button type="button" className="ghost small" onClick={() => setze((p) => ohneProblem(p, pr.id))} aria-label={`Problem ${i + 1} entfernen`}>Entfernen</button>
          </div>
          <Feld label="P: Problem" zeilen={1} wert={pr.p} onChange={(v) => aendere(pr.id, { p: v })}
            hinweis={pr.art === 'risiko' ? 'Gefahr von …' : 'Beeinträchtigte …, akute Schmerzen …'} />
          <Feld label="E: Einflussfaktoren" wert={pr.e} onChange={(v) => aendere(pr.id, { e: v })} hinweis="beeinflusst durch …" />
          {pr.art === 'aktuell'
            ? <Feld label="S: Symptome" wert={pr.s} onChange={(v) => aendere(pr.id, { s: v })} hinweis="angezeigt durch …" />
            : pr.s.trim() && <Feld label="S: Symptome (bei Risiko nicht nötig)" wert={pr.s} onChange={(v) => aendere(pr.id, { s: v })} />}
          <Feld label="R: Ressourcen" wert={pr.r} onChange={(v) => aendere(pr.id, { r: v })} hinweis="Was kann die Person selbst, wer unterstützt?" />
        </fieldset>
      ))}
      <div className="row">
        <button type="button" onClick={() => neu('aktuell')}>+ Aktuelles Problem</button>
        <button type="button" onClick={() => neu('risiko')}>+ Risikodiagnose</button>
      </div>
    </>
  );
}

function ZielEditor({ plan, setze }: { plan: Plan; setze: Setze }) {
  const aendere = (id: string, patch: Partial<Ziel>) => setze((p) => ({ ...p, ziele: p.ziele.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  if (!plan.probleme.some((p) => p.p.trim())) return <p className="muted">Formuliere zuerst mindestens ein Problem.</p>;
  return (
    <>
      {plan.probleme.map((pr, i) => (
        <fieldset key={pr.id} className="pp__block">
          <legend>{problemName(pr, i)}</legend>
          {plan.ziele.filter((z) => z.problemId === pr.id).map((z) => (
            <div key={z.id} className="pp__unter">
              <Feld label="Ziel" wert={z.text} onChange={(v) => aendere(z.id, { text: v })} hinweis="Herr/Frau … kann/hat/gibt an … (aus Sicht der Person)" />
              <div className="row pp__zeile">
                <Feld label="Überprüfung bis" zeilen={1} wert={z.termin} onChange={(v) => aendere(z.id, { termin: v })} hinweis="z. B. in 3 Tagen, täglich, bis zur Entlassung" />
                <button type="button" className="ghost small" onClick={() => setze((p) => ohneZiel(p, z.id))}>Entfernen</button>
              </div>
            </div>
          ))}
          <button type="button" className="small" onClick={() => setze((p) => ({ ...p, ziele: [...p.ziele, neuesZiel(pr.id)] }))}>+ Ziel</button>
        </fieldset>
      ))}
    </>
  );
}

function MassnahmenEditor({ plan, setze }: { plan: Plan; setze: Setze }) {
  const aendere = (id: string, patch: Partial<Massnahme>) => setze((p) => ({ ...p, massnahmen: p.massnahmen.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const ziele = plan.ziele.filter((z) => z.text.trim());
  if (!ziele.length) return <p className="muted">Formuliere zuerst mindestens ein Ziel.</p>;
  return (
    <>
      {ziele.map((z) => (
        <fieldset key={z.id} className="pp__block">
          <legend>{z.text.trim()}</legend>
          {plan.massnahmen.filter((m) => m.zielId === z.id).map((m) => (
            <div key={m.id} className="pp__unter pp__massnahme">
              <Feld label="Was" zeilen={1} wert={m.was} onChange={(v) => aendere(m.id, { was: v })} hinweis="z. B. Mobilisation mit Rollator" />
              <Feld label="Wie" wert={m.wie} onChange={(v) => aendere(m.id, { wie: v })} hinweis="Durchführung, Hilfsmittel, worauf achten" />
              <div className="pp__zweier">
                <Feld label="Wann / wie oft" zeilen={1} wert={m.wann} onChange={(v) => aendere(m.id, { wann: v })} hinweis="3 × täglich, vor jeder Mahlzeit" />
                <Feld label="Wer" zeilen={1} wert={m.wer} onChange={(v) => aendere(m.id, { wer: v })} hinweis="Pflegefachperson, mit Angehörigen" />
              </div>
              <Feld label="Begründung" wert={m.begruendung} onChange={(v) => aendere(m.id, { begruendung: v })} hinweis="Warum hilft das? Expertenstandard, Fachwissen" />
              <button type="button" className="ghost small" onClick={() => setze((p) => ({ ...p, massnahmen: p.massnahmen.filter((x) => x.id !== m.id) }))}>Maßnahme entfernen</button>
            </div>
          ))}
          <button type="button" className="small" onClick={() => setze((p) => ({ ...p, massnahmen: [...p.massnahmen, neueMassnahme(z.id)] }))}>+ Maßnahme</button>
        </fieldset>
      ))}
    </>
  );
}

function BerichtEditor({ plan, setze }: { plan: Plan; setze: Setze }) {
  return (
    <Feld label="Pflegebericht (freiwillig)" zeilen={6} wert={plan.bericht} onChange={(v) => setze((p) => ({ ...p, bericht: v }))}
      hinweis="24.10., 09:30 Uhr: Herr W. mit Rollator 10 m auf dem Flur mobilisiert, gibt NRS 4 an … (Handzeichen)" />
  );
}

function EvaluationEditor({ plan, setze, verlauf }: { plan: Plan; setze: Setze; verlauf: string }) {
  const leerEval: Evaluation = { erreicht: '', begruendung: '', anpassung: '' };
  const aendere = (id: string, patch: Partial<Evaluation>) =>
    setze((p) => ({ ...p, evaluation: { ...p.evaluation, [id]: { ...leerEval, ...p.evaluation[id], ...patch } } }));
  const ziele = plan.ziele.filter((z) => z.text.trim());
  return (
    <>
      {verlauf ? <div className="note pp__verlauf"><strong>Verlauf</strong><p>{verlauf}</p></div>
        : <p className="muted">Kein Verlauf vorgegeben. Überlege, woran du die Ziele überprüfen würdest.</p>}
      {!ziele.length && <p className="muted">Formuliere zuerst Ziele.</p>}
      {ziele.map((z) => {
        const e = { ...leerEval, ...plan.evaluation[z.id] };
        return (
          <fieldset key={z.id} className="pp__block">
            <legend>{z.text.trim()}</legend>
            <div className="pills" role="group" aria-label="Ziel erreicht?">
              {(['ja', 'teilweise', 'nein'] as Exclude<Erreicht, ''>[]).map((k) => (
                <button key={k} type="button" className="pill small" aria-pressed={e.erreicht === k} onClick={() => aendere(z.id, { erreicht: k })}>{ERREICHT_LABEL[k]}</button>
              ))}
            </div>
            <Feld label="Woran erkennst du das?" wert={e.begruendung} onChange={(v) => aendere(z.id, { begruendung: v })} hinweis="Beobachtung, Wert oder Aussage aus dem Verlauf" />
            {(e.erreicht === 'teilweise' || e.erreicht === 'nein') && (
              <Feld label="Anpassung" wert={e.anpassung} onChange={(v) => aendere(z.id, { anpassung: v })} hinweis="Ziel neu formulieren, Maßnahme ändern oder ergänzen" />
            )}
          </fieldset>
        );
      })}
    </>
  );
}

// ---------- Auswertung ----------

function Ergebnis({ e }: { e: Pruefergebnis }) {
  return (
    <div className="card pp__ergebnis" aria-live="polite">
      <div className="pp__kopf"><h3>Checkliste: {e.prozent} %</h3><span className="muted">offline geprüft</span></div>
      <div className={`pp__balken pp__balken--${stufe(e.prozent)}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.prozent}>
        <span style={{ width: `${e.prozent}%` }} />
      </div>
      <div className="pp__schritte">
        {e.schritte.filter((s) => s.bewertet).map((s) => (
          <section key={s.schritt} className={`pp__schritt is-${stufe(s.prozent)}`}>
            <h4>{SCHRITT_LABEL[s.schritt]} <span className="muted">· {s.prozent} %{s.pflicht ? '' : ' · freiwillig'}</span></h4>
            {s.befunde.length ? <Befunde befunde={s.befunde} /> : <p className="muted">Keine Auffälligkeiten.</p>}
          </section>
        ))}
      </div>
      {e.fallbezug && (
        <details>
          <summary>Erwartungshorizont zum Fall</summary>
          <div className="pp__horizont">
            <div>
              <h4>Probleme</h4>
              <ul>{e.fallbezug.probleme.map((t) => (
                <li key={t.erwartung.id} className={t.gefunden ? 'is-ok' : 'is-fehlt'}>
                  <span aria-hidden="true">{t.gefunden ? '✓' : '✗'}</span> {t.erwartung.text}
                  <span className="muted"> ({t.erwartung.art === 'risiko' ? 'Risiko' : 'aktuell'}{t.erwartung.pflicht ? '' : ', optional'})</span>
                  <span className="visually-hidden">{t.gefunden ? ': erkannt' : ': nicht erkannt'}</span>
                </li>
              ))}</ul>
            </div>
            <div>
              <h4>Ressourcen</h4>
              <ul>{e.fallbezug.ressourcen.map((t) => (
                <li key={t.erwartung.id} className={t.gefunden ? 'is-ok' : 'is-fehlt'}><span aria-hidden="true">{t.gefunden ? '✓' : '✗'}</span> {t.erwartung.text}</li>
              ))}</ul>
            </div>
            <div>
              <h4>Informationen</h4>
              <ul>{e.fallbezug.info.map((t) => (
                <li key={t.erwartung.id} className={t.gefunden ? 'is-ok' : 'is-fehlt'}><span aria-hidden="true">{t.gefunden ? '✓' : '✗'}</span> {t.erwartung.text}</li>
              ))}</ul>
            </div>
          </div>
        </details>
      )}
      <p className="muted">Die Checkliste prüft Aufbau, Formulierung und Stichworte. Sie erkennt nicht jede Formulierung und nicht, ob eine Maßnahme fachlich richtig ist. Dafür gibt es die Rückmeldung von Claude.</p>
    </div>
  );
}

function KiErgebnis({ r }: { r: KiRueckmeldung }) {
  const regelName = (id: string) => pflegeModule.checkRules.find((x) => x.id === id)?.description ?? id;
  return (
    <div className="card pp__ki" aria-live="polite">
      <div className="pp__kopf"><h3>Rückmeldung von Claude: {r.prozent} %</h3><span className="pp__note">Note {r.note}</span></div>
      <div className="pp__schritte">
        {r.schritte.filter((s) => s.kommentar).map((s) => (
          <section key={s.schritt} className={`pp__schritt is-${stufe(s.prozent)}`}>
            <h4>{SCHRITT_LABEL[s.schritt]} <span className="muted">· {s.prozent} %</span></h4>
            <p>{s.kommentar}</p>
          </section>
        ))}
      </div>
      {r.fachfehler.length > 0 && <div className="note warn"><strong>Fachlich prüfen</strong><ul>{r.fachfehler.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.verbessern.length > 0 && <div className="note"><strong>Verbessern</strong><ul>{r.verbessern.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.staerken.length > 0 && <div className="note ok"><strong>Gut gemacht</strong><ul>{r.staerken.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      {r.regeln.length > 0 && (
        <details>
          <summary>Prüfregeln aus dem Katalog</summary>
          <ul className="pp__regeln">
            {r.regeln.map((x) => (
              <li key={x.regelId} className={x.erfuellt ? 'is-ok' : 'is-fehlt'}>
                <span aria-hidden="true">{x.erfuellt ? '✓' : '✗'}</span>
                <span><strong>{regelName(x.regelId)}</strong>{x.kommentar && <> {x.kommentar}</>}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {r.beispiel && <details open><summary>Überarbeiteter Ausschnitt</summary><p className="pre pp__muster">{r.beispiel}</p></details>}
      <p className="muted">KI-Rückmeldung, kann sich irren. Maßgeblich sind Lehrende, Praxisanleitung und Hausstandard.</p>
    </div>
  );
}

// ---------- Seite ----------

export default function Pflegeplanung() {
  const wunsch = useRoute().params.get('fall') ?? '';
  const [fallId, setFallId] = useState(() => (FAELLE.some((f) => f.id === wunsch) ? wunsch : FAELLE[0]!.id));
  const start = ladeEntwurf(fallId);
  const [plan, setPlan] = useState<Plan>(start?.plan ?? leererPlan());
  const [schritt, setSchritt] = useState<Schritt>(start?.schritt ?? 'info');
  const [eigen, setEigen] = useState({ text: '', verlauf: '' });
  const [ergebnis, setErgebnis] = useState<Pruefergebnis | null>(null);
  const [ki, setKi] = useState<KiRueckmeldung | null>(null);
  const [kiLaeuft, setKiLaeuft] = useState(false);
  const [kiFehler, setKiFehler] = useState('');
  const [beste, setBeste] = useState(() => lese<Record<string, number>>(BESTE_KEY, {}));
  const [hilfe, setHilfe] = useState(false);
  const ergebnisRef = useRef<HTMLDivElement>(null);
  const apiKey = getApiKey();
  const lernplan = useLernplanUebernahme('pflegeplanung');

  const istEigen = fallId === EIGEN;
  const fall = istEigen ? eigenerFall(eigen.text, eigen.verlauf) : FAELLE.find((f) => f.id === fallId)!;
  const live = useMemo(() => pruefe(fall, plan), [fall, plan]);
  const idx = SCHRITTE.indexOf(schritt);

  // Entwurf laufend sichern
  useEffect(() => {
    speichereEntwurf(fallId, { plan, schritt, ...(istEigen ? { eigenText: eigen.text, eigenVerlauf: eigen.verlauf } : {}) });
  }, [fallId, plan, schritt, istEigen, eigen]);

  function zuruecksetzen() { setErgebnis(null); setKi(null); setKiFehler(''); lernplan.zuruecksetzen(); }

  const setze: Setze = (f) => { setPlan(f); zuruecksetzen(); };

  function waehleFall(id: string) {
    const e = ladeEntwurf(id);
    setFallId(id);
    setPlan(e?.plan ?? leererPlan());
    setSchritt(e?.schritt ?? 'info');
    if (id === EIGEN) setEigen({ text: e?.eigenText ?? '', verlauf: e?.eigenVerlauf ?? '' });
    zuruecksetzen();
  }

  function neuBeginnen() {
    if (!window.confirm('Planung zu diesem Fall verwerfen und neu beginnen?')) return;
    speichereEntwurf(fallId, null);
    setPlan(leererPlan()); setSchritt('info'); zuruecksetzen();
  }

  function auswerten() {
    const e = pruefe(fall, plan);
    setErgebnis(e); setKi(null); setKiFehler(''); lernplan.zuruecksetzen();
    if (!istEigen) {
      const neu = { ...beste, [fall.id]: Math.max(beste[fall.id] ?? 0, e.prozent) };
      setBeste(neu); schreibe(BESTE_KEY, neu);
    }
    const fehler = e.befunde.filter((b) => b.schwere === 'fehler').length;
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 70 ? 'info' : 'warning',
      title: `Pflegeplanung: ${fall.titel} ${e.prozent} %`,
      detail: fehler ? `${fehler} Pflichtangaben fehlen noch` : 'Alle Pflichtteile vorhanden',
    });
    requestAnimationFrame(() => ergebnisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function fragClaude() {
    setKiLaeuft(true); setKiFehler('');
    try { setKi(await bewerteMitClaude({ apiKey, fall, plan, modul: pflegeModule })); }
    catch (err) { setKiFehler(err instanceof Error ? err.message : String(err)); }
    finally { setKiLaeuft(false); }
  }

  const melden = () => { if (ergebnis) lernplan.uebernimm(lernplanErgebnisse(fall, ergebnis, ki)); };

  const live_s = (s: Schritt) => live.schritte.find((x) => x.schritt === s)!;
  // Live nur Aufbau und Formulierung zeigen; was im Fall fehlt, erst bei der Auswertung
  const liveBefunde = live_s(schritt).befunde.filter((b) => !b.regelId.startsWith('pp.fall'));
  const verlaufGesehen = idx >= SCHRITTE.indexOf('evaluation') || !!ergebnis;

  return (
    <section className="page pp">
      <div className="page__head">
        <h2>Pflegeplanung</h2>
        <p className="muted">Plane einen Fall Schritt für Schritt nach dem Pflegeprozess. Die Checkliste prüft offline nach den Regeln des Pflege-Katalogs (PESR, SMART, Maßnahmen), Claude gibt auf Wunsch eine fachliche Rückmeldung.</p>
      </div>

      <div className="card pp__auswahl">
        <label className="field">
          <span className="muted">Fall</span>
          <select value={fallId} onChange={(e) => waehleFall(e.target.value)}>
            {FAELLE.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titel} · {SETTING_LABEL[f.setting]}{beste[f.id] !== undefined ? ` · bisher ${beste[f.id]} %` : ''}
              </option>
            ))}
            <option value={EIGEN}>Eigener Fall …</option>
          </select>
        </label>
        <div className="row pp__aktionen">
          <button type="button" className="ghost small" onClick={() => setHilfe((x) => !x)} aria-expanded={hilfe}>Was gehört in welchen Schritt?</button>
          <button type="button" className="ghost small" onClick={neuBeginnen}>Neu beginnen</button>
        </div>
        {hilfe && (
          <dl className="pp__hilfe">
            {SCHRITTE.map((s, i) => <div key={s}><dt>{i + 1}. {SCHRITT_LABEL[s]}</dt><dd>{SCHRITT_HILFE[s]}</dd></div>)}
          </dl>
        )}
      </div>

      <div className="pp__layout">
        <Fallkarte fall={fall} verlaufZeigen={verlaufGesehen} {...(istEigen ? { eigen, setEigen: (x: typeof eigen) => { setEigen(x); zuruecksetzen(); } } : {})} />

        <div className="card pp__eingabe">
          <nav className="pp__stepper" aria-label="Schritte des Pflegeprozesses">
            <ol>
              {SCHRITTE.map((s, i) => {
                const st = live_s(s);
                const inhalt = hatInhalt(plan, s);
                return (
                  <li key={s}>
                    <button type="button" aria-current={s === schritt ? 'step' : undefined}
                      className={`pp__step${inhalt ? ` is-${stufe(st.prozent)}` : ''}`} onClick={() => setSchritt(s)}>
                      <span className="pp__nr">{i + 1}</span>
                      <span className="pp__steplabel">{SCHRITT_KURZ[s]}</span>
                      <span className="visually-hidden">{SCHRITT_LABEL[s]}{inhalt ? `, ${st.prozent} %` : ', leer'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="pp__kopf">
            <h3>{idx + 1}. {SCHRITT_LABEL[schritt]}</h3>
            {hatInhalt(plan, schritt) && <span className={`pp__live is-${stufe(live_s(schritt).prozent)}`}>{live_s(schritt).prozent} %</span>}
          </div>
          <p className="muted pp__hilfetext">{SCHRITT_HILFE[schritt]}</p>

          {schritt === 'info' && <InfoEditor plan={plan} setze={setze} />}
          {schritt === 'probleme' && <ProblemEditor plan={plan} setze={setze} />}
          {schritt === 'ziele' && <ZielEditor plan={plan} setze={setze} />}
          {schritt === 'massnahmen' && <MassnahmenEditor plan={plan} setze={setze} />}
          {schritt === 'durchfuehrung' && <BerichtEditor plan={plan} setze={setze} />}
          {schritt === 'evaluation' && <EvaluationEditor plan={plan} setze={setze} verlauf={fall.verlauf} />}

          {hatInhalt(plan, schritt) && liveBefunde.length > 0 && (
            <details className="pp__livebefunde">
              <summary>{liveBefunde.length} {liveBefunde.length === 1 ? 'Hinweis' : 'Hinweise'} zu diesem Schritt</summary>
              <Befunde befunde={liveBefunde} />
            </details>
          )}

          <div className="row pp__knoepfe">
            <button type="button" disabled={idx === 0} onClick={() => setSchritt(SCHRITTE[idx - 1]!)}>Zurück</button>
            {idx < SCHRITTE.length - 1
              ? <button type="button" className="primary" onClick={() => setSchritt(SCHRITTE[idx + 1]!)}>Weiter: {SCHRITT_KURZ[SCHRITTE[idx + 1]!]}</button>
              : <button type="button" className="primary" onClick={auswerten}>Auswerten</button>}
            {idx < SCHRITTE.length - 1 && <button type="button" className="ghost" onClick={auswerten}>Jetzt auswerten</button>}
          </div>
          <p className="muted">Dein Entwurf wird auf diesem Gerät gespeichert. Bitte keine echten Patientendaten eingeben.</p>
        </div>
      </div>

      <div ref={ergebnisRef} className="pp__auswertung">
        {ergebnis && (
          <>
            <Ergebnis e={ergebnis} />
            <div className="card">
              <div className="row">
                {apiKey
                  ? <button type="button" className="primary" onClick={fragClaude} disabled={kiLaeuft}>{kiLaeuft ? 'Claude liest …' : ki ? 'Noch einmal bewerten' : 'Fachliche Rückmeldung von Claude'}</button>
                  : <p className="muted">Für eine fachliche Rückmeldung (prüft auch, ob Maßnahmen richtig sind und zum Fall passen) einen API-Schlüssel hinterlegen. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>}
                <button type="button" onClick={melden} disabled={!!lernplan.uebernahme}>
                  {lernplan.uebernahme ? 'An den Lernplan übergeben' : 'Fertig: Ergebnis in den Lernplan'}
                </button>
              </div>
              {apiKey && !ki && !kiLaeuft && <p className="muted">Gesendet werden nur der Fall und deine Planung.</p>}
              {kiFehler && <div className="note warn" role="alert">{kiFehler}</div>}
              {!lernplan.uebernahme && (
                <p className="muted">
                  Übergib erst, wenn die Planung fertig ist: je Thema zählt die erste Übergabe des Tages. Gewertet wird {ki ? 'die Bewertung von Claude' : 'die Checkliste (mit Rückmeldung von Claude genauer)'}.
                </p>
              )}
              <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
              {fall.beispiel && (
                <details>
                  <summary>Beispiel-Planung ansehen</summary>
                  <p className="pre pp__muster">{fall.beispiel}</p>
                </details>
              )}
            </div>
            {ki && <KiErgebnis r={ki} />}
          </>
        )}
      </div>
    </section>
  );
}
