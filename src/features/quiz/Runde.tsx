import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Ergebnisring } from '../../ui/Ergebnisring';
import './quiz.css';
import {
  alsFehler, alsTreffer, alsUnsicher, bewerte, schrittRichtig, startFolge, stufeVon, zuordnenOptionen, STUFE_LABEL,
  type Antwort, type Aufgabe, type AuswahlAufgabe, type BeschriftenAufgabe, type Bewertung, type FallAufgabe, type ReihenfolgeAufgabe, type ZuordnenAufgabe,
} from './quiz';
import { notiereFehler, type FehlerQuelle, type Sicherheit } from '../fehlerheft/fehlerheft';
import { speichereZwischenstand, type RundenErgebnisEintrag, type Zwischenstand } from './zwischenstand';
import { SkriptStellen } from '../skript/SkriptStellen';
import { proThema, type TrainerId } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import type { Grundlage, GrundlageZeile } from './grundlage';
import { storage } from '../../ui/lib/store';
import { BegriffListe, FachListe, ThemenLinks } from './FachText';
import { spiele } from '../../ui/audio/spieler';
import { Vorlesen } from '../../ui/audio/Vorlesen';
import { FrageMelden } from '../qm/FrageMelden';
import { gesperrteAufgaben } from '../qm/meldungen';
import { notiereVersuch } from '../qm/statistik';
import { fingerabdruck } from '../qm/fingerabdruck';
import { useRoute } from '../../ui/shell/router';

/** Eine Abbildung zum Beschriften: Zeichnung ohne Nummern, die Marken legt die Runde darüber. */
export interface Figur { viewBox: string; beschreibung: string; zeichnung: ReactNode }

export interface RundenErgebnis { punkte: number; max: number; prozent: number; richtig: number; anzahl: number }

interface Props {
  aufgaben: Aufgabe[];
  quelle: FehlerQuelle;
  trainer: TrainerId;
  figuren?: Record<string, Figur>;
  /** Ab so vielen Aufgaben je Thema zählt die Runde im Lernplan. */
  minProThema?: number;
  /** Quelle, Stand und Geltung je Aufgabe, nach dem Prüfen unter der Begründung. */
  grundlage?: Grundlage;
  /** Weiterführende Links nach dem Prüfen, z. B. Anatomie → Krankheitsbild und Fall. */
  weiter?: (a: Aufgabe) => Array<{ label: string; path: string }>;
  onFertig?: (e: RundenErgebnis) => void;
  onNeu: () => void;
  onEnde: () => void;
  /** Bereich und Stufe für den Zwischenstand (Fortsetzen nach Neuladen). Ohne `bereich` wird nichts gespeichert. */
  bereich?: string;
  stufe?: number;
  /** Begonnene Runde an dieser Stelle fortsetzen. */
  fortsetzen?: Zwischenstand | null;
  /** Nachübung: nur die eben falsch gelösten Aufgaben, zählt nicht im Lernplan. */
  nachuebung?: boolean;
  /** „Falsche gleich noch einmal“ am Rundenende. */
  onNachuebung?: (aufgaben: Aufgabe[]) => void;
}

/** Eigene Einschätzung vor dem Prüfen (freiwillig). */
type Gefuehl = 'sicher' | 'unsicher' | null;

/** Selbsteinschätzung gegen Ergebnis: Glückstreffer und sichere Irrtümer (Kalibrierung). */
export function sicherheitAus(gefuehl: Gefuehl, richtig: boolean): Sicherheit | undefined {
  if (gefuehl === 'unsicher' && richtig) return 'geraten';
  if (gefuehl === 'sicher' && !richtig) return 'sicherer-irrtum';
  return undefined;
}

// ---------------------------------------------------------------- Auswahl

function Auswahl({ a, wahl, setWahl, b }: { a: AuswahlAufgabe; wahl: number[]; setWahl: (w: number[]) => void; b: Bewertung | null }) {
  return (
    <fieldset className="qz__optionen" disabled={!!b}>
      <legend className="visually-hidden">{a.mehrfach ? 'Alle zutreffenden Antworten wählen' : 'Eine Antwort wählen'}</legend>
      {a.optionen.map((o, i) => {
        const an = wahl.includes(i);
        const status = b ? (a.richtig.includes(i) ? ' is-ok' : an ? ' is-falsch' : '') : '';
        return (
          <label key={o} className={`qz__option${an ? ' is-gewaehlt' : ''}${status}`}>
            <input
              type={a.mehrfach ? 'checkbox' : 'radio'} name={`qz-${a.id}`} checked={an}
              onChange={() => setWahl(a.mehrfach ? (an ? wahl.filter((x) => x !== i) : [...wahl, i]) : [i])}
            />
            <span>{o}</span>
            {b && a.richtig.includes(i) && <span className="qz__marke-text">richtig</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

// ---------------------------------------------------------------- Reihenfolge

function Reihenfolge({ a, folge, setFolge, b }: { a: ReihenfolgeAufgabe; folge: string[]; setFolge: (f: string[]) => void; b: Bewertung | null }) {
  function schiebe(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= folge.length) return;
    const n = [...folge];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setFolge(n);
  }
  return (
    <ol className="qz__folge">
      {folge.map((s, i) => {
        const status = b ? (s === a.schritte[i] ? ' is-ok' : ' is-falsch') : '';
        return (
          <li key={s} className={`qz__schritt${status}`}>
            <span className="qz__nr" aria-hidden="true">{i + 1}</span>
            <span className="qz__schritt-text">
              {s}
              {b && s !== a.schritte[i] && <span className="muted qz__soll"> Richtig an Stelle {i + 1}: {a.schritte[i]}</span>}
            </span>
            {!b && (
              <span className="qz__pfeile">
                <button type="button" className="ghost small" disabled={i === 0} aria-label={`„${s}“ nach oben`} onClick={() => schiebe(i, -1)}>↑</button>
                <button type="button" className="ghost small" disabled={i === folge.length - 1} aria-label={`„${s}“ nach unten`} onClick={() => schiebe(i, 1)}>↓</button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- Beschriften

function Beschriften({ a, figur, zu, setZu, b }: {
  a: BeschriftenAufgabe; figur: Figur | undefined; zu: Record<number, string>; setZu: (z: Record<number, string>) => void; b: Bewertung | null;
}) {
  const [aktiv, setAktiv] = useState<number | null>(null);
  const [mitText, setMitText] = useState(!figur);
  const listeRef = useRef<HTMLUListElement>(null);
  const waehle = (nr: number) => { listeRef.current?.querySelector<HTMLSelectElement>(`select[data-nr="${nr}"]`)?.focus(); setAktiv(nr); };
  const labels = useMemo(() => [...a.marken.map((m) => m.label)].sort((x, y) => x.localeCompare(y, 'de')), [a]);
  const vergeben = new Set(Object.values(zu));
  return (
    <div className="qz__beschriften">
      {figur && (
        <svg className="qz__figur" viewBox={figur.viewBox} role="img" aria-label={figur.beschreibung}>
          {figur.zeichnung}
          {a.marken.map((m, k) => {
            const status = b ? (b.teile[k] ? 'ok' : 'falsch') : zu[m.nr] ? 'belegt' : 'offen';
            return (
              <g key={m.nr} className={`qz__pin qz__pin--${status}${aktiv === m.nr ? ' is-aktiv' : ''}`} onClick={() => waehle(m.nr)}>
                <circle cx={m.x} cy={m.y} r={9} />
                <text x={m.x} y={m.y} dy="0.35em" textAnchor="middle">{m.nr}</text>
              </g>
            );
          })}
        </svg>
      )}
      {figur && (
        <label className="check qz__textweg">
          <input type="checkbox" checked={mitText} onChange={(e) => setMitText(e.target.checked)} />
          <span>Ohne Bild lösen: Lage jeder Nummer als Text zeigen</span>
        </label>
      )}
      <ul className="qz__zuordnung" ref={listeRef}>
        {a.marken.map((m, k) => (
          <li key={m.nr} className={b ? (b.teile[k] ? 'is-ok' : 'is-falsch') : ''}>
            <label onFocus={() => setAktiv(m.nr)} onBlur={() => setAktiv(null)}>
              <span className="qz__nr">{m.nr}</span>
              <select data-nr={m.nr} value={zu[m.nr] ?? ''} disabled={!!b} onChange={(e) => setZu({ ...zu, [m.nr]: e.target.value })}
                aria-label={`Nummer ${m.nr}${mitText ? `: ${m.hinweis}` : ''}`}>
                <option value="">– wählen –</option>
                {labels.map((l) => <option key={l} value={l}>{l}{vergeben.has(l) && zu[m.nr] !== l ? ' (vergeben)' : ''}</option>)}
              </select>
            </label>
            {mitText && !b && <span className="muted qz__lage">{m.hinweis}</span>}
            {b && !b.teile[k] && <span className="muted qz__soll">Richtig: {m.label}. {m.hinweis}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Zuordnen

function Zuordnen({ a, zu, setZu, b }: { a: ZuordnenAufgabe; zu: Record<number, string>; setZu: (z: Record<number, string>) => void; b: Bewertung | null }) {
  const optionen = useMemo(() => zuordnenOptionen(a), [a]);
  return (
    <ul className="qz__paare m-stagger">
      {a.paare.map((p, k) => (
        <li key={p.links} className={`qz__paar${b ? (b.teile[k] ? ' is-ok' : ' is-falsch m-shake') : zu[k] ? ' is-belegt' : ''}`}>
          <label>
            <span className="qz__paar-links">{p.links}</span>
            <select value={zu[k] ?? ''} disabled={!!b} onChange={(e) => setZu({ ...zu, [k]: e.target.value })} aria-label={`Zuordnung für ${p.links}`}>
              <option value="">– zuordnen –</option>
              {optionen.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          {b && !b.teile[k] && <span className="muted qz__soll">Richtig: {p.rechts}</span>}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Fall in Schritten

/**
 * Ein Fall entwickelt sich: Jeder Schritt wird festgelegt (zählt dann so, wie er festgelegt wurde), bekommt eine kurze
 * Rückmeldung, und erst dann erscheint die nächste Lage. Das ist Rückmeldung zum eigenen Schritt, kein Tipp vorab.
 */
function Fall({ a, wahl, setWahl, b }: { a: FallAufgabe; wahl: number[][]; setWahl: (w: number[][]) => void; b: Bewertung | null }) {
  const [entwurf, setEntwurf] = useState<number[]>([]);
  const fertig = wahl.length;
  const aktuell = a.schritte[fertig];
  function festlegen() { setWahl([...wahl, entwurf]); setEntwurf([]); }
  return (
    <div className="qz__fall">
      <p className="qz__fall-einstieg">{a.einstieg}</p>
      <ol className="qz__fall-schritte">
        {a.schritte.slice(0, fertig).map((st, k) => {
          const ok = schrittRichtig(st, wahl[k] ?? []);
          return (
            <li key={k} className={`qz__fall-schritt is-fest ${ok ? 'is-ok' : 'is-falsch'}`}>
              <p className="qz__fall-lage">{st.lage}</p>
              <p><strong>{st.frage}</strong></p>
              <p className="qz__fall-antwort">
                <span className={`tag ${ok ? 'tag--wissen-sicher' : 'tag--warning'}`}>{ok ? 'Passt' : 'Nicht ganz'}</span>{' '}
                Deine Wahl: {(wahl[k] ?? []).map((i) => st.optionen[i]).join(' · ')}
                {!ok && <> · Besser: {st.richtig.map((i) => st.optionen[i]).join(' · ')}</>}
              </p>
              <p className="muted qz__fall-warum">{st.warum}</p>
            </li>
          );
        })}
        {aktuell && !b && (
          <li key={fertig} className="qz__fall-schritt m-rise" aria-live="polite">
            <p className="qz__fall-zaehler muted">Schritt {fertig + 1} von {a.schritte.length}</p>
            <p className="qz__fall-lage">{aktuell.lage}</p>
            <fieldset className="qz__optionen">
              <legend className="qz__fall-frage">{aktuell.frage}{aktuell.mehrfach ? ' (mehrere Antworten möglich)' : ''}</legend>
              {aktuell.optionen.map((o, i) => {
                const an = entwurf.includes(i);
                return (
                  <label key={o} className={`qz__option${an ? ' is-gewaehlt' : ''}`}>
                    <input
                      type={aktuell.mehrfach ? 'checkbox' : 'radio'} name={`qz-${a.id}-${fertig}`} checked={an}
                      onChange={() => setEntwurf(aktuell.mehrfach ? (an ? entwurf.filter((x) => x !== i) : [...entwurf, i]) : [i])}
                    />
                    <span>{o}</span>
                  </label>
                );
              })}
            </fieldset>
            <button type="button" className="primary" disabled={!entwurf.length} onClick={festlegen}>
              {fertig + 1 < a.schritte.length ? 'Festlegen und weiter' : 'Festlegen'}
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------- Mehr verstehen

const OFFEN_KEY = 'lernstoff.quiz.vertiefungOffen';

/** Texte einer Aufgabe, in denen Fachbegriffe stehen können. Nach dem Prüfen ist alles sichtbar. */
function aufgabenTexte(a: Aufgabe): string[] {
  const teile = a.art === 'auswahl' ? a.optionen
    : a.art === 'reihenfolge' ? a.schritte
      : a.art === 'zuordnen' ? a.paare.flatMap((p) => [p.links, p.rechts])
        : a.art === 'fall' ? [a.einstieg, ...a.schritte.flatMap((st) => [st.lage, st.frage, ...st.optionen, st.warum])]
          : a.marken.flatMap((m) => [m.label, m.hinweis]);
  return [a.frage, ...teile, ...a.erklaerung, ...(a.vertiefung ?? [])];
}

/**
 * Wonach im Skript gesucht wird: Frage, richtige Lösung und Begründung, nicht die falschen Antworten
 * (sonst führt ein Ablenker in das Kapitel, das gerade nicht gemeint ist).
 */
export function skriptZiel(a: Aufgabe): { topicIds: string[]; texte: string[] } {
  const loesung = a.art === 'auswahl' ? a.richtig.map((i) => a.optionen[i] ?? '')
    : a.art === 'reihenfolge' ? a.schritte
      : a.art === 'zuordnen' ? a.paare.flatMap((p) => [p.links, p.rechts])
        : a.art === 'fall' ? a.schritte.flatMap((st) => [st.frage, ...st.richtig.map((i) => st.optionen[i] ?? ''), st.warum])
          : a.marken.map((m) => m.label);
  return { topicIds: a.topicIds, texte: [a.titel, a.frage, ...loesung, ...a.erklaerung] };
}

/**
 * Aufklappbare Vertiefung nach dem Prüfen: Hintergrund, Fachbegriffe der Aufgabe, Themenlinks.
 * Erst nach dem Prüfen, damit Definitionen keine Antwort vorwegnehmen. Bleibt offen, wenn man sie einmal geöffnet hat.
 */
function MehrVerstehen({ a }: { a: Aufgabe }) {
  const [offen, setOffen] = useState(() => storage.read<boolean>(OFFEN_KEY, false));
  const texte = useMemo(() => aufgabenTexte(a), [a]);
  return (
    <details
      className="qz-vertiefung" open={offen}
      onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; if (o !== offen) { setOffen(o); storage.write(OFFEN_KEY, o); } }}
    >
      <summary>Mehr verstehen</summary>
      {a.vertiefung && a.vertiefung.length > 0 && (
        <>
          <h4>Hintergrund</h4>
          <FachListe texte={a.vertiefung} className="qz-vertiefung__text" />
        </>
      )}
      <BegriffListe texte={texte} />
      <ThemenLinks topicIds={a.topicIds} />
      <p className="qz-vertiefung__beleg muted">
        Ergänzendes Lehrbuchwissen ohne Beleg aus deinem Material. Bei Abweichungen gelten der aktuelle Standard,
        dein Unterricht und die Vorgaben deiner Einrichtung.
      </p>
    </details>
  );
}

/** Quelle, Stand und Geltung der Aufgabe als kurze Tabelle (Audit: Quelle und Stand je Antwort). */
function GrundlageBox({ zeilen }: { zeilen: GrundlageZeile[] }) {
  if (!zeilen.length) return null;
  return (
    <dl className="qz-grundlage" aria-label="Grundlage dieser Aufgabe">
      {zeilen.map((z, n) => <div key={n}><dt>{z.label}</dt><dd>{z.text}</dd></div>)}
    </dl>
  );
}

// ---------------------------------------------------------------- Runde

function leereAntwort(a: Aufgabe): Antwort {
  if (a.art === 'auswahl') return { art: 'auswahl', wahl: [] };
  if (a.art === 'reihenfolge') return { art: 'reihenfolge', folge: startFolge(a.schritte) };
  if (a.art === 'zuordnen') return { art: 'zuordnen', zuordnung: {} };
  if (a.art === 'fall') return { art: 'fall', wahl: [] };
  return { art: 'beschriften', zuordnung: {} };
}

function vollstaendig(a: Aufgabe, x: Antwort): boolean {
  if (x.art === 'auswahl') return x.wahl.length > 0;
  if (x.art === 'reihenfolge') return true;
  if (x.art === 'fall') return a.art === 'fall' && x.wahl.length === a.schritte.length;
  if (x.art === 'zuordnen') return a.art === 'zuordnen' && a.paare.every((_, k) => !!x.zuordnung[k]);
  return a.art === 'beschriften' && a.marken.every((m) => !!x.zuordnung[m.nr]);
}

const ART_HINWEIS: Record<Aufgabe['art'], string> = {
  auswahl: '',
  reihenfolge: 'Mit den Pfeilen in die richtige Reihenfolge bringen.',
  beschriften: 'Jeder Nummer eine Bezeichnung zuordnen.',
  zuordnen: 'Jedem Begriff die passende Antwort zuordnen. Antworten können mehrfach vorkommen.',
  fall: 'Der Fall entwickelt sich. Jeden Schritt festlegen, dann geht es weiter.',
};

export function Runde({ aufgaben: neueAufgaben, quelle, trainer, figuren = {}, minProThema = 3, grundlage, weiter: weiterLinks, onFertig, onNeu, onEnde, bereich, stufe = 0, fortsetzen, nachuebung = false, onNachuebung }: Props) {
  // Beim Fortsetzen gelten die gespeicherten Aufgaben (mit ihrer gemischten Reihenfolge)
  const [aufgaben] = useState<Aufgabe[]>(() => fortsetzen?.aufgaben ?? neueAufgaben);
  const start = fortsetzen?.ergebnisse.length ?? 0;
  const [i, setI] = useState(start);
  const [antwort, setAntwort] = useState<Antwort>(() => leereAntwort(aufgaben[start] ?? aufgaben[0]!));
  const [ergebnisse, setErgebnisse] = useState<Array<{ a: Aufgabe; b: Bewertung; sicherheit?: Sicherheit }>>(
    () => (fortsetzen?.ergebnisse ?? []).flatMap((e, k) => (aufgaben[k]?.id === e.id ? [{ a: aufgaben[k]!, b: e.b, sicherheit: e.sicherheit }] : [])),
  );
  const [geprueft, setGeprueft] = useState<Bewertung | null>(null);
  const [gefuehl, setGefuehl] = useState<Gefuehl>(null);
  const [serie, setSerie] = useState(fortsetzen?.serie ?? 0);
  const [besteSerie, setBesteSerie] = useState(fortsetzen?.besteSerie ?? 0);
  const lernplan = useLernplanUebernahme(trainer);
  const { path } = useRoute();
  // Schutz gegen doppeltes Absenden: jede Aufgabe wird einmal bewertet, die Runde einmal abgeschlossen
  const rundeId = useRef(fortsetzen?.rundeId ?? `${quelle}:runde:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`);
  const bewertetBei = useRef(start - 1);
  const abgeschlossen = useRef(false);
  const a = aufgaben[i];
  const fertig = ergebnisse.length === aufgaben.length && !geprueft;

  function pruefen() {
    if (!a || bewertetBei.current === i) return;
    bewertetBei.current = i;
    const b = bewerte(a, antwort);
    const sicherheit = sicherheitAus(gefuehl, b.richtig);
    spiele(b.richtig ? 'richtig' : b.punkte > 0 ? 'teilweise' : 'falsch');
    setGeprueft(b);
    const alle = [...ergebnisse, { a, b, sicherheit }];
    setErgebnisse(alle);
    notiereVersuch(quelle, a, antwort, b);
    const neu = b.richtig ? serie + 1 : 0;
    const beste = Math.max(besteSerie, neu);
    setSerie(neu); setBesteSerie(beste);
    const fehler = [...alsFehler(a, antwort, quelle), ...(sicherheit === 'geraten' ? alsUnsicher(a, antwort, quelle) : [])];
    if (fehler.length) notiereFehler(fehler.map((f) => ({ ...f, ...(sicherheit ? { sicherheit } : {}), versuchId: `${rundeId.current}:${i}` })));
    // Zwischenstand nach jeder geprüften Aufgabe, damit Neuladen oder App-Wechsel nichts kosten
    if (bereich !== undefined) {
      speichereZwischenstand(quelle, alle.length < aufgaben.length ? {
        rundeId: rundeId.current, bereich, stufe, aufgaben, nachuebung,
        ergebnisse: alle.map((e): RundenErgebnisEintrag => ({ id: e.a.id, b: e.b, ...(e.sicherheit ? { sicherheit: e.sicherheit } : {}) })),
        serie: neu, besteSerie: beste, gespeichert: Date.now(),
      } : null);
    }
  }

  function weiter() {
    setGeprueft(null);
    setGefuehl(null);
    const naechste = aufgaben[i + 1];
    if (naechste) { setAntwort(leereAntwort(naechste)); setI(i + 1); return; }
    if (abgeschlossen.current) return;
    abgeschlossen.current = true;
    const punkte = ergebnisse.reduce((s, e) => s + e.b.punkte / e.b.max, 0);
    const prozent = Math.round((punkte / Math.max(1, ergebnisse.length)) * 100);
    spiele(prozent >= 90 ? 'erfolg' : 'fertig');
    if (nachuebung) return;
    onFertig?.({ punkte: ergebnisse.reduce((s, e) => s + e.b.punkte, 0), max: ergebnisse.reduce((s, e) => s + e.b.max, 0), prozent, richtig: ergebnisse.filter((e) => e.b.richtig).length, anzahl: ergebnisse.length });
    // Als fachlich falsch oder mehrdeutig gemeldete Aufgaben zählen bis zur Klärung nicht (qm/meldungen.ts)
    const gesperrt = gesperrteAufgaben();
    const zaehlen = ergebnisse.filter((e) => !gesperrt.has(`${quelle}:${e.a.id}`));
    lernplan.uebernimm(proThema(zaehlen.map((e) => alsTreffer(e.a, e.b)), minProThema), rundeId.current);
  }

  if (fertig) {
    const prozent = Math.round((ergebnisse.reduce((s, e) => s + e.b.punkte / e.b.max, 0) / ergebnisse.length) * 100);
    const falsch = ergebnisse.filter((e) => !e.b.richtig);
    const geraten = ergebnisse.filter((e) => e.sicherheit === 'geraten').length;
    const irrtum = ergebnisse.filter((e) => e.sicherheit === 'sicherer-irrtum').length;
    return (
      <div className="card qz__ende m-pop" aria-live="polite">
        <div className="qz__ende-kopf">
          <Ergebnisring prozent={prozent} />
          <div>
            <h3>{prozent >= 90 ? 'Sehr sicher' : prozent >= 70 ? 'Gut dabei' : prozent >= 50 ? 'Auf dem Weg' : 'Noch einmal üben'}</h3>
            <p className="muted">{ergebnisse.length - falsch.length} von {ergebnisse.length} Aufgaben ganz richtig. Teilpunkte zählen anteilig.</p>
            {besteSerie >= 3 && <p><span className="tag tag--wissen-sicher">Beste Serie: {besteSerie} richtig in Folge</span></p>}
          </div>
        </div>
        <ul className="qz__stufen" aria-label="Ergebnis nach Schwierigkeit">
          {([1, 2, 3] as const).map((st) => {
            const teil = ergebnisse.filter((e) => stufeVon(e.a) === st);
            if (!teil.length) return null;
            const p = Math.round((teil.reduce((x, e) => x + e.b.punkte / e.b.max, 0) / teil.length) * 100);
            return (
              <li key={st}>
                <span>{STUFE_LABEL[st]}</span>
                <span className="qz__stufen-balken" aria-hidden="true"><span style={{ transform: `scaleX(${p / 100})` }} /></span>
                <span className="muted">{p} % · {teil.length}</span>
              </li>
            );
          })}
        </ul>
        {falsch.length > 0 && (
          <>
            <h4>Noch einmal ansehen</h4>
            <ul className="qz__falsch">
              {falsch.map((e) => <li key={e.a.id}><strong>{e.a.titel}:</strong> {e.a.frage} <span className="muted">({e.b.punkte} von {e.b.max})</span></li>)}
            </ul>
            <p className="muted">Die Fehler stehen im <a href="#/lernen/fehler">Fehlerheft</a> und kommen dort in wachsenden Abständen wieder: morgen, dann nach 3, 7 und 14 Tagen.</p>
          </>
        )}
        {(geraten > 0 || irrtum > 0) && (
          <p className="note qz__kalibrierung">
            <strong>Selbsteinschätzung:</strong>{' '}
            {irrtum > 0 && <>{irrtum} {irrtum === 1 ? 'sicherer Irrtum' : 'sichere Irrtümer'} (sicher, aber falsch: genau diese lohnen das Nachlesen am meisten)</>}
            {irrtum > 0 && geraten > 0 && ' · '}
            {geraten > 0 && <>{geraten} {geraten === 1 ? 'Glückstreffer' : 'Glückstreffer'} (richtig, aber geraten: zum Festigen im Fehlerheft)</>}
          </p>
        )}
        {nachuebung
          ? <p className="muted">Nachübung: zählt nicht im Lernplan, die Wiederholung über Tage übernimmt das Fehlerheft.</p>
          : <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} leer={`Für den Lernplan braucht es mindestens ${minProThema} Aufgaben je Thema.`} />}
        <div className="row">
          {falsch.length > 0 && onNachuebung && (
            <button type="button" className="primary" onClick={() => onNachuebung(falsch.map((e) => e.a))}>Falsche gleich noch einmal ({falsch.length})</button>
          )}
          <button type="button" className={falsch.length > 0 && onNachuebung ? '' : 'primary'} onClick={onNeu}>Neue Runde</button>
          <button type="button" onClick={onEnde}>Zur Auswahl</button>
        </div>
      </div>
    );
  }
  if (!a) return null;

  const bereit = vollstaendig(a, antwort);
  return (
    <div key={a.id} className="card qz__aufgabe m-rise">
      <div className="qz__kopf">
        <span className="qz__kopf-links">
          <span className="badge badge--demo">{a.titel}</span>
          <span className={`qz__stufe qz__stufe--${stufeVon(a)}`} title="Schwierigkeit">{STUFE_LABEL[stufeVon(a)]}</span>
        </span>
        <span className="qz__kopf-rechts">
          {serie >= 2 && <span key={serie} className="qz__serie m-pop" aria-label={`${serie} richtig in Folge`}>{serie}× in Folge</span>}
          <span className="muted" aria-live="polite">Aufgabe {i + 1} von {aufgaben.length}</span>
        </span>
      </div>
      <ol className="qz__spur" aria-label={`Fortschritt: ${ergebnisse.length} von ${aufgaben.length} geprüft, ${ergebnisse.filter((e) => e.b.richtig).length} ganz richtig`}>
        {aufgaben.map((x, k) => {
          const e = ergebnisse[k];
          const st = e ? (e.b.richtig ? 'ok' : e.b.punkte > 0 ? 'teil' : 'falsch') : k === i ? 'jetzt' : 'offen';
          return <li key={x.id} className={`qz__spur-punkt is-${st}${e ? ' m-pop' : ''}`} />;
        })}
      </ol>
      <h3 className="qz__frage">{a.frage}</h3>
      {(a.art !== 'auswahl' || a.mehrfach) && <p className="muted">{a.art === 'auswahl' ? 'Mehrere Antworten können stimmen.' : ART_HINWEIS[a.art]}</p>}

      {a.art === 'auswahl' && antwort.art === 'auswahl' && (
        <Auswahl a={a} wahl={antwort.wahl} setWahl={(wahl) => setAntwort({ art: 'auswahl', wahl })} b={geprueft} />
      )}
      {a.art === 'reihenfolge' && antwort.art === 'reihenfolge' && (
        <Reihenfolge a={a} folge={antwort.folge} setFolge={(folge) => setAntwort({ art: 'reihenfolge', folge })} b={geprueft} />
      )}
      {a.art === 'zuordnen' && antwort.art === 'zuordnen' && (
        <Zuordnen a={a} zu={antwort.zuordnung} setZu={(zuordnung) => setAntwort({ art: 'zuordnen', zuordnung })} b={geprueft} />
      )}
      {a.art === 'fall' && antwort.art === 'fall' && (
        <Fall a={a} wahl={antwort.wahl} setWahl={(wahl) => setAntwort({ art: 'fall', wahl })} b={geprueft} />
      )}
      {a.art === 'beschriften' && antwort.art === 'beschriften' && (
        <Beschriften a={a} figur={figuren[a.figur]} zu={antwort.zuordnung} setZu={(zuordnung) => setAntwort({ art: 'beschriften', zuordnung })} b={geprueft} />
      )}

      {geprueft ? (
        <>
          <div className={`note qz__rueckmeldung ${geprueft.richtig ? 'ok m-pop' : 'warn m-rise'}`} role="status">
            <strong>{geprueft.richtig ? 'Richtig.' : geprueft.punkte > 0 ? `Teilweise richtig: ${geprueft.punkte} von ${geprueft.max}.` : 'Leider falsch.'}</strong>
            <FachListe texte={a.erklaerung} className="qz__erklaerung" />
            {ergebnisse[i]?.sicherheit === 'sicherer-irrtum' && <p className="qz__sicherheit">Du warst dir sicher. Solche Irrtümer bleiben besonders gut hängen, wenn du die Begründung jetzt genau liest. Die Aufgabe kommt im Fehlerheft zuerst dran.</p>}
            {ergebnisse[i]?.sicherheit === 'geraten' && <p className="qz__sicherheit">Richtig, aber geraten: Die Aufgabe kommt zum Festigen ins Fehlerheft.</p>}
          </div>
          <SkriptStellen ziel={skriptZiel(a)} />
          {grundlage && <GrundlageBox zeilen={grundlage(a)} />}
          {weiterLinks && weiterLinks(a).length > 0 && (
            <p className="qz-weiter">Weiter mit:{' '}
              {weiterLinks(a).map((x, n) => <span key={x.path}>{n > 0 && ' · '}<a href={`#${x.path}`}>{x.label}</a></span>)}
            </p>
          )}
          <MehrVerstehen a={a} />
          <FrageMelden key={`m-${a.id}`} quelle={quelle} aufgabeId={a.id} fp={fingerabdruck(a)} titel={a.titel} frage={a.frage} seite={path}
            antwort={geprueft.richtig ? 'richtig gelöst' : `${geprueft.punkte} von ${geprueft.max}`} />
          <div className="row">
            <button type="button" className="primary" onClick={weiter}>{i + 1 < aufgaben.length ? 'Weiter' : 'Auswertung'}</button>
            <Vorlesen key={`e-${a.id}`} label="Erklärung vorlesen" text={() => a.erklaerung.join(' ')} />
          </div>
        </>
      ) : (
        <div className="qz__gefuehl" role="group" aria-label="Wie sicher bist du? (freiwillig)">
          <span className="muted">Wie sicher?</span>
          <button type="button" className="small" aria-pressed={gefuehl === 'sicher'} onClick={() => setGefuehl(gefuehl === 'sicher' ? null : 'sicher')}>Sicher</button>
          <button type="button" className="small" aria-pressed={gefuehl === 'unsicher'} onClick={() => setGefuehl(gefuehl === 'unsicher' ? null : 'unsicher')}>Geraten</button>
        </div>
      )}
      {!geprueft && (
        <div className="row">
          <button type="button" className="primary" disabled={!bereit} onClick={pruefen}>Prüfen</button>
          <button type="button" className="ghost" onClick={onEnde}>Abbrechen</button>
          <Vorlesen key={`f-${a.id}`} label="Frage vorlesen" text={() => [a.frage, ...(a.art === 'auswahl' ? a.optionen.map((o, n) => `${n + 1}: ${o}`) : [])].join('. ')} />
        </div>
      )}
    </div>
  );
}
