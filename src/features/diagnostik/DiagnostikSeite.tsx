// Diagnostik-Station (#/lernen/diagnostik): Fälle mit Labor und Bildgebung, Lernmodus „Befund lesen“
// und eigene Bildserien aus dem privaten Material-Repo.

import { useEffect, useMemo, useState } from 'react';
import { storage, istObjekt } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { BildBetrachter } from '../../ui/sim/bildgebung/BildBetrachter';
import type { Bildserie } from '../../ui/sim/bildgebung/serie';
import type { Farbsystem } from '../../ui/sim/labor/praeanalytik';
import { raumFuerZustand, raumUrl } from '../../ui/sim/raeume/katalog';
import { FAELLE, FALL_NACH_ID } from './faelle';
import { FallAnsicht } from './FallAnsicht';
import { FrageKarte } from './FrageKarte';
import { Befundung } from './Befundung';
import { starte, type Lauf } from './lauf';
import { dauerMinuten, fallSchritte, fallTyp, fallZustand, ZUSTAND_KNOPF, ZUSTAND_TEXT } from './fallstart';
import { freigabeFuer } from './freigaben';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import type { DiagnostikFall } from './typen';
import { holeSerien, materialVerbunden, verbindeMaterial } from './material';
import './diagnostik.css';

const LAUF_KEY = 'lernstoff.diagnostik.laeufe';
const FARBEN_KEY = 'lernstoff.diagnostik.farbsystem';
const LERN_KEY = 'lernstoff.diagnostik.lernmodus';

const gueltigerLauf = (v: unknown): v is Lauf => istObjekt(v) && typeof v.fallId === 'string' && typeof v.minute === 'number' && Array.isArray(v.auftraege) && Array.isArray(v.log) && istObjekt(v.flags);

function leseLaeufe(): Record<string, Lauf> {
  const roh = storage.read<Record<string, unknown>>(LAUF_KEY, {});
  return Object.fromEntries(Object.entries(roh).filter(([id, l]) => FALL_NACH_ID[id] && gueltigerLauf(l))) as Record<string, Lauf>;
}

type Modus = 'faelle' | 'lernen' | 'befundung' | 'material';

export default function DiagnostikSeite() {
  const { params: query } = useRoute();
  const fallId = query.get('fall') ?? '';
  const m = query.get('modus');
  const modus: Modus = m === 'lernen' || m === 'material' || m === 'befundung' ? m : 'faelle';
  const [laeufe, setLaeufe] = useState<Record<string, Lauf>>(leseLaeufe);
  const [farbsystem, setFarbsystemState] = useState<Farbsystem>(() => (storage.read<string>(FARBEN_KEY, 'eu') === 'iso' ? 'iso' : 'eu'));
  useEffect(() => { verbindeMaterial(); }, []);

  const setFarbsystem = (f: Farbsystem) => { setFarbsystemState(f); storage.write(FARBEN_KEY, f); };
  const setLauf = (l: Lauf) => setLaeufe((alle) => { const neu = { ...alle, [l.fallId]: l }; storage.write(LAUF_KEY, neu); return neu; });
  /** Neuer Versuch: eigener Lauf mit neuer Kennung, der alte wird ersetzt (Auswertung und Lernereignis bleiben getrennt). */
  const neuStarten = (id: string) => setLauf(starte(FALL_NACH_ID[id], (laeufe[id]?.versuch ?? (laeufe[id] ? 1 : 0)) + 1));
  const neuBeginnen = (id: string) => {
    if (fallZustand(laeufe[id]) === 'laeuft' && !window.confirm('Der laufende Versuch wird verworfen. Neu beginnen?')) return;
    neuStarten(id); navigate(`/lernen/diagnostik?fall=${id}`);
  };

  const fall = FALL_NACH_ID[fallId];
  if (fall) {
    const lauf = laeufe[fall.id];
    if (!lauf) return <FallStart fall={fall} starten={() => neuStarten(fall.id)} zurueck={() => navigate('/lernen/diagnostik')} />;
    return <FallAnsicht key={`${fall.id}-${lauf.id ?? ''}`} fall={fall} startReiter={lauf.beendet !== undefined ? 'auswertung' : undefined} lauf={lauf} setLauf={setLauf} zurueck={() => navigate('/lernen/diagnostik')} farbsystem={farbsystem} setFarbsystem={setFarbsystem} />;
  }

  return (
    <section className="page dx-seite">
      <div className="page__head">
        <h2>Diagnostik: Labor und Bildgebung</h2>
        <p className="muted">Blut richtig abnehmen, Befunde lesen, kritische Werte weitergeben. Röntgen und CT mit Schichten, Fenster und Lupe. Synthetische Übungsbilder offline, dazu echte Bilder mit freier Lizenz.</p>
      </div>
      <div className="pills" role="tablist" aria-label="Bereich">
        <button type="button" role="tab" className="pill" aria-selected={modus === 'faelle'} onClick={() => navigate('/lernen/diagnostik')}>Fälle</button>
        <button type="button" role="tab" className="pill" aria-selected={modus === 'lernen'} onClick={() => navigate('/lernen/diagnostik?modus=lernen')}>Befund lesen lernen</button>
        <button type="button" role="tab" className="pill" aria-selected={modus === 'befundung'} onClick={() => navigate('/lernen/diagnostik?modus=befundung')}>Röntgen systematisch</button>
        <button type="button" role="tab" className="pill" aria-selected={modus === 'material'} onClick={() => navigate('/lernen/diagnostik?modus=material')}>Eigene Bilder</button>
      </div>
      {modus === 'faelle' && <p className="muted dx-klein">Jeder Fall zeigt vor dem Start, welche Schritte er hat. Nicht jeder Fall hat Bildgebung.</p>}
      {modus === 'faelle' && (
        <ul className="dx-faelle">
          {FAELLE.map((f) => {
            const l = laeufe[f.id];
            const z = fallZustand(l);
            return (
              <li key={f.id} className="card dx-fallkarte">
                <img className="dx-fallkarte__bild" src={raumUrl(raumFuerZustand(f.raum, f.monitor?.start === 'abwesend' ? 'abwesend' : undefined))} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                <strong>{f.titel}</strong>
                <span className="muted">{f.kurz}</span>
                <span className="dx-klein muted">{f.bereich} · {fallTyp(f)} · etwa {dauerMinuten(f)} Min.</span>
                <div className="dx-zeile">
                  <FreigabeHinweis freigabe={freigabeFuer(f)} ort="chip" />
                  {z !== 'neu' && <span className={`tag ${z === 'beendet' ? 'tag--wissen-sicher' : 'tag--info'}`}>{ZUSTAND_TEXT[z]}{l?.versuch && l.versuch > 1 ? ` · Versuch ${l.versuch}` : ''}</span>}
                </div>
                <div className="dx-zeile">
                  <button type="button" className="primary" onClick={() => navigate(`/lernen/diagnostik?fall=${f.id}`)}>{ZUSTAND_KNOPF[z]}</button>
                  {z !== 'neu' && <button type="button" onClick={() => neuBeginnen(f.id)}>Neu beginnen</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {modus === 'lernen' && <Lernmodus />}
      {modus === 'befundung' && <Befundung />}
      {modus === 'material' && <EigeneBilder />}
      <p className="muted dx-klein">Fiktive Lernfälle, didaktisch vereinfacht, fachlich ungeprüft. Synthetische Bilder sind schematisch. Echte Bilder sind frei lizenzierte Vergleichsbilder (Quelle und Lizenz unter dem Bild).</p>
    </section>
  );
}

/** Vor dem Start: Falltyp, Dauer, Schritte genau dieses Falls, Lernziele und fachlicher Prüfstand. */
function FallStart({ fall, starten, zurueck }: { fall: DiagnostikFall; starten: () => void; zurueck: () => void }) {
  const p = fall.patient;
  return (
    <section className="page dx-fall dx-start" aria-labelledby="dx-start-titel">
      <div className="dx-kopf">
        <button type="button" className="dx-zurueck" onClick={zurueck}>← Alle Fälle</button>
        <h2 id="dx-start-titel">{fall.titel}</h2>
        <p className="muted">{fall.bereich} · {p.name}, {p.alter} J.</p>
      </div>
      <div className="card dx-karte">
        <dl className="dx-akte">
          <div><dt>Falltyp</dt><dd>{fallTyp(fall)}</dd></div>
          <div><dt>Dauer</dt><dd>etwa {dauerMinuten(fall)} Minuten, jederzeit unterbrechbar</dd></div>
          <div><dt>Schwerpunkte</dt><dd>{fall.kurz}</dd></div>
        </dl>
        <h3>So läuft dieser Fall</h3>
        <ol className="dx-schritte dx-schritte--fall">
          {fallSchritte(fall).map((s, i) => <li key={s}><span aria-hidden="true">{i + 1}</span> {s}</li>)}
        </ol>
        <FreigabeHinweis freigabe={freigabeFuer(fall)} ort="start" />
        <div className="dx-zeile">
          <button type="button" className="primary" onClick={starten}>Fall starten</button>
        </div>
      </div>
    </section>
  );
}

function Lernmodus() {
  const fragen = useMemo(() => FAELLE.flatMap((f) => f.fragen.map((q) => ({ q, f }))), []);
  const [stand, setStand] = useState<Record<string, { richtig: boolean; wahl: string }>>(() => storage.read(LERN_KEY, {}));
  const offen = fragen.findIndex(({ q }) => !stand[q.id]);
  const [index, setIndex] = useState(offen < 0 ? 0 : offen);
  // Zählt Neustarts, damit „Von vorn“ auch die offene Frage neu aufbaut (alte Markierungen weg).
  const [runde, setRunde] = useState(0);
  const aktuell = fragen[index];
  const richtig = Object.values(stand).filter((s) => s.richtig).length;
  const antworten = (id: string, r: boolean, wahl: string) => setStand((s) => { const n = { ...s, [id]: { richtig: r, wahl } }; storage.write(LERN_KEY, n); return n; });
  return (
    <section className="card dx-karte dx-lernen" aria-labelledby="dx-lernen">
      <h3 id="dx-lernen">Befund lesen lernen</h3>
      <p className="muted">Schritt {index + 1} von {fragen.length} · {richtig} richtig · aus „{aktuell.f.titel}“</p>
      <div className="dx-fortschritt" aria-hidden="true">{fragen.map(({ q }, i) => <i key={q.id} className={stand[q.id] ? (stand[q.id].richtig ? 'is-richtig' : 'is-falsch') : i === index ? 'is-jetzt' : ''} />)}</div>
      <FrageKarte key={`${aktuell.q.id}-${runde}`} frage={aktuell.q} fall={aktuell.f} antwort={stand[aktuell.q.id]} onAntwort={(r, w) => antworten(aktuell.q.id, r, w)} />
      <div className="dx-zeile">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Zurück</button>
        <button type="button" className="primary" disabled={index === fragen.length - 1} onClick={() => setIndex(index + 1)}>Weiter</button>
        <button type="button" onClick={() => { setStand({}); storage.write(LERN_KEY, null); setIndex(0); setRunde((r) => r + 1); }}>Von vorn</button>
      </div>
    </section>
  );
}

function EigeneBilder() {
  const [zustand, setZustand] = useState<{ laden: boolean; serien: Bildserie[]; fehler: string[]; meldung?: string }>({ laden: false, serien: [], fehler: [] });
  const [gewaehlt, setGewaehlt] = useState<string>('');
  const verbunden = materialVerbunden();
  const laden = async () => {
    setZustand({ laden: true, serien: [], fehler: [] });
    try { const r = await holeSerien(); setZustand({ laden: false, ...r }); setGewaehlt(r.serien[0]?.id ?? ''); }
    catch (e) { setZustand({ laden: false, serien: [], fehler: [], meldung: (e as Error).message }); }
  };
  const serie = zustand.serien.find((s) => s.id === gewaehlt);
  return (
    <section className="card dx-karte" aria-labelledby="dx-eigen">
      <h3 id="dx-eigen">Eigene Bilder aus dem Material-Repo</h3>
      <p className="muted">Röntgen- oder CT-Bilder, die nicht öffentlich sein dürfen (z. B. aus dem Unterricht), liegen im privaten Material-Repo im Ordner <code>bildgebung/&lt;name&gt;/</code> mit einer <code>serie.json</code> und den Bildern (PNG/JPG, CT-Schichten durchnummeriert). Sie werden nur auf diesem Gerät geladen und nie in die öffentliche App übernommen.</p>
      {!verbunden ? (
        <p>Noch nicht verbunden. <button type="button" onClick={() => navigate('/material/ablage')}>Material-Repo unter „Große Dateien“ verbinden</button></p>
      ) : (
        <button type="button" className="primary" onClick={laden} disabled={zustand.laden}>{zustand.laden ? 'Lädt …' : 'Bildserien laden'}</button>
      )}
      {zustand.meldung && <p className="dx-hinweis" role="alert">{zustand.meldung}</p>}
      {zustand.fehler.map((f) => <p key={f} className="dx-hinweis">Übersprungen: {f}</p>)}
      {!zustand.laden && verbunden && zustand.serien.length === 0 && !zustand.meldung && zustand.fehler.length === 0 && <p className="muted dx-klein">Noch keine Serien geladen oder der Ordner ist leer.</p>}
      {zustand.serien.length > 0 && (
        <>
          <label className="dx-label" htmlFor="dx-serie">Serie</label>
          <select id="dx-serie" value={gewaehlt} onChange={(e) => setGewaehlt(e.target.value)}>
            {zustand.serien.map((s) => <option key={s.id} value={s.id}>{s.titel}</option>)}
          </select>
          {serie && <BildBetrachter key={serie.id} serie={serie} sichtbareBefunde={serie.befunde.map((b) => b.id)} />}
        </>
      )}
      <details className="dx-klein">
        <summary>Aufbau einer serie.json</summary>
        <pre>{`{
  "id": "pneumonie-unterricht",
  "titel": "Pneumonie rechts (Unterricht CE 05)",
  "untersuchung": "Röntgen-Thorax p.a.",
  "quelle": {
    "modalitaet": "roentgen",
    "dateien": ["bild.jpg"],
    "herkunft": "Unterrichtsfolie CE 05, nur privat",
    "lizenz": "",
    "quelleUrl": ""
  },
  "befunde": [{ "id": "infiltrat", "x": 0.3, "y": 0.6, "r": 0.1,
    "titel": "Verschattung", "text": "rechts basal" }],
  "befundtext": "Infiltrat rechts basal."
}`}</pre>
      </details>
    </section>
  );
}
