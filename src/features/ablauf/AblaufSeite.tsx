import { useEffect, useMemo, useRef, useState } from 'react';
import './ablauf.css';
import { PageHeading } from '../../ui/PageHeading';
import { AuswertungsKarte } from '../../ui/sim/AuswertungsKarte';
import type { SimAuswertung } from '../../ui/sim/auswertung';
import { navigate, useRoute } from '../../ui/shell/router';
import { bucheErgebnis, buchungsText } from '../lernplan/ergebnis';
import {
  auswerten, bewerteSuche, fehlerVersion, fertig, optionen, START, waehle, zufallAus,
  type FehlerVersion, type Option, type Rueckmeldung, type Stand, type SuchErgebnis,
} from './ablauf';
import { ABLAEUFE, ABLAUF, type Ablauf } from './inhalt';

type Modus = 'durchfuehren' | 'fehler';
const neuerSeed = () => Math.floor(Math.random() * 2 ** 31);

async function buche(a: Ablauf, modus: Modus, seed: number, prozent: number, max: number, kriterien: Array<{ id: string; label: string; erfuellt: boolean }>): Promise<string> {
  try {
    return buchungsText(await bucheErgebnis({
      versuchId: `ablauf:${a.id}:${modus}:${seed}`,
      herkunft: { modul: 'ablauf', ref: `${a.id}-${modus}`, kriterien },
      status: 'abgeschlossen', aussagekraft: 'anwendung',
      ergebnisse: a.topicIds.map((topicId) => ({ topicId, scorePercent: prozent, anzahl: Math.max(1, max) })),
    }));
  } catch { return 'Lernplan gerade nicht erreichbar.'; }
}

// ---------------------------------------------------------------- Durchführen

function Durchfuehren({ a, seed, neu }: { a: Ablauf; seed: number; neu: () => void }) {
  const zufall = useMemo(() => zufallAus(seed), [seed]);
  const [stand, setStand] = useState<Stand>(START);
  const [rueck, setRueck] = useState<Rueckmeldung | null>(null);
  const [opts, setOpts] = useState<Option[]>(() => optionen(a, START, zufall));
  const [buchung, setBuchung] = useState('');
  const kopf = useRef<HTMLHeadingElement>(null);
  const ende = fertig(a, stand);

  useEffect(() => {
    if (!ende) return;
    const e = auswerten(a, stand);
    void buche(a, 'durchfuehren', seed, e.prozent, e.max, a.schritte.map((s, i) => ({ id: s.id, label: s.text, erfuellt: !stand.fehlgriffe.some((f) => f.position === i) }))).then(setBuchung);
  }, [ende]);

  const klick = (o: Option) => {
    const r = waehle(a, stand, o);
    setStand(r.stand);
    setRueck(r.rueckmeldung);
    if (!fertig(a, r.stand)) setOpts(optionen(a, r.stand, zufall));
    requestAnimationFrame(() => kopf.current?.focus());
  };
  const weiter = () => { setRueck(null); };

  if (ende && !rueck) return <DurchfuehrenErgebnis a={a} stand={stand} buchung={buchung} neu={neu} />;
  const nr = stand.erledigt.length + 1;
  return (
    <div className="stack-3">
      <section className="card stack-2" aria-labelledby="ab-lage">
        <h2 id="ab-lage">Lage</h2>
        <p>{a.lage}</p>
        <details><summary>Material</summary><ul>{a.material.map((m) => <li key={m}>{m}</li>)}</ul></details>
      </section>
      {stand.erledigt.length > 0 && (
        <section aria-labelledby="ab-bisher">
          <h2 id="ab-bisher" className="ablauf__klein-h">Bisher erledigt</h2>
          <ol className="ablauf__bisher">{stand.erledigt.map((id) => <li key={id}>{a.schritte.find((s) => s.id === id)!.text}</li>)}</ol>
        </section>
      )}
      <section className="card stack-2" aria-labelledby="ab-frage">
        <h2 id="ab-frage" ref={kopf} tabIndex={-1}>{ende ? 'Geschafft' : `Schritt ${nr} von ${a.schritte.length}: Was tust du jetzt?`}</h2>
        <progress max={a.schritte.length} value={stand.erledigt.length} aria-label="Fortschritt im Ablauf" className="ablauf__fortschritt" />
        {rueck && (
          <div className={`note ${rueck.richtig ? '' : 'warn'} ablauf__rueck`} role="status">
            <p><strong>{rueck.richtig ? '✓' : '✗'} {rueck.titel}.</strong> {rueck.text}</p>
            {rueck.folge && <p><strong>Mögliche Folge:</strong> {rueck.folge}</p>}
            <button type="button" className="primary small" onClick={weiter}>{ende ? 'Zur Auswertung' : rueck.richtig ? 'Weiter' : 'Noch einmal wählen'}</button>
          </div>
        )}
        {!rueck && !ende && (
          <ul className="ablauf__optionen">
            {opts.map((o) => <li key={o.id}><button type="button" className="ablauf__option" onClick={() => klick(o)}>{o.text}</button></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

function DurchfuehrenErgebnis({ a, stand, buchung, neu }: { a: Ablauf; stand: Stand; buchung: string; neu: () => void }) {
  const e = auswerten(a, stand);
  const fehlerPositionen = new Set(stand.fehlgriffe.map((f) => f.position));
  const auswertung: SimAuswertung = {
    quelle: 'Ablauf-Werkbank',
    ergebnis: {
      stufe: e.kritisch ? 'kritisch' : e.punkte === e.max ? 'stabil' : 'unsicher',
      text: `${e.punkte} von ${e.max} Schritten im ersten Griff richtig${e.kritisch ? `, ${e.kritisch} ${e.kritisch === 1 ? 'kritischer Fehler' : 'kritische Fehler'}` : ''}.`,
    },
    punkte: [
      ...e.liste.map((x, i) => ({ id: `f${i}`, titel: `Schritt ${x.position + 1}`, urteil: x.kritisch ? 'fehler' as const : 'teilweise' as const, deine: x.gewaehlt, besser: x.richtig, warum: x.folge ? `${x.erklaerung} Folge: ${x.folge}` : x.erklaerung })),
      ...a.schritte.filter((s) => s.kritisch).map((s) => ({ s, i: a.schritte.findIndex((x) => x.id === s.id) }))
        .filter(({ i }) => !fehlerPositionen.has(i)).map(({ s }) => ({ id: `ok-${s.id}`, titel: s.text, urteil: 'gut' as const, warum: s.warum })),
    ],
    merksaetze: a.schritte.filter((s) => s.kritisch).map((s) => s.text),
    grenzen: 'Gewertet wird die Reihenfolge der Entscheidungen, nicht die Handfertigkeit. Üb die Handgriffe mit deiner Praxisanleitung.',
  };
  return (
    <div className="stack-3">
      <AuswertungsKarte a={auswertung} />
      {buchung && <p className="muted" role="status">{buchung}</p>}
      <div className="faecher__aktionen">
        <button type="button" className="primary" onClick={neu}>Noch einmal</button>
        <button type="button" onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${a.id}&modus=fehler`)}>Fehler finden</button>
        <button type="button" className="ghost" onClick={() => navigate('/lernen/fertigkeiten?uebung=ablauf')}>Andere Abläufe</button>
      </div>
      <Quellen a={a} />
    </div>
  );
}

// ---------------------------------------------------------------- Fehler finden

function FehlerFinden({ a, seed, neu }: { a: Ablauf; seed: number; neu: () => void }) {
  const v: FehlerVersion = useMemo(() => fehlerVersion(a, zufallAus(seed)), [a, seed]);
  const [markiert, setMarkiert] = useState<Set<string>>(new Set());
  const [fehlt, setFehlt] = useState('');
  const [ergebnis, setErgebnis] = useState<SuchErgebnis | null>(null);
  const [buchung, setBuchung] = useState('');
  const schalten = (k: string) => setMarkiert((m) => { const n = new Set(m); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const pruefen = () => {
    const e = bewerteSuche(v, markiert, fehlt);
    setErgebnis(e);
    void buche(a, 'fehler', seed, e.prozent, e.max, [
      ...v.zeilen.filter((z) => z.fehler).map((z) => ({ id: z.key, label: z.text, erfuellt: markiert.has(z.key) })),
      { id: 'fehlt', label: 'Fehlender Pflichtschritt', erfuellt: e.fehltRichtig },
    ]).then(setBuchung);
  };
  return (
    <div className="stack-3">
      <section className="card stack-2" aria-labelledby="ff-lage">
        <h2 id="ff-lage">So hat es eine Kollegin gemacht</h2>
        <p>{a.lage}</p>
        <p className="muted">Markiere jeden Schritt, der falsch ist oder an der falschen Stelle steht. Darunter: Fehlt ein Pflichtschritt?</p>
      </section>
      <ol className="ablauf__vorfuehrung">
        {v.zeilen.map((z, i) => {
          const an = markiert.has(z.key);
          const status = ergebnis ? (z.fehler ? (an || (z.fehler.art === 'tausch' && v.zeilen.some((y) => y.fehler?.art === 'tausch' && markiert.has(y.key))) ? 'gefunden' : 'uebersehen') : an ? 'falsch' : '') : '';
          return (
            <li key={z.key} className={`ablauf__zeile${an ? ' is-markiert' : ''}${status ? ` is-${status}` : ''}`}>
              <button type="button" aria-pressed={an} disabled={!!ergebnis} onClick={() => schalten(z.key)}>
                <span className="ablauf__nr" aria-hidden="true">{i + 1}</span><span>{z.text}</span>
              </button>
              {ergebnis && z.fehler && z.fehler.art === 'tausch' && v.zeilen[i - 1]?.fehler?.art === 'tausch' && <p className="ablauf__erklaerung muted">Mit dem Schritt davor vertauscht.</p>}
              {ergebnis && z.fehler && !(z.fehler.art === 'tausch' && v.zeilen[i - 1]?.fehler?.art === 'tausch') && (
                <p className="ablauf__erklaerung"><strong>{status === 'gefunden' ? '✓ Gefunden' : '✗ Übersehen'}{z.fehler.kritisch ? ', kritisch' : ''}:</strong> {z.fehler.erklaerung}{z.fehler.folge ? ` Folge: ${z.fehler.folge}` : ''}</p>
              )}
              {ergebnis && !z.fehler && an && <p className="ablauf__erklaerung"><strong>✗ Dieser Schritt war richtig.</strong> {a.schritte.find((s) => s.id === z.key)?.warum}</p>}
            </li>
          );
        })}
      </ol>
      <fieldset className="card stack-2 ablauf__fehlt" disabled={!!ergebnis}>
        <legend>Fehlt ein Pflichtschritt?</legend>
        {v.fehltOptionen.map((o) => (
          <label key={o.id} className="ablauf__radio">
            <input type="radio" name="fehlt" value={o.id} checked={fehlt === o.id} onChange={() => setFehlt(o.id)} />
            <span>{o.text}</span>
          </label>
        ))}
        {ergebnis && (
          <p className={`note ${ergebnis.fehltRichtig ? '' : 'warn'}`} role="status">
            {ergebnis.fehltRichtig ? '✓ Richtig. ' : '✗ Nicht richtig. '}
            {v.fehlt ? `Gefehlt hat: „${v.fehlt.text}“. ${v.fehlt.warum}` : 'Es fehlte kein Pflichtschritt.'}
          </p>
        )}
      </fieldset>
      {!ergebnis
        ? <button type="button" className="primary ablauf__pruefen" disabled={!fehlt} onClick={pruefen}>Prüfen</button>
        : (
          <div className="stack-2">
            <p className="note" role="status"><strong>{ergebnis.punkte} von {ergebnis.max} Punkten.</strong> {ergebnis.gefunden} Fehler gefunden, {ergebnis.uebersehen} übersehen{ergebnis.falschMarkiert.length ? `, ${ergebnis.falschMarkiert.length} richtige Schritte als falsch markiert` : ''}.</p>
            {buchung && <p className="muted">{buchung}</p>}
            <div className="faecher__aktionen">
              <button type="button" className="primary" onClick={neu}>Neue Runde</button>
              <button type="button" onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${a.id}&modus=durchfuehren`)}>Selbst durchführen</button>
              <button type="button" className="ghost" onClick={() => navigate('/lernen/fertigkeiten?uebung=ablauf')}>Andere Abläufe</button>
            </div>
            <Quellen a={a} />
          </div>
        )}
    </div>
  );
}

function Quellen({ a }: { a: Ablauf }) {
  return (
    <details className="ablauf__quellen">
      <summary>Grundlagen dieses Ablaufs</summary>
      <ul>{a.quellen.map((q) => <li key={q}>{q}</li>)}</ul>
      <p className="muted">Im Zweifel gilt der Standard deiner Einrichtung.</p>
    </details>
  );
}

// ---------------------------------------------------------------- Seite

export default function AblaufSeite() {
  const { params } = useRoute();
  const a = ABLAUF[params.get('ablauf') ?? ''];
  const modus: Modus = params.get('modus') === 'fehler' ? 'fehler' : 'durchfuehren';
  const [seed, setSeed] = useState(neuerSeed);
  const neu = () => { setSeed(neuerSeed()); window.scrollTo({ top: 0 }); };
  return (
    <section className="page ablauf">
      <PageHeading eyebrow="Praxis" title={a ? a.titel : 'Ablauf-Werkbank. Handgriffe in der richtigen Reihenfolge.'}
        description={a ? a.kurz : 'Pflegerische Abläufe Schritt für Schritt: selbst durchführen mit sofortiger Rückmeldung zu jedem Fehlgriff, oder im vorgeführten Ablauf die Fehler finden. Funktioniert offline.'} />
      {!a ? (
        <ul className="ablauf__liste">
          {ABLAEUFE.map((x) => (
            <li key={x.id} className="card stack-2">
              <h2>{x.titel}</h2>
              <p className="muted">{x.kurz}. {x.schritte.length} Schritte, {x.fallen.length} typische Fehler.</p>
              <div className="faecher__aktionen">
                <button type="button" className="primary" onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${x.id}&modus=durchfuehren`)}>Durchführen</button>
                <button type="button" onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${x.id}&modus=fehler`)}>Fehler finden</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="pills" role="group" aria-label="Modus">
            <button type="button" className="pill" aria-pressed={modus === 'durchfuehren'} onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${a.id}&modus=durchfuehren`)}>Durchführen</button>
            <button type="button" className="pill" aria-pressed={modus === 'fehler'} onClick={() => navigate(`/lernen/fertigkeiten?uebung=ablauf&ablauf=${a.id}&modus=fehler`)}>Fehler finden</button>
          </div>
          {modus === 'durchfuehren'
            ? <Durchfuehren key={`${a.id}-${seed}`} a={a} seed={seed} neu={neu} />
            : <FehlerFinden key={`${a.id}-${seed}`} a={a} seed={seed} neu={neu} />}
        </>
      )}
    </section>
  );
}
