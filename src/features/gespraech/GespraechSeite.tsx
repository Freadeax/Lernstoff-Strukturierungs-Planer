import { useEffect, useRef, useState } from 'react';
import './gespraech.css';
import { getApiKey } from '../../core/settings';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { PageHeading } from '../../ui/PageHeading';
import { personenbezug } from '../../ui/lib/personenbezug';
import { AuswertungsKarte } from '../../ui/sim/AuswertungsKarte';
import type { SimAuswertung } from '../../ui/sim/auswertung';
import { navigate, useRoute } from '../../ui/shell/router';
import { bucheErgebnis, buchungsText } from '../lernplan/ergebnis';
import { useDiktat } from '../uebergabe/diktat';
import { DiktatFrage } from '../uebergabe/DiktatFrage';
import { DIALOG, DIALOGE, STIMMUNG_LABEL, TECHNIK, type Dialog } from './dialoge';
import { antworte, auswertung, ergebnis, fertig, knotenVon, MAX_ZEICHEN, MAX_ZUEGE, reihenfolge, starte, type Lauf, type Nachricht } from './gespraech';

type Modus = 'fest' | 'frei';
const pfad = (d: string, m: Modus) => `/lernen/gespraech?dialog=${d}&modus=${m}`;

// ---------------------------------------------------------------- Feste Dialoge

function Fest({ d, neu }: { d: Dialog; neu: () => void }) {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [lauf, setLauf] = useState<Lauf>(() => starte(d));
  const [letzte, setLetzte] = useState<{ text: string; warum: string; urteil: string; technik: string } | null>(null);
  const [buchung, setBuchung] = useState('');
  const kopf = useRef<HTMLHeadingElement>(null);
  const ende = fertig(lauf);

  useEffect(() => {
    if (!ende) return;
    const e = ergebnis(lauf);
    bucheErgebnis({
      versuchId: `gespraech:${d.id}:${seed}`, herkunft: { modul: 'gespraech', ref: d.id }, status: 'abgeschlossen', aussagekraft: 'anwendung',
      ergebnisse: d.topicIds.map((topicId) => ({ topicId, scorePercent: e.prozent, anzahl: Math.max(1, e.schritte.length) })),
    }).then((b) => setBuchung(buchungsText(b)), () => setBuchung('Lernplan gerade nicht erreichbar.'));
  }, [ende]); // eslint-disable-line react-hooks/exhaustive-deps -- bewusst: läuft bewusst nur, wenn sich die genannten Werte ändern (Ereignis)

  if (ende && !letzte) {
    return (
      <div className="stack-3">
        <AuswertungsKarte a={auswertung(d, ergebnis(lauf))} />
        {buchung && <p className="muted" role="status">{buchung}</p>}
        <div className="faecher__aktionen">
          <button type="button" className="primary" onClick={neu}>Noch einmal</button>
          <button type="button" onClick={() => navigate(pfad(d.id, 'frei'))}>Frei mit KI üben</button>
          <button type="button" className="ghost" onClick={() => navigate('/lernen/gespraech')}>Andere Gespräche</button>
        </div>
        <Quellen d={d} />
      </div>
    );
  }
  const k = knotenVon(d, lauf.aktuell);
  const verlauf = ergebnis(lauf).schritte;
  return (
    <div className="stack-3">
      <Lage d={d} />
      <div className="gespraech__anzeige" aria-label={`Vertrauen ${lauf.vertrauen} von 100`}>
        <span className="muted">Vertrauen</span>
        <meter min={0} max={100} low={40} high={70} optimum={100} value={lauf.vertrauen} />
        {k && <span className="tag">{STIMMUNG_LABEL[k.stimmung]}</span>}
      </div>
      <ol className="gespraech__verlauf" aria-label="Bisheriges Gespräch">
        {verlauf.map((s, i) => (
          <li key={i} className="stack-1">
            <p className="gespraech__blase gespraech__blase--sie"><span className="gespraech__wer">{d.gegenueber.split(',')[0]}</span>{s.knoten.sagt}</p>
            <p className="gespraech__blase gespraech__blase--ich"><span className="gespraech__wer">Du</span>{s.antwort.text}</p>
          </li>
        ))}
      </ol>
      {letzte && (
        <div className={`note ${letzte.urteil === 'gut' ? '' : 'warn'} gespraech__rueck`} role="status">
          <p><strong>{letzte.urteil === 'gut' ? '✓ Passt' : letzte.urteil === 'teilweise' ? '◐ Teilweise' : '✗ Ungünstig'} · {letzte.technik}.</strong> {letzte.warum}</p>
          <button type="button" className="primary small" onClick={() => { setLetzte(null); requestAnimationFrame(() => kopf.current?.focus()); }}>{ende ? 'Zur Auswertung' : 'Weiter'}</button>
        </div>
      )}
      {k && !letzte && (
        <section className="card stack-2" aria-labelledby="gs-frage">
          <p className="gespraech__blase gespraech__blase--sie"><span className="gespraech__wer">{d.gegenueber.split(',')[0]}</span>{k.sagt}</p>
          <h2 id="gs-frage" ref={kopf} tabIndex={-1} className="gespraech__frage">Was sagst du?</h2>
          <ul className="gespraech__optionen">
            {reihenfolge(k.antworten.length, seed, k.id).map((i) => {
              const a = k.antworten[i]!;
              return (
                <li key={i}><button type="button" className="gespraech__option" onClick={() => {
                  setLauf(antworte(lauf, i));
                  setLetzte({ text: a.text, warum: a.warum, urteil: a.urteil, technik: TECHNIK[a.technik].name });
                }}>{a.text}</button></li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Freies Gespräch mit KI

function Frei({ d, neu }: { d: Dialog; neu: () => void }) {
  const apiKey = getApiKey();
  const [verlauf, setVerlauf] = useState<Nachricht[]>([]);
  const [text, setText] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const [bewertung, setBewertung] = useState<SimAuswertung | null>(null);
  const diktat = useDiktat((s) => setText((t) => (t ? `${t} ${s}` : s).slice(0, MAX_ZEICHEN)));
  const eigene = verlauf.filter((n) => n.von === 'ich').length;
  const warn = personenbezug(text).length > 0;

  const frag = async (v: Nachricht[]) => {
    setLaedt(true); setFehler('');
    try {
      const { gegenueberSagt } = await import('./claude');
      setVerlauf([...v, { von: 'gegenueber', text: await gegenueberSagt({ apiKey, dialog: d, verlauf: v }) }]);
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
    finally { setLaedt(false); }
  };
  const senden = (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = text.trim();
    if (!t || laedt) return;
    diktat.stop();
    const v: Nachricht[] = [...verlauf, { von: 'ich', text: t.slice(0, MAX_ZEICHEN) }];
    setVerlauf(v); setText('');
    void frag(v);
  };
  const beenden = async () => {
    setLaedt(true); setFehler('');
    try { const { rueckmeldung } = await import('./claude'); setBewertung(await rueckmeldung({ apiKey, dialog: d, verlauf })); }
    catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
    finally { setLaedt(false); }
  };

  if (!apiKey) {
    return (
      <div className="stack-2">
        <Lage d={d} />
        <p className="note">Für das freie Gespräch spielt Claude die Rolle. Dafür brauchst du einen API-Schlüssel. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>
        <button type="button" className="primary" onClick={() => navigate(pfad(d.id, 'fest'))}>Ohne KI üben (feste Antworten)</button>
      </div>
    );
  }
  if (bewertung) {
    return (
      <div className="stack-3">
        <AuswertungsKarte a={bewertung} />
        <div className="faecher__aktionen">
          <button type="button" className="primary" onClick={neu}>Neues Gespräch</button>
          <button type="button" className="ghost" onClick={() => navigate('/lernen/gespraech')}>Andere Gespräche</button>
        </div>
      </div>
    );
  }
  return (
    <div className="stack-3">
      <Lage d={d} />
      <DatenHinweis art="ki" detail="Gesendet werden nur die erfundene Ausgangslage und das, was du hier schreibst." />
      {!verlauf.length && !laedt && <button type="button" className="primary gespraech__start" onClick={() => void frag([])}>Gespräch beginnen</button>}
      <ol className="gespraech__verlauf" aria-live="polite" aria-label="Gespräch">
        {verlauf.map((n, i) => (
          <li key={i}><p className={`gespraech__blase gespraech__blase--${n.von === 'ich' ? 'ich' : 'sie'}`}><span className="gespraech__wer">{n.von === 'ich' ? 'Du' : d.gegenueber.split(',')[0]}</span>{n.text}</p></li>
        ))}
        {laedt && <li className="muted" role="status">{d.gegenueber.split(',')[0]} antwortet …</li>}
      </ol>
      {fehler && <p className="note warn" role="alert">{fehler}</p>}
      {verlauf.length > 0 && eigene < MAX_ZUEGE && (
        <form className="card stack-2" onSubmit={senden}>
          <label className="field">Deine Antwort
            <textarea rows={3} maxLength={MAX_ZEICHEN} value={text} onChange={(e) => setText(e.target.value)} disabled={laedt} />
          </label>
          {warn && <p className="note warn" role="status">Bitte keine echten Namen oder Daten: Das Gespräch geht an Claude.</p>}
          {diktat.aktiv && <div className="note" role="status">Hört zu … {diktat.zwischen && <em>{diktat.zwischen}</em>}</div>}
          {diktat.fehler && <div className="note warn" role="alert">{diktat.fehler}</div>}
          <DiktatFrage diktat={diktat} />
          <div className="faecher__aktionen">
            <button type="submit" className="primary" disabled={!text.trim() || laedt}>Sagen</button>
            {diktat.moeglich && <button type="button" className={diktat.aktiv ? 'danger' : undefined} onClick={() => (diktat.aktiv ? diktat.stop() : diktat.start())}>{diktat.aktiv ? 'Diktat beenden' : 'Sprechen'}</button>}
          </div>
        </form>
      )}
      {eigene >= MAX_ZUEGE && <p className="note">Das Gespräch ist lang genug. Hol dir jetzt die Rückmeldung.</p>}
      {eigene >= 2 && <button type="button" onClick={() => void beenden()} disabled={laedt}>{laedt ? 'Bitte warten …' : 'Gespräch beenden und Rückmeldung holen'}</button>}
    </div>
  );
}

// ---------------------------------------------------------------- Teile und Seite

function Lage({ d }: { d: Dialog }) {
  return (
    <section className="card stack-1" aria-labelledby="gs-lage">
      <h2 id="gs-lage">Lage</h2>
      <p>{d.lage}</p>
      <p><strong>Dein Ziel:</strong> {d.ziel}</p>
    </section>
  );
}

function Quellen({ d }: { d: Dialog }) {
  return (
    <details className="gespraech__quellen">
      <summary>Grundlagen</summary>
      <ul>{d.quellen.map((q) => <li key={q}>{q}</li>)}</ul>
    </details>
  );
}

function Techniken() {
  return (
    <details className="card gespraech__techniken">
      <summary>Gesprächstechniken und Sperren im Überblick</summary>
      <dl>
        {Object.entries(TECHNIK).map(([id, t]) => <div key={id}><dt>{t.foerderlich ? '✓' : '✗'} {t.name}</dt><dd>{t.kurz}</dd></div>)}
      </dl>
    </details>
  );
}

export default function GespraechSeite() {
  const { params } = useRoute();
  const d = DIALOG[params.get('dialog') ?? ''];
  const modus: Modus = params.get('modus') === 'frei' ? 'frei' : 'fest';
  const [runde, setRunde] = useState(0);
  const neu = () => { setRunde((r) => r + 1); window.scrollTo({ top: 0 }); };
  return (
    <section className="page gespraech">
      <PageHeading eyebrow="Praxis" title={d ? d.titel : 'Gesprächssimulator. Schwierige Gespräche üben.'}
        description={d ? `${d.gegenueber}. ${d.kurz}.` : 'Angehörige, Ablehnung, Demenz, Angst: mit festen Antworten offline und Rückmeldung zu jeder Antwort, oder frei mit Claude in der Rolle des Gegenübers.'} />
      {!d ? (
        <>
          <ul className="gespraech__liste">
            {DIALOGE.map((x) => (
              <li key={x.id} className="card stack-2">
                <h2>{x.titel}</h2>
                <p className="muted">{x.gegenueber}. {x.kurz}.</p>
                <div className="faecher__aktionen">
                  <button type="button" className="primary" onClick={() => navigate(pfad(x.id, 'fest'))}>Mit festen Antworten</button>
                  <button type="button" onClick={() => navigate(pfad(x.id, 'frei'))}>Frei mit KI</button>
                </div>
              </li>
            ))}
          </ul>
          <Techniken />
        </>
      ) : (
        <>
          <div className="pills" role="group" aria-label="Modus">
            <button type="button" className="pill" aria-pressed={modus === 'fest'} onClick={() => navigate(pfad(d.id, 'fest'))}>Feste Antworten</button>
            <button type="button" className="pill" aria-pressed={modus === 'frei'} onClick={() => navigate(pfad(d.id, 'frei'))}>Frei mit KI</button>
          </div>
          {modus === 'fest' ? <Fest key={`${d.id}-${runde}`} d={d} neu={neu} /> : <Frei key={`${d.id}-${runde}`} d={d} neu={neu} />}
        </>
      )}
    </section>
  );
}
