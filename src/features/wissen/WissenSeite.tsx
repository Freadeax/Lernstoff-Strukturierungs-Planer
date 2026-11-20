// Wissenstrainer: ein Trainer für alle Fragen-Fachgebiete (bis November 2026 neun Einzeltrainer).
// Übersicht → Fachgebiet (Bereiche, Stufen, gemischte Runde wie bisher) oder eine eigene Runde
// quer über mehrere Fachgebiete und „Alle Schwachstellen“.
import { useMemo, useState } from 'react';
import '../quiz/quiz.css';
import './wissen.css';
import { navigate, useRoute } from '../../ui/shell/router';
import { Icon } from '../../ui/icons';
import { PageHeading } from '../../ui/PageHeading';
import { storage } from '../../ui/lib/store';
import { logActivity } from '../../core/activity';
import { TrainerSeite } from '../quiz/TrainerSeite';
import { Runde, type RundenErgebnis } from '../quiz/Runde';
import { runde as zieheRunde, schwachstellen, stufeVon, STUFE_LABEL, type Aufgabe, type Stufe } from '../quiz/quiz';
import { ladeZwischenstand, speichereZwischenstand, type Zwischenstand } from '../quiz/zwischenstand';
import { istOffen, ladeFehler } from '../fehlerheft/fehlerheft';
import { fertigPfad } from '../fertigkeiten/pfad';
import { ALLE_FIGUREN, aufgabenAus, FACH, FACH_VON_AUFGABE, FAECHER, gemischteGrundlage, gemischtWeiter, type Fach } from './faecher';
import { istFach, WISSEN_PFAD, wissenPfad } from './pfad';

/** Speicherplatz für Zwischenstände gemischter Runden. */
const KENNUNG = 'wissen';
const ANZAHLEN = [10, 15, 20] as const;

type Stand = Record<string, { datum: string; prozent: number }>;
const standVon = (f: Fach) => storage.read<Stand>(`lernstoff.${f.id}.stand`, {});

/** Fachgebiete als Leiste über jeder Ansicht. */
function FachLeiste({ aktiv }: { aktiv?: string }) {
  return (
    <nav className="pills wissen-leiste" aria-label="Fachgebiet wählen">
      <a className="pill" href={`#${WISSEN_PFAD}`} aria-current={aktiv ? undefined : 'page'}>Übersicht</a>
      {FAECHER.map((f) => <a key={f.id} className="pill" href={`#${wissenPfad(f.id)}`} aria-current={aktiv === f.id ? 'page' : undefined}>{f.label}</a>)}
    </nav>
  );
}

/** Hinweis auf die praktischen Übungen zum Fachgebiet (seit Stufe 2 im Fertigkeiten-Trainer). */
const PRAKTISCH: Partial<Record<Fach['id'], { text: string; links: Array<{ label: string; path: string }> }>> = {
  notfall: { text: 'Reanimation und ABCDE-Notfälle praktisch üben:', links: [{ label: 'Reanimation', path: fertigPfad('rea') }, { label: 'ABCDE-Notfall', path: fertigPfad('abcde') }] },
  labor: { text: 'Selbst Blut abnehmen, Verläufe lesen, kritische Werte melden:', links: [{ label: 'Labor-Werkbank', path: fertigPfad('werkbank') }] },
  hygiene: { text: 'Hygiene im Raumfoto erkennen:', links: [{ label: 'Hygiene-Suchbilder', path: fertigPfad('suchbilder') }] },
};

function FachSeite({ fach }: { fach: Fach }) {
  const praktisch = PRAKTISCH[fach.id];
  return (
    <TrainerSeite key={fach.id}
      oben={<FachLeiste aktiv={fach.id} />}
      unterKopf={praktisch && (
        <p className="note wissen-praktisch">{praktisch.text}{' '}
          {praktisch.links.map((l, i) => <span key={l.path}>{i > 0 && ' · '}<a href={`#${l.path}`}>{l.label}</a></span>)}
          {' '}im Fertigkeiten-Trainer.</p>
      )}
      titel={fach.label} intro={`${fach.intro} Funktioniert offline.`} hinweis={fach.hinweis}
      pfad={wissenPfad(fach.id)} quelle={fach.id} bereiche={fach.bereiche} aufgaben={fach.aufgaben}
      figuren={fach.figuren} proRunde={fach.proRunde} grundlage={fach.grundlage} weiter={fach.weiter}
    />
  );
}

/** Offene Fehler aus allen Fachgebieten als Aufgaben. */
function alleSchwachstellen(): Aufgabe[] {
  const offene = ladeFehler().filter((f) => istOffen(f)).map((f) => f.id);
  return FAECHER.flatMap((f) => schwachstellen(Object.values(f.aufgaben).flat(), f.id, offene));
}

/** Schlüssel einer gemischten Runde: ihre Angaben in der Adresse ohne „runde“. */
function rundenSchluessel(params: URLSearchParams): string {
  const q = new URLSearchParams(params);
  q.delete('runde');
  return q.toString();
}

function poolFuer(params: URLSearchParams): { pool: Aufgabe[]; titel: string } {
  const stufe = Number(params.get('stufe'));
  const roh = params.get('fach') === 'schwach' ? alleSchwachstellen() : aufgabenAus((params.get('themen') ?? '').split(',').filter(Boolean));
  const pool = stufe === 1 || stufe === 2 || stufe === 3 ? roh.filter((a) => stufeVon(a) === stufe) : roh;
  return { pool, titel: params.get('fach') === 'schwach' ? 'Meine Schwachstellen' : 'Eigene Runde' };
}

/** Gemischte Runde über mehrere Fachgebiete. Fehler und Lernplan buchen je Fachgebiet wie bisher. */
function GemischteRunde() {
  const { params } = useRoute();
  const schluessel = rundenSchluessel(params);
  const [nr, setNr] = useState(0);
  const [fortsetzen, setFortsetzen] = useState<Zwischenstand | null>(() => {
    const z = ladeZwischenstand(KENNUNG);
    return z && z.bereich === schluessel ? z : null;
  });
  const [nachuebung, setNachuebung] = useState<Aufgabe[] | null>(null);
  const { pool, titel } = useMemo(() => poolFuer(params), [schluessel]);
  const anzahl = Math.max(5, Math.min(30, Number(params.get('anzahl')) || 15));
  const liste = useMemo(() => zieheRunde(pool, anzahl), [pool, anzahl, nr]);
  const fachVon = (a: Aufgabe) => FACH_VON_AUFGABE.get(a.id) ?? 'grundlagen';

  function fertig(e: RundenErgebnis) {
    void logActivity({
      kind: 'uebung', severity: e.prozent >= 80 ? 'info' : 'warning',
      title: `Wissenstrainer: ${titel}`, detail: `${e.prozent} % richtig, ${e.richtig} von ${e.anzahl} Aufgaben ganz richtig`,
    });
  }

  if (!liste.length && !fortsetzen) return (
    <section className="page qz-seite">
      <FachLeiste />
      <div className="card"><p>Für diese Auswahl gibt es gerade keine Aufgaben.</p><button type="button" onClick={() => navigate(WISSEN_PFAD)}>Zur Übersicht</button></div>
    </section>
  );

  return (
    <section className="page qz-seite">
      <FachLeiste />
      <div className="page__head"><h2>{titel}</h2><p className="muted">Aufgaben aus mehreren Fachgebieten. Fehler landen im Fehlerheft beim jeweiligen Fachgebiet.</p></div>
      <Runde
        key={`${schluessel}-${nr}${fortsetzen ? `-f${fortsetzen.rundeId}` : ''}${nachuebung ? '-n' : ''}`}
        aufgaben={nachuebung ?? liste} quelle="grundlagen" trainer="grundlagen" kennung={KENNUNG}
        quelleVon={fachVon} trainerVon={fachVon}
        figuren={ALLE_FIGUREN} grundlage={gemischteGrundlage} weiter={gemischtWeiter}
        bereich={schluessel} stufe={Number(params.get('stufe')) || 0} fortsetzen={fortsetzen} nachuebung={!!nachuebung || !!fortsetzen?.nachuebung}
        onFertig={fertig}
        onNeu={() => { setFortsetzen(null); setNachuebung(null); setNr((n) => n + 1); }}
        onEnde={() => navigate(WISSEN_PFAD)}
        onNachuebung={(falsche) => { setFortsetzen(null); setNachuebung(falsche); setNr((n) => n + 1); }}
      />
    </section>
  );
}

function Uebersicht() {
  const [wahl, setWahl] = useState<Set<string>>(() => new Set());
  const [stufe, setStufe] = useState<Stufe | 0>(0);
  const [anzahl, setAnzahl] = useState<number>(15);
  const [offen, setOffen] = useState<Zwischenstand | null>(() => ladeZwischenstand(KENNUNG));
  const schwach = useMemo(() => alleSchwachstellen(), []);
  const begonnen = useMemo(() => FAECHER.filter((f) => ladeZwischenstand(f.id)), []);
  const auswahl = useMemo(() => {
    // Ganzes Fachgebiet gewählt → Bereiche nicht einzeln aufzählen
    return [...wahl].filter((s) => !s.includes('.') || !wahl.has(s.split('.')[0]!));
  }, [wahl]);
  const pool = useMemo(() => aufgabenAus(auswahl).filter((a) => !stufe || stufeVon(a) === stufe), [auswahl, stufe]);

  function umschalten(id: string) {
    setWahl((alt) => {
      const neu = new Set(alt);
      if (neu.has(id)) neu.delete(id); else neu.add(id);
      // Fachgebiet an/aus nimmt seine Bereiche mit
      if (!id.includes('.')) for (const b of FACH[id as Fach['id']].bereiche) neu.delete(`${id}.${b.id}`);
      return neu;
    });
  }
  const zufall = () => Math.random().toString(36).slice(2, 7);
  function starte(fach: 'mix' | 'schwach') {
    const q = new URLSearchParams({ fach });
    if (fach === 'mix') q.set('themen', auswahl.join(','));
    if (stufe) q.set('stufe', String(stufe));
    q.set('anzahl', String(anzahl));
    q.set('r', zufall());
    q.set('runde', '1');
    navigate(`${WISSEN_PFAD}?${q}`);
  }

  return (
    <section className="page wissen">
      <PageHeading bild="ueben" eyebrow="Üben · Fachwissen" title="Wissenstrainer"
        description="Alle Fragen-Trainer an einem Ort: Fachgebiet wählen oder eine eigene Runde aus mehreren Themen zusammenstellen. Funktioniert offline." />
      <FachLeiste />

      {(offen || begonnen.length > 0) && (
        <div className="card qz-seite__fortsetzen" role="status">
          <div>
            <strong>Begonnene Runden</strong>
            <p className="muted">Du kannst dort weitermachen, wo du aufgehört hast.</p>
          </div>
          <div className="row">
            {offen && <>
              <button type="button" className="primary" onClick={() => navigate(`${WISSEN_PFAD}?${offen.bereich}&runde=1`)}>Eigene Runde fortsetzen ({offen.ergebnisse.length} von {offen.aufgaben.length})</button>
              <button type="button" className="ghost" onClick={() => { speichereZwischenstand(KENNUNG, null); setOffen(null); }}>Verwerfen</button>
            </>}
            {begonnen.map((f) => <button key={f.id} type="button" onClick={() => navigate(wissenPfad(f.id))}>{f.label}</button>)}
          </div>
        </div>
      )}

      <h2 className="wissen__ueberschrift">Fachgebiete</h2>
      <ul className="wissen__faecher" role="list">
        {FAECHER.map((f) => {
          const st = standVon(f);
          const geuebt = f.bereiche.filter((b) => st[b.id]);
          const schnitt = geuebt.length ? Math.round(geuebt.reduce((s, b) => s + st[b.id]!.prozent, 0) / geuebt.length) : null;
          const n = Object.values(f.aufgaben).flat().length;
          return (
            <li key={f.id}>
              <a className="card wissen__fach" href={`#${wissenPfad(f.id)}`}>
                <span className="wissen__icon" aria-hidden="true"><Icon name={f.icon} size={20} /></span>
                <span className="wissen__text">
                  <strong>{f.label}</strong>
                  <small className="muted">{f.kurz}</small>
                  <small className="muted">{f.bereiche.length} Bereiche · {n} Aufgaben</small>
                  {schnitt !== null
                    ? <span className={`tag ${schnitt >= 80 ? 'tag--wissen-sicher' : 'tag--warning'}`}>{geuebt.length} von {f.bereiche.length} Bereichen geübt · zuletzt im Schnitt {schnitt} %</span>
                    : <span className="tag tag--info">Neu</span>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="card wissen__mix">
        <h2>Eigene Runde zusammenstellen</h2>
        <p className="muted">Fachgebiete oder einzelne Bereiche ankreuzen, zum Beispiel Herz, Vitalzeichen und Basismaßnahmen für eine Runde zum Thema Kreislauf.</p>
        <ul className="wissen__wahl" role="list">
          {FAECHER.map((f) => {
            const ganz = wahl.has(f.id);
            return (
              <li key={f.id}>
                <details>
                  <summary>
                    <label className="check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={ganz} onChange={() => umschalten(f.id)} />
                      <span>{f.label}</span>
                    </label>
                    <span className="muted">{f.bereiche.filter((b) => wahl.has(`${f.id}.${b.id}`)).length || ''}</span>
                  </summary>
                  <div className="wissen__bereiche">
                    {f.bereiche.map((b) => (
                      <label key={b.id} className="check">
                        <input type="checkbox" checked={ganz || wahl.has(`${f.id}.${b.id}`)} disabled={ganz} onChange={() => umschalten(`${f.id}.${b.id}`)} />
                        <span>{b.label} <small className="muted">({f.aufgaben[b.id]?.length ?? 0})</small></span>
                      </label>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <div className="qz-seite__filter" role="group" aria-label="Schwierigkeit">
          <span className="muted">Schwierigkeit:</span>
          <button type="button" className="small" aria-pressed={stufe === 0} onClick={() => setStufe(0)}>Alle</button>
          {([1, 2, 3] as const).map((s) => <button key={s} type="button" className="small" aria-pressed={stufe === s} onClick={() => setStufe(s)}>{STUFE_LABEL[s]}</button>)}
        </div>
        <div className="qz-seite__filter" role="group" aria-label="Anzahl Aufgaben">
          <span className="muted">Aufgaben:</span>
          {ANZAHLEN.map((n) => <button key={n} type="button" className="small" aria-pressed={anzahl === n} onClick={() => setAnzahl(n)}>{n}</button>)}
        </div>
        <div className="qz-seite__start">
          <button type="button" className="primary" disabled={!pool.length} onClick={() => starte('mix')}>
            {pool.length ? `Runde starten (${Math.min(pool.length, anzahl)} von ${pool.length} Aufgaben)` : 'Erst Themen ankreuzen'}
          </button>
          {wahl.size > 0 && <button type="button" className="ghost" onClick={() => setWahl(new Set())}>Auswahl leeren</button>}
        </div>
      </div>

      <div className="card wissen__schwach">
        <div>
          <h2>Meine Schwachstellen</h2>
          <p className="muted">{schwach.length
            ? `${schwach.length} Aufgaben mit offenen Fehlern aus allen Fachgebieten, gemischt in einer Runde.`
            : 'Gerade keine offenen Fehler im Wissenstrainer. Falsch gelöste Aufgaben sammeln sich hier und im Fehlerheft.'}</p>
        </div>
        <div className="row">
          <button type="button" className="primary" disabled={!schwach.length} onClick={() => starte('schwach')}>Schwachstellen üben</button>
          <a className="button-link ghost" href="#/lernen/fehler">Zum Fehlerheft</a>
        </div>
      </div>

      <div className="card wissen__spiel">
        <div>
          <h2>Spielmodus: Fachbegriff-Duell</h2>
          <p className="muted">Fachbegriffe gegen die Uhr, nach Thema oder quer durch alles. Gut für zwischendurch.</p>
        </div>
        <div><a className="button-link" href="#/lernen/duell">Duell starten</a></div>
      </div>
    </section>
  );
}

export default function WissenSeite() {
  const { params } = useRoute();
  const fach = params.get('fach');
  if (istFach(fach)) return <FachSeite fach={FACH[fach]} />;
  if ((fach === 'mix' || fach === 'schwach') && params.get('runde') === '1') return <GemischteRunde key={rundenSchluessel(params)} />;
  return <Uebersicht />;
}
