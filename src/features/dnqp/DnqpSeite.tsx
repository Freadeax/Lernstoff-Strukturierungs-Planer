import { useEffect, useMemo, useState } from 'react';
import './dnqp.css';
import { getModule, modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { GRUNDLAGEN, UEBERSICHT } from './grundlagen';
import { pruefeText, type Treffer } from './pruefung';
import { aktuelleFassung, pfadZu, STANDARDS, standardVon, STAND_UEBERSICHT } from './standards';
import { EBENE_LABEL, type Expertenstandard, type Kriterium, type Quelle, type Teil } from './typen';

type Ansicht = 'uebersicht' | 'vergleich' | 'zeitstrahl' | 'pruefen';
type Art = keyof typeof EBENE_LABEL;
const ARTEN: Art[] = ['S', 'P', 'E'];

const enc = encodeURIComponent;
const datum = (iso: string) => iso.split('-').reverse().join('.');

function gehe(p: { ansicht?: Ansicht } = {}) {
  navigate(p.ansicht && p.ansicht !== 'uebersicht' ? `/lernen/dnqp?ansicht=${p.ansicht}` : '/lernen/dnqp');
}

function useKatalog() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule | undefined;
  return useMemo(() => ({
    themen: new Map((modul?.topics ?? []).map((t) => [t.id, t.name])),
    ces: new Map((modul?.frameworks ?? []).flatMap((f) => f.items).map((i) => [i.id, `${i.code} ${i.name}`])),
  }), [modul]);
}

function QuellenZeile({ q }: { q: Quelle }) {
  return (
    <p className="muted dnqp__klein">
      Quelle: <a href={q.url} target="_blank" rel="noopener noreferrer">{q.titel}</a>
      {' · '}{q.art === 'auszug' ? 'frei zugänglicher Auszug' : 'nur Sekundärquelle'}, gelesen am {datum(q.geprueftAm)}
    </p>
  );
}

function StatusTag({ s }: { s: Expertenstandard }) {
  return s.status === 'aktuell'
    ? <span className="tag tag--wissen-sicher">{aktuelleFassung(s)}</span>
    : <span className="tag tag--warning">nicht eingeführt</span>;
}

// ---------------------------------------------------------------- Übersicht

function Grundlagen() {
  return (
    <section className="card stack-2" aria-labelledby="dnqp-grundlagen">
      <h3 id="dnqp-grundlagen">DNQP und Expertenstandards: die Grundlagen</h3>
      {GRUNDLAGEN.map((g, i) => (
        <details key={g.id} className="dnqp__details" open={i === 0}>
          <summary>{g.titel}</summary>
          <ul className="dnqp__liste">{g.punkte.map((p, j) => <li key={j}>{p}</li>)}</ul>
          {g.quelle && <QuellenZeile q={g.quelle} />}
        </details>
      ))}
    </section>
  );
}

function Karten() {
  const [q, setQ] = useState('');
  const n = q.trim().toLowerCase();
  const liste = n ? STANDARDS.filter((s) => [s.titel, s.kurztitel, ...s.synonyme].some((x) => x.toLowerCase().includes(n))) : STANDARDS;
  return (
    <section className="stack-2" aria-labelledby="dnqp-alle">
      <div className="dnqp__kopf">
        <h3 id="dnqp-alle">Alle Expertenstandards</h3>
        <input type="search" className="dnqp__suche" placeholder="Filtern, z. B. Sturz, IAD, Schmerz" aria-label="Standards filtern" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="dnqp__karten">
        {liste.map((s) => (
          <li key={s.id}>
            <button type="button" className="card dnqp__karte" onClick={() => navigate(pfadZu(s.id))}>
              <strong>{s.kurztitel}</strong>
              <span className="muted dnqp__klein">{s.titel}</span>
              <span className="dnqp__karte-tags">
                <StatusTag s={s} />
                {s.kriterien.length > 0 && <span className="tag">{s.kriterien.length} Ebenen</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!liste.length && <p className="muted">Kein Standard passt zu „{q}“.</p>}
      <QuellenZeile q={UEBERSICHT} />
    </section>
  );
}

/** Ebenen aller Standards nebeneinander: zeigt, dass alle dem Pflegeprozess folgen. */
function Vergleich() {
  const aktuell = STANDARDS.filter((s) => s.kriterien.length);
  const max = Math.max(...aktuell.map((s) => s.kriterien.length));
  return (
    <section className="card stack-2" aria-labelledby="dnqp-vergleich">
      <h3 id="dnqp-vergleich">Ebenen im Vergleich</h3>
      <p className="muted">Jede Zeile ist ein Standard, jede Spalte eine Ebene. Fast alle beginnen mit der Einschätzung, planen dann, beraten, setzen um und enden mit der Evaluation – genau die Schritte des Pflegeprozesses.</p>
      <div className="dnqp__tabelle-rahmen" tabIndex={0} role="region" aria-label="Ebenen aller Standards">
        <table className="dnqp__tabelle">
          <thead><tr><th scope="col">Standard</th>{Array.from({ length: max }, (_, i) => <th key={i} scope="col">Ebene {i + 1}</th>)}</tr></thead>
          <tbody>
            {aktuell.map((s) => (
              <tr key={s.id}>
                <th scope="row"><button type="button" className="link" onClick={() => navigate(pfadZu(s.id))}>{s.kurztitel}</button></th>
                {Array.from({ length: max }, (_, i) => {
                  const k = s.kriterien[i];
                  return <td key={i}>{k ? <button type="button" className="link" onClick={() => navigate(pfadZu(s.id, k.id))}>{k.thema}</button> : '–'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Zeitstrahl() {
  const punkte = STANDARDS.flatMap((s) => s.fassungen.map((f) => ({ s, f }))).sort((a, b) => a.f.jahr - b.f.jahr || a.s.kurztitel.localeCompare(b.s.kurztitel));
  return (
    <section className="card stack-2" aria-labelledby="dnqp-zeit">
      <h3 id="dnqp-zeit">Zeitstrahl aller Fassungen</h3>
      <p className="muted">Lehrbücher zitieren oft ältere Fassungen. Maßgeblich ist immer die jüngste Fassung je Standard (fett).</p>
      <ol className="dnqp__zeit">
        {punkte.map(({ s, f }, i) => {
          const aktuell = s.status === 'aktuell' && s.fassungen[s.fassungen.length - 1] === f;
          return (
            <li key={i} className={aktuell ? 'is-aktuell' : ''}>
              <span className="dnqp__jahr">{f.jahr}</span>
              <span>
                <button type="button" className="link" onClick={() => navigate(pfadZu(s.id))}>{s.kurztitel}</button>: {f.art}
                {f.hinweis && <span className="muted"> – {f.hinweis}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- Prüfen

function Pruefen() {
  const [text, setText] = useState('');
  const treffer = useMemo(() => (text.trim() ? pruefeText(text) : []), [text]);
  return (
    <section className="card stack-2" aria-labelledby="dnqp-pruefen">
      <h3 id="dnqp-pruefen">Text gegen die Expertenstandards prüfen</h3>
      <p className="muted">Füge eine Mitschrift, Zusammenfassung oder Lehrbuchstelle ein. Die Prüfung sucht nach Aussagen, die zu den aktuellen Fassungen nicht mehr passen (z. B. veraltete Titel, feste Lagerungsintervalle, falsche Fristen). Alles bleibt auf deinem Gerät.</p>
      <textarea className="dnqp__eingabe" rows={8} value={text} onChange={(e) => setText(e.target.value)} aria-label="Zu prüfender Text" placeholder="z. B. „Nach dem Expertenstandard muss alle 2 Stunden umgelagert werden.“" />
      {text.trim() && !treffer.length && <p className="note">Keine bekannten Fehlvorstellungen gefunden. Das heißt nicht, dass alles stimmt: Die Prüfung kennt nur die hinterlegten Muster.</p>}
      {treffer.length > 0 && <TrefferListe treffer={treffer} />}
    </section>
  );
}

function TrefferListe({ treffer }: { treffer: Treffer[] }) {
  return (
    <ul className="dnqp__treffer">
      {treffer.map((t, i) => (
        <li key={i} className={`card stack-1 ${t.wirktRichtiggestellt ? 'is-hinweis' : 'is-warnung'}`}>
          <span className="muted dnqp__klein">{t.standard} · {t.wirktRichtiggestellt ? 'wirkt schon richtiggestellt, bitte prüfen' : 'wahrscheinlich veraltet oder falsch'}</span>
          <blockquote className="dnqp__zitat">{t.satz}</blockquote>
          <p><strong>Richtig:</strong> {t.fehlvorstellung.richtig}</p>
          <p className="muted dnqp__klein">Beleg: {t.fehlvorstellung.beleg} · <button type="button" className="link" onClick={() => navigate(pfadZu(t.standardId))}>Standard öffnen</button></p>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Detail

function TeilText({ t, abdecken }: { t: Teil; abdecken: boolean }) {
  const [offen, setOffen] = useState(false);
  if (abdecken && !offen) {
    return <button type="button" className="ghost small dnqp__aufdecken" onClick={() => setOffen(true)}>{t.id} aufdecken</button>;
  }
  return <p className="dnqp__teil"><span className="dnqp__kennung">{t.id}</span> {t.text}</p>;
}

function KriteriumKarte({ s, k, aktiv, arten, abdecken }: { s: Expertenstandard; k: Kriterium; aktiv: boolean; arten: Art[]; abdecken: boolean }) {
  const teile: Record<Art, Teil[]> = { S: k.struktur, P: k.prozess, E: k.ergebnis };
  return (
    <section id={`${s.id}:${k.id}`} className={`card stack-2 dnqp__ebene${aktiv ? ' is-aktiv' : ''}`} aria-labelledby={`h-${s.id}-${k.id}`}>
      <div className="dnqp__kopf">
        <h4 id={`h-${s.id}-${k.id}`}>Ebene {k.ebene}: {k.thema}</h4>
        <button type="button" className="ghost small" onClick={() => navigate(pfadZu(s.id, k.id))} aria-label={`Link zu Ebene ${k.ebene}`}>Verlinken</button>
      </div>
      <div className="dnqp__spe">
        {arten.map((a) => (
          <div key={a} className={`dnqp__spalte dnqp__spalte--${a}`}>
            <h5>{EBENE_LABEL[a]}</h5>
            {teile[a].map((t) => <TeilText key={`${t.id}-${abdecken}`} t={t} abdecken={abdecken} />)}
          </div>
        ))}
      </div>
      {!!k.stichworte?.length && <p className="muted dnqp__klein">Stichworte: {k.stichworte.join(', ')}</p>}
    </section>
  );
}

function Detail({ s, kriterium }: { s: Expertenstandard; kriterium?: string }) {
  const { themen, ces } = useKatalog();
  const [arten, setArten] = useState<Art[]>(ARTEN);
  const [abdecken, setAbdecken] = useState(false);

  useEffect(() => {
    if (!kriterium) return;
    document.getElementById(`${s.id}:${kriterium}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [s.id, kriterium]);

  return (
    <div className="dnqp__layout">
      <article className="stack-3">
        <header className="card stack-2">
          <div className="dnqp__kopf">
            <h3 className="dnqp__titel">{s.titel}</h3>
            <StatusTag s={s} />
          </div>
          <p><strong>Zielsetzung:</strong> {s.zielsetzung}</p>
          <p><strong>Begründung:</strong> {s.begruendung}</p>
          <QuellenZeile q={s.quelle} />
          <p className="muted dnqp__klein">Sinngemäß in eigenen Worten wiedergegeben, kein Originalwortlaut. Für Prüfungen und Hausstandards immer mit der Originalveröffentlichung abgleichen.</p>
        </header>

        <section className="card stack-2" aria-labelledby="dnqp-geltung">
          <h4 id="dnqp-geltung">Für wen gilt der Standard?</h4>
          <ul className="dnqp__liste">{s.geltung.map((g, i) => <li key={i}>{g}</li>)}</ul>
          <h4>Wichtig aus der Präambel</h4>
          <ul className="dnqp__liste">{s.praeambel.map((g, i) => <li key={i}>{g}</li>)}</ul>
        </section>

        {s.kriterien.length > 0 ? (
          <>
            <div className="dnqp__werkzeug" role="group" aria-label="Kriterien anzeigen">
              <div className="pills" role="group" aria-label="Kriterienart">
                <button type="button" className="pill" aria-pressed={arten.length === 3} onClick={() => setArten(ARTEN)}>Alle</button>
                {ARTEN.map((a) => (
                  <button key={a} type="button" className="pill" aria-pressed={arten.length === 1 && arten[0] === a} onClick={() => setArten([a])}>{EBENE_LABEL[a]}</button>
                ))}
              </div>
              <label className="dnqp__schalter"><input type="checkbox" checked={abdecken} onChange={(e) => setAbdecken(e.target.checked)} /> Abdecken zum Selbsttest</label>
            </div>
            {s.kriterien.map((k) => <KriteriumKarte key={k.id} s={s} k={k} aktiv={k.id === kriterium} arten={arten} abdecken={abdecken} />)}
          </>
        ) : (
          <p className="note warn">Für diesen Standard sind keine Kriterien hinterlegt, weil kein frei zugänglicher Auszug geprüft werden konnte.</p>
        )}

        {s.fehlvorstellungen.length > 0 && (
          <section className="card stack-2" aria-labelledby="dnqp-fehler">
            <h4 id="dnqp-fehler">Häufige Fehler und veraltete Aussagen</h4>
            <ul className="dnqp__fehler">
              {s.fehlvorstellungen.map((f) => (
                <li key={f.id}>
                  <p className="dnqp__falsch"><span aria-hidden="true">✗ </span><span className="sr-only">Falsch: </span>{f.falsch}</p>
                  <p className="dnqp__richtig"><span aria-hidden="true">✓ </span><span className="sr-only">Richtig: </span>{f.richtig} <span className="muted dnqp__klein">({f.beleg})</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <aside className="dnqp__seite stack-3">
        <section className="card stack-1">
          <h4>Das Wichtigste</h4>
          <ul className="dnqp__liste">{s.merke.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </section>
        {s.kriterien.length > 0 && (
          <nav className="card stack-1" aria-label="Ebenen">
            <h4>Ebenen</h4>
            <ol className="dnqp__links">
              {s.kriterien.map((k) => <li key={k.id}><button type="button" className="link" onClick={() => navigate(pfadZu(s.id, k.id))}>{k.ebene}. {k.thema}</button></li>)}
            </ol>
          </nav>
        )}
        <section className="card stack-1">
          <h4>Fassungen</h4>
          <ol className="dnqp__links">{s.fassungen.map((f, i) => <li key={i}><strong>{f.jahr}</strong> {f.art}{f.hinweis ? <span className="muted"> – {f.hinweis}</span> : null}</li>)}</ol>
        </section>
        <section className="card stack-1">
          <h4>Im Unterricht</h4>
          <ul className="dnqp__links">
            {s.themaIds.map((t) => <li key={t}><button type="button" className="link" onClick={() => navigate(`/lernen/thema?id=${enc(t)}`)}>{themen.get(t) ?? t}</button></li>)}
            {s.ceIds.map((c) => <li key={c}><button type="button" className="link" onClick={() => navigate(`/lernen/ce?ce=${enc(c)}`)}>{ces.get(c) ?? c}</button></li>)}
          </ul>
          <p className="muted dnqp__klein">CE-Zuordnung nach Rahmenlehrplan-Inhalt, mit deinem Schulcurriculum abgleichen.</p>
          <button type="button" className="small" onClick={() => navigate('/lernen/expertenstandards')}>Im Trainer üben</button>
        </section>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- Seite

export default function DnqpSeite() {
  const { params } = useRoute();
  const standard = standardVon(params.get('standard') ?? '');
  const roh = params.get('ansicht');
  const ansicht: Ansicht = roh === 'vergleich' || roh === 'zeitstrahl' || roh === 'pruefen' ? roh : 'uebersicht';

  return (
    <section className="page dnqp">
      <div className="page__head">
        <h2>DNQP-Expertenstandards</h2>
        <p className="muted">Alle nationalen Expertenstandards in der Pflege: Aufbau, aktuelle Fassungen, Zielsetzung und jede Ebene mit Struktur-, Prozess- und Ergebniskriterien, dazu häufige Fehler und ein Prüfwerkzeug für eigene Texte. Funktioniert offline.</p>
      </div>
      <div className="pills" role="tablist" aria-label="Ansicht">
        <button type="button" role="tab" className="pill" aria-selected={!standard && ansicht === 'uebersicht'} onClick={() => gehe()}>Übersicht <span className="pill__count">{STANDARDS.length}</span></button>
        <button type="button" role="tab" className="pill" aria-selected={!standard && ansicht === 'vergleich'} onClick={() => gehe({ ansicht: 'vergleich' })}>Ebenen im Vergleich</button>
        <button type="button" role="tab" className="pill" aria-selected={!standard && ansicht === 'zeitstrahl'} onClick={() => gehe({ ansicht: 'zeitstrahl' })}>Zeitstrahl</button>
        <button type="button" role="tab" className="pill" aria-selected={!standard && ansicht === 'pruefen'} onClick={() => gehe({ ansicht: 'pruefen' })}>Text prüfen</button>
      </div>

      {standard && (
        <>
          <p><button type="button" className="link" onClick={() => gehe()}>← Alle Standards</button></p>
          <Detail key={standard.id} s={standard} kriterium={params.get('kriterium') ?? undefined} />
        </>
      )}
      {!standard && ansicht === 'uebersicht' && <><Grundlagen /><Karten /></>}
      {!standard && ansicht === 'vergleich' && <Vergleich />}
      {!standard && ansicht === 'zeitstrahl' && <Zeitstrahl />}
      {!standard && ansicht === 'pruefen' && <Pruefen />}
      <p className="muted dnqp__klein">Standardliste geprüft am {datum(STAND_UEBERSICHT)} gegen die DNQP-Übersicht. Lernhilfe, ersetzt nicht den Originalstandard und den Hausstandard deiner Einrichtung.</p>
    </section>
  );
}
