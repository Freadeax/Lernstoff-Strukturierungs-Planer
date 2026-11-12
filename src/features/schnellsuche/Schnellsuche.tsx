import { Fragment, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import './schnellsuche.css';
import { getModule, modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { PageHeading } from '../../ui/PageHeading';
import { storage } from '../../ui/lib/store';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { useRoute } from '../../ui/shell/router';
import { baueBestand, type Suchbestand } from './aufbau';
import {
  ART_NAME, ARTEN, ausschnitt, EBENE_NAME, markierungen, suche, vorschlaege,
  type Art, type Ebene, type Ergebnis, type Treffer,
} from './suchkern';

// Schnellsucher für Expertenstandards: eine Eingabe, sofortige Treffer über Standards, Kriterien (S/P/E),
// Kernaussagen, Instrumente, Fachbegriffe und Trainer-Aufgaben. Offline, ohne Datenbank.

const PFAD = '/lernen/schnellsuche';
const VERLAUF_KEY = 'lernstoff.schnellsuche.verlauf';
const BEISPIELE = ['Druckgeschwür Einschätzung', 'Sturz Ergebnis', 'Schmerz Demenz', 'Kontinenzprofile', 'Braden', 'Entlassung Angehörige', '"Konsensus-Konferenz"', 'Mundpflege'];

const cache = new Map<string, Suchbestand>();
function useBestand(): Suchbestand {
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule;
  let b = cache.get(modul.id);
  if (!b) { b = baueBestand(modul); cache.set(modul.id, b); }
  return b;
}

const EBENEN: Ebene[] = ['S', 'P', 'E'];
const istEbene = (x: string | null): x is Ebene => x === 'S' || x === 'P' || x === 'E';
const istArt = (x: string | null): x is Art => !!x && (ARTEN as string[]).includes(x);

/** Suchzustand in der Adresse (teilbar, Zurück-Taste), ohne bei jedem Tastendruck einen Verlaufseintrag anzulegen. */
function schreibeAdresse(q: string, standards: string[], ebene?: Ebene, art?: Art) {
  const p = new URLSearchParams();
  if (q.trim()) p.set('q', q.trim());
  if (standards.length) p.set('s', standards.join(','));
  if (ebene) p.set('e', ebene);
  if (art) p.set('a', art);
  const s = p.toString();
  try { history.replaceState(history.state, '', `#${PFAD}${s ? `?${s}` : ''}`); } catch { /* Sandbox */ }
}

function Markiert({ text, formen }: { text: string; formen: string[] }) {
  const bereiche = markierungen(text, formen);
  if (!bereiche.length) return <>{text}</>;
  const teile: React.ReactNode[] = [];
  let pos = 0;
  bereiche.forEach(([a, b], i) => {
    if (a > pos) teile.push(<Fragment key={`t${i}`}>{text.slice(pos, a)}</Fragment>);
    teile.push(<mark key={`m${i}`}>{text.slice(a, b)}</mark>);
    pos = b;
  });
  if (pos < text.length) teile.push(<Fragment key="rest">{text.slice(pos)}</Fragment>);
  return <>{teile}</>;
}

function EbenenMarke({ t }: { t: Treffer }) {
  const d = t.dok;
  if (!d.ebene) return null;
  return <span className={`sus__ebene sus__ebene--${d.ebene.toLowerCase()}`} title={`${EBENE_NAME[d.ebene]}kriterium ${d.kriterium ?? ''}`}>{d.ebene}{d.kriterium ?? ''}</span>;
}

function TrefferKarte({ t, nr, offen, umschalten, standardName, listId }: {
  t: Treffer; nr: number; offen: boolean; umschalten: () => void; standardName: (id: string) => string; listId: string;
}) {
  const d = t.dok;
  const detailId = `${listId}-d${nr}`;
  const stds = d.standardIds.slice(0, 2).map(standardName);
  return (
    <li className={`sus__treffer card sus__treffer--${d.art}`}>
      <div className="sus__zeile">
        <span className={`tag sus__art sus__art--${d.art}`}>{ART_NAME[d.art]}</span>
        <EbenenMarke t={t} />
        {d.pfad && <span className="muted sus__pfad">{d.pfad}</span>}
        {t.guete === 'unscharf' && <span className="tag tag--warning sus__guete" title="Gefunden trotz Tippfehler">ähnlich</span>}
        {t.guete === 'synonym' && <span className="tag tag--info sus__guete" title="Über ein Synonym oder eine Abkürzung gefunden">Synonym</span>}
      </div>
      <h3 className="sus__titel">
        <button type="button" className="sus__titel-knopf" data-treffer={nr} aria-expanded={offen} aria-controls={detailId} onClick={umschalten}>
          <Markiert text={d.titel} formen={t.woerter} />
        </button>
      </h3>
      {!offen && d.text && <p className="sus__ausschnitt"><Markiert text={ausschnitt(d.text, t.woerter)} formen={t.woerter} /></p>}
      {offen && (
        <div id={detailId} className="sus__detail m-rise">
          {d.text && !d.details?.some((x) => x.text === d.text) && <p><Markiert text={d.text} formen={t.woerter} /></p>}
          {d.details?.length ? (
            <dl className="sus__dl">
              {d.details.map((x, i) => (
                <div key={i}><dt>{x.label}</dt><dd><Markiert text={x.text} formen={t.woerter} /></dd></div>
              ))}
            </dl>
          ) : null}
        </div>
      )}
      <div className="sus__fuss">
        {stds.length > 0 && <span className="muted sus__std">{stds.join(' · ')}{d.standardIds.length > 2 ? ` · +${d.standardIds.length - 2}` : ''}</span>}
        <span className="sus__aktionen">
          <button type="button" className="ghost small" aria-expanded={offen} aria-controls={detailId} onClick={umschalten}>{offen ? 'Weniger' : 'Details'}</button>
          {d.link && <a className="button-link small" href={`#${d.link}`}>Öffnen</a>}
        </span>
      </div>
    </li>
  );
}

export default function Schnellsuche() {
  const { index, standards } = useBestand();
  const { params } = useRoute();
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [stdWahl, setStdWahl] = useState<string[]>(() => (params.get('s') ?? '').split(',').filter((s) => standards.some((x) => x.id === s)));
  const [ebene, setEbene] = useState<Ebene | undefined>(() => { const e = params.get('e'); return istEbene(e) ? e : undefined; });
  const [art, setArt] = useState<Art | undefined>(() => { const a = params.get('a'); return istArt(a) ? a : undefined; });
  const [offen, setOffen] = useState<Set<string>>(new Set());
  const [verlauf, setVerlauf] = useState<string[]>(() => storage.read<string[]>(VERLAUF_KEY, []).filter((x) => typeof x === 'string').slice(0, 8));
  const eingabe = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLOListElement>(null);
  const listId = useId();

  const frage = useDeferredValue(q);
  const ergebnis: Ergebnis = useMemo(() => suche(index, frage, { standardIds: stdWahl, ebene, art }), [index, frage, stdWahl, ebene, art]);
  const name = useMemo(() => new Map(standards.map((s) => [s.id, s.kurz])), [standards]);
  const standardName = (id: string) => name.get(id) ?? id;
  const hatKriterien = index.doks.some((d) => d.art === 'kriterium');
  const aktiv = !!(frage.trim() || stdWahl.length || ebene || art);

  // Letztes Wort vervollständigen (nur am Ende der Eingabe, nicht in Anführungszeichen)
  const letztes = /(?:^|\s)([^\s"„:-][^\s":]*)$/.exec(q)?.[1] ?? '';
  const tipps = useMemo(() => (letztes.length >= 2 ? vorschlaege(index, letztes, 5) : []), [index, letztes]);

  useEffect(() => { schreibeAdresse(frage, stdWahl, ebene, art); }, [frage, stdWahl, ebene, art]);
  useEffect(() => {
    // Auf Geräten mit Maus sofort tippen können; auf dem Handy nicht ungefragt die Tastatur öffnen.
    if (typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches) eingabe.current?.focus();
  }, []);
  useEffect(() => { setOffen(new Set()); }, [frage, stdWahl, ebene, art]);

  function merke(text = q) {
    const t = text.trim();
    if (t.length < 2) return;
    const neu = [t, ...verlauf.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    setVerlauf(neu);
    storage.write(VERLAUF_KEY, neu);
  }
  function setze(text: string) { setQ(text); merke(text); eingabe.current?.focus(); }
  function ergaenze(wort: string) {
    setQ((alt) => alt.replace(/([^\s"„:-][^\s":]*)$/, wort) + ' ');
    eingabe.current?.focus();
  }
  function umschalten(id: string) {
    merke();
    setOffen((alt) => { const n = new Set(alt); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleStandard(id: string) { setStdWahl((alt) => (alt.includes(id) ? alt.filter((x) => x !== id) : [...alt, id])); }
  function zuruecksetzen() { setQ(''); setStdWahl([]); setEbene(undefined); setArt(undefined); eingabe.current?.focus(); }

  // Pfeiltasten: vom Suchfeld in die Treffer und zwischen den Treffern
  function fokus(nr: number) {
    const el = liste.current?.querySelector<HTMLButtonElement>(`[data-treffer="${nr}"]`);
    if (el) { el.focus(); el.scrollIntoView({ block: 'nearest' }); }
  }
  function tastenEingabe(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && ergebnis.treffer.length) { e.preventDefault(); fokus(0); }
    else if (e.key === 'Enter') { e.preventDefault(); merke(); if (ergebnis.treffer.length) fokus(0); }
    else if (e.key === 'Escape' && q) { e.preventDefault(); setQ(''); }
    else if (e.key === 'Tab' && !e.shiftKey && tipps.length && letztes && document.activeElement === eingabe.current && q.endsWith(letztes)) { e.preventDefault(); ergaenze(tipps[0]!); }
  }
  function tastenListe(e: React.KeyboardEvent<HTMLOListElement>) {
    const nr = Number((e.target as HTMLElement).dataset.treffer);
    if (Number.isNaN(nr)) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); fokus(Math.min(nr + 1, ergebnis.treffer.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (nr === 0) eingabe.current?.focus(); else fokus(nr - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); eingabe.current?.focus(); }
  }

  const facS = ergebnis.facetten.standard;
  const sichtbareStandards = aktiv && frage.trim() ? standards.filter((s) => facS.get(s.id) || stdWahl.includes(s.id)) : standards;

  return (
    <section className="page sus">
      <PageHeading eyebrow="Expertenstandards" title="Schnellsucher"
        description="Ein Suchfeld für alle Expertenstandards: Kriterien nach Struktur, Prozess und Ergebnis, Kernaussagen, Instrumente, Fachbegriffe und passende Übungen. Versteht Tippfehler, Synonyme und Abkürzungen. Funktioniert offline." />

      <form role="search" className="sus__suche card" onSubmit={(e) => { e.preventDefault(); merke(); }}>
        <label htmlFor={`${listId}-q`} className="sus__label">Suchen in Expertenstandards</label>
        <div className="sus__feld">
          <input ref={eingabe} id={`${listId}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tastenEingabe}
            placeholder="z. B. Druckgeschwür, Sturz P3, Schmerz Demenz, Braden" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="search"
            aria-describedby={`${listId}-status`} />
          {aktiv && <button type="button" className="ghost small" onClick={zuruecksetzen}>Leeren</button>}
        </div>
        {tipps.length > 0 && (
          <div className="sus__tipps" aria-label="Wortvorschläge">
            {tipps.map((t) => <button type="button" key={t} className="pill" onClick={() => ergaenze(t)}>{t}</button>)}
          </div>
        )}

        <div className="sus__filter">
          {hatKriterien && (
            <div className="pills" role="group" aria-label="Ebene">
              {EBENEN.map((e) => (
                <button type="button" key={e} className="pill" aria-pressed={ebene === e} onClick={() => setEbene(ebene === e ? undefined : e)}>
                  {EBENE_NAME[e]}{aktiv && <span className="pill__count">{ergebnis.facetten.ebene.get(e) ?? 0}</span>}
                </button>
              ))}
            </div>
          )}
          <div className="pills" role="group" aria-label="Art des Eintrags">
            {ARTEN.filter((a) => index.doks.some((d) => d.art === a)).map((a) => (
              <button type="button" key={a} className="pill" aria-pressed={art === a} onClick={() => setArt(art === a ? undefined : a)}>
                {ART_NAME[a]}{aktiv && <span className="pill__count">{ergebnis.facetten.art.get(a) ?? 0}</span>}
              </button>
            ))}
          </div>
        </div>
        <details className="sus__hilfe">
          <summary>So suchst du gezielt</summary>
          <ul>
            <li><b>Mehrere Wörter</b> müssen alle vorkommen. Gibt es dafür nichts, zeigt der Sucher Teiltreffer.</li>
            <li><b>„Wörter in Anführungszeichen“</b> sucht genau diese Wortfolge.</li>
            <li><b>-wort</b> schließt aus, z. B. <code>Schmerz -Demenz</code>.</li>
            <li><b>S1 bis E6</b> springt zur Ebene eines Kriteriums, z. B. <code>Sturz P3</code>; <b>k3</b> zeigt alle drei Ebenen von Kriterium 3.</li>
            <li><b>Tab</b> übernimmt den ersten Wortvorschlag, <b>Pfeiltasten</b> wandern durch die Treffer, <b>Esc</b> leert.</li>
          </ul>
        </details>
      </form>

      <div className="sus__layout">
        <aside className="sus__seite" aria-label="Standards">
          <h2 className="sus__h2">Standards</h2>
          <ul className="sus__standards">
            {sichtbareStandards.map((s) => (
              <li key={s.id}>
                <button type="button" className="sus__standard" aria-pressed={stdWahl.includes(s.id)} onClick={() => toggleStandard(s.id)}
                  title={s.name}>
                  <span className="sus__standard-name">{s.kurz}</span>
                  <span className="muted sus__standard-info">{aktiv && frage.trim() ? `${facS.get(s.id) ?? 0} Treffer` : (s.details ?? '').replace(/\.$/, '')}{s.ungeprueft ? ' · ungeprüft' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="sus__haupt">
          <p id={`${listId}-status`} className="sus__status" role="status" aria-live="polite">
            {aktiv ? (
              ergebnis.gesamt
                ? <>{ergebnis.gesamt} {ergebnis.gesamt === 1 ? 'Treffer' : 'Treffer'}{ergebnis.gesamt > ergebnis.treffer.length ? `, die besten ${ergebnis.treffer.length}` : ''}{ergebnis.teilweise ? '. Nicht alle Begriffe gefunden, das sind Teiltreffer.' : ''}</>
                : <>Keine Treffer{frage.trim() ? <> für „{frage.trim()}“</> : null}.</>
            ) : <>Tippe einen Begriff oder wähle links einen Standard.</>}
          </p>
          {ergebnis.korrekturen.length > 0 && (
            <p className="sus__korrektur">
              Meintest du{' '}
              {ergebnis.korrekturen.map((k, i) => (
                <Fragment key={k.von}>{i > 0 && ', '}<button type="button" className="link" onClick={() => setze(q.replace(k.von, k.zu))}>{k.zu}</button></Fragment>
              ))}? Die Treffer berücksichtigen das schon.
            </p>
          )}
          {ergebnis.ohneTreffer.length > 0 && ergebnis.gesamt > 0 && (
            <p className="muted sus__klein">Nicht gefunden: {ergebnis.ohneTreffer.map((w) => `„${w}“`).join(', ')}</p>
          )}
          {aktiv && !ergebnis.gesamt && (stdWahl.length || ebene || art) ? (
            <button type="button" className="ghost" onClick={() => { setStdWahl([]); setEbene(undefined); setArt(undefined); }}>Filter entfernen und erneut suchen</button>
          ) : null}

          {aktiv ? (
            <ol ref={liste} className="sus__liste" aria-label="Treffer" onKeyDown={tastenListe}>
              {ergebnis.treffer.map((t, i) => (
                <TrefferKarte key={t.dok.id} t={t} nr={i} listId={listId} offen={offen.has(t.dok.id)} umschalten={() => umschalten(t.dok.id)} standardName={standardName} />
              ))}
            </ol>
          ) : (
            <div className="sus__start">
              {verlauf.length > 0 && (
                <section>
                  <h2 className="sus__h2">Zuletzt gesucht</h2>
                  <div className="pills">
                    {verlauf.map((v) => <button type="button" key={v} className="pill" onClick={() => setze(v)}>{v}</button>)}
                    <button type="button" className="ghost small" onClick={() => { setVerlauf([]); storage.write(VERLAUF_KEY, null); }}>Verlauf löschen</button>
                  </div>
                </section>
              )}
              <section>
                <h2 className="sus__h2">Beispiele</h2>
                <div className="pills">{BEISPIELE.map((b) => <button type="button" key={b} className="pill" onClick={() => setze(b)}>{b}</button>)}</div>
              </section>
              <p className="muted sus__klein">
                Durchsucht {index.doks.length} Einträge aus {standards.length} Standards{hatKriterien ? ', ihren Kriterien' : ''}, dem Expertenstandards-Trainer, dem Glossar und den Assessment-Instrumenten.
                Die Einträge fassen zusammen und ersetzen nicht den Originaltext. Maßgeblich ist die aktuelle Fassung des DNQP.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
