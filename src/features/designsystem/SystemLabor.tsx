// Systemzustände zum Ansehen (Audit: Designsystem). Jede Ansicht nutzt die echten Bausteine,
// damit neue Module dieselbe Sprache sprechen: Speicher voll, Medium fehlt offline, langsames
// Gerät, fachlicher Prüfstand und eingeschränkte Bewegung. Nichts hier verändert Lerndaten.
import { useEffect, useState } from 'react';
import { useStore } from '../../ui/lib/store';
import { session, setWorkspace, wenigBewegung } from '../../ui/shell/session';
import { SkeletonLines } from '../../ui/widget/states';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import { STATUS_TEXT, type Freigabe, type PruefStatus } from '../../ui/sim/freigabe';
import { OFFLINE_LABEL, type OfflineStufe } from '../../ui/sim/offline';
import '../../ui/sim/offline.css';
import './systemlabor.css';

type Zustand = 'speicher' | 'offline' | 'langsam' | 'pruefstand' | 'bewegung';
const ZUSTAENDE: Array<[Zustand, string]> = [['speicher', 'Speicher voll'], ['offline', 'Offline-Medium'], ['langsam', 'Langsames Gerät'], ['pruefstand', 'Prüfstand'], ['bewegung', 'Wenig Bewegung']];

const mb = (bytes: number) => `${(bytes / 1048576).toLocaleString('de-DE', { maximumFractionDigits: bytes < 10485760 ? 1 : 0 })} MB`;

/** Belegter Speicher dieses Browsers, soweit er ihn nennt. */
function Speicher() {
  const [s, setS] = useState<{ belegt: number; frei: number } | null | 'unbekannt'>(null);
  useEffect(() => {
    let aktiv = true;
    (navigator.storage?.estimate?.() ?? Promise.reject(new Error('nicht verfügbar')))
      .then((e) => { if (aktiv) setS(e.quota ? { belegt: e.usage ?? 0, frei: e.quota } : 'unbekannt'); })
      .catch(() => { if (aktiv) setS('unbekannt'); });
    return () => { aktiv = false; };
  }, []);
  return (
    <>
      <p className="note warn" role="note"><strong>Speichern auf diesem Gerät nicht möglich.</strong> Dein Stand bleibt in diesem Fenster erhalten, bis du es schließt. Erstelle jetzt eine Sicherung oder gib Speicher frei. <a href="#/system/sicherung">Zur Datensicherung</a></p>
      <p className="muted">So sieht die Meldung aus, wenn der Browser nichts mehr speichern kann (voller Speicher oder privater Modus). Regel: nie still scheitern, immer sagen, was erhalten bleibt und was der nächste Schritt ist.</p>
      {s && s !== 'unbekannt' && (
        <div className="ds-speicher">
          <div className="ds-speicher__balken" role="img" aria-label={`${mb(s.belegt)} von ${mb(s.frei)} belegt`}><span style={{ width: `${Math.max(1, Math.min(100, (s.belegt / s.frei) * 100))}%` }} /></div>
          <span>Dieses Gerät gerade: {mb(s.belegt)} von {mb(s.frei)} belegt.</span>
        </div>
      )}
      {s === 'unbekannt' && <p className="muted">Dieser Browser nennt seinen Speicherstand nicht.</p>}
    </>
  );
}

const STUFEN: OfflineStufe[] = ['vollstaendig', 'ersatzansicht', 'online'];
const STUFE_TEXT: Record<OfflineStufe, string> = {
  vollstaendig: 'Alle Medien liegen im Gerät. Der Fall läuft ohne Netz wie mit Netz.',
  ersatzansicht: 'Fotos oder Videos fehlen. Der Fall läuft trotzdem, statt des Fotos erscheint eine Zeichnung. „Für offline laden“ holt die Medien nach.',
  online: 'Ohne Netz nicht nutzbar, zum Beispiel ein KI-Fall. Das steht schon in der Fallliste, nicht erst nach dem Start.',
};
function Offline() {
  return (
    <ul className="ds-stufen" role="list">
      {STUFEN.map((st) => <li key={st} className={`offline-paket offline-paket--${st}`}><span className="offline-paket__chip">{OFFLINE_LABEL[st]}</span><span className="offline-paket__text">{STUFE_TEXT[st]}</span></li>)}
    </ul>
  );
}

/** Verzögertes Laden nachstellen: erst Platzhalter, dann Inhalt, ohne dass das Layout springt. */
function Langsam() {
  const [lauf, setLauf] = useState(0);
  const [da, setDa] = useState(false);
  useEffect(() => { setDa(false); const t = setTimeout(() => setDa(true), 3000); return () => clearTimeout(t); }, [lauf]);
  const kerne = navigator.hardwareConcurrency;
  const ram = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (
    <>
      <div className="ds-langsam" aria-busy={!da} aria-live="polite">
        {da ? <p><strong>Inhalt ist da.</strong> Die Fläche war vorher genauso hoch, nichts ist gesprungen.</p> : <SkeletonLines lines={2} />}
      </div>
      <button type="button" className="small" onClick={() => setLauf((n) => n + 1)}>Nochmal (3 Sekunden)</button>
      <p className="muted">Regel: nach 300 ms Platzhalter in der späteren Größe zeigen, Bedienung nie sperren, schwere Teile (PDF, Bilderkennung, Simulator) erst beim Öffnen laden. Dieses Gerät: {kerne ? `${kerne} Rechenkerne` : 'Kerne unbekannt'}{ram ? `, etwa ${ram} GB Arbeitsspeicher` : ''}.</p>
    </>
  );
}

const beispiel = (status: PruefStatus): Freigabe => ({
  status, lernziele: ['Vitalzeichen einordnen', 'Rechtzeitig Hilfe holen'], geltung: 'Erwachsene, Normalstation, ab 1. Ausbildungsjahr', zielgruppe: 'erwachsene',
  quellen: [{ titel: 'Beispielquelle', stand: '2026' }], prueferrolle: 'Pflegefachperson mit Praxisanleitung',
  pruefung: status === 'geprueft' ? { rolle: 'Praxisanleitung (Beispiel)', datum: '2026-11-01' } : undefined,
  aenderungen: [{ datum: '2026-11-01', text: 'Beispiel angelegt' }], risiken: [], pruefpunkte: [],
});
function Pruefstand() {
  const [status, setStatus] = useState<PruefStatus>('ungeprueft');
  return (
    <>
      <div className="pills" role="group" aria-label="Prüfstand">
        {(Object.keys(STATUS_TEXT) as PruefStatus[]).map((s) => <button key={s} type="button" className="pill" aria-pressed={s === status} onClick={() => setStatus(s)}>{STATUS_TEXT[s]}</button>)}
      </div>
      <p className="muted">In Listen als Marke, vor dem Start mit Lernzielen, am Entscheidungsort als kurze Zeile:</p>
      <p><FreigabeHinweis freigabe={beispiel(status)} ort="chip" /></p>
      <FreigabeHinweis freigabe={beispiel(status)} ort="start" />
      <FreigabeHinweis freigabe={beispiel(status)} ort="entscheidung" />
    </>
  );
}

function Bewegung() {
  const bewegung = useStore(session, (s) => s.bewegung);
  const [lauf, setLauf] = useState(0);
  const wenig = wenigBewegung();
  return (
    <>
      <p role="status"><strong>{wenig ? 'Bewegung ist reduziert.' : 'Bewegung ist an.'}</strong> {bewegung === 'reduziert' ? 'Grund: Einstellung in der App.' : wenig ? 'Grund: Einstellung des Geräts.' : 'Die App folgt der Einstellung des Geräts.'}</p>
      <div className="pills" role="group" aria-label="Bewegung in der App">
        <button type="button" className="pill" aria-pressed={bewegung === 'system'} onClick={() => { setWorkspace({ bewegung: 'system' }); setLauf((n) => n + 1); }}>wie Gerät</button>
        <button type="button" className="pill" aria-pressed={bewegung === 'reduziert'} onClick={() => { setWorkspace({ bewegung: 'reduziert' }); setLauf((n) => n + 1); }}>reduziert</button>
      </div>
      <div className="ds-motion" key={lauf}>
        <div className="m-rise"><code>.m-rise</code><span>erscheint</span></div>
        <div className="m-pop"><code>.m-pop</code><span>springt auf</span></div>
        <div className="m-shake"><code>.m-shake</code><span>Fehler</span></div>
      </div>
      <p className="muted">Regel: Reduziert heißt, Inhalte sind sofort da und nichts wackelt oder schwebt. Zustände bleiben erkennbar, weil Farbe, Symbol und Text sie tragen, nie die Bewegung allein. Simulatoren zeigen dann Standbilder statt Videos.</p>
    </>
  );
}

export function SystemLabor() {
  const [z, setZ] = useState<Zustand>('speicher');
  return (
    <div className="ds-lab">
      <div className="pills" role="group" aria-label="Systemzustand">
        {ZUSTAENDE.map(([k, l]) => <button key={k} type="button" className="pill" aria-pressed={z === k} onClick={() => setZ(k)}>{l}</button>)}
      </div>
      <div className="ds-system" key={z}>
        {z === 'speicher' && <Speicher />}
        {z === 'offline' && <Offline />}
        {z === 'langsam' && <Langsam />}
        {z === 'pruefstand' && <Pruefstand />}
        {z === 'bewegung' && <Bewegung />}
      </div>
    </div>
  );
}
